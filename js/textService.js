/**
 * Text Service Module
 * Responsible for fetching text from API or local JSON file
 */

// Number of texts to concatenate for longer typing sessions
const TEXT_MULTIPLIER = 3;

// API endpoints
const API_ENDPOINTS = {
    POETRY: 'https://poetrydb.org/random',
    QUOTABLE: 'https://api.quotable.io/random'
};

// Local fallback path
const LOCAL_TEXTS_PATH = 'data/texts.json';

// Cache for API responses
const textCache = {
    poetry: [],
    quotable: [],
    local: []
};

// Cache size limits
const CACHE_LIMIT = 10;

/**
 * Fetches text from the Poetry DB API
 * @returns {Promise<string>} The fetched text
 */
async function fetchFromPoetryAPI() {
    try {
        // Use cached response if available
        if (textCache.poetry.length > 0) {
            // Get a random text from the cache
            const randomIndex = Math.floor(Math.random() * textCache.poetry.length);
            return textCache.poetry[randomIndex];
        }
        
        const response = await fetch(API_ENDPOINTS.POETRY, { 
            signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Poetry API returns an array with a single poem object
        if (Array.isArray(data) && data.length > 0) {
            // Join the lines of the poem with spaces
            const text = data[0].lines.join(' ');
            
            // Add to cache
            textCache.poetry.push(text);
            
            // Limit cache size
            if (textCache.poetry.length > CACHE_LIMIT) {
                textCache.poetry.shift(); // Remove oldest entry
            }
            
            return text;
        } else {
            throw new Error('Unexpected API response format');
        }
    } catch (error) {
        console.error('Error fetching from Poetry API:', error);
        throw error;
    }
}

/**
 * Fetches text from the Quotable API
 * @returns {Promise<string>} The fetched text
 */
async function fetchFromQuotableAPI() {
    try {
        // Use cached response if available
        if (textCache.quotable.length > 0) {
            // Get a random text from the cache
            const randomIndex = Math.floor(Math.random() * textCache.quotable.length);
            return textCache.quotable[randomIndex];
        }
        
        const response = await fetch(API_ENDPOINTS.QUOTABLE, {
            signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.content) {
            // Add to cache
            textCache.quotable.push(data.content);
            
            // Limit cache size
            if (textCache.quotable.length > CACHE_LIMIT) {
                textCache.quotable.shift(); // Remove oldest entry
            }
            
            return data.content;
        } else {
            throw new Error('Unexpected API response format');
        }
    } catch (error) {
        console.error('Error fetching from Quotable API:', error);
        throw error;
    }
}

/**
 * Fetches text from local JSON file
 * @returns {Promise<string>} The fetched text
 */
async function fetchFromLocalJSON() {
    try {
        // Use cached response if available
        if (textCache.local.length > 0) {
            // Get a random text from the cache
            const randomIndex = Math.floor(Math.random() * textCache.local.length);
            return textCache.local[randomIndex];
        }
        
        const response = await fetch(LOCAL_TEXTS_PATH);
        
        if (!response.ok) {
            throw new Error(`Failed to load local texts: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && Array.isArray(data.texts) && data.texts.length > 0) {
            // Cache all local texts
            data.texts.forEach(text => {
                textCache.local.push(text.content);
            });
            
            // Get a random text from the array
            const randomIndex = Math.floor(Math.random() * data.texts.length);
            return data.texts[randomIndex].content;
        } else {
            throw new Error('Invalid local texts format');
        }
    } catch (error) {
        console.error('Error fetching from local JSON:', error);
        throw error;
    }
}

/**
 * Prefetches texts in the background to populate the cache
 */
function prefetchTexts() {
    // Prefetch from Poetry API
    fetchFromPoetryAPI().catch(() => {});
    
    // Prefetch from Quotable API
    fetchFromQuotableAPI().catch(() => {});
    
    // Prefetch from local JSON
    fetchFromLocalJSON().catch(() => {});
}

/**
 * Fetches multiple texts and concatenates them
 * @param {Function} fetchFunction - The function to fetch a single text
 * @param {number} count - Number of texts to fetch
 * @returns {Promise<string>} The concatenated text
 */
async function fetchMultipleTexts(fetchFunction, count) {
    try {
        const texts = [];
        
        // Fetch the specified number of texts
        for (let i = 0; i < count; i++) {
            const text = await fetchFunction();
            texts.push(text);
        }
        
        // Join the texts with a period and space
        return texts.join('. ') + '.';
    } catch (error) {
        console.error('Error fetching multiple texts:', error);
        throw error;
    }
}

/**
 * Fetches text from any available source
 * Tries multiple sources simultaneously and uses the fastest one
 * @returns {Promise<string>} The fetched text
 */
async function fetchText() {
    try {
        // Try to fetch from local JSON first (should be fastest)
        const localText = await fetchMultipleTexts(fetchFromLocalJSON, TEXT_MULTIPLIER);
        
        // Start prefetching in the background for next time
        setTimeout(prefetchTexts, 1000);
        
        return localText;
    } catch (error) {
        console.log('Local JSON failed, trying APIs...');
        
        // If local JSON fails, try both APIs simultaneously
        try {
            // Use Promise.race to get the first successful API response
            const fetchFunction = await Promise.race([
                Promise.resolve(fetchFromPoetryAPI),
                Promise.resolve(fetchFromQuotableAPI)
            ]);
            
            // Fetch multiple texts using the successful API
            const text = await fetchMultipleTexts(fetchFunction, TEXT_MULTIPLIER);
            
            return text;
        } catch (error) {
            console.error('All sources failed:', error);
            
            // Return a default text if all sources fail
            const defaultText = "The quick brown fox jumps over the lazy dog. This is a simple text for typing practice.";
            // Repeat the default text multiple times
            return Array(TEXT_MULTIPLIER).fill(defaultText).join('. ') + '.';
        }
    }
}

// Prefetch texts when the module is loaded
prefetchTexts();

export { fetchText };
