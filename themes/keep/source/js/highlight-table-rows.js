// 当路由包含 invest-summary 时，高亮显示包含 TR、CAGR 的表格行
function highlightTableRows() {
  // 检查路由是否包含 invest-summary
  const currentPath = window.location.pathname;
  if (currentPath.indexOf('invest-summary') === -1) {
    return;
  }

  // 检查当前是否为暗色模式
  const isDarkMode = document.body.classList.contains('dark-mode');

  // 为 TR 和 CAGR 定义不同的背景色
  const colors = {
    TR: {
      light: '#e3f2fd',  // 浅蓝色
      dark: '#2d3e50'    // 深蓝色
    },
    CAGR: {
      light: '#fff3e0',  // 浅橙色
      dark: '#4a4230'    // 深橙色
    }
  };

  // 查找页面上的所有 table
  const tables = document.querySelectorAll('table');

  tables.forEach(table => {
    // 获取所有行
    const rows = table.querySelectorAll('tr');

    rows.forEach(row => {
      let rowText = row.innerText || row.textContent;
      rowText = rowText.toUpperCase();

      console.log(rowText);
      // 检查行内容是否包含 TR
      if (rowText.includes('TR')) {
        row.style.backgroundColor = isDarkMode ? colors.TR.dark : colors.TR.light;
      }
      // 检查行内容是否包含 CAGR
      else if (rowText.includes('CAGR')) {
        row.style.backgroundColor = isDarkMode ? colors.CAGR.dark : colors.CAGR.light;
      }
    });
  });
}

// 页面加载完成后执行
window.addEventListener('DOMContentLoaded', highlightTableRows);

// 如果启用了 pjax，也需要在 pjax 加载后执行
document.addEventListener('pjax:complete', highlightTableRows);

// 监听主题切换，当切换主题时重新应用高亮
window.addEventListener('DOMContentLoaded', function() {
  const themeToggleButton = document.querySelector('.tool-dark-light-toggle');
  if (themeToggleButton) {
    themeToggleButton.addEventListener('click', function() {
      // 延迟执行，确保主题切换完成
      setTimeout(highlightTableRows, 100);
    });
  }
});
