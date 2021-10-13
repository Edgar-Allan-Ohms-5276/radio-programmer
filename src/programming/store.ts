
let programmedTeams: { [key: number]: number } = {} //teamNum: timestamp

export function markTeamProgrammed(teamNum: number) {
    programmedTeams[teamNum] = Date.now()
}

export function getTeamProgrammed(teamNum: number): number | null {
    return programmedTeams[teamNum]
}

export function resetProgrammedTeams() {
    programmedTeams = {}
}