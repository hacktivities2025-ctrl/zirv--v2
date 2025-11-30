import type { LucideIcon } from "lucide-react";
import { Bed, UtensilsCrossed, Landmark, Soup } from 'lucide-react';

export const AUTH_TOKEN_COOKIE = "firebase-auth-token";

type Category = {
  id: 'hotels' | 'restaurants' | 'attractions' | 'cuisine';
  name: string; // English name
  name_az: string; // Azerbaijani name
  name_ru?: string; // Russian name (optional)
  icon: LucideIcon;
};

export const CATEGORIES: Category[] = [
  { id: 'hotels', name: 'Hotels', name_az: 'Otellər', name_ru: 'Отели', icon: Bed },
  { id: 'restaurants', name: 'Restaurants', name_az: 'Restoranlar', name_ru: 'Рестораны', icon: UtensilsCrossed },
  { id: 'cuisine', name: 'Cuisine', name_az: 'Mətbəx', name_ru: 'Кухня', icon: Soup },
  { id: 'attractions', name: 'Attractions', name_az: 'Görməli Yerlər', name_ru: 'Достопримечательности', icon: Landmark },
];
