"use client";
import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import Y2KCard from "@/components/ui/Y2KCard";
import Header from "@/components/layout/Header";
import { UserProfile } from "@/types";
import SlotGrid from "@/components/parking/SlotGrid";
import LiveParkingCard from "@/components/parking/LiveParkingCard";
import { Sidebar } from "@/components/layout/Sidebar";
import OverviewTab from "../../components/parking/overview";

import { useAuth } from "@/app/context/AuthContext";
import AnalyticsTab from "@/components/admin/analyticsTab";
import UserManagerTab from "@/components/admin/userManager";
import OperatorNotesModal from "@/components/modal/operatorNotes";
import NotificationsModal from "@/components/modal/NotificationsModal";
import ProfileTab from "@/components/profile/ProfileTab";
import SettingsTab from "@/components/profile/SettingsTab";
import { useParkingSlots } from "@/app/lib/useParkingSlots";
import { RecentLogin } from "@/components/parking/recentLogin";
import IotConfigPage from "@/components/iot-config/page";
import { useMqttParking } from "@/hooks/useParkingMQTT";

export default function DashboardPage() {
  const { user: authUser, loading: authLoading, signOut } = useAuth();

  const { slots,
    loading,
    error,
    totalSlots,
    availableSlots,
    occupiedSlots,
    maintenanceSlots,
    occupancyRate,
    refresh, } = useParkingSlots();

  const {
    isAnomaly,
    anomalyCount,
    anomalyTimestamp,
    anomalyMessage,
    pendingAnomaly,
    countdown,
    slots: mqttSlots,
    connected,
    lastLog,
    gateMasuk,
    gateKeluar,
    gateOnline,
    slotOnline,
    activeVehicles,
    rfidActive,
  } = useMqttParking(slots);

  // Default to closed on mobile (md breakpoint = 768px)
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Local user profile state to allow updates from settings
  const [localUserProfile, setLocalUserProfile] = useState<UserProfile | null>(
    null,
  );

  // Sync local profile with auth user
  useEffect(() => {
    if (authUser) {
      setLocalUserProfile(authUser);
    }
  }, [authUser]);

  // On desktop, open sidebar by default once mounted
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setSidebarOpen(mq.matches);
    const handler = (e: MediaQueryListEvent) => setSidebarOpen(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (!authLoading && !authUser) {
      window.location.href = "/";
    }
  }, [authUser, authLoading]);

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/";
  };

  const handleNavigate = (tab: string) => {
    setActiveTab(tab);
  };

  const handleProfileUpdate = (updated: Partial<UserProfile>) => {
    if (localUserProfile) {
      const updatedProfile = { ...localUserProfile, ...updated };
      setLocalUserProfile(updatedProfile);
      // Also update localStorage so the change persists across refreshes
      localStorage.setItem("active_user", JSON.stringify(updatedProfile));
    }
  };

  if (authLoading || !authUser || !localUserProfile) {
    return (
      <div className="min-h-screen bg-(--color-y2k-bg-main) flex items-center justify-center font-mono text-(--color-y2k-lime)">
        INITIALIZING_SESSION...
      </div>
    );
  }

  const userProfile = localUserProfile;
  const isAdmin = userProfile.role === "admin";

  const getHeaderTitle = () => {
    switch (activeTab) {
      case "overview":
        return "DASHBOARD_OVERVIEW";
      case "profile":
        return "USER_PROFILE";
      case "settings":
        return "USER_SETTINGS";
      case "notifications":
        return "NOTIFICATIONS_CENTER";
      default:
        return activeTab.toUpperCase() + "_MODULE";
    }
  };

  return (
    <div className="min-h-screen bg-(--color-y2k-bg-main) text-(--color-y2k-text-main) font-mono flex overflow-hidden">
      <Sidebar
        isOpen={sidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          title={getHeaderTitle()}
          userProfile={userProfile}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
        />

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          {activeTab === "overview" && (
            <>
              {/* STATUS EVALUASI ANOMALI (Fase Pending Debounce) */}
              {pendingAnomaly && (
                <div className="bg-[rgba(234,179,8,0.1)] border-4 border-yellow-500 text-yellow-500 p-4 font-black text-xs sm:text-sm shadow-[4px_4px_0px_0px_rgba(234,179,8,1)] flex items-center justify-between gap-4 uppercase mb-6 animate-pulse">
                  <div className="flex items-center gap-2">
                    <span>⚠️ EVALUASI ANOMALI: Selisih sensor terdeteksi. Menyaring noise ({countdown}s)...</span>
                  </div>
                </div>
              )}

              {/* PERINGATAN ANOMALI AKTIF */}
              {isAnomaly && (
                <div className="bg-[rgba(239,68,68,0.1)] border-4 border-red-500 text-red-500 p-4 font-black text-xs sm:text-sm shadow-[4px_4px_0px_0px_rgba(239,68,68,1)] flex items-center justify-between gap-4 uppercase mb-6 animate-[pulse_1s_infinite]">
                  <div className="flex items-center gap-2">
                    <span>🔴 ANOMALI TERDETEKSI (Ada objek di slot {mqttSlots.filter(s => s.status === 'occupied').map(s => s.id).join(', ') || 'A01'} tanpa otorisasi kartu RFID!)</span>
                  </div>
                  <span className="text-[10px] opacity-75 shrink-0">{anomalyTimestamp}</span>
                </div>
              )}

              {isAdmin && (
                <OverviewTab
                  role={userProfile.role}
                  onOpenModal={() => setIsModalOpen(true)}
                  totalSlots={totalSlots}
                  availableSlots={availableSlots}
                  rfidActive={rfidActive}
                  gateOnline={gateOnline}
                />
              )}
              <div className="space-y-4 sm:space-y-6 md:space-y-8">
                {!isAdmin && (
                  <OverviewTab
                    role={userProfile.role}
                    onOpenModal={() => setIsModalOpen(true)}
                    totalSlots={totalSlots}
                    availableSlots={availableSlots}
                    rfidActive={rfidActive}
                    gateOnline={gateOnline}
                  />
                )}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mt-5">
                  <Y2KCard
                    title="Live_Parking_Grid"
                    icon={MapPin}
                    className="lg:col-span-2"
                    headerAction={
                      <button
                        onClick={() => refresh()}
                        className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-(--color-y2k-lime) text-(--color-y2k-lime) text-[10px] font-black uppercase tracking-wider hover:bg-(--color-y2k-lime)/10 transition-all"
                      >
                        Refresh
                      </button>
                    }
                  >
                    <SlotGrid
                      slots={slots}
                      totalSlots={totalSlots}
                      availableSlots={availableSlots}
                      occupiedSlots={occupiedSlots}
                      maintenanceSlots={maintenanceSlots}
                      occupancyRate={occupancyRate}
                    />

                    <div className="mt-6 sm:mt-8 bg-(--color-y2k-border)/20 p-3 sm:p-4 border-l-4 border-(--color-y2k-lime) flex flex-col gap-2">
                      <div className="flex items-center gap-3 text-[10px] font-bold">
                        <div className="w-2 h-2 bg-(--color-y2k-lime) animate-pulse"></div>
                        <span className="text-(--color-y2k-lime) uppercase italic">
                          IoT_Stream: Node_A {" > "} Cloud_Gateway
                        </span>
                      </div>
                      <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">
                        Big_Data_Ingestion: Active
                      </div>
                    </div>
                  </Y2KCard>
                  <div className="lg:col-span-1">
                  {isAdmin && <RecentLogin role={userProfile.role}/>}
                  </div>
                </div>
                {/* Analytics moved to its own tab — removed duplicate here */}
              </div>
            </>
          )}

          {activeTab === "analytics" && (
            <div>{isAdmin && <AnalyticsTab />}</div>
          )}

          {activeTab === "map" && (
            <LiveParkingCard
              slots={slots}
              totalSlots={totalSlots}
              availableSlots={availableSlots}
              occupiedSlots={occupiedSlots}
              maintenanceSlots={maintenanceSlots}
              occupancyRate={occupancyRate}
              showEditControls={true}
              onRefresh={refresh}
            />
          )}
          {activeTab === "users" && <div>{isAdmin && <UserManagerTab />}</div>}
          {activeTab === "config" && (
            <div>{isAdmin && <IotConfigPage />}</div>
          )}

          {/* Profile Tab */}
          {activeTab === "profile" && <ProfileTab userProfile={userProfile} />}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <SettingsTab
              userProfile={userProfile}
              onProfileUpdate={handleProfileUpdate}
            />
          )}
        </div>

        {/* Modal Layer */}
        {isModalOpen && (
          <OperatorNotesModal onClose={() => setIsModalOpen(false)} />
        )}

        {/* Notifications Modal */}
        {isNotificationsOpen && (
          <NotificationsModal
            onClose={() => setIsNotificationsOpen(false)}
            role={isAdmin ? "admin" : "operator"}
          />
        )}
      </main>
    </div>
  );
}
