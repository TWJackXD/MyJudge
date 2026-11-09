import * as monaco from 'monaco-editor'

export default defineNuxtPlugin(() => {
  // 註冊 Java 補全提供者
  monaco.languages.registerCompletionItemProvider('java', {
    provideCompletionItems: (model, position) => {
      const suggestions = [
        // ===== 基本型別 =====
        {
          label: 'int',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'int',
          documentation: '32位元整數型別',
        },
        {
          label: 'long',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'long',
          documentation: '64位元整數型別',
        },
        {
          label: 'short',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'short',
          documentation: '16位元整數型別',
        },
        {
          label: 'byte',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'byte',
          documentation: '8位元整數型別',
        },
        {
          label: 'float',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'float',
          documentation: '32位元浮點數型別',
        },
        {
          label: 'double',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'double',
          documentation: '64位元浮點數型別',
        },
        {
          label: 'boolean',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'boolean',
          documentation: '布林型別 (true/false)',
        },
        {
          label: 'char',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'char',
          documentation: '字元型別',
        },
        {
          label: 'String',
          kind: monaco.languages.CompletionItemKind.Class,
          insertText: 'String',
          documentation: '字串類別',
        },
        {
          label: 'void',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'void',
          documentation: '無回傳值',
        },

        // ===== 修飾詞 =====
        {
          label: 'public',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'public',
          documentation: '公開存取修飾詞',
        },
        {
          label: 'private',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'private',
          documentation: '私有存取修飾詞',
        },
        {
          label: 'protected',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'protected',
          documentation: '保護存取修飾詞',
        },
        {
          label: 'static',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'static',
          documentation: '靜態修飾詞',
        },
        {
          label: 'final',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'final',
          documentation: '不可變修飾詞',
        },
        {
          label: 'abstract',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'abstract',
          documentation: '抽象修飾詞',
        },

        // ===== 類別相關 =====
        {
          label: 'class',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'class ${1:ClassName} {\n\t$0\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: '定義類別',
        },
        {
          label: 'interface',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'interface ${1:InterfaceName} {\n\t$0\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: '定義介面',
        },
        {
          label: 'extends',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'extends',
          documentation: '繼承類別',
        },
        {
          label: 'implements',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'implements',
          documentation: '實作介面',
        },
        {
          label: 'new',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'new',
          documentation: '建立物件實例',
        },
        {
          label: 'this',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'this',
          documentation: '目前物件參考',
        },
        {
          label: 'super',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'super',
          documentation: '父類別參考',
        },

        // ===== 控制流程 =====
        {
          label: 'if',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'if (${1:condition}) {\n\t$0\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'If 條件判斷',
        },
        {
          label: 'if else',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'if (${1:condition}) {\n\t${2}\n} else {\n\t$0\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'If-Else 條件判斷',
        },
        {
          label: 'else',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'else',
          documentation: 'Else 條件',
        },
        {
          label: 'else if',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'else if (${1:condition}) {\n\t$0\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Else-If 條件判斷',
        },
        {
          label: 'switch',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'switch (${1:variable}) {\n\tcase ${2:value1}:\n\t\t${3}\n\t\tbreak;\n\tcase ${4:value2}:\n\t\t${5}\n\t\tbreak;\n\tdefault:\n\t\t$0\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Switch 多重條件判斷',
        },
        {
          label: 'case',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'case ${1:value}:\n\t${2}\n\tbreak;$0',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Switch case 分支',
        },
        {
          label: 'default',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'default:\n\t$0',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Switch 預設分支',
        },
        {
          label: 'break',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'break;',
          documentation: '跳出迴圈或 switch',
        },
        {
          label: 'continue',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'continue;',
          documentation: '繼續下一次迴圈',
        },
        {
          label: 'return',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'return',
          documentation: '回傳值',
        },

        // ===== 迴圈 =====
        {
          label: 'for',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'for (int ${1:i} = 0; ${1:i} < ${2:length}; ${1:i}++) {\n\t$0\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'For 迴圈',
        },
        {
          label: 'for each',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'for (${1:Type} ${2:item} : ${3:collection}) {\n\t$0\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Enhanced For 迴圈 (for-each)',
        },
        {
          label: 'while',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'while (${1:condition}) {\n\t$0\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'While 迴圈',
        },
        {
          label: 'do while',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'do {\n\t${1}\n} while (${2:condition});$0',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Do-While 迴圈',
        },

        // ===== 函式定義 =====
        {
          label: 'main method',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'public static void main(String[] args) {\n\t$0\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Java 主程式進入點',
        },
        {
          label: 'method',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: '${1:public} ${2:void} ${3:methodName}(${4}) {\n\t$0\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: '定義方法',
        },
        {
          label: 'constructor',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'public ${1:ClassName}(${2}) {\n\t$0\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: '建構子',
        },

        // ===== 常用輸出 =====
        {
          label: 'System.out.println',
          kind: monaco.languages.CompletionItemKind.Method,
          insertText: 'System.out.println(${1:message});$0',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: '輸出到控制台並換行',
        },
        {
          label: 'System.out.print',
          kind: monaco.languages.CompletionItemKind.Method,
          insertText: 'System.out.print(${1:message});$0',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: '輸出到控制台不換行',
        },
        {
          label: 'System.out.printf',
          kind: monaco.languages.CompletionItemKind.Method,
          insertText: 'System.out.printf("${1:format}", ${2:args});$0',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: '格式化輸出',
        },

        // ===== 例外處理 =====
        {
          label: 'try catch',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'try {\n\t${1}\n} catch (${2:Exception} ${3:e}) {\n\t${4}\n}$0',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Try-Catch 例外處理',
        },
        {
          label: 'try catch finally',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'try {\n\t${1}\n} catch (${2:Exception} ${3:e}) {\n\t${4}\n} finally {\n\t${5}\n}$0',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Try-Catch-Finally 例外處理',
        },
        {
          label: 'throw',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'throw',
          documentation: '拋出例外',
        },
        {
          label: 'throws',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'throws',
          documentation: '宣告可能拋出的例外',
        },

        // ===== 布林值 =====
        {
          label: 'true',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'true',
          documentation: '布林值：真',
        },
        {
          label: 'false',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'false',
          documentation: '布林值：假',
        },
        {
          label: 'null',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'null',
          documentation: '空值',
        },

        // ===== 常用類別 =====
        {
          label: 'Scanner',
          kind: monaco.languages.CompletionItemKind.Class,
          insertText: 'Scanner',
          documentation: 'java.util.Scanner - 輸入掃描器',
        },
        {
          label: 'ArrayList',
          kind: monaco.languages.CompletionItemKind.Class,
          insertText: 'ArrayList',
          documentation: 'java.util.ArrayList - 動態陣列',
        },
        {
          label: 'HashMap',
          kind: monaco.languages.CompletionItemKind.Class,
          insertText: 'HashMap',
          documentation: 'java.util.HashMap - 雜湊對應表',
        },
        {
          label: 'Math',
          kind: monaco.languages.CompletionItemKind.Class,
          insertText: 'Math',
          documentation: 'java.lang.Math - 數學運算類別',
        },

        // ===== 其他關鍵字 =====
        {
          label: 'import',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'import ${1:package};$0',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: '匯入套件',
        },
        {
          label: 'package',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'package ${1:name};$0',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: '定義套件',
        },
        {
          label: 'instanceof',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'instanceof',
          documentation: '檢查物件型別',
        },
      ]
      
      return { suggestions }
    }
  })

  // 註冊 Hover 提示
  monaco.languages.registerHoverProvider('java', {
    provideHover: (model, position) => {
      const word = model.getWordAtPosition(position)
      if (word) {
        const hoverTexts = {
          'int': '32位元整數型別 (-2,147,483,648 到 2,147,483,647)',
          'long': '64位元整數型別',
          'short': '16位元整數型別',
          'byte': '8位元整數型別',
          'float': '32位元浮點數型別',
          'double': '64位元浮點數型別',
          'boolean': '布林型別，值為 true 或 false',
          'char': '16位元 Unicode 字元',
          'String': 'Java 字串類別，不可變的字元序列',
          'void': '表示方法不回傳任何值',
          'static': '靜態成員，屬於類別而非實例',
          'final': '宣告常數或防止繼承/覆寫',
          'public': '公開存取，任何類別都可存取',
          'private': '私有存取，只有同類別可存取',
          'protected': '保護存取，同套件或子類別可存取',
          'return': '從方法回傳值',
          'break': '跳出迴圈或 switch 語句',
          'continue': '跳過目前迴圈迭代，繼續下一次',
          'switch': '多重條件判斷語句',
          'case': 'switch 語句中的分支',
          'default': 'switch 語句的預設分支',
          'System': 'Java 系統類別，提供標準輸入輸出',
          'println': '輸出並換行',
          'Scanner': '用於讀取各種型別輸入的類別',
          'ArrayList': '可動態調整大小的陣列',
          'HashMap': '鍵值對的集合',
        }
        
        if (hoverTexts[word.word]) {
          return {
            contents: [{ value: `**${word.word}**\n\n${hoverTexts[word.word]}` }]
          }
        }
      }
      return null
    }
  })
})