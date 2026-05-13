const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const TOTAL_INSTANCES = 5000;
const WALLET = '0x369c2DDDBEb910c48356910069B2903b3Cb4d535';

// Serve static assets
app.use('/styles.css', express.static(path.join(__dirname, 'styles.css')));
app.use('/pantheon.js', express.static(path.join(__dirname, 'pantheon.js')));

// Index — list all instances
app.get('/', (req, res) => {
  let links = '';
  for (let i = 1; i <= TOTAL_INSTANCES; i++) {
    links += `<a href="/miner/${i}" style="color:#d4af37;margin:2px;font-size:11px">M${i}</a> `;
  }
  res.send(`<!DOCTYPE html>
<html><head>
<title>PANTHEON FLEET — ${TOTAL_INSTANCES} MINERS</title>
<style>body{background:#0a0a0a;color:#d4af37;font-family:monospace;padding:20px;}
h1{color:#ffd700;} .grid{line-height:2;word-break:break-all;}</style>
</head><body>
<h1>🔱 PANTHEON MINING FLEET</h1>
<p style="color:#888">${TOTAL_INSTANCES} instances · Wallet: ${WALLET}</p>
<div class="grid">${links}</div>
</body></html>`);
});

// Individual miner page
app.get('/miner/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id < 1 || id > TOTAL_INSTANCES) {
    return res.status(404).send('Instance not found');
  }

  // Vary drip rate slightly per instance for uniqueness
  const dripRate = (0.0008 + (id % 10) * 0.00005).toFixed(6);
  const claimInterval = 270000 + (id % 30) * 1000; // 4.5–5 min variation

  res.send(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>PANTHEON MINER #${id} — PRIME Token</title>
    <link href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" />
    <link rel="stylesheet" href="/styles.css" />
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
      const PANTHEON_CONFIG = {
        tokenName:     "PRIME",
        tokenSymbol:   "PRIME",
        chainName:     "Polygon",
        chainId:       137,
        walletAddress: "${WALLET}",
        dripRate:      ${dripRate},
        claimInterval: ${claimInterval},
        autoPlay:      true,
        instanceId:    "pantheon-${id}",
        theme: {
          primary:   "#d4af37",
          secondary: "#6b21a8",
          accent:    "#ffd700",
          bg:        "#0a0a0a",
        }
      };
    </script>
  </head>
  <body class="bg-dark text-white">
    <!-- Instance badge -->
    <div style="position:fixed;top:8px;right:8px;background:#6b21a8;color:#ffd700;
      font-family:monospace;font-size:11px;padding:4px 8px;border-radius:4px;
      border:1px solid #d4af37;z-index:9999">
      INSTANCE #${id} / ${TOTAL_INSTANCES}
    </div>
    <!-- Original miner HTML below -->
    <div class="container text-center">
      <div class="pantheon-header my-4">
        <div class="isu-eye">👁️</div>
        <h1 class="pantheon-title">PANTHEON MINER</h1>
        <div class="pantheon-subtitle">PRIME TOKEN · POLYGON NETWORK</div>
        <div class="autoplay-badge" id="autoplay-badge">⚡ GHOST OPERATOR ACTIVE</div>
      </div>
      <div class="wallet-container mb-3">
        <div class="row">
          <div class="col-6">
            <div class="stat-label">WAR CHEST</div>
            <div class="stat-value gold" id="war-chest-display">0.000000 MATIC</div>
          </div>
          <div class="col-6">
            <div class="stat-label">SESSION EARNED</div>
            <div class="stat-value gold" id="session-earned">0.000000 MATIC</div>
          </div>
        </div>
      </div>
      <div id="claim-panel" class="claim-panel mb-3">
        <div class="countdown-ring">
          <canvas id="countdown-canvas" width="120" height="120"></canvas>
          <div class="countdown-text" id="countdown-text">READY</div>
        </div>
        <button id="claim-btn" class="btn-prime mt-2" onclick="claimReward()">⚡ CLAIM PRIME</button>
      </div>
      <div class="stats-grid mb-3">
        <div class="stat-box">
          <div class="stat-label">TOTAL CLAIMS</div>
          <div class="stat-value" id="total-claims">0</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">DRIP RATE</div>
          <div class="stat-value">${dripRate} MATIC</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">NETWORK</div>
          <div class="stat-value">POLYGON</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">STATUS</div>
          <div class="stat-value green" id="network-status">ONLINE</div>
        </div>
      </div>
      <div class="chart-container mb-3">
        <canvas id="earnings-chart"></canvas>
      </div>
      <div class="wallet-address" title="${WALLET}">
        🔱 ${WALLET.substring(0,10)}...${WALLET.substring(36)}
      </div>
    </div>
    <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js"></script>
    <script src="/pantheon.js"></script>
  </body>
</html>`);
});

// Health check
app.get('/ping', (req, res) => res.json({ status: 'ONLINE', instances: TOTAL_INSTANCES, wallet: WALLET }));

app.listen(PORT, () => {
  console.log(`🔱 PANTHEON FLEET ONLINE — ${TOTAL_INSTANCES} miners on port ${PORT}`);
});
