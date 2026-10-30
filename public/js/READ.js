function addNewStyle(newStyle) {
    var styleElement = document.getElementById('styles_js');
    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.type = 'text/css';
        styleElement.id = 'styles_js';
        document.getElementsByTagName('head')[0].appendChild(styleElement);
    }
    styleElement.appendChild(document.createTextNode(newStyle));
}

function generatorCss() {
    const cls = `
        .article-content table th:nth-child(1), .article-content table td:nth-child(1), 
        .article-content table th:nth-child(2), .article-content table td:nth-child(2) {
            display: none;
        }
        .article-content table th{
            text-align:left !important;
        }
        .markdown-body > table td, .markdown-body > table th {
            padding: 5px 2px !important;
        }

        .article-content table tr{
            display: flex;
            justify-content: space-between;
        }

       

        .article-content table th:nth-child(3), .article-content table td:nth-child(3), 
        .article-content table th:nth-child(3), .article-content table td:nth-child(4),
        .article-content table th:nth-child(3), .article-content table td:nth-child(5) {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            display: inline-block;
        }

        .markdown-body > table{
            display:block;
        }

        .markdown-body > table > thead,
        .markdown-body > table > tbody{
            display: block;
        }
    `;

    /* 
    
     .article-content table th:nth-child(3), .article-content table td:nth-child(3){
            width: 30%;
        } 
        .article-content table th:nth-child(4), .article-content table td:nth-child(4){
            width: 50%;
        }
        .article-content table th:nth-child(5), .article-content table td:nth-child(5){
            width: 20%;
        }
            */
    addNewStyle(cls);
}

function addReadStyle() {
    setColorsInCategory();
    if (document.body.clientWidth < 700) {
        generatorCss();
    }

}

// 给不同的分类设置颜色
function setColorsInCategory() {
    const markCount = 2; // 前2个
    // 每个table标注种类最多的两个
    // bestInvest: "linear-gradient(109.6deg, rgb(95, 207, 128) 71.8%, rgb(78, 158, 112) 71.8%)",
    const coloredCateObj = {
        投资: "rgb(95, 207, 128,.5)",
        文学: "rgba(22, 138, 173,.3)",
        传记: "rgba(255,150,0,.6)",
        政治: "rgba(229, 107, 111,.3)",
        社会: "rgba(124, 22, 46,.1)",
        历史: "rgba(255, 214, 165,.3)",
        哲学: "rgba(46, 196, 182,.4)",
        心理学: "rgba(155, 246, 255,.5)",
        best: "linear-gradient(109.6deg, rgb(214,180,148) 71.8%,rgb(10,5,0)  71.8%)"
    }

    let _categoryEs = document.querySelectorAll('table');
    _categoryEs.forEach(table => {
        let categoryEs = Array.from(table.querySelectorAll("tbody tr td:nth-child(2)")).map(v => v.innerText);
        // 统计当前Table分类最多的
        let uniqCategoryEs = [...new Set(categoryEs)];
        let cateObj = {};
        uniqCategoryEs.forEach(c => {
            cateObj[c] = 0;
        });
        categoryEs.forEach(c => {
            cateObj[c] += 1;
        })
        // {投资: 3}
        cateObj['投资'] += !isNaN(cateObj['投资/行业研究']) ? cateObj['投资/行业研究'] : 0;
        delete cateObj['投资/行业研究'];

        let objArr = Object.keys(cateObj).map(key => {
            return {
                category: key,
                number: cateObj[key]
            }
        })
        objArr.sort((a, b) => b.number - a.number);

        let Tops = objArr.slice(0, markCount);
        let specTableCateObj = {};
        Tops.forEach(item => {
            let key = item.category;
            specTableCateObj[key] = coloredCateObj[key];
        })

        table.querySelectorAll("tbody tr td:nth-child(2)").forEach(tr => {
            let text = tr.innerText;
            if (text === '投资/行业研究') text = '投资';

            let color = specTableCateObj[text];

            let td = tr.parentElement;
            let rate = td.querySelector("td:last-child");
            if (rate.innerText.trim().length === 5) {
                rate.style.color = 'gold'
                color = coloredCateObj['best']
                td.style.background = color;
            } else {
                if (document.body.clientWidth > 700) {
                    // td.style.background = color;
                }
            }

        })
    })
}

function addWidthStyle() {
    let bw = document.body.clientWidth;

    alert(bw);

    if (bw >= 768 && bw <= 1024) {
        let mc = document.querySelector(".main-content")
        if (mc) {
            mc.style.maxWidth = 'auto';
        }
    }
}

// 书单合并排序功能
let originalState = null; // 存储原始状态
let isMerged = false; // 当前是否处于合并状态

function createToggleButton() {
    // 检查是否已存在按钮
    if (document.getElementById('book-merge-toggle')) return;
    
    // 创建切换按钮
    const button = document.createElement('button');
    button.id = 'book-merge-toggle';
    button.innerHTML = '📚 合并所有书单';
    button.style.cssText = `
        position: fixed;
        top: 100px;
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
    
    // 添加悬停效果
    button.addEventListener('mouseover', () => {
        button.style.transform = 'translateY(-2px)';
        button.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
    });
    
    button.addEventListener('mouseout', () => {
        button.style.transform = 'translateY(0)';
        button.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
    });
    
    // 点击事件
    button.addEventListener('click', toggleBookList);
    
    document.body.appendChild(button);
}

function saveOriginalState() {
    // 保存所有年份标题和表格的原始HTML
    const yearSections = document.querySelectorAll('h2');
    const tables = document.querySelectorAll('table');
    const blockquotes = document.querySelectorAll('blockquote');
    
    originalState = {
        content: document.querySelector('.article-content').innerHTML,
        yearSections: Array.from(yearSections).map(h => h.outerHTML),
        tables: Array.from(tables).map(t => t.outerHTML),
        blockquotes: Array.from(blockquotes).map(bq => bq.outerHTML)
    };
}

function getAllBooks() {
    const tables = document.querySelectorAll('table');
    const books = [];
    
    tables.forEach((table, tableIndex) => {
        // 获取对应的年份
        let yearElement = table.previousElementSibling;
        while (yearElement && yearElement.tagName !== 'H2') {
            yearElement = yearElement.previousElementSibling;
        }
        const year = yearElement ? yearElement.textContent.replace(/[‹›\s]/g, '') : '未知';
        
        // 获取表格中的书籍
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 5) {
                const sequenceNumber = cells[0].textContent.trim();
                const category = cells[1].textContent.trim();
                const author = cells[2].textContent.trim();
                const bookName = cells[3].textContent.trim();
                const rating = cells[4].textContent.trim();
                
                // 计算星星数量
                const starCount = (rating.match(/★/g) || []).length;
                
                books.push({
                    year,
                    sequenceNumber,
                    category,
                    author,
                    bookName,
                    rating,
                    starCount,
                    originalRow: row.outerHTML
                });
            }
        });
    });
    
    return books;
}

function createMergedTable(books) {
    // 按星级排序（降序），然后按年份排序
    books.sort((a, b) => {
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
        <table>
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
    
    books.forEach((book, index) => {
        const rankClass = index < 10 ? 'top-10' : '';
        mergedHTML += `
            <tr class="merged-row ${rankClass}" data-year="${book.year}" data-stars="${book.starCount}">
                <td style="font-weight: bold; color: ${index < 3 ? '#ff6b6b' : index < 10 ? '#4ecdc4' : '#95a5a6'};">${index + 1}</td>
                <td><span class="year-badge">${book.year}</span></td>
                <td>${book.category}</td>
                <td>${book.author}</td>
                <td>${book.bookName}</td>
                <td>${book.rating}</td>
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
            background: rgba(102, 126, 234, 0.1);
            transition: background 0.3s ease;
        }
        
        #merged-booklist {
            text-align: center;
            color: #667eea;
            margin-bottom: 20px;
        }
        
        .merged-row td:first-child {
            text-align: center;
            font-size: 16px;
        }
        
        .merged-row[data-stars="5"] td:last-child {
            color: gold;
            font-weight: bold;
        }
        
        .merged-row[data-stars="4"] td:last-child {
            color: #ffa500;
        }
        
        .merged-row[data-stars="3"] td:last-child {
            color: #32cd32;
        }
    `;
    
    addNewStyle(mergedStyles);
}

function toggleBookList() {
    const button = document.getElementById('book-merge-toggle');
    const articleContent = document.querySelector('.article-content');
    
    if (!isMerged) {
        // 合并视图
        if (!originalState) {
            saveOriginalState();
        }
        
        const books = getAllBooks();
        const mergedHTML = createMergedTable(books);
        
        articleContent.innerHTML = mergedHTML;
        addMergedTableStyles();
        
        button.innerHTML = '📋 恢复原始视图';
        button.style.background = 'linear-gradient(45deg, #ff6b6b, #ee5a52)';
        isMerged = true;
        
        // 重新应用样式
        addReadStyle();
        
    } else {
        // 恢复原始视图
        if (originalState) {
            articleContent.innerHTML = originalState.content;
        }
        
        button.innerHTML = '📚 合并所有书单';
        button.style.background = 'linear-gradient(45deg, #667eea, #764ba2)';
        isMerged = false;
        
        // 重新应用原始样式
        addReadStyle();
    }
}

if (window.location.href.indexOf("/Read/") > 0) {
    addReadStyle();
    addWidthStyle();
    
    // 页面加载完成后创建切换按钮
    document.addEventListener('DOMContentLoaded', createToggleButton);
    
    // 如果DOM已经加载完成，直接创建按钮
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createToggleButton);
    } else {
        createToggleButton();
    }
}