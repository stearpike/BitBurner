export async function main(ns) {
    
    const ram = 512;

    let i = 0;

    while (i < ns.getPurchasedServerLimit()) {
        
        if (ns.getServerMoneyAvailable("home") > ns.getPurchasedServerCost(ram)) {
            let hostname = ns.purchaseServer("netlinkServ-" + i, ram);
            ns.scp("target_netlink.js", hostname);
            ns.exec("target_netlink.js", hostname, 180);
            ++i;
        }
        
        await ns.sleep(1000);
    }
}