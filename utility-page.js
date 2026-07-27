import { requireAuth } from "./auth-helpers.js";

requireAuth().catch(() => null);
