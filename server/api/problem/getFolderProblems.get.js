import { supabase } from '~/server/utils/supabase'
import { parseAllowedLanguages } from '~/utils/languages'
import { canAccessProblem, canUserSeeFolder } from '~/utils/problemVisibility'

export default defineEventHandler(async (event) => {
  try {
    const { folder } = getQuery(event)

    if (!folder) {
      throw createError({
        statusCode: 400,
        statusMessage: '必須提供 folder 參數'
      })
    }

    const user = event.context.user || null

    const { data: folderRows, error: folderError } = await supabase
      .from('folders')
      .select('*')
      .eq('uuid', folder)
      .limit(1)

    if (folderError) throw folderError

    if (!folderRows || folderRows.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: '找不到指定的競賽'
      })
    }

    const folderRecord = folderRows[0]

    if (!canUserSeeFolder(folderRecord, user)) {
      throw createError({
        statusCode: 403,
        statusMessage: '你沒有權限查看此競賽'
      })
    }

    const { data: links, error } = await supabase
      .from('folder_problems')
      .select('question_no, allowed_languages, problems(*)')
      .eq('folder', folder)
      .order('question_no', { ascending: true })

    if (error) throw error

    const visibleProblems = (links || [])
      .filter((link) => link.problems)
      .filter((link) => canAccessProblem(link.problems, folderRecord, user))
      .map((link) => {
        const problem = link.problems
        return {
          id: problem.id,
          uuid: problem.uuid,
          questionNo: link.question_no,
          title: problem.title,
          tags: problem.tags || '',
          allowed_languages: parseAllowedLanguages(link.allowed_languages),
          visibility: problem.visibility || 'public',
          content_type: problem.content_type || 'html'
        }
      })

    return {
      status: 'success',
      data: visibleProblems
    }
  } catch (error) {
    console.error('獲取 problems 資料錯誤:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: '無法獲取題目列表'
    })
  }
})
