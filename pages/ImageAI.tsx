
import React, { useState } from 'react';
import { geminiService } from '../services/geminiService';
import { PhotoIcon, SparklesIcon, EyeIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export default function ImageAI() {
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mode, setMode] = useState<'create' | 'analyze'>('create');
  const [analysisResult, setAnalysisResult] = useState('');

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsProcessing(true);
    setGeneratedImage(null);
    const url = await geminiService.generateImage(prompt);
    if (url) setGeneratedImage(url);
    setIsProcessing(false);
  };

  const handleImageAnalysis = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    setAnalysisResult('');
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const res = await geminiService.analyzeImage(base64, "Perform detailed OCR and describe the scene in this image. Identify any objects and their context.");
      setAnalysisResult(res);
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-medium mb-2">Visual Intelligence</h1>
          <p className="text-gray-500 serif italic">Generative art and intelligent visual recognition.</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-full w-fit">
          <button 
            onClick={() => setMode('create')}
            className={`px-6 py-2 rounded-full text-xs font-semibold transition-all ${mode === 'create' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Generate Art
          </button>
          <button 
            onClick={() => setMode('analyze')}
            className={`px-6 py-2 rounded-full text-xs font-semibold transition-all ${mode === 'analyze' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Vision OCR
          </button>
        </div>
      </header>

      {mode === 'create' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">Image Prompt</label>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A futuristic city with lavender trees and floating architecture, high fashion photography, 8k..."
                className="w-full h-40 p-4 rounded-2xl bg-gray-50 border-none focus:ring-1 focus:ring-black resize-none text-base"
              />
            </div>
            <button 
              onClick={handleGenerate}
              disabled={isProcessing || !prompt}
              className="w-full bg-black text-white py-4 rounded-2xl font-semibold flex items-center justify-center space-x-2 hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {isProcessing ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
              <span>Generate Vision</span>
            </button>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Styles</p>
                <p className="text-sm font-medium">Hyper-realistic, Anime, Oil Painting</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Resolution</p>
                <p className="text-sm font-medium">1024px Square (HQ)</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-100 rounded-3xl aspect-square overflow-hidden relative flex items-center justify-center border border-gray-200">
            {generatedImage ? (
              <img src={generatedImage} alt="AI Generated" className="w-full h-full object-cover animate-in zoom-in-95 duration-700" />
            ) : isProcessing ? (
              <div className="text-center">
                <ArrowPathIcon className="w-12 h-12 mx-auto text-gray-300 animate-spin mb-4" />
                <p className="text-gray-400 serif italic">Refining pixels...</p>
              </div>
            ) : (
              <div className="text-center opacity-30">
                <PhotoIcon className="w-20 h-20 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500 serif italic">Your art will appear here</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-12 border border-gray-100 text-center hover:border-black transition-all cursor-pointer relative overflow-hidden group">
            <input type="file" accept="image/*" onChange={handleImageAnalysis} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
            <EyeIcon className="w-16 h-16 mx-auto text-gray-200 group-hover:text-black transition-colors mb-4" />
            <h3 className="text-xl font-medium mb-2">Upload Image for Analysis</h3>
            <p className="text-gray-400 text-sm">OCR, scene recognition, and object detection</p>
          </div>

          {isProcessing && (
            <div className="text-center p-12">
              <ArrowPathIcon className="w-10 h-10 mx-auto text-gray-300 animate-spin" />
              <p className="mt-4 text-gray-400 italic">Analyzing visual data...</p>
            </div>
          )}

          {analysisResult && (
            <div className="bg-white rounded-3xl p-8 border border-gray-100 animate-in fade-in slide-in-from-top-4">
              <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-6">Visual Report</h4>
              <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap leading-relaxed">
                {analysisResult}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
