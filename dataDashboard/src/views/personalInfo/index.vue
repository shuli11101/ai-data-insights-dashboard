<template>
  <div class="personal-info">
    <section class="personal-info__card">
      <h2 class="personal-info__title">个人基础信息</h2>
      <p class="personal-info__desc">填写后AI将生成更精准的技能评估与求职建议</p>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="96px" label-position="right">
        <el-row :gutter="20">
          <div class="personal-info__desc salary-desc">个人基础情况</div>
          <el-col :span="24">
            <el-form-item label="工作经验" prop="experience">
              <el-select v-model="form.experience" placeholder="请选择工作经验" style="max-width: 200px" clearable>
                <el-option v-for="item in experiences" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="意向城市" prop="city">
              <el-select v-model="form.city" placeholder="请选择意向城市" style="max-width: 150px" clearable>
                <el-option v-for="item in cities" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="拥有技术" prop="skills">
              <el-select v-model="form.skills" multiple clearable collapse-tags :max-collapse-tags="2"
                collapse-tags-tooltip placeholder="请选择拥有的技术（可多选）">
                <el-option v-for="item in skillOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="目前学历" prop="education">
              <el-select v-model="form.education" placeholder="请选择学历" style="max-width: 150px" clearable>
                <el-option v-for="item in educationOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
          </el-col>
          <div class="personal-info__desc salary-desc">薪资情况</div>
          <el-col :span="24">
            <el-form-item label="目前月薪" prop="currentSalary">
              <div class="salary-field">
                <el-input type="number" v-model="form.currentSalary" :min="0" :step="100" :controls="false"
                  placeholder="请填写目前月薪" />
                <span class="salary-unit">元/月</span>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="期望薪资" prop="expectedSalary">
              <div class="salary-field">
                <el-input type="number" v-model="form.expectedSalary" :min="0" :step="100" :controls="false"
                  placeholder="请填写期望薪资" />
                <span class="salary-unit">元/月</span>
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <div class="personal-info__actions">
          <el-button @click="handleReset">重置</el-button>
          <el-button type="primary" @click="handleSubmit">提交</el-button>
        </div>
      </el-form>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'

import { getCity, getKeywords, getPersonal, setPersonalInfo } from '@/api/server'

const formRef = ref<FormInstance>()

// 选项配置
const educationOptions = ['中专或以下', '大专', '本科', '硕士', '博士']
const experiences = ref<{ label: string, value: string }[]>([
  {
    label: '应届',
    value: '应届',
  },
  {
    label: '1年以下',
    value: '0-1',
  },
  {
    label: '1-3年',
    value: '1-3',
  },
  {
    label: '3-5年',
    value: '3-5',
  },
  {
    label: '5年以上',
    value: '5-',
  }
])
const skillOptions = ref<{ label: string, value: string }[]>([])
const cities = ref<{ label: string, value: string }[]>([])

// 表单数据
const form = reactive({
  education: '',
  experience: '',
  skills: [] as string[],
  city: '',
  currentSalary: undefined as number | undefined,
  expectedSalary: undefined as number | undefined
})

// 表单数据副本（用于重置表单时恢复）
const formBackup = reactive({
  education: '',
  experience: '',
  skills: [] as string[],
  city: '',
  currentSalary: undefined as number | undefined,
  expectedSalary: undefined as number | undefined
})



onMounted(() => {
  // 初始化时获取城市列表
  getCityOptions()
  // 初始化时获取技术关键词
  getKeywordOptions()
  // 初始化时回显已提交的个人信息
  getInfo()
})

// 获取用户基础信息
const getInfo = async () => {
  const res = await getPersonal()
  if (res) {
    Object.assign(form, res)
    // 备份表单数据
    Object.assign(formBackup, res)
  }
}

// 获取城市
const getCityOptions = async () => {
  const res = await getCity()
  cities.value = res.map(item => {
    return {
      label: item.district,
      value: item.district,
    }
  })
  cities.value.unshift({ label: '不限城市', value: '不限城市' })
}

// 获取技术关键词
const getKeywordOptions = async () => {
  const res = await getKeywords()
  skillOptions.value = res.map(item => {
    return {
      label: item.skill,
      value: item.skill,
    }
  })
}

// 在提交时校验
const SUBMIT_TRIGGER = 'submit'
// 仅必填项配置校验：意向城市、工作经验、拥有技术
const rules: FormRules = {
  experience: [{ required: true, message: '请选择工作经验', trigger: SUBMIT_TRIGGER }],
  skills: [{ required: true, type: 'array', message: '请至少选择一项技术', trigger: SUBMIT_TRIGGER }],
  city: [{ required: true, message: '请选择意向城市', trigger: SUBMIT_TRIGGER }]
}

const handleSubmit = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  // 提交用户基础信息（IP 由服务端从请求中获取）
  await setPersonalInfo({
    city: form.city,
    experience: form.experience,
    currentSalary: form.currentSalary,
    expectedSalary: form.expectedSalary,
    education: form.education,
    skills: form.skills
  })
  // 表单副本数据更新
  Object.assign(formBackup, form)
  ElMessage.success('提交成功')
}

const handleReset = () => {
  // 恢复表单数据
  Object.assign(form, formBackup)
}
</script>

<style scoped>
.personal-info {
  padding: 20px;
}

/* 卡片样式对齐设计稿：白底 + 1px 描边 + 8px 圆角 + 双层浅阴影 */
.personal-info__card {
  max-width: 1760px;
  margin: 0 auto;
  padding: 24px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow:
    0 1px 3px 0 rgba(15, 23, 42, 0.03),
    0 1px 2px 0 rgba(15, 23, 42, 0.04);
}

.personal-info__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  color: #1f2937;
}

.personal-info__desc {
  margin: 4px 0 20px;
  font-size: 13px;
  color: #64748b;
}

/* 表单项控件宽度上限：避免整行时输入框与下拉面板过长（下拉面板宽度跟随 select 宽度） */
:deep(.el-form-item__content) {
  max-width: 360px;
}

/* 薪资输入框样式 */
.salary-field {
  display: flex;
  align-items: center;
}

.salary-field :deep(.el-input) {
  flex: 1;
}

.salary-unit {
  margin-left: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* 操作区：与表单右侧对齐，与最后一个表单项保持间距 */
.personal-info__actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}

/* 薪资情况描述 */
.salary-desc {
  margin: 5px 12px;
  color: rgb(100, 116, 139);
}

/* 手机端：页面与卡片内边距同步收窄 */
@media (max-width: 1023.98px) {
  .personal-info {
    padding: 12px;
  }

  .personal-info__card {
    padding: 16px;
  }

  /* label 与输入框改为上下两行 */
  .personal-info :deep(.el-form-item) {
    display: block;
  }

  /* label 的宽度是 Element Plus 以内联 style 写上去的（96px），只能靠 !important 覆盖；
     label 本身是 inline-flex + justify-content 右对齐，改成 block 后自然变为左对齐 */
  .personal-info :deep(.el-form-item__label) {
    display: block;
    width: auto !important;
    text-align: left;
    padding: 0 0 4px;
    line-height: 22px;
  }
}
</style>
