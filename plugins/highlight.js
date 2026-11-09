import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import python from 'highlight.js/lib/languages/python'
import java from 'highlight.js/lib/languages/java'
import cpp from 'highlight.js/lib/languages/cpp'
import csharp from 'highlight.js/lib/languages/csharp'
import 'highlight.js/styles/github.css'

hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('python', python)
hljs.registerLanguage('java', java)
hljs.registerLanguage('cpp', cpp)
hljs.registerLanguage('csharp', csharp)
hljs.registerLanguage('cs', csharp)

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.provide('hljs', hljs)

  if (process.client) {
    window.hljs = hljs
  }

  nuxtApp.hook('page:finish', () => {
    document.querySelectorAll('pre').forEach((el) => {
      const codeElement = el.querySelector('code');
      if (codeElement) {
        codeElement.removeAttribute('data-highlighted');
        hljs.highlightElement(codeElement);
      } else {
        el.removeAttribute('data-highlighted');
        hljs.highlightElement(el);
      }
    })
  })
})
