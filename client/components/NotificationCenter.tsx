"use client";

import React, { useEffect, useState, useRef } from "react";
import { useBoardStore, Notification } from "@/app/store";
import { Bell, X, Check, Trash2, ExternalLink, Inbox } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const NotificationCenter = () => {
    const {
        notifications,
        fetchNotifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification
    } = useBoardStore();

    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const unreadCount = notifications.filter(n => !n.isRead).length;

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2.5 text-zinc-400 hover:text-primary hover:bg-white/5 rounded-xl border border-white/5 transition-all duration-200"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary border-2 border-[#09090b]">
                        </span>
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-4 w-80 md:w-96 bg-zinc-900 border border-zinc-800 rounded-2xl z-50 overflow-hidden transform origin-top-right transition-all duration-200 shadow-2xl">
                    <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            Notifications
                            {unreadCount > 0 && (
                                <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                    {unreadCount} New
                                </span>
                            )}
                        </h3>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={() => markAllNotificationsAsRead()}
                                    className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
                                    title="Mark all as read"
                                >
                                    <Check className="w-4 h-4" />
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto no-scrollbar bg-zinc-900">
                        {notifications.length === 0 ? (
                            <div className="p-12 text-center flex flex-col items-center justify-center gap-4">
                                <div className="w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center">
                                    <Inbox className="w-7 h-7 text-zinc-600" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-white font-semibold text-sm">Quiet here...</p>
                                    <p className="text-zinc-500 text-xs">No notifications to show yet.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="divide-y divide-zinc-800">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-5 transition-colors relative group ${notification.isRead ? "bg-transparent" : "bg-primary/5"
                                            } hover:bg-zinc-800/50`}
                                    >
                                        <div className="flex gap-4">
                                            <div className="flex-grow">
                                                <div className="flex items-start justify-between gap-3">
                                                    <p className={`text-sm ${notification.isRead ? "text-zinc-400" : "font-bold text-white"}`}>
                                                        {notification.title}
                                                    </p>
                                                    <p className="text-[10px] font-medium text-zinc-500 whitespace-nowrap mt-1">
                                                        {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                                                    </p>
                                                </div>
                                                <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                {notification.link && (
                                                    <a
                                                        href={notification.link}
                                                        className="inline-flex items-center gap-1.5 mt-3 text-[10px] font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-wider"
                                                    >
                                                        View details <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                )}
                                            </div>
                                        </div>

                                        <div className="absolute top-5 right-5 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {!notification.isRead && (
                                                <button
                                                    onClick={() => markNotificationAsRead(notification.id)}
                                                    className="p-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                                                    title="Mark as read"
                                                >
                                                    <Check className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => deleteNotification(notification.id)}
                                                className="p-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-zinc-800 bg-zinc-950 text-center">
                        <button
                            className="text-xs font-bold text-zinc-500 hover:text-white transition-colors uppercase tracking-widest"
                            onClick={() => setIsOpen(false)}
                        >
                            Close Center
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

