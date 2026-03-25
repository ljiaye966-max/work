const signals = [
  {
    id: 'price-1001',
    type: 'price',
    typeLabel: '价格',
    title: '到手价低于毛利约束',
    sku: 'SKU-1001 · 便携咖啡机',
    window: '示例窗口：近 24 小时',
    severity: '高优先级',
    status: '待人工审批',
    summary: '活动券叠加后，示例到手价为 ¥86。若采购与平台费用按当前记录计算，毛利率可能低于工作区设定的 18% 底线。',
    evidence: [
      '先核对同一规格和同一渠道的到手价，避免将标价与券后价混比。',
      '采购成本示例为 ¥75；平台费用、运费与券承担方仍需从业务系统确认。',
      '活动状态与库存快照可能滞后，正式判断前应重新读取来源数据。',
    ],
    action: '建议暂停自动改价，先由运营确认促销承担方和完整成本，再决定调整券或价格。',
    guardrail: '执行改价前校验最低毛利率、平台价格区间、活动规则和当前 SKU 数据版本。',
  },
  {
    id: 'stock-2048',
    type: 'stock',
    typeLabel: '库存',
    title: '可售库存覆盖不足',
    sku: 'SKU-2048 · 收纳套装',
    window: '示例窗口：近 7 天',
    severity: '需关注',
    status: '待人工审批',
    summary: '以示例可售库存和近 7 日平均销量估算，库存覆盖约 2.4 天。锁定库存与在途补货尚未完成核对。',
    evidence: [
      '区分可售、锁定、残次和在途库存，避免把总库存当可售库存。',
      '近 7 日平均销量可能受到促销影响，应与近 30 日基线一起查看。',
      '供应商交期与仓库入库上限仍需确认。',
    ],
    action: '建议生成补货提案供采购审核；确认在途数量、交期与仓储容量后再下单。',
    guardrail: '执行补货前校验在途订单、供应商交期、采购预算及仓储上限。',
  },
  {
    id: 'ads-3102',
    type: 'ads',
    typeLabel: '投放',
    title: '预算消耗快于转化',
    sku: '广告组 AD-3102 · 秋季上新',
    window: '示例窗口：近 3 天',
    severity: '需关注',
    status: '调查中',
    summary: '示例广告花费上升，订单转化暂未同步增长。归因窗口尚未结束，不能只凭即时 ROAS 下结论。',
    evidence: [
      '按渠道、广告组和归因窗口拆分花费与成交，检查数据延迟。',
      '核对活动期间自然流量和付费流量是否互相替代。',
      '排查目标商品库存与落地页状态。',
    ],
    action: '建议先收集完整归因窗口数据，若低效持续，再提交限额调整草案。',
    guardrail: '调预算前校验账户预算上限、当前消耗、授权人及生效时间窗。',
  },
  {
    id: 'price-4117',
    type: 'price',
    typeLabel: '价格',
    title: '竞品低价信号待核对',
    sku: 'SKU-4117 · 旅行保温杯',
    window: '示例窗口：近 12 小时',
    severity: '观察中',
    status: '无需审批',
    summary: '竞品页面展示较低价格，但规格、会员权益与优惠券门槛尚未对齐，暂不形成改价建议。',
    evidence: [
      '检查容量、颜色和套装数量是否对应同一规格。',
      '确认低价是否依赖会员、满减或限时券。',
      '保留采集时间和来源，避免用过期页面作当前判断。',
    ],
    action: '建议保持观察，并补齐促销条件与规格映射；证据不足时不触发改价。',
    guardrail: '只有同规格、同币种、同活动口径且数据仍有效，才进入正式价格比较。',
  },
];

const memories = [
  { kind: 'fact', label: '事实', title: '采购成本口径', text: 'SKU-1001 的成本示例来自 ERP 快照；判断毛利时还需加入平台费用、运费和优惠券承担额。', revision: 'rev 4' },
  { kind: 'decision', label: '决策', title: '毛利审批底线', text: '工作区示例规则：预测毛利率低于 18% 的价格动作必须进入人工审批。', revision: 'rev 3' },
  { kind: 'lesson', label: '经验', title: '促销价格核对', text: '比较竞品价格前先对齐 SKU 规格、会员资格、券门槛与采集时间。', revision: 'rev 2' },
  { kind: 'open_loop', label: '待跟进', title: '库存口径差异', text: '核对 ERP 与仓库系统对 SKU-2048 可售库存的差异，并记录最终来源。', revision: 'rev 1' },
];

const signalList = document.querySelector('#signal-list');
const memoryList = document.querySelector('#memory-list');
const toast = document.querySelector('#toast');
let selectedSignalId = signals[0].id;
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

function renderSignals(filter = 'all') {
  const visible = filter === 'all' ? signals : signals.filter((signal) => signal.type === filter);
  if (!visible.some((signal) => signal.id === selectedSignalId)) selectedSignalId = visible[0]?.id;
  signalList.replaceChildren(...visible.map((signal) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'signal-item';
    button.classList.toggle('selected', signal.id === selectedSignalId);
    button.setAttribute('aria-pressed', String(signal.id === selectedSignalId));
    const top = document.createElement('span');
    top.className = 'signal-item-top';
    const type = document.createElement('span');
    type.className = `type-tag ${signal.type}`;
    type.textContent = signal.typeLabel;
    const severity = document.createElement('span');
    severity.className = 'signal-priority';
    severity.textContent = signal.severity;
    top.append(type, severity);
    const title = document.createElement('strong');
    title.textContent = signal.title;
    const sku = document.createElement('small');
    sku.textContent = signal.sku;
    button.append(top, title, sku);
    button.addEventListener('click', () => {
      selectedSignalId = signal.id;
      renderSignals(filter);
      renderDetail(signal);
    });
    return button;
  }));
  if (selectedSignalId) renderDetail(signals.find((signal) => signal.id === selectedSignalId));
}

function renderDetail(signal) {
  if (!signal) return;
  document.querySelector('#detail-title').textContent = signal.title;
  document.querySelector('#detail-severity').textContent = signal.severity;
  document.querySelector('#detail-summary').textContent = signal.summary;
  document.querySelector('#detail-sku').textContent = signal.sku;
  document.querySelector('#detail-window').textContent = signal.window;
  document.querySelector('#detail-action').textContent = signal.action;
  document.querySelector('#detail-guardrail').textContent = signal.guardrail;
  document.querySelector('#detail-status').textContent = signal.status;
  const evidence = signal.evidence.map((item) => {
    const li = document.createElement('li');
    li.textContent = item;
    return li;
  });
  document.querySelector('#detail-evidence').replaceChildren(...evidence);
}

function renderMemories(kind = 'all') {
  const visible = kind === 'all' ? memories : memories.filter((item) => item.kind === kind);
  memoryList.replaceChildren(...visible.map((item) => {
    const article = document.createElement('article');
    article.className = 'memory-row';
    const label = document.createElement('span');
    label.className = `memory-kind ${item.kind}`;
    label.textContent = item.label;
    const content = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = item.title;
    const description = document.createElement('p');
    description.textContent = item.text;
    content.append(title, description);
    const revision = document.createElement('small');
    revision.textContent = item.revision;
    article.append(label, content, revision);
    return article;
  }));
}

document.querySelectorAll('.filter-button').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.filter-button').forEach((item) => {
      item.classList.toggle('active', item === button);
      item.setAttribute('aria-pressed', String(item === button));
    });
    renderSignals(button.dataset.filter);
  });
});

document.querySelectorAll('.memory-tab').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.memory-tab').forEach((item) => {
      item.classList.toggle('selected', item === button);
      item.setAttribute('aria-pressed', String(item === button));
    });
    renderMemories(button.dataset.kind);
  });
});

document.querySelector('#copy-action').addEventListener('click', async () => {
  const signal = signals.find((item) => item.id === selectedSignalId);
  if (!signal) return;
  const content = `${signal.title}（${signal.sku}）\n建议：${signal.action}\n前置校验：${signal.guardrail}\n说明：当前内容为 JyClaw 前端示例数据。`;
  try {
    await navigator.clipboard.writeText(content);
    showToast('建议草案已复制');
  } catch {
    showToast('当前浏览器不允许复制，请手动选择文字');
  }
});

document.querySelectorAll('.nav-item').forEach((link) => {
  link.addEventListener('click', () => {
    document.querySelector('.nav-item.active')?.classList.remove('active');
    link.classList.add('active');
  });
});

renderSignals();
renderMemories();
