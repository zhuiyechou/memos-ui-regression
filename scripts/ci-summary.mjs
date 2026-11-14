import fs from 'node:fs';

const SUMMARY = process.env.GITHUB_STEP_SUMMARY;
const FILE = 'ci-results.json';
const out = [];

function collect(suite, trail, failures) {
  for (const spec of suite.specs || []) {
    if (spec.ok !== false) continue;
    const title = [...trail, spec.title].filter(Boolean).join(' › ');
    const result = (spec.tests || []).flatMap((t) => t.results || []).find((r) => r.status !== 'passed' && r.status !== 'skipped');
    const message = result?.errors?.[0]?.message || result?.error?.message || '无错误信息';
    failures.push({ title, message: String(message).split('\n').slice(0, 14).join('\n') });
  }
  for (const child of suite.suites || []) collect(child, [...trail, suite.title], failures);
}

if (!fs.existsSync(FILE)) {
  out.push('### 回归结果', '', `未生成 ${FILE}，测试进程可能未正常结束。`);
} else {
  const report = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  const s = report.stats || {};
  const failures = [];
  collect({ suites: report.suites || [] }, [], failures);

  out.push(
    '### 回归结果',
    '',
    `预期通过/预期失败 ${s.expected ?? '?'} · 真实失败 ${s.unexpected ?? '?'} · 偶发 ${s.flaky ?? 0} · 跳过 ${s.skipped ?? 0}`,
  );

  if (failures.length) {
    out.push('', `#### 失败用例（${failures.length}）`);
    for (const f of failures) {
      out.push('', `- **${f.title}**`, '', '  ```text', ...f.message.split('\n').map((l) => `  ${l}`), '  ```');
    }
  } else {
    out.push('', '无失败用例。');
  }
}

const text = out.join('\n') + '\n';
console.log(text);
if (SUMMARY) fs.appendFileSync(SUMMARY, text);