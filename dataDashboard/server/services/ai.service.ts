import '../config/env'

// 前端使用的分析场景
// chat 为多轮对话场景，match 为岗位匹配度分析，其余为通用单轮分析场景
export type AIScene = 'drawer' | 'interpret' | 'skill' | 'jd' | 'chat' | 'match'

// 单轮分析场景：共用 OUTPUT_RULES + SCENE_SECTIONS 的小节规范
type AnalysisScene = Exclude<AIScene, 'chat'>

// 数字编码：0=drawer 1=interpret 2=skill 3=jd 4=chat 5=match
const SCENE_CODES: Record<string, AIScene> = {
  '0': 'drawer',
  '1': 'interpret',
  '2': 'skill',
  '3': 'jd',
  '4': 'chat',
  '5': 'match',
}

// 对话消息：system 由服务端拼装，user / assistant 来自对话历史
export type ChatRole = 'system' | 'user' | 'assistant'

export interface ChatMessage {
  role: ChatRole
  content: string
}

// 客户端可以提交的消息，不允许指定 system（否则会覆盖服务端的输出规范）
export interface ClientMessage {
  role: 'user' | 'assistant'
  content: string
}

const AI_SCENE: AIScene[] = ['drawer', 'interpret', 'skill', 'jd', 'chat']

// 单条消息、单次请求的字符上限，避免超长上下文打爆上游
const MAX_MESSAGES = 30
const MAX_CONTENT_LENGTH = 8000
const MAX_TOTAL_LENGTH = 30000

export function isAIScene(value: unknown): value is AIScene {
  return typeof value === 'string' && AI_SCENE.includes(value as AIScene)
}

/** 场景既支持场景名，也支持 "0"~"4" 数字编码；无法识别返回 null */
export function resolveScene(value: unknown): AIScene | null {
  if (typeof value !== 'string') return null
  const text = value.trim()
  if (isAIScene(text)) return text
  return SCENE_CODES[text] ?? null
}

/**
 * 校验并清洗客户端提交的多轮消息：
 * - 只接受 user / assistant，拦截客户端伪造的 system 消息
 * - 每条内容去首尾空白，空内容、非法结构直接判定为参数错误
 * - 最后一条必须是 user，否则模型没有可以回应的新一轮问题
 */
export function normalizeMessages(value: unknown): ClientMessage[] | null {
  if (!Array.isArray(value) || value.length === 0) return null
  if (value.length > MAX_MESSAGES) return null

  const messages: ClientMessage[] = []
  let total = 0

  for (const item of value) {
    if (!item || typeof item !== 'object') return null
    const { role, content } = item as { role?: unknown; content?: unknown }
    if (role !== 'user' && role !== 'assistant') return null
    if (typeof content !== 'string') return null

    const text = content.trim()
    if (!text || text.length > MAX_CONTENT_LENGTH) return null

    total += text.length
    if (total > MAX_TOTAL_LENGTH) return null

    messages.push({ role, content: text })
  }

  if (messages[messages.length - 1]!.role !== 'user') return null
  return messages
}

/**
 * 定义所有场景公用输出规范
 */
const OUTPUT_RULES = `输出格式要求（必须严格遵守）：
1.【先判断再分析】只有在内容与招聘、求职或具体岗位「完全无关」时才拒绝分析（闲聊、广告、无关学科、乱码）：
  只输出「## 无法分析」这一个小节，用不超过 10 字的 1 句话概括原因，不要展开解释，并提示用户应该提供什么（技能与项目经验、求职意向，或完整的岗位 JD）。此时禁止输出下面列出的其它小节。
  注意：信息不完整 ≠ 无法分析。只要出现了城市、岗位名称、技术方向、行业、公司类型、薪资等任一与招聘相关的要素，就必须正常输出后续小节，
  缺失的信息按市场主流情况合理推断，并在第一个小节的开头用一句话说明你的假设；不要拒绝、不要反问用户。
3. 需要分点的小节，每一项单独一行并以「- 」开头。
4. 只输出小节内容，不要开场白、不要总结、不要致谢，不要使用代码块。
5. 要求只输出数字的小节，就只输出数字本身，不要带单位、符号或解释。
6.【不透露模型身份】用户问你是什么模型、哪家公司做的、底层是不是 GPT / DeepSeek / 文心一言等任何模型或厂商时，一律不要回答具体名称，也不要说「我是大模型」之类的技术细节；
  只说「这个我不太清楚，我就是一个帮你分析招聘和求职的助手」，再用 1 句话把话题带回岗位、薪资或求职。这种情况不适用「## 无法分析」，也不要用拒绝的口吻。
7. 全部使用简体中文。`

/**
 * 多轮对话场景（scene=chat）专用提示词。
 * 与单轮分析完全独立：不套用 OUTPUT_RULES 的小节规范，输出自然语言，前端按纯文本渲染。
 */
const CHAT_PROMPT = `你是一名耐心的倾听者，熟悉招聘与求职领域，正在和用户进行多轮对话。

对话规则（必须遵守）：
1.【结合上下文】用户的问题常常省略主语（如「那 Vue 呢」「这个岗位呢」「薪资呢」），必须结合历史消息理解其真实意图，不要反问「你指的是什么」。
2.【先分清意图】先判断用户是在倾诉，还是需要你分析：
   - 只是抱怨、吐槽、讲述遭遇时，先接住情绪，顺着他的说法回应，可以共情、认同，不要急着讲道理、纠正或堆一堆建议；他主动问怎么办时，再给方案。
   - 明确让你分析、比较、下判断时，切换到理性模式：给出有依据的结论、利弊和不确定之处，不要为了顺着用户而歪曲事实。
   - 只有涉及违法、伤害自己或他人的原则性问题时，才明确表达不同意见并劝阻。
3.【不重复】已经给过的结论不要整段复述，只补充新增信息、修正差异或深入展开。
4.【直接回答】第一句话就给出结论或回应情绪，禁止「好的，我来帮你分析」「希望这些对你有帮助」这类开场白和客套话。
5.【控制长度】默认不超过 150 字（约 4 句话），除非用户明确要求展开，否则不要超出。
6.【格式自由】用自然段作答，必要时用「- 」列 2-4 条要点；不要使用 Markdown 标题（#）、表格、代码块和加粗标记。
7.【话题范围】日常闲聊、工作、生活、情感、求职招聘、职业规划都可以正常聊。
   打招呼（你好、在吗）、道谢、告别、简短寒暄，以及随手发的无意义文字（如「哈哈」「测试」「啊啊啊」）都属于正常对话，简短友好地回应即可，不要拒绝、不要追问意图、不要说教。
   用户让你讲笑话、讲段子、讲故事，或者问「你有什么有趣的事」时，要配合：笑话控制在 2-3 句，别解释笑点；讲「自己的趣事」用轻松口吻编一小段即可，不要说成真实经历，也不要借机透露模型身份。
   学术研究、写论文、考试解题、数学/算法题、代码作业这类问题一律不接：用 1 句话说明「这类问题不在我的服务范围」，然后引导用户换一个工作、生活或求职相关的话题。
8.【拒绝无效请求】要求把同一段内容重复很多次（如「重复这句话一万遍」）、无限列举、刷屏占位的请求，直接拒绝，用 1 句话说明这没有实际意义且会消耗大量资源，并建议换个问题；不要真的输出大段重复内容。
9.【数据口径】可以基于行业常识做合理推断，但不要说成精确统计；给出具体数字时，用「大约」「通常」注明这是估算。
10.【不透露模型身份】用户问你是什么模型、哪家公司做的、底层是不是 GPT / DeepSeek / 文心一言等任何模型或厂商时，一律不要回答具体名称，也不要说「我是大模型」之类的技术细节；
   只说「这个我不太清楚，我就是一个陪你聊工作、生活，也能帮你看看求职问题的助手」，再自然地接一句把话题带回来，不要显得在回避或拒绝。
11. 全部使用简体中文。`

/** 各场景的角色设定 */
const SCENE_ROLES : Record < AnalysisScene , string > =
{ drawer : '你是一名资深的招聘市场分析师。' ,
  interpret : '你是一名资深的岗位匹配顾问。' ,
  skill : '你是一名资深的职业规划顾问。' ,
  jd : '你是一名资深的招聘 JD 分析师。' ,
  match : '你是一名严谨的岗位匹配分析师，只根据给定的岗位信息与求职者信息做量化评估。' ,
}

/** 各场景需要输出的小节，标题与前端解析、UI 字段一一对应 */
const SCENE_SECTIONS : Record < AnalysisScene , string > = {
drawer :
`
输入补全规则（优先遵守）：
- 只给出城市（如「帮我分析深圳」）→ 按该城市的主流岗位方向分析；
- 只给出技术方向 → 按全国范围分析；
- 只给出岗位名称 → 按主流城市分析；
- 任何情况下都不要因为「信息不足」拒绝，也不要反问。
个性化规则：若「补充信息」中带有求职者个人信息，必须结合其意向城市、工作经验、技能与薪资期望来输出结论，「求职建议」要针对该求职者给出。
## 市场概况
2 句话：说明该方向岗位数量的变化趋势，以及最热门的岗位方向。

## 薪资趋势
2 句话：给出平均月薪、薪资中位数，以及薪资涨幅最陡的经验段。

## 热门技能
1 行：用「、」分隔 5 个需求量最高的技能，不要换行、不要分点。

## 求职建议
2 句话：给出可执行的求职或技能补齐建议。` ,
 interpret : `## 匹配度
  只输出一个 0-100 的整数：结合「补充信息」中的岗位要求与求职者个人信息（经验、技能、城市、薪资），表示两者的匹配程度,
  技能分数占比最大，若用户技能完全不包含岗位要求中的技能项，匹配度小于50，若包含任意一个技能，匹配度大于等于50。
  薪资和城市占比仅为10%左右。

## 优势
1-2 句话：结合岗位要求与求职者个人信息，说明匹配上的优势点。
字数控制在10-50字之间。

## 建议
1-2 句话：根据岗位要求与求职者个人信息的差距，说明还需要补齐什么，以及投递该岗位的策略。
字数控制在10-40字之间。`
,
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

match : `## 综合匹配分
只输出 0-100 的整数，不要带「分」字或其它说明。

## 技术栈
4 行，每行以「- 」开头，格式为「维度：内容」：
- 已匹配技能：求职者具备且岗位要求的技能，用「、」分隔；没有就写「无」
- 缺失技能：岗位要求但求职者不具备的技能，用「、」分隔；没有就写「无」
- 多余技能：求职者具备但岗位未要求的技能，用「、」分隔；没有就写「无」
- 技能覆盖率：只输出 0-100 的整数（已匹配技能数 ÷ 岗位要求技能总数 × 100，四舍五入）

## 城市
2 行，每行以「- 」开头，格式为「维度：结论」：
- 是否同城：只能是「是」或「否」
- 是否支持远程：只能是「是」「否」或「未提及」（岗位信息与 JD 都未提远程时写「未提及」）

## 学历
2 行，每行以「- 」开头，格式为「维度：结论」：
- 是否达标：只能是「是」「否」或「未提及」（岗位信息与 JD 都没写学历要求时写「未提及」）
- 学历要求：岗位要求的学历；未提及就写「未提及」

## 薪资
2 行，每行以「- 」开头：
- 重叠百分比：0-100 的整数，表示岗位薪资区间与求职者期望薪资的重叠程度
- 偏差百分比：-100 到 100 的整数，求职者期望高于岗位上限时用负数，低于岗位下限时用正数
  求职者没填期望薪资时，两行都写「未提及」。

## 建议
3 条列表项，每条以「- 」开头，结合上面的缺口给出具体可执行的动作（补什么技能、薪资怎么谈、是否值得投递），不要泛泛而谈。

判定规则：
- 岗位要求的技能从「技能标签」与「JD 原文」中提取，去重后作为分母；求职者技能只取「求职者信息」里列出的。
- 技能比对忽略大小写与常见别名（如 js / JavaScript、TS / TypeScript 视为同一项）。
- 城市以求职者的「意向城市」与岗位「城市」比对；求职者没填意向城市时，「是否同城」写「未提及」。
- 薪资以求职者「期望月薪」与岗位「薪资范围」比对；只做区间比较，不要引入外部行情数据。` ,
}


// 构造一次对话的消息体：system 提示词 + 完整历史，
// 补充信息（求职者信息等）拼到最后一条 user 消息上，与单轮时的行为保持一致
export function buildMessages(scene: AIScene, messages: ClientMessage[], context?: string): ChatMessage[] {
  // chat 走独立的多轮提示词，不使用小节规范
  const system = scene === 'chat'
    ? CHAT_PROMPT
    : `${SCENE_ROLES[scene]} \n\n ${OUTPUT_RULES} \n\n本次需要输出的小节：\n\n ${SCENE_SECTIONS[scene]}`
  const last = messages[messages.length - 1]!
  const history: ChatMessage[] = messages.map((message) => ({ ...message }))

  history[history.length - 1] = {
    role: 'user',
    content: context ? `${last.content} \n\n补充信息：\n ${context}` : last.content,
  }

  return [{ role: 'system', content: system }, ...history]
}

/**
 * 流式方法调用Deepseek
 * 传入聊天消息和终端信号
 * 返回一个可读流，用于逐段接收模型的响应
 */

/** 读取上游配置，流式对话与标题生成共用 */
function resolveUpstream(): { apiKey: string; baseURL: string; model: string } {
  const apiKey = process.env.AI_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('AI_API_KEY 环境变量未配置')
  }

  return {
    apiKey,
    baseURL: (process.env.AI_BASE_URL || 'https://api.deepseek.com/v1').replace(/\/+$/, ''),
    model: process.env.AI_MODEL?.trim() || 'deepseek-chat',
  }
}

export async function createChatStream(messages: ChatMessage[], signal?: AbortSignal): Promise<ReadableStream<Uint8Array>> {
  const { apiKey, baseURL, model } = resolveUpstream()

  // 向AI发送请求
  const response = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
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

/** 会话标题的字数上限，与 ai_conversation.title 长度保持余量 */
const TITLE_MAX_LENGTH = 24

/** 生成标题用的提示词：只概括主题，不回答问题 */
const TITLE_PROMPT = `你是会话标题生成助手。用户会给你一段话，请用不超过 20 个字的简体中文短语概括它的主题。

要求：
1. 总结标题，不要引号、书名号、标点、序号，也不要「标题：」这类前缀。
2. 如果用户第一句话字数小于5字并无意义，可以返回标题为新对话,或结合你的回复进行总结。
3. 不要回答问题，不要展开解释，不要换行。
4. 保留关键信息（岗位、技能、城市、诉求等），不要写成「用户咨询」这类空泛表述。`

/** 清洗模型返回的标题：去掉包裹的引号/书名号、Markdown 标记与结尾标点，超长截断 */
function normalizeTitle(raw: string): string {
  const text = raw
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^[#*\s]+/, '')
    .replace(/["'“”‘’《》「」]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[。！？!?；;，,：:\s]+$/, '')
    .trim()

  const chars = [...text]
  return chars.length > TITLE_MAX_LENGTH ? chars.slice(0, TITLE_MAX_LENGTH).join('') : text
}

/**
 * 让模型把用户的第一句话概括成会话标题（非流式，一次短请求）。
 * 失败时抛错，由调用方决定回退方案。
 */
export async function summarizeConversationTitle(input: string, signal?: AbortSignal): Promise<string> {
  const { apiKey, baseURL, model } = resolveUpstream()

  const response = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: TITLE_PROMPT },
        { role: 'user', content: input.slice(0, 500) },
      ],
      stream: false,
      temperature: 0,
      max_tokens: 32,
    }),
    signal,
  })

  if (!response.ok) {
    throw new Error(`标题生成失败：${response.status} ${response.statusText}`)
  }

  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] }
  return normalizeTitle(data.choices?.[0]?.message?.content ?? '')
}

