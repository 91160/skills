#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const VERSION = '3.7.0'
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
    console.log(gray('     如需更新请使用: npx @nykj/ny-sdd-workflow update\n'))
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
    console.log(gray('  示例: npx @nykj/ny-sdd-workflow init --tools=A'))
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
    console.log(bold('  用法：') + 'npx @nykj/ny-sdd-workflow <command>\n')
    console.log(bold('  命令：'))
    console.log('    init      初始化（生成 AGENTS.md + 创建各工具 symlink）')
    console.log('    update    更新 AGENTS.md 到最新版本')
    console.log('    status    查看当前安装状态')
    console.log('    remove    清理所有 symlink（保留 AGENTS.md）')
    console.log('')
    console.log(bold('  选项：'))
    console.log('    --tools=A        全选所有 AI 工具同步')
    console.log('    --tools=1,2,3    选择指定工具同步')
    console.log('    -v, --version    显示版本号')
    console.log('    -h, --help       显示帮助信息')
    console.log('')
    break
  default:
    console.error(`  未知命令: ${command}`)
    console.log('  运行 npx @nykj/ny-sdd-workflow --help 查看可用命令')
    process.exit(1)
}
