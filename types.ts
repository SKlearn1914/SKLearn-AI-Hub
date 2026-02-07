
export enum AIModule {
  DASHBOARD = 'dashboard',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  IMAGE = 'image',
  CHAT = 'chat',
  WRITING = 'writing',
  CAREER = 'career',
  WEBSITE = 'website',
  MULTIMODAL = 'multimodal'
}

export interface WritingTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}
