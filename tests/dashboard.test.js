
import {
    updateDashboard,
    updateBudgetProgress,
    updateSpendingBreakdown
} from "../scripts/ui.js";

const results = [];

function test(name, callback) {
    try {
        callback();
        results.push({ name, passed: true });
    } catch (error) {
        results.push({
            name,
            passed: false,
            error: error.message
        });
    }
}

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(
            `${message}: expected "${expected}", received "${actual}"`
        );
    }
}

function currentDate(day = 1, offsetMonths = 0) {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() + offsetMonths);
    date.setDate(day);

    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")
    ].join("-");
}

function createDashboardFixture() {
    document.body.innerHTML = `
        <div class="summary-card">
            <p class="summary-value"></p>
            <p class="summary-caption"></p>
        </div>
        <div class="summary-card">
            <p class="summary-value"></p>
            <p class="summary-caption"></p>
        </div>
        <div class="summary-card">
            <p class="summary-value"></p>
            <p class="summary-caption"></p>
        </div>
        <div class="summary-card">
            <p class="summary-value"></p>
            <p class="summary-caption"></p>
        </div>

        <article class="budget-panel">
            <span class="budget-status"></span>
            <div class="budget-ring">
                <div class="budget-ring-inner">
                    <strong></strong>
                </div>
            </div>
            <div class="budget-line"><strong></strong></div>
            <div class="budget-line"><strong></strong></div>
            <div class="budget-line"><strong></strong></div>
            <div class="budget-progress-track"></div>
            <div class="budget-progress-fill"></div>
        </article>

        <div id="spending-breakdown"></div>
    `;
}

const transactions = [
    {
        id: "1",
        description: "Food shopping",
        amount: 30000,
        type: "expense",
        category: "Food",
        date: currentDate(1),
        status: "paid"
    },
    {
        id: "2",
        description: "Medicine",
        amount: 20000,
        type: "expense",
        category: "Health",
        date: currentDate(2),
        status: "paid"
    },
    {
        id: "3",
        description: "Student allowance",
        amount: 100000,
        type: "income",
        category: "Income",
        date: currentDate(3),
        status: "paid"
    },
    {
        id: "4",
        description: "Old-month expense",
        amount: 90000,
        type: "expense",
        category: "Shopping",
        date: currentDate(1, -1),
        status: "paid"
    }
];

createDashboardFixture();

test("Monthly income excludes expenses and previous-month transactions", () => {
    updateDashboard(transactions, 100000);

    const values = document.querySelectorAll(
        ".summary-card .summary-value"
    );

    assertEqual(values[0].textContent, "RWF 100,000", "Monthly income");
});

test("Monthly expenses exclude previous-month transactions", () => {
    updateDashboard(transactions, 100000);

    const values = document.querySelectorAll(
        ".summary-card .summary-value"
    );

    assertEqual(values[1].textContent, "RWF 50,000", "Monthly expenses");
});

test("Remaining budget is calculated correctly", () => {
    updateDashboard(transactions, 100000);

    const values = document.querySelectorAll(
        ".summary-card .summary-value"
    );

    assertEqual(values[2].textContent, "RWF 50,000", "Remaining budget");
});

test("Top category reflects current-month expense totals", () => {
    updateDashboard(transactions, 100000);

    const values = document.querySelectorAll(
        ".summary-card .summary-value"
    );

    assertEqual(values[3].textContent, "Food", "Top category");
});

test("Budget progress reports the correct usage percentage", () => {
    updateBudgetProgress(transactions, 100000);

    const percentage = document.querySelector(
        ".budget-ring-inner strong"
    );

    assertEqual(percentage.textContent, "50%", "Budget usage");
});

test("Spending breakdown includes current-month expense categories", () => {
    updateSpendingBreakdown(transactions);

    const breakdown = document.querySelector("#spending-breakdown");

    assertEqual(
        breakdown.querySelectorAll(".breakdown-item").length,
        2,
        "Number of spending categories"
    );

    assertEqual(
        breakdown.textContent.includes("Shopping"),
        false,
        "Previous-month category should be excluded"
    );
});

document.body.innerHTML += `
    <section id="test-results">
        <h1>M5 Dashboard Test Results</h1>
        <p id="test-summary"></p>
        <ul id="test-list"></ul>
    </section>
`;

const passed = results.filter((result) => result.passed).length;
const summary = document.querySelector("#test-summary");
const list = document.querySelector("#test-list");

summary.textContent = `${passed} of ${results.length} tests passed.`;

results.forEach((result) => {
    const item = document.createElement("li");
    item.textContent = result.passed
        ? `PASS: ${result.name}`
        : `FAIL: ${result.name} — ${result.error}`;

    item.style.color = result.passed ? "green" : "red";
    list.appendChild(item);
});
