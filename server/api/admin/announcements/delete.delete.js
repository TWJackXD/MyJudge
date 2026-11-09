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
    const id = Number(body?.id)

    if (!id) {
      throw createError({ statusCode: 400, statusMessage: '請提供公告 ID' })
    }

    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id)

    if (error) throw error

    return {
      status: 'success',
      message: '公告已刪除'
    }
  } catch (error) {
    console.error('刪除公告錯誤:', error)
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: error.message || '刪除公告失敗'
    })
  }
})
