export interface VoiceOption {
  name: string;
  id: string;
  gender: 'Male' | 'Female';
  description: string;
}

export enum TTSMode {
  SINGLE = 'SINGLE',
  MULTI = 'MULTI'
}

export interface GeneratedAudioItem {
  id: string;
  text: string;
  timestamp: number;
  audioBuffer: AudioBuffer;
  duration: number;
  mode: TTSMode;
}

export interface MultiSpeakerConfig {
  speaker1Name: string;
  speaker1Voice: string;
  speaker2Name: string;
  speaker2Voice: string;
}