'use client';
import { z } from 'zod';

export type Mountain = {
  id: string;
  name: string;
  name_en?: string;
  slug: string;
  imageUrl: string;
  description: string;
  description_en?: string;
  price: number;
  height?: number;
  bestSeason?: string;
  difficulty?: 'Asan' | 'Orta' | 'Çətin' | 'Ekstremal';
  latitude?: number;
  longitude?: number;
  temperature?: string;
};

export type InfoCategory = 'hotels' | 'restaurants' | 'attractions' | 'cuisine';

export type InfoItem = {
  id: string;
  mountainId: string;
  mountainSlug: string;
  category: InfoCategory;
  
  name: string; 
  name_en?: string;
  
  description: string;
  description_en?: string;

  imageUrl?: string;
  rating?: number;
  price?: string;
  
  googleMapsUrl?: string;
  
  ingredients?: string; 
  ingredients_en?: string;
  
  menu?: string; 
  address?: string; 
  phone?: string; 
  entranceFee?: string; 

  nearbyRestaurants?: string; 
  nearbyRestaurantImageUrl?: string;
};

export type Reservation = {
  id: string;
  itemId: string;
  itemName: string;
  mountainSlug?: string;
  userName: string;
  email: string;
  date: string;
  time: string;
  guests: number;
  specialRequests?: string;
  createdAt: any;
};

export type Feedback = {
  id: string;
  name: string;
  surname: string;
  email: string;
  message: string;
  createdAt: any;
};

export const TtsInputSchema = z.object({
  text: z.string().describe('The text to be converted to speech.'),
  languageCode: z.string().describe('The language of the text (e.g., "az-AZ", "en-US").'),
});

export type TtsInput = z.infer<typeof TtsInputSchema>;

export const TtsOutputSchema = z.object({
  audioContent: z.string().describe('The base64 encoded audio content.'),
});

export type TtsOutput = z.infer<typeof TtsOutputSchema>;

export const UserProfileSchema = z.object({
  email: z.string().email(),
  role: z.enum(['user', 'agent', 'admin']),
  balance: z.number().default(0),
  toursAttended: z.number().default(0),
  referredBy: z.string().optional(),
  referralBonusClaimed: z.boolean().default(false),
  emergencyContactName: z.string(),
  emergencyContactPhone: z.string(),
  name: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  age: z.number().optional(),
  family: z.number().optional(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

export type Company = {
    id: string;
    userId: string;
    email: string;
    companyName: string;
    phone: string;
    address: string;
    licenseNumber: string;
    description?: string;
    status: 'pending' | 'active' | 'rejected';
    createdAt: any;
}

export type Tour = {
    id: string;
    agentId: string;
    agentName?: string; // Add this
    name: string;
    country: string;
    description: string;
    imageUrl: string;
    durationHours: number;
    price: number;
    hasCoupon: boolean;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: any;
}

export type Coupon = {
    id: string;
    userId: string;
    code: string;
    description: string;
    points: number;
    isUsed: boolean;
    createdAt: any;
}
