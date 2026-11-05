<!-- 城市选择面板：热门城市 + 字母索引 + 按拼音首字母分组的城市列表 -->
<template>
  <div class="city-picker">
    <!-- 热门城市 -->
    <section class="city-picker__hot">
      <h3 class="city-picker__title">热门城市</h3>
      <div class="hot-list">
        <button v-for="city in HOT_CITIES" :key="city" type="button" class="hot-city"
          :class="{ 'is-active': city === activeCity }" @click="pick(city)">
          {{ city }}
        </button>
      </div>
    </section>

    <!-- 字母索引 -->
    <section class="city-picker__index">
      <span class="index-label">按字母选择</span>
      <button v-for="letter in LETTERS" :key="letter" type="button" class="index-letter"
        :class="{ 'is-disabled': !groupMap[letter] }" :disabled="!groupMap[letter]" @click="scrollToLetter(letter)">
        {{ letter }}
      </button>
    </section>

    <!-- 分组城市列表 -->
    <section ref="listRef" class="city-picker__list">
      <div v-for="group in groups" :key="group.letter" :ref="(el) => setGroupRef(group.letter, el)"
        class="city-group">
        <span class="city-group__letter">{{ group.letter }}</span>
        <div class="city-group__cities">
          <button v-for="city in visibleCities(group)" :key="city" type="button" class="group-city"
            :class="{ 'is-active': city === activeCity }" @click="pick(city)">
            {{ city }}
          </button>
          <button v-if="group.cities.length > CITY_LIMIT" type="button" class="group-more"
            @click="toggleExpand(group.letter)">
            {{ expanded[group.letter] ? '收起' : '更多' }}
          </button>
        </div>
      </div>

      <p v-if="!groups.length" class="city-picker__empty">城市数据加载中…</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'

import { useCityStore } from '@/stores/city'

/** 热门城市：与设计稿一致，「全国」表示不限制城市 */
const HOT_CITIES = [
  '全国', '北京', '上海', '广州', '深圳', '杭州', '天津', '西安', '苏州', '武汉',
  '厦门', '长沙', '成都', '郑州', '重庆', '佛山', '合肥', '济南', '青岛', '南京',
  '东莞', '昆明', '南昌', '石家庄', '宁波', '福州',
]

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

/** 每组默认展示的城市数量，超出后显示「更多」 */
const CITY_LIMIT = 10

/**
 * 拼音首字母边界字：与城市名做拼音排序比较，落在哪两个边界之间就属于哪个字母。
 * i / u / v 在拼音里不作声母，所以没有对应边界。
 */
const BOUNDARIES: [string, string][] = [
  ['A', '阿'], ['B', '八'], ['C', '擦'], ['D', '搭'], ['E', '鹅'], ['F', '发'],
  ['G', '噶'], ['H', '哈'], ['J', '击'], ['K', '喀'], ['L', '拉'], ['M', '妈'],
  ['N', '拿'], ['O', '哦'], ['P', '啪'], ['Q', '期'], ['R', '然'], ['S', '撒'],
  ['T', '塌'], ['W', '挖'], ['X', '昔'], ['Y', '压'], ['Z', '匝'],
]

/** 多音字城市纠正：ICU 的拼音排序会把它们读错，这里显式指定首字母 */
const POLYPHONIC: Record<string, string> = {
  长沙: 'C',
  长春: 'C',
  长治: 'C',
  朝阳: 'C',
  厦门: 'X',
  西安: 'X',
  六安: 'L',
  六盘水: 'L',
  蚌埠: 'B',
  亳州: 'B',
  台州: 'T',
  丽水: 'L',
  单县: 'S',
  铅山: 'Y',
}

const props = defineProps<{
  /** 当前选中的城市，空串表示全国 */
  current?: string
}>()

const emit = defineEmits<{
  /** 选中城市；选择「全国」时传空串 */
  select: [city: string]
}>()

const cityStore = useCityStore()

/** 面板内高亮用：空串按「全国」处理 */
const activeCity = computed(() => props.current || '全国')

/** 拼音排序器：zh-Hans-CN 的 pinyin 排序规则 */
const collator = new Intl.Collator('zh-Hans-CN-u-co-pinyin')

/** 取城市名首字母：先查多音字表，再用边界字比较 */
const initialOf = (city: string): string => {
  const override = POLYPHONIC[city]
  if (override) return override

  let letter = '#'
  for (const [code, boundary] of BOUNDARIES) {
    if (collator.compare(city, boundary) >= 0) letter = code
  }
  return letter
}

/** 按首字母分组并按拼音排序 */
const groups = computed(() => {
  const bucket = new Map<string, string[]>()

  for (const city of cityStore.list) {
    const letter = initialOf(city)
    const list = bucket.get(letter)
    if (list) list.push(city)
    else bucket.set(letter, [city])
  }

  return [...bucket.entries()]
    .filter(([, cities]) => cities.length)
    .map(([letter, cities]) => ({ letter, cities: cities.sort(collator.compare) }))
    .sort((a, b) => a.letter.localeCompare(b.letter))
})

/** 字母 → 是否存在城市，用于索引按钮的禁用态 */
const groupMap = computed(() => {
  const map: Record<string, boolean> = {}
  for (const group of groups.value) map[group.letter] = true
  return map
})

/** 已展开的分组 */
const expanded = reactive<Record<string, boolean>>({})

const visibleCities = (group: { letter: string, cities: string[] }) => {
  if (expanded[group.letter]) return group.cities
  return group.cities.slice(0, CITY_LIMIT)
}

const toggleExpand = (letter: string) => {
  expanded[letter] = !expanded[letter]
}

/** 字母索引点击后滚动到对应分组 */
const listRef = ref<HTMLElement | null>(null)
const groupRefs: Record<string, HTMLElement> = {}

const setGroupRef = (letter: string, el: unknown) => {
  if (el instanceof HTMLElement) groupRefs[letter] = el
}

const scrollToLetter = (letter: string) => {
  const target = groupRefs[letter]
  if (!target || !listRef.value) return
  listRef.value.scrollTop = target.offsetTop - listRef.value.offsetTop
}

/** 选择城市：全国转成空串 */
const pick = (city: string) => {
  emit('select', city === '全国' ? '' : city)
}
</script>

<style scoped lang="scss">
.city-picker {
  --jv-primary: #007c77;
  --jv-text: #3d4b54;
  --jv-muted: #65747c;
  --jv-faint: #8a979e;
  --jv-line: #edf2f2;

  display: flex;
  flex-direction: column;
  gap: 18px;
  font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  color: var(--jv-text);

  .city-picker__title {
    margin: 0 0 12px;
    font-size: 13px;
    font-weight: 600;
    color: #17252b;
  }
}

// ---------- 热门城市 ----------
.hot-list {
  display: grid;
  grid-template-columns: repeat(10, minmax(0, 1fr));
  gap: 8px;

  .hot-city {
    height: 30px;
    padding: 0 6px;
    font-family: inherit;
    font-size: 12px;
    color: #3d4b54;
    cursor: pointer;
    background: #f5f7f7;
    border: 1px solid transparent;
    border-radius: 6px;
    transition:
      color 0.16s ease,
      background 0.16s ease,
      border-color 0.16s ease;

    &:hover {
      color: var(--jv-primary);
      background: #eef8f6;
    }

    &.is-active {
      color: var(--jv-primary);
      background: #e8f7f4;
      border-color: #b9dad5;
    }
  }

  @media (max-width: 1023.98px) {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
}

// ---------- 字母索引 ----------
.city-picker__index {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--jv-line);

  .index-label {
    margin-right: 8px;
    font-size: 12px;
    color: var(--jv-muted);
  }

  .index-letter {
    width: 22px;
    height: 22px;
    font-family: inherit;
    font-size: 12px;
    color: var(--jv-faint);
    cursor: pointer;
    background: transparent;
    border: 0;
    border-radius: 4px;
    transition:
      color 0.16s ease,
      background 0.16s ease;

    &:hover {
      color: var(--jv-primary);
      background: #eef8f6;
    }

    &.is-disabled {
      color: #d5dedd;
      cursor: default;

      &:hover {
        background: transparent;
      }
    }
  }
}

// ---------- 城市分组 ----------
.city-picker__list {
  position: relative;
  max-height: 320px;
  overflow-y: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.city-group {
  display: flex;
  gap: 16px;
  padding: 6px 0;

  // 左侧大字母，选中态用主色竖条强调
  .city-group__letter {
    flex: 0 0 26px;
    padding-top: 2px;
    font-size: 18px;
    font-weight: 700;
    color: #9aa7ab;
    border-left: 2px solid #e4ecea;
    padding-left: 8px;
  }

  .city-group__cities {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 14px;
    min-width: 0;
  }

  .group-city {
    padding: 2px 0;
    font-family: inherit;
    font-size: 12.5px;
    color: #3d4b54;
    cursor: pointer;
    background: transparent;
    border: 0;
    transition: color 0.16s ease;

    &:hover,
    &.is-active {
      color: var(--jv-primary);
    }

    &.is-active {
      font-weight: 600;
    }
  }

  .group-more {
    padding: 2px 0;
    font-family: inherit;
    font-size: 12px;
    color: #a2adaf;
    cursor: pointer;
    background: transparent;
    border: 0;

    &:hover {
      color: var(--jv-primary);
    }
  }
}

.city-picker__empty {
  margin: 12px 0 0;
  font-size: 12px;
  color: var(--jv-faint);
}
</style>
