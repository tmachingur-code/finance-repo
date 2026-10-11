/**
 * PesaFlow — Student Finance Tracker
 * M4: Transaction rendering
 */

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (character) => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}

function formatAmount(amount) {
    return new Intl.NumberFormat("en-RW", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(Number(amount));
}

function formatDate(dateString) {
    const date = new Date(`${dateString}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return escapeHTML(dateString);
    }

    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function getEmptyState(message, filtered = false) {
    const link = filtered
        ? ""
        : `<a class="text-link" href="#add-transaction">Add your first transaction</a>`;

    return `
        <span class="empty-icon" aria-hidden="true">▤</span>
        <strong>${escapeHTML(message)}</strong>
        <span>${filtered
            ? "Try changing your search or filters."
            : "Your financial records will appear here."
        }</span>
        ${link}
    `;
}

/**
 * Render transactions into the desktop table and mobile cards.
 */
export function renderTransactions(
    transactions,
    { filtered = false, searchError = "" } = {}
) {
    const tableBody = document.querySelector(".transaction-table tbody");
    const mobileContainer = document.querySelector(".mobile-transactions");
    const countElement = document.querySelector(".table-footer > p");

    if (!tableBody || !mobileContainer) {
        return;
    }

    if (searchError) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <strong>${escapeHTML(searchError)}</strong>
                </td>
            </tr>
        `;

        mobileContainer.innerHTML = `
            <div class="mobile-empty-state">
                <strong>${escapeHTML(searchError)}</strong>
            </div>
        `;

        if (countElement) {
            countElement.textContent = "Search pattern is invalid";
        }

        return;
    }

    if (transactions.length === 0) {
        const message = filtered
            ? "No matching transactions"
            : "No transactions yet";

        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    ${getEmptyState(message, filtered)}
                </td>
            </tr>
        `;

        mobileContainer.innerHTML = `
            <div class="mobile-empty-state">
                ${getEmptyState(message, filtered)}
            </div>
        `;

        if (countElement) {
            countElement.textContent = filtered
                ? "Showing 0 matching transactions"
                : "Showing 0 transactions";
        }

        return;
    }

    // Desktop transaction table
    tableBody.innerHTML = transactions.map((transaction) => {
        const type = escapeHTML(transaction.type);
        const status = escapeHTML(transaction.status);
        const id = escapeHTML(transaction.id);
        const description = escapeHTML(transaction.description);

        return `
            <tr data-transaction-id="${id}">
                <td>${escapeHTML(formatDate(transaction.date))}</td>
                <td>${description}</td>
                <td>${escapeHTML(transaction.category)}</td>
                <td>
                    <span class="transaction-type ${type}">
                        ${type === "income" ? "Income" : "Expense"}
                    </span>
                </td>
                <td class="amount-cell ${type}">
                    ${type === "income" ? "+" : "−"}${formatAmount(transaction.amount)}
                </td>
                <td>
                    <span class="status-badge ${status}">
                        ${status === "paid" ? "Paid" : "Planned"}
                    </span>
                </td>
                <td class="transaction-actions">
                    <button
                        type="button"
                        class="transaction-edit"
                        data-edit-id="${id}"
                        aria-label="Edit ${description}"
                    >Edit</button>

                    <button
                        type="button"
                        class="transaction-delete"
                        data-delete-id="${id}"
                        aria-label="Delete ${description}"
                    >Delete</button>
                </td>
            </tr>
        `;
    }).join("");

    // Mobile transaction cards
    mobileContainer.innerHTML = transactions.map((transaction) => {
        const type = escapeHTML(transaction.type);
        const status = escapeHTML(transaction.status);
        const id = escapeHTML(transaction.id);
        const description = escapeHTML(transaction.description);

        return `
            <article
                class="mobile-transaction-card"
                data-transaction-id="${id}"
            >
                <div class="mobile-transaction-top">
                    <strong>${description}</strong>
                    <span class="amount-cell ${type}">
                        ${type === "income" ? "+" : "−"}${formatAmount(transaction.amount)}
                    </span>
                </div>

                <div class="mobile-transaction-details">
                    <span>${escapeHTML(transaction.category)}</span>
                    <span>${escapeHTML(formatDate(transaction.date))}</span>
                </div>

                <div class="mobile-transaction-bottom">
                    <span class="transaction-type ${type}">
                        ${type === "income" ? "Income" : "Expense"}
                    </span>

                    <span class="status-badge ${status}">
                        ${status === "paid" ? "Paid" : "Planned"}
                    </span>

                    <button
                        type="button"
                        class="transaction-edit"
                        data-edit-id="${id}"
                        aria-label="Edit ${description}"
                    >Edit</button>

                    <button
                        type="button"
                        class="transaction-delete"
                        data-delete-id="${id}"
                        aria-label="Delete ${description}"
                    >Delete</button>
                </div>
            </article>
        `;
    }).join("");

    if (countElement) {
        countElement.textContent = filtered
            ? `Showing ${transactions.length} matching transaction${transactions.length === 1 ? "" : "s"}`
            : `Showing ${transactions.length} transaction${transactions.length === 1 ? "" : "s"}`;
    }
}
