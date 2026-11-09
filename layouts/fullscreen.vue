<template>
  <main class="w-screen h-screen">
    <div class="w-full">
      <slot />
    </div>
  </main>
</template>

<script setup>
// 使用 Nuxt 的路由載入指示器
const { start, finish } = useLoadingIndicator({
  duration: 3000,
  throttle: 200,
  color: '#3b82f6', // 藍色
  height: '3px'
})
</script>