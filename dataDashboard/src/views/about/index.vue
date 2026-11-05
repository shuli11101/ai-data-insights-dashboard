<template>
  <div class="about">
    <div class="about__inner">
      <!-- 页面标题 -->
      <header class="about__head">
        <h1 class="about__title">关于</h1>
        <p class="about__subtitle">AI 招聘数据洞察看板</p>
      </header>

      <!-- 内容大卡片：项目简介 / 技术栈 / 功能说明 / 链接入口 -->
      <section class="sheet">
        <div class="sheet__section">
          <h2 class="sheet__title">项目简介</h2>
          <p class="sheet__lead">
            AI招聘数据洞察看板是面向招聘团队与 HRBP 的一站式数据产品，把分散在各招聘平台的岗位、薪酬与人才画像数据统一汇聚，让招聘决策从经验判断转向数据驱动。
          </p>
          <p class="sheet__text">
            项目重点解决三个问题：岗位数据分散、难以横向对比；薪酬区间缺少可信参考；招聘策略调整缺少量化依据。
          </p>
          <p class="sheet__text">
            通过统一的数据模型与可视化看板，团队可以在同一界面完成岗位洞察、薪酬对标与人才结构分析，并借助 AI 能力自动生成可执行的招聘建议。
          </p>
        </div>

        <div class="sheet__divider"></div>

        <div class="sheet__section">
          <h2 class="sheet__title">技术栈</h2>
          <div v-for="skill in skills" :key="skill.title" class="stack">
            <span class="stack__name">{{ skill.title }}</span>
            <span class="stack__tags">
              <span v-for="tag in skill.tags" :key="tag" class="stack__tag">{{ tag }}</span>
            </span>
          </div>
        </div>

        <div class="sheet__divider"></div>

        <div class="sheet__section">
          <h2 class="sheet__title">功能说明</h2>
          <div class="features">
            <div v-for="feature in features" :key="feature.title" class="feature">
              <div class="feature__icon" v-html="feature.icon"></div>
              <div class="feature__text">
                <span class="feature__title">{{ feature.title }}</span>
                <span class="feature__desc">{{ feature.description }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="sheet__divider"></div>

        <div class="sheet__section">
          <h2 class="sheet__title">链接入口</h2>
          <p class="sheet__text">项目代码与在线演示环境均已开放，可直接查看实现细节或体验完整看板。</p>

          <div class="links">
            <el-button class="links__btn" @click="openGitHubRepo">GitHub 仓库</el-button>
            <el-button class="links__btn links__btn--primary" type="primary" @click="onlineShare">
              <el-icon class="links__icon">
                <Share />
              </el-icon>
              在线分享
            </el-button>
          </div>
        </div>
      </section>
    </div>

    <!-- 在线分享弹窗 -->
    <div class="online_share_dialog">
      <el-dialog v-model="isOpened" width="520px" title="复制链接">
        <div class="line"></div>
        <span class="dialog__desc">任何获得该链接的成员都可以查看此看板，链接已包含当前筛选条件。</span>
        <div class="links">
          <div class="link">https://github.com/shuli11101/ai-data-insights-dashboard</div>
          <el-button :class="{ 'link_btn--success': isCopySuccess }" class="link_btn" type="primary"
            @click="copyLink">
            <el-icon class="link_btn__icon">
              <CopyDocument />
            </el-icon>
            {{ isCopySuccess ? '已复制' : '复制' }}
          </el-button>
        </div>
      </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { CopyDocument, Share } from '@element-plus/icons-vue'

/** 技术栈分组 */
interface Skill {
  title: string
  tags: string[]
}

const skills: Skill[] = [
  { title: '前端', tags: ['Vue', 'TypeScript', 'Element Plus', 'Vite', 'ECharts'] },
  { title: '后端', tags: ['Node.js', 'NextJS', 'PostgreSQL', 'Redis', 'Prisma'] },
  { title: '数据', tags: ['ClickHouse', 'Apache Airflow', 'dbt', 'Pandas'] },
  { title: 'AI', tags: ['Pytorch', 'LangChain', 'Milvus', 'OpenAI GPT-4o'] },
]

/** 功能说明：图标用内联 SVG，颜色由 CSS 的 color 统一控制（svg 内部使用 currentColor） */
interface Feature {
  icon: string
  title: string
  description: string
}

const features: Feature[] = [
  {
    title: '多源岗位数据聚合',
    description: '每日自动采集主流招聘平台的岗位信息，统一清洗、去重后入库。',
    icon: '<svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M44 11v27c0 3.31-8.95 6-20 6S4 41.31 4 38V11" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M44 29c0 3.31-8.95 6-20 6S4 32.31 4 29" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M44 20c0 3.31-8.95 6-20 6S4 23.31 4 20" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="24" cy="10" rx="20" ry="6" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  },
  {
    title: '多维薪酬洞察',
    description: '按城市、经验与学历维度统计薪酬分位，输出中位数与区间分布。',
    icon: '<svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 6v36h36" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 30v4M22 22v12M30 6v28M38 14v20" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  },
  {
    title: '岗位趋势监测',
    description: '追踪热门岗位的需求变化曲线，识别环比异常并给出预警。',
    icon: '<svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M41 27V15H29" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 37l10.34-12.5 9.85 6L41 15" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  },
  {
    title: 'AI 智能解读',
    description: '针对数据波动自动生成归因分析，辅助招聘策略快速调整。',
    icon: '<svg width="20" height="20" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.26 2.11c.07-.35.38-.61.74-.61s.67.26.74.61l.79 4.17c.11.61.59 1.08 1.2 1.2l4.17.79c.35.07.61.38.61.74s-.26.67-.61.74l-4.17.79c-.61.11-1.08.59-1.2 1.2l-.79 4.17c-.07.35-.38.61-.74.61s-.67-.26-.74-.61l-.79-4.17c-.11-.61-.59-1.08-1.2-1.2l-4.17-.79c-.35-.07-.61-.38-.61-.74s.26-.67.61-.74l4.17-.79c.61-.11 1.08-.59 1.2-1.2l.79-4.17Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 1.5v3M16.5 3h-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M1.5 15a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  },
  {
    title: '技能评估与 JD 拆解',
    description: '输入个人技术栈或岗位 JD，输出匹配度评分与技能缺口清单。',
    icon: '<svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="24" cy="24" r="19" stroke="currentColor" stroke-width="3"/><circle cx="24" cy="24" r="12" stroke="currentColor" stroke-width="3"/><circle cx="24" cy="24" r="5" stroke="currentColor" stroke-width="3"/><path d="M24 1v6M24 41v6M1 24h6M41 24h6" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>',
  },
]

/** 打开 GitHub 仓库 */
const openGitHubRepo = () => {
  window.open('https://github.com/shuli11101/ai-data-insights-dashboard', '_blank')
}

/** 在线分享弹窗 */
const isOpened = ref(false)
const onlineShare = () => {
  isOpened.value = true
}

const isCopySuccess = ref(false)
const copyLink = async () => {
  try {
    await navigator.clipboard.writeText('https://github.com/shuli11101/ai-data-insights-dashboard')
    ElMessage.success('已复制')
    isCopySuccess.value = true
  } catch {
    ElMessage.error('复制链接失败')
    isCopySuccess.value = false
  }
}
</script>

<style scoped lang="scss">
.about {
  --jv-primary: #007c77;
  --jv-ink: #17252b;
  --jv-text: #3d4b54;
  --jv-muted: #65747c;
  --jv-faint: #8a979e;
  --jv-border: #dde8e6;
  --jv-line: #edf2f2;

  min-height: 100%;
  font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  color: var(--jv-ink);
  background: #f4f8f7;

  .about__inner {
    box-sizing: border-box;
    width: 100%;
    max-width: 1280px;
    padding: 0 40px 40px;
    margin: 0 auto;
  }

  .about__head {
    padding: 36px 0 26px;
  }

  .about__title {
    margin: 0;
    font-size: 38px;
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: -1.4px;
    color: var(--jv-ink);
  }

  .about__subtitle {
    margin: 8px 0 0;
    font-size: 13px;
    color: var(--jv-muted);
  }

  @media (max-width: 1023.98px) {
    .about__inner {
      padding: 0 24px 32px;
    }
  }

  @media (max-width: 640px) {
    .about__inner {
      padding: 0 16px 24px;
    }

    .about__head {
      padding: 24px 0 18px;
    }

    .about__title {
      font-size: 28px;
      letter-spacing: -0.8px;
    }
  }
}

// ---------- 内容大卡片 ----------
.sheet {
  padding: 32px;
  background: #ffffff;
  border: 1px solid var(--jv-border);
  border-radius: 18px;

  .sheet__section + .sheet__divider,
  .sheet__divider + .sheet__section {
    margin-top: 28px;
  }

  .sheet__divider {
    height: 1px;
    background: var(--jv-line);
  }

  .sheet__title {
    margin: 0 0 14px;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.3px;
    color: var(--jv-ink);
  }

  .sheet__lead {
    margin: 0;
    font-size: 14.5px;
    line-height: 1.8;
    color: var(--jv-text);
  }

  .sheet__text {
    margin: 10px 0 0;
    font-size: 13.5px;
    line-height: 1.8;
    color: var(--jv-muted);
  }

  @media (max-width: 1023.98px) {
    padding: 24px;
  }

  @media (max-width: 640px) {
    padding: 18px;
  }
}

// ---------- 技术栈 ----------
.stack {
  display: flex;
  align-items: center;
  gap: 26px;

  & + .stack {
    margin-top: 16px;
  }

  // 名称列固定宽度，保证四行标签左端对齐
  .stack__name {
    flex: 0 0 32px;
    font-size: 12px;
    color: var(--jv-muted);
  }

  .stack__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .stack__tag {
    padding: 4px 10px;
    font-size: 11.5px;
    line-height: 16px;
    color: var(--jv-text);
    background: #f1f8f6;
    border-radius: 6px;
  }

  @media (max-width: 640px) {
    gap: 12px;
  }
}

// ---------- 功能说明 ----------
.features {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px 32px;

  @media (max-width: 767.98px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 20px;
  }
}

.feature {
  display: flex;
  align-items: flex-start;
  gap: 12px;

  // 图标继承主色，svg 内部用 currentColor 描边
  .feature__icon {
    display: flex;
    flex-shrink: 0;
    color: var(--jv-primary);

    :deep(svg) {
      color: inherit;
    }
  }

  .feature__text {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .feature__title {
    font-size: 14px;
    font-weight: 600;
    line-height: 1.5;
    color: var(--jv-ink);
  }

  .feature__desc {
    font-size: 11.5px;
    line-height: 1.6;
    color: var(--jv-muted);
  }
}

// ---------- 链接入口 ----------
.links {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 20px;

  .links__btn {
    height: 36px;
    padding: 0 16px;
    font-size: 12px;
    font-weight: 500;
    border-radius: 8px;

    --el-button-text-color: var(--jv-text);
    --el-button-bg-color: #ffffff;
    --el-button-border-color: #d8e2e3;
    --el-button-hover-text-color: var(--jv-primary);
    --el-button-hover-bg-color: #f7fbfa;
    --el-button-hover-border-color: #bfdcd7;
    --el-button-active-border-color: #bfdcd7;
  }

  .links__btn--primary {
    --el-button-text-color: #ffffff;
    --el-button-bg-color: var(--jv-primary);
    --el-button-border-color: var(--jv-primary);
    --el-button-hover-text-color: #ffffff;
    --el-button-hover-bg-color: #006b66;
    --el-button-hover-border-color: #006b66;
    --el-button-active-bg-color: #00605c;
    --el-button-active-border-color: #00605c;
  }

  .links__icon {
    margin-right: 6px;
    font-size: 13px;
  }
}

// ---------- 在线分享弹窗 ----------
.online_share_dialog {
  :deep(.el-dialog) {
    display: flex;
    flex-direction: column;

    --el-dialog-border-radius: 16px;
  }

  :deep(.el-dialog__body) {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .line {
    width: 100%;
    height: 1px;
    background: #e5e7eb;
  }

  .dialog__desc {
    font-size: 13px;
    color: #64748b;
  }

  .links {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 0;
  }

  .link {
    padding: 8px 12px;
    overflow: hidden;
    font-size: 12.5px;
    color: var(--jv-text);
    text-overflow: ellipsis;
    white-space: nowrap;
    background-color: #f1f5f9;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
  }

  .link_btn {
    flex-shrink: 0;
    height: 36px;
  }

  .link_btn__icon {
    margin-right: 4px;
  }

  .link_btn--success {
    color: #64748b;
    background-color: #f1f5f9;
    border-color: #f1f5f9;
  }
}
</style>
