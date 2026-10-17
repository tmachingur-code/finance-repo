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
    updateTransaction,
    setTransactions
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

import {
    saveExchangeRates,
    getCurrencySettings
} from "./currency.js";

const form = document.querySelector(".transaction-form");
let refreshTransactions = () => { };

const currencySelect = document.querySelector("#display-currency");
const CURRENCY_STORAGE_KEY = "mariflow.displayCurrency";

if (currencySelect) {
    const savedCurrency = localStorage.getItem(CURRENCY_STORAGE_KEY);

    if (["RWF", "USD", "EUR"].includes(savedCurrency)) {
        currencySelect.value = savedCurrency;
    }

    currencySelect.addEventListener("change", () => {
        localStorage.setItem(
            CURRENCY_STORAGE_KEY,
            currencySelect.value
        );

        refreshTransactions();
    });
}

// M5: Monthly budget settings
const budgetForm = document.querySelector("#budget-form");
const budgetInput = document.querySelector("#monthly-budget");
const budgetError = document.querySelector("#budget-error");
const budgetFeedback = document.querySelector("#budget-feedback");

const BUDGET_STORAGE_KEY = "mariflow.monthlyBudget";

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
        const transactions = getTransactions();

        const { results, error } = getVisibleTransactions(
            transactions,
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
        updateDashboard(transactions, monthlyBudget);
        updateSpendingTrend(transactions);
        updateBudgetProgress(transactions, monthlyBudget);
        updateSpendingBreakdown(transactions);
    }


    // M4: Respond to changes in search, category, and sorting.
    searchInput?.addEventListener("input", updateTransactions);
    categoryFilter?.addEventListener("change", updateTransactions);
    sortSelect?.addEventListener("change", updateTransactions);

    /**
     * M6: Save exchange-rate settings.
     */
    const currencyForm = document.querySelector("#currency-form");
    const usdRateInput = document.querySelector("#rate-usd");
    const eurRateInput = document.querySelector("#rate-eur");
    const currencyError = document.querySelector("#currency-error");
    const currencyFeedback = document.querySelector("#currency-feedback");

    if (currencyForm && usdRateInput && eurRateInput) {
        const { rates } = getCurrencySettings();

        usdRateInput.value = String(rates.USD);
        eurRateInput.value = String(rates.EUR);

        currencyForm.addEventListener("submit", (event) => {
            event.preventDefault();

            currencyError.textContent = "";
            currencyFeedback.textContent = "";

            const usdRate = Number(usdRateInput.value);
            const eurRate = Number(eurRateInput.value);

            if (
                !Number.isFinite(usdRate) ||
                !Number.isFinite(eurRate) ||
                usdRate <= 0 ||
                eurRate <= 0
            ) {
                currencyError.textContent =
                    "Enter valid exchange rates greater than zero.";
                return;
            }

            const saved = saveExchangeRates(usdRate, eurRate);

            if (!saved) {
                currencyError.textContent =
                    "Sorry unable to save the exchange rates.";
                return;
            }

            currencyFeedback.textContent =
                "Exchange rates saved successfully.";

            updateTransactions();
        });
    }
    refreshTransactions = updateTransactions;

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
            amount: Number(fields.amount.input.value),
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
        try {
            if (editingTransactionId !== null) {
                const updated = updateTransaction(
                    editingTransactionId,
                    transaction
                );

                if (!updated) {
                    feedback.textContent =
                        "Could not update the transaction.";
                    return;
                }
                editingTransactionId = null;
                feedback.textContent =
                    "Transaction updated successfully."
            } else {
                addTransaction(transaction);

                feedback.textContent =
                    "Transaction added successfully."
            }
        }
        catch (error) {
            feedback.textContent =
                error instanceof Error
                    ? error.message
                    : "Could not save the transaction.";
            return;
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

// M6: Export and import JSON backups.
const exportButton = document.querySelector("#export-json");
const importInput = document.querySelector("#import-json");
const backupFeedback = document.querySelector("#backup-feedback");

function isValidBackupTransactions(transaction, seenIds) {
    if (
        !transaction ||
        typeof transaction !== "object" ||
        Array.isArray(transaction)
    ) {
        return false;
    }

    const {
        id,
        description,
        amount,
        type,
        category,
        date,
        createdAt,
        updatedAt,
        status
    } = transaction;

    const validId =
        typeof id == "string" &&
        id.trim().length > 0 &&
        !seenIds.has(id);

    const validTimestamp = (value) => {
        if (
            typeof value !== "string" ||
            !Number.isFinite(Date.parse(value))
        ) {
            return false;
        }

        try {
            return new Date(value).toISOString() === value;
        } catch {
            return false;
        }
    };

    const validFields = isValidTransaction({
        description,
        amount,
        type,
        category,
        date,
    });

    const valid =
        validId &&
        validFields &&
        typeof amount === "number" &&
        Number.isFinite(amount) &&
        amount > 0 &&
        ["paid", "planned"].includes(status) &&
        validTimestamp(createdAt) &&
        validTimestamp(updatedAt);

    if (valid) {
        seenIds.add(id);
    }

    return valid;
}

const BACKUP_VERSION = 1;
const RATES_STORAGE_KEY = "mariflow.exchangeRates";

function getStoredExchangeRates() {
    const defaults = {
        USD: 1460,
        EUR: 1600
    };

    try {
        const savedRates = localStorage.getItem(
            RATES_STORAGE_KEY
        );

        if (!savedRates) {
            return defaults;
        }

        const parseRates = JSON.parse(savedRates);

        const USD = Number(parseRates?.USD);
        const EUR = Number(parseRates?.EUR);

        if (
            !Number.isFinite(USD) ||
            USD <= 0 ||
            !Number.isFinite(EUR) ||
            EUR <= 0
        ) {
            return defaults;
        }
        return { USD, EUR };
    } catch {
        return defaults;
    }
}

if (exportButton && backupFeedback) {
    exportButton.addEventListener("click", () => {
        const backup = {
            app: "MariFlow",
            version: BACKUP_VERSION,
            exportedAt: new Date().toISOString(),
            transactions: getTransactions(),
            settings: {
                monthlyBudget: Number(
                    localStorage.getItem(BUDGET_STORAGE_KEY)
                ) || 0,
                displayCurrency:
                    localStorage.getItem(CURRENCY_STORAGE_KEY) || "RWF",
                exchangeRates: getStoredExchangeRates()
            }
        };

        const blob = new Blob(
            [JSON.stringify(backup, null, 2)],
            { type: "application/json" }
        );

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `mariflow-backup-${new Date()
            .toISOString()
            .slice(0, 10)}.json`;

        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);

        backupFeedback.textContent = "Backup exported successfully.";
    });
}

if (importInput && backupFeedback) {
    importInput.addEventListener("change", async () => {
        const file = importInput.files?.[0];

        if (!file) {
            return;
        }

        backupFeedback.textContent = "";

        try {
            if (!file.name.toLowerCase().endsWith(".json")) {
                throw new Error("Please select a JSON backup file.");
            }

            const MAX_BACKUP_SIZE = 5*1024*1024;

            if (file.size > MAX_BACKUP_SIZE) {
                throw new Error(
                    "The backup file must be 5 MB or smaller."
                );
            }

            const backup = JSON.parse(await file.text());

            if (
                !backup ||
                backup.app !== "MariFlow" ||
                backup.version !== BACKUP_VERSION ||
                !Array.isArray(backup.transactions) ||
                !backup.settings ||
                typeof backup.settings !== "object"
            ) {
                throw new Error("This is not a valid MariFlow backup.");
            }


            const seenIds = new Set();

            const validTransactions = backup.transactions.every(
                (transaction) =>
                    isValidBackupTransactions(transaction, seenIds)

            );

            const {
                monthlyBudget: importedBudget,
                displayCurrency,
                exchangeRates
            } = backup.settings;

            const validSettings =
                Number.isFinite(Number(importedBudget)) &&
                Number(importedBudget) >= 0 &&
                ["RWF", "USD", "EUR"].includes(displayCurrency) &&
                exchangeRates &&
                typeof exchangeRates === "object" &&
                Number.isFinite(Number(exchangeRates.USD)) &&
                Number(exchangeRates.USD) > 0 &&
                Number.isFinite(Number(exchangeRates.EUR)) &&
                Number(exchangeRates.EUR) > 0;

            if (!validTransactions || !validSettings) {
                throw new Error(
                    "The backup contains invalid transactions or settings."
                );
            }

            const confirmed = window.confirm(
                "Importing this backup will replace your current transactions and settings. Continue?"
            );

            if (!confirmed) {
                backupFeedback.textContent = "Import cancelled.";
                return;
            }

            // Restore the transactions.
            setTransactions(backup.transactions);

            // Restore the monthly budget.
            localStorage.setItem(
                BUDGET_STORAGE_KEY,
                String(Number(importedBudget))
            );

            // Restore the display currency.
            localStorage.setItem(
                CURRENCY_STORAGE_KEY,
                displayCurrency
            );

            // Restore exchange rates.
            localStorage.setItem(
                RATES_STORAGE_KEY,
                JSON.stringify({
                    USD: Number(exchangeRates.USD),
                    EUR: Number(exchangeRates.EUR)
                })
            );

            // Update the settings displayed in the interface.
            if (budgetInput) {
                budgetInput.value = String(Number(importedBudget));
            }

            const importCurrencySelect =
                document.querySelector("#display-currency");

            if (importCurrencySelect) {
                importCurrencySelect.value = displayCurrency;
            }

            const usdInput = document.querySelector("#rate-usd");
            const eurInput = document.querySelector("#rate-eur");

            if (usdInput) {
                usdInput.value = String(Number(exchangeRates.USD));
            }

            if (eurInput) {
                eurInput.value = String(Number(exchangeRates.EUR));
            }

            // Update the outer budget variable and refresh the interface.
            monthlyBudget = Number(importedBudget);
            refreshTransactions();


            backupFeedback.textContent =
                "Backup imported successfully.";

        } catch (error) {
            backupFeedback.textContent =
                error instanceof SyntaxError
                    ? "The selected file is not valid JSON."
                    : error.message || "Could not import this backup.";

        } finally {
            importInput.value = "";
        }
    });
}
