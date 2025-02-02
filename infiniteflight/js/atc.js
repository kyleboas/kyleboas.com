import { fetchWithProxy } from './api.js';
import { SESSION_ID } from './config.js';

export async function fetchATCData() {
    return await fetchWithProxy(`/sessions/${SESSION_ID}/atc`);
}