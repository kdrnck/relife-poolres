import { useTranslation } from 'react-i18next';

const TimeSlotGrid = ({ 
  reservations, 
  selectedSlot, 
  onSlotSelect, 
  isAdmin = false,
  onAdminAction,
  currentUserId = null,
  onUserCancel = null,
  multiSelectMode = false,
  selectedSlots = [],
  onSelectAllLane = null,
  onSelectAllTime = null
}) => {
  const { t } = useTranslation();
  
  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', 
    '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'
  ];
  
  const lanes = [1, 2, 3];

  const isSlotBooked = (laneId, timeSlot) => {
    return reservations.some(reservation => 
      reservation.lane_id === laneId && 
      (reservation.time_slot === timeSlot || reservation.time_slot === `${timeSlot}:00`) &&
      reservation.status === 'active'
    );
  };

  const isSlotBlocked = (laneId, timeSlot) => {
    return reservations.some(reservation => 
      reservation.lane_id === laneId && 
      (reservation.time_slot === timeSlot || reservation.time_slot === `${timeSlot}:00`) &&
      reservation.status === 'blocked'
    );
  };

  const getReservationInfo = (laneId, timeSlot) => {
    return reservations.find(reservation => 
      reservation.lane_id === laneId && 
      (reservation.time_slot === timeSlot || reservation.time_slot === `${timeSlot}:00`)
    );
  };

  const isUserOwnReservation = (laneId, timeSlot) => {
    if (!currentUserId) return false;
    const reservationInfo = getReservationInfo(laneId, timeSlot);
    return reservationInfo && reservationInfo.customer_id === currentUserId;
  };

  const handleSlotClick = (laneId, timeSlot) => {
    const reservationInfo = getReservationInfo(laneId, timeSlot);
    const isOwnReservation = isUserOwnReservation(laneId, timeSlot);
    const blocked = isSlotBlocked(laneId, timeSlot);
    const booked = isSlotBooked(laneId, timeSlot);
    
    if (multiSelectMode && isAdmin) {
      // Multi-select mode for admin - can select any slot
      onAdminAction('select', { laneId, timeSlot });
    } else if (isAdmin && blocked) {
      // Admin clicked on blocked slot - can cancel block
      onAdminAction('cancel', reservationInfo);
    } else if (isAdmin && booked) {
      // Admin clicked on booked slot
      onAdminAction('cancel', reservationInfo);
    } else if (isAdmin && !reservationInfo) {
      // Admin clicked on empty slot
      onAdminAction('add', { laneId, timeSlot });
    } else if (isOwnReservation && onUserCancel) {
      // User clicked on their own reservation
      onUserCancel(reservationInfo);
    } else if (!blocked && !booked) {
      // User clicked on available slot (not blocked or booked)
      onSlotSelect({ laneId, timeSlot });
    }
    // If blocked or booked by others, do nothing for regular users
  };

  const getSlotClassName = (laneId, timeSlot) => {
    const reservationInfo = getReservationInfo(laneId, timeSlot);
    const isSelected = selectedSlot && 
      selectedSlot.laneId === laneId && 
      selectedSlot.timeSlot === timeSlot;
    const isOwnReservation = isUserOwnReservation(laneId, timeSlot);
    const isMultiSelected = selectedSlots.includes(`${laneId}-${timeSlot}`);
    const blocked = isSlotBlocked(laneId, timeSlot);
    const booked = isSlotBooked(laneId, timeSlot);

                  let baseClasses = "p-2 sm:p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer h-[80px] sm:h-[100px] flex flex-col justify-center items-center text-xs sm:text-sm relative";

    if (isMultiSelected && multiSelectMode) {
      // Multi-selected slot in admin mode
      return `${baseClasses} bg-blue-200 border-blue-400 text-blue-800 ring-2 ring-blue-300`;
    } else     if (blocked) {
      // Blocked slot - different colors based on reason and user type
      const blockInfo = reservations.find(r => 
        r.lane_id === laneId && 
        (r.time_slot === timeSlot || r.time_slot === `${timeSlot}:00`) &&
        r.status === 'blocked'
      );
      
      const reason = blockInfo?.cancellation_reason || 'Bakım/Temizlik';
      
      if (isAdmin) {
        // Admin sees different colors based on reason
        if (reason === 'Rutin Temizlik/Bakım') {
          return `${baseClasses} bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200`;
        } else if (reason === 'Özel Ders') {
          return `${baseClasses} bg-purple-100 border-purple-300 text-purple-700 hover:bg-purple-200`;
        } else {
          return `${baseClasses} bg-orange-100 border-orange-300 text-orange-700 hover:bg-orange-200`;
        }
      } else {
        // Users see all blocked slots as unavailable (gray)
        return `${baseClasses} bg-gray-200 border-gray-400 text-gray-600 cursor-not-allowed opacity-70`;
      }
    } else if (isOwnReservation) {
      // User's own reservation - pink/rose color
      return `${baseClasses} bg-pink-100 border-pink-300 text-pink-700 hover:bg-pink-200 hover:border-pink-400`;
    } else if (booked) {
      // Other user's booked slot
      return `${baseClasses} bg-red-100 border-red-300 text-red-700 ${
        isAdmin ? 'hover:bg-red-200' : 'cursor-not-allowed opacity-60'
      }`;
    } else if (isSelected) {
      // Selected slot
      return `${baseClasses} bg-yellow-200 border-yellow-400 text-gray-800`;
    } else {
      // Available slot
      return `${baseClasses} bg-green-100 border-green-300 text-green-700 hover:bg-green-200 hover:border-green-400`;
    }
  };

  const renderSlotContent = (laneId, timeSlot) => {
    const reservationInfo = getReservationInfo(laneId, timeSlot);
    const isOwnReservation = isUserOwnReservation(laneId, timeSlot);
    const blocked = isSlotBlocked(laneId, timeSlot);
    const booked = isSlotBooked(laneId, timeSlot);
    
    if (blocked) {
      // Blocked slot
      const blockInfo = reservations.find(r => 
        r.lane_id === laneId && 
        (r.time_slot === timeSlot || r.time_slot === `${timeSlot}:00`) &&
        r.status === 'blocked'
      );
      
      return (
        <div className="text-center">
          <div className="font-semibold">{timeSlot}</div>
          <div className="text-xs mt-1">
            {isAdmin ? (
              <>
                <div className="font-medium">Bloke</div>
                <div className="text-xs mt-1">{blockInfo?.cancellation_reason}</div>
              </>
            ) : (
              <div className="text-gray-600 font-medium">
                Müsait Değil
              </div>
            )}
          </div>
        </div>
      );
    } else if (reservationInfo && isAdmin && booked) {
      return (
        <div className="text-center">
          <div className="font-semibold">{timeSlot}</div>
          <div className="text-xs mt-1">
            {reservationInfo.customers?.first_name} {reservationInfo.customers?.last_name}
          </div>
          <div className="text-xs">
            {reservationInfo.customers?.phone_number}
          </div>
        </div>
      );
    } else if (isOwnReservation) {
      return (
        <div className="text-center">
          <div className="font-semibold">{timeSlot}</div>
          <div className="text-xs mt-1 text-pink-600">Rezervasyonunuz</div>
          <div className="text-xs mt-1 px-2 py-1 bg-pink-200 rounded text-pink-700 font-medium">
            İptal Et
          </div>
        </div>
      );
    } else if (booked) {
      return (
        <div className="text-center">
          <div className="font-semibold">{timeSlot}</div>
          <div className="text-xs mt-1">Dolu</div>
        </div>
      );
    } else {
      return (
        <div className="text-center">
          <div className="font-semibold">{timeSlot}</div>
          <div className="text-xs mt-1">Müsait</div>
        </div>
      );
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Time slot header with select all buttons */}
      {isAdmin && multiSelectMode && (
        <div className={`grid gap-2 sm:gap-6 mb-4 ${isAdmin ? 'grid-cols-4' : 'grid-cols-3'}`}>
          {isAdmin && <div></div>} {/* Empty space for time labels column */}
          {lanes.map(laneId => (
            <div key={laneId} className="text-center">
              <button
                onClick={() => onSelectAllLane && onSelectAllLane(laneId)}
                className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded flex items-center justify-center mx-auto"
                title={`Kulvar ${laneId} tümünü seç`}
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                Tümü
              </button>
            </div>
          ))}
        </div>
      )}

      <div className={`grid gap-2 sm:gap-6 ${isAdmin ? 'grid-cols-4' : 'grid-cols-3'}`}>
        {/* Time labels column - only for admin */}
        {isAdmin && (
          <div className="space-y-0">
            <div className="h-12 flex items-center justify-center">
              <h3 className="text-lg font-semibold text-gray-700">Saat</h3>
            </div>
            {timeSlots.map(timeSlot => (
              <div key={timeSlot} className="h-[100px] flex items-center justify-between pr-2">
                <span className="text-sm font-medium text-gray-600">{timeSlot}</span>
                {multiSelectMode && (
                  <button
                    onClick={() => onSelectAllTime && onSelectAllTime(timeSlot)}
                    className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-1 py-1 rounded"
                    title={`${timeSlot} saatini tüm kulvarlar için seç`}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Lane columns */}
        {lanes.map(laneId => (
          <div key={laneId} className="space-y-0">
            <div className="h-12 flex items-center justify-center">
              <h3 className="text-lg font-semibold text-gray-700">
                {t('lane')} {laneId}
              </h3>
            </div>
            
            {timeSlots.map(timeSlot => (
              <div
                key={`${laneId}-${timeSlot}`}
                className={getSlotClassName(laneId, timeSlot)}
                onClick={() => handleSlotClick(laneId, timeSlot)}
              >
                {renderSlotContent(laneId, timeSlot)}
                {multiSelectMode && selectedSlots.includes(`${laneId}-${timeSlot}`) && (
                  <div className="absolute top-1 right-1">
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimeSlotGrid;
