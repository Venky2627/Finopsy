'use client';

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { checkUsername } from '../api';

interface UsernameOnboardingProps {
  isOpen?: boolean;
}

export function UsernameOnboarding({ isOpen = true }: UsernameOnboardingProps) {
  const { updateProfile } = useAuth();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const validate = (val: string) => {
    if (val.length < 3 || val.length > 20) return "Must be 3-20 characters";
    if (!/^[a-zA-Z0-9_]+$/.test(val)) return "Alphanumeric and underscores only";
    return "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUsername(val);
    setError(validate(val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valErr = validate(username);
    if (valErr) { setError(valErr); return; }

    setLoading(true);
    try {
      const { available } = await checkUsername(username);
      if (!available) {
        setError('Username is already registered');
        setLoading(false);
        return;
      }
      await updateProfile({ username });
    } catch (err: any) {
      setError(err.message || 'Error updating username');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0B0C0B] p-4 text-[#F2F1EC]">
      <div className="surface-card w-full max-w-md p-8 border border-[rgba(255,255,255,0.12)]">
        <span className="font-mono-data text-[10px] uppercase tracking-widest text-[#8D908A] block mb-2 text-center">
          FINOPSY / IDENTITY
        </span>
        <h1 className="font-editorial text-2xl font-bold tracking-tight text-center mb-2">
          Establish Forensic Handle
        </h1>
        <p className="text-xs text-[#8D908A] text-center mb-6">
          Your identifier will be embedded into exported forensic autopsy reports.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <div className="flex items-center bg-[#171917] border border-[rgba(255,255,255,0.1)] focus-within:border-[rgba(255,255,255,0.3)] rounded p-2.5 transition-colors">
              <span className="font-mono-data text-[#8D908A] mr-2">@</span>
              <input
                type="text"
                value={username}
                onChange={handleChange}
                placeholder="username"
                className="w-full bg-transparent text-base font-sans font-medium focus:outline-none placeholder-[#555753] text-[#F2F1EC]"
                autoFocus
              />
            </div>
            {error && <p className="text-[#E5484D] text-xs font-mono-data mt-2">{error}</p>}
          </div>

          <div className="bg-[#171917] p-3.5 rounded border border-[rgba(255,255,255,0.06)] font-mono-data text-xs">
            <span className="text-[9px] uppercase tracking-wider text-[#8D908A] block mb-1">
              REPORT PREVIEW
            </span>
            <p className="text-[#C8FF2E] font-medium truncate">
              @{username || 'user'}&apos;S FORENSIC AUTOPSY
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !!error || !username}
            className="btn-primary w-full text-xs font-semibold py-3 tracking-wider uppercase"
          >
            {loading ? 'INITIALIZING...' : 'CONTINUE TO DASHBOARD'}
          </button>
        </form>
      </div>
    </div>
  );
}
