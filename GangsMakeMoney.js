/** @param {NS} ns **/
export async function main(ns) {
    while (true) {
        const gang = ns.gang;

        // Get gang info
        const gangInfo = gang.getGangInformation();
        const members = gang.getMemberNames();

        // Equipment 
        const EQUIPS = ["Baseball Bat", "Katana", "Glock 18C", "P90C", "Steyr AUG", "AK-47", "M15A10 Assault Rifle", "AWM Sniper Rifle", "Bulletproof Vest", "Full Body Armor", "Liquid Body Armor", "Graphene Plating Armor", "Ford Flex V20", "ATX1070 Superbike", "Mercedes-Benz S9001", "White Ferrari", "NUKE Rootkit", "Soulstealer Rootkit", "Demon Rootkit", "Hmap Node", "Jack the Ripper", "Bionic Arms", "Bionic Legs", "Bionic Spine", "BrachiBlades", "Nanofiber Weave", "Synthetic Heart", "Synfibril Muscle", "BitWire", "Neuralstimulator", "DataJack", "Graphene Bone Lacings"];

        // Ascend members if ready
        for (const member of members) {
            const ascensionResult = gang.getAscensionResult(member);
            if (ascensionResult && ascensionResult.agi > 1.5) {
                gang.ascendMember(member);
                ns.tprint(`Ascended ${member}`);
            }
        }

        // Task assignment
        for (const member of members) {
            const memberInfo = gang.getMemberInformation(member);
            if (memberInfo.str < 250) {
                gang.setMemberTask(member, "Train Combat");
            } else if (gangInfo.wantedLevel >= 50) {
                gang.setMemberTask(member, "Vigilante Justice");
            } else if (memberInfo.str >= 250 && memberInfo.str < 1000) {
                gang.setMemberTask(member, "Mug People");
            } else if (memberInfo.str >= 1000 && memberInfo.str < 5000) {
                gang.setMemberTask(member, "Traffic Illegal Arms");
            } else if (memberInfo.str >= 5000) {
                gang.setMemberTask(member, "Human Trafficking");
            } else {
                gang.setMemberTask(member, "Territory Warfare");
            }
        }

        // Buy equipment for each member (cheapest first)
        for (const member of members) {
            for (const item of EQUIPS) {
                const cost = gang.getEquipmentCost(item);
                const availableCash = ns.getServerMoneyAvailable('home');
                if (cost <= availableCash * 0.1) {
                    if (gang.purchaseEquipment(member, item)) {
                        ns.tprint(`Purchased ${item} for ${member}`);
                    }
                }
            }
        }

        // Recruit new members
        let thugNumber = 1;
        while (gang.canRecruitMember()) {
            const newMember = `thug#${thugNumber}`;
            gang.recruitMember(newMember);
            ns.tprint(`Recruited new member: ${newMember}`);
            thugNumber++;
        }

        // Sleep for a bit to avoid high CPU usage
        await ns.sleep(10000);
    }
}
