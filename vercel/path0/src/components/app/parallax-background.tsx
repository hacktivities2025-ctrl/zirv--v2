'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

const ParallaxBackground = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scale = 1 + scrollY * 0.0005;
  const translateY = scrollY * 0.3;

  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      <div
        className="absolute inset-0 transition-transform duration-100 ease-out"
        style={{
          transform: `scale(${scale}) translateY(${translateY}px)`,
        }}
      >
        <Image
          src="https://images.unsplash.com/photo-1589834375179-423554685f67?q=80&w=2070"
          alt="Mountain background"
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/30 bg-gradient-to-t from-background/50 via-transparent to-transparent"></div>
      </div>
    </div>
    
  );
};

export default ParallaxBackground;
