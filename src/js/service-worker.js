// Background Service Worker JS

import { enableTemp, toggleSite } from './exports.js'

chrome.runtime.onInstalled.addListener(onInstalled)
chrome.contextMenus.onClicked.addListener(onClicked)
chrome.commands.onCommand.addListener(onCommand)
chrome.runtime.onMessage.addListener(onMessage)
chrome.storage.onChanged.addListener(onChanged)

const ghUrl = 'https://github.com/cssnr/open-links-in-new-tab'

/**
 * Installed Callback
 * @function onInstalled
 * @param {InstalledDetails} details
 */
async function onInstalled(details) {
    console.log('onInstalled:', details)
    const defaultOptions = {
        contextMenu: true,
        showUpdate: false,
        autoReload: true,
        isBlacklist: false,
    }
    const options = await setDefaultOptions(defaultOptions)

    if (options.contextMenu) {
        createContextMenus()
    }
    if (details.reason === 'install') {
        const url = chrome.runtime.getURL('/html/options.html')
        await chrome.tabs.create({ active: true, url })
    } else if (options.showUpdate && details.reason === 'update') {
        const manifest = chrome.runtime.getManifest()
        if (manifest.version !== details.previousVersion) {
            const url = `${ghUrl}/releases/tag/${manifest.version}`
            console.log(`url: ${url}`)
            await chrome.tabs.create({ active: true, url })
        }
    }
    chrome.runtime.setUninstallURL(`${ghUrl}/issues`)
}

/**
 * Context Menu Click Callback
 * @function onClicked
 * @param {OnClickData} ctx
 * @param {Tab} tab
 */
async function onClicked(ctx, tab) {
    console.log('contextMenuClick:', ctx, tab)
    console.log(`ctx.menuItemId: ${ctx.menuItemId}`)
    if (ctx.menuItemId === 'toggle') {
        console.log(`toggle: ctx.pageUrl: ${ctx.pageUrl}`)
        chrome.permissions.request({
            origins: ['https://*/*', 'http://*/*'],
        })
        const hasPerms = await chrome.permissions.contains({
            origins: ['https://*/*', 'http://*/*'],
        })
        console.log(`hasPerms: ${hasPerms}`)
        // TODO: DUPLICATE: Make this a function
        if (hasPerms) {
            const added = await toggleSite(new URL(tab.url))
            console.log(`added: ${added}`)
            if (added) {
                await enableTemp(tab, 'green')
            } else {
                const { options } = await chrome.storage.sync.get(['options'])
                if (options.autoReload) {
                    await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        func: function () {
                            window.location.reload()
                        },
                    })
                }
            }
        }
    } else if (ctx.menuItemId === 'temp') {
        console.log(`temp: ctx.pageUrl: ${ctx.pageUrl}`)
        await enableTemp(tab)
    } else if (ctx.menuItemId === 'options') {
        const url = chrome.runtime.getURL('/html/options.html')
        await chrome.tabs.create({ active: true, url })
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
    console.log(`onCommand: ${command}`)
    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
    })
    if (command === 'toggle-site') {
        console.log('toggle-site')
        const hasPerms = await chrome.permissions.contains({
            origins: ['https://*/*', 'http://*/*'],
        })
        console.log(`hasPerms: ${hasPerms}`)
        // TODO: DUPLICATE: Make this a function
        if (hasPerms) {
            const added = await toggleSite(new URL(tab.url))
            console.log(`added: ${added}`)
            if (added) {
                await enableTemp(tab, 'green')
            } else {
                const { options } = await chrome.storage.sync.get(['options'])
                if (options.autoReload) {
                    await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        func: function () {
                            window.location.reload()
                        },
                    })
                }
            }
        }
    } else if (command === 'enable-temp') {
        // const { tab } = await getTabUrl()
        console.log('enable-temp', tab)
        await enableTemp(tab)
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
    // console.log(message, sender)
    console.log(`message.badgeText: ${message.badgeText}`)
    if (message.badgeText) {
        console.log(`tabId: ${sender.tab.id}, text: ${message.badgeText}`)
        await chrome.action.setBadgeText({
            tabId: sender.tab.id,
            text: message.badgeText,
        })
        await chrome.action.setBadgeBackgroundColor({
            tabId: sender.tab.id,
            color: 'green',
        })
    } else {
        console.error('Unknown message:', message)
    }
}

/**
 * On Changed Callback
 * @function onChanged
 * @param {Object} changes
 * @param {String} namespace
 */
function onChanged(changes, namespace) {
    console.log('onChanged:', changes, namespace)
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
        if (
            key === 'options' &&
            oldValue &&
            newValue &&
            oldValue.contextMenu !== newValue.contextMenu
        ) {
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
    console.log('options, sites:', options, sites)
    let changed = false
    for (const [key, value] of Object.entries(defaultOptions)) {
        // console.log(`${key}: default: ${value} current: ${options[key]}`)
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
    // Migrate Start - options.sites to sites
    if (options.sites) {
        console.warn('Migrating options.sites to sites:', options.sites)
        sites = options.sites
        delete options.sites
        chrome.storage.sync.set({ options, sites }).then()
    }
    // Migrate End
    if (!sites) {
        sites = []
        chrome.storage.sync.set({ sites }).then()
    }
    return options
}

/**
 * Create Context Menus
 * @function createContextMenus
 */
export function createContextMenus() {
    console.log('createContextMenus')
    const ctx = ['page', 'link']
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
