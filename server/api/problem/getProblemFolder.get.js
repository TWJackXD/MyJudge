import { supabase } from '~/server/utils/supabase'
import { canUserSeeFolder } from '~/utils/problemVisibility'

export default defineEventHandler(async (event) => {
  try {
    const { uuid } = getQuery(event)

    if (!uuid) {
      throw createError({
        statusCode: 400,
        statusMessage: '必須提供 uuid 參數'
      })
    }

    const { data: folderRows, error } = await supabase
      .from('folders')
      .select('*')
      .eq('uuid', uuid)
      .limit(1)

    if (error) throw error
    if (!folderRows || folderRows.length === 0) {
      return { status: 'success', data: [] }
    }

    const folder = folderRows[0]
    const user = event.context.user || null

    if (!canUserSeeFolder(folder, user)) {
      throw createError({
        statusCode: 403,
        statusMessage: '你沒有權限查看此競賽'
      })
    }

    return {
      status: 'success',
      data: [{
        name: folder.name,
        uuid: folder.uuid,
        startTime: folder.start_time,
        endTime: folder.end_time,
        visibility: folder.visibility || 'public',
        visibility_users: folder.visibility_users || []
      }]
    }
  } catch (error) {
    console.error('獲取 folder 資料錯誤:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: '無法獲取資料夾名稱'
    })
  }
})
