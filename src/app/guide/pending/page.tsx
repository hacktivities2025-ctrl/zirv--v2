'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { logout } from '@/lib/actions';
import { useRouter } from 'next/navigation';

export default function PendingPage() {
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
            <Clock className="h-8 w-8" />
          </div>
          <CardTitle className="mt-4 text-2xl">Hesabınız Gözləmədədir</CardTitle>
          <CardDescription className="mt-2">
            Qeydiyyatınız uğurla tamamlandı. Hesabınız admin tərəfindən yoxlanıldıqdan sonra aktiv ediləcək. Anlayışınız üçün təşəkkür edirik.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleLogout} className="w-full">
            Çıxış
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

