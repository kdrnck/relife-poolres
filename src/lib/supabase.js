import { createClient } from '@supabase/supabase-js';

// Environment variables'dan değerleri al
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Güvenlik kontrolü - production'da bu değerler mutlaka .env'den gelmeli
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase environment variables eksik!');
  console.error('📁 .env dosyasını kontrol edin:');
  console.error('   VITE_SUPABASE_URL=your_supabase_url');
  console.error('   VITE_SUPABASE_ANON_KEY=your_anon_key');
  throw new Error('Supabase environment variables are missing! Please check your .env file.');
}

// Debug: Sadece URL'nin varlığını kontrol et (güvenlik için tam URL'yi gösterme)
console.log('✅ Supabase environment variables loaded successfully');
console.log('🔗 URL domain:', supabaseUrl.split('.')[0].split('//')[1]);


export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Veritabanı tabloları için yardımcı fonksiyonlar
export const dbHelpers = {
  // Telefon numarasıyla müşteri kontrolü
  async checkCustomerByPhone(phoneNumber) {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
    return data;
  },

  // Yeni müşteri oluşturma (eğer telefon numarası varsa mevcut kullanıcıyı döner)
  async createCustomer(phoneNumber, firstName, lastName) {
    // Önce telefon numarasıyla kontrol et
    const existingCustomer = await this.checkCustomerByPhone(phoneNumber);
    if (existingCustomer) {
      return existingCustomer;
    }

    // Telefon numarası yoksa yeni müşteri oluştur
    const { data, error } = await supabase
      .from('customers')
      .insert([{ 
        phone_number: phoneNumber,
        first_name: firstName,
        last_name: lastName
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Müşterinin geçmiş randevularını getirme
  async getCustomerReservations(customerId) {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('customer_id', customerId)
      .eq('status', 'active')
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Rezervasyon oluşturma
  async createReservation(customerId, date, timeSlot, laneId) {
    const { data, error } = await supabase
      .from('reservations')
      .insert([{
        customer_id: customerId,
        date,
        time_slot: timeSlot,
        lane_id: laneId
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Belirli tarih için rezervasyonları getirme
  async getReservationsByDate(date) {
    const { data, error } = await supabase
      .from('reservations')
      .select(`
        *,
        customers (
          first_name,
          last_name,
          phone_number
        )
      `)
      .eq('date', date)
      .in('status', ['active', 'blocked'])
      .order('time_slot');
    
    if (error) throw error;
    return data;
  },

  // Rezervasyon iptal etme
  async cancelReservation(reservationId, reason = '') {
    const { data, error } = await supabase
      .from('reservations')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: 'admin',
        cancellation_reason: reason
      })
      .eq('id', reservationId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Müsait saatleri getirme
  async getAvailableSlots(date) {
    const { data, error } = await supabase
      .rpc('get_available_slots', { target_date: date });
    
    if (error) throw error;
    return data;
  },

  // Çalışma saatlerini getirme
  async getWorkingHours() {
    const { data, error } = await supabase
      .from('working_hours')
      .select('*')
      .eq('is_active', true)
      .order('day_of_week');
    
    if (error) throw error;
    return data;
  },

    // Saat slotlarını getirme
    async getTimeSlots() {
      const { data, error } = await supabase
        .from('time_slots')
        .select('*')
        .eq('is_globally_active', true)
        .order('time_slot');

      if (error) throw error;
      return data;
    },

    // Saatleri bloke etme (tek seferlik)
    async blockSlots(slots, reason, date) {
      console.log('🔄 blockSlots called with:', { slots, reason, date });
      
      const reservations = slots.map(slot => {
        const [laneId, timeSlot] = slot.split('-');
        return {
          date,
          time_slot: timeSlot,
          lane_id: parseInt(laneId),
          customer_id: null, // Bloke edilmiş saatler için customer_id null
          status: 'blocked',
          cancellation_reason: reason,
          cancelled_by: 'admin',
          cancelled_at: new Date().toISOString()
        };
      });

      console.log('📝 Inserting reservations:', reservations);

      const { data, error } = await supabase
        .from('reservations')
        .insert(reservations)
        .select();

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }
      
      console.log('✅ Insert successful:', data);
      return data;
    },

    // Saatleri tekrarlayan şekilde bloke etme
    async blockSlotsRecurring(slots, reason, startDate, weeksCount = 26) {
      const { v4: uuidv4 } = await import('uuid');
      const recurringId = uuidv4();
      
      const allReservations = [];
      const start = new Date(startDate);
      
      for (let week = 0; week < weeksCount; week++) {
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + (week * 7));
        const dateStr = currentDate.toISOString().split('T')[0];
        
        const weekReservations = slots.map(slot => {
          const [laneId, timeSlot] = slot.split('-');
          return {
            date: dateStr,
            time_slot: timeSlot,
            lane_id: parseInt(laneId),
            customer_id: null,
            status: 'blocked',
            cancellation_reason: reason,
            cancelled_by: 'admin',
            cancelled_at: new Date().toISOString(),
            recurring_id: recurringId
          };
        });
        
        allReservations.push(...weekReservations);
      }

      const { data, error } = await supabase
        .from('reservations')
        .insert(allReservations)
        .select();

      if (error) throw error;
      return data;
    },

    // Tekrarlayan blokajı tamamen silme (recurring_id ile)
    async deleteRecurringBlock(recurringId) {
      const { data, error } = await supabase
        .from('reservations')
        .delete()
        .eq('recurring_id', recurringId)
        .eq('status', 'blocked');

      if (error) throw error;
      return data;
    },

    // Tekrarlayan blokajı iptal etme (status'ü cancelled yap)
    async cancelRecurringBlock(recurringId) {
      const { data, error } = await supabase
        .from('reservations')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: 'admin',
          cancellation_reason: 'Tekrarlayan blokaj iptal edildi'
        })
        .eq('recurring_id', recurringId)
        .eq('status', 'blocked')
        .select();

      if (error) throw error;
      return data;
    },

    // Belirli tarihten itibaren tekrarlayan blokajı iptal etme
    async cancelRecurringBlockFromDate(recurringId, fromDate) {
      const { data, error } = await supabase
        .from('reservations')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: 'admin',
          cancellation_reason: 'Tekrarlayan blokaj - bu tarihten itibaren iptal edildi'
        })
        .eq('recurring_id', recurringId)
        .eq('status', 'blocked')
        .gte('date', fromDate)
        .select();

      if (error) throw error;
      return data;
    }
  };
