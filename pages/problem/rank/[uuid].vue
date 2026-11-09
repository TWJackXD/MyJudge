<template>
  <div>
    <h1 class="text-blue-600 text-2xl md:text-3xl font-bold mb-6">競賽排名</h1>

    <table class="w-full table-fixed">
      <thead class="h-10">
        <tr>
          <th class="px-3 text-start w-[55%]">競賽名稱</th>
          <th class="px-3 text-start w-[30%]">結束時間</th>
          <th class="px-3 text-start w-[15%]"></th>
        </tr>
      </thead>
      <tbody>
        <tr class="bg-gray-100 border-gray-300 border">
          <td class="px-3 py-1.5">
            <NuxtLink
              :to="'/problem/folder/' + uuid"
              class="underline text-blue-500 hover:text-blue-600"
            >
              {{ folderName || "載入中…" }}
            </NuxtLink>
          </td>
          <td class="px-3 py-1.5">
            {{ endTime || "" }}
          </td>
          <td class="px-3 py-1.5">
            <button
              type="button"
              class="underline text-blue-500 hover:text-blue-600 cursor-pointer"
              @click="loadRank"
            >
              刷新
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- 統計圖表 -->
    <div class="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- 各考生完成題數分布 -->
      <div class="bg-white border border-gray-300 rounded-lg p-4">
        <h2 class="text-lg font-bold mb-4 text-center">各考生完成題數分布</h2>
        <div class="w-full h-60 overflow-hidden">
          <canvas ref="completedCountChartRef"></canvas>
        </div>
      </div>

      <!-- 各題目答對人數分布 -->
      <div class="bg-white border border-gray-300 rounded-lg p-4">
        <h2 class="text-lg font-bold mb-4 text-center">各題目答對人數分布</h2>
        <div class="w-full h-60 overflow-hidden">
          <canvas ref="problemSolvedChartRef"></canvas>
        </div>
      </div>
    </div>

    <!-- 排名表格 -->
    <div class="mt-8">
      <table class="w-full table-fixed">
        <thead class="h-10">
          <tr>
            <th class="px-3 text-start w-[8%]">排名</th>
            <th class="px-3 text-start w-[14%]">帳號</th>
            <th class="px-3 text-start w-[14%]">姓名</th>
            <th class="px-3 text-start w-[10%]">班別</th>
            <th class="px-3 text-start w-[30%]">題號[錯誤次數]</th>
            <th class="px-3 text-start w-[14%]">每題平均完成時間(分鐘)</th>
            <th class="px-3 text-start w-[10%]">正確題數/提交總次數</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rankRows" :key="row.rank" class="border-gray-300 border-y-1">
            <td class="px-3 py-1.5">{{ row.rank }}</td>
            <td class="px-3 py-1.5">{{ row.account }}</td>
            <td class="px-3 py-1.5">{{ row.name }}</td>
            <td class="px-3 py-1.5">{{ row.class }}</td>
            <td class="px-3 py-1.5">
              <div v-for="(stat, idx) in (row.problemStats || [])" :key="idx" class="inline-block mr-1 mb-1">
                <span
                  class="font-bold cursor-default px-2 py-0.5 rounded-4xl text-sm inline-block text-white"
                  :class="stat.isAc ? 'bg-green-700' : 'bg-yellow-500'"
                >
                  {{ stat.text }}
                </span>
              </div>
            </td>
            <td class="px-3 py-1.5">{{ row.avgMinutesPerSolved }}</td>
            <td class="px-3 py-1.5">{{ row.correctOverTotal }}</td>
          </tr>
          <tr v-if="rankRows.length === 0">
            <td class="px-3 py-3 text-gray-500" colspan="7">尚無提交資料</td>
          </tr>
        </tbody>
      </table>
    </div>



  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from "vue";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

dayjs.extend(utc);
dayjs.extend(timezone);

definePageMeta({ middleware: "problem-auth" });

const route = useRoute();
const uuid = route.params.uuid;

const folderName = ref("");
const endTime = ref("");
const rankRows = ref([]);
const completedCountChartRef = ref(null);
const problemSolvedChartRef = ref(null);
let completedCountChart = null;
let problemSolvedChart = null;

const folderInfo = await $fetch("/api/problem/getProblemFolder?uuid=" + uuid);
const data = folderInfo?.data?.[0] || {};
folderName.value = data.name || "";
endTime.value =
  dayjs
    .utc(data.endTime)
    .tz("Asia/Taipei")
    .format("YYYY-MM-DD ddd. HH:mm:ss") || "";

async function loadRank() {
  try {
    const res = await $fetch(`/api/record/getFolderRank?folder=${uuid}`);
    rankRows.value = res?.data || [];
    await nextTick();
    updateCharts();
  } catch (e) {
    rankRows.value = [];
  }
}

// 初始化載入
await loadRank();

// 計算各考生完成題數分布
function calculateCompletedCountDistribution() {
  if (rankRows.value.length === 0) return { labels: [], data: [] };

  const maxSolved = Math.max(...rankRows.value.map(r => r.correctCount || 0));
  const labels = Array.from({ length: maxSolved + 1 }, (_, i) => String(i));
  const counts = new Array(labels.length).fill(0);

  rankRows.value.forEach(row => {
    const c = row.correctCount || 0;
    counts[c] = (counts[c] || 0) + 1;
  });

  return { labels, data: counts };
}

// 計算各題目答對人數分布
function calculateProblemSolvedDistribution() {
  if (rankRows.value.length === 0) {
    return { labels: [], data: [] };
  }
  
  // 統計每個題目有多少人答對
  const problemSolvedCounts = {};
  
  rankRows.value.forEach(row => {
    if (row.problemStats && Array.isArray(row.problemStats)) {
      row.problemStats.forEach(stat => {
        // 從 stat.text 中提取題號（例如 "q01[0]" -> "q01"）
        const problemMatch = stat.text.match(/^(q\d+)/);
        if (problemMatch) {
          const problemKey = problemMatch[1];
          if (!problemSolvedCounts[problemKey]) {
            problemSolvedCounts[problemKey] = 0;
          }
          if (stat.isAc) {
            problemSolvedCounts[problemKey]++;
          }
        }
      });
    }
  });
  
  const entries = Object.entries(problemSolvedCounts)
    .map(([key, val]) => ({
      key,
      val,
      n: Number(key.replace(/^q0*/, '')) || 0
    }))
    .sort((a, b) => a.n - b.n);

  const labels = entries.map(e => `q${e.n}`);
  const data = entries.map(e => e.val);

  return { labels, data };
}

// 更新圖表
function updateCharts() {
  // 銷毀舊圖表
  if (completedCountChart) {
    completedCountChart.destroy();
    completedCountChart = null;
  }
  if (problemSolvedChart) {
    problemSolvedChart.destroy();
    problemSolvedChart = null;
  }
  
  // 創建各考生完成題數分布圖表
  if (completedCountChartRef.value) {
    const completedData = calculateCompletedCountDistribution();
    const maxCompleted = completedData.data.length ? Math.max(...completedData.data) : 0;
    // Y 軸步進為 5，但頂直接使用目前最大值（即使 < 5）
    const completedYMax = maxCompleted > 0 ? maxCompleted : 5;
    completedCountChart = new Chart(completedCountChartRef.value, {
      type: 'bar',
      data: {
        labels: completedData.labels,
        datasets: [{
          label: '人數',
          data: completedData.data,
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 5,
              precision: 0,
              callback: (val) => `${val}`
            },
            max: completedYMax
          },
          x: {
            ticks: { autoSkip: false }
          }
        }
      }
    });
  }
  
  // 創建各題目答對人數分布圖表
  if (problemSolvedChartRef.value) {
    const problemData = calculateProblemSolvedDistribution();
    const maxSolvedPeople = problemData.data.length ? Math.max(...problemData.data) : 0;
    // Y 軸步進為 10，但頂直接使用目前最大值（即使 < 10）
    const problemYMax = maxSolvedPeople > 0 ? maxSolvedPeople : 10;
    problemSolvedChart = new Chart(problemSolvedChartRef.value, {
      type: 'bar',
      data: {
        labels: problemData.labels,
        datasets: [{
          label: '人數',
          data: problemData.data,
          backgroundColor: 'rgba(34, 197, 94, 0.6)',
          borderColor: 'rgba(34, 197, 94, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 10,
              precision: 0,
              callback: (val) => `${val}`
            },
            max: problemYMax
          },
          x: {
            ticks: { autoSkip: false }
          }
        }
      }
    });
  }
}

// 監聽 rankRows 變化，自動更新圖表
watch(rankRows, () => {
  nextTick(() => {
    updateCharts();
  });
}, { deep: true });

onMounted(() => {
  nextTick(() => {
    updateCharts();
  });
});
</script>