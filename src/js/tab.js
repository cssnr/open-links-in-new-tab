// JS Content Script tab.js

;(async () => {
    const { sites } = await chrome.storage.sync.get(['sites'])
    // console.log(`sites: ${window.location.host}`, sites)
    if (sites?.includes(window.location.host)) {
        console.log(`Enabled Host: ${window.location.host}`)
        await activateTab('green')
    }
})()

let tabEnabled = false

/**
 * Activate Tab
 * @function activateTab
 */
async function activateTab(color) {
    // await chrome.runtime.sendMessage({ badgeText: 'On' })
    console.log(`activateTab: color: ${color}`)
    await chrome.runtime.sendMessage({
        badgeText: 'On',
        badgeColor: color,
    })
    if (tabEnabled) {
        return console.log('Tab Already Enabled...')
    }
    tabEnabled = true
    console.log('Activating Tab...')
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
        console.log('onScroll Enabled')
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
