/**
 * Storage Module
 * Responsible for saving and retrieving user data from localStorage
 */

// Local storage key for typing test results
const STORAGE_KEY = 'typing_test_results';

/**
 * Saves a test result to localStorage
 * @param {Object} result - Test result object to save
 */
function saveResult(result) {
  try {
    // Get existing results
    const results = getResults();
    
    // Add new result
    results.push(result);
    
    // Save back to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
    
    return true;
  } catch (error) {
    console.error('Error saving result to localStorage:', error);
    return false;
  }
}

/**
 * Retrieves all test results from localStorage
 * @returns {Array} - Array of test result objects
 */
function getResults() {
  try {
    const resultsJSON = localStorage.getItem(STORAGE_KEY);
    
    // If no results exist yet, return empty array
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
 * Clears all test results from localStorage
 * @returns {boolean} - True if successful, false otherwise
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
 * Gets the most recent test result
 * @returns {Object|null} - Most recent test result or null if none exists
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
