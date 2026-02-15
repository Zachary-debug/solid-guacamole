import { state } from './state.js';
import { UNITS_DATA } from './constants.js';
import { audio } from './audio-system.js';
import { UIController } from './ui-controller.js';

// CalcES Calculation Engine
class CalcES {
    constructor() {
        this.stack = [];
        this.memory = 0;
        this.angleMode = 'DEG'; // DEG or RAD
        this.display = '0';
        this.lastWasOp = false;
    }

    inputDigit(digit) {
        if (this.lastWasOp) {
            this.display = '0';
            this.lastWasOp = false;
        }
        if (this.display === '0') {
            this.display = digit;
        } else if (this.display.length < 12) {
            this.display += digit;
        }
        return this.display;
    }

    inputDecimal() {
        if (this.lastWasOp) {
            this.display = '0';
            this.lastWasOp = false;
        }
        if (!this.display.includes('.')) {
            this.display += '.';
        }
        return this.display;
    }

    inputOperator(op) {
        if (this.stack.length === 0) {
            this.stack.push(parseFloat(this.display));
        } else if (!this.lastWasOp) {
            this.calculate();
            this.stack[0] = parseFloat(this.display);
        }
        this.stack[1] = op;
        this.lastWasOp = true;
        return this.display;
    }

    calculate() {
        if (this.stack.length < 2) return this.display;
        
        const b = parseFloat(this.display);
        const a = this.stack[0];
        const op = this.stack[1];
        let result;

        switch (op) {
            case '+': result = a + b; break;
            case '-': result = a - b; break;
            case '*': result = a * b; break;
            case '/': result = b !== 0 ? a / b : 'Error'; break;
            case '^': result = Math.pow(a, b); break;
            default: return this.display;
        }

        this.display = result === 'Error' ? 'Error' : this.formatResult(result);
        this.stack = [];
        this.lastWasOp = true;
        return this.display;
    }

    formatResult(val) {
        const str = val.toString();
        return str.length > 12 ? val.toExponential(6) : str;
    }

    scientificFunction(func) {
        const value = parseFloat(this.display);
        let result;

        switch (func) {
            case 'sin': result = Math.sin(this.angleMode === 'DEG' ? value * Math.PI / 180 : value); break;
            case 'cos': result = Math.cos(this.angleMode === 'DEG' ? value * Math.PI / 180 : value); break;
            case 'tan': result = Math.tan(this.angleMode === 'DEG' ? value * Math.PI / 180 : value); break;
            case 'log': result = Math.log10(value); break;
            case 'ln': result = Math.log(value); break;
            case 'sqrt': result = Math.sqrt(value); break;
            case 'pow': result = value * value; this.lastWasOp = true; break;
            case 'pi': result = Math.PI; break;
            case 'e': result = Math.E; break;
            case 'factorial': result = (function f(n){return n<2?1:n*f(n-1)})(Math.floor(value)); break;
            default: return;
        }

        this.display = this.formatResult(result);
        this.lastWasOp = true;
        return true;
    }

    clear() {
        this.display = '0';
        this.stack = [];
        this.lastWasOp = false;
        return this.display;
    }

    clearEntry() {
        this.display = '0';
        return this.display;
    }

    memoryClear() { this.memory = 0; }
    memoryRecall() { this.display = this.memory.toString(); return this.display; }
    memoryAdd() { this.memory += parseFloat(this.display) || 0; }
    memorySubtract() { this.memory -= parseFloat(this.display) || 0; }
    toggleSign() { 
        this.display = this.display.startsWith('-') ? this.display.substring(1) : '-' + this.display;
        return this.display;
    }
}

const calcES = new CalcES();

window.appendNumber = (num) => {
    if (!state.isOn) return;
    state.currentInput = calcES.inputDigit(num);
    UIController.updateDisplay();
};

window.appendDecimal = () => {
    if (!state.isOn) return;
    state.currentInput = calcES.inputDecimal();
    UIController.updateDisplay();
};

window.appendOperator = (op) => {
    if (!state.isOn) return;
    state.currentInput = calcES.inputOperator(op);
    state.operation = op;
    UIController.updateDisplay();
};

window.calculate = () => {
    if (!state.isOn) return;
    state.currentInput = calcES.calculate();
    UIController.updateDisplay();
};

window.scientificFunction = (func) => {
    if (!state.isOn) return;
    if (state.converterMode) {
        const categories = { sin: 'weight', cos: 'volume', tan: 'length', log: 'storage', ln: 'area', sqrt: 'fuel', pow: 'frequency', pi: 'time', e: 'energy', parens: 'transfer', factorial: 'temp' };
        if (categories[func]) window.setupUnitDropdowns(categories[func]);
        return;
    }
    if (func === 'parens') {
        state.currentInput = state.currentInput === '0' ? '(' : state.currentInput + '(';
        UIController.updateDisplay();
        return;
    }
    calcES.scientific(func) && UIController.updateDisplay();
};

window.setupUnitDropdowns = (category) => {
    state.currentCategory = category;
    const fromSelect = document.getElementById('fromUnit'), toSelect = document.getElementById('toUnit');
    fromSelect.innerHTML = ''; toSelect.innerHTML = '';
    Object.keys(UNITS_DATA[category]).forEach(unit => {
        const o1 = document.createElement('option'), o2 = document.createElement('option');
        o1.value = o1.textContent = o2.value = o2.textContent = unit;
        fromSelect.appendChild(o1); toSelect.appendChild(o2);
    });
    if (fromSelect.options.length > 1) toSelect.selectedIndex = 1;
    document.getElementById('unitSelector').classList.remove('hidden');
    window.convertUnit();
};

window.convertUnit = () => {
    const res = Engine.convert();
    if (res) {
        document.getElementById('secondaryDisplay').textContent = `${res.value} ${res.fromUnit} =`;
        document.getElementById('display').textContent = res.result;
    }
};

window.toggleConverterMode = () => {
    if (!state.isOn) return;
    state.converterMode = !state.converterMode;
    const btns = document.querySelectorAll('.cv-btn');
    if (state.converterMode) {
        btns.forEach(b => b.textContent = 'SC');
    } else {
        btns.forEach(b => b.textContent = 'CV');
        document.getElementById('unitSelector').classList.add('hidden');
        state.currentCategory = null;
        UIController.updateDisplay();
    }
    UIController.updateScientificButtonsLabels();
};

window.memoryClear = () => { if (state.isOn) calcES.memoryClear(); };
window.memoryRecall = () => { if (state.isOn) { state.currentInput = calcES.memoryRecall(); UIController.updateDisplay(); } };
window.memoryAdd = () => { if (state.isOn) calcES.memoryAdd(); };
window.memorySubtract = () => { if (state.isOn) calcES.memorySubtract(); };

window.toggleShift = () => {
    if (!state.isOn) return;
    state.shiftActive = !state.shiftActive;
    if (state.shiftActive) state.alphaActive = false;
    document.querySelector('.btn-shift').classList.toggle('active', state.shiftActive);
    document.querySelector('.btn-alpha').classList.remove('active');
};

window.toggleAlpha = () => {
    if (!state.isOn) return;
    state.alphaActive = !state.alphaActive;
    if (state.alphaActive) state.shiftActive = false;
    document.querySelector('.btn-alpha').classList.toggle('active', state.alphaActive);
    document.querySelector('.btn-shift').classList.remove('active');
};

window.toggleSign = () => {
    if (!state.isOn) return;
    state.currentInput = calcES.toggleSign();
    UIController.updateDisplay();
};

window.clearAll = () => {
    if (!state.isOn) return;
    state.currentInput = calcES.clear();
    if (state.typingInterval) { clearInterval(state.typingInterval); state.typingInterval = null; }
    document.getElementById('lexiconDisplay').textContent = '';
    UIController.updateDisplay();
};

window.clearEntry = () => { 
    if (!state.isOn) return;
    state.currentInput = calcES.clearEntry();
    UIController.updateDisplay(); 
};

window.lexicon = async () => {
    if (!state.isOn) return;
    const display = document.getElementById('lexiconDisplay');
    display.textContent = "Processing...";
    try {
        let content;
        if (state.converterMode && state.currentCategory) {
            content = `Converting ${state.currentInput} ${document.getElementById('fromUnit').value} to ${document.getElementById('toUnit').value}. Result above.`;
        } else {
            await audio.resume();
            audio.startProcessing();
            const completion = await websim.chat.completions.create({
                messages: [{ role: "user", content: `Give a real-time AI overview of the number ${state.currentInput} in one concise sentence.` }]
            });
            content = completion.content;
            audio.stopProcessing();
        }
        UIController.typeText(display, content);
    } catch (e) { audio.stopProcessing(); display.textContent = "Error fetching data."; }
};

window.togglePower = () => {
    const container = document.getElementById('mainDisplayContainer');
    if (state.isOn) {
        state.isOn = false;
        container.classList.add('is-off');
        audio.stopProcessing(); audio.stopFan();
        if (state.typingInterval) clearInterval(state.typingInterval);
    } else {
        container.classList.add('starting-up');
        audio.resume().then(() => audio.startFan());
        setTimeout(() => {
            state.isOn = true;
            container.classList.remove('is-off', 'starting-up');
            calcES.clear();
            state.currentInput = calcES.display;
            UIController.updateDisplay();
        }, 650);
    }
};

const setupAudio = () => {
    audio.init();
    document.removeEventListener('mousedown', setupAudio);
    document.removeEventListener('keydown', setupAudio);
};
document.addEventListener('mousedown', setupAudio);
document.addEventListener('keydown', setupAudio);

document.addEventListener('keydown', (e) => {
    if (!state.isOn) return;
    if (e.key >= '0' && e.key <= '9') window.appendNumber(e.key);
    else if (e.key === '.') window.appendDecimal();
    else if (['+', '-', '*', '/'].includes(e.key)) window.appendOperator(e.key);
    else if (e.key === 'Enter' || e.key === '=') window.calculate();
    else if (e.key === 'Escape') window.clearAll();
    else if (e.key === 'Backspace') {
        state.currentInput = state.currentInput.length > 1 ? state.currentInput.slice(0, -1) : '0';
        UIController.updateDisplay();
    }
});

document.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('mousedown', () => audio.resume().then(() => audio.playClick()));
});

UIController.updateDisplay();