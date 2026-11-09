import { supabase } from '~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  try {
    if (!event.context.user) {
      throw createError({ statusCode: 401, statusMessage: '未授權' })
    }
    if (event.context.user.role !== 'admin') {
      throw createError({ statusCode: 403, statusMessage: '需要管理員權限' })
    }

    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('published_at', { ascending: false })
      .order('id', { ascending: false })

    if (error) throw error

    return { status: 'success', data: data || [] }
  } catch (error) {
    console.error('獲取公告管理列表錯誤:', error)
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: '無法獲取公告列表'
    })
  }
})
