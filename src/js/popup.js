// JS for popup.html

import {
    enableTemp,
    saveOptions,
    toggleSite,
    updateOptions,
} from './exports.js'

document.addEventListener('DOMContentLoaded', initPopup)

// document.getElementById('grant-perms').addEventListener('click', grantPermsBtn)

const popupLinks = document.querySelectorAll('[data-href]')
popupLinks.forEach((el) => el.addEventListener('click', popLinks))

document.getElementById('toggle-site').onclick = toggleSiteClick
document.getElementById('enable-temp').onclick = enableTempClick

const formInputs = document.querySelectorAll('.options')
formInputs.forEach((el) => el.addEventListener('change', saveOptions))

/**
 * Initialize Popup
 * @function initPopup
 */
async function initPopup() {
    console.log('initPopup')
    const { options, sites } = await chrome.storage.sync.get([
        'options',
        'sites',
    ])
    console.log('options, sites:', options, sites)
    const [tab] = await chrome.tabs.query({ currentWindow: true, active: true })
    const url = new URL(tab.url)
    console.log(tab, url)
    console.log(`url.hostname: ${url.hostname}`)
    if (url.toString().startsWith('http')) {
        document.getElementById('site-hostname').textContent =
            url.hostname.substring(0, 36)
        if (sites?.includes(url.hostname)) {
            document.getElementById('toggle-site').checked = true
            document.getElementById('enable-temp').classList.add('disabled')
            document
                .getElementById('site-switch')
                .classList.add('border-success')
        }
    } else {
        document.getElementById('toggle-site').disabled = true
    }
    updateOptions(options)
}

/**
 * Popup Links Click Callback
 * Firefox requires a call to window.close()
 * @function popLinks
 * @param {MouseEvent} event
 */
async function popLinks(event) {
    console.log('popLinks:', event)
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

// /**
//  * Grant Permissions Button Click Callback
//  * @function grantPerms
//  * @param {MouseEvent} event
//  */
// function grantPermsBtn(event) {
//     console.log('permissions click:', event)
//     chrome.permissions.request({
//         origins: ['https://*/*', 'http://*/*'],
//     })
//     window.close()
// }

/**
 * Enable/Disable Site Button Click Callback
 * @function toggleSiteClick
 * @param {MouseEvent} event
 */
async function toggleSiteClick(event) {
    console.log('toggleSiteBtn:', event)
    chrome.permissions.request({
        origins: ['https://*/*', 'http://*/*'],
    })
    const hasPerms = await chrome.permissions.contains({
        origins: ['https://*/*', 'http://*/*'],
    })
    if (!hasPerms) {
        console.log('Requesting Permissions...')
        return window.close()
    }
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
