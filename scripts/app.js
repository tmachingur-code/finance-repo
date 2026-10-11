import {
    validateDescription,
    validateAmount,
    validateCategory,
    validateDate,
    isValidTransaction

} from "./validators.js";

import {
    getTransactions,
    addTransaction,
    deleteTransaction,
    updateTransaction
} from "./state.js";

import {
    getVisibleTransactions
} from "./search.js";

import {
    renderTransactions,
    updateDashboard,
    updateSpendingTrend,
    updateBudgetProgress,
    updateSpendingBreakdown
} from "./ui.js";

const form = document.querySelector(".transaction-form");

// M5: Monthly budget settings
const budgetForm = document.querySelector("#budget-form");
const budgetInput = document.querySelector("#monthly-budget");
const budgetError = document.querySelector("#budget-error");
const budgetFeedback = document.querySelector("#budget-feedback");

const BUDGET_STORAGE_KEY = "pesaFlow.monthlyBudget";

let monthlyBudget = Number(
    localStorage.getItem(BUDGET_STORAGE_KEY)
) || 0;

if (budgetInput && monthlyBudget > 0) {
    budgetInput.value = String(monthlyBudget);
}

const submitButton = form?.querySelector('button[type="submit"]');
// Track the transaction currently being edited.
let editingTransactionId = null;

const searchInput = document.querySelector("#transaction-search");
const categoryFilter = document.querySelector("#category-filter");
const sortSelect = document.querySelector("#transaction-sort");


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


    /**
     * M5: Save and apply the monthly budget.
     */
    if (budgetForm) {
        budgetForm.addEventListener("submit", (event) => {
            event.preventDefault();

            const value = budgetInput.value.trim();
            const budget = Number(value);

            if (
                value === "" ||
                !Number.isFinite(budget) ||
                budget <= 0
            ) {
                budgetError.textContent =
                    "Enter a budget greater than zero.";
                budgetInput.setAttribute("aria-invalid", "true");
                budgetFeedback.textContent = "";
                budgetInput.focus();
                return;
            }

            monthlyBudget = budget;

            localStorage.setItem(
                BUDGET_STORAGE_KEY,
                String(monthlyBudget)
            );

            budgetError.textContent = "";
            budgetInput.setAttribute("aria-invalid", "false");
            budgetFeedback.textContent = "Monthly budget saved successfully.";

            const transactions = getTransactions();

            updateDashboard(transactions, monthlyBudget);
            updateBudgetProgress(transactions, monthlyBudget);
        });

        budgetInput.addEventListener("input", () => {
            budgetError.textContent = "";
            budgetFeedback.textContent = "";
            budgetInput.setAttribute("aria-invalid", "false");
        });
    }


    // M4: Update the transaction list using search, filter, and sort settings.
    function updateTransactions() {
        const { results, error } = getVisibleTransactions(
            getTransactions(),
            {
                query: searchInput?.value ?? "",
                category: categoryFilter?.value ?? "all",
                sortBy: sortSelect?.value ?? "date-desc"
            }
        );

        const isFiltered = Boolean(
            searchInput?.value.trim() ||
            (categoryFilter && categoryFilter.value !== "all")
        );

        renderTransactions(results, {
            filtered: isFiltered,
            searchError: error
        });

        if (searchInput) {
            searchInput.setAttribute("aria-invalid", String(Boolean(error)));
        }

        // M5: Refresh dashboard statistics and visualizations.
        const transactions = getTransactions();

        updateDashboard(transactions, monthlyBudget);
        updateSpendingTrend(transactions);
        updateBudgetProgress(transactions, monthlyBudget);
        updateSpendingBreakdown(transactions);
    }


    // M4: Respond to changes in search, category, and sorting.
    searchInput?.addEventListener("input", updateTransactions);
    categoryFilter?.addEventListener("change", updateTransactions);
    sortSelect?.addEventListener("change", updateTransactions);

    // Render the initial transaction state.
    updateTransactions();

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


        // M4: Create and display a transaction after successful validation.
        const transaction = {
            description: fields.description.input.value.trim(),
            amount: fields.amount.input.value,
            type: fields.type.input.value,
            category: fields.category.input.value,
            date: fields.date.input.value,
            status: fields.status.input.value
        };

        if (!isValidTransaction(transaction)) {
            feedback.textContent =
                "The transaction is invalid. Please review your entries.";
            return;
        }

        // M4: Update an existing transaction or create a new one.
        if (editingTransactionId !== null) {
            const updated = updateTransaction(editingTransactionId, transaction);

            if (!updated) {
                feedback.textContent = "Could not update the transaction.";
                return;
            }

            editingTransactionId = null;
            feedback.textContent = "Transaction updated successfully.";
        } else {
            addTransaction(transaction);
            feedback.textContent = "Transaction added successfully.";
        }

        form.reset();

        if (submitButton) {
            submitButton.textContent = "Validate transaction";
        }

        Object.values(fields).forEach((field) => {
            field.error.textContent = "";
            field.input.setAttribute("aria-invalid", "false");
        });

        updateTransactions();
    });

    // M4: Load an existing transaction into the form for editing.
    document.addEventListener("click", (event) => {
        const editButton = event.target.closest("[data-edit-id]");

        if (!editButton) {
            return;
        }

        const transactionId = editButton.dataset.editId;

        const transaction = getTransactions().find(
            (item) => String(item.id) === String(transactionId)
        );
        if (!transaction) {
            return;
        }

        editingTransactionId = transaction.id;

        if (submitButton) {
            submitButton.textContent = "Save changes";
        }

        fields.description.input.value = transaction.description;
        fields.amount.input.value = transaction.amount;
        fields.type.input.value = transaction.type;
        fields.category.input.value = transaction.category;
        fields.date.input.value = transaction.date;
        fields.status.input.value = transaction.status;

        Object.values(fields).forEach((field) => {
            validateField(field);
        });

        feedback.textContent =
            "Editing transaction. Update the fields and submit the form.";

        form.scrollIntoView({ behavior: "smooth", block: "start" });
        fields.description.input.focus();
    });

    // M4: Delete a transaction from desktop or mobile view.
    document.addEventListener("click", (event) => {
        const deleteButton = event.target.closest("[data-delete-id]");

        if (!deleteButton) {
            return;
        }

        const transactionId = deleteButton.dataset.deleteId;

        const confirmed = window.confirm(
            "Are you sure you want to delete this transaction?"
        );

        if (!confirmed) {
            return;
        }

        const deleted = deleteTransaction(transactionId);

        if (deleted) {
            if (editingTransactionId === transactionId) {
                editingTransactionId = null;
                form.reset();

                Object.values(fields).forEach((field) => {
                    field.error.textContent = "";
                    field.input.setAttribute("aria-invalid", "false");
                });
            }

            feedback.textContent = "Transaction deleted successfully.";
            updateTransactions();
        }
    });

}