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
                    if (await showConfirm(`确定要删除域名 ${domain} 吗？`)) await deleteDomain(domain);
                }
                return;
            }
            // 点击域名复制
            const domainEl = e.target.closest('.card-domain');
            if (domainEl && domainEl.dataset.domain) {
                navigator.clipboard.writeText(domainEl.dataset.domain);
                showAlert(`已复制域名: ${domainEl.dataset.domain}`);
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
