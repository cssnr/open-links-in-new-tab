// JS Content Script tab.js

const contentScript = true // eslint-disable-line no-unused-vars
let tabEnabled = false
let options = {}

;(async () => {
    let data = await chrome.storage.sync.get(['options', 'sites'])
    options = data.options
    if (data.sites?.includes(window.location.host)) {
        console.log(`Enabled Host: ${window.location.host}`)
        await activateTab('green')
    }
    // TODO: Always enable onChanged and refactor to work with options.updateAll
    if (options.updateAll && !chrome.storage.onChanged.hasListener(onChanged)) {
        chrome.storage.onChanged.addListener(onChanged)
    }
})()

/**
 * Activate Tab
 * @function activateTab
 * @param {String} color
 */
async function activateTab(color) {
    // await chrome.runtime.sendMessage({ badgeText: 'On' })
    console.debug(`activateTab: color: ${color}`)
    await chrome.runtime.sendMessage({
        badgeText: 'On',
        badgeColor: color,
    })
    if (tabEnabled) {
        return console.info('Tab Already Enabled!')
    }
    console.info('Activating Tab...')
    tabEnabled = true
    updateLinks()
    const observer = new MutationObserver(updateLinks)
    observer.observe(document.body, {
        attributes: options.onAttributes,
        childList: true,
        subtree: true,
    })
    if (options.onScroll) {
        console.debug('Enabling onScroll...')
        const processChange = debounce(updateLinks)
        document.addEventListener('scroll', processChange)
    }
}

/**
 * Update Links
 * TODO: A Real Mutation Observer is a Work in Progress
 * @function updateLinks
 */
function updateLinks() {
    console.debug('Updating Links...')
    const elements = document.getElementsByTagName('a')
    for (const element of elements) {
        if (element.href !== '#') {
            if (!options.anchorLinks && element.href.includes('#')) {
                const url = new URL(element.href)
                if (url.origin === window.location.origin) {
                    continue
                }
            }
            if (element.target !== '_blank') {
                element.target = '_blank'
                if (options.noOpener) {
                    element.setAttribute('rel', 'noopener')
                }
            }
        }
    }
}

/**
 * On Changed Callback
 * @function onChanged
 * @param {Object} changes
 * @param {String} namespace
 */
async function onChanged(changes, namespace) {
    // console.debug('onChanged:', changes, namespace)
    for (let [key, { newValue }] of Object.entries(changes)) {
        if (namespace === 'sync' && key === 'sites') {
            // console.debug('newValue:', newValue)
            if (newValue?.includes(window.location.host)) {
                if (!tabEnabled) {
                    console.log(`Enabling: ${window.location.host}`)
                    await activateTab('green')
                } else {
                    await chrome.runtime.sendMessage({ badgeColor: 'green' })
                }
            } else if (tabEnabled) {
                console.log(`Disabling: ${window.location.host}`)
                if (options.autoReload) {
                    window.location.reload()
                } else {
                    await chrome.runtime.sendMessage({
                        badgeColor: 'red',
                    })
                    tabEnabled = false
                }
            }
        } else if (namespace === 'sync' && key === 'options') {
            options = newValue
        }
    }
}

/**
 * DeBounce Function
 * @function debounce
 * @param {Function} fn
 * @param {Number} timeout
 */
function debounce(fn, timeout = 300) {
    let timeoutID
    return (...args) => {
        clearTimeout(timeoutID)
        timeoutID = setTimeout(() => fn(...args), timeout)
    }
}
