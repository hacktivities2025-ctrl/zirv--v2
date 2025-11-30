'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getMountainData, getItemsForMountain } from '@/lib/firebase-actions';
import type { Mountain, InfoItem } from '@/lib/definitions';
import { CATEGORIES } from '@/lib/constants';
import AppHeader from '@/components/app/app-header';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ChevronRight, PlayCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore } from '@/firebase';
import type { LucideIcon } from 'lucide-react';
import { useAnimation } from '@/components/app/animation-provider';
import { useReadingMode } from '@/components/app/reading-mode-provider';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function MountainPage() {
  const params = useParams();
  const router = useRouter();
  const mountainSlug = Array.isArray(params.country) ? params.country[0] : params.country;
  const firestore = useFirestore();
  const { triggerAnimation } = useAnimation();
  const { isReadingMode, speakText } = useReadingMode();
  
  const [mountain, setMountain] = useState<Mountain | null>(null);
  const [items, setItems] = useState<InfoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<'az' | 'en'>('az');
  
  useEffect(() => {
    const savedLang = localStorage.getItem('app-lang') as 'az' | 'en';
    if (savedLang) {
      setLang(savedLang);
    }
  }, []);

  const handleSetLang = (newLang: 'az' | 'en') => {
    setLang(newLang);
    localStorage.setItem('app-lang', newLang);
  };

  const pageLang = lang;

  useEffect(() => {
    if (!mountainSlug || !firestore) return;

    async function loadData() {
      setLoading(true);
      try {
        const mountainData = await getMountainData(firestore, mountainSlug);
        setMountain(mountainData);

        if (mountainData) {
            const itemsData = await getItemsForMountain(firestore, mountainSlug);
            setItems(itemsData);
        }

      } catch (error) {
        console.error("Failed to load mountain data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [mountainSlug, firestore]);
  
  const availableCategories = CATEGORIES.filter(cat => 
    items.some(item => item.category === cat.id)
  );
  
  const mountainName = (lang === 'en' && mountain?.name_en) ? mountain.name_en : mountain?.name;
  const mountainDescription = (lang === 'en' && mountain?.description_en) ? mountain.description_en : mountain?.description;


    const t = {
        az: { discover: 'Kəşf edin', all_mountains: 'Bütün dağlar', not_found: 'Dağ tapılmadı.' },
        en: { discover: 'Discover', all_mountains: 'All Mountains', not_found: 'Mountain not found.' },
    }[pageLang];

  const handleCategoryClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string, Icon: LucideIcon) => {
    e.preventDefault();
    triggerAnimation({ icon: Icon });
    router.push(href);
  };

  const handleSpeak = (text: string | undefined) => {
    if (text) speakText(text, pageLang === 'az' ? 'tr-TR' : `${lang}-${lang.toUpperCase()}`);
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-8">
          <Skeleton className="h-96 w-full rounded-lg" />
          <div className="container mx-auto px-4 md:px-6 -mt-24 relative z-10 space-y-4">
            <Skeleton className="h-12 w-1/2" />
            <Skeleton className="h-24 w-full" />
          </div>
          <div className="container mx-auto px-4 md:px-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
             {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
        </div>
      );
    }

    if (!mountain) {
      return <div className="text-center py-20">{t.not_found}</div>;
    }

    return (
      <div>
        <div className="relative h-96 w-full">
          <Image src={mountain.imageUrl} alt={mountainName || ''} fill objectFit="cover" className="brightness-75" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
        <div className="container mx-auto px-4 md:px-6 -mt-24 relative z-10">
          <Card className={cn("p-6 shadow-lg", isReadingMode && 'cursor-pointer hover:bg-muted/50')} onMouseEnter={() => handleSpeak(`${mountainName}. ${mountainDescription}`)}>
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl font-headline text-primary">{mountainName}</h1>
            <p className="mt-4 text-lg text-muted-foreground">{mountainDescription}</p>
          </Card>
        </div>

        <div className="container mx-auto px-4 md:px-6 py-12">
            <h2 className={cn("text-2xl font-bold mb-6", isReadingMode && 'cursor-pointer hover:bg-muted/50')} onMouseEnter={() => handleSpeak(t.discover)}>{t.discover}</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {availableCategories.map(category => {
                    const CategoryIcon = category.icon;
                    const categoryName = pageLang === 'en' ? category.name : category.name_az;
                    const href = `/${mountain.slug}/${category.id}`;
                    return (
                        <a key={category.id} href={href} onClick={(e) => handleCategoryClick(e, href, CategoryIcon)}>
                            <Card className={cn("p-4 hover:bg-muted transition-all duration-300 group hover:-translate-y-1", isReadingMode && 'cursor-pointer')} onMouseEnter={() => handleSpeak(categoryName)}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <CategoryIcon className="h-8 w-8 text-primary" />
                                        <h3 className="text-lg font-semibold">{categoryName}</h3>
                                    </div>
                                    <ChevronRight className="h-6 w-6 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                </div>
                            </Card>
                        </a>
                    )
                })}
            </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <AppHeader lang={lang} setLang={handleSetLang} />
      <div className="mb-8">
        <div className="container mx-auto px-4 md:px-6 pt-6">
            <Link href="/home" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t.all_mountains}
            </Link>
        </div>
      </div>
      {renderContent()}
    </>
  );
}
