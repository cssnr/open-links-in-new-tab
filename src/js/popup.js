// JS for popup.html

import {
    checkPerms,
    enableTemp,
    saveOptions,
    toggleSite,
    updateOptions,
} from './export.js'

document.addEventListener('DOMContentLoaded', initPopup)

document
    .querySelectorAll('[data-href]')
    .forEach((el) => el.addEventListener('click', popupLinks))
document
    .querySelectorAll('#options-form input')
    .forEach((el) => el.addEventListener('change', saveOptions))

document.getElementById('grant-perms').addEventListener('click', grantPermsBtn)
document.getElementById('toggle-site').onclick = toggleSiteClick
document.getElementById('enable-temp').onclick = enableTempClick

/**
 * Initialize Popup
 * TODO: Cleanup this function
 * @function initPopup
 */
async function initPopup() {
    console.log('initPopup')
    const hasPerms = await checkPerms()
    if (!hasPerms) {
        document
            .getElementById('toggle-site-label')
            .classList.add('visually-hidden')
    }
    const { options, sites } = await chrome.storage.sync.get([
        'options',
        'sites',
    ])
    console.log('options, sites:', options, sites)
    updateOptions(options)
    document.getElementById('version').textContent =
        chrome.runtime.getManifest().version

    const [tab] = await chrome.tabs.query({ currentWindow: true, active: true })
    const url = new URL(tab.url)
    console.log('tab, url:', tab, url)
    console.log(`url.hostname: ${url.hostname}`)

    if (!url.hostname) {
        // url.hostname is used to add to the sites array
        return console.warn('No url.hostname from tab:', tab, url)
    }
    if (tab.status !== 'complete') {
        // TODO: This just means we cant check content script...
        return console.warn(`Tab Not Loaded: ${tab.status}`)
    }

    document.getElementById('site-hostname').textContent = url.hostname

    let response
    try {
        response = await chrome.tabs.sendMessage(tab.id, 'tab')
    } catch (error) {
        console.log(error)
        response = false
    }
    console.log('response:', response)

    const toggleSiteEl = document.getElementById('toggle-site')
    const enableTempEl = document.getElementById('enable-temp')
    const switchEl = document.getElementById('switch')
    if (response) {
        console.log(`Valid Site: ${url.hostname}`)
        toggleSiteEl.disabled = false
        if (sites?.includes(url.hostname)) {
            console.log('ENABLED')
            toggleSiteEl.checked = true
            switchEl.classList.add('border-success')
        } else {
            console.log('DISABLED')
            enableTempEl.classList.remove('disabled')
        }
    } else {
        console.log(`INVALID Site: ${url.hostname}`)
        switchEl.classList.add('border-danger-subtle')
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
    let url
    if (anchor?.dataset?.href.startsWith('http')) {
        url = anchor.dataset.href
    } else if (anchor?.dataset?.href === 'homepage') {
        url = chrome.runtime.getManifest().homepage_url
    } else if (anchor?.dataset?.href === 'options') {
        chrome.runtime.openOptionsPage()
        return window.close()
    } else if (anchor?.dataset?.href) {
        url = chrome.runtime.getURL(anchor.dataset.href)
    }
    console.log('url:', url)
    if (!url) {
        return console.error('No dataset.href for anchor:', anchor)
    }
    await chrome.tabs.create({ active: true, url })
    return window.close()
}

/**
 * Grant Permissions Button Click Callback
 * @function grantPerms
 * @param {MouseEvent} event
 */
function grantPermsBtn(event) {
    console.log('grantPermsBtn:', event)
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
    let { options, sites } = await chrome.storage.sync.get(['options', 'sites'])
    console.log('options, sites:', options, sites)
    const [tab] = await chrome.tabs.query({ currentWindow: true, active: true })
    console.log('tab:', tab)
    const added = await toggleSite(new URL(tab.url))
    if (added) {
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['/js/tab.js'],
        })
    } else if (options.autoReload) {
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: function () {
                window.location.reload()
            },
        })
    }
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
    await enableTemp(tab)
    window.close()
}
