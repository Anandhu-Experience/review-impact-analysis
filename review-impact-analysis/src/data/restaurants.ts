import type { Restaurant } from '../types';

// 10 restaurants; menuItemIds reference RestaurantMenuItem ids. Locations are shared 2:1.
export const restaurants: Restaurant[] = [
  { id: 'rst-01', name: 'Bella Napoli', ownerId: 'usr-01', locationId: 'loc-01', cuisine: 'Italian', priceTier: 3, menuItemIds: ['rmi-01-01', 'rmi-01-05', 'rmi-01-02', 'rmi-01-08'] },
  { id: 'rst-02', name: 'Sakura Sushi', ownerId: 'usr-02', locationId: 'loc-02', cuisine: 'Japanese', priceTier: 3, menuItemIds: ['rmi-02-06', 'rmi-02-02', 'rmi-02-11'] },
  { id: 'rst-03', name: 'The Curry House', ownerId: 'usr-03', locationId: 'loc-03', cuisine: 'Indian', priceTier: 2, menuItemIds: ['rmi-03-04', 'rmi-03-10', 'rmi-03-11'] },
  { id: 'rst-04', name: 'Burger Barn', ownerId: 'usr-04', locationId: 'loc-04', cuisine: 'American', priceTier: 2, menuItemIds: ['rmi-04-03', 'rmi-04-09', 'rmi-04-12'] },
  { id: 'rst-05', name: 'Thai Orchid', ownerId: 'usr-05', locationId: 'loc-05', cuisine: 'Thai', priceTier: 2, menuItemIds: ['rmi-05-07', 'rmi-05-11', 'rmi-05-08'] },
  { id: 'rst-06', name: 'Pizza Corner', ownerId: 'usr-06', locationId: 'loc-01', cuisine: 'Pizza', priceTier: 2, menuItemIds: ['rmi-06-01', 'rmi-06-05', 'rmi-06-12', 'rmi-06-08'] },
  { id: 'rst-07', name: 'Mediterraneo', ownerId: 'usr-07', locationId: 'loc-03', cuisine: 'Mediterranean', priceTier: 2, menuItemIds: ['rmi-07-01', 'rmi-07-02', 'rmi-07-04', 'rmi-07-10'] },
  { id: 'rst-08', name: 'Green Fork', ownerId: 'usr-08', locationId: 'loc-04', cuisine: 'Healthy', priceTier: 2, menuItemIds: ['rmi-08-02', 'rmi-08-03', 'rmi-08-07', 'rmi-08-12'] },
  { id: 'rst-09', name: 'Ocean Catch', ownerId: 'usr-09', locationId: 'loc-02', cuisine: 'Seafood', priceTier: 3, menuItemIds: ['rmi-09-06', 'rmi-09-09', 'rmi-09-02'] },
  { id: 'rst-10', name: 'Café Aroma', ownerId: 'usr-10', locationId: 'loc-05', cuisine: 'Café', priceTier: 1, menuItemIds: ['rmi-10-01', 'rmi-10-02', 'rmi-10-03', 'rmi-10-08', 'rmi-10-11'] },
];
