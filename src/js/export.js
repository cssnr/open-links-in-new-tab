// JS Exports

/**
 * Get URL for Current Tab
 * @function toggleSite
 * @param {chrome.tabs.Tab} tab
 */
export async function toggleSite(tab) {
    const url = new URL(tab.url)
    console.debug(`toggleSite: url.hostname: ${url?.hostname}`, url)
    if (!url?.hostname) {
        return console.warn(`No url.hostname: ${url?.hostname}`, url)
    }
    const { sites } = await chrome.storage.sync.get(['sites'])
    if (!sites.includes(url.hostname)) {
        console.log(`Enabling Site: ${url.hostname}`)
        sites.push(url.hostname)
        await enableSite(tab, 'green')
    } else {
        console.log(`Disabling Site: ${url.hostname}`)
        sites.splice(sites.indexOf(url.hostname), 1)
        await chrome.action.setBadgeBackgroundColor({
            tabId: tab.id,
            color: 'red',
        })
    }
    console.debug('sites:', sites)
    await chrome.storage.sync.set({ sites })
}

/**
 * Show Enabled Site for Tab
 * @function enableSite
 * @param {chrome.tabs.Tab} tab
 * @param {String} color
 */
export async function enableSite(tab, color) {
    console.debug(`enableSite: ${color}`, tab)
    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        args: [color],
        func: function (color) {
            activateTab(color)
        },
    })
}

/**
 * Check Host Permissions
 * @function checkPerms
 * @return {Promise<*|Boolean>}
 */
export async function checkPerms() {
    const hasPerms = await chrome.permissions.contains({
        origins: ['https://*/*', 'http://*/*'],
    })
    console.debug('checkPerms:', hasPerms)
    // Firefox still uses DOM Based Background Scripts
    if (typeof document === 'undefined') {
        return hasPerms
    }
    const hasPermsEl = document.querySelectorAll('.has-perms')
    const grantPermsEl = document.querySelectorAll('.grant-perms')
    if (hasPerms) {
        hasPermsEl.forEach((el) => el.classList.remove('d-none'))
        grantPermsEl.forEach((el) => el.classList.add('d-none'))
    } else {
        grantPermsEl.forEach((el) => el.classList.remove('d-none'))
        hasPermsEl.forEach((el) => el.classList.add('d-none'))
    }
    return hasPerms
}

/**
 * Grant Permissions Click Callback
 * Promise from requestPerms is ignored so we can close the popup immediately
 * @function grantPerms
 * @param {MouseEvent} event
 * @param {Boolean=} close
 */
export async function grantPerms(event, close = false) {
    console.debug('grantPerms:', event)
    requestPerms()
    if (close) {
        window.close()
    }
}

/**
 * Request Host Permissions
 * @function requestPerms
 * @return {Promise<*|chrome.permissions.request>}
 */
export async function requestPerms() {
    return await chrome.permissions.request({
        origins: ['https://*/*', 'http://*/*'],
    })
}

/**
 * Permissions On Added Callback
 * @function onAdded
 * @param {Permissions} permissions
 */
export async function onAdded(permissions) {
    console.debug('onAdded', permissions)
    await checkPerms()
}

/**
 * Permissions On Removed Callback
 * @function onRemoved
 * @param {Permissions} permissions
 */
export async function onRemoved(permissions) {
    console.debug('onRemoved', permissions)
    await checkPerms()
}

/**
 * Save Options Callback
 * @function saveOptions
 * @param {InputEvent} event
 */
export async function saveOptions(event) {
    console.debug('saveOptions:', event)
    const { options } = await chrome.storage.sync.get(['options'])
    let value
    if (event.target.type === 'checkbox') {
        value = event.target.checked
        // // TODO: Placeholder until updateAll get fixed
        // if (event.target.id === 'updateAll') {
        //     console.log('nextElementSibling:', event.target.nextElementSibling)
        //     disableWarning(event.target.nextElementSibling, value)
        // }
    } else if (event.target.type === 'text') {
        value = event.target.value
    }
    if (value !== undefined) {
        options[event.target.id] = value
        console.info(`Set: ${event.target.id}:`, value)
        await chrome.storage.sync.set({ options })
    }
}

/**
 * Update Options
 * @function initOptions
 * @param {Object} options
 */
export function updateOptions(options) {
    console.log('updateOptions:', options)
    for (let [key, value] of Object.entries(options)) {
        // console.debug(`${key}: ${value}`)
        const el = document.getElementById(key)
        if (el) {
            if (typeof value === 'boolean') {
                el.checked = value
            } else if (typeof value === 'string') {
                el.value = value
            }
            if (el.dataset.reverse) {
                value = !!(value ^ !!el.dataset.reverse)
            }
            if (el.dataset.related) {
                hideShowElement(`#${el.dataset.related}`, value)
            }
            if (el.dataset.warning) {
                addWarningClass(
                    el.nextElementSibling,
                    value,
                    el.dataset.warning
                )
            }
        }
    }
}

/**
 * Hide or Show Element with JQuery
 * @function hideShowElement
 * @param {String} selector
 * @param {Boolean=} show
 * @param {String=} speed
 */
function hideShowElement(selector, show, speed = 'fast') {
    const element = $(`${selector}`)
    console.debug('hideShowElement:', show, element)
    if (show) {
        element.show(speed)
    } else {
        element.hide(speed)
    }
}

/**
 * Add Warning Class to Element
 * @function addWarningClass
 * @param {HTMLElement} element
 * @param {Boolean} value
 * @param {String} warning
 */
function addWarningClass(element, value, warning) {
    console.debug('hideShowElement:', value, element)
    if (value) {
        element.classList.add(warning)
    } else {
        element.classList.remove(warning)
    }
}

/**
 * Update DOM with Manifest Details
 * @function updateManifest
 */
export function updateManifest() {
    const manifest = chrome.runtime.getManifest()
    document
        .querySelectorAll('.version')
        .forEach((el) => (el.textContent = manifest.version))
    document
        .querySelectorAll('[href="homepage_url"]')
        .forEach((el) => (el.href = manifest.homepage_url))
}

/**
 * Show Bootstrap Toast
 * @function showToast
 * @param {String} message
 * @param {String} type
 */
export function showToast(message, type = 'success') {
    console.debug(`showToast: ${type}: ${message}`)
    const clone = document.querySelector('.d-none > .toast')
    const container = document.getElementById('toast-container')
    if (!clone || !container) {
        return console.warn('Missing clone or container:', clone, container)
    }
    const element = clone.cloneNode(true)
    element.querySelector('.toast-body').innerHTML = message
    element.classList.add(`text-bg-${type}`)
    container.appendChild(element)
    const toast = new bootstrap.Toast(element)
    element.addEventListener('mousemove', () => toast.hide())
    toast.show()
}
