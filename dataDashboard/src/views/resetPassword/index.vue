<!--
  重置密码页：分两步完成
  1. 输入手机号，点击「下一步」（进入下一步时自动发送验证码）
  2. 手机号锁定展示，填写验证码与新密码后提交
  接口：POST /auth/reset-password（发送验证码走 /sms-code）
-->
<template>
  <div class="reset">
    <router-link to="/login" class="reset__back">
      <svg width="18" height="18" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <path d="M31 36L19 24L31 12" stroke="currentColor" stroke-width="4" stroke-linecap="round"
          stroke-linejoin="round" />
      </svg>
      返回登录
    </router-link>

    <section class="reset__panel">
      <header class="reset__head">
        <h1 class="reset__title">重置密码</h1>
      </header>

      <div class="reset__form">
        <!-- 两步之间滑动 + 淡入淡出切换，方向跟随前进 / 返回 -->
        <Transition :name="slideName" mode="out-in">
          <!-- 第一步：手机号 -->
          <div v-if="step === 1" key="phone" class="reset__step">
            <div class="reset__field">
              <label class="reset__label">手机号</label>
              <el-input v-model="phone" class="reset__input" maxlength="11" placeholder="请输入注册手机号" autocomplete="off"
                name="reset-phone" @keyup.enter="handleNext">
                <template #prefix>
                  <span class="reset__area">+86</span>
                  <span class="reset__sep"></span>
                </template>
              </el-input>
            </div>

            <el-button type="primary" class="reset__submit" @click="handleNext">
              下一步
            </el-button>
          </div>

          <!-- 第二步：验证码 + 新密码 -->
          <div v-else key="password" class="reset__step">
            <div class="reset__field">
              <label class="reset__label">手机号</label>
              <el-input :model-value="phone" class="reset__input" disabled autocomplete="off" name="reset-phone-locked">
                <template #prefix>
                  <span class="reset__area">+86</span>
                  <span class="reset__sep"></span>
                </template>
              </el-input>
            </div>

            <div class="reset__field">
              <label class="reset__label">短信验证码</label>
              <el-input v-model="code" class="reset__input" maxlength="6" placeholder="请输入验证码" autocomplete="off"
                name="reset-code">
                <template #suffix>
                  <span class="reset__sep reset__sep--suffix"></span>
                  <el-button link class="reset__code-btn" :disabled="countdown > 0 || sendingCode"
                    @click="handleSendCode">
                    {{ countdown > 0 ? `${countdown}s 后重新获取` : '获取验证码' }}
                  </el-button>
                </template>
              </el-input>
            </div>

            <div class="reset__field">
              <label class="reset__label">新密码</label>
              <el-input v-model="password" class="reset__input" type="password" show-password maxlength="20"
                placeholder="8–20 位，含字母和数字" autocomplete="new-password" name="reset-new-password" />
            </div>

            <div class="reset__field">
              <label class="reset__label">确认新密码</label>
              <el-input v-model="confirm" class="reset__input" type="password" show-password maxlength="20"
                placeholder="请再次输入新密码" autocomplete="new-password" name="reset-confirm-password"
                @keyup.enter="handleSubmit" />
            </div>

            <div class="reset__actions">
              <el-button class="reset__back-btn" @click="backToPhone">上一步</el-button>
              <el-button type="primary" class="reset__submit reset__submit--inline" :loading="submitting"
                @click="handleSubmit">
                重置密码
              </el-button>
            </div>
          </div>
        </Transition>

        <p class="reset__switch">
          想起密码了？
          <router-link to="/login" class="reset__switch-link">去登录</router-link>
        </p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'

import { ElMessage } from 'element-plus'

import { resetPassword, sendSmsCode } from '@/api/server'

const router = useRouter()

/** 当前步骤：1 = 填写手机号，2 = 验证并设置新密码 */
const step = ref<1 | 2>(1)
/** 切换方向，决定步骤内容的滑动方向 */
const direction = ref<'forward' | 'back'>('forward')
const slideName = computed(() => (direction.value === 'forward' ? 'step-forward' : 'step-back'))

const phone = ref('')
const code = ref('')
const password = ref('')
const confirm = ref('')
const submitting = ref(false)
/** 请求发送验证码中，防止重复点击 */
const sendingCode = ref(false)
/** 验证码倒计时（秒），大于 0 时按钮不可点 */
const countdown = ref(0)
let countdownTimer: number | undefined

/** 清理倒计时计时器 */
const stopCountdown = () => {
  if (countdownTimer !== undefined) {
    window.clearInterval(countdownTimer)
    countdownTimer = undefined
  }
}

/** 启动倒计时 */
const startCountdown = (seconds = 60) => {
  stopCountdown()
  countdown.value = seconds
  countdownTimer = window.setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) {
      countdown.value = 0
      stopCountdown()
    }
  }, 1000)
}

/** 发送验证码：调 /api/sms-code，成功后开始倒计时 */
const handleSendCode = async () => {
  if (countdown.value > 0 || sendingCode.value) return

  const phoneText = phone.value.trim()
  if (!/^1[3-9]\d{9}$/.test(phoneText)) {
    ElMessage.warning('请输入正确的手机号')
    return
  }

  sendingCode.value = true
  try {
    await sendSmsCode(phoneText)
    startCountdown()
    ElMessage.success('验证码已发送')
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '验证码发送失败，请稍后重试')
  } finally {
    sendingCode.value = false
  }
}

/** 第一步 → 第二步：校验手机号后进入下一步（验证码由用户手动获取） */
const handleNext = () => {
  if (step.value !== 1) return

  const phoneText = phone.value.trim()
  if (!/^1[3-9]\d{9}$/.test(phoneText)) {
    ElMessage.warning('请输入正确的手机号')
    return
  }

  phone.value = phoneText
  direction.value = 'forward'
  step.value = 2
}

/** 回到第一步，重置验证码相关状态 */
const backToPhone = () => {
  direction.value = 'back'
  step.value = 1
  code.value = ''
  stopCountdown()
  countdown.value = 0
}

/** 提交重置：校验 → 调 /api/auth/reset-password → 回登录页 */
const handleSubmit = async () => {
  if (submitting.value) return

  const phoneText = phone.value.trim()
  const codeText = code.value.trim()

  if (!/^\d{4,6}$/.test(codeText)) {
    ElMessage.warning('请输入正确的短信验证码')
    return
  }
  if (!/^(?=.*[A-Za-z])(?=.*\d).{8,20}$/.test(password.value)) {
    ElMessage.warning('新密码需 8–20 位，且同时包含字母和数字')
    return
  }
  if (!confirm.value) {
    ElMessage.warning('请再次输入新密码')
    return
  }
  if (password.value !== confirm.value) {
    ElMessage.warning('两次输入的新密码不一致')
    return
  }

  submitting.value = true
  try {
    await resetPassword({
      phone: phoneText,
      code: codeText,
      newPassword: password.value,
      confirmPassword: confirm.value,
    })
    ElMessage.success('密码已重置，请使用新密码登录')
    router.push('/login')
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '重置失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

onBeforeUnmount(stopCountdown)
</script>

<style scoped lang="scss">
.reset {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 40px 32px;
  font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background: #f4f8f7;
}

.reset__back {
  position: absolute;
  top: 32px;
  left: 40px;
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 13px;
  color: #65747c;
  text-decoration: none;
  transition: color 0.2s ease;

  &:hover {
    color: #007c77;
  }
}

/* 内容直接铺在页面背景上，整体水平垂直居中 */
.reset__panel {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 32px;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 1000px;
  min-height: calc(100vh - 80px);
  padding: 40px 0;
}

.reset__title {
  margin: 0;
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -1px;
  color: #17252b;
}

/* ---------- 表单 ---------- */
.reset__form {
  width: 100%;
  max-width: 520px;
}

/* ---------- 步骤切换动画：横向滑动 + 淡入淡出 ---------- */
.reset__step {
  width: 100%;
}

.step-forward-enter-active,
.step-forward-leave-active,
.step-back-enter-active,
.step-back-leave-active {
  transition: opacity 0.24s ease, transform 0.24s ease;
}

.step-forward-enter-from {
  opacity: 0;
  transform: translateX(32px);
}

.step-forward-leave-to {
  opacity: 0;
  transform: translateX(-32px);
}

.step-back-enter-from {
  opacity: 0;
  transform: translateX(-32px);
}

.step-back-leave-to {
  opacity: 0;
  transform: translateX(32px);
}

.reset__field {
  margin-top: 20px;
}

.reset__label {
  display: block;
  margin-bottom: 6px;
  font-size: 11.5px;
  color: #3d4b54;
}

.reset__input {
  width: 100%;

  :deep(.el-input__wrapper) {
    min-height: 50px;
    padding: 0 14px;
    background: #ffffff;
    border-radius: 10px;
    box-shadow: 0 0 0 1px #d8e2e3 inset;
  }

  :deep(.el-input__wrapper.is-focus) {
    box-shadow: 0 0 0 1px #007c77 inset;
  }

  // 锁定态：底色变浅，提示不可编辑
  :deep(.el-input.is-disabled .el-input__wrapper) {
    background: #f4f8f7;
    box-shadow: 0 0 0 1px #e1ebe8 inset;
  }
}

.reset__area {
  flex-shrink: 0;
  font-size: 13.5px;
  font-weight: 500;
  color: #3d4b54;
}

.reset__sep {
  flex-shrink: 0;
  width: 1px;
  height: 24px;
  margin: 0 14px;
  background: #e3ebec;

  &--suffix {
    margin: 0 12px;
  }
}

.reset__code-btn {
  height: auto;
  padding: 0;
  font-size: 12px;
  font-weight: 600;

  --el-button-text-color: #007c77;
  --el-button-hover-link-text-color: #006b66;
  --el-button-active-color: #006b66;
}

.reset__actions {
  display: flex;
  gap: 12px;
  margin-top: 30px;
}

.reset__submit {
  width: 100%;
  height: 50px;
  margin-top: 30px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 10px;

  --el-button-bg-color: #007c77;
  --el-button-border-color: #007c77;
  --el-button-hover-bg-color: #006b66;
  --el-button-hover-border-color: #006b66;
  --el-button-active-bg-color: #00605c;
  --el-button-active-border-color: #00605c;

  &--inline {
    flex: 1;
    margin-top: 0;
  }
}

.reset__back-btn {
  height: 50px;
  padding: 0 22px;
  font-size: 13px;
  border-radius: 10px;

  --el-button-text-color: #3d4b54;
  --el-button-bg-color: #ffffff;
  --el-button-border-color: #d8e2e3;
  --el-button-hover-text-color: #007c77;
  --el-button-hover-bg-color: #f7fbfa;
  --el-button-hover-border-color: #bfdcd7;
}

.reset__switch {
  margin: 22px 0 0;
  font-size: 12px;
  color: #65747c;
  text-align: center;
}

.reset__switch-link {
  font-weight: 600;
  color: #007c77;
  text-decoration: none;

  &:hover {
    color: #006b66;
  }
}

@media (max-width: 1023.98px) {
  .reset__panel {
    min-height: auto;
    padding: 40px 0;
  }
}

@media (max-width: 640px) {
  .reset {
    padding: 20px 12px;
  }

  .reset__back {
    top: 18px;
    left: 16px;
  }

  .reset__panel {
    padding: 28px 0 24px;
  }

  .reset__title {
    font-size: 24px;
  }

  .reset__actions {
    flex-direction: column-reverse;
  }

  .reset__back-btn {
    width: 100%;
  }
}
</style>
