export default defineNuxtRouteMiddleware(async () => {
  let token = null;

  if (process.client) {
    token = localStorage.getItem('auth_token');
  }

  if (!token) {
    const cookieToken = useCookie('token');
    token = cookieToken.value;
  }

  if (!token) {
    return navigateTo('/login');
  }

  const { user, fetchUser, isAdmin } = useAuth();

  if (!user.value) {
    await fetchUser();
  }

  if (!isAdmin.value) {
    return navigateTo('/');
  }
});
