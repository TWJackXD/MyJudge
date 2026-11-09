<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <div class="flex items-center gap-3">
        <NuxtLink :to="backUrl" class="text-blue-600 hover:text-blue-800 cursor-pointer">
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </NuxtLink>
        <h1 class="text-gray-900 text-2xl md:text-3xl font-bold">
          {{ contestFolder ? '編輯競賽題目' : '編輯題目' }}
        </h1>
      </div>
    </div>

    <div v-if="loading" class="bg-white shadow rounded-lg p-8 text-center">
      <p class="text-gray-500">載入中...</p>
    </div>

    <div v-else class="bg-white shadow rounded-lg p-8">
      <form class="space-y-6" @submit.prevent="handleSubmitProblem">
        <div v-if="contestFolder" class="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">此競賽題號 <span class="text-red-500">*</span></label>
            <input
              v-model.number="problemForm.question_no"
              type="number"
              required
              min="1"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">此競賽允許語言</label>
            <div class="flex flex-wrap gap-4 mt-2">
              <div v-for="lang in availableLanguages" :key="lang" class="flex items-center">
                <input
                  :id="'lang-' + lang"
                  v-model="problemForm.allowed_languages"
                  type="checkbox"
                  :value="lang"
                  class="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label :for="'lang-' + lang" class="ml-2 block text-sm text-gray-900">{{ lang }}</label>
              </div>
            </div>
            <p class="text-xs text-gray-500 mt-1">僅覆寫此競賽設定，不影響題庫。</p>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">標題 <span class="text-red-500">*</span></label>
          <input
            v-model="problemForm.title"
            type="text"
            required
            maxlength="32"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">摘要 <span class="text-red-500">*</span></label>
          <input
            v-model="problemForm.summary"
            type="text"
            required
            maxlength="64"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">標籤（以逗號分隔）</label>
          <input
            v-model="problemForm.tags"
            type="text"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <VisibilityFields v-model="problemForm" />
        <ProblemContentEditor v-model="problemForm" />

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">輸入測資（一行一組）</label>
          <textarea
            v-model="problemForm.input"
            rows="6"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
            :placeholder="inputPlaceholder"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">輸出測資（一行一組） <span class="text-red-500">*</span></label>
          <textarea
            v-model="problemForm.output"
            required
            rows="6"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
            :placeholder="outputPlaceholder"
          />
        </div>

        <div v-if="submitError" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {{ submitError }}
        </div>

        <div class="flex gap-3 pt-4 border-t border-gray-200">
          <NuxtLink
            :to="backUrl"
            class="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors text-center"
          >
            取消
          </NuxtLink>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {{ isSubmitting ? '更新中...' : '更新題目' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { SUPPORTED_LANGUAGES } from '~/utils/languages';
import { toEditorTestCases } from '~/utils/testCases';

const inputPlaceholder = '5 2\n10 5\n1,2,3';
const outputPlaceholder = '7\n15\n6';

definePageMeta({
  layout: 'admin',
  middleware: 'admin'
});

const { fetchUser } = useAuth();
const route = useRoute();
const router = useRouter();

const loading = ref(true);
const isSubmitting = ref(false);
const submitError = ref('');
const availableLanguages = SUPPORTED_LANGUAGES;
const contestFolder = computed(() => route.query.folder || '');

const problemForm = ref({
  uuid: '',
  question_no: 1,
  title: '',
  summary: '',
  description: '',
  tags: '',
  input: '',
  output: '',
  allowed_languages: [],
  content_type: 'html',
  pdf_url: '',
  visibility: 'public',
  visibility_users: []
});

const backUrl = computed(() => {
  if (contestFolder.value) {
    return `/admin/problems?folder=${contestFolder.value}`;
  }
  return '/admin/bank';
});

onMounted(async () => {
  await fetchUser();
  await loadProblemDetail();
});

async function loadProblemDetail() {
  const uuid = route.params.uuid;
  if (!uuid) {
    router.push(backUrl.value);
    return;
  }

  try {
    loading.value = true;
    const body = { uuid };
    if (contestFolder.value) body.folder = contestFolder.value;

    const detailResponse = await $fetch('/api/problem/getProblemDetail', {
      method: 'POST',
      body
    });

    if (detailResponse?.status === 'success' && detailResponse.data) {
      const data = detailResponse.data;
      problemForm.value = {
        uuid: data.uuid,
        question_no: data.questionNo || 1,
        title: data.title || '',
        summary: data.summary || '',
        description: data.description || '',
        tags: data.tags || '',
        input: toEditorTestCases(data.input),
        output: toEditorTestCases(data.output),
        allowed_languages: data.allowed_languages || [...SUPPORTED_LANGUAGES],
        content_type: data.content_type || 'html',
        pdf_url: data.pdf_url || '',
        visibility: data.visibility || 'public',
        visibility_users: data.visibility_users || []
      };
    } else {
      alert('題目不存在');
      router.push(backUrl.value);
    }
  } catch (error) {
    console.error('獲取題目詳細資料失敗:', error);
    alert(error.data?.statusMessage || '無法獲取題目詳細資料');
    router.push(backUrl.value);
  } finally {
    loading.value = false;
  }
}

async function handleSubmitProblem() {
  if (isSubmitting.value) return;
  submitError.value = '';
  isSubmitting.value = true;

  try {
    const body = { ...problemForm.value };
    if (contestFolder.value) {
      body.folder = contestFolder.value;
    }

    const response = await $fetch('/api/admin/problems/update', {
      method: 'PUT',
      body
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
