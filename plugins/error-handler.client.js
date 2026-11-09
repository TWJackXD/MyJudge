// plugins/error-handler.client.js
// 捕获并忽略 iframe 环境中的剪贴板和其他无害错误

export default defineNuxtPlugin((nuxtApp) => {
  // 捕获 Vue 错误
  nuxtApp.vueApp.config.errorHandler = (err, instance, info) => {
    // 忽略剪贴板相关错误
    if (err && err.message && (
      err.message.includes('clipboard') ||
      err.message.includes('getActiveWindow') ||
      err.message.includes('Canceled')
    )) {
      // 静默忽略这些错误
      return;
    }
    
    // 其他错误正常处理
    console.error('Vue Error:', err, info);
  };
  
  // 捕获全局 Promise 拒绝
  if (process.client) {
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason && event.reason.message && (
        event.reason.message.includes('clipboard') ||
        event.reason.message.includes('getActiveWindow') ||
        event.reason.message.includes('Canceled')
      )) {
        // 静默忽略这些错误
        event.preventDefault();
        return;
      }
    });
    
    // 捕获全局错误
    window.addEventListener('error', (event) => {
      if (event.message && (
        event.message.includes('clipboard') ||
        event.message.includes('getActiveWindow') ||
        event.message.includes('Canceled')
      )) {
        // 静默忽略这些错误
        event.preventDefault();
        return;
      }
    });
  }
});

