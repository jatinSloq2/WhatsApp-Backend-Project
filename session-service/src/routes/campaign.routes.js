import { Router } from "express";
import {
  getCampaigns,
  getCampaignById,
} from "../controllers/campaign.controller.js";

const router = Router();

router.get("/", getCampaigns);
router.get("/:id", getCampaignById);

export default router;