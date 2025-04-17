/**
 * Main Application - Coordinates typing test functionality
 */

import { fetchText } from './textService.js';
import { Timer } from './timerModule.js';
import { TypingTest } from './typingTest.js';
import {
  calculateWPM,
  calculateAccuracy,
  calculateImprovement,
  createTestResult,
} from './statsModule.js';
import {
  saveResult,
  getResults,
  getLatestResult,
} from './storageModule.js';

const elements = {
  textDisplay: document.getElementById('text-display'),
  inputField: document.getElementById('input-field'),
  currentWordDisplay: document.getElementById('current-word'),
  timer: document.getElementById('timer'),
  
  startButton: document.getElementById('start-btn'),
  resetButton: document.getElementById('reset-btn'),
  
  resultsSection: document.getElementById('results-section'),
  wpmDisplay: document.getElementById('wpm-display'),
  accuracyDisplay: document.getElementById('accuracy-display'),
  improvementIndicator: document.getElementById('improvement-indicator'),
  
  historyTable: document.getElementById('history-table'),
  historyBody: document.getElementById('history-body'),
  progressChart: document.getElementById('progress-chart'),
};

let typingTest;
let timer;
let chart;

async function init() {
  timer = new Timer(
    60,
    updateTimerDisplay,
    handleTimerComplete,
  );
  
  typingTest = new TypingTest(
    {
      textDisplay: elements.textDisplay,
      inputField: elements.inputField,
      currentWordDisplay: elements.currentWordDisplay,
    },
    {
      onStart: handleTestStart,
      onComplete: handleTestComplete,
      onUpdate: handleTestUpdate,
    },
  );
  
  window.typingTest = typingTest;
  
  elements.startButton.addEventListener('click', startTest);
  elements.resetButton.addEventListener('click', resetTest);
  
  document.addEventListener('enter-key-pressed', startTest);
  document.addEventListener('escape-key-pressed', resetTest);
  
  loadHistory();
  
  try {
    await loadNewText();
    elements.startButton.disabled = false;
  } catch (error) {
    showError('Failed to load text. Please try again.');
    console.error('Error loading initial text:', error);
  }
}

/**
 * Load new text for typing test
 */
async function loadNewText() {
  try {
    elements.textDisplay.innerHTML = '<p>Loading text...</p>';
    elements.inputField.disabled = true;
    
    const text = await fetchText();
    typingTest.setText(text);
    elements.inputField.disabled = false;
    
    return text;
  } catch (error) {
    console.error('Error loading text:', error);
    elements.textDisplay.innerHTML = '<p class="error">Failed to load text. Please try again.</p>';
    throw error;
  }
}

/**
 * Start typing test
 */
function startTest() {
  resetTest();
  
  elements.inputField.disabled = false;
  elements.inputField.focus();
  elements.resultsSection.classList.add('hidden');
}

/**
 * Reset typing test
 */
function resetTest() {
  timer.reset();
  
  // First reset the typing test
  typingTest.reset();
  
  elements.inputField.value = '';
  elements.inputField.disabled = false;
  elements.startButton.disabled = false;
  elements.resultsSection.classList.add('hidden');
  
  // Load new text and ensure it's properly set
  loadNewText()
    .then(() => {
      // Make sure the typing test is fully reset after new text is loaded
      typingTest.reset();
      console.log('Test reset complete with new text');
    })
    .catch((error) => {
      console.error('Error loading new text on reset:', error);
    });
}

/**
 * Handle test start
 */
function handleTestStart() {
  timer.start();
  elements.startButton.disabled = true;
}

/**
 * @param {Object} stats - Current test statistics
 */
function handleTestUpdate(stats) {
  const elapsedTime = 60 - timer.getRemainingTime();
  const wpm = calculateWPM(stats.correctChars, elapsedTime);
  const accuracy = calculateAccuracy(stats.correctChars, stats.totalChars, stats.totalKeystrokes);
  
  elements.wpmDisplay.textContent = wpm;
  elements.accuracyDisplay.textContent = accuracy;
}

/**
 * @param {Object} stats - Final test statistics
 */
function handleTestComplete(stats) {
  timer.stop();
  
  const elapsedTime = 60 - timer.getRemainingTime();
  const wpm = calculateWPM(stats.correctChars, elapsedTime);
  const accuracy = calculateAccuracy(stats.correctChars, stats.totalChars, stats.totalKeystrokes);
  
  // Get previous results BEFORE saving the current result
  const previousResults = getResults();
  
  const result = createTestResult(wpm, accuracy);
  
  // Update display
  elements.wpmDisplay.textContent = wpm;
  elements.accuracyDisplay.textContent = accuracy;
  
  // Show improvement indicator with previous results
  showImprovementIndicator(result, previousResults);
  
  // Save the result AFTER calculating improvement
  saveResult(result);
  
  // Show results section
  elements.resultsSection.classList.remove('hidden');
  updateHistory();
  elements.startButton.disabled = false;
}

/**
 * Handle timer completion
 */
function handleTimerComplete() {
  if (typingTest.getIsActive()) {
    typingTest.complete();
  }
}

/**
 * @param {number} remainingTime - Remaining time in seconds
 */
function updateTimerDisplay(remainingTime) {
  elements.timer.textContent = remainingTime;
  
  if (remainingTime <= 10) {
    elements.timer.classList.add('time-low');
  } else {
    elements.timer.classList.remove('time-low');
  }
}

/**
 * @param {Object} result - Current test result
 * @param {Array} [previousResults] - Previous test results (optional)
 */
function showImprovementIndicator(result, previousResults) {
  // If previousResults not provided, get them (for backward compatibility)
  if (!previousResults) {
    previousResults = getResults();
  }
  
  const improvement = calculateImprovement(result, previousResults);
  
  elements.improvementIndicator.classList.remove('improved', 'declined');
  
  if (improvement.isFirstTest) {
    elements.improvementIndicator.textContent = 'This is your first test!';
  } else if (improvement.speed && improvement.accuracy) {
    elements.improvementIndicator.textContent = 'Great job! You improved both speed and accuracy.';
    elements.improvementIndicator.classList.add('improved');
  } else if (improvement.speed) {
    elements.improvementIndicator.textContent = 'You improved your typing speed!';
    elements.improvementIndicator.classList.add('improved');
  } else if (improvement.accuracy) {
    elements.improvementIndicator.textContent = 'You improved your typing accuracy!';
    elements.improvementIndicator.classList.add('improved');
  } else if (improvement.matchesBest) {
    elements.improvementIndicator.textContent = `Excellent consistency! You matched your personal best: ${improvement.bestWPM} WPM / ${improvement.bestAccuracy}% accuracy.`;
    elements.improvementIndicator.classList.add('improved');
  } else if (improvement.closeToSpeedBest || improvement.closeToAccuracyBest) {
    elements.improvementIndicator.textContent = `Almost there! You're very close to your personal best: ${improvement.bestWPM} WPM / ${improvement.bestAccuracy}% accuracy.`;
    elements.improvementIndicator.classList.add('improved');
  } else {
    elements.improvementIndicator.textContent = `Keep practicing to improve your results. Your best: ${improvement.bestWPM} WPM / ${improvement.bestAccuracy}% accuracy.`;
    elements.improvementIndicator.classList.add('declined');
  }
}

/**
 * Load and display history
 */
function loadHistory() {
  updateHistoryTable();
  updateProgressChart();
}

/**
 * Update history table with latest results
 */
function updateHistoryTable() {
  const results = getResults();
  elements.historyBody.innerHTML = '';
  
  if (results.length === 0) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 3;
    cell.textContent = 'No history yet. Complete a test to see your results.';
    cell.style.textAlign = 'center';
    row.appendChild(cell);
    elements.historyBody.appendChild(row);
    return;
  }
  
  results.slice().reverse().forEach((result) => {
    const row = document.createElement('tr');
    
    const dateCell = document.createElement('td');
    dateCell.textContent = result.formattedDate;
    row.appendChild(dateCell);
    
    const wpmCell = document.createElement('td');
    wpmCell.textContent = result.wpm;
    row.appendChild(wpmCell);
    
    const accuracyCell = document.createElement('td');
    accuracyCell.textContent = result.accuracy;
    row.appendChild(accuracyCell);
    
    elements.historyBody.appendChild(row);
  });
}

/**
 * Update progress chart with latest results
 */
function updateProgressChart() {
  const results = getResults();
  
  if (results.length === 0) {
    return;
  }
  
  const labels = results.map((result) => result.formattedDate);
  const wpmData = results.map((result) => result.wpm);
  const accuracyData = results.map((result) => result.accuracy);
  
  const chartConfig = {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Speed (WPM)',
          data: wpmData,
          borderColor: '#3498db',
          backgroundColor: 'rgba(52, 152, 219, 0.1)',
          tension: 0.1,
          yAxisID: 'y',
        },
        {
          label: 'Accuracy (%)',
          data: accuracyData,
          borderColor: '#2ecc71',
          backgroundColor: 'rgba(46, 204, 113, 0.1)',
          tension: 0.1,
          yAxisID: 'y1',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 300 },
      scales: {
        y: {
          beginAtZero: true,
          position: 'left',
          title: {
            display: true,
            text: 'Speed (WPM)',
          },
        },
        y1: {
          beginAtZero: true,
          position: 'right',
          min: 0,
          max: 100,
          title: {
            display: true,
            text: 'Accuracy (%)',
          },
          grid: {
            drawOnChartArea: false,
          },
        },
      },
    },
  };
  
  if (chart) {
    chart.data.labels = labels;
    chart.data.datasets[0].data = wpmData;
    chart.data.datasets[1].data = accuracyData;
    chart.update('none'); // Better performance
  } else {
    chart = new Chart(elements.progressChart, chartConfig);
  }
}

/**
 * Update history display
 */
function updateHistory() {
  updateHistoryTable();
  updateProgressChart();
}

/**
 * @param {KeyboardEvent} event - Keyboard event
 */
function handleKeyboardShortcuts(event) {
  if (event.key === 'Enter' && !typingTest.getIsActive()) {
    startTest();
  }
  
  if (event.key === 'Escape') {
    resetTest();
  }
}

/**
 * @param {string} message - Error message to display
 */
function showError(message) {
  const errorElement = document.createElement('div');
  errorElement.className = 'error-message';
  errorElement.textContent = message;
  
  document.body.appendChild(errorElement);
  
  setTimeout(() => {
    errorElement.classList.add('fade-out');
    setTimeout(() => {
      document.body.removeChild(errorElement);
    }, 500);
  }, 3000);
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', init);
