import { useState, useEffect, Fragment } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Listbox, Transition } from '@headlessui/react';
import PhoneInput from 'react-phone-input-2';
import toast from 'react-hot-toast';
import 'react-phone-input-2/lib/style.css';
import { submitPendingQuote, hasPendingQuote } from '../../utils/pendingQuote';
import { api, publicAPI } from '../../utils/api';

// Importing icons for a better UI
import { User, Phone, Mail, Lock, Globe, ChevronDown, Check, Loader2, Eye, EyeOff } from 'lucide-react';

const UserRegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    country: '',
    termsAccepted: false
  });
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialCountry, setInitialCountry] = useState('us');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/user/dashboard';
  const redirectMessage = location.state?.message;

  useEffect(() => {
    const checkExistingAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = JSON.parse(atob(token.split('.')[1]));
          if (userData.role === 'admin') {
            navigate('/admin', { replace: true });
          } else if (userData.role === 'company') {
            navigate('/company', { replace: true });
          } else if (userData.role === 'business') {
            navigate('/business', { replace: true });
          } else if (userData.role === 'user') {
            navigate('/user/dashboard', { replace: true });
          } else {
            localStorage.removeItem('token');
            setIsCheckingAuth(false);
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
          localStorage.removeItem('token');
          setIsCheckingAuth(false);
        }
      } else {
        setIsCheckingAuth(false);
      }
    };

    checkExistingAuth();
  }, [navigate]);

  useEffect(() => {
    const fetchUserCountry = async () => {
      try {
        const result = await publicAPI.getCountry();
        
        if (result.success && result.data) {
          const data = result.data;
          setInitialCountry(data.country_code.toLowerCase());
          
          if (data.country_name) {
            setFormData(prevState => ({
              ...prevState,
              country: data.country_name
            }));
          }
          
          console.log('✅ Country detected:', data.country_name, `(${data.country_code})`);
        } else {
          throw new Error('Failed to get country data');
        }
      } catch (err) {
        console.error("Could not fetch user's country:", err);
        setInitialCountry('us');
        setFormData(prevState => ({
          ...prevState,
          country: 'United States'
        }));
      }
    };

    fetchUserCountry();
  }, [navigate]);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const countryNames = await publicAPI.getCountries();
        setCountries(countryNames);
      } catch (err) {
        console.error("Failed to fetch countries:", err);
        toast.error("Could not load country list.");
      }
    };
    fetchCountries();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePhoneChange = (value) => {
    setFormData(prevState => ({
      ...prevState,
      phone: value
    }));
  };

  const handleCountryChange = (value) => {
    setFormData(prevState => ({
      ...prevState,
      country: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!formData.termsAccepted) {
      toast.error('Please accept the terms and conditions');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/user/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          country: formData.country,
          role: 'user'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.requiresApproval) {
          toast.success('Registration successful! Your account is pending admin approval.');
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        } else if (data.token) {
          localStorage.setItem('token', data.token);
          toast.success('Registration successful! Welcome!');
          
          if (hasPendingQuote()) {
            await submitPendingQuote();
          }
          
          navigate(from, { replace: true });
        } else if (data.accountStatus === 'pending_approval') {
          toast.success(data.message || 'Account created! Your account is pending admin approval.');
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        } else if (data.token) {
          localStorage.setItem('token', data.token);
          toast.success('Registration successful! Welcome!');
          navigate(from, { replace: true });
        }
      } else {
        throw new Error(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#bca142]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header
        className="h-60 bg-cover bg-center relative"
        style={{ backgroundImage: `url('/Login.jpg')` }}
      >
        <div className="container mx-auto h-full flex flex-col justify-center items-center text-white relative z-10">
          <h1 className="text-5xl font-bold tracking-tight">Create User Account</h1>
          <p className="mt-2 text-lg">
            <span>Home</span><span className="mx-2">&gt;</span><span>User Registration</span>
          </p>
        </div>
      </header>
      
      <main className="container mt-44 mx-auto px-4 py-16">
        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-xl max-w-2xl mx-auto -mt-48 relative z-20 border border-gray-100">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Create Your User Account!</h2>
          <div className="w-24 h-1.5 bg-[#bca142] rounded-full mb-4"></div>
          
          {redirectMessage && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>{redirectMessage}</strong>
              </p>
              <p className="text-xs text-blue-600 mt-1">
                User accounts are for individuals requesting quotes. Business accounts are for business entities requesting quotes. Company accounts are for logistics providers offering quotes.
              </p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            
            <InputWithIcon 
              id="name" 
              name="name" 
              type="text" 
              value={formData.name} 
              onChange={handleChange} 
              placeholder="Enter Your Full Name" 
              required={true}
              icon={<User className="w-5 h-5 text-gray-400" />} 
            />
            
            <div>
              <label htmlFor="phone" className="block text-gray-700 text-sm font-medium mb-2">Phone *</label>
              <PhoneInput
                country={initialCountry}
                value={formData.phone}
                onChange={handlePhoneChange}
                inputProps={{ name: 'phone', required: true }}
                containerClass="w-full"
                inputStyle={{ width: '100%', height: '40px', border: '1px solid #D1D5DB', color: '#4B5563' }}
                buttonClass="bg-stone-100 border-r border-stone-200 rounded-l-lg"
                dropdownClass="rounded-lg shadow-lg"
              />
            </div>

            <InputWithIcon 
              id="email" 
              name="email" 
              type="email" 
              value={formData.email} 
              onChange={handleChange} 
              placeholder="Enter Your Email" 
              required={true}
              icon={<Mail className="w-5 h-5 text-gray-400" />} 
            />

            <CustomSelect
              label="Country *"
              value={formData.country}
              onChange={handleCountryChange}
              options={countries}
              placeholder="Select a Country"
            />

            <InputWithIcon 
              id="password" 
              name="password" 
              type={showPassword ? 'text' : 'password'}
              value={formData.password} 
              onChange={handleChange} 
              placeholder="Create a Password" 
              required={true}
              icon={<Lock className="w-5 h-5 text-gray-400" />}
              showPassword={showPassword}
              togglePassword={() => setShowPassword(!showPassword)}
            />
            
            <InputWithIcon 
              id="confirmPassword" 
              name="confirmPassword" 
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword} 
              onChange={handleChange} 
              placeholder="Confirm Password" 
              required={true}
              icon={<Lock className="w-5 h-5 text-gray-400" />}
              showPassword={showConfirmPassword}
              togglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
            />
            
            <div className="md:col-span-2 flex items-center">
              <input 
                id="termsAccepted"
                name="termsAccepted"
                type="checkbox" 
                checked={formData.termsAccepted}
                onChange={handleChange} 
                required
                className="h-4 w-4 rounded border-gray-300 accent-[#bca142] focus:ring-[#bca142]" 
              />
              <label htmlFor="termsAccepted" className="ml-2 text-sm text-gray-600">
                I agree to the <a href="/terms" className="text-[#bca142] hover:underline">Terms and Conditions</a>
              </label>
            </div>

            <div className="md:col-span-2">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#bca142] to-[#D9B95B] text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                    Creating Account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>

            <div className="md:col-span-2 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link
                  to="/login"
                  state={{ from: from }}
                  className="font-medium text-[#bca142] hover:underline"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

function InputWithIcon({ id, name, type = 'text', value, onChange, placeholder, required = false, icon, showPassword, togglePassword }) {
  const getLabelText = (placeholder) => {
    let text = placeholder;
    text = text.replace('Enter Your ', '');
    text = text.replace('Create a ', '');
    text = text.replace(' (Optional)', '');
    return text;
  };

  return (
    <div>
      <label htmlFor={id} className="block text-gray-700 text-sm font-medium mb-2">
        {getLabelText(placeholder)} {required && '*'}
      </label>
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          {icon}
        </span>
        <input
          type={type} 
          id={id} 
          name={name} 
          value={value} 
          onChange={onChange}
          placeholder={placeholder} 
          required={required}
          className="w-full pl-10 pr-12 py-3 bg-stone-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bca142] border-transparent transition"
        />
        {(type === 'password' || (type === 'text' && togglePassword)) && (
          <button
            type="button"
            onClick={togglePassword}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
            aria-label="Toggle password visibility"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
      </div>
    </div>
  );
}

function CustomSelect({ label, value, onChange, options, placeholder, disabled = false, loading = false }) {
  return (
    <div>
      <Listbox value={value} onChange={onChange} disabled={disabled}>
        <Listbox.Label className="block text-gray-700 text-sm font-medium mb-2">{label}</Listbox.Label>
        <div className="relative">
          <Listbox.Button className="relative w-full cursor-default rounded-lg bg-stone-100 py-3 pl-3 pr-10 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#bca142] disabled:bg-stone-200 disabled:cursor-not-allowed">
            <span className={`block truncate ${value ? 'text-gray-900' : 'text-gray-400'}`}>
              {value || placeholder}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              {loading ? <Loader2 className="h-5 w-5 text-gray-400 animate-spin" /> : <ChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />}
            </span>
          </Listbox.Button>
          <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
            <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-30">
              {options.length === 0 && !loading ? (
                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">Nothing found.</div>
              ) : (
                options.map((option, optionIdx) => (
                  <Listbox.Option
                    key={optionIdx}
                    className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-[#f0e4c2] text-[#8e7121]' : 'text-gray-900'}`}
                    value={option}
                  >
                    {({ selected }) => (
                      <>
                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{option}</span>
                        {selected ? (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#bca142]">
                            <Check className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Listbox.Option>
                ))
              )}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
}

export default UserRegisterPage;