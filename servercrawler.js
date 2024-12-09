/** u/param {NS} ns **/
export async function main(ns) {

	/**
 * VARS
 */
let serversList = ['home'];
let serversNotHacket = [];
let doubleLine = "\n ================================================================ \n";
let singleLine = "\n ---------------------------------------------------------------- \n";

/**
 * Print string on terminal
 */
let printThis = (stringToPrint) => {
	ns.tprint(stringToPrint);
};

/** Scan network */
async function netSpider(serversList) {
	for (let i = 0; i < serversList.length; i++) {
		let thisScan = ns.scan(serversList[i]);
		for (let j = 0; j < thisScan.length; j++) {
			if (serversList.indexOf(thisScan[j]) === -1) {
				serversList.push(thisScan[j]);
			}
		}
	}
	return serversList;
}

/**
 * Copy hacking script to target
 */
async function copyToTarget(fileToCopy, serverName) {
	if(ns.fileExists(fileToCopy, serverName)){
		ns.rm(fileToCopy, serverName);
	}
	await ns.scp(fileToCopy, serverName, 'home');
	if(ns.fileExists(fileToCopy, serverName)){
		printThis("File " + fileToCopy + " copied to " + serverName + singleLine);
		await ns.sleep(100);
	}
}

/**
 * Checks if player has required Hacking level to hack server
 */
function canBeHacked(serverName) {
	return ns.getHackingLevel() >= ns.getServerRequiredHackingLevel(serverName);
}

/**
 * Open server ports
 */
async function lockSmith(serverName) {
	if (ns.fileExists("BruteSSH.exe")) {
		await ns.brutessh(serverName);
		printThis("Executed BruteSSH.exe on " + serverName);
		await ns.sleep(1000);
	}
	if (ns.fileExists("FTPCrack.exe")) {
		await ns.ftpcrack(serverName);
		printThis("Executed FTPCrack.exe on " + serverName);
		await ns.sleep(1000);
	}
	if (ns.fileExists("relaySMTP.exe")) {
		printThis("Executed relaySMTP.exe on " + serverName);
		await ns.relaysmtp(serverName);
		await ns.sleep(1000);
	}
	if (ns.fileExists("HTTPWorm.exe")) {
		printThis("Executed HTTPWorm.exe on " + serverName);
		await ns.httpworm(serverName);
		await ns.sleep(1000);
	}
	if (ns.fileExists("SQLInject.exe")) {
		printThis("Executed SQLInject.exe on " + serverName);
		await ns.sqlinject(serverName);
		await ns.sleep(1000);
	}
}

/**
 * Returns the max number of thread that a script can use on a server
 */
function howManyThreads(serverName, scriptName) {
	return Math.floor(
		parseInt(
			(ns.getServerMaxRam(serverName) - ns.getServerUsedRam(serverName)) / ns.getScriptRam(scriptName)
		)
	);
}

/**
 * Obtains root access of a target list
 */
async function doorHammer(serversList, runThisScript) {
	for (const currentServer of serversList) {

		if (currentServer == 'home' || hackedAndRunning(currentServer, runThisScript)) {
			printThis("Server " + currentServer + " was skipped." + singleLine);
			continue;
		}

		if (!canBeHacked(currentServer)) {
			printThis("It was not possible to hack " + currentServer + ". The level required is: " + ns.getServerRequiredHackingLevel(currentServer) + singleLine);
			addToNotHackedList(currentServer);
			continue;
		}

		var threadCount = howManyThreads(currentServer, runThisScript);

		if (isNaN(threadCount) || threadCount == 0) {
			printThis("Thread count invalid on " + currentServer);
			addToNotHackedList(currentServer);
			continue;
		}

		// Only hack the server if there is no current root access
		if (!checkHack(currentServer)) {
			await gainRootAccess(currentServer);
		}

		if (checkHack(currentServer)) {
			printThis("Server " + currentServer + " hacked with success!" + singleLine);
		} else {
			printThis("It was not possible to hack " + currentServer + singleLine);
			addToNotHackedList(currentServer);
			continue;
		}

		printThis(doubleLine + "Copying hacking script to " + currentServer);
		await copyToTarget(runThisScript, currentServer);

		printThis("Initiating  " + runThisScript + " on " + currentServer + " with " + threadCount + " threads." + singleLine);

		ns.exec(runThisScript, currentServer, threadCount);

		if (ns.scriptRunning(runThisScript, currentServer)) {
			printThis("The script was initiated successfully." + singleLine);
		} else {
			printThis("The script initialization failed." + singleLine);
		}

		await ns.sleep(1000);
	}
}

async function gainRootAccess(serverName) {

	await lockSmith(serverName);

	printThis("Nuking " + serverName);
	ns.nuke(serverName);
	await ns.sleep(2000);
}

/**
 * Check if a server is already hacked and has a script running
 */
function hackedAndRunning(serverName, scriptName) {
	return ns.scriptRunning(scriptName, serverName) && checkHack(serverName);
}

/**
 * Adds a server name to the unsuccesfull hack list
 */
function addToNotHackedList(serverToBeadded) {
	serversNotHacket.push(serverToBeadded);
}

function checkHack(serverName) {
	return ns.hasRootAccess(serverName);
}

serversList = await netSpider(serversList);

printThis(doubleLine + "Found servers: " + serversList + doubleLine);
printThis(doubleLine + "Trying to gain access to targets...");
await doorHammer(serversList, "hack.js");
printThis("These servers were not hacked: " + serversNotHacket + doubleLine);
}