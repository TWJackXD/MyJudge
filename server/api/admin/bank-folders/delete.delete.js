import { supabase } from '~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  try {
    if (!event.context.user) {
      throw createError({ statusCode: 401, statusMessage: '未授權' })
    }
    if (event.context.user.role !== 'admin') {
      throw createError({ statusCode: 403, statusMessage: '需要管理員權限' })
    }

    const body = await readBody(event)
    const uuid = body?.uuid

    if (!uuid) {
      throw createError({ statusCode: 400, statusMessage: '請提供資料夾 UUID' })
    }

    const { count } = await supabase
      .from('problems')
      .select('*', { count: 'exact', head: true })
      .eq('bank_folder', uuid)

    if (count > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: '資料夾內還有題目，請先移動或刪除題目'
      })
    }

    const { error } = await supabase
      .from('bank_folders')
      .delete()
      .eq('uuid', uuid)

    if (error) throw error

    return { status: 'success', message: '資料夾已刪除' }
  } catch (error) {
    console.error('刪除題庫資料夾錯誤:', error)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message || '刪除資料夾失敗' })
  }
})
