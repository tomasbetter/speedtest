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

function updateWpm() {
    if (!window.typingStartTime || !window.timerStarted || window.timerFinished) return;

    const currentTime = new Date();
    const elapsedMinutes = (currentTime - window.typingStartTime) / 60000; 

    const wordsCompleted = window.correctWordsCount;
    const wpm = elapsedMinutes > 0 ? Math.round(wordsCompleted / elapsedMinutes) : 0;

    document.getElementById('wpm').textContent = `WPM: ${wpm}`;
}

function displayWpmStats() {
    console.log("Displaying WPM stats");
    const statsElement = document.getElementById('stats');
    const wpmHistory = JSON.parse(localStorage.getItem('wpmHistory')) || [];
    
    if (wpmHistory.length === 0) {
        statsElement.innerHTML = 'No typing statistics available yet.';
        return;
    }
    
    let statsHTML = '<h3>Your Typing History</h3><ul>';
    
    wpmHistory.reverse().forEach(record => {
        const date = new Date(record.timestamp);
        const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;

        const accuracyDisplay = record.accuracy !== undefined ?
            ` - Accuracy: <strong>${record.accuracy}%</strong>` : '';

        
        statsHTML += `<li>WPM: <strong>${record.wpm}</strong> - Words: ${record.wordsCompleted}${accuracyDisplay} - ${formattedDate}</li>`;
        });
    
    statsHTML += '</ul>';
    statsElement.innerHTML = statsHTML;
}

function checkImprovement(currentWpm, currentAccuracy) {
    const wpmHistory = JSON.parse(localStorage.getItem('wpmHistory')) || [];
    
    if (wpmHistory.length === 0) {
        return { improved: false, message: "This is your first attempt!" };
    }
    
    const previousAttempts = [...wpmHistory];
    if (previousAttempts.length > 1) {
        previousAttempts.pop();
    }
    
    previousAttempts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    const previousAttempt = previousAttempts[0];
    
    const wpmImproved = currentWpm > previousAttempt.wpm;
    const accuracyImproved = currentAccuracy > previousAttempt.accuracy;
    
    let message = "";
    if (wpmImproved && accuracyImproved) {
        message = `Great job! You improved both WPM (${previousAttempt.wpm} → ${currentWpm}) and accuracy (${previousAttempt.accuracy}% → ${currentAccuracy}%).`;
    } else if (wpmImproved) {
        message = `You improved your WPM from ${previousAttempt.wpm} to ${currentWpm}, but your accuracy decreased from ${previousAttempt.accuracy}% to ${currentAccuracy}%.`;
    } else if (accuracyImproved) {
        message = `You improved your accuracy from ${previousAttempt.accuracy}% to ${currentAccuracy}%, but your WPM decreased from ${previousAttempt.wpm} to ${currentWpm}.`;
    } else {
        message = `Keep practicing! Your WPM decreased from ${previousAttempt.wpm} to ${currentWpm} and your accuracy decreased from ${previousAttempt.accuracy}% to ${currentAccuracy}%.`;
    }
    
    return {
        improved: wpmImproved || accuracyImproved,
        message: message
    };
}

function saveWpmData() {
    console.log("Saving WPM data, timerFinished:", window.timerFinished);

    if (!window.timerFinished) return;
    
    const currentTime = new Date();
    const elapsedMinutes = (currentTime - window.typingStartTime) / 60000;
    const wordsCompleted = window.correctWordsCount;
    const totalWords = window.currentWordIndex;
    const wpm = elapsedMinutes > 0 ? Math.round(wordsCompleted / elapsedMinutes) : 0;
    
    // Character-level accuracy
    const accuracy = window.totalCharactersTyped > 0 ? 
        Math.round((window.correctCharactersTyped / window.totalCharactersTyped) * 100) : 0;
    
    const improvement = checkImprovement(wpm, accuracy);
    
    // Save to localStorage
    const wpmHistory = JSON.parse(localStorage.getItem('wpmHistory')) || [];
    wpmHistory.push({
        timestamp: new Date().toISOString(),
        wpm: wpm,
        wordsCompleted: wordsCompleted,
        totalWords: totalWords,
        accuracy: accuracy
    });
    
    localStorage.setItem('wpmHistory', JSON.stringify(wpmHistory));
    
    // Display improvement message
    const improvementElement = document.getElementById('improvement');
    improvementElement.textContent = improvement.message;
    
    // Update stats display
    displayWpmStats();
}

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

function updateAccuracy() {
    if (!window.timerStarted || window.totalCharactersTyped === 0) return;
    
    const accuracy = Math.round((window.correctCharactersTyped / window.totalCharactersTyped) * 100);
    
    document.getElementById('accuracy').textContent = `Accuracy: ${accuracy}%`;
}

export { startWpmTracking, updateWpm, displayWpmStats, saveWpmData, resetWpmTracking, updateAccuracy, checkImprovement };
