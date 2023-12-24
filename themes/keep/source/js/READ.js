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

        .article-content table th:nth-child(3), .article-content table td:nth-child(3){
            width: 30%;
        } 
        .article-content table th:nth-child(4), .article-content table td:nth-child(4){
            width: 50%;
        }
        .article-content table th:nth-child(5), .article-content table td:nth-child(5){
            width: 20%;
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
    addNewStyle(cls);
}

function addReadStyle() {
    let url = window.location.href;
    if (url.indexOf("/Read/") > 0) {
        setColorsInCategory();
        if (document.body.clientWidth < 700) {
            generatorCss();
        }
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

        console.log('Tops: ', Tops);

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

addReadStyle();