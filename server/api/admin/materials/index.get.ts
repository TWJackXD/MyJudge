import { supabase } from '~/server/utils/supabase';
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

    const { data: materialsData, error } = await supabase
      .from('materials')
      .select('*, users(username)')
      .order('path', { ascending: true })
      .order('title', { ascending: true });

    if (error) throw error;

    const materials = (materialsData || []).map((m) => ({
      ...m,
      path: normalizeMaterialPath(m.path),
      visibility: m.visibility || 'public',
      visibility_users: m.visibility_users || [],
      uploader_name: m.users ? m.users.username : null,
      users: undefined
    }));

    return {
      success: true,
      materials
    };
  } catch (error) {
    console.error('Get materials error:', error);
    throw error;
  }
});
