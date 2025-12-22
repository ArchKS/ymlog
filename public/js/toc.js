/* global KEEP */
function initTOC() {
  KEEP.utils.navItems = document.querySelectorAll('.post-toc-wrap .post-toc li');

  if (KEEP.utils.navItems.length > 0) {

    KEEP.utils = {

      ...KEEP.utils,

      findActiveIndexByTOC() {
        if (!Array.isArray(KEEP.utils.sections)) return;
        let index = KEEP.utils.sections.findIndex(element => {
          return element && element.getBoundingClientRect().top - 20 > 0;
        });
        if (index === -1) {
          index = KEEP.utils.sections.length - 1;
        } else if (index > 0) {
          index--;
        }
        this.activateNavByIndex(index);
      },

      registerSidebarTOC() {
        KEEP.utils.sections = [...document.querySelectorAll('.post-toc li a.nav-link')].map(element => {
          const target = document.getElementById(decodeURI(element.getAttribute('href')).replace('#', ''));
          element.addEventListener('click', event => {
            event.preventDefault();
            const offset = target.getBoundingClientRect().top + window.scrollY;
            window.anime({
              targets: document.scrollingElement,
              duration: 500,
              easing: 'linear',
              scrollTop: offset - 10,
              complete: function () {
                setTimeout(() => {
                  KEEP.utils.pageTop_dom.classList.add('hide');
                }, 100)
              }
            });
          });
          return target;
        });
      },

      activateNavByIndex(index) {
        const target = document.querySelectorAll('.post-toc li a.nav-link')[index];
        if (!target || target.classList.contains('active-current')) return;

        document.querySelectorAll('.post-toc .active').forEach(element => {
          element.classList.remove('active', 'active-current');
        });
        target.classList.add('active', 'active-current');
        let parent = target.parentNode;
        while (!parent.matches('.post-toc')) {
          if (parent.matches('li')) parent.classList.add('active');
          parent = parent.parentNode;
        }
        // Scrolling to center active TOC element if TOC content is taller then viewport.
        const tocElement = document.querySelector('.post-toc-wrap');
        window.anime({
          targets: tocElement,
          duration: 200,
          easing: 'linear',
          scrollTop: tocElement.scrollTop - (tocElement.offsetHeight / 2) + target.getBoundingClientRect().top - tocElement.getBoundingClientRect().top
        });
      },

      showPageAsideWhenHasTOC() {

        const openHandle = () => {
          const styleStatus = KEEP.getStyleStatus();
          const key = 'isOpenPageAside';
          if (styleStatus && styleStatus.hasOwnProperty(key)) {
            KEEP.utils.leftSideToggle.pageAsideHandleOfTOC(styleStatus[key]);
          } else {
            KEEP.utils.leftSideToggle.pageAsideHandleOfTOC(true);
          }
        }

        const initOpenKey = 'init_open';

        if (KEEP.theme_config.toc.hasOwnProperty(initOpenKey)) {
          KEEP.theme_config.toc[initOpenKey] ? openHandle() : KEEP.utils.leftSideToggle.pageAsideHandleOfTOC(false);

        } else {
          openHandle();
        }

      }
    }

    KEEP.utils.showPageAsideWhenHasTOC();
    KEEP.utils.registerSidebarTOC();

  } else {
    KEEP.utils.pageContainer_dom.removeChild(document.querySelector('.page-aside'));
  }
}

if (KEEP.theme_config.pjax.enable === true && KEEP.utils) {
  initTOC();
} else {
  window.addEventListener('DOMContentLoaded', initTOC);
}


// =====left side toggle 
/* global KEEP */

function initLeftSideToggle() {
  KEEP.utils.leftSideToggle = {

    toggleBar: document.querySelector('.page-aside-toggle'),
    pageTopDom: document.querySelector('.page-main-content-top'),
    containerDom: document.querySelector('.page-container'),
    leftAsideDom: document.querySelector('.page-aside'),
    toggleBarText: document.querySelector('.page-aside-toggle .button-text'),

    isOpenPageAside: false,

    initToggleBarButton() {
      this.toggleBar && this.toggleBar.addEventListener('click', () => {
        this.isOpenPageAside = !this.isOpenPageAside;
        KEEP.styleStatus.isOpenPageAside = this.isOpenPageAside;
        KEEP.setStyleStatus();
        this.changePageLayoutWhenOpenToggle(this.isOpenPageAside);
      });

      // 添加滚动监听，实现半透明效果
      if (this.toggleBar) {
        let scrollTimeout;
        window.addEventListener('scroll', () => {
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

          if (scrollTop > 50) {
            // 滚动超过50px时，添加半透明背景
            this.toggleBar.style.opacity = '0.7';
          } else {
            // 在顶部时，恢复完全不透明
            this.toggleBar.style.opacity = '1';
          }

          // 停止滚动后恢复不透明度
          clearTimeout(scrollTimeout);
          scrollTimeout = setTimeout(() => {
            this.toggleBar.style.opacity = '1';
          }, 1000); // 停止滚动1秒后恢复
        });
      }
    },

    changePageLayoutWhenOpenToggle(isOpen) {
      // 更新按钮文字
      if (this.toggleBarText) {
        this.toggleBarText.textContent = isOpen ? '📑 收起' : '📑 目录';
      }
      const pageAsideWidth = KEEP.theme_config.style.left_side_width || '260px';
      this.containerDom.style.paddingLeft = isOpen ? pageAsideWidth : '0';
      this.pageTopDom.style.paddingLeft = isOpen ? pageAsideWidth : '0';
      this.leftAsideDom.style.left = isOpen ? '0' : `-${pageAsideWidth}`;
    },

    pageAsideHandleOfTOC(isOpen) {
      this.toggleBar.style.display = 'flex';
      this.isOpenPageAside = isOpen;
      this.changePageLayoutWhenOpenToggle(isOpen);
    }
  }
  KEEP.utils.leftSideToggle.initToggleBarButton();
}

if (KEEP.theme_config.pjax.enable === true && KEEP.utils) {
  initLeftSideToggle();
} else {
  window.addEventListener('DOMContentLoaded', initLeftSideToggle);
}


// aminia.js