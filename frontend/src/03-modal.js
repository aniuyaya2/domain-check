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
        toastContainer.innerHTML = `
            <div class="toast-overlay">
                <div class="toast-card">
                    <div class="toast-icon"><i class="fas ${meta.icon}" style="color:${meta.color}"></i></div>
                    <div class="toast-message"></div>
                    <div class="toast-actions"></div>
                </div>
            </div>`;
        const overlay = $('.toast-overlay', toastContainer);
        $('.toast-message', toastContainer).textContent = message;

        const actions = $('.toast-actions', toastContainer);
        const close = (value) => { overlay.classList.remove('show'); setTimeout(() => toastContainer.innerHTML = '', 200); resolve(value); };
        if (type === 'confirm') {
            actions.innerHTML = `
                <button class="toast-btn toast-btn-cancel">取消</button>
                <button class="toast-btn toast-btn-primary">确定</button>`;
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
