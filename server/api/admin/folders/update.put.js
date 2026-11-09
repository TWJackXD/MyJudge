import { supabase } from '~/server/utils/supabase';
import { assertVisibilityPayload } from '~/utils/problemVisibility';

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

    const { uuid, name, start_time, end_time, visibility, visibility_users } = await readBody(event);

    if (!uuid) {
      throw createError({
        statusCode: 400,
        statusMessage: '請提供競賽 UUID'
      });
    }

    const { data: existing } = await supabase
      .from('folders')
      .select('uuid')
      .eq('uuid', uuid);

    if (!existing || existing.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: '競賽不存在'
      });
    }

    if (start_time && end_time) {
      const start = new Date(start_time);
      const end = new Date(end_time);

      if (start >= end) {
        throw createError({
          statusCode: 400,
          statusMessage: '結束時間必須晚於開始時間'
        });
      }
    }

    const updates = {};

    if (name !== undefined) {
      updates.name = name;
    }
    if (start_time !== undefined) {
      updates.start_time = new Date(start_time).toISOString().slice(0, 19).replace('T', ' ');
    }
    if (end_time !== undefined) {
      updates.end_time = new Date(end_time).toISOString().slice(0, 19).replace('T', ' ');
    }
    if (visibility !== undefined || visibility_users !== undefined) {
      try {
        const visibilityPayload = assertVisibilityPayload(visibility, visibility_users);
        updates.visibility = visibilityPayload.visibility;
        updates.visibility_users = visibilityPayload.visibility_users;
      } catch (error) {
        throw createError({
          statusCode: 400,
          statusMessage: error.message
        });
      }
    }

    if (Object.keys(updates).length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: '沒有要更新的欄位'
      });
    }

    const { error: updateError } = await supabase
      .from('folders')
      .update(updates)
      .eq('uuid', uuid);

    if (updateError) throw updateError;

    return {
      status: 'success',
      message: '競賽更新成功'
    };
  } catch (error) {
    console.error('更新競賽錯誤:', error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: '更新競賽過程發生錯誤'
    });
  }
});
