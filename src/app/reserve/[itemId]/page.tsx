'use client';

import { Suspense, useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { getInfoItemById } from '@/lib/firebase-actions';
import { InfoItem, Mountain } from '@/lib/definitions';
import AppHeader from '@/components/app/app-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ReservationForm from '@/components/app/reservation-form';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Star, ArrowLeft } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

type Lang = 'az' | 'en';

function ReservationContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const itemId = Array.isArray(params.itemId) ? params.itemId[0] : params.itemId;
  const itemType = searchParams.get('type') === 'tour' ? 'tour' : 'infoItem';

  const firestore = useFirestore();
  
  const [item, setItem] = useState<InfoItem | Mountain | null>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<Lang>('az');

  useEffect(() => {
    const savedLang = localStorage.getItem('app-lang') as Lang;
    if (savedLang) {
      setLang(savedLang);
    }
  }, []);

  const handleSetLang = (newLang: Lang) => {
    setLang(newLang);
    localStorage.setItem('app-lang', newLang);
  };
  
  const pageLang = lang;

  useEffect(() => {
    if (!itemId || !firestore) return;
    async function loadItem() {
      setLoading(true);
      try {
        let itemData: InfoItem | Mountain | null = null;
        if (itemType === 'tour') {
            const tourDocRef = doc(firestore, "mountains", itemId);
            const docSnap = await getDoc(tourDocRef);
            if (docSnap.exists()) {
                itemData = { id: docSnap.id, ...docSnap.data() } as Mountain;
            }
        } else {
            itemData = await getInfoItemById(firestore, itemId);
        }
        setItem(itemData);
      } catch (error) {
        console.error("Failed to load item data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadItem();
  }, [itemId, firestore, itemType]);
  
  const t = {
    az: { back: 'Geri', not_found: 'Məkan tapılmadı.', hotel: 'Otel', restaurant: 'Restoran', tour: 'Tur', details: 'Rezervasiya Detalları' },
    en: { back: 'Back', not_found: 'Location not found.', hotel: 'Hotel', restaurant: 'Restaurant', tour: 'Tour', details: 'Reservation Details' },
  }[pageLang];


  if (loading) {
    return (
        <>
            <AppHeader lang={lang} setLang={handleSetLang} />
            <main className="container mx-auto px-4 py-8">
                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    <div>
                        <Skeleton className="w-full h-80 rounded-lg" />
                    </div>
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-3/4" />
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-48 w-full" />
                    </div>
                </div>
            </main>
        </>
    );
  }

  if (!item) {
    return (
      <>
        <AppHeader lang={lang} setLang={handleSetLang} />
        <div className="text-center py-20">{t.not_found}</div>
      </>
    );
  }
  
  const name = (pageLang === 'en' && 'name_en' in item && item.name_en) ? item.name_en : item.name;
  const description = (pageLang === 'en' && 'description_en' in item && item.description_en) ? item.description_en : item.description;

  const getCategoryName = () => {
    if (itemType === 'tour') return t.tour;
    if ('category' in item) {
        switch(item.category) {
            case 'hotels': return t.hotel;
            case 'restaurants': return t.restaurant;
            default: return '';
        }
    }
    return '';
  }
  
  const itemForForm = {
    id: item.id,
    name: item.name,
    mountainSlug: 'slug' in item ? item.slug : '',
    itemType: itemType as 'tour' | 'infoItem',
    price: 'price' in item ? item.price : undefined,
    hasCoupon: 'hasCoupon' in item ? item.hasCoupon : false
  }

  return (
    <>
      <AppHeader lang={lang} setLang={handleSetLang} />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t.back}
            </Button>
          <Card>
            <div className="grid md:grid-cols-2">
                <div className="relative h-64 md:h-full">
                    <Image src={item.imageUrl || ''} alt={name || ''} layout="fill" objectFit="cover" className="rounded-t-lg md:rounded-l-lg md:rounded-t-none" />
                </div>
                <div>
                    <CardHeader>
                        <CardTitle className="text-3xl">{name}</CardTitle>
                        <CardDescription>
                             <div className="flex items-center gap-2 text-sm mt-1">
                                {('rating' in item && item.rating) && (
                                    <>
                                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                        <span>{item.rating.toFixed(1)}</span>
                                        <span className='px-1'>·</span>
                                    </>
                                )}
                                <span className="text-muted-foreground">{getCategoryName()}</span>
                            </div>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-6 text-muted-foreground">{description}</p>
                        <h3 className="font-semibold mb-4 text-lg border-t pt-4">{t.details}</h3>
                        <ReservationForm item={itemForForm} lang={pageLang} />
                    </CardContent>
                </div>
            </div>
          </Card>
        </div>
      </main>
    </>
  );
}


export default function ReservationPage() {
    return (
        <Suspense fallback={<div className='h-screen w-full flex items-center justify-center'><p>Loading...</p></div>}>
            <ReservationContent />
        </Suspense>
    )
}
