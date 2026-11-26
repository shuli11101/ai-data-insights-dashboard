<template>
  <!--
    岗位工作描述弹窗
    库里没有独立的描述字段，长文本混在 tags_all 中，这里按长度拆出来展示
  -->
  <el-dialog v-model="visible" class="job-desc" width="680px" :title="job?.job_name ?? ''" append-to-body>
    <div v-if="job" class="job-desc__body">
      <p class="job-desc__meta">
        <span>{{ job.company }}</span>
        <span class="job-desc__dot">·</span>
        <span>{{ formatSalary(job) }}</span>
        <span class="job-desc__dot">·</span>
        <span>{{ job.experience || '经验不限' }}</span>
      </p>

      <template v-if="description.length">
        <h4 class="job-desc__title">工作描述</h4>
        <ul class="job-desc__list">
          <li v-for="(line, index) in description" :key="index" class="job-desc__item">{{ line }}</li>
        </ul>
      </template>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { formatSalary } from '@/utils/job'

/** 岗位数据表格行 */
interface JobRow {
  id: number
  job_name: string
  company: string
  /** 薪资展示文案，如 17-22K；面议时为「面议」 */
  salary_desc?: string
  /** 面议时 salary_min / salary_max 为 null */
  salary_min: number | null
  salary_max: number | null
  experience: string
  degree?: string
  tags_all: string[]
}

const props = defineProps<{
  /** 当前查看的岗位，null 时弹窗内容为空 */
  job: JobRow | null
}>()

/** 弹窗显隐：由父组件 v-model 控制 */
const visible = defineModel<boolean>({ default: false })

/** 超过这个长度才视为描述文本，其余是普通技能标签 */
const DESCRIPTION_MIN_LENGTH = 10

const description = computed(() =>
  (props.job?.tags_all ?? []).filter((tag) => tag.length >= DESCRIPTION_MIN_LENGTH),
)
</script>

<style scoped>
.job-desc__body {
  max-height: 60vh;
  overflow-y: auto;
}

.job-desc__meta {
  margin: 0 0 16px;
  font-size: 13px;
  line-height: 20px;
  color: #64748b;
}

.job-desc__dot {
  margin: 0 6px;
  color: #cbd5e1;
}

.job-desc__title {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 600;
  line-height: 22px;
  color: #1f2937;
}

.job-desc__list {
  margin: 0;
  padding-left: 18px;
}

.job-desc__item {
  margin-bottom: 8px;
  font-size: 13px;
  line-height: 22px;
  color: #334155;
}

.job-desc__item:last-child {
  margin-bottom: 0;
}
</style>
