#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const VERSION = '1.0.2'
const AGENTS_FILE = path.resolve('AGENTS.md')
const TEMPLATE = path.join(__dirname, '..', 'templates', 'AGENTS.md')
const SKILL_PKG_DIR = path.join(__dirname, '..')

// 各工具 symlink 目标路径
const TOOL_LINKS = [
  { path: '.cursor/rules/ny-sdd-workflow.md', tool: 'Cursor' },
  { path: '.github/copilot-instructions.md', tool: 'GitHub Copilot' },
  { path: '.clinerules', tool: 'Cline' },
  { path: '.windsurfrules', tool: 'Windsurf' },
  { path: '.augment/rules/ny-sdd-workflow.md', tool: 'Augment' },
  { path: '.continue/rules/ny-sdd-workflow.md', tool: 'Continue' },
]

// 13 个 Slash Commands 列表
const COMMANDS = [
  'sdd-init', 'sdd-start', 'sdd-prd-change', 'sdd-bug-fix',
  'sdd-prd-audit', 'sdd-front-context', 'sdd-back-context', 'sdd-frontend-standards',
  'sdd-java-create', 'sdd-wap-create', 'sdd-reverse-scan', 'sdd-test-case', 'sdd-unit-test',
]

// Slash Commands 源目录（在 skill 包内）
const COMMANDS_SRC = path.join(SKILL_PKG_DIR, '.claude', 'commands')

// 颜色输出
const green = (s) => `\x1b[32m${s}\x1b[0m`
const yellow = (s) => `\x1b[33m${s}\x1b[0m`
const gray = (s) => `\x1b[90m${s}\x1b[0m`
const bold = (s) => `\x1b[1m${s}\x1b[0m`
const purple = (s) => `\x1b[35m${s}\x1b[0m`

function printBanner() {
  console.log('')
  console.log(purple('  ███████╗██████╗ ██████╗ '))
  console.log(purple('  ██╔════╝██╔══██╗██╔══██╗'))
  console.log(purple('  ███████╗██║  ██║██║  ██║'))
  console.log(purple('  ╚════██║██║  ██║██║  ██║'))
  console.log(purple('  ███████║██████╔╝██████╔╝'))
  console.log(purple('  ╚══════╝╚═════╝ ╚═════╝ '))
  console.log(gray(`  SDD Workflow v${VERSION}`))
  console.log('')
}

/**
 * 解析 skill 安装路径，返回适合写入 AGENTS.md 的引用路径
 * - 项目内安装（.agents/skills/ny-sdd-workflow/）→ 返回相对路径
 * - 全局安装（~/.claude/skills/ 或其他位置）→ 返回绝对路径
 */
function resolveSkillDir() {
  const cwd = process.cwd()
  const skillAbsolute = path.resolve(SKILL_PKG_DIR)

  if (skillAbsolute.startsWith(cwd + path.sep)) {
    return path.relative(cwd, skillAbsolute)
  }

  return skillAbsolute
}

/**
 * 读取模板并替换 {SKILL_DIR} 占位符
 */
function renderTemplate(skillDir) {
  if (!fs.existsSync(TEMPLATE)) {
    console.error('  ❌ 模板文件不存在: ' + TEMPLATE)
    process.exit(1)
  }
  let content = fs.readFileSync(TEMPLATE, 'utf8')
  content = content.replace(/\{SKILL_DIR\}/g, skillDir)
  return content
}

// 创建 symlink（兼容 Windows 用复制）
function createLink(source, target) {
  const dir = path.dirname(target)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  if (fs.existsSync(target)) {
    const stat = fs.lstatSync(target)
    if (stat.isSymbolicLink()) {
      return 'symlink_exists'
    }
    return 'file_exists'
  }

  const isWindows = process.platform === 'win32'
  if (isWindows) {
    fs.copyFileSync(source, target)
  } else {
    const relPath = path.relative(dir, source)
    fs.symlinkSync(relPath, target)
  }
  return 'created'
}

/**
 * 解析 --commands=xxx 参数
 * 返回值：'user' | 'project' | 'skip' | null（未传）
 */
function parseCommandsArg() {
  const arg = process.argv.find(a => a.startsWith('--commands='))
  if (!arg) return null
  const value = arg.split('=')[1]
  if (!['user', 'project', 'skip'].includes(value)) {
    console.error(yellow(`  ⚠  未知 --commands 值: ${value}（支持：user / project / skip），按 skip 处理`))
    return 'skip'
  }
  return value
}

/**
 * 获取 commands 目标目录
 * - target='user'   → ~/.claude/commands
 * - target='project'→ <cwd>/.claude/commands
 */
function getCommandsTargetDir(target) {
  if (target === 'user') {
    return path.join(require('os').homedir(), '.claude', 'commands')
  }
  return path.resolve('.claude/commands')
}

/**
 * 安装 13 个 Slash Commands 到指定目标
 * 返回 { created, exists, skipped, missingSrc }
 */
function installCommands(target) {
  const stats = { created: 0, exists: 0, skipped: 0, missingSrc: 0 }

  if (!fs.existsSync(COMMANDS_SRC)) {
    console.log(yellow(`  ⚠  Skill 包内未找到 commands 源目录: ${COMMANDS_SRC}`))
    return stats
  }

  const targetDir = getCommandsTargetDir(target)
  const targetLabel = target === 'user' ? '~/.claude/commands/' : '.claude/commands/'

  console.log(bold(`  Slash Commands → ${targetLabel}\n`))

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true })
  }

  const isWindows = process.platform === 'win32'
  const method = isWindows ? '复制' : 'symlink'

  for (const c of COMMANDS) {
    const src = path.join(COMMANDS_SRC, `${c}.md`)
    const dst = path.join(targetDir, `${c}.md`)

    if (!fs.existsSync(src)) {
      console.log(yellow(`  ⚠  ${c}.md (源文件缺失，跳过)`))
      stats.missingSrc++
      continue
    }

    const result = createLink(src, dst)
    switch (result) {
      case 'created':
        console.log(green(`  ✅ /${c}`) + gray(` (${method})`))
        stats.created++
        break
      case 'symlink_exists':
        console.log(gray(`  ⏭  /${c} (已是 symlink)`))
        stats.exists++
        break
      case 'file_exists':
        console.log(yellow(`  ⚠  /${c} (已存在且非 symlink，跳过)`))
        stats.skipped++
        break
    }
  }

  return stats
}

/**
 * 清理 13 个 Slash Commands symlink
 */
function removeCommands(target) {
  const targetDir = getCommandsTargetDir(target)
  const targetLabel = target === 'user' ? '~/.claude/commands/' : '.claude/commands/'

  console.log(bold(`  Slash Commands ← ${targetLabel}\n`))

  let removed = 0
  for (const c of COMMANDS) {
    const dst = path.join(targetDir, `${c}.md`)
    if (!fs.existsSync(dst)) continue

    const stat = fs.lstatSync(dst)
    if (stat.isSymbolicLink()) {
      fs.unlinkSync(dst)
      console.log(green(`  🗑  /${c}`))
      removed++
    } else {
      console.log(yellow(`  ⚠  /${c} 非 symlink，跳过`))
    }
  }

  if (removed === 0) {
    console.log(gray('  没有需要清理的 symlink'))
  }
  return removed
}

// ====== init 命令 ======
function init() {
  printBanner()
  console.log(bold('  初始化 SDD Workflow...\n'))

  // 1. 解析 skill 路径
  const skillDir = resolveSkillDir()
  console.log(gray(`  Skill 路径: ${skillDir}`))
  console.log('')

  // 2. 生成 AGENTS.md（模板 + 路径替换）
  if (fs.existsSync(AGENTS_FILE)) {
    console.log(yellow('  ⚠  AGENTS.md 已存在，跳过'))
    console.log(gray('     如需更新请使用: node <SDD_DIR>/bin/cli.js update\n'))
  } else {
    const content = renderTemplate(skillDir)
    fs.writeFileSync(AGENTS_FILE, content, 'utf8')
    console.log(green('  ✅ AGENTS.md') + gray(` (~170行核心规则，引用 ${skillDir}/rules/)`))
  }

  // 3. 验证 rules/ 文件完整性
  console.log('')
  const ruleFiles = [
    'rules/phase-init.md', 'rules/phase-spec.md', 'rules/phase-coding.md',
    'rules/phase-archive.md', 'rules/quality-standards.md', 'rules/skill-routing.md',
  ]
  const templateFiles = [
    'templates/project-profile.tpl.md', 'templates/project-overview.tpl.md',
  ]
  let allPresent = true
  for (const f of [...ruleFiles, ...templateFiles]) {
    const fullPath = path.join(SKILL_PKG_DIR, f)
    if (!fs.existsSync(fullPath)) {
      console.log(yellow(`  ⚠  缺失: ${f}`))
      allPresent = false
    }
  }
  if (allPresent) {
    console.log(green(`  ✅ ${skillDir}/rules/`) + gray(` (${ruleFiles.length} 个阶段规则)`))
    console.log(green(`  ✅ ${skillDir}/templates/`) + gray(` (${templateFiles.length} 个模板)`))
  }

  // 4. AI 工具同步
  console.log('')
  console.log(bold('  AI 工具同步\n'))

  const toolsArg = process.argv.find(a => a.startsWith('--tools='))
  const toolsValue = toolsArg ? toolsArg.split('=')[1] : null

  if (!toolsValue) {
    console.log('  请通过 --tools 参数指定（多个用逗号分隔，A=全选，N=跳过）：')
    console.log('')
    for (let i = 0; i < TOOL_LINKS.length; i++) {
      console.log(gray(`    ${i + 1}. ${TOOL_LINKS[i].tool.padEnd(15)} → ${TOOL_LINKS[i].path}`))
    }
    console.log('')
    console.log(gray('  示例: node <SDD_DIR>/bin/cli.js init --tools=A'))
    console.log('')
  }

  let selectedIndexes = []
  if (toolsValue && toolsValue.toUpperCase() === 'A') {
    selectedIndexes = TOOL_LINKS.map((_, i) => i)
  } else if (toolsValue && toolsValue.toUpperCase() !== 'N') {
    selectedIndexes = toolsValue.split(',').map(s => parseInt(s.trim()) - 1).filter(i => i >= 0 && i < TOOL_LINKS.length)
  }

  let createdCount = 0
  if (selectedIndexes.length > 0) {
    const isWindows = process.platform === 'win32'
    const method = isWindows ? '复制' : 'symlink'

    for (const i of selectedIndexes) {
      const { path: targetPath, tool } = TOOL_LINKS[i]
      const result = createLink(AGENTS_FILE, targetPath)
      switch (result) {
        case 'created':
          console.log(green(`  ✅ ${targetPath}`) + gray(` → AGENTS.md (${tool}, ${method})`))
          createdCount++
          break
        case 'symlink_exists':
          console.log(gray(`  ⏭  ${targetPath} (已是 symlink)`))
          break
        case 'file_exists':
          console.log(yellow(`  ⚠  ${targetPath} (已存在且非 symlink，跳过)`))
          break
      }
    }

    for (let i = 0; i < TOOL_LINKS.length; i++) {
      if (!selectedIndexes.includes(i)) {
        console.log(gray(`  ⏭  ${TOOL_LINKS[i].tool} (未同步)`))
      }
    }
  } else if (toolsValue) {
    console.log(gray('  ⏭  跳过工具同步，仅 AGENTS.md 生效'))
  }

  // 5. .gitignore 建议
  if (createdCount > 0) {
    console.log('')
    console.log(bold('  .gitignore 建议：\n'))
    console.log(gray('  # SDD Workflow symlink（不提交）'))
    console.log(gray('  .cursorrules'))
    console.log(gray('  .clinerules'))
    console.log(gray('  .windsurfrules'))
  }

  // 6. 完成
  console.log('')
  console.log(green(bold('  ✅ 初始化完成！\n')))
  console.log(bold('  架构：'))
  console.log(`  · AGENTS.md             ~170行核心规则（始终加载）`)
  console.log(`  · ${skillDir}/rules/    阶段规则（按需加载）`)
  console.log(`  · ${skillDir}/templates/ 初始化模板（仅首次使用）`)
  console.log('')
  console.log(gray('  AI 每次对话只读取当前阶段的规则，不再一次性加载全部 1500 行'))
  console.log('')

  // 7. Slash Commands 安装（按 --commands 参数处理）
  console.log('')
  const commandsArg = parseCommandsArg()
  if (commandsArg === 'user' || commandsArg === 'project') {
    const stats = installCommands(commandsArg)
    console.log('')
    console.log(gray(`  完成：新建 ${stats.created} | 已存在 ${stats.exists} | 跳过 ${stats.skipped}`))
  } else if (commandsArg === 'skip') {
    console.log(bold('  Slash Commands（13 个）：') + gray(' 已通过 --commands=skip 跳过'))
  } else {
    // 未传 --commands，输出引导提示（保持向后兼容）
    console.log(bold('  Slash Commands（13 个）：'))
    console.log(gray('  · 本次未安装命令（未传 --commands 参数）'))
    console.log(gray('  · 一键安装到用户级（推荐，所有项目可见）：'))
    console.log(gray('      node <SDD_DIR>/bin/cli.js init --tools=A --commands=user'))
    console.log(gray('  · 或安装到项目级（仅当前项目）：'))
    console.log(gray('      node <SDD_DIR>/bin/cli.js init --tools=A --commands=project'))
    console.log(gray('  · 或在 AI 对话中说"安装 SDD"由 AI 询问安装位置'))
    console.log(gray('  · 流程命令：/sdd-init /sdd-start /sdd-prd-change /sdd-bug-fix'))
    console.log(gray('  · 工具命令：/sdd-prd-audit /sdd-front-context /sdd-back-context /sdd-frontend-standards'))
    console.log(gray('              /sdd-java-create /sdd-wap-create /sdd-reverse-scan /sdd-test-case /sdd-unit-test'))
  }

  console.log('')
  console.log(bold('  下一步：') + gray('在 AI 对话中说"启动工作流"或运行 /sdd-start 进入项目开发'))
  console.log('')
}

// ====== update 命令 ======
function update() {
  printBanner()
  console.log(bold('  更新 SDD Workflow...\n'))

  const skillDir = resolveSkillDir()
  console.log(gray(`  Skill 路径: ${skillDir}`))

  if (fs.existsSync(AGENTS_FILE)) {
    const backup = AGENTS_FILE + '.bak'
    fs.copyFileSync(AGENTS_FILE, backup)
    console.log(gray(`  📋 已备份: AGENTS.md → AGENTS.md.bak`))
  }

  const content = renderTemplate(skillDir)
  fs.writeFileSync(AGENTS_FILE, content, 'utf8')
  console.log(green('  ✅ AGENTS.md 已更新到 v' + VERSION))

  if (process.platform === 'win32') {
    console.log('')
    console.log(bold('  同步到各工具...\n'))
    for (const { path: targetPath, tool } of TOOL_LINKS) {
      if (fs.existsSync(targetPath)) {
        fs.copyFileSync(AGENTS_FILE, targetPath)
        console.log(green(`  ✅ ${targetPath}`) + gray(` (${tool})`))
      }
    }
  } else {
    console.log(gray('  symlink 自动指向新内容'))
  }

  // Slash Commands 同步（按 --commands 参数处理）
  console.log('')
  const commandsArg = parseCommandsArg()
  if (commandsArg === 'user' || commandsArg === 'project') {
    console.log(bold('  Slash Commands 强制重装/补齐：'))
    const stats = installCommands(commandsArg)
    console.log('')
    console.log(gray(`  完成：新建 ${stats.created} | 已存在 ${stats.exists} | 跳过 ${stats.skipped}`))
  } else {
    console.log(bold('  Slash Commands 同步：'))
    console.log(gray('  · 已安装的 symlink 自动指向新版本（无需重装）'))
    console.log(gray('  · 如需补齐缺失的命令，运行：'))
    console.log(gray('      node <SDD_DIR>/bin/cli.js update --commands=user      # 用户级'))
    console.log(gray('      node <SDD_DIR>/bin/cli.js update --commands=project   # 项目级'))
  }

  console.log('')
  console.log(green(bold('  ✅ 更新完成！\n')))
}

// ====== remove 命令 ======
function remove() {
  printBanner()
  console.log(bold('  清理 SDD Workflow...\n'))

  let removed = 0
  for (const { path: targetPath, tool } of TOOL_LINKS) {
    if (!fs.existsSync(targetPath)) continue

    const stat = fs.lstatSync(targetPath)
    if (stat.isSymbolicLink()) {
      fs.unlinkSync(targetPath)
      console.log(green(`  🗑  ${targetPath}`) + gray(` (${tool})`))
      removed++
    } else {
      console.log(yellow(`  ⚠  ${targetPath} 非 symlink，跳过`) + gray(` (${tool})`))
    }
  }

  if (removed === 0) {
    console.log(gray('  没有需要清理的 symlink'))
  }

  // 清理 Slash Commands（按 --commands 参数）
  console.log('')
  const commandsArg = parseCommandsArg()

  if (commandsArg === 'user') {
    // 显式清理用户级
    removeCommands('user')
    console.log(gray('  项目级 .claude/commands/sdd-*.md 已跳过（如需清理请加 --commands=project 或重跑不带参数）'))
  } else if (commandsArg === 'project') {
    // 显式仅清理项目级
    removeCommands('project')
  } else {
    // 默认行为：清理项目级，提示用户级保留
    removeCommands('project')
    console.log('')
    console.log(gray('  用户级 ~/.claude/commands/sdd-*.md 默认保留（可能被其他项目使用）'))
    console.log(gray('  如需卸载用户级命令，运行：'))
    console.log(gray('    node <SDD_DIR>/bin/cli.js remove --commands=user'))
  }

  console.log('')
  console.log(gray('  AGENTS.md 保留'))
  console.log(green(bold('\n  ✅ 清理完成！\n')))
}

// ====== status 命令 ======
function status() {
  printBanner()
  console.log(bold('  SDD Workflow 状态\n'))

  const skillDir = resolveSkillDir()

  if (fs.existsSync(AGENTS_FILE)) {
    console.log(green('  ✅ AGENTS.md') + gray(' (存在)'))
  } else {
    console.log(yellow('  ❌ AGENTS.md') + gray(' (不存在，请先 init)'))
  }

  console.log('')
  console.log(bold(`  Skill: ${skillDir}\n`))
  const checkFiles = [
    'rules/phase-init.md', 'rules/phase-spec.md', 'rules/phase-coding.md',
    'rules/phase-archive.md', 'rules/quality-standards.md', 'rules/skill-routing.md',
    'templates/project-profile.tpl.md', 'templates/project-overview.tpl.md',
  ]
  for (const f of checkFiles) {
    const fullPath = path.join(SKILL_PKG_DIR, f)
    const icon = fs.existsSync(fullPath) ? green('✅') : yellow('❌')
    console.log(`  ${icon} ${f}`)
  }

  console.log('')
  for (const { path: targetPath, tool } of TOOL_LINKS) {
    if (!fs.existsSync(targetPath)) {
      console.log(gray(`  ·  ${tool.padEnd(15)} ${targetPath}`) + yellow(' (未安装)'))
    } else {
      const stat = fs.lstatSync(targetPath)
      if (stat.isSymbolicLink()) {
        console.log(gray(`  ·  ${tool.padEnd(15)} ${targetPath}`) + green(' ✅'))
      } else {
        console.log(gray(`  ·  ${tool.padEnd(15)} ${targetPath}`) + yellow(' (非 symlink)'))
      }
    }
  }

  // Slash Commands 状态检测（用户级 + 项目级）
  console.log('')
  console.log(bold('  Slash Commands 状态：'))
  const homeCmdsDir = getCommandsTargetDir('user')
  const projectCmdsDir = getCommandsTargetDir('project')
  let userCount = 0
  let projectCount = 0
  for (const c of COMMANDS) {
    const userPath = path.join(homeCmdsDir, `${c}.md`)
    const projPath = path.join(projectCmdsDir, `${c}.md`)
    if (fs.existsSync(userPath) && fs.lstatSync(userPath).isSymbolicLink()) userCount++
    if (fs.existsSync(projPath) && fs.lstatSync(projPath).isSymbolicLink()) projectCount++
  }
  console.log(`  · 用户级 (~/.claude/commands/)  ${userCount === 13 ? green('✅ 全部已安装 (13/13)') : userCount === 0 ? yellow('❌ 未安装') : yellow(`⚠ 部分安装 (${userCount}/13)`)}`)
  console.log(`  · 项目级 (.claude/commands/)   ${projectCount === 13 ? green('✅ 全部已安装 (13/13)') : projectCount === 0 ? yellow('❌ 未安装') : yellow(`⚠ 部分安装 (${projectCount}/13)`)}`)
  if (userCount === 0 && projectCount === 0) {
    console.log(gray('  运行 node <SDD_DIR>/bin/cli.js init --commands=user 安装到用户级'))
    console.log(gray('  或在 AI 对话中说"安装 SDD"由 AI 询问安装位置'))
  }
  console.log('')
}

// ====== 主入口 ======
const command = process.argv[2]

switch (command) {
  case 'init':
    init()
    break
  case 'update':
    update()
    break
  case 'remove':
    remove()
    break
  case 'status':
    status()
    break
  case '-v':
  case '--version':
    console.log(VERSION)
    break
  case '-h':
  case '--help':
  case undefined:
    printBanner()
    console.log(bold('  用法：') + 'node <SDD_DIR>/bin/cli.js <command> [options]\n')
    console.log(bold('  命令：'))
    console.log('    init      初始化（生成 AGENTS.md + 创建各工具 symlink + 可选安装 slash commands）')
    console.log('    update    更新 AGENTS.md 到最新版本（symlink 自动同步；可选强制重装 commands）')
    console.log('    status    查看当前安装状态（含 slash commands 用户级/项目级）')
    console.log('    remove    清理 symlink（保留 AGENTS.md；默认仅清项目级 commands）')
    console.log('')
    console.log(bold('  选项 - AI 工具同步：'))
    console.log('    --tools=A             全选所有 AI 工具同步（Cursor/Copilot/Cline/...）')
    console.log('    --tools=1,2,3         选择指定工具同步')
    console.log('    --tools=N             不同步任何工具')
    console.log('')
    console.log(bold('  选项 - Slash Commands（init/update/remove 通用）：'))
    console.log('    --commands=user       安装/清理用户级 ~/.claude/commands/（推荐：所有项目可用）')
    console.log('    --commands=project    安装/清理项目级 .claude/commands/（仅当前项目）')
    console.log('    --commands=skip       跳过 slash commands 处理（init 默认行为）')
    console.log('')
    console.log(bold('  其他：'))
    console.log('    -v, --version         显示版本号')
    console.log('    -h, --help            显示帮助信息')
    console.log('')
    console.log(bold('  常见组合：'))
    console.log(gray('    node <SDD_DIR>/bin/cli.js init --tools=A --commands=user'))
    console.log(gray('      （一键完整安装：AGENTS + 全部 AI 工具 + 用户级 slash 命令）'))
    console.log(gray('    node <SDD_DIR>/bin/cli.js remove --commands=user'))
    console.log(gray('      （额外清理用户级 slash 命令，默认 remove 仅清项目级）'))
    console.log('')
    break
  default:
    console.error(`  未知命令: ${command}`)
    console.log('  运行 node <SDD_DIR>/bin/cli.js --help 查看可用命令')
    process.exit(1)
}
