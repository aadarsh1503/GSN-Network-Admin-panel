// Geolocation routes for IP-based country detection
import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// ipinfo.io is the primary provider (https://ipinfo.io/developers/ipinfo-api).
// It is called from the server, never from the browser, so there is no CORS
// problem and the visitor's real IP is the one being looked up.
// Without a token the free endpoint is heavily rate-limited, so set
// IPINFO_TOKEN in .env to use an authenticated (much higher quota) lookup.
// The token is read lazily (not at import time) because dotenv.config() runs in
// index.js after the ES module imports are evaluated.
const getIpinfoToken = () => (process.env.IPINFO_TOKEN || '').trim();

const ipinfoUrl = (ip) => {
  const base = ip ? `https://ipinfo.io/${ip}/json` : 'https://ipinfo.io/json';
  const token = getIpinfoToken();
  return token ? `${base}?token=${token}` : base;
};

const timeoutSignal = (ms) => AbortSignal.timeout(ms);

// Lookups are cached in memory: this route is hit on every page view by guests,
// so repeat visitors must not burn the provider's quota.
const GEO_CACHE_TTL_MS = 30 * 60 * 1000;
const GEO_CACHE_MAX = 500;
const geoCache = new Map();

const readGeoCache = (key) => {
  const hit = geoCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > GEO_CACHE_TTL_MS) {
    geoCache.delete(key);
    return null;
  }
  return hit.data;
};

const writeGeoCache = (key, data) => {
  if (!key || !data) return;
  if (geoCache.size >= GEO_CACHE_MAX) geoCache.clear();
  geoCache.set(key, { data, at: Date.now() });
};

// @desc    Get user's country based on IP address
// @route   GET /api/geo/country
// @access  Public
router.get('/country', async (req, res) => {
  console.log('🌍 Geo country endpoint hit - no auth required');
  console.log('Request headers:', req.headers);
  console.log('Request method:', req.method);
  console.log('Request path:', req.path);
  
  // Check for manual country override (for testing)
  const manualCountry = req.query.country;
  if (manualCountry) {
    console.log(`🔧 Manual country override: ${manualCountry}`);
    const countryCode = manualCountry.toUpperCase();
    const countryName = getCountryName(countryCode);
    
    return res.json({
      success: true,
      data: {
        country_code: countryCode,
        country_name: countryName,
        city: 'Test City',
        region: 'Test Region',
        ip: 'Manual Override'
      },
      ip: 'Manual Override',
      isLocalhost: false,
      manual_override: true,
      debug: {
        message: `Manual country override used: ${countryCode}`,
        timestamp: new Date().toISOString()
      }
    });
  }
  
  try {
    // Enhanced IP detection
    let clientIP = req.headers['x-forwarded-for'] || 
                   req.headers['x-real-ip'] ||
                   req.connection.remoteAddress || 
                   req.socket.remoteAddress ||
                   (req.connection.socket ? req.connection.socket.remoteAddress : null);

    // Handle comma-separated IPs (from proxies/load balancers)
    if (clientIP && clientIP.includes(',')) {
      clientIP = clientIP.split(',')[0].trim();
    }

    // Remove IPv6 prefix if present
    if (clientIP && clientIP.startsWith('::ffff:')) {
      clientIP = clientIP.substring(7);
    }

    console.log('Detected Client IP:', clientIP);
    
    const isLocalhost = !clientIP || 
                       clientIP === '::1' || 
                       clientIP === '127.0.0.1' || 
                       clientIP === 'localhost' ||
                       clientIP.startsWith('192.168.') ||
                       clientIP.startsWith('10.') ||
                       clientIP.startsWith('172.');

    console.log('Is localhost/private IP:', isLocalhost);

    let countryData = null;

    // If localhost, try to get public IP first, then use geolocation services
    if (isLocalhost) {
      console.log('🔍 Localhost detected, trying to get public IP...');
      
      // Try to get public IP from external services (ipinfo first)
      const publicIPServices = [
        ipinfoUrl(null),
        'https://api.ipify.org?format=json',
        'https://api.myip.com'
      ];

      for (const service of publicIPServices) {
        try {
          console.log(`Trying public IP service: ${service}`);
          const response = await fetch(service, { signal: timeoutSignal(5000) });
          if (response.ok) {
            const data = await response.json();
            
            // Extract IP from different response formats
            const publicIP = data.ip || data.query || data.ipAddress;
            
            if (publicIP && publicIP !== clientIP) {
              console.log(`✅ Found public IP: ${publicIP}`);
              clientIP = publicIP;
              break;
            }
          }
        } catch (error) {
          console.log(`❌ Public IP service failed: ${service} - ${error.message}`);
          continue;
        }
      }
    }

    // Re-check if we still have localhost after public IP detection
    const finalIsLocalhost = !clientIP || 
                             clientIP === '::1' || 
                             clientIP === '127.0.0.1' || 
                             clientIP === 'localhost' ||
                             clientIP.startsWith('192.168.') ||
                             clientIP.startsWith('10.') ||
                             clientIP.startsWith('172.');

    console.log('Final IP for geolocation:', clientIP);
    console.log('Final localhost status:', finalIsLocalhost);

    // Primary provider: ipinfo.io. The others are only used as fallbacks when
    // ipinfo is unreachable or its quota is exhausted.
    const services = [
      {
        name: 'ipinfo.io',
        url: ipinfoUrl(finalIsLocalhost ? null : clientIP),
        transform: (data) => ({
          country_code: data.country || null,
          country_name: getCountryName(data.country),
          city: data.city || 'Unknown',
          region: data.region || 'Unknown',
          ip: data.ip || clientIP,
          provider: 'ipinfo.io'
        })
      },
      {
        name: 'ip-api.com',
        url: finalIsLocalhost ? 'http://ip-api.com/json/' : `http://ip-api.com/json/${clientIP}`,
        transform: (data) => ({
          country_code: data.countryCode || null,
          country_name: getCountryName(data.countryCode) || data.country || null,
          city: data.city || 'Unknown',
          region: data.regionName || 'Unknown',
          ip: data.query || clientIP,
          provider: 'ip-api.com'
        })
      },
      {
        name: 'ipapi.co',
        url: finalIsLocalhost ? 'https://ipapi.co/json/' : `https://ipapi.co/${clientIP}/json/`,
        transform: (data) => ({
          country_code: data.country_code || null,
          country_name: getCountryName(data.country_code) || data.country_name || null,
          city: data.city || 'Unknown',
          region: data.region || 'Unknown',
          ip: data.ip || clientIP,
          provider: 'ipapi.co'
        })
      }
    ];

    // Cache key: real visitor IP, or 'self' for the server's own public IP.
    const cacheKey = finalIsLocalhost ? 'self' : clientIP;
    countryData = readGeoCache(cacheKey);

    if (countryData) {
      console.log(`⚡ Served from cache for ${cacheKey}:`, countryData.country_name);
    }

    // Try each service until one works
    for (const service of services) {
      if (countryData) break;
      try {
        console.log(`🔄 Trying ${service.name}...`);
        const response = await fetch(service.url, {
          signal: timeoutSignal(8000),
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; QuoteApp/1.0)'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`📊 ${service.name} raw response:`, data);
          
          const parsed = service.transform(data);
          console.log(`✅ ${service.name} success:`, parsed);
          
          // Validate the data — a payload without a country code is useless and
          // must not be cached or returned.
          if (parsed.country_code && parsed.country_code !== 'undefined') {
            countryData = parsed;
            writeGeoCache(cacheKey, parsed);
          } else {
            console.log(`⚠️ ${service.name} returned invalid data, trying next service...`);
          }
        } else {
          console.log(`❌ ${service.name} HTTP error: ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ ${service.name} failed:`, error.message);
        continue;
      }
    }

    // Enhanced fallback logic
    if (!countryData) {
      console.log('⚠️ All geolocation services failed, using enhanced fallback...');
      
      // Prefer the visitor's own timezone (sent by the browser) — the server's
      // timezone is usually UTC, which would wrongly resolve to the US.
      const timezone = req.headers['x-timezone'] || req.headers['timezone'] || Intl.DateTimeFormat().resolvedOptions().timeZone;
      console.log('Detected timezone:', timezone);
      
      let fallbackCountry = null;
      let fallbackCountryName = null;
      
      // Basic timezone to country mapping for common cases
      if (timezone) {
        const timezoneCountryMap = {
          'Asia/Kolkata': { code: 'IN', name: 'India' },
          'Asia/Calcutta': { code: 'IN', name: 'India' },
          'Asia/Mumbai': { code: 'IN', name: 'India' },
          'Asia/Delhi': { code: 'IN', name: 'India' },
          'Asia/Karachi': { code: 'PK', name: 'Pakistan' },
          'Asia/Dhaka': { code: 'BD', name: 'Bangladesh' },
          'Asia/Kathmandu': { code: 'NP', name: 'Nepal' },
          'Asia/Colombo': { code: 'LK', name: 'Sri Lanka' },
          'Asia/Bahrain': { code: 'BH', name: 'Bahrain' },
          'Asia/Riyadh': { code: 'SA', name: 'Saudi Arabia' },
          'Asia/Qatar': { code: 'QA', name: 'Qatar' },
          'Asia/Kuwait': { code: 'KW', name: 'Kuwait' },
          'Asia/Muscat': { code: 'OM', name: 'Oman' },
          'Asia/Dubai': { code: 'AE', name: 'United Arab Emirates' },
          'Asia/Amman': { code: 'JO', name: 'Jordan' },
          'Asia/Beirut': { code: 'LB', name: 'Lebanon' },
          'Asia/Baghdad': { code: 'IQ', name: 'Iraq' },
          'Asia/Istanbul': { code: 'TR', name: 'Turkey' },
          'Europe/Istanbul': { code: 'TR', name: 'Turkey' },
          'Africa/Cairo': { code: 'EG', name: 'Egypt' },
          'Africa/Lagos': { code: 'NG', name: 'Nigeria' },
          'Africa/Nairobi': { code: 'KE', name: 'Kenya' },
          'Africa/Johannesburg': { code: 'ZA', name: 'South Africa' },
          'Europe/London': { code: 'GB', name: 'United Kingdom' },
          'Europe/Berlin': { code: 'DE', name: 'Germany' },
          'Europe/Paris': { code: 'FR', name: 'France' },
          'Europe/Moscow': { code: 'RU', name: 'Russia' },
          'America/New_York': { code: 'US', name: 'United States' },
          'America/Chicago': { code: 'US', name: 'United States' },
          'America/Denver': { code: 'US', name: 'United States' },
          'America/Los_Angeles': { code: 'US', name: 'United States' },
          'America/Toronto': { code: 'CA', name: 'Canada' },
          'America/Sao_Paulo': { code: 'BR', name: 'Brazil' },
          'Asia/Singapore': { code: 'SG', name: 'Singapore' },
          'Asia/Hong_Kong': { code: 'HK', name: 'Hong Kong' },
          'Asia/Shanghai': { code: 'CN', name: 'China' },
          'Asia/Tokyo': { code: 'JP', name: 'Japan' },
          'Asia/Seoul': { code: 'KR', name: 'South Korea' },
          'Asia/Jakarta': { code: 'ID', name: 'Indonesia' },
          'Asia/Manila': { code: 'PH', name: 'Philippines' },
          'Asia/Kuala_Lumpur': { code: 'MY', name: 'Malaysia' },
          'Asia/Bangkok': { code: 'TH', name: 'Thailand' },
          'Australia/Sydney': { code: 'AU', name: 'Australia' },
          'Pacific/Auckland': { code: 'NZ', name: 'New Zealand' }
        };
        
        const timezoneMatch = timezoneCountryMap[timezone];
        if (timezoneMatch) {
          fallbackCountry = timezoneMatch.code;
          fallbackCountryName = timezoneMatch.name;
          console.log(`🕐 Using timezone-based fallback: ${fallbackCountryName} (${fallbackCountry})`);
        }
      }
      
      // No guess is better than a wrong guess: when we truly cannot tell, hand
      // back a null country so the client falls back to the browser locale.
      countryData = {
        country_code: fallbackCountry,
        country_name: fallbackCountryName,
        city: 'Unknown',
        region: 'Unknown',
        ip: clientIP || 'Unknown',
        fallback_reason: fallbackCountry
          ? 'All geolocation services failed, used timezone-based detection'
          : 'All geolocation services failed and the timezone was unknown'
      };
    }

    console.log('🎯 Final country data:', countryData);

    res.json({
      success: true,
      data: countryData,
      ip: clientIP,
      isLocalhost: finalIsLocalhost,
      debug: {
        originalIP: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        processedIP: clientIP,
        userAgent: req.headers['user-agent'],
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching country data:', error);
    
    // Return default data on error
    res.json({
      success: false,
      data: {
        country_code: null,
        country_name: null,
        city: 'Unknown',
        region: 'Unknown'
      },
      error: error.message
    });
  }
});

// Hardcoded countries list - no external API dependency
const COUNTRIES_LIST = [
  { name: 'Afghanistan', code: 'AF' }, { name: 'Albania', code: 'AL' },
  { name: 'Algeria', code: 'DZ' }, { name: 'Andorra', code: 'AD' },
  { name: 'Angola', code: 'AO' }, { name: 'Antigua and Barbuda', code: 'AG' },
  { name: 'Argentina', code: 'AR' }, { name: 'Armenia', code: 'AM' },
  { name: 'Australia', code: 'AU' }, { name: 'Austria', code: 'AT' },
  { name: 'Azerbaijan', code: 'AZ' }, { name: 'Bahamas', code: 'BS' },
  { name: 'Bahrain', code: 'BH' }, { name: 'Bangladesh', code: 'BD' },
  { name: 'Barbados', code: 'BB' }, { name: 'Belarus', code: 'BY' },
  { name: 'Belgium', code: 'BE' }, { name: 'Belize', code: 'BZ' },
  { name: 'Benin', code: 'BJ' }, { name: 'Bhutan', code: 'BT' },
  { name: 'Bolivia', code: 'BO' }, { name: 'Bosnia and Herzegovina', code: 'BA' },
  { name: 'Botswana', code: 'BW' }, { name: 'Brazil', code: 'BR' },
  { name: 'Brunei', code: 'BN' }, { name: 'Bulgaria', code: 'BG' },
  { name: 'Burkina Faso', code: 'BF' }, { name: 'Burundi', code: 'BI' },
  { name: 'Cambodia', code: 'KH' }, { name: 'Cameroon', code: 'CM' },
  { name: 'Canada', code: 'CA' }, { name: 'Cape Verde', code: 'CV' },
  { name: 'Central African Republic', code: 'CF' }, { name: 'Chad', code: 'TD' },
  { name: 'Chile', code: 'CL' }, { name: 'China', code: 'CN' },
  { name: 'Colombia', code: 'CO' }, { name: 'Comoros', code: 'KM' },
  { name: 'Congo', code: 'CG' }, { name: 'Costa Rica', code: 'CR' },
  { name: 'Croatia', code: 'HR' }, { name: 'Cuba', code: 'CU' },
  { name: 'Cyprus', code: 'CY' }, { name: 'Czech Republic', code: 'CZ' },
  { name: 'Democratic Republic of the Congo', code: 'CD' },
  { name: 'Denmark', code: 'DK' }, { name: 'Djibouti', code: 'DJ' },
  { name: 'Dominica', code: 'DM' }, { name: 'Dominican Republic', code: 'DO' },
  { name: 'Ecuador', code: 'EC' }, { name: 'Egypt', code: 'EG' },
  { name: 'El Salvador', code: 'SV' }, { name: 'Equatorial Guinea', code: 'GQ' },
  { name: 'Eritrea', code: 'ER' }, { name: 'Estonia', code: 'EE' },
  { name: 'Eswatini', code: 'SZ' }, { name: 'Ethiopia', code: 'ET' },
  { name: 'Fiji', code: 'FJ' }, { name: 'Finland', code: 'FI' },
  { name: 'France', code: 'FR' }, { name: 'Gabon', code: 'GA' },
  { name: 'Gambia', code: 'GM' }, { name: 'Georgia', code: 'GE' },
  { name: 'Germany', code: 'DE' }, { name: 'Ghana', code: 'GH' },
  { name: 'Greece', code: 'GR' }, { name: 'Grenada', code: 'GD' },
  { name: 'Guatemala', code: 'GT' }, { name: 'Guinea', code: 'GN' },
  { name: 'Guinea-Bissau', code: 'GW' }, { name: 'Guyana', code: 'GY' },
  { name: 'Haiti', code: 'HT' }, { name: 'Honduras', code: 'HN' },
  { name: 'Hungary', code: 'HU' }, { name: 'Iceland', code: 'IS' },
  { name: 'India', code: 'IN' }, { name: 'Indonesia', code: 'ID' },
  { name: 'Iran', code: 'IR' }, { name: 'Iraq', code: 'IQ' },
  { name: 'Ireland', code: 'IE' }, { name: 'Israel', code: 'IL' },
  { name: 'Italy', code: 'IT' }, { name: 'Jamaica', code: 'JM' },
  { name: 'Japan', code: 'JP' }, { name: 'Jordan', code: 'JO' },
  { name: 'Kazakhstan', code: 'KZ' }, { name: 'Kenya', code: 'KE' },
  { name: 'Kuwait', code: 'KW' }, { name: 'Kyrgyzstan', code: 'KG' },
  { name: 'Laos', code: 'LA' }, { name: 'Latvia', code: 'LV' },
  { name: 'Lebanon', code: 'LB' }, { name: 'Lesotho', code: 'LS' },
  { name: 'Liberia', code: 'LR' }, { name: 'Libya', code: 'LY' },
  { name: 'Liechtenstein', code: 'LI' }, { name: 'Lithuania', code: 'LT' },
  { name: 'Luxembourg', code: 'LU' }, { name: 'Madagascar', code: 'MG' },
  { name: 'Malawi', code: 'MW' }, { name: 'Malaysia', code: 'MY' },
  { name: 'Maldives', code: 'MV' }, { name: 'Mali', code: 'ML' },
  { name: 'Malta', code: 'MT' }, { name: 'Marshall Islands', code: 'MH' },
  { name: 'Mauritania', code: 'MR' }, { name: 'Mauritius', code: 'MU' },
  { name: 'Mexico', code: 'MX' }, { name: 'Micronesia', code: 'FM' },
  { name: 'Moldova', code: 'MD' }, { name: 'Monaco', code: 'MC' },
  { name: 'Mongolia', code: 'MN' }, { name: 'Montenegro', code: 'ME' },
  { name: 'Morocco', code: 'MA' }, { name: 'Mozambique', code: 'MZ' },
  { name: 'Myanmar', code: 'MM' }, { name: 'Namibia', code: 'NA' },
  { name: 'Nepal', code: 'NP' }, { name: 'Netherlands', code: 'NL' },
  { name: 'New Zealand', code: 'NZ' }, { name: 'Nicaragua', code: 'NI' },
  { name: 'Niger', code: 'NE' }, { name: 'Nigeria', code: 'NG' },
  { name: 'North Korea', code: 'KP' }, { name: 'North Macedonia', code: 'MK' },
  { name: 'Norway', code: 'NO' }, { name: 'Oman', code: 'OM' },
  { name: 'Pakistan', code: 'PK' }, { name: 'Palau', code: 'PW' },
  { name: 'Palestine', code: 'PS' }, { name: 'Panama', code: 'PA' },
  { name: 'Papua New Guinea', code: 'PG' }, { name: 'Paraguay', code: 'PY' },
  { name: 'Peru', code: 'PE' }, { name: 'Philippines', code: 'PH' },
  { name: 'Poland', code: 'PL' }, { name: 'Portugal', code: 'PT' },
  { name: 'Qatar', code: 'QA' }, { name: 'Romania', code: 'RO' },
  { name: 'Russia', code: 'RU' }, { name: 'Rwanda', code: 'RW' },
  { name: 'Saint Kitts and Nevis', code: 'KN' }, { name: 'Saint Lucia', code: 'LC' },
  { name: 'Saint Vincent and the Grenadines', code: 'VC' },
  { name: 'Samoa', code: 'WS' }, { name: 'San Marino', code: 'SM' },
  { name: 'Saudi Arabia', code: 'SA' }, { name: 'Senegal', code: 'SN' },
  { name: 'Serbia', code: 'RS' }, { name: 'Seychelles', code: 'SC' },
  { name: 'Sierra Leone', code: 'SL' }, { name: 'Singapore', code: 'SG' },
  { name: 'Slovakia', code: 'SK' }, { name: 'Slovenia', code: 'SI' },
  { name: 'Solomon Islands', code: 'SB' }, { name: 'Somalia', code: 'SO' },
  { name: 'South Africa', code: 'ZA' }, { name: 'South Korea', code: 'KR' },
  { name: 'South Sudan', code: 'SS' }, { name: 'Spain', code: 'ES' },
  { name: 'Sri Lanka', code: 'LK' }, { name: 'Sudan', code: 'SD' },
  { name: 'Suriname', code: 'SR' }, { name: 'Sweden', code: 'SE' },
  { name: 'Switzerland', code: 'CH' }, { name: 'Syria', code: 'SY' },
  { name: 'Taiwan', code: 'TW' }, { name: 'Tajikistan', code: 'TJ' },
  { name: 'Tanzania', code: 'TZ' }, { name: 'Thailand', code: 'TH' },
  { name: 'Timor-Leste', code: 'TL' }, { name: 'Togo', code: 'TG' },
  { name: 'Tonga', code: 'TO' }, { name: 'Trinidad and Tobago', code: 'TT' },
  { name: 'Tunisia', code: 'TN' }, { name: 'Turkey', code: 'TR' },
  { name: 'Turkmenistan', code: 'TM' }, { name: 'Tuvalu', code: 'TV' },
  { name: 'Uganda', code: 'UG' }, { name: 'Ukraine', code: 'UA' },
  { name: 'United Arab Emirates', code: 'AE' },
  { name: 'United Kingdom', code: 'GB' }, { name: 'United States', code: 'US' },
  { name: 'Uruguay', code: 'UY' }, { name: 'Uzbekistan', code: 'UZ' },
  { name: 'Vanuatu', code: 'VU' }, { name: 'Venezuela', code: 'VE' },
  { name: 'Vietnam', code: 'VN' }, { name: 'Yemen', code: 'YE' },
  { name: 'Zambia', code: 'ZM' }, { name: 'Zimbabwe', code: 'ZW' }
];

// @desc    Get all countries list
// @route   GET /api/geo/countries
// @access  Public
router.get('/countries', (req, res) => {
  const countries = COUNTRIES_LIST.map(c => c.name);
  res.json({ success: true, countries });
});

// @desc    Get all countries with code
// @route   GET /api/geo/countries-full
// @access  Public
router.get('/countries-full', (req, res) => {
  res.json({ success: true, countries: COUNTRIES_LIST });
});

// countriesnow.space uses different names for a few countries than our UI list
const COUNTRY_ALIASES = {
  "Côte d'Ivoire": 'Ivory Coast',
  'North Macedonia': 'Macedonia',
  'Eswatini': 'Swaziland',
};

// @desc    Get states for a country (proxy to avoid CORS)
// @route   POST /api/geo/states
// @access  Public
router.post('/states', async (req, res) => {
  const country = req.body?.country;
  try {
    const response = await fetch('https://countriesnow.space/api/v0.1/countries/states', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country: COUNTRY_ALIASES[country] || country }),
      timeout: 10000
    });

    // Unknown country -> upstream 404. Return an empty list instead of a server error.
    if (!response.ok) {
      console.warn(`⚠️ States unavailable for "${country}" (upstream ${response.status})`);
      return res.json({ error: false, msg: 'No states found', data: { name: country, states: [] } });
    }
    res.json(await response.json());
  } catch (error) {
    console.error('❌ States proxy failed:', error.message);
    res.json({ error: false, msg: 'No states found', data: { name: country, states: [] } });
  }
});

// @desc    Get cities for a country + state (proxy to avoid CORS)
// @route   POST /api/geo/cities
// @access  Public
router.post('/cities', async (req, res) => {
  const { country, state } = req.body || {};
  try {
    const response = await fetch('https://countriesnow.space/api/v0.1/countries/state/cities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country: COUNTRY_ALIASES[country] || country, state }),
      timeout: 10000
    });

    // Unknown country/state -> upstream 404. Return an empty list instead of a server error.
    if (!response.ok) {
      console.warn(`⚠️ Cities unavailable for "${country} / ${state}" (upstream ${response.status})`);
      return res.json({ error: false, msg: 'No cities found', data: [] });
    }
    res.json(await response.json());
  } catch (error) {
    console.error('❌ Cities proxy failed:', error.message);
    res.json({ error: false, msg: 'No cities found', data: [] });
  }
});

// @desc    Reverse-geocode coordinates to a country/city (keyless online lookup)
// @route   POST /api/geo/reverse
// @access  Public
// Used by the company profile to check that manually entered coordinates really
// point to the country the company selected.
router.post('/reverse', async (req, res) => {
  const lat = parseFloat(req.body?.latitude);
  const lng = parseFloat(req.body?.longitude);

  if (
    !Number.isFinite(lat) || !Number.isFinite(lng) ||
    Math.abs(lat) > 90 || Math.abs(lng) > 180
  ) {
    return res.status(400).json({ success: false, message: 'Valid latitude and longitude are required.' });
  }

  // Primary: BigDataCloud's client reverse-geocode endpoint — free and keyless.
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
    const response = await fetch(url, { signal: timeoutSignal(8000) });
    if (response.ok) {
      const data = await response.json();
      if (data?.countryCode) {
        return res.json({
          success: true,
          data: {
            country: data.countryName || getCountryName(data.countryCode),
            country_code: String(data.countryCode).toUpperCase(),
            city: data.city || data.locality || data.principalSubdivision || '',
            region: data.principalSubdivision || '',
            provider: 'bigdatacloud'
          }
        });
      }
    }
  } catch (error) {
    console.warn('⚠️ BigDataCloud reverse geocode failed:', error.message);
  }

  // Fallback: OpenStreetMap Nominatim (also keyless; needs a User-Agent header).
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`;
    const response = await fetch(url, {
      signal: timeoutSignal(8000),
      headers: { 'User-Agent': 'GSN-Network/1.0 (coordinate verification)' }
    });
    if (response.ok) {
      const data = await response.json();
      const address = data?.address || {};
      const code = address.country_code ? String(address.country_code).toUpperCase() : null;
      if (code) {
        return res.json({
          success: true,
          data: {
            country: address.country || getCountryName(code),
            country_code: code,
            city: address.city || address.town || address.village || address.county || '',
            region: address.state || '',
            provider: 'nominatim'
          }
        });
      }
    }
  } catch (error) {
    console.warn('⚠️ Nominatim reverse geocode failed:', error.message);
  }

  res.json({ success: false, message: 'Could not determine the location for these coordinates.' });
});

// Helper function to get country name from country code
function getCountryName(countryCode) {
  if (!countryCode) return null;
  const code = String(countryCode).toUpperCase();

  const countryNames = {
    'US': 'United States',
    'CA': 'Canada',
    'GB': 'United Kingdom',
    'AU': 'Australia',
    'DE': 'Germany',
    'FR': 'France',
    'IN': 'India',
    'AE': 'United Arab Emirates',
    'SA': 'Saudi Arabia',
    'QA': 'Qatar',
    'KW': 'Kuwait',
    'BH': 'Bahrain',
    'OM': 'Oman',
    'CN': 'China',
    'JP': 'Japan',
    'KR': 'South Korea',
    'SG': 'Singapore',
    'MY': 'Malaysia',
    'TH': 'Thailand',
    'PH': 'Philippines',
    'ID': 'Indonesia',
    'VN': 'Vietnam',
    'BD': 'Bangladesh',
    'PK': 'Pakistan',
    'LK': 'Sri Lanka',
    'NP': 'Nepal',
    'MM': 'Myanmar',
    'KH': 'Cambodia',
    'LA': 'Laos',
    'MN': 'Mongolia',
    'BT': 'Bhutan',
    'MV': 'Maldives',
    'AF': 'Afghanistan',
    'AL': 'Albania',
    'DZ': 'Algeria',
    'AD': 'Andorra',
    'AO': 'Angola',
    'AG': 'Antigua and Barbuda',
    'AR': 'Argentina',
    'AM': 'Armenia',
    'AT': 'Austria',
    'AZ': 'Azerbaijan',
    'BS': 'Bahamas',
    'BB': 'Barbados',
    'BY': 'Belarus',
    'BE': 'Belgium',
    'BZ': 'Belize',
    'BJ': 'Benin',
    'BO': 'Bolivia',
    'BA': 'Bosnia and Herzegovina',
    'BW': 'Botswana',
    'BR': 'Brazil',
    'BN': 'Brunei',
    'BG': 'Bulgaria',
    'BF': 'Burkina Faso',
    'BI': 'Burundi',
    'CV': 'Cape Verde',
    'CF': 'Central African Republic',
    'TD': 'Chad',
    'CL': 'Chile',
    'CO': 'Colombia',
    'KM': 'Comoros',
    'CG': 'Congo',
    'CD': 'Democratic Republic of the Congo',
    'CR': 'Costa Rica',
    'CI': 'Côte d\'Ivoire',
    'HR': 'Croatia',
    'CU': 'Cuba',
    'CY': 'Cyprus',
    'CZ': 'Czech Republic',
    'DK': 'Denmark',
    'DJ': 'Djibouti',
    'DM': 'Dominica',
    'DO': 'Dominican Republic',
    'EC': 'Ecuador',
    'EG': 'Egypt',
    'SV': 'El Salvador',
    'GQ': 'Equatorial Guinea',
    'ER': 'Eritrea',
    'EE': 'Estonia',
    'SZ': 'Eswatini',
    'ET': 'Ethiopia',
    'FJ': 'Fiji',
    'FI': 'Finland',
    'GA': 'Gabon',
    'GM': 'Gambia',
    'GE': 'Georgia',
    'GH': 'Ghana',
    'GR': 'Greece',
    'GD': 'Grenada',
    'GT': 'Guatemala',
    'GN': 'Guinea',
    'GW': 'Guinea-Bissau',
    'GY': 'Guyana',
    'HT': 'Haiti',
    'HN': 'Honduras',
    'HU': 'Hungary',
    'IS': 'Iceland',
    'IE': 'Ireland',
    'IL': 'Israel',
    'IT': 'Italy',
    'JM': 'Jamaica',
    'JO': 'Jordan',
    'KZ': 'Kazakhstan',
    'KE': 'Kenya',
    'KI': 'Kiribati',
    'KP': 'North Korea',
    'XK': 'Kosovo',
    'KG': 'Kyrgyzstan',
    'LV': 'Latvia',
    'LB': 'Lebanon',
    'LS': 'Lesotho',
    'LR': 'Liberia',
    'LY': 'Libya',
    'LI': 'Liechtenstein',
    'LT': 'Lithuania',
    'LU': 'Luxembourg',
    'MG': 'Madagascar',
    'MW': 'Malawi',
    'ML': 'Mali',
    'MT': 'Malta',
    'MH': 'Marshall Islands',
    'MR': 'Mauritania',
    'MU': 'Mauritius',
    'MX': 'Mexico',
    'FM': 'Micronesia',
    'MD': 'Moldova',
    'MC': 'Monaco',
    'MA': 'Morocco',
    'MZ': 'Mozambique',
    'NA': 'Namibia',
    'NR': 'Nauru',
    'NL': 'Netherlands',
    'NZ': 'New Zealand',
    'NI': 'Nicaragua',
    'NE': 'Niger',
    'NG': 'Nigeria',
    'MK': 'North Macedonia',
    'NO': 'Norway',
    'PA': 'Panama',
    'PG': 'Papua New Guinea',
    'PY': 'Paraguay',
    'PE': 'Peru',
    'PL': 'Poland',
    'PT': 'Portugal',
    'RO': 'Romania',
    'RU': 'Russia',
    'RW': 'Rwanda',
    'KN': 'Saint Kitts and Nevis',
    'LC': 'Saint Lucia',
    'VC': 'Saint Vincent and the Grenadines',
    'WS': 'Samoa',
    'SM': 'San Marino',
    'ST': 'São Tomé and Príncipe',
    'SN': 'Senegal',
    'RS': 'Serbia',
    'SC': 'Seychelles',
    'SL': 'Sierra Leone',
    'SK': 'Slovakia',
    'SI': 'Slovenia',
    'SB': 'Solomon Islands',
    'SO': 'Somalia',
    'ZA': 'South Africa',
    'SS': 'South Sudan',
    'ES': 'Spain',
    'SD': 'Sudan',
    'SR': 'Suriname',
    'SE': 'Sweden',
    'CH': 'Switzerland',
    'SY': 'Syria',
    'TW': 'Taiwan',
    'TJ': 'Tajikistan',
    'TZ': 'Tanzania',
    'TL': 'Timor-Leste',
    'TG': 'Togo',
    'TO': 'Tonga',
    'TT': 'Trinidad and Tobago',
    'TN': 'Tunisia',
    'TR': 'Turkey',
    'TM': 'Turkmenistan',
    'TV': 'Tuvalu',
    'UG': 'Uganda',
    'UA': 'Ukraine',
    'UY': 'Uruguay',
    'UZ': 'Uzbekistan',
    'VU': 'Vanuatu',
    'VA': 'Vatican City',
    'VE': 'Venezuela',
    'YE': 'Yemen',
    'ZM': 'Zambia',
    'ZW': 'Zimbabwe'
  };
  
  // Fall back to the full country list before returning the code itself — never
  // silently claim the US for an unknown country.
  return countryNames[code] ||
    COUNTRIES_LIST.find((c) => c.code === code)?.name ||
    code;
}

export default router;