
import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Plus, 
  Mic, 
  Settings, 
  Brain, 
  Search, 
  MapPin, 
  Menu,
  X,
  User as UserIcon,
  Bot,
  Sparkles,
  ExternalLink,
  Info
} from 'lucide-react';
import { UserProfile, ChatMessage, MessageRole, FileData, GroundingChunk } from '../types';
import { chatWithGemini, generateImage, generateVideo } from '../services/geminiService';
import LiveView from './LiveView';

interface Props {
  profile: UserProfile;
}

const FormattedText: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');
  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return (
          <p key={i} className="leading-relaxed">
            {parts.map((part, j) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={j} className="font-bold text-white">{part.slice(2, -2)}</strong>;
              }
              if (part.startsWith('`') && part.endsWith('`')) {
                return <code key={j} className="bg-black/30 px-1 rounded font-mono text-blue-300">{part.slice(1, -1)}</code>;
              }
              return part;
            })}
          </p>
        );
      })}
    </div>
  );
};

const ChatInterface: React.FC<Props> = ({ profile }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: MessageRole.MODEL,
      content: `Hello **${profile.name}**! I am **Atlas AI**, developed by **Fodil Zerrouali** from Algeria. I am your multilingual assistant. How can I help you today?`,
    }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  const [useMaps, setUseMaps] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showLive, setShowLive] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<FileData[]>([]);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: FileData[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
      });
      reader.readAsDataURL(file);
      const dataUrl = await base64Promise;
      const base64Data = dataUrl.split(',')[1];
      
      newFiles.push({
        name: file.name,
        mimeType: file.type,
        data: base64Data,
        url: dataUrl
      });
    }
    setPendingFiles(prev => [...prev, ...newFiles]);
  };

  const handleSendMessage = async () => {
    if ((!input.trim() && pendingFiles.length === 0) || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: MessageRole.USER,
      content: input,
      files: pendingFiles
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setPendingFiles([]);
    setIsLoading(true);

    try {
      const lowerInput = input.toLowerCase();
      const isImgCmd = lowerInput.startsWith('generate image') || lowerInput.startsWith('draw') || lowerInput.startsWith('ارسم') || lowerInput.startsWith('صورة');
      const isVidCmd = lowerInput.startsWith('generate video') || lowerInput.startsWith('فيديو');

      if (isImgCmd) {
        const prompt = input.replace(/(generate image|draw|ارسم|صورة)/i, '').trim();
        const imgUrl = await generateImage(prompt);
        if (imgUrl) {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: MessageRole.MODEL,
            content: `Image generated for: **${prompt}**`,
            type: 'image',
            files: [{ name: 'generated.png', mimeType: 'image/png', data: '', url: imgUrl }]
          }]);
        }
      } else if (isVidCmd) {
        const prompt = input.replace(/(generate video|فيديو)/i, '').trim();
        const videoUrl = await generateVideo(prompt);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: MessageRole.MODEL,
          content: `Video created for: **${prompt}**`,
          type: 'video',
          files: [{ name: 'generated.mp4', mimeType: 'video/mp4', data: '', url: videoUrl }]
        }]);
      } else {
        const response = await chatWithGemini(
          messages.concat(userMsg).map(m => ({ role: m.role, content: m.content })),
          { thinking: isThinking, search: useSearch, maps: useMaps }
        );
        
        const chunks: GroundingChunk[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: MessageRole.MODEL,
          content: response.text || "I'm sorry, I couldn't process that.",
          grounding: chunks.length > 0 ? chunks : undefined
        }]);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: MessageRole.MODEL,
        content: "Connection error with Atlas AI. Please check your internet.",
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden text-gray-200 font-sans bg-[#0b0e14]">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:relative z-50 w-80 h-full bg-[#161b22] border-r border-gray-800 transition-transform duration-300 shadow-2xl`}>
        <div className="flex flex-col h-full">
          <div className="p-5 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-3 font-black text-2xl tracking-tighter">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg">
                <Sparkles className="text-white w-6 h-6" />
              </div>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-orange-300">Atlas AI</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
              <X size={24} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="px-2 text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Features</div>
            <button 
              onClick={() => setIsThinking(!isThinking)}
              className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all ${isThinking ? 'bg-purple-900/30 text-purple-300 ring-1 ring-purple-500/50' : 'hover:bg-gray-800/50 text-gray-400'}`}
            >
              <Brain size={20} />
              <div className="text-left">
                <div className="font-semibold text-sm">Deep Reasoning</div>
                <div className="text-[10px] opacity-60 uppercase tracking-tight">Logical Analysis</div>
              </div>
            </button>
            <button 
              onClick={() => setUseSearch(!useSearch)}
              className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all ${useSearch ? 'bg-blue-900/30 text-blue-300 ring-1 ring-blue-500/50' : 'hover:bg-gray-800/50 text-gray-400'}`}
            >
              <Search size={20} />
              <div className="text-left">
                <div className="font-semibold text-sm">Web Search</div>
                <div className="text-[10px] opacity-60 uppercase tracking-tight">Live Data</div>
              </div>
            </button>
            <button 
              onClick={() => setUseMaps(!useMaps)}
              className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all ${useMaps ? 'bg-green-900/30 text-green-300 ring-1 ring-green-500/50' : 'hover:bg-gray-800/50 text-gray-400'}`}
            >
              <MapPin size={20} />
              <div className="text-left">
                <div className="font-semibold text-sm">Maps & Places</div>
                <div className="text-[10px] opacity-60 uppercase tracking-tight">Navigation</div>
              </div>
            </button>
            
            <div className="pt-6 mt-6 border-t border-gray-800">
              <button 
                onClick={() => setShowLive(true)}
                className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
              >
                <Mic size={20} /> Voice Interaction
              </button>
            </div>
          </div>

          <div className="p-5 border-t border-gray-800 bg-[#0d1117]/50">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-black text-lg shadow-inner">
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-bold truncate text-white">{profile.name}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Atlas Member</p>
              </div>
              <Settings size={18} className="text-gray-500 cursor-pointer hover:text-white transition-colors" />
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative">
        <header className="h-16 border-b border-gray-800/50 flex items-center px-6 justify-between lg:justify-end bg-[#0b0e14]/80 backdrop-blur-md sticky top-0 z-10">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors">
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-3">
             <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Atlas Trial Engine</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-8 md:px-8">
          <div className="max-w-4xl mx-auto space-y-10">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-4 md:gap-6 ${msg.role === MessageRole.USER ? 'flex-row-reverse text-right' : 'flex-row text-left'}`}>
                <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg bg-[#161b22] border border-gray-800 overflow-hidden`}>
                  {msg.role === MessageRole.USER ? (
                    <div className="bg-blue-600 w-full h-full flex items-center justify-center text-white"><UserIcon size={20} /></div>
                  ) : (
                    <div className="bg-gray-900 w-full h-full flex items-center justify-center text-blue-400"><Bot size={22} /></div>
                  )}
                </div>
                
                <div className={`flex-1 space-y-4 max-w-[85%]`}>
                  <div className={`inline-block px-5 py-3.5 rounded-2xl shadow-sm leading-relaxed ${
                    msg.role === MessageRole.USER 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-[#161b22] border border-gray-800 rounded-tl-none text-gray-300'
                  }`}>
                    {msg.files && msg.files.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                        {msg.files.map((f, i) => (
                          <div key={i} className="rounded-xl overflow-hidden bg-black/40 ring-1 ring-white/10">
                             {f.mimeType.startsWith('image') ? <img src={f.url} className="w-full aspect-video object-cover" /> : null}
                          </div>
                        ))}
                      </div>
                    )}
                    <FormattedText text={msg.content} />
                    {msg.grounding && msg.grounding.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-2">
                        {msg.grounding.map((chunk, idx) => (
                          <a key={idx} href={chunk.web?.uri || chunk.maps?.uri} target="_blank" className="flex items-center gap-2 px-3 py-1 bg-black/30 border border-white/5 rounded-full text-[10px] text-blue-400 hover:text-blue-300">
                            <ExternalLink size={10} /> {chunk.web?.title || chunk.maps?.title || "Source"}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && <div className="text-gray-500 text-xs animate-pulse">Atlas is thinking...</div>}
            <div ref={chatEndRef} />
          </div>
        </div>

        <div className="p-4 md:p-6">
          <div className="max-w-4xl mx-auto relative">
            <div className="flex items-end gap-3 bg-[#1c2128] border border-gray-700/50 rounded-3xl p-3">
              <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
              <button onClick={() => fileInputRef.current?.click()} className="p-3 text-gray-400 hover:text-blue-400"><Plus size={24} /></button>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                placeholder="Message Atlas AI..."
                className="flex-1 bg-transparent border-none outline-none py-3 px-1 text-gray-100 placeholder-gray-500 resize-none"
                rows={1}
              />
              <button onClick={handleSendMessage} className="p-3.5 bg-blue-600 text-white rounded-2xl"><Send size={24} /></button>
            </div>
            <p className="mt-3 text-[9px] text-center text-gray-600 font-black uppercase tracking-[0.4em]">Designed by Fodil Zerrouali • Algeria 2025</p>
          </div>
        </div>
      </main>

      {showLive && <LiveView onClose={() => setShowLive(false)} />}
    </div>
  );
};

export default ChatInterface;
