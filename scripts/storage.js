
/**
 * PesaFlow — Student Finance Tracker
 * M6: Transaction persistence
 */

const TRANSACTIONS_STORAGE_KEY = "pesaFlow.transactions";

export function loadTransactions() {
    try {
        const savedData = localStorage.getItem(
            TRANSACTIONS_STORAGE_KEY
        );

        if (!savedData) {
            return [];
        }

        const transactions = JSON.parse(savedData);

        return Array.isArray(transactions) ? transactions : [];
    } catch (error) {
        console.error("Could not load saved transactions:", error);
        return [];
    }
}

export function saveTransactions(transactions) {
    try {
        localStorage.setItem(
            TRANSACTIONS_STORAGE_KEY,
            JSON.stringify(transactions)
        );

        return true;
    } catch (error) {
        console.error("Could not save transactions:", error);
        return false;
    }
}
