import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  tr: {
    translation: {
      // Landing Page
      welcome: "ReLife Club'a Hoş Geldiniz",
      yourName: "İsminiz",
      namePlaceholder: "Ahmet B.",
      phoneNumber: "Telefon Numaranız", 
      phonePlaceholder: "05*********",
      next: "İleri",
      phoneValidationError: "Telefon numarası 11 haneli olmalı ve 0 ile başlamalıdır",
      
      // Booking Interface
      selectDate: "Tarih Seçin",
      lane: "Kulvar",
      confirmReservation: "Rezervasyonu Onayla",
      bookingConfirmation: "{{lane}} kulvarı için {{date}} tarihinde {{time}} saatinde rezervasyon yapmak istediğinizden emin misiniz?",
      confirmBooking: "Rezervasyonu Onayla",
      cancel: "İptal",
      
      // Days of week
      monday: "Pazartesi",
      tuesday: "Salı", 
      wednesday: "Çarşamba",
      thursday: "Perşembe",
      friday: "Cuma",
      saturday: "Cumartesi",
      sunday: "Pazar",
      
      // Months
      january: "Ocak",
      february: "Şubat",
      march: "Mart",
      april: "Nisan",
      may: "Mayıs",
      june: "Haziran",
      july: "Temmuz",
      august: "Ağustos",
      september: "Eylül",
      october: "Ekim",
      november: "Kasım",
      december: "Aralık",
      
      // Admin Panel
      adminLogin: "Admin Girişi",
      username: "Kullanıcı Adı",
      password: "Şifre",
      login: "Giriş Yap",
      adminDashboard: "Admin Paneli",
      addReservation: "Rezervasyon Ekle",
      cancelReservation: "Rezervasyonu İptal Et",
      deleteConfirmation: "{{customerName}} için {{date}} tarihinde {{time}} saatindeki rezervasyonu silmek istediğinizden emin misiniz?",
      blockTimeslot: "Bu Saati Engelle",
      blockRecurring: "Bu saati her hafta engelle",
      cancelOnlyThis: "Sadece Bu Seansı İptal Et",
      cancelAllFuture: "Bu ve Gelecekteki Tüm Seansları İptal Et",
      
      // Pool Rules
      poolRules: "Havuz Kuralları",
      poolRulesTitle: "Havuz Kuralları",
      poolRule1: "Havuza girmeden önce duş alınması zorunludur.",
      poolRule2: "Bone takmak mecburidir. Bonesiz havuza girilmez.",
      poolRule3: "Havuz çevresinde yalnızca temiz havuz terliği kullanılmalıdır.",
      poolRule4: "Havuz kenarında koşmak ve tehlikeli hareketler yapmak yasaktır.",
      poolRule5: "Havuza atlamak kesinlikle yasaktır.",
      poolRule6: "Havuz alanına yiyecek, içecek ve cam eşya sokulması yasaktır.",
      poolRule7: "12 yaşından küçük çocuklar ebeveynleri olmadan havuza giremez.",
      poolRule8: "Lütfen çevrenizdeki diğer misafirleri rahatsız edecek davranışlardan kaçının.",
      poolRulesThanks: "İş birliğiniz için teşekkür ederiz.",
      continueToBooking: "Randevu Ekranına Devam Et"
    }
  },
  en: {
    translation: {
      // Landing Page
      welcome: "Welcome to ReLife Club",
      yourName: "Your Name",
      namePlaceholder: "John D.",
      phoneNumber: "Your Phone Number",
      phonePlaceholder: "05*********",
      next: "Next",
      phoneValidationError: "Phone number must be 11 digits and start with 0",
      
      // Booking Interface  
      selectDate: "Select Date",
      lane: "Lane",
      confirmReservation: "Confirm Reservation",
      bookingConfirmation: "Are you sure you want to book a session for {{lane}} on {{date}} at {{time}}?",
      confirmBooking: "Confirm Booking",
      cancel: "Cancel",
      
      // Days of week
      monday: "Monday",
      tuesday: "Tuesday",
      wednesday: "Wednesday", 
      thursday: "Thursday",
      friday: "Friday",
      saturday: "Saturday",
      sunday: "Sunday",
      
      // Months
      january: "January",
      february: "February",
      march: "March",
      april: "April",
      may: "May", 
      june: "June",
      july: "July",
      august: "August",
      september: "September",
      october: "October",
      november: "November",
      december: "December",
      
      // Admin Panel
      adminLogin: "Admin Login",
      username: "Username",
      password: "Password", 
      login: "Login",
      adminDashboard: "Admin Dashboard",
      addReservation: "Add Reservation",
      cancelReservation: "Cancel Reservation",
      deleteConfirmation: "Are you sure you want to delete the reservation for {{customerName}} at {{time}} on {{date}}?",
      blockTimeslot: "Block This Timeslot",
      blockRecurring: "Block this timeslot every week",
      cancelOnlyThis: "Cancel Only This Session",
      cancelAllFuture: "Cancel This and All Future Recurring Sessions",
      
      // Pool Rules
      poolRules: "Pool Rules",
      poolRulesTitle: "Pool Rules",
      poolRule1: "Showering is required before entering the pool.",
      poolRule2: "Wearing a swim cap is mandatory. Entry without a cap is not allowed.",
      poolRule3: "Only clean pool slippers/flip-flops should be used in the pool area.",
      poolRule4: "Running and dangerous activities around the pool deck are forbidden.",
      poolRule5: "Diving or jumping into the pool is strictly forbidden.",
      poolRule6: "Bringing food, drinks, and glass items into the pool area is not allowed.",
      poolRule7: "Children under 12 cannot enter the pool without their parents.",
      poolRule8: "Please avoid any behavior that may disturb other guests.",
      poolRulesThanks: "Thank you for your cooperation.",
      continueToBooking: "Continue to Booking"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'tr', // default language
    fallbackLng: 'tr',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
