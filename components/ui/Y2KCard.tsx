import React from "react";

interface Y2KCardProps {
  title?: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  variant?: "purple" | "grey" | "lime";
  className?: string;
  headerAction?: React.ReactNode;
}

const Y2KCard: React.FC<Y2KCardProps> = ({
  title,
  icon: Icon,
  children,
  variant = "purple",
  className = "",
  headerAction,
}) => {
  const variants = {
    purple: "border-[var(--color-y2k-purple)] shadow-[6px_6px_0px_0px_var(--color-y2k-purple)]",
    grey: "border-[var(--color-y2k-border)] shadow-[6px_6px_0px_0px_var(--color-y2k-border)]",
    lime: "border-[var(--color-y2k-lime)] shadow-[6px_6px_0px_0px_var(--color-y2k-lime)]",
  };

  return (
    <div
      className={`bg-[var(--color-y2k-bg-main)] border-4 p-6 mb-10 ${variants[variant]} ${className}`}
    >
      {title && (
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-[var(--color-y2k-lime)] font-black uppercase text-lg italic tracking-widest flex items-center gap-2">
            {Icon && <Icon size={20} />} {title}
          </h3>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

export default Y2KCard;
