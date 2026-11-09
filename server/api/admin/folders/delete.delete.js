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

    const { uuid } = await readBody(event);

    if (!uuid) {
      throw createError({
        statusCode: 400,
        statusMessage: '請提供競賽 UUID'
      });
    }

    // 檢查競賽是否存在
    const { data: existing, error: checkError } = await supabase
      .from('folders')
      .select('uuid')
      .eq('uuid', uuid);

    if (!existing || existing.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: '競賽不存在'
      });
    }

    // 檢查是否有題目關聯到此競賽
    const { count } = await supabase
      .from('folder_problems')
      .select('*', { count: 'exact', head: true })
      .eq('folder', uuid);

    if (count > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: '此競賽下還有題目，請先從競賽移除題目後再刪除'
      });
    }

    // 刪除競賽
    const { error: deleteError } = await supabase
      .from('folders')
      .delete()
      .eq('uuid', uuid);

    if (deleteError) throw deleteError;

    return {
      status: 'success',
      message: '競賽刪除成功'
    };

  } catch (error) {
    console.error('刪除競賽錯誤:', error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: '刪除競賽過程發生錯誤'
    });
  }
});

