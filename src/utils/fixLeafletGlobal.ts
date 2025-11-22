import L from 'leaflet';

// Expose Leaflet to window for plugins that rely on global L (like leaflet.markercluster)
// @ts-ignore
if (typeof window !== 'undefined') {
    // @ts-ignore
    window.L = L;

}
