import { supabase } from '~/server/utils/supabase';
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
      id,
      uuid,
      title,
      summary,
      description,
      tags,
      input,
      output,
      content_type,
      pdf_url,
      visibility,
      visibility_users,
      bank_folder = undefined,
      // 競賽關聯覆寫（可選）
      folder = null,
      question_no = null,
      allowed_languages = undefined
    } = body;

    if (!uuid && !id) {
      throw createError({
        statusCode: 400,
        statusMessage: '請提供題目 ID 或 UUID'
      });
    }

    let query = supabase.from('problems').select('id, uuid, content_type, pdf_url');
    if (uuid) {
      query = query.eq('uuid', uuid);
    } else {
      query = query.eq('id', id);
    }
    const { data: existing } = await query;

    if (!existing || existing.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: '題目不存在'
      });
    }

    const problemUuid = existing[0].uuid;
    const resolvedContentType = content_type === 'pdf'
      ? 'pdf'
      : (content_type === 'html' ? 'html' : existing[0].content_type || 'html');
    const resolvedPdfUrl = resolvedContentType === 'pdf'
      ? (pdf_url || existing[0].pdf_url)
      : null;
    const resolvedVisibility = ['public', 'public_except', 'private_except', 'private'].includes(visibility)
      ? visibility
      : 'public';
    const resolvedUsers = normalizeVisibilityUsers(visibility_users);

    if (resolvedContentType === 'html' && !description) {
      throw createError({
        statusCode: 400,
        statusMessage: '請填寫題目描述，或改用 PDF 內容'
      });
    }

    if (resolvedContentType === 'pdf' && !resolvedPdfUrl) {
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

    if (bank_folder) {
      const { data: bankFolderCheck } = await supabase
        .from('bank_folders')
        .select('uuid')
        .eq('uuid', bank_folder)
        .limit(1);

      if (!bankFolderCheck?.length) {
        throw createError({
          statusCode: 400,
          statusMessage: '指定的題庫資料夾不存在'
        });
      }
    }

    const updates = {
      title,
      summary,
      description: resolvedContentType === 'pdf' ? (description || '') : description,
      tags: tags || '',
      input: normalizeTestCaseField(input),
      output: normalizeTestCaseField(output),
      content_type: resolvedContentType,
      pdf_url: resolvedPdfUrl,
      visibility: resolvedVisibility,
      visibility_users: resolvedUsers,
      folder: null,
      allowed_languages: [],
      bank_folder
    };

    Object.keys(updates).forEach((key) => updates[key] === undefined && delete updates[key]);

    let updateQuery = supabase.from('problems').update(updates);
    if (uuid) {
      updateQuery = updateQuery.eq('uuid', uuid);
    } else {
      updateQuery = updateQuery.eq('id', id);
    }

    const { error: updateError } = await updateQuery;
    if (updateError) throw updateError;

    if (folder && question_no != null) {
      const linkUpdates = {
        question_no: Number(question_no)
      };
      if (allowed_languages !== undefined) {
        linkUpdates.allowed_languages = parseAllowedLanguages(allowed_languages);
      }

      const { error: linkError } = await supabase
        .from('folder_problems')
        .update(linkUpdates)
        .eq('folder', folder)
        .eq('problem_uuid', problemUuid);

      if (linkError) {
        if (linkError.code === '23505') {
          throw createError({
            statusCode: 400,
            statusMessage: '此競賽已有相同題號'
          });
        }
        throw linkError;
      }
    }

    return {
      status: 'success',
      message: '題目更新成功'
    };
  } catch (error) {
    console.error('更新題目錯誤:', error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || '更新題目過程發生錯誤'
    });
  }
});
