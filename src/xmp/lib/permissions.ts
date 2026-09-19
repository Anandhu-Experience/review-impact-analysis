/**
 * ONE permission concept.
 *
 * In today's XMP this logic exists twice and can disagree: route-level in
 * `routes/components/AuthPage.js` (accessKey / app / feature) and nav-level in
 * `modules/Nav/components/index.js` (getAccess). That split is why six nav entries
 * currently link to URLs with no route, and why a whole feature (Social Monitor) is
 * advertised in nav with no route and no importer at all.
 *
 * Here the router guard and the nav consume the same function over the same
 * registry, so they cannot drift. Gap reference: XMP-10, XMP-12 in xmp-inventory.xlsx.
 */

export type Persona = 'admin' | 'user' | 'agent' | 'tier' | 'org' | 'listing';

export interface Session {
  persona: Persona;
  /** Mirrors v2 `userPermission.nav_menu_list` */
  navMenuList: string[];
  /** Mirrors v2 `state.nav.accountApps` product flags */
  appFlags: string[];
  /** Mirrors v2 `persona_features.access_list` */
  features: string[];
  /** Mirrors v2 `userPermission.<resource>` CRUD verbs */
  verbs: Record<string, string[]>;
  isSuperAdmin: boolean;
}

export interface Gate {
  /** v2 `accessKey`. Comma form means OR, exactly as v2 does. */
  accessKey?: string;
  /** v2 `app` product flag */
  app?: string;
  /** v2 `feature` persona feature */
  feature?: string;
  personas?: Persona[];
}

export function isAllowed(gate: Gate | undefined, session: Session): boolean {
  if (!gate) return true;

  if (gate.personas && !gate.personas.includes(session.persona)) return false;

  if (gate.accessKey) {
    // v2 semantics: a comma-separated accessKey passes if ANY key is held.
    const keys = gate.accessKey.split(',').map((k) => k.trim());
    if (!keys.some((k) => session.navMenuList.includes(k))) return false;
  }

  if (gate.app && !session.appFlags.includes(gate.app)) return false;
  if (gate.feature && !session.features.includes(gate.feature)) return false;

  return true;
}

/** Resource-verb check, mirroring v2's `userPermission.account.includes('create')`. */
export function can(session: Session, resource: string, verb: string): boolean {
  return session.verbs[resource]?.includes(verb) ?? false;
}
