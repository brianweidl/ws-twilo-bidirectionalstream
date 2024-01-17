import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { config } from 'dotenv';
config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

export const textToSpeechFilePath = path.resolve('output/text-to-speech.mp3');

export async function createAudioFileFromText(textInput) {
  console.log('Sending OpenAI TTS request:');
  console.log(new Date());
  const mp3 = await openai.audio.speech.create({
    model: 'tts-1',
    voice: 'alloy',
    input: textInput,
  });

  const buffer = Buffer.from(await mp3.arrayBuffer());
  await fs.promises.writeFile(textToSpeechFilePath, buffer);
  console.log('TTS request completed:');
  console.log(new Date());
  return buffer;
}

export async function streamTTSAudio(textInput) {
  console.log('Sending OpenAI request...');
  console.log(new Date());
  const mp3 = await openai.audio.speech.create({
    model: 'tts-1',
    voice: 'alloy',
    input: textInput,
  });

  const stream = mp3.body;

  let bufferStore = Buffer.from([]);

  stream.on('data', (chunk) => {
    console.log('Received Chunk');
    console.log(new Date());
    bufferStore = Buffer.concat([bufferStore, chunk]);
  });
  stream.on('end', () => {
    console.log('Stream Ended');
    console.log(new Date());
    console.log(bufferStore);
  });
  stream.on('error', (e) => {
    console.error(e);
  });
}
