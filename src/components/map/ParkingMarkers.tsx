import React, { useEffect } from 'react';
import { useMap, Marker } from 'react-leaflet';
import L from 'leaflet';
import { ParkingSlot } from '../../types';
import { getVehicleMarkerIcon } from '../../utils/mapHelpers';

interface ParkingMarkersProps {
    slots: ParkingSlot[];
    onMarkerClick: (slot: ParkingSlot) => void;
}

const ParkingMarkers: React.FC<ParkingMarkersProps> = ({ slots, onMarkerClick }) => {
    const map = useMap();

    // Use refs to keep track of markers for cleanup
    const markersRef = React.useRef<L.Marker[]>([]);

    useEffect(() => {
        if (!map) return;

        // Cleanup existing markers
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];

        // Create new markers
        const newMarkers = slots
            .filter(slot => slot.location && Array.isArray(slot.location) && slot.location.length === 2 && slot.location[0] !== 0 && slot.location[1] !== 0)
            .map(slot => {
                const marker = L.marker(slot.location, {
                    icon: getVehicleMarkerIcon(slot.status, slot.type, { isNew: false }, slot.id),
                    title: slot.name,
                    riseOnHover: true,
                });

                marker.on('click', (e) => {
                    L.DomEvent.stopPropagation(e);
                    onMarkerClick(slot);
                });

                return marker;
            });

        // Add to map
        newMarkers.forEach(m => m.addTo(map));
        markersRef.current = newMarkers;

        // Cleanup function
        return () => {
            newMarkers.forEach(m => m.remove());
        };
    }, [map, slots, onMarkerClick]);

    return null;
};

export default ParkingMarkers;
