/**
 * Stats Module - Typing statistics calculations
 */

/**
 * @param {number} correctChars - Correctly typed characters
 * @param {number} timeInSeconds - Time elapsed in seconds
 * @returns {number} Words per minute
 */
function calculateWPM(correctChars, timeInSeconds) {
  const words = correctChars / 5;
  const minutes = timeInSeconds / 60;
  
  if (minutes === 0) return 0;
  
  return Math.round(words / minutes);
}

/**
 * @param {number} correctChars - Correctly typed characters
 * @param {number} totalChars - Total characters typed
 * @param {number} [totalKeystrokes] - Total keystrokes including corrections
 * @param {number} [incorrectChars] - Incorrectly typed characters
 * @returns {number} Accuracy percentage
 */
function calculateAccuracy(correctChars, totalChars, totalKeystrokes, incorrectChars) {
  if (totalChars === 0) return 100;
  
  if (incorrectChars !== undefined) {
    const totalAttemptedChars = correctChars + incorrectChars;
    return Math.round((correctChars / totalAttemptedChars) * 100);
  }
  
  if (totalKeystrokes && totalKeystrokes > totalChars) {
    return Math.round((correctChars / totalKeystrokes) * 100);
  }
  
  return Math.round((correctChars / totalChars) * 100);
}

/**
 * @param {Object} currentResult - Current test result
 * @param {Array} previousResults - Previous test results
 * @returns {Object} Improvement status
 */
function calculateImprovement(currentResult, previousResults) {
  if (!previousResults || previousResults.length === 0) {
    console.log("First test, no improvement to calculate");
    return { speed: false, accuracy: false, isFirstTest: true };
  }
  
  const lastResult = previousResults[previousResults.length - 1];
  
  // Convert to numbers to ensure proper comparison
  const currentWPM = Number(currentResult.wpm);
  const lastWPM = Number(lastResult.wpm);
  const currentAccuracy = Number(currentResult.accuracy);
  const lastAccuracy = Number(lastResult.accuracy);
  
  const speedImproved = currentWPM > lastWPM;
  const accuracyImproved = currentAccuracy > lastAccuracy;
  
  console.log("Improvement calculation:", {
    currentWPM,
    lastWPM,
    speedImproved,
    currentAccuracy,
    lastAccuracy,
    accuracyImproved
  });
  
  return {
    speed: speedImproved,
    accuracy: accuracyImproved,
    isFirstTest: false,
  };
}

/**
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
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
 * @param {number} wpm - Words per minute
 * @param {number} accuracy - Accuracy percentage
 * @returns {Object} Test result object
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
