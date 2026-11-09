import { supabase } from '~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  try {
    if (!event.context.user) {
      throw createError({ statusCode: 401, statusMessage: '未授權' })
    }
    if (event.context.user.role !== 'admin') {
      throw createError({ statusCode: 403, statusMessage: '需要管理員權限' })
    }

    const { data: folders, error } = await supabase
      .from('bank_folders')
      .select('*')
      .order('id', { ascending: true })

    if (error) throw error

    const { data: problems, error: problemsError } = await supabase
      .from('problems')
      .select('bank_folder')

    if (problemsError) throw problemsError

    const countByFolder = new Map()
    let uncategorized = 0
    for (const p of problems || []) {
      if (!p.bank_folder) {
        uncategorized += 1
        continue
      }
      countByFolder.set(p.bank_folder, (countByFolder.get(p.bank_folder) || 0) + 1)
    }

    return {
      status: 'success',
      data: {
        folders: (folders || []).map((f) => ({
          ...f,
          problem_count: countByFolder.get(f.uuid) || 0
        })),
        uncategorized_count: uncategorized
      }
    }
  } catch (error) {
    console.error('獲取題庫資料夾錯誤:', error)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: '無法獲取題庫資料夾' })
  }
})
