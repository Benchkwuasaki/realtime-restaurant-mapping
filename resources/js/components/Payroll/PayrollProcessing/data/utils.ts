// resources/js/pages/Payroll/Processing/utils.ts

/**
 * Formats a number as Philippine Peso currency.
 * e.g. 12345.6 → "₱12,345.60"
 */
export function peso(amount: number): string {
    return `₱${amount.toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}