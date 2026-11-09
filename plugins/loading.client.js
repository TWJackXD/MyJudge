export default defineNuxtPlugin((nuxtApp) => {
  // 創建一個全域、可響應的加載狀態
  const isLoading = useState('isLoading', () => false);

  // Nuxt 頁面開始加載時
  nuxtApp.hook('page:start', () => {
    isLoading.value = true;
  });

  // Nuxt 頁面渲染完成時（包括異步數據）
  nuxtApp.hook('page:finish', () => {
    isLoading.value = false;
  });
});
