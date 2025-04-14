/**
 * Stats Module
 * Responsible for calculating and managing typing statistics
 */

/**
 * Calculates words per minute (WPM)
 * @param {number} correctChars - Number of correctly typed characters
 * @param {number} timeInSeconds - Time elapsed in seconds
 * @returns {number} - Words per minute
 */
function calculateWPM(correctChars, timeInSeconds) {
  // Standard calculation: 5 characters = 1 word, convert to per minute
  const words = correctChars / 5;
  const minutes = timeInSeconds / 60;
  
  // Avoid division by zero
  if (minutes === 0) return 0;
  
  return Math.round(words / minutes);
}

/**
 * Calculates typing accuracy as a percentage
 * @param {number} correctChars - Number of correctly typed characters
 * @param {number} totalChars - Total number of characters typed
 * @returns {number} - Accuracy percentage
 */
function calculateAccuracy(correctChars, totalChars) {
  // Avoid division by zero
  if (totalChars === 0) return 100;
  
  return Math.round((correctChars / totalChars) * 100);
}

/**
 * Determines if the current result is an improvement over previous results
 * @param {Object} currentResult - Current test result
 * @param {Array} previousResults - Array of previous test results
 * @returns {Object} - Improvement status for speed and accuracy
 */
function calculateImprovement(currentResult, previousResults) {
  if (!previousResults || previousResults.length === 0) {
    return { speed: false, accuracy: false, isFirstTest: true };
  }
  
  // Get the most recent result
  const lastResult = previousResults[previousResults.length - 1];
  
  return {
    speed: currentResult.wpm > lastResult.wpm,
    accuracy: currentResult.accuracy > lastResult.accuracy,
    isFirstTest: false,
  };
}

/**
 * Formats a date object to a readable string
 * @param {Date} date - Date to format
 * @returns {string} - Formatted date string
 */
function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Creates a new test result object
 * @param {number} wpm - Words per minute
 * @param {number} accuracy - Accuracy percentage
 * @returns {Object} - Test result object
 */
function createTestResult(wpm, accuracy) {
  return {
    wpm,
    accuracy,
    date: new Date(),
    formattedDate: formatDate(new Date()),
  };
}

export {
  calculateWPM,
  calculateAccuracy,
  calculateImprovement,
  formatDate,
  createTestResult,
};
