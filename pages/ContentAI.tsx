
import React, { useState } from 'react';
import { geminiService } from '../services/geminiService';
import { 
  PencilIcon, 
  SparklesIcon, 
  ArrowPathIcon, 
  ArrowDownTrayIcon,
  ClipboardIcon,
  CheckIcon,
  ExclamationCircleIcon,
  KeyIcon
} from '@heroicons/react/24/outline';
import { exportToPDF, exportToTXT } from '../utils/exportUtils';

export default function ContentAI() {
  const [template, setTemplate] = useState('blog');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<{ message: string; isQuota: boolean } | null>(null);

  const getInstructions = (type: string) => {
    switch (type) {
      case 'blog':
        return "You are an expert SEO Content Strategist. Generate a COMPLETE, ready-to-publish blog post. Start with a SEO-optimized 'Title:', followed by a 'Meta Description:', then the full article content with H2 and H3 subheadings. Ensure the tone is engaging and professional.";
      case 'email':
        return "You are a professional Business Communications Expert. Write a COMPLETE, finished formal email. Include a 'Subject Line:', a proper formal salutation, the full body of the email with clear paragraphs, and a professional sign-off. Do not provide a generic template with placeholders; write a polished, final version based on the prompt.";
      case 'copy':
        return "You are a world-class Direct Response Copywriter. Generate high-converting marketing copy. Include a 'Primary Headline:', 'Sub-headlines:', and 'Body Copy:'. Use persuasive frameworks like AIDA (Attention, Interest, Desire, Action) to drive results.";
      case 'story':
        return "You are a celebrated Fiction Author. Write a complete, immersive short story with a title, character development, and a satisfying narrative arc. Focus on vivid descriptions and emotional resonance.";
      case 'social':
        return "You are a Social Media Growth Expert. Generate a set of 3 distinct, ready-to-post captions for LinkedIn, Instagram, and Twitter/X. Include line breaks, relevant emojis, and strategic hashtags.";
      case 'script':
        return "You are a professional Screenwriter. Generate a full, production-ready video script. Include scene headers (EXT/INT), character names, dialogue, and specific camera/visual cues.";
      default:
        return "Generate high-quality, professional, and complete content based on the user's request.";
    }
  };

  const handleSwitchKey = async () => {
    try {
      if ((window as any).aistudio?.openSelectKey) {
        await (window as any).aistudio.openSelectKey();
        setError(null);
      } else {
        window.open('https://ai.google.dev/gemini-api/docs/billing', '_blank');
      }
    } catch (e) {
      console.error("Failed to open key selector", e);
    }
  };

  const handleGenerate = async () => {
    if (!input) return;
    setIsProcessing(true);
    setOutput('');
    setError(null);
    
    const instructions = getInstructions(template);
    try {
      const res = await geminiService.generateComplexContent(`Topic/Instructions: ${input}`, instructions);
      setOutput(res);
    } catch (err: any) {
      console.error(err);
      setError({ 
        message: err.message || "Failed to generate content", 
        isQuota: !!err.isQuota 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header>
        <h1 className="text-4xl font-medium mb-2">Content Suite</h1>
        <p className="text-gray-500 serif italic">Professional-grade AI writing for every communication need.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm sticky top-8">
            <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-4">Select Output Type</h3>
            <div className="space-y-2">
              {[
                { id: 'blog', name: 'Blog Post (SEO)', icon: '📝' },
                { id: 'email', name: 'Formal Email', icon: '📧' },
                { id: 'copy', name: 'Marketing Copy', icon: '📣' },
                { id: 'story', name: 'Creative Story', icon: '📖' },
                { id: 'social', name: 'Social Media Posts', icon: '📱' },
                { id: 'script', name: 'Video Script', icon: '🎬' },
              ].map(t => (
                <button 
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  className={`w-full text-left px-5 py-4 rounded-2xl flex items-center justify-between transition-all ${template === t.id ? 'bg-black text-white shadow-xl scale-[1.02]' : 'hover:bg-gray-100 text-gray-600'}`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{t.icon}</span>
                    <span className="font-semibold text-sm">{t.name}</span>
                  </div>
                  {template === t.id && <SparklesIcon className="w-4 h-4 text-yellow-400" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            <div className="mb-6">
              <label className="text-xs font-bold uppercase text-gray-400 tracking-wider block mb-2">Subject or Detailed Topic</label>
              
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-2">
                  <div className="flex items-center space-x-3 text-red-600">
                    <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0" />
                    <p className="text-xs font-medium">
                      {error.isQuota ? "API Quota Exceeded. Please switch project/key." : error.message}
                    </p>
                  </div>
                  {error.isQuota && (
                    <button 
                      onClick={handleSwitchKey}
                      className="bg-red-600 text-white px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-red-700 transition-colors flex items-center space-x-1"
                    >
                      <KeyIcon className="w-3 h-3" />
                      <span>Switch Key</span>
                    </button>
                  )}
                </div>
              )}

              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`e.g. Write a formal email to my manager, Sarah, requesting a 2-week leave for a family wedding in June...`}
                className="w-full bg-gray-50 border-none px-6 py-5 rounded-2xl text-lg focus:ring-2 focus:ring-black h-32 resize-none transition-all"
              />
            </div>
            
            <button 
              onClick={handleGenerate}
              disabled={isProcessing || !input}
              className="w-full bg-black text-white py-5 rounded-2xl font-bold flex items-center justify-center space-x-3 hover:bg-gray-800 disabled:opacity-50 transition-all shadow-xl active:scale-[0.98]"
            >
              {isProcessing ? <ArrowPathIcon className="w-6 h-6 animate-spin" /> : <PencilIcon className="w-5 h-5" />}
              <span className="text-lg">Compose Final Draft</span>
            </button>

            {output && (
              <div className="mt-10 pt-10 border-t border-gray-100 animate-in slide-in-from-top-4 duration-500">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <h4 className="text-xs font-bold uppercase text-gray-400 tracking-widest">Finished Document</h4>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => exportToPDF(`Draft_${template}`, output, `SKLearn: ${template.toUpperCase()} DRAFT`)}
                      className="p-2.5 hover:bg-gray-50 rounded-xl text-gray-600 border border-gray-100 flex items-center space-x-2 transition-all" 
                      title="Export PDF"
                    >
                      <ArrowDownTrayIcon className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">PDF</span>
                    </button>
                    <button 
                      onClick={() => exportToTXT(`Draft_${template}`, output)}
                      className="p-2.5 hover:bg-gray-50 rounded-xl text-gray-600 border border-gray-100 flex items-center space-x-2 transition-all" 
                      title="Export TXT"
                    >
                      <ArrowDownTrayIcon className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">TXT</span>
                    </button>
                    <button 
                      onClick={copyToClipboard} 
                      className="p-2.5 hover:bg-gray-50 rounded-xl text-gray-600 border border-gray-100 flex items-center space-x-2 transition-all" 
                      title="Copy to Clipboard"
                    >
                      {copied ? <CheckIcon className="w-4 h-4 text-green-500" /> : <ClipboardIcon className="w-4 h-4" />}
                      <span className="text-[10px] font-bold uppercase tracking-widest">{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
                <div className="prose prose-sm max-w-none text-gray-800 bg-white border border-gray-50 p-10 rounded-3xl whitespace-pre-wrap leading-relaxed shadow-inner font-serif text-lg">
                  {output}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
