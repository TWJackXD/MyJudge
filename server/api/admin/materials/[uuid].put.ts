import { supabase } from '~/server/utils/supabase';
import { assertVisibilityPayload } from '~/utils/problemVisibility';
import { normalizeMaterialPath } from '~/utils/materialTree';

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user;

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: '請先登入'
      });
    }

    if (user.role !== 'admin') {
      throw createError({
        statusCode: 403,
        statusMessage: '權限不足，需要管理員權限'
      });
    }

    const materialUuid = event.context.params?.uuid;
    const body = await readBody(event);

    if (!materialUuid) {
      throw createError({
        statusCode: 400,
        statusMessage: '缺少教材 UUID'
      });
    }

    const updates: Record<string, unknown> = {};

    if (body.title !== undefined) updates.title = body.title;
    if (body.file !== undefined) updates.file = body.file;
    if (body.path !== undefined) updates.path = normalizeMaterialPath(body.path);

    if (body.visibility !== undefined || body.visibility_users !== undefined) {
      try {
        const visibilityPayload = assertVisibilityPayload(body.visibility, body.visibility_users);
        updates.visibility = visibilityPayload.visibility;
        updates.visibility_users = visibilityPayload.visibility_users;
      } catch (error: any) {
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

    const { error } = await supabase
      .from('materials')
      .update(updates)
      .eq('uuid', materialUuid);

    if (error) throw error;

    return {
      success: true,
      message: '教材更新成功'
    };
  } catch (error) {
    console.error('Update material error:', error);
    throw error;
  }
});
