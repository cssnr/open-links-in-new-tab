// JS Background Service Worker

import { checkPerms, enableSite, requestPerms, toggleSite } from './export.js'

chrome.runtime.onStartup.addListener(onStartup)
chrome.runtime.onInstalled.addListener(onInstalled)
chrome.contextMenus.onClicked.addListener(onClicked)
chrome.commands.onCommand.addListener(onCommand)
chrome.runtime.onMessage.addListener(onMessage)
chrome.storage.onChanged.addListener(onChanged)

/**
 * On Startup Callback
 * @function onStartup
 */
async function onStartup() {
    console.log('onStartup')
    if (typeof browser !== 'undefined') {
        console.log('Firefox CTX Menu Workaround')
        const { options } = await chrome.storage.sync.get(['options'])
        console.debug('options:', options)
        if (options.contextMenu) {
            createContextMenus()
        }
    }
}

/**
 * Installed Callback
 * @function onInstalled
 * @param {InstalledDetails} details
 */
async function onInstalled(details) {
    console.log('onInstalled:', details)
    const githubURL = 'https://github.com/cssnr/open-links-in-new-tab'
    const uninstallURL = new URL(
        'https://open-links-in-new-tab.cssnr.com/uninstall/'
    )
    const options = await Promise.resolve(
        setDefaultOptions({
            onScroll: false,
            onAttributes: false,
            anchorLinks: false,
            autoReload: true,
            updateAll: true,
            noOpener: true,
            contextMenu: true,
            showUpdate: false,
        })
    )
    if (options.contextMenu) {
        createContextMenus()
    }
    const manifest = chrome.runtime.getManifest()
    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        const hasPerms = await checkPerms()
        if (hasPerms) {
            chrome.runtime.openOptionsPage()
        } else {
            const url = chrome.runtime.getURL('/html/oninstall.html')
            await chrome.tabs.create({ active: true, url })
        }
    } else if (details.reason === chrome.runtime.OnInstalledReason.UPDATE) {
        if (options.showUpdate) {
            if (manifest.version !== details.previousVersion) {
                const url = `${githubURL}/releases/tag/${manifest.version}`
                console.log(`Update url: ${url}`)
                await chrome.tabs.create({ active: false, url })
            }
        }
    }
    uninstallURL.searchParams.append('version', manifest.version)
    console.log('uninstallURL:', uninstallURL.href)
    await chrome.runtime.setUninstallURL(uninstallURL.href)
}

/**
 * Context Menu Click Callback
 * @function onClicked
 * @param {OnClickData} ctx
 * @param {chrome.tabs.Tab} tab
 */
async function onClicked(ctx, tab) {
    console.debug(`contextMenuClick: ${ctx.menuItemId}`, ctx, tab)
    if (ctx.menuItemId === 'toggle') {
        console.debug(`toggle: ctx.pageUrl: ${ctx.pageUrl}`)
        await requestPerms()
        const hasPerms = await checkPerms()
        if (hasPerms) {
            await toggleSite(tab)
        }
    } else if (ctx.menuItemId === 'temp') {
        console.debug(`temp: ctx.pageUrl: ${ctx.pageUrl}`)
        await enableSite(tab, 'yellow')
    } else if (ctx.menuItemId === 'options') {
        chrome.runtime.openOptionsPage()
    } else {
        console.error(`Unknown ctx.menuItemId: ${ctx.menuItemId}`)
    }
}

/**
 * Command Callback
 * @function onCommand
 * @param {String} command
 */
async function onCommand(command) {
    console.debug('onCommand:', command)
    const [tab] = await chrome.tabs.query({ currentWindow: true, active: true })
    if (command === 'toggle-site') {
        console.debug('toggle-site')
        const hasPerms = await checkPerms()
        if (hasPerms) {
            await toggleSite(tab)
        } else {
            console.warn('Missing Permissions. Use Popup First!')
        }
    } else if (command === 'enable-temp') {
        console.debug('enable-temp', tab)
        await enableSite(tab, 'yellow')
    } else {
        console.error('Unknown command:', command)
    }
}

/**
 * Message Callback
 * @function onMessage
 * @param {Object} message
 * @param {MessageSender} sender
 */
function onMessage(message, sender) {
    console.debug('message, sender:', message, sender)
    const tabId = message.tabId || sender.tab?.id
    if (message.badgeColor) {
        console.debug(`tabId: ${tabId} color: ${message.badgeColor}`)
        chrome.action.setBadgeBackgroundColor({
            tabId: tabId,
            color: message.badgeColor,
        })
    }
    if (message.badgeText) {
        console.debug(`tabId: ${tabId} text: ${message.badgeText}`)
        chrome.action.setBadgeText({
            tabId: tabId,
            text: message.badgeText,
        })
    }
}

/**
 * On Changed Callback
 * @function onChanged
 * @param {Object} changes
 * @param {String} namespace
 */
function onChanged(changes, namespace) {
    // console.debug('onChanged:', changes, namespace)
    for (const [key, { oldValue, newValue }] of Object.entries(changes)) {
        if (namespace === 'sync' && key === 'options' && oldValue && newValue) {
            if (oldValue.contextMenu !== newValue.contextMenu) {
                if (newValue?.contextMenu) {
                    console.log('Enabled contextMenu...')
                    createContextMenus()
                } else {
                    console.log('Disabled contextMenu...')
                    chrome.contextMenus.removeAll()
                }
            }
        }
    }
}

/**
 * Set Default Options
 * @function setDefaultOptions
 * @param {Object} defaultOptions
 * @return {Promise<*|Object>}
 */
async function setDefaultOptions(defaultOptions) {
    console.log('setDefaultOptions')
    let { options, sites } = await chrome.storage.sync.get(['options', 'sites'])
    options = options || {}
    if (!sites) {
        await chrome.storage.sync.set({ sites: [] })
    }
    console.log('options, sites:', options, sites)
    let changed = false
    for (const [key, value] of Object.entries(defaultOptions)) {
        if (options[key] === undefined) {
            changed = true
            options[key] = value
            console.log(`Set ${key}:`, value)
        }
    }
    if (changed) {
        await chrome.storage.sync.set({ options })
        console.log(options)
    }
    return options
}

/**
 * Create Context Menus
 * @function createContextMenus
 */
export function createContextMenus() {
    console.debug('createContextMenus')
    chrome.contextMenus.removeAll()
    const ctx = ['all']
    const contexts = [
        [ctx, 'toggle', 'normal', 'Toggle Current Domain'],
        [ctx, 'temp', 'normal', 'Enable Temporarily'],
        [ctx, 'separator-1', 'separator', 'separator'],
        [ctx, 'options', 'normal', 'Open Options'],
    ]
    contexts.forEach((context) => {
        chrome.contextMenus.create({
            contexts: context[0],
            id: context[1],
            type: context[2],
            title: context[3],
        })
    })
}
