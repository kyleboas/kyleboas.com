export const PROXY_URL = 'https://infiniteflightapi.deno.dev';
export const SESSION_ID = '9bdfef34-f03b-4413-b8fa-c29949bb18f8';

export let allFlights = [];
export let headingFilterActive = false;
export let boldedHeadings = { minHeading: null, maxHeading: null };
export let hiddenDistance = { minDistance: null, maxDistance: null };
export let distanceFilterActive = false;
export let minDistance = null;
export let maxDistance = null;
export let updateInterval = null;
export let updateTimeout = null;
export let countdownInterval = null;
export let hideOtherAircraft = false;
export let boldHeadingEnabled = false;
export let applyDistanceFilterEnabled = false;
export let isAutoUpdateActive = false;
export let airportCoordinates = null;
export let interpolatedFlights = [];
export let lastApiUpdateTime = null;

export function getFlights() {
    return allFlights && allFlights.length > 0 ? allFlights : interpolatedFlights;
}