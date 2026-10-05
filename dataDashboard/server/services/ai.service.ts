import '../config/env'

// 前端使用的分析场景
// 聊天场景
export type AIScene = 'drawer' | 'interpret' | 'skill' | 'jd'

// 聊天消息格式
export interface ChatMessage {
  role: 'user' | 'system'
  content: string
}

const AI_SCENE: AIScene[] = ['drawer', 'interpret', 'skill', 'jd']

export function isAIScene(value: unknown): value is AIScene {
  return typeof value === 'string' && AI_SCENE.includes(value as AIScene)
}

/**
 * 定义所有场景公用输出规范
 */
const OUTPUT_RULES = `输出格式要求（必须严格遵守）：
1.【先判断再分析】如果用户提供的内容与招聘、求职或具体岗位无关（闲聊、广告、无关学科、乱码、内容过短无法判断等），直接拒绝分析：只输出「## 无法分析」这一个小节，用 1 句话说明原因，并提示用户应该提供什么（技能与项目经验、求职意向，或完整的岗位 JD）。此时禁止输出下面列出的其它小节。
2. 内容有效时，用「## 小节标题」开头组织内容，小节标题必须与下面给定的标题完全一致，顺序也不能改变。
3. 需要分点的小节，每一项单独一行并以「- 」开头。
4. 只输出小节内容，不要开场白、不要总结、不要致谢，不要使用代码块。
5. 要求只输出数字的小节，就只输出数字本身，不要带单位、符号或解释。
6. 全部使用简体中文。`

/** 各场景的角色设定 */
const SCENE_ROLES : Record < AIScene , string > =
{ drawer : '你是一名资深的招聘市场分析师。' ,
  interpret : '你是一名资深的岗位匹配顾问。' ,
  skill : '你是一名资深的职业规划顾问。' ,
  jd : '你是一名资深的招聘 JD 分析师。' ,
}

/** 各场景需要输出的小节，标题与前端解析、UI 字段一一对应 */
const SCENE_SECTIONS : Record < AIScene , string > = {
drawer : `## 市场概况
2 句话：说明该方向岗位数量的变化趋势，以及最热门的岗位方向。

## 薪资趋势
2 句话：给出平均月薪、薪资中位数，以及薪资涨幅最陡的经验段。

## 热门技能
1 行：用「、」分隔 5 个需求量最高的技能，不要换行、不要分点。

## 求职建议
2 句话：给出可执行的求职或技能补齐建议。` ,
 interpret : `## 匹配度
只输出一个 0-100 的整数，表示求职者与该岗位的匹配程度。

## 优势
1-2 句话：结合岗位要求与求职者的分析需求，说明匹配上的优势点。

## 建议
1-2 句话：说明还需要补齐什么，以及投递该岗位的策略。` ,
skill : `## 匹配度评分
只输出一个 0-100 的整数，表示求职者与当前市场主流岗位的匹配程度。

## 超越比例
只输出一个 0-100 的整数，表示该匹配度超过了百分之多少的同岗位候选人。

## 薪资预估
只输出薪资区间，形如 25k-38k。

## 目标岗位
只输出「城市·岗位名」，形如 深圳·产品经理。

## 市场中位数
只输出形如 30k 的数值。

## 核心优势
3-5 条列表项，每条以「- 」开头，概括求职者的核心竞争力。

## 待补充技能
3-5 条列表项，每条以「- 」开头，列出求职者缺失但市场普遍要求的技术或能力。

## 求职建议
3 条列表项，每条以「- 」开头，给出具体的投递与面试准备建议。` ,
jd : `## 岗位基本信息
4 行，每行以「- 」开头，格式为「字段名：值」，依次输出：职位名称、所属部门、工作地点、薪资范围（形如 25k-38k）。原文未提及的字段，值写「未提及」。

## 岗位职责
4 行，每行以「- 」开头，格式为「字段名：值」，依次输出：日常做什么、核心产出、协作对象、优先级判断。原文未提及的字段，值写「未提及」。


## 认知要求
2 行，每行以「- 」开头，格式为「字段名：值1、值2、值3」，依次输出：硬性要求，软性要求。多个值用「、」分隔,并将每个值用小于等于5个字概括，不要换行、不要方括号。原文未提及的字段，值写「未提及」。
判定规则:
- 硬性要求 = 学历、专业、年限、必备技能/工具、证书、语言等级等可量化门槛
- 软性要求 = 沟通、抗压、学习、协作、自驱等素质类描述
- 标注"优先/加分/了解"的，归入软性要求
- 原文未提及的字段，值写「未提及」


## 隐藏信息
5 条列表项，每条以「- 」开头，格式为「维度：结论」。结合 JD 的措辞、职级与业务描述推断出明确结论，不要复述问题，也不要输出「未提及」。5 个维度依次为：团队阶段（是 0-1 搭建还是成熟体系维护）、岗位新增还是替补（若是替补，推测前任离开的原因）、业务方向（公司重点投入还是边缘试水）、加班与文化暗示（如「抗压能力强」「快速响应」等措辞往往意味着节奏快）、晋升路径（这个岗位往上走是什么）。

## 核心优势
3-5 条列表项，每条以「- 」开头，提炼该岗位的核心亮点与技术要求。

## 待补充技能
3-5 条列表项，每条以「- 」开头，列出该岗位要求的关键技能。

## 求职建议
3 条列表项，每条以「- 」开头，给出针对该 JD 的投递与面试准备建议。

## 面试准备方向
3 行，每行以「- 」开头，格式为「维度：内容」。维度依次为：高频问题（根据 JD 反推面试官最可能问的 3 个问题，用「、」分隔）、作品准备（需要提前准备的项目案例或作品集）、反问问题（可以向面试官反问的 2-3 个问题，用「、」分隔）。内容要结合本 JD 的具体要求，不要泛泛而谈，也不要照抄本段说明。` ,
}


// 构造一次对话的消息体 规范输出
export function buildMessages(scene: AIScene, input: string, context?: string ): ChatMessage[] {
  const system = `${SCENE_ROLES[scene]} \n\n ${OUTPUT_RULES} \n\n本次需要输出的小节：\n\n ${SCENE_SECTIONS[scene]}`
  const user = context ? ` ${input} \n\n补充信息：\n ${context} ` : input

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]
}

/**
 * 流式方法调用Deepseek
 * 传入聊天消息和终端信号
 * 返回一个可读流，用于逐段接收模型的响应
 */

export async function createChatStream(messages: ChatMessage[], signal?: AbortSignal): Promise<ReadableStream<Uint8Array>> {
  const APIkey = process.env.AI_API_KEY?.trim()
  if (!APIkey) {
    throw new Error('AI_API_KEY 环境变量未配置')
  }

  const baseURL = (process.env.AI_BASE_URL || 'https://api.deepseek.com/v1' ).replace ( /\/+$/ , '' )

  // 向AI发送请求
  const response = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${APIkey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL?.trim() || 'deepseek-chat',
      messages,
      stream: true,
      temperature: 0.3, // 输出随机性
    }),
    signal,
  })
  console.log('upstream status:', response.status)
  if (!response.ok || !response.body) {
    const detail = await response.text()
    throw new Error(`Deepseek API 返回错误状态码 ${response.status}: ${response.statusText} ${detail}`)
  }

  return response.body
}

