// ==UserScript==
// @name         Hitomi Visited Link Dimmer (Detail Page Only)
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Highlight visited links with transparency on hitomi.la (Detail page visit only)
// @author       JKAKK
// @match        https://hitomi.la/*
// @updateURL    https://raw.githubusercontent.com/junsarakill/jk-hitomi-visited-link-dimmer/JKHVLD.user.js
// @downloadURL  https://raw.githubusercontent.com/junsarakill/jk-hitomi-visited-link-dimmer/JKHVLD.user.js
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function()
{

    class MainManager
    {
        STORAGE_KEY = 'hitomi_visited_ids';

        /**
         * #### 적용 범위 정규식
         * @type {RegExp} 
         */
        APPLY_PAGE_REGEX = /^\/(doujinshi|manga|game|cg|anime|artistg|imageset)\//;

        /**
         * #### 옵저버
         * @type {MutationObserver} 
         */
        observer = null;

        constructor()
        {
            this.init();
        }

        init()
        {
            // 작품 상세 정보 페이지 접속 시 현재 ID 저장 (reader/뷰어 페이지 제외)
            const currentId = this.extractIdFromUrl(location.pathname);
            const isDetailPage = this.APPLY_PAGE_REGEX.test(location.pathname);
        
            if (isDetailPage && currentId)
                this.saveVisitedId(currentId);

            // 초기 실행 및 동적 변경 감시
            this.injectStyle();
            this.applyDimming();

            this.observer = new MutationObserver(() => {
                this.applyDimming();
            });

            this.observer.observe(document.body,
            {
                childList: true,
                subtree: true
            });

            // 다른 탭(상세 페이지)을 보고 검색 탭으로 돌아왔을 때 투명도 갱신
            window.addEventListener('focus', () => {
                this.applyDimming();
            });
        }

        /**
         * #### 저장된 방문 기록 불러오기
         * @returns {Set<string>} - 방문 기록
         */
        getVisitedSet()
        {
            const data = GM_getValue(STORAGE_KEY, []);

            return new Set(data);
        }

        /**
         * #### 방문한 id 저장하기
         * @param {string} id - 방문한 id
         * @returns {void} - 
         */
        saveVisitedId(id)
        {
            const visitedSet = this.getVisitedSet();
            visitedSet.add(id);
            GM_setValue(STORAGE_KEY, Array.from(visitedSet));
        }

        /**
         * #### URL에서 작품 ID 추출
         * @param {string} url - 
         * @returns {string} - 작품 id
         */
        extractIdFromUrl(url)
        {
            const match = url.match(/-(\d+)\.html/) || url.match(/\/reader\/(\d+)\.html/) || url.match(/\/galleries\/(\d+)\.html/);

            resultId = match ? match[1] : null;

            if(!resultId)
                console.log("id 추출 실패")
                
            return resultId
        }

        /**
         * #### 적용시 필요한 스타일 주입
         * @returns {void} - 
         */
        injectStyle()
        {
            if (document.getElementById('hitomi-dimmer-style')) 
            {
                return;
            }

            const style = document.createElement('style');
            style.id = 'hitomi-dimmer-style';
            style.textContent = `
                .visited-dimmed {
                    opacity: 0.35 !important;
                    transition: opacity 0.2s ease-in-out;
                }
                .visited-dimmed:hover {
                    opacity: 0.8 !important;
                }
            `;
            document.head.appendChild(style);
        }

        /**
         * #### 해당하는 카드 투명도 적용
         * @returns {void} - 
         */
        applyDimming()
        {
            const visitedSet = this.getVisitedSet();
            const galleryCards = document.querySelectorAll('.gallery-content > div, .gallery-list > div, .dj-list > div');
    
            galleryCards.forEach(card =>
            {
                const link = card.querySelector('a');
                if (!link) 
                    return;
    
                const galleryId = this.extractIdFromUrl(link.href);
                if (galleryId && visitedSet.has(galleryId))
                    card.classList.add('visited-dimmed');
            });
        }
    }

    // MARK: 실행 영역
    new MainManager();
})();