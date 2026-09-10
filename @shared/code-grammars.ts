/**
 * Extra Prism language grammars for code blocks.
 *
 * `prism-react-renderer` bundles Prism core plus a curated language set
 * (json, yaml, markdown, ts/tsx/js, css, html, python, …) but omits the ones a
 * Minecraft modpack blog actually reaches for: bash/shell, java, diff, toml, ini.
 * Prism's own component files register against a global `Prism` and would drag a
 * second prism core into the bundle, so instead these are the upstream grammars
 * (PrismJS 1.29) distilled into a pure-TS registration helper that mutates the
 * `languages` registry of whatever Prism instance it is handed. It only touches
 * `languages` (plus `extend`/`insertBefore`, which the vendored core provides).
 */

/** Recursive grammar/token map – only Prism dereferences it, so stay opaque. */
type GrammarMap = Record<string, unknown>;

interface CodePrismLanguages {
  [name: string]: unknown;
  extend(id: string, redef: unknown): unknown;
  insertBefore(language: string, target: string, redef: unknown): unknown;
}

interface CodePrism {
  languages: CodePrismLanguages;
}

export const registerExtraCodeGrammars = (prism: CodePrism): void => {
  const languages = prism.languages;

  // diff -------------------------------------------------------------------
  const diffGrammar: GrammarMap = {
    coord: [/^(?:\*{3}|-{3}|\+{3}).*$/m, /^@@.*@@$/m, /^\d.*$/m],
  };
  const PREFIXES: Record<string, string> = {
    "deleted-sign": "-",
    "deleted-arrow": "<",
    "inserted-sign": "+",
    "inserted-arrow": ">",
    unchanged: " ",
    diff: "!",
  };
  for (const name of Object.keys(PREFIXES)) {
    const prefix = PREFIXES[name];
    const alias: string[] = [];
    if (!/^\w+$/.test(name)) {
      alias.push(/\w+/.exec(name)?.[0] ?? "");
    }
    if (name === "diff") {
      alias.push("bold");
    }
    diffGrammar[name] = {
      pattern: RegExp("^(?:[" + prefix + "].*(?:\r\n?|\n|(?![\\s\\S])))+", "m"),
      alias,
      inside: {
        line: { pattern: /(.)(?=[\s\S]).*(?:\r\n?|\n)?/, lookbehind: true },
        prefix: { pattern: /[\s\S]/, alias: /\w+/.exec(name)?.[0] ?? "" },
      },
    };
  }
  languages.diff = diffGrammar;

  // clike ------------------------------------------------------------------
  const clikeGrammar: GrammarMap = {
    comment: [
      { pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/, lookbehind: true, greedy: true },
      { pattern: /(^|[^\\:])\/\/.*/, lookbehind: true, greedy: true },
    ],
    string: {
      pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
      greedy: true,
    },
    "class-name": {
      pattern: /(\b(?:class|extends|implements|instanceof|interface|new|trait)\s+|\bcatch\s+\()[\w.\\]+/i,
      lookbehind: true,
      inside: { punctuation: /[.\\]/ },
    },
    keyword:
      /\b(?:break|catch|continue|do|else|finally|for|function|if|in|instanceof|new|null|return|throw|try|while)\b/,
    boolean: /\b(?:false|true)\b/,
    function: /\b\w+(?=\()/,
    number: /\b0x[\da-f]+\b|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?/i,
    operator: /[<>]=?|[!=]=?=?|--?|\+\+?|&&?|\|\|?|[?*/~^%]/,
    punctuation: /[{}[\];(),.:]/,
  };
  languages.clike = clikeGrammar;

  // ini --------------------------------------------------------------------
  const iniGrammar: GrammarMap = {
    comment: { pattern: /(^[ \f\t\v]*)[#;][^\n\r]*/m, lookbehind: true },
    section: {
      pattern: /(^[ \f\t\v]*)\[[^\n\r\]]*\]?/m,
      lookbehind: true,
      inside: {
        "section-name": {
          pattern: /(^\[[ \f\t\v]*)[^ \f\t\v\]]+(?:[ \f\t\v]+[^ \f\t\v\]]+)*/,
          lookbehind: true,
          alias: "selector",
        },
        punctuation: /\[|\]/,
      },
    },
    key: {
      pattern: /(^[ \f\t\v]*)[^ \f\n\r\t\v=]+(?:[ \f\t\v]+[^ \f\n\r\t\v=]+)*(?=[ \f\t\v]*=)/m,
      lookbehind: true,
      alias: "attr-name",
    },
    value: {
      pattern: /(=[ \f\t\v]*)[^ \f\n\r\t\v]+(?:[ \f\t\v]+[^ \f\n\r\t\v]+)*/,
      lookbehind: true,
      alias: "attr-value",
      inside: {
        "inner-value": { pattern: /^("|').+(?=\1$)/, lookbehind: true },
      },
    },
    punctuation: /=/,
  };
  languages.ini = iniGrammar;

  // toml -------------------------------------------------------------------
  const tomlKey = /(?:[\w-]+|'[^'\n\r]*'|"(?:\\.|[^\\"\r\n])*")/.source;
  const insertTomlKey = (pattern: string): string => pattern.replace(/__/g, () => tomlKey);
  const tomlGrammar: GrammarMap = {
    comment: { pattern: /#.*/, greedy: true },
    "toml-table": {
      pattern: RegExp(insertTomlKey(/(^[\t ]*\[\s*(?:\[\s*)?)__(?:\s*\.\s*__)*(?=\s*\])/.source), "m"),
      lookbehind: true,
      greedy: true,
      alias: "class-name",
    },
    key: {
      pattern: RegExp(insertTomlKey(/(^[\t ]*|[{,]\s*)__(?:\s*\.\s*__)*(?=\s*=)/.source), "m"),
      lookbehind: true,
      greedy: true,
      alias: "property",
    },
    string: {
      pattern: /"""(?:\\[\s\S]|[^\\])*?"""|'''[\s\S]*?'''|'[^'\n\r]*'|"(?:\\.|[^\\"\r\n])*"/,
      greedy: true,
    },
    date: [
      { pattern: /\b\d{4}-\d{2}-\d{2}(?:[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)?\b/i, alias: "number" },
      { pattern: /\b\d{2}:\d{2}:\d{2}(?:\.\d+)?\b/, alias: "number" },
    ],
    number:
      /(?:\b0(?:x[\da-zA-Z]+(?:_[\da-zA-Z]+)*|o[0-7]+(?:_[0-7]+)*|b[10]+(?:_[10]+)*))\b|[-+]?\b\d+(?:_\d+)*(?:\.\d+(?:_\d+)*)?(?:[eE][+-]?\d+(?:_\d+)*)?\b|[-+]?\b(?:inf|nan)\b/,
    boolean: /\b(?:false|true)\b/,
    punctuation: /[.,=[\]{}]/,
  };
  languages.toml = tomlGrammar;

  // bash -------------------------------------------------------------------
  const envVars =
    "\\b(?:BASH|BASHOPTS|BASH_ALIASES|BASH_ARGC|BASH_ARGV|BASH_CMDS|BASH_COMPLETION_COMPAT_DIR|BASH_LINENO|BASH_REMATCH|BASH_SOURCE|BASH_VERSINFO|BASH_VERSION|COLORTERM|COLUMNS|COMP_WORDBREAKS|DBUS_SESSION_BUS_ADDRESS|DEFAULTS_PATH|DESKTOP_SESSION|DIRSTACK|DISPLAY|EUID|GDMSESSION|GDM_LANG|GNOME_KEYRING_CONTROL|GNOME_KEYRING_PID|GPG_AGENT_INFO|GROUPS|HISTCONTROL|HISTFILE|HISTFILESIZE|HISTSIZE|HOME|HOSTNAME|HOSTTYPE|IFS|INSTANCE|JOB|LANG|LANGUAGE|LC_ADDRESS|LC_ALL|LC_IDENTIFICATION|LC_MEASUREMENT|LC_MONETARY|LC_NAME|LC_NUMERIC|LC_PAPER|LC_TELEPHONE|LC_TIME|LESSCLOSE|LESSOPEN|LINES|LOGNAME|LS_COLORS|MACHTYPE|MAILCHECK|MANDATORY_PATH|NO_AT_BRIDGE|OLDPWD|OPTERR|OPTIND|ORBIT_SOCKETDIR|OSTYPE|PAPERSIZE|PATH|PIPESTATUS|PPID|PS1|PS2|PS3|PS4|PWD|RANDOM|REPLY|SECONDS|SELINUX_INIT|SESSION|SESSIONTYPE|SESSION_MANAGER|SHELL|SHELLOPTS|SHLVL|SSH_AUTH_SOCK|TERM|UID|UPSTART_EVENTS|UPSTART_INSTANCE|UPSTART_JOB|UPSTART_SESSION|USER|WINDOWID|XAUTHORITY|XDG_CONFIG_DIRS|XDG_CURRENT_DESKTOP|XDG_DATA_DIRS|XDG_GREETER_DATA_DIR|XDG_MENU_PREFIX|XDG_RUNTIME_DIR|XDG_SEAT|XDG_SEAT_PATH|XDG_SESSION_DESKTOP|XDG_SESSION_ID|XDG_SESSION_PATH|XDG_SESSION_TYPE|XDG_VTNR|XMODIFIERS)\\b";
  const commandAfterHeredoc: GrammarMap = {
    pattern: /(^(["']?)\w+\2)[ \t]+\S.*/,
    lookbehind: true,
    alias: "punctuation",
    inside: undefined,
  };
  const arithmeticEnv = {
    pattern: /\$?\(\([\s\S]+?\)\)/,
    greedy: true,
    inside: {
      variable: [{ pattern: /(^\$\(\([\s\S]+)\)\)/, lookbehind: true }, /^\$\(\(/],
      number: /\b0x[\dA-Fa-f]+\b|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:[Ee]-?\d+)?/,
      operator: /--|\+\+|\*\*=?|<<=?|>>=?|&&|\|\||[=!+\-*/%<>^&|]=?|[?~:]/,
      punctuation: /\(\(?|\)\)?|,|;/,
    },
  };
  const commandSub = {
    pattern: /\$\((?:\([^)]+\)|[^()])+\)|`[^`]+`/,
    greedy: true,
    inside: { variable: /^\$\(|^`|\)$|`$/ },
  };
  const braceExpand = {
    pattern: /\$\{[^}]+\}/,
    greedy: true,
    inside: {
      operator: /:[-=?+]?|[!/]|##?|%%?|\^\^?|,,?/,
      punctuation: /[[\]]/,
      environment: {
        pattern: RegExp("(\\{)" + envVars),
        lookbehind: true,
        alias: "constant",
      },
    },
  };
  const insideString = {
    bash: commandAfterHeredoc,
    environment: {
      pattern: RegExp("\\$" + envVars),
      alias: "constant",
    },
    variable: [arithmeticEnv, commandSub, braceExpand],
    entity: /\\(?:[abceEfnrtv\\"]|O?[0-7]{1,3}|U[0-9a-fA-F]{8}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{1,2})/,
  };
  const bashGrammar: GrammarMap = {
    shebang: { pattern: /^#!\s*\/.*/, alias: "important" },
    comment: { pattern: /(^|[^"{\\$])#.*/, lookbehind: true },
    "function-name": [
      { pattern: /(\bfunction\s+)[\w-]+(?=(?:\s*\(?:\s*\))?\s*\{)/, lookbehind: true, alias: "function" },
      { pattern: /\b[\w-]+(?=\s*\(\s*\)\s*\{)/, alias: "function" },
    ],
    // Highlight variable names as variables in for and select beginnings.
    "for-or-select": {
      pattern: /(\b(?:for|select)\s+)\w+(?=\s+in\s)/,
      alias: "variable",
      lookbehind: true,
    },
    // Highlight variable names as variables in the left-hand side of assignments ("=" and "+=").
    "assign-left": {
      pattern: /(^|[\s;|&]|[<>]\()\w+(?:\.\w+)*(?=\+?=)/,
      inside: {
        environment: { pattern: RegExp("(^|[\\s;|&]|[<>]\\()" + envVars), lookbehind: true, alias: "constant" },
      },
      alias: "variable",
      lookbehind: true,
    },
    // Highlight parameter names as variables.
    parameter: {
      pattern: /(^|\s)-{1,2}(?:\w+:[+-]?)?\w+(?:\.\w+)*(?=[=\s]|$)/,
      alias: "variable",
      lookbehind: true,
    },
    string: [
      // Here-document (expansion allowed).
      {
        pattern: /((?:^|[^<])<<-?\s*)(\w+)\s[\s\S]*?(?:\r?\n|\r)\2/,
        lookbehind: true,
        greedy: true,
        inside: insideString,
      },
      // Here-document with quoted tag (no expansion).
      {
        pattern: /((?:^|[^<])<<-?\s*)(["'])(\w+)\2\s[\s\S]*?(?:\r?\n|\r)\3/,
        lookbehind: true,
        greedy: true,
        inside: { bash: commandAfterHeredoc },
      },
      {
        pattern: /(^|[^\\](?:\\\\)*)"(?:\\[\s\S]|\$\([^)]+\)|\$(?!\()|`[^`]+`|[^"\\`$])*"/,
        lookbehind: true,
        greedy: true,
        inside: insideString,
      },
      { pattern: /(^|[^$\\])'[^']*'/, lookbehind: true, greedy: true },
      { pattern: /\$'(?:[^'\\]|\\[\s\S])*'/, greedy: true, inside: { entity: insideString.entity } },
    ],
    environment: { pattern: RegExp("\\$?" + envVars), alias: "constant" },
    variable: insideString.variable,
    function: {
      pattern:
        /(^|[\s;|&]|[<>]\()(?:add|apropos|apt|apt-cache|apt-get|aptitude|aspell|automysqlbackup|awk|basename|bash|bc|bconsole|bg|bzip2|cal|cargo|cat|cfdisk|chgrp|chkconfig|chmod|chown|chroot|cksum|clear|cmp|column|comm|composer|cp|cron|crontab|csplit|curl|cut|date|dc|dd|ddrescue|debootstrap|df|diff|diff3|dig|dir|dircolors|dirname|dirs|dmesg|docker|docker-compose|du|egrep|eject|env|ethtool|expand|expect|expr|fdformat|fdisk|fg|fgrep|file|find|fmt|fold|format|free|fsck|ftp|fuser|gawk|git|gparted|grep|groupadd|groupdel|groupmod|groups|grub-mkconfig|gzip|halt|head|hg|history|host|hostname|htop|iconv|id|ifconfig|ifdown|ifup|import|install|ip|java|jobs|join|kill|killall|less|link|ln|locate|logname|logrotate|look|lpc|lpr|lprint|lprintd|lprintq|lprm|ls|lsof|lynx|make|man|mc|mdadm|mkconfig|mkdir|mke2fs|mkfifo|mkfs|mkisofs|mknod|mkswap|mmv|more|most|mount|mtools|mtr|mutt|mv|nano|nc|netstat|nice|nl|node|nohup|notify-send|npm|nslookup|op|open|parted|passwd|paste|pathchk|ping|pkill|pnpm|podman|podman-compose|popd|pr|printcap|printenv|ps|pushd|pv|quota|quotacheck|quotactl|ram|rar|rcp|reboot|remsync|rename|renice|rev|rm|rmdir|rpm|rsync|scp|screen|sdiff|sed|sendmail|seq|service|sftp|sh|shellcheck|shuf|shutdown|sleep|slocate|sort|split|ssh|stat|strace|su|sudo|sum|suspend|swapon|sync|sysctl|tac|tail|tar|tee|time|timeout|top|touch|tr|traceroute|tsort|tty|umount|uname|unexpand|uniq|units|unrar|unshar|unzip|update-grub|uptime|useradd|userdel|usermod|users|uudecode|uuencode|v|vcpkg|vdir|vi|vim|virsh|vmstat|wait|watch|wc|wget|whereis|which|who|whoami|write|xargs|xdg-open|yarn|yes|zenity|zip|zsh|zypper)(?=$|[)\s;|&])/,
      lookbehind: true,
    },
    keyword: {
      pattern:
        /(^|[\s;|&]|[<>]\()(?:case|do|done|elif|else|esac|fi|for|function|if|in|select|then|until|while)(?=$|[)\s;|&])/,
      lookbehind: true,
    },
    builtin: {
      pattern:
        /(^|[\s;|&]|[<>]\()(?:\.|:|alias|bind|break|builtin|caller|cd|command|continue|declare|echo|enable|eval|exec|exit|export|getopts|hash|help|let|local|logout|mapfile|printf|pwd|read|readarray|readonly|return|set|shift|shopt|source|test|times|trap|type|typeset|ulimit|umask|unalias|unset)(?=$|[)\s;|&])/,
      lookbehind: true,
      alias: "class-name",
    },
    boolean: {
      pattern: /(^|[\s;|&]|[<>]\()(?:false|true)(?=$|[)\s;|&])/,
      lookbehind: true,
    },
    "file-descriptor": { pattern: /\B&\d\b/, alias: "important" },
    operator: {
      pattern: /\d?<>|>\||\+=|=[=~]?|!=?|<<[<-]?|[&\d]?>>|\d[<>]&?|[<>][&=]?|&[>&]?|\|[&|]?/,
      inside: { "file-descriptor": { pattern: /^\d/, alias: "important" } },
    },
    punctuation: /\$?\(\(?|\)\)?|\.\.|[{}[\];\\]/,
    number: { pattern: /(^|\s)(?:[1-9]\d*|0)(?:[.,]\d+)?\b/, lookbehind: true },
  };
  languages.bash = bashGrammar;
  commandAfterHeredoc.inside = bashGrammar;
  // Patterns in command substitution.
  const commandSubInside: GrammarMap = commandSub.inside;
  const tokensToCopy = [
    "comment",
    "function-name",
    "for-or-select",
    "assign-left",
    "parameter",
    "string",
    "environment",
    "function",
    "keyword",
    "builtin",
    "boolean",
    "file-descriptor",
    "operator",
    "punctuation",
    "number",
  ] as const;
  for (const name of tokensToCopy) {
    commandSubInside[name] = bashGrammar[name];
  }
  languages.sh = bashGrammar;
  languages.shell = bashGrammar;

  // java -------------------------------------------------------------------
  const javaKeywords =
    /\b(?:abstract|assert|boolean|break|byte|case|catch|char|class|const|continue|default|do|double|else|enum|exports|extends|final|finally|float|for|goto|if|implements|import|instanceof|int|interface|long|module|native|new|non-sealed|null|open|opens|package|permits|private|protected|provides|public|record(?!\s*[(){}[\]<>=%~.:,;?+\-*/&|^])|requires|return|sealed|short|static|strictfp|super|switch|synchronized|this|throw|throws|to|transient|transitive|try|uses|var|void|volatile|while|with|yield)\b/;
  // Full package (optional) + parent classes (optional).
  const javaClassNamePrefix = /(?:[a-z]\w*\s*\.\s*)*(?:[A-Z]\w*\s*\.\s*)*/.source;
  // Based on Java naming conventions.
  const javaClassName = {
    pattern: RegExp(/(^|[^\w.])/.source + javaClassNamePrefix + /[A-Z](?:[\d_A-Z]*[a-z]\w*)?\b/.source),
    lookbehind: true,
    inside: {
      namespace: {
        pattern: /^[a-z]\w*(?:\s*\.\s*[a-z]\w*)*(?:\s*\.)?/,
        inside: { punctuation: /\./ },
      },
      punctuation: /\./,
    },
  };
  const javaGrammar = languages.extend("clike", {
    string: {
      pattern: /(^|[^\\])"(?:\\.|[^"\\\r\n])*"/,
      lookbehind: true,
      greedy: true,
    },
    "class-name": [
      javaClassName,
      {
        // Variables, parameters, and constructor references.
        pattern: RegExp(
          /(^|[^\w.])/.source +
            javaClassNamePrefix +
            /[A-Z]\w*(?=\s+\w+\s*[;,=()]|\s*(?:\[[\s,]*\]\s*)?::\s*new\b)/.source
        ),
        lookbehind: true,
        inside: javaClassName.inside,
      },
      {
        // Class names based on keyword.
        pattern: RegExp(
          /(\b(?:class|enum|extends|implements|instanceof|interface|new|record|throws)\s+)/.source +
            javaClassNamePrefix +
            /[A-Z]\w*\b/.source
        ),
        lookbehind: true,
        inside: javaClassName.inside,
      },
    ],
    keyword: javaKeywords,
    function: [clikeGrammar.function, { pattern: /(::\s*)[a-z_]\w*/, lookbehind: true }],
    number:
      /\b0b[01][01_]*L?\b|\b0x(?:\.[\da-f_p+-]+|[\da-f_]+(?:\.[\da-f_p+-]+)?)\b|(?:\b\d[\d_]*(?:\.[\d_]*)?|\B\.\d[\d_]*)(?:e[+-]?\d[\d_]*)?[dfl]?/i,
    operator: {
      pattern: /(^|[^.])(?:<<=?|>>>?=?|->|--|\+\+|&&|\|\||::|[?:~]|[-+*/%&|^!=<>]=?)/m,
      lookbehind: true,
    },
    constant: /\b[A-Z][A-Z_\d]+\b/,
  });
  languages.java = javaGrammar;
  languages.insertBefore("java", "string", {
    "triple-quoted-string": {
      pattern: /"""[ \t]*[\r\n](?:(?:"|"")?(?:\\.|[^"\\]))*"""/,
      greedy: true,
      alias: "string",
    },
    char: {
      pattern: /'(?:\\.|[^'\\\r\n]){1,6}'/,
      greedy: true,
    },
  });
  languages.insertBefore("java", "class-name", {
    annotation: {
      pattern: /(^|[^.])@\w+(?:\s*\.\s*\w+)*/,
      lookbehind: true,
      alias: "punctuation",
    },
    generics: {
      pattern: /<(?:[\w\s,.?]|&(?!&)|<(?:[\w\s,.?]|&(?!&)|<(?:[\w\s,.?]|&(?!&)|<(?:[\w\s,.?]|&(?!&))*>)*>)*>)*>/,
      inside: {
        "class-name": javaClassName,
        keyword: javaKeywords,
        punctuation: /[<>(),.:]/,
        operator: /[?&|]/,
      },
    },
    import: [
      {
        pattern: RegExp(/(\bimport\s+)/.source + javaClassNamePrefix + /(?:[A-Z]\w*|\*)(?=\s*;)/.source),
        lookbehind: true,
        inside: {
          namespace: javaClassName.inside.namespace,
          punctuation: /\./,
          operator: /\*/,
          "class-name": /\w+/,
        },
      },
      {
        pattern: RegExp(/(\bimport\s+static\s+)/.source + javaClassNamePrefix + /(?:\w+|\*)(?=\s*;)/.source),
        lookbehind: true,
        alias: "static",
        inside: {
          namespace: javaClassName.inside.namespace,
          static: /\b\w+$/,
          punctuation: /\./,
          operator: /\*/,
          "class-name": /\w+/,
        },
      },
    ],
    namespace: {
      pattern: RegExp(
        /(\b(?:exports|import(?:\s+static)?|module|open|opens|package|provides|requires|to|transitive|uses|with)\s+)(?!<keyword>)[a-z]\w*(?:\.[a-z]\w*)*\.?/.source.replace(
          /<keyword>/g,
          () => javaKeywords.source
        )
      ),
      lookbehind: true,
      inside: { punctuation: /\./ },
    },
  });

  // prism-react-renderer's vendored markdown grammar emits a top-level `table`
  // token for pipe tables, but the `table` class collides with Tailwind's
  // `.table` display utility (`display: table` boxes - so table rows visually
  // stack onto their own lines). Rename the rule so the harmless `md-table`
  // class is emitted instead; the nested `table-*` token names have no
  // matching Tailwind utilities, and `table-header` keeps its `important`
  // alias for the green header coloring.
  const markdown = languages.markdown as GrammarMap | undefined;
  if (markdown && "table" in markdown) {
    const tableRule = markdown.table;
    markdown["md-table"] = tableRule;
    delete markdown.table;
  }
};
