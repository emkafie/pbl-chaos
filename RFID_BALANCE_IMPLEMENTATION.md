# 💳 RFID Card Balance Deduction System

## Overview
Sistem pengurangan saldo otomatis untuk kartu RFID saat pengguna melakukan checkout (keluar parkir).

## Implementation Details

### 1. **Service Layer** (`app/lib/rfidCardService.ts`)
File baru yang berisi logic untuk mengelola saldo RFID card di Firestore.

#### Methods:
- **`getCardBalance(db, rfidUid)`** - Ambil saldo kartu berdasarkan RFID UID
- **`deductBalance(db, rfidUid, amount)`** - Kurangi saldo kartu (dengan validasi balance)
- **`addBalance(db, rfidUid, amount)`** - Tambah saldo kartu (untuk top-up)

#### Error Handling:
- `CARD_NOT_FOUND` - Kartu RFID tidak terdaftar di `rfid_cards` collection
- `INSUFFICIENT_BALANCE` - Saldo kartu tidak cukup untuk bayar biaya parkir

### 2. **Integration Points**

#### A. Real Hardware MQTT (`hooks/useParkingMQTT.ts`)
Saat event `KELUAR_DIIZINKAN` diterima dari hardware gate RFID:
```typescript
// Setelah update session status ke "completed"
const newBalance = await RFIDCardService.deductBalance(db, uid, fee);
```

**Alur:**
1. Kartu RFID di-tap di exit gate
2. Hardware mengirim event `KELUAR_DIIZINKAN` via MQTT
3. Session diupdate dengan status "completed" dan fee
4. **Saldo kartu otomatis berkurang sesuai fee**
5. Log ditampilkan di console MQTT

#### B. Simulation Mode (`components/iot-config/page.tsx`)
Saat admin melakukan "Time Warp Checkout" di IoT Config page:
```typescript
// Di handleSimulateCheckout()
const newBalance = await RFIDCardService.deductBalance(db, session.rfid_uid, fee);
```

### 3. **Firestore Structure**

**Collection: `rfid_cards`**
```json
{
  "docId": "8B 36 D5 05",  // RFID UID sebagai doc ID
  "saldo": 150000,          // Saldo dalam Rupiah
  "owner": "John Doe",      // Opsional
  "last_transaction": "2026-06-08T10:30:00.000Z",  // Kapan terakhir transaksi
  "created_at": "2026-01-01T00:00:00.000Z"
}
```

### 4. **Fee Calculation**
- **Tarif:** Rp5.000 per jam
- **Formula:** `Math.ceil(durationMinutes / 60) * 5000`
- Contoh: 30 menit = Rp5.000, 61 menit = Rp10.000

### 5. **Error Messages to User**

| Error | Message | Aksi |
|-------|---------|------|
| INSUFFICIENT_BALANCE | "⚠️ Saldo kartu tidak cukup! Dibutuhkan: Rp[amount]" | Pengguna harus top-up saldo |
| CARD_NOT_FOUND | "❌ Kartu RFID tidak terdaftar dalam sistem pembayaran" | Admin harus register card di `rfid_cards` |
| DEDUCT_BALANCE_FAILED | "❌ Gagal memproses pembayaran. [error detail]" | Cek koneksi Firestore |

### 6. **Logging**
- Console log: `✅ Balance deducted for [UID]: Rp[amount] | New balance: Rp[newBalance]`
- User-facing log via `setLastLog()` di MQTT hook

## Testing Checklist

- [ ] Verifikasi rfid_cards collection sudah ada di Firestore
- [ ] Verifikasi ada test data RFID card dengan saldo
- [ ] Test checkout via hardware MQTT → saldo berkurang
- [ ] Test checkout via Time Warp → saldo berkurang
- [ ] Test insufficient balance error → reject checkout
- [ ] Test card not found error → show error message
- [ ] Verify balance di Firestore updated correctly

## Future Enhancements

1. Add transaction history tracking
2. Email notification saat balance < threshold
3. Automatic top-up via payment gateway integration
4. Wallet page UI untuk view balance dan transaction history
5. Add daily balance report untuk admin

## Files Modified

1. ✅ Created: `app/lib/rfidCardService.ts`
2. ✅ Modified: `hooks/useParkingMQTT.ts` - Added import & balance deduction logic
3. ✅ Modified: `components/iot-config/page.tsx` - Added import & balance deduction in simulation

---

**Last Updated:** 2026-06-08
