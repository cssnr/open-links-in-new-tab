// JS for options.html and popup.html

document.querySelectorAll('[data-locale]').forEach((el) => {
    if (el.dataset.locale?.toString() === 'version') {
        el.innerText = chrome.runtime.getManifest().version
    }
    // } else if (el.dataset.locale) {
    //     const value = chrome.i18n.getMessage(el.dataset.locale)
    //     if (value) {
    //         el.innerText = value
    //     } else {
    //         console.warn(`Value Not Found for ${el.dataset.locale}`)
    //     }
    // }
})
