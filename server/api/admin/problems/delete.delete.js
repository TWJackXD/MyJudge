import { supabase } from '~/server/utils/supabase';

export default defineEventHandler(async (event) => {
  try {
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

    const { uuid, id } = await readBody(event);

    if (!uuid && !id) {
      throw createError({
        statusCode: 400,
        statusMessage: '請提供題目 ID 或 UUID'
      });
    }

    let query = supabase.from('problems').select('id, uuid');
    if (uuid) {
      query = query.eq('uuid', uuid);
    } else {
      query = query.eq('id', id);
    }
    const { data: existing } = await query;

    if (!existing || existing.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: '題目不存在'
      });
    }

    // 刪除題目（folder_problems 會 CASCADE）
    let deleteQuery = supabase.from('problems').delete();
    if (uuid) {
      deleteQuery = deleteQuery.eq('uuid', uuid);
    } else {
      deleteQuery = deleteQuery.eq('id', id);
    }

    const { error: deleteError } = await deleteQuery;
    if (deleteError) throw deleteError;

    return {
      status: 'success',
      message: '題目已從題庫刪除'
    };
  } catch (error) {
    console.error('刪除題目錯誤:', error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: '刪除題目過程發生錯誤'
    });
  }
});
