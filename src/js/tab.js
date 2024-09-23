// JS Content Script tab.js

const contentScript = true // eslint-disable-line no-unused-vars
let options = {}
let tabEnabled = false
let init = false

if (!chrome.storage.onChanged.hasListener(onChanged)) {
    // console.debug('Adding storage.onChanged Listener')
    chrome.storage.onChanged.addListener(onChanged)
}

;(async () => {
    const storage = await chrome.storage.sync.get(['options', 'sites'])
    console.debug('options, sites:', storage.options, storage.sites)
    options = storage.options
    if (storage.sites?.includes(window.location.host)) {
        console.log(`Enabled Host: ${window.location.host}`)
        await activateTab('green')
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
    if (!init) {
        await tabInit()
    }
    console.info('Activating Tab...')
    tabEnabled = true
    // updateLinks()
    // const observer = new MutationObserver(updateLinks)
    // observer.observe(document.body, {
    //     attributes: options.onAttributes,
    //     childList: true,
    //     subtree: true,
    // })
    // if (options.onScroll) {
    //     console.debug('Enabling onScroll...')
    //     const processChange = debounce(updateLinks)
    //     document.addEventListener('scroll', processChange)
    // }
}

async function tabInit() {
    console.debug('tabInit')
    init = true
    updateLinks()
    // const { options } = await chrome.storage.sync.get(['options'])
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
            element.addEventListener('click', clickLink)
            // // This is moved to clickLinks
            // if (!items.options.anchorLinks && element.href.includes('#')) {
            //     const url = new URL(element.href)
            //     if (url.origin === window.location.origin) {
            //         continue
            //     }
            // }
            // // This is going to be removed
            // if (element.target !== '_blank') {
            //     element.target = '_blank'
            //     if (items.options.noOpener) {
            //         element.setAttribute('rel', 'noopener')
            //     }
            // }
        }
    }
}

/**
 * New Click Handler for Updated Links
 * TODO: Move All Options Here
 * @function clickLink
 * @param event
 */
function clickLink(event) {
    console.debug('clickLink:', event)
    const target = event.currentTarget
    // console.log('debug:', target)
    if (!tabEnabled) {
        return console.debug('%c Tab NOT Enabled!', 'color: Yellow')
    }
    if (event.handled) {
        return console.debug('return on event.handled')
    }

    if (!options.anchorLinks && target.href.includes('#')) {
        const url = new URL(target.href)
        console.debug('url:', url)
        if (url.origin === window.location.origin) {
            return console.debug('return on options.anchorLinks')
        }
    }

    event.preventDefault()
    if (options.openBackground) {
        console.log('options.openBackground:', options.openBackground)
        const e = new MouseEvent('click', {
            ctrlKey: true,
            metaKey: true,
        })
        e.handled = true
        target.dispatchEvent(e)
        return
    }
    console.log('target.href:', target.href)
    const features = []
    if (options.noOpener) {
        features.push(`noopener=true`)
    }
    if (options.noReferrer) {
        features.push(`noreferrer=true`)
    }
    console.log('features:', features.join(','))
    window.open(target.href, '_blank', features.join(','))
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
            await processSitesUpdate(newValue)
        }
        if (namespace === 'sync' && key === 'options') {
            options = newValue
        }
    }
}

/**
 * Process Sites Changes if Update ALl is Enabled
 * @function processSitesUpdate
 * @param sites
 * @return {Promise<void>}
 */
async function processSitesUpdate(sites) {
    if (sites?.includes(window.location.host)) {
        await activateTab('green')
        tabEnabled = true
    } else {
        console.log(`Disabling: ${window.location.host}`)
        await chrome.runtime.sendMessage({ badgeText: '' })
        tabEnabled = false
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
