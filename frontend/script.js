export const HTML_JS = `
// 00-config.js — 常量与状态
// 所有可变状态收敛到单一 store，渲染只依赖 store

const DOMAINS_API = '/api/domains';
const CONFIG_API = '/api/config';
const ITEMS_PER_PAGE = 12;

// 状态元数据：text 展示文案，color 驱动卡片主题色（--status-color）
const STATUS_META = {
    expired:  { text: '已到期', color: '#e5484d' },
    warning:  { text: '将到期', color: '#f5a623' },
    normal:   { text: '正常',   color: '#30a46c' },
    missing:  { text: '信息缺失', color: '#8f9499' },
    invalid:  { text: '日期格式错误', color: '#8f9499' },
};

// 排序优先级：已到期 > 将到期 > 正常
const STATUS_PRIORITY = { expired: 1, warning: 2, normal: 3 };

// 全局应用状态
const state = {
    allDomains: [],
    filtered: [],
    page: 1,
    group: '全部',
    search: '',
    statusFilter: '',
    config: { daysThreshold: 30 },
    lastOperated: null,
};

// DOM 快捷选择器
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// 01-utils.js — 纯工具函数（无 DOM、无副作用）

// 格式化日期为 YYYY-MM-DD
function formatDate(date) {
    const d = new Date(date);
    return [d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, '0'),
        String(d.getDate()).padStart(2, '0')].join('-');
}

// 域名格式验证
function isValidDomainFormat(domain) {
    return /^(?!-)(?!.*--)([a-zA-Z0-9-]{1,63}\\.)+[a-zA-Z]{2,}$/.test(domain.toLowerCase());
}

// 判断域名层级
function getDomainLevel(domain) {
    return domain.split('.').length <= 2 ? '一级域名' : '二级域名';
}
function isPrimaryDomain(domain) {
    return getDomainLevel(domain) === '一级域名';
}

// 公开模式：域名前缀脱敏，只保留 TLD
function maskDomain(domain) {
    const parts = domain.split('.');
    if (parts.length < 2) return domain;
    const tld = parts.pop();
    return [...parts.map(() => '*****'), tld].join('.');
}

// 公开模式：账号脱敏
function maskAccount(account) {
    return account ? '***********' : '';
}

// 解析 groups 字符串 → 数组
function parseGroups(groupsStr) {
    return (groupsStr || '').split(',').map(g => g.trim()).filter(Boolean);
}

// 计算状态（含剩余天数）
function getDomainStatus(expirationDateStr) {
    if (!expirationDateStr) return { key: 'missing', statusText: '信息缺失', statusColor: STATUS_META.missing.color, daysRemaining: 'N/A' };
    const expirationTime = Date.parse(expirationDateStr);
    if (isNaN(expirationTime)) return { key: 'invalid', statusText: '日期格式错误', statusColor: STATUS_META.invalid.color, daysRemaining: 'N/A' };

    const now = new Date();
    const todayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const daysRemaining = Math.ceil((expirationTime - todayUTC) / 86400000);

    let key = 'normal';
    if (daysRemaining <= 0) key = 'expired';
    else if (daysRemaining <= state.config.daysThreshold) key = 'warning';

    const meta = STATUS_META[key];
    return { key, statusText: meta.text, statusColor: meta.color, daysRemaining };
}

// 域名排序：置顶最近操作 > 状态优先级 > 一级优先 > 注册商字典序
function sortDomains(domains) {
    const priority = (d) => STATUS_PRIORITY[getDomainStatus(d.expirationDate).key] ?? 4;
    return domains.sort((a, b) => {
        if (state.lastOperated) {
            if (a.domain === state.lastOperated) return -1;
            if (b.domain === state.lastOperated) return 1;
        }
        const p = priority(a) - priority(b);
        if (p !== 0) return p;
        if (p === 3) {
            const aPrimary = isPrimaryDomain(a.domain), bPrimary = isPrimaryDomain(b.domain);
            if (aPrimary !== bPrimary) return aPrimary ? -1 : 1;
        }
        return (a.system || '').localeCompare(b.system || '');
    });
}

// HTML 转义（卡片渲染入 HTML 前统一处理用户输入）
function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// 02-api.js — API 层：统一请求封装 + 所有后端交互

// 统一请求：非 2xx 时抛出带服务器错误信息的 Error
async function request(url, options = {}) {
    const response = await fetch(url, {
        headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
        ...options,
    });
    let data = {};
    try { data = await response.json(); } catch (_) { /* 无 JSON body */ }
    if (!response.ok) {
        const error = new Error(data.error || response.statusText || '请求失败');
        error.status = response.status;
        throw error;
    }
    return data;
}

// 加载全局配置
async function fetchConfig() {
    try {
        const config = await request(CONFIG_API);
        state.config = { ...state.config, ...config, daysThreshold: config.days ?? state.config.daysThreshold };
    } catch (error) {
        console.error('获取配置信息失败:', error);
    }
}

// 加载域名列表：公开页用服务端注入的脱敏数据，管理页走 API
async function fetchDomains() {
    if (typeof INITIAL_DOMAINS !== 'undefined' && INITIAL_DOMAINS !== null) {
        state.allDomains = sortDomains(INITIAL_DOMAINS.map(d => ({ ...d })));
    } else {
        try {
            const data = await request(DOMAINS_API);
            state.allDomains = sortDomains(data.map(d => ({ ...d })));
        } catch (error) {
            console.error('获取域名失败:', error);
            if (IS_ADMIN) showError('无法加载域名数据, 请检查API连接或登录状态');
            return;
        }
    }
    resetFiltersAndRender();
}

// 添加/编辑域名: POST
async function submitDomainForm(e) {
    e.preventDefault();
    const domainValue = $('#domain').value.trim();
    if (!isValidDomainFormat(domainValue)) {
        showAlert('请输入有效的域名格式，例如: example.com 或 sub.example.com');
        return;
    }

    const payload = {
        originalDomain: $('#editOriginalDomain').value || domainValue,
        domain: domainValue,
        registrationDate: $('#registrationDate').value,
        expirationDate: $('#expirationDate').value,
        system: $('#system').value,
        systemURL: $('#systemURL').value,
        registerAccount: $('#registerAccount').value,
        groups: $('#groups').value,
        renewalPeriod: $('#renewalPeriod').value ? parseInt($('#renewalPeriod').value) : null,
        renewalUnit: $('#renewalUnit').value || null,
    };
    // 一级域名的日期/注册商字段可留空，由 WHOIS 自动补全
    if (isPrimaryDomain(domainValue)) {
        ['registrationDate', 'expirationDate', 'system', 'systemURL']
            .forEach(key => { if (!payload[key]) payload[key] = ''; });
    }

    try {
        await request(DOMAINS_API, { method: 'POST', body: JSON.stringify(payload) });
        $('#domainFormModal').style.display = 'none';
        showSuccess(\`域名 \${payload.domain} 保存成功！\`);
        state.lastOperated = payload.domain;
        await fetchDomains();
    } catch (error) {
        if (error.status === 409) error.message = '域名已存在，请勿重复添加';
        if (error.status === 422 && !error.message.includes('失败')) error.message = error.message || '信息不完整，请检查必填项';
        console.error('保存域名失败:', error);
        showError('保存域名失败: ' + error.message);
    }
}

// 删除域名（单个或批量）: DELETE
async function deleteDomains(domains) {
    if (!domains.length) {
        showAlert('请先勾选要删除的域名');
        return;
    }
    if (!(await showConfirm(\`确定要删除选中的 \${domains.length} 个域名吗？\`))) return;
    try {
        const result = await request(DOMAINS_API, { method: 'DELETE', body: JSON.stringify(domains) });
        showSuccess(\`成功删除 \${result.deletedCount || domains.length} 个域名\`);
        state.page = 1;
        await fetchDomains();
    } catch (error) {
        console.error('删除域名失败:', error);
        showError('删除域名失败: ' + error.message);
    }
}

// 单个删除（卡片图标触发）
async function deleteDomain(domain) {
    try {
        const result = await request(DOMAINS_API, { method: 'DELETE', body: JSON.stringify([domain]) });
        showSuccess(\`域名 \${domain} 已删除！\`);
        state.page = 1;
        await fetchDomains();
    } catch (error) {
        if (error.status === 404) showAlert(\`域名 \${domain} 未找到或已被删除\`);
        else { console.error('删除域名失败:', error); showError('删除域名失败: ' + error.message); }
    }
}

// 续费: PATCH
async function renewDomain(domain, duration, unit) {
    return request(DOMAINS_API, { method: 'PATCH', body: JSON.stringify({ domain, duration, unit }) });
}

// 导出: GET /api/domains → 下载 JSON
async function exportData() {
    try {
        const data = await request(DOMAINS_API);
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = \`domain_list_backup_\${new Date().toISOString().split('T')[0]}.json\`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        showSuccess('域名数据已成功导出为 JSON 文件！');
    } catch (error) {
        console.error('导出数据失败:', error);
        showError('导出数据失败: ' + error.message);
    }
}

// 导入: PUT /api/domains（替换全部数据）
function importData() {
    const fileInput = $('#importFileInput');
    if (!fileInput) return;
    fileInput.click();
    fileInput.onchange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        if (!(await showConfirm(\`确定要导入文件 \${file.name} 吗？\\n警告: 这将替换所有现有域名数据!\`))) {
            fileInput.value = '';
            return;
        }
        try {
            const domainsToImport = JSON.parse(await file.text());
            if (!Array.isArray(domainsToImport)) throw new Error('JSON 文件格式错误，须为域名数组');
            const result = await request(DOMAINS_API, { method: 'PUT', body: JSON.stringify(domainsToImport) });
            showSuccess(\`数据导入成功！共导入 \${result.count} 个域名\`);
            await fetchDomains();
        } catch (error) {
            console.error('导入文件处理失败:', error);
            showError('导入文件处理失败: ' + error.message);
        } finally {
            fileInput.value = '';
        }
    };
}

// 03-modal.js — 统一对话框（替代 alert/confirm）
// 单一容器 + data-type 驱动样式，事件只在按钮上绑定

let toastContainer = null;

const TOAST_TYPES = {
    alert:   { icon: 'fa-info-circle',            color: '#186db3' },
    confirm: { icon: 'fa-exclamation-triangle',   color: '#f5a623' },
    error:   { icon: 'fa-times-circle',           color: '#e5484d' },
    success: { icon: 'fa-check-circle',           color: '#30a46c' },
};

function ensureToastContainer() {
    if (toastContainer) return;
    toastContainer = document.createElement('div');
    toastContainer.id = 'customToastContainer';
    document.body.appendChild(toastContainer);
}

// type: 'alert' | 'confirm' | 'error' | 'success'
// confirm resolve boolean，其余 resolve undefined
function showModal(type, message) {
    return new Promise((resolve) => {
        ensureToastContainer();
        const meta = TOAST_TYPES[type] || TOAST_TYPES.alert;
        toastContainer.innerHTML = \`
            <div class="toast-overlay">
                <div class="toast-card">
                    <div class="toast-icon"><i class="fas \${meta.icon}" style="color:\${meta.color}"></i></div>
                    <div class="toast-message"></div>
                    <div class="toast-actions"></div>
                </div>
            </div>\`;
        const overlay = $('.toast-overlay', toastContainer);
        $('.toast-message', toastContainer).textContent = message;

        const actions = $('.toast-actions', toastContainer);
        const close = (value) => { overlay.classList.remove('show'); setTimeout(() => toastContainer.innerHTML = '', 200); resolve(value); };
        if (type === 'confirm') {
            actions.innerHTML = \`
                <button class="toast-btn toast-btn-cancel">取消</button>
                <button class="toast-btn toast-btn-primary">确定</button>\`;
            $('.toast-btn-cancel', actions).onclick = () => close(false);
            $('.toast-btn-primary', actions).onclick = () => close(true);
        } else {
            actions.innerHTML = '<button class="toast-btn toast-btn-primary">确定</button>';
            $('.toast-btn-primary', actions).onclick = () => close();
        }
        // 下一帧再显示，触发过渡动画
        requestAnimationFrame(() => overlay.classList.add('show'));
    });
}

function showAlert(message)   { return showModal('alert', message); }
function showConfirm(message) { return showModal('confirm', message); }
function showError(message)   { return showModal('error', message); }
function showSuccess(message) { return showModal('success', message); }

// 04-render.js — 渲染层：store → DOM，纯函数式输出

// ===== 概览统计卡 =====
function renderSummary(domainsList) {
    const summaryEl = $('#summary');
    if (!summaryEl) return;

    const counts = { normal: 0, warning: 0, expired: 0 };
    domainsList.forEach(d => {
        const { key } = getDomainStatus(d.expirationDate);
        if (key === 'normal' || key === 'warning' || key === 'expired') counts[key]++;
    });

    const cards = [
        { filter: '全部',  text: '全部',   icon: 'fa-list-ol',              count: domainsList.length,   color: '#186db3' },
        { filter: '正常',  text: '正常',   icon: 'fa-check',                count: counts.normal + counts.warning, color: '#30a46c' },
        { filter: '将到期', text: '将到期', icon: 'fa-exclamation-triangle', count: counts.warning,       color: '#f5a623' },
        { filter: '已到期', text: '已到期', icon: 'fa-times',                count: counts.expired,       color: '#e5484d' },
    ];
    const activeFilter = state.statusFilter || '全部';

    summaryEl.innerHTML = cards.map(c => \`
        <div class="summary-card \${activeFilter === c.filter ? 'active' : ''}" style="--color:\${c.color}" data-filter="\${c.filter}">
            <h3><i class="fa \${c.icon}"></i> \${c.text}</h3>
            <p>\${c.count}</p>
        </div>\`).join('');
}

// ===== 分组标签页 =====
function renderGroupTabs() {
    const tabsEl = $('#groupTabs');
    if (!tabsEl) return;
    const fixed = ['全部', '一级域名', '二级域名', '未分组'];
    const custom = new Set();
    state.allDomains.forEach(d => parseGroups(d.groups).forEach(g => custom.add(g)));

    const groups = [...fixed, ...custom].filter(g => fixed.includes(g) || true);
    tabsEl.innerHTML = groups.map(g =>
        \`<button class="tab-btn \${state.group === g ? 'active' : ''}" data-group="\${escapeHtml(g)}">\${escapeHtml(g)}</button>\`
    ).join('');
}

// ===== 域名卡片 =====
function createDomainCard(info) {
    const { statusText, statusColor, daysRemaining } = getDomainStatus(info.expirationDate);
    const esc = escapeHtml;

    // 进度条计算
    let progress = 0, percentText = 'N/A', elapsedText = 'N/A', remainingText = daysRemaining;
    if (info.registrationDate && info.expirationDate) {
        const reg = new Date(info.registrationDate), exp = new Date(info.expirationDate), today = new Date();
        const totalDays = (exp - reg) / 86400000;
        const daysElapsed = (today - reg) / 86400000;
        progress = Math.min(100, Math.max(0, (daysElapsed / totalDays) * 100));
        percentText = progress.toFixed(1) + '%';
        if (daysRemaining > 0) {
            remainingText = daysRemaining + ' 天';
            elapsedText = Math.floor(daysElapsed) + ' 天';
        } else {
            remainingText = '已到期';
            elapsedText = Math.floor(totalDays) + ' 天';
        }
    } else {
        remainingText = 'N/A';
    }

    const displayDomain = IS_ADMIN ? esc(info.domain) : esc(maskDomain(info.domain));
    const displayAccount = IS_ADMIN
        ? (info.registerAccount ? esc(info.registerAccount) : 'N/A')
        : (info.registerAccount ? maskAccount(info.registerAccount) : 'N/A');
    const domainClass = IS_ADMIN ? 'card-domain' : 'card-domain-masked';
    const dataDomain = IS_ADMIN ? esc(info.domain) : '';
    const systemURL = info.systemURL ? esc(info.systemURL) : '#';
    const groupsHTML = parseGroups(info.groups).length
        ? parseGroups(info.groups).map(g => \`<span class="group-tag">\${esc(g)}</span>\`).join('')
        : '<span class="group-tag tag-ungrouped">未分组</span>';

    const actionsHTML = IS_ADMIN ? \`
        <div class="card-actions">
            <input type="checkbox" class="card-checkbox" data-domain="\${esc(info.domain)}" aria-label="选择 \${esc(info.domain)}">
            <div class="card-action-icons">
                <i class="fas fa-copy card-action-icon copy-icon" data-domain="\${esc(info.domain)}" title="克隆此卡片"></i>
                <i class="fas fa-sync-alt card-action-icon renew-icon" data-domain="\${esc(info.domain)}" title="续期"></i>
                <i class="fas fa-edit card-action-icon edit-icon" data-domain="\${esc(info.domain)}" title="编辑"></i>
                <i class="fas fa-trash-alt card-action-icon delete-icon" data-domain="\${esc(info.domain)}" title="删除"></i>
            </div>
        </div>\` : '';

    return \`
        <article class="domain-card" style="--status-color:\${statusColor}">
            <div class="card-header">
                <span class="\${domainClass}" data-domain="\${dataDomain}" title="\${IS_ADMIN ? '点击复制域名' : ''}">\${displayDomain}</span>
                <span class="card-status">\${statusText}</span>
            </div>
            <div class="card-info">
                <p><i class="fa fa-registered"></i> 注册商 <a href="\${systemURL}" target="_blank" rel="noopener noreferrer">\${info.system ? esc(info.system) : 'N/A'}</a></p>
                <p><i class="fa fa-user"></i> 注册账号 \${displayAccount}</p>
                <p><i class="fa fa-calendar"></i> 注册时间 \${info.registrationDate ? esc(info.registrationDate) : 'N/A'}</p>
                <p><i class="fa fa-calendar-check"></i> 到期时间 \${info.expirationDate ? esc(info.expirationDate) : 'N/A'}</p>
                <p class="card-groups">\${groupsHTML}</p>
            </div>
            <div class="card-footer">
                <div class="progress-bar-container" role="progressbar" aria-label="已使用 \${percentText}">
                    <div class="progress-bar" style="width:\${progress}%"></div>
                    <span class="progress-percent-display">\${percentText}</span>
                </div>
                <div class="progress-text">已使用 \${elapsedText} | 剩余 \${remainingText}</div>
                \${actionsHTML}
            </div>
        </article>\`;
}

function renderDomainCards() {
    const listEl = $('#domainList');
    if (!listEl) return;
    const start = (state.page - 1) * ITEMS_PER_PAGE;
    const pageItems = state.filtered.slice(start, start + ITEMS_PER_PAGE);

    listEl.innerHTML = pageItems.length
        ? pageItems.map(createDomainCard).join('')
        : '<p class="empty-state">没有符合条件的域名记录</p>';
    renderPagination();
}

// ===== 分页 =====
function renderPagination() {
    const paginationEl = $('#pagination');
    if (!paginationEl) return;
    const totalPages = Math.ceil(state.filtered.length / ITEMS_PER_PAGE);
    if (totalPages <= 1) { paginationEl.innerHTML = ''; return; }

    const startPage = Math.max(1, state.page - 2);
    const endPage = Math.min(totalPages, state.page + 2);
    let html = \`<button class="page-btn" \${state.page === 1 ? 'disabled' : ''} data-page="\${state.page - 1}" aria-label="上一页"><i class="fas fa-chevron-left"></i></button>\`;
    if (startPage > 1) {
        html += \`<button class="page-btn" data-page="1">1</button>\`;
        if (startPage > 2) html += '<span class="page-dots">...</span>';
    }
    for (let i = startPage; i <= endPage; i++) {
        html += \`<button class="page-btn \${state.page === i ? 'active' : ''}" data-page="\${i}">\${i}</button>\`;
    }
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += '<span class="page-dots">...</span>';
        html += \`<button class="page-btn" data-page="\${totalPages}">\${totalPages}</button>\`;
    }
    html += \`<button class="page-btn" \${state.page === totalPages ? 'disabled' : ''} data-page="\${state.page + 1}" aria-label="下一页"><i class="fas fa-chevron-right"></i></button>\`;
    paginationEl.innerHTML = html;
}

// ===== 过滤管线：group + search → summary 数据 → statusFilter → 卡片 =====
function applyFiltersAndRender() {
    const searchTerm = state.search.toLowerCase();

    const matchesGroupAndSearch = (domain) => {
        const groups = parseGroups(domain.groups);
        const level = getDomainLevel(domain.domain);
        if (state.group === '一级域名' && level !== '一级域名') return false;
        if (state.group === '二级域名' && level !== '二级域名') return false;
        if (state.group === '未分组' && groups.length !== 0) return false;
        if (state.group !== '全部' && !['一级域名', '二级域名', '未分组'].includes(state.group) && !groups.includes(state.group)) return false;

        if (searchTerm) {
            return domain.domain.toLowerCase().includes(searchTerm)
                || (domain.system || '').toLowerCase().includes(searchTerm)
                || (domain.registerAccount || '').toLowerCase().includes(searchTerm)
                || (domain.groups || '').toLowerCase().includes(searchTerm);
        }
        return true;
    };

    const baseList = state.allDomains.filter(matchesGroupAndSearch);
    renderSummary(baseList);
    state.filtered = baseList.filter(domain => {
        if (!state.statusFilter || state.statusFilter === '全部') return true;
        const { key } = getDomainStatus(domain.expirationDate);
        if (state.statusFilter === '正常') return key === 'normal' || key === 'warning';
        if (state.statusFilter === '将到期') return key === 'warning';
        if (state.statusFilter === '已到期') return key === 'expired';
        return true;
    });
    renderDomainCards();
}

function resetFiltersAndRender() {
    state.lastOperated = null;
    state.statusFilter = '';
    state.group = '全部';
    renderGroupTabs();
    applyFiltersAndRender();
}

// 05-form.js — 添加/编辑/克隆表单 + 分组标签 + 自动补全

// 填充表单公共字段
function fillFormFields(info) {
    $('#registrationDate').value = info?.registrationDate || '';
    $('#expirationDate').value = info?.expirationDate || '';
    $('#system').value = info?.system || '';
    $('#systemURL').value = info?.systemURL || '';
    $('#registerAccount').value = info?.registerAccount || '';
    $('#renewalPeriod').value = info?.renewalPeriod || '';
    $('#renewalUnit').value = info?.renewalUnit || 'year';
    initGroupsTags(info?.groups || '');
}

// 打开表单：mode = 'add' | 'edit' | 'clone'
function openDomainForm(domainInfo = null, mode = domainInfo ? 'edit' : 'add') {
    const modal = $('#domainFormModal');
    if (!modal) return;
    $('#domainForm').reset();
    const warningEl = $('#domainFillWarning');
    if (warningEl) warningEl.style.display = 'none';

    const titles = { add: '添加域名', edit: '编辑域名', clone: '克隆域名' };
    modal.querySelector('h2').textContent = titles[mode];

    $('#domain').disabled = false;
    if (mode === 'edit') {
        $('#editOriginalDomain').value = domainInfo.domain;
        $('#domain').value = domainInfo.domain;
    } else {
        $('#editOriginalDomain').value = '';
        $('#domain').value = '';
    }
    fillFormFields(mode === 'add' ? null : domainInfo);

    updateFormRequiredStatus($('#domain').value);
    modal.style.display = 'block';
    if (mode === 'clone') $('#domain').focus();
}
function openDomainFormWithCopy(domainInfo) { openDomainForm(domainInfo, 'clone'); }

// 根据域名值动态切换必填项与提示
function updateFormRequiredStatus(domainValue) {
    const value = domainValue.trim();
    const requiredFields = ['registrationDate', 'expirationDate', 'system', 'systemURL'];
    const warningEl = $('#domainFillWarning');
    const originalDomain = $('#editOriginalDomain').value;
    const exists = state.allDomains.some(d => d.domain === value && d.domain !== originalDomain);

    const apply = (required, placeholder, warningText, warningColor) => {
        requiredFields.forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.required = required; el.placeholder = placeholder; }
        });
        if (warningEl) {
            if (warningText) {
                warningEl.textContent = warningText;
                warningEl.style.color = warningColor;
                warningEl.style.display = 'block';
            } else {
                warningEl.style.display = 'none';
            }
        }
    };

    if (!value) return apply(true, '二级域名必填', null);
    if (exists) return apply(false, '已存在，无需填写', '域名已存在，请勿重复添加', '#e5484d');
    if (isPrimaryDomain(value)) {
        apply(false, '一级域名可留空', '检测为一级域名，可不填写日期和注册商，将使用 WHOIS API 自动获取', '#f5a623');
    } else {
        apply(true, '二级域名必填', '检测为二级域名，日期和注册商为必填项, 无法使用 WHOIS API 自动获取', '#e5484d');
    }
}

// 注册日期 + 续费周期 → 自动计算到期日期
function calculateExpirationDate() {
    const regDateStr = $('#registrationDate').value;
    const period = parseInt($('#renewalPeriod').value);
    const unit = $('#renewalUnit').value;
    if (regDateStr && period > 0 && unit) {
        const regDate = new Date(regDateStr);
        const exp = new Date(regDateStr);
        if (unit === 'year') exp.setFullYear(regDate.getFullYear() + period);
        else if (unit === 'month') exp.setMonth(regDate.getMonth() + period);
        $('#expirationDate').value = formatDate(exp);
    }
}

// ===== 从现有数据收集去重列表（自动补全数据源） =====
function collectUnique(field, transform = v => v) {
    const set = new Set();
    state.allDomains.forEach(d => { if (d[field]) set.add(transform(d[field])); });
    return Array.from(set).sort();
}
function getAllExistingSystems()         { return collectUnique('system'); }
function getAllExistingSystemURLs()      { return collectUnique('systemURL'); }
function getAllExistingRegisterAccounts(){ return collectUnique('registerAccount'); }

// ===== 通用自动补全下拉 =====
function showAutocompleteDropdown(inputId, dropdownId, dataFn) {
    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(dropdownId);
    const filter = input.value.toLowerCase();
    const currentTags = inputId === 'groupsInput' ? getCurrentGroupTags() : [];
    let items = dataFn().filter(item => !currentTags.includes(item));
    if (filter) items = items.filter(item => item.toLowerCase().includes(filter));

    if (items.length === 0) { dropdown.style.display = 'none'; return; }
    dropdown.innerHTML = items.map(item =>
        \`<div class="autocomplete-dropdown-item" data-value="\${escapeHtml(item)}">\${escapeHtml(item)}</div>\`
    ).join('');
    dropdown.style.display = 'block';
}
function hideAutocompleteDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    if (dropdown) dropdown.style.display = 'none';
}

// ===== 分组标签管理 =====
function getCurrentGroupTags() {
    return $$('#groupsTagList .group-tag').map(t => t.dataset.group);
}
function updateGroupsHiddenInput() {
    $('#groups').value = getCurrentGroupTags().join(', ');
}
function addGroupTag(name) {
    name = name.trim();
    if (!name || getCurrentGroupTags().includes(name)) return;
    const tagList = $('#groupsTagList');
    const tag = document.createElement('span');
    tag.className = 'group-tag';
    tag.dataset.group = name;
    tag.innerHTML = \`\${escapeHtml(name)}<span class="group-tag-remove">&times;</span>\`;
    tag.querySelector('.group-tag-remove').addEventListener('click', () => removeGroupTag(name));
    tagList.appendChild(tag);
    tagList.classList.add('has-tags');
    updateGroupsHiddenInput();
}
function removeGroupTag(name) {
    const tag = document.querySelector(\`#groupsTagList .group-tag[data-group="\${CSS.escape(name)}"]\`);
    if (tag) tag.remove();
    if (!$('#groupsTagList .group-tag')) $('#groupsTagList').classList.remove('has-tags');
    updateGroupsHiddenInput();
}
function initGroupsTags(groupsStr) {
    const tagList = $('#groupsTagList');
    tagList.innerHTML = '';
    tagList.classList.remove('has-tags');
    parseGroups(groupsStr).forEach(g => addGroupTag(g));
    updateGroupsHiddenInput();
}
function showGroupsDropdown(filter) {
    const groups = (() => {
        const set = new Set();
        state.allDomains.forEach(d => parseGroups(d.groups).forEach(g => set.add(g)));
        return Array.from(set).sort();
    })();
    showAutocompleteDropdown('groupsInput', 'groupsDropdown', () => groups);
}
function hideGroupsDropdown() {
    hideAutocompleteDropdown('groupsDropdown');
}

// 06-renewal.js — 续费弹窗

function openRenewModal(domainInfo) {
    const overlay = $('#renewOverlay');
    if (!overlay) return;
    $('#renewDomainName').textContent = domainInfo.domain;
    $('#renewDuration').value = 1;
    $('#renewUnitSelect').value = 'year';
    overlay.dataset.domain = domainInfo.domain;
    overlay.style.display = 'flex';
}

function closeRenewModal() {
    const overlay = $('#renewOverlay');
    if (overlay) overlay.style.display = 'none';
}

async function submitRenew() {
    const domain = $('#renewOverlay').dataset.domain;
    const duration = parseInt($('#renewDuration').value);
    const unit = $('#renewUnitSelect').value;
    if (!domain) return;
    if (!duration || duration < 1) {
        showAlert('请输入有效的续费时长');
        return;
    }
    try {
        const result = await renewDomain(domain, duration, unit);
        closeRenewModal();
        showSuccess(\`\${domain} 已续费\${duration}\${unit === 'year' ? '年' : '月'}\\n到期时间：\${result.newExpirationDate}\`);
        state.lastOperated = domain;
        await fetchDomains();
    } catch (error) {
        showError('续费失败: ' + error.message);
    }
}

// 07-events.js — 事件绑定（全部委托）+ 初始化

window.addEventListener('load', async () => {
    // ===== 卡片区域事件委托（编辑/续期/克隆/删除/复制域名） =====
    const listEl = $('#domainList');
    if (listEl) {
        listEl.addEventListener('click', async (e) => {
            if (!IS_ADMIN) return;
            const icon = e.target.closest('.card-action-icon');
            if (icon) {
                const domain = icon.dataset.domain;
                const domainInfo = state.allDomains.find(d => d.domain === domain);
                if (!domainInfo) return;
                if (icon.classList.contains('edit-icon')) openDomainForm(domainInfo, 'edit');
                else if (icon.classList.contains('renew-icon')) openRenewModal(domainInfo);
                else if (icon.classList.contains('copy-icon')) openDomainForm(domainInfo, 'clone');
                else if (icon.classList.contains('delete-icon')) {
                    if (await showConfirm(\`确定要删除域名 \${domain} 吗？\`)) await deleteDomain(domain);
                }
                return;
            }
            // 点击域名复制
            const domainEl = e.target.closest('.card-domain');
            if (domainEl && domainEl.dataset.domain) {
                navigator.clipboard.writeText(domainEl.dataset.domain);
                showAlert(\`已复制域名: \${domainEl.dataset.domain}\`);
            }
        });
    }

    // ===== 概览卡（状态筛选）与分组标签：委托 + 只改 state 后重渲染 =====
    const summaryEl = $('#summary');
    if (summaryEl) {
        summaryEl.addEventListener('click', (e) => {
            const card = e.target.closest('.summary-card');
            if (!card) return;
            state.statusFilter = card.dataset.filter;
            state.group = '全部';
            state.page = 1;
            renderGroupTabs();
            applyFiltersAndRender();
        });
    }
    const tabsEl = $('#groupTabs');
    if (tabsEl) {
        tabsEl.addEventListener('click', (e) => {
            const tab = e.target.closest('.tab-btn');
            if (!tab) return;
            state.group = tab.dataset.group;
            state.statusFilter = '';
            state.page = 1;
            renderGroupTabs();
            applyFiltersAndRender();
        });
    }

    // ===== 分页委托 =====
    const paginationEl = $('#pagination');
    if (paginationEl) {
        paginationEl.addEventListener('click', (e) => {
            const btn = e.target.closest('.page-btn');
            if (!btn || btn.disabled) return;
            const page = parseInt(btn.dataset.page);
            const totalPages = Math.ceil(state.filtered.length / ITEMS_PER_PAGE);
            if (page >= 1 && page <= totalPages) {
                state.page = page;
                renderDomainCards();
            }
        });
    }

    // ===== 搜索（300ms 防抖） =====
    const searchBox = $('#searchBox');
    if (searchBox) {
        let searchTimeout;
        searchBox.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                state.search = e.target.value.trim();
                state.page = 1;
                applyFiltersAndRender();
            }, 300);
        });
    }

    // ===== 管理模式专属事件 =====
    if (IS_ADMIN) {
        $('#addDomainBtn')?.addEventListener('click', () => openDomainForm());
        $('#exportDataBtn')?.addEventListener('click', exportData);
        $('#importDataBtn')?.addEventListener('click', importData);
        $('#logoutBtn')?.addEventListener('click', () => { window.location.href = '/logout'; });

        // 全选：切换当前页所有卡片勾选状态
        $('#selectAllBtn')?.addEventListener('click', () => {
            const checkboxes = $$('#domainList .card-checkbox');
            const allChecked = checkboxes.length > 0 && checkboxes.every(cb => cb.checked);
            checkboxes.forEach(cb => cb.checked = !allChecked);
        });

        // 批量删除
        $('#batchDeleteBtn')?.addEventListener('click', () => {
            const domains = $$('#domainList .card-checkbox:checked').map(cb => cb.dataset.domain);
            deleteDomains(domains);
        });

        // 编辑弹窗
        const modal = $('#domainFormModal');
        if (modal) {
            modal.querySelector('.close-btn').addEventListener('click', () => modal.style.display = 'none');
            window.addEventListener('click', (event) => {
                if (event.target === modal) modal.style.display = 'none';
            });
            $('#domainForm').addEventListener('submit', submitDomainForm);
        }

        // 续费弹窗
        const renewOverlay = $('#renewOverlay');
        if (renewOverlay) {
            $('#renewCancelBtn').addEventListener('click', closeRenewModal);
            $('#renewConfirmBtn').addEventListener('click', submitRenew);
            renewOverlay.addEventListener('click', (event) => {
                if (event.target === renewOverlay) closeRenewModal();
            });
        }

        // 域名输入 → 动态必填提示
        $('#domain')?.addEventListener('input', (e) => updateFormRequiredStatus(e.target.value));

        // 注册日期/续费周期 → 自动计算到期日期
        ['registrationDate', 'renewalPeriod', 'renewalUnit'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('change', calculateExpirationDate);
                el.addEventListener('input', calculateExpirationDate);
            }
        });

        // ===== 通用自动补全（focus/input/blur + 下拉点击委托） =====
        const autocompleteFields = [
            { input: 'system',          dropdown: 'systemDropdown',          data: getAllExistingSystems },
            { input: 'systemURL',       dropdown: 'systemURLDropdown',       data: getAllExistingSystemURLs },
            { input: 'registerAccount', dropdown: 'registerAccountDropdown', data: getAllExistingRegisterAccounts },
        ];
        autocompleteFields.forEach(({ input, dropdown, data }) => {
            const inputEl = document.getElementById(input);
            if (!inputEl) return;
            inputEl.addEventListener('focus', () => showAutocompleteDropdown(input, dropdown, data));
            inputEl.addEventListener('input', () => showAutocompleteDropdown(input, dropdown, data));
            inputEl.addEventListener('blur', () => setTimeout(() => hideAutocompleteDropdown(dropdown), 200));
            document.getElementById(dropdown)?.addEventListener('click', (e) => {
                const item = e.target.closest('.autocomplete-dropdown-item');
                if (item) {
                    inputEl.value = item.dataset.value;
                    hideAutocompleteDropdown(dropdown);
                    inputEl.focus();
                }
            });
        });

        // ===== 分组标签输入 =====
        const groupsInput = document.getElementById('groupsInput');
        if (groupsInput) {
            groupsInput.addEventListener('focus', () => showGroupsDropdown(groupsInput.value));
            groupsInput.addEventListener('input', (e) => showGroupsDropdown(e.target.value));
            groupsInput.addEventListener('keydown', (e) => {
                const commit = () => {
                    e.preventDefault();
                    const val = e.target.value.replace(/,/g, '').trim();
                    if (val) {
                        addGroupTag(val);
                        e.target.value = '';
                        hideGroupsDropdown();
                    }
                };
                if (e.key === ' ' || e.key === ',') commit();
                if (e.key === 'Enter' && e.target.value.trim()) commit();
                if (e.key === 'Backspace' && !e.target.value) {
                    const tags = getCurrentGroupTags();
                    if (tags.length > 0) removeGroupTag(tags[tags.length - 1]);
                }
            });
            groupsInput.addEventListener('blur', () => setTimeout(hideGroupsDropdown, 200));
            document.getElementById('groupsDropdown')?.addEventListener('click', (e) => {
                const item = e.target.closest('.autocomplete-dropdown-item');
                if (item) {
                    addGroupTag(item.dataset.value);
                    groupsInput.value = '';
                    hideGroupsDropdown();
                    groupsInput.focus();
                }
            });
        }
    } else {
        // 公开模式：登录跳转
        $('#loginBtn')?.addEventListener('click', () => { window.location.href = '/admin'; });
    }

    // ===== 启动 =====
    await fetchConfig();
    await fetchDomains();
});

`;
