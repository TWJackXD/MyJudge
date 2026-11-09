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
    const name = String(body?.name || '').trim()

    if (!uuid || !name) {
      throw createError({ statusCode: 400, statusMessage: '請提供資料夾與名稱' })
    }

    const { data, error } = await supabase
      .from('bank_folders')
      .update({ name })
      .eq('uuid', uuid)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        throw createError({ statusCode: 400, statusMessage: '資料夾名稱已存在' })
      }
      throw error
    }

    return { status: 'success', message: '資料夾已更新', data }
  } catch (error) {
    console.error('更新題庫資料夾錯誤:', error)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message || '更新資料夾失敗' })
  }
})
