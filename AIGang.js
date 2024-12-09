/** @param {NS} ns **/
export async function main(ns) {
    while (true) {
        const gang = ns.gang;

        // Get gang info
        const gangInfo = gang.getGangInformation();
        const members = gang.getMemberNames();

        // Equipment prices (you can add more equipment and their costs here)
        const equipment = [
            { name: "Baseball Bat", cost: 1000 },
            { name: "Bulletproof Vest", cost: 2000 },
            { name: "Katana", cost: 5000 },
            { name: "Glock 18C", cost: 15000 },
        ];

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
            if (memberInfo.str < 1000) {
                gang.setMemberTask(member, "Train Combat");
            } else if (gangInfo.wantedLevelGainRate > 0.00) {
                gang.setMemberTask(member, "Vigilante Justice");
            } else {
                gang.setMemberTask(member, "Human Trafficking");
            }
        }

        // Buy equipment for each member (cheapest first)
        for (const member of members) {
            for (const item of equipment) {
                if (gang.purchaseEquipment(member, item.name)) {
                    ns.tprint(`Purchased ${item.name} for ${member}`);
                }
            }
        }

        // Recruit new members
        if (gang.canRecruitMember()) {
            const newMember = `Member${members.length + 1}`;
            gang.recruitMember(newMember);
            ns.tprint(`Recruited new member: ${newMember}`);
        }

        // Sleep for a bit to avoid high CPU usage
        await ns.sleep(10000);
    }
}
