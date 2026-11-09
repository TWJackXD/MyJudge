<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <!-- Loading Overlay -->
    <div v-if="isLoading" class="loading-overlay">
      <LoadingSpinner />
    </div>
  </div>
</template>

<script setup>
// 從 Nuxt 狀態中獲取 isLoading
const isLoading = useState('isLoading');
</script>

<style>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(255, 255, 255, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999; /* 確保在最上層 */
  backdrop-filter: blur(4px); /* 添加模糊效果 */
  transition: opacity 0.2s ease-in-out;
}
</style>