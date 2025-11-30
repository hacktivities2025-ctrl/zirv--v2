'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppHeader from '@/components/app/app-header';
import { useFirestore } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { getAllUsers, awardScoreboardPrizes } from '@/lib/firebase-actions';
import { UserProfile } from '@/lib/definitions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Award, Medal, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function ScoreboardPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAwarding, setIsAwarding] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const fetchUsers = async () => {
    if (!firestore) return;
    setLoading(true);
    try {
      const usersData = await getAllUsers(firestore);
      const sortedUsers = usersData.sort((a, b) => {
        // Primary sort: tours attended (descending)
        const toursDiff = (b.toursAttended || 0) - (a.toursAttended || 0);
        if (toursDiff !== 0) {
          return toursDiff;
        }
        // Secondary sort: balance (descending)
        return (b.balance || 0) - (a.balance || 0);
      });
      setUsers(sortedUsers);
    } catch (error) {
      console.error("Failed to load users for scoreboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (firestore) {
      fetchUsers();
    }
  }, [firestore]);

  const handleAwardPrizes = async () => {
    if (!firestore) return;
    setIsAwarding(true);
    try {
        await awardScoreboardPrizes(firestore);
        toast({
            title: "Mükafatlar verildi!",
            description: "Reytinq cədvəlinin qaliblərinə xallar təqdim edildi."
        });
        await fetchUsers(); // Refresh the user list to show updated balances if needed
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Xəta",
            description: error.message || "Mükafatlandırma zamanı xəta baş verdi."
        });
    } finally {
        setIsAwarding(false);
    }
  }

  const getRowClass = (index: number) => {
    switch (index) {
      case 0: return 'bg-yellow-400/20 hover:bg-yellow-400/30';
      case 1: return 'bg-slate-400/20 hover:bg-slate-400/30';
      case 2: return 'bg-orange-600/20 hover:bg-orange-600/30';
      default: return '';
    }
  };
  
  const getMedal = (index: number) => {
    switch (index) {
      case 0: return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 1: return <Trophy className="h-5 w-5 text-slate-500" />;
      case 2: return <Trophy className="h-5 w-5 text-orange-600" />;
      default: return <Medal className="h-5 w-5 text-muted-foreground" />;
    }
  }


  if (loading) {
    return (
        <>
            <AppHeader isAdmin={true} />
            <main className="p-4 md:p-8 space-y-8">
                 <Skeleton className="h-12 w-1/2" />
                 <Skeleton className="h-96 w-full" />
            </main>
        </>
    );
  }

  return (
    <>
      <AppHeader isAdmin={true} />
      <main className="p-4 md:p-8 space-y-8">
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-3xl font-bold">Reytinq Cədvəli</h1>
                <p className="text-muted-foreground">Ən çox tura qatılan istifadəçilər.</p>
            </div>
            <Button onClick={handleAwardPrizes} disabled={isAwarding}>
                {isAwarding ? 'Mükafatlandırılır...' : 'Qalibləri Mükafatlandır'}
            </Button>
        </div>

        <Card>
          <CardContent className="p-0">
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Reytinq</TableHead>
                  <TableHead>İstifadəçi</TableHead>
                  <TableHead className="text-right">Turların Sayı</TableHead>
                  <TableHead className="text-right">Cari Balans</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user, index) => (
                  <TableRow key={user.email} className={cn(getRowClass(index))}>
                    <TableCell>
                        <div className='flex items-center gap-2 font-bold'>
                           {getMedal(index)}
                           {index + 1}
                        </div>
                    </TableCell>
                    <TableCell>{user.name || user.email}</TableCell>
                    <TableCell className="text-right font-medium">{user.toursAttended || 0}</TableCell>
                    <TableCell className="text-right font-medium">{user.balance || 0}</TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                            Hələlik heç bir istifadəçi reytinqdə deyil.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </>
  );
}

