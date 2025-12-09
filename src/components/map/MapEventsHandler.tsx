import React from 'react';
import { useMapEvents } from 'react-leaflet';
import L from 'leaflet';

interface MapEventsHandlerProps {
    onMapClick: (latlng: L.LatLng) => void;
}

const MapEventsHandler: React.FC<MapEventsHandlerProps> = ({ onMapClick }) => {
    useMapEvents({
        click(e) {
            const target = e.originalEvent.target as HTMLElement;
            if (target.closest('.leaflet-marker-icon') ||
                target.closest('.leaflet-popup-content-wrapper') ||
                target.closest('.leaflet-control-container') ||
                target.closest('button') ||
                target.closest('.map-controls-container') ||
                target.closest('.bottom-sheet-container')) {
                return;
            }
            onMapClick(e.latlng);
        },
    });
    return null;
};

export default MapEventsHandler;
