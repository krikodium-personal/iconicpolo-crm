import { db } from '@/db';

export const SESSION_COOKIE = 'iconic_session';
const SESSION_DAYS = 30;
const PBKDF2_ITERS = 100_000;

export type SessionUser = {
  id: string;
  name: string;
  email: string;
};

function stmt(sql: string, ...args: (string | number | null)[]) {
  return db()
    .prepare(sql)
    .bind(...args);
}

function obj(v: unknown): Record<string, unknown> {
  if (!v || typeof v !== 'object' || Array.isArray(v))
    throw new Error('Datos inválidos.');
  return v as Record<string, unknown>;
}

function bytesToB64(bytes: Uint8Array) {
  let bin = '';
  for (const byte of bytes) bin += String.fromCharCode(byte);
  return btoa(bin);
}

function b64ToBytes(value: string) {
  const bin = atob(value);
  return Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
}

export function parseCookie(header: string | null, name: string) {
  if (!header) return '';
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return '';
}

export function sessionCookie(token: string, request: Request) {
  const secure =
    new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}${secure}`;
}

export function clearSessionCookie(request: Request) {
  const secure =
    new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

export function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validPassword(value: string) {
  return value.length >= 8 && value.length <= 72;
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const secret = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: PBKDF2_ITERS },
    secret,
    256,
  );
  return `pbkdf2$${PBKDF2_ITERS}$${bytesToB64(salt)}$${bytesToB64(new Uint8Array(bits))}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [scheme, iter, saltB64, hashB64] = stored.split('$');
  if (scheme !== 'pbkdf2' || !iter || !saltB64 || !hashB64) return false;
  const secret = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: b64ToBytes(saltB64),
      iterations: Number(iter) || PBKDF2_ITERS,
    },
    secret,
    256,
  );
  const left = bytesToB64(new Uint8Array(bits));
  if (left.length !== hashB64.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1)
    diff |= left.charCodeAt(i) ^ hashB64.charCodeAt(i);
  return diff === 0;
}

async function sha256(value: string) {
  const bytes = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value),
  );
  return bytesToB64(new Uint8Array(bytes));
}

export async function createSession(partnerId: string) {
  const token = bytesToB64(crypto.getRandomValues(new Uint8Array(32)));
  const expires = new Date(
    Date.now() + SESSION_DAYS * 86400 * 1000,
  ).toISOString();
  await stmt(
    'INSERT INTO sessions(id,partner_id,expires_at) VALUES(?,?,?)',
    await sha256(token),
    partnerId,
    expires,
  ).run();
  return token;
}

export async function destroySession(request: Request) {
  const token = parseCookie(request.headers.get('cookie'), SESSION_COOKIE);
  if (!token) return;
  await stmt('DELETE FROM sessions WHERE id=?', await sha256(token)).run();
}

export async function readUser(request: Request): Promise<SessionUser | null> {
  const token = parseCookie(request.headers.get('cookie'), SESSION_COOKIE);
  if (!token) return null;
  const row = await stmt(
    `SELECT p.id, p.name, p.email, s.expires_at
     FROM sessions s JOIN partners p ON p.id=s.partner_id
     WHERE s.id=? AND p.archived=0`,
    await sha256(token),
  ).first();
  if (!row) return null;
  const session = obj(row);
  if (String(session.expires_at) <= new Date().toISOString()) {
    await stmt('DELETE FROM sessions WHERE id=?', await sha256(token)).run();
    return null;
  }
  return {
    id: String(session.id),
    name: String(session.name),
    email: String(session.email || ''),
  };
}

export async function requireUser(request: Request) {
  const user = await readUser(request);
  if (!user) throw new Error('Tenés que ingresar.');
  return user;
}

export async function partnersForSetup() {
  const rows = (
    await stmt(
      "SELECT id, name FROM partners WHERE archived=0 AND COALESCE(password_hash,'')='' ORDER BY name",
    ).all()
  ).results;
  return rows.map((row) => {
    const partner = obj(row);
    return { id: String(partner.id), name: String(partner.name) };
  });
}

export async function hasAnyPassword() {
  const row = await stmt(
    "SELECT id FROM partners WHERE archived=0 AND COALESCE(password_hash,'')!='' LIMIT 1",
  ).first();
  return !!row;
}

export async function setPartnerAccess(
  id: string,
  email: string,
  password?: string,
) {
  const mail = email.trim().toLowerCase();
  if (!validEmail(mail)) throw new Error('Email inválido.');
  const taken = await stmt(
    'SELECT id FROM partners WHERE email=? AND id!=?',
    mail,
    id,
  ).first();
  if (taken) throw new Error('Ese email ya está en uso.');
  if (password != null && password !== '') {
    if (!validPassword(password))
      throw new Error('La contraseña debe tener al menos 8 caracteres.');
    const r = await stmt(
      'UPDATE partners SET email=?,password_hash=?,version=version+1 WHERE id=? AND archived=0',
      mail,
      await hashPassword(password),
      id,
    ).run();
    if (!r.meta.changes) throw new Error('Socio no disponible.');
    return;
  }
  const r = await stmt(
    'UPDATE partners SET email=?,version=version+1 WHERE id=? AND archived=0',
    mail,
    id,
  ).run();
  if (!r.meta.changes) throw new Error('Socio no disponible.');
}

export function unauthorized() {
  return Response.json({ error: 'Tenés que ingresar.' }, { status: 401 });
}
