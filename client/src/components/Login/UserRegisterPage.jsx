import { useState, useEffect, Fragment } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Listbox, Transition } from '@headlessui/react';
import PhoneInput from 'react-phone-input-2';
import toast from 'react-hot-toast';
import 'react-phone-input-2/lib/style.css';
import { submitPendingQuote, hasPendingQuote } from '../../utils/pendingQuote';
import { api } from '../../utils/api';

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
  const navigate = useNavigate();
  const location = useLocation();

  // Get redirect path from location state (if user was redirected after quote submission)
  const from = location.state?.from || '/user/dashboard';
  const redirectMessage = location.state?.message;

  useEffect(() => {
    const fetchUserCountry = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) throw new Error('Failed to fetch IP info.');
        const data = await response.json();
        
        // Set phone input country code
        setInitialCountry(data.country_code.toLowerCase());
        
        // Auto-select country in dropdown
        if (data.country_name) {
          setFormData(prevState => ({
            ...prevState,
            country: data.country_name
          }));
        }
      } catch (err) {
        console.error("Could not fetch user's country:", err);
        setInitialCountry('us');
      }
    };
    fetchUserCountry();
  }, []);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch('https://countriesnow.space/api/v0.1/countries');
        if (!response.ok) throw new Error('Failed to fetch country list.');
        const data = await response.json();
        if (data.error) throw new Error(data.msg);
        const countryNames = data.data.map(c => c.country).sort();
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
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handlePhoneChange = (phone) => {
    setFormData(prevState => ({ ...prevState, phone }));
  };

  const handleCountryChange = (country) => {
    setFormData(prevState => ({ ...prevState, country }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.email || !formData.phone || !formData.password || !formData.country) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (!formData.termsAccepted) {
      toast.error('You must accept the Terms and Conditions');
      return;
    }

    setLoading(true);

    try {
      const data = await api.post('/api/user/register', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: 'user', // Specifically register as 'user' role
        country: formData.country
      });

      if (data.accountStatus === 'active') {
        // Account created and active
        toast.success(data.message || 'Registration successful! Welcome to GSN.');
        
        if (data.token) {
          // Token provided - user is automatically logged in
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          
          // Check if there's a pending quote to submit
          if (hasPendingQuote()) {
            const quoteResult = await submitPendingQuote();
            if (quoteResult.success) {
              toast.success('Your quote request has been submitted!');
            }
          }
          
          // Redirect to intended destination
          navigate(from, { replace: true });
        } else {
          // No token provided - attempt manual login
          try {
            const loginData = await api.post('/api/user/login', {
              email: formData.email,
              password: formData.password
            });
            
            // Store authentication data
            localStorage.setItem('token', loginData.token);
            localStorage.setItem('user', JSON.stringify(loginData.user));
            
            // Check if there's a pending quote to submit
            if (hasPendingQuote()) {
              const quoteResult = await submitPendingQuote();
              if (quoteResult.success) {
                toast.success('Your quote request has been submitted!');
              }
            }
            
            // Redirect to intended destination
            navigate(from, { replace: true });
            
          } catch (loginError) {
            console.error('Auto-login failed:', loginError);
            toast.error('Registration successful, but auto-login failed. Please login manually.');
            
            // Fallback to login page
            setTimeout(() => {
              navigate('/login', { 
                state: { 
                  from,
                  email: formData.email,
                  message: 'Registration successful! Please login with your credentials.'
                }
              });
            }, 2000);
          }
        }
      } else if (data.accountStatus === 'pending_approval') {
        // Account created but needs admin approval
        toast.success(data.message || 'Account created! Your account is pending admin approval.');
        
        // Clear any pending quote data since user can't login yet
        localStorage.removeItem('pendingQuote');
        
        // Navigate to login page after a short delay
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else if (data.token) {
        // Fallback: Account created and token provided (legacy flow)
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        toast.success('Registration successful! Welcome to GSN.');
        
        // Check if there's a pending quote to submit
        if (hasPendingQuote()) {
          const quoteResult = await submitPendingQuote();
          if (quoteResult.success) {
            toast.success('Your quote request has been submitted!');
          }
        }
        
        // Redirect to intended destination
        navigate(from, { replace: true });
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-stone-50 mt-20 min-h-screen font-sans">
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
          <div className="w-24 h-1.5 bg-[#CDA435] rounded-full mb-4"></div>
          
          {redirectMessage && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>{redirectMessage}</strong>
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Company accounts are for logistics providers. User accounts are for requesting and tracking quotes.
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
              required 
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
              required 
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
              required 
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
              required 
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
                className="h-4 w-4 rounded border-gray-300 accent-[#CDA435] focus:ring-[#CDA435]" 
              />
              <label htmlFor="termsAccepted" className="ml-3 block text-sm text-gray-800">
                I accept the <a href="#" className="font-medium text-[#CDA435] hover:underline">Terms and Conditions</a>
              </label>
            </div>
            
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 cursor-pointer py-3 px-4 mt-4 rounded-lg shadow-sm text-base font-semibold text-white bg-[#CDA435] hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#CDA435] transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                {loading ? 'Creating Account...' : 'Create User Account'}
              </button>
            </div>

            {/* Login Link */}
            <div className="md:col-span-2 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link
                  to="/login"
                  state={{ from }}
                  className="font-medium text-[#CDA435] hover:underline"
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

// --- Helper components ---
const InputWithIcon = ({ id, name, type = 'text', value, onChange, placeholder, required = false, icon, showPassword, togglePassword }) => (
  <div>
    <label htmlFor={id} className="block text-gray-700 text-sm font-medium mb-2">
      {placeholder.replace('Enter Your ', '').replace('Create a ', '').replace(' (Optional)', '')} {required && '*'}
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
        className="w-full pl-10 pr-12 py-3 bg-stone-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CDA435] border-transparent transition"
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

const CustomSelect = ({ label, value, onChange, options, placeholder, disabled = false, loading = false }) => (
  <div>
    <Listbox value={value} onChange={onChange} disabled={disabled}>
      <Listbox.Label className="block text-gray-700 text-sm font-medium mb-2">{label}</Listbox.Label>
      <div className="relative">
        <Listbox.Button className="relative w-full cursor-default rounded-lg bg-stone-100 py-3 pl-3 pr-10 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#CDA435] disabled:bg-stone-200 disabled:cursor-not-allowed">
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
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#CDA435]">
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

export default UserRegisterPage;