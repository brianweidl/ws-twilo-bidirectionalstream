import { convertAudioFileToTwilioPayload } from "./process-audio";
import { createAudioFileFromText } from "./tts";

const exampleText =
  "Hello! I'm here to help you gather the details needed to build your business website. Let's start with the name of your website. Do you want the name of your website to be the same as your business? Or do you prefer some abbreviation?";

const server = Bun.serve({
  fetch(req, server) {
    const success = server.upgrade(req);
    if (success) {
      return undefined;
    }

    return new Response('Hello Bun!');
  },
  websocket: {
    async message(ws, message) {
      const data = JSON.parse(message);

      if (data.event === 'media') return;
      console.log(data);
      if (data.event === 'start') {
        console.log('Received start event');
        console.log(new Date());
        await createAudioFileFromText(exampleText);
        const streamSid = data.start.streamSid

        const payload = await convertAudioFileToTwilioPayload(streamSid);

        console.log(`Sending ${JSON.stringify(payload)}`);
        console.log(new Date());

        ws.send(JSON.stringify(payload));
      }
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
  