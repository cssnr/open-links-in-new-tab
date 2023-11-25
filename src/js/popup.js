// JS for popup.html

import {
    enableTemp,
    saveOptions,
    toggleSite,
    updateOptions,
} from './exports.js'

document.addEventListener('DOMContentLoaded', initPopup)

// document.getElementById('grant-perms').addEventListener('click', grantPermsBtn)

document.querySelectorAll('[data-href]').forEach((el) => {
    el.addEventListener('click', popupLink)
})

document
    .getElementById('toggle-site')
    .addEventListener('click', toggleSiteClick)

document
    .getElementById('enable-temp')
    .addEventListener('click', enableTempClick)

const formInputs = document.querySelectorAll('.form-control')
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
 * Popup Links Callback
 * because firefox needs us to call window.close() from the popup
 * @function popupLink
 * @param {MouseEvent} event
 */
async function popupLink(event) {
    console.log('popupLink: event:', event)
    let url
    const anchor = event.target.closest('a')
    if (anchor.dataset.href.startsWith('http')) {
        url = anchor.dataset.href
    } else {
        url = chrome.runtime.getURL(anchor.dataset.href)
    }
    console.log(`url: ${url}`)
    await chrome.tabs.create({ active: true, url })
    window.close()
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
