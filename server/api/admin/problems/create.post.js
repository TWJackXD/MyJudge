import { supabase } from '~/server/utils/supabase';
import { randomUUID } from 'crypto';
import { normalizeTestCaseField } from '~/utils/testCases';
import { normalizeVisibilityUsers } from '~/utils/problemVisibility';
import { parseAllowedLanguages } from '~/utils/languages';

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

    const body = await readBody(event);
    const {
      title,
      summary,
      description,
      tags,
      input,
      output,
      folder = null,
      bank_folder = null,
      question_no = null,
      allowed_languages = [],
      content_type = 'html',
      pdf_url = null,
      visibility = 'public',
      visibility_users = []
    } = body;

    const resolvedContentType = content_type === 'pdf' ? 'pdf' : 'html';
    const resolvedVisibility = ['public', 'public_except', 'private_except', 'private'].includes(visibility)
      ? visibility
      : 'public';
    const resolvedUsers = normalizeVisibilityUsers(visibility_users);

    if (!title || !summary) {
      throw createError({
        statusCode: 400,
        statusMessage: '請填寫標題與摘要'
      });
    }

    if (resolvedContentType === 'html' && !description) {
      throw createError({
        statusCode: 400,
        statusMessage: '請填寫題目描述，或改用 PDF 內容'
      });
    }

    if (resolvedContentType === 'pdf' && !pdf_url) {
      throw createError({
        statusCode: 400,
        statusMessage: '請上傳題目 PDF'
      });
    }

    if ((resolvedVisibility === 'public_except' || resolvedVisibility === 'private_except') && resolvedUsers.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: '此可見性模式需要至少指定一位使用者'
      });
    }

    let resolvedBankFolder = bank_folder || null;
    if (resolvedBankFolder) {
      const { data: bankFolderCheck } = await supabase
        .from('bank_folders')
        .select('uuid')
        .eq('uuid', resolvedBankFolder)
        .limit(1);

      if (!bankFolderCheck?.length) {
        throw createError({
          statusCode: 400,
          statusMessage: '指定的題庫資料夾不存在'
        });
      }
    }

    if (folder) {
      if (!question_no) {
        throw createError({
          statusCode: 400,
          statusMessage: '加入競賽時請填寫題號'
        });
      }

      const { data: folderCheck } = await supabase
        .from('folders')
        .select('uuid')
        .eq('uuid', folder);

      if (!folderCheck || folderCheck.length === 0) {
        throw createError({
          statusCode: 400,
          statusMessage: '指定的競賽不存在'
        });
      }
    }

    const uuid = randomUUID();

    const { data: newProblem, error: insertError } = await supabase
      .from('problems')
      .insert({
        uuid,
        question_no: null,
        title,
        summary,
        description: resolvedContentType === 'pdf' ? (description || '') : description,
        tags: tags || '',
        input: normalizeTestCaseField(input),
        output: normalizeTestCaseField(output),
        folder: null,
        bank_folder: resolvedBankFolder,
        allowed_languages: [],
        content_type: resolvedContentType,
        pdf_url: resolvedContentType === 'pdf' ? pdf_url : null,
        visibility: resolvedVisibility,
        visibility_users: resolvedUsers
      })
      .select()
      .single();

    if (insertError) throw insertError;

    if (folder) {
      const { error: linkError } = await supabase
        .from('folder_problems')
        .insert({
          folder,
          problem_uuid: uuid,
          question_no: Number(question_no),
          allowed_languages: parseAllowedLanguages(allowed_languages)
        });

      if (linkError) {
        await supabase.from('problems').delete().eq('uuid', uuid);
        if (linkError.code === '23505') {
          throw createError({
            statusCode: 400,
            statusMessage: '此競賽已有相同題號，或題目已加入此競賽'
          });
        }
        throw linkError;
      }
    }

    return {
      status: 'success',
      message: folder ? '題目已建立並加入題庫與競賽' : '題目已加入題庫',
      data: {
        id: newProblem.id,
        uuid
      }
    };
  } catch (error) {
    console.error('創建題目錯誤:', error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || '創建題目過程發生錯誤'
    });
  }
});
