# 10Root-MFA-Suite

A comprehensive Multi-Factor Authentication (MFA) system that combines RADIUS protocol authentication with push notifications for secure access control.

## Overview

This suite provides enterprise-grade MFA by integrating three components:
- **RadiusServer** - RADIUS authentication server that intercepts network access requests
- **PushAppServer** - Backend server that sends push notifications and emails for approval
- **PushAppClient** - Mobile app where users approve or deny access requests

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          10Root-MFA-Suite Architecture                       │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐      UDP 8888       ┌──────────────┐
│   RADIUS     │ ──────────────────► │   Radius     │
│   Client     │   Access-Request    │   Server     │
│  (VPN/WiFi)  │ ◄────────────────── │  (Node.js)   │
└──────────────┘   Accept/Reject     └──────┬───────┘
                                            │
                                            │ REST API (HTTP)
                                            ▼
                                     ┌──────────────┐
                                     │   PushApp    │
                                     │   Server     │──────► Email (SMTP)
                                     │  (Node.js)   │
                                     └──────┬───────┘
                                            │
                                            │ Expo Push Notification
                                            ▼
                                     ┌──────────────┐
                                     │   PushApp    │
                                     │   Client     │
                                     │ (Mobile App) │
                                     └──────────────┘
                                            │
                                            │ User Approves/Denies
                                            ▼
                                     Response flows back
                                     to RadiusServer
```

## Features

- **RSA Cryptographic Verification** - All notifications are signed and verified
- **Geofencing** - Location-based access control using lat/lon coordinates
- **TOTP Support** - Time-based One-Time Password for additional security
- **Email + Push** - Dual notification channels for redundancy
- **QR Code Registration** - Easy device enrollment via QR scanning
- **Notification History** - Track all authentication requests
- **Threshold Mode** - Auto-accept within configured time windows
- **Multi-Approval** - Require multiple approvers for sensitive access

## Prerequisites

- **Node.js** v18 or higher
- **npm** (comes with Node.js)
- **Expo CLI** - Install globally: `npm install -g expo-cli`
- **Mobile Device** - Android/iOS with [Expo Go](https://expo.dev/client) app, OR Android Emulator
- **RADIUS Test Tool** - NTRadPing (Windows) or radtest (Linux) for testing

### Optional
- **Android Studio** - For Android emulator
- **Gmail/Office365 Account** - For email notifications (requires App Password)

## Installation

### 1. Clone or Download the Repository

```bash
cd 10Root-MFA-Suite
```

### 2. Install Dependencies for Each Component

```bash
# Install RadiusServer dependencies
cd RadiusServer
npm install

# Install PushAppServer dependencies
cd ../PushAppServer
npm install

# Install PushAppClient dependencies
cd ../PushAppClient
npm install
```

## Configuration

### Step 1: Generate RSA Keys (PushAppServer)

```bash
cd PushAppServer
node r.js -g
```

This creates:
- `privateKey.pem` - Keep this secure, used for signing
- `publicKey.pem` - Embedded in QR code for verification
- `QRCode.png` - Scan this with the mobile app

### Step 2: Configure RadiusServer

Create `RadiusServer/settings.json`:

```json
{
  "secret": "your_radius_secret",
  "PORT": 5555,
  "APIURL": "http://YOUR_SERVER_IP:5555",
  "PASSWORD": "your_api_password",
  "UserDirectory": "./UserDirectory.json",
  "SENDEREMAIL": "your_email@gmail.com",
  "PASSWORDEMAIL": "your_app_password",
  "EMAILHOST": "Gmail",
  "WAYOFNOTIFICATION": "Both",
  "EMAILLIST": [],
  "PHONELIST": [],
  "minApproval": 1,
  "MinPhoneApproval": "0",
  "TTL": 120,
  "DESCRIPTION": "Please Approve Your Identity",
  "ALLOWTOTP": false,
  "TOTPOBJECTdigits": 6,
  "TOTPOBJECTalgorithm": "SHA3-384",
  "TOTPOBJECTperiod": 120,
  "LOCATIONlongitude": "34.78",
  "LOCATIONlatitude": "32.05",
  "PRIVATEKEY": "./privateKey.pem",
  "URLIPTYPE": "Public",
  "Threshold": {
    "Enabled": false,
    "TimeAllowedInHours": 3
  },
  "Interval": {
    "Enabled": false,
    "TimeInMinutes": 3
  }
}
```

Create `RadiusServer/UserDirectory.json`:

```json
{
  "testuser@domain.com": {
    "EMAILLIST": ["user@example.com"],
    "PHONELIST": ["ExponentPushToken[xxxxx]"]
  }
}
```

### Step 3: Configure Email (Optional)

For Gmail:
1. Enable 2-Factor Authentication in your Google Account
2. Generate an App Password: Google Account → Security → App Passwords
3. Use the App Password in `PASSWORDEMAIL` field

For Office365:
1. Set `EMAILHOST` to `"Office365"`
2. Use your organization's SMTP credentials

## Running the System

**Important:** Start components in this order:

### Terminal 1: Start PushAppServer

```bash
cd PushAppServer
node r.js -r -z 5555 -v your_api_password -f 10
```

Parameters:
- `-r` - REST API mode
- `-z 5555` - Listen on port 5555
- `-v password` - API password
- `-f 10` - Log level

### Terminal 2: Start RadiusServer

```bash
cd RadiusServer
node ser.js --jsonSettings settings.json
```

The server will listen on UDP port 8888.

### Terminal 3: Start Mobile App

**Option A: Using Expo Go (Recommended for testing)**
```bash
cd PushAppClient
npx expo start
```
Scan the QR code with Expo Go app on your phone.

**Option B: Using Android Emulator**
```bash
cd PushAppClient
npx expo run:android
```

### Mobile App Setup

1. Open the app on your device
2. Go to **Options/Settings**
3. Scan the `QRCode.png` generated in Step 1
4. Note your **Phone ID** (Expo Push Token) from the main screen
5. Add allowed geographic zones (optional)

## Testing the System

### Using NTRadPing (Windows)

1. Download NTRadPing
2. Configure:
   - **RADIUS Server:** `127.0.0.1` (or your server IP)
   - **Port:** `8888`
   - **Secret:** Your configured secret
   - **Username:** `testuser@domain.com`
   - **Password:** `anypassword`
3. Click "Send"

### Using radtest (Linux/Mac)

```bash
radtest testuser@domain.com password 127.0.0.1 8888 your_radius_secret
```

### Expected Flow

1. RADIUS request arrives at RadiusServer
2. RadiusServer sends request to PushAppServer
3. PushAppServer sends push notification to mobile app
4. User receives notification and taps Approve/Deny
5. Response flows back through the chain
6. RadiusServer returns Access-Accept or Access-Reject

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success - Access Approved |
| 1 | Denied - User rejected |
| 2 | Timeout - No response within TTL |
| 3 | Signature not verified |
| 7 | Wrong TOTP code |
| 8 | Majority approval (multi-approval mode) |
| 9 | Wrong location |

## Troubleshooting

### Push notifications not arriving?
- Ensure your Phone ID (Expo Push Token) is in `PHONELIST` or `UserDirectory.json`
- Check that Expo Go app has notification permissions
- Verify network connectivity

### RADIUS requests failing?
- Verify the shared secret matches on both client and server
- Check firewall allows UDP port 8888
- Ensure PushAppServer is running and accessible

### Email not sending?
- For Gmail, use App Password (not regular password)
- Check SMTP settings and email host configuration
- Verify network allows outbound SMTP (ports 465/587)

### Mobile app won't connect?
- Use local network IP instead of `localhost` for `APIURL`
- Ensure all three components are on the same network
- Check firewall rules

## Project Structure

```
10Root-MFA-Suite/
├── README.md                   # This file
├── .gitignore                  # Git ignore rules
│
├── RadiusServer/               # RADIUS Authentication Server
│   ├── ser.js                  # Main entry point
│   ├── package.json            # Dependencies
│   ├── settingsExample.json    # Configuration template
│   ├── UserDirectoryExample copy.json
│   └── asset/                  # RADIUS library & utilities
│       ├── radius/             # node-radius library
│       ├── Logger.js
│       └── MFAFunction.js
│
├── PushAppServer/              # Push Notification Server
│   ├── r.js                    # Main entry point
│   ├── package.json            # Dependencies
│   └── src/
│       ├── Controller/         # Request handlers
│       ├── Routes/             # API endpoints
│       ├── MiddleWare/         # Auth middleware
│       ├── Model/              # Business logic
│       ├── Servers/            # Server implementations
│       └── Helper/             # Utilities
│
└── PushAppClient/              # React Native Mobile App
    ├── App.js                  # Root component
    ├── package.json            # Dependencies
    ├── app.json                # Expo config
    ├── Screen/                 # App screens
    │   ├── MainScreen.js       # Home screen
    │   ├── NotificationScreen.js
    │   ├── OptionsScreen.js    # Settings & QR scan
    │   └── ResultScreen.js
    └── Component's/            # Reusable components
        ├── MainNavigation.js   # Navigation & notification handling
        └── HelperFunc/         # Utility functions
```

## Libraries & Licenses

### RadiusServer Dependencies
| Library | Version | License |
|---------|---------|---------|
| node-radius | 1.1.4 | BSD 3-Clause (Nearbuy Systems) |
| express | 4.18.2 | MIT |
| dotenv | 16.3.1 | BSD-2-Clause |
| yargs | 17.7.2 | MIT |

### PushAppServer Dependencies
| Library | Version | License |
|---------|---------|---------|
| express | 4.18.2 | MIT |
| jsonwebtoken | 9.0.0 | MIT |
| hybrid-crypto-js | 0.2.4 | MIT |
| nodemailer | 6.9.1 | MIT |
| qrcode | 1.5.1 | MIT |
| totp-generator | 0.0.14 | MIT |
| uuid | 9.0.0 | MIT |
| dotenv | 16.0.3 | BSD-2-Clause |
| yargs | 17.7.1 | MIT |
| inquirer | 8.2.5 | MIT |

### PushAppClient Dependencies
| Library | Version | License |
|---------|---------|---------|
| react | 18.2.0 | MIT |
| react-native | 0.74.5 | MIT |
| expo | 51.0.32 | MIT |
| expo-notifications | 0.28.16 | MIT |
| expo-barcode-scanner | 13.0.1 | MIT |
| @react-navigation/native | 6.1.6 | MIT |
| axios | 1.3.4 | MIT |
| hybrid-crypto-js | 0.2.4 | MIT |
| react-native-toast-message | 2.1.7 | MIT |

### Third-Party License Notice

**node-radius (BSD 3-Clause)**
```
Copyright (c) 2012, Nearbuy Systems
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
  * Redistributions of source code must retain the above copyright notice
  * Redistributions in binary form must reproduce the above copyright notice
  * Neither the name of Nearbuy Systems nor the names of its contributors
    may be used to endorse or promote products derived from this software
    without specific prior written permission.
```

## Component Versions

| Component | Version |
|-----------|---------|
| RadiusServer | 0.1.0 |
| PushAppServer | 2.1.2 |
| PushAppClient | 0.9.9 |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

For issues and questions, please open an issue in the repository.
