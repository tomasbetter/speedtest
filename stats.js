/**
 * Starts tracking WPM (Words Per Minute) and sets up periodic updates
 * Initializes the typing start time and sets an interval to update metrics
 */
function startWpmTracking() {
    window.typingStartTime = new Date();
    
    if (window.wpmUpdateInterval !== null) {
        clearInterval(window.wpmUpdateInterval);
    }
    
    window.wpmUpdateInterval = setInterval(() => {
        updateWpm();
        updateAccuracy();
    }, 500);
}

/**
 * Calculates the current WPM based on correctly typed words and elapsed time
 * @returns {number} The calculated WPM or 0 if conditions aren't met
 */
function calculateWpm() {
    if (!window.typingStartTime || !window.timerStarted || window.timerFinished) return 0;

    const currentTime = new Date();
    const elapsedMinutes = (currentTime - window.typingStartTime) / 60000; 

    const wordsCompleted = window.correctWordsCount;
    return elapsedMinutes > 0 ? Math.round(wordsCompleted / elapsedMinutes) : 0;
}

/**
 * Updates the WPM display with the current calculated value
 */
function updateWpm() {
    const wpm = calculateWpm();
    document.getElementById('wpm').textContent = `WPM: ${wpm}`;
}

/**
 * Retrieves typing history from local storage
 * @returns {Array} Array of typing history records or empty array if none exists
 */
function getTypingHistory() {
    return JSON.parse(localStorage.getItem('wpmHistory')) || [];
}

/**
 * Formats a timestamp into a readable date and time string
 * @param {string} timestamp - ISO timestamp string
 * @returns {string} Formatted date and time
 */
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}

/**
 * Creates HTML for a single typing history record
 * @param {Object} record - A typing history record
 * @returns {string} HTML string for the record
 */
function createHistoryRecordHTML(record) {
    const formattedDate = formatTimestamp(record.timestamp);
    
    const accuracyDisplay = record.accuracy !== undefined ?
        ` - Accuracy: <strong>${record.accuracy}%</strong>` : '';
    
    return `<li>WPM: <strong>${record.wpm}</strong> - Words: ${record.wordsCompleted}${accuracyDisplay} - ${formattedDate}</li>`;
}

/**
 * Creates a chart to visualize WPM and accuracy over time
 * @param {Array} wpmHistory - Array of typing history records
 */
function createStatsChart(wpmHistory) {
    // Clear any existing chart
    const chartContainer = document.getElementById('chart-container');
    const canvas = document.getElementById('stats-chart');
    
    // If there's no history or less than 2 records, don't create a chart
    if (!wpmHistory || wpmHistory.length < 2) {
        chartContainer.style.display = 'none';
        return;
    }
    
    chartContainer.style.display = 'block';
    
    // Prepare data for the chart
    const sortedHistory = [...wpmHistory].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const labels = sortedHistory.map(record => {
        const date = new Date(record.timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });
    
    const wpmData = sortedHistory.map(record => record.wpm);
    const accuracyData = sortedHistory.map(record => record.accuracy);
    
    // Create the chart
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.statsChart) {
        window.statsChart.destroy();
    }
    
    window.statsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'WPM',
                    data: wpmData,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.1,
                    yAxisID: 'y'
                },
                {
                    label: 'Accuracy (%)',
                    data: accuracyData,
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    tension: 0.1,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Words Per Minute'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Accuracy (%)'
                    },
                    min: 0,
                    max: 100,
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
}

/**
 * Displays the user's typing history statistics
 */
function displayWpmStats() {
    console.log("Displaying WPM stats");
    const statsElement = document.getElementById('stats');
    const wpmHistory = getTypingHistory();
    
    if (wpmHistory.length === 0) {
        statsElement.innerHTML = 'No typing statistics available yet.';
        document.getElementById('chart-container').style.display = 'none';
        return;
    }
    
    let statsHTML = '<h3>Your Typing History</h3><ul>';
    
    // Create a copy of the history array to avoid modifying the original
    const displayHistory = [...wpmHistory].reverse();
    
    displayHistory.forEach(record => {
        statsHTML += createHistoryRecordHTML(record);
    });
    
    statsHTML += '</ul>';
    statsElement.innerHTML = statsHTML;
    
    // Create the chart with the original (non-reversed) history
    createStatsChart(wpmHistory);
}

/**
 * Gets the most recent previous typing attempt for comparison
 * @returns {Object|null} The most recent previous attempt or null if none exists
 */
function getMostRecentPreviousAttempt() {
    const wpmHistory = getTypingHistory();
    
    if (wpmHistory.length === 0) {
        return null;
    }
    
    const previousAttempts = [...wpmHistory];
    if (previousAttempts.length > 1) {
        previousAttempts.pop();
    }
    
    previousAttempts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return previousAttempts[0];
}

/**
 * Generates an improvement message based on comparison with previous attempt
 * @param {number} currentWpm - Current WPM
 * @param {number} currentAccuracy - Current accuracy percentage
 * @param {Object} previousAttempt - Previous attempt data
 * @returns {string} Improvement message
 */
function generateImprovementMessage(currentWpm, currentAccuracy, previousAttempt) {
    const wpmImproved = currentWpm > previousAttempt.wpm;
    const accuracyImproved = currentAccuracy > previousAttempt.accuracy;
    
    if (wpmImproved && accuracyImproved) {
        return `Great job! You improved both WPM (${previousAttempt.wpm} → ${currentWpm}) and accuracy (${previousAttempt.accuracy}% → ${currentAccuracy}%).`;
    } else if (wpmImproved) {
        return `You improved your WPM from ${previousAttempt.wpm} to ${currentWpm}, but your accuracy decreased from ${previousAttempt.accuracy}% to ${currentAccuracy}%.`;
    } else if (accuracyImproved) {
        return `You improved your accuracy from ${previousAttempt.accuracy}% to ${currentAccuracy}%, but your WPM decreased from ${previousAttempt.wpm} to ${currentWpm}.`;
    } else {
        return `Keep practicing! Your WPM decreased from ${previousAttempt.wpm} to ${currentWpm} and your accuracy decreased from ${previousAttempt.accuracy}% to ${currentAccuracy}%.`;
    }
}

/**
 * Checks if the current attempt shows improvement over previous attempts
 * @param {number} currentWpm - Current WPM
 * @param {number} currentAccuracy - Current accuracy percentage
 * @returns {Object} Object with improved flag and message
 */
function checkImprovement(currentWpm, currentAccuracy) {
    const previousAttempt = getMostRecentPreviousAttempt();
    
    if (!previousAttempt) {
        return { improved: false, message: "This is your first attempt!" };
    }
    
    const wpmImproved = currentWpm > previousAttempt.wpm;
    const accuracyImproved = currentAccuracy > previousAttempt.accuracy;
    const message = generateImprovementMessage(currentWpm, currentAccuracy, previousAttempt);
    
    return {
        improved: wpmImproved || accuracyImproved,
        message: message
    };
}

/**
 * Calculates the current typing accuracy as a percentage
 * @returns {number} Accuracy percentage (0-100)
 */
function calculateAccuracy() {
    return window.totalCharactersTyped > 0 ? 
        Math.round((window.correctCharactersTyped / window.totalCharactersTyped) * 100) : 0;
}

/**
 * Creates a typing record object with current metrics
 * @param {number} wpm - Words per minute
 * @param {number} accuracy - Accuracy percentage
 * @returns {Object} Typing record object
 */
function createTypingRecord(wpm, accuracy) {
    return {
        timestamp: new Date().toISOString(),
        wpm: wpm,
        wordsCompleted: window.correctWordsCount,
        totalWords: window.currentWordIndex,
        accuracy: accuracy
    };
}

/**
 * Saves the current typing record to localStorage
 * @param {Object} record - The typing record to save
 */
function saveTypingRecord(record) {
    const wpmHistory = getTypingHistory();
    wpmHistory.push(record);
    localStorage.setItem('wpmHistory', JSON.stringify(wpmHistory));
}

/**
 * Displays improvement message based on comparison with previous attempts
 * @param {Object} improvement - Improvement check result
 */
function displayImprovementMessage(improvement) {
    const improvementElement = document.getElementById('improvement');
    improvementElement.textContent = improvement.message;
}

/**
 * Saves the current typing test data and updates displays
 */
function saveWpmData() {
    console.log("Saving WPM data, timerFinished:", window.timerFinished);

    if (!window.timerFinished) return;
    
    const currentTime = new Date();
    const elapsedMinutes = (currentTime - window.typingStartTime) / 60000;
    const wpm = elapsedMinutes > 0 ? Math.round(window.correctWordsCount / elapsedMinutes) : 0;
    const accuracy = calculateAccuracy();
    
    const improvement = checkImprovement(wpm, accuracy);
    
    const record = createTypingRecord(wpm, accuracy);
    saveTypingRecord(record);
    
    displayImprovementMessage(improvement);
    displayWpmStats();
}

/**
 * Resets all WPM tracking variables and displays
 */
function resetWpmTracking() {
    if (window.wpmUpdateInterval !== null) {
        clearInterval(window.wpmUpdateInterval);
        window.wpmUpdateInterval = null;
    }
    
    window.typingStartTime = null;
    window.totalCharactersTyped = 0;
    window.correctCharactersTyped = 0;
    
    document.getElementById('wpm').textContent = 'Your WPM';
    document.getElementById('accuracy').textContent = 'Your Accuracy';
    document.getElementById('improvement').textContent = '';
}

/**
 * Updates the accuracy display with the current calculated value
 */
function updateAccuracy() {
    if (!window.timerStarted || window.totalCharactersTyped === 0) return;
    
    const accuracy = calculateAccuracy();
    document.getElementById('accuracy').textContent = `Accuracy: ${accuracy}%`;
}

export { startWpmTracking, updateWpm, displayWpmStats, saveWpmData, resetWpmTracking, updateAccuracy, checkImprovement };
