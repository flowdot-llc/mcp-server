import { describe, it, expect, vi } from 'vitest';
import * as calendar from './calendar.js';
import { tools } from './index.js';

const text = (r: { content: Array<unknown> }) => r.content.map((c) => (c as { text?: string }).text).join('\n');
const cases = [
  ['calendar_list_calendars', calendar.handleCalendarListCalendars, { page_token: 'cursor' }],
  ['calendar_list_events', calendar.handleCalendarListEvents, { calendar_id: 'primary', time_min: '2026-01-01T00:00:00Z', time_max: '2026-01-02T00:00:00Z', query: 'meeting', max: 50, page_token: 'cursor' }],
  ['calendar_get_event', calendar.handleCalendarGetEvent, { calendar_id: 'primary', event_id: 'event', description_from: 0 }],
  ['calendar_availability', calendar.handleCalendarAvailability, { time_min: '2026-01-01T00:00:00Z', time_max: '2026-01-02T00:00:00Z', calendars: ['primary'] }],
  ['calendar_create_event', calendar.handleCalendarCreateEvent, { idempotency_key: 'intended-event', calendar_id: 'primary', title: 'Meeting', start: { date_time: '2026-01-01T10:00:00Z', time_zone: 'UTC' }, end: { date_time: '2026-01-01T11:00:00Z', time_zone: 'UTC' }, description: 'Data', location: 'Office', recurrence: 'RRULE:FREQ=DAILY', visibility: 'private', busy: true, notify: 'all' }],
  ['calendar_update_event', calendar.handleCalendarUpdateEvent, { calendar_id: 'primary', event_id: 'event', apply_to: 'this', title: 'Changed', notify: 'all' }],
  ['calendar_delete_event', calendar.handleCalendarDeleteEvent, { calendar_id: 'primary', event_id: 'event', apply_to: 'this', notify: 'all' }],

] as const;

describe('calendar tools', () => {
  it('registers all eight tools with closed schemas', () => {
    const names = ['list_calendar_integrations', ...cases.map(([name]) => name)];
    expect(calendar.calendarTools.map((tool) => tool.name)).toEqual(names);
    for (const name of names) {
      const registered = tools.filter((tool) => tool.name === name);
      expect(registered, name).toHaveLength(1);
      expect(registered[0].inputSchema.additionalProperties, name).toBe(false);
    }
  });

  for (const [name, handler, args] of cases) {
    it(`${name} dispatches the correct tool and body`, async () => {
      const api = { callCalendarTool: vi.fn(async () => ({ complete: true })) };
      const result = await handler(api as never, { integration_id: 3, ...args } as never);
      expect(result.isError).toBeFalsy();
      expect(api.callCalendarTool).toHaveBeenCalledExactlyOnceWith(name, { integration_id: 3, payload: args });
    });
  }

  it('lists integrations through the Hub and reports none', async () => {
    const api = { listCalendarIntegrations: vi.fn(async () => []) };
    const result = await calendar.handleListCalendarIntegrations(api as never);
    expect(api.listCalendarIntegrations).toHaveBeenCalledExactlyOnceWith();
    expect(result.isError).toBeFalsy();
    expect(text(result)).toBe(calendar.CALENDAR_INTEGRATIONS_NONE_TEXT);
  });

  it('reports found integrations', async () => {
    const api = { listCalendarIntegrations: vi.fn(async () => [{ id: 3, integration_name: 'Work', integration_type: 'google', last_used_at: null }]) };
    const result = await calendar.handleListCalendarIntegrations(api as never);
    expect(api.listCalendarIntegrations).toHaveBeenCalledExactlyOnceWith();
    expect(result.isError).toBeFalsy();
    expect(text(result)).toMatch(calendar.calendarIntegrationsFoundPattern);
    expect(text(result)).toContain('Work');
    expect(text(result)).toContain('3');
    expect(text(result)).toContain('google');
  });

  it('shows each connection scope_tier, and unknown when the Hub sends none', async () => {
    const api = { listCalendarIntegrations: vi.fn(async () => [
      { id: 3, integration_name: 'Work', integration_type: 'google_calendar', last_used_at: null, scope_tier: 'read' },
      { id: 4, integration_name: 'Home', integration_type: 'outlook_calendar', last_used_at: null, scope_tier: 'write' },
      { id: 5, integration_name: 'Old', integration_type: 'google_calendar', last_used_at: null, scope_tier: null },
    ]) };
    const lines = text(await calendar.handleListCalendarIntegrations(api as never)).split('\n');
    expect(lines.find((l) => l.includes('ID: 3'))).toContain('scope_tier read');
    expect(lines.find((l) => l.includes('ID: 4'))).toContain('scope_tier write');
    expect(lines.find((l) => l.includes('ID: 5'))).toContain('scope_tier unknown');
  });

  it('tells the agent to pick a write connection when one is read-only', () => {
    const byName = Object.fromEntries(calendar.calendarTools.map((t) => [t.name, t.description ?? '']));
    expect(byName.list_calendar_integrations).toContain('Each row has scope_tier: read connections can only read; use a write connection to create, change or delete events.');
    for (const name of ['calendar_create_event', 'calendar_update_event', 'calendar_delete_event']) {
      expect(byName[name], name).toContain('tier_read_only means this connection cannot change events: use another connection from list_calendar_integrations whose scope_tier is write. Tell the user only if none accepts the change.');
    }
    for (const name of ['calendar_list_calendars', 'calendar_list_events', 'calendar_get_event', 'calendar_availability']) {
      expect(byName[name], name).not.toContain('tier_read_only');
    }
  });

  it('reports a conflict answer and audit status', async () => {
    const api = { callCalendarTool: vi.fn(async () => ({ outcome: 'conflict', event_id: 'event', calendar_id: 'primary', audit_written: false })) };
    const result = await calendar.handleCalendarUpdateEvent(api as never, { integration_id: 3, calendar_id: 'primary', event_id: 'event', apply_to: 'this', title: 'Changed' } as never);
    expect(text(result)).toContain('conflict');
    expect(text(result)).toContain('audit_written');
    expect(text(result)).toContain('false');
    expect(api.callCalendarTool).toHaveBeenCalledTimes(1);
  });
});
