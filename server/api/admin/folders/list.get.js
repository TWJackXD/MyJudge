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

    // 查詢所有競賽
    const { data: folders, error } = await supabase
      .from('folders')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;

    return {
      status: 'success',
      data: folders
    };

  } catch (error) {
    console.error('獲取競賽列表錯誤:', error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: '獲取競賽列表過程發生錯誤'
    });
  }
});

