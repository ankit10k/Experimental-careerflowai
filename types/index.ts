
export interface Transcription {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface CareerGoal {
  id: string;
  title: string;
  category: 'Short-term' | 'Long-term';
  status: 'In Progress' | 'Planned' | 'Completed';
  lastUpdated: number;
}

export interface SessionRecord {
  id: string;
  date: number;
  transcriptions: Transcription[];
  summary: string;
  goalsExtracted: CareerGoal[];
}

export enum ConnectionStatus {
  DISCONNECTED = 'Disconnected',
  CONNECTING = 'Connecting',
  CONNECTED = 'Connected',
  ERROR = 'Error'
}

export type AppView = 'DASHBOARD' | 'ACTIVE_SESSION' | 'SESSION_HISTORY' | 'DEEP_DIVE';
