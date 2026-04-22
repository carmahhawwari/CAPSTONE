# Brightek POS80 Print Server for Raspberry Pi

Complete print server solution for internet-based thermal printing via Supabase.

## Components

### `print_server.py`
Main polling server that:
- Connects to Supabase
- Polls for pending print jobs
- Sends ESC/POS commands to USB printer
- Updates job status in database
- Auto-starts via systemd

### `bootloader_exit.py`
Attempts to exit printer bootloader mode if device is in 0x5720.
- Tries USB reset and control transfers
- Waits for device to re-enumerate as 0x5743
- Called automatically on print server startup

### `rastertomhtpos.py`
Converts images to ESC/POS bitmap format.
- Standalone converter: `python rastertomhtpos.py input.png output.bin`
- CUPS filter mode for system-wide printing
- Multiple dithering methods (Floyd-Steinberg, ordered, threshold)
- Auto-scales images to 576 dots (POS80 width)

## Installation

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your Supabase credentials and printer ID
```

### 3. Setup Systemd Service
The service file should already be in `/etc/systemd/system/inklings-printer.service`

Enable and start:
```bash
sudo systemctl enable inklings-printer
sudo systemctl start inklings-printer
```

Monitor logs:
```bash
sudo journalctl -u inklings-printer -f
```

### 4. (Optional) Install CUPS Filter
For system-wide printing support via CUPS:
```bash
bash install-cups-filter.sh
```

Then add printer to CUPS:
```bash
sudo lpadmin -p Brightek-POS80 -E -v usb://Brightek/POS80 -m Brightek-POS80.ppd
```

## Troubleshooting

### Printer in Bootloader Mode
If you see "Invalid endpoint address 0x1" errors:
```bash
python bootloader_exit.py
```

The device should re-enumerate as 0x5743 (application mode).

### USB Permissions
Make sure the `inklings` user is in the `dialout` group:
```bash
sudo usermod -a -G dialout inklings
```

### Test Printing
From the web app (Inklings), create a test receipt and click Print. The job should appear in the logs within 3 seconds.

## Architecture

```
Web App (React/Vite)
    ↓
Supabase (PostgreSQL)
    ↓
Print Server (polls every 3s)
    ↓
USB Printer
```

1. User creates receipt on web app
2. App sends ESC/POS data to Supabase
3. Print server polls and finds job
4. Server sends binary to USB printer via pyusb
5. Printer outputs receipt
6. Status updated back to app (real-time via Supabase)

## Printer Specs

**Model:** Brightek POS80  
**Interface:** USB  
**Vendor ID:** 0x0483  
**Product ID:** 0x5743 (application mode) / 0x5720 (bootloader)  
**Width:** 80mm (576 dots at 203 DPI)  
**Format:** ESC/POS thermal printer language
