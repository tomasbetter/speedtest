/**
 * Timer Module - Countdown timer functionality
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
   * Start countdown timer
   */
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    const startTime = Date.now();
    const initialTime = this.remainingTime;
    
    this.onTick(this.remainingTime);
    
    this.timerId = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      this.remainingTime = initialTime - elapsedSeconds;
      
      this.onTick(this.remainingTime);
      
      if (this.remainingTime <= 0) {
        this.stop();
        this.onComplete();
      }
    }, 1000);
  }

  /**
   * Stop countdown timer
   */
  stop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
      this.isRunning = false;
    }
  }

  /**
   * Reset timer to initial duration
   */
  reset() {
    this.stop();
    this.remainingTime = this.duration;
    this.onTick(this.remainingTime);
  }

  /**
   * @returns {boolean} Whether timer is running
   */
  getIsRunning() {
    return this.isRunning;
  }

  /**
   * @returns {number} Remaining time in seconds
   */
  getRemainingTime() {
    return this.remainingTime;
  }
}

export { Timer };
