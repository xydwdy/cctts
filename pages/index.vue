<script setup lang="ts">
// ============ 配置状态 ============
const apiKey = ref('')
const savedApiKey = ref('')
const voice = ref('白桦')
const pauseMs = ref(800)

// 试听状态
const testText = ref('Legado阅读是一款强大的开源小说阅读器，支持多种朗读引擎。')
const isPlaying = ref(false)
const testError = ref('')

// 导入相关状态
const qrDataUrl = ref('')
const importUrl = ref('')
const importError = ref('')

// ============ MiMo 内置音色选项 ============
const voiceOptions = [
  { id: '冰糖', label: '冰糖 - 女声', emoji: '🌺' },
  { id: '茉莉', label: '茉莉 - 女声', emoji: '🌸' },
  { id: '苏打', label: '苏打 - 男声', emoji: '🌊' },
  { id: '白桦', label: '白桦 - 男声 (推荐)', emoji: '🌲' },
  { id: 'Mia', label: 'Mia - 女声 (英文)', emoji: '🌙' },
  { id: 'Chloe', label: 'Chloe - 女声 (英文)', emoji: '✨' },
  { id: 'Milo', label: 'Milo - 男声 (英文)', emoji: '⭐' },
  { id: 'Dean', label: 'Dean - 男声 (英文)', emoji: '🎩' },
]

// ============ 静音时长选项 ============
const pauseOptions = [200, 300, 400, 500, 600, 700, 800, 900, 1000, 2000, 3000]

// ============ 验证登录 ============
const authLoading = ref(true)

async function checkAuth() {
  const token = localStorage.getItem('cctts_token') || ''
  try {
    const resp = await fetch(`/api/auth-check?token=${encodeURIComponent(token)}`)
    const data = await resp.json()
    if (data.valid) return true
    // 服务器要求密码，跳转登录页
    localStorage.removeItem('cctts_token')
    window.location.href = '/login'
    return false
  } catch {
    window.location.href = '/login'
    return false
  }
}

// ============ 从 localStorage 读取配置 ============
onMounted(async () => {
  const authed = await checkAuth()
  if (!authed) return
  authLoading.value = false
  const saved = localStorage.getItem('cctts_config')
  if (saved) {
    try {
      const config = JSON.parse(saved)
      if (config.apiKey) {
        apiKey.value = config.apiKey
        savedApiKey.value = config.apiKey
      }
      if (config.voice) voice.value = config.voice
      if (config.pauseMs) pauseMs.value = config.pauseMs
    } catch {}
  }
})

// ============ 保存配置 ============
function saveConfig() {
  savedApiKey.value = apiKey.value
  localStorage.setItem('cctts_config', JSON.stringify({
    apiKey: apiKey.value,
    voice: voice.value,
    pauseMs: pauseMs.value,
  }))
  importError.value = ''
}

// ============ 生成 Legado 导入链接（给 Legado 网络导入用） ============
async function generateImportLink() {
  if (!savedApiKey.value) {
    importError.value = '请先保存小米 MiMo API Key'
    return
  }
  importError.value = ''

  const baseUrl = window.location.origin
  let url = `${baseUrl}/api/legado-import?voice=${encodeURIComponent(voice.value)}&pause_ms=${pauseMs.value}`
  url += `&api_key=${encodeURIComponent(savedApiKey.value)}`
  importUrl.value = url

  try {
    await navigator.clipboard.writeText(url)
    importError.value = '✅ 链接已复制到剪贴板'
    setTimeout(() => { importError.value = '' }, 2000)
  } catch {}
}

// ============ 生成 Legado 导入二维码（手机扫码打开引导页） ============
async function generateImportQr() {
  if (!savedApiKey.value) {
    importError.value = '请先保存小米 MiMo API Key'
    return
  }
  importError.value = ''

  const baseUrl = window.location.origin
  let qrContent = `${baseUrl}/import?voice=${encodeURIComponent(voice.value)}&pause_ms=${pauseMs.value}`
  qrContent += `&api_key=${encodeURIComponent(savedApiKey.value)}`

  try {
    const QRCode = (await import('qrcode')).default
    qrDataUrl.value = await QRCode.toDataURL(qrContent, {
      width: 280,
      margin: 2,
      color: {
        dark: '#1e293b',
        light: '#ffffff',
      },
    })
  } catch (err) {
    console.error('QR code generation failed:', err)
    importError.value = '二维码生成失败，请重试'
  }
}

// ============ 试听功能 ============
async function testVoice() {
  if (!testText.value.trim()) return
  if (!savedApiKey.value) {
    testError.value = '请先保存 MiMo API Key'
    return
  }

  isPlaying.value = true
  testError.value = ''

  try {
    const params = new URLSearchParams({
      text: testText.value,
      voice: voice.value,
      api_key: savedApiKey.value,
      pause_ms: pauseMs.value.toString(),
    })
    const response = await fetch(`/api/tts?${params}`)

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(errText || `请求失败 (${response.status})`)
    }

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    audio.onended = () => {
      isPlaying.value = false
      URL.revokeObjectURL(url)
    }
    audio.onerror = () => {
      isPlaying.value = false
      testError.value = '播放失败，请重试'
    }
    audio.play()
  } catch (err: any) {
    testError.value = err.message || '试听失败'
    isPlaying.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
    <!-- Loading state -->
    <div v-if="authLoading" class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <span class="text-4xl">🎙️</span>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-3">加载中...</p>
      </div>
    </div>

    <!-- Main content -->
    <template v-else>
    <!-- Header -->
    <header class="border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
      <div class="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
        <span class="text-3xl">🎙️</span>
        <div>
          <h1 class="text-xl font-bold text-slate-800 dark:text-white">CCTTS</h1>
          <p class="text-xs text-slate-500 dark:text-slate-400">Legado × MiMo TTS 朗读引擎</p>
        </div>
        <div class="ml-auto">
          <a href="https://github.com/xydwdy/cctts" target="_blank"
             class="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            GitHub →
          </a>
        </div>
      </div>
    </header>

    <main class="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <!-- Section 1: API 配置 -->
      <section class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
        <h2 class="text-lg font-semibold text-slate-800 dark:text-white mb-1">📋 API 配置</h2>
        <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">
          在 <a href="https://platform.xiaomimimo.com" target="_blank" class="text-blue-500 hover:underline">小米 MiMo 开放平台</a> 注册并获取 API Key
        </p>
        <div class="flex gap-2">
          <input v-model="apiKey"
                 type="password"
                 placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                 class="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:text-white" />
          <button @click="saveConfig()"
                  :class="savedApiKey ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'"
                  class="px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors">
            {{ savedApiKey ? '✅ 已保存' : '💾 保存' }}
          </button>
        </div>
      </section>

      <!-- Section 2: 音色设置 -->
      <section class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
        <h2 class="text-lg font-semibold text-slate-800 dark:text-white mb-4">🎤 音色选择</h2>
        <select v-model="voice"
                class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:text-white">
          <option v-for="opt in voiceOptions" :key="opt.id" :value="opt.id">
            {{ opt.emoji }} {{ opt.label }}
          </option>
        </select>
      </section>

      <!-- Section 3: 静音时长 -->
      <section class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
        <h2 class="text-lg font-semibold text-slate-800 dark:text-white mb-1">⏸️ 静音时长</h2>
        <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">每段朗读末尾追加的静音时长，让句间更有节奏感</p>

        <select v-model="pauseMs"
                class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:text-white">
          <option v-for="opt in pauseOptions" :key="opt" :value="opt">
            {{ opt }} ms
          </option>
        </select>
      </section>

      <!-- Section 4: Legado 一键导入 -->
      <section class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
        <h2 class="text-lg font-semibold text-slate-800 dark:text-white mb-4">📲 Legado 一键导入</h2>

        <div class="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 text-center">
          <div class="flex gap-3 mb-4">
            <button @click="generateImportLink()"
                    class="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
              📋 生成导入链接
            </button>
            <button @click="generateImportQr()"
                    class="flex-1 py-3 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
              📱 生成二维码
            </button>
          </div>

          <div v-if="importError && !importUrl && !qrDataUrl" class="text-sm text-red-500 mb-3">{{ importError }}</div>
          <div v-if="importError && (importUrl || qrDataUrl)" class="text-sm text-green-500 mb-3">{{ importError }}</div>

          <div v-if="importUrl" class="mb-3">
            <div class="text-xs text-slate-500 dark:text-slate-400 mb-2">生成的 Legado 网络导入链接（已复制到剪贴板）：</div>
            <pre class="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-600 overflow-x-auto whitespace-pre-wrap break-all">{{ importUrl }}</pre>
          </div>

          <div v-if="qrDataUrl" class="flex justify-center">
            <img :src="qrDataUrl" alt="Legado 导入二维码"
                 class="rounded-lg border border-slate-200 dark:border-slate-600" />
          </div>
        </div>
      </section>

      <!-- Section 5: 试听 -->
      <section class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
        <h2 class="text-lg font-semibold text-slate-800 dark:text-white mb-4">🔊 试听效果</h2>
        <textarea v-model="testText"
                  rows="3"
                  placeholder="输入要试听的文本..."
                  class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:text-white placeholder:text-slate-400 resize-none mb-3"></textarea>
        <div class="flex items-center gap-3">
          <button @click="testVoice"
                  :disabled="isPlaying"
                  :class="isPlaying ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'"
                  class="px-5 py-2 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
            <span>{{ isPlaying ? '⏳ 生成中...' : '🔊 试听' }}</span>
          </button>
          <span v-if="testError" class="text-sm text-red-500">{{ testError }}</span>
        </div>
      </section>

      <!-- Footer -->
      <footer class="text-center text-xs text-slate-400 dark:text-slate-500 pb-8">
        基于小米 MiMo-V2.5-TTS 模型 · 开源在 GitHub
      </footer>
    </main>
    </template>
  </div>
</template>

<style>
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans SC', sans-serif;
}
input[type="password"]::placeholder {
  font-size: 13px;
}
</style>