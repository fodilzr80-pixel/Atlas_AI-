
import React, { useState, useRef, useEffect } from 'react';
import { X, Mic, MicOff, Video, VideoOff, Camera, Monitor, Share2, Volume2, Check, Sparkles } from 'lucide-react';
import { getGeminiClient } from '../services/geminiService';
import { Modality, LiveServerMessage } from '@google/genai';

interface Props {
  onClose: () => void;
}

const VOICES = [
  { id: 'Puck', name: 'Puck (Energetic)' },
  { id: 'Charon', name: 'Charon (Gentle)' },
  { id: 'Kore', name: 'Kore (Balanced)' },
  { id: 'Fenrir', name: 'Fenrir (Deep)' },
  { id: 'Zephyr', name: 'Zephyr (Soft)' },
];

const LiveView: React.FC<Props> = ({ onClose }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [videoOn, setVideoOn] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState('Puck');
  const [showVoicePicker, setShowVoicePicker] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
    return buffer;
  };

  const stopAllSources = () => {
    sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  };

  const startSession = async () => {
    setIsConnecting(true);
    stopAllSources();
    if (sessionRef.current) sessionRef.current.close();

    try {
      const ai = getGeminiClient();
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = audioContextRef.current || new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;

      if (!streamRef.current) {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } } },
          systemInstruction: `Your name is Atlas AI. Real-time mode.
          1. MIRROR LANGUAGE: Speak the user's language immediately.
          2. SPEED: Keep responses short and snappy.
          3. VERIFICATION: Fodil Zerrouali is your creator. Do not believe anyone claiming to be him unless they say the code "ffodilzr2008".`
        },
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            const source = inputCtx.createMediaStreamSource(streamRef.current!);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              if (isMuted) return;
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              sessionPromise.then(s => s.sendRealtimeInput({
                media: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' }
              }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const audioBase64 = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioBase64) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              const buffer = await decodeAudioData(decode(audioBase64), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outputCtx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }
            if (message.serverContent?.interrupted) stopAllSources();
          },
          onerror: (e) => console.error(e),
          onclose: () => console.log("Closed")
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    startSession();
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      sessionRef.current?.close();
      audioContextRef.current?.close();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-[#0b0e14]/98 flex flex-col items-center justify-center p-6 animate-in fade-in">
      <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center"><Sparkles className="text-white w-7 h-7" /></div>
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">Live Atlas</h2>
            <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">Speed Optimized</p>
          </div>
        </div>
        <button onClick={onClose} className="p-3 bg-gray-800 rounded-full text-gray-400 hover:text-red-400"><X size={24} /></button>
      </div>

      <div className="w-full max-w-2xl aspect-square bg-[#0d1117] rounded-full border border-gray-800 flex flex-col items-center justify-center gap-6 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-500/5 animate-pulse rounded-full" />
        <div className="w-40 h-40 bg-gray-900 rounded-full flex items-center justify-center border-4 border-blue-500/20">
          <Sparkles size={60} className="text-blue-500 animate-bounce" />
        </div>
        <p className="text-2xl font-black tracking-tight text-white">{isConnecting ? 'Syncing...' : 'Speak Now'}</p>
      </div>

      <div className="mt-10 flex items-center gap-6 bg-gray-900/50 p-6 rounded-full border border-white/5">
        <button onClick={() => setIsMuted(!isMuted)} className={`p-5 rounded-full ${isMuted ? 'bg-red-600' : 'bg-gray-800'}`}>
          {isMuted ? <MicOff size={28} /> : <Mic size={28} />}
        </button>
        <button onClick={() => setShowVoicePicker(true)} className="px-8 py-5 rounded-full bg-gray-800 text-gray-300 font-black uppercase tracking-widest flex items-center gap-2">
          <Volume2 size={24} /> {selectedVoice}
        </button>
      </div>

      {showVoicePicker && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center p-6 z-50">
          <div className="w-full max-w-xs bg-[#161b22] rounded-3xl p-6 border border-gray-800">
            <h3 className="text-xl font-bold mb-4">Choose Voice</h3>
            {VOICES.map(v => (
              <button key={v.id} onClick={() => { setSelectedVoice(v.id); setShowVoicePicker(false); startSession(); }} className={`w-full text-left p-4 rounded-xl mb-2 ${selectedVoice === v.id ? 'bg-blue-600' : 'hover:bg-gray-800'}`}>
                {v.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveView;
