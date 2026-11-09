export default defineNuxtRouteMiddleware((to, from) => {
  // 优先从 localStorage 获取 token（iframe 环境中更可靠）
  let token = null;
  if (process.client) {
    token = localStorage.getItem('auth_token');
  }
  
  // 如果 localStorage 没有，尝试从 cookie 获取
  if (!token) {
    const cookieToken = useCookie('token');
    token = cookieToken.value;
  }
  
  if (!token) {
    return navigateTo('/login');
  }
});

