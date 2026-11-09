<template>
  <Navbar />
  <main class="flex justify-center px-4 md:px-10 lg:px-23 mx-auto pt-26 pb-4">
    <div class="w-full">
      <div class="mb-2 flex items-center gap-2 text-sm text-gray-500">
        <font-awesome-icon icon="fa-solid fa-shield-halved" class="text-blue-600" />
        <span>管理員後台</span>
      </div>
      <AdminNav />
      <slot />
    </div>
  </main>
</template>

<script setup>
const { start, finish } = useLoadingIndicator({
  duration: 3000,
  throttle: 200,
  color: '#3b82f6',
  height: '3px'
});
</script>
