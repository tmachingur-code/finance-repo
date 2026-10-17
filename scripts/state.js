/**
 * MariFlow - Student Finance Tracker
 * M6: Transaction state management with unique IDs and timestamps.
 */

import{
    loadTransactions,
    saveTransactions
} from "./storage.js";

import {
    isRealDate,
    isValidTransaction
} from "./validators.js";

function createTransactionId() {
    return `rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function getTimestamp() {
    return new Date().toISOString();
}

function isValidStateTransaction(transaction) {
    return(
        isValidTransaction(transaction) && 
        ["paid", "planned"].includes(transaction.status)
    );
}

function isValidTimestamp(value) {
    return (
        typeof value === "string" &&
        !Number.isNaN(Date.parse(value))
    );
}

function normalizeTransactions(items) {
    if (!Array.isArray(items)) {
        return [];
    }

    const seenIds = new Set();
    const now = new Date().toISOString();

    return items
        .filter((transaction) =>
            transaction &&
            typeof transaction === "object" &&
            !Array.isArray(transaction)
        )
        .map((transaction) => {
            const amount = Number(transaction.amount);

            if (
                typeof transaction.description !== "string" ||
                !transaction.description.trim() ||
                !Number.isFinite(amount) ||
                amount <= 0 ||
                !["income", "expense"].includes(transaction.type) ||
                typeof transaction.category !== "string" ||
                !transaction.category.trim() ||
                !isRealDate(transaction.date) ||
                !["paid", "planned"].includes(transaction.status)
            ) {
                return null;
            }

            let id = transaction.id;

            if (
                typeof id !== "string" ||
                !id.trim() ||
                seenIds.has(id)
            ) {
                id = createTransactionId();

                while (seenIds.has(id)) {
                    id = createTransactionId();
                }
            }

            seenIds.add(id);

            return {
                ...transaction,
                id,
                amount,
                createdAt: isValidTimestamp(transaction.createdAt)
                    ? transaction.createdAt
                    : now,
                updatedAt: isValidTimestamp(transaction.updatedAt)
                    ? transaction.updatedAt
                    : now
            };
        })
        .filter(Boolean);
}

let transactions = normalizeTransactions(loadTransactions());

// Save the normalized data so the migration persists.
saveTransactions(transactions);


/**
 * Return a copy of all transactions.
 */
export function getTransactions() {
    return transactions.map((transaction) => ({ ...transaction }));
}

/**
 * Add a transaction with a unique ID and timestamps.
 */
export function addTransaction(transaction) {
    if (!transaction || typeof transaction !== "object") {
        throw new TypeError("A valid transaction object is required.");
    }

    const timestamp = getTimestamp();

    const newTransaction = {
        id: createTransactionId(),
        description: transaction.description,
        amount: Number(transaction.amount),
        type: transaction.type,
        category: transaction.category,
        date: transaction.date,
        createdAt: timestamp,
        updatedAt: timestamp,
        status: transaction.status
    };

    if (!isValidStateTransaction(newTransaction)) {
        throw new TypeError ("Invalid transaction data.");
    }

    transactions = [...transactions, newTransaction];
    saveTransactions(transactions);

    return { ...newTransaction };
}

/**
 * Remove a transaction by its ID.
 */
export function deleteTransaction(id) {
    const originalLength = transactions.length;

    const updatedTransactions = transactions.filter(
        (transaction) => String(transaction.id) !== String(id)
    );

    if (updatedTransactions.length === originalLength) {
        return false;
    }

    transactions = updatedTransactions;
    saveTransactions(transactions);

    return true;
}
/*
 * Update a transaction while preserving its ID and creation timestamp.
 */
export function updateTransaction(id,updates) {
    const index = transactions.findIndex(
        (transaction) =>String(transaction.id) === String(id)
    );

    if (index === -1) {
        return false;
    }

    if (
        !updates ||
        typeof updates !== "object" ||
        Array.isArray(updates)
    ) {
        throw new TypeError("Updates must be an object");
    }

    const existing = transactions[index];

    const candidate = {
        ...existing,
        ...updates,
        amount: Number(updates.amount ?? existing.amount),
        id: existing.id,
        createdAt: existing.createdAt,
        updatedAt: getTimestamp()
    };

    if (
        !isValidStateTransaction(candidate) ||
        !isValidTimestamp(candidate.createdAt) ||
        !isValidTimestamp(candidate.updatedAt)
    ) {
        throw new TypeError("Invalid updated transaction data.");
    }

    transactions = transactions.map((transaction, currentIndex) =>
        currentIndex === index ? candidate: transaction
    );

    saveTransactions(transactions);

    return true;
}

/**
 * Replace the current transactions.
 * Import validation must happen before calling this function.
 */
export function setTransactions(items) {
    if (!Array.isArray(items)) {
        throw new TypeError(
            "Transaction must be provided as an array."
        );
    }

    const seenIds = new Set();

    const validatedTransactions = items.map((item) => {
        if (
            !item ||
            typeof item !== "object" ||
            Array.isArray(item)
        ) {
            throw new TypeError(
                "Every transaction must be an object."
            );
        }

        const candidate = {
            ...item,
            amount: Number(item.amount)
        };

        if (!isValidStateTransaction(candidate)) {
            throw new TypeError(
                "Imported data contains an invalid transaction."
            );
        }

        if (
            typeof candidate.id !== "string" ||
            !candidate.id.trim()
        ) {
            throw new TypeError(
                "Every transaction must have a valid ID."
            );
        }

        if (seenIds.has(candidate.id)) {
            throw new TypeError(
                "Imported data contains duplicate transaction IDs."
            );
        }

        if (
            !isValidTimestamp(candidate.createdAt) ||
            !isValidTimestamp(candidate.updatedAt)
        ) {
            throw new TypeError(
                "Every transaction must have valid timestamps."
            );
        }

        seenIds.add(candidate.id);

        return candidate;
});

//Replace the current sate only after every record passes.
transactions = validatedTransactions;
saveTransactions(transactions);
}
/**
 * Remove all transactions from memory and persistent storage.
 */
export function clearTransactions() {
    transactions = [];
    saveTransactions(transactions);
}
