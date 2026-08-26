import type { PeerComparisonResult, RestaurantMenuItem, Review } from '../types';
import type { SeedData } from '../data/seed';

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

// All OTHER restaurants' offerings of the same catalog item.
export function getPeerItems(catalogItemId: string, excludeRestaurantId: string, data: SeedData): RestaurantMenuItem[] {
  return data.restaurantMenuItems.filter((m) => m.catalogItemId === catalogItemId && m.restaurantId !== excludeRestaurantId);
}

// Baseline reviews for a given restaurant + catalog item (stable regardless of release state).
function baselineItemReviews(restaurantId: string, catalogItemId: string, data: SeedData): Review[] {
  return data.reviews.filter((r) => r.phase === 'baseline' && r.restaurantId === restaurantId && r.catalogItemId === catalogItemId);
}

export function comparePricing(restaurantId: string, catalogItemId: string, data: SeedData) {
  const mine = data.restaurantMenuItems.find((m) => m.restaurantId === restaurantId && m.catalogItemId === catalogItemId);
  const peers = getPeerItems(catalogItemId, restaurantId, data);
  const myPrice = mine?.price ?? 0;
  const peerAvgPrice = mean(peers.map((p) => p.price));
  const priceDeltaPct = peerAvgPrice ? ((myPrice - peerAvgPrice) / peerAvgPrice) * 100 : 0;
  const below = peers.filter((p) => p.price < myPrice).length;
  const pricePercentile = peers.length ? (below / peers.length) * 100 : 0;
  return { myPrice, peerAvgPrice, priceDeltaPct, pricePercentile };
}

export function compareRatings(restaurantId: string, catalogItemId: string, data: SeedData) {
  const peers = getPeerItems(catalogItemId, restaurantId, data);
  const peerRestaurantIds = [...new Set(peers.map((p) => p.restaurantId))];
  const myAvgRating = mean(baselineItemReviews(restaurantId, catalogItemId, data).map((r) => r.rating));
  const peerRatingByRestaurant = peerRestaurantIds.map((rid) => mean(baselineItemReviews(rid, catalogItemId, data).map((r) => r.rating)));
  const peerAvgRating = mean(peerRatingByRestaurant.filter((v) => v > 0));
  const ratingGap = myAvgRating - peerAvgRating;
  // rank of me among (me + peers) by avg rating desc
  const allRatings = [myAvgRating, ...peerRatingByRestaurant].filter((v) => v > 0);
  const sorted = [...allRatings].sort((a, b) => b - a);
  const rank = sorted.indexOf(myAvgRating) + 1;
  return { myAvgRating, peerAvgRating, ratingGap, rank, peerCount: peerRestaurantIds.length };
}

// Orchestrates pricing + ratings into one PeerComparisonResult. Null when no peers exist.
export function comparePeers(restaurantId: string, catalogItemId: string, data: SeedData): PeerComparisonResult | null {
  const peers = getPeerItems(catalogItemId, restaurantId, data);
  const peerCount = new Set(peers.map((p) => p.restaurantId)).size;
  if (peerCount === 0) return null;
  const cat = data.menuCatalog.find((c) => c.id === catalogItemId);
  const price = comparePricing(restaurantId, catalogItemId, data);
  const ratings = compareRatings(restaurantId, catalogItemId, data);
  return {
    catalogItemId,
    itemName: cat?.name ?? catalogItemId,
    myPrice: round2(price.myPrice),
    peerAvgPrice: round2(price.peerAvgPrice),
    priceDeltaPct: round1(price.priceDeltaPct),
    pricePercentile: Math.round(price.pricePercentile),
    myAvgRating: round1(ratings.myAvgRating),
    peerAvgRating: round1(ratings.peerAvgRating),
    ratingGap: round1(ratings.ratingGap),
    rank: ratings.rank,
    peerCount: ratings.peerCount,
  };
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const round2 = (n: number) => Math.round(n * 100) / 100;
