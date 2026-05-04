"use client";
import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import Y2KCard from "@/components/ui/Y2KCard";
import Header from "@/components/layout/Header";
import { auth } from "@/app/lib/firebase";
import { ParkingSlot } from "@/types";
import SlotGrid from "@/components/parking/SlotGrid";
import { Sidebar } from "@/components/layout/Sidebar";
import OverviewTab from "../../components/parking/overview";

import { useAuth } from "@/app/context/AuthContext";
import AnalyticsTab from "@/components/admin/analyticsTab";
import UserManagerTab from "@/components/admin/userManager";
import OperatorNotesModal from "@/components/modal/operatorNotes";
import RecentStatus from "@/components/parking/recentStatus";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { db, appId } from "@/app/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

export default function DashboardPage() {
  const { user: authUser, loading: authLoading, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [parkingSlots, setParkingSlots] = useState<ParkingSlot[]>([]);

  // Fetch real-time data from Firestore
  useEffect(() => {
    if (!appId) return;
    const slotsRef = collection(db, `artifacts/${appId}/public/data/slots`);
    const q = query(slotsRef, orderBy('id'));
    const unsubscribeSlots = onSnapshot(q, (snapshot) => {
      const slotsData: ParkingSlot[] = [];
      snapshot.forEach((doc) => {
        slotsData.push(doc.data() as ParkingSlot);
      });
      setParkingSlots(slotsData);
    });

    return () => unsubscribeSlots();
  }, []);

  // Calculate stats
  const totalSlots = parkingSlots.length;
  const availableSlots = parkingSlots.filter(s => s.status === 'available').length;
  const occupiedSlots = parkingSlots.filter(s => s.status === 'occupied').length;

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
                  totalSlots={totalSlots}
                  availableSlots={availableSlots}
                />
              )}
              <div className="space-y-8">
                  {!isAdmin && (
                    <OverviewTab
                      role={userProfile.role}
                      onOpenModal={() => setIsModalOpen(true)}
                      totalSlots={totalSlots}
                      availableSlots={availableSlots}
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
                  <RecentStatus 
                    totalSlots={totalSlots}
                    availableSlots={availableSlots}
                    occupiedSlots={occupiedSlots}
                  />
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
