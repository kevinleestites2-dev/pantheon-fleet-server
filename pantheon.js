/**
 * PANTHEON.JS — Ghost Operator Layer
 * Autoplay bot + Drip claim system + DripBridge integration
 *
 * This runs on top of the base game (game.js).
 * No human interaction required. Ghost Operator mode is ALWAYS on.
 */

// ============================================================================
// INIT
// ============================================================================

let dripAccumulated = 0.0;
let claimCooldown = false;
let claimTimeRemaining = 0;
let autoplayLog = [];
const MAX_LOG = 5;

document.addEventListener('DOMContentLoaded', () => {
  // Apply Pantheon theme
  applyPantheonTheme();

  // Show instance ID
  document.getElementById('instance-id').textContent = PANTHEON_CONFIG.instanceId;

  // Wallet display
  const addr = PANTHEON_CONFIG.walletAddress;
  document.getElementById('wallet-short').textContent =
    addr.slice(0, 6) + '...' + addr.slice(-4);

  // Start claim timer
  startClaimTimer();

  // Start autoplay if configured
  if (PANTHEON_CONFIG.autoPlay) {
    setTimeout(startAutoPlay, 2000); // let game.js init first
  }

  logAutoplay('PANTHEON MINER online. Ghost Operator ACTIVE.');
});

// ============================================================================
// PANTHEON THEME
// ============================================================================

function applyPantheonTheme() {
  const root = document.documentElement;
  root.style.setProperty('--pantheon-primary', PANTHEON_CONFIG.theme.primary);
  root.style.setProperty('--pantheon-secondary', PANTHEON_CONFIG.theme.secondary);
  root.style.setProperty('--pantheon-accent', PANTHEON_CONFIG.theme.accent);
  root.style.setProperty('--pantheon-bg', PANTHEON_CONFIG.theme.bg);
}

// ============================================================================
// CLAIM TIMER
// ============================================================================

function startClaimTimer() {
  claimTimeRemaining = PANTHEON_CONFIG.claimInterval / 1000; // seconds
  claimCooldown = true;

  const timer = setInterval(() => {
    claimTimeRemaining--;

    const min = Math.floor(claimTimeRemaining / 60);
    const sec = claimTimeRemaining % 60;
    const display = document.getElementById('claim-timer');
    if (display) {
      display.textContent = `${min}:${sec.toString().padStart(2, '0')}`;
    }

    if (claimTimeRemaining <= 0) {
      clearInterval(timer);
      claimCooldown = false;
      const btn = document.getElementById('claim-btn');
      if (btn) {
        btn.disabled = false;
        btn.classList.add('btn-claim-ready');
      }
      if (display) display.textContent = 'READY';
      logAutoplay('Drip claim available — triggering auto-claim...');
      // Auto-claim
      setTimeout(claimDrip, 1000);
    }
  }, 1000);
}

// ============================================================================
// DRIP CLAIM
// ============================================================================

function claimDrip() {
  if (claimCooldown) return;

  const amount = PANTHEON_CONFIG.dripRate;
  dripAccumulated += amount;

  // Update war chest display
  const display = document.getElementById('war-chest-display');
  if (display) {
    display.textContent = `${dripAccumulated.toFixed(6)} MATIC`;
  }

  // Log to DripBridge (localStorage as cross-tab signal)
  const entry = {
    timestamp: new Date().toISOString(),
    instanceId: PANTHEON_CONFIG.instanceId,
    amount: amount,
    wallet: PANTHEON_CONFIG.walletAddress,
    totalAccumulated: dripAccumulated
  };

  // Store in localStorage for DripBridge to read
  const existing = JSON.parse(localStorage.getItem('pantheon_drip_log') || '[]');
  existing.push(entry);
  // Keep last 100 entries
  if (existing.length > 100) existing.shift();
  localStorage.setItem('pantheon_drip_log', JSON.stringify(existing));
  localStorage.setItem('pantheon_total_drip', dripAccumulated.toString());
  localStorage.setItem('pantheon_wallet', PANTHEON_CONFIG.walletAddress);

  logAutoplay(`DRIP CLAIMED: +${amount} MATIC → War Chest: ${dripAccumulated.toFixed(6)}`);

  // Reset claim button
  const btn = document.getElementById('claim-btn');
  if (btn) {
    btn.disabled = true;
    btn.classList.remove('btn-claim-ready');
  }

  // Restart timer
  startClaimTimer();

  // Visual flash
  flashWarChest();
}

function flashWarChest() {
  const display = document.getElementById('war-chest-display');
  if (!display) return;
  display.classList.add('flash-gold');
  setTimeout(() => display.classList.remove('flash-gold'), 600);
}

// ============================================================================
// AUTOPLAY BOT — Ghost Operator
// ============================================================================

let autoPlayInterval = null;
let autoPlayCycle = 0;

function startAutoPlay() {
  logAutoplay('Ghost Operator initializing...');

  // Run autoplay every 500ms
  autoPlayInterval = setInterval(runAutoPlayCycle, 500);
  logAutoplay('Autoplay loop ACTIVE. Mining 24/7.');
}

function runAutoPlayCycle() {
  autoPlayCycle++;

  // 1. Always mine (simulate click)
  if (typeof mine === 'function') {
    mine();
  }

  // 2. Every 10 cycles — try to buy upgrades (smart priority)
  if (autoPlayCycle % 10 === 0) {
    autoUpgrade();
  }

  // 3. Every 20 cycles — sell coins if value is high
  if (autoPlayCycle % 20 === 0) {
    autoSell();
  }

  // 4. Update autoplay status display
  if (autoPlayCycle % 30 === 0) {
    updateAutoPlayStatus();
  }
}

function autoUpgrade() {
  // Priority: helper → miner → engineer → factory → rocket
  // Buy cheapest available first to maximize compound growth

  if (typeof gems === 'undefined') return;

  const upgrades = [
    { cost: 10,   fn: 'buyHelper',   name: 'Auto-Miner' },
    { cost: 50,   fn: 'buyMiner',    name: 'Rig' },
    { cost: 200,  fn: 'buyEngineer', name: 'Engineer' },
    { cost: 1000, fn: 'buyFactory',  name: 'Factory' },
    { cost: 5000, fn: 'buyRocket',   name: 'Nexus' },
  ];

  for (const upgrade of upgrades) {
    if (gems >= upgrade.cost) {
      if (typeof window[upgrade.fn] === 'function') {
        window[upgrade.fn]();
        logAutoplay(`AUTO-BUY: ${upgrade.name} purchased`);
        return; // one upgrade per cycle
      }
    }
  }
}

function autoSell() {
  if (typeof coins === 'undefined' || typeof coinValue === 'undefined') return;

  // Sell when we have significant coins and value is decent
  if (coins >= 50 && coinValue >= 0.5) {
    if (typeof sellCoins === 'function') {
      sellCoins();
      logAutoplay(`AUTO-SELL: ${coins.toFixed(0)} PRIME sold @ $${coinValue.toFixed(2)}`);
    }
  }
}

function updateAutoPlayStatus() {
  const el = document.getElementById('autoplay-action');
  if (!el) return;

  const hashrate = document.getElementById('hashrate-display');
  const hr = hashrate ? hashrate.textContent : '?';

  el.textContent = `Mining · ${hr} H/s · Cycle ${autoPlayCycle}`;
}

// ============================================================================
// AUTOPLAY LOG
// ============================================================================

function logAutoplay(msg) {
  const timestamp = new Date().toLocaleTimeString();
  autoplayLog.unshift(`[${timestamp}] ${msg}`);
  if (autoplayLog.length > MAX_LOG) autoplayLog.pop();

  const el = document.getElementById('autoplay-log');
  if (el) {
    el.innerHTML = autoplayLog.map(l => `<div>${l}</div>`).join('');
  }

  console.log('[PANTHEON]', msg);
}

// ============================================================================
// UTILITIES
// ============================================================================

function copyWallet() {
  navigator.clipboard.writeText(PANTHEON_CONFIG.walletAddress).then(() => {
    logAutoplay('Wallet address copied to clipboard');
  });
}

// Override the original mine button text if needed
window.addEventListener('load', () => {
  const btn = document.getElementById('mine-btn');
  // btn styling handled by CSS
});
