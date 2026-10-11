/**
 * PesaFlow — Student Finance Tracker
 * M4: Transaction rendering
 */



/**
 * M5: Dashboard statistics for the current month
 */
export function updateDashboard(transactions, budget = 0) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const isCurrentMonth = (transaction) => {
        // Parse YYYY-MM-DD as a local calendar date.
        const parts = transaction.date.split("-").map(Number);

        return (
            parts.length === 3 &&
            parts[0] === currentYear &&
            parts[1] === currentMonth + 1
        );
    };

    const monthlyTransactions = transactions.filter(isCurrentMonth);

    const incomeTotal = monthlyTransactions
        .filter((transaction) => transaction.type === "income")
        .reduce((total, transaction) => total + Number(transaction.amount), 0);

    const expenseTotal = monthlyTransactions
        .filter((transaction) => transaction.type === "expense")
        .reduce((total, transaction) => total + Number(transaction.amount), 0);

    const remainingBudget = budget > 0
        ? budget - expenseTotal
        : 0;

    const categoryTotals = {};

    monthlyTransactions
        .filter((transaction) => transaction.type === "expense")
        .forEach((transaction) => {
            categoryTotals[transaction.category] =
                (categoryTotals[transaction.category] || 0) +
                Number(transaction.amount);
        });

    const topCategory = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || "No data yet";

    const summaryValues = document.querySelectorAll(
        ".summary-card .summary-value"
    );

    const summaryCaptions = document.querySelectorAll(
        ".summary-card .summary-caption"
    );

    const formatCurrency = (amount) =>
        `RWF ${new Intl.NumberFormat("en-RW", {
            maximumFractionDigits: 2
        }).format(amount)}`;

    if (summaryValues.length >= 4) {
        summaryValues[0].textContent = formatCurrency(incomeTotal);
        summaryValues[1].textContent = formatCurrency(expenseTotal);
        summaryValues[2].textContent = formatCurrency(remainingBudget);
        summaryValues[3].textContent = topCategory;
    }

    if (summaryCaptions.length >= 4) {
        summaryCaptions[0].textContent = "This month";
        summaryCaptions[1].textContent = "This month";
        summaryCaptions[2].textContent = budget > 0
            ? "Remaining this month"
            : "Budget not configured";
        summaryCaptions[3].textContent = "Top category this month";
    }
}


/**
 * M5: Render the spending trend for the last seven days.
 */
export function updateSpendingTrend(transactions) {
    const chart = document.querySelector(".chart-bars");
    const xAxis = document.querySelector(".chart-x-axis");
    const chartUnit = document.querySelector(".chart-unit");
    const footnote = document.querySelector(".chart-footnote");

    if (!chart || !xAxis) {
        return;
    }

    // Use the current date and the six preceding days.
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = [];

    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);

        const key = [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0")
        ].join("-");

        days.push({
            key,
            label: date.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short"
            }),
            total: 0
        });
    }

    // Count expenses recorded during the seven-day period.
    transactions
        .filter((transaction) => transaction.type === "expense")
        .forEach((transaction) => {
            const day = days.find(
                (item) => item.key === transaction.date
            );

            if (day) {
                day.total += Number(transaction.amount);
            }
        });

        // Keep the vertical axis consistent with the chart's 150K maximum.
    const chartMaximum = 150000;

    chart.innerHTML = days.map((day) => {
        const height = chartMaximum > 0
            ? (day.total / chartMaximum) * 100
            : 0;

        return `
            <span
                class="chart-bar"
                style="--bar-height: ${height}%"
                title="${day.label}: ${formatAmount(day.total)}"
                role="img"
                aria-label="${day.label}: ${formatAmount(day.total)} in expenses"
            ></span>
        `;
    }).join("");

    xAxis.innerHTML = days.map((day) =>
        `<span>${day.label}</span>`
    ).join("");

    if (chartUnit) {
        chartUnit.textContent = "RWF";
    }

    if (footnote) {
        footnote.textContent =
            "Daily expenses for the last seven days.";
    }
}


/**
 * M5: Budget progress for the current month
 */
export function updateBudgetProgress(transactions, budget = 0) {
    const budgetPanel = document.querySelector(".budget-panel");

    if (!budgetPanel) {
        return;
    }

    const statusElement = budgetPanel.querySelector(".budget-status");
    const ring = budgetPanel.querySelector(".budget-ring");
    const percentageElement = budgetPanel.querySelector(
        ".budget-ring-inner strong"
    );
    const breakdown = budgetPanel.querySelectorAll(".budget-line strong");
    const progressTrack = budgetPanel.querySelector(".budget-progress-track");
    const progressFill = budgetPanel.querySelector(".budget-progress-fill");

    const formatCurrency = (amount) =>
        `RWF ${new Intl.NumberFormat("en-RW", {
            maximumFractionDigits: 2
        }).format(amount)}`;

    const now = new Date();

    const monthlyExpenses = transactions
        .filter((transaction) => {
            if (transaction.type !== "expense") {
                return false;
            }

            const parts = transaction.date.split("-").map(Number);

            return (
                parts.length === 3 &&
                parts[0] === now.getFullYear() &&
                parts[1] === now.getMonth() + 1
            );
        })
        .reduce(
            (total, transaction) => total + Number(transaction.amount),
            0
        );

    const remaining = budget - monthlyExpenses;
    const percentage = budget > 0
        ? (monthlyExpenses / budget) * 100
        : 0;

    const displayedPercentage = Math.min(Math.max(percentage, 0), 100);
    const roundedPercentage = Math.round(percentage);

    if (statusElement) {
        statusElement.textContent = budget <= 0
            ? "Not set"
            : percentage > 100
                ? "Over budget"
                : percentage >= 80
                    ? "Near limit"
                    : "On track";
    }

    if (percentageElement) {
        percentageElement.textContent = `${roundedPercentage}%`;
    }

    if (ring) {
        ring.style.background = budget > 0
            ? `conic-gradient(#d9ad4f ${displayedPercentage}%, #e5eaf0 ${displayedPercentage}%)`
            : "#e5eaf0";

        ring.setAttribute(
            "aria-label",
            budget > 0
                ? `Current-month budget usage is ${roundedPercentage} percent.`
                : "No budget has been configured."
        );
    }

    if (breakdown.length >= 3) {
        breakdown[0].textContent = formatAmount(monthlyExpenses);
        breakdown[1].textContent = budget > 0
            ? formatAmount(remaining)
            : "RWF 0";
        breakdown[2].textContent = budget > 0
            ? formatAmount(budget)
            : "Not set";

        breakdown[1].classList.toggle("positive-value", remaining >= 0);
    }

    if (progressTrack) {
        progressTrack.setAttribute(
            "aria-valuenow",
            String(Math.round(displayedPercentage))
        );

        progressTrack.setAttribute(
            "aria-valuetext",
            budget > 0
                ? `${roundedPercentage}% of monthly budget used`
                : "No budget configured"
        );
    }

    if (progressFill) {
        progressFill.style.width = `${displayedPercentage}%`;
    }
}

export function updateSpendingBreakdown(transactions) {
  const container = document.querySelector("#spending-breakdown");

  if (!container) return;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyExpenses = transactions.filter((transaction) => {
    if (transaction.type !== "expense") return false;

    const parts = transaction.date.split("-");

    if (parts.length !== 3) return false;

    const year = Number(parts[0]);
    const month = Number(parts[1]) - 1;

    return year === currentYear && month === currentMonth;
  });

  const categoryTotals = {};

  monthlyExpenses.forEach((transaction) => {
    const category = transaction.category;
    categoryTotals[category] =
      (categoryTotals[category] || 0) + Number(transaction.amount);
  });

  const categories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1]);

  const totalExpenses = categories.reduce(
    (total, [, amount]) => total + amount,
    0
  );

  if (categories.length === 0 || totalExpenses === 0) {
    container.innerHTML = `
      <p class="breakdown-empty">
        No expenses recorded for this month yet.
      </p>
    `;
    return;
  }

  container.innerHTML = categories
    .map(([category, amount]) => {
      const percentage = (amount / totalExpenses) * 100;

      return `
        <div class="breakdown-item">
          <div class="breakdown-item-heading">
            <span class="breakdown-category">${escapeHTML(category)}</span>
            <span class="breakdown-percentage">
              ${percentage.toFixed(1)}%
            </span>
          </div>

          <div class="breakdown-item-heading">
            <span>${formatAmount(amount)}</span>
          </div>

          <div
            class="breakdown-progress-track"
            role="progressbar"
            aria-label="${escapeHTML(category)} spending"
            aria-valuenow="${percentage.toFixed(1)}"
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <div
              class="breakdown-progress-fill"
              style="width: ${percentage}%"
            ></div>
          </div>
        </div>
      `;
    })
    .join("");
}



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
    return `RWF ${new Intl.NumberFormat("en-RW", {
        maximumFractionDigits: 2
    }).format(Number(amount) || 0)}`;
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
