'use client';

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { deleteAccount, deleteAllTransactions } from '../api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataCleared?: () => void;
}

export function SettingsModal({ isOpen, onClose, onDataCleared }: SettingsModalProps) {
  const { user, profile, signOut, session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleDeleteData = async () => {
    if (!window.confirm("Confirm deletion of all parsed transactions and forensic records?")) return;
    if (!session) return;
    setLoading(true);
    try {
      await deleteAllTransactions(session.access_token);
      if (onDataCleared) onDataCleared();
      onClose();
    } catch (e: any) {
      setError(e.message || "Failed to delete data");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("This action permanently deletes your account and cannot be reversed. Proceed?")) return;
    if (!session) return;
    setLoading(true);
    try {
      await deleteAccount(session.access_token);
      await signOut();
      if (onDataCleared) onDataCleared();
      onClose();
    } catch (e: any) {
      setError(e.message || "Failed to delete account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="surface-card w-full max-w-md p-6 sm:p-8 relative border border-[rgba(255,255,255,0.14)] shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#8E9089] hover:text-[#F4F3EE] text-sm font-mono-num px-2 py-1"
        >
          ESC
        </button>

        <span className="font-mono-num text-[10px] uppercase tracking-widest text-[#8E9089] block mb-1">
          FINOPSY / PREFERENCES
        </span>
        <h2 className="font-display text-2xl font-bold text-[#F4F3EE] mb-6 tracking-tight">
          Account Settings
        </h2>

        <div className="space-y-4 mb-6 bg-[#171917] p-4 rounded-xl border border-[rgba(255,255,255,0.06)] font-mono-num text-xs">
          <div>
            <span className="text-[#8E9089] block text-[9px] uppercase tracking-wider font-semibold">
              AUTHENTICATED USERNAME
            </span>
            <span className="text-[#D4FF00] font-semibold text-sm">
              @{profile?.username || 'user'}
            </span>
          </div>

          <div>
            <span className="text-[#8E9089] block text-[9px] uppercase tracking-wider font-semibold">
              ASSOCIATED EMAIL
            </span>
            <span className="text-[#F4F3EE]">{user?.email}</span>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-[rgba(255,255,255,0.08)]">
          <button
            onClick={handleDeleteData}
            disabled={loading}
            className="w-full text-left text-xs font-mono-num text-[#8E9089] hover:text-[#F4F3EE] py-2.5 px-3 rounded-lg hover:bg-[#171917] transition flex justify-between items-center"
          >
            <span>PURGE FINANCIAL DATA</span>
            <span className="text-[10px] text-[#8E9089]">CLEAR</span>
          </button>

          <button
            onClick={handleDeleteAccount}
            disabled={loading}
            className="w-full text-left text-xs font-mono-num text-[#FF4560] hover:text-[#ff6b82] py-2.5 px-3 rounded-lg hover:bg-[#171917] transition flex justify-between items-center"
          >
            <span>DELETE ACCOUNT</span>
            <span className="text-[10px] text-[#FF4560]">PERMANENT</span>
          </button>

          <button
            onClick={() => {
              signOut();
              if (onDataCleared) onDataCleared();
              onClose();
            }}
            disabled={loading}
            className="w-full text-left text-xs font-mono-num text-[#8E9089] hover:text-[#F4F3EE] py-2.5 px-3 rounded-lg hover:bg-[#171917] transition flex justify-between items-center"
          >
            <span>SIGN OUT</span>
            <span className="text-[10px] text-[#8E9089]">→</span>
          </button>
        </div>

        {error && (
          <p className="mt-4 text-[#FF4560] font-mono-num text-xs text-center border border-[#FF4560]/20 bg-[#FF4560]/5 p-2 rounded">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
