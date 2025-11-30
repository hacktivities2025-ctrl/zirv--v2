'use client';

import { useEffect, useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'next/navigation';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { getUserProfile, updateUserProfile, getCouponsForUser, claimCoupon } from '@/lib/firebase-actions';
import { UserProfile, UserProfileSchema, Coupon } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, User as UserIcon, Ticket, Gift, Users, Copy, Wallet, GiftIcon, Check } from 'lucide-react';
import AppHeader from '@/components/app/app-header';
import { Skeleton } from '@/components/ui/skeleton';
import { increment } from 'firebase/firestore';

type Lang = 'az' | 'en';

function ProfileForm({ profileData, onProfileUpdate }: { profileData: UserProfile, onProfileUpdate: () => void }) {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const form = useForm<UserProfile>({
        resolver: zodResolver(UserProfileSchema),
        defaultValues: profileData,
    });

     useEffect(() => {
        form.reset(profileData);
    }, [profileData, form]);
    
    async function onSubmit(values: UserProfile) {
        if (!user || !firestore) return;
        try {
            await updateUserProfile(firestore, user.uid, values);
            onProfileUpdate(); // Callback to refresh parent state
            toast({ title: "Uğurlu!", description: "Profil məlumatlarınız yeniləndi." });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Xəta', description: error.message });
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Card>
                    <CardHeader><CardTitle>Əsas Məlumatlar</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem><FormLabel>Ad və Soyad</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="email" render={({ field }) => (
                            <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" readOnly disabled {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField control={form.control} name="emergencyContactName" render={({ field }) => (
                                <FormItem><FormLabel>Təcili Əlaqə (Ad) <span className="text-destructive">*</span></FormLabel><FormControl><Input {...field} value={field.value || ''}/></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="emergencyContactPhone" render={({ field }) => (
                                <FormItem><FormLabel>Təcili Əlaqə (Telefon) <span className="text-destructive">*</span></FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Demoqrafik Məlumatlar</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                             <FormField control={form.control} name="gender" render={({ field }) => (
                                <FormItem><FormLabel>Cins</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value || ''}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Seçin" /></SelectTrigger></FormControl>
                                        <SelectContent><SelectItem value="Male">Kişi</SelectItem><SelectItem value="Female">Qadın</SelectItem><SelectItem value="Other">Digər</SelectItem></SelectContent>
                                    </Select>
                                <FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="age" render={({ field }) => (
                                <FormItem><FormLabel>Yaş</FormLabel><FormControl><Input type="number" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="family" render={({ field }) => (
                                <FormItem><FormLabel>Ailə</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value ? String(field.value) : ''}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Seçin" /></SelectTrigger></FormControl>
                                        <SelectContent><SelectItem value="0">Uşaq yoxdur</SelectItem><SelectItem value="1">Bir uşaq</SelectItem><SelectItem value="2">Birdən çox</SelectItem></SelectContent>
                                    </Select>
                                <FormMessage /></FormItem>
                            )} />
                        </div>
                    </CardContent>
                </Card>
                
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Yadda Saxla
                </Button>
            </form>
        </Form>
    );
}

function CouponsTab({ onClaim }: { onClaim: (points: number) => void }) {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);

    const loadCoupons = async () => {
        if (!user || !firestore) return;
        setLoading(true);
        try {
            const userCoupons = await getCouponsForUser(firestore, user.uid);
            setCoupons(userCoupons);
        } catch (error) {
            console.error("Failed to load coupons:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user && firestore) {
            loadCoupons();
        }
    }, [user, firestore]);

    const handleClaim = async (coupon: Coupon) => {
        if (!user || !firestore || coupon.isUsed) return;
        try {
            await claimCoupon(firestore, user.uid, coupon.id);
            toast({ title: "Uğurlu!", description: `${coupon.points} xal balansınıza əlavə olundu!` });
            onClaim(coupon.points);
            loadCoupons(); // Refresh the coupon list
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Xəta', description: error.message });
        }
    };

    if (loading) {
        return <Skeleton className="h-48 w-full" />
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Kuponlarım</CardTitle>
                <CardDescription>Qazandığınız kuponlar burada göstəriləcək.</CardDescription>
            </CardHeader>
            <CardContent>
                {coupons.length > 0 ? (
                    <div className="space-y-4">
                        {coupons.map(coupon => (
                             <div key={coupon.id} className="flex items-center justify-between p-4 border rounded-lg bg-secondary/50">
                                <div>
                                    <p className="font-semibold text-primary">{coupon.code}</p>
                                    <p className="text-sm text-muted-foreground">{coupon.description}</p>
                                </div>
                                <Button size="icon" onClick={() => handleClaim(coupon)} disabled={coupon.isUsed} aria-label="Kuponu aktivləşdir">
                                    {coupon.isUsed ? <Check/> : <GiftIcon /> }
                                </Button>
                             </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-lg">
                        <Gift className="h-16 w-16 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold">Hələlik heç bir kupon qazanmamısınız.</h3>
                        <p className="text-muted-foreground mt-2">Tapşırıqları yerinə yetirərək kuponlar əldə edə bilərsiniz!</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function TasksTab({ profile, onTaskComplete }: { profile: UserProfile | null, onTaskComplete: () => void }) {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // This will work on any deployment environment (local, Vercel, etc.)
    const referralLink = (typeof window !== 'undefined' && user) ? `${window.location.origin}/register/user?ref=${user.uid}` : '';

    const isBonusClaimed = profile?.referralBonusClaimed || false;

    const copyToClipboard = async () => {
        if (!user || !firestore || isSubmitting) return;

        navigator.clipboard.writeText(referralLink);
        toast({ title: "Link Kopyalandı!", description: "Dostlarınızı dəvət etmək üçün linki onlarla paylaşın." });

        if (isBonusClaimed) return;
        
        setIsSubmitting(true);
        try {
            await updateUserProfile(firestore, user.uid, {
                balance: increment(50),
                referralBonusClaimed: true
            });
            toast({ title: "Təbriklər!", description: "Balansınıza 50 xal əlavə olundu." });
            onTaskComplete();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Xəta', description: 'Xal əlavə edilərkən xəta baş verdi.' });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
         <Card>
            <CardHeader>
                <CardTitle>Tapşırıqlar</CardTitle>
                <CardDescription>Xal qazanmaq üçün tapşırıqları yerinə yetirin.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="p-6 border rounded-lg">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                         <div>
                            <h4 className="font-semibold text-lg">Dostunu Dəvət Et</h4>
                            <p className="text-muted-foreground mt-1">Bu düyməyə basaraq həm linki kopyalayın, həm də <span className="font-bold text-primary">50 XAL</span> qazanın!</p>
                        </div>
                         <Button onClick={copyToClipboard} className="mt-4 md:mt-0" disabled={isSubmitting || isBonusClaimed}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                            : isBonusClaimed ? <Check className="mr-2 h-4 w-4" /> 
                            : <Copy className="mr-2 h-4 w-4" />}
                            {isBonusClaimed ? 'Xal Qazanıldı!' : 'Linki Kopyala və Qazan'}
                        </Button>
                    </div>
                    {referralLink && <Input readOnly value={referralLink} className="mt-4 bg-muted" />}
                </div>
            </CardContent>
        </Card>
    )
}

function ProfilePageContents() {
    const { user } = useUser();
    const firestore = useFirestore();
    const searchParams = useSearchParams();
    const tab = searchParams.get('tab') || 'profile';
    const [lang, setLang] = useState<Lang>('az');
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async () => {
        if (user && firestore) {
            setLoading(true);
            const profileData = await getUserProfile(firestore, user.uid);
            if (profileData) {
                setProfile(profileData);
            }
            setLoading(false);
        }
    };
    
    useEffect(() => {
        const savedLang = localStorage.getItem('app-lang') as Lang | null;
        if (savedLang) {
            setLang(savedLang);
        }
        fetchProfile();
    }, [user, firestore]);
    
    const handleBalanceUpdate = () => {
        fetchProfile();
    };

    if (loading) {
        return <ProfilePageFallback />;
    }

    return (
        <>
            <AppHeader lang={lang} setLang={setLang} />
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <Card className="mb-8">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Mənim Balansım</CardTitle>
                            <Wallet className="h-6 w-6 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-4xl font-bold">{profile?.balance || 0} <span className="text-lg font-normal text-muted-foreground">XAL</span></p>
                        </CardContent>
                    </Card>

                    <Tabs defaultValue={tab} className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="profile">
                                <UserIcon className="mr-2 h-4 w-4" /> Profil
                            </TabsTrigger>
                            <TabsTrigger value="coupons">
                                <Ticket className="mr-2 h-4 w-4" /> Kuponlar
                            </TabsTrigger>
                             <TabsTrigger value="tasks">
                                <Users className="mr-2 h-4 w-4" /> Tapşırıqlar
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="profile" className="mt-6">
                            {profile ? <ProfileForm profileData={profile} onProfileUpdate={handleBalanceUpdate} /> : <Skeleton className="h-96 w-full" />}
                        </TabsContent>
                        <TabsContent value="coupons" className="mt-6">
                            <CouponsTab onClaim={handleBalanceUpdate} />
                        </TabsContent>
                        <TabsContent value="tasks" className="mt-6">
                            <TasksTab profile={profile} onTaskComplete={handleBalanceUpdate} />
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
        </>
    );
}

function ProfilePageFallback() {
    return (
        <div className="container mx-auto px-4 py-8">
             <div className="max-w-4xl mx-auto space-y-8">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-96 w-full" />
             </div>
        </div>
    )
}

export default function ProfilePage() {
    return (
        <Suspense fallback={<ProfilePageFallback />}>
            <ProfilePageContents />
        </Suspense>
    )
}
