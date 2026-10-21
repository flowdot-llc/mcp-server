/**
 * Email attachment MCP tools (Docs/EMAIL_ATTACHMENTS.md 5.3, 5.4).
 */
import { describe, it, expect, vi } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { handleEmailReply } from './email-reply.js';
import { handleEmailRead } from './email-read.js';
import { handleEmailAttachmentFetch } from './email-attachments.js';
import { tools } from './index.js';

const text = (r: { content: Array<{ text?: string }> }) => r.content.map((c) => c.text).join('\n');

describe('email_reply', () => {
  it('sends the reply-all flag as `all` and no attachment marker without attachments (D4)', async () => {
    const api = { callEmailTool: vi.fn(async () => ({ message_id: '<n@x>' })), callEmailToolWithLocalAttachments: vi.fn() };
    await handleEmailReply(api as never, { integration_id: 3, message_id: 'm', body: 'b', reply_all: true });
    expect(api.callEmailTool).toHaveBeenCalledWith('reply', { integration_id: 3, payload: { message_id: 'm', body: 'b', all: true } });
    expect(api.callEmailToolWithLocalAttachments).not.toHaveBeenCalled();
  });

  it('reads local files and sends them through the local-attachment call', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-att-'));
    const f = path.join(dir, 'signed.pdf');
    fs.writeFileSync(f, '%PDF-1.7');
    const api = {
      getEmailAttachmentLimits: vi.fn(async () => ({ max_outbound_count: 10, max_outbound_bytes: 1000, max_bytes: 1, max_reply_body_bytes: 1, ttl_minutes: 1 })),
      callEmailTool: vi.fn(),
      callEmailToolWithLocalAttachments: vi.fn(async () => ({ message_id: '<n@x>' })),
    };
    const r = await handleEmailReply(api as never, { integration_id: 3, message_id: 'm', body: 'b', attachments: [{ path: f }] });
    expect(r.isError).toBeFalsy();
    expect(api.callEmailToolWithLocalAttachments).toHaveBeenCalledWith('reply', {
      integration_id: 3,
      payload: { message_id: 'm', body: 'b', all: false, attachments: [{ filename: 'signed.pdf', mime_type: 'application/pdf', content_base64: Buffer.from('%PDF-1.7').toString('base64') }] },
    });
    expect(api.callEmailTool).not.toHaveBeenCalled();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('refuses a folder as an attachment before anything is sent', async () => {
    const api = {
      getEmailAttachmentLimits: vi.fn(async () => ({ max_outbound_count: 10, max_outbound_bytes: 1000 })),
      callEmailToolWithLocalAttachments: vi.fn(),
    };
    const r = await handleEmailReply(api as never, { integration_id: 3, message_id: 'm', body: 'b', attachments: [{ path: os.tmpdir() }] });
    expect(r.isError).toBe(true);
    expect(api.callEmailToolWithLocalAttachments).not.toHaveBeenCalled();
  });

  it('tells the caller not to resend when the send is unconfirmed', async () => {
    const api = { callEmailTool: vi.fn(async () => { throw new Error('send_unconfirmed'); }) };
    const r = await handleEmailReply(api as never, { integration_id: 3, message_id: 'm', body: 'b' });
    expect(text(r)).toMatch(/check the Sent folder before trying again/);
  });
});

describe('email_read', () => {
  it('lists attachment ids and fences sender names as untrusted', async () => {
    const api = { callEmailTool: vi.fn(async () => ({
      headers: { from: 'a@x', subject: 's' },
      body_text: 'hi',
      attachments: [
        { attachment_id: 'g:1', filename: 'evil`name.pdf', mime: 'application/pdf', size: 10, downloadable: true },
        { attachment_id: null, filename: 'link', mime: 'application/octet-stream', size: null, downloadable: false },
      ],
    })) };
    const t = text(await handleEmailRead(api as never, { integration_id: 1, message_id: 'm' }));
    expect(t).toContain("`evil'name.pdf`");
    expect(t).toContain('attachment_id: g:1');
    expect(t).toContain('not downloadable');
    expect(t).toContain('untrusted');
  });
});

describe('email_attachment_fetch', () => {
  it('returns metadata and the download page, never bytes', async () => {
    const api = { fetchEmailAttachment: vi.fn(async () => ({
      quarantine_id: 'q', filename: 'a.pdf', declared_type: 'application/pdf', size_bytes: 5, sha256: 'ab', status: 'stored',
      expires_at: 'x', untrusted_metadata: [], download_page: 'https://flowdot.ai/email/attachments/q',
    })) };
    const t = text(await handleEmailAttachmentFetch(api as never, { integration_id: 1, message_id: 'm', attachment_id: 'a' }));
    expect(t).toContain('https://flowdot.ai/email/attachments/q');
    expect(t).toMatch(/Do not run it/);
  });
});

it('registers the four attachment tools', () => {
  const names = tools.map((t) => t.name);
  for (const n of ['email_attachment_download', 'email_attachment_fetch', 'email_attachments_quarantined', 'email_attachment_delete']) {
    expect(names).toContain(n);
  }
});
