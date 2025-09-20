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
    const items = await chrome.storage.sync.get(['options', 'sites'])
    console.debug('options, sites:', items.options, items.sites)
    options = items.options
    if (items.sites?.includes(window.location.host)) {
        console.log(`Enabled Host: ${window.location.host}`)
        await activateTab('green')
    }
    if (options.toggleGlobally) {
        tabInit()
        tabEnabled = true
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
    console.info('Activating Tab...')
    tabInit()
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

function tabInit() {
    if (init) {
        return console.debug('%c Already tabInit', 'color: Yellow')
    }
    init = true
    console.debug('%c Performing tabInit', 'color: Lime')
    updateLinks()
    let observer
    if (options.oldObserver) {
        console.debug('%c MutationObserver: updateLinks', 'color: Orange')
        observer = new MutationObserver(updateLinks)
    } else {
        console.debug('%c MutationObserver: mutationObserver', 'color: Lime')
        observer = new MutationObserver(mutationObserver)
    }
    observer.observe(document.body, {
        attributes: options.onAttributes,
        childList: true,
        subtree: true,
    })
    // if (options.onScroll) {
    console.debug('addEventListener: onScroll')
    const processChange = debounce(onScroll)
    document.addEventListener('scroll', processChange)
    // }
}

function onScroll() {
    if (options.onScroll) {
        updateLinks()
    }
}

function mutationObserver(mutationList) {
    // console.debug('mutationList:', mutationList)
    for (const mutation of mutationList) {
        console.debug('%c mutation:', 'color: Aqua', mutation)
        mutation.addedNodes.forEach((el) => {
            // console.debug('el:', el)
            const links = findLinks(el)
            // console.debug('links:', links)
            console.debug('%c findLinks:', 'color: Yellow', links)
            for (const link of links) {
                console.debug(
                    '%c mutationObserver: addEventListener:',
                    'color: Lime',
                    link
                )
                link.addEventListener('click', clickLink)
            }
        })
    }
}

/**
 * Update Links
 * TODO: A Real Mutation Observer is a Work in Progress
 * @function updateLinks
 */
function updateLinks() {
    console.debug('Updating All Links...')
    // const elements = document.getElementsByTagName('a')
    const links = findLinks(document)
    console.debug('links:', links)
    for (const el of links) {
        if (el.href !== '#') {
            // console.debug('updateLinks: addEventListener:', el)
            el.addEventListener('click', clickLink)
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
 * Recursively Find Links from shadowRoot
 * @function findLinks
 * @param {Document|ShadowRoot} root
 * @return {Object[]}
 */
function findLinks(root) {
    // console.debug('findLinks:', root)
    const links = []
    if (root.querySelectorAll) {
        root.querySelectorAll('a, area').forEach((el) => {
            links.push(el)
        })
    }
    const roots = Array.from(root.querySelectorAll('*')).filter(
        (el) => el.shadowRoot
    )
    roots.forEach((el) => {
        links.push(...findLinks(el.shadowRoot))
    })
    return links
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
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
        console.debug('oldValue, newValue:', oldValue, newValue)
        if (namespace === 'sync' && key === 'sites') {
            // console.debug('newValue:', newValue)
            await processSitesUpdate(newValue)
        }
        if (namespace === 'sync' && key === 'options') {
            options = newValue
            // if (oldValue.onScroll !== newValue.onScroll) {
            //     if (newValue.onScroll) {
            //     } else {
            //     }
            // }
            if (options.toggleGlobally) {
                tabInit()
                tabEnabled = true
            } else {
                tabEnabled = false
            }
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
function debounce(fn, timeout = 250) {
    let timeoutID
    return (...args) => {
        clearTimeout(timeoutID)
        timeoutID = setTimeout(() => fn(...args), timeout)
    }
}
