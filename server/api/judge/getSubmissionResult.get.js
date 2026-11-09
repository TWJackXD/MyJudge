/**
 * API: 查詢判題結果
 * 路徑: GET /api/judge/getSubmissionResult?recordUuid=...
 */

import { supabase } from '~/server/utils/supabase';
import axios from 'axios';

const JUDGE0_API_URL = process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com';
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY || '';

const JUDGE0_STATUS_MAP = {
  'Accepted': 'AC',
  'Wrong Answer': 'WA',
  'Time Limit Exceeded': 'TLE',
  'Memory Limit Exceeded': 'MLE',
  'Output Limit Exceeded': 'OLE',
  'Runtime Error': 'RE',
  'Compilation Error': 'CE',
  'Internal Error': 'IE',
  'Processing': 'PROCESSING',
  'In Queue': 'PENDING'
};

async function updateRecordStatus(recordUuid, status, error = null) {
  const { error: updateError } = await supabase
    .from('record')
    .update({ status, error })
    .eq('uuid', recordUuid);

  if (updateError) console.error('Error updating status:', updateError);
}

export default defineEventHandler(async (event) => {
  if (!event.context.user) {
    throw createError({ statusCode: 401, statusMessage: '未授權，請先登入' });
  }

  const { recordUuid } = getQuery(event);

  if (!recordUuid) {
    throw createError({ statusCode: 400, statusMessage: '缺少 recordUuid' });
  }

  try {
    const { data: records, error: dbError } = await supabase
      .from('record')
      .select('status, judge0_tokens, error, solver')
      .eq('uuid', recordUuid)
      .limit(1);

    if (dbError) throw dbError;

    if (!records || !records.length) {
      throw createError({ statusCode: 404, statusMessage: '找不到提交紀錄' });
    }

    const record = records[0];
    const isAdmin = event.context.user.role === 'admin';
    if (!isAdmin && record.solver !== event.context.user.id) {
      throw createError({ statusCode: 403, statusMessage: '你沒有權限查看此提交' });
    }

    const { status, judge0_tokens } = record;

    if (status !== 'PENDING' && status !== 'PROCESSING') {
      return { status, error: record.error || null };
    }

    const tokens = JSON.parse(judge0_tokens);
    if (!tokens || tokens.length === 0) {
      await updateRecordStatus(recordUuid, 'IE', '找不到 Judge0 tokens');
      return { status: 'IE' };
    }

    if (!JUDGE0_API_KEY) {
      throw createError({ statusCode: 500, statusMessage: 'Judge0 API Key 未配置' });
    }

    const pollResponse = await axios.get(
      `${JUDGE0_API_URL}/submissions/batch?tokens=${tokens.join(',')}&base64_encoded=true&fields=status,stdout,stderr,compile_output,time,memory`,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': JUDGE0_API_KEY,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        }
      }
    );

    const results = pollResponse.data?.submissions;
    if (!Array.isArray(results) || results.length === 0) {
      return { status: 'PROCESSING' };
    }

    const decodeBase64 = (str) => {
      if (!str) return null;
      try {
        return Buffer.from(str, 'base64').toString('utf-8');
      } catch (e) {
        return 'Error decoding output.';
      }
    };

    let finalStatus = 'AC';
    let errorOutput = null;
    let stillProcessing = false;

    for (const res of results) {
      if (!res?.status || res.status.id <= 2) {
        stillProcessing = true;
        break;
      }
      if (res.status.description === 'Compilation Error') {
        finalStatus = 'CE';
        errorOutput = decodeBase64(res.compile_output);
        break;
      }
    }

    if (stillProcessing) {
      await updateRecordStatus(recordUuid, 'PROCESSING');
      return { status: 'PROCESSING' };
    }

    if (finalStatus !== 'CE') {
      const statusHierarchy = ['RE', 'MLE', 'OLE', 'TLE', 'WA', 'AC'];
      let worstStatus = 'AC';
      let worstResult = null;

      for (const res of results) {
        const mapped = JUDGE0_STATUS_MAP[res.status.description] || 'RE';
        const currentStatus = statusHierarchy.includes(mapped) ? mapped : 'RE';
        if (statusHierarchy.indexOf(currentStatus) < statusHierarchy.indexOf(worstStatus)) {
          worstStatus = currentStatus;
          worstResult = res;
        }
      }
      finalStatus = worstStatus;

      if (worstResult && finalStatus !== 'WA') {
        // WA 不回傳任何輸出內容，避免依 stdout 暴力試測資
        errorOutput = decodeBase64(worstResult.stderr) || decodeBase64(worstResult.compile_output) || null;
      }
    }

    await updateRecordStatus(recordUuid, finalStatus, errorOutput);
    return { status: finalStatus, error: errorOutput };
  } catch (e) {
    if (e.statusCode) throw e;
    console.error('[getSubmissionResult] Error:', e.response ? e.response.data : e.message);
    const { data: records } = await supabase
      .from('record')
      .select('status')
      .eq('uuid', recordUuid)
      .limit(1);
    return { status: records?.[0]?.status || 'PENDING' };
  }
});
