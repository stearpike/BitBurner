/** @param {NS} ns **/
export async function main(ns) {
    const target = ns.getHostname(); // Use the server the script is installed on

    while (true) {
        if (ns.getServerSecurityLevel(target) >= ns.getServerMinSecurityLevel(target) + 5) {
            ns.print(`Weakening ${target}`);
            await ns.weaken(target);
        } else if (ns.getServerMoneyAvailable(target) < ns.getServerMaxMoney(target) * 0.75) {
            ns.print(`Growing ${target}`);
            await ns.grow(target);
        } else {
            ns.print(`Hacking ${target}`);
            await ns.hack(target);
        }
    }
}
