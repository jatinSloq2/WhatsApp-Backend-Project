import Campaign from "../models/campaign.model.js";

export const getCampaigns = async (req, res) => {
  const { sessionId, status, type } = req.query;

  const filter = {};
  if (sessionId) filter.sessionId = sessionId;
  if (status) filter.status = status;
  if (type) filter.type = type;

  const campaigns = await Campaign.find(filter)
    .sort({ createdAt: -1 })
    .limit(100);

  res.json({ success: true, data: campaigns });
};

export const getCampaignById = async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);

  if (!campaign) {
    return res.status(404).json({
      success: false,
      message: "Campaign not found",
    });
  }

  res.json({ success: true, data: campaign });
};
