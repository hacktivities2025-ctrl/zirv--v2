'use server';

/**
 * @fileOverview A translation AI agent.
 *
 * - translateInputText - A function that handles the translation process.
 * - TranslateInputTextOutput - The return type for the translateInputText function.
 * - TranslateInputText - The input type for the translateInputText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranslateInputTextSchema = z.object({
  text: z.string().describe('The text to translate.'),
  targetLanguage: z.string().default('English').describe('The target language for the translation.'),
});
export type TranslateInputText = z.infer<typeof TranslateInputTextSchema>;

const TranslateInputTextOutputSchema = z.object({
  translatedText: z.string().describe('The translated text.'),
  detectedLanguage: z.string().describe('The detected language of the input text.'),
});
export type TranslateInputTextOutput = z.infer<typeof TranslateInputTextOutputSchema>;

export async function translateInputText(input: TranslateInputText): Promise<TranslateInputTextOutput> {
  return translateInputTextFlow(input);
}

const translatePrompt = ai.definePrompt({
  name: 'translatePrompt',
  input: {schema: TranslateInputTextSchema},
  output: {schema: TranslateInputTextOutputSchema},
  prompt: `Translate the following text to {{targetLanguage}} and also detect the language of the original text.  Make sure to return the detected language in the "detectedLanguage" field and the translated text in the "translatedText" field.\n\nText: {{{text}}}`,
});

const translateInputTextFlow = ai.defineFlow(
  {
    name: 'translateInputTextFlow',
    inputSchema: TranslateInputTextSchema,
    outputSchema: TranslateInputTextOutputSchema,
  },
  async input => {
    const {output} = await translatePrompt(input);
    return output!;
  }
);
