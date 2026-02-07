
import React, { useState, useRef, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { 
  PlayIcon, 
  PauseIcon, 
  StopIcon, 
  ArrowPathIcon, 
  SpeakerWaveIcon, 
  MicrophoneIcon, 
  LanguageIcon,
  XMarkIcon,
  ExclamationCircleIcon,
  KeyIcon
} from '@heroicons/react/24/outline';

type PlaybackStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error' | 'quota_exceeded';

const AudioVisualizer = ({ color = "bg-white" }: { color?: string }) => (
  <div className="flex items-end space-x-1 h-5">
    <div className={`w-1 ${color} animate-[bounce_0.6s_infinite] h-2`}></div>
    <div className={`w-1 ${color} animate-[bounce_0.8s_infinite] h-4`}></div>
    <div className={`w-1 ${color} animate-[bounce_0.5s_infinite] h-5`}></div>
    <div className={`w-1 ${color} animate-[bounce_0.9s_infinite] h-3`}></div>
    <div className={`w-1 ${color} animate-[bounce_0.7s_infinite] h-4`}></div>
  </div>
);

export default function AudioAI() {
  const [text, setText] = useState('');
  const [voice, setVoice] = useState('Kore');
  const [language, setLanguage] = useState('English');
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [status, setStatus] = useState<PlaybackStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'tts' | 'stt'>('tts');

  // STT State
  const [isLiveMic, setIsLiveMic] = useState(false);
  const [sttResult, setSttResult] = useState('');
  const [isProcessingSTT, setIsProcessingSTT] = useState(false);

  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);

  // Live STT Refs
  const liveSessionRef = useRef<any>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      stopAudio();
      stopLiveSTT();
    };
  }, []);

  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    return audioContextRef.current;
  };

  const handleTTS = async () => {
    if (!text.trim()) return;
    setStatus('loading');
    setErrorMsg('');
    
    stopAudio();

    try {
      const audioData = await geminiService.textToSpeech(text, voice, language);
      if (audioData) {
        const ctx = initAudioContext();
        const decoded = geminiService.decode(audioData);
        const audioBuffer = await geminiService.decodeAudioData(decoded, ctx, 24000, 1);
        bufferRef.current = audioBuffer;
        playFrom(0);
      } else {
        throw new Error("No audio content returned by the AI.");
      }
    } catch (err: any) {
      console.error("TTS Request Failed:", err);
      const isQuota = err?.message?.includes('quota') || err?.status === 'RESOURCE_EXHAUSTED' || err?.code === 429;
      
      if (isQuota) {
        setStatus('quota_exceeded');
        setErrorMsg("API Quota Exceeded. You've reached the limit for your current plan.");
      } else {
        setStatus('error');
        setErrorMsg(err?.message || "Internal AI error. Please try again with shorter text.");
      }
    }
  };

  const handleSwitchKey = async () => {
    try {
      if ((window as any).aistudio?.openSelectKey) {
        await (window as any).aistudio.openSelectKey();
        setStatus('idle');
        setErrorMsg('');
      } else {
        window.open('https://ai.google.dev/gemini-api/docs/billing', '_blank');
      }
    } catch (e) {
      console.error("Failed to open key selector", e);
    }
  };

  const playFrom = (offset: number) => {
    const ctx = initAudioContext();
    if (ctx.state === 'suspended') ctx.resume();

    const source = ctx.createBufferSource();
    source.buffer = bufferRef.current;
    source.playbackRate.value = playbackSpeed;
    source.connect(ctx.destination);
    
    source.onended = () => {
      if (sourceRef.current === source) {
        setStatus('idle');
        sourceRef.current = null;
      }
    };

    source.start(0, offset);
    sourceRef.current = source;
    startTimeRef.current = ctx.currentTime - offset / playbackSpeed;
    setStatus('playing');
  };

  const pauseAudio = () => {
    if (status !== 'playing' || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    sourceRef.current?.stop();
    pausedAtRef.current = (ctx.currentTime - startTimeRef.current) * playbackSpeed;
    setStatus('paused');
  };

  const resumeAudio = () => {
    if (status !== 'paused' || !bufferRef.current) return;
    playFrom(pausedAtRef.current);
  };

  const stopAudio = () => {
    sourceRef.current?.stop();
    sourceRef.current = null;
    pausedAtRef.current = 0;
    setStatus('idle');
  };

  const restartAudio = () => {
    if (!bufferRef.current) return;
    stopAudio();
    playFrom(0);
  };

  // Speed Handler
  useEffect(() => {
    if (sourceRef.current && status === 'playing') {
      sourceRef.current.playbackRate.value = playbackSpeed;
    }
  }, [playbackSpeed, status]);

  // Real-time STT Logic
  const startLiveSTT = async () => {
    try {
      setIsLiveMic(true);
      setSttResult('');
      setIsProcessingSTT(true);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const session = await geminiService.connectLiveSTT({
        onTranscription: (text) => setSttResult(text),
        onError: (err) => {
          console.error(err);
          stopLiveSTT();
        }
      });
      liveSessionRef.current = session;

      const audioCtx = new AudioContext({ sampleRate: 16000 });
      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const l = inputData.length;
        const int16 = new Int16Array(l);
        for (let i = 0; i < l; i++) {
          int16[i] = inputData[i] * 32768;
        }
        const base64 = geminiService.encode(new Uint8Array(int16.buffer));
        session.sendRealtimeInput({ media: { data: base64, mimeType: 'audio/pcm;rate=16000' } });
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);
    } catch (err) {
      console.error("Mic Access Error:", err);
      setIsLiveMic(false);
      setIsProcessingSTT(false);
    }
  };

  const stopLiveSTT = () => {
    setIsLiveMic(false);
    setIsProcessingSTT(false);
    micStreamRef.current?.getTracks().forEach(t => t.stop());
    liveSessionRef.current?.close();
  };

  const languages = [
    { name: 'English', code: 'en' },
    { name: 'Chinese (Mandarin)', code: 'zh' },
    { name: 'Spanish', code: 'es' },
    { name: 'French', code: 'fr' },
    { name: 'German', code: 'de' },
    { name: 'Japanese', code: 'ja' },
    { name: 'Hindi', code: 'hi' },
    { name: 'Arabic', code: 'ar' },
  ];

  const voices = [
    { name: 'Neutral (Kore)', id: 'Kore' },
    { name: 'Cheerful (Puck)', id: 'Puck' },
    { name: 'Deep (Charon)', id: 'Charon' },
    { name: 'Authoritative (Fenrir)', id: 'Fenrir' },
    { name: 'Gentle (Zephyr)', id: 'Zephyr' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-4xl font-medium mb-2">Audio Intelligence</h1>
        <p className="text-gray-500 serif italic">Precision voice synthesis for global languages.</p>
      </header>

      <div className="flex space-x-4 border-b border-gray-100">
        <button 
          onClick={() => setActiveTab('tts')}
          className={`pb-4 px-2 font-medium text-sm transition-colors relative ${activeTab === 'tts' ? 'text-black' : 'text-gray-400'}`}
        >
          Text to Speech
          {activeTab === 'tts' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-black" />}
        </button>
        <button 
          onClick={() => setActiveTab('stt')}
          className={`pb-4 px-2 font-medium text-sm transition-colors relative ${activeTab === 'stt' ? 'text-black' : 'text-gray-400'}`}
        >
          Speech to Text
          {activeTab === 'stt' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-black" />}
        </button>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
        {activeTab === 'tts' ? (
          <div className="space-y-8">
            <div className="relative">
              <textarea 
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter text to speak. Multi-language support (English, Chinese, Hindi, etc.) active."
                className="w-full h-48 p-6 rounded-2xl bg-gray-50 border-none focus:ring-1 focus:ring-black resize-none text-lg leading-relaxed"
              />
              <div className="absolute bottom-4 right-4 flex items-center space-x-2 text-gray-400">
                <span className="text-xs font-medium uppercase tracking-widest">{text.length} chars</span>
              </div>
            </div>

            {(status === 'error' || status === 'quota_exceeded') && (
              <div className="p-5 bg-red-50 rounded-2xl border border-red-100 animate-in fade-in zoom-in-95 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-3 text-red-600">
                  <ExclamationCircleIcon className="w-6 h-6 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold uppercase tracking-tight">{status === 'quota_exceeded' ? 'Quota Exceeded' : 'Request Failed'}</p>
                    <p className="text-sm opacity-90">{errorMsg}</p>
                  </div>
                </div>
                <button 
                  onClick={handleSwitchKey}
                  className="flex items-center space-x-2 bg-red-600 text-white px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-colors shadow-sm"
                >
                  <KeyIcon className="w-4 h-4" />
                  <span>Switch API Key</span>
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-gray-50 rounded-2xl">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-gray-500">
                  <LanguageIcon className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Language & Voice</span>
                </div>
                <div className="flex space-x-4">
                  <select 
                    value={language}
                    onChange={(e) => { setLanguage(e.target.value); if(status==='error' || status==='quota_exceeded') setStatus('idle'); }}
                    className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    {languages.map(lang => (
                      <option key={lang.code} value={lang.name}>{lang.name}</option>
                    ))}
                  </select>
                  <select 
                    value={voice}
                    onChange={(e) => setVoice(e.target.value)}
                    className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    {voices.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-gray-500">
                  <span className="text-xs font-bold uppercase tracking-wider">Playback Pace (Speed)</span>
                  <span className="text-sm font-mono font-bold text-black">{playbackSpeed.toFixed(1)}x</span>
                </div>
                <input 
                  type="range" min="0.5" max="2.0" step="0.1" 
                  value={playbackSpeed}
                  onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                  className="w-full accent-black cursor-pointer"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-50 mt-4">
              <div className="flex items-center space-x-3">
                {(status === 'idle' || status === 'loading' || status === 'error' || status === 'quota_exceeded') ? (
                  <button 
                    onClick={handleTTS}
                    disabled={status === 'loading' || !text.trim()}
                    className={`h-14 min-w-[220px] px-8 rounded-full font-bold text-sm transition-all flex items-center justify-center space-x-3 shadow-lg ${status === 'loading' ? 'bg-indigo-600 text-white' : (status === 'error' || status === 'quota_exceeded') ? 'bg-red-600 text-white' : 'bg-black text-white hover:bg-gray-800'}`}
                  >
                    {status === 'loading' ? (
                      <>
                        <AudioVisualizer />
                        <span>Synthesizing...</span>
                      </>
                    ) : (status === 'error' || status === 'quota_exceeded') ? (
                      <>
                        <ArrowPathIcon className="w-5 h-5" />
                        <span>Retry Synthesis</span>
                      </>
                    ) : (
                      <>
                        <PlayIcon className="w-5 h-5" />
                        <span>Synthesize & Play</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="flex items-center space-x-3 p-1 bg-gray-100 rounded-full">
                    {status === 'playing' ? (
                      <button 
                        onClick={pauseAudio} 
                        className="h-12 px-6 bg-black text-white rounded-full flex items-center space-x-3 hover:bg-gray-800 transition-all shadow-md group"
                      >
                        <AudioVisualizer />
                        <span className="text-xs uppercase tracking-widest font-bold">Streaming</span>
                      </button>
                    ) : (
                      <button 
                        onClick={resumeAudio} 
                        className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-all shadow-md"
                      >
                        <PlayIcon className="w-6 h-6 ml-1" />
                      </button>
                    )}
                    <button 
                      onClick={stopAudio} 
                      className="w-12 h-12 bg-white border border-gray-200 text-gray-600 rounded-full flex items-center justify-center hover:bg-gray-50 transition-all group"
                      title="Stop"
                    >
                      <StopIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </button>
                    <button 
                      onClick={restartAudio} 
                      className="px-6 py-3 text-gray-500 hover:text-black text-xs font-bold uppercase tracking-widest transition-all"
                    >
                      Restart
                    </button>
                  </div>
                )}
              </div>
              
              {status !== 'idle' && status !== 'error' && status !== 'quota_exceeded' && (
                <div className="hidden sm:flex items-center space-x-3 text-xs font-bold text-gray-400">
                  <div className={`w-2 h-2 rounded-full ${status === 'playing' ? 'bg-indigo-500 animate-pulse' : 'bg-yellow-500'}`} />
                  <span className="uppercase tracking-widest">{status} Mode</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button 
                onClick={isLiveMic ? stopLiveSTT : startLiveSTT}
                className={`p-10 rounded-3xl border-2 border-dashed transition-all group flex flex-col items-center justify-center space-y-4 ${isLiveMic ? 'border-red-500 bg-red-50' : 'border-gray-100 hover:border-black'}`}
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${isLiveMic ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-400 group-hover:text-black'}`}>
                  {isLiveMic ? <StopIcon className="w-8 h-8" /> : <MicrophoneIcon className="w-8 h-8" />}
                </div>
                <div className="text-center">
                  <p className={`font-semibold ${isLiveMic ? 'text-red-600' : 'text-gray-800'}`}>
                    {isLiveMic ? 'Stop Recording' : 'Real-time Mic Input'}
                  </p>
                  <p className="text-sm text-gray-400">Convert voice to text as you speak</p>
                </div>
              </button>

              <div className="border-2 border-dashed border-gray-100 rounded-3xl p-10 text-center hover:border-black transition-colors relative group">
                <input type="file" id="audioUpload" accept="audio/*" className="hidden" />
                <label htmlFor="audioUpload" className="cursor-pointer group block">
                  <SpeakerWaveIcon className="w-12 h-12 mx-auto text-gray-300 mb-4 transition-colors group-hover:text-black" />
                  <p className="font-semibold text-gray-800">Manual File Upload</p>
                  <p className="text-sm text-gray-400">Transcribe audio files (MP3, WAV)</p>
                </label>
              </div>
            </div>

            {(sttResult || isProcessingSTT) && (
              <div className="mt-8 p-8 bg-gray-50 rounded-3xl border border-gray-100 min-h-[200px] animate-in slide-in-from-top-4">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                    <h4 className="font-bold text-xs uppercase tracking-widest text-gray-400">Transcription Window</h4>
                  </div>
                  <button onClick={() => setSttResult('')} className="text-gray-400 hover:text-black transition-colors">
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
                <p className="leading-relaxed text-gray-800 text-lg font-medium serif italic">
                  {sttResult || (isLiveMic ? "Awaiting speech..." : "Processing audio data...")}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-2xl border border-gray-100">
          <h4 className="font-bold text-sm uppercase tracking-wider mb-2">Global Charsets</h4>
          <p className="text-xs text-gray-500 leading-relaxed">Enhanced support for Chinese, Arabic, and Hindi charsets with native accents and prosody.</p>
        </div>
        <div className="p-6 bg-white rounded-2xl border border-gray-100">
          <h4 className="font-bold text-sm uppercase tracking-wider mb-2">Adaptive Playback</h4>
          <p className="text-xs text-gray-500 leading-relaxed">Dynamic speed controls (0.5x - 2.0x) that adjust in real-time without session interruptions.</p>
        </div>
        <div className="p-6 bg-white rounded-2xl border border-gray-100">
          <h4 className="font-bold text-sm uppercase tracking-wider mb-2">Live Processing</h4>
          <p className="text-xs text-gray-500 leading-relaxed">Low-latency transcription for live microphone inputs using native multimodal processing.</p>
        </div>
      </div>
    </div>
  );
}
