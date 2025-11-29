"use client";

import { useState, useTransition, MouseEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { translateInputText } from "@/ai/flows/translate-input-text";
import { provideTextToSpeech } from "@/ai/flows/provide-text-to-speech";
import { detectContextualInformation } from "@/ai/flows/detect-contextual-information";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Languages, Loader2, Volume2, Copy, ArrowRightLeft, RefreshCw, Info } from "lucide-react";

const languages = [
  "English", "Spanish", "French", "German", "Chinese (Simplified)", "Japanese", "Korean", "Russian", "Portuguese", "Italian", "Arabic", "Hindi", "Turkish", "Dutch", "Polish", "Indonesian", "Vietnamese"
];

const formSchema = z.object({
  text: z.string().min(1, { message: "Please enter some text to translate." }).max(5000, { message: "Text cannot be longer than 5000 characters." }),
});

type TranslationResult = {
  translatedText: string;
  detectedLanguage: string;
  originalText: string;
};

export default function DilciPage() {
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [targetLanguage, setTargetLanguage] = useState("English");

  const [isTranslating, startTranslation] = useTransition();
  const [isSpeaking, startSpeaking] = useTransition();
  const [isContextLoading, startContextLoading] = useTransition();

  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [contextualInfo, setContextualInfo] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    startTranslation(async () => {
      setResult(null);
      setAudioUrl(null);
      try {
        const translationResult = await translateInputText({
          text: values.text,
          targetLanguage,
        });
        setResult({ ...translationResult, originalText: values.text });
      } catch (error) {
        console.error("Translation failed:", error);
        toast({
          title: "Translation Error",
          description: "Could not translate the text. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  const handleSpeak = () => {
    if (!result?.translatedText) return;
    startSpeaking(async () => {
      try {
        const response = await provideTextToSpeech(result.translatedText);
        const audio = new Audio(response.media);
        audio.play();
        setAudioUrl(response.media);
      } catch (error) {
        console.error("TTS failed:", error);
        toast({
          title: "Audio Error",
          description: "Could not generate audio. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  const handleCopy = () => {
    if (!result?.translatedText) return;
    navigator.clipboard.writeText(result.translatedText);
    toast({
      title: "Copied to clipboard!",
    });
  };

  const handleWordClick = (word: string) => {
    const cleanedWord = word.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").trim();
    if (!cleanedWord || !result) return;
    
    setSelectedWord(cleanedWord);
    setContextualInfo(null);
    setIsSheetOpen(true);
    
    startContextLoading(async () => {
      try {
        const contextResult = await detectContextualInformation({
          text: result.originalText,
          word: cleanedWord,
          language: result.detectedLanguage,
        });
        setContextualInfo(contextResult.contextualInformation);
      } catch (error) {
        console.error("Context detection failed:", error);
        setContextualInfo("Could not retrieve contextual information for this word.");
      }
    });
  };

  const handleReset = () => {
    form.reset({ text: "" });
    setResult(null);
    setAudioUrl(null);
    setSelectedWord(null);
    setContextualInfo(null);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl mx-auto">
        <header className="text-center mb-8">
          <div className="inline-flex items-center gap-3">
            <Languages className="h-10 w-10 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold font-headline">Dilçi</h1>
          </div>
          <p className="text-muted-foreground mt-2 text-base md:text-lg">
            Your AI-powered translation companion
          </p>
        </header>

        <Card className="shadow-lg">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
                  
                  {/* Input Column */}
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-muted-foreground">
                        {result ? `Detected: ${result.detectedLanguage}` : "Enter Text"}
                      </h3>
                      {result && (
                        <Button variant="ghost" size="sm" onClick={handleReset} className="flex items-center gap-2">
                          <RefreshCw className="h-4 w-4" />
                          New Translation
                        </Button>
                      )}
                    </div>
                    {result ? (
                      <div className="prose prose-lg dark:prose-invert text-foreground border rounded-md p-4 min-h-[200px] bg-secondary/30">
                        {result.originalText.split(/(\s+)/).map((segment, index) =>
                          /\s+/.test(segment) ? (
                            <span key={index}>{segment}</span>
                          ) : (
                            <button type="button" key={index} onClick={() => handleWordClick(segment)} className="text-left cursor-pointer hover:bg-primary/20 p-0.5 rounded-sm transition-colors relative group">
                              {segment}
                              <Info className="h-3 w-3 absolute -top-1 -right-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          )
                        )}
                      </div>
                    ) : (
                      <FormField
                        control={form.control}
                        name="text"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                placeholder="Start typing here..."
                                className="min-h-[200px] text-lg resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  {/* Output Column */}
                  <div className="flex flex-col gap-4">
                    <Select onValueChange={setTargetLanguage} defaultValue={targetLanguage}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select target language" />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((lang) => (
                          <SelectItem key={lang} value={lang}>
                            {lang}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {isTranslating ? (
                       <div className="space-y-4 border rounded-md p-4 min-h-[200px]">
                        <Skeleton className="h-6 w-1/3" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-4/5" />
                        <div className="flex gap-2 pt-4">
                          <Skeleton className="h-10 w-10 rounded-md" />
                          <Skeleton className="h-10 w-10 rounded-md" />
                        </div>
                      </div>
                    ) : result ? (
                      <div className="border rounded-md p-4 min-h-[200px] flex flex-col justify-between bg-secondary/30">
                        <p className="prose prose-lg dark:prose-invert text-foreground">{result.translatedText}</p>
                        <div className="flex gap-2 pt-4">
                          <Button variant="outline" size="icon" onClick={handleSpeak} disabled={isSpeaking}>
                            {isSpeaking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Volume2 className="h-4 w-4" />}
                            <span className="sr-only">Pronounce</span>
                          </Button>
                          <Button variant="outline" size="icon" onClick={handleCopy}>
                            <Copy className="h-4 w-4" />
                            <span className="sr-only">Copy</span>
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center p-8 border-dashed border-2 rounded-lg bg-secondary/30">
                        <Languages className="h-12 w-12 mb-4" />
                        <p className="font-semibold">Your translation will appear here</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
              {!result && (
                <CardFooter className="flex justify-center">
                  <Button type="submit" size="lg" disabled={isTranslating}>
                    {isTranslating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Translating...
                      </>
                    ) : (
                      <>
                        <ArrowRightLeft className="mr-2 h-4 w-4" />
                        Translate
                      </>
                    )}
                  </Button>
                </CardFooter>
              )}
            </form>
          </Form>
        </Card>
      </div>
      
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Contextual Information</SheetTitle>
            <SheetDescription>
              Cultural and regional context for the word: <span className="font-bold text-primary">{selectedWord}</span>
            </SheetDescription>
          </SheetHeader>
          <div className="py-4">
            {isContextLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{contextualInfo}</p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
