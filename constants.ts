import { VoiceOption } from './types';

export const AVAILABLE_VOICES: VoiceOption[] = [
  { name: 'Puck', id: 'Puck', gender: 'Male', description: 'Voz masculina suave e clara' },
  { name: 'Charon', id: 'Charon', gender: 'Male', description: 'Voz masculina profunda e autoritária' },
  { name: 'Kore', id: 'Kore', gender: 'Female', description: 'Voz feminina calma e natural' },
  { name: 'Fenrir', id: 'Fenrir', gender: 'Male', description: 'Voz masculina energética' },
  { name: 'Zephyr', id: 'Zephyr', gender: 'Female', description: 'Voz feminina suave e aveludada' },
];

export const INITIAL_MULTI_SPEAKER_SCRIPT = `João: Olá Maria, você viu como a tecnologia de IA avançou?
Maria: Sim, João! É impressionante como podemos gerar vozes tão realistas agora.
João: Exatamente. Isso vai mudar a forma como criamos conteúdo.`;
