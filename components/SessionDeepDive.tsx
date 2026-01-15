
import React from 'react';
import { SessionRecord } from '../types';

interface SessionDeepDiveProps {
  session: SessionRecord;
  onBack: () => void;
}

const SessionDeepDive: React.FC<SessionDeepDiveProps> = ({ session, onBack }) => {
  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-medium"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Dashboard
      </button>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Session Summary</h2>
            <p className="text-slate-600 leading-relaxed italic">{session.summary || "No summary was generated for this session."}</p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Transcription</h2>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {session.transcriptions.map((t, i) => (
                <div key={i} className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    t.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                    <p className="text-sm">{t.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:w-80 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Goals From This Session</h2>
            <div className="space-y-3">
              {session.goalsExtracted.map(goal => (
                <div key={goal.id} className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                  <p className="text-sm font-bold text-slate-700">{goal.title}</p>
                  <span className="text-[10px] text-blue-500 font-bold uppercase">{goal.status}</span>
                </div>
              ))}
              {session.goalsExtracted.length === 0 && (
                <p className="text-slate-400 text-sm italic">No specific goals were recorded.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionDeepDive;
