<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-gray-900 text-2xl md:text-3xl font-bold">公告管理</h1>
      <button
        class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 cursor-pointer"
        @click="openCreate"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        新增公告
      </button>
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-500">載入中...</div>
    <div v-else-if="announcements.length === 0" class="text-center py-12 text-gray-500">暫無公告</div>
    <div v-else class="bg-white shadow rounded-lg overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">內容</th>
            <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">發布日期</th>
            <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">狀態</th>
            <th class="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="item in announcements" :key="item.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 text-sm text-gray-900 whitespace-pre-wrap">{{ item.content }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ formatDate(item.published_at) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span
                class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                :class="item.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'"
              >
                {{ item.is_published ? '已發布' : '未發布' }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
              <button class="text-blue-600 hover:text-blue-900 cursor-pointer" @click="openEdit(item)">
                編輯
              </button>
              <button
                class="text-amber-600 hover:text-amber-800 cursor-pointer"
                @click="togglePublish(item)"
              >
                {{ item.is_published ? '下架' : '發布' }}
              </button>
              <button class="text-red-600 hover:text-red-900 cursor-pointer" @click="handleDelete(item)">
                刪除
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="showModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click="closeModal"
    >
      <div class="bg-white rounded-lg p-8 max-w-xl w-full mx-4 shadow-xl" @click.stop>
        <h3 class="text-xl font-semibold mb-6">{{ editingId ? '編輯公告' : '新增公告' }}</h3>

        <form class="space-y-4" @submit.prevent="handleSubmit">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">公告內容</label>
            <textarea
              v-model="form.content"
              required
              rows="5"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="請輸入公告內容"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">發布日期</label>
            <input
              v-model="form.published_at"
              type="date"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <label class="inline-flex items-center gap-2 text-sm text-gray-700">
            <input v-model="form.is_published" type="checkbox" class="rounded border-gray-300" />
            立即發布到首頁
          </label>

          <div v-if="submitError" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {{ submitError }}
          </div>

          <div class="flex gap-3 pt-2">
            <button
              type="button"
              class="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
              @click="closeModal"
            >
              取消
            </button>
            <button
              type="submit"
              :disabled="submitting"
              class="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {{ submitting ? '儲存中...' : '儲存' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

const { fetchUser } = useAuth()
const announcements = ref([])
const loading = ref(true)
const showModal = ref(false)
const editingId = ref(null)
const submitting = ref(false)
const submitError = ref('')

const form = ref({
  content: '',
  published_at: dayjs().tz('Asia/Taipei').format('YYYY-MM-DD'),
  is_published: true
})

onMounted(async () => {
  await fetchUser()
  await loadAnnouncements()
})

function formatDate(value) {
  if (!value) return '-'
  return dayjs.utc(value).tz('Asia/Taipei').format('YYYY-MM-DD')
}

async function loadAnnouncements() {
  try {
    loading.value = true
    const response = await $fetch('/api/admin/announcements/list')
    if (response.status === 'success') {
      announcements.value = response.data || []
    }
  } catch (error) {
    console.error('載入公告失敗:', error)
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  form.value = {
    content: '',
    published_at: dayjs().tz('Asia/Taipei').format('YYYY-MM-DD'),
    is_published: true
  }
  submitError.value = ''
  showModal.value = true
}

function openEdit(item) {
  editingId.value = item.id
  form.value = {
    content: item.content || '',
    published_at: dayjs.utc(item.published_at).tz('Asia/Taipei').format('YYYY-MM-DD'),
    is_published: !!item.is_published
  }
  submitError.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  submitError.value = ''
}

async function handleSubmit() {
  if (submitting.value) return
  submitting.value = true
  submitError.value = ''

  try {
    const payload = {
      content: form.value.content,
      published_at: dayjs.tz(form.value.published_at, 'Asia/Taipei').toISOString(),
      is_published: form.value.is_published
    }

    if (editingId.value) {
      await $fetch('/api/admin/announcements/update', {
        method: 'PUT',
        body: { id: editingId.value, ...payload }
      })
    } else {
      await $fetch('/api/admin/announcements/create', {
        method: 'POST',
        body: payload
      })
    }

    closeModal()
    await loadAnnouncements()
  } catch (error) {
    submitError.value = error.data?.statusMessage || error.statusMessage || '儲存失敗'
  } finally {
    submitting.value = false
  }
}

async function togglePublish(item) {
  try {
    await $fetch('/api/admin/announcements/update', {
      method: 'PUT',
      body: {
        id: item.id,
        is_published: !item.is_published
      }
    })
    await loadAnnouncements()
  } catch (error) {
    alert(error.data?.statusMessage || error.statusMessage || '更新狀態失敗')
  }
}

async function handleDelete(item) {
  if (!confirm(`確定刪除這則公告？\n\n${item.content}`)) return

  try {
    await $fetch('/api/admin/announcements/delete', {
      method: 'DELETE',
      body: { id: item.id }
    })
    await loadAnnouncements()
  } catch (error) {
    alert(error.data?.statusMessage || error.statusMessage || '刪除失敗')
  }
}
</script>
