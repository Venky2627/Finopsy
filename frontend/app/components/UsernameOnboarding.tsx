'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { checkUsername } from '../api';

export function UsernameOnboarding() {
  const { updateProfile } = useAuth();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = (val: string) => {
    if (val.length < 3 || val.length > 20) return "Must be 3-20 characters";
    if (!/^[a-zA-Z0-9_]+$/.test(val)) return "Letters, numbers, and underscores only";
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
        setError('Username is already taken');
        setLoading(false);
        return;
      }
      await updateProfile({ username });
    } catch (err: any) {
      setError(err.message || 'Error saving username');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#10110f] p-4 text-[#f6f3e8] font-sans">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-black mb-2 tracking-widest text-center text-[#d5ff51]">FINOPSY</h1>
        <h2 className="text-2xl font-bold mb-8 text-center uppercase text-[#5c5c54]">What should we call you?</h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <div className="flex items-center bg-[#10110f] border-b-4 border-[#f6f3e8] focus-within:border-[#d5ff51] pb-2 transition-colors">
              <span className="text-3xl font-black text-[#5c5c54] mr-2">@</span>
              <input
                type="text"
                value={username}
                onChange={handleChange}
                placeholder="USERNAME"
                className="w-full bg-transparent text-3xl font-black focus:outline-none placeholder-[#20211f]"
                autoFocus
              />
            </div>
            {error && <p className="text-red-500 font-bold mt-2 uppercase">{error}</p>}
          </div>

          <div className="bg-[#20211f] p-4 border border-[#5c5c54]">
            <p className="text-xs font-bold text-[#5c5c54] mb-2 uppercase">Share Card Preview</p>
            <p className="font-black text-xl text-[#d5ff51] break-all">
              @{username || 'USERNAME'}'S MONEY AUTOPSY
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !!error || !username}
            className="w-full bg-[#d5ff51] text-[#10110f] font-black py-5 text-xl hover:bg-white disabled:opacity-50 disabled:hover:bg-[#d5ff51] transition-colors uppercase tracking-widest mt-4"
          >
            {loading ? 'SAVING...' : 'CONTINUE'}
          </button>
        </form>
      </div>
    </div>
  );
}
