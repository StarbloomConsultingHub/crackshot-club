export const placements = ['home', 'smoothbore-hall', 'gallery-hall', 'arcade-lobby'];
const shortText = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.length <= max;

export function validCampaign(campaign) {
  if (!campaign || typeof campaign.id !== 'string' || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(campaign.id)) return false;
  if (!shortText(campaign.name, 60) || !shortText(campaign.headline, 80) || !shortText(campaign.description, 180)) return false;
  if (!shortText(campaign.linkLabel, 40) || !Array.isArray(campaign.placements) || !campaign.placements.length) return false;
  if (!campaign.placements.every(value => placements.includes(value))) return false;
  // An explicit UTC offset prevents a server-local time from silently moving a booking.
  const dated = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value));
  if (!dated(campaign.startsAt) || !dated(campaign.endsAt) || Date.parse(campaign.startsAt) >= Date.parse(campaign.endsAt)) return false;
  if (!Number.isInteger(campaign.priority) || campaign.priority < 0 || campaign.priority > 100) return false;
  try {
    const url = new URL(campaign.url);
    if (url.protocol !== 'https:' || url.username || url.password) return false;
  } catch { return false; }
  if (campaign.image && (!/^\/assets\/sponsors\/[a-z0-9-]+\.(webp|png|jpg)$/.test(campaign.image) || !shortText(campaign.imageAlt, 180))) return false;
  return true;
}

export function selectCampaign(campaigns, placement, now = Date.now()) {
  const eligible = campaigns.filter(item => validCampaign(item) && item.enabled === true && item.placements.includes(placement));
  const active = eligible.filter(item => Date.parse(item.startsAt) <= now && now < Date.parse(item.endsAt))
    .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id))[0];
  const boundaries = eligible.flatMap(item => [Date.parse(item.startsAt), Date.parse(item.endsAt)]).filter(time => time > now);
  const refreshAfterMs = boundaries.length ? Math.min(...boundaries) - now : null;
  if (!active) return { campaign: null, refreshAfterMs };
  const { id, name, headline, description, url, linkLabel, image, imageAlt } = active;
  return { campaign: { id, name, headline, description, url, linkLabel, ...(image ? { image, imageAlt } : {}) }, refreshAfterMs };
}

export function validEmail(value) {
  return typeof value === 'string' && value.length <= 254 && /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/.test(value);
}
