import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getHeader } from 'h3';

const JWT_EXPIRES_IN = '7d';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw createError({
      statusCode: 500,
      statusMessage: '伺服器未設定 JWT_SECRET'
    });
  }
  return secret;
}

/**
 * 密碼雜湊
 */
export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

/**
 * 驗證密碼
 */
export async function verifyPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

/**
 * 生成 JWT Token
 */
export function generateToken(payload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });
}

/**
 * 驗證 JWT Token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch (error) {
    return null;
  }
}

/**
 * 從請求中獲取 Token
 */
export function getTokenFromRequest(event) {
  try {
    const cookies = parseCookies(event);
    if (cookies.token) {
      return cookies.token;
    }
  } catch (e) {
    // Cookie 解析失敗，繼續嘗試其他方式
  }

  const authHeader = getHeader(event, 'authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

function parseCookies(event) {
  const cookieHeader = getHeader(event, 'cookie');
  if (!cookieHeader) return {};

  try {
    return cookieHeader.split(';').reduce((cookies, cookie) => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookies[name] = decodeURIComponent(value);
      }
      return cookies;
    }, {});
  } catch (e) {
    return {};
  }
}
