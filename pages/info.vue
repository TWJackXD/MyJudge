<template>
  <div>
    <h1 class="text-blue-600 text-2xl md:text-3xl font-bold mb-6">說明</h1>

    <section class="mb-10">
      <h2 class="text-2xl font-bold mb-2">本平臺</h2>
      <p>
        MyJudge 是一套線上程式評測平臺，可用於課程練習、作業繳交或競賽評分。
        使用者依題目要求撰寫程式並提交後，系統會以測資自動比對輸出結果，並回報是否通過。
      </p>
      <ul class="list-disc list-inside mt-3 space-y-1 text-gray-800">
        <li>登入後從「題目」進入競賽，閱讀題目內容與允許語言。</li>
        <li>在編輯器撰寫程式，可先儲存草稿，再提交批改。</li>
        <li>通過表示全部測資輸出正確；未通過時可依狀態訊息修正後再交。</li>
        <li>排名依完成題數與完成時間計算，提交錯誤不另扣時間。</li>
        <li>「課程」頁可瀏覽教材；實際可見內容依權限設定而定。</li>
      </ul>
    </section>

    <section id="language-guide">
      <h2 class="text-2xl font-bold mb-4">語言語法說明</h2>

      <div class="flex flex-wrap gap-2 border-b border-gray-200 mb-5" role="tablist">
        <button
          v-for="tab in languageTabs"
          :key="tab.id"
          type="button"
          role="tab"
          class="px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer"
          :class="activeTab === tab.id
            ? 'border-blue-600 text-blue-700'
            : 'border-transparent text-gray-500 hover:text-gray-800'"
          :aria-selected="activeTab === tab.id"
          @click.prevent="setActiveTab(tab.id)"
        >
          {{ tab.label }}
        </button>
      </div>

      <div v-if="currentTab" class="space-y-6">
        <div>
          <h3 class="text-xl font-semibold mb-2">什麼是 {{ currentTab.label }}？</h3>
          <p class="text-gray-800">{{ currentTab.intro }}</p>
        </div>

        <div>
          <h3 class="text-lg font-semibold mb-2">基本程式骨架</h3>
          <pre><code ref="boilerplateCode" :class="'language-' + currentTab.highlight">{{ currentTab.boilerplate }}</code></pre>
        </div>

        <div>
          <h3 class="text-lg font-semibold mb-2">基本輸入與輸出</h3>
          <ul class="list-disc list-inside space-y-1 text-gray-800">
            <li v-for="(item, index) in currentTab.ioTips" :key="index">
              <code v-if="item.code">{{ item.code }}</code>
              <template v-if="item.code">：</template>{{ item.text }}
            </li>
          </ul>
          <pre class="mt-3"><code ref="exampleCode" :class="'language-' + currentTab.highlight">{{ currentTab.ioExample }}</code></pre>
        </div>

        <div>
          <h3 class="text-lg font-semibold mb-2">評測注意事項</h3>
          <ul class="list-disc list-inside space-y-1 text-gray-800">
            <li v-for="(note, index) in currentTab.notes" :key="index">{{ note }}</li>
          </ul>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
const { $hljs } = useNuxtApp();
const activeTab = ref('cpp');
const boilerplateCode = ref(null);
const exampleCode = ref(null);

const languageTabs = [
  {
    id: 'cpp',
    label: 'C++',
    highlight: 'cpp',
    intro: 'C++ 是高效能的編譯型語言，常用於演算法與系統程式。本平臺請撰寫含 main 進入點的主控台程式，並透過標準輸入輸出與測資互動。',
    boilerplate: `#include <iostream>
using namespace std;

int main() {
    // 在這裡撰寫你的程式
    return 0;
}`,
    ioTips: [
      { code: 'cin', text: '從標準輸入讀取資料。' },
      { code: 'cout', text: '輸出到標準輸出。' },
      { code: 'endl 或 \\n', text: '換行；輸出格式需與測資完全一致。' }
    ],
    ioExample: `#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    cout << n * 2 << endl;
    return 0;
}`,
    notes: [
      '記得引入需要的標頭檔，例如 <iostream>、<string>、<vector>。',
      '輸出不可有多餘空白或提示文字，除非題目有明確要求。',
      '多組測資時，請依題意處理輸入結束條件。'
    ]
  },
  {
    id: 'csharp',
    label: 'C#',
    highlight: 'csharp',
    intro: 'C# 是微軟推出的物件導向語言，適合撰寫結構清楚的主控台程式。本平臺請提供含 Main 進入點的程式。',
    boilerplate: `using System;

class Program
{
    static void Main(string[] args)
    {
        // 在這裡撰寫你的程式
    }
}`,
    ioTips: [
      { code: 'Console.ReadLine()', text: '讀取一行輸入。' },
      { code: 'Console.WriteLine()', text: '輸出一行文字並換行。' },
      { code: 'int.Parse() / double.Parse()', text: '把文字轉成數字。' }
    ],
    ioExample: `string line = Console.ReadLine();
int n = int.Parse(line);
Console.WriteLine(n * 2);`,
    notes: [
      '輸出需與測資一致，包含數字、文字與換行。',
      '讀取多個數字時，可用 Split() 搭配 Parse。',
      '請避免輸出除答案以外的除錯訊息。'
    ]
  },
  {
    id: 'java',
    label: 'Java',
    highlight: 'java',
    intro: 'Java 是跨平台的物件導向語言。本平臺請使用 public class Main，並在 main 方法中撰寫程式邏輯。',
    boilerplate: `import java.util.Scanner;

public class Main {
  public static void main(String[] args) {
    // 在這裡撰寫你的程式
  }
}`,
    ioTips: [
      { code: 'Scanner', text: '常用於讀取標準輸入。' },
      { code: 'nextInt() / next()', text: '讀取整數或字串。' },
      { code: 'System.out.println()', text: '輸出並換行。' }
    ],
    ioExample: `import java.util.Scanner;

public class Main {
  public static void main(String[] args) {
    Scanner sc = new Scanner(System.in);
    int n = sc.nextInt();
    System.out.println(n * 2);
  }
}`,
    notes: [
      '主類別名稱請使用 Main，以符合評測環境。',
      '使用 Scanner 後可視需要關閉，但通常不影響評測結果。',
      '注意輸出格式，不要加入題目未要求的提示字。'
    ]
  },
  {
    id: 'python',
    label: 'Python',
    highlight: 'python',
    intro: 'Python 語法簡潔，適合快速實作題目。本平臺使用標準輸入輸出進行評測，不需特別宣告進入點。',
    boilerplate: `# 直接從第一行開始撰寫即可
# 範例：讀取輸入並輸出結果`,
    ioTips: [
      { code: 'input()', text: '讀取一行字串。' },
      { code: 'int(input())', text: '讀取一行並轉成整數。' },
      { code: 'print()', text: '輸出結果；預設會換行。' }
    ],
    ioExample: `n = int(input())
print(n * 2)`,
    notes: [
      '同一行多個數字可用 map(int, input().split()) 處理。',
      'print 預設會換行，若需同一行輸出可使用 end= 參數。',
      '請勿輸出除答案外的提示或除錯內容。'
    ]
  }
];

const currentTab = computed(() =>
  languageTabs.find((tab) => tab.id === activeTab.value) || languageTabs[0]
);

function setActiveTab(id) {
  activeTab.value = id;
}

function highlightCode() {
  if (!process.client || !$hljs) return;

  [boilerplateCode.value, exampleCode.value].forEach((el) => {
    if (!el) return;
    try {
      el.removeAttribute('data-highlighted');
      el.classList.remove('hljs');
      $hljs.highlightElement(el);
    } catch (error) {
      console.warn('highlight failed:', error);
    }
  });
}

onMounted(async () => {
  await nextTick();
  highlightCode();
});

watch(activeTab, async () => {
  await nextTick();
  highlightCode();
});
</script>
