import { ofetch } from 'ofetch';

export default defineNuxtPlugin((_nuxtApp) => {
      const ankrFetch = ofetch.create({    async onRequest({ request, options }) {
      // 確保只處理客戶端請求且 URL 是字串
      if (process.server || typeof request !== 'string') {
        return;
      }

      // 只攔截發送到 '/api/' 的請求
      if (request.startsWith('/api/')) {
        // 從 localStorage 中獲取 token
        const token = localStorage.getItem('auth_token');

        if (token) {
          // 如果 headers 不存在，則初始化為一個空物件
          options.headers = options.headers || {};
          
          // 加上 Authorization 標頭
          // @ts-ignore
          options.headers.Authorization = `Bearer ${token}`;
        }
      }
    },
    async onResponseError({ request, response, options }) {
      // 在 token 過期或無效時，自動登出
      if (response.status === 401) {
        console.warn('Token is invalid or expired, logging out.');
        
        // 移除無效的 token
        localStorage.removeItem('auth_token');
        
        // 使用 navigateTo 進行安全導航到登入頁
        await navigateTo('/login');
      }
    }
  });

  // 將客製化的 ofetch 實例掛載到全域
  globalThis.$fetch = ankrFetch;
});