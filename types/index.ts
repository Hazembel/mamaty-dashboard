
export interface User {
  _id: string;
  name: string;
  lastname: string;
  email: string;
  phone: string;
  avatar?: string;
  gender?: 'male' | 'female' | 'other';
  birthday?: string;
  createdAt?: string;
  password?: string;
  role?: 'user' | 'admin';
  // Relations
  babies?: Baby[];
  doctors?: Doctor[];
  recipes?: Recipe[];
  articles?: Article[];
}

export interface PopulatedUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
}

export interface Baby {
  _id: string;
  name: string;
  gender?: 'Male' | 'Female';
  birthday?: string;
  disease?: string;
  allergy?: string;
  autorisation?: boolean;
  headSize?: number;
  height?: number;
  weight?: number;
  lastheadsizeUpdate?: string;
  userId: PopulatedUser;
  createdAt?: string;
}

export interface Doctor {
  _id: string;
  name: string;
  specialty: string;
  rating: number;
  city: string;
  imageUrl?: string;
  description?: string;
  workTime?: string;
  phone?: string;
  googleMapLink?: string;
  appStoreLink?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AgeRange {
  minDay: number;
  maxDay: number;
}

export interface Category {
  _id: string;
  name: string;
  contentTypes: ('article' | 'advice' | 'recipe')[];
  ageRanges: AgeRange[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Advice {
  _id: string;
  title: string;
  description: string[];
  sources: string[];
  imageUrl: string[];
  category: Category | string; // Populated object or ID string
  day?: number | null;
  minDay?: number | null;
  maxDay?: number | null;
  likes?: string[];
  dislikes?: string[];
  viewers?: string[];
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Article {
  _id: string;
  title: string;
  description: string[];
  sources: string[];
  imageUrl: string[];
  category: Category | string;
  likes?: string[];
  dislikes?: string[];
  viewers?: string[];
  isActive?: boolean;
  scheduledAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface Recipe {
  _id: string;
  title: string;
  description: string;
  ingredients: Ingredient[];
  instructions: string[];
  imageUrl: string;
  videoUrl?: string;
  category: Category | string;
  city?: string;
  sources?: string[];
  rating: number;
  minDay?: number;
  maxDay?: number;
  likes?: string[];
  dislikes?: string[];
  viewers?: string[];
  isActive?: boolean;
  scheduledAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface FAQ {
  _id: string;
  question: string;
  answer: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SocialItem {
  _id?: string;
  icon: string;
  title: string;
  subtitle: string;
  url: string;
}

export interface ContactInfo {
  _id: string;
  phone: string;
  email: string;
  description: string;
  socials: SocialItem[];
  createdAt?: string;
  updatedAt?: string;
}
