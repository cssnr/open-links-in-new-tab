[![Chrome Web Store Users](https://img.shields.io/chrome-web-store/users/efahmjakjnnmleokcaomicgfhobabdkc?logo=google&logoColor=white&label=google%20users)](https://chrome.google.com/webstore/detail/open-links-in-new-tab/efahmjakjnnmleokcaomicgfhobabdkc)
[![Mozilla Add-on Users](https://img.shields.io/amo/users/open-links-in-new-tab?logo=mozilla&label=mozilla%20users)](https://addons.mozilla.org/addon/open-links-in-new-tab)
[![Chrome Web Store Version](https://img.shields.io/chrome-web-store/v/efahmjakjnnmleokcaomicgfhobabdkc?label=chrome&logo=googlechrome)](https://chrome.google.com/webstore/detail/open-links-in-new-tab/efahmjakjnnmleokcaomicgfhobabdkc)
[![Mozilla Add-on Version](https://img.shields.io/amo/v/open-links-in-new-tab?label=firefox&logo=firefox)](https://addons.mozilla.org/addon/open-links-in-new-tab)
[![GitHub Release Version](https://img.shields.io/github/v/release/cssnr/open-links-in-new-tab?logo=github)](https://github.com/cssnr/open-links-in-new-tab/releases/latest)
[![Manifest Version](https://img.shields.io/github/manifest-json/v/cssnr/open-links-in-new-tab?filename=manifest.json&logo=json&label=manifest)](https://github.com/cssnr/open-links-in-new-tab/blob/master/manifest.json)
[![Build](https://github.com/cssnr/open-links-in-new-tab/actions/workflows/build.yaml/badge.svg)](https://github.com/cssnr/open-links-in-new-tab/actions/workflows/build.yaml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=cssnr_open-links-in-new-tab&metric=alert_status&label=quality)](https://sonarcloud.io/summary/overall?id=cssnr_open-links-in-new-tab)
# Open Links in New Tab

Modern Chrome Web Extension and Firefox Browser Addon to Open Links in New Tabs for Specified Domains or Temporarily on Any Tab.

*   [Install](#install)
*   [Features](#features)
*   [Configuration](#configuration)
*   [Development](#development)
    -   [Building](#building)

# Install

*   [Google Chrome Web Store](https://chrome.google.com/webstore/detail/open-links-in-new-tab/efahmjakjnnmleokcaomicgfhobabdkc)
*   [Mozilla Firefox Add-ons](https://addons.mozilla.org/addon/open-links-in-new-tab)

[![Chrome](https://raw.githubusercontent.com/alrra/browser-logos/main/src/chrome/chrome_48x48.png)](https://chrome.google.com/webstore/detail/open-links-in-new-tab/efahmjakjnnmleokcaomicgfhobabdkc)
[![Firefox](https://raw.githubusercontent.com/alrra/browser-logos/main/src/firefox/firefox_48x48.png)](https://addons.mozilla.org/addon/open-links-in-new-tab)
[![Edge](https://raw.githubusercontent.com/alrra/browser-logos/main/src/edge/edge_48x48.png)](https://chrome.google.com/webstore/detail/open-links-in-new-tab/efahmjakjnnmleokcaomicgfhobabdkc)
[![Chromium](https://raw.githubusercontent.com/alrra/browser-logos/main/src/chromium/chromium_48x48.png)](https://chrome.google.com/webstore/detail/open-links-in-new-tab/efahmjakjnnmleokcaomicgfhobabdkc)
[![Brave](https://raw.githubusercontent.com/alrra/browser-logos/main/src/brave/brave_48x48.png)](https://chrome.google.com/webstore/detail/open-links-in-new-tab/efahmjakjnnmleokcaomicgfhobabdkc)
[![Vivaldi](https://raw.githubusercontent.com/alrra/browser-logos/main/src/vivaldi/vivaldi_48x48.png)](https://chrome.google.com/webstore/detail/open-links-in-new-tab/efahmjakjnnmleokcaomicgfhobabdkc)
[![Opera](https://raw.githubusercontent.com/alrra/browser-logos/main/src/opera/opera_48x48.png)](https://chrome.google.com/webstore/detail/open-links-in-new-tab/efahmjakjnnmleokcaomicgfhobabdkc)

All Chromium Based Browsers can install the extension from the
[Chrome Web Store](https://chrome.google.com/webstore/detail/open-links-in-new-tab/efahmjakjnnmleokcaomicgfhobabdkc).

Advanced Users can:
*   Download the latest [Chrome Release](https://github.com/cssnr/open-links-in-new-tab/releases/latest/download/open_links_in_new_tab-chrome.crx) from GitHub
*   Download the latest [Firefox Release](https://github.com/cssnr/open-links-in-new-tab/releases/latest/download/open_links_in_new_tab-firefox.xpi) from GitHub

# Features

Please submit a [Feature Request](https://github.com/cssnr/open-links-in-new-tab/discussions/new?category=feature-requests) for new features.   
For any issues, bugs or concerns; please [Open an Issue](https://github.com/cssnr/open-links-in-new-tab/issues/new).

*   Toggle Sites to Always Open Links in New Tabs
*   Temporarily Open All Links in New Tabs for Current Site
*   Options Page to View and Edit Toggled Sites and More
*   Automatic Dark/Light Mode based on Browser Setting
*   Activate from Icon, Context Menu, or Keyboard Shortcuts

## Planned Upcoming Features

*   Enable for Specific URL Only
*   Enable for Matching Regex URL Only
*   Toggle Enable Globally
*   Toggle Blacklist/Whitelist
*   Export/Import URL List

If you want to see any of these, or another, feature implemented faster, please open a
[Feature Request](https://github.com/cssnr/open-links-in-new-tab/discussions/new?category=feature-requests).

# Configuration

You can pin the Addon by clicking the `Puzzle Piece`, find the Web Extension icon, then;  
**Chrome**, click the `Pin` icon.  
**Firefox**, click the `Settings Wheel` and `Pin to Toolbar`.  

To open the options, click on the icon (from above) then click `Open Options`.

# Development

**Quick Start**

To run chrome or firefox with web-ext.
```shell
npm isntall
npm run chrome
npm run firefox
```

To Load Unpacked/Temporary Add-on make a `manifest.json` and run from the [src](src) folder.
```shell
npm run manifest:chrome
npm run manifest:firefox
```

For more information on web-ext, [read this documentation](https://extensionworkshop.com/documentation/develop/web-ext-command-reference/).  
To pass additional arguments to an `npm run` command, use `--`.  
Example: `npm run chrome -- --chromium-binary=...`

## Building

Install the requirements and copy libraries into the `src/dist` directory by running `npm install`.
See [gulpfile.js](gulpfile.js) for more information on `postinstall`.
```shell
npm install
```

To load unpacked or temporary addon from the [src](src) folder, you must generate the `src/manifest.json` for the desired browser.
```shell
npm run manifest:chrome
npm run manifest:firefox
```

If you would like to create a `.zip` archive of the [src](src) directory for the desired browser.
```shell
npm run build
npm run build:chrome
npm run build:firefox
```

For more information on building, see the scripts in the [package.json](package.json) file.

## Chrome Setup

1.  Build or Download a [Release](https://github.com/cssnr/open-links-in-new-tab/releases).
1.  Unzip the archive, place the folder where it must remain and note its location for later.
1.  Open Chrome, click the `3 dots` in the top right, click `Extensions`, click `Manage Extensions`.
1.  In the top right, click `Developer Mode` then on the top left click `Load unpacked`.
1.  Navigate to the folder you extracted in step #3 then click `Select Folder`.

## Firefox Setup

Note: Firefox Temporary addon's will **not** remain after restarting Firefox, therefore;
it is very useful to keep addon storage after uninstall/restart with `keepStorageOnUninstall`.

1.  Build or Download a [Release](https://github.com/cssnr/open-links-in-new-tab/releases).
1.  Unzip the archive, place the folder where it must remain and note its location for later.
1.  Go to `about:debugging#/runtime/this-firefox` and click `Load Temporary Add-on...`
1.  Navigate to the folder you extracted earlier, select `manifest.json` then click `Select File`.
1.  Open `about:config` search for `extensions.webextensions.keepStorageOnUninstall` and set to `true`.

If you need to test a restart, you must pack the addon. This only works in ESR, Development, or Nightly.

1.  Run `npm run build:firefox` then use `web-ext-artifacts/name-firefox-version.zip`.
1.  Open `about:config` search for `xpinstall.signatures.required` and set to `false`.
1.  Open `about:addons` and drag the zip file to the page or choose Install from File from the Settings wheel.
