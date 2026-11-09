<template>
  <div
    ref="viewerRef"
    class="pdf-viewer w-full"
    :class="fillHeight ? 'h-full min-h-0 flex flex-col' : ''"
  >
    <div v-if="loading" class="text-center py-10 text-gray-500">載入 PDF 中…</div>
    <div v-else-if="error" class="text-center py-10 text-red-600">
      <p>{{ error }}</p>
      <a
        v-if="src"
        :href="src"
        target="_blank"
        class="inline-block mt-3 text-blue-600 hover:text-blue-800 underline text-sm"
      >
        改以下載／新分頁開啟
      </a>
    </div>

    <div v-else class="space-y-4" :class="fillHeight ? 'flex-1 min-h-0 flex flex-col' : ''">
      <div class="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600 shrink-0">
        <span>共 {{ pageCount }} 頁</span>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 cursor-pointer"
            title="符合寬度"
            @click="fitToWidth"
          >
            Fit
          </button>
          <button
            type="button"
            class="px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 cursor-pointer"
            @click="zoomOut"
          >
            −
          </button>
          <span class="min-w-14 text-center">{{ Math.round(scale * 100) }}%</span>
          <button
            type="button"
            class="px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 cursor-pointer"
            @click="zoomIn"
          >
            +
          </button>
        </div>
      </div>

      <!-- 不自建捲軸，交給外層題目區單一 overflow -->
      <div
        ref="pagesRef"
        class="pdf-pages w-full space-y-4 overflow-visible"
        :class="fillHeight ? 'flex-1' : ''"
      ></div>
    </div>
  </div>
</template>

<script setup>
import '~/assets/css/pdf-text-layer.css';

const props = defineProps({
  src: {
    type: String,
    required: true
  },
  fillHeight: {
    type: Boolean,
    default: false
  }
});

const loading = ref(true);
const error = ref('');
const pageCount = ref(0);
const scale = ref(1);
const viewerRef = ref(null);
const pagesRef = ref(null);

let pdfjs = null;
let pdfDoc = null;
let renderToken = 0;
let basePageWidth = 0;
let resizeObserver = null;
let fitMode = true;

watch(() => props.src, () => {
  loadPdf();
});

watch(scale, async () => {
  if (pdfDoc) {
    await renderAllPages();
  }
});

onMounted(() => {
  loadPdf();

  if (process.client && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      if (fitMode && pdfDoc) {
        fitToWidth();
      }
    });
    if (viewerRef.value) {
      resizeObserver.observe(viewerRef.value);
    }
  }
});

onBeforeUnmount(() => {
  pdfDoc = null;
  renderToken += 1;
  resizeObserver?.disconnect();
});

function zoomIn() {
  fitMode = false;
  scale.value = Math.min(3, Number((scale.value + 0.1).toFixed(2)));
}

function zoomOut() {
  fitMode = false;
  scale.value = Math.max(0.4, Number((scale.value - 0.1).toFixed(2)));
}

function getContainerWidth() {
  return Math.max(
    280,
    (pagesRef.value?.clientWidth || viewerRef.value?.clientWidth || 0) - 2
  );
}

async function fitToWidth() {
  if (!pdfDoc) return;
  fitMode = true;

  if (!basePageWidth) {
    const page = await pdfDoc.getPage(1);
    basePageWidth = page.getViewport({ scale: 1 }).width;
  }

  const nextScale = getContainerWidth() / basePageWidth;
  const rounded = Math.max(0.4, Math.min(3, Number(nextScale.toFixed(3))));

  if (Math.abs(rounded - scale.value) < 0.005) {
    await renderAllPages();
    return;
  }

  scale.value = rounded;
}

function resolvePdfUrl(src) {
  if (!src) return '';
  if (/^https?:\/\//i.test(src) || src.startsWith('blob:') || src.startsWith('data:')) {
    return src;
  }
  if (process.client) {
    return new URL(src, window.location.origin).toString();
  }
  return src;
}

async function ensurePdfJs() {
  if (pdfjs) return pdfjs;
  const mod = await import('pdfjs-dist');
  mod.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs?v=${mod.version || '1'}`;
  pdfjs = mod;
  return pdfjs;
}

async function loadPdf() {
  const token = ++renderToken;
  loading.value = true;
  error.value = '';
  pageCount.value = 0;
  pdfDoc = null;
  basePageWidth = 0;
  fitMode = true;

  if (!props.src) {
    loading.value = false;
    error.value = '未提供 PDF 檔案';
    return;
  }

  try {
    const lib = await ensurePdfJs();
    const url = resolvePdfUrl(props.src);
    const loadingTask = lib.getDocument({
      url,
      withCredentials: false
    });

    const doc = await loadingTask.promise;
    if (token !== renderToken) return;

    pdfDoc = doc;
    pageCount.value = doc.numPages;

    const firstPage = await doc.getPage(1);
    basePageWidth = firstPage.getViewport({ scale: 1 }).width;

    loading.value = false;
    await nextTick();

    if (viewerRef.value && resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver.observe(viewerRef.value);
    }

    await fitToWidth();
  } catch (err) {
    if (token !== renderToken) return;
    console.error('PDF 載入失敗:', err);
    loading.value = false;
    error.value = `PDF 載入失敗：${err?.message || '請確認檔案是否存在'}`;
  }
}

async function renderAllPages(token = renderToken) {
  if (!pdfDoc || !pagesRef.value || !pdfjs) return;

  pagesRef.value.innerHTML = '';

  for (let pageNumber = 1; pageNumber <= pdfDoc.numPages; pageNumber += 1) {
    if (token !== renderToken) return;

    const page = await pdfDoc.getPage(pageNumber);
    const viewport = page.getViewport({ scale: scale.value });
    const outputScale = window.devicePixelRatio || 1;
    const width = Math.floor(viewport.width);
    const height = Math.floor(viewport.height);

    const pageWrapper = document.createElement('div');
    pageWrapper.className = 'pdf-page relative mx-auto bg-white shadow border border-gray-200';
    pageWrapper.style.width = `${width}px`;
    pageWrapper.style.height = `${height}px`;

    // Canvas layer (visual only — not selectable)
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(width * outputScale);
    canvas.height = Math.floor(height * outputScale);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const context = canvas.getContext('2d');
    const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

    await page.render({
      canvasContext: context,
      canvas,
      viewport,
      transform
    }).promise;

    // Text layer directly above canvas — real selectable PDF text spans
    const textLayerDiv = document.createElement('div');
    textLayerDiv.className = 'textLayer';
    textLayerDiv.style.setProperty('--scale-factor', String(scale.value));
    textLayerDiv.style.setProperty('--total-scale-factor', String(scale.value));
    textLayerDiv.style.width = `${width}px`;
    textLayerDiv.style.height = `${height}px`;

    pageWrapper.appendChild(canvas);
    pageWrapper.appendChild(textLayerDiv);
    pagesRef.value.appendChild(pageWrapper);

    try {
      // Prefer streaming source used by PDF.js viewer for accurate hit-testing
      const textContentSource = page.streamTextContent({
        includeMarkedContent: true,
        disableNormalization: true
      });

      const textLayer = new pdfjs.TextLayer({
        textContentSource,
        container: textLayerDiv,
        viewport
      });
      await textLayer.render();
    } catch (textErr) {
      console.warn('PDF text layer failed, fallback to getTextContent:', textErr);
      try {
        const textContent = await page.getTextContent();
        const textLayer = new pdfjs.TextLayer({
          textContentSource: textContent,
          container: textLayerDiv,
          viewport
        });
        await textLayer.render();
      } catch (fallbackErr) {
        console.warn('PDF text layer fallback failed:', fallbackErr);
      }
    }
  }
}
</script>

<style scoped>
.pdf-viewer {
  color-scheme: only light;
}
</style>
