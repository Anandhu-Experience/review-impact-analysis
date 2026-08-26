import type { RestaurantMenuItem } from '../types';

// Each restaurant's concrete offerings of catalog items, with its own price.
// Prices spread by tier so peer price deltas are meaningful (e.g. cat-01 Margherita:
// rst-01 $16 > rst-07 $14 > rst-06 $13.5 > rst-10 $11). Peer comparison joins on catalogItemId.
export const restaurantMenuItems: RestaurantMenuItem[] = [
  // rst-01 Bella Napoli (Italian, tier 3)
  { id: 'rmi-01-01', restaurantId: 'rst-01', catalogItemId: 'cat-01', price: 16.0 },
  { id: 'rmi-01-05', restaurantId: 'rst-01', catalogItemId: 'cat-05', price: 17.0 },
  { id: 'rmi-01-02', restaurantId: 'rst-01', catalogItemId: 'cat-02', price: 12.0 },
  { id: 'rmi-01-08', restaurantId: 'rst-01', catalogItemId: 'cat-08', price: 9.0 },
  // rst-02 Sakura Sushi (Japanese, tier 3)
  { id: 'rmi-02-06', restaurantId: 'rst-02', catalogItemId: 'cat-06', price: 15.0 },
  { id: 'rmi-02-02', restaurantId: 'rst-02', catalogItemId: 'cat-02', price: 11.0 },
  { id: 'rmi-02-11', restaurantId: 'rst-02', catalogItemId: 'cat-11', price: 5.5 },
  // rst-03 The Curry House (Indian, tier 2)
  { id: 'rmi-03-04', restaurantId: 'rst-03', catalogItemId: 'cat-04', price: 15.0 },
  { id: 'rmi-03-10', restaurantId: 'rst-03', catalogItemId: 'cat-10', price: 4.0 },
  { id: 'rmi-03-11', restaurantId: 'rst-03', catalogItemId: 'cat-11', price: 5.0 },
  // rst-04 Burger Barn (American, tier 2)
  { id: 'rmi-04-03', restaurantId: 'rst-04', catalogItemId: 'cat-03', price: 12.0 },
  { id: 'rmi-04-09', restaurantId: 'rst-04', catalogItemId: 'cat-09', price: 14.0 },
  { id: 'rmi-04-12', restaurantId: 'rst-04', catalogItemId: 'cat-12', price: 5.0 },
  // rst-05 Thai Orchid (Thai, tier 2) — Scenario 5 host (WaitingTime, cat-07)
  { id: 'rmi-05-07', restaurantId: 'rst-05', catalogItemId: 'cat-07', price: 14.0 },
  { id: 'rmi-05-11', restaurantId: 'rst-05', catalogItemId: 'cat-11', price: 5.0 },
  { id: 'rmi-05-08', restaurantId: 'rst-05', catalogItemId: 'cat-08', price: 8.5 },
  // rst-06 Pizza Corner (Pizza, tier 2) — Scenario 6 host (Quality, cat-01)
  { id: 'rmi-06-01', restaurantId: 'rst-06', catalogItemId: 'cat-01', price: 13.5 },
  { id: 'rmi-06-05', restaurantId: 'rst-06', catalogItemId: 'cat-05', price: 15.0 },
  { id: 'rmi-06-12', restaurantId: 'rst-06', catalogItemId: 'cat-12', price: 4.5 },
  { id: 'rmi-06-08', restaurantId: 'rst-06', catalogItemId: 'cat-08', price: 8.0 },
  // rst-07 Mediterraneo (Mediterranean, tier 2) — peer supply
  { id: 'rmi-07-01', restaurantId: 'rst-07', catalogItemId: 'cat-01', price: 14.0 },
  { id: 'rmi-07-02', restaurantId: 'rst-07', catalogItemId: 'cat-02', price: 11.5 },
  { id: 'rmi-07-04', restaurantId: 'rst-07', catalogItemId: 'cat-04', price: 14.0 },
  { id: 'rmi-07-10', restaurantId: 'rst-07', catalogItemId: 'cat-10', price: 4.0 },
  // rst-08 Green Fork (Healthy, tier 2) — peer supply (cat-07 Pad Thai, cat-03)
  { id: 'rmi-08-02', restaurantId: 'rst-08', catalogItemId: 'cat-02', price: 10.5 },
  { id: 'rmi-08-03', restaurantId: 'rst-08', catalogItemId: 'cat-03', price: 11.0 },
  { id: 'rmi-08-07', restaurantId: 'rst-08', catalogItemId: 'cat-07', price: 13.0 },
  { id: 'rmi-08-12', restaurantId: 'rst-08', catalogItemId: 'cat-12', price: 4.5 },
  // rst-09 Ocean Catch (Seafood, tier 3) — peer supply (cat-06)
  { id: 'rmi-09-06', restaurantId: 'rst-09', catalogItemId: 'cat-06', price: 13.5 },
  { id: 'rmi-09-09', restaurantId: 'rst-09', catalogItemId: 'cat-09', price: 15.0 },
  { id: 'rmi-09-02', restaurantId: 'rst-09', catalogItemId: 'cat-02', price: 12.0 },
  // rst-10 Café Aroma (Café, tier 1) — peer supply (cat-01, cat-02, cat-03)
  { id: 'rmi-10-01', restaurantId: 'rst-10', catalogItemId: 'cat-01', price: 11.0 },
  { id: 'rmi-10-02', restaurantId: 'rst-10', catalogItemId: 'cat-02', price: 9.5 },
  { id: 'rmi-10-03', restaurantId: 'rst-10', catalogItemId: 'cat-03', price: 10.0 },
  { id: 'rmi-10-08', restaurantId: 'rst-10', catalogItemId: 'cat-08', price: 6.5 },
  { id: 'rmi-10-11', restaurantId: 'rst-10', catalogItemId: 'cat-11', price: 4.5 },
];
