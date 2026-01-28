
export enum MessageRole {
  USER = 'user',
  MODEL = 'model'
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  files?: FileData[];
  type?: 'text' | 'image' | 'video' | 'audio';
  isThinking?: boolean;
}

export interface FileData {
  name: string;
  mimeType: string;
  data: string; // base64
  url: string;
}

export interface UserProfile {
  name: string;
  day: string;
  month: string;
  year: string;
}

export interface GroundingChunk {
  web?: { uri: string; title: string };
  maps?: { uri: string; title: string };
}
