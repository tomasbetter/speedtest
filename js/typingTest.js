/**
 * Typing Test - Core typing test functionality
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
    this.textDisplay = elements.textDisplay;
    this.inputField = elements.inputField;
    this.currentWordDisplay = elements.currentWordDisplay;
    
    this.onStart = callbacks.onStart || (() => {});
    this.onComplete = callbacks.onComplete || (() => {});
    this.onUpdate = callbacks.onUpdate || (() => {});
    
    this.text = '';
    this.words = [];
    this.currentWordIndex = 0;
    this.currentCharIndex = 0;
    this.correctChars = 0;
    this.totalChars = 0;
    this.totalKeystrokes = 0;
    this.isActive = false;
    
    // For performance optimization
    this.wordElements = [];
    this.charElements = [];
    this.currentWordElement = null;
    this.currentCharElement = null;
    this.lastProcessedInput = '';
    
    this.handleInput = this.handleInput.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    
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
   * Renders text in the display element
   */
  renderText() {
    const fragment = document.createDocumentFragment();
    this.wordElements = [];
    this.charElements = [];
    
    this.words.forEach((word, wordIndex) => {
      const wordSpan = document.createElement('span');
      wordSpan.className = 'word';
      wordSpan.dataset.index = wordIndex;
      this.wordElements.push(wordSpan);
      
      const wordChars = [];
      
      [...word].forEach((char, charIndex) => {
        const charSpan = document.createElement('span');
        charSpan.className = 'char';
        charSpan.dataset.index = charIndex;
        charSpan.textContent = char;
        wordSpan.appendChild(charSpan);
        wordChars.push(charSpan);
      });
      
      fragment.appendChild(wordSpan);
      
      if (wordIndex < this.words.length - 1) {
        const spaceSpan = document.createElement('span');
        spaceSpan.className = 'char space';
        spaceSpan.textContent = ' ';
        fragment.appendChild(spaceSpan);
        wordChars.push(spaceSpan);
      }
      
      this.charElements.push(...wordChars);
    });
    
    this.textDisplay.innerHTML = '';
    this.textDisplay.appendChild(fragment);
    
    this.highlightCurrentWord();
  }
  
  /**
   * Highlights current word in the text
   */
  highlightCurrentWord() {
    if (this.currentWordElement) {
      this.currentWordElement.classList.remove('current-word');
    }
    
    if (this.currentWordIndex < this.wordElements.length) {
      this.currentWordElement = this.wordElements[this.currentWordIndex];
      this.currentWordElement.classList.add('current-word');
      
      // Auto-scroll if word is outside visible area
      const wordRect = this.currentWordElement.getBoundingClientRect();
      const containerRect = this.textDisplay.getBoundingClientRect();
      
      if (wordRect.top < containerRect.top || wordRect.bottom > containerRect.bottom) {
        this.currentWordElement.scrollIntoView({
          behavior: 'auto',
          block: 'center',
          inline: 'nearest',
        });
      }
      
      this.currentWordDisplay.textContent = this.words[this.currentWordIndex] || '';
    }
  }
  
  /**
   * Highlights current character in the text
   */
  highlightCurrentChar() {
    if (this.currentCharElement) {
      this.currentCharElement.classList.remove('current-char');
    }
    
    let absoluteIndex = 0;
    for (let i = 0; i < this.currentWordIndex; i++) {
      absoluteIndex += this.words[i].length + 1; // +1 for space
    }
    absoluteIndex += this.currentCharIndex;
    
    if (absoluteIndex < this.charElements.length) {
      this.currentCharElement = this.charElements[absoluteIndex];
      this.currentCharElement.classList.add('current-char');
    }
  }
  
  /**
   * @param {KeyboardEvent} event - Keydown event
   */
  handleKeyDown(event) {
    if (event.key === ' ' && this.isActive) {
      event.preventDefault();
      this.moveToNextWord();
      this.inputField.value = '';
      return;
    }
    
    if (event.key === 'Enter' && !this.isActive) {
      const enterEvent = new CustomEvent('enter-key-pressed');
      document.dispatchEvent(enterEvent);
    }
    
    if (event.key === 'Escape') {
      const escapeEvent = new CustomEvent('escape-key-pressed');
      document.dispatchEvent(escapeEvent);
    }
  }
  
  /**
   * @param {Event} event - Input event
   */
  handleInput(event) {
    if (!this.isActive) {
      this.isActive = true;
      this.onStart();
    }
    
    this.totalKeystrokes++;
    
    const inputValue = this.inputField.value;
    this.processInput(inputValue);
    this.updateStats();
  }
  
  /**
   * @param {string} input - User's input
   */
  processInput(input) {
    const currentWord = this.words[this.currentWordIndex];
    
    if (input.endsWith(' ')) {
      return;
    }
    
    const inputWithoutSpace = input.endsWith(' ') ? input.slice(0, -1) : input;
    
    let absoluteIndex = 0;
    for (let i = 0; i < this.currentWordIndex; i++) {
      absoluteIndex += this.words[i].length + 1;
    }
    
    // Performance optimization: only update changed characters
    const minLength = Math.min(
      inputWithoutSpace.length, 
      this.lastProcessedInput.length, 
      currentWord.length,
    );
    
    let firstDiffIndex = 0;
    while (
      firstDiffIndex < minLength && 
      inputWithoutSpace[firstDiffIndex] === this.lastProcessedInput[firstDiffIndex]
    ) {
      firstDiffIndex++;
    }
    
    for (let i = firstDiffIndex; i < currentWord.length; i++) {
      const charElement = this.charElements[absoluteIndex + i];
      if (charElement) {
        charElement.classList.remove('correct', 'incorrect');
      }
    }
    
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
    
    this.currentCharIndex = inputWithoutSpace.length;
    this.lastProcessedInput = inputWithoutSpace;
    this.highlightCurrentChar();
    this.currentWordDisplay.textContent = this.words[this.currentWordIndex] || '';
  }
  
  /**
   * Moves to next word in the test
   */
  moveToNextWord() {
    const currentWord = this.words[this.currentWordIndex];
    const inputValue = this.inputField.value.trim();
    
    let correctCharsInWord = 0;
    for (let i = 0; i < Math.min(inputValue.length, currentWord.length); i++) {
      if (inputValue[i] === currentWord[i]) {
        correctCharsInWord++;
      }
    }
    
    this.correctChars += correctCharsInWord + (inputValue === currentWord ? 1 : 0); // +1 for space if correct
    this.totalChars += currentWord.length + 1; // +1 for space
    
    this.currentWordIndex++;
    this.currentCharIndex = 0;
    this.inputField.value = '';
    
    if (this.currentWordIndex >= this.words.length) {
      this.complete();
      return;
    }
    
    this.highlightCurrentWord();
    this.highlightCurrentChar();
    this.currentWordDisplay.textContent = this.words[this.currentWordIndex] || '';
    this.updateStats();
  }
  
  /**
   * Updates typing statistics
   */
  updateStats() {
    const stats = {
      correctChars: this.correctChars,
      totalChars: this.totalChars,
      totalKeystrokes: this.totalKeystrokes,
      currentWordIndex: this.currentWordIndex,
      totalWords: this.words.length,
    };
    
    this.onUpdate(stats);
  }
  
  /**
   * Completes the test
   */
  complete() {
    this.isActive = false;
    this.inputField.disabled = true;
    
    const stats = {
      correctChars: this.correctChars,
      totalChars: this.totalChars,
      totalKeystrokes: this.totalKeystrokes,
      currentWordIndex: this.currentWordIndex,
      totalWords: this.words.length,
    };
    
    this.onComplete(stats);
  }
  
  /**
   * Resets the test
   */
  reset() {
    this.currentWordIndex = 0;
    this.currentCharIndex = 0;
    this.correctChars = 0;
    this.totalChars = 0;
    this.totalKeystrokes = 0;
    this.isActive = false;
    
    this.inputField.value = '';
    this.inputField.disabled = false;
    
    this.highlightCurrentWord();
    this.highlightCurrentChar();
    this.updateStats();
  }
  
  /**
   * @param {string} text - Text to type
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
   * @returns {boolean} Whether test is active
   */
  getIsActive() {
    return this.isActive;
  }
  
  /**
   * @returns {number} Current word index
   */
  getCurrentWordIndex() {
    return this.currentWordIndex;
  }
  
  /**
   * @returns {Array} Words array
   */
  getWords() {
    return this.words;
  }
}

export { TypingTest };
