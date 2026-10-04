/**
 * Text for a FlowDot limit refusal, written for the model that receives the tool
 * result (handoff 2026-10-01 Task C).
 *
 * An MCP tool result goes to the calling agent, not to the person. So when the Hub
 * attaches an upgrade offer (free users only, numbers from the plan rows), the text
 * tells the agent to pass that offer on, with the link. Paid users, and limits no
 * plan raises, get the reason and the reset only.
 */

import type { LimitRefusalFormatter } from '@flowdot.ai/api';

interface UpgradeOffer {
  sentence: string;
  url: string;
}

function upgradeOffer(body: Record<string, unknown>): UpgradeOffer | null {
  const upgrade = body.upgrade;
  if (!upgrade || typeof upgrade !== 'object') return null;
  const { sentence, url } = upgrade as Record<string, unknown>;
  if (typeof sentence !== 'string' || typeof url !== 'string') return null;
  return { sentence, url };
}

export const formatLimitRefusalForAgent: LimitRefusalFormatter = (_status, body, hubUrl) => {
  const reason = typeof body.message === 'string' && body.message !== ''
    ? body.message
    : String(body.error ?? 'A FlowDot plan limit was reached.');
  const parts = [`FlowDot plan limit reached: ${reason}`];

  if (typeof body.resetTime === 'string' && body.resetTime !== '') {
    parts.push(`It resets at ${body.resetTime}.`);
  }

  const offer = upgradeOffer(body);
  if (offer) {
    parts.push(`Tell the user: ${offer.sentence} They can upgrade at ${hubUrl}${offer.url}`);
  }

  parts.push('Do not retry this call until the limit resets or the user upgrades.');
  return parts.join(' ');
};
