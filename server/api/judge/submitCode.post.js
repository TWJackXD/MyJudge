/**
 * API: 提交程式碼進行判題 (Submit Code for Judging)
 * 功能: 呼叫 Judge0 官方 API 進行判題
 * 路徑: POST /api/judge/submitCode
 * 參數: { sourceCode (程式碼), uuid (題目 UUID), language (語言) }
 * 返回: { recordUuid: string }
 */

import { supabase } from '~/server/utils/supabase';
import { randomUUID } from 'crypto';
import axios from 'axios';
import { JUDGE0_LANGUAGE_IDS, parseAllowedLanguages } from '~/utils/languages';
import { splitTestCases } from '~/utils/testCases';
import { canAccessProblem } from '~/utils/problemVisibility';

// Judge0 官方 API 端點
const JUDGE0_API_URL = process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com';
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY || ''; // RapidAPI Key

export default defineEventHandler(async (event) => {
  if (!event.context.user) {
    throw createError({
      statusCode: 401,
      statusMessage: '未授權,請先登入'
    });
  }

  const body = await readBody(event);
  const userId = event.context.user.id;
  const { sourceCode, uuid: problemUuid, language = 'Java', folder: folderUuid } = body;

  if (!problemUuid) {
    throw createError({
      statusCode: 400,
      statusMessage: '缺少題目 UUID 參數'
    });
  }

  if (!folderUuid) {
    throw createError({
      statusCode: 400,
      statusMessage: '缺少競賽 folder 參數'
    });
  }


  try {
    const { data: problems, error: dbError } = await supabase
      .from('problems')
      .select('input, output, visibility, visibility_users')
      .eq('uuid', problemUuid)
      .limit(1);

    if (dbError) {
      console.error('[submitCode] Database query failed:', dbError);
      throw createError({
        statusCode: 500,
        statusMessage: '資料庫錯誤'
      });
    }

    if (!problems || problems.length === 0) {
      console.error(`[submitCode] Problem not found in database. UUID: ${problemUuid}`);
      throw createError({
        statusCode: 404,
        statusMessage: `題目不存在 (UUID: ${problemUuid})`
      });
    }
    const problem = problems[0];

    const { data: folderRows } = await supabase
      .from('folders')
      .select('*')
      .eq('uuid', folderUuid)
      .limit(1);

    const folder = folderRows?.[0];
    if (!folder) {
      throw createError({
        statusCode: 404,
        statusMessage: '競賽不存在'
      });
    }

    const { data: linkRows, error: linkError } = await supabase
      .from('folder_problems')
      .select('allowed_languages')
      .eq('folder', folderUuid)
      .eq('problem_uuid', problemUuid)
      .limit(1);

    if (linkError) throw linkError;

    if (!linkRows?.length) {
      throw createError({
        statusCode: 404,
        statusMessage: '此題目未加入該競賽'
      });
    }

    if (!canAccessProblem(problem, folder, event.context.user)) {
      throw createError({
        statusCode: 403,
        statusMessage: '你沒有權限提交此題目'
      });
    }

    // 一行一組測資。同一組裡的換行用字面 \n 表示。
    // 沒有換行的舊資料仍依逗號切開。
    const inputs = splitTestCases(problem.input);
    const outputs = splitTestCases(problem.output);
    const languageId = JUDGE0_LANGUAGE_IDS[language];

    if (!languageId) {
      throw createError({ statusCode: 400, statusMessage: `不支援的語言: ${language}` });
    }

    const allowedLanguages = parseAllowedLanguages(linkRows[0].allowed_languages);
    if (!allowedLanguages.includes(language)) {
      throw createError({ statusCode: 400, statusMessage: `此題目不允許使用 ${language}` });
    }

    // 如果題目沒有輸出測資，無法進行判題
    if (outputs.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: '此題目尚未設定輸出測資，無法進行判題。請聯繫管理員添加測資。'
      });
    }

    // 如果有輸入測資，則輸入和輸出的數量必須匹配
    // 如果沒有輸入測資，則可以只有輸出（例如 Hello World 題目）
    if (inputs.length > 0 && inputs.length !== outputs.length) {
      throw createError({
        statusCode: 400,
        statusMessage: `輸入和輸出的數量不匹配 (輸入: ${inputs.length}, 輸出: ${outputs.length})`
      });
    }

    // 準備 submissions
    // 如果沒有輸入測資，則為每個輸出創建一個 submission，stdin 為空字符串
    const submissions = inputs.length > 0
      ? inputs.map((input, index) => ({
        source_code: sourceCode,
        language_id: languageId,
        stdin: input,
        expected_output: outputs[index],
        cpu_time_limit: 5,
        memory_limit: 256000,
      }))
      : outputs.map((output) => ({
        source_code: sourceCode,
        language_id: languageId,
        stdin: '', // 沒有輸入時，stdin 為空字符串
        expected_output: output,
        cpu_time_limit: 5,
        memory_limit: 256000,
      }));


    // 檢查 API Key
    if (!JUDGE0_API_KEY) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Judge0 API Key 未配置，請檢查環境變數 JUDGE0_API_KEY'
      });
    }

    // 3. 呼叫 Judge0 官方 Batch API (使用 RapidAPI)
    const apiUrl = `${JUDGE0_API_URL}/submissions/batch?base64_encoded=false`;

    let response;
    try {
      response = await axios.post(
        apiUrl,
        { submissions },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-RapidAPI-Key': JUDGE0_API_KEY,
            'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
          },
          timeout: 30000 // 30 秒超時
        }
      );
    } catch (apiError) {
      console.error('[submitCode] Judge0 API call failed');
      console.error('[submitCode] URL:', apiUrl);
      console.error('[submitCode] Error:', apiError.message);
      if (apiError.response) {
        console.error('[submitCode] Response status:', apiError.response.status);
        console.error('[submitCode] Response data:', JSON.stringify(apiError.response.data, null, 2));
      }
      throw apiError;
    }

    // 檢查 Judge0 API 響應格式
    if (!response.data || !Array.isArray(response.data)) {
      console.error('[submitCode] Invalid Judge0 API response:', response.data);
      throw createError({
        statusCode: 500,
        statusMessage: 'Judge0 API 返回的資料格式不正確'
      });
    }

    const submissionTokens = response.data.map(s => s.token).filter(token => token);

    if (submissionTokens.length === 0) {
      console.error('[submitCode] No tokens received from Judge0 API');
      throw createError({
        statusCode: 500,
        statusMessage: 'Judge0 API 未返回有效的提交令牌'
      });
    }

    const recordUuid = randomUUID();


    // 4. 在資料庫中創建一個新的 'record',狀態為 'PENDING'
    const { error: insertError } = await supabase
      .from('record')
      .insert({
        uuid: recordUuid,
        problem: problemUuid,
        folder: folderUuid,
        solver: userId,
        status: 'PENDING',
        language,
        code: sourceCode,
        judge0_tokens: JSON.stringify(submissionTokens),
        // created_at is default now()
      });

    if (insertError) {
      console.error('[submitCode] Database insert failed:', insertError);
      throw createError({
        statusCode: 500,
        statusMessage: '資料庫寫入錯誤'
      });
    }


    // 5. 返回 recordUuid 給前端
    return {
      recordUuid: recordUuid
    };

  } catch (e) {
    console.error('--- [submitCode] SUBMISSION FAILED ---');
    console.error('[submitCode] Error Type:', e.constructor.name);
    console.error('[submitCode] Error Message:', e.message);

    if (e.statusCode) {
      throw e;
    }

    throw createError({
      statusCode: e.statusCode || e.response?.status || 500,
      statusMessage: e.message || '提交失敗'
    });
  }
});