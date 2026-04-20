# TypeScript 专项规则

> 以下规则仅在检测到 `tsconfig.json` 时加载。

---

## 1. ref 必须明确泛型类型

**(ts)** `ref` / `reactive` 必须指定泛型参数，禁止依赖类型推断。

```typescript
// ❌
const list = ref([])
const user = ref(null)
const formData = reactive({})

// ✅
const list = ref<ItemType[]>([])
const user = ref<UserInfo | null>(null)
const formData = reactive<FormData>({ name: '', age: 0 })
```

**检查点**: 搜索 `ref<` 和 `reactive<`，确认无 `ref()` 无泛型的空初始化。

---

## 2. Props 使用 TypeScript 接口

**(ts)** 组件 Props 优先使用 TypeScript 接口定义，避免运行时声明。

```typescript
// ❌ — 运行时声明
const props = defineProps({
  payMsg: { type: Object, default: () => ({}) }
})

// ✅ — TypeScript 接口
interface Props {
  payMsg: PayMessage
  visible?: boolean
}
const props = defineProps<Props>()
```

React 同理：优先 `interface Props {}` 而非 `PropTypes`。

**检查点**: 搜索 `defineProps` / `interface Props`，确认使用类型接口方式。

---

## 3. API 响应使用已定义类型

**(ts)** API 返回值必须使用已定义的类型，禁止 `any`。

```typescript
// ❌
getUserInfo().then(({ code, data }: any) => {})

// ✅
import type { UserInfoResponse } from './type'
getUserInfo().then((result: UserInfoResponse) => {
  const { code, data } = result
})
```

**检查点**: 搜索 `.then(` 后的参数类型，确认无 `: any`。

---

## 4. 避免 any

**(ts)** 新增代码尽量避免 `any`，使用具体类型或 `unknown`。

```typescript
// ❌
const data: any = res.data
function process(item: any) {}

// ✅ — 定义具体类型
const data: UserInfo = res.data
function process(item: OrderItem) {}

// ✅ — 类型未知时使用 unknown（强制类型守卫）
const data: unknown = res.data
if (typeof data === 'object' && data !== null) {
  const userInfo = data as UserInfo
  return userInfo.name
}
```

**检查点**: 搜索 `: any` 和 `as any`，确认是否有更具体的类型可用。

---

## 5. 可选参数标记

**(ts)** 可选参数必须使用 `?` 标记。

```typescript
// ✅
interface Props {
  requiredField: string
  optionalField?: string  // 明确可选
  callback?: () => void   // 明确可选
}
```

**检查点**: 接口定义中，非必填字段是否有 `?` 标记。

---

## 6. 索引访问类型安全

**(ts)** 动态键访问对象时，先转换类型再访问。

```typescript
// ❌ — 直接用变量作为键
const key = item.pay_method
if (PAY_MESSAGE.hasOwnProperty(key)) {
  PAY_MESSAGE[key].imgUrl
}

// ✅ — 先转换类型
const key = Number(item.pay_method) as keyof typeof PAY_MESSAGE
if (key in PAY_MESSAGE) {
  PAY_MESSAGE[key].imgUrl
}
```

**检查点**: 搜索 `hasOwnProperty` 或动态键访问，确认类型安全。
