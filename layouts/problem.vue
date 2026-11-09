<template>
  <Navbar/>
  <main class="flex justify-center px-4 md:px-8 lg:px-12 mx-auto h-screen pt-26 pb-8">
    <div class="w-full h-full min-h-0">
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