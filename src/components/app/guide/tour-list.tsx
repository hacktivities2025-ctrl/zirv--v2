'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { fetchToursForAgent, deleteTour } from '@/lib/firebase-actions';
import { Tour } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { MoreHorizontal, PlusCircle, Trash2, Edit } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import TourForm from './tour-form';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore, useUser } from '@/firebase';
import { Badge } from '@/components/ui/badge';

export default function TourList() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const loadTours = useCallback(async () => {
    if (!firestore || !user) return;
    setLoading(true);
    try {
      const data = await fetchToursForAgent(firestore, user.uid);
      setTours(data);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Xəta', description: 'Turları yükləmək mümkün olmadı.' });
    } finally {
      setLoading(false);
    }
  }, [firestore, user, toast]);

  useEffect(() => {
    loadTours();
  }, [loadTours]);

  const handleAddClick = () => {
    setSelectedTour(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (tour: Tour) => {
    setSelectedTour(tour);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (tour: Tour) => {
    setSelectedTour(tour);
    setIsAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedTour || !firestore) return;
    try {
      await deleteTour(firestore, selectedTour.id);
      toast({ title: 'Uğurlu', description: `'${selectedTour.name}' turu silindi.` });
      loadTours();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Xəta', description: 'Turu silmək mümkün olmadı.' });
    } finally {
      setIsAlertOpen(false);
      setSelectedTour(null);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
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
        {tours.map((tour) => (
          <Card key={tour.id} className="relative group flex flex-col">
            <div className="relative w-full aspect-video">
                <Image src={tour.imageUrl} alt={tour.name} fill className="rounded-t-lg object-cover" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle>{tour.name}</CardTitle>
              <CardDescription className="text-sm text-primary font-semibold">{tour.country}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-2">
                 <div className='flex items-center justify-between text-sm'>
                    <span className='text-muted-foreground'>Qiymət:</span>
                    <span className='font-bold'>{tour.price} AZN</span>
                 </div>
                 <div className='flex items-center justify-between text-sm'>
                    <span className='text-muted-foreground'>Müddət:</span>
                    <span className='font-bold'>{tour.durationHours} saat</span>
                 </div>
            </CardContent>
             <CardFooter>
                <Badge variant={tour.hasCoupon ? 'default' : 'secondary'}>
                    {tour.hasCoupon ? 'Kupon mövcuddur' : 'Kupon yoxdur'}
                </Badge>
            </CardFooter>
            <div className="absolute top-2 right-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEditClick(tour)}>
                    <Edit className="mr-2 h-4 w-4" /> Redaktə et
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDeleteClick(tour)} className="text-red-500">
                    <Trash2 className="mr-2 h-4 w-4" /> Sil
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </Card>
        ))}
      </div>

      <TourForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onFormSubmit={loadTours}
        tour={selectedTour}
      />

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Silməni təsdiqləyirsiz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu əməliyyat geri qaytarıla bilməz. Bu, '{selectedTour?.name}' turunu sistemdən siləcək.
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
