<template>
  <div class="ai-analyse">
    <!--个人技能篇评估，JD岗位拆解部分 -->
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
          <el-button type="primary" :disabled="!content.trim()">
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
            <span @click="startAnalysis" style="margin-left: 5px;">开始分析</span>
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// 切换分析类型
const activeTab = ref('1')
const changeAnalysis = (tab: string) => {
  activeTab.value = tab
}

// 文本框内容
const content = ref('')

// 开始分析
const startAnalysis = () => {
  // 判断是否为空
  if (!content.value.trim()) {
    return
  }

  // 判断是类型
  if (activeTab.value === '1') {
    // 个人技能评估
    console.log('个人技能评估：', content.value)
  } else if (activeTab.value === '2') {
    // JD岗位拆解
    console.log('JD岗位拆解：', content.value)
  }
}
</script>

<style scoped>
.header_analysis {
  display: flex;
  flex-direction: column;
  height: 400px;
  background-color: #fff;
  margin: 30px 60px;
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
</style>
