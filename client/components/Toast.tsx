"use client";

import React, { useEffect, useState } from "react";
import { useBoardStore, Toast as ToastType } from "@/app/store";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
};

const bgColors = {
    success: "border-green-500/20 text-green-500",
    error: "border-red-500/20 text-red-500",
    info: "border-blue-500/20 text-blue-500",
    warning: "border-yellow-500/20 text-yellow-500",
};

const Toast = ({ toast }: { toast: ToastType }) => {
    const removeToast = useBoardStore((state) => state.removeToast);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsExiting(true);
        }, 2700);

        return () => clearTimeout(timer);
    }, []);

    return (
        <div
            className={`
        flex items-center gap-4 p-4 mb-4 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl
        transform transition-all duration-500 min-w-[320px] max-w-md
        ${isExiting ? "opacity-0 translate-x-12 scale-95" : "opacity-100 translate-x-0 scale-100"}
        ${bgColors[toast.type]}
      `}
        >
            <div className="flex-shrink-0 bg-zinc-800 p-2 rounded-xl border border-zinc-700">
                {icons[toast.type]}
            </div>
            <div className="flex-grow">
                <p className="text-sm font-bold text-white leading-tight">{toast.message}</p>
            </div>
            <button
                onClick={() => {
                    setIsExiting(true);
                    setTimeout(() => removeToast(toast.id), 300);
                }}
                className="flex-shrink-0 text-zinc-500 hover:text-white transition-colors p-1"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};



export const ToastContainer = () => {
    const toasts = useBoardStore((state) => state.toasts);

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
            {toasts.map((toast) => (
                <Toast key={toast.id} toast={toast} />
            ))}
        </div>
    );
};
