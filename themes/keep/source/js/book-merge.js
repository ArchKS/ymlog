// 书单合并排序功能
(function() {
    'use strict';
    
    // 全局变量
    let originalState = null;
    let isMerged = false;
    let currentSortMode = 'rating'; // 'rating' 或 'category'
    
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

        // 创建按钮容器
        const container = document.createElement('div');
        container.id = 'book-merge-container';
        container.style.cssText = `
            position: fixed;
            top: 10%;
            right: 40px;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            gap: 8px;
        `;

        // 检测是否为手机端
        const isMobile = window.innerWidth <= 768;
        const buttonSize = isMobile ? 'small' : 'normal';

        // 按评级排序按钮
        const ratingButton = createButton('rating', '⭐ 评级', buttonSize);

        // 按分类排序按钮
        const categoryButton = createButton('category', '📂 分类', buttonSize);

        // 恢复原始视图按钮
        const restoreButton = createButton('restore', '📋 原始', buttonSize);
        restoreButton.style.display = 'none'; // 初始隐藏

        container.appendChild(ratingButton);
        container.appendChild(categoryButton);
        container.appendChild(restoreButton);

        document.body.appendChild(container);

        // 添加滚动监听，实现半透明效果
        let scrollTimeout;
        window.addEventListener('scroll', function() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const buttons = [ratingButton, categoryButton, restoreButton];

            if (scrollTop > 50) {
                // 滚动超过50px时，添加半透明背景
                buttons.forEach(function(btn) {
                    btn.style.opacity = '0.7';
                });
            } else {
                // 在顶部时，恢复完全不透明
                buttons.forEach(function(btn) {
                    btn.style.opacity = '1';
                });
            }

            // 停止滚动后恢复不透明度
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(function() {
                buttons.forEach(function(btn) {
                    btn.style.opacity = '1';
                });
            }, 1000); // 停止滚动1秒后恢复
        });

        console.log('书单合并按钮组已创建');
    }
    
    // 创建单个按钮
    function createButton(type, text, size) {
        const button = document.createElement('button');
        button.id = `book-merge-${type}`;
        button.innerHTML = text;

        const isSmall = size === 'small';
        const padding = isSmall ? '8px 12px' : '10px 16px';
        const fontSize = isSmall ? '12px' : '13px';
        const borderRadius = isSmall ? '18px' : '20px';

        // background: ${getButtonColor(type)};
        button.style.cssText = `
            background: #fafaf8;
            color: black;
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
        `;

        // 悬停效果
        button.addEventListener('mouseover', function() {
            button.style.transform = 'translateY(-1px)';
            button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
        });

        button.addEventListener('mouseout', function() {
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
                        toggleBookList(type);
                    }, 50);
                } else {
                    toggleBookList(type);
                }
            }
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
            // 查找对应的年份标题
            let yearElement = table.previousElementSibling;
            while (yearElement && yearElement.tagName !== 'H2') {
                yearElement = yearElement.previousElementSibling;
            }
            // 获取年份并只取前4位数字
        let year = '未知';
        if (yearElement) {
            const yearText = yearElement.textContent.replace(/[‹›\s]/g, '');
            const yearMatch = yearText.match(/\d{4}/);
            year = yearMatch ? yearMatch[0] : yearText;
        }
            
            const rows = table.querySelectorAll('tbody tr');
            rows.forEach(function(row) {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 5) {
                    const rating = cells[4].textContent.trim();
                    const starCount = (rating.match(/★/g) || []).length;
                    
                    books.push({
                        year: year,
                        sequenceNumber: cells[0].textContent.trim(),
                        category: cells[1].textContent.trim(),
                        author: cells[2].textContent.trim(),
                        bookName: cells[3].textContent.trim(),
                        rating: rating,
                        starCount: starCount
                    });
                }
            });
        });
        
        console.log('找到书籍数量:', books.length);
        return books;
    }
    
    // 创建合并后的表格
    function createMergedTable(books, sortMode) {
        const isMobile = window.innerWidth <= 768;
        let sortedBooks = [...books];
        let titleText = '';
        let descriptionText = '';
        
        // 根据排序模式进行排序
        if (sortMode === 'rating') {
            sortedBooks.sort(function(a, b) {
                if (b.starCount !== a.starCount) {
                    return b.starCount - a.starCount;
                }
                return b.year.localeCompare(a.year);
            });
            titleText = '⭐ 按评分排序的完整书单';
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
            
            titleText = '📂 按分类排序的完整书单（含分类内序号）';
            descriptionText = '按照分类数量降序排列，同分类内按评分排序，每个分类内独立编号';
        }
        
        // 构建表头
        let tableHeaders = '';
        if (isMobile) {
            if (sortMode === 'category') {
                tableHeaders = `
                    <tr>
                        <th style="text-align: center !important;">序号</th>
                        <th style="text-align: center !important;">分类</th>
                        <th>作者</th>
                        <th>书名</th>
                        <th>评级</th>
                    </tr>
                `;
            } else {
                tableHeaders = `
                    <tr>
                        <th>作者</th>
                        <th>书名</th>
                        <th>评级</th>
                    </tr>
                `;
            }
        } else {
            if (sortMode === 'rating') {
                tableHeaders = `
                    <tr>
                        <th>排名</th>
                        <th>年份</th>
                        <th>分类</th>
                        <th>作者</th>
                        <th>书名</th>
                        <th>评级</th>
                    </tr>
                `;
            } else {
                tableHeaders = `
                    <tr>
                        <th style="text-align: center !important;">序号</th>
                        <th style="text-align: center !important;">分类</th>
                        <th>年份</th>
                        <th>作者</th>
                        <th>书名</th>
                        <th>评级</th>
                    </tr>
                `;
            }
        }
        
        let mergedHTML = `
            <h2 id="merged-booklist">${titleText}</h2>
            <div style="margin-bottom: 20px; padding: 15px; background: ${getHeaderBackground(sortMode)}; border-radius: 10px; color: white; text-align: center;">
                <strong>共收录 ${sortedBooks.length} 本书籍，${descriptionText}</strong>
            </div>
            <table class="merged-table ${isMobile && sortMode === 'category' ? 'five-columns' : isMobile ? 'three-columns' : ''}">
                <thead>
                    ${tableHeaders}
                </thead>
                <tbody>
        `;
        
        // 构建表格内容
        let currentCategory = '';
        sortedBooks.forEach(function(book, index) {
            const rowClass = getRowClass(book, sortMode, index);
            const rowData = getRowData(book, sortMode, index, isMobile, currentCategory);
            
            if (sortMode === 'category' && book.category !== currentCategory) {
                currentCategory = book.category;
            }
            
            mergedHTML += rowData;
        });
        
        mergedHTML += `
                </tbody>
            </table>
            <div style="margin-top: 20px; padding: 10px; background: #f8f9fa; border-radius: 5px; font-size: 14px; color: #666;">
                💡 提示：点击右上角的"📋 原始"按钮可以切换回按年份分组的视图
            </div>
        `;
        
        return mergedHTML;
    }
    
    // 获取标题背景色
    function getHeaderBackground(sortMode) {
        return sortMode === 'rating' 
            ? 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)'
            : 'linear-gradient(45deg, #f093fb 0%, #f5576c 100%)';
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
    
    // 获取行数据
    function getRowData(book, sortMode, index, isMobile, currentCategory) {
        const rowClass = getRowClass(book, sortMode, index);
        const categoryColor = getCategoryColor(book.category);
        
        if (isMobile) {
            // 手机端根据排序模式显示不同列数
            if (sortMode === 'category') {
                // 分类排序：序号、分类、书名、评级 (4列)
                return `
                    <tr class="${rowClass}" data-year="${book.year}" data-stars="${book.starCount}" data-category="${book.category}">
                        <td style="font-weight: bold; text-align: center; color: #667eea;">${book.categoryIndex}</td>
                        <td><span class="category-badge-mobile" style="background: ${categoryColor};">${book.category}</span></td>
                        <td style="white-space:nowrap;text-overflow:ellipsis;overflow:hidden;text-align:left;">${book.author}</td>
                        <td>${book.bookName}</td>
                        <td class="rating-cell">${book.rating}</td>
                    </tr>
                `;
            } else {
                // 评级排序：作者、书名、评级 (3列)
                return `
                    <tr class="${rowClass}" data-year="${book.year}" data-stars="${book.starCount}" data-category="${book.category}">
                        <td>${book.author}</td>
                        <td>${book.bookName}</td>
                        <td class="rating-cell">${book.rating}</td>
                    </tr>
                `;
            }
        } else {
            // 桌面端根据排序模式显示不同列
            if (sortMode === 'rating') {
                const rankColor = index < 3 ? '#ff6b6b' : index < 10 ? '#4ecdc4' : '#95a5a6';
                return `
                    <tr class="${rowClass}" data-year="${book.year}" data-stars="${book.starCount}" data-category="${book.category}">
                        <td style="font-weight: bold; color: ${rankColor}; text-align: center; font-size: 16px;">${index + 1}</td>
                        <td><span class="year-badge">${book.year}</span></td>
                        <td><span class="category-badge" style="background: ${categoryColor};">${book.category}</span></td>
                        <td>${book.author}</td>
                        <td>${book.bookName}</td>
                        <td class="rating-cell">${book.rating}</td>
                    </tr>
                `;
            } else {
                // 分类排序：序号、分类、年份、作者、书名、评级 (6列)
                return `
                    <tr class="${rowClass}" data-year="${book.year}" data-stars="${book.starCount}" data-category="${book.category}">
                        <td style="font-weight: bold; text-align: center; color: #667eea; font-size: 14px;">${book.categoryIndex}</td>
                        <td style="text-align: center;"><span class="category-badge-main" style="background: ${categoryColor};">${book.category}</span></td>
                        <td><span class="year-badge">${book.year}</span></td>
                        <td>${book.author}</td>
                        <td>${book.bookName}</td>
                        <td class="rating-cell">${book.rating}</td>
                    </tr>
                `;
            }
        }
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
        
        const mergedStyles = `
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
            
            #merged-booklist {
                text-align: center;
                color: #667eea;
                margin-bottom: 20px;
                font-size: ${isMobile ? '18px' : '24px'};
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
                
                /* 3列布局 (评级排序) */
                .merged-table.three-columns td:nth-child(1) {
                    width: 30%;
                    max-width: 80px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                
                .merged-table.three-columns td:nth-child(2) {
                    width: 50%;
                    max-width: 120px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                
                .merged-table.three-columns td:nth-child(3) {
                    width: 20%;
                    min-width: 50px;
                }
                
                /* 5列布局 (分类排序：序号、分类、作者、书名、评级) */
                .merged-table.five-columns td:nth-child(1) {
                    width: 12%;
                    max-width: 35px;
                    text-align: center;
                    min-width: 25px;
                }
                
                .merged-table.five-columns td:nth-child(2) {
                    width: 18%;
                    text-align: center;
                    max-width: 50px;
                }
                
                .merged-table.five-columns td:nth-child(3) {
                    width: 20%;
                    max-width: 60px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                
                .merged-table.five-columns td:nth-child(4) {
                    width: 32%;
                    max-width: 90px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                
                .merged-table.five-columns td:nth-child(5) {
                    width: 18%;
                    min-width: 45px;
                }
                
                .rating-cell {
                    font-size: 14px !important;
                }
            }
            
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
        
        const books = getAllBooks();
        if (books.length === 0) {
            alert('未找到书籍数据，请检查页面结构');
            return;
        }
        
        // 清除之前的样式
        clearMergedStyles();
        
        // 切换到合并视图
        const mergedHTML = createMergedTable(books, sortMode);
        articleContent.innerHTML = mergedHTML;
        addMergedTableStyles();
        
        // 更新按钮状态
        updateButtonStates(sortMode, true);
        currentSortMode = sortMode;
        isMerged = true;
        
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
        articleContent.innerHTML = originalState.content;
        updateButtonStates(null, false);
        isMerged = false;
        currentSortMode = null;
        
        console.log('已恢复原始视图');
    }
    
    // 更新按钮状态
    function updateButtonStates(activeMode, merged) {
        const ratingBtn = document.getElementById('book-merge-rating');
        const categoryBtn = document.getElementById('book-merge-category');
        const restoreBtn = document.getElementById('book-merge-restore');

        if (!ratingBtn || !categoryBtn || !restoreBtn) return;

        if (merged) {
            // 合并视图：显示所有按钮，但高亮当前激活的按钮
            ratingBtn.style.display = 'block';
            categoryBtn.style.display = 'block';
            restoreBtn.style.display = 'block';

            // 重置所有按钮样式
            resetButtonStyle(ratingBtn);
            resetButtonStyle(categoryBtn);
            resetButtonStyle(restoreBtn);

            // 设置活跃按钮样式
            if (activeMode === 'rating') {
                setActiveButtonStyle(ratingBtn);
            } else if (activeMode === 'category') {
                setActiveButtonStyle(categoryBtn);
            }
        } else {
            // 原始视图：显示排序按钮，隐藏恢复按钮
            ratingBtn.style.display = 'block';
            categoryBtn.style.display = 'block';
            restoreBtn.style.display = 'none';

            // 恢复所有按钮样式
            resetButtonStyle(ratingBtn);
            resetButtonStyle(categoryBtn);
            resetButtonStyle(restoreBtn);
        }
    }

    // 重置按钮样式
    function resetButtonStyle(button) {
        button.style.opacity = '1';
        button.style.cursor = 'pointer';
        button.style.transform = 'scale(1)';
        button.style.filter = 'none';
    }

    // 设置激活按钮样式
    function setActiveButtonStyle(button) {
        button.style.opacity = '0.8';
        button.style.transform = 'scale(0.95)';
        button.style.filter = 'brightness(1.1)';
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
            });
        } else {
            setTimeout(createToggleButtons, 100);
        }
    }
    
    // 启动
    init();
    
})();