/** @param {NS} ns **/
export async function main(ns) {

    // MODE ARG: "money" or "hack"
    const mode = ns.args[0] || "money";   // default = money

    let serversList = ['home'];
    let serversNotHacket = [];
    let doubleLine = "\n ================================================================ \n";
    let singleLine = "\n ---------------------------------------------------------------- \n";

    let printThis = (stringToPrint) => ns.tprint(stringToPrint);

    /** Scan network */
    async function netSpider(serversList) {
        for (let i = 0; i < serversList.length; i++) {
            let thisScan = ns.scan(serversList[i]);
            for (let j = 0; j < thisScan.length; j++) {

                if (thisScan[j].startsWith("hacknet-")) continue;

                if (!serversList.includes(thisScan[j])) {
                    serversList.push(thisScan[j]);
                }
            }
        }
        return serversList;
    }

    /** Copy hacking script to target */
    async function copyToTarget(fileToCopy, serverName) {
        if (ns.fileExists(fileToCopy, serverName)) ns.rm(fileToCopy, serverName);
        await ns.scp(fileToCopy, serverName, 'home');
    }

    function canBeHacked(serverName) {
        return ns.getHackingLevel() >= ns.getServerRequiredHackingLevel(serverName);
    }

    async function lockSmith(serverName) {
        if (ns.fileExists("BruteSSH.exe")) await ns.brutessh(serverName);
        if (ns.fileExists("FTPCrack.exe")) await ns.ftpcrack(serverName);
        if (ns.fileExists("relaySMTP.exe")) await ns.relaysmtp(serverName);
        if (ns.fileExists("HTTPWorm.exe")) await ns.httpworm(serverName);
        if (ns.fileExists("SQLInject.exe")) await ns.sqlinject(serverName);
    }

    function howManyThreads(serverName, scriptName) {
        return Math.floor(
            (ns.getServerMaxRam(serverName) - ns.getServerUsedRam(serverName)) /
            ns.getScriptRam(scriptName)
        );
    }

    function addToNotHackedList(serverToBeadded) {
        serversNotHacket.push(serverToBeadded);
    }

    function checkHack(serverName) {
        return ns.hasRootAccess(serverName);
    }

    async function gainRootAccess(serverName) {
        await lockSmith(serverName);
        ns.nuke(serverName);
    }

    /** MODE-BASED SCORING */
    function scoreServer(host) {
        const s = ns.getServer(host);
        const p = ns.getPlayer();

        if (!s.hasAdminRights) return 0;
        if (s.moneyMax === 0) return 0;

        const chance = ns.formulas.hacking.hackChance(s, p);
        const percent = ns.formulas.hacking.hackPercent(s, p);
        const time = ns.formulas.hacking.hackTime(s, p);

        if (mode === "money") {
            return s.moneyMax * percent * chance / time;
        }

        if (mode === "hack") {
            return percent / time;
        }

        return 0;
    }

    function pickBestServer(servers) {
        let best = "n00dles";
        let bestScore = 0;

        for (const host of servers) {
            const score = scoreServer(host);
            if (score > bestScore) {
                bestScore = score;
                best = host;
            }
        }
        return best;
    }

    /** Kill old hack.js scripts */
  function killOldScripts(serversList, scriptName) {
      for (const server of serversList) {
          const procs = ns.ps(server);
          for (const proc of procs) {
              if (proc.filename === scriptName) {
                ns.kill(proc.pid);
            }
        }
    }
}


    /** Gain root + copy hack.js */
    async function doorHammer(serversList, runThisScript) {
        for (const currentServer of serversList) {

            if (currentServer === 'home') continue;

            if (!canBeHacked(currentServer)) {
                addToNotHackedList(currentServer);
                continue;
            }

            if (!checkHack(currentServer)) {
                await gainRootAccess(currentServer);
            }

            if (!checkHack(currentServer)) {
                addToNotHackedList(currentServer);
                continue;
            }

            await copyToTarget(runThisScript, currentServer);
        }
    }

    /** Deploy hack.js with new args */
    async function deployHackScripts(serversList, runThisScript, bestTarget) {
        for (const currentServer of serversList) {

            if (currentServer === 'home') continue;

            const threadCount = howManyThreads(currentServer, runThisScript);
            if (threadCount <= 0) continue;

            ns.exec(runThisScript, currentServer, threadCount, bestTarget);
        }
    }

    /** Correct order */
    serversList = await netSpider(serversList);

    printThis(doubleLine + "MODE: " + mode + doubleLine);

    printThis("Gaining root access...");
    await doorHammer(serversList, "hack.js");

    const bestTarget = pickBestServer(serversList);
    printThis("Best target (" + mode + " mode): " + bestTarget + doubleLine);

    printThis("Stopping old hack.js scripts...");
    killOldScripts(serversList, "hack.js");

    printThis("Deploying hack.js...");
    await deployHackScripts(serversList, "hack.js", bestTarget);

    printThis("These servers were not hacked: " + serversNotHacket + doubleLine);
}
