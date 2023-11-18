// JS Exports

/**
 * Create Context Menus
 * @function createContextMenus
 */
export function createContextMenus() {
    const ctx = ['page', 'link']
    const contexts = [
        [ctx, 'toggle', 'Toggle Current Domain'],
        [ctx, 'temp', 'Enable Temporarily'],
        [ctx, 'separator', 'separator'],
        [ctx, 'options', 'Open Options'],
    ]
    for (const context of contexts) {
        if (context[1] === 'separator') {
            chrome.contextMenus.create({
                type: context[1],
                contexts: context[0],
                id: context[2],
            })
        } else {
            chrome.contextMenus.create({
                title: context[2],
                contexts: context[0],
                id: context[1],
            })
        }
    }
}

/**
 * Get URL for Current Tab
 * @function toggleSite
 * @param {URL} url
 * @return {Boolean} True if Added
 */
export async function toggleSite(url) {
    console.log(`toggleSite: url.hostname: ${url.hostname}`, url)
    let added = false
    if (!url?.hostname) {
        return console.warn(`No url.hostname: ${url?.hostname}`, url)
    }
    const { options } = await chrome.storage.sync.get(['options'])
    options.sites = options.sites || []
    if (!options.sites.includes(url.hostname)) {
        console.log(`Enabling Site: ${url.hostname}`)
        options.sites.push(url.hostname)
        added = true
    } else {
        console.log(`Disabling Site: ${url.hostname}`)
        options.sites.splice(options.sites.indexOf(url.hostname), 1)
    }
    console.log('options.sites:', options.sites)
    await chrome.storage.sync.set({ options })
    return added
}

/**
 * Update Links for Tab
 * @function enableTemp
 * @param {Tab} tab
 * @param {String} color Background Color for BadgeText
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
