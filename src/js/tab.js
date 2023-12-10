// JS Content Script tab.js

;(async () => {
    const { sites } = await chrome.storage.sync.get(['sites'])
    // console.log(`sites: ${window.location.host}`, sites)
    if (sites?.includes(window.location.host)) {
        console.log(`Enabled Host: ${window.location.host}`)
        updateLinks()
        await chrome.runtime.sendMessage({ badgeText: 'On' })
        const observer = new MutationObserver(function () {
            updateLinks()
        })
        observer.observe(document.body, { subTree: true, attributes: true })
    }
})()

chrome.runtime.onMessage.addListener(onMessage)

/**
 * Update Links
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

/**
 * Handle Messages
 * @function onMessage
 * @param {Object} message
 * @param {MessageSender} sender
 * @param {Function} sendResponse
 */
function onMessage(message, sender, sendResponse) {
    console.log('onMessage: message, sender:', message, sender)
    sendResponse(true)
}
