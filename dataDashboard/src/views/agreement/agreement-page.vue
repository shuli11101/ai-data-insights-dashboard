<!--
  协议类页面通用版式：面包屑 + 标题 + 白底正文卡片
  用户协议 / 隐私政策共用，内容由各自页面传入
-->
<template>
  <div class="agreement">
    <div class="agreement__inner">
      <header class="agreement__head">
        <p class="agreement__crumb">
          <router-link to="/" class="agreement__crumb-link">首页</router-link>
          <span class="agreement__crumb-sep">/</span>
          <span>{{ title }}</span>
        </p>
        <h1 class="agreement__title">{{ title }}</h1>
        <p class="agreement__sub">{{ subtitle }}</p>
      </header>

      <section class="sheet">
        <article v-for="(section, index) in sections" :key="section.title" class="sheet__section">
          <h2 class="sheet__title">{{ section.title }}</h2>
          <p v-for="(paragraph, pIndex) in section.paragraphs" :key="pIndex" class="sheet__text">
            {{ paragraph }}
          </p>
          <div v-if="index < sections.length - 1" class="sheet__divider"></div>
        </article>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  /** 页面标题，如「用户协议」 */
  title: string
  /** 标题下的一句话说明 */
  subtitle: string
  /** 协议小节：标题 + 若干段落 */
  sections: { title: string; paragraphs: string[] }[]
}>()
</script>

<style scoped lang="scss">
.agreement {
  --ag-primary: #007c77;
  --ag-ink: #17252b;
  --ag-text: #3d4b54;
  --ag-muted: #65747c;
  --ag-faint: #8a979e;
  --ag-border: #dde8e6;
  --ag-line: #edf2f2;

  min-height: 100%;
  font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  color: var(--ag-ink);
  background: #f4f8f7;

  .agreement__inner {
    box-sizing: border-box;
    width: 100%;
    max-width: 960px;
    padding: 0 40px 40px;
    margin: 0 auto;
  }

  .agreement__head {
    padding: 32px 0 24px;
  }

  .agreement__crumb {
    display: flex;
    gap: 8px;
    align-items: center;
    margin: 0 0 14px;
    font-size: 11.5px;
    color: var(--ag-faint);
  }

  .agreement__crumb-link {
    color: var(--ag-faint);
    text-decoration: none;
    transition: color 0.2s ease;

    &:hover {
      color: var(--ag-primary);
    }
  }

  .agreement__crumb-sep {
    color: #b9c6c5;
  }

  .agreement__title {
    margin: 0;
    font-size: 34px;
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: -1.2px;
    color: var(--ag-ink);
  }

  .agreement__sub {
    margin: 8px 0 0;
    font-size: 13px;
    color: var(--ag-muted);
  }

  .sheet {
    padding: 32px;
    background: #ffffff;
    border: 1px solid var(--ag-border);
    border-radius: 18px;
  }

  .sheet__title {
    margin: 0 0 12px;
    font-size: 16px;
    font-weight: 600;
    line-height: 24px;
    letter-spacing: -0.2px;
    color: var(--ag-ink);
  }

  .sheet__text {
    margin: 0;
    font-size: 13px;
    line-height: 1.95;
    color: var(--ag-text);

    & + & {
      margin-top: 10px;
    }
  }

  .sheet__divider {
    height: 1px;
    margin: 24px 0;
    background: var(--ag-line);
  }

  @media (max-width: 1023.98px) {
    .agreement__inner {
      padding: 0 24px 32px;
    }
  }

  @media (max-width: 640px) {
    .agreement__inner {
      padding: 0 16px 24px;
    }

    .agreement__head {
      padding: 24px 0 18px;
    }

    .agreement__title {
      font-size: 26px;
      letter-spacing: -0.8px;
    }

    .sheet {
      padding: 20px;
      border-radius: 14px;
    }

    .sheet__title {
      font-size: 15px;
    }

    .sheet__divider {
      margin: 20px 0;
    }
  }
}
</style>
