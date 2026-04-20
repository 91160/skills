# 性能规范

> 适用于所有前端项目。标签：`(all)` 所有项目 | `(vue)` Vue 项目 | `(react)` React 项目

---

## 1. 大图片必须使用 CDN

**(all)** 小图片（<10KB 图标/按钮）可本地存储，大图片（Banner/背景图）必须上传 CDN 图床，避免增加打包体积。

```vue
<!-- ❌ — 大图片本地引用，增加 bundle 体积 -->
<img src="@/assets/images/banner-large.png" />

<!-- ✅ — 大图片使用 CDN -->
<img src="https://cdn.example.com/img/banner.png" />

<!-- ✅ — 小图片可本地存储 -->
<img src="@/assets/images/icon-arrow.png" />
```

**检查点**: `src/assets/` 中是否存在超过 10KB 的图片文件。

---

## 2. 定时器和事件监听必须清理

**(all)** 组件卸载时必须清理 `setInterval`、`setTimeout`、`addEventListener`，避免内存泄漏。

```typescript
// ❌ — 未清理
const startPolling = () => {
  setInterval(() => fetchStatus(), 5000)
}

// ✅ — Vue: onUnmounted 清理
const timer = setInterval(() => fetchStatus(), 5000)
onUnmounted(() => clearInterval(timer))

// ✅ — React: useEffect 返回清理函数
useEffect(() => {
  const timer = setInterval(() => fetchStatus(), 5000)
  return () => clearInterval(timer)
}, [])

// ✅ — watchEffect 自动清理
watchEffect((onCleanup) => {
  const timer = setInterval(() => fetchStatus(), 5000)
  onCleanup(() => clearInterval(timer))
})
```

事件监听同理：`onMounted` 添加 / `onUnmounted` 移除，或 `useEffect` 返回清理函数。

**检查点**: 搜索 `setInterval`、`setTimeout`、`addEventListener`，确认都有对应清理逻辑。

---

## 3. 优先复用已有工具函数

**(all)** 优化代码时优先使用项目中已封装的工具函数（防抖、节流、格式化、安全等待等），不重复实现。

```typescript
// ❌ — 重复实现 debounce
const debounce = (fn, delay) => {
  let timer
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay) }
}

// ✅ — 使用项目已有工具
import { debounce } from '@/utils/util'
```

**优化前提**：理解原代码逻辑 → 测试验证功能 → 确认工具方法适用。

**检查点**: 新增的工具函数是否与 `utils/` 目录已有功能重复。

---

## 4. 避免不必要的响应式

**(vue)** 不需要响应式的数据使用 `shallowRef`、`markRaw` 或普通变量，减少响应式开销。

```typescript
// ❌ — 大型对象不需要深层响应式
const tableData = ref<Row[]>([])  // 1000 行数据的深层代理

// ✅ — 使用 shallowRef 或 markRaw
const tableData = shallowRef<Row[]>([])
const staticConfig = markRaw({ columns: [...], options: {...} })
```

**检查点**: `ref` 包裹的大型列表/配置对象是否需要深层响应式。

---

## 5. 列表渲染使用唯一 key

**(all)** 列表渲染的 `key` 必须使用稳定唯一标识（如 `id`），禁止使用 `index`。

```vue
<!-- ❌ — 使用 index 作为 key -->
<div v-for="(item, index) in list" :key="index">

<!-- ✅ — 使用唯一标识 -->
<div v-for="item in list" :key="item.id">
```

React 同理：`list.map((item) => <Item key={item.id} />)`。

**检查点**: 搜索 `:key="index"` 或 `key={index}`，确认列表是否可能增删重排。

---

## 6. 懒加载重型模块

**(all)** 路由和大型组件必须使用动态导入，减少首屏加载体积。

```typescript
// ❌ — 同步导入
import OrderDetail from '@/views/order/Detail'

// ✅ — 路由懒加载
const OrderDetail = () => import('@/views/order/Detail')

// ✅ — 组件懒加载 (Vue)
const HeavyChart = defineAsyncComponent(() => import('@/components/Chart'))

// ✅ — 组件懒加载 (React)
const HeavyChart = React.lazy(() => import('./Chart'))
```

**检查点**: 路由配置和大型组件是否使用动态导入。
