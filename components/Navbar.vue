<template>
  <header class="w-full bg-white border-b border-gray-200 mb-5 px-4 sm:px-10 fixed z-10">
    <nav class="flex items-center justify-between sm:justify-start gap-6">
      <!-- Logo -->
      <NuxtLink to="/" class="mr-2 py-[0.81rem] sm:py-0">
        <img src="/Logo/Logo_Color.png" class="w-8 h-8 sm:w-6 sm:h-6" alt="MyJudge" />
      </NuxtLink>

      <!-- 手機漢堡選單 -->
      <button
        type="button"
        class="sm:hidden text-gray-500 cursor-pointer"
        :aria-expanded="menuOpen"
        aria-label="開啟選單"
        @click="menuOpen = !menuOpen"
      >
        <font-awesome-icon :icon="menuOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars'" />
      </button>

      <!-- 大螢幕頁籤 -->
      <div class="hidden sm:flex gap-6">
        <NuxtLink
          v-for="tab in tabs"
          :key="tab.path"
          :to="tab.path"
          class="py-[0.81rem] w-fit border-b-3 flex items-center gap-1"
          :class="isActiveTab(tab.path)
            ? 'border-gray-800 text-black'
            : 'border-transparent text-gray-500 hover:text-gray-800'"
        >
          <font-awesome-icon :icon="'fa-solid fa-' + tab.icon" />
          {{ tab.label }}
        </NuxtLink>
      </div>

      <!-- 桌面：未登入 / 使用者選單 -->
      <div class="hidden sm:flex gap-6 ml-auto items-center">
        <NuxtLink
          v-if="!hasToken"
          to="/login"
          class="py-[0.81rem] w-fit border-b-3 flex items-center gap-1 border-transparent text-gray-500 hover:text-gray-800"
        >
          <font-awesome-icon icon="fa-solid fa-right-to-bracket" />
          登入
        </NuxtLink>

        <div v-else class="relative" ref="userMenuRef">
          <button
            type="button"
            class="py-[0.81rem] w-fit border-b-3 flex items-center gap-2 border-transparent text-gray-500 hover:text-gray-800 cursor-pointer"
            :aria-expanded="userMenuOpen"
            @click="userMenuOpen = !userMenuOpen"
          >
            <font-awesome-icon icon="fa-solid fa-user" />
            <span>{{ username || '使用者' }}</span>
            <span
              v-if="isAdmin"
              class="text-[10px] leading-none px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold"
            >
              管理員
            </span>
            <font-awesome-icon
              icon="fa-solid fa-chevron-down"
              class="text-xs transition-transform"
              :class="{ 'rotate-180': userMenuOpen }"
            />
          </button>

          <div
            v-if="userMenuOpen"
            class="absolute right-0 mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-20"
          >
            <div class="px-4 py-3 border-b border-gray-100">
              <p class="text-sm font-medium text-gray-900 truncate">{{ username || '使用者' }}</p>
              <p class="text-xs text-gray-500 mt-0.5">{{ isAdmin ? '管理員' : '一般用戶' }}</p>
            </div>

            <NuxtLink
              v-if="isAdmin"
              to="/admin"
              class="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
              @click="userMenuOpen = false"
            >
              <font-awesome-icon icon="fa-solid fa-shield-halved" class="w-4" />
              管理員後台
            </NuxtLink>

            <NuxtLink
              to="/change-password"
              class="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              @click="userMenuOpen = false"
            >
              <font-awesome-icon icon="fa-solid fa-key" class="w-4" />
              變更密碼
            </NuxtLink>

            <NuxtLink
              to="/logout"
              class="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100"
              @click="userMenuOpen = false"
            >
              <font-awesome-icon icon="fa-solid fa-right-from-bracket" class="w-4" />
              登出
            </NuxtLink>
          </div>
        </div>
      </div>
    </nav>

    <!-- 手機選單 -->
    <div v-if="menuOpen" class="sm:hidden flex flex-col pb-3 border-t border-gray-100">
      <NuxtLink
        v-for="tab in tabs"
        :key="'mobile-' + tab.path"
        :to="tab.path"
        class="py-3 flex items-center gap-2"
        :class="isActiveTab(tab.path) ? 'text-black' : 'text-gray-500'"
        @click="menuOpen = false"
      >
        <font-awesome-icon :icon="'fa-solid fa-' + tab.icon" />
        {{ tab.label }}
      </NuxtLink>

      <template v-if="hasToken">
        <div class="py-3 flex items-center gap-2 text-gray-700 border-t border-gray-100 mt-1">
          <font-awesome-icon icon="fa-solid fa-user" />
          {{ username || '使用者' }}
          <span
            v-if="isAdmin"
            class="text-[10px] leading-none px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold"
          >
            管理員
          </span>
        </div>

        <NuxtLink
          v-if="isAdmin"
          to="/admin"
          class="py-3 flex items-center gap-2 text-blue-700"
          @click="menuOpen = false"
        >
          <font-awesome-icon icon="fa-solid fa-shield-halved" />
          管理員後台
        </NuxtLink>

        <NuxtLink
          to="/change-password"
          class="py-3 flex items-center gap-2 text-gray-500"
          @click="menuOpen = false"
        >
          <font-awesome-icon icon="fa-solid fa-key" />
          變更密碼
        </NuxtLink>

        <NuxtLink
          to="/logout"
          class="py-3 flex items-center gap-2 text-red-600"
          @click="menuOpen = false"
        >
          <font-awesome-icon icon="fa-solid fa-right-from-bracket" />
          登出
        </NuxtLink>
      </template>

      <NuxtLink
        v-else
        to="/login"
        class="py-3 flex items-center gap-2 text-gray-500 border-t border-gray-100 mt-1"
        @click="menuOpen = false"
      >
        <font-awesome-icon icon="fa-solid fa-right-to-bracket" />
        登入
      </NuxtLink>
    </div>
  </header>
</template>

<script setup>
import { onClickOutside } from '@vueuse/core';

const route = useRoute();
const { user, isAdmin, fetchUser } = useAuth();

const username = computed(() => user.value?.username || '使用者');
const hasToken = ref(false);
const menuOpen = ref(false);
const userMenuOpen = ref(false);
const userMenuRef = ref(null);

const tabs = [
  { label: '題目', icon: 'list-check', path: '/problem' },
  { label: '成績', icon: 'star', path: '/score' },
  { label: '說明', icon: 'circle-info', path: '/info' },
  { label: '課程', icon: 'book', path: '/course' },
];

const isActiveTab = (tabPath) => {
  if (tabPath === '/problem') {
    return route.path.startsWith('/problem');
  }
  return route.path === tabPath;
};

function getToken() {
  if (process.client) {
    const localToken = localStorage.getItem('auth_token');
    if (localToken) return localToken;
  }
  return useCookie('token').value;
}

watch(() => route.path, () => {
  menuOpen.value = false;
  userMenuOpen.value = false;
});

onClickOutside(userMenuRef, () => {
  userMenuOpen.value = false;
});

onMounted(async () => {
  const token = getToken();
  hasToken.value = !!token;

  if (token) {
    try {
      await fetchUser();
    } catch (error) {
      console.error('獲取用戶資訊失敗:', error);
    }
  }
});
</script>
