<template>
  <div class="survey">
    <el-dialog v-model="visible" width="50%" :close-on-click-modal="false">
      <template #title>
        <span class="dialog-title">个人基础信息</span>
      </template>
      <div class="dialog-desc">填写后AI将生成更精准的技能评估与求职建议</div>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="96px" label-position="right">
        <el-row :gutter="20">
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
          <el-col :span="12" :xs="24" :sm="24">
            <el-form-item label="目前月薪" prop="currentSalary">
              <div class="salary-field">
                <el-input type="number" v-model="form.currentSalary" :min="0" :step="100" :controls="false"
                  placeholder="请填写目前月薪" />
                <span class="salary-unit">元/月</span>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12" :xs="24" :sm="24">
            <el-form-item label="期望薪资" prop="expectedSalary">
              <div class="salary-field">
                <el-input type="number" v-model="form.expectedSalary" :min="0" :step="100" :controls="false"
                  placeholder="请填写期望薪资" />
                <span class="salary-unit">元/月</span>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'

import { getCity, getKeywords } from '@/api/server'
import { usePersonalInfoStore } from '@/stores/personalInfo'

const personalInfoStore = usePersonalInfoStore()

const visible = ref(true)
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

const form = reactive({
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
})



// 获取城市
const getCityOptions = async () => {
  const res = await getCity()
  cities.value = res.map(item => {
    return {
      label: item.city,
      value: item.city,
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
  console.log(form)
  // 提交用户基础信息（IP 由服务端从请求中获取）
  await personalInfoStore.submitPersonal({
    city: form.city,
    experience: form.experience,
    currentSalary: form.currentSalary,
    expectedSalary: form.expectedSalary,
    education: form.education,
    skills: form.skills
  })
  ElMessage.success('提交成功')
  visible.value = false
}
</script>

<style scoped>
/* 标题样式 */
:deep(.el-dialog__header) {
  padding-bottom: 8px;
}

.dialog-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 0;
}

/* 副标题样式 */
.dialog-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 20px;
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

/* 手机端 / 平板：label 与输入框改为上下两行 */
@media (max-width: 1023.98px) {
  :deep(.el-form-item) {
    display: block;
  }

  /* label 的宽度是 Element Plus 以内联 style 写上去的（96px），只能靠 !important 覆盖；
     label 本身是 inline-flex + justify-content 右对齐，改成 block 后自然变为左对齐 */
  :deep(.el-form-item__label) {
    display: block;
    width: auto !important;
    text-align: left;
    padding: 0 0 4px;
    line-height: 22px;
  }
}
</style>
