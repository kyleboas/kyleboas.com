import { handleInfiniteFlightRequest } from './infiniteflight-core.js';
import { handleNewsletterRequest } from './newsletter-core.js';

export default {
  fetch(request, env) {
    const pathname = new URL(request.url).pathname;
    if (pathname.startsWith('/api/infiniteflight')) {
      return handleInfiniteFlightRequest(request, env);
    }
    return handleNewsletterRequest(request, env);
  },
};
