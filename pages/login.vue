<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 px-4">
    <div class="max-w-md w-full bg-white rounded-lg shadow-md p-8">
      <h1 class="text-3xl font-bold text-center mb-8 text-blue-600">登入系統</h1>
      
      <form @submit.prevent="handleLogin" class="space-y-6">
        <div>
          <label for="username" class="block text-sm font-medium text-gray-700 mb-2">
            使用者名稱
          </label>
          <input
            id="username"
            v-model="username"
            type="text"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="請輸入使用者名稱"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
            密碼
          </label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="請輸入密碼"
          />
        </div>

        <div class="flex items-center">
          <input
            id="rememberMe"
            v-model="rememberMe"
            type="checkbox"
            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label for="rememberMe" class="ml-2 block text-sm text-gray-700">
            記住我（7天內保持登入）
          </label>
        </div>

        <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {{ error }}
        </div>

        <button
          type="submit"
          :disabled="isLoading"
          class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ isLoading ? '登入中...' : '登入' }}
        </button>
      </form>

      <div class="mt-6 text-center">
        <NuxtLink to="/" class="text-blue-600 hover:text-blue-800 text-sm">
          返回首頁
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: 'guest', // 如果已登入則跳轉（需要創建這個中間件）
  layout: 'fullscreen'
});

const route = useRoute();
const router = useRouter();
const username = ref('');
const password = ref('');
const rememberMe = ref(false);
const isLoading = ref(false);
const error = ref('');

async function handleLogin() {
  if (isLoading.value) return;
  
  error.value = '';
  isLoading.value = true;

  try {
    const response = await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        username: username.value,
        password: password.value,
        rememberMe: rememberMe.value
      }
    });

    if (response.status === 'success') {
      // 在 iframe 环境中，cookie 可能不可靠
      // 改用 localStorage 存储 token
      if (response.token) {
        localStorage.setItem('auth_token', response.token);
      }
      
      // 檢查是否有 next 參數
      const nextPath = route.query.next;
      
      // 使用 Nuxt 的 navigateTo 进行 SPA 导航
      if (nextPath && typeof nextPath === 'string') {
        await navigateTo(decodeURIComponent(nextPath));
      } else {
        await navigateTo('/');
      }
    }
  } catch (err) {
    console.error('登入失敗:', err);
    
    // 優先使用後端返回的具體錯誤訊息
    // Nuxt $fetch 錯誤格式：err.data?.statusMessage 或 err.statusMessage
    let errorMessage = '登入失敗，請檢查使用者名稱和密碼';
    
    if (err.data?.statusMessage) {
      errorMessage = err.data.statusMessage;
    } else if (err.statusMessage) {
      errorMessage = err.statusMessage;
    } else if (err.data?.message) {
      errorMessage = err.data.message;
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    error.value = errorMessage;
  } finally {
    isLoading.value = false;
  }
}
</script>

