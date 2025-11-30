'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Tour } from '@/lib/definitions';
import { createOrUpdateTour } from '@/lib/firebase-actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { useEffect } from 'react';
import { Switch } from '@/components/ui/switch';


const formSchema = z.object({
  name: z.string().min(2, { message: 'Ad ən azı 2 hərf olmalıdır.' }),
  country: z.string().min(3, { message: 'Ölkə adı ən azı 3 hərf olmalıdır.' }),
  description: z.string().min(10, { message: 'Təsvir ən azı 10 hərf olmalıdır.' }),
  imageUrl: z.string().url({ message: 'Düzgün bir URL daxil edin.' }),
  durationHours: z.coerce.number().positive({ message: 'Müddət müsbət ədəd olmalıdır.' }),
  price: z.coerce.number().positive({ message: 'Qiymət müsbət ədəd olmalıdır.' }),
  hasCoupon: z.boolean().default(false),
});

interface TourFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onFormSubmit: () => void;
  tour?: Tour | null;
}

export default function TourForm({ isOpen, onOpenChange, onFormSubmit, tour }: TourFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      country: '',
      description: '',
      imageUrl: '',
      durationHours: undefined,
      price: undefined,
      hasCoupon: false,
    },
  });

  const { toast } = useToast();
  const { isSubmitting } = form.formState;
  const firestore = useFirestore();
  const { user } = useUser();

  useEffect(() => {
    if (tour) {
      form.reset(tour);
    } else {
      form.reset({
        name: '',
        country: '',
        description: '',
        imageUrl: '',
        durationHours: undefined,
        price: undefined,
        hasCoupon: false,
      });
    }
  }, [tour, form]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if(!firestore || !user) return;
    try {
      await createOrUpdateTour(firestore, user.uid, values, tour?.id);
      toast({
        title: 'Uğurlu Əməliyyat',
        description: `Tur uğurla ${tour ? 'yeniləndi' : 'yaradıldı'}.`,
      });
      onFormSubmit();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Xəta',
        description: 'Əməliyyat zamanı xəta baş verdi.',
      });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tour ? 'Turu Redaktə Et' : 'Yeni Tur Yarat'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Turun Adı</FormLabel><FormControl><Input placeholder="Qəbələ Turu" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
             <FormField control={form.control} name="country" render={({ field }) => (
                <FormItem><FormLabel>Ölkə</FormLabel><FormControl><Input placeholder="Azərbaycan" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
             <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Təsvir</FormLabel><FormControl><Textarea placeholder="Tur haqqında ətraflı məlumat..." {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="imageUrl" render={({ field }) => (
                <FormItem><FormLabel>Şəkil URL</FormLabel><FormControl><Input placeholder="https://example.com/image.jpg" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
                 <FormField control={form.control} name="durationHours" render={({ field }) => (
                    <FormItem><FormLabel>Müddət (saat)</FormLabel><FormControl><Input type="number" placeholder="8" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="price" render={({ field }) => (
                    <FormItem><FormLabel>Qiymət (AZN)</FormLabel><FormControl><Input type="number" placeholder="50" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
            </div>
             <FormField control={form.control} name="hasCoupon" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                        <FormLabel>Kupon Tətbiq Et</FormLabel>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
            )} />


            <DialogFooter className='pt-4'>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Ləğv et
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {tour ? 'Yenilə' : 'Yarat'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
