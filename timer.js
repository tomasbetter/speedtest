/**
 * Timer module for the typing test application
 * 
 * This module handles the countdown timer functionality, including
 * starting, updating, and resetting the timer.
 */

window.timerInterval = null;
window.timerStarted = false;
window.timerFinished = false;

/**
 * Default timer duration in seconds
 * @constant
 */
const DEFAULT_TIMER_DURATION = 60;

/**
 * Gets the timer display element from the DOM
 * @returns {HTMLElement} The timer display element
 */
function getTimerDisplay() {
    return document.getElementById('timer');
}

/**
 * Updates the timer display with the current time
 * @param {number} seconds - The number of seconds to display
 */
function updateTimerDisplay(seconds) {
    const display = getTimerDisplay();
    
    if (seconds > 0) {
        display.textContent = seconds + ' seconds left';
    } else {
        display.textContent = "Time's up!";
    }
}

/**
 * Handles what happens when the timer ends
 */
function handleTimerEnd() {
    clearInterval(window.timerInterval);
    window.timerInterval = null;
    
    window.timerFinished = true;
    
    updateTimerDisplay(0);
    
    const timerEndEvent = new CustomEvent('timerEnd');
    document.dispatchEvent(timerEndEvent);
}

/**
 * Starts the countdown timer
 * Initializes a 60-second countdown that updates every second
 */
function startTimer() {
    if (window.timerInterval !== null) {
        clearInterval(window.timerInterval);
    }
    
    window.timerStarted = true;
    window.timerFinished = false;
    
    const display = getTimerDisplay();
    display.textContent = DEFAULT_TIMER_DURATION + ' seconds';
    
    let time = parseInt(display.textContent);
    if (isNaN(time)) {
        time = DEFAULT_TIMER_DURATION;
    }

    window.timerInterval = setInterval(() => {
        time--;
        updateTimerDisplay(time);

        if (time <= 0) {
            handleTimerEnd();
        }
    }, 1000);
}

/**
 * Resets the timer to its initial state
 * Clears any running timer and resets the display
 */
function resetTimer() {
    if (window.timerInterval !== null) {
        clearInterval(window.timerInterval);
        window.timerInterval = null;
    }
    
    window.timerStarted = false;
    window.timerFinished = false;
    
    const display = getTimerDisplay();
    display.textContent = DEFAULT_TIMER_DURATION + ' seconds';
}

export { startTimer, resetTimer };
