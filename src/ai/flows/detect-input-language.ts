'use server';

/**
 * @fileOverview A flow to detect the language of the input text.
 *
 * - detectInputLanguage - A function that detects the language of the input text.
 * - DetectInputLanguageInput - The input type for the detectInputLanguage function.
 * - DetectInputLanguageOutput - The return type for the detectInputLanguage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectInputLanguageInputSchema = z.object({
  text: z.string().describe('The text to detect the language of.'),
});
export type DetectInputLanguageInput = z.infer<typeof DetectInputLanguageInputSchema>;

const DetectInputLanguageOutputSchema = z.object({
  language: z.string().describe('The detected language of the text.'),
});
export type DetectInputLanguageOutput = z.infer<typeof DetectInputLanguageOutputSchema>;

export async function detectInputLanguage(input: DetectInputLanguageInput): Promise<DetectInputLanguageOutput> {
  return detectInputLanguageFlow(input);
}

const detectInputLanguagePrompt = ai.definePrompt({
  name: 'detectInputLanguagePrompt',
  input: {schema: DetectInputLanguageInputSchema},
  output: {schema: DetectInputLanguageOutputSchema},
  prompt: `What language is the following text in? Return just the language name.

Text: {{{text}}}`,
});

const detectInputLanguageFlow = ai.defineFlow(
  {
    name: 'detectInputLanguageFlow',
    inputSchema: DetectInputLanguageInputSchema,
    outputSchema: DetectInputLanguageOutputSchema,
  },
  async input => {
    const {output} = await detectInputLanguagePrompt(input);
    return output!;
  }
);
