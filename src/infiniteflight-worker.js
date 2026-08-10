import { handleInfiniteFlightRequest } from './infiniteflight-core.js';
import { InfiniteFlightUpstreamCoordinator } from './infiniteflight-durable-object.js';

export { InfiniteFlightUpstreamCoordinator };

export default {
  fetch(request, env) {
    return handleInfiniteFlightRequest(request, env);
  },
};
