<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="text-center">
      <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p class="text-lg text-gray-700">正在登出中...</p>
    </div>
  </div>
</template>

<script setup>
// 页面元数据：不需要认证，不需要布局
definePageMeta({
  layout: false
});

import { onMounted } from 'vue';

const router = useRouter();

onMounted(async () => {
  try {
    // 调用登出 API
    await $fetch('/api/auth/logout', {
      method: 'POST'
    });

    // 清除所有本地存储和缓存
    if (process.client) {
      // 清除 localStorage
      localStorage.clear();
      // 清除 sessionStorage
      sessionStorage.clear();
    }

    // 延迟一下让用户看到登出提示
    await new Promise(resolve => setTimeout(resolve, 500));

    // 重定向到登录页
    router.push('/login');
  } catch (error) {
    // 即使出错也重定向到登录页
    console.error('登出过程中出错:', error);
    router.push('/login');
  }
});
</script>

