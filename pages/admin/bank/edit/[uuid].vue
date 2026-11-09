<template>
  <div>
    <div class="flex items-center gap-3 mb-6">
      <NuxtLink :to="backUrl" class="text-blue-600 hover:text-blue-800">
        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </NuxtLink>
      <h1 class="text-gray-900 text-2xl md:text-3xl font-bold">編輯題庫題目</h1>
    </div>

    <div v-if="loading" class="bg-white shadow rounded-lg p-8 text-center">
      <p class="text-gray-500">載入中...</p>
    </div>

    <div v-else class="bg-white shadow rounded-lg p-8">
      <form class="space-y-6" @submit.prevent="handleSubmit">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">題庫資料夾</label>
          <select
            v-model="form.bank_folder"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">未分類</option>
            <option v-for="folder in bankFolders" :key="folder.uuid" :value="folder.uuid">
              {{ folder.name }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">標題 <span class="text-red-500">*</span></label>
          <input
            v-model="form.title"
            type="text"
            required
            maxlength="64"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">摘要 <span class="text-red-500">*</span></label>
          <input
            v-model="form.summary"
            type="text"
            required
            maxlength="64"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">標籤（以逗號分隔）</label>
          <input
            v-model="form.tags"
            type="text"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <VisibilityFields v-model="form" />
        <ProblemContentEditor v-model="form" />

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">輸入測資（一行一組）</label>
          <textarea
            v-model="form.input"
            rows="6"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">輸出測資（一行一組） <span class="text-red-500">*</span></label>
          <textarea
            v-model="form.output"
            required
            rows="6"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <div v-if="submitError" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {{ submitError }}
        </div>

        <div class="flex gap-3 pt-4 border-t border-gray-200">
          <NuxtLink
            :to="backUrl"
            class="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 text-center"
          >
            取消
          </NuxtLink>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {{ isSubmitting ? '更新中...' : '更新題目' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { toEditorTestCases } from '~/utils/testCases';

definePageMeta({
  layout: 'admin',
  middleware: 'admin'
});

const route = useRoute();
const router = useRouter();
const { fetchUser } = useAuth();
const loading = ref(true);
const isSubmitting = ref(false);
const submitError = ref('');

const bankFolders = ref([]);
const form = ref({
  uuid: '',
  bank_folder: '',
  title: '',
  summary: '',
  description: '',
  tags: '',
  input: '',
  output: '',
  content_type: 'html',
  pdf_url: '',
  visibility: 'public',
  visibility_users: []
});

const backUrl = computed(() => {
  if (form.value.bank_folder) {
    return `/admin/bank?folder=${form.value.bank_folder}`;
  }
  return '/admin/bank';
});

onMounted(async () => {
  await fetchUser();
  await Promise.all([loadFolders(), loadProblem()]);
});

async function loadFolders() {
  try {
    const response = await $fetch('/api/admin/bank-folders/list');
    if (response.status === 'success') {
      bankFolders.value = response.data.folders || [];
    }
  } catch (error) {
    console.error('載入資料夾失敗:', error);
  }
}

async function loadProblem() {
  const uuid = route.params.uuid;
  try {
    loading.value = true;
    const response = await $fetch('/api/problem/getProblemDetail', {
      method: 'POST',
      body: { uuid }
    });
    if (response.status === 'success') {
      const data = response.data;
      form.value = {
        uuid: data.uuid,
        bank_folder: data.bank_folder || '',
        title: data.title || '',
        summary: data.summary || '',
        description: data.description || '',
        tags: data.tags || '',
        input: toEditorTestCases(data.input),
        output: toEditorTestCases(data.output),
        content_type: data.content_type || 'html',
        pdf_url: data.pdf_url || '',
        visibility: data.visibility || 'public',
        visibility_users: data.visibility_users || []
      };
    } else {
      alert('題目不存在');
      router.push('/admin/bank');
    }
  } catch (error) {
    alert(error.data?.statusMessage || '無法載入題目');
    router.push('/admin/bank');
  } finally {
    loading.value = false;
  }
}

async function handleSubmit() {
  if (isSubmitting.value) return;
  submitError.value = '';
  isSubmitting.value = true;
  try {
    const response = await $fetch('/api/admin/problems/update', {
      method: 'PUT',
      body: {
        ...form.value,
        bank_folder: form.value.bank_folder || null
      }
    });
    if (response.status === 'success') {
      router.push(backUrl.value);
    }
  } catch (error) {
    submitError.value = error.data?.statusMessage || error.statusMessage || '更新失敗';
  } finally {
    isSubmitting.value = false;
  }
}
</script>
