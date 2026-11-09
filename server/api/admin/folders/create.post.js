import { supabase } from '~/server/utils/supabase';
import { randomUUID } from 'crypto';
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

    const { name, start_time, end_time, visibility, visibility_users } = await readBody(event);

    if (!name || !start_time || !end_time) {
      throw createError({
        statusCode: 400,
        statusMessage: '請填寫所有必要欄位'
      });
    }

    const start = new Date(start_time);
    const end = new Date(end_time);

    if (start >= end) {
      throw createError({
        statusCode: 400,
        statusMessage: '結束時間必須晚於開始時間'
      });
    }

    let visibilityPayload;
    try {
      visibilityPayload = assertVisibilityPayload(visibility, visibility_users);
    } catch (error) {
      throw createError({
        statusCode: 400,
        statusMessage: error.message
      });
    }

    const uuid = randomUUID();
    const startTimeUTC = new Date(start_time).toISOString().slice(0, 19).replace('T', ' ');
    const endTimeUTC = new Date(end_time).toISOString().slice(0, 19).replace('T', ' ');

    const { data: newFolder, error: insertError } = await supabase
      .from('folders')
      .insert({
        uuid,
        name,
        start_time: startTimeUTC,
        end_time: endTimeUTC,
        visibility: visibilityPayload.visibility,
        visibility_users: visibilityPayload.visibility_users
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return {
      status: 'success',
      message: '競賽創建成功',
      data: {
        id: newFolder.id,
        uuid
      }
    };
  } catch (error) {
    console.error('創建競賽錯誤:', error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: '創建競賽過程發生錯誤'
    });
  }
});
