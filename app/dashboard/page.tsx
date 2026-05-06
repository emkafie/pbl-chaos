"use client";
import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import Y2KCard from "@/components/ui/Y2KCard";
import Header from "@/components/layout/Header";
import { ParkingSlot, UserProfile } from "@/types";
import SlotGrid from "@/components/parking/SlotGrid";
import { Sidebar } from "@/components/layout/Sidebar";
import OverviewTab from "../../components/parking/overview";

import { useAuth } from "@/app/context/AuthContext";
import AnalyticsTab from "@/components/admin/analyticsTab";
import UserManagerTab from "@/components/admin/userManager";
import OperatorNotesModal from "@/components/modal/operatorNotes";
import ProfileTab from "@/components/profile/ProfileTab";
import SettingsTab from "@/components/profile/SettingsTab";
import { useParkingSlots } from "@/app/lib/useParkingSlots";
import { RecentLogin } from "@/components/parking/recentLogin";

export default function DashboardPage() {
  const { user: authUser, loading: authLoading, signOut } = useAuth();

  // Default to closed on mobile (md breakpoint = 768px)
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const {
    slots,
    loading,
    error,
    totalSlots,
    availableSlots,
    occupiedSlots,
    occupancyRate,
  } = useParkingSlots();

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
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center font-mono text-[#C4FF4D]">
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
      default:
        return activeTab.toUpperCase() + "_MODULE";
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white font-mono flex overflow-hidden">
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
        />

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          {activeTab === "overview" && (
            <>
              {isAdmin && (
                <OverviewTab
                  role={userProfile.role}
                  onOpenModal={() => setIsModalOpen(true)}
                  totalSlots={totalSlots}
                  availableSlots={availableSlots}
                />
              )}
              <div className="space-y-4 sm:space-y-6 md:space-y-8">
                {!isAdmin && (
                  <OverviewTab
                    role={userProfile.role}
                    onOpenModal={() => setIsModalOpen(true)}
                    totalSlots={totalSlots}
                    availableSlots={availableSlots}
                  />
                )}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mt-5">
                  <Y2KCard
                    title="Live_Parking_Grid"
                    icon={MapPin}
                    className="lg:col-span-2"
                  >
                    <SlotGrid
                      slots={slots}
                      totalSlots={totalSlots}
                      availableSlots={availableSlots}
                      occupiedSlots={occupiedSlots}
                      occupancyRate={occupancyRate}
                    />

                    <div className="mt-6 sm:mt-8 bg-[#4D4D4D]/20 p-3 sm:p-4 border-l-4 border-[#C4FF4D] flex flex-col gap-2">
                      <div className="flex items-center gap-3 text-[10px] font-bold">
                        <div className="w-2 h-2 bg-[#C4FF4D] animate-pulse"></div>
                        <span className="text-[#C4FF4D] uppercase italic">
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
            <div>
              <Y2KCard title="Live_Parking_Grid" icon={MapPin}>
                <SlotGrid
                  slots={slots}
                  totalSlots={totalSlots}
                  availableSlots={availableSlots}
                  occupiedSlots={occupiedSlots}
                  occupancyRate={occupancyRate}
                />

                <div className="mt-6 sm:mt-8 bg-[#4D4D4D]/20 p-3 sm:p-4 border-l-4 border-[#C4FF4D] flex flex-col gap-2">
                  <div className="flex items-center gap-3 text-[10px] font-bold">
                    <div className="w-2 h-2 bg-[#C4FF4D] animate-pulse"></div>
                    <span className="text-[#C4FF4D] uppercase italic">
                      IoT_Stream: Node_A {" > "} Cloud_Gateway
                    </span>
                  </div>
                  <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">
                    Big_Data_Ingestion: Active
                  </div>
                </div>
              </Y2KCard>
            </div>
          )}
          {activeTab === "users" && <div>{isAdmin && <UserManagerTab />}</div>}
          {activeTab === "config" && (
            <div>{isAdmin && <div>IoT Config Content</div>}</div>
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
      </main>
    </div>
  );
}
