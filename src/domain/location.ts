import { UNKNOWN_COUNTY, UNKNOWN_SUBCOUNTY, UNKNOWN_VILLAGE, UNKNOWN_WARD } from './constants';

export type AdminLocation = {
  county: string;
  subcounty: string;
  ward: string;
  village: string;
};

export {
  UNKNOWN_COUNTY,
  UNKNOWN_SUBCOUNTY,
  UNKNOWN_WARD,
  UNKNOWN_VILLAGE,
} from './constants';

export function normalizeLocation(raw: unknown): AdminLocation {
  if (!raw || typeof raw !== 'object') {
    return {
      county: UNKNOWN_COUNTY,
      subcounty: UNKNOWN_SUBCOUNTY,
      ward: UNKNOWN_WARD,
      village: UNKNOWN_VILLAGE,
    };
  }
  const o = raw as Record<string, unknown>;
  return {
    county: String(o.county ?? o.County ?? UNKNOWN_COUNTY).trim() || UNKNOWN_COUNTY,
    subcounty: String(
      o.subcounty ?? o.subCounty ?? o.sub_county ?? UNKNOWN_SUBCOUNTY,
    ).trim() || UNKNOWN_SUBCOUNTY,
    ward: String(o.ward ?? o.Ward ?? UNKNOWN_WARD).trim() || UNKNOWN_WARD,
    village: String(o.village ?? o.Village ?? UNKNOWN_VILLAGE).trim() || UNKNOWN_VILLAGE,
  };
}

export function formatLocation(loc: AdminLocation): string {
  return [loc.county, loc.subcounty, loc.ward, loc.village].join(' · ');
}
