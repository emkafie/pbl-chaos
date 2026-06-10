"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { ParkingSession } from "@/types";
import { SessionService } from "@/app/lib/sessionService";
import { db } from "@/app/lib/firebase";
import SessionDetailModal from "@/components/modal/session/SessionDetailModal";
import Y2KCard from "@/components/ui/Y2KCard";
import {
  Calendar,
  Filter,
  RefreshCw,
  Search,
  DollarSign,
  Clock,
  ArrowUpDown,
} from "lucide-react";

interface HistoryLogTabProps {
  userRole: "admin" | "operator";
}

type SortField = "created_at" | "fee" | "duration_minutes";
type SortOrder = "asc" | "desc";

export default function HistoryLogTab({ userRole }: HistoryLogTabProps) {
  const [sessions, setSessions] = useState<ParkingSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<ParkingSession[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<ParkingSession | null>(
    null,
  );
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [dataSource, setDataSource] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const cache = useRef<ParkingSession[] | null>(null);

  const fetchSessions = async (forceRefresh = false) => {
    if (!forceRefresh && cache.current !== null) {
      setSessions(cache.current);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await SessionService.getAllSessions(db);
      cache.current = data;
      setSessions(data);
      setDataSource("firestore");
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const processedSessions = useMemo(() => {
    let result = [...sessions];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.rfid_uid.toLowerCase().includes(query) ||
          s.slot_id.toLowerCase().includes(query),
      );
    }

    if (statusFilter) {
      result = result.filter((s) => s.status === statusFilter);
    }

    if (vehicleTypeFilter) {
      result = result.filter((s) => s.vehicle_type === vehicleTypeFilter);
    }

    if (startDate || endDate) {
      result = result.filter((s) => {
        const sessionDate = new Date(s.created_at);
        if (startDate && sessionDate < new Date(startDate)) return false;
        if (endDate) {
          const endDateTime = new Date(endDate);
          endDateTime.setHours(23, 59, 59, 999);
          if (sessionDate > endDateTime) return false;
        }
        return true;
      });
    }

    result.sort((a, b) => {
      let aVal: number = 0,
        bVal: number = 0;

      if (sortField === "created_at") {
        const aDate =
          a.created_at?.toDate?.() ||
          (typeof a.created_at === "string"
            ? new Date(a.created_at)
            : new Date(a.created_at));
        const bDate =
          b.created_at?.toDate?.() ||
          (typeof b.created_at === "string"
            ? new Date(b.created_at)
            : new Date(b.created_at));

        aVal = aDate.getTime();
        bVal = bDate.getTime();
      } else if (sortField === "fee") {
        aVal = a.fee;
        bVal = b.fee;
      } else if (sortField === "duration_minutes") {
        aVal = a.duration_minutes;
        bVal = b.duration_minutes;
      }

      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });

    return result;
  }, [
    sessions,
    searchQuery,
    statusFilter,
    vehicleTypeFilter,
    startDate,
    endDate,
    sortField,
    sortOrder,
  ]);

  const totalPages = Math.ceil(processedSessions.length / itemsPerPage);
  const paginatedSessions = processedSessions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const stats = useMemo(() => {
    return {
      total: processedSessions.length,
      completed: processedSessions.filter((s) => s.status === "completed")
        .length,
      ongoing: processedSessions.filter((s) => s.status === "ongoing").length,
      totalRevenue: processedSessions.reduce((sum, s) => sum + (s.fee || 0), 0),
      avgDuration:
        processedSessions.length > 0
          ? Math.round(
              processedSessions.reduce(
                (sum, s) => sum + (s.duration_minutes || 0),
                0,
              ) / processedSessions.length,
            )
          : 0,
    };
  }, [processedSessions]);

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString("id-ID", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      ongoing: "bg-yellow-500/20 text-yellow-500 border-yellow-500",
      completed: "bg-green-500/20 text-green-500 border-green-500",
      abandoned: "bg-red-500/20 text-red-500 border-red-500",
    };
    return styles[status] || "bg-gray-500/20 text-gray-500 border-gray-500";
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const handleRefresh = () => {
    setCurrentPage(1);
    fetchSessions(true);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <Y2KCard title="TOTAL_SESSIONS" className="text-center">
          <p className="text-(--color-y2k-lime) font-black text-3xl sm:text-4xl">
            {stats.total}
          </p>
        </Y2KCard>

        <Y2KCard title="COMPLETED" className="text-center">
          <p className="text-(--color-y2k-lime) font-black text-3xl sm:text-4xl">
            {stats.completed}
          </p>
        </Y2KCard>

        <Y2KCard title="ONGOING" className="text-center">
          <p className="text-yellow-500 font-black text-3xl sm:text-4xl">
            {stats.ongoing}
          </p>
        </Y2KCard>

        <Y2KCard title="TOTAL_REVENUE" className="text-center">
          <p className="text-(--color-y2k-lime) font-black text-xl sm:text-2xl font-mono">
            Rp {(stats.totalRevenue / 1000).toFixed(0)}k
          </p>
        </Y2KCard>

        <Y2KCard title="AVG_DURATION" className="text-center">
          <p className="text-(--color-y2k-lime) font-black text-3xl sm:text-4xl">
            {stats.avgDuration}
            <span className="text-sm">m</span>
          </p>
        </Y2KCard>
      </div>

      <Y2KCard
        title="FILTERS"
        icon={Filter}
        headerAction={
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-(--color-y2k-lime) text-(--color-y2k-lime) text-[10px] font-black uppercase tracking-wider hover:bg-(--color-y2k-lime)/10 transition-all"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-gray-500 text-xs font-bold uppercase tracking-wider block mb-2">
              Search RFID / Slot
            </label>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-3 text-gray-500"
              />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 bg-(--color-y2k-border)/20 border-2 border-(--color-y2k-border) text-(--color-y2k-text-main) font-mono text-sm focus:border-(--color-y2k-lime) focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-gray-500 text-xs font-bold uppercase tracking-wider block mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 bg-white dark:bg-(--color-y2k-border)/20 border-2 border-(--color-y2k-border) text-gray-700 dark:text-(--color-y2k-text-main) font-mono text-sm focus:border-(--color-y2k-lime) focus:outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="">ALL</option>
                <option value="ongoing">ONGOING</option>
                <option value="completed">COMPLETED</option>
                <option value="abandoned">ABANDONED</option>
              </select>
            </div>

            <div>
              <label className="text-gray-500 text-xs font-bold uppercase tracking-wider block mb-2">
                Vehicle Type
              </label>
              <select
                value={vehicleTypeFilter}
                onChange={(e) => {
                  setVehicleTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 bg-white dark:bg-(--color-y2k-border)/20 border-2 border-(--color-y2k-border) text-gray-700 dark:text-(--color-y2k-text-main) font-mono text-sm focus:border-(--color-y2k-lime) focus:outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="">ALL</option>
                <option value="car">CAR</option>
                <option value="motorcycle">MOTORCYCLE</option>
                <option value="truck">TRUCK</option>
              </select>
            </div>

            <div>
              <label className="text-gray-500 text-xs font-bold uppercase tracking-wider block mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 bg-white dark:bg-(--color-y2k-border)/20 border-2 border-(--color-y2k-border) text-gray-700 dark:text-(--color-y2k-text-main) font-mono text-sm focus:border-(--color-y2k-lime) focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-gray-500 text-xs font-bold uppercase tracking-wider block mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 bg-white dark:bg-(--color-y2k-border)/20 border-2 border-(--color-y2k-border) text-gray-700 dark:text-(--color-y2k-text-main) font-mono text-sm focus:border-(--color-y2k-lime) focus:outline-none transition-all"
              />
            </div>
          </div>

          {(searchQuery ||
            statusFilter ||
            vehicleTypeFilter ||
            startDate ||
            endDate) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("");
                setVehicleTypeFilter("");
                setStartDate("");
                setEndDate("");
                setCurrentPage(1);
              }}
              className="text-(--color-y2k-lime) underline text-xs font-bold uppercase hover:opacity-70"
            >
              CLEAR_ALL_FILTERS
            </button>
          )}
        </div>
      </Y2KCard>

      <Y2KCard title="SESSION_HISTORY">
        {loading ? (
          <div className="text-center py-8 text-(--color-y2k-lime) font-black uppercase">
            LOADING_DATA...
          </div>
        ) : paginatedSessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 font-bold uppercase">
            NO_SESSIONS_FOUND
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm table-fixed">
              <colgroup>
                <col style={{ width: "12%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "20%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "10%" }} />
              </colgroup>
              <thead>
                <tr className="border-b-2 border-(--color-y2k-lime) text-(--color-y2k-lime) font-bold align-middle">
                  <th className="text-left p-3 font-black uppercase whitespace-nowrap">
                    RFID_UID
                  </th>
                  <th className="text-left p-3 font-black uppercase whitespace-nowrap">
                    SLOT_ID
                  </th>
                  <th className="text-left p-3 font-black uppercase whitespace-nowrap">
                    VEHICLE
                  </th>
                  <th
                    className="text-left p-3 font-black uppercase cursor-pointer hover:text-(--color-y2k-purple) transition-all whitespace-nowrap"
                    onClick={() => handleSort("created_at")}
                  >
                    CHECK_IN
                    <ArrowUpDown
                      size={12}
                      className={`inline ml-1 transition-transform ${
                        sortField === "created_at"
                          ? `text-(--color-y2k-lime) ${
                              sortOrder === "asc" ? "rotate-180" : ""
                            }`
                          : "text-gray-500"
                      }`}
                    />
                  </th>
                  <th
                    className="text-left p-3 font-black uppercase cursor-pointer hover:text-(--color-y2k-purple) transition-all whitespace-nowrap"
                    onClick={() => handleSort("duration_minutes")}
                  >
                    DURATION
                    <ArrowUpDown
                      size={12}
                      className={`inline ml-1 transition-transform ${
                        sortField === "duration_minutes"
                          ? `text-(--color-y2k-lime) ${
                              sortOrder === "asc" ? "rotate-180" : ""
                            }`
                          : "text-gray-500"
                      }`}
                    />
                  </th>
                  <th
                    className="text-left p-3 font-black uppercase cursor-pointer hover:text-(--color-y2k-purple) transition-all whitespace-nowrap"
                    onClick={() => handleSort("fee")}
                  >
                    FEE
                    <ArrowUpDown
                      size={12}
                      className={`inline ml-1 transition-transform ${
                        sortField === "fee"
                          ? `text-(--color-y2k-lime) ${
                              sortOrder === "asc" ? "rotate-180" : ""
                            }`
                          : "text-gray-500"
                      }`}
                    />
                  </th>
                  <th className="text-left p-3 font-black uppercase whitespace-nowrap">
                    STATUS
                  </th>
                  <th className="text-left p-3 font-black uppercase whitespace-nowrap">
                    ACTION
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedSessions.map((session) => (
                  <tr
                    key={session.id}
                    className="border-b border-(--color-y2k-border)/50 hover:bg-(--color-y2k-border)/10 transition-all cursor-pointer"
                  >
                    <td className="p-3 text-(--color-y2k-lime) font-mono font-bold break-all">
                      {session.rfid_uid.substring(0, 8)}...
                    </td>
                    <td className="p-3 text-(--color-y2k-lime) font-mono font-bold">
                      {session.slot_id}
                    </td>
                    <td className="p-3">
                      <span className="bg-blue-500/20 text-blue-500 border border-blue-500 px-2 py-1 font-bold text-xs">
                        {session.vehicle_type?.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 text-gray-400 font-mono text-xs">
                      {formatDateTime(session.check_in)}
                    </td>
                    <td className="p-3 text-gray-400 font-bold">
                      {session.duration_minutes} min
                    </td>
                    <td className="p-3 text-(--color-y2k-lime) font-black font-mono">
                      Rp {session.fee.toLocaleString("id-ID")}
                    </td>
                    <td className="p-3">
                      <span
                        className={`${getStatusBadge(session.status)} border px-2 py-1 font-bold text-xs`}
                      >
                        {session.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => {
                          setSelectedSession(session);
                          setIsDetailOpen(true);
                        }}
                        className="text-(--color-y2k-lime) underline hover:text-(--color-y2k-purple) font-bold text-xs transition-all"
                      >
                        VIEW
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6 pt-6 border-t-2 border-(--color-y2k-border)">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border-2 border-(--color-y2k-lime) text-(--color-y2k-lime) font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-(--color-y2k-lime)/10 transition-all"
            >
              PREV
            </button>

            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 border-2 font-bold text-xs transition-all ${
                      currentPage === pageNum
                        ? "bg-(--color-y2k-lime) text-(--color-y2k-button-text) border-(--color-y2k-lime)"
                        : "border-(--color-y2k-lime) text-(--color-y2k-lime) hover:bg-(--color-y2k-lime)/10"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="px-3 py-2 border-2 border-(--color-y2k-lime) text-(--color-y2k-lime) font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-(--color-y2k-lime)/10 transition-all"
            >
              NEXT
            </button>

            <span className="text-gray-500 text-xs font-bold ml-4">
              PAGE {currentPage} OF {totalPages}
            </span>
          </div>
        )}

        {dataSource && (
          <div className="mt-4 text-[9px] text-gray-500 uppercase tracking-widest font-bold">
            Data_Source: {dataSource}
          </div>
        )}
      </Y2KCard>

      <SessionDetailModal
        session={selectedSession}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />
    </div>
  );
}
