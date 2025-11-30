'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { fetchMountains, deleteMountain } from '@/lib/firebase-actions';
import { Mountain } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MoreHorizontal, PlusCircle, Trash2, Edit } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import CountryForm from './country-form';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore } from '@/firebase';

export default function MountainList() {
  const [mountains, setMountains] = useState<Mountain[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedMountain, setSelectedMountain] = useState<Mountain | null>(null);
  const { toast } = useToast();
  const firestore = useFirestore();

  const loadMountains = useCallback(async () => {
    if (!firestore) return;
    setLoading(true);
    try {
      const data = await fetchMountains(firestore);
      setMountains(data);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Xəta', description: 'Turları yükləmək mümkün olmadı.' });
    } finally {
      setLoading(false);
    }
  }, [firestore, toast]);

  useEffect(() => {
    loadMountains();
  }, [loadMountains]);

  const handleAddClick = () => {
    setSelectedMountain(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (mountain: Mountain) => {
    setSelectedMountain(mountain);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (mountain: Mountain) => {
    setSelectedMountain(mountain);
    setIsAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedMountain || !firestore) return;
    try {
      await deleteMountain(firestore, selectedMountain.id);
      toast({ title: 'Uğurlu', description: `${selectedMountain.name} turu silindi.` });
      loadMountains();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Xəta', description: 'Turu silmək mümkün olmadı.' });
    } finally {
      setIsAlertOpen(false);
      setSelectedMountain(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
       <div className="flex justify-end">
        <Button onClick={handleAddClick}>
          <PlusCircle className="mr-2 h-4 w-4" /> Yeni Tur Əlavə Et
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mountains.map((mountain) => (
          <Card key={mountain.id} className="relative group">
            <Image src={mountain.imageUrl} alt={mountain.name} width={400} height={200} className="rounded-t-lg object-cover w-full aspect-video" />
            <div className="p-4">
              <CardTitle>{mountain.name}</CardTitle>
              <CardDescription className="line-clamp-2">{mountain.description}</CardDescription>
            </div>
            <div className="absolute top-2 right-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEditClick(mountain)}>
                    <Edit className="mr-2 h-4 w-4" /> Redaktə et
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDeleteClick(mountain)} className="text-red-500">
                    <Trash2 className="mr-2 h-4 w-4" /> Sil
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </Card>
        ))}
        {mountains.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground py-10">
            <p>Heç bir tur tapılmadı. Yeni bir tur əlavə etmək üçün yuxarıdakı düymədən istifadə edin.</p>
          </div>
        )}
      </div>

      <CountryForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onFormSubmit={loadMountains}
        country={selectedMountain}
      />

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Silməni təsdiqləyirsiz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu əməliyyat geri qaytarıla bilməz. Bu, '{selectedMountain?.name}' turunu və ona aid bütün məlumatları sistemdən siləcək.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Ləğv et</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Bəli, Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
