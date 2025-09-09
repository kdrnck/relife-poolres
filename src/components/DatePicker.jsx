import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { format, addDays, subDays, isAfter, startOfDay } from 'date-fns';
import { tr as trLocale, enUS } from 'date-fns/locale';

const DatePicker = ({ selectedDate, onDateChange, maxDaysFromToday = null, isAdmin = false }) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'tr' ? trLocale : enUS;

  const formatDate = (date) => {
    const dayName = format(date, 'EEEE', { locale });
    const day = format(date, 'd', { locale });
    const month = format(date, 'MMMM', { locale });
    const year = format(date, 'yyyy', { locale });
    
    return `${day} ${month} ${year} - ${dayName}`;
  };

  const canGoToPrevious = () => {
    if (isAdmin) return true; // Admin can go to any past date
    const previousDay = subDays(selectedDate, 1);
    return isAfter(previousDay, startOfDay(new Date())) || 
           format(previousDay, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  };

  const canGoToNext = () => {
    if (isAdmin) return true; // Admin has no restrictions
    if (!maxDaysFromToday) return true;
    
    const nextDay = addDays(selectedDate, 1);
    const maxDate = addDays(startOfDay(new Date()), maxDaysFromToday);
    return !isAfter(nextDay, maxDate);
  };

  const handlePreviousDay = () => {
    if (canGoToPrevious()) {
      onDateChange(subDays(selectedDate, 1));
    }
  };

  const handleNextDay = () => {
    if (canGoToNext()) {
      onDateChange(addDays(selectedDate, 1));
    }
  };

  return (
    <div className="flex items-center justify-center space-x-4 mb-8">
      <button
        onClick={handlePreviousDay}
        disabled={!canGoToPrevious()}
        className={`p-2 rounded-full transition-colors ${
          canGoToPrevious()
            ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="text-xl font-semibold text-gray-800 min-w-max">
        {formatDate(selectedDate)}
      </div>

      <button
        onClick={handleNextDay}
        disabled={!canGoToNext()}
        className={`p-2 rounded-full transition-colors ${
          canGoToNext()
            ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};

export default DatePicker;
