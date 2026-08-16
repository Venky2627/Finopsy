'use client';
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { signInWithGoogle, signInWithMagicLink } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleGoogle = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
    } catch (e: any) {
      setMessage(e.message || 'Error signing in with Google');
      setLoading(false);
    }
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      setLoading(true);
      await signInWithMagicLink(email);
      setMessage('Check your email for the magic link!');
    } catch (e: any) {
      setMessage(e.message || 'Error sending magic link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4">
      <div className="relative w-full max-w-md bg-[#10110f] border-2 border-[#d5ff51] p-8">
        <button onClick={onClose} className="absolute top-4 right-4 text-[#f6f3e8] hover:text-[#d5ff51] font-bold text-xl">
          ✕
        </button>
        <h2 className="text-3xl font-black text-[#f6f3e8] mb-6 tracking-wide">SAVE YOUR AUTOPSY</h2>
        
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full bg-[#d5ff51] text-[#10110f] font-bold py-4 px-6 text-lg hover:bg-white transition-colors mb-6 uppercase tracking-wider"
        >
          {loading ? 'WAIT...' : 'CONTINUE WITH GOOGLE'}
        </button>

        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-[#20211f]"></div>
          <span className="px-4 text-[#5c5c54] font-bold">OR</span>
          <div className="flex-grow border-t border-[#20211f]"></div>
        </div>

        <form onSubmit={handleEmail} className="flex flex-col gap-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="EMAIL ADDRESS"
            className="w-full bg-[#10110f] border-2 border-[#5c5c54] text-[#f6f3e8] py-3 px-4 font-bold focus:border-[#d5ff51] focus:outline-none"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#20211f] text-[#f6f3e8] font-bold py-3 px-6 hover:border-[#d5ff51] border-2 border-transparent transition-all uppercase tracking-wider"
          >
            SEND MAGIC LINK
          </button>
        </form>

        {message && <p className="mt-4 text-[#d5ff51] font-bold text-center">{message}</p>}
      </div>
    </div>
  );
}
