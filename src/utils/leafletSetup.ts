import L from 'leaflet';

// Import Leaflet marker icons locally
import markerIcon from '../assets/leaflet/marker-icon.png';
import markerIcon2x from '../assets/leaflet/marker-icon-2x.png';
import markerShadow from '../assets/leaflet/marker-shadow.png';

// Fix for default icon path issue in Vite/Webpack
export const setupLeafletIcons = () => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;

    L.Icon.Default.mergeOptions({
        iconRetinaUrl: markerIcon2x,
        iconUrl: markerIcon,
        shadowUrl: markerShadow,
    });
};
