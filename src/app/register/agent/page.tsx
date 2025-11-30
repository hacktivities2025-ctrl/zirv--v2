'use client';


import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Building, UserPlus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { createAgentProfile } from '@/lib/firebase-actions';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';

const formSchema = z.object({
  companyName: z.string().min(2, { message: 'Şirkət adı ən azı 2 hərf olmalıdır.' }),
  email: z.string().email({ message: 'Düzgün bir email daxil edin.' }),
  password: z.string().min(6, { message: 'Parol ən azı 6 simvol olmalıdır.' }),
  phone: z.string().min(9, { message: 'Düzgün nömrə daxil edin.' }),
  address: z.string().min(5, { message: 'Ünvan ən azı 5 hərf olmalıdır.' }),
  licenseNumber: z.string().min(4, { message: 'Lisenziya nömrəsi ən azı 4 simvol olmalıdır.' }),
  description: z.string().optional(),
});


export default function RegisterAgentPage() {
  const [isSuccess, setIsSuccess] = useState(false);
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      companyName: '',
      phone: '',
      address: '',
      licenseNumber: '',
      description: '',
    },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) {
        toast({ variant: 'destructive', title: 'Xəta', description: 'Serverə qoşulma zamanı xəta.' });
        return;
    }
    
    try {
        await createAgentProfile(firestore, values);
        setIsSuccess(true);
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Qeydiyyat uğursuz oldu',
            description: error.message || 'Bilinməyən xəta baş verdi.',
        });
    }
  }
  
  if (isSuccess) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
             <Card className="w-full max-w-lg text-center">
                 <CardHeader>
                    <CardTitle>Qeydiyyat Uğurludur!</CardTitle>
                    <CardDescription>
                        Hesabınız yaradıldı və təsdiq üçün adminə göndərildi. Hesabınız təsdiqləndikdən sonra sizə email vasitəsilə bildiriş göndəriləcək.
                    </CardDescription>
                 </CardHeader>
                 <CardContent>
                     <p className="text-sm text-muted-foreground">
                        Statusu yoxlamaq üçün mütəmadi olaraq sayta daxil olmağı unutmayın.
                     </p>
                 </CardContent>
                 <CardFooter>
                    <Button className="w-full" asChild>
                        <Link href="/login">Giriş Səhifəsinə Qayıt</Link>
                    </Button>
                 </CardFooter>
             </Card>
        </div>
      )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Building className="h-8 w-8" />
            </div>
          <CardTitle className="text-2xl">Şirkət Hesabı Yarat</CardTitle>
          <CardDescription>Platformamıza qoşularaq turlarınızı təklif edin.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="companyName" render={({ field }) => (
                    <FormItem><FormLabel>Şirkətinizin Adı <span className="text-destructive">*</span></FormLabel><FormControl><Input placeholder="Travel Inc." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem><FormLabel>Email <span className="text-destructive">*</span></FormLabel><FormControl><Input placeholder="email@company.com" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="password" render={({ field }) => (
                        <FormItem><FormLabel>Parol <span className="text-destructive">*</span></FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="phone" render={({ field }) => (
                        <FormItem><FormLabel>Əlaqə Nömrəsi <span className="text-destructive">*</span></FormLabel><FormControl><Input placeholder="+994 12 123 45 67" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="licenseNumber" render={({ field }) => (
                        <FormItem><FormLabel>Lisenziya Nömrəsi <span className="text-destructive">*</span></FormLabel><FormControl><Input placeholder="XXXX-XXXX" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                 <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem><FormLabel>Ünvan <span className="text-destructive">*</span></FormLabel><FormControl><Input placeholder="Ofisinizin ünvanı" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Şirkət Haqqında</FormLabel><FormControl><Textarea placeholder="Şirkətiniz haqqında qısa məlumat..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />

                <Button type="submit" className="w-full !mt-6" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                  Qeydiyyatdan Keç
                </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="text-center text-sm">
            <p className="w-full">
                Artıq hesabınız var?{' '}
                <Link href="/login" className="font-semibold text-primary hover:underline">
                    Daxil olun
                </Link>
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
