import type { ResultSetHeader, RowDataPacket } from 'mysql2'
import pool from '../config/db'
import type { AIScene, ClientMessage } from './ai.service'

/**
 * AI 会话落库：
 * - ai_conversation：一次会话一行，按 user_id 归属，conversation_id 是给前端的可见 ID
 * - ai_message：按 (conversation_pk, seq) 顺序保存 user / assistant 消息，
 *   seq 与客户端提交的 messages 下标一致，重复提交同一段历史不会重复插入
 */
const CREATE_CONVERSATION = `CREATE TABLE IF NOT EXISTS ai_conversation (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  conversation_id VARCHAR(64) NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  scene VARCHAR(20) NOT NULL,
  title VARCHAR(64) DEFAULT NULL,
  client_ip VARCHAR(64) DEFAULT NULL,
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_conversation (user_id, conversation_id),
  KEY idx_user_update (user_id, update_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`

const CREATE_MESSAGE = `CREATE TABLE IF NOT EXISTS ai_message (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  conversation_pk BIGINT UNSIGNED NOT NULL,
  seq INT UNSIGNED NOT NULL,
  role VARCHAR(16) NOT NULL,
  content MEDIUMTEXT NOT NULL,
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_conversation_seq (conversation_pk, seq)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`

async function hasColumn(table: string, column: string): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [table, column],
  )
  return rows.length > 0
}

/** 表是否存在 */
async function hasTable(table: string): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_name = ?`,
    [table],
  )
  return rows.length > 0
}

/**
 * 建表（幂等），服务启动时调用一次。
 * 老版本按 client_ip 归属、消息表用 conversation_id 关联，结构与现在不兼容，
 * 检测到旧结构时直接清空重建（旧数据均为匿名数据，不再保留）。
 */
export async function ensureConversationTables(): Promise<void> {
  if (await hasTable('ai_conversation')) {
    const isOldSchema = !(await hasColumn('ai_conversation', 'user_id'))
      || !(await hasTable('ai_message'))
      || !(await hasColumn('ai_message', 'conversation_pk'))

    if (isOldSchema) {
      await pool.query('DROP TABLE IF EXISTS ai_message')
      await pool.query('DROP TABLE IF EXISTS ai_conversation')
    }
  }

  await pool.query(CREATE_CONVERSATION)
  await pool.query(CREATE_MESSAGE)

  // 老表补 title 字段，并用第一条用户消息回填一个标题，避免历史列表继续显示 AI 回复
  if (!(await hasColumn('ai_conversation', 'title'))) {
    await pool.query('ALTER TABLE ai_conversation ADD COLUMN title VARCHAR(64) DEFAULT NULL AFTER scene')
    await pool.query(
      `UPDATE ai_conversation c
       JOIN (SELECT conversation_pk, content FROM ai_message WHERE seq = 0) m
         ON m.conversation_pk = c.id
       SET c.title = LEFT(m.content, 24)
       WHERE c.title IS NULL OR c.title = ''`,
    )
  }
}

/** 会话标题的最大长度（按字符计） */
const TITLE_MAX_LENGTH = 24

/**
 * 兜底标题：AI 概括失败时，直接取用户第一条消息的首句并截断。
 * 尽力去掉代码块与 Markdown 标记、压缩空白。
 */
export function buildConversationTitle(content: string): string {
  const text = content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#*`>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (!text) return ''

  // 中英文标点都视为句子结束
  const sentence = (/^(.+?)[。！？!?；;]/.exec(text)?.[1] ?? text).trim()
  const chars = [...sentence]
  return chars.length > TITLE_MAX_LENGTH ? `${chars.slice(0, TITLE_MAX_LENGTH).join('')}…` : sentence
}

/** 取会话已有标题；会话不存在或标题为空时返回空串（用于避免重复生成） */
export async function getConversationTitle(conversationId: string, userId: number): Promise<string> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT title FROM ai_conversation WHERE conversation_id = ? AND user_id = ? LIMIT 1',
    [conversationId, userId],
  )

  return (rows[0]?.title as string) ?? ''
}

/**
 * 会话不存在时创建，已存在时刷新场景与来源 IP，返回会话的内部主键。
 * ON DUPLICATE KEY 里用 LAST_INSERT_ID(id) 把已有行的 id 回写给 insertId，
 * 避免多查一次；唯一键是 (user_id, conversation_id)，同 ID 不会串到别人名下。
 * title 只在首次写入时生效（已有标题不再覆盖），保证历史列表始终显示最初那句总结。
 */
export async function saveConversation(
  conversationId: string,
  userId: number,
  scene: AIScene,
  clientIp: string,
  title = '',
): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO ai_conversation (conversation_id, user_id, scene, title, client_ip)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       id = LAST_INSERT_ID(id),
       scene = VALUES(scene),
       title = COALESCE(NULLIF(title, ''), VALUES(title)),
       client_ip = VALUES(client_ip)`,
    [conversationId, userId, scene, title, clientIp],
  )

  return Number(result.insertId)
}

/**
 * 追加客户端提交的历史消息。
 * 客户端每次都会带上完整历史，这里只补存尚未入库的尾部，
 * 避免同一段对话在每一轮都被重复插入。
 */
export async function appendHistory(conversationPk: number, messages: ClientMessage[]): Promise<void> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT IFNULL(MAX(seq), -1) AS maxSeq FROM ai_message WHERE conversation_pk = ?',
    [conversationPk],
  )

  const start = Number(rows[0]?.maxSeq ?? -1) + 1
  if (start >= messages.length) return

  const values = messages.slice(start).map((message, index) => [
    conversationPk,
    start + index,
    message.role,
    message.content,
  ])
  await pool.query('INSERT INTO ai_message (conversation_pk, seq, role, content) VALUES ?', [values])
}

/** 保存模型回复，seq 接在已有消息之后 */
export async function appendAssistantMessage(conversationPk: number, content: string): Promise<void> {
  if (!content) return

  await pool.query(
    `INSERT INTO ai_message (conversation_pk, seq, role, content)
     SELECT ?, IFNULL(MAX(seq), -1) + 1, 'assistant', ? FROM ai_message WHERE conversation_pk = ?`,
    [conversationPk, content, conversationPk],
  )

  // 会话列表按最近活跃排序，回答写完要同步刷新会话时间
  await pool.query(
    'UPDATE ai_conversation SET update_time = CURRENT_TIMESTAMP WHERE id = ?',
    [conversationPk],
  )
}

// 会话类型：chat 是多轮对话，其余场景（drawer / interpret / skill / jd）是单轮分析
export type ConversationType = 'single' | 'multi'

export function getConversationType(scene: string): ConversationType {
  return scene === 'chat' ? 'multi' : 'single'
}

// 历史记录列表里的一行
export interface ConversationSummary {
  conversationId: string
  type: ConversationType
  scene: string
  /** 由用户第一句话生成的标题，未生成时为空串 */
  title: string
  updateTime: Date
  messageCount: number
  lastMessage: string
}

/** 查某个用户最近的会话列表（侧边栏「历史对话」用） */
export async function listConversations(userId: number, limit: number): Promise<ConversationSummary[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT c.conversation_id,
            c.scene,
            c.title,
            c.update_time,
            (SELECT COUNT(*) FROM ai_message m WHERE m.conversation_pk = c.id) AS message_count,
            (SELECT m.content FROM ai_message m
              WHERE m.conversation_pk = c.id
              ORDER BY m.seq DESC LIMIT 1) AS last_message
     FROM ai_conversation c
     WHERE c.user_id = ?
     ORDER BY c.update_time DESC
     LIMIT ?`,
    [userId, limit],
  )

  return rows.map((row) => ({
    conversationId: row.conversation_id as string,
    type: getConversationType(row.scene as string),
    scene: row.scene as string,
    title: (row.title as string) ?? '',
    updateTime: row.update_time as Date,
    messageCount: Number(row.message_count ?? 0),
    lastMessage: (row.last_message as string) ?? '',
  }))
}

// 单个会话的详情与全部消息
export interface ConversationDetail {
  conversationId: string
  type: ConversationType
  scene: string
  updateTime: Date
  messages: { role: string; content: string; createTime: Date }[]
}

/** 按会话 ID + 用户 ID 取完整消息；不存在或不属于该用户时返回 null */
export async function getConversation(conversationId: string, userId: number): Promise<ConversationDetail | null> {
  const [conversations] = await pool.query<RowDataPacket[]>(
    `SELECT id, conversation_id, scene, update_time
     FROM ai_conversation
     WHERE conversation_id = ? AND user_id = ?`,
    [conversationId, userId],
  )

  const conversation = conversations[0]
  if (!conversation) return null

  const [messages] = await pool.query<RowDataPacket[]>(
    `SELECT role, content, create_time
     FROM ai_message
     WHERE conversation_pk = ?
     ORDER BY seq`,
    [conversation.id as number],
  )

  return {
    conversationId: conversation.conversation_id as string,
    type: getConversationType(conversation.scene as string),
    scene: conversation.scene as string,
    updateTime: conversation.update_time as Date,
    messages: messages.map((message) => ({
      role: message.role as string,
      content: message.content as string,
      createTime: message.create_time as Date,
    })),
  }
}

/**
 * 批量删除会话及其全部消息（单个也是走这里）。
 * 先按 ID 集合 + 用户 ID 查出真正可删的会话，再在事务里删消息、删会话；
 * 不存在或不属于该用户的 ID 放进 missing 返回给调用方。
 */
export async function deleteConversations(
  conversationIds: string[],
  userId: number,
): Promise<{ deleted: number; missing: string[] }> {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    const [existing] = await connection.query<RowDataPacket[]>(
      `SELECT id, conversation_id
       FROM ai_conversation
       WHERE conversation_id IN (?) AND user_id = ?`,
      [conversationIds, userId],
    )

    const foundIds = existing.map((row) => Number(row.id))
    const foundConversationIds = existing.map((row) => row.conversation_id as string)
    const missing = conversationIds.filter((id) => !foundConversationIds.includes(id))

    if (foundIds.length) {
      await connection.query('DELETE FROM ai_message WHERE conversation_pk IN (?)', [foundIds])
      await connection.query('DELETE FROM ai_conversation WHERE id IN (?) AND user_id = ?', [foundIds, userId])
    }

    await connection.commit()
    return { deleted: foundIds.length, missing }
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}
