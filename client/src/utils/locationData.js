// Location data utility for handling countries, states, and cities

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Fetch all countries via backend proxy (avoids CORS)
export const fetchCountries = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/geo/countries-full`);
        const data = await response.json();
        if (!data.success) throw new Error('Failed to load countries');
        return data.countries;
    } catch (error) {
        console.error('Error fetching countries:', error);
        throw new Error('Failed to load countries');
    }
};

// Fetch states based on selected country
export const fetchStates = async (countryName) => {
    if (!countryName) return [];
    try {
        const response = await fetch(`${API_BASE_URL}/api/geo/states`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ country: countryName })
        });
        const statesData = await response.json();
        if (statesData.data && statesData.data.states) {
            return statesData.data.states.map(state => state.name).sort();
        }
        return [];
    } catch (error) {
        console.error('Error fetching states:', error);
        return [];
    }
};

// Fetch cities based on selected country and state
export const fetchCities = async (countryName, stateName) => {
    if (!countryName || !stateName) return [];
    try {
        const response = await fetch(`${API_BASE_URL}/api/geo/cities`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ country: countryName.trim(), state: stateName.trim() })
        });
        const citiesData = await response.json();
        if (citiesData.data && Array.isArray(citiesData.data)) {
            return citiesData.data.sort();
        }
        return [];
    } catch (error) {
        console.error('Error fetching cities:', error);
        return [];
    }
};