import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Persona, Session } from './lib/permissions';

/**
 * Personas are modelled from v2's real permission shapes so permission behaviour can
 * be verified persona by persona — the part of a port most likely to be silently wrong.
 * This stands in for auth until the real shell's Supabase auth + RLS is available.
 */
const SESSIONS: Record<Persona, Session> = {
  admin: {
    persona: 'admin',
    navMenuList: [
      'organizations', 'accounts', 'hierarchy', 'dashboard', 'reviews',
      'settings', 'user_management', 'listings',
    ],
    appFlags: [
      'pc_enable_listings', 'pc_enable_survey_campaign', 'pc_enable_3rd_party_review_mgmt',
    ],
    features: [],
    verbs: {
      account: [
        'create', 'duplicate', 'setting', 'activate', 'mark_exception',
        'remove_exception', 'request_deactivate',
      ],
    },
    isSuperAdmin: true,
  },
  user: {
    persona: 'user',
    navMenuList: ['accounts', 'hierarchy', 'dashboard', 'reviews', 'settings'],
    appFlags: ['pc_enable_3rd_party_review_mgmt'],
    features: [],
    verbs: { account: ['setting'] },
    isSuperAdmin: false,
  },
  agent: {
    persona: 'agent',
    navMenuList: ['dashboard', 'reviews'],
    appFlags: ['pc_enable_3rd_party_review_mgmt'],
    features: ['referrals'],
    verbs: {},
    isSuperAdmin: false,
  },
  tier: {
    persona: 'tier',
    navMenuList: ['dashboard', 'hierarchy', 'reviews'],
    appFlags: ['pc_enable_3rd_party_review_mgmt'],
    features: [],
    verbs: {},
    isSuperAdmin: false,
  },
  org: {
    persona: 'org',
    navMenuList: ['organizations', 'accounts', 'settings'],
    appFlags: [],
    features: [],
    verbs: { account: ['setting'] },
    isSuperAdmin: false,
  },
  listing: {
    persona: 'listing',
    navMenuList: ['listings', 'dashboard'],
    appFlags: ['pc_enable_listings'],
    features: [],
    verbs: {},
    isSuperAdmin: false,
  },
};

export const PERSONA_LABEL: Record<Persona, string> = {
  admin: 'Super admin',
  user: 'Account manager',
  agent: 'Agent',
  tier: 'Tier manager',
  org: 'Org manager',
  listing: 'Listing manager',
};

/**
 * Where each persona lands after sign-in. These are not invented — they are the
 * DEFAULT_ROUTES v2 declares in src/routes/config/{admin,user}.js, mapped onto this
 * shell's persona-neutral paths. Landing behaviour is itself a parity requirement.
 */
export const PERSONA_LANDING: Record<Persona, string> = {
  admin: '/xmp/organizations', // admin AUTHED_ROUTE — NOT /accounts
  user: '/xmp/accounts', // user AUTHED_ROUTE
  agent: '/xmp/my-dashboard', // AGENT_BASE_ROUTE
  tier: '/xmp/dashboard', // TIER_BASE_ROUTE
  org: '/xmp/organizations', // user CONTEXT_SELECTED_ROUTE
  listing: '/xmp/listings', // LISTING_MGR_BASE_ROUTE
};

export const PERSONA_SOURCE: Record<Persona, string> = {
  admin: 'admin DEFAULT_ROUTES.AUTHED_ROUTE',
  user: 'user DEFAULT_ROUTES.AUTHED_ROUTE',
  agent: 'user DEFAULT_ROUTES.AGENT_BASE_ROUTE',
  tier: 'user DEFAULT_ROUTES.TIER_BASE_ROUTE',
  org: 'user DEFAULT_ROUTES.CONTEXT_SELECTED_ROUTE',
  listing: 'user DEFAULT_ROUTES.LISTING_MGR_BASE_ROUTE',
};

export const PERSONAS: Persona[] = ['admin', 'user', 'agent', 'tier', 'org', 'listing'];

interface Ctx {
  session: Session;
  persona: Persona;
  signedIn: boolean;
  setPersona: (p: Persona) => void;
  signIn: (p: Persona) => void;
  signOut: () => void;
}

const SessionContext = createContext<Ctx | null>(null);

export function XmpSessionProvider({ children }: { children: ReactNode }) {
  const [persona, setPersona] = useState<Persona>('admin');
  const [signedIn, setSignedIn] = useState(false);

  const value = useMemo(
    () => ({
      session: SESSIONS[persona],
      persona,
      signedIn,
      setPersona,
      signIn: (p: Persona) => {
        setPersona(p);
        setSignedIn(true);
      },
      signOut: () => setSignedIn(false),
    }),
    [persona, signedIn]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useXmpSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useXmpSession must be used inside XmpSessionProvider');
  return ctx;
}
