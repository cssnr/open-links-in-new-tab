// JS for oninstall.html

import { checkPerms } from './export.js'

document.addEventListener('DOMContentLoaded', domContentLoaded)
document.getElementById('grant-perms').addEventListener('click', grantPermsBtn)
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
 * Grant Permissions Button Click Callback
 * @function grantPermsBtn
 * @param {MouseEvent} event
 */
async function grantPermsBtn(event) {
    console.log('grantPermsBtn:', event)
    await chrome.permissions.request({
        origins: ['https://*/*', 'http://*/*'],
    })
    const hasPerms = await checkPerms()
    if (hasPerms) {
        chrome.runtime.openOptionsPage()
        window.close()
    }
}

function openOptions() {
    chrome.runtime.openOptionsPage()
    window.close()
}
