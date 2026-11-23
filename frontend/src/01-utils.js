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
    return /^(?!-)(?!.*--)([a-zA-Z0-9-]{1,63}\.)+[a-zA-Z]{2,}$/.test(domain.toLowerCase());
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
