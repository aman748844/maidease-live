import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [role, setRole] = useState('customer'); // 'customer' | 'partner'
  const [maids, setMaids] = useState([]);
  const [availableCount, setAvailableCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals & Active Selectors
  const [selectedMaidForCall, setSelectedMaidForCall] = useState(null);
  const [selectedMaidForBooking, setSelectedMaidForBooking] = useState(null);
  const [selectedMaidForProfile, setSelectedMaidForProfile] = useState(null);
  const [isPriceCalculatorOpen, setIsPriceCalculatorOpen] = useState(false);
  const [isBookingTrackerOpen, setIsBookingTrackerOpen] = useState(false);
  const [activePartnerMaidId, setActivePartnerMaidId] = useState('maid_1'); // Sunita Devi

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    service: 'all',
    status: 'all', // 'all', 'available', 'busy', 'offline'
    maxDistance: 5,
    maxPrice: 300
  });

  // Bookings & Calls
  const [bookings, setBookings] = useState([]);
  const [callLogs, setCallLogs] = useState([]);

  // Toast notifications
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Load maids
  const loadMaids = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getMaids(filters);
      if (data.success) {
        setMaids(data.maids);
        setAvailableCount(data.availableCount);
      }
    } catch (err) {
      console.error(err);
      setError('Could not connect to live helper network.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Load bookings
  const loadBookings = useCallback(async () => {
    try {
      const data = await api.getBookings();
      if (data.success) {
        setBookings(data.bookings);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Initial & Auto refresh polling
  useEffect(() => {
    loadMaids();
    loadBookings();
    const interval = setInterval(() => {
      loadMaids();
      loadBookings();
    }, 8000); // 8-second live sync
    return () => clearInterval(interval);
  }, [loadMaids, loadBookings]);

  // Handle maid status toggle (from partner mode)
  const toggleMaidStatus = async (maidId, newStatus, busyUntil = null, etaMins = 20) => {
    try {
      const res = await api.updateMaidStatus(maidId, { status: newStatus, busyUntil, etaMins });
      if (res.success) {
        showToast(`Status updated to ${newStatus.toUpperCase()}!`, 'success');
        loadMaids();
      }
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  // Handle new booking creation
  const handleCreateBooking = async (bookingPayload) => {
    try {
      const res = await api.createBooking(bookingPayload);
      if (res.success) {
        showToast('🎉 Maid Booked! Helper is notified and preparing to arrive.', 'success');
        loadBookings();
        loadMaids();
        setIsBookingTrackerOpen(true);
        setSelectedMaidForBooking(null);
        return res.booking;
      }
    } catch (err) {
      showToast('Booking failed. Please try again.', 'error');
      throw err;
    }
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        maids,
        availableCount,
        loading,
        error,
        filters,
        setFilters,
        loadMaids,
        bookings,
        loadBookings,
        callLogs,
        setCallLogs,
        selectedMaidForCall,
        setSelectedMaidForCall,
        selectedMaidForBooking,
        setSelectedMaidForBooking,
        selectedMaidForProfile,
        setSelectedMaidForProfile,
        isPriceCalculatorOpen,
        setIsPriceCalculatorOpen,
        isBookingTrackerOpen,
        setIsBookingTrackerOpen,
        activePartnerMaidId,
        setActivePartnerMaidId,
        toggleMaidStatus,
        handleCreateBooking,
        toast,
        showToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
