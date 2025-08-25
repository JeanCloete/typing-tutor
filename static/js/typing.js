class TypingTutor {
    constructor() {
        this.lessonContent = document.querySelector('meta[name="lesson-content"]').getAttribute('content');
        this.lessonId = document.querySelector('meta[name="lesson-id"]').getAttribute('content');
        this.currentPosition = 0;
        this.errors = 0;
        this.startTime = null;
        this.isCompleted = false;
        this.typedText = '';
        
        this.textDisplay = document.getElementById('textDisplay');
        this.wpmDisplay = document.getElementById('wpmDisplay');
        this.accuracyDisplay = document.getElementById('accuracyDisplay');
        this.timeDisplay = document.getElementById('timeDisplay');
        this.errorsDisplay = document.getElementById('errorsDisplay');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.resultsModal = document.getElementById('resultsModal');
        this.virtualKeyboard = document.getElementById('virtualKeyboard');
        
        this.init();
    }
    
    init() {
        this.renderText();
        this.bindEvents();
        this.startTimer();
        this.createVirtualKeyboard();
        
        // Focus on the text display for direct typing
        this.textDisplay.focus();
    }
    
    renderText() {
        // Clear previous content
        this.textDisplay.innerHTML = '';
        
        // Single line display - show only a window of characters
        const windowSize = 50; // Characters visible at once
        const startIndex = Math.max(0, this.currentPosition - 10); // Show 10 chars before current
        const endIndex = Math.min(this.lessonContent.length, startIndex + windowSize);
        
        // Create character spans for the visible window
        for (let i = startIndex; i < endIndex; i++) {
            const char = this.lessonContent[i];
            const span = document.createElement('span');
            span.textContent = char === ' ' ? '\u00A0' : char; // Use non-breaking space
            span.className = 'char';
            span.dataset.index = i;
            
            // Apply styling based on position
            if (i < this.currentPosition) {
                if (i < this.typedText.length && this.typedText[i] === char) {
                    span.classList.add('correct');
                } else {
                    span.classList.add('incorrect');
                }
            } else if (i === this.currentPosition) {
                span.classList.add('current');
            }
            
            this.textDisplay.appendChild(span);
        }
        
       // Always ensure text is left-aligned without any transform
            this.textDisplay.style.transform = 'translateX(0)';
    }
    
    centerCurrentChar() {
        const currentChar = this.textDisplay.querySelector('.current');
        if (currentChar) {
            const container = this.textDisplay.parentElement;
            const containerWidth = container.clientWidth;
            const charRect = currentChar.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            
            const charCenter = charRect.left - containerRect.left + (charRect.width / 2);
            const targetPosition = containerWidth / 2;
            const scrollOffset = charCenter - targetPosition;
            
            // Apply smooth transform for professional single-line scrolling
            this.textDisplay.style.transform = `translateX(${-scrollOffset}px)`;
        }
    }
    
    createVirtualKeyboard() {
        const keyboardLayout = [
            ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
            ['Tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
            ['CapsLock', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", 'Enter'],
            ['Shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'Shift'],
            ['Ctrl', 'Alt', ' ', 'Alt', 'Ctrl']
        ];
        
        // Finger color mapping for proper touch typing
        const fingerMapping = {
            '`': 'left-pinky', '1': 'left-pinky', 'q': 'left-pinky', 'a': 'left-pinky', 'z': 'left-pinky',
            '2': 'left-ring', 'w': 'left-ring', 's': 'left-ring', 'x': 'left-ring',
            '3': 'left-middle', 'e': 'left-middle', 'd': 'left-middle', 'c': 'left-middle',
            '4': 'left-index', '5': 'left-index', 'r': 'left-index', 't': 'left-index', 'f': 'left-index', 'g': 'left-index', 'v': 'left-index', 'b': 'left-index',
            ' ': 'thumbs',
            '6': 'right-index', '7': 'right-index', 'y': 'right-index', 'u': 'right-index', 'h': 'right-index', 'j': 'right-index', 'n': 'right-index', 'm': 'right-index',
            '8': 'right-middle', 'i': 'right-middle', 'k': 'right-middle', ',': 'right-middle',
            '9': 'right-ring', 'o': 'right-ring', 'l': 'right-ring', '.': 'right-ring',
            '0': 'right-pinky', '-': 'right-pinky', '=': 'right-pinky', 'p': 'right-pinky', '[': 'right-pinky', ']': 'right-pinky', '\\': 'right-pinky', ';': 'right-pinky', "'": 'right-pinky', '/': 'right-pinky'
        };
        
        // Create finger guides
        const fingerGuides = document.createElement('div');
        fingerGuides.className = 'finger-guides';
        fingerGuides.innerHTML = `
            <div class="finger-guide">
                <div class="finger-color finger-left-pinky"></div>
                <span>Left Pinky</span>
            </div>
            <div class="finger-guide">
                <div class="finger-color finger-left-ring"></div>
                <span>Left Ring</span>
            </div>
            <div class="finger-guide">
                <div class="finger-color finger-left-middle"></div>
                <span>Left Middle</span>
            </div>
            <div class="finger-guide">
                <div class="finger-color finger-left-index"></div>
                <span>Left Index</span>
            </div>
            <div class="finger-guide">
                <div class="finger-color finger-thumbs"></div>
                <span>Thumbs</span>
            </div>
            <div class="finger-guide">
                <div class="finger-color finger-right-index"></div>
                <span>Right Index</span>
            </div>
            <div class="finger-guide">
                <div class="finger-color finger-right-middle"></div>
                <span>Right Middle</span>
            </div>
            <div class="finger-guide">
                <div class="finger-color finger-right-ring"></div>
                <span>Right Ring</span>
            </div>
            <div class="finger-guide">
                <div class="finger-color finger-right-pinky"></div>
                <span>Right Pinky</span>
            </div>
        `;
        
        this.virtualKeyboard.appendChild(fingerGuides);
        
        keyboardLayout.forEach(row => {
            const keyboardRow = document.createElement('div');
            keyboardRow.className = 'keyboard-row';
            
            row.forEach(key => {
                const keyElement = document.createElement('div');
                keyElement.className = 'key';
                keyElement.textContent = key === ' ' ? 'Space' : key;
                keyElement.dataset.key = key.toLowerCase();
                
                // Add finger color classes
                if (fingerMapping[key.toLowerCase()]) {
                    keyElement.classList.add('finger-' + fingerMapping[key.toLowerCase()]);
                }
                
                // Special key styling
                if (['Backspace', 'Tab', 'CapsLock', 'Enter', 'Shift', 'Ctrl', 'Alt'].includes(key)) {
                    keyElement.classList.add(key.toLowerCase());
                }
                if (key === ' ') {
                    keyElement.classList.add('space');
                }
                
                keyboardRow.appendChild(keyElement);
            });
            
            this.virtualKeyboard.appendChild(keyboardRow);
        });
    }
    
    highlightKey(key) {
        // Remove previous highlights
        document.querySelectorAll('.key.active').forEach(k => k.classList.remove('active'));
        
        // Highlight current key that should be pressed
        const expectedChar = this.lessonContent[this.currentPosition];
        if (expectedChar) {
            const keyElement = document.querySelector(`.key[data-key="${expectedChar.toLowerCase()}"]`);
            if (keyElement) {
                keyElement.classList.add('active');
            }
        }
    }
    
    bindEvents() {
        // Listen for keydown events on the text display
        this.textDisplay.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // Prevent default text editing behaviors
        this.textDisplay.addEventListener('keypress', (e) => e.preventDefault());
        this.textDisplay.addEventListener('input', (e) => e.preventDefault());
        this.textDisplay.addEventListener('paste', (e) => e.preventDefault());
        
        // Control buttons
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
        document.getElementById('tryAgainBtn').addEventListener('click', () => this.reset());
        
        // Maintain focus on text display
        this.textDisplay.addEventListener('blur', () => {
            if (!this.isCompleted) {
                setTimeout(() => this.textDisplay.focus(), 0);
            }
        });
        
        // Auto-focus when clicking anywhere
        document.addEventListener('click', (e) => {
            if (!this.isCompleted && !e.target.closest('.modal')) {
                setTimeout(() => this.textDisplay.focus(), 0);
            }
        });
        
        // Highlight the expected key initially
        this.highlightKey();
    }
    
    handleKeyDown(e) {
        // Prevent all default behaviors for text editing
        e.preventDefault();
        
        // Start timer on first keypress
        if (!this.startTime) {
            this.startTime = Date.now();
        }
        
        // Handle backspace
        if (e.key === 'Backspace' && this.currentPosition > 0) {
            this.currentPosition--;
            this.typedText = this.typedText.slice(0, -1);
            this.renderText();
            this.updateStats();
            this.highlightKey();
            return;
        }
        
        // Skip non-printable keys except space
        if (e.key.length > 1 && e.key !== ' ') {
            return;
        }
        
        // Check if lesson is complete
        if (this.currentPosition >= this.lessonContent.length) {
            this.completeLesson();
            return;
        }
        
        const expectedChar = this.lessonContent[this.currentPosition];
        const typedChar = e.key;
        
        // Update keyboard visual feedback
        const keyElement = document.querySelector(`.key[data-key="${expectedChar.toLowerCase()}"]`);
        if (keyElement) {
            keyElement.classList.remove('active');
            if (typedChar === expectedChar) {
                keyElement.classList.add('correct');
                setTimeout(() => keyElement.classList.remove('correct'), 200);
            } else {
                keyElement.classList.add('incorrect');
                setTimeout(() => keyElement.classList.remove('incorrect'), 500);
            }
        }
        
        // Track the typed character
        this.typedText += typedChar;
        
        // Check if character is correct
        if (typedChar !== expectedChar) {
            this.errors++;
        }
        
        this.currentPosition++;
        this.updateStats();
        this.renderText();
        this.highlightKey();
        
        
        
        // Check if lesson is complete
        if (this.currentPosition >= this.lessonContent.length) {
            this.completeLesson();
        }
    }
    
    updateStats() {
        const timeElapsed = this.startTime ? (Date.now() - this.startTime) / 1000 : 0;
        const wpm = this.calculateWPM(timeElapsed);
        const accuracy = this.calculateAccuracy();
        
        this.wpmDisplay.textContent = Math.round(wpm);
        this.accuracyDisplay.textContent = Math.round(accuracy) + '%';
        this.timeDisplay.textContent = this.formatTime(timeElapsed);
        this.errorsDisplay.textContent = this.errors;
        
        // Update progress
        const progress = (this.currentPosition / this.lessonContent.length) * 100;
        this.progressFill.style.width = progress + '%';
        this.progressText.textContent = Math.round(progress) + '% Complete';
    }
    
    calculateWPM(timeElapsed) {
        if (timeElapsed === 0) return 0;
        const characters = this.currentPosition;
        const words = characters / 5; // Standard WPM calculation
        const minutes = timeElapsed / 60;
        return words / minutes;
    }
    
    calculateAccuracy() {
        if (this.currentPosition === 0) return 100;
        const correctChars = this.currentPosition - this.errors;
        return (correctChars / this.currentPosition) * 100;
    }
    
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    startTimer() {
        this.timerInterval = setInterval(() => {
            if (this.startTime && !this.isCompleted) {
                this.updateStats();
            }
        }, 1000);
    }
    
    completeLesson() {
        this.isCompleted = true;
        clearInterval(this.timerInterval);
        
        const timeElapsed = (Date.now() - this.startTime) / 1000;
        const wpm = this.calculateWPM(timeElapsed);
        const accuracy = this.calculateAccuracy();
        
        this.showResults(wpm, accuracy, timeElapsed);
        
        // Save progress if user is logged in
        if (document.querySelector('meta[name="csrf-token"]') || true) { // Assuming user is logged in
            this.saveProgress(wpm, accuracy, timeElapsed);
        }
    }
    
    showResults(wpm, accuracy, timeElapsed) {
        // Update result displays
        document.getElementById('finalWpm').textContent = Math.round(wpm);
        document.getElementById('finalAccuracy').textContent = Math.round(accuracy) + '%';
        document.getElementById('finalTime').textContent = this.formatTime(timeElapsed);
        document.getElementById('finalErrors').textContent = this.errors;
        
        // Calculate and show grade
        const grade = this.calculateGrade(wpm, accuracy);
        const gradeBadge = document.getElementById('gradeBadge');
        const gradeText = document.getElementById('gradeText');
        gradeText.textContent = grade;
        
        // Color code the grade
        gradeBadge.className = 'grade-badge';
        if (grade === 'Expert') {
            gradeBadge.style.backgroundColor = '#10b981';
        } else if (grade === 'Advanced') {
            gradeBadge.style.backgroundColor = '#3b82f6';
        } else if (grade === 'Intermediate') {
            gradeBadge.style.backgroundColor = '#f59e0b';
        } else {
            gradeBadge.style.backgroundColor = '#ef4444';
        }
        
        // Show modal
        this.resultsModal.classList.add('active');
        
        // Handle next lesson button
        const nextLessonBtn = document.getElementById('nextLessonBtn');
        if (accuracy >= 95 && parseInt(this.lessonId) < 21) {
            nextLessonBtn.style.display = 'inline-flex';
            nextLessonBtn.onclick = () => {
                window.location.href = `/lesson/${parseInt(this.lessonId) + 1}`;
            };
        }
    }
    
    calculateGrade(wpm, accuracy) {
        if (accuracy < 80) {
            return "Needs Practice";
        } else if (accuracy >= 95 && wpm >= 40) {
            return "Expert";
        } else if (accuracy >= 95 && wpm >= 25) {
            return "Advanced";
        } else if (accuracy >= 90) {
            return "Intermediate";
        } else if (accuracy >= 85) {
            return "Developing";
        } else {
            return "Beginner";
        }
    }
    
    async saveProgress(wpm, accuracy, timeElapsed) {
        try {
            const response = await fetch(`/save_progress/${this.lessonId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    wpm: wpm,
                    accuracy: accuracy,
                    time_taken: Math.round(timeElapsed),
                    errors: this.errors
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                this.showAchievements(result.achievements);
            }
        } catch (error) {
            console.error('Error saving progress:', error);
        }
    }
    
    showAchievements(achievements) {
        const achievementsList = document.getElementById('achievementsList');
        achievementsList.innerHTML = '';
        
        achievements.forEach(achievement => {
            const achievementDiv = document.createElement('div');
            achievementDiv.className = 'achievement-item';
            achievementDiv.innerHTML = `
                <i class="fas fa-trophy"></i>
                <span>${achievement}</span>
            `;
            achievementsList.appendChild(achievementDiv);
        });
    }
    
    reset() {
        this.currentPosition = 0;
        this.errors = 0;
        this.startTime = null;
        this.isCompleted = false;
        this.typedText = '';
        
        // Clear keyboard highlights
        document.querySelectorAll('.key.active, .key.correct, .key.incorrect').forEach(key => {
            key.classList.remove('active', 'correct', 'incorrect');
        });
        
        this.renderText();
        this.updateStats();
        this.highlightKey();
        
        this.resultsModal.classList.remove('active');
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        this.startTimer();
        
        // Refocus on text display
        setTimeout(() => this.textDisplay.focus(), 100);
    }
}

// Initialize the typing tutor when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TypingTutor();
});

// Modal close functionality
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');

  if (!themeToggle || !themeIcon) {
    console.warn('Theme elements not found. Check IDs.');
    return;
  }

  // Apply saved or system preference
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const saved = localStorage.getItem('darkMode');
  const isDark = saved ? saved === 'enabled' : prefersDark;

  if (isDark) {
    document.body.classList.add('dark');
    themeIcon.classList.replace('fa-moon', 'fa-sun');
  }

  // Toggle theme
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const isNowDark = document.body.classList.contains('dark');

    localStorage.setItem('darkMode', isNowDark ? 'enabled' : 'disabled');
    themeIcon.classList.replace('fa-moon', isNowDark ? 'fa-sun' : 'fa-moon');
  });
});