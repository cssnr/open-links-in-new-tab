// JS for options.html

import {
    checkPerms,
    grantPerms,
    onAdded,
    onRemoved,
    saveOptions,
    showToast,
    updateManifest,
    updateOptions,
} from './export.js'

chrome.storage.onChanged.addListener(onChanged)
chrome.permissions.onAdded.addListener(onAdded)
chrome.permissions.onRemoved.addListener(onRemoved)

document.addEventListener('DOMContentLoaded', initOptions)
document.getElementById('add-host').addEventListener('submit', addHost)
document.getElementById('export-hosts').addEventListener('click', exportHosts)
document.getElementById('import-hosts').addEventListener('click', importHosts)
document
    .querySelectorAll('.grant-permissions')
    .forEach((el) => el.addEventListener('click', grantPerms))
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

const hostsInput = document.getElementById('hosts-input')
hostsInput.addEventListener('change', hostsInputChange)

/**
 * Initialize Options
 * @function initOptions
 */
async function initOptions() {
    console.debug('initOptions')
    updateManifest()
    await setShortcuts()
    await checkPerms()

    const { options, sites } = await chrome.storage.sync.get([
        'options',
        'sites',
    ])
    console.debug('options, sites:', options, sites)
    updateOptions(options)
    updateTable(sites)
}

/**
 * On Changed Callback
 * @function onChanged
 * @param {Object} changes
 * @param {String} namespace
 */
function onChanged(changes, namespace) {
    // console.debug('onChanged:', changes, namespace)
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
 * Open OnInstall Page Click Callback
 * @function openOnInstall
 * @param {MouseEvent} event
 */
async function openOnInstall(event) {
    console.debug('openOnInstall', event)
    const url = chrome.runtime.getURL('/html/oninstall.html')
    await chrome.tabs.create({ active: true, url })
    window.close()
}

/**
 * Update Popup Table with Data
 * @function updateTable
 * @param {Object} data
 */
function updateTable(data) {
    const tbody = document.querySelector('#hosts-table > tbody')
    tbody.innerHTML = ''

    data.forEach(function (value) {
        const row = tbody.insertRow()

        const deleteBtn = document.createElement('a')
        const svg = document
            .querySelector('.d-none > .fa-regular.fa-trash-can')
            .cloneNode(true)
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
        hostLink.href = `https://${value}`
        hostLink.target = '_blank'
        hostLink.setAttribute('role', 'button')
        const cell2 = row.insertCell()
        cell2.classList.add('text-break')
        cell2.appendChild(hostLink)
    })
}

/**
 * Add Host Callback
 * @function addHost
 * @param {SubmitEvent} event
 */
async function addHost(event) {
    console.debug('addHost:', event)
    event.preventDefault()
    const input = event.target.elements['host-name']
    let value = input.value
    console.debug('value:', value)
    if (!value.includes('://')) {
        value = `https://${value}`
    }
    let url
    try {
        url = new URL(value)
    } catch (e) {
        showToast(e.message, 'danger')
        input.focus()
        input.select()
        return console.info(e)
    }
    console.log('url:', url)
    const { sites } = await chrome.storage.sync.get(['sites'])
    if (sites.includes(url.hostname)) {
        showToast(`Host Exists: ${url.hostname}`, 'warning')
        input.focus()
        input.select()
        return console.info('Existing Host: url:', url)
    } else {
        sites.push(url.hostname)
        await chrome.storage.sync.set({ sites })
        showToast(`Added Host: ${url.hostname}`)
        console.log(`Added Host: ${url.hostname}`, url)
        input.value = ''
        input.focus()
    }
}

/**
 * Delete Host
 * @function deleteHost
 * @param {MouseEvent} event
 */
async function deleteHost(event) {
    console.debug('deleteHost:', event)
    event.preventDefault()
    const anchor = event.target.closest('a')
    const host = anchor?.dataset?.value
    console.info(`Delete Host: ${host}`)
    const { sites } = await chrome.storage.sync.get(['sites'])
    // console.debug('sites:', sites)
    if (host && sites.includes(host)) {
        const index = sites.indexOf(host)
        // console.debug(`index: ${index}`)
        if (index !== undefined) {
            sites.splice(index, 1)
            await chrome.storage.sync.set({ sites })
        }
    }
}

/**
 * Export Hosts Click Callback
 * @function exportHosts
 * @param {MouseEvent} event
 */
async function exportHosts(event) {
    console.debug('exportHosts:', event)
    event.preventDefault()
    const { sites } = await chrome.storage.sync.get(['sites'])
    console.debug('sites:', sites)
    if (!sites) {
        return showToast('No Hosts Found!', 'warning')
    }
    const json = JSON.stringify(sites)
    textFileDownload('open-in-tab-sites.txt', json)
}

/**
 * Import Hosts Click Callback
 * @function importHosts
 * @param {MouseEvent} event
 */
async function importHosts(event) {
    console.debug('importHosts:', event)
    event.preventDefault()
    hostsInput.click()
}

/**
 * Hosts Input Change Callback
 * @function hostsInputChange
 * @param {InputEvent} event
 */
async function hostsInputChange(event) {
    console.debug('hostsInputChange:', event, hostsInput)
    event.preventDefault()
    const fileReader = new FileReader()
    fileReader.onload = async function doBannedImport() {
        const result = JSON.parse(fileReader.result.toString())
        console.debug('result:', result)
        const { sites } = await chrome.storage.sync.get(['sites'])
        let count = 0
        for (const pid of result) {
            if (!sites.includes(pid)) {
                sites.push(pid)
                count += 1
            }
        }
        showToast(`Imported ${count}/${result.length} Hosts.`, 'success')
        await chrome.storage.sync.set({ sites })
    }
    fileReader.readAsText(hostsInput.files[0])
}

/**
 * Text File Download
 * @function textFileDownload
 * @param {String} filename
 * @param {String} text
 */
function textFileDownload(filename, text) {
    console.debug(`textFileDownload: ${filename}`)
    const element = document.createElement('a')
    element.setAttribute(
        'href',
        'data:text/plain;charset=utf-8,' + encodeURIComponent(text)
    )
    element.setAttribute('download', filename)
    element.classList.add('d-none')
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
}

/**
 * Set Keyboard Shortcuts
 * @function setShortcuts
 * @param {String} selector
 */
async function setShortcuts(selector = '#keyboard-shortcuts') {
    const table = document.querySelector(selector)
    const tbody = table.querySelector('tbody')
    const source = table.querySelector('tfoot > tr').cloneNode(true)
    const commands = await chrome.commands.getAll()
    for (const command of commands) {
        // console.debug('command:', command)
        const row = source.cloneNode(true)
        // TODO: Chrome does not parse the description for _execute_action in manifest.json
        let description = command.description
        if (!description && command.name === '_execute_action') {
            description = 'Show Popup'
        }
        row.querySelector('.description').textContent = description
        row.querySelector('kbd').textContent = command.shortcut || 'Not Set'
        tbody.appendChild(row)
    }
}
