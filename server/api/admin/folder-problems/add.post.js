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
    const {
      folder,
      problem_uuid,
      question_no,
      allowed_languages = []
    } = body;

    if (!folder || !problem_uuid || !question_no) {
      throw createError({
        statusCode: 400,
        statusMessage: '請提供競賽、題目與題號'
      });
    }

    const { data: folderCheck } = await supabase
      .from('folders')
      .select('uuid')
      .eq('uuid', folder)
      .limit(1);

    if (!folderCheck?.length) {
      throw createError({ statusCode: 400, statusMessage: '指定的競賽不存在' });
    }

    const { data: problemCheck } = await supabase
      .from('problems')
      .select('uuid')
      .eq('uuid', problem_uuid)
      .limit(1);

    if (!problemCheck?.length) {
      throw createError({ statusCode: 400, statusMessage: '指定的題目不存在' });
    }

    const { data, error } = await supabase
      .from('folder_problems')
      .insert({
        folder,
        problem_uuid,
        question_no: Number(question_no),
        // 僅設定競賽語言，不沿用題庫語言
        allowed_languages: parseAllowedLanguages(allowed_languages)
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw createError({
          statusCode: 400,
          statusMessage: '此競賽已有相同題號，或題目已加入此競賽'
        });
      }
      throw error;
    }

    return {
      status: 'success',
      message: '已從題庫加入競賽',
      data
    };
  } catch (error) {
    console.error('從題庫加入競賽錯誤:', error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: error.message || '從題庫加入競賽失敗'
    });
  }
});
