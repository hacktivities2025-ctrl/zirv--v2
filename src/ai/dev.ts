import { config } from 'dotenv';
config();

import '@/ai/flows/detect-input-language.ts';
import '@/ai/flows/provide-text-to-speech.ts';
import '@/ai/flows/detect-contextual-information.ts';
import '@/ai/flows/translate-input-text.ts';