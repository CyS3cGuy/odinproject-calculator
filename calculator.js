const MAX_SCREEN_DIGITS = 10;
const DEFAULT_SLICE = MAX_SCREEN_DIGITS - 3;
const DEFAULT_SLICE_LESS = MAX_SCREEN_DIGITS - 4;

/*** Calculator object ***/
const calculator = {
    num: [null, null],
    operator: "",
    numBuffer: ["", ""],
    pointer: 0,
    isError: false,
    errorType: "",

    init: function () {
        this.num = [null, null];
        this.operator = "";
        this.numBuffer = ["", ""];
        this.pointer = 0;
        this.isError = false;
    },

    initNum: function (pos) {
        this.num[pos] = null;
        this.numBuffer[pos] = "";
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

    divide: function (a, b) {
        if (b === 0) {
            this.isError = true;
            this.errorType = "DIV ERROR";
            return null;
        }
        else {
            return a / b;
        }
    },

    returnDisplayNumPosition: function () {

        return this.pointer;
    },


    transformNum: function (pos) {
        if (this.isError) {
            return null;
        }

        let unvalidatedNum = Math.abs(this.num[pos]);

        // The below 3 use cases need to be exponent
        // 1. Number greater than 9999999999 (ten 9s)
        let isLargeNumExceededDisplayBound = unvalidatedNum > (10 ** MAX_SCREEN_DIGITS - 1);

        // 2. ... and also number that is 0 < x < 10^-8
        let isEpsilonExceedDisplayBound = unvalidatedNum < (10 ** -(MAX_SCREEN_DIGITS - 2)) && unvalidatedNum > 0;

        // 3. ... and also number that has very long decimal place but is greater than 10^-8 but less than 1 (10^-8 <= x < 1)
        let isEpsilonDecimalExceedDisplayBound = unvalidatedNum >= (10 ** -(MAX_SCREEN_DIGITS - 2)) && unvalidatedNum < 1 && getNumString(unvalidatedNum).length > MAX_SCREEN_DIGITS;

        return isLargeNumExceededDisplayBound || isEpsilonExceedDisplayBound || isEpsilonDecimalExceedDisplayBound ? transformNumExponential(this, pos) : truncateNum(this, pos);
    },

    validateError: function (transformedNumStr) {
        if (this.isError) {
            this.init();
            return this.errorType;
        }

        return transformedNumStr;
    },

};

/** DOM variable ***/
const debugDisplay = document.querySelector("#debug-display");
const calcScreen = document.querySelector("#calc-screen");
const calcPad = document.querySelector("#calc-pad");

dom_clearCalcScreen(calcScreen);
dom_addNumPadButtonEventListener(calculator, calcPad, calcScreen, debugDisplay);
dom_addOperatorButtonEventListener(calculator, calcPad, calcScreen, debugDisplay);
dom_addEqualButtonEventListener(calculator, calcScreen, debugDisplay);
dom_addAllClearButtonEventListener(calculator, calcPad, calcScreen, debugDisplay);
dom_addUndoButtonEventListener(calculator, calcPad, calcScreen, debugDisplay);
dom_addSignChangeButtonEventListener(calculator, calcPad, calcScreen, debugDisplay);
dom_addDotButtonEventListener(calculator, calcPad, calcScreen, debugDisplay);
dom_addKeyBoardSupport(calcPad, debugDisplay);

/*** Logic function ***/

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
function appendNum(buffer, appendingNumChar) {
    let numStr = buffer;
    if (appendingNumChar >= "0" && appendingNumChar <= "9") {
        numStr += appendingNumChar;
    }

    return numStr;
}

// Function to remove 1 number upon undo
function undoNum(buffer) {
    if (buffer === "") {
        return "";
    }

    let sliced = buffer.slice(0, buffer.length - 1);

    return sliced === "" || sliced === "0" ? "" : sliced;
}

// Function to transform number into its exponential string format
function transformNumExponential(calculator, pos) {
    let num = Math.abs(calculator.num[pos]);
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

function truncateNum(calculator, pos) {

    let num = Math.abs(calculator.num[pos]);

    // Because buffer may not be the same as actual number value (for example, the case where the buffer in num1 is not updated when using the previous result as an operand), we need to check if they are the same when converted to number type.

    // If the converted values are the same, we prefer using the buffer string instead, because there is a possibility that the number type will truncate the "." and trailing "0" for a decimal, which is not what we desired as we want to display those on calculator screen. we want the original untruncated string

    // If they are not the same, then use the actual number (not buffer string) as the actual number is the updated one. This can only happen if the previous result is used as num1.

    let isNumValSameAsBuffer = num === +calculator.numBuffer[pos];

    let numStr = isNumValSameAsBuffer ? calculator.numBuffer[pos] : getNumString(num);

    return numStr.length > MAX_SCREEN_DIGITS ? getNonPoweredNumAndRemoveTrailingZeroDot(numStr, MAX_SCREEN_DIGITS) : numStr;
}

function toggleSignChange(num) {
    return -num;
}

function addDot(bufferStr, isStrEmpty) {
    if (isStrEmpty) {
        return bufferStr + "0.";
    } else {
        if (!bufferStr.includes(".")) {
            return bufferStr + ".";
        }
    }

    return bufferStr;
}

/*** DOM display update function ***/
function dom_clearCalcScreen(calcScreen) {
    calcScreen.querySelectorAll(".digit").forEach((eachDigit, index, arr) => {
        eachDigit.textContent = index === arr.length - 1 ? "0" : "";
    });
}

function dom_updateCalcScreen(calculator, calcScreen) {
    let isNum1Empty = calculator.num[0] === null;
    let isNum2Empty = calculator.num[1] === null;
    let transformedNumStr = "0";
    let validatedNumStr = "0";
    let numPosition = 0;

    dom_clearCalcScreen(calcScreen);

    // Adding this validation to handle cases where user click an operator without first supplying num1

    if (!(isNum1Empty && isNum2Empty)) {
        numPosition = calculator.returnDisplayNumPosition();

        transformedNumStr = calculator.transformNum(numPosition); // We disregard the negative sign. it will be handled separately.
    }

    validatedNumStr = calculator.validateError(transformedNumStr);

    // we first reverse the string so that least significant bit takes the index 0 position
    // then we populate each num digit in array onto the calculator screen
    const numArr = validatedNumStr.split("").reverse();

    const digitDisplayArr = Array.from(calcScreen.querySelectorAll(".actual"));

    numArr.forEach((value, pos) => {
        const desiredDigit = digitDisplayArr.find(single => +single.getAttribute("index") === pos); // let program know which div to update text content
        desiredDigit.querySelector(".digit").textContent = value;
    })

    // if negative, put negative sign in front. positive no need
    const signedDisplay = calcScreen.querySelector(".sign .digit");
    signedDisplay.textContent = calculator.num[numPosition] >= 0 || calculator.num[numPosition] === null ? "" : "-";
}

function dom_updateStorageDisplay(calculator, storageDisplay) {
    storageDisplay.querySelector(".num1").textContent = getNumString(calculator.num[0]);
    storageDisplay.querySelector(".num2").textContent = getNumString(calculator.num[1]);
    storageDisplay.querySelector(".op").textContent = calculator.operator;

    storageDisplay.querySelector(".num1-buffer").textContent = calculator.numBuffer[0];
    storageDisplay.querySelector(".num2-buffer").textContent = calculator.numBuffer[1];

}

/*** DOM event listener ***/
function dom_addNumPadButtonEventListener(calculator, calcPad, calcScreen, storageDisplay) {
    calcPad.querySelectorAll(".num").forEach((eachNumButton) => {
        eachNumButton.addEventListener("click", e => {
            if (!calculator.isError) {
                let isZero = e.target.getAttribute("id") === "0";
                let isNum1Empty = calculator.num[0] === null;
                let isNum2Empty = calculator.num[1] === null;
                let num1LenExceeded = calculator.numBuffer[0].length >= MAX_SCREEN_DIGITS;
                let num2LenExceeded = calculator.numBuffer[1].length >= MAX_SCREEN_DIGITS;
                let numPadClicked = e.target.getAttribute("id");


                // Existence of operator means potentially num2 can be filled in instead of num1
                if (calculator.operator === "") {

                    // But remember to check if the number is empty and yet "0" button is pressed, the "0" should not be accounted for.
                    if (!(isZero && isNum1Empty)) {
                        if (!num1LenExceeded) {
                            calculator.pointer = 0;
                            calculator.numBuffer[0] = appendNum(calculator.numBuffer[0], numPadClicked);
                            calculator.num[0] = +calculator.numBuffer[0];
                        }
                    }
                }
                else {
                    if (!(isZero && isNum2Empty)) {
                        if (!num2LenExceeded) {
                            calculator.pointer = 1;
                            calculator.numBuffer[1] = appendNum(calculator.numBuffer[1], numPadClicked);
                            calculator.num[1] = +calculator.numBuffer[1];
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
                let isNum1Empty = calculator.num[0] === null;
                let isNum2Empty = calculator.num[1] === null;
                let operatorPadClicked = e.target.getAttribute("operator");

                // We will compute the operation if num2 is available, before a new operator replace the existing

                // And we need to replace the result into num1, and make num2 empty
                if (!isNum2Empty) {
                    calculator.pointer = 0;
                    calculator.num[0] = calculator.operate(calculator.num[0], calculator.num[1], calculator.operator);

                    calculator.initNum(1);
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
            let isNum1Empty = calculator.num[0] === null;
            let isNum2Empty = calculator.num[1] === null;
            let isOperatorEmpty = calculator.operator === "";

            // Make sure num1, num2 and operator is not an empty string before we compute "="
            if (!isNum1Empty && !isNum2Empty && !isOperatorEmpty) {
                calculator.pointer = 0;
                calculator.num[0] = calculator.operate(calculator.num[0], calculator.num[1], calculator.operator);

                calculator.numBuffer[0] = getNumString(calculator.num[0]);

                // num2 and operator must be empty now so that the screen display shows num1, which is the computed result
                calculator.initNum(1);
                calculator.operator = "";

                dom_updateCalcScreen(calculator, calcScreen);
                dom_updateStorageDisplay(calculator, storageDisplay);
                // calculator.init(); // once done display, num1 is emptied so that the result cannot be used for next operation. 
            }
        }
    })
}

function dom_addUndoButtonEventListener(calculator, calcPad, calcScreen, storageDisplay) {
    calcPad.querySelector("#undo").addEventListener("click", () => {
        if (!calculator.isError) {
            let isNum1Empty = calculator.num[0] === null;
            let isNum2Empty = calculator.num[1] === null;
            let isOperatorEmpty = calculator.operator === "";


            if (isOperatorEmpty) {
                if (!isNum1Empty && !calculator.numBuffer[0].includes("e")) {
                    calculator.numBuffer[0] = undoNum(calculator.numBuffer[0]);

                    calculator.num[0] = calculator.numBuffer[0] === "" ? null : +calculator.numBuffer[0];
                }
            } else {
                if (!isNum2Empty && !calculator.numBuffer[1].includes("e")) {
                    calculator.numBuffer[1] = undoNum(calculator.numBuffer[1]);

                    calculator.num[1] = calculator.numBuffer[1] === "" ? null : +calculator.numBuffer[1];
                }
            }

            dom_updateStorageDisplay(calculator, storageDisplay);
            dom_updateCalcScreen(calculator, calcScreen);
        }
    });
}

function dom_addSignChangeButtonEventListener(calculator, calcPad, calcScreen, storageDisplay) {
    calcPad.querySelector("#sign-change").addEventListener("click", () => {
        if (!calculator.isError) {
            let isNum1Empty = calculator.num[0] === null;
            let isNum2Empty = calculator.num[1] === null;
            let isOperatorEmpty = calculator.operator === "";

            if (isOperatorEmpty) {
                if (!isNum1Empty) {
                    calculator.num[0] = toggleSignChange(calculator.num[0]);

                    calculator.numBuffer[0] = getNumString(calculator.num[0]);
                }
            } else {
                if (!isNum2Empty) {
                    calculator.num[1] = toggleSignChange(calculator.num[1]);

                    calculator.numBuffer[1] = getNumString(calculator.num[1]);
                }
            }

            dom_updateStorageDisplay(calculator, storageDisplay);
            dom_updateCalcScreen(calculator, calcScreen);
        }
    })
}

function dom_addDotButtonEventListener(calculator, calcPad, calcScreen, storageDisplay) {
    calcPad.querySelector("#dot").addEventListener("click", () => {
        if (!calculator.isError) {
            let isNum1Empty = calculator.num[0] === null;
            let isNum2Empty = calculator.num[1] === null;
            let isOperatorEmpty = calculator.operator === "";

            if (isOperatorEmpty) {
                calculator.pointer = 0;
                calculator.numBuffer[0] = addDot(calculator.numBuffer[0], isNum1Empty);

                calculator.num[0] = +calculator.numBuffer[0];
            } else {
                calculator.pointer = 1;
                calculator.numBuffer[1] = addDot(calculator.numBuffer[1], isNum2Empty);

                calculator.num[1] = +calculator.numBuffer[1];
            }

            dom_updateStorageDisplay(calculator, storageDisplay);
            dom_updateCalcScreen(calculator, calcScreen);
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

function dom_addKeyBoardSupport(calcPad, storageDisplay) {
    let clickEvent = new MouseEvent("click");
    document.addEventListener('keydown', e => {
        let keyPressed = e.key;
        storageDisplay.querySelector(".keydown").textContent = keyPressed;

        if (keyPressed >= "0" && keyPressed <= "9") {
            const numPadArray = Array.from(calcPad.querySelectorAll(".num")).sort((lastNumPad, nextNumPad) => {
                let lastNum = +lastNumPad.getAttribute("id");
                let nextNum = +nextNumPad.getAttribute("id");

                return lastNum < nextNum ? -1 : 1;
            });

            numPadArray[+keyPressed].dispatchEvent(clickEvent);
            numPadArray[+keyPressed].classList.add("btn-active");
        } 
        else if (keyPressed === "+") {
            calcPad.querySelector("#plus").dispatchEvent(clickEvent);
            calcPad.querySelector("#plus").classList.add("btn-active");
        }
        else if (keyPressed === "-") {
            calcPad.querySelector("#minus").dispatchEvent(clickEvent);
            calcPad.querySelector("#minus").classList.add("btn-active");
        }
        else if (keyPressed === "*") {
            calcPad.querySelector("#multiply").dispatchEvent(clickEvent);
            calcPad.querySelector("#multiply").classList.add("btn-active");
        }
        else if (keyPressed === "/") {
            calcPad.querySelector("#divide").dispatchEvent(clickEvent);
            calcPad.querySelector("#divide").classList.add("btn-active");
        }
        else if (keyPressed === "Enter") {
            calcPad.querySelector("#equal").dispatchEvent(clickEvent);
            calcPad.querySelector("#equal").classList.add("btn-active");
        }
        else if (keyPressed === "Escape") {
            calcPad.querySelector("#all-clear").dispatchEvent(clickEvent);
            calcPad.querySelector("#all-clear").classList.add("btn-active");
        }
        else if (keyPressed === "Backspace") {
            calcPad.querySelector("#undo").dispatchEvent(clickEvent);
            calcPad.querySelector("#undo").classList.add("btn-active");
        }
        else if (keyPressed === "s") {
            calcPad.querySelector("#sign-change").dispatchEvent(clickEvent);
            calcPad.querySelector("#sign-change").classList.add("btn-active");
        }
        else if (keyPressed === ".") {
            calcPad.querySelector("#dot").dispatchEvent(clickEvent);
            calcPad.querySelector("#dot").classList.add("btn-active");
        }
    });

    document.addEventListener('keyup', e => {
        calcPad.querySelectorAll("button").forEach(each => each.classList.remove("btn-active"));
    })
}