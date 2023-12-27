// JS Content Script tab.js

;(async () => {
    const { sites } = await chrome.storage.sync.get(['sites'])
    console.debug(`sites: ${window.location.host}`, sites)
    if (sites?.includes(window.location.host)) {
        console.log(`Enabled Host: ${window.location.host}`)
        await activateTab('green')
    }
    if (!chrome.storage.onChanged.hasListener(onChanged)) {
        console.log('Adding onChanged Listener')
        chrome.storage.onChanged.addListener(onChanged)
    }
})()

let tabEnabled = false

/**
 * Activate Tab
 * @function activateTab
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
    const observer = new MutationObserver(function () {
        updateLinks()
    })
    observer.observe(document.body, {
        attributes: true,
        childList: true,
        subTree: true,
    })
    const { options } = await chrome.storage.sync.get(['options'])
    if (options.onScroll) {
        console.debug('Enabling onScroll...')
        const processChange = debounce(() => updateLinks())
        document.addEventListener('scroll', processChange)
    }
}

/**
 * Update Links
 * @function updateLinks
 */
function updateLinks() {
    console.log('Updating Links...')
    const elements = document.getElementsByTagName('a')
    for (const element of elements) {
        if (element.href !== '#') {
            element.target = '_blank'
            element.setAttribute('rel', 'nofollow')
        }
    }
}

/**
 * DeBounce Function
 * @function debounce
 * @param {Function} func
 * @param {Number} timeout
 */
function debounce(func, timeout = 300) {
    let timer
    return (...args) => {
        clearTimeout(timer)
        timer = setTimeout(() => {
            func.apply(this, args)
        }, timeout)
    }
}

/**
 * On Changed Callback
 * @function onChanged
 * @param {Object} changes
 * @param {String} namespace
 */
async function onChanged(changes, namespace) {
    console.debug('onChanged:', changes, namespace)
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
                const { options } = await chrome.storage.sync.get(['options'])
                if (options.autoReload) {
                    console.debug('options.autoReload enabled')
                    window.location.reload()
                } else {
                    // TODO: Determine why this is not working...
                    await chrome.runtime.sendMessage({
                        badgeColor: 'red',
                    })
                    tabEnabled = false
                }
            }
        }
    }
}
