import type { RestaurantMenuItem } from '../types';

// Each restaurant's concrete offerings, with its own price. Prices spread by tier so peer price
// deltas are meaningful. Peer comparison joins on catalogItemId; nearly every catalog item is
// offered by 2+ restaurants so similar products can be compared.
export const restaurantMenuItems: RestaurantMenuItem[] = [
  // rst-01 Bella Napoli (Italian, tier 3)
  { id: 'rmi-01-01', restaurantId: 'rst-01', catalogItemId: 'cat-01', price: 16.0 },
  { id: 'rmi-01-05', restaurantId: 'rst-01', catalogItemId: 'cat-05', price: 17.0 },
  { id: 'rmi-01-02', restaurantId: 'rst-01', catalogItemId: 'cat-02', price: 12.0 },
  { id: 'rmi-01-08', restaurantId: 'rst-01', catalogItemId: 'cat-08', price: 9.0 },
  { id: 'rmi-01-13', restaurantId: 'rst-01', catalogItemId: 'cat-13', price: 17.0 },
  { id: 'rmi-01-19', restaurantId: 'rst-01', catalogItemId: 'cat-19', price: 8.5 },
  { id: 'rmi-01-16', restaurantId: 'rst-01', catalogItemId: 'cat-16', price: 7.0 },
  // rst-02 Sakura Sushi (Japanese, tier 3)
  { id: 'rmi-02-06', restaurantId: 'rst-02', catalogItemId: 'cat-06', price: 15.0 },
  { id: 'rmi-02-02', restaurantId: 'rst-02', catalogItemId: 'cat-02', price: 11.0 },
  { id: 'rmi-02-11', restaurantId: 'rst-02', catalogItemId: 'cat-11', price: 5.5 },
  { id: 'rmi-02-23', restaurantId: 'rst-02', catalogItemId: 'cat-23', price: 4.0 },
  { id: 'rmi-02-17', restaurantId: 'rst-02', catalogItemId: 'cat-17', price: 7.0 },
  { id: 'rmi-02-20', restaurantId: 'rst-02', catalogItemId: 'cat-20', price: 5.0 },
  // rst-03 The Curry House (Indian, tier 2)
  { id: 'rmi-03-04', restaurantId: 'rst-03', catalogItemId: 'cat-04', price: 15.0 },
  { id: 'rmi-03-10', restaurantId: 'rst-03', catalogItemId: 'cat-10', price: 4.0 },
  { id: 'rmi-03-11', restaurantId: 'rst-03', catalogItemId: 'cat-11', price: 5.0 },
  { id: 'rmi-03-18', restaurantId: 'rst-03', catalogItemId: 'cat-18', price: 15.0 },
  { id: 'rmi-03-24', restaurantId: 'rst-03', catalogItemId: 'cat-24', price: 14.0 },
  // rst-04 Burger Barn (American, tier 2)
  { id: 'rmi-04-03', restaurantId: 'rst-04', catalogItemId: 'cat-03', price: 12.0 },
  { id: 'rmi-04-09', restaurantId: 'rst-04', catalogItemId: 'cat-09', price: 14.0 },
  { id: 'rmi-04-12', restaurantId: 'rst-04', catalogItemId: 'cat-12', price: 5.0 },
  { id: 'rmi-04-15', restaurantId: 'rst-04', catalogItemId: 'cat-15', price: 10.0 },
  { id: 'rmi-04-22', restaurantId: 'rst-04', catalogItemId: 'cat-22', price: 18.0 },
  { id: 'rmi-04-26', restaurantId: 'rst-04', catalogItemId: 'cat-26', price: 4.0 },
  // rst-05 Thai Orchid (Thai, tier 2) — Scenario 5 host (WaitingTime, cat-07)
  { id: 'rmi-05-07', restaurantId: 'rst-05', catalogItemId: 'cat-07', price: 14.0 },
  { id: 'rmi-05-11', restaurantId: 'rst-05', catalogItemId: 'cat-11', price: 5.0 },
  { id: 'rmi-05-08', restaurantId: 'rst-05', catalogItemId: 'cat-08', price: 8.5 },
  { id: 'rmi-05-17', restaurantId: 'rst-05', catalogItemId: 'cat-17', price: 7.0 },
  { id: 'rmi-05-24', restaurantId: 'rst-05', catalogItemId: 'cat-24', price: 14.0 },
  { id: 'rmi-05-25', restaurantId: 'rst-05', catalogItemId: 'cat-25', price: 7.0 },
  // rst-06 Pizza Corner (Pizza, tier 2) — Scenario 6 host (Quality, cat-01)
  { id: 'rmi-06-01', restaurantId: 'rst-06', catalogItemId: 'cat-01', price: 13.5 },
  { id: 'rmi-06-05', restaurantId: 'rst-06', catalogItemId: 'cat-05', price: 15.0 },
  { id: 'rmi-06-12', restaurantId: 'rst-06', catalogItemId: 'cat-12', price: 4.5 },
  { id: 'rmi-06-08', restaurantId: 'rst-06', catalogItemId: 'cat-08', price: 8.0 },
  { id: 'rmi-06-13', restaurantId: 'rst-06', catalogItemId: 'cat-13', price: 14.5 },
  { id: 'rmi-06-15', restaurantId: 'rst-06', catalogItemId: 'cat-15', price: 9.5 },
  { id: 'rmi-06-19', restaurantId: 'rst-06', catalogItemId: 'cat-19', price: 8.0 },
  // rst-07 Mediterraneo (Mediterranean, tier 2) — strong performer / peer supply
  { id: 'rmi-07-01', restaurantId: 'rst-07', catalogItemId: 'cat-01', price: 14.0 },
  { id: 'rmi-07-02', restaurantId: 'rst-07', catalogItemId: 'cat-02', price: 11.5 },
  { id: 'rmi-07-04', restaurantId: 'rst-07', catalogItemId: 'cat-04', price: 14.0 },
  { id: 'rmi-07-10', restaurantId: 'rst-07', catalogItemId: 'cat-10', price: 4.0 },
  { id: 'rmi-07-13', restaurantId: 'rst-07', catalogItemId: 'cat-13', price: 14.5 },
  { id: 'rmi-07-14', restaurantId: 'rst-07', catalogItemId: 'cat-14', price: 12.0 },
  { id: 'rmi-07-18', restaurantId: 'rst-07', catalogItemId: 'cat-18', price: 14.5 },
  { id: 'rmi-07-19', restaurantId: 'rst-07', catalogItemId: 'cat-19', price: 8.5 },
  { id: 'rmi-07-20', restaurantId: 'rst-07', catalogItemId: 'cat-20', price: 4.5 },
  // rst-08 Green Fork (Healthy, tier 2) — strong service/waiting/cleanliness / peer supply
  { id: 'rmi-08-02', restaurantId: 'rst-08', catalogItemId: 'cat-02', price: 10.5 },
  { id: 'rmi-08-03', restaurantId: 'rst-08', catalogItemId: 'cat-03', price: 11.0 },
  { id: 'rmi-08-07', restaurantId: 'rst-08', catalogItemId: 'cat-07', price: 13.0 },
  { id: 'rmi-08-12', restaurantId: 'rst-08', catalogItemId: 'cat-12', price: 4.5 },
  { id: 'rmi-08-14', restaurantId: 'rst-08', catalogItemId: 'cat-14', price: 11.0 },
  { id: 'rmi-08-17', restaurantId: 'rst-08', catalogItemId: 'cat-17', price: 6.5 },
  { id: 'rmi-08-21', restaurantId: 'rst-08', catalogItemId: 'cat-21', price: 9.0 },
  { id: 'rmi-08-25', restaurantId: 'rst-08', catalogItemId: 'cat-25', price: 6.5 },
  { id: 'rmi-08-16', restaurantId: 'rst-08', catalogItemId: 'cat-16', price: 6.0 },
  // rst-09 Ocean Catch (Seafood, tier 3) — good quality, pricey / peer supply
  { id: 'rmi-09-06', restaurantId: 'rst-09', catalogItemId: 'cat-06', price: 13.5 },
  { id: 'rmi-09-09', restaurantId: 'rst-09', catalogItemId: 'cat-09', price: 15.0 },
  { id: 'rmi-09-02', restaurantId: 'rst-09', catalogItemId: 'cat-02', price: 12.0 },
  { id: 'rmi-09-15', restaurantId: 'rst-09', catalogItemId: 'cat-15', price: 11.0 },
  { id: 'rmi-09-22', restaurantId: 'rst-09', catalogItemId: 'cat-22', price: 19.0 },
  { id: 'rmi-09-23', restaurantId: 'rst-09', catalogItemId: 'cat-23', price: 4.5 },
  // rst-10 Café Aroma (Café, tier 1) — great value, friendly / peer supply
  { id: 'rmi-10-01', restaurantId: 'rst-10', catalogItemId: 'cat-01', price: 11.0 },
  { id: 'rmi-10-02', restaurantId: 'rst-10', catalogItemId: 'cat-02', price: 9.5 },
  { id: 'rmi-10-03', restaurantId: 'rst-10', catalogItemId: 'cat-03', price: 10.0 },
  { id: 'rmi-10-08', restaurantId: 'rst-10', catalogItemId: 'cat-08', price: 6.5 },
  { id: 'rmi-10-11', restaurantId: 'rst-10', catalogItemId: 'cat-11', price: 4.5 },
  { id: 'rmi-10-14', restaurantId: 'rst-10', catalogItemId: 'cat-14', price: 9.0 },
  { id: 'rmi-10-20', restaurantId: 'rst-10', catalogItemId: 'cat-20', price: 4.0 },
  { id: 'rmi-10-21', restaurantId: 'rst-10', catalogItemId: 'cat-21', price: 8.0 },
  { id: 'rmi-10-25', restaurantId: 'rst-10', catalogItemId: 'cat-25', price: 6.0 },
  { id: 'rmi-10-26', restaurantId: 'rst-10', catalogItemId: 'cat-26', price: 3.5 },
];
