
import L, { FeatureGroup, Marker } from 'leaflet';
import { ParkingSlot, ParkingSlotStatus, ParkingSlotType } from '../types';

// Type augmentation for Leaflet MarkerCluster
declare global {
    namespace L {
        interface MarkerClusterGroup extends FeatureGroup {
            getAllChildMarkers(): Marker[];
            getChildCount(): number;
        }
        namespace MarkerClusterGroup {
            interface MarkerCluster extends Marker {
                getAllChildMarkers(): Marker[];
                getChildCount(): number;
            }
        }
        function markerClusterGroup(options?: any): MarkerClusterGroup;
    }
}

function adjustBrightness(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

export const getGenericMarkerIcon = (colorName: 'green' | 'amber' | 'red' | 'blue') => {
    const color = {
        green: '#10b981', // emerald-500
        amber: '#f59e0b', // amber-500
        red: '#ef4444',   // red-500
        blue: '#3b82f6',  // blue-500
    }[colorName];

    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40" height="40" style="filter: drop-shadow(0 6px 8px rgba(0,0,0,0.15));">
      <path fill="${color}" stroke="white" stroke-width="2" d="M12 2C8.13 2 4 5.5 4 10c0 5.5 8 14 8 14s8-8.5 8-14c0-4.5-4.13-8-8-8z"/>
      <circle cx="12" cy="10" r="3.5" fill="white" fill-opacity="0.9"/>
    </svg>`;

    return new L.DivIcon({
        html: svg,
        className: 'marker-float',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
    });
};

const statusColors: { [key in ParkingSlotStatus]: string } = {
    [ParkingSlotStatus.AVAILABLE]: '#10b981', // Emerald-500
    [ParkingSlotStatus.RESERVED]: '#f59e0b',  // Amber-500
    [ParkingSlotStatus.OCCUPIED]: '#ef4444',  // Red-500
};

const typeIcons: { [key in ParkingSlotType]: string } = {
    [ParkingSlotType.CAR]: `M3 11h18v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6zm2-4l2-4h10l2 4H5z`,
    [ParkingSlotType.SUV]: `M2 11h20v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7zm3-5l2-4h10l2 4H5z`,
    [ParkingSlotType.BIKE]: `M16 5c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2zm-9.3 9l.5-1.9c.1-.5.6-.7 1.1-.6l3.4 1c.2.1.5.1.7 0l3.4-1c.5-.1 1 .1 1.1.6l.5 1.9c1.4.5 2.4 1.8 2.4 3.3v.4c0 .8-.7 1.5-1.5 1.5H6.5c-.8 0-1.5-.7-1.5-1.5v-.4c0-1.5 1-2.8 2.4-3.3z`,
    [ParkingSlotType.MINIVAN]: `M20 14V9c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v5h16zM4 15v4c0 .6.4 1 1 1h1c.6 0 1-.4 1-1v-1h10v1c0 .6.4 1 1 1h1c.6 0 1-.4 1-1v-4H4z`,
    [ParkingSlotType.TRUCK]: `M1 3h14v13H1V3zm16 5h6v8h-6V8z M5 18a2 2 0 1 0 4 0a2 2 0 1 0-4 0 M15 18a2 2 0 1 0 4 0a2 2 0 1 0-4 0`,
};

export const getVehicleMarkerIcon = (status: ParkingSlotStatus, type: ParkingSlotType, state: { isHovered?: boolean, isClicked?: boolean, isNew?: boolean } = {}, slotId?: string) => {
    const baseColor = statusColors[status];
    const displayColor = state.isHovered ? adjustBrightness(baseColor, 20) : baseColor;

    let className = 'custom-marker-icon marker-float';
    if (state.isNew) className += ' marker-new';
    if (state.isClicked) className += ' marker-clicked';
    if (state.isHovered) className += ' marker-hovered';

    // Generate a unique ID for the gradient to prevent conflicts
    const uniqueId = slotId ? `grad-${status}-${slotId}` : `grad-${status}-${Math.random().toString(36).substr(2, 9)}`;

    // Enhanced SVG with gradient and clearer shape
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 42" width="48" height="56" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4));">
            <defs>
                <linearGradient id="${uniqueId}" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:${displayColor};stop-opacity:1" />
                    <stop offset="100%" style="stop-color:${adjustBrightness(displayColor, -20)};stop-opacity:1" />
                </linearGradient>
            </defs>
            <path fill="url(#${uniqueId})" stroke="white" stroke-width="2" d="M16 0C7.164 0 0 7.164 0 16c0 9.5 16 26 16 26s16-16.5 16-26c0-8.836-7.164-16-16-16z"/>
            <circle cx="16" cy="16" r="11" fill="white" opacity="0.2"/>
            <circle cx="16" cy="16" r="9" fill="white"/>
            <g transform="translate(8, 8) scale(0.65)" fill="${displayColor}">
                <path d="${typeIcons[type]}" />
            </g>
        </svg>
    `;

    return new L.DivIcon({
        html: svg,
        className: className,
        iconSize: [48, 56],
        iconAnchor: [24, 56],
        popupAnchor: [0, -56],
        tooltipAnchor: [0, -40]
    });
};

export const getHighlightIcon = (slot: ParkingSlot) => {
    const color = statusColors[slot.status];
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" style="filter: drop-shadow(0 0 15px ${color});">
            <path fill="${color}" fill-opacity="0.9" d="M12 2C8.13 2 4 5.5 4 10c0 5.5 8 14 8 14s8-8.5 8-14c0-4.5-4.13-8-8-8z"/>
            <circle cx="12" cy="10" r="5" fill="white"/>
        </svg>
    `;
    return new L.DivIcon({
        html: svg,
        className: 'highlight-marker-icon marker-float',
        iconSize: [48, 48],
        iconAnchor: [24, 48],
        popupAnchor: [0, -48]
    });
};

export const searchedLocationIcon = () => {
    const color = '#3b82f6'; // blue-500
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2.5" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.2));">
            <path d="M12 0C7 0 3 4 3 9c0 5 9 15 9 15s9-10 9-15c0-5-4-9-9-9zm0 12a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
        </svg>
    `;
    return new L.DivIcon({
        html: svg,
        className: 'searched-location-marker marker-float',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
    });
};

export const userLocationIcon = new L.DivIcon({
    html: `<div class="user-location-marker"><div class="pulse"></div><div class="dot"></div></div>`,
    className: '',
    iconSize: [60, 60],
    iconAnchor: [30, 30]
});
