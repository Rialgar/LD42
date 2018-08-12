Array.prototype.shuffle = function () {
    for (let i = this.length - 1; i >= 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = this[i];
        this[i] = this[j];
        this[j] = temp;
    }
    return this;
}

window.addEventListener('load', () => {
    const gamestate = {
        dom: {
            store: document.getElementById('store'),
            buyers: document.getElementById('buyers'),
            sellers: document.getElementById('sellers'),
            scores: document.getElementById('scores'),
            lives: document.getElementById('lives'),
            items: document.getElementById('items')
        },
        itemMap: {},

        buyers: [],
        store: [],
        sellers: [],
        typeCount: {
            buyers: 3,
            sellers: 3
        },
        generationCounts: {
            buyers: 0,
            sellers: 0
        },
        itemsBought: 0,
        itemsSold: 0,
        lives: 5,

        upcoming: {
            buyers: [],
            sellers: []
        },

        times: {
            sellerCreated: 0,
            buyerCreated: 0,
            bought: 0,
            sold: 0,
            running: 0
        }
    }

    const MAX_SELLERS = 6;
    const ACTIVE_SELLERS = 2;
    const SELLER_INTERVAL = 1 * 1000;
    const MAX_BUYERS = 6;
    const ACTIVE_BUYERS = 2;
    const BUYER_INTERVAL = 3 * 1000;
    const MAX_STORE = 10;
    const LEVEL_COUNT = 15;
    const BUYER_TIME = 30 * 1000;

    const ITEMS = [
        { name: 'Apple' },
        { name: 'Pear' },
        { name: 'Banana' },
        { name: 'Orange' },
        { name: 'Cherry' },
        { name: 'Tomato' },
        { name: 'Potato' },
        { name: 'Plum' },
        { name: 'Apricot' },
        { name: 'Avocado' },
        { name: 'Fig' },
        { name: 'Grape' },
        { name: 'Lemon' },
        { name: 'Mango' },
        { name: 'Melon' },
        { name: 'Pumpkin' },
        { name: 'Olive' },
        { name: 'Peach' }

    ];

    for (let i = 0; i < MAX_STORE; i++) {
        const div = document.createElement('div');
        div.classList.add('item');
        gamestate.dom.store.appendChild(div);
    }
    for (let i = 0; i < MAX_SELLERS; i++) {
        const div = document.createElement('div');
        div.classList.add('item');
        gamestate.dom.sellers.appendChild(div);
    }
    for (let i = 0; i < MAX_BUYERS; i++) {
        const div = document.createElement('div');
        div.classList.add('item');
        gamestate.dom.buyers.appendChild(div);
    }

    const getItem = (type) => {
        if (gamestate.upcoming[type].length === 0) {
            const items = ITEMS.slice(0, gamestate.typeCount[type]);
            gamestate.upcoming[type] = items.concat(items);
            gamestate.upcoming[type].shuffle();
            gamestate.upcoming[type].typeCount = gamestate.typeCount[type];
        }

        const upcoming = gamestate.upcoming[type];
        while (upcoming.typeCount < gamestate.typeCount[type]) {
            const newItem = ITEMS[upcoming.typeCount];
            upcoming.push(newItem);
            upcoming.push(newItem);
            upcoming.shuffle();
            upcoming.typeCount++;
        }

        gamestate.generationCounts[type]++;
        return upcoming.pop();
    }

    const getFreeStoreIndex = () => {
        for (let i = 0; i < MAX_STORE; i++) {
            if (!gamestate.store[i]) {
                return i;
            }
        }
        return -1;
    };

    const styles = {
        queueMarginH: 30,
        itemWidth: 18,
        queueItemMarginH: 11,
        queueActiveItemMarginH: 1,
        storeMarginH: 2,
        storeItemMarginH: .3,

        queueHeight: 40,
        queueMarginV: 1,
        itemHeight: 7,
        itemMarginV: .5,
        storeHeight: 16,
    }

    getSellerPosition = seller => {
        with (styles) {
            if (seller.new) {
                seller.new = false;
                const leftStatic = queueMarginH + queueItemMarginH;
                return {
                    x: leftStatic,
                    y: -itemHeight
                }
            } else {
                const index = gamestate.sellers.indexOf(seller);
                const bottomRow = queueHeight + queueMarginV - itemHeight - itemMarginV;
                if (index < ACTIVE_SELLERS) {
                    const leftStatic = queueMarginH + queueActiveItemMarginH;
                    const leftPerIndex = itemWidth + 2 * queueActiveItemMarginH;
                    return {
                        x: leftStatic + leftPerIndex * index,
                        y: bottomRow
                    }
                } else {
                    const leftStatic = queueMarginH + queueItemMarginH;
                    const topPerRow = itemHeight + 2 * itemMarginV;
                    const row = index + 1 - ACTIVE_SELLERS
                    return {
                        x: leftStatic,
                        y: bottomRow - topPerRow * row
                    }
                }
            }
        }
    }

    getBuyerPosition = buyer => {
        with (styles) {
            if (buyer.new || buyer.isDropping) {
                buyer.new = false;
                const leftStatic = queueMarginH + queueItemMarginH;
                return {
                    x: leftStatic,
                    y: 100
                }
            } else {
                const index = gamestate.buyers.indexOf(buyer);
                const topRow = queueHeight + 3 * queueMarginV + storeHeight + itemMarginV;
                if (index < ACTIVE_SELLERS) {
                    const leftStatic = queueMarginH + queueActiveItemMarginH;
                    const leftPerIndex = itemWidth + 2 * queueActiveItemMarginH;
                    return {
                        x: leftStatic + leftPerIndex * index,
                        y: topRow
                    }
                } else {
                    const leftStatic = queueMarginH + queueItemMarginH;
                    const topPerRow = itemHeight + 2 * itemMarginV;
                    const row = index + 1 - ACTIVE_SELLERS
                    return {
                        x: leftStatic,
                        y: topRow + topPerRow * row
                    }
                }
            }
        }
    }

    getStorePosition = storeEntry => {
        const index = gamestate.store.indexOf(storeEntry);
        with (styles) {
            const x = index > 4 ? index - 5 : index;
            const y = index > 4 ? 1 : 0;
            const leftStatic = storeMarginH + storeItemMarginH;
            const leftPerIndex = itemWidth + 2 * storeItemMarginH;
            const topRow = queueHeight + 2 * queueMarginV + itemMarginV;
            const topPerRow = itemHeight + 2 * itemMarginV;
            return {
                x: leftStatic + leftPerIndex * x,
                y: topRow + topPerRow * y
            }
        }
    }

    const updateItems = () => {
        const elements = Array.prototype.slice.apply(gamestate.dom.items.children);
        elements.forEach(el => {
            const data = gamestate.itemMap[el.id];
            if (!data) {
                el.parentElement.removeChild(el);
            } else {
                let position, background, clickable = false;
                if (data.isScoring) {
                    position = {
                        x: 100,
                        y: 0
                    };
                    background = '';
                } else if (data.isSeller) {
                    position = getSellerPosition(data);
                    background = '';
                    const index = gamestate.sellers.indexOf(data);
                    clickable = index >= 0 && index < ACTIVE_SELLERS;
                } else if (data.isBuyer) {
                    position = getBuyerPosition(data);
                    const gradientWidth = 50
                    const percentage = data.left / BUYER_TIME * (100 + 2 * gradientWidth) - gradientWidth
                    const low = Math.max(0, percentage - gradientWidth);
                    const high = Math.min(100, percentage + gradientWidth);
                    background = `linear-gradient(lightgray 0%, lightgray ${low}%, #ff5555 ${high}%, red ${high}%, red 100%)`;
                } else if (data.isStore) {
                    position = getStorePosition(data);
                    background = '';
                    clickable = true;
                }
                el.style.left = `${position.x}vw`;
                el.style.top = `${position.y}vh`;
                el.style.background = background;
                if (clickable) {
                    el.classList.add('clickable')
                } else {
                    el.classList.remove('clickable')
                }
            }
        });
    }

    const buyItem = seller => {
        const sellerIndex = gamestate.sellers.indexOf(seller);
        if (sellerIndex >= 0 && sellerIndex < ACTIVE_SELLERS) {
            const item = seller.item;
            const storeIndex = getFreeStoreIndex();
            if (storeIndex >= 0) {
                gamestate.sellers.splice(sellerIndex, 1);
                const storeEntry = {
                    isStore: true,
                    item,
                    dom: seller.dom,
                    created: gamestate.times.running
                };
                gamestate.store[storeIndex] = storeEntry;
                gamestate.itemsBought++;
                gamestate.times.bought = gamestate.times.running;

                for (let swap = Math.min(gamestate.sellers.length, ACTIVE_SELLERS) - 1; swap > sellerIndex; swap--) {
                    const later = gamestate.sellers[swap];
                    const earlier = gamestate.sellers[swap - 1];
                    gamestate.sellers[swap] = earlier;
                    gamestate.sellers[swap - 1] = later;
                }

                gamestate.itemMap[storeEntry.dom.id] = storeEntry;
            }
        }
    }

    const sellItem = storeEntry => {
        const storeIndex = gamestate.store.indexOf(storeEntry);
        if (storeIndex >= 0 && storeIndex <= MAX_STORE && storeEntry) {
            let oldestMatch = null;
            let oldestIndex = -1;
            for (let buyerIndex = 0; buyerIndex < ACTIVE_BUYERS; buyerIndex++) {
                const buyer = gamestate.buyers[buyerIndex];
                if (buyer && buyer.item === storeEntry.item && (!oldestMatch || oldestMatch.created > buyer.created)) {
                    oldestMatch = buyer;
                    oldestIndex = buyerIndex;
                }
            }
            if (oldestMatch) {
                gamestate.buyers.splice(oldestIndex, 1);
                gamestate.store[storeIndex] = null;
                gamestate.itemsSold++;
                gamestate.times.sold = gamestate.times.running;

                for (let swap = Math.min(gamestate.buyers.length, ACTIVE_BUYERS) - 1; swap > oldestIndex; swap--) {
                    const later = gamestate.buyers[swap];
                    const earlier = gamestate.buyers[swap - 1];
                    gamestate.buyers[swap] = earlier;
                    gamestate.buyers[swap - 1] = later;
                }

                storeEntry.isScoring = true;
                oldestMatch.isScoring = true;
            }
        }
    }

    const clickItem = id => {
        const target = gamestate.itemMap[id];
        if (target.isSeller) {
            buyItem(target);
        } else if (target.isStore) {
            sellItem(target);
        }
    }

    const maybeRemove = id => {
        item = gamestate.itemMap[id];
        if (item && (item.isScoring || item.isDropping)) {
            delete gamestate.itemMap[id];
        }
    }

    let itemIndex = 0;
    const makeItemDom = item => {
        const id = `item-${itemIndex++}`;
        const div = document.createElement('div');
        div.classList.add('item');
        div.textContent = item.name;
        div.id = id;
        div.addEventListener('click', ev => {
            clickItem(id);
            ev.preventDefault();
        });
        div.addEventListener('transitionend', () => maybeRemove(id), { passive: true });
        div.style.top = 0;
        div.style.left = 0;
        gamestate.dom.items.appendChild(div);

        return div;
    }

    const makeSeller = () => {
        if (gamestate.sellers.length < MAX_SELLERS) {
            const item = getItem('sellers');
            const seller = {
                isSeller: true,
                new: true,
                item,
                dom: makeItemDom(item),
                created: gamestate.times.running
            }
            gamestate.itemMap[seller.dom.id] = seller;
            gamestate.sellers.push(seller);
            gamestate.times.sellerCreated = gamestate.times.running;
        }
    }
    const makeBuyer = () => {
        if (gamestate.buyers.length < MAX_BUYERS) {
            const item = getItem('buyers');
            const buyer = {
                isBuyer: true,
                new: true,
                item,
                dom: makeItemDom(item),
                created: gamestate.times.running,
                left: BUYER_TIME
            }
            gamestate.itemMap[buyer.dom.id] = buyer;
            gamestate.buyers.push(buyer);
            gamestate.times.buyerCreated = buyer.created;
        }
    }

    const updateBuyers = now => {
        gamestate.buyers.forEach(buyer => {
            buyer.left = BUYER_TIME - (now - buyer.created);
        });

        const toRemove = gamestate.buyers.filter(buyer => buyer.left < 0);
        if (toRemove.length > 0) {
            gamestate.lives -= toRemove.length;
            gamestate.generationCounts['buyers'] -= toRemove.length;

            toRemove.forEach(buyer => {
                gamestate.upcoming.buyers.push(buyer.item);
                buyer.isDropping = true;
            });
            gamestate.upcoming.buyers.shuffle();

            gamestate.buyers = gamestate.buyers.filter(buyer => buyer.left >= 0);
        }
    }

    const init = () => {
        gamestate.buyers = [];
        gamestate.store = [];
        gamestate.sellers = [];
        gamestate.typeCount = {
            buyers: 3,
            sellers: 3
        }
        gamestate.itemsBought = 0;
        gamestate.itemsSold = 0;
        gamestate.lives = 5;

        gamestate.upcoming = {
            buyers: [],
            sellers: []
        };

        gamestate.times = {
            sellerCreated: 0,
            buyerCreated: 0,
            bought: 0,
            sold: 0,
            running: 0
        }

        while (gamestate.dom.items.childNodes.length > 0) {
            gamestate.dom.items.removeChild(gamestate.dom.items.firstChild);
        }

        ITEMS.shuffle();

        for (let i = 0; i < 3; i++) {
            makeSeller();
            makeBuyer();
        }
        updateItems();
    }

    init();

    const MESSAGES = [
        { score: 0, message: 'Did you even try?' },
        { score: 20, message: 'Where you bored and stopped?' },
        { score: 38, message: 'Below expactations.' },
        { score: 50, message: 'At least you tried.' },
        { score: 64, message: 'Getting there.' },
        { score: 80, message: 'Could be worse.' },
        { score: 98, message: 'Acceptable.' },
        { score: 118, message: 'Respectable.' },
        { score: 142, message: 'Awesome.' },
        { score: 170, message: 'Astonishingly Amazing!' },
        { score: 202, message: 'Come on now! This has to be cheating.' },
    ]

    const loose = () => {
        let message = '';
        for (var i = 0; i < MESSAGES.length && MESSAGES[i].score <= gamestate.itemsSold; i++) {
            message = MESSAGES[i].message;
        }
        alert(`You lost. You successfully resold ${gamestate.itemsSold} items. ${message} Press OK to restart.`);
        init();
    }

    let last = Date.now();
    let paused = false;
    const step = () => {
        const now = Date.now();
        const delta = Math.min(now - last, 100);
        last = now;

        if (!paused) {
            gamestate.times.running += delta;

            gamestate.typeCount['sellers'] = Math.min(3 + Math.floor(gamestate.generationCounts['sellers'] / LEVEL_COUNT), ITEMS.length);
            gamestate.typeCount['buyers'] = Math.max(gamestate.typeCount['buyers'], Math.min(3 + Math.floor(gamestate.generationCounts['buyers'] / LEVEL_COUNT), ITEMS.length));

            if (gamestate.times.running - gamestate.times.sellerCreated > SELLER_INTERVAL) {
                makeSeller();
            }

            if (gamestate.times.running - gamestate.times.buyerCreated > BUYER_INTERVAL) {
                makeBuyer();
            }

            updateBuyers(gamestate.times.running);
            updateItems();

            if (gamestate.lives <= 0) {
                loose();
            }

            gamestate.dom.scores.textContent = gamestate.itemsSold;
            gamestate.dom.lives.textContent = gamestate.lives;
        }
        window.requestAnimationFrame(step);
    }

    window.requestAnimationFrame(step);

    window.addEventListener('keydown', (ev) => {
        console.log(ev.key);
        const key = ev.key.toUpperCase();
        if (key === 'P' || key === 'PAUSE') {
            paused = !paused;
            ev.preventDefault();
        }
    })

    window.debug = gamestate;
});