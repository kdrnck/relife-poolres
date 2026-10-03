import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import LanguageToggle from '../components/LanguageToggle';
import { dbHelpers } from '../lib/supabase';

const RegisterPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    // Get phone number from localStorage
    const storedPhone = localStorage.getItem('phoneNumber');
    if (!storedPhone) {
      navigate('/');
      return;
    }
    setPhoneNumber(storedPhone);
  }, [navigate]);

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
    
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Ad gerekli';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Soyad gerekli';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      // Check if phone number already exists
      const existingCustomer = await dbHelpers.checkCustomerByPhone(phoneNumber);
      if (existingCustomer) {
        setErrors({ general: 'Bu telefon numarası zaten kayıtlı. Lütfen farklı bir telefon numarası kullanın.' });
        setLoading(false);
        return;
      }

      // Create new customer
      const customer = await dbHelpers.createCustomer(
        phoneNumber,
        formData.firstName,
        formData.lastName
      );

      // Store user data
      const userData = {
        customerId: customer.id,
        firstName: customer.first_name,
        lastName: customer.last_name,
        phoneNumber: customer.phone_number,
        isExisting: false
      };
      
      localStorage.setItem('userData', JSON.stringify(userData));
      
      // Clean up temporary phone number
      localStorage.removeItem('phoneNumber');
      
      // Navigate to welcome screen with rules
      navigate('/welcome', {
        state: {
          customerName: `${customer.first_name} ${customer.last_name}`,
          userData: userData
        }
      });
    } catch (error) {
      console.error('Error creating customer:', error);
      setErrors({ general: 'Kayıt oluşturulurken bir hata oluştu.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <LanguageToggle />
      
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-4">
          Kayıt Ol
        </h1>
        
        <p className="text-center text-gray-600 mb-8">
          {phoneNumber} numaralı telefon için bilgilerinizi tamamlayın
        </p>

        {errors.general && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
              Adınız
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              placeholder="Ahmet"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                errors.firstName 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 focus:border-yellow-500 focus:ring-yellow-500'
              }`}
            />
            {errors.firstName && (
              <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
            )}
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
              Soyadınız
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              placeholder="Yılmaz"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                errors.lastName 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 focus:border-yellow-500 focus:ring-yellow-500'
              }`}
            />
            {errors.lastName && (
              <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
            )}
          </div>

          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{errors.general}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-3 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50"
            style={{ backgroundColor: '#edc700' }}
          >
            {loading ? 'Kayıt oluşturuluyor...' : 'Devam Et'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
