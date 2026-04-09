#!/usr/bin/env bun
// @bun
var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __toESM = (mod, isNodeMode, target) => {
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to =
    isNodeMode || !mod || !mod.__esModule
      ? __defProp(target, 'default', { value: mod, enumerable: true })
      : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: () => mod[key],
        enumerable: true,
      });
  return to;
};
var __commonJS = (cb, mod) => () => (
  mod || cb((mod = { exports: {} }).exports, mod),
  mod.exports
);
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: (newValue) => (all[name] = () => newValue),
    });
};
var __esm = (fn, res) => () => (fn && (res = fn((fn = 0))), res);
var __require = import.meta.require;

// node_modules/commander/lib/error.js
var require_error = __commonJS((exports) => {
  class CommanderError extends Error {
    constructor(exitCode, code, message) {
      super(message);
      Error.captureStackTrace(this, this.constructor);
      this.name = this.constructor.name;
      this.code = code;
      this.exitCode = exitCode;
      this.nestedError = undefined;
    }
  }

  class InvalidArgumentError extends CommanderError {
    constructor(message) {
      super(1, 'commander.invalidArgument', message);
      Error.captureStackTrace(this, this.constructor);
      this.name = this.constructor.name;
    }
  }
  exports.CommanderError = CommanderError;
  exports.InvalidArgumentError = InvalidArgumentError;
});

// node_modules/commander/lib/argument.js
var require_argument = __commonJS((exports) => {
  var { InvalidArgumentError } = require_error();

  class Argument {
    constructor(name, description) {
      this.description = description || '';
      this.variadic = false;
      this.parseArg = undefined;
      this.defaultValue = undefined;
      this.defaultValueDescription = undefined;
      this.argChoices = undefined;
      switch (name[0]) {
        case '<':
          this.required = true;
          this._name = name.slice(1, -1);
          break;
        case '[':
          this.required = false;
          this._name = name.slice(1, -1);
          break;
        default:
          this.required = true;
          this._name = name;
          break;
      }
      if (this._name.endsWith('...')) {
        this.variadic = true;
        this._name = this._name.slice(0, -3);
      }
    }
    name() {
      return this._name;
    }
    _collectValue(value, previous) {
      if (previous === this.defaultValue || !Array.isArray(previous)) {
        return [value];
      }
      previous.push(value);
      return previous;
    }
    default(value, description) {
      this.defaultValue = value;
      this.defaultValueDescription = description;
      return this;
    }
    argParser(fn) {
      this.parseArg = fn;
      return this;
    }
    choices(values) {
      this.argChoices = values.slice();
      this.parseArg = (arg, previous) => {
        if (!this.argChoices.includes(arg)) {
          throw new InvalidArgumentError(
            `Allowed choices are ${this.argChoices.join(', ')}.`,
          );
        }
        if (this.variadic) {
          return this._collectValue(arg, previous);
        }
        return arg;
      };
      return this;
    }
    argRequired() {
      this.required = true;
      return this;
    }
    argOptional() {
      this.required = false;
      return this;
    }
  }
  function humanReadableArgName(arg) {
    const nameOutput = arg.name() + (arg.variadic === true ? '...' : '');
    return arg.required ? '<' + nameOutput + '>' : '[' + nameOutput + ']';
  }
  exports.Argument = Argument;
  exports.humanReadableArgName = humanReadableArgName;
});

// node_modules/commander/lib/help.js
var require_help = __commonJS((exports) => {
  var { humanReadableArgName } = require_argument();

  class Help {
    constructor() {
      this.helpWidth = undefined;
      this.minWidthToWrap = 40;
      this.sortSubcommands = false;
      this.sortOptions = false;
      this.showGlobalOptions = false;
    }
    prepareContext(contextOptions) {
      this.helpWidth = this.helpWidth ?? contextOptions.helpWidth ?? 80;
    }
    visibleCommands(cmd) {
      const visibleCommands = cmd.commands.filter((cmd2) => !cmd2._hidden);
      const helpCommand = cmd._getHelpCommand();
      if (helpCommand && !helpCommand._hidden) {
        visibleCommands.push(helpCommand);
      }
      if (this.sortSubcommands) {
        visibleCommands.sort((a, b) => {
          return a.name().localeCompare(b.name());
        });
      }
      return visibleCommands;
    }
    compareOptions(a, b) {
      const getSortKey = (option) => {
        return option.short
          ? option.short.replace(/^-/, '')
          : option.long.replace(/^--/, '');
      };
      return getSortKey(a).localeCompare(getSortKey(b));
    }
    visibleOptions(cmd) {
      const visibleOptions = cmd.options.filter((option) => !option.hidden);
      const helpOption = cmd._getHelpOption();
      if (helpOption && !helpOption.hidden) {
        const removeShort =
          helpOption.short && cmd._findOption(helpOption.short);
        const removeLong = helpOption.long && cmd._findOption(helpOption.long);
        if (!removeShort && !removeLong) {
          visibleOptions.push(helpOption);
        } else if (helpOption.long && !removeLong) {
          visibleOptions.push(
            cmd.createOption(helpOption.long, helpOption.description),
          );
        } else if (helpOption.short && !removeShort) {
          visibleOptions.push(
            cmd.createOption(helpOption.short, helpOption.description),
          );
        }
      }
      if (this.sortOptions) {
        visibleOptions.sort(this.compareOptions);
      }
      return visibleOptions;
    }
    visibleGlobalOptions(cmd) {
      if (!this.showGlobalOptions) return [];
      const globalOptions = [];
      for (
        let ancestorCmd = cmd.parent;
        ancestorCmd;
        ancestorCmd = ancestorCmd.parent
      ) {
        const visibleOptions = ancestorCmd.options.filter(
          (option) => !option.hidden,
        );
        globalOptions.push(...visibleOptions);
      }
      if (this.sortOptions) {
        globalOptions.sort(this.compareOptions);
      }
      return globalOptions;
    }
    visibleArguments(cmd) {
      if (cmd._argsDescription) {
        cmd.registeredArguments.forEach((argument) => {
          argument.description =
            argument.description || cmd._argsDescription[argument.name()] || '';
        });
      }
      if (cmd.registeredArguments.find((argument) => argument.description)) {
        return cmd.registeredArguments;
      }
      return [];
    }
    subcommandTerm(cmd) {
      const args = cmd.registeredArguments
        .map((arg) => humanReadableArgName(arg))
        .join(' ');
      return (
        cmd._name +
        (cmd._aliases[0] ? '|' + cmd._aliases[0] : '') +
        (cmd.options.length ? ' [options]' : '') +
        (args ? ' ' + args : '')
      );
    }
    optionTerm(option) {
      return option.flags;
    }
    argumentTerm(argument) {
      return argument.name();
    }
    longestSubcommandTermLength(cmd, helper) {
      return helper.visibleCommands(cmd).reduce((max, command) => {
        return Math.max(
          max,
          this.displayWidth(
            helper.styleSubcommandTerm(helper.subcommandTerm(command)),
          ),
        );
      }, 0);
    }
    longestOptionTermLength(cmd, helper) {
      return helper.visibleOptions(cmd).reduce((max, option) => {
        return Math.max(
          max,
          this.displayWidth(helper.styleOptionTerm(helper.optionTerm(option))),
        );
      }, 0);
    }
    longestGlobalOptionTermLength(cmd, helper) {
      return helper.visibleGlobalOptions(cmd).reduce((max, option) => {
        return Math.max(
          max,
          this.displayWidth(helper.styleOptionTerm(helper.optionTerm(option))),
        );
      }, 0);
    }
    longestArgumentTermLength(cmd, helper) {
      return helper.visibleArguments(cmd).reduce((max, argument) => {
        return Math.max(
          max,
          this.displayWidth(
            helper.styleArgumentTerm(helper.argumentTerm(argument)),
          ),
        );
      }, 0);
    }
    commandUsage(cmd) {
      let cmdName = cmd._name;
      if (cmd._aliases[0]) {
        cmdName = cmdName + '|' + cmd._aliases[0];
      }
      let ancestorCmdNames = '';
      for (
        let ancestorCmd = cmd.parent;
        ancestorCmd;
        ancestorCmd = ancestorCmd.parent
      ) {
        ancestorCmdNames = ancestorCmd.name() + ' ' + ancestorCmdNames;
      }
      return ancestorCmdNames + cmdName + ' ' + cmd.usage();
    }
    commandDescription(cmd) {
      return cmd.description();
    }
    subcommandDescription(cmd) {
      return cmd.summary() || cmd.description();
    }
    optionDescription(option) {
      const extraInfo = [];
      if (option.argChoices) {
        extraInfo.push(
          `choices: ${option.argChoices.map((choice) => JSON.stringify(choice)).join(', ')}`,
        );
      }
      if (option.defaultValue !== undefined) {
        const showDefault =
          option.required ||
          option.optional ||
          (option.isBoolean() && typeof option.defaultValue === 'boolean');
        if (showDefault) {
          extraInfo.push(
            `default: ${option.defaultValueDescription || JSON.stringify(option.defaultValue)}`,
          );
        }
      }
      if (option.presetArg !== undefined && option.optional) {
        extraInfo.push(`preset: ${JSON.stringify(option.presetArg)}`);
      }
      if (option.envVar !== undefined) {
        extraInfo.push(`env: ${option.envVar}`);
      }
      if (extraInfo.length > 0) {
        const extraDescription = `(${extraInfo.join(', ')})`;
        if (option.description) {
          return `${option.description} ${extraDescription}`;
        }
        return extraDescription;
      }
      return option.description;
    }
    argumentDescription(argument) {
      const extraInfo = [];
      if (argument.argChoices) {
        extraInfo.push(
          `choices: ${argument.argChoices.map((choice) => JSON.stringify(choice)).join(', ')}`,
        );
      }
      if (argument.defaultValue !== undefined) {
        extraInfo.push(
          `default: ${argument.defaultValueDescription || JSON.stringify(argument.defaultValue)}`,
        );
      }
      if (extraInfo.length > 0) {
        const extraDescription = `(${extraInfo.join(', ')})`;
        if (argument.description) {
          return `${argument.description} ${extraDescription}`;
        }
        return extraDescription;
      }
      return argument.description;
    }
    formatItemList(heading, items, helper) {
      if (items.length === 0) return [];
      return [helper.styleTitle(heading), ...items, ''];
    }
    groupItems(unsortedItems, visibleItems, getGroup) {
      const result = new Map();
      unsortedItems.forEach((item) => {
        const group = getGroup(item);
        if (!result.has(group)) result.set(group, []);
      });
      visibleItems.forEach((item) => {
        const group = getGroup(item);
        if (!result.has(group)) {
          result.set(group, []);
        }
        result.get(group).push(item);
      });
      return result;
    }
    formatHelp(cmd, helper) {
      const termWidth = helper.padWidth(cmd, helper);
      const helpWidth = helper.helpWidth ?? 80;
      function callFormatItem(term, description) {
        return helper.formatItem(term, termWidth, description, helper);
      }
      let output = [
        `${helper.styleTitle('Usage:')} ${helper.styleUsage(helper.commandUsage(cmd))}`,
        '',
      ];
      const commandDescription = helper.commandDescription(cmd);
      if (commandDescription.length > 0) {
        output = output.concat([
          helper.boxWrap(
            helper.styleCommandDescription(commandDescription),
            helpWidth,
          ),
          '',
        ]);
      }
      const argumentList = helper.visibleArguments(cmd).map((argument) => {
        return callFormatItem(
          helper.styleArgumentTerm(helper.argumentTerm(argument)),
          helper.styleArgumentDescription(helper.argumentDescription(argument)),
        );
      });
      output = output.concat(
        this.formatItemList('Arguments:', argumentList, helper),
      );
      const optionGroups = this.groupItems(
        cmd.options,
        helper.visibleOptions(cmd),
        (option) => option.helpGroupHeading ?? 'Options:',
      );
      optionGroups.forEach((options, group) => {
        const optionList = options.map((option) => {
          return callFormatItem(
            helper.styleOptionTerm(helper.optionTerm(option)),
            helper.styleOptionDescription(helper.optionDescription(option)),
          );
        });
        output = output.concat(this.formatItemList(group, optionList, helper));
      });
      if (helper.showGlobalOptions) {
        const globalOptionList = helper
          .visibleGlobalOptions(cmd)
          .map((option) => {
            return callFormatItem(
              helper.styleOptionTerm(helper.optionTerm(option)),
              helper.styleOptionDescription(helper.optionDescription(option)),
            );
          });
        output = output.concat(
          this.formatItemList('Global Options:', globalOptionList, helper),
        );
      }
      const commandGroups = this.groupItems(
        cmd.commands,
        helper.visibleCommands(cmd),
        (sub) => sub.helpGroup() || 'Commands:',
      );
      commandGroups.forEach((commands, group) => {
        const commandList = commands.map((sub) => {
          return callFormatItem(
            helper.styleSubcommandTerm(helper.subcommandTerm(sub)),
            helper.styleSubcommandDescription(
              helper.subcommandDescription(sub),
            ),
          );
        });
        output = output.concat(this.formatItemList(group, commandList, helper));
      });
      return output.join(`
`);
    }
    displayWidth(str) {
      return stripColor(str).length;
    }
    styleTitle(str) {
      return str;
    }
    styleUsage(str) {
      return str
        .split(' ')
        .map((word) => {
          if (word === '[options]') return this.styleOptionText(word);
          if (word === '[command]') return this.styleSubcommandText(word);
          if (word[0] === '[' || word[0] === '<')
            return this.styleArgumentText(word);
          return this.styleCommandText(word);
        })
        .join(' ');
    }
    styleCommandDescription(str) {
      return this.styleDescriptionText(str);
    }
    styleOptionDescription(str) {
      return this.styleDescriptionText(str);
    }
    styleSubcommandDescription(str) {
      return this.styleDescriptionText(str);
    }
    styleArgumentDescription(str) {
      return this.styleDescriptionText(str);
    }
    styleDescriptionText(str) {
      return str;
    }
    styleOptionTerm(str) {
      return this.styleOptionText(str);
    }
    styleSubcommandTerm(str) {
      return str
        .split(' ')
        .map((word) => {
          if (word === '[options]') return this.styleOptionText(word);
          if (word[0] === '[' || word[0] === '<')
            return this.styleArgumentText(word);
          return this.styleSubcommandText(word);
        })
        .join(' ');
    }
    styleArgumentTerm(str) {
      return this.styleArgumentText(str);
    }
    styleOptionText(str) {
      return str;
    }
    styleArgumentText(str) {
      return str;
    }
    styleSubcommandText(str) {
      return str;
    }
    styleCommandText(str) {
      return str;
    }
    padWidth(cmd, helper) {
      return Math.max(
        helper.longestOptionTermLength(cmd, helper),
        helper.longestGlobalOptionTermLength(cmd, helper),
        helper.longestSubcommandTermLength(cmd, helper),
        helper.longestArgumentTermLength(cmd, helper),
      );
    }
    preformatted(str) {
      return /\n[^\S\r\n]/.test(str);
    }
    formatItem(term, termWidth, description, helper) {
      const itemIndent = 2;
      const itemIndentStr = ' '.repeat(itemIndent);
      if (!description) return itemIndentStr + term;
      const paddedTerm = term.padEnd(
        termWidth + term.length - helper.displayWidth(term),
      );
      const spacerWidth = 2;
      const helpWidth = this.helpWidth ?? 80;
      const remainingWidth = helpWidth - termWidth - spacerWidth - itemIndent;
      let formattedDescription;
      if (
        remainingWidth < this.minWidthToWrap ||
        helper.preformatted(description)
      ) {
        formattedDescription = description;
      } else {
        const wrappedDescription = helper.boxWrap(description, remainingWidth);
        formattedDescription = wrappedDescription.replace(
          /\n/g,
          `
` + ' '.repeat(termWidth + spacerWidth),
        );
      }
      return (
        itemIndentStr +
        paddedTerm +
        ' '.repeat(spacerWidth) +
        formattedDescription.replace(
          /\n/g,
          `
${itemIndentStr}`,
        )
      );
    }
    boxWrap(str, width) {
      if (width < this.minWidthToWrap) return str;
      const rawLines = str.split(/\r\n|\n/);
      const chunkPattern = /[\s]*[^\s]+/g;
      const wrappedLines = [];
      rawLines.forEach((line) => {
        const chunks = line.match(chunkPattern);
        if (chunks === null) {
          wrappedLines.push('');
          return;
        }
        let sumChunks = [chunks.shift()];
        let sumWidth = this.displayWidth(sumChunks[0]);
        chunks.forEach((chunk) => {
          const visibleWidth = this.displayWidth(chunk);
          if (sumWidth + visibleWidth <= width) {
            sumChunks.push(chunk);
            sumWidth += visibleWidth;
            return;
          }
          wrappedLines.push(sumChunks.join(''));
          const nextChunk = chunk.trimStart();
          sumChunks = [nextChunk];
          sumWidth = this.displayWidth(nextChunk);
        });
        wrappedLines.push(sumChunks.join(''));
      });
      return wrappedLines.join(`
`);
    }
  }
  function stripColor(str) {
    const sgrPattern = /\x1b\[\d*(;\d*)*m/g;
    return str.replace(sgrPattern, '');
  }
  exports.Help = Help;
  exports.stripColor = stripColor;
});

// node_modules/commander/lib/option.js
var require_option = __commonJS((exports) => {
  var { InvalidArgumentError } = require_error();

  class Option {
    constructor(flags, description) {
      this.flags = flags;
      this.description = description || '';
      this.required = flags.includes('<');
      this.optional = flags.includes('[');
      this.variadic = /\w\.\.\.[>\]]$/.test(flags);
      this.mandatory = false;
      const optionFlags = splitOptionFlags(flags);
      this.short = optionFlags.shortFlag;
      this.long = optionFlags.longFlag;
      this.negate = false;
      if (this.long) {
        this.negate = this.long.startsWith('--no-');
      }
      this.defaultValue = undefined;
      this.defaultValueDescription = undefined;
      this.presetArg = undefined;
      this.envVar = undefined;
      this.parseArg = undefined;
      this.hidden = false;
      this.argChoices = undefined;
      this.conflictsWith = [];
      this.implied = undefined;
      this.helpGroupHeading = undefined;
    }
    default(value, description) {
      this.defaultValue = value;
      this.defaultValueDescription = description;
      return this;
    }
    preset(arg) {
      this.presetArg = arg;
      return this;
    }
    conflicts(names) {
      this.conflictsWith = this.conflictsWith.concat(names);
      return this;
    }
    implies(impliedOptionValues) {
      let newImplied = impliedOptionValues;
      if (typeof impliedOptionValues === 'string') {
        newImplied = { [impliedOptionValues]: true };
      }
      this.implied = Object.assign(this.implied || {}, newImplied);
      return this;
    }
    env(name) {
      this.envVar = name;
      return this;
    }
    argParser(fn) {
      this.parseArg = fn;
      return this;
    }
    makeOptionMandatory(mandatory = true) {
      this.mandatory = !!mandatory;
      return this;
    }
    hideHelp(hide = true) {
      this.hidden = !!hide;
      return this;
    }
    _collectValue(value, previous) {
      if (previous === this.defaultValue || !Array.isArray(previous)) {
        return [value];
      }
      previous.push(value);
      return previous;
    }
    choices(values) {
      this.argChoices = values.slice();
      this.parseArg = (arg, previous) => {
        if (!this.argChoices.includes(arg)) {
          throw new InvalidArgumentError(
            `Allowed choices are ${this.argChoices.join(', ')}.`,
          );
        }
        if (this.variadic) {
          return this._collectValue(arg, previous);
        }
        return arg;
      };
      return this;
    }
    name() {
      if (this.long) {
        return this.long.replace(/^--/, '');
      }
      return this.short.replace(/^-/, '');
    }
    attributeName() {
      if (this.negate) {
        return camelcase(this.name().replace(/^no-/, ''));
      }
      return camelcase(this.name());
    }
    helpGroup(heading) {
      this.helpGroupHeading = heading;
      return this;
    }
    is(arg) {
      return this.short === arg || this.long === arg;
    }
    isBoolean() {
      return !this.required && !this.optional && !this.negate;
    }
  }

  class DualOptions {
    constructor(options) {
      this.positiveOptions = new Map();
      this.negativeOptions = new Map();
      this.dualOptions = new Set();
      options.forEach((option) => {
        if (option.negate) {
          this.negativeOptions.set(option.attributeName(), option);
        } else {
          this.positiveOptions.set(option.attributeName(), option);
        }
      });
      this.negativeOptions.forEach((value, key) => {
        if (this.positiveOptions.has(key)) {
          this.dualOptions.add(key);
        }
      });
    }
    valueFromOption(value, option) {
      const optionKey = option.attributeName();
      if (!this.dualOptions.has(optionKey)) return true;
      const preset = this.negativeOptions.get(optionKey).presetArg;
      const negativeValue = preset !== undefined ? preset : false;
      return option.negate === (negativeValue === value);
    }
  }
  function camelcase(str) {
    return str.split('-').reduce((str2, word) => {
      return str2 + word[0].toUpperCase() + word.slice(1);
    });
  }
  function splitOptionFlags(flags) {
    let shortFlag;
    let longFlag;
    const shortFlagExp = /^-[^-]$/;
    const longFlagExp = /^--[^-]/;
    const flagParts = flags.split(/[ |,]+/).concat('guard');
    if (shortFlagExp.test(flagParts[0])) shortFlag = flagParts.shift();
    if (longFlagExp.test(flagParts[0])) longFlag = flagParts.shift();
    if (!shortFlag && shortFlagExp.test(flagParts[0]))
      shortFlag = flagParts.shift();
    if (!shortFlag && longFlagExp.test(flagParts[0])) {
      shortFlag = longFlag;
      longFlag = flagParts.shift();
    }
    if (flagParts[0].startsWith('-')) {
      const unsupportedFlag = flagParts[0];
      const baseError = `option creation failed due to '${unsupportedFlag}' in option flags '${flags}'`;
      if (/^-[^-][^-]/.test(unsupportedFlag))
        throw new Error(`${baseError}
- a short flag is a single dash and a single character
  - either use a single dash and a single character (for a short flag)
  - or use a double dash for a long option (and can have two, like '--ws, --workspace')`);
      if (shortFlagExp.test(unsupportedFlag))
        throw new Error(`${baseError}
- too many short flags`);
      if (longFlagExp.test(unsupportedFlag))
        throw new Error(`${baseError}
- too many long flags`);
      throw new Error(`${baseError}
- unrecognised flag format`);
    }
    if (shortFlag === undefined && longFlag === undefined)
      throw new Error(
        `option creation failed due to no flags found in '${flags}'.`,
      );
    return { shortFlag, longFlag };
  }
  exports.Option = Option;
  exports.DualOptions = DualOptions;
});

// node_modules/commander/lib/suggestSimilar.js
var require_suggestSimilar = __commonJS((exports) => {
  var maxDistance = 3;
  function editDistance(a, b) {
    if (Math.abs(a.length - b.length) > maxDistance)
      return Math.max(a.length, b.length);
    const d = [];
    for (let i = 0; i <= a.length; i++) {
      d[i] = [i];
    }
    for (let j = 0; j <= b.length; j++) {
      d[0][j] = j;
    }
    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        let cost = 1;
        if (a[i - 1] === b[j - 1]) {
          cost = 0;
        } else {
          cost = 1;
        }
        d[i][j] = Math.min(
          d[i - 1][j] + 1,
          d[i][j - 1] + 1,
          d[i - 1][j - 1] + cost,
        );
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
          d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
        }
      }
    }
    return d[a.length][b.length];
  }
  function suggestSimilar(word, candidates) {
    if (!candidates || candidates.length === 0) return '';
    candidates = Array.from(new Set(candidates));
    const searchingOptions = word.startsWith('--');
    if (searchingOptions) {
      word = word.slice(2);
      candidates = candidates.map((candidate) => candidate.slice(2));
    }
    let similar = [];
    let bestDistance = maxDistance;
    const minSimilarity = 0.4;
    candidates.forEach((candidate) => {
      if (candidate.length <= 1) return;
      const distance = editDistance(word, candidate);
      const length = Math.max(word.length, candidate.length);
      const similarity = (length - distance) / length;
      if (similarity > minSimilarity) {
        if (distance < bestDistance) {
          bestDistance = distance;
          similar = [candidate];
        } else if (distance === bestDistance) {
          similar.push(candidate);
        }
      }
    });
    similar.sort((a, b) => a.localeCompare(b));
    if (searchingOptions) {
      similar = similar.map((candidate) => `--${candidate}`);
    }
    if (similar.length > 1) {
      return `
(Did you mean one of ${similar.join(', ')}?)`;
    }
    if (similar.length === 1) {
      return `
(Did you mean ${similar[0]}?)`;
    }
    return '';
  }
  exports.suggestSimilar = suggestSimilar;
});

// node_modules/commander/lib/command.js
var require_command = __commonJS((exports) => {
  var EventEmitter = __require('events').EventEmitter;
  var childProcess = __require('child_process');
  var path = __require('path');
  var fs = __require('fs');
  var process2 = __require('process');
  var { Argument, humanReadableArgName } = require_argument();
  var { CommanderError } = require_error();
  var { Help, stripColor } = require_help();
  var { Option, DualOptions } = require_option();
  var { suggestSimilar } = require_suggestSimilar();

  class Command extends EventEmitter {
    constructor(name) {
      super();
      this.commands = [];
      this.options = [];
      this.parent = null;
      this._allowUnknownOption = false;
      this._allowExcessArguments = false;
      this.registeredArguments = [];
      this._args = this.registeredArguments;
      this.args = [];
      this.rawArgs = [];
      this.processedArgs = [];
      this._scriptPath = null;
      this._name = name || '';
      this._optionValues = {};
      this._optionValueSources = {};
      this._storeOptionsAsProperties = false;
      this._actionHandler = null;
      this._executableHandler = false;
      this._executableFile = null;
      this._executableDir = null;
      this._defaultCommandName = null;
      this._exitCallback = null;
      this._aliases = [];
      this._combineFlagAndOptionalValue = true;
      this._description = '';
      this._summary = '';
      this._argsDescription = undefined;
      this._enablePositionalOptions = false;
      this._passThroughOptions = false;
      this._lifeCycleHooks = {};
      this._showHelpAfterError = false;
      this._showSuggestionAfterError = true;
      this._savedState = null;
      this._outputConfiguration = {
        writeOut: (str) => process2.stdout.write(str),
        writeErr: (str) => process2.stderr.write(str),
        outputError: (str, write) => write(str),
        getOutHelpWidth: () =>
          process2.stdout.isTTY ? process2.stdout.columns : undefined,
        getErrHelpWidth: () =>
          process2.stderr.isTTY ? process2.stderr.columns : undefined,
        getOutHasColors: () =>
          useColor() ??
          (process2.stdout.isTTY && process2.stdout.hasColors?.()),
        getErrHasColors: () =>
          useColor() ??
          (process2.stderr.isTTY && process2.stderr.hasColors?.()),
        stripColor: (str) => stripColor(str),
      };
      this._hidden = false;
      this._helpOption = undefined;
      this._addImplicitHelpCommand = undefined;
      this._helpCommand = undefined;
      this._helpConfiguration = {};
      this._helpGroupHeading = undefined;
      this._defaultCommandGroup = undefined;
      this._defaultOptionGroup = undefined;
    }
    copyInheritedSettings(sourceCommand) {
      this._outputConfiguration = sourceCommand._outputConfiguration;
      this._helpOption = sourceCommand._helpOption;
      this._helpCommand = sourceCommand._helpCommand;
      this._helpConfiguration = sourceCommand._helpConfiguration;
      this._exitCallback = sourceCommand._exitCallback;
      this._storeOptionsAsProperties = sourceCommand._storeOptionsAsProperties;
      this._combineFlagAndOptionalValue =
        sourceCommand._combineFlagAndOptionalValue;
      this._allowExcessArguments = sourceCommand._allowExcessArguments;
      this._enablePositionalOptions = sourceCommand._enablePositionalOptions;
      this._showHelpAfterError = sourceCommand._showHelpAfterError;
      this._showSuggestionAfterError = sourceCommand._showSuggestionAfterError;
      return this;
    }
    _getCommandAndAncestors() {
      const result = [];
      for (let command = this; command; command = command.parent) {
        result.push(command);
      }
      return result;
    }
    command(nameAndArgs, actionOptsOrExecDesc, execOpts) {
      let desc = actionOptsOrExecDesc;
      let opts = execOpts;
      if (typeof desc === 'object' && desc !== null) {
        opts = desc;
        desc = null;
      }
      opts = opts || {};
      const [, name, args] = nameAndArgs.match(/([^ ]+) *(.*)/);
      const cmd = this.createCommand(name);
      if (desc) {
        cmd.description(desc);
        cmd._executableHandler = true;
      }
      if (opts.isDefault) this._defaultCommandName = cmd._name;
      cmd._hidden = !!(opts.noHelp || opts.hidden);
      cmd._executableFile = opts.executableFile || null;
      if (args) cmd.arguments(args);
      this._registerCommand(cmd);
      cmd.parent = this;
      cmd.copyInheritedSettings(this);
      if (desc) return this;
      return cmd;
    }
    createCommand(name) {
      return new Command(name);
    }
    createHelp() {
      return Object.assign(new Help(), this.configureHelp());
    }
    configureHelp(configuration) {
      if (configuration === undefined) return this._helpConfiguration;
      this._helpConfiguration = configuration;
      return this;
    }
    configureOutput(configuration) {
      if (configuration === undefined) return this._outputConfiguration;
      this._outputConfiguration = {
        ...this._outputConfiguration,
        ...configuration,
      };
      return this;
    }
    showHelpAfterError(displayHelp = true) {
      if (typeof displayHelp !== 'string') displayHelp = !!displayHelp;
      this._showHelpAfterError = displayHelp;
      return this;
    }
    showSuggestionAfterError(displaySuggestion = true) {
      this._showSuggestionAfterError = !!displaySuggestion;
      return this;
    }
    addCommand(cmd, opts) {
      if (!cmd._name) {
        throw new Error(`Command passed to .addCommand() must have a name
- specify the name in Command constructor or using .name()`);
      }
      opts = opts || {};
      if (opts.isDefault) this._defaultCommandName = cmd._name;
      if (opts.noHelp || opts.hidden) cmd._hidden = true;
      this._registerCommand(cmd);
      cmd.parent = this;
      cmd._checkForBrokenPassThrough();
      return this;
    }
    createArgument(name, description) {
      return new Argument(name, description);
    }
    argument(name, description, parseArg, defaultValue) {
      const argument = this.createArgument(name, description);
      if (typeof parseArg === 'function') {
        argument.default(defaultValue).argParser(parseArg);
      } else {
        argument.default(parseArg);
      }
      this.addArgument(argument);
      return this;
    }
    arguments(names) {
      names
        .trim()
        .split(/ +/)
        .forEach((detail) => {
          this.argument(detail);
        });
      return this;
    }
    addArgument(argument) {
      const previousArgument = this.registeredArguments.slice(-1)[0];
      if (previousArgument?.variadic) {
        throw new Error(
          `only the last argument can be variadic '${previousArgument.name()}'`,
        );
      }
      if (
        argument.required &&
        argument.defaultValue !== undefined &&
        argument.parseArg === undefined
      ) {
        throw new Error(
          `a default value for a required argument is never used: '${argument.name()}'`,
        );
      }
      this.registeredArguments.push(argument);
      return this;
    }
    helpCommand(enableOrNameAndArgs, description) {
      if (typeof enableOrNameAndArgs === 'boolean') {
        this._addImplicitHelpCommand = enableOrNameAndArgs;
        if (enableOrNameAndArgs && this._defaultCommandGroup) {
          this._initCommandGroup(this._getHelpCommand());
        }
        return this;
      }
      const nameAndArgs = enableOrNameAndArgs ?? 'help [command]';
      const [, helpName, helpArgs] = nameAndArgs.match(/([^ ]+) *(.*)/);
      const helpDescription = description ?? 'display help for command';
      const helpCommand = this.createCommand(helpName);
      helpCommand.helpOption(false);
      if (helpArgs) helpCommand.arguments(helpArgs);
      if (helpDescription) helpCommand.description(helpDescription);
      this._addImplicitHelpCommand = true;
      this._helpCommand = helpCommand;
      if (enableOrNameAndArgs || description)
        this._initCommandGroup(helpCommand);
      return this;
    }
    addHelpCommand(helpCommand, deprecatedDescription) {
      if (typeof helpCommand !== 'object') {
        this.helpCommand(helpCommand, deprecatedDescription);
        return this;
      }
      this._addImplicitHelpCommand = true;
      this._helpCommand = helpCommand;
      this._initCommandGroup(helpCommand);
      return this;
    }
    _getHelpCommand() {
      const hasImplicitHelpCommand =
        this._addImplicitHelpCommand ??
        (this.commands.length &&
          !this._actionHandler &&
          !this._findCommand('help'));
      if (hasImplicitHelpCommand) {
        if (this._helpCommand === undefined) {
          this.helpCommand(undefined, undefined);
        }
        return this._helpCommand;
      }
      return null;
    }
    hook(event, listener) {
      const allowedValues = ['preSubcommand', 'preAction', 'postAction'];
      if (!allowedValues.includes(event)) {
        throw new Error(`Unexpected value for event passed to hook : '${event}'.
Expecting one of '${allowedValues.join("', '")}'`);
      }
      if (this._lifeCycleHooks[event]) {
        this._lifeCycleHooks[event].push(listener);
      } else {
        this._lifeCycleHooks[event] = [listener];
      }
      return this;
    }
    exitOverride(fn) {
      if (fn) {
        this._exitCallback = fn;
      } else {
        this._exitCallback = (err) => {
          if (err.code !== 'commander.executeSubCommandAsync') {
            throw err;
          } else {
          }
        };
      }
      return this;
    }
    _exit(exitCode, code, message) {
      if (this._exitCallback) {
        this._exitCallback(new CommanderError(exitCode, code, message));
      }
      process2.exit(exitCode);
    }
    action(fn) {
      const listener = (args) => {
        const expectedArgsCount = this.registeredArguments.length;
        const actionArgs = args.slice(0, expectedArgsCount);
        if (this._storeOptionsAsProperties) {
          actionArgs[expectedArgsCount] = this;
        } else {
          actionArgs[expectedArgsCount] = this.opts();
        }
        actionArgs.push(this);
        return fn.apply(this, actionArgs);
      };
      this._actionHandler = listener;
      return this;
    }
    createOption(flags, description) {
      return new Option(flags, description);
    }
    _callParseArg(target, value, previous, invalidArgumentMessage) {
      try {
        return target.parseArg(value, previous);
      } catch (err) {
        if (err.code === 'commander.invalidArgument') {
          const message = `${invalidArgumentMessage} ${err.message}`;
          this.error(message, { exitCode: err.exitCode, code: err.code });
        }
        throw err;
      }
    }
    _registerOption(option) {
      const matchingOption =
        (option.short && this._findOption(option.short)) ||
        (option.long && this._findOption(option.long));
      if (matchingOption) {
        const matchingFlag =
          option.long && this._findOption(option.long)
            ? option.long
            : option.short;
        throw new Error(`Cannot add option '${option.flags}'${this._name && ` to command '${this._name}'`} due to conflicting flag '${matchingFlag}'
-  already used by option '${matchingOption.flags}'`);
      }
      this._initOptionGroup(option);
      this.options.push(option);
    }
    _registerCommand(command) {
      const knownBy = (cmd) => {
        return [cmd.name()].concat(cmd.aliases());
      };
      const alreadyUsed = knownBy(command).find((name) =>
        this._findCommand(name),
      );
      if (alreadyUsed) {
        const existingCmd = knownBy(this._findCommand(alreadyUsed)).join('|');
        const newCmd = knownBy(command).join('|');
        throw new Error(
          `cannot add command '${newCmd}' as already have command '${existingCmd}'`,
        );
      }
      this._initCommandGroup(command);
      this.commands.push(command);
    }
    addOption(option) {
      this._registerOption(option);
      const oname = option.name();
      const name = option.attributeName();
      if (option.negate) {
        const positiveLongFlag = option.long.replace(/^--no-/, '--');
        if (!this._findOption(positiveLongFlag)) {
          this.setOptionValueWithSource(
            name,
            option.defaultValue === undefined ? true : option.defaultValue,
            'default',
          );
        }
      } else if (option.defaultValue !== undefined) {
        this.setOptionValueWithSource(name, option.defaultValue, 'default');
      }
      const handleOptionValue = (val, invalidValueMessage, valueSource) => {
        if (val == null && option.presetArg !== undefined) {
          val = option.presetArg;
        }
        const oldValue = this.getOptionValue(name);
        if (val !== null && option.parseArg) {
          val = this._callParseArg(option, val, oldValue, invalidValueMessage);
        } else if (val !== null && option.variadic) {
          val = option._collectValue(val, oldValue);
        }
        if (val == null) {
          if (option.negate) {
            val = false;
          } else if (option.isBoolean() || option.optional) {
            val = true;
          } else {
            val = '';
          }
        }
        this.setOptionValueWithSource(name, val, valueSource);
      };
      this.on('option:' + oname, (val) => {
        const invalidValueMessage = `error: option '${option.flags}' argument '${val}' is invalid.`;
        handleOptionValue(val, invalidValueMessage, 'cli');
      });
      if (option.envVar) {
        this.on('optionEnv:' + oname, (val) => {
          const invalidValueMessage = `error: option '${option.flags}' value '${val}' from env '${option.envVar}' is invalid.`;
          handleOptionValue(val, invalidValueMessage, 'env');
        });
      }
      return this;
    }
    _optionEx(config, flags, description, fn, defaultValue) {
      if (typeof flags === 'object' && flags instanceof Option) {
        throw new Error(
          'To add an Option object use addOption() instead of option() or requiredOption()',
        );
      }
      const option = this.createOption(flags, description);
      option.makeOptionMandatory(!!config.mandatory);
      if (typeof fn === 'function') {
        option.default(defaultValue).argParser(fn);
      } else if (fn instanceof RegExp) {
        const regex = fn;
        fn = (val, def) => {
          const m = regex.exec(val);
          return m ? m[0] : def;
        };
        option.default(defaultValue).argParser(fn);
      } else {
        option.default(fn);
      }
      return this.addOption(option);
    }
    option(flags, description, parseArg, defaultValue) {
      return this._optionEx({}, flags, description, parseArg, defaultValue);
    }
    requiredOption(flags, description, parseArg, defaultValue) {
      return this._optionEx(
        { mandatory: true },
        flags,
        description,
        parseArg,
        defaultValue,
      );
    }
    combineFlagAndOptionalValue(combine = true) {
      this._combineFlagAndOptionalValue = !!combine;
      return this;
    }
    allowUnknownOption(allowUnknown = true) {
      this._allowUnknownOption = !!allowUnknown;
      return this;
    }
    allowExcessArguments(allowExcess = true) {
      this._allowExcessArguments = !!allowExcess;
      return this;
    }
    enablePositionalOptions(positional = true) {
      this._enablePositionalOptions = !!positional;
      return this;
    }
    passThroughOptions(passThrough = true) {
      this._passThroughOptions = !!passThrough;
      this._checkForBrokenPassThrough();
      return this;
    }
    _checkForBrokenPassThrough() {
      if (
        this.parent &&
        this._passThroughOptions &&
        !this.parent._enablePositionalOptions
      ) {
        throw new Error(
          `passThroughOptions cannot be used for '${this._name}' without turning on enablePositionalOptions for parent command(s)`,
        );
      }
    }
    storeOptionsAsProperties(storeAsProperties = true) {
      if (this.options.length) {
        throw new Error(
          'call .storeOptionsAsProperties() before adding options',
        );
      }
      if (Object.keys(this._optionValues).length) {
        throw new Error(
          'call .storeOptionsAsProperties() before setting option values',
        );
      }
      this._storeOptionsAsProperties = !!storeAsProperties;
      return this;
    }
    getOptionValue(key) {
      if (this._storeOptionsAsProperties) {
        return this[key];
      }
      return this._optionValues[key];
    }
    setOptionValue(key, value) {
      return this.setOptionValueWithSource(key, value, undefined);
    }
    setOptionValueWithSource(key, value, source) {
      if (this._storeOptionsAsProperties) {
        this[key] = value;
      } else {
        this._optionValues[key] = value;
      }
      this._optionValueSources[key] = source;
      return this;
    }
    getOptionValueSource(key) {
      return this._optionValueSources[key];
    }
    getOptionValueSourceWithGlobals(key) {
      let source;
      this._getCommandAndAncestors().forEach((cmd) => {
        if (cmd.getOptionValueSource(key) !== undefined) {
          source = cmd.getOptionValueSource(key);
        }
      });
      return source;
    }
    _prepareUserArgs(argv, parseOptions) {
      if (argv !== undefined && !Array.isArray(argv)) {
        throw new Error('first parameter to parse must be array or undefined');
      }
      parseOptions = parseOptions || {};
      if (argv === undefined && parseOptions.from === undefined) {
        if (process2.versions?.electron) {
          parseOptions.from = 'electron';
        }
        const execArgv = process2.execArgv ?? [];
        if (
          execArgv.includes('-e') ||
          execArgv.includes('--eval') ||
          execArgv.includes('-p') ||
          execArgv.includes('--print')
        ) {
          parseOptions.from = 'eval';
        }
      }
      if (argv === undefined) {
        argv = process2.argv;
      }
      this.rawArgs = argv.slice();
      let userArgs;
      switch (parseOptions.from) {
        case undefined:
        case 'node':
          this._scriptPath = argv[1];
          userArgs = argv.slice(2);
          break;
        case 'electron':
          if (process2.defaultApp) {
            this._scriptPath = argv[1];
            userArgs = argv.slice(2);
          } else {
            userArgs = argv.slice(1);
          }
          break;
        case 'user':
          userArgs = argv.slice(0);
          break;
        case 'eval':
          userArgs = argv.slice(1);
          break;
        default:
          throw new Error(
            `unexpected parse option { from: '${parseOptions.from}' }`,
          );
      }
      if (!this._name && this._scriptPath)
        this.nameFromFilename(this._scriptPath);
      this._name = this._name || 'program';
      return userArgs;
    }
    parse(argv, parseOptions) {
      this._prepareForParse();
      const userArgs = this._prepareUserArgs(argv, parseOptions);
      this._parseCommand([], userArgs);
      return this;
    }
    async parseAsync(argv, parseOptions) {
      this._prepareForParse();
      const userArgs = this._prepareUserArgs(argv, parseOptions);
      await this._parseCommand([], userArgs);
      return this;
    }
    _prepareForParse() {
      if (this._savedState === null) {
        this.saveStateBeforeParse();
      } else {
        this.restoreStateBeforeParse();
      }
    }
    saveStateBeforeParse() {
      this._savedState = {
        _name: this._name,
        _optionValues: { ...this._optionValues },
        _optionValueSources: { ...this._optionValueSources },
      };
    }
    restoreStateBeforeParse() {
      if (this._storeOptionsAsProperties)
        throw new Error(`Can not call parse again when storeOptionsAsProperties is true.
- either make a new Command for each call to parse, or stop storing options as properties`);
      this._name = this._savedState._name;
      this._scriptPath = null;
      this.rawArgs = [];
      this._optionValues = { ...this._savedState._optionValues };
      this._optionValueSources = { ...this._savedState._optionValueSources };
      this.args = [];
      this.processedArgs = [];
    }
    _checkForMissingExecutable(executableFile, executableDir, subcommandName) {
      if (fs.existsSync(executableFile)) return;
      const executableDirMessage = executableDir
        ? `searched for local subcommand relative to directory '${executableDir}'`
        : 'no directory for search for local subcommand, use .executableDir() to supply a custom directory';
      const executableMissing = `'${executableFile}' does not exist
 - if '${subcommandName}' is not meant to be an executable command, remove description parameter from '.command()' and use '.description()' instead
 - if the default executable name is not suitable, use the executableFile option to supply a custom name or path
 - ${executableDirMessage}`;
      throw new Error(executableMissing);
    }
    _executeSubCommand(subcommand, args) {
      args = args.slice();
      let launchWithNode = false;
      const sourceExt = ['.js', '.ts', '.tsx', '.mjs', '.cjs'];
      function findFile(baseDir, baseName) {
        const localBin = path.resolve(baseDir, baseName);
        if (fs.existsSync(localBin)) return localBin;
        if (sourceExt.includes(path.extname(baseName))) return;
        const foundExt = sourceExt.find((ext) =>
          fs.existsSync(`${localBin}${ext}`),
        );
        if (foundExt) return `${localBin}${foundExt}`;
        return;
      }
      this._checkForMissingMandatoryOptions();
      this._checkForConflictingOptions();
      let executableFile =
        subcommand._executableFile || `${this._name}-${subcommand._name}`;
      let executableDir = this._executableDir || '';
      if (this._scriptPath) {
        let resolvedScriptPath;
        try {
          resolvedScriptPath = fs.realpathSync(this._scriptPath);
        } catch {
          resolvedScriptPath = this._scriptPath;
        }
        executableDir = path.resolve(
          path.dirname(resolvedScriptPath),
          executableDir,
        );
      }
      if (executableDir) {
        let localFile = findFile(executableDir, executableFile);
        if (!localFile && !subcommand._executableFile && this._scriptPath) {
          const legacyName = path.basename(
            this._scriptPath,
            path.extname(this._scriptPath),
          );
          if (legacyName !== this._name) {
            localFile = findFile(
              executableDir,
              `${legacyName}-${subcommand._name}`,
            );
          }
        }
        executableFile = localFile || executableFile;
      }
      launchWithNode = sourceExt.includes(path.extname(executableFile));
      let proc;
      if (process2.platform !== 'win32') {
        if (launchWithNode) {
          args.unshift(executableFile);
          args = incrementNodeInspectorPort(process2.execArgv).concat(args);
          proc = childProcess.spawn(process2.argv[0], args, {
            stdio: 'inherit',
          });
        } else {
          proc = childProcess.spawn(executableFile, args, { stdio: 'inherit' });
        }
      } else {
        this._checkForMissingExecutable(
          executableFile,
          executableDir,
          subcommand._name,
        );
        args.unshift(executableFile);
        args = incrementNodeInspectorPort(process2.execArgv).concat(args);
        proc = childProcess.spawn(process2.execPath, args, {
          stdio: 'inherit',
        });
      }
      if (!proc.killed) {
        const signals = ['SIGUSR1', 'SIGUSR2', 'SIGTERM', 'SIGINT', 'SIGHUP'];
        signals.forEach((signal) => {
          process2.on(signal, () => {
            if (proc.killed === false && proc.exitCode === null) {
              proc.kill(signal);
            }
          });
        });
      }
      const exitCallback = this._exitCallback;
      proc.on('close', (code) => {
        code = code ?? 1;
        if (!exitCallback) {
          process2.exit(code);
        } else {
          exitCallback(
            new CommanderError(
              code,
              'commander.executeSubCommandAsync',
              '(close)',
            ),
          );
        }
      });
      proc.on('error', (err) => {
        if (err.code === 'ENOENT') {
          this._checkForMissingExecutable(
            executableFile,
            executableDir,
            subcommand._name,
          );
        } else if (err.code === 'EACCES') {
          throw new Error(`'${executableFile}' not executable`);
        }
        if (!exitCallback) {
          process2.exit(1);
        } else {
          const wrappedError = new CommanderError(
            1,
            'commander.executeSubCommandAsync',
            '(error)',
          );
          wrappedError.nestedError = err;
          exitCallback(wrappedError);
        }
      });
      this.runningCommand = proc;
    }
    _dispatchSubcommand(commandName, operands, unknown) {
      const subCommand = this._findCommand(commandName);
      if (!subCommand) this.help({ error: true });
      subCommand._prepareForParse();
      let promiseChain;
      promiseChain = this._chainOrCallSubCommandHook(
        promiseChain,
        subCommand,
        'preSubcommand',
      );
      promiseChain = this._chainOrCall(promiseChain, () => {
        if (subCommand._executableHandler) {
          this._executeSubCommand(subCommand, operands.concat(unknown));
        } else {
          return subCommand._parseCommand(operands, unknown);
        }
      });
      return promiseChain;
    }
    _dispatchHelpCommand(subcommandName) {
      if (!subcommandName) {
        this.help();
      }
      const subCommand = this._findCommand(subcommandName);
      if (subCommand && !subCommand._executableHandler) {
        subCommand.help();
      }
      return this._dispatchSubcommand(
        subcommandName,
        [],
        [
          this._getHelpOption()?.long ??
            this._getHelpOption()?.short ??
            '--help',
        ],
      );
    }
    _checkNumberOfArguments() {
      this.registeredArguments.forEach((arg, i) => {
        if (arg.required && this.args[i] == null) {
          this.missingArgument(arg.name());
        }
      });
      if (
        this.registeredArguments.length > 0 &&
        this.registeredArguments[this.registeredArguments.length - 1].variadic
      ) {
        return;
      }
      if (this.args.length > this.registeredArguments.length) {
        this._excessArguments(this.args);
      }
    }
    _processArguments() {
      const myParseArg = (argument, value, previous) => {
        let parsedValue = value;
        if (value !== null && argument.parseArg) {
          const invalidValueMessage = `error: command-argument value '${value}' is invalid for argument '${argument.name()}'.`;
          parsedValue = this._callParseArg(
            argument,
            value,
            previous,
            invalidValueMessage,
          );
        }
        return parsedValue;
      };
      this._checkNumberOfArguments();
      const processedArgs = [];
      this.registeredArguments.forEach((declaredArg, index) => {
        let value = declaredArg.defaultValue;
        if (declaredArg.variadic) {
          if (index < this.args.length) {
            value = this.args.slice(index);
            if (declaredArg.parseArg) {
              value = value.reduce((processed, v) => {
                return myParseArg(declaredArg, v, processed);
              }, declaredArg.defaultValue);
            }
          } else if (value === undefined) {
            value = [];
          }
        } else if (index < this.args.length) {
          value = this.args[index];
          if (declaredArg.parseArg) {
            value = myParseArg(declaredArg, value, declaredArg.defaultValue);
          }
        }
        processedArgs[index] = value;
      });
      this.processedArgs = processedArgs;
    }
    _chainOrCall(promise, fn) {
      if (promise?.then && typeof promise.then === 'function') {
        return promise.then(() => fn());
      }
      return fn();
    }
    _chainOrCallHooks(promise, event) {
      let result = promise;
      const hooks = [];
      this._getCommandAndAncestors()
        .reverse()
        .filter((cmd) => cmd._lifeCycleHooks[event] !== undefined)
        .forEach((hookedCommand) => {
          hookedCommand._lifeCycleHooks[event].forEach((callback) => {
            hooks.push({ hookedCommand, callback });
          });
        });
      if (event === 'postAction') {
        hooks.reverse();
      }
      hooks.forEach((hookDetail) => {
        result = this._chainOrCall(result, () => {
          return hookDetail.callback(hookDetail.hookedCommand, this);
        });
      });
      return result;
    }
    _chainOrCallSubCommandHook(promise, subCommand, event) {
      let result = promise;
      if (this._lifeCycleHooks[event] !== undefined) {
        this._lifeCycleHooks[event].forEach((hook) => {
          result = this._chainOrCall(result, () => {
            return hook(this, subCommand);
          });
        });
      }
      return result;
    }
    _parseCommand(operands, unknown) {
      const parsed = this.parseOptions(unknown);
      this._parseOptionsEnv();
      this._parseOptionsImplied();
      operands = operands.concat(parsed.operands);
      unknown = parsed.unknown;
      this.args = operands.concat(unknown);
      if (operands && this._findCommand(operands[0])) {
        return this._dispatchSubcommand(
          operands[0],
          operands.slice(1),
          unknown,
        );
      }
      if (
        this._getHelpCommand() &&
        operands[0] === this._getHelpCommand().name()
      ) {
        return this._dispatchHelpCommand(operands[1]);
      }
      if (this._defaultCommandName) {
        this._outputHelpIfRequested(unknown);
        return this._dispatchSubcommand(
          this._defaultCommandName,
          operands,
          unknown,
        );
      }
      if (
        this.commands.length &&
        this.args.length === 0 &&
        !this._actionHandler &&
        !this._defaultCommandName
      ) {
        this.help({ error: true });
      }
      this._outputHelpIfRequested(parsed.unknown);
      this._checkForMissingMandatoryOptions();
      this._checkForConflictingOptions();
      const checkForUnknownOptions = () => {
        if (parsed.unknown.length > 0) {
          this.unknownOption(parsed.unknown[0]);
        }
      };
      const commandEvent = `command:${this.name()}`;
      if (this._actionHandler) {
        checkForUnknownOptions();
        this._processArguments();
        let promiseChain;
        promiseChain = this._chainOrCallHooks(promiseChain, 'preAction');
        promiseChain = this._chainOrCall(promiseChain, () =>
          this._actionHandler(this.processedArgs),
        );
        if (this.parent) {
          promiseChain = this._chainOrCall(promiseChain, () => {
            this.parent.emit(commandEvent, operands, unknown);
          });
        }
        promiseChain = this._chainOrCallHooks(promiseChain, 'postAction');
        return promiseChain;
      }
      if (this.parent?.listenerCount(commandEvent)) {
        checkForUnknownOptions();
        this._processArguments();
        this.parent.emit(commandEvent, operands, unknown);
      } else if (operands.length) {
        if (this._findCommand('*')) {
          return this._dispatchSubcommand('*', operands, unknown);
        }
        if (this.listenerCount('command:*')) {
          this.emit('command:*', operands, unknown);
        } else if (this.commands.length) {
          this.unknownCommand();
        } else {
          checkForUnknownOptions();
          this._processArguments();
        }
      } else if (this.commands.length) {
        checkForUnknownOptions();
        this.help({ error: true });
      } else {
        checkForUnknownOptions();
        this._processArguments();
      }
    }
    _findCommand(name) {
      if (!name) return;
      return this.commands.find(
        (cmd) => cmd._name === name || cmd._aliases.includes(name),
      );
    }
    _findOption(arg) {
      return this.options.find((option) => option.is(arg));
    }
    _checkForMissingMandatoryOptions() {
      this._getCommandAndAncestors().forEach((cmd) => {
        cmd.options.forEach((anOption) => {
          if (
            anOption.mandatory &&
            cmd.getOptionValue(anOption.attributeName()) === undefined
          ) {
            cmd.missingMandatoryOptionValue(anOption);
          }
        });
      });
    }
    _checkForConflictingLocalOptions() {
      const definedNonDefaultOptions = this.options.filter((option) => {
        const optionKey = option.attributeName();
        if (this.getOptionValue(optionKey) === undefined) {
          return false;
        }
        return this.getOptionValueSource(optionKey) !== 'default';
      });
      const optionsWithConflicting = definedNonDefaultOptions.filter(
        (option) => option.conflictsWith.length > 0,
      );
      optionsWithConflicting.forEach((option) => {
        const conflictingAndDefined = definedNonDefaultOptions.find((defined) =>
          option.conflictsWith.includes(defined.attributeName()),
        );
        if (conflictingAndDefined) {
          this._conflictingOption(option, conflictingAndDefined);
        }
      });
    }
    _checkForConflictingOptions() {
      this._getCommandAndAncestors().forEach((cmd) => {
        cmd._checkForConflictingLocalOptions();
      });
    }
    parseOptions(args) {
      const operands = [];
      const unknown = [];
      let dest = operands;
      function maybeOption(arg) {
        return arg.length > 1 && arg[0] === '-';
      }
      const negativeNumberArg = (arg) => {
        if (!/^-(\d+|\d*\.\d+)(e[+-]?\d+)?$/.test(arg)) return false;
        return !this._getCommandAndAncestors().some((cmd) =>
          cmd.options
            .map((opt) => opt.short)
            .some((short) => /^-\d$/.test(short)),
        );
      };
      let activeVariadicOption = null;
      let activeGroup = null;
      let i = 0;
      while (i < args.length || activeGroup) {
        const arg = activeGroup ?? args[i++];
        activeGroup = null;
        if (arg === '--') {
          if (dest === unknown) dest.push(arg);
          dest.push(...args.slice(i));
          break;
        }
        if (
          activeVariadicOption &&
          (!maybeOption(arg) || negativeNumberArg(arg))
        ) {
          this.emit(`option:${activeVariadicOption.name()}`, arg);
          continue;
        }
        activeVariadicOption = null;
        if (maybeOption(arg)) {
          const option = this._findOption(arg);
          if (option) {
            if (option.required) {
              const value = args[i++];
              if (value === undefined) this.optionMissingArgument(option);
              this.emit(`option:${option.name()}`, value);
            } else if (option.optional) {
              let value = null;
              if (
                i < args.length &&
                (!maybeOption(args[i]) || negativeNumberArg(args[i]))
              ) {
                value = args[i++];
              }
              this.emit(`option:${option.name()}`, value);
            } else {
              this.emit(`option:${option.name()}`);
            }
            activeVariadicOption = option.variadic ? option : null;
            continue;
          }
        }
        if (arg.length > 2 && arg[0] === '-' && arg[1] !== '-') {
          const option = this._findOption(`-${arg[1]}`);
          if (option) {
            if (
              option.required ||
              (option.optional && this._combineFlagAndOptionalValue)
            ) {
              this.emit(`option:${option.name()}`, arg.slice(2));
            } else {
              this.emit(`option:${option.name()}`);
              activeGroup = `-${arg.slice(2)}`;
            }
            continue;
          }
        }
        if (/^--[^=]+=/.test(arg)) {
          const index = arg.indexOf('=');
          const option = this._findOption(arg.slice(0, index));
          if (option && (option.required || option.optional)) {
            this.emit(`option:${option.name()}`, arg.slice(index + 1));
            continue;
          }
        }
        if (
          dest === operands &&
          maybeOption(arg) &&
          !(this.commands.length === 0 && negativeNumberArg(arg))
        ) {
          dest = unknown;
        }
        if (
          (this._enablePositionalOptions || this._passThroughOptions) &&
          operands.length === 0 &&
          unknown.length === 0
        ) {
          if (this._findCommand(arg)) {
            operands.push(arg);
            unknown.push(...args.slice(i));
            break;
          } else if (
            this._getHelpCommand() &&
            arg === this._getHelpCommand().name()
          ) {
            operands.push(arg, ...args.slice(i));
            break;
          } else if (this._defaultCommandName) {
            unknown.push(arg, ...args.slice(i));
            break;
          }
        }
        if (this._passThroughOptions) {
          dest.push(arg, ...args.slice(i));
          break;
        }
        dest.push(arg);
      }
      return { operands, unknown };
    }
    opts() {
      if (this._storeOptionsAsProperties) {
        const result = {};
        const len = this.options.length;
        for (let i = 0; i < len; i++) {
          const key = this.options[i].attributeName();
          result[key] =
            key === this._versionOptionName ? this._version : this[key];
        }
        return result;
      }
      return this._optionValues;
    }
    optsWithGlobals() {
      return this._getCommandAndAncestors().reduce(
        (combinedOptions, cmd) => Object.assign(combinedOptions, cmd.opts()),
        {},
      );
    }
    error(message, errorOptions) {
      this._outputConfiguration.outputError(
        `${message}
`,
        this._outputConfiguration.writeErr,
      );
      if (typeof this._showHelpAfterError === 'string') {
        this._outputConfiguration.writeErr(`${this._showHelpAfterError}
`);
      } else if (this._showHelpAfterError) {
        this._outputConfiguration.writeErr(`
`);
        this.outputHelp({ error: true });
      }
      const config = errorOptions || {};
      const exitCode = config.exitCode || 1;
      const code = config.code || 'commander.error';
      this._exit(exitCode, code, message);
    }
    _parseOptionsEnv() {
      this.options.forEach((option) => {
        if (option.envVar && option.envVar in process2.env) {
          const optionKey = option.attributeName();
          if (
            this.getOptionValue(optionKey) === undefined ||
            ['default', 'config', 'env'].includes(
              this.getOptionValueSource(optionKey),
            )
          ) {
            if (option.required || option.optional) {
              this.emit(
                `optionEnv:${option.name()}`,
                process2.env[option.envVar],
              );
            } else {
              this.emit(`optionEnv:${option.name()}`);
            }
          }
        }
      });
    }
    _parseOptionsImplied() {
      const dualHelper = new DualOptions(this.options);
      const hasCustomOptionValue = (optionKey) => {
        return (
          this.getOptionValue(optionKey) !== undefined &&
          !['default', 'implied'].includes(this.getOptionValueSource(optionKey))
        );
      };
      this.options
        .filter(
          (option) =>
            option.implied !== undefined &&
            hasCustomOptionValue(option.attributeName()) &&
            dualHelper.valueFromOption(
              this.getOptionValue(option.attributeName()),
              option,
            ),
        )
        .forEach((option) => {
          Object.keys(option.implied)
            .filter((impliedKey) => !hasCustomOptionValue(impliedKey))
            .forEach((impliedKey) => {
              this.setOptionValueWithSource(
                impliedKey,
                option.implied[impliedKey],
                'implied',
              );
            });
        });
    }
    missingArgument(name) {
      const message = `error: missing required argument '${name}'`;
      this.error(message, { code: 'commander.missingArgument' });
    }
    optionMissingArgument(option) {
      const message = `error: option '${option.flags}' argument missing`;
      this.error(message, { code: 'commander.optionMissingArgument' });
    }
    missingMandatoryOptionValue(option) {
      const message = `error: required option '${option.flags}' not specified`;
      this.error(message, { code: 'commander.missingMandatoryOptionValue' });
    }
    _conflictingOption(option, conflictingOption) {
      const findBestOptionFromValue = (option2) => {
        const optionKey = option2.attributeName();
        const optionValue = this.getOptionValue(optionKey);
        const negativeOption = this.options.find(
          (target) => target.negate && optionKey === target.attributeName(),
        );
        const positiveOption = this.options.find(
          (target) => !target.negate && optionKey === target.attributeName(),
        );
        if (
          negativeOption &&
          ((negativeOption.presetArg === undefined && optionValue === false) ||
            (negativeOption.presetArg !== undefined &&
              optionValue === negativeOption.presetArg))
        ) {
          return negativeOption;
        }
        return positiveOption || option2;
      };
      const getErrorMessage = (option2) => {
        const bestOption = findBestOptionFromValue(option2);
        const optionKey = bestOption.attributeName();
        const source = this.getOptionValueSource(optionKey);
        if (source === 'env') {
          return `environment variable '${bestOption.envVar}'`;
        }
        return `option '${bestOption.flags}'`;
      };
      const message = `error: ${getErrorMessage(option)} cannot be used with ${getErrorMessage(conflictingOption)}`;
      this.error(message, { code: 'commander.conflictingOption' });
    }
    unknownOption(flag) {
      if (this._allowUnknownOption) return;
      let suggestion = '';
      if (flag.startsWith('--') && this._showSuggestionAfterError) {
        let candidateFlags = [];
        let command = this;
        do {
          const moreFlags = command
            .createHelp()
            .visibleOptions(command)
            .filter((option) => option.long)
            .map((option) => option.long);
          candidateFlags = candidateFlags.concat(moreFlags);
          command = command.parent;
        } while (command && !command._enablePositionalOptions);
        suggestion = suggestSimilar(flag, candidateFlags);
      }
      const message = `error: unknown option '${flag}'${suggestion}`;
      this.error(message, { code: 'commander.unknownOption' });
    }
    _excessArguments(receivedArgs) {
      if (this._allowExcessArguments) return;
      const expected = this.registeredArguments.length;
      const s = expected === 1 ? '' : 's';
      const forSubcommand = this.parent ? ` for '${this.name()}'` : '';
      const message = `error: too many arguments${forSubcommand}. Expected ${expected} argument${s} but got ${receivedArgs.length}.`;
      this.error(message, { code: 'commander.excessArguments' });
    }
    unknownCommand() {
      const unknownName = this.args[0];
      let suggestion = '';
      if (this._showSuggestionAfterError) {
        const candidateNames = [];
        this.createHelp()
          .visibleCommands(this)
          .forEach((command) => {
            candidateNames.push(command.name());
            if (command.alias()) candidateNames.push(command.alias());
          });
        suggestion = suggestSimilar(unknownName, candidateNames);
      }
      const message = `error: unknown command '${unknownName}'${suggestion}`;
      this.error(message, { code: 'commander.unknownCommand' });
    }
    version(str, flags, description) {
      if (str === undefined) return this._version;
      this._version = str;
      flags = flags || '-V, --version';
      description = description || 'output the version number';
      const versionOption = this.createOption(flags, description);
      this._versionOptionName = versionOption.attributeName();
      this._registerOption(versionOption);
      this.on('option:' + versionOption.name(), () => {
        this._outputConfiguration.writeOut(`${str}
`);
        this._exit(0, 'commander.version', str);
      });
      return this;
    }
    description(str, argsDescription) {
      if (str === undefined && argsDescription === undefined)
        return this._description;
      this._description = str;
      if (argsDescription) {
        this._argsDescription = argsDescription;
      }
      return this;
    }
    summary(str) {
      if (str === undefined) return this._summary;
      this._summary = str;
      return this;
    }
    alias(alias) {
      if (alias === undefined) return this._aliases[0];
      let command = this;
      if (
        this.commands.length !== 0 &&
        this.commands[this.commands.length - 1]._executableHandler
      ) {
        command = this.commands[this.commands.length - 1];
      }
      if (alias === command._name)
        throw new Error("Command alias can't be the same as its name");
      const matchingCommand = this.parent?._findCommand(alias);
      if (matchingCommand) {
        const existingCmd = [matchingCommand.name()]
          .concat(matchingCommand.aliases())
          .join('|');
        throw new Error(
          `cannot add alias '${alias}' to command '${this.name()}' as already have command '${existingCmd}'`,
        );
      }
      command._aliases.push(alias);
      return this;
    }
    aliases(aliases) {
      if (aliases === undefined) return this._aliases;
      aliases.forEach((alias) => this.alias(alias));
      return this;
    }
    usage(str) {
      if (str === undefined) {
        if (this._usage) return this._usage;
        const args = this.registeredArguments.map((arg) => {
          return humanReadableArgName(arg);
        });
        return []
          .concat(
            this.options.length || this._helpOption !== null ? '[options]' : [],
            this.commands.length ? '[command]' : [],
            this.registeredArguments.length ? args : [],
          )
          .join(' ');
      }
      this._usage = str;
      return this;
    }
    name(str) {
      if (str === undefined) return this._name;
      this._name = str;
      return this;
    }
    helpGroup(heading) {
      if (heading === undefined) return this._helpGroupHeading ?? '';
      this._helpGroupHeading = heading;
      return this;
    }
    commandsGroup(heading) {
      if (heading === undefined) return this._defaultCommandGroup ?? '';
      this._defaultCommandGroup = heading;
      return this;
    }
    optionsGroup(heading) {
      if (heading === undefined) return this._defaultOptionGroup ?? '';
      this._defaultOptionGroup = heading;
      return this;
    }
    _initOptionGroup(option) {
      if (this._defaultOptionGroup && !option.helpGroupHeading)
        option.helpGroup(this._defaultOptionGroup);
    }
    _initCommandGroup(cmd) {
      if (this._defaultCommandGroup && !cmd.helpGroup())
        cmd.helpGroup(this._defaultCommandGroup);
    }
    nameFromFilename(filename) {
      this._name = path.basename(filename, path.extname(filename));
      return this;
    }
    executableDir(path2) {
      if (path2 === undefined) return this._executableDir;
      this._executableDir = path2;
      return this;
    }
    helpInformation(contextOptions) {
      const helper = this.createHelp();
      const context = this._getOutputContext(contextOptions);
      helper.prepareContext({
        error: context.error,
        helpWidth: context.helpWidth,
        outputHasColors: context.hasColors,
      });
      const text = helper.formatHelp(this, helper);
      if (context.hasColors) return text;
      return this._outputConfiguration.stripColor(text);
    }
    _getOutputContext(contextOptions) {
      contextOptions = contextOptions || {};
      const error = !!contextOptions.error;
      let baseWrite;
      let hasColors;
      let helpWidth;
      if (error) {
        baseWrite = (str) => this._outputConfiguration.writeErr(str);
        hasColors = this._outputConfiguration.getErrHasColors();
        helpWidth = this._outputConfiguration.getErrHelpWidth();
      } else {
        baseWrite = (str) => this._outputConfiguration.writeOut(str);
        hasColors = this._outputConfiguration.getOutHasColors();
        helpWidth = this._outputConfiguration.getOutHelpWidth();
      }
      const write = (str) => {
        if (!hasColors) str = this._outputConfiguration.stripColor(str);
        return baseWrite(str);
      };
      return { error, write, hasColors, helpWidth };
    }
    outputHelp(contextOptions) {
      let deprecatedCallback;
      if (typeof contextOptions === 'function') {
        deprecatedCallback = contextOptions;
        contextOptions = undefined;
      }
      const outputContext = this._getOutputContext(contextOptions);
      const eventContext = {
        error: outputContext.error,
        write: outputContext.write,
        command: this,
      };
      this._getCommandAndAncestors()
        .reverse()
        .forEach((command) => command.emit('beforeAllHelp', eventContext));
      this.emit('beforeHelp', eventContext);
      let helpInformation = this.helpInformation({
        error: outputContext.error,
      });
      if (deprecatedCallback) {
        helpInformation = deprecatedCallback(helpInformation);
        if (
          typeof helpInformation !== 'string' &&
          !Buffer.isBuffer(helpInformation)
        ) {
          throw new Error(
            'outputHelp callback must return a string or a Buffer',
          );
        }
      }
      outputContext.write(helpInformation);
      if (this._getHelpOption()?.long) {
        this.emit(this._getHelpOption().long);
      }
      this.emit('afterHelp', eventContext);
      this._getCommandAndAncestors().forEach((command) =>
        command.emit('afterAllHelp', eventContext),
      );
    }
    helpOption(flags, description) {
      if (typeof flags === 'boolean') {
        if (flags) {
          if (this._helpOption === null) this._helpOption = undefined;
          if (this._defaultOptionGroup) {
            this._initOptionGroup(this._getHelpOption());
          }
        } else {
          this._helpOption = null;
        }
        return this;
      }
      this._helpOption = this.createOption(
        flags ?? '-h, --help',
        description ?? 'display help for command',
      );
      if (flags || description) this._initOptionGroup(this._helpOption);
      return this;
    }
    _getHelpOption() {
      if (this._helpOption === undefined) {
        this.helpOption(undefined, undefined);
      }
      return this._helpOption;
    }
    addHelpOption(option) {
      this._helpOption = option;
      this._initOptionGroup(option);
      return this;
    }
    help(contextOptions) {
      this.outputHelp(contextOptions);
      let exitCode = Number(process2.exitCode ?? 0);
      if (
        exitCode === 0 &&
        contextOptions &&
        typeof contextOptions !== 'function' &&
        contextOptions.error
      ) {
        exitCode = 1;
      }
      this._exit(exitCode, 'commander.help', '(outputHelp)');
    }
    addHelpText(position, text) {
      const allowedValues = ['beforeAll', 'before', 'after', 'afterAll'];
      if (!allowedValues.includes(position)) {
        throw new Error(`Unexpected value for position to addHelpText.
Expecting one of '${allowedValues.join("', '")}'`);
      }
      const helpEvent = `${position}Help`;
      this.on(helpEvent, (context) => {
        let helpStr;
        if (typeof text === 'function') {
          helpStr = text({ error: context.error, command: context.command });
        } else {
          helpStr = text;
        }
        if (helpStr) {
          context.write(`${helpStr}
`);
        }
      });
      return this;
    }
    _outputHelpIfRequested(args) {
      const helpOption = this._getHelpOption();
      const helpRequested =
        helpOption && args.find((arg) => helpOption.is(arg));
      if (helpRequested) {
        this.outputHelp();
        this._exit(0, 'commander.helpDisplayed', '(outputHelp)');
      }
    }
  }
  function incrementNodeInspectorPort(args) {
    return args.map((arg) => {
      if (!arg.startsWith('--inspect')) {
        return arg;
      }
      let debugOption;
      let debugHost = '127.0.0.1';
      let debugPort = '9229';
      let match;
      if ((match = arg.match(/^(--inspect(-brk)?)$/)) !== null) {
        debugOption = match[1];
      } else if (
        (match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+)$/)) !== null
      ) {
        debugOption = match[1];
        if (/^\d+$/.test(match[3])) {
          debugPort = match[3];
        } else {
          debugHost = match[3];
        }
      } else if (
        (match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+):(\d+)$/)) !== null
      ) {
        debugOption = match[1];
        debugHost = match[3];
        debugPort = match[4];
      }
      if (debugOption && debugPort !== '0') {
        return `${debugOption}=${debugHost}:${parseInt(debugPort) + 1}`;
      }
      return arg;
    });
  }
  function useColor() {
    if (
      process2.env.NO_COLOR ||
      process2.env.FORCE_COLOR === '0' ||
      process2.env.FORCE_COLOR === 'false'
    )
      return false;
    if (process2.env.FORCE_COLOR || process2.env.CLICOLOR_FORCE !== undefined)
      return true;
    return;
  }
  exports.Command = Command;
  exports.useColor = useColor;
});

// node_modules/commander/index.js
var require_commander = __commonJS((exports) => {
  var { Argument } = require_argument();
  var { Command } = require_command();
  var { CommanderError, InvalidArgumentError } = require_error();
  var { Help } = require_help();
  var { Option } = require_option();
  exports.program = new Command();
  exports.createCommand = (name) => new Command(name);
  exports.createOption = (flags, description) => new Option(flags, description);
  exports.createArgument = (name, description) =>
    new Argument(name, description);
  exports.Command = Command;
  exports.Option = Option;
  exports.Argument = Argument;
  exports.Help = Help;
  exports.CommanderError = CommanderError;
  exports.InvalidArgumentError = InvalidArgumentError;
  exports.InvalidOptionArgumentError = InvalidArgumentError;
});

// node_modules/drizzle-orm/entity.js
function is(value, type) {
  if (!value || typeof value !== 'object') {
    return false;
  }
  if (value instanceof type) {
    return true;
  }
  if (!Object.prototype.hasOwnProperty.call(type, entityKind)) {
    throw new Error(
      `Class "${type.name ?? '<unknown>'}" doesn't look like a Drizzle entity. If this is incorrect and the class is provided by Drizzle, please report this as a bug.`,
    );
  }
  let cls = Object.getPrototypeOf(value).constructor;
  if (cls) {
    while (cls) {
      if (entityKind in cls && cls[entityKind] === type[entityKind]) {
        return true;
      }
      cls = Object.getPrototypeOf(cls);
    }
  }
  return false;
}
var entityKind, hasOwnEntityKind;
var init_entity = __esm(() => {
  entityKind = Symbol.for('drizzle:entityKind');
  hasOwnEntityKind = Symbol.for('drizzle:hasOwnEntityKind');
});

// node_modules/drizzle-orm/logger.js
var ConsoleLogWriter, DefaultLogger, NoopLogger;
var init_logger = __esm(() => {
  init_entity();
  ConsoleLogWriter = class ConsoleLogWriter {
    static [entityKind] = 'ConsoleLogWriter';
    write(message) {
      console.log(message);
    }
  };
  DefaultLogger = class DefaultLogger {
    static [entityKind] = 'DefaultLogger';
    writer;
    constructor(config) {
      this.writer = config?.writer ?? new ConsoleLogWriter();
    }
    logQuery(query, params) {
      const stringifiedParams = params.map((p) => {
        try {
          return JSON.stringify(p);
        } catch {
          return String(p);
        }
      });
      const paramsStr = stringifiedParams.length
        ? ` -- params: [${stringifiedParams.join(', ')}]`
        : '';
      this.writer.write(`Query: ${query}${paramsStr}`);
    }
  };
  NoopLogger = class NoopLogger {
    static [entityKind] = 'NoopLogger';
    logQuery() {}
  };
});

// node_modules/drizzle-orm/table.utils.js
var TableName;
var init_table_utils = __esm(() => {
  TableName = Symbol.for('drizzle:Name');
});

// node_modules/drizzle-orm/table.js
function isTable(table) {
  return typeof table === 'object' && table !== null && IsDrizzleTable in table;
}
function getTableName(table) {
  return table[TableName];
}
function getTableUniqueName(table) {
  return `${table[Schema] ?? 'public'}.${table[TableName]}`;
}
var Schema,
  Columns,
  ExtraConfigColumns,
  OriginalName,
  BaseName,
  IsAlias,
  ExtraConfigBuilder,
  IsDrizzleTable,
  Table;
var init_table = __esm(() => {
  init_entity();
  init_table_utils();
  Schema = Symbol.for('drizzle:Schema');
  Columns = Symbol.for('drizzle:Columns');
  ExtraConfigColumns = Symbol.for('drizzle:ExtraConfigColumns');
  OriginalName = Symbol.for('drizzle:OriginalName');
  BaseName = Symbol.for('drizzle:BaseName');
  IsAlias = Symbol.for('drizzle:IsAlias');
  ExtraConfigBuilder = Symbol.for('drizzle:ExtraConfigBuilder');
  IsDrizzleTable = Symbol.for('drizzle:IsDrizzleTable');
  Table = class Table {
    static [entityKind] = 'Table';
    static Symbol = {
      Name: TableName,
      Schema,
      OriginalName,
      Columns,
      ExtraConfigColumns,
      BaseName,
      IsAlias,
      ExtraConfigBuilder,
    };
    [TableName];
    [OriginalName];
    [Schema];
    [Columns];
    [ExtraConfigColumns];
    [BaseName];
    [IsAlias] = false;
    [IsDrizzleTable] = true;
    [ExtraConfigBuilder] = undefined;
    constructor(name, schema, baseName) {
      this[TableName] = this[OriginalName] = name;
      this[Schema] = schema;
      this[BaseName] = baseName;
    }
  };
});

// node_modules/drizzle-orm/column.js
var Column;
var init_column = __esm(() => {
  init_entity();
  Column = class Column {
    constructor(table, config) {
      this.table = table;
      this.config = config;
      this.name = config.name;
      this.keyAsName = config.keyAsName;
      this.notNull = config.notNull;
      this.default = config.default;
      this.defaultFn = config.defaultFn;
      this.onUpdateFn = config.onUpdateFn;
      this.hasDefault = config.hasDefault;
      this.primary = config.primaryKey;
      this.isUnique = config.isUnique;
      this.uniqueName = config.uniqueName;
      this.uniqueType = config.uniqueType;
      this.dataType = config.dataType;
      this.columnType = config.columnType;
      this.generated = config.generated;
      this.generatedIdentity = config.generatedIdentity;
    }
    static [entityKind] = 'Column';
    name;
    keyAsName;
    primary;
    notNull;
    default;
    defaultFn;
    onUpdateFn;
    hasDefault;
    isUnique;
    uniqueName;
    uniqueType;
    dataType;
    columnType;
    enumValues = undefined;
    generated = undefined;
    generatedIdentity = undefined;
    config;
    mapFromDriverValue(value) {
      return value;
    }
    mapToDriverValue(value) {
      return value;
    }
    shouldDisableInsert() {
      return (
        this.config.generated !== undefined &&
        this.config.generated.type !== 'byDefault'
      );
    }
  };
});

// node_modules/drizzle-orm/column-builder.js
var ColumnBuilder;
var init_column_builder = __esm(() => {
  init_entity();
  ColumnBuilder = class ColumnBuilder {
    static [entityKind] = 'ColumnBuilder';
    config;
    constructor(name, dataType, columnType) {
      this.config = {
        name,
        keyAsName: name === '',
        notNull: false,
        default: undefined,
        hasDefault: false,
        primaryKey: false,
        isUnique: false,
        uniqueName: undefined,
        uniqueType: undefined,
        dataType,
        columnType,
        generated: undefined,
      };
    }
    $type() {
      return this;
    }
    notNull() {
      this.config.notNull = true;
      return this;
    }
    default(value) {
      this.config.default = value;
      this.config.hasDefault = true;
      return this;
    }
    $defaultFn(fn) {
      this.config.defaultFn = fn;
      this.config.hasDefault = true;
      return this;
    }
    $default = this.$defaultFn;
    $onUpdateFn(fn) {
      this.config.onUpdateFn = fn;
      this.config.hasDefault = true;
      return this;
    }
    $onUpdate = this.$onUpdateFn;
    primaryKey() {
      this.config.primaryKey = true;
      this.config.notNull = true;
      return this;
    }
    setName(name) {
      if (this.config.name !== '') return;
      this.config.name = name;
    }
  };
});

// node_modules/drizzle-orm/tracing-utils.js
function iife(fn, ...args) {
  return fn(...args);
}
var init_tracing_utils = () => {};

// node_modules/drizzle-orm/pg-core/unique-constraint.js
function uniqueKeyName(table, columns) {
  return `${table[TableName]}_${columns.join('_')}_unique`;
}
var init_unique_constraint = __esm(() => {
  init_table_utils();
});

// node_modules/drizzle-orm/pg-core/columns/common.js
var PgColumn, ExtraConfigColumn;
var init_common = __esm(() => {
  init_column();
  init_entity();
  init_unique_constraint();
  PgColumn = class PgColumn extends Column {
    constructor(table, config) {
      if (!config.uniqueName) {
        config.uniqueName = uniqueKeyName(table, [config.name]);
      }
      super(table, config);
      this.table = table;
    }
    static [entityKind] = 'PgColumn';
  };
  ExtraConfigColumn = class ExtraConfigColumn extends PgColumn {
    static [entityKind] = 'ExtraConfigColumn';
    getSQLType() {
      return this.getSQLType();
    }
    indexConfig = {
      order: this.config.order ?? 'asc',
      nulls: this.config.nulls ?? 'last',
      opClass: this.config.opClass,
    };
    defaultConfig = {
      order: 'asc',
      nulls: 'last',
      opClass: undefined,
    };
    asc() {
      this.indexConfig.order = 'asc';
      return this;
    }
    desc() {
      this.indexConfig.order = 'desc';
      return this;
    }
    nullsFirst() {
      this.indexConfig.nulls = 'first';
      return this;
    }
    nullsLast() {
      this.indexConfig.nulls = 'last';
      return this;
    }
    op(opClass) {
      this.indexConfig.opClass = opClass;
      return this;
    }
  };
});

// node_modules/drizzle-orm/pg-core/columns/enum.js
function isPgEnum(obj) {
  return (
    !!obj &&
    typeof obj === 'function' &&
    isPgEnumSym in obj &&
    obj[isPgEnumSym] === true
  );
}
var PgEnumObjectColumn, isPgEnumSym, PgEnumColumn;
var init_enum = __esm(() => {
  init_entity();
  init_common();
  PgEnumObjectColumn = class PgEnumObjectColumn extends PgColumn {
    static [entityKind] = 'PgEnumObjectColumn';
    enum;
    enumValues = this.config.enum.enumValues;
    constructor(table, config) {
      super(table, config);
      this.enum = config.enum;
    }
    getSQLType() {
      return this.enum.enumName;
    }
  };
  isPgEnumSym = Symbol.for('drizzle:isPgEnum');
  PgEnumColumn = class PgEnumColumn extends PgColumn {
    static [entityKind] = 'PgEnumColumn';
    enum = this.config.enum;
    enumValues = this.config.enum.enumValues;
    constructor(table, config) {
      super(table, config);
      this.enum = config.enum;
    }
    getSQLType() {
      return this.enum.enumName;
    }
  };
});

// node_modules/drizzle-orm/subquery.js
var Subquery, WithSubquery;
var init_subquery = __esm(() => {
  init_entity();
  Subquery = class Subquery {
    static [entityKind] = 'Subquery';
    constructor(sql, fields, alias, isWith = false, usedTables = []) {
      this._ = {
        brand: 'Subquery',
        sql,
        selectedFields: fields,
        alias,
        isWith,
        usedTables,
      };
    }
  };
  WithSubquery = class WithSubquery extends Subquery {
    static [entityKind] = 'WithSubquery';
  };
});

// node_modules/drizzle-orm/version.js
var version = '0.45.2';
var init_version = () => {};

// node_modules/drizzle-orm/tracing.js
var otel, rawTracer, tracer;
var init_tracing = __esm(() => {
  init_tracing_utils();
  init_version();
  tracer = {
    startActiveSpan(name, fn) {
      if (!otel) {
        return fn();
      }
      if (!rawTracer) {
        rawTracer = otel.trace.getTracer('drizzle-orm', version);
      }
      return iife(
        (otel2, rawTracer2) =>
          rawTracer2.startActiveSpan(name, (span) => {
            try {
              return fn(span);
            } catch (e) {
              span.setStatus({
                code: otel2.SpanStatusCode.ERROR,
                message: e instanceof Error ? e.message : 'Unknown error',
              });
              throw e;
            } finally {
              span.end();
            }
          }),
        otel,
        rawTracer,
      );
    },
  };
});

// node_modules/drizzle-orm/view-common.js
var ViewBaseConfig;
var init_view_common = __esm(() => {
  ViewBaseConfig = Symbol.for('drizzle:ViewBaseConfig');
});

// node_modules/drizzle-orm/sql/sql.js
function isSQLWrapper(value) {
  return (
    value !== null && value !== undefined && typeof value.getSQL === 'function'
  );
}
function mergeQueries(queries) {
  const result = { sql: '', params: [] };
  for (const query of queries) {
    result.sql += query.sql;
    result.params.push(...query.params);
    if (query.typings?.length) {
      if (!result.typings) {
        result.typings = [];
      }
      result.typings.push(...query.typings);
    }
  }
  return result;
}
function name(value) {
  return new Name(value);
}
function isDriverValueEncoder(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    'mapToDriverValue' in value &&
    typeof value.mapToDriverValue === 'function'
  );
}
function param(value, encoder) {
  return new Param(value, encoder);
}
function sql(strings, ...params) {
  const queryChunks = [];
  if (params.length > 0 || (strings.length > 0 && strings[0] !== '')) {
    queryChunks.push(new StringChunk(strings[0]));
  }
  for (const [paramIndex, param2] of params.entries()) {
    queryChunks.push(param2, new StringChunk(strings[paramIndex + 1]));
  }
  return new SQL(queryChunks);
}
function placeholder(name2) {
  return new Placeholder(name2);
}
function fillPlaceholders(params, values) {
  return params.map((p) => {
    if (is(p, Placeholder)) {
      if (!(p.name in values)) {
        throw new Error(`No value for placeholder "${p.name}" was provided`);
      }
      return values[p.name];
    }
    if (is(p, Param) && is(p.value, Placeholder)) {
      if (!(p.value.name in values)) {
        throw new Error(
          `No value for placeholder "${p.value.name}" was provided`,
        );
      }
      return p.encoder.mapToDriverValue(values[p.value.name]);
    }
    return p;
  });
}
function isView(view) {
  return typeof view === 'object' && view !== null && IsDrizzleView in view;
}
function getViewName(view) {
  return view[ViewBaseConfig].name;
}
var FakePrimitiveParam,
  StringChunk,
  SQL,
  Name,
  noopDecoder,
  noopEncoder,
  noopMapper,
  Param,
  Placeholder,
  IsDrizzleView,
  View;
var init_sql = __esm(() => {
  init_entity();
  init_enum();
  init_subquery();
  init_tracing();
  init_view_common();
  init_column();
  init_table();
  FakePrimitiveParam = class FakePrimitiveParam {
    static [entityKind] = 'FakePrimitiveParam';
  };
  StringChunk = class StringChunk {
    static [entityKind] = 'StringChunk';
    value;
    constructor(value) {
      this.value = Array.isArray(value) ? value : [value];
    }
    getSQL() {
      return new SQL([this]);
    }
  };
  SQL = class SQL {
    constructor(queryChunks) {
      this.queryChunks = queryChunks;
      for (const chunk of queryChunks) {
        if (is(chunk, Table)) {
          const schemaName = chunk[Table.Symbol.Schema];
          this.usedTables.push(
            schemaName === undefined
              ? chunk[Table.Symbol.Name]
              : schemaName + '.' + chunk[Table.Symbol.Name],
          );
        }
      }
    }
    static [entityKind] = 'SQL';
    decoder = noopDecoder;
    shouldInlineParams = false;
    usedTables = [];
    append(query) {
      this.queryChunks.push(...query.queryChunks);
      return this;
    }
    toQuery(config) {
      return tracer.startActiveSpan('drizzle.buildSQL', (span) => {
        const query = this.buildQueryFromSourceParams(this.queryChunks, config);
        span?.setAttributes({
          'drizzle.query.text': query.sql,
          'drizzle.query.params': JSON.stringify(query.params),
        });
        return query;
      });
    }
    buildQueryFromSourceParams(chunks, _config) {
      const config = Object.assign({}, _config, {
        inlineParams: _config.inlineParams || this.shouldInlineParams,
        paramStartIndex: _config.paramStartIndex || { value: 0 },
      });
      const {
        casing,
        escapeName,
        escapeParam,
        prepareTyping,
        inlineParams,
        paramStartIndex,
      } = config;
      return mergeQueries(
        chunks.map((chunk) => {
          if (is(chunk, StringChunk)) {
            return { sql: chunk.value.join(''), params: [] };
          }
          if (is(chunk, Name)) {
            return { sql: escapeName(chunk.value), params: [] };
          }
          if (chunk === undefined) {
            return { sql: '', params: [] };
          }
          if (Array.isArray(chunk)) {
            const result = [new StringChunk('(')];
            for (const [i, p] of chunk.entries()) {
              result.push(p);
              if (i < chunk.length - 1) {
                result.push(new StringChunk(', '));
              }
            }
            result.push(new StringChunk(')'));
            return this.buildQueryFromSourceParams(result, config);
          }
          if (is(chunk, SQL)) {
            return this.buildQueryFromSourceParams(chunk.queryChunks, {
              ...config,
              inlineParams: inlineParams || chunk.shouldInlineParams,
            });
          }
          if (is(chunk, Table)) {
            const schemaName = chunk[Table.Symbol.Schema];
            const tableName = chunk[Table.Symbol.Name];
            return {
              sql:
                schemaName === undefined || chunk[IsAlias]
                  ? escapeName(tableName)
                  : escapeName(schemaName) + '.' + escapeName(tableName),
              params: [],
            };
          }
          if (is(chunk, Column)) {
            const columnName = casing.getColumnCasing(chunk);
            if (_config.invokeSource === 'indexes') {
              return { sql: escapeName(columnName), params: [] };
            }
            const schemaName = chunk.table[Table.Symbol.Schema];
            return {
              sql:
                chunk.table[IsAlias] || schemaName === undefined
                  ? escapeName(chunk.table[Table.Symbol.Name]) +
                    '.' +
                    escapeName(columnName)
                  : escapeName(schemaName) +
                    '.' +
                    escapeName(chunk.table[Table.Symbol.Name]) +
                    '.' +
                    escapeName(columnName),
              params: [],
            };
          }
          if (is(chunk, View)) {
            const schemaName = chunk[ViewBaseConfig].schema;
            const viewName = chunk[ViewBaseConfig].name;
            return {
              sql:
                schemaName === undefined || chunk[ViewBaseConfig].isAlias
                  ? escapeName(viewName)
                  : escapeName(schemaName) + '.' + escapeName(viewName),
              params: [],
            };
          }
          if (is(chunk, Param)) {
            if (is(chunk.value, Placeholder)) {
              return {
                sql: escapeParam(paramStartIndex.value++, chunk),
                params: [chunk],
                typings: ['none'],
              };
            }
            const mappedValue =
              chunk.value === null
                ? null
                : chunk.encoder.mapToDriverValue(chunk.value);
            if (is(mappedValue, SQL)) {
              return this.buildQueryFromSourceParams([mappedValue], config);
            }
            if (inlineParams) {
              return {
                sql: this.mapInlineParam(mappedValue, config),
                params: [],
              };
            }
            let typings = ['none'];
            if (prepareTyping) {
              typings = [prepareTyping(chunk.encoder)];
            }
            return {
              sql: escapeParam(paramStartIndex.value++, mappedValue),
              params: [mappedValue],
              typings,
            };
          }
          if (is(chunk, Placeholder)) {
            return {
              sql: escapeParam(paramStartIndex.value++, chunk),
              params: [chunk],
              typings: ['none'],
            };
          }
          if (is(chunk, SQL.Aliased) && chunk.fieldAlias !== undefined) {
            return { sql: escapeName(chunk.fieldAlias), params: [] };
          }
          if (is(chunk, Subquery)) {
            if (chunk._.isWith) {
              return { sql: escapeName(chunk._.alias), params: [] };
            }
            return this.buildQueryFromSourceParams(
              [
                new StringChunk('('),
                chunk._.sql,
                new StringChunk(') '),
                new Name(chunk._.alias),
              ],
              config,
            );
          }
          if (isPgEnum(chunk)) {
            if (chunk.schema) {
              return {
                sql:
                  escapeName(chunk.schema) + '.' + escapeName(chunk.enumName),
                params: [],
              };
            }
            return { sql: escapeName(chunk.enumName), params: [] };
          }
          if (isSQLWrapper(chunk)) {
            if (chunk.shouldOmitSQLParens?.()) {
              return this.buildQueryFromSourceParams([chunk.getSQL()], config);
            }
            return this.buildQueryFromSourceParams(
              [new StringChunk('('), chunk.getSQL(), new StringChunk(')')],
              config,
            );
          }
          if (inlineParams) {
            return { sql: this.mapInlineParam(chunk, config), params: [] };
          }
          return {
            sql: escapeParam(paramStartIndex.value++, chunk),
            params: [chunk],
            typings: ['none'],
          };
        }),
      );
    }
    mapInlineParam(chunk, { escapeString }) {
      if (chunk === null) {
        return 'null';
      }
      if (typeof chunk === 'number' || typeof chunk === 'boolean') {
        return chunk.toString();
      }
      if (typeof chunk === 'string') {
        return escapeString(chunk);
      }
      if (typeof chunk === 'object') {
        const mappedValueAsString = chunk.toString();
        if (mappedValueAsString === '[object Object]') {
          return escapeString(JSON.stringify(chunk));
        }
        return escapeString(mappedValueAsString);
      }
      throw new Error('Unexpected param value: ' + chunk);
    }
    getSQL() {
      return this;
    }
    as(alias) {
      if (alias === undefined) {
        return this;
      }
      return new SQL.Aliased(this, alias);
    }
    mapWith(decoder) {
      this.decoder =
        typeof decoder === 'function'
          ? { mapFromDriverValue: decoder }
          : decoder;
      return this;
    }
    inlineParams() {
      this.shouldInlineParams = true;
      return this;
    }
    if(condition) {
      return condition ? this : undefined;
    }
  };
  Name = class Name {
    constructor(value) {
      this.value = value;
    }
    static [entityKind] = 'Name';
    brand;
    getSQL() {
      return new SQL([this]);
    }
  };
  noopDecoder = {
    mapFromDriverValue: (value) => value,
  };
  noopEncoder = {
    mapToDriverValue: (value) => value,
  };
  noopMapper = {
    ...noopDecoder,
    ...noopEncoder,
  };
  Param = class Param {
    constructor(value, encoder = noopEncoder) {
      this.value = value;
      this.encoder = encoder;
    }
    static [entityKind] = 'Param';
    brand;
    getSQL() {
      return new SQL([this]);
    }
  };
  ((sql2) => {
    function empty() {
      return new SQL([]);
    }
    sql2.empty = empty;
    function fromList(list) {
      return new SQL(list);
    }
    sql2.fromList = fromList;
    function raw(str) {
      return new SQL([new StringChunk(str)]);
    }
    sql2.raw = raw;
    function join(chunks, separator) {
      const result = [];
      for (const [i, chunk] of chunks.entries()) {
        if (i > 0 && separator !== undefined) {
          result.push(separator);
        }
        result.push(chunk);
      }
      return new SQL(result);
    }
    sql2.join = join;
    function identifier(value) {
      return new Name(value);
    }
    sql2.identifier = identifier;
    function placeholder2(name2) {
      return new Placeholder(name2);
    }
    sql2.placeholder = placeholder2;
    function param2(value, encoder) {
      return new Param(value, encoder);
    }
    sql2.param = param2;
  })(sql || (sql = {}));
  ((SQL2) => {
    class Aliased {
      constructor(sql2, fieldAlias) {
        this.sql = sql2;
        this.fieldAlias = fieldAlias;
      }
      static [entityKind] = 'SQL.Aliased';
      isSelectionField = false;
      getSQL() {
        return this.sql;
      }
      clone() {
        return new Aliased(this.sql, this.fieldAlias);
      }
    }
    SQL2.Aliased = Aliased;
  })(SQL || (SQL = {}));
  Placeholder = class Placeholder {
    constructor(name2) {
      this.name = name2;
    }
    static [entityKind] = 'Placeholder';
    getSQL() {
      return new SQL([this]);
    }
  };
  IsDrizzleView = Symbol.for('drizzle:IsDrizzleView');
  View = class View {
    static [entityKind] = 'View';
    [ViewBaseConfig];
    [IsDrizzleView] = true;
    constructor({ name: name2, schema, selectedFields, query }) {
      this[ViewBaseConfig] = {
        name: name2,
        originalName: name2,
        schema,
        selectedFields,
        query,
        isExisting: !query,
        isAlias: false,
      };
    }
    getSQL() {
      return new SQL([this]);
    }
  };
  Column.prototype.getSQL = function () {
    return new SQL([this]);
  };
  Table.prototype.getSQL = function () {
    return new SQL([this]);
  };
  Subquery.prototype.getSQL = function () {
    return new SQL([this]);
  };
});

// node_modules/drizzle-orm/utils.js
function mapResultRow(columns, row, joinsNotNullableMap) {
  const nullifyMap = {};
  const result = columns.reduce(
    (result2, { path: path2, field }, columnIndex) => {
      let decoder;
      if (is(field, Column)) {
        decoder = field;
      } else if (is(field, SQL)) {
        decoder = field.decoder;
      } else if (is(field, Subquery)) {
        decoder = field._.sql.decoder;
      } else {
        decoder = field.sql.decoder;
      }
      let node = result2;
      for (const [pathChunkIndex, pathChunk] of path2.entries()) {
        if (pathChunkIndex < path2.length - 1) {
          if (!(pathChunk in node)) {
            node[pathChunk] = {};
          }
          node = node[pathChunk];
        } else {
          const rawValue = row[columnIndex];
          const value = (node[pathChunk] =
            rawValue === null ? null : decoder.mapFromDriverValue(rawValue));
          if (joinsNotNullableMap && is(field, Column) && path2.length === 2) {
            const objectName = path2[0];
            if (!(objectName in nullifyMap)) {
              nullifyMap[objectName] =
                value === null ? getTableName(field.table) : false;
            } else if (
              typeof nullifyMap[objectName] === 'string' &&
              nullifyMap[objectName] !== getTableName(field.table)
            ) {
              nullifyMap[objectName] = false;
            }
          }
        }
      }
      return result2;
    },
    {},
  );
  if (joinsNotNullableMap && Object.keys(nullifyMap).length > 0) {
    for (const [objectName, tableName] of Object.entries(nullifyMap)) {
      if (typeof tableName === 'string' && !joinsNotNullableMap[tableName]) {
        result[objectName] = null;
      }
    }
  }
  return result;
}
function orderSelectedFields(fields, pathPrefix) {
  return Object.entries(fields).reduce((result, [name2, field]) => {
    if (typeof name2 !== 'string') {
      return result;
    }
    const newPath = pathPrefix ? [...pathPrefix, name2] : [name2];
    if (
      is(field, Column) ||
      is(field, SQL) ||
      is(field, SQL.Aliased) ||
      is(field, Subquery)
    ) {
      result.push({ path: newPath, field });
    } else if (is(field, Table)) {
      result.push(...orderSelectedFields(field[Table.Symbol.Columns], newPath));
    } else {
      result.push(...orderSelectedFields(field, newPath));
    }
    return result;
  }, []);
}
function haveSameKeys(left, right) {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }
  for (const [index, key] of leftKeys.entries()) {
    if (key !== rightKeys[index]) {
      return false;
    }
  }
  return true;
}
function mapUpdateSet(table, values) {
  const entries = Object.entries(values)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => {
      if (is(value, SQL) || is(value, Column)) {
        return [key, value];
      } else {
        return [key, new Param(value, table[Table.Symbol.Columns][key])];
      }
    });
  if (entries.length === 0) {
    throw new Error('No values to set');
  }
  return Object.fromEntries(entries);
}
function applyMixins(baseClass, extendedClasses) {
  for (const extendedClass of extendedClasses) {
    for (const name2 of Object.getOwnPropertyNames(extendedClass.prototype)) {
      if (name2 === 'constructor') continue;
      Object.defineProperty(
        baseClass.prototype,
        name2,
        Object.getOwnPropertyDescriptor(extendedClass.prototype, name2) ||
          /* @__PURE__ */ Object.create(null),
      );
    }
  }
}
function getTableColumns(table) {
  return table[Table.Symbol.Columns];
}
function getViewSelectedFields(view) {
  return view[ViewBaseConfig].selectedFields;
}
function getTableLikeName(table) {
  return is(table, Subquery)
    ? table._.alias
    : is(table, View)
      ? table[ViewBaseConfig].name
      : is(table, SQL)
        ? undefined
        : table[Table.Symbol.IsAlias]
          ? table[Table.Symbol.Name]
          : table[Table.Symbol.BaseName];
}
function getColumnNameAndConfig(a, b) {
  return {
    name: typeof a === 'string' && a.length > 0 ? a : '',
    config: typeof a === 'object' ? a : b,
  };
}
function isConfig(data) {
  if (typeof data !== 'object' || data === null) return false;
  if (data.constructor.name !== 'Object') return false;
  if ('logger' in data) {
    const type = typeof data['logger'];
    if (
      type !== 'boolean' &&
      (type !== 'object' || typeof data['logger']['logQuery'] !== 'function') &&
      type !== 'undefined'
    )
      return false;
    return true;
  }
  if ('schema' in data) {
    const type = typeof data['schema'];
    if (type !== 'object' && type !== 'undefined') return false;
    return true;
  }
  if ('casing' in data) {
    const type = typeof data['casing'];
    if (type !== 'string' && type !== 'undefined') return false;
    return true;
  }
  if ('mode' in data) {
    if (
      data['mode'] !== 'default' ||
      data['mode'] !== 'planetscale' ||
      data['mode'] !== undefined
    )
      return false;
    return true;
  }
  if ('connection' in data) {
    const type = typeof data['connection'];
    if (type !== 'string' && type !== 'object' && type !== 'undefined')
      return false;
    return true;
  }
  if ('client' in data) {
    const type = typeof data['client'];
    if (type !== 'object' && type !== 'function' && type !== 'undefined')
      return false;
    return true;
  }
  if (Object.keys(data).length === 0) return true;
  return false;
}
var textDecoder;
var init_utils = __esm(() => {
  init_column();
  init_entity();
  init_sql();
  init_subquery();
  init_table();
  init_view_common();
  textDecoder = typeof TextDecoder === 'undefined' ? null : new TextDecoder();
});

// node_modules/drizzle-orm/pg-core/table.js
var InlineForeignKeys, EnableRLS, PgTable;
var init_table2 = __esm(() => {
  init_entity();
  init_table();
  InlineForeignKeys = Symbol.for('drizzle:PgInlineForeignKeys');
  EnableRLS = Symbol.for('drizzle:EnableRLS');
  PgTable = class PgTable extends Table {
    static [entityKind] = 'PgTable';
    static Symbol = Object.assign({}, Table.Symbol, {
      InlineForeignKeys,
      EnableRLS,
    });
    [InlineForeignKeys] = [];
    [EnableRLS] = false;
    [Table.Symbol.ExtraConfigBuilder] = undefined;
    [Table.Symbol.ExtraConfigColumns] = {};
  };
});

// node_modules/drizzle-orm/pg-core/primary-keys.js
var PrimaryKeyBuilder, PrimaryKey;
var init_primary_keys = __esm(() => {
  init_entity();
  init_table2();
  PrimaryKeyBuilder = class PrimaryKeyBuilder {
    static [entityKind] = 'PgPrimaryKeyBuilder';
    columns;
    name;
    constructor(columns, name2) {
      this.columns = columns;
      this.name = name2;
    }
    build(table) {
      return new PrimaryKey(table, this.columns, this.name);
    }
  };
  PrimaryKey = class PrimaryKey {
    constructor(table, columns, name2) {
      this.table = table;
      this.columns = columns;
      this.name = name2;
    }
    static [entityKind] = 'PgPrimaryKey';
    columns;
    name;
    getName() {
      return (
        this.name ??
        `${this.table[PgTable.Symbol.Name]}_${this.columns.map((column) => column.name).join('_')}_pk`
      );
    }
  };
});

// node_modules/drizzle-orm/sql/expressions/conditions.js
function bindIfParam(value, column) {
  if (
    isDriverValueEncoder(column) &&
    !isSQLWrapper(value) &&
    !is(value, Param) &&
    !is(value, Placeholder) &&
    !is(value, Column) &&
    !is(value, Table) &&
    !is(value, View)
  ) {
    return new Param(value, column);
  }
  return value;
}
function and(...unfilteredConditions) {
  const conditions = unfilteredConditions.filter((c) => c !== undefined);
  if (conditions.length === 0) {
    return;
  }
  if (conditions.length === 1) {
    return new SQL(conditions);
  }
  return new SQL([
    new StringChunk('('),
    sql.join(conditions, new StringChunk(' and ')),
    new StringChunk(')'),
  ]);
}
function or(...unfilteredConditions) {
  const conditions = unfilteredConditions.filter((c) => c !== undefined);
  if (conditions.length === 0) {
    return;
  }
  if (conditions.length === 1) {
    return new SQL(conditions);
  }
  return new SQL([
    new StringChunk('('),
    sql.join(conditions, new StringChunk(' or ')),
    new StringChunk(')'),
  ]);
}
function not(condition) {
  return sql`not ${condition}`;
}
function inArray(column, values) {
  if (Array.isArray(values)) {
    if (values.length === 0) {
      return sql`false`;
    }
    return sql`${column} in ${values.map((v) => bindIfParam(v, column))}`;
  }
  return sql`${column} in ${bindIfParam(values, column)}`;
}
function notInArray(column, values) {
  if (Array.isArray(values)) {
    if (values.length === 0) {
      return sql`true`;
    }
    return sql`${column} not in ${values.map((v) => bindIfParam(v, column))}`;
  }
  return sql`${column} not in ${bindIfParam(values, column)}`;
}
function isNull(value) {
  return sql`${value} is null`;
}
function isNotNull(value) {
  return sql`${value} is not null`;
}
function exists(subquery) {
  return sql`exists ${subquery}`;
}
function notExists(subquery) {
  return sql`not exists ${subquery}`;
}
function between(column, min, max) {
  return sql`${column} between ${bindIfParam(min, column)} and ${bindIfParam(max, column)}`;
}
function notBetween(column, min, max) {
  return sql`${column} not between ${bindIfParam(min, column)} and ${bindIfParam(max, column)}`;
}
function like(column, value) {
  return sql`${column} like ${value}`;
}
function notLike(column, value) {
  return sql`${column} not like ${value}`;
}
function ilike(column, value) {
  return sql`${column} ilike ${value}`;
}
function notIlike(column, value) {
  return sql`${column} not ilike ${value}`;
}
function arrayContains(column, values) {
  if (Array.isArray(values)) {
    if (values.length === 0) {
      throw new Error('arrayContains requires at least one value');
    }
    const array = sql`${bindIfParam(values, column)}`;
    return sql`${column} @> ${array}`;
  }
  return sql`${column} @> ${bindIfParam(values, column)}`;
}
function arrayContained(column, values) {
  if (Array.isArray(values)) {
    if (values.length === 0) {
      throw new Error('arrayContained requires at least one value');
    }
    const array = sql`${bindIfParam(values, column)}`;
    return sql`${column} <@ ${array}`;
  }
  return sql`${column} <@ ${bindIfParam(values, column)}`;
}
function arrayOverlaps(column, values) {
  if (Array.isArray(values)) {
    if (values.length === 0) {
      throw new Error('arrayOverlaps requires at least one value');
    }
    const array = sql`${bindIfParam(values, column)}`;
    return sql`${column} && ${array}`;
  }
  return sql`${column} && ${bindIfParam(values, column)}`;
}
var eq = (left, right) => {
    return sql`${left} = ${bindIfParam(right, left)}`;
  },
  ne = (left, right) => {
    return sql`${left} <> ${bindIfParam(right, left)}`;
  },
  gt = (left, right) => {
    return sql`${left} > ${bindIfParam(right, left)}`;
  },
  gte = (left, right) => {
    return sql`${left} >= ${bindIfParam(right, left)}`;
  },
  lt = (left, right) => {
    return sql`${left} < ${bindIfParam(right, left)}`;
  },
  lte = (left, right) => {
    return sql`${left} <= ${bindIfParam(right, left)}`;
  };
var init_conditions = __esm(() => {
  init_column();
  init_entity();
  init_table();
  init_sql();
});

// node_modules/drizzle-orm/sql/expressions/select.js
function asc(column) {
  return sql`${column} asc`;
}
function desc(column) {
  return sql`${column} desc`;
}
var init_select = __esm(() => {
  init_sql();
});

// node_modules/drizzle-orm/sql/expressions/index.js
var init_expressions = __esm(() => {
  init_conditions();
  init_select();
});

// node_modules/drizzle-orm/relations.js
function getOperators() {
  return {
    and,
    between,
    eq,
    exists,
    gt,
    gte,
    ilike,
    inArray,
    isNull,
    isNotNull,
    like,
    lt,
    lte,
    ne,
    not,
    notBetween,
    notExists,
    notLike,
    notIlike,
    notInArray,
    or,
    sql,
  };
}
function getOrderByOperators() {
  return {
    sql,
    asc,
    desc,
  };
}
function extractTablesRelationalConfig(schema, configHelpers) {
  if (
    Object.keys(schema).length === 1 &&
    'default' in schema &&
    !is(schema['default'], Table)
  ) {
    schema = schema['default'];
  }
  const tableNamesMap = {};
  const relationsBuffer = {};
  const tablesConfig = {};
  for (const [key, value] of Object.entries(schema)) {
    if (is(value, Table)) {
      const dbName = getTableUniqueName(value);
      const bufferedRelations = relationsBuffer[dbName];
      tableNamesMap[dbName] = key;
      tablesConfig[key] = {
        tsName: key,
        dbName: value[Table.Symbol.Name],
        schema: value[Table.Symbol.Schema],
        columns: value[Table.Symbol.Columns],
        relations: bufferedRelations?.relations ?? {},
        primaryKey: bufferedRelations?.primaryKey ?? [],
      };
      for (const column of Object.values(value[Table.Symbol.Columns])) {
        if (column.primary) {
          tablesConfig[key].primaryKey.push(column);
        }
      }
      const extraConfig = value[Table.Symbol.ExtraConfigBuilder]?.(
        value[Table.Symbol.ExtraConfigColumns],
      );
      if (extraConfig) {
        for (const configEntry of Object.values(extraConfig)) {
          if (is(configEntry, PrimaryKeyBuilder)) {
            tablesConfig[key].primaryKey.push(...configEntry.columns);
          }
        }
      }
    } else if (is(value, Relations)) {
      const dbName = getTableUniqueName(value.table);
      const tableName = tableNamesMap[dbName];
      const relations2 = value.config(configHelpers(value.table));
      let primaryKey;
      for (const [relationName, relation] of Object.entries(relations2)) {
        if (tableName) {
          const tableConfig = tablesConfig[tableName];
          tableConfig.relations[relationName] = relation;
          if (primaryKey) {
            tableConfig.primaryKey.push(...primaryKey);
          }
        } else {
          if (!(dbName in relationsBuffer)) {
            relationsBuffer[dbName] = {
              relations: {},
              primaryKey,
            };
          }
          relationsBuffer[dbName].relations[relationName] = relation;
        }
      }
    }
  }
  return { tables: tablesConfig, tableNamesMap };
}
function relations(table, relations2) {
  return new Relations(table, (helpers) =>
    Object.fromEntries(
      Object.entries(relations2(helpers)).map(([key, value]) => [
        key,
        value.withFieldName(key),
      ]),
    ),
  );
}
function createOne(sourceTable) {
  return function one(table, config) {
    return new One(
      sourceTable,
      table,
      config,
      config?.fields.reduce((res, f) => res && f.notNull, true) ?? false,
    );
  };
}
function createMany(sourceTable) {
  return function many(referencedTable, config) {
    return new Many(sourceTable, referencedTable, config);
  };
}
function normalizeRelation(schema, tableNamesMap, relation) {
  if (is(relation, One) && relation.config) {
    return {
      fields: relation.config.fields,
      references: relation.config.references,
    };
  }
  const referencedTableTsName =
    tableNamesMap[getTableUniqueName(relation.referencedTable)];
  if (!referencedTableTsName) {
    throw new Error(
      `Table "${relation.referencedTable[Table.Symbol.Name]}" not found in schema`,
    );
  }
  const referencedTableConfig = schema[referencedTableTsName];
  if (!referencedTableConfig) {
    throw new Error(`Table "${referencedTableTsName}" not found in schema`);
  }
  const sourceTable = relation.sourceTable;
  const sourceTableTsName = tableNamesMap[getTableUniqueName(sourceTable)];
  if (!sourceTableTsName) {
    throw new Error(
      `Table "${sourceTable[Table.Symbol.Name]}" not found in schema`,
    );
  }
  const reverseRelations = [];
  for (const referencedTableRelation of Object.values(
    referencedTableConfig.relations,
  )) {
    if (
      (relation.relationName &&
        relation !== referencedTableRelation &&
        referencedTableRelation.relationName === relation.relationName) ||
      (!relation.relationName &&
        referencedTableRelation.referencedTable === relation.sourceTable)
    ) {
      reverseRelations.push(referencedTableRelation);
    }
  }
  if (reverseRelations.length > 1) {
    throw relation.relationName
      ? new Error(
          `There are multiple relations with name "${relation.relationName}" in table "${referencedTableTsName}"`,
        )
      : new Error(
          `There are multiple relations between "${referencedTableTsName}" and "${relation.sourceTable[Table.Symbol.Name]}". Please specify relation name`,
        );
  }
  if (
    reverseRelations[0] &&
    is(reverseRelations[0], One) &&
    reverseRelations[0].config
  ) {
    return {
      fields: reverseRelations[0].config.references,
      references: reverseRelations[0].config.fields,
    };
  }
  throw new Error(
    `There is not enough information to infer relation "${sourceTableTsName}.${relation.fieldName}"`,
  );
}
function createTableRelationsHelpers(sourceTable) {
  return {
    one: createOne(sourceTable),
    many: createMany(sourceTable),
  };
}
function mapRelationalRow(
  tablesConfig,
  tableConfig,
  row,
  buildQueryResultSelection,
  mapColumnValue = (value) => value,
) {
  const result = {};
  for (const [
    selectionItemIndex,
    selectionItem,
  ] of buildQueryResultSelection.entries()) {
    if (selectionItem.isJson) {
      const relation = tableConfig.relations[selectionItem.tsKey];
      const rawSubRows = row[selectionItemIndex];
      const subRows =
        typeof rawSubRows === 'string' ? JSON.parse(rawSubRows) : rawSubRows;
      result[selectionItem.tsKey] = is(relation, One)
        ? subRows &&
          mapRelationalRow(
            tablesConfig,
            tablesConfig[selectionItem.relationTableTsKey],
            subRows,
            selectionItem.selection,
            mapColumnValue,
          )
        : subRows.map((subRow) =>
            mapRelationalRow(
              tablesConfig,
              tablesConfig[selectionItem.relationTableTsKey],
              subRow,
              selectionItem.selection,
              mapColumnValue,
            ),
          );
    } else {
      const value = mapColumnValue(row[selectionItemIndex]);
      const field = selectionItem.field;
      let decoder;
      if (is(field, Column)) {
        decoder = field;
      } else if (is(field, SQL)) {
        decoder = field.decoder;
      } else {
        decoder = field.sql.decoder;
      }
      result[selectionItem.tsKey] =
        value === null ? null : decoder.mapFromDriverValue(value);
    }
  }
  return result;
}
var Relation, Relations, One, Many;
var init_relations = __esm(() => {
  init_table();
  init_column();
  init_entity();
  init_primary_keys();
  init_expressions();
  init_sql();
  Relation = class Relation {
    constructor(sourceTable, referencedTable, relationName) {
      this.sourceTable = sourceTable;
      this.referencedTable = referencedTable;
      this.relationName = relationName;
      this.referencedTableName = referencedTable[Table.Symbol.Name];
    }
    static [entityKind] = 'Relation';
    referencedTableName;
    fieldName;
  };
  Relations = class Relations {
    constructor(table, config) {
      this.table = table;
      this.config = config;
    }
    static [entityKind] = 'Relations';
  };
  One = class One extends Relation {
    constructor(sourceTable, referencedTable, config, isNullable) {
      super(sourceTable, referencedTable, config?.relationName);
      this.config = config;
      this.isNullable = isNullable;
    }
    static [entityKind] = 'One';
    withFieldName(fieldName) {
      const relation = new One(
        this.sourceTable,
        this.referencedTable,
        this.config,
        this.isNullable,
      );
      relation.fieldName = fieldName;
      return relation;
    }
  };
  Many = class Many extends Relation {
    constructor(sourceTable, referencedTable, config) {
      super(sourceTable, referencedTable, config?.relationName);
      this.config = config;
    }
    static [entityKind] = 'Many';
    withFieldName(fieldName) {
      const relation = new Many(
        this.sourceTable,
        this.referencedTable,
        this.config,
      );
      relation.fieldName = fieldName;
      return relation;
    }
  };
});

// node_modules/drizzle-orm/alias.js
function aliasedTable(table, tableAlias) {
  return new Proxy(table, new TableAliasProxyHandler(tableAlias, false));
}
function aliasedRelation(relation, tableAlias) {
  return new Proxy(relation, new RelationTableAliasProxyHandler(tableAlias));
}
function aliasedTableColumn(column, tableAlias) {
  return new Proxy(
    column,
    new ColumnAliasProxyHandler(
      new Proxy(column.table, new TableAliasProxyHandler(tableAlias, false)),
    ),
  );
}
function mapColumnsInAliasedSQLToAlias(query, alias) {
  return new SQL.Aliased(
    mapColumnsInSQLToAlias(query.sql, alias),
    query.fieldAlias,
  );
}
function mapColumnsInSQLToAlias(query, alias) {
  return sql.join(
    query.queryChunks.map((c) => {
      if (is(c, Column)) {
        return aliasedTableColumn(c, alias);
      }
      if (is(c, SQL)) {
        return mapColumnsInSQLToAlias(c, alias);
      }
      if (is(c, SQL.Aliased)) {
        return mapColumnsInAliasedSQLToAlias(c, alias);
      }
      return c;
    }),
  );
}
var ColumnAliasProxyHandler,
  TableAliasProxyHandler,
  RelationTableAliasProxyHandler;
var init_alias = __esm(() => {
  init_column();
  init_entity();
  init_sql();
  init_table();
  init_view_common();
  ColumnAliasProxyHandler = class ColumnAliasProxyHandler {
    constructor(table) {
      this.table = table;
    }
    static [entityKind] = 'ColumnAliasProxyHandler';
    get(columnObj, prop) {
      if (prop === 'table') {
        return this.table;
      }
      return columnObj[prop];
    }
  };
  TableAliasProxyHandler = class TableAliasProxyHandler {
    constructor(alias, replaceOriginalName) {
      this.alias = alias;
      this.replaceOriginalName = replaceOriginalName;
    }
    static [entityKind] = 'TableAliasProxyHandler';
    get(target, prop) {
      if (prop === Table.Symbol.IsAlias) {
        return true;
      }
      if (prop === Table.Symbol.Name) {
        return this.alias;
      }
      if (this.replaceOriginalName && prop === Table.Symbol.OriginalName) {
        return this.alias;
      }
      if (prop === ViewBaseConfig) {
        return {
          ...target[ViewBaseConfig],
          name: this.alias,
          isAlias: true,
        };
      }
      if (prop === Table.Symbol.Columns) {
        const columns = target[Table.Symbol.Columns];
        if (!columns) {
          return columns;
        }
        const proxiedColumns = {};
        Object.keys(columns).map((key) => {
          proxiedColumns[key] = new Proxy(
            columns[key],
            new ColumnAliasProxyHandler(new Proxy(target, this)),
          );
        });
        return proxiedColumns;
      }
      const value = target[prop];
      if (is(value, Column)) {
        return new Proxy(
          value,
          new ColumnAliasProxyHandler(new Proxy(target, this)),
        );
      }
      return value;
    }
  };
  RelationTableAliasProxyHandler = class RelationTableAliasProxyHandler {
    constructor(alias) {
      this.alias = alias;
    }
    static [entityKind] = 'RelationTableAliasProxyHandler';
    get(target, prop) {
      if (prop === 'sourceTable') {
        return aliasedTable(target.sourceTable, this.alias);
      }
      return target[prop];
    }
  };
});

// node_modules/drizzle-orm/selection-proxy.js
var SelectionProxyHandler;
var init_selection_proxy = __esm(() => {
  init_alias();
  init_column();
  init_entity();
  init_sql();
  init_subquery();
  init_view_common();
  SelectionProxyHandler = class SelectionProxyHandler {
    static [entityKind] = 'SelectionProxyHandler';
    config;
    constructor(config) {
      this.config = { ...config };
    }
    get(subquery, prop) {
      if (prop === '_') {
        return {
          ...subquery['_'],
          selectedFields: new Proxy(subquery._.selectedFields, this),
        };
      }
      if (prop === ViewBaseConfig) {
        return {
          ...subquery[ViewBaseConfig],
          selectedFields: new Proxy(
            subquery[ViewBaseConfig].selectedFields,
            this,
          ),
        };
      }
      if (typeof prop === 'symbol') {
        return subquery[prop];
      }
      const columns = is(subquery, Subquery)
        ? subquery._.selectedFields
        : is(subquery, View)
          ? subquery[ViewBaseConfig].selectedFields
          : subquery;
      const value = columns[prop];
      if (is(value, SQL.Aliased)) {
        if (
          this.config.sqlAliasedBehavior === 'sql' &&
          !value.isSelectionField
        ) {
          return value.sql;
        }
        const newValue = value.clone();
        newValue.isSelectionField = true;
        return newValue;
      }
      if (is(value, SQL)) {
        if (this.config.sqlBehavior === 'sql') {
          return value;
        }
        throw new Error(
          `You tried to reference "${prop}" field from a subquery, which is a raw SQL field, but it doesn't have an alias declared. Please add an alias to the field using ".as('alias')" method.`,
        );
      }
      if (is(value, Column)) {
        if (this.config.alias) {
          return new Proxy(
            value,
            new ColumnAliasProxyHandler(
              new Proxy(
                value.table,
                new TableAliasProxyHandler(
                  this.config.alias,
                  this.config.replaceOriginalName ?? false,
                ),
              ),
            ),
          );
        }
        return value;
      }
      if (typeof value !== 'object' || value === null) {
        return value;
      }
      return new Proxy(value, new SelectionProxyHandler(this.config));
    }
  };
});

// node_modules/drizzle-orm/query-promise.js
var QueryPromise;
var init_query_promise = __esm(() => {
  init_entity();
  QueryPromise = class QueryPromise {
    static [entityKind] = 'QueryPromise';
    [Symbol.toStringTag] = 'QueryPromise';
    catch(onRejected) {
      return this.then(undefined, onRejected);
    }
    finally(onFinally) {
      return this.then(
        (value) => {
          onFinally?.();
          return value;
        },
        (reason) => {
          onFinally?.();
          throw reason;
        },
      );
    }
    then(onFulfilled, onRejected) {
      return this.execute().then(onFulfilled, onRejected);
    }
  };
});

// node_modules/drizzle-orm/sqlite-core/foreign-keys.js
var ForeignKeyBuilder, ForeignKey;
var init_foreign_keys = __esm(() => {
  init_entity();
  init_table_utils();
  ForeignKeyBuilder = class ForeignKeyBuilder {
    static [entityKind] = 'SQLiteForeignKeyBuilder';
    reference;
    _onUpdate;
    _onDelete;
    constructor(config, actions) {
      this.reference = () => {
        const { name: name2, columns, foreignColumns } = config();
        return {
          name: name2,
          columns,
          foreignTable: foreignColumns[0].table,
          foreignColumns,
        };
      };
      if (actions) {
        this._onUpdate = actions.onUpdate;
        this._onDelete = actions.onDelete;
      }
    }
    onUpdate(action) {
      this._onUpdate = action;
      return this;
    }
    onDelete(action) {
      this._onDelete = action;
      return this;
    }
    build(table) {
      return new ForeignKey(table, this);
    }
  };
  ForeignKey = class ForeignKey {
    constructor(table, builder) {
      this.table = table;
      this.reference = builder.reference;
      this.onUpdate = builder._onUpdate;
      this.onDelete = builder._onDelete;
    }
    static [entityKind] = 'SQLiteForeignKey';
    reference;
    onUpdate;
    onDelete;
    getName() {
      const { name: name2, columns, foreignColumns } = this.reference();
      const columnNames = columns.map((column) => column.name);
      const foreignColumnNames = foreignColumns.map((column) => column.name);
      const chunks = [
        this.table[TableName],
        ...columnNames,
        foreignColumns[0].table[TableName],
        ...foreignColumnNames,
      ];
      return name2 ?? `${chunks.join('_')}_fk`;
    }
  };
});

// node_modules/drizzle-orm/sqlite-core/unique-constraint.js
function uniqueKeyName2(table, columns) {
  return `${table[TableName]}_${columns.join('_')}_unique`;
}
var init_unique_constraint2 = __esm(() => {
  init_table_utils();
});

// node_modules/drizzle-orm/sqlite-core/columns/common.js
var SQLiteColumnBuilder, SQLiteColumn;
var init_common2 = __esm(() => {
  init_column_builder();
  init_column();
  init_entity();
  init_foreign_keys();
  init_unique_constraint2();
  SQLiteColumnBuilder = class SQLiteColumnBuilder extends ColumnBuilder {
    static [entityKind] = 'SQLiteColumnBuilder';
    foreignKeyConfigs = [];
    references(ref, actions = {}) {
      this.foreignKeyConfigs.push({ ref, actions });
      return this;
    }
    unique(name2) {
      this.config.isUnique = true;
      this.config.uniqueName = name2;
      return this;
    }
    generatedAlwaysAs(as, config) {
      this.config.generated = {
        as,
        type: 'always',
        mode: config?.mode ?? 'virtual',
      };
      return this;
    }
    buildForeignKeys(column, table) {
      return this.foreignKeyConfigs.map(({ ref, actions }) => {
        return ((ref2, actions2) => {
          const builder = new ForeignKeyBuilder(() => {
            const foreignColumn = ref2();
            return { columns: [column], foreignColumns: [foreignColumn] };
          });
          if (actions2.onUpdate) {
            builder.onUpdate(actions2.onUpdate);
          }
          if (actions2.onDelete) {
            builder.onDelete(actions2.onDelete);
          }
          return builder.build(table);
        })(ref, actions);
      });
    }
  };
  SQLiteColumn = class SQLiteColumn extends Column {
    constructor(table, config) {
      if (!config.uniqueName) {
        config.uniqueName = uniqueKeyName2(table, [config.name]);
      }
      super(table, config);
      this.table = table;
    }
    static [entityKind] = 'SQLiteColumn';
  };
});

// node_modules/drizzle-orm/sqlite-core/columns/blob.js
function blob(a, b) {
  const { name: name2, config } = getColumnNameAndConfig(a, b);
  if (config?.mode === 'json') {
    return new SQLiteBlobJsonBuilder(name2);
  }
  if (config?.mode === 'bigint') {
    return new SQLiteBigIntBuilder(name2);
  }
  return new SQLiteBlobBufferBuilder(name2);
}
var SQLiteBigIntBuilder,
  SQLiteBigInt,
  SQLiteBlobJsonBuilder,
  SQLiteBlobJson,
  SQLiteBlobBufferBuilder,
  SQLiteBlobBuffer;
var init_blob = __esm(() => {
  init_entity();
  init_utils();
  init_common2();
  SQLiteBigIntBuilder = class SQLiteBigIntBuilder extends SQLiteColumnBuilder {
    static [entityKind] = 'SQLiteBigIntBuilder';
    constructor(name2) {
      super(name2, 'bigint', 'SQLiteBigInt');
    }
    build(table) {
      return new SQLiteBigInt(table, this.config);
    }
  };
  SQLiteBigInt = class SQLiteBigInt extends SQLiteColumn {
    static [entityKind] = 'SQLiteBigInt';
    getSQLType() {
      return 'blob';
    }
    mapFromDriverValue(value) {
      if (typeof Buffer !== 'undefined' && Buffer.from) {
        const buf = Buffer.isBuffer(value)
          ? value
          : value instanceof ArrayBuffer
            ? Buffer.from(value)
            : value.buffer
              ? Buffer.from(value.buffer, value.byteOffset, value.byteLength)
              : Buffer.from(value);
        return BigInt(buf.toString('utf8'));
      }
      return BigInt(textDecoder.decode(value));
    }
    mapToDriverValue(value) {
      return Buffer.from(value.toString());
    }
  };
  SQLiteBlobJsonBuilder = class SQLiteBlobJsonBuilder extends (
    SQLiteColumnBuilder
  ) {
    static [entityKind] = 'SQLiteBlobJsonBuilder';
    constructor(name2) {
      super(name2, 'json', 'SQLiteBlobJson');
    }
    build(table) {
      return new SQLiteBlobJson(table, this.config);
    }
  };
  SQLiteBlobJson = class SQLiteBlobJson extends SQLiteColumn {
    static [entityKind] = 'SQLiteBlobJson';
    getSQLType() {
      return 'blob';
    }
    mapFromDriverValue(value) {
      if (typeof Buffer !== 'undefined' && Buffer.from) {
        const buf = Buffer.isBuffer(value)
          ? value
          : value instanceof ArrayBuffer
            ? Buffer.from(value)
            : value.buffer
              ? Buffer.from(value.buffer, value.byteOffset, value.byteLength)
              : Buffer.from(value);
        return JSON.parse(buf.toString('utf8'));
      }
      return JSON.parse(textDecoder.decode(value));
    }
    mapToDriverValue(value) {
      return Buffer.from(JSON.stringify(value));
    }
  };
  SQLiteBlobBufferBuilder = class SQLiteBlobBufferBuilder extends (
    SQLiteColumnBuilder
  ) {
    static [entityKind] = 'SQLiteBlobBufferBuilder';
    constructor(name2) {
      super(name2, 'buffer', 'SQLiteBlobBuffer');
    }
    build(table) {
      return new SQLiteBlobBuffer(table, this.config);
    }
  };
  SQLiteBlobBuffer = class SQLiteBlobBuffer extends SQLiteColumn {
    static [entityKind] = 'SQLiteBlobBuffer';
    mapFromDriverValue(value) {
      if (Buffer.isBuffer(value)) {
        return value;
      }
      return Buffer.from(value);
    }
    getSQLType() {
      return 'blob';
    }
  };
});

// node_modules/drizzle-orm/sqlite-core/columns/custom.js
function customType(customTypeParams) {
  return (a, b) => {
    const { name: name2, config } = getColumnNameAndConfig(a, b);
    return new SQLiteCustomColumnBuilder(name2, config, customTypeParams);
  };
}
var SQLiteCustomColumnBuilder, SQLiteCustomColumn;
var init_custom = __esm(() => {
  init_entity();
  init_utils();
  init_common2();
  SQLiteCustomColumnBuilder = class SQLiteCustomColumnBuilder extends (
    SQLiteColumnBuilder
  ) {
    static [entityKind] = 'SQLiteCustomColumnBuilder';
    constructor(name2, fieldConfig, customTypeParams) {
      super(name2, 'custom', 'SQLiteCustomColumn');
      this.config.fieldConfig = fieldConfig;
      this.config.customTypeParams = customTypeParams;
    }
    build(table) {
      return new SQLiteCustomColumn(table, this.config);
    }
  };
  SQLiteCustomColumn = class SQLiteCustomColumn extends SQLiteColumn {
    static [entityKind] = 'SQLiteCustomColumn';
    sqlName;
    mapTo;
    mapFrom;
    constructor(table, config) {
      super(table, config);
      this.sqlName = config.customTypeParams.dataType(config.fieldConfig);
      this.mapTo = config.customTypeParams.toDriver;
      this.mapFrom = config.customTypeParams.fromDriver;
    }
    getSQLType() {
      return this.sqlName;
    }
    mapFromDriverValue(value) {
      return typeof this.mapFrom === 'function' ? this.mapFrom(value) : value;
    }
    mapToDriverValue(value) {
      return typeof this.mapTo === 'function' ? this.mapTo(value) : value;
    }
  };
});

// node_modules/drizzle-orm/sqlite-core/columns/integer.js
function integer(a, b) {
  const { name: name2, config } = getColumnNameAndConfig(a, b);
  if (config?.mode === 'timestamp' || config?.mode === 'timestamp_ms') {
    return new SQLiteTimestampBuilder(name2, config.mode);
  }
  if (config?.mode === 'boolean') {
    return new SQLiteBooleanBuilder(name2, config.mode);
  }
  return new SQLiteIntegerBuilder(name2);
}
var SQLiteBaseIntegerBuilder,
  SQLiteBaseInteger,
  SQLiteIntegerBuilder,
  SQLiteInteger,
  SQLiteTimestampBuilder,
  SQLiteTimestamp,
  SQLiteBooleanBuilder,
  SQLiteBoolean;
var init_integer = __esm(() => {
  init_entity();
  init_sql();
  init_utils();
  init_common2();
  SQLiteBaseIntegerBuilder = class SQLiteBaseIntegerBuilder extends (
    SQLiteColumnBuilder
  ) {
    static [entityKind] = 'SQLiteBaseIntegerBuilder';
    constructor(name2, dataType, columnType) {
      super(name2, dataType, columnType);
      this.config.autoIncrement = false;
    }
    primaryKey(config) {
      if (config?.autoIncrement) {
        this.config.autoIncrement = true;
      }
      this.config.hasDefault = true;
      return super.primaryKey();
    }
  };
  SQLiteBaseInteger = class SQLiteBaseInteger extends SQLiteColumn {
    static [entityKind] = 'SQLiteBaseInteger';
    autoIncrement = this.config.autoIncrement;
    getSQLType() {
      return 'integer';
    }
  };
  SQLiteIntegerBuilder = class SQLiteIntegerBuilder extends (
    SQLiteBaseIntegerBuilder
  ) {
    static [entityKind] = 'SQLiteIntegerBuilder';
    constructor(name2) {
      super(name2, 'number', 'SQLiteInteger');
    }
    build(table) {
      return new SQLiteInteger(table, this.config);
    }
  };
  SQLiteInteger = class SQLiteInteger extends SQLiteBaseInteger {
    static [entityKind] = 'SQLiteInteger';
  };
  SQLiteTimestampBuilder = class SQLiteTimestampBuilder extends (
    SQLiteBaseIntegerBuilder
  ) {
    static [entityKind] = 'SQLiteTimestampBuilder';
    constructor(name2, mode) {
      super(name2, 'date', 'SQLiteTimestamp');
      this.config.mode = mode;
    }
    defaultNow() {
      return this.default(
        sql`(cast((julianday('now') - 2440587.5)*86400000 as integer))`,
      );
    }
    build(table) {
      return new SQLiteTimestamp(table, this.config);
    }
  };
  SQLiteTimestamp = class SQLiteTimestamp extends SQLiteBaseInteger {
    static [entityKind] = 'SQLiteTimestamp';
    mode = this.config.mode;
    mapFromDriverValue(value) {
      if (this.config.mode === 'timestamp') {
        return new Date(value * 1000);
      }
      return new Date(value);
    }
    mapToDriverValue(value) {
      const unix = value.getTime();
      if (this.config.mode === 'timestamp') {
        return Math.floor(unix / 1000);
      }
      return unix;
    }
  };
  SQLiteBooleanBuilder = class SQLiteBooleanBuilder extends (
    SQLiteBaseIntegerBuilder
  ) {
    static [entityKind] = 'SQLiteBooleanBuilder';
    constructor(name2, mode) {
      super(name2, 'boolean', 'SQLiteBoolean');
      this.config.mode = mode;
    }
    build(table) {
      return new SQLiteBoolean(table, this.config);
    }
  };
  SQLiteBoolean = class SQLiteBoolean extends SQLiteBaseInteger {
    static [entityKind] = 'SQLiteBoolean';
    mode = this.config.mode;
    mapFromDriverValue(value) {
      return Number(value) === 1;
    }
    mapToDriverValue(value) {
      return value ? 1 : 0;
    }
  };
});

// node_modules/drizzle-orm/sqlite-core/columns/numeric.js
function numeric(a, b) {
  const { name: name2, config } = getColumnNameAndConfig(a, b);
  const mode = config?.mode;
  return mode === 'number'
    ? new SQLiteNumericNumberBuilder(name2)
    : mode === 'bigint'
      ? new SQLiteNumericBigIntBuilder(name2)
      : new SQLiteNumericBuilder(name2);
}
var SQLiteNumericBuilder,
  SQLiteNumeric,
  SQLiteNumericNumberBuilder,
  SQLiteNumericNumber,
  SQLiteNumericBigIntBuilder,
  SQLiteNumericBigInt;
var init_numeric = __esm(() => {
  init_entity();
  init_utils();
  init_common2();
  SQLiteNumericBuilder = class SQLiteNumericBuilder extends (
    SQLiteColumnBuilder
  ) {
    static [entityKind] = 'SQLiteNumericBuilder';
    constructor(name2) {
      super(name2, 'string', 'SQLiteNumeric');
    }
    build(table) {
      return new SQLiteNumeric(table, this.config);
    }
  };
  SQLiteNumeric = class SQLiteNumeric extends SQLiteColumn {
    static [entityKind] = 'SQLiteNumeric';
    mapFromDriverValue(value) {
      if (typeof value === 'string') return value;
      return String(value);
    }
    getSQLType() {
      return 'numeric';
    }
  };
  SQLiteNumericNumberBuilder = class SQLiteNumericNumberBuilder extends (
    SQLiteColumnBuilder
  ) {
    static [entityKind] = 'SQLiteNumericNumberBuilder';
    constructor(name2) {
      super(name2, 'number', 'SQLiteNumericNumber');
    }
    build(table) {
      return new SQLiteNumericNumber(table, this.config);
    }
  };
  SQLiteNumericNumber = class SQLiteNumericNumber extends SQLiteColumn {
    static [entityKind] = 'SQLiteNumericNumber';
    mapFromDriverValue(value) {
      if (typeof value === 'number') return value;
      return Number(value);
    }
    mapToDriverValue = String;
    getSQLType() {
      return 'numeric';
    }
  };
  SQLiteNumericBigIntBuilder = class SQLiteNumericBigIntBuilder extends (
    SQLiteColumnBuilder
  ) {
    static [entityKind] = 'SQLiteNumericBigIntBuilder';
    constructor(name2) {
      super(name2, 'bigint', 'SQLiteNumericBigInt');
    }
    build(table) {
      return new SQLiteNumericBigInt(table, this.config);
    }
  };
  SQLiteNumericBigInt = class SQLiteNumericBigInt extends SQLiteColumn {
    static [entityKind] = 'SQLiteNumericBigInt';
    mapFromDriverValue = BigInt;
    mapToDriverValue = String;
    getSQLType() {
      return 'numeric';
    }
  };
});

// node_modules/drizzle-orm/sqlite-core/columns/real.js
function real(name2) {
  return new SQLiteRealBuilder(name2 ?? '');
}
var SQLiteRealBuilder, SQLiteReal;
var init_real = __esm(() => {
  init_entity();
  init_common2();
  SQLiteRealBuilder = class SQLiteRealBuilder extends SQLiteColumnBuilder {
    static [entityKind] = 'SQLiteRealBuilder';
    constructor(name2) {
      super(name2, 'number', 'SQLiteReal');
    }
    build(table) {
      return new SQLiteReal(table, this.config);
    }
  };
  SQLiteReal = class SQLiteReal extends SQLiteColumn {
    static [entityKind] = 'SQLiteReal';
    getSQLType() {
      return 'real';
    }
  };
});

// node_modules/drizzle-orm/sqlite-core/columns/text.js
function text(a, b = {}) {
  const { name: name2, config } = getColumnNameAndConfig(a, b);
  if (config.mode === 'json') {
    return new SQLiteTextJsonBuilder(name2);
  }
  return new SQLiteTextBuilder(name2, config);
}
var SQLiteTextBuilder, SQLiteText, SQLiteTextJsonBuilder, SQLiteTextJson;
var init_text = __esm(() => {
  init_entity();
  init_utils();
  init_common2();
  SQLiteTextBuilder = class SQLiteTextBuilder extends SQLiteColumnBuilder {
    static [entityKind] = 'SQLiteTextBuilder';
    constructor(name2, config) {
      super(name2, 'string', 'SQLiteText');
      this.config.enumValues = config.enum;
      this.config.length = config.length;
    }
    build(table) {
      return new SQLiteText(table, this.config);
    }
  };
  SQLiteText = class SQLiteText extends SQLiteColumn {
    static [entityKind] = 'SQLiteText';
    enumValues = this.config.enumValues;
    length = this.config.length;
    constructor(table, config) {
      super(table, config);
    }
    getSQLType() {
      return `text${this.config.length ? `(${this.config.length})` : ''}`;
    }
  };
  SQLiteTextJsonBuilder = class SQLiteTextJsonBuilder extends (
    SQLiteColumnBuilder
  ) {
    static [entityKind] = 'SQLiteTextJsonBuilder';
    constructor(name2) {
      super(name2, 'json', 'SQLiteTextJson');
    }
    build(table) {
      return new SQLiteTextJson(table, this.config);
    }
  };
  SQLiteTextJson = class SQLiteTextJson extends SQLiteColumn {
    static [entityKind] = 'SQLiteTextJson';
    getSQLType() {
      return 'text';
    }
    mapFromDriverValue(value) {
      return JSON.parse(value);
    }
    mapToDriverValue(value) {
      return JSON.stringify(value);
    }
  };
});

// node_modules/drizzle-orm/sqlite-core/columns/all.js
function getSQLiteColumnBuilders() {
  return {
    blob,
    customType,
    integer,
    numeric,
    real,
    text,
  };
}
var init_all = __esm(() => {
  init_blob();
  init_custom();
  init_integer();
  init_numeric();
  init_real();
  init_text();
});

// node_modules/drizzle-orm/sqlite-core/table.js
function sqliteTableBase(
  name2,
  columns,
  extraConfig,
  schema,
  baseName = name2,
) {
  const rawTable = new SQLiteTable(name2, schema, baseName);
  const parsedColumns =
    typeof columns === 'function'
      ? columns(getSQLiteColumnBuilders())
      : columns;
  const builtColumns = Object.fromEntries(
    Object.entries(parsedColumns).map(([name22, colBuilderBase]) => {
      const colBuilder = colBuilderBase;
      colBuilder.setName(name22);
      const column = colBuilder.build(rawTable);
      rawTable[InlineForeignKeys2].push(
        ...colBuilder.buildForeignKeys(column, rawTable),
      );
      return [name22, column];
    }),
  );
  const table = Object.assign(rawTable, builtColumns);
  table[Table.Symbol.Columns] = builtColumns;
  table[Table.Symbol.ExtraConfigColumns] = builtColumns;
  if (extraConfig) {
    table[SQLiteTable.Symbol.ExtraConfigBuilder] = extraConfig;
  }
  return table;
}
var InlineForeignKeys2,
  SQLiteTable,
  sqliteTable = (name2, columns, extraConfig) => {
    return sqliteTableBase(name2, columns, extraConfig);
  };
var init_table3 = __esm(() => {
  init_entity();
  init_table();
  init_all();
  InlineForeignKeys2 = Symbol.for('drizzle:SQLiteInlineForeignKeys');
  SQLiteTable = class SQLiteTable extends Table {
    static [entityKind] = 'SQLiteTable';
    static Symbol = Object.assign({}, Table.Symbol, {
      InlineForeignKeys: InlineForeignKeys2,
    });
    [Table.Symbol.Columns];
    [InlineForeignKeys2] = [];
    [Table.Symbol.ExtraConfigBuilder] = undefined;
  };
});

// node_modules/drizzle-orm/sqlite-core/checks.js
var init_checks = () => {};

// node_modules/drizzle-orm/sqlite-core/indexes.js
function index(name2) {
  return new IndexBuilderOn(name2, false);
}
var IndexBuilderOn, IndexBuilder, Index;
var init_indexes = __esm(() => {
  init_entity();
  IndexBuilderOn = class IndexBuilderOn {
    constructor(name2, unique) {
      this.name = name2;
      this.unique = unique;
    }
    static [entityKind] = 'SQLiteIndexBuilderOn';
    on(...columns) {
      return new IndexBuilder(this.name, columns, this.unique);
    }
  };
  IndexBuilder = class IndexBuilder {
    static [entityKind] = 'SQLiteIndexBuilder';
    config;
    constructor(name2, columns, unique) {
      this.config = {
        name: name2,
        columns,
        unique,
        where: undefined,
      };
    }
    where(condition) {
      this.config.where = condition;
      return this;
    }
    build(table) {
      return new Index(this.config, table);
    }
  };
  Index = class Index {
    static [entityKind] = 'SQLiteIndex';
    config;
    constructor(config, table) {
      this.config = { ...config, table };
    }
  };
});

// node_modules/drizzle-orm/sqlite-core/primary-keys.js
var init_primary_keys2 = () => {};

// node_modules/drizzle-orm/sqlite-core/utils.js
function extractUsedTable(table) {
  if (is(table, SQLiteTable)) {
    return [`${table[Table.Symbol.BaseName]}`];
  }
  if (is(table, Subquery)) {
    return table._.usedTables ?? [];
  }
  if (is(table, SQL)) {
    return table.usedTables ?? [];
  }
  return [];
}
var init_utils2 = __esm(() => {
  init_entity();
  init_sql();
  init_subquery();
  init_table();
  init_table3();
});

// node_modules/drizzle-orm/sqlite-core/query-builders/delete.js
var SQLiteDeleteBase;
var init_delete = __esm(() => {
  init_entity();
  init_query_promise();
  init_selection_proxy();
  init_table3();
  init_table();
  init_utils();
  init_utils2();
  SQLiteDeleteBase = class SQLiteDeleteBase extends QueryPromise {
    constructor(table, session, dialect, withList) {
      super();
      this.table = table;
      this.session = session;
      this.dialect = dialect;
      this.config = { table, withList };
    }
    static [entityKind] = 'SQLiteDelete';
    config;
    where(where) {
      this.config.where = where;
      return this;
    }
    orderBy(...columns) {
      if (typeof columns[0] === 'function') {
        const orderBy = columns[0](
          new Proxy(
            this.config.table[Table.Symbol.Columns],
            new SelectionProxyHandler({
              sqlAliasedBehavior: 'alias',
              sqlBehavior: 'sql',
            }),
          ),
        );
        const orderByArray = Array.isArray(orderBy) ? orderBy : [orderBy];
        this.config.orderBy = orderByArray;
      } else {
        const orderByArray = columns;
        this.config.orderBy = orderByArray;
      }
      return this;
    }
    limit(limit) {
      this.config.limit = limit;
      return this;
    }
    returning(fields = this.table[SQLiteTable.Symbol.Columns]) {
      this.config.returning = orderSelectedFields(fields);
      return this;
    }
    getSQL() {
      return this.dialect.buildDeleteQuery(this.config);
    }
    toSQL() {
      const { typings: _typings, ...rest } = this.dialect.sqlToQuery(
        this.getSQL(),
      );
      return rest;
    }
    _prepare(isOneTimeQuery = true) {
      return this.session[
        isOneTimeQuery ? 'prepareOneTimeQuery' : 'prepareQuery'
      ](
        this.dialect.sqlToQuery(this.getSQL()),
        this.config.returning,
        this.config.returning ? 'all' : 'run',
        true,
        undefined,
        {
          type: 'delete',
          tables: extractUsedTable(this.config.table),
        },
      );
    }
    prepare() {
      return this._prepare(false);
    }
    run = (placeholderValues) => {
      return this._prepare().run(placeholderValues);
    };
    all = (placeholderValues) => {
      return this._prepare().all(placeholderValues);
    };
    get = (placeholderValues) => {
      return this._prepare().get(placeholderValues);
    };
    values = (placeholderValues) => {
      return this._prepare().values(placeholderValues);
    };
    async execute(placeholderValues) {
      return this._prepare().execute(placeholderValues);
    }
    $dynamic() {
      return this;
    }
  };
});

// node_modules/drizzle-orm/casing.js
function toSnakeCase(input) {
  const words =
    input
      .replace(/['\u2019]/g, '')
      .match(/[\da-z]+|[A-Z]+(?![a-z])|[A-Z][\da-z]+/g) ?? [];
  return words.map((word) => word.toLowerCase()).join('_');
}
function toCamelCase(input) {
  const words =
    input
      .replace(/['\u2019]/g, '')
      .match(/[\da-z]+|[A-Z]+(?![a-z])|[A-Z][\da-z]+/g) ?? [];
  return words.reduce((acc, word, i) => {
    const formattedWord =
      i === 0 ? word.toLowerCase() : `${word[0].toUpperCase()}${word.slice(1)}`;
    return acc + formattedWord;
  }, '');
}
function noopCase(input) {
  return input;
}
var CasingCache;
var init_casing = __esm(() => {
  init_entity();
  init_table();
  CasingCache = class CasingCache {
    static [entityKind] = 'CasingCache';
    cache = {};
    cachedTables = {};
    convert;
    constructor(casing) {
      this.convert =
        casing === 'snake_case'
          ? toSnakeCase
          : casing === 'camelCase'
            ? toCamelCase
            : noopCase;
    }
    getColumnCasing(column) {
      if (!column.keyAsName) return column.name;
      const schema = column.table[Table.Symbol.Schema] ?? 'public';
      const tableName = column.table[Table.Symbol.OriginalName];
      const key = `${schema}.${tableName}.${column.name}`;
      if (!this.cache[key]) {
        this.cacheTable(column.table);
      }
      return this.cache[key];
    }
    cacheTable(table) {
      const schema = table[Table.Symbol.Schema] ?? 'public';
      const tableName = table[Table.Symbol.OriginalName];
      const tableKey = `${schema}.${tableName}`;
      if (!this.cachedTables[tableKey]) {
        for (const column of Object.values(table[Table.Symbol.Columns])) {
          const columnKey = `${tableKey}.${column.name}`;
          this.cache[columnKey] = this.convert(column.name);
        }
        this.cachedTables[tableKey] = true;
      }
    }
    clearCache() {
      this.cache = {};
      this.cachedTables = {};
    }
  };
});

// node_modules/drizzle-orm/errors.js
var DrizzleError, DrizzleQueryError, TransactionRollbackError;
var init_errors = __esm(() => {
  init_entity();
  DrizzleError = class DrizzleError extends Error {
    static [entityKind] = 'DrizzleError';
    constructor({ message, cause }) {
      super(message);
      this.name = 'DrizzleError';
      this.cause = cause;
    }
  };
  DrizzleQueryError = class DrizzleQueryError extends Error {
    constructor(query, params, cause) {
      super(`Failed query: ${query}
params: ${params}`);
      this.query = query;
      this.params = params;
      this.cause = cause;
      Error.captureStackTrace(this, DrizzleQueryError);
      if (cause) this.cause = cause;
    }
  };
  TransactionRollbackError = class TransactionRollbackError extends (
    DrizzleError
  ) {
    static [entityKind] = 'TransactionRollbackError';
    constructor() {
      super({ message: 'Rollback' });
    }
  };
});

// node_modules/drizzle-orm/sql/functions/aggregate.js
function count(expression) {
  return sql`count(${expression || sql.raw('*')})`.mapWith(Number);
}
function countDistinct(expression) {
  return sql`count(distinct ${expression})`.mapWith(Number);
}
function avg(expression) {
  return sql`avg(${expression})`.mapWith(String);
}
function avgDistinct(expression) {
  return sql`avg(distinct ${expression})`.mapWith(String);
}
function sum(expression) {
  return sql`sum(${expression})`.mapWith(String);
}
function sumDistinct(expression) {
  return sql`sum(distinct ${expression})`.mapWith(String);
}
function max(expression) {
  return sql`max(${expression})`.mapWith(
    is(expression, Column) ? expression : String,
  );
}
function min(expression) {
  return sql`min(${expression})`.mapWith(
    is(expression, Column) ? expression : String,
  );
}
var init_aggregate = __esm(() => {
  init_column();
  init_entity();
  init_sql();
});

// node_modules/drizzle-orm/sql/functions/vector.js
function toSql(value) {
  return JSON.stringify(value);
}
function l2Distance(column, value) {
  if (Array.isArray(value)) {
    return sql`${column} <-> ${toSql(value)}`;
  }
  return sql`${column} <-> ${value}`;
}
function l1Distance(column, value) {
  if (Array.isArray(value)) {
    return sql`${column} <+> ${toSql(value)}`;
  }
  return sql`${column} <+> ${value}`;
}
function innerProduct(column, value) {
  if (Array.isArray(value)) {
    return sql`${column} <#> ${toSql(value)}`;
  }
  return sql`${column} <#> ${value}`;
}
function cosineDistance(column, value) {
  if (Array.isArray(value)) {
    return sql`${column} <=> ${toSql(value)}`;
  }
  return sql`${column} <=> ${value}`;
}
function hammingDistance(column, value) {
  if (Array.isArray(value)) {
    return sql`${column} <~> ${toSql(value)}`;
  }
  return sql`${column} <~> ${value}`;
}
function jaccardDistance(column, value) {
  if (Array.isArray(value)) {
    return sql`${column} <%> ${toSql(value)}`;
  }
  return sql`${column} <%> ${value}`;
}
var init_vector = __esm(() => {
  init_sql();
});

// node_modules/drizzle-orm/sql/functions/index.js
var init_functions = __esm(() => {
  init_aggregate();
  init_vector();
});

// node_modules/drizzle-orm/sql/index.js
var init_sql2 = __esm(() => {
  init_expressions();
  init_functions();
  init_sql();
});

// node_modules/drizzle-orm/sqlite-core/columns/index.js
var init_columns = __esm(() => {
  init_blob();
  init_common2();
  init_custom();
  init_integer();
  init_numeric();
  init_real();
  init_text();
});

// node_modules/drizzle-orm/sqlite-core/view-base.js
var SQLiteViewBase;
var init_view_base = __esm(() => {
  init_entity();
  init_sql();
  SQLiteViewBase = class SQLiteViewBase extends View {
    static [entityKind] = 'SQLiteViewBase';
  };
});

// node_modules/drizzle-orm/sqlite-core/dialect.js
var SQLiteDialect, SQLiteSyncDialect;
var init_dialect = __esm(() => {
  init_alias();
  init_casing();
  init_column();
  init_entity();
  init_errors();
  init_relations();
  init_sql2();
  init_sql();
  init_columns();
  init_table3();
  init_subquery();
  init_table();
  init_utils();
  init_view_common();
  init_view_base();
  SQLiteDialect = class SQLiteDialect {
    static [entityKind] = 'SQLiteDialect';
    casing;
    constructor(config) {
      this.casing = new CasingCache(config?.casing);
    }
    escapeName(name2) {
      return `"${name2.replace(/"/g, '""')}"`;
    }
    escapeParam(_num) {
      return '?';
    }
    escapeString(str) {
      return `'${str.replace(/'/g, "''")}'`;
    }
    buildWithCTE(queries) {
      if (!queries?.length) return;
      const withSqlChunks = [sql`with `];
      for (const [i, w] of queries.entries()) {
        withSqlChunks.push(sql`${sql.identifier(w._.alias)} as (${w._.sql})`);
        if (i < queries.length - 1) {
          withSqlChunks.push(sql`, `);
        }
      }
      withSqlChunks.push(sql` `);
      return sql.join(withSqlChunks);
    }
    buildDeleteQuery({ table, where, returning, withList, limit, orderBy }) {
      const withSql = this.buildWithCTE(withList);
      const returningSql = returning
        ? sql` returning ${this.buildSelection(returning, { isSingleTable: true })}`
        : undefined;
      const whereSql = where ? sql` where ${where}` : undefined;
      const orderBySql = this.buildOrderBy(orderBy);
      const limitSql = this.buildLimit(limit);
      return sql`${withSql}delete from ${table}${whereSql}${returningSql}${orderBySql}${limitSql}`;
    }
    buildUpdateSet(table, set) {
      const tableColumns = table[Table.Symbol.Columns];
      const columnNames = Object.keys(tableColumns).filter(
        (colName) =>
          set[colName] !== undefined ||
          tableColumns[colName]?.onUpdateFn !== undefined,
      );
      const setSize = columnNames.length;
      return sql.join(
        columnNames.flatMap((colName, i) => {
          const col = tableColumns[colName];
          const onUpdateFnResult = col.onUpdateFn?.();
          const value =
            set[colName] ??
            (is(onUpdateFnResult, SQL)
              ? onUpdateFnResult
              : sql.param(onUpdateFnResult, col));
          const res = sql`${sql.identifier(this.casing.getColumnCasing(col))} = ${value}`;
          if (i < setSize - 1) {
            return [res, sql.raw(', ')];
          }
          return [res];
        }),
      );
    }
    buildUpdateQuery({
      table,
      set,
      where,
      returning,
      withList,
      joins,
      from,
      limit,
      orderBy,
    }) {
      const withSql = this.buildWithCTE(withList);
      const setSql = this.buildUpdateSet(table, set);
      const fromSql =
        from && sql.join([sql.raw(' from '), this.buildFromTable(from)]);
      const joinsSql = this.buildJoins(joins);
      const returningSql = returning
        ? sql` returning ${this.buildSelection(returning, { isSingleTable: true })}`
        : undefined;
      const whereSql = where ? sql` where ${where}` : undefined;
      const orderBySql = this.buildOrderBy(orderBy);
      const limitSql = this.buildLimit(limit);
      return sql`${withSql}update ${table} set ${setSql}${fromSql}${joinsSql}${whereSql}${returningSql}${orderBySql}${limitSql}`;
    }
    buildSelection(fields, { isSingleTable = false } = {}) {
      const columnsLen = fields.length;
      const chunks = fields.flatMap(({ field }, i) => {
        const chunk = [];
        if (is(field, SQL.Aliased) && field.isSelectionField) {
          chunk.push(sql.identifier(field.fieldAlias));
        } else if (is(field, SQL.Aliased) || is(field, SQL)) {
          const query = is(field, SQL.Aliased) ? field.sql : field;
          if (isSingleTable) {
            chunk.push(
              new SQL(
                query.queryChunks.map((c) => {
                  if (is(c, Column)) {
                    return sql.identifier(this.casing.getColumnCasing(c));
                  }
                  return c;
                }),
              ),
            );
          } else {
            chunk.push(query);
          }
          if (is(field, SQL.Aliased)) {
            chunk.push(sql` as ${sql.identifier(field.fieldAlias)}`);
          }
        } else if (is(field, Column)) {
          const tableName = field.table[Table.Symbol.Name];
          if (field.columnType === 'SQLiteNumericBigInt') {
            if (isSingleTable) {
              chunk.push(
                sql`cast(${sql.identifier(this.casing.getColumnCasing(field))} as text)`,
              );
            } else {
              chunk.push(
                sql`cast(${sql.identifier(tableName)}.${sql.identifier(this.casing.getColumnCasing(field))} as text)`,
              );
            }
          } else {
            if (isSingleTable) {
              chunk.push(sql.identifier(this.casing.getColumnCasing(field)));
            } else {
              chunk.push(
                sql`${sql.identifier(tableName)}.${sql.identifier(this.casing.getColumnCasing(field))}`,
              );
            }
          }
        } else if (is(field, Subquery)) {
          const entries = Object.entries(field._.selectedFields);
          if (entries.length === 1) {
            const entry = entries[0][1];
            const fieldDecoder = is(entry, SQL)
              ? entry.decoder
              : is(entry, Column)
                ? { mapFromDriverValue: (v) => entry.mapFromDriverValue(v) }
                : entry.sql.decoder;
            if (fieldDecoder) field._.sql.decoder = fieldDecoder;
          }
          chunk.push(field);
        }
        if (i < columnsLen - 1) {
          chunk.push(sql`, `);
        }
        return chunk;
      });
      return sql.join(chunks);
    }
    buildJoins(joins) {
      if (!joins || joins.length === 0) {
        return;
      }
      const joinsArray = [];
      if (joins) {
        for (const [index2, joinMeta] of joins.entries()) {
          if (index2 === 0) {
            joinsArray.push(sql` `);
          }
          const table = joinMeta.table;
          const onSql = joinMeta.on ? sql` on ${joinMeta.on}` : undefined;
          if (is(table, SQLiteTable)) {
            const tableName = table[SQLiteTable.Symbol.Name];
            const tableSchema = table[SQLiteTable.Symbol.Schema];
            const origTableName = table[SQLiteTable.Symbol.OriginalName];
            const alias =
              tableName === origTableName ? undefined : joinMeta.alias;
            joinsArray.push(
              sql`${sql.raw(joinMeta.joinType)} join ${tableSchema ? sql`${sql.identifier(tableSchema)}.` : undefined}${sql.identifier(origTableName)}${alias && sql` ${sql.identifier(alias)}`}${onSql}`,
            );
          } else {
            joinsArray.push(
              sql`${sql.raw(joinMeta.joinType)} join ${table}${onSql}`,
            );
          }
          if (index2 < joins.length - 1) {
            joinsArray.push(sql` `);
          }
        }
      }
      return sql.join(joinsArray);
    }
    buildLimit(limit) {
      return typeof limit === 'object' ||
        (typeof limit === 'number' && limit >= 0)
        ? sql` limit ${limit}`
        : undefined;
    }
    buildOrderBy(orderBy) {
      const orderByList = [];
      if (orderBy) {
        for (const [index2, orderByValue] of orderBy.entries()) {
          orderByList.push(orderByValue);
          if (index2 < orderBy.length - 1) {
            orderByList.push(sql`, `);
          }
        }
      }
      return orderByList.length > 0
        ? sql` order by ${sql.join(orderByList)}`
        : undefined;
    }
    buildFromTable(table) {
      if (is(table, Table) && table[Table.Symbol.IsAlias]) {
        return sql`${sql`${sql.identifier(table[Table.Symbol.Schema] ?? '')}.`.if(table[Table.Symbol.Schema])}${sql.identifier(table[Table.Symbol.OriginalName])} ${sql.identifier(table[Table.Symbol.Name])}`;
      }
      return table;
    }
    buildSelectQuery({
      withList,
      fields,
      fieldsFlat,
      where,
      having,
      table,
      joins,
      orderBy,
      groupBy,
      limit,
      offset,
      distinct,
      setOperators,
    }) {
      const fieldsList = fieldsFlat ?? orderSelectedFields(fields);
      for (const f of fieldsList) {
        if (
          is(f.field, Column) &&
          getTableName(f.field.table) !==
            (is(table, Subquery)
              ? table._.alias
              : is(table, SQLiteViewBase)
                ? table[ViewBaseConfig].name
                : is(table, SQL)
                  ? undefined
                  : getTableName(table)) &&
          !((table2) =>
            joins?.some(
              ({ alias }) =>
                alias ===
                (table2[Table.Symbol.IsAlias]
                  ? getTableName(table2)
                  : table2[Table.Symbol.BaseName]),
            ))(f.field.table)
        ) {
          const tableName = getTableName(f.field.table);
          throw new Error(
            `Your "${f.path.join('->')}" field references a column "${tableName}"."${f.field.name}", but the table "${tableName}" is not part of the query! Did you forget to join it?`,
          );
        }
      }
      const isSingleTable = !joins || joins.length === 0;
      const withSql = this.buildWithCTE(withList);
      const distinctSql = distinct ? sql` distinct` : undefined;
      const selection = this.buildSelection(fieldsList, { isSingleTable });
      const tableSql = this.buildFromTable(table);
      const joinsSql = this.buildJoins(joins);
      const whereSql = where ? sql` where ${where}` : undefined;
      const havingSql = having ? sql` having ${having}` : undefined;
      const groupByList = [];
      if (groupBy) {
        for (const [index2, groupByValue] of groupBy.entries()) {
          groupByList.push(groupByValue);
          if (index2 < groupBy.length - 1) {
            groupByList.push(sql`, `);
          }
        }
      }
      const groupBySql =
        groupByList.length > 0
          ? sql` group by ${sql.join(groupByList)}`
          : undefined;
      const orderBySql = this.buildOrderBy(orderBy);
      const limitSql = this.buildLimit(limit);
      const offsetSql = offset ? sql` offset ${offset}` : undefined;
      const finalQuery = sql`${withSql}select${distinctSql} ${selection} from ${tableSql}${joinsSql}${whereSql}${groupBySql}${havingSql}${orderBySql}${limitSql}${offsetSql}`;
      if (setOperators.length > 0) {
        return this.buildSetOperations(finalQuery, setOperators);
      }
      return finalQuery;
    }
    buildSetOperations(leftSelect, setOperators) {
      const [setOperator, ...rest] = setOperators;
      if (!setOperator) {
        throw new Error('Cannot pass undefined values to any set operator');
      }
      if (rest.length === 0) {
        return this.buildSetOperationQuery({ leftSelect, setOperator });
      }
      return this.buildSetOperations(
        this.buildSetOperationQuery({ leftSelect, setOperator }),
        rest,
      );
    }
    buildSetOperationQuery({
      leftSelect,
      setOperator: { type, isAll, rightSelect, limit, orderBy, offset },
    }) {
      const leftChunk = sql`${leftSelect.getSQL()} `;
      const rightChunk = sql`${rightSelect.getSQL()}`;
      let orderBySql;
      if (orderBy && orderBy.length > 0) {
        const orderByValues = [];
        for (const singleOrderBy of orderBy) {
          if (is(singleOrderBy, SQLiteColumn)) {
            orderByValues.push(sql.identifier(singleOrderBy.name));
          } else if (is(singleOrderBy, SQL)) {
            for (let i = 0; i < singleOrderBy.queryChunks.length; i++) {
              const chunk = singleOrderBy.queryChunks[i];
              if (is(chunk, SQLiteColumn)) {
                singleOrderBy.queryChunks[i] = sql.identifier(
                  this.casing.getColumnCasing(chunk),
                );
              }
            }
            orderByValues.push(sql`${singleOrderBy}`);
          } else {
            orderByValues.push(sql`${singleOrderBy}`);
          }
        }
        orderBySql = sql` order by ${sql.join(orderByValues, sql`, `)}`;
      }
      const limitSql =
        typeof limit === 'object' || (typeof limit === 'number' && limit >= 0)
          ? sql` limit ${limit}`
          : undefined;
      const operatorChunk = sql.raw(`${type} ${isAll ? 'all ' : ''}`);
      const offsetSql = offset ? sql` offset ${offset}` : undefined;
      return sql`${leftChunk}${operatorChunk}${rightChunk}${orderBySql}${limitSql}${offsetSql}`;
    }
    buildInsertQuery({
      table,
      values: valuesOrSelect,
      onConflict,
      returning,
      withList,
      select: select2,
    }) {
      const valuesSqlList = [];
      const columns = table[Table.Symbol.Columns];
      const colEntries = Object.entries(columns).filter(
        ([_, col]) => !col.shouldDisableInsert(),
      );
      const insertOrder = colEntries.map(([, column]) =>
        sql.identifier(this.casing.getColumnCasing(column)),
      );
      if (select2) {
        const select22 = valuesOrSelect;
        if (is(select22, SQL)) {
          valuesSqlList.push(select22);
        } else {
          valuesSqlList.push(select22.getSQL());
        }
      } else {
        const values = valuesOrSelect;
        valuesSqlList.push(sql.raw('values '));
        for (const [valueIndex, value] of values.entries()) {
          const valueList = [];
          for (const [fieldName, col] of colEntries) {
            const colValue = value[fieldName];
            if (
              colValue === undefined ||
              (is(colValue, Param) && colValue.value === undefined)
            ) {
              let defaultValue;
              if (col.default !== null && col.default !== undefined) {
                defaultValue = is(col.default, SQL)
                  ? col.default
                  : sql.param(col.default, col);
              } else if (col.defaultFn !== undefined) {
                const defaultFnResult = col.defaultFn();
                defaultValue = is(defaultFnResult, SQL)
                  ? defaultFnResult
                  : sql.param(defaultFnResult, col);
              } else if (!col.default && col.onUpdateFn !== undefined) {
                const onUpdateFnResult = col.onUpdateFn();
                defaultValue = is(onUpdateFnResult, SQL)
                  ? onUpdateFnResult
                  : sql.param(onUpdateFnResult, col);
              } else {
                defaultValue = sql`null`;
              }
              valueList.push(defaultValue);
            } else {
              valueList.push(colValue);
            }
          }
          valuesSqlList.push(valueList);
          if (valueIndex < values.length - 1) {
            valuesSqlList.push(sql`, `);
          }
        }
      }
      const withSql = this.buildWithCTE(withList);
      const valuesSql = sql.join(valuesSqlList);
      const returningSql = returning
        ? sql` returning ${this.buildSelection(returning, { isSingleTable: true })}`
        : undefined;
      const onConflictSql = onConflict?.length
        ? sql.join(onConflict)
        : undefined;
      return sql`${withSql}insert into ${table} ${insertOrder} ${valuesSql}${onConflictSql}${returningSql}`;
    }
    sqlToQuery(sql22, invokeSource) {
      return sql22.toQuery({
        casing: this.casing,
        escapeName: this.escapeName,
        escapeParam: this.escapeParam,
        escapeString: this.escapeString,
        invokeSource,
      });
    }
    buildRelationalQuery({
      fullSchema,
      schema,
      tableNamesMap,
      table,
      tableConfig,
      queryConfig: config,
      tableAlias,
      nestedQueryRelation,
      joinOn,
    }) {
      let selection = [];
      let limit,
        offset,
        orderBy = [],
        where;
      const joins = [];
      if (config === true) {
        const selectionEntries = Object.entries(tableConfig.columns);
        selection = selectionEntries.map(([key, value]) => ({
          dbKey: value.name,
          tsKey: key,
          field: aliasedTableColumn(value, tableAlias),
          relationTableTsKey: undefined,
          isJson: false,
          selection: [],
        }));
      } else {
        const aliasedColumns = Object.fromEntries(
          Object.entries(tableConfig.columns).map(([key, value]) => [
            key,
            aliasedTableColumn(value, tableAlias),
          ]),
        );
        if (config.where) {
          const whereSql =
            typeof config.where === 'function'
              ? config.where(aliasedColumns, getOperators())
              : config.where;
          where = whereSql && mapColumnsInSQLToAlias(whereSql, tableAlias);
        }
        const fieldsSelection = [];
        let selectedColumns = [];
        if (config.columns) {
          let isIncludeMode = false;
          for (const [field, value] of Object.entries(config.columns)) {
            if (value === undefined) {
              continue;
            }
            if (field in tableConfig.columns) {
              if (!isIncludeMode && value === true) {
                isIncludeMode = true;
              }
              selectedColumns.push(field);
            }
          }
          if (selectedColumns.length > 0) {
            selectedColumns = isIncludeMode
              ? selectedColumns.filter((c) => config.columns?.[c] === true)
              : Object.keys(tableConfig.columns).filter(
                  (key) => !selectedColumns.includes(key),
                );
          }
        } else {
          selectedColumns = Object.keys(tableConfig.columns);
        }
        for (const field of selectedColumns) {
          const column = tableConfig.columns[field];
          fieldsSelection.push({ tsKey: field, value: column });
        }
        let selectedRelations = [];
        if (config.with) {
          selectedRelations = Object.entries(config.with)
            .filter((entry) => !!entry[1])
            .map(([tsKey, queryConfig]) => ({
              tsKey,
              queryConfig,
              relation: tableConfig.relations[tsKey],
            }));
        }
        let extras;
        if (config.extras) {
          extras =
            typeof config.extras === 'function'
              ? config.extras(aliasedColumns, { sql })
              : config.extras;
          for (const [tsKey, value] of Object.entries(extras)) {
            fieldsSelection.push({
              tsKey,
              value: mapColumnsInAliasedSQLToAlias(value, tableAlias),
            });
          }
        }
        for (const { tsKey, value } of fieldsSelection) {
          selection.push({
            dbKey: is(value, SQL.Aliased)
              ? value.fieldAlias
              : tableConfig.columns[tsKey].name,
            tsKey,
            field: is(value, Column)
              ? aliasedTableColumn(value, tableAlias)
              : value,
            relationTableTsKey: undefined,
            isJson: false,
            selection: [],
          });
        }
        let orderByOrig =
          typeof config.orderBy === 'function'
            ? config.orderBy(aliasedColumns, getOrderByOperators())
            : (config.orderBy ?? []);
        if (!Array.isArray(orderByOrig)) {
          orderByOrig = [orderByOrig];
        }
        orderBy = orderByOrig.map((orderByValue) => {
          if (is(orderByValue, Column)) {
            return aliasedTableColumn(orderByValue, tableAlias);
          }
          return mapColumnsInSQLToAlias(orderByValue, tableAlias);
        });
        limit = config.limit;
        offset = config.offset;
        for (const {
          tsKey: selectedRelationTsKey,
          queryConfig: selectedRelationConfigValue,
          relation,
        } of selectedRelations) {
          const normalizedRelation = normalizeRelation(
            schema,
            tableNamesMap,
            relation,
          );
          const relationTableName = getTableUniqueName(
            relation.referencedTable,
          );
          const relationTableTsName = tableNamesMap[relationTableName];
          const relationTableAlias = `${tableAlias}_${selectedRelationTsKey}`;
          const joinOn2 = and(
            ...normalizedRelation.fields.map((field2, i) =>
              eq(
                aliasedTableColumn(
                  normalizedRelation.references[i],
                  relationTableAlias,
                ),
                aliasedTableColumn(field2, tableAlias),
              ),
            ),
          );
          const builtRelation = this.buildRelationalQuery({
            fullSchema,
            schema,
            tableNamesMap,
            table: fullSchema[relationTableTsName],
            tableConfig: schema[relationTableTsName],
            queryConfig: is(relation, One)
              ? selectedRelationConfigValue === true
                ? { limit: 1 }
                : { ...selectedRelationConfigValue, limit: 1 }
              : selectedRelationConfigValue,
            tableAlias: relationTableAlias,
            joinOn: joinOn2,
            nestedQueryRelation: relation,
          });
          const field = sql`(${builtRelation.sql})`.as(selectedRelationTsKey);
          selection.push({
            dbKey: selectedRelationTsKey,
            tsKey: selectedRelationTsKey,
            field,
            relationTableTsKey: relationTableTsName,
            isJson: true,
            selection: builtRelation.selection,
          });
        }
      }
      if (selection.length === 0) {
        throw new DrizzleError({
          message: `No fields selected for table "${tableConfig.tsName}" ("${tableAlias}"). You need to have at least one item in "columns", "with" or "extras". If you need to select all columns, omit the "columns" key or set it to undefined.`,
        });
      }
      let result;
      where = and(joinOn, where);
      if (nestedQueryRelation) {
        let field = sql`json_array(${sql.join(
          selection.map(({ field: field2 }) =>
            is(field2, SQLiteColumn)
              ? sql.identifier(this.casing.getColumnCasing(field2))
              : is(field2, SQL.Aliased)
                ? field2.sql
                : field2,
          ),
          sql`, `,
        )})`;
        if (is(nestedQueryRelation, Many)) {
          field = sql`coalesce(json_group_array(${field}), json_array())`;
        }
        const nestedSelection = [
          {
            dbKey: 'data',
            tsKey: 'data',
            field: field.as('data'),
            isJson: true,
            relationTableTsKey: tableConfig.tsName,
            selection,
          },
        ];
        const needsSubquery =
          limit !== undefined || offset !== undefined || orderBy.length > 0;
        if (needsSubquery) {
          result = this.buildSelectQuery({
            table: aliasedTable(table, tableAlias),
            fields: {},
            fieldsFlat: [
              {
                path: [],
                field: sql.raw('*'),
              },
            ],
            where,
            limit,
            offset,
            orderBy,
            setOperators: [],
          });
          where = undefined;
          limit = undefined;
          offset = undefined;
          orderBy = undefined;
        } else {
          result = aliasedTable(table, tableAlias);
        }
        result = this.buildSelectQuery({
          table: is(result, SQLiteTable)
            ? result
            : new Subquery(result, {}, tableAlias),
          fields: {},
          fieldsFlat: nestedSelection.map(({ field: field2 }) => ({
            path: [],
            field: is(field2, Column)
              ? aliasedTableColumn(field2, tableAlias)
              : field2,
          })),
          joins,
          where,
          limit,
          offset,
          orderBy,
          setOperators: [],
        });
      } else {
        result = this.buildSelectQuery({
          table: aliasedTable(table, tableAlias),
          fields: {},
          fieldsFlat: selection.map(({ field }) => ({
            path: [],
            field: is(field, Column)
              ? aliasedTableColumn(field, tableAlias)
              : field,
          })),
          joins,
          where,
          limit,
          offset,
          orderBy,
          setOperators: [],
        });
      }
      return {
        tableTsKey: tableConfig.tsName,
        sql: result,
        selection,
      };
    }
  };
  SQLiteSyncDialect = class SQLiteSyncDialect extends SQLiteDialect {
    static [entityKind] = 'SQLiteSyncDialect';
    migrate(migrations, session, config) {
      const migrationsTable =
        config === undefined
          ? '__drizzle_migrations'
          : typeof config === 'string'
            ? '__drizzle_migrations'
            : (config.migrationsTable ?? '__drizzle_migrations');
      const migrationTableCreate = sql`
			CREATE TABLE IF NOT EXISTS ${sql.identifier(migrationsTable)} (
				id SERIAL PRIMARY KEY,
				hash text NOT NULL,
				created_at numeric
			)
		`;
      session.run(migrationTableCreate);
      const dbMigrations = session.values(
        sql`SELECT id, hash, created_at FROM ${sql.identifier(migrationsTable)} ORDER BY created_at DESC LIMIT 1`,
      );
      const lastDbMigration = dbMigrations[0] ?? undefined;
      session.run(sql`BEGIN`);
      try {
        for (const migration of migrations) {
          if (
            !lastDbMigration ||
            Number(lastDbMigration[2]) < migration.folderMillis
          ) {
            for (const stmt of migration.sql) {
              session.run(sql.raw(stmt));
            }
            session.run(
              sql`INSERT INTO ${sql.identifier(migrationsTable)} ("hash", "created_at") VALUES(${migration.hash}, ${migration.folderMillis})`,
            );
          }
        }
        session.run(sql`COMMIT`);
      } catch (e) {
        session.run(sql`ROLLBACK`);
        throw e;
      }
    }
  };
});

// node_modules/drizzle-orm/query-builders/query-builder.js
var TypedQueryBuilder;
var init_query_builder = __esm(() => {
  init_entity();
  TypedQueryBuilder = class TypedQueryBuilder {
    static [entityKind] = 'TypedQueryBuilder';
    getSelectedFields() {
      return this._.selectedFields;
    }
  };
});

// node_modules/drizzle-orm/sqlite-core/query-builders/select.js
function createSetOperator(type, isAll) {
  return (leftSelect, rightSelect, ...restSelects) => {
    const setOperators = [rightSelect, ...restSelects].map((select2) => ({
      type,
      isAll,
      rightSelect: select2,
    }));
    for (const setOperator of setOperators) {
      if (
        !haveSameKeys(
          leftSelect.getSelectedFields(),
          setOperator.rightSelect.getSelectedFields(),
        )
      ) {
        throw new Error(
          'Set operator error (union / intersect / except): selected fields are not the same or are in a different order',
        );
      }
    }
    return leftSelect.addSetOperators(setOperators);
  };
}
var SQLiteSelectBuilder,
  SQLiteSelectQueryBuilderBase,
  SQLiteSelectBase,
  getSQLiteSetOperators = () => ({
    union,
    unionAll,
    intersect,
    except,
  }),
  union,
  unionAll,
  intersect,
  except;
var init_select2 = __esm(() => {
  init_entity();
  init_query_builder();
  init_query_promise();
  init_selection_proxy();
  init_sql();
  init_subquery();
  init_table();
  init_utils();
  init_view_common();
  init_utils2();
  init_view_base();
  SQLiteSelectBuilder = class SQLiteSelectBuilder {
    static [entityKind] = 'SQLiteSelectBuilder';
    fields;
    session;
    dialect;
    withList;
    distinct;
    constructor(config) {
      this.fields = config.fields;
      this.session = config.session;
      this.dialect = config.dialect;
      this.withList = config.withList;
      this.distinct = config.distinct;
    }
    from(source) {
      const isPartialSelect = !!this.fields;
      let fields;
      if (this.fields) {
        fields = this.fields;
      } else if (is(source, Subquery)) {
        fields = Object.fromEntries(
          Object.keys(source._.selectedFields).map((key) => [key, source[key]]),
        );
      } else if (is(source, SQLiteViewBase)) {
        fields = source[ViewBaseConfig].selectedFields;
      } else if (is(source, SQL)) {
        fields = {};
      } else {
        fields = getTableColumns(source);
      }
      return new SQLiteSelectBase({
        table: source,
        fields,
        isPartialSelect,
        session: this.session,
        dialect: this.dialect,
        withList: this.withList,
        distinct: this.distinct,
      });
    }
  };
  SQLiteSelectQueryBuilderBase = class SQLiteSelectQueryBuilderBase extends (
    TypedQueryBuilder
  ) {
    static [entityKind] = 'SQLiteSelectQueryBuilder';
    _;
    config;
    joinsNotNullableMap;
    tableName;
    isPartialSelect;
    session;
    dialect;
    cacheConfig = undefined;
    usedTables = /* @__PURE__ */ new Set();
    constructor({
      table,
      fields,
      isPartialSelect,
      session,
      dialect,
      withList,
      distinct,
    }) {
      super();
      this.config = {
        withList,
        table,
        fields: { ...fields },
        distinct,
        setOperators: [],
      };
      this.isPartialSelect = isPartialSelect;
      this.session = session;
      this.dialect = dialect;
      this._ = {
        selectedFields: fields,
        config: this.config,
      };
      this.tableName = getTableLikeName(table);
      this.joinsNotNullableMap =
        typeof this.tableName === 'string' ? { [this.tableName]: true } : {};
      for (const item of extractUsedTable(table)) this.usedTables.add(item);
    }
    getUsedTables() {
      return [...this.usedTables];
    }
    createJoin(joinType) {
      return (table, on) => {
        const baseTableName = this.tableName;
        const tableName = getTableLikeName(table);
        for (const item of extractUsedTable(table)) this.usedTables.add(item);
        if (
          typeof tableName === 'string' &&
          this.config.joins?.some((join) => join.alias === tableName)
        ) {
          throw new Error(`Alias "${tableName}" is already used in this query`);
        }
        if (!this.isPartialSelect) {
          if (
            Object.keys(this.joinsNotNullableMap).length === 1 &&
            typeof baseTableName === 'string'
          ) {
            this.config.fields = {
              [baseTableName]: this.config.fields,
            };
          }
          if (typeof tableName === 'string' && !is(table, SQL)) {
            const selection = is(table, Subquery)
              ? table._.selectedFields
              : is(table, View)
                ? table[ViewBaseConfig].selectedFields
                : table[Table.Symbol.Columns];
            this.config.fields[tableName] = selection;
          }
        }
        if (typeof on === 'function') {
          on = on(
            new Proxy(
              this.config.fields,
              new SelectionProxyHandler({
                sqlAliasedBehavior: 'sql',
                sqlBehavior: 'sql',
              }),
            ),
          );
        }
        if (!this.config.joins) {
          this.config.joins = [];
        }
        this.config.joins.push({ on, table, joinType, alias: tableName });
        if (typeof tableName === 'string') {
          switch (joinType) {
            case 'left': {
              this.joinsNotNullableMap[tableName] = false;
              break;
            }
            case 'right': {
              this.joinsNotNullableMap = Object.fromEntries(
                Object.entries(this.joinsNotNullableMap).map(([key]) => [
                  key,
                  false,
                ]),
              );
              this.joinsNotNullableMap[tableName] = true;
              break;
            }
            case 'cross':
            case 'inner': {
              this.joinsNotNullableMap[tableName] = true;
              break;
            }
            case 'full': {
              this.joinsNotNullableMap = Object.fromEntries(
                Object.entries(this.joinsNotNullableMap).map(([key]) => [
                  key,
                  false,
                ]),
              );
              this.joinsNotNullableMap[tableName] = false;
              break;
            }
          }
        }
        return this;
      };
    }
    leftJoin = this.createJoin('left');
    rightJoin = this.createJoin('right');
    innerJoin = this.createJoin('inner');
    fullJoin = this.createJoin('full');
    crossJoin = this.createJoin('cross');
    createSetOperator(type, isAll) {
      return (rightSelection) => {
        const rightSelect =
          typeof rightSelection === 'function'
            ? rightSelection(getSQLiteSetOperators())
            : rightSelection;
        if (
          !haveSameKeys(
            this.getSelectedFields(),
            rightSelect.getSelectedFields(),
          )
        ) {
          throw new Error(
            'Set operator error (union / intersect / except): selected fields are not the same or are in a different order',
          );
        }
        this.config.setOperators.push({ type, isAll, rightSelect });
        return this;
      };
    }
    union = this.createSetOperator('union', false);
    unionAll = this.createSetOperator('union', true);
    intersect = this.createSetOperator('intersect', false);
    except = this.createSetOperator('except', false);
    addSetOperators(setOperators) {
      this.config.setOperators.push(...setOperators);
      return this;
    }
    where(where) {
      if (typeof where === 'function') {
        where = where(
          new Proxy(
            this.config.fields,
            new SelectionProxyHandler({
              sqlAliasedBehavior: 'sql',
              sqlBehavior: 'sql',
            }),
          ),
        );
      }
      this.config.where = where;
      return this;
    }
    having(having) {
      if (typeof having === 'function') {
        having = having(
          new Proxy(
            this.config.fields,
            new SelectionProxyHandler({
              sqlAliasedBehavior: 'sql',
              sqlBehavior: 'sql',
            }),
          ),
        );
      }
      this.config.having = having;
      return this;
    }
    groupBy(...columns) {
      if (typeof columns[0] === 'function') {
        const groupBy = columns[0](
          new Proxy(
            this.config.fields,
            new SelectionProxyHandler({
              sqlAliasedBehavior: 'alias',
              sqlBehavior: 'sql',
            }),
          ),
        );
        this.config.groupBy = Array.isArray(groupBy) ? groupBy : [groupBy];
      } else {
        this.config.groupBy = columns;
      }
      return this;
    }
    orderBy(...columns) {
      if (typeof columns[0] === 'function') {
        const orderBy = columns[0](
          new Proxy(
            this.config.fields,
            new SelectionProxyHandler({
              sqlAliasedBehavior: 'alias',
              sqlBehavior: 'sql',
            }),
          ),
        );
        const orderByArray = Array.isArray(orderBy) ? orderBy : [orderBy];
        if (this.config.setOperators.length > 0) {
          this.config.setOperators.at(-1).orderBy = orderByArray;
        } else {
          this.config.orderBy = orderByArray;
        }
      } else {
        const orderByArray = columns;
        if (this.config.setOperators.length > 0) {
          this.config.setOperators.at(-1).orderBy = orderByArray;
        } else {
          this.config.orderBy = orderByArray;
        }
      }
      return this;
    }
    limit(limit) {
      if (this.config.setOperators.length > 0) {
        this.config.setOperators.at(-1).limit = limit;
      } else {
        this.config.limit = limit;
      }
      return this;
    }
    offset(offset) {
      if (this.config.setOperators.length > 0) {
        this.config.setOperators.at(-1).offset = offset;
      } else {
        this.config.offset = offset;
      }
      return this;
    }
    getSQL() {
      return this.dialect.buildSelectQuery(this.config);
    }
    toSQL() {
      const { typings: _typings, ...rest } = this.dialect.sqlToQuery(
        this.getSQL(),
      );
      return rest;
    }
    as(alias) {
      const usedTables = [];
      usedTables.push(...extractUsedTable(this.config.table));
      if (this.config.joins) {
        for (const it of this.config.joins)
          usedTables.push(...extractUsedTable(it.table));
      }
      return new Proxy(
        new Subquery(this.getSQL(), this.config.fields, alias, false, [
          ...new Set(usedTables),
        ]),
        new SelectionProxyHandler({
          alias,
          sqlAliasedBehavior: 'alias',
          sqlBehavior: 'error',
        }),
      );
    }
    getSelectedFields() {
      return new Proxy(
        this.config.fields,
        new SelectionProxyHandler({
          alias: this.tableName,
          sqlAliasedBehavior: 'alias',
          sqlBehavior: 'error',
        }),
      );
    }
    $dynamic() {
      return this;
    }
  };
  SQLiteSelectBase = class SQLiteSelectBase extends (
    SQLiteSelectQueryBuilderBase
  ) {
    static [entityKind] = 'SQLiteSelect';
    _prepare(isOneTimeQuery = true) {
      if (!this.session) {
        throw new Error(
          'Cannot execute a query on a query builder. Please use a database instance instead.',
        );
      }
      const fieldsList = orderSelectedFields(this.config.fields);
      const query = this.session[
        isOneTimeQuery ? 'prepareOneTimeQuery' : 'prepareQuery'
      ](
        this.dialect.sqlToQuery(this.getSQL()),
        fieldsList,
        'all',
        true,
        undefined,
        {
          type: 'select',
          tables: [...this.usedTables],
        },
        this.cacheConfig,
      );
      query.joinsNotNullableMap = this.joinsNotNullableMap;
      return query;
    }
    $withCache(config) {
      this.cacheConfig =
        config === undefined
          ? { config: {}, enable: true, autoInvalidate: true }
          : config === false
            ? { enable: false }
            : { enable: true, autoInvalidate: true, ...config };
      return this;
    }
    prepare() {
      return this._prepare(false);
    }
    run = (placeholderValues) => {
      return this._prepare().run(placeholderValues);
    };
    all = (placeholderValues) => {
      return this._prepare().all(placeholderValues);
    };
    get = (placeholderValues) => {
      return this._prepare().get(placeholderValues);
    };
    values = (placeholderValues) => {
      return this._prepare().values(placeholderValues);
    };
    async execute() {
      return this.all();
    }
  };
  applyMixins(SQLiteSelectBase, [QueryPromise]);
  union = createSetOperator('union', false);
  unionAll = createSetOperator('union', true);
  intersect = createSetOperator('intersect', false);
  except = createSetOperator('except', false);
});

// node_modules/drizzle-orm/sqlite-core/query-builders/query-builder.js
var QueryBuilder;
var init_query_builder2 = __esm(() => {
  init_entity();
  init_selection_proxy();
  init_dialect();
  init_subquery();
  init_select2();
  QueryBuilder = class QueryBuilder {
    static [entityKind] = 'SQLiteQueryBuilder';
    dialect;
    dialectConfig;
    constructor(dialect) {
      this.dialect = is(dialect, SQLiteDialect) ? dialect : undefined;
      this.dialectConfig = is(dialect, SQLiteDialect) ? undefined : dialect;
    }
    $with = (alias, selection) => {
      const queryBuilder = this;
      const as = (qb) => {
        if (typeof qb === 'function') {
          qb = qb(queryBuilder);
        }
        return new Proxy(
          new WithSubquery(
            qb.getSQL(),
            selection ??
              ('getSelectedFields' in qb ? (qb.getSelectedFields() ?? {}) : {}),
            alias,
            true,
          ),
          new SelectionProxyHandler({
            alias,
            sqlAliasedBehavior: 'alias',
            sqlBehavior: 'error',
          }),
        );
      };
      return { as };
    };
    with(...queries) {
      const self = this;
      function select2(fields) {
        return new SQLiteSelectBuilder({
          fields: fields ?? undefined,
          session: undefined,
          dialect: self.getDialect(),
          withList: queries,
        });
      }
      function selectDistinct(fields) {
        return new SQLiteSelectBuilder({
          fields: fields ?? undefined,
          session: undefined,
          dialect: self.getDialect(),
          withList: queries,
          distinct: true,
        });
      }
      return { select: select2, selectDistinct };
    }
    select(fields) {
      return new SQLiteSelectBuilder({
        fields: fields ?? undefined,
        session: undefined,
        dialect: this.getDialect(),
      });
    }
    selectDistinct(fields) {
      return new SQLiteSelectBuilder({
        fields: fields ?? undefined,
        session: undefined,
        dialect: this.getDialect(),
        distinct: true,
      });
    }
    getDialect() {
      if (!this.dialect) {
        this.dialect = new SQLiteSyncDialect(this.dialectConfig);
      }
      return this.dialect;
    }
  };
});

// node_modules/drizzle-orm/sqlite-core/query-builders/insert.js
var SQLiteInsertBuilder, SQLiteInsertBase;
var init_insert = __esm(() => {
  init_entity();
  init_query_promise();
  init_sql();
  init_table3();
  init_table();
  init_utils();
  init_utils2();
  init_query_builder2();
  SQLiteInsertBuilder = class SQLiteInsertBuilder {
    constructor(table, session, dialect, withList) {
      this.table = table;
      this.session = session;
      this.dialect = dialect;
      this.withList = withList;
    }
    static [entityKind] = 'SQLiteInsertBuilder';
    values(values) {
      values = Array.isArray(values) ? values : [values];
      if (values.length === 0) {
        throw new Error('values() must be called with at least one value');
      }
      const mappedValues = values.map((entry) => {
        const result = {};
        const cols = this.table[Table.Symbol.Columns];
        for (const colKey of Object.keys(entry)) {
          const colValue = entry[colKey];
          result[colKey] = is(colValue, SQL)
            ? colValue
            : new Param(colValue, cols[colKey]);
        }
        return result;
      });
      return new SQLiteInsertBase(
        this.table,
        mappedValues,
        this.session,
        this.dialect,
        this.withList,
      );
    }
    select(selectQuery) {
      const select2 =
        typeof selectQuery === 'function'
          ? selectQuery(new QueryBuilder())
          : selectQuery;
      if (
        !is(select2, SQL) &&
        !haveSameKeys(this.table[Columns], select2._.selectedFields)
      ) {
        throw new Error(
          'Insert select error: selected fields are not the same or are in a different order compared to the table definition',
        );
      }
      return new SQLiteInsertBase(
        this.table,
        select2,
        this.session,
        this.dialect,
        this.withList,
        true,
      );
    }
  };
  SQLiteInsertBase = class SQLiteInsertBase extends QueryPromise {
    constructor(table, values, session, dialect, withList, select2) {
      super();
      this.session = session;
      this.dialect = dialect;
      this.config = { table, values, withList, select: select2 };
    }
    static [entityKind] = 'SQLiteInsert';
    config;
    returning(fields = this.config.table[SQLiteTable.Symbol.Columns]) {
      this.config.returning = orderSelectedFields(fields);
      return this;
    }
    onConflictDoNothing(config = {}) {
      if (!this.config.onConflict) this.config.onConflict = [];
      if (config.target === undefined) {
        this.config.onConflict.push(sql` on conflict do nothing`);
      } else {
        const targetSql = Array.isArray(config.target)
          ? sql`${config.target}`
          : sql`${[config.target]}`;
        const whereSql = config.where ? sql` where ${config.where}` : sql``;
        this.config.onConflict.push(
          sql` on conflict ${targetSql} do nothing${whereSql}`,
        );
      }
      return this;
    }
    onConflictDoUpdate(config) {
      if (config.where && (config.targetWhere || config.setWhere)) {
        throw new Error(
          'You cannot use both "where" and "targetWhere"/"setWhere" at the same time - "where" is deprecated, use "targetWhere" or "setWhere" instead.',
        );
      }
      if (!this.config.onConflict) this.config.onConflict = [];
      const whereSql = config.where ? sql` where ${config.where}` : undefined;
      const targetWhereSql = config.targetWhere
        ? sql` where ${config.targetWhere}`
        : undefined;
      const setWhereSql = config.setWhere
        ? sql` where ${config.setWhere}`
        : undefined;
      const targetSql = Array.isArray(config.target)
        ? sql`${config.target}`
        : sql`${[config.target]}`;
      const setSql = this.dialect.buildUpdateSet(
        this.config.table,
        mapUpdateSet(this.config.table, config.set),
      );
      this.config.onConflict.push(
        sql` on conflict ${targetSql}${targetWhereSql} do update set ${setSql}${whereSql}${setWhereSql}`,
      );
      return this;
    }
    getSQL() {
      return this.dialect.buildInsertQuery(this.config);
    }
    toSQL() {
      const { typings: _typings, ...rest } = this.dialect.sqlToQuery(
        this.getSQL(),
      );
      return rest;
    }
    _prepare(isOneTimeQuery = true) {
      return this.session[
        isOneTimeQuery ? 'prepareOneTimeQuery' : 'prepareQuery'
      ](
        this.dialect.sqlToQuery(this.getSQL()),
        this.config.returning,
        this.config.returning ? 'all' : 'run',
        true,
        undefined,
        {
          type: 'insert',
          tables: extractUsedTable(this.config.table),
        },
      );
    }
    prepare() {
      return this._prepare(false);
    }
    run = (placeholderValues) => {
      return this._prepare().run(placeholderValues);
    };
    all = (placeholderValues) => {
      return this._prepare().all(placeholderValues);
    };
    get = (placeholderValues) => {
      return this._prepare().get(placeholderValues);
    };
    values = (placeholderValues) => {
      return this._prepare().values(placeholderValues);
    };
    async execute() {
      return this.config.returning ? this.all() : this.run();
    }
    $dynamic() {
      return this;
    }
  };
});

// node_modules/drizzle-orm/sqlite-core/query-builders/update.js
var SQLiteUpdateBuilder, SQLiteUpdateBase;
var init_update = __esm(() => {
  init_entity();
  init_query_promise();
  init_selection_proxy();
  init_table3();
  init_subquery();
  init_table();
  init_utils();
  init_view_common();
  init_utils2();
  init_view_base();
  SQLiteUpdateBuilder = class SQLiteUpdateBuilder {
    constructor(table, session, dialect, withList) {
      this.table = table;
      this.session = session;
      this.dialect = dialect;
      this.withList = withList;
    }
    static [entityKind] = 'SQLiteUpdateBuilder';
    set(values) {
      return new SQLiteUpdateBase(
        this.table,
        mapUpdateSet(this.table, values),
        this.session,
        this.dialect,
        this.withList,
      );
    }
  };
  SQLiteUpdateBase = class SQLiteUpdateBase extends QueryPromise {
    constructor(table, set, session, dialect, withList) {
      super();
      this.session = session;
      this.dialect = dialect;
      this.config = { set, table, withList, joins: [] };
    }
    static [entityKind] = 'SQLiteUpdate';
    config;
    from(source) {
      this.config.from = source;
      return this;
    }
    createJoin(joinType) {
      return (table, on) => {
        const tableName = getTableLikeName(table);
        if (
          typeof tableName === 'string' &&
          this.config.joins.some((join) => join.alias === tableName)
        ) {
          throw new Error(`Alias "${tableName}" is already used in this query`);
        }
        if (typeof on === 'function') {
          const from = this.config.from
            ? is(table, SQLiteTable)
              ? table[Table.Symbol.Columns]
              : is(table, Subquery)
                ? table._.selectedFields
                : is(table, SQLiteViewBase)
                  ? table[ViewBaseConfig].selectedFields
                  : undefined
            : undefined;
          on = on(
            new Proxy(
              this.config.table[Table.Symbol.Columns],
              new SelectionProxyHandler({
                sqlAliasedBehavior: 'sql',
                sqlBehavior: 'sql',
              }),
            ),
            from &&
              new Proxy(
                from,
                new SelectionProxyHandler({
                  sqlAliasedBehavior: 'sql',
                  sqlBehavior: 'sql',
                }),
              ),
          );
        }
        this.config.joins.push({ on, table, joinType, alias: tableName });
        return this;
      };
    }
    leftJoin = this.createJoin('left');
    rightJoin = this.createJoin('right');
    innerJoin = this.createJoin('inner');
    fullJoin = this.createJoin('full');
    where(where) {
      this.config.where = where;
      return this;
    }
    orderBy(...columns) {
      if (typeof columns[0] === 'function') {
        const orderBy = columns[0](
          new Proxy(
            this.config.table[Table.Symbol.Columns],
            new SelectionProxyHandler({
              sqlAliasedBehavior: 'alias',
              sqlBehavior: 'sql',
            }),
          ),
        );
        const orderByArray = Array.isArray(orderBy) ? orderBy : [orderBy];
        this.config.orderBy = orderByArray;
      } else {
        const orderByArray = columns;
        this.config.orderBy = orderByArray;
      }
      return this;
    }
    limit(limit) {
      this.config.limit = limit;
      return this;
    }
    returning(fields = this.config.table[SQLiteTable.Symbol.Columns]) {
      this.config.returning = orderSelectedFields(fields);
      return this;
    }
    getSQL() {
      return this.dialect.buildUpdateQuery(this.config);
    }
    toSQL() {
      const { typings: _typings, ...rest } = this.dialect.sqlToQuery(
        this.getSQL(),
      );
      return rest;
    }
    _prepare(isOneTimeQuery = true) {
      return this.session[
        isOneTimeQuery ? 'prepareOneTimeQuery' : 'prepareQuery'
      ](
        this.dialect.sqlToQuery(this.getSQL()),
        this.config.returning,
        this.config.returning ? 'all' : 'run',
        true,
        undefined,
        {
          type: 'insert',
          tables: extractUsedTable(this.config.table),
        },
      );
    }
    prepare() {
      return this._prepare(false);
    }
    run = (placeholderValues) => {
      return this._prepare().run(placeholderValues);
    };
    all = (placeholderValues) => {
      return this._prepare().all(placeholderValues);
    };
    get = (placeholderValues) => {
      return this._prepare().get(placeholderValues);
    };
    values = (placeholderValues) => {
      return this._prepare().values(placeholderValues);
    };
    async execute() {
      return this.config.returning ? this.all() : this.run();
    }
    $dynamic() {
      return this;
    }
  };
});

// node_modules/drizzle-orm/sqlite-core/query-builders/index.js
var init_query_builders = __esm(() => {
  init_delete();
  init_insert();
  init_query_builder2();
  init_select2();
  init_update();
});

// node_modules/drizzle-orm/sqlite-core/query-builders/count.js
var SQLiteCountBuilder;
var init_count = __esm(() => {
  init_entity();
  init_sql();
  SQLiteCountBuilder = class SQLiteCountBuilder extends SQL {
    constructor(params) {
      super(
        SQLiteCountBuilder.buildEmbeddedCount(params.source, params.filters)
          .queryChunks,
      );
      this.params = params;
      this.session = params.session;
      this.sql = SQLiteCountBuilder.buildCount(params.source, params.filters);
    }
    sql;
    static [entityKind] = 'SQLiteCountBuilderAsync';
    [Symbol.toStringTag] = 'SQLiteCountBuilderAsync';
    session;
    static buildEmbeddedCount(source, filters) {
      return sql`(select count(*) from ${source}${sql.raw(' where ').if(filters)}${filters})`;
    }
    static buildCount(source, filters) {
      return sql`select count(*) from ${source}${sql.raw(' where ').if(filters)}${filters}`;
    }
    then(onfulfilled, onrejected) {
      return Promise.resolve(this.session.count(this.sql)).then(
        onfulfilled,
        onrejected,
      );
    }
    catch(onRejected) {
      return this.then(undefined, onRejected);
    }
    finally(onFinally) {
      return this.then(
        (value) => {
          onFinally?.();
          return value;
        },
        (reason) => {
          onFinally?.();
          throw reason;
        },
      );
    }
  };
});

// node_modules/drizzle-orm/sqlite-core/query-builders/query.js
var RelationalQueryBuilder, SQLiteRelationalQuery, SQLiteSyncRelationalQuery;
var init_query = __esm(() => {
  init_entity();
  init_query_promise();
  init_relations();
  RelationalQueryBuilder = class RelationalQueryBuilder {
    constructor(
      mode,
      fullSchema,
      schema,
      tableNamesMap,
      table,
      tableConfig,
      dialect,
      session,
    ) {
      this.mode = mode;
      this.fullSchema = fullSchema;
      this.schema = schema;
      this.tableNamesMap = tableNamesMap;
      this.table = table;
      this.tableConfig = tableConfig;
      this.dialect = dialect;
      this.session = session;
    }
    static [entityKind] = 'SQLiteAsyncRelationalQueryBuilder';
    findMany(config) {
      return this.mode === 'sync'
        ? new SQLiteSyncRelationalQuery(
            this.fullSchema,
            this.schema,
            this.tableNamesMap,
            this.table,
            this.tableConfig,
            this.dialect,
            this.session,
            config ? config : {},
            'many',
          )
        : new SQLiteRelationalQuery(
            this.fullSchema,
            this.schema,
            this.tableNamesMap,
            this.table,
            this.tableConfig,
            this.dialect,
            this.session,
            config ? config : {},
            'many',
          );
    }
    findFirst(config) {
      return this.mode === 'sync'
        ? new SQLiteSyncRelationalQuery(
            this.fullSchema,
            this.schema,
            this.tableNamesMap,
            this.table,
            this.tableConfig,
            this.dialect,
            this.session,
            config ? { ...config, limit: 1 } : { limit: 1 },
            'first',
          )
        : new SQLiteRelationalQuery(
            this.fullSchema,
            this.schema,
            this.tableNamesMap,
            this.table,
            this.tableConfig,
            this.dialect,
            this.session,
            config ? { ...config, limit: 1 } : { limit: 1 },
            'first',
          );
    }
  };
  SQLiteRelationalQuery = class SQLiteRelationalQuery extends QueryPromise {
    constructor(
      fullSchema,
      schema,
      tableNamesMap,
      table,
      tableConfig,
      dialect,
      session,
      config,
      mode,
    ) {
      super();
      this.fullSchema = fullSchema;
      this.schema = schema;
      this.tableNamesMap = tableNamesMap;
      this.table = table;
      this.tableConfig = tableConfig;
      this.dialect = dialect;
      this.session = session;
      this.config = config;
      this.mode = mode;
    }
    static [entityKind] = 'SQLiteAsyncRelationalQuery';
    mode;
    getSQL() {
      return this.dialect.buildRelationalQuery({
        fullSchema: this.fullSchema,
        schema: this.schema,
        tableNamesMap: this.tableNamesMap,
        table: this.table,
        tableConfig: this.tableConfig,
        queryConfig: this.config,
        tableAlias: this.tableConfig.tsName,
      }).sql;
    }
    _prepare(isOneTimeQuery = false) {
      const { query, builtQuery } = this._toSQL();
      return this.session[
        isOneTimeQuery ? 'prepareOneTimeQuery' : 'prepareQuery'
      ](
        builtQuery,
        undefined,
        this.mode === 'first' ? 'get' : 'all',
        true,
        (rawRows, mapColumnValue) => {
          const rows = rawRows.map((row) =>
            mapRelationalRow(
              this.schema,
              this.tableConfig,
              row,
              query.selection,
              mapColumnValue,
            ),
          );
          if (this.mode === 'first') {
            return rows[0];
          }
          return rows;
        },
      );
    }
    prepare() {
      return this._prepare(false);
    }
    _toSQL() {
      const query = this.dialect.buildRelationalQuery({
        fullSchema: this.fullSchema,
        schema: this.schema,
        tableNamesMap: this.tableNamesMap,
        table: this.table,
        tableConfig: this.tableConfig,
        queryConfig: this.config,
        tableAlias: this.tableConfig.tsName,
      });
      const builtQuery = this.dialect.sqlToQuery(query.sql);
      return { query, builtQuery };
    }
    toSQL() {
      return this._toSQL().builtQuery;
    }
    executeRaw() {
      if (this.mode === 'first') {
        return this._prepare(false).get();
      }
      return this._prepare(false).all();
    }
    async execute() {
      return this.executeRaw();
    }
  };
  SQLiteSyncRelationalQuery = class SQLiteSyncRelationalQuery extends (
    SQLiteRelationalQuery
  ) {
    static [entityKind] = 'SQLiteSyncRelationalQuery';
    sync() {
      return this.executeRaw();
    }
  };
});

// node_modules/drizzle-orm/sqlite-core/query-builders/raw.js
var SQLiteRaw;
var init_raw = __esm(() => {
  init_entity();
  init_query_promise();
  SQLiteRaw = class SQLiteRaw extends QueryPromise {
    constructor(execute, getSQL, action, dialect, mapBatchResult) {
      super();
      this.execute = execute;
      this.getSQL = getSQL;
      this.dialect = dialect;
      this.mapBatchResult = mapBatchResult;
      this.config = { action };
    }
    static [entityKind] = 'SQLiteRaw';
    config;
    getQuery() {
      return {
        ...this.dialect.sqlToQuery(this.getSQL()),
        method: this.config.action,
      };
    }
    mapResult(result, isFromBatch) {
      return isFromBatch ? this.mapBatchResult(result) : result;
    }
    _prepare() {
      return this;
    }
    isResponseInArrayMode() {
      return false;
    }
  };
});

// node_modules/drizzle-orm/sqlite-core/db.js
var BaseSQLiteDatabase;
var init_db = __esm(() => {
  init_entity();
  init_selection_proxy();
  init_sql();
  init_query_builders();
  init_subquery();
  init_count();
  init_query();
  init_raw();
  BaseSQLiteDatabase = class BaseSQLiteDatabase {
    constructor(resultKind, dialect, session, schema) {
      this.resultKind = resultKind;
      this.dialect = dialect;
      this.session = session;
      this._ = schema
        ? {
            schema: schema.schema,
            fullSchema: schema.fullSchema,
            tableNamesMap: schema.tableNamesMap,
          }
        : {
            schema: undefined,
            fullSchema: {},
            tableNamesMap: {},
          };
      this.query = {};
      const query = this.query;
      if (this._.schema) {
        for (const [tableName, columns] of Object.entries(this._.schema)) {
          query[tableName] = new RelationalQueryBuilder(
            resultKind,
            schema.fullSchema,
            this._.schema,
            this._.tableNamesMap,
            schema.fullSchema[tableName],
            columns,
            dialect,
            session,
          );
        }
      }
      this.$cache = { invalidate: async (_params) => {} };
    }
    static [entityKind] = 'BaseSQLiteDatabase';
    query;
    $with = (alias, selection) => {
      const self = this;
      const as = (qb) => {
        if (typeof qb === 'function') {
          qb = qb(new QueryBuilder(self.dialect));
        }
        return new Proxy(
          new WithSubquery(
            qb.getSQL(),
            selection ??
              ('getSelectedFields' in qb ? (qb.getSelectedFields() ?? {}) : {}),
            alias,
            true,
          ),
          new SelectionProxyHandler({
            alias,
            sqlAliasedBehavior: 'alias',
            sqlBehavior: 'error',
          }),
        );
      };
      return { as };
    };
    $count(source, filters) {
      return new SQLiteCountBuilder({ source, filters, session: this.session });
    }
    with(...queries) {
      const self = this;
      function select3(fields) {
        return new SQLiteSelectBuilder({
          fields: fields ?? undefined,
          session: self.session,
          dialect: self.dialect,
          withList: queries,
        });
      }
      function selectDistinct(fields) {
        return new SQLiteSelectBuilder({
          fields: fields ?? undefined,
          session: self.session,
          dialect: self.dialect,
          withList: queries,
          distinct: true,
        });
      }
      function update2(table) {
        return new SQLiteUpdateBuilder(
          table,
          self.session,
          self.dialect,
          queries,
        );
      }
      function insert2(into) {
        return new SQLiteInsertBuilder(
          into,
          self.session,
          self.dialect,
          queries,
        );
      }
      function delete_(from) {
        return new SQLiteDeleteBase(from, self.session, self.dialect, queries);
      }
      return {
        select: select3,
        selectDistinct,
        update: update2,
        insert: insert2,
        delete: delete_,
      };
    }
    select(fields) {
      return new SQLiteSelectBuilder({
        fields: fields ?? undefined,
        session: this.session,
        dialect: this.dialect,
      });
    }
    selectDistinct(fields) {
      return new SQLiteSelectBuilder({
        fields: fields ?? undefined,
        session: this.session,
        dialect: this.dialect,
        distinct: true,
      });
    }
    update(table) {
      return new SQLiteUpdateBuilder(table, this.session, this.dialect);
    }
    $cache;
    insert(into) {
      return new SQLiteInsertBuilder(into, this.session, this.dialect);
    }
    delete(from) {
      return new SQLiteDeleteBase(from, this.session, this.dialect);
    }
    run(query) {
      const sequel =
        typeof query === 'string' ? sql.raw(query) : query.getSQL();
      if (this.resultKind === 'async') {
        return new SQLiteRaw(
          async () => this.session.run(sequel),
          () => sequel,
          'run',
          this.dialect,
          this.session.extractRawRunValueFromBatchResult.bind(this.session),
        );
      }
      return this.session.run(sequel);
    }
    all(query) {
      const sequel =
        typeof query === 'string' ? sql.raw(query) : query.getSQL();
      if (this.resultKind === 'async') {
        return new SQLiteRaw(
          async () => this.session.all(sequel),
          () => sequel,
          'all',
          this.dialect,
          this.session.extractRawAllValueFromBatchResult.bind(this.session),
        );
      }
      return this.session.all(sequel);
    }
    get(query) {
      const sequel =
        typeof query === 'string' ? sql.raw(query) : query.getSQL();
      if (this.resultKind === 'async') {
        return new SQLiteRaw(
          async () => this.session.get(sequel),
          () => sequel,
          'get',
          this.dialect,
          this.session.extractRawGetValueFromBatchResult.bind(this.session),
        );
      }
      return this.session.get(sequel);
    }
    values(query) {
      const sequel =
        typeof query === 'string' ? sql.raw(query) : query.getSQL();
      if (this.resultKind === 'async') {
        return new SQLiteRaw(
          async () => this.session.values(sequel),
          () => sequel,
          'values',
          this.dialect,
          this.session.extractRawValuesValueFromBatchResult.bind(this.session),
        );
      }
      return this.session.values(sequel);
    }
    transaction(transaction, config) {
      return this.session.transaction(transaction, config);
    }
  };
});

// node_modules/drizzle-orm/sqlite-core/alias.js
var init_alias2 = () => {};

// node_modules/drizzle-orm/cache/core/cache.js
async function hashQuery(sql3, params) {
  const dataToHash = `${sql3}-${JSON.stringify(params)}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(dataToHash);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = [...new Uint8Array(hashBuffer)];
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return hashHex;
}
var Cache, NoopCache;
var init_cache = __esm(() => {
  init_entity();
  Cache = class Cache {
    static [entityKind] = 'Cache';
  };
  NoopCache = class NoopCache extends Cache {
    strategy() {
      return 'all';
    }
    static [entityKind] = 'NoopCache';
    async get(_key) {
      return;
    }
    async put(_hashedQuery, _response, _tables, _config) {}
    async onMutate(_params) {}
  };
});

// node_modules/drizzle-orm/sqlite-core/session.js
var ExecuteResultSync, SQLitePreparedQuery, SQLiteSession, SQLiteTransaction;
var init_session = __esm(() => {
  init_cache();
  init_entity();
  init_errors();
  init_query_promise();
  init_db();
  ExecuteResultSync = class ExecuteResultSync extends QueryPromise {
    constructor(resultCb) {
      super();
      this.resultCb = resultCb;
    }
    static [entityKind] = 'ExecuteResultSync';
    async execute() {
      return this.resultCb();
    }
    sync() {
      return this.resultCb();
    }
  };
  SQLitePreparedQuery = class SQLitePreparedQuery {
    constructor(mode, executeMethod, query, cache, queryMetadata, cacheConfig) {
      this.mode = mode;
      this.executeMethod = executeMethod;
      this.query = query;
      this.cache = cache;
      this.queryMetadata = queryMetadata;
      this.cacheConfig = cacheConfig;
      if (cache && cache.strategy() === 'all' && cacheConfig === undefined) {
        this.cacheConfig = { enable: true, autoInvalidate: true };
      }
      if (!this.cacheConfig?.enable) {
        this.cacheConfig = undefined;
      }
    }
    static [entityKind] = 'PreparedQuery';
    joinsNotNullableMap;
    async queryWithCache(queryString, params, query) {
      if (
        this.cache === undefined ||
        is(this.cache, NoopCache) ||
        this.queryMetadata === undefined
      ) {
        try {
          return await query();
        } catch (e) {
          throw new DrizzleQueryError(queryString, params, e);
        }
      }
      if (this.cacheConfig && !this.cacheConfig.enable) {
        try {
          return await query();
        } catch (e) {
          throw new DrizzleQueryError(queryString, params, e);
        }
      }
      if (
        (this.queryMetadata.type === 'insert' ||
          this.queryMetadata.type === 'update' ||
          this.queryMetadata.type === 'delete') &&
        this.queryMetadata.tables.length > 0
      ) {
        try {
          const [res] = await Promise.all([
            query(),
            this.cache.onMutate({ tables: this.queryMetadata.tables }),
          ]);
          return res;
        } catch (e) {
          throw new DrizzleQueryError(queryString, params, e);
        }
      }
      if (!this.cacheConfig) {
        try {
          return await query();
        } catch (e) {
          throw new DrizzleQueryError(queryString, params, e);
        }
      }
      if (this.queryMetadata.type === 'select') {
        const fromCache = await this.cache.get(
          this.cacheConfig.tag ?? (await hashQuery(queryString, params)),
          this.queryMetadata.tables,
          this.cacheConfig.tag !== undefined,
          this.cacheConfig.autoInvalidate,
        );
        if (fromCache === undefined) {
          let result;
          try {
            result = await query();
          } catch (e) {
            throw new DrizzleQueryError(queryString, params, e);
          }
          await this.cache.put(
            this.cacheConfig.tag ?? (await hashQuery(queryString, params)),
            result,
            this.cacheConfig.autoInvalidate ? this.queryMetadata.tables : [],
            this.cacheConfig.tag !== undefined,
            this.cacheConfig.config,
          );
          return result;
        }
        return fromCache;
      }
      try {
        return await query();
      } catch (e) {
        throw new DrizzleQueryError(queryString, params, e);
      }
    }
    getQuery() {
      return this.query;
    }
    mapRunResult(result, _isFromBatch) {
      return result;
    }
    mapAllResult(_result, _isFromBatch) {
      throw new Error('Not implemented');
    }
    mapGetResult(_result, _isFromBatch) {
      throw new Error('Not implemented');
    }
    execute(placeholderValues) {
      if (this.mode === 'async') {
        return this[this.executeMethod](placeholderValues);
      }
      return new ExecuteResultSync(() =>
        this[this.executeMethod](placeholderValues),
      );
    }
    mapResult(response, isFromBatch) {
      switch (this.executeMethod) {
        case 'run': {
          return this.mapRunResult(response, isFromBatch);
        }
        case 'all': {
          return this.mapAllResult(response, isFromBatch);
        }
        case 'get': {
          return this.mapGetResult(response, isFromBatch);
        }
      }
    }
  };
  SQLiteSession = class SQLiteSession {
    constructor(dialect) {
      this.dialect = dialect;
    }
    static [entityKind] = 'SQLiteSession';
    prepareOneTimeQuery(
      query,
      fields,
      executeMethod,
      isResponseInArrayMode,
      customResultMapper,
      queryMetadata,
      cacheConfig,
    ) {
      return this.prepareQuery(
        query,
        fields,
        executeMethod,
        isResponseInArrayMode,
        customResultMapper,
        queryMetadata,
        cacheConfig,
      );
    }
    run(query) {
      const staticQuery = this.dialect.sqlToQuery(query);
      try {
        return this.prepareOneTimeQuery(
          staticQuery,
          undefined,
          'run',
          false,
        ).run();
      } catch (err) {
        throw new DrizzleError({
          cause: err,
          message: `Failed to run the query '${staticQuery.sql}'`,
        });
      }
    }
    extractRawRunValueFromBatchResult(result) {
      return result;
    }
    all(query) {
      return this.prepareOneTimeQuery(
        this.dialect.sqlToQuery(query),
        undefined,
        'run',
        false,
      ).all();
    }
    extractRawAllValueFromBatchResult(_result) {
      throw new Error('Not implemented');
    }
    get(query) {
      return this.prepareOneTimeQuery(
        this.dialect.sqlToQuery(query),
        undefined,
        'run',
        false,
      ).get();
    }
    extractRawGetValueFromBatchResult(_result) {
      throw new Error('Not implemented');
    }
    values(query) {
      return this.prepareOneTimeQuery(
        this.dialect.sqlToQuery(query),
        undefined,
        'run',
        false,
      ).values();
    }
    async count(sql3) {
      const result = await this.values(sql3);
      return result[0][0];
    }
    extractRawValuesValueFromBatchResult(_result) {
      throw new Error('Not implemented');
    }
  };
  SQLiteTransaction = class SQLiteTransaction extends BaseSQLiteDatabase {
    constructor(resultType, dialect, session, schema, nestedIndex = 0) {
      super(resultType, dialect, session, schema);
      this.schema = schema;
      this.nestedIndex = nestedIndex;
    }
    static [entityKind] = 'SQLiteTransaction';
    rollback() {
      throw new TransactionRollbackError();
    }
  };
});

// node_modules/drizzle-orm/sqlite-core/view.js
var init_view = () => {};

// node_modules/drizzle-orm/sqlite-core/index.js
var init_sqlite_core = __esm(() => {
  init_alias2();
  init_checks();
  init_columns();
  init_db();
  init_dialect();
  init_foreign_keys();
  init_indexes();
  init_primary_keys2();
  init_query_builders();
  init_session();
  init_table3();
  init_unique_constraint2();
  init_utils2();
  init_view();
});

// node_modules/drizzle-orm/bun-sqlite/session.js
var SQLiteBunSession, SQLiteBunTransaction, PreparedQuery;
var init_session2 = __esm(() => {
  init_entity();
  init_logger();
  init_sql();
  init_sqlite_core();
  init_session();
  init_utils();
  SQLiteBunSession = class SQLiteBunSession extends SQLiteSession {
    constructor(client, dialect2, schema, options = {}) {
      super(dialect2);
      this.client = client;
      this.schema = schema;
      this.logger = options.logger ?? new NoopLogger();
    }
    static [entityKind] = 'SQLiteBunSession';
    logger;
    exec(query) {
      this.client.exec(query);
    }
    prepareQuery(
      query,
      fields,
      executeMethod,
      isResponseInArrayMode,
      customResultMapper,
    ) {
      const stmt = this.client.prepare(query.sql);
      return new PreparedQuery(
        stmt,
        query,
        this.logger,
        fields,
        executeMethod,
        isResponseInArrayMode,
        customResultMapper,
      );
    }
    transaction(transaction, config = {}) {
      const tx = new SQLiteBunTransaction(
        'sync',
        this.dialect,
        this,
        this.schema,
      );
      let result;
      const nativeTx = this.client.transaction(() => {
        result = transaction(tx);
      });
      nativeTx[config.behavior ?? 'deferred']();
      return result;
    }
  };
  SQLiteBunTransaction = class SQLiteBunTransaction extends SQLiteTransaction {
    static [entityKind] = 'SQLiteBunTransaction';
    transaction(transaction) {
      const savepointName = `sp${this.nestedIndex}`;
      const tx = new SQLiteBunTransaction(
        'sync',
        this.dialect,
        this.session,
        this.schema,
        this.nestedIndex + 1,
      );
      this.session.run(sql.raw(`savepoint ${savepointName}`));
      try {
        const result = transaction(tx);
        this.session.run(sql.raw(`release savepoint ${savepointName}`));
        return result;
      } catch (err) {
        this.session.run(sql.raw(`rollback to savepoint ${savepointName}`));
        throw err;
      }
    }
  };
  PreparedQuery = class PreparedQuery extends SQLitePreparedQuery {
    constructor(
      stmt,
      query,
      logger,
      fields,
      executeMethod,
      _isResponseInArrayMode,
      customResultMapper,
    ) {
      super('sync', executeMethod, query);
      this.stmt = stmt;
      this.logger = logger;
      this.fields = fields;
      this._isResponseInArrayMode = _isResponseInArrayMode;
      this.customResultMapper = customResultMapper;
    }
    static [entityKind] = 'SQLiteBunPreparedQuery';
    run(placeholderValues) {
      const params = fillPlaceholders(
        this.query.params,
        placeholderValues ?? {},
      );
      this.logger.logQuery(this.query.sql, params);
      return this.stmt.run(...params);
    }
    all(placeholderValues) {
      const {
        fields,
        query,
        logger,
        joinsNotNullableMap,
        stmt,
        customResultMapper,
      } = this;
      if (!fields && !customResultMapper) {
        const params = fillPlaceholders(query.params, placeholderValues ?? {});
        logger.logQuery(query.sql, params);
        return stmt.all(...params);
      }
      const rows = this.values(placeholderValues);
      if (customResultMapper) {
        return customResultMapper(rows);
      }
      return rows.map((row) => mapResultRow(fields, row, joinsNotNullableMap));
    }
    get(placeholderValues) {
      const params = fillPlaceholders(
        this.query.params,
        placeholderValues ?? {},
      );
      this.logger.logQuery(this.query.sql, params);
      const row = this.stmt.values(...params)[0];
      if (!row) {
        return;
      }
      const { fields, joinsNotNullableMap, customResultMapper } = this;
      if (!fields && !customResultMapper) {
        return row;
      }
      if (customResultMapper) {
        return customResultMapper([row]);
      }
      return mapResultRow(fields, row, joinsNotNullableMap);
    }
    values(placeholderValues) {
      const params = fillPlaceholders(
        this.query.params,
        placeholderValues ?? {},
      );
      this.logger.logQuery(this.query.sql, params);
      return this.stmt.values(...params);
    }
    isResponseInArrayMode() {
      return this._isResponseInArrayMode;
    }
  };
});

// node_modules/drizzle-orm/bun-sqlite/driver.js
import { Database } from 'bun:sqlite';
function construct(client, config = {}) {
  const dialect2 = new SQLiteSyncDialect({ casing: config.casing });
  let logger;
  if (config.logger === true) {
    logger = new DefaultLogger();
  } else if (config.logger !== false) {
    logger = config.logger;
  }
  let schema;
  if (config.schema) {
    const tablesConfig = extractTablesRelationalConfig(
      config.schema,
      createTableRelationsHelpers,
    );
    schema = {
      fullSchema: config.schema,
      schema: tablesConfig.tables,
      tableNamesMap: tablesConfig.tableNamesMap,
    };
  }
  const session2 = new SQLiteBunSession(client, dialect2, schema, { logger });
  const db2 = new BunSQLiteDatabase('sync', dialect2, session2, schema);
  db2.$client = client;
  return db2;
}
function drizzle(...params) {
  if (params[0] === undefined || typeof params[0] === 'string') {
    const instance =
      params[0] === undefined ? new Database() : new Database(params[0]);
    return construct(instance, params[1]);
  }
  if (isConfig(params[0])) {
    const { connection, client, ...drizzleConfig } = params[0];
    if (client) return construct(client, drizzleConfig);
    if (typeof connection === 'object') {
      const { source, ...opts } = connection;
      const options = Object.values(opts).filter((v) => v !== undefined).length
        ? opts
        : undefined;
      const instance2 = new Database(source, options);
      return construct(instance2, drizzleConfig);
    }
    const instance = new Database(connection);
    return construct(instance, drizzleConfig);
  }
  return construct(params[0], params[1]);
}
var BunSQLiteDatabase;
var init_driver = __esm(() => {
  init_entity();
  init_logger();
  init_relations();
  init_db();
  init_dialect();
  init_utils();
  init_session2();
  BunSQLiteDatabase = class BunSQLiteDatabase extends BaseSQLiteDatabase {
    static [entityKind] = 'BunSQLiteDatabase';
  };
  ((drizzle2) => {
    function mock(config) {
      return construct({}, config);
    }
    drizzle2.mock = mock;
  })(drizzle || (drizzle = {}));
});

// node_modules/drizzle-orm/bun-sqlite/index.js
var init_bun_sqlite = __esm(() => {
  init_driver();
  init_session2();
});

// node_modules/drizzle-orm/index.js
var exports_drizzle_orm = {};
__export(exports_drizzle_orm, {
  textDecoder: () => textDecoder,
  sumDistinct: () => sumDistinct,
  sum: () => sum,
  sql: () => sql,
  relations: () => relations,
  placeholder: () => placeholder,
  param: () => param,
  orderSelectedFields: () => orderSelectedFields,
  or: () => or,
  notLike: () => notLike,
  notInArray: () => notInArray,
  notIlike: () => notIlike,
  notExists: () => notExists,
  notBetween: () => notBetween,
  not: () => not,
  normalizeRelation: () => normalizeRelation,
  noopMapper: () => noopMapper,
  noopEncoder: () => noopEncoder,
  noopDecoder: () => noopDecoder,
  ne: () => ne,
  name: () => name,
  min: () => min,
  max: () => max,
  mapUpdateSet: () => mapUpdateSet,
  mapResultRow: () => mapResultRow,
  mapRelationalRow: () => mapRelationalRow,
  mapColumnsInSQLToAlias: () => mapColumnsInSQLToAlias,
  mapColumnsInAliasedSQLToAlias: () => mapColumnsInAliasedSQLToAlias,
  lte: () => lte,
  lt: () => lt,
  like: () => like,
  l2Distance: () => l2Distance,
  l1Distance: () => l1Distance,
  jaccardDistance: () => jaccardDistance,
  isView: () => isView,
  isTable: () => isTable,
  isSQLWrapper: () => isSQLWrapper,
  isNull: () => isNull,
  isNotNull: () => isNotNull,
  isDriverValueEncoder: () => isDriverValueEncoder,
  isConfig: () => isConfig,
  is: () => is,
  innerProduct: () => innerProduct,
  inArray: () => inArray,
  ilike: () => ilike,
  haveSameKeys: () => haveSameKeys,
  hasOwnEntityKind: () => hasOwnEntityKind,
  hammingDistance: () => hammingDistance,
  gte: () => gte,
  gt: () => gt,
  getViewSelectedFields: () => getViewSelectedFields,
  getViewName: () => getViewName,
  getTableUniqueName: () => getTableUniqueName,
  getTableName: () => getTableName,
  getTableLikeName: () => getTableLikeName,
  getTableColumns: () => getTableColumns,
  getOrderByOperators: () => getOrderByOperators,
  getOperators: () => getOperators,
  getColumnNameAndConfig: () => getColumnNameAndConfig,
  fillPlaceholders: () => fillPlaceholders,
  extractTablesRelationalConfig: () => extractTablesRelationalConfig,
  exists: () => exists,
  eq: () => eq,
  entityKind: () => entityKind,
  desc: () => desc,
  createTableRelationsHelpers: () => createTableRelationsHelpers,
  createOne: () => createOne,
  createMany: () => createMany,
  countDistinct: () => countDistinct,
  count: () => count,
  cosineDistance: () => cosineDistance,
  bindIfParam: () => bindIfParam,
  between: () => between,
  avgDistinct: () => avgDistinct,
  avg: () => avg,
  asc: () => asc,
  arrayOverlaps: () => arrayOverlaps,
  arrayContains: () => arrayContains,
  arrayContained: () => arrayContained,
  applyMixins: () => applyMixins,
  and: () => and,
  aliasedTableColumn: () => aliasedTableColumn,
  aliasedTable: () => aliasedTable,
  aliasedRelation: () => aliasedRelation,
  WithSubquery: () => WithSubquery,
  ViewBaseConfig: () => ViewBaseConfig,
  View: () => View,
  TransactionRollbackError: () => TransactionRollbackError,
  TableAliasProxyHandler: () => TableAliasProxyHandler,
  Table: () => Table,
  Subquery: () => Subquery,
  StringChunk: () => StringChunk,
  Schema: () => Schema,
  SQL: () => SQL,
  Relations: () => Relations,
  RelationTableAliasProxyHandler: () => RelationTableAliasProxyHandler,
  Relation: () => Relation,
  QueryPromise: () => QueryPromise,
  Placeholder: () => Placeholder,
  Param: () => Param,
  OriginalName: () => OriginalName,
  One: () => One,
  NoopLogger: () => NoopLogger,
  Name: () => Name,
  Many: () => Many,
  IsAlias: () => IsAlias,
  FakePrimitiveParam: () => FakePrimitiveParam,
  ExtraConfigColumns: () => ExtraConfigColumns,
  ExtraConfigBuilder: () => ExtraConfigBuilder,
  DrizzleQueryError: () => DrizzleQueryError,
  DrizzleError: () => DrizzleError,
  DefaultLogger: () => DefaultLogger,
  ConsoleLogWriter: () => ConsoleLogWriter,
  Columns: () => Columns,
  ColumnBuilder: () => ColumnBuilder,
  ColumnAliasProxyHandler: () => ColumnAliasProxyHandler,
  Column: () => Column,
  BaseName: () => BaseName,
});
var init_drizzle_orm = __esm(() => {
  init_alias();
  init_column_builder();
  init_column();
  init_entity();
  init_errors();
  init_logger();
  init_query_promise();
  init_relations();
  init_sql2();
  init_subquery();
  init_table();
  init_utils();
  init_view_common();
});

// src/lib/db/schema.ts
var exports_schema = {};
__export(exports_schema, {
  secretsRegistry: () => secretsRegistry,
  scansRelations: () => scansRelations,
  scans: () => scans,
  purgeLog: () => purgeLog,
  findingsRelations: () => findingsRelations,
  findings: () => findings,
});
var scans,
  findings,
  secretsRegistry,
  purgeLog,
  scansRelations,
  findingsRelations;
var init_schema = __esm(() => {
  init_sqlite_core();
  init_drizzle_orm();
  scans = sqliteTable('scans', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    type: text('type').notNull(),
    status: text('status').notNull(),
    startedAt: integer('started_at', { mode: 'timestamp_ms' }).notNull(),
    finishedAt: integer('finished_at', { mode: 'timestamp_ms' }),
    repoPath: text('repo_path').notNull(),
    totalFindings: integer('total_findings').notNull().default(0),
    checkpoint: text('checkpoint'),
  });
  findings = sqliteTable(
    'findings',
    {
      id: integer('id').primaryKey({ autoIncrement: true }),
      scanId: integer('scan_id')
        .notNull()
        .references(() => scans.id, { onDelete: 'cascade' }),
      rule: text('rule').notNull(),
      severity: text('severity').notNull(),
      path: text('path').notNull(),
      line: integer('line').notNull().default(0),
      confidence: integer('confidence').notNull().default(0),
      snippet: text('snippet').notNull(),
      fingerprint: text('fingerprint').unique(),
      status: text('status').notNull().default('open'),
      commitHash: text('commit_hash'),
      author: text('author'),
    },
    (table3) => [
      index('idx_findings_severity').on(table3.severity),
      index('idx_findings_rule').on(table3.rule),
      index('idx_findings_path').on(table3.path),
    ],
  );
  secretsRegistry = sqliteTable('secrets_registry', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    keyName: text('key_name').notNull().unique(),
  });
  purgeLog = sqliteTable('purge_log', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    findingId: integer('finding_id').references(() => findings.id, {
      onDelete: 'set null',
    }),
    repoPath: text('repo_path').notNull(),
    affectedPath: text('affected_path').notNull(),
    ruleMatched: text('rule_matched').notNull(),
    status: text('status').notNull().default('running'),
    pristine: integer('pristine').notNull().default(0),
    errorMessage: text('error_message'),
    startedAt: integer('started_at', { mode: 'timestamp_ms' }).notNull(),
    completedAt: integer('completed_at', { mode: 'timestamp_ms' }),
  });
  scansRelations = relations(scans, ({ many }) => ({
    findings: many(findings),
  }));
  findingsRelations = relations(findings, ({ one }) => ({
    scan: one(scans, {
      fields: [findings.scanId],
      references: [scans.id],
    }),
  }));
});

// src/lib/db/index.ts
var exports_db = {};
__export(exports_db, {
  db: () => db2,
  GARRISON_DIR: () => GARRISON_DIR,
  GARRISON_DB: () => GARRISON_DB,
});
import { Database as Database2 } from 'bun:sqlite';
import { mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
var GARRISON_DIR, GARRISON_DB, sqlite, db2;
var init_db2 = __esm(() => {
  init_bun_sqlite();
  init_schema();
  GARRISON_DIR = join(homedir(), '.sentinel-x');
  GARRISON_DB = join(GARRISON_DIR, 'garrison.db');
  mkdirSync(GARRISON_DIR, { recursive: true });
  sqlite = new Database2(GARRISON_DB);
  sqlite.exec('PRAGMA journal_mode = WAL;');
  sqlite.exec('PRAGMA synchronous = NORMAL;');
  sqlite.exec('PRAGMA foreign_keys = ON;');
  db2 = drizzle(sqlite, { schema: exports_schema });
});

// src/lib/db/migrate.ts
var exports_migrate = {};
__export(exports_migrate, {
  runMigrations: () => runMigrations,
});
async function runMigrations() {
  db2.run(sql`
    CREATE TABLE IF NOT EXISTS scans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      started_at INTEGER NOT NULL,
      finished_at INTEGER,
      repo_path TEXT NOT NULL,
      total_findings INTEGER NOT NULL DEFAULT 0,
      checkpoint TEXT
    )
  `);
  db2.run(sql`
    CREATE TABLE IF NOT EXISTS findings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scan_id INTEGER NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
      rule TEXT NOT NULL,
      severity TEXT NOT NULL,
      path TEXT NOT NULL,
      line INTEGER NOT NULL DEFAULT 0,
      confidence INTEGER NOT NULL DEFAULT 0,
      snippet TEXT NOT NULL,
      fingerprint TEXT UNIQUE,
      status TEXT NOT NULL DEFAULT 'open',
      commit_hash TEXT,
      author TEXT
    )
  `);
  db2.run(
    sql`CREATE INDEX IF NOT EXISTS idx_findings_severity ON findings(severity)`,
  );
  db2.run(sql`CREATE INDEX IF NOT EXISTS idx_findings_rule ON findings(rule)`);
  db2.run(sql`CREATE INDEX IF NOT EXISTS idx_findings_path ON findings(path)`);
  db2.run(sql`
    CREATE TABLE IF NOT EXISTS secrets_registry (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key_name TEXT NOT NULL UNIQUE
    )
  `);
  db2.run(sql`
    CREATE TABLE IF NOT EXISTS purge_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      finding_id INTEGER REFERENCES findings(id) ON DELETE SET NULL,
      repo_path TEXT NOT NULL,
      affected_path TEXT NOT NULL,
      rule_matched TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'running',
      pristine INTEGER NOT NULL DEFAULT 0,
      error_message TEXT,
      started_at INTEGER NOT NULL,
      completed_at INTEGER
    )
  `);
  console.log(
    '[Sentinel-X] Garrison DB migrated successfully \u2192',
    process.env.GARRISON_DB ?? 'global',
  );
}
var init_migrate = __esm(() => {
  init_db2();
  init_drizzle_orm();
});

// src/lib/scanner/patterns.ts
var PATTERNS;
var init_patterns = __esm(() => {
  PATTERNS = [
    {
      name: 'GitHub Token',
      regex: /ghp_[A-Za-z0-9_]{36,}/g,
      severity: 'critical',
    },
    {
      name: 'Stripe Secret Key',
      regex: /sk_(live|test)_[A-Za-z0-9]{20,}/g,
      severity: 'critical',
    },
    {
      name: 'AWS Access Key',
      regex: /AKIA[0-9A-Z]{16}/g,
      severity: 'critical',
    },
    {
      name: 'Generic API Key',
      regex: /(?:api[_-]?key|apikey)\s*[:=]\s*["']?([A-Za-z0-9_\-]{20,})/gi,
      severity: 'high',
    },
    {
      name: 'Private Key Block',
      regex: /-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----/g,
      severity: 'critical',
    },
    {
      name: 'Password Assignment',
      regex: /(?:password|passwd|pwd)\s*[:=]\s*["']([^\s"']{8,})/gi,
      severity: 'high',
    },
    {
      name: 'Connection String',
      regex: /(?:mongodb|postgres|mysql|redis):\/\/[^\s"'`]+/gi,
      severity: 'high',
    },
  ];
});

// src/lib/scanner/ghost-hunter.ts
var exports_ghost_hunter = {};
__export(exports_ghost_hunter, {
  ghostHunter: () => ghostHunter,
});
var { Glob } = globalThis.Bun;
import path2 from 'path';
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function shannonEntropy(input) {
  if (!input) return 0;
  const freq = {};
  for (const c of input) freq[c] = (freq[c] || 0) + 1;
  let entropy = 0;
  const len = input.length;
  for (const count2 of Object.values(freq)) {
    const p = count2 / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}
function extractSnippet(lineContent, match) {
  const idx = lineContent.indexOf(match);
  if (idx === -1) return lineContent.trim();
  const start = Math.max(0, idx - 30);
  const end = Math.min(lineContent.length, idx + match.length + 30);
  const snippet = lineContent.slice(start, end).trim();
  return start > 0
    ? `\u2026${snippet}`
    : snippet.length < lineContent.length
      ? `${snippet}\u2026`
      : snippet;
}
async function loadEnvKeys() {
  const keys = new Set();
  try {
    const envFile = Bun.file('.env');
    if (envFile.size > 0) {
      const text3 = await envFile.text();
      for (const line of text3.split(`
`)) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key] = trimmed.split('=');
          if (key) keys.add(key.trim());
        }
      }
    }
  } catch {}
  return keys;
}
async function* ghostHunter(rootDir = process.cwd()) {
  const envKeys = await loadEnvKeys();
  const taintRegex =
    envKeys.size > 0
      ? new RegExp(Array.from(envKeys).map(escapeRegex).join('|'), 'gi')
      : null;
  const scanner = new Glob('**/*').scan({ dot: true, cwd: rootDir });
  for await (const filePath of scanner) {
    const fullPath = path2.join(rootDir, filePath);
    const parts = filePath.split(/[\\/]/);
    if (parts.some((part) => IGNORED_DIRS.has(part))) continue;
    const file = Bun.file(fullPath);
    if (file.size > MAX_FILE_SIZE) continue;
    if (file.size === 0) continue;
    const text3 = await file.text();
    const lines = text3.split(`
`);
    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = lines[lineNum];
      if (!MASTER_PATTERN.test(line)) continue;
      const isTainted =
        taintRegex !== null && taintRegex.test(line) && filePath !== '.env';
      for (const rule of PATTERNS) {
        rule.regex.lastIndex = 0;
        let match;
        while ((match = rule.regex.exec(line)) !== null) {
          const matched = match[0];
          let confidence = 0.7;
          if (rule.entropyThreshold !== undefined) {
            const entropy = shannonEntropy(matched);
            if (entropy >= rule.entropyThreshold) {
              confidence = Math.min(1, confidence + 0.2);
            }
          }
          if (isTainted) confidence = 1;
          yield {
            path: filePath,
            line: lineNum + 1,
            confidence,
            snippet: extractSnippet(line, matched),
            rule: rule.name,
            severity: rule.severity,
          };
        }
      }
    }
  }
}
var IGNORED_DIRS, MAX_FILE_SIZE, MASTER_PATTERN;
var init_ghost_hunter = __esm(() => {
  init_patterns();
  IGNORED_DIRS = new Set([
    'node_modules',
    '.next',
    'dist',
    'build',
    '.git',
    '.out',
    'vendor',
  ]);
  MAX_FILE_SIZE = parseInt(process.env.MAX_SCAN_SIZE || '5242880', 10);
  MASTER_PATTERN = new RegExp(
    PATTERNS.map((p) => p.regex.source).join('|'),
    'gi',
  );
});

// node_modules/commander/esm.mjs
var import__ = __toESM(require_commander(), 1);
var {
  program,
  createCommand,
  createArgument,
  createOption,
  CommanderError,
  InvalidArgumentError,
  InvalidOptionArgumentError,
  Command,
  Argument,
  Option,
  Help,
} = import__.default;

// node_modules/open/index.js
import process8 from 'process';
import path from 'path';
import { fileURLToPath } from 'url';
import childProcess3 from 'child_process';
import fs5, { constants as fsConstants2 } from 'fs/promises';

// node_modules/wsl-utils/index.js
import { promisify as promisify2 } from 'util';
import childProcess2 from 'child_process';
import fs4, { constants as fsConstants } from 'fs/promises';

// node_modules/is-wsl/index.js
import process2 from 'process';
import os from 'os';
import fs3 from 'fs';

// node_modules/is-inside-container/index.js
import fs2 from 'fs';

// node_modules/is-docker/index.js
import fs from 'fs';
var isDockerCached;
function hasDockerEnv() {
  try {
    fs.statSync('/.dockerenv');
    return true;
  } catch {
    return false;
  }
}
function hasDockerCGroup() {
  try {
    return fs.readFileSync('/proc/self/cgroup', 'utf8').includes('docker');
  } catch {
    return false;
  }
}
function isDocker() {
  if (isDockerCached === undefined) {
    isDockerCached = hasDockerEnv() || hasDockerCGroup();
  }
  return isDockerCached;
}

// node_modules/is-inside-container/index.js
var cachedResult;
var hasContainerEnv = () => {
  try {
    fs2.statSync('/run/.containerenv');
    return true;
  } catch {
    return false;
  }
};
function isInsideContainer() {
  if (cachedResult === undefined) {
    cachedResult = hasContainerEnv() || isDocker();
  }
  return cachedResult;
}

// node_modules/is-wsl/index.js
var isWsl = () => {
  if (process2.platform !== 'linux') {
    return false;
  }
  if (os.release().toLowerCase().includes('microsoft')) {
    if (isInsideContainer()) {
      return false;
    }
    return true;
  }
  try {
    if (
      fs3
        .readFileSync('/proc/version', 'utf8')
        .toLowerCase()
        .includes('microsoft')
    ) {
      return !isInsideContainer();
    }
  } catch {}
  if (
    fs3.existsSync('/proc/sys/fs/binfmt_misc/WSLInterop') ||
    fs3.existsSync('/run/WSL')
  ) {
    return !isInsideContainer();
  }
  return false;
};
var is_wsl_default = process2.env.__IS_WSL_TEST__ ? isWsl : isWsl();

// node_modules/powershell-utils/index.js
import process3 from 'process';
import { Buffer as Buffer2 } from 'buffer';
import { promisify } from 'util';
import childProcess from 'child_process';
var execFile = promisify(childProcess.execFile);
var powerShellPath = () =>
  `${process3.env.SYSTEMROOT || process3.env.windir || String.raw`C:\Windows`}\\System32\\WindowsPowerShell\\v1.0\\powershell.exe`;
var executePowerShell = async (command, options = {}) => {
  const { powerShellPath: psPath, ...execFileOptions } = options;
  const encodedCommand = executePowerShell.encodeCommand(command);
  return execFile(
    psPath ?? powerShellPath(),
    [...executePowerShell.argumentsPrefix, encodedCommand],
    {
      encoding: 'utf8',
      ...execFileOptions,
    },
  );
};
executePowerShell.argumentsPrefix = [
  '-NoProfile',
  '-NonInteractive',
  '-ExecutionPolicy',
  'Bypass',
  '-EncodedCommand',
];
executePowerShell.encodeCommand = (command) =>
  Buffer2.from(command, 'utf16le').toString('base64');
executePowerShell.escapeArgument = (value) =>
  `'${String(value).replaceAll("'", "''")}'`;

// node_modules/wsl-utils/utilities.js
function parseMountPointFromConfig(content) {
  for (const line of content.split(`
`)) {
    if (/^\s*#/.test(line)) {
      continue;
    }
    const match = /^\s*root\s*=\s*(?<mountPoint>"[^"]*"|'[^']*'|[^#]*)/.exec(
      line,
    );
    if (!match) {
      continue;
    }
    return match.groups.mountPoint.trim().replaceAll(/^["']|["']$/g, '');
  }
}

// node_modules/wsl-utils/index.js
var execFile2 = promisify2(childProcess2.execFile);
var wslDrivesMountPoint = (() => {
  const defaultMountPoint = '/mnt/';
  let mountPoint;
  return async function () {
    if (mountPoint) {
      return mountPoint;
    }
    const configFilePath = '/etc/wsl.conf';
    let isConfigFileExists = false;
    try {
      await fs4.access(configFilePath, fsConstants.F_OK);
      isConfigFileExists = true;
    } catch {}
    if (!isConfigFileExists) {
      return defaultMountPoint;
    }
    const configContent = await fs4.readFile(configFilePath, {
      encoding: 'utf8',
    });
    const parsedMountPoint = parseMountPointFromConfig(configContent);
    if (parsedMountPoint === undefined) {
      return defaultMountPoint;
    }
    mountPoint = parsedMountPoint;
    mountPoint = mountPoint.endsWith('/') ? mountPoint : `${mountPoint}/`;
    return mountPoint;
  };
})();
var powerShellPathFromWsl = async () => {
  const mountPoint = await wslDrivesMountPoint();
  return `${mountPoint}c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe`;
};
var powerShellPath2 = is_wsl_default ? powerShellPathFromWsl : powerShellPath;
var canAccessPowerShellPromise;
var canAccessPowerShell = async () => {
  canAccessPowerShellPromise ??= (async () => {
    try {
      const psPath = await powerShellPath2();
      await fs4.access(psPath, fsConstants.X_OK);
      return true;
    } catch {
      return false;
    }
  })();
  return canAccessPowerShellPromise;
};
var wslDefaultBrowser = async () => {
  const psPath = await powerShellPath2();
  const command = String.raw`(Get-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\Shell\Associations\UrlAssociations\http\UserChoice").ProgId`;
  const { stdout } = await executePowerShell(command, {
    powerShellPath: psPath,
  });
  return stdout.trim();
};
var convertWslPathToWindows = async (path) => {
  if (/^[a-z]+:\/\//i.test(path)) {
    return path;
  }
  try {
    const { stdout } = await execFile2('wslpath', ['-aw', path], {
      encoding: 'utf8',
    });
    return stdout.trim();
  } catch {
    return path;
  }
};

// node_modules/define-lazy-prop/index.js
function defineLazyProperty(object, propertyName, valueGetter) {
  const define = (value) =>
    Object.defineProperty(object, propertyName, {
      value,
      enumerable: true,
      writable: true,
    });
  Object.defineProperty(object, propertyName, {
    configurable: true,
    enumerable: true,
    get() {
      const result = valueGetter();
      define(result);
      return result;
    },
    set(value) {
      define(value);
    },
  });
  return object;
}

// node_modules/default-browser/index.js
import { promisify as promisify6 } from 'util';
import process6 from 'process';
import { execFile as execFile6 } from 'child_process';

// node_modules/default-browser-id/index.js
import { promisify as promisify3 } from 'util';
import process4 from 'process';
import { execFile as execFile3 } from 'child_process';
var execFileAsync = promisify3(execFile3);
async function defaultBrowserId() {
  if (process4.platform !== 'darwin') {
    throw new Error('macOS only');
  }
  const { stdout } = await execFileAsync('defaults', [
    'read',
    'com.apple.LaunchServices/com.apple.launchservices.secure',
    'LSHandlers',
  ]);
  const match =
    /LSHandlerRoleAll = "(?!-)(?<id>[^"]+?)";\s+?LSHandlerURLScheme = (?:http|https);/.exec(
      stdout,
    );
  const browserId = match?.groups.id ?? 'com.apple.Safari';
  if (browserId === 'com.apple.safari') {
    return 'com.apple.Safari';
  }
  return browserId;
}

// node_modules/run-applescript/index.js
import process5 from 'process';
import { promisify as promisify4 } from 'util';
import { execFile as execFile4, execFileSync } from 'child_process';
var execFileAsync2 = promisify4(execFile4);
async function runAppleScript(
  script,
  { humanReadableOutput = true, signal } = {},
) {
  if (process5.platform !== 'darwin') {
    throw new Error('macOS only');
  }
  const outputArguments = humanReadableOutput ? [] : ['-ss'];
  const execOptions = {};
  if (signal) {
    execOptions.signal = signal;
  }
  const { stdout } = await execFileAsync2(
    'osascript',
    ['-e', script, outputArguments],
    execOptions,
  );
  return stdout.trim();
}

// node_modules/bundle-name/index.js
async function bundleName(bundleId) {
  return runAppleScript(`tell application "Finder" to set app_path to application file id "${bundleId}" as string
tell application "System Events" to get value of property list item "CFBundleName" of property list file (app_path & ":Contents:Info.plist")`);
}

// node_modules/default-browser/windows.js
import { promisify as promisify5 } from 'util';
import { execFile as execFile5 } from 'child_process';
var execFileAsync3 = promisify5(execFile5);
var windowsBrowserProgIds = {
  MSEdgeHTM: { name: 'Edge', id: 'com.microsoft.edge' },
  MSEdgeBHTML: { name: 'Edge Beta', id: 'com.microsoft.edge.beta' },
  MSEdgeDHTML: { name: 'Edge Dev', id: 'com.microsoft.edge.dev' },
  AppXq0fevzme2pys62n3e0fbqa7peapykr8v: {
    name: 'Edge',
    id: 'com.microsoft.edge.old',
  },
  ChromeHTML: { name: 'Chrome', id: 'com.google.chrome' },
  ChromeBHTML: { name: 'Chrome Beta', id: 'com.google.chrome.beta' },
  ChromeDHTML: { name: 'Chrome Dev', id: 'com.google.chrome.dev' },
  ChromiumHTM: { name: 'Chromium', id: 'org.chromium.Chromium' },
  BraveHTML: { name: 'Brave', id: 'com.brave.Browser' },
  BraveBHTML: { name: 'Brave Beta', id: 'com.brave.Browser.beta' },
  BraveDHTML: { name: 'Brave Dev', id: 'com.brave.Browser.dev' },
  BraveSSHTM: { name: 'Brave Nightly', id: 'com.brave.Browser.nightly' },
  FirefoxURL: { name: 'Firefox', id: 'org.mozilla.firefox' },
  OperaStable: { name: 'Opera', id: 'com.operasoftware.Opera' },
  VivaldiHTM: { name: 'Vivaldi', id: 'com.vivaldi.Vivaldi' },
  'IE.HTTP': { name: 'Internet Explorer', id: 'com.microsoft.ie' },
};
var _windowsBrowserProgIdMap = new Map(Object.entries(windowsBrowserProgIds));

class UnknownBrowserError extends Error {}
async function defaultBrowser(_execFileAsync = execFileAsync3) {
  const { stdout } = await _execFileAsync('reg', [
    'QUERY',
    ' HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\Shell\\Associations\\UrlAssociations\\http\\UserChoice',
    '/v',
    'ProgId',
  ]);
  const match = /ProgId\s*REG_SZ\s*(?<id>\S+)/.exec(stdout);
  if (!match) {
    throw new UnknownBrowserError(
      `Cannot find Windows browser in stdout: ${JSON.stringify(stdout)}`,
    );
  }
  const { id } = match.groups;
  const dotIndex = id.lastIndexOf('.');
  const hyphenIndex = id.lastIndexOf('-');
  const baseIdByDot = dotIndex === -1 ? undefined : id.slice(0, dotIndex);
  const baseIdByHyphen =
    hyphenIndex === -1 ? undefined : id.slice(0, hyphenIndex);
  return (
    windowsBrowserProgIds[id] ??
    windowsBrowserProgIds[baseIdByDot] ??
    windowsBrowserProgIds[baseIdByHyphen] ?? { name: id, id }
  );
}

// node_modules/default-browser/index.js
var execFileAsync4 = promisify6(execFile6);
var titleize = (string) =>
  string.toLowerCase().replaceAll(/(?:^|\s|-)\S/g, (x) => x.toUpperCase());
async function defaultBrowser2() {
  if (process6.platform === 'darwin') {
    const id = await defaultBrowserId();
    const name = await bundleName(id);
    return { name, id };
  }
  if (process6.platform === 'linux') {
    const { stdout } = await execFileAsync4('xdg-mime', [
      'query',
      'default',
      'x-scheme-handler/http',
    ]);
    const id = stdout.trim();
    const name = titleize(id.replace(/.desktop$/, '').replace('-', ' '));
    return { name, id };
  }
  if (process6.platform === 'win32') {
    return defaultBrowser();
  }
  throw new Error('Only macOS, Linux, and Windows are supported');
}

// node_modules/is-in-ssh/index.js
import process7 from 'process';
var isInSsh = Boolean(
  process7.env.SSH_CONNECTION ||
  process7.env.SSH_CLIENT ||
  process7.env.SSH_TTY,
);
var is_in_ssh_default = isInSsh;

// node_modules/open/index.js
var fallbackAttemptSymbol = Symbol('fallbackAttempt');
var __dirname2 = import.meta.url
  ? path.dirname(fileURLToPath(import.meta.url))
  : '';
var localXdgOpenPath = path.join(__dirname2, 'xdg-open');
var { platform, arch } = process8;
var tryEachApp = async (apps, opener) => {
  if (apps.length === 0) {
    return;
  }
  const errors = [];
  for (const app of apps) {
    try {
      return await opener(app);
    } catch (error) {
      errors.push(error);
    }
  }
  throw new AggregateError(errors, 'Failed to open in all supported apps');
};
var baseOpen = async (options) => {
  options = {
    wait: false,
    background: false,
    newInstance: false,
    allowNonzeroExitCode: false,
    ...options,
  };
  const isFallbackAttempt = options[fallbackAttemptSymbol] === true;
  delete options[fallbackAttemptSymbol];
  if (Array.isArray(options.app)) {
    return tryEachApp(options.app, (singleApp) =>
      baseOpen({
        ...options,
        app: singleApp,
        [fallbackAttemptSymbol]: true,
      }),
    );
  }
  let { name: app, arguments: appArguments = [] } = options.app ?? {};
  appArguments = [...appArguments];
  if (Array.isArray(app)) {
    return tryEachApp(app, (appName) =>
      baseOpen({
        ...options,
        app: {
          name: appName,
          arguments: appArguments,
        },
        [fallbackAttemptSymbol]: true,
      }),
    );
  }
  if (app === 'browser' || app === 'browserPrivate') {
    const ids = {
      'com.google.chrome': 'chrome',
      'google-chrome.desktop': 'chrome',
      'com.brave.browser': 'brave',
      'org.mozilla.firefox': 'firefox',
      'firefox.desktop': 'firefox',
      'com.microsoft.msedge': 'edge',
      'com.microsoft.edge': 'edge',
      'com.microsoft.edgemac': 'edge',
      'microsoft-edge.desktop': 'edge',
      'com.apple.safari': 'safari',
    };
    const flags = {
      chrome: '--incognito',
      brave: '--incognito',
      firefox: '--private-window',
      edge: '--inPrivate',
    };
    let browser;
    if (is_wsl_default) {
      const progId = await wslDefaultBrowser();
      const browserInfo = _windowsBrowserProgIdMap.get(progId);
      browser = browserInfo ?? {};
    } else {
      browser = await defaultBrowser2();
    }
    if (browser.id in ids) {
      const browserName = ids[browser.id.toLowerCase()];
      if (app === 'browserPrivate') {
        if (browserName === 'safari') {
          throw new Error(
            "Safari doesn't support opening in private mode via command line",
          );
        }
        appArguments.push(flags[browserName]);
      }
      return baseOpen({
        ...options,
        app: {
          name: apps[browserName],
          arguments: appArguments,
        },
      });
    }
    throw new Error(`${browser.name} is not supported as a default browser`);
  }
  let command;
  const cliArguments = [];
  const childProcessOptions = {};
  let shouldUseWindowsInWsl = false;
  if (is_wsl_default && !isInsideContainer() && !is_in_ssh_default && !app) {
    shouldUseWindowsInWsl = await canAccessPowerShell();
  }
  if (platform === 'darwin') {
    command = 'open';
    if (options.wait) {
      cliArguments.push('--wait-apps');
    }
    if (options.background) {
      cliArguments.push('--background');
    }
    if (options.newInstance) {
      cliArguments.push('--new');
    }
    if (app) {
      cliArguments.push('-a', app);
    }
  } else if (platform === 'win32' || shouldUseWindowsInWsl) {
    command = await powerShellPath2();
    cliArguments.push(...executePowerShell.argumentsPrefix);
    if (!is_wsl_default) {
      childProcessOptions.windowsVerbatimArguments = true;
    }
    if (is_wsl_default && options.target) {
      options.target = await convertWslPathToWindows(options.target);
    }
    const encodedArguments = [
      "$ProgressPreference = 'SilentlyContinue';",
      'Start',
    ];
    if (options.wait) {
      encodedArguments.push('-Wait');
    }
    if (app) {
      encodedArguments.push(executePowerShell.escapeArgument(app));
      if (options.target) {
        appArguments.push(options.target);
      }
    } else if (options.target) {
      encodedArguments.push(executePowerShell.escapeArgument(options.target));
    }
    if (appArguments.length > 0) {
      appArguments = appArguments.map((argument) =>
        executePowerShell.escapeArgument(argument),
      );
      encodedArguments.push('-ArgumentList', appArguments.join(','));
    }
    options.target = executePowerShell.encodeCommand(
      encodedArguments.join(' '),
    );
    if (!options.wait) {
      childProcessOptions.stdio = 'ignore';
    }
  } else {
    if (app) {
      command = app;
    } else {
      const isBundled = !__dirname2 || __dirname2 === '/';
      let exeLocalXdgOpen = false;
      try {
        await fs5.access(localXdgOpenPath, fsConstants2.X_OK);
        exeLocalXdgOpen = true;
      } catch {}
      const useSystemXdgOpen =
        process8.versions.electron ??
        (platform === 'android' || isBundled || !exeLocalXdgOpen);
      command = useSystemXdgOpen ? 'xdg-open' : localXdgOpenPath;
    }
    if (appArguments.length > 0) {
      cliArguments.push(...appArguments);
    }
    if (!options.wait) {
      childProcessOptions.stdio = 'ignore';
      childProcessOptions.detached = true;
    }
  }
  if (platform === 'darwin' && appArguments.length > 0) {
    cliArguments.push('--args', ...appArguments);
  }
  if (options.target) {
    cliArguments.push(options.target);
  }
  const subprocess = childProcess3.spawn(
    command,
    cliArguments,
    childProcessOptions,
  );
  if (options.wait) {
    return new Promise((resolve, reject) => {
      subprocess.once('error', reject);
      subprocess.once('close', (exitCode) => {
        if (!options.allowNonzeroExitCode && exitCode !== 0) {
          reject(new Error(`Exited with code ${exitCode}`));
          return;
        }
        resolve(subprocess);
      });
    });
  }
  if (isFallbackAttempt) {
    return new Promise((resolve, reject) => {
      subprocess.once('error', reject);
      subprocess.once('spawn', () => {
        subprocess.once('close', (exitCode) => {
          subprocess.off('error', reject);
          if (exitCode !== 0) {
            reject(new Error(`Exited with code ${exitCode}`));
            return;
          }
          subprocess.unref();
          resolve(subprocess);
        });
      });
    });
  }
  subprocess.unref();
  return new Promise((resolve, reject) => {
    subprocess.once('error', reject);
    subprocess.once('spawn', () => {
      subprocess.off('error', reject);
      resolve(subprocess);
    });
  });
};
var open = (target, options) => {
  if (typeof target !== 'string') {
    throw new TypeError('Expected a `target`');
  }
  return baseOpen({
    ...options,
    target,
  });
};
function detectArchBinary(binary) {
  if (typeof binary === 'string' || Array.isArray(binary)) {
    return binary;
  }
  const { [arch]: archBinary } = binary;
  if (!archBinary) {
    throw new Error(`${arch} is not supported`);
  }
  return archBinary;
}
function detectPlatformBinary({ [platform]: platformBinary }, { wsl } = {}) {
  if (wsl && is_wsl_default) {
    return detectArchBinary(wsl);
  }
  if (!platformBinary) {
    throw new Error(`${platform} is not supported`);
  }
  return detectArchBinary(platformBinary);
}
var apps = {
  browser: 'browser',
  browserPrivate: 'browserPrivate',
};
defineLazyProperty(apps, 'chrome', () =>
  detectPlatformBinary(
    {
      darwin: 'google chrome',
      win32: 'chrome',
      linux: [
        'google-chrome',
        'google-chrome-stable',
        'chromium',
        'chromium-browser',
      ],
    },
    {
      wsl: {
        ia32: '/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe',
        x64: [
          '/mnt/c/Program Files/Google/Chrome/Application/chrome.exe',
          '/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe',
        ],
      },
    },
  ),
);
defineLazyProperty(apps, 'brave', () =>
  detectPlatformBinary(
    {
      darwin: 'brave browser',
      win32: 'brave',
      linux: ['brave-browser', 'brave'],
    },
    {
      wsl: {
        ia32: '/mnt/c/Program Files (x86)/BraveSoftware/Brave-Browser/Application/brave.exe',
        x64: [
          '/mnt/c/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe',
          '/mnt/c/Program Files (x86)/BraveSoftware/Brave-Browser/Application/brave.exe',
        ],
      },
    },
  ),
);
defineLazyProperty(apps, 'firefox', () =>
  detectPlatformBinary(
    {
      darwin: 'firefox',
      win32: String.raw`C:\Program Files\Mozilla Firefox\firefox.exe`,
      linux: 'firefox',
    },
    {
      wsl: '/mnt/c/Program Files/Mozilla Firefox/firefox.exe',
    },
  ),
);
defineLazyProperty(apps, 'edge', () =>
  detectPlatformBinary(
    {
      darwin: 'microsoft edge',
      win32: 'msedge',
      linux: ['microsoft-edge', 'microsoft-edge-dev'],
    },
    {
      wsl: '/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    },
  ),
);
defineLazyProperty(apps, 'safari', () =>
  detectPlatformBinary({
    darwin: 'Safari',
  }),
);
var open_default = open;

// src/cli.ts
import { join as join2 } from 'path';
import { existsSync } from 'fs';
import { spawn } from 'child_process';
var PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
var PACKAGE_ROOT = join2(import.meta.dirname, '..');
function getServerPath() {
  const standalone = join2(PACKAGE_ROOT, '.next', 'standalone', 'server.js');
  if (existsSync(standalone)) return standalone;
  throw new Error(
    '[Sentinel-X] Standalone build not found. Run: bun run build',
  );
}
async function startServer(openPath, scanPath) {
  try {
    const { runMigrations: runMigrations2 } = await Promise.resolve().then(
      () => (init_migrate(), exports_migrate),
    );
    await runMigrations2();
  } catch (err) {
    console.error('[Sentinel-X] Failed to run migrations:', err);
  }
  return new Promise((resolve, reject) => {
    const serverPath = getServerPath();
    const env = {
      ...process.env,
      PORT: String(PORT),
      HOSTNAME: '127.0.0.1',
      NODE_ENV: 'production',
    };
    if (scanPath) {
      env.SENTINEL_SCAN_PATH = scanPath;
    } else {
      env.SENTINEL_SCAN_PATH = process.cwd();
    }
    console.log(`
\uD83D\uDEE1\uFE0F  Sentinel-X starting on http://localhost:${PORT}...
`);
    const server = spawn('bun', ['run', serverPath], {
      env,
      stdio: 'pipe',
      cwd: PACKAGE_ROOT,
    });
    server.stdout?.once('data', async () => {
      const url = `http://localhost:${PORT}${openPath}`;
      console.log(`\u2713  Opening ${url}`);
      await open_default(url);
      resolve();
    });
    server.stderr?.on('data', (chunk) => {
      const msg = chunk.toString();
      if (msg.includes('Ready') || msg.includes('started')) return;
      process.stderr.write(chunk);
    });
    server.on('error', reject);
  });
}
async function runHeadlessScan(repoPath) {
  const target = repoPath ? join2(process.cwd(), repoPath) : process.cwd();
  console.log(`
\uD83D\uDD0D  Sentinel-X headless scan \u2192 ${target}
`);
  const { runGhostHunter } = await Promise.resolve().then(
    () => (init_ghost_hunter(), exports_ghost_hunter),
  );
  const { db: db3 } = await Promise.resolve().then(
    () => (init_db2(), exports_db),
  );
  const { runMigrations: runMigrations2 } = await Promise.resolve().then(
    () => (init_migrate(), exports_migrate),
  );
  await runMigrations2();
  const { scans: scans2 } = await Promise.resolve().then(
    () => (init_schema(), exports_schema),
  );
  const { sql: sql4 } = await Promise.resolve().then(
    () => (init_drizzle_orm(), exports_drizzle_orm),
  );
  const [scan] = db3
    .insert(scans2)
    .values({
      type: 'ghost_hunter',
      status: 'running',
      startedAt: new Date(),
      repoPath: target,
    })
    .returning()
    .all();
  let count2 = 0;
  for await (const finding of runGhostHunter(target)) {
    count2++;
    process.stdout
      .write(`  [${finding.severity.toUpperCase()}] ${finding.path}:${finding.line} \u2014 ${finding.rule}
`);
  }
  db3.run(
    sql4`UPDATE scans SET status = 'completed', total_findings = ${count2}, finished_at = ${Date.now()} WHERE id = ${scan.id}`,
  );
  console.log(`
\u2713  Scan complete. ${count2} findings. DB: ~/.sentinel-x/garrison.db
`);
}
program
  .name('sentinel')
  .description('Sentinel-X \u2014 Sovereign security scanner for your codebase')
  .version('3.1.0');
program
  .command('dash', { isDefault: false })
  .description('Start the dashboard and open it in your browser')
  .option('-p, --port <port>', 'Port to run on', '3000')
  .action(async () => {
    await startServer('/dashboard');
  });
program
  .command('scan [path]')
  .description('Run a headless scan without the UI (pure terminal)')
  .action(async (path3) => {
    await runHeadlessScan(path3 ?? '');
  });
program
  .command('start', { isDefault: true, hidden: true })
  .description('Start the server (default)')
  .action(async () => {
    await startServer('/');
  });
program.parseAsync(process.argv);
