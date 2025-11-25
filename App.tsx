import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic2, Play, Square, Loader2, Sparkles, Users, User, Trash2, Volume2 } from 'lucide-react';
import { generateSingleSpeaker, generateMultiSpeaker, decodeAudioData } from './services/geminiService';
import AudioVisualizer from './components/AudioVisualizer';
import VoiceSelector from './components/VoiceSelector';
import { AVAILABLE_VOICES, INITIAL_MULTI_SPEAKER_SCRIPT } from './constants';
import { TTSMode, GeneratedAudioItem, MultiSpeakerConfig } from './types';

const App: React.FC = () => {
  // State
  const [mode, setMode] = useState<TTSMode>(TTSMode.SINGLE);
  const [text, setText] = useState<string>('Olá! Eu sou uma inteligência artificial capaz de transformar texto em fala realista.');
  const [selectedVoice, setSelectedVoice] = useState<string>(AVAILABLE_VOICES[2].id); // Default to Kore (Female)
  
  const [multiConfig, setMultiConfig] = useState<MultiSpeakerConfig>({
    speaker1Name: 'João',
    speaker1Voice: 'Puck',
    speaker2Name: 'Maria',
    speaker2Voice: 'Kore'
  });
  
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [generatedItems, setGeneratedItems] = useState<GeneratedAudioItem[]>([]);
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);

  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const startTimeRef = useRef<number>(0);

  // Initialize Audio Context on user interaction (to bypass browser autoplay policies)
  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.connect(audioContextRef.current.destination);
    } else if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  const handleStop = useCallback(() => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch (e) {
        // Ignore if already stopped
      }
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
    setActiveAudioId(null);
  }, []);

  const playAudio = async (id: string, buffer: AudioBuffer) => {
    initAudioContext();
    handleStop(); // Stop any currently playing

    if (!audioContextRef.current || !analyserRef.current) return;

    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(analyserRef.current);
    
    source.onended = () => {
      setIsPlaying(false);
      setActiveAudioId(null);
    };

    sourceNodeRef.current = source;
    source.start();
    startTimeRef.current = audioContextRef.current.currentTime;
    
    setIsPlaying(true);
    setActiveAudioId(id);
  };

  const handleGenerate = async () => {
    if (!text.trim()) return;
    
    setLoading(true);
    initAudioContext();

    try {
      let base64Audio = '';
      
      if (mode === TTSMode.SINGLE) {
        base64Audio = await generateSingleSpeaker(text, selectedVoice);
      } else {
        base64Audio = await generateMultiSpeaker(text, [
          { speaker: multiConfig.speaker1Name, voiceName: multiConfig.speaker1Voice },
          { speaker: multiConfig.speaker2Name, voiceName: multiConfig.speaker2Voice }
        ]);
      }

      if (!audioContextRef.current) throw new Error("Audio Context init failed");

      const audioBuffer = await decodeAudioData(base64Audio, audioContextRef.current);
      
      const newItem: GeneratedAudioItem = {
        id: Date.now().toString(),
        text: text.length > 60 ? text.substring(0, 60) + '...' : text,
        timestamp: Date.now(),
        audioBuffer,
        duration: audioBuffer.duration,
        mode
      };

      setGeneratedItems(prev => [newItem, ...prev]);
      
      // Auto-play the new item
      playAudio(newItem.id, audioBuffer);

    } catch (error) {
      console.error("Generation failed:", error);
      alert("Erro ao gerar áudio. Verifique sua chave de API e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeAudioId === id) handleStop();
    setGeneratedItems(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Mic2 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              VoxGen AI
            </h1>
          </div>
          <div className="text-xs font-mono text-slate-500 border border-slate-800 rounded px-2 py-1">
            gemini-2.5-flash-preview-tts
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        
        {/* Visualizer Section */}
        <section className="relative">
          <AudioVisualizer analyser={analyserRef.current} isPlaying={isPlaying} />
          {isPlaying && activeAudioId && (
             <div className="absolute top-4 right-4 bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold animate-pulse flex items-center gap-2 border border-red-500/30">
               <Volume2 className="w-3 h-3" /> Tocando
             </div>
          )}
        </section>

        {/* Controls Section */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          
          {/* Mode Switcher */}
          <div className="flex bg-slate-800 p-1 rounded-lg mb-6 w-fit">
            <button
              onClick={() => {
                setMode(TTSMode.SINGLE);
                setText('Olá! Eu sou uma inteligência artificial capaz de transformar texto em fala realista.');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === TTSMode.SINGLE ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <User className="w-4 h-4" /> Único Falante
            </button>
            <button
              onClick={() => {
                setMode(TTSMode.MULTI);
                setText(INITIAL_MULTI_SPEAKER_SCRIPT);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === TTSMode.MULTI ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Users className="w-4 h-4" /> Diálogo (Multi-Falante)
            </button>
          </div>

          <div className="space-y-6">
            {/* Voice Selection Logic */}
            {mode === TTSMode.SINGLE ? (
              <VoiceSelector 
                selectedVoice={selectedVoice} 
                onSelect={setSelectedVoice} 
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-800/50 rounded-xl border border-slate-800">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">Falante 1</h3>
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400">Nome (como aparece no texto)</label>
                    <input 
                      type="text" 
                      value={multiConfig.speaker1Name}
                      onChange={(e) => setMultiConfig(prev => ({ ...prev, speaker1Name: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400">Voz</label>
                    <select 
                      value={multiConfig.speaker1Voice}
                      onChange={(e) => setMultiConfig(prev => ({ ...prev, speaker1Voice: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      {AVAILABLE_VOICES.map(v => (
                        <option key={v.id} value={v.id}>{v.name} ({v.gender})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Falante 2</h3>
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400">Nome (como aparece no texto)</label>
                    <input 
                      type="text" 
                      value={multiConfig.speaker2Name}
                      onChange={(e) => setMultiConfig(prev => ({ ...prev, speaker2Name: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400">Voz</label>
                    <select 
                      value={multiConfig.speaker2Voice}
                      onChange={(e) => setMultiConfig(prev => ({ ...prev, speaker2Voice: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      {AVAILABLE_VOICES.map(v => (
                        <option key={v.id} value={v.id}>{v.name} ({v.gender})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Text Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex justify-between">
                <span>{mode === TTSMode.MULTI ? 'Roteiro do Diálogo' : 'Texto para Fala'}</span>
                <span className="text-xs text-slate-500">{text.length} caracteres</span>
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={mode === TTSMode.MULTI ? "João: Olá!\nMaria: Oi, tudo bem?" : "Digite algo para a IA falar..."}
                className="w-full h-32 bg-slate-950 border border-slate-700 rounded-xl p-4 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none font-sans leading-relaxed"
              />
              {mode === TTSMode.MULTI && (
                <p className="text-xs text-slate-500 italic">
                  Dica: Use o formato "Nome: Texto" para alternar entre os falantes definidos acima.
                </p>
              )}
            </div>

            {/* Action Button */}
            <button
              onClick={handleGenerate}
              disabled={loading || !text.trim()}
              className={`
                w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all
                ${loading 
                  ? 'bg-slate-700 cursor-not-allowed text-slate-400' 
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg hover:shadow-indigo-500/25 active:scale-[0.99]'
                }
              `}
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Gerando Áudio...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Gerar Fala Agora
                </>
              )}
            </button>
          </div>
        </section>

        {/* History / Results */}
        {generatedItems.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-300 px-1">Histórico de Gerações</h2>
            <div className="grid gap-3">
              {generatedItems.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => playAudio(item.id, item.audioBuffer)}
                  className={`
                    group flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all
                    ${activeAudioId === item.id 
                      ? 'bg-slate-800/80 border-indigo-500/50 ring-1 ring-indigo-500/50' 
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800'
                    }
                  `}
                >
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-colors
                    ${activeAudioId === item.id ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'}
                  `}>
                    {activeAudioId === item.id ? <Square className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 ml-1 fill-current" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-200 truncate pr-4">{item.text}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {item.mode === TTSMode.SINGLE ? 'Single' : 'Multi'}
                      </span>
                      <span className="text-xs text-slate-500">{item.duration.toFixed(1)}s</span>
                      <span className="text-xs text-slate-600">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => deleteItem(item.id, e)}
                    className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default App;