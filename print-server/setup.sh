#!/usr/bin/env bash
# Setup script for the Raspberry Pi print server.
# Run once after cloning the repo onto the Pi.
set -euo pipefail

echo "=== Prague Print Server Setup ==="

# 1. Install system deps
echo "[1/4] Installing system dependencies..."
sudo apt-get update -qq
sudo apt-get install -y -qq python3-pip python3-venv libusb-1.0-0-dev

# 2. Create venv
echo "[2/4] Creating Python virtual environment..."
python3 -m venv .venv
source .venv/bin/activate

# 3. Install Python deps
echo "[3/4] Installing Python dependencies..."
pip install -r requirements.txt

# 4. USB permissions (so the server can talk to the printer without root)
echo "[4/4] Setting up USB permissions..."
UDEV_RULE='/etc/udev/rules.d/99-thermal-printer.rules'
if [ ! -f "$UDEV_RULE" ]; then
  echo 'SUBSYSTEM=="usb", ATTR{idVendor}=="0483", ATTR{idProduct}=="5743", MODE="0666"' \
    | sudo tee "$UDEV_RULE" > /dev/null
  sudo udevadm control --reload-rules
  sudo udevadm trigger
  echo "   USB udev rule installed. You may need to re-plug the printer."
else
  echo "   USB udev rule already exists."
fi

echo ""
echo "=== Setup complete ==="
echo "Next steps:"
echo "  1. cp .env.example .env"
echo "  2. Edit .env with your Supabase credentials and printer ID"
echo "  3. source .venv/bin/activate"
echo "  4. python print_server.py"
