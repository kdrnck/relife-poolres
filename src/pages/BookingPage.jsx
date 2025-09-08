import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { format, startOfDay } from 'date-fns';
import { tr as trLocale } from 'date-fns/locale';
import DatePicker from '../components/DatePicker';
import TimeSlotGrid from '../components/TimeSlotGrid';
import LanguageToggle from '../components/LanguageToggle';
import { dbHelpers } from '../lib/supabase';
import { useNotification } from '../components/NotificationSystem';
import { LoadingSpinner, SkeletonGrid } from '../components/LoadingSpinner';

const BookingPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedReservationForCancel, setSelectedReservationForCancel] = useState(null);
  const [userData, setUserData] = useState(null);
  const [customerHistory, setCustomerHistory] = useState([]);
  const [showReservations, setShowReservations] = useState(false);
  const [historySearchTerm, setHistorySearchTerm] = useState('');

  useEffect(() => {
    // Get user data from localStorage
    const storedUserData = localStorage.getItem('userData');
    if (!storedUserData) {
      navigate('/');
      return;
    }
    try {
      const parsedUserData = JSON.parse(storedUserData);
      setUserData(parsedUserData);
    } catch (error) {
      console.error('BookingPage - Error parsing userData:', error);
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    loadReservations();
  }, [selectedDate]);

  useEffect(() => {
    // Kayıtlı müşteri ise geçmiş randevularını yükle
    if (userData && userData.isExisting && userData.customerId) {
      loadCustomerHistory();
    }
  }, [userData]);

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

  const loadCustomerHistory = async () => {
    try {
      const history = await dbHelpers.getCustomerReservations(userData.customerId);
      setCustomerHistory(history || []);
    } catch (error) {
      console.error('Error loading customer history:', error);
      setCustomerHistory([]);
    }
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
  };

  const handleConfirmReservation = () => {
    if (selectedSlot) {
      setShowConfirmModal(true);
    }
  };

  const handleBookingConfirm = async () => {
    if (!selectedSlot || !userData) return;

    setLoading(true);
    try {
      let customer;
      
      if (userData.isExisting && userData.customerId) {
        // Existing customer - use existing customer ID
        customer = { id: userData.customerId };
      } else {
        // New customer - create customer first (or get existing if phone already exists)
        customer = await dbHelpers.createCustomer(
          userData.phoneNumber,
          userData.firstName,
          userData.lastName
        );
        
        // If customer was found by phone number, update userData
        if (customer.id !== userData.customerId) {
          const updatedUserData = {
            ...userData,
            customerId: customer.id,
            firstName: customer.first_name,
            lastName: customer.last_name,
            isExisting: true
          };
          setUserData(updatedUserData);
          localStorage.setItem('userData', JSON.stringify(updatedUserData));
        }
      }
      
      // Create reservation
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      await dbHelpers.createReservation(
        customer.id,
        dateStr,
        selectedSlot.timeSlot,
        selectedSlot.laneId
      );

      // Prepare booking details for success page
      const bookingDetails = {
        date: dateStr,
        timeSlot: selectedSlot.timeSlot,
        laneId: selectedSlot.laneId
      };

      // Store booking details in localStorage as backup
      localStorage.setItem('lastBookingDetails', JSON.stringify(bookingDetails));

      // Navigate to success page
      navigate('/booking-success', {
        state: {
          bookingDetails,
          userData
        }
      });
      
    } catch (error) {
      console.error('Error creating reservation:', error);
      addNotification('Rezervasyon oluşturulurken bir hata oluştu.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUserCancel = (reservationInfo) => {
    setSelectedReservationForCancel(reservationInfo);
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedReservationForCancel) return;

    setLoading(true);
    try {
      await dbHelpers.cancelReservation(selectedReservationForCancel.id, 'Kullanıcı tarafından iptal edildi');
      
      // Reload reservations and customer history
      await loadReservations();
      if (userData && userData.isExisting && userData.customerId) {
        await loadCustomerHistory();
      }
      
      setShowCancelModal(false);
      setSelectedReservationForCancel(null);
      
      addNotification('Rezervasyonunuz başarıyla iptal edildi.', 'success');
      
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      addNotification('Rezervasyon iptal edilirken bir hata oluştu.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatDateForModal = useCallback((date) => {
    return format(date, 'dd MMMM yyyy', { 
      locale: i18n.language === 'tr' ? trLocale : undefined 
    });
  }, [i18n.language]);

  const createCalendarEvent = (reservation) => {
    try {
      // Handle both "HH:MM" and "HH:MM:SS" formats
      const timeSlot = reservation.time_slot.includes(':') && reservation.time_slot.split(':').length === 3 
        ? reservation.time_slot.substring(0, 5) // Remove seconds if present
        : reservation.time_slot;
      
      const startDate = new Date(`${reservation.date}T${timeSlot}:00`);
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour later
      
      // Format dates for .ics file
      const formatDateForICS = (date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };
      
      const eventDetails = {
        title: `ReLife Club - Havuz Rezervasyonu`,
        description: `Kulvar ${reservation.lane_id} - Havuz Rezervasyonu\\nMüşteri: ${userData.firstName} ${userData.lastName}`,
        start: formatDateForICS(startDate),
        end: formatDateForICS(endDate),
        location: 'ReLife Club',
        uid: `${reservation.id}-${reservation.lane_id}@relifeclub.com`
      };

      // Create .ics file content
      const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//ReLife Club//Pool Reservation//TR
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${eventDetails.uid}
DTSTAMP:${formatDateForICS(new Date())}
DTSTART:${eventDetails.start}
DTEND:${eventDetails.end}
SUMMARY:${eventDetails.title}
DESCRIPTION:${eventDetails.description}
LOCATION:${eventDetails.location}
STATUS:CONFIRMED
TRANSP:OPAQUE
END:VEVENT
END:VCALENDAR`;

      // Create and download .ics file
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `relife-pool-reservation-${reservation.date}-${reservation.time_slot.replace(':', '')}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Show success message
      addNotification('Takvim hatırlatıcısı başarıyla oluşturuldu ve indirildi!', 'success');
      
    } catch (error) {
      console.error('Error creating calendar event:', error);
      addNotification('Hatırlatıcı oluşturulurken bir hata oluştu.', 'error');
    }
  };

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Kullanıcı bilgileri yükleniyor..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <LanguageToggle />
      
      <div className="max-w-6xl mx-auto">
        {/* Profil Başlığı */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-8 border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-gray-900 font-bold text-lg">
                  {userData.firstName.charAt(0)}{userData.lastName.charAt(0)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 truncate">
                  Profiliniz: {userData.firstName} {userData.lastName}
                </h1>
                {userData.isExisting && (
                  <p className="text-green-600 text-sm font-medium truncate">
                    ✓ Kayıtlı müşteri ({userData.phoneNumber})
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('userData');
                navigate('/');
              }}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 w-full sm:w-auto sm:px-6"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Çıkış Yap</span>
            </button>
          </div>
        </div>

        {/* Randevular - Sadece kayıtlı müşteriler için */}
        {userData && userData.isExisting && customerHistory.length > 0 && (
          <div className="mt-8 max-w-4xl mx-auto">
            <div 
              className="bg-white rounded-lg shadow-lg p-4 sm:p-6 cursor-pointer hover:shadow-xl transition-all duration-200"
              onClick={() => setShowReservations(!showReservations)}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                  Randevularınız
                </h2>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    {customerHistory.length} randevu
                  </span>
                  <svg 
                    className={`w-5 h-5 sm:w-6 sm:h-6 text-gray-500 transition-transform duration-200 ${
                      showReservations ? 'rotate-180' : ''
                    }`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            
            {showReservations && (
              <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mt-4">
                {/* Search Input for History */}
                {customerHistory.length > 3 && (
                  <div className="mb-4">
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Tarih ara (ör: 15/12/2024)..."
                        value={historySearchTerm}
                        onChange={(e) => setHistorySearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors duration-200 text-sm"
                      />
                      {historySearchTerm && (
                        <button
                          onClick={() => setHistorySearchTerm('')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="space-y-3">
                  {customerHistory
                    .filter(reservation => {
                      if (!historySearchTerm) return true;
                      const dateStr = format(new Date(reservation.date), 'dd/MM/yyyy');
                      return dateStr.includes(historySearchTerm);
                    })
                    .slice(0, 5)
                    .map((reservation) => {
                    const isPastReservation = new Date(reservation.date) < new Date();
                    return (
                      <div 
                        key={reservation.id} 
                        className="p-3 sm:p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 space-y-2 sm:space-y-0">
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4">
                            <div className="text-base sm:text-lg font-semibold text-gray-800">
                              {format(new Date(reservation.date), 'dd/MM/yyyy')}
                            </div>
                            <div className="text-sm sm:text-base text-gray-600">
                              {reservation.time_slot}
                            </div>
                            <div className="text-sm sm:text-base text-blue-600 font-medium">
                              Kulvar {reservation.lane_id}
                            </div>
                          </div>
                          <div className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium self-start sm:self-auto ${
                            reservation.status === 'active' && !isPastReservation
                              ? 'bg-green-100 text-green-800' 
                              : reservation.status === 'completed'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {reservation.status === 'active' && !isPastReservation ? 'Aktif' : 
                             reservation.status === 'completed' ? 'Tamamlandı' : 
                             isPastReservation ? 'Geçmiş' : 'İptal'}
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                          {reservation.status === 'active' && !isPastReservation && (
                            <button
                              onClick={() => handleUserCancel(reservation)}
                              className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-sm rounded-lg transition-colors duration-200 flex items-center justify-center space-x-1 w-full sm:w-auto sm:px-4"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              <span>İptal Et</span>
                            </button>
                          )}
                          
                          {!isPastReservation && (
                            <button
                              onClick={() => createCalendarEvent(reservation)}
                              className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm rounded-lg transition-colors duration-200 flex items-center justify-center space-x-1 w-full sm:w-auto sm:px-4"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>Hatırlatıcı Oluştur</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {(() => {
                  const filteredCount = customerHistory.filter(reservation => {
                    if (!historySearchTerm) return true;
                    const dateStr = format(new Date(reservation.date), 'dd/MM/yyyy');
                    return dateStr.includes(historySearchTerm);
                  }).length;
                  
                  if (historySearchTerm && filteredCount === 0) {
                    return (
                      <p className="text-center text-gray-500 text-sm mt-4">
                        Arama kriterine uygun randevu bulunamadı.
                      </p>
                    );
                  }
                  
                  if (filteredCount > 5) {
                    return (
                      <p className="text-center text-gray-500 text-sm mt-4">
                        Ve {filteredCount - 5} randevu daha...
                      </p>
                    );
                  }
                  
                  return null;
                })()}
              </div>
            )}
          </div>
        )}

        <div className="text-center mb-8">
          <p className="text-gray-600 text-lg">{t('selectDate')}</p>
        </div>

        <DatePicker
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          maxDaysFromToday={7} // 7-day limit for users
          isAdmin={false}
        />

        {loading ? (
          <div className="text-center py-8">
            <SkeletonGrid rows={5} cols={3} />
            <LoadingSpinner size="md" text="Rezervasyonlar yükleniyor..." className="mt-6" />
          </div>
        ) : (
          <TimeSlotGrid
            reservations={reservations}
            selectedSlot={selectedSlot}
            onSlotSelect={handleSlotSelect}
            isAdmin={false}
            currentUserId={userData?.customerId}
            onUserCancel={handleUserCancel}
          />
        )}

        {selectedSlot && (
          <div className="text-center mt-8">
            <button
              onClick={handleConfirmReservation}
              disabled={loading}
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-3 px-8 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50"
              style={{ backgroundColor: '#edc700' }}
            >
              {t('confirmReservation')}
            </button>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && selectedSlot && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  Rezervasyon Onayı
                </h3>
                <p className="text-gray-600">
                  Randevu detaylarını kontrol edin
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="font-semibold text-gray-700">Müşteri:</span>
                    <span className="text-gray-800">{userData.firstName} {userData.lastName}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="font-semibold text-gray-700">Tarih:</span>
                    <span className="text-gray-800">{formatDateForModal(selectedDate)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="font-semibold text-gray-700">Saat:</span>
                    <span className="text-gray-800">{selectedSlot.timeSlot}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2">
                    <span className="font-semibold text-gray-700">Kulvar:</span>
                    <span className="text-gray-800">Kulvar {selectedSlot.laneId}</span>
                  </div>
                </div>
              </div>

              <p className="text-center text-gray-700 mb-6 font-medium">
                <span className="text-yellow-600 font-bold">{selectedSlot.laneId}. kulvar</span> için{' '}
                <span className="text-yellow-600 font-bold">{formatDateForModal(selectedDate)}</span> tarihinde{' '}
                <span className="text-yellow-600 font-bold">{selectedSlot.timeSlot}</span> saatinde randevu almak istediğinizden emin misiniz?
              </p>

              <div className="flex space-x-4">
                <button
                  onClick={handleBookingConfirm}
                  disabled={loading}
                  className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:transform-none"
                  style={{ backgroundColor: '#edc700' }}
                >
                  {loading ? 'Oluşturuluyor...' : 'Evet, Onayla'}
                </button>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  disabled={loading}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Hayır, İptal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Reservation Modal */}
        {showCancelModal && selectedReservationForCancel && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Rezervasyon İptali
                </h3>
              </div>
              
              <div className="bg-pink-50 rounded-lg p-4 mb-6">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tarih:</span>
                    <span className="font-medium">{formatDateForModal(selectedDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Saat:</span>
                    <span className="font-medium">{selectedReservationForCancel.time_slot}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Kulvar:</span>
                    <span className="font-medium">Kulvar {selectedReservationForCancel.lane_id}</span>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600 text-center mb-6">
                Bu rezervasyonu iptal etmek istediğinizden emin misiniz?
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleConfirmCancel}
                  disabled={loading}
                  className="flex-1 bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 flex items-center justify-center space-x-2"
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
                  onClick={() => setShowCancelModal(false)}
                  disabled={loading}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
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

export default BookingPage;
