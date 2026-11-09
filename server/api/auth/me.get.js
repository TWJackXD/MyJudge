/**
 * API: 獲取當前用戶信息 (Get Current User Info)
 * 功能: 根據 token 取得當前登入用戶的資訊
 * 路徑: GET /api/auth/me
 * 返回: { status: 'success', user?: { id, username, role } }
 */

import { getTokenFromRequest } from '~/server/utils/auth.js';
import { supabase } from '~/server/utils/supabase';

export default defineEventHandler(async (event) => {
  try {
    // 1. 取得 token
    const token = getTokenFromRequest(event);

    if (!token) {
      return {
        status: 'error',
        message: '未提供 token'
      };
    }

    // 3. 從資料庫查詢
    const { data: tokens, error: tokenError } = await supabase
      .from('tokens')
      .select('*')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .limit(1);

    if (tokenError || !tokens || tokens.length === 0) {
      return {
        status: 'error',
        message: 'Token 無效或已過期'
      };
    }

    // 4. 根據 token 取得用戶資訊
    const tokenRecord = tokens[0];
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, username, role')
      .eq('id', tokenRecord.user_id)
      .limit(1);

    if (userError || !users || users.length === 0) {
      return {
        status: 'error',
        message: '用戶不存在'
      };
    }

    // 5. 返回用戶資訊
    const user = users[0];
    return {
      status: 'success',
      user
    };

  } catch (error) {
    return {
      status: 'error',
      message: '獲取用戶資訊失敗'
    };
  }
});
