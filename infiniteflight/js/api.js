export const AIRPORTDB_URL = "/api/infiniteflight/airport/";

// SIGMET data was supplied by the retired third-party proxy. It is not needed by
// the Inbounds UI, so do not make an unauthenticated request to that defunct host.
export async function fetchSIGMET() {
    return [];
}
