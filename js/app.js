/**
 * Main Application Module
 * Ties together all the other modules and handles the application logic
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

// DOM Elements
const elements = {
  // Test elements
  textDisplay: document.getElementById('text-display'),
  inputField: document.getElementById('input-field'),
  currentWordDisplay: document.getElementById('current-word'),
  timer: document.getElementById('timer'),
  
  // Control buttons
  startButton: document.getElementById('start-btn'),
  resetButton: document.getElementById('reset-btn'),
  
  // Results elements
  resultsSection: document.getElementById('results-section'),
  wpmDisplay: document.getElementById('wpm-display'),
  accuracyDisplay: document.getElementById('accuracy-display'),
  improvementIndicator: document.getElementById('improvement-indicator'),
  
  // History elements
  historyTable: document.getElementById('history-table'),
  historyBody: document.getElementById('history-body'),
  progressChart: document.getElementById('progress-chart'),
};

// Global variables
let typingTest;
let timer;
let chart;

// Make typingTest globally accessible for debugging
window.typingTest = typingTest;

/**
 * Initializes the application
 */
async function init() {
  // Create timer instance
  timer = new Timer(
    60, // 60 seconds
    updateTimerDisplay,
    handleTimerComplete,
  );
  
  // Create typing test instance
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
  
  // Make typingTest globally accessible for debugging
  window.typingTest = typingTest;
  
  // Add event listeners
  elements.startButton.addEventListener('click', startTest);
  elements.resetButton.addEventListener('click', resetTest);
  
  // Add keyboard shortcuts
  document.addEventListener('enter-key-pressed', startTest);
  document.addEventListener('escape-key-pressed', resetTest);
  
  // Load history data
  loadHistory();
  
  // Try to load initial text
  try {
    await loadNewText();
    elements.startButton.disabled = false;
  } catch (error) {
    showError('Failed to load text. Please try again.');
    console.error('Error loading initial text:', error);
  }
}

/**
 * Loads a new text for the typing test
 */
async function loadNewText() {
  try {
    // Show loading state
    elements.textDisplay.innerHTML = '<p>Loading text...</p>';
    elements.inputField.disabled = true;
    
    // Fetch text
    const text = await fetchText();
    
    // Set the text in the typing test
    typingTest.setText(text);
    
    // Enable the input field
    elements.inputField.disabled = false;
    
    return text;
  } catch (error) {
    console.error('Error loading text:', error);
    elements.textDisplay.innerHTML = '<p class="error">Failed to load text. Please try again.</p>';
    throw error;
  }
}

// Store reference to the space key handler
let spaceKeyHandler = null;

/**
 * Starts the typing test
 */
function startTest() {
  // Reset the test
  resetTest();
  
  // Enable the input field
  elements.inputField.disabled = false;
  
  // Focus the input field
  elements.inputField.focus();
  
  // Hide results section
  elements.resultsSection.classList.add('hidden');
  
  // Remove any existing event listener to prevent accumulation
  if (spaceKeyHandler) {
    elements.inputField.removeEventListener('keydown', spaceKeyHandler);
  }
  
  // Create a new event handler and store the reference
  spaceKeyHandler = (event) => {
    if (event.key === ' ' && typingTest.getIsActive()) {
      const currentWord = typingTest.getWords()[typingTest.getCurrentWordIndex()];
      const inputValue = elements.inputField.value.trim();
      
      if (inputValue === currentWord) {
        event.preventDefault();
        typingTest.moveToNextWord();
      }
    }
  };
  
  // Add the event listener
  elements.inputField.addEventListener('keydown', spaceKeyHandler);
}

/**
 * Resets the typing test
 */
function resetTest() {
  // Reset the timer
  timer.reset();
  
  // Reset the typing test
  typingTest.reset();
  
  // Clear and enable the input field
  elements.inputField.value = '';
  elements.inputField.disabled = false;
  
  // Enable the start button
  elements.startButton.disabled = false;
  
  // Hide results section
  elements.resultsSection.classList.add('hidden');
  
  // Load new text
  loadNewText().catch((error) => {
    console.error('Error loading new text on reset:', error);
  });
}

/**
 * Handles the start of the typing test
 */
function handleTestStart() {
  // Start the timer
  timer.start();
  
  // Disable the start button
  elements.startButton.disabled = true;
}

/**
 * Handles updates during the typing test
 * @param {Object} stats - Current test statistics
 */
function handleTestUpdate(stats) {
  // Calculate current WPM and accuracy
  const elapsedTime = 60 - timer.getRemainingTime();
  const wpm = calculateWPM(stats.correctChars, elapsedTime);
  const accuracy = calculateAccuracy(stats.correctChars, stats.totalChars);
  
  // Update the displays
  elements.wpmDisplay.textContent = wpm;
  elements.accuracyDisplay.textContent = accuracy;
}

/**
 * Handles the completion of the typing test
 * @param {Object} stats - Final test statistics
 */
function handleTestComplete(stats) {
  // Stop the timer
  timer.stop();
  
  // Calculate final WPM and accuracy
  const elapsedTime = 60 - timer.getRemainingTime();
  const wpm = calculateWPM(stats.correctChars, elapsedTime);
  const accuracy = calculateAccuracy(stats.correctChars, stats.totalChars);
  
  // Create a result object
  const result = createTestResult(wpm, accuracy);
  
  // Save the result
  saveResult(result);
  
  // Update the displays
  elements.wpmDisplay.textContent = wpm;
  elements.accuracyDisplay.textContent = accuracy;
  
  // Show improvement indicator
  showImprovementIndicator(result);
  
  // Show results section
  elements.resultsSection.classList.remove('hidden');
  
  // Update history
  updateHistory();
  
  // Enable the start button
  elements.startButton.disabled = false;
}

/**
 * Handles the completion of the timer
 */
function handleTimerComplete() {
  // Complete the test if it's active
  if (typingTest.getIsActive()) {
    typingTest.complete();
  }
}

/**
 * Updates the timer display
 * @param {number} remainingTime - Remaining time in seconds
 */
function updateTimerDisplay(remainingTime) {
  elements.timer.textContent = remainingTime;
  
  // Add visual indication when time is running low
  if (remainingTime <= 10) {
    elements.timer.classList.add('time-low');
  } else {
    elements.timer.classList.remove('time-low');
  }
}

/**
 * Shows the improvement indicator
 * @param {Object} result - Current test result
 */
function showImprovementIndicator(result) {
  // Get previous results
  const previousResults = getResults();
  
  // Calculate improvement
  const improvement = calculateImprovement(result, previousResults);
  
  // Clear previous classes
  elements.improvementIndicator.classList.remove('improved', 'declined');
  
  // Show appropriate message
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
  } else {
    elements.improvementIndicator.textContent = 'Keep practicing to improve your results.';
    elements.improvementIndicator.classList.add('declined');
  }
}

/**
 * Loads and displays the user's history
 */
function loadHistory() {
  updateHistoryTable();
  updateProgressChart();
}

/**
 * Updates the history table with the latest results
 */
function updateHistoryTable() {
  // Get all results
  const results = getResults();
  
  // Clear the table body
  elements.historyBody.innerHTML = '';
  
  // If no results, show a message
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
  
  // Add each result to the table (most recent first)
  results.slice().reverse().forEach((result) => {
    const row = document.createElement('tr');
    
    // Date cell
    const dateCell = document.createElement('td');
    dateCell.textContent = result.formattedDate;
    row.appendChild(dateCell);
    
    // WPM cell
    const wpmCell = document.createElement('td');
    wpmCell.textContent = result.wpm;
    row.appendChild(wpmCell);
    
    // Accuracy cell
    const accuracyCell = document.createElement('td');
    accuracyCell.textContent = result.accuracy;
    row.appendChild(accuracyCell);
    
    // Add the row to the table
    elements.historyBody.appendChild(row);
  });
}

/**
 * Updates the progress chart with the latest results
 */
function updateProgressChart() {
  // Get all results
  const results = getResults();
  
  // If no results, don't update the chart
  if (results.length === 0) {
    return;
  }
  
  // Prepare data for the chart
  const labels = results.map((result) => result.formattedDate);
  const wpmData = results.map((result) => result.wpm);
  const accuracyData = results.map((result) => result.accuracy);
  
  // Chart configuration
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
      animation: {
        duration: 300, // Faster animations
      },
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
  
  // If chart already exists, update it instead of destroying and recreating
  if (chart) {
    chart.data.labels = labels;
    chart.data.datasets[0].data = wpmData;
    chart.data.datasets[1].data = accuracyData;
    chart.update('none'); // Update without animation for better performance
  } else {
    // Create the chart if it doesn't exist
    chart = new Chart(elements.progressChart, chartConfig);
  }
}

/**
 * Updates the history display
 */
function updateHistory() {
  updateHistoryTable();
  updateProgressChart();
}

/**
 * Handles keyboard shortcuts
 * @param {KeyboardEvent} event - Keyboard event
 */
function handleKeyboardShortcuts(event) {
  // Enter key to restart
  if (event.key === 'Enter' && !typingTest.getIsActive()) {
    startTest();
  }
  
  // Escape key to reset
  if (event.key === 'Escape') {
    resetTest();
  }
}

/**
 * Shows an error message
 * @param {string} message - Error message to display
 */
function showError(message) {
  // Create error element
  const errorElement = document.createElement('div');
  errorElement.className = 'error-message';
  errorElement.textContent = message;
  
  // Add to the page
  document.body.appendChild(errorElement);
  
  // Remove after a delay
  setTimeout(() => {
    errorElement.classList.add('fade-out');
    setTimeout(() => {
      document.body.removeChild(errorElement);
    }, 500);
  }, 3000);
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);
