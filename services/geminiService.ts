import { GoogleGenAI, Modality } from "@google/genai";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to decode Base64 to Uint8Array
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper to decode PCM data into an AudioBuffer
export async function decodeAudioData(
  base64String: string,
  ctx: AudioContext
): Promise<AudioBuffer> {
  const pcmData = decode(base64String);
  
  // Gemini 2.5 Flash TTS typically returns 24kHz audio
  // However, the docs example uses 24000 explicitly.
  const sampleRate = 24000; 
  const numChannels = 1;
  
  const dataInt16 = new Int16Array(pcmData.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Normalize Int16 to Float32 [-1.0, 1.0]
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export async function generateSingleSpeaker(
  text: string,
  voiceName: string
): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  
  if (!base64Audio) {
    throw new Error("No audio data returned from Gemini API");
  }

  return base64Audio;
}

export async function generateMultiSpeaker(
  text: string,
  speakerConfigs: { speaker: string; voiceName: string }[]
): Promise<string> {
  // Map our simple config to the API's expected format
  const speakerVoiceConfigs = speakerConfigs.map(config => ({
    speaker: config.speaker,
    voiceConfig: {
      prebuiltVoiceConfig: { voiceName: config.voiceName }
    }
  }));

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs,
        }
      }
    }
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  
  if (!base64Audio) {
    throw new Error("No audio data returned from Gemini API");
  }

  return base64Audio;
}