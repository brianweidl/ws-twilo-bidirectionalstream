import { textToSpeechFilePath } from './tts';

const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');

const outputWavFilePath = 'output/speech-5s.wav';

const WaveFile = require('wavefile').WaveFile;

export function formatWavFile() {
  let wav = new WaveFile(fs.readFileSync(outputWavFilePath)); // Get audio file that was previously transformed from Mp3 (OpenAI)

  wav.toSampleRate(8000);
  wav.toMuLaw();

  fs.writeFileSync('output/format-twilio-audio.wav', wav.toBuffer());

  const audioPayloadWithoutHeaderBytes = Buffer.from(
    wav.data.samples,
  ).toString('base64'); // Remove header bytes from wav file and encode base64

  return audioPayloadWithoutHeaderBytes

};

export async function transformMp3ToBase64Wav() {
  return new Promise((resolve, reject) => {
    console.log('Converting to wav with ffmpeg');
    console.log(new Date());
    ffmpeg()
    .input(textToSpeechFilePath)
    .audioCodec('pcm_s16le') // Set audio codec to PCM
    .audioChannels(1) // Set the number of audio channels (1 for mono). Must be mono for Twilio.
    .audioFrequency(44100) // Set audio frequency to 44.1kHz
    .save(outputWavFilePath)
    .on('end', () => {
      console.log('Conversion to wav with ffmpeg finished');
      console.log(new Date());
      console.log('Formatting wav file');
      const audioPayload = formatWavFile();
      console.log('Finished formatting wav file');
      console.log(new Date());
      resolve(audioPayload)
    })
    .on('error', (err) => {
      console.error('Error:', err);
      reject(err)
    })
  })
}


export async function convertAudioFileToTwilioPayload(streamSid) {
  const base64Wav = await transformMp3ToBase64Wav();
  
  const mediaPayload = {
    event: 'media',
    streamSid: streamSid,
    media: {
      payload: base64Wav,
    },
  };

  return mediaPayload;
}