
import React, { useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { ReservationContext } from '../../contexts/ReservationContext';
import { LogContext } from '../../contexts/LogContext';
import { Edit, Trash2, Car, Bike, Truck, SlidersHorizontal, Video, Shield, Building2, KeyRound, Search, X, MapPin } from 'lucide-react';
import { ParkingSlotStatus, ParkingSlot, ParkingSlotType } from '../../types';
import SlotEditModal from '../../components/modals/SlotEditModal';
import ConfirmationModal from '../../components/modals/ConfirmationModal';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Pagination from '../../components/common/Pagination';
import { Link } from 'react-router-dom';


const ManageParkingsPage: React.FC = () => {
    const reservationContext = useContext(ReservationContext);
    const logContext = useContext(LogContext);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedStatuses, setSelectedStatuses] = useState<ParkingSlotStatus[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<ParkingSlotType[]>([]);
    const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<Partial<ParkingSlot> | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [slotToDelete, setSlotToDelete] = useState<string | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    if (!reservationContext) {
        return <div>Loading...</div>;
    }

    const { slots, addSlot, updateSlot, deleteSlot } = reservationContext;

    useEffect(() => {
        const timerId = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
        return () => clearTimeout(timerId);
    }, [searchQuery]);

    const availableFeatures = useMemo(() => [...new Set(slots.flatMap(s => s.features || []))], [slots]);

    const filteredSlots = useMemo(() => {
        const queryLower = debouncedSearchQuery.toLowerCase();
        return slots.filter(slot =>
            (slot.name.toLowerCase().includes(queryLower) || slot.address?.toLowerCase().includes(queryLower)) &&
            (selectedStatuses.length === 0 || selectedStatuses.includes(slot.status)) &&
            (selectedTypes.length === 0 || selectedTypes.includes(slot.type)) &&
            (selectedFeatures.length === 0 || selectedFeatures.every(f => slot.features?.includes(f)))
        );
    }, [slots, debouncedSearchQuery, selectedStatuses, selectedTypes, selectedFeatures]);

    const paginatedSlots = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredSlots.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredSlots, currentPage]);

    useEffect(() => { setCurrentPage(1); }, [selectedStatuses, selectedTypes, selectedFeatures, searchQuery]);

    const handleEditSlot = useCallback((slot: ParkingSlot) => { setSelectedSlot(slot); setIsModalOpen(true); }, []);

    const handleSaveSlot = useCallback(async (slot: ParkingSlot) => {
        try {
            const exists = slots.some(s => s.id === slot.id);
            if (exists) {
                await updateSlot(slot);
                logContext?.addLog('SLOT_UPDATE', `Updated parking slot ${slot.name}`);
            } else {
                await addSlot(slot);
                logContext?.addLog('SLOT_CREATED', `Created new parking slot ${slot.name}`);
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error('Failed to save parking slot:', error);
            alert('Failed to save parking slot. Please check your permissions and try again.');
        }
    }, [slots, updateSlot, addSlot, logContext]);

    const handleDeleteSlot = useCallback((slotId: string) => { setSlotToDelete(slotId); setIsConfirmModalOpen(true); }, []);

    const confirmDelete = useCallback(() => {
        if (slotToDelete) {
            const slotName = slots.find(s => s.id === slotToDelete)?.name;
            deleteSlot(slotToDelete);
            logContext?.addLog('SLOT_DELETED', `Deleted parking slot ${slotName || slotToDelete}`);
            setSlotToDelete(null);
        }
        setIsConfirmModalOpen(false);
    }, [slotToDelete, deleteSlot, logContext, slots]);

    const toggleFilter = <T,>(setter: React.Dispatch<React.SetStateAction<T[]>>, value: T) => { setter(prev => prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]); };

    const getStatusBadge = (status: ParkingSlotStatus) => {
        switch (status) {
            case ParkingSlotStatus.AVAILABLE: return 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300';
            case ParkingSlotStatus.RESERVED: return 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300';
            case ParkingSlotStatus.OCCUPIED: return 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300';
            default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
        }
    };

    const featureIcons: { [key: string]: React.ReactElement } = { 'CCTV': <Video className="w-4 h-4" />, 'Guarded': <Shield className="w-4 h-4" />, 'Multi-storey parking': <Building2 className="w-4 h-4" />, 'Valet parking': <KeyRound className="w-4 h-4" /> };
    const FilterButton: React.FC<{ label: string; icon?: React.ReactElement; isSelected: boolean; onClick: () => void; }> = ({ label, icon, isSelected, onClick }) => (<button onClick={onClick} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-colors border shadow-sm active:scale-95 ${isSelected ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}> {icon} {label} </button>);

    return (
        <div className="flex flex-col h-full animate-fadeIn">
            <div className="p-4 sm:p-6 lg:p-8 pb-4 shrink-0 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Manage Parking Slots</h1>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search slots by name or address..."
                            className="w-full pl-12 pr-12 py-3 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:outline-none focus:border-primary focus:ring-0 transition-all shadow-sm"
                        />
                        {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><X size={16} /></button>}
                    </div>
                    <Button variant="secondary" onClick={() => setShowFilters(!showFilters)} className={`!py-3 !px-6 rounded-xl font-semibold border-2 ${showFilters ? 'border-primary text-primary bg-primary/5' : 'border-slate-200 dark:border-slate-700'}`}>
                        <SlidersHorizontal className="w-4 h-4 mr-2" /> Filters
                    </Button>
                </div>

                {showFilters && (
                    <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-6 animate-slideUp shadow-sm">
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 tracking-wider">Status</h3>
                            <div className="flex flex-wrap gap-2">{Object.values(ParkingSlotStatus).map(status => (<FilterButton key={status} label={status} isSelected={selectedStatuses.includes(status)} onClick={() => toggleFilter(setSelectedStatuses, status)} />))}</div>
                        </div>
                        <div className="border-t border-slate-100 dark:border-slate-700/50"></div>
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 tracking-wider">Vehicle Type</h3>
                            <div className="flex flex-wrap gap-2">{Object.values(ParkingSlotType).map(type => (<FilterButton key={type} label={type} icon={{ 'Car': <Car size={16} />, 'Bike': <Bike size={16} />, 'SUV': <Car size={16} />, 'Minivan': <Truck size={16} />, 'Truck': <Truck size={16} /> }[type]} isSelected={selectedTypes.includes(type)} onClick={() => toggleFilter(setSelectedTypes, type)} />))}</div>
                        </div>
                        {availableFeatures.length > 0 && <div className="border-t border-slate-100 dark:border-slate-700/50"></div>}
                        {availableFeatures.length > 0 && (<div><h3 className="text-xs font-bold text-slate-400 uppercase mb-3 tracking-wider">Amenities</h3><div className="flex flex-wrap gap-2">{availableFeatures.map(feature => (featureIcons[feature] && <FilterButton key={feature} label={feature} icon={featureIcons[feature]} isSelected={selectedFeatures.includes(feature)} onClick={() => toggleFilter(setSelectedFeatures, feature)} />))}</div></div>)}
                    </div>
                )}
            </div>

            <div className="px-4 sm:px-6 lg:px-8 pb-8 flex-1 overflow-y-auto">
                <Card className="border border-slate-200 dark:border-slate-700 shadow-lg dark:shadow-none overflow-hidden p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="p-5 font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Slot Name</th>
                                    <th className="p-5 font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Address</th>
                                    <th className="p-5 font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="p-5 font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
                                    <th className="p-5 font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Price/hr</th>
                                    <th className="p-5 font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {paginatedSlots.map(slot => (
                                    <tr key={slot.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                        <td className="p-5 font-bold text-slate-800 dark:text-slate-100">{slot.name}</td>
                                        <td className="p-5 text-sm text-slate-500 dark:text-slate-400 max-w-[200px] truncate" title={slot.address}>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                                <span className="truncate">{slot.address}</span>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-full border ${getStatusBadge(slot.status)}`}>
                                                {slot.status}
                                            </span>
                                        </td>
                                        <td className="p-5 text-sm font-medium text-slate-600 dark:text-slate-300">{slot.type}</td>
                                        <td className="p-5 font-bold text-emerald-600 dark:text-emerald-400">৳{slot.pricePerHour}</td>
                                        <td className="p-5">
                                            <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEditSlot(slot)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 rounded-lg transition-colors" aria-label={`Edit slot ${slot.name}`}><Edit className="w-4 h-4" /></button>
                                                <button onClick={() => handleDeleteSlot(slot.id)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-lg transition-colors" aria-label={`Delete slot ${slot.name}`}><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredSlots.length === 0 && (
                            <div className="p-12 text-center flex flex-col items-center justify-center">
                                <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-4">
                                    <Search className="w-8 h-8 text-slate-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">No slots found</h3>
                                <p className="text-slate-500 dark:text-slate-400">Try adjusting your search or filters.</p>
                            </div>
                        )}
                    </div>
                    <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                        <Pagination currentPage={currentPage} itemsPerPage={ITEMS_PER_PAGE} totalItems={filteredSlots.length} onPageChange={(page) => setCurrentPage(page)} />
                    </div>
                </Card>
            </div>

            <SlotEditModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveSlot} slot={selectedSlot} userLocation={null} />
            <ConfirmationModal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} onConfirm={confirmDelete} title="Delete Parking Slot" message="Are you sure? This action cannot be undone." confirmButtonText="Delete" />
        </div>
    );
};

export default ManageParkingsPage;
