<template>
  <div class="ai-analyse">
    <!--header部分 个人技能篇评估，JD岗位拆解部分 -->
    <div class="header_analysis">
      <div class="header_analysis_content">
        <div @click="changeAnalysis('1')" class="header_analysis_item"
          :class="{ header_analysis_item_active: activeTab === '1' }">个人技能评估</div>
        <div @click="changeAnalysis('2')" class="header_analysis_item"
          :class="{ header_analysis_item_active: activeTab === '2' }">JD岗位拆解</div>
      </div>
      <div class="header-analysis-line"></div>

      <!-- 文本框 -->
      <div class="main_analysis">
        <div class="main_title">
          <span v-if="activeTab === '1'">技能与求职信息</span>
          <span v-else>岗位 JD</span>
        </div>
        <textarea v-model="content" name="文本框" id="textarea"
          :placeholder="activeTab === '1' ? '请输入你掌握的技术栈、项目经验、求职意向' : '粘贴岗位招聘JD'"></textarea>
        <div class="main_button">
          <el-button type="primary" :disabled="!content.trim()" @click="startAnalysis">
            <svg class="aiAnalyse-icon" width="16" height="16" viewBox="0 0 18 18" fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path
                d="M8.26275 2.1105C8.32905 1.75553 8.63889 1.4982 9 1.4982C9.36111 1.4982 9.67095 1.75553 9.73725 2.1105L10.5255 6.279C10.6401 6.88551 11.1145 7.35993 11.721 7.4745L15.8895 8.26275C16.2445 8.32905 16.5018 8.63889 16.5018 9C16.5018 9.36111 16.2445 9.67095 15.8895 9.73725L11.721 10.5255C11.1145 10.6401 10.6401 11.1145 10.5255 11.721L9.73725 15.8895C9.67095 16.2445 9.36111 16.5018 9 16.5018C8.63889 16.5018 8.32905 16.2445 8.26275 15.8895L7.4745 11.721C7.35993 11.1145 6.88551 10.6401 6.279 10.5255L2.1105 9.73725C1.75553 9.67095 1.4982 9.36111 1.4982 9C1.4982 8.63889 1.75553 8.32905 2.1105 8.26275L6.279 7.4745C6.88551 7.35993 7.35993 6.88551 7.4745 6.279L8.26275 2.1105"
                stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M15 1.5V4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
                stroke-linejoin="round" />
              <path d="M16.5 3H13.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
                stroke-linejoin="round" />
              <path
                d="M1.5 15C1.5 15.8279 2.17213 16.5 3 16.5C3.82787 16.5 4.5 15.8279 4.5 15C4.5 14.1721 3.82787 13.5 3 13.5C2.17213 13.5 1.5 14.1721 1.5 15H1.5"
                stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <span style="margin-left: 5px;">开始分析</span>
          </el-button>
          <div class="main_error" v-if="error">{{ error }}</div>
        </div>
      </div>
    </div>

    <!-- main部分 分析结果 -->
    <transition name="fade" mode="out-in">
      <!-- 拒绝提示 -->
      <div v-if="refused" class="main_refuse">
        <el-icon :size="20" color="#E6A23C">
          <Warning />
        </el-icon>
        <span>{{ refuseReason }}</span>
      </div>
      <div v-else-if="hasResult" class="main_result">
        <div class="main_result_title">
          <div>分析结果</div>
          <div>基于 1,248 条深圳 AI 岗位样本</div>
        </div>
        <div class="main_result_content">
          <div class="main_result_item match_rate">
            <div class="main_result_item_content">
              <svg color="#409EFF" width="24" height="24" viewBox="0 0 49 48" fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M7.4573 37C5.7019 33.9605 4.77783 30.5107 4.77783 27C4.77783 15.9543 13.7321 7 24.7778 7C35.8235 7 44.7778 15.9543 44.7778 27C44.7778 30.5107 43.8537 33.9605 42.0983 37"
                  stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M24.7778 20V30" transform="rotate(30 24.7778 27)" stroke="currentColor" stroke-width="4"
                  stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span>匹配度评分</span>
            </div>
            <div class="main_result_item_progress">
              <div class="main_result_item_progress_rate">
                <span style="font-size: 32px; font-weight: 600; color:#409EFF;">{{ matchScore }}</span>
                <span style="font-size: 18px; color: #64748B;">/100</span>
              </div>
              <div class="main_result_item_progress_bar">
                <el-progress :percentage="matchScore" :show-text="false"></el-progress>
              </div>
              <div class="main_result_item_progress_text">
                <span style="color: #64748B;">超过 {{ abovePercent }}% 的同龄人</span>
              </div>
            </div>
          </div>
          <div class="main_result_item salary_rate">
            <div class="main_result_item_content">
              <svg color="#409EFF" width="24" height="24" viewBox="0 0 48 48" fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <path d="M3.982 11.9689V7A3 3 0 0 1 6.982 4H33.397A3 3 0 0 1 36.397 7V11.9889" stroke="currentColor"
                  stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
                <path
                  d="M4 14C4 12.8954 4.89543 12 6 12H42C43.1046 12 44 12.8954 44 14V42C44 43.1046 43.1046 44 42 44H6C4.89543 44 4 43.1046 4 42V14Z"
                  fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round" />
                <path d="M35.25 33H44V23H35.25C32.3505 23 30 25.2386 30 28C30 30.7614 32.3505 33 35.25 33Z" fill="none"
                  stroke="currentColor" stroke-width="4" stroke-linejoin="round" />
                <path d="M44 16.5V40.5" stroke="currentColor" stroke-width="4" stroke-linecap="round" />
              </svg>
              <span>薪资预估</span>
            </div>
            <div class="main_result_item_progress">
              <div class="main_result_item_progress_region">
                <span style="font-size: 27px;font-weight: 600; color: #409EFF; padding-bottom: 10px;">{{ salaryRange
                  }}</span>
                <span class="text" style=" padding-bottom: 8px;">{{ targetJob }}</span>
                <span class="text">市场中位数 {{ salaryMedian }}</span>
              </div>
            </div>
          </div>
          <div class="main_result_item key_advantage">
            <div class="main_result_item_content">
              <svg color="#67C23A" width="24" height="24" viewBox="0 0 48 48" fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M24 44C29.5228 44 34.5228 41.7614 38.1421 38.1421C41.7614 34.5228 44 29.5228 44 24C44 18.4772 41.7614 13.4772 38.1421 9.85786C34.5228 6.23858 29.5228 4 24 4C18.4772 4 13.4772 6.23858 9.85786 9.85786C6.23858 13.4772 4 18.4772 4 24C4 29.5228 6.23858 34.5228 9.85786 38.1421C13.4772 41.7614 18.4772 44 24 44Z"
                  fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round" />
                <path d="M16 24L22 30L34 18" stroke="currentColor" stroke-width="4" stroke-linecap="round"
                  stroke-linejoin="round" />
              </svg>
              <span>核心优势</span>
            </div>
            <div class="main_result_item_progress" style="gap: 18px;">
              <div class="content" v-for="text in coreAdvantages" :key="text">
                <svg color="#67C23A" width="16" height="16" viewBox="0 0 48 48" fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  <path d="M43 11L16.875 37L5 25.1818" stroke="currentColor" stroke-width="4" stroke-linecap="round"
                    stroke-linejoin="round" />
                </svg>
                <span>{{ text }}</span>
              </div>
            </div>
          </div>
          <div class="main_result_item skill_gaps">
            <div class="main_result_item_content">
              <el-icon :size="24" color="#E6A23C">
                <CirclePlus />
              </el-icon>
              <span>待补充技能</span>
            </div>
            <div class="main_result_item_progress" style="gap: 18px;">
              <div class="content" v-for="text in skillGaps" :key="text">
                <el-icon :size="18" color="#E6A23C">
                  <Warning />
                </el-icon>
                <span style="color: #475569;">{{ text }}</span>
              </div>
            </div>
          </div>
          <div class="main_result_item job_advice">
            <div class="main_result_item_content">
              <svg color="#409EFF" width="24" height="24" viewBox="0 0 48 48" fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <circle cx="24" cy="24" r="19" stroke="currentColor" stroke-width="4" />
                <circle cx="24" cy="24" r="12" stroke="currentColor" stroke-width="4" />
                <circle cx="24" cy="24" r="5" stroke="currentColor" stroke-width="4" />
              </svg>
              <span>求职建议</span>
            </div>
            <div class="main_result_item_progress" style="gap: 18px;">
              <div class="content" v-for="(text, index) in jobAdvice" :key="text">
                <div class="circle">
                  {{ index + 1 }}
                </div>
                <span style="color: #475569;">{{ text }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>


  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { CirclePlus, Warning } from '@element-plus/icons-vue'
import { useAIStream } from '@/composables/useAIStream'
import { sectionItems, sectionNumber, sectionText } from '@/utils/aiText'

// 切换分析类型
const activeTab = ref('1')
const { sections, hasResult, loading, error, start, reset, refuseReason, refused } = useAIStream()

const changeAnalysis = (tab: string) => {
  if (tab === activeTab.value) return
  activeTab.value = tab
  // 两个标签页的输入与结果互不通用，切换时清空
  reset()
}

// 文本框内容
const content = ref('')

// 开始分析
const startAnalysis = () => {
  start({
    scene: activeTab.value === '1' ? 'skill' : 'jd',
    input: content.value,
  })
}

// 进度条与百分比不允许超过 100
const clampPercent = (value: number) => Math.min(100, Math.max(0, value))

// 分析结果（由 AI 流式输出解析而来）
const matchScore = computed(() => clampPercent(sectionNumber(sections.value, '匹配度评分')))
const abovePercent = computed(() => clampPercent(sectionNumber(sections.value, '超越比例')))
const salaryRange = computed(() => sectionText(sections.value, '薪资预估'))
const targetJob = computed(() => sectionText(sections.value, '目标岗位'))
const salaryMedian = computed(() => sectionText(sections.value, '市场中位数'))
const coreAdvantages = computed(() => sectionItems(sections.value, '核心优势'))
const skillGaps = computed(() => sectionItems(sections.value, '待补充技能'))
const jobAdvice = computed(() => sectionItems(sections.value, '求职建议'))
</script>

<style scoped>
.ai-analyse {
  display: flex;
  flex-direction: column;
  padding: 30px 60px;
}

.header_analysis {
  display: flex;
  flex-direction: column;
  height: 400px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.1);
}

.header_analysis_content {
  display: flex;
  align-items: center;
  gap: 20px;
  height: 62px;
  padding-left: 23px;
}

.header_analysis_item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 108px;
  height: 100%;
  font-size: 18px;
  color: #64748B;
  cursor: pointer;
}

.header_analysis_item_active {
  box-sizing: border-box;
  color: #409EFF;
  border-bottom: 1px solid #409EFF;
}

.header-analysis-line {
  height: 1px;
  background-color: #E5E7EB;
}

/* 文本框 */
.main_title {
  font-size: 16px;
  line-height: 24px;
  color: #64748B;
  margin-bottom: 10px;
}

.main_analysis {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  box-sizing: border-box;
  padding: 20px 50px;
}

#textarea {
  flex: 1;
  min-height: 0;
  width: 100%;
  padding: 15px 20px;
  border-radius: 18px;
  border-color: #94A3B8;
  opacity: 0.5;
  font-size: 20px;
  box-sizing: border-box;
  resize: none;
}

#textarea:focus {
  outline: none;
}

/* 开始分析按钮 */
.main_button {
  margin-top: 20px;
}

.main_button :deep(.el-button) {
  width: 112px;
  height: 43px;
  transition: none;
}

.main_button :deep(.el-button:not(.is-disabled):hover) {
  background-color: #3d74ff;
  border-color: #3d74ff;
}

/* 分析结果部分 */
.main_result {
  display: flex;
  flex-direction: column;
  margin-top: 16px;
}

/* 分析报错部分 */
.main_error {
  margin: 12px 0 0;
  font-size: 14px;
  color: #F56C6C;
}

/* 淡入淡出效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.main_result_title {
  display: flex;
  justify-content: space-between;
  color: #1F2937;
  font-size: 16px;
}

/* 分析结果内容：第 1、2 行各 2 个，第 3 行 1 个 */
.main_result_content {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.main_result_item {
  display: flex;
  flex-direction: column;
  overflow: auto;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.1);
}

/* 结果卡片内部滚动条 */
.main_result_item::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.main_result_item::-webkit-scrollbar-track {
  /* 上下留白，滑块不顶到卡片圆角 */
  margin: 4px 0;
  background: transparent;
}

.main_result_item::-webkit-scrollbar-thumb {
  border-radius: 3px;
  background: #cbd5e1;
}

.main_result_item::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Firefox 只认这两个标准属性 */
.main_result_item {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

/* 最后一块独占一整行 */
.main_result_content> :last-child {
  grid-column: 1 / -1;
}

.main_result_item_content {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  color: #1F2937;
}

.match_rate,
.salary_rate {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 163px;
}

.key_advantage,
.skill_gaps {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 196px;
}

.job_advice {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 50px;
}

.main_result_item_progress {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 11px;
}

/* 匹配度评分部分 */
.main_result_item_progress_rate {
  margin-bottom: 6px;
}

.main_result_item_progress_text {
  padding: 6px 0;
}

/* 薪资预估部分 */
.main_result_item_progress_region {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.main_result_item_progress_region .text {
  font-size: 16px;
  color: #64748B;
  letter-spacing: 1.5px;
}

/* 核心优势部分 */
.main_result_item_progress .content {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 求职建议部分 */
.main_result_item_progress .circle {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #409EFF;
  font-weight: 600;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: #ECF5FF;
}

/* 无法分析提示：与结果卡片保持同一套视觉 */
.main_refuse {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 16px;
  padding: 20px;
  font-size: 16px;
  line-height: 24px;
  color: #1F2937;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.1);
}

/* 窄屏：单列堆叠（视口 − 240 侧栏 − 120 页面内边距 ≈ 可用宽度，两列需 ≥656px） */
@media (max-width: 1023.98px) {
  .main_result_content {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
