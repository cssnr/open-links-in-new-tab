// JS for oninstall.html

import { checkPerms, onRemoved, grantPerms } from './export.js'

chrome.permissions.onAdded.addListener(onAdded)
chrome.permissions.onRemoved.addListener(onRemoved)

document.addEventListener('DOMContentLoaded', domContentLoaded)
document
    .querySelectorAll('.open-options')
    .forEach((el) => el.addEventListener('click', openOptions))
document
    .querySelectorAll('.grant-permissions')
    .forEach((el) => el.addEventListener('click', grantPerms))
document
    .querySelectorAll('[data-bs-toggle="tooltip"]')
    .forEach((el) => new bootstrap.Tooltip(el))

/**
 * DOMContentLoaded
 * @function domContentLoaded
 */
async function domContentLoaded() {
    await checkPerms()
}

/**
 * Permissions On Added Callback
 * @param permissions
 */
async function onAdded(permissions) {
    console.debug('onAdded', permissions)
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
    console.debug('openOptions:', event)
    event.preventDefault()
    chrome.runtime.openOptionsPage()
    window.close()
}
