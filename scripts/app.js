import {
    validateDescription,
    validateAmount,
    validateCategory,
    validateDate
} from "./validators.js";

const form = document.querySelector(".transaction-form");

if (form) {
    const feedback = document.querySelector("#form-feedback");

    const fields = {
        description: {
            input: form.elements.description,
            error: document.querySelector("#description-error"),
            validate: validateDescription
        },
        amount: {
            input: form.elements.amount,
            error: document.querySelector("#amount-error"),
            validate: validateAmount
        },
        type: {
            input: form.elements.type,
            error: document.querySelector("#type-error"),
            validate: (value) =>
                ["income", "expense"].includes(value)
                    ? { valid: true, message: "" }
                    : { valid: false, message: "Choose a transaction type." }
        },
        category: {
            input: form.elements.category,
            error: document.querySelector("#category-error"),
            validate: validateCategory
        },
        date: {
            input: form.elements.date,
            error: document.querySelector("#date-error"),
            validate: validateDate
        },
        status: {
            input: form.elements.status,
            error: document.querySelector("#status-error"),
            validate: (value) =>
                ["paid", "planned"].includes(value)
                    ? { valid: true, message: "" }
                    : { valid: false, message: "Choose a payment status." }
        }
    };

    function validateField(field) {
        const result = field.validate(field.input.value);
        field.error.textContent = result.message;
        field.input.setAttribute("aria-invalid", String(!result.valid));
        return result.valid;
    }

    Object.values(fields).forEach((field) => {
        field.input.addEventListener("input", () => {
            validateField(field);
            feedback.textContent = "";
        });

        field.input.addEventListener("change", () => {
            validateField(field);
            feedback.textContent = "";
        });

        field.input.addEventListener("blur", () => {
            validateField(field);
        });
    });

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        let firstInvalidField = null;
        let allValid = true;

        Object.values(fields).forEach((field) => {
            const valid = validateField(field);

            if (!valid) {
                allValid = false;
                firstInvalidField ??= field.input;
            }
        });

        if (!allValid) {
            feedback.textContent = "Please correct the highlighted fields.";
            firstInvalidField?.focus();
            return;
        }

        feedback.textContent =
            "All fields are valid. Saving transactions will be implemented in a later step.";
    });
}