export const formatCurrency = (amount: number): string => {
    // Using BDT symbol explicitly as some browsers might not support 'bn-BD' locale well for currency symbol
    return `৳${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatDateTimeLocal = (date: Date | null): string => {
    if (!date) return '';
    const pad = (num: number) => num.toString().padStart(2, '0');
    // Format to YYYY-MM-DDTHH:MM which is required by datetime-local input
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const formatTimestamp = (date: Date): string => {
    // Returns a format like "2024-07-28 15:30:00"
    return date.toLocaleString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(',', '');
};

export const formatDistance = (km: number): string => {
    if (km < 1) {
        return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(1)} km`;
};