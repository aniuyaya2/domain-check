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
        `<div class="autocomplete-dropdown-item" data-value="${escapeHtml(item)}">${escapeHtml(item)}</div>`
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
    tag.innerHTML = `${escapeHtml(name)}<span class="group-tag-remove">&times;</span>`;
    tag.querySelector('.group-tag-remove').addEventListener('click', () => removeGroupTag(name));
    tagList.appendChild(tag);
    tagList.classList.add('has-tags');
    updateGroupsHiddenInput();
}
function removeGroupTag(name) {
    const tag = document.querySelector(`#groupsTagList .group-tag[data-group="${CSS.escape(name)}"]`);
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
