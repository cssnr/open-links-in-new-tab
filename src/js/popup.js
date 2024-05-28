// JS for popup.html

import {
    checkPerms,
    enableSite,
    grantPerms,
    saveOptions,
    showToast,
    toggleSite,
    updateOptions,
} from './export.js'

document.addEventListener('DOMContentLoaded', initPopup)
document.getElementById('toggle-site').onclick = toggleSiteClick
document.getElementById('enable-temp').onclick = enableTempClick
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

/**
 * Initialize Popup
 * TODO: Cleanup this function
 * @function initPopup
 */
async function initPopup() {
    console.debug('initPopup')
    const manifest = chrome.runtime.getManifest()
    document.getElementById('version').textContent = manifest.version
    document.getElementById('homepage_url').href = manifest.homepage_url

    await checkPerms()

    const { options, sites } = await chrome.storage.sync.get([
        'options',
        'sites',
    ])
    console.debug('options, sites:', options, sites)
    updateOptions(options)

    const [tab] = await chrome.tabs.query({ currentWindow: true, active: true })
    const url = new URL(tab.url)
    console.debug('tab, url:', tab, url)
    console.debug(`url.hostname: ${url.hostname}`)

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
    console.info(`Valid Site: ${url.hostname}`)
    const toggleSiteEl = document.getElementById('toggle-site')
    toggleSiteEl.disabled = false
    if (sites?.includes(url.hostname)) {
        toggleSiteEl.checked = true
        switchEl.classList.add('border-success')
    } else {
        document.getElementById('enable-temp').classList.remove('disabled')
    }

    if (chrome.runtime.lastError) {
        showToast(chrome.runtime.lastError.message, 'warning')
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
    const anchor = event.target.closest('a')
    const href = anchor.getAttribute('href').replace(/^\.+/g, '')
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
