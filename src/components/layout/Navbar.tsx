"use client";

import Link from "next/link";
import { LayoutDashboard, History, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

import { useSubscription } from "@/lib/hooks/useSubscription";

const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "History", href: "/history", icon: History },
];

export function Navbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { isSubscribed, trialActive, daysLeft } = useSubscription();

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-black/50 backdrop-blur-xl">
            <div className="container mx-auto px-4">
                <div className="flex h-16 items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <motion.div
                            initial={{ rotate: -10 }}
                            animate={{ rotate: 0 }}
                            className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center"
                        >
                            <LayoutDashboard className="w-5 h-5 text-white" />
                        </motion.div>
                        <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                            PitchPulse
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center gap-6">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex items-center gap-2 text-sm font-medium text-white/60 hover:text-white transition-colors"
                            >
                                <item.icon className="w-4 h-4" />
                                {item.name}
                            </Link>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-4">
                            <SignedOut>
                                <SignInButton mode="modal">
                                    <button className="px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:scale-105 transition-all text-sm font-bold shadow-lg shadow-purple-500/20 text-white">
                                        Sign In
                                    </button>
                                </SignInButton>
                            </SignedOut>
                            <SignedIn>
                                <div className="flex items-center gap-4">
                                    {!isSubscribed && trialActive && (
                                        <div className="hidden lg:flex flex-col items-end">
                                            <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Pro Trial</span>
                                            <span className="text-[8px] font-bold text-white/40 uppercase">{daysLeft} days left</span>
                                        </div>
                                    )}
                                    <UserButton />
                                </div>
                            </SignedIn>
                        </div>

                        {/* Mobile Menu Toggle */}
                        <button
                            className="md:hidden p-2 text-white/60 hover:text-white transition-colors"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden border-t border-white/5 bg-black/95 backdrop-blur-2xl overflow-hidden"
                    >
                        <div className="flex flex-col p-4 gap-4">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 text-sm font-semibold text-white/80 hover:text-white transition-all active:scale-95 border border-white/5"
                                >
                                    <item.icon className="w-5 h-5 text-purple-400" />
                                    {item.name}
                                </Link>
                            ))}
                            <div className="grid grid-cols-2 gap-3 mt-4">
                                <SignedOut>
                                    <SignInButton mode="modal">
                                        <button className="col-span-2 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-sm font-bold text-white shadow-lg shadow-purple-500/20 border border-white/10">
                                            Sign In
                                        </button>
                                    </SignInButton>
                                </SignedOut>
                                <SignedIn>
                                    <div className="col-span-2 flex justify-center py-2">
                                        <UserButton afterSignOutUrl="/" />
                                    </div>
                                </SignedIn>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
