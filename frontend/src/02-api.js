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
        showSuccess(`域名 ${payload.domain} 保存成功！`);
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
    if (!(await showConfirm(`确定要删除选中的 ${domains.length} 个域名吗？`))) return;
    try {
        const result = await request(DOMAINS_API, { method: 'DELETE', body: JSON.stringify(domains) });
        showSuccess(`成功删除 ${result.deletedCount || domains.length} 个域名`);
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
        showSuccess(`域名 ${domain} 已删除！`);
        state.page = 1;
        await fetchDomains();
    } catch (error) {
        if (error.status === 404) showAlert(`域名 ${domain} 未找到或已被删除`);
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
        a.download = `domain_list_backup_${new Date().toISOString().split('T')[0]}.json`;
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
        if (!(await showConfirm(`确定要导入文件 ${file.name} 吗？\n警告: 这将替换所有现有域名数据!`))) {
            fileInput.value = '';
            return;
        }
        try {
            const domainsToImport = JSON.parse(await file.text());
            if (!Array.isArray(domainsToImport)) throw new Error('JSON 文件格式错误，须为域名数组');
            const result = await request(DOMAINS_API, { method: 'PUT', body: JSON.stringify(domainsToImport) });
            showSuccess(`数据导入成功！共导入 ${result.count} 个域名`);
            await fetchDomains();
        } catch (error) {
            console.error('导入文件处理失败:', error);
            showError('导入文件处理失败: ' + error.message);
        } finally {
            fileInput.value = '';
        }
    };
}
