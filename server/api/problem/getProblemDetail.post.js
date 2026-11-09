import { supabase } from '~/server/utils/supabase';
import { parseAllowedLanguages } from '~/utils/languages';
import { canAccessProblem, canUserSeeFolder } from '~/utils/problemVisibility';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { id, uuid, folder: folderUuid } = body;

  if (!id && !uuid) {
    throw createError({
      statusCode: 400,
      statusMessage: '必須提供 id 或 uuid 參數'
    })
  }

  try {
    let query = supabase.from('problems').select('*')

    if (id) {
      query = query.eq('id', id)
    } else {
      query = query.eq('uuid', uuid)
    }

    const { data: rows, error } = await query.limit(1)

    if (error) throw error

    if (!rows || rows.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: '找不到指定的題目'
      })
    }

    const problem = rows[0]
    const user = event.context.user || null
    const isAdmin = user?.role === 'admin'

    let folder = { visibility: 'public', visibility_users: [] }
    let questionNo = problem.question_no
    let allowedLanguages = []
    let resolvedFolderUuid = folderUuid || null

    if (folderUuid) {
      const { data: folderRows, error: folderError } = await supabase
        .from('folders')
        .select('*')
        .eq('uuid', folderUuid)
        .limit(1)

      if (folderError) throw folderError

      if (!folderRows?.length) {
        throw createError({
          statusCode: 404,
          statusMessage: '找不到指定的競賽'
        })
      }

      folder = folderRows[0]

      if (!canUserSeeFolder(folder, user)) {
        throw createError({
          statusCode: 403,
          statusMessage: '你沒有權限查看此競賽'
        })
      }

      const { data: linkRows, error: linkError } = await supabase
        .from('folder_problems')
        .select('question_no, allowed_languages')
        .eq('folder', folderUuid)
        .eq('problem_uuid', problem.uuid)
        .limit(1)

      if (linkError) throw linkError

      if (!linkRows?.length) {
        throw createError({
          statusCode: 404,
          statusMessage: '此題目未加入該競賽'
        })
      }

      questionNo = linkRows[0].question_no
      allowedLanguages = parseAllowedLanguages(linkRows[0].allowed_languages)
    } else if (!isAdmin) {
      // 非管理員必須帶競賽上下文
      throw createError({
        statusCode: 400,
        statusMessage: '必須提供 folder 參數'
      })
    }

    if (!isAdmin || folderUuid) {
      if (!canAccessProblem(problem, folder, user)) {
        throw createError({
          statusCode: 403,
          statusMessage: '你沒有權限查看此題目'
        })
      }
    }

    const data = {
      id: problem.id,
      uuid: problem.uuid,
      questionNo,
      title: problem.title,
      summary: problem.summary,
      description: problem.description,
      tags: problem.tags || '',
      folderUuid: resolvedFolderUuid,
      bank_folder: problem.bank_folder || null,
      allowed_languages: allowedLanguages,
      content_type: problem.content_type || 'html',
      pdf_url: problem.pdf_url || null,
      visibility: problem.visibility || 'public',
      visibility_users: problem.visibility_users || []
    }

    // 測資僅管理員可見，避免前台洩漏隱藏測資
    if (isAdmin) {
      data.input = problem.input
      data.output = problem.output
    }

    return {
      status: 'success',
      data
    }
  } catch (error) {
    console.error('資料庫查詢錯誤:', error)

    if (error.statusCode) throw error

    throw createError({
      statusCode: 500,
      statusMessage: '伺服器內部錯誤'
    })
  }
})
