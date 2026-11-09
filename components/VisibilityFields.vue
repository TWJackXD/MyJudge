<template>
  <div class="space-y-4">
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        可見性 <span class="text-red-500">*</span>
      </label>
      <select
        :value="modelValue.visibility || 'public'"
        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        @change="updateField('visibility', $event.target.value)"
      >
        <option v-for="option in visibilityOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
      <p class="text-xs text-gray-500 mt-1">{{ currentVisibilityHint }}</p>
    </div>

    <div v-if="needsUserList" class="relative" ref="dropdownRef">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        除了⋯⋯
        <span class="text-red-500">*</span>
      </label>

      <button
        type="button"
        class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-left flex items-center justify-between gap-2 hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        :aria-expanded="dropdownOpen"
        @click="dropdownOpen = !dropdownOpen"
      >
        <span class="truncate text-sm" :class="selectedUsers.length ? 'text-gray-900' : 'text-gray-400'">
          {{ selectedSummary }}
        </span>
        <font-awesome-icon
          icon="fa-solid fa-chevron-down"
          class="text-xs text-gray-500 transition-transform shrink-0"
          :class="{ 'rotate-180': dropdownOpen }"
        />
      </button>

      <div
        v-if="dropdownOpen"
        class="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
      >
        <div class="p-2 border-b border-gray-100">
          <input
            v-model="searchQuery"
            type="text"
            class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="搜尋使用者…"
            @click.stop
          />
        </div>

        <div class="max-h-56 overflow-y-auto py-1">
          <div v-if="loadingUsers" class="px-4 py-3 text-sm text-gray-500">載入使用者中…</div>
          <div v-else-if="filteredUsers.length === 0" class="px-4 py-3 text-sm text-gray-500">沒有符合的使用者</div>
          <label
            v-for="user in filteredUsers"
            :key="user.id"
            class="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            <input
              type="checkbox"
              class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              :checked="selectedUsers.includes(user.username)"
              @change="toggleUser(user.username)"
            />
            <span>{{ user.username }}</span>
          </label>
        </div>

        <div class="flex items-center justify-between gap-2 px-3 py-2 border-t border-gray-100 bg-gray-50">
          <button
            type="button"
            class="text-xs text-blue-600 hover:text-blue-800"
            @click="selectAllFiltered"
          >
            全選目前結果
          </button>
          <button
            type="button"
            class="text-xs text-gray-500 hover:text-gray-700"
            @click="clearSelected"
          >
            清除
          </button>
        </div>
      </div>

      <p v-if="selectedUsers.length === 0" class="text-xs text-red-500 mt-1">
        請至少勾選一位使用者
      </p>
      <div v-else class="mt-2 flex flex-wrap gap-1.5">
        <span
          v-for="username in selectedUsers"
          :key="username"
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-100"
        >
          {{ username }}
          <button type="button" class="hover:text-blue-900" @click="toggleUser(username)">
            <font-awesome-icon icon="fa-solid fa-xmark" class="text-[10px]" />
          </button>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onClickOutside } from '@vueuse/core';
import { VISIBILITY_OPTIONS, normalizeVisibilityUsers } from '~/utils/problemVisibility';

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['update:modelValue']);

const visibilityOptions = VISIBILITY_OPTIONS;
const knownUsers = ref([]);
const loadingUsers = ref(false);
const dropdownOpen = ref(false);
const searchQuery = ref('');
const dropdownRef = ref(null);

const needsUserList = computed(() =>
  props.modelValue.visibility === 'public_except' || props.modelValue.visibility === 'private_except'
);

const selectedUsers = computed(() => normalizeVisibilityUsers(props.modelValue.visibility_users));

const selectedSummary = computed(() => {
  if (!selectedUsers.value.length) return '請勾選使用者（可複選）';
  if (selectedUsers.value.length <= 3) return selectedUsers.value.join(', ');
  return `已選 ${selectedUsers.value.length} 位使用者`;
});

const currentVisibilityHint = computed(() =>
  visibilityOptions.find((option) => option.value === (props.modelValue.visibility || 'public'))?.hint || ''
);

const filteredUsers = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return knownUsers.value;
  return knownUsers.value.filter((user) => user.username.toLowerCase().includes(query));
});

watch(needsUserList, (needed) => {
  if (!needed) {
    dropdownOpen.value = false;
    searchQuery.value = '';
  }
});

onClickOutside(dropdownRef, () => {
  dropdownOpen.value = false;
});

onMounted(async () => {
  loadingUsers.value = true;
  try {
    const response = await $fetch('/api/admin/users/list');
    if (response.status === 'success') {
      knownUsers.value = (response.data || [])
        .filter((user) => user.role !== 'admin')
        .sort((a, b) => a.username.localeCompare(b.username, 'zh-Hant'));
    }
  } catch (error) {
    console.error('載入使用者名單失敗:', error);
  } finally {
    loadingUsers.value = false;
  }
});

function updateField(key, value) {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: value
  });
}

function toggleUser(username) {
  const next = new Set(selectedUsers.value);
  if (next.has(username)) next.delete(username);
  else next.add(username);
  updateField('visibility_users', [...next]);
}

function selectAllFiltered() {
  const next = new Set(selectedUsers.value);
  filteredUsers.value.forEach((user) => next.add(user.username));
  updateField('visibility_users', [...next]);
}

function clearSelected() {
  updateField('visibility_users', []);
}
</script>
