'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Mail, Shield, UserMinus, Loader2, Check } from 'lucide-react';
import { useBoardStore } from '@/app/store';
import { cn } from '@/lib/utils';
import { useSession } from '@/lib/auth-client';

interface InviteModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const InviteModal: React.FC<InviteModalProps> = ({ isOpen, onClose }) => {
    const activeBoardMembers = useBoardStore(state => state.activeBoardMembers);
    const fetchBoardMembers = useBoardStore(state => state.fetchBoardMembers);
    const inviteUser = useBoardStore(state => state.inviteUser);
    const activeBoardId = useBoardStore(state => state.activeBoardId);
    const updateMemberRole = useBoardStore(state => state.updateMemberRole);
    const removeMember = useBoardStore(state => state.removeMember);
    const boards = useBoardStore(state => state.boards);
    const { data: session } = useSession();

    const isOwner = boards.find(b => b.id === activeBoardId)?.userId === session?.user?.id;

    const [email, setEmail] = useState('');
    const [isInviting, setIsInviting] = useState(false);
    const [inviteSent, setInviteSent] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && activeBoardId) {
            fetchBoardMembers();
        }
    }, [isOpen, activeBoardId]);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        setIsInviting(true);
        setError(null);
        try {
            await inviteUser(email.trim());
            setInviteSent(true);
            setEmail('');
            setTimeout(() => setInviteSent(false), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to send invitation');
        } finally {
            setIsInviting(false);
        }
    };

    const handleRoleChange = async (memberId: string, role: "ADMIN" | "MEMBER" | "VIEWER") => {
        setUpdatingMemberId(memberId);
        await updateMemberRole(memberId, role);
        setUpdatingMemberId(null);
    };

    const handleRemoveMember = async (memberId: string) => {
        if (confirm("Are you sure you want to remove this member?")) {
            setUpdatingMemberId(memberId);
            await removeMember(memberId);
            setUpdatingMemberId(null);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-md max-h-[85vh] rounded-3xl border border-white/10 bg-zinc-900/50 shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-white/5 flex items-center justify-between bg-zinc-950/20">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                                <UserPlus className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Share Board</h2>
                                <p className="text-xs text-zinc-500">Invite others to collaborate on this board</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-white/5 transition-all"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Scrollable Body */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                        {/* Invite Form */}
                        {isOwner && (
                            <form onSubmit={handleInvite} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">
                                        Invite by Email
                                    </label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="teammate@example.com"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-primary/50 transition-all"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={isInviting || !email.trim()}
                                            className={cn(
                                                "px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                                                inviteSent
                                                    ? "bg-emerald-500 text-white"
                                                    : "bg-primary hover:bg-primary/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                            )}
                                        >
                                            {isInviting ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : inviteSent ? (
                                                <Check className="h-4 w-4" />
                                            ) : (
                                                "Invite"
                                            )}
                                        </button>
                                    </div>
                                    {error && (
                                        <p className="text-[11px] text-rose-500 px-1">{error}</p>
                                    )}
                                </div>
                            </form>
                        )}

                        {/* Member List */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">
                                Members ({activeBoardMembers.length})
                            </label>
                            <div className="space-y-2">
                                {activeBoardMembers.map((member, index) => (
                                    <div
                                        key={member.id || `member-${index}`}
                                        style={{ zIndex: openDropdownId === member.id ? 50 : activeBoardMembers.length - index }}
                                        className="relative flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <img
                                                    src={member.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.user.email}`}
                                                    alt={member.user.name || member.user.email}
                                                    className="h-10 w-10 rounded-xl bg-zinc-800 object-cover"
                                                />
                                                <div className="absolute -bottom-1 -right-1 p-1 rounded-md bg-zinc-900 border border-white/10 shadow-lg">
                                                    <Shield className={cn(
                                                        "h-2 w-2",
                                                        member.role === 'OWNER' ? "text-amber-500" : "text-zinc-500"
                                                    )} />
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-semibold text-zinc-200">
                                                    {member.user.name || member.user.email.split('@')[0]}
                                                    {member.user.email === session?.user?.email && (
                                                        <span className="ml-2 text-[10px] text-primary">(You)</span>
                                                    )}
                                                </h4>
                                                <div className="flex items-center gap-2">
                                                    {isOwner && member.role !== 'OWNER' ? (
                                                        <div className="relative">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setOpenDropdownId(openDropdownId === member.id ? null : member.id);
                                                                }}
                                                                className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all outline-none"
                                                            >
                                                                {member.role}
                                                                <Shield className="h-3 w-3" />
                                                            </button>

                                                            <AnimatePresence>
                                                                {openDropdownId === member.id && (
                                                                    <>
                                                                        <motion.div
                                                                            initial={{ opacity: 0 }}
                                                                            animate={{ opacity: 1 }}
                                                                            exit={{ opacity: 0 }}
                                                                            onClick={() => setOpenDropdownId(null)}
                                                                            className="fixed inset-0 z-30"
                                                                        />
                                                                        <motion.div
                                                                            initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                            exit={{ opacity: 0, scale: 0.95, y: 5 }}
                                                                            className="absolute left-0 top-full mt-2 w-32 z-40 bg-zinc-900 border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden backdrop-blur-3xl"
                                                                        >
                                                                            {(['ADMIN', 'MEMBER', 'VIEWER'] as const).map((role) => (
                                                                                <button
                                                                                    key={role}
                                                                                    onClick={() => {
                                                                                        handleRoleChange(member.id, role);
                                                                                        setOpenDropdownId(null);
                                                                                    }}
                                                                                    className={cn(
                                                                                        "w-full px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest transition-all hover:bg-white/5",
                                                                                        member.role === role ? "text-primary bg-primary/5" : "text-zinc-500 hover:text-white"
                                                                                    )}
                                                                                >
                                                                                    {role}
                                                                                </button>
                                                                            ))}
                                                                        </motion.div>
                                                                    </>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>
                                                    ) : (
                                                        <p className="text-[11px] text-zinc-500 uppercase tracking-tighter">
                                                            {member.role}
                                                        </p>
                                                    )}
                                                    {updatingMemberId === member.id && (
                                                        <Loader2 className="h-3 w-3 animate-spin text-primary shrink-0" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {isOwner && member.role !== 'OWNER' && (
                                            <button
                                                onClick={() => handleRemoveMember(member.id)}
                                                disabled={updatingMemberId === member.id}
                                                className="p-2 rounded-lg text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                            >
                                                <UserMinus className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-zinc-950/20 border-t border-white/5 text-center">
                        <p className="text-[10px] text-zinc-500">
                            Invited users will see the invitation on their dashboard.
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
