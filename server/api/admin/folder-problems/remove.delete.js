import { supabase } from '~/server/utils/supabase';

export default defineEventHandler(async (event) => {
  try {
    if (!event.context.user) {
      throw createError({ statusCode: 401, statusMessage: '未授權' });
    }
    if (event.context.user.role !== 'admin') {
      throw createError({ statusCode: 403, statusMessage: '需要管理員權限' });
    }

    const body = await readBody(event);
    const { folder, problem_uuid } = body;

    if (!folder || !problem_uuid) {
      throw createError({
        statusCode: 400,
        statusMessage: '請提供競賽與題目'
      });
    }

    const { error } = await supabase
      .from('folder_problems')
      .delete()
      .eq('folder', folder)
      .eq('problem_uuid', problem_uuid);

    if (error) throw error;

    return {
      status: 'success',
      message: '已從競賽移除題目（題庫仍保留）'
    };
  } catch (error) {
    console.error('從競賽移除題目錯誤:', error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: error.message || '從競賽移除題目失敗'
    });
  }
});
