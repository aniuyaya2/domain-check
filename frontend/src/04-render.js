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

    summaryEl.innerHTML = cards.map(c => `
        <div class="summary-card ${activeFilter === c.filter ? 'active' : ''}" style="--color:${c.color}" data-filter="${c.filter}">
            <h3><i class="fa ${c.icon}"></i> ${c.text}</h3>
            <p>${c.count}</p>
        </div>`).join('');
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
        `<button class="tab-btn ${state.group === g ? 'active' : ''}" data-group="${escapeHtml(g)}">${escapeHtml(g)}</button>`
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
        ? parseGroups(info.groups).map(g => `<span class="group-tag">${esc(g)}</span>`).join('')
        : '<span class="group-tag tag-ungrouped">未分组</span>';

    const actionsHTML = IS_ADMIN ? `
        <div class="card-actions">
            <input type="checkbox" class="card-checkbox" data-domain="${esc(info.domain)}" aria-label="选择 ${esc(info.domain)}">
            <div class="card-action-icons">
                <i class="fas fa-copy card-action-icon copy-icon" data-domain="${esc(info.domain)}" title="克隆此卡片"></i>
                <i class="fas fa-sync-alt card-action-icon renew-icon" data-domain="${esc(info.domain)}" title="续期"></i>
                <i class="fas fa-edit card-action-icon edit-icon" data-domain="${esc(info.domain)}" title="编辑"></i>
                <i class="fas fa-trash-alt card-action-icon delete-icon" data-domain="${esc(info.domain)}" title="删除"></i>
            </div>
        </div>` : '';

    return `
        <article class="domain-card" style="--status-color:${statusColor}">
            <div class="card-header">
                <span class="${domainClass}" data-domain="${dataDomain}" title="${IS_ADMIN ? '点击复制域名' : ''}">${displayDomain}</span>
                <span class="card-status">${statusText}</span>
            </div>
            <div class="card-info">
                <p><i class="fa fa-registered"></i> 注册商 <a href="${systemURL}" target="_blank" rel="noopener noreferrer">${info.system ? esc(info.system) : 'N/A'}</a></p>
                <p><i class="fa fa-user"></i> 注册账号 ${displayAccount}</p>
                <p><i class="fa fa-calendar"></i> 注册时间 ${info.registrationDate ? esc(info.registrationDate) : 'N/A'}</p>
                <p><i class="fa fa-calendar-check"></i> 到期时间 ${info.expirationDate ? esc(info.expirationDate) : 'N/A'}</p>
                <p class="card-groups">${groupsHTML}</p>
            </div>
            <div class="card-footer">
                <div class="progress-bar-container" role="progressbar" aria-label="已使用 ${percentText}">
                    <div class="progress-bar" style="width:${progress}%"></div>
                    <span class="progress-percent-display">${percentText}</span>
                </div>
                <div class="progress-text">已使用 ${elapsedText} | 剩余 ${remainingText}</div>
                ${actionsHTML}
            </div>
        </article>`;
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
    let html = `<button class="page-btn" ${state.page === 1 ? 'disabled' : ''} data-page="${state.page - 1}" aria-label="上一页"><i class="fas fa-chevron-left"></i></button>`;
    if (startPage > 1) {
        html += `<button class="page-btn" data-page="1">1</button>`;
        if (startPage > 2) html += '<span class="page-dots">...</span>';
    }
    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="page-btn ${state.page === i ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += '<span class="page-dots">...</span>';
        html += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
    }
    html += `<button class="page-btn" ${state.page === totalPages ? 'disabled' : ''} data-page="${state.page + 1}" aria-label="下一页"><i class="fas fa-chevron-right"></i></button>`;
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
