import type { Location, User, Restaurant, MenuItemCatalog, RestaurantMenuItem, Review } from '../types';
import { locations } from './locations';
import { users } from './users';
import { restaurants } from './restaurants';
import { menuCatalog } from './menuCatalog';
import { restaurantMenuItems } from './restaurantMenuItems';
import { reviews } from './reviews';
import { scenarios, type Scenario } from './scenarios';
import { remedyTable } from './remedyTable';

export interface SeedData {
  locations: Location[];
  users: User[];
  restaurants: Restaurant[];
  menuCatalog: MenuItemCatalog[];
  restaurantMenuItems: RestaurantMenuItem[];
  reviews: Review[];
  scenarios: Scenario[];
}

// All entity arrays assembled into one immutable bundle. Services receive it as a plain
// argument. `remedyTable` is NOT part of SeedData (imported directly by remedyService).
export const seed: SeedData = {
  locations,
  users,
  restaurants,
  menuCatalog,
  restaurantMenuItems,
  reviews,
  scenarios,
};

/**
 * Dev-only referential-integrity assertions (data-plan §9). Returns a list of problems;
 * empty means the seed is valid. Called once at boot in dev (see main/App) so a dangling
 * reference surfaces immediately rather than silently breaking peer comparison or impact math.
 */
export function validateSeed(data: SeedData = seed): string[] {
  const problems: string[] = [];
  const rmiById = new Map(data.restaurantMenuItems.map((m) => [m.id, m]));
  const restById = new Map(data.restaurants.map((r) => [r.id, r]));
  const catById = new Map(data.menuCatalog.map((c) => [c.id, c]));
  const locById = new Map(data.locations.map((l) => [l.id, l]));
  const userById = new Map(data.users.map((u) => [u.id, u]));
  const reviewById = new Map(data.reviews.map((rv) => [rv.id, rv]));

  // Reviews: referential integrity + denormalization consistency
  for (const rv of data.reviews) {
    const rmi = rmiById.get(rv.restaurantMenuItemId);
    if (!rmi) { problems.push(`Review ${rv.id}: unknown restaurantMenuItemId ${rv.restaurantMenuItemId}`); continue; }
    if (rmi.restaurantId !== rv.restaurantId) problems.push(`Review ${rv.id}: restaurantId mismatch`);
    if (rmi.catalogItemId !== rv.catalogItemId) problems.push(`Review ${rv.id}: catalogItemId mismatch`);
    if (!catById.has(rv.catalogItemId)) problems.push(`Review ${rv.id}: unknown catalogItemId ${rv.catalogItemId}`);
    if (!restById.has(rv.restaurantId)) problems.push(`Review ${rv.id}: unknown restaurantId`);
    if (!locById.has(rv.locationId)) problems.push(`Review ${rv.id}: unknown locationId`);
    if (rv.rating < 1 || rv.rating > 5) problems.push(`Review ${rv.id}: rating out of domain`);
  }

  // Restaurants: ownership 1:1 + menu wiring
  for (const rest of data.restaurants) {
    if (!userById.has(rest.ownerId)) problems.push(`Restaurant ${rest.id}: unknown ownerId`);
    if (!locById.has(rest.locationId)) problems.push(`Restaurant ${rest.id}: unknown locationId`);
    for (const mid of rest.menuItemIds) {
      const rmi = rmiById.get(mid);
      if (!rmi) problems.push(`Restaurant ${rest.id}: unknown menuItemId ${mid}`);
      else if (rmi.restaurantId !== rest.id) problems.push(`Restaurant ${rest.id}: menuItem ${mid} belongs to another restaurant`);
    }
  }

  // >=10 baseline reviews per restaurant
  for (const rest of data.restaurants) {
    const count = data.reviews.filter((rv) => rv.restaurantId === rest.id && rv.phase === 'baseline').length;
    if (count < 10) problems.push(`Restaurant ${rest.id}: only ${count} baseline reviews (need >=10)`);
  }

  // Scenario integrity
  for (const s of data.scenarios) {
    if (!restById.has(s.restaurantId)) problems.push(`Scenario ${s.id}: unknown restaurantId`);
    const allIds = [...s.baselineReviewIds, ...s.postActionReviewIds];
    for (const id of allIds) {
      const rv = reviewById.get(id);
      if (!rv) { problems.push(`Scenario ${s.id}: unknown reviewId ${id}`); continue; }
      if (rv.restaurantId !== s.restaurantId) problems.push(`Scenario ${s.id}: review ${id} belongs to another restaurant`);
    }
    for (const id of s.baselineReviewIds) {
      const rv = reviewById.get(id);
      if (rv && rv.phase !== 'baseline') problems.push(`Scenario ${s.id}: baseline review ${id} is not phase baseline`);
      if (rv && rv.date >= s.actionDate) problems.push(`Scenario ${s.id}: baseline review ${id} dated on/after actionDate`);
    }
    for (const id of s.postActionReviewIds) {
      const rv = reviewById.get(id);
      if (rv && rv.phase !== 'post-action') problems.push(`Scenario ${s.id}: post-action review ${id} is not phase post-action`);
      if (rv && rv.date < s.actionDate) problems.push(`Scenario ${s.id}: post-action review ${id} dated before actionDate`);
    }
    const tiers = remedyTable[s.targetCategory] ?? [];
    if (!tiers.some((r) => r.id === s.seededRemedyTier1Id)) problems.push(`Scenario ${s.id}: tier-1 remedy ${s.seededRemedyTier1Id} not in remedyTable`);
    if (!tiers.some((r) => r.id === s.seededRemedyTier2Id)) problems.push(`Scenario ${s.id}: tier-2 remedy ${s.seededRemedyTier2Id} not in remedyTable`);
    if (s.targetCatalogItemId) {
      const offerers = new Set(data.restaurantMenuItems.filter((m) => m.catalogItemId === s.targetCatalogItemId).map((m) => m.restaurantId));
      if (offerers.size < 2) problems.push(`Scenario ${s.id}: targetCatalogItem ${s.targetCatalogItemId} offered by <2 restaurants (no peers)`);
    }
  }

  return problems;
}
