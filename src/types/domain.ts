import type { ProblemCategory, Sentiment, ReviewPhase, Rating } from './enums';

export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'owner';
  restaurantIds: string[];
}

export interface Restaurant {
  id: string;
  name: string;
  ownerId: string;
  locationId: string;
  cuisine: string;
  priceTier: 1 | 2 | 3;
  menuItemIds: string[];
}

// Canonical cross-restaurant item — THE peer-comparison anchor.
export interface MenuItemCatalog {
  id: string;
  name: string;
  foodCategory: string;
}

// A restaurant's concrete offering of a catalog item, with its own price.
export interface RestaurantMenuItem {
  id: string;
  restaurantId: string;
  catalogItemId: string; // FK → MenuItemCatalog.id — enables peer comparison
  price: number;
}

export interface Review {
  id: string;
  restaurantId: string;
  restaurantMenuItemId: string;
  catalogItemId: string; // denormalized for fast peer queries
  rating: Rating;
  comment: string;
  price: number;
  date: string; // ISO, HARDCODED
  locationId: string;
  foodCategory: string;
  phase: ReviewPhase; // baseline vs post-action (demo scripting)
  scenarioId?: string;
  tags?: { categories: ProblemCategory[]; sentiment: Sentiment }; // authored ground truth
}
