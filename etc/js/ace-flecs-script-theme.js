ace.define("ace/theme/flecs-script", ["require", "exports", "module", "ace/lib/dom"], 
function(require, exports, module) {
    exports.isDark = false; // Set to true if your theme is dark
    exports.cssClass = "ace-flecs-script"; // CSS class name for your theme
    exports.cssText = `
        .ace-flecs-script .ace_gutter {
            background: var(--bg-pane);
            color: var(--secondary-text);
        }
        .ace-flecs-script .ace_print-margin {
            width: 1px;
            background: var(--border);
        }
        .ace-flecs-script {
            background: var(--bg-pane);
            color: var(--primary-text);
        }
        .ace-flecs-script .ace_cursor {
            color: var(--green);
        }
        .ace-flecs-script .ace_marker-layer .ace_selection {
            background: var(--dark-blue);
        }
        .ace-flecs-script.ace_multiselect .ace_selection.ace_start {
            box-shadow: 0 0 3px 0px var(--ace-selection-shadow);
            border-radius: 2px;
        }
        .ace-flecs-script .ace_marker-layer .ace_step {
            background: rgb(102, 82, 0);
        }
        .ace-flecs-script .ace_marker-layer .ace_bracket {
            margin: -1px 0 0 -1px;
            border: 1px solid var(--ace-bracket-border);
        }
        .ace-flecs-script .ace_marker-layer .ace_active-line {
            background: var(--ace-active-line-bg);
        }
        .ace-flecs-script .ace_gutter-active-line {
            color: var(--primary-text);
        }
        .ace-flecs-script .ace_marker-layer .ace_selected-word {
            border: 1px solid var(--ace-selected-word-border);
        }
        .ace-flecs-script .ace_invisible {
            color: var(--ace-invisible);
        }
        .ace-flecs-script .ace_keyword {
        color: var(--purple);
        }
        .ace-flecs-script .ace_meta,
        .ace-flecs-script .ace_storage,
        .ace-flecs-script .ace_storage.ace_type,
        .ace-flecs-script .ace_support.ace_type {
            color: var(--blue);
        }
        .ace-flecs-script .ace_keyword.ace_operator {
            color: var(--secondary-text);
        }
        .ace-flecs-script .ace_constant.ace_character,
        .ace-flecs-script .ace_constant.ace_language,
        .ace-flecs-script .ace_constant.ace_numeric,
        .ace-flecs-script .ace_keyword.ace_other.ace_unit,
        .ace-flecs-script .ace_support.ace_constant,
        .ace-flecs-script .ace_variable.ace_parameter {
            color: var(--bright-green);
        }
        .ace-flecs-script .ace_invalid {
            color: #f8f8f0;
            background-color: #f92672;
        }
        .ace-flecs-script .ace_fold {
            background-color: var(--ace-fold-bg);
            border-color: var(--primary-text);
        }
        .ace-flecs-script .ace_comment {
            color: var(--tertiary-text);
        }
        .ace-flecs-script .ace_entity.ace_name.ace_function,
        .ace-flecs-script .ace_support.ace_function,
        .ace-flecs-script .ace_variable {
            color: var(--green);
        }
        .ace-flecs-script .ace_support.ace_class,
        .ace-flecs-script .ace_support.ace_type {
            color: var(--ace-class-type);
        }
        .ace-flecs-script .ace_string {
            color: var(--orange);
        }
        .ace-flecs-script .ace_entity.ace_other.ace_attribute-name {
            color: var(--ace-attribute);
        }
        .ace-flecs-script .ace_indent-guide {
            border-style: solid;
            border-width: 0px;
            border-right-width: 1px;
            border-color: var(--border);
        }
    `;
    var dom = require("../lib/dom");
    dom.importCssString(exports.cssText, exports.cssClass);
});
