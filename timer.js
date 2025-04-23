window.timerInterval = null;
window.timerStarted = false;
window.timerFinished = false;

function startTimer() {
    if (window.timerInterval !== null) {
        clearInterval(window.timerInterval);
    }
    
    const display = document.getElementById('timer');
    display.textContent = '60 seconds';
    
    let time = parseInt(display.textContent);
    
    if (isNaN(time)) {
        time = 60;
    }

    window.timerInterval = setInterval(() => {
        time--;
        display.textContent = time + ' seconds left';

        if (time < 0) {
            clearInterval(window.timerInterval);
            window.timerInterval = null;
            window.timerFinished = true;
            display.textContent = "Time's up!";
            
            const timerEndEvent = new CustomEvent('timerEnd');
            document.dispatchEvent(timerEndEvent);
        }
    }, 1000);
}

function resetTimer() {
    if (window.timerInterval !== null) {
        clearInterval(window.timerInterval);
        window.timerInterval = null;
    }
    
    const display = document.getElementById('timer');
    display.textContent = '60 seconds';
    
    window.timerStarted = false;
    window.timerFinished = false;
}

export { startTimer, resetTimer };
