'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Mountain } from '@/lib/definitions';
import { createOrUpdateMountain } from '@/lib/firebase-actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Ad (AZ) ən azı 2 hərf olmalıdır.' }),
  name_en: z.string().optional(),
  description: z.string().min(10, { message: 'Təsvir (AZ) ən azı 10 hərf olmalıdır.' }),
  description_en: z.string().optional(),
  imageUrl: z.string().url({ message: 'Düzgün bir URL daxil edin.' }),
  price: z.coerce.number().positive({ message: 'Qiymət müsbət ədəd olmalıdır.' }),
  durationHours: z.coerce.number().positive({ message: 'Müddət müsbət ədəd olmalıdır.' }).optional(),
  height: z.coerce.number().positive({ message: 'Hündürlük müsbət ədəd olmalıdır.' }).optional(),
  bestSeason: z.string().optional(),
  difficulty: z.enum(['Asan', 'Orta', 'Çətin', 'Ekstremal']).optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  temperature: z.string().optional(),
  hasCoupon: z.boolean().default(false),
});

interface MountainFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onFormSubmit: () => void;
  country?: Mountain | null;
}

export default function MountainForm({ isOpen, onOpenChange, onFormSubmit, country: mountain }: MountainFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      name_en: '',
      description: '',
      description_en: '',
      imageUrl: '',
      price: 0,
      durationHours: undefined,
      height: undefined,
      bestSeason: '',
      difficulty: undefined,
      latitude: undefined,
      longitude: undefined,
      temperature: '',
      hasCoupon: false,
    },
  });

  const { toast } = useToast();
  const { isSubmitting } = form.formState;
  const firestore = useFirestore();

  useEffect(() => {
    if (mountain) {
      form.reset({
        name: mountain.name || '',
        name_en: mountain.name_en || '',
        description: mountain.description || '',
        description_en: mountain.description_en || '',
        imageUrl: mountain.imageUrl || '',
        price: mountain.price || 0,
        durationHours: mountain.durationHours || undefined,
        height: mountain.height || undefined,
        bestSeason: mountain.bestSeason || '',
        difficulty: mountain.difficulty || undefined,
        latitude: mountain.latitude || undefined,
        longitude: mountain.longitude || undefined,
        temperature: mountain.temperature || '',
        hasCoupon: mountain.hasCoupon || false,
      });
    } else {
      form.reset({
        name: '',
        name_en: '',
        description: '',
        description_en: '',
        imageUrl: '',
        price: 0,
        durationHours: undefined,
        height: undefined,
        bestSeason: '',
        difficulty: undefined,
        latitude: undefined,
        longitude: undefined,
        temperature: '',
        hasCoupon: false,
      });
    }
  }, [mountain, form]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if(!firestore) return;
    try {
      await createOrUpdateMountain(firestore, values, mountain?.id);
      toast({
        title: 'Uğurlu Əməliyyat',
        description: `Tur uğurla ${mountain ? 'yeniləndi' : 'yaradıldı'}.`,
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
          <DialogTitle>{mountain ? 'Turu Redaktə Et' : 'Yeni Tur Əlavə Et'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className='p-4 border rounded-lg space-y-4'>
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Tur Adı (AZ)</FormLabel>
                        <FormControl><Input placeholder="Məsələn: Şahdağ" {...field} value={field.value || ''} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="name_en" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Tur Adı (EN)</FormLabel>
                        <FormControl><Input placeholder="E.g.: Shahdag" {...field} value={field.value || ''} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>

            <div className='p-4 border rounded-lg space-y-4'>
                <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Təsvir (AZ)</FormLabel>
                        <FormControl><Textarea placeholder="Tur haqqında qısa məlumat..." {...field} value={field.value || ''} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="description_en" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Təsvir (EN)</FormLabel>
                        <FormControl><Textarea placeholder="Brief information about the tour..." {...field} value={field.value || ''} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>
            
            <FormField control={form.control} name="imageUrl" render={({ field }) => (
                <FormItem>
                    <FormLabel>Şəkil URL</FormLabel>
                    <FormControl><Input placeholder="https://example.com/image.jpg" {...field} value={field.value || ''} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
            
             <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                 <FormField control={form.control} name="price" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Qiymət (AZN)</FormLabel>
                        <FormControl><Input type="number" placeholder="50" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="durationHours" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Müddət (saat)</FormLabel>
                        <FormControl><Input type="number" placeholder="8" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
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

            <div className='p-4 border rounded-lg space-y-4'>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <FormField control={form.control} name="height" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Hündürlük (m)</FormLabel>
                            <FormControl><Input type="number" placeholder="4243" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="difficulty" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Çətinlik Səviyyəsi</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ''}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Səviyyə seçin" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="Asan">Asan</SelectItem>
                                    <SelectItem value="Orta">Orta</SelectItem>
                                    <SelectItem value="Çətin">Çətin</SelectItem>
                                    <SelectItem value="Ekstremal">Ekstremal</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                 <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <FormField control={form.control} name="bestSeason" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Ən Yaxşı Mövsüm</FormLabel>
                            <FormControl><Input placeholder="İyun-Avqust" {...field} value={field.value || ''} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="temperature" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Ortalama Temperatur (°C)</FormLabel>
                            <FormControl><Input placeholder="5°C - 15°C" {...field} value={field.value || ''} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                 <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <FormField control={form.control} name="latitude" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Enlik (Latitude)</FormLabel>
                            <FormControl><Input type="number" step="any" placeholder="41.032" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="longitude" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Uzunluq (Longitude)</FormLabel>
                            <FormControl><Input type="number" step="any" placeholder="48.271" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
            </div>

            <DialogFooter className='pt-4'>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Ləğv et
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mountain ? 'Yenilə' : 'Əlavə Et'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
