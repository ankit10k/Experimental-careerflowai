
import React from 'react';
import { Transcription, CareerGoal } from '../types';

interface CareerDashboardProps {
  transcriptions: Transcription[];
  goals: CareerGoal[];
}

const CareerDashboard: React.FC<CareerDashboardProps> = ({ transcriptions, goals }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full overflow-hidden">
      {/* Transcription Feed */}
      <div className="lg:col-span-2 flex flex-col glass-panel rounded-2xl p-6 shadow-sm overflow-hidden border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          Coach Conversation
        </h2>
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          {transcriptions.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-400 italic">
              Say hello to start your career coaching session...
            </div>
          ) : (
            transcriptions.map((t, i) => (
              <div
                key={`${t.timestamp}-${i}`}
                className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                    t.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{t.text}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Career Goals Summary */}
      <div className="glass-panel rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            Actionable Goals
          </h2>
          <div className="space-y-3">
            {goals.map((goal) => (
              <div key={goal.id} className="p-3 bg-white/50 rounded-xl border border-slate-100">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                    {goal.category}
                  </span>
                  <span className={`text-[10px] font-bold uppercase ${
                    goal.status === 'In Progress' ? 'text-blue-500' : 'text-green-500'
                  }`}>
                    {goal.status}
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-700">{goal.title}</p>
              </div>
            ))}
            {goals.length === 0 && (
              <p className="text-slate-400 text-sm italic py-4 text-center">
                Discuss your career vision to generate goals.
              </p>
            )}
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <div className="bg-blue-50 rounded-xl p-4">
            <h3 className="text-sm font-bold text-blue-800 mb-1">Pro Tip</h3>
            <p className="text-xs text-blue-600 leading-relaxed">
              Ask about "skill gap analysis" or "5-year planning" for more structured advice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerDashboard;
