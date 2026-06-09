// ============================================================================
// ESP32 #1 - SMART PARKING GATE CONTROLLER + MQTT (SECURE HIVEMQ CLUSTER)
// Versi Fixed v3.2 - HiveMQ Cloud Integration with SSL/TLS
// ============================================================================

#include <SPI.h>
#include <MFRC522.h>
#include <ESP32Servo.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>                // ← Ditambahkan untuk enkripsi SSL/TLS
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ══════════════════════════════════════════
// ⚙️  KONFIGURASI — EDIT BAGIAN INI
// ══════════════════════════════════════════

// WiFi
const char* WIFI_SSID     = "TEST";
const char* WIFI_PASSWORD = "12345678";

// MQTT (Sesuaikan dengan kredensial dari Access Management HiveMQ Cloud Anda)
const char* MQTT_HOST     = "fead689fb7b5405e880e559823b1ed21.s1.eu.hivemq.cloud"; 
const int   MQTT_PORT     = 8883; // Port aman SSL/TLS HiveMQ

// Kredensial cluster private HiveMQ
const char* MQTT_USER     = "parking";
const char* MQTT_PASS     = "Parkingpass123";

// ══════════════════════════════════════════

// ── PIN RFID ──────────────────────────────
#define SS_MASUK    5
#define SS_KELUAR   21
#define RST_MASUK   27
#define RST_KELUAR  22
#define SCK_PIN     18
#define MOSI_PIN    23
#define MISO_PIN    19

// ── PIN IR SENSOR ─────────────────────────
#define IR_MASUK    34
#define IR_KELUAR   35

// ── PIN SERVO ─────────────────────────────
#define SERVO_MASUK_PIN   13
#define SERVO_KELUAR_PIN  12

// ── PIN LCD I2C ───────────────────────────
#define LCD_SDA  25
#define LCD_SCL  26

// ── SUDUT SERVO ───────────────────────────
#define SERVO_BUKA   90
#define SERVO_TUTUP  0

// ── KAPASITAS PARKIR ──────────────────────
#define SLOT_MAX  4

// ── TIMEOUT & DEBOUNCE ────────────────────
#define TIMEOUT_PALANG      7000UL
#define DEBOUNCE_IR         400UL
#define RFID_COOLDOWN       3000UL
#define LCD_MSG_DURATION    2500UL
#define MQTT_RECONNECT_MS   5000UL
#define PUBLISH_PERIODIC_MS 60000UL

// ── UID KENDARAAN TERDAFTAR ───────────────
const String UID_TERDAFTAR[] = {
  "8B 36 D5 05",
  "43 D1 A3 28",
  "21 48 07 7C",
  "B2 DB 8B 04",
  "05 88 E8 13 33 23 00"
};
const int JUMLAH_UID = sizeof(UID_TERDAFTAR) / sizeof(UID_TERDAFTAR[0]);

// ── STATUS SESI PER UID ───────────────────
bool statusDiDalam[JUMLAH_UID] = { false };

int pendingIndexMasuk  = -1;
int pendingIndexKeluar = -1;

// ── OBJEK ─────────────────────────────────
MFRC522 rfidMasuk(SS_MASUK, RST_MASUK);
MFRC522 rfidKeluar(SS_KELUAR, RST_KELUAR);
Servo   servoMasuk;
Servo   servoKeluar;
LiquidCrystal_I2C lcd(0x27, 16, 2);

WiFiClientSecure wifiClientSecure;          // ← Diubah ke WiFiClientSecure agar aman
PubSubClient mqttClient(wifiClientSecure);   // ← Menggunakan klien aman

// ── STATE MACHINE ─────────────────────────
enum StatePalang { TUTUP, BUKA_MENUNGGU, BUKA_DETEKSI };
StatePalang stateMasuk  = TUTUP;
StatePalang stateKeluar = TUTUP;

unsigned long waktuBukaMasuk   = 0;
unsigned long waktuBukaKeluar  = 0;
unsigned long waktuDeteksiIR_M = 0;
unsigned long waktuDeteksiIR_K = 0;
unsigned long lastRFIDMasuk    = 0;
unsigned long lastRFIDKeluar   = 0;

// ── LCD NON-BLOCKING ──────────────────────
bool          lcdBusy      = false;
unsigned long lcdBusyUntil = 0;

// ── DATA SLOT (dari ESP32 #2 via MQTT) ────
int  slotTerisi           = 0;
int  slotFisik[SLOT_MAX]  = { 0 };
int  slotFisikTerisi      = 0;
bool dataSlotDiterima     = false;

// ── TIMING MQTT ───────────────────────────
unsigned long lastReconnectAttempt = 0;
unsigned long lastPeriodicPublish  = 0;
unsigned long eventCounter         = 0;

// ══════════════════════════════════════════
// FUNGSI: Generate Client ID dari MAC Address
// ══════════════════════════════════════════
String getClientId() {
  uint8_t mac[6];
  WiFi.macAddress(mac);
  char id[24];
  snprintf(id, sizeof(id), "ESP32_%02X%02X%02X%02X%02X%02X",
           mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
  return String(id);
}

// ═══════════════════════════════════════════
// PROTOTYPES
// ═══════════════════════════════════════════
void connectWiFi();
bool mqttReconnect();
void mqttCallback(char* topic, byte* payload, unsigned int length);
void publishGateEvent(String jenis, String uid, int slotSekarang);
void publishGateStatus();
void publishAlert(String pesan);
void bukaPalangMasuk(unsigned long now);
void tutupPalangMasuk(unsigned long now);
void bukaPalangKeluar(unsigned long now);
void tutupPalangKeluar(unsigned long now);
String bacaUID(MFRC522 &rfid);
int   indeksUID(String uid);
void  tampilLCDTemp(String baris1, String baris2, unsigned long now);
void  tampilStatus();
void  updateLCDBusy(unsigned long now);

// ═══════════════════════════════════════════
void setup() {
  Serial.begin(115200);
  Serial.println("\n=== Smart Parking Gate + MQTT Booting v3.2 ===");

  SPI.begin(SCK_PIN, MISO_PIN, MOSI_PIN, -1);
  rfidMasuk.PCD_Init();
  rfidKeluar.PCD_Init();

  byte vM = rfidMasuk.PCD_ReadRegister(MFRC522::VersionReg);
  byte vK = rfidKeluar.PCD_ReadRegister(MFRC522::VersionReg);
  Serial.printf("[RFID Masuk]  Version: 0x%02X %s\n", vM, (vM==0||vM==0xFF)?"[ERROR]":"[OK]");
  Serial.printf("[RFID Keluar] Version: 0x%02X %s\n", vK, (vK==0||vK==0xFF)?"[ERROR]":"[OK]");

  pinMode(IR_MASUK,  INPUT);
  pinMode(IR_KELUAR, INPUT);

  servoMasuk.attach(SERVO_MASUK_PIN);
  servoKeluar.attach(SERVO_KELUAR_PIN);
  servoMasuk.write(SERVO_TUTUP);
  servoKeluar.write(SERVO_TUTUP);
  Serial.println("[OK] Servo init - posisi TUTUP");

  Wire.begin(LCD_SDA, LCD_SCL);
  delay(100);
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0); lcd.print("Smart Parking");
  lcd.setCursor(0, 1); lcd.print("Connecting...");
  lcdBusy      = true;
  lcdBusyUntil = millis() + 3000UL;

  connectWiFi();

  // Konfigurasi WiFiClientSecure sebelum menghubungkan ke broker MQTT
  wifiClientSecure.setInsecure(); // Mengizinkan koneksi SSL tanpa verifikasi sertifikat root CA

  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
  mqttClient.setBufferSize(512);

  // Print client ID yang akan dipakai
  Serial.print("[MQTT] Client ID: ");
  Serial.println(getClientId());

  if (mqttReconnect()) {
    delay(500);
    publishGateStatus();
  }

  Serial.println("=== Sistem Siap ===\n");
}

// ═══════════════════════════════════════════
void loop() {
  unsigned long now = millis();

  // ── Jaga koneksi ───────────────────────
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WiFi] Putus — reconnecting...");
    connectWiFi();
  }

  if (!mqttClient.connected()) {
    if ((now - lastReconnectAttempt) >= MQTT_RECONNECT_MS) {
      lastReconnectAttempt = now;
      mqttReconnect();
    }
  } else {
    mqttClient.loop();
  }

  // ── LCD non-blocking ───────────────────
  updateLCDBusy(now);

  // ── Heartbeat MQTT ─────────────────────
  if (mqttClient.connected() && (now - lastPeriodicPublish) >= PUBLISH_PERIODIC_MS) {
    lastPeriodicPublish = now;
    publishGateStatus();
  }

  // ────────────────────────────────────────
  // GATE MASUK — State Machine
  // ────────────────────────────────────────
  switch (stateMasuk) {

    case TUTUP:
      if ((now - lastRFIDMasuk) >= RFID_COOLDOWN
          && rfidMasuk.PICC_IsNewCardPresent()
          && rfidMasuk.PICC_ReadCardSerial()) {

        lastRFIDMasuk = now;
        String uid = bacaUID(rfidMasuk);
        Serial.print("[MASUK] UID: "); Serial.println(uid);
        rfidMasuk.PICC_HaltA();
        rfidMasuk.PCD_StopCrypto1();

        int idx = indeksUID(uid);

        if (idx == -1) {
          Serial.println("[MASUK] Kartu tidak dikenal");
          tampilLCDTemp("Kartu Tidak", "Dikenal!", now);
          publishGateEvent("TOLAK_TIDAK_DIKENAL", uid, slotTerisi);

        } else if (statusDiDalam[idx]) {
          Serial.println("[MASUK] UID sudah di dalam");
          tampilLCDTemp("Sudah Di Dalam!", "Akses Ditolak", now);
          publishGateEvent("TOLAK_SUDAH_MASUK", uid, slotTerisi);

        } else if (slotTerisi >= SLOT_MAX) {
          Serial.println("[MASUK] Parkir PENUH");
          tampilLCDTemp("Parkir PENUH", "Maaf!", now);
          publishGateEvent("TOLAK_PENUH", uid, slotTerisi);
          publishAlert("Parkir PENUH! Semua slot terisi.");

        } else {
          pendingIndexMasuk = idx;
          bukaPalangMasuk(now);
          publishGateEvent("MASUK_DIIZINKAN", uid, slotTerisi);
        }
      }
      break;

    case BUKA_MENUNGGU:
      if (digitalRead(IR_MASUK) == LOW) {
        waktuDeteksiIR_M = now;
        stateMasuk = BUKA_DETEKSI;
      }
      if ((now - waktuBukaMasuk) >= TIMEOUT_PALANG) {
        Serial.println("[MASUK] Timeout — tutup paksa");
        pendingIndexMasuk = -1;
        tutupPalangMasuk(now);
        publishGateEvent("MASUK_TIMEOUT", "", slotTerisi);
      }
      break;

    case BUKA_DETEKSI:
      if (digitalRead(IR_MASUK) == HIGH) {
        if ((now - waktuDeteksiIR_M) >= DEBOUNCE_IR) {
          if (pendingIndexMasuk >= 0) {
            statusDiDalam[pendingIndexMasuk] = true;
            pendingIndexMasuk = -1;
          }
          slotTerisi++;
          slotTerisi = min(slotTerisi, SLOT_MAX);
          Serial.printf("[MASUK] Slot terisi: %d/%d\n", slotTerisi, SLOT_MAX);
          tutupPalangMasuk(now);
          publishGateStatus();
          if (slotTerisi >= SLOT_MAX) {
            publishAlert("Parkir PENUH! Kapasitas tercapai.");
          }
        }
      } else {
        waktuDeteksiIR_M = now;
      }
      if ((now - waktuBukaMasuk) >= TIMEOUT_PALANG * 2) {
        if (pendingIndexMasuk >= 0) {
          statusDiDalam[pendingIndexMasuk] = true;
          pendingIndexMasuk = -1;
        }
        slotTerisi++;
        slotTerisi = min(slotTerisi, SLOT_MAX);
        tutupPalangMasuk(now);
        publishGateStatus();
      }
      break;
  }

  // ────────────────────────────────────────
  // GATE KELUAR — State Machine
  // ────────────────────────────────────────
  switch (stateKeluar) {

    case TUTUP:
      if ((now - lastRFIDKeluar) >= RFID_COOLDOWN
          && rfidKeluar.PICC_IsNewCardPresent()
          && rfidKeluar.PICC_ReadCardSerial()) {

        lastRFIDKeluar = now;
        String uid = bacaUID(rfidKeluar);
        Serial.print("[KELUAR] UID: "); Serial.println(uid);
        rfidKeluar.PICC_HaltA();
        rfidKeluar.PCD_StopCrypto1();

        int idx = indeksUID(uid);

        if (idx == -1) {
          tampilLCDTemp("Kartu Tidak", "Dikenal!", now);
          publishGateEvent("TOLAK_TIDAK_DIKENAL_K", uid, slotTerisi);

        } else if (!statusDiDalam[idx]) {
          tampilLCDTemp("Tdk Di Dalam!", "Akses Ditolak", now);
          publishGateEvent("TOLAK_TDK_DALAM", uid, slotTerisi);

        } else if (slotTerisi <= 0) {
          statusDiDalam[idx] = false;
          tampilLCDTemp("Error Slot", "Hubungi Admin", now);
          publishGateEvent("ERROR_SLOT", uid, slotTerisi);

        } else {
          pendingIndexKeluar = idx;
          bukaPalangKeluar(now);
          publishGateEvent("KELUAR_DIIZINKAN", uid, slotTerisi);
        }
      }
      break;

    case BUKA_MENUNGGU:
      if (digitalRead(IR_KELUAR) == LOW) {
        waktuDeteksiIR_K = now;
        stateKeluar = BUKA_DETEKSI;
      }
      if ((now - waktuBukaKeluar) >= TIMEOUT_PALANG) {
        pendingIndexKeluar = -1;
        tutupPalangKeluar(now);
        publishGateEvent("KELUAR_TIMEOUT", "", slotTerisi);
      }
      break;

    case BUKA_DETEKSI:
      if (digitalRead(IR_KELUAR) == HIGH) {
        if ((now - waktuDeteksiIR_K) >= DEBOUNCE_IR) {
          if (pendingIndexKeluar >= 0) {
            statusDiDalam[pendingIndexKeluar] = false;
            pendingIndexKeluar = -1;
          }
          slotTerisi--;
          slotTerisi = max(slotTerisi, 0);
          Serial.printf("[KELUAR] Slot terisi: %d/%d\n", slotTerisi, SLOT_MAX);
          tutupPalangKeluar(now);
          publishGateStatus();
        }
      } else {
        waktuDeteksiIR_K = now;
      }
      if ((now - waktuBukaKeluar) >= TIMEOUT_PALANG * 2) {
        if (pendingIndexKeluar >= 0) {
          statusDiDalam[pendingIndexKeluar] = false;
          pendingIndexKeluar = -1;
        }
        slotTerisi--;
        slotTerisi = max(slotTerisi, 0);
        tutupPalangKeluar(now);
        publishGateStatus();
      }
      break;
  }
}

// ═══════════════════════════════════════════
// FUNGSI WIFI & MQTT
// ═══════════════════════════════════════════
void connectWiFi() {
  Serial.print("[WiFi] Connecting to ");
  Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && (millis() - start) < 15000UL) {
    delay(500);
    Serial.print(".");
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("\n[WiFi] Connected! IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[WiFi] GAGAL — sistem tetap jalan offline");
  }
}

bool mqttReconnect() {
  if (WiFi.status() != WL_CONNECTED) return false;

  String clientId = getClientId();           // ← pakai MAC address
  Serial.print("[MQTT] Connecting dengan ID: ");
  Serial.print(clientId);

  // Menggunakan koneksi SSL aman untuk HiveMQ
  bool ok = mqttClient.connect(
    clientId.c_str(),                        // ← convert String ke const char*
    MQTT_USER,
    MQTT_PASS,
    "parking/gate/lwt", 1, true,
    "{\"status\":\"offline\",\"device\":\"gate-controller\"}"
  );

  if (ok) {
    Serial.println(" — OK!");
    mqttClient.publish(
      "parking/gate/lwt",
      "{\"status\":\"online\",\"device\":\"gate-controller\"}",
      true
    );
    mqttClient.subscribe("parking/gate/command");
    mqttClient.subscribe("parking/slot/status");
    Serial.println("[MQTT] Subscribed: parking/slot/status");
    return true;
  } else {
    Serial.printf(" — GAGAL rc=%d\n", mqttClient.state());
    return false;
  }
}

// ═══════════════════════════════════════════
// CALLBACK MQTT
// ═══════════════════════════════════════════
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String topicStr = String(topic);
  String msg = "";
  for (unsigned int i = 0; i < length; i++) msg += (char)payload[i];

  Serial.print("[MQTT] Terima → ");
  Serial.print(topicStr);
  Serial.print(": ");
  Serial.println(msg);

  if (topicStr == "parking/slot/status") {
    StaticJsonDocument<256> doc;
    DeserializationError err = deserializeJson(doc, msg);
    if (!err) {
      JsonArray arr = doc["slot"].as<JsonArray>();
      slotFisikTerisi = 0;
      for (int i = 0; i < SLOT_MAX && i < (int)arr.size(); i++) {
        slotFisik[i] = arr[i].as<int>();
        if (slotFisik[i]) slotFisikTerisi++;
      }
      dataSlotDiterima = true;
      Serial.printf("[SLOT FISIK] Terisi: %d/%d\n", slotFisikTerisi, SLOT_MAX);
    }
  }

  if (topicStr == "parking/gate/command") {
    StaticJsonDocument<256> doc;
    deserializeJson(doc, msg);
    String command = doc["command"];

    if (command == "FORCE_OPEN_MASUK") {
      Serial.println("[OVERRIDE] Perintah Web: Buka Paksa Palang Masuk!");
      servoMasuk.write(90); // Menggerakkan servo masuk
    } 
    else if (command == "FORCE_CLOSE_MASUK") {
      Serial.println("[OVERRIDE] Perintah Web: Tutup Paksa Palang Masuk!");
      servoMasuk.write(0);
    }
    else if (command == "FORCE_OPEN_KELUAR") {
      Serial.println("[OVERRIDE] Perintah Web: Buka Paksa Palang Keluar!");
      servoKeluar.write(90); // Menggerakkan servo keluar
    } 
    else if (command == "FORCE_CLOSE_KELUAR") {
      Serial.println("[OVERRIDE] Perintah Web: Tutup Paksa Palang Keluar!");
      servoKeluar.write(0);
    }
  }
}

// ═══════════════════════════════════════════
// FUNGSI PUBLISH MQTT
// ═══════════════════════════════════════════
void publishGateEvent(String jenis, String uid, int slotSekarang) {
  if (!mqttClient.connected()) return;

  eventCounter++;
  StaticJsonDocument<300> doc;
  doc["event"]      = jenis;
  doc["uid"]        = uid;
  doc["slot"]       = slotSekarang;
  doc["kapasitas"]  = SLOT_MAX;
  doc["event_id"]   = eventCounter;
  doc["uptime_ms"]  = millis();

  char buf[300];
  serializeJson(doc, buf);
  mqttClient.publish("parking/gate/event", buf);

  Serial.print("[MQTT] Event: "); Serial.println(jenis);
}

void publishGateStatus() {
  if (!mqttClient.connected()) return;

  StaticJsonDocument<400> doc;
  doc["slot_counter"]   = slotTerisi;
  doc["slot_fisik"]     = slotFisikTerisi;
  doc["kapasitas"]      = SLOT_MAX;
  doc["persen"]         = (slotTerisi * 100) / SLOT_MAX;
  doc["penuh"]          = (slotTerisi >= SLOT_MAX);
  doc["gate_masuk"]     = (stateMasuk  != TUTUP) ? "BUKA" : "TUTUP";
  doc["gate_keluar"]    = (stateKeluar != TUTUP) ? "BUKA" : "TUTUP";
  doc["data_slot_ok"]   = dataSlotDiterima;
  doc["client_id"]      = getClientId();       // ← info debug di payload
  doc["uptime_ms"]      = millis();

  JsonArray uids = doc.createNestedArray("kendaraan_dalam");
  for (int i = 0; i < JUMLAH_UID; i++) {
    if (statusDiDalam[i]) uids.add(UID_TERDAFTAR[i]);
  }

  char buf[400];
  serializeJson(doc, buf);
  mqttClient.publish("parking/gate/status", buf, true);

  Serial.println("[MQTT] Status gate dikirim");
}

void publishAlert(String pesan) {
  if (!mqttClient.connected()) return;

  StaticJsonDocument<200> doc;
  doc["alert"]      = pesan;
  doc["slot"]       = slotTerisi;
  doc["kapasitas"]  = SLOT_MAX;
  doc["uptime_ms"]  = millis();

  char buf[200];
  serializeJson(doc, buf);
  mqttClient.publish("parking/gate/alert", buf, true);

  Serial.print("[MQTT] ALERT: "); Serial.println(pesan);
}

// ═══════════════════════════════════════════
// FUNGSI PALANG
// ═══════════════════════════════════════════
void bukaPalangMasuk(unsigned long now) {
  servoMasuk.write(SERVO_BUKA);
  stateMasuk     = BUKA_MENUNGGU;
  waktuBukaMasuk = now;
  if (!lcdBusy) {
    lcd.clear();
    lcd.setCursor(0, 0); lcd.print("Selamat Masuk");
    lcd.setCursor(0, 1); lcd.print("Silahkan!");
  }
  Serial.println(">> Palang MASUK terbuka");
}

void tutupPalangMasuk(unsigned long now) {
  servoMasuk.write(SERVO_TUTUP);
  stateMasuk = TUTUP;
  if (!lcdBusy) tampilStatus();
  Serial.println(">> Palang MASUK tertutup");
}

void bukaPalangKeluar(unsigned long now) {
  servoKeluar.write(SERVO_BUKA);
  stateKeluar     = BUKA_MENUNGGU;
  waktuBukaKeluar = now;
  if (!lcdBusy) {
    lcd.clear();
    lcd.setCursor(0, 0); lcd.print("Selamat Keluar");
    lcd.setCursor(0, 1); lcd.print("Terima Kasih!");
  }
  Serial.println(">> Palang KELUAR terbuka");
}

void tutupPalangKeluar(unsigned long now) {
  servoKeluar.write(SERVO_TUTUP);
  stateKeluar = TUTUP;
  if (!lcdBusy) tampilStatus();
  Serial.println(">> Palang KELUAR tertutup");
}

// ═══════════════════════════════════════════
// FUNGSI RFID
// ═══════════════════════════════════════════
String bacaUID(MFRC522 &rfid) {
  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(rfid.uid.uidByte[i], HEX);
    if (i < rfid.uid.size - 1) uid += " ";
  }
  uid.toUpperCase();
  return uid;
}

int indeksUID(String uid) {
  for (int i = 0; i < JUMLAH_UID; i++) {
    if (uid == UID_TERDAFTAR[i]) return i;
  }
  return -1;
}

// ═══════════════════════════════════════════
// FUNGSI LCD
// ═══════════════════════════════════════════
void tampilLCDTemp(String baris1, String baris2, unsigned long now) {
  lcd.clear();
  lcd.setCursor(0, 0); lcd.print(baris1.substring(0, 16));
  lcd.setCursor(0, 1); lcd.print(baris2.substring(0, 16));
  lcdBusy      = true;
  lcdBusyUntil = now + LCD_MSG_DURATION;
}

void updateLCDBusy(unsigned long now) {
  if (lcdBusy && (now >= lcdBusyUntil)) {
    lcdBusy = false;
    tampilStatus();
  }
}

void tampilStatus() {
  if (lcdBusy) return;
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Smart Parking   ");
  lcd.setCursor(0, 1);
  lcd.print("Slot:");
  lcd.print(slotTerisi);
  lcd.print("/");
  lcd.print(SLOT_MAX);
  lcd.print(" [");
  int maxBar = min(SLOT_MAX, 6);
  for (int i = 0; i < maxBar; i++) {
    lcd.print(i < slotTerisi ? "#" : "-");
  }
  lcd.print("]");
}