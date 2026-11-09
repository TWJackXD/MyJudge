import { getTokenFromRequest } from '~/server/utils/auth';
import { supabase } from '~/server/utils/supabase';

export default defineEventHandler(async (event) => {
  try {
    const token = getTokenFromRequest(event);

    if (token) {
      // 從資料庫刪除 Token
      await supabase.from('tokens').delete().eq('token', token);
    }

    // 清除 Cookie
    setCookie(event, 'token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    });

    return {
      status: 'success',
      message: '登出成功'
    };

  } catch (error) {
    console.error('登出錯誤:', error);

    // 即使出錯也清除 Cookie
    setCookie(event, 'token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    });

    return {
      status: 'success',
      message: '登出成功'
    };
  }
});

