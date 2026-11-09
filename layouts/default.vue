<template>
  <Navbar/>
  <main class="flex justify-center px-4 md:px-10 lg:px-23 mx-auto pt-26 pb-4">
    <div class="w-full">
      <slot />
    </div>
  </main>
</template>

<script setup>
const { start, finish } = useLoadingIndicator({
  duration: 3000,
  throttle: 200,
  color: '#3b82f6', // 藍色
  height: '3px'
})
</script>