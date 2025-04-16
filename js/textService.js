/**
 * Text Service - Text fetching from APIs and local storage
 */

const TEXT_MULTIPLIER = 3;

const API_ENDPOINTS = {
  POETRY: 'https://poetrydb.org/random',
  QUOTABLE: 'https://api.quotable.io/random',
};

const LOCAL_TEXTS_PATH = 'data/texts.json';

const textCache = {
  poetry: [],
  quotable: [],
  local: [],
};

const CACHE_LIMIT = 10;

/**
 * @returns {Promise<string>} Fetched text from Poetry DB API
 */
async function fetchFromPoetryAPI() {
  try {
    if (textCache.poetry.length > 0) {
      const randomIndex = Math.floor(Math.random() * textCache.poetry.length);
      return textCache.poetry[randomIndex];
    }
    
    const response = await fetch(API_ENDPOINTS.POETRY, { 
      signal: AbortSignal.timeout(5000),
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (Array.isArray(data) && data.length > 0) {
      const text = data[0].lines.join(' ');
      
      textCache.poetry.push(text);
      
      if (textCache.poetry.length > CACHE_LIMIT) {
        textCache.poetry.shift();
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
 * @returns {Promise<string>} Fetched text from Quotable API
 */
async function fetchFromQuotableAPI() {
  try {
    if (textCache.quotable.length > 0) {
      const randomIndex = Math.floor(Math.random() * textCache.quotable.length);
      return textCache.quotable[randomIndex];
    }
    
    const response = await fetch(API_ENDPOINTS.QUOTABLE, {
      signal: AbortSignal.timeout(5000),
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.content) {
      textCache.quotable.push(data.content);
      
      if (textCache.quotable.length > CACHE_LIMIT) {
        textCache.quotable.shift();
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
 * @returns {Promise<string>} Fetched text from local JSON
 */
async function fetchFromLocalJSON() {
  try {
    if (textCache.local.length > 0) {
      const randomIndex = Math.floor(Math.random() * textCache.local.length);
      return textCache.local[randomIndex];
    }
    
    const response = await fetch(LOCAL_TEXTS_PATH);
    
    if (!response.ok) {
      throw new Error(`Failed to load local texts: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && Array.isArray(data.texts) && data.texts.length > 0) {
      data.texts.forEach((text) => {
        textCache.local.push(text.content);
      });
      
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
 * Prefetches texts to populate the cache
 */
function prefetchTexts() {
  fetchFromPoetryAPI().catch(() => {});
  fetchFromQuotableAPI().catch(() => {});
  fetchFromLocalJSON().catch(() => {});
}

/**
 * @param {Function} fetchFunction - Function to fetch a single text
 * @param {number} count - Number of texts to fetch
 * @returns {Promise<string>} Concatenated text
 */
async function fetchMultipleTexts(fetchFunction, count) {
  try {
    const texts = [];
    
    for (let i = 0; i < count; i++) {
      const text = await fetchFunction();
      // Ensure each text ends with proper punctuation but doesn't have extra spaces
      const cleanedText = text.trim().replace(/[.,:;!?]$/, '');
      texts.push(cleanedText);
    }
    
    // Join with period and space to ensure proper sentence separation
    return `${texts.join('. ')}.`;
  } catch (error) {
    console.error('Error fetching multiple texts:', error);
    throw error;
  }
}

/**
 * @returns {Promise<string>} Fetched text from any available source
 */
async function fetchText() {
  try {
    const localText = await fetchMultipleTexts(fetchFromLocalJSON, TEXT_MULTIPLIER);
    
    setTimeout(prefetchTexts, 1000);
    
    return localText;
  } catch (error) {
    console.log('Local JSON failed, trying APIs...');
    
    try {
      const fetchFunction = await Promise.race([
        Promise.resolve(fetchFromPoetryAPI),
        Promise.resolve(fetchFromQuotableAPI),
      ]);
      
      const text = await fetchMultipleTexts(fetchFunction, TEXT_MULTIPLIER);
      
      return text;
    } catch (error) {
      console.error('All sources failed:', error);
      
      const defaultText = "The quick brown fox jumps over the lazy dog. This is a simple text for typing practice.";
      return `${Array(TEXT_MULTIPLIER).fill(defaultText).join('. ')}.`;
    }
  }
}

prefetchTexts();

export { fetchText };
