"use client";

import { useState, useCallback } from "react";

export interface Toast {
    id: string;
    message: string;
    type: "success" | "info" | "error";
}

export function useToast() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: Toast["type"] = "success") => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    return { toasts, showToast };
}
