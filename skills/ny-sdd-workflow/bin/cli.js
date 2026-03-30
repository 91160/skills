#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const VERSION = '3.0.0'
const AGENTS_FILE = path.resolve('AGENTS.md')
const TEMPLATE = path.join(__dirname, '..', 'templates', 'AGENTS.md')

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

  // Windows 不支持 symlink，用复制兜底
  const isWindows = process.platform === 'win32'
  if (isWindows) {
    fs.copyFileSync(source, target)
  } else {
    // 计算相对路径用于 symlink
    const relPath = path.relative(dir, source)
    fs.symlinkSync(relPath, target)
  }
  return 'created'
}

// ====== init 命令 ======
function init() {
  printBanner()
  console.log(bold('  初始化 SDD Workflow...\n'))

  // 1. 复制 AGENTS.md 到项目根目录
  if (fs.existsSync(AGENTS_FILE)) {
    console.log(yellow('  ⚠  AGENTS.md 已存在，跳过复制'))
    console.log(gray('     如需更新请使用: npx @nykj/ny-sdd-workflow update\n'))
  } else {
    if (!fs.existsSync(TEMPLATE)) {
      console.error('  ❌ 模板文件不存在: ' + TEMPLATE)
      process.exit(1)
    }
    fs.copyFileSync(TEMPLATE, AGENTS_FILE)
    console.log(green('  ✅ AGENTS.md') + gray(' (Claude Code / Codex 原生读取)'))
  }

  // 2. 创建各工具 symlink
  console.log('')
  console.log(bold('  创建工具指令文件...\n'))

  const isWindows = process.platform === 'win32'
  const method = isWindows ? '复制' : 'symlink'

  for (const { path: targetPath, tool } of TOOL_LINKS) {
    const result = createLink(AGENTS_FILE, targetPath)
    switch (result) {
      case 'created':
        console.log(green(`  ✅ ${targetPath}`) + gray(` → AGENTS.md (${tool}, ${method})`))
        break
      case 'symlink_exists':
        console.log(gray(`  ⏭  ${targetPath} (已是 symlink)`))
        break
      case 'file_exists':
        console.log(yellow(`  ⚠  ${targetPath} (已存在且非 symlink，跳过)`))
        break
    }
  }

  // 3. 输出 .gitignore 建议
  console.log('')
  console.log(bold('  .gitignore 建议：\n'))
  console.log(gray('  # SDD Workflow symlink（由 ny-sdd-workflow 生成，不提交）'))
  console.log(gray('  .cursorrules'))
  console.log(gray('  .clinerules'))
  console.log(gray('  .windsurfrules'))
  console.log(gray('  # AGENTS.md 需要提交（源文件）'))

  // 4. 完成
  console.log('')
  console.log(green(bold('  ✅ 初始化完成！\n')))
  console.log(bold('  支持的工具：'))
  console.log('  · Claude Code    — AGENTS.md (原生)')
  console.log('  · OpenAI Codex   — AGENTS.md (原生)')
  for (const { path: p, tool } of TOOL_LINKS) {
    console.log(`  · ${tool.padEnd(15)}— ${p}`)
  }
  console.log('')
}

// ====== update 命令 ======
function update() {
  printBanner()
  console.log(bold('  更新 SDD Workflow...\n'))

  if (!fs.existsSync(TEMPLATE)) {
    console.error('  ❌ 模板文件不存在: ' + TEMPLATE)
    console.log(gray('     请先升级包: npm install -g @nykj/ny-sdd-workflow@latest'))
    process.exit(1)
  }

  // 备份旧文件
  if (fs.existsSync(AGENTS_FILE)) {
    const backup = AGENTS_FILE + '.bak'
    fs.copyFileSync(AGENTS_FILE, backup)
    console.log(gray(`  📋 已备份: AGENTS.md → AGENTS.md.bak`))
  }

  // 覆盖
  fs.copyFileSync(TEMPLATE, AGENTS_FILE)
  console.log(green('  ✅ AGENTS.md 已更新到 v' + VERSION))

  // Windows 需要重新复制到各工具
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
    console.log(gray('  symlink 自动指向新内容，无需额外操作'))
  }

  console.log('')
  console.log(green(bold('  ✅ 更新完成！\n')))
}

// ====== remove 命令 ======
function remove() {
  printBanner()
  console.log(bold('  清理 SDD Workflow symlink...\n'))

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
  console.log(gray('  AGENTS.md 保留（如需删除请手动操作）'))
  console.log('')
  console.log(green(bold('  ✅ 清理完成！\n')))
}

// ====== status 命令 ======
function status() {
  printBanner()
  console.log(bold('  SDD Workflow 状态\n'))

  // AGENTS.md
  if (fs.existsSync(AGENTS_FILE)) {
    console.log(green('  ✅ AGENTS.md') + gray(' (存在)'))
  } else {
    console.log(yellow('  ❌ AGENTS.md') + gray(' (不存在，请先 init)'))
  }

  // 各工具
  console.log('')
  for (const { path: targetPath, tool } of TOOL_LINKS) {
    if (!fs.existsSync(targetPath)) {
      console.log(gray(`  ·  ${tool.padEnd(15)} ${targetPath}`) + yellow(' (未安装)'))
    } else {
      const stat = fs.lstatSync(targetPath)
      if (stat.isSymbolicLink()) {
        console.log(gray(`  ·  ${tool.padEnd(15)} ${targetPath}`) + green(' (symlink ✅)'))
      } else {
        console.log(gray(`  ·  ${tool.padEnd(15)} ${targetPath}`) + yellow(' (文件，非 symlink)'))
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
    console.log('    init      初始化（复制 AGENTS.md + 创建各工具 symlink）')
    console.log('    update    更新 AGENTS.md 到最新版本')
    console.log('    status    查看当前安装状态')
    console.log('    remove    清理所有 symlink（保留 AGENTS.md）')
    console.log('')
    console.log(bold('  选项：'))
    console.log('    -v, --version    显示版本号')
    console.log('    -h, --help       显示帮助信息')
    console.log('')
    break
  default:
    console.error(`  未知命令: ${command}`)
    console.log('  运行 npx @nykj/ny-sdd-workflow --help 查看可用命令')
    process.exit(1)
}
