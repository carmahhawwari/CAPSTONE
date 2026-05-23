# Pop-Up Event Print Server Setup (MacBook)

Quick setup guide for running the print server on a MacBook for a temporary pop-up event.

## Before the Event

Your teammate should receive:
1. **`.env` file** with the printer configuration (already prepared)
2. **USB thermal printer** (Brightek POS80 recommended)
3. **USB cable** for printer connection
4. **Network access** to the same WiFi as the app users

## Setup Instructions for Your Teammate

### Step 1: Get the Code
```bash
cd ~/Desktop
git clone git@github.com:carmahhawwari/CAPSTONE.git capstone
cd capstone/print-server
```

### Step 2: Copy the .env File
You'll provide the `.env` file. Have your teammate:
```bash
# Place the .env file in the print-server directory
# Ask: "Where's the .env file?" 
# Then: cp /path/to/.env ~/Desktop/capstone/print-server/.env
```

### Step 3: Create Python Virtual Environment
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**If she gets an error about `python3` not found:**
- Install Python: `brew install python3`
- Then try again

### Step 4: Connect the Printer
1. Plug in the Brightek thermal printer via USB
2. Verify it's connected:
   ```bash
   system_profiler SPUSBDataType | grep -i "brightek\|stmicroelectronics"
   ```
   Should show something with vendor ID `0x0483`

### Step 5: Test the Print Server
```bash
source venv/bin/activate  # If not already activated
python print_server.py
```

Should see:
```
[server] Print server starting
[server] Printer ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
[server] Polling every 3s
[server] Ready to accept print jobs
```

**Leave this terminal open and running!**

### Step 6: Test a Print Job
1. Open the app on any phone/laptop connected to the same WiFi
2. Go to Home → Print → Select a message
3. Should see the printer location displayed
4. Click print
5. **Check the MacBook terminal** - should show:
   ```
   [job xxxxxxxx] Processing...
   [job xxxxxxxx] ✓ Printed successfully
   ```
6. **Check the printer** - receipt should print! 🎉

## Troubleshooting During the Event

### "Ready to accept print jobs" but nothing prints
- **Check:** Is the printer plugged in and powered on?
- **Check:** Is the printer connected to the Mac? Run `system_profiler SPUSBDataType | grep -i stmicroelectronics`
- **Check:** Is the `.env` file in the right place? Run `cat .env` and verify `PRINTER_ID` matches Supabase

### "ModuleNotFoundError: No module named 'supabase'"
```bash
source venv/bin/activate
pip install -r requirements.txt
# Then run: python print_server.py
```

### Terminal shows "Access denied (insufficient permissions)"
- On Mac, this is usually a USB permission issue
- **Quick fix:** Unplug/replug the printer and restart the server:
  ```bash
  # Press Ctrl+C to stop the server
  python print_server.py
  ```

### "Printer not responding" in the app
- Verify the MacBook's IP address: `ifconfig | grep "inet " | grep -v 127.0.0.1`
- Make sure phones/laptops are on the **same WiFi network** as the MacBook
- The app needs to reach Supabase, so check internet connection

## Quick Reference

### Start the Server
```bash
cd ~/Desktop/capstone/print-server
source venv/bin/activate
python print_server.py
```

### Stop the Server
Press `Ctrl+C` in the terminal

### Check Logs
The terminal shows everything in real-time. Look for:
- ✅ `✓ Printed successfully` = good
- ❌ `✗ FAILED: ...` = problem (read the error message)

## Before Leaving the Event

1. **Stop the server:** Press `Ctrl+C`
2. **Unplug the printer**
3. **Keep the MacBook available** in case you need to print more during setup

## Notes for You (the organizer)

- The `.env` file has the `PRINTER_ID` that matches the printer in Supabase
- Make sure the printer location is added to the `printers` table with a geofence that covers the event space
- Your teammate just needs to run `python print_server.py` - she doesn't need to understand how it works
- If she closes the terminal or unplugs the printer, the server stops and printing won't work until she restarts it

## Emergency Contact

If something goes wrong:
1. Check the troubleshooting section above
2. Take a screenshot of the error in the terminal
3. Verify the printer is plugged in and powered on
4. Restart: `Ctrl+C` then `python print_server.py`
