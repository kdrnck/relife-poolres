// Geliştirme için mock data
let mockCustomers = [];
let mockReservations = [];

export const mockDbHelpers = {
  async createCustomer(name, phoneNumber) {
    const customer = {
      id: Date.now().toString(),
      name,
      phone_number: phoneNumber,
      created_at: new Date().toISOString()
    };
    mockCustomers.push(customer);
    return customer;
  },

  async createReservation(customerId, date, timeSlot, laneId, recurringId = null) {
    const reservation = {
      id: Date.now().toString() + Math.random(),
      customer_id: customerId,
      date,
      time_slot: timeSlot,
      lane_id: laneId,
      recurring_id: recurringId,
      created_at: new Date().toISOString(),
      customers: customerId ? mockCustomers.find(c => c.id === customerId) : null
    };
    mockReservations.push(reservation);
    return reservation;
  },

  async getReservationsByDate(date) {
    const reservations = mockReservations.filter(r => r.date === date);
    return reservations.map(r => ({
      ...r,
      customers: r.customer_id ? mockCustomers.find(c => c.id === r.customer_id) : null
    }));
  },

  async deleteReservation(reservationId) {
    mockReservations = mockReservations.filter(r => r.id !== reservationId);
  },

  async deleteRecurringReservations(recurringId, fromDate) {
    mockReservations = mockReservations.filter(r => 
      !(r.recurring_id === recurringId && r.date >= fromDate)
    );
  }
};

// Başlangıç için bazı örnek reservasyonlar ekleyelim
const today = new Date().toISOString().split('T')[0];

// Örnek müşteriler
const sampleCustomer1 = {
  id: 'customer1',
  name: 'Ahmet Yılmaz',
  phone_number: '05551234567'
};

const sampleCustomer2 = {
  id: 'customer2', 
  name: 'Ayşe Kaya',
  phone_number: '05559876543'
};

mockCustomers.push(sampleCustomer1, sampleCustomer2);

// Örnek rezervasyonlar
mockReservations.push(
  {
    id: 'res1',
    customer_id: 'customer1',
    date: today,
    time_slot: '10:00',
    lane_id: 1,
    recurring_id: null,
    customers: sampleCustomer1
  },
  {
    id: 'res2',
    customer_id: 'customer2',
    date: today,
    time_slot: '14:00',
    lane_id: 2,
    recurring_id: null,
    customers: sampleCustomer2
  }
);
