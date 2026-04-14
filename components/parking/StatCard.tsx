import React from "react";

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color }) => {
  return (
    <div
      className="bg-[#1A1A1A] p-6 border-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between font-mono"
      style={{ borderColor: color }}
    >
      <div>
        <p
          className="text-[10px] font-bold uppercase tracking-widest mb-1"
          style={{ color }}
        >
          {label}
        </p>
        <h4 className="text-3xl font-black italic">{value}</h4>
      </div>
      <div className="p-2 border-2" style={{ borderColor: color, color }}>
        {icon}
      </div>
    </div>
  );
};

export default StatCard;
