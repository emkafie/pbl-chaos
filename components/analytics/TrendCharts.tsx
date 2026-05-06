"use client";
import React, { useEffect, useRef, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  LineChart, Line 
} from 'recharts';

function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!ref.current) return;
    
    // Set initial size
    setSize({
      width: ref.current.offsetWidth,
      height: ref.current.offsetHeight,
    });

    const observer = new ResizeObserver(([entry]) => {
      // Request animation frame to avoid ResizeObserver loop limit exceeded error
      window.requestAnimationFrame(() => {
        if (!ref.current) return;
        setSize({
          width: ref.current.offsetWidth,
          height: ref.current.offsetHeight,
        });
      });
    });
    
    observer.observe(ref.current);
    return () => {
      observer.disconnect();
    };
  }, []);

  return [ref, size] as const;
}

interface Props {
  hourlyData: { hour: string; count: number }[];
  dailyRevenue: { date: string; total: number }[];
}

export const TrendCharts = ({ hourlyData, dailyRevenue }: Props) => {
  const [barRef, barSize] = useElementSize<HTMLDivElement>();
  const [lineRef, lineSize] = useElementSize<HTMLDivElement>();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Grafik Jam Sibuk */}
      <div className="bg-[#1A1A1A] border-4 border-[#C4FF4D] p-6 shadow-[6px_6px_0px_0px_#C4FF4D]">
        <h3 className="text-[#C4FF4D] font-black uppercase text-sm mb-6 italic tracking-widest">
          Peak_Hours_Analysis (24h)
        </h3>
        <div className="h-64 w-full" ref={barRef}>
          {barSize.width > 0 && barSize.height > 0 && (
            <BarChart 
              width={barSize.width}
              height={barSize.height}
              data={hourlyData}
              margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#4D4D4D" vertical={false} />
              <XAxis 
                dataKey="hour" 
                stroke="#888" 
                fontSize={10} 
                tickLine={false} 
                angle={-45}
                textAnchor="end"
                height={40}
                interval="preserveStartEnd"
              />
              <YAxis 
                stroke="#888" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                width={40}
                tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1A1A1A', border: '2px solid #BA8CFF', color: '#FFF', fontSize: '10px' }}
                cursor={{ fill: 'rgba(186, 140, 255, 0.1)' }}
              />
              <Bar dataKey="count" fill="#C4FF4D" radius={[2, 2, 0, 0]} />
            </BarChart>
          )}
        </div>
      </div>

      {/* Grafik Tren Pendapatan */}
      <div className="bg-[#1A1A1A] border-4 border-[#BA8CFF] p-6 shadow-[6px_6px_0px_0px_#BA8CFF]">
        <h3 className="text-[#BA8CFF] font-black uppercase text-sm mb-6 italic tracking-widest">
          Revenue_Trend_Daily
        </h3>
        <div className="h-64 w-full" ref={lineRef}>
          {lineSize.width > 0 && lineSize.height > 0 && (
            <LineChart 
              width={lineSize.width}
              height={lineSize.height}
              data={dailyRevenue}
              margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#4D4D4D" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#888" 
                fontSize={10} 
                tickLine={false} 
                angle={-45}
                textAnchor="end"
                height={40}
                interval="preserveStartEnd"
              />
              <YAxis 
                stroke="#888" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                width={50}
                tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1A1A1A', border: '2px solid #C4FF4D', color: '#FFF', fontSize: '10px' }}
                formatter={(value: any) => [`Rp ${Number(value).toLocaleString()}`, 'Revenue']}
              />
              <Line type="monotone" dataKey="total" stroke="#BA8CFF" strokeWidth={3} dot={{ fill: '#BA8CFF', r: 4 }} activeDot={{ r: 6, stroke: '#C4FF4D', strokeWidth: 2 }} />
            </LineChart>
          )}
        </div>
      </div>
    </div>
  );
};