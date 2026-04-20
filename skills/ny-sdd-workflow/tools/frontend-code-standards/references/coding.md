# 通用编码规则

> 所有规则适用于新增代码。历史代码为保持稳定性可不做改动。
> 标签说明：`(all)` 所有前端项目 | `(vue)` Vue 项目 | `(react)` React 项目

---

## 1. 严格相等判断

**(all)** 新增代码使用 `===` / `!==`，禁止 `==` / `!=`。

```typescript
// ❌
if (code == 200) {
}
if (status != "success") {
}

// ✅
if (code === 200) {
}
if (status !== "success") {
}
```

**检查点**: ESLint `eqeqeq` 规则，或搜索 `[^!=]==[^=]`。

---

## 2. 页面跳转后立即返回

**(all)** 执行路由/页面跳转后必须立即 `return`，避免后续代码继续执行。

```typescript
// ❌
router.push("/login");
clearUserData(); // 仍会执行

// ✅
router.push("/login");
return;
```

Vue 中 `router.push()` / `router.replace()` 后同理，React 中 `navigate()` / `history.push()` 后同理。

**检查点**: 搜索所有跳转调用，检查下一行是否为 `return`。

---

## 3. 禁止调试日志

**(all)** 生产代码禁止 `console.log` / `console.warn` 调试语句。使用项目日志工具替代。

```typescript
// ❌ — 无标识的裸调试日志
console.log("数据处理结果:", result);
console.warn("接口返回异常:", error);

// ✅ — 使用项目日志工具
collectESLog({ entryType: "data-process", result });
```

**豁免规则**：带特殊标识前缀的 `console` 语句**不视为违规**。此类日志用于开发调试，构建生产包时会被自动移除（terser），不会进入线上环境。

```typescript
// ✅ — 以下格式均豁免，审查时不应标记
console.log("[模块名] 描述:", data); // 方括号模块前缀，如 [NPS]、[useVipPayment]
console.log("🌍_变量名_🧑‍💻", value); // emoji 标识
console.warn("[模块名] 警告信息:", error); // 方括号前缀 + console.warn
```

判断标准：`console` 内容包含明确的模块/作者标识前缀（方括号 `[xxx]` 或 emoji 等自定义标识），而非裸调试输出。

**检查点**: 搜索 `console.log`、`console.warn`，跳过带标识前缀的语句，仅标记无标识的裸调试日志。

---

## 4. 废弃代码必须删除

**(all)** 不保留注释掉的代码块。删除或恢复使用，不留灰色地带。

```typescript
// ❌ — 注释代码堆积
// const oldMethod = () => { ... }
// const deprecated = true
const newMethod = () => {};

// ✅ — 只保留有效代码
const newMethod = () => {};
```

**检查点**: 搜索连续多行 `//` 注释块，确认是否为废弃代码。

---

## 5. 空函数必须有 TODO

**(all)** 空函数体必须添加 `TODO` 注释说明未实现的原因。

```typescript
// ❌
const handleResize = () => {};

// ✅
const handleResize = () => {
  // TODO: 等后端接口上线后实现窗口尺寸自适应
};
```

**检查点**: 搜索函数体为空或仅含注释的函数。

---

## 6. 回调函数类型校验

**(all)** 回调函数执行前校验类型，无需兼容 `null`。

```typescript
// ❌ — 不必要的 null 兼容
if (cb && typeof cb === "function") {
  cb(data);
}

// ❌ — 不校验直接调用
cb(data);

// ✅ — 仅校验类型
if (typeof cb !== "function") return;
cb(data);
```

**检查点**: 搜索 `typeof.*function`，确认校验方式正确。

---

## 7. 数据处理逻辑封装在方法内部

**(all)** 数据处理应封装在方法内部，调用方传递原始数据。模板中避免复杂表达式。

```typescript
// ❌ — 调用前处理数据
const trimmed = rawData.name.trim()
processUser(trimmed)

// ❌ — 模板中处理数据
<div>{{ userData.name.trim() }}</div>

// ✅ — 封装在方法内
const processUser = (raw: UserData) => {
  const trimmed = raw.name.trim()
  saveUser({ name: trimmed })
}
processUser(rawData)

// ✅ — 或使用 computed
const displayName = computed(() => userData.value.name.trim())
```

**检查点**: 模板中是否存在链式调用或多步处理表达式。

---

## 8. 公共工具方法必须有 JSDoc 和参数校验

**(all)** 提取为公共工具的函数必须提供 JSDoc 文档和参数类型校验。

```typescript
// ❌
const formatDate = (date, pattern) => dayjs(date).format(pattern);

// ✅
/**
 * 格式化日期
 * @param {string|Date} date - 日期对象或日期字符串
 * @param {string} pattern - 日期格式，默认 'YYYY-MM-DD'
 * @returns {string} 格式化后的日期字符串
 */
const formatDate = (date: string | Date, pattern = "YYYY-MM-DD"): string => {
  if (!date || (!isValidDate(date) && typeof date !== "string")) {
    throw new Error("Invalid date parameter");
  }
  return dayjs(date).format(pattern);
};
```

**检查点**: `utils/` 目录下的导出函数是否都有 JSDoc。

---

## 9. 跨模块常量抽取

**(all)** 被两个及以上模块使用的常量必须抽取到常量文件统一管理。

```typescript
// ❌ — 多个文件重复定义
// src/views/vip/index.ts
const PAY_METHOD_WECHAT = 1;
// src/views/order/index.ts
const PAY_METHOD_WECHAT = 1;

// ✅ — 统一管理
// src/constants/payment.ts
export const PayMethod = { WECHAT: 1, ALIPAY: 2 } as const;
export type PayMethod = (typeof PayMethod)[keyof typeof PayMethod];

// 使用处
import { PayMethod } from "@/constants/payment";
```

**检查点**: 搜索重复的常量定义（相同命名、相同值）。

---

## 10. 数组/对象类型校验

**(all)** 调用数组或对象方法前必须校验类型，避免运行时错误。

```typescript
// ❌ — 未校验直接调用
const first = list[0];
list.forEach((item) => {});
Object.keys(data);

// ✅ — 可选链
const first = list?.[0];

// ✅ — 类型守卫
if (Array.isArray(list)) {
  list.forEach((item) => {});
}

// ✅ — 默认值
const items = data?.list ?? [];
```

**检查点**: 搜索 `.forEach`、`.map`、`.filter`、`Object.keys`，确认调用前有校验。

---

## 11. 异步异常处理

**(all)** 所有 `await` 调用必须有异常处理，禁止裸 `await`。

```typescript
// ❌ — 未处理异常
const result = await api.getData();

// ❌ — 仅打印日志
try {
  const result = await api.getData();
} catch (error) {
  console.log(error);
}

// ✅ — 使用项目封装的 safeAwait（推荐）
const [error, result] = await safeAwait(api.getData());
if (error) {
  collectESLog({ entryType: "api-error", error });
  return null;
}
return result.data;

// ✅ — 标准 try/catch
try {
  const result = await api.getData();
  return result.data;
} catch (error) {
  collectESLog({ entryType: "api-error", error });
  return null;
}
```

**检查点**: 搜索所有 `await`，确认都有异常处理。

---

## 12. v-for 使用规范

**(vue)** 仅在数据数量动态变化时使用 `v-for`，固定且少量数据直接展开。

```vue
<!-- ❌ — 固定 3 个选项，过度设计 -->
<div v-for="item in fixedOptions" :key="item.label">{{ item.label }}</div>

<!-- ✅ — 固定数据直接展开 -->
<div>选项1</div>
<div>选项2</div>
<div>选项3</div>
```

**检查点**: `v-for` 遍历的数据源是否为硬编码的固定数组。

---

## 13. 样式作用域

**(all)** 使用通用类名（如 `.container`、`.title`、`.content`）时必须加 `scoped`。使用 BEM 等唯一命名空间时可省略。

```vue
<!-- ❌ — 通用类名不加 scoped，可能污染全局 -->
<style>
.container {
  padding: 20px;
}
.title {
  font-size: 18px;
}
</style>

<!-- ✅ — 方案 1: 通用类名加 scoped -->
<style scoped>
.container {
  padding: 20px;
}
</style>

<!-- ✅ — 方案 2: BEM 命名确保唯一，可省略 scoped -->
<style>
.user-avatar__image {
  border-radius: 50%;
}
</style>
```

**检查点**: 非 scoped 的 `<style>` 块中是否使用了通用类名。

---

## 14. 禁止未使用的导入

**(all)** 导入的模块、类型、组件必须在文件中有实际引用。重构迁移代码后必须同步清理残留导入。

```typescript
// ❌ — 导入后未使用
import { debounce, exposeFunc } from "@/utils/util";
import type { SplicedImageItem } from "../types";
import { Toast } from "vant";

// ❌ — 重构后残留（功能已迁移到其他文件）
import { exchangeVip } from "@/requests/api/vip";

// ✅ — 只导入实际使用的符号
import { Toast } from "vant";
```

常见残留场景：

- 函数/逻辑迁移到其他 composable 后，原文件的 import 未同步删除
- Vant 组件已自动注册，无需显式 import
- Composable（`.ts`）文件中误导入了 UI 组件（如 `Swipe`、`SwipeItem`）
- `import type` 的类型在重构后不再被引用

**检查点**: 逐文件检查 `import` 语句，确认每个导入符号在文件后续代码中被引用。

---

## 15. 禁止未使用的变量和函数

**(all)** 声明的变量、函数必须在作用域内有实际引用。未调用且未返回的函数视为死代码，必须删除。

```typescript
// ❌ — 函数声明后从未调用、未返回
function getLevelName(levelId: number): string {
  const item = introList.value.find((i) => i.parentId === levelId);
  return item?.comboName || "";
}

// ❌ — 从 Hook 解构后未使用
const { memberInfo, introList, currentIndex } = useVipData();
// introList 在模板和脚本中均无引用

// ❌ — 死代码链：A 仅被 B 调用，B 也未使用
function compareLevel(a: number, b: number) {
  /* ... */
}
function hasLevelOrHigher(target: number) {
  return compareLevel(currentLevel, target) >= 0; // 唯一调用者
}

// ✅ — 删除死代码，保持函数职责清晰
// compareLevel、hasLevelOrHigher、getLevelName 全部删除
```

注意：Composable 中 `return` 出去的变量，即使当前消费者未解构，不视为"未使用"（可能被其他消费者或后续迭代使用）。仅清理声明后从未被任何代码路径引用的情况。

**检查点**: 搜索函数声明，确认每个函数被调用或返回；检查 Hook 解构赋值，确认每个变量在模板或脚本中被引用。
