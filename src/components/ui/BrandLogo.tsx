"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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
        sm: "w-6 h-6",
        md: "w-8 h-8",
        lg: "w-12 h-12",
        xl: "w-20 h-20"
    };

    return (
        <div className={cn("flex items-center gap-3", className)}>
            <div className={cn("relative group", sizes[size])}>
                <svg
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full relative z-10"
                >
                    {/* Stylized Shield Background */}
                    <path
                        d="M20 15C20 9.47715 24.4772 5 30 5H70C75.5228 5 80 9.47715 80 15V85C80 90.5228 75.5228 95 70 95H30C24.4772 95 20 90.5228 20 85V15Z"
                        className="fill-[#111827] stroke-[#1F2937]"
                        strokeWidth="2"
                    />

                    {/* Pulse Wave Path */}
                    <motion.path
                        d="M25 60H35L40 45L50 80L60 20L65 60H75"
                        stroke="#FBBF24"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={animated ? { pathLength: 0, opacity: 0 } : { pathLength: 1, opacity: 1 }}
                        animate={animated ? {
                            pathLength: [0, 1, 1],
                            opacity: [0, 1, 1],
                            pathOffset: [0, 0, 1]
                        } : {}}
                        transition={animated ? {
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                            times: [0, 0.4, 1]
                        } : {}}
                    />
                </svg>
            </div>

            {showText && (
                <div className="flex flex-col">
                    <span className="text-xl font-black tracking-tight text-white leading-tight">
                        PitchPulse
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-[#FBBF24] leading-none">
                        TERMINAL
                    </span>
                </div>
            )}
        </div>
    );
}
