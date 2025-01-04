const MAX_SCREEN_DIGITS = 10;
const DEFAULT_SLICE = MAX_SCREEN_DIGITS - 3;
const DEFAULT_SLICE_LESS = MAX_SCREEN_DIGITS - 4;

// Calculator object
const calculator = {
    num1: null,
    num2: null,
    operator: "",
    isError: false,
    errorType: "",

    init: function () {
        this.num1 = null;
        this.num2 = null;
        this.operator = "";
        this.isError = false;
    },

    operate: function (a, b, op) {
        return op === "+" ? this.add(a, b) :
            op === "-" ? this.subtract(a, b) :
                op === "*" ? this.multiply(a, b) :
                    op === "/" ? this.divide(a, b) :
                        null;
    },

    add: (a, b) => a + b,

    subtract: (a, b) => a - b,

    multiply: (a, b) => a * b,

    divide: (a, b) => {
        if (b === 0) {
            this.isError = true;
            console.log("DIV ERROR");
            return "ERROR";
        }
        else {
            return a / b;
        }
    },

    returnDisplayNum: function () {
        let isNum1Empty = this.num1 === null;
        let isNum2Empty = this.num2 === null;

        // Check for num 2 first, before num 1, because num 2 may be available.
        if (!isNum2Empty) {
            return this.num2;
        } else if (!isNum1Empty) {
            return this.num1;
        }

        this.isError = true;
        this.errorType = "DISP ERROR";
        return null;
    },

    
    transformNum: function (unvalidatedNum) {
        if (this.isError) {
            return null;
        }

        // We look for number greater than 9999999999 (ten 9s)
        let isLargeNumExceededDisplayBound = unvalidatedNum > (10 ** MAX_SCREEN_DIGITS - 1);

        // ... and also number that is 0 < x < 10^-8
        let isEpsilonExceedDisplayBound = unvalidatedNum < (10 ** -(MAX_SCREEN_DIGITS - 2)) && unvalidatedNum > 0;

        // ... and also number that has very long decimal place but is greater than 10^-8 but less than 1 (10^-8 <= x < 1)
        let isDecimalExceedDisplayBound = unvalidatedNum >= (10 ** -(MAX_SCREEN_DIGITS - 2)) && unvalidatedNum < 1 && getNumString(unvalidatedNum).length > MAX_SCREEN_DIGITS; 

        return isLargeNumExceededDisplayBound || isEpsilonExceedDisplayBound || isDecimalExceedDisplayBound ? transformNumExponential(this, unvalidatedNum) : getNumString(unvalidatedNum);
    },

    validateError: function (transformedNumStr) {
        if (this.isError) {
            this.init();
            return this.errorType;
        }

        return transformedNumStr;
    },

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

// Logic function

// Function to slice the base of an exponential and remove zero and/or dot (where necessary)
function getNonPoweredNumAndRemoveTrailingZeroDot(baseStr, sliceNum) {
    let tempStr = baseStr.slice(0, sliceNum);;

    // We write decimal in such a way that we always remove the trailing zeros
    // Check for last character, is it "0" or "."
    // If yes, remove last element
    while (tempStr.slice(-1) === "0" || tempStr.slice(-1) === ".") {
        let tempArr = tempStr.split("")
        tempArr.pop();
        tempStr = tempArr.join("");
    }

    return tempStr;
}

// Function to correct the powered num to 2 digits
function correctExponent(exponentStr) {
    return exponentStr.length === 1 ? "0" + exponentStr : exponentStr;
}

function getNumString(num) {
    return num === null ? "" : num.toString();
}

// Function to append number based on numpad clicked
function appendNum(num, appendingNumChar) {
    let numStr = getNumString(num);
    if (appendingNumChar >= "0" && appendingNumChar <= "9" || appendingNumChar === ".") {
        numStr += appendingNumChar;
    }

    return +numStr;
}

// Function to transform number into its exponential string format
function transformNumExponential(calculator, num) {
    // Only allow up until the maximum safe integer
    if (num > Number.MAX_SAFE_INTEGER) {
        calculator.isError = true;
        calculator.errorType = "MAX ERROR";
        return null;
    }

    let numStr = num.toExponential();
    let isLargeNum = numStr.includes("e+") ? true : false;
    let [base, exponent] = isLargeNum ? numStr.split("e+") : numStr.split("e-");

    // Only allow up until the 2 digit exponent
    if (+exponent >= 100) {
        calculator.isError = true;
        calculator.errorType = "EXP ERROR";
        return null;
    }

    let correctedBase = isLargeNum ? getNonPoweredNumAndRemoveTrailingZeroDot(base, DEFAULT_SLICE) : getNonPoweredNumAndRemoveTrailingZeroDot(base, DEFAULT_SLICE_LESS);
    let correctedExponent = correctExponent(exponent);

    return isLargeNum ? correctedBase + "E" + correctedExponent : correctedBase + "E-" + correctedExponent;

}

// DOM display update function
function dom_clearCalcScreen(calcScreen) {
    calcScreen.querySelectorAll(".digit").forEach((eachDigit, index, arr) => {
        eachDigit.textContent = index === arr.length - 1 ? "0" : "";
    });
}

function dom_updateCalcScreen(calculator, calcScreen) {
    let isNum1Empty = calculator.num1 === null;
    let isNum2Empty = calculator.num2 === null;

    // Adding this validation to handle cases where user click an operator without first supplying num1
    if (isNum1Empty && isNum2Empty) {
        return;
    }

    dom_clearCalcScreen(calcScreen);

    let unvalidatedNum = calculator.returnDisplayNum();
    let transformedNumStr = calculator.transformNum(unvalidatedNum);
    let validatedNumStr = calculator.validateError(transformedNumStr);

    const numArr = validatedNumStr.split("").reverse(); // Reversing the string so that least significant bit takes the index 0 position

    const digitDisplayArr = Array.from(calcScreen.querySelectorAll(".actual"));

    for (let i = 0; i < numArr.length; i++) {
        const desiredDigit = digitDisplayArr.find(single => +single.getAttribute("index") === i); // let program know which div to update text content
        desiredDigit.querySelector(".digit").textContent = numArr[i];
    }
}

function dom_updateStorageDisplay(calculator, storageDisplay) {
    storageDisplay.querySelector(".num1").textContent = getNumString(calculator.num1);
    storageDisplay.querySelector(".num2").textContent = getNumString(calculator.num2);
    storageDisplay.querySelector(".op").textContent = calculator.operator;
}

// DOM event listener
function dom_addNumPadButtonEventListener(calculator, calcPad, calcScreen, storageDisplay) {
    calcPad.querySelectorAll(".num").forEach((eachNumButton) => {
        eachNumButton.addEventListener("click", e => {
            if (!calculator.isError) {
                let isZero = e.target.getAttribute("id") === "0";
                let isNum1Empty = calculator.num1 === null;
                let isNum2Empty = calculator.num2 === null;
                let num1LenExceeded = getNumString(calculator.num1).length === MAX_SCREEN_DIGITS;
                let num2LenExceeded = getNumString(calculator.num2).length === MAX_SCREEN_DIGITS;
                let numPadClicked = e.target.getAttribute("id");


                // Existence of operator means potentially num2 can be filled in instead of num1
                if (calculator.operator === "") {

                    // But remember to check if the number is empty and yet "0" button is pressed, the "0" should not be accounted for.
                    if (!(isZero && isNum1Empty)) {
                        if (!num1LenExceeded) {
                            calculator.num1 = appendNum(calculator.num1, numPadClicked);
                        }
                    }
                }
                else {
                    if (!(isZero && isNum2Empty)) {
                        if (!num2LenExceeded) {
                            calculator.num2 = appendNum(calculator.num2, numPadClicked);
                        }
                    }
                }

                dom_updateStorageDisplay(calculator, storageDisplay);
                dom_updateCalcScreen(calculator, calcScreen);
            }
        });
    })
}

function dom_addOperatorButtonEventListener(calculator, calcPad, calcScreen, storageDisplay) {
    calcPad.querySelectorAll(".operator").forEach((eachOperatorButton) => {
        eachOperatorButton.addEventListener("click", e => {
            if (!calculator.isError) {
                let isNum1Empty = calculator.num1 === null;
                let isNum2Empty = calculator.num2 === null;
                let operatorPadClicked = e.target.getAttribute("operator");

                // We will compute the operation if num2 is available, before a new operator replace the existing

                // And we need to replace the result into num1, and make num2 empty
                if (!isNum2Empty) {
                    calculator.num1 = calculator.operate(calculator.num1, calculator.num2, calculator.operator);

                    calculator.num2 = null;
                }

                // We only consider an operator if num1 is not empty
                if (!isNum1Empty) {
                    calculator.operator = operatorPadClicked;
                }

                dom_updateStorageDisplay(calculator, storageDisplay);
                dom_updateCalcScreen(calculator, calcScreen);
            }
        });
    });
}

function dom_addEqualButtonEventListener(calculator, calcScreen, storageDisplay) {
    calcPad.querySelector("#equal").addEventListener("click", e => {
        if (!calculator.isError) {
            let isNum1Empty = calculator.num1 === null;
            let isNum2Empty = calculator.num2 === null;
            let isOperatorEmpty = calculator.operator === "";

            // Make sure num1, num2 and operator is not an empty string before we compute "="
            if (!isNum1Empty && !isNum2Empty && !isOperatorEmpty) {
                calculator.num1 = calculator.operate(calculator.num1, calculator.num2, calculator.operator);

                // num2 and operator must be empty now so that the screen display shows num1, which is the computed result
                calculator.num2 = null;
                calculator.operator = "";

                dom_updateCalcScreen(calculator, calcScreen);
                dom_updateStorageDisplay(calculator, storageDisplay);
                calculator.init(); // once done display, num1 is emptied so that the result cannot be used for next operation. 
            }
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
