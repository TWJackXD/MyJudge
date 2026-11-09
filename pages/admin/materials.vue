<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-gray-900 text-2xl md:text-3xl font-bold">教材管理</h1>
        <p class="text-sm text-gray-500 mt-1">上傳教材並以資料夾路徑組成課程樹狀目錄</p>
      </div>
      <button
        @click="openCreateModal"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
      >
        <font-awesome-icon icon="fa-solid fa-plus" />
        上傳教材
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="bg-white rounded-lg shadow p-6">
        <div class="text-sm text-gray-600 mb-1">總教材數</div>
        <div class="text-2xl font-bold text-gray-900">{{ materials.length }}</div>
      </div>
      <div class="bg-white rounded-lg shadow p-6">
        <div class="text-sm text-gray-600 mb-1">公開</div>
        <div class="text-2xl font-bold text-green-600">{{ publicCount }}</div>
      </div>
      <div class="bg-white rounded-lg shadow p-6">
        <div class="text-sm text-gray-600 mb-1">受限／私密</div>
        <div class="text-2xl font-bold text-orange-600">{{ restrictedCount }}</div>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">標題</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">路徑</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">可見性</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">上傳者</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">上傳時間</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="material in materials" :key="material.uuid" class="hover:bg-gray-50">
            <td class="px-6 py-4">
              <div class="text-sm font-medium text-gray-900">{{ material.title }}</div>
            </td>
            <td class="px-6 py-4 text-sm text-gray-500">
              {{ material.path || '（根目錄）' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800">
                {{ visibilityLabel(material.visibility) }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ material.uploader_name || 'Unknown' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ formatDate(material.uploaded_at) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
              <button @click="viewMaterial(material)" class="text-indigo-600 hover:text-indigo-900">預覽</button>
              <button @click="editMaterial(material)" class="text-blue-600 hover:text-blue-900">編輯</button>
              <button @click="deleteMaterial(material)" class="text-red-600 hover:text-red-900">刪除</button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="materials.length === 0" class="text-center py-12 text-gray-600">
        暫無教材
      </div>
    </div>

    <div
      v-if="showModal"
      @click.self="closeModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div class="flex items-center justify-between p-6 border-b">
          <h2 class="text-2xl font-bold text-gray-900">
            {{ editingMaterial ? '編輯教材' : '上傳教材' }}
          </h2>
          <button @click="closeModal" class="text-gray-400 hover:text-gray-600">
            <font-awesome-icon icon="fa-solid fa-xmark" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-6">
          <form @submit.prevent="saveMaterial" class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                標題 <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.title"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="例：Java 基礎教學"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                資料夾路徑
              </label>
              <input
                v-model="form.path"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="例：Java/基礎 （空白表示根目錄）"
              />
              <p class="text-xs text-gray-500 mt-1">使用 `/` 分隔層級，課程頁會依此組成樹狀目錄。</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                教材檔案 <span class="text-red-500">*</span>
              </label>

              <div v-if="editingMaterial && form.file" class="mb-3 p-3 bg-gray-50 rounded-lg flex items-center justify-between gap-3">
                <span class="text-sm text-gray-600 truncate">當前檔案：{{ getFilename(form.file) }}</span>
                <a :href="form.file" target="_blank" class="text-blue-600 hover:text-blue-800 text-sm whitespace-nowrap">檢視</a>
              </div>

              <input
                ref="fileInput"
                type="file"
                accept=".pdf,.docx,.doc,.pptx,.ppt,.txt,.md"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                :required="!editingMaterial"
                @change="handleFileSelect"
              />
              <p class="mt-1 text-xs text-gray-500">支援 PDF / Word / PowerPoint / 文字檔，最大 50MB</p>

              <div v-if="uploading" class="mt-3">
                <div class="flex items-center">
                  <div class="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                    <div class="bg-blue-600 h-2 rounded-full transition-all" :style="{ width: uploadProgress + '%' }"></div>
                  </div>
                  <span class="text-sm text-gray-600">{{ uploadProgress }}%</span>
                </div>
              </div>
            </div>

            <VisibilityFields v-model="form" />

            <div class="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                @click="closeModal"
                class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {{ saving ? '儲存中...' : '儲存' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <div
      v-if="previewMaterial"
      @click.self="previewMaterial = null"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div class="flex items-center justify-between p-6 border-b">
          <h2 class="text-2xl font-bold text-gray-900">{{ previewMaterial.title }}</h2>
          <button @click="previewMaterial = null" class="text-gray-400 hover:text-gray-600">
            <font-awesome-icon icon="fa-solid fa-xmark" />
          </button>
        </div>
        <div class="flex-1 overflow-y-auto p-6">
          <ClientOnly v-if="previewMaterial.file.toLowerCase().endsWith('.pdf')">
            <PdfViewer :src="previewMaterial.file" />
          </ClientOnly>
          <div v-else class="text-center py-12">
            <p class="text-gray-600 mb-4">此檔案類型無法直接預覽</p>
            <a
              :href="previewMaterial.file"
              download
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block"
            >
              下載檔案
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { v4 as uuidv4 } from 'uuid';
import { visibilityLabel } from '~/utils/problemVisibility';

definePageMeta({
  middleware: 'admin',
  layout: 'admin'
});

const materials = ref([]);
const showModal = ref(false);
const editingMaterial = ref(null);
const previewMaterial = ref(null);
const saving = ref(false);
const uploading = ref(false);
const uploadProgress = ref(0);
const fileInput = ref(null);
const selectedFile = ref(null);

const form = ref({
  title: '',
  path: '',
  file: '',
  visibility: 'public',
  visibility_users: []
});

const publicCount = computed(() => materials.value.filter((m) => m.visibility === 'public').length);
const restrictedCount = computed(() => materials.value.filter((m) => m.visibility !== 'public').length);

async function fetchMaterials() {
  try {
    const response = await $fetch('/api/admin/materials');
    materials.value = response.materials || [];
  } catch (error) {
    console.error('Failed to fetch materials:', error);
    alert('載入教材失敗：' + (error.data?.statusMessage || error.message));
  }
}

function openCreateModal() {
  editingMaterial.value = null;
  form.value = {
    title: '',
    path: '',
    file: '',
    visibility: 'public',
    visibility_users: []
  };
  selectedFile.value = null;
  showModal.value = true;
}

function editMaterial(material) {
  editingMaterial.value = material;
  form.value = {
    title: material.title,
    path: material.path || '',
    file: material.file,
    visibility: material.visibility || 'public',
    visibility_users: material.visibility_users || []
  };
  selectedFile.value = null;
  showModal.value = true;
}

function viewMaterial(material) {
  previewMaterial.value = material;
}

function closeModal() {
  showModal.value = false;
  editingMaterial.value = null;
  selectedFile.value = null;
  if (fileInput.value) fileInput.value.value = '';
}

function handleFileSelect(event) {
  selectedFile.value = event.target.files?.[0] || null;
}

function getFilename(path) {
  if (!path) return '';
  return path.split('/').pop();
}

async function uploadFile() {
  if (!selectedFile.value) return form.value.file;

  uploading.value = true;
  uploadProgress.value = 0;

  try {
    const formData = new FormData();
    formData.append('file', selectedFile.value);

    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) uploadProgress.value += 10;
    }, 100);

    const response = await $fetch('/api/admin/materials/upload', {
      method: 'POST',
      body: formData
    });

    clearInterval(progressInterval);
    uploadProgress.value = 100;

    if (response.success) return response.data.path;
    throw new Error(response.message || '上傳失敗');
  } catch (error) {
    throw new Error('檔案上傳失敗：' + (error.data?.statusMessage || error.message));
  } finally {
    uploading.value = false;
    uploadProgress.value = 0;
  }
}

async function saveMaterial() {
  try {
    saving.value = true;

    let filePath = form.value.file;
    if (selectedFile.value) {
      filePath = await uploadFile();
    }

    if (!form.value.title) {
      alert('請輸入教材標題');
      return;
    }

    if (!filePath) {
      alert('請選擇教材檔案');
      return;
    }

    const data = {
      title: form.value.title,
      path: form.value.path,
      file: filePath,
      visibility: form.value.visibility,
      visibility_users: form.value.visibility_users,
      uuid: editingMaterial.value ? editingMaterial.value.uuid : uuidv4()
    };

    const url = editingMaterial.value
      ? `/api/admin/materials/${editingMaterial.value.uuid}`
      : '/api/admin/materials';

    await $fetch(url, {
      method: editingMaterial.value ? 'PUT' : 'POST',
      body: data
    });

    alert(editingMaterial.value ? '教材已更新' : '教材已上傳');
    closeModal();
    await fetchMaterials();
  } catch (error) {
    console.error('Save material error:', error);
    alert('儲存失敗：' + (error.data?.statusMessage || error.message));
  } finally {
    saving.value = false;
  }
}

async function deleteMaterial(material) {
  if (!confirm(`確定要刪除「${material.title}」嗎？`)) return;

  try {
    await $fetch(`/api/admin/materials/${material.uuid}`, {
      method: 'DELETE'
    });
    alert('教材已刪除');
    await fetchMaterials();
  } catch (error) {
    console.error('Delete material error:', error);
    alert('刪除失敗');
  }
}

function formatDate(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

onMounted(fetchMaterials);
</script>
