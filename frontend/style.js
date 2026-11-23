export const HTML_CSS = `

/* ===== 设计令牌 ===== */
:root {
    --primary: #186db3;
    --primary-hover: #12507f;
    --primary-soft: rgba(24, 109, 179, 0.14);
    --danger: #e5484d;
    --danger-hover: #c5363b;
    --success: #30a46c;
    --warning: #f5a623;
    --purple: #8e5bc0;

    --text: #1f2733;
    --text-secondary: #5c6672;
    --border: rgba(31, 39, 51, 0.14);
    --border-strong: rgba(31, 39, 51, 0.26);

    --surface: rgba(255, 255, 255, 0.55);
    --surface-strong: rgba(255, 255, 255, 0.78);
    --surface-solid: #ffffff;
    --overlay: rgba(15, 20, 28, 0.45);

    --radius-s: 8px;
    --radius: 12px;
    --radius-l: 16px;
    --shadow-s: 0 1px 3px rgba(15, 20, 28, 0.12);
    --shadow: 0 2px 8px rgba(15, 20, 28, 0.14);
    --shadow-l: 0 12px 32px rgba(15, 20, 28, 0.22);

    --glass: blur(14px) saturate(1.3);
    --transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1);

    --font: "PingFang SC", "Microsoft YaHei", "Helvetica Neue", "Segoe UI", Arial,
            "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif;
    --content-width: 1200px;
    --content-pad: 20px;
}

* { font-family: var(--font); box-sizing: border-box; }
body { color: var(--text); }

/* ===== 顶部 ===== */
.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    max-width: var(--content-width);
    margin: 0 auto;
    padding: 28px var(--content-pad) 8px;
}
.header h1 {
    margin: 0;
    color: #fff;
    font-size: 1.6rem;
    display: flex;
    align-items: center;
    gap: 10px;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.45);
}
#siteTitle i { opacity: 0.9; }

.action-buttons { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.action-btn {
    padding: 9px 16px;
    border: none;
    border-radius: var(--radius-s);
    color: #fff;
    font-size: 0.9rem;
    cursor: pointer;
    box-shadow: var(--shadow-s);
    transition: background-color var(--transition), transform var(--transition), box-shadow var(--transition);
    display: inline-flex;
    align-items: center;
    gap: 6px;
}
.action-btn i { font-size: 0.85em; }
.action-btn:hover { transform: translateY(-1px); box-shadow: var(--shadow); }
.action-btn:active { transform: translateY(0); }
.add-btn, .login-btn { background-color: var(--primary); }
.add-btn:hover, .login-btn:hover { background-color: var(--primary-hover); }
.export-btn, .import-btn { background-color: var(--success); }
.export-btn:hover, .import-btn:hover { background-color: #268a58; }
.logout-btn, .del-btn { background-color: var(--danger); }
.logout-btn:hover, .del-btn:hover { background-color: var(--danger-hover); }
.select-btn { background-color: var(--purple); }
.select-btn:hover { background-color: #764aa6; }

/* ===== 概览统计卡 ===== */
.summary-container {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
    max-width: var(--content-width);
    margin: 0 auto;
    padding: 16px var(--content-pad);
}
.summary-card {
    background: var(--surface);
    -webkit-backdrop-filter: var(--glass);
    backdrop-filter: var(--glass);
    border: 1px solid rgba(255, 255, 255, 0.45);
    border-top: 4px solid var(--color);
    border-radius: var(--radius);
    padding: 14px 18px;
    text-align: center;
    cursor: pointer;
    box-shadow: var(--shadow-s);
    transition: transform var(--transition), box-shadow var(--transition), background-color var(--transition);
}
.summary-card h3 {
    margin: 0 0 6px;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--color);
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 6px;
}
.summary-card p { margin: 0; font-size: 1.9rem; font-weight: 700; color: var(--color); }
.summary-card:hover { transform: translateY(-3px); box-shadow: var(--shadow); background: var(--surface-strong); }
.summary-card.active {
    background: var(--color);
    border-color: var(--color);
}
.summary-card.active h3, .summary-card.active p { color: #fff; }

/* ===== 过滤区 ===== */
.controls-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    max-width: calc(var(--content-width) - 2 * var(--content-pad));
    margin: 0 auto 18px;
    padding: 12px 16px;
    background: var(--surface);
    -webkit-backdrop-filter: var(--glass);
    backdrop-filter: var(--glass);
    border: 1px solid rgba(255, 255, 255, 0.45);
    border-radius: var(--radius);
    box-shadow: var(--shadow-s);
}
.tabs-container { display: flex; flex-wrap: wrap; gap: 8px; }
.tab-btn {
    padding: 7px 14px;
    background: rgba(255, 255, 255, 0.5);
    border: 1px solid transparent;
    border-radius: var(--radius-s);
    font-size: 0.88rem;
    color: var(--text);
    cursor: pointer;
    transition: background-color var(--transition), color var(--transition), border-color var(--transition);
}
.tab-btn:hover { background: rgba(255, 255, 255, 0.85); }
.tab-btn.active {
    background: var(--primary);
    color: #fff;
    box-shadow: var(--shadow-s);
}
.search-container {
    display: flex;
    align-items: center;
    gap: 8px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    background: rgba(255, 255, 255, 0.6);
    padding: 6px 12px;
    min-width: 220px;
    transition: border-color var(--transition), box-shadow var(--transition);
}
.search-container:focus-within {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px var(--primary-soft);
}
.search-container i { color: var(--text-secondary); font-size: 0.9rem; }
#searchBox {
    border: none;
    outline: none;
    padding: 4px 0;
    font-size: 0.95rem;
    background: transparent;
    color: var(--text);
    flex-grow: 1;
}

/* ===== 域名卡片网格 ===== */
.domain-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
    gap: 18px;
    max-width: var(--content-width);
    margin: 0 auto;
    padding: 0 var(--content-pad) 18px;
}
.domain-card {
    display: flex;
    flex-direction: column;
    position: relative;
    background: var(--surface);
    -webkit-backdrop-filter: var(--glass);
    backdrop-filter: var(--glass);
    border: 1px solid rgba(255, 255, 255, 0.45);
    border-radius: var(--radius-l);
    padding: 18px;
    box-shadow: var(--shadow-s);
    transition: transform var(--transition), box-shadow var(--transition);
    overflow: hidden;
}
.domain-card::before {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    width: 4px;
    background: var(--status-color);
}
.domain-card:hover { transform: translateY(-3px); box-shadow: var(--shadow); }
.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--border);
}
.card-domain, .card-domain-masked {
    font-size: 1.05rem;
    font-weight: 700;
    word-break: break-all;
    line-height: 1.3;
}
.card-domain { color: var(--primary); cursor: pointer; transition: color var(--transition); }
.card-domain:hover { color: var(--primary-hover); text-decoration: underline; }
.card-domain-masked { color: var(--text-secondary); }
.card-status {
    flex-shrink: 0;
    padding: 3px 10px;
    border-radius: 999px;
    color: #fff;
    font-size: 0.75rem;
    font-weight: 600;
    line-height: 1.5;
    background: var(--status-color);
    white-space: nowrap;
}
.card-info p {
    margin: 5px 0;
    font-size: 0.82rem;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
}
.card-info i { width: 1em; text-align: center; opacity: 0.8; }
.card-info a {
    color: var(--primary);
    text-decoration: none;
    word-break: break-all;
}
.card-info a:hover { text-decoration: underline; }
.card-info strong { font-weight: 600; }
.card-groups { display: flex; flex-wrap: wrap; gap: 4px; }
.group-tag {
    display: inline-block;
    padding: 2px 9px;
    border-radius: 999px;
    font-size: 0.72rem;
    line-height: 1.5;
    color: var(--primary);
    background: var(--primary-soft);
    white-space: nowrap;
}
.group-tag.tag-ungrouped { background: rgba(92, 102, 114, 0.15); color: var(--text-secondary); }

.card-footer { margin-top: auto; padding-top: 10px; }
.progress-bar-container {
    position: relative;
    height: 14px;
    border-radius: 7px;
    background: rgba(255, 255, 255, 0.55);
    overflow: hidden;
}
.progress-bar {
    height: 100%;
    background: linear-gradient(90deg, color-mix(in srgb, var(--status-color) 75%, #fff), var(--status-color));
    border-radius: inherit;
    transition: width 0.5s ease;
}
.progress-percent-display {
    position: absolute;
    right: 6px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 0.68rem;
    font-weight: 700;
    color: var(--text);
    line-height: 1;
    z-index: 2;
    background: rgba(255, 255, 255, 0.75);
    padding: 1px 4px;
    border-radius: 4px;
}
.progress-text {
    margin-top: 6px;
    font-size: 0.78rem;
    text-align: center;
    font-weight: 600;
    color: var(--text-secondary);
}

/* 卡片操作区 */
.card-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 10px;
    padding-top: 8px;
    border-top: 1px dashed var(--border);
}
.card-action-icons { display: flex; gap: 6px; }
.card-action-icon {
    cursor: pointer;
    font-size: 0.95rem;
    padding: 5px 7px;
    border-radius: var(--radius-s);
    transition: background-color var(--transition), transform var(--transition);
}
.card-action-icon:hover { background: rgba(255, 255, 255, 0.7); transform: scale(1.08); }
.card-checkbox {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: var(--primary);
    flex-shrink: 0;
}
.edit-icon { color: var(--primary); }
.copy-icon { color: var(--purple); }
.renew-icon { color: var(--success); }
.delete-icon { color: var(--danger); }

.empty-state {
    grid-column: 1 / -1;
    text-align: center;
    padding: 40px 0;
    color: var(--text-secondary);
    font-size: 1rem;
}

/* ===== 分页 ===== */
.pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    max-width: var(--content-width);
    margin: 0 auto;
    padding: 10px var(--content-pad) 20px;
}
.page-btn {
    min-width: 36px;
    padding: 7px 10px;
    margin: 0 3px;
    background: var(--surface);
    -webkit-backdrop-filter: var(--glass);
    backdrop-filter: var(--glass);
    border: 1px solid rgba(255, 255, 255, 0.4);
    border-radius: var(--radius-s);
    color: var(--text);
    font-size: 0.88rem;
    cursor: pointer;
    transition: background-color var(--transition), color var(--transition);
}
.page-btn:hover:not(:disabled) { background: rgba(255, 255, 255, 0.85); }
.page-btn:disabled { opacity: 0.4; cursor: default; }
.page-btn.active { background: var(--primary); color: #fff; border-color: var(--primary); }
.page-dots { padding: 8px 4px; color: var(--text-secondary); }

/* ===== 表单弹窗 ===== */
.modal {
    position: fixed;
    inset: 0;
    z-index: 1000;
    overflow: auto;
    background: var(--overlay);
    -webkit-backdrop-filter: blur(3px);
    backdrop-filter: blur(3px);
    display: none;
}
.modal-content {
    background: var(--surface-strong);
    -webkit-backdrop-filter: var(--glass);
    backdrop-filter: var(--glass);
    border: 1px solid rgba(255, 255, 255, 0.5);
    margin: 5% auto;
    padding: 24px;
    width: 90%;
    max-width: 520px;
    border-radius: var(--radius-l);
    box-shadow: var(--shadow-l);
    position: relative;
}
.modal-content h2 { margin-top: 0; font-size: 1.2rem; }
.close-btn {
    position: absolute;
    top: 12px;
    right: 16px;
    color: var(--text-secondary);
    font-size: 26px;
    font-weight: 300;
    line-height: 1;
    cursor: pointer;
    transition: color var(--transition);
}
.close-btn:hover, .close-btn:focus { color: var(--danger); }
.modal-content label {
    display: block;
    margin-top: 4px;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-secondary);
}
.modal-content label i { width: 1.2em; color: var(--primary); }
.modal-content input[type="text"],
.modal-content input[type="date"],
.modal-content input[type="url"],
.renewal-group input[type="number"],
.renewal-group select {
    width: 100%;
    padding: 9px 12px;
    margin: 5px 0 14px;
    display: inline-block;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    background: rgba(255, 255, 255, 0.7);
    color: var(--text);
    font-size: 0.92rem;
    transition: border-color var(--transition), box-shadow var(--transition);
}
.modal-content input:focus,
.modal-content select:focus,
.renewal-group input:focus,
.renewal-group select:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px var(--primary-soft);
}
.renewal-group { display: flex; gap: 10px; }
.renewal-group input[type="number"] { flex-grow: 1; margin-bottom: 5px; }
.renewal-group select { width: 110px; flex-shrink: 0; cursor: pointer; margin-bottom: 5px; }
.form-warning {
    font-size: 0.83rem;
    color: var(--warning);
    margin: 4px 0 12px;
    min-height: 18px;
    line-height: 1.5;
}
.modal-content button[type="submit"] {
    background: var(--primary);
    color: #fff;
    font-size: 0.98rem;
    font-weight: 600;
    padding: 11px 20px;
    margin: 10px 0 4px;
    border: none;
    border-radius: var(--radius-s);
    cursor: pointer;
    width: 100%;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    transition: background-color var(--transition), transform var(--transition);
}
.modal-content button[type="submit"]:hover { background: var(--primary-hover); }
.modal-content button[type="submit"]:active { transform: scale(0.98); }

/* 分组标签选择器 */
.groups-field { margin: 5px 0 14px; }
.groups-tag-list {
    display: none;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 6px;
}
.groups-tag-list.has-tags { display: flex; margin-bottom: 6px; }
.groups-tag-list .group-tag {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 2px 6px 2px 10px;
    margin: 0;
    background: var(--primary-soft);
    color: var(--primary);
    font-size: 0.75rem;
}
.group-tag-remove {
    cursor: pointer;
    font-size: 0.85rem;
    line-height: 1;
    opacity: 0.65;
    transition: opacity var(--transition);
    color: var(--primary);
}
.group-tag-remove:hover { opacity: 1; }
.groups-input-wrap { position: relative; }
.groups-input-wrap input[type="text"] {
    width: 100%;
    padding: 8px 32px 8px 12px;
    margin: 0;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    font-size: 0.88rem;
    background: rgba(255, 255, 255, 0.7);
}
.groups-input-wrap input[type="text"]:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px var(--primary-soft);
}
.groups-arrow, .autocomplete-arrow {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    color: var(--text-secondary);
    font-size: 0.65rem;
}

/* 自动补全下拉 */
.autocomplete-field { position: relative; }
.autocomplete-field input[type="text"],
.autocomplete-field input[type="url"] {
    width: 100%;
    padding: 9px 34px 9px 12px !important;
    margin: 5px 0 14px !important;
}
.autocomplete-field { margin-bottom: 0; }
.autocomplete-dropdown {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    max-height: 160px;
    overflow-y: auto;
    background: var(--surface-solid);
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    box-shadow: var(--shadow-l);
    z-index: 20;
}
.autocomplete-dropdown-item {
    padding: 7px 14px;
    cursor: pointer;
    font-size: 0.85rem;
    color: var(--text);
    line-height: 1.4;
    transition: background-color 0.12s;
}
.autocomplete-dropdown-item:hover { background: var(--primary-soft); color: var(--primary); }

/* ===== 续费弹窗 ===== */
.renew-overlay {
    position: fixed;
    inset: 0;
    z-index: 1500;
    display: none;
    justify-content: center;
    align-items: center;
    background: var(--overlay);
    -webkit-backdrop-filter: blur(3px);
    backdrop-filter: blur(3px);
}
.renew-line {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-bottom: 16px;
    flex-wrap: wrap;
    font-size: 1rem;
    color: var(--text);
}
.renew-line #renewDomainName { font-weight: 700; }
.renew-line input[type="number"] {
    width: 120px;
    padding: 6px 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    font-size: 0.95rem;
    text-align: center;
    background: rgba(255, 255, 255, 0.7);
}
.renew-line input[type="number"]:focus { outline: none; border-color: var(--primary); }
.renew-line select {
    padding: 6px 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    font-size: 0.95rem;
    cursor: pointer;
    background: rgba(255, 255, 255, 0.7);
}

/* ===== 页脚 ===== */
.footer {
    color: var(--text);
    font-size: 0.8rem;
    text-align: center;
    padding: 14px 0 24px;
    margin: 0 auto;
    max-width: var(--content-width);
}
.footer p {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 8px;
    margin: 0;
}
.footer a {
    color: var(--text);
    text-decoration: none;
    transition: color var(--transition);
    white-space: nowrap;
}
.footer a:hover { color: var(--primary); }

/* ===== Toast 对话框 ===== */
.toast-overlay {
    position: fixed;
    inset: 0;
    z-index: 2000;
    display: flex;
    justify-content: center;
    align-items: center;
    background: var(--overlay);
    -webkit-backdrop-filter: blur(3px);
    backdrop-filter: blur(3px);
    opacity: 0;
    transition: opacity 0.2s ease;
}
.toast-overlay.show { opacity: 1; }
.toast-card {
    background: var(--surface-strong);
    -webkit-backdrop-filter: var(--glass);
    backdrop-filter: var(--glass);
    border: 1px solid rgba(255, 255, 255, 0.5);
    border-radius: var(--radius-l);
    padding: 30px 34px 26px;
    max-width: 420px;
    width: 86%;
    text-align: center;
    box-shadow: var(--shadow-l);
    transform: scale(0.92) translateY(10px);
    transition: transform 0.25s cubic-bezier(0.34, 1.4, 0.64, 1);
}
.toast-overlay.show .toast-card { transform: scale(1) translateY(0); }
.toast-icon { font-size: 2.6rem; margin-bottom: 14px; line-height: 1; }
.toast-message {
    font-size: 0.98rem;
    color: var(--text);
    margin-bottom: 22px;
    line-height: 1.9;
    word-break: break-word;
    white-space: pre-line;
}
.toast-actions { display: flex; gap: 12px; justify-content: center; }
.toast-btn {
    padding: 10px 30px;
    border: none;
    border-radius: var(--radius-s);
    cursor: pointer;
    font-size: 0.93rem;
    font-weight: 600;
    transition: background-color var(--transition), transform 0.1s;
}
.toast-btn:active { transform: scale(0.96); }
.toast-btn-primary { background: var(--primary); color: #fff; }
.toast-btn-primary:hover { background: var(--primary-hover); }
.toast-btn-cancel { background: rgba(92, 102, 114, 0.16); color: var(--text-secondary); }
.toast-btn-cancel:hover { background: rgba(92, 102, 114, 0.28); }

/* ===== 滚动条 ===== */
::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-thumb { background: rgba(31, 39, 51, 0.22); border-radius: 5px; }
::-webkit-scrollbar-thumb:hover { background: rgba(31, 39, 51, 0.35); }

/* ===== 移动端 ===== */
@media (max-width: 768px) {
    :root { --content-pad: 14px; }
    .header { flex-direction: column; align-items: stretch; padding-top: 18px; }
    .header h1 { font-size: 1.35rem; justify-content: center; }
    .action-buttons { justify-content: center; }
    .action-btn { flex-grow: 1; justify-content: center; font-size: 0.82rem; padding: 8px 10px; }

    .summary-container { grid-template-columns: repeat(2, 1fr); gap: 10px; padding-top: 10px; }
    .summary-card p { font-size: 1.45rem; }
    .summary-card h3 { font-size: 0.8rem; }

    .controls-container { flex-direction: column; align-items: stretch; padding: 10px; }
    .tabs-container { justify-content: center; }
    .tab-btn { font-size: 0.8rem; padding: 6px 11px; }
    .search-container { min-width: 0; }

    .domain-grid { grid-template-columns: 1fr; gap: 12px; }
    .card-header { align-items: flex-start; }
    .card-status { font-size: 0.7rem; }

    .modal-content { margin: 8% auto; padding: 16px; }
    .toast-card { padding: 22px 18px 20px; }
    .toast-btn { padding: 9px 22px; }

    .footer p { font-size: 0.7rem; gap: 6px; }
}
@media (prefers-reduced-motion: reduce) {
    * { transition: none !important; animation: none !important; }
}
`;
