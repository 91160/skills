# CSV 测试用例导出规范

本文件定义 `test-case-design` Skill 在 Step 6（组装）并行生成的 `testcases.csv` 文件格式。供 QA 工程师和测试管理工具（TestRail / Zephyr / Xray / 禅道 / 飞书多维表格）导入使用。

**设计目标**：面向 QA 人工管理，不是面向 AI 执行。TC-xx.md 是 AI 可执行视图，testcases.csv 是 QA 人工视图，两者从同一批用例蓝本派生。

---

## 双模板并存

从 v1.2 起，本 Skill 支持**两种 CSV 模板并存**，通过 `csv_template` 参数选择：

| 模板 | 列数 | 定位 | 目标用户 | 文件名 |
|---|---|---|---|---|
| **`detailed`** | 12 | 技术追溯，含 Channel / Skeleton_File / Related_REQ | 开发 + AI 消费 + 现代测试平台（TestRail/Zephyr/Xray） | `testcases.detailed.csv` |
| **`traditional`** | 7 | 传统 QA 风格，纯业务信息 | QA 团队 + Excel 模板 + 禅道 / 飞书多维表格 / 老派测试平台 | `testcases.traditional.csv` |

**`csv_template` 参数取值**：

| 值 | 行为 |
|---|---|
| `detailed`（默认） | 只产出 12 列详细版 → `testcases.detailed.csv` |
| `traditional` | 只产出 7 列传统版 → `testcases.detailed.csv` |
| `both` | 同时产出两份 → `testcases.detailed.csv`（detailed）+ `testcases.traditional.csv` |

**`csv_headers_lang` 与模板的交互**：

| 用户传入 | detailed 默认表头 | traditional 默认表头 |
|---|---|---|
| （未传） | 英文（`TC_ID` / `Priority` / ...） | **中文**（`编号ID` / `用例等级` / ...） |
| `csv_headers_lang: zh` | 中文 | 中文 |
| `csv_headers_lang: en` | 英文 | 英文 |

**设计理由**：
- detailed 默认英文：与 Jest/JUnit/pytest 等测试生态一致，兼容现有用户
- traditional 默认中文：符合 QA 团队习惯，禅道/飞书/Excel 模板友好
- 显式传参可以强制统一两个模板的语言

---

## 一、detailed 模板（12 列详细版）

- **文件名**：`testcases.detailed.csv`（与 TC-xx.md 同目录并列）
- **编码**：UTF-8 with BOM（中文 Excel 直接打开不乱码）
- **分隔符**：英文逗号 `,`
- **引用符**：英文双引号 `"`
- **行结束**：`\r\n`（Windows 标准，Excel/测试平台兼容最佳）
- **表头**：第一行为列名，默认英文 snake_case
- **列数**：12 列（精简版）
- **规范依据**：RFC 4180

---

## 二、detailed 模板的 12 列 Schema（完整字段定义）

| # | 列名 | 必填 | 类型 | 最大长度 | 示例 | 说明 |
|---|---|---|---|---|---|---|
| 1 | `TC_ID` | ✅ | string | 32 | `TC-F-login-001` | 唯一标识，格式 `TC-F-{module_id}-{seq:03}` |
| 2 | `Module` | ✅ | string | 64 | `01-登录` | 模块标识，SDD 从 index.md 读，独立模式由调用方传入 |
| 3 | `Title` | ✅ | string | 200 | `正常登录 - 返回 token` | 一句话用例名 |
| 4 | `Priority` | ✅ | enum | 2 | `P0` / `P1` / `P2` | 优先级 |
| 5 | `Type` | ✅ | enum | 16 | `业务流程测试` / `UI交互测试` / `视觉回归测试` / `异常边界测试` | 4 章分类 |
| 6 | `Channel` | ✅ | enum | 12 | `manual` / `ui-dom` / `ui-visual` | 功能测试层通道（3 个） |
| 7 | `Preconditions` | ⬜ | string | 500 | `数据库有 zhangsan 用户; 清空 session` | 前置条件 |
| 8 | `Test_Steps` | ✅ | string | 1000 | `1) 发送 POST 请求 ; 2) 传入合法凭据 ; 3) 检查响应` | 测试步骤，方案 C 编号+分号格式 |
| 9 | `Expected_Result` | ✅ | string | 500 | `1) HTTP 200 ; 2) 返回 token ; 3) 跳转首页` | 预期结果，同步骤格式 |
| 10 | `Related_REQ` | ✅ | string | 200 | `REQ §2.1` | REQ 追溯（多个用 `;` 分隔） |
| 11 | `Skeleton_File` | ⬜ | string | 64 | `TC-F-login-001.jest.ts` | 派生的单测文件名（由 `unit-test-generator` Skill 消费 TC 文档后产出；若未调用 unit-test-generator 则留空） |
| 12 | `Generated_Date` | ✅ | date | 10 | `2026-04-14` | 生成日期 `YYYY-MM-DD` |

### 从 18 列砍掉的 6 列（降级或推断）

| 砍掉列 | 原因 | 替代方案 |
|---|---|---|
| `Exec_Mode` | 可从 `Channel` 推断（ui-visual/manual → manual，其他 → auto） | 工具侧推断 |
| `Methodology` | QA 工具基本不用，TC 文档头部覆盖率矩阵已记录 | 看 TC 文档 |
| `Test_Data` | 合并到 `Test_Steps` 的具体步骤描述中 | 合并 |
| `Related_DES` | `Related_REQ` 已提供追溯起点，DES 可从 REQ 关联找到 | 省略 |
| `Tags` | 标签是团队自定义，通用 Schema 不强制 | 可选扩展 |
| `Author` | 固定值（`test-case-design Skill v1`），无需每行重复 | CSV 末尾元信息行（可选） |

---

## 三、编码和转义规则

### UTF-8 with BOM

文件第一个字节必须是 BOM 序列 `EF BB BF`。这是中文 Excel 直接打开 CSV 不乱码的关键。

**生成方式**：写文件时前缀三个字节 `\xEF\xBB\xBF`，然后紧跟 CSV 内容。

### RFC 4180 字段引用规则

| 字段情况 | 处理 |
|---|---|
| 字段不含 `,` / `"` / `\n` / `\r` | 裸字符串，无需引用 |
| 字段含 `,` | 必须用双引号包裹 |
| 字段含 `"` | 必须用双引号包裹，内部 `"` 转义为 `""` |
| 字段含换行 | 必须用双引号包裹 |
| 字段两端有空格 | 必须用双引号包裹（保留空格） |

### 示例

| 原始内容 | CSV 格式 |
|---|---|
| `TC-F-login-001` | `TC-F-login-001`（无需引用） |
| `正常登录 - 返回 token` | `正常登录 - 返回 token`（中文无需引用） |
| `用户"管理员"登录` | `"用户""管理员""登录"`（含双引号） |
| `1) 步骤 A, 2) 步骤 B` | `"1) 步骤 A, 2) 步骤 B"`（含逗号） |
| `line1\nline2` | `"line1\nline2"`（含换行） |

---

## 四、多行字段处理（方案 C：编号+分号）

`Test_Steps` / `Expected_Result` / `Preconditions` 三个字段经常多行。**统一使用方案 C 格式**：

### 格式规则

```
{序号}) {内容} ; {序号}) {内容} ; {序号}) {内容}
```

- 序号用 `1)` `2)` `3)` 风格（括号圆括号）
- 分隔符：空格 + 分号 + 空格 (` ; `)
- 不换行，所有步骤在一行
- 序号不可省略
- 序号之间空格必须保留

### 示例

**原始测试步骤**：
```
1. 打开登录页
2. 在用户名输入框输入 zhangsan
3. 在密码输入框输入 test123
4. 点击"登录"按钮
5. 等待页面跳转
```

**CSV 单元格**：
```
1) 打开登录页 ; 2) 在用户名输入框输入 zhangsan ; 3) 在密码输入框输入 test123 ; 4) 点击"登录"按钮 ; 5) 等待页面跳转
```

**原始预期结果**：
```
1. HTTP 200
2. 响应体 code=0
3. data.token 存在
4. 跳转到首页
```

**CSV 单元格**：
```
1) HTTP 200 ; 2) 响应体 code=0 ; 3) data.token 存在 ; 4) 跳转到首页
```

### 为什么不用换行符

- 部分老测试管理工具（禅道早期版本）对 CSV 内换行符支持不好
- Excel 打开 CSV 时多行单元格显示效果因版本而异
- 方案 C 的 `1) ; 2) ; 3)` 在任何工具中都能正确显示
- QA 工程师一眼就能看出步骤层次

### 极端情况

| 场景 | 处理 |
|---|---|
| 只有 1 步 | `1) 步骤内容`（仍然加编号） |
| 步骤本身含 `;` | 先对内容转义：内部 `;` → `；`（中文分号） |
| 步骤本身含 `)` | 保留，序号的 `)` 已在开头足够区分 |
| 步骤超过 9 条 | `10)` `11)` ...（序号可 ≥2 位） |
| Preconditions 为空 | 字段留空 |

---

## 五、表头多语言切换

默认英文 snake_case。Skill 接受可选参数 `csv_headers_lang`：

| 值 | 表头示例 |
|---|---|
| `en`（默认） | `TC_ID,Module,Title,Priority,Type,Channel,Preconditions,Test_Steps,Expected_Result,Related_REQ,Skeleton_File,Generated_Date` |
| `zh` | `用例编号,模块,标题,优先级,类型,通道,前置条件,测试步骤,预期结果,关联需求,单测文件,生成日期` |

**参数在 SKILL.md 输入契约追加**：`csv_headers_lang`（可选，枚举 `en` / `zh`，默认 `en`）

---

## 六、完整 CSV 示例

以下是一个 3 条用例的完整 CSV 文件（英文表头）：

```csv
TC_ID,Module,Title,Priority,Type,Channel,Preconditions,Test_Steps,Expected_Result,Related_REQ,Skeleton_File,Generated_Date
TC-F-login-001,01-登录,正常登录流程,P0,业务流程测试,manual,数据库有 zhangsan 用户,1) 打开登录页 ; 2) 输入用户名 zhangsan 和密码 ; 3) 点击登录按钮 ; 4) 等待跳转,1) 跳转到首页 ; 2) 显示用户名 zhangsan ; 3) 页面无报错,REQ §2.1,,2026-04-17
TC-F-login-002,01-登录,登录页表单提交,P1,UI交互测试,ui-dom,登录页正常加载,1) 点击用户名输入框 ; 2) 输入文本 ; 3) Tab 切换到密码框 ; 4) 点击登录按钮,1) 输入框获焦高亮 ; 2) Tab 切换正常 ; 3) 按钮响应点击,REQ §2.1,,2026-04-17
TC-F-login-003,01-登录,密码错误提示,P0,异常边界测试,manual,数据库有 zhangsan 用户,1) 输入正确用户名和错误密码 ; 2) 点击登录,1) 提示"用户名或密码错误" ; 2) 不跳转 ; 3) 密码框清空,REQ §2.2,,2026-04-17
```

注意第三条用例的 `Preconditions` 含有 `=` 但不含 `,`，理论上不需要双引号，但 `"users[username=zhangsan].status='locked'"` 这里有单引号嵌套，安全起见加了引号。

---

## 七、主流测试平台导入指南

### TestRail

1. 打开 TestRail → Test Cases → Import → CSV
2. 上传 `testcases.detailed.csv`
3. 字段映射：
   - `TC_ID` → External ID
   - `Title` → Title
   - `Priority` → Priority（需先建立 P0/P1/P2 对应的 TestRail 优先级）
   - `Type` → Type（功能/接口/... 对应 TestRail 的 Functional/API/...）
   - `Preconditions` → Preconditions
   - `Test_Steps` → Steps（TestRail 会识别 `1)` `2)` 风格为有序步骤）
   - `Expected_Result` → Expected Result
   - `Related_REQ` → References

### Zephyr Scale (Jira 插件)

1. Jira → Zephyr Scale → Test Cases → Import
2. 选择 CSV，上传文件
3. 字段映射：
   - `TC_ID` → Key
   - `Title` → Name
   - `Priority` → Priority
   - `Preconditions` → Precondition
   - `Test_Steps` → Test Script（Zephyr 支持 Plain Text 模式解析编号步骤）
   - `Related_REQ` → Issue Links（需要额外映射到 Jira issue key）

### Xray (Jira 插件)

1. Xray → Import Test Cases from CSV
2. 上传 CSV
3. 字段映射：
   - `TC_ID` → Test Key 或 Summary
   - `Title` → Summary
   - `Test_Steps` → Action（需要额外用"Cucumber / BDD"格式或 Plain Text）
   - `Expected_Result` → Expected Result
   - `Priority` → Priority

**注意**：Xray 对多步骤用例倾向于每步一行 CSV。本 Schema 的方案 C 编号+分号格式需要在 Xray 中用 "Plain Text" 模式导入，每条用例一行。

### 禅道 (ZenTao)

1. 测试 → 用例 → 导入
2. 上传 CSV
3. 字段映射：
   - `TC_ID` → 编号
   - `Title` → 用例标题
   - `Priority` → 优先级（P0/P1/P2 对应禅道 1/2/3）
   - `Type` → 用例类型（功能/接口/性能...）
   - `Preconditions` → 前置条件
   - `Test_Steps` → 步骤
   - `Expected_Result` → 预期

**禅道 CSV 导入支持中文表头**，Skill 调用时传 `csv_headers_lang: zh` 更友好。

### 飞书多维表格（Bitable）

1. 飞书多维表格 → 新建表 → 导入 CSV
2. 选择上传文件
3. 自动识别字段
4. 可以设置 `Priority` / `Type` / `Channel` 为"单选"字段类型，便于筛选
5. 可以按 `Module` 分组查看

**飞书多维表格对中文字段名友好**，建议用 `csv_headers_lang: zh`。

### Excel 直接打开

1. 双击 `.csv` 文件
2. UTF-8 BOM 保证中文正常显示
3. 自动识别为表格
4. 可以用"数据 → 筛选"功能按 Module / Priority / Channel 筛选
5. 可以用"开发工具 → VBA"自定义处理步骤单元格

---

## 八、与 TC 文档的关系

### 并行输出，不是派生

CSV 不是从 TC-xx.md 反解析生成的。两个文件都是从 Skill 的 **Step 3 用例蓝本对象列表** 并行投影而来：

```
Step 3 输出: 用例蓝本列表（对象数组）
  ↓
Step 4 (tc-exec 编写) - 丰富蓝本对象
  ↓
Step 5 (自审) - 校验蓝本对象
  ↓
Step 6 (单测派生) - 回填 skeleton_file 字段
  ↓
Step 7 (组装):
  ├─ 组装 TC-xx.md (按 tc-doc-template.md 的 9 步骨架)
  └─ 组装 testcases.csv (按本文件的 12 列 Schema 从蓝本投影)
```

**关键**：CSV 生成不依赖 Markdown 解析，不会因为 Markdown 结构变化而破坏。两边从源头对齐。

### 字段映射表（蓝本对象 → CSV 列）

| CSV 列 | 蓝本对象字段 | 转换 |
|---|---|---|
| TC_ID | `id` | 直接复制 |
| Module | `module` | 直接复制 |
| Title | `title` | 直接复制 |
| Priority | `priority` | 直接复制 |
| Type | `chapter` | 章节名映射：`ch1→业务流程测试`、`ch2→UI交互测试`、`ch3→视觉回归测试`、`ch4→异常边界测试` |
| Channel | `channel` | 直接复制 |
| Preconditions | `preconditions[]` | 数组 → 方案 C 格式 |
| Test_Steps | `steps[]` | 数组 → 方案 C 格式 |
| Expected_Result | `expectations[]` | 断言 bullet → 方案 C 格式 |
| Related_REQ | `req_ref` / `req_refs[]` | 字符串或数组 → `;` 分隔 |
| Skeleton_File | `skeleton_file` | Step 6 回填，可能为空 |
| Generated_Date | 当前日期 | Skill 生成时填入 |

---

## 九、是否生成 CSV 的开关

Skill 接受 `output_format` 参数控制：

| 值 | 行为 |
|---|---|
| `md+csv`（默认） | 两份都生成 |
| `md` | 只生成 TC-xx.md |
| `csv` | 只生成 testcases.csv（极少用，主要为纯 QA 场景） |

SDD 模式默认 `md+csv`。独立模式用户可在调用时指定。

---

## 十、detailed 模板生成质量自检

Skill Step 6 生成 detailed CSV 后必须自检：

1. [ ] 文件首 3 字节是 BOM `EF BB BF`
2. [ ] 第一行是表头，12 列齐全，按顺序
3. [ ] 每条用例 1 行，不换行（多行字段已用方案 C 扁平化）
4. [ ] 所有必填字段非空（TC_ID, Module, Title, Priority, Type, Channel, Test_Steps, Expected_Result, Related_REQ, Generated_Date）
5. [ ] 所有字段遵守 RFC 4180 引用规则
6. [ ] `Priority` 字段值在 {P0, P1, P2}
7. [ ] `Type` 字段值在 4 个章节枚举内（业务流程测试/UI交互测试/视觉回归测试/异常边界测试）
8. [ ] `Channel` 字段值在 3 个通道枚举内（manual/ui-dom/ui-visual）
9. [ ] `TC_ID` 格式符合 `TC-F-{module_id}-{seq:03}`
10. [ ] `Test_Steps` / `Expected_Result` 使用方案 C 格式（含编号 + ` ; `）
11. [ ] 行数 = 用例数 + 1（表头）
12. [ ] 与 TC-xx.md 的用例列表**一一对应**（同一批蓝本）

任一 [ ] 未勾选 → 回 Step 6 重新组装 CSV。

---

## 十一、traditional 模板（7 列传统 QA 版）

### 11.1 总览

- **文件名**：`testcases.traditional.csv`（与 detailed 同目录，带 `.traditional` 后缀）
- **编码**：UTF-8 with BOM（与 detailed 一致）
- **分隔符**：英文逗号 `,`
- **引用符**：英文双引号 `"`
- **行结束**：`\r\n`
- **表头语言**：默认**中文**（可通过 `csv_headers_lang: en` 切换为英文）
- **列数**：7 列（精简传统版）
- **规范依据**：RFC 4180

### 11.2 7 列 Schema（字段定义）

| # | 中文表头（默认） | 英文表头（可选） | 必填 | 类型 | 最大长度 | 示例 | 数据来源 |
|---|---|---|---|---|---|---|---|
| 1 | `编号ID` | `TC_ID` | ✅ | string | 32 | `TC-F-login-001` | 蓝本 `blueprint.id` |
| 2 | `用例等级` | `Priority` | ✅ | enum | 2 | `P0` / `P1` / `P2` | 蓝本 `blueprint.priority` |
| 3 | `功能模块` | `Module` | ✅ | string | 64 | `01-登录` | 蓝本 `blueprint.module` |
| 4 | `用例主题` | `Title` | ✅ | string | 200 | `正常登录 - 返回 token` | 蓝本 `blueprint.title` |
| 5 | `前置条件` | `Preconditions` | ⬜ | string | 500 | `1) 数据库有 zhangsan 用户 ; 2) 用户状态 active` | 蓝本 `blueprint.preconditions[]` |
| 6 | `执行步骤` | `Test_Steps` | ✅ | string | 1000 | `1) 打开登录页 ; 2) 输入用户名 ; 3) 点击登录` | 蓝本 `blueprint.steps[]` |
| 7 | `预期结果` | `Expected_Result` | ✅ | string | 500 | `1) HTTP 200 ; 2) 返 token ; 3) 跳转首页` | 蓝本 `blueprint.expectations[]` |

### 11.3 从 detailed 12 列砍掉的 5 列

| 砍掉的列 | 原因 |
|---|---|
| `Type` | 章节已在 TC 文档里分好，CSV 里冗余 |
| `Channel` | 传统 QA 不关心执行通道（是 api 还是 ui-dom） |
| `Related_REQ` | 传统 QA 用需求管理系统独立跟踪 |
| `Skeleton_File` | 传统 QA 不管 dev 的单测文件 |
| `Generated_Date` | 传统 QA 用"创建日期"字段，通常由管理平台自动填 |

### 11.4 完整示例

**中文表头（默认）**：

```csv
编号ID,用例等级,功能模块,用例主题,前置条件,执行步骤,预期结果
TC-F-login-001,P0,01-登录,正常登录 - 返回 token,1) 数据库存在 zhangsan 用户 ; 2) 用户状态为 active,1) 打开登录页 ; 2) 输入用户名 zhangsan 和密码 correct_password ; 3) 点击"登录"按钮 ; 4) 等待响应,1) HTTP 状态码 200 ; 2) 响应体 code=0 ; 3) 返回包含 token 字段 ; 4) 跳转到首页
TC-F-login-002,P0,01-登录,用户名不存在 - 返回 404,1) 数据库不存在 nonexistent 用户,1) 打开登录页 ; 2) 输入用户名 nonexistent 和任意密码 ; 3) 点击"登录"按钮,1) HTTP 状态码 404 ; 2) 响应体 code=10002 ; 3) 错误提示"用户不存在"
TC-F-login-003,P0,01-登录,密码错误 - 返回 401,1) 数据库存在 zhangsan 用户,1) 打开登录页 ; 2) 输入正确的用户名 zhangsan 和错误密码 wrong ; 3) 点击"登录"按钮,1) HTTP 状态码 401 ; 2) 响应体 code=10001 ; 3) 错误提示"用户名或密码错误" ; 4) 不返回 token
```

**英文表头（`csv_headers_lang: en`）**：

```csv
TC_ID,Priority,Module,Title,Preconditions,Test_Steps,Expected_Result
TC-F-login-001,P0,01-Login,Normal Login - Return Token,1) DB has zhangsan user ; 2) User status is active,1) Open login page ; 2) Input username and password ; 3) Click login button ; 4) Wait for response,1) HTTP 200 ; 2) code=0 ; 3) token field exists ; 4) Redirect to homepage
```

### 11.5 字段映射表（蓝本对象 → 传统版 CSV 列）

| 传统版 CSV 列（中文） | 传统版 CSV 列（英文） | 蓝本对象字段 | 转换规则 |
|---|---|---|---|
| `编号ID` | `TC_ID` | `id` | 直接复制 |
| `用例等级` | `Priority` | `priority` | 直接复制 |
| `功能模块` | `Module` | `module` | 直接复制 |
| `用例主题` | `Title` | `title` | 直接复制 |
| `前置条件` | `Preconditions` | `preconditions[]` | 数组 → 方案 C 格式 |
| `执行步骤` | `Test_Steps` | `steps[]` | 数组 → 方案 C 格式 |
| `预期结果` | `Expected_Result` | `expectations[]` | 断言 bullet → 方案 C 格式 |

**说明**：`expectations[]` 是从 tc-exec 块的断言 bullet 中**语义化翻译**而来——不是直接把 `http.status == 401` 这种 DSL 塞进去，而是转成 `1) HTTP 状态码 401`、`2) 响应体 code=10001` 这种人类可读的预期描述。

### 11.6 传统测试平台导入指南

#### 禅道（ZenTao）

1. 测试 → 用例 → 导入
2. 上传 `testcases.traditional.csv`
3. 选择**中文表头匹配**（禅道默认识别中文列名）
4. 字段映射：
   - `编号ID` → 编号
   - `用例等级` → 优先级（P0→1, P1→2, P2→3）
   - `功能模块` → 所属模块
   - `用例主题` → 用例标题
   - `前置条件` → 前置条件
   - `执行步骤` → 步骤
   - `预期结果` → 预期

**禅道是传统 7 列模板的最佳匹配**，几乎零额外配置。

#### 飞书多维表格（Bitable）

1. 飞书多维表格 → 新建表 → 导入 CSV
2. 上传 `testcases.traditional.csv`
3. 自动识别 7 个字段作为表列
4. 推荐设置：
   - `用例等级` 设为"单选"类型，选项 P0/P1/P2
   - `功能模块` 设为"单选"或"多选"类型
5. 可以按 `功能模块` 分组视图，按 `用例等级` 过滤

**中文表头在飞书多维表格里显示最友好**。

#### Excel 手工管理

1. 双击 `testcases.traditional.csv` 打开
2. BOM 保证中文正常显示
3. 可以：
   - 用"开始 → 套用表格格式"美化
   - 用"数据 → 筛选"按等级/模块筛选
   - 用"视图 → 冻结首行"锁定表头
4. 保存为 `.xlsx` 后可以加公式、批注、颜色标记

**Excel 是手工管理的经典工具**，传统版 CSV 直接兼容。

#### TestLink（老派但常用）

1. Test Specification → Import Test Cases
2. 选择 CSV 格式
3. TestLink 对表头字段有固定要求，可能需要手工调整列名或用脚本转换
4. 中英文表头都支持，但建议用英文（`csv_headers_lang: en`）避免字符编码问题

#### TAPD

1. 测试管理 → 用例 → 导入
2. 上传 CSV
3. 字段映射（类似禅道）
4. 中文表头支持

### 11.7 traditional 模板生成质量自检

Skill Step 6 生成 traditional CSV 后必须自检：

1. [ ] 文件首 3 字节是 BOM `EF BB BF`
2. [ ] 第一行是表头，7 列齐全，按顺序
3. [ ] 表头语言符合 `csv_headers_lang`：未传 → 中文；`zh` → 中文；`en` → 英文
4. [ ] 每条用例 1 行（多行字段用方案 C 扁平化）
5. [ ] 必填字段非空（编号ID / 用例等级 / 功能模块 / 用例主题 / 执行步骤 / 预期结果）
6. [ ] `用例等级` 字段值在 {P0, P1, P2}
7. [ ] `编号ID` 格式符合 `TC-F-{module_id}-{seq:03}`
8. [ ] `执行步骤` / `预期结果` 使用方案 C 格式（含编号 + ` ; `）
9. [ ] 行数 = 用例数 + 1（表头）
10. [ ] 与 TC-xx.md 的用例列表**一一对应**（与 detailed 版保持同一批蓝本）
11. [ ] 与 detailed 版的 `TC_ID` / `Priority` / `Module` / `Title` 三列**值完全一致**（不能出现两份 CSV 的同一用例字段不一致）

任一 [ ] 未勾选 → 回 Step 6 重新组装。

### 11.8 与 detailed 模板的同步保证

当 `csv_template: both` 时，两份 CSV 必须基于**同一批用例蓝本**生成（不能各自派生）。同步保证：

1. Skill Step 3 生成用例蓝本后**冻结**
2. Step 6 组装时，detailed 和 traditional 都从冻结的蓝本派生
3. 不允许 detailed 生成完了再重新生成一次蓝本给 traditional
4. 保证同一 TC-ID 在两份 CSV 中的共同字段（TC_ID, Priority, Module, Title, Preconditions, Test_Steps, Expected_Result）**值完全一致**
