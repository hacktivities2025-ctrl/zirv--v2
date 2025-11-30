'use client';

import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Mountain, LogIn, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAuth, useFirestore } from '@/firebase';
import { getUserProfile, getCompanyByUserId, signInUser } from '@/lib/firebase-actions';
import Cookies from 'js-cookie';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
      Daxil ol
    </Button>
  );
}

export default function LoginPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password || !firestore) {
        toast({
            variant: "destructive",
            title: "Giriş uğursuz oldu",
            description: "Email və ya parol sahələri boş ola bilməz.",
        });
        return;
    }

    try {
        const user = await signInUser(email, password);

        // Fetch user role
        const userProfile = await getUserProfile(firestore, user.uid);
        const userRole = userProfile?.role || 'user';
        
        // Set cookies
        Cookies.set('firebase-auth-token', await user.getIdToken(), { path: '/' });
        Cookies.set('user_role', userRole, { path: '/' });


        toast({
            title: "Giriş uğurludur",
            description: "Yönləndirilirsiniz...",
        });

        // Role-based redirection
        if (userRole === 'admin') {
            router.push('/admin');
        } else if (userRole === 'agent') {
            const companyProfile = await getCompanyByUserId(firestore, user.uid);
            Cookies.set('company_status', companyProfile?.status || 'pending', { path: '/' });
            if (companyProfile?.status === 'active') {
                router.push('/guide');
            } else {
                router.push('/guide/pending');
            }
        } else {
            router.push('/home');
        }

    } catch (error: any) {
         toast({
            variant: "destructive",
            title: "Giriş uğursuz oldu",
            description: error.message || "Email və ya parol düzgün deyil.",
        });
    }
  };


  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Mountain className="h-8 w-8" />
            </div>
          <CardTitle className="text-2xl">Xoş Gəlmisiniz!</CardTitle>
          <CardDescription>Davam etmək üçün hesabınıza daxil olun</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="email@example.com" required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="password">Parol</Label>
                <Input id="password" name="password" type="password" placeholder="••••••••" required />
            </div>
            <SubmitButton />
          </form>
        </CardContent>
        <CardFooter className="text-center text-sm">
            <p className="w-full">
                Hesabınız yoxdur?{' '}
                <Link href="/register" className="font-semibold text-primary hover:underline">
                    Qeydiyyatdan keçin
                </Link>
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
