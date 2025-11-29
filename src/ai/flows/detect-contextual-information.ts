'use server';
/**
 * @fileOverview This file defines a Genkit flow for detecting and providing region-specific contextual information related to a word from the original text.
 *
 * - detectContextualInformation - A function that triggers the flow.
 * - DetectContextualInformationInput - The input type for the detectContextualInformation function.
 * - DetectContextualInformationOutput - The return type for the detectContextualInformation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectContextualInformationInputSchema = z.object({
  text: z
    .string()
    .describe('The original text from which a word will be selected.'),
  word: z
    .string()
    .describe('The word from the original text to analyze for contextual information.'),
  language: z.string().describe('The language of the original text.'),
});
export type DetectContextualInformationInput = z.infer<
  typeof DetectContextualInformationInputSchema
>;

const DetectContextualInformationOutputSchema = z.object({
  contextualInformation: z
    .string()
    .describe(
      'Region-specific contextual information related to the word, including cultural significance, historical context, or regional nuances.'
    ),
});
export type DetectContextualInformationOutput = z.infer<
  typeof DetectContextualInformationOutputSchema
>;

export async function detectContextualInformation(
  input: DetectContextualInformationInput
): Promise<DetectContextualInformationOutput> {
  return detectContextualInformationFlow(input);
}

const detectContextualInformationPrompt = ai.definePrompt({
  name: 'detectContextualInformationPrompt',
  input: {schema: DetectContextualInformationInputSchema},
  output: {schema: DetectContextualInformationOutputSchema},
  prompt: `You are an AI expert in regional dialects and cultural contexts.

  Given the original text, the specific word, and the language, provide detailed region-specific contextual information about the word.
  Consider cultural significance, historical context, and regional nuances.

  Original Text: {{{text}}}
  Word: {{{word}}}
  Language: {{{language}}}
  Contextual Information:`,
});

const detectContextualInformationFlow = ai.defineFlow(
  {
    name: 'detectContextualInformationFlow',
    inputSchema: DetectContextualInformationInputSchema,
    outputSchema: DetectContextualInformationOutputSchema,
  },
  async input => {
    const {output} = await detectContextualInformationPrompt(input);
    return output!;
  }
);
