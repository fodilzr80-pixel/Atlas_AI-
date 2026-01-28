
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { User, Calendar, Sparkles } from 'lucide-react';

interface Props {
  onComplete: (profile: UserProfile) => void;
}

const Onboarding: React.FC<Props> = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && day && month && year) {
      onComplete({ name, day, month, year });
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 bg-[#0b0e14]">
      <div className="w-full max-w-md bg-[#161b22] border border-gray-800 rounded-3xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-white to-orange-500"></div>
        
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-700 flex items-center justify-center relative shadow-2xl rotate-3 transform hover:rotate-0 transition-transform">
            <Sparkles className="text-white w-10 h-10" />
            <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full -z-10"></div>
          </div>
        </div>
        
        <h1 className="text-3xl font-black text-center mb-1 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-orange-300">Atlas AI</h1>
        <p className="text-gray-500 text-center mb-8 text-[10px] uppercase font-bold tracking-[0.3em]">By Fodil Zerrouali • Free Trial</p>

        <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2 px-1">
              <User size={14} className="text-blue-400" /> Full Name
            </label>
            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="How should I call you?"
              className="w-full bg-[#0d1117] border border-gray-700 rounded-2xl py-4 px-5 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder-gray-600"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2 px-1">
              <Calendar size={14} className="text-orange-400" /> Date of Birth
            </label>
            <div className="grid grid-cols-3 gap-3">
              <input required type="text" maxLength={2} value={day} onChange={(e) => setDay(e.target.value.replace(/\D/g, ''))} placeholder="DD" className="bg-[#0d1117] border border-gray-700 rounded-2xl py-4 text-center text-white outline-none focus:ring-2 focus:ring-orange-500/50 transition-all" />
              <input required type="text" maxLength={2} value={month} onChange={(e) => setMonth(e.target.value.replace(/\D/g, ''))} placeholder="MM" className="bg-[#0d1117] border border-gray-700 rounded-2xl py-4 text-center text-white outline-none focus:ring-2 focus:ring-orange-500/50 transition-all" />
              <input required type="text" maxLength={4} value={year} onChange={(e) => setYear(e.target.value.replace(/\D/g, ''))} placeholder="YYYY" className="bg-[#0d1117] border border-gray-700 rounded-2xl py-4 text-center text-white outline-none focus:ring-2 focus:ring-orange-500/50 transition-all" />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-2xl transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-blue-500/20"
          >
            Start Experimental Chat
          </button>
          
          <p className="text-[9px] text-gray-600 text-center uppercase tracking-widest font-bold">
            No credit card required for trial
          </p>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;
