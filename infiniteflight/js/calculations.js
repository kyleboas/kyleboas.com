



// Parses ETA string in "minutes:seconds" format to total seconds
function parseETAInSeconds(eta) {
    if (typeof eta !== 'string' || eta === 'N/A' || eta.startsWith('>')) {
        return Number.MAX_SAFE_INTEGER; // Return a large number for invalid or undefined ETAs
    }

    const [minutes, seconds] = eta.split(':').map(Number);
    if (isNaN(minutes) || isNaN(seconds)) {
        return Number.MAX_SAFE_INTEGER; // Return a large number for invalid formats
    }

    return minutes * 60 + seconds;
}