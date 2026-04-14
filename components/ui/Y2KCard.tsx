import React from "react";

interface Y2KCardProps {
  title?: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  variant?: "purple" | "grey" | "lime";
  className?: string;
}

const Y2KCard: React.FC<Y2KCardProps> = ({
  title,
  icon: Icon,
  children,
  variant = "purple",
  className = "",
}) => {
  const variants = {
    purple: "border-[#BA8CFF] shadow-[6px_6px_0px_0px_rgba(186,140,255,1)]",
    grey: "border-[#4D4D4D] shadow-[6px_6px_0px_0px_rgba(77,77,77,1)]",
    lime: "border-[#C4FF4D] shadow-[6px_6px_0px_0px_rgba(196,255,77,1)]",
  };

  return (
    <div
      className={`bg-[#1A1A1A] border-4 p-6 mb-10 ${variants[variant]} ${className}`}
    >
      {title && (
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-[#C4FF4D] font-black uppercase text-lg italic tracking-widest flex items-center gap-2">
            {Icon && <Icon size={20} />} {title}
          </h3>
        </div>
      )}
      {children}
    </div>
  );
};

export default Y2KCard;
