# ReLife Club Havuz Rezervasyon Sistemi - Kurulum Rehberi

## 🏊‍♀️ Proje Açıklaması

Bu proje, ReLife Club spor salonu için havuz rezervasyon sistemidir. Kullanıcılar havuz kulvarları için rezervasyon yapabilir, adminler ise rezervasyonları yönetebilir.

## 🚀 Özellikler

### Kullanıcı Özellikleri:
- İsim ve telefon numarası ile kayıt
- 7 gün ileri tarih rezervasyon yapabilme
- 3 havuz kulvarı (Lane 1, 2, 3)
- 10:00-19:00 arası saatlik slotlar
- TR/EN dil desteği
- Rezervasyon onay modalı

### Admin Özellikleri:
- Korumalı admin paneli (aylinbekar / relifehavuz2023)
- Tüm rezervasyonları görme ve silme
- Manuel rezervasyon ekleme
- Tekrarlayan rezervasyonlar (haftalık)
- Sınırsız tarih erişimi

## 📋 Kurulum Adımları

### 1. Supabase Projesi Oluşturma

1. [Supabase](https://supabase.com) hesabınıza giriş yapın
2. Yeni proje oluşturun
3. Proje URL'si ve API Key'ini kopyalayın

### 2. Veritabanı Tablolarını Oluşturma

Supabase SQL editöründe aşağıdaki komutları çalıştırın:

```sql
-- Customers tablosu
CREATE TABLE customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  phone_number TEXT NOT NULL
);

-- Reservations tablosu
CREATE TABLE reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  lane_id INTEGER NOT NULL CHECK (lane_id IN (1, 2, 3)),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  recurring_id UUID,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'blocked')),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancelled_by TEXT,
  cancellation_reason TEXT
);

-- İndeksler
CREATE INDEX idx_reservations_date ON reservations(date);
CREATE INDEX idx_reservations_recurring_id ON reservations(recurring_id);

-- *** MEVCUT TABLO İÇİN KOLON EKLEMESİ ***
-- Eğer tablo zaten varsa, aşağıdaki komutları çalıştırın:
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancelled_by TEXT,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Mevcut tüm rezervasyonların status'ünü active yap
UPDATE reservations SET status = 'active' WHERE status IS NULL;

-- Status check constraint'ini güncellemek için (eğer gerekirse)
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_status_check;
ALTER TABLE reservations ADD CONSTRAINT reservations_status_check 
  CHECK (status IN ('active', 'cancelled', 'blocked'));

-- customer_id kolonunun NULL değer kabul etmesini sağla (bloke edilmiş saatler için)
ALTER TABLE reservations ALTER COLUMN customer_id DROP NOT NULL;
```

### 3. Supabase Konfigürasyonu

`src/lib/supabase.js` dosyasında aşağıdaki değerleri güncelleyin:

```javascript
const supabaseUrl = 'SUPABASE_PROJECT_URL';
const supabaseAnonKey = 'SUPABASE_ANON_KEY';
```

### 4. Proje Çalıştırma

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev
```

## 🔧 Kullanım

### Kullanıcı Akışı:
1. Ana sayfada isim ve telefon numarası gir
2. Rezervasyon sayfasında tarih ve saat seç
3. Rezervasyonu onayla

### Admin Akışı:
1. `/admin` adresine git
2. Kullanıcı adı: `aylinbekar`, Şifre: `relifehavuz2023`
3. Rezervasyonları görüntüle ve yönet

## 🛠 Teknik Detaylar

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Routing**: React Router Dom
- **Çoklu Dil**: react-i18next
- **Tarih İşlemleri**: date-fns
- **UUID**: uuid

## 🎨 Tasarım

- Marka rengi: #edc700 (sarı)
- Minimalist ve temiz tasarım
- Responsive (mobil uyumlu)
- Accessibility standartlarına uygun

## 📱 Sayfa Yapısı

- `/` - Ana sayfa (kullanıcı kayıt)
- `/booking` - Rezervasyon sayfası
- `/admin` - Admin giriş
- `/admin/dashboard` - Admin paneli

## 🔐 Güvenlik

- Admin paneli session tabanlı koruma
- Form validasyonları
- SQL injection koruması (Supabase RLS)

## 🚨 Önemli Notlar

1. Supabase konfigürasyonunu mutlaka yapın
2. Telefon numarası 11 haneli ve 0 ile başlamalı
3. Kullanıcılar sadece 7 gün ileri rezervasyon yapabilir
4. Admin sınırsız tarih erişimine sahip

## 🆘 Sorun Giderme

**Supabase bağlantı hatası:**
- URL ve API key'leri kontrol edin
- Tablolar doğru şekilde oluşturulmuş mu kontrol edin

**Tarih gösterimi hatalı:**
- date-fns locale ayarlarını kontrol edin
- Tarayıcı dil ayarlarını kontrol edin

**Admin girişi çalışmıyor:**
- Kullanıcı adı: `aylinbekar`
- Şifre: `relifehavuz2023`
- Büyük/küçük harf duyarlı

## 📞 Destek

Herhangi bir sorun yaşarsanız, proje geliştiricisi ile iletişime geçin.
