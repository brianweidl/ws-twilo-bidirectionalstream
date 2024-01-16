const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');

const inputMp3File = 'audio-samples/speech-5s.mp3';
const outputWavFile = 'output/speech-5s.wav';

const WaveFile = require('wavefile').WaveFile;

async function getWavFile(streamSid){
  console.log('Setting to wav with wavefile');
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      let wav = new WaveFile(fs.readFileSync('output/speech-5s.wav')); // Get audio file that was previously transformed from Mp3 (OpenAI)
      
      wav.toSampleRate(8000);
      wav.toMuLaw()
      
      fs.writeFileSync('output/format-twilio-audio.wav', wav.toBuffer()); // This sounds good

      console.log(Buffer.from(wav.data.samples));

      const audioPayloadWithoutHeaderBytes = Buffer.from(wav.data.samples).toString('base64'); // Remove header bytes from wav file and encode base64

      const mediaPayload = {
        "event": "media",
        "streamSid": streamSid,
        "media": {
          "payload": audioPayloadWithoutHeaderBytes,
        }
      } // This is what Twilio expects
    
      resolve(mediaPayload);
  
    }, 1000)
  })
}

async function convertToTwilioPayload(streamSid){
  console.log('Converting to wav with ffmpeg');
  ffmpeg()
        .input(inputMp3File)
        .audioCodec('pcm_s16le') // Set audio codec to PCM
        .audioChannels(1) // Set the number of audio channels (1 for mono). Must be mono for Twilio.
        .audioFrequency(44100) // Set audio frequency to 44.1kHz
        .on('end', () => {
          console.log('Conversion finished!');
        })
        .on('error', (err) => {
          console.error('Error:', err);
        })
        .save(outputWavFile);

        const mediaPayload = await getWavFile(streamSid);

        return mediaPayload;
}


const server = Bun.serve({
    fetch(req, server) {
      const success = server.upgrade(req);
      if (success) {
        return undefined;
      }
  
      return new Response("Hello Bun!");
    },
    websocket: {
      async message(ws, message) {
        console.log(`Received message`);
        const data = JSON.parse(message);
        
        
        if(data.event === 'media') return
        console.log(data);
        if(data.event === 'start'){
          const streamSid = data.start.streamSid;
          console.log(`Received start event with streamSid ${streamSid}`);

          const payload = await convertToTwilioPayload(streamSid)

          console.log(`Sending ${JSON.stringify(payload)}`);

          ws.send(JSON.stringify(payload));
        }

        await convertToTwilioPayload('')
            
      },
    },
  });
  
  console.log(`Listening on ${server.hostname}:${server.port}`);

  /* Twilio payload
  
Received {"event":"connected","protocol":"Call","version":"1.0.0"}

Received {"event":"start","sequenceNumber":"1","start":{"accountSid":"AC7e2b7d19e3afe0f5715710b94d26db7e","streamSid":"MZ5174584e1127285e2b015e720b3d9e68","callSid":"CA45397943c1c7a49f7b7713c230107a39","tracks":["inbound"],"mediaFormat":{"encoding":"audio/x-mulaw","sampleRate":8000,"channels":1},"customParameters":{}},"streamSid":"MZ5174584e1127285e2b015e720b3d9e68"}
  
Received {"event":"media","sequenceNumber":"2","media":{"track":"inbound","chunk":"1","timestamp":"155","payload":"f39///////9/f39/f3//f3///v///////////39/f3///3//f39/f////3//f3///////39/f39//39/f39/f39//3//f////////39/fn9/f/9/f39/f3//f39/f/9//////3///////////39/f/////9/////////////f39/f39//39//3///3//////f39/f39///9/f39//39/fw=="},"streamSid":"MZ5174584e1127285e2b015e720b3d9e68"}

Received {"event":"media","sequenceNumber":"74","media":{"track":"inbound","chunk":"73","timestamp":"1593","payload":"/39/f/9/f39//39///////9/////f39/f39/////f/9/f3//f39/f39/f/9//////39///9/f///f///f/9///9//////39/f3///3////////////9/f39/f/////9/f39/f39//39///////////9/f39/f39/f/9//39/f/////////9///////9/f39/f3//f///f/9/f39/f3//fw=="},"streamSid":"MZ5174584e1127285e2b015e720b3d9e68"}

Received {"event":"stop","sequenceNumber":"378","streamSid":"MZ5174584e1127285e2b015e720b3d9e68","stop":{"accountSid":"AC7e2b7d19e3afe0f5715710b94d26db7e","callSid":"CA45397943c1c7a49f7b7713c230107a39"}}

  */
  