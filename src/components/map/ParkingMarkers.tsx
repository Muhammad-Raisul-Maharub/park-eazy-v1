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

    useEffect(() => {
        if (!map) return;

        // Create cluster group with custom settings
        const markerClusterGroup = L.markerClusterGroup({
            showCoverageOnHover: false,
            spiderfyOnMaxZoom: true,
            maxClusterRadius: 45, // Smaller radius to avoid aggressive clustering
            zoomToBoundsOnClick: true,
            animate: true,
            removeOutsideVisibleBounds: true,
        });

        // Create markers
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

        // Add markers to the cluster group
        newMarkers.forEach(marker => markerClusterGroup.addLayer(marker));

        // Add the cluster group to the map
        map.addLayer(markerClusterGroup);

        // Cleanup function
        return () => {
            // Removing the group automatically removes all markers from the map
            map.removeLayer(markerClusterGroup);
        };
    }, [map, slots, onMarkerClick]);

    return null;
};

export default ParkingMarkers;
