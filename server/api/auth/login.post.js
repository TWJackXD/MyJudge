import { supabase } from '~/server/utils/supabase';
import { verifyPassword, generateToken } from '~/server/utils/auth';
import { setCookie } from 'h3';

export default defineEventHandler(async (event) => {
  try {
    const { username, password } = await readBody(event);

    if (!username || !password) {
      throw createError({
        statusCode: 400,
        statusMessage: '請提供使用者名稱和密碼'
      });
    }

    // 查詢用戶
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .limit(1);

    if (userError) {
      console.error('Database error:', userError);
      throw createError({ statusCode: 500, statusMessage: '資料庫錯誤' });
    }

    if (!users || users.length === 0) {
      throw createError({
        statusCode: 401,
        statusMessage: '使用者名稱或密碼錯誤'
      });
    }

    const user = users[0];

    // 驗證密碼
    const isValid = await verifyPassword(password, user.password);

    if (!isValid) {
      throw createError({
        statusCode: 401,
        statusMessage: '使用者名稱或密碼錯誤'
      });
    }

    // 準備用戶信息（不包含密碼）
    const userInfo = {
      id: user.id,
      username: user.username,
      role: user.role || 'user',
      createdAt: user.created_at
    };

    // 生成 Token
    const token = generateToken(userInfo);

    // 計算過期時間（7天）
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // 存入資料庫（持久化）
    const { error: tokenError } = await supabase
      .from('tokens')
      .insert({
        token: token,
        user_id: userInfo.id,
        expires_at: expiresAt
      });

    if (tokenError) {
      console.error('Token save error:', tokenError);
      // Continue anyway usually, or throw
    }

    // 判斷是否處於安全上下文（例如，通過 HTTPS 代理）
    const proto = event.node.req.headers['x-forwarded-proto'];
    const isSecure = proto === 'https' || proto === 'wss';

    // 設定 Cookie（7 天過期）
    // Token 另由前端存入 localStorage；Cookie 設為 httpOnly 降低 XSS 竊取風險
    setCookie(event, 'token', token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: 7 * 24 * 3600,
      path: '/'
    });

    return {
      status: 'success',
      message: '登入成功',
      user: userInfo,
      token
    };

  } catch (error) {
    console.error('登入錯誤:', error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: '登入過程發生錯誤'
    });
  }
});

