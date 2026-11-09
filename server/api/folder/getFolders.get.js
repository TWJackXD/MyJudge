import { supabase } from '~/server/utils/supabase'
import { canUserSeeFolder } from '~/utils/problemVisibility'

export default defineEventHandler(async (event) => {
  try {
    const { data: folders, error } = await supabase
      .from('folders')
      .select('*')
      .order('id', { ascending: false })

    if (error) throw error

    const user = event.context.user || null
    const visibleFolders = (folders || []).filter((folder) => canUserSeeFolder(folder, user))

    return {
      status: 'success',
      data: visibleFolders.map((folder) => ({
        id: folder.id,
        uuid: folder.uuid,
        name: folder.name,
        startTime: folder.start_time,
        endTime: folder.end_time,
        visibility: folder.visibility || 'public'
      }))
    }
  } catch (error) {
    console.error('獲取 folders 資料錯誤:', error)

    throw createError({
      statusCode: 500,
      statusMessage: '無法獲取資料夾列表'
    })
  }
})
