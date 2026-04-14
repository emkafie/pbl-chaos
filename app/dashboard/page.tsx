"use client";
import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import Y2KCard from "@/components/ui/Y2KCard";
import Header from "@/components/layout/Header";
import { ParkingSlot } from "@/types";
import SlotGrid from "@/components/parking/SlotGrid";
import { Sidebar } from "@/components/layout/Sidebar";
import OverviewTab from "../../components/parking/overview";

import { useAuth } from "@/app/context/AuthContext";
import AnalyticsTab from "@/components/admin/analyticsTab";
import UserManagerTab from "@/components/admin/userManager";
import OperatorNotesModal from "@/components/modal/operatorNotes";
import RecentStatus from "@/components/parking/recentStatus";

export default function DashboardPage() {
  const { user: authUser, loading: authLoading, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [parkingSlots] = useState<ParkingSlot[]>([
    { id: "A01", status: "available" },
    { id: "A02", status: "occupied" },
    { id: "A03", status: "available" },
    { id: "A04", status: "available" },
    { id: "B01", status: "occupied" },
    { id: "B02", status: "available" },
    { id: "B03", status: "occupied" },
    { id: "B04", status: "occupied" },
    { id: "C01", status: "available" },
    { id: "C02", status: "available" },
  ]);

  useEffect(() => {
    if (!authLoading && !authUser) {
      window.location.href = "/";
    }
  }, [authUser, authLoading]);

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/";
  };

  if (authLoading || !authUser) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center font-mono text-[#C4FF4D]">
        INITIALIZING_SESSION...
      </div>
    );
  }

  const userProfile = authUser;
  const isAdmin = userProfile.role === "admin";

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white font-mono flex">
      <Sidebar
        isOpen={sidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <Header
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          title={
            activeTab === "overview"
              ? "DASHBOARD_OVERVIEW"
              : activeTab.toUpperCase() + "_MODULE"
          }
          userProfile={userProfile}
        />

        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === "overview" && (
            <>
              {isAdmin && (
                <OverviewTab
                  role={userProfile.role}
                  onOpenModal={() => setIsModalOpen(true)}
                />
              )}
              <div className="space-y-8">
                  {!isAdmin && (
                    <OverviewTab
                    role={userProfile.role}
                    onOpenModal={() => setIsModalOpen(true)}
                    />
                  )}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <Y2KCard
                    title="Live_Parking_Grid"
                    icon={MapPin}
                    className="col-span-2"
                  >
                    <SlotGrid slots={parkingSlots} />

                    <div className="mt-8 bg-[#4D4D4D]/20 p-4 border-l-4 border-[#C4FF4D] flex flex-col gap-2">
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
                  <RecentStatus />
                </div>
                  {isAdmin && <AnalyticsTab />}
              </div>
            </>
          )}

          {activeTab === "analytics" && (
            <div>
              {isAdmin && <AnalyticsTab />}
            </div>
          )}

          {activeTab === "map" && (
            <div>
              <Y2KCard
                title="Live_Parking_Grid"
                icon={MapPin}
                className="col-span-2"
              >
                <SlotGrid slots={parkingSlots} />

                <div className="mt-8 bg-[#4D4D4D]/20 p-4 border-l-4 border-[#C4FF4D] flex flex-col gap-2">
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
        </div>

        {/* Modal Layer */}
        {isModalOpen && (
          <OperatorNotesModal onClose={() => setIsModalOpen(false)} />
        )}
      </main>
    </div>
  );
}
