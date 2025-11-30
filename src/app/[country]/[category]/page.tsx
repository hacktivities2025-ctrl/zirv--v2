'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getMountainData, getInfoItems } from '@/lib/firebase-actions';
import type { Mountain, InfoItem, InfoCategory } from '@/lib/definitions';
import { CATEGORIES } from '@/lib/constants';
import AppHeader from '@/components/app/app-header';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, MapPin, Phone, Star, Ticket } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useFirestore, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useReadingMode } from '@/components/app/reading-mode-provider';
import { cn } from '@/lib/utils';

type Lang = 'az' | 'en';

const t = (lang: Lang) => ({
    az: {
        location: 'Konum',
        nearby: 'Yaxınlıqdakı Restoran',
        showMenu: 'Menyunu göstər',
        reserve: 'Rezervasiya et',
        entranceFee: 'Giriş Ödənişi:',
        ingredients: 'Tərkibi:',
        menu: 'Menyu',
        back: 'Geri',
        noInfo: 'Məlumat Tapılmadı',
        noInfoDesc: 'Bu kateqoriya üçün hələ heç bir məlumat əlavə edilməyib.',
        login_required: 'Rezervasiya etmək üçün daxil olmalısınız.',
    },
    en: {
        location: 'Location',
        nearby: 'Nearby Restaurant',
        showMenu: 'Show Menu',
        reserve: 'Reserve',
        entranceFee: 'Entrance Fee:',
        ingredients: 'Ingredients:',
        menu: 'Menu',
        back: 'Back',
        noInfo: 'No Information Found',
        noInfoDesc: 'No information has been added for this category yet.',
        login_required: 'You must be logged in to make a reservation.',
    },
}[lang]);


function CardItem({ item, lang }: { item: InfoItem, lang: Lang }) {
    const router = useRouter();
    const { isReadingMode, speakText } = useReadingMode();
    const { user, isUserLoading } = useUser();
    const { toast } = useToast();
    const trans = t(lang);

    const canReserve = item.category === 'hotels' || item.category === 'restaurants';
    
    const hasNearbyRestaurant = !!item.nearbyRestaurants;
    const hasLocation = !!item.googleMapsUrl;
    const hasMenu = item.category === 'restaurants' && !!item.menu;

    const showEntranceFee = item.category === 'attractions' && !!item.entranceFee;

    const buildNearbyRestaurantUrl = () => {
        if (!item.nearbyRestaurants) return '';
        const params = new URLSearchParams({
            name: item.nearbyRestaurants,
            image: item.nearbyRestaurantImageUrl || '',
            mountainSlug: item.mountainSlug,
            lang: lang,
        });
        return `/reserve/nearby?${params.toString()}`;
    }

    const handleReservationClick = () => {
        if (!user) {
            toast({
                variant: 'destructive',
                title: 'Giriş tələb olunur',
                description: trans.login_required,
            });
            router.push('/login');
            return;
        }
        router.push(`/reserve/${item.id}`);
    };

    const name = (lang === 'en' && item.name_en) ? item.name_en : item.name;
    const description = (lang === 'en' && item.description_en) ? item.description_en : item.description;
    const ingredients = (lang === 'en' && item.ingredients_en) ? item.ingredients_en : item.ingredients;

    const handleSpeak = (text: string | undefined) => {
        if (text) speakText(text, lang === 'az' ? 'tr-TR' : `${lang}-${lang.toUpperCase()}`);
    }

    return (
        <Card className="overflow-hidden shadow-lg rounded-xl flex flex-col transition-transform duration-300 hover:-translate-y-1">
           {item.imageUrl && <div className="relative h-56 w-full">
                <Image
                    src={item.imageUrl}
                    alt={name || 'Location Image'}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                />
            </div>}
            <CardHeader onMouseEnter={() => handleSpeak(name)} className={cn(isReadingMode && 'cursor-pointer hover:bg-muted/50')}>
                <CardTitle>{name}</CardTitle>
                <div className="flex items-center justify-between pt-2">
                    {item.rating != null && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            <span>{Number(item.rating).toFixed(1)}</span>
                        </Badge>
                    )}
                    {item.price && <Badge variant="outline">{item.price}</Badge>}
                </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                <CardDescription className={cn("line-clamp-3", isReadingMode && 'cursor-pointer hover:bg-muted/50')} onMouseEnter={() => handleSpeak(description)}>
                    {description}
                </CardDescription>
                {item.address && (
                    <div className={cn("flex items-start gap-2 text-sm text-muted-foreground", isReadingMode && 'cursor-pointer hover:bg-muted/50')} onMouseEnter={() => handleSpeak(item.address)}>
                        <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>{item.address}</span>
                    </div>
                )}
                {item.phone && (
                    <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", isReadingMode && 'cursor-pointer hover:bg-muted/50')} onMouseEnter={() => handleSpeak(item.phone)}>
                        <Phone className="h-4 w-4 shrink-0" />
                        <span>{item.phone}</span>
                    </div>
                )}
                 {showEntranceFee && (
                     <div className={cn("pt-2 flex items-center gap-2 text-sm text-muted-foreground", isReadingMode && 'cursor-pointer hover:bg-muted/50')} onMouseEnter={() => handleSpeak(`${trans.entranceFee} ${item.entranceFee}`)}>
                        <Ticket className="h-4 w-4" />
                        <span className="font-semibold">{trans.entranceFee}</span>
                        <span>{item.entranceFee}</span>
                    </div>
                )}
                {ingredients && (
                     <div className={cn("pt-2", isReadingMode && 'cursor-pointer hover:bg-muted/50')} onMouseEnter={() => handleSpeak(`${trans.ingredients} ${ingredients}`)}>
                        <h4 className="font-semibold text-sm mb-1">{trans.ingredients}</h4>
                        <p className="text-sm text-muted-foreground">{ingredients}</p>
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row items-stretch gap-2 pt-0">
                {hasLocation && (
                    <Button variant="outline" className="w-full" asChild>
                        <a href={item.googleMapsUrl} target="_blank" rel="noopener noreferrer">{trans.location}</a>
                    </Button>
                )}
                {hasNearbyRestaurant && (
                     <Button asChild variant="outline" className="w-full">
                         <Link href={buildNearbyRestaurantUrl()}>{trans.nearby}</Link>
                    </Button>
                )}
                {hasMenu && (
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="w-full">{trans.showMenu}</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{name} - {trans.menu}</DialogTitle>
                            </DialogHeader>
                             <div className="py-4">
                                {item.menu && (item.menu.trim().startsWith('http') || item.menu.trim().startsWith('data:image/')) ? (
                                    <div className="relative h-96">
                                        <Image src={item.menu.trim()} alt={`${name || 'Restaurant'} menu`} fill className="object-contain" />
                                    </div>
                                ) : (
                                    <p className={cn("text-sm text-muted-foreground whitespace-pre-wrap", isReadingMode && 'cursor-pointer hover:bg-muted/50')} onMouseEnter={() => handleSpeak(item.menu)}>
                                        {item.menu}
                                    </p>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
                {canReserve && (
                     <Button className="w-full" onClick={handleReservationClick} disabled={isUserLoading}>
                        {trans.reserve}
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const mountainSlug = Array.isArray(params.country) ? params.country[0] : params.country;
  const categoryId = Array.isArray(params.category) ? params.category[0] : params.category as InfoCategory;
  const firestore = useFirestore();

  const [mountain, setMountain] = useState<Mountain | null>(null);
  const [items, setItems] = useState<InfoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalLang, setGlobalLang] = useState<Lang>('az');
  const { toast } = useToast();
  const { isReadingMode, speakText } = useReadingMode();

  useEffect(() => {
    const savedLang = localStorage.getItem('app-lang') as Lang;
    if (savedLang) {
      setGlobalLang(savedLang);
    }
  }, []);

  const handleSetLang = (newLang: Lang) => {
    setGlobalLang(newLang);
    localStorage.setItem('app-lang', newLang);
  };
  
  const pageLang = globalLang;
  const trans = t(pageLang);
  const categoryDetails = CATEGORIES.find(c => c.id === categoryId);

  useEffect(() => {
    if (!mountainSlug || !categoryId || !firestore) return;

    async function loadData() {
      setLoading(true);
      try {
        const mountainData = await getMountainData(firestore, mountainSlug);
        setMountain(mountainData);
        
        if (mountainData) {
            const itemsData = await getInfoItems(firestore, mountainSlug, categoryId);
            setItems(itemsData);
        }

      } catch (error) {
        console.error("Failed to load category data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [mountainSlug, categoryId, firestore]);
  

  const handleSpeak = (text: string | undefined) => {
    if (text) speakText(text, pageLang === 'az' ? 'tr-TR' : `${pageLang}-${pageLang.toUpperCase()}`);
  }

  const renderContent = () => {
    if (loading) {
      const gridCols = 'md:grid-cols-2 lg:grid-cols-3';
      const cardHeight = 'h-96';
      return (
        <div className={`grid gap-6 ${gridCols}`}>
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className={`${cardHeight} w-full`} />
          ))}
        </div>
      );
    }
    
    if (items.length === 0) {
        return (
            <div className={cn("text-center py-20 bg-muted rounded-lg", isReadingMode && 'cursor-pointer hover:bg-muted/50')} onMouseEnter={() => handleSpeak(`${trans.noInfo}. ${trans.noInfoDesc}`)}>
                <h2 className="text-2xl font-bold">{trans.noInfo}</h2>
                <p className="text-muted-foreground mt-2">{trans.noInfoDesc}</p>
            </div>
        )
    }

    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map(item => (
          <CardItem key={item.id} item={item} lang={pageLang} />
        ))}
      </div>
    );
  };
  
  const mountainName = (pageLang === 'en' && mountain?.name_en) ? mountain.name_en : mountain?.name;
  const categoryName = (pageLang === 'en' ? categoryDetails?.name : categoryDetails?.name_az);

  return (
    <>
      <AppHeader lang={globalLang} setLang={handleSetLang} />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 space-y-2">
             <Button variant="ghost" onClick={() => router.back()} className="pl-0">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {mountainName || trans.back}
            </Button>
            <h1 className={cn("text-4xl font-extrabold tracking-tight lg:text-5xl font-headline", isReadingMode && 'cursor-pointer hover:bg-muted/50')} onMouseEnter={() => handleSpeak(categoryName)}>
                {categoryName}
            </h1>
        </div>

        {renderContent()}
      </main>
    </>
  );
}
