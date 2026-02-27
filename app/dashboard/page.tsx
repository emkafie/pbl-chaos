"use client";
import React, { useEffect, useState } from "react";
import {
  Car,
  Activity,
  Settings,
  CreditCard,
  MapPin,
  TrendingUp,
  Database,
  Cloud,
  Cpu,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import Y2KCard from "@/components/ui/Y2KCard";
import Header from "@/components/layout/Header";
import StatCard from "@/components/parking/StatCard";
import { ParkingSlot } from "@/types";
import SlotGrid from "@/components/parking/SlotGrid";
import { Sidebar } from "@/components/layout/Sidebar";

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [userProfile, setUserProfile] = useState({
    username: "Guest",
    role: "Visitor",
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("active_user");
    if (storedUser) {
      setUserProfile(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("active_user");
    window.location.href = "/";
  };

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <StatCard
              label="Available Slots"
              value="24"
              icon={<Car size={24} />}
              color="#C4FF4D"
            />
            <StatCard
              label="Total Occupancy"
              value="78%"
              icon={<Activity size={24} />}
              color="#BA8CFF"
            />
            <StatCard
              label="Cloud Latency"
              value="12ms"
              icon={<Cloud size={24} />}
              color="#C4FF4D"
            />
            <StatCard
              label="Data Stream"
              value="4.2kb/s"
              icon={<Database size={24} />}
              color="#BA8CFF"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <Y2KCard
              title="Live_Parking_Grid"
              icon={MapPin}
              className="xl:col-span-2"
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

            <div className="space-y-6">
              <Y2KCard title="Analytics" icon={TrendingUp} variant="grey">
                <div className="space-y-4">
                  <div className="h-20 flex items-end gap-1 px-1 border-b-2 border-[#4D4D4D] pb-1">
                    {[30, 60, 45, 90, 55, 80, 40].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-[#BA8CFF]"
                        style={{ height: `${h}%` }}
                      ></div>
                    ))}
                  </div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase">
                    Anomali deteksi: Lonjakan terdeteksi pada Node_B.
                  </p>
                </div>
              </Y2KCard>

              <Y2KCard title="Infrastructure" icon={Cpu} variant="purple">
                <div className="space-y-3 font-bold text-[10px]">
                  <div className="flex justify-between border-b border-[#4D4D4D] pb-1">
                    <span className="text-gray-500">GATEWAY</span>
                    <span className="text-[#C4FF4D]">ONLINE</span>
                  </div>
                  <div className="flex justify-between border-b border-[#4D4D4D] pb-1">
                    <span className="text-gray-500">DB_SYNC</span>
                    <span className="text-[#BA8CFF]">OK</span>
                  </div>
                </div>
              </Y2KCard>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
