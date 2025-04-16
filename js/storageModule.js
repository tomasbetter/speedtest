/**
 * Storage Module - LocalStorage data persistence
 */
const STORAGE_KEY = 'typing_test_results';

/**
 * @param {Object} result - Test result to save
 * @returns {boolean} Success status
 */
function saveResult(result) {
  try {
    const results = getResults();
    results.push(result);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
    return true;
  } catch (error) {
    console.error('Error saving result to localStorage:', error);
    return false;
  }
}

/**
 * @returns {Array} All saved test results
 */
function getResults() {
  try {
    const resultsJSON = localStorage.getItem(STORAGE_KEY);
    
    if (!resultsJSON) {
      return [];
    }
    
    return JSON.parse(resultsJSON);
  } catch (error) {
    console.error('Error retrieving results from localStorage:', error);
    return [];
  }
}

/**
 * @returns {boolean} Success status
 */
function clearResults() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing results from localStorage:', error);
    return false;
  }
}

/**
 * @returns {Object|null} Most recent test result
 */
function getLatestResult() {
  const results = getResults();
  
  if (results.length === 0) {
    return null;
  }
  
  return results[results.length - 1];
}

export {
  saveResult,
  getResults,
  clearResults,
  getLatestResult,
};
