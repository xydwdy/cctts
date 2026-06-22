<script setup lang="ts">
const password = ref('')
const error = ref('')
const loading = ref(false)
const checkingAuth = ref(true)

onMounted(async () => {
  // If no password configured, redirect to home
  try {
    const resp = await fetch('/api/auth-check')
    const data = await resp.json()
    if (data.valid) {
      window.location.href = '/'
      return
    }
  } catch {}
  checkingAuth.value = false
})

async function doLogin() {
  error.value = ''
  loading.value = true

  try {
    const resp = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: password.value }),
    })

    if (resp.status === 429) {
      const errData = await resp.json()
      error.value = errData?.message || '登录过于频繁，请稍后重试'
      password.value = ''
      loading.value = false
      return
    }

    if (!resp.ok) {
      const errData = await resp.json()
      error.value = errData?.message || '密码错误'
      password.value = ''
      loading.value = false
      return
    }

    const data = await resp.json()
    // Token is now stored server-side as httpOnly Cookie only
    // (set by auth.post.ts), no need to store in localStorage
    window.location.href = '/'
  } catch {
    error.value = '网络错误，请重试'
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
    <div v-if="checkingAuth" class="text-center">
      <span class="text-4xl">🎙️</span>
      <p class="text-sm text-slate-500 dark:text-slate-400 mt-3">加载中...</p>
    </div>
    <div v-else class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 w-full max-w-sm mx-4">
      <div class="text-center mb-6">
        <span class="text-4xl">🎙️</span>
        <h1 class="text-xl font-bold text-slate-800 dark:text-white mt-2">CCTTS</h1>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">请输入访问密码</p>
      </div>

      <form @submit.prevent="doLogin" class="space-y-4">
        <input v-model="password"
               type="password"
               placeholder="输入密码"
               autofocus
               class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:text-white text-center" />

        <button type="submit"
                :disabled="loading"
                :class="loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'"
                class="w-full py-2 text-white text-sm font-medium rounded-lg transition-colors">
          {{ loading ? '验证中...' : '进入' }}
        </button>

        <p v-if="error" class="text-sm text-red-500 text-center">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

