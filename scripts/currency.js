
/**
 * M6: PesaFlow currency conversion and formatting.
 * Transaction amounts and budgets remain stored in RWF.
 */

const CURRENCY_STORAGE_KEY = "pesaFlow.displayCurrency";
const RATES_STORAGE_KEY = "pesaFlow.exchangeRates";

const DEFAULT_RATES = {
    USD: 1450,
    EUR: 1600
};

export function getCurrencySettings() {
    let savedRates = {};

    try {
        savedRates = JSON.parse(
            localStorage.getItem(RATES_STORAGE_KEY) || "{}"
        );
    } catch {
        savedRates = {};
    }

    const rates = {
        USD: Number(savedRates.USD) > 0
            ? Number(savedRates.USD)
            : DEFAULT_RATES.USD,
        EUR: Number(savedRates.EUR) > 0
            ? Number(savedRates.EUR)
            : DEFAULT_RATES.EUR
    };

    const savedCurrency = localStorage.getItem(CURRENCY_STORAGE_KEY);
    const currency = ["RWF", "USD", "EUR"].includes(savedCurrency)
        ? savedCurrency
        : "RWF";

    return { currency, rates };
}

export function convertFromRWF(amount) {
    const value = Number(amount) || 0;
    const { currency, rates } = getCurrencySettings();

    if (currency === "USD") {
        return value / rates.USD;
    }

    if (currency === "EUR") {
        return value / rates.EUR;
    }

    return value;
}

export function formatCurrency(amount) {
    const { currency } = getCurrencySettings();
    const convertedAmount = convertFromRWF(amount);

    const locale = {
        RWF: "en-RW",
        USD: "en-US",
        EUR: "en-IE"
    }[currency];

    return `${currency} ${new Intl.NumberFormat(locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(convertedAmount)}`;
}

export function saveExchangeRates(usdRate, eurRate) {
    const USD = Number(usdRate);
    const EUR = Number(eurRate);

    if (
        !Number.isFinite(USD) ||
        !Number.isFinite(EUR) ||
        USD <= 0 ||
        EUR <= 0
    ) {
        return false;
    }

    localStorage.setItem(
        RATES_STORAGE_KEY,
        JSON.stringify({ USD, EUR })
    );

    return true;
}
