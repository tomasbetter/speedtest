/**
 * Timer Module
 * Responsible for handling the timer functionality
 */

/**
 * Creates a timer that counts down from a specified duration
 */
class Timer {
  /**
   * @param {number} duration - Duration in seconds
   * @param {function} onTick - Callback function called on each tick
   * @param {function} onComplete - Callback function called when timer completes
   */
  constructor(duration, onTick, onComplete) {
    this.duration = duration;
    this.remainingTime = duration;
    this.onTick = onTick;
    this.onComplete = onComplete;
    this.timerId = null;
    this.isRunning = false;
  }

  /**
   * Starts the timer
   */
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    const startTime = Date.now();
    const initialTime = this.remainingTime;
    
    // Update timer display immediately
    this.onTick(this.remainingTime);
    
    this.timerId = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      this.remainingTime = initialTime - elapsedSeconds;
      
      // Update the display
      this.onTick(this.remainingTime);
      
      // Check if timer has completed
      if (this.remainingTime <= 0) {
        this.stop();
        this.onComplete();
      }
    }, 1000);
  }

  /**
   * Stops the timer
   */
  stop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
      this.isRunning = false;
    }
  }

  /**
   * Resets the timer to its initial duration
   */
  reset() {
    this.stop();
    this.remainingTime = this.duration;
    this.onTick(this.remainingTime);
  }

  /**
   * Returns whether the timer is currently running
   * @returns {boolean} True if the timer is running, false otherwise
   */
  getIsRunning() {
    return this.isRunning;
  }

  /**
   * Returns the remaining time
   * @returns {number} The remaining time in seconds
   */
  getRemainingTime() {
    return this.remainingTime;
  }
}

export { Timer };
