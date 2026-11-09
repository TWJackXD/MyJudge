<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <div class="flex items-center gap-3">
        <NuxtLink
          :to="`/admin/problems?folder=${folder || ''}`"
          class="text-blue-600 hover:text-blue-800 cursor-pointer"
        >
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </NuxtLink>
        <h1 class="text-gray-900 text-2xl md:text-3xl font-bold">新增題目到競賽</h1>
      </div>
    </div>

    <div class="bg-white shadow rounded-lg p-8">
      <p class="text-sm text-gray-500 mb-6">新建題目會自動加入題庫，並同時加入此競賽。</p>
      <form class="space-y-6" @submit.prevent="handleSubmitProblem">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">題號 <span class="text-red-500">*</span></label>
            <input
              v-model.number="problemForm.question_no"
              type="number"
              required
              min="1"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">所屬競賽</label>
            <input
              type="text"
              :value="folderName || folder"
              disabled
              class="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
            />
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
            placeholder="請輸入題目標題"
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
            placeholder="請輸入題目摘要"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">標籤（以逗號分隔）</label>
          <input
            v-model="problemForm.tags"
            type="text"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="例如：迴圈,陣列,基礎"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">此競賽允許語言</label>
          <div class="flex flex-wrap gap-4">
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
          <p class="text-xs text-gray-500 mt-1">僅套用到此競賽，不會寫進題庫。</p>
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
            :to="`/admin/problems?folder=${folder || ''}`"
            class="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors text-center"
          >
            取消
          </NuxtLink>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {{ isSubmitting ? '創建中...' : '建立並加入競賽' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { SUPPORTED_LANGUAGES } from '~/utils/languages';

const inputPlaceholder = '5 2\n10 5\n1,2,3';
const outputPlaceholder = '7\n15\n6';

definePageMeta({
  layout: 'admin',
  middleware: 'admin'
});

const route = useRoute();
const router = useRouter();
const { fetchUser } = useAuth();

const folder = ref(route.params.folder || '');
const folderName = ref('');
const isSubmitting = ref(false);
const submitError = ref('');
const availableLanguages = SUPPORTED_LANGUAGES;

const problemForm = ref({
  question_no: 1,
  title: '',
  summary: '',
  description: '',
  tags: '',
  input: '',
  output: '',
  folder: '',
  allowed_languages: [...SUPPORTED_LANGUAGES],
  content_type: 'html',
  pdf_url: '',
  visibility: 'public',
  visibility_users: []
});

onMounted(async () => {
  if (route.params.folder) {
    folder.value = route.params.folder;
    problemForm.value.folder = route.params.folder;
  }
  await fetchUser();
  try {
    const folderRes = await $fetch(`/api/problem/getProblemFolder?uuid=${folder.value}`);
    if (folderRes.status === 'success' && folderRes.data?.[0]) {
      folderName.value = folderRes.data[0].name;
    }
  } catch {
    // ignore
  }
});

async function handleSubmitProblem() {
  if (isSubmitting.value) return;
  submitError.value = '';
  isSubmitting.value = true;

  try {
    const response = await $fetch('/api/admin/problems/create', {
      method: 'POST',
      body: {
        ...problemForm.value,
        folder: folder.value
      }
    });

    if (response.status === 'success') {
      router.push(`/admin/problems?folder=${folder.value}`);
    }
  } catch (error) {
    console.error('創建題目失敗:', error);
    submitError.value = error.data?.statusMessage || error.statusMessage || '提交失敗';
  } finally {
    isSubmitting.value = false;
  }
}
</script>
