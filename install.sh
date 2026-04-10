#!/bin/bash
# ╔══════════════════════════════════════════╗
# ║   USMAN MD v5 — INSTALLER               ║
# ║   by Usman King         ║
# ╚══════════════════════════════════════════╝

echo ""
echo "  ╔══════════════════════════════════════════╗"
echo "  ║   ᴊᴇʀʀʏ ᴍᴅ v5  |  INSTALLER            ║"
echo "  ╚══════════════════════════════════════════╝"
echo ""

# Check Node.js version
NODE_VER=$(node -v 2>/dev/null | sed 's/v//' | cut -d. -f1)
if [ -z "$NODE_VER" ] || [ "$NODE_VER" -lt 18 ]; then
  echo "  [!] Node.js 18+ required. Current: $(node -v 2>/dev/null || echo 'not found')"
  echo "  Run: pkg install nodejs"
  exit 1
fi
echo "  [✓] Node.js v$(node -v | sed 's/v//')"

# Install dependencies
echo "  [*] Installing packages..."
npm install --no-fund --no-audit 2>&1 | tail -3

# Check yt-dlp (optional, improves YouTube downloads)
if command -v yt-dlp &>/dev/null; then
  echo "  [✓] yt-dlp found"
else
  echo "  [!] yt-dlp not found (optional, for better YouTube downloads)"
  echo "      Termux: pip install yt-dlp"
fi

echo ""
echo "  [✓] Installation complete!"
echo ""
echo "  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  1. Edit config.js — set your ownerNumber"
echo "  2. Run: node index.js"
echo "  3. Enter your WhatsApp number (with country code)"
echo "  4. Get the 8-digit pairing code"
echo "  5. Enter it in WhatsApp → Settings → Linked Devices"
echo "  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  NOTE: If pairing code fails:"
echo "    rm -rf auth_info_baileys && node index.js"
echo ""
