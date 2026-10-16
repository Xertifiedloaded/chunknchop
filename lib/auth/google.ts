
import { createHash, randomBytes, timingSafeEqual } from "crypto";
import jwt from "jsonwebtoken";
import { createRemoteJWKSet, jwtVerify } from "jose";

import { getSecret } from "@/lib/auth";

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));
const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];

export type OAuthRole = "CUSTOMER" | "SUPPLIER";

interface OAuthState {
  state: string;
  verifier: string;
  nonce: string;
  role: OAuthRole;
  next: string;
}

export interface GoogleProfile {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
}

export class OAuthError extends Error {
  constructor(public code: string, message?: string) {
    super(message || code);
  }
}


export function getAppUrl() {
  const url = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (!url) throw new Error("APP_URL must be set");
  return url.replace(/\/$/, "");
}

function getConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET must be set");
  return { clientId, clientSecret, redirectUri: `${getAppUrl()}/api/auth/google/callback` };
}


const b64url = (buf: Buffer) => buf.toString("base64url");

const stateKey = () => createHash("sha256").update(`oauth-state:${getSecret("JWT_SECRET")}`).digest();

export function safeRedirectPath(input: string | null | undefined) {
  if (!input || !input.startsWith("/") || input.startsWith("//") || input.includes("\\")) return "/";
  return input;
}

export function statesMatch(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}


export function createAuthorization({ role, next }: { role: OAuthRole; next: string }) {
  const { clientId, redirectUri } = getConfig();

  const state = b64url(randomBytes(32));
  const verifier = b64url(randomBytes(48));
  const nonce = b64url(randomBytes(16));
  const challenge = b64url(createHash("sha256").update(verifier).digest());

  const url = new URL(AUTH_ENDPOINT);
  url.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    nonce,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();

  const payload: OAuthState = { state, verifier, nonce, role, next };
  const stateToken = jwt.sign(payload, stateKey(), { algorithm: "HS256", expiresIn: "10m" });

  return { url: url.toString(), stateToken };
}

export function readOAuthState(token: string | undefined): OAuthState | null {
  if (!token) return null;
  try {
    return jwt.verify(token, stateKey(), { algorithms: ["HS256"] }) as OAuthState;
  } catch {
    return null;
  }
}


export async function exchangeCodeForProfile(code: string, saved: OAuthState): Promise<GoogleProfile> {
  const { clientId, clientSecret, redirectUri } = getConfig();

  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      code_verifier: saved.verifier,
    }),
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });

  if (!res.ok) throw new OAuthError("token_exchange_failed", `Google token endpoint returned ${res.status}`);

  const { id_token: idToken } = (await res.json()) as { id_token?: string };
  if (!idToken) throw new OAuthError("token_exchange_failed", "Missing id_token");

  const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
    issuer: GOOGLE_ISSUERS,
    audience: clientId,
  });

  if (payload.nonce !== saved.nonce) throw new OAuthError("invalid_state", "Nonce mismatch");
  if (!payload.sub || !payload.email) throw new OAuthError("invalid_profile");
  if (payload.email_verified !== true && payload.email_verified !== "true") {
    throw new OAuthError("email_not_verified");
  }

  return {
    sub: payload.sub,
    email: String(payload.email).toLowerCase().trim(),
    name: typeof payload.name === "string" ? payload.name : undefined,
    picture: typeof payload.picture === "string" ? payload.picture : undefined,
  };
}