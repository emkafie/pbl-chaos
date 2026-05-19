const Y2KButton = ({
  children,
  onClick,
  variant = "lime",
  disabled,
  className = "",
}: any) => {
  const styles: any = {
    lime: "bg-(--color-y2k-lime) text-(--color-y2k-button-text) border-(--color-y2k-solid-border) shadow-[4px_4px_0px_0px_(--color-y2k-purple)]",
    purple:
      "bg-(--color-y2k-purple) text-(--color-y2k-button-text) border-(--color-y2k-solid-border) shadow-[4px_4px_0px_0px_(--color-y2k-lime)]",
    outline:
      "bg-transparent text-(--color-y2k-lime) border-(--color-y2k-lime) shadow-[4px_4px_0px_0px_(--color-y2k-border)]",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-8 py-3 font-black uppercase text-sm italic tracking-widest border-2 transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export default Y2KButton;
