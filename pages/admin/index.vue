<template>
  <div>
    <h1 class="text-gray-900 text-2xl md:text-3xl font-bold mb-6">總覽</h1>

    <!-- 總覽統計卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="bg-white shadow rounded-lg p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0 bg-blue-100 rounded-lg p-3">
            <font-awesome-icon icon="fa-solid fa-users" class="text-blue-600 text-xl" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">總用戶數</p>
            <p class="text-2xl font-semibold text-gray-900">{{ stats.totalUsers }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white shadow rounded-lg p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0 bg-green-100 rounded-lg p-3">
            <font-awesome-icon icon="fa-solid fa-file-lines" class="text-green-600 text-xl" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">總題目數</p>
            <p class="text-2xl font-semibold text-gray-900">{{ stats.totalProblems }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white shadow rounded-lg p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0 bg-purple-100 rounded-lg p-3">
            <font-awesome-icon icon="fa-solid fa-folder-open" class="text-purple-600 text-xl" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">總競賽數</p>
            <p class="text-2xl font-semibold text-gray-900">{{ stats.totalFolders }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 快速操作 -->
    <div class="bg-white shadow rounded-lg p-6">
      <h2 class="text-xl font-semibold text-gray-800 mb-4">快速操作</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <NuxtLink
          to="/admin/announcements"
          class="flex items-center p-4 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors"
        >
          <font-awesome-icon icon="fa-solid fa-bullhorn" class="text-orange-600 text-2xl" />
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-900">公告管理</p>
            <p class="text-xs text-gray-500">發布與管理首頁公告</p>
          </div>
        </NuxtLink>

        <NuxtLink
          to="/admin/users"
          class="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
        >
          <font-awesome-icon icon="fa-solid fa-user-plus" class="text-blue-600 text-2xl" />
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-900">用戶管理</p>
            <p class="text-xs text-gray-500">新增或管理系統用戶</p>
          </div>
        </NuxtLink>

        <NuxtLink
          to="/admin/bank"
          class="flex items-center p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
        >
          <font-awesome-icon icon="fa-solid fa-database" class="text-indigo-600 text-2xl" />
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-900">題庫</p>
            <p class="text-xs text-gray-500">管理共用題目內容</p>
          </div>
        </NuxtLink>

        <NuxtLink
          to="/admin/problems"
          class="flex items-center p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
        >
          <font-awesome-icon icon="fa-solid fa-folder-open" class="text-purple-600 text-2xl" />
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-900">競賽</p>
            <p class="text-xs text-gray-500">管理競賽並從題庫選題</p>
          </div>
        </NuxtLink>

        <NuxtLink
          to="/admin/materials"
          class="flex items-center p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
        >
          <font-awesome-icon icon="fa-solid fa-book" class="text-green-600 text-2xl" />
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-900">教材管理</p>
            <p class="text-xs text-gray-500">上傳與管理教材檔案</p>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
});

const stats = ref({
  totalUsers: 0,
  totalProblems: 0,
  totalFolders: 0
});

onMounted(() => {
  loadStats();
});

async function loadStats() {
  try {
    const [usersRes, problemsRes, foldersRes] = await Promise.all([
      $fetch('/api/admin/users/list').catch(() => ({ status: 'success', data: [] })),
      $fetch('/api/admin/problems/list').catch(() => ({ status: 'success', data: [] })),
      $fetch('/api/admin/folders/list').catch(() => ({ status: 'success', data: [] }))
    ]);

    stats.value.totalUsers = usersRes.data?.length || 0;
    stats.value.totalProblems = problemsRes.data?.length || 0;
    stats.value.totalFolders = foldersRes.data?.length || 0;
  } catch (error) {
    console.error('載入統計數據失敗:', error);
  }
}
</script>
