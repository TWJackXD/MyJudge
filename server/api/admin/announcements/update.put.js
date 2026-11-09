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

    const updates = {
      updated_at: new Date().toISOString()
    }

    if (body.content !== undefined) {
      const content = String(body.content || '').trim()
      if (!content) {
        throw createError({ statusCode: 400, statusMessage: '請填寫公告內容' })
      }
      updates.content = content
    }

    if (body.published_at !== undefined) {
      const publishedAt = new Date(body.published_at).toISOString()
      if (Number.isNaN(Date.parse(publishedAt))) {
        throw createError({ statusCode: 400, statusMessage: '公告日期格式不正確' })
      }
      updates.published_at = publishedAt
    }

    if (body.is_published !== undefined) {
      updates.is_published = !!body.is_published
    }

    const { data, error } = await supabase
      .from('announcements')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return {
      status: 'success',
      message: '公告已更新',
      data
    }
  } catch (error) {
    console.error('更新公告錯誤:', error)
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: error.message || '更新公告失敗'
    })
  }
})
