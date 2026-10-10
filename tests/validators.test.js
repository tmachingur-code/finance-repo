import {
  validateDescription,
  validateAmount,
  validateCategory,
  validateDate,
  isRealDate,
  isValidPositiveNumber,
  isValidTransaction
} from "../scripts/validators.js";

const tests = [];

function test(name, callback) {
  try {
    const result = callback();

    if (result !== true) {
      throw new Error("Test condition returned false.");
    }

    tests.push({ name, passed: true });
  } catch (error) {
    tests.push({
      name,
      passed: false,
      error: error.message
    });
  }
}

function assert(condition, message = "Assertion failed") {
  if (!condition) {
    throw new Error(message);
  }
}

// Description tests
test("Accepts a valid description", () =>
  validateDescription("Lunch").valid
);

test("Rejects an empty description", () =>
  !validateDescription("").valid
);

test("Rejects leading spaces", () =>
  !validateDescription(" Lunch").valid
);

test("Rejects trailing spaces", () =>
  !validateDescription("Lunch ").valid
);

test("Rejects repeated words using a back-reference", () =>
  !validateDescription("food food").valid
);

// Amount tests
test("Accepts a whole-number amount", () =>
  validateAmount("250").valid
);

test("Accepts an amount with two decimal places", () =>
  validateAmount("250.50").valid
);

test("Rejects zero", () =>
  !validateAmount("0").valid
);

test("Rejects negative amounts", () =>
  !validateAmount("-50").valid
);

test("Rejects amounts with more than two decimal places", () =>
  !validateAmount("25.555").valid
);

test("Rejects alphabetic amounts", () =>
  !validateAmount("abc").valid
);

// Category tests
test("Accepts an allowed category", () =>
  validateCategory("Food").valid
);

test("Rejects an unknown category", () =>
  !validateCategory("Space Travel").valid
);

// Date tests
test("Accepts a valid date", () =>
  validateDate("2026-10-10").valid
);

test("Rejects an incorrectly formatted date", () =>
  !validateDate("10/10/2026").valid
);

test("Rejects an impossible calendar date", () =>
  !validateDate("2026-02-30").valid
);

test("Recognises a valid leap-day date", () =>
  isRealDate("2024-02-29")
);

test("Rejects an invalid leap-day date", () =>
  !isRealDate("2025-02-29")
);

// General validation tests
test("Recognises a positive number", () =>
  isValidPositiveNumber("100")
);

test("Rejects a non-positive number", () =>
  !isValidPositiveNumber("0")
);

test("Accepts a complete valid transaction", () =>
  isValidTransaction({
    description: "Monthly groceries",
    amount: "1500.50",
    category: "Food",
    type: "expense",
    date: "2026-10-10"
  })
);

test("Rejects a transaction with an invalid type", () =>
  !isValidTransaction({
    description: "Monthly groceries",
    amount: "1500.50",
    category: "Food",
    type: "transfer",
    date: "2026-10-10"
  })
);

// Description edge cases
test("Description containing numbers and punctuation is valid", () =>
  validateDescription("Lunch 2.0 - campus!").valid
);

test("Description containing only spaces is invalid", () =>
  !validateDescription("   ").valid
);

test("Description with repeated words in different cases is invalid", () =>
  !validateDescription("Food food").valid
);

test("Description longer than 80 characters is invalid", () =>
  !validateDescription("a".repeat(81)).valid
);

test("Description with exactly 80 characters is valid", () =>
  validateDescription("a".repeat(80)).valid
);

// Amount edge cases
test("Amount with two decimal places is valid", () =>
  validateAmount("125.50").valid
);

test("Amount with a leading zero is invalid", () =>
  !validateAmount("0125").valid
);

test("Amount with a trailing decimal point is invalid", () =>
  !validateAmount("125.").valid
);

test("Amount written in scientific notation is invalid", () =>
  !validateAmount("1e3").valid
);

// Date edge cases
test("Date with an invalid month is invalid", () =>
  !validateDate("2026-13-10").valid
);

test("Date with a missing leading zero is invalid", () =>
  !validateDate("2026-2-05").valid
);

test("Valid date at the end of a 30-day month is accepted", () =>
  validateDate("2026-04-30").valid
);

test("April 31 is rejected", () =>
  !validateDate("2026-04-31").valid
);

// Transaction edge cases
test("Transaction with zero amount is invalid", () =>
  !isValidTransaction({
    description: "Bus fare",
    amount: "0",
    category: "Transport",
    date: "2026-10-10",
    type: "expense"
  })
);

test("Transaction with an invalid category is rejected", () =>
  !isValidTransaction({
    description: "Bus fare",
    amount: "500",
    category: "Unknown",
    date: "2026-10-10",
    type: "expense"
  })
);

const passed = tests.filter((item) => item.passed).length;
const failed = tests.length - passed;

if (typeof document !== "undefined") {
  const resultsElement = document.querySelector("#test-results");
  const summaryElement = document.querySelector("#test-summary");

  if (summaryElement) {
    summaryElement.textContent =
      `${passed} passed, ${failed} failed out of ${tests.length} tests`;
  }

  if (resultsElement) {
    resultsElement.replaceChildren();

    tests.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item.passed
        ? `PASS: ${item.name}`
        : `FAIL: ${item.name} — ${item.error}`;

      li.className = item.passed ? "test-pass" : "test-fail";
      resultsElement.appendChild(li);
    });
  }
}

console.table(tests);

assert(failed === 0, `${failed} test(s) failed.`);