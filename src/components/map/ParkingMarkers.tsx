import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import { ParkingSlot } from '../../types';
import { getVehicleMarkerIcon } from '../../utils/mapHelpers';

interface ParkingMarkersProps {
    slots: ParkingSlot[];
    onMarkerClick: (slot: ParkingSlot) => void;
}

const ParkingMarkers: React.FC<ParkingMarkersProps> = ({ slots, onMarkerClick }) => {
    const map = useMap();
    const markerClusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);

    useEffect(() => {
        if (!map) return;

        // Clean up existing cluster group
        if (markerClusterGroupRef.current) {
            map.removeLayer(markerClusterGroupRef.current);
            markerClusterGroupRef.current = null;
        }

        const iconCreateFunction = (cluster: any) => {
            const childCount = cluster.getChildCount();
            let c = ' marker-cluster-';
            if (childCount < 10) { c += 'small'; }
            else if (childCount < 100) { c += 'medium'; }
            else { c += 'large'; }

            return L.divIcon({
                html: `<div style="position: relative;"><span>${childCount}</span></div>`,
                className: `marker-cluster ${c}`,
                iconSize: new L.Point(40, 40)
            });
        };

        const mcg = L.markerClusterGroup({
            iconCreateFunction,
            maxClusterRadius: 30,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
            spiderfyDistanceMultiplier: 2,
            animate: true,
            disableClusteringAtZoom: 16 // Fix: Disable clustering when zoomed in close
        });

        const markers = slots
            .filter(slot => slot.location && Array.isArray(slot.location) && slot.location.length === 2 && slot.location[0] !== 0 && slot.location[1] !== 0) // Filter invalid [0,0] or null locations
            .map(slot => {
                return L.marker(slot.location, {
                    icon: getVehicleMarkerIcon(slot.status, slot.type, { isNew: false }, slot.id),
                    title: slot.name,
                    riseOnHover: true,
                    // @ts-ignore
                    slotData: slot
                });
            });

        if (markers.length > 0) {
            (mcg as any).addLayers(markers);
        }
        mcg.on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            const layer = e.layer as any;
            if (layer.options?.slotData) {
                onMarkerClick(layer.options.slotData);
            }
        });

        map.addLayer(mcg);
        markerClusterGroupRef.current = mcg;

        return () => {
            if (markerClusterGroupRef.current && map.hasLayer(markerClusterGroupRef.current)) {
                map.removeLayer(markerClusterGroupRef.current);
            }
        };
    }, [map, slots, onMarkerClick]);

    return null;
};

export default ParkingMarkers;
