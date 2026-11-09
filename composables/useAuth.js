export const useAuth = () => {
  const user = useState('auth.user', () => null);
  const token = useState('auth.token', () => null);

  // 獲取當前用戶信息
  const fetchUser = async () => {
    try {
      const response = await $fetch('/api/auth/me');
      if (response.status === 'success') {
        user.value = response.user;
        return response.user;
      }
      user.value = null;
      return null;
    } catch (error) {
      console.error('獲取用戶信息失敗:', error);
      user.value = null;
      return null;
    }
  };

  // 登出
  const logout = async () => {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('登出失敗:', error);
    } finally {
      user.value = null;
      token.value = null;
      navigateTo('/login');
    }
  };

  // 檢查是否已登入
  const isAuthenticated = computed(() => !!user.value);

  // 檢查是否為管理員
  const isAdmin = computed(() => user.value?.role === 'admin');

  return {
    user: readonly(user),
    token: readonly(token),
    fetchUser,
    logout,
    isAuthenticated,
    isAdmin
  };
};
