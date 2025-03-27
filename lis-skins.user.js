// ==UserScript==
// @name         LIS Skins Helper
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Помощник для сайта lis-skins.com
// @author       Mitchelde
// @match        https://lis-skins.com/ru/market/*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Функция для поиска и извлечения текста из элементов с классом skin-name
    function getSkinNames() {
        const skinNameElements = document.querySelectorAll('div.skin-name');
        const skinNames = Array.from(skinNameElements).map(element => element.textContent);
        console.log('Найденные названия скинов:', skinNames);
        return skinNames;
    }

    // Функция для извлечения названия игры из URL
    function getGameFromUrl() {
        const url = window.location.href;
        const match = url.match(/\/market\/([^\/]+)/);
        if (match) {
            const gameName = match[1];
            console.log('Название игры из URL:', gameName);
            return gameName;
        }
        return null;
    }

    // Запускаем функцию после загрузки страницы
    window.addEventListener('load', function() {
        console.log('LIS Skins Helper загружен');
        getSkinNames();
        getGameFromUrl();
    });
})(); 