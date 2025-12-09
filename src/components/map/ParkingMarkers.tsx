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
        // No-op effect for cleanup if needed in future
    }, [map, slots]);

    return (
        <>
            {slots
                .filter(slot => slot.location && Array.isArray(slot.location) && slot.location.length === 2 && slot.location[0] !== 0 && slot.location[1] !== 0)
                .map(slot => (
                    <Marker
                        key={slot.id}
                        position={slot.location}
                        icon={getVehicleMarkerIcon(slot.status, slot.type, { isNew: false }, slot.id)}
                        riseOnHover={true}
                        eventHandlers={{
                            click: (e) => {
                                L.DomEvent.stopPropagation(e);
                                onMarkerClick(slot);
                            }
                        }}
                    >
                    </Marker>
                ))}
        </>
    );
};

export default ParkingMarkers;
