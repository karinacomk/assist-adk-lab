import { z } from "zod";

const campaigns: Record<string, any> = {
  "camp-001": {
    id: "camp-001",
    name: "Lançamento Verão",
    status: "active",
    budget: 150000,
    ctr: 2.8
  },
  "camp-002": {
    id: "camp-002",
    name: "Awareness Q4",
    status: "paused",
    budget: 90000,
    ctr: 1.9
  }
};

export const getCampaignInput = z.object({
  campaignId: z.string().describe("ID da campanha, por exemplo camp-001")
});

export function consultarCampanha({ campaignId }: z.infer<typeof getCampaignInput>) {
  return campaigns[campaignId] ?? {
    error: `Campanha ${campaignId} não encontrada`
  };
}

export const getMetricsInput = z.object({
  campaignId: z.string().describe("ID da campanha")
});

export function consultarMetricas({ campaignId }: z.infer<typeof getMetricsInput>) {
  const campaign = campaigns[campaignId];
  if (!campaign) return { error: `Campanha ${campaignId} não encontrada` };

  return {
    campaignId,
    impressions: 1284000,
    clicks: 35952,
    ctr: campaign.ctr,
    conversions: 1240,
    spend: 87200
  };
}

export const cancelCampaignInput = z.object({
  campaignId: z.string().describe("ID da campanha a cancelar")
});

export function cancelarCampanha({ campaignId }: z.infer<typeof cancelCampaignInput>) {
  const campaign = campaigns[campaignId];
  if (!campaign) return { error: `Campanha ${campaignId} não encontrada` };

  campaign.status = "cancelled";

  return {
    success: true,
    campaignId,
    status: "cancelled"
  };
}
