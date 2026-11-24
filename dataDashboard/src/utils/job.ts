/** 岗位薪资字段：面议时后端返回 salary_desc = '面议' 且 salary_min / salary_max 为 null */
export interface SalaryFields {
  salary_desc?: string | null
  salary_min?: number | null
  salary_max?: number | null
}

/**
 * 薪资展示文案
 * 优先使用后端返回的 salary_desc（如「17-22K」「面议」），
 * 缺失时回退到 salary_min–salary_max，两者都拿不到则显示「面议」
 */
export const formatSalary = (salary: SalaryFields): string => {
  const desc = salary.salary_desc?.trim()
  if (desc) return desc

  const { salary_min: min, salary_max: max } = salary
  if (min == null || max == null) return '面议'
  return `${min}–${max}K`
}
