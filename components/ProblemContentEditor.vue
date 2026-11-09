<template>
  <div class="space-y-6">
    <VisibilityFields :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" />

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">題目內容格式 <span class="text-red-500">*</span></label>
      <div class="flex gap-4">
        <label class="inline-flex items-center gap-2 text-sm text-gray-700">
          <input
            type="radio"
            value="html"
            :checked="modelValue.content_type === 'html'"
            @change="updateField('content_type', 'html')"
          />
          富文字（HTML）
        </label>
        <label class="inline-flex items-center gap-2 text-sm text-gray-700">
          <input
            type="radio"
            value="pdf"
            :checked="modelValue.content_type === 'pdf'"
            @change="updateField('content_type', 'pdf')"
          />
          PDF（PDF.js，可選取文字）
        </label>
      </div>
    </div>

    <div v-if="modelValue.content_type === 'html'">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        題目描述（支援 HTML、MathJax 和代碼塊）
        <span class="text-red-500">*</span>
      </label>
      <ClientOnly>
        <RichTextEditor
          :model-value="modelValue.description"
          placeholder="請輸入題目描述..."
          @update:model-value="updateField('description', $event)"
        />
        <template #fallback>
          <textarea
            :value="modelValue.description"
            rows="10"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg"
            placeholder="正在載入編輯器..."
            disabled
          ></textarea>
        </template>
      </ClientOnly>
    </div>

    <div v-else class="space-y-3">
      <label class="block text-sm font-medium text-gray-700">
        題目 PDF
        <span class="text-red-500">*</span>
      </label>

      <input
        ref="fileInput"
        type="file"
        accept="application/pdf,.pdf"
        class="w-full px-3 py-2 border border-gray-300 rounded-lg"
        @change="handlePdfSelect"
      />

      <p v-if="uploading" class="text-sm text-blue-600">上傳中… {{ uploadProgress }}%</p>
      <p v-if="uploadError" class="text-sm text-red-600">{{ uploadError }}</p>

      <div v-if="modelValue.pdf_url" class="p-3 bg-gray-50 rounded-lg text-sm text-gray-700 flex items-center justify-between gap-3">
        <span class="truncate">目前檔案：{{ modelValue.pdf_url }}</span>
        <a :href="modelValue.pdf_url" target="_blank" class="text-blue-600 hover:text-blue-800 whitespace-nowrap">開啟</a>
      </div>

      <ClientOnly>
        <PdfViewer v-if="modelValue.pdf_url" :src="modelValue.pdf_url" />
      </ClientOnly>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['update:modelValue']);

const fileInput = ref(null);
const uploading = ref(false);
const uploadProgress = ref(0);
const uploadError = ref('');

function updateField(key, value) {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: value
  });
}

async function handlePdfSelect(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  uploading.value = true;
  uploadProgress.value = 0;
  uploadError.value = '';

  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await $fetch('/api/admin/problems/upload-pdf', {
      method: 'POST',
      body: formData
    });

    if (response.status === 'success') {
      emit('update:modelValue', {
        ...props.modelValue,
        content_type: 'pdf',
        pdf_url: response.data.path
      });
      uploadProgress.value = 100;
    }
  } catch (error) {
    uploadError.value = error.data?.statusMessage || error.statusMessage || 'PDF 上傳失敗';
  } finally {
    uploading.value = false;
    if (fileInput.value) fileInput.value.value = '';
  }
}
</script>
