/**
 * 清理過期的 token
 * 路徑: GET/POST /api/cron/cleanExpiredTokens
 * 需提供 Header: Authorization: Bearer <CRON_SECRET>
 * 或 Query: ?secret=<CRON_SECRET>
 */
import { supabase } from '~/server/utils/supabase';

export default defineEventHandler(async (event) => {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    throw createError({
      statusCode: 503,
      statusMessage: '未設定 CRON_SECRET，拒絕執行排程'
    });
  }

  const authHeader = getHeader(event, 'authorization') || '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const querySecret = getQuery(event).secret;
  const provided = bearer || querySecret || getHeader(event, 'x-cron-secret');

  if (provided !== cronSecret) {
    throw createError({
      statusCode: 401,
      statusMessage: '未授權'
    });
  }

  try {
    const { error, count } = await supabase
      .from('tokens')
      .delete({ count: 'exact' })
      .lt('expires_at', new Date().toISOString());

    if (error) throw error;

    return {
      status: 'success',
      message: `已清理 ${count || 0} 個過期 token`,
      count: count || 0
    };
  } catch (error) {
    console.error('清理過期 token 失敗:', error);
    throw createError({
      statusCode: 500,
      statusMessage: '清理過期 token 失敗'
    });
  }
});
