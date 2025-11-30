'use client';

import * as React from 'react';
import { getAllTours, updateTourStatus } from '@/lib/firebase-actions';
import { Tour } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
  getFilteredRowModel,
  ColumnFiltersState,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import AppHeader from '@/components/app/app-header';
import { format } from 'date-fns';
import { useFirestore } from '@/firebase';
import { Badge } from '@/components/ui/badge';
import { Check, Clock, X, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
// Import your TourForm component, assuming you have one for editing
// import TourForm from '@/components/app/guide/tour-form';


export default function TourApprovalPage() {
  const [data, setData] = React.useState<Tour[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<'pending' | 'approved' | 'rejected'>('pending');
  const { toast } = useToast();
  const [sorting, setSorting] = React.useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const firestore = useFirestore();

  // State for edit form
  // const [isFormOpen, setIsFormOpen] = React.useState(false);
  // const [selectedTour, setSelectedTour] = React.useState<Tour | null>(null);

  const loadTours = React.useCallback(async () => {
    if (!firestore) return;
    setLoading(true);
    try {
      const toursData = await getAllTours(firestore);
      setData(toursData);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Xəta',
        description: 'Turları yükləmək mümkün olmadı.',
      });
    } finally {
      setLoading(false);
    }
  }, [firestore, toast]);

  React.useEffect(() => {
    loadTours();
  }, [loadTours]);

  const handleStatusChange = async (tourId: string, status: 'approved' | 'rejected') => {
    if (!firestore) return;
    try {
        await updateTourStatus(firestore, tourId, status);
        toast({ title: "Uğurlu!", description: `Tur statusu yeniləndi: ${status}` });
        loadTours();
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Xəta', description: error.message });
    }
  }

  // const handleEditClick = (tour: Tour) => {
  //   setSelectedTour(tour);
  //   setIsFormOpen(true);
  // };

  const getStatusBadge = (status: 'pending' | 'approved' | 'rejected') => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-600">Təsdiqlənib</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rədd edilib</Badge>;
      case 'pending':
      default:
        return <Badge variant="secondary">Gözləmədə</Badge>;
    }
  };

  const columns: ColumnDef<Tour>[] = [
    { accessorKey: 'name', header: 'Tur Adı' },
    { accessorKey: 'agentName', header: 'Şirkət' },
    { accessorKey: 'country', header: 'Ölkə' },
    { accessorKey: 'price', header: 'Qiymət (AZN)' },
    {
      accessorKey: 'createdAt',
      header: 'Yaradılma Tarixi',
      cell: ({ row }) => {
        const date = row.original.createdAt;
        // Add a check to ensure date is a valid string or Date object
        try {
          return date ? format(new Date(date), 'dd/MM/yyyy HH:mm') : 'N/A';
        } catch (e) {
            return 'Invalid Date';
        }
      },
    },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => getStatusBadge(row.original.status) },
    {
        id: 'actions',
        header: 'Əməliyyat',
        cell: ({ row }) => {
            const tour = row.original;
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {/* <DropdownMenuItem onClick={() => handleEditClick(tour)}>
                            <Edit className="mr-2 h-4 w-4" /> Redaktə et
                        </DropdownMenuItem> */}
                        {tour.status !== 'approved' && (
                             <DropdownMenuItem onClick={() => handleStatusChange(tour.id, 'approved')}>
                                <Check className="mr-2 h-4 w-4" /> Təsdiqlə
                            </DropdownMenuItem>
                        )}
                        {tour.status !== 'rejected' && (
                             <DropdownMenuItem onClick={() => handleStatusChange(tour.id, 'rejected')} className="text-red-500">
                                <X className="mr-2 h-4 w-4" /> Rədd et
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        }
    }
  ];

  const filteredData = React.useMemo(() => {
      return data.filter(tour => tour.status === activeTab);
  }, [data, activeTab]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-2">
            <Skeleton className="h-96 w-full" />
        </div>
      );
    }
    
    return (
        <>
            <div className="rounded-md border">
                <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                            {flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                        ))}
                    </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                        ))}
                        </TableRow>
                    ))
                    ) : (
                    <TableRow>
                        <TableCell colSpan={columns.length} className="h-24 text-center">
                         Bu bölmədə tur yoxdur.
                        </TableCell>
                    </TableRow>
                    )}
                </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-4">
                <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                Əvvəlki
                </Button>
                <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                Növbəti
                </Button>
            </div>
        </>
    );
  }

  return (
    <>
      <AppHeader isAdmin={true} />
      <main className="p-4 md:p-8">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Tur Təsdiqləri</h1>
        </div>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
            <TabsList>
                <TabsTrigger value="pending">
                    <Clock className='mr-2 h-4 w-4' />
                    Gözləyənlər
                </TabsTrigger>
                <TabsTrigger value="approved">
                    <Check className='mr-2 h-4 w-4' />
                    Təsdiqlənənlər
                </TabsTrigger>
                 <TabsTrigger value="rejected">
                    <X className='mr-2 h-4 w-4' />
                    Rədd Edilənlər
                </TabsTrigger>
            </TabsList>
            <TabsContent value="pending" className="mt-4">{renderContent()}</TabsContent>
            <TabsContent value="approved" className="mt-4">{renderContent()}</TabsContent>
            <TabsContent value="rejected" className="mt-4">{renderContent()}</TabsContent>
        </Tabs>
      </main>

       {/* <TourForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onFormSubmit={loadTours}
        tour={selectedTour}
      /> */}
    </>
  );
}
