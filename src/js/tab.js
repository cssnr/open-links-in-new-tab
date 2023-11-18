// Content Script JS tab.js

chrome.storage.sync.get(['options']).then((result) => {
    console.log(result?.options?.sites)
    if (result?.options?.sites?.includes(window.location.host)) {
        console.log(`ENABLED: ${window.location.host}`)
        chrome.runtime.sendMessage({ badgeText: 'On' })
        updateLinks()
        const observer = new MutationObserver(function () {
            updateLinks()
        })
        observer.observe(document.body, { subTree: true, attributes: true })
    } else {
        console.log(`DISABLED: ${window.location.host}`)
    }
})

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
