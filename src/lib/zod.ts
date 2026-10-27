import { z } from "zod";

// Zod normally probes `new Function` once to compile faster validators. Our
// Content-Security-Policy forbids eval (src/proxy.ts), so the probe is blocked
// and the browser reports a CSP violation even though Zod recovers. jitless
// skips the probe; our schemas are small, so the speed difference is nil.
// Import `z` from here, not from "zod", so this always runs first.
z.config({ jitless: true });

export { z };
