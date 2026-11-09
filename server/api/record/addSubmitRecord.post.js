/**
 * API: 新增提交記錄 (Add Submit Record)
 * 功能: 儲存用戶的程式碼提交記錄到資料庫（依競賽分開）
 * 路徑: POST /api/record/addSubmitRecord
 * 參數: { problem, folder, status, code, error, language }
 * 返回: { success: true, uuid }
 */

import { supabase } from '~/server/utils/supabase';
import { randomUUID } from 'crypto';

export default defineEventHandler(async (event) => {
  if (!event.context.user) {
    throw createError({
      statusCode: 401,
      statusMessage: '未授權，請先登入'
    });
  }

  const body = await readBody(event);
  const { problem, folder, status, code, error, language } = body;
  const userId = event.context.user.id;

  if (!problem || !folder || !status || code == null) {
    throw createError({
      statusCode: 400,
      statusMessage: '必須提供 problem、folder、status、code'
    });
  }

  const { data: linkRows, error: linkError } = await supabase
    .from('folder_problems')
    .select('id')
    .eq('folder', folder)
    .eq('problem_uuid', problem)
    .limit(1);

  if (linkError) throw linkError;

  if (!linkRows?.length) {
    throw createError({
      statusCode: 400,
      statusMessage: '此題目未加入該競賽'
    });
  }

  const uuid = randomUUID();

  const { error: insertError } = await supabase
    .from('record')
    .insert({
      uuid,
      problem,
      folder,
      solver: userId,
      status,
      code,
      error,
      language: language || null,
      created_at: new Date().toISOString()
    });

  if (insertError) {
    console.error('Database Error:', insertError);
    throw createError({
      statusCode: 500,
      statusMessage: '資料庫寫入失敗'
    });
  }

  return { success: true, uuid };
});
