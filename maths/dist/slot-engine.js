// Sea Raider - Echoes of the Warrior Math & Game Engine
// 5x3 Grid, 20 Fixed Paylines, High Volatility
export const SYMBOL_METAS = {
    H1: {
        id: 'H1',
        name: 'Captain Sea Raider',
        category: 'high',
        asset: '/assets/sea-raider/captain.png',
        payouts: { 3: 4.0, 4: 12.0, 5: 36.0 },
    },
    H2: {
        id: 'H2',
        name: 'Dual Flintlocks',
        category: 'high',
        asset: '/assets/sea-raider/flintlocks.png',
        payouts: { 3: 4.0, 4: 8.0, 5: 28.0 },
    },
    H3: {
        id: 'H3',
        name: 'Treasure Chest',
        category: 'high',
        asset: '/assets/sea-raider/treasure-chest.png',
        payouts: { 3: 4.0, 4: 8.0, 5: 20.0 },
    },
    H4: {
        id: 'H4',
        name: 'Golden Compass',
        category: 'high',
        asset: '/assets/sea-raider/compass.png',
        payouts: { 3: 4.0, 4: 8.0, 5: 16.0 },
    },
    L1: {
        id: 'L1',
        name: 'Ace',
        category: 'low',
        asset: '/assets/sea-raider/ace.png',
        payouts: { 3: 4.0, 4: 8.0, 5: 12.0 },
    },
    L2: {
        id: 'L2',
        name: 'King',
        category: 'low',
        asset: '/assets/sea-raider/king.png',
        payouts: { 3: 4.0, 4: 8.0, 5: 12.0 },
    },
    L3: {
        id: 'L3',
        name: 'Queen',
        category: 'low',
        asset: '/assets/sea-raider/queen.png',
        payouts: { 3: 4.0, 4: 4.0, 5: 8.0 },
    },
    L4: {
        id: 'L4',
        name: 'Jack',
        category: 'low',
        asset: '/assets/sea-raider/jack.png',
        payouts: { 3: 4.0, 4: 4.0, 5: 8.0 },
    },
    L5: {
        id: 'L5',
        name: 'Ten',
        category: 'low',
        asset: '/assets/sea-raider/ten.png',
        payouts: { 3: 4.0, 4: 4.0, 5: 8.0 },
    },
    WILD: {
        id: 'WILD',
        name: 'Golden Skull Wild',
        category: 'special',
        asset: '/assets/sea-raider/wild.png',
        payouts: { 3: 4.0, 4: 12.0, 5: 48.0 },
    },
    SCATTER: {
        id: 'SCATTER',
        name: 'Pirate Galleon Scatter',
        category: 'special',
        asset: '/assets/sea-raider/scatter.png',
        payouts: {}, // Triggers Free Spins bonus
    },
};
// 20 Fixed Paylines for 5x3 Grid (x, y) coordinates where x = reel (0..4), y = row (0..2)
export const PAYLINES = [
    [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]], // 1: Top horizontal
    [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1]], // 2: Middle horizontal
    [[0, 2], [1, 2], [2, 2], [3, 2], [4, 2]], // 3: Bottom horizontal
    [[0, 0], [1, 1], [2, 2], [3, 1], [4, 0]], // 4: V-shape
    [[0, 2], [1, 1], [2, 0], [3, 1], [4, 2]], // 5: Inverted V
    [[0, 0], [1, 0], [2, 1], [3, 2], [4, 2]], // 6
    [[0, 2], [1, 2], [2, 1], [3, 0], [4, 0]], // 7
    [[0, 1], [1, 2], [2, 2], [3, 2], [4, 1]], // 8
    [[0, 1], [1, 0], [2, 0], [3, 0], [4, 1]], // 9
    [[0, 1], [1, 0], [2, 1], [3, 2], [4, 1]], // 10
    [[0, 1], [1, 2], [2, 1], [3, 0], [4, 1]], // 11
    [[0, 0], [1, 1], [2, 0], [3, 1], [4, 0]], // 12
    [[0, 2], [1, 1], [2, 2], [3, 1], [4, 2]], // 13
    [[0, 1], [1, 1], [2, 0], [3, 1], [4, 1]], // 14
    [[0, 1], [1, 1], [2, 2], [3, 1], [4, 1]], // 15
    [[0, 0], [1, 2], [2, 0], [3, 2], [4, 0]], // 16
    [[0, 2], [1, 0], [2, 2], [3, 0], [4, 2]], // 17
    [[0, 0], [1, 1], [2, 1], [3, 1], [4, 0]], // 18
    [[0, 2], [1, 1], [2, 1], [3, 1], [4, 2]], // 19
    [[0, 0], [1, 2], [2, 1], [3, 0], [4, 2]], // 20
];
// Calibrated Reel Strips
export const BASE_REEL_STRIPS = [
    // Reel 0
    ['H1', 'L5', 'H2', 'L4', 'H3', 'L3', 'H4', 'L2', 'L1', 'L5', 'L4', 'L3', 'L2', 'L1', 'H1', 'H2', 'H3', 'H4', 'L5', 'L4', 'L3', 'L2', 'L1', 'L5', 'L4', 'L3', 'L2', 'L1', 'H1', 'H2', 'L5', 'L4', 'L3', 'L2', 'L1', 'WILD'],
    // Reel 1
    ['L5', 'WILD', 'L4', 'L3', 'L5', 'L2', 'L1', 'H1', 'H2', 'H3', 'H4', 'L4', 'SCATTER', 'L3', 'L2', 'L1', 'WILD', 'L5', 'L4', 'L3', 'L2', 'L1', 'H1', 'H2', 'H3', 'H4', 'L5', 'L4', 'L3', 'L2', 'L1', 'WILD', 'H1', 'L5', 'L4', 'L3'],
    // Reel 2
    ['L5', 'WILD', 'L4', 'L3', 'L5', 'L2', 'L1', 'H1', 'H2', 'H3', 'H4', 'L4', 'SCATTER', 'L3', 'L2', 'L1', 'WILD', 'L5', 'L4', 'L3', 'L2', 'L1', 'H1', 'H2', 'H3', 'H4', 'L5', 'L4', 'L3', 'L2', 'L1', 'WILD', 'H1', 'L5', 'L4', 'L3'],
    // Reel 3
    ['L5', 'L4', 'L3', 'L2', 'L1', 'H4', 'H3', 'H2', 'H1', 'L5', 'WILD', 'L4', 'L3', 'L2', 'L1', 'SCATTER', 'L5', 'L4', 'L3', 'L2', 'L1', 'H4', 'H3', 'H2', 'H1', 'L5', 'L4', 'L3', 'L2', 'L1', 'WILD', 'H4', 'H3', 'L5', 'L4', 'L3'],
    // Reel 4
    ['L5', 'L4', 'L3', 'L2', 'L1', 'H4', 'H3', 'H2', 'H1', 'L5', 'L4', 'L3', 'L2', 'L1', 'SCATTER', 'L5', 'L4', 'L3', 'L2', 'L1', 'H4', 'H3', 'H2', 'H1', 'L5', 'L4', 'L3', 'L2', 'L1', 'H4', 'H3', 'H2', 'H1', 'L5', 'L4', 'SCATTER'],
];
export const MAX_RTP_PERCENT = 96.5;
export const STANDARD_MAX_WIN_MULTIPLIER = 25000;
export const EXTREME_MAX_WIN_MULTIPLIER = 50000;
// 50,000x is reserved exclusively for the six-scatter Ethereal outcome.
export const UNKNOWN_BONUS_MAX_WIN_MULTIPLIER = EXTREME_MAX_WIN_MULTIPLIER;
export const MAX_WIN_TRIGGER_ODDS = {
    // Keep frontend simulations aligned with the published book jackpot rows.
    base: 1 / 500000,
    bonus_chance: 1 / 750000,
    super_bonus: 1 / 160000,
    pirates_chance: 1 / 90000,
    feature_spin: 1 / 110000,
    unknown_bonus: 1 / 12000,
    unknown_extreme: 1 / 7500,
};
export const BONUS_OUTCOME_ODDS = {
    bonus_chance: { three: 0.6, four: 0.3, five: 0.1 },
    super_bonus: { three: 0.45, four: 0.4, five: 0.15 },
    pirates_chance: { three: 0.15, four: 0.25, five: 0.6 },
    unknown_bonus: { three: 0.52, four: 0.369, five: 0.11, ethereal: 0.001 },
    unknown_extreme: { noBonus: 0.85, hidden: 0.13, ethereal: 0.02 },
};
// Trigger rates for the paid enhancer modes. Scatter shares above are
// conditional on a trigger; these rates are the per-play feature frequencies.
export const BONUS_TRIGGER_ODDS = {
    bonus_chance: 0.005,
    super_bonus: 0.0075,
    pirates_chance: 0.0125,
    unknown_bonus: 1,
    unknown_extreme: 0.15,
};
// These factors calibrate returned value, not the displayed wager. They preserve
// the volatility and max-win shape while keeping the paid-mode math conservative.
export const MODE_PAYOUT_SCALES = {
    base: 0.97305,
    bonus_chance: 0.01932,
    super_bonus: 0.11863,
    pirates_chance: 0.28760,
    feature_spin: 1.54408,
    unknown_bonus: 6.7000,
    unknown_extreme: 14.9400,
};
export const MODE_CONFIGS = {
    base: {
        id: 'base',
        name: 'Standard Game',
        costMultiplier: 1.0,
        description: 'Classic High-Volatility 5x3 pirate slot with 20 fixed paylines and Wild Surges.',
        rtp: 96.4015,
        maxWin: '25,000x',
        category: 'feature',
    },
    bonus_chance: {
        id: 'bonus_chance',
        name: 'Bonus Chance',
        costMultiplier: 1.5,
        description: '0.5% feature trigger chance. On a trigger: 3 Scatters 60%, 4 Scatters 30%, 5 Scatters 10%.',
        rtp: 96.4,
        maxWin: '25,000x',
        category: 'enhancer',
        badgeAsset: '/assets/aistudio/bonus_chance_1_68723c50.webp',
    },
    super_bonus: {
        id: 'super_bonus',
        name: 'Super Bonus Chance',
        costMultiplier: 5.0,
        description: '0.75% feature trigger chance. On a trigger: 3 Scatters 45%, 4 Scatters 40%, 5 Scatters 15%.',
        rtp: 96.4001,
        maxWin: '25,000x',
        category: 'enhancer',
        badgeAsset: '/assets/aistudio/super_bonus_chance_5533c1d2.webp',
    },
    pirates_chance: {
        id: 'pirates_chance',
        name: "Pirates' Chance",
        costMultiplier: 25.0,
        description: '1.25% feature trigger chance. On a trigger: 3 Scatters 15%, 4 Scatters 25%, 5 Scatters 60%.',
        rtp: 96.4,
        maxWin: '25,000x',
        category: 'enhancer',
        badgeAsset: '/assets/aistudio/pirates_chance_1b0482b5.webp',
    },
    feature_spin: {
        id: 'feature_spin',
        name: 'Feature Spin',
        costMultiplier: 10.0,
        description: 'Every spin shows at least one Wild. Any line win uses the published 20-line paytable.',
        rtp: 96.4,
        maxWin: '25,000x',
        category: 'enhancer',
        badgeAsset: '/assets/aistudio/feature_spin_b99e4066.webp',
    },
    unknown_bonus: {
        id: 'unknown_bonus',
        name: 'Unknown Bonus',
        costMultiplier: 250.0,
        description: 'Guaranteed feature. Outcome: 3 Scatters 52%, 4 Scatters 36.9%, 5 Scatters 11%, Ethereal 6 Scatters 0.1%.',
        rtp: 96.4,
        maxWin: '50,000x (Ethereal only)',
        category: 'enhancer',
        badgeAsset: '/assets/aistudio/unknown_bonus_b8ab82bc.webp',
    },
    unknown_extreme: {
        id: 'unknown_extreme',
        name: 'Unknown Extreme',
        costMultiplier: 500.0,
        description: '15% feature chance: 13% Hidden (5 Scatters), 2% Ethereal (6 Scatters up to 50,000x); 85% no feature.',
        rtp: 96.4,
        maxWin: '50,000x (Ethereal only)',
        category: 'enhancer',
        badgeAsset: '/assets/aistudio/unknown_extreme_bonus_3340dd16.webp',
    },
};
if (Object.values(MODE_CONFIGS).some((config) => config.rtp > MAX_RTP_PERCENT)) {
    throw new Error(`Mode RTP cannot exceed ${MAX_RTP_PERCENT.toFixed(2)}%`);
}
export const WILD_SURGE_WILDS_PER_LINE = {
    curse: 5,
    ghost: 20,
    legend: 45,
    ethereal: 30,
};
export const WILD_SURGE_MAX_LINES = 3;
// Bonus symbol wins use the listed paytable and the saved frame multiplier.
export const BONUS_PAYOUT_SCALE = 1.0;
export const MODE_BONUS_PAYOUT_SCALES = {
    base: BONUS_PAYOUT_SCALE,
    bonus_chance: 0.02030,
    super_bonus: 0.05930,
    pirates_chance: 0.095640,
    feature_spin: BONUS_PAYOUT_SCALE,
    unknown_bonus: 0.27000,
    unknown_extreme: 0.44099,
};
function getModePayoutScale(mode) {
    return MODE_PAYOUT_SCALES[mode];
}
export function createMaxWinResult(mode, baseBet = 1) {
    const maxMultiplier = mode === 'unknown_extreme'
        ? EXTREME_MAX_WIN_MULTIPLIER
        : mode === 'unknown_bonus'
            ? UNKNOWN_BONUS_MAX_WIN_MULTIPLIER
            : STANDARD_MAX_WIN_MULTIPLIER;
    const maxWin = maxMultiplier * baseBet;
    const grid = generateRandomGrid();
    return {
        grid,
        totalLineWin: maxWin,
        lineHits: [],
        scatterCount: 0,
        scatterPositions: [],
        wildMultiplier: 1,
        bonusTriggered: false,
        bonusType: null,
        bonusSpinsAwarded: 0,
        totalWin: maxWin,
        payoutMultiplier: maxWin / (baseBet * MODE_CONFIGS[mode].costMultiplier),
        isMaxWin: true,
        mysteryOutcomeText: `${maxMultiplier.toLocaleString()}X MAX WIN`,
    };
}
/**
 * Evaluates paylines for a 5x3 grid
 */
export function evaluateGrid(grid, totalPlay, payoutScale = 1) {
    let totalLineWin = 0;
    const lineHits = [];
    // Find all scatters
    const scatterPositions = [];
    for (let c = 0; c < 5; c++) {
        for (let r = 0; r < 3; r++) {
            if (grid[c][r] === 'SCATTER') {
                scatterPositions.push([c, r]);
            }
        }
    }
    // Evaluate fixed 20 paylines
    for (let l = 0; l < PAYLINES.length; l++) {
        const line = PAYLINES[l];
        const [c0, r0] = line[0];
        const lead = grid[c0][r0];
        if (lead === 'SCATTER')
            continue;
        let matchSym = lead;
        let count = 1;
        const hitCoords = [[c0, r0]];
        for (let colIdx = 1; colIdx < 5; colIdx++) {
            const [c, r] = line[colIdx];
            const cur = grid[c][r];
            if (cur === 'SCATTER')
                break;
            if (matchSym === 'WILD') {
                if (cur !== 'WILD') {
                    matchSym = cur;
                    count++;
                    hitCoords.push([c, r]);
                }
                else {
                    count++;
                    hitCoords.push([c, r]);
                }
            }
            else {
                if (cur === matchSym || cur === 'WILD') {
                    count++;
                    hitCoords.push([c, r]);
                }
                else {
                    break;
                }
            }
        }
        if (count >= 3) {
            const payouts = SYMBOL_METAS[matchSym]?.payouts || {};
            const payoutMultiplier = (payouts[count] || 0) * payoutScale;
            if (payoutMultiplier > 0) {
                // The displayed bet is split evenly across all 20 fixed paylines.
                const winAmount = payoutMultiplier * (totalPlay / PAYLINES.length);
                totalLineWin += winAmount;
                lineHits.push({
                    lineIndex: l + 1,
                    symbol: matchSym,
                    count,
                    multiplier: payoutMultiplier,
                    winAmount,
                    positions: hitCoords,
                });
            }
        }
    }
    return {
        totalLineWin,
        lineHits,
        scatterCount: scatterPositions.length,
        scatterPositions,
    };
}
/**
 * Generates a random 5x3 grid from reel strips
 */
export function generateRandomGrid(strips = BASE_REEL_STRIPS) {
    const grid = [];
    for (let reelIdx = 0; reelIdx < 5; reelIdx++) {
        const strip = strips[reelIdx];
        const stripLen = strip.length;
        const stop = Math.floor(Math.random() * stripLen);
        const col = [
            strip[stop % stripLen],
            strip[(stop + 1) % stripLen],
            strip[(stop + 2) % stripLen],
        ];
        grid.push(col);
    }
    return grid;
}
/**
 * Resolves a spin with specific mode math
 */
export function playSpin(mode, baseBet = 1.0) {
    const config = MODE_CONFIGS[mode];
    const wager = baseBet * config.costMultiplier;
    const maxCap = (mode === 'unknown_extreme'
        ? EXTREME_MAX_WIN_MULTIPLIER
        : mode === 'unknown_bonus'
            ? UNKNOWN_BONUS_MAX_WIN_MULTIPLIER
            : STANDARD_MAX_WIN_MULTIPLIER) *
        baseBet;
    const jackpotRoll = Math.random();
    const jackpotOdds = MAX_WIN_TRIGGER_ODDS[mode];
    if (jackpotRoll < jackpotOdds) {
        return createMaxWinResult(mode, baseBet);
    }
    // 1. Unknown Extreme
    if (mode === 'unknown_extreme') {
        const roll = Math.random();
        if (roll < BONUS_OUTCOME_ODDS.unknown_extreme.noBonus) {
            // 85% No Bonus
            const grid = generateRandomGrid();
            // Ensure < 3 scatters
            let scats = 0;
            for (let c = 0; c < 5; c++) {
                for (let r = 0; r < 3; r++) {
                    if (grid[c][r] === 'SCATTER') {
                        scats++;
                        if (scats >= 2)
                            grid[c][r] = 'L5';
                    }
                }
            }
            const evalRes = evaluateGrid(grid, wager, getModePayoutScale(mode));
            const lineWin = Math.min(evalRes.totalLineWin, baseBet * 5.0); // Micro-payout or dead
            return {
                grid,
                totalLineWin: lineWin,
                lineHits: evalRes.lineHits,
                scatterCount: scats < 2 ? scats : 1,
                scatterPositions: evalRes.scatterPositions.slice(0, 1),
                wildMultiplier: 1,
                bonusTriggered: false,
                bonusType: null,
                bonusSpinsAwarded: 0,
                totalWin: lineWin,
                payoutMultiplier: lineWin / wager,
                isMaxWin: false,
                mysteryOutcomeText: 'CURSE OF THE DEEP — NO BONUS AWARDED (0x)',
            };
        }
        else if (roll < BONUS_OUTCOME_ODDS.unknown_extreme.noBonus + BONUS_OUTCOME_ODDS.unknown_extreme.hidden) {
            // 13% Hidden Bonus (5 Scatters!)
            const grid = generateRandomGrid();
            // Place 5 scatters (one on each reel)
            for (let c = 0; c < 5; c++) {
                grid[c][Math.floor(Math.random() * 3)] = 'SCATTER';
            }
            const evalRes = evaluateGrid(grid, wager, getModePayoutScale(mode));
            return {
                grid,
                totalLineWin: evalRes.totalLineWin,
                lineHits: evalRes.lineHits,
                scatterCount: 5,
                scatterPositions: evalRes.scatterPositions,
                wildMultiplier: 5,
                bonusTriggered: true,
                bonusType: 'legend',
                bonusSpinsAwarded: 15,
                totalWin: evalRes.totalLineWin,
                payoutMultiplier: evalRes.totalLineWin / wager,
                isMaxWin: false,
                mysteryOutcomeText: 'HIDDEN BONUS UNLOCKED! 5 SCATTERS (PIRATE LEGEND)!',
            };
        }
        else {
            // 2% Ethereal Bonus (6 Scatters / Cataclysm!)
            const grid = generateRandomGrid();
            for (let c = 0; c < 5; c++) {
                grid[c][Math.floor(Math.random() * 3)] = 'SCATTER';
            }
            grid[2][(grid[2].indexOf('SCATTER') + 1) % 3] = 'SCATTER'; // 6th scatter
            const evalRes = evaluateGrid(grid, wager, getModePayoutScale(mode));
            const isMaxWin = Math.random() < 0.0005;
            return {
                grid,
                totalLineWin: isMaxWin ? maxCap : evalRes.totalLineWin,
                lineHits: evalRes.lineHits,
                scatterCount: 6,
                scatterPositions: evalRes.scatterPositions,
                wildMultiplier: 10,
                bonusTriggered: true,
                bonusType: 'ethereal',
                bonusSpinsAwarded: 10,
                totalWin: isMaxWin ? maxCap : evalRes.totalLineWin,
                payoutMultiplier: (isMaxWin ? maxCap : evalRes.totalLineWin) / wager,
                isMaxWin,
                mysteryOutcomeText: 'ETHEREAL CATACLYSM! 6 SCATTERS UNLEASHED (UP TO 50,000x)!',
            };
        }
    }
    // 2. Unknown Bonus
    if (mode === 'unknown_bonus') {
        const roll = Math.random();
        let scatterCount = 3;
        let mysteryText = '3 SCATTERS: CURSE OF THE HIGH SEAS';
        let bType = 'curse';
        let spins = 10;
        if (roll < BONUS_OUTCOME_ODDS.unknown_bonus.ethereal) {
            // 0.1% Super Hidden / Ethereal
            scatterCount = 6;
            mysteryText = 'SUPER HIDDEN ETHEREAL CATACLYSM (6 SCATTERS)!';
            bType = 'ethereal';
            spins = 10;
        }
        else if (roll < BONUS_OUTCOME_ODDS.unknown_bonus.ethereal + BONUS_OUTCOME_ODDS.unknown_bonus.five) {
            // 11.0% 5 Scatters
            scatterCount = 5;
            mysteryText = '5 SCATTERS: PIRATE LEGEND JACKPOT!';
            bType = 'legend';
            spins = 15;
        }
        else if (roll <
            BONUS_OUTCOME_ODDS.unknown_bonus.ethereal +
                BONUS_OUTCOME_ODDS.unknown_bonus.five +
                BONUS_OUTCOME_ODDS.unknown_bonus.four) {
            // 36.9% 4 Scatters
            scatterCount = 4;
            mysteryText = "4 SCATTERS: GHOST CAPTAIN'S REVENGE!";
            bType = 'ghost';
            spins = 12;
        }
        else {
            // 52.0% 3 Scatters
            scatterCount = 3;
            mysteryText = '3 SCATTERS: CURSE OF THE HIGH SEAS';
            bType = 'curse';
            spins = 10;
        }
        const grid = generateRandomGrid();
        const cols = [0, 1, 2, 3, 4].sort(() => Math.random() - 0.5);
        for (let i = 0; i < Math.min(scatterCount, 5); i++) {
            grid[cols[i]][Math.floor(Math.random() * 3)] = 'SCATTER';
        }
        if (scatterCount === 6) {
            grid[cols[0]][(grid[cols[0]].indexOf('SCATTER') + 1) % 3] = 'SCATTER';
        }
        const evalRes = evaluateGrid(grid, wager, getModePayoutScale(mode));
        const isMaxWin = scatterCount === 6 && Math.random() < 0.01;
        const scatterWin = isMaxWin
            ? UNKNOWN_BONUS_MAX_WIN_MULTIPLIER * baseBet
            : evalRes.totalLineWin;
        return {
            grid,
            totalLineWin: scatterWin,
            lineHits: evalRes.lineHits,
            scatterCount,
            scatterPositions: evalRes.scatterPositions,
            wildMultiplier: scatterCount >= 5 ? 5 : 2,
            bonusTriggered: true,
            bonusType: bType,
            bonusSpinsAwarded: spins,
            totalWin: scatterWin,
            payoutMultiplier: scatterWin / wager,
            isMaxWin,
            mysteryOutcomeText: mysteryText,
        };
    }
    // 3. Feature Spin (10x)
    if (mode === 'feature_spin') {
        const grid = generateRandomGrid();
        // Center of Reel 2 (Reel 3, index 2) is guaranteed WILD
        grid[2][1] = 'WILD';
        // Reel 1 has high-tier symbol
        grid[1][Math.floor(Math.random() * 3)] = Math.random() < 0.6 ? 'H1' : 'H2';
        // Chance of Wild on Reel 0 or Reel 3
        if (Math.random() < 0.35) {
            grid[3][Math.floor(Math.random() * 3)] = 'WILD';
        }
        let evalRes = evaluateGrid(grid, wager, getModePayoutScale(mode));
        // Wild surge multiplier
        const wildMultiplier = Math.random() < 0.5 ? 2 : Math.random() < 0.8 ? 3 : 5;
        const finalLineWin = evalRes.totalLineWin * wildMultiplier;
        return {
            grid,
            totalLineWin: finalLineWin,
            lineHits: evalRes.lineHits.map((h) => ({
                ...h,
                winAmount: h.winAmount * wildMultiplier,
                multiplier: h.multiplier * wildMultiplier,
            })),
            scatterCount: evalRes.scatterCount,
            scatterPositions: evalRes.scatterPositions,
            wildMultiplier,
            bonusTriggered: evalRes.scatterCount >= 3,
            bonusType: evalRes.scatterCount >= 5 ? 'legend' : evalRes.scatterCount === 4 ? 'ghost' : evalRes.scatterCount === 3 ? 'curse' : null,
            bonusSpinsAwarded: evalRes.scatterCount >= 5 ? 15 : evalRes.scatterCount === 4 ? 12 : evalRes.scatterCount === 3 ? 10 : 0,
            totalWin: Math.min(finalLineWin, maxCap),
            payoutMultiplier: Math.min(finalLineWin, maxCap) / wager,
            isMaxWin: finalLineWin >= maxCap,
        };
    }
    // 4. Base, Bonus Chance (1.5x), Super Bonus Chance (5x), Pirates Chance (25x)
    const grid = generateRandomGrid();
    // BONUS_TRIGGER_ODDS are unconditional trigger chances. The percentages in
    // BONUS_OUTCOME_ODDS are conditional tier shares after a trigger occurs.
    if (mode === 'pirates_chance') {
        // Pirates Chance triggers on 0.1% of plays; 60% of those triggers are 5 scatters.
        const triggerRoll = Math.random();
        if (triggerRoll < BONUS_TRIGGER_ODDS.pirates_chance) {
            const scatRoll = Math.random();
            const targetScat = scatRoll < BONUS_OUTCOME_ODDS.pirates_chance.five
                ? 5
                : scatRoll < BONUS_OUTCOME_ODDS.pirates_chance.five + BONUS_OUTCOME_ODDS.pirates_chance.four
                    ? 4
                    : 3;
            const reels = [0, 1, 2, 3, 4].sort(() => Math.random() - 0.5);
            for (let i = 0; i < targetScat; i++) {
                grid[reels[i]][Math.floor(Math.random() * 3)] = 'SCATTER';
            }
        }
    }
    else if (mode === 'super_bonus') {
        const triggerRoll = Math.random();
        if (triggerRoll < BONUS_TRIGGER_ODDS.super_bonus) {
            // Super Bonus Chance triggers on 0.2% of plays.
            const scatRoll = Math.random();
            const targetScat = scatRoll < BONUS_OUTCOME_ODDS.super_bonus.three
                ? 3
                : scatRoll < BONUS_OUTCOME_ODDS.super_bonus.three + BONUS_OUTCOME_ODDS.super_bonus.four
                    ? 4
                    : 5;
            const reels = [0, 1, 2, 3, 4].sort(() => Math.random() - 0.5);
            for (let i = 0; i < targetScat; i++) {
                grid[reels[i]][Math.floor(Math.random() * 3)] = 'SCATTER';
            }
        }
    }
    else if (mode === 'bonus_chance') {
        const triggerRoll = Math.random();
        if (triggerRoll < BONUS_TRIGGER_ODDS.bonus_chance) {
            // Bonus Chance triggers on 0.5% of plays.
            const scatRoll = Math.random();
            const targetScat = scatRoll < BONUS_OUTCOME_ODDS.bonus_chance.three
                ? 3
                : scatRoll < BONUS_OUTCOME_ODDS.bonus_chance.three + BONUS_OUTCOME_ODDS.bonus_chance.four
                    ? 4
                    : 5;
            const reels = [0, 1, 2, 3, 4].sort(() => Math.random() - 0.5);
            for (let i = 0; i < targetScat; i++) {
                grid[reels[i]][Math.floor(Math.random() * 3)] = 'SCATTER';
            }
        }
    }
    let evalRes = evaluateGrid(grid, wager, getModePayoutScale(mode));
    // Wild surge multiplier mechanic on Reel 2 (center reel)
    let wildMultiplier = 1;
    const centerReelHasWild = grid[2].includes('WILD');
    if (centerReelHasWild && evalRes.totalLineWin > 0) {
        wildMultiplier = Math.random() < 0.65 ? 2 : 3;
    }
    const finalLineWin = evalRes.totalLineWin * wildMultiplier;
    const isBonus = evalRes.scatterCount >= 3;
    const bType = evalRes.scatterCount >= 6
        ? 'ethereal'
        : evalRes.scatterCount >= 5
            ? 'legend'
            : evalRes.scatterCount === 4
                ? 'ghost'
                : evalRes.scatterCount === 3
                    ? 'curse'
                    : null;
    const spinsAwarded = evalRes.scatterCount >= 6
        ? 10
        : evalRes.scatterCount >= 5
            ? 15
            : evalRes.scatterCount === 4
                ? 12
                : evalRes.scatterCount === 3
                    ? 10
                    : 0;
    return {
        grid,
        totalLineWin: finalLineWin,
        lineHits: evalRes.lineHits.map((h) => ({
            ...h,
            winAmount: h.winAmount * wildMultiplier,
            multiplier: h.multiplier * wildMultiplier,
        })),
        scatterCount: evalRes.scatterCount,
        scatterPositions: evalRes.scatterPositions,
        wildMultiplier,
        bonusTriggered: isBonus,
        bonusType: bType,
        bonusSpinsAwarded: spinsAwarded,
        totalWin: Math.min(finalLineWin, maxCap),
        payoutMultiplier: Math.min(finalLineWin, maxCap) / wager,
        isMaxWin: finalLineWin >= maxCap,
    };
}
/**
 * Executes a single free spin in bonus mode
 */
export function playBonusFreeSpin(bonusType, baseBet = 1.0, currentMultiplier = 2, payoutScale = BONUS_PAYOUT_SCALE) {
    const grid = generateRandomGrid();
    // Bonus mode perks:
    let multiplier = currentMultiplier;
    if (bonusType === 'curse') {
        // Random wild multipliers 2x to 5x
        multiplier = Math.floor(Math.random() * 4) + 2;
        if (Math.random() < 0.4) {
            grid[Math.floor(Math.random() * 5)][Math.floor(Math.random() * 3)] = 'WILD';
        }
    }
    else if (bonusType === 'ghost') {
        // Sticky / enhanced wilds with growing multiplier
        multiplier = Math.min(currentMultiplier + 1, 20);
        grid[1][1] = 'WILD';
        if (Math.random() < 0.5) {
            grid[3][Math.floor(Math.random() * 3)] = 'WILD';
        }
    }
    else if (bonusType === 'legend') {
        // Guaranteed multiple wilds every spin
        multiplier = Math.min(currentMultiplier + 2, 50);
        grid[1][Math.floor(Math.random() * 3)] = 'WILD';
        grid[2][Math.floor(Math.random() * 3)] = 'WILD';
        grid[3][Math.floor(Math.random() * 3)] = 'WILD';
    }
    else if (bonusType === 'ethereal') {
        // Ethereal Cataclysm: Huge multipliers and screen-wide Wilds
        multiplier = Math.min(currentMultiplier + 5, 100);
        for (let c = 0; c < 5; c++) {
            if (Math.random() < 0.6) {
                grid[c][Math.floor(Math.random() * 3)] = 'WILD';
            }
        }
    }
    const evalRes = evaluateGrid(grid, baseBet, payoutScale);
    const spinWin = evalRes.totalLineWin * multiplier;
    // Check retrigger (2+ scatters awards +3 spins, 3+ awards +5 spins)
    let retriggerSpins = 0;
    if (evalRes.scatterCount >= 3) {
        retriggerSpins = 5;
    }
    else if (evalRes.scatterCount === 2) {
        retriggerSpins = 3;
    }
    return {
        grid,
        spinWin,
        lineHits: evalRes.lineHits.map((h) => ({
            ...h,
            winAmount: h.winAmount * multiplier,
            multiplier: h.multiplier * multiplier,
        })),
        multiplier,
        retriggerSpins,
    };
}
/** Evaluate a precomputed feature frame used consistently by live play and replay. */
export function evaluateBonusSpinFrame(frame, baseBet) {
    const evaluated = evaluateGrid(frame.board, baseBet, BONUS_PAYOUT_SCALE);
    return {
        grid: frame.board,
        spinWin: evaluated.totalLineWin * frame.multiplier,
        lineHits: evaluated.lineHits.map((hit) => ({
            ...hit,
            winAmount: hit.winAmount * frame.multiplier,
            multiplier: hit.multiplier * frame.multiplier,
        })),
        multiplier: frame.multiplier,
        retriggerSpins: frame.retriggerSpins,
    };
}
//# sourceMappingURL=slot-engine.js.map