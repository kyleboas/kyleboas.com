import { handleNewsletterRequest } from './newsletter-core.js';

export default {
  fetch(request, env) {
    return handleNewsletterRequest(request, env);
  },
};
