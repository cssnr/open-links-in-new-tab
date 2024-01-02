// JS Background Service Worker

import { enableSite, toggleSite } from './export.js'

chrome.runtime.onInstalled.addListener(onInstalled)
chrome.contextMenus.onClicked.addListener(onClicked)
chrome.commands.onCommand.addListener(onCommand)
chrome.runtime.onMessage.addListener(onMessage)
chrome.storage.onChanged.addListener(onChanged)

/**
 * Installed Callback
 * @function onInstalled
 * @param {InstalledDetails} details
 */
async function onInstalled(details) {
    console.log('onInstalled:', details)
    const githubURL = 'https://github.com/cssnr/open-links-in-new-tab'
    const options = await Promise.resolve(
        setDefaultOptions({
            autoReload: true,
            onScroll: false,
            updateAll: true,
            contextMenu: true,
            showUpdate: false,
        })
    )
    if (options.contextMenu) {
        createContextMenus()
    }
    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        const hasPerms = await chrome.permissions.contains({
            origins: ['https://*/*', 'http://*/*'],
        })
        if (hasPerms) {
            chrome.runtime.openOptionsPage()
        } else {
            const url = chrome.runtime.getURL('/html/oninstall.html')
            await chrome.tabs.create({ active: true, url })
        }
    } else if (details.reason === chrome.runtime.OnInstalledReason.UPDATE) {
        if (options.showUpdate) {
            const manifest = chrome.runtime.getManifest()
            if (manifest.version !== details.previousVersion) {
                const url = `${githubURL}/releases/tag/${manifest.version}`
                console.log(`Update url: ${url}`)
                await chrome.tabs.create({ active: false, url })
            }
        }
    }
    chrome.runtime.setUninstallURL(`${githubURL}/issues`)
}

/**
 * Context Menu Click Callback
 * @function onClicked
 * @param {OnClickData} ctx
 * @param {chrome.tabs.Tab} tab
 */
async function onClicked(ctx, tab) {
    console.debug('contextMenuClick:', ctx, tab)
    console.log(`ctx.menuItemId: ${ctx.menuItemId}`)
    if (ctx.menuItemId === 'toggle') {
        console.debug(`toggle: ctx.pageUrl: ${ctx.pageUrl}`)
        chrome.permissions.request({
            origins: ['https://*/*', 'http://*/*'],
        })
        const hasPerms = await chrome.permissions.contains({
            origins: ['https://*/*', 'http://*/*'],
        })
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
    console.debug(`onCommand: ${command}`)
    const [tab] = await chrome.tabs.query({ currentWindow: true, active: true })
    if (command === 'toggle-site') {
        console.debug('toggle-site')
        const hasPerms = await chrome.permissions.contains({
            origins: ['https://*/*', 'http://*/*'],
        })
        if (hasPerms) {
            await toggleSite(tab)
        } else {
            console.warn('Missing Permissions. Use Popup First!')
        }
    } else if (command === 'enable-temp') {
        console.debug('enable-temp', tab)
        await enableSite(tab, 'yellow')
    } else {
        console.error(`Unknown command: ${command}`)
    }
}

/**
 * Message Callback
 * @function onMessage
 * @param {Object} message
 * @param {MessageSender} sender
 */
async function onMessage(message, sender) {
    console.debug('message, sender:', message, sender)
    const tabId = message.tabId || sender.tab.id
    const text = message.badgeText
    const color = message.badgeColor
    console.debug(`tabId: ${tabId}, text: ${text}, color: ${color}`)
    if (color) {
        await chrome.action.setBadgeBackgroundColor({
            tabId: tabId,
            color: color,
        })
    }
    if (text) {
        await chrome.action.setBadgeText({
            tabId: tabId,
            text: text,
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
 * @return {Object}
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
