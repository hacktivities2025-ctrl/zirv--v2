'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { fetchMountains, getUserProfile } from '@/lib/firebase-actions';
import type { Mountain } from '@/lib/definitions';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mountain as MountainIcon, Repeat, ArrowRight, Compass } from 'lucide-react';
import AppHeader from '@/components/app/app-header';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useReadingMode } from '@/components/app/reading-mode-provider';
import { cn } from '@/lib/utils';
import { useAnimation } from '@/components/app/animation-provider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { useFirestore } from '@/firebase';
import ParallaxBackground from '@/components/app/parallax-background';

function AvailableMountains({ mountains, loading, lang, onMountainClick }: { mountains: Mountain[], loading: boolean, lang: 'az' | 'en', onMountainClick: (href: string) => void }) {
  const { isReadingMode, speakText } = useReadingMode();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (mountains.length === 0) {
    return null; 
  }
  
  const t = {
      az: 'Mövcud Dağlar',
      en: 'Available Mountains',
  };

  const handleSpeak = (text: string) => {
    speakText(text, lang === 'az' ? 'tr-TR' : `${lang}-${lang.toUpperCase()}`);
  }

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    onMountainClick(href);
  };

  return (
    <div>
      <h2 className={cn("text-2xl font-bold mb-6 text-center text-white drop-shadow-lg", isReadingMode && 'cursor-pointer hover:bg-muted/50')} onMouseEnter={() => handleSpeak(t[lang])}>{t[lang]}</h2>
       <Carousel
        opts={{
          align: "start",
          loop: mountains.length > 3,
        }}
        className="w-full max-w-5xl mx-auto"
      >
        <CarouselContent>
          {mountains.map((mountain) => {
            const mountainName = (lang === 'en' && mountain.name_en) ? mountain.name_en : mountain.name;
            const href = `/${mountain.slug}`;
            return (
            <CarouselItem key={mountain.id} className="md:basis-1/2 lg:basis-1/3">
              <div className="p-1 h-full">
                <a href={href} onClick={(e) => handleClick(e, href)}>
                    <Card className="h-48 overflow-hidden relative group transition-transform duration-300 hover:-translate-y-1 hover:scale-[1.02]">
                        <Image
                            src={mountain.imageUrl}
                            alt={mountainName}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-2">
                            <h3 className="font-semibold text-center text-2xl text-white">{mountainName}</h3>
                        </div>
                    </Card>
                </a>
              </div>
            </CarouselItem>
          )})}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}

function TravelSection({ mountains, loading, lang, onMountainClick }: { mountains: Mountain[], loading: boolean, lang: 'az' | 'en', onMountainClick: (href: string) => void }) {
  const { isReadingMode, speakText } = useReadingMode();
  const [selectedMountain, setSelectedMountain] = useState<string | undefined>(undefined);
  const [error, setError] = useState('');

  const handleGo = () => {
    if (selectedMountain) {
      onMountainClick(`/${selectedMountain}`);
    } else {
      setError(t.error);
    }
  };

  const t = {
    az: {
        title: 'Zirvəyə Səyahətə Başla',
        placeholder: 'Fəth etmək istədiyiniz dağı seçin...',
        go: 'Get',
        error: 'Zəhmət olmasa, getmək istədiyiniz dağı seçin.',
        no_mountains_title: 'Hələ Heç Bir Dağ Əlavə Edilməyib',
        no_mountains_desc: 'Səyahət məlumatlarını görmək üçün admin panelindən yeni bir dağ əlavə edin.'
    },
    en: {
        title: 'Start Your Summit Journey',
        placeholder: 'Select a mountain to conquer...',
        go: 'Go',
        error: 'Please select a mountain you want to visit.',
        no_mountains_title: 'No Mountains Added Yet',
        no_mountains_desc: 'Add a new mountain from the admin panel to see travel information.'
    }
  }[lang];

  const handleSpeak = (text: string) => {
    speakText(text, lang === 'az' ? 'tr-TR' : `${lang}-${lang.toUpperCase()}`);
  }

  if (loading) {
    return (
      <Card className="p-8 bg-card/80 backdrop-blur-sm border-border/50">
        <Skeleton className="w-1/2 h-8 mx-auto mb-4" />
        <Skeleton className="w-full h-10" />
      </Card>
    );
  }

  if (mountains.length === 0) {
    return (
      <Card className="p-8 text-center bg-card/80 backdrop-blur-sm border-border/50" onMouseEnter={() => handleSpeak(`${t.no_mountains_title}. ${t.no_mountains_desc}`)}>
          <Compass className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-bold">{t.no_mountains_title}</h3>
          <p className="text-muted-foreground mt-2">{t.no_mountains_desc}</p>
      </Card>
    );
  }

  return (
    <Card className="p-8 bg-card/80 backdrop-blur-sm border-border/50">
        <div className="flex items-center gap-4 mb-4" onMouseEnter={() => handleSpeak(t.title)}>
             <MountainIcon className="h-8 w-8 text-primary" />
             <h3 className={cn("text-2xl font-bold", isReadingMode && 'cursor-pointer')}>{t.title}</h3>
        </div>
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Select value={selectedMountain} onValueChange={setSelectedMountain}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {mountains.map((mountain) => {
              const mountainName = (lang === 'en' && mountain.name_en) ? mountain.name_en : mountain.name;
              return (
              <SelectItem key={mountain.id} value={mountain.slug}>
                {mountainName}
              </SelectItem>
            )})}
          </SelectContent>
        </Select>
        <Button onClick={handleGo} className="w-full sm:w-auto">
          {t.go} <ArrowRight className="ml-2" />
        </Button>
      </div>
      {error && <p className="text-destructive text-sm mt-2 text-center">{error}</p>}
    </Card>
  );
}

function CurrencyConverter({ lang }: { lang: 'az' | 'en' }) {
  const [amount, setAmount] = useState('100');
  const [fromCurrency, setFromCurrency] = useState('AZN');
  const [toCurrency, setToCurrency] = useState('USD');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rates: { [key: string]: number } = {
      USD: 0.59, TRY: 19.53, RUB: 54.28, AED: 2.16, GEL: 1.67, EUR: 0.55, GBP: 0.46, JPY: 92.89, CHF: 0.53,
      INR: 49.20, CNY: 4.29, CAD: 0.81, AUD: 0.89, BRL: 3.04, MXN: 10.91, NZD: 0.96, YER: 147.59, EGP: 28.01,
      SGD: 0.80, ZAR: 10.72, PKR: 164.44, KRW: 781.38, THB: 21.60, SAR: 2.21, QAR: 2.15, KWD: 0.18, IDR: 9259.40,
      BDT: 69.66, NOK: 6.16, SEK: 6.22, DKK: 4.11, VND: 14908.81, OMR: 0.23, JOD: 0.42, BHD: 0.22, NPR: 78.55,
      LAK: 12947.06, MMK: 1238.65, IQD: 771.59, LYD: 2.89, SDG: 350.82, AFN: 42.29, ALL: 54.60, AMD: 229.08,
      AOA: 499.41, ARS: 521.03, AWG: 1.06, AZN: 1.0
  };
  
   const t = {
        az: { title: 'Valyuta Konvertoru', amount: 'Məbləğ', from: 'Hansı valyutadan', to: 'Hansı valyutaya', negative_error: 'Mənfi dəyər çevirmək olmaz.' },
        en: { title: 'Currency Converter', amount: 'Amount', from: 'From', to: 'To', negative_error: 'Cannot convert a negative value.' },
    }[lang];
  
  const handleConversion = useCallback(() => {
    const numericAmount = parseFloat(amount);
    
    if (isNaN(numericAmount)) {
        setError(null);
        setResult(null);
        return;
    }
    
    if (numericAmount < 0) {
        setError(t.negative_error);
        setResult(null);
        return;
    }
    
    setError(null);
    const fromRate = rates[fromCurrency];
    const toRate = rates[toCurrency];

    if (fromRate && toRate) {
        const amountInAzn = numericAmount / fromRate;
        const convertedAmount = amountInAzn * toRate;
        setResult(`${numericAmount.toFixed(2)} ${fromCurrency} = ${convertedAmount.toFixed(2)} ${toCurrency}`);
    } else {
        setResult(null);
    }
  }, [amount, fromCurrency, toCurrency, rates, t.negative_error]);

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };
  
  useEffect(() => {
    handleConversion();
  }, [handleConversion]);

  const currencyOptions = Object.keys(rates).sort().map(currency => (
    <SelectItem key={currency} value={currency}>{currency}</SelectItem>
  ));
  

  return (
    <Card className="p-8 bg-card/80 backdrop-blur-sm border-border/50">
      <h3 className="mb-4 text-2xl font-bold text-center">{t.title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center relative">
        <div>
          <label className="text-sm text-muted-foreground">{t.amount}</label>
          <Input 
            placeholder={t.amount}
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">{t.from}</label>
              <Select value={fromCurrency} onValueChange={setFromCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{currencyOptions}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">{t.to}</label>
              <Select value={toCurrency} onValueChange={setToCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{currencyOptions}</SelectContent>
              </Select>
            </div>
        </div>
         <Button variant="ghost" size="icon" onClick={swapCurrencies} className="absolute left-1/2 -translate-x-1/2 bottom-[-20px] md:bottom-auto md:top-full bg-background rounded-full border">
            <Repeat className="h-4 w-4" />
        </Button>
      </div>
       {error && <p className="text-destructive text-sm mt-8 text-center font-semibold">{error}</p>}
      {result && !error && (
        <div className="mt-8 text-center text-2xl font-bold text-primary">
            {result}
        </div>
      )}
    </Card>
  );
}

export default function HomePage() {
  const [mountains, setMountains] = useState<Mountain[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [lang, setLang] = useState<'az' | 'en'>('az');
  const router = useRouter();
  const { isReadingMode, speakText } = useReadingMode();
  const { triggerAnimation } = useAnimation();
  const firestore = useFirestore();

  useEffect(() => {
    const savedLang = localStorage.getItem('app-lang') as 'az' | 'en' | null;
    if (savedLang) {
      setLang(savedLang);
    }
  }, []);

  const handleSetLang = (newLang: 'az' | 'en') => {
    setLang(newLang);
    localStorage.setItem('app-lang', newLang);
  };
  
  useEffect(() => {
    if (!firestore) return;
    async function getMountains() {
      setLoading(true);
      try {
        const mountainList = await fetchMountains(firestore);
        setMountains(mountainList);
      } catch (error) {
        console.error("Failed to fetch mountains:", error);
        toast({
          variant: "destructive",
          title: "Error fetching mountains",
          description: "Could not load the list of mountains.",
        });
      } finally {
        setLoading(false);
      }
    }
    getMountains();
  }, [firestore, toast]);
  
  const handleMountainClick = (href: string) => {
    triggerAnimation({ icon: MountainIcon, onAnimationEnd: () => router.push(href) });
  };

  const t = {
      az: { 
          title: 'Zirvələri Kəşf Edin', 
          subtitle: 'Dağ Bələdçisi ilə səyahət etdiyiniz dağlar haqqında hər şeyi bir yerdə tapın.',
      },
      en: { 
          title: 'Discover the Summits', 
          subtitle: 'Find everything about the mountains you travel to with the Mountain Guide, all in one place.',
       },
  }[lang];

  const handleSpeak = (text: string) => {
    speakText(text, lang === 'az' ? 'tr-TR' : `${lang}-${lang.toUpperCase()}`);
  }

  return (
    <>
      <ParallaxBackground />
      <AppHeader lang={lang} setLang={handleSetLang} />
      <main className="container relative z-10 mx-auto px-4 py-12 space-y-16">
        <div className={cn("text-center max-w-3xl mx-auto pt-16 pb-8", isReadingMode && 'cursor-pointer hover:bg-muted/50')} onMouseEnter={() => handleSpeak(`${t.title}. ${t.subtitle}`)}>
          <h1 className="text-5xl font-extrabold tracking-tight lg:text-7xl text-white drop-shadow-lg">
            {t.title}
          </h1>
          <p className="mt-4 text-xl text-white/90 drop-shadow-md">
            {t.subtitle}
          </p>
        </div>
        
        <AvailableMountains mountains={mountains} loading={loading} lang={lang} onMountainClick={handleMountainClick} />

        <TravelSection mountains={mountains} loading={loading} lang={lang} onMountainClick={handleMountainClick} />

        <CurrencyConverter lang={lang} />
      </main>
    </>
  );
}

