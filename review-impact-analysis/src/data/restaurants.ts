import type { Restaurant } from '../types';

// 10 restaurants; menuItemIds reference RestaurantMenuItem ids. Locations are shared 2:1.
export const restaurants: Restaurant[] = [
  { id: 'rst-01', name: 'Bella Napoli', ownerId: 'usr-01', locationId: 'loc-01', cuisine: 'Italian', priceTier: 3, menuItemIds: ['rmi-01-01', 'rmi-01-05', 'rmi-01-02', 'rmi-01-08', 'rmi-01-13', 'rmi-01-19', 'rmi-01-16'] },
  { id: 'rst-02', name: 'Sakura Sushi', ownerId: 'usr-02', locationId: 'loc-02', cuisine: 'Japanese', priceTier: 3, menuItemIds: ['rmi-02-06', 'rmi-02-02', 'rmi-02-11', 'rmi-02-23', 'rmi-02-17', 'rmi-02-20'] },
  { id: 'rst-03', name: 'The Curry House', ownerId: 'usr-03', locationId: 'loc-03', cuisine: 'Indian', priceTier: 2, menuItemIds: ['rmi-03-04', 'rmi-03-10', 'rmi-03-11', 'rmi-03-18', 'rmi-03-24'] },
  { id: 'rst-04', name: 'Burger Barn', ownerId: 'usr-04', locationId: 'loc-04', cuisine: 'American', priceTier: 2, menuItemIds: ['rmi-04-03', 'rmi-04-09', 'rmi-04-12', 'rmi-04-15', 'rmi-04-22', 'rmi-04-26'] },
  { id: 'rst-05', name: 'Thai Orchid', ownerId: 'usr-05', locationId: 'loc-05', cuisine: 'Thai', priceTier: 2, menuItemIds: ['rmi-05-07', 'rmi-05-11', 'rmi-05-08', 'rmi-05-17', 'rmi-05-24', 'rmi-05-25'] },
  { id: 'rst-06', name: 'Pizza Corner', ownerId: 'usr-06', locationId: 'loc-01', cuisine: 'Pizza', priceTier: 2, menuItemIds: ['rmi-06-01', 'rmi-06-05', 'rmi-06-12', 'rmi-06-08', 'rmi-06-13', 'rmi-06-15', 'rmi-06-19'] },
  { id: 'rst-07', name: 'Mediterraneo', ownerId: 'usr-07', locationId: 'loc-03', cuisine: 'Mediterranean', priceTier: 2, menuItemIds: ['rmi-07-01', 'rmi-07-02', 'rmi-07-04', 'rmi-07-10', 'rmi-07-13', 'rmi-07-14', 'rmi-07-18', 'rmi-07-19', 'rmi-07-20'] },
  { id: 'rst-08', name: 'Green Fork', ownerId: 'usr-08', locationId: 'loc-04', cuisine: 'Healthy', priceTier: 2, menuItemIds: ['rmi-08-02', 'rmi-08-03', 'rmi-08-07', 'rmi-08-12', 'rmi-08-14', 'rmi-08-17', 'rmi-08-21', 'rmi-08-25', 'rmi-08-16'] },
  { id: 'rst-09', name: 'Ocean Catch', ownerId: 'usr-09', locationId: 'loc-02', cuisine: 'Seafood', priceTier: 3, menuItemIds: ['rmi-09-06', 'rmi-09-09', 'rmi-09-02', 'rmi-09-15', 'rmi-09-22', 'rmi-09-23'] },
  { id: 'rst-10', name: 'Café Aroma', ownerId: 'usr-10', locationId: 'loc-05', cuisine: 'Café', priceTier: 1, menuItemIds: ['rmi-10-01', 'rmi-10-02', 'rmi-10-03', 'rmi-10-08', 'rmi-10-11', 'rmi-10-14', 'rmi-10-20', 'rmi-10-21', 'rmi-10-25', 'rmi-10-26'] },
];
