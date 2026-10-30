// 书单合并排序功能
(function() {
    'use strict';
    
    // 全局变量
    let originalState = null;
    let isMerged = false;
    let currentSortMode = 'rating'; // 'rating' 或 'category'
    let lastBooks = null; // 最近一次合并的书籍数据（用于跨断点重排）
    let lastMergedColumns = null; // 最近一次合并视图的列定义（用于列宽比例）
    let lastIsMobile = window.innerWidth <= 768;
    let forcedColumns = []; // 排序时强制显示的计算列（如按速度排序时强制显示速度列），恢复原始视图时清除
    let lastFilter = null; // 合并视图的筛选状态 {mode, value}，跨断点重排时保留
    let fabExpanded = false; // 移动端悬浮球展开状态

    // 移动端悬浮球图标（漏斗/筛选）
    const FAB_ICON = '<svg viewBox="0 0 16 16" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M2 4h12M4.5 8h7M7 12h2"/></svg>';

    // ============ 列显示配置（来自主题 _config.yml -> window.BOOKLIST_COLUMNS）============
    const DEFAULT_COLUMNS = {
        web: ['序号', '年份', '分类', '作者', '书名', '评级', '日期', '时长', '字数', '速度', '日均时长'],
        h5: ['分类', '作者', '书名', '评级']
    };

    // 原始年份表的列顺序（用于 CSS 隐藏）
    const ORIGINAL_COLUMNS = ['序号', '分类', '作者', '书名', '评级', '日期', '时长', '字数'];
    // 合并视图可选字段列（年份只存在于合并视图；速度/日均时长为计算列）
    const MERGED_FIELDS = ['年份', '分类', '作者', '书名', '评级', '日期', '时长', '字数', '速度', '日均时长'];
    const FIELD_CLASS_MAP = { '年份': 'year', '分类': 'category', '作者': 'author', '书名': 'book', '评级': 'rating', '日期': 'date', '时长': 'duration', '字数': 'words', '速度': 'speed', '日均时长': 'daily' };
    const SPEED_HEADER = '速度';
    const DAILY_HEADER = '日均时长';
    const HEADER_MAP = { '速度': SPEED_HEADER, '日均时长': DAILY_HEADER };
    // 计算列（不写进 Read.md，由 JS 实时计算）
    const COMPUTED_FIELDS = ['速度', '日均时长'];

    // 现代风格内联 SVG 图标（线条风格，currentColor 跟随文字颜色，跨平台渲染一致）
    const SVG_INFO = '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><circle cx="8" cy="8" r="6.4"/><line x1="8" y1="7.4" x2="8" y2="11"/><circle cx="8" cy="4.9" r="0.9" fill="currentColor" stroke="none"/></svg>';
    const BUTTON_ICONS = {
        rating: '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"><path d="M8 2.4l1.72 3.55 3.9.52-2.85 2.72.72 3.88L8 11.3l-3.49 1.77.72-3.88-2.85-2.72 3.9-.52z"/></svg>',
        category: '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="2.2" y="2.2" width="4.6" height="4.6" rx="1"/><rect x="9.2" y="2.2" width="4.6" height="4.6" rx="1"/><rect x="2.2" y="9.2" width="4.6" height="4.6" rx="1"/><rect x="9.2" y="9.2" width="4.6" height="4.6" rx="1"/></svg>',
        speed: '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"><path d="M8.9 1.6L3.4 8.9h3.1l-.8 5.5 5.7-7.3H8.7z"/></svg>',
        daily: '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><circle cx="8" cy="8" r="6.4"/><path d="M8 4.7V8l2.3 1.5"/></svg>',
        restore: '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M2.8 4.6h10.4M2.8 8h10.4M2.8 11.4h10.4"/></svg>'
    };

    // 各列的单位/格式说明（ⓘ 图标悬停/点击展示）
    const UNIT_TIPS = {
        '日期': '完成日期或阅读区间，如 10.15 或 10.01~10.15',
        '时长': '阅读总时长，格式 时:分（如 1:45 = 1小时45分）',
        '字数': '书籍总字数，单位 万字（如 25.4 = 25.4万字）',
        '速度': '阅读速度 = 字数 ÷ 时长，单位 万字/小时',
        '日均时长': '平均每日阅读时长 = 时长 ÷ 日期间隔天数，单位 小时/天（如 1.5h = 1小时30分）'
    };

    // ⓘ 图标 + 提示气泡的 HTML
    function unitIconHTML(key) {
        return '<span class="bm-unit-icon">' + SVG_INFO + '<span class="bm-unit-tip">' + UNIT_TIPS[key] + '</span></span>';
    }

    // 提示气泡样式（写入常驻 style 元素，不随合并视图切换清除）
    const TOOLTIP_CSS = `
        .bm-unit-icon { position: relative; display: inline-flex; align-items: center; margin-left: 4px; vertical-align: middle; opacity: 0.55; cursor: pointer; user-select: none; }
        .bm-unit-icon:hover { opacity: 1; }
        .bm-unit-tip { display: none; position: absolute; bottom: 135%; left: 50%; transform: translateX(-50%); background: #333 !important; color: #fff !important; padding: 8px 12px; border-radius: 6px; font-size: 13px; font-weight: normal; line-height: 1.6; text-align: left; width: max-content; max-width: 240px; white-space: normal; z-index: 1001; box-shadow: 0 2px 8px rgba(0,0,0,0.3); }
        .bm-unit-tip::after { content: ''; position: absolute; top: 100%; left: 50%; transform: translateX(-50%); border: 5px solid transparent; border-top-color: #333; }
        body.dark-mode .bm-unit-tip { background: #e8e8ec !important; color: #2a2a30 !important; box-shadow: 0 2px 10px rgba(0,0,0,0.5); }
        body.dark-mode .bm-unit-tip::after { border-top-color: #e8e8ec; }
        .bm-unit-icon:hover .bm-unit-tip, .bm-unit-icon.show .bm-unit-tip { display: block; }
        .bm-summary-row td { font-weight: bold; text-align: center; opacity: 0.85; border-top: 2px solid #999; font-size: 13px; display: table-cell !important; width: auto !important; }
        /* 单元格文字超出显示省略号（统计行除外，保持可换行） */
        .article-content table td { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        /* 表头不裁剪，让 ⓘ 提示气泡能超出表头范围显示 */
        .article-content table th { white-space: nowrap; overflow: visible; }
        .article-content table .bm-summary-row td { white-space: normal; text-overflow: clip; }
    `;

    // 计算行的各项指标（时长/字数/间隔天数/速度/日均时长）
    // 间隔天数缓存在 row.dataset.bmInterval 上：首次按原始时间顺序计算，排序/重排后复用，保证数值不随显示顺序漂移
    function getRowMetrics(row, yearInt, prevDateState) {
        const cells = row.querySelectorAll('td');
        const durationText = cells[6] ? cells[6].textContent.trim() : '';
        const wordsText = cells[7] ? cells[7].textContent.trim() : '';
        const durationHours = parseDurationHours(durationText);
        const wan = parseWordsWan(wordsText);

        let intervalDays;
        const cached = row.dataset.bmInterval;
        if (cached !== undefined) {
            intervalDays = cached === 'x' ? null : Number(cached);
        } else {
            const dateText = cells[5] ? cells[5].textContent.trim() : '';
            const tokens = parseDateTokens(dateText, yearInt);
            intervalDays = calcIntervalDays(tokens, prevDateState ? prevDateState.date : null);
            if (tokens.length > 0 && prevDateState) prevDateState.date = tokens[tokens.length - 1];
            row.dataset.bmInterval = intervalDays !== null ? String(intervalDays) : 'x';
        }

        const speedNum = (wan !== null && durationHours) ? wan / durationHours : null;
        const dailyNum = (durationHours && intervalDays) ? durationHours / intervalDays : null;
        return { durationHours: durationHours, wan: wan, intervalDays: intervalDays, speedNum: speedNum, dailyNum: dailyNum };
    }

    // 解析时长为小时数："1:45" -> 1.75；"2:10:30" 支持秒；无冒号纯数字按小时计
    function parseDurationHours(text) {
        if (!text) return null;
        const m = text.trim().match(/^(\d+):(\d{1,2})(?::(\d{1,2}))?$/);
        if (m) {
            let h = parseInt(m[1], 10) + parseInt(m[2], 10) / 60;
            if (m[3]) h += parseInt(m[3], 10) / 3600;
            return h;
        }
        const plain = parseFloat(text);
        return (!isNaN(plain) && plain > 0) ? plain : null;
    }

    // 解析字数为万字："25.4万"/"25.4万字" -> 25.4；"254000" -> 25.4；"25.4" -> 25.4
    function parseWordsWan(text) {
        if (!text) return null;
        let t = text.replace(/[,\s]/g, '');
        const hasWan = /万/.test(t);
        t = t.replace(/万字?$/, '');
        const v = parseFloat(t);
        if (isNaN(v) || v < 0) return null;
        if (hasWan) return v;
        return v >= 1000 ? v / 10000 : v;
    }

    // 计算阅读速度（万字/小时），保留两位小数；数据不足返回空串
    function calcSpeed(wordsText, durationText) {
        const wan = parseWordsWan(wordsText);
        const hours = parseDurationHours(durationText);
        if (wan === null || hours === null || hours <= 0) return '';
        return (Math.round(wan / hours * 100) / 100).toString();
    }

    // 解析日期文本，返回 Date 数组
    // 支持：2026-10-15 / 2026.10.15 / 2026/10/15 / 10-15 / 10.15 / 10/15 / 10月15日
    // 区间用 ~ 至 — – 或直接两个日期相连（如 10.01~10.15、2026-10-01~2026-10-15）
    function parseDateTokens(text, defaultYear) {
        if (!text) return [];
        let t = String(text)
            .replace(/[年月]/g, '-')
            .replace(/日/g, '')
            .replace(/[\.\/]/g, '-')
            .replace(/[~～—–至]/g, ' ');
        const dates = [];
        let m;
        const fullRe = /(\d{4})-(\d{1,2})-(\d{1,2})/g;
        while ((m = fullRe.exec(t)) !== null) {
            dates.push(new Date(+m[1], +m[2] - 1, +m[3]));
        }
        t = t.replace(fullRe, ' ');
        const shortRe = /(\d{1,2})-(\d{1,2})/g;
        while ((m = shortRe.exec(t)) !== null) {
            const mo = +m[1], d = +m[2];
            if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) {
                dates.push(new Date(defaultYear, mo - 1, d));
            }
        }
        return dates;
    }

    // 日期间隔天数：2个及以上日期取首尾差；1个日期取与上一本的间隔；不足1天按1天计
    function calcIntervalDays(tokens, prevDate) {
        let days = null;
        if (tokens.length >= 2) {
            days = Math.round(Math.abs(tokens[tokens.length - 1] - tokens[0]) / 86400000);
        } else if (tokens.length === 1 && prevDate) {
            days = Math.round(Math.abs(tokens[0] - prevDate) / 86400000);
        }
        if (days !== null && days < 1) days = 1;
        return days;
    }

    // 小时数格式化为十进制小时（如 1.5h，最多两位小数）
    function formatHours(hours) {
        return (Math.round(hours * 100) / 100) + 'h';
    }

    // 计算平均日阅读时长（时长/日期间隔天数），输出十进制小时（如 1.5h）；数据不足返回空串
    function calcDailyAvg(durationText, intervalDays) {
        const hours = parseDurationHours(durationText);
        if (hours === null || !intervalDays) return '';
        return formatHours(hours / intervalDays);
    }

    // 获取表格所属年份（从上方最近的 H2 标题提取）
    function getTableYear(table) {
        let yearElement = table.previousElementSibling;
        while (yearElement && yearElement.tagName !== 'H2') {
            yearElement = yearElement.previousElementSibling;
        }
        let year = '未知';
        if (yearElement) {
            const yearText = yearElement.textContent.replace(/[‹›\s]/g, '');
            const yearMatch = yearText.match(/\d{4}/);
            year = yearMatch ? yearMatch[0] : yearText;
        }
        return year;
    }

    // 获取当前端（web/h5）的列配置
    function getColumnConfig() {
        const cfg = window.BOOKLIST_COLUMNS || {};
        const isMobile = window.innerWidth <= 768;
        const key = isMobile ? 'h5' : 'web';
        const list = cfg[key];
        if (Array.isArray(list) && list.length > 0) return list;
        return DEFAULT_COLUMNS[key];
    }

    // 获取当前端（web/h5）的列宽比例映射（按列名配置），未配置返回 null（保持自动布局）
    function getWidthMap() {
        const w = window.BOOKLIST_WIDTHS || {};
        const key = window.innerWidth <= 768 ? 'h5' : 'web';
        const m = w[key];
        return (m && typeof m === 'object' && !Array.isArray(m) && Object.keys(m).length > 0) ? m : null;
    }

    // 获取当前端（web/h5）的列对齐映射（按列名配置，取值 left/center/right），未配置返回 null
    function getAlignMap() {
        const a = window.BOOKLIST_ALIGNS || {};
        const key = window.innerWidth <= 768 ? 'h5' : 'web';
        const m = a[key];
        return (m && typeof m === 'object' && !Array.isArray(m) && Object.keys(m).length > 0) ? m : null;
    }

    // 由列名对齐映射生成 nth-child text-align CSS（!important 覆盖合并视图单元格的内联样式）
    function buildAlignCss(scope, cols) {
        const map = getAlignMap();
        if (!map || cols.length === 0) return '';
        const valid = ['left', 'center', 'right'];
        let css = '';
        cols.forEach(function(c) {
            const v = String(map[c.name] || '').toLowerCase();
            if (valid.indexOf(v) !== -1) {
                css += scope + ' th:nth-child(' + c.nth + '), ' + scope + ' td:nth-child(' + c.nth + ') { text-align: ' + v + ' !important; }\n';
            }
        });
        return css;
    }

    // 计算列的生效清单 = 配置开启的 + 排序强制显示的
    function getEffectiveComputed() {
        const config = getColumnConfig();
        return COMPUTED_FIELDS.filter(function(k) {
            return config.indexOf(k) !== -1 || forcedColumns.indexOf(k) !== -1;
        });
    }

    // 由列名比例映射生成 nth-child 宽度 CSS
    // cols = [{name, nth}]，nth 为该显示列在 DOM 中的 nth-child 序号（可能不连续，如原始表隐藏了中间列）
    // 未在映射中配置的列按 1 计；隐藏的列不参与分配
    function buildWidthCss(scope, cols) {
        const map = getWidthMap();
        if (!map || cols.length === 0) return '';
        const rs = cols.map(function(c) {
            const v = Number(map[c.name]);
            return v > 0 ? v : 1;
        });
        const total = rs.reduce(function(a, b) { return a + b; }, 0);
        let css = scope + ' { table-layout: fixed; width: 100%; }\n';
        cols.forEach(function(c, i) {
            const pct = (rs[i] / total * 100).toFixed(2);
            css += scope + ' th:nth-child(' + c.nth + '), ' + scope + ' td:nth-child(' + c.nth + ') { width: ' + pct + '%; }\n';
        });
        return css;
    }

    // 合并视图的列清单：序号/排名 -> 结构序号列，其余按字段渲染
    function getMergedColumns(sortMode) {
        const config = getColumnConfig();
        const cols = [];
        if (config.indexOf('序号') !== -1 || config.indexOf('排名') !== -1) {
            cols.push({ key: '_index', header: sortMode === 'rating' ? '排名' : '序号', cls: 'bm-col-seq' });
        }
        MERGED_FIELDS.forEach(function(f) {
            if (config.indexOf(f) !== -1) {
                cols.push({ key: f, header: HEADER_MAP[f] || f, cls: 'bm-col-' + FIELD_CLASS_MAP[f] });
            }
        });
        return cols;
    }

    // 原始年份表：向每张表注入配置的计算列（速度/日均时长，附加在末尾，不影响既有列索引）
    function injectComputedColumns() {
        const computed = getEffectiveComputed();
        document.querySelectorAll('.article-content table:not(.merged-table)').forEach(function(table) {
            // 先清理旧的注入，避免重复
            table.querySelectorAll('.bm-computed-injected').forEach(function(el) { el.remove(); });
            if (computed.length === 0) return;

            const yearInt = parseInt(getTableYear(table), 10) || new Date().getFullYear();
            const headRow = table.querySelector('thead tr');
            if (headRow) {
                computed.forEach(function(k) {
                    const th = document.createElement('th');
                    th.innerHTML = HEADER_MAP[k] + unitIconHTML(k);
                    th.className = 'bm-col-' + FIELD_CLASS_MAP[k] + ' bm-computed-injected';
                    th.dataset.unitDone = '1';
                    headRow.appendChild(th);
                });
            }
            let prevDateState = { date: null };
            table.querySelectorAll('tbody tr').forEach(function(row) {
                if (row.classList.contains('bm-summary-row')) return;
                const m = getRowMetrics(row, yearInt, prevDateState);
                computed.forEach(function(k) {
                    const td = document.createElement('td');
                    td.className = 'bm-col-' + FIELD_CLASS_MAP[k] + ' bm-computed-injected';
                    td.textContent = k === '速度'
                        ? (m.speedNum !== null ? (Math.round(m.speedNum * 100) / 100).toString() : '')
                        : (m.dailyNum !== null ? formatHours(m.dailyNum) : '');
                    row.appendChild(td);
                });
            });
        });
    }

    // 统一的列显示入口：隐藏未配置列 + 注入计算列 + 表头单位图标 + 序号自动编号
    function applyColumnDisplay() {
        numberOriginalTables();
        applyColumnVisibility();
        injectComputedColumns();
        decorateOriginalHeaders();
    }

    // 序号列自动编号：每张表内从 1 开始，只填充空单元格（已有值保留）
    function numberOriginalTables() {
        document.querySelectorAll('.article-content table:not(.merged-table)').forEach(function(table) {
            let n = 0;
            table.querySelectorAll('tbody tr').forEach(function(row) {
                if (row.classList.contains('bm-summary-row')) return;
                n++;
                const cell = row.querySelector('td');
                if (cell && cell.textContent.trim() === '') {
                    cell.textContent = String(n);
                }
            });
        });
    }

    // ============ 按年排序（速度/日均时长）：不合并跨年数据，每年表格内部排序 ============

    // 构建年度统计行：总值 + 平均值（无数据的书不计入平均）
    function buildSummaryRow(metricsList, colCount) {
        const withDuration = metricsList.filter(function(m) { return m.durationHours; });
        const withWords = metricsList.filter(function(m) { return m.wan !== null; });
        const withSpeed = metricsList.filter(function(m) { return m.speedNum !== null; });
        const withDaily = metricsList.filter(function(m) { return m.dailyNum !== null; });

        const parts = [];
        if (withDuration.length) {
            parts.push('时长合计 ' + formatHours(withDuration.reduce(function(s, m) { return s + m.durationHours; }, 0)));
        }
        if (withWords.length) {
            parts.push('字数合计 ' + (Math.round(withWords.reduce(function(s, m) { return s + m.wan; }, 0) * 10) / 10) + '万字');
        }
        if (withSpeed.length) {
            parts.push('平均速度 ' + (Math.round(withSpeed.reduce(function(s, m) { return s + m.speedNum; }, 0) / withSpeed.length * 100) / 100) + '万字/时');
        }
        if (withDaily.length) {
            parts.push('平均日均时长 ' + formatHours(withDaily.reduce(function(s, m) { return s + m.dailyNum; }, 0) / withDaily.length));
        }

        const tr = document.createElement('tr');
        tr.className = 'bm-summary-row';
        const td = document.createElement('td');
        td.colSpan = colCount;
        td.textContent = parts.length ? ('📊 ' + parts.join(' ｜ ')) : '📊 暂无时长/字数数据';
        tr.appendChild(td);
        return tr;
    }

    // 单张年份表：按指标降序排序（无数据的排在末尾且保持原相对顺序），末尾追加统计行
    function sortYearTable(table, mode) {
        const yearInt = parseInt(getTableYear(table), 10) || new Date().getFullYear();
        const tbody = table.querySelector('tbody');
        if (!tbody) return;

        // 清除旧统计行
        tbody.querySelectorAll('.bm-summary-row').forEach(function(r) { r.remove(); });

        const rows = Array.from(tbody.querySelectorAll('tr'));
        const prevDateState = { date: null };
        const data = rows.map(function(row) {
            return { row: row, metrics: getRowMetrics(row, yearInt, prevDateState) };
        });

        const key = mode === 'speed' ? 'speedNum' : 'dailyNum';
        // 稳定排序：有值降序，无值排尾
        data.sort(function(a, b) {
            const va = a.metrics[key], vb = b.metrics[key];
            if (va === null && vb === null) return 0;
            if (va === null) return 1;
            if (vb === null) return -1;
            return vb - va;
        });

        data.forEach(function(d) { tbody.appendChild(d.row); });

        const colCount = table.querySelectorAll('thead th').length || 8;
        tbody.appendChild(buildSummaryRow(data.map(function(d) { return d.metrics; }), colCount));
    }

    // 应用按年排序模式
    function applyYearSort(mode) {
        const articleContent = document.querySelector('.article-content');
        if (!articleContent) return;

        if (!originalState) {
            saveOriginalState();
        }

        // 强制显示对应的计算列（配置里没有则临时注入，恢复原始视图时随配置移除）
        forcedColumns = [mode === 'speed' ? '速度' : '日均时长'];
        applyColumnDisplay(); // 先注入强制列，保证统计行 colspan 与表头一致

        articleContent.querySelectorAll('table:not(.merged-table)').forEach(function(table) {
            sortYearTable(table, mode);
        });

        updateButtonStates(mode, true);
        currentSortMode = mode;
        isMerged = true;
        applyFabState(); // 状态更新后同步 FAB 图标
        console.log('已切换到按年' + (mode === 'speed' ? '速度' : '日均时长') + '排序视图');
    }

    // 原始年份表：按配置隐藏未选择的列（独立的 style 元素，不受合并视图样式清除影响）
    function applyColumnVisibility() {
        const config = getColumnConfig();
        let css = '';
        ORIGINAL_COLUMNS.forEach(function(name, idx) {
            if (config.indexOf(name) === -1) {
                const n = idx + 1;
                css += '.article-content table:not(.merged-table) th:nth-child(' + n + '),\n' +
                       '.article-content table:not(.merged-table) td:nth-child(' + n + ') { display: none !important; }\n';
            }
        });
        // 列宽比例：显示顺序 = 原始列（markdown 顺序）+ 计算列（注入在末尾，含强制列）
        const visibleOriginal = ORIGINAL_COLUMNS.filter(function(name) { return config.indexOf(name) !== -1; });
        const visibleComputed = getEffectiveComputed();
        const widthCols = visibleOriginal.map(function(name) {
            return { name: name, nth: ORIGINAL_COLUMNS.indexOf(name) + 1 };
        }).concat(visibleComputed.map(function(k, i) {
            return { name: k, nth: ORIGINAL_COLUMNS.length + i + 1 };
        }));
        css += buildWidthCss('.article-content table:not(.merged-table)', widthCols);
        css += buildAlignCss('.article-content table:not(.merged-table)', widthCols);

        let el = document.getElementById('booklist-column-styles');
        if (!el) {
            el = document.createElement('style');
            el.id = 'booklist-column-styles';
            document.head.appendChild(el);
        }
        el.textContent = TOOLTIP_CSS + css;
    }

    // 原始年份表表头：为有单位说明的列追加 ⓘ 图标（含 JS 注入的计算列表头）
    function decorateOriginalHeaders() {
        document.querySelectorAll('.article-content table:not(.merged-table) thead th').forEach(function(th) {
            if (th.dataset.unitDone) return;
            const key = th.textContent.trim();
            if (UNIT_TIPS[key]) {
                th.insertAdjacentHTML('beforeend', unitIconHTML(key));
                th.dataset.unitDone = '1';
            }
        });
    }
    
    // 添加样式的辅助函数
    function addNewStyle(newStyle) {
        var styleElement = document.getElementById('book-merge-styles');
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.type = 'text/css';
            styleElement.id = 'book-merge-styles';
            document.getElementsByTagName('head')[0].appendChild(styleElement);
        }
        styleElement.appendChild(document.createTextNode(newStyle));
    }
    
    // 创建切换按钮容器
    function createToggleButtons() {
        // 检查是否已存在按钮容器
        if (document.getElementById('book-merge-container')) return;

        // 检测是否为手机端
        const isMobile = window.innerWidth <= 768;
        const buttonSize = isMobile ? 'small' : 'normal';

        // 创建按钮容器（移动端固定在右下角，不遮挡顶部内容）
        const container = document.createElement('div');
        container.id = 'book-merge-container';
        container.style.cssText = isMobile ? `
            position: fixed;
            bottom: 20px;
            right: 14px;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 8px;
        ` : `
            position: fixed;
            top: 10%;
            right: 40px;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            gap: 8px;
        `;

        // 按评级排序按钮
        const ratingButton = createButton('rating', '评级', buttonSize);

        // 按分类排序按钮
        const categoryButton = createButton('category', '分类', buttonSize);

        // 按速度排序按钮（按年）
        const speedButton = createButton('speed', '速度', buttonSize);

        // 按日均时长排序按钮（按年）
        const dailyButton = createButton('daily', '日均', buttonSize);

        // 恢复原始视图按钮
        const restoreButton = createButton('restore', '原始', buttonSize);
        restoreButton.style.display = 'none'; // 初始隐藏

        container.appendChild(ratingButton);
        container.appendChild(categoryButton);
        container.appendChild(speedButton);
        container.appendChild(dailyButton);
        container.appendChild(restoreButton);

        // 移动端：选项按钮收进悬浮球（FAB），默认收起不遮挡内容
        let fab = null;
        if (isMobile) {
            [ratingButton, categoryButton, speedButton, dailyButton].forEach(function(b) { b.style.display = 'none'; });
            fab = document.createElement('button');
            fab.id = 'book-merge-fab';
            fab.innerHTML = FAB_ICON;
            const isDark = document.body.classList.contains('dark-mode');
            fab.style.cssText = `
                width: 42px;
                height: 42px;
                border-radius: 50%;
                border: none;
                background: ${isDark ? '#3d3d3d' : '#fafaf8'};
                color: ${isDark ? 'white' : 'black'};
                box-shadow: 0 2px 10px rgba(0,0,0,0.25);
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
            `;
            fab.addEventListener('click', function() {
                fabExpanded = !fabExpanded;
                applyFabState();
            });
            container.appendChild(fab);
        }

        document.body.appendChild(container);

        console.log('书单合并按钮组已创建');
    }

    // 滚动半透明效果（只注册一次，动态查询容器内按钮，兼容容器重建）
    let scrollListenerAdded = false;
    function addScrollOpacityListener() {
        if (scrollListenerAdded) return;
        scrollListenerAdded = true;
        let scrollTimeout;
        window.addEventListener('scroll', function() {
            const container = document.getElementById('book-merge-container');
            if (!container) return;
            const buttons = container.querySelectorAll('button');
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            buttons.forEach(function(btn) {
                btn.style.opacity = scrollTop > 50 ? '0.7' : '1';
            });
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(function() {
                buttons.forEach(function(btn) {
                    btn.style.opacity = '1';
                });
            }, 1000); // 停止滚动1秒后恢复
        });
    }

    // 移动端悬浮球状态同步：展开/收起选项按钮；激活排序时 FAB 图标变为当前模式
    function applyFabState() {
        const fab = document.getElementById('book-merge-fab');
        if (!fab) return; // 桌面端无 FAB
        ['rating', 'category', 'speed', 'daily', 'restore'].forEach(function(id) {
            const btn = document.getElementById('book-merge-' + id);
            if (!btn) return;
            if (!fabExpanded) {
                btn.style.display = 'none';
            } else if (id === 'restore') {
                btn.style.display = isMerged ? 'inline-flex' : 'none';
            } else {
                btn.style.display = 'inline-flex';
            }
        });
        fab.innerHTML = (isMerged && BUTTON_ICONS[currentSortMode]) ? BUTTON_ICONS[currentSortMode] : FAB_ICON;
    }
    
    // 创建单个按钮
    function createButton(type, text, size) {
        const button = document.createElement('button');
        button.id = `book-merge-${type}`;
        button.innerHTML = (BUTTON_ICONS[type] || '') + '<span>' + text + '</span>';

        const isSmall = size === 'small';
        const padding = isSmall ? '8px 12px' : '10px 16px';
        const fontSize = isSmall ? '12px' : '13px';
        const borderRadius = isSmall ? '18px' : '20px';
        const isDark = document.body.classList.contains('dark-mode');

        // background: ${getButtonColor(type)};
        button.style.cssText = `
            background: ${isDark ? '#3d3d3d':'#fafaf8'};
            color: ${isDark ? 'white': 'black'};
            border: none;
            border-radius: ${borderRadius};
            padding: ${padding};
            font-size: ${fontSize};
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            transition: all 0.3s ease;
            font-family: inherit;
            white-space: nowrap;
            min-width: ${isSmall ? '60px' : '80px'};
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 5px;
        `;

        // 悬停效果（激活状态的按钮跳过，避免覆盖激活样式导致图标漂移）
        button.addEventListener('mouseover', function() {
            if (button.classList.contains('active')) return;
            button.style.transform = 'translateY(-1px)';
            button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
        });

        button.addEventListener('mouseout', function() {
            if (button.classList.contains('active')) return;
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
        });

        // 点击事件
        button.addEventListener('click', function() {
            handleButtonClick(type);
        });

        return button;
    }

    // 获取按钮颜色
    function getButtonColor(type) {
        const colors = {
            rating: 'linear-gradient(45deg, #667eea, #764ba2)',
            category: 'linear-gradient(45deg, #f093fb, #f5576c)',
            restore: 'linear-gradient(45deg, #ff6b6b, #ee5a52)'
        };
        return colors[type];
    }
    
    // 处理按钮点击
    function handleButtonClick(type) {
        if (type === 'restore') {
            restoreOriginalView();
        } else {
            // 如果点击的是当前已激活的排序模式，则恢复原始视图
            if (isMerged && currentSortMode === type) {
                restoreOriginalView();
            } else {
                // 如果当前不是原始状态，先恢复原始状态
                if (isMerged) {
                    restoreOriginalView();
                    // 稍微延迟一下确保DOM更新完成
                    setTimeout(function() {
                        applySortMode(type);
                    }, 50);
                } else {
                    applySortMode(type);
                }
            }
        }
    }

    // 排序模式路由：rating/category 走跨年合并视图，speed/daily 走按年排序
    function applySortMode(type) {
        if (type === 'rating' || type === 'category') {
            toggleBookList(type);
        } else {
            applyYearSort(type);
        }
    }
    
    // 保存原始状态
    function saveOriginalState() {
        const articleContent = document.querySelector('.article-content');
        if (articleContent) {
            originalState = {
                content: articleContent.innerHTML
            };
            console.log('原始状态已保存');
        }
    }
    
    // 获取所有书籍数据
    function getAllBooks() {
        const tables = document.querySelectorAll('table');
        const books = [];
        
        tables.forEach(function(table) {
            // 获取年份（前4位数字）
            const year = getTableYear(table);
            const yearInt = parseInt(year, 10) || new Date().getFullYear();

            let prevDate = null;
            const rows = table.querySelectorAll('tbody tr');
            rows.forEach(function(row) {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 5) {
                    const rating = cells[4].textContent.trim();
                    const starCount = (rating.match(/★/g) || []).length;
                    const time = cells.length >= 6 ? cells[5].textContent.trim() : '';
                    const duration = cells.length >= 7 ? cells[6].textContent.trim() : '';
                    const words = cells.length >= 8 ? cells[7].textContent.trim() : '';
                    const tokens = parseDateTokens(time, yearInt);
                    const intervalDays = calcIntervalDays(tokens, prevDate);
                    if (tokens.length > 0) prevDate = tokens[tokens.length - 1];

                    books.push({
                        year: year,
                        sequenceNumber: cells[0].textContent.trim(),
                        category: cells[1].textContent.trim(),
                        author: cells[2].textContent.trim(),
                        bookName: cells[3].textContent.trim(),
                        rating: rating,
                        starCount: starCount,
                        time: time,
                        duration: duration,
                        words: words,
                        speed: calcSpeed(words, duration),
                        dailyAvg: calcDailyAvg(duration, intervalDays)
                    });
                }
            });
        });
        
        console.log('找到书籍数量:', books.length);
        return books;
    }
    
    // 构建筛选徽章栏：分类模式按分类计数（分类色），评级模式按星级计数；点击徽章筛选表格
    // 数量小于 filter_min_count（配置文件可改）的分类/评级不展示徽章（书籍仍在表格中）
    function buildFilterBar(sortedBooks, sortMode) {
        const counts = {};
        sortedBooks.forEach(function(b) {
            const k = sortMode === 'category' ? b.category : b.starCount;
            counts[k] = (counts[k] || 0) + 1;
        });

        const minCount = Number(window.BOOKLIST_FILTER_MIN) > 0 ? Number(window.BOOKLIST_FILTER_MIN) : 1;

        let chips = '';
        if (sortMode === 'category') {
            const cats = Object.keys(counts).sort(function(a, b) {
                return counts[b] - counts[a] || a.localeCompare(b);
            }).filter(function(c) { return counts[c] >= minCount; });
            chips = cats.map(function(c) {
                return '<span class="bm-filter-chip" data-value="' + c + '" style="background:' + getCategoryColor(c) + ';color:' + getCategoryTextColor(c) + ';">' + c + ' ' + counts[c] + '</span>';
            }).join('');
        } else {
            const stars = Object.keys(counts).map(Number).sort(function(a, b) { return b - a; })
                .filter(function(s) { return counts[s] >= minCount; });
            chips = stars.map(function(s) {
                const label = s > 0 ? '★'.repeat(s) : '无评级';
                return '<span class="bm-filter-chip" data-value="' + s + '">' + label + ' ' + counts[s] + '</span>';
            }).join('');
        }

        const attr = sortMode === 'category' ? 'category' : 'stars';
        // 分类模式不展示「全部」徽章（再次点击选中项即取消筛选）；评级模式保留
        const allChip = sortMode === 'rating'
            ? '<span class="bm-filter-chip bm-filter-all active" data-value="__all__">全部 ' + sortedBooks.length + '</span>'
            : '';
        return '<div class="bm-filter-bar" data-attr="' + attr + '">' + allChip + chips + '</div>';
    }

    // 应用筛选：value 为 __all__ 显示全部
    function applyFilter(bar, value) {
        const attr = bar.dataset.attr === 'category' ? 'data-category' : 'data-stars';
        bar.querySelectorAll('.bm-filter-chip').forEach(function(c) { c.classList.remove('active'); });
        const chip = bar.querySelector('.bm-filter-chip[data-value="' + value + '"]') || bar.querySelector('.bm-filter-all');
        if (chip) chip.classList.add('active');

        const table = document.querySelector('.merged-table');
        if (!table) return;
        table.querySelectorAll('tbody tr').forEach(function(tr) {
            tr.style.display = (value === '__all__' || tr.getAttribute(attr) === String(value)) ? '' : 'none';
        });
        lastFilter = { mode: currentSortMode, value: value };
    }

    // 重建合并视图后恢复上次的筛选状态
    function reapplyFilter() {
        if (!lastFilter || lastFilter.mode !== currentSortMode) return;
        const bar = document.querySelector('.bm-filter-bar');
        if (bar) applyFilter(bar, lastFilter.value);
    }

    // 创建合并后的表格
    function createMergedTable(books, sortMode) {
        const isMobile = window.innerWidth <= 768;
        let sortedBooks = [...books];
        let descriptionText = '';

        // 根据排序模式进行排序
        if (sortMode === 'rating') {
            sortedBooks.sort(function(a, b) {
                if (b.starCount !== a.starCount) {
                    return b.starCount - a.starCount;
                }
                return b.year.localeCompare(a.year);
            });
            descriptionText = '按照评分星级降序排列';
        } else if (sortMode === 'category') {
            // 先统计各分类的数量
            const categoryCount = {};
            sortedBooks.forEach(function(book) {
                categoryCount[book.category] = (categoryCount[book.category] || 0) + 1;
            });
            
            // 按分类数量降序，再按分类名称字母序，最后按评分降序排序
            sortedBooks.sort(function(a, b) {
                // 首先按分类数量排序（数量多的在前）
                const countA = categoryCount[a.category];
                const countB = categoryCount[b.category];
                if (countB !== countA) {
                    return countB - countA;
                }
                
                // 分类数量相同时，按分类名称字母排序
                if (a.category !== b.category) {
                    return a.category.localeCompare(b.category);
                }
                
                // 同分类内按评分降序排序
                return b.starCount - a.starCount;
            });
            
            // 为每个分类添加分类内序号
            const categoryIndexMap = {};
            sortedBooks.forEach(function(book) {
                if (!categoryIndexMap[book.category]) {
                    categoryIndexMap[book.category] = 0;
                }
                categoryIndexMap[book.category]++;
                book.categoryIndex = categoryIndexMap[book.category];
            });
            
            descriptionText = '按照分类数量降序排列，同分类内按评分排序，每个分类内独立编号';
        }
        
        // 构建表头（按配置动态生成，有单位说明的列附 ⓘ 图标）
        const mergedColumns = getMergedColumns(sortMode);
        lastMergedColumns = mergedColumns;
        const tableHeaders = '<tr>' + mergedColumns.map(function(c) {
            const center = (c.key === '_index' || (c.key === '分类' && sortMode === 'category')) ? ' style="text-align: center !important;"' : '';
            const icon = UNIT_TIPS[c.key] ? unitIconHTML(c.key) : '';
            return '<th class="' + c.cls + '"' + center + '>' + c.header + icon + '</th>';
        }).join('') + '</tr>';

        let mergedHTML = `
            <div style="margin-bottom: 20px; padding: 15px; background: ${getHeaderBackground(sortMode)}; border-radius: 10px; color: white; text-align: center;">
                <strong>共收录 ${sortedBooks.length} 本书籍，${descriptionText}</strong>
            </div>
            ${buildFilterBar(sortedBooks, sortMode)}
            <table class="merged-table">
                <thead>
                    ${tableHeaders}
                </thead>
                <tbody>
        `;

        // 构建表格内容
        let currentCategory = '';
        sortedBooks.forEach(function(book, index) {
            const rowData = getRowData(book, sortMode, index, isMobile, mergedColumns);

            if (sortMode === 'category' && book.category !== currentCategory) {
                currentCategory = book.category;
            }

            mergedHTML += rowData;
        });
        
        mergedHTML += `
                </tbody>
            </table>
        `;
        
        return mergedHTML;
    }
    
    // 获取标题背景色
    function getHeaderBackground(sortMode) {
        const isDark = document.body.classList.contains('dark-mode');
        // return sortMode === 'rating' 
        //     ? 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)'
        //     : 'linear-gradient(45deg, #f093fb 0%, #f5576c 100%)';
        return isDark ? '#000' : '#fafaf8';
    }
    
    // 获取行样式类
    function getRowClass(book, sortMode, index) {
        let classes = ['merged-row'];
        
        if (sortMode === 'rating' && index < 10) {
            classes.push('top-10');
        }
        
        if (sortMode === 'category') {
            classes.push(`category-${book.category.replace(/[^\w]/g, '')}`);
        }
        
        return classes.join(' ');
    }
    
    // 渲染结构序号列（评级排序=排名，分类排序=分类内序号）
    function renderIndexCell(sortMode, book, index) {
        if (sortMode === 'rating') {
            const rankColor = index < 3 ? '#ff6b6b' : index < 10 ? '#4ecdc4' : '#95a5a6';
            return `<td class="bm-col-seq" style="font-weight: bold; color: ${rankColor}; text-align: center; font-size: 16px;">${index + 1}</td>`;
        }
        return `<td class="bm-col-seq" style="font-weight: bold; text-align: center; color: #667eea; font-size: 14px;">${book.categoryIndex}</td>`;
    }

    // 渲染单个字段列
    function renderFieldCell(field, book, sortMode, isMobile) {
        const categoryColor = getCategoryColor(book.category);
        switch (field) {
            case '年份':
                return `<td class="bm-col-year"><span class="year-badge">${book.year}</span></td>`;
            case '分类': {
                const badgeClass = isMobile ? 'category-badge-mobile' : (sortMode === 'category' ? 'category-badge-main' : 'category-badge');
                const align = (!isMobile && sortMode === 'category') ? ' style="text-align: center;"' : '';
                return `<td class="bm-col-category"${align}><span class="${badgeClass}" style="background: ${categoryColor}; color: ${getCategoryTextColor(book.category)};">${book.category}</span></td>`;
            }
            case '作者':
                return `<td class="bm-col-author">${book.author}</td>`;
            case '书名':
                return `<td class="bm-col-book">${book.bookName}</td>`;
            case '评级':
                return `<td class="bm-col-rating rating-cell">${book.rating}</td>`;
            case '日期':
                return `<td class="bm-col-date">${book.time}</td>`;
            case '时长':
                return `<td class="bm-col-duration">${book.duration}</td>`;
            case '字数':
                return `<td class="bm-col-words">${book.words}</td>`;
            case '速度':
                return `<td class="bm-col-speed">${book.speed}</td>`;
            case '日均时长':
                return `<td class="bm-col-daily">${book.dailyAvg}</td>`;
            default:
                return '';
        }
    }

    // 获取行数据（按列配置动态生成）
    function getRowData(book, sortMode, index, isMobile, mergedColumns) {
        const rowClass = getRowClass(book, sortMode, index);
        let tds = '';
        mergedColumns.forEach(function(c) {
            tds += (c.key === '_index')
                ? renderIndexCell(sortMode, book, index)
                : renderFieldCell(c.key, book, sortMode, isMobile);
        });
        return `<tr class="${rowClass}" data-year="${book.year}" data-stars="${book.starCount}" data-category="${book.category}">${tds}</tr>`;
    }
    
    // 判断颜色是否为浅色（亮度高），用于决定徽章文字用深色还是白色
    function isLightColor(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return (0.299 * r + 0.587 * g + 0.114 * b) > 180;
    }

    // 获取分类徽章的文字颜色（亮底深字，暗底白字）
    function getCategoryTextColor(category) {
        return isLightColor(getCategoryColor(category)) ? '#333' : '#fff';
    }

    // 获取分类颜色
    function getCategoryColor(category) {
        const categoryColors = {
            '投资': '#4CAF50',
            '文学': '#2196F3', 
            '传记': '#FF9800',
            '政治': '#E91E63',
            '社会': '#795548',
            '历史': '#FFD54F',
            '哲学': '#00BCD4',
            '心理学': '#9C27B0',
            '经济': '#607D8B',
            '矿业': '#8BC34A',
            '健身': '#FF5722',
            '纪实': '#3F51B5',
            '艺术': '#E91E63',
            '灵': '#9E9E9E',
            '其他': '#757575',
            '社科': '#795548',
            '杂文': '#607D8B',
            '中医': '#4CAF50',
            '计算机': '#2196F3',
            '行业分析': '#FF9800'
        };
        
        return categoryColors[category] || categoryColors['其他'];
    }
    
    // 添加合并表格的样式
    function addMergedTableStyles() {
        const isMobile = window.innerWidth <= 768;

        // 列宽比例：配置了就按列名映射 + nth-child 精确控制（含桌面端），否则手机端回退到 class 默认宽度
        // 合并视图的结构序号列按「序号」的比例/对齐计
        const widthCols = (lastMergedColumns || []).map(function(c, i) {
            return { name: c.key === '_index' ? '序号' : c.key, nth: i + 1 };
        });
        const widthOnlyCss = buildWidthCss('.merged-table', widthCols);
        const ratioCss = widthOnlyCss + buildAlignCss('.merged-table', widthCols);

        const mobileClassWidths = widthOnlyCss ? '' : `
                /* 按列 class 控制宽度（列数由配置决定） */
                .merged-table .bm-col-seq {
                    width: 34px;
                    text-align: center;
                }

                .merged-table .bm-col-category {
                    width: 52px;
                    text-align: center;
                }

                .merged-table .bm-col-year {
                    width: 52px;
                }

                .merged-table .bm-col-rating {
                    width: 62px;
                }

                .merged-table .bm-col-date,
                .merged-table .bm-col-duration,
                .merged-table .bm-col-words,
                .merged-table .bm-col-daily {
                    width: 70px;
                }

                .merged-table .bm-col-speed {
                    width: 92px;
                }
        `;

        const mergedStyles = `
            .bm-filter-bar {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
                margin-bottom: 12px;
                justify-content: center;
            }
            .bm-filter-chip {
                padding: 3px 10px;
                border-radius: 12px;
                font-size: ${isMobile ? '11px' : '12px'};
                font-weight: bold;
                cursor: pointer;
                user-select: none;
                border: 1px solid #bbb;
                line-height: 1.6;
            }
            .bm-filter-chip.active {
                box-shadow: 0 0 0 2px #667eea;
            }
            .bm-filter-all {
                background: #667eea;
                color: #fff;
                border-color: #667eea;
            }
            .merged-table thead th{
                background: inherit !important;
            }
            .year-badge {
                background: linear-gradient(45deg, #667eea, #764ba2);
                color: white;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: ${isMobile ? '10px' : '12px'};
                font-weight: bold;
                white-space: nowrap;
            }
            
            .category-badge, .category-badge-main, .category-badge-mobile {
                color: white;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: ${isMobile ? '10px' : '12px'};
                font-weight: bold;
                white-space: nowrap;
            }
            
            .category-badge-mobile {
                font-size: 9px;
                padding: 2px 6px;
                border-radius: 8px;
                max-width: 100%;
                text-overflow: ellipsis;
                overflow: hidden;
            }
            
            .category-badge-main {
                font-size: ${isMobile ? '12px' : '14px'};
                padding: 3px 10px;
            }
            
            .merged-row.top-10 {
                background: linear-gradient(90deg, rgba(255,215,0,0.1) 0%, transparent 100%);
            }
            
            .merged-row:hover {
                background: rgba(102, 126, 234, 0.1) !important;
                transition: background 0.3s ease;
            }

            .merged-row[data-stars="5"] .rating-cell {
                color: gold !important;
                font-weight: bold;
            }
            
            .merged-row[data-stars="4"] .rating-cell {
                color: #ffa500 !important;
            }
            
            .merged-row[data-stars="3"] .rating-cell {
                color: #32cd32 !important;
            }
            
            .merged-table {
                width: 100%;
                border-collapse: collapse;
                font-size: ${isMobile ? '12px' : '14px'};
            }
            
            .merged-table th,
            .merged-table td {
                border: 1px solid #ddd;
                padding: ${isMobile ? '6px 4px' : '8px'};
                text-align: left;
            }
            
            .merged-table th {
                background-color: #f2f2f2;
                font-weight: bold;
            }
            
            /* 手机端特殊样式 */
            @media (max-width: 768px) {
                .merged-table {
                    display: table !important;
                    width: 100% !important;
                    table-layout: fixed;
                }

                .merged-table thead,
                .merged-table tbody {
                    display: table-header-group !important;
                }

                .merged-table tbody {
                    display: table-row-group !important;
                }

                .merged-table tr {
                    display: table-row !important;
                }

                .merged-table th,
                .merged-table td {
                    display: table-cell !important;
                    vertical-align: middle;
                }

                /* 作者/书名长文本省略（始终生效） */
                .merged-table .bm-col-author,
                .merged-table .bm-col-book {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                ${mobileClassWidths}

                .rating-cell {
                    font-size: 14px !important;
                }
            }

            ${ratioCss}
            
            /* 分类排序时的样式 */
            .merged-row[data-category] {
                
            }
        `;
        // border-left: 3px solid transparent;
        
        addNewStyle(mergedStyles);
    }
    
    // 切换书单视图
    function toggleBookList(sortMode) {
        const articleContent = document.querySelector('.article-content');
        const container = document.getElementById('book-merge-container');
        
        if (!articleContent) {
            console.error('未找到文章内容容器');
            return;
        }
        
        // 保存原始状态
        if (!originalState) {
            saveOriginalState();
        }
        forcedColumns = []; // 合并视图不保留按年排序的强制列
        
        const books = getAllBooks();
        if (books.length === 0) {
            alert('未找到书籍数据，请检查页面结构');
            return;
        }
        lastBooks = books;
        
        // 清除之前的样式
        clearMergedStyles();
        
        // 切换到合并视图
        const mergedHTML = createMergedTable(books, sortMode);
        articleContent.innerHTML = mergedHTML;
        addMergedTableStyles();
        reapplyFilter(); // 恢复上次筛选状态（若模式一致）
        
        // 更新按钮状态
        updateButtonStates(sortMode, true);
        currentSortMode = sortMode;
        isMerged = true;
        applyFabState(); // 状态更新后同步 FAB 图标

        console.log(`已切换到${sortMode}排序视图`);
    }
    
    // 清除合并表格样式
    function clearMergedStyles() {
        const styleElement = document.getElementById('book-merge-styles');
        if (styleElement) {
            styleElement.remove();
        }
    }
    
    // 恢复原始视图
    function restoreOriginalView() {
        const articleContent = document.querySelector('.article-content');
        
        if (!articleContent || !originalState) {
            console.error('无法恢复原始视图');
            return;
        }
        
        // 清除合并表格样式
        clearMergedStyles();
        
        // 恢复原始内容
        forcedColumns = []; // 清除排序强制列，回到配置驱动
        lastFilter = null; // 清除筛选状态
        articleContent.innerHTML = originalState.content;
        applyColumnDisplay(); // 重新应用列隐藏与计算列注入
        updateButtonStates(null, false);
        isMerged = false;
        currentSortMode = null;
        
        console.log('已恢复原始视图');
    }
    
    // 更新按钮状态
    function updateButtonStates(activeMode, merged) {
        const ratingBtn = document.getElementById('book-merge-rating');
        const categoryBtn = document.getElementById('book-merge-category');
        const speedBtn = document.getElementById('book-merge-speed');
        const dailyBtn = document.getElementById('book-merge-daily');
        const restoreBtn = document.getElementById('book-merge-restore');

        if (!ratingBtn || !categoryBtn || !speedBtn || !dailyBtn || !restoreBtn) return;
        const sortBtns = [ratingBtn, categoryBtn, speedBtn, dailyBtn];

        if (merged) {
            // 排序视图：显示所有按钮，但高亮当前激活的按钮
            sortBtns.forEach(function(btn) { btn.style.display = 'inline-flex'; });
            restoreBtn.style.display = 'inline-flex';

            // 重置所有按钮样式
            sortBtns.forEach(resetButtonStyle);
            resetButtonStyle(restoreBtn);

            // 设置活跃按钮样式
            const activeBtn = document.getElementById('book-merge-' + activeMode);
            if (activeBtn) setActiveButtonStyle(activeBtn);
        } else {
            // 原始视图：显示排序按钮，隐藏恢复按钮
            sortBtns.forEach(function(btn) { btn.style.display = 'inline-flex'; });
            restoreBtn.style.display = 'none';

            // 恢复所有按钮样式
            sortBtns.forEach(resetButtonStyle);
            resetButtonStyle(restoreBtn);
        }
        applyFabState(); // 移动端悬浮球状态同步
    }

    // 重置按钮样式
    function resetButtonStyle(button) {
        button.classList.remove('active');
        button.style.opacity = '1';
        button.style.cursor = 'pointer';
        button.style.transform = 'translateY(0)';
        button.style.filter = 'none';
        button.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
    }

    // 设置激活按钮样式（描边环，不动 transform，避免图标漂移）
    function setActiveButtonStyle(button) {
        button.classList.add('active');
        button.style.opacity = '1';
        button.style.transform = 'translateY(0)';
        button.style.filter = 'none';
        button.style.boxShadow = '0 0 0 2px #667eea, 0 2px 8px rgba(0,0,0,0.15)';
    }
    
    // 初始化函数
    function init() {
        // 检查是否在Read页面
        if (window.location.href.indexOf('/Read/') === -1) {
            return;
        }

        console.log('书单合并功能开始初始化');

        // 等待页面完全加载
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                setTimeout(createToggleButtons, 100);
                setTimeout(applyColumnDisplay, 100);
                addScrollOpacityListener();
            });
        } else {
            setTimeout(createToggleButtons, 100);
            setTimeout(applyColumnDisplay, 100);
            addScrollOpacityListener();
        }

        // 单位提示：移动端点击图标切换显示，点击其他位置收起（桌面端由 CSS :hover 处理）
        document.addEventListener('click', function(e) {
            const icon = e.target.closest ? e.target.closest('.bm-unit-icon') : null;
            if (icon) {
                const wasShown = icon.classList.contains('show');
                document.querySelectorAll('.bm-unit-icon.show').forEach(function(el) { el.classList.remove('show'); });
                if (!wasShown) icon.classList.add('show');
            } else {
                document.querySelectorAll('.bm-unit-icon.show').forEach(function(el) { el.classList.remove('show'); });
            }
        });

        // 筛选徽章：点击筛选合并视图表格行；再次点击已选中的徽章取消筛选（显示全部）
        document.addEventListener('click', function(e) {
            const chip = e.target.closest ? e.target.closest('.bm-filter-chip') : null;
            if (!chip) return;
            const bar = chip.closest('.bm-filter-bar');
            if (!bar) return;
            const value = (chip.classList.contains('active') && chip.dataset.value !== '__all__')
                ? '__all__'
                : chip.dataset.value;
            applyFilter(bar, value);
        });

        // 窗口缩放跨越 768px 断点时：重算列可见性；若处于合并视图则用缓存数据重建表格；按钮容器按端型重建
        window.addEventListener('resize', function() {
            const nowMobile = window.innerWidth <= 768;
            if (nowMobile === lastIsMobile) return;
            lastIsMobile = nowMobile;

            // 重建按钮容器（移动端 FAB / 桌面端固定列）
            const oldContainer = document.getElementById('book-merge-container');
            if (oldContainer) oldContainer.remove();
            fabExpanded = false;
            createToggleButtons();
            updateButtonStates(isMerged ? currentSortMode : null, isMerged);

            if (isMerged && lastBooks) {
                const articleContent = document.querySelector('.article-content');
                if (!articleContent) return;
                clearMergedStyles();
                articleContent.innerHTML = createMergedTable(lastBooks, currentSortMode);
                addMergedTableStyles();
                reapplyFilter(); // 跨断点重排后恢复筛选状态
            } else {
                applyColumnDisplay();
            }
        });
    }
    
    // 启动
    init();
    
})();
