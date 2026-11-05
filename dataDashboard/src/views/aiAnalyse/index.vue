<template>
  <div class="ai-analyse" :class="{ 'is-guest': isGuest }">
    <!-- 左侧分析栏 -->
    <aside class="ai-rail">
      <div class="ai-rail__brand">
        <span class="ai-rail__logo">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <rect width="32" height="32" rx="10" fill="#007C77" />
            <path d="M9.3 21.8v-3.9M14 21.8v-7.5M18.7 21.8V9.7" stroke="#DFF7F4" stroke-width="2.4"
              stroke-linecap="round" />
            <circle cx="25" cy="8.2" r="2.9" fill="#00BEBD" stroke="#E7F7F5" stroke-width="1.1" />
          </svg>
        </span>
        <span class="ai-rail__name">JobVision</span>
      </div>
      <p class="ai-rail__sub">AI 分析</p>

      <!-- 新对话：清空当前工作区，开始一轮新的分析 / 对话 -->
      <div v-if="!isGuest" class="ai-rail__new">
        <el-button class="ai-rail__new-btn" :icon="Plus" @click="startNew">新对话</el-button>
      </div>

      <div class="ai-rail__section">
        <p class="ai-rail__label">分析方式</p>
        <div class="ai-rail__modes">
          <el-button v-for="mode in modes" :key="mode.value" class="ai-mode"
            :class="{ 'is-active': activeTab === mode.value }" @click="changeAnalysis(mode.value)">
            <el-icon class="ai-mode__icon" :size="20">
              <component :is="mode.icon" />
            </el-icon>
            <span class="ai-mode__text">
              <span class="ai-mode__title">{{ mode.title }}</span>
              <span class="ai-mode__desc">{{ mode.desc }}</span>
            </span>
          </el-button>
        </div>
      </div>

      <div class="ai-rail__divider"></div>

      <div class="ai-rail__history-head">
        <span>对话历史</span>
        <span v-if="!isGuest" class="ai-rail__history-tools">
          <el-button v-if="history.length > HISTORY_PREVIEW" class="ai-rail__history-toggle" link
            @click="historyExpanded = !historyExpanded">{{ historyExpanded ? '收起' : '全部' }}</el-button>
          <el-button v-if="history.length" class="ai-rail__history-toggle" link @click="toggleManaging">
            {{ managing ? '完成' : '管理' }}
          </el-button>
        </span>
      </div>

      <!-- 未登录：历史记录锁定，提示登录后同步 -->
      <div v-if="isGuest" class="ai-rail__history-locked">
        <p class="ai-rail__history-locked-title">
          <el-icon :size="13">
            <Lock />
          </el-icon>
          <span>登录后查看历史对话</span>
        </p>
        <p class="ai-rail__history-locked-desc">分析记录会同步到你的账号</p>
      </div>

      <div v-else class="ai-rail__history">
        <div v-for="item in visibleHistory" :key="item.id" class="history-row">
          <el-checkbox v-if="managing" class="history-row__check" :model-value="selectedIds.includes(item.id)"
            @change="toggleSelect(item.id)" />
          <el-button class="history-item" :class="{ 'is-active': activeHistoryId === item.id }"
            @click="handleHistoryClick(item)">
            <span class="history-item__main">
              <span class="history-item__title">{{ item.title }}</span>
              <span class="history-item__time">{{ formatHistoryTime(item.time) }}</span>
            </span>
            <span class="history-item__meta">{{ modeLabel(item.mode) }}</span>
          </el-button>
        </div>
        <p v-if="!history.length" class="ai-rail__history-empty">还没有分析记录</p>
      </div>

      <!-- 管理态：批量选择与删除 -->
      <div v-if="managing" class="ai-rail__manage">
        <span class="ai-rail__manage-count">已选 {{ selectedIds.length }} 项</span>
        <span class="ai-rail__manage-actions">
          <el-button class="ai-rail__history-toggle" link @click="toggleSelectAll">
            {{ allSelected ? '取消全选' : '全选' }}
          </el-button>
          <el-button class="ai-rail__manage-delete" link type="danger" :loading="deleting"
            :disabled="!selectedIds.length" @click="removeSelected">删除</el-button>
        </span>
      </div>

      <div v-if="history.length && !managing" class="ai-rail__history-total">
        <span>全部分析记录</span>
        <span>{{ history.length }} 份</span>
      </div>

      <!-- 未登录：底部提示登录后同步 -->
      <p v-if="isGuest" class="ai-rail__guest-bottom">
        <el-icon :size="12">
          <Lock />
        </el-icon>
        <span>登录后同步对话与分析记录</span>
      </p>
    </aside>

    <!-- 右侧对话区 -->
    <section class="ai-main" :class="{ 'is-report': isSingle && showContent }">
      <div class="ai-chat">
        <!-- 窄屏隐藏左侧栏后，用胶囊按钮切换分析方式 -->
        <div class="ai-chat__mobile-modes">
          <el-button v-for="mode in modes" :key="mode.value" class="ai-mobile-mode" round size="small"
            :class="{ 'is-active': activeTab === mode.value }" @click="changeAnalysis(mode.value)">
            {{ mode.short }}
          </el-button>
        </div>

        <div ref="scrollEl" class="ai-chat__body" :class="{ 'is-empty': !showContent }">
          <!-- 空状态 -->
          <div v-if="!showContent" class="ai-welcome">
            <span class="ai-welcome__mark">
              <svg width="46" height="46" viewBox="0 0 46 46" fill="none" aria-hidden="true">
                <rect width="46" height="46" rx="14" fill="#007C77" />
                <path d="M13 31.5v-5.6M20.5 31.5V20.5M28 31.5V14.5" stroke="#DFF7F4" stroke-width="3.2"
                  stroke-linecap="round" />
                <circle cx="36" cy="11.5" r="4.2" fill="#00BEBD" stroke="#E7F7F5" stroke-width="1.2" />
              </svg>
            </span>
            <h2 class="ai-welcome__title">{{ welcomeTitle }}</h2>
            <p class="ai-welcome__desc">{{ welcomeDesc }}</p>

            <div v-if="welcomeExamples.length" class="ai-welcome__examples">
              <el-button v-for="example in welcomeExamples" :key="example" class="ai-welcome__example" round
                @click="fillComposer(example)">{{ example }}</el-button>
            </div>
            <p v-else-if="activeTab === '2'" class="ai-welcome__hint">支持粘贴完整 JD 文本，信息越完整，分析越准确。</p>
          </div>

          <!-- 技术栈分析 / JD 拆解：结果直接以报告卡片展示 -->
          <AnalysisReport v-else-if="isSingle" :mode="activeTab" :sections="sections" :loading="loading"
            :refused="refused" :refuse-reason="refuseReason" :error="error" @restart="restartAnalysis" />

          <!-- AI 对话模式：多轮消息列表 -->
          <div v-for="(message, index) in chatDisplay" v-else :key="index" class="ai-msg"
            :class="message.role === 'user' ? 'ai-msg--user' : 'ai-msg--assistant'">
            <div v-if="message.role === 'user'" class="ai-msg__bubble">{{ message.content }}</div>

            <template v-else>
              <span class="ai-msg__mark" aria-hidden="true">
                <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                  <rect width="26" height="26" rx="8" fill="#007C77" />
                  <path d="M7.5 17.8v-3.2M11.5 17.8v-6.2M15.5 17.8V8.2" stroke="#DFF7F4" stroke-width="1.9"
                    stroke-linecap="round" />
                  <circle cx="20.4" cy="6.6" r="2.3" fill="#00BEBD" stroke="#E7F7F5" stroke-width="0.8" />
                </svg>
              </span>

              <div class="ai-msg__content">
                <div class="ai-msg__name">
                  <span>JobVision</span>
                  <span v-if="message.streaming" class="ai-msg__status">回复中…</span>
                </div>

                <p v-if="message.content" class="ai-msg__text">{{ message.content }}</p>
                <div v-else-if="message.streaming" class="ai-typing" aria-label="回复中">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>

                <p v-if="message.streaming && error" class="ai-msg__notice ai-msg__notice--error">{{ error }}</p>
              </div>
            </template>
          </div>
        </div>

        <!-- 输入区：单轮分析出结果后不再显示，需点「重新分析」重新开始 -->
        <footer v-if="!isSingle || !currentPrompt" class="ai-composer">
          <div class="ai-composer__box">
            <el-tooltip content="新对话" placement="top" :show-after="400">
              <el-button class="ai-composer__plus" :icon="Plus" aria-label="新对话" @click="startNew" />
            </el-tooltip>

            <el-input ref="inputRef" v-model="content" class="ai-composer__input" type="textarea"
              :autosize="{ minRows: 1, maxRows: 6 }" resize="none" :placeholder="placeholder"
              @keydown.enter.exact="handleEnter" />

            <el-button type="primary" class="ai-composer__send" :disabled="!content.trim() || loading"
              @click="startAnalysis">发送</el-button>
          </div>
          <p class="ai-composer__hint">分析结果仅供参考，请以岗位原文为准。</p>
        </footer>
      </div>

      <!-- 未登录：下半页渐隐遮罩 + 登录引导，同时挡住后面页面的操作 -->
      <LoginGuide v-if="isGuest" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { Component } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { InputInstance } from 'element-plus'
import { ChatDotRound, DataAnalysis, Document, Lock, Plus } from '@element-plus/icons-vue'

import { useAIStream } from '@/composables/useAIStream'
import type { AiMessage } from '@/api/ai'
import { deleteConversations, getConversation, listConversations } from '@/api/conversation'
import { getToken } from '@/utils/token'

import AnalysisReport from './analysis-report.vue'
import LoginGuide from './login-guide.vue'

/** 三种分析方式：1 = 个人技能评估，2 = JD 岗位拆解，3 = AI 对话 */
type AnalysisMode = '1' | '2' | '3'

interface AnalysisModeItem {
  value: AnalysisMode
  title: string
  short: string
  desc: string
  icon: Component
}

const modes: AnalysisModeItem[] = [
  { value: '1', title: '个人技能评估', short: '技能评估', desc: '生成技能覆盖报告', icon: DataAnalysis },
  { value: '2', title: 'JD 岗位拆解', short: 'JD 拆解', desc: '生成岗位匹配报告', icon: Document },
  { value: '3', title: 'AI 对话', short: 'AI 对话', desc: '多轮聊天，随时追问', icon: ChatDotRound },
]

/** 当前分析方式：支持通过 ?mode=1|2|3 直接进入对应模式，非法值退回技能评估 */
const route = useRoute()
const initialMode = route.query.mode
const activeTab = ref<AnalysisMode>(
  initialMode === '2' || initialMode === '3' ? initialMode : '1',
)

/** 未登录：隐藏新对话与历史，右侧下半页展示登录引导并挡住页面操作 */
const isGuest = !getToken()

const { sections, hasResult, loading, error, raw, start, stop, reset, refuseReason, refused } = useAIStream()

const modeLabel = (mode: AnalysisMode) => modes.find((item) => item.value === mode)?.title || ''

// 文本框内容
const content = ref('')
const inputRef = ref<InputInstance>()

// 当前这一轮分析的用户提问；为空表示还没有开始对话
const currentPrompt = ref('')

// AI 对话模式下的多轮消息（user / assistant 交替），其余模式不使用
const chatMessages = ref<AiMessage[]>([])

/** AI 对话模式的渲染条目：历史消息 + 正在生成中的回复 */
interface ChatDisplayItem {
  role: 'user' | 'assistant'
  content: string
  /** true 表示这是正在流式输出的回复 */
  streaming?: boolean
}

const chatDisplay = computed<ChatDisplayItem[]>(() => {
  const list: ChatDisplayItem[] = chatMessages.value.map((message) => ({ ...message }))
  if (loading.value) {
    list.push({ role: 'assistant', content: raw.value, streaming: true })
  }
  return list
})

const hasConversation = computed(() => Boolean(currentPrompt.value) || chatMessages.value.length > 0)

/** 技术栈分析 / JD 拆解为单轮分析，结果以报告卡片展示 */
const isSingle = computed(() => activeTab.value !== '3')

/** 是否已有内容区（单轮看是否已提交，多轮看是否有消息） */
const showContent = computed(() => (isSingle.value ? Boolean(currentPrompt.value) : hasConversation.value))

/** 重新分析：清空当前结果，回到输入状态 */
const restartAnalysis = () => startNew()

// ---------- 对话历史（服务端会话列表） ----------
interface HistoryItem {
  /** 会话 ID，同时用于恢复对话与续接下一轮 */
  id: string
  mode: AnalysisMode
  title: string
  time: string
  messageCount: number
}

/** 侧栏默认展示的历史条数，超出后可展开 */
const HISTORY_PREVIEW = 5

/** 一次拉取的会话条数 */
const HISTORY_LIMIT = 20

const history = ref<HistoryItem[]>([])
const historyExpanded = ref(false)
const activeHistoryId = ref<string | null>(null)

/** 批量管理：是否进入管理模式、已选中的会话 ID、删除请求进行中 */
const managing = ref(false)
const selectedIds = ref<string[]>([])
const deleting = ref(false)

const allSelected = computed(
  () => history.value.length > 0 && selectedIds.value.length === history.value.length,
)

/** 当前会话 ID：后端首帧回传，同一轮对话的后续提问沿用它 */
const conversationId = ref('')

/** 后端 scene 到页面分析方式的映射：多轮对话统一归到 AI 对话 */
const sceneToMode = (scene: string): AnalysisMode => {
  if (scene === 'skill') return '1'
  if (scene === 'jd') return '2'
  return '3'
}

const visibleHistory = computed(() =>
  historyExpanded.value ? history.value : history.value.slice(0, HISTORY_PREVIEW),
)

const formatHistoryTime = (time: string | number) => {
  const date = new Date(time)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  const days = Math.round((today - target) / 86400000)

  if (days <= 0) return '今天'
  if (days === 1) return '昨天'
  if (date.getFullYear() === now.getFullYear()) return `${date.getMonth() + 1}/${date.getDate()}`
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
}

/** 拉取当前用户最近的会话列表；未登录或接口异常时保持空列表 */
const loadHistory = async () => {
  if (!getToken()) return

  try {
    const list = await listConversations(HISTORY_LIMIT)
    history.value = list.map((item) => {
      const mode = sceneToMode(item.scene)
      // 优先展示服务端按第一句话生成的标题，老数据没有标题时退回最后一条消息
      const title = item.title || item.lastMessage || modeLabel(mode)
      return {
        id: item.conversationId,
        mode,
        title: title.replace(/\s+/g, ' ').trim().slice(0, 24),
        time: item.updateTime,
        messageCount: item.messageCount,
      }
    })
  } catch {
    // 未登录 / 网络异常时不影响页面其他功能，静默失败
  }
}

/**
 * 每次发起 / 恢复对话都递增，用来丢弃已经失效的异步结果。
 * 例如请求进行中切换了分析方式，旧请求结束后不应再写入历史。
 */
let requestSeq = 0

/** 发起分析 */
const startAnalysis = async () => {
  if (isGuest) return

  const text = content.value.trim()
  if (!text || loading.value) return

  const seq = ++requestSeq
  const mode = activeTab.value

  content.value = ''
  activeHistoryId.value = null

  // AI 对话模式：把新的提问追加进消息列表，整表发给后端保持多轮上下文
  if (mode === '3') {
    chatMessages.value.push({ role: 'user', content: text })
    scrollToBottom(true)

    await start({
      scene: 'chat',
      messages: chatMessages.value.map((message) => ({ ...message })),
      conversationId: conversationId.value || undefined,
      onConversationId: (id) => {
        if (seq === requestSeq) conversationId.value = id
      },
    })

    // 期间切换了分析方式 / 打开了历史记录 / 离开了页面，本次结果直接丢弃
    if (seq !== requestSeq) return

    // 失败时移除刚发出的提问并还原输入，方便修改后重试
    if (error.value) {
      chatMessages.value.pop()
      content.value = text
      return
    }

    if (!raw.value.trim()) return

    chatMessages.value.push({ role: 'assistant', content: raw.value.trim() })
    activeHistoryId.value = conversationId.value || null
    loadHistory()
    return
  }

  currentPrompt.value = text
  scrollToBottom(true)

  await start({
    scene: mode === '1' ? 'skill' : 'jd',
    input: text,
    conversationId: conversationId.value || undefined,
    onConversationId: (id) => {
      if (seq === requestSeq) conversationId.value = id
    },
  })

  // 期间切换了分析方式 / 打开了历史记录 / 离开了页面，本次结果直接丢弃
  if (seq !== requestSeq) return

  // 失败时把输入还原，方便用户修改后重试
  if (error.value) {
    content.value = text
    return
  }

  if (!raw.value.trim() || (!hasResult.value && !refused.value)) return

  activeHistoryId.value = conversationId.value || null
  loadHistory()
}

/** 切换分析方式：各场景的输入与结果不通用，切换时清空当前对话 */
const changeAnalysis = (mode: AnalysisMode) => {
  if (mode === activeTab.value) return

  requestSeq++
  reset()
  activeTab.value = mode
  currentPrompt.value = ''
  content.value = ''
  chatMessages.value = []
  conversationId.value = ''
  activeHistoryId.value = null
}

/** 已在页内时，点顶部的「AI 聊天」等入口会只改 query，这里同步切换模式 */
watch(
  () => route.query.mode,
  (mode) => {
    if (mode === '1' || mode === '2' || mode === '3') changeAnalysis(mode)
  },
)

/** 新对话：保留历史记录，只清空当前工作区 */
const startNew = () => {
  requestSeq++
  reset()
  currentPrompt.value = ''
  content.value = ''
  chatMessages.value = []
  conversationId.value = ''
  activeHistoryId.value = null
  focusComposer()
}

/** 打开一条历史记录：按会话 ID 拉取完整消息后还原 */
const openHistory = async (item: HistoryItem) => {
  requestSeq++
  reset()
  const seq = requestSeq

  activeTab.value = item.mode
  content.value = ''
  currentPrompt.value = ''
  chatMessages.value = []
  conversationId.value = item.id
  activeHistoryId.value = item.id

  try {
    const detail = await getConversation(item.id)
    if (seq !== requestSeq) return

    const messages = detail.messages
      .filter((message) => message.role === 'user' || message.role === 'assistant')
      .map((message) => ({ role: message.role as 'user' | 'assistant', content: message.content }))

    if (item.mode === '3') {
      chatMessages.value = messages
    } else {
      // 单轮分析只展示最后一组问答，回答原文重新解析成报告
      const lastUser = [...messages].reverse().find((message) => message.role === 'user')
      const lastAssistant = [...messages].reverse().find((message) => message.role === 'assistant')
      currentPrompt.value = lastUser?.content ?? ''
      raw.value = lastAssistant?.content ?? ''
    }
    scrollToBottom()
  } catch (err) {
    if (seq !== requestSeq) return
    error.value = err instanceof Error ? err.message : '历史记录加载失败'
  }
}

const focusComposer = () => {
  nextTick(() => inputRef.value?.focus())
}

// ---------- 历史记录批量管理 ----------
/** 进入 / 退出批量管理模式，切换时清空已选 */
const toggleManaging = () => {
  managing.value = !managing.value
  selectedIds.value = []
}

const toggleSelect = (id: string) => {
  selectedIds.value = selectedIds.value.includes(id)
    ? selectedIds.value.filter((item) => item !== id)
    : [...selectedIds.value, id]
}

const toggleSelectAll = () => {
  selectedIds.value = allSelected.value ? [] : history.value.map((item) => item.id)
}

/** 管理态点击条目是勾选，普通态点击是打开记录 */
const handleHistoryClick = (item: HistoryItem) => {
  if (managing.value) {
    toggleSelect(item.id)
    return
  }
  openHistory(item)
}

/** 批量删除选中的会话 */
const removeSelected = async () => {
  if (!selectedIds.value.length || deleting.value) return

  const ids = [...selectedIds.value]
  const count = ids.length

  // 删除前二次确认，文案与按钮样式对齐设计稿
  try {
    await ElMessageBox.confirm(
      count > 1 ? '这些对话的记录将从历史列表中移除，且无法恢复' : '由该对话生成的分享链接也将失效',
      count > 1 ? `删除后，这 ${count} 条对话将不可恢复` : '删除后，该对话将不可恢复',
      {
        confirmButtonText: count > 1 ? `删除 ${count} 条` : '删除该对话',
        cancelButtonText: '取消',
        confirmButtonClass: 'ai-delete-confirm__ok',
        customClass: 'ai-delete-confirm',
        showClose: false,
        closeOnClickModal: false,
      },
    )
  } catch {
    // 点了取消或关闭，直接退出
    return
  }

  deleting.value = true
  try {
    await deleteConversations(ids)

    history.value = history.value.filter((item) => !ids.includes(item.id))
    selectedIds.value = []

    // 当前打开的会话被删掉时，顺便清空右侧工作区
    if (ids.includes(conversationId.value)) startNew()
    if (!history.value.length) managing.value = false

    ElMessage.success(`已删除 ${ids.length} 条记录`)
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '删除失败，请稍后重试')
  } finally {
    deleting.value = false
  }
}

/** 点击示例 / 追问标签：填入输入框，由用户确认后发送 */
const fillComposer = (text: string) => {
  content.value = text
  focusComposer()
}

const handleEnter = (event: KeyboardEvent) => {
  // 中文输入法确认候选词时也会触发 Enter，此时不能直接发送
  if (event.isComposing) return
  event.preventDefault()
  startAnalysis()
}

// ---------- 自动滚动 ----------
const scrollEl = ref<HTMLElement | null>(null)

const isNearBottom = () => {
  const el = scrollEl.value
  if (!el) return true
  return el.scrollHeight - el.scrollTop - el.clientHeight < 120
}

const scrollToBottom = async (smooth = false) => {
  await nextTick()
  const el = scrollEl.value
  if (!el) return
  el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' })
}

// 流式输出时跟随滚动；用户主动往上翻时不打扰
watch([raw, loading, error], () => {
  if (isNearBottom()) scrollToBottom()
})

// ---------- 页面文案 ----------
const placeholder = computed(() => {
  if (activeTab.value === '1') return '写下你的技术栈、项目经验和求职意向…'
  if (activeTab.value === '3') return '随便聊聊，或说说求职、工作上的困扰…'
  return '粘贴岗位 JD，越完整分析越准确…'
})

const welcomeTitle = computed(() => {
  if (activeTab.value === '1') return '先说说你的情况'
  if (activeTab.value === '3') return '想聊点什么？'
  return '先粘贴一份岗位 JD'
})

const welcomeDesc = computed(() => {
  if (activeTab.value === '1')
    return '写下你的技术栈、项目经验和求职意向，AI 会给出匹配度、薪资区间和技能补齐建议。'
  if (activeTab.value === '3')
    return '求职、工作、生活里的事都可以聊，也可以让 AI 帮你分析分析、出出主意。'
  return '把岗位描述粘贴到下方输入框，AI 会拆解岗位要求、隐藏信息与面试准备方向。'
})

const welcomeExamples = computed(() => {
  if (activeTab.value === '1')
    return [
      '3 年前端，Vue + TypeScript，想看看能投什么岗位',
      '帮我梳理一下我的技术栈短板',
      '我想转 AI 应用开发，需要补什么',
    ]
  if (activeTab.value === '3')
    return ['最近面试总没结果，帮我分析分析', '想转行又不敢，帮我权衡一下', '简历亮点该怎么提炼']
  return []
})

// ---------- 用户信息 ----------
// 侧栏底部只保留隐私提示，用户信息统一走顶部导航

// 进入页面拉取一次历史会话列表
onMounted(loadHistory)

// 离开页面时中止未完成的请求
onBeforeUnmount(() => {
  requestSeq++
  stop()
})
</script>

<style scoped lang="scss">
.ai-analyse {
  --jv-primary: #007c77;
  --jv-primary-soft: #e8f7f4;
  --jv-ink: #17252b;
  --jv-text: #3d4b54;
  --jv-muted: #65747c;
  --jv-faint: #8a979e;
  --jv-border: #e1ebe8;
  --jv-line: #edf2f2;

  display: flex;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: #ffffff;
  color: var(--jv-ink);
}

/* ---------- 左侧分析栏 ---------- */
.ai-rail {
  display: flex;
  flex: 0 0 264px;
  flex-direction: column;
  width: 264px;
  min-height: 0;
  overflow: hidden;
  background: #f4f9f8;
  border-right: 1px solid var(--jv-border);
}

.ai-rail__brand {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 12px;
  padding: 26px 28px 0;
}

.ai-rail__logo {
  display: flex;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
}

.ai-rail__name {
  font-size: 20px;
  font-weight: 700;
  line-height: 26px;
  letter-spacing: -0.7px;
  color: var(--jv-ink);
}

.ai-rail__sub {
  padding: 4px 28px 0;
  margin: 0;
  font-size: 11.5px;
  line-height: 18px;
  color: var(--jv-muted);
}

/* 侧栏「新对话」按钮：位于分析方式上方 */
.ai-rail__new {
  flex-shrink: 0;
  padding: 18px 16px 0;
}

.ai-rail__new-btn {
  width: 100%;
  height: 38px;
  padding: 0 14px;
  font-size: 12.5px;
  font-weight: 500;
  border-radius: 9px;

  --el-button-text-color: #007c77;
  --el-button-bg-color: #ffffff;
  --el-button-border-color: #cfe1dd;
  --el-button-hover-text-color: #007c77;
  --el-button-hover-bg-color: #f3faf8;
  --el-button-hover-border-color: #bfe3dd;
  --el-button-active-text-color: #007c77;
  --el-button-active-bg-color: #e8f7f4;
  --el-button-active-border-color: #bfe3dd;
}

.ai-rail__section {
  flex-shrink: 0;
  padding: 16px 16px 0;
}

.ai-rail__label {
  padding: 0 12px;
  margin: 0 0 8px;
  font-size: 11px;
  font-weight: 600;
  line-height: 16px;
  letter-spacing: 0.4px;
  color: #78868f;
}

.ai-rail__modes {
  display: flex;
  flex-direction: column;
  gap: 2px;

  // el-button 相邻时会加 12px 左边距，纵向列表里会错位，统一清掉
  .ai-mode+.ai-mode {
    margin-left: 0;
  }
}

.ai-mode {
  display: flex;
  width: 100%;
  height: auto;
  padding: 11px 18px;
  font-family: inherit;
  text-align: left;
  border: 0;
  border-radius: 10px;
  transition: background-color 0.18s ease;

  --el-button-text-color: var(--jv-ink);
  --el-button-bg-color: transparent;
  --el-button-border-color: transparent;
  --el-button-hover-text-color: var(--jv-ink);
  --el-button-hover-bg-color: rgba(232, 247, 244, 0.7);
  --el-button-hover-border-color: transparent;
  --el-button-active-text-color: var(--jv-ink);
  --el-button-active-bg-color: var(--jv-primary-soft);
  --el-button-active-border-color: transparent;

  // el-button 默认把插槽内容包一层 span，这里让它变成横向布局
  :deep(> span) {
    display: flex;
    flex: 1;
    gap: 14px;
    align-items: flex-start;
    min-width: 0;
    text-align: left;
    white-space: normal;
  }

  &:hover {
    background: rgba(232, 247, 244, 0.7);
  }

  &.is-active {
    --el-button-bg-color: var(--jv-primary-soft);
    --el-button-hover-bg-color: var(--jv-primary-soft);

    background: var(--jv-primary-soft);

    .ai-mode__icon,
    .ai-mode__title {
      color: var(--jv-primary);
    }

    .ai-mode__desc {
      color: #4f6068;
    }
  }
}

.ai-mode__icon {
  flex-shrink: 0;
  margin-top: 2px;
  color: #6d8b86;
}

.ai-mode__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.ai-mode__title {
  font-size: 15px;
  font-weight: 600;
  line-height: 22px;
  color: var(--jv-ink);
}

.ai-mode__desc {
  font-size: 11px;
  line-height: 16px;
  color: var(--jv-muted);
}

.ai-rail__divider {
  flex-shrink: 0;
  height: 1px;
  margin: 18px 28px 0;
  background: #e1ebe9;
}

.ai-rail__history-head {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  padding: 20px 28px 6px;
  font-size: 11.5px;
  font-weight: 600;
  line-height: 18px;
  letter-spacing: 0.2px;
  color: #78868f;
}

.ai-rail__history-tools {
  display: flex;
  gap: 10px;
  align-items: center;
}

.ai-rail__history-toggle {
  height: auto;
  padding: 0;
  font-family: inherit;
  font-size: 11px;
  font-weight: 500;

  --el-button-text-color: var(--jv-primary);
  --el-button-hover-text-color: var(--jv-primary);
  --el-button-hover-link-text-color: var(--jv-primary);

  &:hover {
    opacity: 0.75;
  }
}

.ai-rail__history {
  flex: 1;
  min-height: 0;
  padding: 0 12px 10px;
  overflow-y: auto;
  // 隐藏滚动条，仍可滚动
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

/* 单条历史：管理态左侧多一个复选框 */
.history-row {
  display: flex;
  gap: 6px;
  align-items: center;
}

.history-row__check {
  flex-shrink: 0;
  height: auto;
  margin-right: 0;

  --el-checkbox-checked-bg-color: var(--jv-primary);
  --el-checkbox-checked-input-border-color: var(--jv-primary);
  --el-checkbox-input-border-color-hover: var(--jv-primary);
}

.ai-rail__history-empty {
  padding: 12px 16px;
  margin: 0;
  font-size: 12px;
  line-height: 18px;
  color: var(--jv-faint);
}

.history-item {
  position: relative;
  display: flex;
  flex: 1;
  width: auto;
  min-width: 0;
  height: auto;
  padding: 9px 14px 9px 16px;
  font-family: inherit;
  text-align: left;
  border: 0;
  border-radius: 8px;
  transition: background-color 0.18s ease;

  --el-button-text-color: var(--jv-text);
  --el-button-bg-color: transparent;
  --el-button-border-color: transparent;
  --el-button-hover-text-color: var(--jv-text);
  --el-button-hover-bg-color: rgba(232, 247, 244, 0.7);
  --el-button-hover-border-color: transparent;
  --el-button-active-text-color: var(--jv-text);
  --el-button-active-bg-color: var(--jv-primary-soft);
  --el-button-active-border-color: transparent;

  // el-button 的插槽会包一层 span，让它变成纵向布局
  :deep(> span) {
    display: flex;
    flex-direction: column;
    flex: 1;
    gap: 2px;
    min-width: 0;
    text-align: left;
    white-space: normal;
  }

  &:hover {
    background: rgba(232, 247, 244, 0.7);
  }

  &.is-active {
    --el-button-bg-color: var(--jv-primary-soft);
    --el-button-hover-bg-color: var(--jv-primary-soft);

    background: var(--jv-primary-soft);

    &::before {
      position: absolute;
      top: 10px;
      bottom: 10px;
      left: 0;
      width: 2px;
      content: '';
      background: var(--jv-primary);
      border-radius: 1px;
    }

    .history-item__title {
      font-weight: 600;
      color: var(--jv-ink);
    }
  }
}

.history-item__main {
  display: flex;
  gap: 8px;
  align-items: center;
}

.history-item__title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-size: 13.5px;
  font-weight: 500;
  line-height: 20px;
  color: var(--jv-text);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-item__time {
  flex-shrink: 0;
  font-size: 10px;
  line-height: 16px;
  color: var(--jv-faint);
}

.history-item__meta {
  overflow: hidden;
  font-size: 11px;
  line-height: 16px;
  color: var(--jv-faint);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ai-rail__history-total {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  padding: 13px 28px;
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
  color: var(--jv-primary);
  border-top: 1px solid #e1ebe9;

  span:last-child {
    font-weight: 400;
    color: var(--jv-faint);
  }
}

/* 管理态底栏：已选数量 + 全选 / 删除 */
.ai-rail__manage {
  display: flex;
  flex-shrink: 0;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 10px 28px;
  border-top: 1px solid #e1ebe9;
}

.ai-rail__manage-count {
  font-size: 11.5px;
  line-height: 18px;
  color: var(--jv-muted);
}

.ai-rail__manage-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.ai-rail__manage-delete {
  height: auto;
  padding: 0;
  font-size: 11px;
  font-weight: 500;
}

/* ---------- 未登录态 ---------- */
.ai-rail__history-locked {
  padding: 14px 24px 0 28px;
}

.ai-rail__history-locked-title {
  display: flex;
  gap: 6px;
  align-items: center;
  margin: 0;
  font-size: 12.5px;
  font-weight: 500;
  line-height: 20px;
  color: var(--jv-text);
}

.ai-rail__history-locked-desc {
  margin: 4px 0 0 19px;
  font-size: 10.5px;
  line-height: 16px;
  color: var(--jv-faint);
}

.ai-rail__guest-bottom {
  display: flex;
  flex-shrink: 0;
  gap: 6px;
  align-items: center;
  padding: 14px 28px;
  margin: auto 0 0;
  font-size: 10.5px;
  line-height: 16px;
  color: #9aa6ac;
  border-top: 1px solid #e1ebe9;
}

/* ---------- 右侧对话区 ---------- */
.ai-main {
  position: relative;
  display: flex;
  flex: 1;
  justify-content: center;
  min-width: 0;
  min-height: 0;
}

/* 报告模式：浅灰底衬托白色报告卡片 */
.ai-main.is-report {
  background: #f4f8f7;
}

.ai-main.is-report .ai-chat__body:not(.is-empty) {
  padding: 24px 0;
}

/* 未登录：只有顶部导航和登录引导可操作，页面其余部分全部拦截 */
.ai-analyse.is-guest {
  .ai-rail,
  .ai-chat {
    pointer-events: none;
    user-select: none;
  }
}

.ai-chat {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 976px;
  min-height: 0;
  padding: 0 48px;
  box-sizing: border-box;
}

.ai-chat__mobile-modes {
  display: none;
}

.ai-chat__body {
  flex: 1;
  min-height: 0;
  padding: 36px 0 8px;
  overflow-y: auto;
  // 隐藏滚动条，仍可滚动
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  // 空状态时让欢迎内容整体居中
  &.is-empty {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
}

/* ---------- 空状态 ---------- */
.ai-welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 0 8px;
  text-align: center;
}

.ai-welcome__mark {
  display: flex;
  width: 46px;
  height: 46px;
}

.ai-welcome__title {
  margin: 20px 0 0;
  font-size: 22px;
  font-weight: 600;
  line-height: 30px;
  letter-spacing: -0.4px;
  color: var(--jv-ink);
}

.ai-welcome__desc {
  max-width: 520px;
  margin: 8px 0 0;
  font-size: 13.5px;
  line-height: 22px;
  color: var(--jv-muted);
}

.ai-welcome__examples {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  max-width: 560px;
  margin-top: 22px;

  .ai-welcome__example+.ai-welcome__example {
    margin-left: 0;
  }
}

.ai-welcome__example {
  height: 36px;
  padding: 0 14px;
  font-family: inherit;
  font-size: 12.5px;
  border-radius: 999px;

  --el-button-text-color: var(--jv-text);
  --el-button-bg-color: #ffffff;
  --el-button-border-color: #d8e2e3;
  --el-button-hover-text-color: var(--jv-primary);
  --el-button-hover-bg-color: #f4faf8;
  --el-button-hover-border-color: #b9dad5;
  --el-button-active-text-color: var(--jv-primary);
  --el-button-active-bg-color: #eef7f5;
  --el-button-active-border-color: #b9dad5;
}

.ai-welcome__hint {
  margin: 18px 0 0;
  font-size: 12.5px;
  line-height: 20px;
  color: var(--jv-faint);
}

/* ---------- 消息 ---------- */
.ai-msg {
  display: flex;
}

.ai-msg--user {
  justify-content: flex-end;
  margin-bottom: 26px;
}

.ai-msg__bubble {
  max-width: 560px;
  // JD 原文可能很长，限制气泡高度并在内部滚动，避免把分析结果顶出屏幕
  max-height: 168px;
  padding: 13px 18px;
  overflow-y: auto;
  font-size: 15px;
  line-height: 24px;
  color: var(--jv-ink);
  word-break: break-word;
  white-space: pre-wrap;
  background: var(--jv-primary-soft);
  border-radius: 14px;
  // 隐藏滚动条，仍可滚动
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.ai-msg--assistant {
  gap: 12px;
  align-items: flex-start;
}

.ai-msg__mark {
  display: flex;
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  margin-top: 1px;
}

.ai-msg__content {
  flex: 1;
  min-width: 0;
}

.ai-msg__name {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 6px;
  font-size: 11.5px;
  font-weight: 500;
  line-height: 18px;
  color: #78868f;
}

.ai-msg__status {
  font-size: 10.5px;
  font-weight: 400;
  color: var(--jv-faint);
}

/* AI 对话模式的纯文本回复 */
.ai-msg__text {
  margin: 0;
  font-size: 15px;
  line-height: 24px;
  color: var(--jv-ink);
  word-break: break-word;
  white-space: pre-wrap;
}

.ai-msg__notice {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding: 12px 14px;
  font-size: 13.5px;
  line-height: 22px;
  border-radius: 10px;

  .el-icon {
    flex-shrink: 0;
    margin-top: 3px;
  }
}

.ai-msg__notice--warning {
  color: #8a5a16;
  background: #fff8ec;

  .el-icon {
    color: #d98e2b;
  }
}

.ai-msg__notice--error {
  margin: 10px 0 0;
  color: #b4413f;
  background: #fef2f2;
}

/* 流式输出前的等待动画 */
.ai-typing {
  display: flex;
  gap: 5px;
  align-items: center;
  padding: 8px 0;

  span {
    width: 6px;
    height: 6px;
    background: #b7cfca;
    border-radius: 50%;
    animation: ai-typing 1.2s infinite ease-in-out;
  }

  span:nth-child(2) {
    animation-delay: 0.15s;
  }

  span:nth-child(3) {
    animation-delay: 0.3s;
  }
}

@keyframes ai-typing {

  0%,
  60%,
  100% {
    opacity: 0.35;
    transform: translateY(0);
  }

  30% {
    opacity: 1;
    transform: translateY(-3px);
  }
}

/* ---------- 输入区 ---------- */
.ai-composer {
  flex-shrink: 0;
  padding-top: 24px;
  border-top: 1px solid var(--jv-line);
}

.ai-composer__box {
  display: flex;
  gap: 10px;
  align-items: flex-end;
  padding: 12px 14px;
  background: #ffffff;
  border: 1px solid #d8e2e3;
  border-radius: 14px;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease;

  &:focus-within {
    border-color: #9fcfc8;
    box-shadow: 0 0 0 3px rgba(0, 124, 119, 0.08);
  }
}

.ai-composer__plus {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  padding: 0;
  // 与 42px 高的发送按钮垂直居中对齐
  margin-bottom: 5px;
  font-size: 15px;
  border: 0;

  --el-button-text-color: #65747c;
  --el-button-bg-color: transparent;
  --el-button-border-color: transparent;
  --el-button-hover-text-color: #007c77;
  --el-button-hover-bg-color: #f1f7f5;
  --el-button-hover-border-color: transparent;
  --el-button-active-text-color: #007c77;
  --el-button-active-bg-color: #e8f7f4;
  --el-button-active-border-color: transparent;
}

.ai-composer__input {
  flex: 1;
  min-width: 0;

  --el-input-text-color: #17252b;
  --el-textarea-placeholder-color: #a1acb3;

  :deep(.el-textarea__inner) {
    min-height: 42px !important;
    padding: 9px 0;
    font-family: inherit;
    font-size: 15px;
    line-height: 24px;
    color: var(--jv-ink);
    background: transparent;
    border: 0;
    border-radius: 0;
    box-shadow: none;
    resize: none;
  }

  :deep(.el-textarea__inner:hover),
  :deep(.el-textarea__inner:focus) {
    box-shadow: none;
  }
}

.ai-composer__send {
  flex-shrink: 0;
  width: 68px;
  height: 42px;
  padding: 0;
  font-size: 12.5px;
  font-weight: 500;
  border-radius: 9px;

  --el-button-text-color: #ffffff;
  --el-button-bg-color: #007c77;
  --el-button-border-color: #007c77;
  --el-button-hover-text-color: #ffffff;
  --el-button-hover-bg-color: #006b67;
  --el-button-hover-border-color: #006b67;
  --el-button-active-text-color: #ffffff;
  --el-button-active-bg-color: #00615e;
  --el-button-active-border-color: #00615e;
  --el-button-disabled-text-color: #ffffff;
  --el-button-disabled-bg-color: #cfe1dd;
  --el-button-disabled-border-color: #cfe1dd;
}

.ai-composer__hint {
  margin: 10px 0 0;
  padding-bottom: 14px;
  font-size: 10.5px;
  line-height: 16px;
  color: var(--jv-faint);
}

/* ---------- 响应式 ---------- */
@media (max-width: 1199.98px) {
  .ai-rail {
    flex-basis: 240px;
    width: 240px;
  }

  .ai-chat {
    padding: 0 32px;
  }
}

@media (max-width: 960px) {
  .ai-rail {
    display: none;
  }

  .ai-chat {
    max-width: 880px;
    padding: 0 24px;
  }

  .ai-chat__mobile-modes {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding-top: 32px;

    .ai-mobile-mode+.ai-mobile-mode {
      margin-left: 0;
    }
  }

  .ai-mobile-mode {
    height: 32px;
    padding: 0 14px;
    font-family: inherit;
    font-size: 12.5px;
    border-radius: 999px;

    --el-button-text-color: var(--jv-text);
    --el-button-bg-color: #ffffff;
    --el-button-border-color: #d8e2e3;
    --el-button-hover-text-color: var(--jv-primary);
    --el-button-hover-bg-color: #f4faf8;
    --el-button-hover-border-color: #b9dad5;
    --el-button-active-text-color: var(--jv-primary);
    --el-button-active-bg-color: #eef7f5;
    --el-button-active-border-color: #b9dad5;

    &.is-active {
      font-weight: 600;

      --el-button-text-color: var(--jv-primary);
      --el-button-bg-color: var(--jv-primary-soft);
      --el-button-border-color: #bfe3dd;
      --el-button-hover-text-color: var(--jv-primary);
      --el-button-hover-bg-color: var(--jv-primary-soft);
      --el-button-hover-border-color: #bfe3dd;
    }
  }

  .ai-chat__body {
    padding-top: 20px;
  }
}

@media (max-width: 640px) {
  .ai-chat {
    padding: 0 16px;
  }

  .ai-chat__mobile-modes {
    padding-top: 24px;
  }

  .ai-msg__bubble {
    max-width: 100%;
    font-size: 14px;
    line-height: 22px;
  }

  .ai-welcome__desc {
    font-size: 13px;
  }

  .ai-composer {
    padding-top: 16px;
  }

  .ai-composer__box {
    padding: 10px 12px;
  }
}
</style>

<!-- 删除确认弹窗挂在 body 下，样式不能加 scoped -->
<style lang="scss">
.ai-delete-confirm {
  width: 420px;
  max-width: calc(100vw - 32px);
  padding: 24px 24px 20px;
  border-radius: 16px;

  .el-message-box__header {
    padding: 0;
  }

  .el-message-box__title {
    font-size: 16px;
    font-weight: 600;
    line-height: 24px;
    color: #17252b;
  }

  .el-message-box__content {
    padding: 10px 0 0;
    font-size: 13.5px;
    line-height: 22px;
    color: #65747c;
  }

  .el-message-box__btns {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    padding: 24px 0 0;

    .el-button {
      height: 36px;
      padding: 0 22px;
      margin-left: 0;
      font-size: 13px;
      border-radius: 999px;
    }
  }

  // 危险操作按钮使用设计稿里的红色
  .ai-delete-confirm__ok {
    color: #ffffff;
    background: #f01f1f;
    border-color: #f01f1f;

    &:hover,
    &:focus {
      color: #ffffff;
      background: #d81b1b;
      border-color: #d81b1b;
    }
  }
}
</style>
