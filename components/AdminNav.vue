<template>
  <div class="bg-white shadow rounded-lg mb-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2">
      <nav class="flex flex-wrap gap-1" aria-label="管理員選單">
        <NuxtLink
          v-for="tab in tabs"
          :key="tab.path"
          :to="tab.path"
          class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          :class="isActive(tab)
            ? 'bg-blue-100 text-blue-700'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'"
        >
          <font-awesome-icon :icon="'fa-solid fa-' + tab.icon" class="mr-1.5" />
          {{ tab.label }}
        </NuxtLink>
      </nav>

      <NuxtLink
        to="/problem"
        class="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors whitespace-nowrap"
      >
        <font-awesome-icon icon="fa-solid fa-arrow-left" class="mr-1.5" />
        返回前台
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
const route = useRoute();

const tabs = [
  { label: '總覽', icon: 'gauge-high', path: '/admin', match: 'exact' },
  { label: '公告管理', icon: 'bullhorn', path: '/admin/announcements' },
  { label: '用戶管理', icon: 'users', path: '/admin/users' },
  { label: '題庫', icon: 'database', path: '/admin/bank' },
  { label: '競賽', icon: 'folder-open', path: '/admin/problems' },
  { label: '教材管理', icon: 'book', path: '/admin/materials' },
];

function isActive(tab) {
  if (tab.match === 'exact') {
    return route.path === '/admin' || route.path === '/admin/';
  }

  if (route.path.startsWith(tab.path)) {
    return true;
  }

  return (tab.also || []).some((prefix) => route.path.startsWith(prefix));
}
</script>
