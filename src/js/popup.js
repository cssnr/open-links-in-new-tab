// JS for popup.html

import {
    checkPerms,
    enableSite,
    saveOptions,
    toggleSite,
    updateOptions,
} from './export.js'

document.addEventListener('DOMContentLoaded', initPopup)

document
    .querySelectorAll('a[href]')
    .forEach((el) => el.addEventListener('click', popupLinks))
document
    .querySelectorAll('#options-form input')
    .forEach((el) => el.addEventListener('change', saveOptions))

document.getElementById('grant-perms').onclick = grantPerms
document.getElementById('toggle-site').onclick = toggleSiteClick
document.getElementById('enable-temp').onclick = enableTempClick

document
    .querySelectorAll('[data-bs-toggle="tooltip"]')
    .forEach((el) => new bootstrap.Tooltip(el))

/**
 * Initialize Popup
 * TODO: Cleanup this function
 * @function initPopup
 */
async function initPopup() {
    console.log('initPopup')
    document.getElementById('version').textContent =
        chrome.runtime.getManifest().version
    document.getElementById('homepage_url').href =
        chrome.runtime.getManifest().homepage_url

    await checkPerms()

    const { options, sites } = await chrome.storage.sync.get([
        'options',
        'sites',
    ])
    console.log('options, sites:', options, sites)
    updateOptions(options)

    const [tab] = await chrome.tabs.query({ currentWindow: true, active: true })
    const url = new URL(tab.url)
    console.log('tab, url:', tab, url)
    console.log(`url.hostname: ${url.hostname}`)

    if (!url.hostname) {
        return console.log('No url.hostname for tab:', tab, url)
    }
    document.getElementById('site-hostname').textContent = url.hostname
    const switchEl = document.getElementById('switch')
    try {
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            injectImmediately: true,
            func: function () {
                return true
            },
        })
    } catch (e) {
        switchEl.classList.add('border-danger-subtle')
        return console.log(`url.hostname: ${url.hostname}`, e)
    }
    console.log(`Valid Site: ${url.hostname}`)
    const toggleSiteEl = document.getElementById('toggle-site')
    toggleSiteEl.disabled = false
    if (sites?.includes(url.hostname)) {
        toggleSiteEl.checked = true
        switchEl.classList.add('border-success')
    } else {
        document.getElementById('enable-temp').classList.remove('disabled')
    }
}

/**
 * Popup Links Click Callback
 * Firefox requires a call to window.close()
 * @function popupLinks
 * @param {MouseEvent} event
 */
async function popupLinks(event) {
    console.log('popupLinks:', event)
    event.preventDefault()
    const anchor = event.target.closest('a')
    console.log(`anchor.href: ${anchor.href}`)
    let url
    if (anchor.href.endsWith('html/options.html')) {
        chrome.runtime.openOptionsPage()
        return window.close()
    } else if (anchor.href.startsWith('http')) {
        url = anchor.href
    } else {
        url = chrome.runtime.getURL(anchor.href)
    }
    console.log('url:', url)
    await chrome.tabs.create({ active: true, url })
    return window.close()
}

/**
 * Grant Permissions Button Click Callback
 * @function grantPerms
 * @param {MouseEvent} event
 */
function grantPerms(event) {
    console.log('grantPerms:', event)
    chrome.permissions.request({
        origins: ['https://*/*', 'http://*/*'],
    })
    window.close()
}

/**
 * Enable/Disable Site Button Click Callback
 * @function toggleSiteClick
 * @param {MouseEvent} event
 */
async function toggleSiteClick(event) {
    console.log('toggleSiteBtn:', event)
    // let { options } = await chrome.storage.sync.get(['options'])
    // console.log('options:', options)
    const [tab] = await chrome.tabs.query({ currentWindow: true, active: true })
    console.log('tab:', tab)
    await toggleSite(tab)
    window.close()
}

/**
 * Enable Temporarily Button Click Callback
 * @function enableTempClick
 * @param {MouseEvent} event
 */
async function enableTempClick(event) {
    console.log('enableTemp:', event)
    const [tab] = await chrome.tabs.query({ currentWindow: true, active: true })
    console.log('tab:', tab)
    await enableSite(tab, 'yellow')
    window.close()
}
