<template>
  <div class="h-full min-h-0 overflow-hidden">
    <div ref="containerRef" class="md:flex gap-0 h-full min-h-0">

      <!-- 左側題目區：整欄單一捲軸（PDF 不另開捲軸） -->
      <div
        class="pr-2 overflow-y-auto overflow-x-hidden w-full md:w-[var(--left-width)] h-full min-h-0"
        :style="{ '--left-width': leftWidth + '%' }"
      >
        <h1 class="text-blue-600 text-2xl md:text-3xl font-bold mb-6">提交你的答案</h1>
        <ol class="list-decimal list-inside mb-5">
          <li>排名依據你完成題數與完成最終時間長短計算</li>
          <li>提交錯誤不懲罰時間</li>
          <li v-if="!isAdmin">Accepted 之後不允許再次提交</li>
        </ol>

        <div class="w-full overflow-x-auto mb-5">
          <table class="min-w-150 w-full table-fixed">
            <thead class="h-10">
              <tr>
                <th class="px-3 text-start" :class="timeLeft == 'EXPIRED' ? ' w-[28.5%]' : 'w-[24%]'">競賽名稱</th>
                <th class="px-3 text-start w-[10%]">要求語言</th>
                <th class="px-3 text-start" :class="timeLeft == 'EXPIRED' ? ' w-[19%]' : 'w-[23.5%]'">倒數時間</th>
                <th class="px-3 text-start w-[27.5%]">結束時間</th>
                <th class="px-3 text-start w-[15%]">看排名</th>
              </tr>
            </thead>
            <tbody>
              <tr class="bg-gray-100 border-gray-300 border">
                <td class="px-3 py-1.5">
                  <NuxtLink :to="'/problem/folder/' + folderURL" class="underline text-blue-500 hover:text-blue-600">
                    {{ folder }}
                  </NuxtLink>
                </td>
                <td class="px-3 py-1.5">
                  <div class="flex gap-2 flex-wrap">
                    <span
                      v-for="lang in allowedLanguages"
                      :key="lang"
                      class="font-bold cursor-default px-2 py-0.5 rounded-4xl text-sm inline-block bg-orange-400 text-white"
                    >
                      {{ lang }}
                    </span>
                  </div>
                </td>
                <td class="px-3 py-1.5">
                  <span class="font-bold cursor-default px-2 py-0.5 rounded-4xl text-sm inline-block bg-sky-400 text-white">
                    {{ timeLeft }}
                  </span>
                </td>
                <td class="px-3 py-1.5">
                  {{ dayjs.utc(endTime).tz('Asia/Taipei').format('YYYY-MM-DD ddd. HH:mm:ss') }}
                </td>
                <td class="px-3 py-1.5">
                  <NuxtLink :to="'/problem/rank/' + folderURL">
                    <button class="cursor-pointer font-bold px-2 py-0.5 rounded-4xl text-sm inline-block bg-yellow-500 text-white">
                      排名
                    </button>
                  </NuxtLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="p-4 border border-gray-300 rounded-lg mb-5" id="description">
          <h2 class="text-xl md:text-2xl font-medium mb-4">[題號:q{{ questionNo }}] {{ title }}</h2>
          <p class="text-gray-600">{{ summary }}</p>
          <hr />
          <ClientOnly v-if="contentType === 'pdf'">
            <PdfViewer v-if="pdfUrl" :src="pdfUrl" />
            <p v-else class="text-red-600 py-4">此題目尚未上傳 PDF</p>
          </ClientOnly>
          <div v-else ref="mathContent" v-html="description"></div>
        </div>
      </div>

      <!-- 可拖曳的分隔線 -->
      <div
        class="mx-2 w-1 bg-gray-300 h-10 my-auto rounded-4xl hover:bg-gray-500 cursor-col-resize flex-shrink-0 relative group transition-colors hidden md:block"
        :class="{ 'bg-blue-500': isDragging }"
        @mousedown="handleMouseDown"
      >
        <div class="absolute inset-y-0 -left-1 -right-1"></div>
        <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div class="flex flex-col gap-1">
            <div class="w-1 h-1 bg-white rounded-full"></div>
            <div class="w-1 h-1 bg-white rounded-full"></div>
            <div class="w-1 h-1 bg-white rounded-full"></div>
          </div>
        </div>
      </div>

      <!-- 右側程式碼區 -->
      <div 
        class="flex flex-col w-full md:w-[calc(100%-var(--left-width))]"
        :style="{ '--left-width': leftWidth + '%' }"
      >
        <ClientOnly>
          <!-- 編輯器容器 (70%) -->
          <div
            :class="[
              'transition-all duration-300 bg-[#222222] flex flex-col',
              isFullscreen 
                ? 'fixed inset-0 z-50 p-4' 
                : 'relative w-full h-[70vh]'
            ]"
          >
            <!-- 工具列 -->
            <div class="flex items-center justify-between px-7.5 py-2 shrink-0">
              <Dropdown
                v-model="selectedLang"
                :options="langs"
                :disabled="isDisabled"
                width="w-32"
              />
              
              <button
                @click="toggleFullscreen"
                class="text-gray-300 text-sm rounded cursor-pointer hover:text-white transition-colors"
                :title="isFullscreen ? '退出全螢幕' : '全螢幕'"
              >
                <font-awesome-icon
                  :icon="isFullscreen ? 'fa-solid fa-compress' : 'fa-solid fa-expand'"
                />
              </button>
            </div>

            <!-- Editor -->
            <div class="flex-1 min-h-0">
              <MonacoEditor
                :key="codeKey"
                class="w-full h-full"
                :options="editorOptions"
                v-model="code"
                :lang="monacoLang"
              />
            </div>

            <!-- 底部控制列 -->
            <div class="flex items-center justify-between gap-1.5 px-7.5 py-2 shrink-0">
              <span class="text-gray-300 font-medium">終端機 / 提交狀態</span>
              
              <div class="flex gap-1.5">
                <button 
                  ref="saveCodeBtn" 
                  @click="saveCode"
                  :disabled="isButtonDisabled"
                  :class="[
                    'px-3 py-1 transition-all duration-75 rounded text-white font-medium border-0',
                    isButtonDisabled 
                      ? 'bg-blue-700 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                  ]"
                >
                  儲存<span class="hidden md:inline">程式碼</span>
                </button>

                <button 
                  ref="submitCodeBtn" 
                  @click="submitCode"
                  :disabled="isButtonDisabled"
                  v-show="!isSubmitting"
                  :class="[
                    'px-3 py-1 transition-all duration-75 rounded text-white font-medium border-0',
                    isButtonDisabled 
                      ? 'bg-green-700 cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-700 cursor-pointer'
                  ]"
                >
                  提交<span class="hidden md:inline">程式碼</span>
                </button>
                
                <Spinner v-show="isSubmitting" />
              </div>
            </div>
          </div>
        </ClientOnly>

        <!-- Submission Status Area -->
        <textarea
          class="w-full text-xs p-4 bg-gray-100 border border-gray-300 rounded-lg mt-4 focus:outline-none h-[30vh]"
          readonly
        >{{ status }}</textarea>
      </div>

    </div>
  </div>
</template>

<script setup>
definePageMeta({ 
  layout: 'problem',
  middleware: 'problem-auth'
});

import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import Dropdown from '~/components/Dropdown.vue';
import hljs from 'highlight.js/lib/core';
import { SUPPORTED_LANGUAGES, MONACO_LANGUAGE_IDS, BOILERPLATE_CODE } from '~/utils/languages';

dayjs.extend(utc);
dayjs.extend(timezone);

const route = useRoute();
const uuid = route.params.uuid;
const contestFolder = computed(() => route.query.folder || '');
const { fetchUser, isAdmin } = useAuth();

// ========== 狀態常數 ==========
const STATUS_MAP = {
  AC: { code: 'AC', message: '通過~~全部測資都正確!' },
  WA: { code: 'WA', message: '未通過~~有部分或全部測資答案錯誤，請再仔細檢查程式碼!' },
  CE: { code: 'CE', message: '編譯錯誤，請檢查程式碼是否有語法錯誤!' },
  RE: { code: 'RE', message: '執行期間發生了錯誤，請檢查程式碼的邏輯是否有錯誤~' },
  TLE: { code: 'TLE', message: '執行時間超過上限時間，請檢查程式碼是否有無窮迴圈!' },
  MLE: { code: 'MLE', message: '記憶體使用超過上限，請檢查程式是否占用過多記憶體!' },
  OLE: { code: 'OLE', message: '輸出超過上限，請檢查是否印出過多內容!' },
  IE: { code: 'IE', message: '判題系統發生內部錯誤，請稍後再試!' },
  NO_DATA: { code: 'NO_DATA', message: '尚未提交程式碼' },
  LOADING: { code: 'LOADING', message: '載入中…' },
  SAVE: { code: 'SAVE', message: '尚未提交程式碼' }
};

// ========== 題目相關 Refs ==========
const questionNo = ref('');
const title = ref('載入中…');
const summary = ref('載入中…');
const description = ref('載入中…');
const contentType = ref('html');
const pdfUrl = ref('');
const folder = ref('載入中…');
const folderURL = ref('');
const endTime = ref('');
const timeLeft = ref('載入中…');
const mathContent = ref(null);
const allowedLanguages = ref([]);

// ========== 提交狀態 Refs ==========
const status = ref('');  // Remove default "Loading..."
const statusCode = ref('');
const isButtonDisabled = ref(false);
const isSubmitting = ref(false);
const hasUnsavedChanges = ref(false);
let countdownTimer = null;
let pollTimer = null;

// ========== 編輯器相關 Refs ==========
const code = ref('');
const codeKey = ref(0);

const selectedLang = ref('');
const langs = ref([]);
const isDisabled = ref(false);

watch(selectedLang, (newLang) => {
  // Only update if the code is empty or is the boilerplate of another language
  const isBoilerplate = Object.values(BOILERPLATE_CODE).includes(code.value.trim());
  if (!code.value || isBoilerplate) {
    code.value = BOILERPLATE_CODE[newLang] || '';
  }
});

const monacoLang = computed(() => MONACO_LANGUAGE_IDS[selectedLang.value] || 'java');

const editorOptions = {
  theme: 'vs-dark',
  minimap: { enabled: true },
  fontSize: 18,
  fontFamily: 'Ubuntu Mono',
  fontWeight: '400',
  fontLigatures: false,
  lineHeight: 24,
  letterSpacing: 0,
  tabSize: 2,
  insertSpaces: true,
  // 禁用一些在 iframe 环境中可能有问题的功能
  contextmenu: true,
  quickSuggestions: true,
  snippetSuggestions: 'none',
  // 不要尝试在每次输入时同步剪贴板
  autoClosingBrackets: 'always',
  autoClosingQuotes: 'always'
};

// ========== 按鈕 Refs ==========
const submitCodeBtn = ref(null);

// ========== 全螢幕相關 ==========
const isFullscreen = ref(false);
const containerRef = ref(null);

// ========== 拖曳相關 ==========
const leftWidthCookie = useCookie('oj-left-width', {
  default: () => 42.857,
  maxAge: 60 * 60 * 24 * 365
});
const leftWidth = ref(leftWidthCookie.value);
const isDragging = ref(false);
const minLeftWidth = 25;
const maxLeftWidth = 75;

// ========== Test Code Refs ==========
// ========== 語法高亮 ==========
function highlightCode() {
  if (!mathContent.value) return;
  
  // 忽略 highlight.js 警告
  const originalWarn = console.warn;
  const warnings = [];
  console.warn = (...args) => {
    const message = args.join(' ');
    if (!message.includes('unescaped HTML') && !message.includes('highlight.js/wiki/security')) {
      originalWarn(...args);
    }
  };
  
  try {
    const codeBlocks = mathContent.value.querySelectorAll('pre');
    
    codeBlocks.forEach(block => {
      if (!block.classList.contains('hljs')) {
        hljs.highlightElement(block);
      }
    });
  } finally {
    // 恢复 console.warn
    console.warn = originalWarn;
  }
}

// ========== 初始化資料 ==========
async function initializeData() {
  try {
    if (!contestFolder.value) {
      const err = new Error('缺少競賽參數，請從競賽頁進入題目');
      err.statusCode = 400;
      err.statusMessage = err.message;
      throw err;
    }

    const response = await $fetch('/api/problem/getProblemDetail', {
      method: 'POST',
      body: { uuid, folder: contestFolder.value }
    });
    
    await fetchUser();

    questionNo.value = response.data.questionNo;
    title.value = response.data.title;
    summary.value = response.data.summary;
    description.value = response.data.description;
    contentType.value = response.data.content_type || 'html';
    pdfUrl.value = response.data.pdf_url || '';
    
    const languages = Array.isArray(response.data.allowed_languages) && response.data.allowed_languages.length > 0
      ? response.data.allowed_languages
      : [...SUPPORTED_LANGUAGES];
    
    langs.value = languages;
    allowedLanguages.value = languages;
    if (languages.length > 0) {
      selectedLang.value = languages[0];
    }

    const folderUuid = response.data.folderUuid || contestFolder.value;
    const getFolderName = (await $fetch('/api/problem/getProblemFolder?uuid=' + folderUuid)).data[0];
    folder.value = getFolderName.name;
    folderURL.value = getFolderName.uuid;
    endTime.value = getFolderName.endTime;

    await nextTick();
    await loadSubmitRecord();
    await nextTick();
    if (contentType.value !== 'pdf') {
      highlightCode();
    }
  } catch (error) {
    const message = error?.data?.statusMessage || error?.statusMessage || '無法載入題目';
    title.value = '無法載入';
    summary.value = message;
    description.value = `<p class="text-red-600">${message}</p>`;
    contentType.value = 'html';
    if (error?.statusCode === 403 || error?.statusCode === 404) {
      alert(message);
      navigateTo('/problem');
    }
  }
}

// ========== 載入提交記錄 ==========
async function loadSubmitRecord() {
  try {
    const record = await $fetch('/api/record/getSubmitRecord', {
      params: {
        problem: uuid,
        folder: contestFolder.value || folderURL.value
      }
    });

    if (record.status === "no_data") {
      selectedLang.value = langs.value[0];
      updateStatus(STATUS_MAP.NO_DATA);
    } else {
      const statusInfo = STATUS_MAP[record.data.status];
      const message = statusInfo.message + (record.data.error ? '\n' + record.data.error : '');
      updateStatus({ ...statusInfo, message });
      
      const loadedCode = record.data.code || '';
      code.value = loadedCode;
      
      if (record.data.language && langs.value.includes(record.data.language)) {
        selectedLang.value = record.data.language;
      } else {
        selectedLang.value = langs.value[0];
      }

      codeKey.value++;

      if (record.data.status === 'AC'){
        if (!isAdmin.value) disableButtons();
        hasUnsavedChanges.value = false;
      }
    }
  } catch (error) {
    selectedLang.value = langs.value[0];
    updateStatus(STATUS_MAP.NO_DATA);
  }
}

// ========== 更新狀態 ==========
function updateStatus(statusInfo) {
  statusCode.value = statusInfo.code;
  status.value = statusInfo.message;
}

// ========== 禁用按鈕 ==========
function disableButtons() {
  isButtonDisabled.value = true;
}
function enableButtons() {
  isButtonDisabled.value = false;
}

// ========== 提交程式碼 ==========
async function submitCode() {
  if (isSubmitting.value || isButtonDisabled.value) return;
  
  isSubmitting.value = true;
  updateStatus(STATUS_MAP.LOADING);

  try {
    console.log('[submitCode] Submitting code to Judge0...');
    console.log('[submitCode] Problem UUID:', uuid);
    console.log('[submitCode] Language:', selectedLang.value);
    console.log('[submitCode] Code length:', code.value.length);
    
    const res = await $fetch('/api/judge/submitCode', {
      method: 'POST',
      body: {
        sourceCode: code.value,
        uuid,
        language: selectedLang.value,
        folder: contestFolder.value || folderURL.value
      }
    });

    if (!res || !res.recordUuid) throw new Error('伺服器未回應或未返回 recordUuid');
    
    console.log('[submitCode] Record UUID:', res.recordUuid);
    pollSubmissionStatus(res.recordUuid);

  } catch (err) {
    console.error('[submitCode] 提交失敗:', err);
    const message = err?.data?.statusMessage || err?.statusMessage || err?.message || '無法連線伺服器';
    updateStatus({ code: 'ERROR', message: `提交失敗: ${message}` });
    isSubmitting.value = false;
  }
}

// ========== 輪詢判題結果 ==========
async function pollSubmissionStatus(recordUuid) {
  console.log('[pollSubmissionStatus] Starting to poll record:', recordUuid);
  
  let pollCount = 0;
  let settled = false;
  const maxPolls = 120; // 最多輪詢 120 次 (120 秒)

  if (pollTimer) clearInterval(pollTimer);

  pollTimer = setInterval(async () => {
    if (settled) return;

    if (pollCount++ >= maxPolls) {
      settled = true;
      clearInterval(pollTimer);
      isSubmitting.value = false;
      updateStatus({ code: 'ERROR', message: '判題逾時，請稍後再試' });
      console.log('[pollSubmissionStatus] Max polls reached, stopping.');
      return;
    }
    
    try {
      const res = await $fetch(`/api/judge/getSubmissionResult?recordUuid=${recordUuid}`);
      console.log('[pollSubmissionStatus] Status:', res.status);
      
      const currentStatus = res.status;
      
      if (currentStatus === 'PENDING' || currentStatus === 'PROCESSING') {
        status.value = currentStatus === 'PENDING' ? '正在等待判題...' : '正在判題中...';
      } else {
        // 任務完成 (AC, WA, TLE, RE, CE, etc.)
        settled = true;
        clearInterval(pollTimer);
        
        // Fix: Clone the object to prevent recursive error message stacking
        const statusInfo = { ...(STATUS_MAP[currentStatus] || { code: currentStatus, message: `收到一個未知的狀態: ${currentStatus}` }) };
        
        // Show details including WA test cases for now
        if (res.error) {
          statusInfo.message = `${statusInfo.message}\n\n錯誤詳情:\n${res.error}`;
        }
        
        updateStatus(statusInfo);
        if (currentStatus === 'AC' && !isAdmin.value) {
          disableButtons();
          hasUnsavedChanges.value = false;
        }
        
        isSubmitting.value = false;
        console.log('[pollSubmissionStatus] Job completed with status:', currentStatus);
      }
    } catch (err) {
      console.error('[pollSubmissionStatus] Error:', err);
      // Don't clear interval on a single network error, allow it to retry
    }
  }, 1000); // 增加輪詢間隔為 1 秒
}

async function saveCode() {
  if (isButtonDisabled.value || isSubmitting.value) return;

  try{
    const response = await $fetch('/api/record/addSubmitRecord', {
      method: 'POST',
      body: {
        problem: uuid,
        folder: contestFolder.value || folderURL.value,
        status: 'SAVE',
        code: code.value,
        error: null,
        language: selectedLang.value
      }
    });
    alert("程式碼已儲存！");
  }
  catch (error) {
    alert(error?.data?.statusMessage || error?.statusMessage || "程式碼儲存失敗，請稍後再試");
  }
  hasUnsavedChanges.value = false;
}

// ========== 倒數計時 ==========
function formatTimeDiff(end) {
  const diff = new Date(end) - new Date();
  if (diff <= 0) return 'EXPIRED';

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

// ========== 全螢幕切換 ==========
function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value;
  const leftPanel = containerRef.value?.children[0];
  if (leftPanel) {
    leftPanel.style.display = isFullscreen.value ? 'none' : 'block';
  }
}

function handleKeyDown(e) {
  if (e.key === 'Escape' && isFullscreen.value) {
    toggleFullscreen();
  }
}

// ========== 拖曳處理 ==========
function handleMouseDown(e) {
  isDragging.value = true;
  e.preventDefault();
}

function handleMouseMove(e) {
  if (!isDragging.value || !containerRef.value) return;

  const container = containerRef.value;
  const containerRect = container.getBoundingClientRect();
  const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

  if (newLeftWidth >= minLeftWidth && newLeftWidth <= maxLeftWidth) {
    leftWidth.value = newLeftWidth;
    leftWidthCookie.value = newLeftWidth;
  }
}

function handleMouseUp() {
  isDragging.value = false;
}

// ========== MathJax 渲染 ==========
async function renderMathJax() {
  if (typeof window !== 'undefined' && window.MathJax && mathContent.value) {
    try {
      await window.MathJax.typesetPromise([mathContent.value]);
    } catch (error) {
      console.warn('MathJax 渲染失敗:', error);
    }
  }
}

// ========== 離開頁面確認 ==========
let isInitialLoad = true;

watch(code, (newCode, oldCode) => {
  if (isInitialLoad) {
    isInitialLoad = false;
    return;
  }
  
  if (newCode !== oldCode && !hasUnsavedChanges.value) {
    hasUnsavedChanges.value = true;
  }
});

function handleBeforeUnload(event) {
  if (hasUnsavedChanges.value) {
    event.preventDefault();
    event.returnValue = '您有未儲存的程式碼變更，確定要離開嗎？';
  }
}

// Nuxt 路由離開確認
onBeforeRouteLeave((to, from, next) => {
  if (hasUnsavedChanges.value) {
    if (confirm('您有未儲存的程式碼變更，確定要離開嗎？')) {
      hasUnsavedChanges.value = false;
      next();
    } else {
      next(false);
    }
  } else {
    next();
  }
});

// ========== 生命週期 ==========
onMounted(async () => {
  await initializeData();
  
  await nextTick();
  renderMathJax();

  countdownTimer = setInterval(() => {
    timeLeft.value = formatTimeDiff(new Date(endTime.value));
  }, 1000);

  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
  
  window.addEventListener('beforeunload', handleBeforeUnload);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown);
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
  window.removeEventListener('beforeunload', handleBeforeUnload);

  if (countdownTimer) clearInterval(countdownTimer);
  if (pollTimer) clearInterval(pollTimer);
});

// ========== Watchers ==========
watch(isDragging, (newVal) => {
  document.body.style.cursor = newVal ? 'col-resize' : '';
  document.body.style.userSelect = newVal ? 'none' : '';
});
</script>

<style>
  #description table { border: 1px solid #aeb3be; width: 100%; }
  #description td { border: 1px solid #aeb3be; padding: 0.5rem 1rem; }
  #description table p { margin-bottom: 0; min-height: 0; }
</style>