"use client";

import { useSPALStore, type BusinessType } from "@/store";
import { isPerishable } from "@/lib/business-mode";

/**
 * Which dashboard experience the signed-in user is on (perishable vs retail).
 *
 * The persisted "active business" can be missing after a full reload, or left
 * over from another account signed in on the same browser, so it only counts if
 * it belongs to the current user. Otherwise the account's own business type wins.
 * `ready` is false until the user has loaded, so callers never pick the wrong
 * data source for a moment and then switch.
 */
export function useBusinessMode(): { ready: boolean; type: BusinessType | undefined; perishable: boolean } {
  const { user, activeBusiness } = useSPALStore();
  if (!user) return { ready: false, type: undefined, perishable: false };
  const own = activeBusiness && activeBusiness.user_id === user.id ? activeBusiness : null;
  const type = own?.business_type ?? user.business_type;
  return { ready: true, type, perishable: isPerishable(type) };
}
