/**
 * PesaFlow — Student Finance Tracker
 * M3: Form validation and regular expressions
 */

export const CATEGORIES = [
  "Food",
  "Transport",
  "Accommodation",
  "Education",
  "Health",
  "Entertainment",
  "Shopping",
  "Utilities",
  "Income",
  "Other"
];

// Rule 1: Description must not have leading or trailing spaces.
export const DESCRIPTION_REGEX = /^\S(?:.*\S)?$/;

// Rule 2: Detect repeated words, e.g. "food food".
export const REPEATED_WORD_REGEX = /\b([a-z]+)\s+\1\b/i;

// Rule 3: Amount must be a positive number with up to two decimal places.
export const AMOUNT_REGEX = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;

// Rule 4: Category may contain letters separated by spaces or hyphens.
export const CATEGORY_REGEX = /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/;

// Rule 5: Date must follow YYYY-MM-DD with valid month and day ranges.
export const DATE_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

/**
 * Validate a transaction description.
 * Repeated words are reported as a warning/error to help avoid typos.
 */
export function validateDescription(value) {
  if (typeof value !== "string" || value.length === 0) {
    return { valid: false, message: "Enter a description." };
  }

  if (value.trim() !== value || !DESCRIPTION_REGEX.test(value)) {
    return {
      valid: false,
      message: "Remove spaces from the beginning or end of the description."
    };
  }

  if (REPEATED_WORD_REGEX.test(value)) {
    return {
      valid: false,
      message: "Avoid repeating the same word twice in a row."
    };
  }

  if (value.length > 80) {
    return {
      valid: false,
      message: "Description must be 80 characters or fewer."
    };
  }

  return { valid: true, message: "" };
}

/** Validate the amount's text format. */
export function validateAmount(value) {
  const amount = String(value).trim();

  if (!amount) {
    return { valid: false, message: "Enter an amount." };
  }

  if (!AMOUNT_REGEX.test(amount)) {
    return {
      valid: false,
      message: "Use a positive number with up to 2 decimal places."
    };
  }

  if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
    return {
      valid: false,
      message: "Amount must be greater than zero."
    };
  }

  return { valid: true, message: "" };
}

/** Validate a category against the allowed category list. */
export function validateCategory(value) {
  if (typeof value !== "string" || !CATEGORIES.includes(value)) {
    return { valid: false, message: "Choose a valid category." };
  }

  if (!CATEGORY_REGEX.test(value)) {
    return { valid: false, message: "The category format is invalid." };
  }

  return { valid: true, message: "" };
}

/** Confirm that a date exists on the calendar. */
export function isRealDate(value) {
  if (typeof value !== "string" || !DATE_REGEX.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/** Validate the date format and calendar date. */
export function validateDate(value) {
  if (!value) {
    return { valid: false, message: "Choose a transaction date." };
  }

  if (!DATE_REGEX.test(value) || !isRealDate(value)) {
    return {
      valid: false,
      message: "Enter a real date in YYYY-MM-DD format."
    };
  }

  return { valid: true, message: "" };
}

/** Validate a positive finite number. */
export function isValidPositiveNumber(value) {
  const number = Number(value);
  return value !== "" && Number.isFinite(number) && number > 0;
}

/** Validate whether a value is a real numeric amount. */
export function isValidAmount(value) {
  return validateAmount(value).valid;
}

/** Validate a complete transaction object. */
export function isValidTransaction(transaction) {
  if (!transaction || typeof transaction !== "object") {
    return false;
  }

  return (
    validateDescription(transaction.description).valid &&
    validateAmount(transaction.amount).valid &&
    validateCategory(transaction.category).valid &&
    validateDate(transaction.date).valid &&
    ["income", "expense"].includes(transaction.type)
  );
}