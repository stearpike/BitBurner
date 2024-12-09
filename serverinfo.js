/** @param {NS} ns **/
export async function main(ns) {
    let target = ns.args[0];
    let server = ns.getServer(target);

    // Calculate available RAM and max threads for the script
    let ramAvailable = server.maxRam - server.ramUsed;
    let ramPerThread = ns.getScriptRam('hack.js');  // Ensure you use the correct script name
    let maxThreads = Math.floor(ramAvailable / ramPerThread);

    // Function to find the path to a target server
    function findServerPath(target) {
        let serverPath = [];
        function dfs(serverName, path) {
            if (serverName === target) {
                serverPath = path;
                return true;
            }
            for (let neighbor of ns.scan(serverName)) {
                if (!path.includes(neighbor)) {
                    if (dfs(neighbor, path.concat(neighbor))) {
                        return true;
                    }
                }
            }
            return false;
        }
        dfs('home', ['home']);
        return serverPath;
    }

    let serverPath = findServerPath(target);

    ns.tprint("------------------------------------");
    ns.tprint("Server Information");
    ns.tprint("------------------------------------");
    ns.tprint("Host Name: " + server.hostname);
    ns.tprint("IP: " + server.ip);
    ns.tprint("Owned By: " + server.organizationName);
    ns.tprint("Path: " + serverPath.join(" -> "));
    ns.tprint("");
    ns.tprint("------------------------------------");
    ns.tprint("Security Information");
    ns.tprint("------------------------------------");
    ns.tprint("Required Hacking Level: " + server.requiredHackingSkill);
    ns.tprint("Min Security Level: " + server.minDifficulty);
    ns.tprint("Current Security: " + ns.formatNumber(server.hackDifficulty, 2));
    ns.tprint("");
    ns.tprint("------------------------------------");
    ns.tprint("Money Information");
    ns.tprint("------------------------------------");
    ns.tprint("Max Money: " + ns.formatNumber(server.moneyMax, 2));
    ns.tprint("Current Money: " + ns.formatNumber(server.moneyAvailable, 2));
    ns.tprint("Server Growth: " + server.serverGrowth);
    ns.tprint("");
    ns.tprint("------------------------------------");
    ns.tprint("Hardware Information");
    ns.tprint("------------------------------------");
    ns.tprint("Cores: " + server.cpuCores);
    ns.tprint("Max RAM: " + server.maxRam);
    ns.tprint("Used RAM: " + server.ramUsed);
    ns.tprint("Max Threads: " + maxThreads);
    ns.tprint("");
    ns.tprint("------------------------------------");
    ns.tprint("Hacking Information");
    ns.tprint("------------------------------------");
    ns.tprint("Rooted: " + server.hasAdminRights);
    ns.tprint("Backdoored: " + server.backdoorInstalled);
    ns.tprint("Required Open Ports: " + server.numOpenPortsRequired);
    ns.tprint("Ports Currently Open: " + server.openPortCount);
    ns.tprint("------------------------------------");
}
