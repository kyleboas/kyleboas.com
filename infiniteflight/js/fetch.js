import { PROXY_URL, SESSION_ID } from './constants.js';

export async function fetchWithProxy(endpoint) {
    try {
        const response = await fetch(`${PROXY_URL}${endpoint}`);
        if (!response.ok) {
            const errorData = await response.text();
            console.error('Error from proxy:', errorData);
            throw new Error(`Error fetching data: ${response.status}`);
        }

        const textResponse = await response.text();
        try {
            return JSON.parse(textResponse);
        } catch {
            throw new Error('Invalid JSON response');
        }
    } catch (error) {
        console.error('Error communicating with proxy:', error.message);
        throw error;
    }
}