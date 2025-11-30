'use client';

import * as React from 'react';
import { getCompanies, approveCompany } from '@/lib/firebase-actions';
import { Company } from '@/lib/definitions';
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
import { Check, Clock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


export default function CompaniesPage() {
  const [data, setData] = React.useState<Company[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<'pending' | 'approved'>('pending');
  const { toast } = useToast();
  const [sorting, setSorting] = React.useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const firestore = useFirestore();

  const loadCompanies = React.useCallback(async () => {
    if (!firestore) return;
    setLoading(true);
    try {
      const companiesData = await getCompanies(firestore);
      setData(companiesData);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Xəta',
        description: 'Şirkətləri yükləmək mümkün olmadı.',
      });
    } finally {
      setLoading(false);
    }
  }, [firestore, toast]);

  React.useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const handleApprove = async (companyId: string) => {
    if (!firestore) return;
    try {
        await approveCompany(firestore, companyId);
        toast({ title: "Uğurlu!", description: "Şirkət təsdiqləndi." });
        loadCompanies();
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Xəta', description: error.message });
    }
  }

  const columns: ColumnDef<Company>[] = [
    { accessorKey: 'companyName', header: 'Şirkət Adı' },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'phone', header: 'Telefon' },
    { accessorKey: 'licenseNumber', header: 'Lisenziya' },
    { accessorKey: 'address', header: 'Ünvan' },
    {
      accessorKey: 'createdAt',
      header: 'Qeydiyyat Tarixi',
      cell: ({ row }) => {
        const date = row.getValue('createdAt');
        return date ? format(new Date(date as string), 'dd/MM/yyyy HH:mm') : 'N/A';
      },
    },
    {
        id: 'actions',
        header: 'Əməliyyat',
        cell: ({ row }) => {
            const company = row.original;
            if (company.status === 'pending') {
                return (
                    <Button size="sm" onClick={() => handleApprove(company.id)}>
                        <Check className="mr-2 h-4 w-4" />
                        Təsdiqlə
                    </Button>
                )
            }
            return <Badge variant="secondary">Təsdiqlənib</Badge>;
        }
    }
  ];

  const filteredData = React.useMemo(() => {
      return data.filter(company => company.status === activeTab);
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
                         {activeTab === 'pending' ? 'Təsdiq gözləyən şirkət yoxdur.' : 'Təsdiqlənmiş şirkət yoxdur.'}
                        </TableCell>
                    </TableRow>
                    )}
                </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                >
                Əvvəlki
                </Button>
                <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                >
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
            <h1 className="text-3xl font-bold">Şirkət Təsdiqləri</h1>
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
            </TabsList>
            <TabsContent value="pending" className="mt-4">{renderContent()}</TabsContent>
            <TabsContent value="approved" className="mt-4">{renderContent()}</TabsContent>
        </Tabs>
      </main>
    </>
  );
}
