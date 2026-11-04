<template>
  <div class="personal-info">
    <!-- 未登录：提示登录 -->
    <section v-if="!loggedIn" class="personal-info__state">
      <h2 class="personal-info__state-title">登录后完善个人信息</h2>
      <p class="personal-info__state-desc">保存基本资料与求职意向，AI 分析会结合你的情况给出建议。</p>
      <el-button type="primary" class="personal-info__state-btn" @click="goLogin">登录 / 注册</el-button>
    </section>

    <!-- 首次请求返回前先占位，避免布局跳动 -->
    <section v-else-if="!personalInfoStore.loaded" v-loading="true" class="personal-info__state personal-info__loading">
    </section>

    <div v-else class="personal-info__layout">
      <!-- 左：基本资料 -->
      <aside class="profile-pane">
        <header class="pane-head">
          <h1 class="pane-title">基本资料</h1>
          <p class="pane-desc">头像、姓名与联系方式</p>
        </header>

        <div class="field">
          <span class="field__label">头像</span>
          <div class="avatar-row">
            <el-avatar :size="84" :src="profileForm.avatar || undefined" class="avatar-row__avatar">
              {{ initial }}
            </el-avatar>
            <div class="avatar-row__side">
              <el-button class="ghost-btn" :loading="uploading" @click="pickAvatar">更换头像</el-button>
              <p class="field__hint">JPG / PNG，最大 2MB</p>
            </div>
            <input ref="fileInput" type="file" accept="image/png,image/jpeg" hidden @change="handleAvatarChange" />
          </div>
        </div>

        <div class="field">
          <span class="field__label">姓名</span>
          <el-input v-model="profileForm.nickname" maxlength="20" placeholder="请输入姓名" />
        </div>

        <div class="field">
          <span class="field__label field__label--row">
            <span>手机号</span>
            <span class="field__hint">不可修改</span>
          </span>
          <el-input :model-value="maskedPhone" disabled placeholder="未绑定手机号" />
        </div>

        <div class="field">
          <span class="field__label">目前工作</span>
          <el-input v-model="profileForm.currentJob" maxlength="64" placeholder="如：高级前端工程师 · 星野科技" />
        </div>

        <div class="field">
          <span class="field__label">所在地</span>
          <el-select v-model="profileForm.location" class="w-full" filterable allow-create default-first-option
            placeholder="请选择所在地">
            <el-option v-for="item in cityOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </div>

        <!-- 基本资料单独保存，只调用账号资料接口 -->
        <footer class="save-bar save-bar--profile">
          <span class="save-bar__hint">手机号与资料仅用于求职分析，不会对招聘方展示。</span>
          <div class="save-bar__actions">
            <el-button class="ghost-btn" @click="handleResetProfile">取消</el-button>
            <el-button type="primary" class="save-bar__submit" :loading="savingProfile"
              @click="handleSaveProfile">保存修改</el-button>
          </div>
        </footer>
      </aside>

      <!-- 右：求职意向 -->
      <section class="intent-pane">
        <header class="pane-head pane-head--row">
          <h1 class="pane-title">求职意向</h1>
          <span class="pane-note">用于职位推荐与匹配</span>
        </header>

        <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="intent-form">
          <div class="intent-grid">
            <el-form-item label="职位名称" prop="jobTitle">
              <el-input v-model="form.jobTitle" maxlength="64" placeholder="如：前端开发工程师" />
            </el-form-item>

            <el-form-item label="求职状态" prop="jobStatus">
              <el-select v-model="form.jobStatus" class="w-full" clearable placeholder="请选择求职状态">
                <el-option v-for="item in jobStatusOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>

            <el-form-item label="工作经验" prop="experience">
              <el-select v-model="form.experience" class="w-full" clearable placeholder="请选择工作经验">
                <el-option v-for="item in experiences" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>

            <el-form-item label="意向城市" prop="city">
              <el-select v-model="form.city" class="w-full" clearable filterable placeholder="请选择意向城市">
                <el-option v-for="item in cityOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>

            <el-form-item label="学历" prop="education">
              <el-select v-model="form.education" class="w-full" clearable placeholder="请选择学历">
                <el-option v-for="item in educationOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>

            <el-form-item prop="skills" class="intent-grid__skills">
              <template #label>
                <span class="field__label-row">
                  <span>技术栈</span>
                  <span class="field__hint">最多 8 个</span>
                </span>
              </template>
              <el-select v-model="form.skills" class="w-full skills-select" multiple filterable allow-create
                default-first-option :multiple-limit="SKILL_LIMIT" placeholder="请选择或输入技能">
                <el-option v-for="item in skillOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </div>

          <!-- 薪资情况：内部统一按「元/月」保存，展示时按月薪或年薪换算 -->
          <div class="salary">
            <div class="salary__head">
              <span class="field__label">薪资情况</span>
              <el-radio-group v-model="salaryUnit" size="small" class="salary__unit">
                <el-radio-button value="month">月薪</el-radio-button>
                <el-radio-button value="year">年薪</el-radio-button>
              </el-radio-group>
            </div>

            <div class="intent-grid">
              <el-form-item label="当前薪资（税前）">
                <div class="salary-field">
                  <el-input-number :model-value="currentSalaryDisplay" class="w-full" :min="0" :controls="false"
                    :step="1" :precision="0" placeholder="请填写当前薪资" @update:model-value="updateCurrentSalary" />
                  <span class="salary-field__unit">{{ salaryUnitLabel }}</span>
                </div>
              </el-form-item>

              <el-form-item label="意向薪资（税前）">
                <div class="salary-field">
                  <el-input-number :model-value="expectedSalaryDisplay" class="w-full" :min="0" :controls="false"
                    :step="1" :precision="0" placeholder="请填写意向薪资" @update:model-value="updateExpectedSalary" />
                  <span class="salary-field__unit">{{ salaryUnitLabel }}</span>
                </div>
              </el-form-item>
            </div>

            <p class="salary__hint">薪资信息仅用于匹配分析，不会向招聘方展示。</p>
          </div>
        </el-form>

        <footer class="save-bar">
          <span class="save-bar__hint">修改会同步至 AI 分析与职位推荐。</span>
          <div class="save-bar__actions">
            <el-button class="ghost-btn" @click="handleReset">取消</el-button>
            <el-button type="primary" class="save-bar__submit" :loading="savingIntent" @click="handleSubmit">保存修改</el-button>
          </div>
        </footer>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useRouter } from 'vue-router'

import { getCity, getKeywords, updateUserProfile, uploadAvatar } from '@/api/server'
import { usePersonalInfoStore } from '@/stores/personalInfo'
import { useUserStore } from '@/stores/user'
import { getToken } from '@/utils/token'

/** 技术栈最多可选数量 */
const SKILL_LIMIT = 8

const router = useRouter()
const personalInfoStore = usePersonalInfoStore()
const userStore = useUserStore()

/** 未登录时不请求接口，直接展示登录引导 */
const loggedIn = Boolean(getToken())

// ---------- 选项 ----------
const educationOptions = ['中专或以下', '大专', '本科', '硕士', '博士']
const jobStatusOptions = ['在职，考虑机会', '在职，暂不考虑', '离职，随时到岗', '应届毕业生']
const experiences = [
  { label: '应届', value: '应届' },
  { label: '1年以下', value: '0-1' },
  { label: '1-3年', value: '1-3' },
  { label: '3-5年', value: '3-5' },
  { label: '5年以上', value: '5-' },
]
const cityOptions = ref<string[]>([])
const skillOptions = ref<{ label: string, value: string }[]>([])

// ---------- 基本资料 ----------
const profileForm = reactive({
  nickname: '',
  avatar: '',
  currentJob: '',
  location: '',
})

const profileBackup = reactive({ ...profileForm })

const fileInput = ref<HTMLInputElement>()
const uploading = ref(false)
/** 左右两块各自独立保存：基本资料走账号资料接口，求职意向走求职意向接口 */
const savingProfile = ref(false)
const savingIntent = ref(false)

const initial = computed(() => profileForm.nickname.slice(0, 1) || '用')

/** 手机号脱敏：138 **** 6721 */
const maskedPhone = computed(() => {
  const phone = userStore.profile?.phone || ''
  return phone.replace(/^(\d{3})\d{4}(\d{4})$/, '$1 **** $2') || phone
})

// ---------- 求职意向 ----------
const form = reactive({
  jobTitle: '',
  jobStatus: '',
  education: '',
  experience: '',
  skills: [] as string[],
  city: '',
  currentSalary: undefined as number | undefined,
  expectedSalary: undefined as number | undefined,
})

const formBackup = reactive({
  jobTitle: '',
  jobStatus: '',
  education: '',
  experience: '',
  skills: [] as string[],
  city: '',
  currentSalary: undefined as number | undefined,
  expectedSalary: undefined as number | undefined,
})

const formRef = ref<FormInstance>()

const rules: FormRules = {
  experience: [{ required: true, message: '请选择工作经验', trigger: 'submit' }],
  skills: [{ required: true, type: 'array', message: '请至少选择一项技术', trigger: 'submit' }],
  city: [{ required: true, message: '请选择意向城市', trigger: 'submit' }],
}

// ---------- 薪资单位：内部始终存「元/月」，展示时按所选单位换算 ----------
const salaryUnit = ref<'month' | 'year'>('month')

const salaryUnitLabel = computed(() => (salaryUnit.value === 'month' ? 'K/月' : 'K/年'))

/** 元/月 → 展示值（千元） */
const toDisplay = (monthly?: number) => {
  if (monthly == null) return undefined
  const value = salaryUnit.value === 'month' ? monthly : monthly * 12
  return Math.round(value / 1000)
}

/** 展示值（千元）→ 元/月 */
const fromDisplay = (value?: number | null) => {
  if (value == null) return undefined
  return salaryUnit.value === 'month' ? value * 1000 : Math.round((value * 1000) / 12)
}

const currentSalaryDisplay = computed(() => toDisplay(form.currentSalary))
const expectedSalaryDisplay = computed(() => toDisplay(form.expectedSalary))
const updateCurrentSalary = (value?: number | null) => {
  form.currentSalary = fromDisplay(value)
}
const updateExpectedSalary = (value?: number | null) => {
  form.expectedSalary = fromDisplay(value)
}

// ---------- 初始化 ----------
onMounted(async () => {
  if (!loggedIn) return

  getCityOptions()
  getKeywordOptions()
  await Promise.all([getInfo(), getProfile()])
})

/** 回显求职意向 */
const getInfo = async () => {
  const res = await personalInfoStore.fetchPersonal().catch(() => null)
  if (!res) return

  Object.assign(form, {
    jobTitle: res.jobTitle ?? '',
    jobStatus: res.jobStatus ?? '',
    education: res.education ?? '',
    experience: res.experience ?? '',
    skills: res.skills ?? [],
    city: res.city ?? '',
    currentSalary: res.currentSalary,
    expectedSalary: res.expectedSalary,
  })
  Object.assign(formBackup, form)
}

/** 回显账号资料（昵称 / 头像 / 目前工作 / 所在地） */
const getProfile = async () => {
  const data = await userStore.fetchProfile().catch(() => null)
  if (!data) return

  Object.assign(profileForm, {
    nickname: data.nickname,
    avatar: data.avatar,
    currentJob: data.currentJob,
    location: data.location,
  })
  Object.assign(profileBackup, profileForm)
}

const getCityOptions = async () => {
  const res = await getCity().catch(() => [])
  cityOptions.value = res.map((item) => item.city)
}

const getKeywordOptions = async () => {
  const res = await getKeywords().catch(() => [])
  skillOptions.value = res.map((item) => ({ label: item.skill, value: item.skill }))
}

// ---------- 头像 ----------
const pickAvatar = () => fileInput.value?.click()

const handleAvatarChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  // 清空 value，保证重复选择同一张图也能触发 change
  input.value = ''
  if (!file) return

  if (file.size > 2 * 1024 * 1024) {
    ElMessage.error('图片不能超过 2MB')
    return
  }

  uploading.value = true
  try {
    const { url } = await uploadAvatar(file)
    profileForm.avatar = url
    ElMessage.success('头像已上传，保存后生效')
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '头像上传失败')
  } finally {
    uploading.value = false
  }
}

// ---------- 保存 / 取消 ----------
/** 保存基本资料：PUT /api/user/profile */
const handleSaveProfile = async () => {
  if (!profileForm.nickname.trim()) {
    ElMessage.warning('请填写姓名')
    return
  }

  savingProfile.value = true
  try {
    await updateUserProfile({
      nickname: profileForm.nickname.trim(),
      avatar: profileForm.avatar,
      currentJob: profileForm.currentJob.trim(),
      location: profileForm.location,
    })

    // 同步顶部导航的头像 / 昵称
    await userStore.fetchProfile().catch(() => null)

    Object.assign(profileBackup, profileForm)
    ElMessage.success('基本资料已保存')
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '保存失败，请稍后重试')
  } finally {
    savingProfile.value = false
  }
}

const handleResetProfile = () => {
  Object.assign(profileForm, profileBackup)
}

/** 保存求职意向：POST /api/setPersonalInfo */
const handleSubmit = async () => {
  if (!formRef.value) return

  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  savingIntent.value = true
  try {
    await personalInfoStore.submitPersonal({
      jobTitle: form.jobTitle.trim(),
      jobStatus: form.jobStatus,
      education: form.education,
      experience: form.experience,
      skills: form.skills,
      city: form.city,
      currentSalary: form.currentSalary,
      expectedSalary: form.expectedSalary,
    })

    Object.assign(formBackup, form)
    ElMessage.success('求职意向已保存')
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '保存失败，请稍后重试')
  } finally {
    savingIntent.value = false
  }
}

/** 取消求职意向的修改 */
const handleReset = () => {
  Object.assign(form, formBackup)
}

const goLogin = () => router.push('/login')
</script>

<style scoped lang="scss">
.personal-info {
  display: flex;
  flex-direction: column;
  // 整页固定为一屏高，内容超出时由左右两栏各自滚动
  height: 100%;
  min-height: 0;
  background: #ffffff;
}

/* ---------- 未登录 / 加载占位 ---------- */
.personal-info__state {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 0;
  padding: 40px 24px;
  text-align: center;
}

.personal-info__state-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.4px;
  color: #17252b;
}

.personal-info__state-desc {
  margin: 8px 0 0;
  font-size: 13.5px;
  line-height: 22px;
  color: #65747c;
}

.personal-info__state-btn {
  height: 42px;
  padding: 0 26px;
  margin-top: 22px;
  font-size: 13px;
  border-radius: 10px;

  --el-button-bg-color: #007c77;
  --el-button-border-color: #007c77;
  --el-button-hover-bg-color: #006b67;
  --el-button-hover-border-color: #006b67;
}

/* ---------- 两栏布局 ---------- */
.personal-info__layout {
  display: flex;
  flex: 1;
  align-items: stretch;
  min-height: 0;
}

.profile-pane {
  display: flex;
  flex-direction: column;
  flex: 0 0 380px;
  width: 380px;
  min-height: 0;
  padding: 32px;
  overflow-y: auto;
  // 隐藏滚动条，仍可滚动
  scrollbar-width: none;
  background: #f7fbfa;
  border-right: 1px solid #e1ebe8;

  &::-webkit-scrollbar {
    display: none;
  }
}

.intent-pane {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  padding: 24px 40px 0;
}

.pane-head {
  margin-bottom: 18px;
}

.pane-head--row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
}

.pane-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  line-height: 28px;
  letter-spacing: -0.4px;
  color: #17252b;
}

.pane-desc {
  margin: 4px 0 0;
  font-size: 11.5px;
  line-height: 18px;
  color: #8a979e;
}

.pane-note {
  font-size: 10.5px;
  color: #8a979e;
}

/* 左栏较窄：提示文字在上，按钮靠右换行 */
.save-bar--profile {
  flex-direction: column;
  gap: 12px;
  align-items: stretch;
  margin-top: auto;

  .save-bar__actions {
    justify-content: flex-end;
  }
}

/* ---------- 字段 ---------- */
.field {
  margin-bottom: 20px;

  &:last-of-type {
    margin-bottom: 0;
  }
}

.field__label {
  display: block;
  margin-bottom: 8px;
  font-size: 11.5px;
  font-weight: 600;
  line-height: 18px;
  color: #3d4b54;
}

.field__label--row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 11.5px;
  font-weight: 600;
  line-height: 18px;
  color: #3d4b54;
}

.field__hint {
  font-size: 10.5px;
  font-weight: 400;
  color: #8a979e;
}

.intent-grid__skills :deep(.el-form-item__label) {
  display: flex;
  align-items: center;
  width: 100%;
}

.field__label-row {
  display: flex;
  flex: 1;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  font-size: 11.5px;
  font-weight: 600;
  line-height: 18px;
  color: #3d4b54;
}

.w-full {
  width: 100%;
}

/* ---------- 头像 ---------- */
.avatar-row {
  display: flex;
  gap: 20px;
  align-items: center;
}

.avatar-row__avatar {
  flex-shrink: 0;
  font-size: 30px;
  font-weight: 600;

  --el-avatar-bg-color: #e8f7f4;
  --el-avatar-text-color: #007c77;

  border: 1px solid #d3eae6;
}

.avatar-row__side {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
}

.ghost-btn {
  height: 36px;
  padding: 0 16px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 9px;

  --el-button-text-color: #3d4b54;
  --el-button-bg-color: #ffffff;
  --el-button-border-color: #d8e2e3;
  --el-button-hover-text-color: #007c77;
  --el-button-hover-bg-color: #f3faf8;
  --el-button-hover-border-color: #bfe3dd;
}

/* ---------- 求职意向表单 ---------- */
.intent-form {
  flex: 1;
  min-height: 0;
  // 内容需要在可视区域内完整放下，不产生上下滚动
  overflow: hidden;
}

.intent-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 40px;
}

/* 表单控件对齐设计稿：56 高、10 圆角、浅描边 */
.intent-form :deep(.el-form-item) {
  margin-bottom: 0;
}

.intent-form :deep(.el-form-item__label) {
  padding: 0 0 8px;
  font-size: 11.5px;
  font-weight: 600;
  line-height: 18px;
  color: #3d4b54;
}

.intent-form :deep(.el-input__wrapper),
.intent-form :deep(.el-select__wrapper) {
  min-height: 56px;
  padding: 0 16px;
  font-size: 14px;
  border-radius: 10px;
  box-shadow: 0 0 0 1px #d8e2e3 inset;
}

.intent-form :deep(.el-select__wrapper.is-focused) {
  box-shadow: 0 0 0 1px #007c77 inset;
}

.intent-form :deep(.el-input__inner) {
  font-size: 14px;
}

/* 技术栈：标签可能换行，固定最小高度 */
.skills-select :deep(.el-select__wrapper) {
  align-items: flex-start;
  min-height: 110px;
  padding: 14px 16px;
}

/* 已禁用（手机号）使用灰底 */
.profile-pane :deep(.el-input.is-disabled .el-input__wrapper) {
  min-height: 56px;
  padding: 0 16px;
  font-size: 14px;
  background: #f4f8f8;
  border-radius: 10px;
  box-shadow: 0 0 0 1px #e2eaea inset;
}

.profile-pane :deep(.el-select__wrapper) {
  min-height: 56px;
  padding: 0 16px;
  font-size: 14px;
  border-radius: 10px;
  box-shadow: 0 0 0 1px #d8e2e3 inset;
}

.profile-pane :deep(.el-input__wrapper) {
  min-height: 56px;
  padding: 0 16px;
  font-size: 14px;
  border-radius: 10px;
  box-shadow: 0 0 0 1px #d8e2e3 inset;
}

/* ---------- 薪资 ---------- */
.salary {
  padding-top: 16px;
  margin-top: 18px;
  border-top: 1px solid #edf2f2;
}

.salary__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;

  .field__label {
    margin-bottom: 0;
  }
}

.salary__unit {
  --el-radio-button-checked-bg-color: #007c77;
  --el-radio-button-checked-border-color: #007c77;
}

.salary-field {
  display: flex;
  gap: 10px;
  align-items: center;
  width: 100%;
}

.salary-field__unit {
  flex-shrink: 0;
  font-size: 11.5px;
  color: #78868f;
}

.salary__hint {
  margin: 12px 0 0;
  font-size: 10.5px;
  line-height: 16px;
  color: #8a979e;
}

/* ---------- 保存栏 ---------- */
.save-bar {
  display: flex;
  flex-shrink: 0;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
  border-top: 1px solid #e1ebe9;
}

.save-bar__hint {
  font-size: 10.5px;
  color: #8a979e;
}

.save-bar__actions {
  display: flex;
  gap: 12px;
}

.save-bar__submit {
  height: 40px;
  padding: 0 22px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 9px;

  --el-button-bg-color: #007c77;
  --el-button-border-color: #007c77;
  --el-button-hover-bg-color: #006b67;
  --el-button-hover-border-color: #006b67;
  --el-button-active-bg-color: #00615e;
  --el-button-active-border-color: #00615e;
}

/* ---------- 响应式 ---------- */
@media (max-width: 1023.98px) {
  /* 窄屏两栏上下堆叠，整页一起滚动 */
  .personal-info__layout {
    flex-direction: column;
    overflow-y: auto;
    scrollbar-width: none;
  }

  .personal-info__layout::-webkit-scrollbar {
    display: none;
  }

  .profile-pane {
    flex: none;
    width: 100%;
    padding: 24px;
    overflow: visible;
    border-right: 0;
    border-bottom: 1px solid #e1ebe8;
  }

  .intent-pane {
    min-height: auto;
    padding: 24px 24px 0;
  }

  .intent-form {
    flex: none;
    overflow: visible;
  }

  .intent-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 22px;
  }
}
</style>
