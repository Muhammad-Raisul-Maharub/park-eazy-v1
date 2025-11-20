import React from 'react';

// Using inline SVGs for better control, styling, and performance.

export const BkashIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg viewBox="0 0 256 426" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="bKash">
        <path d="M128 426C198.7 426 256 330.68 256 213S198.7 0 128 0 0 95.32 0 213s57.3 213 128 213z" fill="#E2136E"/>
        <path d="M141.49 203.88l21.2-21.1-68.5-68.8-21.21 21.13 46.47 46.85-46.47 46.99 21.2 21.1 68.51-68.97zM110.18 249.25l-21.2 21.1 68.5 68.8 21.21-21.13-46.47-46.85 46.47-46.99-21.2-21.1-68.51 68.97z" fill="#fff"/>
    </svg>
);

export const NagadIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Nagad">
        <path d="M50 0C22.38 0 0 22.38 0 50s22.38 50 50 50 50-22.38 50-50S77.62 0 50 0z" fill="#EE4023"/>
        <path d="M69.1 35.5c-4.9-4.8-12.7-4.8-17.6 0l-5.3 5.3-2.9-2.9c-1.2-1.1-2.9-1.1-4.1 0-1.2 1.2-1.2 3 0 4.2l7 7c1.2 1.2 3.1 1.2 4.2 0l11.2-11.2c2.4-2.3 2.5-6.2.2-8.6zm-17.8 8.4l-.2.2-7-7c-.4-.4-.4-1 0-1.4.4-.4 1.1-.4 1.5 0l2.9 2.9 3 3 .8.8zM57.6 30c-4.9 0-9.2 2-12.4 5.2l-7 7c-1.2 1.2-1.2 3 0 4.2 1.2 1.2 3.1 1.2 4.2 0l7-7c1.7-1.7 4-2.6 6.4-2.6s4.7.9 6.4 2.6c1.7 1.7 2.6 4 2.6 6.4s-.9 4.7-2.6 6.4l-11.2 11.2c-1.7 1.7-4 2.6-6.4 2.6s-4.7-.9-6.4-2.6c-1.2-1.2-3.1-1.2-4.2 0-1.2 1.2-1.2 3 0 4.2 4.9 4.8 12.7 4.8 17.6 0l11.2-11.2C70.3 52 70.3 37.8 57.6 30z" fill="#fff"/>
    </svg>
);

export const RocketIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Rocket">
        <path d="M24 48c13.25 0 24-10.75 24-24S37.25 0 24 0 0 10.75 0 24s10.75 24 24 24z" fill="#8B3F96"/>
        <path d="M36.4 16.7l-9.5-2.8c-.3-.1-.6-.1-.9 0l-9.5 2.8c-1.1.3-1.6 1.6-1.3 2.7l.2.8c.3 1.1 1.6 1.6 2.7 1.3l5.1-1.5v11.3c0 2.8-1.5 3.9-4.2 3.9-1 0-1.9-.2-2.6-.5-1-.5-2.2.1-2.5 1.2l-.3.9c-.3 1 .1 2.2 1.2 2.5 1.5.6 3.2.9 4.9.9 5.3 0 8.7-2.3 8.7-8v-11.3l5.1 1.5c1.1.3 2.4-.2 2.7-1.3l.2-.8c.4-1.1-.1-2.4-1.2-2.7z" fill="#fff"/>
    </svg>
);

// --- Card Brand Icons ---

export const VisaIcon: React.FC<{ className?: string }> = ({ className = 'h-6' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 38 24" className={className} role="img" aria-labelledby="pi-visa">
        <title id="pi-visa">Visa</title>
        <path d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z" fill="#142668" />
        <path d="M22.9 16.8h-2.3L23.4 7h2.8l-3.3 9.8zM13.2 7l-3.2 9.8H7.4l3.3-9.8h2.5zM3.8 7l-2.4 7.2c-.2.5-.5.7-.9.7-.5 0-.8-.3-.8-.8S1.1 7 1.1 7h2.7zM17.4 9.8c-.8.5-1.5.8-2.2.8-.7 0-1.1-.2-1.1-.7 0-.4.5-.7 1.3-.9.9-.3 1.5-.5 1.5-.9 0-.4-.5-.7-1.2-.7-.8 0-1.3.2-1.7.5L14 7.3c.5-.3 1.3-.5 2.1-.5.9 0 2.1.4 2.1 1.4 0 .7-.5 1.1-1.2 1.4-.8.2-1.4.5-1.4.9 0 .4.5.7 1.1.7.8 0 1.4-.2 1.8-.5l.4 1.5zM33.4 9.8c-.8.5-1.5.8-2.2.8-.7 0-1.1-.2-1.1-.7 0-.4.5-.7 1.3-.9.9-.3 1.5-.5 1.5-.9 0-.4-.5-.7-1.2-.7-.8 0-1.3.2-1.7.5L28.1 7.3c.5-.3 1.3-.5 2.1-.5.9 0 2.1.4 2.1 1.4 0 .7-.5 1.1-1.2 1.4-.8.2-1.4.5-1.4.9 0 .4.5.7 1.1.7.8 0 1.4-.2 1.8-.5l.4 1.5z" fill="#fff" />
    </svg>
);

export const MastercardIcon: React.FC<{ className?: string }> = ({ className = 'h-6' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 38 24" className={className} role="img" aria-labelledby="pi-mastercard">
        <title id="pi-mastercard">Mastercard</title>
        <path d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z" fill="#222"/>
        <circle cx="15" cy="12" r="7" fill="#EB001B" />
        <circle cx="23" cy="12" r="7" fill="#F79E1B" />
        <path d="M20 12c0-3.9-3.1-7-7-7-1.9 0-3.6.7-4.9 2-.9 1.1-1.4 2.5-1.4 4s.5 2.9 1.4 4c1.3 1.3 3 2 4.9 2 3.9 0 7-3.1 7-7z" fill="#FF5F00" />
    </svg>
);

export const AmexIcon: React.FC<{ className?: string }> = ({ className = 'h-6' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 38 24" className={className} role="img" aria-labelledby="pi-amex">
        <title id="pi-amex">American Express</title>
        <path d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z" fill="#006FCF" />
        <path d="M12.9 17.2l1.6-4.5h2.1l-1.6 4.5h-2.1z M22.1 17.2l-1-2.9h-3.8l-1 2.9h-2.2l4.1-10.4h2.2l4.1 10.4h-2.2z M17.9 12.8h2.5l-1.2-3.7-1.3 3.7z M30.1 14.3h-2.1l.9-2.7-1.1-1.1-.9 2.6-1.5-4h2.2l.6 1.9.7-1.9h2.2l-1.5 4 .9 2.6z" fill="#fff" />
    </svg>
);

export const GenericCardIcon: React.FC<{ className?: string }> = ({ className = 'h-6' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 38 24" className={className} role="img" aria-labelledby="pi-generic">
        <title id="pi-generic">Credit Card</title>
        <path d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z" fill="#707070" />
        <path d="M0 8h38v3H0V8z" fill="#fff" />
    </svg>
);