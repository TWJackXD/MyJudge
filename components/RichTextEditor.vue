<template>
  <ClientOnly>
    <div class="rich-text-editor">
    <!-- 工具列 -->
    <div class="border-b border-gray-300 p-2 flex flex-wrap gap-2 items-center bg-gray-50 rounded-t-lg">
      <!-- 格式按鈕 -->
      <div class="flex gap-1 border-r border-gray-300 pr-2">
        <button
          type="button"
          @click="editor?.chain().focus().toggleBold().run()"
          :disabled="!editor"
          :class="['p-2 rounded hover:bg-gray-200', editor?.isActive('bold') ? 'bg-gray-300' : '', !editor ? 'opacity-50 cursor-not-allowed' : '']"
          title="粗體 (Ctrl+B)"
        >
          <font-awesome-icon icon="fa-solid fa-bold" />
        </button>
        <button
          type="button"
          @click="editor?.chain().focus().toggleItalic().run()"
          :disabled="!editor"
          :class="['p-2 rounded hover:bg-gray-200', editor?.isActive('italic') ? 'bg-gray-300' : '', !editor ? 'opacity-50 cursor-not-allowed' : '']"
          title="斜體 (Ctrl+I)"
        >
          <font-awesome-icon icon="fa-solid fa-italic" />
        </button>
        <button
          type="button"
          @click="editor?.chain().focus().toggleHeading({ level: 2 }).run()"
          :disabled="!editor"
          :class="['p-2 rounded hover:bg-gray-200', editor?.isActive('heading', { level: 2 }) ? 'bg-gray-300' : '', !editor ? 'opacity-50 cursor-not-allowed' : '']"
          title="標題"
        >
          <font-awesome-icon icon="fa-solid fa-heading" />
        </button>
      </div>

      <!-- 列表按鈕 -->
      <div class="flex gap-1 border-r border-gray-300 pr-2">
        <button
          type="button"
          @click="editor?.chain().focus().toggleBulletList().run()"
          :disabled="!editor"
          :class="['p-2 rounded hover:bg-gray-200', editor?.isActive('bulletList') ? 'bg-gray-300' : '', !editor ? 'opacity-50 cursor-not-allowed' : '']"
          title="無序列表"
        >
          <font-awesome-icon icon="fa-solid fa-list-ul" />
        </button>
        <button
          type="button"
          @click="editor?.chain().focus().toggleOrderedList().run()"
          :disabled="!editor"
          :class="['p-2 rounded hover:bg-gray-200', editor?.isActive('orderedList') ? 'bg-gray-300' : '', !editor ? 'opacity-50 cursor-not-allowed' : '']"
          title="有序列表"
        >
          <font-awesome-icon icon="fa-solid fa-list-ol" />
        </button>
      </div>

      <!-- 代碼按鈕 -->
      <div class="flex gap-1 border-r border-gray-300 pr-2">
        <button
          type="button"
          @click="showCodeBlockDialog = true"
          :disabled="!editor"
          :class="['p-2 rounded hover:bg-gray-200', editor?.isActive('codeBlock') ? 'bg-gray-300' : '', !editor ? 'opacity-50 cursor-not-allowed' : '']"
          title="插入代碼塊"
        >
          <font-awesome-icon icon="fa-solid fa-code" />
        </button>
        <button
          type="button"
          @click="editor?.chain().focus().toggleCode().run()"
          :disabled="!editor"
          :class="['p-2 rounded hover:bg-gray-200', editor?.isActive('code') ? 'bg-gray-300' : '', !editor ? 'opacity-50 cursor-not-allowed' : '']"
          title="行內代碼 (Ctrl+E)"
        >
          <font-awesome-icon icon="fa-solid fa-code" class="text-sm" />
        </button>
      </div>

      <!-- MathJax 按鈕 -->
      <div class="flex gap-1 border-r border-gray-300 pr-2">
        <button
          type="button"
          @click="insertMathJaxInline"
          :disabled="!editor"
          :class="['p-2 rounded hover:bg-gray-200', !editor ? 'opacity-50 cursor-not-allowed' : '']"
          title="插入行內數學公式"
        >
          <span class="text-sm font-bold">∑</span>
        </button>
        <button
          type="button"
          @click="insertMathJaxBlock"
          :disabled="!editor"
          :class="['p-2 rounded hover:bg-gray-200', !editor ? 'opacity-50 cursor-not-allowed' : '']"
          title="插入數學公式塊"
        >
          <span class="text-sm font-bold">∫</span>
        </button>
      </div>

      <!-- 表格按鈕 -->
      <div class="flex gap-1 border-r border-gray-300 pr-2">
        <button
          type="button"
          @click="insertTable"
          :disabled="!editor || !hasTableExtension"
          :class="['p-2 rounded hover:bg-gray-200', !editor || !hasTableExtension ? 'opacity-50 cursor-not-allowed' : '']"
          title="插入表格"
        >
          <font-awesome-icon icon="fa-solid fa-table" />
        </button>
        <button
          type="button"
          @click="editor?.chain().focus().addColumnBefore().run()"
          :disabled="!editor || !hasTableExtension || !editor.can().addColumnBefore()"
          :class="['p-2 rounded hover:bg-gray-200', !editor || !hasTableExtension || !editor.can().addColumnBefore() ? 'opacity-50 cursor-not-allowed' : '']"
          title="左側插入列"
        >
          <font-awesome-icon icon="fa-solid fa-columns" class="rotate-90" />
        </button>
        <button
          type="button"
          @click="editor?.chain().focus().addColumnAfter().run()"
          :disabled="!editor || !hasTableExtension || !editor.can().addColumnAfter()"
          :class="['p-2 rounded hover:bg-gray-200', !editor || !hasTableExtension || !editor.can().addColumnAfter() ? 'opacity-50 cursor-not-allowed' : '']"
          title="右側插入列"
        >
          <font-awesome-icon icon="fa-solid fa-columns" class="-rotate-90" />
        </button>
        <button
          type="button"
          @click="editor?.chain().focus().deleteColumn().run()"
          :disabled="!editor || !hasTableExtension || !editor.can().deleteColumn()"
          :class="['p-2 rounded hover:bg-gray-200', !editor || !hasTableExtension || !editor.can().deleteColumn() ? 'opacity-50 cursor-not-allowed' : '']"
          title="刪除列"
        >
          <font-awesome-icon icon="fa-solid fa-trash" />
        </button>
        <button
          type="button"
          @click="editor?.chain().focus().addRowBefore().run()"
          :disabled="!editor || !hasTableExtension || !editor.can().addRowBefore()"
          :class="['p-2 rounded hover:bg-gray-200', !editor || !hasTableExtension || !editor.can().addRowBefore() ? 'opacity-50 cursor-not-allowed' : '']"
          title="上方插入行"
        >
          <font-awesome-icon icon="fa-solid fa-arrow-up" />
        </button>
        <button
          type="button"
          @click="editor?.chain().focus().addRowAfter().run()"
          :disabled="!editor || !hasTableExtension || !editor.can().addRowAfter()"
          :class="['p-2 rounded hover:bg-gray-200', !editor || !hasTableExtension || !editor.can().addRowAfter() ? 'opacity-50 cursor-not-allowed' : '']"
          title="下方插入行"
        >
          <font-awesome-icon icon="fa-solid fa-arrow-down" />
        </button>
        <button
          type="button"
          @click="editor?.chain().focus().deleteRow().run()"
          :disabled="!editor || !hasTableExtension || !editor.can().deleteRow()"
          :class="['p-2 rounded hover:bg-gray-200', !editor || !hasTableExtension || !editor.can().deleteRow() ? 'opacity-50 cursor-not-allowed' : '']"
          title="刪除行"
        >
          <font-awesome-icon icon="fa-solid fa-minus" />
        </button>
        <button
          type="button"
          @click="editor?.chain().focus().deleteTable().run()"
          :disabled="!editor || !hasTableExtension || !editor.can().deleteTable()"
          :class="['p-2 rounded hover:bg-gray-200', !editor || !hasTableExtension || !editor.can().deleteTable() ? 'opacity-50 cursor-not-allowed' : '']"
          title="刪除表格"
        >
          <font-awesome-icon icon="fa-solid fa-table" class="text-red-600" />
        </button>
      </div>

      <!-- 其他按鈕 -->
      <div class="flex gap-1">
        <button
          type="button"
          @click="editor?.chain().focus().setHorizontalRule().run()"
          :disabled="!editor"
          :class="['p-2 rounded hover:bg-gray-200', !editor ? 'opacity-50 cursor-not-allowed' : '']"
          title="插入分隔線"
        >
          <font-awesome-icon icon="fa-solid fa-minus" />
        </button>
      </div>
    </div>

    <!-- 編輯器內容 -->
    <div v-if="editor" class="editor-content border border-gray-300 rounded-b-lg min-h-[300px] max-h-[600px] overflow-y-auto p-4">
      <EditorContent :editor="editor" />
    </div>
    <div v-else class="border border-gray-300 rounded-b-lg min-h-[300px] p-4 bg-gray-50 flex items-center justify-center">
      <p class="text-gray-500">正在初始化編輯器...</p>
    </div>

    <!-- 代碼塊對話框 -->
    <div
      v-if="showCodeBlockDialog"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click="showCodeBlockDialog = false"
    >
      <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4" @click.stop>
        <h4 class="text-lg font-semibold mb-4">插入代碼塊</h4>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">選擇語言</label>
            <select
              v-model="selectedLanguage"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">純文本</option>
              <option value="java">Java</option>
              <option value="python">Python</option>
              <option value="cpp">C++</option>
              <option value="csharp">C#</option>
              <option value="javascript">JavaScript</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
              <option value="sql">SQL</option>
              <option value="bash">Bash</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">代碼內容</label>
            <textarea
              v-model="codeBlockContent"
              rows="10"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500"
              placeholder="輸入代碼..."
            ></textarea>
          </div>
          <div class="flex gap-3">
            <button
              type="button"
              @click="showCodeBlockDialog = false"
              class="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
            >
              取消
            </button>
            <button
              type="button"
              @click="insertCodeBlock"
              class="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
            >
              插入
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>
    <template #fallback>
      <div class="border border-gray-300 rounded-lg min-h-[300px] p-4 bg-gray-50">
        <p class="text-gray-500">載入編輯器中...</p>
      </div>
    </template>
  </ClientOnly>
</template>

<script setup>
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import CodeBlock from '@tiptap/extension-code-block'
import Placeholder from '@tiptap/extension-placeholder'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: '請輸入內容...'
  }
})

const emit = defineEmits(['update:modelValue'])

const showCodeBlockDialog = ref(false)
const selectedLanguage = ref('java')
const codeBlockContent = ref('')
const isEditorReady = ref(false)
const hasTableExtension = ref(false)

// 創建基礎擴展配置
function createBaseExtensions(tableExts = []) {
  return [
    StarterKit.configure({
      codeBlock: false, // 禁用默認代碼塊，使用自定義的
      paragraph: {
        HTMLAttributes: {
          class: 'min-h-[1em]', // 確保空段落有最小高度
        },
      },
      hardBreak: {
        keepMarks: true, // 保留標記
      },
      gapcursor: true, // 啟用空白游標，使空段落可編輯
    }),
    CodeBlock.extend({
      addAttributes() {
        return {
          ...this.parent?.(),
          language: {
            default: null,
            parseHTML: element => {
              const { classList } = element.firstChild || {}
              if (!classList) return null
              const langClass = Array.from(classList).find(cls => cls.startsWith('language-'))
              return langClass ? langClass.replace('language-', '') : null
            },
            rendered: false,
          },
        }
      },
      parseHTML() {
        return [
          {
            tag: 'pre',
            preserveWhitespace: 'full',
            getAttrs: node => {
              const code = node.querySelector('code')
              if (!code) return false
              const classList = code.classList || []
              const langClass = Array.from(classList).find(cls => cls.startsWith('language-'))
              const language = langClass ? langClass.replace('language-', '') : null
              return { language }
            },
          },
        ]
      },
      renderHTML({ node, HTMLAttributes }) {
        const language = node.attrs.language || ''
        const codeClass = language ? `language-${language}` : ''
        return [
          'pre',
          HTMLAttributes,
          [
            'code',
            {
              class: codeClass,
            },
            0,
          ],
        ]
      },
    }),
    Placeholder.configure({
      placeholder: props.placeholder,
    }),
    ...tableExts, // 添加表格擴展
  ]
}

// 編輯器引用（直接包含表格擴展）
const tableExtensions = [
  Table.configure({ resizable: true }),
  TableRow,
  TableHeader,
  TableCell,
]

const editor = useEditor({
  content: props.modelValue || '',
  editable: true,
  extensions: createBaseExtensions(tableExtensions),
  onUpdate: ({ editor }) => {
    if (!editor || isUpdatingFromProps) return
    let html = editor.getHTML()
    
    // 確保空段落被保留為 <p><br></p> 而不是 <p></p>
    // 這樣可以確保空白行在渲染時不會被瀏覽器吃掉
    html = html.replace(/<p><\/p>/g, '<p><br></p>')
    html = html.replace(/<p>\s*<\/p>/g, '<p><br></p>')
    
    // 防止無限循環更新
    if (html !== props.modelValue) {
      emit('update:modelValue', html)
    }
  },
  onCreate: () => {
    console.log('編輯器（含表格）創建成功')
    isEditorReady.value = true
    hasTableExtension.value = true
  },
  editorProps: {
    attributes: {
      class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px]',
    },
  },
})

// 防止無限循環更新的 watch
let isUpdatingFromProps = false

watch(() => props.modelValue, (newValue) => {
  if (!editor.value || isUpdatingFromProps) return
  
  const currentHtml = editor.value.getHTML()
  const normalizedNewValue = newValue || ''
  
  // 如果內容相同，不更新
  if (currentHtml === normalizedNewValue) return
  
  isUpdatingFromProps = true
  try {
    editor.value.commands.setContent(normalizedNewValue, false) // false 表示不觸發歷史記錄
  } catch (error) {
    console.error('設置編輯器內容失敗:', error)
  }
  
  nextTick(() => {
    isUpdatingFromProps = false
  })
}, { immediate: false })

onBeforeUnmount(() => {
  editor.value?.destroy()
})

function insertCodeBlock() {
  if (!editor.value || !codeBlockContent.value.trim()) {
    showCodeBlockDialog.value = false
    return
  }

  const language = selectedLanguage.value || ''
  
  // 使用 TipTap 的 codeBlock 命令
  editor.value.chain().focus().insertContent({
    type: 'codeBlock',
    attrs: {
      language: language || null,
    },
    content: [
      {
        type: 'text',
        text: codeBlockContent.value,
      },
    ],
  }).run()
  
  // 重置對話框
  codeBlockContent.value = ''
  selectedLanguage.value = 'java'
  showCodeBlockDialog.value = false
}

function insertMathJaxInline() {
  if (!editor.value) return
  // 使用 $...$ 格式而不是 \(...\)
  editor.value.chain().focus().insertContent('<span>$  $</span>').run()
  // 移動游標到公式中間
  nextTick(() => {
    if (editor.value) {
      try {
        editor.value.commands.setTextSelection(editor.value.state.selection.from - 2)
      } catch (e) {
        // 忽略選擇錯誤
      }
    }
  })
}

function insertMathJaxBlock() {
  if (!editor.value) return
  // 使用 $$...$$ 格式而不是 \[...\]
  editor.value.chain().focus().insertContent('<p>$$  $$</p>').run()
  // 移動游標到公式中間
  nextTick(() => {
    if (editor.value) {
      try {
        editor.value.commands.setTextSelection(editor.value.state.selection.from - 4)
      } catch (e) {
        // 忽略選擇錯誤
      }
    }
  })
}

function insertTable() {
  if (!editor.value || !hasTableExtension.value) return
  editor.value.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
}

function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
</script>

<style scoped>
/* TipTap 編輯器樣式 */
:deep(.ProseMirror) {
  outline: none;
}

:deep(.ProseMirror p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  color: #adb5bd;
  pointer-events: none;
  height: 0;
}

:deep(.ProseMirror pre) {
  background-color: rgb(243 244 246);
  padding: 0.75rem;
  border-radius: 0.25rem;
  margin-top: 1rem;
  margin-bottom: 1rem;
  border: 1px solid rgb(209 213 219);
}

:deep(.ProseMirror pre code) {
  background-color: transparent;
  padding: 0;
  color: inherit;
}

:deep(.ProseMirror code) {
  background-color: rgb(254 242 242);
  padding: 0.125rem 0.25rem;
  color: rgb(185 28 28);
  border-radius: 0.25rem;
}

:deep(.ProseMirror p) {
  margin-bottom: 0.5rem;
  min-height: 1.5em; /* 確保空段落可見 */
}

/* 空段落保留為空白行 */
:deep(.ProseMirror p:empty) {
  min-height: 1.5em;
}

:deep(.ProseMirror p br:only-child) {
  display: block;
  content: "";
}

:deep(.ProseMirror h2) {
  font-size: 1.5rem;
  line-height: 2rem;
  font-weight: 700;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

:deep(.ProseMirror ul),
:deep(.ProseMirror ol) {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  padding-left: 1.5rem;
}

:deep(.ProseMirror li) {
  margin-bottom: 0.25rem;
}

:deep(.ProseMirror hr) {
  margin-top: 1.25rem;
  margin-bottom: 1.25rem;
  border-color: rgb(209 213 219);
}

/* 表格樣式 */
:deep(.ProseMirror table) {
  border-collapse: collapse;
  table-layout: fixed;
  width: 100%;
  margin: 1rem 0;
  overflow: hidden;
}

:deep(.ProseMirror table td),
:deep(.ProseMirror table th) {
  min-width: 1em;
  border: 1px solid rgb(209 213 219);
  padding: 0.5rem;
  vertical-align: top;
  box-sizing: border-box;
  position: relative;
}

:deep(.ProseMirror table th) {
  font-weight: 700;
  text-align: left;
  background-color: rgb(243 244 246);
}

:deep(.ProseMirror table .selectedCell:after) {
  z-index: 2;
  position: absolute;
  content: "";
  left: 0; right: 0; top: 0; bottom: 0;
  background: rgba(200, 200, 255, 0.4);
  pointer-events: none;
}

:deep(.ProseMirror table .column-resize-handle) {
  position: absolute;
  right: -2px;
  top: 0;
  bottom: -2px;
  width: 4px;
  background-color: rgb(59 130 246);
  pointer-events: none;
}

:deep(.ProseMirror table p) {
  margin: 0;
}
</style>

