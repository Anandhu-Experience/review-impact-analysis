import { ProblemCategory } from '../types';
import type { Remedy } from '../types';

// Authored remedy DATA (not logic). Record<ProblemCategory, Remedy[]> with exactly a tier-1
// (try-first) and a tier-2 (escalation) per category. Imported directly by the pure
// remedyService (a data constant — the services boundary bans UI/store, not data).
// Remedies are SPECIFIC and actionable — never "improve service".
const r = (
  category: ProblemCategory,
  tier: 1 | 2,
  title: string,
  description: string,
  specificActions: string[],
  expectedImpact: string,
  targetMetric: Remedy['targetMetric'],
): Remedy => ({ id: `rem-${category}-t${tier}`, category, tier, title, description, specificActions, expectedImpact, targetMetric });

export const remedyTable: Record<ProblemCategory, Remedy[]> = {
  [ProblemCategory.Price]: [
    r(ProblemCategory.Price, 1, 'Introduce a value meal and reprice against 3 peers', 'Close the price-to-value gap: reprice flagged items within 10% of the three closest peers and add a combo.', ['Benchmark the 3 nearest peers on the same catalog item', 'Reprice flagged items to within 10% of peer average', 'Launch a lunch value combo'], 'Narrow the peer price gap; +0.6★ on value perception', 'peerGap'),
    r(ProblemCategory.Price, 2, 'Re-engineer the dish so value matches price', 'Add a plated side and upgrade presentation so the perceived value matches the price point.', ['Add a complimentary side to flagged mains', 'Upgrade plating and portion visibility', 'Re-photograph the menu'], 'Lift value sentiment ~0.5', 'sentiment'),
  ],
  [ProblemCategory.Quality]: [
    r(ProblemCategory.Quality, 1, 'Fire-to-order with a heat-lamp pass-check', 'Hold cooked items no longer than 6 minutes and add a temperature pass-check before serving.', ['Set a 6-minute hold limit on cooked items', 'Add a heat-lamp pass-check station', 'Log temperature at the pass'], 'Cut Quality complaints ~60%', 'categoryComplaints'),
    r(ProblemCategory.Quality, 2, 'Upgrade the flagged ingredient and retrain the line', 'Switch the lowest-rated ingredient to a higher-grade supplier and run line-cook retraining to spec.', ['Swap the flagged supplier ingredient', 'Run a line-cook retraining on the recipe spec', 'Add a weekly plate audit'], '+0.8★ on the item', 'avgRating'),
  ],
  [ProblemCategory.Quantity]: [
    r(ProblemCategory.Quantity, 1, 'Increase portion weight 20% on flagged items', 'Re-spec plating and prep sheets so flagged items carry a visibly larger portion.', ['Increase portion weight 20% on flagged items', 'Update prep sheets and plating guides', 'Spot-check portions at the pass'], 'Cut Quantity complaints ~70%', 'categoryComplaints'),
    r(ProblemCategory.Quantity, 2, 'Add a complimentary side to flagged mains', 'Bundle a bread or salad side so the plate reads as generous value.', ['Add a bread/salad side to flagged mains', 'Update the menu copy to signal the side'], 'Lift value sentiment ~0.5', 'sentiment'),
  ],
  [ProblemCategory.Taste]: [
    r(ProblemCategory.Taste, 1, 'Recalibrate seasoning to a standardized spec', 'Standardize seasoning and run a weekly taste panel on the flagged items.', ['Publish a seasoning spec sheet', 'Run a weekly 5-item taste panel', 'Retrain on the spec'], 'Cut Taste complaints ~50%', 'categoryComplaints'),
    r(ProblemCategory.Taste, 2, 'Revise the recipe with a consulting chef', 'Rework the dish and relaunch it as new and improved.', ['Engage a consulting chef', 'Rework and re-test the recipe', 'Relaunch with new menu copy'], '+0.7★ on the item', 'avgRating'),
  ],
  [ProblemCategory.Service]: [
    r(ProblemCategory.Service, 1, 'Assign a floor lead with a 5-minute table-touch cadence', 'Introduce a greet + check-back SLA so tables are never ignored.', ['Assign a shift floor lead', 'Set a 5-minute greet SLA', 'Add a 12-minute food-runner check-back'], 'Cut Service complaints ~60%', 'categoryComplaints'),
    r(ProblemCategory.Service, 2, 'Move to section-based serving with handheld ordering', 'Reduce ticket time and errors with section assignment and tableside tablets.', ['Assign servers to fixed sections', 'Add handheld ordering tablets', 'Track ticket times per section'], '+0.7★ overall', 'avgRating'),
  ],
  [ProblemCategory.WaitingTime]: [
    r(ProblemCategory.WaitingTime, 1, 'Reduce prep-to-table time below 15 minutes', 'Streamline the kitchen so orders reach the table in under 15 minutes.', ['Map the prep-to-table workflow', 'Pre-stage high-volume items at peak', 'Set a 15-minute ticket target with a timer at the pass'], 'Cut WaitingTime complaints ~80%; +2★ at peak', 'categoryComplaints'),
    r(ProblemCategory.WaitingTime, 2, 'Add 2 staff during 12–2 and 7–9 peak windows', 'Staff the peak windows to the demand curve.', ['Add 2 staff during 12–2 and 7–9', 'Add an expediter at the pass', 'Pre-batch prep before peak'], '+0.8★ at peak', 'avgRating'),
  ],
  [ProblemCategory.Availability]: [
    r(ProblemCategory.Availability, 1, 'Raise par levels on top-3 items 30% and adopt an 86-board', 'Prevent stock-outs on the best sellers with higher par levels and an 86-board process.', ['Raise par levels 30% on the top-3 items', 'Adopt a live 86-board at the pass', 'Do a mid-service stock check'], 'Cut Availability complaints ~75%', 'categoryComplaints'),
    r(ProblemCategory.Availability, 2, 'Add a backup supplier and a daily prep forecast', 'De-risk supply with a second supplier and forecast prep to reservations.', ['Onboard a backup supplier', 'Forecast daily prep to reservations', 'Set reorder triggers'], 'Fewer stock-outs; +0.6★', 'avgRating'),
  ],
  [ProblemCategory.Staff]: [
    r(ProblemCategory.Staff, 1, 'Run a hospitality refresher with 30-minute floor checks', 'Reset staff standards with a short refresher and shift-lead floor checks.', ['Run a 2-hour hospitality refresher', 'Add a shift-lead floor check every 30 minutes', 'Post the service standards'], 'Lift Staff sentiment ~0.5', 'sentiment'),
    r(ProblemCategory.Staff, 2, 'Revise hiring scorecard and add a service bonus', 'Improve the team over time with a better scorecard and an incentive.', ['Revise the hiring scorecard', 'Add a tipped-out service-quality bonus', 'Introduce peer feedback'], '+0.6★ overall', 'avgRating'),
  ],
  [ProblemCategory.Cleanliness]: [
    r(ProblemCategory.Cleanliness, 1, 'Adopt an hourly sanitation checklist with sign-off', 'Keep restrooms and tables clean with an hourly checklist.', ['Post an hourly restroom + table checklist', 'Require sign-off each hour', 'Spot-audit at peak'], 'Cut Cleanliness complaints ~70%', 'categoryComplaints'),
    r(ProblemCategory.Cleanliness, 2, 'Nightly deep-clean and a monthly hygiene audit', 'Escalate to a contracted deep-clean and third-party audit.', ['Schedule a nightly deep-clean contractor', 'Book a monthly third-party hygiene audit'], 'Lift Cleanliness sentiment ~0.5', 'sentiment'),
  ],
  [ProblemCategory.Menu]: [
    r(ProblemCategory.Menu, 1, 'Add photos, allergen and calorie tags, flag top sellers', 'Make the menu clearer and easier to order from.', ['Add dish photos', 'Add allergen and calorie tags', 'Flag the top-3 sellers'], 'Lift Menu sentiment ~0.4', 'sentiment'),
    r(ProblemCategory.Menu, 2, 'Redesign the menu and cut the 5 worst-rated items', 'Reorganize categories and remove underperformers.', ['Reorganize menu categories', 'Remove the 5 worst-rated items', 'Re-test the new layout'], '+0.5★ overall', 'avgRating'),
  ],
  [ProblemCategory.Ambience]: [
    r(ProblemCategory.Ambience, 1, 'Fix lighting and noise in the loud zone', 'Install dimmers and acoustic panels where guests complain.', ['Install dimmers', 'Add acoustic panels in the loud zone', 'Lower background music at peak'], 'Lift Ambience sentiment ~0.4', 'sentiment'),
    r(ProblemCategory.Ambience, 2, 'Refresh décor and seating layout', 'Update the flagged section for comfort and flow.', ['Refresh décor in the flagged section', 'Rework the seating layout'], '+0.5★ overall', 'avgRating'),
  ],
  [ProblemCategory.Delivery]: [
    r(ProblemCategory.Delivery, 1, 'Add insulated bags and a seal-check; cap the radius', 'Protect food quality in transit and limit long drives.', ['Add insulated delivery bags', 'Add a seal-check step', 'Cap the delivery radius to a 20-minute drive'], 'Cut Delivery complaints ~60%', 'categoryComplaints'),
    r(ProblemCategory.Delivery, 2, 'Switch to a better-rated delivery partner', 'Move to a partner with live tracking.', ['Evaluate delivery partners', 'Switch to the best-rated partner', 'Enable live order tracking'], '+0.6★ on delivery', 'avgRating'),
  ],
  [ProblemCategory.Packaging]: [
    r(ProblemCategory.Packaging, 1, 'Switch to leak-proof, vented containers for hot items', 'Stop leaks and sogginess in transit.', ['Switch to leak-proof vented containers', 'Separate wet and dry items', 'Add a napkin/utensil pack'], 'Cut Packaging complaints ~65%', 'categoryComplaints'),
    r(ProblemCategory.Packaging, 2, 'Redesign packaging with compartment trays and seals', 'Upgrade to compartment trays with tamper-evident seals.', ['Adopt compartment trays', 'Add tamper-evident seals'], 'Lift Packaging sentiment ~0.4', 'sentiment'),
  ],
};
