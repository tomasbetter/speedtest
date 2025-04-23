import {saveWpmData, displayWpmStats, startWpmTracking, updateWpm, resetWpmTracking, updateAccuracy} from './stats.js';
import { startTimer, resetTimer } from './timer.js';
import { API_KEYS } from './config.js';

/**
 * Initializes the typing test application
 */
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

    setupInputFieldListeners(inputField);
    setupKeyboardShortcuts(inputField, startButton);
    setupButtonListeners(inputField, startButton, resetButton);

    fetchAndProcessText();
    displayWpmStats();
}

document.addEventListener('DOMContentLoaded', init);

/**
 * Sets up input field event listeners
 * @param {HTMLElement} inputField - The input field element
 */
function setupInputFieldListeners(inputField) {
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
    
    inputField.addEventListener('input', function() {
        if (window.timerFinished) {
            inputField.value = '';
            return;
        }
        updateWordDisplay();
    });
}

/**
 * Sets up document-level keyboard shortcuts
 * @param {HTMLElement} inputField - The input field element
 * @param {HTMLElement} startButton - The start button element
 */
function setupKeyboardShortcuts(inputField, startButton) {
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' && window.timerFinished) {
            restartTest(inputField, startButton);
        }
        
        if (event.key === 'Escape') {
            restartTest(inputField, startButton);
        }
    });
}

/**
 * Sets up button event listeners
 * @param {HTMLElement} inputField - The input field element
 * @param {HTMLElement} startButton - The start button element
 * @param {HTMLElement} resetButton - The reset button element
 */
function setupButtonListeners(inputField, startButton, resetButton) {
    startButton.addEventListener('click', function() {
        if (window.timerFinished) {
            restartTest(inputField, startButton);
        }
        
        inputField.focus();
    });

    resetButton.addEventListener('click', function() {
        restartTest(inputField, startButton);
    });
}

/**
 * Creates the request body for the OpenAI API call
 * @returns {Object} The request body as a JavaScript object
 */
function createGptRequestBody() {
    return {
        model: 'gpt-3.5-turbo',
        messages: [
            {
                role: 'system',
                content: 'Imagine you are a JavaScript teacher that each time gives one text randomly picked texts from these - variables and data types, operators, control structures, functions, objects and arrays, DOM manipulation, events, asynchronous, scope and closures, es6+ features '
            }
        ],
        max_tokens: 150,
        temperature: 0.7
    };
}

/**
 * Fetches random text from the OpenAI API
 * @returns {Promise<string>} A promise that resolves to the text content
 * @throws {Error} If the API request fails
 */
async function callGPT() {
    const apiKey = API_KEYS.openai;
    const endpoint = 'https://api.openai.com/v1/chat/completions';

    try {
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        };
        
        const requestBody = createGptRequestBody();
        
        const response = await fetch(endpoint, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(requestBody)
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

/**
 * Processes text content into an array of words for the typing test
 * @param {string} content - The raw text content
 * @returns {string[]} Array of words
 */
function processTextContent(content) {
    return content
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ')
        .filter(word => word.length > 0);
}

/**
 * Fetches text from the API and prepares it for the typing test
 * @returns {Promise} Promise that resolves when text is fetched and processed
 */
async function fetchAndProcessText() {
    document.getElementById('fetchedtext').innerHTML = 'loading...';
    
    try {
        const content = await callGPT();
        
        window.allWords = processTextContent(content);
        
        window.currentWordIndex = 0;
        updateWordDisplay();
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('fetchedtext').innerHTML = 'Error fetching text. Please try again.';
    }
}

/**
 * Checks if the current word was typed correctly and advances to the next word
 * @param {HTMLElement} inputField - The input field element
 */
function checkWordAndAdvance(inputField) {
    const currentWord = window.allWords[window.currentWordIndex];
    
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

/**
 * Formats a character with the appropriate color based on its state
 * @param {string} char - The character to format
 * @param {string} color - The color to apply ('green', 'red', or 'default')
 * @param {boolean} underline - Whether to underline the character
 * @returns {string} HTML string with the formatted character
 */
function formatCharacter(char, color, underline = false) {
    const colorMap = {
        'green': 'green',
        'red': 'red',
        'default': '#aaa'
    };
    
    const style = `color: ${colorMap[color]}${underline ? '; text-decoration: underline' : ''}`;
    return `<span style="${style}">${char}</span>`;
}

/**
 * Processes the current word being typed and generates HTML with appropriate highlighting
 * @param {string} word - The target word
 * @param {string} currentInput - What the user has typed so far
 * @returns {Object} Object containing HTML and character counts
 */
function processCurrentWord(word, currentInput) {
    let wordHTML = '';
    let correctChars = 0;
    let totalChars = 0;
    
    for (let j = 0; j < word.length; j++) {
        if (j >= currentInput.length) {
            wordHTML += formatCharacter(word[j], 'default');
        } else if (currentInput[j] === word[j]) {
            wordHTML += formatCharacter(word[j], 'green');
            correctChars++;
            totalChars++;
        } else {
            wordHTML += formatCharacter(word[j], 'red', true);
            totalChars++;
        }
    }
    
    if (currentInput.length > word.length) {
        totalChars += (currentInput.length - word.length);
    }
    
    return {
        html: `<span style="font-weight: bold;">${wordHTML}</span>`,
        correctChars,
        totalChars
    };
}

/**
 * Processes a previously typed word and generates HTML with appropriate highlighting
 * @param {string} word - The target word
 * @param {string} typedInput - What the user typed for this word
 * @returns {Object} Object containing HTML and character counts
 */
function processPreviousWord(word, typedInput) {
    let wordHTML = '';
    let correctChars = 0;
    let totalChars = 0;
    
    for (let j = 0; j < Math.max(word.length, typedInput.length); j++) {
        if (j >= word.length) {
            totalChars++;
        } else if (j >= typedInput.length) {
            wordHTML += formatCharacter(word[j], 'red', true);
            totalChars++;
        } else if (typedInput[j] === word[j]) {
            wordHTML += formatCharacter(word[j], 'green');
            correctChars++;
            totalChars++;
        } else {
            wordHTML += formatCharacter(word[j], 'red', true);
            totalChars++;
        }
    }
    
    return {
        html: wordHTML,
        correctChars,
        totalChars
    };
}

/**
 * Updates the display of text with appropriate highlighting based on user input
 */
function updateWordDisplay() {
    let displayHTML = '';
    const currentInput = document.getElementById('input').value;
    
    window.totalCharactersTyped = 0;
    window.correctCharactersTyped = 0;
    
    for (let i = 0; i < window.allWords.length; i++) {
        const word = window.allWords[i];
        
        if (i === window.currentWordIndex) {
            const result = processCurrentWord(word, currentInput);
            displayHTML += result.html;
            
            window.totalCharactersTyped += result.totalChars;
            window.correctCharactersTyped += result.correctChars;
            
        } else if (i < window.currentWordIndex && window.wordInputs[i]) {
            const result = processPreviousWord(word, window.wordInputs[i]);
            displayHTML += result.html;
            
            window.totalCharactersTyped += result.totalChars;
            window.correctCharactersTyped += result.correctChars;
            
        } else {
            displayHTML += word;
        }
        
        if (i < window.allWords.length - 1) {
            displayHTML += ' ';
        }
    }
    
    document.getElementById('fetchedtext').innerHTML = displayHTML;
}

/**
 * Resets the typing test to its initial state
 * @param {HTMLElement} inputField - The input field element
 */
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

/**
 * Restarts the typing test with fresh text
 * @param {HTMLElement} inputField - The input field element
 * @param {HTMLElement} startButton - The start button element
 */
function restartTest(inputField, startButton) {
    resetTest(inputField);
    resetTimer();
    resetWpmTracking();
    fetchAndProcessText();
    
    startButton.textContent = "start here";
    startButton.classList.remove('reset-mode');
}

/**
 * Handles the end of the typing test timer
 * Disables input, updates UI, and saves the test results
 */
function handleTimerEnd() {
    const inputField = document.getElementById('input');
    const startButton = document.getElementById('start');
    
    inputField.disabled = true;
    inputField.placeholder = "Time's up!";
    
    startButton.textContent = "start new test";
    startButton.classList.add('reset-mode');
    
    saveWpmData();
}

document.addEventListener('timerEnd', handleTimerEnd);
