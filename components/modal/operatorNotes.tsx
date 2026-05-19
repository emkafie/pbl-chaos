"use client";

import Y2KCard from "../ui/Y2KCard";
import { AlertCircle, X } from "lucide-react";

interface OperatorNotesModalProps {
  onClose: () => void;
}

export default function OperatorNotesModal({ onClose }: OperatorNotesModalProps) {
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 md:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-lg animate-in zoom-in-95 duration-300">
        <Y2KCard 
          title="SYSTEM_MESSAGE: OPERATOR_NOTES" 
          variant="grey" 
          className="shadow-[10px_10px_0px_0px_var(--color-y2k-purple)] mb-0"
        >
          <div className="space-y-6">
            <div className="p-6 bg-yellow-500/10 border-4 border-yellow-500 text-yellow-500 font-bold italic flex flex-col items-center text-center gap-4">
              <AlertCircle size={48} strokeWidth={3} className="animate-pulse" />
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] opacity-70">Security Alert Level: Moderate</p>
                <p className="text-sm md:text-base leading-relaxed uppercase tracking-tighter">
                  REMINDER: Check Sensor Slot A3. It reported intermittent connectivity 10 mins ago. 
                  Possible hardware failure or interference detected by IoT Gateway.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={onClose}
                className="w-full bg-(--color-y2k-lime) text-(--color-y2k-button-text) font-black py-4 border-2 border-(--color-y2k-solid-border) shadow-[4px_4px_0px_0px_var(--color-y2k-purple)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all uppercase text-xs tracking-widest"
              >
                Acknowledge_Message
              </button>
              
              <button 
                onClick={onClose}
                className="w-full text-[10px] font-bold text-gray-500 hover:text-(--color-y2k-text-main) uppercase tracking-widest transition-colors italic"
              >
                Ignore_Temporarily
              </button>
            </div>
          </div>
        </Y2KCard>

        {/* Close Button Pin */}
        <button 
          onClick={onClose}
          aria-label="close modal"
          className="absolute -top-3 -right-3 bg-(--color-y2k-purple) text-(--color-y2k-button-text) p-2 border-2 border-(--color-y2k-solid-border) shadow-[2px_2px_0px_0px_var(--color-y2k-lime)] hover:scale-110 active:scale-95 transition-all"
        >
          <X size={16} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}