
export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'other';

export const getCardBrand = (number: string): CardBrand => {
    const cleaned = number.replace(/\s/g, '');
    if (/^4/.test(cleaned)) return 'visa';
    if (/^5[1-5]/.test(cleaned)) return 'mastercard';
    if (/^3[47]/.test(cleaned)) return 'amex';
    return 'other';
};

export interface CardDetails { number: string; expiry: string; cvc: string; name: string; }

export const validateCard = (cardDetails: CardDetails): Record<string, string> => {
    const errors: Record<string, string> = {};
    const { number, expiry, cvc, name } = cardDetails;

    if (number.replace(/\s/g, '').length < 16) errors.number = "Card number must be 16 digits.";

    const expiryParts = expiry.split('/');
    const expMonth = parseInt(expiryParts[0], 10);
    const expYear = parseInt(expiryParts[1], 10);
    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;
    if (expiryParts.length !== 2 || !(expMonth >= 1 && expMonth <= 12 && (expYear > currentYear || (expYear === currentYear && expMonth >= currentMonth)))) {
        errors.expiry = "Invalid expiry date.";
    }

    if (!/^\d{3,4}$/.test(cvc)) errors.cvc = "CVC must be 3 or 4 digits.";
    if (name.trim().length < 2) errors.name = "Name is required.";
    
    return errors;
};

export const validateMobileWallet = (mobileWalletNumber: string): string | undefined => {
    const cleanedNumber = mobileWalletNumber.replace(/[-\s]/g, '');
    const isValid = /^01[3-9]\d{8}$/.test(cleanedNumber);
    return isValid ? undefined : 'Must be a valid 11-digit number starting with 01[3-9].';
};
