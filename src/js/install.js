// JS for install.html

import { checkPerms } from './exports.js'

document.addEventListener('DOMContentLoaded', initInstall)
document.getElementById('grant-perms').addEventListener('click', grantPermsBtn)
document.getElementById('open-options').addEventListener('click', openOptions)

/**
 * Initialize Install
 * @function initInstall
 */
async function initInstall() {
    console.log('initInstall')
    // const { options } = await chrome.storage.sync.get(['options'])
    // console.log('options:', options)
    await checkPerms()
}

/**
 * Grant Permissions Button Click Callback
 * @function grantPermsBtn
 * @param {MouseEvent} event
 */
function grantPermsBtn(event) {
    console.log('grantPermsBtn:', event)
    chrome.permissions.request(
        {
            origins: ['https://*/*', 'http://*/*'],
        },
        async (granted) => {
            if (granted) {
                await checkPerms()
                chrome.runtime.openOptionsPage()
                window.close()
            } else {
                console.warn('Permissions NOT Granted!')
            }
        }
    )
}

/**
 * Open Options Click Callback
 * @function openOptions
 * @param {MouseEvent} event
 */
function openOptions(event) {
    chrome.runtime.openOptionsPage()
    window.close()
}
