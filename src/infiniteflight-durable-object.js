import { DurableObject } from 'cloudflare:workers';
import { InfiniteFlightUpstreamCoordinator as Coordinator } from './infiniteflight-coordinator.js';

export class InfiniteFlightUpstreamCoordinator extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.coordinator = new Coordinator(ctx, env);
  }

  fetch(request) {
    return this.coordinator.fetch(request);
  }
}
