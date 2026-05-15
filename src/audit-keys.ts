/**
 * Audit-log key management.
 *
 * On first start we generate an ed25519 key pair and persist:
 *   - private key:  ~/.flowdot/keys/audit.key  (PEM, mode 0o600)
 *   - public key:   ~/.flowdot/keys/audit.pub.pem  (PEM, mode 0o644)
 *
 * The private key is fed to AuditLogWriter via `signWith`; the public key is
 * left readable so operators can verify the log integrity with
 * `guardian-verify --pubkey ~/.flowdot/keys/audit.pub.pem`.
 *
 * Compromise model: an attacker who reads the private key can forge audit
 * records. So `audit.key` MUST live on a filesystem with appropriate
 * permissions (Linux/Mac honor 0o600; Windows operators should use a
 * permission-restricted location or accept that the local user can read it).
 * SECURITY.md covers this in detail.
 */

import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

import type { KeyObject } from 'node:crypto';
import {
  generateEd25519KeyPair,
  loadPrivateKey,
  loadPublicKey,
} from '@flowdot.ai/guardian-agent';

export interface AuditKeyPaths {
  privateKeyPath: string;
  publicKeyPath: string;
}

export interface AuditKeyPair {
  privateKey: KeyObject;
  publicKey: KeyObject;
  paths: AuditKeyPaths;
}

export function defaultAuditKeyDir(): string {
  return join(homedir(), '.flowdot', 'keys');
}

/**
 * Load the audit key pair from disk, or generate + persist a new pair if
 * absent. Idempotent.
 */
export function loadOrCreateAuditKey(options: {
  keyDir?: string;
} = {}): AuditKeyPair {
  const keyDir = options.keyDir ?? process.env.FLOWDOT_AUDIT_KEY_DIR ?? defaultAuditKeyDir();
  const privateKeyPath = join(keyDir, 'audit.key');
  const publicKeyPath = join(keyDir, 'audit.pub.pem');

  if (existsSync(privateKeyPath) && existsSync(publicKeyPath)) {
    const privPem = readFileSync(privateKeyPath);
    const pubPem = readFileSync(publicKeyPath);
    return {
      privateKey: loadPrivateKey(privPem),
      publicKey: loadPublicKey(pubPem),
      paths: { privateKeyPath, publicKeyPath },
    };
  }

  // Generate.
  mkdirSync(dirname(privateKeyPath), { recursive: true, mode: 0o700 });
  const { privateKey, publicKey } = generateEd25519KeyPair();
  const privPem = privateKey.export({ type: 'pkcs8', format: 'pem' });
  const pubPem = publicKey.export({ type: 'spki', format: 'pem' });
  writeFileSync(privateKeyPath, privPem, { mode: 0o600 });
  writeFileSync(publicKeyPath, pubPem, { mode: 0o644 });
  // Re-chmod in case umask suppressed the mode.
  try {
    chmodSync(privateKeyPath, 0o600);
  } catch {
    // Windows: mode bits may not be enforceable. Best-effort.
  }
  try {
    chmodSync(publicKeyPath, 0o644);
  } catch {
    // ditto.
  }

  return {
    privateKey,
    publicKey,
    paths: { privateKeyPath, publicKeyPath },
  };
}
