// Content Script JS tab.js

chrome.storage.sync.get(['sites']).then((result) => {
    // console.log(result?.sites)
    if (result?.sites?.includes(window.location.host)) {
        console.log(`Enabled Host: ${window.location.host}`)
        updateLinks()
        chrome.runtime.sendMessage({ badgeText: 'On' }).then()
        const observer = new MutationObserver(function () {
            updateLinks()
        })
        observer.observe(document.body, { subTree: true, attributes: true })
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
