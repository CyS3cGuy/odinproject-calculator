// Calculator object
const calculator = {
    num1: "",
    num2: "",
    operator: "",
    tempNum: "",
    pointer: 1,  // The pointer functions to tell program to display which number on screen

    init: function () {
        this.num1 = "";
        this.num2 = "";
        this.operator = "";
        this.pointer = 1;
    },

    operate: function (a, b, op) {
        return op === "+" ? this.add(a, b).toString() :
            op === "-" ? this.subtract(a, b).toString() :
                op === "*" ? this.multiply(a, b).toString() :
                    op === "/" ? this.divide(a, b).toString() :
                        "ERROR";
    },

    add: (a, b) => a + b,

    subtract: (a, b) => a - b,

    multiply: (a, b) => a * b,

    divide: (a, b) => a / b, // this has to be amended to account for division by 0
};

// DOM
const storageDisplay = document.querySelector("#storage-display");
const calcScreen = document.querySelector("#calc-screen");
const calcPad = document.querySelector("#calc-pad");

dom_clearCalcScreen(calcScreen);
dom_addNumPadButtonEventListener(calculator, calcPad, calcScreen, storageDisplay);
dom_addOperatorButtonEventListener(calculator, calcPad, calcScreen, storageDisplay);
dom_addEqualButtonEventListener(calculator, calcScreen, storageDisplay);
dom_addAllClearButtonEventListener(calculator, calcPad, calcScreen, storageDisplay);

// DOM display update function
function dom_clearCalcScreen(calcScreen) {
    calcScreen.querySelectorAll(".digit").forEach((eachDigit, index, arr) => {
        eachDigit.textContent = index === arr.length - 1 ? "0" : "";
    });
}

function dom_updateCalcScreen(calculator, calcScreen) {
    let isNum1Empty = calculator.num1 === "";
    let isNum2Empty = calculator.num2 === "";

    // Adding this validation to handle cases where user click an operator without first supplying num1
    if (isNum1Empty && isNum2Empty) {
        return;
    }

    // Check for num 2 first, before num 1, because num 2 may be available.
    calculator.pointer = !isNum2Empty ? 2 : !isNum1Empty ? 1 : -1 && console.log("Error: No pointer value.");

    let num = calculator.pointer === 1 ? calculator.num1 : calculator.pointer === 2 ? calculator.num2 : "0" && console.log("Error: Num not defined as no pointer value");

    dom_clearCalcScreen(calcScreen);
    const digitDisplayArr = Array.from(calcScreen.querySelectorAll(".actual"));

    const numArr = num.split("").reverse(); // Reversing the string so that least significant bit takes the index 0 position

    for (let i = 0; i < numArr.length; i++) {
        const desiredDigit = digitDisplayArr.find(single => +single.getAttribute("index") === i); // let program know which div to update text content
        desiredDigit.querySelector(".digit").textContent = numArr[i];
    }
}

function dom_updateStorageDisplay(calculator, storageDisplay) {
    storageDisplay.querySelector(".num1").textContent = calculator.num1;
    storageDisplay.querySelector(".num2").textContent = calculator.num2;
    storageDisplay.querySelector(".op").textContent = calculator.operator;
}

// DOM event listener
function dom_addNumPadButtonEventListener(calculator, calcPad, calcScreen, storageDisplay) {
    calcPad.querySelectorAll(".num").forEach((eachNumButton) => {
        eachNumButton.addEventListener("click", e => {
            let isZero = e.target.getAttribute("id") === "0";
            let isNum1Empty = calculator.num1 === "";
            let isNum2Empty = calculator.num2 === "";

            // Existence of operator means potentially num2 can be filled in instead of num1
            if (calculator.operator === "") {

                // But remember to check if the number is empty and yet "0" button is pressed, the "0" should not be accounted for.
                if (!(isZero && isNum1Empty)) {
                    calculator.num1 += e.target.getAttribute("id");
                }
            }
            else {
                if (!(isZero && isNum2Empty)) {
                    calculator.num2 += e.target.getAttribute("id");
                }
            }

            dom_updateStorageDisplay(calculator, storageDisplay);
            dom_updateCalcScreen(calculator, calcScreen);
        });
    })
}

function dom_addOperatorButtonEventListener(calculator, calcPad, calcScreen, storageDisplay) {
    calcPad.querySelectorAll(".operator").forEach((eachOperatorButton) => {
        eachOperatorButton.addEventListener("click", e => {
            let isNum1Empty = calculator.num1 === "";
            let isNum2Empty = calculator.num2 === "";

            // We will compute the operation if num2 is available, before a new operator replace the existing

            // And we need to replace the result into num1, and make num2 empty
            if (!isNum2Empty) {
                calculator.num1 = calculator.operate(+calculator.num1, +calculator.num2, calculator.operator);

                calculator.num2 = "";
            }

            // We only consider an operator if num1 is not empty
            if (!isNum1Empty) {
                calculator.operator = e.target.getAttribute("operator");
            }

            dom_updateStorageDisplay(calculator, storageDisplay);
            dom_updateCalcScreen(calculator, calcScreen);
        });
    });
}

function dom_addEqualButtonEventListener(calculator, calcScreen, storageDisplay) {
    calcPad.querySelector("#equal").addEventListener("click", e => {
        let isNum1Empty = calculator.num1 === "";
        let isNum2Empty = calculator.num2 === "";
        let isOperatorEmpty = calculator.operator === "";

        // Make sure num1, num2 and operator is not an empty string before we compute "="
        if (!isNum1Empty && !isNum2Empty && !isOperatorEmpty) {
            calculator.num1 = calculator.operate(+calculator.num1, +calculator.num2, calculator.operator);

            // num2 and operator must be empty now so that the screen display shows num1, which is the computed result
            calculator.num2 = "";
            calculator.operator = "";

            dom_updateCalcScreen(calculator, calcScreen);
            dom_updateStorageDisplay(calculator, storageDisplay);
            calculator.init(); // once done display, num1 is emptied so that the result cannot be used for next operation. 
        }
    })
}

function dom_addAllClearButtonEventListener(calculator, calcPad, calcScreen, storageDisplay) {
    calcPad.querySelector("#all-clear").addEventListener("click", () => {

        calculator.init();

        dom_clearCalcScreen(calcScreen);
        dom_updateStorageDisplay(calculator, storageDisplay);
    });
}
