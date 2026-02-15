import { state } from './state.js';
import { UNITS_DATA } from './constants.js';

export const Engine = {
    convert() {
        if (!state.currentCategory) return;
        const value = parseFloat(state.currentInput) || 0;
        const fromUnit = document.getElementById('fromUnit').value;
        const toUnit = document.getElementById('toUnit').value;
        const categoryData = UNITS_DATA[state.currentCategory];
        let result;
        if (state.currentCategory === 'fuel') {
            result = fromUnit === toUnit ? value : 235.214 / value;
        } else if (state.currentCategory === 'temp') {
            let celsius = fromUnit === 'C' ? value : fromUnit === 'F' ? (value - 32) * 5/9 : value - 273.15;
            result = toUnit === 'C' ? celsius : toUnit === 'F' ? (celsius * 9/5) + 32 : celsius + 273.15;
        } else {
            result = (value / categoryData[fromUnit]) * categoryData[toUnit];
        }
        return { value, fromUnit, result: isFinite(result) ? result.toFixed(4).replace(/\.?0+$/, "") : "Error" };
    }
};