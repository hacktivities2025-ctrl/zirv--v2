'use client';


import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Mountain, UserPlus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { createUserProfile } from '@/lib/firebase-actions';
import { Suspense } from 'react';

const formSchema = z.object({
  email: z.string().email({ message: 'Düzgün bir email daxil edin.' }),
  password: z.string().min(6, { message: 'Parol ən azı 6 simvol olmalıdır.' }),
  emergencyContactName: z.string().min(2, { message: 'Ad ən azı 2 hərf olmalıdır.' }),
  emergencyContactPhone: z.string().min(9, { message: 'Düzgün nömrə daxil edin.' }),
  name: z.string().optional(),
  gender: z.string().optional(),
  age: z.coerce.number().positive().optional(),
  family: z.coerce.number().optional(),
});

function RegisterUserForm() {
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
    },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) {
        toast({ variant: 'destructive', title: 'Xəta', description: 'Firebase yüklənməyib.' });
        return;
    }
    
    try {
        const userData = { 
            ...values, 
            role: 'user' as const,
            referredBy: ref || undefined
        };
        await createUserProfile(firestore, userData);

        toast({
            title: 'Qeydiyyat uğurludur!',
            description: 'Hesabınız yaradıldı. Giriş səhifəsinə yönləndirilirsiniz...'
        });
        router.push('/login');

    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Qeydiyyat uğursuz oldu',
            description: error.message || 'Bilinməyən xəta baş verdi.',
        });
    }
  }

  return (
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Mountain className="h-8 w-8" />
            </div>
          <CardTitle className="text-2xl">Hesab Yarat</CardTitle>
          <CardDescription>Səyahət təcrübənizi fərdiləşdirmək üçün bizə qoşulun</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email <span className="text-destructive">*</span></FormLabel>
                            <FormControl><Input placeholder="email@example.com" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="password" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Parol <span className="text-destructive">*</span></FormLabel>
                            <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="emergencyContactName" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Təcili Əlaqə (Ad) <span className="text-destructive">*</span></FormLabel>
                            <FormControl><Input placeholder="Ailə üzvünün adı" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="emergencyContactPhone" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Təcili Əlaqə (Telefon) <span className="text-destructive">*</span></FormLabel>
                            <FormControl><Input placeholder="+994 55 123 45 67" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                
                 <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Adınız</FormLabel><FormControl><Input placeholder="Ad və Soyad" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                     <FormField control={form.control} name="gender" render={({ field }) => (
                        <FormItem><FormLabel>Cins</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Seçin" /></SelectTrigger></FormControl>
                                <SelectContent><SelectItem value="Male">Kişi</SelectItem><SelectItem value="Female">Qadın</SelectItem><SelectItem value="Other">Digər</SelectItem></SelectContent>
                            </Select>
                        <FormMessage /></FormItem>
                    )} />
                     <FormField control={form.control} name="age" render={({ field }) => (
                        <FormItem><FormLabel>Yaş</FormLabel><FormControl><Input type="number" placeholder="30" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                     <FormField control={form.control} name="family" render={({ field }) => (
                        <FormItem><FormLabel>Ailə</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value ? String(field.value) : undefined}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Seçin" /></SelectTrigger></FormControl>
                                <SelectContent><SelectItem value="0">Uşaq yoxdur</SelectItem><SelectItem value="1">Bir uşaq</SelectItem><SelectItem value="2">Birdən çox</SelectItem></SelectContent>
                            </Select>
                        <FormMessage /></FormItem>
                    )} />
                </div>
                <Button type="submit" className="w-full !mt-8" disabled={isSubmitting}>
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
  )
}

export default function RegisterUserPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
           <Suspense fallback={<div>Loading...</div>}>
                <RegisterUserForm />
           </Suspense>
        </div>
    )
}
