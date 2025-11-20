
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { ParkingSlot, ParkingSlotType, ParkingSlotStatus } from '../../types';
import Button from '../common/Button';
import { X, MapPin, Search, Loader2, LocateFixed, CheckCircle, DollarSign, Plus, Minus } from 'lucide-react';
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
const MapEventsHandler: React.FC<{ onMapClick: (latlng: L.LatLng) => void, center: [number, number], zoom: number, setMap: (map: L.Map) => void }> = ({ onMapClick, center, zoom, setMap }) => {
    const map = useMap();
    
    useEffect(() => {
        setMap(map);
    }, [map, setMap]);
    
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
    const [mapCenter, setMapCenter] = useState<[number, number]>(userLocation || chittagongCoords);
    const [mapZoom, setMapZoom] = useState(13);
    const [map, setMap] = useState<L.Map | null>(null);
    
    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [searchResults, setSearchResults] = useState<GeocodedLocation[]>([]);

    const modalRef = useRef<HTMLDivElement>(null);
    const prevIsOpen = useRef(isOpen);
    const prevSlotId = useRef(slot?.id);

    useEffect(() => {
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
        }

        prevIsOpen.current = isOpen;
        prevSlotId.current = slot?.id;

        if (!isOpen) {
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
        setFormData(prev => ({ ...prev, location: newLocation, address: result.displayName })); 
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

    // Custom dark inputs style
    const inputClasses = "block w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all";
    const labelClasses = "block text-xs font-medium mb-1.5 text-slate-400 uppercase tracking-wide";

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1200] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="slot-modal-title" ref={modalRef}>
            <Card className="w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden animate-slideUp !p-0 !bg-slate-900 border border-slate-700 shadow-2xl">
                
                <div className="flex justify-between items-center p-5 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md z-10">
                    <h2 className="text-2xl font-bold text-white tracking-tight" id="slot-modal-title">
                        {formData.id ? 'Edit Slot Details' : 'Add New Slot'}
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors" aria-label="Close modal">
                        <X size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto relative">
                    {/* Map Section - Taking prominence */}
                    <div className="relative h-[400px] w-full bg-slate-800 border-b border-slate-700 group">
                        <MapContainer center={mapCenter} zoom={mapZoom} className="h-full w-full" zoomControl={false}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
                            <MapEventsHandler onMapClick={handleMapClick} center={mapCenter} zoom={mapZoom} setMap={setMap} />
                            {formData.location && <DraggableMarker position={formData.location} onDragEnd={handleMapClick} />}
                        </MapContainer>

                        {/* Floating Search Bar */}
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-md">
                            <div className="relative group-focus-within:ring-4 ring-primary/20 rounded-full transition-all">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-slate-400" />
                                </div>
                                <input 
                                    type="text" 
                                    value={searchQuery} 
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search location..." 
                                    className="w-full pl-11 pr-4 py-3.5 rounded-full bg-slate-900/90 border border-slate-600 text-white shadow-xl focus:outline-none focus:border-primary backdrop-blur-md placeholder-slate-400"
                                />
                                {isSearching && <div className="absolute inset-y-0 right-4 flex items-center"><Loader2 className="h-5 w-5 text-primary animate-spin" /></div>}
                            </div>
                            {searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto border border-slate-700">
                                    {searchResults.map((result, idx) => (
                                        <button 
                                            key={idx}
                                            type="button"
                                            onClick={() => handleSearchResultClick(result)}
                                            className="w-full text-left px-5 py-3 hover:bg-slate-800 text-sm text-slate-200 border-b border-slate-800 last:border-0 transition-colors"
                                        >
                                            {result.displayName}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Map Controls (Zoom + Locate Me) */}
                        <div className="absolute bottom-6 right-4 z-[1000] flex flex-col items-center gap-3">
                            <button 
                                type="button"
                                onClick={handleLocateMe} 
                                disabled={isLocating}
                                className="w-11 h-11 flex items-center justify-center bg-white dark:bg-slate-800 rounded-full shadow-xl border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none transform transition-transform active:scale-95"
                                title="Locate Me"
                            >
                                {isLocating ? <Loader2 className="w-5 h-5 animate-spin text-primary"/> : <LocateFixed className="w-5 h-5" />}
                            </button>
                            
                            <div className="flex flex-col bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-600 overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => map?.zoomIn()}
                                    className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors border-b border-slate-200 dark:border-slate-600 active:bg-slate-100 dark:active:bg-slate-600"
                                    title="Zoom In"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => map?.zoomOut()}
                                    className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors active:bg-slate-100 dark:active:bg-slate-600"
                                    title="Zoom Out"
                                >
                                    <Minus className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Floating Confirm Button Badge */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000]">
                            <div className="bg-slate-900/90 backdrop-blur-md text-white px-6 py-2.5 rounded-full shadow-2xl border border-slate-700 flex items-center gap-2 pointer-events-none">
                                {formData.location ? (
                                    <>
                                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                                        <span className="text-sm font-bold">Location Set</span>
                                    </>
                                ) : (
                                    <>
                                        <MapPin className="w-4 h-4 text-amber-500 animate-bounce" />
                                        <span className="text-sm font-bold">Click Map to Set Location</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Form Fields Section */}
                    <div className="p-6 space-y-6 bg-slate-900">
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Column */}
                            <div className="space-y-5">
                                <div>
                                    <label className={labelClasses} htmlFor="slot-name">Vehicle Type *</label>
                                    <select id="slot-type" name="type" value={formData.type} onChange={handleChange} className={inputClasses}>
                                        {Object.values(ParkingSlotType).map(type => <option key={type} value={type}>{type}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClasses} htmlFor="slot-status">Status *</label>
                                    <select id="slot-status" name="status" value={formData.status} onChange={handleChange} className={inputClasses}>
                                        {Object.values(ParkingSlotStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                     <label className={labelClasses} htmlFor="slot-name">Location Details *</label>
                                     <textarea id="slot-address" name="address" value={formData.address || ''} onChange={handleChange} required className={`${inputClasses} h-[120px] resize-none`} placeholder="Address auto-fills from map..." />
                                      <p className="text-[10px] text-slate-500 mt-1.5 text-right">Address auto-updates when moving the map marker</p>
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-5">
                                 <div>
                                    <label className={labelClasses} htmlFor="slot-price">Price/Hour (৳) *</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <span className="text-slate-400 font-bold">৳</span>
                                        </div>
                                        <input type="number" id="slot-price" name="pricePerHour" value={formData.pricePerHour || ''} onChange={handleChange} required min="0" className={`${inputClasses} pl-10`} placeholder="50"/>
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClasses} htmlFor="slot-name">Slot Name/ID *</label>
                                    <input type="text" id="slot-name" name="name" value={formData.name || ''} onChange={handleChange} required className={inputClasses} placeholder="e.g. A-101"/>
                                </div>
                                <div>
                                    <label className={labelClasses}>Features</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {allFeaturesList.map(feature => {
                                            const Icon = featureIcons[feature];
                                            const isChecked = formData.features?.includes(feature) ?? false;
                                            return (
                                                <label key={feature} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 group ${isChecked ? 'border-primary bg-primary/10' : 'border-slate-700 bg-slate-800 hover:border-slate-500'}`}>
                                                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${isChecked ? 'bg-primary border-primary' : 'border-slate-500 bg-transparent'}`}>
                                                        {isChecked && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                                        <input type="checkbox" checked={isChecked} onChange={() => handleFeatureChange(feature)} className="hidden" />
                                                    </div>
                                                    <span className={`text-sm font-medium ${isChecked ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>{feature}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>

                <div className="p-5 bg-slate-800/50 border-t border-slate-800 flex justify-end gap-4 backdrop-blur-sm">
                    <Button type="button" variant="secondary" onClick={onClose} className="!bg-transparent !border-slate-600 !text-slate-300 hover:!bg-slate-800">Cancel</Button>
                    <Button type="button" onClick={handleSubmit} className="px-8 shadow-lg shadow-primary/25">
                        {formData.id ? 'Update Slot' : 'Confirm Location'}
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default SlotEditModal;
