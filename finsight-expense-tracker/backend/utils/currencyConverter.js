const axios = require('axios');
const logger = require('./logger');

// Cache simple rates to avoid hitting API limit
let cachedRates = {};
let lastFetch = null;

const getExchangeRates = async () => {
    const CACHE_TIME = 3600000; // 1 hour

    if (lastFetch && (Date.now() - lastFetch < CACHE_TIME)) {
        return cachedRates;
    }

    try {
        // Using a free API for demonstration. In production, use a paid one.
        const res = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
        cachedRates = res.data.rates;
        lastFetch = Date.now();
        return cachedRates;
    } catch (error) {
        logger.error('Currency API Error:', error.message);
        // Fallback rates if API fails
        return { USD: 1, EUR: 0.92, GBP: 0.79, ETB: 56.5, KES: 130 };
    }
};

const convertCurrency = async (amount, from, to) => {
    if (from === to) return amount;

    const rates = await getExchangeRates();
    if (!rates[from] || !rates[to]) return amount;

    // Convert to USD first (base), then to target
    const amountInUSD = amount / rates[from];
    return (amountInUSD * rates[to]).toFixed(2);
};

module.exports = { convertCurrency, getExchangeRates };
