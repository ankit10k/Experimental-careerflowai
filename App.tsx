
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob, Type } from '@google/genai';
import { ConnectionStatus, Transcription, CareerGoal, SessionRecord, AppView } from './types';
import { decode, encode, decodeAudioData } from './utils/audioUtils';
import VoiceVisualizer from './components/VoiceVisualizer';
import CareerDashboard from './components/CareerDashboard';
import DashboardHome from './components/DashboardHome';
import SessionDeepDive from './components/SessionDeepDive';

const STORAGE_KEY = 'careerflow_data_v2';

const App: React.FC = () => {
  // Navigation & Data State
  const [view, setView] = useState<AppView>('DASHBOARD');
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [activeDeepDive, setActiveDeepDive] = useState<SessionRecord | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Runtime Session State
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [activeSessionGoals, setActiveSessionGoals] = useState<CareerGoal[]>([]);
  const [activeSessionSummary, setActiveSessionSummary] = useState('');
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for synchronous access
  const transcriptionsRef = useRef<Transcription[]>([]);
  const activeGoalsRef = useRef<CareerGoal[]>([]);
  const summaryRef = useRef('');
  const currentInputTransRef = useRef('');
  const currentOutputTransRef = useRef('');

  // Audio Context Refs
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const outputGainNodeRef = useRef<GainNode | null>(null);
  const nextStartTimeRef = useRef(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Persistence Loading
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.sessions) {
          setSessions(parsed.sessions);
        }
      } catch (e) {
        console.error("Failed to parse storage", e);
      }
    }
    setHasLoaded(true);
  }, []);

  // Persistence Saving
  useEffect(() => {
    if (hasLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ sessions }));
    }
  }, [sessions, hasLoaded]);

  // Aggregate Master Goals
  const allGoals = useMemo(() => {
    const goalMap = new Map<string, CareerGoal>();
    sessions.forEach(s => {
      s.goalsExtracted.forEach(g => {
        const existing = goalMap.get(g.id);
        if (!existing || g.lastUpdated > existing.lastUpdated) {
          goalMap.set(g.id, g);
        }
      });
    });
    activeSessionGoals.forEach(g => {
      const existing = goalMap.get(g.id);
      if (!existing || g.lastUpdated > existing.lastUpdated) {
        goalMap.set(g.id, g);
      }
    });
    return Array.from(goalMap.values()).sort((a, b) => b.lastUpdated - a.lastUpdated);
  }, [sessions, activeSessionGoals]);

  const stopAudio = useCallback(() => {
    console.debug('[Audio] Stopping all active sources');
    for (const source of audioSourcesRef.current.values()) {
      try { source.stop(); } catch(e) {}
      audioSourcesRef.current.delete(source);
    }
    nextStartTimeRef.current = 0;
  }, []);

  const saveCurrentSession = useCallback(() => {
    const uText = currentInputTransRef.current;
    const mText = currentOutputTransRef.current;
    let finalTranscriptions = [...transcriptionsRef.current];
    
    if (uText || mText) {
      if (uText) finalTranscriptions.push({ role: 'user', text: uText, timestamp: Date.now() });
      if (mText) finalTranscriptions.push({ role: 'model', text: mText, timestamp: Date.now() });
    }

    if (finalTranscriptions.length === 0 && activeGoalsRef.current.length === 0) return;

    const newSession: SessionRecord = {
      id: `session_${Date.now()}`,
      date: Date.now(),
      transcriptions: finalTranscriptions,
      summary: summaryRef.current || "A session discussing career goals.",
      goalsExtracted: [...activeGoalsRef.current]
    };

    setSessions(prev => [...prev, newSession]);
    
    // Cleanup runtime data
    transcriptionsRef.current = [];
    activeGoalsRef.current = [];
    summaryRef.current = '';
    currentInputTransRef.current = '';
    currentOutputTransRef.current = '';
    
    setTranscriptions([]);
    setActiveSessionGoals([]);
    setActiveSessionSummary('');
  }, []);

  const cleanupSession = useCallback(() => {
    console.debug('[LiveAPI] Cleaning up session');
    setIsSessionActive(false);
    setStatus(ConnectionStatus.DISCONNECTED);
    stopAudio();
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close().catch(console.error);
      inputAudioContextRef.current = null;
    }

    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close().catch(console.error);
      outputAudioContextRef.current = null;
    }

    saveCurrentSession();
    setView('DASHBOARD');
  }, [stopAudio, saveCurrentSession]);

  const handleConnect = async () => {
    if (isSessionActive) {
      cleanupSession();
      return;
    }

    try {
      console.debug('[LiveAPI] Connecting...');
      setStatus(ConnectionStatus.CONNECTING);
      setError(null);
      setView('ACTIVE_SESSION');

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      const inCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      console.debug('[Audio] Resuming AudioContexts');
      await inCtx.resume();
      await outCtx.resume();

      inputAudioContextRef.current = inCtx;
      outputAudioContextRef.current = outCtx;
      
      const gainNode = outCtx.createGain();
      gainNode.gain.value = 1.0;
      gainNode.connect(outCtx.destination);
      outputGainNodeRef.current = gainNode;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const updateGoalTool = {
        name: 'update_career_goal',
        parameters: {
          type: Type.OBJECT,
          description: 'Record a specific career goal. ALWAYS call this when a goal is defined.',
          properties: {
            title: { type: Type.STRING, description: 'Title of the goal.' },
            category: { type: Type.STRING, enum: ['Short-term', 'Long-term'], description: 'Timeline.' },
            status: { type: Type.STRING, enum: ['Planned', 'In Progress', 'Completed'], description: 'State.' }
          },
          required: ['title', 'category', 'status']
        }
      };

      const setSummaryTool = {
        name: 'set_session_summary',
        parameters: {
          type: Type.OBJECT,
          description: 'Update the session summary.',
          properties: {
            summary: { type: Type.STRING, description: 'Concise summary.' }
          },
          required: ['summary']
        }
      };

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          tools: [{ functionDeclarations: [updateGoalTool, setSummaryTool] }],
          systemInstruction: 'You are an elite Career Coach. You speak to the user using audio. ALWAYS use tools to record goals mentioned in speech. Be warm, professional, and highly actionable.',
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            console.debug('[LiveAPI] Session Opened');
            setStatus(ConnectionStatus.CONNECTED);
            setIsSessionActive(true);

            const source = inCtx.createMediaStreamSource(stream);
            const scriptProcessor = inCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              if (status === ConnectionStatus.DISCONNECTED) return;
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob: Blob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };

              sessionPromiseRef.current?.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            console.debug('[LiveAPI] Message Received:', Object.keys(message));

            // 1. Tool Calls
            if (message.toolCall) {
              console.debug('[LiveAPI] Tool Call Detected');
              for (const fc of message.toolCall.functionCalls) {
                if (fc.name === 'update_career_goal') {
                  const args = fc.args as any;
                  const newGoal: CareerGoal = {
                    id: args.title.toLowerCase().trim().replace(/\s+/g, '_'),
                    title: args.title,
                    category: args.category,
                    status: args.status,
                    lastUpdated: Date.now()
                  };
                  activeGoalsRef.current = [...activeGoalsRef.current.filter(g => g.id !== newGoal.id), newGoal];
                  setActiveSessionGoals([...activeGoalsRef.current]);
                }
                if (fc.name === 'set_session_summary') {
                  summaryRef.current = (fc.args as any).summary;
                  setActiveSessionSummary(summaryRef.current);
                }
                sessionPromiseRef.current?.then(s => s.sendToolResponse({
                  functionResponses: { id: fc.id, name: fc.name, response: { result: "ok" } }
                }));
              }
            }

            // 2. Transcription handling
            if (message.serverContent?.outputTranscription) {
              currentOutputTransRef.current += message.serverContent.outputTranscription.text;
            } else if (message.serverContent?.inputTranscription) {
              currentInputTransRef.current += message.serverContent.inputTranscription.text;
            }

            if (message.serverContent?.turnComplete) {
              console.debug('[LiveAPI] Turn Complete');
              const uText = currentInputTransRef.current;
              const mText = currentOutputTransRef.current;
              if (uText || mText) {
                const newT: Transcription[] = [];
                if (uText) newT.push({ role: 'user', text: uText, timestamp: Date.now() });
                if (mText) newT.push({ role: 'model', text: mText, timestamp: Date.now() });
                transcriptionsRef.current = [...transcriptionsRef.current, ...newT];
                setTranscriptions([...transcriptionsRef.current]);
              }
              currentInputTransRef.current = '';
              currentOutputTransRef.current = '';
            }

            // 3. Robust Audio handling
            if (message.serverContent?.modelTurn?.parts) {
              for (const part of message.serverContent.modelTurn.parts) {
                const audioData = part.inlineData?.data;
                if (audioData && outputAudioContextRef.current && outputGainNodeRef.current) {
                  const ctx = outputAudioContextRef.current;
                  
                  if (ctx.state === 'suspended') {
                    console.debug('[Audio] Resuming suspended context');
                    await ctx.resume();
                  }

                  console.debug(`[Audio] Detected audio data: ${audioData.length} chars (base64)`);
                  nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                  
                  try {
                    const rawBytes = decode(audioData);
                    console.debug(`[Audio] Decoded bytes: ${rawBytes.length}`);
                    const buffer = await decodeAudioData(rawBytes, ctx, 24000, 1);
                    console.debug(`[Audio] AudioBuffer duration: ${buffer.duration.toFixed(3)}s`);
                    
                    const source = ctx.createBufferSource();
                    source.buffer = buffer;
                    source.connect(outputGainNodeRef.current);
                    source.addEventListener('ended', () => {
                      audioSourcesRef.current.delete(source);
                    });
                    
                    console.debug(`[Audio] Scheduling playback at ${nextStartTimeRef.current.toFixed(3)}s (current: ${ctx.currentTime.toFixed(3)}s)`);
                    source.start(nextStartTimeRef.current);
                    nextStartTimeRef.current += buffer.duration;
                    audioSourcesRef.current.add(source);
                  } catch (e) {
                    console.error("[Audio] Playback pipeline error:", e);
                  }
                }
              }
            }

            if (message.serverContent?.interrupted) {
              console.debug('[Audio] Interrupted - clearing queue');
              stopAudio();
            }
          },
          onerror: (e) => {
            console.error('[LiveAPI] API Error Event:', e);
            setStatus(ConnectionStatus.ERROR);
            setError('Connection error. Please try restarting the session.');
          },
          onclose: (e) => {
            console.debug('[LiveAPI] Session Closed Event:', e);
            setStatus(ConnectionStatus.DISCONNECTED);
            setIsSessionActive(false);
          },
        },
      });

      sessionPromiseRef.current = sessionPromise;
    } catch (err: any) {
      console.error("[LiveAPI] Failed to establish connection:", err);
      setStatus(ConnectionStatus.ERROR);
      setError(err.message || 'Could not start session.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="glass-panel sticky top-0 z-50 px-6 py-4 flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => !isSessionActive && setView('DASHBOARD')}>
          <div className="bg-blue-600 p-2 rounded-lg shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">CareerFlow AI</h1>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">V.2.4 Diagnostic</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <nav className="hidden md:flex gap-4">
            <button 
              onClick={() => !isSessionActive && setView('DASHBOARD')} 
              className={`text-sm font-bold ${view === 'DASHBOARD' ? 'text-blue-600' : 'text-slate-400'} ${isSessionActive ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => isSessionActive && setView('ACTIVE_SESSION')} 
              className={`text-sm font-bold ${view === 'ACTIVE_SESSION' ? 'text-blue-600' : 'text-slate-400'} ${!isSessionActive ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Coaching
            </button>
          </nav>
          
          <div className="flex items-center gap-4">
            {isSessionActive && <VoiceVisualizer isActive={status === ConnectionStatus.CONNECTED} />}
            <button
              onClick={handleConnect}
              className={`px-6 py-2 rounded-full font-bold text-sm transition-all shadow-md flex items-center gap-2 ${
                isSessionActive ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSessionActive ? 'End & Save' : 'Start Session'}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full overflow-hidden">
        {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl font-medium border border-red-100 flex justify-between items-center animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
             </svg>
             <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-xs font-bold uppercase tracking-widest hover:text-red-800">Dismiss</button>
        </div>}

        {!hasLoaded ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4" />
            <p className="font-medium">Loading your profile...</p>
          </div>
        ) : (
          <div className="h-full">
            {view === 'DASHBOARD' && (
              <DashboardHome 
                sessions={sessions} 
                allGoals={allGoals} 
                onStartSession={handleConnect} 
                onViewHistory={() => {}} 
                onDeepDive={(s) => { setActiveDeepDive(s); setView('DEEP_DIVE'); }} 
              />
            )}

            {view === 'ACTIVE_SESSION' && (
              <CareerDashboard transcriptions={transcriptions} goals={activeSessionGoals} />
            )}

            {view === 'DEEP_DIVE' && activeDeepDive && (
              <SessionDeepDive session={activeDeepDive} onBack={() => setView('DASHBOARD')} />
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
