import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { format, startOfDay, addWeeks } from 'date-fns';
import { tr } from 'date-fns/locale';
import { v4 as uuidv4 } from 'uuid';
import DatePicker from '../components/DatePicker';
import TimeSlotGrid from '../components/TimeSlotGrid';
import LanguageToggle from '../components/LanguageToggle';
import { dbHelpers } from '../lib/supabase';
import { useNotification } from '../components/NotificationSystem';
import { LoadingSpinner, SkeletonGrid } from '../components/LoadingSpinner';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [selectedSlotForAdd, setSelectedSlotForAdd] = useState(null);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showRecurringCancelModal, setShowRecurringCancelModal] = useState(false);
  const [selectedRecurringBlock, setSelectedRecurringBlock] = useState(null);
  const [blockData, setBlockData] = useState({
    reason: 'Rutin Temizlik/Bakım',
    isRecurring: false
  });
  const [newReservationData, setNewReservationData] = useState({
    phoneNumber: '',
    firstName: '',
    lastName: '',
    isRecurring: false
  });
  
  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterLane, setFilterLane] = useState('all');
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [customerFound, setCustomerFound] = useState(null);
  const [checkingCustomer, setCheckingCustomer] = useState(false);

  useEffect(() => {
    // Check admin authentication
    const isAuthenticated = sessionStorage.getItem('adminAuthenticated');
    if (!isAuthenticated) {
      navigate('/admin');
      return;
    }
  }, [navigate]);

  useEffect(() => {
    loadReservations();
  }, [selectedDate]);

  // Filter reservations based on search term and filters
  useEffect(() => {
    let filtered = reservations;

    // Search by customer name or phone
    if (searchTerm) {
      filtered = filtered.filter(reservation => {
        if (!reservation.customers) return false;
        const fullName = `${reservation.customers.first_name} ${reservation.customers.last_name}`.toLowerCase();
        const phone = reservation.customers.phone_number || '';
        return fullName.includes(searchTerm.toLowerCase()) || phone.includes(searchTerm);
      });
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(reservation => reservation.status === filterStatus);
    }

    // Filter by lane
    if (filterLane !== 'all') {
      filtered = filtered.filter(reservation => reservation.lane_id === parseInt(filterLane));
    }

    setFilteredReservations(filtered);
  }, [reservations, searchTerm, filterStatus, filterLane]);

  const loadReservations = async () => {
    setLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const data = await dbHelpers.getReservationsByDate(dateStr);
      setReservations(data || []);
    } catch (error) {
      console.error('Error loading reservations:', error);
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminAction = (action, data) => {
    if (multiSelectMode) {
      // Multi-select mode: toggle slot selection
      toggleSlotSelection(data.laneId, data.timeSlot);
      return;
    }
    
    if (action === 'cancel') {
      // Check if it's a recurring block
      if (data.recurring_id && data.status === 'blocked') {
        setSelectedRecurringBlock(data);
        setShowRecurringCancelModal(true);
      } else {
        setSelectedReservation(data);
        setShowDeleteModal(true);
      }
    } else if (action === 'add') {
      setSelectedSlotForAdd(data);
      setShowAddModal(true);
    }
  };

  const toggleSlotSelection = (laneId, timeSlot) => {
    const slotKey = `${laneId}-${timeSlot}`;
    setSelectedSlots(prev => {
      if (prev.includes(slotKey)) {
        return prev.filter(slot => slot !== slotKey);
      } else {
        return [...prev, slotKey];
      }
    });
  };

  const selectAllLaneSlots = (laneId) => {
    const timeSlots = [
      '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', 
      '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'
    ];
    const laneSlots = timeSlots.map(time => `${laneId}-${time}`);
    setSelectedSlots(prev => {
      const newSlots = [...prev];
      laneSlots.forEach(slot => {
        if (!newSlots.includes(slot)) {
          newSlots.push(slot);
        }
      });
      return newSlots;
    });
  };

  const selectAllTimeSlots = (timeSlot) => {
    const lanes = [1, 2, 3];
    const timeSlotSlots = lanes.map(lane => `${lane}-${timeSlot}`);
    setSelectedSlots(prev => {
      const newSlots = [...prev];
      timeSlotSlots.forEach(slot => {
        if (!newSlots.includes(slot)) {
          newSlots.push(slot);
        }
      });
      return newSlots;
    });
  };

  const clearSelection = () => {
    setSelectedSlots([]);
  };

  const handleBlockSlots = () => {
    if (selectedSlots.length === 0) return;
    setShowBlockModal(true);
  };

  const handleConfirmBlock = async () => {
    if (selectedSlots.length === 0) return;

    setLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      console.log('🔄 Bloke etme başlıyor:', {
        selectedSlots,
        reason: blockData.reason,
        isRecurring: blockData.isRecurring,
        date: dateStr
      });
      
      if (blockData.isRecurring) {
        // Tekrarlayan blokaj
        console.log('📅 Tekrarlayan blokaj yapılıyor...');
        await dbHelpers.blockSlotsRecurring(selectedSlots, blockData.reason, dateStr, 26);
      } else {
        // Tek seferlik blokaj
        console.log('📅 Tek seferlik blokaj yapılıyor...');
        await dbHelpers.blockSlots(selectedSlots, blockData.reason, dateStr);
      }
      
      console.log('✅ Blokaj tamamlandı, rezervasyonlar yeniden yükleniyor...');
      
      // Rezervasyonları yeniden yükle
      await loadReservations();
      
      // Modal'ı kapat ve seçimi temizle
      setShowBlockModal(false);
      clearSelection();
      setMultiSelectMode(false);
      
      addNotification(`${selectedSlots.length} slot başarıyla bloke edildi!`, 'success');
      
    } catch (error) {
      console.error('❌ Error blocking slots:', error);
      console.error('❌ Error details:', error.message, error.details);
      addNotification(`Slotlar bloke edilirken bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async () => {
    if (!selectedReservation) return;

    setLoading(true);
    try {
      // Rezervasyonu iptal et (status'ü cancelled yap)
      await dbHelpers.cancelReservation(selectedReservation.id, 'Admin tarafından iptal edildi');

      await loadReservations();
      setShowDeleteModal(false);
      setSelectedReservation(null);
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      addNotification('Rezervasyon iptal edilirken bir hata oluştu.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRecurringBlock = async (cancelType) => {
    if (!selectedRecurringBlock) return;

    setLoading(true);
    try {
      if (cancelType === 'single') {
        // Sadece o gün için iptal et
        await dbHelpers.cancelReservation(selectedRecurringBlock.id, 'Tekrarlayan blokaj - sadece bu gün iptal edildi');
      } else if (cancelType === 'all_future') {
        // Bu günden itibaren tüm gelecekteki seferleri iptal et
        const currentDate = format(selectedDate, 'yyyy-MM-dd');
        await dbHelpers.cancelRecurringBlockFromDate(selectedRecurringBlock.recurring_id, currentDate);
""      }

      await loadReservations();
      setShowRecurringCancelModal(false);
      setSelectedRecurringBlock(null);
      
      const messages = {
        'single': 'Bu gün için blokaj iptal edildi!',
        'all_future': 'Bu günden itibaren tüm gelecekteki blokajlar iptal edildi!'
      };
      
      addNotification(messages[cancelType] || 'İşlem başarıyla tamamlandı!', 'success');
    } catch (error) {
      console.error('Error handling recurring block:', error);
      addNotification('Tekrarlayan blokaj işlenirken bir hata oluştu.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneNumberCheck = async (phoneNumber) => {
    if (!phoneNumber || phoneNumber.length < 11) {
      setCustomerFound(null);
      return;
    }

    setCheckingCustomer(true);
    try {
      const existingCustomer = await dbHelpers.checkCustomerByPhone(phoneNumber);
      if (existingCustomer) {
        setCustomerFound(existingCustomer);
        setNewReservationData(prev => ({
          ...prev,
          firstName: existingCustomer.first_name,
          lastName: existingCustomer.last_name
        }));
      } else {
        setCustomerFound(null);
        setNewReservationData(prev => ({
          ...prev,
          firstName: '',
          lastName: ''
        }));
      }
    } catch (error) {
      console.error('Error checking customer:', error);
      setCustomerFound(null);
    } finally {
      setCheckingCustomer(false);
    }
  };

  const handleAddReservation = async () => {
    if (!selectedSlotForAdd || !newReservationData.phoneNumber) return;

    setLoading(true);
    try {
      let customer;
      
      if (customerFound) {
        // Kayıtlı müşteri
        customer = customerFound;
      } else if (newReservationData.firstName && newReservationData.lastName) {
        // Yeni müşteri oluştur
        customer = await dbHelpers.createCustomer(
          newReservationData.phoneNumber,
          newReservationData.firstName,
          newReservationData.lastName
        );
      } else {
        // Engelleme (müşteri bilgisi yok)
        customer = null;
      }

      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      // Tek rezervasyon oluştur
      await dbHelpers.createReservation(
        customer?.id || null,
        dateStr,
        selectedSlotForAdd.timeSlot,
        selectedSlotForAdd.laneId
      );

      await loadReservations();
      setShowAddModal(false);
      setSelectedSlotForAdd(null);
      setCustomerFound(null);
      setNewReservationData({
        phoneNumber: '',
        firstName: '',
        lastName: '',
        isRecurring: false
      });
    } catch (error) {
      console.error('Error adding reservation:', error);
      addNotification('Rezervasyon eklenirken bir hata oluştu.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuthenticated');
    navigate('/admin');
  };

  const formatDateForModal = (date) => {
    return format(date, 'dd MMMM yyyy');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <LanguageToggle />
      
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 space-y-4 sm:space-y-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            {t('adminDashboard')}
          </h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 w-full sm:w-auto sm:px-6"
          >
            Çıkış Yap
          </button>
        </div>

        <DatePicker
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          isAdmin={true} // No date restrictions for admin
        />

        {/* Search & Filter Controls */}
        <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Müşteri adı veya telefon numarası ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors duration-200"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Status Filter */}
            <div className="lg:w-48">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors duration-200 bg-white"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="active">Aktif</option>
                <option value="cancelled">İptal</option>
                <option value="blocked">Blokeli</option>
              </select>
            </div>

            {/* Lane Filter */}
            <div className="lg:w-32">
              <select
                value={filterLane}
                onChange={(e) => setFilterLane(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors duration-200 bg-white"
              >
                <option value="all">Tüm Kulvarlar</option>
                <option value="1">Kulvar 1</option>
                <option value="2">Kulvar 2</option>
                <option value="3">Kulvar 3</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="flex items-center text-sm text-gray-600">
              <span className="bg-gray-100 px-3 py-2 rounded-lg">
                {filteredReservations.length} sonuç
              </span>
            </div>
          </div>
        </div>

        {/* Multi-select controls */}
        <div className="mb-6 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 bg-white p-4 rounded-lg shadow-sm">
          <button
            onClick={() => setMultiSelectMode(!multiSelectMode)}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-200 w-full sm:w-auto sm:px-6 ${
              multiSelectMode 
                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {multiSelectMode ? 'Çoklu Seçimi Kapat' : 'SAAT BLOKE ET'}
          </button>

          {multiSelectMode && (
            <>
              <span className="text-sm text-gray-600 text-center sm:text-left">
                Seçilen: {selectedSlots.length} slot
              </span>
              
              {selectedSlots.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleBlockSlots}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors duration-200 w-full sm:w-auto sm:px-6"
                  >
                    Seçilen Saatleri Bloke Et
                  </button>
                  
                  <button
                    onClick={clearSelection}
                    className="px-3 py-2 bg-gray-400 hover:bg-gray-500 text-white font-semibold rounded-lg transition-colors duration-200 w-full sm:w-auto sm:px-5"
                  >
                    Seçimi Temizle
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {loading ? (
          <div className="text-center py-8">
            <SkeletonGrid rows={6} cols={4} />
            <LoadingSpinner size="md" text="Admin paneli yükleniyor..." className="mt-6" />
          </div>
        ) : (
          <TimeSlotGrid
            reservations={filteredReservations.length > 0 ? filteredReservations : reservations}
            selectedSlot={null}
            onSlotSelect={() => {}}
            isAdmin={true}
            onAdminAction={handleAdminAction}
            multiSelectMode={multiSelectMode}
            selectedSlots={selectedSlots}
            onSelectAllLane={selectAllLaneSlots}
            onSelectAllTime={selectAllTimeSlots}
          />
        )}

        {/* Cancel Confirmation Modal */}
        {showDeleteModal && selectedReservation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Rezervasyon İptali
                </h3>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Müşteri:</span>
                    <span className="font-medium">
                      {selectedReservation.customers ? 
                        `${selectedReservation.customers.first_name} ${selectedReservation.customers.last_name}` : 
                        'Engellenen Saat'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Telefon:</span>
                    <span className="font-medium">
                      {selectedReservation.customers?.phone_number || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tarih:</span>
                    <span className="font-medium">{formatDateForModal(selectedDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Saat:</span>
                    <span className="font-medium">{selectedReservation.time_slot}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Kulvar:</span>
                    <span className="font-medium">Kulvar {selectedReservation.lane_id}</span>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600 text-center mb-6">
                Bu rezervasyonu iptal etmek istediğinizden emin misiniz?
              </p>
              
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={handleCancelReservation}
                  disabled={loading}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>İptal ediliyor...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Rezervasyonu İptal Et</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={loading}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Vazgeç
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Reservation Modal */}
        {showAddModal && selectedSlotForAdd && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Yeni Rezervasyon
              </h3>
              <p className="text-gray-600 mb-4">
                Kulvar {selectedSlotForAdd.laneId} - {selectedSlotForAdd.timeSlot} ({formatDateForModal(selectedDate)})
              </p>
              
              <div className="space-y-4">
                {/* Telefon Numarası */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefon Numarası
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={newReservationData.phoneNumber}
                      onChange={(e) => {
                        const phone = e.target.value;
                        setNewReservationData(prev => ({
                          ...prev,
                          phoneNumber: phone
                        }));
                        handlePhoneNumberCheck(phone);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      placeholder="05*********"
                    />
                    {checkingCustomer && (
                      <div className="absolute right-3 top-3">
                        <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  {/* Müşteri Durumu */}
                  {newReservationData.phoneNumber.length >= 11 && (
                    <div className="mt-2">
                      {customerFound ? (
                        <div className="flex items-center text-green-600 text-sm">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Kayıtlı müşteri: {customerFound.first_name} {customerFound.last_name}
                        </div>
                      ) : (
                        <div className="text-orange-600 text-sm">
                          ⚠️ Yeni müşteri - Ad/soyad gerekli
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Ad/Soyad - Sadece yeni müşteriler için */}
                {!customerFound && newReservationData.phoneNumber.length >= 11 && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ad
                      </label>
                      <input
                        type="text"
                        value={newReservationData.firstName}
                        onChange={(e) => setNewReservationData(prev => ({
                          ...prev,
                          firstName: e.target.value
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        placeholder="Ahmet"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Soyad
                      </label>
                      <input
                        type="text"
                        value={newReservationData.lastName}
                        onChange={(e) => setNewReservationData(prev => ({
                          ...prev,
                          lastName: e.target.value
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        placeholder="Yılmaz"
                      />
                    </div>
                  </>
                )}
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleAddReservation}
                  disabled={loading || !newReservationData.phoneNumber}
                  className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
                  style={{ backgroundColor: '#edc700' }}
                >
                  {loading ? 'Ekleniyor...' : 'Rezervasyon Oluştur'}
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setCustomerFound(null);
                    setNewReservationData({
                      phoneNumber: '',
                      firstName: '',
                      lastName: '',
                      isRecurring: false
                    });
                  }}
                  disabled={loading}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Block Slots Modal */}
        {showBlockModal && selectedSlots.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0h-2M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Saatleri Bloke Et
                </h3>
              </div>
              
              <div className="bg-orange-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>{selectedSlots.length} slot</strong> bloke edilecek:
                </p>
                <div className="text-xs text-gray-500 max-h-24 overflow-y-auto">
                  {selectedSlots.map(slot => {
                    const [laneId, timeSlot] = slot.split('-');
                    return (
                      <div key={slot} className="mb-1">
                        Kulvar {laneId} - {timeSlot}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Bloke Etme Nedeni:
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="blockReason"
                      value="Rutin Temizlik/Bakım"
                      className="mr-2"
                      checked={blockData.reason === 'Rutin Temizlik/Bakım'}
                      onChange={(e) => setBlockData(prev => ({ ...prev, reason: e.target.value }))}
                    />
                    <span className="text-sm">Rutin Temizlik/Bakım</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="blockReason"
                      value="Özel Ders"
                      className="mr-2"
                      checked={blockData.reason === 'Özel Ders'}
                      onChange={(e) => setBlockData(prev => ({ ...prev, reason: e.target.value }))}
                    />
                    <span className="text-sm">Özel Ders</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="blockReason"
                      value="Diğer"
                      className="mr-2"
                      checked={blockData.reason === 'Diğer'}
                      onChange={(e) => setBlockData(prev => ({ ...prev, reason: e.target.value }))}
                    />
                    <span className="text-sm">Diğer</span>
                  </label>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Bloke Etme Türü:
                </label>
                <div className="space-y-3">
                  <label className="flex items-start">
                    <input
                      type="radio"
                      name="blockType"
                      value="single"
                      className="mr-3 mt-1"
                      checked={!blockData.isRecurring}
                      onChange={() => setBlockData(prev => ({ ...prev, isRecurring: false }))}
                    />
                    <div>
                      <span className="text-sm font-medium">Bir Defalık Bloke Et</span>
                      <p className="text-xs text-gray-500 mt-1">
                        Sadece seçilen tarih ({format(selectedDate, 'dd/MM/yyyy')}) için bloke edilir
                      </p>
                    </div>
                  </label>
                  <label className="flex items-start">
                    <input
                      type="radio"
                      name="blockType"
                      value="recurring"
                      className="mr-3 mt-1"
                      checked={blockData.isRecurring}
                      onChange={() => setBlockData(prev => ({ ...prev, isRecurring: true }))}
                    />
                    <div>
                      <span className="text-sm font-medium">Geleceğe Yönelik Bloke Et</span>
                      <p className="text-xs text-gray-500 mt-1">
                        Bu tarihten başlayarak 6 ay boyunca her hafta aynı gün ve saatlerde bloke edilir
                        <br />
                        <span className="text-orange-600">
                          Örn: Her {format(selectedDate, 'EEEE', { locale: tr })} günü bu saatlerde
                        </span>
                      </p>
                    </div>
                  </label>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleConfirmBlock}
                  disabled={loading}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
                >
                  {loading ? 'Bloke Ediliyor...' : 
                    blockData.isRecurring ? 'Tekrarlayan Bloke Et' : 'Bir Kez Bloke Et'
                  }
                </button>
                <button
                  onClick={() => {
                    setShowBlockModal(false);
                    setBlockData({
                      reason: 'Rutin Temizlik/Bakım',
                      isRecurring: false
                    });
                  }}
                  disabled={loading}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recurring Block Cancel Modal */}
        {showRecurringCancelModal && selectedRecurringBlock && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Tekrarlayan Blokaj İptali
                </h3>
              </div>
              
              <div className="bg-orange-50 rounded-lg p-4 mb-6">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Blokaj Nedeni:</span>
                    <span className="font-medium">{selectedRecurringBlock.cancellation_reason}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tarih:</span>
                    <span className="font-medium">{format(selectedDate, 'dd/MM/yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Saat:</span>
                    <span className="font-medium">{selectedRecurringBlock.time_slot}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Kulvar:</span>
                    <span className="font-medium">Kulvar {selectedRecurringBlock.lane_id}</span>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600 text-center mb-6">
                Bu tekrarlayan blokaj için ne yapmak istiyorsunuz?
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => handleCancelRecurringBlock('single')}
                  disabled={loading}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
                >
                  <div className="text-left">
                    <div className="font-bold">Sadece Bu Gün İptal Et</div>
                    <div className="text-xs opacity-90 mt-1">
                      Sadece {format(selectedDate, 'dd/MM/yyyy')} tarihi için blokajı kaldır. 
                      Gelecek haftalar devam eder.
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => handleCancelRecurringBlock('all_future')}
                  disabled={loading}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
                >
                  <div className="text-left">
                    <div className="font-bold">Bu Günden İtibaren Tüm Geleceği İptal Et</div>
                    <div className="text-xs opacity-90 mt-1">
                      {format(selectedDate, 'dd/MM/yyyy')} ve sonrasındaki tüm haftaları iptal et. 
                      Geçmiş haftalar etkilenmez.
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => setShowRecurringCancelModal(false)}
                  disabled={loading}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Vazgeç
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
