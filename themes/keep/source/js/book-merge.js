// 书单合并排序功能
(function() {
    'use strict';
    
    // 全局变量
    let originalState = null;
    let isMerged = false;
    
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
    
    // 创建切换按钮
    function createToggleButton() {
        // 检查是否已存在按钮
        if (document.getElementById('book-merge-toggle')) return;
        
        const button = document.createElement('button');
        button.id = 'book-merge-toggle';
        button.innerHTML = '📚 合并所有书单';
        button.style.cssText = `
            position: fixed;
            top: 120px;
            right: 20px;
            z-index: 1000;
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            border: none;
            border-radius: 25px;
            padding: 12px 20px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
            font-family: inherit;
        `;
        
        // 悬停效果
        button.addEventListener('mouseover', function() {
            button.style.transform = 'translateY(-2px)';
            button.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
        });
        
        button.addEventListener('mouseout', function() {
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
        });
        
        button.addEventListener('click', toggleBookList);
        document.body.appendChild(button);
        
        console.log('书单合并按钮已创建');
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
            const year = yearElement ? yearElement.textContent.replace(/[‹›\s]/g, '') : '未知';
            
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
    function createMergedTable(books) {
        // 按星级排序（降序），星级相同按年份排序
        books.sort(function(a, b) {
            if (b.starCount !== a.starCount) {
                return b.starCount - a.starCount;
            }
            return b.year.localeCompare(a.year);
        });
        
        let mergedHTML = `
            <h2 id="merged-booklist">📚 按评分排序的完整书单</h2>
            <div style="margin-bottom: 20px; padding: 15px; background: linear-gradient(45deg, #f093fb 0%, #f5576c 100%); border-radius: 10px; color: white; text-align: center;">
                <strong>共收录 ${books.length} 本书籍，按照评分星级降序排列</strong>
            </div>
            <table class="merged-table">
                <thead>
                    <tr>
                        <th>排名</th>
                        <th>年份</th>
                        <th>分类</th>
                        <th>作者</th>
                        <th>书名</th>
                        <th>评级</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        books.forEach(function(book, index) {
            const rankClass = index < 10 ? 'top-10' : '';
            const rankColor = index < 3 ? '#ff6b6b' : index < 10 ? '#4ecdc4' : '#95a5a6';
            
            mergedHTML += `
                <tr class="merged-row ${rankClass}" data-year="${book.year}" data-stars="${book.starCount}">
                    <td style="font-weight: bold; color: ${rankColor}; text-align: center; font-size: 16px;">${index + 1}</td>
                    <td><span class="year-badge">${book.year}</span></td>
                    <td>${book.category}</td>
                    <td>${book.author}</td>
                    <td>${book.bookName}</td>
                    <td class="rating-cell">${book.rating}</td>
                </tr>
            `;
        });
        
        mergedHTML += `
                </tbody>
            </table>
            <div style="margin-top: 20px; padding: 10px; background: #f8f9fa; border-radius: 5px; font-size: 14px; color: #666;">
                💡 提示：点击右上角的"恢复原始视图"按钮可以切换回按年份分组的视图
            </div>
        `;
        
        return mergedHTML;
    }
    
    // 添加合并表格的样式
    function addMergedTableStyles() {
        const mergedStyles = `
            .year-badge {
                background: linear-gradient(45deg, #667eea, #764ba2);
                color: white;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: bold;
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
            }
            
            .merged-table th,
            .merged-table td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
            }
            
            .merged-table th {
                background-color: #f2f2f2;
                font-weight: bold;
            }
        `;
        
        addNewStyle(mergedStyles);
    }
    
    // 切换书单视图
    function toggleBookList() {
        const button = document.getElementById('book-merge-toggle');
        const articleContent = document.querySelector('.article-content');
        
        if (!articleContent) {
            console.error('未找到文章内容容器');
            return;
        }
        
        if (!isMerged) {
            // 切换到合并视图
            if (!originalState) {
                saveOriginalState();
            }
            
            const books = getAllBooks();
            if (books.length === 0) {
                alert('未找到书籍数据，请检查页面结构');
                return;
            }
            
            const mergedHTML = createMergedTable(books);
            articleContent.innerHTML = mergedHTML;
            addMergedTableStyles();
            
            button.innerHTML = '📋 恢复原始视图';
            button.style.background = 'linear-gradient(45deg, #ff6b6b, #ee5a52)';
            isMerged = true;
            
            console.log('已切换到合并视图');
            
        } else {
            // 恢复原始视图
            if (originalState && originalState.content) {
                articleContent.innerHTML = originalState.content;
                button.innerHTML = '📚 合并所有书单';
                button.style.background = 'linear-gradient(45deg, #667eea, #764ba2)';
                isMerged = false;
                console.log('已恢复原始视图');
            }
        }
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
                setTimeout(createToggleButton, 100);
            });
        } else {
            setTimeout(createToggleButton, 100);
        }
    }
    
    // 启动
    init();
    
})();