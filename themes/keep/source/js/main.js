


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



/* global KEEP */

window.addEventListener('DOMContentLoaded', () => {

  KEEP.themeInfo = {
    theme: `Keep v${KEEP.theme_config.version}`,
    author: 'XPoet',
    repository: 'https://github.com/XPoet/hexo-theme-keep'
  }

  KEEP.localStorageKey = 'KEEP-THEME-STATUS';

  KEEP.styleStatus = {
    isExpandPageWidth: false,
    isDark: false,
    fontSizeLevel: 0,
    isOpenPageAside: true
  }
  /* global KEEP */

  /* global KEEP */

  KEEP.initUtils = () => {

    KEEP.utils = {

      html_root_dom: document.querySelector('html'),
      pageContainer_dom: document.querySelector('.page-container'),
      pageTop_dom: document.querySelector('.page-main-content-top'),
      firstScreen_dom: document.querySelector('.first-screen-container'),
      scrollProgressBar_dom: document.querySelector('.scroll-progress-bar'),
      pjaxProgressBar_dom: document.querySelector('.pjax-progress-bar'),
      pjaxProgressIcon_dom: document.querySelector('.pjax-progress-icon'),
      back2TopButton_dom: document.querySelector('.tool-scroll-to-top'),

      innerHeight: window.innerHeight,
      pjaxProgressBarTimer: null,
      prevScrollValue: 0,
      fontSizeLevel: 0,

      isHasScrollProgressBar: KEEP.theme_config.style.scroll.progress_bar.enable === true,
      isHasScrollPercent: KEEP.theme_config.style.scroll.percent.enable === true,

      // Scroll Style Handle
      styleHandleWhenScroll() {
        const scrollTop = document.body.scrollTop || document.documentElement.scrollTop;
        const scrollHeight = document.body.scrollHeight || document.documentElement.scrollHeight;
        const clientHeight = window.innerHeight || document.documentElement.clientHeight;

        const percent = Math.round(scrollTop / (scrollHeight - clientHeight) * 100);

        if (this.isHasScrollProgressBar) {
          const ProgressPercent = (scrollTop / (scrollHeight - clientHeight) * 100).toFixed(3);
          this.scrollProgressBar_dom.style.visibility = percent === 0 ? 'hidden' : 'visible';
          this.scrollProgressBar_dom.style.width = `${ProgressPercent}%`;
        }

        if (this.isHasScrollPercent) {
          const percent_dom = this.back2TopButton_dom.querySelector('.percent');
          if (percent === 0 || percent === undefined) {
            this.back2TopButton_dom.classList.remove('show');

          } else {
            this.back2TopButton_dom.classList.add('show');
            percent_dom.innerHTML = percent.toFixed(0);
          }
        }

        // hide header handle
        if (scrollTop > this.prevScrollValue && scrollTop > this.innerHeight) {
          this.pageTop_dom.classList.add('hide');
        } else {
          this.pageTop_dom.classList.remove('hide');
        }
        this.prevScrollValue = scrollTop;
      },

      // register window scroll event
      registerWindowScroll() {
        window.addEventListener('scroll', () => {
          // style handle when scroll
          if (this.isHasScrollPercent || this.isHasScrollProgressBar) {
            this.styleHandleWhenScroll();
          }

          // TOC scroll handle
          if (KEEP.theme_config.toc.enable && KEEP.utils.hasOwnProperty('findActiveIndexByTOC')) {
            KEEP.utils.findActiveIndexByTOC();
          }

          // header shrink
          KEEP.utils.headerShrink.headerShrink();
        });
      },

      // toggle show tools list
      toggleShowToolsList() {
        document.querySelector('.tool-toggle-show').addEventListener('click', () => {
          document.querySelector('.side-tools-list').classList.toggle('show');
        });
      },

      // global font adjust
      globalFontAdjust() {
        const fontSize = document.defaultView.getComputedStyle(document.body).fontSize;
        const fs = parseFloat(fontSize);

        const initFontSize = () => {
          const styleStatus = KEEP.getStyleStatus();
          if (styleStatus) {
            this.fontSizeLevel = styleStatus.fontSizeLevel;
            setFontSize(this.fontSizeLevel);
          }
        }

        const setFontSize = (fontSizeLevel) => {
          this.html_root_dom.style.fontSize = `${fs * (1 + fontSizeLevel * 0.05)}px`;
          KEEP.styleStatus.fontSizeLevel = fontSizeLevel;
          KEEP.setStyleStatus();
        }

        initFontSize();

        document.querySelector('.tool-font-adjust-plus').addEventListener('click', () => {
          if (this.fontSizeLevel === 5) return;
          this.fontSizeLevel++;
          setFontSize(this.fontSizeLevel);
        });

        document.querySelector('.tool-font-adjust-minus').addEventListener('click', () => {
          if (this.fontSizeLevel <= 0) return;
          this.fontSizeLevel--;
          setFontSize(this.fontSizeLevel);
        });
      },

      // toggle content area width
      contentAreaWidthAdjust() {
        const toolExpandDom = document.querySelector('.tool-expand-width');
        const headerContentDom = document.querySelector('.header-content');
        const mainContentDom = document.querySelector('.main-content');
        const iconDom = toolExpandDom.querySelector('i');

        const defaultMaxWidth = KEEP.theme_config.style.content_max_width || '1000px';
        const expandMaxWidth = '90%';
        let headerMaxWidth = defaultMaxWidth;

        let isExpand = false;

        if (KEEP.theme_config.style.first_screen.enable === true && window.location.pathname === '/') {
          headerMaxWidth = parseInt(defaultMaxWidth) * 1.2 + 'px';
        }

        const setPageWidth = (isExpand) => {
          KEEP.styleStatus.isExpandPageWidth = isExpand;
          KEEP.setStyleStatus();
          if (isExpand) {
            iconDom.classList.remove('fa-arrows-alt-h');
            iconDom.classList.add('fa-compress-arrows-alt');
            headerContentDom.style.maxWidth = expandMaxWidth;
            mainContentDom.style.maxWidth = expandMaxWidth;
          } else {
            iconDom.classList.remove('fa-compress-arrows-alt');
            iconDom.classList.add('fa-arrows-alt-h');
            headerContentDom.style.maxWidth = headerMaxWidth;
            mainContentDom.style.maxWidth = defaultMaxWidth;
          }
        }

        const initPageWidth = () => {
          const styleStatus = KEEP.getStyleStatus();
          if (styleStatus) {
            isExpand = styleStatus.isExpandPageWidth;
            setPageWidth(isExpand);
          }
        }

        initPageWidth();

        toolExpandDom.addEventListener('click', () => {
          isExpand = !isExpand;
          setPageWidth(isExpand)
        });


      },


      // get dom element height
      getElementHeight(selectors) {
        const dom = document.querySelector(selectors);
        return dom ? dom.getBoundingClientRect().height : 0;
      },

      // init first screen height
      initFirstScreenHeight() {
        this.firstScreen_dom && (this.firstScreen_dom.style.height = this.innerHeight + 'px');
      },

      // init page height handle
      initPageHeightHandle() {
        if (this.firstScreen_dom) return;
        const temp_h1 = this.getElementHeight('.page-main-content-top');
        const temp_h2 = this.getElementHeight('.page-main-content-middle');
        const temp_h3 = this.getElementHeight('.page-main-content-bottom');
        const allDomHeight = temp_h1 + temp_h2 + temp_h3;
        const innerHeight = window.innerHeight;
        const pb_dom = document.querySelector('.page-main-content-bottom');
        if (allDomHeight < innerHeight) {
          const marginTopValue = Math.floor(innerHeight - allDomHeight);
          if (marginTopValue > 0) {
            pb_dom.style.marginTop = `${marginTopValue - 2}px`;
          }
        }
      },

      // big image viewer
      imageViewer() {
        let isBigImage = false;

        const showHandle = (maskDom, isShow) => {
          document.body.style.overflow = isShow ? 'hidden' : 'auto';
          if (isShow) {
            maskDom.classList.add('active');
          } else {
            maskDom.classList.remove('active');
          }
        }

        const imageViewerDom = document.querySelector('.image-viewer-container');
        const targetImg = document.querySelector('.image-viewer-container img');
        imageViewerDom && imageViewerDom.addEventListener('click', () => {
          isBigImage = false;
          showHandle(imageViewerDom, isBigImage);
        });

        const imgDoms = document.querySelectorAll('.markdown-body img');

        if (imgDoms.length) {
          imgDoms.forEach(img => {
            img.addEventListener('click', () => {
              isBigImage = true;
              showHandle(imageViewerDom, isBigImage);
              targetImg.setAttribute('src', img.getAttribute('src'));
            });
          });
        } else {
          this.pageContainer_dom.removeChild(imageViewerDom);
        }
      },

      // set how long ago language
      setHowLongAgoLanguage(p1, p2) {
        return p2.replace(/%s/g, p1)
      },

      getHowLongAgo(timestamp) {
        const l = KEEP.language_ago;

        const __Y = Math.floor(timestamp / (60 * 60 * 24 * 30) / 12);
        const __M = Math.floor(timestamp / (60 * 60 * 24 * 30));
        const __W = Math.floor(timestamp / (60 * 60 * 24) / 7);
        const __d = Math.floor(timestamp / (60 * 60 * 24));
        const __h = Math.floor(timestamp / (60 * 60) % 24);
        const __m = Math.floor(timestamp / 60 % 60);
        const __s = Math.floor(timestamp % 60);

        if (__Y > 0) {
          return this.setHowLongAgoLanguage(__Y, l.year);

        } else if (__M > 0) {
          return this.setHowLongAgoLanguage(__M, l.month);

        } else if (__W > 0) {
          return this.setHowLongAgoLanguage(__W, l.week);

        } else if (__d > 0) {
          return this.setHowLongAgoLanguage(__d, l.day);

        } else if (__h > 0) {
          return this.setHowLongAgoLanguage(__h, l.hour);

        } else if (__m > 0) {
          return this.setHowLongAgoLanguage(__m, l.minute);

        } else if (__s > 0) {
          return this.setHowLongAgoLanguage(__s, l.second);
        }
      },

      // 显示 文章创建日期到现在的时间
      setHowLongAgoInHome() {
        // const post = document.querySelectorAll('.home-article-meta-info .home-article-date');
        // post && post.forEach(v => {
        // const nowDate = Date.now();
        // const postDate = new Date(v.dataset.date.split(' GMT')[0]).getTime();
        // v.innerHTML = this.getHowLongAgo(Math.floor((nowDate - postDate) / 1000));
        // });
      },

      // loading progress bar start
      pjaxProgressBarStart() {
        this.pjaxProgressBarTimer && clearInterval(this.pjaxProgressBarTimer);
        if (this.isHasScrollProgressBar) {
          this.scrollProgressBar_dom.classList.add('hide');
        }

        this.pjaxProgressBar_dom.style.width = '0';
        this.pjaxProgressIcon_dom.classList.add('show');

        let width = 1;
        const maxWidth = 99;

        this.pjaxProgressBar_dom.classList.add('show');
        this.pjaxProgressBar_dom.style.width = width + '%';

        this.pjaxProgressBarTimer = setInterval(() => {
          width += 5;
          if (width > maxWidth) width = maxWidth;
          this.pjaxProgressBar_dom.style.width = width + '%';
        }, 100);
      },

      // loading progress bar end
      pjaxProgressBarEnd() {
        this.pjaxProgressBarTimer && clearInterval(this.pjaxProgressBarTimer);
        this.pjaxProgressBar_dom.style.width = '100%';

        const temp_1 = setTimeout(() => {
          this.pjaxProgressBar_dom.classList.remove('show');
          this.pjaxProgressIcon_dom.classList.remove('show');

          if (this.isHasScrollProgressBar) {
            this.scrollProgressBar_dom.classList.remove('hide');
          }

          const temp_2 = setTimeout(() => {
            this.pjaxProgressBar_dom.style.width = '0';
            clearTimeout(temp_1), clearTimeout(temp_2);
          }, 200);

        }, 200);
      }
    }

    // init scroll
    KEEP.utils.registerWindowScroll();

    // toggle show tools list
    KEEP.utils.toggleShowToolsList();

    // global font adjust
    KEEP.utils.globalFontAdjust();

    // adjust content area width
    KEEP.utils.contentAreaWidthAdjust();


    // init page height handle
    KEEP.utils.initPageHeightHandle();

    // init first screen height
    KEEP.utils.initFirstScreenHeight();

    // big image viewer handle
    KEEP.utils.imageViewer();

    // set how long age in home article block
    KEEP.utils.setHowLongAgoInHome();

  }

  // get styleStatus from localStorage
  KEEP.getStyleStatus = () => {
    let temp = localStorage.getItem(KEEP.localStorageKey);
    if (temp) {
      temp = JSON.parse(temp);
      for (let key in KEEP.styleStatus) {
        KEEP.styleStatus[key] = temp[key];
      }
      return temp;
    } else {
      return null;
    }
  }

  // set styleStatus to localStorage
  KEEP.setStyleStatus = () => {
    localStorage.setItem(KEEP.localStorageKey, JSON.stringify(KEEP.styleStatus));
  }


  KEEP.initModeToggle = () => {

    KEEP.utils.modeToggle = {

      modeToggleButton_dom: document.querySelector('.tool-dark-light-toggle'),
      iconDom: document.querySelector('.tool-dark-light-toggle i'),

      enableLightMode() {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
        this.iconDom.className = 'fas fa-moon';
        KEEP.styleStatus.isDark = false;
        KEEP.setStyleStatus();
      },

      enableDarkMode() {
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
        this.iconDom.className = 'fas fa-sun';
        KEEP.styleStatus.isDark = true;
        KEEP.setStyleStatus();
      },

      isDarkPrefersColorScheme() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
      },

      initModeStatus() {
        const styleStatus = KEEP.getStyleStatus();

        if (styleStatus) {
          styleStatus.isDark ? this.enableDarkMode() : this.enableLightMode();
        } else {
          this.isDarkPrefersColorScheme().matches ? this.enableDarkMode() : this.enableLightMode();
        }
      },

      initModeToggleButton() {
        this.modeToggleButton_dom.addEventListener('click', () => {
          const isDark = document.body.classList.contains('dark-mode');
          isDark ? this.enableLightMode() : this.enableDarkMode();
        });
      },

      initModeAutoTrigger() {
        const isDarkMode = this.isDarkPrefersColorScheme();
        isDarkMode.addEventListener('change', e => {
          e.matches ? this.enableDarkMode() : this.enableLightMode();
        });
      }
    }

    KEEP.utils.modeToggle.initModeStatus();
    KEEP.utils.modeToggle.initModeToggleButton();
    KEEP.utils.modeToggle.initModeAutoTrigger();
  };
  KEEP.initBack2Top = () => {

    KEEP.utils = {

      ...KEEP.utils,

      back2BottomButton_dom: document.querySelector('.tool-scroll-to-bottom'),

      back2top() {
        const scrollTopTimer = setInterval(function () {
          let top = document.body.scrollTop || document.documentElement.scrollTop;
          let speed = top / 2;
          if (document.body.scrollTop !== 0) {
            document.body.scrollTop -= speed;
          } else {
            document.documentElement.scrollTop -= speed;
          }
          if (top === 0) {
            clearInterval(scrollTopTimer);
          }
        }, 50);
      },

      back2Bottom() {
        let scrollHeight = document.body.scrollHeight || document.documentElement.scrollHeight;
        let scrollTop = document.body.scrollTop || document.documentElement.scrollTop;
        const scrollBottomTimer = setInterval(function () {
          if (!scrollTop) scrollTop = 10;
          scrollTop = Math.floor(scrollTop + scrollTop / 2);
          window.scrollTo(0, scrollTop);
          if (scrollTop >= scrollHeight) {
            clearInterval(scrollBottomTimer);
          }
        }, 50);
      },

      initBack2Top() {
        this.back2TopButton_dom.addEventListener('click', () => {
          this.back2top();
        });
      },

      initBack2Bottom() {
        this.back2BottomButton_dom.addEventListener('click', () => {
          this.back2Bottom();
        });
      },
    }

    KEEP.utils.initBack2Top();
    KEEP.utils.initBack2Bottom();

  };
  KEEP.initHeaderShrink = () => {
    KEEP.utils.headerShrink = {
      headerDom: document.querySelector('.header-wrapper'),
      isHeaderShrink: false,

      init() {
        this.headerHeight = this.headerDom.getBoundingClientRect().height;
      },

      headerShrink() {
        const scrollTop = document.body.scrollTop || document.documentElement.scrollTop;

        if (!this.isHeaderShrink && scrollTop > this.headerHeight) {
          this.isHeaderShrink = true;
          document.body.classList.add('header-shrink');
        } else if (this.isHeaderShrink && scrollTop <= this.headerHeight) {
          this.isHeaderShrink = false;
          document.body.classList.remove('header-shrink');
        }

      },

      toggleHeaderDrawerShow() {
        const domList = [document.querySelector('.window-mask'), document.querySelector('.menu-bar')];

        if (KEEP.theme_config.pjax.enable === true) {
          domList.push(...document.querySelectorAll('.header-drawer .drawer-menu-list .drawer-menu-item'));
        }

        domList.forEach(v => {
          v.addEventListener('click', () => {
            document.body.classList.toggle('header-drawer-show');
          });
        });
      }
    }
    KEEP.utils.headerShrink.init();
    KEEP.utils.headerShrink.headerShrink();
    KEEP.utils.headerShrink.toggleHeaderDrawerShow();
  }
  KEEP.refresh = () => {
    KEEP.initUtils();
    KEEP.initHeaderShrink();
    KEEP.initModeToggle();
    KEEP.initBack2Top();

    if (KEEP.theme_config.local_search.enable === true) {
      KEEP.initLocalSearch();
    }

    if (KEEP.theme_config.code_copy.enable === true) {
      KEEP.initCodeCopy();
    }

    if (KEEP.theme_config.lazyload.enable === true) {
      KEEP.initLazyLoad();
    }
  }
  KEEP.refresh();
  // print theme base info
  KEEP.printThemeInfo = () => {
    console.log(`\n %c ${KEEP.themeInfo.theme} %c ${KEEP.themeInfo.repository} \n`, `color: #fadfa3; background: #333; padding: 5px 0;`, `background: #fadfa3; padding: 5px 0;`);
  }




  // =====left side toggle 
  /* global KEEP */

  function initLeftSideToggle() {
    KEEP.utils.leftSideToggle = {
      toggleBar: document.querySelector('.page-aside-toggle'),
      pageTopDom: document.querySelector('.page-main-content-top'),
      containerDom: document.querySelector('.page-container'),
      leftAsideDom: document.querySelector('.page-aside'),
      toggleBarIcon: document.querySelector('.page-aside-toggle i'),

      isOpenPageAside: false,

      initToggleBarButton() {
        this.toggleBar && this.toggleBar.addEventListener('click', () => {
          this.isOpenPageAside = !this.isOpenPageAside;
          KEEP.styleStatus.isOpenPageAside = this.isOpenPageAside;
          KEEP.setStyleStatus();
          this.changePageLayoutWhenOpenToggle(this.isOpenPageAside);
        });
      },

      changePageLayoutWhenOpenToggle(isOpen) {
        this.toggleBarIcon && (this.toggleBarIcon.className = isOpen ? 'fas fa-outdent' : 'fas fa-indent');
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
    };

    KEEP.utils.leftSideToggle.initToggleBarButton();
  }


  initLeftSideToggle();


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
    if (/\/Read\/$/.test(url)) {
      setColorsInCategory();
      if (document.body.clientWidth < 700) {
        generatorCss();
      }
    }
  }


  /* global KEEP */
  function initTOC() {
    KEEP.utils.navItems = document.querySelectorAll('.post-toc-wrap .post-toc li');
    console.log(KEEP.utils.navItems);
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


  initLeftSideToggle();
  KEEP.printThemeInfo();
  // KEEP.refresh();
  addReadStyle();
  initTOC();
});
