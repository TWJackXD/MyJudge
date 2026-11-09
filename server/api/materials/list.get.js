import { supabase } from '~/server/utils/supabase'
import { canUserSeeResource } from '~/utils/problemVisibility'
import { normalizeMaterialPath } from '~/utils/materialTree'

export default defineEventHandler(async (event) => {
  try {
    const { data, error } = await supabase
      .from('materials')
      .select('uuid, title, file, path, visibility, visibility_users, uploaded_at')
      .order('path', { ascending: true })
      .order('title', { ascending: true })

    if (error) throw error

    const user = event.context.user || null
    const materials = (data || [])
      .filter((material) => canUserSeeResource(material, user))
      .map((material) => ({
        uuid: material.uuid,
        title: material.title,
        file: material.file,
        path: normalizeMaterialPath(material.path),
        visibility: material.visibility || 'public',
        uploaded_at: material.uploaded_at
      }))

    return {
      status: 'success',
      data: materials
    }
  } catch (error) {
    console.error('Get public materials error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: '無法載入教材'
    })
  }
})
