
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  SpeakerWaveIcon, 
  DocumentTextIcon, 
  PhotoIcon, 
  ChatBubbleLeftRightIcon, 
  PencilSquareIcon, 
  GlobeAltIcon 
} from '@heroicons/react/24/outline';

const FeatureCard = ({ to, icon: Icon, title, desc, color }: any) => (
  <Link to={to} className="group block p-6 rounded-2xl bg-white border border-gray-100 hover:border-black transition-all duration-300 hover:shadow-xl">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${color}`}>
      <Icon className="w-6 h-6" />
    </div>
    <h3 className="text-lg font-semibold mb-2 group-hover:underline decoration-1 underline-offset-4">{title}</h3>
    <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
  </Link>
);

export default function Dashboard() {
  return (
    <div className="animate-in fade-in duration-700">
      <header className="mb-12">
        <h1 className="text-5xl font-medium mb-4">Good morning.</h1>
        <p className="text-xl text-gray-500 serif italic">How can SKLearn assist your creative process today?</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <FeatureCard 
          to="/audio" 
          icon={SpeakerWaveIcon} 
          title="Audio & Speech" 
          desc="Generate natural voices, transcribe audio, and modulate speech effects."
          color="bg-orange-50 text-orange-600"
        />
        <FeatureCard 
          to="/docs" 
          icon={DocumentTextIcon} 
          title="Docs & Summarization" 
          desc="AI document processor for PDFs, summaries, and note-taking."
          color="bg-blue-50 text-blue-600"
        />
        <FeatureCard 
          to="/images" 
          icon={PhotoIcon} 
          title="Visual Intelligence" 
          desc="Transform text to art, perform OCR, and recognize complex scenes."
          color="bg-purple-50 text-purple-600"
        />
        <FeatureCard 
          to="/chat" 
          icon={ChatBubbleLeftRightIcon} 
          title="Emotional Support" 
          desc="Conversational AI designed for wellness and helpful dialogue."
          color="bg-green-50 text-green-600"
        />
        <FeatureCard 
          to="/writing" 
          icon={PencilSquareIcon} 
          title="Content Suite" 
          desc="Full stack of writing tools from SEO blogs to formal emails."
          color="bg-pink-50 text-pink-600"
        />
        <FeatureCard 
          to="/website" 
          icon={GlobeAltIcon} 
          title="Web Presence" 
          desc="AI website builder for landing pages and online portfolios."
          color="bg-cyan-50 text-cyan-600"
        />
      </div>

      <div className="mt-12 p-8 rounded-3xl bg-black text-white overflow-hidden relative">
        <div className="relative z-10 max-w-xl">
          <h2 className="text-3xl font-medium mb-4">Multi-Modal Synergy</h2>
          <p className="text-gray-400 mb-6">Experience our latest model that connects image analysis to voice generation instantly.</p>
          <button className="px-6 py-3 bg-white text-black rounded-full font-semibold text-sm hover:bg-gray-200 transition-colors">
            Try Unified Assistant
          </button>
        </div>
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-indigo-500/20 to-transparent"></div>
      </div>
    </div>
  );
}
