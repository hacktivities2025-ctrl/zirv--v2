import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Footer from '@/components/app/footer';
import { FirebaseClientProvider } from '@/firebase';
import ChatAssistant from '@/components/app/chat/chat-assistant';
import { ThemeProvider } from '@/components/app/theme-provider';
import { AnimationProvider } from '@/components/app/animation-provider';
import { ReadingModeProvider } from '@/components/app/reading-mode-provider';


export const metadata: Metadata = {
  title: 'Zirvə',
  description: 'Your guide to exploring the world.',
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%233B82F6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m8 3 4 8 5-5 5 15H2L8 3z'%3E%3C/path%3E%3C/svg%3E",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased flex flex-col min-h-screen bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <FirebaseClientProvider>
            <AnimationProvider>
              <ReadingModeProvider>
                <div className="flex-grow">
                  {children}
                </div>
                <ChatAssistant />
                <Footer />
                <Toaster />
              </ReadingModeProvider>
            </AnimationProvider>
          </FirebaseClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
