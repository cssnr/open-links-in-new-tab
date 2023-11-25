// JS Exports

/**
 * Save Options Callback
 * @function saveOptions
 * @param {InputEvent} event
 */
export async function saveOptions(event) {
    console.log('saveOptions:', event)
    let { options } = await chrome.storage.sync.get(['options'])
    options[event.target.id] = event.target.checked
    console.log(`Set: options[${event.target.id}]: ${options[event.target.id]}`)
    await chrome.storage.sync.set({ options })
}

/**
 * Update Options
 * @function initOptions
 * @param {Object} options
 */
export function updateOptions(options) {
    for (const [key, value] of Object.entries(options)) {
        const el = document.getElementById(key)
        if (el) {
            el.checked = value
        }
    }
}

/**
 * Get URL for Current Tab
 * @function toggleSite
 * @param {URL} url
 * @return {Boolean}
 */
export async function toggleSite(url) {
    console.log(`toggleSite: url.hostname: ${url.hostname}`, url)
    let added = false
    if (!url?.hostname) {
        return console.warn(`No url.hostname: ${url?.hostname}`, url)
    }
    const { sites } = await chrome.storage.sync.get(['sites'])
    if (!sites.includes(url.hostname)) {
        console.log(`Enabling Site: ${url.hostname}`)
        sites.push(url.hostname)
        added = true
    } else {
        console.log(`Disabling Site: ${url.hostname}`)
        sites.splice(sites.indexOf(url.hostname), 1)
    }
    console.log('sites:', sites)
    await chrome.storage.sync.set({ sites })
    return added
}

/**
 * Update Links for Tab
 * @function enableTemp
 * @param {chrome.tabs.Tab} tab
 * @param {String} color
 */
export async function enableTemp(tab, color = 'yellow') {
    console.log(`enableTemp: executeScript: tab.id: ${tab.id}`)
    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: updateLinks,
    })
    console.log('setBadgeText')
    await chrome.action.setBadgeText({
        tabId: tab.id,
        text: 'On',
    })
    console.log('setBadgeBackgroundColor')
    await chrome.action.setBadgeBackgroundColor({
        tabId: tab.id,
        color: color,
    })
}

/**
 * Update Links
 * TODO: Duplicated from tabs.js
 * @function updateLinks
 */
function updateLinks() {
    const elements = document.getElementsByTagName('a')
    for (const element of elements) {
        if (element.href !== '#') {
            element.target = '_blank'
            element.setAttribute('rel', 'nofollow')
        }
    }
    console.log('Links Updated.')
}
