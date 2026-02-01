import { useState, useEffect, Fragment } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Listbox, Transition } from '@headlessui/react';
import PhoneInput from 'react-phone-input-2';
import toast from 'react-hot-toast';
import 'react-phone-input-2/lib/style.css';
import { api, publicAPI } from '../../utils/api';
import { submitPendingQuote, hasPendingQuote, checkAndClearInvalidPendingQuote } from '../../utils/pendingQuote';

// Importing icons for a better UI
import { User, Phone, Mail, Lock, Building, ChevronDown, Check, Loader2, Eye, EyeOff } from 'lucide-react';

const RegisterPage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Get redirect path and message from location state
    const from = location.state?.from || null;
    const redirectMessage = location.state?.message;
    const preSelectedRole = location.state?.preSelectedRole;

    // --- State Management ---
    const [formData, setFormData] = useState({
        role: preSelectedRole || 'Company', // Use pre-selected role if available
        name: '',
        phone: '',
        email: '',
        category: '',
        country: '',
        password: '',
        confirmPassword: '',
        referralCode: '',
        termsAccepted: false,
    });

    const [countries, setCountries] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [categoriesLoading, setCategoriesLoading] = useState(false);
    const [initialCountry, setInitialCountry] = useState('us');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true); // Loading state for auth check

    // Check if user is already logged in
    useEffect(() => {
        const checkAuthStatus = () => {
            const token = localStorage.getItem('token');
            const user = localStorage.getItem('user');
            
            if (token && user) {
                try {
                    const userData = JSON.parse(user);
                    console.log('User already logged in, redirecting...', userData);
                    
                    // Redirect based on user role
                    if (userData.role === 'admin') {
                        navigate('/admin', { replace: true });
                    } else if (userData.role === 'company') {
                        navigate('/company', { replace: true });
                    } else if (userData.role === 'business') {
                        navigate('/business', { replace: true });
                    } else if (userData.role === 'user') {
                        navigate('/user/dashboard', { replace: true });
                    } else {
                        // If role is unknown, clear storage and allow registration
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        setIsCheckingAuth(false);
                    }
                } catch (error) {
                    console.error('Error parsing user data:', error);
                    // Clear invalid data and allow registration
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setIsCheckingAuth(false);
                }
            } else {
                setIsCheckingAuth(false);
            }
        };

        checkAuthStatus();
    }, [navigate]);

    useEffect(() => {
        const fetchCategories = async () => {
            if (!formData.role) return;
            
            setCategoriesLoading(true);
            try {
                const endpoint = formData.role === 'Company' 
                    ? '/api/logistics-categories' 
                    : '/api/business-categories';
                
                const response = await api.get(endpoint);
                setCategories(response.map(cat => cat.name));
                
                // Reset category selection when role changes
                setFormData(prevState => ({
                    ...prevState,
                    category: ''
                }));
            } catch (error) {
                console.error('Error fetching categories:', error);
                toast.error('Failed to load categories');
                setCategories([]);
            } finally {
                setCategoriesLoading(false);
            }
        };

        fetchCategories();
    }, [formData.role]);

    useEffect(() => {
        const fetchUserCountry = async () => {
            try {
                // Use our backend proxy to avoid CORS issues
                const result = await publicAPI.getCountry();
                
                if (result.success && result.data) {
                    const data = result.data;
                    
                    // Set phone input country code
                    setInitialCountry(data.country_code.toLowerCase());
                    
                    // Auto-select country in dropdown
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
                // Fallback to US
                setInitialCountry('us');
                setFormData(prevState => ({
                    ...prevState,
                    country: 'United States'
                }));
            }
        };

        fetchUserCountry();
    }, []);

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

    const roles = ['Company', 'Business'];

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
        
        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match.');
            return;
        }
        if (!formData.termsAccepted) {
            toast.error('You must accept the Terms and Conditions.');
            return;
        }

        setLoading(true);
        try {
            const data = await api.post('/api/user/register', {
                ...formData,
                role: formData.role.toLowerCase(),
            });

            // --- SUCCESS FLOW: Handle different account statuses ---
            if (data.accountStatus === 'active') {
                // Account created and active (for business users)
                toast.success(data.message || 'Registration successful! Welcome to GSN.');
                
                if (data.token) {
                    // Token provided - user is automatically logged in
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    
                    // Check if there's a pending quote to submit
                    if (hasPendingQuote()) {
                        // First check if the pending quote should be cleared due to user role
                        const wasCleared = checkAndClearInvalidPendingQuote();
                        
                        if (!wasCleared) {
                            // Only submit if it wasn't cleared (i.e., user is business or regular user)
                            const quoteResult = await submitPendingQuote();
                            if (quoteResult.success) {
                                toast.success('Your quote request has been submitted!');
                            }
                        }
                    }
                    
                    // Redirect to intended destination
                    navigate(from || '/business/dashboard', { replace: true });
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
                            // First check if the pending quote should be cleared due to user role
                            const wasCleared = checkAndClearInvalidPendingQuote();
                            
                            if (!wasCleared) {
                                // Only submit if it wasn't cleared (i.e., user is business or regular user)
                                const quoteResult = await submitPendingQuote();
                                if (quoteResult.success) {
                                    toast.success('Your quote request has been submitted!');
                                }
                            }
                        }
                        
                        // Redirect to intended destination
                        navigate(from || '/business/dashboard', { replace: true });
                        
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
                // Account created but needs admin approval (for company and business users)
                toast.success(data.message || 'Account created! Your account is pending admin approval.');
                
                // Clear any pending quote data since user can't login yet
                localStorage.removeItem('pendingQuote');
                
                // Navigate to login page after a short delay
                setTimeout(() => {
                    navigate('/login', {
                        state: {
                            from,
                            email: formData.email,
                            message: 'Registration successful! Please login once your account is approved.'
                        }
                    });
                }, 3000);
            } else if (data.token) {
                // Fallback: Account created and token provided (legacy flow)
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                toast.success('Registration successful! Welcome to GSN.');
                
                // Check if there's a pending quote to submit
                if (hasPendingQuote()) {
                    // First check if the pending quote should be cleared due to user role
                    const wasCleared = checkAndClearInvalidPendingQuote();
                    
                    if (!wasCleared) {
                        // Only submit if it wasn't cleared (i.e., user is business or regular user)
                        const quoteResult = await submitPendingQuote();
                        if (quoteResult.success) {
                            toast.success('Your quote request has been submitted!');
                        }
                    }
                }
                
                // Redirect to intended destination
                const redirectPath = data.user.role === 'business' ? '/business/dashboard' : '/company/dashboard';
                navigate(from || redirectPath, { replace: true });
            } else {
                // Fallback for other success cases
                toast.success('Account created successfully!');
                navigate('/login', {
                    state: {
                        from,
                        email: formData.email,
                        message: 'Registration successful! Please login with your credentials.'
                    }
                });
            } 

        } catch (err) {
            toast.error(err.message || 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    // Show loading spinner while checking authentication
    if (isCheckingAuth) {
        return (
            <div className="bg-stone-50 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#bca142] mx-auto mb-4"></div>
                    <p className="text-xl text-gray-600">Checking authentication...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-stone-50 mt-20 min-h-screen font-sans">
            <header
                className="h-60 bg-cover bg-center relative"
                style={{ backgroundImage: `url('/Login.jpg')` }}
            >
                <div className="container mx-auto h-full flex flex-col justify-center items-center text-white relative z-10">
                    <h1 className="text-5xl font-bold tracking-tight">Register</h1>
                    <p className="mt-2 text-lg">
                        <span>Home</span><span className="mx-2">&gt;</span><span>Register</span>
                    </p>
                </div>
            </header>
            
            <main className="container mt-44 mx-auto px-4 py-16">
                <div className="bg-white p-8 md:p-12 rounded-2xl shadow-xl max-w-2xl mx-auto -mt-48 relative z-20 border border-gray-100">
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Create Your Account!</h2>
                    <div className="w-24 h-1.5 bg-[#bca142] rounded-full mb-8"></div>
                    
                    {redirectMessage && (
                        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800">
                                <strong>{redirectMessage}</strong>
                            </p>
                            <p className="text-xs text-blue-600 mt-1">
                                Business accounts are for business entities requesting quotes. Company accounts are for logistics providers offering quotes to customers.
                            </p>
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        
                        <div>
                            <CustomSelect
                                label="I am a *"
                                value={formData.role}
                                onChange={(val) => handleChange({ target: { name: 'role', value: val } })}
                                options={roles}
                                placeholder="Select a Role"
                            />
                            {preSelectedRole && (
                                <p className="text-xs text-blue-600 mt-1 flex items-center">
                                    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                    {preSelectedRole} account pre-selected for you
                                </p>
                            )}
                        </div>

                        <InputWithIcon id="name" name="name" type="text" value={formData.name} onChange={handleChange} placeholder="Enter Your Full Name" required icon={<User className="w-5 h-5 text-gray-400" />} />
                        
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

                        <InputWithIcon id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Enter Your Email" required icon={<Mail className="w-5 h-5 text-gray-400" />} />

                        <CustomSelect
                            label="Category *"
                            value={formData.category}
                            onChange={(val) => handleChange({ target: { name: 'category', value: val } })}
                            options={categories}
                            placeholder="Select a Category"
                            loading={categoriesLoading}
                            disabled={!formData.role || categoriesLoading}
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
                        
                        <div className="md:col-span-2">
                             <InputWithIcon id="referralCode" name="referralCode" type="text" value={formData.referralCode} onChange={handleChange} placeholder="Enter Referral Code (Optional)" icon={<Building className="w-5 h-5 text-gray-400" />} />
                        </div>
                        
                        <div className="md:col-span-2 flex items-center">
                            <input id="termsAccepted" name="termsAccepted" type="checkbox" checked={formData.termsAccepted} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 accent-[#bca142] focus:ring-[#bca142]" />
                            <label htmlFor="termsAccepted" className="ml-3 block text-sm text-gray-800">I accept the <a href="#" className="font-medium text-[#bca142] hover:underline">Terms and Conditions</a></label>
                        </div>
                        
                        <div className="md:col-span-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center items-center gap-2 cursor-pointer py-3 px-4 mt-4 rounded-lg shadow-sm text-base font-semibold text-white bg-[#bca142] hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#bca142] transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                                {loading ? 'Registering...' : 'Create Account'}
                            </button>
                        </div>

                    </form>
                                            <p className='text-md mt-8 text-center'>
                                          Need to track quotes?{' '}
                                          <Link 
                                              to="/user-register" 
                                              
                                              className="font-semibold text-[#bca142] underline hover:text-[#bca142]"
                                          >
                                              Create User Account
                                          </Link>
                                      </p>
                </div>
            </main>
        </div>
    );
};

// --- Helper components ---
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
                    type={type} id={id} name={name} value={value} onChange={onChange}
                    placeholder={placeholder} required={required}
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


export default RegisterPage;