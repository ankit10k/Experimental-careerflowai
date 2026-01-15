
import React from 'react';
import { SessionRecord, CareerGoal, AppView } from '../types';

interface DashboardHomeProps {
  sessions: SessionRecord[];
  allGoals: CareerGoal[];
  onStartSession: () => void;
  onViewHistory: () => void;
  onDeepDive: (session: SessionRecord) => void;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ 
  sessions, 
  allGoals, 
  onStartSession, 
  onDeepDive 
}) => {
  const stats = {
    totalSessions: sessions.length,
    inProgressGoals: allGoals.filter(g => g.status === 'In Progress').length,
    completedGoals: allGoals.filter(g => g.status === 'Completed').length,
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Stats Rollup */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-1">Sessions Held</p>
          <p className="text-3xl font-bold text-slate-800">{stats.totalSessions}</p>
        </div>
        <div className="glass-panel p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-1">Goals In Progress</p>
          <p className="text-3xl font-bold text-blue-600">{stats.inProgressGoals}</p>
        </div>
        <div className="glass-panel p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-1">Success Milestones</p>
          <p className="text-3xl font-bold text-green-600">{stats.completedGoals}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Goals Rollup */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
               <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
               </svg>
               Master Goal List
            </h2>
          </div>
          <div className="glass-panel rounded-2xl p-4 border border-slate-200 max-h-[600px] overflow-y-auto space-y-3 bg-white/40">
            {allGoals.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <p className="text-slate-500 font-medium text-sm">No goals identified yet.</p>
                <p className="text-slate-400 text-xs mt-1">Start a session to define your path.</p>
              </div>
            ) : (
              allGoals.map(goal => (
                <div key={goal.id} className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:border-blue-200 transition-colors">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-50 text-slate-400 border border-slate-100">{goal.category}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      goal.status === 'Completed' ? 'bg-green-50 text-green-600' : 
                      goal.status === 'In Progress' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-500'
                    }`}>
                      {goal.status}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-800">{goal.title}</p>
                  <p className="text-[10px] text-slate-400 mt-2">Last updated: {new Date(goal.lastUpdated).toLocaleDateString()}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Session History */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
               <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
               Session History
            </h2>
            {sessions.length > 0 && (
              <button 
                onClick={onStartSession}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95"
              >
                Start New Session
              </button>
            )}
          </div>
          <div className="space-y-4">
            {sessions.length === 0 ? (
              <div className="glass-panel rounded-2xl p-20 text-center border border-dashed border-slate-300 bg-white/20">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Your Career Journey Starts Here</h3>
                <p className="text-slate-500 mb-6 max-w-sm mx-auto">Click below to start your first session. Your coach will help you define specific goals and save them here.</p>
                <button 
                  onClick={onStartSession} 
                  className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
                >
                  Start First Session
                </button>
              </div>
            ) : (
              sessions.slice().reverse().map(session => (
                <div 
                  key={session.id} 
                  onClick={() => onDeepDive(session)}
                  className="glass-panel p-5 rounded-2xl border border-slate-200 hover:border-blue-400 cursor-pointer transition-all hover:shadow-md group bg-white/60"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {new Date(session.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                      </p>
                      <p className="text-xs text-slate-400 font-medium">
                        {new Date(session.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} • {session.transcriptions.length} Interactions
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold uppercase tracking-widest">
                      Details 
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed italic">
                      "{session.summary || "No summary available for this session."}"
                    </p>
                  </div>

                  {session.goalsExtracted.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {session.goalsExtracted.map(g => (
                        <span key={g.id} className="whitespace-nowrap bg-blue-50 text-blue-600 text-[10px] px-2.5 py-1 rounded-lg font-bold border border-blue-100">
                          {g.title}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
