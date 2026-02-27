"use client";

import Link from "next/link";
import { LayoutDashboard, History, Menu, X, Snowflake } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

import { useSubscription } from "@/lib/hooks/useSubscription";
import { BrandLogo } from "../ui/BrandLogo";

const navItems = [
    { name: "Terminal", href: "/", icon: LayoutDashboard },
    { name: "ACCA Freeze", href: "/acca-freeze", icon: Snowflake },
    { name: "History", href: "/history", icon: History },
];

export function Navbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const { isSubscribed, trialActive, daysLeft } = useSubscription();

    // Clerk auth state is only known client-side. Rendering auth buttons only
    // after mount prevents a server/client structural mismatch (hydration error).
    useEffect(() => { setMounted(true); }, []);

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-[#1F2937] bg-[#0B0F14]">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    <Link href="/" className="group">
                        <BrandLogo showText={true} />
                    </Link>

                    <div className="hidden md:flex items-center gap-8">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex items-center gap-2 text-xs font-bold text-neutral-400 hover:text-white uppercase tracking-widest transition-colors"
                            >
                                <item.icon className="w-3.5 h-3.5" />
                                {item.name}
                            </Link>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        {mounted && (
                            <div className="hidden sm:flex items-center gap-6">
                                <SignedOut>
                                    <SignInButton mode="modal">
                                        <button className="px-5 py-2.5 rounded-lg bg-[#FBBF24] hover:bg-white transition-all text-xs font-bold text-black uppercase tracking-widest">
                                            Terminal Login
                                        </button>
                                    </SignInButton>
                                </SignedOut>
                                <SignedIn>
                                    <div className="flex items-center gap-4">
                                        {!isSubscribed && trialActive && (
                                            <div className="hidden lg:flex flex-col items-end">
                                                <span className="text-[9px] font-bold text-[#FBBF24] uppercase tracking-widest">Pro Status</span>
                                                <span className="text-[8px] font-bold text-neutral-500 uppercase">{daysLeft} Days Remain</span>
                                            </div>
                                        )}
                                        <UserButton
                                            appearance={{
                                                elements: {
                                                    userButtonAvatarBox: "w-8 h-8 rounded-lg border border-[#1F2937]",
                                                    userButtonTrigger: "focus:shadow-none"
                                                }
                                            }}
                                        />
                                    </div>
                                </SignedIn>
                            </div>
                        )}

                        {/* Mobile Menu Toggle */}
                        <button
                            className="md:hidden p-2 text-neutral-400 hover:text-white transition-colors border border-[#1F2937] rounded-lg bg-[#111827]"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                            aria-expanded={isMobileMenuOpen}
                            aria-controls="mobile-nav-menu"
                        >
                            {isMobileMenuOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        id="mobile-nav-menu"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="md:hidden border-b border-[#1F2937] bg-[#111827] overflow-hidden"
                    >
                        <div className="flex flex-col p-6 gap-3">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex items-center gap-3 px-4 py-4 rounded-lg bg-[#0B0F14] border border-[#1F2937] text-xs font-bold text-neutral-400 uppercase tracking-widest hover:text-white transition-all"
                                >
                                    <item.icon className="w-4 h-4 text-[#FBBF24]" />
                                    {item.name}
                                </Link>
                            ))}
                            {mounted && (
                                <div className="pt-3 border-t border-[#1F2937] mt-3">
                                    <SignedOut>
                                        <SignInButton mode="modal">
                                            <button className="w-full px-4 py-4 rounded-lg bg-[#FBBF24] text-xs font-bold text-black uppercase tracking-widest shadow-lg">
                                                Login to Terminal
                                            </button>
                                        </SignInButton>
                                    </SignedOut>
                                    <SignedIn>
                                        <div className="flex items-center justify-between px-4 py-4 rounded-lg bg-[#0B0F14] border border-[#1F2937]">
                                            <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Active Account</span>
                                            <UserButton afterSignOutUrl="/" />
                                        </div>
                                    </SignedIn>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
