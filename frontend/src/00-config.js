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
