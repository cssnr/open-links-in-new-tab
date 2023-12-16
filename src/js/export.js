// JS Exports

/**
 * Get URL for Current Tab
 * @function toggleSite
 * @param {chrome.tabs.Tab} tab
 */
export async function toggleSite(tab) {
    const url = new URL(tab.url)

    console.log(`toggleSite: url.hostname: ${url.hostname}`, url)
    if (!url?.hostname) {
        return console.log(`No url.hostname: ${url?.hostname}`, url)
    }
    const { sites } = await chrome.storage.sync.get(['sites'])
    if (!sites.includes(url.hostname)) {
        console.log(`Enabling Site: ${url.hostname}`)
        sites.push(url.hostname)
        await enableSite(tab, 'green')
    } else {
        console.log(`Disabling Site: ${url.hostname}`)
        sites.splice(sites.indexOf(url.hostname), 1)
        const { options } = await chrome.storage.sync.get(['options'])
        if (options.autoReload) {
            await reloadTab(tab)
        }
    }
    console.log('sites:', sites)
    await chrome.storage.sync.set({ sites })
}

export async function enableSite(tab, color = 'green') {
    console.log(`enableSite: ${color}`, tab)
    console.log(5)
    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: function () {
            activateTab()
        },
    })
    console.log(6)
    await chrome.runtime.sendMessage({
        badgeText: 'On',
        badgeColor: color,
        tabId: tab.id,
    })
    console.log(7)
}

/**
 * Reload Tab
 * @function reloadTab
 * @param {chrome.tabs.Tab} tab
 */
export async function reloadTab(tab) {
    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: function () {
            window.location.reload()
        },
    })
}

/**
 * Check Host Permissions
 * @function checkPerms
 * @return {Boolean}
 */
export async function checkPerms() {
    const hasPermsEl = document.querySelectorAll('.has-perms')
    const grantPermsEl = document.querySelectorAll('.grant-perms')
    const hasPerms = await chrome.permissions.contains({
        origins: ['https://*/*', 'http://*/*'],
    })
    console.log('checkPerms:', hasPerms)
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
    console.log('saveOptions:', event)
    const { options } = await chrome.storage.sync.get(['options'])
    let value
    if (event.target.type === 'checkbox') {
        value = event.target.checked
    } else if (event.target.type === 'text') {
        value = event.target.value
    }
    if (value !== undefined) {
        options[event.target.id] = value
        console.log(`Set: ${event.target.id}:`, value)
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
        // console.log(`${key}: ${value}`)
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
