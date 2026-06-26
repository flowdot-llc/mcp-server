/**
 * audit_property Tool
 *
 * Full-scope audit of any shareable FlowDot property before using/installing it.
 * Required scope: discovery:read
 */

import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';
import type { AuditableType } from '@flowdot.ai/api';

export const auditPropertyTool: Tool = {
  name: 'audit_property',
  description: `Audit a FlowDot property — a deterministic, full-scope inspection of what it can DO and REACH — before recommending, installing, or running it.

**What you get back**
- **Capability tags** at a glance: \`network\`, \`knowledge_base\`, \`llm\`, \`file\`, \`external_effect\`, \`toolkit\`, \`credentials\`, \`sub_invoke\`, \`human_gate\`.
- **Network calls** — the literal outbound hosts + methods it can hit.
- **Knowledge base** access, **LLM** calls (provider/model), **credentials** it requires (key + type, never the secret value), **external side-effects** (posting to Slack/etc.), **file** access, and **linked** properties it pulls in (recursively).
- **gaps[]** — things that could NOT be statically proven (e.g. an app's dynamic \`import()\`), stated honestly.
- **Provenance** — current author (+ profile hash) and copy/fork lineage.

**Use it to answer** "what does this toolkit/app/workflow/recipe actually call, and is that safe?"

**Types** (\`type\` arg): \`workflow\`, \`app\`, \`agent_recipe\`, \`agent_toolkit\`, \`custom_node\`, \`agent_character\`. \`hash\` is the property's public hash (the same id returned by \`search\`).

**Typical flow:** \`search\` to find a property → \`audit_property\` to inspect its scope → report to the user.

The scan is read-only and reflects the property's current state (it is re-cached automatically whenever the author edits it).`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      type: {
        type: 'string',
        enum: ['workflow', 'app', 'agent_recipe', 'agent_toolkit', 'custom_node', 'agent_character'],
        description: 'The property type to audit',
      },
      hash: {
        type: 'string',
        description: "The property's public hash (as returned by search)",
      },
    },
    required: ['type', 'hash'],
  },
};

export async function handleAuditProperty(
  client: FlowDotApiClient,
  args: { type: string; hash: string }
): Promise<CallToolResult> {
  try {
    const audit = await client.auditProperty(args.type as AuditableType, args.hash);
    const { identity, provenance, scan } = audit;

    const lines: string[] = [];
    lines.push(`# Audit — ${identity.name} (${identity.type})`);
    if (identity.owner) {
      lines.push(`Author: ${identity.owner.name} (profile: /users/${identity.owner.hash})`);
    }
    lines.push('');
    lines.push(
      `## Capabilities: ${scan.capability_tags.length ? scan.capability_tags.join(', ') : 'none detected'}`
    );

    if (scan.network.length) {
      lines.push('\n### Network calls');
      for (const n of scan.network) {
        lines.push(`- ${n.method ? n.method + ' ' : ''}${n.host ?? 'host not statically resolvable'}  (${n.source})`);
      }
    }
    if (scan.knowledge_base.length) {
      lines.push('\n### Knowledge base');
      for (const k of scan.knowledge_base) lines.push(`- ${k.access} (${k.source})`);
    }
    if (scan.llm.length) {
      lines.push('\n### LLM calls');
      for (const l of scan.llm) {
        lines.push(`- ${l.provider || l.model ? `${l.provider ?? '?'} / ${l.model ?? '?'}` : 'language model'} (${l.source})`);
      }
    }
    if (scan.toolkits.length) {
      lines.push('\n### Toolkits');
      for (const t of scan.toolkits) lines.push(`- ${t.name}${t.tools && t.tools.length ? ` (${t.tools.join(', ')})` : ''}`);
    }
    if (scan.credentials.length) {
      lines.push('\n### Credentials required');
      for (const c of scan.credentials) lines.push(`- ${c.label ?? c.key} — ${c.type}${c.required ? ' (required)' : ''}`);
    }
    if (scan.external_effects.length) {
      lines.push('\n### External effects');
      for (const e of scan.external_effects) lines.push(`- ${e.kind}${e.target ? `: ${e.target}` : ''} (${e.source})`);
    }
    if (scan.files.length) {
      lines.push('\n### File access');
      for (const f of scan.files) lines.push(`- ${f.kind} (${f.source})`);
    }
    if (scan.linked.length) {
      lines.push('\n### Linked properties (resolved)');
      for (const l of scan.linked) lines.push(`- ${l.name} (${l.type})`);
    }
    if (scan.gaps.length) {
      lines.push('\n### ⚠️ Could not be fully verified');
      for (const g of scan.gaps) lines.push(`- ${g}`);
    }
    if (scan.notes.length) {
      lines.push('\n### Notes');
      for (const n of scan.notes) lines.push(`- ${n}`);
    }

    const counts = Object.entries(provenance.counts).map(([k, v]) => `${v} ${k.replace('_', ' ')}`);
    if (counts.length || provenance.chain.length > 1) {
      lines.push('\n### Provenance');
      if (counts.length) lines.push(`- ${counts.join(', ')}`);
      if (provenance.chain.length > 1) lines.push(`- lineage depth: ${provenance.chain.length}`);
    }

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Failed to audit ${args.type}/${args.hash}: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}
