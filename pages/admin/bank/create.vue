<template>
  <div>
    <div class="flex items-center gap-3 mb-6">
      <NuxtLink to="/admin/bank" class="text-blue-600 hover:text-blue-800">
        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </NuxtLink>
      <h1 class="text-gray-900 text-2xl md:text-3xl font-bold">新增題庫題目</h1>
    </div>

    <div class="bg-white shadow rounded-lg p-8">
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
            placeholder="例如：迴圈,陣列,基礎"
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
            :placeholder="inputPlaceholder"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">輸出測資（一行一組） <span class="text-red-500">*</span></label>
          <textarea
            v-model="form.output"
            required
            rows="6"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
            :placeholder="outputPlaceholder"
          />
        </div>

        <p class="text-sm text-gray-500">題庫題目不設定允許語言；加入競賽時再指定語言。</p>

        <div v-if="submitError" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {{ submitError }}
        </div>

        <div class="flex gap-3 pt-4 border-t border-gray-200">
          <NuxtLink
            :to="cancelUrl"
            class="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 text-center"
          >
            取消
          </NuxtLink>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {{ isSubmitting ? '創建中...' : '加入題庫' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
});

const inputPlaceholder = '5 2\n10 5\n1,2,3';
const outputPlaceholder = '7\n15\n6';

const route = useRoute();
const router = useRouter();
const { fetchUser } = useAuth();
const isSubmitting = ref(false);
const submitError = ref('');
const bankFolders = ref([]);

const form = ref({
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

const cancelUrl = computed(() => {
  if (form.value.bank_folder) {
    return `/admin/bank?folder=${form.value.bank_folder}`;
  }
  return '/admin/bank';
});

onMounted(async () => {
  await fetchUser();
  if (route.query.bank_folder) {
    form.value.bank_folder = String(route.query.bank_folder);
  }
  try {
    const response = await $fetch('/api/admin/bank-folders/list');
    if (response.status === 'success') {
      bankFolders.value = response.data.folders || [];
    }
  } catch (error) {
    console.error('載入資料夾失敗:', error);
  }
});

async function handleSubmit() {
  if (isSubmitting.value) return;
  submitError.value = '';
  isSubmitting.value = true;
  try {
    const payload = {
      ...form.value,
      bank_folder: form.value.bank_folder || null
    };
    const response = await $fetch('/api/admin/problems/create', {
      method: 'POST',
      body: payload
    });
    if (response.status === 'success') {
      router.push(cancelUrl.value);
    }
  } catch (error) {
    submitError.value = error.data?.statusMessage || error.statusMessage || '提交失敗';
  } finally {
    isSubmitting.value = false;
  }
}
</script>
