
/**
 * PesaFlow — Student Finance Tracker
 * M6: Transaction state management with unique IDs and timestamps.
 */

import {
    loadTransactions,
    saveTransactions
} from "./storage.js";

function createTransactionId() {
    return `rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function getTimestamp() {
    return new Date().toISOString();
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
                typeof transaction.date !== "string" ||
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

            const validTimestamp = (value) =>
                typeof value === "string" &&
                !Number.isNaN(Date.parse(value));

            return {
                ...transaction,
                id,
                amount,
                createdAt: validTimestamp(transaction.createdAt)
                    ? transaction.createdAt
                    : now,
                updatedAt: validTimestamp(transaction.updatedAt)
                    ? transaction.updatedAt
                    : now
            };
        })
        .filter(Boolean);
}

let transactions = normalizeTransactions(loadTransactions());
let nextId = 1;

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

    transactions = [...transactions, newTransaction];
    saveTransactions(transactions);

    return { ...newTransaction };
}

/**
 * Remove a transaction by its ID.
 */
export function deleteTransaction(id) {
    const originalLength = transactions.length;

    transactions = transactions.filter(
        (transaction) => String(transaction.id) !== String(id)
    );

    saveTransactions(transactions);

    return transactions.length < originalLength;
}

/**
 * Update a transaction while preserving its ID and creation timestamp.
 */
export function updateTransaction(id, updates) {
    const index = transactions.findIndex(
        (transaction) => String(transaction.id) === String(id)
    );

    if (index === -1) {
        return false;
    }

    const existing = transactions[index];


    transactions[index] = {
        ...existing,
        ...updates,
        amount: Number(updates.amount ?? existing.amount),
        id: existing.id,
        createdAt: existing.createdAt || getTimestamp(),
        updatedAt: getTimestamp()
    };

    saveTransactions(transactions);

    return true;
}

/**
 * Replace the current transactions.
 * Import validation must happen before calling this function.
 */
export function setTransactions(items) {
    if (!Array.isArray(items)) {
        throw new TypeError("Transactions must be provided as an array.");
    }

    transactions = items.map((transaction) => ({
        ...transaction,
        amount: Number(transaction.amount)
    }));
    saveTransactions(transactions);

    nextId = transactions.length + 1;
}

/**
 * Remove all transactions from memory and persistent storage.
 */
export function clearTransactions() {
    transactions = [];
    nextId = 1;
    saveTransactions(transactions);
}
