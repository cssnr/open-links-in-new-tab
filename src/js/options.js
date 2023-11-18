// JS for options.html

import { createContextMenus } from './exports.js'

document.addEventListener('DOMContentLoaded', initOptions)
document.getElementById('options-form').addEventListener('submit', saveOptions)
document.getElementById('autoReload').addEventListener('change', updateOptions)

/**
 * Options Page Init
 * @function initOptions
 */
async function initOptions() {
    console.log('initOptions')
    const { options } = await chrome.storage.sync.get(['options'])
    console.log('options:', options)
    document.getElementById('autoReload').checked = options.autoReload
    document.getElementById('contextMenu').checked = options.contextMenu
    document.getElementById('showUpdate').checked = options.showUpdate
    const commands = await chrome.commands.getAll()
    document.getElementById('mainKey').textContent =
        commands.find((x) => x.name === '_execute_action').shortcut || 'Not Set'
    document.getElementById('toggleSite').textContent =
        commands.find((x) => x.name === 'toggle-site').shortcut || 'Not Set'
    document.getElementById('enableTemp').textContent =
        commands.find((x) => x.name === 'enable-temp').shortcut || 'Not Set'
    updateTable(options.sites)
}

/**
 * Save Options Click
 * @function saveOptions
 * @param {MouseEvent} event
 */
async function saveOptions(event) {
    event.preventDefault()
    console.log('saveOptions:', event)
    const { options } = await chrome.storage.sync.get(['options'])
    options.autoReload = document.getElementById('autoReload').checked
    options.contextMenu = document.getElementById('contextMenu').checked
    options.showUpdate = document.getElementById('showUpdate').checked
    console.log('options:', options)
    if (options.contextMenu) {
        chrome.contextMenus.removeAll()
        createContextMenus()
    } else {
        chrome.contextMenus.removeAll()
    }
    await chrome.storage.sync.set({ options })
    showToast('Options Saved')
}

/**
 * Radio on Change Callback
 * @function updateOptions
 * @param {SubmitEvent} event
 */
async function updateOptions(event) {
    console.log('updateOptions:', event)
    let { options } = await chrome.storage.sync.get(['options'])
    console.log(options)
    options.autoReload = event.target.checked
    console.log(`options.autoReload: ${options.autoReload}`)
    await chrome.storage.sync.set({ options })
}

/**
 * Update Popup Table with Data
 * @function updateTable
 * @param {Object} data
 */
function updateTable(data) {
    const tbodyRef = document
        .getElementById('hosts-table')
        .getElementsByTagName('tbody')[0]

    data.forEach(function (value) {
        const row = tbodyRef.insertRow()

        // const textCount = document.createTextNode(i + 1)
        // const cell1 = row.insertCell()
        // cell1.appendChild(textCount)

        const deleteBtn = document.createElement('a')
        deleteBtn.title = 'Delete'
        deleteBtn.setAttribute('role', 'button')
        deleteBtn.classList.add('link-danger')
        deleteBtn.innerHTML =
            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3" viewBox="0 0 16 16">\n' +
            '  <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5ZM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 0H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1h-.995a.59.59 0 0 0-.01 0H11Zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5h9.916Zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47ZM8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5Z"/>\n' +
            '</svg>'
        deleteBtn.dataset.host = value
        deleteBtn.addEventListener('click', deleteHost)
        const cell1 = row.insertCell()
        cell1.classList.add('text-center')
        cell1.appendChild(deleteBtn)

        const hostLink = document.createElement('a')
        hostLink.text = value
        hostLink.title = value
        hostLink.href = `http://${value}`
        hostLink.target = '_blank'
        hostLink.setAttribute('role', 'button')
        // hostLink.classList.add(
        //     'link-underline',
        //     'link-underline-opacity-0',
        //     'link-underline-opacity-75-hover'
        // )
        const cell2 = row.insertCell()
        cell2.appendChild(hostLink)
    })
}

/**
 * Delete Host
 * @function deleteHost
 * @param {MouseEvent} event
 */
async function deleteHost(event) {
    event.preventDefault()
    console.log('deleteHost:', event)
    const anchor = event.target.closest('a')
    const host = anchor?.dataset?.host
    console.log(`host: ${host}`)
    const { options } = await chrome.storage.sync.get(['options'])
    console.log('options:', options)
    if (host && options.sites.includes(host)) {
        const index = options.sites.indexOf(host)
        console.log(`index: ${index}`)
        if (index !== undefined) {
            options.sites.splice(index, 1)
            await chrome.storage.sync.set({ options })
            const tr = anchor.closest('tr')
            tr.parentNode.removeChild(tr)
            showToast(`Deleted: ${host}`)
        }
    }
}

/**
 * Show Bootstrap Toast
 * TODO: Remove jQuery Dependency
 * @function showToast
 * @param {String} message
 * @param {String} bsClass
 */
function showToast(message, bsClass = 'success') {
    const toastEl = $(
        '<div class="toast align-items-center border-0 mt-3" role="alert" aria-live="assertive" aria-atomic="true">\n' +
            '    <div class="d-flex">\n' +
            '        <div class="toast-body">Options Saved</div>\n' +
            '        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>\n' +
            '    </div>\n' +
            '</div>'
    )
    toastEl.find('.toast-body').text(message)
    toastEl.addClass('text-bg-' + bsClass)
    $('#toast-container').append(toastEl)
    const toast = new bootstrap.Toast(toastEl)
    toast.show()
}
