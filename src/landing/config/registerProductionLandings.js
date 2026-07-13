/**
 * Registers production landing pages (Sprint 2.3+).
 * Side-effect import from LandingRouter.jsx at app startup.
 */

import { registerBrandLandingPages } from "./buildBrandLandingConfig.js";
import {
  registerPriceLandingPages,
  registerUseCaseLandingPages,
} from "./buildBestEvsLandingConfig.js";

registerBrandLandingPages();
registerPriceLandingPages();
registerUseCaseLandingPages();
