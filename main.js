import {saveWpmData, displayWpmStats, startWpmTracking, updateWpm, resetWpmTracking, updateAccuracy} from './stats.js';
import { startTimer, resetTimer } from './timer.js';
import { API_KEYS } from './config.js';

function checkWordAndAdvance(inputField) {
    const currentWord = window.allWords[window.currentWordIndex]
    window.wordInputs[window.currentWordIndex] = inputField.value;
    
    if (inputField.value === currentWord) {
        window.correctWordsCount++;
    }
    
    window.currentWordIndex++;
    
    inputField.value = '';
    
    if (window.currentWordIndex >= window.allWords.length) {
        document.getElementById('fetchedtext').innerHTML = 'Test completed!';
        return;
    }
    
    updateWordDisplay();
    updateWpm();
    updateAccuracy();
}

async function callGPT() {
    const apiKey = API_KEYS.openai;
    const endpoint = 'https://api.openai.com/v1/chat/completions';

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'Imagine you are a JavaScript teacher that each time gives one text randomly picked texts from these - variables and data types, operators, control structures, functions, objects and arrays, DOM manipulation, events, asynchronous, scope and closures, es6+ features '
                    }
                ],
                max_tokens: 150,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('API Response:', data);
        return data.choices[0].message.content;
    } catch (error) {
        console.error('Error calling GPT API:', error);
        throw error;
    }
}

function updateWordDisplay() {
    let displayHTML = '';
    const currentInput = document.getElementById('input').value;
    
    // Reset character counts
    window.totalCharactersTyped = 0;
    window.correctCharactersTyped = 0;
    
    // Reset character counts for current word
    let currentWordCorrectChars = 0;
    let currentWordTotalChars = 0;
    
    for (let i = 0; i < window.allWords.length; i++) {
        const word = window.allWords[i];
        
        if (i === window.currentWordIndex) {
            let wordHTML = '';
            
            for (let j = 0; j < word.length; j++) {
                if (j >= currentInput.length) {
                    wordHTML += `<span style="color: #aaa;">${word[j]}</span>`;
                } else if (currentInput[j] === word[j]) {
                    wordHTML += `<span style="color: green;">${word[j]}</span>`;
                    currentWordCorrectChars++;
                    currentWordTotalChars++;
                } else {
                    wordHTML += `<span style="color: red; text-decoration: underline;">${word[j]}</span>`;
                    currentWordTotalChars++;
                }
            }
            
            // Add any extra characters typed (beyond word length)
            if (currentInput.length > word.length) {
                currentWordTotalChars += (currentInput.length - word.length);
            }
            
            // Update global character counts
            window.totalCharactersTyped += currentWordTotalChars;
            window.correctCharactersTyped += currentWordCorrectChars;
            
            displayHTML += `<span style="font-weight: bold;">${wordHTML}</span>`;
        } else if (i < window.currentWordIndex && window.wordInputs[i]) {
            let wordHTML = '';
            const typedInput = window.wordInputs[i];
            
            for (let j = 0; j < Math.max(word.length, typedInput.length); j++) {
                if (j >= word.length) {
                    // Extra characters typed
                    window.totalCharactersTyped++;
                } else if (j >= typedInput.length) {
                    // Missing characters
                    wordHTML += `<span style="color: red; text-decoration: underline;">${word[j]}</span>`;
                    window.totalCharactersTyped++;
                } else if (typedInput[j] === word[j]) {
                    wordHTML += `<span style="color: green;">${word[j]}</span>`;
                    window.correctCharactersTyped++;
                    window.totalCharactersTyped++;
                } else {
                    wordHTML += `<span style="color: red; text-decoration: underline;">${word[j]}</span>`;
                    window.totalCharactersTyped++;
                }
            }
            
            displayHTML += wordHTML;
        } else {
            displayHTML += word;
        }
        
        if (i < window.allWords.length - 1) {
            displayHTML += ' ';
        }

        document.getElementById('fetchedtext').innerHTML = displayHTML;

    }
} 

function resetTest(inputField) {
    window.currentWordIndex = 0;
    window.wordInputs = [];
    window.correctWordsCount = 0;
    window.totalCharactersTyped = 0;
    window.correctCharactersTyped = 0;
    inputField.value = '';
    inputField.disabled = false;
    inputField.placeholder = "start writing here";
    updateWordDisplay();
    inputField.focus();
}

document.addEventListener('timerEnd', function() {
    const inputField = document.getElementById('input');
    const startButton = document.getElementById('start');
    
    inputField.disabled = true;
    inputField.placeholder = "Time's up!";
    
    // Update start button to indicate it can now reset the test
    startButton.textContent = "start new test";
    startButton.classList.add('reset-mode');
    
    saveWpmData();
});

async function fetchAndProcessText() {
    document.getElementById('fetchedtext').innerHTML = 'loading...';
    
    return callGPT()
        .then(content => {
            window.allWords = content
                .replace(/\s+/g, ' ')
                .trim()
                .split(' ')
                .filter(word => word.length > 0);
            
            window.currentWordIndex = 0;
            updateWordDisplay();
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('fetchedtext').innerHTML = 'Error fetching text';
        });
}

function init() {
    window.typingStartTime = null;
    window.wpmUpdateInterval = null;
    window.allWords = [];
    window.currentWordIndex = 0;
    window.wordInputs = [];
    window.correctWordsCount = 0;
    window.totalCharactersTyped = 0;
    window.correctCharactersTyped = 0;

    const inputField = document.getElementById('input');
    const startButton = document.getElementById('start');
    const resetButton = document.getElementById('reset');

    
    
    inputField.addEventListener('keydown', function(event) {
        if (window.timerFinished) {
            event.preventDefault();
            return;
        }
        
        if (!window.timerStarted) {
            startTimer();
            startWpmTracking();
            window.timerStarted = true;
        }
       
        if (event.key === ' ') {
            event.preventDefault();
            checkWordAndAdvance(inputField);
        }
    });
    
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' && window.timerFinished) {
            resetTest(inputField);
            resetTimer();
            resetWpmTracking();
            fetchAndProcessText();
            startButton.textContent = "start here";
            startButton.classList.remove('reset-mode');
        }
        
        if (event.key === 'Escape') {
            resetTest(inputField);
            resetTimer();
            resetWpmTracking();
            fetchAndProcessText();
            startButton.textContent = "start here";
            startButton.classList.remove('reset-mode');
        }
    });

    startButton.addEventListener('click', function() {
        if (window.timerFinished) {
            resetTest(inputField);
            resetTimer();
            resetWpmTracking();
            fetchAndProcessText();
            this.textContent = "start here";
            this.classList.remove('reset-mode');
        }
        
        inputField.focus();
    });

    resetButton.addEventListener('click', function() {
        resetTest(inputField);
        resetTimer();
        resetWpmTracking();
        fetchAndProcessText();
        
        // Reset the start button to its original state
        startButton.textContent = "start here";
        startButton.classList.remove('reset-mode');
    });
    
    inputField.addEventListener('input', function() {
        if (window.timerFinished) {
            inputField.value = '';
            return;
        }
        updateWordDisplay();
    });

    fetchAndProcessText();
    displayWpmStats();
}

document.addEventListener('DOMContentLoaded', init);
