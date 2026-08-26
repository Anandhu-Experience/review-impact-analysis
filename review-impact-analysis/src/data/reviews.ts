import { ProblemCategory as P, ReviewPhase, Sentiment as S } from '../types';
import type { Rating, Review, Sentiment, ProblemCategory } from '../types';
import { restaurantMenuItems } from './restaurantMenuItems';
import { restaurants } from './restaurants';
import { menuCatalog } from './menuCatalog';

// Compact authoring format. Denormalized fields (restaurantId, catalogItemId, price,
// locationId, foodCategory) are DERIVED by the builder from the rmi/restaurant/catalog
// lookups — referential integrity lives in one place. All dates are hardcoded ISO:
// baseline < 2026-03-01 (actionDate), post-action >= 2026-03-01.
interface Raw {
  id: string;
  rmi: string; // restaurantMenuItemId
  rating: Rating;
  comment: string;
  date: string;
  phase: ReviewPhase;
  scenarioId?: string;
  cats: ProblemCategory[];
  sent: Sentiment;
}

const B = ReviewPhase.Baseline;
const PA = ReviewPhase.PostAction;

const rmiIndex = new Map(restaurantMenuItems.map((m) => [m.id, m]));
const restIndex = new Map(restaurants.map((r) => [r.id, r]));
const catIndex = new Map(menuCatalog.map((c) => [c.id, c]));

function build(raws: Raw[]): Review[] {
  return raws.map((r) => {
    const rmi = rmiIndex.get(r.rmi);
    if (!rmi) throw new Error(`reviews.ts: unknown restaurantMenuItemId "${r.rmi}" (review ${r.id})`);
    const rest = restIndex.get(rmi.restaurantId);
    const cat = catIndex.get(rmi.catalogItemId);
    if (!rest || !cat) throw new Error(`reviews.ts: dangling refs for ${r.rmi}`);
    return {
      id: r.id,
      restaurantId: rmi.restaurantId,
      restaurantMenuItemId: rmi.id,
      catalogItemId: rmi.catalogItemId,
      rating: r.rating,
      comment: r.comment,
      price: rmi.price,
      date: r.date,
      locationId: rest.locationId,
      foodCategory: cat.foodCategory,
      phase: r.phase,
      scenarioId: r.scenarioId,
      tags: { categories: r.cats, sentiment: r.sent },
    };
  });
}

const raw: Raw[] = [
  // ── rst-01 Bella Napoli — Scenario 1 (Price + Quantity, cat-01) baseline
  { id: 'rev-0001', rmi: 'rmi-01-01', rating: 2, comment: 'Tasty but $16 is steep for the size.', date: '2026-01-06', phase: B, scenarioId: 'scn-01', cats: [P.Price, P.Quantity], sent: S.Negative },
  { id: 'rev-0002', rmi: 'rmi-01-01', rating: 2, comment: 'Good flavor, portion small for the price.', date: '2026-01-09', phase: B, scenarioId: 'scn-01', cats: [P.Quantity, P.Price], sent: S.Negative },
  { id: 'rev-0003', rmi: 'rmi-01-01', rating: 1, comment: 'Overpriced and I left hungry.', date: '2026-01-14', phase: B, scenarioId: 'scn-01', cats: [P.Price, P.Quantity], sent: S.Negative },
  { id: 'rev-0004', rmi: 'rmi-01-05', rating: 2, comment: '$17 carbonara in a tiny bowl.', date: '2026-01-19', phase: B, scenarioId: 'scn-01', cats: [P.Price, P.Quantity], sent: S.Negative },
  { id: 'rev-0005', rmi: 'rmi-01-05', rating: 2, comment: 'Rich but not worth the price.', date: '2026-01-23', phase: B, scenarioId: 'scn-01', cats: [P.Price], sent: S.Negative },
  { id: 'rev-0006', rmi: 'rmi-01-02', rating: 3, comment: 'Fine, unremarkable salad.', date: '2026-01-27', phase: B, scenarioId: 'scn-01', cats: [], sent: S.Neutral },
  { id: 'rev-0007', rmi: 'rmi-01-01', rating: 4, comment: 'Authentic and delicious.', date: '2026-02-02', phase: B, scenarioId: 'scn-01', cats: [], sent: S.Positive },
  { id: 'rev-0008', rmi: 'rmi-01-08', rating: 5, comment: 'Best dessert in town, great value.', date: '2026-02-07', phase: B, scenarioId: 'scn-01', cats: [], sent: S.Positive },
  { id: 'rev-0009', rmi: 'rmi-01-01', rating: 2, comment: 'Great taste, felt overpriced.', date: '2026-02-12', phase: B, scenarioId: 'scn-01', cats: [P.Price], sent: S.Negative },
  { id: 'rev-0010', rmi: 'rmi-01-02', rating: 4, comment: 'Fresh salad, generous size.', date: '2026-02-18', phase: B, scenarioId: 'scn-01', cats: [], sent: S.Positive },

  // ── rst-02 Sakura Sushi — Scenario 2 (Quality + WaitingTime, cat-06) baseline
  { id: 'rev-0011', rmi: 'rmi-02-06', rating: 2, comment: 'Rice was mushy, not fresh.', date: '2026-01-05', phase: B, scenarioId: 'scn-02', cats: [P.Quality], sent: S.Negative },
  { id: 'rev-0012', rmi: 'rmi-02-06', rating: 2, comment: 'Waited 35 minutes for one roll.', date: '2026-01-10', phase: B, scenarioId: 'scn-02', cats: [P.WaitingTime], sent: S.Negative },
  { id: 'rev-0013', rmi: 'rmi-02-06', rating: 1, comment: 'Fish tasted off and service was slow.', date: '2026-01-16', phase: B, scenarioId: 'scn-02', cats: [P.Quality, P.WaitingTime], sent: S.Negative },
  { id: 'rev-0014', rmi: 'rmi-02-06', rating: 2, comment: 'Cold rice and a long wait.', date: '2026-01-22', phase: B, scenarioId: 'scn-02', cats: [P.Quality, P.WaitingTime], sent: S.Negative },
  { id: 'rev-0015', rmi: 'rmi-02-02', rating: 3, comment: 'Ok salad.', date: '2026-01-28', phase: B, scenarioId: 'scn-02', cats: [], sent: S.Neutral },
  { id: 'rev-0016', rmi: 'rmi-02-11', rating: 4, comment: 'Nice latte.', date: '2026-02-03', phase: B, scenarioId: 'scn-02', cats: [], sent: S.Positive },
  { id: 'rev-0017', rmi: 'rmi-02-06', rating: 2, comment: 'Quality has slipped lately.', date: '2026-02-09', phase: B, scenarioId: 'scn-02', cats: [P.Quality], sent: S.Negative },
  { id: 'rev-0018', rmi: 'rmi-02-06', rating: 4, comment: 'Fresh and tasty today.', date: '2026-02-14', phase: B, scenarioId: 'scn-02', cats: [], sent: S.Positive },
  { id: 'rev-0019', rmi: 'rmi-02-06', rating: 2, comment: 'Slow, a 30 minute wait.', date: '2026-02-20', phase: B, scenarioId: 'scn-02', cats: [P.WaitingTime], sent: S.Negative },
  { id: 'rev-0020', rmi: 'rmi-02-02', rating: 4, comment: 'Good portion, fresh.', date: '2026-02-25', phase: B, scenarioId: 'scn-02', cats: [], sent: S.Positive },

  // ── rst-03 The Curry House — Scenario 3 (Service, cat-04) baseline
  { id: 'rev-0021', rmi: 'rmi-03-04', rating: 2, comment: 'Server ignored us for ages.', date: '2026-01-07', phase: B, scenarioId: 'scn-03', cats: [P.Service], sent: S.Negative },
  { id: 'rev-0022', rmi: 'rmi-03-04', rating: 1, comment: 'Rude staff, forgot our order.', date: '2026-01-12', phase: B, scenarioId: 'scn-03', cats: [P.Service, P.Staff], sent: S.Negative },
  { id: 'rev-0023', rmi: 'rmi-03-04', rating: 2, comment: 'Slow, inattentive service.', date: '2026-01-18', phase: B, scenarioId: 'scn-03', cats: [P.Service], sent: S.Negative },
  { id: 'rev-0024', rmi: 'rmi-03-04', rating: 2, comment: 'Tikka fine, service poor.', date: '2026-01-24', phase: B, scenarioId: 'scn-03', cats: [P.Service], sent: S.Negative },
  { id: 'rev-0025', rmi: 'rmi-03-10', rating: 3, comment: 'Naan average.', date: '2026-01-29', phase: B, scenarioId: 'scn-03', cats: [], sent: S.Neutral },
  { id: 'rev-0026', rmi: 'rmi-03-11', rating: 4, comment: 'Good chai latte.', date: '2026-02-04', phase: B, scenarioId: 'scn-03', cats: [], sent: S.Positive },
  { id: 'rev-0027', rmi: 'rmi-03-04', rating: 2, comment: 'No one refilled water.', date: '2026-02-10', phase: B, scenarioId: 'scn-03', cats: [P.Service], sent: S.Negative },
  { id: 'rev-0028', rmi: 'rmi-03-04', rating: 4, comment: 'Great curry, friendly today.', date: '2026-02-15', phase: B, scenarioId: 'scn-03', cats: [], sent: S.Positive },
  { id: 'rev-0029', rmi: 'rmi-03-10', rating: 4, comment: 'Fresh naan.', date: '2026-02-21', phase: B, scenarioId: 'scn-03', cats: [], sent: S.Positive },
  { id: 'rev-0030', rmi: 'rmi-03-04', rating: 2, comment: 'Waited just to place an order.', date: '2026-02-26', phase: B, scenarioId: 'scn-03', cats: [P.Service], sent: S.Negative },

  // ── rst-04 Burger Barn — Scenario 4 (Availability, cat-03) baseline
  { id: 'rev-0031', rmi: 'rmi-04-03', rating: 2, comment: 'Out of cheeseburgers again.', date: '2026-01-08', phase: B, scenarioId: 'scn-04', cats: [P.Availability], sent: S.Negative },
  { id: 'rev-0032', rmi: 'rmi-04-03', rating: 2, comment: 'Half the menu was unavailable.', date: '2026-01-13', phase: B, scenarioId: 'scn-04', cats: [P.Availability, P.Menu], sent: S.Negative },
  { id: 'rev-0033', rmi: 'rmi-04-03', rating: 1, comment: 'Sold out by 7pm.', date: '2026-01-17', phase: B, scenarioId: 'scn-04', cats: [P.Availability], sent: S.Negative },
  { id: 'rev-0034', rmi: 'rmi-04-09', rating: 2, comment: 'No fish left when we arrived.', date: '2026-01-21', phase: B, scenarioId: 'scn-04', cats: [P.Availability], sent: S.Negative },
  { id: 'rev-0035', rmi: 'rmi-04-12', rating: 3, comment: 'Fries ok.', date: '2026-01-30', phase: B, scenarioId: 'scn-04', cats: [], sent: S.Neutral },
  { id: 'rev-0036', rmi: 'rmi-04-03', rating: 2, comment: 'Ran out of buns.', date: '2026-02-05', phase: B, scenarioId: 'scn-04', cats: [P.Availability], sent: S.Negative },
  { id: 'rev-0037', rmi: 'rmi-04-03', rating: 4, comment: 'Solid burger when in stock.', date: '2026-02-11', phase: B, scenarioId: 'scn-04', cats: [], sent: S.Positive },
  { id: 'rev-0038', rmi: 'rmi-04-12', rating: 4, comment: 'Crispy fries.', date: '2026-02-16', phase: B, scenarioId: 'scn-04', cats: [], sent: S.Positive },
  { id: 'rev-0039', rmi: 'rmi-04-09', rating: 2, comment: 'Unavailable most nights.', date: '2026-02-22', phase: B, scenarioId: 'scn-04', cats: [P.Availability], sent: S.Negative },
  { id: 'rev-0040', rmi: 'rmi-04-03', rating: 4, comment: 'Good value, tasty.', date: '2026-02-27', phase: B, scenarioId: 'scn-04', cats: [], sent: S.Positive },

  // ── rst-05 Thai Orchid — Scenario 5 (WaitingTime, cat-07) baseline → tuned to PASS
  { id: 'rev-0041', rmi: 'rmi-05-07', rating: 2, comment: 'Waited 40 minutes for pad thai.', date: '2026-01-04', phase: B, scenarioId: 'scn-05', cats: [P.WaitingTime], sent: S.Negative },
  { id: 'rev-0042', rmi: 'rmi-05-07', rating: 1, comment: 'Over an hour and the food was cold.', date: '2026-01-09', phase: B, scenarioId: 'scn-05', cats: [P.WaitingTime], sent: S.Negative },
  { id: 'rev-0043', rmi: 'rmi-05-07', rating: 2, comment: 'Painfully slow kitchen.', date: '2026-01-15', phase: B, scenarioId: 'scn-05', cats: [P.WaitingTime], sent: S.Negative },
  { id: 'rev-0044', rmi: 'rmi-05-07', rating: 2, comment: 'Long wait at lunch.', date: '2026-01-20', phase: B, scenarioId: 'scn-05', cats: [P.WaitingTime], sent: S.Negative },
  { id: 'rev-0045', rmi: 'rmi-05-07', rating: 1, comment: '45 minute wait, we gave up.', date: '2026-01-25', phase: B, scenarioId: 'scn-05', cats: [P.WaitingTime, P.Service], sent: S.Negative },
  { id: 'rev-0046', rmi: 'rmi-05-07', rating: 2, comment: 'Tasty but so slow.', date: '2026-02-01', phase: B, scenarioId: 'scn-05', cats: [P.WaitingTime], sent: S.Negative },
  { id: 'rev-0047', rmi: 'rmi-05-07', rating: 2, comment: 'Waited ages for takeout.', date: '2026-02-08', phase: B, scenarioId: 'scn-05', cats: [P.WaitingTime], sent: S.Negative },
  { id: 'rev-0048', rmi: 'rmi-05-07', rating: 2, comment: 'Slow even when the place was empty.', date: '2026-02-14', phase: B, scenarioId: 'scn-05', cats: [P.WaitingTime], sent: S.Negative },
  { id: 'rev-0049', rmi: 'rmi-05-11', rating: 4, comment: 'Nice iced latte.', date: '2026-02-19', phase: B, scenarioId: 'scn-05', cats: [], sent: S.Positive },
  { id: 'rev-0050', rmi: 'rmi-05-08', rating: 4, comment: 'Lovely lava cake.', date: '2026-02-24', phase: B, scenarioId: 'scn-05', cats: [], sent: S.Positive },

  // ── rst-06 Pizza Corner — Scenario 6 (Quality, cat-01) baseline → tuned to FAIL
  { id: 'rev-0051', rmi: 'rmi-06-01', rating: 2, comment: 'Undercooked, doughy base.', date: '2026-01-03', phase: B, scenarioId: 'scn-06', cats: [P.Quality], sent: S.Negative },
  { id: 'rev-0052', rmi: 'rmi-06-01', rating: 2, comment: 'Soggy and bland.', date: '2026-01-08', phase: B, scenarioId: 'scn-06', cats: [P.Quality], sent: S.Negative },
  { id: 'rev-0053', rmi: 'rmi-06-01', rating: 1, comment: 'Burnt crust, cold center.', date: '2026-01-13', phase: B, scenarioId: 'scn-06', cats: [P.Quality], sent: S.Negative },
  { id: 'rev-0054', rmi: 'rmi-06-01', rating: 2, comment: 'Cheese barely melted.', date: '2026-01-19', phase: B, scenarioId: 'scn-06', cats: [P.Quality], sent: S.Negative },
  { id: 'rev-0055', rmi: 'rmi-06-01', rating: 2, comment: 'Poor quality lately.', date: '2026-01-24', phase: B, scenarioId: 'scn-06', cats: [P.Quality], sent: S.Negative },
  { id: 'rev-0056', rmi: 'rmi-06-05', rating: 2, comment: 'Carbonara was watery.', date: '2026-01-30', phase: B, scenarioId: 'scn-06', cats: [P.Quality], sent: S.Negative },
  { id: 'rev-0057', rmi: 'rmi-06-01', rating: 2, comment: 'Just not fresh.', date: '2026-02-06', phase: B, scenarioId: 'scn-06', cats: [P.Quality], sent: S.Negative },
  { id: 'rev-0058', rmi: 'rmi-06-12', rating: 4, comment: 'Fries are good.', date: '2026-02-12', phase: B, scenarioId: 'scn-06', cats: [], sent: S.Positive },
  { id: 'rev-0059', rmi: 'rmi-06-08', rating: 4, comment: 'Lava cake nice.', date: '2026-02-17', phase: B, scenarioId: 'scn-06', cats: [], sent: S.Positive },
  { id: 'rev-0060', rmi: 'rmi-06-01', rating: 3, comment: 'Decent when fresh.', date: '2026-02-23', phase: B, scenarioId: 'scn-06', cats: [], sent: S.Neutral },

  // ── rst-07 Mediterraneo — peer supply (positive) — cat-01, cat-04, cat-02, cat-10
  { id: 'rev-0061', rmi: 'rmi-07-01', rating: 5, comment: 'Best margherita around, hot and fresh.', date: '2026-01-06', phase: B, cats: [], sent: S.Positive },
  { id: 'rev-0062', rmi: 'rmi-07-01', rating: 4, comment: 'Great pizza, fair price.', date: '2026-01-11', phase: B, cats: [], sent: S.Positive },
  { id: 'rev-0063', rmi: 'rmi-07-01', rating: 4, comment: 'Fresh and generous.', date: '2026-01-17', phase: B, cats: [], sent: S.Positive },
  { id: 'rev-0064', rmi: 'rmi-07-04', rating: 5, comment: 'Excellent tikka, attentive staff.', date: '2026-01-23', phase: B, cats: [], sent: S.Positive },
  { id: 'rev-0065', rmi: 'rmi-07-04', rating: 4, comment: 'Rich curry, quick service.', date: '2026-01-29', phase: B, cats: [], sent: S.Positive },
  { id: 'rev-0066', rmi: 'rmi-07-02', rating: 4, comment: 'Crisp caesar.', date: '2026-02-03', phase: B, cats: [], sent: S.Positive },
  { id: 'rev-0067', rmi: 'rmi-07-10', rating: 5, comment: 'Perfect naan.', date: '2026-02-09', phase: B, cats: [], sent: S.Positive },
  { id: 'rev-0068', rmi: 'rmi-07-01', rating: 4, comment: 'Reliable and tasty.', date: '2026-02-14', phase: B, cats: [], sent: S.Positive },
  { id: 'rev-0069', rmi: 'rmi-07-04', rating: 4, comment: 'Consistent quality.', date: '2026-02-20', phase: B, cats: [], sent: S.Positive },
  { id: 'rev-0070', rmi: 'rmi-07-02', rating: 3, comment: 'Ok salad.', date: '2026-02-25', phase: B, cats: [], sent: S.Neutral },

  // ── rst-08 Green Fork — peer supply — cat-07 Pad Thai (peer for scn-05), cat-03
  { id: 'rev-0071', rmi: 'rmi-08-07', rating: 5, comment: 'Fast, fresh pad thai.', date: '2026-01-05', phase: B, cats: [], sent: S.Positive },
  { id: 'rev-0072', rmi: 'rmi-08-07', rating: 4, comment: 'Great noodles, quick.', date: '2026-01-10', phase: B, cats: [], sent: S.Positive },
  { id: 'rev-0073', rmi: 'rmi-08-07', rating: 5, comment: 'Best pad thai, no wait.', date: '2026-01-16', phase: B, cats: [], sent: S.Positive },
  { id: 'rev-0074', rmi: 'rmi-08-03', rating: 4, comment: 'Solid burger.', date: '2026-01-22', phase: B, cats: [], sent: S.Positive },
  { id: 'rev-0075', rmi: 'rmi-08-03', rating: 4, comment: 'Good value burger.', date: '2026-01-28', phase: B, cats: [], sent: S.Positive },
  { id: 'rev-0076', rmi: 'rmi-08-02', rating: 4, comment: 'Fresh caesar.', date: '2026-02-02', phase: B, cats: [], sent: S.Positive },
  { id: 'rev-0077', rmi: 'rmi-08-07', rating: 4, comment: 'Tasty and speedy.', date: '2026-02-08', phase: B, cats: [], sent: S.Positive },
  { id: 'rev-0078', rmi: 'rmi-08-12', rating: 4, comment: 'Crispy fries.', date: '2026-02-13', phase: B, cats: [], sent: S.Positive },
  { id: 'rev-0079', rmi: 'rmi-08-03', rating: 5, comment: 'Always in stock, great.', date: '2026-02-19', phase: B, cats: [], sent: S.Positive },
  { id: 'rev-0080', rmi: 'rmi-08-02', rating: 3, comment: 'Ok.', date: '2026-02-24', phase: B, cats: [], sent: S.Neutral },

  // ── rst-09 Ocean Catch — peer supply — cat-06 (peer for scn-02), cat-09
  { id: 'rev-0081', rmi: 'rmi-09-06', rating: 5, comment: 'Freshest sushi, fast.', date: '2026-01-07', phase: B, cats: [], sent: S.Positive },
  { id: 'rev-0082', rmi: 'rmi-09-06', rating: 4, comment: 'Great rolls.', date: '2026-01-12', phase: B, cats: [], sent: S.Positive },
  { id: 'rev-0083', rmi: 'rmi-09-06', rating: 5, comment: 'Top quality fish.', date: '2026-01-18', phase: B, cats: [], sent: S.Positive },
  { id: 'rev-0084', rmi: 'rmi-09-09', rating: 4, comment: 'Crispy fish and chips.', date: '2026-01-24', phase: B, cats: [], sent: S.Positive },
  { id: 'rev-0085', rmi: 'rmi-09-09', rating: 4, comment: 'Good seafood.', date: '2026-01-29', phase: B, cats: [], sent: S.Positive },
  { id: 'rev-0086', rmi: 'rmi-09-02', rating: 4, comment: 'Fresh salad.', date: '2026-02-04', phase: B, cats: [], sent: S.Positive },
  { id: 'rev-0087', rmi: 'rmi-09-06', rating: 4, comment: 'Quick and tasty.', date: '2026-02-10', phase: B, cats: [], sent: S.Positive },
  { id: 'rev-0088', rmi: 'rmi-09-06', rating: 5, comment: 'Excellent, no wait.', date: '2026-02-15', phase: B, cats: [], sent: S.Positive },
  { id: 'rev-0089', rmi: 'rmi-09-09', rating: 3, comment: 'Ok chips.', date: '2026-02-21', phase: B, cats: [], sent: S.Neutral },
  { id: 'rev-0090', rmi: 'rmi-09-02', rating: 4, comment: 'Nice.', date: '2026-02-26', phase: B, cats: [], sent: S.Positive },

  // ── rst-10 Café Aroma — peer supply — cat-01 (peer for scn-06/01), cat-03, cat-02
  { id: 'rev-0091', rmi: 'rmi-10-01', rating: 5, comment: 'Great value margherita, hot and fresh.', date: '2026-01-06', phase: B, cats: [], sent: S.Positive },
  { id: 'rev-0092', rmi: 'rmi-10-01', rating: 4, comment: 'Tasty and cheap.', date: '2026-01-11', phase: B, cats: [], sent: S.Positive },
  { id: 'rev-0093', rmi: 'rmi-10-01', rating: 5, comment: 'Fresh, generous, only $11.', date: '2026-01-17', phase: B, cats: [], sent: S.Positive },
  { id: 'rev-0094', rmi: 'rmi-10-03', rating: 4, comment: 'Good burger for the price.', date: '2026-01-23', phase: B, cats: [], sent: S.Positive },
  { id: 'rev-0095', rmi: 'rmi-10-03', rating: 4, comment: 'Solid value.', date: '2026-01-29', phase: B, cats: [], sent: S.Positive },
  { id: 'rev-0096', rmi: 'rmi-10-02', rating: 4, comment: 'Crisp caesar.', date: '2026-02-03', phase: B, cats: [], sent: S.Positive },
  { id: 'rev-0097', rmi: 'rmi-10-08', rating: 5, comment: 'Great lava cake.', date: '2026-02-09', phase: B, cats: [], sent: S.Positive },
  { id: 'rev-0098', rmi: 'rmi-10-11', rating: 4, comment: 'Nice latte.', date: '2026-02-14', phase: B, cats: [], sent: S.Positive },
  { id: 'rev-0099', rmi: 'rmi-10-01', rating: 4, comment: 'Reliable pizza.', date: '2026-02-20', phase: B, cats: [], sent: S.Positive },
  { id: 'rev-0100', rmi: 'rmi-10-02', rating: 3, comment: 'Ok.', date: '2026-02-25', phase: B, cats: [], sent: S.Neutral },

  // ── Post-action sets (hidden until "Collect New Reviews" releases the scenario) ──
  // scn-01 rst-01 Price — improved
  { id: 'rev-0111', rmi: 'rmi-01-01', rating: 4, comment: 'New value combo, worth it now.', date: '2026-03-08', phase: PA, scenarioId: 'scn-01', cats: [], sent: S.Positive },
  { id: 'rev-0112', rmi: 'rmi-01-01', rating: 5, comment: 'Bigger portion for the price.', date: '2026-03-13', phase: PA, scenarioId: 'scn-01', cats: [], sent: S.Positive },
  { id: 'rev-0113', rmi: 'rmi-01-01', rating: 4, comment: 'Fair value at last.', date: '2026-03-19', phase: PA, scenarioId: 'scn-01', cats: [], sent: S.Positive },
  { id: 'rev-0114', rmi: 'rmi-01-05', rating: 5, comment: 'Great combo deal.', date: '2026-03-25', phase: PA, scenarioId: 'scn-01', cats: [], sent: S.Positive },
  { id: 'rev-0115', rmi: 'rmi-01-01', rating: 4, comment: 'Reasonable now.', date: '2026-03-30', phase: PA, scenarioId: 'scn-01', cats: [], sent: S.Positive },
  { id: 'rev-0116', rmi: 'rmi-01-01', rating: 4, comment: 'Good value.', date: '2026-04-04', phase: PA, scenarioId: 'scn-01', cats: [], sent: S.Positive },
  // scn-02 rst-02 Quality — improved
  { id: 'rev-0117', rmi: 'rmi-02-06', rating: 5, comment: 'Fresh fish again, fast too.', date: '2026-03-07', phase: PA, scenarioId: 'scn-02', cats: [], sent: S.Positive },
  { id: 'rev-0118', rmi: 'rmi-02-06', rating: 4, comment: 'Much better quality.', date: '2026-03-12', phase: PA, scenarioId: 'scn-02', cats: [], sent: S.Positive },
  { id: 'rev-0119', rmi: 'rmi-02-06', rating: 5, comment: 'Crisp and fresh.', date: '2026-03-18', phase: PA, scenarioId: 'scn-02', cats: [], sent: S.Positive },
  { id: 'rev-0120', rmi: 'rmi-02-06', rating: 4, comment: 'Quality is back.', date: '2026-03-24', phase: PA, scenarioId: 'scn-02', cats: [], sent: S.Positive },
  { id: 'rev-0121', rmi: 'rmi-02-06', rating: 4, comment: 'Fresh, quicker service.', date: '2026-03-29', phase: PA, scenarioId: 'scn-02', cats: [], sent: S.Positive },
  { id: 'rev-0122', rmi: 'rmi-02-06', rating: 4, comment: 'Enjoyed it.', date: '2026-04-03', phase: PA, scenarioId: 'scn-02', cats: [], sent: S.Positive },
  // scn-03 rst-03 Service — improved
  { id: 'rev-0123', rmi: 'rmi-03-04', rating: 5, comment: 'Attentive, friendly service now.', date: '2026-03-06', phase: PA, scenarioId: 'scn-03', cats: [], sent: S.Positive },
  { id: 'rev-0124', rmi: 'rmi-03-04', rating: 4, comment: 'Quick and welcoming.', date: '2026-03-11', phase: PA, scenarioId: 'scn-03', cats: [], sent: S.Positive },
  { id: 'rev-0125', rmi: 'rmi-03-04', rating: 4, comment: 'Water refilled promptly.', date: '2026-03-17', phase: PA, scenarioId: 'scn-03', cats: [], sent: S.Positive },
  { id: 'rev-0126', rmi: 'rmi-03-04', rating: 5, comment: 'Great turnaround on service.', date: '2026-03-23', phase: PA, scenarioId: 'scn-03', cats: [], sent: S.Positive },
  { id: 'rev-0127', rmi: 'rmi-03-04', rating: 4, comment: 'Friendly staff.', date: '2026-03-28', phase: PA, scenarioId: 'scn-03', cats: [], sent: S.Positive },
  { id: 'rev-0128', rmi: 'rmi-03-04', rating: 4, comment: 'Good visit.', date: '2026-04-02', phase: PA, scenarioId: 'scn-03', cats: [], sent: S.Positive },
  // scn-04 rst-04 Availability — improved
  { id: 'rev-0129', rmi: 'rmi-04-03', rating: 4, comment: 'In stock all evening now.', date: '2026-03-07', phase: PA, scenarioId: 'scn-04', cats: [], sent: S.Positive },
  { id: 'rev-0130', rmi: 'rmi-04-03', rating: 5, comment: 'Everything available, great.', date: '2026-03-12', phase: PA, scenarioId: 'scn-04', cats: [], sent: S.Positive },
  { id: 'rev-0131', rmi: 'rmi-04-03', rating: 4, comment: 'No more sold-out items.', date: '2026-03-18', phase: PA, scenarioId: 'scn-04', cats: [], sent: S.Positive },
  { id: 'rev-0132', rmi: 'rmi-04-09', rating: 4, comment: 'Fish available, tasty.', date: '2026-03-24', phase: PA, scenarioId: 'scn-04', cats: [], sent: S.Positive },
  { id: 'rev-0133', rmi: 'rmi-04-03', rating: 5, comment: 'Fully stocked.', date: '2026-03-29', phase: PA, scenarioId: 'scn-04', cats: [], sent: S.Positive },
  { id: 'rev-0134', rmi: 'rmi-04-03', rating: 4, comment: 'Good, in stock.', date: '2026-04-03', phase: PA, scenarioId: 'scn-04', cats: [], sent: S.Positive },
  // scn-05 rst-05 WaitingTime — PASS (avg ~4.4, WaitingTime complaints → 0)
  { id: 'rev-0135', rmi: 'rmi-05-07', rating: 5, comment: 'In and out in 12 minutes!', date: '2026-03-06', phase: PA, scenarioId: 'scn-05', cats: [], sent: S.Positive },
  { id: 'rev-0136', rmi: 'rmi-05-07', rating: 5, comment: 'Fast and hot now.', date: '2026-03-10', phase: PA, scenarioId: 'scn-05', cats: [], sent: S.Positive },
  { id: 'rev-0137', rmi: 'rmi-05-07', rating: 4, comment: 'Much quicker service.', date: '2026-03-15', phase: PA, scenarioId: 'scn-05', cats: [], sent: S.Positive },
  { id: 'rev-0138', rmi: 'rmi-05-07', rating: 5, comment: 'No wait at lunch, great.', date: '2026-03-20', phase: PA, scenarioId: 'scn-05', cats: [], sent: S.Positive },
  { id: 'rev-0139', rmi: 'rmi-05-07', rating: 4, comment: 'Speedy and fresh.', date: '2026-03-24', phase: PA, scenarioId: 'scn-05', cats: [], sent: S.Positive },
  { id: 'rev-0140', rmi: 'rmi-05-07', rating: 5, comment: 'Order came in 10 minutes.', date: '2026-03-28', phase: PA, scenarioId: 'scn-05', cats: [], sent: S.Positive },
  { id: 'rev-0141', rmi: 'rmi-05-07', rating: 4, comment: 'Big improvement on the wait.', date: '2026-04-01', phase: PA, scenarioId: 'scn-05', cats: [], sent: S.Positive },
  { id: 'rev-0142', rmi: 'rmi-05-07', rating: 3, comment: 'Faster, still busy at peak.', date: '2026-04-05', phase: PA, scenarioId: 'scn-05', cats: [], sent: S.Neutral },
  // scn-06 rst-06 Quality — FAIL (avg ~2.4, Quality complaints 7 → 6, barely moves)
  { id: 'rev-0143', rmi: 'rmi-06-01', rating: 2, comment: 'Still doughy.', date: '2026-03-06', phase: PA, scenarioId: 'scn-06', cats: [P.Quality], sent: S.Negative },
  { id: 'rev-0144', rmi: 'rmi-06-01', rating: 2, comment: 'Not much better.', date: '2026-03-11', phase: PA, scenarioId: 'scn-06', cats: [P.Quality], sent: S.Negative },
  { id: 'rev-0145', rmi: 'rmi-06-01', rating: 2, comment: 'Base still soggy.', date: '2026-03-16', phase: PA, scenarioId: 'scn-06', cats: [P.Quality], sent: S.Negative },
  { id: 'rev-0146', rmi: 'rmi-06-01', rating: 2, comment: 'Quality unchanged.', date: '2026-03-21', phase: PA, scenarioId: 'scn-06', cats: [P.Quality], sent: S.Negative },
  { id: 'rev-0147', rmi: 'rmi-06-01', rating: 2, comment: 'Cheese still off.', date: '2026-03-26', phase: PA, scenarioId: 'scn-06', cats: [P.Quality], sent: S.Negative },
  { id: 'rev-0148', rmi: 'rmi-06-01', rating: 2, comment: 'Same issues as before.', date: '2026-03-31', phase: PA, scenarioId: 'scn-06', cats: [P.Quality], sent: S.Negative },
  { id: 'rev-0149', rmi: 'rmi-06-01', rating: 5, comment: 'One good pizza, finally.', date: '2026-04-05', phase: PA, scenarioId: 'scn-06', cats: [], sent: S.Positive },
];

export const reviews: Review[] = build(raw);
