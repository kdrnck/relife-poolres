import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';

const WelcomeScreen = ({ customerName: propCustomerName, onContinue }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [showContent, setShowContent] = useState(false);
  
  // Get customer name from props or location state
  const { customerName: stateCustomerName, userData } = location.state || {};
  const customerName = propCustomerName || stateCustomerName;

  useEffect(() => {
    // Animasyon için kısa bir gecikme
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const handleContinue = () => {
    setShowContent(false);
    // Geçiş animasyonu için kısa bir gecikme
    setTimeout(() => {
      if (onContinue) {
        onContinue();
      } else {
        // If no onContinue prop, navigate to booking
        navigate('/booking');
      }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 flex items-center justify-center px-4">
      <div className="text-center">
        <div className={`transform transition-all duration-1000 ${
          showContent ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'
        }`}>
          {/* ReLife Club Logo/Title */}
          <div className="mb-8">
            <h1 className="text-6xl font-bold text-gray-900 mb-4 drop-shadow-lg">
              ReLife Club
            </h1>
            <div className="w-24 h-1 bg-gray-900 mx-auto rounded-full"></div>
          </div>

          {/* Welcome Message */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl mx-auto mb-8">
            <div className="mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">
                Hoşgeldiniz, <span className="text-yellow-600">{customerName}</span>!
              </h2>
              <p className="text-lg text-gray-600 text-center">
                ReLife Club havuz rezervasyon sistemimize hoşgeldiniz
              </p>
            </div>

            {/* Pool Rules Section */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4 text-center flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                {t('poolRulesTitle')}
              </h3>
              
              <div className="bg-blue-50 rounded-2xl p-6 max-h-80 overflow-y-auto">
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex items-start space-x-3">
                    <span className="text-blue-600 font-bold">1.</span>
                    <span>{t('poolRule1')}</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-blue-600 font-bold">2.</span>
                    <span>{t('poolRule2')}</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-blue-600 font-bold">3.</span>
                    <span>{t('poolRule3')}</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-blue-600 font-bold">4.</span>
                    <span>{t('poolRule4')}</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-blue-600 font-bold">5.</span>
                    <span>{t('poolRule5')}</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-blue-600 font-bold">6.</span>
                    <span>{t('poolRule6')}</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-blue-600 font-bold">7.</span>
                    <span>{t('poolRule7')}</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-blue-600 font-bold">8.</span>
                    <span>{t('poolRule8')}</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <p className="text-center text-blue-800 font-semibold">
                    {t('poolRulesThanks')}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleContinue}
              className="w-full bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <div className="flex items-center justify-center space-x-2">
                <span>{t('continueToBooking')}</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </button>
          </div>

          {/* Loading Animation */}
          <div className="flex justify-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
