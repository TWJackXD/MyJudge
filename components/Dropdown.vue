<script setup>
import { ref, watch, computed } from 'vue'
import { onClickOutside } from '@vueuse/core'

// Props
const props = defineProps({
  modelValue: String,
  options: {
    type: Array,
    default: () => []
  },
  disabled: {
    type: Boolean,
    default: false
  },
  placeholder: {
    type: String,
    default: '請選擇'
  },
  width: {
    type: String,
    default: 'w-36'
  }
})

// Emits
const emit = defineEmits(['update:modelValue'])

// 狀態
const isOpen = ref(false)
const menu = ref(null)

// 如果父層沒有提供 modelValue，就自動設成第一個選項
if (!props.modelValue && props.options.length > 0) {
  emit('update:modelValue', props.options[0])
}

// 方法
function toggle() {
  if (props.disabled) return
  isOpen.value = !isOpen.value
}

function selectOption(option) {
  if (props.disabled) return
  emit('update:modelValue', option)
  isOpen.value = false
}

// 點擊外部關閉
onClickOutside(menu, () => (isOpen.value = false))
</script>

<template>
  <div class="relative inline-block text-left" ref="menu">
    <!-- 按鈕 -->
    <button
      :disabled="disabled"
      @click="toggle"
      :class="[
        'flex items-center justify-between px-3 py-1 rounded-md border border-[#333] transition-all duration-150 select-none',
        width,
        disabled
          ? 'bg-[#2f2f2f] text-gray-300 cursor-not-allowed opacity-70'
          : 'bg-[#2a2a2a] text-gray-200 hover:bg-[#333]'
      ]"
    >
      <span>{{ modelValue || placeholder }}</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="w-4 h-4 ml-2 transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <!-- 下拉選單 -->
    <transition
      enter-active-class="transition ease-out duration-150"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition ease-in duration-100"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <!-- 如果 disabled，就完全不渲染下拉選項 -->
      <div
        v-if="isOpen && !disabled"
        class="absolute mt-1 origin-top bg-[#2a2a2a] border border-[#333] rounded-md shadow-lg z-20"
        :class="width"
      >
        <div class="py-1">
          <div
            v-for="option in options"
            :key="option"
            @click="selectOption(option)"
            class="px-3 py-1.5 text-gray-200 hover:bg-[#3a3a3a] cursor-pointer transition-all"
            :class="{ 'bg-[#3a3a3a]': option === modelValue }"
          >
            {{ option }}
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>
