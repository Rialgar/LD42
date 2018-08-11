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
    const gamestate = {};

    const MAX_SELLERS = 6;
    const ACTIVE_SELLERS = 2;
    const SELLER_INTERVAL = 3 * 1000;
    const MAX_BUYERS = 5;
    const ACTIVE_BUYERS = 1;
    const BUYER_INTERVAL = 3 * 1000;
    const MAX_STORE = 10;
    const LEVEL_COUNT = 15;

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
    ].shuffle();

    gamestate.buyers = [];
    gamestate.store = [];
    gamestate.sellers = [];
    gamestate.itemTypes = 3;
    gamestate.itemsBought = 0;
    gamestate.itemsSold = 0;

    gamestate.dom = {
        store: document.getElementById('store'),
        buyers: document.getElementById('buyers'),
        sellers: document.getElementById('sellers')
    }

    gamestate.times = {
        sellerCreated: 0,
        buyerCreated: 0,
        bought: 0,
        sold: 0
    }

    const getItem = () => ITEMS[Math.floor(Math.random() * gamestate.itemTypes)];

    const getFreeStoreIndex = () => {
        for (let i = 0; i < MAX_STORE; i++) {
            if (!gamestate.store[i]) {
                return i;
            }
        }
        return -1;
    };

    const buyItem = seller => {
        const index = gamestate.sellers.indexOf(seller);
        if (index >= 0 && index < ACTIVE_SELLERS && gamestate.sellers.length >= index) {
            storeIndex = getFreeStoreIndex();
            if (storeIndex >= 0) {
                gamestate.sellers.splice(index, 1);
                gamestate.store[storeIndex] = seller.item;
                gamestate.itemsBought++;
                gamestate.times.bought = Date.now();

                const itemDom = gamestate.dom.store.children[storeIndex];
                itemDom.classList.remove('empty');
                itemDom.textContent = seller.item.name;

                seller.dom.parentElement.removeChild(seller.dom);
            }
        }
    }

    const sellItem = index => {
        if (index >= 0 && index <= MAX_STORE && gamestate.store[index]) {
            const item = gamestate.store[index];
            const dom = gamestate.dom.store.children[index];
            for (let buyerIndex = 0; buyerIndex < ACTIVE_BUYERS; buyerIndex++) {
                const buyer = gamestate.buyers[buyerIndex];
                if (buyer && buyer.item === item) {
                    gamestate.store[index] = null;
                    dom.textContent = '';
                    dom.classList.add('empty');

                    gamestate.buyers.splice(buyerIndex, 1);
                    buyer.dom.parentElement.removeChild(buyer.dom);

                    gamestate.itemsSold++;
                    gamestate.times.sold++;

                    gamestate.itemTypes = 3 + Math.floor(gamestate.itemsSold / LEVEL_COUNT);
                }
            }

        }
    }

    for (let i = 0; i < MAX_STORE; i++) {
        const div = document.createElement('div');
        div.classList.add('item');
        div.classList.add('empty');
        div.addEventListener('click', (index => () => sellItem(index))(i))
        gamestate.dom.store.appendChild(div);
    }

    let lastTypeCount = gamestate.itemTypes;
    const makeSeller = () => {
        if (gamestate.sellers.length < MAX_SELLERS) {
            let item;
            if (lastTypeCount !== gamestate.itemTypes) {
                lastTypeCount = gamestate.itemTypes;
                item = ITEMS[lastTypeCount - 1];
            } else {
                item = getItem();
            }

            const seller = {
                item,
                dom: document.createElement('div')
            }

            seller.dom.classList.add('item');
            seller.dom.textContent = seller.item.name;
            seller.dom.addEventListener('click', () => buyItem(seller));

            gamestate.dom.sellers.appendChild(seller.dom);
            gamestate.sellers.push(seller);
            gamestate.times.sellerCreated = Date.now();
        }
    }

    makeSeller();
    makeSeller();
    makeSeller();

    const makeBuyer = () => {
        if (gamestate.buyers.length < MAX_BUYERS) {
            const buyer = {
                item: getItem(),
                dom: document.createElement('div'),
                created: Date.now()
            }

            buyer.dom.classList.add('item');
            buyer.dom.textContent = buyer.item.name;

            gamestate.dom.buyers.appendChild(buyer.dom);
            gamestate.buyers.push(buyer);
            gamestate.times.buyerCreated = buyer.created;
        }
    }

    makeBuyer();
    makeBuyer();
    makeBuyer();

    let last = Date.now();
    const step = () => {
        const now = Date.now();
        const delta = now - last;
        last = now;

        if (now - gamestate.times.sellerCreated > SELLER_INTERVAL) {
            makeSeller();
        }

        if (now - gamestate.times.buyerCreated > BUYER_INTERVAL) {
            makeBuyer();
        }

        window.requestAnimationFrame(step);
    }

    window.requestAnimationFrame(step);

    window.debug = gamestate;
});