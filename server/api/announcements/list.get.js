import { supabase } from '~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('id, content, published_at')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .order('id', { ascending: false })

    if (error) throw error

    return {
      status: 'success',
      data: data || []
    }
  } catch (error) {
    console.error('獲取公告列表錯誤:', error)
    throw createError({
      statusCode: 500,
      statusMessage: '無法獲取公告'
    })
  }
})
