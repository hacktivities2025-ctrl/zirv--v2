'use client';


import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, User, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RegisterTypePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Hesab Növünü Seçin</CardTitle>
          <CardDescription>Kim kimi qeydiyyatdan keçmək istəyirsiniz?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link href="/register/user">
            <Card className="p-4 hover:bg-muted transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <User className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-semibold">Fərdi İstifadəçi</h3>
                    <p className="text-sm text-muted-foreground">Səyahət planlayın və kəşf edin.</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Card>
          </Link>
          <Link href="/register/agent">
            <Card className="p-4 hover:bg-muted transition-colors cursor-pointer">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <Building className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-semibold">Turizm Şirkəti</h3>
                      <p className="text-sm text-muted-foreground">Turlarınızı təklif edin.</p>
                    </div>
                 </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Card>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
