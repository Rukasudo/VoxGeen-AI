import React from 'react';
import { AVAILABLE_VOICES } from '../constants';

interface VoiceSelectorProps {
  selectedVoice: string;
  onSelect: (voiceId: string) => void;
  label?: string;
}

const VoiceSelector: React.FC<VoiceSelectorProps> = ({ selectedVoice, onSelect, label = "Escolha a Voz" }) => {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-slate-300">{label}</label>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {AVAILABLE_VOICES.map((voice) => (
          <button
            key={voice.id}
            onClick={() => onSelect(voice.id)}
            className={`
              relative p-3 rounded-lg border text-left transition-all duration-200
              ${selectedVoice === voice.id 
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-750'
              }
            `}
          >
            <div className="font-semibold text-sm">{voice.name}</div>
            <div className="text-xs opacity-80 mt-1">{voice.gender}</div>
            <div className={`text-[10px] mt-2 leading-tight ${selectedVoice === voice.id ? 'text-indigo-100' : 'text-slate-500'}`}>
              {voice.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default VoiceSelector;