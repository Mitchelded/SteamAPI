// ==UserScript==
// @name         LIS Skins Helper
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Помощник для сайта lis-skins.com
// @author       Mitchelde
// @match        https://lis-skins.com/ru/market/*/*
// @grant        GM_xmlhttpRequest
// @connect      api.steampowered.com
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

    // Функция для получения appId из Steam API
    function getSteamAppId(gameName) {
        const apiUrl = `https://api.steampowered.com/ISteamApps/GetAppList/v2/`;
        
        GM_xmlhttpRequest({
            method: 'GET',
            url: apiUrl,
            onload: function(response) {
                try {
                    const data = JSON.parse(response.responseText);
                    const appList = data.applist.apps;
                    
                    // Поиск игры по названию (без учета регистра)
                    const game = appList.find(app => 
                        app.name.toLowerCase() === gameName.toLowerCase()
                    );
                    
                    if (game) {
                        console.log(`AppID для игры ${gameName}:`, game.appid);
                        return game.appid;
                    } else {
                        console.log(`Игра ${gameName} не найдена в Steam`);
                        return null;
                    }
                } catch (error) {
                    console.error('Ошибка при обработке ответа Steam API:', error);
                    return null;
                }
            },
            onerror: function(error) {
                console.error('Ошибка при запросе к Steam API:', error);
                return null;
            }
        });
    }

    // Запускаем функцию после загрузки страницы
    window.addEventListener('load', function() {
        console.log('LIS Skins Helper загружен');
        const gameName = getGameFromUrl();
        if (gameName) {
            getSteamAppId(gameName);
        }
        getSkinNames();
    });
})(); 