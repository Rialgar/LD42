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
            lives: document.getElementById('lives')
        },
        buyers: [],
        store: [],
        sellers: [],
        typeCount: 3,
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
    const SELLER_INTERVAL = 3 * 1000;
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
        { name: 'Pumpkin' }
    ];

    const getItem = (type) => {
        if (gamestate.upcoming[type].length === 0) {
            const items = ITEMS.slice(0, gamestate.typeCount);
            gamestate.upcoming[type] = items.concat(items);
            gamestate.upcoming[type].shuffle();
            gamestate.upcoming[type].typeCount = gamestate.typeCount;
        }

        const upcoming = gamestate.upcoming[type];
        while (upcoming.typeCount < gamestate.typeCount) {
            const newItem = ITEMS[upcoming.typeCount];
            upcoming.push(newItem);
            upcoming.push(newItem);
            upcoming.shuffle();
            upcoming.typeCount++;
        }

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

    const updateQueue = type => {
        const elements = gamestate.dom[type].children;
        const queue = gamestate[type];
        for (let i = 0; i < elements.length; i++) {
            const el = elements[i];
            if (i < queue.length) {
                el.textContent = queue[i].item.name;
                el.classList.remove('empty');
                if (typeof (queue[i].left) === 'number') {
                    const percentage = queue[i].left / BUYER_TIME * 100;
                    el.style.background = `linear-gradient(white, white ${percentage}%, red ${percentage}%, red)`;
                }
            } else {
                el.textContent = '';
                el.classList.add('empty');
                el.style.background = '';
            }
        }
    }

    const buyItem = sellerIndex => {
        if (sellerIndex >= 0 && sellerIndex < ACTIVE_SELLERS && gamestate.sellers[sellerIndex]) {
            const item = gamestate.sellers[sellerIndex].item;
            storeIndex = getFreeStoreIndex();
            if (storeIndex >= 0) {
                gamestate.sellers.splice(sellerIndex, 1);
                gamestate.store[storeIndex] = item;
                gamestate.itemsBought++;
                gamestate.times.bought = gamestate.times.running;

                const itemDom = gamestate.dom.store.children[storeIndex];
                itemDom.classList.remove('empty');
                itemDom.textContent = item.name;

                for (let swap = Math.min(gamestate.sellers.length, ACTIVE_SELLERS) - 1; swap > sellerIndex; swap--) {
                    const later = gamestate.sellers[swap];
                    const earlier = gamestate.sellers[swap - 1];
                    gamestate.sellers[swap] = earlier;
                    gamestate.sellers[swap - 1] = later;
                }
                updateQueue('sellers');
            }
        }
    }

    const sellItem = storeIndex => {
        if (storeIndex >= 0 && storeIndex <= MAX_STORE && gamestate.store[storeIndex]) {
            const item = gamestate.store[storeIndex];
            for (let buyerIndex = 0; buyerIndex < ACTIVE_BUYERS; buyerIndex++) {
                const buyer = gamestate.buyers[buyerIndex];
                if (buyer && buyer.item === item) {
                    gamestate.buyers.splice(buyerIndex, 1);
                    gamestate.store[storeIndex] = null;
                    gamestate.itemsSold++;
                    gamestate.times.sold = gamestate.times.running;

                    const itemDom = gamestate.dom.store.children[storeIndex];
                    itemDom.textContent = '';
                    itemDom.classList.add('empty');

                    for (let swap = Math.min(gamestate.buyers.length, ACTIVE_BUYERS) - 1; swap > buyerIndex; swap--) {
                        const later = gamestate.buyers[swap];
                        const earlier = gamestate.buyers[swap - 1];
                        gamestate.buyers[swap] = earlier;
                        gamestate.buyers[swap - 1] = later;
                    }
                    updateQueue('buyers');
                    break;
                }
            }

        }
    }

    for (let i = 0; i < MAX_STORE; i++) {
        const div = document.createElement('div');
        div.classList.add('item');
        div.addEventListener('click', (index => () => sellItem(index))(i))
        gamestate.dom.store.appendChild(div);
    }
    for (let i = 0; i < MAX_SELLERS; i++) {
        const div = document.createElement('div');
        div.classList.add('item');
        div.addEventListener('click', (index => () => buyItem(index))(i))
        gamestate.dom.sellers.appendChild(div);
    }
    for (let i = 0; i < MAX_BUYERS; i++) {
        const div = document.createElement('div');
        div.classList.add('item');
        gamestate.dom.buyers.appendChild(div);
    }

    const makeSeller = () => {
        if (gamestate.sellers.length < MAX_SELLERS) {
            const seller = {
                item: getItem('sellers')
            }
            gamestate.sellers.push(seller);
            gamestate.times.sellerCreated = gamestate.times.running;
            updateQueue('sellers');
        }
    }
    const makeBuyer = () => {
        if (gamestate.buyers.length < MAX_BUYERS) {
            const buyer = {
                item: getItem('buyers'),
                created: gamestate.times.running,
                left: BUYER_TIME
            }
            gamestate.buyers.push(buyer);
            gamestate.times.buyerCreated = buyer.created;
            updateQueue('buyers');
        }
    }

    const updateBuyers = now => {
        gamestate.buyers.forEach(buyer => {
            buyer.left = BUYER_TIME - (now - buyer.created);
        });

        const toRemove = gamestate.buyers.filter(buyer => buyer.left < 0);
        if (toRemove.length > 0) {
            gamestate.lives -= toRemove.length;

            toRemove.forEach(buyer => gamestate.upcoming.buyers.push(buyer.item));
            gamestate.upcoming.buyers.shuffle();

            gamestate.buyers = gamestate.buyers.filter(buyer => buyer.left >= 0);
        }

        updateQueue('buyers');
    }

    const init = () => {
        gamestate.buyers = [];
        gamestate.store = [];
        gamestate.sellers = [];
        gamestate.typeCount = 3;
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

        updateQueue('sellers');
        updateQueue('buyers');

        Array.prototype.forEach.call(gamestate.dom.store.children, el => {
            el.classList.add('empty');
            el.textContent = '';
        });

        ITEMS.shuffle();

        for (let i = 0; i < 3; i++) {
            makeSeller();
            makeBuyer();
        }
    }

    init();

    const loose = () => {
        alert(`You lost, but you successfully resold ${gamestate.itemsSold} items. Press OK to restart.`);
        init();
    }

    let last = Date.now();
    const step = () => {
        const now = Date.now();
        const delta = Math.min(now - last, 100);
        last = now;

        gamestate.times.running += delta;

        gamestate.typeCount = Math.min(3 + Math.floor(gamestate.itemsSold / LEVEL_COUNT), ITEMS.length);

        if (gamestate.times.running - gamestate.times.sellerCreated > SELLER_INTERVAL) {
            makeSeller();
        }

        if (gamestate.times.running - gamestate.times.buyerCreated > BUYER_INTERVAL) {
            makeBuyer();
        }

        updateBuyers(gamestate.times.running);

        if (gamestate.lives <= 0) {
            loose();
        }

        gamestate.dom.scores.textContent = gamestate.itemsSold;
        gamestate.dom.lives.textContent = gamestate.lives;

        window.requestAnimationFrame(step);
    }

    window.requestAnimationFrame(step);

    window.debug = gamestate;
});