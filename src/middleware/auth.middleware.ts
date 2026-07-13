import { Request, Response, NextFunction } from 'express';
import jwt, { type SignOptions } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production';

// ─── JWT Token helpers ────────────────────────────────────────────────────────

export interface KitchenTokenPayload {
  role: 'kitchen';
  iat: number;
  exp: number;
}

export interface AdminTokenPayload {
  role: 'admin';
  adminId: string;
  iat: number;
  exp: number;
}

export function signKitchenToken(): string {
  const opts: SignOptions = { expiresIn: (process.env.JWT_EXPIRES_IN ?? '8h') as SignOptions['expiresIn'] };
  return jwt.sign({ role: 'kitchen' }, JWT_SECRET, opts);
}

export function signAdminToken(adminId: string): string {
  const opts: SignOptions = { expiresIn: (process.env.JWT_EXPIRES_IN ?? '8h') as SignOptions['expiresIn'] };
  return jwt.sign({ role: 'admin', adminId }, JWT_SECRET, opts);
}

// ─── Kitchen Auth Middleware ──────────────────────────────────────────────────
// Staf dapur login pakai PIN, mendapat JWT short-lived

export function requireKitchenAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized: missing token' });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as KitchenTokenPayload;
    if (payload.role !== 'kitchen') {
      res.status(403).json({ message: 'Forbidden: kitchen access required' });
      return;
    }
    next();
  } catch {
    res.status(401).json({ message: 'Unauthorized: invalid or expired token' });
  }
}

// ─── Admin Auth Middleware ────────────────────────────────────────────────────
// Admin login pakai email + password, mendapat JWT

export function requireAdminAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized: missing token' });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AdminTokenPayload;
    if (payload.role !== 'admin') {
      res.status(403).json({ message: 'Forbidden: admin access required' });
      return;
    }
    // Attach admin info to request for use in controllers
    (req as Request & { adminId: string }).adminId = payload.adminId;
    next();
  } catch {
    res.status(401).json({ message: 'Unauthorized: invalid or expired token' });
  }
}
