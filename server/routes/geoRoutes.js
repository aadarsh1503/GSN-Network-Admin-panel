// Geolocation routes for IP-based country detection
import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

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
      
      // Try to get public IP from external services
      const publicIPServices = [
        'https://api.ipify.org?format=json',
        'https://ipinfo.io/json',
        'http://ip-api.com/json/',
        'https://api.myip.com'
      ];

      for (const service of publicIPServices) {
        try {
          console.log(`Trying public IP service: ${service}`);
          const response = await fetch(service, { timeout: 5000 });
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

    // Enhanced geolocation services with better error handling
    const services = [
      {
        name: 'ipinfo.io',
        url: finalIsLocalhost ? 'https://ipinfo.io/json' : `https://ipinfo.io/${clientIP}/json`,
        transform: (data) => ({
          country_code: data.country || 'US',
          country_name: getCountryName(data.country) || 'United States',
          city: data.city || 'Unknown',
          region: data.region || 'Unknown',
          ip: data.ip || clientIP
        })
      },
      {
        name: 'ip-api.com',
        url: finalIsLocalhost ? 'http://ip-api.com/json/' : `http://ip-api.com/json/${clientIP}`,
        transform: (data) => ({
          country_code: data.countryCode || 'US',
          country_name: data.country || 'United States',
          city: data.city || 'Unknown',
          region: data.regionName || 'Unknown',
          ip: data.query || clientIP
        })
      },
      {
        name: 'ipapi.co',
        url: finalIsLocalhost ? 'https://ipapi.co/json/' : `https://ipapi.co/${clientIP}/json/`,
        transform: (data) => ({
          country_code: data.country_code || 'US',
          country_name: data.country_name || 'United States',
          city: data.city || 'Unknown',
          region: data.region || 'Unknown',
          ip: data.ip || clientIP
        })
      },
      {
        name: 'ipgeolocation.io',
        url: finalIsLocalhost ? 'https://api.ipgeolocation.io/ipgeo?apiKey=free' : `https://api.ipgeolocation.io/ipgeo?apiKey=free&ip=${clientIP}`,
        transform: (data) => ({
          country_code: data.country_code2 || 'US',
          country_name: data.country_name || 'United States',
          city: data.city || 'Unknown',
          region: data.state_prov || 'Unknown',
          ip: data.ip || clientIP
        })
      }
    ];

    // Try each service until one works
    for (const service of services) {
      try {
        console.log(`🔄 Trying ${service.name}...`);
        const response = await fetch(service.url, {
          timeout: 8000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; QuoteApp/1.0)'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`📊 ${service.name} raw response:`, data);
          
          countryData = service.transform(data);
          console.log(`✅ ${service.name} success:`, countryData);
          
          // Validate the data
          if (countryData.country_code && countryData.country_code !== 'undefined') {
            break;
          } else {
            console.log(`⚠️ ${service.name} returned invalid data, trying next service...`);
            countryData = null;
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
      
      // Try to determine country based on timezone or other hints
      const timezone = req.headers['timezone'] || Intl.DateTimeFormat().resolvedOptions().timeZone;
      console.log('Detected timezone:', timezone);
      
      let fallbackCountry = 'US';
      let fallbackCountryName = 'United States';
      
      // Basic timezone to country mapping for common cases
      if (timezone) {
        const timezoneCountryMap = {
          'Asia/Kolkata': { code: 'IN', name: 'India' },
          'Asia/Calcutta': { code: 'IN', name: 'India' },
          'Asia/Mumbai': { code: 'IN', name: 'India' },
          'Asia/Delhi': { code: 'IN', name: 'India' },
          'Europe/London': { code: 'GB', name: 'United Kingdom' },
          'America/New_York': { code: 'US', name: 'United States' },
          'America/Los_Angeles': { code: 'US', name: 'United States' },
          'Asia/Dubai': { code: 'AE', name: 'United Arab Emirates' },
          'Asia/Shanghai': { code: 'CN', name: 'China' },
          'Asia/Tokyo': { code: 'JP', name: 'Japan' },
          'Australia/Sydney': { code: 'AU', name: 'Australia' },
          'Europe/Berlin': { code: 'DE', name: 'Germany' },
          'Europe/Paris': { code: 'FR', name: 'France' }
        };
        
        const timezoneMatch = timezoneCountryMap[timezone];
        if (timezoneMatch) {
          fallbackCountry = timezoneMatch.code;
          fallbackCountryName = timezoneMatch.name;
          console.log(`🕐 Using timezone-based fallback: ${fallbackCountryName} (${fallbackCountry})`);
        }
      }
      
      countryData = {
        country_code: fallbackCountry,
        country_name: fallbackCountryName,
        city: 'Unknown',
        region: 'Unknown',
        ip: clientIP || 'Unknown',
        fallback_reason: 'All geolocation services failed, used timezone-based detection'
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
        country_code: 'US',
        country_name: 'United States',
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

// @desc    Get states for a country (proxy to avoid CORS)
// @route   POST /api/geo/states
// @access  Public
router.post('/states', async (req, res) => {
  try {
    const { country } = req.body;
    const response = await fetch('https://countriesnow.space/api/v0.1/countries/states', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country }),
      timeout: 10000
    });

    if (!response.ok) throw new Error(`countriesnow error: ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('❌ States proxy failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Get cities for a country + state (proxy to avoid CORS)
// @route   POST /api/geo/cities
// @access  Public
router.post('/cities', async (req, res) => {
  try {
    const { country, state } = req.body;
    const response = await fetch('https://countriesnow.space/api/v0.1/countries/state/cities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country, state }),
      timeout: 10000
    });

    if (!response.ok) throw new Error(`countriesnow error: ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('❌ Cities proxy failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper function to get country name from country code
function getCountryName(countryCode) {
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
  
  return countryNames[countryCode] || 'United States';
}

export default router;