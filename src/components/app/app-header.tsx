import Link from 'next/link';
import { Button } from '../ui/button';
import { Mountain, Languages, Check, Headset, Ear, PenSquare, Moon, Sun, Laptop, Menu, LogIn, UserPlus, User as UserIcon, Trophy } from 'lucide-react';
import ContactUs from './contact-us';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu"
import { cn } from '@/lib/utils';
import { useAnimation } from '../app/animation-provider';
import React from 'react';
import { useReadingMode } from './reading-mode-provider';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useUser } from '@/firebase';
import { LogoutButton } from './logout-button';

interface LanguageSwitcherProps {
  currentLang: 'az' | 'en';
  setLang: (lang: 'az' | 'en') => void;
  translations: any;
}

const languages = [
    { code: 'az', name: 'AZ', flag: '🇦🇿' },
    { code: 'en', name: 'EN', flag: '🇬🇧' },
] as const;

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ currentLang, setLang, translations }) => {
  const { triggerAnimation } = useAnimation();
  
  const handleLanguageChange = (e: Event, langCode: 'az' | 'en') => {
      e.preventDefault();
      triggerAnimation({
          icon: Languages,
          onAnimationEnd: () => setLang(langCode)
      });
  }

  return (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
            <Languages className="mr-2 h-4 w-4" />
            <span>{translations.change_language}</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuPortal>
            <DropdownMenuSubContent>
                {languages.map((lang) => (
                    <DropdownMenuItem key={lang.code} onSelect={(e) => handleLanguageChange(e, lang.code)}>
                        <span className={cn("flex w-full items-center justify-between", currentLang === lang.code && "font-bold")}>
                            <span>{lang.flag} {lang.name === 'AZ' ? 'Azərbaycanca' : 'English'}</span>
                            {currentLang === lang.code && <Check className="h-4 w-4" />}
                        </span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuSubContent>
        </DropdownMenuPortal>
    </DropdownMenuSub>
  );
};

const ReadingModeToggle = ({ translations }: { translations: any }) => {
    const { isReadingMode, toggleReadingMode } = useReadingMode();
    const { triggerAnimation } = useAnimation();

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        triggerAnimation({
            icon: Ear,
            onAnimationEnd: toggleReadingMode
        });
    }

    return (
        <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={handleClick} className={cn(isReadingMode && 'bg-accent')}>
             <Ear className="mr-2 h-4 w-4" />
             <span>{translations.reading_mode}</span>
        </DropdownMenuItem>
    )
}

function ThemeToggle({ translations }: { translations: any }) {
  const { setTheme } = useTheme();
  const { triggerAnimation } = useAnimation();

  const handleThemeChange = (newTheme: string) => {
    let Icon;
    
    if (newTheme === 'light') {
        Icon = Sun;
    } else if (newTheme === 'dark') {
        Icon = Moon;
    } else { // 'system'
        Icon = Laptop;
    }
    
    triggerAnimation({
        icon: Icon,
        onAnimationEnd: () => setTheme(newTheme)
    });
  };

  return (
    <DropdownMenuSub>
        <DropdownMenuSubTrigger>
            <Sun className="mr-2 h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute mr-2 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
             <span>{translations.toggle_theme}</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuPortal>
            <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => handleThemeChange('light')}>
                  <Sun className="mr-2 h-4 w-4" />
                  <span>{translations.light}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleThemeChange('dark')}>
                  <Moon className="mr-2 h-4 w-4" />
                  <span>{translations.dark}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleThemeChange('system')}>
                  <Laptop className="mr-2 h-4 w-4" />
                  <span>{translations.system}</span>
                </DropdownMenuItem>
            </DropdownMenuSubContent>
        </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}

interface AppHeaderProps {
    isAdmin?: boolean;
    lang?: 'az' | 'en';
    setLang?: (lang: 'az' | 'en') => void;
}

const AppHeader = ({ isAdmin = false, lang, setLang }: AppHeaderProps) => {
  const router = useRouter();
  const { user, isUserLoading, profile } = useUser();
    
    const t = (lang: 'az' | 'en' = 'az') => ({
      az: {
        brand_by: 'Hacktivities tərəfindən',
        change_language: 'Dili dəyişdir',
        contact_us: 'Bizimlə əlaqə',
        communication_aid: 'Ünsiyyət köməkçisi',
        reading_mode: 'Oxuma rejimi',
        toggle_theme: 'Tema seçimi',
        light: 'İşıqlı',
        dark: 'Tünd',
        system: 'Sistem',
        login: 'Giriş',
        signup: 'Qeydiyyat',
        profile: 'Profil',
        my_account: 'Hesabım',
        coupons: 'Kuponlar',
        tasks: 'Tapşırıqlar',
        logout: 'Çıxış',
        scoreboard: 'Reytinq Cədvəli'
      },
      en: {
        brand_by: 'by Hacktivities',
        change_language: 'Change language',
        contact_us: 'Contact Us',
        communication_aid: 'Communication Aid',
        reading_mode: 'Reading Mode',
        toggle_theme: 'Toggle theme',
        light: 'Light',
        dark: 'Dark',
        system: 'System',
        login: 'Log In',
        signup: 'Sign Up',
        profile: 'Profile',
        my_account: 'My Account',
        coupons: 'Coupons',
        tasks: 'Tasks',
        logout: 'Logout',
        scoreboard: 'Scoreboard'
      },
    }[lang]);
    
  const translations = t(lang);

  const renderAuthSection = () => {
    if (isUserLoading) {
        return null; // Or a loading spinner
    }

    if (user) {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost">
                        <UserIcon className="mr-2" />
                        {translations.profile}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => router.push('/profile')}>
                        {translations.my_account}
                    </DropdownMenuItem>
                    {profile?.role === 'user' && (
                        <>
                            <DropdownMenuItem onSelect={() => router.push('/profile?tab=coupons')}>
                                {translations.coupons}
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => router.push('/profile?tab=tasks')}>
                                {translations.tasks}
                            </DropdownMenuItem>
                        </>
                    )}
                    <DropdownMenuSeparator />
                    <LogoutButton isDropdownItem={true} />
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
                <Link href="/login">
                    <LogIn className="mr-2" />
                    {translations.login}
                </Link>
            </Button>
            <Button asChild>
                <Link href="/register">
                    <UserPlus className="mr-2" />
                    {translations.signup}
                </Link>
            </Button>
        </div>
    );
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href={isAdmin ? "/admin" : "/home"} className="flex items-center gap-2">
          <Mountain className="h-8 w-8 text-primary" />
          <div>
            <span className="text-lg font-bold">Zirvə</span>
            {lang === 'az' && <p className="text-xs text-muted-foreground -mt-1">{translations.brand_by}</p>}
            {lang === 'en' && <p className="text-xs text-muted-foreground -mt-1">{translations.brand_by}</p>}
          </div>
        </Link>
        <nav className="flex items-center gap-4">
          {!isAdmin && (
            <div className="hidden md:flex items-center gap-2">
                {renderAuthSection()}
            </div>
          )}
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                        <Menu className="h-5 w-5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                     {lang && setLang && <LanguageSwitcher currentLang={lang} setLang={setLang} translations={translations} />}
                     {lang && <ContactUs lang={lang} translations={{...translations}} />}
                     <DropdownMenuItem onSelect={() => router.push('/communication-aid')}>
                        <PenSquare className="mr-2 h-4 w-4" />
                        <span>{translations.communication_aid}</span>
                     </DropdownMenuItem>
                     <DropdownMenuItem onSelect={() => router.push(isAdmin ? '/admin/scoreboard' : '/scoreboard')}>
                        <Trophy className="mr-2 h-4 w-4" />
                        <span>{translations.scoreboard}</span>
                     </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <ReadingModeToggle translations={translations} />
                    <ThemeToggle translations={translations} />
                     {!isAdmin && (
                        <div className="md:hidden">
                            <DropdownMenuSeparator />
                             {user ? (
                                <>
                                    <DropdownMenuItem onSelect={() => router.push('/profile')}>
                                        {translations.my_account}
                                    </DropdownMenuItem>
                                     {profile?.role === 'user' && (
                                        <>
                                            <DropdownMenuItem onSelect={() => router.push('/profile?tab=coupons')}>
                                                {translations.coupons}
                                            </DropdownMenuItem>
                                             <DropdownMenuItem onSelect={() => router.push('/profile?tab=tasks')}>
                                                {translations.tasks}
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                    <DropdownMenuSeparator />
                                    <LogoutButton isDropdownItem={true} />
                                </>
                            ) : (
                                <>
                                    <DropdownMenuItem onSelect={() => router.push('/login')}>
                                        <LogIn className="mr-2" />
                                        {translations.login}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => router.push('/register')}>
                                        <UserPlus className="mr-2" />
                                        {translations.signup}
                                    </DropdownMenuItem>
                                </>
                            )}
                        </div>
                    )}
                </DropdownMenuContent>
             </DropdownMenu>
        </nav>
      </div>
    </header>
  );
};

export default AppHeader;

