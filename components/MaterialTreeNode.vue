<template>
  <div>
    <div v-if="node.name" class="select-none">
      <button
        type="button"
        class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left hover:bg-gray-50"
        @click="expanded = !expanded"
      >
        <font-awesome-icon
          icon="fa-solid fa-chevron-right"
          class="text-xs text-gray-400 transition-transform w-3"
          :class="{ 'rotate-90': expanded }"
        />
        <font-awesome-icon
          :icon="expanded ? 'fa-solid fa-folder-open' : 'fa-solid fa-folder'"
          class="text-amber-500"
        />
        <span class="font-medium text-gray-800">{{ node.name }}</span>
        <span class="text-xs text-gray-400 ml-auto">{{ childCount }}</span>
      </button>
    </div>

    <div v-show="!node.name || expanded" :class="node.name ? 'ml-5 border-l border-gray-200 pl-2' : ''">
      <MaterialTreeNode
        v-for="child in node.children"
        :key="child.path"
        :node="child"
        @select="$emit('select', $event)"
      />

      <button
        v-for="file in node.files"
        :key="file.uuid"
        type="button"
        class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left hover:bg-blue-50 text-gray-700"
        @click="$emit('select', file)"
      >
        <span class="w-3"></span>
        <font-awesome-icon :icon="fileIcon(file.file)" class="text-blue-500" />
        <span class="truncate">{{ file.title }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  node: {
    type: Object,
    required: true
  },
  defaultExpanded: {
    type: Boolean,
    default: true
  }
});

defineEmits(['select']);

const expanded = ref(props.defaultExpanded || !props.node.name);

const childCount = computed(() => {
  const folderCount = props.node.children?.length || 0;
  const fileCount = props.node.files?.length || 0;
  return folderCount + fileCount;
});

function fileIcon(filePath = '') {
  const lower = String(filePath).toLowerCase();
  if (lower.endsWith('.pdf')) return 'fa-solid fa-file-pdf';
  if (lower.endsWith('.doc') || lower.endsWith('.docx')) return 'fa-solid fa-file-word';
  if (lower.endsWith('.ppt') || lower.endsWith('.pptx')) return 'fa-solid fa-file-powerpoint';
  return 'fa-solid fa-file-lines';
}
</script>
