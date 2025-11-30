'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import AppHeader from '@/components/app/app-header';
import { useFirestore } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { getAllUsers } from '@/lib/firebase-actions';
import { UserProfile } from '@/lib/definitions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Medal, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';


export default function UserScoreboardPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();
  const [lang, setLang] = useState<'az' | 'en'>('az');

  useEffect(() => {
    const savedLang = localStorage.getItem('app-lang') as 'az' | 'en';
    if (savedLang) {
      setLang(savedLang);
    }
  }, []);

  const handleSetLang = (newLang: 'az' | 'en') => {
    setLang(newLang);
    localStorage.setItem('app-lang', newLang);
  };

  const pageLang = lang;

  const t = {
    az: {
      title: 'Reytinq Cədvəli',
      description: 'Ən çox tura qatılan istifadəçilər.',
      rank: 'Reytinq',
      user: 'İstifadəçi',
      tours: 'Turların Sayı',
      balance: 'Cari Balans',
      no_users: 'Hələlik heç bir istifadəçi reytinqdə deyil.',
    },
    en: {
      title: 'Scoreboard',
      description: 'Users who attended the most tours.',
      rank: 'Rank',
      user: 'User',
      tours: 'Tours Attended',
      balance: 'Current Balance',
      no_users: 'No users in the ranking yet.',
    },
  }[pageLang];


  useEffect(() => {
    if (firestore) {
      const fetchUsers = async () => {
        setLoading(true);
        try {
          const usersData = await getAllUsers(firestore);
          const sortedUsers = usersData.sort((a, b) => {
            const toursDiff = (b.toursAttended || 0) - (a.toursAttended || 0);
            if (toursDiff !== 0) return toursDiff;
            return (b.balance || 0) - (a.balance || 0);
          });
          setUsers(sortedUsers);
        } catch (error) {
          console.error("Failed to load users for scoreboard:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchUsers();
    }
  }, [firestore]);

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
            <AppHeader lang={lang} setLang={handleSetLang} />
            <main className="p-4 md:p-8 space-y-8 container mx-auto">
                 <Skeleton className="h-12 w-1/2" />
                 <Skeleton className="h-96 w-full" />
            </main>
        </>
    );
  }

  return (
    <>
      <AppHeader lang={lang} setLang={handleSetLang} />
      <main className="p-4 md:p-8 space-y-8 container mx-auto">
        <div>
            <h1 className="text-3xl font-bold">{t.title}</h1>
            <p className="text-muted-foreground">{t.description}</p>
        </div>

        <Card>
          <CardContent className="p-0">
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">{t.rank}</TableHead>
                  <TableHead>{t.user}</TableHead>
                  <TableHead className="text-right">{t.tours}</TableHead>
                  <TableHead className="text-right">{t.balance}</TableHead>
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
                            {t.no_users}
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
