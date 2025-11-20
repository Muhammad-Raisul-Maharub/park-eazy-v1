
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { ParkingSlot, ParkingSlotType, ParkingSlotStatus } from '../../types';
import Button from '../common/Button';
import { X, MapPin, Search, Loader2, LocateFixed, CheckCircle } from 'lucide-react';
import Card from '../common/Card';
import { allFeaturesList, featureIcons } from '../../utils/constants';
import { geocodeWithRateLimit, GeocodedLocation } from '../../utils/geocoding';

// Fix for default icon path issue in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const activeMarkerIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const chittagongCoords: [number, number] = [22.3569, 91.8339];

const DraggableMarker: React.FC<{ position: [number, number]; onDragEnd: (latlng: L.LatLng) => void }> = ({ position, onDragEnd }) => {
    const markerRef = useRef<L.Marker>(null);
    const eventHandlers = useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current;
                if (marker != null) {
                    onDragEnd(marker.getLatLng());
                }
            },
        }),
        [onDragEnd],
    );

    return (
        <Marker
            draggable={true}
            eventHandlers={eventHandlers}
            position={position}
            ref={markerRef}
            icon={activeMarkerIcon}
        >
        </Marker>
    );
};

// --- Leaflet Helper Components ---
const MapEventsHandler: React.FC<{ onMapClick: (latlng: L.LatLng) => void, center: [number, number], zoom: number }> = ({ onMapClick, center, zoom }) => {
    const map = useMap();
    
    // Click handler to move marker
    useMapEvents({ click: (e) => onMapClick(e.latlng) });

    // IMPORTANT: Invalidate size to ensure map renders correctly within modal
    useEffect(() => {
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 250);
        return () => clearTimeout(timer);
    }, [map]);

    // Fly to center when it changes
    useEffect(() => {
        map.flyTo(center, zoom, { animate: true });
    }, [center, zoom, map]);
    
    return null;
};


// --- Main Modal Component ---
interface SlotEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (slot: ParkingSlot) => void;
  slot: Partial<ParkingSlot> | null;
  userLocation: [number, number] | null;
}

const SlotEditModal: React.FC<SlotEditModalProps> = ({ isOpen, onClose, onSave, slot, userLocation }) => {
    const [formData, setFormData] = useState<Partial<ParkingSlot>>({});
    const [isMapMode, setIsMapMode] = useState(false);
    const [mapCenter, setMapCenter] = useState<[number, number]>(userLocation || chittagongCoords);
    const [mapZoom, setMapZoom] = useState(13);
    
    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [searchResults, setSearchResults] = useState<GeocodedLocation[]>([]);

    const modalRef = useRef<HTMLDivElement>(null);
    const prevIsOpen = useRef(isOpen);
    const prevSlotId = useRef(slot?.id);

    useEffect(() => {
        // Initialize form data only when modal opens or the slot being edited changes
        if (isOpen && (!prevIsOpen.current || slot?.id !== prevSlotId.current)) {
            const defaultLocation: [number, number] = userLocation || chittagongCoords;
            const initialData = slot || {};
            const newFormData = {
                name: '',
                address: '',
                type: ParkingSlotType.CAR,
                status: ParkingSlotStatus.AVAILABLE,
                pricePerHour: 50,
                features: [],
                ...initialData
            };
            setFormData(newFormData);
            
            const newCenter = newFormData.location || defaultLocation;
            setMapCenter(newCenter);
            setMapZoom(newFormData.location ? 16 : 13);
            setIsMapMode(false); // Ensure map starts closed
        }

        prevIsOpen.current = isOpen;
        prevSlotId.current = slot?.id;

        if (!isOpen) {
            setIsMapMode(false);
            setSearchQuery('');
            setSearchResults([]);
        }
    }, [isOpen, slot, userLocation]);
    
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
        if (isOpen) document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);
    
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.trim().length > 2) {
                setIsSearching(true);
                try {
                    const results = await geocodeWithRateLimit(searchQuery);
                    setSearchResults(results);
                } catch (error) {
                    console.error("Search failed", error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
            }
        }, 800);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const handleMapClick = async (latlng: L.LatLng) => {
        const newLocation: [number, number] = [latlng.lat, latlng.lng];
        setFormData(prev => ({ ...prev, location: newLocation }));
        
        // Reverse geocode to update address automatically
        try {
             const results = await geocodeWithRateLimit(`${latlng.lat}, ${latlng.lng}`);
             if (results.length > 0) {
                 setFormData(prev => ({ ...prev, address: results[0].displayName }));
             }
        } catch (e) {
             console.error("Failed to reverse geocode on drag", e);
        }
    };
    
    const handleSearchResultClick = (result: GeocodedLocation) => {
        const newLocation: [number, number] = [result.lat, result.lon];
        setMapCenter(newLocation);
        setMapZoom(17);
        setFormData(prev => ({ ...prev, location: newLocation, address: result.displayName })); // Auto-fill address
        setSearchResults([]);
        setSearchQuery('');
    };

    const handleLocateMe = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            return;
        }
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                const newLoc: [number, number] = [latitude, longitude];
                setMapCenter(newLoc);
                setMapZoom(17);
                setFormData(prev => ({ ...prev, location: newLoc }));
                setIsLocating(false);

                // Reverse geocode to autofill address
                try {
                   const results = await geocodeWithRateLimit(`${latitude}, ${longitude}`);
                   if (results.length > 0) {
                       setFormData(prev => ({ ...prev, address: results[0].displayName }));
                   }
                } catch(e) {
                    console.error("Failed to reverse geocode", e);
                }
            },
            (error) => {
                console.error("Location error", error);
                setIsLocating(false);
                alert("Unable to retrieve your location.");
            }
        );
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'pricePerHour' ? parseFloat(value) || 0 : value }));
    };

    const handleFeatureChange = (feature: string) => {
        setFormData(prev => {
            const currentFeatures = prev.features || [];
            const newFeatures = currentFeatures.includes(feature)
                ? currentFeatures.filter(f => f !== feature)
                : [...currentFeatures, feature];
            return { ...prev, features: newFeatures };
        });
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.address || !formData.location) {
            alert('Please fill in name, address, and set a location on the map.');
            return;
        }
        const finalSlot: ParkingSlot = {
            id: formData.id || slot?.id || `slot-${Date.now()}`,
            name: formData.name,
            location: formData.location,
            address: formData.address,
            type: formData.type || ParkingSlotType.CAR,
            status: formData.status || ParkingSlotStatus.AVAILABLE,
            pricePerHour: formData.pricePerHour || 0,
            features: formData.features || []
        };
        onSave(finalSlot);
    };

    const handleOpenMap = () => {
        setIsMapMode(true);
        // If opening map and no location is set, set default immediately so marker is visible
        if (!formData.location) {
            const defaultLoc: [number, number] = userLocation || chittagongCoords;
            setFormData(prev => ({ ...prev, location: defaultLoc }));
            setMapCenter(defaultLoc);
            setMapZoom(16);
            
            // Attempt to pre-fill address for the default location
            geocodeWithRateLimit(`${defaultLoc[0]}, ${defaultLoc[1]}`).then(results => {
                 if (results.length > 0 && !formData.address) {
                      setFormData(prev => ({ ...prev, address: results[0].displayName }));
                 }
            });
        } else {
             setMapCenter(formData.location);
             setMapZoom(17);
        }
    };

    const inputClasses = "block w-full p-2.5 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:border-primary focus:ring-primary";

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[1200] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="slot-modal-title" ref={modalRef}>
            <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-slideUp">
                <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white" id="slot-modal-title">{formData.id ? 'Edit Slot' : 'Add New Slot'}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Close modal"><X size={20} /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300" htmlFor="slot-name">Slot Name *</label>
                            <input type="text" id="slot-name" name="name" value={formData.name || ''} onChange={handleChange} required className={inputClasses}/>
                        </div>
                            <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300" htmlFor="slot-address">Address *</label>
                            <textarea id="slot-address" name="address" value={formData.address || ''} onChange={handleChange} required className={`${inputClasses} h-20`} rows={2}></textarea>
                            <p className="text-xs text-slate-500 mt-1">Address auto-updates when moving the map marker</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300" htmlFor="slot-type">Vehicle Type *</label>
                            <select id="slot-type" name="type" value={formData.type} onChange={handleChange} className={inputClasses}>
                                {Object.values(ParkingSlotType).map(type => <option key={type} value={type}>{type}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300" htmlFor="slot-price">Price/Hour (৳) *</label>
                            <input type="number" id="slot-price" name="pricePerHour" value={formData.pricePerHour || ''} onChange={handleChange} required min="0" className={inputClasses}/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300" htmlFor="slot-status">Status *</label>
                            <select id="slot-status" name="status" value={formData.status} onChange={handleChange} className={inputClasses}>
                                {Object.values(ParkingSlotStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Location *</label>
                            
                            {isMapMode ? (
                                <div className="relative w-full h-[400px] rounded-xl overflow-hidden border-2 border-primary shadow-inner mt-2 animate-fadeIn">
                                    {/* Search Bar Overlay */}
                                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-md">
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                value={searchQuery} 
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="Search location..." 
                                                className="w-full pl-10 pr-4 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 shadow-md focus:outline-none focus:ring-2 focus:ring-primary"
                                            />
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" size={18} />}
                                        </div>
                                        {searchResults.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden max-h-60 overflow-y-auto">
                                                {searchResults.map((result, idx) => (
                                                    <button 
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => handleSearchResultClick(result)}
                                                        className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-sm text-slate-800 dark:text-slate-200 border-b dark:border-slate-700 last:border-0"
                                                    >
                                                        {result.displayName}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <MapContainer center={mapCenter} zoom={mapZoom} className="h-full w-full" zoomControl={false}>
                                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
                                            <MapEventsHandler onMapClick={handleMapClick} center={mapCenter} zoom={mapZoom} />
                                            {formData.location && <DraggableMarker position={formData.location} onDragEnd={handleMapClick} />}
                                            <ZoomControl position="bottomright" />
                                    </MapContainer>

                                    <button 
                                        type="button"
                                        onClick={handleLocateMe} 
                                        disabled={isLocating}
                                        className="absolute bottom-20 right-4 z-[1000] bg-white dark:bg-slate-800 p-3 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none"
                                        title="Locate Me"
                                    >
                                        {isLocating ? <Loader2 className="w-5 h-5 animate-spin text-primary"/> : <LocateFixed className="w-5 h-5" />}
                                    </button>

                                    <button 
                                        type="button"
                                        onClick={() => setIsMapMode(false)}
                                        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900 text-white px-6 py-2 rounded-full shadow-lg font-bold hover:bg-slate-800 transition-all border border-white/20 transform hover:scale-105"
                                    >
                                        Confirm Location
                                    </button>
                                </div>
                            ) : (
                                <div className="mt-1 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-primary/50 transition-colors text-center">
                                        <Button type="button" onClick={handleOpenMap} className="mx-auto">
                                        <MapPin className="mr-2 h-4 w-4" /> 
                                        {formData.location ? 'Adjust Location' : 'Set Location on Map'}
                                        </Button>
                                        {formData.location ? (
                                        <p className="text-sm text-green-600 dark:text-green-400 mt-3 font-medium flex items-center justify-center gap-1">
                                            <CheckCircle className="w-4 h-4" /> Location Set ({formData.location[0].toFixed(4)}, {formData.location[1].toFixed(4)})
                                        </p>
                                        ) : (
                                        <p className="text-sm text-slate-400 mt-3">Click to open map and drag marker to set location</p>
                                        )}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Features</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {allFeaturesList.map(feature => {
                                const Icon = featureIcons[feature];
                                const isChecked = formData.features?.includes(feature) ?? false;
                                return (
                                    <label key={feature} className={`flex items-center gap-2 p-2.5 rounded-lg border-2 cursor-pointer transition-all ${isChecked ? 'border-primary bg-primary/10' : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'}`}>
                                        <input type="checkbox" checked={isChecked} onChange={() => handleFeatureChange(feature)} className="h-4 w-4 rounded text-primary focus:ring-primary bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600" />
                                        {Icon && <Icon className={`w-5 h-5 ${isChecked ? 'text-primary' : 'text-slate-500'}`} />}
                                        <span className={`font-medium text-sm ${isChecked ? 'text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}>{feature}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                    <div className="pt-2 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-700 mt-4">
                        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button type="submit">{formData.id ? 'Update Slot' : 'Create Slot'}</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default SlotEditModal;
