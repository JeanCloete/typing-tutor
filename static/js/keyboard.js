// Virtual Keyboard Implementation
class VirtualKeyboard {
    constructor(container) {
        this.container = container;
        this.keys = {};
        this.currentChar = '';
        this.isVisible = true;
        this.init();
    }
    
    init() {
        this.createKeyboard();
        this.bindEvents();
    }
    
    createKeyboard() {
        const keyboardLayout = [
            ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
            ['Tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
            ['CapsLock', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", 'Enter'],
            ['Shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'Shift'],
            ['Ctrl', 'Win', 'Alt', 'Space', 'Alt', 'Win', 'Menu', 'Ctrl']
        ];
        
        this.container.innerHTML = '';
        
        keyboardLayout.forEach((row, rowIndex) => {
            const rowElement = document.createElement('div');
            rowElement.className = 'keyboard-row';
            
            row.forEach(keyName => {
                const keyElement = document.createElement('div');
                keyElement.className = 'key';
                keyElement.dataset.key = keyName.toLowerCase();
                
                // Add special classes for different key types
                if (keyName === 'Space') {
                    keyElement.classList.add('space');
                    keyElement.textContent = '';
                } else if (['Backspace', 'Tab', 'Enter', 'Shift', 'Ctrl', 'Alt', 'Win', 'Menu', 'CapsLock'].includes(keyName)) {
                    keyElement.classList.add('wide');
                    keyElement.textContent = keyName;
                } else {
                    keyElement.textContent = keyName;
                }
                
                // Apply finger color
                this.applyFingerColor(keyElement, keyName);
                
                this.keys[keyName.toLowerCase()] = keyElement;
                rowElement.appendChild(keyElement);
            });
            
            this.container.appendChild(rowElement);
        });
    }
    
    applyFingerColor(keyElement, keyName) {
        const fingerMapping = {
            // Left hand
            '`': 'pinky-left', '1': 'pinky-left', 'q': 'pinky-left', 'a': 'pinky-left', 'z': 'pinky-left',
            'tab': 'pinky-left', 'capslock': 'pinky-left', 'shift': 'pinky-left',
            
            '2': 'ring-left', 'w': 'ring-left', 's': 'ring-left', 'x': 'ring-left',
            
            '3': 'middle-left', 'e': 'middle-left', 'd': 'middle-left', 'c': 'middle-left',
            
            '4': 'index-left', '5': 'index-left', 'r': 'index-left', 't': 'index-left',
            'f': 'index-left', 'g': 'index-left', 'v': 'index-left', 'b': 'index-left',
            
            // Thumbs
            'space': 'thumb', 'alt': 'thumb',
            
            // Right hand
            '6': 'index-right', '7': 'index-right', 'y': 'index-right', 'u': 'index-right',
            'h': 'index-right', 'j': 'index-right', 'n': 'index-right', 'm': 'index-right',
            
            '8': 'middle-right', 'i': 'middle-right', 'k': 'middle-right', ',': 'middle-right',
            
            '9': 'ring-right', 'o': 'ring-right', 'l': 'ring-right', '.': 'ring-right',
            
            '0': 'pinky-right', '-': 'pinky-right', '=': 'pinky-right', 
            'p': 'pinky-right', '[': 'pinky-right', ']': 'pinky-right', '\\': 'pinky-right',
            ';': 'pinky-right', "'": 'pinky-right', '/': 'pinky-right',
            'backspace': 'pinky-right', 'enter': 'pinky-right'
        };
        
        const fingerColors = {
            'pinky-left': '#ff6b6b',
            'ring-left': '#4ecdc4', 
            'middle-left': '#45b7d1',
            'index-left': '#96ceb4',
            'thumb': '#feca57',
            'index-right': '#ff9ff3',
            'middle-right': '#f38ba8',
            'ring-right': '#a6e3a1',
            'pinky-right': '#fab387'
        };
        
        const finger = fingerMapping[keyName.toLowerCase()];
        if (finger && fingerColors[finger]) {
            keyElement.style.setProperty('--finger-color', fingerColors[finger]);
            keyElement.setAttribute('data-finger', finger);
        }
    }
    
    bindEvents() {
        // Toggle keyboard visibility
        const toggleBtn = document.getElementById('toggleKeyboard');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.toggle();
            });
        }
    }
    
    highlightKey(char) {
        // Remove previous highlights
        this.clearHighlights();
        
        if (!char) return;
        
        const key = char.toLowerCase();
        let keyElement = null;
        
        // Special character mappings
        const specialMappings = {
            ' ': 'space',
            '\t': 'tab',
            '\n': 'enter',
            '\r': 'enter'
        };
        
        const mappedKey = specialMappings[key] || key;
        keyElement = this.keys[mappedKey];
        
        if (keyElement) {
            keyElement.classList.add('next');
            this.currentChar = char;
            
            // Show finger position hint
            this.showFingerHint(keyElement);
        }
    }
    
    showFingerHint(keyElement) {
        const finger = keyElement.getAttribute('data-finger');
        if (finger) {
            // Remove previous finger hints
            document.querySelectorAll('.finger-hint').forEach(el => {
                el.classList.remove('finger-hint');
            });
            
            // Add finger hint to legend
            const fingerLegend = document.querySelector(`[data-finger="${finger}"]`);
            if (fingerLegend) {
                fingerLegend.classList.add('finger-hint');
            }
        }
    }
    
    clearHighlights() {
        Object.values(this.keys).forEach(key => {
            key.classList.remove('active', 'next');
        });
        
        // Clear finger hints
        document.querySelectorAll('.finger-hint').forEach(el => {
            el.classList.remove('finger-hint');
        });
    }
    
    pressKey(char) {
        const key = char.toLowerCase();
        const specialMappings = {
            ' ': 'space',
            '\t': 'tab',
            '\n': 'enter',
            '\r': 'enter'
        };
        
        const mappedKey = specialMappings[key] || key;
        const keyElement = this.keys[mappedKey];
        
        if (keyElement) {
            keyElement.classList.add('active');
            
            // Remove active state after animation
            setTimeout(() => {
                keyElement.classList.remove('active');
            }, 150);
        }
    }
    
    toggle() {
        this.isVisible = !this.isVisible;
        this.container.parentElement.style.display = this.isVisible ? 'block' : 'none';
        
        const toggleBtn = document.getElementById('toggleKeyboard');
        if (toggleBtn) {
            const span = toggleBtn.querySelector('span');
            const icon = toggleBtn.querySelector('i');
            if (span && icon) {
                span.textContent = this.isVisible ? 'Hide Keyboard' : 'Show Keyboard';
                icon.className = this.isVisible ? 'fas fa-keyboard' : 'fas fa-eye';
            }
        }
    }
    
    show() {
        this.isVisible = true;
        this.container.parentElement.style.display = 'block';
    }
    
    hide() {
        this.isVisible = false;
        this.container.parentElement.style.display = 'none';
    }
}

// Initialize keyboard when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const keyboardContainer = document.getElementById('virtualKeyboard');
    if (keyboardContainer) {
        window.virtualKeyboard = new VirtualKeyboard(keyboardContainer);
    }
});

// Export for use in other modules
window.VirtualKeyboard = VirtualKeyboard;
