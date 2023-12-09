// JS for options.html

import { checkPerms, saveOptions, updateOptions } from './export.js'

document.addEventListener('DOMContentLoaded', initOptions)

chrome.storage.onChanged.addListener(onChanged)

document.getElementById('grant-perms').addEventListener('click', grantPermsBtn)

document
    .querySelectorAll('#options-form input')
    .forEach((el) => el.addEventListener('change', saveOptions))
document
    .getElementById('options-form')
    .addEventListener('submit', (e) => e.preventDefault())

document.querySelectorAll('[data-href]').forEach((el) =>
    el.addEventListener('click', async (e) => {
        console.log('clicked')
        const url = chrome.runtime.getURL(e.target.dataset.href)
        await chrome.tabs.create({ active: true, url })
        window.close()
    })
)

/**
 * Options Page Init
 * @function initOptions
 */
async function initOptions() {
    console.log('initOptions')
    document.getElementById('version').textContent =
        chrome.runtime.getManifest().version
    await setShortcuts({
        mainKey: '_execute_action',
        toggleSite: 'toggle-site',
        enableTemp: 'enable-temp',
    })
    const { options, sites } = await chrome.storage.sync.get([
        'options',
        'sites',
    ])
    console.log('options, sites:', options, sites)
    updateOptions(options)
    updateTable(sites)
    await checkPerms()
}

/**
 * On Changed Callback
 * @function onChanged
 * @param {Object} changes
 * @param {String} namespace
 */
function onChanged(changes, namespace) {
    // console.log('onChanged:', changes, namespace)
    for (let [key, { newValue }] of Object.entries(changes)) {
        if (namespace === 'sync' && key === 'options') {
            updateOptions(newValue)
        }
        if (namespace === 'sync' && key === 'sites') {
            updateTable(newValue)
        }
    }
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
    await checkPerms()
}

/**
 * Update Popup Table with Data
 * TODO: Remove JQuery
 * @function updateTable
 * @param {Object} data
 */
function updateTable(data) {
    const tbodyRef = document
        .getElementById('hosts-table')
        .getElementsByTagName('tbody')[0]

    $('#hosts-table tbody tr').remove()

    data.forEach(function (value) {
        const row = tbodyRef.insertRow()

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
    const { sites } = await chrome.storage.sync.get(['sites'])
    // console.log('sites:', sites)
    if (host && sites.includes(host)) {
        const index = sites.indexOf(host)
        // console.log(`index: ${index}`)
        if (index !== undefined) {
            sites.splice(index, 1)
            await chrome.storage.sync.set({ sites })
        }
    }
}

/**
 * Set Keyboard Shortcuts
 * @function setShortcuts
 * @param {Object} mapping { elementID: name }
 */
async function setShortcuts(mapping) {
    const commands = await chrome.commands.getAll()
    for (const [elementID, name] of Object.entries(mapping)) {
        // console.log(`${elementID}: ${name}`)
        const command = commands.find((x) => x.name === name)
        if (command?.shortcut) {
            console.log(`${elementID}: ${command.shortcut}`)
            const el = document.getElementById(elementID)
            if (el) {
                el.textContent = command.shortcut
            }
        }
    }
}
