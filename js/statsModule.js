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
  // Handle first test case
  if (!previousResults || previousResults.length === 0) {
    console.log("First test, no improvement to calculate");
    return { 
      speed: false, 
      accuracy: false, 
      isFirstTest: true,
      bestWPM: 0,
      bestAccuracy: 0
    };
  }
  
  // Get the most recent previous result for comparison
  const lastResult = previousResults[previousResults.length - 1];
  
  // Find personal best WPM and accuracy
  const bestWPM = Math.max(...previousResults.map(r => Number(r.wpm)));
  const bestAccuracy = Math.max(...previousResults.map(r => Number(r.accuracy)));
  
  // Convert to numbers to ensure proper comparison
  const currentWPM = Number(currentResult.wpm);
  const lastWPM = Number(lastResult.wpm);
  const currentAccuracy = Number(currentResult.accuracy);
  const lastAccuracy = Number(lastResult.accuracy);
  
  // Calculate improvements over last test
  const speedImproved = currentWPM > lastWPM;
  const accuracyImproved = currentAccuracy > lastAccuracy;
  
  // Check if current performance matches or is close to personal best
  const matchesSpeedBest = currentWPM === bestWPM;
  const matchesAccuracyBest = currentAccuracy === bestAccuracy;
  const matchesBest = matchesSpeedBest && matchesAccuracyBest;
  
  // Check if close to personal best (within 5% for speed, 2% for accuracy)
  const closeToSpeedBest = !matchesSpeedBest && currentWPM >= bestWPM * 0.95;
  const closeToAccuracyBest = !matchesAccuracyBest && currentAccuracy >= bestAccuracy * 0.98;
  
  // Log detailed information for debugging
  console.log("Improved improvement calculation:", {
    currentWPM,
    lastWPM,
    bestWPM,
    speedImproved,
    matchesSpeedBest,
    closeToSpeedBest,
    currentAccuracy,
    lastAccuracy,
    bestAccuracy,
    accuracyImproved,
    matchesAccuracyBest,
    closeToAccuracyBest,
    matchesBest
  });
  
  // Return the enhanced improvement status
  return {
    speed: speedImproved,
    accuracy: accuracyImproved,
    matchesBest: matchesBest,
    matchesSpeedBest: matchesSpeedBest,
    matchesAccuracyBest: matchesAccuracyBest,
    closeToSpeedBest: closeToSpeedBest,
    closeToAccuracyBest: closeToAccuracyBest,
    bestWPM: bestWPM,
    bestAccuracy: bestAccuracy,
    isFirstTest: false
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
