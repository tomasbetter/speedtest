/**
 * Typing Test Module
 * Responsible for the core typing test functionality
 */

/**
 * TypingTest class to handle the typing test logic
 */
class TypingTest {
    /**
     * @param {Object} elements - DOM elements
     * @param {Object} elements.textDisplay - Element to display the text
     * @param {Object} elements.inputField - Input field for user typing
     * @param {Object} elements.currentWordDisplay - Element to display the current word
     * @param {Object} callbacks - Callback functions
     * @param {function} callbacks.onStart - Called when test starts
     * @param {function} callbacks.onComplete - Called when test completes
     * @param {function} callbacks.onUpdate - Called when stats update
     */
    constructor(elements, callbacks) {
        // DOM elements
        this.textDisplay = elements.textDisplay;
        this.inputField = elements.inputField;
        this.currentWordDisplay = elements.currentWordDisplay;
        
        // Callbacks
        this.onStart = callbacks.onStart || (() => {});
        this.onComplete = callbacks.onComplete || (() => {});
        this.onUpdate = callbacks.onUpdate || (() => {});
        
        // Test state
        this.text = '';
        this.words = [];
        this.currentWordIndex = 0;
        this.currentCharIndex = 0;
        this.correctChars = 0;
        this.totalChars = 0;
        this.isActive = false;
        
        // Performance optimizations
        this.wordElements = []; // Cache for word elements
        this.charElements = []; // Cache for character elements
        this.currentWordElement = null; // Current word element
        this.currentCharElement = null; // Current character element
        this.lastProcessedInput = ''; // Last processed input
        
        // Bind event handlers
        this.handleInput = this.handleInput.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        
        // Add event listeners
        this.inputField.addEventListener('input', this.handleInput);
        this.inputField.addEventListener('keydown', this.handleKeyDown);
    }
    
    /**
     * Sets the text for the typing test
     * @param {string} text - The text to type
     */
    setText(text) {
        this.text = text;
        this.words = text.split(' ');
        this.reset();
        this.renderText();
    }
    
    /**
     * Renders the text in the display element
     */
    renderText() {
        // Use document fragment for better performance
        const fragment = document.createDocumentFragment();
        this.wordElements = [];
        this.charElements = [];
        
        // Create a span for each word and character
        this.words.forEach((word, wordIndex) => {
            const wordSpan = document.createElement('span');
            wordSpan.className = 'word';
            wordSpan.dataset.index = wordIndex;
            this.wordElements.push(wordSpan);
            
            const wordChars = [];
            
            // Add each character as a span
            [...word].forEach((char, charIndex) => {
                const charSpan = document.createElement('span');
                charSpan.className = 'char';
                charSpan.dataset.index = charIndex;
                charSpan.textContent = char;
                wordSpan.appendChild(charSpan);
                wordChars.push(charSpan);
            });
            
            // Add the word to the fragment
            fragment.appendChild(wordSpan);
            
            // Add a space after each word (except the last one)
            if (wordIndex < this.words.length - 1) {
                const spaceSpan = document.createElement('span');
                spaceSpan.className = 'char space';
                spaceSpan.textContent = ' ';
                fragment.appendChild(spaceSpan);
                wordChars.push(spaceSpan);
            }
            
            // Add word's characters to the character cache
            this.charElements.push(...wordChars);
        });
        
        // Clear the text display and add the fragment
        this.textDisplay.innerHTML = '';
        this.textDisplay.appendChild(fragment);
        
        // Highlight the first word
        this.highlightCurrentWord();
    }
    
    /**
     * Highlights the current word in the text
     */
    highlightCurrentWord() {
        // If there was a previously highlighted word, remove the highlight
        if (this.currentWordElement) {
            this.currentWordElement.classList.remove('current-word');
        }
        
        // Highlight the current word
        if (this.currentWordIndex < this.wordElements.length) {
            this.currentWordElement = this.wordElements[this.currentWordIndex];
            this.currentWordElement.classList.add('current-word');
            
            // Check if the word is outside the visible area before scrolling
            const wordRect = this.currentWordElement.getBoundingClientRect();
            const containerRect = this.textDisplay.getBoundingClientRect();
            
            if (wordRect.top < containerRect.top || wordRect.bottom > containerRect.bottom) {
                // Only scroll if the word is outside the visible area
                this.currentWordElement.scrollIntoView({
                    behavior: 'auto', // Changed from 'smooth' for better performance
                    block: 'center',
                    inline: 'nearest'
                });
            }
            
            // Update the current word display
            this.currentWordDisplay.textContent = this.words[this.currentWordIndex] || '';
        }
    }
    
    /**
     * Highlights the current character in the text
     */
    highlightCurrentChar() {
        // If there was a previously highlighted character, remove the highlight
        if (this.currentCharElement) {
            this.currentCharElement.classList.remove('current-char');
        }
        
        // Calculate the absolute index of the current character
        let absoluteIndex = 0;
        for (let i = 0; i < this.currentWordIndex; i++) {
            absoluteIndex += this.words[i].length + 1; // +1 for the space
        }
        absoluteIndex += this.currentCharIndex;
        
        // Highlight the current character
        if (absoluteIndex < this.charElements.length) {
            this.currentCharElement = this.charElements[absoluteIndex];
            this.currentCharElement.classList.add('current-char');
        }
    }
    
    /**
     * Handles keydown events from the input field
     * @param {KeyboardEvent} event - Keydown event
     */
    handleKeyDown(event) {
        // Handle space key to move to next word
        if (event.key === ' ') {
            const currentWord = this.words[this.currentWordIndex];
            const inputValue = this.inputField.value.trim();
            
            // Only move to next word if the current word is complete
            if (inputValue === currentWord) {
                event.preventDefault();
                this.moveToNextWord();
            }
        }
        
        // Handle Enter key to restart
        if (event.key === 'Enter' && !this.isActive) {
            // Trigger a custom event that app.js can listen for
            const enterEvent = new CustomEvent('enter-key-pressed');
            document.dispatchEvent(enterEvent);
        }
        
        // Handle Escape key to reset
        if (event.key === 'Escape') {
            // Trigger a custom event that app.js can listen for
            const escapeEvent = new CustomEvent('escape-key-pressed');
            document.dispatchEvent(escapeEvent);
        }
    }
    
    /**
     * Handles input events from the input field
     * @param {Event} event - Input event
     */
    handleInput(event) {
        if (!this.isActive) {
            // Start the test on first input
            this.isActive = true;
            this.onStart();
        }
        
        const inputValue = this.inputField.value;
        
        // Check if the input ends with a space and the word is correct
        if (inputValue.endsWith(' ')) {
            const currentWord = this.words[this.currentWordIndex];
            const typedWord = inputValue.trim();
            
            if (typedWord === currentWord) {
                this.moveToNextWord();
                return;
            }
        }
        
        // Process the input
        this.processInput(inputValue);
        
        // Update stats
        this.updateStats();
    }
    
    /**
     * Processes the user's input
     * @param {string} input - The user's input
     */
    processInput(input) {
        const currentWord = this.words[this.currentWordIndex];
        
        // Check if input ends with space and the word is correct
        if (input.endsWith(' ')) {
            const typedWord = input.trim();
            if (typedWord === currentWord) {
                this.moveToNextWord();
                return;
            }
        }
        
        // Get the input without trailing space
        const inputWithoutSpace = input.endsWith(' ') ? input.slice(0, -1) : input;
        
        // Calculate the absolute index of the first character in the current word
        let absoluteIndex = 0;
        for (let i = 0; i < this.currentWordIndex; i++) {
            absoluteIndex += this.words[i].length + 1; // +1 for the space
        }
        
        // Optimization: Only update characters that have changed
        const minLength = Math.min(
            inputWithoutSpace.length, 
            this.lastProcessedInput.length, 
            currentWord.length
        );
        
        // Find the first character that differs
        let firstDiffIndex = 0;
        while (
            firstDiffIndex < minLength && 
            inputWithoutSpace[firstDiffIndex] === this.lastProcessedInput[firstDiffIndex]
        ) {
            firstDiffIndex++;
        }
        
        // Clear highlights for characters that have changed
        for (let i = firstDiffIndex; i < currentWord.length; i++) {
            const charElement = this.charElements[absoluteIndex + i];
            if (charElement) {
                charElement.classList.remove('correct', 'incorrect');
            }
        }
        
        // Highlight each character based on correctness
        for (let i = firstDiffIndex; i < inputWithoutSpace.length; i++) {
            if (i >= currentWord.length) break;
            
            const charElement = this.charElements[absoluteIndex + i];
            if (!charElement) continue;
            
            if (inputWithoutSpace[i] === currentWord[i]) {
                charElement.classList.add('correct');
            } else {
                charElement.classList.add('incorrect');
            }
        }
        
        // Update current character index
        this.currentCharIndex = inputWithoutSpace.length;
        
        // Store the current input for the next comparison
        this.lastProcessedInput = inputWithoutSpace;
        
        // Highlight the current character
        this.highlightCurrentChar();
        
        // Update the current word display
        this.currentWordDisplay.textContent = this.words[this.currentWordIndex] || '';
    }
    
    /**
     * Moves to the next word in the test
     */
    moveToNextWord() {
        // Count correct characters in the current word
        const currentWord = this.words[this.currentWordIndex];
        const inputValue = this.inputField.value.trim();
        
        if (inputValue === currentWord) {
            this.correctChars += currentWord.length + 1; // +1 for the space
        }
        
        this.totalChars += currentWord.length + 1; // +1 for the space
        
        // Move to the next word
        this.currentWordIndex++;
        this.currentCharIndex = 0;
        
        // Clear the input field
        this.inputField.value = '';
        
        // If we've reached the end of the text, complete the test
        if (this.currentWordIndex >= this.words.length) {
            this.complete();
            return;
        }
        
        // Highlight the new current word
        this.highlightCurrentWord();
        this.highlightCurrentChar();
        
        // Update the current word display explicitly
        this.currentWordDisplay.textContent = this.words[this.currentWordIndex] || '';
        
        // Update stats
        this.updateStats();
    }
    
    /**
     * Updates the typing statistics
     */
    updateStats() {
        // Calculate current stats
        const stats = {
            correctChars: this.correctChars,
            totalChars: this.totalChars,
            currentWordIndex: this.currentWordIndex,
            totalWords: this.words.length
        };
        
        // Call the update callback
        this.onUpdate(stats);
    }
    
    /**
     * Completes the typing test
     */
    complete() {
        this.isActive = false;
        this.inputField.disabled = true;
        
        // Calculate final stats
        const stats = {
            correctChars: this.correctChars,
            totalChars: this.totalChars,
            currentWordIndex: this.currentWordIndex,
            totalWords: this.words.length
        };
        
        // Call the complete callback
        this.onComplete(stats);
    }
    
    /**
     * Resets the typing test
     */
    reset() {
        this.currentWordIndex = 0;
        this.currentCharIndex = 0;
        this.correctChars = 0;
        this.totalChars = 0;
        this.isActive = false;
        
        // Clear the input field
        this.inputField.value = '';
        this.inputField.disabled = false;
        
        // Highlight the first word
        this.highlightCurrentWord();
        this.highlightCurrentChar();
        
        // Update stats
        this.updateStats();
    }
    
    /**
     * Starts a new typing test
     * @param {string} text - The text to type
     */
    start(text) {
        if (text) {
            this.setText(text);
        } else {
            this.reset();
        }
        
        // Focus the input field
        this.inputField.focus();
    }
    
    /**
     * Checks if the test is active
     * @returns {boolean} - True if the test is active, false otherwise
     */
    getIsActive() {
        return this.isActive;
    }
    
    /**
     * Gets the current word index
     * @returns {number} - The current word index
     */
    getCurrentWordIndex() {
        return this.currentWordIndex;
    }
    
    /**
     * Gets the words array
     * @returns {Array} - The words array
     */
    getWords() {
        return this.words;
    }
}

// Export the TypingTest class
export { TypingTest };
