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

    const { userId } = await readBody(event);

    if (!userId) {
      throw createError({
        statusCode: 400,
        statusMessage: '請提供用戶 ID'
      });
    }

    // 不能刪除自己
    if (parseInt(userId) === event.context.user.id) {
      throw createError({
        statusCode: 400,
        statusMessage: '不能刪除自己的帳號'
      });
    }

    // 檢查用戶是否存在
    const { data: existing, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId);

    if (!existing || existing.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: '用戶不存在'
      });
    }

    // 刪除用戶（CASCADE 會自動刪除相關的 tokens 和 records）
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (deleteError) {
      throw deleteError;
    }

    return {
      status: 'success',
      message: '用戶刪除成功'
    };

  } catch (error) {
    console.error('刪除用戶錯誤:', error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: '刪除用戶過程發生錯誤'
    });
  }
});

