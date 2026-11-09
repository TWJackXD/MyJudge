import { supabase } from '~/server/utils/supabase';

export default defineEventHandler(async (event) => {
  try {
    // 檢查認證和管理員權限
    if (!event.context.user) {
      throw createError({
        statusCode: 401,
        statusMessage: '未授權'
      });
    }

    if (event.context.user.role !== 'admin') {
      throw createError({
        statusCode: 403,
        statusMessage: '需要管理員權限'
      });
    }

    // 查詢所有用戶（不包含密碼）
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, role, created_at')
      .order('id', { ascending: false });

    if (error) {
      throw error;
    }

    return {
      status: 'success',
      data: users
    };

  } catch (error) {
    console.error('獲取用戶列表錯誤:', error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: '獲取用戶列表過程發生錯誤'
    });
  }
});