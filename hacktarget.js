/** @param {NS} ns */
export async function main(ns) {
  let target = ns.args[0];
      while (true) {
        if (ns.getServerSecurityLevel(target) >= ns.getServerMinSecurityLevel(target) + 5) {
            ns.print('Weakening host');
            await ns.weaken(target);
        } else if (ns.getServerMoneyAvailable(target) < ns.getServerMaxMoney(target)) {
            ns.print('Growing host');
            await ns.grow(target);
        } else {
            ns.print('Hacking host');
            await ns.hack(target);
        }
    }

}