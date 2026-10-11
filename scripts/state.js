/**
 * PesaFlow — Student Finance Tracker
 * M4: Transaction state management
 */

import {
    loadTransactions,
    saveTransactions
} from "./storage.js";

let transactions = loadTransactions();
let nextId = 1;

/**
 * Return a copy of all transactions.
 */
export function getTransactions() {
  return transactions.map((transaction) => ({ ...transaction }));
}

/**
 * Add a validated transaction to the in-memory state.
 */
export function addTransaction(transaction) {
  if (!transaction || typeof transaction !== "object") {
    throw new TypeError("A valid transaction object is required.");
  }

  const newTransaction = {
    id: String(nextId++),
    description: transaction.description,
    amount: Number(transaction.amount),
    type: transaction.type,
    category: transaction.category,
    date: transaction.date,
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
    (transaction) => transaction.id !== String(id)
  );
  saveTransactions(transactions);

  return transactions.length < originalLength;
}

/**
 * Update an existing transaction without changing its ID.
 */
export function updateTransaction(id, updates) {
  const index = transactions.findIndex(
    (transaction) => transaction.id === String(id)
  );

  if (index === -1) {
    return false;
  }

  transactions[index] = {
    ...transactions[index],
    ...updates,
    id: transactions[index].id
  };

  saveTransactions(transactions);

  return true;
}


/**
 * Replace the current in-memory transactions.
 */
export function setTransactions(items) {
  if (!Array.isArray(items)) {
    throw new TypeError("Transactions must be provided as an array.");
  }

  transactions = items.map((transaction) => ({ ...transaction }));
  saveTransactions(transactions);

  const highestId = transactions.reduce((maximum, transaction) => {
    const numericId = Number(transaction.id);
    return Number.isFinite(numericId)
      ? Math.max(maximum, numericId)
      : maximum;
  }, 0);

  nextId = highestId + 1;
}

/**
 * Remove all transactions from memory.
 */
export function clearTransactions() {
  transactions = [];
  nextId = 1;
}