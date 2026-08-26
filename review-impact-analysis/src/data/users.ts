import type { User } from '../types';

// 10 owners → 10 restaurants (1:1). Emails are the demo login set.
// marco@bellanapoli.test is the primary demo account; somchai@thaiorchid.test is the
// Scenario-5 hero (Thai Orchid, WaitingTime → Improvement Confirmed).
export const users: User[] = [
  { id: 'usr-01', name: 'Marco Rossi', email: 'marco@bellanapoli.test', role: 'owner', restaurantIds: ['rst-01'] },
  { id: 'usr-02', name: 'Aiko Tanaka', email: 'aiko@sakura.test', role: 'owner', restaurantIds: ['rst-02'] },
  { id: 'usr-03', name: 'Priya Nair', email: 'priya@curryhouse.test', role: 'owner', restaurantIds: ['rst-03'] },
  { id: 'usr-04', name: 'Dale Owens', email: 'dale@burgerbarn.test', role: 'owner', restaurantIds: ['rst-04'] },
  { id: 'usr-05', name: 'Somchai Pat', email: 'somchai@thaiorchid.test', role: 'owner', restaurantIds: ['rst-05'] },
  { id: 'usr-06', name: 'Gina Conti', email: 'gina@pizzacorner.test', role: 'owner', restaurantIds: ['rst-06'] },
  { id: 'usr-07', name: 'Yusuf Demir', email: 'yusuf@mediterraneo.test', role: 'owner', restaurantIds: ['rst-07'] },
  { id: 'usr-08', name: 'Elena Petro', email: 'elena@greenfork.test', role: 'owner', restaurantIds: ['rst-08'] },
  { id: 'usr-09', name: 'Tom Reyes', email: 'tom@oceancatch.test', role: 'owner', restaurantIds: ['rst-09'] },
  { id: 'usr-10', name: 'Nadia Haddad', email: 'nadia@cafearoma.test', role: 'owner', restaurantIds: ['rst-10'] },
];
