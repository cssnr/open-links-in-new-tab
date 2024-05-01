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
    }
    console.debug('sites:', sites)
    await chrome.storage.sync.set({ sites })
}

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
 * Grant Permissions Click Callback
 * Shared with Options and Home
 * @function grantPerms
 * @param {MouseEvent} event
 */
export async function grantPerms(event) {
    console.debug('grantPerms:', event)
    await requestPerms()
    await checkPerms()
}

/**
 * Request Host Permissions
 * @function requestPerms
 * @return {chrome.permissions.request}
 */
export async function requestPerms() {
    return await chrome.permissions.request({
        origins: ['https://*/*', 'http://*/*'],
    })
}

/**
 * Check Host Permissions
 * @function checkPerms
 * @return {Boolean}
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
    for (const [key, value] of Object.entries(options)) {
        // console.debug(`${key}: ${value}`)
        const el = document.getElementById(key)
        if (el) {
            if (typeof value === 'boolean') {
                el.checked = value
            } else if (typeof value === 'string') {
                el.value = value
            }
        }
    }
}

/**
 * Show Bootstrap Toast
 * @function showToast
 * @param {String} message
 * @param {String} type
 */
export function showToast(message, type = 'success') {
    console.log(`showToast: ${type}:`, message)
    const element = document.querySelector('.d-none > .toast').cloneNode(true)
    element.addEventListener('mousemove', () => toast.hide())
    element.classList.add(`text-bg-${type}`)
    element.querySelector('.toast-body').innerHTML = message
    document.getElementById('toast-container').appendChild(element)
    const toast = new bootstrap.Toast(element)
    toast.show()
}
