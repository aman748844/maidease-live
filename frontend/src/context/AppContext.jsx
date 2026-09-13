import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { realtime } from '../services/realtime';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [role, setRole] = useState('customer'); // 'customer' | 'partner'
  const [selectedCity, setSelectedCity] = useState('Pune'); // 'Pune' | 'Bengaluru' | 'Mumbai'
  const [userPhoneNumber, setUserPhoneNumber] = useState(() => localStorage.getItem('user_phone_number') || '');
  const [maids, setMaids] = useState([]);
  const [availableCount, setAvailableCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  // Modals & Active Selectors
  const [selectedMaidForCall, setSelectedMaidForCall] = useState(null);
  const [selectedMaidForBooking, setSelectedMaidForBooking] = useState(null);
  const [selectedMaidForProfile, setSelectedMaidForProfile] = useState(null);
  const [isPriceCalculatorOpen, setIsPriceCalculatorOpen] = useState(false);
  const [isBookingTrackerOpen, setIsBookingTrackerOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isVLMScannerOpen, setIsVLMScannerOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [quoteTargetMaid, setQuoteTargetMaid] = useState(null);
  const [selectedLocality, setSelectedLocality] = useState('All Pune');
  const [activePartnerMaidId, setActivePartnerMaidId] = useState('maid_pune_1'); // Sunita Shinde

  // Live Real-Time Telemetry & GPS State
  const [liveGpsData, setLiveGpsData] = useState({});

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    service: 'all',
    status: 'all',
    maxDistance: 5,
    maxPrice: 400
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
    }, 4500);
  };

  const saveUserPhoneNumber = (phone) => {
    setUserPhoneNumber(phone);
    localStorage.setItem('user_phone_number', phone);
    showToast(`Phone number set to ${phone} for real call dispatch!`, 'success');
  };

  // Load maids
  const loadMaids = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getMaids({ ...filters, city: selectedCity });
      if (data.success) {
        setMaids(data.maids);
        setAvailableCount(data.availableCount);
      }
    } catch (err) {
      console.error(err);
      setError('Could not connect to live Pune helper network.');
    } finally {
      setLoading(false);
    }
  }, [filters, selectedCity]);

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

  // Initial Load & Real-Time Event Subscription
  useEffect(() => {
    loadMaids();
    loadBookings();

    realtime.connect();

    const unsubConn = realtime.on('connection_status', ({ connected }) => {
      setIsRealtimeConnected(connected);
    });

    const unsubBookingCreated = realtime.on('booking_created', (newBooking) => {
      setBookings(prev => [newBooking, ...prev.filter(b => b.id !== newBooking.id)]);
      realtime.playChime('booking');
      showToast(`🔔 New Booking Dispatch #${newBooking.id} for ${newBooking.maidName}!`, 'success');
      loadMaids();
    });

    const unsubBookingUpdated = realtime.on('booking_updated', (updatedBooking) => {
      setBookings(prev => prev.map(b => b.id === updatedBooking.id ? updatedBooking : b));
      showToast(`⚡ Booking #${updatedBooking.id} status updated to ${updatedBooking.status.toUpperCase()}`, 'info');
      loadMaids();
    });

    const unsubMaidStatus = realtime.on('maid_status_change', ({ maidId, status, maid }) => {
      setMaids(prev => prev.map(m => m.id === maidId ? { ...m, status, ...maid } : m));
      realtime.playChime('notification');
    });

    const unsubGps = realtime.on('maid_location_update', (gps) => {
      setLiveGpsData(prev => ({ ...prev, [gps.bookingId]: gps }));
      setBookings(prev => prev.map(b => b.id === gps.bookingId ? { ...b, etaRemainingMins: gps.etaRemainingMins, status: gps.status } : b));
    });

    return () => {
      unsubConn();
      unsubBookingCreated();
      unsubBookingUpdated();
      unsubMaidStatus();
      unsubGps();
    };
  }, [loadMaids, loadBookings]);

  // Handle maid status toggle
  const toggleMaidStatus = async (maidId, newStatus, busyUntil = null, etaMins = 20) => {
    try {
      const res = await api.updateMaidStatus(maidId, { status: newStatus, busyUntil, etaMins });
      if (res.success) {
        showToast(`Maid Status set to ${newStatus.toUpperCase()}!`, 'success');
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
        showToast('🎉 Maid Booked! Real-time dispatch is active.', 'success');
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
        selectedCity,
        setSelectedCity,
        userPhoneNumber,
        saveUserPhoneNumber,
        maids,
        availableCount,
        loading,
        error,
        isRealtimeConnected,
        filters,
        setFilters,
        loadMaids,
        bookings,
        loadBookings,
        liveGpsData,
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
        isAIAssistantOpen,
        setIsAIAssistantOpen,
        isVLMScannerOpen,
        setIsVLMScannerOpen,
        isQuoteModalOpen,
        setIsQuoteModalOpen,
        quoteTargetMaid,
        setQuoteTargetMaid,
        selectedLocality,
        setSelectedLocality,
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
