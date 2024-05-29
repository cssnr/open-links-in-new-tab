// JS Content Script tab.js

let tabEnabled = false
let noOpener = false

;(async () => {
    const { options, sites } = await chrome.storage.sync.get([
        'options',
        'sites',
    ])
    noOpener = options.noOpener
    if (sites?.includes(window.location.host)) {
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
    const { options } = await chrome.storage.sync.get(['options'])
    const mutationObserverInit = {
        attributes: options.onAttributes,
        childList: true,
        subtree: true,
    }
    observer.observe(document.body, mutationObserverInit)
    if (options.onScroll) {
        console.debug('Enabling onScroll...')
        const processChange = debounce(updateLinks)
        document.addEventListener('scroll', processChange)
    }
}

/**
 * Update Links
 * @function updateLinks
 */
function updateLinks() {
    console.debug('Updating Links...')
    const elements = document.getElementsByTagName('a')
    for (const element of elements) {
        if (element.href !== '#') {
            if (element.target !== '_blank') {
                element.target = '_blank'
                if (noOpener) {
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
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
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
                const { options } = await chrome.storage.sync.get(['options'])
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
            if (oldValue.noOpener !== newValue.noOpener) {
                noOpener = newValue.noOpener
            }
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
