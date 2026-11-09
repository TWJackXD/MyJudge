<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <div class="flex items-center gap-3">
        <button
          v-if="selectedFolder !== null"
          class="text-blue-600 hover:text-blue-800 cursor-pointer"
          @click="goBack"
        >
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h1 class="text-gray-900 text-2xl md:text-3xl font-bold">
          {{ selectedFolder === null ? '題庫' : currentFolderTitle }}
        </h1>
      </div>
      <div class="flex gap-2">
        <button
          v-if="selectedFolder === null"
          class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 cursor-pointer"
          @click="openCreateFolder"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          新增資料夾
        </button>
        <NuxtLink
          v-if="selectedFolder !== null && selectedFolder !== 'uncategorized'"
          :to="`/admin/bank/create?bank_folder=${selectedFolder}`"
          class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          新增題目
        </NuxtLink>
        <NuxtLink
          v-else-if="selectedFolder === 'uncategorized'"
          to="/admin/bank/create"
          class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          新增題目
        </NuxtLink>
      </div>
    </div>

    <!-- 資料夾列表 -->
    <div v-if="selectedFolder === null">
      <div v-if="foldersLoading" class="text-center py-12 text-gray-500">載入中...</div>
      <div v-else class="bg-white shadow rounded-lg overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">資料夾</th>
              <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">題目數</th>
              <th class="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="folder in folders"
              :key="folder.uuid"
              class="hover:bg-gray-50"
            >
              <td class="px-6 py-4 text-sm font-medium">
                <button class="text-blue-600 hover:text-blue-800 cursor-pointer" @click="selectFolder(folder.uuid)">
                  {{ folder.name }}
                </button>
              </td>
              <td class="px-6 py-4 text-sm text-gray-500">{{ folder.problem_count }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                <button class="text-blue-600 hover:text-blue-900 cursor-pointer" @click="openEditFolder(folder)">
                  重新命名
                </button>
                <button class="text-red-600 hover:text-red-900 cursor-pointer" @click="handleDeleteFolder(folder)">
                  刪除
                </button>
              </td>
            </tr>
            <tr v-if="uncategorizedCount > 0" class="hover:bg-gray-50">
              <td class="px-6 py-4 text-sm font-medium">
                <button class="text-blue-600 hover:text-blue-800 cursor-pointer" @click="selectFolder('uncategorized')">
                  未分類
                </button>
              </td>
              <td class="px-6 py-4 text-sm text-gray-500">{{ uncategorizedCount }}</td>
              <td class="px-6 py-4 text-right text-sm text-gray-400">—</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 題目列表 -->
    <div v-else>
      <div v-if="loading" class="text-center py-12 text-gray-500">載入中...</div>
      <div v-else-if="problems.length === 0" class="text-center py-12 text-gray-500">此資料夾尚無題目</div>
      <div v-else class="bg-white shadow rounded-lg overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">標題</th>
              <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">可見性</th>
              <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">內容</th>
              <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">使用競賽</th>
              <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">標籤</th>
              <th class="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="problem in problems" :key="problem.uuid" class="hover:bg-gray-50">
              <td class="px-6 py-4 text-sm font-medium text-gray-900">{{ problem.title }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                  {{ visibilityLabel(problem.visibility) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ problem.content_type === 'pdf' ? 'PDF' : 'HTML' }}
              </td>
              <td class="px-6 py-4 text-sm text-gray-500">
                <span v-if="!problem.contests?.length">未使用</span>
                <span v-else>{{ problem.contests.map((c) => c.folder_name || c.folder).join('、') }}</span>
              </td>
              <td class="px-6 py-4">
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="tag in (problem.tags || '').split(',').filter((t) => t.trim())"
                    :key="tag"
                    class="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800"
                  >
                    {{ tag.trim() }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                <NuxtLink :to="`/admin/bank/edit/${problem.uuid}`" class="text-blue-600 hover:text-blue-900">
                  編輯
                </NuxtLink>
                <button class="text-red-600 hover:text-red-900 cursor-pointer" @click="handleDelete(problem)">
                  刪除
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 資料夾模態框 -->
    <div
      v-if="showFolderModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click="closeFolderModal"
    >
      <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl" @click.stop>
        <h3 class="text-xl font-semibold mb-6">{{ editingFolderUuid ? '重新命名資料夾' : '新增資料夾' }}</h3>
        <form class="space-y-4" @submit.prevent="handleSubmitFolder">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">資料夾名稱</label>
            <input
              v-model="folderForm.name"
              type="text"
              required
              maxlength="64"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="例如：基礎練習"
            />
          </div>
          <div v-if="folderError" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {{ folderError }}
          </div>
          <div class="flex gap-3 pt-2">
            <button type="button" class="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg" @click="closeFolderModal">
              取消
            </button>
            <button
              type="submit"
              :disabled="folderSubmitting"
              class="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {{ folderSubmitting ? '儲存中...' : '儲存' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { visibilityLabel } from '~/utils/problemVisibility';

definePageMeta({
  layout: 'admin',
  middleware: 'admin'
});

const { fetchUser } = useAuth();
const route = useRoute();

const folders = ref([]);
const uncategorizedCount = ref(0);
const foldersLoading = ref(true);
const problems = ref([]);
const loading = ref(false);
const selectedFolder = ref(null);

const showFolderModal = ref(false);
const editingFolderUuid = ref(null);
const folderSubmitting = ref(false);
const folderError = ref('');
const folderForm = ref({ name: '' });

const currentFolderTitle = computed(() => {
  if (selectedFolder.value === 'uncategorized') return '未分類';
  return folders.value.find((f) => f.uuid === selectedFolder.value)?.name || '題庫資料夾';
});

onMounted(async () => {
  await fetchUser();
  await loadFolders();
  const folderParam = route.query.folder;
  if (folderParam) {
    selectFolder(folderParam);
  }
});

async function loadFolders() {
  try {
    foldersLoading.value = true;
    const response = await $fetch('/api/admin/bank-folders/list');
    if (response.status === 'success') {
      folders.value = response.data.folders || [];
      uncategorizedCount.value = response.data.uncategorized_count || 0;
    }
  } catch (error) {
    console.error('載入題庫資料夾失敗:', error);
  } finally {
    foldersLoading.value = false;
  }
}

async function selectFolder(folderUuid) {
  selectedFolder.value = folderUuid;
  navigateTo({ query: { folder: folderUuid } });
  await loadProblems();
}

function goBack() {
  selectedFolder.value = null;
  problems.value = [];
  navigateTo({ query: {} });
  loadFolders();
}

async function loadProblems() {
  if (selectedFolder.value === null) return;
  try {
    loading.value = true;
    const response = await $fetch('/api/admin/problems/list', {
      params: { bank_folder: selectedFolder.value }
    });
    if (response.status === 'success') {
      problems.value = response.data;
    }
  } catch (error) {
    console.error('載入題庫失敗:', error);
  } finally {
    loading.value = false;
  }
}

function openCreateFolder() {
  editingFolderUuid.value = null;
  folderForm.value = { name: '' };
  folderError.value = '';
  showFolderModal.value = true;
}

function openEditFolder(folder) {
  editingFolderUuid.value = folder.uuid;
  folderForm.value = { name: folder.name };
  folderError.value = '';
  showFolderModal.value = true;
}

function closeFolderModal() {
  showFolderModal.value = false;
  folderError.value = '';
}

async function handleSubmitFolder() {
  if (folderSubmitting.value) return;
  folderSubmitting.value = true;
  folderError.value = '';
  try {
    if (editingFolderUuid.value) {
      await $fetch('/api/admin/bank-folders/update', {
        method: 'PUT',
        body: { uuid: editingFolderUuid.value, name: folderForm.value.name }
      });
    } else {
      await $fetch('/api/admin/bank-folders/create', {
        method: 'POST',
        body: { name: folderForm.value.name }
      });
    }
    closeFolderModal();
    await loadFolders();
  } catch (error) {
    folderError.value = error.data?.statusMessage || error.statusMessage || '儲存失敗';
  } finally {
    folderSubmitting.value = false;
  }
}

async function handleDeleteFolder(folder) {
  if (!confirm(`確定刪除資料夾「${folder.name}」？`)) return;
  try {
    await $fetch('/api/admin/bank-folders/delete', {
      method: 'DELETE',
      body: { uuid: folder.uuid }
    });
    await loadFolders();
  } catch (error) {
    alert(error.data?.statusMessage || error.statusMessage || '刪除失敗');
  }
}

async function handleDelete(problem) {
  const used = problem.contest_count > 0
    ? `\n此題目前用於 ${problem.contest_count} 個競賽，刪除後也會一併從那些競賽移除。`
    : '';
  if (!confirm(`確定要從題庫刪除「${problem.title}」嗎？${used}`)) return;

  try {
    await $fetch('/api/admin/problems/delete', {
      method: 'DELETE',
      body: { uuid: problem.uuid }
    });
    await loadProblems();
    await loadFolders();
  } catch (error) {
    alert(error.data?.statusMessage || error.statusMessage || '刪除失敗');
  }
}
</script>
