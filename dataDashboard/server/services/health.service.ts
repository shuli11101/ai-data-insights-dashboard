import pool from '../config/db'

// 连接数据库，成功则返回1
export const ping = async (): Promise<void> => {
    await pool.query('SELECT 1')
}
