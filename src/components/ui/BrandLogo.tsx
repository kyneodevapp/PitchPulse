"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface BrandLogoProps {
    className?: string;
    size?: "sm" | "md" | "lg" | "xl";
    showText?: boolean;
    animated?: boolean;
}

export function BrandLogo({
    className,
    size = "md",
    showText = false,
    animated = true
}: BrandLogoProps) {
    const sizes = {
        sm: "w-8 h-8",
        md: "w-12 h-12",
        lg: "w-16 h-16",
        xl: "w-32 h-32"
    };

    return (
        <div className={cn("flex items-center gap-3", className)}>
            <div className={cn("relative group overflow-hidden rounded-xl border border-white/10 shadow-2xl", sizes[size])}>
                <motion.div
                    initial={animated ? { scale: 0.8, opacity: 0 } : { scale: 1, opacity: 1 }}
                    animate={animated ? { scale: 1, opacity: 1 } : {}}
                    whileHover={{ scale: 1.05 }}
                    className="w-full h-full relative"
                >
                    <Image
                        src="/images/logo-new.png"
                        alt="PitchPulse"
                        fill
                        className="object-cover"
                        priority
                    />
                </motion.div>
            </div>

            {showText && (
                <div className="flex flex-col">
                    <span className="text-2xl font-black tracking-tighter text-white leading-[0.9]">
                        PitchPulse
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#FBBF24] leading-none mt-1">
                        TERMINAL
                    </span>
                </div>
            )}
        </div>
    );
}
