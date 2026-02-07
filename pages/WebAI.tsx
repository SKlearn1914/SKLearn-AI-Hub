
import React, { useState, useEffect, useRef } from 'react';
import { geminiService, APIError } from '../services/geminiService';
import { 
  GlobeAltIcon, 
  WindowIcon, 
  SparklesIcon, 
  ArrowPathIcon, 
  CodeBracketIcon, 
  CommandLineIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  ExclamationCircleIcon,
  KeyIcon
} from '@heroicons/react/24/outline';
import { exportToHTML } from '../utils/exportUtils';

export default function WebAI() {
  const [desc, setDesc] = useState('');
  const [layout, setLayout] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [error, setError] = useState<{ message: string; isQuota: boolean } | null>(null);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);

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

  const handleBuildLayout = async () => {
    if (!desc) return;
    setIsProcessing(true);
    setError(null);
    setCode(null);
    const instructions = "You are a creative web designer and copywriter. Based on the user's business description, generate a detailed structure for a high-converting landing page. Include a Headline, Sub-headline, 3 Main Features with descriptions, an About section, and a Call to Action (CTA) label. Be descriptive about styles, brand voice, and visual elements.";
    try {
      const res = await geminiService.generateComplexContent(`Business: ${desc}`, instructions);
      setLayout(res);
    } catch (err: any) {
      console.error(err);
      setError({ 
        message: err.message || "Failed to generate layout", 
        isQuota: !!err.isQuota 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateCode = async () => {
    if (!layout) return;
    setIsGeneratingCode(true);
    setError(null);
    const instructions = `You are a world-class frontend engineer. 
    Transform the provided layout into a SINGLE, STANDALONE, FULLY RESPONSIVE HTML file.
    CRITICAL REQUIREMENTS:
    1. Use Tailwind CSS via CDN (https://cdn.tailwindcss.com).
    2. MUST BE FULLY RESPONSIVE: Use mobile-first design. Ensure it looks perfect on iPhone-sized screens AND 4K monitors. Use Tailwind responsive prefixes (sm:, md:, lg:, xl:).
    3. INCLUDE: A responsive navigation bar (hamburger on mobile), a bold hero section, feature grid, about section, and footer.
    4. ACCESSIBILITY: Use semantic HTML5 tags and ARIA labels.
    5. AESTHETICS: Use modern, high-quality typography (Inter/Sans), ample whitespace, and professional color palettes.
    6. INTERACTIVITY: Include subtle CSS animations or Alpine.js (if needed) for interactions.
    7. OUTPUT: Provide ONLY the full HTML code starting with <!DOCTYPE html>.`;
    
    try {
      const res = await geminiService.generateComplexContent(`Layout Description: ${layout}`, instructions);
      const cleanedCode = res.replace(/```html/g, '').replace(/```/g, '').trim();
      setCode(cleanedCode);
      setTimeout(() => setShowEditor(true), 300);
    } catch (err: any) {
      console.error(err);
      setError({ 
        message: err.message || "Failed to generate code", 
        isQuota: !!err.isQuota 
      });
    } finally {
      setIsGeneratingCode(false);
    }
  };

  useEffect(() => {
    if (code && iframeRef.current) {
      const doc = iframeRef.current.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(code);
        doc.close();
      }
    }
  }, [code, showEditor, previewMode]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header>
        <h1 className="text-4xl font-medium mb-2">Web Generator</h1>
        <p className="text-gray-500 serif italic text-lg">Instant responsive deployment for the modern web.</p>
      </header>

      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center space-x-3 text-cyan-600">
            <GlobeAltIcon className="w-6 h-6" />
            <h3 className="font-semibold text-lg uppercase tracking-tight">Business Intelligence Input</h3>
          </div>
          
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-2">
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
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Describe your business goal, target audience, and preferred vibe (e.g., Luxury, Minimalist, Tech-Forward)..."
            className="w-full bg-gray-50 border-none px-6 py-5 rounded-2xl text-lg focus:ring-2 focus:ring-black h-40 resize-none transition-all"
          />
          <button 
            onClick={handleBuildLayout}
            disabled={isProcessing || !desc}
            className="w-full bg-black text-white py-5 rounded-2xl font-bold flex items-center justify-center space-x-2 hover:bg-gray-800 disabled:opacity-50 transition-all shadow-xl active:scale-[0.98]"
          >
            {isProcessing ? <ArrowPathIcon className="w-6 h-6 animate-spin" /> : <SparklesIcon className="w-6 h-6" />}
            <span className="text-lg">Generate Blueprint</span>
          </button>
        </div>

        {layout && (
          <div className="bg-white rounded-3xl p-10 border border-gray-100 shadow-xl space-y-10 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-50 pb-6">
              <div className="flex items-center space-x-2 text-gray-400">
                <WindowIcon className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-widest">Architectural Layout</span>
              </div>
              <div className="flex space-x-1">
                {[1, 2, 3].map(i => <div key={i} className="w-2 h-2 rounded-full bg-gray-200" />)}
              </div>
            </div>
            
            <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap leading-relaxed font-serif text-lg">
              {layout}
            </div>

            <div className="pt-10 border-t border-gray-50 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex flex-col">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Status: Blueprint Finalized</p>
                <p className="text-[10px] text-indigo-400 font-sans mt-1">Ready for Responsive Code Generation</p>
              </div>
              
              <div className="flex space-x-4 w-full md:w-auto">
                <button 
                  onClick={handleGenerateCode}
                  disabled={isGeneratingCode}
                  className={`flex-1 md:flex-none px-8 py-4 rounded-full text-sm font-bold uppercase tracking-widest transition-all flex items-center justify-center space-x-2 shadow-lg ${code ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                >
                  {isGeneratingCode ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <CodeBracketIcon className="w-4 h-4" />}
                  <span>{isGeneratingCode ? 'Building Responsive Code...' : code ? 'Regenerate Code' : 'Generate Responsive Site'}</span>
                </button>
                
                {code && (
                  <button 
                    onClick={() => setShowEditor(true)}
                    className="flex-1 md:flex-none px-8 py-4 bg-green-600 text-white rounded-full text-sm font-bold uppercase tracking-widest hover:bg-green-700 transition-all flex items-center justify-center space-x-2 shadow-lg active:scale-95"
                  >
                    <CommandLineIcon className="w-4 h-4" />
                    <span>Launch Editor</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 z-[60] bg-white flex flex-col animate-in slide-in-from-bottom-12 duration-500">
          <nav className="h-20 border-b border-gray-100 px-8 flex items-center justify-between bg-white/90 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <div className="h-6 w-px bg-gray-200"></div>
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400">Responsive Live Suite</span>
            </div>

            <div className="flex items-center bg-gray-100 p-1 rounded-full">
              <button 
                onClick={() => setPreviewMode('desktop')}
                className={`p-2 rounded-full transition-all ${previewMode === 'desktop' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-black'}`}
              >
                <ComputerDesktopIcon className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setPreviewMode('mobile')}
                className={`p-2 rounded-full transition-all ${previewMode === 'mobile' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-black'}`}
              >
                <DevicePhoneMobileIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <button 
                onClick={() => exportToHTML(`${desc.slice(0, 10).replace(/\s/g, '_')}_Site`, code || '')}
                className="flex items-center space-x-3 bg-black text-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-all shadow-md active:scale-95"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                <span>Export Fully Responsive Site</span>
              </button>
              <button 
                onClick={() => setShowEditor(false)}
                className="p-3 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-all"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </nav>

          <div className="flex-1 flex overflow-hidden bg-gray-50">
            {/* Code Panel */}
            <div className="w-1/3 border-r border-gray-100 flex flex-col bg-white">
              <div className="h-12 bg-gray-50/50 border-b border-gray-100 px-6 flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center space-x-2">
                  <CodeBracketIcon className="w-3.5 h-3.5" />
                  <span>index.html</span>
                </span>
                <span className="text-[10px] font-mono text-indigo-400">UTF-8 / Standalone</span>
              </div>
              <textarea 
                value={code || ''}
                onChange={(e) => setCode(e.target.value)}
                className="flex-1 p-8 font-mono text-sm leading-relaxed bg-transparent border-none focus:ring-0 resize-none text-gray-600"
                spellCheck={false}
              />
            </div>

            {/* Preview Panel */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-hidden bg-[#f0f0f0] relative">
              <div className="absolute top-4 left-6 flex items-center space-x-2 text-gray-400">
                 <EyeIcon className="w-4 h-4" />
                 <span className="text-[10px] font-bold uppercase tracking-widest">Live System Refresh</span>
              </div>
              
              <div 
                className={`transition-all duration-500 bg-white shadow-2xl overflow-hidden rounded-2xl ${
                  previewMode === 'desktop' ? 'w-full h-full' : 'w-[375px] h-[812px] border-[12px] border-black rounded-[3rem]'
                }`}
              >
                <iframe 
                  ref={iframeRef}
                  title="Live Preview"
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
