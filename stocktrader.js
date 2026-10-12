/** @param {NS} ns **/
export async function main(ns) {
    ns.disableLog("ALL");
    ns.clearLog();
    ns.ui.openTail();

    // CONFIG
    const scriptTimer = 3000;
    const moneyKeep = 1e9;                 // Keep 1b liquid
    const buyLongThreshold = 0.60;         // Buy long if forecast >= 0.60
    const buyShortThreshold = 0.40;        // Buy short if forecast <= 0.40
    const sellLongThreshold = 0.55;        // Sell long if forecast < 0.55
    const sellShortThreshold = 0.45;       // Sell short if forecast > 0.45
    const maxSharePercent = 1.00;          // Use 100% of available shares
    const shortUnlock = ns.getPlayer().has4SDataTixApi;
    const toastDuration = 8000;

    // Format helper
    function fmt(n) {
    return "$" + ns.format.number(n, 3);
}



    // BUY LOGIC
    function buy(stock) {
        const pos = ns.stock.getPosition(stock);
        const forecast = ns.stock.getForecast(stock);
        const ask = ns.stock.getAskPrice(stock);
        const maxShares = ns.stock.getMaxShares(stock) * maxSharePercent;

        const money = ns.getPlayer().money - moneyKeep;
        if (money <= ask) return;

        // LONG BUY
        if (forecast >= buyLongThreshold) {
            const sharesToBuy = Math.min(Math.floor(money / ask), maxShares - pos[0]);
            if (sharesToBuy > 0) {
                const cost = ns.stock.buyStock(stock, sharesToBuy);
                if (cost > 0) ns.toast(`Bought ${sharesToBuy} LONG ${stock} for ${fmt(cost)}`, "success", toastDuration);
            }
        }

        // SHORT BUY
        if (shortUnlock && forecast <= buyShortThreshold) {
            const sharesToBuy = Math.min(Math.floor(money / ask), maxShares - pos[2]);
            if (sharesToBuy > 0) {
                const cost = ns.stock.buyShort(stock, sharesToBuy);
                if (cost > 0) ns.toast(`Bought ${sharesToBuy} SHORT ${stock} for ${fmt(cost)}`, "success", toastDuration);
            }
        }
    }

    // SELL LOGIC
    function sell(stock) {
        const pos = ns.stock.getPosition(stock);
        const forecast = ns.stock.getForecast(stock);
        const bid = ns.stock.getBidPrice(stock);

        // LONG SELL
        if (pos[0] > 0 && forecast < sellLongThreshold) {
            const gain = ns.stock.sellStock(stock, pos[0]);
            ns.toast(`Sold ${pos[0]} LONG ${stock} for ${fmt(gain)}`, "warning", toastDuration);
        }

        // SHORT SELL
        if (shortUnlock && pos[2] > 0 && forecast > sellShortThreshold) {
            const gain = ns.stock.sellShort(stock, pos[2]);
            ns.toast(`Sold ${pos[2]} SHORT ${stock} for ${fmt(gain)}`, "warning", toastDuration);
        }
    }

    // PROFIT CALCULATION
    function calculateWorth() {
        let total = 0;
        for (const stock of ns.stock.getSymbols()) {
            const pos = ns.stock.getPosition(stock);
            const bid = ns.stock.getBidPrice(stock);

            const longShares = pos[0];
            const longPrice = pos[1];
            const shortShares = pos[2];
            const shortPrice = pos[3];

            if (longShares > 0) {
                const profit = (bid - longPrice) * longShares;
                total += profit + (longShares * longPrice);
            }

            if (shortShares > 0) {
                const profitShort = (shortPrice - bid) * shortShares;
                total += profitShort + (shortShares * shortPrice);
            }
        }
        return total;
    }

    // MAIN LOOP
    while (true) {
        const stocks = ns.stock.getSymbols()
            .sort((a, b) => Math.abs(0.5 - ns.stock.getForecast(b)) - Math.abs(0.5 - ns.stock.getForecast(a)));

        ns.print("--------------------------------------------------");

        for (const stock of stocks) {
            sell(stock);
            buy(stock);
        }

        const worth = calculateWorth();
        const netWorth = worth + ns.getPlayer().money;

        ns.print(`Stock Worth: ${fmt(worth)}`);
        ns.print(`Net Worth:   ${fmt(netWorth)}`);
        ns.print(new Date().toLocaleTimeString() + " - Running...");

        ns.print("--------------------------------------------------");

        await ns.sleep(scriptTimer);
        ns.clearLog();
    }
}
