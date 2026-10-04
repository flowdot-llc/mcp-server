import { describe, expect, it } from 'vitest';
import { formatLimitRefusalForAgent } from './limit-refusal-text.js';

const base = {
  success: false,
  error: 'Execution limit reached',
  message: 'You have reached your execution limit.',
  limitKind: 'executions',
  limit: null,
  remaining: 0,
  resetTime: '2026-10-05T00:00:00+00:00',
  tier: 'free',
  is_paid: false,
  upgradeUrl: '/subscriptions',
};

describe('formatLimitRefusalForAgent', () => {
  it('tells the agent to relay the offer and the full link for a free user', () => {
    const text = formatLimitRefusalForAgent(429, {
      ...base,
      upgrade: {
        sentence: 'The FlowDot Creator plan ($19 a month) raises this from 5 workflow runs a day to 500 workflow runs a month.',
        url: '/subscriptions?source=mcp',
      },
    }, 'https://flowdot.ai');

    expect(text).toBe(
      'FlowDot plan limit reached: You have reached your execution limit. '
      + 'It resets at 2026-10-05T00:00:00+00:00. '
      + 'Tell the user: The FlowDot Creator plan ($19 a month) raises this from 5 workflow runs a day to 500 workflow runs a month. '
      + 'They can upgrade at https://flowdot.ai/subscriptions?source=mcp '
      + 'Do not retry this call until the limit resets or the user upgrades.',
    );
  });

  it('gives only the reason and reset when the Hub sent no offer (paid user)', () => {
    const text = formatLimitRefusalForAgent(429, { ...base, tier: 'creator', is_paid: true }, 'https://flowdot.ai');

    expect(text).not.toContain('Tell the user');
    expect(text).not.toContain('subscriptions');
    expect(text).toContain('It resets at 2026-10-05T00:00:00+00:00.');
  });

  it('ignores a malformed offer instead of printing undefined', () => {
    const text = formatLimitRefusalForAgent(429, { ...base, upgrade: { sentence: 5 } }, 'https://flowdot.ai');

    expect(text).not.toContain('Tell the user');
    expect(text).not.toContain('undefined');
  });

  it('omits the reset sentence when the refusal carries none', () => {
    const text = formatLimitRefusalForAgent(413, { ...base, limitKind: 'storage', resetTime: null }, 'https://flowdot.ai');

    expect(text).not.toContain('resets at');
  });
});
