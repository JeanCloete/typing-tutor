// Enhanced Typing Practice with Finger Position Guidance
class TypingPractice {
    constructor() {
        this.lessonText = '';
        this.currentIndex = 0;
        this.startTime = null;
        this.endTime = null;
        this.errors = 0;
        this.isActive = false;
        this.isPaused = false;
        this.timeElapsed = 0;
        this.timerInterval = null;
        
        // DOM elements
        this.textDisplay = null;
        this.inputArea = null;
        this.statsElements = {};
        this.virtualKeyboard = null;
        
        // Audio feedback
        this.audioEnabled = true;
        this.audioContext = null;
        
        this.init();
    }
    
    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupElements());
        } else {
            this.setupElements();
        }
    }
    
    setupElements() {
        this.textDisplay = document.getElementById('textDisplay');
        this.inputArea = document.getElementById('inputArea');
        
        // Stats elements
        this.statsElements = {
            time: document.getElementById('time'),
            wpm: document.getElementById('wpm'),
            accuracy: document.getElementById('accuracy'),
            errors: document.getElementById('errors')
        };
        
        // Get virtual keyboard instance
        this.virtualKeyboard = window.virtualKeyboard;
        
        if (this.textDisplay && this.inputArea) {
            this.lessonText = this.textDisplay.textContent.trim();
            this.setupEventListeners();
            this.initializeDisplay();
        }
    }
    
    setupEventListeners() {
        // Input area events
        this.inputArea.addEventListener('input', (e) => this.handleInput(e));
        this.inputArea.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.inputArea.addEventListener('focus', () => this.handleFocus());
        this.inputArea.addEventListener('blur', () => this.handleBlur());
        
        // Control buttons
        const resetBtn = document.getElementById('resetBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.reset());
        }
        
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.togglePause());
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'r':
                        e.preventDefault();
                        this.reset();
                        break;
                    case 'p':
                        e.preventDefault();
                        this.togglePause();
                        break;
                }
            }
        });
        
        // Prevent context menu on input area
        this.inputArea.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    initializeDisplay() {
        this.renderText();
        this.updateStats();
        this.highlightNextChar();
    }
    
    handleInput(e) {
        if (!this.isActive && !this.isPaused) {
            this.start();
        }
        
        if (this.isPaused) return;
        
        const inputValue = e.target.value;
        const inputLength = inputValue.length;
        
        // Check if user typed the correct character
        if (inputLength > 0) {
            const lastChar = inputValue[inputLength - 1];
            const expectedChar = this.lessonText[inputLength - 1];
            
            if (lastChar !== expectedChar) {
                this.errors++;
                this.playErrorSound();
                this.showError(inputLength - 1);
            } else {
                this.playSuccessSound();
                this.hideError(inputLength - 1);
            }
            
            // Update keyboard highlighting
            if (this.virtualKeyboard) {
                this.virtualKeyboard.pressKey(lastChar);
            }
        }
        
        this.currentIndex = inputLength;
        this.renderText();
        this.updateStats();
        this.highlightNextChar();
        
        // Check if lesson is complete
        if (inputLength >= this.lessonText.length) {
            this.complete();
        }
    }
    
    handleKeyDown(e) {
        // Prevent certain keys from being processed
        if (e.key === 'Tab') {
            e.preventDefault();
            return;
        }
        
        // Handle backspace - don't allow going back beyond current progress
        if (e.key === 'Backspace' && this.inputArea.value.length === 0) {
            e.preventDefault();
        }
    }
    
    handleFocus() {
        if (this.virtualKeyboard) {
            this.virtualKeyboard.show();
        }
        this.highlightNextChar();
    }
    
    handleBlur() {
        if (this.isActive && !this.isPaused) {
            this.pause();
        }
    }
    
    start() {
        this.isActive = true;
        this.isPaused = false;
        this.startTime = Date.now();
        this.startTimer();
        
        // Show pause button
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
            pauseBtn.style.display = 'inline-flex';
        }
        
        this.inputArea.classList.add('active');
    }
    
    pause() {
        this.isPaused = true;
        this.stopTimer();
        
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
            const icon = pauseBtn.querySelector('i');
            const text = pauseBtn.querySelector('span') || pauseBtn;
            if (icon) icon.className = 'fas fa-play';
            if (text) text.textContent = 'Resume';
        }
        
        this.inputArea.classList.add('paused');
    }
    
    resume() {
        this.isPaused = false;
        this.startTimer();
        
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
            const icon = pauseBtn.querySelector('i');
            const text = pauseBtn.querySelector('span') || pauseBtn;
            if (icon) icon.className = 'fas fa-pause';
            if (text) text.textContent = 'Pause';
        }
        
        this.inputArea.classList.remove('paused');
        this.inputArea.focus();
    }
    
    togglePause() {
        if (this.isPaused) {
            this.resume();
        } else if (this.isActive) {
            this.pause();
        }
    }
    
    complete() {
        this.isActive = false;
        this.endTime = Date.now();
        this.stopTimer();
        
        const finalStats = this.calculateFinalStats();
        this.saveProgress(finalStats);
        this.showResults(finalStats);
        
        // Hide pause button
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
            pauseBtn.style.display = 'none';
        }
        
        this.inputArea.classList.remove('active');
        this.playCelebrationSound();
    }
    
    reset() {
        this.isActive = false;
        this.isPaused = false;
        this.currentIndex = 0;
        this.errors = 0;
        this.timeElapsed = 0;
        this.startTime = null;
        this.endTime = null;
        
        this.stopTimer();
        
        this.inputArea.value = '';
        this.inputArea.classList.remove('active', 'paused');
        
        // Hide pause button
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
            pauseBtn.style.display = 'none';
            const icon = pauseBtn.querySelector('i');
            const text = pauseBtn.querySelector('span') || pauseBtn;
            if (icon) icon.className = 'fas fa-pause';
            if (text) text.textContent = 'Pause';
        }
        
        this.initializeDisplay();
        this.inputArea.focus();
    }
    
    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timeElapsed++;
            this.updateTimeDisplay();
            this.updateStats();
        }, 1000);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    renderText() {
        const inputValue = this.inputArea.value;
        let html = '';
        
        for (let i = 0; i < this.lessonText.length; i++) {
            const char = this.lessonText[i];
            let className = '';
            
            if (i < inputValue.length) {
                // Character has been typed
                if (inputValue[i] === char) {
                    className = 'correct';
                } else {
                    className = 'incorrect';
                }
            } else if (i === inputValue.length) {
                // Current character to type
                className = 'current';
            }
            
            if (char === ' ') {
                html += `<span class="${className}">&nbsp;</span>`;
            } else if (char === '\n') {
                html += `<span class="${className}">¶</span><br>`;
            } else {
                html += `<span class="${className}">${this.escapeHtml(char)}</span>`;
            }
        }
        
        this.textDisplay.innerHTML = html;
        
        // Update progress bar
        const progress = (inputValue.length / this.lessonText.length) * 100;
        const progressFill = document.getElementById('progressFill');
        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }
    }
    
    highlightNextChar() {
        if (this.virtualKeyboard && this.currentIndex < this.lessonText.length) {
            const nextChar = this.lessonText[this.currentIndex];
            this.virtualKeyboard.highlightKey(nextChar);
        }
    }
    
    updateStats() {
        const inputValue = this.inputArea.value;
        const timeInMinutes = this.timeElapsed / 60;
        
        // Calculate WPM (Words Per Minute)
        const charactersTyped = inputValue.length;
        const wordsTyped = charactersTyped / 5; // Standard: 5 characters = 1 word
        const wpm = timeInMinutes > 0 ? Math.round(wordsTyped / timeInMinutes) : 0;
        
        // Calculate accuracy
        let correctChars = 0;
        for (let i = 0; i < inputValue.length; i++) {
            if (i < this.lessonText.length && inputValue[i] === this.lessonText[i]) {
                correctChars++;
            }
        }
        const accuracy = inputValue.length > 0 ? Math.round((correctChars / inputValue.length) * 100) : 100;
        
        // Update display
        if (this.statsElements.wpm) this.statsElements.wpm.textContent = wpm;
        if (this.statsElements.accuracy) this.statsElements.accuracy.textContent = accuracy;
        if (this.statsElements.errors) this.statsElements.errors.textContent = this.errors;
    }
    
    updateTimeDisplay() {
        if (this.statsElements.time) {
            const minutes = Math.floor(this.timeElapsed / 60);
            const seconds = this.timeElapsed % 60;
            this.statsElements.time.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }
    
    calculateFinalStats() {
        const inputValue = this.inputArea.value;
        const timeInMinutes = this.timeElapsed / 60;
        const charactersTyped = inputValue.length;
        const wordsTyped = charactersTyped / 5;
        const wpm = timeInMinutes > 0 ? Math.round(wordsTyped / timeInMinutes) : 0;
        
        let correctChars = 0;
        for (let i = 0; i < inputValue.length; i++) {
            if (i < this.lessonText.length && inputValue[i] === this.lessonText[i]) {
                correctChars++;
            }
        }
        
        const accuracy = inputValue.length > 0 ? Math.round((correctChars / inputValue.length) * 100) : 100;
        
        return {
            wpm: wpm,
            accuracy: accuracy,
            time_taken: this.timeElapsed,
            errors: this.errors,
            characters_typed: charactersTyped,
            correct_characters: correctChars
        };
    }
    
    async saveProgress(stats) {
        if (!window.lessonData || !window.lessonData.isAuthenticated) {
            return; // Can't save progress for unauthenticated users
        }
        
        try {
            const response = await fetch(`/save_progress/${window.lessonData.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(stats)
            });
            
            const result = await response.json();
            
            if (result.achievements && result.achievements.length > 0) {
                this.showAchievements(result.achievements);
            }
            
            return result;
        } catch (error) {
            console.error('Error saving progress:', error);
        }
    }
    
    showResults(stats) {
        const modal = document.getElementById('resultsModal');
        if (!modal) return;
        
        // Update results display
        const finalWPM = document.getElementById('finalWPM');
        const finalAccuracy = document.getElementById('finalAccuracy');
        const finalTime = document.getElementById('finalTime');
        const accuracyGate = document.getElementById('accuracyGate');
        const successMessage = document.getElementById('successMessage');
        const nextLessonBtn = document.getElementById('nextLessonBtn');
        
        if (finalWPM) finalWPM.textContent = stats.wpm;
        if (finalAccuracy) finalAccuracy.textContent = `${stats.accuracy}%`;
        if (finalTime) {
            const minutes = Math.floor(stats.time_taken / 60);
            const seconds = stats.time_taken % 60;
            finalTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        // Show appropriate message based on accuracy
        if (stats.accuracy >= 95) {
            if (successMessage) successMessage.style.display = 'block';
            if (accuracyGate) accuracyGate.style.display = 'none';
            if (nextLessonBtn && window.lessonData && window.lessonData.number < 21) {
                nextLessonBtn.style.display = 'inline-flex';
                nextLessonBtn.onclick = () => {
                    window.location.href = `/lesson/${window.lessonData.number + 1}`;
                };
            }
        } else {
            if (accuracyGate) accuracyGate.style.display = 'block';
            if (successMessage) successMessage.style.display = 'none';
            if (nextLessonBtn) nextLessonBtn.style.display = 'none';
        }
        
        // Show modal
        modal.classList.add('show');
        
        // Setup modal event listeners
        this.setupModalEvents(modal);
    }
    
    setupModalEvents(modal) {
        const closeModal = document.getElementById('closeModal');
        const tryAgainBtn = document.getElementById('tryAgainBtn');
        const backToLessonsBtn = document.getElementById('backToLessonsBtn');
        
        const closeModalFn = () => {
            modal.classList.remove('show');
        };
        
        if (closeModal) closeModal.onclick = closeModalFn;
        if (tryAgainBtn) tryAgainBtn.onclick = () => {
            closeModalFn();
            this.reset();
        };
        if (backToLessonsBtn) backToLessonsBtn.onclick = () => {
            window.location.href = '/';
        };
        
        // Close on outside click
        modal.onclick = (e) => {
            if (e.target === modal) {
                closeModalFn();
            }
        };
        
        // Close on escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                closeModalFn();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }
    
    showAchievements(achievements) {
        achievements.forEach((achievement, index) => {
            setTimeout(() => {
                this.showAchievementNotification(achievement);
            }, index * 1000);
        });
    }
    
    showAchievementNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-icon">🏆</div>
            <div class="achievement-text">${message}</div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Remove after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }
    
    showError(index) {
        const spans = this.textDisplay.querySelectorAll('span');
        if (spans[index]) {
            spans[index].classList.add('error-shake');
            setTimeout(() => {
                spans[index].classList.remove('error-shake');
            }, 500);
        }
    }
    
    hideError(index) {
        const spans = this.textDisplay.querySelectorAll('span');
        if (spans[index]) {
            spans[index].classList.remove('error-shake');
        }
    }
    
    // Audio feedback methods
    initAudioContext() {
        if (!this.audioContext && this.audioEnabled) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.warn('Audio context not supported');
                this.audioEnabled = false;
            }
        }
    }
    
    playTone(frequency, duration, type = 'sine') {
        if (!this.audioEnabled) return;
        
        this.initAudioContext();
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    playSuccessSound() {
        this.playTone(800, 0.1);
    }
    
    playErrorSound() {
        this.playTone(300, 0.2, 'sawtooth');
    }
    
    playCelebrationSound() {
        // Play a celebration melody
        const notes = [523, 659, 784, 1047]; // C, E, G, C
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.playTone(freq, 0.3);
            }, i * 200);
        });
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize typing practice when page loads
function initTypingPractice() {
    window.typingPractice = new TypingPractice();
}

// Add CSS for enhanced visual feedback
const enhancedStyles = `
<style>
.text-display .correct {
    background-color: rgba(16, 185, 129, 0.2);
    color: var(--success-color);
}

.text-display .incorrect {
    background-color: rgba(239, 68, 68, 0.2);
    color: var(--danger-color);
    text-decoration: underline;
}

.text-display .current {
    background-color: var(--primary-color);
    color: white;
    animation: blink 1s infinite;
}

.text-display .error-shake {
    animation: shake 0.5s ease-in-out;
}

@keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0.3; }
}

@keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-2px); }
    75% { transform: translateX(2px); }
}

.typing-input.active {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.typing-input.paused {
    opacity: 0.7;
    pointer-events: none;
}

.key[data-finger="pinky-left"] { background-color: rgba(255, 107, 107, 0.3); }
.key[data-finger="ring-left"] { background-color: rgba(78, 205, 196, 0.3); }
.key[data-finger="middle-left"] { background-color: rgba(69, 183, 209, 0.3); }
.key[data-finger="index-left"] { background-color: rgba(150, 206, 180, 0.3); }
.key[data-finger="thumb"] { background-color: rgba(254, 202, 87, 0.3); }
.key[data-finger="index-right"] { background-color: rgba(255, 159, 243, 0.3); }
.key[data-finger="middle-right"] { background-color: rgba(243, 139, 168, 0.3); }
.key[data-finger="ring-right"] { background-color: rgba(166, 227, 161, 0.3); }
.key[data-finger="pinky-right"] { background-color: rgba(250, 179, 135, 0.3); }

.finger-hint {
    transform: scale(1.1);
    font-weight: bold;
    box-shadow: 0 0 10px rgba(102, 126, 234, 0.5);
}

.achievement-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--glass-bg);
    backdrop-filter: blur(20px);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-xl);
    padding: 1rem 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    box-shadow: var(--shadow-xl);
    transform: translateX(100%);
    opacity: 0;
    transition: all 0.3s ease-out;
    z-index: 1001;
    max-width: 400px;
}

.achievement-notification.show {
    transform: translateX(0);
    opacity: 1;
}

.achievement-icon {
    font-size: 1.5rem;
}

.achievement-text {
    font-weight: 600;
    color: var(--text-primary);
}

@media (max-width: 768px) {
    .achievement-notification {
        top: 10px;
        right: 10px;
        left: 10px;
        max-width: none;
        transform: translateY(-100%);
    }
    
    .achievement-notification.show {
        transform: translateY(0);
    }
}
</style>
`;

// Inject enhanced styles
document.head.insertAdjacentHTML('beforeend', enhancedStyles);

// Export for global use
window.initTypingPractice = initTypingPractice;
window.TypingPractice = TypingPractice;
