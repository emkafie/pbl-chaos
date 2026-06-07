// =============================================================================
// ESP32 #2 - SMART PARKING SLOT MONITOR + MQTT (HIVEMQ CLUSTER VERSION)
// Versi Sinkron v3.2 - Terintegrasi dengan Gate Controller & Dashboard Web
// =============================================================================
// Komponen:
//   - IR Sensor Slot 1 : GPIO 34 (INPUT ONLY)
//   - IR Sensor Slot 2 : GPIO 35 (INPUT ONLY)
//   - IR Sensor Slot 3 : GPIO 32
//   - IR Sensor Slot 4 : GPIO 33
// =============================================================================

#include <WiFi.h>
#include <WiFiClientSecure.h> // Menggunakan koneksi aman SSL/TLS
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ══════════════════════════════════════════
// ⚙️ KONFIGURASI WIFI & HIVEMQ BROKER SECURE
// (Samakan kredensial ini dengan ESP32 #1 Gate Anda)
// ══════════════════════════════════════════
const char* WIFI_SSID     = "TEST";
const char* WIFI_PASSWORD = "12345678";

// Gunakan alamat host klaster HiveMQ Cloud Anda
const char* MQTT_HOST     = "fead689fb7b5405e880e559823b1ed21.s1.eu.hivemq.cloud"; 
const int   MQTT_PORT     = 8883; // Port aman SSL/TLS HiveMQ

// Kredensial cluster private HiveMQ Anda
const char* MQTT_USER     = "parking";
const char* MQTT_PASS     = "Parkingpass123";

// ══════════════════════════════════════════
// PIN DEFINISI & PARAMETER SENSOR IR
// ══════════════════════════════════════════
#define IR_SLOT_1  34
#define IR_SLOT_2  35
#define IR_SLOT_3  32
#define IR_SLOT_4  33

#define SLOT_MAX   4
const int IR_PINS[SLOT_MAX] = { IR_SLOT_1, IR_SLOT_2, IR_SLOT_3, IR_SLOT_4 };

// Timing & Debounce
#define DEBOUNCE_MS         500UL   // Durasi stabilisasi sensor IR (mencegah false trigger)
#define MQTT_RECONNECT_MS   5000UL  // Jeda waktu coba ulang koneksi MQTT
#define PUBLISH_PERIODIC_MS 30000UL // Heartbeat berkala (30 detik)

// State management sensor
bool slotTerisi[SLOT_MAX]          = { false };
bool slotPrev[SLOT_MAX]            = { false };
bool bacaanStabil[SLOT_MAX]        = { false };
unsigned long lastChange[SLOT_MAX] = { 0 };

unsigned long lastReconnectAttempt = 0;
unsigned long lastPeriodicPublish  = 0;

WiFiClientSecure wifiClientSecure;  // Menggunakan klien aman SSL
PubSubClient mqttClient(wifiClientSecure);

// ── Generate Client ID unik dari MAC address ──
String getClientId() {
  uint8_t mac[6];
  WiFi.macAddress(mac);
  char id[30];
  snprintf(id, sizeof(id), "ESP32_SLOT_%02X%02X%02X%02X%02X",
           mac[1], mac[2], mac[3], mac[4], mac[5]);
  return String(id);
}

// ═══════════════════════════════════════════
// PROTOTYPES
// ═══════════════════════════════════════════
void connectWiFi();
bool mqttReconnect();
void publishSlotStatus(int slotIndex, bool terisi);
void publishAllStatus();
void tampilStatusSerial();

// ═══════════════════════════════════════════
void setup() {
  Serial.begin(115200);
  Serial.println("\n=== Slot Monitor + HiveMQ Secure Booting v3.2 ===");

  // Set pin IR sebagai INPUT
  for (int i = 0; i < SLOT_MAX; i++) {
    pinMode(IR_PINS[i], INPUT);
  }
  Serial.println("[OK] IR Sensors siap");

  connectWiFi();

  // Konfigurasi klien SSL/TLS (Mengabaikan verifikasi sidik jari sertifikat root untuk kemudahan PBL)
  wifiClientSecure.setInsecure();

  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  mqttClient.setBufferSize(512);

  if (mqttReconnect()) {
    delay(500);
    publishAllStatus();
  }

  Serial.println("=== Sistem Monitor Slot Siap ===\n");
  tampilStatusSerial();
}

// ═══════════════════════════════════════════
void loop() {
  unsigned long now = millis();

  // Re-koneksi WiFi otomatis
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WiFi] Koneksi putus — reconnecting...");
    connectWiFi();
  }

  // Re-koneksi MQTT otomatis
  if (!mqttClient.connected()) {
    if ((now - lastReconnectAttempt) >= MQTT_RECONNECT_MS) {
      lastReconnectAttempt = now;
      Serial.println("[MQTT] Mencoba menghubungkan kembali ke HiveMQ...");
      mqttReconnect();
    }
  } else {
    mqttClient.loop();
  }

  bool adaPerubahan = false;

  // ── SCANNING IR SENSORS DENGAN DEBOUNCE FILTER ──
  for (int i = 0; i < SLOT_MAX; i++) {
    // Membaca sensor IR (LOW berarti terhalang/ada mobil, HIGH berarti kosong)
    bool bacaan = (digitalRead(IR_PINS[i]) == LOW);

    if (bacaan != bacaanStabil[i]) {
      if ((now - lastChange[i]) >= DEBOUNCE_MS) {
        bacaanStabil[i] = bacaan;
        slotTerisi[i]   = bacaan;

        if (slotTerisi[i] != slotPrev[i]) {
          slotPrev[i]  = slotTerisi[i];
          adaPerubahan = true;

          Serial.printf("[PERUBAHAN] Slot %d -> %s\n", i + 1, slotTerisi[i] ? "TERISI 🔴" : "KOSONG 🟢");

          // Kirim update status slot individu secara instan ke Broker MQTT
          if (mqttClient.connected()) {
            publishSlotStatus(i, slotTerisi[i]);
          }
        }
      }
    } else {
      lastChange[i] = now;
    }
  }

  // Jika ada perubahan status slot, kirim paket JSON akumulasi status
  if (adaPerubahan) {
    tampilStatusSerial();
    if (mqttClient.connected()) {
      publishAllStatus();
    }
  }

  // Heartbeat periodic publish status (Setiap 30 detik)
  if (mqttClient.connected() && (now - lastPeriodicPublish) >= PUBLISH_PERIODIC_MS) {
    lastPeriodicPublish = now;
    Serial.println("[MQTT] Heartbeat publish status...");
    publishAllStatus();
  }
}

// ═══════════════════════════════════════════
// FUNGSI WIFI
// ═══════════════════════════════════════════
void connectWiFi() {
  Serial.print("[WiFi] Connecting to ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long startAttempt = millis();
  while (WiFi.status() != WL_CONNECTED && (millis() - startAttempt) < 15000UL) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.print("[WiFi] Connected! IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[WiFi] GAGAL terhubung! Sistem berjalan offline.");
  }
}

// ═══════════════════════════════════════════
// FUNGSI MQTT SECURE
// ═══════════════════════════════════════════
bool mqttReconnect() {
  if (WiFi.status() != WL_CONNECTED) return false;

  String clientId = getClientId();
  Serial.print("[MQTT] Connecting dengan ID: ");
  Serial.print(clientId);

  // Last Will and Testament (LWT) jika alat mati mendadak
  bool connected = mqttClient.connect(
    clientId.c_str(),
    MQTT_USER,
    MQTT_PASS,
    "parking/slot/lwt",
    1,
    true,
    "{\"status\":\"offline\",\"device\":\"slot-monitor\"}"
  );

  if (connected) {
    Serial.println(" — OK!");
    
    // Publikasikan LWT Online
    mqttClient.publish(
      "parking/slot/lwt",
      "{\"status\":\"online\",\"device\":\"slot-monitor\"}",
      true
    );
    return true;
  } else {
    Serial.printf(" — GAGAL rc=%d\n", mqttClient.state());
    return false;
  }
}

// ═══════════════════════════════════════════
// FUNGSI PUBLISH DATA SENSOR
// ═══════════════════════════════════════════

// 1. Kirim data status slot individu
void publishSlotStatus(int slotIndex, bool terisi) {
  char topic[30];
  snprintf(topic, sizeof(topic), "parking/slot/%d", slotIndex + 1);

  const char* payload = terisi ? "TERISI" : "KOSONG";
  mqttClient.publish(topic, payload, true); // Retain = True agar tersimpan di broker

  Serial.printf("[MQTT] Publish %s -> %s\n", topic, payload);
}

// 2. Kirim data akumulasi seluruh status slot dalam bentuk JSON (Dibutuhkan oleh Gate ESP)
void publishAllStatus() {
  int terisi = 0;
  for (int i = 0; i < SLOT_MAX; i++) {
    if (slotTerisi[i]) terisi++;
  }
  int kosong = SLOT_MAX - terisi;
  int persen = (terisi * 100) / SLOT_MAX;

  StaticJsonDocument<256> doc;
  JsonArray slotArr = doc.createNestedArray("slot");
  for (int i = 0; i < SLOT_MAX; i++) {
    slotArr.add(slotTerisi[i] ? 1 : 0);
  }
  doc["terisi"]    = terisi;
  doc["kosong"]    = kosong;
  doc["kapasitas"] = SLOT_MAX;
  doc["persen"]    = persen;
  doc["timestamp"] = millis();

  char buf[256];
  serializeJson(doc, buf);
  
  // Publikasikan ke topik "parking/slot/status" yang di-subscribe oleh ESP Gate & Web Hook
  mqttClient.publish("parking/slot/status", buf, true);

  Serial.println("[MQTT] Status akumulasi JSON dipublikasikan.");
}

// ═══════════════════════════════════════════
// FUNGSI SERIAL DEBUG
// ═══════════════════════════════════════════
void tampilStatusSerial() {
  int terisi = 0;
  Serial.println("--------------- STATUS SLOT ---------------");
  for (int i = 0; i < SLOT_MAX; i++) {
    Serial.printf("  Slot %d : %s\n", i + 1, slotTerisi[i] ? "TERISI 🔴" : "KOSONG 🟢");
    if (slotTerisi[i]) terisi++;
  }
  Serial.printf("-------------------------------------------\n");
  Serial.printf("  Total Terisi: %d | Kosong: %d\n", terisi, SLOT_MAX - terisi);
  Serial.println("===========================================\n");
}