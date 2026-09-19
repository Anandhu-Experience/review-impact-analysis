/**
 * THE REGISTRY — one source of truth for routes, navigation and permissions.
 *
 * v2 keeps three parallel hand-maintained things: the route tables in
 * src/routes/config/*.js, the nav arrays in src/modules/Nav/*NavItems.js, and two
 * different permission checks. They have drifted — six nav entries link to URLs with
 * no route, and Social Monitor (7,375 lines) is advertised in nav with no route and
 * no importer at all.
 *
 * Here the nav is DERIVED from this list and the router guard uses the same
 * isAllowed(), so a nav entry without a screen is not expressible.
 *
 * Note on paths: v2 mounts nearly every screen twice, once under /admin and once
 * under /user — 83 of its 240 route entries are that duplication. Persona is a
 * property of the session here, not of the URL, so each screen is declared once.
 */

import {
  Building2,
  LayoutDashboard,
  MapPin,
  Network,
  Settings as SettingsIcon,
  Star,
  UserCog,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { ReactElement } from 'react';
import type { Gate } from './lib/permissions';
import { AccountsPage } from './pages/AccountsPage';
import { PlannedScreen } from './pages/PlannedScreen';

export interface ScreenDef {
  id: string;
  /** Full path, including the /xmp prefix this app mounts the shell under. */
  path: string;
  area: string;
  title: string;
  /** Where this screen lives in today's XMP — keeps the port auditable. */
  v2Source: string;
  /** Which v2 DEFAULT_ROUTES key made this P0, when one did. */
  landing?: string;
  parity: 'built' | 'planned';
  gate?: Gate;
  nav?: { label: string; icon: LucideIcon; order: number };
  render: () => ReactElement;
}

const planned =
  (title: string, v2Source: string, note: string) => () =>
    <PlannedScreen title={title} v2Source={v2Source} note={note} />;

export const SCREENS: ScreenDef[] = [
  {
    id: 'dashboard',
    path: '/xmp/dashboard',
    area: 'HierarchyDashboards',
    title: 'Dashboard',
    v2Source: 'modules/HierarchyDashboards/containers',
    landing: 'admin DASHBOARD_ROUTE / user TIER_BASE_ROUTE',
    parity: 'planned',
    gate: { accessKey: 'dashboard' },
    nav: { label: 'Dashboard', icon: LayoutDashboard, order: 5 },
    render: planned(
      'Dashboard',
      'modules/HierarchyDashboards',
      'Landing route for admins and tier managers.'
    ),
  },
  {
    id: 'agent-dashboard',
    path: '/xmp/my-dashboard',
    area: 'AgentDashboard',
    title: 'My dashboard',
    v2Source: 'modules/AgentDashboard/containers',
    landing: 'user DEFAULT_ROUTES.AGENT_BASE_ROUTE',
    parity: 'planned',
    gate: { accessKey: 'dashboard', personas: ['agent'] },
    nav: { label: 'My dashboard', icon: LayoutDashboard, order: 6 },
    render: planned(
      'My dashboard',
      'modules/AgentDashboard',
      'The agent persona lands here. Only agents can see it — try the persona switcher.'
    ),
  },
  {
    id: 'organizations',
    path: '/xmp/organizations',
    area: 'Organizations',
    title: 'Organizations',
    v2Source: 'modules/Organizations/containers',
    landing: 'admin DEFAULT_ROUTES.AUTHED_ROUTE',
    parity: 'planned',
    gate: { accessKey: 'organizations' },
    nav: { label: 'Organizations', icon: Building2, order: 10 },
    render: planned(
      'Organizations',
      'modules/Organizations/containers',
      'Where admins actually land — ranked P0 from admin DEFAULT_ROUTES.AUTHED_ROUTE, not from a guess.'
    ),
  },
  {
    id: 'accounts',
    path: '/xmp/accounts',
    area: 'Accounts',
    title: 'Accounts',
    v2Source: 'modules/Accounts/containers',
    landing: 'user DEFAULT_ROUTES.AUTHED_ROUTE',
    parity: 'built',
    gate: { accessKey: 'accounts' },
    nav: { label: 'Accounts', icon: Users, order: 20 },
    render: () => <AccountsPage />,
  },
  {
    id: 'hierarchy',
    path: '/xmp/hierarchy',
    area: 'Hierarchy',
    title: 'Hierarchy',
    v2Source: 'modules/Hierarchy/containers',
    landing: 'admin DEFAULT_ROUTES.CONTEXT_SELECTED_ROUTE',
    parity: 'planned',
    gate: { accessKey: 'hierarchy' },
    nav: { label: 'Hierarchy', icon: Network, order: 30 },
    render: planned(
      'Hierarchy',
      'modules/Hierarchy',
      'Largest area in XMP: 81,271 lines and 45 drawers behind only 3 routes. Redesign candidate.'
    ),
  },
  {
    id: 'reviews',
    path: '/xmp/reviews',
    area: 'Reviews',
    title: 'Reviews',
    v2Source: 'modules/Reviews/containers',
    parity: 'planned',
    gate: { accessKey: 'reviews_management', app: 'pc_enable_3rd_party_review_mgmt' },
    nav: { label: 'Reviews', icon: Star, order: 40 },
    render: planned(
      'Reviews',
      'modules/Reviews',
      'Gated by BOTH a permission (reviews_management) and a product flag (pc_enable_3rd_party_review_mgmt).'
    ),
  },
  {
    id: 'listing-dashboard',
    path: '/xmp/listings',
    area: 'Listing',
    title: 'Listings',
    v2Source: 'modules/Listing/components/ListingCustomerDashboard',
    landing: 'user DEFAULT_ROUTES.LISTING_MGR_BASE_ROUTE',
    parity: 'planned',
    gate: { accessKey: 'listings', app: 'pc_enable_listings' },
    nav: { label: 'Listings', icon: MapPin, order: 50 },
    render: planned(
      'Listings',
      'modules/Listing',
      'Landing route for listing managers.'
    ),
  },
  {
    id: 'users',
    path: '/xmp/users',
    area: 'UserManagement',
    title: 'Users',
    v2Source: 'modules/UserManagement/containers',
    landing: 'admin DEFAULT_ROUTES.INDIVIDUAL_PROFESSIONALS_ROUTE',
    parity: 'planned',
    gate: { accessKey: 'user_management', personas: ['admin'] },
    nav: { label: 'Users', icon: UserCog, order: 60 },
    render: planned(
      'Users',
      'modules/UserManagement',
      'Admin-only. Declared landing route INDIVIDUAL_PROFESSIONALS_ROUTE.'
    ),
  },
  {
    id: 'settings',
    path: '/xmp/settings',
    area: 'Settings',
    title: 'Settings',
    v2Source: 'modules/Settings/components',
    parity: 'planned',
    gate: { accessKey: 'settings' },
    nav: { label: 'Settings', icon: SettingsIcon, order: 90 },
    render: planned(
      'Settings',
      'modules/Settings',
      '35 route entries and 39 drawers in v2. Only the landing screen is P0; the deep leaves are P1/P2.'
    ),
  },
];
