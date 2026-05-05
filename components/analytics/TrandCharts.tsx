"use client";
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, LineChart, Line, Cell, PieChart, Pie 
} from 'recharts';

interface Props {
  hourlyData: { hour: string; count: number }[];
  dailyRevenue: { date: string; total: number }[];
}

export const TrendCharts = ({ hourlyData, dailyRevenue }: Props) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Grafik Jam Sibuk */}
      <div className="bg-[#1A1A1A] border-4 border-[#C4FF4D] p-6 shadow-[6px_6px_0px_0px_#C4FF4D]">
        <h3 className="text-[#C4FF4D] font-black uppercase text-sm mb-6 italic tracking-widest">
          Peak_Hours_Analysis (24h)
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4D4D4D" vertical={false} />
              <XAxis dataKey="hour" stroke="#888" fontSize={10} tickLine={false} />
              <YAxis stroke="#888" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1A1A1A', border: '2px solid #BA8CFF', color: '#FFF', fontSize: '10px' }}
                cursor={{ fill: 'rgba(186, 140, 255, 0.1)' }}
              />
              <Bar dataKey="count" fill="#C4FF4D" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grafik Tren Pendapatan */}
      <div className="bg-[#1A1A1A] border-4 border-[#BA8CFF] p-6 shadow-[6px_6px_0px_0px_#BA8CFF]">
        <h3 className="text-[#BA8CFF] font-black uppercase text-sm mb-6 italic tracking-widest">
          Revenue_Trend_Daily
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4D4D4D" vertical={false} />
              <XAxis dataKey="date" stroke="#888" fontSize={10} tickLine={false} />
              <YAxis stroke="#888" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1A1A1A', border: '2px solid #C4FF4D', color: '#FFF', fontSize: '10px' }}
              />
              <Line type="monotone" dataKey="total" stroke="#BA8CFF" strokeWidth={3} dot={{ fill: '#BA8CFF', r: 4 }} activeDot={{ r: 6, stroke: '#C4FF4D', strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};