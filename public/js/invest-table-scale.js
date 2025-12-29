// 投资总结页面表格自适应缩放
(function() {
  function scaleFirstTable() {
    // 检查是否是投资总结页面
    if (!window.location.pathname.includes('invest-summary')) {
      return;
    }

    const articleContent = document.querySelector('.article-content');
    if (!articleContent) return;

    const firstTable = articleContent.querySelector('table:first-of-type');
    if (!firstTable) return;

    // 重置可能存在的缩放
    firstTable.style.transform = 'none';
    firstTable.style.transformOrigin = 'left top';

    // 等待表格渲染完成
    setTimeout(() => {
      const containerWidth = articleContent.offsetWidth;
      const tableWidth = firstTable.scrollWidth;

      if (tableWidth > containerWidth) {
        // 计算缩放比例
        const scale = containerWidth / tableWidth;
        console.log(`set_scale_to:${tableWidth}_${containerWidth}`,scale);
        firstTable.style.transform = `scale(${scale})`;

        // 调整表格的margin-bottom，补偿缩放后的高度变化
        const scaledHeight = firstTable.offsetHeight * scale;
        const originalHeight = firstTable.offsetHeight;
        firstTable.style.marginBottom = `${scaledHeight - originalHeight}px`;
      }
    }, 500);
  }

  // 页面加载完成后执行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scaleFirstTable);
  } else {
    scaleFirstTable();
  }

  // 窗口大小改变时重新计算
  // let resizeTimer;
  // window.addEventListener('resize', () => {
  //   clearTimeout(resizeTimer);
  //   resizeTimer = setTimeout(scaleFirstTable, 250);
  // });

  // 支持PJAX
  if (window.KEEP && window.KEEP.pjax) {
    document.addEventListener('pjax:complete', scaleFirstTable);
  }
})();
