<template>
  <div class="login-guide">
    <span class="login-guide__mark">
      <el-icon :size="20">
        <Lock />
      </el-icon>
    </span>
    <h2 class="login-guide__title">登录后继续 AI 分析</h2>
    <p class="login-guide__desc">保存对话与历史记录，并让分析结合你的求职意向。</p>

    <el-button type="primary" class="login-guide__login" @click="goLogin">登录 / 注册</el-button>

    <p class="login-guide__agree">
      登录即表示同意
      <span>《用户协议》</span>
      和
      <span>《隐私政策》</span>
    </p>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Lock } from '@element-plus/icons-vue'

/** 未登录时覆盖在内容区下半页的登录引导 */
const router = useRouter()
const goLogin = () => router.push('/login')
</script>

<style scoped lang="scss">
.login-guide {
  position: absolute;
  top: 16%;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 24px 40px;
  text-align: center;
  // 下半页渐隐到纯白，盖住后面的输入区
  background: linear-gradient(180deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.55) 16%,
      rgba(255, 255, 255, 0.96) 30%,
      #ffffff 40%);
}

.login-guide__mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  color: #007c77;
  background: #e8f7f4;
  border: 1px solid #d3eae6;
  border-radius: 50%;
}

.login-guide__title {
  margin: 20px 0 0;
  font-size: 28px;
  font-weight: 700;
  line-height: 38px;
  letter-spacing: -0.6px;
  color: #17252b;
}

.login-guide__desc {
  margin: 8px 0 0;
  font-size: 13.5px;
  line-height: 22px;
  color: #65747c;
}

.login-guide__login {
  width: 260px;
  height: 50px;
  margin-top: 30px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 12px;

  --el-button-text-color: #ffffff;
  --el-button-bg-color: #007c77;
  --el-button-border-color: #007c77;
  --el-button-hover-text-color: #ffffff;
  --el-button-hover-bg-color: #006b67;
  --el-button-hover-border-color: #006b67;
  --el-button-active-text-color: #ffffff;
  --el-button-active-bg-color: #00615e;
  --el-button-active-border-color: #00615e;
}

.login-guide__wechat {
  width: 260px;
  height: 46px;
  margin: 14px 0 0;
  font-size: 12.5px;
  font-weight: 500;
  border-radius: 12px;

  --el-button-text-color: #3d4b54;
  --el-button-bg-color: #ffffff;
  --el-button-border-color: #d8e2e3;
  --el-button-hover-text-color: #3d4b54;
  --el-button-hover-bg-color: #f7fbfa;
  --el-button-hover-border-color: #bfe3dd;
}

.login-guide__wechat-icon {
  flex-shrink: 0;
  margin-right: 8px;
}

.login-guide__agree {
  margin: 26px 0 0;
  font-size: 10.5px;
  line-height: 16px;
  color: #65747c;

  span {
    font-weight: 500;
    color: #3d4b54;
    border-bottom: 1px solid #cbd5d6;
  }
}
</style>
