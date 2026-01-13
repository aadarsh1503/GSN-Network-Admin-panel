// Location data utility for handling countries, states, and cities

// Fetch all countries from REST Countries API
export const fetchCountries = async () => {
    try {
        const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,flags');
        const countriesData = await response.json();
        const sortedCountries = countriesData
            .map(country => ({
                name: country.name.common,
                code: country.cca2,
                flag: country.flags.png
            }))
            .sort((a, b) => a.name.localeCompare(b.name));
        
        return sortedCountries;
    } catch (error) {
        console.error('Error fetching countries:', error);
        throw new Error('Failed to load countries');
    }
};

// Fetch states based on selected country
export const fetchStates = async (countryName) => {
    if (!countryName) {
        return [];
    }

    try {
        const response = await fetch(`https://countriesnow.space/api/v0.1/countries/states`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                country: countryName
            })
        });
        
        const statesData = await response.json();
        if (statesData.data && statesData.data.states) {
            const sortedStates = statesData.data.states
                .map(state => state.name)
                .sort();
            return sortedStates;
        } else {
            return [];
        }
    } catch (error) {
        console.error('Error fetching states:', error);
        return [];
    }
};

// Fetch cities based on selected country and state
export const fetchCities = async (countryName, stateName) => {
    if (!countryName || !stateName) {
        return [];
    }

    try {
        // Clean the country and state names (remove extra spaces)
        const cleanCountry = countryName.trim();
        const cleanState = stateName.trim();
        
        const response = await fetch(`https://countriesnow.space/api/v0.1/countries/state/cities`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                country: cleanCountry,
                state: cleanState
            })
        });
        
        const citiesData = await response.json();
        if (citiesData.data && Array.isArray(citiesData.data)) {
            const sortedCities = citiesData.data.sort();
            return sortedCities;
        } else {
            console.log('No cities found for:', cleanCountry, cleanState);
            return [];
        }
    } catch (error) {
        console.error('Error fetching cities:', error);
        return [];
    }
};