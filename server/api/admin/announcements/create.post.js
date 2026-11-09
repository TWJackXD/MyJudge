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
    const content = String(body?.content || '').trim()
    const isPublished = body?.is_published !== false
    const publishedAt = body?.published_at
      ? new Date(body.published_at).toISOString()
      : new Date().toISOString()

    if (!content) {
      throw createError({ statusCode: 400, statusMessage: '請填寫公告內容' })
    }

    if (Number.isNaN(Date.parse(publishedAt))) {
      throw createError({ statusCode: 400, statusMessage: '公告日期格式不正確' })
    }

    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('announcements')
      .insert({
        content,
        published_at: publishedAt,
        is_published: isPublished,
        created_at: now,
        updated_at: now
      })
      .select()
      .single()

    if (error) throw error

    return {
      status: 'success',
      message: '公告已建立',
      data
    }
  } catch (error) {
    console.error('建立公告錯誤:', error)
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: error.message || '建立公告失敗'
    })
  }
})
