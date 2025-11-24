
import React, { useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, useMap, Marker, Popup, useMapEvents, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import { ReservationContext } from '../../contexts/ReservationContext';
import { AuthContext } from '../../contexts/AuthContext';
import { LogContext } from '../../contexts/LogContext';
import FullPageLoader from '../../components/common/FullPageLoader';
import { ParkingSlot, ParkingSlotStatus, ParkingSlotType, UserRole } from '../../types';
import { Search, LocateFixed, Car, SlidersHorizontal, Loader2, MapPin, X, Bike, Truck, Video, Shield, Building2, KeyRound, Sparkles, Star, Check, Navigation, ArrowRight, Plus, Edit, Trash2, AlertTriangle, Info, CircleDollarSign, CalendarClock, History, Minus, Clock } from 'lucide-react';
import Button from '../../components/common/Button';
import { getVehicleMarkerIcon, getHighlightIcon, searchedLocationIcon, userLocationIcon } from '../../utils/mapHelpers';
import { geocodeWithRateLimit } from '../../utils/geocoding';
import { formatDistance } from '../../utils/formatters';
import { useLocation, useNavigate } from 'react-router-dom';
import { getUserParkingHistory, UserParkingHistory, getGeneralTip } from '../../utils/recommendations';
import { BottomSheet } from '../../components/common/BottomSheet';
import SlotEditModal from '../../components/modals/SlotEditModal';
import ConfirmationModal from '../../components/modals/ConfirmationModal';

// ========================================


// ========================================


// --- Type Definitions ---
interface LocationSuggestionData {
    name: string;
    displayName?: string;
    location: [number, number];
}

type SearchSuggestion =
    | { type: 'slot'; data: ParkingSlot; distance?: number }
    | { type: 'feature'; data: string; distance?: undefined }
    | { type: 'location'; data: LocationSuggestionData; distance?: number }
    | { type: 'history'; data: string; distance?: undefined };

// --- Helper Functions & Components ---
const getDistance = (from: [number, number], to: [number, number]): number => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (to[0] - from[0]) * Math.PI / 180;
    const dLon = (to[1] - from[1]) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(from[0] * Math.PI / 180) * Math.cos(to[0] * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000; // Distance in meters
};

const HighlightedText = ({ text, highlight, className = "" }: { text: string, highlight: string, className?: string }) => {
    if (!highlight.trim()) return <span className={className}>{text}</span>;
    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
        <span className={className}>
            {parts.map((part, i) =>
                regex.test(part) ? <span key={i} className="text-primary font-extrabold">{part}</span> : <span key={i}>{part}</span>
            )}
        </span>
    );
};

// Extracted FilterChip to prevent re-renders/focus loss
const FilterChip = React.memo(({ label, isActive, onClick, icon }: { label: string, isActive: boolean, onClick: () => void, icon?: React.ReactNode }) => (
    <button
        type="button"
        onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClick();
        }}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all border shadow-sm active:scale-95 ${isActive ? 'bg-primary text-white border-primary shadow-primary/30 transform scale-105' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'}`}
    >
        {icon}
        {label}
        {isActive && <Check size={14} className="ml-1" />}
    </button>
));

const ParkingMarkers: React.FC<{ slots: ParkingSlot[], onMarkerClick: (slot: ParkingSlot) => void }> = ({ slots, onMarkerClick }) => {
    const map = useMap();
    const markerClusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);

    useEffect(() => {
        if (!map || slots.length === 0) return;

        // Remove existing cluster group if it exists
        if (markerClusterGroupRef.current) {
            map.removeLayer(markerClusterGroupRef.current);
            markerClusterGroupRef.current = null;
        }

        const iconCreateFunction = (cluster: L.MarkerClusterGroup.MarkerCluster) => {
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
            animate: true
        });

        const markers = slots.map(slot => {
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
    }, [map, slots]);

    return null;
};

const MapInstanceProvider: React.FC<{ setMap: (map: L.Map) => void, onMoveStart: () => void }> = ({ setMap, onMoveStart }) => {
    const map = useMap();
    useEffect(() => { setMap(map); }, [map]);
    useMapEvents({
        dragstart: onMoveStart,
    });
    return null;
};

const MapEventsHandler: React.FC<{ onMapClick: (latlng: L.LatLng) => void }> = ({ onMapClick }) => {
    useMapEvents({
        click(e) {
            const target = e.originalEvent.target as HTMLElement;
            if (target.closest('.leaflet-marker-icon') ||
                target.closest('.leaflet-popup-content-wrapper') ||
                target.closest('.leaflet-control-container') ||
                target.closest('button') ||
                target.closest('.map-controls-container') ||
                target.closest('.bottom-sheet-container')) {
                return;
            }
            onMapClick(e.latlng);
        },
    });
    return null;
};

const MapPage: React.FC = () => {
    const reservationContext = useContext(ReservationContext);
    const authContext = useContext(AuthContext);
    const logContext = useContext(LogContext);

    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [accuracy, setAccuracy] = useState<number | null>(null);
    const [userAddress, setUserAddress] = useState<string | null>(null);

    const [isLocating, setIsLocating] = useState(false);
    const [isFollowingUser, setIsFollowingUser] = useState(false);
    const [geolocationError, setGeolocationError] = useState<string | null>(null);
    const watchIdRef = useRef<number | null>(null);
    const lastUserLocation = useRef<[number, number] | null>(null);
    const userLocationRef = useRef<[number, number] | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null);
    const [selectedStatuses, setSelectedStatuses] = useState<ParkingSlotStatus[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<ParkingSlotType[]>([]);
    const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

    // Search Logic States
    const [rawSuggestions, setRawSuggestions] = useState<SearchSuggestion[]>([]);
    const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
    const [isSuggestionsVisible, setIsSuggestionsVisible] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [geocodingError, setGeocodingError] = useState(false);

    const [showFilters, setShowFilters] = useState(false);
    const [searchedLocation, setSearchedLocation] = useState<L.LatLng | null>(null);
    const [searchHistory, setSearchHistory] = useState<string[]>([]);
    const [map, setMap] = useState<L.Map | null>(null);

    const [isSlotEditModalOpen, setIsSlotEditModalOpen] = useState(false);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [slotToEdit, setSlotToEdit] = useState<ParkingSlot | null>(null);
    const [isAddMode, setIsAddMode] = useState(false);

    const searchContainerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const chittagongCoords: [number, number] = [22.3569, 91.8339];
    const defaultZoom = 15;

    const location = useLocation();
    const navigate = useNavigate();

    const [quickDuration, setQuickDuration] = useState<number | null>(null);
    const [userPattern, setUserPattern] = useState<UserParkingHistory | null>(null);
    const [showSuggestion, setShowSuggestion] = useState(true);
    const [isRecommendationsEnabled, setIsRecommendationsEnabled] = useState(true);

    if (!reservationContext || !authContext || !authContext.user) {
        return <FullPageLoader />;
    }
    const { slots, loading, getReservationsForCurrentUser, addSlot, updateSlot, deleteSlot } = reservationContext;

    // 🔍 DEBUG: Log slots data
    useEffect(() => {
        console.log('📍 MapPage: Slots updated', {
            count: slots.length,
            loading,
            sample: slots[0],
            hasLocation: slots[0]?.location
        });
    }, [slots, loading]);

    const { user } = authContext;
    const allUserReservations = getReservationsForCurrentUser();

    const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;

    const handleCloseInfoCard = useCallback(() => {
        setSelectedSlot(null);
    }, []);

    const handleMapClick = useCallback((latlng: L.LatLng) => {
        if (isAddMode) {
            setSlotToEdit({ location: [latlng.lat, latlng.lng] } as any);
            setIsSlotEditModalOpen(true);
            setIsAddMode(false);
        } else {
            handleCloseInfoCard();
        }
    }, [isAddMode, handleCloseInfoCard]);

    const handleQuickReserve = (slot: ParkingSlot, durationHours: number) => {
        const now = new Date();
        const startTime = new Date(now);
        const endTime = new Date(now.getTime() + durationHours * 60 * 60 * 1000);

        navigate('/payment', {
            state: {
                slot,
                duration: durationHours,
                totalCost: durationHours * slot.pricePerHour,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                fromMap: true,
            }
        });
    };

    const filteredSlots = useMemo(() => {
        const filtered = slots.filter(slot =>
            (selectedStatuses.length === 0 || selectedStatuses.includes(slot.status)) &&
            (selectedTypes.length === 0 || selectedTypes.includes(slot.type)) &&
            (selectedFeatures.length === 0 || selectedFeatures.every(f => slot.features?.includes(f)))
        );

        // 🔍 DEBUG: Log filtering results
        console.log('🎯 MapPage: Filtered slots', {
            total: slots.length,
            filtered: filtered.length,
            filters: { selectedStatuses, selectedTypes, selectedFeatures }
        });

        return filtered;
    }, [slots, selectedStatuses, selectedTypes, selectedFeatures]);

    const availableFeatures = useMemo(() => {
        return [...new Set(slots.flatMap(s => s.features || []))];
    }, [slots]);

    const reverseGeocode = useCallback(async (lat: number, lon: number) => {
        try {
            const results = await geocodeWithRateLimit(`${lat}, ${lon}`);
            setUserAddress(results[0]?.displayName?.split(',').slice(0, 2).join(',') || 'Unknown Location');
        } catch (error) { console.error(error); setUserAddress('Could not fetch address'); }
    }, []);

    const handleMarkerClick = useCallback((slot: ParkingSlot) => {
        setSelectedSlot(slot);

        if (map) {
            const targetZoom = Math.max(map.getZoom(), 17);
            const latLng = L.latLng(slot.location);

            const mapContainer = map.getContainer();
            const shiftY = mapContainer.clientHeight * 0.15;

            const point = map.project(latLng, targetZoom);
            const targetPoint = L.point(point.x, point.y + shiftY);
            const targetCenter = map.unproject(targetPoint, targetZoom);

            map.flyTo(targetCenter, targetZoom, {
                animate: true,
                duration: 0.8,
                easeLinearity: 0.25
            });
        }
    }, [map]);

    useEffect(() => {
        const pattern = getUserParkingHistory(allUserReservations);
        setUserPattern(pattern);
    }, [allUserReservations]);

    useEffect(() => {
        if (location.state?.slotId) {
            const slotToSelect = slots.find(s => s.id === location.state.slotId);
            if (slotToSelect) {
                setTimeout(() => {
                    handleMarkerClick(slotToSelect);
                }, 500);
            }
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, slots, navigate, handleMarkerClick]);

    useEffect(() => {
        if (geolocationError) {
            const timer = setTimeout(() => setGeolocationError(null), 8000);
            return () => clearTimeout(timer);
        }
    }, [geolocationError]);

    const handleLocateClick = useCallback(() => {
        if (userLocation) {
            if (isFollowingUser) {
                map?.flyTo(userLocation, 18, { animate: true });
            } else {
                setIsFollowingUser(true);
                map?.flyTo(userLocation, 17, { animate: true });
            }
            return;
        }

        if (!navigator.geolocation) {
            setGeolocationError("Geolocation is not supported by your browser.");
            return;
        }

        setIsLocating(true);
        setGeolocationError(null);

        if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);

        const success = (position: GeolocationPosition) => {
            const newLoc: [number, number] = [position.coords.latitude, position.coords.longitude];
            setUserLocation(newLoc);
            // Update ref for search effect
            userLocationRef.current = newLoc;

            setAccuracy(position.coords.accuracy);
            setIsLocating(false);
            setIsFollowingUser(true);
            if (map) map.flyTo(newLoc, 17, { animate: true });
            lastUserLocation.current = newLoc;
            reverseGeocode(newLoc[0], newLoc[1]);
        };

        const error = (err: GeolocationPositionError) => {
            setIsLocating(false);
            setIsFollowingUser(false);
            let message = "Could not get location.";
            switch (err.code) {
                case err.PERMISSION_DENIED: message = "Location access denied."; break;
                case err.POSITION_UNAVAILABLE: message = "Location unavailable."; break;
                case err.TIMEOUT: message = "Location request timed out."; break;
                default: message = err.message || "Error getting location.";
            }
            setGeolocationError(message);
        };

        watchIdRef.current = navigator.geolocation.watchPosition(success, error, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });

    }, [map, reverseGeocode, userLocation, isFollowingUser]);

    useEffect(() => {
        if (isFollowingUser && userLocation && map) {
            map.panTo(userLocation, { animate: true, duration: 1 });
        }
    }, [userLocation, isFollowingUser, map]);

    useEffect(() => {
        return () => {
            if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
        };
    }, []);

    useEffect(() => {
        const loadedHistory = localStorage.getItem('park-eazy-search-history');
        if (loadedHistory) setSearchHistory(JSON.parse(loadedHistory));
    }, []);

    useEffect(() => {
        const timerId = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
        return () => clearTimeout(timerId);
    }, [searchQuery]);

    // --- Search Effect ---
    useEffect(() => {
        const fetchSearchResults = async () => {
            if (!debouncedSearchQuery.trim()) {
                setRawSuggestions([]);
                setIsSuggestionsVisible(false);
                return;
            }

            setIsSearching(true);
            setGeocodingError(false);
            setIsSuggestionsVisible(true);

            try {
                const queryLower = debouncedSearchQuery.toLowerCase();

                const slotSuggestions: SearchSuggestion[] = slots
                    .filter(slot => slot.name.toLowerCase().includes(queryLower) || slot.address?.toLowerCase().includes(queryLower))
                    .map(slot => ({ type: 'slot' as const, data: slot }));

                const featureSuggestions: SearchSuggestion[] = availableFeatures
                    .filter(f => f.toLowerCase().includes(queryLower))
                    .map(f => ({ type: 'feature' as const, data: f }));

                let geocodedSuggestions: SearchSuggestion[] = [];
                const currentLoc = userLocationRef.current;

                try {
                    const geocoded = await geocodeWithRateLimit(debouncedSearchQuery, {
                        limit: 5, // Explicitly request only 5 results from the API
                        countryCode: 'bd',
                        viewbox: currentLoc ? [currentLoc[1] - 0.1, currentLoc[0] + 0.1, currentLoc[1] + 0.1, currentLoc[0] - 0.1,] : undefined,
                    });
                    geocodedSuggestions = geocoded.map(loc => ({
                        type: 'location' as const,
                        data: { name: loc.name, displayName: loc.displayName, location: [loc.lat, loc.lon] as [number, number], },
                    }));
                } catch (error) {
                    console.warn('Geocoding error (falling back to mock):', error);
                    setGeocodingError(true);
                    geocodedSuggestions = []; // If geocoding fails, no location suggestions
                }

                const combined: SearchSuggestion[] = [...slotSuggestions, ...geocodedSuggestions, ...featureSuggestions];
                setRawSuggestions(combined);

            } catch (err) {
                console.error("Search execution failed", err);
                setRawSuggestions([]);
            } finally {
                setIsSearching(false);
            }
        };

        fetchSearchResults();
    }, [debouncedSearchQuery, slots]);

    // --- Sort & Limit Suggestions ---
    useEffect(() => {
        if (rawSuggestions.length === 0) {
            setSuggestions([]);
            return;
        }

        const processed = rawSuggestions.map(item => {
            let dist = undefined;
            if (userLocation) {
                if (item.type === 'slot') dist = getDistance(userLocation, item.data.location);
                else if (item.type === 'location') dist = getDistance(userLocation, item.data.location);
            }
            return { ...item, distance: dist };
        });

        processed.sort((a, b) => {
            // Favorites first
            const isAFav = a.type === 'slot' && userPattern?.favoriteSlots.includes(a.data.id);
            const isBFav = b.type === 'slot' && userPattern?.favoriteSlots.includes(b.data.id);

            if (isAFav && !isBFav) return -1;
            if (!isAFav && isBFav) return 1;

            // Then by distance
            const distA = a.distance ?? Infinity;
            const distB = b.distance ?? Infinity;
            return distA - distB;
        });

        // STRICT LIMIT: Only show max 5 relevant results
        setSuggestions(processed.slice(0, 5));
    }, [rawSuggestions, userLocation, userPattern]);

    useEffect(() => {
        if (!selectedSlot) {
            setQuickDuration(null);
        }
    }, [selectedSlot]);

    const handleManualMapMove = () => {
        if (isFollowingUser) setIsFollowingUser(false);
    };

    const addToSearchHistory = (query: string) => {
        const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 5);
        setSearchHistory(newHistory);
        localStorage.setItem('park-eazy-search-history', JSON.stringify(newHistory));
    };

    const handleSuggestionClick = (item: SearchSuggestion) => {
        let queryText = '';
        if (item.type === 'location') {
            queryText = item.data.name;
            const latlng = L.latLng(item.data.location[0], item.data.location[1]);
            setSearchedLocation(latlng);
            // Ensure zoom happens after marker is set
            setTimeout(() => {
                map?.flyTo(latlng, 17, { animate: true, duration: 1.2 });
            }, 100);
        } else if (item.type === 'slot') {
            queryText = item.data.name;
            if (!filteredSlots.find(s => s.id === (item.data as ParkingSlot).id)) {
                setSelectedStatuses([]);
                setSelectedTypes([]);
                setSelectedFeatures([]);
            }
            handleMarkerClick(item.data);
        } else if (item.type === 'feature') {
            queryText = item.data;
            if (!selectedFeatures.includes(item.data)) setSelectedFeatures(p => [...p, item.data]);
            setShowFilters(true);
        } else if (item.type === 'history') {
            queryText = item.data;
            setDebouncedSearchQuery(item.data);
        }
        setSearchQuery(queryText); // Auto-fill input with selected item
        if (item.type !== 'feature') addToSearchHistory(queryText);
        setIsSuggestionsVisible(false);
        searchInputRef.current?.blur();
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (suggestions.length > 0) handleSuggestionClick(suggestions[0]);
        }
    };

    const handleClearSearch = () => {
        setSearchQuery('');
        setSuggestions([]);
        setSearchedLocation(null);
        setSelectedSlot(null);
    };

    const toggleFilter = (type: 'status' | 'type' | 'feature', value: any) => {
        if (type === 'status') setSelectedStatuses(prev => prev.includes(value) ? prev.filter(i => i !== value) : [...prev, value]);
        else if (type === 'type') setSelectedTypes(prev => prev.includes(value) ? prev.filter(i => i !== value) : [...prev, value]);
        else if (type === 'feature') setSelectedFeatures(prev => prev.includes(value) ? prev.filter(i => i !== value) : [...prev, value]);
    };

    const handleApplyFilters = () => {
        setShowFilters(false);
        if (map && filteredSlots.length > 0) {
            let slotsToFit = filteredSlots;
            if (userLocation) {
                const nearbySlots = filteredSlots.filter(slot => getDistance(userLocation, slot.location) < 5000);
                if (nearbySlots.length > 0) {
                    slotsToFit = nearbySlots;
                }
            }
            const bounds = L.latLngBounds(slotsToFit.map(s => s.location));
            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16, animate: true });
            }
        }
    };

    const handleZoomIn = () => {
        if (map) map.zoomIn();
    };

    const handleZoomOut = () => {
        if (map) map.zoomOut();
    };

    const handleAddSlot = () => { setSlotToEdit(null); setIsSlotEditModalOpen(true); };
    const handleEditSlot = (slot: ParkingSlot) => { setSlotToEdit(slot); setIsSlotEditModalOpen(true); };
    const handleDeleteSlotClick = (slot: ParkingSlot) => { setSlotToEdit(slot); setIsConfirmDeleteOpen(true); };
    const confirmDeleteSlot = () => { if (slotToEdit) { deleteSlot(slotToEdit.id); logContext?.addLog('SLOT_DELETED', `Deleted parking slot ${slotToEdit.name}`); setSelectedSlot(null); setSlotToEdit(null); } setIsConfirmDeleteOpen(false); };
    const handleSaveSlot = async (slot: ParkingSlot) => {
        try {
            const isUpdate = slots.some(s => s.id === slot.id);
            if (isUpdate) {
                await updateSlot(slot);
                logContext?.addLog('SLOT_UPDATE', `Updated parking slot ${slot.name}`);
            } else {
                await addSlot(slot);
                logContext?.addLog('SLOT_CREATED', `Created new parking slot ${slot.name}`);
            }
            setIsSlotEditModalOpen(false);
            setSlotToEdit(null);
            if (selectedSlot && selectedSlot.id === slot.id) {
                setSelectedSlot(slot);
            }
        } catch (error) {
            console.error('Failed to save parking slot:', error);
            alert('Failed to save parking slot. Please check your permissions and try again.');
        }
    };

    if (loading) return <FullPageLoader />;

    const typeIconMap: { [key: string]: React.ReactElement } = { [ParkingSlotType.CAR]: <Car className="w-5 h-5" />, [ParkingSlotType.BIKE]: <Bike className="w-5 h-5" />, [ParkingSlotType.SUV]: <Car className="w-5 h-5" />, [ParkingSlotType.TRUCK]: <Truck className="w-5 h-5" />, [ParkingSlotType.MINIVAN]: <Truck className="w-5 h-5" />, };
    const featureIconMap: { [key: string]: React.ReactElement } = { 'CCTV': <Video size={14} />, 'Guarded': <Shield size={14} />, 'Multi-storey parking': <Building2 size={14} />, 'Valet parking': <KeyRound size={14} />, };
    const getStatusBadgeClass = (status: ParkingSlotStatus) => { switch (status) { case ParkingSlotStatus.AVAILABLE: return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'; case ParkingSlotStatus.RESERVED: return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30'; case ParkingSlotStatus.OCCUPIED: return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30'; default: return 'bg-slate-100 text-slate-700 border-slate-200'; } };

    return (
        <div className="h-full w-full flex bg-slate-100 dark:bg-slate-900 relative">
            <div className="flex-1 relative h-full w-full overflow-hidden">
                {geolocationError && (
                    <div className="absolute top-28 left-1/2 -translate-x-1/2 z-[1100] w-[90%] max-w-md animate-slideUp">
                        <div className="bg-red-100 dark:bg-red-900/90 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded-xl shadow-lg flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 text-sm font-medium">{geolocationError}</div>
                            <button onClick={() => setGeolocationError(null)} className="p-1 hover:bg-red-200 dark:hover:bg-red-800 rounded-full"><X size={16} /></button>
                        </div>
                    </div>
                )}

                {isAddMode && (
                    <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[1100] animate-bounce">
                        <div className="bg-emerald-500 text-white px-4 py-2 rounded-full shadow-lg font-bold text-sm flex items-center gap-2">
                            <MapPin size={16} />
                            Click anywhere on map to add slot
                        </div>
                    </div>
                )}

                <MapContainer center={chittagongCoords} zoom={defaultZoom} maxZoom={18} className="h-full w-full focus:outline-none bg-slate-100 dark:bg-slate-900" zoomControl={false} zoomAnimation={true} markerZoomAnimation={true} scrollWheelZoom={true}>
                    <MapInstanceProvider setMap={setMap} onMoveStart={handleManualMapMove} />
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' className="dark:brightness-75 dark:contrast-125 dark:grayscale-[0.5]" />
                    <MapEventsHandler onMapClick={handleMapClick} />
                    <ParkingMarkers slots={filteredSlots} onMarkerClick={handleMarkerClick} />
                    {userLocation && <Marker position={userLocation} icon={userLocationIcon} zIndexOffset={9999}><Popup><div className="text-center font-sans"><p className="font-semibold text-blue-600">You are here</p><p className="text-xs text-slate-500 mt-1">Accurate to {accuracy?.toFixed(0)}m</p></div></Popup></Marker>}
                    {userLocation && <Circle center={userLocation} radius={20} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.15, weight: 1.5, dashArray: '5, 5', stroke: true }} />}
                    {searchedLocation && <Marker key={`search-${searchedLocation.lat}-${searchedLocation.lng}`} position={searchedLocation} icon={searchedLocationIcon()}><Popup>Searched Location</Popup></Marker>}
                    {selectedSlot && <Marker position={selectedSlot.location} icon={getHighlightIcon(selectedSlot)} zIndexOffset={1000} />}
                </MapContainer>

                <div ref={searchContainerRef} className="absolute top-4 left-1/2 -translate-x-1/2 z-[1200] w-[92%] sm:w-[95%] max-w-lg space-y-2 map-controls-container" onClick={e => e.stopPropagation()}>
                    <div className="relative flex items-center bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-2xl shadow-slate-900/10 border border-white/50 dark:border-slate-700 transition-all focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:ring-2 focus-within:ring-primary/20">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            ref={searchInputRef}
                            id="map-search"
                            type="text"
                            autoComplete="off"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setIsSuggestionsVisible(true)}
                            onKeyDown={handleSearchKeyDown}
                            placeholder="Search places, spots..."
                            className="w-full pl-12 pr-24 py-4 rounded-2xl bg-transparent border-none focus:outline-none focus:ring-0 dark:text-white text-slate-800 placeholder-slate-400 text-sm font-medium"
                        />
                        {isSearching && <Loader2 className="absolute right-24 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" size={20} />}
                        {searchQuery && !isSearching && <button onClick={handleClearSearch} className="absolute right-20 top-1/2 -translate-y-1/2 text-slate-400 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><X size={16} /></button>}
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pl-2 border-l border-slate-200 dark:border-slate-700 flex items-center gap-1">
                            {isAdmin && (
                                <button
                                    onClick={() => setIsAddMode(!isAddMode)}
                                    className={`p-2.5 rounded-xl transition-all ${isAddMode ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30 animate-pulse' : 'text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                    title={isAddMode ? "Click on map to add slot" : "Enable add slot mode"}
                                >
                                    <Plus size={18} />
                                </button>
                            )}
                            <button onClick={() => setShowFilters(!showFilters)} className={`p-2.5 rounded-xl transition-all ${showFilters ? 'bg-primary text-white shadow-md shadow-primary/30' : 'text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}><SlidersHorizontal size={18} /></button>
                        </div>
                    </div>

                    {!isAdmin && isRecommendationsEnabled && showSuggestion && !selectedSlot && !isSuggestionsVisible && (
                        <div className="absolute top-20 left-0 w-full animate-slideUp map-controls-container px-1">
                            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-xl p-4 border-l-4 border-primary relative">
                                {(() => {
                                    let suggestionContent;
                                    const hasHistory = userPattern && userPattern.favoriteSlots.length > 0;
                                    if (hasHistory) {
                                        const now = new Date();
                                        const currentDay = now.getDay();
                                        const currentHour = now.getHours();
                                        const isUsualTime = userPattern.commonDays.includes(currentDay) && userPattern.commonHours.some(h => Math.abs(h - currentHour) <= 1);

                                        if (isUsualTime) {
                                            const favSlot = slots.find(s => s.id === userPattern.favoriteSlots[0]);
                                            if (favSlot && favSlot.status === ParkingSlotStatus.AVAILABLE) {
                                                suggestionContent = (
                                                    <>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                                                            <h3 className="font-bold text-slate-900 dark:text-white">Recommended for You</h3>
                                                        </div>
                                                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">It looks like your usual time. <strong>{favSlot.name}</strong> is free!</p>
                                                        <Button size="sm" onClick={() => { handleMarkerClick(favSlot); setQuickDuration(userPattern.averageDuration); setShowSuggestion(false); }} className="w-full font-semibold shadow-lg shadow-primary/20">Quick Book ({userPattern.averageDuration}h)</Button>
                                                    </>
                                                );
                                            }
                                        }
                                    }
                                    if (!suggestionContent) {
                                        const generalTip = getGeneralTip();
                                        suggestionContent = (
                                            <>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Info className="w-5 h-5 text-blue-500" />
                                                    <h3 className="font-bold text-slate-900 dark:text-white">{generalTip.title}</h3>
                                                </div>
                                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{generalTip.message}</p>
                                            </>
                                        );
                                    }
                                    return suggestionContent;
                                })()}
                                <button onClick={() => setShowSuggestion(false)} className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"><X className="w-4 h-4" /></button>
                            </div>
                        </div>
                    )}

                    {isSuggestionsVisible && !showFilters && (
                        <div className="mt-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl max-h-[60vh] overflow-y-auto border border-slate-100 dark:border-slate-700 map-controls-container custom-scrollbar animate-fadeIn origin-top">
                            {geocodingError && (<div className="p-3 text-center text-xs font-medium bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-200">⚠️ Online search unavailable. Showing local results.</div>)}
                            {isSearching && suggestions.length === 0 && (
                                <div className="p-8 text-center animate-fadeIn">
                                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-3" />
                                    <p className="text-sm font-medium text-slate-500">Finding best spots...</p>
                                </div>
                            )}

                            {/* Only show list if not searching empty state or if we have results while searching */}
                            {suggestions.length > 0 && (
                                <ul>
                                    {suggestions.map((item) => (
                                        <li key={item.type + (item.type === 'feature' || item.type === 'history' ? item.data : item.data.name)}>
                                            <button type="button" className="w-full text-left px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-50 dark:border-slate-700/50 last:border-0 group" onClick={() => handleSuggestionClick(item)}>
                                                {item.type === 'slot' && (
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-2.5 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors"><Car size={20} className="text-primary" /></div>
                                                        <div>
                                                            <p className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                                                                <HighlightedText text={item.data.name} highlight={searchQuery} />
                                                                {userPattern?.favoriteSlots.includes(item.data.id) && <Star size={12} className="fill-amber-400 text-amber-400" />}
                                                            </p>
                                                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                                <HighlightedText text={item.data.address || ''} highlight={searchQuery} />
                                                                {item.distance && ` • ${formatDistance(item.distance)}`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                                {item.type === 'location' && (
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-xl group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors"><MapPin size={20} className="text-blue-600 dark:text-blue-400" /></div>
                                                        <div>
                                                            <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                                                                <HighlightedText text={item.data.name} highlight={searchQuery} />
                                                            </p>
                                                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                                                                <HighlightedText text={item.data.displayName || 'Location'} highlight={searchQuery} />
                                                                {item.distance && ` • ${formatDistance(item.distance)}`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                                {item.type === 'feature' && (
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-2.5 bg-slate-100 dark:bg-slate-700 rounded-xl"><SlidersHorizontal size={20} className="text-slate-500" /></div>
                                                        <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                                                            <HighlightedText text={item.data} highlight={searchQuery} />
                                                        </p>
                                                    </div>
                                                )}
                                                {item.type === 'history' && (
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-2.5 bg-slate-100 dark:bg-slate-700 rounded-xl"><History size={20} className="text-slate-500" /></div>
                                                        <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                                                            <HighlightedText text={item.data} highlight={searchQuery} />
                                                        </p>
                                                    </div>
                                                )}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {!isSearching && debouncedSearchQuery && suggestions.length === 0 && (
                                <div className="p-8 text-center animate-fadeIn">
                                    <p className="text-slate-500 dark:text-slate-400 font-medium">No results found for "{debouncedSearchQuery}"</p>
                                </div>
                            )}
                        </div>
                    )}
                    {showFilters && (
                        <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl p-6 animate-fadeIn border border-slate-100 dark:border-slate-700 map-controls-container mt-2">
                            <div className="flex justify-between items-center mb-5">
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Filters</h3>
                                <button onClick={() => { setSelectedStatuses([]); setSelectedTypes([]); setSelectedFeatures([]); }} className="text-xs font-bold text-primary hover:underline uppercase tracking-wide">Reset</button>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase mb-3 block tracking-wider">Status</label>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.values(ParkingSlotStatus).map(s => (
                                            <FilterChip key={s} label={s} isActive={selectedStatuses.includes(s)} onClick={() => toggleFilter('status', s)} />
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase mb-3 block tracking-wider">Vehicle Type</label>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.values(ParkingSlotType).map(t => (
                                            <FilterChip key={t} label={t} isActive={selectedTypes.includes(t)} onClick={() => toggleFilter('type', t)} />
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase mb-3 block tracking-wider">Features</label>
                                    <div className="flex flex-wrap gap-2">
                                        {availableFeatures.map(f => (
                                            <FilterChip key={f} label={f} icon={featureIconMap[f]} isActive={selectedFeatures.includes(f)} onClick={() => toggleFilter('feature', f)} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <Button className="w-full mt-8 rounded-xl shadow-lg shadow-primary/25 font-bold" onClick={handleApplyFilters}>Show {filteredSlots.length} Spots</Button>
                        </div>
                    )}
                    {userAddress && !geolocationError && (
                        <div className="text-center text-xs p-2 px-4 bg-slate-900/90 text-white rounded-full backdrop-blur-md w-fit mx-auto shadow-xl animate-fadeIn font-semibold flex items-center justify-center gap-2 map-controls-container border border-white/10 mt-2">
                            <MapPin size={12} className="text-primary" /> {userAddress}
                        </div>
                    )}
                </div>

                {/* Modified Map Controls Cluster - Separated and Spaced */}
                <div className="absolute bottom-28 sm:bottom-8 right-4 z-[1100] flex flex-col items-center map-controls-container" onClick={e => e.stopPropagation()}>

                    <div className="flex flex-col gap-3 mb-4">
                        {isAdmin && (
                            <button
                                onClick={handleAddSlot}
                                className="w-11 h-11 flex items-center justify-center rounded-full shadow-xl bg-primary text-white hover:bg-primary-600 transition-all hover:scale-110 active:scale-95"
                                title="Add Parking Slot"
                            >
                                <Plus className="w-6 h-6" />
                            </button>
                        )}

                        {!isAdmin && (
                            <button
                                onClick={() => {
                                    setIsRecommendationsEnabled(!isRecommendationsEnabled);
                                    if (!isRecommendationsEnabled) setShowSuggestion(true);
                                }}
                                className={`w-11 h-11 rounded-full shadow-xl transition-all duration-300 flex items-center justify-center border border-slate-200 dark:border-slate-700 hover:scale-110 active:scale-95 ${isRecommendationsEnabled ? 'bg-amber-400 text-white hover:bg-amber-500 shadow-amber-400/30' : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                                title={isRecommendationsEnabled ? "Disable Recommendations" : "Enable Recommendations"}
                            >
                                <Sparkles className="w-5 h-5" />
                            </button>
                        )}

                        <button
                            onClick={handleLocateClick}
                            disabled={isLocating}
                            className={`w-11 h-11 flex items-center justify-center rounded-full shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 border border-slate-200 dark:border-slate-700 ${isFollowingUser ? 'bg-blue-500 text-white shadow-blue-500/30' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                            title={isFollowingUser ? "Tracking Active" : "Locate Me"}
                        >
                            {isLocating ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : isFollowingUser ? <Navigation className="w-5 h-5 fill-current animate-pulse" /> : <LocateFixed className={`w-5 h-5 ${userLocation ? 'text-blue-500' : ''}`} />}
                        </button>
                    </div>

                    {/* Zoom Controls - Separated Group */}
                    <div className="flex flex-col bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <button
                            onClick={handleZoomIn}
                            className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors border-b border-slate-100 dark:border-slate-700 active:bg-slate-100 dark:active:bg-slate-600"
                            title="Zoom In"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleZoomOut}
                            className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors active:bg-slate-100 dark:active:bg-slate-600"
                            title="Zoom Out"
                        >
                            <Minus className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="bottom-sheet-container relative z-[1150]">
                    <BottomSheet isOpen={!!selectedSlot} onClose={handleCloseInfoCard} snapPoints={[45, 85]} initialSnap={0}>
                        {selectedSlot && (
                            <div className="flex flex-col h-full px-2 pb-6" onClick={e => e.stopPropagation()}>
                                <div className="flex justify-between items-start mb-3 pr-10">
                                    <div className="flex-1 pr-2">
                                        <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight">{selectedSlot.name}</h3>
                                        <div className="flex items-center gap-1.5 mt-1.5 text-slate-500 dark:text-slate-400">
                                            <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-primary" />
                                            <span className="text-sm font-medium line-clamp-1">{selectedSlot.address}</span>
                                        </div>
                                    </div>
                                    <span className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm border ${getStatusBadgeClass(selectedSlot.status)}`}>
                                        {selectedSlot.status}
                                    </span>
                                </div>

                                <div className="border-t border-slate-100 dark:border-slate-700 mb-5"></div>

                                <div className="grid grid-cols-3 gap-3 mb-5">
                                    <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-3 flex flex-col items-center justify-center border border-slate-100 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
                                        <div className="mb-1 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                                            {typeIconMap[selectedSlot.type]}
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Type</span>
                                        <span className="font-bold text-slate-800 dark:text-white text-sm mt-0.5">{selectedSlot.type}</span>
                                    </div>

                                    <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-3 flex flex-col items-center justify-center border border-slate-100 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
                                        <div className="mb-1 p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-emerald-600 dark:text-emerald-400">
                                            <CircleDollarSign size={20} />
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Price</span>
                                        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5">৳{selectedSlot.pricePerHour}/hr</span>
                                    </div>

                                    <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-3 flex flex-col items-center justify-center border border-slate-100 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
                                        <div className="mb-1 p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full text-purple-600 dark:text-purple-400">
                                            <Clock size={20} />
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Hours</span>
                                        <span className="font-bold text-slate-800 dark:text-white text-sm mt-0.5">{selectedSlot.operatingHours}</span>
                                    </div>

                                    </div>
                                </div>

                                <div className="mb-6">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Amenities</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedSlot.features && selectedSlot.features.length > 0 ? (
                                            selectedSlot.features.map(feature => (
                                                <span key={feature} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm">
                                                    {featureIconMap[feature] || <Check size={12} className="text-primary" />} {feature}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-xs text-slate-400 italic">No specific amenities listed.</span>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-auto flex gap-3">
                                    {isAdmin ? (
                                        <div className="flex w-full gap-3">
                                            <Button onClick={() => handleEditSlot(selectedSlot)} variant="secondary" className="flex-1 !py-3.5 text-sm font-bold rounded-xl"><Edit className="w-4 h-4 mr-2" /> Edit Slot</Button>
                                            <Button onClick={() => handleDeleteSlotClick(selectedSlot)} variant="danger" className="flex-1 !py-3.5 text-sm font-bold rounded-xl"><Trash2 className="w-4 h-4 mr-2" /> Delete Slot</Button>
                                        </div>
                                    ) : (
                                        selectedSlot.status === ParkingSlotStatus.AVAILABLE ? (
                                            <div className="flex w-full items-center gap-3">
                                                <button
                                                    onClick={() => navigate('/reservation-confirmation', { state: { slot: selectedSlot } })}
                                                    className="p-4 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary hover:text-primary dark:hover:border-primary dark:hover:text-primary transition-all shadow-sm group"
                                                    title="Customize Time"
                                                >
                                                    <CalendarClock className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                                </button>
                                                <Button onClick={() => handleQuickReserve(selectedSlot, 1)} className="flex-1 shadow-xl shadow-primary/25 !py-4 text-base font-bold rounded-xl" size="lg">
                                                    Reserve Now <ArrowRight className="ml-2 w-5 h-5" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button className="w-full opacity-70 cursor-not-allowed !py-4 text-sm rounded-xl font-bold" disabled variant="secondary">
                                                Currently {selectedSlot.status}
                                            </Button>
                                        )
                                    )}
                                </div>
                            </div>
                        )}
            </BottomSheet>

            <SlotEditModal isOpen={isSlotEditModalOpen} onClose={() => setIsSlotEditModalOpen(false)} onSave={handleSaveSlot} slot={slotToEdit} userLocation={userLocation} />
            <ConfirmationModal isOpen={isConfirmDeleteOpen} onClose={() => setIsConfirmDeleteOpen(false)} onConfirm={confirmDeleteSlot} title="Delete Slot" message="Are you sure you want to delete this parking slot? This action cannot be undone." confirmButtonText="Delete" confirmButtonVariant="danger" />
        </div>
    );
};

export default MapPage;
