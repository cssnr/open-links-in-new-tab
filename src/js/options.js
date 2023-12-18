// JS for options.html

import { checkPerms, saveOptions, updateOptions } from './export.js'

document.addEventListener('DOMContentLoaded', initOptions)

chrome.storage.onChanged.addListener(onChanged)

document.getElementById('grant-perms').addEventListener('click', grantPerms)

document
    .querySelectorAll('#options-form input')
    .forEach((el) => el.addEventListener('change', saveOptions))
document
    .getElementById('options-form')
    .addEventListener('submit', (e) => e.preventDefault())
document
    .querySelectorAll('.open-oninstall')
    .forEach((el) => el.addEventListener('click', openOnInstall))
document
    .querySelectorAll('[data-bs-toggle="tooltip"]')
    .forEach((el) => new bootstrap.Tooltip(el))

/**
 * Initialize Options
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
 * Grant Permissions Click Callback
 * @function grantPerms
 * @param {MouseEvent} event
 */
async function grantPerms(event) {
    console.log('grantPermsBtn:', event)
    await chrome.permissions.request({
        origins: ['https://*/*', 'http://*/*'],
    })
    await checkPerms()
}

/**
 * Open OnInstall Page Click Callback
 * @function openOnInstall
 * @param {MouseEvent} event
 */
async function openOnInstall(event) {
    console.log('openOnInstall', event)
    const url = chrome.runtime.getURL('../html/oninstall.html')
    await chrome.tabs.create({ active: true, url })
    window.close()
}

/**
 * Update Popup Table with Data
 * @function updateTable
 * @param {Object} data
 */
function updateTable(data) {
    const tbody = document.querySelector('#hosts-table tbody')
    tbody.innerHTML = ''

    data.forEach(function (value) {
        const row = tbody.insertRow()

        const deleteBtn = document.createElement('a')
        const svg = document.getElementById('bi-trash3').cloneNode(true)
        deleteBtn.appendChild(svg)
        deleteBtn.title = 'Delete'
        deleteBtn.dataset.value = value
        deleteBtn.classList.add('link-danger')
        deleteBtn.setAttribute('role', 'button')
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
        cell2.classList.add('text-break')
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
    const host = anchor?.dataset?.value
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
            // console.log(`${elementID}: ${command.shortcut}`)
            const el = document.getElementById(elementID)
            if (el) {
                el.textContent = command.shortcut
            }
        }
    }
}
