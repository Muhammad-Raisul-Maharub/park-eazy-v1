import React, { useEffect } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

interface MapInstanceProviderProps {
    setMap: (map: L.Map) => void;
    onMoveStart: () => void;
}

const MapInstanceProvider: React.FC<MapInstanceProviderProps> = ({ setMap, onMoveStart }) => {
    const map = useMap();
    useEffect(() => { setMap(map); }, [map, setMap]);
    useMapEvents({
        dragstart: onMoveStart,
    });
    return null;
};

export default MapInstanceProvider;
