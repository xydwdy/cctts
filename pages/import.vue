<script setup lang="ts">
// ============ URL 参数解析 ============
const voice = ref('')
const apiKey = ref('')
const importUrl = ref('')
const copyStatus = ref<'idle' | 'success' | 'error'>('idle')

onMounted(() => {
  voice.value = (useRoute().query.voice as string) || '白桦'
  apiKey.value = (useRoute().query.api_key as string) || ''

  // Build the network import URL for Legado
  const baseUrl = window.location.origin
  const pauseMs = (useRoute().query.pause_ms as string) || '800'
  let url = `${baseUrl}/api/legado-import?voice=${encodeURIComponent(voice.value)}&pause_ms=${pauseMs}`
  if (apiKey.value) {
    url += `&api_key=${encodeURIComponent(apiKey.value)}`
  }
  importUrl.value = url

  // No auto-copy - requires user gesture. Show prompt to click button.
  copyStatus.value = 'idle'
})

// ============ 复制到剪贴板（兼容 HTTP 和 HTTPS） ============
async function copyToClipboard() {
  copyStatus.value = 'idle'

  try {
    // Method 1: Modern clipboard API (requires HTTPS or localhost)
    await navigator.clipboard.writeText(importUrl.value)
    copyStatus.value = 'success'
  } catch {
    // Method 2: Fallback using execCommand (works on HTTP, needs user gesture)
    try {
      const textarea = document.createElement('textarea')
      textarea.value = importUrl.value
      textarea.style.position = 'fixed'
      textarea.style.left = '-9999px'
      textarea.style.top = '-9999px'
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      textarea.setSelectionRange(0, importUrl.value.length)
      const ok = document.execCommand('copy')
      document.body.removeChild(textarea)
      if (ok) {
        copyStatus.value = 'success'
      } else {
        copyStatus.value = 'error'
      }
    } catch {
      copyStatus.value = 'error'
    }
  }

  // Auto-reset success/error after 3 seconds
  if (copyStatus.value === 'success') {
    setTimeout(() => { copyStatus.value = 'idle' }, 3000)
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
    <!-- Header -->
    <header class="border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
      <div class="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
        <span class="text-3xl">🎙️</span>
        <div>
          <h1 class="text-lg font-bold text-slate-800 dark:text-white">CCTTS</h1>
          <p class="text-xs text-slate-500 dark:text-slate-400">Legado × MiMo TTS 朗读引擎</p>
        </div>
      </div>
    </header>

    <main class="max-w-lg mx-auto px-4 py-6 space-y-5">

      <!-- Status banner -->
      <div v-if="copyStatus === 'success'"
           class="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl p-4 text-center">
        <div class="text-3xl mb-2">✅</div>
        <p class="text-sm font-medium text-green-700 dark:text-green-300">导入链接已复制到剪贴板</p>
      </div>

      <div v-else-if="copyStatus === 'error'"
           class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4 text-center">
        <div class="text-3xl mb-2">❌</div>
        <p class="text-sm font-medium text-red-700 dark:text-red-300">复制失败，请手动框选下方链接并复制</p>
      </div>

      <div v-else
           class="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-center">
        <div class="text-3xl mb-2">📋</div>
        <p class="text-sm font-medium text-blue-700 dark:text-blue-300">点击下方按钮复制导入链接</p>
      </div>

      <!-- Import URL -->
      <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
        <h2 class="text-sm font-semibold text-slate-800 dark:text-white mb-2">📝 网络导入链接</h2>
        <p class="text-xs text-slate-500 dark:text-slate-400 mb-2">在 Legado 中点击「网络导入」并粘贴此链接：</p>
        <pre class="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 p-3 rounded border border-slate-200 dark:border-slate-600 overflow-x-auto whitespace-pre-wrap break-all select-all">{{ importUrl }}</pre>

        <button @click="copyToClipboard"
                :disabled="copyStatus === 'success'"
                :class="copyStatus === 'error' ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'"
                class="mt-3 w-full py-3 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
          <span v-if="copyStatus === 'success'">✅ 已复制</span>
          <span v-else-if="copyStatus === 'error'">❌ 复制失败，再试一次</span>
          <span v-else>📋 复制链接</span>
        </button>
      </div>

      <!-- Step-by-step guide -->
      <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
        <h2 class="text-sm font-semibold text-slate-800 dark:text-white mb-3">📖 在 Legado 中导入</h2>

        <div class="space-y-4">
          <div class="flex gap-3">
            <span class="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center">1</span>
            <div class="text-sm text-slate-600 dark:text-slate-300">
              打开 <strong>Legado 阅读 App</strong>，进入
              <span class="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-xs font-mono">设置</span>
              →
              <span class="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-xs font-mono">朗读设置</span>
              →
              <span class="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-xs font-mono">朗读引擎</span>
            </div>
          </div>

          <div class="flex gap-3">
            <span class="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center">2</span>
            <div class="text-sm text-slate-600 dark:text-slate-300">
              点击右上角的
              <span class="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-xs font-mono">网络导入</span>
              按钮
            </div>
          </div>

          <div class="flex gap-3">
            <span class="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center">3</span>
            <div class="text-sm text-slate-600 dark:text-slate-300">
              <strong>粘贴链接</strong>（已自动复制到剪贴板），Legado 会自动解析并添加朗读引擎
            </div>
          </div>
        </div>
      </div>

      <!-- Security notice -->
      <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl p-4">
        <div class="flex gap-2">
          <span class="text-lg">🔒</span>
          <div>
            <p class="text-sm font-medium text-amber-800 dark:text-amber-200">安全提示</p>
            <p class="text-xs text-amber-700 dark:text-amber-300 mt-1">
              此链接包含你的小米 MiMo API Key。请勿将此链接分享给他人，以免 API Key 泄露。
              如需分享给其他设备使用，请在管理页面重新配置。
            </p>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <footer class="text-center text-xs text-slate-400 dark:text-slate-500 pb-4">
        基于小米 MiMo-V2.5-TTS 模型
      </footer>
    </main>
  </div>
</template>

<style>
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans SC', sans-serif;
}
</style>