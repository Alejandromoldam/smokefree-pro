const CANONICAL_PROTOCOL = "https";
const CANONICAL_HOST = "allinonestore.lat";

export function getCanonicalSiteUrl() {
  return `${CANONICAL_PROTOCOL}://${CANONICAL_HOST}`;
}

export function getCanonicalHost() {
  return CANONICAL_HOST;
}
