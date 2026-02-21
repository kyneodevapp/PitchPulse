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
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-purple-500/40 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />

                <svg
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full relative z-10"
                >
                    {/* Stylized 'P' Background Shield */}
                    <path
                        d="M20 15C20 9.47715 24.4772 5 30 5H70C75.5228 5 80 9.47715 80 15V85C80 90.5228 75.5228 95 70 95H30C24.4772 95 20 90.5228 20 85V15Z"
                        className="fill-black/40 stroke-white/10"
                        strokeWidth="2"
                    />

                    {/* Pulse Wave Path */}
                    <motion.path
                        d="M25 60H35L40 45L50 80L60 20L65 60H75"
                        stroke="url(#pulse-gradient)"
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

                    {/* Overlay Grid Pattern for extra tech feel */}
                    <defs>
                        <linearGradient id="pulse-gradient" x1="25" y1="50" x2="75" y2="50" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#A855F7" />
                            <stop offset="0.5" stopColor="#6366F1" />
                            <stop offset="1" stopColor="#A855F7" />
                        </linearGradient>
                    </defs>
                </svg>

                {/* Glass Overlap Effect */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/10 to-transparent pointer-events-none border border-white/5" />
            </div>

            {showText && (
                <div className="flex flex-col">
                    <span className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/60">
                        PitchPulse
                    </span>
                    <span className="text-[8px] font-black uppercase tracking-[0.4em] text-purple-400 leading-none">
                        AI Precision
                    </span>
                </div>
            )}
        </div>
    );
}
