const $ = (selector) => document.querySelector(selector);

let lastConversion = "";
let calculator = {
    current: "0",
    previous: null,
    operator: null,
    waitingForOperand: false,
    expression: ""
};

const baseNames = {
    2: "Binary",
    8: "Octal",
    10: "Decimal",
    16: "Hexadecimal"
};

function setStatus(id, message = "") {
    const element = document.getElementById(id);
    if (element) element.textContent = message;
}

function isValidForBase(value, base) {
    const patterns = {
        2: /^[01]+$/,
        8: /^[0-7]+$/,
        10: /^\\d+$/,
        16: /^[0-9a-f]+$/i
    };
    return patterns[base].test(value);
}

function convertNumber() {
    const rawInput = document.getElementById("numberInput").value.trim();
    const input = rawInput.replace(/^0+(?=\\d)/, "") || "0";
    const fromBase = Number(document.getElementById("fromBase").value);
    const toBase = Number(document.getElementById("toBase").value);

    setStatus("converterStatus");

    if (!rawInput) {
        lastConversion = "";
        document.getElementById("result").textContent = "Enter a value to convert";
        document.getElementById("copyConverterBtn").hidden = true;
        setStatus("converterStatus", "Please enter a value.");
        return;
    }

    if (!isValidForBase(input, fromBase)) {
        lastConversion = "";
        document.getElementById("result").textContent = "Invalid input";
        document.getElementById("copyConverterBtn").hidden = true;
        setStatus("converterStatus", baseNames[fromBase] + " contains an invalid digit for base " + fromBase + ".");
        return;
    }

    try {
        let decimal = BigInt(parseInt(input, fromBase));
        lastConversion = decimal.toString(toBase).toUpperCase();
        document.getElementById("result").textContent = lastConversion;
        document.getElementById("copyConverterBtn").hidden = false;
    } catch {
        lastConversion = "";
        document.getElementById("result").textContent = "Conversion error";
        document.getElementById("copyConverterBtn").hidden = true;
        setStatus("converterStatus", "The value could not be converted.");
    }
}

function swapBases() {
    const from = document.getElementById("fromBase");
    const to = document.getElementById("toBase");
    [from.value, to.value] = [to.value, from.value];

    if (document.getElementById("numberInput").value.trim()) {
        convertNumber();
    } else {
        resetConverterResult();
    }
}

async function copyText(text, button, defaultLabel, statusId) {
    if (!text) return;
    try {
        await navigator.clipboard.writeText(text);
        button.textContent = "✓ Copied";
        setTimeout(() => { button.textContent = defaultLabel; }, 1600);
    } catch {
        setStatus(statusId, "Clipboard access is unavailable. Copy the result manually.");
    }
}

function resetConverterResult() {
    lastConversion = "";
    document.getElementById("result").textContent = "Your converted value will appear here";
    document.getElementById("copyConverterBtn").hidden = true;
    setStatus("converterStatus");
}

function resetConverter() {
    document.getElementById("numberInput").value = "";
    document.getElementById("fromBase").value = "10";
    document.getElementById("toBase").value = "2";
    resetConverterResult();
}

function formatCalculatorNumber(value) {
    if (value === "Error") return value;
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return "Error";
    return Number.isInteger(numeric) ? numeric.toString() : Number(numeric.toPrecision(12)).toString();
}

function updateCalculatorDisplay() {
    document.getElementById("calculatorValue").textContent = calculator.current;
    document.getElementById("calculatorExpression").textContent = calculator.expression;
}

function clearCalculator() {
    calculator = {
        current: "0",
        previous: null,
        operator: null,
        waitingForOperand: false,
        expression: ""
    };
    setStatus("calculatorStatus");
    updateCalculatorDisplay();
}

function inputCalculatorNumber(number) {
    if (calculator.current === "Error" || calculator.waitingForOperand) {
        calculator.current = number;
        calculator.waitingForOperand = false;
    } else {
        calculator.current = calculator.current === "0" ? number : calculator.current + number;
    }
    updateCalculatorDisplay();
}

function inputDecimal() {
    if (calculator.current === "Error" || calculator.waitingForOperand) {
        calculator.current = "0.";
        calculator.waitingForOperand = false;
    } else if (!calculator.current.includes(".")) {
        calculator.current += ".";
    }
    updateCalculatorDisplay();
}

function backspaceCalculator() {
    if (calculator.waitingForOperand || calculator.current === "Error") return;
    calculator.current = calculator.current.length > 1 ? calculator.current.slice(0, -1) : "0";
    if (calculator.current === "-" || calculator.current === "") calculator.current = "0";
    updateCalculatorDisplay();
}

function percentCalculator() {
    if (calculator.current === "Error") return;
    const value = Number(calculator.current);
    if (!Number.isFinite(value)) return;
    calculator.current = formatCalculatorNumber(value / 100);
    updateCalculatorDisplay();
}

function calculate(a, b, operator) {
    switch (operator) {
        case "+": return a + b;
        case "−": return a - b;
        case "×": return a * b;
        case "÷": return b === 0 ? null : a / b;
        default: return b;
    }
}

function chooseOperator(operator) {
    const inputValue = Number(calculator.current);
    if (!Number.isFinite(inputValue)) {
        clearCalculator();
        return;
    }

    if (calculator.previous !== null && calculator.operator && !calculator.waitingForOperand) {
        const result = calculate(calculator.previous, inputValue, calculator.operator);
        if (result === null || !Number.isFinite(result)) {
            calculator.current = "Error";
            calculator.expression = "Cannot divide by zero";
            calculator.previous = null;
            calculator.operator = null;
            calculator.waitingForOperand = true;
            updateCalculatorDisplay();
            return;
        }
        calculator.current = formatCalculatorNumber(result);
        calculator.previous = result;
    } else {
        calculator.previous = inputValue;
    }

    calculator.operator = operator;
    calculator.waitingForOperand = true;
    calculator.expression = calculator.current + " " + operator;
    updateCalculatorDisplay();
}

function equalsCalculator() {
    if (calculator.previous === null || !calculator.operator) return;

    const currentValue = Number(calculator.current);
    const result = calculate(calculator.previous, currentValue, calculator.operator);

    if (result === null || !Number.isFinite(result)) {
        calculator.current = "Error";
        calculator.expression = "Cannot divide by zero";
    } else {
        calculator.expression = calculator.previous + " " + calculator.operator + " " + currentValue + " =";
        calculator.current = formatCalculatorNumber(result);
    }

    calculator.previous = null;
    calculator.operator = null;
    calculator.waitingForOperand = true;
    updateCalculatorDisplay();
}

function handleCalculatorAction(action) {
    switch (action) {
        case "clear": clearCalculator(); break;
        case "backspace": backspaceCalculator(); break;
        case "percent": percentCalculator(); break;
        case "decimal": inputDecimal(); break;
        case "equals": equalsCalculator(); break;
    }
}

function handleCalculatorKeyboard(event) {
    if (document.activeElement === document.getElementById("numberInput")) return;

    const key = event.key;
    if (/^\\d$/.test(key)) {
        event.preventDefault();
        inputCalculatorNumber(key);
    } else if (key === ".") {
        event.preventDefault();
        inputDecimal();
    } else if (["+", "-", "*", "/"].includes(key)) {
        event.preventDefault();
        const operatorMap = { "+": "+", "-": "−", "*": "×", "/": "÷" };
        chooseOperator(operatorMap[key]);
    } else if (key === "Enter" || key === "=") {
        event.preventDefault();
        equalsCalculator();
    } else if (key === "Backspace") {
        event.preventDefault();
        backspaceCalculator();
    } else if (key === "Escape") {
        event.preventDefault();
        clearCalculator();
    }
}

document.getElementById("convertBtn").addEventListener("click", convertNumber);
document.getElementById("swapBtn").addEventListener("click", swapBases);
document.getElementById("clearConverterBtn").addEventListener("click", resetConverter);

document.getElementById("numberInput").addEventListener("input", resetConverterResult);
document.getElementById("numberInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        convertNumber();
    }
});

document.getElementById("copyConverterBtn").addEventListener("click", (event) => {
    copyText(lastConversion, event.currentTarget, "Copy", "converterStatus");
});

document.querySelectorAll(".calc-key").forEach((button) => {
    button.addEventListener("click", () => {
        if (button.dataset.number !== undefined) {
            inputCalculatorNumber(button.dataset.number);
        } else if (button.dataset.operator) {
            chooseOperator(button.dataset.operator);
        } else if (button.dataset.action) {
            handleCalculatorAction(button.dataset.action);
        }
    });
});

document.getElementById("copyCalculatorBtn").addEventListener("click", (event) => {
    const result = calculator.current === "Error" ? "" : calculator.current;
    copyText(result, event.currentTarget, "Copy Result", "calculatorStatus");
});

document.addEventListener("keydown", handleCalculatorKeyboard);

clearCalculator();
resetConverterResult();
