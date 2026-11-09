import { supabase } from '~/server/utils/supabase';

export default defineEventHandler(async (event) => {
  try {
    // 從 context 獲取用戶信息（由 auth middleware 設置）
    const user = event.context.user;

    // 驗證用戶是否已登入
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: '請先登入'
      });
    }

    // 驗證用戶是否為管理員
    if (user.role !== 'admin') {
      throw createError({
        statusCode: 403,
        statusMessage: '權限不足，需要管理員權限'
      });
    }

    const materialUuid = event.context.params?.uuid;

    if (!materialUuid) {
      throw createError({
        statusCode: 400,
        statusMessage: '缺少教材 UUID'
      });
    }

    // 刪除教材
    const { error } = await supabase
      .from('materials')
      .delete()
      .eq('uuid', materialUuid);

    if (error) throw error;

    return {
      success: true,
      message: '教材刪除成功'
    };
  } catch (error) {
    console.error('Delete material error:', error);
    throw error;
  }
});

