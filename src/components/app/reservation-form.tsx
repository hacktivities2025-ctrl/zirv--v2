'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Loader2, TicketPercent, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { addReservation } from '@/lib/firebase-actions';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser } from '@/firebase';
import { Textarea } from '../ui/textarea';
import { useState } from 'react';
import { Mountain } from '@/lib/definitions';

type Lang = 'az' | 'en';

const translations = {
  az: {
    fullName: 'Tam Adınız',
    date: 'Tarix',
    pickDate: 'Tarix seçin',
    time: 'Saat',
    guests: 'Qonaq Sayı',
    notes: 'Əlavə qeydləriniz',
    notesPlaceholder: 'Pəncərə kənarında masa və ya digər istəklərinizi bura yazın...',
    confirm: 'Rezervasiyanı Təsdiqlə',
    successTitle: 'Rezervasiya Uğurlu',
    successDesc: 'Rezervasiyanız qəbul edildi. Təşəkkür edirik!',
    errorTitle: 'Xəta',
    errorDesc: 'Rezervasiya zamanı xəta baş verdi.',
    loginRequired: 'Rezervasiya etmək üçün daxil olmalısınız.',
    coupon_code: 'Kupon Kodu',
    apply_coupon: 'Tətbiq et',
    coupon_applied: 'Kupon tətbiq edildi!',
    invalid_coupon: 'Yanlış kupon kodu',
    original_price: 'Orijinal Qiymət',
    discounted_price: 'Endirimli Qiymət',
    validation: {
        name: 'Ad ən azı 2 hərf olmalıdır.',
        email: 'Düzgün bir email daxil edin.',
        date: 'Tarix seçimi məcburidir.',
        time: 'Düzgün saat formatı daxil edin (HH:MM).',
        guests: 'Qonaq sayı ən azı 1 olmalıdır.',
    }
  },
  en: {
    fullName: 'Full Name',
    date: 'Date',
    pickDate: 'Pick a date',
    time: 'Time',
    guests: 'Guests',
    notes: 'Additional notes',
    notesPlaceholder: 'Write your requests here, like a window seat...',
    confirm: 'Confirm Reservation',
    successTitle: 'Reservation Successful',
    successDesc: 'Your reservation has been received. Thank you!',
    errorTitle: 'Error',
    errorDesc: 'An error occurred during reservation.',
    loginRequired: 'You must be logged in to make a reservation.',
    coupon_code: 'Coupon Code',
    apply_coupon: 'Apply',
    coupon_applied: 'Coupon Applied!',
    invalid_coupon: 'Invalid coupon code',
    original_price: 'Original Price',
    discounted_price: 'Discounted Price',
    validation: {
        name: 'Name must be at least 2 characters.',
        email: 'Please enter a valid email.',
        date: 'A date is required.',
        time: 'Please enter a valid time format (HH:MM).',
        guests: 'Number of guests must be at least 1.',
    }
  },
};


const createReservationSchema = (lang: Lang) => z.object({
  userName: z.string().min(2, { message: translations[lang].validation.name }),
  email: z.string().email({ message: translations[lang].validation.email }),
  date: z.date({ required_error: translations[lang].validation.date }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: translations[lang].validation.time }),
  guests: z.coerce.number().min(1, { message: translations[lang].validation.guests }),
  specialRequests: z.string().optional(),
});


interface ReservationFormProps {
  item: {
    id: string;
    name: string;
    mountainSlug: string;
    itemType: 'tour' | 'infoItem';
    price?: number;
    hasCoupon?: boolean;
  };
  lang: Lang;
}

export default function ReservationForm({ item, lang }: ReservationFormProps) {
  const reservationSchema = createReservationSchema(lang);
  const t = translations[lang];
  const { user } = useUser();
  const router = useRouter();

  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');

  const form = useForm<z.infer<typeof reservationSchema>>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      userName: user?.displayName || '',
      email: user?.email || '',
      guests: 1,
      time: '19:00',
      specialRequests: '',
    },
  });

  const { toast } = useToast();
  const { isSubmitting } = form.formState;
  const firestore = useFirestore();

  const handleApplyCoupon = () => {
    if (couponCode.toUpperCase() === 'WELCOME10') {
        setDiscount(0.10); // 10% discount
        setCouponMessage(t.coupon_applied);
    } else {
        setDiscount(0);
        setCouponMessage(t.invalid_coupon);
    }
  };

  const originalPrice = item.price;
  const finalPrice = originalPrice ? originalPrice * (1 - discount) : undefined;
  const discountAmount = originalPrice && finalPrice ? originalPrice - finalPrice : undefined;


  async function onSubmit(values: z.infer<typeof reservationSchema>) {
    if(!firestore) return;
    if (!user) {
        toast({
            variant: 'destructive',
            title: t.errorTitle,
            description: t.loginRequired,
        });
        router.push('/login');
        return;
    }
    try {
      const reservationData = {
        userId: user.uid,
        itemId: item.id,
        itemName: item.name,
        itemType: item.itemType,
        mountainSlug: item.mountainSlug,
        ...values,
        date: format(values.date, 'yyyy-MM-dd'),
        originalPrice: originalPrice,
        finalPrice: finalPrice,
        discountAmount: discountAmount,
        couponCode: discount > 0 ? couponCode : undefined,
      };
      await addReservation(firestore, reservationData);
      toast({
        title: t.successTitle,
        description: t.successDesc,
      });
      router.push(`/reserve/success?mountain=${item.mountainSlug}&lang=${lang}`);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t.errorTitle,
        description: t.errorDesc,
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="userName" render={({ field }) => (
                <FormItem><FormLabel>{t.fullName}</FormLabel><FormControl><Input placeholder="John Doe" {...field} value={field.value || user?.displayName || ''} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="email@example.com" {...field} value={field.value || user?.email || ''} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
            )} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <FormField control={form.control} name="date" render={({ field }) => (
            <FormItem className="flex flex-col md:col-span-2">
              <FormLabel>{t.date}</FormLabel>
                <Popover>
                    <PopoverTrigger asChild>
                        <FormControl>
                            <Button variant={"outline"} className={cn("pl-3 text-left font-normal w-full", !field.value && "text-muted-foreground")}>
                                {field.value ? format(field.value, "PPP") : <span>{t.pickDate}</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))} initialFocus />
                    </PopoverContent>
                </Popover>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="time" render={({ field }) => (
              <FormItem className="md:col-span-1"><FormLabel>{t.time}</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="guests" render={({ field }) => (
              <FormItem className="md:col-span-1"><FormLabel>{t.guests}</FormLabel><FormControl><Input type="number" min="1" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
         <FormField
          control={form.control}
          name="specialRequests"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.notes}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t.notesPlaceholder}
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {item.itemType === 'tour' && item.hasCoupon && (
            <div className="space-y-2 p-4 border rounded-lg bg-secondary/50">
                <FormLabel>{t.coupon_code}</FormLabel>
                <div className="flex gap-2">
                    <Input 
                        placeholder="WELCOME10" 
                        value={couponCode} 
                        onChange={(e) => setCouponCode(e.target.value)} 
                        disabled={discount > 0}
                    />
                    <Button type="button" onClick={handleApplyCoupon} disabled={discount > 0}>
                        {discount > 0 ? <X className="h-4 w-4" /> : <TicketPercent className="h-4 w-4" />}
                    </Button>
                </div>
                {couponMessage && <p className={cn("text-sm", discount > 0 ? "text-green-600" : "text-destructive")}>{couponMessage}</p>}
                
                {discount > 0 && originalPrice && finalPrice && (
                    <div className="mt-4 space-y-1">
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>{t.original_price}:</span>
                            <span className="line-through">{originalPrice.toFixed(2)} AZN</span>
                        </div>
                         <div className="flex justify-between text-lg font-bold text-primary">
                            <span>{t.discounted_price}:</span>
                            <span>{finalPrice.toFixed(2)} AZN</span>
                        </div>
                    </div>
                )}
            </div>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t.confirm}
        </Button>
      </form>
    </Form>
  );
}
