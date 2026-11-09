<template>
  <div>
    <h1 class="text-blue-600 text-2xl md:text-3xl font-bold mb-2">課程</h1>
    <p class="text-gray-600 mb-6">瀏覽管理員上傳的教材。點選檔案可預覽或下載。</p>

    <div v-if="loading" class="text-gray-500 py-10 text-center">載入教材中…</div>
    <div v-else-if="error" class="text-red-600 py-10 text-center">{{ error }}</div>
    <div v-else-if="materials.length === 0" class="bg-white border border-gray-200 rounded-lg p-10 text-center text-gray-500">
      目前尚無可瀏覽的教材
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div class="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-3">
        <MaterialTreeNode :node="tree" @select="selectMaterial" />
      </div>

      <div class="lg:col-span-3 bg-white border border-gray-200 rounded-lg p-5 min-h-[420px]">
        <div v-if="!selected" class="h-full flex items-center justify-center text-gray-400">
          請從左側樹狀目錄選擇教材
        </div>
        <div v-else>
          <div class="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <h2 class="text-xl font-semibold text-gray-900">{{ selected.title }}</h2>
              <p class="text-sm text-gray-500 mt-1">
                {{ selected.path ? selected.path + ' / ' : '' }}{{ selected.title }}
              </p>
            </div>
            <a
              :href="selected.file"
              target="_blank"
              download
              class="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              下載
            </a>
          </div>

          <ClientOnly v-if="isPdf(selected.file)">
            <PdfViewer :src="selected.file" />
          </ClientOnly>
          <div v-else class="text-center py-16 text-gray-500">
            <font-awesome-icon icon="fa-solid fa-file-lines" class="text-4xl mb-3 text-gray-400" />
            <p class="mb-4">此檔案類型無法直接預覽，請下載後開啟。</p>
            <a
              :href="selected.file"
              target="_blank"
              class="text-blue-600 hover:text-blue-800 underline"
            >
              開啟檔案
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { buildMaterialTree } from '~/utils/materialTree';

const materials = ref([]);
const selected = ref(null);
const loading = ref(true);
const error = ref('');

const tree = computed(() => buildMaterialTree(materials.value));

function isPdf(filePath = '') {
  return String(filePath).toLowerCase().endsWith('.pdf');
}

function selectMaterial(material) {
  selected.value = material;
}

onMounted(async () => {
  try {
    loading.value = true;
    const response = await $fetch('/api/materials/list');
    materials.value = response.data || [];
  } catch (err) {
    error.value = err?.data?.statusMessage || err?.statusMessage || '載入教材失敗';
  } finally {
    loading.value = false;
  }
});
</script>
