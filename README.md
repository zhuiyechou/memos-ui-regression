# memos-ui-regression：自托管笔记应用的 UI 回归基线 + Playwright MCP

以 Memos（Go 单二进制、SQLite）为被测系统，用 Playwright Test 维护 64 条可重复执行的 UI 回归用例，覆盖增删改查、标签、置顶/归档、可见性、Markdown 与 XSS、搜索边界、会话与登出、页面导航、移动端视口等 11 个模块；再用 Playwright MCP 做探索式测试入口，并用本机计划任务与 GitHub Actions 做每日回归。

## 环境

| 组件 | 版本 | 位置 |
| --- | --- | --- |
| Memos | 26.11.0 windows amd64 | `D:\qa-projects\memos\memos.exe`，数据在 `D:\qa-projects\memos\data` |
| Node.js | 26.13.0 | 本机 |
| Playwright Test | 1.65.0 | `node_modules/@playwright/test` |
| Playwright MCP | 0.0.85 | `node_modules/@playwright/mcp` |
| Chromium | 1254 | `D:\ms-playwright`（与 Python 版 Playwright 共用） |

## 启动
    




```powershell
# 1. 起 Memos（窗口保持开着）
powershell -ExecutionPolicy Bypass -File .\scripts\serve-memos.ps1
# 或直接：D:\qa-projects\memos\memos.exe --port 5230 --data D:\qa-projects\memos\data

# 2. 跑 UI 回归
$env:PLAYWRIGHT_BROWSERS_PATH = "D:/ms-playwright"
npx playwright test

# 带界面观察 / 看报告
npx playwright test --headed --project=chromium
npx playwright show-report
```

管理员账号默认 `admin / Memos@2026`，可用环境变量 `MEMOS_USER`、`MEMOS_PASS` 覆盖。首次运行 `setup` 项目会在 `/auth/signup` 建号；之后自动走 `/auth` 登录，会话存到 `.auth/state.json`。

## 用例分布（64 条业务用例 + 1 条登录夹具）

| 模块 | 条数 | 覆盖点 |
| --- | --- | --- |
| 基线 CRUD | 4 | 新建、编辑、搜索、删除 |
| 边界/取消/隔离 | 5 | 刷新持久化、取消编辑、取消删除、纯空格（D01）、同内容只删一条 |
| 标签 | 7 | 单/多标签渲染、标签筛选、筛选隔离、编辑后标签更新、退格删标签、删除后筛选页不命中 |
| 置顶/归档 | 8 | Pin/Unpin 角标与菜单、置顶排序与刷新持久化、归档后隐藏、归档页可见、Restore 回时间线、恢复后归档页消失 |
| 可见性 | 5 | 默认 Private、Public/Protected 保存后标识、编辑时 Private↔Public 互转 |
| Markdown/安全 | 7 | 标题、加粗、代码块、引用块、行内代码、任务列表渲染；script 不执行 |
| 编辑器体验 | 8 | Esc 不保存、草稿保留、空内容 Save 禁用、多行换行、2000+ 字长文本、保存自动关闭、emoji、新 memo 置顶 |
| 搜索边界 | 10 | 空结果、特殊字符、大小写不敏感、Clear filters、部分关键词、同内容两条、Esc 关闭、清空恢复、URL 参数、无关词隔离 |
| 导航 | 4 | Open 详情页、浏览器前进/后退、Calendar、Attachments |
| 登录会话 | 3 | 未登录重定向、退出登录回 `/auth`、未登录访问归档页被拦截 |
| 响应式 | 3 | 390×844 新建、导航抽屉、抽屉内搜索 |

每条用例数据带唯一前缀 `E2E-<时间戳>`，用完即删，不污染实例。`scripts/cleanup-e2e.mjs` 可清理时间线与归档页的残留测试数据。

## 实测结果（2026-11-14）

扩到 64 条后，用 `scripts\run-regression.ps1` 完整跑通自动化回归链路（起服务 → 执行 → 归档 → 清理）：

```
Running 65 tests using 1 worker
...
  65 passed (6.3m)
Stats: expected=65 unexpected=0 flaky=0 skipped=0
Cleanup done.
Regression finished with exit code 0
```

此前 39 条版本连续三轮 40 passed，用于验证用例稳定性；新增 25 条后整轮 65 个执行（64 业务 + 1 setup）全过，D01 预期失败计入 expected。

D01（纯空格可保存为空 memo）用 `test.fail()` 登记，属于预期失败，计入 expected，退出码仍为 0。整轮结束后 `scripts\cleanup-e2e.mjs` 自动清理，时间线与归档页的 `E2E-` 残留为 0。

另外做过断言有效性验证：把某条用例的预期文本故意改成页面不可能出现的值，用例确实变红并输出了实际文本，确认断言不是空转。

## 已知缺陷 D01：纯空格可保存为空 memo

- 环境：Memos 26.11.0，Chromium 1254
- 复现：新建 memo，仅输入 3 个空格，Save 按钮可点击，保存成功
- 预期：空白内容应被拦截，Save 置灰
- 实际：生成一张无内容的卡片，占用时间线
- 影响：时间线出现无意义空卡片，只能手工逐条清理
- 严重程度：一般（不影响数据正确性，影响可读性）
- 状态：已提交，用例以 `test.fail()` 登记，修复后删除该标记即可转为普通用例

## 工程化要点

- **登录态复用**：`setup` 项目单独建号/登录并落 `.auth/state.json`，业务用例只读会话，互不重复登录。
- **预期失败**：`test.fail()` 把已知缺陷固定成“绿的失败”，不因一个缺陷让整轮回归长期变红。
- **数据隔离**：所有测试数据带 `E2E-<时间戳>` 唯一前缀，用例自建自删，支持反复执行。
- **时序稳定性**：新建/删除确认弹窗都有进出场动画，操作前先等弹窗完全消失，避免点击被遮罩吞掉。
- **双端覆盖**：同一套配置下用 `test.use({ viewport })` 覆盖移动端内联编辑器路径。
- **失败可观测**：开启 trace 与失败截图，`npx playwright show-report` 可复盘每一步。

## CI / 每日回归

两条路都配好了：本机每天定时跑，仓库推送后 GitHub Actions 跑。

### 本机：一键脚本 + 计划任务

```powershell
# 立即跑一轮（Memos 没启动会自动拉起，跑完自动清数据、归档报告）
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\run-regression.ps1

# 注册每天 09:30 自动跑（只注册一次）
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\register-daily-task.ps1 -Time 09:30

# 取消定时任务
Unregister-ScheduledTask -TaskName MemosUIRegression
```

每次结果落盘到：

- `reports\<时间戳>\html\index.html` — 该轮的 HTML 报告（默认保留 14 轮）
- `reports\<时间戳>\results.json` — 机器可读结果，便于二次统计
- `reports\last-run.log` — 最近一轮的时间线日志（起服务、统计、清理、退出码）

脚本退出码即 CI 判定依据：`0` = 全部符合预期（含 D01 预期失败），非 `0` = 有真实失败。

### GitHub Actions：`.github/workflows/ui-regression.yml`

每天 09:30（北京时间）定时触发，也支持手动 `workflow_dispatch`：

1. `docker run neosmemo/memos:stable` 起一个干净实例（每次都是全新数据库，顺带验证首次建号流程）；
2. `npm ci` + `npx playwright install --with-deps chromium`；
3. 执行全量用例，失败也照样上传 `playwright-report` 工件，保留 14 天。

## MCP 探索入口

项目根目录 `.mcp.json` 已配置：

```json
{
  "mcpServers": {
    "memos-playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@0.0.85", "--port", "8931", "--browser", "chromium", "--viewport-size", "1440x900"],
      "env": { "PLAYWRIGHT_BROWSERS_PATH": "D:/ms-playwright" }
    }
  }
}
```

本地验证过：`initialize` 握手成功（serverInfo Playwright 1.66.0-alpha），调用 `browser_navigate` 打开 `http://localhost:5230/` 并返回页面快照，说明 MCP → Chromium → Memos 整条链路通。

## 调试中记录的真实问题

- Memos 26 的登录页路径是 `/auth`，不是 `/auth/signin`；首次运行是 `/auth/signup`。
- 卡片编辑是在时间线内就地编辑，保存按钮叫 `Update`，不是新建弹窗的 `Save`。
- 搜索输入后必须回车提交，结果渲染回时间线，弹窗会关闭；空结果时才出现 `Clear filters`。
- 新建弹窗有进场动画，动画期间点击会被弹窗头部遮罩拦截；等待约 800ms 再点击编辑区才稳定。
- 删除确认框取消后有退出动画，紧接着点卡片 More 会被残留遮罩拦截；先等确认文案消失再操作。
- 连续新建第二条时，上一条弹窗的关闭动画会吞掉新建按钮的点击；`openComposer` 先等 `[role=dialog]` 计数为 0。
- 移动端（390×844）没有独立的“新建 memo”弹窗，走页面顶部的内联编辑器。
- 未登录用例必须把 `storageState` 设成 `{ cookies: [], origins: [] }`，设为 `undefined` 会回落到项目配置，仍然带登录态。
- Markdown 用例要逐字输入（`pressSequentially`），`fill` 只写入纯文本，不会触发 Markdown 解析；长文本反而用 `fill` 更快。
- `@playwright/mcp` 依赖的是 Playwright 1.66 alpha，与测试用的 1.65.0 并存但共用 chromium-1254，未额外下载浏览器。

## 已知局限

- 仅覆盖 Chromium 单浏览器，`workers=1`，未做多浏览器/并发矩阵。
- 部分选择器依赖英文界面文案（`Save / Update / Delete / More / Pin / Archive`），切中文界面需同步调整。
- CI 已配置（本机每日计划任务 + GitHub Actions），但项目尚未推送到 GitHub 仓库，Actions 侧未实际触发过。
- 未覆盖多用户数据隔离、附件上传、性能/分页与大文件场景、API/gRPC 层。

## 简历可写点

- 基于 Playwright Test 为自托管 Memos 搭建 64 条 UI 回归用例，覆盖 11 个模块（CRUD、标签、置顶/归档、可见性、Markdown/XSS、搜索边界、会话与响应式），整轮 65 个执行全过，单轮约 6.3 分钟。
- 接入本机计划任务与 GitHub Actions 做每日回归，自动起服务、归档 HTML/JSON 报告、清理测试数据，以退出码作为流水线门禁。
- 在边界测试中定位真实缺陷 1 个（纯空格可保存为空 memo），用例用 `test.fail()` 登记，修复后自动转绿提醒。
- 用 storageState 复用登录态、唯一时间戳前缀保证可重复执行；对断言做反向验证排除空转，并沉淀弹窗动画时序等待，消除了 45 秒超时与偶发失败。
- 接入 Playwright MCP 做探索式测试，验证 MCP 调用 → 浏览器 → 被测系统的完整链路。
