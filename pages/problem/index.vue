<template>
  <div>
    <h1 class="text-blue-600 text-2xl md:text-3xl font-bold mb-6">競賽列表</h1>
    <table class="w-full">
      <thead class="h-10">
        <tr>
          <th class="text-start p-3">競賽名稱</th>
          <th class="text-start p-3">競賽狀態</th>
          <th class="text-start p-3">開始時間</th>
          <th class="text-start p-3">結束時間</th>
          <th class="text-start p-3">看排名</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="problem in problems.data"
          class="odd:bg-white even:bg-gray-50 border-1 border-gray-200"
        >
          <td class="p-3">
            <NuxtLink :to="'/problem/folder/' + problem.uuid" class="underline text-blue-500 hover:text-blue-600">
              {{ problem.name }}
            </NuxtLink>
          </td>
          <td class="p-3">
            <span
              v-if="dayjs.utc(problem.endTime).tz('Asia/Taipei') > dayjs.utc(new Date()).tz('Asia/Taipei')"
              class="px-2 py-0.5 bg-green-600 text-sm text-white font-bold rounded-full"
            >
              進行中
            </span>
            <span
              v-else
              class="px-2 py-0.5 bg-gray-500 text-sm text-white font-bold rounded-full"
            >
              已結束
            </span>
          </td>
          <td class="p-3">
            {{ dayjs.utc(problem.startTime).tz('Asia/Taipei').format('YYYY-MM-DD ddd. HH:mm:ss') }}
          </td>
          <td class="p-3">
            {{ dayjs.utc(problem.endTime).tz('Asia/Taipei').format('YYYY-MM-DD ddd. HH:mm:ss') }}
          </td>
          <td class="p-3">
            <NuxtLink :to="'/problem/rank/' + problem.uuid">
              <button
                class="cursor-pointer font-bold px-2 py-0.5 rounded-4xl text-sm inline-block bg-orange-400 text-white"
              >
              排名
              </button>
            </NuxtLink>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
dayjs.extend(utc)
dayjs.extend(timezone)

const problems = await $fetch('/api/folder/getFolders');
</script>

<style>

</style>