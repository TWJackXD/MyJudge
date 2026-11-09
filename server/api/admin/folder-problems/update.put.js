import { supabase } from '~/server/utils/supabase';
import { parseAllowedLanguages } from '~/utils/languages';

export default defineEventHandler(async (event) => {
  try {
    if (!event.context.user) {
      throw createError({ statusCode: 401, statusMessage: '未授權' });
    }
    if (event.context.user.role !== 'admin') {
      throw createError({ statusCode: 403, statusMessage: '需要管理員權限' });
    }

    const body = await readBody(event);
    const { folder, problem_uuid, question_no, allowed_languages } = body;

    if (!folder || !problem_uuid) {
      throw createError({
        statusCode: 400,
        statusMessage: '請提供競賽與題目'
      });
    }

    const updates = {};
    if (question_no != null) updates.question_no = Number(question_no);
    if (allowed_languages !== undefined) {
      updates.allowed_languages = parseAllowedLanguages(allowed_languages);
    }

    if (Object.keys(updates).length === 0) {
      throw createError({ statusCode: 400, statusMessage: '沒有可更新的欄位' });
    }

    const { error } = await supabase
      .from('folder_problems')
      .update(updates)
      .eq('folder', folder)
      .eq('problem_uuid', problem_uuid);

    if (error) {
      if (error.code === '23505') {
        throw createError({ statusCode: 400, statusMessage: '此競賽已有相同題號' });
      }
      throw error;
    }

    return { status: 'success', message: '競賽題目設定已更新' };
  } catch (error) {
    console.error('更新競賽題目設定錯誤:', error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: error.message || '更新競賽題目設定失敗'
    });
  }
});
