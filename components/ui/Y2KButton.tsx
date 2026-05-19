const Y2KButton = ({ children, onClick, variant = 'lime', disabled, className = "" }: any) => {
  const styles: any = {
    lime: 'bg-[#C4FF4D] text-[#1A1A1A] border-[#1A1A1A] shadow-[4px_4px_0px_0px_#BA8CFF]',
    purple: 'bg-[#BA8CFF] text-[#1A1A1A] border-[#1A1A1A] shadow-[4px_4px_0px_0px_#C4FF4D]',
    outline: 'bg-transparent text-[#C4FF4D] border-[#C4FF4D] shadow-[4px_4px_0px_0px_#4D4D4D]'
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