// JS for oninstall.html

import { checkPerms } from './export.js'

document.addEventListener('DOMContentLoaded', domContentLoaded)
document.getElementById('grant-perms').addEventListener('click', grantPerms)
document.getElementById('open-options').addEventListener('click', openOptions)

/**
 * DOMContentLoaded
 * @function domContentLoaded
 */
async function domContentLoaded() {
    console.log('DOMContentLoaded')
    await checkPerms()
}

/**
 * Grant Permissions Click Callback
 * @function grantPerms
 * @param {MouseEvent} event
 */
async function grantPerms(event) {
    console.log('grantPerms:', event)
    await chrome.permissions.request({
        origins: ['https://*/*', 'http://*/*'],
    })
    const hasPerms = await checkPerms()
    if (hasPerms) {
        chrome.runtime.openOptionsPage()
        window.close()
    }
}

/**
 * Open Options Click Callback
 * @function openOptions
 * @param {MouseEvent} event
 */
function openOptions(event) {
    console.log('openOptions:', event)
    event.preventDefault()
    chrome.runtime.openOptionsPage()
    window.close()
}
