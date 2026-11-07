<template>
  <div class="agreement">
    <div class="agreement__inner">
      <!-- 页面标题 -->
      <header class="agreement__head">
        <p class="agreement__crumb">
          <router-link to="/" class="agreement__crumb-link">首页</router-link>
          <span class="agreement__crumb-sep">/</span>
          <span>用户隐私协议</span>
        </p>
        <h1 class="agreement__title">用户隐私协议</h1>
        <p class="agreement__sub">使用本服务前，请阅读并同意以下条款</p>
      </header>

      <!-- 协议正文 -->
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
/** 协议小节：标题 + 若干段落 */
interface AgreementSection {
  title: string
  paragraphs: string[]
}

const sections: AgreementSection[] = [
  {
    title: '一、服务说明',
    paragraphs: [
      '本应用为求职者提供岗位浏览、岗位匹配分析与求职资料管理服务，帮助你在求职过程中更高效地了解岗位与自身条件的匹配情况。',
      '你使用本服务即表示已阅读并同意本协议的全部内容；如不同意，请停止使用。',
    ],
  },
  {
    title: '二、账号与安全',
    paragraphs: [
      '你需要使用手机号注册并登录，请妥善保管账号与密码，不要向他人泄露。',
      '如发现账号存在异常登录或被盗用，请及时修改密码并与我们联系。',
    ],
  },
  {
    title: '三、使用规范',
    paragraphs: [
      '你承诺不利用本服务发布虚假信息、进行批量爬取、干扰服务正常运行，或从事其他违反法律法规的行为。',
      '对违反上述规范的行为，我们有权限制或终止相应服务。',
    ],
  },
  {
    title: '四、内容与知识产权',
    paragraphs: [
      '本应用内的界面设计、文字、图表等内容的知识产权归我们或相应权利人所有，未经许可不得复制、传播或用于商业用途。',
      '你提交的简历与求职信息仍归你所有，你授权我们在提供服务的范围内使用这些信息。',
    ],
  },
  {
    title: '五、个人信息收集与使用',
    paragraphs: [
      '为完成账号注册与登录，我们会收集你的手机号；为生成匹配分析与岗位推荐，我们会收集你填写的城市、工作经验、学历、技能、当前薪资与期望薪资等信息。',
      '上述信息仅用于账号识别、岗位推荐、匹配分析与服务改进，不会用于与服务无关的用途。',
    ],
  },
  {
    title: '六、信息共享与披露',
    paragraphs: [
      '除法律法规要求或取得你的明确同意外，我们不会向第三方出售或共享你的个人信息。',
      '在使用第三方服务（如短信验证）时，我们仅会提供完成该服务所必需的信息。',
    ],
  },
  {
    title: '七、信息存储与保护',
    paragraphs: [
      '我们会在实现服务目的所需的期限内保存你的信息，并采取加密传输、访问控制等措施保护数据安全。',
      '尽管我们已采取合理措施，仍无法完全避免网络环境中的安全风险。',
    ],
  },
  {
    title: '八、你的权利',
    paragraphs: [
      '你可以在「个人中心」查看和修改资料，在「偏好设置」更新求职意向，并可随时取消收藏或删除分析报告。',
      '如需注销账号或删除个人信息，可联系我们处理。',
    ],
  },
  {
    title: '九、协议变更',
    paragraphs: ['我们可能根据业务调整更新本协议，更新后会在应用内提示；继续使用即视为同意更新后的内容。'],
  },
]
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
