<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <div class="flex items-center gap-3">
        <button
          v-if="selectedFolder"
          @click="goBack"
          class="text-blue-600 hover:text-blue-800 cursor-pointer"
        >
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h1 class="text-gray-900 text-2xl md:text-3xl font-bold">
          {{ selectedFolder ? (folderInfo?.name || '競賽題目') : '競賽管理' }}
        </h1>
      </div>
      <div class="flex gap-2">
        <button
          v-if="selectedFolder"
          class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 cursor-pointer"
          @click="openPickFromBank"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
          </svg>
          從題庫選題
        </button>
        <NuxtLink
          v-if="selectedFolder"
          :to="`/admin/problems/create/${selectedFolder}`"
          class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          新增題目
        </NuxtLink>
        <button
          v-if="!selectedFolder"
          @click="showCreateFolderModal = true"
          class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          新增競賽
        </button>
      </div>
    </div>

    <!-- 競賽列表 -->
    <div v-if="!selectedFolder">
      <div v-if="foldersLoading" class="text-center py-12">
        <p class="text-gray-500">載入中...</p>
      </div>
      <div v-else-if="folders.length === 0" class="text-center py-12">
        <p class="text-gray-500">暫無競賽</p>
      </div>
      <div v-else class="bg-white shadow rounded-lg overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">競賽名稱</th>
            <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">可見性</th>
            <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">競賽狀態</th>
            <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">開始時間</th>
            <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">結束時間</th>
            <th class="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr
            v-for="folder in folders"
            :key="folder.id"
            class="hover:bg-gray-50"
          >
            <td class="px-6 py-4 text-sm font-medium">
              <button
                @click="selectFolder(folder.uuid)"
                class="text-blue-600 hover:text-blue-800 text-left cursor-pointer"
              >
                {{ folder.name }}
              </button>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                {{ visibilityLabel(folder.visibility) }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span
                :class="[
                  'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                  isActive(folder.end_time) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                ]"
              >
                {{ isActive(folder.end_time) ? '進行中' : '已結束' }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ formatDateTime(folder.start_time) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ formatDateTime(folder.end_time) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
              <button
                @click="handleEditFolder(folder)"
                class="text-blue-600 hover:text-blue-900 cursor-pointer"
              >
                編輯
              </button>
              <button
                @click="handleDeleteFolder(folder)"
                class="text-red-600 hover:text-red-900 cursor-pointer"
              >
                刪除
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>

    <!-- 題目列表 -->
    <div v-else>
      <div v-if="problemsLoading" class="text-center py-12">
        <p class="text-gray-500">載入中...</p>
      </div>
      <div v-else-if="problems.length === 0" class="text-center py-12">
        <p class="text-gray-500">此競賽暫無題目</p>
      </div>
      <div v-else class="bg-white shadow rounded-lg overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">題號</th>
            <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">標題</th>
            <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">可見性</th>
            <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">內容</th>
            <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">題目主題</th>
            <th class="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr
            v-for="problem in problems"
            :key="problem.id"
            class="hover:bg-gray-50"
          >
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">q{{ problem.questionNo || problem.question_no }}</td>
            <td class="px-6 py-4 text-sm">
              <NuxtLink
                :to="`/problem/detail/${problem.uuid}?folder=${selectedFolder}`"
                class="text-blue-600 hover:text-blue-800"
              >
                {{ problem.title }}
              </NuxtLink>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                {{ visibilityLabel(problem.visibility) }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ problem.content_type === 'pdf' ? 'PDF' : 'HTML' }}
            </td>
            <td class="px-6 py-4">
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="tag in (problem.tags || '').split(',').filter(t => t.trim())"
                  :key="tag"
                  class="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800"
                >
                  {{ tag.trim() }}
                </span>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
              <NuxtLink
                :to="`/admin/problems/edit/${problem.uuid}${selectedFolder ? '?folder=' + selectedFolder : ''}`"
                class="text-blue-600 hover:text-blue-900"
              >
                編輯
              </NuxtLink>
              <button
                @click="handleRemoveFromContest(problem)"
                class="text-red-600 hover:text-red-900 cursor-pointer"
              >
                移出競賽
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>

    <!-- 從題庫選題 -->
    <div
      v-if="showPickModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click="closePickModal"
    >
      <div class="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto" @click.stop>
        <h3 class="text-xl font-semibold mb-4">從題庫選題</h3>
        <p class="text-sm text-gray-500 mb-4">只帶入題目內容，允許語言請在此重新設定。</p>

        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">題號</label>
            <input
              v-model.number="pickForm.question_no"
              type="number"
              min="1"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">允許語言</label>
            <div class="flex flex-wrap gap-3">
              <label v-for="lang in availableLanguages" :key="lang" class="inline-flex items-center gap-1 text-sm">
                <input v-model="pickForm.allowed_languages" type="checkbox" :value="lang" class="rounded" />
                {{ lang }}
              </label>
            </div>
          </div>
        </div>

        <div v-if="bankLoading" class="text-center py-8 text-gray-500">載入題庫中...</div>
        <div v-else-if="availableBankProblems.length === 0" class="text-center py-8 text-gray-500">
          沒有可選題目（題庫為空或皆已加入）
        </div>
        <div v-else class="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-80 overflow-y-auto mb-4">
          <label
            v-for="p in availableBankProblems"
            :key="p.uuid"
            class="flex items-start gap-3 p-3 hover:bg-gray-50 cursor-pointer"
            :class="pickForm.problem_uuid === p.uuid ? 'bg-indigo-50' : ''"
          >
            <input v-model="pickForm.problem_uuid" type="radio" :value="p.uuid" class="mt-1" />
            <div>
              <div class="font-medium text-gray-900">{{ p.title }}</div>
              <div class="text-sm text-gray-500">{{ p.summary }}</div>
              <div class="text-xs text-indigo-600 mt-1">
                {{ p.bank_folder_name || '未分類' }}
              </div>
            </div>
          </label>
        </div>

        <div v-if="pickError" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {{ pickError }}
        </div>

        <div class="flex gap-3">
          <button type="button" class="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg" @click="closePickModal">
            取消
          </button>
          <button
            type="button"
            :disabled="pickSubmitting"
            class="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            @click="handlePickFromBank"
          >
            {{ pickSubmitting ? '加入中...' : '加入競賽' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 新增/編輯競賽模態框 -->
    <div
      v-if="showCreateFolderModal || showEditFolderModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click="closeFolderModal"
    >
      <div class="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 shadow-xl" @click.stop>
        <h3 class="text-xl font-semibold mb-6">{{ showEditFolderModal ? '編輯競賽' : '新增競賽' }}</h3>
        
        <form @submit.prevent="handleSubmitFolder" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">競賽名稱</label>
            <input
              v-model="folderForm.name"
              type="text"
              required
              maxlength="64"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="請輸入競賽名稱"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">開始時間</label>
              <input
                v-model="folderForm.start_time"
                type="datetime-local"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">結束時間</label>
              <input
                v-model="folderForm.end_time"
                type="datetime-local"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <VisibilityFields v-model="folderForm" />

          <div v-if="folderSubmitError" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {{ folderSubmitError }}
          </div>

          <div class="flex gap-3 pt-4">
            <button
              type="button"
              @click="closeFolderModal"
              class="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              :disabled="folderSubmitting"
              class="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {{ folderSubmitting ? '提交中...' : (showEditFolderModal ? '更新' : '創建') }}
            </button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script setup>
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { visibilityLabel } from '~/utils/problemVisibility';
import { SUPPORTED_LANGUAGES } from '~/utils/languages';

dayjs.extend(utc);
dayjs.extend(timezone);

definePageMeta({
  layout: 'admin',
  middleware: 'admin'
});

const { fetchUser } = useAuth();
const route = useRoute();

const folders = ref([]);
const problems = ref([]);
const foldersLoading = ref(true);
const problemsLoading = ref(false);
const selectedFolder = ref(null);
const folderInfo = ref(null);

const showCreateFolderModal = ref(false);
const showEditFolderModal = ref(false);
const folderSubmitting = ref(false);
const folderSubmitError = ref('');

const showPickModal = ref(false);
const bankProblems = ref([]);
const bankLoading = ref(false);
const pickSubmitting = ref(false);
const pickError = ref('');
const availableLanguages = SUPPORTED_LANGUAGES;
const pickForm = ref({
  problem_uuid: '',
  question_no: 1,
  allowed_languages: [...SUPPORTED_LANGUAGES]
});

const availableBankProblems = computed(() => {
  const used = new Set(problems.value.map((p) => p.uuid));
  return bankProblems.value.filter((p) => !used.has(p.uuid));
});

const folderForm = ref({
  name: '',
  start_time: '',
  end_time: '',
  visibility: 'public',
  visibility_users: []
});


onMounted(async () => {
  await fetchUser();
  await loadFolders();
  
  // 檢查是否有 folder 參數
  const folderParam = route.query.folder;
  if (folderParam) {
    selectFolder(folderParam);
  }
});

function formatDateTime(dateTimeStr) {
  if (!dateTimeStr) return '-';
  return dayjs.utc(dateTimeStr).tz('Asia/Taipei').format('YYYY-MM-DD ddd. HH:mm:ss');
}

function isActive(endTime) {
  return dayjs.utc(endTime).tz('Asia/Taipei').isAfter(dayjs());
}

function toLocalDateTime(utcDateTime) {
  return dayjs.utc(utcDateTime).tz('Asia/Taipei').format('YYYY-MM-DDTHH:mm');
}

async function loadFolders() {
  try {
    foldersLoading.value = true;
    const response = await $fetch('/api/admin/folders/list');
    if (response.status === 'success') {
      folders.value = response.data;
    }
  } catch (error) {
    console.error('載入競賽列表失敗:', error);
  } finally {
    foldersLoading.value = false;
  }
}

async function selectFolder(folderUuid) {
  selectedFolder.value = folderUuid;
  
  // 獲取競賽信息
  try {
    const folderRes = await $fetch(`/api/problem/getProblemFolder?uuid=${folderUuid}`);
    if (folderRes.status === 'success' && folderRes.data.length > 0) {
      folderInfo.value = folderRes.data[0];
    }
  } catch (error) {
    console.error('獲取競賽信息失敗:', error);
  }
  
  // 載入題目列表
  await loadProblems();
  
  // 更新 URL
  navigateTo({ query: { folder: folderUuid } });
}

function goBack() {
  selectedFolder.value = null;
  folderInfo.value = null;
  problems.value = [];
  navigateTo({ query: {} });
}

async function loadProblems() {
  if (!selectedFolder.value) return;
  
  try {
    problemsLoading.value = true;
    const response = await $fetch('/api/problem/getFolderProblems', {
      params: { folder: selectedFolder.value }
    });
    if (response.status === 'success') {
      problems.value = response.data;
    }
  } catch (error) {
    console.error('載入題目列表失敗:', error);
  } finally {
    problemsLoading.value = false;
  }
}

function handleEditFolder(folder) {
  folderForm.value = {
    uuid: folder.uuid,
    name: folder.name,
    start_time: toLocalDateTime(folder.start_time),
    end_time: toLocalDateTime(folder.end_time),
    visibility: folder.visibility || 'public',
    visibility_users: folder.visibility_users || []
  };
  showEditFolderModal.value = true;
}

async function handleDeleteFolder(folder) {
  if (!confirm(`確定要刪除競賽「${folder.name}」嗎？此操作無法復原。`)) {
    return;
  }

  try {
    const response = await $fetch('/api/admin/folders/delete', {
      method: 'DELETE',
      body: { uuid: folder.uuid }
    });

    if (response.status === 'success') {
      await loadFolders();
    }
  } catch (error) {
    alert(error.data?.statusMessage || error.statusMessage || '刪除競賽失敗');
  }
}

async function handleSubmitFolder() {
  if (folderSubmitting.value) return;
  
  folderSubmitError.value = '';
  folderSubmitting.value = true;

  try {
    const endpoint = showEditFolderModal.value ? '/api/admin/folders/update' : '/api/admin/folders/create';
    const method = showEditFolderModal.value ? 'PUT' : 'POST';

    // 處理時區問題：將表單的本地時間 (Asia/Taipei) 轉換為 ISO 8601 格式 (UTC)
    // 這樣後端 new Date() 就能正確解析為 UTC 時間
    const payload = { ...folderForm.value };
    if (payload.start_time) {
      payload.start_time = dayjs.tz(payload.start_time, 'Asia/Taipei').toISOString();
    }
    if (payload.end_time) {
      payload.end_time = dayjs.tz(payload.end_time, 'Asia/Taipei').toISOString();
    }

    const response = await $fetch(endpoint, {
      method,
      body: payload
    });

    if (response.status === 'success') {
      closeFolderModal();
      await loadFolders();
    }
  } catch (error) {
    folderSubmitError.value = error.data?.statusMessage || error.statusMessage || '提交失敗';
  } finally {
    folderSubmitting.value = false;
  }
}

function closeFolderModal() {
  showCreateFolderModal.value = false;
  showEditFolderModal.value = false;
  folderSubmitError.value = '';
  folderForm.value = {
    name: '',
    start_time: '',
    end_time: '',
    visibility: 'public',
    visibility_users: []
  };
}


async function handleRemoveFromContest(problem) {
  if (!confirm(`確定要從競賽移出「${problem.title}」嗎？題庫仍會保留此題。`)) {
    return;
  }

  try {
    const response = await $fetch('/api/admin/folder-problems/remove', {
      method: 'DELETE',
      body: {
        folder: selectedFolder.value,
        problem_uuid: problem.uuid
      }
    });

    if (response.status === 'success') {
      await loadProblems();
    }
  } catch (error) {
    alert(error.data?.statusMessage || error.statusMessage || '移出競賽失敗');
  }
}

async function openPickFromBank() {
  pickError.value = '';
  pickForm.value = {
    problem_uuid: '',
    question_no: (problems.value.reduce((max, p) => Math.max(max, p.questionNo || p.question_no || 0), 0) || 0) + 1,
    allowed_languages: [...SUPPORTED_LANGUAGES]
  };
  showPickModal.value = true;
  bankLoading.value = true;
  try {
    const response = await $fetch('/api/admin/problems/list');
    if (response.status === 'success') {
      bankProblems.value = response.data || [];
    }
  } catch (error) {
    pickError.value = error.data?.statusMessage || '載入題庫失敗';
  } finally {
    bankLoading.value = false;
  }
}

function closePickModal() {
  showPickModal.value = false;
  pickError.value = '';
}

async function handlePickFromBank() {
  if (!pickForm.value.problem_uuid) {
    pickError.value = '請選擇一題';
    return;
  }
  if (!pickForm.value.question_no) {
    pickError.value = '請填寫題號';
    return;
  }
  if (!pickForm.value.allowed_languages.length) {
    pickError.value = '請至少選擇一種語言';
    return;
  }

  pickSubmitting.value = true;
  pickError.value = '';
  try {
    await $fetch('/api/admin/folder-problems/add', {
      method: 'POST',
      body: {
        folder: selectedFolder.value,
        problem_uuid: pickForm.value.problem_uuid,
        question_no: pickForm.value.question_no,
        allowed_languages: pickForm.value.allowed_languages
      }
    });
    closePickModal();
    await loadProblems();
  } catch (error) {
    pickError.value = error.data?.statusMessage || error.statusMessage || '加入失敗';
  } finally {
    pickSubmitting.value = false;
  }
}

</script>
