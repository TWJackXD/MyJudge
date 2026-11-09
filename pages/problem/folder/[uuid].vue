<template>
  <div>
    <h1 class="text-blue-600 text-2xl md:text-3xl font-bold mb-6"> {{ folder }} </h1>
        
    <div class="w-full overflow-auto mb-5">
      <table class="min-w-150 w-full table-fixed">
        <thead class="h-10">
          <tr>
            <th class="px-3 text-start w-[30%]">倒數時間</th>
            <th class="px-3 text-start w-[50%]">結束時間</th>
            <th class="px-3 text-start w-[20%]">看排名</th>
          </tr>
        </thead>
        <tbody>
          <tr class="bg-gray-100 border-gray-300 border">
            <td class="px-3 py-1.5">
              <span class="font-bold cursor-default px-2 py-0.5 rounded-4xl text-sm inline-block bg-sky-400 text-white">
                {{ timeLeft }}
              </span>
            </td>
            <td class="px-3 py-1.5">
              {{ endTimeFormatted }}
            </td>
            <td class="px-3 py-1.5">
              <NuxtLink :to="'/problem/rank/' + uuid">
                <button class="cursor-pointer font-bold px-2 py-0.5 rounded-4xl text-sm inline-block bg-yellow-500 text-white">
                  排名
                </button>
              </NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
            
    <table class="w-full">
      <thead class="h-10">
        <tr>
          <th class="px-3 text-start">題號</th>
          <th class="px-3 text-start">標題</th>
          <th class="px-3 text-start">題目主題</th>
          <th class="px-3 text-start">允許語言</th>
          <th class="px-3 text-start">提交狀態</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="problem in problems.data"
          class="odd:bg-white even:bg-gray-50 border-1 border-gray-200"
        >
          <td class="p-3">
            q{{ problem.questionNo }}
          </td>
          <td class="p-3">
            <NuxtLink
              :to="`/problem/detail/${problem.uuid}?folder=${uuid}`"
              class="underline text-blue-500 hover:text-blue-600"
            >
              {{ problem.title }}
            </NuxtLink>
          </td>
          <td class="p-3">
            <div class="flex gap-2">
              <span
                class="cursor-default px-2 py-0.5 rounded-4xl text-sm inline-block bg-orange-400 text-white font-bold"
                v-for="tag in splitTags(problem.tags)"
              >
              {{ tag }}
              </span>
            </div>
          </td>
          <td class="p-3">
            <div class="flex gap-2">
              <span
                class="cursor-default px-2 py-0.5 rounded-4xl text-sm inline-block bg-orange-400 text-white font-bold"
                v-for="lang in problem.allowed_languages"
              >
              {{ lang }}
              </span>
            </div>
          </td>
          <td class="p-3">
            <span
              v-if="statusMap[problem.uuid] === 'AC'"
              class="cursor-default px-2 py-0.5 rounded-4xl text-sm inline-block bg-green-700 text-white font-bold"
            >
              Accepted
            </span>
            <span
              v-else
              class="cursor-default px-2 py-0.5 rounded-4xl text-sm inline-block bg-sky-400 text-white font-bold"
            >
              尚未通過
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>


<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

definePageMeta({
  middleware: 'problem-auth'
});

const route = useRoute();
const uuid = route.params.uuid;

const folder = ref('');
const endTime = ref('');
const timeLeft = ref('載入中…');
let problems = { data: [] };

try {
  const folderInfo = await $fetch('/api/problem/getProblemFolder?uuid=' + uuid);
  folder.value = folderInfo.data[0].name;
  endTime.value = folderInfo.data[0].endTime;
  problems = await $fetch('/api/problem/getFolderProblems?folder=' + uuid);
} catch (error) {
  const message = error?.data?.statusMessage || error?.statusMessage || '無法載入競賽';
  alert(message);
  await navigateTo('/problem');
}

const endTimeFormatted = computed(() => {
  if (!endTime.value) return '';
  return dayjs.utc(endTime.value).tz('Asia/Taipei').format('YYYY-MM-DD ddd. HH:mm:ss');
});

// 獲取每個題目的提交狀態
const statusMap = ref({});

// 並發載入所有題目的提交狀態
if (problems.data?.length) {
  const results = await Promise.all(
    problems.data.map(async (problem) => {
      try {
        const record = await $fetch('/api/record/getSubmitRecord', {
          params: { problem: problem.uuid, folder: uuid }
        });
        return { uuid: problem.uuid, status: record.status === 'success' ? record.data.status : null };
      } catch {
        return { uuid: problem.uuid, status: null };
      }
    })
  );
  results.forEach(r => statusMap.value[r.uuid] = r.status);
}

// 倒數計時
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

function splitTags(tags) {
  if (!tags) return [];
  return String(tags).split(',').map((tag) => tag.trim()).filter(Boolean);
}

let countdownTimer = null;

onMounted(() => {
  countdownTimer = setInterval(() => {
    timeLeft.value = formatTimeDiff(new Date(endTime.value));
  }, 1000);
});

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer);
});
</script>