export const PROXY_URL = 'https://infiniteflightapi.deno.dev';
export const SESSION_ID = '9bdfef34-f03b-4413-b8fa-c29949bb18f8';

export let state = {
    allFlights: [],
    headingFilterActive: false,
    boldedHeadings: { minHeading: null, maxHeading: null },
    hiddenDistance: { minDistance: null, maxDistance: null },
    distanceFilterActive: false,
    minDistance: null,
    maxDistance: null,
    updateInterval: null,
    updateTimeout: null,
    countdownInterval: null,
    hideOtherAircraft: false,
    boldHeadingEnabled: false,
    applyDistanceFilterEnabled: false,
    isAutoUpdateActive: false,
    airportCoordinates: null,
    interpolatedFlights: [],
    lastApiUpdateTime: null
};