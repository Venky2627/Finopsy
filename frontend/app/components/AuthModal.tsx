'use client';

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { signInWithPassword, signUpWithPassword, signInWithGoogle, signInWithMagicLink } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup' | 'magic'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleGoogle = async () => {
    try {
      setLoading(true);
      setError('');
      await signInWithGoogle();
    } catch (e: any) {
      setError(e.message || 'Error authenticating with Google');
      setLoading(false);
    }
  };

  const handleEmailPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');
      if (mode === 'signin') {
        await signInWithPassword(email, password);
        onClose();
      } else {
        await signUpWithPassword(email, password);
        setSuccessMessage('Account created! Please check your email to verify if required, or sign in.');
      }
    } catch (e: any) {
      setError(e.message || 'Authentication error. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      setLoading(true);
      setError('');
      await signInWithMagicLink(email);
      setSuccessMessage('Authentication link dispatched. Check your email inbox.');
    } catch (e: any) {
      setError(e.message || 'Failed to dispatch magic link');
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
          FINOPSY / AUTHENTICATION
        </span>
        <h2 className="font-display text-2xl font-bold text-[#F4F3EE] mb-1 tracking-tight">
          {mode === 'signup' ? 'Create Account' : mode === 'magic' ? 'Magic Link' : 'Sign In'}
        </h2>
        <p className="text-xs text-[#8E9089] mb-6">
          Synchronize bank statements across devices and save your money autopsy.
        </p>

        {/* Google OAuth */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="btn-primary w-full text-xs font-bold py-3 mb-4 tracking-wider uppercase flex items-center justify-center gap-2"
        >
          {loading ? 'Authenticating...' : 'Continue with Google'}
        </button>

        <div className="flex items-center my-4">
          <div className="flex-grow border-t border-[rgba(255,255,255,0.08)]" />
          <span className="px-3 text-[#8E9089] font-mono-num text-[10px] uppercase tracking-widest">
            OR WITH EMAIL
          </span>
          <div className="flex-grow border-t border-[rgba(255,255,255,0.08)]" />
        </div>

        {/* Email Form */}
        {mode === 'magic' ? (
          <form onSubmit={handleMagicLink} className="space-y-3">
            <div>
              <label className="font-mono-num text-[10px] font-bold text-[#8E9089] uppercase block mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full bg-[#121312] border border-[rgba(255,255,255,0.1)] text-xs text-[#F4F3EE] p-2.5 rounded-lg focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-secondary w-full text-xs font-bold py-2.5 tracking-wider uppercase"
            >
              {loading ? 'Sending...' : 'Send Magic Link'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="text-[11px] text-[#8E9089] hover:text-[#F4F3EE]"
              >
                ← Back to Password Login
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleEmailPassword} className="space-y-3">
            <div>
              <label className="font-mono-num text-[10px] font-bold text-[#8E9089] uppercase block mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full bg-[#121312] border border-[rgba(255,255,255,0.1)] text-xs text-[#F4F3EE] p-2.5 rounded-lg focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="font-mono-num text-[10px] font-bold text-[#8E9089] uppercase block mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#121312] border border-[rgba(255,255,255,0.1)] text-xs text-[#F4F3EE] p-2.5 rounded-lg focus:outline-none font-mono-num"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-secondary w-full text-xs font-bold py-2.5 tracking-wider uppercase"
            >
              {loading ? 'Processing...' : mode === 'signup' ? 'Create Account' : 'Sign In'}
            </button>

            <div className="flex items-center justify-between text-[11px] text-[#8E9089] pt-2">
              <button
                type="button"
                onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
                className="hover:text-[#F4F3EE]"
              >
                {mode === 'signup' ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </button>

              <button
                type="button"
                onClick={() => setMode('magic')}
                className="hover:text-[#F4F3EE]"
              >
                Magic Link
              </button>
            </div>
          </form>
        )}

        {/* Feedback Messages */}
        {error && (
          <p className="mt-4 text-[#FF4560] font-mono-num text-xs text-center border border-[#FF4560]/20 bg-[#FF4560]/5 p-2 rounded">
            {error}
          </p>
        )}

        {successMessage && (
          <p className="mt-4 text-[#D4FF00] font-mono-num text-xs text-center border border-[#D4FF00]/20 bg-[#D4FF00]/5 p-2 rounded">
            {successMessage}
          </p>
        )}
      </div>
    </div>
  );
}
