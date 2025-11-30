'use client';
import TourList from '@/components/app/guide/tour-list';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppHeader from '@/components/app/app-header';

export default function GuideDashboardPage() {
  return (
    <>
    <AppHeader />
    <main className="p-4 md:p-8 space-y-8 container mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Agent Paneli</h1>
        <p className="text-muted-foreground">Turlarınızı idarə edin.</p>
      </div>

       <Card>
        <CardHeader>
          <CardTitle>Tur İdarəetməsi</CardTitle>
          <CardDescription>
            Yeni turlar əlavə edin, mövcud olanları redaktə edin və ya silin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TourList />
        </CardContent>
      </Card>
    </main>
    </>
  );
}

