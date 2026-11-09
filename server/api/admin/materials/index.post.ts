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

    const body = await readBody(event);

    if (!body.uuid || !body.title || !body.file) {
      throw createError({
        statusCode: 400,
        statusMessage: '缺少必填欄位：uuid, title, file'
      });
    }

    let visibilityPayload;
    try {
      visibilityPayload = assertVisibilityPayload(body.visibility, body.visibility_users);
    } catch (error: any) {
      throw createError({
        statusCode: 400,
        statusMessage: error.message
      });
    }

    const { error } = await supabase
      .from('materials')
      .insert({
        uuid: body.uuid,
        title: body.title,
        file: body.file,
        path: normalizeMaterialPath(body.path),
        visibility: visibilityPayload.visibility,
        visibility_users: visibilityPayload.visibility_users,
        uploaded_by: user.id
      });

    if (error) throw error;

    return {
      success: true,
      message: '教材創建成功'
    };
  } catch (error) {
    console.error('Create material error:', error);
    throw error;
  }
});
