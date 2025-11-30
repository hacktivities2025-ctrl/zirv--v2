'use client';
import React from 'react';


const Footer = () => {
  const [lang, setLang] = React.useState('az');

  React.useEffect(() => {
    const savedLang = localStorage.getItem('app-lang') || 'az';
    setLang(savedLang);
    
    const handleStorageChange = () => {
      const newLang = localStorage.getItem('app-lang') || 'az';
      setLang(newLang);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('app-lang-change', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('app-lang-change', handleStorageChange);
    };
  }, []);

  return (
    <footer className="w-full bg-background mt-auto py-6">
      <div className="container mx-auto px-4 md:px-6 text-center text-sm text-muted-foreground">
        <p>Zirvə</p>
        <p>{lang === 'az' ? 'Hacktivities tərəfindən' : 'by Hacktivities'}</p>
        <p>&copy; All Rights Reserved - {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
};

export default Footer;
