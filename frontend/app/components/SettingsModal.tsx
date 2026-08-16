'use client';
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { deleteAccount, deleteAllTransactions } from '../api';

export function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user, profile, signOut, session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleDeleteData = async () => {
    if (!window.confirm("Are you sure? This will delete all your financial data.")) return;
    if (!session) return;
    setLoading(true);
    try {
      await deleteAllTransactions(session.access_token);
      window.location.reload();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("This permanently deletes everything and cannot be undone. Proceed?")) return;
    if (!session) return;
    setLoading(true);
    try {
      await deleteAccount(session.access_token);
      await signOut();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4">
      <div className="relative w-full max-w-md bg-[#10110f] border-2 border-[#5c5c54] p-8">
        <button onClick={onClose} className="absolute top-4 right-4 text-[#5c5c54] hover:text-[#f6f3e8] font-bold text-xl">
          ✕
        </button>
        
        <h2 className="text-3xl font-black text-[#f6f3e8] mb-6 tracking-wide uppercase">Settings</h2>
        
        <div className="mb-6">
          <p className="text-[#5c5c54] font-bold text-sm uppercase mb-1">Username</p>
          <p className="text-xl font-bold text-[#d5ff51]">@{profile?.username}</p>
        </div>

        <div className="mb-8">
          <p className="text-[#5c5c54] font-bold text-sm uppercase mb-1">Email</p>
          <p className="text-lg font-bold text-[#f6f3e8]">{user?.email}</p>
        </div>

        <div className="w-full h-px bg-[#20211f] mb-8" />

        <div className="flex flex-col gap-4">
          <button
            onClick={handleDeleteData}
            disabled={loading}
            className="w-full bg-[#20211f] text-[#f6f3e8] font-bold py-3 px-6 hover:border-red-500 border-2 border-transparent transition-all uppercase tracking-wider text-left"
          >
            DELETE MY FINANCIAL DATA
          </button>
          
          <button
            onClick={handleDeleteAccount}
            disabled={loading}
            className="w-full bg-[#20211f] text-red-500 font-bold py-3 px-6 hover:bg-red-500 hover:text-white transition-all uppercase tracking-wider text-left border-2 border-red-900"
          >
            DELETE ACCOUNT
          </button>

          <button
            onClick={() => { signOut(); onClose(); }}
            disabled={loading}
            className="w-full bg-transparent text-[#5c5c54] font-bold py-3 px-6 hover:text-[#f6f3e8] transition-all uppercase tracking-wider text-left border-2 border-[#20211f]"
          >
            LOG OUT
          </button>
        </div>
        
        {error && <p className="mt-4 text-red-500 font-bold">{error}</p>}
      </div>
    </div>
  );
}
