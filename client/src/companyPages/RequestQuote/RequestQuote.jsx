import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiPhone,
  FiSearch,
  FiChevronDown,
  FiTruck,
  FiPackage,
  FiLayers,
  FiSliders,
  FiCheck,
  FiSend,
  FiCheckCircle,
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';
import { fetchCountries, fetchStates, fetchCities } from '../../utils/locationData';
import CompanyQuoteRestrictionModal from '../../components/Modal/CompanyQuoteRestrictionModal';
import AccountTypeSelectionModal from '../../components/Modal/AccountTypeSelectionModal';

// Shared input styling so every field looks consistent.
const fieldBase =
  'w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 transition-all duration-200 hover:border-slate-300 focus:border-[#bca142] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#bca142]/10';

// Fields that must contain a number only (digits + a single decimal point).
const NUMERIC_FIELDS = ['quantity', 'weight', 'length', 'width', 'height'];

// Strips anything that is not a digit or a decimal point, and keeps at most
// one decimal point, so quantity/weight/dimensions can never hold letters.
const sanitizeNumber = (raw) => {
  let v = String(raw).replace(/[^0-9.]/g, '');
  const dot = v.indexOf('.');
  if (dot !== -1) {
    v = v.slice(0, dot + 1) + v.slice(dot + 1).replace(/\./g, '');
  }
  // A lone "." becomes "0." so values like ".5" can still be typed.
  if (v === '.') v = '0.';
  return v;
};

const FieldLabel = ({ htmlFor, label, required = false }) => (
  <label htmlFor={htmlFor} className="mb-2 block text-sm font-medium text-slate-700">
    {label} {required && <span className="text-rose-500">*</span>}
  </label>
);

// --- Reusable Form Field Components ---
const InputField = ({ label, name, placeholder, required = false, value, onChange, type = 'text', min, max, maxLength, numeric = false, hint }) => (
  <div>
    <FieldLabel htmlFor={name} label={label} required={required} />
    <input
      type={type}
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      min={min}
      max={max}
      maxLength={maxLength}
      inputMode={numeric ? 'decimal' : undefined}
      className={fieldBase}
    />
    {hint && <p className="mt-1.5 text-xs text-slate-400">{hint}</p>}
  </div>
);

const SelectField = ({ label, name, required = false, value, onChange, children, loading = false, disabled = false }) => (
  <div>
    <FieldLabel htmlFor={name} label={label} required={required} />
    <div className="relative">
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled || loading}
        className={`${fieldBase} cursor-pointer appearance-none pr-10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`}
      >
        {children}
      </select>
      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
        {loading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#bca142] border-t-transparent" />
        ) : (
          <FiChevronDown className="h-4 w-4" />
        )}
      </div>
    </div>
  </div>
);

// Type-to-search combobox used for Country / State / City fields.
const SearchableSelect = ({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Type to search...',
  required = false,
  loading = false,
  disabled = false,
  emptyText = 'No matches found',
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef(null);

  const isDisabled = disabled || loading;

  // Filter the list by whatever the user has typed.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => String(opt.label).toLowerCase().includes(q));
  }, [options, query]);

  // Close the dropdown when clicking anywhere outside.
  useEffect(() => {
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  useEffect(() => {
    setHighlight(0);
  }, [query, open]);

  // Emit the same synthetic-event shape the existing handleInputChange expects.
  const commit = (opt) => {
    onChange({ target: { name, value: opt.value, type: 'text' } });
    setOpen(false);
    setQuery('');
  };

  const handleKeyDown = (e) => {
    if (isDisabled) return;
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, Math.max(filtered.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[highlight]) commit(filtered[highlight]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
    }
  };

  const displayValue = open ? query : value || '';

  return (
    <div className="relative" ref={containerRef}>
      <FieldLabel htmlFor={name} label={label} required={required} />
      <div className="relative">
        <input
          id={name}
          name={name}
          type="text"
          autoComplete="off"
          disabled={isDisabled}
          value={displayValue}
          placeholder={isDisabled ? 'Select previous field first' : placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            if (isDisabled) return;
            setOpen(true);
            setQuery('');
          }}
          onKeyDown={handleKeyDown}
          className={`${fieldBase} pr-10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`}
        />
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
          {loading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#bca142] border-t-transparent" />
          ) : (
            <FiSearch className="h-4 w-4" />
          )}
        </div>
      </div>

      {open && !isDisabled && (
        <div className="absolute z-30 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-slate-100 bg-white py-1 shadow-2xl shadow-slate-900/10">
          {loading ? (
            <div className="px-4 py-3 text-sm text-slate-400">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-400">{emptyText}</div>
          ) : (
            filtered.map((opt, index) => {
              const isActive = index === highlight;
              const isSelected = value === opt.value;
              return (
                <button
                  type="button"
                  key={`${opt.value}-${index}`}
                  onMouseEnter={() => setHighlight(index)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    commit(opt);
                  }}
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${
                    isActive ? 'bg-[#bca142]/10 text-[#8a7628]' : 'text-slate-700'
                  } ${isSelected ? 'font-semibold' : ''}`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <FiCheck className="ml-2 h-4 w-4 shrink-0 text-[#bca142]" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

const CheckboxField = ({ label, name, checked, onChange }) => (
  <label
    htmlFor={name}
    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all duration-200 ${
      checked ? 'border-[#bca142] bg-[#bca142]/5 shadow-sm' : 'border-slate-200 bg-slate-50/70 hover:border-slate-300'
    }`}
  >
    <input
      id={name}
      name={name}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="h-4 w-4 shrink-0 rounded border-slate-300 text-[#bca142] focus:ring-2 focus:ring-[#bca142]/40"
    />
    <span className="text-sm font-medium text-slate-700">{label}</span>
  </label>
);

// --- Section Heading Component ---
const SectionHeader = ({ step, icon, title, subtitle }) => (
  <div className="mb-6 flex items-start gap-4">
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#bca142] to-[#B8941F] text-lg text-white shadow-lg shadow-[#bca142]/30">
      {icon}
    </div>
    <div>
      <span className="text-xs font-semibold uppercase tracking-wider text-[#bca142]">Step {step}</span>
      <h2 className="text-xl font-bold text-slate-800">{title}</h2>
      {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
    </div>
  </div>
);

// --- The Main RequestQuote Component ---
const RequestQuote = () => {
  const [loading, setLoading] = useState(false);
  const [showRestrictionModal, setShowRestrictionModal] = useState(false);
  const [showAccountTypeModal, setShowAccountTypeModal] = useState(false);
  const [pendingQuoteData, setPendingQuoteData] = useState(null);
  const navigate = useNavigate();

  // Location data states
  const [countries, setCountries] = useState([]);
  const [departureStates, setDepartureStates] = useState([]);
  const [departureCities, setDepartureCities] = useState([]);
  const [arrivalStates, setArrivalStates] = useState([]);
  const [arrivalCities, setArrivalCities] = useState([]);

  // Loading states for location data
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingDepartureStates, setLoadingDepartureStates] = useState(false);
  const [loadingDepartureCities, setLoadingDepartureCities] = useState(false);
  const [loadingArrivalStates, setLoadingArrivalStates] = useState(false);
  const [loadingArrivalCities, setLoadingArrivalCities] = useState(false);

  // Check if agent is trying to access quote request
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (user.id && user.role === 'company') {
      setShowRestrictionModal(true);
    }
  }, []);

  // Load countries on component mount
  useEffect(() => {
    const loadCountries = async () => {
      setLoadingCountries(true);
      try {
        const countriesData = await fetchCountries();
        setCountries(countriesData);
      } catch (error) {
        toast.error('Failed to load countries');
      } finally {
        setLoadingCountries(false);
      }
    };

    loadCountries();
  }, []);
  const [formData, setFormData] = useState({
    shippingMode: '',
    arrivalDate: '',
    departureCountry: '',
    departureState: '',
    departureCity: '',
    departureAddress: '',
    departureType: '',
    arrivalCountry: '',
    arrivalState: '',
    arrivalCity: '',
    arrivalAddress: '',
    arrivalType: '',
    productDescription: '',
    packing: '',
    incoterms: '',
    quantity: '',
    weight: '',
    type: '',
    length: '',
    width: '',
    height: '',
    dimensionUnit: '',
    isStackable: false,
    isHazardous: false,
    hasInsurance: false,
    notes: ''
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    // Numeric-only fields never store letters or stray symbols.
    const nextValue = NUMERIC_FIELDS.includes(name) ? sanitizeNumber(value) : value;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : nextValue
    }));

    // Handle departure location cascading
    if (name === 'departureCountry') {
      setFormData(prev => ({
        ...prev,
        departureCountry: value,
        departureState: '',
        departureCity: '',
        departureAddress: ''
      }));
      setDepartureStates([]);
      setDepartureCities([]);
      if (value) {
        loadDepartureStates(value);
      }
    } else if (name === 'departureState') {
      setFormData(prev => ({
        ...prev,
        departureState: value,
        departureCity: '',
        departureAddress: ''
      }));
      setDepartureCities([]);
      if (value && formData.departureCountry) {
        loadDepartureCities(formData.departureCountry, value);
      }
    }

    // Handle arrival location cascading
    if (name === 'arrivalCountry') {
      setFormData(prev => ({
        ...prev,
        arrivalCountry: value,
        arrivalState: '',
        arrivalCity: '',
        arrivalAddress: ''
      }));
      setArrivalStates([]);
      setArrivalCities([]);
      if (value) {
        loadArrivalStates(value);
      }
    } else if (name === 'arrivalState') {
      setFormData(prev => ({
        ...prev,
        arrivalState: value,
        arrivalCity: '',
        arrivalAddress: ''
      }));
      setArrivalCities([]);
      if (value && formData.arrivalCountry) {
        loadArrivalCities(formData.arrivalCountry, value);
      }
    }
  };

  // Load departure states
  const loadDepartureStates = async (countryName) => {
    setLoadingDepartureStates(true);
    try {
      const statesData = await fetchStates(countryName);
      setDepartureStates(statesData);
    } catch (error) {
      toast.error('Failed to load departure states');
    } finally {
      setLoadingDepartureStates(false);
    }
  };

  // Load departure cities
  const loadDepartureCities = async (countryName, stateName) => {
    setLoadingDepartureCities(true);
    try {
      const citiesData = await fetchCities(countryName, stateName);
      setDepartureCities(citiesData);
    } catch (error) {
      toast.error('Failed to load departure cities');
    } finally {
      setLoadingDepartureCities(false);
    }
  };

  // Load arrival states
  const loadArrivalStates = async (countryName) => {
    setLoadingArrivalStates(true);
    try {
      const statesData = await fetchStates(countryName);
      setArrivalStates(statesData);
    } catch (error) {
      toast.error('Failed to load arrival states');
    } finally {
      setLoadingArrivalStates(false);
    }
  };

  // Load arrival cities
  const loadArrivalCities = async (countryName, stateName) => {
    setLoadingArrivalCities(true);
    try {
      const citiesData = await fetchCities(countryName, stateName);
      setArrivalCities(citiesData);
    } catch (error) {
      toast.error('Failed to load arrival cities');
    } finally {
      setLoadingArrivalCities(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Comprehensive validation for all required fields
    const requiredFields = [
      { field: 'shippingMode', label: 'Shipping mode' },
      { field: 'arrivalDate', label: 'Arrival date' },
      { field: 'departureCountry', label: 'Departure country' },
      { field: 'departureState', label: 'Departure state' },
      { field: 'departureCity', label: 'Departure city' },
      { field: 'departureType', label: 'Departure type' },
      { field: 'arrivalCountry', label: 'Arrival country' },
      { field: 'arrivalState', label: 'Arrival state' },
      { field: 'arrivalCity', label: 'Arrival city' },
      { field: 'arrivalType', label: 'Arrival type' },
      { field: 'productDescription', label: 'Product description' },
      { field: 'packing', label: 'Packing type' },
      { field: 'quantity', label: 'Quantity' },
      { field: 'weight', label: 'Weight' },
      { field: 'length', label: 'Length' },
      { field: 'width', label: 'Width' },
      { field: 'height', label: 'Height' },
      { field: 'dimensionUnit', label: 'Dimension unit' }
    ];

    // Check for missing required fields
    const missingFields = requiredFields.filter(({ field }) => !formData[field] || formData[field].trim() === '');

    if (missingFields.length > 0) {
      toast.error('Please fill all required fields');
      return;
    }

    // The optional extra address is folded into the city value, so the server
    // stores/prints a single "City, Address" string and every screen that
    // already shows the city shows the address too — no changes needed there.
    const quotePayload = {
      ...formData,
      departureCity: [formData.departureCity, formData.departureAddress]
        .map((part) => (part || '').trim())
        .filter(Boolean)
        .join(', '),
      arrivalCity: [formData.arrivalCity, formData.arrivalAddress]
        .map((part) => (part || '').trim())
        .filter(Boolean)
        .join(', '),
    };
    delete quotePayload.departureAddress;
    delete quotePayload.arrivalAddress;

    // Check if user is logged in
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Check if company member is trying to submit
    if (user.id && user.role === 'company') {
      setPendingQuoteData(quotePayload);
      setShowRestrictionModal(true);
      return;
    }

    if (!token || !user.id) {
      // User is not logged in, store quote data and show account type selection modal
      localStorage.setItem('pendingQuote', JSON.stringify(quotePayload));
      setShowAccountTypeModal(true);
      return;
    }

    // User is logged in, submit the quote
    setLoading(true);
    try {
      await api.post('/api/quotes/submit', quotePayload);

      toast.success('Quote request submitted successfully!');

      // Redirect to appropriate dashboard based on user role
      if (user.role === 'business') {
        navigate('/business/dashboard');
      } else if (user.role === 'user') {
        navigate('/user/dashboard');
      } else if (user.role === 'company') {
        navigate('/company/dashboard');
      } else {
        navigate('/'); // Default fallback
      }

      // Reset form
      setFormData({
        shippingMode: '',
        arrivalDate: '',
        departureCountry: '',
        departureState: '',
        departureCity: '',
        departureAddress: '',
        departureType: '',
        arrivalCountry: '',
        arrivalState: '',
        arrivalCity: '',
        arrivalAddress: '',
        arrivalType: '',
        productDescription: '',
        packing: '',
        incoterms: '',
        quantity: '',
        weight: '',
        type: '',
        length: '',
        width: '',
        height: '',
        dimensionUnit: '',
        isStackable: false,
        isHazardous: false,
        hasInsurance: false,
        notes: ''
      });
    } catch (error) {
      toast.error('Error submitting quote: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowRestrictionModal(false);
    setPendingQuoteData(null);
    // Redirect back to company dashboard
    navigate('/company/dashboard');
  };

  const handleAccountTypeModalClose = () => {
    setShowAccountTypeModal(false);
  };

  const handleSelectUserAccount = () => {
    setShowAccountTypeModal(false);
    navigate('/user-register', {
      state: {
        from: '/user/dashboard',
        hasPendingQuote: true,
        preSelectedRole: 'User',
        message: 'Create a User account to request and track quotes as an individual.'
      }
    });
  };

  const handleSelectBusinessAccount = () => {
    setShowAccountTypeModal(false);
    navigate('/register', {
      state: {
        from: '/business/dashboard',
        hasPendingQuote: true,
        preSelectedRole: 'Business',
        message: 'Create a Business account to request and track quotes for your business.'
      }
    });
  };

  // Option lists for the searchable dropdowns
  const countryOptions = useMemo(() => countries.map((c) => ({ value: c.name, label: c.name })), [countries]);
  const departureStateOptions = useMemo(() => departureStates.map((s) => ({ value: s, label: s })), [departureStates]);
  const departureCityOptions = useMemo(() => departureCities.map((c) => ({ value: c, label: c })), [departureCities]);
  const arrivalStateOptions = useMemo(() => arrivalStates.map((s) => ({ value: s, label: s })), [arrivalStates]);
  const arrivalCityOptions = useMemo(() => arrivalCities.map((c) => ({ value: c, label: c })), [arrivalCities]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* --- Hero Banner --- */}
      <div className="relative h-72 mt-20 bg-cover bg-center" style={{ backgroundImage: `url('/Login.jpg')` }}>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/85 via-slate-900/70 to-[#bca142]/40"></div>
        <div className="relative mx-auto flex h-full max-w-7xl flex-col items-center justify-center px-4 text-center text-white">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-wide backdrop-blur-md">
            <FiSend /> Free Shipping Quote
          </span>
          <h1 className="mt-4 text-4xl font-bold md:text-5xl">Request a FREE shipping quote</h1>
          <p className="mt-3 text-sm text-white/80">
            <a href="#" className="transition-colors hover:text-[#e6d08f]">Home</a> &gt; <span>Request a FREE shipping quote</span>
          </p>
        </div>
      </div>

      {/* --- Main Content --- */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

          {/* Left Column (Main Form) */}
          <div className="lg:col-span-2">
            <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-xl shadow-slate-900/5 backdrop-blur-xl sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Step 1 — Shipment & Route */}
                <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                  <SectionHeader
                    step={1}
                    icon={<FiTruck />}
                    title="Shipment & Route"
                    subtitle="Tell us where the cargo is moving from and to"
                  />

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <SelectField
                      label="Shipping mode"
                      name="shippingMode"
                      value={formData.shippingMode}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select shipping method</option>
                      <option value="air">✈️ Air Freight</option>
                      <option value="sea">🚢 Sea Freight</option>
                      <option value="road">🚛 Road Transport</option>
                      <option value="rail">🚂 Rail Transport</option>
                    </SelectField>
                    <div>
                      <FieldLabel htmlFor="arrivalDate" label="Select arrival date" required />
                      <input
                        type="date"
                        id="arrivalDate"
                        name="arrivalDate"
                        value={formData.arrivalDate}
                        onChange={handleInputChange}
                        min={new Date().toISOString().split('T')[0]} // Prevent selecting past dates
                        className={`${fieldBase} cursor-pointer`}
                      />
                      <p className="mt-1.5 text-xs text-slate-400">Select a future date for cargo arrival</p>
                    </div>
                  </div>

                  {/* Departure group */}
                  <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                    <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <span className="h-2 w-2 rounded-full bg-[#bca142]" /> Departure
                    </p>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                      <SearchableSelect
                        label="Country"
                        name="departureCountry"
                        value={formData.departureCountry}
                        onChange={handleInputChange}
                        options={countryOptions}
                        loading={loadingCountries}
                        placeholder="Search country..."
                        required
                      />
                      <SearchableSelect
                        label="State"
                        name="departureState"
                        value={formData.departureState}
                        onChange={handleInputChange}
                        options={departureStateOptions}
                        loading={loadingDepartureStates}
                        disabled={!formData.departureCountry}
                        placeholder="Search state..."
                        required
                      />
                      <SearchableSelect
                        label="City"
                        name="departureCity"
                        value={formData.departureCity}
                        onChange={handleInputChange}
                        options={departureCityOptions}
                        loading={loadingDepartureCities}
                        disabled={!formData.departureState}
                        placeholder="Search city..."
                        required
                      />
                      <SelectField
                        label="Departure type"
                        name="departureType"
                        value={formData.departureType}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Type</option>
                        <option value="port">Port</option>
                        <option value="airport">Airport</option>
                        <option value="warehouse">Warehouse</option>
                        <option value="factory">Factory</option>
                      </SelectField>
                      <div className="sm:col-span-2 xl:col-span-4">
                        <InputField
                          label="Additional address (optional)"
                          name="departureAddress"
                          value={formData.departureAddress}
                          onChange={handleInputChange}
                          placeholder="Street, building, landmark, warehouse no."
                          maxLength={120}
                          hint="Optional — saved and shown together with the city."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Arrival group */}
                  <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                    <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <span className="h-2 w-2 rounded-full bg-[#bca142]" /> Arrival
                    </p>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                      <SearchableSelect
                        label="Country"
                        name="arrivalCountry"
                        value={formData.arrivalCountry}
                        onChange={handleInputChange}
                        options={countryOptions}
                        loading={loadingCountries}
                        placeholder="Search country..."
                        required
                      />
                      <SearchableSelect
                        label="State"
                        name="arrivalState"
                        value={formData.arrivalState}
                        onChange={handleInputChange}
                        options={arrivalStateOptions}
                        loading={loadingArrivalStates}
                        disabled={!formData.arrivalCountry}
                        placeholder="Search state..."
                        required
                      />
                      <SearchableSelect
                        label="City"
                        name="arrivalCity"
                        value={formData.arrivalCity}
                        onChange={handleInputChange}
                        options={arrivalCityOptions}
                        loading={loadingArrivalCities}
                        disabled={!formData.arrivalState}
                        placeholder="Search city..."
                        required
                      />
                      <SelectField
                        label="Arrival type"
                        name="arrivalType"
                        value={formData.arrivalType}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Type</option>
                        <option value="port">Port</option>
                        <option value="airport">Airport</option>
                        <option value="warehouse">Warehouse</option>
                        <option value="factory">Factory</option>
                      </SelectField>
                      <div className="sm:col-span-2 xl:col-span-4">
                        <InputField
                          label="Additional address (optional)"
                          name="arrivalAddress"
                          value={formData.arrivalAddress}
                          onChange={handleInputChange}
                          placeholder="Street, building, landmark, warehouse no."
                          maxLength={120}
                          hint="Optional — saved and shown together with the city."
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Step 2 — Cargo Details */}
                <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                  <SectionHeader
                    step={2}
                    icon={<FiPackage />}
                    title="Cargo Details"
                    subtitle="Tell us what you are shipping"
                  />
                  <div className="mb-6">
                    <InputField
                      label="What is the cargo / product?"
                      name="productDescription"
                      value={formData.productDescription}
                      onChange={handleInputChange}
                      placeholder="Describe The Product"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    <SelectField
                      label="How is your cargo packed"
                      name="packing"
                      value={formData.packing}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Please select</option>
                      <option value="pallets">Pallets</option>
                      <option value="boxes">Boxes</option>
                      <option value="crates">Crates</option>
                      <option value="loose">Loose</option>
                      <option value="containers">Containers</option>
                    </SelectField>
                    <SelectField
                      label="Incoterms"
                      name="incoterms"
                      value={formData.incoterms}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Please select</option>
                      <option value="EXW">EXW - Ex Works</option>
                      <option value="FOB">FOB - Free on Board</option>
                      <option value="CIF">CIF - Cost, Insurance & Freight</option>
                      <option value="DDP">DDP - Delivered Duty Paid</option>
                    </SelectField>
                    <InputField
                      label="Quantity"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      placeholder="Quantity"
                      numeric
                      required
                    />
                  </div>
                  <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <InputField
                      label="Weight"
                      name="weight"
                      value={formData.weight}
                      onChange={handleInputChange}
                      placeholder="Weight (kg)"
                      numeric
                      required
                    />
                    <SelectField
                      label="Type"
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select one</option>
                      <option value="general">General Cargo</option>
                      <option value="hazardous">Hazardous</option>
                      <option value="perishable">Perishable</option>
                      <option value="fragile">Fragile</option>
                    </SelectField>
                  </div>
                </section>

                {/* Step 3 — Dimensions */}
                <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                  <SectionHeader
                    step={3}
                    icon={<FiLayers />}
                    title="Dimensions (L x W x H)"
                    subtitle="Specify cargo dimensions for accurate pricing"
                  />
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
                    <InputField
                      label="Length"
                      name="length"
                      value={formData.length}
                      onChange={handleInputChange}
                      placeholder="Length"
                      numeric
                      required
                    />
                    <InputField
                      label="Width"
                      name="width"
                      value={formData.width}
                      onChange={handleInputChange}
                      placeholder="Width"
                      numeric
                      required
                    />
                    <InputField
                      label="Height"
                      name="height"
                      value={formData.height}
                      onChange={handleInputChange}
                      placeholder="Height"
                      numeric
                      required
                    />
                    <SelectField
                      label="Unit"
                      name="dimensionUnit"
                      value={formData.dimensionUnit}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select unit</option>
                      <option value="cm">📏 Centimeters</option>
                      <option value="m">📐 Meters</option>
                      <option value="in">📏 Inches</option>
                      <option value="ft">📐 Feet</option>
                    </SelectField>
                  </div>
                </section>

                {/* Step 4 — Additional Options */}
                <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                  <SectionHeader
                    step={4}
                    icon={<FiSliders />}
                    title="Additional Options"
                    subtitle="Special requirements and cargo insurance options"
                  />
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <CheckboxField
                      label="📦 Stackable cargo"
                      name="isStackable"
                      checked={formData.isStackable}
                      onChange={handleInputChange}
                    />
                    <CheckboxField
                      label="⚠️ Hazardous materials"
                      name="isHazardous"
                      checked={formData.isHazardous}
                      onChange={handleInputChange}
                    />
                    <CheckboxField
                      label="🛡️ Cargo insurance required"
                      name="hasInsurance"
                      checked={formData.hasInsurance}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="mt-6">
                    <label htmlFor="notes" className="mb-2 block text-sm font-medium text-slate-700">
                      Additional Notes & Special Instructions
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows="4"
                      placeholder="Any special handling requirements, delivery instructions, or additional information..."
                      className={`${fieldBase} resize-none`}
                    ></textarea>
                  </div>
                </section>

                {/* Submit Button */}
                <div className="rounded-2xl bg-gradient-to-r from-[#bca142] to-[#B8941F] p-6 shadow-lg shadow-[#bca142]/30">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full transform rounded-xl bg-white px-8 py-4 text-lg font-bold text-[#bca142] shadow-md transition-all duration-200 hover:scale-[1.02] hover:bg-gray-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="mr-3 h-5 w-5 animate-spin rounded-full border-b-2 border-[#bca142]"></div>
                        Submitting Quote Request...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <FiSend /> Submit Quote Request
                      </div>
                    )}
                  </button>
                  <p className="mt-3 text-center text-sm text-white/90">
                    Get competitive quotes from verified shipping companies
                  </p>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column (Sidebar) */}
          <div className="space-y-6 lg:col-span-1">
            {/* Quick Quote CTA */}
            <div className="rounded-3xl bg-gradient-to-br from-[#bca142] to-[#B8941F] p-6 text-center shadow-xl shadow-[#bca142]/25">
              <p className="text-sm font-medium text-white/90">Ready to ship?</p>
              <p className="mt-1 text-lg font-bold text-white">Get your free quote now</p>
              <button
                type="button"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 font-bold text-[#bca142] shadow-md transition-transform hover:scale-[1.02]"
              >
                <FiSend /> Request a Quote
              </button>
            </div>

            {/* Contact Information Card */}
            <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-center text-white shadow-xl">
              <h4 className="text-lg font-bold">Need any information?</h4>
              <p className="mt-1 text-sm text-white/70">Our shipping experts are here to help</p>
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-center gap-3">
                  <FiPhone className="h-7 w-7 text-[#bca142]" />
                  <span className="text-2xl font-bold">+973 17491222</span>
                </div>
                <p className="mt-2 text-xs text-white/60">Available 24/7 for assistance</p>
              </div>
            </div>

            {/* Features List */}
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <h4 className="text-lg font-bold text-slate-800">Why Choose Us?</h4>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                {['Free quote comparison', 'Verified shipping companies', 'Real-time tracking', '24/7 customer support', 'Secure payment options'].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <FiCheckCircle className="h-4 w-4 shrink-0 text-[#bca142]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Company Restriction Modal */}
      <CompanyQuoteRestrictionModal
        isOpen={showRestrictionModal}
        onClose={handleModalClose}
        quoteData={pendingQuoteData}
      />

      {/* Account Type Selection Modal */}
      <AccountTypeSelectionModal
        isOpen={showAccountTypeModal}
        onClose={handleAccountTypeModalClose}
        onSelectUser={handleSelectUserAccount}
        onSelectBusiness={handleSelectBusinessAccount}
      />
    </div>
  );
};

export default RequestQuote;
