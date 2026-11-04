import { request } from '@/utils/request'

/** 会话类型：chat 是多轮对话，其余场景（skill / jd / drawer / interpret）是单轮分析 */
export type ConversationType = 'single' | 'multi'

/** 历史对话列表中的一行 */
export interface ConversationSummary {
  conversationId: string
  type: ConversationType
  scene: string
  /** 由用户第一句话生成的标题，未生成时为空串 */
  title: string
  updateTime: string
  messageCount: number
  /** 最后一条消息内容（通常是 AI 回复） */
  lastMessage: string
}

export interface ConversationMessage {
  role: string
  content: string
  createTime: string
}

/** 单个会话的完整消息 */
export interface ConversationDetail {
  conversationId: string
  type: ConversationType
  scene: string
  updateTime: string
  messages: ConversationMessage[]
}

/** 侧边栏历史对话列表：当前登录用户最近的会话，按最后活跃时间倒序 */
export const listConversations = (limit = 20) =>
  request<ConversationSummary[]>('/ai/conversations', { params: { limit } })

/** 按会话 ID 取完整消息 */
export const getConversation = (conversationId: string) =>
  request<ConversationDetail>('/ai/conversation', { params: { conversationId } })

/** 批量删除会话（后端单次上限 50 个） */
export const deleteConversations = (conversationIds: string[]) =>
  request<{ deleted: number; missing: string[] }>('/ai/conversation', {
    method: 'DELETE',
    data: { conversationIds },
  })
