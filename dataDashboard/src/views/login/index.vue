<template>
  <div class="login">
    <!-- 背景城市线稿 -->
    <svg class="login__city" viewBox="0 0 1440 1024" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <g stroke="#006E69" stroke-opacity="0.3" stroke-width="1.1" fill="none">
        <path d="M0 1008h1440" />
        <path d="M24 1008V832h82v176" />
        <path d="M48 832v-14h34v14M65 818v-38" />
        <path d="M38 862h54M38 892h54M38 922h54M38 952h54M38 982h54" />
        <path d="M57 848v150M77 848v150" />

        <path d="M126 1008V752h104v256" />
        <path d="M150 752v-22h56v22M178 730v-36" />
        <path d="M144 782h68M144 814h68M144 846h68M144 878h68M144 910h68M144 942h68M144 974h68" />
        <path d="M162 768v232M194 768v232" />

        <path d="M1204 1008V828h70v180" />
        <path d="M1218 828v-14h42v14M1239 814v-30" />
        <path d="M1214 858h50M1214 892h50M1214 926h50M1214 960h50M1214 994h50" />

        <path d="M1290 1008V744h86v264" />
        <path d="M1312 744v-20h42v20M1333 724v-38" />
        <path d="M1302 776h62M1302 810h62M1302 844h62M1302 878h62M1302 912h62M1302 946h62M1302 980h62" />
        <path d="M1322 762v238M1344 762v238" />

        <path d="M1394 1008V862h34v146" />
        <path d="M1406 892h12M1406 924h12M1406 956h12M1406 988h12" />

        <path d="M360 1008V942h82v66" />
        <path d="M374 964h54M374 986h54" />
        <path d="M456 1008V918h60v90" />
        <path d="M470 940h32M470 966h32M470 992h32" />
        <path d="M700 1008V954h80v54" />
        <path d="M714 976h52M714 996h52" />
        <path d="M800 1008V926h64v82" />
        <path d="M814 948h36M814 972h36M814 996h36" />
        <path d="M1016 1008V960h76v48" />
        <path d="M1030 982h48" />
      </g>

      <g stroke="#006E69" stroke-opacity="0.2" stroke-width="1.1" fill="none">
        <path transform="translate(104 598)"
          d="M0 32h60c8 0 14-6 14-14S68 4 60 4h-3C54-8 43-16 30-16 18-16 7-8 4 4H0C-8 4-14 10-14 18s6 14 14 14Z" />
        <path transform="translate(1218 472) scale(.78)"
          d="M0 32h60c8 0 14-6 14-14S68 4 60 4h-3C54-8 43-16 30-16 18-16 7-8 4 4H0C-8 4-14 10-14 18s6 14 14 14Z" />
      </g>
    </svg>

    <!-- 返回首页 -->
    <router-link to="/" class="login__back">
      <svg width="22" height="22" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M31 36L19 24L31 12" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      返回首页
    </router-link>

    <!-- 登录卡片 -->
    <section class="login__card">
      <!-- 左侧品牌栏 -->
      <aside class="login__rail">
        <div class="login__rail-brand">
          <span class="login__rail-logo">
            <svg width="24" height="24" viewBox="0 0 40 40" fill="none" aria-hidden="true">
              <path d="M11.6 27.3v-4.9M17.5 27.3v-9.4M23.4 27.3V12.1" stroke="#DFF7F4" stroke-width="3"
                stroke-linecap="round" />
              <circle cx="31.4" cy="10.2" r="3.6" fill="#00BEBD" stroke="#E7F7F5" stroke-width="1.3" />
            </svg>
          </span>
          <span class="login__rail-name">JobVision</span>
        </div>
        <p class="login__rail-tagline">AI 求职分析</p>

        <div class="login__rail-divider"></div>

        <ul class="login__features">
          <li class="login__feature">
            <svg class="login__feature-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" stroke-width="1.5" />
              <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
            <div>
              <p class="login__feature-title">岗位分析</p>
              <p class="login__feature-desc">把岗位要求拆开看</p>
            </div>
          </li>

          <li class="login__feature">
            <svg class="login__feature-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4.5 8a7.5 7.5 0 1 1-.1 6.7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              <path d="M4.5 3.5V8H9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
                stroke-linejoin="round" />
              <path d="M12 8.5V13l3 1.8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
            <div>
              <p class="login__feature-title">匹配记录</p>
              <p class="login__feature-desc">保存每一次判断</p>
            </div>
          </li>

          <li class="login__feature">
            <svg class="login__feature-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6.5 3.5h11v17L12 16.4 6.5 20.5v-17Z" stroke="currentColor" stroke-width="1.5"
                stroke-linejoin="round" />
            </svg>
            <div>
              <p class="login__feature-title">收藏职位</p>
              <p class="login__feature-desc">想聊的机会收在一起</p>
            </div>
          </li>
        </ul>

        <div class="login__rail-foot">
          <div class="login__rail-note">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 3.2 19 6v5.1c0 4.2-2.8 7.7-7 9.7-4.2-2-7-5.5-7-9.7V6l7-2.8Z" stroke="currentColor"
                stroke-width="1.8" />
              <path d="m8.8 12 2.1 2.1 4.4-4.4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
            <span>账号信息仅用于登录与求职分析</span>
          </div>
          <p class="login__copyright">© 2026 JobVision</p>
        </div>
      </aside>

      <!-- 右侧登录表单（静态展示，暂不接入功能） -->
      <div class="login__form">
        <div class="login__title-row">
          <h1 class="login__title">登录</h1>
          <button type="button" class="login__qr">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="0.6" y="0.6" width="5.2" height="5.2" rx=".6" stroke="currentColor" stroke-width="1.3" />
              <rect x="10.2" y="0.6" width="5.2" height="5.2" rx=".6" stroke="currentColor" stroke-width="1.3" />
              <rect x="0.6" y="10.2" width="5.2" height="5.2" rx=".6" stroke="currentColor" stroke-width="1.3" />
              <path d="M10.2 10.2h2.2v2.2h-2.2zM13.8 13.8h2.2v2.2h-2.2zM10.2 13.8h1.2M15 10.2h1" stroke="currentColor"
                stroke-width="1.3" />
            </svg>
            扫码登录
          </button>
        </div>
        <p class="login__subtitle">用手机号继续，查看你的求职分析。</p>

        <div class="login__field">
          <div class="login__field-head">
            <label class="login__field-label">手机号</label>
            <span class="login__field-hint">中国大陆</span>
          </div>
          <el-input v-model="phone" class="login__input" placeholder="请输入手机号">
            <template #prefix>
              <span class="login__area">+86</span>
              <span class="login__sep"></span>
            </template>
          </el-input>
        </div>

        <div class="login__field">
          <div class="login__field-head">
            <label class="login__field-label">密码</label>
            <span class="login__field-hint">忘记密码？</span>
          </div>
          <el-input v-model="password" class="login__input" type="password" show-password maxlength="32"
            placeholder="请输入登录密码" />
        </div>

        <el-checkbox v-model="agreed" class="login__agree">
          我已阅读并同意
          <span class="login__agree-link">《用户协议》</span>
          和
          <span class="login__agree-link">《隐私政策》</span>
        </el-checkbox>

        <el-button type="primary" class="login__submit" :loading="submitting" @click="handleLogin">
          登录
        </el-button>

        <p class="login__switch">
          还没有账号？
          <router-link to="/register" class="login__switch-link">注册账号</router-link>
        </p>

        <div class="login__foot">
          <span class="login__foot-note">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <rect x="1" y="5" width="10" height="8" rx="2" stroke="currentColor" stroke-width="1.2" />
              <path d="M3.2 5V3.7a2.8 2.8 0 0 1 5.6 0V5" stroke="currentColor" stroke-width="1.2" />
            </svg>
            账号信息仅用于登录，分析记录仅自己可见
          </span>
          <span class="login__foot-help">登录帮助</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { ElMessage } from 'element-plus'

import { login } from '@/api/server'
import { usePersonalInfoStore } from '@/stores/personalInfo'
import { useUserStore } from '@/stores/user'
import { setToken } from '@/utils/token'

const router = useRouter()
const userStore = useUserStore()
const personalInfoStore = usePersonalInfoStore()

const phone = ref('')
const password = ref('')
const agreed = ref(false)
const submitting = ref(false)

/** 点击登录：校验 → 调 /api/auth/login → 存 token → 回首页 */
const handleLogin = async () => {
  if (submitting.value) return

  const phoneText = phone.value.trim()
  const passwordText = password.value

  if (!/^1[3-9]\d{9}$/.test(phoneText)) {
    ElMessage.warning('请输入正确的手机号')
    return
  }
  if (!passwordText) {
    ElMessage.warning('请输入登录密码')
    return
  }
  if (!agreed.value) {
    ElMessage.warning('请先阅读并同意《用户协议》和《隐私政策》')
    return
  }

  submitting.value = true
  try {
    const { token } = await login({ phone: phoneText, password: passwordText })
    // token 存本地，之后所有请求由拦截器自动带 Authorization
    setToken(token)

    // 换了账号：清掉上一个账号的求职意向缓存，再按当前用户重新拉取
    personalInfoStore.reset()

    // 登录成功后拉取用户信息，失败不影响登录
    try {
      await userStore.fetchProfile()
    } catch (error) {
      console.log('获取用户信息失败：', error)
    }

    ElMessage.success('登录成功')
    router.push('/')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '登录失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped lang="scss">
.login {
  position: relative;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  min-height: 100vh;
  padding: 28px 40px;
  overflow-x: hidden;
  font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background: #00b4ae;

  &__city {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  // 返回首页
  &__back {
    position: absolute;
    top: 42px;
    right: 48px;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 104px;
    height: 36px;
    font-size: 12.5px;
    font-weight: 500;
    color: #007c77;
    text-decoration: none;
    background: rgb(255 255 255 / 96%);
    border-radius: 10px;
    transition: background 0.2s ease;

    &:hover {
      background: #ffffff;
    }

    // 返回箭头相对文字略微下移，视觉更居中
    svg {
      transform: translateY(2px);
    }
  }

  // 卡片：左品牌栏 + 右表单
  &__card {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: 280px minmax(0, 1fr);
    width: 100%;
    max-width: 820px;
    min-height: 610px;
    margin: auto;
    overflow: hidden;
    background: #ffffff;
    border: 1px solid #dfeae7;
    border-radius: 24px;
    box-shadow: 0 20px 26px rgb(0 90 86 / 18%);
  }

  // ---------- 左侧品牌栏 ----------
  &__rail {
    display: flex;
    flex-direction: column;
    padding: 40px 32px 32px;
    background: #f1f8f6;
    border-right: 1px solid #e2ece9;
  }

  &__rail-brand {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  &__rail-logo {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: #007c77;
    border-radius: 11px;
  }

  &__rail-name {
    font-size: 19px;
    font-weight: 700;
    letter-spacing: -0.75px;
    color: #17252b;
  }

  &__rail-tagline {
    margin: 6px 0 0;
    font-size: 11.5px;
    letter-spacing: 0.2px;
    color: #65747c;
  }

  &__rail-divider {
    height: 1px;
    margin: 20px 0 24px;
    background: #ddeae6;
  }

  &__features {
    display: flex;
    flex-direction: column;
    gap: 22px;
    padding: 0;
    margin: 0;
    list-style: none;
  }

  &__feature {
    display: grid;
    grid-template-columns: 24px minmax(0, 1fr);
    gap: 16px;
    align-items: start;
  }

  &__feature-icon {
    margin-top: 2px;
    color: #6d8b86;
  }

  &__feature-title {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: #17252b;
  }

  &__feature-desc {
    margin: 4px 0 0;
    font-size: 11.5px;
    color: #65747c;
  }

  &__rail-foot {
    padding-top: 16px;
    margin-top: auto;
    border-top: 1px solid #dfebe8;
  }

  &__rail-note {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 10.5px;
    color: #7b898f;

    svg {
      flex-shrink: 0;
      color: #6d918a;
    }
  }

  &__copyright {
    margin: 16px 0 0;
    font-size: 9.5px;
    color: #8a979e;
  }

  // ---------- 右侧表单 ----------
  &__form {
    padding: 44px 64px 36px;

    --el-color-primary: #007c77;
  }

  &__title-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
  }

  &__title {
    margin: 0;
    font-size: 30px;
    font-weight: 700;
    letter-spacing: -1px;
    color: #17252b;
  }

  &__qr {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: 6px;
    padding: 4px 0;
    margin-top: 4px;
    font-family: inherit;
    font-size: 11.5px;
    color: #65747c;
    cursor: pointer;
    background: none;
    border: none;
  }

  &__subtitle {
    margin: 8px 0 0;
    font-size: 13px;
    color: #65747c;
  }

  &__field {
    margin-top: 22px;

    &:first-of-type {
      margin-top: 28px;
    }
  }

  &__field-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
  }

  &__field-label {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.15px;
    color: #3d4b54;
  }

  &__field-hint {
    font-size: 10.5px;
    color: #78868f;
  }

  &__input {
    width: 100%;

    :deep(.el-input__wrapper) {
      min-height: 48px;
      padding: 0 14px;
      background: #ffffff;
      border-radius: 10px;
      box-shadow: 0 0 0 1px #d8e2e3 inset;
    }

    :deep(.el-input__wrapper.is-focus) {
      box-shadow: 0 0 0 1px #007c77 inset;
    }

    :deep(.el-input__inner) {
      font-size: 14px;
      color: #3d4b54;
    }

    :deep(.el-input__inner::placeholder) {
      color: #a1acb3;
    }

    :deep(.el-input__prefix),
    :deep(.el-input__suffix) {
      display: flex;
      align-items: center;
    }

    :deep(.el-input__suffix) {
      margin-left: 6px;
    }
  }

  &__area {
    flex-shrink: 0;
    font-size: 13.5px;
    font-weight: 500;
    color: #3d4b54;
  }

  &__sep {
    flex-shrink: 0;
    width: 1px;
    height: 24px;
    margin: 0 14px;
    background: #e3ebec;
  }

  &__agree {
    height: auto;
    margin-top: 22px;
    font-size: 11.5px;

    --el-checkbox-checked-bg-color: #007c77;
    --el-checkbox-checked-input-border-color: #007c77;
    --el-checkbox-text-color: #65747c;

    :deep(.el-checkbox__inner) {
      width: 18px;
      height: 18px;
      border-color: #c7d3d5;
      border-radius: 5px;
    }

    :deep(.el-checkbox__label) {
      padding-left: 10px;
      font-size: 11.5px;
      color: #65747c;
    }
  }

  &__agree-link {
    color: #3d4b54;
    cursor: pointer;
    border-bottom: 1px solid #cbd5d6;
  }

  &__submit {
    width: 100%;
    height: 48px;
    margin-top: 20px;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0.3px;
    border-radius: 10px;

    --el-button-bg-color: #007c77;
    --el-button-border-color: #007c77;
    --el-button-text-color: #ffffff;
    --el-button-hover-bg-color: #006b66;
    --el-button-hover-border-color: #006b66;
    --el-button-hover-text-color: #ffffff;
    --el-button-active-bg-color: #00605c;
    --el-button-active-border-color: #00605c;
  }

  &__switch {
    margin: 24px 0 0;
    font-size: 12.5px;
    color: #65747c;
  }

  &__switch-link {
    margin-left: 6px;
    font-size: 12.5px;
    font-weight: 600;
    color: #007c77;
    text-decoration: none;
    cursor: pointer;
  }

  // 其他登录方式分割线
  &__divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 22px;
  }

  &__divider-line {
    flex: 1;
    height: 1px;
    background: #dfe7e8;
  }

  &__divider-text {
    flex-shrink: 0;
    font-size: 10.5px;
    color: #78868f;
  }

  &__wechat {
    width: 100%;
    height: 48px;
    margin-top: 16px;
    font-size: 12.5px;
    font-weight: 500;
    border-radius: 10px;

    --el-button-bg-color: #ffffff;
    --el-button-border-color: #d8e2e3;
    --el-button-text-color: #3d4b54;
    --el-button-hover-bg-color: #f7fbfa;
    --el-button-hover-border-color: #cfe0dc;
    --el-button-hover-text-color: #3d4b54;
    --el-button-active-bg-color: #f1f8f6;
    --el-button-active-border-color: #cfe0dc;
  }

  &__wechat-icon {
    flex-shrink: 0;
    margin-right: 8px;
  }

  &__foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-top: 32px;
    font-size: 10.5px;
    color: #8a979e;
  }

  &__foot-note {
    display: flex;
    align-items: center;
    gap: 6px;

    svg {
      flex-shrink: 0;
      color: #9aa6ac;
    }
  }

  &__foot-help {
    flex-shrink: 0;
    font-weight: 500;
    color: #007c77;
    cursor: pointer;
  }

  // ---------- 响应式 ----------
  @media (max-width: 1023.98px) {
    padding: 72px 24px 24px;

    &__back {
      top: 18px;
      right: 20px;
    }

    &__card {
      grid-template-columns: minmax(0, 1fr);
      min-height: 0;
    }

    &__rail {
      display: none;
    }

    &__form {
      padding: 32px 28px;
    }

    &__title {
      font-size: 26px;
    }
  }

  @media (max-width: 640px) {
    padding: 64px 16px 16px;

    &__card {
      border-radius: 16px;
    }

    &__form {
      padding: 32px 20px;
    }

    &__field {
      margin-top: 24px;
    }

    &__title-row {
      align-items: center;
    }

    &__foot {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }
  }
}
</style>
