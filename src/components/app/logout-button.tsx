'use client';


import { Button } from '@/components/ui/button';
import { LogOut, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { logout } from '@/lib/actions';
import { useTransition } from 'react';
import Cookies from 'js-cookie';

export function LogoutButton({ isDropdownItem = false }: { isDropdownItem?: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logout();
      Cookies.remove('firebase-auth-token');
      Cookies.remove('user_role');
      Cookies.remove('company_status');
      router.push('/login');
      router.refresh();
    });
  };

  const content = (
    <>
      {isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="mr-2 h-4 w-4" />
      )}
      <span>Çıxış</span>
    </>
  );

  if (isDropdownItem) {
    return (
      <button
        onClick={handleLogout}
        disabled={isPending}
        className="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full text-red-500 focus:bg-red-500/10 focus:text-red-500"
      >
        {content}
      </button>
    );
  }

  return (
    <Button
      variant="ghost"
      onClick={handleLogout}
      disabled={isPending}
      className="w-full justify-start text-red-500 hover:bg-red-500/10 hover:text-red-500"
    >
      {content}
    </Button>
  );
}
