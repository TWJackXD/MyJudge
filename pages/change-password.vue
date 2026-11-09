<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 px-4">
    <div class="max-w-md w-full bg-white rounded-lg shadow-md p-8">
      <h1 class="text-3xl font-bold text-center mb-8 text-blue-600">變更密碼</h1>
      
      <form @submit.prevent="handleChangePassword" class="space-y-6">
        <div>
          <label for="currentPassword" class="block text-sm font-medium text-gray-700 mb-2">
            當前密碼
          </label>
          <input
            id="currentPassword"
            v-model="currentPassword"
            type="password"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="請輸入當前密碼"
          />
        </div>

        <div>
          <label for="newPassword" class="block text-sm font-medium text-gray-700 mb-2">
            新密碼
          </label>
          <input
            id="newPassword"
            v-model="newPassword"
            type="password"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="請輸入新密碼（至少6個字元）"
          />
        </div>

        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">
            確認新密碼
          </label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="請再次輸入新密碼"
          />
        </div>

        <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {{ error }}
        </div>

        <div v-if="success" class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {{ success }}
        </div>

        <div class="flex gap-3">
          <button
            type="button"
            @click="$router.back()"
            class="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 focus:ring-4 focus:ring-gray-300 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            :disabled="isLoading"
            class="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ isLoading ? '更改中...' : '確認更改' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: 'auth', // 需要認證才能訪問
  layout: 'fullscreen'
});

const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const isLoading = ref(false);
const error = ref('');
const success = ref('');

async function handleChangePassword() {
  if (isLoading.value) return;
  
  error.value = '';
  success.value = '';

  // 驗證新密碼長度
  if (newPassword.value.length < 6) {
    error.value = '新密碼長度至少需要 6 個字元';
    return;
  }

  // 驗證兩次輸入的密碼是否一致
  if (newPassword.value !== confirmPassword.value) {
    error.value = '兩次輸入的新密碼不一致';
    return;
  }

  isLoading.value = true;

  try {
    const response = await $fetch('/api/auth/changePassword', {
      method: 'POST',
      body: {
        currentPassword: currentPassword.value,
        newPassword: newPassword.value
      }
    });

    if (response.status === 'success') {
      success.value = '密碼更改成功';
      // 清空表單
      currentPassword.value = '';
      newPassword.value = '';
      confirmPassword.value = '';

      // 3 秒後返回
      setTimeout(() => {
        navigateTo('/');
      }, 2000);
    }
  } catch (err) {
    console.error('更改密碼失敗:', err);
    error.value = err.statusMessage || '更改密碼失敗';
  } finally {
    isLoading.value = false;
  }
}
</script>

