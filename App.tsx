
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AIModule } from './types';
import Dashboard from './pages/Dashboard';
import AudioAI from './pages/AudioAI';
import DocumentAI from './pages/DocumentAI';
import ImageAI from './pages/ImageAI';
import ChatAI from './pages/ChatAI';
import ContentAI from './pages/ContentAI';
import CareerAI from './pages/CareerAI';
import WebAI from './pages/WebAI';
import { 
  HomeIcon, 
  SpeakerWaveIcon, 
  DocumentTextIcon, 
  PhotoIcon, 
  ChatBubbleLeftRightIcon, 
  PencilSquareIcon, 
  BriefcaseIcon, 
  GlobeAltIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const SidebarItem: React.FC<{ to: string; icon: any; label: string; active: boolean }> = ({ to, icon: Icon, label, active }) => (
  <Link 
    to={to} 
    className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      active 
        ? 'bg-black text-white shadow-lg' 
        : 'text-gray-500 hover:bg-gray-100 hover:text-black'
    }`}
  >
    <Icon className="w-5 h-5" />
    <span className="font-medium text-sm">{label}</span>
  </Link>
);

const Navigation = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { to: '/', icon: HomeIcon, label: 'Dashboard', id: AIModule.DASHBOARD },
    { to: '/audio', icon: SpeakerWaveIcon, label: 'Audio & Speech', id: AIModule.AUDIO },
    { to: '/docs', icon: DocumentTextIcon, label: 'Docs & Notes', id: AIModule.DOCUMENT },
    { to: '/images', icon: PhotoIcon, label: 'Image Visuals', id: AIModule.IMAGE },
    { to: '/chat', icon: ChatBubbleLeftRightIcon, label: 'AI Support Chat', id: AIModule.CHAT },
    { to: '/writing', icon: PencilSquareIcon, label: 'Writing & SEO', id: AIModule.WRITING },
    { to: '/career', icon: BriefcaseIcon, label: 'Career & Portfolio', id: AIModule.CAREER },
    { to: '/website', icon: GlobeAltIcon, label: 'Web Generator', id: AIModule.WEBSITE },
  ];

  return (
    <>
      {/* Mobile Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 bg-white rounded-lg shadow-md border border-gray-100"
        >
          {isOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
        </button>
      </div>

      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-100 transform transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8">
          <h1 className="text-2xl font-bold tracking-tight serif italic">SKLearn.</h1>
          <p className="text-[10px] uppercase tracking-widest text-gray-400 mt-1 font-semibold">Unified Intelligence</p>
        </div>
        
        <nav className="px-4 space-y-1 overflow-y-auto h-[calc(100vh-120px)] pb-10">
          {navItems.map(item => (
            <SidebarItem 
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              active={location.pathname === item.to}
            />
          ))}
        </nav>
      </aside>
    </>
  );
};

export default function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-[#fbfbfb]">
        <Navigation />
        <main className="flex-1 lg:ml-64 p-4 md:p-10">
          <div className="max-w-6xl mx-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/audio" element={<AudioAI />} />
              <Route path="/docs" element={<DocumentAI />} />
              <Route path="/images" element={<ImageAI />} />
              <Route path="/chat" element={<ChatAI />} />
              <Route path="/writing" element={<ContentAI />} />
              <Route path="/career" element={<CareerAI />} />
              <Route path="/website" element={<WebAI />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}
