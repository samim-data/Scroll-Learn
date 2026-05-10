import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  heightPct?: number; // default 70
  variant?: "sheet" | "dialog";
  children: ReactNode;
};

export function BottomSheet({ open, onClose, title, heightPct = 70, variant = "sheet", children }: Props) {
  const isDialog = variant === "dialog";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center ${isDialog ? "items-center p-4" : "items-end"}`}
          onClick={onClose}
        >
          <motion.div
            initial={isDialog ? { opacity: 0, scale: 0.96, y: 12 } : { y: "100%" }}
            animate={isDialog ? { opacity: 1, scale: 1, y: 0 } : { y: 0 }}
            exit={isDialog ? { opacity: 0, scale: 0.96, y: 12 } : { y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            style={{ height: isDialog ? `min(${heightPct}vh, 620px)` : `${heightPct}vh` }}
            className={`${isDialog ? "w-[calc(100vw-2rem)] max-w-md rounded-lg" : "w-full sm:max-w-lg sm:mb-6 sm:rounded-2xl rounded-t-xl"} bg-card flex flex-col overflow-hidden shadow-2xl border border-white/10`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="pt-3 pb-2 flex justify-center shrink-0">
              <div className="w-10 h-1.5 rounded-full bg-white/20" />
            </div>
            {title && (
              <div className="px-6 pb-3 flex items-center justify-between shrink-0">
                <h2 className="text-lg font-bold">{title}</h2>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-lg"
                >
                  ×
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
