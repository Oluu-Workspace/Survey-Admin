export const UNKNOWN_COUNTY = 'Unknown County';
export const UNKNOWN_SUBCOUNTY = 'Unknown Sub County';
export const UNKNOWN_WARD = 'Unknown Ward';
export const UNKNOWN_VILLAGE = 'Unknown Village';

/** True for any casing / punctuation variant of unknown location placeholders. */
export function isUnknownLocationValue(value: string | null | undefined): boolean {
  if (value == null || !String(value).trim()) return true;
  const n = String(value).trim().toLowerCase().replace(/[_-]+/g, ' ');
  return (
    n === 'unknown' ||
    n === 'unknown county' ||
    n === 'unknown sub county' ||
    n === 'unknown subcounty' ||
    n === 'unknown ward' ||
    n === 'unknown village'
  );
}
