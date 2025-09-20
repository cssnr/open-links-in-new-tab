// JS for popup.html

import {
    checkPerms,
    enableSite,
    grantPerms,
    saveOptions,
    toggleSite,
    updateManifest,
    updateOptions,
} from './export.js'

chrome.storage.onChanged.addListener(onChanged)

document.addEventListener('DOMContentLoaded', initPopup)
document
    .getElementById('toggle-global')
    .addEventListener('change', toggleGlobalChange)
document
    .getElementById('toggle-site')
    .addEventListener('click', toggleSiteClick)
document
    .getElementById('enable-temp')
    .addEventListener('click', enableTempClick)
// noinspection JSCheckFunctionSignatures
document
    .querySelectorAll('.grant-permissions')
    .forEach((el) => el.addEventListener('click', (e) => grantPerms(e, true)))
document
    .querySelectorAll('a[href]')
    .forEach((el) => el.addEventListener('click', popupLinks))
document
    .querySelectorAll('#options-form input')
    .forEach((el) => el.addEventListener('change', saveOptions))
document
    .querySelectorAll('[data-bs-toggle="tooltip"]')
    .forEach((el) => new bootstrap.Tooltip(el))

// const globalSwitch = document.getElementById('global-switch')
const globalToggle = document.getElementById('toggle-global')
const siteSwitch = document.getElementById('site-switch')

/**
 * Initialize Popup
 * TODO: Cleanup this function
 * @function initPopup
 */
async function initPopup() {
    console.debug('initPopup')
    // noinspection ES6MissingAwait
    updateManifest()
    // noinspection ES6MissingAwait
    checkPerms()

    chrome.storage.sync.get(['options']).then((items) => {
        console.debug('options:', items.options)
        updateOptions(items.options)
        if (items.options.toggleGlobally) {
            // globalSwitch.classList.replace('border-secondary', 'border-success')
            globalToggle.checked = true
            globalToggle
                .closest('div.border')
                .classList.replace('border-secondary', 'border-success')
        }
    })

    const tabInfo = await checkTab()
    console.debug('tabInfo:', tabInfo)
    const url = new URL(tabInfo.tab?.url)
    console.debug('url:', url)
    if (url.hostname) {
        document.getElementById('site-hostname').textContent = url.hostname
    } else {
        siteSwitch.classList.add('border-danger-subtle')
        return console.log('%c Missing: url.hostname', 'color: Yellow')
    }

    console.info(`%c Valid Site: ${url.hostname}`, 'color: Lime')
    const toggleSiteInput = document.getElementById('toggle-site')
    toggleSiteInput.disabled = false
    const { sites } = await chrome.storage.sync.get(['sites'])
    console.debug('sites:', sites)
    if (sites?.includes(url.hostname)) {
        // Site is manually toggled ON
        toggleSiteInput.checked = true
        siteSwitch.classList.add('border-success')
    } else if (tabInfo.tabEnabled) {
        // Tab is enabled temporarily or globally here
        siteSwitch.classList.add('border-warning-subtle')
    } else {
        // Tab disabled by all means: not toggled, not temporary, not globally
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
    console.debug('popupLinks:', event)
    event.preventDefault()
    const href = event.currentTarget.getAttribute('href').replace(/^\.+/g, '')
    console.debug('href:', href)
    let url
    if (href.endsWith('html/options.html')) {
        chrome.runtime.openOptionsPage()
        return window.close()
    } else if (href.startsWith('http')) {
        url = href
    } else {
        url = chrome.runtime.getURL(href)
    }
    console.log('url:', url)
    await chrome.tabs.create({ active: true, url })
    return window.close()
}

/**
 * Toggle Global Change Callback
 * @function toggleGlobalChange
 * @param {MouseEvent} event
 */
async function toggleGlobalChange(event) {
    console.debug('toggleGlobalChange:', event)
    const enabled = await toggleGlobal()
    // event.target.checked = !event.target.checked
    event.target.checked = enabled
    console.debug('enabled:', enabled)
    if (enabled) {
        // globalSwitch.classList.replace('border-success', 'border-secondary')
        globalToggle
            .closest('div.border')
            .classList.replace('border-secondary', 'border-success')
    } else {
        // globalSwitch.classList.replace('border-secondary', 'border-success')
        globalToggle
            .closest('div.border')
            .classList.replace('border-success', 'border-secondary')
    }
    // window.close()
}

/**
 * Toggle Global Handler
 * @function toggleGlobal
 * @return {Promise<Boolean>}
 */
async function toggleGlobal() {
    console.debug('toggleGlobal')
    const { options } = await chrome.storage.sync.get(['options'])
    options.toggleGlobally = !options.toggleGlobally
    await chrome.storage.sync.set({ options })
    console.debug('options.toggleGlobally:', options.toggleGlobally)
    return options.toggleGlobally
}

/**
 * Enable/Disable Site Button Click Callback
 * @function toggleSiteClick
 * @param {MouseEvent} event
 */
async function toggleSiteClick(event) {
    console.debug('toggleSiteClick:', event)
    const [tab] = await chrome.tabs.query({ currentWindow: true, active: true })
    console.debug('tab:', tab)
    await toggleSite(tab)
    window.close()
}

/**
 * Enable Temporarily Button Click Callback
 * @function enableTempClick
 * @param {MouseEvent} event
 */
async function enableTempClick(event) {
    console.debug('enableTempClick:', event)
    const [tab] = await chrome.tabs.query({ currentWindow: true, active: true })
    console.debug('tab:', tab)
    await enableSite(tab, 'yellow')
    window.close()
}

/**
 * Check Tab Scripting
 * @function checkTab
 * @return {Promise<Object>}
 */
async function checkTab() {
    try {
        const [tab] = await chrome.tabs.query({
            currentWindow: true,
            active: true,
        })
        console.log('%c tab:', 'color: Aqua', tab)
        if (!tab?.id) {
            return console.log('%c NO tab.id', 'color: OrangeRed', tab)
        }
        console.log('%c tab.id:', 'color: Lime', tab.id)
        const response = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            injectImmediately: true,
            func: function () {
                // This returns as response[0]?.result
                console.log('inject: contentScript:', contentScript)
                return { contentScript, tabEnabled }
            },
        })
        console.log('response:', response)
        return { ...response[0]?.result, tab }
    } catch (e) {
        console.log(e)
    }
}

/**
 * On Changed Callback
 * @function onChanged
 * @param {Object} changes
 * @param {String} namespace
 */
function onChanged(changes, namespace) {
    // console.debug('onChanged:', changes, namespace)
    for (let [key, { newValue }] of Object.entries(changes)) {
        if (namespace === 'sync' && key === 'options') {
            updateOptions(newValue)
        }
    }
}
