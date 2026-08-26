import type { Location } from '../types';

// 5 locations, each shared by 2 restaurants (multi-location peer graph).
export const locations: Location[] = [
  { id: 'loc-01', name: 'Downtown Food Court', address: '12 Market St', city: 'Metro City' },
  { id: 'loc-02', name: 'Riverside Walk', address: '48 River Rd', city: 'Metro City' },
  { id: 'loc-03', name: 'Uptown Plaza', address: '90 Plaza Ave', city: 'Metro City' },
  { id: 'loc-04', name: 'Suburb Mall', address: '5 Mall Loop', city: 'Lakeside' },
  { id: 'loc-05', name: 'Midtown Strip', address: '77 Midtown Blvd', city: 'Metro City' },
];
