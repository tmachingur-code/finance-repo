/**
 * PesaFlow — Student Finance Tracker
 * M4: Regex search, filtering, and sorting
 */

/**
 * Search transactions using a regular expression.
 * Invalid regex patterns return an error instead of breaking the app.
 */
export function searchTransactions(transactions, query) {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return { results: [...transactions], error: "" };
  }

  let regex;

  try {
    regex = new RegExp(trimmedQuery, "i");
  } catch {
    return {
      results: [],
      error: "Invalid regex pattern. Check your search expression."
    };
  }

  const results = transactions.filter((transaction) => {
    const searchableText = [
      transaction.description,
      transaction.category,
      transaction.type,
      transaction.status,
      transaction.date,
      transaction.amount
    ].join(" ");

    return regex.test(searchableText);
  });

  return { results, error: "" };
}

/**
 * Filter transactions by category.
 */
export function filterTransactions(transactions, category = "all") {
  if (category === "all") {
    return [...transactions];
  }

  return transactions.filter(
    (transaction) => transaction.category === category
  );
}

/**
 * Sort transactions without mutating the original array.
 */
export function sortTransactions(transactions, sortBy = "date-desc") {
  const sorted = [...transactions];

  switch (sortBy) {
    case "date-asc":
      return sorted.sort((a, b) => a.date.localeCompare(b.date));

    case "description-asc":
      return sorted.sort((a, b) =>
        a.description.localeCompare(b.description)
      );

    case "description-desc":
      return sorted.sort((a, b) =>
        b.description.localeCompare(a.description)
      );

    case "amount-asc":
      return sorted.sort((a, b) => Number(a.amount) - Number(b.amount));

    case "amount-desc":
      return sorted.sort((a, b) => Number(b.amount) - Number(a.amount));

    case "date-desc":
    default:
      return sorted.sort((a, b) => b.date.localeCompare(a.date));
  }
}

/**
 * Apply search, category filtering, and sorting together.
 */
export function getVisibleTransactions(
  transactions,
  { query = "", category = "all", sortBy = "date-desc" } = {}
) {
  const searchResult = searchTransactions(transactions, query);

  if (searchResult.error) {
    return {
      results: [],
      error: searchResult.error
    };
  }

  const filtered = filterTransactions(searchResult.results, category);
  const sorted = sortTransactions(filtered, sortBy);

  return {
    results: sorted,
    error: ""
  };
}