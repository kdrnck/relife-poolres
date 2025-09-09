import { Routes, Route } from 'react-router-dom';
import { NotificationProvider } from './components/NotificationSystem';
import WhatsAppButton from './components/WhatsAppButton';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import RegisterPage from './pages/RegisterPage';
import WelcomeScreen from './components/WelcomeScreen';
import BookingPage from './pages/BookingPage';
import BookingSuccess from './pages/BookingSuccess';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <NotificationProvider>
      <div className="min-h-screen flex flex-col">
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/welcome" element={<WelcomeScreen />} />
            <Route path="/booking" element={<BookingPage />} />
            <Route path="/booking-success" element={<BookingSuccess />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Routes>
        </div>
        <Footer />
      </div>
      <WhatsAppButton />
    </NotificationProvider>
  );
}

export default App
