import React, { useRef, useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  snapPoints?: number[]; // Heights in vh: [30, 60, 90]
  initialSnap?: number; // Index of snapPoints
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  children,
  snapPoints = [30, 60, 90],
  initialSnap = 0,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [currentSnap, setCurrentSnap] = useState(initialSnap);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const startHeight = useRef(0);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setCurrentSnap(initialSnap);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialSnap]);
  
  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  const onDragStart = (clientY: number) => {
    setIsDragging(true);
    startY.current = clientY;
    if (sheetRef.current) {
        startHeight.current = sheetRef.current.offsetHeight;
        sheetRef.current.style.transition = 'none';
    }
    if(contentRef.current) contentRef.current.style.overflow = 'hidden';
  };

  const onDragMove = (clientY: number) => {
    if (!isDragging || !sheetRef.current) return;
    const deltaY = startY.current - clientY;
    const newHeight = startHeight.current + deltaY;
    sheetRef.current.style.height = `${newHeight}px`;
  };

  const onDragEnd = (clientY: number) => {
    if (!isDragging || !sheetRef.current) return;
    setIsDragging(false);

    sheetRef.current.style.transition = '';
    if(contentRef.current) contentRef.current.style.overflow = '';

    const currentHeight = sheetRef.current.offsetHeight;
    const windowHeight = window.innerHeight;
    
    const closestSnapIndex = snapPoints.reduce((closestIndex, snapPoint, index) => {
      const snapHeight = (snapPoint / 100) * windowHeight;
      const closestSnapHeight = (snapPoints[closestIndex] / 100) * windowHeight;
      return Math.abs(snapHeight - currentHeight) < Math.abs(closestSnapHeight - currentHeight) ? index : closestIndex;
    }, currentSnap);

    const deltaY = startY.current - clientY;
    const threshold = 50;
    
    if (deltaY < -threshold) { // Swiped down
        if (currentSnap > 0) {
            setCurrentSnap(currentSnap - 1);
            triggerHaptic();
        } else {
            onClose();
        }
    } else if (deltaY > threshold && currentSnap < snapPoints.length - 1) { // Swiped up
        setCurrentSnap(currentSnap + 1);
        triggerHaptic();
    } else {
        setCurrentSnap(closestSnapIndex);
        if (closestSnapIndex !== currentSnap) triggerHaptic();
    }

    sheetRef.current.style.height = '';
  };
  
  // Mouse Events
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => onDragMove(e.clientY);
    const handleMouseUp = (e: MouseEvent) => onDragEnd(e.clientY);
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const height = isOpen ? `${snapPoints[currentSnap]}vh` : '0';

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 z-[1001] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <div
        ref={sheetRef}
        className="fixed left-0 right-0 bottom-0 bg-white dark:bg-slate-800 rounded-t-3xl shadow-2xl z-[1002] flex flex-col"
        style={{ 
            height: height, 
            transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
            pointerEvents: isOpen ? 'auto' : 'none',
            transition: 'height 0.35s cubic-bezier(0.32, 0.72, 0, 1), transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)'
        }}
      >
        <div
          style={{ touchAction: 'none' }}
          className="sticky top-0 bg-white dark:bg-slate-800 rounded-t-3xl z-10 cursor-grab active:cursor-grabbing"
          onMouseDown={(e) => onDragStart(e.clientY)}
          onTouchStart={(e) => onDragStart(e.touches[0].clientY)}
          onTouchMove={(e) => onDragMove(e.touches[0].clientY)}
          onTouchEnd={(e) => onDragEnd(e.changedTouches[0].clientY)}
        >
          <div className="w-full flex justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full bottom-sheet-handle" />
          </div>
        </div>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors z-20"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        <div ref={contentRef} className="overflow-y-auto flex-1 px-4 pb-4" style={{ minHeight: 0 }}>
          {children}
        </div>
      </div>
    </>
  );
};
export default BottomSheet;