import { state } from './state.js';
import { audio } from './audio-system.js';

export const UIController = {
    updateDisplay() {
        const display = document.getElementById('display');
        const secondaryDisplay = document.getElementById('secondaryDisplay');
        display.textContent = state.currentInput;
        if (state.operation && state.previousInput) {
            secondaryDisplay.textContent = `${state.previousInput} ${this.getOperationSymbol(state.operation)}`;
        } else {
            secondaryDisplay.textContent = '';
        }
    },

    getOperationSymbol(op) {
        switch(op) {
            case '+': return '+';
            case '-': return '-';
            case '*': return '×';
            case '/': return '÷';
            default: return '';
        }
    },

    typeText(element, text) {
        if (state.typingInterval) clearInterval(state.typingInterval);
        element.textContent = '';
        let i = 0;
        state.typingInterval = setInterval(() => {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                audio.playType();
                i++;
                element.scrollTop = element.scrollHeight;
            } else {
                clearInterval(state.typingInterval);
                state.typingInterval = null;
            }
        }, 30);
    },

    updateScientificButtonsLabels() {
        const buttons = document.querySelectorAll('.scientific-buttons .scientific');
        const labels = state.converterMode ? 
            ['CV', 'Weight', 'Volume', 'Length', 'Storage', 'Area', 'Fuel', 'Freq', 'Time', 'Energy', 'Transfer', 'Temp'] :
            ['CV', 'sin', 'cos', 'tan', 'log', 'ln', '√', 'x^y', 'π', 'e', '( )', '!'];
        buttons.forEach((btn, index) => {
            if (labels[index]) btn.textContent = labels[index];
        });
    }
};