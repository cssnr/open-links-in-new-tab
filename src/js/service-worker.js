// Background Service Worker JS

import { createContextMenus, enableTemp, toggleSite } from './exports.js'

chrome.runtime.onInstalled.addListener(onInstalled)
chrome.commands.onCommand.addListener(onCommand)
chrome.runtime.onMessage.addListener(onMessage)
chrome.contextMenus.onClicked.addListener(onClicked)

/**
 * Installed Callback
 * @function onInstalled
 * @param {InstalledDetails} details
 */
async function onInstalled(details) {
    console.log('onInstalled:', details)
    const defaultOptions = {
        contextMenu: true,
        showUpdate: true,
        autoReload: true,
        isBlacklist: false,
        sites: [],
    }
    let { options } = await chrome.storage.sync.get(['options'])
    if (!options) {
        options = defaultOptions
        await chrome.storage.sync.set({ options })
    }
    console.log('options:', options)
    if (options.contextMenu) {
        createContextMenus()
    }
    // Show Options on Install else Check if Updated and Show Release Notes
    if (details.reason === 'install') {
        const url = chrome.runtime.getURL('/html/options.html')
        await chrome.tabs.create({ active: true, url })
    } else if (options.showUpdate && details.reason === 'update') {
        const manifest = chrome.runtime.getManifest()
        if (manifest.version !== details.previousVersion) {
            const url = `https://github.com/cssnr/open-in-tab/releases/tag/${manifest.version}`
            console.log(`url: ${url}`)
            await chrome.tabs.create({ active: true, url })
        }
    }
    // Set Uninstall URL
    chrome.runtime.setUninstallURL(
        'https://github.com/cssnr/open-in-tab/issues'
    )
}

/**
 * Command Callback
 * @function onCommand
 * @param {String} command
 */
async function onCommand(command) {
    console.log(`onCommand: command: ${command}`)
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
