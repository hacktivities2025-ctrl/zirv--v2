'use client';


import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getMountainData, getItemsForMountain } from '@/lib/firebase-actions';
import type { Mountain, InfoItem } from '@/lib/definitions';
import { CATEGORIES } from '@/lib/constants';
import AppHeader from '@/components/app/app-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ChevronRight, PlayCircle, Clock, Tag, Ticket, MountainIcon, Thermometer, Shield, Calendar, Map, Check } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore, useUser } from '@/firebase';
import type { LucideIcon } from 'lucide-react';
import { useAnimation } from '@/components/app/animation-provider';
import { useReadingMode } from '@/components/app/reading-mode-provider';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export default function MountainPage() {
  const params = useParams();
  const router = useRouter();
  const mountainSlug = Array.isArray(params.country) ? params.country[0] : params.country;
  const firestore = useFirestore();
  const { triggerAnimation } = useAnimation();
  const { isReadingMode, speakText } = useReadingMode();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  
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
        console.error("Failed to load tour data:", error);
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
        az: { 
            discover: 'Kəşf edin', 
            all_tours: 'Bütün Turlar', 
            not_found: 'Tur tapılmadı.',
            duration: 'Müddət',
            hours: 'saat',
            price: 'Qiymət',
            reserve_tour: 'Tura Rezervasiya Et',
            tour_details: 'Tur Detalları',
            height: 'Hündürlük',
            meters: 'm',
            difficulty: 'Çətinlik',
            best_season: 'Ən Yaxşı Mövsüm',
            temperature: 'Temperatur',
            has_coupon: 'Kupon Mövcuddur',
            location: 'Məkan (Xəritədə)',
            login_required: 'Rezervasiya etmək üçün daxil olmalısınız.',
        },
        en: { 
            discover: 'Discover', 
            all_tours: 'All Tours', 
            not_found: 'Tour not found.',
            duration: 'Duration',
            hours: 'hours',
            price: 'Price',
            reserve_tour: 'Reserve Tour',
            tour_details: 'Tour Details',
            height: 'Height',
            meters: 'm',
            difficulty: 'Difficulty',
            best_season: 'Best Season',
            temperature: 'Temperature',
            has_coupon: 'Coupon Available',
            location: 'Location (on Map)',
            login_required: 'You must be logged in to make a reservation.',
        },
    }[pageLang];

  const handleCategoryClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string, Icon: LucideIcon) => {
    e.preventDefault();
    triggerAnimation({ icon: Icon });
    router.push(href);
  };

  const handleSpeak = (text: string | undefined) => {
    if (text) speakText(text, pageLang === 'az' ? 'tr-TR' : `${lang}-${lang.toUpperCase()}`);
  }
  
  const handleReservationClick = () => {
    if (!user) {
        toast({
            variant: 'destructive',
            title: 'Giriş tələb olunur',
            description: t.login_required,
        });
        router.push('/login');
        return;
    }
    if (mountain) {
        router.push(`/reserve/${mountain.id}?type=tour`);
    }
  };

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
          <Card className="shadow-lg">
            <CardHeader>
                <div onMouseEnter={() => handleSpeak(`${mountainName}`)}>
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl font-headline text-primary">{mountainName}</h1>
                </div>
            </CardHeader>
            <CardContent>
                <p className={cn("text-lg text-muted-foreground mb-6", isReadingMode && 'cursor-pointer hover:bg-muted/50')} onMouseEnter={() => handleSpeak(mountainDescription)}>
                    {mountainDescription}
                </p>

                <div className="flex flex-wrap gap-4 items-center mb-6">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                        <Tag className="h-5 w-5 text-primary"/>
                        <span>{t.price}: {mountain.price} AZN</span>
                    </div>
                    {mountain.durationHours && (
                        <div className="flex items-center gap-2 text-lg font-semibold">
                            <Clock className="h-5 w-5 text-primary"/>
                            <span>{t.duration}: {mountain.durationHours} {t.hours}</span>
                        </div>
                    )}
                </div>
                 <Button onClick={handleReservationClick} size="lg" className="w-full sm:w-auto" disabled={isUserLoading}>
                    <Ticket className="mr-2"/>
                    {t.reserve_tour}
                </Button>
            </CardContent>
          </Card>
        </div>
        
        <div className="container mx-auto px-4 md:px-6 py-12">
             <div className="grid md:grid-cols-2 gap-8">
                 <div>
                    <h2 className={cn("text-2xl font-bold mb-6", isReadingMode && 'cursor-pointer hover:bg-muted/50')} onMouseEnter={() => handleSpeak(t.tour_details)}>{t.tour_details}</h2>
                     <Card>
                        <CardContent className="p-6 space-y-4">
                            {mountain.height && <div className="flex items-center"><MountainIcon className="mr-3 h-5 w-5 text-muted-foreground"/><strong>{t.height}:</strong><span className="ml-2">{mountain.height} {t.meters}</span></div>}
                            {mountain.difficulty && <div className="flex items-center"><Shield className="mr-3 h-5 w-5 text-muted-foreground"/><strong>{t.difficulty}:</strong><span className="ml-2">{mountain.difficulty}</span></div>}
                            {mountain.bestSeason && <div className="flex items-center"><Calendar className="mr-3 h-5 w-5 text-muted-foreground"/><strong>{t.best_season}:</strong><span className="ml-2">{mountain.bestSeason}</span></div>}
                            {mountain.temperature && <div className="flex items-center"><Thermometer className="mr-3 h-5 w-5 text-muted-foreground"/><strong>{t.temperature}:</strong><span className="ml-2">{mountain.temperature}</span></div>}
                            {mountain.hasCoupon && <div className="flex items-center"><Check className="mr-3 h-5 w-5 text-green-500"/><strong>{t.has_coupon}</strong></div>}
                             {(mountain.latitude && mountain.longitude) && 
                                <a href={`https://www.google.com/maps?q=${mountain.latitude},${mountain.longitude}`} target="_blank" rel="noopener noreferrer" className="flex items-center text-primary hover:underline">
                                    <Map className="mr-3 h-5 w-5"/><strong>{t.location}</strong>
                                </a>
                            }
                        </CardContent>
                     </Card>
                 </div>
                 <div>
                    <h2 className={cn("text-2xl font-bold mb-6", isReadingMode && 'cursor-pointer hover:bg-muted/50')} onMouseEnter={() => handleSpeak(t.discover)}>{t.discover}</h2>
                    <div className="grid gap-4">
                        {availableCategories.length > 0 ? availableCategories.map(category => {
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
                        }) : <p className='text-muted-foreground'>Bu tur üçün əlavə məlumat yoxdur.</p>}
                    </div>
                </div>
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
                {t.all_tours}
            </Link>
        </div>
      </div>
      {renderContent()}
    </>
  );
}
