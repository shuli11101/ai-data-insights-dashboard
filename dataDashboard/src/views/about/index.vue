<template>
  <div class="about">
    <!-- 项目简介 -->
    <section class="intro">
      <h2 class="intro__title">项目简介</h2>
      <p class="intro__text">
        AI招聘数据洞察看板是面向招聘团队与 HRBP 的一站式数据产品，把分散在各招聘平台的岗位、薪酬与人才画像数据统一汇聚，让招聘决策从经验判断转向数据驱动。
      </p>
      <p class="intro__text intro__text--sub">
        项目重点解决三个问题：岗位数据分散、难以横向对比；薪酬区间缺少可信参考；招聘策略调整缺少量化依据。通过统一的数据模型与可视化看板，团队可以在同一界面完成岗位洞察、薪酬对标与人才结构分析，并借助 AI
        能力自动生成可执行的招聘建议。
      </p>
    </section>
    <section class="intro">
      <h2 class="intro__title">技术栈</h2>
      <div v-for="skill in skills" :key="skill.title" class="intro__text skills">
        <span class="skills__name">{{ skill.title }}</span>
        <span class="skills__tags">
          <span v-for="tag in skill.tags" :key="tag" class="tag">{{ tag }}</span>
        </span>
      </div>
    </section>
    <section class="intro intro_feature">
      <h2 class="intro__title">功能说明</h2>
      <div v-for="feature in features" :key="feature.title" class="intro__text feature">
        <div class="feature__icon" v-html="feature.icon"></div>
        <span class="feature__title">{{ feature.title }}</span>
        <span class="feature__desc">{{ feature.description }}</span>
      </div>
    </section>
    <section class="intro intro_link">
      <h2 class="intro__title">链接入口</h2>
      <div class="intro__link_description">项目代码与在线演示环境均已开放，可直接查看实现细节或体验完整看板。</div>
      <div class="intro__link_btn">
        <el-button @click="openGitHubRepo">GitHub 仓库</el-button>
        <el-button @click="onlineShare" type="primary">
          <svg class="intro__link_icon" width="14" height="14" viewBox="0 0 48 48" fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path d="M28 6H42V20" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
            <path
              d="M42 29.4737V39C42 40.6569 40.6569 42 39 42H9C7.34315 42 6 40.6569 6 39V9C6 7.34315 7.34315 6 9 6L18 6"
              stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M25.7998 22.1999L41.0998 6.8999" stroke="currentColor" stroke-width="4" stroke-linecap="round"
              stroke-linejoin="round" />
          </svg>
          在线分享
        </el-button>
      </div>
    </section>
    <!-- 在线分享弹窗 -->
    <div class="online_share_dialog">
      <el-dialog width="520px" v-model="isOpened" title="复制链接">
        <div class="line"></div>
        <span style="color:#64748B;">任何获得该链接的成员都可以查看此看板，链接已包含当前筛选条件。</span>
        <div class="links">
          <div class="link">https://github.com/shuli11101/ai-data-insights-dashboard</div>
          <el-button :class="{ 'link_btn--success': isCopySuccess }" @click="copyLink" class="link_btn" type="primary">
            <el-icon style="margin-right: 4px;">
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
import { ElMessageBox, ElMessage } from 'element-plus'
import { h, ref } from 'vue'
import { CopyDocument } from '@element-plus/icons-vue'

// 技术栈
interface Skill {
  title: string
  tags: string[]
}
const skills = ref<Skill[]>([
  { title: '前端', tags: ['Vue', 'TypeScript', 'Element Plus', 'Vite', 'ECharts'] },
  { title: '后端', tags: ['Node.js', 'NextJS', 'PostgreSQL', 'Redis', 'Prisma'] },
  { title: '数据', tags: ['ClickHouse', 'Apache Airflow', 'dbt', 'Pandas'] },
  { title: 'AI', tags: ['Pytorch', 'LangChain', 'Milvus', 'OpenAI GPT-4o'] },
])

// 功能说明
interface Feature {
  icon: string
  title: string
  description: string
}
const features = ref<Feature[]>([
  { title: '多源岗位数据聚合', description: '每日自动采集主流招聘平台的岗位信息，统一清洗、去重后入库。', icon: '<svg width="18" height="18" color="#409EFF" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M44.0001 11C44.0001 11 44 36.0623 44 38C44 41.3137 35.0457 44 24 44C12.9543 44 4.00003 41.3137 4.00003 38C4.00003 36.1423 4 11 4 11" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M44 29C44 32.3137 35.0457 35 24 35C12.9543 35 4 32.3137 4 29" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M44 20C44 23.3137 35.0457 26 24 26C12.9543 26 4 23.3137 4 20" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="24" cy="10" rx="20" ry="6" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>' },
  { title: '多维薪酬洞察', description: '按城市、经验与学历维度统计薪酬分位，输出中位数与区间分布。', icon: '<svg width="18" height="18" color="#409EFF" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 6V42H42" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 30V34" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 22V34" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M30 6V34" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M38 14V34" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>' },
  { title: '岗位趋势监测', description: '追踪热门岗位的需求变化曲线，识别环比异常并给出预警。', icon: '<svg width="18" height="18" color="#409EFF" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M40.9999 27.0005V15.0005H29" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 37L16.3385 24.5L26.1846 30.5L41 15" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>' },
  { title: 'AI 智能解读', description: '针对数据波动自动生成归因分析，辅助招聘策略快速调整。', icon: '<svg width="18" height="18" color="#409EFF" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.26275 2.1105C8.32905 1.75553 8.63889 1.4982 9 1.4982C9.36111 1.4982 9.67095 1.75553 9.73725 2.1105L10.5255 6.279C10.6401 6.88551 11.1145 7.35993 11.721 7.4745L15.8895 8.26275C16.2445 8.32905 16.5018 8.63889 16.5018 9C16.5018 9.36111 16.2445 9.67095 15.8895 9.73725L11.721 10.5255C11.1145 10.6401 10.6401 11.1145 10.5255 11.721L9.73725 15.8895C9.67095 16.2445 9.36111 16.5018 9 16.5018C8.63889 16.5018 8.32905 16.2445 8.26275 15.8895L7.4745 11.721C7.35993 11.1145 6.88551 10.6401 6.279 10.5255L2.1105 9.73725C1.75553 9.67095 1.4982 9.36111 1.4982 9C1.4982 8.63889 1.75553 8.32905 2.1105 8.26275L6.279 7.4745C6.88551 7.35993 7.35993 6.88551 7.4745 6.279L8.26275 2.1105" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 1.5V4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M16.5 3H13.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M1.5 15C1.5 15.8279 2.17213 16.5 3 16.5C3.82787 16.5 4.5 15.8279 4.5 15C4.5 14.1721 3.82787 13.5 3 13.5C2.17213 13.5 1.5 14.1721 1.5 15H1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' },
  { title: '技能评估与 JD 拆解', description: '输入个人技术栈或岗位 JD，输出匹配度评分与技能缺口清单。', icon: '<svg color="#409EFF" width="24" height="24" viewBox="0 0 48 48" fill="none"xmlns="http://www.w3.org/2000/svg"> <circle cx="24" cy="24" r="19" stroke="currentColor" stroke-width="4" /><circle cx="24" cy="24" r="12" stroke="currentColor" stroke-width="4" /> <circle cx="24" cy="24" r="5" stroke="currentColor" stroke-width="4" /></svg>' },
])

// 链接入口
const openGitHubRepo = () => {
  window.open('https://github.com/shuli11101/ai-data-insights-dashboard', '_blank')
}

// 在线分享
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
  } catch (error) {
    ElMessage.error('复制链接失败')
    isCopySuccess.value = false
  }
}




</script>

<style scoped>
.about {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  max-width: 1700px;
  margin: 0 auto;
}

/* 卡片样式对齐设计稿：白底 + 1px 描边 + 8px 圆角 + 双层浅阴影 */
.intro {
  padding: 21px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow:
    0 1px 3px 0 rgba(15, 23, 42, 0.03),
    0 1px 2px 0 rgba(15, 23, 42, 0.04);
}

.intro__title {
  margin: 0 0 11px;
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  color: #1f2937;
}

.intro__text {
  margin: 0;
  font-size: 14px;
  font-weight: 400;
  line-height: 25.2px;
  color: #475569;
}

/* 第二段为补充说明，字号与颜色各降一档 */
.intro__text--sub {
  font-size: 13px;
  line-height: 23.4px;
  color: #64748b;
}

/* 技术栈 */
.intro .skills {
  display: flex;
  align-items: center;
  gap: 28px;
  margin-bottom: 12px;
}

/* 技能栈 */
.skills__name {
  flex: 0 0 42px;
}

/* 标签单独一层容器：换行时第二排才能与第一排标签左对齐（而不是退到「前端」下面），
   也避免父级 gap 把「名称—标签」的间距一起放大 */
.skills__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 28px;
}

.intro__text .tag {
  color: #409eff;
  background: #ECF5FF;
  padding: 4px 8px;
  border-radius: 999px;
}

/* 功能说明：图标与标题一行，描述落到第二行第 2 列，缩进量由网格列宽统一控制 */
.intro_feature {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.feature {
  display: grid;
  grid-template-columns: 18px 1fr;
  column-gap: 8px;
  align-items: center;
}

/* v-html 注入的 svg 默认是 inline 元素，行盒会留出基线以下的空间，
   使图标比文字偏高；用 flex 包住即可消除 */
.feature__icon {
  display: flex;
}

.feature__title {
  font-size: 14px;
  font-weight: 600;
  line-height: 24px;
}

/* 描述显式指定第 2 列，否则会被自动排到下一行第 1 列 */
.feature__desc {
  grid-column: 2;
  color: #64748B;
}

/* 链接入口 */
.intro_link {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 在线分享窗口 */
.online_share_dialog :deep(.el-dialog) {
  display: flex;
  flex-direction: column;
  --el-dialog-border-radius: 16px;
}

/* el-dialog__body 自身没有间距，用 flex + gap 把分割线、说明文字、链接行分开 */
.online_share_dialog :deep(.el-dialog__body) {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.online_share_dialog .line {
  width: 100%;
  height: 1px;
  background: #E5E7EB;
}

/* 行内元素之间的换行空白会被模板编译删除，间距必须显式指定 */
.online_share_dialog .links {
  display: flex;
  align-items: center;
  gap: 12px;
}

.online_share_dialog .link {
  padding: 8px 12px;
  border: 1px solid #E5E7EB;
  border-radius: 4px;
  background-color: #F1F5F9;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.online_share_dialog .link_btn {
  height: 36px;
}

/* 链接较长，允许在任意字符处换行，避免把复制按钮挤出弹窗 */
.online_share_dialog .links>span {
  min-width: 0;
  word-break: break-all;
}


/* el-button 会把插槽内容包进一个 span，插槽里的图标和文字是同级行内元素，
   无法用 gap，改用 margin 给图标留出间隔 */
.intro__link_icon {
  margin-right: 6px;
}

.intro__link_description {
  font-size: 13px;
  color: #64748B;
}

.online_share_dialog .link_btn--success {
  background-color: #F1F5F9;
  color: #64748B;
  border-color: #F1F5F9;
}



/* 手机端：页面与卡片内边距同步收窄 */
@media (max-width: 1023.98px) {
  .about {
    padding: 12px;
  }

  .intro {
    padding: 16px;
  }

  /* 平板：横向空间不足，标签自动折成两排，间距同步收窄 */
  .intro .skills {
    gap: 12px;
  }

  .skills__tags {
    gap: 8px 12px;
  }
}
</style>
