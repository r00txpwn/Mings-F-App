/**
 * Modifier groups use `max_select` from the DB. Staff sometimes set max equal to the
 * number of options (thinking "how many choices we list") for mutually exclusive
 * sets like spice level — that must behave as a single choice.
 *
 * We also treat well-known group name patterns (spice / heat / acılı / …) as
 * exclusive when max_select is still > 1 so the customer cannot pick multiple levels.
 */
/** Group titles that imply one mutually exclusive choice (spice tier, heat, etc.). */
const EXCLUSIVE_CHOICE_NAME =
  /(?:^|[\s,])(?:spice|spicy|spiciness|acılı|остр(?:ота|оты)?|is[ıi]dl[ıi]|chili\s*level|heat\s*level|dərəc[əe]|s[əe]viyy[əe])(?:$|[\s,])/iu;

export function modifierGroupLooksExclusiveByName(name: string | undefined | null): boolean {
  if (!name?.trim()) return false;
  return EXCLUSIVE_CHOICE_NAME.test(name);
}

export type ModifierGroupLike = {
  name?: string | null;
  min_select?: number | null;
  max_select?: number | null;
  modifier_options?: unknown[] | null;
};

/**
 * Effective max selections for a modifier group (for UI + cart validation alignment).
 */
export function effectiveModifierGroupMaxSelect(group: ModifierGroupLike): number {
  const raw = Number(group.max_select);
  const max = !Number.isFinite(raw) || raw < 1 ? 1 : Math.floor(raw);

  if (max > 1 && modifierGroupLooksExclusiveByName(group.name)) {
    return 1;
  }

  return max;
}

export function isSingleSelectModifierGroup(group: ModifierGroupLike): boolean {
  return effectiveModifierGroupMaxSelect(group) <= 1;
}
