"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Toast as ToastType } from "@/lib/hooks/useToast";
import { CheckCircle2, Info, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastProps {
    toasts: ToastType[];
}

export function ToastContainer({ toasts }: ToastProps) {
    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-3 pointer-events-none">
            <AnimatePresence>
                {toasts.map((toast) => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        className={cn(
                            "flex items-center gap-3 px-6 py-3 rounded-2xl glass-dark border border-white/10 shadow-2xl pointer-events-auto",
                            "min-w-[280px] max-w-md"
                        )}
                    >
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center",
                            toast.type === "success" ? "bg-emerald-500/10 text-emerald-500" :
                                toast.type === "info" ? "bg-indigo-500/10 text-indigo-500" :
                                    "bg-rose-500/10 text-rose-500"
                        )}>
                            {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> :
                                toast.type === "info" ? <Info className="w-4 h-4" /> :
                                    <AlertCircle className="w-4 h-4" />}
                        </div>
                        <span className="text-sm font-bold text-white uppercase tracking-tight">
                            {toast.message}
                        </span>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
