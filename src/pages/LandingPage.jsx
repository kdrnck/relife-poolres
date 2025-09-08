import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import LanguageToggle from '../components/LanguageToggle';
import WelcomeScreen from '../components/WelcomeScreen';
import { dbHelpers } from '../lib/supabase';

const LandingPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    phoneNumber: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [customerData, setCustomerData] = useState(null);

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^0\d{10}$/;
    return phoneRegex.test(phone);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const newErrors = {};

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Telefon numarası gerekli';
    } else if (!validatePhoneNumber(formData.phoneNumber)) {
      newErrors.phoneNumber = t('phoneValidationError');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      // Telefon numarasıyla müşteri kontrolü yap
      const { dbHelpers } = await import('../lib/supabase');
      const existingCustomer = await dbHelpers.checkCustomerByPhone(formData.phoneNumber);
      
      if (existingCustomer) {
        // Kayıtlı müşteri - hoşgeldin ekranını göster
        setCustomerData({
          customerId: existingCustomer.id,
          firstName: existingCustomer.first_name,
          lastName: existingCustomer.last_name,
          phoneNumber: existingCustomer.phone_number,
          isExisting: true
        });
        setShowWelcome(true);
      } else {
        // Yeni müşteri - isim soyisim sayfasına git
        localStorage.setItem('phoneNumber', formData.phoneNumber);
        navigate('/register');
      }
    } catch (error) {
      console.error('Error checking customer:', error);
      setErrors({ phoneNumber: 'Bir hata oluştu, lütfen tekrar deneyin.' });
    } finally {
      setLoading(false);
    }
  };

  const handleWelcomeContinue = () => {
    // Müşteri verilerini localStorage'a kaydet
    localStorage.setItem('userData', JSON.stringify(customerData));
    // Booking sayfasına yönlendir
    navigate('/booking');
  };

  // Hoşgeldin ekranını göster
  if (showWelcome && customerData) {
    return (
      <WelcomeScreen 
        customerName={`${customerData.firstName} ${customerData.lastName}`}
        onContinue={handleWelcomeContinue}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 flex items-center justify-center px-4">
      <LanguageToggle />
      
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-10 border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-2">
            ReLife Club
          </h1>
          <p className="text-xl text-gray-600 font-medium">
            Havuz Rezervasyon Sistemi
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
              {t('phoneNumber')}
            </label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              placeholder={t('phonePlaceholder')}
              className={`w-full px-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 transition-all duration-200 text-lg font-medium ${
                errors.phoneNumber 
                  ? 'border-red-400 focus:ring-red-300 focus:border-red-500' 
                  : 'border-gray-200 focus:border-yellow-400 focus:ring-yellow-300'
              }`}
            />
            {errors.phoneNumber && (
              <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>
            )}
          </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 font-bold py-4 px-6 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-yellow-300 focus:ring-offset-2 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              style={{ backgroundColor: '#edc700' }}
            >
            {loading ? 'Kontrol ediliyor...' : t('next')}
          </button>
        </form>
        
        {/* Admin Giriş Butonu */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/admin')}
            className="w-full mt-6 bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Yönetici Girişi</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
