'use server';
/**
 * @fileOverview Text-to-speech flow for the Dilçi app.
 *
 * - provideTextToSpeech - A function that converts text to speech.
 * - ProvideTextToSpeechInput - The input type for the provideTextToSpeech function.
 * - ProvideTextToSpeechOutput - The return type for the provideTextToSpeech function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';

const ProvideTextToSpeechInputSchema = z.string().describe('The text to convert to speech.');
export type ProvideTextToSpeechInput = z.infer<typeof ProvideTextToSpeechInputSchema>;

const ProvideTextToSpeechOutputSchema = z.object({
  media: z.string().describe('The audio data as a data URI.'),
});
export type ProvideTextToSpeechOutput = z.infer<typeof ProvideTextToSpeechOutputSchema>;

export async function provideTextToSpeech(input: ProvideTextToSpeechInput): Promise<ProvideTextToSpeechOutput> {
  return provideTextToSpeechFlow(input);
}

const provideTextToSpeechFlow = ai.defineFlow(
  {
    name: 'provideTextToSpeechFlow',
    inputSchema: ProvideTextToSpeechInputSchema,
    outputSchema: ProvideTextToSpeechOutputSchema,
  },
  async (query) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' },
          },
        },
      },
      prompt: query,
    });
    if (!media) {
      throw new Error('no media returned');
    }
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    return {
      media: 'data:audio/wav;base64,' + (await toWav(audioBuffer)),
    };
  }
);

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs = [] as any[];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}
