<template>
  <div>
    <h1 class="text-blue-600 text-2xl md:text-3xl font-bold mb-6">最新公告</h1>

    <div v-if="loading" class="text-center py-10 text-gray-500">載入中...</div>
    <div v-else-if="announcements.length === 0" class="text-center py-10 text-gray-500">
      目前沒有公告
    </div>
    <div v-else class="flex flex-col gap-3 mb-6">
      <div
        v-for="item in announcements"
        :key="item.id"
        class="hover:bottom-1 bottom-0 relative transition-all duration-100 shadow-sm rounded-xl p-5 border border-gray-200"
      >
        <div class="flex flex-col md:flex-row items-center">
          <div class="w-full md:w-8/9">
            <p class="mb-2 md:mb-0 whitespace-pre-wrap">{{ item.content }}</p>
          </div>
          <div class="w-full md:w-1/9">
            <p class="text-end text-sm text-gray-500">{{ formatDate(item.published_at) }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="w-full text-center">
      <a href="#" class="underline text-gray-500 hover:text-gray-600 text-xs">MyJudge-v0.1.0</a>
    </div>
  </div>
</template>

<script setup>
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

const announcements = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const response = await $fetch('/api/announcements/list')
    if (response.status === 'success') {
      announcements.value = response.data || []
    }
  } catch (error) {
    console.error('載入公告失敗:', error)
  } finally {
    loading.value = false
  }
})

function formatDate(value) {
  if (!value) return '-'
  return dayjs.utc(value).tz('Asia/Taipei').format('YYYY-MM-DD')
}
</script>
