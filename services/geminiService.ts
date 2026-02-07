
import { GoogleGenAI, Type, Modality, LiveServerMessage } from "@google/genai";

// Helper to get fresh client with current process.env.API_KEY
// This ensures that if a user switches keys via the dialog, the next call uses the new key.
const getAIClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface APIError extends Error {
  status?: string;
  code?: number;
  isQuota?: boolean;
}

// Exponential backoff utility for retrying failed requests (specifically 429s)
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const isQuotaError = 
        error?.message?.toLowerCase().includes('quota') || 
        error?.message?.toLowerCase().includes('limit') ||
        error?.status === 'RESOURCE_EXHAUSTED' || 
        error?.code === 429;
      
      if (isQuotaError) {
        // If it's a 429, we mark it so the UI can prompt for a key switch
        error.isQuota = true;
        
        // Only retry if it's a transient rate limit, not a hard daily quota exceed
        if (attempt < maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      throw error;
    }
  }
  throw lastError;
}

export const geminiService = {
  // 1. Audio & Speech: Text-to-Speech
  async textToSpeech(text: string, voice: string = 'Kore', language: string = 'English'): Promise<string | undefined> {
    return withRetry(async () => {
      const ai = getAIClient();
      const prompt = `Please read this text in ${language}: ${text}`;
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      });
      
      const part = response.candidates?.[0]?.content?.parts?.find(p => !!p.inlineData);
      return part?.inlineData?.data;
    });
  },

  // Real-time STT via Live API
  async connectLiveSTT(callbacks: {
    onTranscription: (text: string) => void;
    onError: (err: any) => void;
  }) {
    const ai = getAIClient();
    let currentTranscription = "";

    return ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      callbacks: {
        onopen: () => console.debug('Live STT connected'),
        onmessage: async (message: LiveServerMessage) => {
          if (message.serverContent?.inputTranscription) {
            currentTranscription += message.serverContent.inputTranscription.text;
            callbacks.onTranscription(currentTranscription);
          }
          if (message.serverContent?.turnComplete) {
            currentTranscription = "";
          }
        },
        onerror: (e) => callbacks.onError(e),
        onclose: () => console.debug('Live STT closed'),
      },
      config: {
        responseModalities: [Modality.AUDIO],
        inputAudioTranscription: {},
      },
    });
  },

  // 2. Text/Document Processing
  async processText(prompt: string, text: string): Promise<string> {
    return withRetry(async () => {
      const ai = getAIClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `${prompt}\n\nContent:\n${text}`,
      });
      return response.text || "Failed to generate content.";
    });
  },

  // 3. Image AI
  async generateImage(prompt: string, aspectRatio: "1:1" | "16:9" | "9:16" = "1:1"): Promise<string | undefined> {
    return withRetry(async () => {
      const ai = getAIClient();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: { imageConfig: { aspectRatio } },
      });
      
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      return undefined;
    });
  },

  async analyzeImage(base64Image: string, prompt: string): Promise<string> {
    return withRetry(async () => {
      const ai = getAIClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64Image.split(',')[1] } },
            { text: prompt }
          ]
        },
      });
      return response.text || "Failed to analyze image.";
    });
  },

  // 4. Chat
  async chatStream(message: string, history: any[]) {
    const ai = getAIClient();
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: "You are SKLearn, a warm, professional, and emotionally supportive AI assistant.",
      },
    });
    return chat.sendMessageStream({ message });
  },

  // 5. Complex Content
  async generateComplexContent(prompt: string, instructions: string): Promise<string> {
    return withRetry(async () => {
      const ai = getAIClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          systemInstruction: instructions,
          thinkingConfig: { thinkingBudget: 4000 }
        }
      });
      return response.text || "Failed to generate.";
    });
  },

  // Helpers
  decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  },

  encode(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  },

  async decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }
};
