
import React, { useState } from 'react';
import { geminiService } from '../services/geminiService';
import { BriefcaseIcon, UserCircleIcon, DocumentIcon, SparklesIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { exportToPDF } from '../utils/exportUtils';

export default function CareerAI() {
  const [data, setData] = useState('');
  const [resume, setResume] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleCreate = async () => {
    if (!data) return;
    setIsGenerating(true);
    const instructions = "You are a world-class career coach. Convert the provided rough notes into a professional, high-impact chronologically formatted Resume/CV. Use strong action verbs, include a summary, skills section, and clear headings. Optimize for ATS (Applicant Tracking Systems).";
    try {
      const res = await geminiService.generateComplexContent(data, instructions);
      setResume(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-4xl font-medium mb-2">Career & Portfolio</h1>
        <p className="text-gray-500 serif italic">Build professional presence with high-impact AI tools.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center space-x-3 text-indigo-600 mb-2">
            <UserCircleIcon className="w-6 h-6" />
            <h3 className="font-semibold">Draft Your Profile</h3>
          </div>
          <p className="text-sm text-gray-500">Paste your raw experience, education, and skills. Don't worry about formatting; SKLearn will handle the structure.</p>
          <textarea 
            value={data}
            onChange={(e) => setData(e.target.value)}
            placeholder="E.g. John Doe, Web Dev at TechCo for 3 years. Used React, Node. Led a team of 4..."
            className="w-full h-64 p-5 rounded-2xl bg-gray-50 border-none focus:ring-1 focus:ring-black resize-none"
          />
          <button 
            onClick={handleCreate}
            disabled={isGenerating || !data}
            className="w-full bg-black text-white py-4 rounded-2xl font-semibold flex items-center justify-center space-x-2 hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {isGenerating ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
            <span>Generate Professional CV</span>
          </button>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm relative flex flex-col min-h-[500px]">
          <div className="flex items-center justify-between mb-8 border-b border-gray-50 pb-4">
            <div className="flex items-center space-x-2">
              <DocumentIcon className="w-5 h-5 text-gray-400" />
              <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-400">Document Preview</h4>
            </div>
            {resume && (
              <button 
                onClick={() => exportToPDF('My_Resume', resume)}
                className="text-xs font-semibold text-indigo-600 hover:underline flex items-center space-x-1"
              >
                <span>Export as PDF</span>
              </button>
            )}
          </div>
          
          {resume ? (
            <div className="flex-1 bg-white p-8 border border-gray-50 shadow-inner rounded-xl font-serif text-sm leading-relaxed overflow-y-auto max-h-[600px] whitespace-pre-wrap">
              {resume}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-200">
              <BriefcaseIcon className="w-20 h-20 mb-4 opacity-10" />
              <p className="serif italic text-sm">Awaiting career data input...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
