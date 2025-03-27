// ==UserScript==
// @name         LIS Skins Helper
// @namespace    http://tampermonkey.net/
// @version      0.6
// @description  Помощник для сайта lis-skins.com
// @author       Mitchelde
// @match        https://lis-skins.com/ru/market/*/*
// @grant        GM_xmlhttpRequest
// @connect      api.steampowered.com
// @connect      steamcommunity.com
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
        // Хардкодим известные appId для популярных игр
        const knownAppIds = {
            'rust': 252490,
            'cs2': 730,
            'dota2': 570
        };

        // Проверяем есть ли игра в списке известных
        const normalizedGameName = gameName.toLowerCase();
        if (knownAppIds[normalizedGameName]) {
            return Promise.resolve(knownAppIds[normalizedGameName]);
        }

        return new Promise((resolve, reject) => {
            const apiUrl = `https://api.steampowered.com/ISteamApps/GetAppList/v2/`;
            
            GM_xmlhttpRequest({
                method: 'GET',
                url: apiUrl,
                onload: function(response) {
                    try {
                        const data = JSON.parse(response.responseText);
                        const appList = data.applist.apps;
                        
                        // Ищем точное совпадение сначала
                        let game = appList.find(app => 
                            app.name.toLowerCase() === normalizedGameName
                        );

                        // Если точное совпадение не найдено, ищем частичное
                        if (!game) {
                            game = appList.find(app => 
                                app.name.toLowerCase().includes(normalizedGameName)
                            );
                        }

                        console.log('Найденная игра:', game);
                        if (game) {
                            console.log(`AppID для игры ${gameName}:`, game.appid);
                            resolve(game.appid);
                        } else {
                            console.log(`Игра ${gameName} не найдена в Steam`);
                            resolve(null);
                        }
                    } catch (error) {
                        console.error('Ошибка при обработке ответа Steam API:', error);
                        reject(error);
                    }
                },
                onerror: function(error) {
                    console.error('Ошибка при запросе к Steam API:', error);
                    reject(error);
                }
            });
        });
    }

    // Функция для обновления цен на странице
    function updatePricesOnPage(skinName, itemInfo) {
        const skinElements = document.querySelectorAll('.skin-name');
        console.log('Найденные элементы skin-name:', skinElements);
        for (const element of skinElements) {
            if (element.textContent === skinName) {
                // Ищем ближайший родительский элемент с классом skin-info
                let parentElement = element;
                while (parentElement && !parentElement.classList.contains('skin-info')) {
                    parentElement = parentElement.parentElement;
                }

                if (parentElement) {
                    // Создаем новый блок для отображения цен Steam
                    const steamPriceBlock = document.createElement('div');
                    steamPriceBlock.className = 'steam-price-block';
                    steamPriceBlock.style.cssText = `
                        margin-top: 10px;
                        padding: 10px;
                        border: 1px solid #444;
                        border-radius: 4px;
                        background: #2a2a2a;
                        font-size: 14px;
                        line-height: 1.4;
                        width: 100%;
                        box-sizing: border-box;
                        color: #e0e0e0;
                    `;

                    // Добавляем заголовок блока
                    const blockTitle = document.createElement('div');
                    blockTitle.style.cssText = `
                        font-weight: bold;
                        margin-bottom: 8px;
                        font-size: 16px;
                        color: #66b3ff;
                    `;
                    blockTitle.textContent = 'Цены Steam:';
                    steamPriceBlock.appendChild(blockTitle);

                    // Создаем контейнер для цен
                    const pricesContainer = document.createElement('div');
                    pricesContainer.style.cssText = `
                        display: grid;
                        grid-gap: 8px;
                    `;

                    // Добавляем минимальную цену
                    const lowestPriceDiv = document.createElement('div');
                    lowestPriceDiv.textContent = `Мин. цена: ${itemInfo.lowestPrice.toLocaleString('ru-RU')} ₽`;
                    pricesContainer.appendChild(lowestPriceDiv);

                    // Добавляем медианную цену
                    const medianPriceDiv = document.createElement('div');
                    medianPriceDiv.textContent = `Медианная цена: ${itemInfo.medianPrice.toLocaleString('ru-RU')} ₽`;
                    pricesContainer.appendChild(medianPriceDiv);

                    // Добавляем комиссию
                    const commissionDiv = document.createElement('div');
                    commissionDiv.style.cssText = `
                        color: #ff4444;
                    `;
                    commissionDiv.textContent = `Комиссия Steam: ${itemInfo.commission.toLocaleString('ru-RU')} ₽`;
                    pricesContainer.appendChild(commissionDiv);

                    // Добавляем цену с комиссией
                    const commissionPriceDiv = document.createElement('div');
                    commissionPriceDiv.style.cssText = `
                        color: #4CAF50;
                        font-weight: bold;
                    `;
                    commissionPriceDiv.textContent = `После комиссии: ${itemInfo.priceWithCommission.toLocaleString('ru-RU')} ₽`;
                    pricesContainer.appendChild(commissionPriceDiv);

                    steamPriceBlock.appendChild(pricesContainer);

                    // Добавляем блок после элемента skin-specs
                    const specsElement = parentElement.querySelector('.skin-specs');
                    if (specsElement) {
                        specsElement.parentNode.insertBefore(steamPriceBlock, specsElement.nextSibling);
                    } else {
                        // Если .skin-specs не найден, добавляем в конец skin-info
                        parentElement.appendChild(steamPriceBlock);
                    }
                }
                break;
            }
        }
    }

    // Функция для получения информации о предмете с торговой площадки
    function getMarketItemInfo(appId, itemName) {
        return new Promise((resolve, reject) => {
            const marketHashName = encodeURIComponent(itemName);
            const url = `https://steamcommunity.com/market/priceoverview/?appid=${appId}&currency=5&market_hash_name=${marketHashName}`;
            console.log('URL для запроса:', url);
            
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                onload: function(response) {
                    try {
                        const data = JSON.parse(response.responseText);
                        console.log('Информация о предмете:', data);
                        
                        if (data.success && data.lowest_price && data.median_price) {
                            const lowestPrice = parseFloat(data.lowest_price.replace('₽', '').replace(',', '.'));
                            const medianPrice = parseFloat(data.median_price.replace('₽', '').replace(',', '.'));
                            
                            const itemInfo = {
                                name: itemName,
                                appId: appId,
                                lowestPrice: lowestPrice,
                                volume: data.volume || 0,
                                medianPrice: medianPrice,
                                commission: parseFloat((lowestPrice * 0.15).toFixed(2)),
                                priceWithCommission: parseFloat((lowestPrice * 0.85).toFixed(2))
                            };
                            
                            console.log('Обработанная информация:', itemInfo);
                            updatePricesOnPage(itemName, itemInfo);
                            resolve(itemInfo);
                        } else {
                            console.log('Не удалось найти информацию о предмете или отсутствуют данные о ценах');
                            resolve(null);
                        }
                    } catch (error) {
                        console.error('Ошибка при обработке данных предмета:', error);
                        reject(error);
                    }
                },
                onerror: function(error) {
                    console.error('Ошибка при запросе к торговой площадке:', error);
                    reject(error);
                }
            });
        });
    }
// Функция для получения предметов с сайта lis-skins.com
function getLisSkinsItems() {
    const items = [];
    const marketItems = document.querySelectorAll('.skins-market-skins-list .item');
    
    marketItems.forEach(item => {
        try {
            const nameElement = item.querySelector('.name-inner');
            const priceElement = item.querySelector('.price');
            const steamPriceElement = item.querySelector('.steam-price-discount');
            const similarCountElement = item.querySelector('.similar-count');
            
            if (nameElement && priceElement) {
                const name = nameElement.textContent.trim();
                const price = parseFloat(priceElement.textContent.replace(/[^\d.,]/g, '').replace(',', '.'));
                const steamPrice = steamPriceElement ? parseFloat(steamPriceElement.getAttribute('title').match(/\d+\.?\d*/)[0]) : null;
                const discount = steamPriceElement ? parseInt(steamPriceElement.getAttribute('data-diff-value')) : null;
                const similarCount = similarCountElement ? parseInt(similarCountElement.textContent.match(/\d+/)[0]) : 0;
                
                items.push({
                    name: name,
                    price: price,
                    steamPrice: steamPrice,
                    discount: discount,
                    similarCount: similarCount,
                    url: item.getAttribute('data-link')
                });
            }
        } catch (error) {
            console.error('Ошибка при обработке предмета:', error);
        }
    });
    
    console.log('Найденные предметы:', items);
    return items;
}
    // Запускаем функцию после загрузки страницы
    window.addEventListener('load', async function() {
        console.log('LIS Skins Helper загружен');

        // Получаем предметы с сайта
        const lisItems = getLisSkinsItems();

        const gameName = getGameFromUrl();
        if (gameName) {
            try {
                const appId = await getSteamAppId(gameName);
                console.log('AppID для игры:', appId);
                if (appId) {
                    const skinNames = getSkinNames();
                    console.log('Найденные названия скинов:', skinNames);
                    for (const skinName of skinNames) {
                        await getMarketItemInfo(appId, skinName);
                    }
                }
            } catch (error) {
                console.error('Произошла ошибка:', error);
            }
        }
    });
})(); 