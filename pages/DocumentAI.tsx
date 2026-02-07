
import React, { useState, useRef } from 'react';
import { geminiService } from '../services/geminiService';
import { 
  DocumentMagnifyingGlassIcon, 
  ClipboardDocumentListIcon, 
  ArrowPathIcon,
  ArrowDownTrayIcon,
  CloudArrowUpIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { exportToPDF, exportToTXT, exportToCSV } from '../utils/exportUtils';
import * as pdfjs from 'pdfjs-dist';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.10.38/build/pdf.worker.mjs';

export default function DocumentAI() {
  const [content, setContent] = useState('');
  const [result, setResult] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReadingPdf, setIsReadingPdf] = useState(false);
  const [mode, setMode] = useState<'summary' | 'quiz' | 'points'>('summary');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProcess = async () => {
    if (!content) return;
    setIsProcessing(true);
    let prompt = "";
    if (mode === 'summary') prompt = "Provide a comprehensive and highly professional summary of the following document. Use clear headings and bullet points for readability.";
    if (mode === 'quiz') prompt = "Create a challenging and educational 10-question multiple choice quiz based strictly on the content provided. Provide the questions first, then an answer key clearly labeled at the end.";
    if (mode === 'points') prompt = "Extract exactly 10 high-impact key takeaways from this document. Format them as a numbered list with a brief explanation for each.";

    try {
      const output = await geminiService.processText(prompt, content);
      setResult(output);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please upload a valid PDF file.');
      return;
    }

    setIsReadingPdf(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n\n';
      }

      setContent(fullText);
    } catch (err) {
      console.error('Error reading PDF:', err);
      alert('Failed to read PDF content. Please try pasting the text manually.');
    } finally {
      setIsReadingPdf(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const clearContent = () => {
    setContent('');
    setResult('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-4xl font-medium mb-2">Docs & Notes</h1>
        <p className="text-gray-500 serif italic">Analyze documents, generate study aids, and extract key insights.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative group">
            <div className="flex items-center justify-between mb-4">
              <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">Input Content</label>
              <div className="flex space-x-2">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-2 text-xs font-bold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors"
                >
                  <CloudArrowUpIcon className="w-4 h-4" />
                  <span>{isReadingPdf ? 'Reading...' : 'Upload PDF'}</span>
                </button>
                {content && (
                  <button onClick={clearContent} className="text-gray-400 hover:text-red-500 transition-colors">
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept="application/pdf" 
              className="hidden" 
            />

            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste text here or upload a PDF above..."
              className="w-full h-80 p-4 rounded-xl bg-gray-50 border-none focus:ring-1 focus:ring-black resize-none text-base leading-relaxed"
            />

            <div className="mt-6 flex flex-wrap gap-2">
              <button 
                onClick={() => setMode('summary')}
                className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${mode === 'summary' ? 'bg-black text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                Summarize
              </button>
              <button 
                onClick={() => setMode('quiz')}
                className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${mode === 'quiz' ? 'bg-black text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                Generate Quiz
              </button>
              <button 
                onClick={() => setMode('points')}
                className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${mode === 'points' ? 'bg-black text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                Key Points
              </button>
            </div>

            <button 
              onClick={handleProcess}
              disabled={isProcessing || !content || isReadingPdf}
              className="w-full mt-4 bg-black text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 hover:bg-gray-800 disabled:opacity-50 transition-all shadow-lg active:scale-[0.98]"
            >
              {isProcessing ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <DocumentMagnifyingGlassIcon className="w-5 h-5" />}
              <span>{isProcessing ? 'Analyzing Content...' : 'Run Intelligence Engine'}</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm min-h-[500px] flex flex-col">
          <div className="flex items-center justify-between mb-6 border-b border-gray-50 pb-4">
            <div className="flex items-center space-x-2 text-gray-400">
              <ClipboardDocumentListIcon className="w-5 h-5" />
              <h3 className="font-bold text-xs uppercase tracking-widest">Extracted Intelligence</h3>
            </div>
            {result && (
              <div className="flex space-x-2">
                <button 
                  onClick={() => exportToPDF(`Doc_Analysis_${mode}`, result, `SKLearn: ${mode.toUpperCase()} Analysis`)}
                  className="p-2.5 hover:bg-gray-50 rounded-xl text-gray-600 flex items-center space-x-2 border border-transparent hover:border-gray-200 transition-all" 
                  title="Export Formatted PDF"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">PDF</span>
                </button>
                <button 
                  onClick={() => exportToCSV(`Doc_Analysis_${mode}`, result)}
                  className="p-2.5 hover:bg-gray-50 rounded-xl text-gray-600 flex items-center space-x-2 border border-transparent hover:border-gray-200 transition-all" 
                  title="Export Formatted CSV"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">CSV</span>
                </button>
              </div>
            )}
          </div>
          {result ? (
            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-800 overflow-y-auto max-h-[600px] flex-1 leading-relaxed pr-2">
              {result}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
              <DocumentMagnifyingGlassIcon className="w-16 h-16 mb-4 opacity-10" />
              <p className="text-sm serif italic text-gray-400">Awaiting intelligent analysis...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
