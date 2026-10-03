import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotification } from '../components/NotificationSystem';

const BookingSuccess = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { addNotification } = useNotification();
  
  // Get booking details from location state or localStorage
  const { bookingDetails: stateBookingDetails, userData: stateUserData } = location.state || {};
  
  // Fallback to localStorage if state is not available
  const storedBookingDetails = localStorage.getItem('lastBookingDetails');
  const storedUserData = localStorage.getItem('userData');
  
  const bookingDetails = stateBookingDetails || (storedBookingDetails ? JSON.parse(storedBookingDetails) : null);
  const userData = stateUserData || (storedUserData ? JSON.parse(storedUserData) : null);

  if (!bookingDetails || !userData) {
    // If no booking details, show fallback UI
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-100 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
            <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Rezervasyon Başarılı!
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Randevunuz başarıyla oluşturuldu
            </p>
            <div className="flex space-x-4 justify-center">
              <button
                onClick={() => navigate('/booking')}
                className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 px-6 rounded-xl transition-all duration-300"
                style={{ backgroundColor: '#edc700' }}
              >
                Yeni Randevu Al
              </button>
              <button
                onClick={() => navigate('/')}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-xl transition-all duration-300"
              >
                Ana Sayfa
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const createCalendarEvent = () => {
    try {
      // Handle both "HH:MM" and "HH:MM:SS" formats
      const timeSlot = bookingDetails.timeSlot.includes(':') && bookingDetails.timeSlot.split(':').length === 3 
        ? bookingDetails.timeSlot.substring(0, 5) // Remove seconds if present
        : bookingDetails.timeSlot;
      
      const startDate = new Date(`${bookingDetails.date}T${timeSlot}:00`);
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour later
      
      // Format dates for .ics file
      const formatDateForICS = (date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };
      
      const eventDetails = {
        title: `ReLife Club - Havuz Rezervasyonu`,
        description: `Kulvar ${bookingDetails.laneId} - Havuz Rezervasyonu\\nMüşteri: ${userData.firstName} ${userData.lastName}`,
        start: formatDateForICS(startDate),
        end: formatDateForICS(endDate),
        location: 'ReLife Club',
        uid: `${Date.now()}-${bookingDetails.laneId}@relifeclub.com`
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
      link.download = `relife-pool-reservation-${bookingDetails.date}-${bookingDetails.timeSlot.replace(':', '')}.ics`;
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

  const handleNewBooking = () => {
    navigate('/booking');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-100 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        {/* Success Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
          {/* Success Icon */}
          <div className="mb-6">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Rezervasyon Başarılı!
            </h1>
            <p className="text-lg text-gray-600">
              Randevunuz başarıyla oluşturuldu
            </p>
          </div>

          {/* Booking Details */}
          <div className="bg-gray-50 rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Rezervasyon Detayları
            </h2>
            
            <div className="space-y-3 text-left">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="font-semibold text-gray-700">Müşteri:</span>
                <span className="text-gray-800">{userData.firstName} {userData.lastName}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="font-semibold text-gray-700">Tarih:</span>
                <span className="text-gray-800">{formatDate(bookingDetails.date)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="font-semibold text-gray-700">Saat:</span>
                <span className="text-gray-800">{bookingDetails.timeSlot}</span>
              </div>
              
              <div className="flex justify-between items-center py-2">
                <span className="font-semibold text-gray-700">Kulvar:</span>
                <span className="text-gray-800">Kulvar {bookingDetails.laneId}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <button
              onClick={createCalendarEvent}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Hatırlatıcı Oluştur</span>
            </button>

            <div className="flex space-x-4">
              <button
                onClick={handleNewBooking}
                className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                style={{ backgroundColor: '#edc700' }}
              >
                Yeni Randevu Al
              </button>
              
              <button
                onClick={handleGoHome}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Ana Sayfa
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-600 text-sm">
            ReLife Club - Havuz Rezervasyon Sistemi
          </p>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccess;
