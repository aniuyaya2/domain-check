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
        showSuccess(`${domain} 已续费${duration}${unit === 'year' ? '年' : '月'}\n到期时间：${result.newExpirationDate}`);
        state.lastOperated = domain;
        await fetchDomains();
    } catch (error) {
        showError('续费失败: ' + error.message);
    }
}
