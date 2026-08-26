import type { MenuItemCatalog } from '../types';

// 12 canonical dishes. Several are offered by multiple restaurants (the peer-comparison anchor).
export const menuCatalog: MenuItemCatalog[] = [
  { id: 'cat-01', name: 'Margherita Pizza', foodCategory: 'Pizza' },
  { id: 'cat-02', name: 'Caesar Salad', foodCategory: 'Salad' },
  { id: 'cat-03', name: 'Cheeseburger', foodCategory: 'Burger' },
  { id: 'cat-04', name: 'Chicken Tikka Masala', foodCategory: 'Curry' },
  { id: 'cat-05', name: 'Spaghetti Carbonara', foodCategory: 'Pasta' },
  { id: 'cat-06', name: 'California Roll', foodCategory: 'Sushi' },
  { id: 'cat-07', name: 'Pad Thai', foodCategory: 'Noodles' },
  { id: 'cat-08', name: 'Chocolate Lava Cake', foodCategory: 'Dessert' },
  { id: 'cat-09', name: 'Fish & Chips', foodCategory: 'Seafood' },
  { id: 'cat-10', name: 'Garlic Naan', foodCategory: 'Bread' },
  { id: 'cat-11', name: 'Iced Latte', foodCategory: 'Beverage' },
  { id: 'cat-12', name: 'French Fries', foodCategory: 'Sides' },
];
