// ==UserScript==
// @name         Hitomi Visited Link Dimmer (Detail Page Only)
// @namespace    http://tampermonkey.net/
// @version      2.2
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
    const STORAGE_KEY = 'hitomi_visited_ids';

    // 저장된 방문 ID 목록 불러오기
    function getVisitedSet()
    {
        const data = GM_getValue(STORAGE_KEY, []);
        return new Set(data);
    }

    // 방문한 ID 저장하기
    function saveVisitedId(id)
    {
        const visitedSet = getVisitedSet();
        visitedSet.add(id);
        GM_setValue(STORAGE_KEY, Array.from(visitedSet));
    }

    // URL 경로에서 작품 ID 추출 (예: /doujinshi/title-korean-12345.html 또는 /reader/12345.html)
    function extractIdFromUrl(url)
    {
        const match = url.match(/-(\d+)\.html/) || url.match(/\/reader\/(\d+)\.html/) || url.match(/\/galleries\/(\d+)\.html/);
        return match ? match[1] : null;
    }

    // 1. 작품 상세 정보 페이지 접속 시에만 현재 ID 저장 (reader/뷰어 페이지 제외)
    const currentId = extractIdFromUrl(location.pathname);
    const isDetailPage = /^\/(doujinshi|manga|game|cg|anime|artistg|imageset)\//.test(location.pathname);

    if (isDetailPage && currentId)
    {
        saveVisitedId(currentId);
    }

    // 2. 검색 및 목록 페이지 처리
    //
    function injectStyle()
    {
        if (document.getElementById('hitomi-dimmer-style')) return;
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

    // 카드 투명도 적용
    function applyDimming()
    {
        const visitedSet = getVisitedSet();
        const galleryCards = document.querySelectorAll('.gallery-content > div, .gallery-list > div, .dj-list > div');

        galleryCards.forEach(card =>
        {
            const link = card.querySelector('a');
            if (!link) return;

            const galleryId = extractIdFromUrl(link.href);
            if (galleryId && visitedSet.has(galleryId))
            {
                card.classList.add('visited-dimmed');
            }
        });
    }

    // 초기 실행 및 동적 변경 감시
    injectStyle();
    applyDimming();

    const observer = new MutationObserver(() =>
    {
        applyDimming();
    });

    observer.observe(document.body,
    {
        childList: true,
        subtree: true
    });

    // 다른 탭(상세 페이지)을 보고 검색 탭으로 돌아왔을 때 투명도 갱신
    window.addEventListener('focus', () =>
    {
        applyDimming();
    });
})();