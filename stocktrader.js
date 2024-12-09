/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog('ALL');
    ns.tail();

    // Globals
    const scriptTimer = 3000;
    const moneyKeep = 1000000000;
    const stockBuyOver_Long = 0.60;
    const stockBuyUnder_Short = 0.40;
    const stockVolatility = 0.05;
    const minSharePercent = 5;
    const maxSharePercent = 1.00;
    const sellThreshold_Long = 0.55;
    const sellThreshold_Short = 0.40;
    const shortUnlock = false;
    const runScript = true;
    const toastDuration = 15000;
    const extraFormats = [1e15, 1e18, 1e21, 1e24, 1e27, 1e30];
    const extraNotations = ["q", "Q", "s", "S", "o", "n"];
    const decimalPlaces = 3;

    function format(number) {
        if (Math.abs(number) < 1e-6) {
            number = 0;
        }

        const answer = ns.formatNumber(number, 3, 100000, '$0.000a');

        if (answer === "NaN") {
            return `${number}`;
        }

        return answer;
    }

    function formatReallyBigNumber(number) {
        if (number === Infinity) return "∞";

        for (let i = 0; i < extraFormats.length; i++) {
            if (extraFormats[i] < number && number <= extraFormats[i] * 1000) {
                return format(number / extraFormats[i], "0." + "0".repeat(decimalPlaces)) + extraNotations[i];
            }
        }

        if (Math.abs(number) < 1000) {
            return format(number, "0." + "0".repeat(decimalPlaces));
        }

        const str = format(number, "0." + "0".repeat(decimalPlaces) + "a");

        if (str === "NaN") return format(number, "0." + " ".repeat(decimalPlaces) + "e+0");

        return str;
    }

    function buyPositions(stock) {
        let position = ns.stock.getPosition(stock);
        let maxShares = (ns.stock.getMaxShares(stock) * maxSharePercent) - position[0];
        let maxSharesShort = (ns.stock.getMaxShares(stock) * maxSharePercent) - position[2];
        let askPrice = ns.stock.getAskPrice(stock);
        let forecast = ns.stock.getForecast(stock);
        let volatilityPercent = ns.stock.getVolatility(stock);
        let playerMoney = ns.getPlayer().money;

        if (forecast >= stockBuyOver_Long && volatilityPercent <= stockVolatility) {
            if (playerMoney - moneyKeep > ns.stock.getPurchaseCost(stock, minSharePercent, "Long")) {
                let shares = Math.min((playerMoney - moneyKeep - 100000) / askPrice, maxShares);
                let boughtFor = ns.stock.buyStock(stock, shares);

                if (boughtFor > 0) {
                    let message = 'Bought ' + Math.round(shares) + ' Long shares of ' + stock + ' for ' + formatReallyBigNumber(boughtFor);
                    ns.toast(message, 'success', toastDuration);
                }
            }
        }

        if (shortUnlock) {
            if (forecast <= stockBuyUnder_Short && volatilityPercent <= stockVolatility) {
                if (playerMoney - moneyKeep > ns.stock.getPurchaseCost(stock, minSharePercent, "Short")) {
                    let shares = Math.min((playerMoney - moneyKeep - 100000) / askPrice, maxSharesShort);
                    let boughtFor = ns.stock.buyShort(stock, shares);

                    if (boughtFor > 0) {
                        let message = 'Bought ' + Math.round(shares) + ' Short shares of ' + stock + ' for ' + formatReallyBigNumber(boughtFor);
                        ns.toast(message, 'success', toastDuration);
                    }
                }
            }
        }
    }

    function sellIfOutsideThreshold(stock) {
        let position = ns.stock.getPosition(stock);
        let forecast = ns.stock.getForecast(stock);

        if (position[0] > 0) {
            let symbolRepeat = Math.floor(Math.abs(forecast * 10)) - 4;
            let plusOrMinus = (forecast > 0.5) ? 50 + symbolRepeat : 50 - symbolRepeat;
            let forcastDisplay = (plusOrMinus > 50 ? "+" : "-").repeat(Math.abs(symbolRepeat));
            let profit = position[0] * (ns.stock.getBidPrice(stock) - position[1]) - (200000);

            ns.print(stock + ' 4S Forecast -> ' + (Math.round(forecast * 100) + '%   ' + forcastDisplay));
            ns.print('      Position -> ' + ns.formatNumber(position[0], 3, 100000, '0.00a'));
            ns.print('      Profit -> ' + ns.formatNumber(profit, 3, 100000, '0.00a'));

            if (forecast < sellThreshold_Long) {
                let soldFor = ns.stock.sellStock(stock, position[0]);
                let message = 'Sold ' + position[0] + ' Long shares of ' + stock + ' for ' + formatReallyBigNumber(soldFor);
                ns.toast(message, 'success', toastDuration);
            }
        }

        if (shortUnlock) {
            if (position[2] > 0) {
                ns.print(stock + ' 4S Forecast -> ' + forecast.toFixed(2));

                if (forecast > sellThreshold_Short) {
                    let soldFor = ns.stock.sellShort(stock, position[2]);
                    let message = 'Sold ' + position[2] + ' Short shares of ' + stock + ' for ' + formatReallyBigNumber(soldFor);
                    ns.toast(message, 'success', toastDuration);
                }
            }
        }
    }

    while (runScript) {
        let orderedStocks = ns.stock.getSymbols().sort(function (a, b) {
            return Math.abs(0.5 - ns.stock.getForecast(b)) - Math.abs(0.5 - ns.stock.getForecast(a));
        });

        let currentWorth = 0;

        ns.print("---------------------------------------");

        for (const stock of orderedStocks) {
            const position = ns.stock.getPosition(stock);

            if (position[0] > 0 || position[2] > 0) {
                sellIfOutsideThreshold(stock);
            }

            buyPositions(stock);

            if (position[0] > 0 || position[2] > 0) {
                let longShares = position[0];
                let longPrice = position[1];
                let shortShares = position[2];
                let shortPrice = position[3];
                let bidPrice = ns.stock.getBidPrice(stock);

                let profit = longShares * (bidPrice - longPrice) - (2 * 100000);
                let profitShort = shortShares * Math.abs(bidPrice - shortPrice) - (2 * 100000);

                currentWorth += profitShort + profit + (longShares * longPrice) + (shortShares * shortPrice);
            }
        }

        ns.print("---------------------------------------");
        ns.print('Current Stock Worth: ' + formatReallyBigNumber(currentWorth));
        ns.print('Current Net Worth: ' + formatReallyBigNumber(currentWorth + ns.getPlayer().money));
        ns.print(new Date().toLocaleTimeString() + ' - Running ...');
        ns.print("---------------------------------------");

        await ns.sleep(scriptTimer);
        ns.clearLog();
    }
}
