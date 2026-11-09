import { defineNuxtPlugin } from '#app'

// MathJax ES 模組
import * as MathJax from 'mathjax/es5/tex-mml-chtml.js'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.provide('MathJax', MathJax)
})
