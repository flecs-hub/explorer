/*
 * Behave.js
 *
 * Copyright 2013, Jacob Kelley - http://jakiestfu.com/
 * Released under the MIT Licence
 * http://opensource.org/licenses/MIT
 *
 * Github:  http://github.com/jakiestfu/Behave.js/
 * Version: 1.5
 */


(function (undefined) {

    'use strict';

    var BehaveHooks = BehaveHooks || (function () {
        var hooks = {};

        return {
            add: function (hookName, fn) {
                if (typeof hookName == "object") {
                    var i;
                    for (i = 0; i < hookName.length; i++) {
                        var theHook = hookName[i];
                        if (!hooks[theHook]) {
                            hooks[theHook] = [];
                        }
                        hooks[theHook].push(fn);
                    }
                } else {
                    if (!hooks[hookName]) {
                        hooks[hookName] = [];
                    }
                    hooks[hookName].push(fn);
                }
            },
            get: function (hookName) {
                if (hooks[hookName]) {
                    return hooks[hookName];
                }
            }
        };

    })(),
        Behave = Behave || function (userOpts) {

            if (typeof String.prototype.repeat !== 'function') {
                String.prototype.repeat = function (times) {
                    if (times < 1) {
                        return '';
                    }
                    if (times % 2) {
                        return this.repeat(times - 1) + this;
                    }
                    var half = this.repeat(times / 2);
                    return half + half;
                };
            }

            if (typeof Array.prototype.filter !== 'function') {
                Array.prototype.filter = function (func /*, thisp */) {
                    if (this === null) {
                        throw new TypeError();
                    }

                    var t = Object(this),
                        len = t.length >>> 0;
                    if (typeof func != "function") {
                        throw new TypeError();
                    }
                    var res = [],
                        thisp = arguments[1];
                    for (var i = 0; i < len; i++) {
                        if (i in t) {
                            var val = t[i];
                            if (func.call(thisp, val, i, t)) {
                                res.push(val);
                            }
                        }
                    }
                    return res;
                };
            }

            var defaults = {
                textarea: null,
                replaceTab: true,
                softTabs: true,
                tabSize: 4,
                autoOpen: true,
                overwrite: true,
                autoStrip: true,
                autoIndent: true,
                fence: false
            },
                tab,
                newLine,
                charSettings = {

                    keyMap: [
                        { open: "\"", close: "\"", canBreak: false },
                        { open: "'", close: "'", canBreak: false },
                        { open: "(", close: ")", canBreak: false },
                        { open: "[", close: "]", canBreak: true },
                        { open: "{", close: "}", canBreak: true }
                    ]

                },
                utils = {

                    _callHook: function (hookName, passData) {
                        var hooks = BehaveHooks.get(hookName);
                        passData = typeof passData == "boolean" && passData === false ? false : true;

                        if (hooks) {
                            if (passData) {
                                var theEditor = defaults.textarea,
                                    textVal = theEditor.value,
                                    caretPos = utils.cursor.get(),
                                    i;

                                for (i = 0; i < hooks.length; i++) {
                                    hooks[i].call(undefined, {
                                        editor: {
                                            element: theEditor,
                                            text: textVal,
                                            levelsDeep: utils.levelsDeep()
                                        },
                                        caret: {
                                            pos: caretPos
                                        },
                                        lines: {
                                            current: utils.cursor.getLine(textVal, caretPos),
                                            total: utils.editor.getLines(textVal)
                                        }
                                    });
                                }
                            } else {
                                for (i = 0; i < hooks.length; i++) {
                                    hooks[i].call(undefined);
                                }
                            }
                        }
                    },

                    defineNewLine: function () {
                        var ta = document.createElement('textarea');
                        ta.value = "\n";

                        if (ta.value.length == 2) {
                            newLine = "\r\n";
                        } else {
                            newLine = "\n";
                        }
                    },
                    defineTabSize: function (tabSize) {
                        if (typeof defaults.textarea.style.OTabSize != "undefined") {
                            defaults.textarea.style.OTabSize = tabSize; return;
                        }
                        if (typeof defaults.textarea.style.MozTabSize != "undefined") {
                            defaults.textarea.style.MozTabSize = tabSize; return;
                        }
                        if (typeof defaults.textarea.style.tabSize != "undefined") {
                            defaults.textarea.style.tabSize = tabSize; return;
                        }
                    },
                    cursor: {
                        getLine: function (textVal, pos) {
                            return ((textVal.substring(0, pos)).split("\n")).length;
                        },
                        get: function () {

                            if (typeof document.createElement('textarea').selectionStart === "number") {
                                return defaults.textarea.selectionStart;
                            } else if (document.selection) {
                                var caretPos = 0,
                                    range = defaults.textarea.createTextRange(),
                                    rangeDupe = document.selection.createRange().duplicate(),
                                    rangeDupeBookmark = rangeDupe.getBookmark();
                                range.moveToBookmark(rangeDupeBookmark);

                                while (range.moveStart('character', -1) !== 0) {
                                    caretPos++;
                                }
                                return caretPos;
                            }
                        },
                        set: function (start, end) {
                            if (!end) {
                                end = start;
                            }
                            if (defaults.textarea.setSelectionRange) {
                                defaults.textarea.focus();
                                defaults.textarea.setSelectionRange(start, end);
                            } else if (defaults.textarea.createTextRange) {
                                var range = defaults.textarea.createTextRange();
                                range.collapse(true);
                                range.moveEnd('character', end);
                                range.moveStart('character', start);
                                range.select();
                            }
                        },
                        selection: function () {
                            var textAreaElement = defaults.textarea,
                                start = 0,
                                end = 0,
                                normalizedValue,
                                range,
                                textInputRange,
                                len,
                                endRange;

                            if (typeof textAreaElement.selectionStart == "number" && typeof textAreaElement.selectionEnd == "number") {
                                start = textAreaElement.selectionStart;
                                end = textAreaElement.selectionEnd;
                            } else {
                                range = document.selection.createRange();

                                if (range && range.parentElement() == textAreaElement) {

                                    normalizedValue = utils.editor.get();
                                    len = normalizedValue.length;

                                    textInputRange = textAreaElement.createTextRange();
                                    textInputRange.moveToBookmark(range.getBookmark());

                                    endRange = textAreaElement.createTextRange();
                                    endRange.collapse(false);

                                    if (textInputRange.compareEndPoints("StartToEnd", endRange) > -1) {
                                        start = end = len;
                                    } else {
                                        start = -textInputRange.moveStart("character", -len);
                                        start += normalizedValue.slice(0, start).split(newLine).length - 1;

                                        if (textInputRange.compareEndPoints("EndToEnd", endRange) > -1) {
                                            end = len;
                                        } else {
                                            end = -textInputRange.moveEnd("character", -len);
                                            end += normalizedValue.slice(0, end).split(newLine).length - 1;
                                        }
                                    }
                                }
                            }

                            return start == end ? false : {
                                start: start,
                                end: end
                            };
                        }
                    },
                    helper: {
                        indentLines: function (e) {

                            utils.preventDefaultEvent(e);

                            // Can indent one or multiple lines
                            // Either cursor or selection

                            let selection = utils.cursor.selection(),
                                pos = utils.cursor.get(),
                                val = utils.editor.get();

                            let leftBound = selection ? selection.start : pos,
                            rightBound = selection ? selection.end : pos;

                            let endCursorPos = {start: leftBound, end: rightBound};

                            while (val.charAt(leftBound-1) != "\n" && leftBound != 0) {
                                leftBound--;
                            }

                            while (val.charAt(rightBound) != "\n" && rightBound < val.length) {
                                rightBound++;
                            }
                            
                            let expandedSelection = val.substring(leftBound, rightBound);
                            let splitSelection = expandedSelection.split("\n");
                            let indentedSelection = splitSelection.map(line => "  " + line).join("\n");

                            // Calculate final cursor selection positions
                            if (selection) {
                                endCursorPos.start = selection.start + 2;
                                endCursorPos.end = selection.end + splitSelection.length * 2;
                            } else {
                                endCursorPos.start = pos + 2;
                                endCursorPos.end = pos + 2;
                            }

                            try {
                                // utils.cursor.set(rightBound);
                                // utils.editor.delete(expandedSelection.length - 1);
                                utils.cursor.set(leftBound, rightBound);
                                utils.editor.insert(indentedSelection)
                            } catch(e) {
                                console.warn(e);
                                let left = val.substring(0, leftBound),
                                    right = val.substring(rightBound);
                                utils.editor.set(left + indentedSelection + right);
                            } finally {
                                utils.cursor.set(endCursorPos.start, endCursorPos.end);
                                utils._callHook('indent:after');
                                return;
                            }
                        },
                        unindentLines: function (e) {

                            utils.preventDefaultEvent(e);

                            // Can unindent one or multiple lines
                            // Either cursor or selection

                            let selection = utils.cursor.selection(),
                                val = utils.editor.get(),
                                pos = utils.cursor.get();

                            let leftBound = selection ? selection.start : pos,
                            rightBound = selection ? selection.end : pos;

                            let endCursorPos = {start: leftBound, end: rightBound};

                            while (val.charAt(leftBound-1) != "\n" && leftBound != 0) {
                                leftBound--;
                            }

                            while (val.charAt(rightBound) != "\n" && rightBound < val.length) {
                                rightBound++;
                            }

                            let expandedSelection = val.substring(leftBound, rightBound);
                            let unindentCount = 0;

                            let splitSelection = expandedSelection.split("\n");
                            let indentedSelection = splitSelection.map((line) => {
                                if(line.match(/^[ \t]{2,}/)) {
                                    unindentCount++;
                                    return line.substring(2);
                                } else {
                                    return line;
                                }
                            }).join("\n");

                            // Calculate final cursor selection positions
                            if (selection) {
                                endCursorPos.end = selection.end - unindentCount*2;

                                if (splitSelection[0].match(/^[ \t]{2,}/)) {
                                    if (val.charAt(selection.start - 1) != "\n") endCursorPos.start = selection.start - 2;
                                    if (val.charAt(selection.start - 2) == "\n") endCursorPos.start = selection.start - 1;
                                } else {
                                    endCursorPos.start = selection.start;
                                }
                            } else {
                                if (unindentCount > 0) {
                                    endCursorPos.start = pos - 2;
                                    endCursorPos.end = pos - 2;
                                }
                            }

                            try {
                                // utils.cursor.set(rightBound);
                                // utils.editor.delete(expandedSelection.length - 1);
                                utils.cursor.set(leftBound, rightBound);
                                utils.editor.insert(indentedSelection);
                            } catch(e) {
                                console.warn(e);
                                let left = val.substring(0, leftBound),
                                    right = val.substring(rightBound);
                                utils.editor.set(left + indentedSelection + right);
                            } finally {
                                // To know if the first line (leftBound) has hit the end or not.
                                utils.cursor.set(endCursorPos.start, endCursorPos.end);
                                utils._callHook('indent:after');
                                return;
                            }

                        }
                    },
                    editor: {
                        getLines: function (textVal) {
                            return (textVal).split("\n").length;
                        },
                        get: function () {
                            return defaults.textarea.value.replace(/\r/g, '');
                        },
                        set: function (data) {
                            // Old way of inserting data
                            // Doesn't allow for undo/redo history
                            defaults.textarea.value = data;
                        },
                        insert: function (data) {
                            if (document.queryCommandSupported('insertText')) {
                                document.execCommand('insertText', false, data)
                            } else {
                                throw new QueryCommandException('insertText');
                            }
                        },
                        delete: function (deletebehind = 0, deleteahead = 0) {
                            if (document.queryCommandSupported('delete')) {
                                document.execCommand('delete', false);
                                while (deletebehind > 0) {
                                    deletebehind--;
                                    document.execCommand('delete', false);
                                }
                                while (deleteahead > 0) {
                                    deleteahead--;
                                    var pos = utils.cursor.get();
                                    utils.cursor.set(pos + 1);
                                    document.execCommand('delete', false);
                                }
                            } else {
                                throw new QueryCommandException('delete');
                            }
                        }
                    },
                    client: {
                        os: {
                            isMacOS: function() {
                                if (navigator.appVersion.indexOf("Mac")!=-1) {
                                    return true;
                                } else {
                                    return false;
                                }
                            },
                            isWindows: function() {
                                if (navigator.appVersion.indexOf("Win")!=-1) {
                                    return true;
                                } else {
                                    return false;
                                }
                            },
                            isX11: function() {
                                if (navigator.appVersion.indexOf("X11")!=-1) {
                                    return true;
                                } else {
                                    return false;
                                }
                            },
                            isLinux: function() {
                                if (navigator.appVersion.indexOf("Linux")!=-1) {
                                    return true;
                                } else {
                                    return false;
                                }
                            },
                        }
                    },
                    fenceRange: function () {
                        if (typeof defaults.fence == "string") {

                            var data = utils.editor.get(),
                                pos = utils.cursor.get(),
                                hacked = 0,
                                matchedFence = data.indexOf(defaults.fence),
                                matchCase = 0;

                            while (matchedFence >= 0) {
                                matchCase++;
                                if (pos < (matchedFence + hacked)) {
                                    break;
                                }

                                hacked += matchedFence + defaults.fence.length;
                                data = data.substring(matchedFence + defaults.fence.length);
                                matchedFence = data.indexOf(defaults.fence);

                            }

                            if ((hacked) < pos && ((matchedFence + hacked) > pos) && matchCase % 2 === 0) {
                                return true;
                            }
                            return false;
                        } else {
                            return true;
                        }
                    },
                    isEven: function (_this, i) {
                        return i % 2;
                    },
                    levelsDeep: function () {
                        var pos = utils.cursor.get(),
                            val = utils.editor.get();

                        var left = val.substring(0, pos),
                            levels = 0,
                            i, j;

                        for (i = 0; i < left.length; i++) {
                            for (j = 0; j < charSettings.keyMap.length; j++) {
                                if (charSettings.keyMap[j].canBreak) {
                                    if (charSettings.keyMap[j].open == left.charAt(i)) {
                                        levels++;
                                    }

                                    if (charSettings.keyMap[j].close == left.charAt(i)) {
                                        levels--;
                                    }
                                }
                            }
                        }

                        var toDecrement = 0,
                            quoteMap = ["'", "\""];
                        for (i = 0; i < charSettings.keyMap.length; i++) {
                            if (charSettings.keyMap[i].canBreak) {
                                for (j in quoteMap) {
                                    toDecrement += left.split(quoteMap[j]).filter(utils.isEven).join('').split(charSettings.keyMap[i].open).length - 1;
                                }
                            }
                        }

                        var finalLevels = levels - toDecrement;

                        return finalLevels >= 0 ? finalLevels : 0;
                    },
                    deepExtend: function (destination, source) {
                        for (var property in source) {
                            if (source[property] && source[property].constructor &&
                                source[property].constructor === Object) {
                                destination[property] = destination[property] || {};
                                utils.deepExtend(destination[property], source[property]);
                            } else {
                                destination[property] = source[property];
                            }
                        }
                        return destination;
                    },
                    addEvent: function addEvent(element, eventName, func) {
                        if (element.addEventListener) {
                            element.addEventListener(eventName, func, false);
                        } else if (element.attachEvent) {
                            element.attachEvent("on" + eventName, func);
                        }
                    },
                    removeEvent: function addEvent(element, eventName, func) {
                        if (element.addEventListener) {
                            element.removeEventListener(eventName, func, false);
                        } else if (element.attachEvent) {
                            element.detachEvent("on" + eventName, func);
                        }
                    },

                    preventDefaultEvent: function (e) {
                        if (e.preventDefault) {
                            e.preventDefault();
                        } else {
                            e.returnValue = false;
                        }
                    }
                },
                intercept = {
                    tabKey: function (e) {

                        if (!utils.fenceRange()) { return; }

                        if (e.keyCode == 9) {

                            var toReturn = true;
                            utils._callHook('tab:before');

                            var selection = utils.cursor.selection(),
                                pos = utils.cursor.get(),
                                val = utils.editor.get();

                            if (selection) {
                                if (e.shiftKey) {
                                    utils.helper.unindentLines(e);
                                } else {
                                    utils.helper.indentLines(e);
                                }
                            } else {
                                var left = val.substring(0, pos),
                                    right = val.substring(pos), edited = left + tab + right

                                if (e.shiftKey) {
                                    utils.helper.unindentLines(e);
                                } else {
                                    utils.preventDefaultEvent(e);
                                    try {
                                        utils.editor.insert(tab);
                                    } catch (e) {
                                        console.warn(e);
                                        utils.editor.set(edited);
                                    }
                                    utils.cursor.set(pos + tab.length);
                                    toReturn = false;
                                }
                            }
                            utils._callHook('tab:after');
                        }
                        return toReturn;
                    },
                    enterKey: function (e) {

                        if (!utils.fenceRange()) { return; }

                        if (e.keyCode == 13) {

                            utils.preventDefaultEvent(e);
                            utils._callHook('enter:before');

                            var pos = utils.cursor.get(),
                                val = utils.editor.get(),
                                left = val.substring(0, pos),
                                right = val.substring(pos),
                                leftChar = left.charAt(left.length - 1),
                                rightChar = right.charAt(0),
                                numTabs = utils.levelsDeep(),
                                ourIndent = "",
                                closingBreak = "",
                                finalCursorPos,
                                i;
                            if (!numTabs) {
                                finalCursorPos = 1;
                            } else {
                                while (numTabs--) {
                                    ourIndent += tab;
                                }
                                ourIndent = ourIndent;
                                finalCursorPos = ourIndent.length + 1;

                                for (i = 0; i < charSettings.keyMap.length; i++) {
                                    if (charSettings.keyMap[i].open == leftChar && charSettings.keyMap[i].close == rightChar) {
                                        closingBreak = newLine;
                                    }
                                }

                            }
                            try {
                                utils.editor.insert(
                                    newLine + ourIndent + closingBreak + (ourIndent.substring(0, ourIndent.length - tab.length))
                                )
                            } catch (e) {
                                console.warn(e);
                                var edited = left + newLine + ourIndent + closingBreak + (ourIndent.substring(0, ourIndent.length - tab.length)) + right;
                                utils.editor.set(edited);
                            }
                            utils.cursor.set(pos + finalCursorPos);
                            utils._callHook('enter:after');
                        }
                    },
                    deleteKey: function (e) {

                        if (!utils.fenceRange()) { return; }

                        if (e.keyCode == 8) {
                            utils.preventDefaultEvent(e);

                            utils._callHook('delete:before');

                            var pos = utils.cursor.get(),
                                val = utils.editor.get(),
                                left = val.substring(0, pos),
                                right = val.substring(pos),
                                leftChar = left.charAt(left.length - 1),
                                rightChar = right.charAt(0),
                                i;

                            // Delete line
                            // Different OS have different delete line conventions
                            if (utils.client.os.isMacOS() && e.metaKey ||
                                utils.client.os.isLinux() && e.ctrlKey ||
                                utils.client.os.isWindows() && e.ctrlKey && e.shiftKey) {
                                var lineStart = pos;
                                while(lineStart--){
                                    if(val.charAt(lineStart)=="\n"){
                                        break;
                                    }
                                }
                                try {
                                    utils.editor.delete(pos - lineStart - 2);
                                    utils.cursor.set(lineStart + 1);
                                } catch(e) {
                                    console.warn(e);
                                    var edited = val.substring(0, lineStart + 2) + right;
                                    utils.editor.set(edited);
                                    utils.cursor.set(lineStart + 1);
                                } finally {
                                    return;
                                }
                            }

                            // Delete word
                            if(e.altKey) {
                                var cursorChar = val.charAt(pos - 1);
                                var deletionLength = 0;
                                var regexAlphanumericSingle = /[a-zA-Z0-9]/
                                var regexAlphanumeric = /[a-zA-Z0-9]*$/
                                var regexNonalphanumeric = /[^a-zA-Z\d\s:]*$/
                                var regexWhitespace = /[ ]*$/
                                if (
                                    cursorChar == " "
                                    || cursorChar == "\n"
                                    || cursorChar == "\r\n"
                                    || cursorChar == "\r") {
                                        deletionLength = left.match(regexWhitespace)[0].length;
                                } else {
                                    if(cursorChar.match(regexAlphanumericSingle)) {
                                        // Alphanumeric
                                        deletionLength = left.match(regexAlphanumeric)[0].length;
                                    } else {
                                        deletionLength = left.match(regexNonalphanumeric)[0].length;
                                    }
                                }

                                try {
                                    utils.editor.delete(deletionLength - 1);
                                } catch(e) {
                                    console.warn(e);
                                    var edited = val.substring(0, pos - deletionLength) + right;
                                    utils.editor.set(edited);
                                    utils.cursor.set(pos - deletionLength);
                                } finally {
                                    return;
                                }
                            }

                            if (utils.cursor.selection() === false) {
                                for (i = 0; i < charSettings.keyMap.length; i++) {
                                    if (charSettings.keyMap[i].open == leftChar && charSettings.keyMap[i].close == rightChar) {
                                        try {
                                            utils.editor.delete(0, 1);
                                        } catch(e) {
                                            console.warn(e);
                                            var edited = val.substring(0, pos - 1) + val.substring(pos + 1);
                                            utils.editor.set(edited);
                                            utils.cursor.set(pos - 1);
                                        } finally {
                                            return;
                                        }
                                    }
                                }
                                try {
                                    utils.editor.delete();
                                } catch (e) {
                                    console.warn(e);
                                    var edited = val.substring(0, pos - 1) + val.substring(pos);
                                    utils.editor.set(edited);
                                }
                                utils.cursor.set(pos - 1);
                            } else {
                                // Selection deletion
                                var sel = utils.cursor.selection()
                                try {
                                    utils.editor.delete();
                                } catch (e) {
                                    console.warn(e);
                                    var edited = val.substring(0, sel.start) + val.substring(sel.end);
                                    utils.editor.set(edited);
                                } finally {
                                    return;
                                }
                            }

                            utils._callHook('delete:after');

                        }
                    },
                    ctrlKey: function (e) {
                        if (!utils.fenceRange()) { return; }

                        if (utils.client.os.isMacOS && e.metaKey ||
                            utils.client.os.isWindows && e.ctrlKey ||
                            utils.client.os.isLinux && e.ctrlKey) {

                            var selection = utils.cursor.selection(),
                                pos = utils.cursor.get(),
                                val = utils.editor.get();

                            if (selection) {
                                if (e.keyCode == 221) {
                                    utils.helper.indentLines(e);
                                }

                                if (e.keyCode == 219) {
                                    utils.helper.unindentLines(e);
                                }
                            } else {
                                // Single line
                                var leftBound = pos;

                                while (val.charAt(leftBound-1) != "\n" && leftBound != 0) {
                                    leftBound--;
                                }

                                if (e.keyCode == 219) {
                                    // Unindent
                                    utils.helper.unindentLines(e);
                                }
    
                                if (e.keyCode == 221) {
                                    // Indent
                                    utils.helper.indentLines(e);
                                };
                            }
                            return;
                        }
                    }
                },
                charFuncs = {
                    openedChar: function (_char, e) {
                        utils.preventDefaultEvent(e);
                        utils._callHook('openChar:before');
                        var pos = utils.cursor.get();

                        try {
                            utils.editor.insert(_char.open + _char.close);
                        } catch (e) {
                            console.warn(e);
                            var val = utils.editor.get(),
                                left = val.substring(0, pos),
                                right = val.substring(pos),
                                edited = left + _char.open + _char.close + right;
                            defaults.textarea.value = edited;
                        }
                        utils.cursor.set(pos + 1);
                        utils._callHook('openChar:after');
                    },
                    closedChar: function (_char, e) {
                        var pos = utils.cursor.get(),
                            val = utils.editor.get(),
                            toOverwrite = val.substring(pos, pos + 1);
                        if (toOverwrite == _char.close) {
                            utils.preventDefaultEvent(e);
                            utils._callHook('closeChar:before');
                            utils.cursor.set(utils.cursor.get() + 1);
                            utils._callHook('closeChar:after');
                            return true;
                        }
                        return false;
                    }
                },
                action = {
                    filter: function (e) {

                        if (!utils.fenceRange()) { return; }

                        var theCode = e.which || e.keyCode;

                        if (theCode == 39 || theCode == 40 && e.which === 0) { return; }

                        var _char = String.fromCharCode(theCode),
                            i;

                        for (i = 0; i < charSettings.keyMap.length; i++) {

                            if (charSettings.keyMap[i].close == _char) {
                                var didClose = defaults.overwrite && charFuncs.closedChar(charSettings.keyMap[i], e);

                                if (!didClose && charSettings.keyMap[i].open == _char && defaults.autoOpen) {
                                    charFuncs.openedChar(charSettings.keyMap[i], e);
                                }
                            } else if (charSettings.keyMap[i].open == _char && defaults.autoOpen) {
                                charFuncs.openedChar(charSettings.keyMap[i], e);
                            }
                        }
                    },
                    listen: function () {

                        if (defaults.replaceTab) { utils.addEvent(defaults.textarea, 'keydown', intercept.tabKey); }
                        if (defaults.autoIndent) { utils.addEvent(defaults.textarea, 'keydown', intercept.enterKey); }
                        if (defaults.autoStrip) { utils.addEvent(defaults.textarea, 'keydown', intercept.deleteKey); }
                        if (defaults.autoStrip) { utils.addEvent(defaults.textarea, 'keydown', intercept.ctrlKey); }

                        utils.addEvent(defaults.textarea, 'keypress', action.filter);

                        utils.addEvent(defaults.textarea, 'keydown', function () { utils._callHook('keydown'); });
                        utils.addEvent(defaults.textarea, 'keyup', function () { utils._callHook('keyup'); });
                    }
                },
                init = function (opts) {

                    if (opts.textarea) {
                        utils._callHook('init:before', false);
                        utils.deepExtend(defaults, opts);
                        utils.defineNewLine();

                        if (defaults.softTabs) {
                            tab = " ".repeat(defaults.tabSize);
                        } else {
                            tab = "\t";

                            utils.defineTabSize(defaults.tabSize);
                        }

                        action.listen();
                        utils._callHook('init:after', false);
                    }

                };

            this.destroy = function () {
                utils.removeEvent(defaults.textarea, 'keydown', intercept.tabKey);
                utils.removeEvent(defaults.textarea, 'keydown', intercept.enterKey);
                utils.removeEvent(defaults.textarea, 'keydown', intercept.deleteKey);
                utils.removeEvent(defaults.textarea, 'keydown', intercept.ctrlKey);
                utils.removeEvent(defaults.textarea, 'keypress', action.filter);
            };

            init(userOpts);

        };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Behave;
    }

    if (typeof ender === 'undefined') {
        this.Behave = Behave;
        this.BehaveHooks = BehaveHooks;
    }

    if (typeof define === "function" && define.amd) {
        define("behave", [], function () {
            return Behave;
        });
    }

}).call(this);

function QueryCommandException(querycommand) {
    this.message = querycommand;
    this.name = 'QueryCommandException';
}