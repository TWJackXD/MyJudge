/**
 * API: 獲取提交記錄 (Get Submit Record)
 * 功能: 根據題目 UUID、競賽 folder 與當前登入用戶，查詢最新的提交記錄
 * 路徑: GET /api/record/getSubmitRecord
 * 參數: problem (題目 UUID), folder (競賽 UUID)
 * 返回: { status: 'success'|'no_data', data?: { status, code, error, language } }
 */

import { supabase } from '~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  try {
    const { problem, folder } = getQuery(event);

    if (!problem) {
      throw createError({
        statusCode: 400,
        statusMessage: '缺少必要參數 problem'
      });
    }

    if (!folder) {
      throw createError({
        statusCode: 400,
        statusMessage: '缺少必要參數 folder'
      });
    }

    if (!event.context.user) {
      return { status: 'no_data' };
    }

    const userId = event.context.user.id;

    const { data: record, error } = await supabase
      .from('record')
      .select('id, solver, status, code, error, language')
      .eq('solver', userId)
      .eq('problem', problem)
      .eq('folder', folder)
      .order('id', { ascending: false })
      .limit(1);

    if (error) throw error;

    if (!record || record.length === 0) {
      return { status: 'no_data' };
    }

    return {
      status: 'success',
      data: {
        status: record[0].status,
        code: record[0].code || '',
        error: record[0].error || null,
        language: record[0].language || null
      }
    };
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: '無法獲取資料'
    });
  }
});
