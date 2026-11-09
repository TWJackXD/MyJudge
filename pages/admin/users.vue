<template>
  <div>
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-gray-900 text-2xl md:text-3xl font-bold">用戶管理</h1>
        <button
          @click="showCreateModal = true"
          class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          新增用戶
        </button>
      </div>

      <!-- 用戶列表 -->
      <div class="bg-white shadow rounded-lg">
        <div v-if="loading" class="text-center py-12">
          <p class="text-gray-500">載入中...</p>
        </div>
        <div v-else-if="users.length === 0" class="text-center py-12">
          <p class="text-gray-500">暫無用戶</p>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">使用者名稱</th>
                <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">角色</th>
                <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">創建時間</th>
                <th class="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="user in users" :key="user.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ user.id }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ user.username }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="[
                      'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    ]"
                  >
                    {{ user.role === 'admin' ? '管理員' : '用戶' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ new Date(user.created_at).toLocaleString('zh-TW') }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    @click="handleDeleteUser(user)"
                    class="text-red-600 hover:text-red-900"
                    :disabled="user.id === currentUserId"
                  >
                    刪除
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 創建用戶模態框 -->
      <div
        v-if="showCreateModal"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        @click="showCreateModal = false"
      >
        <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl" @click.stop>
          <h3 class="text-xl font-semibold mb-6">新增用戶</h3>
          
          <form @submit.prevent="handleCreateUser" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">使用者名稱</label>
              <input
                v-model="newUser.username"
                type="text"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="請輸入使用者名稱"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">密碼</label>
              <input
                v-model="newUser.password"
                type="password"
                required
                minlength="6"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="請輸入密碼（至少6個字元）"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">角色</label>
              <select v-model="newUser.role" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="user">用戶</option>
                <option value="admin">管理員</option>
              </select>
            </div>

            <div v-if="createError" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {{ createError }}
            </div>

            <div class="flex gap-3 pt-4">
              <button
                type="button"
                @click="showCreateModal = false"
                class="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                :disabled="isCreating"
                class="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {{ isCreating ? '創建中...' : '創建' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
</template>

<script setup>
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
});

const { user, fetchUser } = useAuth();
const route = useRoute();

const users = ref([]);
const loading = ref(true);
const showCreateModal = ref(false);
const isCreating = ref(false);
const createError = ref('');
const currentUserId = ref(null);

const newUser = ref({
  username: '',
  password: '',
  role: 'user'
});

onMounted(async () => {
  await fetchUser();
  currentUserId.value = user.value?.id;
  loadUsers();
});

async function loadUsers() {
  try {
    loading.value = true;
    const response = await $fetch('/api/admin/users/list');
    if (response.status === 'success') {
      users.value = response.data;
    }
  } catch (error) {
    console.error('載入用戶列表失敗:', error);
    if (error.data?.statusMessage) {
      alert(error.data.statusMessage);
    }
  } finally {
    loading.value = false;
  }
}

async function handleCreateUser() {
  if (isCreating.value) return;
  
  createError.value = '';
  isCreating.value = true;

  try {
    const response = await $fetch('/api/admin/users/create', {
      method: 'POST',
      body: newUser.value
    });

    if (response.status === 'success') {
      showCreateModal.value = false;
      newUser.value = { username: '', password: '', role: 'user' };
      await loadUsers();
    }
  } catch (error) {
    createError.value = error.data?.statusMessage || error.statusMessage || '創建用戶失敗';
  } finally {
    isCreating.value = false;
  }
}

async function handleDeleteUser(userToDelete) {
  if (!confirm(`確定要刪除用戶「${userToDelete.username}」嗎？此操作無法復原。`)) {
    return;
  }

  try {
    const response = await $fetch(`/api/admin/users/delete`, {
      method: 'DELETE',
      body: { userId: userToDelete.id }
    });

    if (response.status === 'success') {
      await loadUsers();
    }
  } catch (error) {
    alert(error.data?.statusMessage || error.statusMessage || '刪除用戶失敗');
  }
}
</script>

