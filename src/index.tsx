import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

// CRITICAL: Import order matters for Leaflet plugins
import './utils/fixLeafletGlobal'; // 1. Expose L to window
import 'leaflet.markercluster';    // 2. Load plugin (uses window.L)
import { setupLeafletIcons } from './utils/leafletSetup'; // 3. Fix icons

// Initialize Leaflet icons
setupLeafletIcons();

import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Root element not found");
}
const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);