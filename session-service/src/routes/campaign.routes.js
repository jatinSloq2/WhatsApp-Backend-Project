import { Router } from "express";
import {
  getCampaigns,
  getCampaignById,
} from "../controllers/campaign.controller.js";
import { authenticate } from "../../../shared/middleware/auth.middleware.js";

const router = Router();
router.use(authenticate);

router.get("/", getCampaigns);
router.get("/:id", getCampaignById);

export default router;