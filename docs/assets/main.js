// ../rix/src/parser/tokenizer.js
var identifierStart = /[\p{L}_]/u;
var identifierPart = /[\p{L}\p{N}_]/u;
var symbols = [
  ":=:",
  ":>=:",
  ":<=:",
  ":>:",
  ":<:",
  ":=>",
  ":->",
  "\\/=",
  "/\\=",
  "\\/",
  "/\\",
  "?!-",
  "?-",
  "^=>",
  "?&",
  "!?",
  "++=",
  "++",
  "<<",
  ">>",
  "<>",
  "_>",
  "<_",
  "||>",
  "~~=",
  "::=",
  "//=",
  "**=",
  "/^=",
  "/~=",
  "|>&&",
  "|>||",
  "|>>",
  "|:>",
  "|>:",
  "|>?",
  "|><",
  "|<>",
  "|;",
  "|}",
  "|>/|",
  "|>#|",
  "|>//",
  "|>/",
  "|>",
  "/%",
  "//",
  "/^",
  "/~",
  "::+",
  ":~/",
  ":/:",
  ":~",
  ":/%",
  "::",
  ":+",
  ":%",
  "~!:",
  "~:",
  "~=",
  "+=",
  "-=",
  "*=",
  "/=",
  "%=",
  "^^",
  "^=",
  "\\=",
  "===",
  "<=",
  ">=",
  "==",
  "!=",
  "&&",
  "||",
  ">:",
  "<",
  ">",
  "->",
  "=>",
  "**",
  "?=",
  "??",
  "?:",
  "?|",
  "@_",
  "|^:",
  "|+",
  "|*",
  "|:",
  "|;",
  "|^",
  "|?",
  "~{",
  "~[",
  ":=",
  "...",
  "..",
  "|.",
  ".|",
  ".=",
  "{!",
  "#",
  "%",
  ",",
  ";",
  "(",
  ")",
  "[",
  "]",
  "{",
  "}",
  "+",
  "-",
  "*",
  "/",
  "^",
  "_",
  ".",
  "~",
  "@@",
  "@",
  "$$",
  "$",
  "=",
  "'",
  ":",
  "?",
  "\\"
];
function posToLineCol(input, pos) {
  let line = 1;
  let col = 1;
  for (let i = 0;i < pos && i < input.length; i++) {
    if (input[i] === `
`) {
      line++;
      col = 1;
    } else {
      col++;
    }
  }
  return { line, col };
}
function tokenize(input) {
  const tokens = [];
  let position = 0;
  while (position < input.length) {
    const startPos = position;
    while (position < input.length && /\s/.test(input[position])) {
      position++;
    }
    if (position >= input.length) {
      tokens.push({
        type: "End",
        original: input.slice(startPos),
        value: null,
        pos: [startPos, startPos, input.length]
      });
      break;
    }
    let token = null;
    token = tryMatchComment(input, position);
    if (!token) {
      token = tryMatchNumber(input, position);
    }
    if (!token) {
      token = tryMatchExplicitCF(input, position);
    }
    if (!token) {
      token = tryMatchString(input, position);
    }
    if (!token) {
      token = tryMatchSystemFunctionRef(input, position);
    }
    if (!token) {
      token = tryMatchOuterIdentifier(input, position);
    }
    if (!token) {
      token = tryMatchIdentifier(input, position);
    }
    if (!token) {
      token = tryMatchRegexLiteral(input, position);
    }
    if (!token) {
      token = tryMatchBrace(input, position);
    }
    if (!token) {
      token = tryMatchSemicolonSequence(input, position);
    }
    if (!token) {
      token = tryMatchSymbol(input, position);
    }
    if (token) {
      const whitespace = input.slice(startPos, position);
      token.original = whitespace + token.original;
      token.pos[0] = startPos;
      if (token.type !== "String") {
        token.pos[1] = position;
      }
      tokens.push(token);
      position += token.original.length - whitespace.length;
    } else {
      position++;
    }
  }
  if (tokens.length === 0 || tokens[tokens.length - 1].type !== "End") {
    tokens.push({
      type: "End",
      original: "",
      value: null,
      pos: [input.length, input.length, input.length]
    });
  }
  return tokens;
}
function tryMatchComment(input, position) {
  const remaining = input.slice(position);
  if (!remaining.startsWith("##"))
    return null;
  let tagEndIndex = -1;
  let hasSpaceInTag = false;
  for (let i = 2;i < remaining.length - 1; i++) {
    if (remaining[i] === "#" && remaining[i + 1] === "#") {
      tagEndIndex = i;
      break;
    }
    if (/\s/.test(remaining[i])) {
      hasSpaceInTag = true;
      break;
    }
  }
  if (tagEndIndex !== -1 && !hasSpaceInTag) {
    const tag = remaining.slice(2, tagEndIndex);
    const normalizedTag = tag.toLowerCase();
    const openDelimiter = `##${tag}##`;
    const closeDelimiter = `##${normalizedTag}##`;
    let searchPos = tagEndIndex + 2;
    while (searchPos < remaining.length - (normalizedTag.length + 4) + 1) {
      const potentialCloseStart = remaining.indexOf("##", searchPos);
      if (potentialCloseStart === -1)
        break;
      const potentialCloseTagEnd = remaining.indexOf("##", potentialCloseStart + 2);
      if (potentialCloseTagEnd === -1)
        break;
      const foundTag = remaining.slice(potentialCloseStart + 2, potentialCloseTagEnd).toLowerCase();
      if (foundTag === normalizedTag) {
        const totalLength = potentialCloseTagEnd + 2;
        const value = remaining.slice(tagEndIndex + 2, potentialCloseStart);
        return {
          type: "String",
          original: remaining.slice(0, totalLength),
          value,
          kind: "comment",
          pos: [position, position + tagEndIndex + 2, position + totalLength]
        };
      }
      searchPos = potentialCloseStart + 1;
    }
    const { line, col } = posToLineCol(input, position);
    throw new Error(`Unclosed multi-line comment with tag "${tag}" at line ${line}:${col}`);
  }
  let lineEndIndex = remaining.indexOf(`
`);
  if (lineEndIndex === -1)
    lineEndIndex = remaining.length;
  return {
    type: "String",
    original: remaining.slice(0, lineEndIndex),
    value: remaining.slice(2, lineEndIndex),
    kind: "comment",
    pos: [position, position + 2, position + lineEndIndex]
  };
}
function tryMatchString(input, position) {
  const remaining = input.slice(position);
  const blockCommentMatch = remaining.match(/^\/(\*+)/);
  if (blockCommentMatch) {
    const starCount = blockCommentMatch[1].length;
    const fullPattern = new RegExp(`^\\/\\*{${starCount}}([\\s\\S]*?)\\*{${starCount}}\\/`);
    const match = remaining.match(fullPattern);
    if (match) {
      return {
        type: "String",
        original: match[0],
        value: match[1],
        kind: "comment",
        pos: [
          position,
          position + blockCommentMatch[0].length,
          position + match[0].length
        ]
      };
    }
    const { line, col } = posToLineCol(input, position);
    throw new Error(`Delimiter unmatched at line ${line}:${col}. Need ${starCount} stars followed by slash.`);
  }
  const quoteMatch = remaining.match(/^("+)/);
  if (quoteMatch) {
    const quoteCount = quoteMatch[1].length;
    let searchPos = position + quoteCount;
    while (searchPos < input.length) {
      const foundQuotes = input.slice(searchPos).match(/^("+)/);
      if (foundQuotes && foundQuotes[1].length === quoteCount) {
        const content = input.slice(position + quoteCount, searchPos);
        const original = input.slice(position, searchPos + quoteCount);
        return {
          type: "String",
          original,
          value: content,
          kind: "quote",
          pos: [position, position + quoteCount, searchPos + quoteCount]
        };
      }
      searchPos++;
    }
    const { line, col } = posToLineCol(input, position);
    throw new Error(`Delimiter unmatched at line ${line}:${col}. Need ${quoteCount} closing quotes.`);
  }
  const backtickMatch = remaining.match(/^(`+)/);
  if (backtickMatch) {
    const backtickCount = backtickMatch[1].length;
    let searchPos = position + backtickCount;
    while (searchPos < input.length) {
      const foundBackticks = input.slice(searchPos).match(/^(`+)/);
      if (foundBackticks && foundBackticks[1].length === backtickCount) {
        const content = input.slice(position + backtickCount, searchPos);
        const original = input.slice(position, searchPos + backtickCount);
        return {
          type: "String",
          original,
          value: content,
          kind: "backtick",
          pos: [position, position + backtickCount, searchPos + backtickCount]
        };
      }
      searchPos++;
    }
    const { line, col } = posToLineCol(input, position);
    throw new Error(`Delimiter unmatched at line ${line}:${col}. Need ${backtickCount} closing backticks.`);
  }
  return null;
}
function tryMatchExplicitCF(input, position) {
  const remaining = input.slice(position);
  let match = remaining.match(/^~-?(?:0z\[\d+\]|0[a-zA-Z])[0-9a-zA-Z]+\.\~[0-9a-zA-Z]+(?:~[0-9a-zA-Z]+)*/);
  if (match) {
    return {
      type: "Number",
      original: match[0],
      value: match[0],
      pos: [position, position, position + match[0].length]
    };
  }
  match = remaining.match(/^~-?\d+\.~\d+(?:~\d+)*/);
  if (match) {
    return {
      type: "Number",
      original: match[0],
      value: match[0],
      pos: [position, position, position + match[0].length]
    };
  }
  return null;
}
function tryMatchNumber(input, position) {
  const remaining = input.slice(position);
  let match;
  if (!/^(-?\d|-?\.\d)/.test(remaining)) {
    return null;
  }
  if (/^-\d+\.~\d/.test(remaining)) {
    const { line, col } = posToLineCol(input, position);
    const cfStr = remaining.match(/^-\d+\.~[\d~]*/)[0];
    const posStr = cfStr.slice(1);
    throw new Error(`Ambiguous continued fraction at ${line}:${col}: write ~${cfStr} for a negative first coefficient, or -~${posStr} to negate the continued fraction value.`);
  }
  match = remaining.match(/^-?(?:0z\[\d+\]|0[a-zA-Z])[0-9a-zA-Z]+\.~[0-9a-zA-Z]+(?:~[0-9a-zA-Z]+)*/);
  if (match) {
    return {
      type: "Number",
      original: match[0],
      value: match[0],
      pos: [position, position, position + match[0].length]
    };
  }
  match = remaining.match(/^-?0[A-Z]"(?:[^"\\]|\\.)*"/);
  if (match) {
    return {
      type: "Number",
      original: match[0],
      value: match[0],
      pos: [position, position, position + match[0].length]
    };
  }
  match = remaining.match(/^-?0[A-Z][0-9A-Za-z@&./#~_^+-]*/);
  if (match) {
    return {
      type: "Number",
      original: match[0],
      value: match[0],
      pos: [position, position, position + match[0].length]
    };
  }
  match = remaining.match(/^-?(?:(?:0z\[\d+\]|0[a-zA-Z])[0-9a-zA-Z]*(?:\.[0-9a-zA-Z]*)?|(?:\d+\.\.\d+\/\d+|\d+\.\d+#\d+|\.\d+#\d+|\d+#\d+|\d+\/\d+|\d+\.\d+|\.\d+|\d+)):-?(?:(?:0z\[\d+\]|0[a-zA-Z])[0-9a-zA-Z]*(?:\.[0-9a-zA-Z]*)?|(?:\d+\.\.\d+\/\d+|\d+\.\d+#\d+|\.\d+#\d+|\d+#\d+|\d+\/\d+|\d+\.\d+|\.\d+|\d+))/);
  if (match) {
    return {
      type: "Number",
      original: match[0],
      value: match[0],
      pos: [position, position, position + match[0].length]
    };
  }
  match = remaining.match(/^-?(?:0z\[\d+\]|0[a-zA-Z])[0-9a-zA-Z]*\.\.(?:0z\[\d+\]|0[a-zA-Z])?[0-9a-zA-Z]*\/(?:0z\[\d+\]|0[a-zA-Z])?[0-9a-zA-Z]*/);
  if (match) {
    return {
      type: "Number",
      original: match[0],
      value: match[0],
      pos: [position, position, position + match[0].length]
    };
  }
  match = remaining.match(/^-?(?:0z\[\d+\]|0[a-zA-Z])[0-9a-zA-Z]*\/(?:0z\[\d+\]|0[a-zA-Z])?[0-9a-zA-Z]*/);
  if (match) {
    return {
      type: "Number",
      original: match[0],
      value: match[0],
      pos: [position, position, position + match[0].length]
    };
  }
  match = remaining.match(/^-?(?:0z\[\d+\]|0[a-zA-Z])[0-9a-zA-Z]*\.[0-9a-zA-Z]*/);
  if (match) {
    return {
      type: "Number",
      original: match[0],
      value: match[0],
      pos: [position, position, position + match[0].length]
    };
  }
  match = remaining.match(/^-?(?:0z\[\d+\]|0[a-zA-Z])[0-9a-zA-Z]*/);
  if (match) {
    return {
      type: "Number",
      original: match[0],
      value: match[0],
      pos: [position, position, position + match[0].length]
    };
  }
  match = remaining.match(/^-?(?:\d+\.\.\d+\/\d+|\d+\.\d*#\d+|\.\d*#\d+|\d+#\d+|\d+\/\d+|\d+\.\d+|\.\d+|\d+):-?(?:\d+\.\.\d+\/\d+|\d+\.\d*#\d+|\.\d*#\d+|\d+#\d+|\d+\/\d+|\d+\.\d+|\.\d+|\d+)/);
  if (match) {
    return {
      type: "Number",
      original: match[0],
      value: match[0],
      pos: [position, position, position + match[0].length]
    };
  }
  match = remaining.match(/^\d+\.~\d+(?:~\d+)*/);
  if (match) {
    return {
      type: "Number",
      original: match[0],
      value: match[0],
      pos: [position, position, position + match[0].length]
    };
  }
  match = remaining.match(/^-?(?:\d(?:_?\d)*\.\d(?:_?\d)*#\d(?:_?\d)*|\.\d(?:_?\d)*#\d(?:_?\d)*|\d(?:_?\d)*\.\.\d(?:_?\d)*\/\d(?:_?\d)*|\d(?:_?\d)*\/\d(?:_?\d)*|\d(?:_?\d)*\.\d(?:_?\d)*|\.\d(?:_?\d)*|\d(?:_?\d)*)_\^[+-]?\d(?:_?\d)*/);
  if (match) {
    return {
      type: "Number",
      original: match[0],
      value: match[0],
      pos: [position, position, position + match[0].length]
    };
  }
  match = remaining.match(/^-?\d+\.\.\d+\/\d+/);
  if (match) {
    return {
      type: "Number",
      original: match[0],
      value: match[0],
      pos: [position, position, position + match[0].length]
    };
  }
  match = remaining.match(/^-?(?:\d+\.\d*#\d+|\.\d*#\d+)/);
  if (match) {
    return {
      type: "Number",
      original: match[0],
      value: match[0],
      pos: [position, position, position + match[0].length]
    };
  }
  match = remaining.match(/^-?\d+#\d+/);
  if (match) {
    return {
      type: "Number",
      original: match[0],
      value: match[0],
      pos: [position, position, position + match[0].length]
    };
  }
  match = remaining.match(/^-?\d+\.\d+\[[^\]]+\]/);
  if (match) {
    return {
      type: "Number",
      original: match[0],
      value: match[0],
      pos: [position, position, position + match[0].length]
    };
  }
  match = remaining.match(/^-?(?:\d+(?:\.\d+)?|\.\d+):-?(?:\d+(?:\.\d+)?|\.\d+)/);
  if (match) {
    return {
      type: "Number",
      original: match[0],
      value: match[0],
      pos: [position, position, position + match[0].length]
    };
  }
  match = remaining.match(/^-?\d+\/\d+/);
  if (match) {
    return {
      type: "Number",
      original: match[0],
      value: match[0],
      pos: [position, position, position + match[0].length]
    };
  }
  match = remaining.match(/^-?(?:\d+\.\d+|\.\d+)/);
  if (match) {
    return {
      type: "Number",
      original: match[0],
      value: match[0],
      pos: [position, position, position + match[0].length]
    };
  }
  match = remaining.match(/^-?\d+/);
  if (match) {
    return {
      type: "Number",
      original: match[0],
      value: match[0],
      pos: [position, position, position + match[0].length]
    };
  }
  return null;
}
function tryMatchSystemFunctionRef(input, position) {
  const remaining = input.slice(position);
  if (remaining.startsWith("@_") && remaining.length > 2 && identifierStart.test(remaining[2])) {
    let length = 3;
    while (length < remaining.length && identifierPart.test(remaining[length])) {
      length++;
    }
    const original = remaining.slice(0, length);
    const name = remaining.slice(2, length);
    const value = name[0].toUpperCase() + name.slice(1).toUpperCase();
    return {
      type: "Identifier",
      original,
      value,
      kind: "SystemFunction",
      pos: [position, position, position + length]
    };
  }
  return null;
}
function tryMatchIdentifier(input, position) {
  const remaining = input.slice(position);
  if (remaining[0] === "_") {
    const placeholderMatch = remaining.match(/^_+(\d+)/);
    if (placeholderMatch) {
      const original2 = placeholderMatch[0];
      const place = parseInt(placeholderMatch[1], 10);
      return {
        type: "PlaceHolder",
        original: original2,
        place,
        pos: [position, position, position + original2.length]
      };
    }
  }
  if (!identifierStart.test(remaining[0])) {
    return null;
  }
  let length = 1;
  while (length < remaining.length && identifierPart.test(remaining[length])) {
    length++;
  }
  const original = remaining.slice(0, length);
  if (original === "_") {
    return null;
  }
  let firstLetter = null;
  for (let i = 0;i < original.length; i++) {
    if (/[\p{L}]/u.test(original[i])) {
      firstLetter = original[i];
      break;
    }
  }
  const isCapital = firstLetter !== null && firstLetter.toUpperCase() === firstLetter;
  const kind = isCapital ? "System" : "User";
  const value = isCapital ? original.toUpperCase() : original.toLowerCase();
  return {
    type: "Identifier",
    original,
    value,
    kind,
    pos: [position, position, position + length]
  };
}
function normalizeIdentifierValue(original) {
  let firstLetter = null;
  for (let i = 0;i < original.length; i++) {
    if (/[\p{L}]/u.test(original[i])) {
      firstLetter = original[i];
      break;
    }
  }
  const isCapital = firstLetter !== null && firstLetter.toUpperCase() === firstLetter;
  return isCapital ? original.toUpperCase() : original.toLowerCase();
}
function tryMatchSemicolonSequence(input, position) {
  const remaining = input.slice(position);
  const match = remaining.match(/^;+/);
  if (match) {
    const sequence = match[0];
    const count = sequence.length;
    if (count > 1) {
      return {
        type: "SemicolonSequence",
        original: sequence,
        value: sequence,
        count,
        pos: [position, position, position + sequence.length]
      };
    }
  }
  return null;
}
function tryMatchBrace(input, position) {
  if (input[position] !== "{")
    return null;
  const isWhitespace = (c) => c === " " || c === "\t" || c === `
` || c === "\r" || c === undefined;
  const ch = input[position + 1];
  const makeAdvancedConstructorToken = (value, start, end, extras = {}) => ({
    type: "Symbol",
    original: input.slice(position, end),
    value,
    pos: [position, position, end],
    ...extras
  });
  if (input.slice(position + 1).startsWith("=..")) {
    const after = input[position + 4];
    if (!isWhitespace(after) && after !== "}") {
      const { line: line2, col: col2 } = posToLineCol(input, position);
      throw new Error(`Brace array alias '{=..' must be followed by a space or '}' at line ${line2}:${col2}`);
    }
    return makeAdvancedConstructorToken("{..", position, position + 4, {
      destructureAlias: true
    });
  }
  if (input.slice(position + 1).startsWith("=:")) {
    let cursor = position + 3;
    let name = "";
    while (cursor < input.length && /[0-9x]/i.test(input[cursor])) {
      name += input[cursor];
      cursor++;
    }
    if (name.length > 0 && input[cursor] === ":") {
      const after = input[cursor + 1];
      if (!isWhitespace(after) && after !== "/" && after !== "}") {
        const { line: line2, col: col2 } = posToLineCol(input, position);
        throw new Error(`Brace tensor alias '{=:${name}:' must be followed by a space, header, or '}' at line ${line2}:${col2}`);
      }
      return makeAdvancedConstructorToken("{:", position, cursor + 1, {
        containerName: name.toLowerCase(),
        destructureAlias: true
      });
    }
  }
  if (input.slice(position + 1).startsWith("..")) {
    const after = input[position + 3];
    if (!isWhitespace(after) && after !== "}") {
      const { line: line2, col: col2 } = posToLineCol(input, position);
      throw new Error(`Brace array '{..' must be followed by a space or '}' at line ${line2}:${col2}`);
    }
    return makeAdvancedConstructorToken("{..", position, position + 3);
  }
  const operatorSequences = ["&&", "||", "\\/", "/\\", "++", "<<", ">>", "+", "*"];
  for (const seq of operatorSequences) {
    if (input.slice(position + 1).startsWith(seq)) {
      const after = input[position + 1 + seq.length];
      if (!isWhitespace(after)) {
        const { line: line2, col: col2 } = posToLineCol(input, position);
        throw new Error(`Operator brace '{${seq}' must be followed by a space at line ${line2}:${col2}`);
      }
      return {
        type: "Symbol",
        original: "{" + seq,
        value: "{" + seq,
        pos: [position, position, position + 1 + seq.length]
      };
    }
  }
  const sigilChars = new Set(["@", ";", "|", ":", "=", "?", "$", "#", "^"]);
  if (sigilChars.has(ch)) {
    const sigil = ch;
    const after = input[position + 2];
    if (sigil === "#") {
      const specHeader = tryMatchSystemSpecHeader(input, position);
      if (specHeader) {
        return specHeader;
      }
    }
    if (isWhitespace(after) || after === "/") {
      return {
        type: "Symbol",
        original: "{" + sigil,
        value: "{" + sigil,
        containerName: null,
        pos: [position, position, position + 2]
      };
    }
    if (sigil === "@") {
      const loopHeader = tryMatchLoopHeader(input, position);
      if (loopHeader) {
        return loopHeader;
      }
    }
    if (after !== undefined && /[a-zA-Z0-9_]/.test(after)) {
      let nameLen = 0;
      while (position + 2 + nameLen < input.length && /[a-zA-Z0-9_]/.test(input[position + 2 + nameLen])) {
        nameLen++;
      }
      const name = input.slice(position + 2, position + 2 + nameLen);
      const closingSigilPos = position + 2 + nameLen;
      if (input[closingSigilPos] === sigil) {
        const afterName = input[closingSigilPos + 1];
        if (!isWhitespace(afterName) && afterName !== "}") {
          const { line: line4, col: col4 } = posToLineCol(input, position);
          throw new Error(`Named container '{${sigil}${name}${sigil}' must be followed by a space or '}' at line ${line4}:${col4}`);
        }
        const tokenLen = 1 + 1 + nameLen + 1;
        return {
          type: "Symbol",
          original: "{" + sigil + name + sigil,
          value: "{" + sigil,
          containerName: name.toLowerCase(),
          pos: [position, position, position + tokenLen]
        };
      }
      const { line: line3, col: col3 } = posToLineCol(input, position);
      throw new Error(`Brace sigil '{${sigil}' must be followed by a space or 'name${sigil}' (e.g. '{${sigil}myname${sigil} ...') at line ${line3}:${col3}`);
    }
    const { line: line2, col: col2 } = posToLineCol(input, position);
    throw new Error(`Brace sigil '{${sigil}' must be followed by a space or a name (e.g. '{${sigil} ...' or '{${sigil}myname${sigil} ...') at line ${line2}:${col2}`);
  }
  if (isWhitespace(ch)) {
    return {
      type: "Symbol",
      original: "{",
      value: "{",
      pos: [position, position, position + 1]
    };
  }
  if (ch === "!" || ch === "}" || ch === undefined || ch >= "0" && ch <= "9") {
    return null;
  }
  const { line, col } = posToLineCol(input, position);
  throw new Error(`'{' must be followed by a space, a sigil (@;|:=?$#^), or an operator (+, *, &&, ||, \\/, /\\, ++, <<, >>) at line ${line}:${col}`);
}
function tryMatchSystemSpecHeader(input, position) {
  const start = position + 2;
  const first = input[start];
  if (first === "}" || first === undefined || first === " " || first === "\t" || first === `
` || first === "\r") {
    return {
      type: "Symbol",
      original: "{#",
      value: "{#",
      specHeaderPresent: false,
      specInputs: [],
      specOutputs: [],
      specOutputsDeclared: false,
      pos: [position, position, position + 2]
    };
  }
  const closing = input.indexOf("#", start);
  if (closing === -1) {
    const { line, col } = posToLineCol(input, position);
    throw new Error(`System spec header must end with '#' at line ${line}:${col}`);
  }
  const after = input[closing + 1];
  if (!(after === "}" || after === undefined || after === " " || after === "\t" || after === `
` || after === "\r")) {
    const { line, col } = posToLineCol(input, position);
    throw new Error(`System spec header must be followed by a space or '}' at line ${line}:${col}`);
  }
  const rawHeader = input.slice(start, closing);
  const colonCount = (rawHeader.match(/:/g) || []).length;
  if (colonCount > 1) {
    const { line, col } = posToLineCol(input, position);
    throw new Error(`Malformed system spec header '${rawHeader}' at line ${line}:${col}`);
  }
  const parseHeaderList = (text, label) => {
    const trimmed = text.trim();
    if (!trimmed)
      return [];
    return trimmed.split(",").map((piece) => {
      const name = piece.trim();
      if (!name) {
        const { line, col } = posToLineCol(input, position);
        throw new Error(`Malformed ${label} list in system spec header at line ${line}:${col}`);
      }
      if (!/^[\p{L}_][\p{L}\p{N}_]*$/u.test(name)) {
        const { line, col } = posToLineCol(input, position);
        throw new Error(`System spec ${label} must be bare identifiers; got '${name}' at line ${line}:${col}`);
      }
      return normalizeIdentifierValue(name);
    });
  };
  const pieces = rawHeader.split(":");
  const inputs = parseHeaderList(pieces[0] ?? "", "inputs");
  const outputs = parseHeaderList(pieces[1] ?? "", "outputs");
  return {
    type: "Symbol",
    original: input.slice(position, closing + 1),
    value: "{#",
    specHeaderPresent: true,
    specHeaderRaw: rawHeader,
    specInputs: inputs,
    specOutputs: outputs,
    specOutputsDeclared: pieces.length === 2,
    pos: [position, position, closing + 1]
  };
}
function tryMatchLoopHeader(input, position) {
  const start = position + 2;
  let cursor = start;
  let containerName = null;
  let loopMax;
  let unlimited = false;
  if (input[cursor] === ":") {
    cursor++;
  } else if (/[a-zA-Z0-9_]/.test(input[cursor] || "")) {
    const nameStart = cursor;
    while (cursor < input.length && /[a-zA-Z0-9_]/.test(input[cursor])) {
      cursor++;
    }
    containerName = input.slice(nameStart, cursor).toLowerCase();
    if (input[cursor] === "@") {
      return finalizeLoopHeader(input, position, cursor + 1, {
        containerName,
        loopMax: undefined,
        unlimited: false
      });
    }
    if (input[cursor] !== ":") {
      const { line, col } = posToLineCol(input, position);
      throw new Error(`Brace sigil '{@' must be followed by a space or a valid loop header ('{@name@', '{@:max@', '{@name:max@', '{@::@', '{@name::@') at line ${line}:${col}`);
    }
    cursor++;
  } else {
    return null;
  }
  if (input[cursor] === ":") {
    unlimited = true;
    cursor++;
    if (input[cursor] !== "@") {
      const { line, col } = posToLineCol(input, position);
      throw new Error(`Unlimited loop header must end with '{@::@' or '{@name::@' at line ${line}:${col}`);
    }
    return finalizeLoopHeader(input, position, cursor + 1, {
      containerName,
      loopMax: undefined,
      unlimited
    });
  }
  const digitsStart = cursor;
  while (cursor < input.length && /[0-9]/.test(input[cursor])) {
    cursor++;
  }
  if (digitsStart === cursor) {
    const { line, col } = posToLineCol(input, position);
    throw new Error(`Loop max must be a nonnegative integer literal at line ${line}:${col}`);
  }
  if (input[cursor] !== "@") {
    const { line, col } = posToLineCol(input, position);
    throw new Error(`Loop header max must end with '@' at line ${line}:${col}`);
  }
  const rawMax = input.slice(digitsStart, cursor);
  const parsedMax = Number(rawMax);
  if (!Number.isSafeInteger(parsedMax) || parsedMax < 0) {
    const { line, col } = posToLineCol(input, position);
    throw new Error(`Invalid loop max '${rawMax}' at line ${line}:${col}`);
  }
  return finalizeLoopHeader(input, position, cursor + 1, {
    containerName,
    loopMax: parsedMax,
    unlimited: false
  });
}
function finalizeLoopHeader(input, position, end, options) {
  const after = input[end];
  if (!(after === "}" || after === undefined || after === " " || after === "\t" || after === `
` || after === "\r")) {
    const { line, col } = posToLineCol(input, position);
    throw new Error(`Loop header must be followed by a space or '}' at line ${line}:${col}`);
  }
  return {
    type: "Symbol",
    original: input.slice(position, end),
    value: "{@",
    containerName: options.containerName ?? null,
    ...options.loopMax !== undefined ? { loopMax: options.loopMax } : {},
    ...options.unlimited ? { loopUnlimited: true } : {},
    pos: [position, position, end]
  };
}
function tryMatchSymbol(input, position) {
  const remaining = input.slice(position);
  if (/^\/(?:==|:=|~=|::=|~~=)\s*\/(?=[\s}])/.test(remaining)) {
    return {
      type: "Symbol",
      original: "/",
      value: "/",
      pos: [position, position, position + 1]
    };
  }
  for (const symbol of symbols) {
    if (remaining.startsWith(symbol)) {
      return {
        type: "Symbol",
        original: symbol,
        value: symbol,
        pos: [position, position, position + symbol.length]
      };
    }
  }
  if (remaining.length > 0) {
    const char = remaining[0];
    if (!/[\w\s\p{L}\p{N}]/u.test(char)) {
      return {
        type: "Symbol",
        original: char,
        value: char,
        pos: [position, position, position + 1]
      };
    }
  }
  return null;
}
function tryMatchOuterIdentifier(input, position) {
  const remaining = input.slice(position);
  if (remaining.startsWith("@_"))
    return null;
  if (remaining.startsWith("@") && remaining.length > 1 && identifierStart.test(remaining[1])) {
    let length = 2;
    while (length < remaining.length && identifierPart.test(remaining[length])) {
      length++;
    }
    const original = remaining.slice(0, length);
    const name = remaining.slice(1, length);
    let firstLetter = null;
    for (let i = 0;i < name.length; i++) {
      if (/[\p{L}]/u.test(name[i])) {
        firstLetter = name[i];
        break;
      }
    }
    const isCapital = firstLetter !== null && firstLetter.toUpperCase() === firstLetter;
    const kind = isCapital ? "System" : "User";
    const value = isCapital ? name.toUpperCase() : name.toLowerCase();
    return {
      type: "OuterIdentifier",
      original,
      value,
      kind,
      pos: [position, position, position + length]
    };
  }
  return null;
}
function tryMatchRegexLiteral(input, position) {
  const remaining = input.slice(position);
  if (remaining.startsWith("{/\\")) {
    let i = 3;
    let inEscape2 = false;
    let foundUnescapedSlash = false;
    while (i < remaining.length && remaining[i] !== "}") {
      const ch = remaining[i];
      if (inEscape2) {
        inEscape2 = false;
      } else if (ch === "\\") {
        inEscape2 = true;
      } else if (ch === "/") {
        foundUnescapedSlash = true;
        break;
      }
      i++;
    }
    if (!foundUnescapedSlash)
      return null;
  }
  const startMatch = remaining.match(/^\{\s*\//);
  if (!startMatch)
    return null;
  const contentStart = startMatch[0].length;
  let searchPos = contentStart;
  let inEscape = false;
  let patternEnd = -1;
  while (searchPos < remaining.length) {
    const char = remaining[searchPos];
    if (inEscape) {
      inEscape = false;
    } else if (char === "\\") {
      inEscape = true;
    } else if (char === "/") {
      patternEnd = searchPos;
      break;
    }
    searchPos++;
  }
  if (patternEnd === -1) {
    const { line, col } = posToLineCol(input, position);
    throw new Error(`Unterminated regex literal at line ${line}:${col}. Expected closing '/'.`);
  }
  const pattern = remaining.slice(contentStart, patternEnd);
  searchPos = patternEnd + 1;
  let flagsStart = searchPos;
  while (searchPos < remaining.length) {
    const char = remaining[searchPos];
    if (char === "}") {
      break;
    }
    searchPos++;
  }
  if (searchPos >= remaining.length || remaining[searchPos] !== "}") {
    const { line, col } = posToLineCol(input, position);
    throw new Error(`Unterminated regex literal at line ${line}:${col}. Expected closing '}'.`);
  }
  const flagsAndModeStr = remaining.slice(flagsStart, searchPos).trim();
  let flags = "";
  let mode = "ONE";
  if (flagsAndModeStr.length > 0) {
    const lastChar = flagsAndModeStr[flagsAndModeStr.length - 1];
    let flagsStr = flagsAndModeStr;
    if (lastChar === "?") {
      mode = "TEST";
      flagsStr = flagsAndModeStr.slice(0, -1);
    } else if (lastChar === "*") {
      mode = "ALL";
      flagsStr = flagsAndModeStr.slice(0, -1);
    } else if (lastChar === ":") {
      mode = "ITER";
      flagsStr = flagsAndModeStr.slice(0, -1);
    }
    flags = flagsStr.trim();
    if (flags.length > 0 && !/^[a-zA-Z]*$/.test(flags)) {
      if (remaining.startsWith("{/\\"))
        return null;
      const { line, col } = posToLineCol(input, position);
      throw new Error(`Invalid modifier or flag in regex literal at line ${line}:${col}.`);
    }
  }
  const endPosition = searchPos + 1;
  const original = remaining.slice(0, endPosition);
  return {
    type: "RegexLiteral",
    original,
    pattern,
    flags,
    mode,
    pos: [position, position, position + original.length]
  };
}

// ../rix/src/parser/parser.js
var PRECEDENCE = {
  STATEMENT: 0,
  ASSIGNMENT: 10,
  PIPE: 20,
  ARROW: 25,
  LOGICAL_OR: 30,
  LOGICAL_AND: 40,
  CONDITION: 45,
  EQUALITY: 50,
  COMPARISON: 60,
  INTERVAL: 70,
  CONVERSION: 75,
  ADDITION: 80,
  MULTIPLICATION: 90,
  EXPONENTIATION: 100,
  UNARY: 110,
  CALCULUS: 115,
  POSTFIX: 120,
  PROPERTY: 130
};
var JUXTAPOSITION_PRECEDENCE = 95;
var IMPLICIT_APPLICATION_PRECEDENCE = 97;
var SYMBOL_TABLE = {
  ":=": {
    precedence: PRECEDENCE.ASSIGNMENT,
    associativity: "right",
    type: "infix"
  },
  ":=:": {
    precedence: PRECEDENCE.ASSIGNMENT,
    associativity: "right",
    type: "infix"
  },
  ":<:": {
    precedence: PRECEDENCE.ASSIGNMENT,
    associativity: "right",
    type: "infix"
  },
  ":>:": {
    precedence: PRECEDENCE.ASSIGNMENT,
    associativity: "right",
    type: "infix"
  },
  ":<=:": {
    precedence: PRECEDENCE.ASSIGNMENT,
    associativity: "right",
    type: "infix"
  },
  ":>=:": {
    precedence: PRECEDENCE.ASSIGNMENT,
    associativity: "right",
    type: "infix"
  },
  ":=>": {
    precedence: PRECEDENCE.ASSIGNMENT,
    associativity: "right",
    type: "infix"
  },
  "|>": { precedence: PRECEDENCE.PIPE, associativity: "left", type: "infix" },
  "||>": { precedence: PRECEDENCE.PIPE, associativity: "left", type: "infix" },
  "|>>": { precedence: PRECEDENCE.PIPE, associativity: "left", type: "infix" },
  "|:>": { precedence: PRECEDENCE.PIPE, associativity: "left", type: "infix" },
  "|>:": { precedence: PRECEDENCE.PIPE, associativity: "left", type: "infix" },
  "|>?": { precedence: PRECEDENCE.PIPE, associativity: "left", type: "infix" },
  "|>&&": { precedence: PRECEDENCE.PIPE, associativity: "left", type: "infix" },
  "|>||": { precedence: PRECEDENCE.PIPE, associativity: "left", type: "infix" },
  "|><": { precedence: PRECEDENCE.PIPE, associativity: "left", type: "infix" },
  "|>/|": { precedence: PRECEDENCE.PIPE, associativity: "left", type: "infix" },
  "|>#|": { precedence: PRECEDENCE.PIPE, associativity: "left", type: "infix" },
  "|>//": { precedence: PRECEDENCE.PIPE, associativity: "left", type: "infix" },
  "|>/": { precedence: PRECEDENCE.PIPE, associativity: "left", type: "infix" },
  "|<>": { precedence: PRECEDENCE.PIPE, associativity: "left", type: "infix" },
  "|+": { precedence: PRECEDENCE.PIPE, associativity: "left", type: "infix" },
  "|*": { precedence: PRECEDENCE.PIPE, associativity: "left", type: "infix" },
  "|:": { precedence: PRECEDENCE.PIPE, associativity: "left", type: "infix" },
  "|;": { precedence: PRECEDENCE.PIPE, associativity: "left", type: "infix" },
  "|^": { precedence: PRECEDENCE.PIPE, associativity: "left", type: "infix" },
  "|^:": { precedence: PRECEDENCE.PIPE, associativity: "left", type: "infix" },
  "|?": { precedence: PRECEDENCE.PIPE, associativity: "left", type: "infix" },
  "+=": { precedence: PRECEDENCE.ASSIGNMENT, associativity: "right", type: "infix" },
  "-=": { precedence: PRECEDENCE.ASSIGNMENT, associativity: "right", type: "infix" },
  "*=": { precedence: PRECEDENCE.ASSIGNMENT, associativity: "right", type: "infix" },
  "++=": { precedence: PRECEDENCE.ASSIGNMENT, associativity: "right", type: "infix" },
  "/=": { precedence: PRECEDENCE.ASSIGNMENT, associativity: "right", type: "infix" },
  "//=": { precedence: PRECEDENCE.ASSIGNMENT, associativity: "right", type: "infix" },
  "/\\=": { precedence: PRECEDENCE.ASSIGNMENT, associativity: "right", type: "infix" },
  "/^=": { precedence: PRECEDENCE.ASSIGNMENT, associativity: "right", type: "infix" },
  "/~=": { precedence: PRECEDENCE.ASSIGNMENT, associativity: "right", type: "infix" },
  "%=": { precedence: PRECEDENCE.ASSIGNMENT, associativity: "right", type: "infix" },
  "^=": { precedence: PRECEDENCE.ASSIGNMENT, associativity: "right", type: "infix" },
  "**=": { precedence: PRECEDENCE.ASSIGNMENT, associativity: "right", type: "infix" },
  "\\/=": { precedence: PRECEDENCE.ASSIGNMENT, associativity: "right", type: "infix" },
  "\\=": { precedence: PRECEDENCE.ASSIGNMENT, associativity: "right", type: "infix" },
  "~=": { precedence: PRECEDENCE.ASSIGNMENT, associativity: "right", type: "infix" },
  "::=": { precedence: PRECEDENCE.ASSIGNMENT, associativity: "right", type: "infix" },
  "~~=": { precedence: PRECEDENCE.ASSIGNMENT, associativity: "right", type: "infix" },
  "=": {
    precedence: PRECEDENCE.ASSIGNMENT,
    associativity: "right",
    type: "infix"
  },
  "!=": {
    precedence: PRECEDENCE.EQUALITY,
    associativity: "left",
    type: "infix"
  },
  "==": {
    precedence: PRECEDENCE.EQUALITY,
    associativity: "left",
    type: "infix"
  },
  "===": {
    precedence: PRECEDENCE.EQUALITY,
    associativity: "left",
    type: "infix"
  },
  "?=": {
    precedence: PRECEDENCE.EQUALITY,
    associativity: "right",
    type: "infix"
  },
  "<": {
    precedence: PRECEDENCE.COMPARISON,
    associativity: "left",
    type: "infix"
  },
  ">": {
    precedence: PRECEDENCE.COMPARISON,
    associativity: "left",
    type: "infix"
  },
  "<=": {
    precedence: PRECEDENCE.COMPARISON,
    associativity: "left",
    type: "infix"
  },
  ">=": {
    precedence: PRECEDENCE.COMPARISON,
    associativity: "left",
    type: "infix"
  },
  "?&": {
    precedence: PRECEDENCE.COMPARISON,
    associativity: "left",
    type: "infix"
  },
  "!?": {
    precedence: PRECEDENCE.COMPARISON,
    associativity: "left",
    type: "infix"
  },
  "&&": {
    precedence: PRECEDENCE.LOGICAL_AND,
    associativity: "left",
    type: "infix"
  },
  "||": {
    precedence: PRECEDENCE.LOGICAL_OR,
    associativity: "left",
    type: "infix"
  },
  "?|": {
    precedence: PRECEDENCE.LOGICAL_OR,
    associativity: "left",
    type: "infix"
  },
  ":": {
    precedence: PRECEDENCE.INTERVAL,
    associativity: "left",
    type: "infix"
  },
  ":+": {
    precedence: PRECEDENCE.INTERVAL,
    associativity: "left",
    type: "infix"
  },
  "::": {
    precedence: PRECEDENCE.INTERVAL,
    associativity: "left",
    type: "infix"
  },
  ":/:": {
    precedence: PRECEDENCE.INTERVAL,
    associativity: "left",
    type: "infix"
  },
  ":~": {
    precedence: PRECEDENCE.INTERVAL,
    associativity: "left",
    type: "infix"
  },
  ":~/": {
    precedence: PRECEDENCE.INTERVAL,
    associativity: "left",
    type: "infix"
  },
  ":%": {
    precedence: PRECEDENCE.INTERVAL,
    associativity: "left",
    type: "infix"
  },
  ":/%": {
    precedence: PRECEDENCE.INTERVAL,
    associativity: "left",
    type: "infix"
  },
  "::+": {
    precedence: PRECEDENCE.INTERVAL,
    associativity: "left",
    type: "infix"
  },
  "+": {
    precedence: PRECEDENCE.ADDITION,
    associativity: "left",
    type: "infix",
    prefix: true
  },
  "@@": {
    precedence: PRECEDENCE.UNARY,
    associativity: "right",
    type: "prefix"
  },
  "-": {
    precedence: PRECEDENCE.ADDITION,
    associativity: "left",
    type: "infix",
    prefix: true
  },
  "\\": {
    precedence: PRECEDENCE.ADDITION,
    associativity: "left",
    type: "infix"
  },
  "\\/": {
    precedence: PRECEDENCE.ADDITION,
    associativity: "left",
    type: "infix"
  },
  "++": {
    precedence: PRECEDENCE.ADDITION,
    associativity: "left",
    type: "infix"
  },
  "<>": {
    precedence: PRECEDENCE.ADDITION,
    associativity: "left",
    type: "infix"
  },
  "_>": {
    precedence: PRECEDENCE.CONVERSION,
    associativity: "left",
    type: "infix"
  },
  "<_": {
    precedence: PRECEDENCE.CONVERSION,
    associativity: "left",
    type: "infix"
  },
  "~:": {
    precedence: PRECEDENCE.CONVERSION,
    associativity: "left",
    type: "infix"
  },
  "~!:": {
    precedence: PRECEDENCE.CONVERSION,
    associativity: "left",
    type: "infix"
  },
  "*": {
    precedence: PRECEDENCE.MULTIPLICATION,
    associativity: "left",
    type: "infix"
  },
  "/": {
    precedence: PRECEDENCE.MULTIPLICATION,
    associativity: "left",
    type: "infix"
  },
  "//": {
    precedence: PRECEDENCE.MULTIPLICATION,
    associativity: "left",
    type: "infix"
  },
  "%": {
    precedence: PRECEDENCE.MULTIPLICATION,
    associativity: "left",
    type: "infix"
  },
  "/\\": {
    precedence: PRECEDENCE.MULTIPLICATION,
    associativity: "left",
    type: "infix"
  },
  "**": {
    precedence: PRECEDENCE.MULTIPLICATION,
    associativity: "left",
    type: "infix"
  },
  "/^": {
    precedence: PRECEDENCE.MULTIPLICATION,
    associativity: "left",
    type: "infix"
  },
  "/~": {
    precedence: PRECEDENCE.MULTIPLICATION,
    associativity: "left",
    type: "infix"
  },
  "/%": {
    precedence: PRECEDENCE.MULTIPLICATION,
    associativity: "left",
    type: "infix"
  },
  "^": {
    precedence: PRECEDENCE.EXPONENTIATION,
    associativity: "right",
    type: "infix"
  },
  "->": { precedence: PRECEDENCE.ARROW, associativity: "right", type: "infix" },
  "=>": {
    precedence: PRECEDENCE.ASSIGNMENT,
    associativity: "right",
    type: "infix"
  },
  "^=>": {
    precedence: PRECEDENCE.ASSIGNMENT,
    associativity: "right",
    type: "infix"
  },
  ":->": {
    precedence: PRECEDENCE.ASSIGNMENT,
    associativity: "right",
    type: "infix"
  },
  "?-": { precedence: PRECEDENCE.ARROW, associativity: "right", type: "infix" },
  "?!-": { precedence: PRECEDENCE.ARROW, associativity: "right", type: "infix" },
  "?": {
    precedence: PRECEDENCE.CONDITION,
    associativity: "left",
    type: "infix"
  },
  "??": {
    precedence: PRECEDENCE.CONDITION,
    associativity: "right",
    type: "infix"
  },
  "?:": {
    precedence: PRECEDENCE.CONDITION,
    associativity: "right",
    type: "infix"
  },
  ".": {
    precedence: PRECEDENCE.PROPERTY,
    associativity: "left",
    type: "infix"
  },
  ".=": {
    precedence: PRECEDENCE.ASSIGNMENT,
    associativity: "right",
    type: "infix"
  },
  "@": {
    precedence: PRECEDENCE.POSTFIX,
    associativity: "left",
    type: "postfix"
  },
  "~[": {
    precedence: PRECEDENCE.POSTFIX,
    associativity: "left",
    type: "postfix"
  },
  "~{": {
    precedence: PRECEDENCE.POSTFIX,
    associativity: "left",
    type: "postfix"
  },
  "'": {
    precedence: PRECEDENCE.CALCULUS,
    associativity: "left",
    type: "calculus"
  },
  "(": { precedence: 0, type: "grouping" },
  ")": { precedence: 0, type: "grouping" },
  "[": { precedence: PRECEDENCE.POSTFIX, type: "postfix" },
  "^^": { precedence: PRECEDENCE.POSTFIX, type: "postfix" },
  "]": { precedence: 0, type: "grouping" },
  "{": { precedence: 0, type: "grouping" },
  "}": { precedence: 0, type: "grouping" },
  "{=": { precedence: 0, type: "brace_sigil" },
  "{?": { precedence: 0, type: "brace_sigil" },
  "{;": { precedence: 0, type: "brace_sigil" },
  "{|": { precedence: 0, type: "brace_sigil" },
  "{:": { precedence: 0, type: "brace_sigil" },
  "{..": { precedence: 0, type: "brace_sigil" },
  "{@": { precedence: 0, type: "brace_sigil" },
  "{#": { precedence: 0, type: "brace_sigil" },
  "{$": { precedence: 0, type: "brace_sigil" },
  "{^": { precedence: 0, type: "brace_sigil" },
  "{!": { precedence: 0, type: "brace_sigil" },
  "..": { precedence: PRECEDENCE.PROPERTY, associativity: "left", type: "infix" },
  ".|": { precedence: PRECEDENCE.PROPERTY, associativity: "left", type: "postfix" },
  "|.": { precedence: PRECEDENCE.PROPERTY, associativity: "left", type: "postfix" },
  ",": { precedence: 5, associativity: "left", type: "infix" },
  ";": {
    precedence: PRECEDENCE.STATEMENT,
    associativity: "left"
  },
  "|": { precedence: 0, type: "separator" },
  "|}": { precedence: 0, type: "separator" }
};

class Parser {
  constructor(tokens, systemLookup, source = "") {
    this.tokens = tokens;
    this.systemLookup = systemLookup || (() => ({ type: "identifier" }));
    this.source = source;
    this.position = 0;
    this.current = null;
    this.skippedComments = [];
    this.advance();
  }
  advance() {
    do {
      if (this.position < this.tokens.length) {
        this.current = this.tokens[this.position];
        this.position++;
      } else {
        this.current = {
          type: "End",
          value: null,
          pos: [this.tokens.length, this.tokens.length, this.tokens.length]
        };
        break;
      }
      if (this.current.type === "String" && this.current.kind === "comment") {
        this.skippedComments.push(this.current);
      }
    } while (this.current.type === "String" && this.current.kind === "comment");
    return this.current;
  }
  peek() {
    let tempPos = this.position;
    while (tempPos < this.tokens.length) {
      const token = this.tokens[tempPos];
      if (token.type === "String" && token.kind === "comment") {
        tempPos++;
        continue;
      }
      return token;
    }
    return { type: "End", value: null };
  }
  createNode(type, properties = {}) {
    const node = {
      type,
      pos: properties.pos || this.current.pos,
      original: properties.original || this.current.original,
      ...properties
    };
    return node;
  }
  error(message) {
    const pos = this.current ? this.current.pos : [0, 0, 0];
    if (this.source) {
      const { line, col } = posToLineCol(this.source, pos[0]);
      throw new Error(`Parse error at line ${line}, column ${col} (position ${pos[0]}): ${message}`);
    }
    throw new Error(`Parse error at position ${pos[0]}: ${message}`);
  }
  getSymbolInfo(token) {
    if (token.type === "Symbol") {
      return SYMBOL_TABLE[token.value] || { precedence: 0, type: "unknown" };
    } else if (token.type === "SemicolonSequence") {
      return { precedence: 0, type: "separator" };
    } else if (token.type === "Identifier" && token.kind === "System") {
      const systemInfo = this.systemLookup(token.value);
      if (systemInfo.type === "operator") {
        return {
          precedence: systemInfo.precedence || PRECEDENCE.MULTIPLICATION,
          associativity: systemInfo.associativity || "left",
          type: systemInfo.operatorType || "infix"
        };
      }
    }
    return null;
  }
  isCallableNode(node) {
    if (node.type === "SystemIdentifier") {
      const info = node.systemInfo;
      if (!info)
        return true;
      if (info.type === "operator" || info.type === "constant")
        return false;
      return true;
    }
    if (node.type === "SystemFunctionRef")
      return true;
    if (node.type === "FunctionLambda")
      return true;
    if (node.type === "ImplicitApplication")
      return true;
    if (node.type === "FunctionCall")
      return true;
    if (node.type === "SystemAccess")
      return true;
    if (node.type === "SystemCall")
      return true;
    if (node.type === "Call")
      return true;
    if (node.type === "MethodCall")
      return true;
    if (node.type === "Grouping" && node.expression)
      return this.isCallableNode(node.expression);
    return false;
  }
  parseMethodName() {
    if (this.current.type !== "Identifier") {
      this.error("Expected property name after '.'");
    }
    const baseName = this.current.value;
    const baseOriginal = this.current.original;
    this.advance();
    if (this.current.value === "!") {
      const bangOriginal = this.current.original;
      this.advance();
      return { name: baseName + "!", original: baseOriginal + bangOriginal };
    }
    return { name: baseName, original: baseOriginal };
  }
  canStartImplicitOperand() {
    const t = this.current;
    if (t.type === "End")
      return false;
    if (t.type === "Number")
      return true;
    if (t.type === "Identifier") {
      if (t.kind === "System") {
        const info = this.systemLookup(t.value);
        if (info && info.type === "operator")
          return false;
      }
      return true;
    }
    if (t.type === "PlaceHolder")
      return true;
    if (t.type === "OuterIdentifier")
      return true;
    if (t.type === "String" && t.kind !== "comment")
      return true;
    if (t.type === "Symbol" && t.value === "(")
      return true;
    return false;
  }
  parseExpression(minPrec = 0) {
    const left = this.parsePrefix();
    return this.parseExpressionRec(left, minPrec, false);
  }
  parseCommaSequenceExpression(minPrec = 0) {
    const expressions = [this.parseExpression(minPrec)];
    while (this.current.value === ",") {
      this.advance();
      if (this.current.value === ";" || this.current.value === "}" || this.current.type === "SemicolonSequence" || this.current.type === "End") {
        break;
      }
      expressions.push(this.parseExpression(minPrec));
    }
    if (expressions.length === 1) {
      return expressions[0];
    }
    const first = expressions[0];
    const last = expressions[expressions.length - 1];
    return this.createNode("SequenceExpression", {
      expressions,
      pos: first.pos,
      original: expressions.map((expr) => expr.original || "").join(","),
      end: last.pos?.[2]
    });
  }
  parsePrefix() {
    const token = this.current;
    switch (token.type) {
      case "Number":
        this.advance();
        return this.createNode("Number", {
          value: token.value,
          original: token.original
        });
      case "String":
        this.advance();
        if (token.kind === "backtick") {
          return this.parseEmbeddedLanguage(token);
        } else {
          return this.createNode("String", {
            value: token.value,
            kind: token.kind,
            original: token.original
          });
        }
      case "RegexLiteral":
        this.advance();
        return this.createNode("RegexLiteral", {
          pattern: token.pattern,
          flags: token.flags,
          mode: token.mode,
          original: token.original
        });
      case "Identifier":
        this.advance();
        if (token.kind === "SystemFunction") {
          return this.createNode("SystemFunctionRef", {
            name: token.value,
            original: token.original
          });
        } else if (token.kind === "System") {
          const systemInfo = this.systemLookup(token.value);
          return this.createNode("SystemIdentifier", {
            name: token.value,
            systemInfo,
            original: token.original
          });
        } else {
          return this.createNode("UserIdentifier", {
            name: token.value,
            original: token.original
          });
        }
      case "OuterIdentifier":
        this.advance();
        return this.createNode("OuterIdentifier", {
          name: token.value,
          original: token.original
        });
      case "PlaceHolder":
        this.advance();
        return this.createNode("PlaceHolder", {
          place: token.place,
          original: token.original
        });
      case "Symbol":
        if (token.value === "...") {
          this.advance();
          const expr = this.parseExpression(PRECEDENCE.POSTFIX);
          return this.createNode("Spread", {
            expression: expr,
            pos: token.pos,
            original: token.original + (expr.original || "")
          });
        } else if (token.value === "(") {
          return this.parseGrouping();
        } else if (token.value === "[") {
          return this.parseArray();
        } else if (token.value === "<") {
          return this.parseAngleForm();
        } else if (token.value === "{") {
          return this.parseBraceContainer();
        } else if (token.value === "{=" || token.value === "{?" || token.value === "{;" || token.value === "{|" || token.value === "{:" || token.value === "{@" || token.value === "{#" || token.value === "{.." || token.value === "{^" || token.value === "{$") {
          if (token.value === "{#") {
            return this.parseSystemSpecLiteral();
          }
          if (token.value === "{^") {
            return this.parseValueOutfit();
          }
          return this.parseBraceSigil(token.value, token.containerName ?? null, {
            loopMax: token.loopMax,
            loopUnlimited: token.loopUnlimited === true,
            destructureAlias: token.destructureAlias === true
          });
        } else if (token.value === "{+" || token.value === "{*" || token.value === "{&&" || token.value === "{||" || token.value === "{\\/" || token.value === "{/\\" || token.value === "{++" || token.value === "{<<" || token.value === "{>>") {
          return this.parseOperatorBrace(token.value);
        } else if (token.value === "{!") {
          return this.parseBreakBlock();
        } else if (token.value === "@@") {
          this.advance();
          const expr = this.parseExpression(PRECEDENCE.UNARY);
          return this.createNode("SystemCapabilityCall", {
            property: "EVAL",
            arguments: { positional: [expr], keyword: {}, metadata: {} },
            pos: token.pos,
            original: token.original + (expr.original || "")
          });
        } else if (token.value === "@") {
          this.advance();
          const nextVal = this.current.value;
          if (nextVal === "{" || nextVal === "{;" || nextVal === "{?" || nextVal === "{=" || nextVal === "{|" || nextVal === "{:" || nextVal === "{@" || nextVal === "{#" || nextVal === "{$" || nextVal === "{.." || nextVal === "{^") {
            let inner;
            if (nextVal === "{") {
              inner = this.parseBraceContainer();
            } else if (nextVal === "{#") {
              inner = this.parseSystemSpecLiteral();
            } else if (nextVal === "{^") {
              inner = this.parseValueOutfit();
            } else {
              inner = this.parseBraceSigil(nextVal, this.current.containerName ?? null, {
                loopMax: this.current.loopMax,
                loopUnlimited: this.current.loopUnlimited === true,
                destructureAlias: this.current.destructureAlias === true
              });
            }
            return this.createNode("DeferredBlock", {
              body: inner,
              pos: token.pos,
              original: token.original
            });
          }
          const operatorToSystem = {
            "+": "ADD",
            "-": "SUB",
            "*": "MUL",
            "/": "DIV",
            "//": "INTDIV",
            "%": "MOD",
            "^": "POW",
            "**": "POWPROD",
            "=": "EQ",
            "!=": "NEQ",
            "<": "LT",
            ">": "GT",
            "<=": "LTE",
            ">=": "GTE",
            "&&": "AND",
            "||": "OR",
            "!": "NOT"
          };
          if (operatorToSystem[nextVal]) {
            const opToken = this.current;
            this.advance();
            const sysName = operatorToSystem[nextVal];
            return this.createNode("SystemAccess", {
              property: sysName,
              original: token.original + opToken.original
            });
          }
          return this.createNode("UserIdentifier", {
            name: "@",
            original: token.original
          });
        } else if (token.value === "+" || token.value === "-" || token.value === "!") {
          return this.parseUnaryOperator();
        } else if (token.value === "'") {
          return this.parseIntegral();
        } else if (token.value === ".") {
          this.advance();
          if (this.current.type === "Identifier") {
            const property = this.parseMethodName();
            return this.createNode("SystemAccess", {
              property: property.name,
              original: token.original + property.original
            });
          }
          return this.createNode("SystemObject", {
            original: token.original
          });
        } else if (token.value === "_") {
          this.advance();
          return this.createNode("NULL", {
            original: token.original
          });
        } else if (token.value === "$$") {
          this.advance();
          return this.createNode("ParentSelfRef", {
            original: token.original
          });
        } else if (token.value === "$") {
          this.advance();
          return this.createNode("SelfRef", {
            original: token.original
          });
        } else if (token.value === ":") {
          this.advance();
          if (this.current.type === "Identifier" || this.current.type === "Number") {
            const valToken = this.current;
            const rawText = valToken.original.trim();
            this.advance();
            return this.createNode("String", {
              value: rawText,
              kind: "colon",
              original: token.original + valToken.original
            });
          }
          this.error(`Expected identifier or number after ':' in colon-string`);
        } else {
          this.error(`Unexpected token in prefix position: ${token.value}`);
        }
        break;
      default:
        this.error(`Unexpected token: ${token.type}`);
    }
  }
  parseInfix(left, symbolInfo) {
    const operator = this.current;
    if (operator.value === "(" && (left.type === "UserIdentifier" || left.type === "SystemIdentifier" || left.type === "SystemFunctionRef")) {
      if (left.type === "UserIdentifier" && /^[\p{L}]/u.test(left.name)) {
        const grouping = this.parseGrouping();
        return this.createNode("ImplicitMultiplication", {
          left,
          right: grouping,
          pos: left.pos,
          original: left.original + operator.original
        });
      }
      this.advance();
      const args = this.parseFunctionCallArgs();
      if (this.current.value !== ")") {
        this.error("Expected closing parenthesis in function call");
      }
      this.advance();
      if (left.type === "SystemFunctionRef") {
        return this.createNode("SystemCall", {
          name: left.name,
          arguments: args,
          pos: left.pos,
          original: left.original + operator.original
        });
      }
      return this.createNode("FunctionCall", {
        function: left,
        arguments: args,
        pos: left.pos,
        original: left.original + operator.original
      });
    }
    if (operator.value === "?-" || operator.value === "?!-") {
      this.advance();
      const prep = this.current.value === "[" ? this.parseArray() : this.parseExpression(PRECEDENCE.ARROW + 1);
      if (!prep || prep.type !== "Array") {
        this.error("Function prep phase must be written as an array literal: ?- [ ... ]");
      }
      let variantName = null;
      if (this.current.value === "/") {
        variantName = this.parseFunctionVariantHeader();
      }
      if (!["->", "=>", "^=>"].includes(this.current.value)) {
        this.error("Expected '->', '=>', or '^=>' after function prep phase");
      }
      const arrow = this.current.value;
      this.advance();
      const body = this.parseExpression(PRECEDENCE.ARROW);
      const prepStrict = operator.value === "?!-";
      const fnNode = this.buildFunctionArrowNode(left, arrow, body, {
        prep,
        prepStrict,
        variantName
      });
      if (fnNode) {
        return fnNode;
      }
      this.error("Prep phase can only be attached to a function definition or lambda");
    }
    if (operator.value === "/" && this.looksLikeFunctionVariantHeader() && this.canHaveFunctionVariantHeader(left)) {
      const variantName = this.parseFunctionVariantHeader();
      if (!["->", "=>", "^=>"].includes(this.current.value)) {
        this.error("Expected '->', '=>', or '^=>' after function variant name");
      }
      const arrow = this.current.value;
      this.advance();
      const body = this.parseExpression(PRECEDENCE.ARROW);
      const fnNode = this.buildFunctionArrowNode(left, arrow, body, { variantName });
      if (fnNode) {
        return fnNode;
      }
      this.error("Variant names can only be attached to a function definition or lambda");
    }
    this.advance();
    let rightPrec = symbolInfo.precedence;
    if (symbolInfo.associativity === "left") {
      rightPrec += 1;
    }
    let right;
    if (operator.value === "[" && symbolInfo.type === "postfix") {
      if (this.current.value === ":" && ["Identifier", "Number", "String"].includes(this.peek().type)) {
        this.advance();
        const keyName = this.current.value;
        const keyOriginal = this.current.original;
        this.advance();
        if (this.current.value !== "]") {
          this.error("Expected ] after key literal");
        }
        this.advance();
        return this.createNode("PropertyAccess", {
          object: left,
          property: { type: "KeyLiteral", name: keyName, original: ":" + keyOriginal },
          pos: left.pos,
          original: left.original + operator.original
        });
      }
      return this.parseBracketIndex(left, operator);
    } else if (operator.value === "^^" && symbolInfo.type === "postfix") {
      return this.createNode("Transpose", {
        expression: left,
        pos: left.pos,
        original: left.original + operator.original
      });
    } else if (operator.value === ":->" || operator.value === "->" || operator.value === "=>" || operator.value === "^=>") {
      right = this.parseExpression(rightPrec);
      const fnNode = this.buildFunctionArrowNode(left, operator.value, right);
      if (fnNode) {
        return fnNode;
      }
      if (operator.value === "=>" || operator.value === "^=>") {
        this.error("Append/prepend syntax requires a named function signature like F(x) => body");
      }
    } else if (operator.value === ":=>") {
      right = this.parseExpression(rightPrec);
      let funcName = left;
      let parameters = {
        positional: [],
        keyword: [],
        conditionals: [],
        metadata: {}
      };
      let patterns = [];
      let globalMetadata = {};
      if (left.type === "FunctionCall") {
        funcName = left.function;
        parameters = this.convertArgsToParams(left.arguments);
      }
      let rawPatterns = [];
      if (right.type === "Array") {
        rawPatterns = right.elements;
      } else if (right.type === "WithMetadata" && right.primary && right.primary.type === "Array") {
        if (Array.isArray(right.primary.elements) && right.primary.elements.length > 0 && right.primary.elements[0].type === "Array") {
          rawPatterns = right.primary.elements[0].elements;
        } else {
          rawPatterns = right.primary.elements;
        }
        globalMetadata = right.metadata;
      } else {
        rawPatterns = [right];
      }
      for (const pattern of rawPatterns) {
        if (pattern.type === "FunctionLambda") {
          const patternFunc = {
            parameters: pattern.parameters,
            body: pattern.body
          };
          patterns.push(patternFunc);
        } else if (pattern.type === "BinaryOperation" && pattern.operator === "->") {
          const patternFunc = {
            parameters: {
              positional: [],
              keyword: [],
              conditionals: [],
              metadata: {}
            },
            body: pattern.right
          };
          if (pattern.left.type === "Grouping") {
            const paramExpr = pattern.left.expression;
            if (paramExpr.type === "BinaryOperation" && paramExpr.operator === "?") {
              const paramName = paramExpr.left.name || paramExpr.left.value;
              patternFunc.parameters.positional.push({
                name: paramName,
                defaultValue: null
              });
              patternFunc.parameters.conditionals.push(paramExpr.right);
            } else if (paramExpr.type === "UserIdentifier") {
              patternFunc.parameters.positional.push({
                name: paramExpr.name || paramExpr.value,
                defaultValue: null
              });
            }
          }
          patterns.push(patternFunc);
        }
      }
      return this.createNode("PatternMatchingFunction", {
        name: funcName,
        parameters,
        patterns,
        metadata: globalMetadata,
        pos: left.pos,
        original: left.original + operator.original
      });
    } else if (operator.value === "->") {
      right = this.parseExpression(rightPrec);
      if (left.type === "Grouping" && left.expression && left.expression.type === "ParameterList") {
        return this.createNode("FunctionLambda", {
          parameters: left.expression.parameters,
          prep: null,
          prepStrict: false,
          body: right,
          pos: left.pos,
          original: left.original + operator.original
        });
      }
      const lambdaParameters = this.extractLambdaParameters(left);
      if (lambdaParameters) {
        return this.createNode("FunctionLambda", {
          parameters: lambdaParameters,
          prep: null,
          prepStrict: false,
          body: right,
          pos: left.pos,
          original: left.original + operator.original
        });
      }
      return this.createNode("BinaryOperation", {
        operator: operator.value,
        left,
        right,
        pos: left.pos,
        original: left.original + operator.original
      });
    } else if (operator.value === "|>") {
      right = this.parseExpression(rightPrec);
      return this.createNode("Pipe", {
        left,
        right,
        pos: left.pos,
        original: left.original + operator.original
      });
    } else if (operator.value === "|>/") {
      right = this.parseExpression(rightPrec);
      return this.createNode("SliceStrict", {
        left,
        right,
        pos: left.pos,
        original: left.original + operator.original
      });
    } else if (operator.value === "|>/|") {
      right = this.parseExpression(rightPrec);
      return this.createNode("Split", {
        left,
        right,
        pos: left.pos,
        original: left.original + operator.original
      });
    } else if (operator.value === "|>#|") {
      right = this.parseExpression(rightPrec);
      return this.createNode("Chunk", {
        left,
        right,
        pos: left.pos,
        original: left.original + operator.original
      });
    } else if (operator.value === "|>//") {
      right = this.parseExpression(rightPrec);
      return this.createNode("SliceClamp", {
        left,
        right,
        pos: left.pos,
        original: left.original + operator.original
      });
    } else if (operator.value === "||>") {
      right = this.parseExpression(rightPrec);
      return this.createNode("ExplicitPipe", {
        left,
        right,
        pos: left.pos,
        original: left.original + operator.original
      });
    } else if (operator.value === "|>>") {
      right = this.parseExpression(rightPrec);
      return this.createNode("Map", {
        left,
        right,
        pos: left.pos,
        original: left.original + operator.original
      });
    } else if (operator.value === "|>?") {
      right = this.parseExpression(rightPrec);
      return this.createNode("Filter", {
        left,
        right,
        pos: left.pos,
        original: left.original + operator.original
      });
    } else if (operator.value === "|>&&") {
      right = this.parseExpression(rightPrec);
      return this.createNode("Every", {
        left,
        right,
        pos: left.pos,
        original: left.original + operator.original
      });
    } else if (operator.value === "|>||") {
      right = this.parseExpression(rightPrec);
      return this.createNode("Some", {
        left,
        right,
        pos: left.pos,
        original: left.original + operator.original
      });
    } else if (operator.value === "|:>") {
      const startValue = this.parseExpression(rightPrec);
      const nextOp = this.current;
      if (nextOp.type !== "Symbol" || nextOp.value !== ">:") {
        this.error("Expected '>:' after start value in '|:>' reduce expression, found " + nextOp.value);
      } else {
        this.advance();
      }
      const fnExpr = this.parseExpression(rightPrec);
      return this.createNode("Reduce", {
        left,
        init: startValue,
        right: fnExpr,
        pos: left.pos,
        original: left.original + operator.original + startValue.original + (nextOp.value === ">:" ? nextOp.original : "") + fnExpr.original
      });
    } else if (operator.value === "|>:") {
      right = this.parseExpression(rightPrec);
      return this.createNode("Reduce", {
        left,
        right,
        pos: left.pos,
        original: left.original + operator.original
      });
    } else if (operator.value === "|><") {
      return this.createNode("Reverse", {
        target: left,
        pos: left.pos,
        original: left.original + operator.original
      });
    } else if (operator.value === "|<>") {
      right = this.parseExpression(rightPrec);
      return this.createNode("Sort", {
        left,
        right,
        pos: left.pos,
        original: left.original + operator.original
      });
    } else if (operator.value === ":+") {
      right = this.parseExpression(rightPrec);
      return this.createNode("IntervalStepping", {
        interval: left,
        step: right,
        pos: left.pos,
        original: left.original + operator.original
      });
    } else if (operator.value === "::") {
      right = this.parseExpression(rightPrec);
      return this.createNode("IntervalDivision", {
        interval: left,
        count: right,
        type: "equally_spaced",
        pos: left.pos,
        original: left.original + operator.original
      });
    } else if (operator.value === ":/:") {
      right = this.parseExpression(rightPrec);
      return this.createNode("IntervalPartition", {
        interval: left,
        count: right,
        pos: left.pos,
        original: left.original + operator.original
      });
    } else if (operator.value === ":~") {
      right = this.parseExpression(rightPrec);
      if (right?.type === "String" && right.kind === "colon") {
        this.error("':~' is the interval mediants operator. For semantic conversion, use '~:' as in 'x ~: :Type'.");
      }
      return this.createNode("IntervalMediants", {
        interval: left,
        levels: right,
        pos: left.pos,
        original: left.original + operator.original
      });
    } else if (operator.value === ":~/") {
      right = this.parseExpression(rightPrec);
      if (right?.type === "String" && right.kind === "colon") {
        this.error("':~/' is the interval mediant partition operator. For semantic conversion, use '~:' as in 'x ~: :Type'.");
      }
      return this.createNode("IntervalMediantPartition", {
        interval: left,
        levels: right,
        pos: left.pos,
        original: left.original + operator.original
      });
    } else if (operator.value === ":%") {
      right = this.parseExpression(rightPrec);
      return this.createNode("IntervalRandom", {
        interval: left,
        parameters: right,
        pos: left.pos,
        original: left.original + operator.original
      });
    } else if (operator.value === ":/%") {
      right = this.parseExpression(rightPrec);
      return this.createNode("IntervalRandomPartition", {
        interval: left,
        count: right,
        pos: left.pos,
        original: left.original + operator.original
      });
    } else if (operator.value === "::+") {
      right = this.parseExpression(rightPrec);
      return this.createNode("InfiniteSequence", {
        start: left,
        step: right,
        pos: left.pos,
        original: left.original + operator.original
      });
    } else if (operator.value === "??") {
      const trueExpr = this.parseExpression(PRECEDENCE.CONDITION + 5);
      if (this.current.value !== "?:") {
        this.error('Expected "?:" in ternary operator after true expression');
      }
      this.advance();
      const falseExpr = this.parseExpression(rightPrec);
      return this.createNode("TernaryOperation", {
        condition: left,
        trueExpression: trueExpr,
        falseExpression: falseExpr,
        pos: left.pos,
        original: left.original + operator.original
      });
    } else if (operator.value === ".") {
      const property = this.parseMethodName();
      return this.createNode("DotAccess", {
        object: left,
        property: property.name,
        pos: left.pos,
        original: left.original + operator.original + property.original
      });
    } else if (operator.value === "..") {
      if (this.current.type === "Identifier") {
        this.error("a..name is no longer supported; use a.name for meta property access");
      }
      return this.createNode("ExternalAccess", {
        object: left,
        property: null,
        pos: left.pos,
        original: left.original + operator.original
      });
    } else if (operator.value === ".|") {
      return this.createNode("KeySet", {
        object: left,
        pos: left.pos,
        original: left.original + operator.original
      });
    } else if (operator.value === "|.") {
      return this.createNode("ValueSet", {
        object: left,
        pos: left.pos,
        original: left.original + operator.original
      });
    } else if (operator.value === "?") {
      right = this.parseExpression(rightPrec);
      if (right?.type === "String" && right.kind === "colon") {
        return this.createNode("SemanticHas", {
          expression: left,
          name: right.value,
          pos: left.pos,
          original: left.original + operator.original + right.original
        });
      }
      return this.createNode("BinaryOperation", {
        operator: operator.value,
        left,
        right,
        pos: left.pos,
        original: left.original + operator.original
      });
    } else if (operator.value === "~:" || operator.value === "~!:") {
      right = this.parseExpression(rightPrec);
      if (!(right?.type === "String" && right.kind === "colon")) {
        this.error(`Semantic conversion target must be a colon-string like :rational after '${operator.value}'`);
      }
      return this.createNode(operator.value === "~:" ? "SemanticConvertSoft" : "SemanticConvertStrict", {
        expression: left,
        typeName: right.value,
        pos: left.pos,
        original: left.original + operator.original + right.original
      });
    } else {
      right = this.parseExpression(rightPrec);
      let assignmentLeft = left;
      if (this.isDirectAssignmentOperator(operator.value)) {
        const simpleLValueTypes = new Set([
          "UserIdentifier",
          "SystemIdentifier",
          "OuterIdentifier",
          "SystemAccess",
          "DotAccess",
          "PropertyAccess",
          "BracketIndex",
          "SelfRef",
          "Number"
        ]);
        if (!simpleLValueTypes.has(left?.type)) {
          try {
            assignmentLeft = this.convertExpressionToDestructureTarget(left);
          } catch (_error) {
            assignmentLeft = left;
          }
        }
      }
      return this.createNode("BinaryOperation", {
        operator: operator.value,
        left: assignmentLeft,
        right,
        pos: left.pos,
        original: left.original + operator.original
      });
    }
  }
  parseGrouping() {
    const startToken = this.current;
    this.advance();
    if (this.current.value === ")") {
      this.advance();
      return this.createNode("Tuple", {
        elements: [],
        pos: startToken.pos,
        original: startToken.original
      });
    }
    let hasSemicolon = false;
    let hasComma = false;
    let tempPos = this.position - 1;
    let parenDepth = 0;
    let braceDepth = 0;
    let bracketDepth = 0;
    while (tempPos < this.tokens.length) {
      const token = this.tokens[tempPos];
      if (token.value === "(")
        parenDepth++;
      else if (token.value === ")") {
        if (parenDepth === 0)
          break;
        parenDepth--;
      } else if (typeof token.value === "string" && token.value.startsWith("{"))
        braceDepth++;
      else if (token.value === "}")
        braceDepth--;
      else if (token.value === "[")
        bracketDepth++;
      else if (token.value === "]")
        bracketDepth--;
      else if (parenDepth === 0 && braceDepth <= 0 && bracketDepth <= 0) {
        if (token.value === ";") {
          hasSemicolon = true;
          break;
        } else if (token.value === ",") {
          hasComma = true;
        }
      }
      tempPos++;
    }
    let result;
    if (hasSemicolon) {
      const params = this.parseFunctionParameters();
      result = this.createNode("Grouping", {
        expression: this.createNode("ParameterList", {
          parameters: params,
          pos: startToken.pos,
          original: startToken.original
        }),
        pos: startToken.pos,
        original: startToken.original
      });
    } else if (hasComma) {
      const elements = this.parseTupleElements();
      result = this.createNode("Tuple", {
        elements,
        pos: startToken.pos,
        original: startToken.original
      });
    } else {
      const expr = this.parseExpression(0);
      result = this.createNode("Grouping", {
        expression: expr,
        pos: startToken.pos,
        original: startToken.original
      });
    }
    if (this.current.value !== ")") {
      this.error("Expected closing parenthesis");
    }
    this.advance();
    return result;
  }
  parseTupleElements() {
    const elements = [];
    let firstElement = this.parseTupleElement();
    elements.push(firstElement);
    while (this.current.value === ",") {
      this.advance();
      if (this.current.value === "," || this.current.value === ")") {
        if (this.current.value === ",") {
          this.error("Consecutive commas not allowed in tuples");
        }
        break;
      }
      const element = this.parseTupleElement();
      elements.push(element);
    }
    return elements;
  }
  parseTupleElement() {
    return this.parseCapturedConstructorElement();
  }
  parseArray() {
    const startToken = this.current;
    this.advance();
    const result = this.parseMatrixOrArray(startToken);
    if (this.current.value !== "]") {
      this.error("Expected closing bracket");
    }
    this.advance();
    return result;
  }
  parseGeneratorChain() {
    let start = null;
    const operators = [];
    if (!this.isGeneratorOperator(this.current.value)) {
      const savedPos = this.pos;
      try {
        start = this.parseExpressionUntilGenerator();
      } catch (e) {
        this.pos = savedPos;
        start = null;
      }
    }
    while (this.isGeneratorOperator(this.current.value)) {
      const operator = this.current;
      this.advance();
      const operand = this.parseExpression(PRECEDENCE.PIPE + 1);
      const operatorNode = this.createGeneratorOperatorNode(operator.value, operand, operator);
      operators.push(operatorNode);
    }
    if (operators.length === 0) {
      return start;
    }
    return this.createNode("GeneratorChain", {
      start,
      operators,
      pos: start ? start.pos : operators[0].pos,
      original: start ? start.original : operators[0].original
    });
  }
  parseExpressionUntilGenerator() {
    return this.parsePrefix();
  }
  parseExpressionRec(left, minPrec, stopAtGenerators = false) {
    while (this.current.type !== "End") {
      if (this.current.value === ";" || this.current.value === "," || this.current.value === ")" || this.current.value === "]" || this.current.value === "}" || this.current.type === "SemicolonSequence") {
        break;
      }
      if (this.current.value === "(") {
        if (!this.isCallableNode(left)) {
          if (JUXTAPOSITION_PRECEDENCE < minPrec) {
            break;
          }
          left = this.parseCall(left);
          continue;
        }
        left = this.parseCall(left);
        continue;
      }
      if (this.canStartImplicitOperand()) {
        const nextSymbolInfo = this.getSymbolInfo(this.current);
        if (nextSymbolInfo && nextSymbolInfo.type === "infix") {} else {
          if (left.type === "SystemIdentifier" && left.systemInfo && left.systemInfo.type === "operator" && left.systemInfo.operatorType === "prefix") {
            const operand = this.parseExpression(PRECEDENCE.UNARY);
            left = this.createNode("UnaryOperation", {
              operator: left.name,
              operand,
              pos: left.pos,
              original: left.original + (operand.original || "")
            });
            continue;
          }
          if (this.isCallableNode(left)) {
            if (IMPLICIT_APPLICATION_PRECEDENCE < minPrec) {
              break;
            }
            const arg = this.parseExpression(PRECEDENCE.ADDITION + 1);
            left = this.createNode("ImplicitApplication", {
              callable: left,
              argument: arg,
              pos: [left.pos[0], left.pos[0], arg.pos[2]],
              original: left.original + (arg.original || "")
            });
            continue;
          }
          if (JUXTAPOSITION_PRECEDENCE < minPrec) {
            break;
          }
          const right = this.parseExpression(JUXTAPOSITION_PRECEDENCE + 1);
          left = this.createNode("ImplicitMultiplication", {
            left,
            right,
            pos: [left.pos[0], left.pos[0], right.pos[2]],
            original: left.original + (right.original || "")
          });
          continue;
        }
      }
      if (this.current.value === "@" && this.peek().value === "(") {
        left = this.parseAt(left);
        continue;
      }
      if (this.current.value === "?" && this.peek().value === "(") {
        left = this.parseAsk(left);
        continue;
      }
      if (this.current.value === "'" && (left.type === "UserIdentifier" || left.type === "SystemIdentifier" || left.type === "SystemFunctionRef" || left.type === "FunctionCall" || left.type === "ImplicitApplication" || left.type === "PropertyAccess" || left.type === "Derivative" || left.type === "Integral")) {
        left = this.parseDerivative(left);
        continue;
      }
      if (this.current.value === "~[") {
        left = this.parseScientificUnit(left);
        continue;
      }
      if (this.current.value === "~{") {
        left = this.parseMathematicalUnit(left);
        continue;
      }
      if (this.current.value === "{=" || this.current.value === "{!") {
        left = this.parseMutation(left);
        continue;
      }
      let symbolInfo = this.getSymbolInfo(this.current);
      if (symbolInfo && this.current.value === "->") {
        if (left.type === "FunctionCall" || left.type === "ImplicitMultiplication") {
          symbolInfo = { ...symbolInfo, precedence: PRECEDENCE.ASSIGNMENT };
        }
      }
      if (!symbolInfo || symbolInfo.precedence < minPrec) {
        break;
      }
      if (symbolInfo.type === "statement" || symbolInfo.type === "separator") {
        break;
      }
      if (stopAtGenerators && this.isGeneratorOperator(this.current.value)) {
        break;
      }
      left = this.parseInfix(left, symbolInfo);
    }
    return left;
  }
  isGeneratorOperator(value) {
    return ["|+", "|*", "|:", "|?", "|^", "|^:", "|;", "|>"].includes(value);
  }
  createGeneratorOperatorNode(operator, operand, token) {
    const typeMap = {
      "|+": "GeneratorAdd",
      "|*": "GeneratorMultiply",
      "|:": "GeneratorFunction",
      "|?": "GeneratorFilter",
      "|^": "GeneratorLimit",
      "|^:": "GeneratorLazyLimit",
      "|;": "GeneratorEagerLimit",
      "|>": "GeneratorPipe"
    };
    return this.createNode(typeMap[operator], {
      operator,
      operand,
      pos: token.pos,
      original: token.original
    });
  }
  convertBinaryChainToGeneratorChain(binaryOp) {
    const operators = [];
    let current = binaryOp;
    let start = null;
    while (current && current.type === "BinaryOperation" && this.isGeneratorOperator(current.operator)) {
      const operatorNode = this.createGeneratorOperatorNode(current.operator, current.right, current);
      operators.unshift(operatorNode);
      current = current.left;
    }
    if (current && current.type === "BinaryOperation" && this.isGeneratorOperator(current.operator)) {
      const nestedChain = this.convertBinaryChainToGeneratorChain(current);
      start = nestedChain.start;
      operators.unshift(...nestedChain.operators);
    } else {
      start = current;
    }
    return this.createNode("GeneratorChain", {
      start,
      operators,
      pos: binaryOp.pos,
      original: binaryOp.original
    });
  }
  parseMatrixOrArray(startToken) {
    const elements = [];
    let hasMetadata = false;
    let primaryElement = null;
    const metadataMap = {};
    let nonMetadataCount = 0;
    let hasSemicolons = false;
    let matrixStructure = [];
    let currentRow = [];
    if (this.current.value !== "]") {
      do {
        if (this.current.value === ";" || this.current.type === "SemicolonSequence") {
          hasSemicolons = true;
          const semicolonCount = this.consumeSemicolonSequence();
          matrixStructure.push({
            row: [],
            separatorLevel: semicolonCount
          });
          continue;
        }
        let element;
        if (this.current.value === "," || this.current.value === "]") {
          element = this.createNode("Hole", { original: "" });
        } else if (this.isGeneratorOperator(this.current.value)) {
          element = this.parseGeneratorChain();
        } else {
          element = this.parseCapturedConstructorElement();
          if (element.type === "BinaryOperation" && this.isGeneratorOperator(element.operator)) {
            element = this.convertBinaryChainToGeneratorChain(element);
          }
        }
        if (element.type === "BinaryOperation" && element.operator === ":=") {
          if (hasSemicolons) {
            this.error("Cannot mix matrix/tensor syntax with metadata - use nested array syntax");
          }
          hasMetadata = true;
          let key;
          if (element.left.type === "UserIdentifier") {
            key = element.left.name;
          } else if (element.left.type === "SystemIdentifier") {
            key = element.left.name;
          } else if (element.left.type === "String") {
            key = element.left.value;
          } else {
            this.error("Metadata key must be an identifier or string");
          }
          metadataMap[key] = element.right;
        } else {
          nonMetadataCount++;
          if (hasMetadata) {
            this.error("Cannot mix array elements with metadata - use nested array syntax like [[1,2,3], key := value]");
          }
          if (nonMetadataCount === 1) {
            primaryElement = element;
          }
          elements.push(element);
          currentRow.push(element);
        }
        if (this.current.value === ",") {
          this.advance();
          if (this.current.value === "]") {
            const trailingHole = this.createNode("Hole", { original: "" });
            elements.push(trailingHole);
            currentRow.push(trailingHole);
            nonMetadataCount++;
          }
        } else if (this.current.value === ";" || this.current.type === "SemicolonSequence") {
          if (hasMetadata) {
            this.error("Cannot mix matrix/tensor syntax with metadata");
          }
          hasSemicolons = true;
          const semicolonCount = this.consumeSemicolonSequence();
          matrixStructure.push({
            row: [...currentRow],
            separatorLevel: semicolonCount
          });
          currentRow = [];
        } else {
          break;
        }
      } while (this.current.value !== "]" && this.current.type !== "End");
    }
    if (currentRow.length > 0 || hasSemicolons) {
      matrixStructure.push({
        row: currentRow,
        separatorLevel: 0
      });
    }
    if (hasMetadata && nonMetadataCount > 1) {
      this.error("Cannot mix array elements with metadata - use nested array syntax like [[1,2,3], key := value]");
    }
    if (hasMetadata) {
      return this.createNode("WithMetadata", {
        primary: primaryElement || this.createNode("Array", {
          elements: [],
          pos: startToken.pos,
          original: startToken.original
        }),
        metadata: metadataMap,
        pos: startToken.pos,
        original: startToken.original
      });
    }
    if (hasSemicolons) {
      return this.buildMatrixTensor(matrixStructure, startToken);
    }
    return this.createNode("Array", {
      elements,
      pos: startToken.pos,
      original: startToken.original
    });
  }
  buildMatrixTensor(matrixStructure, startToken) {
    const maxSeparatorLevel = Math.max(...matrixStructure.map((item) => item.separatorLevel));
    if (maxSeparatorLevel === 1) {
      const rows = [];
      for (const item of matrixStructure) {
        rows.push(item.row);
      }
      return this.createNode("Matrix", {
        rows,
        pos: startToken.pos,
        original: startToken.original
      });
    } else {
      return this.createNode("Tensor", {
        structure: matrixStructure,
        maxDimension: maxSeparatorLevel + 1,
        pos: startToken.pos,
        original: startToken.original
      });
    }
  }
  isDirectAssignmentOperator(value) {
    return value === "=" || value === ":=" || value === "~=" || value === "::=" || value === "~~=";
  }
  createDestructureTargetNode(type, props, sourceNode = null) {
    return this.createNode(type, {
      ...props,
      ...sourceNode?.pos ? { pos: sourceNode.pos } : {},
      ...sourceNode?.original ? { original: sourceNode.original } : {}
    });
  }
  wrapDestructureTarget(target, wrappers) {
    let wrapped = target;
    for (const wrapper of wrappers) {
      if (wrapper.type === "capture") {
        wrapped = this.createDestructureTargetNode("DestructureBindingModeTarget", {
          bindingMode: wrapper.bindingMode,
          target: wrapped
        }, wrapped);
      } else if (wrapper.type === "semantic") {
        wrapped = this.createDestructureTargetNode("DestructureSemanticTarget", {
          header: wrapper.header,
          target: wrapped
        }, wrapped);
      }
    }
    return wrapped;
  }
  explicitMapKeyExpression(node) {
    if (node?.type === "Array" && Array.isArray(node.elements) && node.elements.length === 1) {
      return node.elements[0];
    }
    return null;
  }
  normalizeStandaloneIndexSpec(node) {
    if (node?.type === "BinaryOperation" && node.operator === ":") {
      return this.createNode("SliceSpec", {
        start: node.left,
        end: node.right,
        pos: node.pos,
        original: node.original
      });
    }
    if (node?.type === "Number" && typeof node.value === "string" && node.value.includes(":")) {
      const parts = node.value.split(":");
      if (parts.length === 2) {
        return this.createNode("SliceSpec", {
          start: this.createNode("Number", { value: parts[0], original: parts[0] }),
          end: this.createNode("Number", { value: parts[1], original: parts[1] }),
          pos: node.pos,
          original: node.original
        });
      }
    }
    return node;
  }
  buildIndexedDestructureTarget(selectorNode, nestedTarget = null, options = {}) {
    if (selectorNode?.type === "Grouping" && selectorNode.expression) {
      return this.buildIndexedDestructureTarget(selectorNode.expression, nestedTarget, options);
    }
    if (selectorNode?.type === "PropertyAccess") {
      const property = selectorNode.property?.type === "KeyLiteral" ? this.createNode("String", {
        value: selectorNode.property.name,
        kind: "colon",
        original: selectorNode.property.original || `:${selectorNode.property.name}`
      }) : this.normalizeStandaloneIndexSpec(selectorNode.property);
      return this.createDestructureTargetNode("DestructureIndexedTarget", {
        wholeTarget: this.convertExpressionToDestructureTarget(selectorNode.object),
        specs: [property],
        nestedTarget
      }, selectorNode);
    }
    if (selectorNode?.type === "BracketIndex") {
      return this.createDestructureTargetNode("DestructureIndexedTarget", {
        wholeTarget: this.convertExpressionToDestructureTarget(selectorNode.object),
        specs: selectorNode.specs,
        nestedTarget
      }, selectorNode);
    }
    const explicitKeyExpr = options.allowBareArraySelector ? this.explicitMapKeyExpression(selectorNode) : null;
    if (explicitKeyExpr) {
      return this.createDestructureTargetNode("DestructureIndexedTarget", {
        wholeTarget: null,
        specs: [this.normalizeStandaloneIndexSpec(explicitKeyExpr)],
        nestedTarget
      }, selectorNode);
    }
    return null;
  }
  convertExpressionToDestructureTarget(node) {
    const wrappers = [];
    let current = node;
    while (current?.type === "CapturedEntry" || current?.type === "ValueOutfit" || current?.type === "Grouping") {
      if (current.type === "CapturedEntry") {
        wrappers.push({ type: "capture", bindingMode: current.captureMode });
        current = current.expression;
      } else if (current.type === "Grouping") {
        current = current.expression;
      } else {
        wrappers.push({ type: "semantic", header: current.header || null });
        current = current.expression;
      }
    }
    let target;
    if (current?.type === "BinaryOperation" && current.operator === "=") {
      const indexed = this.buildIndexedDestructureTarget(current.left, this.convertExpressionToDestructureTarget(current.right), { allowBareArraySelector: true });
      if (indexed) {
        target = indexed;
      } else {
        this.error("Invalid destructuring target");
      }
    } else if (current?.type === "UserIdentifier" || current?.type === "SystemIdentifier") {
      target = this.createDestructureTargetNode("DestructureVariableTarget", {
        name: current.name
      }, current);
    } else if (current?.type === "Spread") {
      target = this.createDestructureTargetNode("DestructureRestTarget", {
        target: this.convertExpressionToDestructureTarget(current.expression)
      }, current);
    } else {
      const indexed = this.buildIndexedDestructureTarget(current, null);
      if (indexed) {
        target = indexed;
      }
    }
    if (target) {
      return this.wrapDestructureTarget(target, wrappers);
    }
    if (current?.type === "Array" || current?.type === "ArrayContainer") {
      const elements = current.elements || [];
      const entries = [];
      let rest = null;
      for (let i = 0;i < elements.length; i++) {
        const entry = this.convertExpressionToDestructureTarget(elements[i]);
        if (entry.type === "DestructureRestTarget") {
          if (rest)
            this.error("Destructuring patterns allow at most one rest capture");
          if (i !== elements.length - 1)
            this.error("Rest capture must be in final position");
          rest = entry;
        } else {
          entries.push(entry);
        }
      }
      target = this.createDestructureTargetNode("DestructureArrayPattern", {
        entries,
        rest
      }, current);
    } else if (current?.type === "Tuple" || current?.type === "TupleContainer") {
      const elements = current.elements || [];
      const entries = [];
      let rest = null;
      for (let i = 0;i < elements.length; i++) {
        const entry = this.convertExpressionToDestructureTarget(elements[i]);
        if (entry.type === "DestructureRestTarget") {
          if (rest)
            this.error("Destructuring patterns allow at most one rest capture");
          if (i !== elements.length - 1)
            this.error("Rest capture must be in final position");
          rest = entry;
        } else {
          entries.push(entry);
        }
      }
      target = this.createDestructureTargetNode("DestructureTuplePattern", {
        entries,
        rest
      }, current);
    } else if (current?.type === "MapContainer") {
      const entries = [];
      let rest = null;
      for (let i = 0;i < current.elements.length; i++) {
        const entry = this.convertMapDestructureEntry(current.elements[i]);
        if (entry.type === "DestructureRestTarget") {
          if (rest)
            this.error("Destructuring patterns allow at most one rest capture");
          if (i !== current.elements.length - 1)
            this.error("Rest capture must be in final position");
          rest = entry;
        } else {
          entries.push(entry);
        }
      }
      target = this.createDestructureTargetNode("DestructureMapPattern", {
        entries,
        rest
      }, current);
    } else if (current?.type === "TensorLiteral") {
      if (current.shape.length !== 2) {
        this.error("Tensor destructuring currently supports rank-2 patterns only");
      }
      const [rows, cols] = current.shape;
      if (current.elements.length !== rows * cols) {
        this.error("Malformed tensor destructure");
      }
      const rowTargets = [];
      for (let row = 0;row < rows; row++) {
        const rowEntries = [];
        for (let col = 0;col < cols; col++) {
          rowEntries.push(this.convertExpressionToDestructureTarget(current.elements[row * cols + col]));
        }
        rowTargets.push(rowEntries);
      }
      target = this.createDestructureTargetNode("DestructureTensorPattern", {
        shape: [...current.shape],
        rows: rowTargets
      }, current);
    } else {
      this.error("Invalid destructuring target");
    }
    return this.wrapDestructureTarget(target, wrappers);
  }
  convertMapDestructureEntry(node) {
    const wrappers = [];
    let current = node;
    while (current?.type === "CapturedEntry" || current?.type === "ValueOutfit") {
      if (current.type === "CapturedEntry") {
        wrappers.push({ type: "capture", bindingMode: current.captureMode });
        current = current.expression;
      } else {
        wrappers.push({ type: "semantic", header: current.header || null });
        current = current.expression;
      }
    }
    if (current?.type === "Spread") {
      const rest = this.createDestructureTargetNode("DestructureRestTarget", {
        target: this.convertExpressionToDestructureTarget(current.expression)
      }, current);
      return this.wrapDestructureTarget(rest, wrappers);
    }
    const makeEntry = (sourceKey, wholeTarget, nestedTarget, sourceNode = current) => this.createDestructureTargetNode("DestructureMapEntry", {
      sourceKey,
      wholeTarget,
      nestedTarget
    }, sourceNode);
    if (current?.type === "UserIdentifier" || current?.type === "SystemIdentifier") {
      return this.wrapDestructureTarget(makeEntry(current, this.createDestructureTargetNode("DestructureVariableTarget", { name: current.name }, current), null, current), wrappers);
    }
    if (current?.type === "PropertyAccess" && (current.object?.type === "UserIdentifier" || current.object?.type === "SystemIdentifier") && current.property?.type === "KeyLiteral") {
      return this.wrapDestructureTarget(makeEntry(this.createNode("String", {
        value: current.property.name,
        kind: "colon",
        original: current.property.original || `:${current.property.name}`
      }), this.createDestructureTargetNode("DestructureVariableTarget", { name: current.object.name }, current.object), null, current), wrappers);
    }
    if (current?.type === "MapEntry") {
      const explicitKeyExpr = this.explicitMapKeyExpression(current.key);
      if (explicitKeyExpr) {
        return this.wrapDestructureTarget(makeEntry(explicitKeyExpr, null, this.convertExpressionToDestructureTarget(current.value), current), wrappers);
      }
      if (current.key?.type === "UserIdentifier" || current.key?.type === "SystemIdentifier") {
        return this.wrapDestructureTarget(makeEntry(current.key, this.createDestructureTargetNode("DestructureVariableTarget", { name: current.key.name }, current.key), this.convertExpressionToDestructureTarget(current.value), current), wrappers);
      }
      if (current.key?.type === "PropertyAccess" && (current.key.object?.type === "UserIdentifier" || current.key.object?.type === "SystemIdentifier") && current.key.property?.type === "KeyLiteral") {
        return this.wrapDestructureTarget(makeEntry(this.createNode("String", {
          value: current.key.property.name,
          kind: "colon",
          original: current.key.property.original || `:${current.key.property.name}`
        }), this.createDestructureTargetNode("DestructureVariableTarget", { name: current.key.object.name }, current.key.object), this.convertExpressionToDestructureTarget(current.value), current), wrappers);
      }
    }
    this.error("Malformed map rename/nested syntax");
  }
  consumeSemicolonSequence() {
    if (this.current.type === "SemicolonSequence") {
      const count = this.current.count;
      this.advance();
      return count;
    } else if (this.current.value === ";") {
      this.advance();
      return 1;
    }
    return 0;
  }
  parseBraceContainer() {
    const startToken = this.current;
    this.advance();
    const imports = this.startsImportHeader() ? this.parseImportHeader() : [];
    const elements = [];
    if (this.current.value !== "}") {
      do {
        if (this.current.value === ";") {
          this.advance();
          continue;
        }
        const element = this.parseExpression(0);
        elements.push(element);
        if (this.current.value === ";" || this.current.value === ",") {
          this.advance();
        } else if (this.current.value !== "}") {
          break;
        }
      } while (this.current.value !== "}" && this.current.type !== "End");
    }
    if (this.current.value !== "}") {
      this.error("Expected closing brace for block");
    }
    this.advance();
    return this.createNode("BlockContainer", {
      ...imports.length > 0 ? { imports } : {},
      elements,
      pos: startToken.pos,
      original: startToken.original
    });
  }
  parseOperatorBrace(sigil) {
    const startToken = this.current;
    this.advance();
    const elements = [];
    if (this.current.value !== "}") {
      do {
        if (this.current.value === ",") {
          this.advance();
          continue;
        }
        elements.push(this.parseExpression(0));
        if (this.current.value === ",") {
          this.advance();
        } else if (this.current.value !== "}") {
          this.error("Expected ',' or '}' in brace sequence");
        }
      } while (this.current.value !== "}" && this.current.type !== "End");
    }
    if (this.current.value !== "}") {
      this.error("Expected '}'");
    }
    this.advance();
    let sysName;
    if (sigil === "{+")
      sysName = "ADD";
    else if (sigil === "{*")
      sysName = "MUL";
    else if (sigil === "{&&")
      sysName = "AND";
    else if (sigil === "{||")
      sysName = "OR";
    else if (sigil === "{\\/")
      sysName = "NARY_UNION";
    else if (sigil === "{/\\")
      sysName = "NARY_INTERSECT";
    else if (sigil === "{++")
      sysName = "NARY_CONCAT";
    else if (sigil === "{<<")
      sysName = "MIN";
    else if (sigil === "{>>")
      sysName = "MAX";
    return this.createNode("FunctionCall", {
      function: this.createNode("SystemIdentifier", {
        name: sysName,
        systemInfo: this.systemLookup(sysName),
        original: sigil
      }),
      arguments: {
        positional: elements,
        keyword: {}
      },
      fromBrace: true,
      pos: startToken.pos,
      original: sigil
    });
  }
  isConstructorCaptureOperator(value) {
    return value === "==" || value === ":=" || value === "~=" || value === "::=" || value === "~~=";
  }
  captureModeFromOperator(value) {
    if (value === "==")
      return "alias";
    if (value === ":=")
      return "copy";
    if (value === "~=")
      return "refresh";
    if (value === "::=")
      return "deep_copy";
    if (value === "~~=")
      return "deep_refresh";
    return null;
  }
  parseCapturedConstructorElement() {
    let captureMode = null;
    if (this.isConstructorCaptureOperator(this.current.value)) {
      captureMode = this.captureModeFromOperator(this.current.value);
      this.advance();
    }
    const expression = this.parseExpression(0);
    if (!captureMode)
      return expression;
    return this.createNode("CapturedEntry", {
      captureMode,
      expression,
      pos: expression.pos,
      original: expression.original
    });
  }
  parseMapConstructorEntry() {
    let prefixCaptureMode = null;
    if (this.isConstructorCaptureOperator(this.current.value)) {
      prefixCaptureMode = this.captureModeFromOperator(this.current.value);
      this.advance();
    }
    let key;
    if (this.current.type === "Identifier" && (this.peek().value === "=" || this.isConstructorCaptureOperator(this.peek().value))) {
      const token = this.current;
      this.advance();
      key = this.createNode(token.kind === "System" ? "SystemIdentifier" : "UserIdentifier", {
        name: token.value,
        ...token.kind === "System" ? { systemInfo: this.systemLookup(token.value) } : {},
        original: token.original
      });
    } else if (this.current.value === "(") {
      key = this.parseGrouping();
    } else {
      key = this.parseExpression(PRECEDENCE.ASSIGNMENT + 1);
    }
    const operator = this.current.value;
    if (operator !== "=" && !this.isConstructorCaptureOperator(operator)) {
      if (!prefixCaptureMode) {
        return key;
      }
      return this.createNode("CapturedEntry", {
        captureMode: prefixCaptureMode,
        expression: key,
        pos: key.pos,
        original: key.original
      });
    }
    const captureMode = operator === "=" ? null : this.captureModeFromOperator(operator);
    this.advance();
    const value = this.parseExpression(0);
    const entry = this.createNode("MapEntry", {
      key,
      value,
      captureMode,
      pos: key.pos,
      original: key.original
    });
    if (!prefixCaptureMode) {
      return entry;
    }
    return this.createNode("CapturedEntry", {
      captureMode: prefixCaptureMode,
      expression: entry,
      pos: entry.pos,
      original: entry.original
    });
  }
  parseHeaderDirectiveName() {
    const token = this.current;
    if (token.type !== "Identifier") {
      this.error("Expected identifier in header");
    }
    const name = token.original.trim();
    if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(name)) {
      this.error("Header names must start with a letter and contain only letters, digits, or underscores");
    }
    this.advance();
    return name;
  }
  parseSemanticHeader() {
    if (this.current.value !== "/") {
      return null;
    }
    const startToken = this.current;
    this.advance();
    let captureMode = null;
    let name = null;
    let typeName = null;
    const traits = [];
    let order = 0;
    while (this.current.value !== "/" && this.current.type !== "End") {
      if (this.isConstructorCaptureOperator(this.current.value)) {
        if (captureMode !== null) {
          this.error("Header may only specify one capture mode");
        }
        captureMode = this.captureModeFromOperator(this.current.value);
        this.advance();
        continue;
      }
      if (this.current.value === "#") {
        this.advance();
        if (name !== null) {
          this.error("Header may only specify one name");
        }
        name = this.parseHeaderDirectiveName();
        continue;
      }
      if (this.current.value === "::") {
        this.advance();
        if (typeName !== null) {
          this.error("Header may only specify one semantic type");
        }
        typeName = this.parseHeaderDirectiveName();
        continue;
      }
      if (this.current.value === ":") {
        this.advance();
        const traitName = this.parseHeaderDirectiveName();
        traits.push({
          type: "HeaderTrait",
          name: traitName,
          checkMode: null,
          order
        });
        order += 1;
        continue;
      }
      this.error("Invalid directive in /.../ header");
    }
    if (this.current.value !== "/") {
      this.error("Unterminated /.../ header");
    }
    this.advance();
    return this.createNode("SemanticHeader", {
      captureMode,
      name,
      typeName,
      traits,
      pos: startToken.pos,
      original: startToken.original
    });
  }
  parseValueOutfit() {
    const startToken = this.current;
    this.advance();
    const header = this.parseSemanticHeader();
    const expression = this.parseExpression(0);
    if (this.current.value !== "}") {
      this.error("Expected closing brace for value outfit");
    }
    this.advance();
    return this.createNode("ValueOutfit", {
      header,
      expression,
      pos: startToken.pos,
      original: startToken.original
    });
  }
  parseBraceSigil(sigil, containerName = null, options = {}) {
    const startToken = this.current;
    this.advance();
    const isTensorShapeSigil = sigil === "{:" && containerName && /^\d+(?:x\d+)*$/.test(containerName);
    if (isTensorShapeSigil && !options.destructureAlias) {
      return this.parseTensorLiteral(startToken, containerName);
    }
    const effectiveSigil = isTensorShapeSigil && options.destructureAlias ? "{.." : sigil;
    const sigilTypeMap = {
      "{..": "ArrayContainer",
      "{=": "MapContainer",
      "{?": "CaseContainer",
      "{;": "BlockContainer",
      "{|": "SetContainer",
      "{:": "TupleContainer",
      "{@": "LoopContainer",
      "{$": "BlockContainer",
      "{^": "ValueOutfit"
    };
    const nodeType = sigilTypeMap[effectiveSigil];
    const temporalSigils = new Set(["{?", "{;", "{@", "{$"]);
    const isTemporal = temporalSigils.has(effectiveSigil);
    const closerMap = {
      "{|": ["|}", "}"]
    };
    const closers = closerMap[effectiveSigil] || ["}"];
    const primaryCloser = closers[0];
    const isCloser = (val) => closers.includes(val);
    const separator = isTemporal ? ";" : ",";
    const isSeparatorToken = () => isTemporal ? this.current.value === ";" || this.current.type === "SemicolonSequence" : this.current.value === separator;
    const consumeSeparatorToken = () => {
      if (isTemporal && this.current.type === "SemicolonSequence") {
        const count = this.current.count;
        this.advance();
        return count;
      }
      if (this.current.value === separator) {
        this.advance();
        return 1;
      }
      return 0;
    };
    const pushHoleSlot = () => {
      elements.push(this.createNode("Hole", { original: "" }));
    };
    const header = effectiveSigil === "{=" || effectiveSigil === "{|" || effectiveSigil === "{:" || effectiveSigil === "{.." ? this.parseSemanticHeader() : null;
    const imports = (effectiveSigil === "{;" || effectiveSigil === "{@" || effectiveSigil === "{$") && this.startsImportHeader() ? this.parseImportHeader() : [];
    const elements = [];
    const parseElement = effectiveSigil === "{=" ? () => this.parseMapConstructorEntry() : effectiveSigil === "{|" || effectiveSigil === "{:" || effectiveSigil === "{.." ? () => this.parseCapturedConstructorElement() : isTemporal ? () => this.parseCommaSequenceExpression(0) : () => this.parseExpression(0);
    if (!isCloser(this.current.value)) {
      do {
        if (isSeparatorToken()) {
          const count = consumeSeparatorToken();
          if (effectiveSigil === "{@") {
            for (let i = 0;i < count; i++)
              pushHoleSlot();
          }
          continue;
        }
        const element = parseElement();
        if (effectiveSigil === "{=" && element && (element.type === "BinaryOperation" || element.type === "MapEntry") && (element.type === "MapEntry" || element.operator === "=" || element.operator === ":=")) {
          const lhs = element.type === "MapEntry" ? element.key : element.left;
          const lhsType = lhs?.type;
          const isIdentifierSugar = lhsType === "UserIdentifier" || lhsType === "SystemIdentifier";
          const isParenthesizedExpr = lhsType === "Grouping";
          const isDestructureRename = lhsType === "PropertyAccess" || lhsType === "Array" && Array.isArray(lhs?.elements) && lhs.elements.length === 1;
          if (!isIdentifierSugar && !isParenthesizedExpr && !isDestructureRename) {
            this.error("Map key expressions must be parenthesized in literals: use {= (expr)=value }");
          }
        }
        elements.push(element);
        if (isSeparatorToken()) {
          const count = consumeSeparatorToken();
          if (effectiveSigil === "{@") {
            if (isCloser(this.current.value)) {
              for (let i = 0;i < count; i++)
                pushHoleSlot();
            } else {
              for (let i = 1;i < count; i++)
                pushHoleSlot();
            }
          }
          if (isCloser(this.current.value)) {
            break;
          }
        } else if (isCloser(this.current.value)) {
          break;
        } else if (this.current.type === "End") {
          this.error(`Expected closing ${primaryCloser} for ${nodeType}`);
        } else {
          const altSep = isTemporal ? "," : ";";
          if (this.current.value === altSep) {
            this.advance();
            if (isCloser(this.current.value))
              break;
          } else {
            break;
          }
        }
      } while (!isCloser(this.current.value) && this.current.type !== "End");
    }
    if (!isCloser(this.current.value)) {
      this.error(`Expected closing ${primaryCloser} for ${nodeType}`);
    }
    this.advance();
    return this.createNode(nodeType, {
      sigil,
      ...containerName && !options.destructureAlias ? { name: containerName } : {},
      ...isTensorShapeSigil && options.destructureAlias ? { tensorShape: containerName.split("x").map((part) => Number(part)) } : {},
      ...effectiveSigil === "{@" && options.loopMax !== undefined ? { maxIterations: options.loopMax } : {},
      ...effectiveSigil === "{@" && options.loopUnlimited ? { unlimited: true } : {},
      ...header ? { header } : {},
      ...imports.length > 0 ? { imports } : {},
      elements,
      pos: startToken.pos,
      original: startToken.original
    });
  }
  parseSystemSpecLiteral() {
    const startToken = this.current;
    const header = {
      inputs: [...startToken.specInputs || []],
      outputs: [...startToken.specOutputs || []],
      outputsDeclared: startToken.specOutputsDeclared === true
    };
    this.validateSystemSpecHeader(header);
    this.advance();
    const imports = this.startsImportHeader() ? this.parseImportHeader() : [];
    const statements = [];
    if (this.current.value !== "}") {
      do {
        if (this.current.value === ";") {
          this.advance();
          continue;
        }
        const expression = this.parseExpression(0);
        statements.push(this.parseSystemSpecStatement(expression));
        if (this.current.value === ";") {
          this.advance();
          if (this.current.value === "}")
            break;
        } else if (this.current.value === ",") {
          this.advance();
          if (this.current.value === "}")
            break;
        } else if (this.current.value === "}") {
          break;
        } else if (this.current.type === "End") {
          this.error("Expected closing } for system spec literal");
        } else {
          break;
        }
      } while (this.current.value !== "}" && this.current.type !== "End");
    }
    if (this.current.value !== "}") {
      this.error("Expected closing } for system spec literal");
    }
    this.advance();
    const finalized = this.finalizeSystemSpecStatements(header, statements);
    return this.createNode("SystemSpecLiteral", {
      sigil: "{#",
      ...imports.length > 0 ? { imports } : {},
      inputs: header.inputs,
      outputs: finalized.outputs,
      outputsDeclared: header.outputsDeclared,
      statements: finalized.statements,
      pos: startToken.pos,
      original: startToken.original
    });
  }
  validateSystemSpecHeader(header) {
    const checkDuplicates = (names, label) => {
      const seen = new Set;
      for (const name of names) {
        if (seen.has(name)) {
          this.error(`Duplicate ${label} '${name}' in system spec header`);
        }
        seen.add(name);
      }
    };
    checkDuplicates(header.inputs, "input");
    checkDuplicates(header.outputs, "output");
    const inputs = new Set(header.inputs);
    for (const name of header.outputs) {
      if (inputs.has(name)) {
        this.error(`System spec header name '${name}' cannot be both an input and an output`);
      }
    }
  }
  parseSystemSpecStatement(expression) {
    if (!expression || expression.type !== "BinaryOperation" || expression.operator !== "=") {
      this.error("System spec bodies only support symbolic assignments of the form name = expr");
    }
    const target = expression.left;
    if (target.type !== "UserIdentifier" && target.type !== "SystemIdentifier") {
      this.error("System spec assignment targets must be bare identifiers");
    }
    return this.createNode("SpecAssign", {
      target: target.name,
      expr: expression.right,
      pos: expression.pos ?? target.pos,
      original: expression.original
    });
  }
  finalizeSystemSpecStatements(header, statements) {
    const assigned = new Set;
    const inferredOutputs = [];
    const declaredOutputs = new Set(header.outputs);
    for (const statement of statements) {
      const target = statement.target;
      if (assigned.has(target)) {
        this.error(`System spec output '${target}' is assigned more than once`);
      }
      if (header.outputsDeclared && !declaredOutputs.has(target)) {
        this.error(`System spec assignment target '${target}' is not a declared output`);
      }
      assigned.add(target);
      if (!header.outputsDeclared) {
        inferredOutputs.push(target);
      }
    }
    if (header.outputsDeclared) {
      for (const output of header.outputs) {
        if (!assigned.has(output)) {
          this.error(`System spec declared output '${output}' is never assigned`);
        }
      }
    }
    return {
      outputs: header.outputsDeclared ? header.outputs : inferredOutputs,
      statements
    };
  }
  parseBreakBlock() {
    const startToken = this.current;
    this.advance();
    let targetType = null;
    if (this.current.value === ";") {
      targetType = "block";
      this.advance();
    } else if (this.current.value === "@") {
      targetType = "loop";
      this.advance();
    } else if (this.current.value === "?") {
      targetType = "case";
      this.advance();
    } else if (this.current.type === "OuterIdentifier" && this.peek().value === "!") {
      targetType = "loop";
      const targetName2 = this.current.value.toLowerCase();
      this.advance();
      this.advance();
      const value2 = this.parseExpression(0);
      if (this.current.value !== "}") {
        this.error("Expected closing } for break block");
      }
      this.advance();
      return this.createNode("BreakBlock", {
        targetType,
        targetName: targetName2,
        value: value2,
        pos: startToken.pos,
        original: startToken.original
      });
    }
    let targetName = null;
    if (this.current.type === "Identifier" && this.peek().value === "!") {
      targetName = this.current.value.toLowerCase();
      this.advance();
      this.advance();
    }
    const value = this.parseExpression(0);
    if (this.current.value !== "}") {
      this.error("Expected closing } for break block");
    }
    this.advance();
    return this.createNode("BreakBlock", {
      ...targetType ? { targetType } : {},
      ...targetName ? { targetName } : {},
      value,
      pos: startToken.pos,
      original: startToken.original
    });
  }
  parseTensorLiteral(startToken, headerText) {
    const shape = headerText.split("x").map((part) => {
      const dim = Number(part);
      if (!Number.isInteger(dim) || dim < 0) {
        this.error(`Invalid tensor dimension '${part}'`);
      }
      return dim;
    });
    const size = shape.reduce((product, dim) => product * dim, 1);
    let elements = [];
    const header = this.parseSemanticHeader();
    if (size === 0) {
      if (this.current.value !== "}") {
        this.error(`Tensor literal shape ${shape.join("x")} has size 0 and must not contain elements`);
      }
    } else if (this.current.value !== "}") {
      if (shape.length === 2 && this.current.value === "[") {
        elements = this.parseTensorRowArrayPattern(shape);
      } else {
        const displayTree = this.parseTensorDisplayLevel(this.getTensorDisplayLevels(shape), 0, shape);
        elements = this.flattenTensorDisplayTree(displayTree, shape);
      }
    }
    if (this.current.value !== "}") {
      this.error("Expected closing brace for tensor literal");
    }
    this.advance();
    return this.createNode("TensorLiteral", {
      shape,
      ...header ? { header } : {},
      elements,
      pos: startToken.pos,
      original: startToken.original
    });
  }
  parseTensorRowArrayPattern(shape) {
    const [rows, cols] = shape;
    const elements = [];
    for (let row = 0;row < rows; row++) {
      const rowExpr = this.parseArray();
      if (rowExpr.type !== "Array" || rowExpr.elements.length !== cols) {
        this.error(`Malformed tensor destructure row: expected [..] with ${cols} entries`);
      }
      elements.push(...rowExpr.elements);
      if (row < rows - 1) {
        if (this.current.value !== ",") {
          this.error(`Tensor destructuring shape ${shape.join("x")} expects ',' between row arrays`);
        }
        this.advance();
      }
    }
    return elements;
  }
  getTensorDisplayLevels(shape) {
    if (shape.length === 0) {
      return [];
    }
    if (shape.length === 1) {
      return [{ size: shape[0], separatorCount: 0, label: "entry" }];
    }
    const levels = [];
    for (let axis = shape.length - 1;axis >= 2; axis--) {
      levels.push({
        size: shape[axis],
        separatorCount: axis,
        label: `axis ${axis + 1}`
      });
    }
    levels.push({ size: shape[0], separatorCount: 1, label: "row" });
    levels.push({ size: shape[1], separatorCount: 0, label: "column" });
    return levels;
  }
  parseTensorDisplayLevel(levels, levelIndex, shape) {
    const level = levels[levelIndex];
    if (!level) {
      return null;
    }
    if (level.separatorCount === 0) {
      const values = [];
      for (let i = 0;i < level.size; i++) {
        values.push(this.parseExpression(0));
        if (i < level.size - 1) {
          if (this.current.value !== ",") {
            this.error(`Tensor literal shape ${shape.join("x")} expects ${level.size} columns per row`);
          }
          this.advance();
        }
      }
      return values;
    }
    const groups = [];
    for (let i = 0;i < level.size; i++) {
      groups.push(this.parseTensorDisplayLevel(levels, levelIndex + 1, shape));
      if (i < level.size - 1) {
        const consumed = this.consumeSemicolonSequence();
        if (consumed !== level.separatorCount) {
          const sepText = ";".repeat(level.separatorCount);
          this.error(`Tensor literal shape ${shape.join("x")} expects '${sepText}' between ${level.label}s`);
        }
      }
    }
    return groups;
  }
  flattenTensorDisplayTree(tree, shape) {
    if (shape.length === 1) {
      return tree;
    }
    const elements = [];
    const path = [];
    const getValueAtDisplayPath = (displayPath) => {
      let node = tree;
      for (const idx of displayPath) {
        node = node[idx - 1];
      }
      return node;
    };
    const visitExternal = (axis) => {
      if (axis === shape.length) {
        const higher = path.slice(2).reverse();
        const displayPath = [...higher, path[0], path[1]];
        elements.push(getValueAtDisplayPath(displayPath));
        return;
      }
      for (let i = 1;i <= shape[axis]; i++) {
        path.push(i);
        visitExternal(axis + 1);
        path.pop();
      }
    };
    visitExternal(0);
    return elements;
  }
  parseBracketIndex(left, operator) {
    const specs = [];
    if (this.current.value !== "]") {
      do {
        specs.push(this.parseBracketSpec());
        if (this.current.value === ",") {
          this.advance();
          if (this.current.value === "]") {
            this.error("Trailing comma is not allowed in bracket indexing");
          }
          continue;
        }
        break;
      } while (this.current.type !== "End");
    }
    if (this.current.value !== "]") {
      this.error("Expected closing bracket");
    }
    this.advance();
    if (specs.length === 1 && specs[0].type !== "SliceSpec" && specs[0].type !== "FullSlice") {
      return this.createNode("PropertyAccess", {
        object: left,
        property: specs[0],
        pos: left.pos,
        original: left.original + operator.original
      });
    }
    return this.createNode("BracketIndex", {
      object: left,
      specs,
      pos: left.pos,
      original: left.original + operator.original
    });
  }
  parseBracketSpec() {
    const token = this.current;
    if (token.value === "::") {
      this.advance();
      return this.createNode("FullSlice", {
        pos: token.pos,
        original: token.original
      });
    }
    const expr = this.parseExpression(0);
    if (expr && expr.type === "BinaryOperation" && expr.operator === ":") {
      return this.createNode("SliceSpec", {
        start: expr.left,
        end: expr.right,
        pos: expr.pos,
        original: expr.original
      });
    }
    return expr;
  }
  startsImportHeader() {
    return this.current.value === "<" || this.current.value === "<>";
  }
  normalizeImportIdentifierName(name) {
    let firstLetter = null;
    for (let i = 0;i < name.length; i++) {
      if (/[\p{L}]/u.test(name[i])) {
        firstLetter = name[i];
        break;
      }
    }
    const isCapital = firstLetter !== null && firstLetter.toUpperCase() === firstLetter;
    return isCapital ? name.toUpperCase() : name.toLowerCase();
  }
  parseImportHeader() {
    const startIndex = this.position - 1;
    let raw = "";
    let endIndex = -1;
    for (let i = startIndex;i < this.tokens.length; i++) {
      const token = this.tokens[i];
      if (token.type === "String" && token.kind === "comment") {
        continue;
      }
      const original = token.original ?? String(token.value ?? "");
      const start = i === startIndex ? original.indexOf("<") + 1 : 0;
      const end = original.indexOf(">", start);
      if (end !== -1) {
        raw += original.slice(start, end);
        endIndex = i;
        break;
      }
      raw += original.slice(start);
    }
    if (endIndex === -1) {
      this.error("Unterminated import header");
    }
    this.position = endIndex + 1;
    this.advance();
    const text = raw.trim();
    if (!text.length) {
      this.error("Import header cannot be empty");
    }
    const seenLocals = new Set;
    const imports = [];
    const pieces = raw.split(",");
    for (const piece of pieces) {
      const spec = piece.trim();
      if (!spec.length) {
        this.error("Trailing comma is not allowed in import header");
      }
      const match = spec.match(/^([\p{L}_][\p{L}\p{N}_]*)(?:\s*([~=])\s*([\p{L}_][\p{L}\p{N}_]*)?)?$/u);
      if (!match) {
        this.error("Malformed import header");
      }
      const [, rawLocal, operator, rawExplicitSource] = match;
      const local = this.normalizeImportIdentifierName(rawLocal);
      const explicitSource = rawExplicitSource ? this.normalizeImportIdentifierName(rawExplicitSource) : undefined;
      const mode = operator === "=" ? "alias" : "copy";
      const source = explicitSource || local;
      if (seenLocals.has(local)) {
        this.error(`Duplicate import target '${local}' in block import header`);
      }
      seenLocals.add(local);
      imports.push({ local, source, mode });
    }
    return imports;
  }
  parseAngleForm() {
    const startToken = this.current;
    this.advance();
    if (this.current.value === ">") {
      this.error("Angle form cannot be empty");
    }
    if (this.current.type === "String" && this.current.kind !== "comment" && this.current.kind !== "backtick") {
      return this.parseScriptImportExpression(startToken);
    }
    const bindings = this.parseScriptBindingSpecs({ allowOuterSource: false });
    if (this.current.value !== ">") {
      this.error("Expected closing > for script declaration");
    }
    this.advance();
    return this.createNode("ScriptBindingsDeclaration", {
      bindings,
      pos: startToken.pos,
      original: startToken.original
    });
  }
  parseScriptImportExpression(startToken) {
    const pathToken = this.current;
    this.advance();
    const pathNode = this.createNode("String", {
      value: pathToken.value,
      kind: pathToken.kind,
      original: pathToken.original
    });
    const capabilityModifiers = this.current.value === "/" ? this.parseCapabilityModifierList() : [];
    const inputs = this.current.value !== ">" && this.current.value !== ";" ? this.parseScriptBindingSpecs({ allowOuterSource: true }) : [];
    let outputs = [];
    if (this.current.value === ";") {
      this.advance();
      outputs = this.current.value !== ">" ? this.parseScriptBindingSpecs({ allowOuterSource: false }) : [];
    }
    if (this.current.value !== ">") {
      this.error("Expected closing > for script import expression");
    }
    this.advance();
    return this.createNode("ScriptImportExpression", {
      path: pathNode,
      ...capabilityModifiers.length > 0 ? { capabilityModifiers } : {},
      ...inputs.length > 0 ? { inputs } : {},
      ...outputs.length > 0 ? { outputs } : {},
      pos: startToken.pos,
      original: startToken.original
    });
  }
  parseCapabilityModifierList() {
    this.advance();
    const modifiers = [];
    while (this.current.type !== "End" && this.current.value !== "/") {
      if (this.current.value !== "+" && this.current.value !== "-") {
        this.error("Capability modifiers must start with + or -");
      }
      const action = this.current.value === "+" ? "add" : "remove";
      this.advance();
      let targetType;
      let target;
      if (this.current.type === "Identifier" && this.current.value.toUpperCase() === "ALL") {
        targetType = "all";
        target = "All";
        this.advance();
      } else if (this.current.type === "OuterIdentifier") {
        targetType = "function";
        target = this.current.value;
        this.advance();
      } else if (this.current.type === "Identifier") {
        targetType = "group";
        target = this.current.original.trim();
        this.advance();
      } else {
        this.error("Expected capability group name, All, or @Function in capability modifiers");
      }
      modifiers.push({ action, targetType, target });
      if (this.current.value === ",") {
        this.advance();
        if (this.current.value === "/") {
          this.error("Trailing comma is not allowed in capability modifiers");
        }
      } else if (this.current.value !== "/") {
        this.error("Expected ',' or closing / in capability modifiers");
      }
    }
    if (this.current.value !== "/") {
      this.error("Unterminated capability modifier list");
    }
    this.advance();
    return modifiers;
  }
  parseScriptBindingSpecs(options = {}) {
    const allowOuterSource = options.allowOuterSource === true;
    const seenTargets = new Set;
    const specs = [];
    while (this.current.type !== "End" && this.current.value !== ">" && this.current.value !== ";") {
      const spec = this.parseScriptBindingSpec({ allowOuterSource });
      if (seenTargets.has(spec.target)) {
        this.error(`Duplicate binding target '${spec.target}'`);
      }
      seenTargets.add(spec.target);
      specs.push(spec);
      if (this.current.value === ",") {
        this.advance();
        if (this.current.value === ">" || this.current.value === ";") {
          this.error("Trailing comma is not allowed in script bindings");
        }
      } else if (this.current.value !== ">" && this.current.value !== ";") {
        this.error("Expected ',' or end of script bindings");
      }
    }
    return specs;
  }
  parseScriptBindingSpec(options = {}) {
    const allowOuterSource = options.allowOuterSource === true;
    const target = this.parseScriptBindingName("Expected binding target name");
    let mode = "copy";
    let source = target.name;
    let sourceScope = "current";
    if (this.current.value === "=") {
      mode = "alias";
      this.advance();
      if (this.current.type === "Identifier" || this.current.type === "OuterIdentifier") {
        const sourceRef = this.parseScriptBindingSource(allowOuterSource);
        source = sourceRef.name;
        sourceScope = sourceRef.scope;
      }
    } else if (this.current.value === "::") {
      mode = "deep_copy_meta";
      this.advance();
      if (this.current.type === "Identifier" || this.current.type === "OuterIdentifier") {
        const sourceRef = this.parseScriptBindingSource(allowOuterSource);
        source = sourceRef.name;
        sourceScope = sourceRef.scope;
      }
    } else if (this.current.value === "~") {
      this.advance();
      if (this.current.value === "~") {
        mode = "deep_copy";
        this.advance();
      } else {
        mode = "copy";
      }
      if (this.current.type === "Identifier" || this.current.type === "OuterIdentifier") {
        const sourceRef = this.parseScriptBindingSource(allowOuterSource);
        source = sourceRef.name;
        sourceScope = sourceRef.scope;
      }
    } else if (this.current.value === ":") {
      this.advance();
      if (this.current.value === ":") {
        mode = "deep_copy_meta";
        this.advance();
      } else {
        mode = "copy_meta";
      }
      if (this.current.type === "Identifier" || this.current.type === "OuterIdentifier") {
        const sourceRef = this.parseScriptBindingSource(allowOuterSource);
        source = sourceRef.name;
        sourceScope = sourceRef.scope;
      }
    }
    return {
      target: target.name,
      source,
      mode,
      ...sourceScope !== "current" ? { sourceScope } : {}
    };
  }
  parseScriptBindingName(message) {
    if (this.current.type !== "Identifier") {
      this.error(message);
    }
    const name = this.current.value;
    this.advance();
    return { name };
  }
  parseScriptBindingSource(allowOuterSource) {
    if (this.current.type === "OuterIdentifier") {
      if (!allowOuterSource) {
        this.error("Ancestor scope sources are not allowed in this binding list");
      }
      const name2 = this.current.value;
      this.advance();
      return { name: name2, scope: "ancestor" };
    }
    if (this.current.type !== "Identifier") {
      this.error("Expected binding source name");
    }
    const name = this.current.value;
    this.advance();
    return { name, scope: "current" };
  }
  parseMutation(target) {
    const sigil = this.current.value;
    const mutate = sigil === "{!";
    const startToken = this.current;
    this.advance();
    const operations = [];
    if (this.current.value !== "}") {
      do {
        const op = { action: null, key: null, value: null };
        if (this.current.value === "+") {
          op.action = "add";
          this.advance();
        } else if (this.current.value === "-") {
          op.action = "remove";
          this.advance();
          if (this.current.value === ".") {
            this.advance();
          }
        } else {
          op.action = "add";
        }
        if (this.current.type === "Identifier") {
          op.key = this.current.value;
          this.advance();
        } else {
          this.error("Expected property name in mutation");
        }
        if (op.action === "add" && (this.current.value === "=" || this.current.value === ":=")) {
          this.advance();
          op.value = this.parseExpression(PRECEDENCE.CONDITION + 1);
        }
        operations.push(op);
        if (this.current.value === ",") {
          this.advance();
          if (this.current.value === "}")
            break;
        } else if (this.current.value === "}") {
          break;
        } else {
          break;
        }
      } while (this.current.value !== "}" && this.current.type !== "End");
    }
    if (this.current.value !== "}") {
      this.error("Expected closing } for mutation");
    }
    this.advance();
    return this.createNode("Mutation", {
      target,
      mutate,
      operations,
      pos: startToken.pos,
      original: startToken.original
    });
  }
  parseUnaryOperator() {
    const operator = this.current;
    this.advance();
    const operand = this.parseExpression(PRECEDENCE.UNARY);
    return this.createNode("UnaryOperation", {
      operator: operator.value,
      operand,
      pos: operator.pos,
      original: operator.original
    });
  }
  parseDerivative(left) {
    const quotes = [];
    let originalText = "";
    while (this.current.value === "'") {
      quotes.push(this.current);
      originalText += this.current.original;
      this.advance();
    }
    let variables = null;
    if (this.current.value === "[") {
      this.advance();
      variables = this.parseVariableList();
      if (this.current.value !== "]") {
        this.error("Expected closing bracket after variable list");
      }
      originalText += this.current.original;
      this.advance();
    }
    let evaluation = null;
    let operations = null;
    if (this.current.value === "(") {
      const parenResult = this.parseCalculusParentheses();
      if (parenResult.isEvaluation) {
        evaluation = parenResult.content;
      } else {
        operations = parenResult.content;
      }
      originalText += parenResult.original;
    }
    return this.createNode("Derivative", {
      function: left,
      order: quotes.length,
      variables,
      evaluation,
      operations,
      pos: left.pos,
      original: left.original + originalText
    });
  }
  parseIntegral() {
    const quotes = [];
    let originalText = "";
    while (this.current.value === "'") {
      quotes.push(this.current);
      originalText += this.current.original;
      this.advance();
    }
    let func = null;
    if (this.current.type === "Identifier") {
      if (this.current.kind === "System") {
        const systemInfo = this.systemLookup(this.current.value);
        func = this.createNode("SystemIdentifier", {
          name: this.current.value,
          systemInfo,
          original: this.current.original
        });
      } else {
        func = this.createNode("UserIdentifier", {
          name: this.current.value,
          original: this.current.original
        });
      }
      this.advance();
    } else {
      this.error("Expected function name after integral operator");
    }
    let variables = null;
    if (this.current.value === "[") {
      this.advance();
      variables = this.parseVariableList();
      if (this.current.value !== "]") {
        this.error("Expected closing bracket after variable list");
      }
      originalText += this.current.original;
      this.advance();
    }
    let evaluation = null;
    let operations = null;
    if (this.current.value === "(") {
      const parenResult = this.parseCalculusParentheses();
      if (parenResult.isEvaluation) {
        evaluation = parenResult.content;
      } else {
        operations = parenResult.content;
      }
      originalText += parenResult.original;
    }
    return this.createNode("Integral", {
      function: func,
      order: quotes.length,
      variables,
      evaluation,
      operations,
      metadata: { integrationConstant: "c", defaultValue: 0 },
      pos: quotes[0].pos,
      original: originalText + func.original
    });
  }
  parseVariableList() {
    const variables = [];
    if (this.current.value !== "]") {
      do {
        if (this.current.type === "Identifier") {
          variables.push({
            name: this.current.value,
            original: this.current.original
          });
          this.advance();
        } else {
          this.error("Expected variable name in variable list");
        }
        if (this.current.value === ",") {
          this.advance();
        } else if (this.current.value === "]") {
          break;
        } else {
          this.error("Expected comma or closing bracket in variable list");
        }
      } while (true);
    }
    return variables;
  }
  parseCalculusParentheses() {
    const startToken = this.current;
    this.advance();
    let isEvaluation = true;
    const content = [];
    let originalText = startToken.original;
    while (this.current.value !== ")" && this.current.type !== "End") {
      const expr = this.parseExpression(0);
      content.push(expr);
      if (this.containsCalculusOperations(expr)) {
        isEvaluation = false;
      }
      if (this.current.value === ",") {
        originalText += this.current.original;
        this.advance();
      } else {
        break;
      }
    }
    if (this.current.value !== ")") {
      this.error("Expected closing parenthesis");
    }
    originalText += this.current.original;
    this.advance();
    return {
      isEvaluation,
      content,
      original: originalText
    };
  }
  containsCalculusOperations(expr) {
    if (!expr || typeof expr !== "object")
      return false;
    if (expr.type === "Derivative" || expr.type === "Integral") {
      return true;
    }
    if (expr.type === "UserIdentifier" && expr.name) {
      return expr.name.includes("'");
    }
    if (expr.left && this.containsCalculusOperations(expr.left))
      return true;
    if (expr.right && this.containsCalculusOperations(expr.right))
      return true;
    if (expr.function && this.containsCalculusOperations(expr.function))
      return true;
    if (expr.elements) {
      for (const element of expr.elements) {
        if (this.containsCalculusOperations(element))
          return true;
      }
    }
    return false;
  }
  parseFunctionArgs() {
    const args = [];
    if (this.current.value !== ")") {
      do {
        args.push(this.parseExpression(0));
        if (this.current.value === ",") {
          this.advance();
        } else {
          break;
        }
      } while (this.current.value !== ")" && this.current.type !== "End");
    }
    if (this.current.value !== ")") {
      this.error("Expected closing parenthesis in function call");
    }
    this.advance();
    return args;
  }
  parseFunctionParameters() {
    const params = {
      positional: [],
      keyword: [],
      conditionals: [],
      metadata: {}
    };
    if (this.current.value === ")") {
      return params;
    }
    let inKeywordSection = false;
    while (this.current.value !== ")" && this.current.type !== "End") {
      if (this.current.value === ";") {
        inKeywordSection = true;
        this.advance();
        continue;
      }
      const param = this.parseFunctionParameter(inKeywordSection);
      if (inKeywordSection) {
        params.keyword.push(param);
      } else {
        params.positional.push(param);
      }
      if (this.current.value === "?") {
        this.advance();
        const condition = this.parseExpression(PRECEDENCE.CONDITION + 1);
        params.conditionals.push(condition);
      }
      if (this.current.value === ",") {
        this.advance();
      } else if (this.current.value !== ")" && this.current.value !== ";") {
        break;
      }
    }
    return params;
  }
  parseFunctionParameter(isKeywordOnly = false) {
    const param = {
      name: null,
      defaultValue: null
    };
    if (this.current.type === "Identifier" && this.current.kind === "User") {
      param.name = this.current.value;
      this.advance();
    } else {
      this.error("Expected parameter name");
    }
    if (this.current.value === "?=") {
      this.advance();
      param.holeDefault = this.parseExpression(PRECEDENCE.CONDITION + 1);
    }
    return param;
  }
  parseFunctionCallArgs() {
    const args = {
      positional: [],
      keyword: {}
    };
    if (this.current.value === ")") {
      return args;
    }
    let inKeywordSection = false;
    while (this.current.value !== ")" && this.current.type !== "End") {
      if (this.current.value === ";") {
        inKeywordSection = true;
        this.advance();
        continue;
      }
      if (inKeywordSection) {
        if (this.current.type === "Identifier" && this.current.kind === "User") {
          const keyName = this.current.value;
          const keyPos = this.current.pos;
          const keyOriginal = this.current.original;
          this.advance();
          if (this.current.value === ":=") {
            this.advance();
            const value = this.parseExpression(PRECEDENCE.ASSIGNMENT + 1);
            args.keyword[keyName] = value;
          } else {
            args.keyword[keyName] = this.createNode("UserIdentifier", {
              name: keyName,
              pos: keyPos,
              original: keyOriginal
            });
          }
        } else {
          this.error("Expected identifier for keyword argument");
        }
      } else {
        if (this.current.value === "," || this.current.value === ")") {
          args.positional.push(this.createNode("Hole", { original: "" }));
        } else {
          args.positional.push(this.parseExpression(0));
        }
      }
      if (this.current.value === ",") {
        this.advance();
        if (this.current.value === ")") {
          args.positional.push(this.createNode("Hole", { original: "" }));
        }
      } else if (this.current.value !== ")" && this.current.value !== ";") {
        break;
      }
    }
    return args;
  }
  convertArgsToParams(args) {
    const params = {
      positional: [],
      keyword: [],
      conditionals: [],
      metadata: {}
    };
    if (args.positional && args.keyword) {
      for (const arg of args.positional) {
        const result = this.parseParameterFromArg(arg, false);
        params.positional.push(result.param);
        if (result.condition) {
          params.conditionals.push(result.condition);
        }
      }
      for (const [key, value] of Object.entries(args.keyword)) {
        const param = {
          name: key,
          defaultValue: null
        };
        if (value.type === "BinaryOperation" && value.operator === "?") {
          param.defaultValue = value.left;
          params.conditionals.push(value.right);
        } else {
          param.defaultValue = value;
        }
        params.keyword.push(param);
      }
    } else if (Array.isArray(args)) {
      for (const arg of args) {
        const result = this.parseParameterFromArg(arg, false);
        params.positional.push(result.param);
        if (result.condition) {
          params.conditionals.push(result.condition);
        }
      }
    }
    return params;
  }
  extractNamedFunctionSignature(left) {
    let funcName = left;
    let parameters = { positional: [], keyword: [], conditionals: [], metadata: {} };
    if (left.type === "FunctionCall") {
      funcName = left.function;
      parameters = this.convertArgsToParams(left.arguments);
      return { funcName, parameters };
    }
    if (left.type === "ImplicitMultiplication") {
      funcName = left.left;
      parameters = { positional: [], keyword: [], conditionals: [], metadata: {} };
      const paramExpr = left.right;
      if (paramExpr.type === "Grouping" && paramExpr.expression) {
        if (paramExpr.expression.type === "ParameterList") {
          parameters = paramExpr.expression.parameters;
        } else if (paramExpr.expression.type === "UserIdentifier") {
          parameters.positional.push({ name: paramExpr.expression.name, defaultValue: null });
        } else if (paramExpr.expression.type === "BinaryOperation" && paramExpr.expression.operator === "?") {
          const paramName = paramExpr.expression.left.name || paramExpr.expression.left.value;
          parameters.positional.push({ name: paramName, defaultValue: null });
          parameters.conditionals.push(paramExpr.expression.right);
        }
      } else if (paramExpr.type === "Tuple") {
        for (const el of paramExpr.elements) {
          const result = this.parseParameterFromArg(el, false);
          parameters.positional.push(result.param);
          if (result.condition) {
            parameters.conditionals.push(result.condition);
          }
        }
      }
      return { funcName, parameters };
    }
    return null;
  }
  canHaveFunctionVariantHeader(left) {
    return Boolean(this.extractNamedFunctionSignature(left) || this.extractLambdaParameters(left));
  }
  looksLikeFunctionVariantHeader() {
    const t1 = this.tokens[this.position - 1];
    const t2 = this.tokens[this.position];
    const t3 = this.tokens[this.position + 1];
    const t4 = this.tokens[this.position + 2];
    return t1?.value === "/" && t2?.type === "Identifier" && t3?.value === "/" && ["->", "=>", "^=>"].includes(t4?.value);
  }
  parseFunctionVariantHeader() {
    if (this.current.value !== "/") {
      return null;
    }
    this.advance();
    if (this.current.type !== "Identifier") {
      this.error("Expected variant name inside /.../");
    }
    const name = this.current.original.trim();
    if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(name)) {
      this.error("Variant names must start with a letter and contain only letters, digits, or underscores");
    }
    this.advance();
    if (this.current.value !== "/") {
      this.error("Unterminated variant name header");
    }
    this.advance();
    return name;
  }
  buildFunctionArrowNode(left, operator, body, options = {}) {
    const { prep = null, prepStrict = false, variantName = null } = options;
    const namedSig = this.extractNamedFunctionSignature(left);
    if (operator === "=>" || operator === "^=>") {
      if (!namedSig) {
        return null;
      }
      return this.createNode("FunctionVariantDefinition", {
        name: namedSig.funcName,
        parameters: namedSig.parameters,
        prep,
        prepStrict,
        ...variantName ? { variantName } : {},
        mode: operator === "^=>" ? "prepend" : "append",
        body,
        pos: left.pos,
        original: left.original
      });
    }
    if (namedSig) {
      return this.createNode("FunctionDefinition", {
        name: namedSig.funcName,
        parameters: namedSig.parameters,
        prep,
        prepStrict,
        ...variantName ? { variantName } : {},
        body,
        pos: left.pos,
        original: left.original
      });
    }
    const lambdaParameters = this.extractLambdaParameters(left);
    if (lambdaParameters) {
      return this.createNode("FunctionLambda", {
        parameters: lambdaParameters,
        prep,
        prepStrict,
        ...variantName ? { variantName } : {},
        body,
        pos: left.pos,
        original: left.original
      });
    }
    return null;
  }
  extractLambdaParameters(left) {
    if (left.type === "Grouping" && left.expression && left.expression.type === "ParameterList") {
      return left.expression.parameters;
    }
    if (left.type === "Grouping" && left.expression) {
      const parameters = {
        positional: [],
        keyword: [],
        conditionals: [],
        metadata: {}
      };
      const result = this.parseParameterFromArg(left.expression, false);
      if (result.param.name) {
        parameters.positional.push(result.param);
        if (result.condition) {
          parameters.conditionals.push(result.condition);
        }
      }
      return parameters;
    }
    if (left.type === "Tuple") {
      const parameters = {
        positional: [],
        keyword: [],
        conditionals: [],
        metadata: {}
      };
      for (const element of left.elements) {
        const result = this.parseParameterFromArg(element, false);
        if (result.param.name) {
          parameters.positional.push(result.param);
          if (result.condition) {
            parameters.conditionals.push(result.condition);
          }
        }
      }
      return parameters;
    }
    if (left.type === "UserIdentifier") {
      return {
        positional: [{ name: left.name, defaultValue: null }],
        keyword: [],
        conditionals: [],
        metadata: {}
      };
    }
    return null;
  }
  parseEmbeddedLanguage(token) {
    const content = token.value;
    if (content.startsWith(":") || content.indexOf(":") === -1) {
      const body2 = content.startsWith(":") ? content.slice(1) : content;
      return this.createNode("EmbeddedLanguage", {
        language: "RiX-String",
        context: null,
        body: body2,
        original: token.original
      });
    }
    const parenStart = content.indexOf("(");
    let colonIndex = -1;
    let header = "";
    let body = "";
    if (parenStart !== -1) {
      let parenCount = 0;
      let parenEnd = -1;
      for (let i = parenStart;i < content.length; i++) {
        if (content[i] === "(") {
          parenCount++;
        } else if (content[i] === ")") {
          parenCount--;
          if (parenCount === 0) {
            parenEnd = i;
            break;
          }
        }
      }
      if (parenEnd !== -1) {
        const afterParens = content.slice(parenEnd + 1);
        const colonAfterParens = afterParens.indexOf(":");
        if (colonAfterParens !== -1) {
          colonIndex = parenEnd + 1 + colonAfterParens;
        }
      }
    }
    if (colonIndex === -1) {
      colonIndex = content.indexOf(":");
    }
    header = content.slice(0, colonIndex).trim();
    body = content.slice(colonIndex + 1);
    let language = header;
    let context = null;
    const headerParenStart = header.indexOf("(");
    const headerParenEnd = header.lastIndexOf(")");
    if (headerParenEnd !== -1 && headerParenStart === -1) {
      this.error("Unmatched closing parenthesis in embedded language header");
    }
    if (headerParenStart !== -1) {
      let parenCount = 0;
      let parenEnd = -1;
      for (let i = headerParenStart;i < header.length; i++) {
        if (header[i] === "(") {
          parenCount++;
        } else if (header[i] === ")") {
          parenCount--;
          if (parenCount === 0) {
            parenEnd = i;
            break;
          }
        }
      }
      if (parenEnd === -1) {
        this.error("Unmatched opening parenthesis in embedded language header");
      }
      if (parenEnd !== header.length - 1) {
        this.error("Invalid embedded language header format. Expected: LANGUAGE(CONTEXT):BODY");
      }
      const afterCloseParen = header.slice(parenEnd + 1);
      if (afterCloseParen.includes("(")) {
        this.error("Multiple parenthetical groups not allowed in embedded language header");
      }
      language = header.slice(0, headerParenStart).trim();
      context = header.slice(headerParenStart + 1, parenEnd).trim();
    }
    return this.createNode("EmbeddedLanguage", {
      language: language || null,
      context,
      body,
      original: token.original
    });
  }
  parseParameterFromArg(arg, inKeywordSection) {
    const result = {
      param: {
        name: null,
        defaultValue: null
      },
      condition: null
    };
    if (arg.type === "Spread") {
      result.param.isRest = true;
      const inner = arg.expression;
      if (inner.type === "UserIdentifier" || inner.type === "Identifier" && inner.kind === "User") {
        result.param.name = inner.name || inner.value;
      } else {
        this.error("Rest parameter must be an identifier");
      }
    } else if (arg.type === "BinaryOperation" && arg.operator === "?=") {
      result.param.name = arg.left.name || arg.left.value;
      result.param.holeDefault = arg.right;
    } else if (arg.type === "BinaryOperation" && arg.operator === "?") {
      result.param.name = arg.left.name || arg.left.value;
      result.condition = arg.right;
    } else if (arg.type === "UserIdentifier" || arg.type === "Identifier" && arg.kind === "User") {
      result.param.name = arg.name || arg.value;
    }
    return result;
  }
  parseStatement() {
    if (this.current.type === "End") {
      return null;
    }
    if (this.current.type === "String" && this.current.kind === "comment") {
      const commentToken = this.current;
      this.advance();
      return this.createNode("Comment", {
        value: commentToken.value,
        kind: commentToken.kind,
        original: commentToken.original,
        pos: commentToken.pos
      });
    }
    const expr = this.parseExpression(0);
    if (this.current.value === ";") {
      this.advance();
      return this.createNode("Statement", {
        expression: expr,
        pos: expr.pos,
        original: expr.original
      });
    }
    return expr;
  }
  drainComments(statements) {
    while (this.skippedComments.length > 0) {
      const commentToken = this.skippedComments.shift();
      statements.push(this.createNode("Comment", {
        value: commentToken.value,
        kind: commentToken.kind,
        original: commentToken.original,
        pos: commentToken.pos
      }));
    }
  }
  parse() {
    const statements = [];
    this.drainComments(statements);
    while (this.current.type !== "End") {
      if (this.current.type === "String" && this.current.kind === "comment") {
        const commentToken = this.current;
        this.advance();
        statements.push(this.createNode("Comment", {
          value: commentToken.value,
          kind: commentToken.kind,
          original: commentToken.original,
          pos: commentToken.pos
        }));
        this.drainComments(statements);
        continue;
      }
      const stmt = this.parseStatement();
      if (stmt) {
        statements.push(stmt);
      }
      this.drainComments(statements);
    }
    return statements;
  }
  parseCall(target) {
    if (target.type === "UserIdentifier" && /^[\p{L}]/u.test(target.name) || target.type === "Number" || target.type === "Grouping" && !this.isCallableNode(target)) {
      const grouping = this.parseGrouping();
      return this.createNode("ImplicitMultiplication", {
        left: target,
        right: grouping,
        pos: [target.pos[0], target.pos[0], grouping.pos[2]],
        original: target.original + grouping.original
      });
    }
    this.advance();
    const args = this.parseFunctionCallArgs();
    if (this.current.value !== ")") {
      this.error("Expected closing parenthesis in function call");
    }
    this.advance();
    if (target.type === "SystemFunctionRef") {
      return this.createNode("SystemCall", {
        name: target.name,
        arguments: args,
        pos: target.pos,
        original: target.original + "(...)"
      });
    }
    if (target.type === "SystemAccess") {
      return this.createNode("SystemCall", {
        name: target.property,
        arguments: args,
        pos: target.pos,
        original: target.original + "(...)",
        viaSystemContext: true
      });
    }
    if (target.type === "DotAccess") {
      return this.createNode("MethodCall", {
        object: target.object,
        method: target.property,
        arguments: args,
        pos: target.pos,
        original: target.original + "(...)"
      });
    }
    if (target.type === "SystemIdentifier" || target.type === "UserIdentifier") {
      return this.createNode("FunctionCall", {
        function: target,
        arguments: args,
        pos: target.pos,
        original: target.original + "(...)"
      });
    }
    return this.createNode("Call", {
      target,
      arguments: args,
      pos: target.pos,
      original: target.original + "(...)"
    });
  }
  parseAt(target) {
    this.advance();
    if (this.current.value !== "(") {
      this.error("Expected opening parenthesis after @ operator");
    }
    this.advance();
    const arg = this.parseExpression(0);
    if (this.current.value !== ")") {
      this.error("Expected closing parenthesis in @ operator");
    }
    this.advance();
    return this.createNode("At", {
      target,
      arg,
      pos: target.pos,
      original: target.original + "@(" + (arg.original || "") + ")"
    });
  }
  parseAsk(target) {
    this.advance();
    if (this.current.value !== "(") {
      this.error("Expected opening parenthesis after ? operator");
    }
    this.advance();
    const arg = this.parseExpression(0);
    if (this.current.value !== ")") {
      this.error("Expected closing parenthesis in ? operator");
    }
    this.advance();
    return this.createNode("Ask", {
      target,
      arg,
      pos: target.pos,
      original: target.original + "?(" + (arg.original || "") + ")"
    });
  }
  parseScientificUnit(target) {
    const startToken = this.current;
    this.advance();
    let unitContent = "";
    let unitOriginal = "";
    while (this.current.type !== "End") {
      if (this.current.value === "[") {
        this.error("Nested '[' not allowed inside scientific unit ~[...]");
      } else if (this.current.value === "]") {
        break;
      }
      unitContent += this.current.original;
      unitOriginal += this.current.original;
      this.advance();
    }
    if (this.current.value !== "]") {
      this.error("Expected closing bracket ] for scientific unit");
    }
    this.advance();
    return this.createNode("ScientificUnit", {
      target,
      unit: unitContent.trim(),
      pos: target.pos,
      original: target.original + startToken.original + unitOriginal + "]"
    });
  }
  parseMathematicalUnit(target) {
    const startToken = this.current;
    this.advance();
    let unitContent = "";
    let unitOriginal = "";
    while (this.current.type !== "End") {
      if (this.current.value === "{") {
        this.error("Nested '{' not allowed inside mathematical unit ~{...}");
      } else if (this.current.value === "}") {
        break;
      }
      unitContent += this.current.original;
      unitOriginal += this.current.original;
      this.advance();
    }
    if (this.current.value !== "}") {
      this.error("Expected closing brace } for mathematical unit");
    }
    this.advance();
    return this.createNode("MathematicalUnit", {
      target,
      unit: unitContent.trim(),
      pos: target.pos,
      original: target.original + startToken.original + unitOriginal + "}"
    });
  }
}
function parse(input, systemLookup) {
  let tokens;
  let source = "";
  if (typeof input === "string") {
    source = input;
    tokens = tokenize(input);
  } else {
    tokens = input;
  }
  const parser = new Parser(tokens, systemLookup, source);
  return parser.parse();
}
// ../rix/src/parser/system-loader.js
var DEFAULT_SYSTEM_REGISTRY = {
  SIN: {
    type: "function",
    arity: 1,
    precedence: 120,
    category: "trigonometric"
  },
  COS: {
    type: "function",
    arity: 1,
    precedence: 120,
    category: "trigonometric"
  },
  TAN: {
    type: "function",
    arity: 1,
    precedence: 120,
    category: "trigonometric"
  },
  LOG: { type: "function", arity: 1, precedence: 120, category: "logarithmic" },
  EXP: { type: "function", arity: 1, precedence: 120, category: "exponential" },
  SQRT: { type: "function", arity: 1, precedence: 120, category: "arithmetic" },
  ABS: { type: "function", arity: 1, precedence: 120, category: "arithmetic" },
  MAX: { type: "function", arity: -1, precedence: 120, category: "aggregate" },
  MIN: { type: "function", arity: -1, precedence: 120, category: "aggregate" },
  SUM: { type: "function", arity: -1, precedence: 120, category: "aggregate" },
  PI: { type: "constant", value: Math.PI, category: "mathematical" },
  EX: { type: "constant", value: Math.E, category: "mathematical" },
  INFINITY: { type: "constant", value: Infinity, category: "mathematical" },
  I: { type: "constant", category: "complex" },
  LIST: { type: "constructor", category: "collection" },
  SET: { type: "constructor", category: "collection" },
  MAP: { type: "constructor", category: "collection" },
  TUPLE: { type: "constructor", category: "collection" },
  TYPE: { type: "function", arity: 1, precedence: 120, category: "meta" },
  HELP: { type: "function", arity: -1, precedence: 120, category: "meta" },
  INFO: { type: "function", arity: 1, precedence: 120, category: "meta" }
};
var isBrowser = typeof window !== "undefined" && typeof document !== "undefined";

class SystemLoader {
  constructor(options = {}) {
    this.coreRegistry = new Map(Object.entries(DEFAULT_SYSTEM_REGISTRY));
    this.systemRegistry = new Map;
    this.operatorRegistry = new Map;
    this.keywordRegistry = new Map;
    this.hooks = new Map;
    this.contexts = new Map;
    this.config = {
      allowUserOverrides: options.allowUserOverrides ?? false,
      strictMode: options.strictMode ?? false,
      browserIntegration: options.browserIntegration ?? isBrowser,
      moduleLoader: options.moduleLoader ?? null,
      ...options
    };
    this.initializeDefaultKeywords();
    if (this.config.browserIntegration) {
      this.setupBrowserIntegration();
    }
  }
  initializeDefaultKeywords() {
    this.registerKeyword("AND", {
      type: "operator",
      precedence: 40,
      associativity: "left",
      operatorType: "infix",
      category: "logical"
    });
    this.registerKeyword("OR", {
      type: "operator",
      precedence: 30,
      associativity: "left",
      operatorType: "infix",
      category: "logical"
    });
    this.registerKeyword("NOT", {
      type: "operator",
      precedence: 110,
      operatorType: "prefix",
      category: "logical"
    });
    this.registerKeyword("IF", {
      type: "control",
      structure: "conditional",
      precedence: 5,
      category: "control"
    });
    this.registerKeyword("ELSE", {
      type: "control",
      structure: "conditional",
      precedence: 5,
      category: "control"
    });
    this.registerKeyword("WHILE", {
      type: "control",
      structure: "loop",
      precedence: 5,
      category: "control"
    });
    this.registerKeyword("FOR", {
      type: "control",
      structure: "loop",
      precedence: 5,
      category: "control"
    });
    this.registerKeyword("IN", {
      type: "operator",
      precedence: 60,
      associativity: "left",
      operatorType: "infix",
      category: "set"
    });
    this.registerKeyword("UNION", {
      type: "operator",
      precedence: 50,
      associativity: "left",
      operatorType: "infix",
      category: "set"
    });
    this.registerKeyword("INTERSECT", {
      type: "operator",
      precedence: 50,
      associativity: "left",
      operatorType: "infix",
      category: "set"
    });
  }
  registerSystem(name, definition) {
    if (!name || typeof name !== "string") {
      throw new Error("System symbol name must be a non-empty string");
    }
    const normalizedName = name.toUpperCase();
    const validatedDef = this.validateDefinition(definition);
    if (this.config.strictMode && this.coreRegistry.has(normalizedName)) {
      throw new Error(`Cannot override core system symbol: ${normalizedName}`);
    }
    this.systemRegistry.set(normalizedName, {
      ...validatedDef,
      source: "system",
      registered: Date.now()
    });
    this.triggerHook("system-registered", {
      name: normalizedName,
      definition: validatedDef
    });
    return this;
  }
  registerKeyword(name, definition) {
    const normalizedName = name.toUpperCase();
    const validatedDef = this.validateDefinition(definition);
    this.keywordRegistry.set(normalizedName, {
      ...validatedDef,
      source: "keyword",
      registered: Date.now()
    });
    this.triggerHook("keyword-registered", {
      name: normalizedName,
      definition: validatedDef
    });
    return this;
  }
  registerOperator(symbol, definition) {
    if (!symbol || typeof symbol !== "string") {
      throw new Error("Operator symbol must be a non-empty string");
    }
    const validatedDef = this.validateOperatorDefinition(definition);
    this.operatorRegistry.set(symbol, {
      ...validatedDef,
      source: "operator",
      registered: Date.now()
    });
    this.triggerHook("operator-registered", {
      symbol,
      definition: validatedDef
    });
    return this;
  }
  lookup(name) {
    const normalizedName = name.toUpperCase();
    if (this.keywordRegistry.has(normalizedName)) {
      const def = this.keywordRegistry.get(normalizedName);
      if (def.type === "control") {
        return this.enrichDefinition({
          ...def,
          functionalForm: true,
          type: "function",
          controlType: def.type,
          arity: this.getControlArity(normalizedName, def)
        }, normalizedName);
      }
      return this.enrichDefinition(def, normalizedName);
    }
    if (this.systemRegistry.has(normalizedName)) {
      const def = this.systemRegistry.get(normalizedName);
      return this.enrichDefinition(def, normalizedName);
    }
    if (this.coreRegistry.has(normalizedName)) {
      const def = this.coreRegistry.get(normalizedName);
      return this.enrichDefinition(def, normalizedName);
    }
    return { type: "identifier", name: normalizedName, source: "unknown" };
  }
  validateDefinition(definition) {
    if (!definition || typeof definition !== "object") {
      throw new Error("Definition must be an object");
    }
    const { type } = definition;
    if (!type || typeof type !== "string") {
      throw new Error("Definition must have a type property");
    }
    switch (type) {
      case "operator":
        if (!definition.precedence || typeof definition.precedence !== "number") {
          throw new Error("Operator definition must have numeric precedence");
        }
        break;
      case "function":
        if (definition.arity !== undefined && typeof definition.arity !== "number") {
          throw new Error("Function arity must be a number or undefined");
        }
        break;
      case "control":
        if (!definition.structure || typeof definition.structure !== "string") {
          throw new Error("Control definition must have a structure property");
        }
        break;
    }
    return { ...definition };
  }
  validateOperatorDefinition(definition) {
    const validated = this.validateDefinition(definition);
    if (validated.type !== "operator") {
      validated.type = "operator";
    }
    if (!validated.precedence) {
      validated.precedence = 50;
    }
    if (!validated.associativity) {
      validated.associativity = "left";
    }
    if (!validated.operatorType) {
      validated.operatorType = "infix";
    }
    return validated;
  }
  enrichDefinition(definition, name) {
    return {
      ...definition,
      name,
      resolvedAt: Date.now(),
      context: this.getCurrentContext()
    };
  }
  registerHook(eventName, callback) {
    if (!this.hooks.has(eventName)) {
      this.hooks.set(eventName, []);
    }
    this.hooks.get(eventName).push(callback);
    return this;
  }
  triggerHook(eventName, data) {
    if (this.hooks.has(eventName)) {
      this.hooks.get(eventName).forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.warn(`Hook ${eventName} failed:`, error);
        }
      });
    }
  }
  setupBrowserIntegration() {
    if (!isBrowser)
      return;
    if (typeof window.RiX === "undefined") {
      window.RiX = {};
    }
    window.RiX.SystemLoader = this;
    window.RiX.registerSystem = (name, def) => this.registerSystem(name, def);
    window.RiX.registerKeyword = (name, def) => this.registerKeyword(name, def);
    window.RiX.registerOperator = (symbol, def) => this.registerOperator(symbol, def);
    if (!this.config.moduleLoader) {
      this.config.moduleLoader = this.createBrowserModuleLoader();
    }
    document.addEventListener("rix-system-define", (event) => {
      const { name, definition } = event.detail;
      this.registerSystem(name, definition);
    });
    document.addEventListener("rix-keyword-define", (event) => {
      const { name, definition } = event.detail;
      this.registerKeyword(name, definition);
    });
  }
  createBrowserModuleLoader() {
    return {
      async load(moduleSpec) {
        if (moduleSpec.startsWith("http://") || moduleSpec.startsWith("https://")) {
          const response = await fetch(moduleSpec);
          const code = await response.text();
          return this.evaluateModule(code);
        } else if (moduleSpec.startsWith("data:")) {
          const code = decodeURIComponent(moduleSpec.split(",")[1]);
          return this.evaluateModule(code);
        } else {
          const scriptTag = document.getElementById(moduleSpec);
          if (scriptTag && scriptTag.type === "text/rix-system") {
            return this.evaluateModule(scriptTag.textContent);
          }
        }
        throw new Error(`Cannot load module: ${moduleSpec}`);
      },
      evaluateModule(code) {
        try {
          const moduleFunction = new Function("SystemLoader", "registerSystem", "registerKeyword", "registerOperator", code);
          return moduleFunction(this, (name, def) => this.registerSystem(name, def), (name, def) => this.registerKeyword(name, def), (symbol, def) => this.registerOperator(symbol, def));
        } catch (error) {
          throw new Error(`Module evaluation failed: ${error.message}`);
        }
      }
    };
  }
  async loadModule(moduleSpec) {
    if (!this.config.moduleLoader) {
      throw new Error("No module loader configured");
    }
    try {
      const result = await this.config.moduleLoader.load(moduleSpec);
      this.triggerHook("module-loaded", { moduleSpec, result });
      return result;
    } catch (error) {
      this.triggerHook("module-load-error", { moduleSpec, error });
      throw error;
    }
  }
  createContext(name, parentContext = null) {
    const context = {
      name,
      parent: parentContext,
      created: Date.now(),
      symbols: new Map,
      operators: new Map
    };
    this.contexts.set(name, context);
    return context;
  }
  getCurrentContext() {
    return "global";
  }
  getControlArity(name, definition) {
    switch (definition.structure) {
      case "conditional":
        return name === "IF" ? -1 : 1;
      case "loop":
        return name === "FOR" ? 4 : 2;
      case "loop_body":
      case "loop_terminator":
      case "block_end":
        return 1;
      default:
        return -1;
    }
  }
  transformFunctionalForm(name, args, definition) {
    switch (name) {
      case "WHILE":
        if (args.length >= 2) {
          return {
            type: "ControlStructure",
            keyword: "WHILE",
            condition: args[0],
            body: args[1],
            structure: "while_loop",
            functionalOrigin: true
          };
        }
        break;
      case "IF":
        if (args.length >= 2) {
          const result = {
            type: "ControlStructure",
            keyword: "IF",
            condition: args[0],
            thenBranch: args[1],
            structure: "conditional",
            functionalOrigin: true
          };
          if (args.length >= 3) {
            result.elseBranch = args[2];
          }
          return result;
        }
        break;
      case "FOR":
        if (args.length >= 4) {
          return {
            type: "ControlStructure",
            keyword: "FOR",
            init: args[0],
            condition: args[1],
            increment: args[2],
            body: args[3],
            structure: "for_loop",
            functionalOrigin: true
          };
        }
        break;
    }
    return {
      type: "FunctionCall",
      function: { type: "SystemIdentifier", name, systemInfo: definition },
      arguments: args,
      functionalForm: true
    };
  }
  getSymbolsByCategory(category) {
    const result = [];
    [this.coreRegistry, this.systemRegistry, this.keywordRegistry].forEach((registry) => {
      for (const [name, definition] of registry) {
        if (definition.category === category) {
          result.push({ name, ...definition });
        }
      }
    });
    return result;
  }
  createParserLookup() {
    return (name) => this.lookup(name);
  }
  exportConfig() {
    return {
      core: Array.from(this.coreRegistry.entries()),
      system: Array.from(this.systemRegistry.entries()),
      keywords: Array.from(this.keywordRegistry.entries()),
      operators: Array.from(this.operatorRegistry.entries()),
      config: { ...this.config }
    };
  }
  importConfig(config) {
    if (config.system) {
      config.system.forEach(([name, def]) => this.systemRegistry.set(name, def));
    }
    if (config.keywords) {
      config.keywords.forEach(([name, def]) => this.keywordRegistry.set(name, def));
    }
    if (config.operators) {
      config.operators.forEach(([symbol, def]) => this.operatorRegistry.set(symbol, def));
    }
    this.triggerHook("config-imported", config);
  }
}
var defaultSystemLoader = new SystemLoader;
// ../rix/src/eval/ir.js
function ir(fn, ...args) {
  return { fn, args };
}

// ../rix/src/eval/lower.js
var BINARY_OP_MAP = {
  "+": "ADD",
  "-": "SUB",
  "*": "MUL",
  "/": "DIV",
  "//": "INTDIV",
  "%": "MOD",
  "^": "POW",
  "**": "POWPROD",
  "==": "EQ",
  "!=": "NEQ",
  "<": "LT",
  ">": "GT",
  "<=": "LTE",
  ">=": "GTE",
  "===": "SAME_CELL",
  AND: "AND",
  "&&": "AND",
  OR: "OR",
  "||": "OR",
  "\\/": "UNION",
  "/\\": "INTERSECT",
  "\\": "SET_DIFF",
  "<>": "SET_SYMDIFF",
  "?": "MEMBER",
  "!?": "NOT_MEMBER",
  "?&": "INTERSECTS",
  "++": "CONCAT",
  "/^": "DIVUP",
  "/~": "DIVROUND",
  "/%": "DIVMOD",
  "?|": "HOLE_COALESCE"
};
function lower(ast) {
  if (!Array.isArray(ast)) {
    return lowerNode(ast);
  }
  return ast.map(lowerNode);
}
function lowerNode(node) {
  if (!node || !node.type) {
    return node;
  }
  const handler = LOWERERS[node.type];
  if (!handler) {
    throw new Error(`Unknown AST node type: ${node.type}`);
  }
  const result = handler(node);
  if (result && typeof result === "object" && !Array.isArray(result) && node.pos) {
    result.pos = node.pos;
  }
  return result;
}
function lowerFunctionBody(node) {
  if (!node || !node.type) {
    return lowerNode(node);
  }
  if (node.type === "Grouping") {
    if (node.expression) {
      return lowerFunctionBody(node.expression);
    }
    return ir("NULL");
  }
  if (node.type === "TernaryOperation") {
    return ir("TERNARY", lowerNode(node.condition), ir("DEFER", lowerFunctionBody(node.trueExpression)), ir("DEFER", lowerFunctionBody(node.falseExpression)));
  }
  if (node.type === "Call" && node.target?.type === "SelfRef") {
    const args = lowerCallArgs(node.arguments);
    return ir("TAIL_SELF", ...args);
  }
  if (node.type === "BlockContainer" || node.type === "SystemContainer") {
    const elements = node.elements || [];
    const loweredElements = elements.map((element, index) => index === elements.length - 1 ? lowerFunctionBody(element) : lowerNode(element));
    const fn = node.type === "BlockContainer" ? "BLOCK" : "SYSTEM";
    const hasMeta = node.imports && node.imports.length > 0 || node.name;
    if (!hasMeta) {
      return ir(fn, ...loweredElements);
    }
    const meta = {};
    if (node.imports && node.imports.length > 0)
      meta.imports = lowerImports(node.imports);
    if (node.name)
      meta.name = node.name;
    return ir(fn, meta, ...loweredElements);
  }
  return lowerNode(node);
}
var COMBO_ASSIGN_OP_MAP = {
  "+=": "+",
  "-=": "-",
  "*=": "*",
  "++=": "++",
  "/=": "/",
  "//=": "//",
  "/\\=": "/\\",
  "/^=": "/^",
  "/~=": "/~",
  "%=": "%",
  "^=": "^",
  "**=": "**",
  "\\/=": "\\/",
  "\\=": "\\"
};
var LOWERERS = {
  Number(node) {
    if (node.value && node.value.includes(":")) {
      const parts = node.value.split(":");
      return ir("INTERVAL", ...parts.map((p) => ir("LITERAL", p)));
    }
    return ir("LITERAL", node.value);
  },
  String(node) {
    return ir("STRING", node.value);
  },
  ScriptImportExpression(node) {
    return ir("SCRIPT_IMPORT", {
      path: node.path.value,
      capabilityModifiers: lowerCapabilityModifiers(node.capabilityModifiers || []),
      inputs: lowerBindingSpecs(node.inputs || []),
      outputs: lowerBindingSpecs(node.outputs || [])
    });
  },
  ScriptBindingsDeclaration() {
    throw new Error("Script input/export declarations are only valid as the first or last statement of an imported script");
  },
  RegexLiteral(node) {
    const modeMap = {
      ONE: 0,
      TEST: 1,
      ALL: 2,
      ITER: 3
    };
    return ir("REGEX", ir("STRING", node.pattern), ir("STRING", node.flags), ir("LITERAL", modeMap[node.mode] || 0));
  },
  NULL() {
    return ir("NULL");
  },
  Hole() {
    return ir("HOLE");
  },
  SemanticHas(node) {
    return ir("SEMANTIC_HAS", lowerNode(node.expression), node.name);
  },
  SemanticConvertSoft(node) {
    return ir("SEMANTIC_CONVERT_SOFT", lowerNode(node.expression), node.typeName);
  },
  SemanticConvertStrict(node) {
    return ir("SEMANTIC_CONVERT_STRICT", lowerNode(node.expression), node.typeName);
  },
  SelfRef() {
    return ir("SELF");
  },
  ParentSelfRef() {
    return ir("PARENT_SELF");
  },
  UserIdentifier(node) {
    return ir("RETRIEVE", node.name);
  },
  SystemIdentifier(node) {
    if (node.original && node.original.trim().startsWith("@")) {
      return ir("SYSREF", node.name);
    }
    return ir("RETRIEVE", node.name);
  },
  OuterIdentifier(node) {
    return ir("OUTER_RETRIEVE", node.name);
  },
  SystemFunctionRef(node) {
    return ir("SYSREF", node.name);
  },
  PlaceHolder(node) {
    return ir("PLACEHOLDER", node.place);
  },
  Statement(node) {
    return lowerNode(node.expression);
  },
  SequenceExpression(node) {
    return ir("SEQ", ...node.expressions.map(lowerNode));
  },
  Comment() {
    return ir("NOP");
  },
  BinaryOperation(node) {
    const op = node.operator;
    if (op === "=" || op === ":=" || op === "~=" || op === "::=" || op === "~~=") {
      const leftType = node.left?.type || "";
      if (leftType.startsWith("Destructure")) {
        return ir("DESTRUCTURE_ASSIGN", lowerDestructureTarget(node.left), op, lowerNode(node.right));
      }
    }
    if (op === "=")
      return lowerAssignment(node, "ASSIGN");
    if (op === ":=")
      return lowerAssignment(node, "ASSIGN_COPY");
    if (op === "~=")
      return lowerAssignment(node, "ASSIGN_UPDATE");
    if (op === "::=")
      return lowerAssignment(node, "ASSIGN_DEEP_COPY");
    if (op === "~~=")
      return lowerAssignment(node, "ASSIGN_DEEP_UPDATE");
    if (op === ".=") {
      return ir("META_MERGE", lowerNode(node.left), lowerNode(node.right));
    }
    const mathOpStr = COMBO_ASSIGN_OP_MAP[op];
    if (mathOpStr) {
      const mathAstNode = {
        type: "BinaryOperation",
        operator: mathOpStr,
        left: node.left,
        right: node.right,
        pos: node.pos
      };
      const assignAstNode = {
        type: "BinaryOperation",
        operator: "~=",
        left: node.left,
        right: mathAstNode,
        pos: node.pos
      };
      return lowerAssignment(assignAstNode, "ASSIGN_UPDATE");
    }
    if (op === ":=:") {
      const left = node.left;
      if (left.type === "UserIdentifier" || left.type === "SystemIdentifier") {
        return ir("SOLVE", left.name, lowerNode(node.right));
      }
      return ir("SOLVE", lowerNode(left), lowerNode(node.right));
    }
    if (op === ":<:") {
      return ir("ASSERT_LT", lowerNode(node.left), lowerNode(node.right));
    }
    if (op === ":>:") {
      return ir("ASSERT_GT", lowerNode(node.left), lowerNode(node.right));
    }
    if (op === ":>=:") {
      return ir("ASSERT_GTE", lowerNode(node.left), lowerNode(node.right));
    }
    if (op === ":<=:") {
      return ir("ASSERT_LTE", lowerNode(node.left), lowerNode(node.right));
    }
    if (op === ":") {
      const args = [];
      const extractArgs = (n) => {
        if (n && n.type === "BinaryOperation" && n.operator === ":") {
          extractArgs(n.left);
          extractArgs(n.right);
        } else {
          const lowered = lowerNode(n);
          if (lowered && typeof lowered === "object" && lowered.fn === "INTERVAL") {
            args.push(...lowered.args);
          } else {
            args.push(lowered);
          }
        }
      };
      extractArgs(node.left);
      extractArgs(node.right);
      return ir("INTERVAL", ...args);
    }
    if (op === "_>") {
      return ir("TOBASE", lowerNode(node.left), lowerNode(node.right));
    }
    if (op === "<_") {
      return ir("FROMBASE", lowerNode(node.left), lowerNode(node.right));
    }
    if (op === "?=") {
      throw new Error(`'?=' is not a comparison operator — use '==' for equality comparison, or use '?=' only in parameter default position (e.g., (x ?= 2) -> ...)`);
    }
    const sysFn = BINARY_OP_MAP[op];
    if (sysFn) {
      return ir(sysFn, lowerNode(node.left), lowerNode(node.right));
    }
    if (op.startsWith("|")) {
      return ir("PIPE_OP", op, lowerNode(node.left), lowerNode(node.right));
    }
    if (op === "->") {
      const left = node.left;
      if (left.type === "FunctionCall" && left.function) {
        const fn = left.function;
        const funcName = fn.name || fn.value;
        if (funcName) {
          const positionalArgs = left.arguments?.positional || [];
          const paramPosArgs = positionalArgs.map((arg) => ({
            name: arg.name || arg.value || String(arg),
            defaultValue: null
          }));
          const params = lowerParams({
            positional: paramPosArgs,
            keyword: [],
            conditionals: [],
            metadata: {}
          });
          const body = lowerFunctionBody(node.right);
          return ir("FUNCDEF", funcName, params, body);
        }
      }
    }
    return ir("BINOP", op, lowerNode(node.left), lowerNode(node.right));
  },
  UnaryOperation(node) {
    if (node.operator === "-") {
      return ir("NEG", lowerNode(node.operand));
    }
    if (node.operator === "+") {
      return lowerNode(node.operand);
    }
    if (node.operator === "NOT" || node.operator === "!") {
      return ir("NOT", lowerNode(node.operand));
    }
    return ir("UNARY", node.operator, lowerNode(node.operand));
  },
  ImplicitMultiplication(node) {
    return ir("MUL", lowerNode(node.left), lowerNode(node.right));
  },
  ImplicitApplication(node) {
    const callable = node.callable;
    const arg = lowerNode(node.argument);
    if (callable.type === "SystemIdentifier" || callable.type === "UserIdentifier") {
      return ir("CALL", callable.name, arg);
    }
    return ir("CALL_EXPR", lowerNode(callable), arg);
  },
  FunctionCall(node) {
    const fn = node.function;
    const args = lowerCallArgs(node.arguments);
    if (fn.type === "SystemIdentifier" || fn.type === "UserIdentifier") {
      const name = fn.name;
      if (args.length === 1) {
        if (name === "-")
          return ir("NEG", args[0]);
        if (name === "+")
          return args[0];
        if (name === "!" || name === "NOT")
          return ir("NOT", args[0]);
      } else if (args.length === 2) {
        if (name === "+")
          return ir("ADD", args[0], args[1]);
        if (name === "-")
          return ir("SUB", args[0], args[1]);
        if (name === "*")
          return ir("MUL", args[0], args[1]);
        if (name === "/")
          return ir("DIV", args[0], args[1]);
      }
      if (node.fromBrace) {
        return ir(name, ...args);
      }
      return ir("CALL", name, ...args);
    }
    return ir("CALL_EXPR", lowerNode(fn), ...args);
  },
  SystemCall(node) {
    const args = lowerCallArgs(node.arguments);
    return ir("SYS_CALL", node.name, ...args);
  },
  SystemCapabilityCall(node) {
    const args = lowerCallArgs(node.arguments);
    return ir("SYS_CALL", node.property, ...args);
  },
  SystemObject(_node) {
    return ir("SYS_OBJ");
  },
  SystemAccess(node) {
    return ir("SYS_GET", node.property);
  },
  Call(node) {
    const args = lowerCallArgs(node.arguments);
    return ir("CALL_EXPR", lowerNode(node.target), ...args);
  },
  MethodCall(node) {
    const args = lowerCallArgs(node.arguments);
    return ir("CALL_METHOD", lowerNode(node.object), node.method, ...args);
  },
  FunctionDefinition(node) {
    const name = node.name.name || node.name.value;
    const params = lowerParams(node.parameters, node.prep, node.prepStrict, node.variantName);
    const body = lowerFunctionBody(node.body);
    return ir("FUNCDEF", name, params, body);
  },
  FunctionLambda(node) {
    const params = lowerParams(node.parameters, node.prep, node.prepStrict, node.variantName);
    const body = lowerFunctionBody(node.body);
    return ir("LAMBDA", params, body);
  },
  FunctionVariantDefinition(node) {
    const name = node.name.name || node.name.value;
    const params = lowerParams(node.parameters, node.prep, node.prepStrict, node.variantName);
    const body = lowerFunctionBody(node.body);
    return ir("MULTIFUNCDEF", name, node.mode, params, body);
  },
  PatternMatchingFunction(node) {
    const name = node.name.name || node.name.value;
    const patterns = node.patterns.map((p) => ({
      params: lowerParams(p.parameters),
      body: lowerFunctionBody(p.body)
    }));
    return ir("PATTERNDEF", name, patterns);
  },
  Grouping(node) {
    if (node.expression) {
      return lowerNode(node.expression);
    }
    return ir("NULL");
  },
  Tuple(node) {
    return ir("TUPLE", ...node.elements.map(lowerNode));
  },
  ParameterList(node) {
    return lowerParams(node.parameters);
  },
  Spread(node) {
    return ir("SPREAD", lowerNode(node.expression));
  },
  CapturedEntry(node) {
    return {
      captureMode: node.captureMode,
      expression: lowerNode(node.expression)
    };
  },
  SemanticHeader(node) {
    return {
      captureMode: node.captureMode || null,
      name: node.name || null,
      typeName: node.typeName || null,
      traits: (node.traits || []).map((trait) => ({
        name: trait.name,
        checkMode: trait.checkMode || null,
        order: trait.order ?? null
      }))
    };
  },
  MapEntry(node) {
    return {
      key: lowerNode(node.key),
      value: lowerNode(node.value),
      captureMode: node.captureMode || null,
      keyType: node.key?.type || null
    };
  },
  Array(node) {
    return ir("ARRAY", ...node.elements.map(lowerNode));
  },
  Matrix(node) {
    const rows = node.rows.map((row) => ir("ARRAY", ...row.map(lowerNode)));
    return ir("MATRIX", ...rows);
  },
  Tensor(node) {
    return ir("TENSOR", ...node.elements.map(lowerNode));
  },
  TensorLiteral(node) {
    const meta = node.header ? { header: lowerNode(node.header) } : null;
    return meta ? ir("TENSOR_LITERAL", meta, node.shape, ...node.elements.map(lowerNode)) : ir("TENSOR_LITERAL", node.shape, ...node.elements.map(lowerNode));
  },
  ValueOutfit(node) {
    const header = node.header ? lowerNode(node.header) : null;
    return header ? ir("VALUE_OUTFIT", header, lowerNode(node.expression)) : ir("VALUE_OUTFIT", null, lowerNode(node.expression));
  },
  MapContainer(node) {
    const constructorMeta = node.header ? { header: lowerNode(node.header) } : null;
    const loweredElements = node.elements.map((el) => {
      if (el?.type === "MapEntry") {
        const keyNode = el.key;
        if (keyNode?.type === "UserIdentifier" || keyNode?.type === "SystemIdentifier") {
          return ir("MAP_PAIR", "identifier", keyNode.name, lowerNode(el.value), el.captureMode || null);
        }
        if (keyNode?.type === "Grouping") {
          return ir("MAP_PAIR", "expression", lowerNode(keyNode.expression), lowerNode(el.value), el.captureMode || null);
        }
        throw new Error("Map key expressions must be parenthesized in literals: use {= (expr)=value }");
      }
      if (el && el.type === "BinaryOperation" && (el.operator === "=" || el.operator === ":=")) {
        if (el.left?.type === "UserIdentifier" || el.left?.type === "SystemIdentifier") {
          return ir("MAP_PAIR", "identifier", el.left.name, lowerNode(el.right), el.operator === ":=" ? "copy" : null);
        }
        if (el.left?.type === "Grouping") {
          return ir("MAP_PAIR", "expression", lowerNode(el.left.expression), lowerNode(el.right), el.operator === ":=" ? "copy" : null);
        }
        throw new Error("Map key expressions must be parenthesized in literals: use {= (expr)=value }");
      }
      return lowerNode(el);
    });
    return constructorMeta ? ir("MAP_OBJ", constructorMeta, ...loweredElements) : ir("MAP_OBJ", ...loweredElements);
  },
  CaseContainer(node) {
    const lowerCaseElement = (element) => {
      if (element?.type === "BinaryOperation" && element.operator === "?") {
        return ir("DEFER", ir("CONDITION", lowerNode(element.left), lowerNode(element.right)));
      }
      return ir("DEFER", lowerNode(element));
    };
    if (node.name) {
      return ir("CASE", { name: node.name }, ...node.elements.map(lowerCaseElement));
    }
    return ir("CASE", ...node.elements.map(lowerCaseElement));
  },
  BlockContainer(node) {
    const hasMeta = node.imports && node.imports.length > 0 || node.name;
    if (hasMeta) {
      const meta = {};
      if (node.imports && node.imports.length > 0)
        meta.imports = lowerImports(node.imports);
      if (node.name)
        meta.name = node.name;
      return ir("BLOCK", meta, ...node.elements.map(lowerNode));
    }
    return ir("BLOCK", ...node.elements.map(lowerNode));
  },
  SetContainer(node) {
    const meta = node.header ? { header: lowerNode(node.header) } : null;
    return meta ? ir("SET", meta, ...node.elements.map(lowerNode)) : ir("SET", ...node.elements.map(lowerNode));
  },
  TupleContainer(node) {
    const meta = node.header ? { header: lowerNode(node.header) } : null;
    return meta ? ir("TUPLE", meta, ...node.elements.map(lowerNode)) : ir("TUPLE", ...node.elements.map(lowerNode));
  },
  ArrayContainer(node) {
    const meta = node.header ? { header: lowerNode(node.header) } : null;
    return meta ? ir("ARRAY_CAPTURE", meta, ...node.elements.map(lowerNode)) : ir("ARRAY_CAPTURE", ...node.elements.map(lowerNode));
  },
  LoopContainer(node) {
    const hasMeta = node.imports && node.imports.length > 0 || node.name || node.maxIterations !== undefined || node.unlimited === true;
    if (hasMeta) {
      const meta = {};
      if (node.imports && node.imports.length > 0)
        meta.imports = lowerImports(node.imports);
      if (node.name)
        meta.name = node.name;
      if (node.maxIterations !== undefined)
        meta.maxIterations = node.maxIterations;
      if (node.unlimited === true)
        meta.unlimited = true;
      return ir("LOOP", meta, ...node.elements.map((el) => ir("DEFER", lowerNode(el))));
    }
    return ir("LOOP", ...node.elements.map((el) => ir("DEFER", lowerNode(el))));
  },
  SystemContainer(node) {
    const hasMeta = node.imports && node.imports.length > 0 || node.name;
    if (hasMeta) {
      const meta = {};
      if (node.imports && node.imports.length > 0)
        meta.imports = lowerImports(node.imports);
      if (node.name)
        meta.name = node.name;
      return ir("SYSTEM", meta, ...node.elements.map(lowerNode));
    }
    return ir("SYSTEM", ...node.elements.map(lowerNode));
  },
  SystemSpecLiteral(node) {
    const meta = {
      inputs: [...node.inputs || []],
      outputs: [...node.outputs || []],
      outputsDeclared: node.outputsDeclared === true,
      statements: (node.statements || []).map((statement) => ({
        kind: "assign",
        target: statement.target,
        expr: lowerNode(statement.expr)
      }))
    };
    if (node.imports && node.imports.length > 0) {
      meta.imports = lowerImports(node.imports);
    }
    return ir("SYSTEM_SPEC", meta);
  },
  SpecAssign(node) {
    return {
      kind: "assign",
      target: node.target,
      expr: lowerNode(node.expr)
    };
  },
  BreakBlock(node) {
    const meta = {};
    if (node.targetType)
      meta.targetType = node.targetType;
    if (node.targetName)
      meta.targetName = node.targetName;
    return ir("BREAK", meta, lowerNode(node.value));
  },
  DeferredBlock(node) {
    return ir("DEFER", lowerNode(node.body));
  },
  DotAccess(node) {
    return ir("META_GET", lowerNode(node.object), node.property);
  },
  PropertyAccess(node) {
    const obj = lowerNode(node.object);
    if (node.property && node.property.type === "KeyLiteral") {
      return ir("INDEX_GET", obj, node.property.name);
    }
    return ir("INDEX_GET", obj, lowerNode(node.property));
  },
  BracketIndex(node) {
    return ir("BRACKET_GET", lowerNode(node.object), node.specs.length, ...node.specs.map(lowerBracketSpec));
  },
  ExternalAccess(node) {
    return ir("META_ALL", lowerNode(node.object));
  },
  KeySet(node) {
    return ir("KEYS", lowerNode(node.object));
  },
  ValueSet(node) {
    return ir("VALUES", lowerNode(node.object));
  },
  Mutation(node) {
    const target = lowerNode(node.target);
    const ops = node.operations.map((op) => ({
      action: op.action,
      key: op.key,
      value: op.value ? lowerNode(op.value) : null
    }));
    const fn = node.mutate ? "MUTINPLACE" : "MUTCOPY";
    return ir(fn, target, ops);
  },
  Pipe(node) {
    return ir("PIPE", lowerNode(node.left), lowerNode(node.right));
  },
  ExplicitPipe(node) {
    return ir("PIPE_EXPLICIT", lowerNode(node.left), lowerNode(node.right));
  },
  SliceStrict(node) {
    return ir("PSLICE_STRICT", lowerNode(node.left), lowerNode(node.right));
  },
  SliceClamp(node) {
    return ir("PSLICE_CLAMP", lowerNode(node.left), lowerNode(node.right));
  },
  Split(node) {
    return ir("PSPLIT", lowerNode(node.left), lowerNode(node.right));
  },
  Chunk(node) {
    return ir("PCHUNK", lowerNode(node.left), lowerNode(node.right));
  },
  Map(node) {
    return ir("PMAP", lowerNode(node.left), lowerNode(node.right));
  },
  Filter(node) {
    return ir("PFILTER", lowerNode(node.left), lowerNode(node.right));
  },
  Every(node) {
    return ir("PALL", lowerNode(node.left), lowerNode(node.right));
  },
  Some(node) {
    return ir("PANY", lowerNode(node.left), lowerNode(node.right));
  },
  Reduce(node) {
    if (node.init) {
      return ir("PREDUCE", lowerNode(node.left), lowerNode(node.right), lowerNode(node.init));
    }
    return ir("PREDUCE", lowerNode(node.left), lowerNode(node.right));
  },
  Reverse(node) {
    return ir("PREVERSE", lowerNode(node.target));
  },
  Sort(node) {
    return ir("PSORT", lowerNode(node.left), lowerNode(node.right));
  },
  TernaryOperation(node) {
    return ir("TERNARY", lowerNode(node.condition), ir("DEFER", lowerNode(node.trueExpression)), ir("DEFER", lowerNode(node.falseExpression)));
  },
  At(node) {
    return ir("AT", lowerNode(node.target), lowerNode(node.arg));
  },
  Ask(node) {
    return ir("ASK", lowerNode(node.target), lowerNode(node.arg));
  },
  Transpose(node) {
    return ir("TENSOR_TRANSPOSE", lowerNode(node.expression));
  },
  Derivative(node) {
    return ir("DERIVATIVE", lowerNode(node.function), node.order);
  },
  Integral(node) {
    return ir("INTEGRAL", lowerNode(node.expression));
  },
  IntervalStepping(node) {
    return ir("STEP", lowerNode(node.interval), lowerNode(node.step));
  },
  IntervalDivision(node) {
    return ir("DIVIDE", lowerNode(node.interval), lowerNode(node.count));
  },
  IntervalPartition(node) {
    return ir("PARTITION", lowerNode(node.interval), lowerNode(node.count));
  },
  IntervalMediants(node) {
    return ir("MEDIANTS", lowerNode(node.interval), lowerNode(node.levels));
  },
  IntervalMediantPartition(node) {
    return ir("MEDIANT_PARTITION", lowerNode(node.interval), lowerNode(node.levels));
  },
  IntervalRandom(node) {
    return ir("RANDOM", lowerNode(node.interval), lowerNode(node.count));
  },
  IntervalRandomPartition(node) {
    return ir("RANDOM_PARTITION", lowerNode(node.interval), lowerNode(node.count));
  },
  InfiniteSequence(node) {
    return ir("INFSEQ", lowerNode(node.start), node.step ? lowerNode(node.step) : null);
  },
  ScientificUnit(node) {
    return ir("UNIT", lowerNode(node.expression), node.unit);
  },
  MathematicalUnit(node) {
    return ir("MATHUNIT", lowerNode(node.expression), node.unit);
  },
  GeneratorChain(node) {
    const start = node.start ? lowerNode(node.start) : null;
    const ops = node.operators.map(lowerNode);
    return ir("GENERATOR", start, ...ops);
  },
  GeneratorAdd(node) {
    return ir("GEN_ADD", lowerNode(node.operand));
  },
  GeneratorMultiply(node) {
    return ir("GEN_MUL", lowerNode(node.operand));
  },
  GeneratorFunction(node) {
    return ir("GEN_FUNC", lowerNode(node.operand));
  },
  GeneratorFilter(node) {
    return ir("GEN_FILTER", lowerNode(node.operand));
  },
  GeneratorLimit(node) {
    return ir("GEN_LIMIT", lowerNode(node.operand));
  },
  GeneratorLazyLimit(node) {
    return ir("GEN_LAZY_LIMIT", lowerNode(node.operand));
  },
  GeneratorEagerLimit(node) {
    return ir("GEN_EAGER_LIMIT", lowerNode(node.operand));
  },
  GeneratorPipe(node) {
    return ir("GEN_PIPE", lowerNode(node.operand));
  },
  WithMetadata(node) {
    const expr = lowerNode(node.expression);
    const meta = {};
    for (const [key, value] of Object.entries(node.metadata)) {
      meta[key] = lowerNode(value);
    }
    return ir("WITH_META", expr, meta);
  },
  EmbeddedLanguage(node) {
    return ir("EMBEDDED", node.language, node.code);
  }
};
function lowerImports(imports) {
  return imports.map((spec) => ({
    local: spec.local,
    source: spec.source,
    mode: spec.mode
  }));
}
function lowerBindingSpecs(specs) {
  return specs.map((spec) => ({
    target: spec.target,
    source: spec.source,
    mode: spec.mode,
    ...spec.sourceScope ? { sourceScope: spec.sourceScope } : {}
  }));
}
function lowerCapabilityModifiers(modifiers) {
  return modifiers.map((modifier) => ({
    action: modifier.action,
    targetType: modifier.targetType,
    target: modifier.target
  }));
}
function lowerAssignment(node, irFn) {
  const left = node.left;
  if (left.type === "Number" && typeof left.value === "string") {
    const m = left.value.match(/^0([A-Z])$/);
    if (m) {
      return ir("DEFINEBASE", m[1], lowerNode(node.right));
    }
  }
  if (left.type === "OuterIdentifier") {
    const outerFn = irFn === "ASSIGN" ? "OUTER_ASSIGN" : irFn === "ASSIGN_COPY" || irFn === "ASSIGN_DEEP_COPY" ? "OUTER_ASSIGN" : "OUTER_UPDATE";
    const depth = irFn === "ASSIGN_DEEP_COPY" || irFn === "ASSIGN_DEEP_UPDATE" ? "deep" : "shallow";
    if (outerFn === "OUTER_UPDATE") {
      return ir("OUTER_UPDATE", left.name, lowerNode(node.right), depth);
    }
    return ir("OUTER_ASSIGN", left.name, lowerNode(node.right));
  }
  if (left.type === "UserIdentifier" || left.type === "SystemIdentifier") {
    return ir(irFn, left.name, lowerNode(node.right));
  }
  if (left.type === "SelfRef") {
    throw new Error("Cannot assign to '$'; it is read-only and only valid within a function body");
  }
  if (left.type === "SystemAccess") {
    return ir("SYS_SET", left.property, lowerNode(node.right));
  }
  if (left.type === "DotAccess") {
    return ir("META_SET", lowerNode(left.object), left.property, lowerNode(node.right));
  }
  if (left.type === "ExternalAccess") {
    throw new Error("a..prop assignment is no longer supported; use a.prop = val for meta access");
  }
  if (left.type === "PropertyAccess") {
    const obj = lowerNode(left.object);
    if (left.property && left.property.type === "KeyLiteral") {
      return ir("INDEX_SET", obj, left.property.name, lowerNode(node.right));
    }
    return ir("INDEX_SET", obj, lowerNode(left.property), lowerNode(node.right));
  }
  if (left.type === "BracketIndex") {
    return ir("BRACKET_SET", lowerNode(left.object), left.specs.length, ...left.specs.map(lowerBracketSpec), lowerNode(node.right));
  }
  if (irFn === "ASSIGN_UPDATE" || irFn === "ASSIGN_DEEP_UPDATE") {
    throw new Error("Invalid update target");
  }
  return ir("ASSIGN_EXPR", lowerNode(left), lowerNode(node.right));
}
function lowerDestructureTarget(node) {
  if (!node || !node.type) {
    throw new Error("Invalid destructure target");
  }
  switch (node.type) {
    case "DestructureVariableTarget":
      return { type: node.type, name: node.name };
    case "DestructureBindingModeTarget":
      return { type: node.type, bindingMode: node.bindingMode, target: lowerDestructureTarget(node.target) };
    case "DestructureSemanticTarget":
      return { type: node.type, header: node.header ? lowerNode(node.header) : null, target: lowerDestructureTarget(node.target) };
    case "DestructureRestTarget":
      return { type: node.type, target: lowerDestructureTarget(node.target) };
    case "DestructureIndexedTarget":
      return {
        type: node.type,
        wholeTarget: node.wholeTarget ? lowerDestructureTarget(node.wholeTarget) : null,
        specs: (node.specs || []).map((spec) => {
          if (spec?.type === "FullSlice") {
            return { kind: "full" };
          }
          if (spec?.type === "SliceSpec") {
            return {
              kind: "slice",
              start: lowerNode(spec.start),
              end: lowerNode(spec.end)
            };
          }
          return {
            kind: "index",
            value: lowerNode(spec)
          };
        }),
        nestedTarget: node.nestedTarget ? lowerDestructureTarget(node.nestedTarget) : null
      };
    case "DestructureArrayPattern":
    case "DestructureTuplePattern":
      return {
        type: node.type,
        entries: (node.entries || []).map(lowerDestructureTarget),
        rest: node.rest ? lowerDestructureTarget(node.rest) : null
      };
    case "DestructureMapPattern":
      return {
        type: node.type,
        entries: (node.entries || []).map(lowerDestructureTarget),
        rest: node.rest ? lowerDestructureTarget(node.rest) : null
      };
    case "DestructureMapEntry": {
      let loweredKey;
      if (node.sourceKey?.type === "UserIdentifier" || node.sourceKey?.type === "SystemIdentifier") {
        loweredKey = { type: "MapKeyIdentifier", value: node.sourceKey.name };
      } else {
        loweredKey = lowerNode(node.sourceKey);
      }
      return {
        type: node.type,
        sourceKey: loweredKey,
        wholeTarget: node.wholeTarget ? lowerDestructureTarget(node.wholeTarget) : null,
        nestedTarget: node.nestedTarget ? lowerDestructureTarget(node.nestedTarget) : null
      };
    }
    case "DestructureTensorPattern":
      return {
        type: node.type,
        shape: [...node.shape || []],
        rows: (node.rows || []).map((row) => row.map(lowerDestructureTarget))
      };
    default:
      throw new Error(`Unknown destructure target node type: ${node.type}`);
  }
}
function lowerCallArgs(args) {
  if (!args)
    return [];
  const result = [];
  if (args.positional) {
    for (const arg of args.positional) {
      result.push(lowerNode(arg));
    }
  }
  if (args.keyword) {
    for (const [key, value] of Object.entries(args.keyword)) {
      result.push(ir("KWARG", key, lowerNode(value)));
    }
  }
  return result;
}
function lowerParams(params, prep = null, prepStrict = false, variantName = null) {
  if (!params)
    return { positional: [], keyword: [], conditionals: [] };
  return {
    positional: (params.positional || []).map((p) => {
      const res = {
        name: p.name,
        holeDefault: p.holeDefault ? lowerNode(p.holeDefault) : null
      };
      if (p.isRest) {
        res.isRest = true;
      }
      return res;
    }),
    keyword: (params.keyword || []).map((p) => ({
      name: p.name
    })),
    conditionals: (params.conditionals || []).map(lowerNode),
    prep: prep && prep.type === "Array" ? prep.elements.map(lowerNode) : [],
    prepStrict: prepStrict === true,
    metadata: {
      ...params.metadata || {},
      ...variantName ? { variantName } : {}
    }
  };
}
function lowerBracketSpec(spec) {
  if (spec.type === "FullSlice") {
    return ir("FULL_SLICE");
  }
  if (spec.type === "SliceSpec") {
    return ir("SLICE_SPEC", lowerNode(spec.start), lowerNode(spec.end));
  }
  return lowerNode(spec);
}
// ../packages/core/src/base-system.js
class BaseSystem {
  #base;
  #characters;
  #charMap;
  #name;
  static #prefixMap = new Map;
  static RESERVED_SYMBOLS = new Set([
    "+",
    "-",
    "*",
    "/",
    "^",
    "!",
    "(",
    ")",
    "[",
    "]",
    ":",
    ".",
    "#",
    "~"
  ]);
  constructor(characters, name) {
    if (typeof characters === "string") {
      this.#characters = characters.split("");
    } else if (Array.isArray(characters)) {
      this.#characters = [...characters];
    } else {
      throw new Error("Characters must be a string or array of strings");
    }
    if (this.#characters.length < 2) {
      throw new Error("Base system must have at least 2 characters");
    }
    this.#base = this.#characters.length;
    this.#charMap = this.#createCharacterMap();
    this.#name = name || `Base ${this.#base}`;
    this.#validateBase();
    this.#checkForConflicts();
  }
  get base() {
    return this.#base;
  }
  get characters() {
    return [...this.#characters];
  }
  get charMap() {
    return new Map(this.#charMap);
  }
  getChar(value) {
    const i = Number(value);
    if (i < 0 || i >= this.#characters.length) {
      throw new Error(`Value ${value} is out of range for base ${this.#base}`);
    }
    return this.#characters[i];
  }
  get name() {
    return this.#name;
  }
  #createCharacterMap() {
    const map = new Map;
    for (let i = 0;i < this.#characters.length; i++) {
      map.set(this.#characters[i], i);
    }
    return map;
  }
  #validateBase() {
    if (this.#base < 2) {
      throw new Error("Base must be at least 2");
    }
    if (this.#base !== this.#characters.length) {
      throw new Error(`Base ${this.#base} does not match character set length ${this.#characters.length}`);
    }
    const uniqueChars = new Set(this.#characters);
    if (uniqueChars.size !== this.#characters.length) {
      throw new Error("Character set contains duplicate characters");
    }
    this.#validateCharacterOrdering();
    if (this.#base > 1000) {
      console.warn(`Very large base system (${this.#base}). This may impact performance.`);
    }
  }
  #validateCharacterOrdering() {
    if (this.#name === "Roman Numerals" || this.#characters.length < 10) {
      return;
    }
    const ranges = [
      { start: "0", end: "9", name: "digits" },
      { start: "a", end: "z", name: "lowercase letters" },
      { start: "A", end: "Z", name: "uppercase letters" }
    ];
    for (const range of ranges) {
      const startCode = range.start.charCodeAt(0);
      const endCode = range.end.charCodeAt(0);
      let rangeChars = [];
      for (let i = 0;i < this.#characters.length; i++) {
        const char = this.#characters[i];
        const code = char.charCodeAt(0);
        if (code >= startCode && code <= endCode) {
          rangeChars.push(char);
        }
      }
      if (rangeChars.length >= 5 && rangeChars.length > (endCode - startCode) / 3) {
        for (let i = 1;i < rangeChars.length; i++) {
          const prevCode = rangeChars[i - 1].charCodeAt(0);
          const currCode = rangeChars[i].charCodeAt(0);
          if (currCode !== prevCode + 1) {
            console.warn(`Non-contiguous ${range.name} range detected in base system`);
            break;
          }
        }
      }
    }
  }
  #checkForConflicts() {
    const conflicts = [];
    for (const char of this.#characters) {
      if (BaseSystem.RESERVED_SYMBOLS.has(char)) {
        conflicts.push(char);
      }
    }
    if (conflicts.length > 0) {
      throw new Error(`Base system characters conflict with parser symbols: ${conflicts.join(", ")}. ` + `Reserved symbols are: ${Array.from(BaseSystem.RESERVED_SYMBOLS).join(", ")}`);
    }
  }
  toDecimal(str) {
    if (typeof str !== "string" || str.length === 0) {
      throw new Error("Input must be a non-empty string");
    }
    let negative = false;
    if (str.startsWith("-")) {
      negative = true;
      str = str.slice(1);
    }
    let result = 0n;
    const baseBigInt = BigInt(this.#base);
    for (let i = 0;i < str.length; i++) {
      const char = str[i];
      if (!this.#charMap.has(char)) {
        throw new Error(`Invalid character '${char}' for ${this.#name} (base ${this.#base})`);
      }
      const digitValue = BigInt(this.#charMap.get(char));
      result = result * baseBigInt + digitValue;
    }
    return negative ? -result : result;
  }
  fromDecimal(value) {
    if (typeof value !== "bigint") {
      throw new Error("Value must be a BigInt");
    }
    if (value === 0n) {
      return this.#characters[0];
    }
    let negative = false;
    if (value < 0n) {
      negative = true;
      value = -value;
    }
    const baseBigInt = BigInt(this.#base);
    const digits = [];
    while (value > 0n) {
      const remainder = Number(value % baseBigInt);
      digits.unshift(this.#characters[remainder]);
      value = value / baseBigInt;
    }
    const result = digits.join("");
    return negative ? "-" + result : result;
  }
  isValidString(str) {
    if (typeof str !== "string") {
      return false;
    }
    if (str.startsWith("-")) {
      str = str.slice(1);
    }
    if (str.length === 0) {
      return false;
    }
    for (const char of str) {
      if (!this.#charMap.has(char)) {
        return false;
      }
    }
    return true;
  }
  getMaxDigit() {
    return this.#characters[this.#characters.length - 1];
  }
  getMinDigit() {
    return this.#characters[0];
  }
  toString() {
    const charPreview = this.#characters.length <= 20 ? this.#characters.join("") : this.#characters.slice(0, 10).join("") + "..." + this.#characters.slice(-10).join("");
    return `${this.#name} (${charPreview})`;
  }
  equals(other) {
    if (!(other instanceof BaseSystem)) {
      return false;
    }
    if (this.#base !== other.#base) {
      return false;
    }
    for (let i = 0;i < this.#characters.length; i++) {
      if (this.#characters[i] !== other.#characters[i]) {
        return false;
      }
    }
    return true;
  }
  static fromBase(base, name) {
    if (!Number.isInteger(base) || base < 2) {
      throw new Error("Base must be an integer >= 2");
    }
    const characters = [];
    if (base <= 62) {
      for (let i = 0;i < Math.min(base, 10); i++) {
        characters.push(String.fromCharCode(48 + i));
      }
      if (base > 10) {
        for (let i = 0;i < Math.min(base - 10, 26); i++) {
          characters.push(String.fromCharCode(97 + i));
        }
      }
      if (base > 36) {
        for (let i = 0;i < base - 36; i++) {
          characters.push(String.fromCharCode(65 + i));
        }
      }
    } else {
      throw new Error("BaseSystem.fromBase() only supports bases up to 62. Use constructor with custom character sequence for larger bases.");
    }
    return new BaseSystem(characters, name || `Base ${base}`);
  }
  static createPattern(pattern, size, name) {
    const characters = [];
    switch (pattern.toLowerCase()) {
      case "alphanumeric":
        if (size > 62) {
          throw new Error(`Alphanumeric pattern only supports up to base 62, got ${size}`);
        }
        return BaseSystem.fromBase(size, name);
      case "digits-only":
        if (size > 10) {
          throw new Error(`Digits-only pattern only supports up to base 10, got ${size}`);
        }
        for (let i = 0;i < size; i++)
          characters.push(String.fromCharCode(48 + i));
        return new BaseSystem(characters, name || `Base ${size} (digits only)`);
      case "letters-only":
        if (size > 52) {
          throw new Error(`Letters-only pattern only supports up to base 52, got ${size}`);
        }
        for (let i = 0;i < Math.min(size, 26); i++) {
          characters.push(String.fromCharCode(97 + i));
        }
        if (size > 26) {
          for (let i = 0;i < size - 26; i++) {
            characters.push(String.fromCharCode(65 + i));
          }
        }
        return new BaseSystem(characters, name || (size <= 26 ? `Base ${size} (lowercase letters)` : `Base ${size} (mixed case letters)`));
      case "uppercase-only":
        if (size > 26) {
          throw new Error(`Uppercase-only pattern only supports up to base 26, got ${size}`);
        }
        for (let i = 0;i < size; i++) {
          characters.push(String.fromCharCode(65 + i));
        }
        return new BaseSystem(characters, name || `Base ${size} (uppercase letters)`);
      default:
        throw new Error(`Unknown pattern: ${pattern}. Supported patterns: alphanumeric, digits-only, letters-only, uppercase-only`);
    }
  }
  static registerPrefix(prefix, baseSystem) {
    if (typeof prefix !== "string" || prefix.length !== 1) {
      throw new Error("Prefix must be a single character");
    }
    if (!(baseSystem instanceof BaseSystem)) {
      throw new Error("Must provide a valid BaseSystem");
    }
    if (!/^[a-zA-Z]$/.test(prefix)) {
      throw new Error("Prefix must be a letter");
    }
    BaseSystem.#prefixMap.set(prefix, baseSystem);
  }
  static unregisterPrefix(prefix) {
    BaseSystem.#prefixMap.delete(prefix);
  }
  static hasExactPrefix(prefix) {
    return BaseSystem.#prefixMap.has(prefix);
  }
  static getSystemForPrefix(prefix) {
    if (prefix === "D")
      return null;
    if (BaseSystem.#prefixMap.has(prefix)) {
      return BaseSystem.#prefixMap.get(prefix);
    }
    const lower2 = prefix.toLowerCase();
    if (BaseSystem.#prefixMap.has(lower2)) {
      if (lower2 === "d" && prefix !== "d")
        return;
      return BaseSystem.#prefixMap.get(lower2);
    }
    return;
  }
  static getPrefixForSystem(baseSystem) {
    for (const [prefix, system] of BaseSystem.#prefixMap.entries()) {
      if (system.equals(baseSystem)) {
        return prefix;
      }
    }
    return;
  }
  withCaseSensitivity(caseSensitive) {
    if (caseSensitive === true) {
      return this;
    }
    if (caseSensitive === false) {
      const lowerChars = this.#characters.map((char) => char.toLowerCase());
      const uniqueLowerChars = [...new Set(lowerChars)];
      if (uniqueLowerChars.length !== lowerChars.length) {
        console.warn("Case-insensitive conversion resulted in duplicate characters");
      }
      return new BaseSystem(uniqueLowerChars.join(""), `${this.#name} (case-insensitive)`);
    }
    throw new Error("caseSensitive must be a boolean value");
  }
}
BaseSystem.BINARY = new BaseSystem(["0", "1"], "Binary");
BaseSystem.TERNARY = new BaseSystem(["0", "1", "2"], "Ternary");
BaseSystem.QUATERNARY = new BaseSystem(["0", "1", "2", "3"], "Quaternary");
BaseSystem.QUINARY = new BaseSystem(["0", "1", "2", "3", "4"], "Quinary (Base 5)");
BaseSystem.SEPTENARY = new BaseSystem(["0", "1", "2", "3", "4", "5", "6"], "Septenary (Base 7)");
BaseSystem.OCTAL = new BaseSystem(["0", "1", "2", "3", "4", "5", "6", "7"], "Octal");
BaseSystem.DECIMAL = new BaseSystem(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"], "Decimal");
BaseSystem.DUODECIMAL = new BaseSystem(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b"], "Duodecimal (Clock/Base 12)");
BaseSystem.HEXADECIMAL = new BaseSystem(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"], "Hexadecimal");
BaseSystem.VIGESIMAL = new BaseSystem("0123456789abcdefghij".split(""), "Vigesimal (Base 20)");
BaseSystem.BASE36 = new BaseSystem("0123456789abcdefghijklmnopqrstuvwxyz".split(""), "Base 36 (URL)");
BaseSystem.BASE62 = new BaseSystem("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""), "Base 62");
BaseSystem.BASE64 = new BaseSystem("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ@&".split(""), "Base 64");
BaseSystem.BASE60 = new BaseSystem("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWX".split(""), "Base 60 (Mesopotamia)");
BaseSystem.ROMAN = new BaseSystem(["I", "V", "X", "L", "C", "D", "M"], "Roman Numerals");
BaseSystem.registerPrefix("b", BaseSystem.BINARY);
BaseSystem.registerPrefix("t", BaseSystem.TERNARY);
BaseSystem.registerPrefix("q", BaseSystem.QUATERNARY);
BaseSystem.registerPrefix("f", BaseSystem.QUINARY);
BaseSystem.registerPrefix("s", BaseSystem.SEPTENARY);
BaseSystem.registerPrefix("o", BaseSystem.OCTAL);
BaseSystem.registerPrefix("d", BaseSystem.DUODECIMAL);
BaseSystem.registerPrefix("x", BaseSystem.HEXADECIMAL);
BaseSystem.registerPrefix("v", BaseSystem.VIGESIMAL);
BaseSystem.registerPrefix("u", BaseSystem.BASE36);
BaseSystem.registerPrefix("m", BaseSystem.BASE60);
BaseSystem.registerPrefix("y", BaseSystem.BASE64);

// ../packages/core/src/rational.js
var bitLength = function(int) {
  if (int === 0n)
    return 0;
  return int < 0n ? (-int).toString(2).length : int.toString(2).length;
};

class Rational {
  #numerator;
  #denominator;
  #isNegative;
  #wholePart;
  #remainder;
  #initialSegment;
  #periodDigits;
  #periodLength;
  #isTerminating;
  #factorsOf2;
  #factorsOf5;
  #leadingZerosInPeriod;
  #initialSegmentLeadingZeros;
  #initialSegmentRest;
  #periodDigitsRest;
  #maxPeriodDigitsComputed;
  static DEFAULT_PERIOD_DIGITS = 20;
  static MAX_PERIOD_DIGITS = 1000;
  static MAX_PERIOD_CHECK = 1e7;
  static POWERS_OF_5 = {
    16: 5n ** 16n,
    8: 5n ** 8n,
    4: 5n ** 4n,
    2: 5n ** 2n,
    1: 5n
  };
  static zero = new Rational(0, 1);
  static one = new Rational(1, 1);
  constructor(numerator, denominator = 1n) {
    if (numerator && typeof numerator === "object" && numerator.constructor.name === "Integer") {
      this.#numerator = numerator.value;
      if (denominator && typeof denominator === "object" && denominator.constructor.name === "Integer") {
        this.#denominator = denominator.value;
      } else if (denominator !== undefined) {
        this.#denominator = BigInt(denominator);
      } else {
        this.#denominator = 1n;
      }
      if (this.#denominator === 0n) {
        throw new Error("Denominator cannot be zero");
      }
      this.#normalize();
      this.#isNegative = this.#numerator < 0n;
      return;
    }
    if (typeof numerator === "string") {
      if (numerator.includes("..")) {
        const mixedParts = numerator.trim().split("..");
        if (mixedParts.length !== 2) {
          throw new Error("Invalid mixed number format. Use 'a..b/c'");
        }
        const wholePart = BigInt(mixedParts[0]);
        const fractionParts = mixedParts[1].split("/");
        if (fractionParts.length !== 2) {
          throw new Error("Invalid fraction in mixed number. Use 'a..b/c'");
        }
        const fracNumerator = BigInt(fractionParts[0]);
        const fracDenominator = BigInt(fractionParts[1]);
        const isNegative = wholePart < 0n;
        const absWhole = isNegative ? -wholePart : wholePart;
        this.#numerator = isNegative ? -(absWhole * fracDenominator + fracNumerator) : wholePart * fracDenominator + fracNumerator;
        this.#denominator = fracDenominator;
      } else {
        if (numerator.includes(".")) {
          const expandedNumerator = Rational.#parseRepeatedDigits(numerator);
          const decimalParts = expandedNumerator.trim().split(".");
          if (decimalParts.length === 2) {
            const integerPart = decimalParts[0] || "0";
            const fractionalPart = decimalParts[1];
            if (!/^-?\d*$/.test(integerPart) || !/^\d*$/.test(fractionalPart)) {
              throw new Error("Invalid decimal format");
            }
            const wholePart = BigInt(integerPart);
            const fractionalValue = BigInt(fractionalPart);
            const denomValue = 10n ** BigInt(fractionalPart.length);
            this.#numerator = wholePart * denomValue + (wholePart < 0n ? -fractionalValue : fractionalValue);
            this.#denominator = denomValue;
          } else {
            throw new Error("Invalid decimal format - multiple decimal points");
          }
        } else {
          const parts = numerator.trim().split("/");
          if (parts.length === 1) {
            this.#numerator = BigInt(parts[0]);
            this.#denominator = BigInt(denominator);
          } else if (parts.length === 2) {
            this.#numerator = BigInt(parts[0]);
            this.#denominator = BigInt(parts[1]);
          } else {
            throw new Error("Invalid rational format. Use 'a/b', 'a', or 'a..b/c'");
          }
        }
      }
    } else {
      this.#numerator = BigInt(numerator);
      this.#denominator = BigInt(denominator);
    }
    if (this.#denominator === 0n) {
      throw new Error("Denominator cannot be zero");
    }
    this.#normalize();
    this.#isNegative = this.#numerator < 0n;
  }
  #normalize() {
    if (this.#denominator < 0n) {
      this.#numerator = -this.#numerator;
      this.#denominator = -this.#denominator;
    }
    if (this.#numerator === 0n) {
      this.#denominator = 1n;
      return;
    }
    const gcd = this.#gcd(this.#numerator < 0n ? -this.#numerator : this.#numerator, this.#denominator);
    this.#numerator = this.#numerator / gcd;
    this.#denominator = this.#denominator / gcd;
  }
  #gcd(a, b) {
    while (b !== 0n) {
      const temp = b;
      b = a % b;
      a = temp;
    }
    return a;
  }
  get numerator() {
    return this.#numerator;
  }
  get denominator() {
    return this.#denominator;
  }
  add(other) {
    if (other.constructor.name === "Integer") {
      const otherAsRational = new Rational(other.value, 1n);
      return this.add(otherAsRational);
    } else if (other instanceof Rational) {
      const a = this.#numerator;
      const b = this.#denominator;
      const c = other.numerator;
      const d = other.denominator;
      const numerator = a * d + b * c;
      const denominator = b * d;
      return new Rational(numerator, denominator);
    } else if (other.low && other.high && typeof other.low.equals === "function") {
      const thisAsInterval = { low: this, high: this };
      const IntervalClass = other.constructor;
      const newThisAsInterval = new IntervalClass(this, this);
      return newThisAsInterval.add(other);
    } else {
      throw new Error(`Cannot add ${other.constructor.name} to Rational`);
    }
  }
  subtract(other) {
    if (other.constructor.name === "Integer") {
      const otherAsRational = new Rational(other.value, 1n);
      return this.subtract(otherAsRational);
    } else if (other instanceof Rational) {
      const a = this.#numerator;
      const b = this.#denominator;
      const c = other.numerator;
      const d = other.denominator;
      const numerator = a * d - b * c;
      const denominator = b * d;
      return new Rational(numerator, denominator);
    } else if (other.low && other.high && typeof other.low.equals === "function") {
      const IntervalClass = other.constructor;
      const newThisAsInterval = new IntervalClass(this, this);
      return newThisAsInterval.subtract(other);
    } else {
      throw new Error(`Cannot subtract ${other.constructor.name} from Rational`);
    }
  }
  multiply(other) {
    if (other.constructor.name === "Integer") {
      const otherAsRational = new Rational(other.value, 1n);
      return this.multiply(otherAsRational);
    } else if (other instanceof Rational) {
      const a = this.#numerator;
      const b = this.#denominator;
      const c = other.numerator;
      const d = other.denominator;
      const numerator = a * c;
      const denominator = b * d;
      return new Rational(numerator, denominator);
    } else if (other.low && other.high && typeof other.low.equals === "function") {
      const IntervalClass = other.constructor;
      const newThisAsInterval = new IntervalClass(this, this);
      return newThisAsInterval.multiply(other);
    } else {
      throw new Error(`Cannot multiply Rational by ${other.constructor.name}`);
    }
  }
  divide(other) {
    if (other.constructor.name === "Integer") {
      if (other.value === 0n) {
        throw new Error("Division by zero");
      }
      const otherAsRational = new Rational(other.value, 1n);
      return this.divide(otherAsRational);
    } else if (other instanceof Rational) {
      if (other.numerator === 0n) {
        throw new Error("Division by zero");
      }
      const a = this.#numerator;
      const b = this.#denominator;
      const c = other.numerator;
      const d = other.denominator;
      const numerator = a * d;
      const denominator = b * c;
      return new Rational(numerator, denominator);
    } else if (other.low && other.high && typeof other.low.equals === "function") {
      const IntervalClass = other.constructor;
      const newThisAsInterval = new IntervalClass(this, this);
      return newThisAsInterval.divide(other);
    } else {
      throw new Error(`Cannot divide Rational by ${other.constructor.name}`);
    }
  }
  negate() {
    return new Rational(-this.#numerator, this.#denominator);
  }
  reciprocal() {
    if (this.#numerator === 0n) {
      throw new Error("Cannot take reciprocal of zero");
    }
    return new Rational(this.#denominator, this.#numerator);
  }
  pow(exponent) {
    const n = BigInt(exponent);
    if (n === 0n) {
      if (this.#numerator === 0n) {
        throw new Error("Zero cannot be raised to the power of zero");
      }
      return new Rational(1);
    }
    if (this.#numerator === 0n && n < 0n) {
      throw new Error("Zero cannot be raised to a negative power");
    }
    if (n < 0n) {
      const reciprocal = this.reciprocal();
      return reciprocal.pow(-n);
    }
    let resultNum = 1n;
    let resultDen = 1n;
    let num = this.#numerator;
    let den = this.#denominator;
    for (let i = n < 0n ? -n : n;i > 0n; i >>= 1n) {
      if (i & 1n) {
        resultNum *= num;
        resultDen *= den;
      }
      num *= num;
      den *= den;
    }
    return new Rational(resultNum, resultDen);
  }
  equals(other) {
    return this.#numerator === other.numerator && this.#denominator === other.denominator;
  }
  compareTo(other) {
    const crossProduct1 = this.#numerator * other.denominator;
    const crossProduct2 = this.#denominator * other.numerator;
    if (crossProduct1 < crossProduct2)
      return -1;
    if (crossProduct1 > crossProduct2)
      return 1;
    return 0;
  }
  lessThan(other) {
    return this.compareTo(other) < 0;
  }
  lessThanOrEqual(other) {
    return this.compareTo(other) <= 0;
  }
  greaterThan(other) {
    return this.compareTo(other) > 0;
  }
  greaterThanOrEqual(other) {
    return this.compareTo(other) >= 0;
  }
  abs() {
    return this.#numerator < 0n ? this.negate() : new Rational(this.#numerator, this.#denominator);
  }
  toString(base) {
    if (base === undefined) {
      if (this.#denominator === 1n) {
        return this.#numerator.toString();
      }
      return `${this.#numerator}/${this.#denominator}`;
    }
    let baseSystem;
    if (base instanceof BaseSystem) {
      baseSystem = base;
    } else if (typeof base === "number") {
      baseSystem = BaseSystem.fromBase(base);
    } else {
      return this.toString();
    }
    return this.toRepeatingBase(baseSystem);
  }
  toRepeatingBase(baseSystem) {
    return this.toRepeatingBaseWithPeriod(baseSystem).baseStr;
  }
  toRepeatingBaseWithPeriod(baseSystem, options = {}) {
    if (!(baseSystem instanceof BaseSystem)) {
      throw new Error("Argument must be a BaseSystem");
    }
    const { useRepeatNotation = true, limit = 1000 } = options;
    if (this.#numerator < 0n) {
      const result2 = this.negate().toRepeatingBaseWithPeriod(baseSystem, options);
      return {
        baseStr: "-" + result2.baseStr,
        period: result2.period,
        limitHit: result2.limitHit
      };
    }
    const baseBigInt = BigInt(baseSystem.base);
    let num = this.#numerator;
    let den = this.#denominator;
    const integerPart = num / den;
    let remainder = num % den;
    let result = baseSystem.fromDecimal(integerPart);
    if (remainder === 0n) {
      return { baseStr: result, period: 0, limitHit: false };
    }
    result += ".";
    const remainders = new Map;
    let fractionParts = [];
    let cycleStartIndex = -1;
    let limitHit = false;
    while (remainder !== 0n) {
      if (remainders.has(remainder)) {
        cycleStartIndex = remainders.get(remainder);
        break;
      }
      if (fractionParts.length >= limit) {
        limitHit = true;
        break;
      }
      remainders.set(remainder, fractionParts.length);
      remainder *= baseBigInt;
      const digit = remainder / den;
      remainder = remainder % den;
      fractionParts.push(baseSystem.getChar(digit));
    }
    let period = 0;
    if (cycleStartIndex !== -1) {
      const nonRepeating = fractionParts.slice(0, cycleStartIndex).join("");
      const repeating = fractionParts.slice(cycleStartIndex).join("");
      period = fractionParts.length - cycleStartIndex;
      const formattedNonRepeating = useRepeatNotation ? Rational.#formatRepeatedDigits(nonRepeating) : nonRepeating;
      const formattedRepeating = useRepeatNotation ? Rational.#formatRepeatedDigits(repeating) : repeating;
      result += formattedNonRepeating + "#" + formattedRepeating;
    } else if (remainder === 0n) {
      const terminating = fractionParts.join("");
      const formattedTerminating = useRepeatNotation ? Rational.#formatRepeatedDigits(terminating) : terminating;
      result += formattedTerminating + "#0";
    } else {
      const partial = fractionParts.join("");
      const formattedPartial = useRepeatNotation ? Rational.#formatRepeatedDigits(partial) : partial;
      result += formattedPartial + "...";
      period = -1;
    }
    return { baseStr: result, period, limitHit };
  }
  periodModulo(baseSystem, limit = 1e6) {
    if (!(baseSystem instanceof BaseSystem)) {
      throw new Error("Argument must be a BaseSystem");
    }
    let num = this.#numerator < 0n ? -this.#numerator : this.#numerator;
    let den = this.#denominator;
    const baseBigInt = BigInt(baseSystem.base);
    if (den === 1n)
      return 0;
    let common = this.#gcd(den, baseBigInt);
    while (common > 1n) {
      den /= common;
      common = this.#gcd(den, baseBigInt);
    }
    if (den === 1n)
      return 0;
    let k = 1;
    let power = baseBigInt % den;
    while (power !== 1n && k <= limit) {
      power = power * baseBigInt % den;
      k++;
    }
    if (k > limit) {
      throw new Error(`Period calculation exceeded limit of ${limit} iterations. Period is likely > ${limit}.`);
    }
    return k;
  }
  toBase(baseSystem) {
    if (!(baseSystem instanceof BaseSystem)) {
      throw new Error("Argument must be a BaseSystem");
    }
    const numStr = baseSystem.fromDecimal(this.#numerator);
    if (this.#denominator === 1n) {
      return numStr;
    }
    const denStr = baseSystem.fromDecimal(this.#denominator);
    return `${numStr}/${denStr}`;
  }
  toMixedString() {
    if (this.#denominator === 1n || this.#numerator === 0n) {
      return this.#numerator.toString();
    }
    this.#computeWholePart();
    if (this.#remainder === 0n) {
      return this.#isNegative ? `-${this.#wholePart}` : `${this.#wholePart}`;
    }
    if (this.#wholePart === 0n) {
      return this.#isNegative ? `-${this.#remainder}/${this.#denominator}` : `${this.#remainder}/${this.#denominator}`;
    } else {
      return this.#isNegative ? `-${this.#wholePart}..${this.#remainder}/${this.#denominator}` : `${this.#wholePart}..${this.#remainder}/${this.#denominator}`;
    }
  }
  toNumber() {
    return Number(this.#numerator) / Number(this.#denominator);
  }
  toRepeatingDecimal() {
    const result = this.toRepeatingDecimalWithPeriod();
    return result.decimal;
  }
  toRepeatingDecimalWithPeriod(useRepeatNotation = true) {
    if (this.#numerator === 0n) {
      return { decimal: "0", period: 0 };
    }
    this.#computeWholePart();
    const maxDigits = useRepeatNotation ? 100 : Rational.DEFAULT_PERIOD_DIGITS;
    this.#computeDecimalMetadata(maxDigits);
    let result = (this.#isNegative ? "-" : "") + this.#wholePart.toString();
    if (this.#isTerminating) {
      if (this.#initialSegment) {
        const formattedInitial = useRepeatNotation ? Rational.#formatRepeatedDigits(this.#initialSegment, 7) : this.#initialSegment;
        result += "." + formattedInitial + "#0";
      } else {}
      return { decimal: result, period: 0 };
    } else {
      let periodDigits = this.#periodDigits;
      if (this.#periodLength > 0 && this.#periodLength <= Rational.MAX_PERIOD_DIGITS && this.#periodDigits.length < this.#periodLength) {
        periodDigits = this.extractPeriodSegment(this.#initialSegment, this.#periodLength, this.#periodLength);
      }
      const formattedInitial = useRepeatNotation ? Rational.#formatRepeatedDigits(this.#initialSegment, 7) : this.#initialSegment;
      let displayPeriod = periodDigits;
      if (useRepeatNotation && this.#leadingZerosInPeriod < 1000) {
        const significantDigits = this.#periodDigitsRest;
        if (significantDigits && significantDigits.length > 0) {
          const leadingZerosFormatted = this.#leadingZerosInPeriod > 6 ? `{0~${this.#leadingZerosInPeriod}}` : this.#leadingZerosInPeriod > 0 ? "0".repeat(this.#leadingZerosInPeriod) : "";
          const maxSignificantDigits = Math.min(significantDigits.length, 20);
          displayPeriod = leadingZerosFormatted + significantDigits.substring(0, maxSignificantDigits);
        } else {
          displayPeriod = useRepeatNotation ? Rational.#formatRepeatedDigits(periodDigits, 7) : periodDigits;
        }
      } else {
        displayPeriod = useRepeatNotation ? Rational.#formatRepeatedDigits(periodDigits, 7) : periodDigits;
      }
      if (this.#initialSegment) {
        result += "." + formattedInitial + "#" + displayPeriod;
      } else {
        result += ".#" + displayPeriod;
      }
      return {
        decimal: result,
        period: this.#periodLength
      };
    }
  }
  static #countFactorsOf2(n) {
    if (n === 0n)
      return 0;
    let count = 0;
    while ((n & 1n) === 0n) {
      n >>= 1n;
      count++;
    }
    return count;
  }
  static #countFactorsOf5(n) {
    if (n === 0n)
      return 0;
    let count = 0;
    const powers = [
      { exp: 16, value: Rational.POWERS_OF_5["16"] },
      { exp: 8, value: Rational.POWERS_OF_5["8"] },
      { exp: 4, value: Rational.POWERS_OF_5["4"] },
      { exp: 2, value: Rational.POWERS_OF_5["2"] },
      { exp: 1, value: Rational.POWERS_OF_5["1"] }
    ];
    for (const { exp, value } of powers) {
      while (n % value === 0n) {
        n /= value;
        count += exp;
      }
    }
    return count;
  }
  bitLength() {
    const numLen = bitLength(this.#numerator);
    const denLen = bitLength(this.#denominator);
    return Math.max(numLen, denLen);
  }
  #computeWholePart() {
    if (this.#wholePart !== undefined)
      return;
    const absNumerator = this.#numerator < 0n ? -this.#numerator : this.#numerator;
    this.#wholePart = absNumerator / this.#denominator;
    this.#remainder = absNumerator % this.#denominator;
  }
  #computeLeadingZerosInPeriod(reducedDen, initialSegmentLength) {
    let adjustedNumerator = this.#remainder * 10n ** BigInt(initialSegmentLength);
    let leadingZeros = 0;
    while (adjustedNumerator < reducedDen && leadingZeros < Rational.MAX_PERIOD_CHECK) {
      adjustedNumerator *= 10n;
      leadingZeros++;
    }
    return leadingZeros;
  }
  #computeDecimalMetadata(maxPeriodDigits = Rational.DEFAULT_PERIOD_DIGITS) {
    if (this.#periodLength !== undefined && this.#maxPeriodDigitsComputed !== undefined && this.#maxPeriodDigitsComputed >= maxPeriodDigits)
      return;
    this.#computeWholePart();
    if (this.#remainder === 0n) {
      this.#initialSegment = "";
      this.#periodDigits = "";
      this.#periodLength = 0;
      this.#isTerminating = true;
      this.#factorsOf2 = 0;
      this.#factorsOf5 = 0;
      this.#leadingZerosInPeriod = 0;
      this.#initialSegmentLeadingZeros = 0;
      this.#initialSegmentRest = "";
      this.#periodDigitsRest = "";
      this.#maxPeriodDigitsComputed = maxPeriodDigits;
      return;
    }
    this.#factorsOf2 = Rational.#countFactorsOf2(this.#denominator);
    this.#factorsOf5 = Rational.#countFactorsOf5(this.#denominator);
    const initialSegmentLength = Math.max(this.#factorsOf2, this.#factorsOf5);
    let reducedDen = this.#denominator;
    for (let i = 0;i < this.#factorsOf2; i++) {
      reducedDen /= 2n;
    }
    for (let i = 0;i < this.#factorsOf5; i++) {
      reducedDen /= 5n;
    }
    if (reducedDen === 1n) {
      const digits = [];
      let currentRemainder2 = this.#remainder;
      for (let i = 0;i < initialSegmentLength && currentRemainder2 !== 0n; i++) {
        currentRemainder2 *= 10n;
        const digit = currentRemainder2 / this.#denominator;
        digits.push(digit.toString());
        currentRemainder2 = currentRemainder2 % this.#denominator;
      }
      this.#initialSegment = digits.join("");
      this.#periodDigits = "";
      this.#periodLength = 0;
      this.#isTerminating = true;
      this.#leadingZerosInPeriod = 0;
      this.#computeDecimalPartBreakdown();
      this.#maxPeriodDigitsComputed = maxPeriodDigits;
      return;
    }
    let periodLength = 1;
    let remainder = 10n % reducedDen;
    while (remainder !== 1n && periodLength < Rational.MAX_PERIOD_CHECK) {
      periodLength++;
      remainder = remainder * 10n % reducedDen;
    }
    this.#periodLength = periodLength >= Rational.MAX_PERIOD_CHECK ? -1 : periodLength;
    this.#isTerminating = false;
    this.#leadingZerosInPeriod = this.#computeLeadingZerosInPeriod(reducedDen, initialSegmentLength);
    const initialDigits = [];
    let currentRemainder = this.#remainder;
    for (let i = 0;i < initialSegmentLength && currentRemainder !== 0n; i++) {
      currentRemainder *= 10n;
      const digit = currentRemainder / this.#denominator;
      initialDigits.push(digit.toString());
      currentRemainder = currentRemainder % this.#denominator;
    }
    const periodDigitsToCompute = this.#periodLength === -1 ? maxPeriodDigits : this.#periodLength > maxPeriodDigits ? maxPeriodDigits : this.#periodLength;
    const periodDigits = [];
    if (currentRemainder !== 0n) {
      for (let i = 0;i < periodDigitsToCompute; i++) {
        currentRemainder *= 10n;
        const digit = currentRemainder / this.#denominator;
        periodDigits.push(digit.toString());
        currentRemainder = currentRemainder % this.#denominator;
      }
    }
    this.#initialSegment = initialDigits.join("");
    this.#periodDigits = periodDigits.join("");
    this.#computeDecimalPartBreakdown();
    this.#maxPeriodDigitsComputed = maxPeriodDigits;
  }
  #computeDecimalPartBreakdown() {
    let leadingZeros = 0;
    const initialSegment = this.#initialSegment || "";
    for (let i = 0;i < initialSegment.length; i++) {
      if (initialSegment[i] === "0") {
        leadingZeros++;
      } else {
        break;
      }
    }
    this.#initialSegmentLeadingZeros = leadingZeros;
    this.#initialSegmentRest = initialSegment.substring(leadingZeros);
    const periodDigits = this.#periodDigits || "";
    let periodLeadingZeros = 0;
    for (let i = 0;i < periodDigits.length; i++) {
      if (periodDigits[i] === "0") {
        periodLeadingZeros++;
      } else {
        break;
      }
    }
    this.#leadingZerosInPeriod = periodLeadingZeros;
    this.#periodDigitsRest = periodDigits.substring(periodLeadingZeros);
  }
  computeDecimalMetadata(maxPeriodDigits = Rational.DEFAULT_PERIOD_DIGITS) {
    if (this.#numerator === 0n) {
      return {
        initialSegment: "",
        periodDigits: "",
        periodLength: 0,
        isTerminating: true
      };
    }
    this.#computeDecimalMetadata(maxPeriodDigits);
    return {
      wholePart: this.#wholePart,
      initialSegment: this.#initialSegment,
      initialSegmentLeadingZeros: this.#initialSegmentLeadingZeros,
      initialSegmentRest: this.#initialSegmentRest,
      periodDigits: this.#periodDigits,
      periodLength: this.#periodLength,
      leadingZerosInPeriod: this.#leadingZerosInPeriod,
      periodDigitsRest: this.#periodDigitsRest,
      isTerminating: this.#isTerminating
    };
  }
  static #formatRepeatedDigits(digits, threshold = 6) {
    if (!digits || digits.length === 0)
      return digits;
    let result = "";
    let i = 0;
    while (i < digits.length) {
      let currentChar = digits[i];
      let count = 1;
      while (i + count < digits.length && digits[i + count] === currentChar) {
        count++;
      }
      if (count >= threshold) {
        result += `{${currentChar}~${count}}`;
      } else {
        result += currentChar.repeat(count);
      }
      i += count;
    }
    return result;
  }
  static #parseRepeatedDigits(formattedDigits) {
    if (!formattedDigits || !formattedDigits.includes("{")) {
      return formattedDigits;
    }
    return formattedDigits.replace(/\{(.+?)~(\d+)\}/g, (match, digits, count) => {
      return digits.repeat(parseInt(count));
    });
  }
  extractPeriodSegment(initialSegment, periodLength, digitsRequested) {
    if (periodLength === 0 || periodLength === -1) {
      return "";
    }
    const digitsToReturn = Math.min(digitsRequested, periodLength);
    const periodDigits = [];
    let currentRemainder = this.#numerator % this.#denominator;
    const isNegative = this.#numerator < 0n;
    if (isNegative) {
      currentRemainder = -currentRemainder;
    }
    for (let i = 0;i < initialSegment.length; i++) {
      currentRemainder *= 10n;
      currentRemainder = currentRemainder % this.#denominator;
    }
    for (let i = 0;i < digitsToReturn; i++) {
      currentRemainder *= 10n;
      const digit = currentRemainder / this.#denominator;
      periodDigits.push(digit.toString());
      currentRemainder = currentRemainder % this.#denominator;
    }
    return periodDigits.join("");
  }
  toDecimal() {
    if (this.#numerator === 0n) {
      return "0";
    }
    const isNegative = this.#numerator < 0n;
    const num = isNegative ? -this.#numerator : this.#numerator;
    const den = this.#denominator;
    const integerPart = num / den;
    let remainder = num % den;
    if (remainder === 0n) {
      return (isNegative ? "-" : "") + integerPart.toString();
    }
    const digits = [];
    const maxDigits = 20;
    for (let i = 0;i < maxDigits && remainder !== 0n; i++) {
      remainder *= 10n;
      const digit = remainder / den;
      digits.push(digit.toString());
      remainder = remainder % den;
    }
    let result = (isNegative ? "-" : "") + integerPart.toString();
    if (digits.length > 0) {
      result += "." + digits.join("");
    }
    return result;
  }
  E(exponent) {
    const exp = BigInt(exponent);
    let powerOf10;
    if (exp >= 0n) {
      powerOf10 = new Rational(10n ** exp, 1n);
    } else {
      powerOf10 = new Rational(1n, 10n ** -exp);
    }
    return this.multiply(powerOf10);
  }
  #generatePeriodInfo(showPeriodInfo) {
    if (!showPeriodInfo || this.#isTerminating) {
      return "";
    }
    const info = [];
    if (this.#initialSegmentLeadingZeros > 0) {
      info.push(`initial: ${this.#initialSegmentLeadingZeros} zeros`);
    }
    if (this.#leadingZerosInPeriod > 0) {
      info.push(`period starts: +${this.#leadingZerosInPeriod} zeros`);
    }
    if (this.#periodLength === -1) {
      info.push("period: >10^7");
    } else if (this.#periodLength > 0) {
      info.push(`period: ${this.#periodLength}`);
    }
    return info.length > 0 ? ` {${info.join(", ")}}` : "";
  }
  toScientificNotation(useRepeatNotation = true, precision = 11, showPeriodInfo = false) {
    if (this.#numerator === 0n) {
      return "0";
    }
    this.#computeWholePart();
    this.#computeDecimalMetadata(100);
    const isNegative = this.#isNegative;
    const prefix = isNegative ? "-" : "";
    if (this.#wholePart > 0n) {
      const wholeStr = this.#wholePart.toString();
      const firstDigit = wholeStr[0];
      const exponent = wholeStr.length - 1;
      let mantissa = firstDigit;
      const hasMoreWholeDigits = wholeStr.length > 1;
      const hasFractionalPart = this.#remainder > 0n;
      if (hasFractionalPart || hasMoreWholeDigits) {
        if (hasFractionalPart && !this.#isTerminating) {
          mantissa += ".";
          const remainingWholeDigits = hasMoreWholeDigits ? wholeStr.substring(1) : "";
          const formattedInitial = useRepeatNotation ? Rational.#formatRepeatedDigits(this.#initialSegment, 7) : this.#initialSegment;
          let periodDigits = this.#periodDigits;
          if (this.#periodLength > 0 && this.#periodLength <= Rational.MAX_PERIOD_DIGITS && periodDigits.length < this.#periodLength) {
            periodDigits = this.extractPeriodSegment(this.#initialSegment, this.#periodLength, Math.min(10, this.#periodLength));
          }
          if (remainingWholeDigits && periodDigits && remainingWholeDigits === periodDigits.substring(0, remainingWholeDigits.length)) {
            mantissa += "#" + periodDigits;
          } else {
            if (hasMoreWholeDigits) {
              mantissa += remainingWholeDigits;
            }
            mantissa += formattedInitial + "#";
            const formattedPeriod = useRepeatNotation ? Rational.#formatRepeatedDigits(periodDigits, 7) : periodDigits.substring(0, Math.max(1, precision - mantissa.length + 1));
            mantissa += formattedPeriod;
          }
        } else {
          if (hasMoreWholeDigits || hasFractionalPart) {
            mantissa += ".";
            if (hasMoreWholeDigits) {
              const remainingDigits = wholeStr.substring(1);
              if (!hasFractionalPart) {
                const trimmedDigits = remainingDigits.replace(/0+$/, "");
                if (trimmedDigits === "") {
                  mantissa = mantissa.slice(0, -1);
                } else {
                  mantissa += trimmedDigits;
                }
              } else {
                mantissa += remainingDigits;
              }
            }
            if (hasFractionalPart) {
              const formattedInitial = useRepeatNotation ? Rational.#formatRepeatedDigits(this.#initialSegment, 7) : this.#initialSegment;
              const trimmedInitial = formattedInitial.replace(/0+$/, "");
              if (trimmedInitial) {
                mantissa += trimmedInitial;
              } else if (!hasMoreWholeDigits) {
                mantissa = mantissa.slice(0, -1);
              }
            }
          }
        }
      } else if (!hasFractionalPart && !hasMoreWholeDigits) {}
      const result = `${prefix}${mantissa}E${exponent}`;
      return result + this.#generatePeriodInfo(showPeriodInfo);
    }
    if (this.#isTerminating) {
      const leadingZeros = this.#initialSegmentLeadingZeros;
      const rest = this.#initialSegmentRest;
      if (rest === "") {
        return prefix + "0";
      }
      const firstDigit = rest[0];
      const exponent = -(leadingZeros + 1);
      let mantissa = firstDigit;
      if (rest.length > 1) {
        const remainingDigits = Math.max(0, precision - 1);
        mantissa += "." + rest.substring(1, remainingDigits + 1);
      }
      return `${prefix}${mantissa}E${exponent}`;
    } else {
      const firstNonZeroInPeriod = this.#periodDigitsRest;
      if (this.#initialSegmentRest !== "") {
        const firstDigit = this.#initialSegmentRest[0];
        const exponent = -(this.#initialSegmentLeadingZeros + 1);
        let mantissa = firstDigit;
        if (this.#initialSegmentRest.length > 1 || this.#periodDigits !== "") {
          mantissa += ".";
          if (this.#initialSegmentRest.length > 1) {
            mantissa += this.#initialSegmentRest.substring(1);
          }
          mantissa += "#";
          if (this.#leadingZerosInPeriod > 0 && useRepeatNotation && this.#leadingZerosInPeriod > 6) {
            mantissa += `{0~${this.#leadingZerosInPeriod}}`;
          } else if (this.#leadingZerosInPeriod > 0) {
            mantissa += "0".repeat(Math.min(this.#leadingZerosInPeriod, 10));
          }
          if (firstNonZeroInPeriod !== "") {
            const remainingLength = Math.max(1, precision - mantissa.length + 1);
            mantissa += firstNonZeroInPeriod.substring(0, remainingLength);
          }
        }
        const result = `${prefix}${mantissa}E${exponent}`;
        return result + this.#generatePeriodInfo(showPeriodInfo);
      } else if (firstNonZeroInPeriod !== "") {
        const firstDigit = firstNonZeroInPeriod[0];
        const totalLeadingZeros = this.#initialSegmentLeadingZeros + this.#leadingZerosInPeriod;
        const exponent = -(totalLeadingZeros + 1);
        let mantissa = firstDigit;
        if (firstNonZeroInPeriod.length > 1) {
          mantissa += ".#";
          const remainingDigits = Math.max(0, precision - 3);
          mantissa += firstNonZeroInPeriod.substring(1, remainingDigits + 1);
        } else {
          mantissa += ".#" + firstDigit;
        }
        const result = `${prefix}${mantissa}E${exponent}`;
        return result + this.#generatePeriodInfo(showPeriodInfo);
      } else {
        return prefix + "0";
      }
    }
  }
  static from(value) {
    if (value instanceof Rational) {
      return new Rational(value.numerator, value.denominator);
    }
    return new Rational(value);
  }
  static DEFAULT_CF_LIMIT = 1000;
  static fromContinuedFraction(cfArray) {
    if (!Array.isArray(cfArray) || cfArray.length === 0) {
      throw new Error("Continued fraction array cannot be empty");
    }
    const cf = cfArray.map((term) => {
      if (typeof term === "number") {
        return BigInt(term);
      } else if (typeof term === "bigint") {
        return term;
      } else {
        throw new Error(`Invalid continued fraction term: ${term}`);
      }
    });
    for (let i = 1;i < cf.length; i++) {
      if (cf[i] <= 0n) {
        throw new Error(`Continued fraction terms must be positive: ${cf[i]}`);
      }
    }
    if (cf.length === 1) {
      return new Rational(cf[0], 1n);
    }
    let p_prev = 1n;
    let p_curr = cf[0];
    let q_prev = 0n;
    let q_curr = 1n;
    const convergents = [new Rational(p_curr, q_curr)];
    for (let i = 1;i < cf.length; i++) {
      const a = cf[i];
      const p_next = a * p_curr + p_prev;
      const q_next = a * q_curr + q_prev;
      convergents.push(new Rational(p_next, q_next));
      p_prev = p_curr;
      p_curr = p_next;
      q_prev = q_curr;
      q_curr = q_next;
    }
    const result = convergents[convergents.length - 1];
    result.cf = cf.slice(1);
    result._convergents = convergents;
    result.wholePart = cf[0];
    return result;
  }
  toContinuedFraction(maxTerms = Rational.DEFAULT_CF_LIMIT) {
    if (this.#denominator === 0n) {
      throw new Error("Cannot convert infinite value to continued fraction");
    }
    if (this.#denominator === 1n) {
      return [this.#numerator];
    }
    const cf = [];
    let num = this.#numerator;
    let den = this.#denominator;
    const isNeg = num < 0n;
    if (isNeg) {
      num = -num;
    }
    let intPart = num / den;
    if (isNeg) {
      intPart = -intPart;
      if (num % den !== 0n) {
        intPart = intPart - 1n;
        num = den - num % den;
      } else {
        num = num % den;
      }
    } else {
      num = num % den;
    }
    cf.push(intPart);
    let termCount = 1;
    while (num !== 0n && termCount < maxTerms) {
      const quotient = den / num;
      cf.push(quotient);
      const remainder = den % num;
      den = num;
      num = remainder;
      termCount++;
    }
    if (cf.length > 1 && cf[cf.length - 1] === 1n) {
      const secondLast = cf[cf.length - 2];
      cf[cf.length - 2] = secondLast + 1n;
      cf.pop();
    }
    this.cf = cf.slice(1);
    if (!this.wholePart) {
      this.wholePart = cf[0];
    }
    return cf;
  }
  toContinuedFractionString() {
    const cf = this.toContinuedFraction();
    if (cf.length === 1) {
      return `${cf[0]}.~0`;
    }
    const intPart = cf[0];
    const cfTerms = cf.slice(1);
    return `${intPart}.~${cfTerms.join("~")}`;
  }
  static fromContinuedFractionString(cfString) {
    const cfMatch = cfString.match(/^(-?\d+)\.~(.*)$/);
    if (!cfMatch) {
      throw new Error("Invalid continued fraction format");
    }
    const [, integerPart, cfTermsStr] = cfMatch;
    const intPart = BigInt(integerPart);
    if (cfTermsStr === "0") {
      return new Rational(intPart, 1n);
    }
    if (cfTermsStr === "") {
      throw new Error("Continued fraction must have at least one term after .~");
    }
    if (cfTermsStr.endsWith("~")) {
      throw new Error("Continued fraction cannot end with ~");
    }
    if (cfTermsStr.includes("~~")) {
      throw new Error("Invalid continued fraction format: double tilde");
    }
    const terms = cfTermsStr.split("~");
    const cfTerms = [];
    for (const term of terms) {
      if (!/^\d+$/.test(term)) {
        throw new Error(`Invalid continued fraction term: ${term}`);
      }
      const termValue = BigInt(term);
      if (termValue <= 0n) {
        throw new Error(`Continued fraction terms must be positive integers: ${term}`);
      }
      cfTerms.push(termValue);
    }
    const cfArray = [intPart, ...cfTerms];
    return Rational.fromContinuedFraction(cfArray);
  }
  convergents(maxCount = Rational.DEFAULT_CF_LIMIT) {
    if (!this._convergents) {
      const cf = this.toContinuedFraction(maxCount);
      if (cf.length === 1) {
        this._convergents = [new Rational(cf[0], 1n)];
      } else {
        let p_prev = 1n;
        let p_curr = cf[0];
        let q_prev = 0n;
        let q_curr = 1n;
        const convergents = [new Rational(p_curr, q_curr)];
        for (let i = 1;i < cf.length; i++) {
          const a = cf[i];
          const p_next = a * p_curr + p_prev;
          const q_next = a * q_curr + q_prev;
          convergents.push(new Rational(p_next, q_next));
          p_prev = p_curr;
          p_curr = p_next;
          q_prev = q_curr;
          q_curr = q_next;
        }
        this._convergents = convergents;
      }
    }
    if (maxCount && this._convergents && this._convergents.length > maxCount) {
      return this._convergents.slice(0, maxCount);
    }
    return this._convergents || [];
  }
  getConvergent(n) {
    const convergents = this.convergents();
    if (n < 0 || n >= convergents.length) {
      throw new Error(`Convergent index ${n} out of range [0, ${convergents.length - 1}]`);
    }
    return convergents[n];
  }
  static convergentsFromCF(cfInput, maxCount = Rational.DEFAULT_CF_LIMIT) {
    let cfArray;
    if (typeof cfInput === "string") {
      const rational2 = Rational.fromContinuedFractionString(cfInput);
      return rational2.convergents(maxCount);
    } else {
      cfArray = cfInput;
    }
    const rational = Rational.fromContinuedFraction(cfArray);
    return rational.convergents(maxCount);
  }
  approximationError(target) {
    if (!(target instanceof Rational)) {
      throw new Error("Target must be a Rational");
    }
    const diff = this.subtract(target);
    return diff.isNegative ? diff.negate() : diff;
  }
  bestApproximation(maxDenominator) {
    const cf = this.toContinuedFraction();
    let bestApprox = new Rational(cf[0], 1n);
    const convergents = this.convergents();
    for (const convergent of convergents) {
      if (convergent.denominator <= maxDenominator) {
        bestApprox = convergent;
      } else {
        break;
      }
    }
    return bestApprox;
  }
  bitLength() {
    return Math.max(bitLength(this.numerator), bitLength(this.denominator));
  }
}

// ../packages/core/src/rational-interval.js
class RationalInterval {
  #start;
  #end;
  #low;
  #high;
  static zero = Object.freeze(new RationalInterval(Rational.zero, Rational.zero));
  static one = Object.freeze(new RationalInterval(Rational.one, Rational.one));
  static unitInterval = Object.freeze(new RationalInterval(Rational.zero, Rational.one));
  constructor(a, b) {
    const aRational = a instanceof Rational ? a : new Rational(a);
    const bRational = b instanceof Rational ? b : new Rational(b);
    this.#start = aRational;
    this.#end = bRational;
    if (aRational.lessThanOrEqual(bRational)) {
      this.#low = aRational;
      this.#high = bRational;
    } else {
      this.#low = bRational;
      this.#high = aRational;
    }
  }
  get start() {
    return this.#start;
  }
  get end() {
    return this.#end;
  }
  get isAscending() {
    return this.#start.lessThanOrEqual(this.#end);
  }
  get low() {
    return this.#low;
  }
  get high() {
    return this.#high;
  }
  add(other) {
    if (other.value !== undefined && typeof other.value === "bigint") {
      const otherAsRational = new Rational(other.value, 1n);
      const otherAsInterval = new RationalInterval(otherAsRational, otherAsRational);
      return this.add(otherAsInterval);
    } else if (other.numerator !== undefined && other.denominator !== undefined) {
      const otherAsInterval = new RationalInterval(other, other);
      return this.add(otherAsInterval);
    } else if (other.low && other.high) {
      const newLow = this.#low.add(other.low);
      const newHigh = this.#high.add(other.high);
      return new RationalInterval(newLow, newHigh);
    } else {
      throw new Error(`Cannot add ${other.constructor.name} to RationalInterval`);
    }
  }
  subtract(other) {
    if (other.value !== undefined && typeof other.value === "bigint") {
      const otherAsRational = new Rational(other.value, 1n);
      const otherAsInterval = new RationalInterval(otherAsRational, otherAsRational);
      return this.subtract(otherAsInterval);
    } else if (other.numerator !== undefined && other.denominator !== undefined) {
      const otherAsInterval = new RationalInterval(other, other);
      return this.subtract(otherAsInterval);
    } else if (other.low && other.high) {
      const newLow = this.#low.subtract(other.high);
      const newHigh = this.#high.subtract(other.low);
      return new RationalInterval(newLow, newHigh);
    } else {
      throw new Error(`Cannot subtract ${other.constructor.name} from RationalInterval`);
    }
  }
  multiply(other) {
    if (other.value !== undefined && typeof other.value === "bigint") {
      const otherAsRational = new Rational(other.value, 1n);
      const otherAsInterval = new RationalInterval(otherAsRational, otherAsRational);
      return this.multiply(otherAsInterval);
    } else if (other.numerator !== undefined && other.denominator !== undefined) {
      const otherAsInterval = new RationalInterval(other, other);
      return this.multiply(otherAsInterval);
    } else if (other.low && other.high) {
      const products = [
        this.#low.multiply(other.low),
        this.#low.multiply(other.high),
        this.#high.multiply(other.low),
        this.#high.multiply(other.high)
      ];
      let min = products[0];
      let max = products[0];
      for (let i = 1;i < products.length; i++) {
        if (products[i].lessThan(min))
          min = products[i];
        if (products[i].greaterThan(max))
          max = products[i];
      }
      return new RationalInterval(min, max);
    } else {
      throw new Error(`Cannot multiply RationalInterval by ${other.constructor.name}`);
    }
  }
  divide(other) {
    if (other.value !== undefined && typeof other.value === "bigint") {
      if (other.value === 0n) {
        throw new Error("Division by zero");
      }
      const otherAsRational = new Rational(other.value, 1n);
      const otherAsInterval = new RationalInterval(otherAsRational, otherAsRational);
      return this.divide(otherAsInterval);
    } else if (other.numerator !== undefined && other.denominator !== undefined) {
      if (other.numerator === 0n) {
        throw new Error("Division by zero");
      }
      const otherAsInterval = new RationalInterval(other, other);
      return this.divide(otherAsInterval);
    } else if (other.low && other.high) {
      const zero = Rational.zero;
      if (other.low.equals(zero) && other.high.equals(zero)) {
        throw new Error("Division by zero");
      }
      if (other.containsZero()) {
        throw new Error("Cannot divide by an interval containing zero");
      }
      const quotients = [
        this.#low.divide(other.low),
        this.#low.divide(other.high),
        this.#high.divide(other.low),
        this.#high.divide(other.high)
      ];
      let min = quotients[0];
      let max = quotients[0];
      for (let i = 1;i < quotients.length; i++) {
        if (quotients[i].lessThan(min))
          min = quotients[i];
        if (quotients[i].greaterThan(max))
          max = quotients[i];
      }
      return new RationalInterval(min, max);
    } else {
      throw new Error(`Cannot divide RationalInterval by ${other.constructor.name}`);
    }
  }
  reciprocate() {
    if (this.containsZero()) {
      throw new Error("Cannot reciprocate an interval containing zero");
    }
    return new RationalInterval(this.#high.reciprocal(), this.#low.reciprocal());
  }
  negate() {
    return new RationalInterval(this.#high.negate(), this.#low.negate());
  }
  pow(exponent) {
    const n = BigInt(exponent);
    const zero = Rational.zero;
    if (n === 0n) {
      if (this.#low.equals(zero) && this.#high.equals(zero)) {
        throw new Error("Zero cannot be raised to the power of zero");
      }
      if (this.containsZero()) {
        throw new Error("Cannot raise an interval containing zero to the power of zero");
      }
      return new RationalInterval(Rational.one, Rational.one);
    }
    if (n < 0n) {
      if (this.containsZero()) {
        throw new Error("Cannot raise an interval containing zero to a negative power");
      }
      const positivePower = this.pow(-n);
      const reciprocal = new RationalInterval(positivePower.high.reciprocal(), positivePower.low.reciprocal());
      return reciprocal;
    }
    if (n === 1n) {
      return new RationalInterval(this.#low, this.#high);
    }
    if (n % 2n === 0n) {
      let minVal;
      let maxVal;
      if (this.#low.lessThanOrEqual(zero) && this.#high.greaterThanOrEqual(zero)) {
        minVal = new Rational(0);
        const lowPow = this.#low.abs().pow(n);
        const highPow = this.#high.abs().pow(n);
        maxVal = lowPow.greaterThan(highPow) ? lowPow : highPow;
      } else if (this.#high.lessThan(zero)) {
        minVal = this.#high.pow(n);
        maxVal = this.#low.pow(n);
      } else {
        minVal = this.#low.pow(n);
        maxVal = this.#high.pow(n);
      }
      return new RationalInterval(minVal, maxVal);
    } else {
      return new RationalInterval(this.#low.pow(n), this.#high.pow(n));
    }
  }
  mpow(exponent) {
    let n;
    if (typeof exponent === "bigint") {
      n = exponent;
    } else if (typeof exponent === "number") {
      n = BigInt(exponent);
    } else if (typeof exponent === "string") {
      n = BigInt(exponent);
    } else {
      n = BigInt(exponent);
    }
    const zero = Rational.zero;
    if (n === 0n) {
      throw new Error("Multiplicative exponentiation requires at least one factor");
    }
    if (n < 0n) {
      const recipInterval = this.reciprocate();
      return recipInterval.mpow(-n);
    }
    if (n === 1n) {
      return new RationalInterval(this.#low, this.#high);
    }
    if (n === 1n) {
      return new RationalInterval(this.#low, this.#high);
    }
    let result = new RationalInterval(this.#low, this.#high);
    for (let i = 1n;i < n; i++) {
      result = result.multiply(this);
    }
    return result;
  }
  overlaps(other) {
    return !(this.#high.lessThan(other.low) || other.high.lessThan(this.#low));
  }
  contains(other) {
    return this.#low.lessThanOrEqual(other.low) && this.#high.greaterThanOrEqual(other.high);
  }
  containsValue(value) {
    const r = value instanceof Rational ? value : new Rational(value);
    return this.#low.lessThanOrEqual(r) && this.#high.greaterThanOrEqual(r);
  }
  containsZero() {
    const zero = Rational.zero;
    return this.#low.lessThanOrEqual(zero) && this.#high.greaterThanOrEqual(zero);
  }
  equals(other) {
    return this.#low.equals(other.low) && this.#high.equals(other.high);
  }
  intersection(other) {
    if (!this.overlaps(other)) {
      return null;
    }
    const newLow = this.#low.greaterThan(other.low) ? this.#low : other.low;
    const newHigh = this.#high.lessThan(other.high) ? this.#high : other.high;
    return new RationalInterval(newLow, newHigh);
  }
  union(other) {
    const adjacentRight = this.#high.equals(other.low);
    const adjacentLeft = other.high.equals(this.#low);
    if (!this.overlaps(other) && !adjacentRight && !adjacentLeft) {
      return null;
    }
    const newLow = this.#low.lessThan(other.low) ? this.#low : other.low;
    const newHigh = this.#high.greaterThan(other.high) ? this.#high : other.high;
    return new RationalInterval(newLow, newHigh);
  }
  toString() {
    return `${this.#start.toString()}:${this.#end.toString()}`;
  }
  toMixedString() {
    return `${this.#start.toMixedString()}:${this.#end.toMixedString()}`;
  }
  static point(value) {
    let r;
    if (value instanceof Rational) {
      r = value;
    } else if (typeof value === "number") {
      r = new Rational(String(value));
    } else if (typeof value === "string" || typeof value === "bigint") {
      r = new Rational(value);
    } else {
      r = new Rational(0);
    }
    return new RationalInterval(r, r);
  }
  static fromString(str) {
    const parts = str.split(":");
    if (parts.length !== 2) {
      throw new Error("Invalid interval format. Use 'a:b'");
    }
    return new RationalInterval(parts[0], parts[1]);
  }
  toRepeatingDecimal(useRepeatNotation = true) {
    const startDecimal = this.#start.toRepeatingDecimalWithPeriod(useRepeatNotation).decimal;
    const endDecimal = this.#end.toRepeatingDecimalWithPeriod(useRepeatNotation).decimal;
    return `${startDecimal}:${endDecimal}`;
  }
  compactedDecimalInterval() {
    const startStr = this.#start.toDecimal();
    const endStr = this.#end.toDecimal();
    let commonPrefix = "";
    const minLength = Math.min(startStr.length, endStr.length);
    for (let i = 0;i < minLength; i++) {
      if (startStr[i] === endStr[i]) {
        commonPrefix += startStr[i];
      } else {
        break;
      }
    }
    if (commonPrefix.length <= 1 || commonPrefix.startsWith("-") && commonPrefix.length <= 2) {
      return `${startStr}:${endStr}`;
    }
    const startSuffix = startStr.substring(commonPrefix.length);
    const endSuffix = endStr.substring(commonPrefix.length);
    if (!startSuffix || !endSuffix || startSuffix.length !== endSuffix.length) {
      return `${startStr}:${endStr}`;
    }
    if (!/^\d+$/.test(startSuffix) || !/^\d+$/.test(endSuffix)) {
      return `${startStr}:${endStr}`;
    }
    return `${commonPrefix}[${startSuffix},${endSuffix}]`;
  }
  relativeMidDecimalInterval() {
    const midpoint = this.#low.add(this.#high).divide(new Rational(2));
    const offsetEnd = this.#end.subtract(midpoint);
    const offsetStart = this.#start.subtract(midpoint);
    const midpointStr = midpoint.toDecimal();
    if (offsetStart.equals(offsetEnd.negate())) {
      const offsetStr = offsetEnd.abs().toDecimal();
      return `${midpointStr}[+-${offsetStr}]`;
    }
    const offStartStr = offsetStart.toDecimal();
    const offEndStr = offsetEnd.toDecimal();
    return `${midpointStr}[${offStartStr > 0 ? "+" : ""}${offStartStr},${offEndStr > 0 ? "+" : ""}${offEndStr}]`;
  }
  relativeDecimalInterval() {
    const shortestDecimal = this.#findShortestPreciseDecimal();
    const offsetStart = this.#start.subtract(shortestDecimal);
    const offsetEnd = this.#end.subtract(shortestDecimal);
    const decimalStr = shortestDecimal.toDecimal();
    const decimalPlaces = decimalStr.includes(".") ? decimalStr.split(".")[1].length : 0;
    let scaledOffsetStart, scaledOffsetEnd;
    if (decimalPlaces === 0) {
      scaledOffsetStart = offsetStart;
      scaledOffsetEnd = offsetEnd;
    } else {
      const scaleFactor = new Rational(10).pow(decimalPlaces + 1);
      scaledOffsetStart = offsetStart.multiply(scaleFactor);
      scaledOffsetEnd = offsetEnd.multiply(scaleFactor);
    }
    const offsetStartStr = scaledOffsetStart.toDecimal();
    const offsetEndStr = scaledOffsetEnd.toDecimal();
    if (offsetStart.add(offsetEnd).abs().compareTo(new Rational(1, 1e6)) < 0) {
      const avgOffset = scaledOffsetStart.abs().add(scaledOffsetEnd.abs()).divide(new Rational(2));
      return `${decimalStr}[+-${avgOffset.toDecimal()}]`;
    } else {
      const off1 = { v: scaledOffsetStart, s: offsetStartStr };
      const off2 = { v: scaledOffsetEnd, s: offsetEndStr };
      const sorted = [off1, off2].sort((a, b) => b.v.compareTo(a.v));
      const s1 = "+" + sorted[0].v.abs().toDecimal();
      const s2 = "-" + sorted[1].v.abs().toDecimal();
      return `${decimalStr}[${s1},${s2}]`;
    }
  }
  #findShortestPreciseDecimal() {
    const midpoint = this.#low.add(this.#high).divide(new Rational(2));
    for (let precision = 0;precision <= 20; precision++) {
      const scale = new Rational(10).pow(precision);
      const lowScaled = this.#low.multiply(scale);
      const highScaled = this.#high.multiply(scale);
      const minInt = this.#ceilRational(lowScaled);
      const maxInt = this.#floorRational(highScaled);
      if (minInt.compareTo(maxInt) <= 0) {
        const candidates = [];
        let current = minInt;
        while (current.compareTo(maxInt) <= 0) {
          candidates.push(current.divide(scale));
          current = current.add(new Rational(1));
        }
        if (candidates.length > 0) {
          let best = candidates[0];
          let bestDistance = best.subtract(midpoint).abs();
          for (let i = 1;i < candidates.length; i++) {
            const distance = candidates[i].subtract(midpoint).abs();
            const comparison = distance.compareTo(bestDistance);
            if (comparison < 0 || comparison === 0 && candidates[i].compareTo(best) < 0) {
              best = candidates[i];
              bestDistance = distance;
            }
          }
          return best;
        }
      }
    }
    return midpoint;
  }
  #ceilRational(rational) {
    if (rational.denominator === 1n) {
      return rational;
    }
    const quotient = rational.numerator / rational.denominator;
    if (rational.numerator >= 0n) {
      return new Rational(quotient + 1n, 1n);
    } else {
      return new Rational(quotient, 1n);
    }
  }
  #floorRational(rational) {
    if (rational.denominator === 1n) {
      return rational;
    }
    const quotient = rational.numerator / rational.denominator;
    if (rational.numerator >= 0n) {
      return new Rational(quotient, 1n);
    } else {
      return new Rational(quotient - 1n, 1n);
    }
  }
  bitLength() {
    return Math.max(this.#low.bitLength(), this.#high.bitLength());
  }
  mediant() {
    return new Rational(this.#low.numerator + this.#high.numerator, this.#low.denominator + this.#high.denominator);
  }
  midpoint() {
    return this.#low.add(this.#high).divide(new Rational(2));
  }
  shortestDecimal(base = 10) {
    const baseBigInt = BigInt(base);
    if (baseBigInt <= 1n) {
      throw new Error("Base must be greater than 1");
    }
    if (this.#low.equals(this.#high)) {
      const value = this.#low;
      let k2 = 0;
      let denominator2 = 1n;
      while (k2 <= 50) {
        const numeratorCandidate = value.multiply(new Rational(denominator2));
        if (numeratorCandidate.denominator === 1n) {
          return new Rational(numeratorCandidate.numerator, denominator2);
        }
        k2++;
        denominator2 *= baseBigInt;
      }
      return null;
    }
    const intervalLength = this.#high.subtract(this.#low);
    const lengthAsNumber = Number(intervalLength.numerator) / Number(intervalLength.denominator);
    const baseAsNumber = Number(baseBigInt);
    let maxK = Math.ceil(Math.log(1 / lengthAsNumber) / Math.log(baseAsNumber));
    maxK = Math.max(0, maxK + 2);
    let k = 0;
    let denominator = 1n;
    while (k <= maxK) {
      const minNumerator = this.#ceilRational(this.#low.multiply(new Rational(denominator)));
      const maxNumerator = this.#floorRational(this.#high.multiply(new Rational(denominator)));
      if (minNumerator.lessThanOrEqual(maxNumerator)) {
        return new Rational(minNumerator.numerator, denominator);
      }
      k++;
      denominator *= baseBigInt;
    }
    throw new Error("Failed to find shortest decimal representation (exceeded theoretical bound)");
  }
  randomRational(maxDenominator = 1000) {
    const maxDenom = BigInt(maxDenominator);
    if (maxDenom <= 0n) {
      throw new Error("maxDenominator must be positive");
    }
    const validRationals = [];
    for (let denom = 1n;denom <= maxDenom; denom++) {
      const minNum = this.#ceilRational(this.#low.multiply(new Rational(denom)));
      const maxNum = this.#floorRational(this.#high.multiply(new Rational(denom)));
      for (let num = minNum.numerator;num <= maxNum.numerator; num++) {
        const candidate = new Rational(num, denom);
        if (candidate.numerator === num && candidate.denominator === denom) {
          validRationals.push(candidate);
        }
      }
    }
    if (validRationals.length === 0) {
      return this.midpoint();
    }
    const randomIndex = Math.floor(Math.random() * validRationals.length);
    return validRationals[randomIndex];
  }
  #gcd(a, b) {
    a = a < 0n ? -a : a;
    b = b < 0n ? -b : b;
    while (b !== 0n) {
      const temp = b;
      b = a % b;
      a = temp;
    }
    return a;
  }
  E(exponent) {
    const exp = BigInt(exponent);
    let powerOf10;
    if (exp >= 0n) {
      powerOf10 = new Rational(10n ** exp, 1n);
    } else {
      powerOf10 = new Rational(1n, 10n ** -exp);
    }
    const newLow = this.#low.multiply(powerOf10);
    const newHigh = this.#high.multiply(powerOf10);
    return new RationalInterval(newLow, newHigh);
  }
  bitLength() {
    const lowBits = this.#low.bitLength();
    const highBits = this.#high.bitLength();
    return Math.max(lowBits, highBits);
  }
}

// ../packages/core/src/fraction.js
class Fraction {
  #numerator;
  #denominator;
  constructor(numerator, denominator = 1n, options = {}) {
    if (typeof numerator === "string") {
      const parts = numerator.trim().split("/");
      if (parts.length === 1) {
        this.#numerator = BigInt(parts[0]);
        this.#denominator = BigInt(denominator);
      } else if (parts.length === 2) {
        this.#numerator = BigInt(parts[0]);
        this.#denominator = BigInt(parts[1]);
      } else {
        throw new Error("Invalid fraction format. Use 'a/b' or 'a'");
      }
    } else {
      this.#numerator = BigInt(numerator);
      this.#denominator = BigInt(denominator);
    }
    if (this.#denominator === 0n) {
      if (options.allowInfinite && (this.#numerator === 1n || this.#numerator === -1n)) {
        this._isInfinite = true;
      } else {
        throw new Error("Denominator cannot be zero");
      }
    } else {
      this._isInfinite = false;
    }
  }
  get numerator() {
    return this.#numerator;
  }
  get denominator() {
    return this.#denominator;
  }
  get isInfinite() {
    return this._isInfinite || false;
  }
  add(other) {
    if (this.#denominator !== other.denominator) {
      throw new Error("Addition only supported for equal denominators");
    }
    return new Fraction(this.#numerator + other.numerator, this.#denominator);
  }
  subtract(other) {
    if (this.#denominator !== other.denominator) {
      throw new Error("Subtraction only supported for equal denominators");
    }
    return new Fraction(this.#numerator - other.numerator, this.#denominator);
  }
  multiply(other) {
    return new Fraction(this.#numerator * other.numerator, this.#denominator * other.denominator);
  }
  divide(other) {
    if (other.numerator === 0n) {
      throw new Error("Division by zero");
    }
    return new Fraction(this.#numerator * other.denominator, this.#denominator * other.numerator);
  }
  pow(exponent) {
    const n = BigInt(exponent);
    if (n === 0n) {
      if (this.#numerator === 0n) {
        throw new Error("Zero cannot be raised to the power of zero");
      }
      return new Fraction(1, 1);
    }
    if (this.#numerator === 0n && n < 0n) {
      throw new Error("Zero cannot be raised to a negative power");
    }
    if (n < 0n) {
      return new Fraction(this.#denominator ** -n, this.#numerator ** -n);
    }
    return new Fraction(this.#numerator ** n, this.#denominator ** n);
  }
  scale(factor) {
    const scaleFactor = BigInt(factor);
    return new Fraction(this.#numerator * scaleFactor, this.#denominator * scaleFactor);
  }
  static #gcd(a, b) {
    a = a < 0n ? -a : a;
    b = b < 0n ? -b : b;
    while (b !== 0n) {
      const temp = b;
      b = a % b;
      a = temp;
    }
    return a;
  }
  reduce() {
    if (this.#numerator === 0n) {
      return new Fraction(0, 1);
    }
    const gcd = Fraction.#gcd(this.#numerator, this.#denominator);
    const reducedNum = this.#numerator / gcd;
    const reducedDen = this.#denominator / gcd;
    if (reducedDen < 0n) {
      return new Fraction(-reducedNum, -reducedDen);
    }
    return new Fraction(reducedNum, reducedDen);
  }
  static mediant(a, b) {
    return new Fraction(a.numerator + b.numerator, a.denominator + b.denominator);
  }
  toRational() {
    return new Rational(this.#numerator, this.#denominator);
  }
  static fromRational(rational) {
    return new Fraction(rational.numerator, rational.denominator);
  }
  toString() {
    if (this.#denominator === 1n) {
      return this.#numerator.toString();
    }
    return `${this.#numerator}/${this.#denominator}`;
  }
  equals(other) {
    return this.#numerator === other.numerator && this.#denominator === other.denominator;
  }
  lessThan(other) {
    const leftSide = this.#numerator * other.denominator;
    const rightSide = this.#denominator * other.numerator;
    return leftSide < rightSide;
  }
  lessThanOrEqual(other) {
    const leftSide = this.#numerator * other.denominator;
    const rightSide = this.#denominator * other.numerator;
    return leftSide <= rightSide;
  }
  greaterThan(other) {
    const leftSide = this.#numerator * other.denominator;
    const rightSide = this.#denominator * other.numerator;
    return leftSide > rightSide;
  }
  greaterThanOrEqual(other) {
    const leftSide = this.#numerator * other.denominator;
    const rightSide = this.#denominator * other.numerator;
    return leftSide >= rightSide;
  }
  E(exponent) {
    const exp = BigInt(exponent);
    if (exp >= 0n) {
      const newNumerator = this.#numerator * 10n ** exp;
      return new Fraction(newNumerator, this.#denominator);
    } else {
      const newDenominator = this.#denominator * 10n ** -exp;
      return new Fraction(this.#numerator, newDenominator);
    }
  }
  mediant(other) {
    if (this.isInfinite && other.isInfinite) {
      if (this.#numerator === -1n && other.numerator === 1n) {
        return new Fraction(0n, 1n);
      } else if (this.#numerator === 1n && other.numerator === -1n) {
        return new Fraction(0n, 1n);
      }
      throw new Error("Cannot compute mediant of two infinite fractions");
    }
    if (this.isInfinite || other.isInfinite) {
      const newNum2 = this.#numerator + other.numerator;
      const newDen2 = this.#denominator + other.denominator;
      if (newNum2 === 0n && newDen2 === 0n) {
        throw new Error("Mediant would result in 0/0");
      }
      return new Fraction(newNum2, newDen2);
    }
    const newNum = this.#numerator + other.numerator;
    const newDen = this.#denominator + other.denominator;
    return new Fraction(newNum, newDen);
  }
  fareyParents() {
    if (this.isInfinite) {
      throw new Error("Cannot find Farey parents of infinite fraction");
    }
    if (this.#numerator === 0n && this.#denominator === 1n) {
      const left = new Fraction(-1n, 0n, { allowInfinite: true });
      const right = new Fraction(1n, 0n, { allowInfinite: true });
      return { left, right };
    }
    let leftBound = new Fraction(-1n, 0n, { allowInfinite: true });
    let rightBound = new Fraction(1n, 0n, { allowInfinite: true });
    let current = new Fraction(0n, 1n);
    while (!current.equals(this)) {
      if (this.lessThan(current)) {
        rightBound = current;
        current = leftBound.mediant(current);
      } else {
        leftBound = current;
        current = current.mediant(rightBound);
      }
    }
    return { left: leftBound, right: rightBound };
  }
  _extendedGcd(a, b) {
    if (b === 0n) {
      return { gcd: a, x: 1n, y: 0n };
    }
    const result = this._extendedGcd(b, a % b);
    const x = result.y;
    const y = result.x - a / b * result.y;
    return { gcd: result.gcd, x, y };
  }
  static mediantPartner(endpoint, mediant) {
    if (endpoint.isInfinite || mediant.isInfinite) {
      throw new Error("Cannot compute mediant partner with infinite fractions");
    }
    const p = endpoint.numerator;
    const q = endpoint.denominator;
    const a = mediant.numerator;
    const b = mediant.denominator;
    const s = 1n;
    const numerator = a * (q + s) - b * p;
    if (numerator % b !== 0n) {
      const r2 = a * 2n - p;
      const s_calculated = b * 2n - q;
      return new Fraction(r2, s_calculated);
    }
    const r = numerator / b;
    return new Fraction(r, s);
  }
  static isMediantTriple(left, mediant, right) {
    if (mediant.isInfinite) {
      return false;
    }
    if (left.isInfinite && right.isInfinite) {
      return false;
    }
    try {
      const computedMediant = left.mediant(right);
      return mediant.equals(computedMediant);
    } catch (error) {
      return false;
    }
  }
  static isFareyTriple(left, mediant, right) {
    if (!Fraction.isMediantTriple(left, mediant, right)) {
      return false;
    }
    if (!left.isInfinite && !right.isInfinite) {
      const a = left.numerator;
      const b = left.denominator;
      const c = right.numerator;
      const d = right.denominator;
      const determinant = a * d - b * c;
      return determinant === 1n || determinant === -1n;
    }
    return left.isInfinite || right.isInfinite;
  }
  sternBrocotParent() {
    if (this.isInfinite) {
      throw new Error("Infinite fractions don't have parents in Stern-Brocot tree");
    }
    if (this.numerator === 0n && this.denominator === 1n) {
      return null;
    }
    const path = this.sternBrocotPath();
    if (path.length === 0) {
      return null;
    }
    const parentPath = path.slice(0, -1);
    return Fraction.fromSternBrocotPath(parentPath);
  }
  sternBrocotChildren() {
    if (this.isInfinite) {
      throw new Error("Infinite fractions don't have children in Stern-Brocot tree");
    }
    const currentPath = this.sternBrocotPath();
    const leftPath = [...currentPath, "L"];
    const rightPath = [...currentPath, "R"];
    return {
      left: Fraction.fromSternBrocotPath(leftPath),
      right: Fraction.fromSternBrocotPath(rightPath)
    };
  }
  sternBrocotPath() {
    if (this.isInfinite) {
      throw new Error("Infinite fractions don't have tree paths");
    }
    const reduced = this.reduce();
    if (reduced.numerator === 0n && reduced.denominator === 1n) {
      return [];
    }
    let left = new Fraction(-1, 0, { allowInfinite: true });
    let right = new Fraction(1, 0, { allowInfinite: true });
    let current = new Fraction(0, 1);
    const path = [];
    while (!current.equals(reduced)) {
      if (reduced.lessThan(current)) {
        path.push("L");
        right = current;
        current = left.mediant(current);
      } else {
        path.push("R");
        left = current;
        current = current.mediant(right);
      }
      if (path.length > 500) {
        throw new Error("Stern-Brocot path too long - this may indicate a bug in the algorithm");
      }
    }
    return path;
  }
  static fromSternBrocotPath(path) {
    let left = new Fraction(-1, 0, { allowInfinite: true });
    let right = new Fraction(1, 0, { allowInfinite: true });
    let current = new Fraction(0, 1);
    for (const direction of path) {
      if (direction === "L") {
        right = current;
        current = left.mediant(current);
      } else if (direction === "R") {
        left = current;
        current = current.mediant(right);
      } else {
        throw new Error(`Invalid direction in path: ${direction}`);
      }
    }
    return current;
  }
  isSternBrocotValid() {
    if (this.isInfinite) {
      return this.numerator === 1n || this.numerator === -1n;
    }
    try {
      const path = this.sternBrocotPath();
      const reconstructed = Fraction.fromSternBrocotPath(path);
      return this.equals(reconstructed);
    } catch (error) {
      return false;
    }
  }
  sternBrocotDepth() {
    if (this.isInfinite) {
      return Infinity;
    }
    if (this.numerator === 0n && this.denominator === 1n) {
      return 0;
    }
    return this.sternBrocotPath().length;
  }
  sternBrocotAncestors() {
    if (this.isInfinite) {
      return [];
    }
    const ancestors = [];
    const path = this.sternBrocotPath();
    for (let i = 0;i < path.length; i++) {
      const partialPath = path.slice(0, i);
      ancestors.push(Fraction.fromSternBrocotPath(partialPath));
    }
    ancestors.reverse();
    return ancestors;
  }
}

// ../packages/core/src/fraction-interval.js
class FractionInterval {
  #low;
  #high;
  constructor(a, b) {
    if (!(a instanceof Fraction) || !(b instanceof Fraction)) {
      throw new Error("FractionInterval endpoints must be Fraction objects");
    }
    if (a.lessThanOrEqual(b)) {
      this.#low = a;
      this.#high = b;
    } else {
      this.#low = b;
      this.#high = a;
    }
  }
  get low() {
    return this.#low;
  }
  get high() {
    return this.#high;
  }
  mediantSplit() {
    const mediant = Fraction.mediant(this.#low, this.#high);
    return [
      new FractionInterval(this.#low, mediant),
      new FractionInterval(mediant, this.#high)
    ];
  }
  partitionWithMediants(n = 1) {
    if (n < 0) {
      throw new Error("Depth of mediant partitioning must be non-negative");
    }
    if (n === 0) {
      return [this];
    }
    let intervals = [this];
    for (let level = 0;level < n; level++) {
      const newIntervals = [];
      for (const interval of intervals) {
        const splitIntervals = interval.mediantSplit();
        newIntervals.push(...splitIntervals);
      }
      intervals = newIntervals;
    }
    return intervals;
  }
  partitionWith(fn) {
    const partitionPoints = fn(this.#low, this.#high);
    if (!Array.isArray(partitionPoints)) {
      throw new Error("Partition function must return an array of Fractions");
    }
    for (const point of partitionPoints) {
      if (!(point instanceof Fraction)) {
        throw new Error("Partition function must return Fraction objects");
      }
    }
    const allPoints = [this.#low, ...partitionPoints, this.#high];
    allPoints.sort((a, b) => {
      if (a.equals(b))
        return 0;
      if (a.lessThan(b))
        return -1;
      return 1;
    });
    if (!allPoints[0].equals(this.#low) || !allPoints[allPoints.length - 1].equals(this.#high)) {
      throw new Error("Partition points should be within the interval");
    }
    const uniquePoints = [];
    for (let i = 0;i < allPoints.length; i++) {
      if (i === 0 || !allPoints[i].equals(allPoints[i - 1])) {
        uniquePoints.push(allPoints[i]);
      }
    }
    const intervals = [];
    for (let i = 0;i < uniquePoints.length - 1; i++) {
      intervals.push(new FractionInterval(uniquePoints[i], uniquePoints[i + 1]));
    }
    return intervals;
  }
  toRationalInterval() {
    return new RationalInterval(this.#low.toRational(), this.#high.toRational());
  }
  static fromRationalInterval(interval) {
    return new FractionInterval(Fraction.fromRational(interval.low), Fraction.fromRational(interval.high));
  }
  toString() {
    return `${this.#low.toString()}:${this.#high.toString()}`;
  }
  equals(other) {
    return this.#low.equals(other.low) && this.#high.equals(other.high);
  }
  E(exponent) {
    const newLow = this.#low.E(exponent);
    const newHigh = this.#high.E(exponent);
    return new FractionInterval(newLow, newHigh);
  }
}

// ../packages/core/src/integer.js
class Integer {
  #value;
  static zero = new Integer(0);
  static one = new Integer(1);
  constructor(value) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!/^-?\d+$/.test(trimmed)) {
        throw new Error("Invalid integer format. Must be a whole number");
      }
      this.#value = BigInt(trimmed);
    } else {
      this.#value = BigInt(value);
    }
  }
  get value() {
    return this.#value;
  }
  add(other) {
    if (other instanceof Integer) {
      return new Integer(this.#value + other.value);
    } else if (other instanceof Rational) {
      const thisAsRational = new Rational(this.#value, 1n);
      return thisAsRational.add(other);
    } else if (other.low && other.high && typeof other.low.equals === "function") {
      const thisAsRational = new Rational(this.#value, 1n);
      const IntervalClass = other.constructor;
      const thisAsInterval = new IntervalClass(thisAsRational, thisAsRational);
      return thisAsInterval.add(other);
    } else {
      throw new Error(`Cannot add ${other.constructor.name} to Integer`);
    }
  }
  subtract(other) {
    if (other instanceof Integer) {
      return new Integer(this.#value - other.value);
    } else if (other instanceof Rational) {
      const thisAsRational = new Rational(this.#value, 1n);
      return thisAsRational.subtract(other);
    } else if (other.low && other.high && typeof other.low.equals === "function") {
      const thisAsRational = new Rational(this.#value, 1n);
      const IntervalClass = other.constructor;
      const thisAsInterval = new IntervalClass(thisAsRational, thisAsRational);
      return thisAsInterval.subtract(other);
    } else {
      throw new Error(`Cannot subtract ${other.constructor.name} from Integer`);
    }
  }
  multiply(other) {
    if (other instanceof Integer) {
      return new Integer(this.#value * other.value);
    } else if (other instanceof Rational) {
      const thisAsRational = new Rational(this.#value, 1n);
      return thisAsRational.multiply(other);
    } else if (other.low && other.high && typeof other.low.equals === "function") {
      const thisAsRational = new Rational(this.#value, 1n);
      const IntervalClass = other.constructor;
      const thisAsInterval = new IntervalClass(thisAsRational, thisAsRational);
      return thisAsInterval.multiply(other);
    } else {
      throw new Error(`Cannot multiply Integer by ${other.constructor.name}`);
    }
  }
  divide(other) {
    if (other instanceof Integer) {
      if (other.value === 0n) {
        throw new Error("Division by zero");
      }
      if (this.#value % other.value === 0n) {
        return new Integer(this.#value / other.value);
      } else {
        return new Rational(this.#value, other.value);
      }
    } else if (other instanceof Rational) {
      const thisAsRational = new Rational(this.#value, 1n);
      return thisAsRational.divide(other);
    } else if (other.low && other.high && typeof other.low.equals === "function") {
      const thisAsRational = new Rational(this.#value, 1n);
      const IntervalClass = other.constructor;
      const thisAsInterval = new IntervalClass(thisAsRational, thisAsRational);
      return thisAsInterval.divide(other);
    } else {
      throw new Error(`Cannot divide Integer by ${other.constructor.name}`);
    }
  }
  modulo(other) {
    if (other.value === 0n) {
      throw new Error("Modulo by zero");
    }
    return new Integer(this.#value % other.value);
  }
  negate() {
    return new Integer(-this.#value);
  }
  pow(exponent) {
    const exp = exponent instanceof Integer ? exponent.value : BigInt(exponent);
    if (exp === 0n) {
      if (this.#value === 0n) {
        throw new Error("Zero cannot be raised to the power of zero");
      }
      return new Integer(1);
    }
    if (exp < 0n) {
      if (this.#value === 0n) {
        throw new Error("Zero cannot be raised to a negative power");
      }
      const positiveExp = -exp;
      const positiveResult = this.pow(positiveExp);
      return new Rational(1, positiveResult.value);
    }
    let result = 1n;
    let base = this.#value;
    let n = exp;
    while (n > 0n) {
      if (n & 1n) {
        result *= base;
      }
      base *= base;
      n >>= 1n;
    }
    return new Integer(result);
  }
  equals(other) {
    return this.#value === other.value;
  }
  compareTo(other) {
    if (this.#value < other.value)
      return -1;
    if (this.#value > other.value)
      return 1;
    return 0;
  }
  lessThan(other) {
    return this.#value < other.value;
  }
  lessThanOrEqual(other) {
    return this.#value <= other.value;
  }
  greaterThan(other) {
    return this.#value > other.value;
  }
  greaterThanOrEqual(other) {
    return this.#value >= other.value;
  }
  abs() {
    return this.#value < 0n ? this.negate() : new Integer(this.#value);
  }
  sign() {
    if (this.#value < 0n)
      return new Integer(-1);
    if (this.#value > 0n)
      return new Integer(1);
    return new Integer(0);
  }
  isEven() {
    return this.#value % 2n === 0n;
  }
  isOdd() {
    return this.#value % 2n !== 0n;
  }
  isZero() {
    return this.#value === 0n;
  }
  isPositive() {
    return this.#value > 0n;
  }
  isNegative() {
    return this.#value < 0n;
  }
  gcd(other) {
    let a = this.#value < 0n ? -this.#value : this.#value;
    let b = other.value < 0n ? -other.value : other.value;
    while (b !== 0n) {
      const temp = b;
      b = a % b;
      a = temp;
    }
    return new Integer(a);
  }
  lcm(other) {
    if (this.#value === 0n || other.value === 0n) {
      return new Integer(0);
    }
    const gcd = this.gcd(other);
    const product = this.multiply(other).abs();
    return product.divide(gcd);
  }
  toString(base) {
    if (base === undefined) {
      return this.#value.toString();
    }
    if (base instanceof BaseSystem) {
      return base.fromDecimal(this.#value);
    }
    if (typeof base === "number") {
      if (base === 10) {
        return this.#value.toString();
      }
      return BaseSystem.fromBase(base).fromDecimal(this.#value);
    }
    return this.#value.toString();
  }
  toBase(baseSystem) {
    if (!(baseSystem instanceof BaseSystem)) {
      throw new Error("Argument must be a BaseSystem");
    }
    return baseSystem.fromDecimal(this.#value);
  }
  toNumber() {
    return Number(this.#value);
  }
  toRational() {
    return new Rational(this.#value, 1n);
  }
  static from(value) {
    if (value instanceof Integer) {
      return new Integer(value.value);
    }
    return new Integer(value);
  }
  static fromRational(rational) {
    if (rational.denominator !== 1n) {
      throw new Error("Rational is not a whole number");
    }
    return new Integer(rational.numerator);
  }
  E(exponent) {
    const exp = BigInt(exponent);
    if (exp >= 0n) {
      const newValue = this.#value * 10n ** exp;
      return new Integer(newValue);
    } else {
      const powerOf10 = new Rational(1n, 10n ** -exp);
      const thisAsRational = new Rational(this.#value, 1n);
      return thisAsRational.multiply(powerOf10);
    }
  }
  factorial() {
    if (this.#value < 0n) {
      throw new Error("Factorial is not defined for negative integers");
    }
    if (this.#value === 0n || this.#value === 1n) {
      return new Integer(1);
    }
    let result = 1n;
    for (let i = 2n;i <= this.#value; i++) {
      result *= i;
    }
    return new Integer(result);
  }
  doubleFactorial() {
    if (this.#value < 0n) {
      throw new Error("Double factorial is not defined for negative integers");
    }
    if (this.#value === 0n || this.#value === 1n) {
      return new Integer(1);
    }
    let result = 1n;
    for (let i = this.#value;i > 0n; i -= 2n) {
      result *= i;
    }
    return new Integer(result);
  }
  bitLength() {
    if (this.#value === 0n)
      return 0;
    return this.#value < 0n ? (-this.#value).toString(2).length : this.#value.toString(2).length;
  }
}

// ../rix/src/runtime/hole.js
var HOLE = Object.freeze({ __rix_hole__: true });
var isHole = (v) => v === HOLE;

// ../rix/src/runtime/tensor.js
function exactInteger(value, label = "Index") {
  if (value instanceof Integer) {
    return Number(value.value);
  }
  if (value instanceof Rational) {
    if (value.denominator !== 1n) {
      throw new Error(`${label} must be an integer`);
    }
    return Number(value.numerator);
  }
  if (typeof value === "bigint") {
    return Number(value);
  }
  if (typeof value === "number") {
    if (!Number.isInteger(value)) {
      throw new Error(`${label} must be an integer`);
    }
    return value;
  }
  if (value && typeof value === "object") {
    if (typeof value.value === "bigint") {
      return Number(value.value);
    }
    if (typeof value.numerator === "bigint" && typeof value.denominator === "bigint") {
      if (value.denominator !== 1n) {
        throw new Error(`${label} must be an integer`);
      }
      return Number(value.numerator);
    }
  }
  throw new Error(`${label} must be an integer`);
}
function normalizeIndex(rawIndex, dimLength, axis) {
  const index = exactInteger(rawIndex, `Index for axis ${axis + 1}`);
  if (index === 0) {
    throw new Error(`Tensor index 0 is invalid on axis ${axis + 1}`);
  }
  const normalized = index < 0 ? dimLength + 1 + index : index;
  if (normalized < 1 || normalized > dimLength) {
    throw new Error(`Tensor index ${index} is out of range for axis ${axis + 1} with length ${dimLength}`);
  }
  return normalized;
}
function intervalEndpoints(value) {
  if (value instanceof RationalInterval) {
    return [value.start, value.end];
  }
  if (value && value.type === "interval") {
    return [value.lo, value.hi];
  }
  return null;
}
function valueToSelectorSpec(value) {
  const endpoints = intervalEndpoints(value);
  if (endpoints) {
    return {
      kind: "slice",
      start: endpoints[0],
      end: endpoints[1]
    };
  }
  return {
    kind: "index",
    value
  };
}
function isTensor(value) {
  return !!value && value.type === "tensor" && Array.isArray(value.data) && Array.isArray(value.shape) && Array.isArray(value.strides);
}
function tensorRank(tensor) {
  return tensor.shape.length;
}
function tensorShape(tensor) {
  return [...tensor.shape];
}
function tensorSize(tensor) {
  return tensor.shape.reduce((product, dim) => product * dim, 1);
}
function computeDefaultStrides(shape) {
  const strides = new Array(shape.length);
  let stride = 1;
  for (let i = shape.length - 1;i >= 0; i--) {
    strides[i] = stride;
    stride *= shape[i];
  }
  return strides;
}
function createTensor(shape, data = null, options = {}) {
  if (!Array.isArray(shape)) {
    throw new Error("Tensor shape must be an array");
  }
  const normalizedShape = shape.map((dim, axis) => {
    const n = exactInteger(dim, `Tensor shape axis ${axis + 1}`);
    if (n < 0) {
      throw new Error(`Tensor shape axis ${axis + 1} must be nonnegative`);
    }
    return n;
  });
  const size = normalizedShape.reduce((product, dim) => product * dim, 1);
  const actualData = data ? [...data] : new Array(size).fill(HOLE);
  if (actualData.length !== size) {
    throw new Error(`Tensor literal element count mismatch (expected ${size}, got ${actualData.length})`);
  }
  return {
    type: "tensor",
    data: actualData,
    shape: normalizedShape,
    strides: options.strides ? [...options.strides] : computeDefaultStrides(normalizedShape),
    offset: options.offset ?? 0,
    _ext: options.ext ?? new Map([["_mutable", new Integer(1n)]])
  };
}
function createTensorView(tensor, view) {
  if (!isTensor(tensor)) {
    throw new Error("Cannot create a tensor view from a non-tensor value");
  }
  return {
    type: "tensor",
    data: tensor.data,
    shape: [...view.shape],
    strides: [...view.strides],
    offset: view.offset,
    _ext: tensor._ext
  };
}
function tensorIndexTuple(indices) {
  return {
    type: "tuple",
    values: indices.map((index) => new Integer(BigInt(index)))
  };
}
function linearIndexToTuple(linearIndex, shape) {
  if (shape.length === 0) {
    return [];
  }
  const defaultStrides = computeDefaultStrides(shape);
  const tuple = new Array(shape.length);
  let remaining = linearIndex;
  for (let axis = 0;axis < shape.length; axis++) {
    const stride = defaultStrides[axis];
    const dim = shape[axis];
    if (dim === 0) {
      return [];
    }
    tuple[axis] = Math.floor(remaining / stride) + 1;
    remaining %= stride;
  }
  return tuple;
}
function tensorOffsetForTuple(tensor, tuple) {
  let offset = tensor.offset;
  for (let axis = 0;axis < tensor.shape.length; axis++) {
    offset += (tuple[axis] - 1) * tensor.strides[axis];
  }
  return offset;
}
function forEachTensorCell(tensor, callback) {
  const size = tensorSize(tensor);
  if (tensor.shape.length === 0) {
    callback(tensor.data[tensor.offset], [], tensor.offset);
    return;
  }
  for (let linear = 0;linear < size; linear++) {
    const tuple = linearIndexToTuple(linear, tensor.shape);
    const offset = tensorOffsetForTuple(tensor, tuple);
    callback(tensor.data[offset], tuple, offset);
  }
}
function normalizeTensorSelectors(tensor, selectorSpecs) {
  let specs = selectorSpecs;
  if (specs.length === 1 && specs[0]?.kind === "index" && specs[0].value && specs[0].value.type === "tuple") {
    specs = specs[0].value.values.map((value) => valueToSelectorSpec(value));
  }
  if (specs.length !== tensor.shape.length) {
    throw new Error(`Tensor rank mismatch: expected ${tensor.shape.length} indices, got ${specs.length}`);
  }
  return specs.map((spec, axis) => {
    if (spec.kind === "index") {
      const normalizedSpec = valueToSelectorSpec(spec.value);
      if (normalizedSpec.kind === "slice") {
        spec = normalizedSpec;
      }
    }
    if (spec.kind === "full") {
      const start = normalizeIndex(1, tensor.shape[axis], axis);
      const end = normalizeIndex(-1, tensor.shape[axis], axis);
      const direction = start <= end ? 1 : -1;
      return {
        kind: "slice",
        start,
        end,
        direction,
        length: Math.abs(end - start) + 1
      };
    }
    if (spec.kind === "slice") {
      const start = normalizeIndex(spec.start, tensor.shape[axis], axis);
      const end = normalizeIndex(spec.end, tensor.shape[axis], axis);
      const direction = start <= end ? 1 : -1;
      return {
        kind: "slice",
        start,
        end,
        direction,
        length: Math.abs(end - start) + 1
      };
    }
    return {
      kind: "index",
      index: normalizeIndex(spec.value, tensor.shape[axis], axis)
    };
  });
}
function tensorGetBySelectors(tensor, selectorSpecs) {
  const selectors = normalizeTensorSelectors(tensor, selectorSpecs);
  let offset = tensor.offset;
  const shape = [];
  const strides = [];
  for (let axis = 0;axis < selectors.length; axis++) {
    const selector = selectors[axis];
    const stride = tensor.strides[axis];
    if (selector.kind === "index") {
      offset += (selector.index - 1) * stride;
      continue;
    }
    offset += (selector.start - 1) * stride;
    shape.push(selector.length);
    strides.push(stride * selector.direction);
  }
  if (shape.length === 0) {
    const value = tensor.data[offset];
    return isHole(value) ? null : value;
  }
  return createTensorView(tensor, { shape, strides, offset });
}
function tensorAssignBySelectors(tensor, selectorSpecs, value) {
  const selectors = normalizeTensorSelectors(tensor, selectorSpecs);
  let offset = tensor.offset;
  const shape = [];
  const strides = [];
  for (let axis = 0;axis < selectors.length; axis++) {
    const selector = selectors[axis];
    const stride = tensor.strides[axis];
    if (selector.kind === "index") {
      offset += (selector.index - 1) * stride;
      continue;
    }
    offset += (selector.start - 1) * stride;
    shape.push(selector.length);
    strides.push(stride * selector.direction);
  }
  if (shape.length === 0) {
    tensor.data[offset] = value;
    return value;
  }
  const view = createTensorView(tensor, { shape, strides, offset });
  forEachTensorCell(view, (_cellValue, _tuple, cellOffset) => {
    tensor.data[cellOffset] = value;
  });
  return value;
}
function coerceShapeValue(shapeValue) {
  if (isTensor(shapeValue)) {
    return tensorShape(shapeValue);
  }
  if (shapeValue && shapeValue.type === "tuple") {
    return shapeValue.values.map((value, axis) => exactInteger(value, `Tensor shape axis ${axis + 1}`));
  }
  throw new Error("TGEN expects a tensor or tuple shape");
}

// ../rix/src/eval/functions/keyof.js
function normalizeKeyPrimitive(value) {
  if (typeof value === "string")
    return value;
  if (value && value.type === "string")
    return value.value;
  if (value instanceof Integer)
    return value.value.toString();
  if (typeof value === "number" || typeof value === "bigint")
    return String(value);
  return null;
}
function keyOf(value) {
  const direct = normalizeKeyPrimitive(value);
  if (direct !== null)
    return direct;
  const meta = value?._ext;
  const metaKey = meta instanceof Map ? meta.get("key") : null;
  if (metaKey === null || metaKey === undefined) {
    throw new Error("Value cannot be used as a map key (not string/int and no .key property)");
  }
  const normalizedMeta = normalizeKeyPrimitive(metaKey);
  if (normalizedMeta === null) {
    throw new Error("Invalid .key type; must be string or integer");
  }
  return normalizedMeta;
}
function canonicalizeMetaKey(value) {
  const normalized = normalizeKeyPrimitive(value);
  if (normalized === null) {
    throw new Error("Invalid .key type; must be string or integer");
  }
  return normalized;
}

// ../rix/src/eval/ir-to-text.js
function irToText(node, options = {}) {
  const { langPrefix = false, indent = 0, pretty = false } = options;
  const prefix = langPrefix ? "@_" : "";
  const indentStr = pretty ? "  ".repeat(indent) : "";
  if (node === null || node === undefined) {
    return "null";
  }
  if (typeof node === "string") {
    return JSON.stringify(node);
  }
  if (typeof node === "number" || typeof node === "bigint") {
    return String(node);
  }
  if (typeof node === "boolean") {
    return String(node);
  }
  if (Array.isArray(node)) {
    const items = node.map((item) => irToText(item, { langPrefix, indent: indent + 1, pretty }));
    return `[${items.join(", ")}]`;
  }
  if (node.fn) {
    const fnName = `${prefix}${node.fn}`;
    const argTexts = node.args.map((arg) => irToText(arg, { langPrefix, indent: indent + 1, pretty }));
    if (pretty && argTexts.length > 0 && argTexts.join(", ").length > 60) {
      const innerIndent = "  ".repeat(indent + 1);
      return `${fnName}(
${argTexts.map((a) => `${innerIndent}${a}`).join(`,
`)}
${indentStr})`;
    }
    return `${fnName}(${argTexts.join(", ")})`;
  }
  if (typeof node === "object") {
    return serializeObject(node, { langPrefix, indent, pretty });
  }
  return String(node);
}
function serializeObject(obj, options) {
  const { langPrefix, indent, pretty } = options;
  const entries = Object.entries(obj).map(([key, value]) => {
    const valText = irToText(value, {
      langPrefix,
      indent: indent + 1,
      pretty
    });
    return `${key}: ${valText}`;
  });
  return `{${entries.join(", ")}}`;
}

// ../rix/src/eval/format.js
function tensorValueAtTuple(tensor, tuple) {
  const value = tensor.data[tensorOffsetForTuple(tensor, tuple)];
  return value;
}
function tensorDisplayLevels(shape) {
  if (shape.length === 0)
    return [];
  if (shape.length === 1) {
    return [{ size: shape[0], separatorCount: 0 }];
  }
  const levels = [];
  for (let axis = shape.length - 1;axis >= 2; axis--) {
    levels.push({ size: shape[axis], separatorCount: axis });
  }
  levels.push({ size: shape[0], separatorCount: 1 });
  levels.push({ size: shape[1], separatorCount: 0 });
  return levels;
}
function displayPathToExternalTuple(displayPath) {
  if (displayPath.length === 1) {
    return [displayPath[0]];
  }
  const higher = displayPath.slice(0, -2).reverse();
  return [displayPath[displayPath.length - 2], displayPath[displayPath.length - 1], ...higher];
}
function tensorSeparator(separatorCount) {
  if (separatorCount <= 0)
    return ", ";
  if (separatorCount === 1)
    return "; ";
  return ` ${";".repeat(separatorCount)} `;
}
function formatTensorBody(tensor, formatValue, levels, levelIndex = 0, displayPath = []) {
  const level = levels[levelIndex];
  if (level.separatorCount === 0) {
    const values = [];
    for (let i = 1;i <= level.size; i++) {
      const tuple = displayPathToExternalTuple([...displayPath, i]);
      values.push(formatValue(tensorValueAtTuple(tensor, tuple)));
    }
    return values.join(", ");
  }
  const parts = [];
  for (let i = 1;i <= level.size; i++) {
    parts.push(formatTensorBody(tensor, formatValue, levels, levelIndex + 1, [...displayPath, i]));
  }
  return parts.join(tensorSeparator(level.separatorCount));
}
function formatTensor(tensor, formatValue) {
  const shapeText = tensor.shape.join("x");
  if (tensorSize(tensor) === 0) {
    return `{:${shapeText}:}`;
  }
  const levels = tensorDisplayLevels(tensor.shape);
  return `{:${shapeText}: ${formatTensorBody(tensor, formatValue, levels)} }`;
}
function truncate(text, limit = 40) {
  if (text.length <= limit)
    return text;
  return `${text.slice(0, Math.max(0, limit - 3))}...`;
}
var BINARY_OPS = new Map([
  ["ADD", "+"],
  ["SUB", "-"],
  ["MUL", "*"],
  ["DIV", "/"],
  ["INTDIV", "//"],
  ["MOD", "%"],
  ["POW", "^"],
  ["POWPROD", "**"],
  ["EQ", "=="],
  ["NEQ", "!="],
  ["LT", "<"],
  ["GT", ">"],
  ["LTE", "<="],
  ["GTE", ">="],
  ["AND", "&&"],
  ["OR", "||"]
]);
function previewIr(node, options = {}) {
  const { maxLen = 40, depth = 0 } = options;
  if (node === null)
    return "_";
  if (node === undefined)
    return "undefined";
  if (typeof node === "string")
    return node;
  if (typeof node === "number" || typeof node === "bigint" || typeof node === "boolean") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return truncate(`[${node.map((item) => previewIr(item, { maxLen: 12, depth: depth + 1 })).join(", ")}]`, maxLen);
  }
  if (!node || typeof node !== "object") {
    return truncate(String(node), maxLen);
  }
  if (!node.fn) {
    return truncate(irToText(node), maxLen);
  }
  if (depth >= 5) {
    return truncate(irToText(node), maxLen);
  }
  switch (node.fn) {
    case "LITERAL":
      return String(node.args[0]);
    case "STRING":
      return JSON.stringify(node.args[0]);
    case "NULL":
      return "_";
    case "RETRIEVE":
      return node.args[0];
    case "OUTER_RETRIEVE":
      return `@${node.args[0]}`;
    case "SELF":
      return "$";
    case "PARENT_SELF":
      return "$$";
    case "NEG":
      return truncate(`-${previewIr(node.args[0], { maxLen: maxLen - 1, depth: depth + 1 })}`, maxLen);
    case "CALL":
      return truncate(`${node.args[0]}(${node.args.slice(1).map((arg) => previewIr(arg, { maxLen: 16, depth: depth + 1 })).join(", ")})`, maxLen);
    case "CALL_EXPR":
      return truncate(`${previewIr(node.args[0], { maxLen: 14, depth: depth + 1 })}(${node.args.slice(1).map((arg) => previewIr(arg, { maxLen: 12, depth: depth + 1 })).join(", ")})`, maxLen);
    case "BLOCK": {
      const start = node.args[0]?.kind === "block_meta" ? 1 : 0;
      const statements = node.args.slice(start).map((stmt) => previewIr(stmt, { maxLen: 18, depth: depth + 1 }));
      return truncate(`{ ${statements.join("; ")} }`, maxLen);
    }
    case "ASSIGN":
    case "ASSIGN_COPY":
    case "ASSIGN_UPDATE":
    case "ASSIGN_DEEP_COPY":
    case "ASSIGN_DEEP_UPDATE":
    case "OUTER_ASSIGN":
      return truncate(`${node.args[0]} = ${previewIr(node.args[1], { maxLen: Math.max(12, maxLen - String(node.args[0]).length - 3), depth: depth + 1 })}`, maxLen);
    case "ASSIGN_EXPR":
      return truncate(`${previewIr(node.args[0], { maxLen: 12, depth: depth + 1 })} = ${previewIr(node.args[1], { maxLen: 16, depth: depth + 1 })}`, maxLen);
    case "OUTER_UPDATE":
      return truncate(`@${node.args[0]} ~= ${previewIr(node.args[1], { maxLen: Math.max(12, maxLen - String(node.args[0]).length - 5), depth: depth + 1 })}`, maxLen);
    default:
      break;
  }
  const op = BINARY_OPS.get(node.fn);
  if (op && node.args.length >= 2) {
    return truncate(`${previewIr(node.args[0], { maxLen: 14, depth: depth + 1 })} ${op} ${previewIr(node.args[1], { maxLen: 14, depth: depth + 1 })}`, maxLen);
  }
  return truncate(irToText(node), maxLen);
}
function formatCallablePreview(fn, label) {
  const params = fn.params?.positional?.map((param) => param.isRest ? `...${param.name}` : param.name).join(", ") || "";
  const prepEntries = [
    ...Array.isArray(fn.params?.conditionals) ? fn.params.conditionals : [],
    ...Array.isArray(fn.params?.prep) ? fn.params.prep : []
  ];
  const prepText = prepEntries.length > 0 ? ` ${fn.params?.prepStrict ? "?!-" : "?-"} [${truncate(prepEntries.map((entry) => previewIr(entry, { maxLen: 18 })).join(", "), 42)}]` : "";
  const bodyText = previewIr(fn.body, { maxLen: 48 });
  const displayName = fn.__name || fn.name || null;
  const nameText = displayName ? ` ${displayName}:` : ":";
  return `[${label}${nameText} (${params})${prepText} -> ${bodyText}]`;
}
function formatMultifunctionPreview(multifn) {
  const displayName = multifn.__name || null;
  const variants = (multifn.values || []).map((variant, index) => {
    if (!variant || variant.type !== "function" && variant.type !== "lambda") {
      return `#${index + 1}: <invalid>`;
    }
    const params = variant.params?.positional?.map((param) => param.isRest ? `...${param.name}` : param.name).join(", ") || "";
    const prepEntries = [
      ...Array.isArray(variant.params?.conditionals) ? variant.params.conditionals : [],
      ...Array.isArray(variant.params?.prep) ? variant.params.prep : []
    ];
    const prepText = prepEntries.length > 0 ? ` ${variant.params?.prepStrict ? "?!-" : "?-"} [${truncate(prepEntries.map((entry) => previewIr(entry, { maxLen: 12 })).join(", "), 24)}]` : "";
    const variantName = variant.__name ? `/${variant.__name}/ ` : "";
    const bodyText = previewIr(variant.body, { maxLen: 20 });
    return `${variantName}(${params})${prepText} -> ${bodyText}`;
  });
  if (variants.length === 0) {
    return displayName ? `[Multifunction ${displayName}: empty]` : "[Multifunction: empty]";
  }
  const prefix = displayName ? `[Multifunction ${displayName}:
` : `[Multifunction:
`;
  return `${prefix}${variants.map((variant) => `${variant},`).join(`
`)}
]`;
}
function isSemanticObject(value) {
  return value && typeof value === "object" && value._ext instanceof Map && value._ext.has("__type");
}
function formatViaSemanticDisplay(value, options) {
  if (!isSemanticObject(value) || !options?.context || !options?.evaluate)
    return null;
  for (const methodName of ["ToString", "TOSTRING", "Value", "VALUE"]) {
    let fn;
    try {
      fn = resolveMethod(value, methodName);
    } catch {
      continue;
    }
    try {
      const displayed = fn?.type === "method_builtin" ? fn.impl([value], options.context, options.evaluate, callWithConcreteArgs) : callWithConcreteArgs(fn, [value], options.context, options.evaluate);
      if (displayed === value)
        continue;
      return formatValue(displayed, { ...options, semanticDisplay: false });
    } catch {
      continue;
    }
  }
  return null;
}
function formatValue(val, options = {}) {
  const formatChild = (child) => formatValue(child, options);
  if (isHole(val))
    return "undefined";
  if (val === null)
    return "_";
  if (val === undefined)
    return "undefined";
  if (typeof val === "object" && val !== null) {
    if (val.type === "string")
      return val.value;
    if (isTensor(val))
      return formatTensor(val, formatChild);
    if (val.type === "sequence" && val._ext instanceof Map && val._ext.get("_type")?.value === "multifunction") {
      return formatMultifunctionPreview(val);
    }
    if (val.type === "sequence") {
      const open = val.kind === "set" ? "{| " : val.kind === "tuple" ? "( " : "[";
      const close = val.kind === "set" ? " |}" : val.kind === "tuple" ? " )" : "]";
      const items = val.values || val.elements || [];
      return open + items.map(formatChild).join(", ") + close;
    }
    if (val.type === "set" || val.type === "tuple") {
      const open = val.type === "set" ? "{| " : "( ";
      const close = val.type === "set" ? " |}" : " )";
      return open + val.values.map(formatChild).join(", ") + close;
    }
    if (val.type === "map") {
      const entries = [];
      const mapObj = val.entries || val.elements || new Map;
      mapObj.forEach((entryValue, key) => {
        entries.push(`${key}=${formatChild(entryValue)}`);
      });
      return `{= ${entries.join(", ")} }`;
    }
    if (val.type === "export_bundle") {
      const entries = [];
      const mapObj = val.entries || new Map;
      mapObj.forEach((cell, key) => {
        entries.push(`${key}=${formatChild(cell?.value)}`);
      });
      return `{= ${entries.join(", ")} }`;
    }
    if (val.type === "function" || val.type === "lambda") {
      return formatCallablePreview(val, val.type === "lambda" ? "Lambda" : "Function");
    }
    if (val.type === "pattern_function") {
      return `[PatternFunction: ${val.name || "Anonymous"}]`;
    }
    if (val.type === "system_context") {
      const names = val.context.getAllNames();
      const frozenMark = val.context.frozen ? " frozen" : " mutable";
      return `[SystemContext${frozenMark}: ${names.slice(0, 5).join(", ")}${names.length > 5 ? ", ..." : ""}]`;
    }
    if (val.type === "sysref") {
      return `[SystemFunction: ${val.name}]`;
    }
    if (val.type === "partial") {
      const arity = (val.template || []).reduce((max, templateValue) => templateValue && templateValue.type === "placeholder" ? Math.max(max, templateValue.index) : max, 0);
      return `[Partial: ${arity}]`;
    }
    if (val.type === "interval") {
      return `${val.start || val.lo}:${val.end || val.hi}`;
    }
    if (options.semanticDisplay !== false) {
      const semanticDisplay = formatViaSemanticDisplay(val, options);
      if (semanticDisplay !== null)
        return semanticDisplay;
    }
    if (val.fn === "DEFER") {
      const inner = val.args && val.args[0];
      const kind = inner ? inner.fn || inner.type || "AST" : "AST";
      return `[Deferred ${kind}]`;
    }
  }
  if (val instanceof Rational)
    return val.toMixedString();
  if (val instanceof RationalInterval)
    return val.toMixedString();
  return val.toString();
}

// ../rix/src/eval/functions/deferred.js
function desugarNode(node, maxDepth, currentDepth = 0) {
  if (node === null || node === undefined)
    return "_";
  if (isHole(node))
    return "undefined";
  if (node instanceof Integer)
    return node.toString();
  if (typeof node === "string")
    return JSON.stringify(node);
  if (typeof node === "number" || typeof node === "bigint")
    return String(node);
  if (typeof node === "boolean")
    return String(node);
  if (typeof node !== "object")
    return String(node);
  if (node.type === "string")
    return JSON.stringify(node.value);
  if (typeof node.fn === "string") {
    if (maxDepth >= 0 && currentDepth >= maxDepth) {
      return `${node.fn}(...)`;
    }
    if (!node.args || node.args.length === 0) {
      return node.fn;
    }
    const argStrs = node.args.map((a) => desugarNode(a, maxDepth, currentDepth + 1));
    const isBlock = node.fn === "BLOCK";
    const hasMultilineArg = argStrs.some((s) => s.includes(`
`));
    if (isBlock || hasMultilineArg) {
      const indented = argStrs.map((s) => s.split(`
`).map((line) => "  " + line).join(`
`));
      return `${node.fn}(
${indented.join(`,
`)}
)`;
    }
    return `${node.fn}(${argStrs.join(", ")})`;
  }
  try {
    return JSON.stringify(node);
  } catch {
    return "[object]";
  }
}
function nodeLabel(irNode) {
  if (!irNode || typeof irNode !== "object" || !irNode.fn) {
    return desugarNode(irNode, 0);
  }
  if (!irNode.args || irNode.args.length === 0)
    return irNode.fn;
  const argLabels = irNode.args.map((a) => {
    if (typeof a === "string")
      return JSON.stringify(a);
    if (a instanceof Integer)
      return a.toString();
    if (typeof a === "number" || typeof a === "bigint")
      return String(a);
    if (a && typeof a === "object" && a.fn)
      return "...";
    try {
      return JSON.stringify(a);
    } catch {
      return "[...]";
    }
  });
  return `${irNode.fn}(${argLabels.join(", ")})`;
}
function traceNode(irNode, evaluate, maxDepth, currentDepth, lines, indent) {
  if (!irNode || typeof irNode !== "object" || !irNode.fn) {
    return evaluate(irNode);
  }
  if (maxDepth >= 0 && currentDepth > maxDepth) {
    return evaluate(irNode);
  }
  const fn = irNode.fn;
  if (fn === "DEFER") {
    const result2 = evaluate(irNode);
    lines.push(`${indent}DEFER → ${formatValue(result2)}`);
    return result2;
  }
  if (fn === "BLOCK") {
    let result2 = null;
    for (const stmt of irNode.args) {
      result2 = traceNode(stmt, evaluate, maxDepth, currentDepth, lines, indent);
    }
    return result2;
  }
  let result;
  try {
    result = evaluate(irNode);
  } catch (e) {
    lines.push(`${indent}${nodeLabel(irNode)} → ERROR: ${e.message}`);
    throw e;
  }
  lines.push(`${indent}${nodeLabel(irNode)} → ${formatValue(result)}`);
  if (maxDepth < 0 || currentDepth < maxDepth) {
    if (Array.isArray(irNode.args)) {
      const childIndent = indent + "  ";
      for (const arg of irNode.args) {
        if (arg && typeof arg === "object" && arg.fn) {
          traceNode(arg, evaluate, maxDepth, currentDepth + 1, lines, childIndent);
        }
      }
    }
  }
  return result;
}
function resolveIntArg(val, name) {
  if (val === null || val === undefined || isHole(val))
    return -1;
  if (val instanceof Integer)
    return Number(val.value);
  if (typeof val === "number")
    return Math.trunc(val);
  throw new Error(`${name} must be an integer, got ${formatValue(val)}`);
}
function resolveBindings(val, name) {
  if (val === null || val === undefined || isHole(val))
    return null;
  if (val.type === "map")
    return val;
  throw new Error(`${name} must be a map or null, got ${formatValue(val)}`);
}
var Eval = {
  type: "method_builtin",
  name: "Eval",
  impl([target, bindings, mode], context, evaluate) {
    const evalNodes = [target.args[0]];
    bindings = resolveBindings(bindings, "Eval bindings");
    let modeStr = "inherit";
    if (mode !== null && mode !== undefined && !isHole(mode)) {
      if (mode.type === "string") {
        modeStr = mode.value;
      } else {
        throw new Error("Eval mode must be a string or colon-string like :fresh or :inherit");
      }
    }
    if (modeStr !== "inherit" && modeStr !== "fresh") {
      throw new Error(`Eval mode must be 'inherit' or 'fresh', got '${modeStr}'`);
    }
    if (modeStr === "inherit" && (!bindings || bindings.entries.size === 0)) {
      let res = null;
      const runBody = () => {
        for (const irNode of evalNodes)
          res = evaluate(irNode);
        return res;
      };
      return context.withSharedBody(evalNodes[0], runBody);
    }
    context.push(undefined, { isolated: modeStr === "fresh" });
    try {
      if (bindings && bindings.entries) {
        for (const [k, v] of bindings.entries) {
          if (typeof k !== "string") {
            throw new Error(`Eval binding key must be a string, got ${String(k)}`);
          }
          context.setFresh(k, v);
        }
      }
      let res = null;
      const runBody = () => {
        for (const irNode of evalNodes)
          res = evaluate(irNode);
        return res;
      };
      if (evalNodes.length === 1) {
        return context.withSharedBody(evalNodes[0], runBody);
      }
      return runBody();
    } finally {
      context.pop();
    }
  }
};
var Desugar = {
  type: "method_builtin",
  name: "Desugar",
  impl([target, depth]) {
    const maxDepth = resolveIntArg(depth, "Desugar depth");
    const result = desugarNode(target, maxDepth, 0);
    return { type: "string", value: result };
  }
};
var Inspect = {
  type: "method_builtin",
  name: "Inspect",
  impl([target, bindings, depth], context, evaluate) {
    bindings = resolveBindings(bindings, "Inspect bindings");
    const maxDepth = resolveIntArg(depth, "Inspect depth");
    context.push(undefined, { isolated: true });
    let result = null;
    let errorMsg = null;
    const traceLines = [];
    try {
      if (bindings && bindings.entries) {
        for (const [k, v] of bindings.entries) {
          context.setFresh(k, v);
        }
      }
      const evalNode = target.args[0];
      if (maxDepth === 0) {
        result = context.withSharedBody(evalNode, () => evaluate(evalNode));
      } else {
        result = context.withSharedBody(evalNode, () => traceNode(evalNode, evaluate, maxDepth, 0, traceLines, "  "));
      }
    } catch (e) {
      errorMsg = e.message ?? String(e);
    } finally {
      context.pop();
    }
    const lines = ["--- Deferred Inspection ---", "Inputs:"];
    if (bindings && bindings.entries && bindings.entries.size > 0) {
      for (const [k, v] of bindings.entries) {
        lines.push(`  ${k} = ${formatValue(v)}`);
      }
    } else {
      lines.push("  (none)");
    }
    if (traceLines.length > 0) {
      lines.push("Trace:");
      lines.push(...traceLines);
    }
    if (errorMsg !== null) {
      lines.push(`Error: ${errorMsg}`);
    } else {
      lines.push(`Output: ${formatValue(result)}`);
    }
    return { type: "string", value: lines.join(`
`) };
  }
};
var deferredMethods = { EVAL: Eval, DESUGAR: Desugar, INSPECT: Inspect };

// ../rix/src/runtime/cell.js
class Cell {
  constructor(value) {
    this.value = value;
  }
}
function classifyMetaKey(name) {
  if (name.startsWith("__"))
    return "sticky";
  if (name.startsWith("_"))
    return "ephemeral";
  return "ordinary";
}
function shallowCopyValue(value) {
  if (value == null)
    return value;
  if (typeof value !== "object")
    return value;
  if (value instanceof Integer)
    return new Integer(value.value);
  if (value instanceof Rational)
    return new Rational(value.numerator, value.denominator);
  if (value instanceof RationalInterval) {
    return new RationalInterval(new Rational(value.low.numerator, value.low.denominator), new Rational(value.high.numerator, value.high.denominator));
  }
  if (value.type === "string")
    return { type: "string", value: value.value };
  if (value.type === "sequence") {
    return {
      type: "sequence",
      values: [...value.values],
      _ext: value._ext ? new Map(value._ext) : undefined
    };
  }
  if (value.type === "tuple") {
    return {
      type: "tuple",
      values: [...value.values],
      _ext: value._ext ? new Map(value._ext) : undefined
    };
  }
  if (value.type === "map" && value.entries instanceof Map) {
    return {
      type: "map",
      entries: new Map(value.entries),
      _ext: value._ext ? new Map(value._ext) : undefined
    };
  }
  if (value.type === "export_bundle" && value.entries instanceof Map) {
    return {
      type: "export_bundle",
      entries: new Map(value.entries),
      _ext: value._ext ? new Map(value._ext) : undefined
    };
  }
  if (value.type === "set") {
    return {
      type: "set",
      values: [...value.values],
      _ext: value._ext ? new Map(value._ext) : undefined
    };
  }
  if (isTensor(value)) {
    return {
      type: "tensor",
      data: [...value.data],
      shape: [...value.shape],
      strides: [...value.strides],
      offset: value.offset,
      _ext: value._ext ? new Map(value._ext) : undefined
    };
  }
  return value;
}
function deepCopyValue(value) {
  if (value == null)
    return value;
  if (typeof value !== "object")
    return value;
  if (value instanceof Integer)
    return new Integer(value.value);
  if (value instanceof Rational)
    return new Rational(value.numerator, value.denominator);
  if (value instanceof RationalInterval) {
    return new RationalInterval(new Rational(value.low.numerator, value.low.denominator), new Rational(value.high.numerator, value.high.denominator));
  }
  if (value.type === "string")
    return { type: "string", value: value.value };
  if (value.type === "sequence") {
    return {
      type: "sequence",
      values: value.values.map(deepCopyValue),
      _ext: value._ext ? deepCopyMeta(value._ext) : undefined
    };
  }
  if (value.type === "tuple") {
    return {
      type: "tuple",
      values: value.values.map(deepCopyValue),
      _ext: value._ext ? deepCopyMeta(value._ext) : undefined
    };
  }
  if (value.type === "map" && value.entries instanceof Map) {
    const newEntries = new Map;
    for (const [k, v] of value.entries) {
      newEntries.set(k, deepCopyValue(v));
    }
    return {
      type: "map",
      entries: newEntries,
      _ext: value._ext ? deepCopyMeta(value._ext) : undefined
    };
  }
  if (value.type === "export_bundle" && value.entries instanceof Map) {
    const newEntries = new Map;
    for (const [k, v] of value.entries) {
      newEntries.set(k, new Cell(deepCopyValue(v.value)));
    }
    return {
      type: "export_bundle",
      entries: newEntries,
      _ext: value._ext ? deepCopyMeta(value._ext) : undefined
    };
  }
  if (value.type === "set") {
    return {
      type: "set",
      values: value.values.map(deepCopyValue),
      _ext: value._ext ? deepCopyMeta(value._ext) : undefined
    };
  }
  if (isTensor(value)) {
    return {
      type: "tensor",
      data: value.data.map(deepCopyValue),
      shape: [...value.shape],
      strides: [...value.strides],
      offset: value.offset,
      _ext: value._ext ? deepCopyMeta(value._ext) : undefined
    };
  }
  return value;
}
function deepCopyMeta(meta) {
  const result = new Map;
  for (const [key, val] of meta) {
    result.set(key, deepCopyValue(val));
  }
  return result;
}
function ensureExt(obj) {
  if (!obj || typeof obj !== "object") {
    throw new Error(`Cannot attach meta properties to ${typeof obj}`);
  }
  if (!obj._ext) {
    obj._ext = new Map;
  }
  return obj._ext;
}
function copyAllMeta(source, target, depth) {
  const srcMeta = source?._ext;
  if (!srcMeta || srcMeta.size === 0)
    return;
  if (!target || typeof target !== "object")
    return;
  const tgtMeta = ensureExt(target);
  for (const [key, val] of srcMeta) {
    tgtMeta.set(key, depth === "deep" ? deepCopyValue(val) : val);
  }
}
function transferMetaForUpdate(oldValue, newValue, rhsValue, depth) {
  if (!newValue || typeof newValue !== "object")
    return;
  const oldMeta = oldValue?._ext;
  const rhsMeta = rhsValue?._ext;
  if (!oldMeta && !rhsMeta)
    return;
  const tgtMeta = new Map;
  newValue._ext = tgtMeta;
  const copyVal = depth === "deep" ? deepCopyValue : (v) => v;
  if (oldMeta) {
    for (const [key, val] of oldMeta) {
      if (classifyMetaKey(key) === "ordinary") {
        tgtMeta.set(key, copyVal(val));
      }
    }
  }
  if (oldMeta) {
    for (const [key, val] of oldMeta) {
      if (classifyMetaKey(key) === "sticky") {
        tgtMeta.set(key, copyVal(val));
      }
    }
  }
  if (rhsMeta) {
    for (const [key, val] of rhsMeta) {
      if (classifyMetaKey(key) === "sticky") {
        tgtMeta.set(key, copyVal(val));
      }
    }
  }
  if (rhsMeta) {
    for (const [key, val] of rhsMeta) {
      if (classifyMetaKey(key) === "ephemeral") {
        tgtMeta.set(key, copyVal(val));
      }
    }
  }
}

// ../rix/src/eval/functions/arithmetic.js
function ensureNumeric(val) {
  if (val instanceof Integer || val instanceof Rational)
    return val;
  if (val && typeof val === "object" && typeof val.add === "function" && typeof val.multiply === "function")
    return val;
  if (typeof val === "bigint")
    return new Integer(val);
  if (typeof val === "number") {
    if (Number.isInteger(val))
      return new Integer(val);
    const str = val.toString();
    const parts = str.split(".");
    if (parts.length === 2) {
      const den = 10n ** BigInt(parts[1].length);
      const num = BigInt(parts[0]) * den + BigInt(parts[1]);
      return new Rational(num, den);
    }
    return new Integer(BigInt(Math.floor(val)));
  }
  if (typeof val === "function" || val && typeof val === "object" && (val.type === "lambda" || val.type === "function" || val.type === "pattern_function" || val.type === "sysref" || val.type === "partial" || val.type === "arityCap")) {
    throw new Error("Cannot use function/lambda in arithmetic. If you intended to call a function, its name must be Capitalised.");
  }
  throw new Error(`Cannot use ${typeof val} in arithmetic`);
}
function stringify(val) {
  return formatValue(val);
}
function toQuotientParts(value) {
  if (value instanceof Integer) {
    return { numerator: value.value, denominator: 1n };
  }
  if (value instanceof Rational) {
    return { numerator: value.numerator, denominator: value.denominator };
  }
  return { numerator: BigInt(value.toString()), denominator: 1n };
}
function ceilDiv(numerator, denominator) {
  const q = numerator / denominator;
  const r = numerator % denominator;
  if (r === 0n)
    return q;
  return numerator >= 0n ? q + 1n : q;
}
function roundDiv(numerator, denominator) {
  const absNum = numerator < 0n ? -numerator : numerator;
  const floor = absNum / denominator;
  const remainder = absNum % denominator;
  const rounded = remainder * 2n >= denominator ? floor + 1n : floor;
  return numerator < 0n ? -rounded : rounded;
}
var arithmeticFunctions = {
  ADD: {
    impl(args) {
      if (args.length === 0)
        return new Integer(0n);
      if (args.length === 1)
        return args[0];
      const isStr = (v) => typeof v === "string" || v && typeof v === "object" && v.type === "string";
      const getStr = (v) => stringify(v);
      if (args.some(isStr)) {
        return { type: "string", value: args.map(getStr).join("") };
      }
      let result = ensureNumeric(args[0]);
      for (let i = 1;i < args.length; i++) {
        result = result.add(ensureNumeric(args[i]));
      }
      return result;
    },
    pure: true,
    doc: "Addition or string concatenation"
  },
  SUB: {
    impl(args) {
      const a = ensureNumeric(args[0]);
      const b = ensureNumeric(args[1]);
      return a.subtract(b);
    },
    pure: true,
    doc: "Subtraction"
  },
  MUL: {
    impl(args) {
      if (args.length === 0)
        return new Integer(1n);
      if (args.length === 1)
        return ensureNumeric(args[0]);
      let result = ensureNumeric(args[0]);
      for (let i = 1;i < args.length; i++) {
        result = result.multiply(ensureNumeric(args[i]));
      }
      return result;
    },
    pure: true,
    doc: "Multiplication (Product of values)"
  },
  DIV: {
    impl(args) {
      const a = ensureNumeric(args[0]);
      const b = ensureNumeric(args[1]);
      return a.divide(b);
    },
    pure: true,
    doc: "Division"
  },
  INTDIV: {
    impl(args) {
      const a = ensureNumeric(args[0]);
      const b = ensureNumeric(args[1]);
      if (a instanceof Integer && b instanceof Integer) {
        const result = a.value / b.value;
        return new Integer(result);
      }
      const rat = a.divide(b);
      if (rat instanceof Rational) {
        return new Integer(rat.numerator / rat.denominator);
      }
      return new Integer(rat.value);
    },
    pure: true,
    doc: "Integer division (floor)"
  },
  DIVUP: {
    impl(args) {
      const a = ensureNumeric(args[0]);
      const b = ensureNumeric(args[1]);
      const quotient = a.divide(b);
      const { numerator, denominator } = toQuotientParts(quotient);
      return new Integer(ceilDiv(numerator, denominator));
    },
    pure: true,
    doc: "Ceiling division"
  },
  DIVROUND: {
    impl(args) {
      const a = ensureNumeric(args[0]);
      const b = ensureNumeric(args[1]);
      const quotient = a.divide(b);
      const { numerator, denominator } = toQuotientParts(quotient);
      return new Integer(roundDiv(numerator, denominator));
    },
    pure: true,
    doc: "Rounded division"
  },
  MOD: {
    impl(args) {
      const a = ensureNumeric(args[0]);
      const b = ensureNumeric(args[1]);
      if (a instanceof Integer && b instanceof Integer) {
        return a.modulo(b);
      }
      const aVal = a instanceof Integer ? a.value : a.numerator;
      const bVal = b instanceof Integer ? b.value : b.numerator;
      return new Integer(aVal % bVal);
    },
    pure: true,
    doc: "Modulo"
  },
  POW: {
    impl(args) {
      const base = ensureNumeric(args[0]);
      const exp = ensureNumeric(args[1]);
      const expValue = exp instanceof Integer ? exp.value : Number(exp.toString());
      return base.pow(expValue);
    },
    pure: true,
    doc: "Exponentiation"
  },
  POWPROD: {
    impl(args) {
      const base = ensureNumeric(args[0]);
      const exp = ensureNumeric(args[1]);
      const expValue = exp instanceof Integer ? exp.value : Number(exp.toString());
      return base.pow(expValue);
    },
    pure: true,
    doc: "Exponentiation/product power (currently same implementation as POW)"
  },
  NEG: {
    impl(args) {
      const a = ensureNumeric(args[0]);
      return a.negate();
    },
    pure: true,
    doc: "Negation"
  },
  ABS: {
    impl(args) {
      const a = ensureNumeric(args[0]);
      return a instanceof Integer ? new Integer(a.value < 0n ? -a.value : a.value) : new Rational(a.numerator < 0n ? -a.numerator : a.numerator, a.denominator);
    },
    pure: true,
    doc: "Absolute value"
  },
  SQRT: {
    impl(args) {
      const a = ensureNumeric(args[0]);
      const val = a instanceof Rational ? Number(a.numerator) / Number(a.denominator) : Number(a.toString());
      const root = Math.sqrt(val);
      if (Number.isInteger(root))
        return new Integer(BigInt(root));
      const str = root.toString();
      const parts = str.split(".");
      if (parts.length === 2) {
        const den = 10n ** BigInt(parts[1].length);
        const num = BigInt(parts[0]) * den + BigInt(parts[1]);
        return new Rational(num, den);
      }
      return new Integer(BigInt(Math.floor(root)));
    },
    pure: true,
    doc: "Square root (approximate rational)"
  }
};

// ../rix/src/runtime/runtime-config.js
var runtimeDefaults = Object.freeze({
  defaultLoopMax: 1e4,
  defaultConstructorCaptureMode: "deep_copy",
  warnings: Object.freeze({
    conversion: false,
    multifunctionConversion: false,
    multifunctionNoPrep: false
  }),
  scriptPermissionNames: Object.freeze(["IMPORTS", "NET", "FILES"]),
  defaultScriptCapabilityPolicy: Object.freeze({
    includeAllFunctions: true,
    permissions: Object.freeze(["IMPORTS"])
  }),
  capabilityGroups: Object.freeze({
    Core: Object.freeze(["LEN", "FIRST", "LAST", "GETEL", "IRANGE", "IF", "LOOP", "MULTI", "RAND_NAME", "PRINT", "TGEN", "KEYOF", "KEYS", "VALUES"]),
    Arith: Object.freeze(["ADD", "SUB", "MUL", "DIV", "INTDIV", "MOD", "POW"]),
    Logic: Object.freeze(["EQ", "NEQ", "LT", "GT", "LTE", "GTE", "AND", "OR", "NOT"]),
    Collections: Object.freeze(["LEN", "FIRST", "LAST", "GETEL", "IRANGE", "MAP", "FILTER", "REDUCE", "TGEN"]),
    Maps: Object.freeze(["MAP", "KEYOF", "KEYS", "VALUES"]),
    Arrays: Object.freeze(["LEN", "FIRST", "LAST", "GETEL", "IRANGE", "MAP", "FILTER", "REDUCE", "TGEN"]),
    Strings: Object.freeze(["UPPER", "SUBSTR", "PRINT"]),
    Imports: Object.freeze(["IMPORTS"]),
    Net: Object.freeze(["NET"]),
    Files: Object.freeze(["FILES"])
  })
});

// ../rix/src/runtime/constructor-capture.js
var CONSTRUCTOR_CAPTURE_MODES = Object.freeze({
  alias: "alias",
  copy: "copy",
  refresh: "refresh",
  deepCopy: "deep_copy",
  deepRefresh: "deep_refresh"
});
function constructorDefaultCaptureMode(context) {
  return context?.getEnv?.("defaultConstructorCaptureMode") || runtimeDefaults.defaultConstructorCaptureMode;
}
function captureResolvedValue(value, mode) {
  if (mode === CONSTRUCTOR_CAPTURE_MODES.alias) {
    return value;
  }
  if (mode === CONSTRUCTOR_CAPTURE_MODES.copy) {
    const next = shallowCopyValue(value);
    copyAllMeta(value, next, "shallow");
    return next;
  }
  if (mode === CONSTRUCTOR_CAPTURE_MODES.deepCopy) {
    const next = deepCopyValue(value);
    copyAllMeta(value, next, "deep");
    return next;
  }
  if (mode === CONSTRUCTOR_CAPTURE_MODES.refresh) {
    const next = shallowCopyValue(value);
    transferMetaForUpdate(null, next, value, "shallow");
    return next;
  }
  if (mode === CONSTRUCTOR_CAPTURE_MODES.deepRefresh) {
    const next = deepCopyValue(value);
    transferMetaForUpdate(null, next, value, "deep");
    return next;
  }
  return captureResolvedValue(value, runtimeDefaults.defaultConstructorCaptureMode);
}
function captureIrValue(irNode, mode, context, evaluate) {
  if (mode === CONSTRUCTOR_CAPTURE_MODES.alias && irNode?.fn === "RETRIEVE") {
    const cell = context.getCell(irNode.args[0]);
    if (cell)
      return cell.value;
  }
  if (mode === CONSTRUCTOR_CAPTURE_MODES.alias && irNode?.fn === "OUTER_RETRIEVE") {
    const cell = context.getOuterCell(irNode.args[0]);
    if (cell)
      return cell.value;
  }
  const value = evaluate(irNode);
  return captureResolvedValue(value, mode);
}

// ../rix/src/runtime/diagnostics.js
class RixAbort extends Error {
  constructor(event) {
    const label = event?.entries?.get("label")?.value ?? "RiX abort";
    super(label);
    this.name = "RixAbort";
    this.event = event;
  }
}
var eventCounter = 0;
function createEvent(fields) {
  const entries = new Map;
  entries.set("kind", { type: "string", value: fields.kind });
  entries.set("label", typeof fields.label === "string" ? { type: "string", value: fields.label } : fields.label);
  if (fields.level !== undefined) {
    entries.set("level", fields.level instanceof Integer ? fields.level : new Integer(fields.level));
  }
  if (fields.file !== undefined) {
    entries.set("file", { type: "string", value: fields.file });
  }
  if (fields.line !== undefined) {
    entries.set("line", new Integer(fields.line));
  }
  if (fields.col !== undefined) {
    entries.set("col", new Integer(fields.col));
  }
  if (fields.scope !== undefined) {
    entries.set("scope", { type: "string", value: fields.scope });
  }
  entries.set("time", new Integer(BigInt(Date.now())));
  if (fields.data !== undefined) {
    entries.set("data", fields.data);
  } else {
    entries.set("data", { type: "map", entries: new Map });
  }
  if (fields.extra) {
    for (const [k, v] of Object.entries(fields.extra)) {
      entries.set(k, v);
    }
  }
  eventCounter++;
  return { type: "map", entries };
}
var DIAG_ENV_KEY = "__diagnostics__";

class DiagnosticsRegistry {
  constructor() {
    this.events = [];
    this.testResultsByFile = new Map;
  }
  addEvent(event) {
    this.events.push(event);
  }
  registerTestResult(filePath, label, result) {
    if (!this.testResultsByFile.has(filePath)) {
      this.testResultsByFile.set(filePath, new Map);
    }
    const fileResults = this.testResultsByFile.get(filePath);
    if (fileResults.has(label)) {
      throw new Error(`Duplicate test group label "${label}" in file "${filePath}"`);
    }
    fileResults.set(label, result);
  }
  getFileResults(filePath) {
    return this.testResultsByFile.get(filePath) || new Map;
  }
  getTestFiles() {
    return Array.from(this.testResultsByFile.keys());
  }
  getSummary() {
    let totalGroups = 0;
    let passedGroups = 0;
    let failedGroups = 0;
    let erroredGroups = 0;
    for (const [_file, results] of this.testResultsByFile) {
      for (const [_label, result] of results) {
        totalGroups++;
        const passedEntry = result.entries?.get("passed");
        if (passedEntry === null) {
          const summary = result.entries?.get("summary");
          const errored = summary?.entries?.get("errored");
          if (errored !== null && errored !== undefined) {
            const erVal = errored instanceof Integer ? Number(errored.value) : Number(errored);
            if (erVal > 0) {
              erroredGroups++;
            } else {
              failedGroups++;
            }
          } else {
            failedGroups++;
          }
        } else {
          passedGroups++;
        }
      }
    }
    return { totalGroups, passedGroups, failedGroups, erroredGroups };
  }
  getEventsByKind(kind) {
    return this.events.filter((e) => {
      const k = e.entries?.get("kind");
      return k?.value === kind;
    });
  }
}
function getDiagnostics(context) {
  let diag = context.getEnv(DIAG_ENV_KEY);
  if (!diag) {
    diag = new DiagnosticsRegistry;
    context.setEnv(DIAG_ENV_KEY, diag);
  }
  return diag;
}
function getCurrentFilePath(context) {
  const runtime = context.getEnv("__script_runtime__");
  if (runtime && runtime.frameStack.length > 0) {
    return runtime.frameStack[runtime.frameStack.length - 1].path;
  }
  return context.getEnv("__current_file__", "<repl>");
}
function rixStringValue(val) {
  if (val === null || val === undefined)
    return null;
  if (typeof val === "string")
    return val;
  if (val.type === "string")
    return val.value;
  return null;
}
function rixIntValue(val) {
  if (val === null || val === undefined)
    return null;
  if (val instanceof Integer)
    return Number(val.value);
  if (typeof val === "number")
    return val;
  if (typeof val === "bigint")
    return Number(val);
  return null;
}
function isRixMap(val) {
  return val && val.type === "map" && val.entries instanceof Map;
}
function isRixArray(val) {
  return val && (val.type === "sequence" || val.type === "array") && Array.isArray(val.values);
}

// ../rix/src/runtime/semantic.js
function int(value) {
  return new Integer(BigInt(value));
}
function mutableExt() {
  return new Map([["_mutable", int(1)]]);
}
function ensureExt2(value) {
  if (!value || typeof value !== "object") {
    throw new Error("Semantic metadata requires an object value");
  }
  if (!(value._ext instanceof Map)) {
    value._ext = new Map;
  }
  return value._ext;
}
function traitOrderSequence(names) {
  return { type: "sequence", values: names.map(stringObj), _ext: mutableExt() };
}
function createTraitSet(names, order = names) {
  return {
    type: "set",
    values: Array.from(new Set(names)).map(stringObj),
    _ext: new Map([["order", traitOrderSequence(order)]])
  };
}
function traitNamesFromSet(value) {
  if (!value || value.type !== "set" || !Array.isArray(value.values))
    return [];
  return value.values.map((entry) => entry?.type === "string" ? entry.value : String(entry)).filter(Boolean);
}
function traitOrderFromSet(value) {
  const explicit = value?._ext?.get("order");
  if (explicit?.type === "sequence") {
    return explicit.values.map((entry) => entry?.type === "string" ? entry.value : String(entry)).filter(Boolean);
  }
  return traitNamesFromSet(value);
}
function getLabel(value) {
  if (value?.type === "string")
    return value.value;
  return String(value);
}
function summarizeValue(value) {
  if (value === null)
    return "_";
  if (value instanceof Integer || value instanceof Rational || value instanceof RationalInterval) {
    return value.toString();
  }
  if (value?.type === "string")
    return JSON.stringify(value.value);
  if (value?.type)
    return `<${value.type}>`;
  return getLabel(value);
}
function emitWarning(context, label, data = new Map) {
  if (!context?.getEnv)
    return;
  const diagnostics = getDiagnostics(context);
  diagnostics.addEvent(createEvent({
    kind: "warning",
    label,
    file: getCurrentFilePath(context),
    data: { type: "map", entries: data }
  }));
}
function cloneHeader(header) {
  return {
    captureMode: header?.captureMode || null,
    name: header?.name || null,
    typeName: header?.typeName || null,
    traits: Array.isArray(header?.traits) ? header.traits.map((trait) => ({ ...trait })) : []
  };
}
var traitChecks = new Map([
  ["positive", (value) => {
    if (value instanceof Integer)
      return value.value > 0n;
    if (typeof value === "number" || typeof value === "bigint")
      return Number(value) > 0;
    return true;
  }]
]);
function refreshSemanticProto(value) {
  const ext = ensureExt2(value);
  const typeName = ext.get("__type")?.value ?? null;
  const traitsValue = ext.get("__traits") ?? null;
  const traitOrder = traitOrderFromSet(traitsValue);
  const typeLayer = typeName ? typeRegistry.get(typeName)?.proto?.(value) ?? makeProto() : null;
  const traitEntries = new Map;
  for (const traitName of traitOrder) {
    const traitLayer = traitRegistry.get(traitName)?.proto?.(value);
    if (!traitLayer?.entries)
      continue;
    for (const [key, entry] of traitLayer.entries) {
      traitEntries.set(key, entry);
    }
  }
  const traitsLayer = makeProto(Array.from(traitEntries.entries()));
  ext.set("__proto", makeProto([
    ["type", typeLayer],
    ["traits", traitsLayer]
  ]));
  return ext.get("__proto");
}
function refreshRuntimeMetadata(value, builtinProto = null) {
  const ext = ensureExt2(value);
  ext.set("_type", stringObj(runtimeTypeName(value)));
  ext.set("_proto", builtinProto ?? ext.get("_proto") ?? null);
  return value;
}
function shouldValidateTraits(context, value) {
  const globalValidate = context?.getEnv?.("validateTraits", false);
  const hasVerify = traitNamesFromSet(value?._ext?.get("__traits")).includes("verify");
  return globalValidate || hasVerify;
}
function checkTraits(value, context, { warnOnly = false } = {}) {
  const traits = traitOrderFromSet(value?._ext?.get("__traits"));
  for (const traitName of traits) {
    if (traitName === "verify")
      continue;
    const check = traitChecks.get(traitName);
    if (!check)
      continue;
    if (!check(value)) {
      if (warnOnly) {
        emitWarning(context, `Trait check failed: ${traitName}`, new Map([["trait", stringObj(traitName)]]));
        return null;
      }
      throw new Error(`Trait check failed: ${traitName}`);
    }
  }
  return int(1);
}
function applyType(header, value, context, evaluate = null) {
  const typeName = header.typeName;
  if (!typeName)
    return value;
  const result = convertToRegisteredType(value, typeName, context, evaluate);
  if (result === null) {
    throw new Error(`Cannot convert value to semantic type ${typeName}`);
  }
  return result.value;
}
function valueHasSemanticMembership(value, name) {
  const ext = value?._ext;
  if (!(ext instanceof Map) || !name) {
    return false;
  }
  if (ext.get("__type")?.value === name) {
    return true;
  }
  if (ext.get("_type")?.value === name) {
    return true;
  }
  return traitNamesFromSet(ext.get("__traits")).includes(name);
}
function convertSemanticType(value, typeName, context, { strict = true, warnOnFailure = false, evaluate = null } = {}) {
  const header = {
    captureMode: null,
    name: null,
    typeName,
    traits: []
  };
  const effectiveHeader = mergeStickyHeader(readStickyHeader(value), header);
  try {
    return applySemanticHeader(value, effectiveHeader, context, {
      inheritMissing: true,
      warnOnTypeChange: true,
      evaluate
    });
  } catch (error) {
    if (error.message === `Unknown semantic type: ${typeName}`) {
      throw error;
    }
    if (strict) {
      throw error;
    }
    if (warnOnFailure) {
      const ext = value?._ext instanceof Map ? value._ext : null;
      const data = new Map([
        ["requestedType", stringObj(typeName)],
        ["sourceSummary", stringObj(summarizeValue(value))]
      ]);
      const runtimeType = ext?.get("_type");
      if (runtimeType)
        data.set("sourceType", runtimeType);
      const semanticType = ext?.get("__type");
      if (semanticType)
        data.set("sourceSemanticType", semanticType);
      const traits = ext?.get("__traits");
      if (traits)
        data.set("sourceTraits", traits);
      emitWarning(context, "conversion failed", data);
    }
    return null;
  }
}
function valueSatisfiesTrait(value, traitName) {
  if (traitOrderFromSet(value?._ext?.get("__traits")).includes(traitName)) {
    return true;
  }
  const check = traitChecks.get(traitName);
  if (!check) {
    return false;
  }
  return Boolean(check(value));
}
function readStickyHeader(value) {
  const ext = value?._ext;
  if (!(ext instanceof Map))
    return cloneHeader(null);
  return {
    captureMode: null,
    name: ext.get("__name")?.value ?? null,
    typeName: ext.get("__type")?.value ?? null,
    traits: traitOrderFromSet(ext.get("__traits")).map((name, order) => ({ name, checkMode: null, order }))
  };
}
function mergeStickyHeader(baseHeader, overrideHeader) {
  const base = cloneHeader(baseHeader);
  const override = cloneHeader(overrideHeader);
  return {
    captureMode: override.captureMode ?? base.captureMode ?? null,
    name: override.name ?? base.name ?? null,
    typeName: override.typeName ?? base.typeName ?? null,
    traits: override.traits.length > 0 ? override.traits : base.traits
  };
}
function applySemanticHeader(value, header, context, options = {}) {
  const effectiveHeader = cloneHeader(header);
  if (!value || typeof value !== "object") {
    throw new Error("Cannot outfit a non-object value");
  }
  const previous = readStickyHeader(value);
  let nextValue = value;
  nextValue = applyType(effectiveHeader, nextValue, context, options.evaluate ?? null);
  const ext = ensureExt2(nextValue);
  if (effectiveHeader.name) {
    ext.set("__name", stringObj(effectiveHeader.name));
  } else if (options.inheritMissing && previous.name) {
    ext.set("__name", stringObj(previous.name));
  }
  const nextTypeName = effectiveHeader.typeName ?? (options.inheritMissing ? previous.typeName : null);
  if (nextTypeName) {
    ext.set("__type", stringObj(nextTypeName));
  }
  const explicitTraits = effectiveHeader.traits.length > 0 ? effectiveHeader.traits.map((trait) => trait.name) : options.inheritMissing ? previous.traits.map((trait) => trait.name) : [];
  const typeDefaultTraits = nextTypeName ? typeRegistry.get(nextTypeName)?.defaultTraits || [] : [];
  const nextTraits = resolveTraitNames([...typeDefaultTraits, ...explicitTraits]);
  if (nextTraits.length > 0) {
    ext.set("__traits", createTraitSet(nextTraits, nextTraits));
  }
  if (options.warnOnTypeChange && previous.typeName && nextTypeName && previous.typeName !== nextTypeName && nextTraits.length > 0) {
    emitWarning(context, "Semantic type changed while traits were preserved", new Map([
      ["from", stringObj(previous.typeName)],
      ["to", stringObj(nextTypeName)]
    ]));
  }
  refreshSemanticProto(nextValue);
  if (shouldValidateTraits(context, nextValue)) {
    checkTraits(nextValue, context);
  }
  return nextValue;
}
function applyUpdateSemantics(oldValue, newValue, context, evaluate = null) {
  const inherited = readStickyHeader(oldValue);
  if (!inherited.name && !inherited.typeName && inherited.traits.length === 0) {
    return newValue;
  }
  return applySemanticHeader(newValue, inherited, context, { inheritMissing: true, evaluate });
}
function rebuildSemanticMetadata(value, context) {
  refreshSemanticProto(value);
  if (shouldValidateTraits(context, value)) {
    checkTraits(value, context);
  }
  return value;
}

// ../rix/src/eval/functions/collections.js
function isTruthy(val) {
  return val !== null && val !== undefined;
}
function valueKey(val) {
  if (val === null || val === undefined)
    return "null";
  if (typeof val === "object") {
    if (typeof val.toString === "function" && val.toString !== Object.prototype.toString) {
      return val.toString();
    }
    if (val.type) {
      if (val.type === "tuple" || val.type === "sequence" || val.type === "set" || val.type === "array") {
        const vals = val.values || val.elements || [];
        return `${val.type}[${vals.map(valueKey).join(",")}]`;
      }
      if (val.type === "string")
        return JSON.stringify(val.value);
      return JSON.stringify(val, (k, v) => typeof v === "bigint" ? v.toString() : v);
    }
  }
  return String(val);
}
var getValues = (arg) => {
  if (arg && typeof arg === "object") {
    if (arg.type === "set" && Array.isArray(arg.values)) {
      return arg.values;
    }
    if (arg instanceof RationalInterval) {
      return [arg.start, arg.end];
    }
    if (arg.type === "interval") {
      return [arg.lo, arg.hi];
    }
  }
  return [arg];
};
var toRationalOrNull = (value) => {
  if (value instanceof Rational)
    return value;
  if (value instanceof Integer || value && typeof value === "object" && value.constructor.name === "Integer") {
    return new Rational(value.value, 1n);
  }
  if (typeof value === "bigint") {
    return new Rational(value, 1n);
  }
  if (typeof value === "number") {
    if (!Number.isInteger(value))
      return null;
    return new Rational(BigInt(value), 1n);
  }
  if (typeof value === "string") {
    try {
      return new Rational(value);
    } catch (error) {
      if (error instanceof SyntaxError || error instanceof RangeError || error instanceof TypeError) {
        return null;
      }
      if (/Invalid|Cannot convert|Denominator cannot be zero/.test(error.message)) {
        return null;
      }
      throw error;
    }
  }
  return null;
};
var compare = (a, b) => {
  const aRat = toRationalOrNull(a);
  const bRat = toRationalOrNull(b);
  if (aRat && bRat) {
    return aRat.compareTo(bRat);
  }
  if (a < b)
    return -1;
  if (a > b)
    return 1;
  return 0;
};
var classifyUnionIntersectDomain = (val) => {
  if (val && typeof val === "object") {
    if (val.type === "set")
      return "set";
    if (val instanceof RationalInterval || val.type === "interval")
      return "interval";
  }
  return null;
};
var collectionFunctions = {
  ARRAY: {
    lazy: true,
    impl(args, ctx, evaluate) {
      const defaultMode = constructorDefaultCaptureMode(ctx);
      const values = [];
      let i = 0;
      while (i < args.length) {
        const arg = args[i];
        if (arg && arg.fn === "GENERATOR") {
          let current = arg.args[0] ? evaluate(arg.args[0]) : values[values.length - 1];
          if (current === undefined)
            throw new Error("Sequence generator missing start value");
          if (arg.args[0])
            values.push(captureResolvedValue(current, defaultMode));
          const ops = [...arg.args.slice(1)];
          while (i + 1 < args.length && args[i + 1] && args[i + 1].fn === "GENERATOR") {
            i++;
            ops.push(...args[i].args.slice(1));
          }
          let generate = true;
          let maxEager = 1e4;
          while (generate && maxEager-- > 0) {
            let next = current;
            let stop = false;
            for (const op of ops) {
              if (!op || typeof op !== "object")
                continue;
              const opArg = op.args?.[0] ? evaluate(op.args[0]) : null;
              if (op.fn === "GEN_ADD") {
                next = evaluate({ fn: "ADD", args: [next, opArg] });
              } else if (op.fn === "GEN_MUL") {
                next = evaluate({ fn: "MUL", args: [next, opArg] });
              } else if (op.fn === "GEN_EAGER_LIMIT") {
                if (values.length >= opArg)
                  stop = true;
              } else if (op.fn === "GEN_LIMIT") {
                const gtResult = evaluate({ fn: "GT", args: [next, opArg] });
                if (gtResult !== null && gtResult !== undefined)
                  stop = true;
              }
            }
            if (stop)
              break;
            values.push(captureResolvedValue(next, defaultMode));
            current = next;
          }
        } else if (arg && arg.fn === "HOLE") {
          values.push(HOLE);
        } else if (arg && arg.fn === "SPREAD") {
          const spreadVal = evaluate(arg.args[0]);
          if (spreadVal && (spreadVal.type === "tuple" || spreadVal.type === "sequence" || spreadVal.type === "array" || spreadVal.type === "set")) {
            const items = spreadVal.values || spreadVal.elements || [];
            values.push(...items.map((item) => captureResolvedValue(item, defaultMode)));
          } else {
            throw new Error("Spread operator requires an iterable collection (array, tuple, sequence, set)");
          }
        } else {
          values.push(captureIrValue(arg, defaultMode, ctx, evaluate));
        }
        i++;
      }
      return attachBuiltinProto({
        type: "sequence",
        values,
        _ext: new Map([["_mutable", new Integer(1n)]])
      });
    },
    pure: true,
    doc: "Create an array/sequence (supports sequence generators)"
  },
  TUPLE: {
    lazy: true,
    impl(args, ctx, evaluate) {
      const header = args[0]?.header || null;
      const defaultMode = header?.captureMode || constructorDefaultCaptureMode(ctx);
      const start = header ? 1 : 0;
      const value = { type: "tuple", values: args.slice(start).map((arg) => captureIrValue(arg.expression || arg, arg.captureMode || defaultMode, ctx, evaluate)) };
      return applySemanticHeader(attachBuiltinProto(value), header, ctx);
    },
    pure: true,
    doc: "Create a tuple"
  },
  SET: {
    lazy: true,
    impl(args, ctx, evaluate) {
      const header = args[0]?.header || null;
      const defaultMode = header?.captureMode || constructorDefaultCaptureMode(ctx);
      const start = header ? 1 : 0;
      const seen = new Set;
      const values = [];
      for (const arg of args.slice(start)) {
        const val = captureIrValue(arg.expression || arg, arg.captureMode || defaultMode, ctx, evaluate);
        const key = valueKey(val);
        if (!seen.has(key)) {
          seen.add(key);
          values.push(val);
        }
      }
      const value = {
        type: "set",
        values,
        _ext: new Map([["_mutable", new Integer(1n)]])
      };
      return applySemanticHeader(attachBuiltinProto(value), header, ctx);
    },
    pure: true,
    doc: "Create a set (unique values)"
  },
  MAP_OBJ: {
    lazy: true,
    impl(args, context, evaluate) {
      const header = args[0]?.header || null;
      const defaultMode = header?.captureMode || constructorDefaultCaptureMode(context);
      const actualArgs = header ? args.slice(1) : args;
      const entries = new Map;
      const seenKeys = new Set;
      for (const arg of actualArgs) {
        if (arg && arg.fn === "ASSIGN") {
          const name = arg.args[0];
          const val = captureIrValue(arg.args[1], defaultMode, context, evaluate);
          if (seenKeys.has(name)) {
            throw new Error(`Duplicate key in map literal: "${name}"`);
          }
          seenKeys.add(name);
          entries.set(name, val);
        } else if (arg && arg.fn === "MAP_PAIR") {
          const [kind, keyExpr, valueExpr, entryMode] = arg.args;
          const keyStr = kind === "identifier" ? keyExpr : keyOf(evaluate(keyExpr));
          const val = captureIrValue(valueExpr, entryMode || defaultMode, context, evaluate);
          if (seenKeys.has(keyStr)) {
            throw new Error(`Duplicate key in map literal: "${keyStr}"`);
          }
          seenKeys.add(keyStr);
          entries.set(keyStr, val);
        } else if (arg && arg.fn === "ASSIGN_EXPR") {
          const keyVal = evaluate(arg.args[0]);
          const val = captureIrValue(arg.args[1], defaultMode, context, evaluate);
          const keyStr = keyOf(keyVal);
          if (seenKeys.has(keyStr)) {
            throw new Error(`Duplicate key in map literal: "${keyStr}"`);
          }
          seenKeys.add(keyStr);
          entries.set(keyStr, val);
        } else if (arg && arg.fn === "KWARG") {
          const name = arg.args[0];
          const val = captureIrValue(arg.args[1], defaultMode, context, evaluate);
          if (seenKeys.has(name)) {
            throw new Error(`Duplicate key in map literal: "${name}"`);
          }
          seenKeys.add(name);
          entries.set(name, val);
        } else {
          const val = captureIrValue(arg, defaultMode, context, evaluate);
          const keyStr = keyOf(val);
          if (seenKeys.has(keyStr)) {
            throw new Error(`Duplicate key in map literal: "${keyStr}"`);
          }
          seenKeys.add(keyStr);
          entries.set(keyStr, val);
        }
      }
      const value = {
        type: "map",
        entries,
        _ext: new Map([["_mutable", new Integer(1n)]])
      };
      return applySemanticHeader(attachBuiltinProto(value), header, context);
    },
    pure: true,
    doc: "Create a map/object"
  },
  ARRAY_CAPTURE: {
    lazy: true,
    impl(args, ctx, evaluate) {
      const header = args[0]?.header || null;
      const defaultMode = header?.captureMode || constructorDefaultCaptureMode(ctx);
      const start = header ? 1 : 0;
      const values = args.slice(start).map((arg) => captureIrValue(arg.expression || arg, arg.captureMode || defaultMode, ctx, evaluate));
      return applySemanticHeader(attachBuiltinProto({
        type: "sequence",
        values,
        _ext: new Map([["_mutable", new Integer(1n)]])
      }), header, ctx);
    },
    pure: true,
    doc: "Create an array/sequence with constructor capture controls"
  },
  INTERVAL: {
    impl(args) {
      if (args.length === 2) {
        const lo = args[0];
        const hi = args[1];
        const loRat = toRationalOrNull(lo);
        const hiRat = toRationalOrNull(hi);
        if (loRat && hiRat) {
          return new RationalInterval(loRat, hiRat);
        }
        return { type: "interval", lo, hi };
      }
      let allAscending = true;
      let allDescending = true;
      const checkPaths = (idx, currentVal, direction) => {
        if (idx === args.length)
          return true;
        const nextVals = getValues(args[idx]);
        for (const nextVal of nextVals) {
          const cmp = compare(currentVal, nextVal);
          if (direction === 1 && cmp > 0)
            return false;
          if (direction === -1 && cmp < 0)
            return false;
          if (!checkPaths(idx + 1, nextVal, direction)) {
            return false;
          }
        }
        return true;
      };
      const firstVals = getValues(args[0]);
      for (const firstVal of firstVals) {
        if (allAscending && !checkPaths(1, firstVal, 1)) {
          allAscending = false;
        }
        if (allDescending && !checkPaths(1, firstVal, -1)) {
          allDescending = false;
        }
        if (!allAscending && !allDescending)
          break;
      }
      if (allAscending || allDescending) {
        return new Integer(1);
      }
      return null;
    },
    pure: true,
    doc: "Create an interval [lo, hi] or test betweenness like a:b:c"
  },
  MEMBER: {
    impl(args) {
      const [x, coll] = args;
      if (!coll || typeof coll !== "object")
        return null;
      if (coll.type === "set" || coll.type === "tuple" || coll.type === "sequence") {
        const values = coll.values || coll.elements || [];
        const xKey = valueKey(x);
        for (const v of values) {
          if (valueKey(v) === xKey)
            return new Integer(1);
        }
      } else if (coll instanceof RationalInterval || coll.type === "interval") {
        const lo = coll instanceof RationalInterval ? coll.start : coll.lo;
        const hi = coll instanceof RationalInterval ? coll.end : coll.hi;
        const cmpLo = compare(lo, x);
        const cmpHi = compare(x, hi);
        if (cmpLo <= 0 && cmpHi <= 0)
          return new Integer(1);
      } else if (coll.type === "map") {
        const entries = coll.entries || coll.elements || new Map;
        const k = keyOf(x);
        if (entries.has(k))
          return new Integer(1);
      }
      return null;
    },
    pure: true,
    doc: "Check membership (1 if present, null otherwise)"
  },
  NOT_MEMBER: {
    impl(args) {
      return isTruthy(collectionFunctions.MEMBER.impl(args)) ? null : new Integer(1);
    },
    pure: true,
    doc: "Check non-membership (1 if not present, null otherwise)"
  },
  INTERSECTS: {
    impl(args) {
      const [a, b] = args;
      const intersect = collectionFunctions.INTERSECT.impl([a, b]);
      return isTruthy(intersect) ? new Integer(1) : null;
    },
    pure: true,
    doc: "Check if two collections intersect (1 if true, null otherwise)"
  },
  UNION: {
    impl(args) {
      const [a, b] = args;
      if (!a || !b)
        return null;
      if (a.type === "set" && b.type === "set") {
        const seen = new Set;
        const values = [];
        for (const v of [...a.values, ...b.values]) {
          const key = valueKey(v);
          if (!seen.has(key)) {
            seen.add(key);
            values.push(v);
          }
        }
        return { type: "set", values };
      }
      if ((a instanceof RationalInterval || a.type === "interval") && (b instanceof RationalInterval || b.type === "interval")) {
        const alo = a instanceof RationalInterval ? a.start : a.lo;
        const ahi = a instanceof RationalInterval ? a.end : a.hi;
        const blo = b instanceof RationalInterval ? b.start : b.lo;
        const bhi = b instanceof RationalInterval ? b.end : b.hi;
        const lo = compare(alo, blo) <= 0 ? alo : blo;
        const hi = compare(ahi, bhi) >= 0 ? ahi : bhi;
        return collectionFunctions.INTERVAL.impl([lo, hi]);
      }
      throw new Error(`UNION not defined for these types: ${a.type || a.constructor?.name || typeof a} and ${b.type || b.constructor?.name || typeof b}`);
    },
    pure: true,
    doc: "Join/Union of two collections (set union or interval hull)"
  },
  INTERSECT: {
    impl(args) {
      const [a, b] = args;
      if (!a || !b)
        return null;
      if (a.type === "set" && b.type === "set") {
        const bValues = b.values.map(valueKey);
        const values = a.values.filter((v) => bValues.includes(valueKey(v)));
        return { type: "set", values };
      }
      if ((a instanceof RationalInterval || a.type === "interval") && (b instanceof RationalInterval || b.type === "interval")) {
        const alo = a instanceof RationalInterval ? a.start : a.lo;
        const ahi = a instanceof RationalInterval ? a.end : a.hi;
        const blo = b instanceof RationalInterval ? b.start : b.lo;
        const bhi = b instanceof RationalInterval ? b.end : b.hi;
        const lo = compare(alo, blo) >= 0 ? alo : blo;
        const hi = compare(ahi, bhi) <= 0 ? ahi : bhi;
        if (compare(lo, hi) <= 0) {
          return collectionFunctions.INTERVAL.impl([lo, hi]);
        }
        return null;
      }
      return null;
    },
    pure: true,
    doc: "Intersection of two collections (set intersection or interval overlap)"
  },
  NARY_UNION: {
    impl(args) {
      if (args.length === 0)
        return { type: "set", values: [] };
      if (args.length === 1)
        return args[0];
      const domain = classifyUnionIntersectDomain(args[0]);
      if (!domain) {
        throw new Error("NARY_UNION expects sets or intervals");
      }
      for (let i = 1;i < args.length; i++) {
        if (classifyUnionIntersectDomain(args[i]) !== domain) {
          throw new Error("NARY_UNION operands must all be sets or all be intervals");
        }
      }
      let acc = args[0];
      for (let i = 1;i < args.length; i++) {
        acc = collectionFunctions.UNION.impl([acc, args[i]]);
      }
      return acc;
    },
    pure: true,
    doc: "N-ary union/hull fold for sets or intervals"
  },
  NARY_INTERSECT: {
    impl(args) {
      if (args.length === 0)
        return { type: "set", values: [] };
      if (args.length === 1)
        return args[0];
      const domain = classifyUnionIntersectDomain(args[0]);
      if (!domain) {
        throw new Error("NARY_INTERSECT expects sets or intervals");
      }
      for (let i = 1;i < args.length; i++) {
        if (classifyUnionIntersectDomain(args[i]) !== domain) {
          throw new Error("NARY_INTERSECT operands must all be sets or all be intervals");
        }
      }
      let acc = args[0];
      for (let i = 1;i < args.length; i++) {
        acc = collectionFunctions.INTERSECT.impl([acc, args[i]]);
        if (acc === null)
          return null;
      }
      return acc;
    },
    pure: true,
    doc: "N-ary intersection/overlap fold for sets or intervals"
  },
  SET_DIFF: {
    impl(args) {
      const [a, b] = args;
      if (a.type === "set" && b.type === "set") {
        const bValues = b.values.map(valueKey);
        const values = a.values.filter((v) => !bValues.includes(valueKey(v)));
        return { type: "set", values };
      }
      if (a.type === "map") {
        const newEntries = new Map(a.entries);
        if (b.type === "set") {
          for (const k of b.values)
            newEntries.delete(keyOf(k));
        } else {
          newEntries.delete(keyOf(b));
        }
        return { type: "map", entries: newEntries };
      }
      throw new Error("Difference only defined for sets and maps");
    },
    pure: true
  },
  SET_SYMDIFF: {
    impl(args) {
      const [a, b] = args;
      const diff1 = collectionFunctions.SET_DIFF.impl([a, b]);
      const diff2 = collectionFunctions.SET_DIFF.impl([b, a]);
      return collectionFunctions.UNION.impl([diff1, diff2]);
    },
    pure: true
  },
  SET_PROD: {
    impl(args) {
      const [a, b] = args;
      if (a.type !== "set" || b.type !== "set")
        throw new Error("Cartesian product only for sets");
      const values = [];
      for (const va of a.values) {
        for (const vb of b.values) {
          values.push({ type: "tuple", values: [va, vb] });
        }
      }
      return { type: "set", values };
    },
    pure: true
  },
  CONCAT: {
    impl(args) {
      const [a, b] = args;
      if (a.type === "string" || b.type === "string") {
        const getStr = (v) => v && typeof v === "object" && v.type === "string" ? v.value : String(v);
        return { type: "string", value: getStr(a) + getStr(b) };
      }
      if (a.type === "sequence" || a.type === "tuple" || a.type === "array" || b.type === "sequence" || b.type === "tuple" || b.type === "array") {
        const getVals = (v) => v.values || v.elements || (Array.isArray(v) ? v : [v]);
        const vals = [...getVals(a), ...getVals(b)];
        if (a.type === "tuple" && b.type === "tuple")
          return { type: "tuple", values: vals };
        return { type: "sequence", values: vals };
      }
      if (a.type === "map" && b.type === "map") {
        return { type: "map", entries: new Map([...a.entries, ...b.entries]) };
      }
      throw new Error("Concatenation not defined for these types");
    },
    pure: true
  },
  NARY_CONCAT: {
    impl(args) {
      if (args.length === 0) {
        throw new Error("NARY_CONCAT requires at least one argument");
      }
      if (args.length === 1)
        return args[0];
      let acc = args[0];
      for (let i = 1;i < args.length; i++) {
        acc = collectionFunctions.CONCAT.impl([acc, args[i]]);
      }
      return acc;
    },
    pure: true,
    doc: "N-ary concatenation fold"
  }
};

// ../rix/src/runtime/methods.js
function int2(value) {
  return new Integer(BigInt(value));
}
function truthy(value) {
  return value !== null && value !== undefined;
}
function bool(flag) {
  return flag ? int2(1) : null;
}
function stringValue(value) {
  if (value?.type === "string")
    return value.value;
  if (value === null || value === undefined)
    return "";
  return String(value);
}
function stringObj2(value) {
  return { type: "string", value };
}
function createFrozenMeta() {
  return new Map([
    ["frozen", int2(1)],
    ["immutable", int2(1)]
  ]);
}
function createBuiltinProto(entries) {
  return {
    type: "map",
    entries: new Map(entries),
    _ext: createFrozenMeta()
  };
}
function method(name, impl) {
  return { type: "method_builtin", name, impl };
}
function mutableExt2() {
  return new Map([["_mutable", int2(1)]]);
}
function ensureExt3(value) {
  if (!value._ext)
    value._ext = new Map;
  return value._ext;
}
function createEmptySequence() {
  return { type: "sequence", values: [], _ext: mutableExt2() };
}
function createEmptyMap() {
  return { type: "map", entries: new Map, _ext: mutableExt2() };
}
function createEmptySet() {
  return { type: "set", values: [], _ext: mutableExt2() };
}
function createEmptyTupleLike(tuple) {
  return {
    type: "tuple",
    values: new Array(tuple.values.length).fill(HOLE),
    _ext: mutableExt2()
  };
}
function createEmptyTensorLike(tensor) {
  return createTensor(tensor.shape, null, { ext: mutableExt2() });
}
function defaultAccumulator(target) {
  if (target?.type === "sequence")
    return createEmptySequence();
  if (target?.type === "map")
    return createEmptyMap();
  if (target?.type === "set")
    return createEmptySet();
  if (target?.type === "tuple")
    return createEmptyTupleLike(target);
  if (target?.type === "string")
    return stringObj2("");
  if (isTensor(target))
    return createEmptyTensorLike(target);
  throw new Error("Reduce does not know how to build a default accumulator for this value");
}
function valueKey2(value) {
  if (isHole(value))
    return "__hole__";
  if (value === null || value === undefined)
    return "null";
  if (value instanceof Integer)
    return value.toString();
  if (value?.type === "string")
    return JSON.stringify(value.value);
  if (value?.type === "tuple" || value?.type === "sequence" || value?.type === "set") {
    return `${value.type}[${value.values.map(valueKey2).join(",")}]`;
  }
  if (value?.type === "map") {
    return `map{${Array.from(value.entries.entries()).map(([k, v]) => `${k}:${valueKey2(v)}`).join(",")}}`;
  }
  if (isTensor(value)) {
    return `tensor(${value.shape.join("x")})[${value.data.map(valueKey2).join(",")}]`;
  }
  if (typeof value?.toString === "function" && value.toString !== Object.prototype.toString) {
    return value.toString();
  }
  return JSON.stringify(value);
}
function isInterval(value) {
  if (!value || typeof value !== "object")
    return false;
  if (value instanceof RationalInterval)
    return true;
  if (value.type === "interval")
    return true;
  return false;
}
function getIntervalRange(value, length) {
  let lo, hi;
  if (value && (value.type === "interval" || value instanceof RationalInterval)) {
    lo = value.start;
    hi = value.end;
  } else {
    lo = value.lo;
    hi = value.hi;
  }
  const startNum = normalizeLookupIndex(lo, length);
  const start = startNum === null ? numericIndex(lo) < 1 ? 1 : length + 1 : startNum;
  const endNum = normalizeLookupIndex(hi, length);
  const end = endNum === null ? numericIndex(hi) < 1 ? 1 : length + 1 : endNum;
  return { start, end };
}
function numericIndex(value, label = "Index") {
  if (value instanceof Integer)
    return Number(value.value);
  if (value instanceof Rational) {
    if (value.denominator !== 1n) {
      throw new Error(`${label} must be an integer, got ${value}`);
    }
    return Number(value.numerator);
  }
  if (value && typeof value === "object") {
    if (typeof value.value === "bigint")
      return Number(value.value);
    if (typeof value.numerator === "bigint" && typeof value.denominator === "bigint") {
      if (value.denominator !== 1n) {
        throw new Error(`${label} must be an integer, got ${value}`);
      }
      return Number(value.numerator);
    }
  }
  if (typeof value === "number" || typeof value === "bigint")
    return Number(value);
  if (typeof value === "string" && !isNaN(value))
    return Number(value);
  throw new Error(`${label} must be numeric, got ${typeof value} (${value})`);
}
function normalizeLookupIndex(rawIndex, length) {
  const index = numericIndex(rawIndex);
  const normalized = index < 0 ? length + 1 + index : index;
  if (normalized < 1 || normalized > length)
    return null;
  return normalized;
}
function normalizeWritableIndex(rawIndex, length, allowEnd = false) {
  let index = numericIndex(rawIndex);
  if (index < 0)
    index = length + 1 + index;
  const max = allowEnd ? length + 1 : Math.max(length, 1);
  if (index < 1)
    index = 1;
  if (index > max)
    index = max;
  return index;
}
function normalizeSliceStart(rawIndex, length) {
  if (rawIndex === undefined || rawIndex === null)
    return 1;
  let index = numericIndex(rawIndex);
  if (index < 0)
    index = length + 1 + index;
  if (index < 1)
    index = 1;
  if (index > length + 1)
    index = length + 1;
  return index;
}
function normalizeSliceEnd(rawIndex, length) {
  if (rawIndex === undefined || rawIndex === null)
    return length + 1;
  let index = numericIndex(rawIndex);
  if (index < 0)
    index = length + 1 + index;
  if (index < 1)
    index = 1;
  if (index > length + 1)
    index = length + 1;
  return index;
}
function jsSlice(values, startArg, endArg) {
  const start = normalizeSliceStart(startArg, values.length);
  const end = normalizeSliceEnd(endArg, values.length);
  return values.slice(start - 1, end - 1);
}
function charsOf(value) {
  return Array.from(stringValue(value)).map((char) => stringObj2(char));
}
function fromChars(chars) {
  return stringObj2(chars.map((char) => stringValue(char)).join(""));
}
function compareValues(a, b) {
  const ak = valueKey2(a);
  const bk = valueKey2(b);
  if (ak < bk)
    return -1;
  if (ak > bk)
    return 1;
  return 0;
}
function arrayEntries(target) {
  return target.values.map((value, index) => ({
    value,
    key: int2(index + 1)
  }));
}
function tupleEntries(target) {
  return target.values.map((value, index) => ({
    value,
    key: int2(index + 1)
  }));
}
function mapEntries(target) {
  return Array.from(target.entries.entries()).map(([key, value]) => ({
    value,
    key: stringObj2(key)
  }));
}
function setEntries(target) {
  return target.values.map((value) => ({
    value,
    key: value
  }));
}
function stringEntries(target) {
  return charsOf(target).map((value, index) => ({
    value,
    key: int2(index + 1)
  }));
}
function tensorEntries(target) {
  const entries = [];
  forEachTensorCell(target, (value, tuple) => {
    entries.push({
      value,
      key: tensorIndexTuple(tuple)
    });
  });
  return entries;
}
function iterateEntries(target) {
  if (target?.type === "sequence")
    return arrayEntries(target);
  if (target?.type === "tuple")
    return tupleEntries(target);
  if (target?.type === "map")
    return mapEntries(target);
  if (target?.type === "set")
    return setEntries(target);
  if (target?.type === "string")
    return stringEntries(target);
  if (isTensor(target))
    return tensorEntries(target);
  throw new Error("Value is not iterable for this method");
}
function callIterator(fn, args, context, evaluate, invoke) {
  if (!fn) {
    return args[1];
  }
  return invoke(fn, args, context, evaluate);
}
function predicateResult(fn, args, context, evaluate, invoke) {
  return truthy(callIterator(fn, args, context, evaluate, invoke));
}
function sequenceAt(target, rawIndex) {
  const index = normalizeLookupIndex(rawIndex, target.values.length);
  if (index === null)
    return null;
  return target.values[index - 1];
}
function stringAt(target, rawIndex) {
  const chars = charsOf(target);
  const index = normalizeLookupIndex(rawIndex, chars.length);
  if (index === null)
    return null;
  return chars[index - 1];
}
function mapValue(target, key) {
  const canonical = keyOf(key);
  return target.entries.has(canonical) ? target.entries.get(canonical) : null;
}
function setHas(target, value) {
  const wanted = valueKey2(value);
  return target.values.some((entry) => valueKey2(entry) === wanted);
}
function mapLikeKeys(arg) {
  if (arg?.type === "set" || arg?.type === "sequence" || arg?.type === "tuple") {
    return (arg.values || []).map((value) => keyOf(value));
  }
  return [keyOf(arg)];
}
function ensureSequence(target, name) {
  if (!target || target.type !== "sequence")
    throw new Error(`${name} is only defined for sequences`);
}
function ensureMap(target, name) {
  if (!target || target.type !== "map")
    throw new Error(`${name} is only defined for maps`);
}
function ensureSet(target, name) {
  if (!target || target.type !== "set")
    throw new Error(`${name} is only defined for sets`);
}
function ensureTuple(target, name) {
  if (!target || target.type !== "tuple")
    throw new Error(`${name} is only defined for tuples`);
}
function ensureString(target, name) {
  if (!target || target.type !== "string")
    throw new Error(`${name} is only defined for strings`);
}
function ensureTensor(target, name) {
  if (!isTensor(target))
    throw new Error(`${name} is only defined for tensors`);
}
function mutableSetValue(target, rawIndex, value) {
  const index = normalizeWritableIndex(rawIndex, target.values.length, true);
  while (target.values.length < index - 1)
    target.values.push(HOLE);
  if (index === target.values.length + 1) {
    target.values.push(value);
  } else {
    target.values[index - 1] = value;
  }
  return target;
}
function nonMutatingSetValue(target, rawIndex, value) {
  const copy = shallowCopyValue(target);
  mutableSetValue(copy, rawIndex, value);
  return copy;
}
function removeDuplicates(values) {
  const seen = new Set;
  const out = [];
  for (const value of values) {
    const key = valueKey2(value);
    if (!seen.has(key)) {
      seen.add(key);
      out.push(value);
    }
  }
  return out;
}
function flattenValues(values, depth) {
  if (depth <= 0)
    return [...values];
  const out = [];
  for (const value of values) {
    if (value?.type === "sequence" || value?.type === "tuple" || value?.type === "set") {
      out.push(...flattenValues(value.values, depth - 1));
    } else {
      out.push(value);
    }
  }
  return out;
}
function reduceEntries(target, iterator, initial, context, evaluate, invoke, entryMapper = (entry) => [entry.value, entry.key, target]) {
  const entries = iterateEntries(target);
  let accumulator = initial === undefined ? defaultAccumulator(target) : initial;
  for (const entry of entries) {
    accumulator = invoke(iterator, [accumulator, ...entryMapper(entry)], context, evaluate);
  }
  return accumulator;
}
function anyEntries(target, iterator, context, evaluate, invoke) {
  for (const entry of iterateEntries(target)) {
    if (predicateResult(iterator, [entry.value, entry.key, target], context, evaluate, invoke)) {
      return int2(1);
    }
  }
  return null;
}
function allEntries(target, iterator, context, evaluate, invoke) {
  for (const entry of iterateEntries(target)) {
    if (!predicateResult(iterator, [entry.value, entry.key, target], context, evaluate, invoke)) {
      return null;
    }
  }
  return int2(1);
}
function countEntries(target, iterator, context, evaluate, invoke) {
  let count = 0;
  for (const entry of iterateEntries(target)) {
    if (!iterator || predicateResult(iterator, [entry.value, entry.key, target], context, evaluate, invoke)) {
      count += 1;
    }
  }
  return int2(count);
}
function findEntry(target, iterator, context, evaluate, invoke, wantKey = false) {
  for (const entry of iterateEntries(target)) {
    if (predicateResult(iterator, [entry.value, entry.key, target], context, evaluate, invoke)) {
      return wantKey ? entry.key : entry.value;
    }
  }
  return null;
}
function arithmeticAdd(a, b) {
  return arithmeticFunctions.ADD.impl([a, b]);
}
function arithmeticMul(a, b) {
  return arithmeticFunctions.MUL.impl([a, b]);
}
function arithmeticDiv(a, b) {
  return arithmeticFunctions.DIV.impl([a, b]);
}
var arrayMethods = {
  LEN: method("LEN", ([target]) => {
    ensureSequence(target, "Len");
    return int2(target.values.length);
  }),
  ISEMPTY: method("ISEMPTY", ([target]) => {
    ensureSequence(target, "IsEmpty");
    return bool(target.values.length === 0);
  }),
  GET: method("GET", ([target, index]) => {
    ensureSequence(target, "Get");
    return sequenceAt(target, index);
  }),
  FIRST: method("FIRST", ([target]) => {
    ensureSequence(target, "First");
    return target.values[0] ?? null;
  }),
  LAST: method("LAST", ([target]) => {
    ensureSequence(target, "Last");
    return target.values[target.values.length - 1] ?? null;
  }),
  INCLUDES: method("INCLUDES", ([target, value]) => {
    ensureSequence(target, "Includes");
    return bool(target.values.some((entry) => valueKey2(entry) === valueKey2(value)));
  }),
  INDEXOF: method("INDEXOF", ([target, value]) => {
    ensureSequence(target, "IndexOf");
    const idx = target.values.findIndex((entry) => valueKey2(entry) === valueKey2(value));
    return idx === -1 ? null : int2(idx + 1);
  }),
  LASTINDEXOF: method("LASTINDEXOF", ([target, value]) => {
    ensureSequence(target, "LastIndexOf");
    for (let i = target.values.length - 1;i >= 0; i--) {
      if (valueKey2(target.values[i]) === valueKey2(value))
        return int2(i + 1);
    }
    return null;
  }),
  HASAT: method("HASAT", ([target, index]) => {
    ensureSequence(target, "HasAt");
    const found = sequenceAt(target, index);
    return bool(found !== null && !isHole(found));
  }),
  SLICE: method("SLICE", ([target, start, end]) => {
    ensureSequence(target, "Slice");
    return { type: "sequence", values: jsSlice(target.values, start, end), _ext: mutableExt2() };
  }),
  JOIN: method("JOIN", ([target, separator]) => {
    ensureSequence(target, "Join");
    return stringObj2(target.values.map((value) => stringValue(value)).join(stringValue(separator ?? stringObj2(","))));
  }),
  PUSH: method("PUSH", ([target, ...values]) => {
    ensureSequence(target, "Push");
    const copy = shallowCopyValue(target);
    copy.values.push(...values);
    return copy;
  }),
  "PUSH!": method("PUSH!", ([target, ...values]) => {
    ensureSequence(target, "Push!");
    target.values.push(...values);
    return target;
  }),
  UNSHIFT: method("UNSHIFT", ([target, ...values]) => {
    ensureSequence(target, "Unshift");
    const copy = shallowCopyValue(target);
    copy.values.unshift(...values);
    return copy;
  }),
  "UNSHIFT!": method("UNSHIFT!", ([target, ...values]) => {
    ensureSequence(target, "Unshift!");
    target.values.unshift(...values);
    return target;
  }),
  SET: method("SET", ([target, index, value]) => {
    ensureSequence(target, "Set");
    return nonMutatingSetValue(target, index, value);
  }),
  "SET!": method("SET!", ([target, index, value]) => {
    ensureSequence(target, "Set!");
    mutableSetValue(target, index, value);
    return target;
  }),
  INSERT: method("INSERT", ([target, index, value]) => {
    ensureSequence(target, "Insert");
    const copy = shallowCopyValue(target);
    const at = normalizeWritableIndex(index, copy.values.length, true);
    copy.values.splice(at - 1, 0, value);
    return copy;
  }),
  "INSERT!": method("INSERT!", ([target, index, value]) => {
    ensureSequence(target, "Insert!");
    const at = normalizeWritableIndex(index, target.values.length, true);
    target.values.splice(at - 1, 0, value);
    return target;
  }),
  REMOVEAT: method("REMOVEAT", ([target, index]) => {
    ensureSequence(target, "RemoveAt");
    const copy = shallowCopyValue(target);
    const at = normalizeLookupIndex(index, copy.values.length);
    if (at !== null)
      copy.values.splice(at - 1, 1);
    return copy;
  }),
  "REMOVEAT!": method("REMOVEAT!", ([target, index]) => {
    ensureSequence(target, "RemoveAt!");
    const at = normalizeLookupIndex(index, target.values.length);
    if (at !== null)
      target.values[at - 1] = HOLE;
    return target;
  }),
  CONCAT: method("CONCAT", ([target, ...others]) => {
    ensureSequence(target, "Concat");
    return others.reduce((acc, other) => collectionFunctions.CONCAT.impl([acc, other]), target);
  }),
  "CONCAT!": method("CONCAT!", ([target, ...others]) => {
    ensureSequence(target, "Concat!");
    for (const other of others) {
      const values = other?.values || [other];
      target.values.push(...values);
    }
    return target;
  }),
  REVERSE: method("REVERSE", ([target]) => {
    ensureSequence(target, "Reverse");
    const copy = shallowCopyValue(target);
    copy.values.reverse();
    return copy;
  }),
  "REVERSE!": method("REVERSE!", ([target]) => {
    ensureSequence(target, "Reverse!");
    target.values.reverse();
    return target;
  }),
  SORT: method("SORT", ([target]) => {
    ensureSequence(target, "Sort");
    const copy = shallowCopyValue(target);
    copy.values.sort(compareValues);
    return copy;
  }),
  "SORT!": method("SORT!", ([target]) => {
    ensureSequence(target, "Sort!");
    target.values.sort(compareValues);
    return target;
  }),
  DISTINCT: method("DISTINCT", ([target]) => {
    ensureSequence(target, "Distinct");
    return { type: "sequence", values: removeDuplicates(target.values), _ext: mutableExt2() };
  }),
  "DISTINCT!": method("DISTINCT!", ([target]) => {
    ensureSequence(target, "Distinct!");
    target.values = removeDuplicates(target.values);
    return target;
  }),
  FLATTEN: method("FLATTEN", ([target, depth]) => {
    ensureSequence(target, "Flatten");
    const levels = depth === undefined ? 1 : numericIndex(depth, "Flatten depth");
    return { type: "sequence", values: flattenValues(target.values, levels), _ext: mutableExt2() };
  }),
  "FLATTEN!": method("FLATTEN!", ([target, depth]) => {
    ensureSequence(target, "Flatten!");
    const levels = depth === undefined ? 1 : numericIndex(depth, "Flatten depth");
    target.values = flattenValues(target.values, levels);
    return target;
  }),
  DROPFIRST: method("DROPFIRST", ([target, count]) => {
    ensureSequence(target, "DropFirst");
    const n = count === undefined ? 1 : Math.max(0, numericIndex(count));
    return { type: "sequence", values: target.values.slice(n), _ext: mutableExt2() };
  }),
  DROPLAST: method("DROPLAST", ([target, count]) => {
    ensureSequence(target, "DropLast");
    const n = count === undefined ? 1 : Math.max(0, numericIndex(count));
    return { type: "sequence", values: target.values.slice(0, Math.max(0, target.values.length - n)), _ext: mutableExt2() };
  }),
  "POP!": method("POP!", ([target]) => {
    ensureSequence(target, "Pop!");
    return target.values.length === 0 ? HOLE : target.values.pop();
  }),
  "SHIFT!": method("SHIFT!", ([target]) => {
    ensureSequence(target, "Shift!");
    return target.values.length === 0 ? HOLE : target.values.shift();
  }),
  MAP: method("MAP", ([target, iterator], context, evaluate, invoke) => {
    ensureSequence(target, "Map");
    return {
      type: "sequence",
      values: iterateEntries(target).map((entry) => invoke(iterator, [entry.value, entry.key, target], context, evaluate)),
      _ext: mutableExt2()
    };
  }),
  FILTER: method("FILTER", ([target, iterator], context, evaluate, invoke) => {
    ensureSequence(target, "Filter");
    return {
      type: "sequence",
      values: iterateEntries(target).filter((entry) => predicateResult(iterator, [entry.value, entry.key, target], context, evaluate, invoke)).map((entry) => entry.value),
      _ext: mutableExt2()
    };
  }),
  ANY: method("ANY", ([target, iterator], context, evaluate, invoke) => anyEntries(target, iterator, context, evaluate, invoke)),
  ALL: method("ALL", ([target, iterator], context, evaluate, invoke) => allEntries(target, iterator, context, evaluate, invoke)),
  COUNT: method("COUNT", ([target, iterator], context, evaluate, invoke) => countEntries(target, iterator, context, evaluate, invoke)),
  FIND: method("FIND", ([target, iterator], context, evaluate, invoke) => findEntry(target, iterator, context, evaluate, invoke, false)),
  FINDINDEX: method("FINDINDEX", ([target, iterator], context, evaluate, invoke) => findEntry(target, iterator, context, evaluate, invoke, true)),
  REDUCE: method("REDUCE", ([target, iterator, initial], context, evaluate, invoke) => reduceEntries(target, iterator, initial, context, evaluate, invoke)),
  "SWAP!": method("SWAP!", ([target, i, j]) => {
    ensureSequence(target, "Swap!");
    const len = target.values.length;
    const idxI = normalizeLookupIndex(i, len);
    const idxJ = normalizeLookupIndex(j, len);
    if (idxI === null || idxJ === null)
      throw new Error("Index out of bounds for Swap!");
    const tmp = target.values[idxI - 1];
    target.values[idxI - 1] = target.values[idxJ - 1];
    target.values[idxJ - 1] = tmp;
    return target;
  }),
  SWAP: method("SWAP", ([target, i, j]) => {
    ensureSequence(target, "Swap");
    const copy = shallowCopyValue(target);
    copy.values = [...target.values];
    return arrayMethods["SWAP!"].impl([copy, i, j]);
  }),
  "MOVE!": method("MOVE!", ([target, rangeOrIdx, targetIdx]) => {
    ensureSequence(target, "Move!");
    const len = target.values.length;
    let s, e;
    if (isInterval(rangeOrIdx)) {
      const range = getIntervalRange(rangeOrIdx, len);
      s = range.start;
      e = range.end;
    } else {
      s = normalizeLookupIndex(rangeOrIdx, len);
      e = s;
    }
    if (s === null || e === null)
      throw new Error("Index out of bounds for Move!");
    const actualStart = Math.min(s, e);
    const actualEnd = Math.max(s, e);
    const count = actualEnd - actualStart + 1;
    const movedItems = target.values.splice(actualStart - 1, count);
    let insertPos;
    const newLen = target.values.length;
    const rawTargetIdx = numericIndex(targetIdx);
    if (rawTargetIdx > 0) {
      insertPos = normalizeWritableIndex(targetIdx, newLen, true);
    } else if (rawTargetIdx < 0) {
      let idx = normalizeLookupIndex(targetIdx, newLen);
      insertPos = idx === null ? newLen + 1 : idx + 1;
    } else {
      insertPos = 1;
    }
    target.values.splice(insertPos - 1, 0, ...movedItems);
    return target;
  }),
  MOVE: method("MOVE", ([target, rangeOrIdx, targetIdx]) => {
    ensureSequence(target, "Move");
    const copy = shallowCopyValue(target);
    copy.values = [...target.values];
    return arrayMethods["MOVE!"].impl([copy, rangeOrIdx, targetIdx]);
  })
};
var mapMethods = {
  LEN: method("LEN", ([target]) => {
    ensureMap(target, "Len");
    return int2(target.entries.size);
  }),
  ISEMPTY: method("ISEMPTY", ([target]) => {
    ensureMap(target, "IsEmpty");
    return bool(target.entries.size === 0);
  }),
  HAS: method("HAS", ([target, key]) => {
    ensureMap(target, "Has");
    return bool(target.entries.has(keyOf(key)));
  }),
  GET: method("GET", ([target, key]) => {
    ensureMap(target, "Get");
    return mapValue(target, key);
  }),
  KEYS: method("KEYS", ([target]) => {
    ensureMap(target, "Keys");
    return { type: "set", values: Array.from(target.entries.keys()) };
  }),
  VALUES: method("VALUES", ([target]) => {
    ensureMap(target, "Values");
    return { type: "set", values: Array.from(target.entries.values()) };
  }),
  ENTRIES: method("ENTRIES", ([target]) => {
    ensureMap(target, "Entries");
    return {
      type: "sequence",
      values: Array.from(target.entries.entries()).map(([key, value]) => ({
        type: "tuple",
        values: [stringObj2(key), value]
      })),
      _ext: mutableExt2()
    };
  }),
  SET: method("SET", ([target, key, value]) => {
    ensureMap(target, "Set");
    const copy = shallowCopyValue(target);
    copy.entries.set(keyOf(key), value);
    return copy;
  }),
  "SET!": method("SET!", ([target, key, value]) => {
    ensureMap(target, "Set!");
    target.entries.set(keyOf(key), value);
    return target;
  }),
  REMOVE: method("REMOVE", ([target, key]) => {
    ensureMap(target, "Remove");
    const copy = shallowCopyValue(target);
    copy.entries.delete(keyOf(key));
    return copy;
  }),
  "REMOVE!": method("REMOVE!", ([target, key]) => {
    ensureMap(target, "Remove!");
    target.entries.delete(keyOf(key));
    return target;
  }),
  MERGE: method("MERGE", ([target, other]) => {
    ensureMap(target, "Merge");
    ensureMap(other, "Merge");
    return { type: "map", entries: new Map([...target.entries, ...other.entries]), _ext: mutableExt2() };
  }),
  "MERGE!": method("MERGE!", ([target, other]) => {
    ensureMap(target, "Merge!");
    ensureMap(other, "Merge!");
    for (const [key, value] of other.entries)
      target.entries.set(key, value);
    return target;
  }),
  UPDATE: method("UPDATE", ([target, key, updater], context, evaluate, invoke) => {
    ensureMap(target, "Update");
    const canonical = keyOf(key);
    const current = target.entries.has(canonical) ? target.entries.get(canonical) : null;
    const next = invoke(updater, [current, stringObj2(canonical), target], context, evaluate);
    const copy = shallowCopyValue(target);
    copy.entries.set(canonical, next);
    return copy;
  }),
  "UPDATE!": method("UPDATE!", ([target, key, updater], context, evaluate, invoke) => {
    ensureMap(target, "Update!");
    const canonical = keyOf(key);
    const current = target.entries.has(canonical) ? target.entries.get(canonical) : null;
    const next = invoke(updater, [current, stringObj2(canonical), target], context, evaluate);
    target.entries.set(canonical, next);
    return target;
  }),
  DEFAULT: method("DEFAULT", ([target, key, value]) => {
    ensureMap(target, "Default");
    const canonical = keyOf(key);
    if (target.entries.has(canonical))
      return shallowCopyValue(target);
    const copy = shallowCopyValue(target);
    copy.entries.set(canonical, value);
    return copy;
  }),
  "DEFAULT!": method("DEFAULT!", ([target, key, value]) => {
    ensureMap(target, "Default!");
    const canonical = keyOf(key);
    if (!target.entries.has(canonical))
      target.entries.set(canonical, value);
    return target;
  }),
  KEEP: method("KEEP", ([target, keys]) => {
    ensureMap(target, "Keep");
    const wanted = new Set(mapLikeKeys(keys));
    return {
      type: "map",
      entries: new Map(Array.from(target.entries.entries()).filter(([key]) => wanted.has(key))),
      _ext: mutableExt2()
    };
  }),
  "KEEP!": method("KEEP!", ([target, keys]) => {
    ensureMap(target, "Keep!");
    const wanted = new Set(mapLikeKeys(keys));
    for (const key of Array.from(target.entries.keys())) {
      if (!wanted.has(key))
        target.entries.delete(key);
    }
    return target;
  }),
  OMIT: method("OMIT", ([target, keys]) => {
    ensureMap(target, "Omit");
    const blocked = new Set(mapLikeKeys(keys));
    return {
      type: "map",
      entries: new Map(Array.from(target.entries.entries()).filter(([key]) => !blocked.has(key))),
      _ext: mutableExt2()
    };
  }),
  "OMIT!": method("OMIT!", ([target, keys]) => {
    ensureMap(target, "Omit!");
    const blocked = new Set(mapLikeKeys(keys));
    for (const key of blocked)
      target.entries.delete(key);
    return target;
  }),
  MAPVALUES: method("MAPVALUES", ([target, iterator], context, evaluate, invoke) => {
    ensureMap(target, "MapValues");
    const entries = new Map;
    for (const [key, value] of target.entries) {
      entries.set(key, invoke(iterator, [value, stringObj2(key), target], context, evaluate));
    }
    return { type: "map", entries, _ext: mutableExt2() };
  }),
  REDUCEKEYS: method("REDUCEKEYS", ([target, iterator, initial], context, evaluate, invoke) => {
    ensureMap(target, "ReduceKeys");
    let acc = initial === undefined ? defaultAccumulator(target) : initial;
    for (const [key, value] of target.entries) {
      acc = invoke(iterator, [acc, stringObj2(key), value, target], context, evaluate);
    }
    return acc;
  }),
  FILTER: method("FILTER", ([target, iterator], context, evaluate, invoke) => {
    ensureMap(target, "Filter");
    const entries = new Map;
    for (const [key, value] of target.entries) {
      if (predicateResult(iterator, [value, stringObj2(key), target], context, evaluate, invoke)) {
        entries.set(key, value);
      }
    }
    return { type: "map", entries, _ext: mutableExt2() };
  }),
  ANY: method("ANY", ([target, iterator], context, evaluate, invoke) => anyEntries(target, iterator, context, evaluate, invoke)),
  ALL: method("ALL", ([target, iterator], context, evaluate, invoke) => allEntries(target, iterator, context, evaluate, invoke)),
  COUNT: method("COUNT", ([target, iterator], context, evaluate, invoke) => countEntries(target, iterator, context, evaluate, invoke)),
  REDUCE: method("REDUCE", ([target, iterator, initial], context, evaluate, invoke) => reduceEntries(target, iterator, initial, context, evaluate, invoke))
};
var setMethods = {
  LEN: method("LEN", ([target]) => {
    ensureSet(target, "Len");
    return int2(target.values.length);
  }),
  ISEMPTY: method("ISEMPTY", ([target]) => {
    ensureSet(target, "IsEmpty");
    return bool(target.values.length === 0);
  }),
  HAS: method("HAS", ([target, value]) => {
    ensureSet(target, "Has");
    return bool(setHas(target, value));
  }),
  VALUES: method("VALUES", ([target]) => {
    ensureSet(target, "Values");
    return { type: "sequence", values: [...target.values], _ext: mutableExt2() };
  }),
  ADD: method("ADD", ([target, value]) => {
    ensureSet(target, "Add");
    if (setHas(target, value))
      return shallowCopyValue(target);
    const copy = shallowCopyValue(target);
    copy.values.push(value);
    return copy;
  }),
  "ADD!": method("ADD!", ([target, value]) => {
    ensureSet(target, "Add!");
    if (!setHas(target, value))
      target.values.push(value);
    return target;
  }),
  REMOVE: method("REMOVE", ([target, value]) => {
    ensureSet(target, "Remove");
    const copy = shallowCopyValue(target);
    copy.values = copy.values.filter((entry) => valueKey2(entry) !== valueKey2(value));
    return copy;
  }),
  "REMOVE!": method("REMOVE!", ([target, value]) => {
    ensureSet(target, "Remove!");
    target.values = target.values.filter((entry) => valueKey2(entry) !== valueKey2(value));
    return target;
  }),
  UNION: method("UNION", ([target, other]) => collectionFunctions.UNION.impl([target, other])),
  "UNION!": method("UNION!", ([target, other]) => {
    ensureSet(target, "Union!");
    ensureSet(other, "Union!");
    target.values = collectionFunctions.UNION.impl([target, other]).values;
    return target;
  }),
  INTERSECT: method("INTERSECT", ([target, other]) => collectionFunctions.INTERSECT.impl([target, other])),
  "INTERSECT!": method("INTERSECT!", ([target, other]) => {
    ensureSet(target, "Intersect!");
    ensureSet(other, "Intersect!");
    const next = collectionFunctions.INTERSECT.impl([target, other]);
    target.values = next ? next.values : [];
    return target;
  }),
  DIFF: method("DIFF", ([target, other]) => collectionFunctions.SET_DIFF.impl([target, other])),
  "DIFF!": method("DIFF!", ([target, other]) => {
    ensureSet(target, "Diff!");
    const next = collectionFunctions.SET_DIFF.impl([target, other]);
    target.values = next.values;
    return target;
  }),
  SYMDIFF: method("SYMDIFF", ([target, other]) => collectionFunctions.SET_SYMDIFF.impl([target, other])),
  "SYMDIFF!": method("SYMDIFF!", ([target, other]) => {
    ensureSet(target, "SymDiff!");
    const next = collectionFunctions.SET_SYMDIFF.impl([target, other]);
    target.values = next.values;
    return target;
  }),
  SUBSETOF: method("SUBSETOF", ([target, other]) => {
    ensureSet(target, "SubsetOf");
    ensureSet(other, "SubsetOf");
    return bool(target.values.every((value) => setHas(other, value)));
  }),
  SUPERSETOF: method("SUPERSETOF", ([target, other]) => {
    ensureSet(target, "SupersetOf");
    ensureSet(other, "SupersetOf");
    return bool(other.values.every((value) => setHas(target, value)));
  }),
  DISJOINT: method("DISJOINT", ([target, other]) => {
    ensureSet(target, "Disjoint");
    ensureSet(other, "Disjoint");
    return bool(target.values.every((value) => !setHas(other, value)));
  }),
  FILTER: method("FILTER", ([target, iterator], context, evaluate, invoke) => {
    ensureSet(target, "Filter");
    return {
      type: "set",
      values: target.values.filter((value) => predicateResult(iterator, [value, value, target], context, evaluate, invoke)),
      _ext: mutableExt2()
    };
  }),
  ANY: method("ANY", ([target, iterator], context, evaluate, invoke) => anyEntries(target, iterator, context, evaluate, invoke)),
  ALL: method("ALL", ([target, iterator], context, evaluate, invoke) => allEntries(target, iterator, context, evaluate, invoke)),
  COUNT: method("COUNT", ([target, iterator], context, evaluate, invoke) => countEntries(target, iterator, context, evaluate, invoke)),
  REDUCE: method("REDUCE", ([target, iterator, initial], context, evaluate, invoke) => reduceEntries(target, iterator, initial, context, evaluate, invoke))
};
var stringMethods = {
  LEN: method("LEN", ([target]) => {
    ensureString(target, "Len");
    return int2(Array.from(target.value).length);
  }),
  ISEMPTY: method("ISEMPTY", ([target]) => {
    ensureString(target, "IsEmpty");
    return bool(target.value.length === 0);
  }),
  GET: method("GET", ([target, index]) => {
    ensureString(target, "Get");
    return stringAt(target, index);
  }),
  FIRST: method("FIRST", ([target]) => {
    ensureString(target, "First");
    return charsOf(target)[0] ?? null;
  }),
  LAST: method("LAST", ([target]) => {
    ensureString(target, "Last");
    const chars = charsOf(target);
    return chars[chars.length - 1] ?? null;
  }),
  INCLUDES: method("INCLUDES", ([target, needle]) => {
    ensureString(target, "Includes");
    return bool(target.value.includes(stringValue(needle)));
  }),
  STARTSWITH: method("STARTSWITH", ([target, prefix]) => {
    ensureString(target, "StartsWith");
    return bool(target.value.startsWith(stringValue(prefix)));
  }),
  ENDSWITH: method("ENDSWITH", ([target, suffix]) => {
    ensureString(target, "EndsWith");
    return bool(target.value.endsWith(stringValue(suffix)));
  }),
  INDEXOF: method("INDEXOF", ([target, needle]) => {
    ensureString(target, "IndexOf");
    const idx = target.value.indexOf(stringValue(needle));
    return idx === -1 ? null : int2(idx + 1);
  }),
  LASTINDEXOF: method("LASTINDEXOF", ([target, needle]) => {
    ensureString(target, "LastIndexOf");
    const idx = target.value.lastIndexOf(stringValue(needle));
    return idx === -1 ? null : int2(idx + 1);
  }),
  SLICE: method("SLICE", ([target, start, end]) => {
    ensureString(target, "Slice");
    return fromChars(jsSlice(charsOf(target), start, end));
  }),
  CONCAT: method("CONCAT", ([target, ...parts]) => {
    ensureString(target, "Concat");
    return stringObj2([target, ...parts].map((part) => stringValue(part)).join(""));
  }),
  SPLIT: method("SPLIT", ([target, separator]) => {
    ensureString(target, "Split");
    const parts = separator === undefined ? Array.from(target.value) : target.value.split(stringValue(separator));
    return { type: "sequence", values: parts.map((part) => stringObj2(part)), _ext: mutableExt2() };
  }),
  TRIM: method("TRIM", ([target]) => {
    ensureString(target, "Trim");
    return stringObj2(target.value.trim());
  }),
  TRIMSTART: method("TRIMSTART", ([target]) => {
    ensureString(target, "TrimStart");
    return stringObj2(target.value.trimStart());
  }),
  TRIMEND: method("TRIMEND", ([target]) => {
    ensureString(target, "TrimEnd");
    return stringObj2(target.value.trimEnd());
  }),
  UPPER: method("UPPER", ([target]) => {
    ensureString(target, "Upper");
    return stringObj2(target.value.toUpperCase());
  }),
  LOWER: method("LOWER", ([target]) => {
    ensureString(target, "Lower");
    return stringObj2(target.value.toLowerCase());
  }),
  REPLACE: method("REPLACE", ([target, search, replacement]) => {
    ensureString(target, "Replace");
    return stringObj2(target.value.replace(stringValue(search), stringValue(replacement)));
  }),
  REPLACEALL: method("REPLACEALL", ([target, search, replacement]) => {
    ensureString(target, "ReplaceAll");
    return stringObj2(target.value.split(stringValue(search)).join(stringValue(replacement)));
  }),
  PADLEFT: method("PADLEFT", ([target, length, pad]) => {
    ensureString(target, "PadLeft");
    return stringObj2(target.value.padStart(numericIndex(length), stringValue(pad ?? stringObj2(" "))));
  }),
  PADRIGHT: method("PADRIGHT", ([target, length, pad]) => {
    ensureString(target, "PadRight");
    return stringObj2(target.value.padEnd(numericIndex(length), stringValue(pad ?? stringObj2(" "))));
  }),
  REPEAT: method("REPEAT", ([target, count]) => {
    ensureString(target, "Repeat");
    return stringObj2(target.value.repeat(numericIndex(count)));
  }),
  REDUCE: method("REDUCE", ([target, iterator, initial], context, evaluate, invoke) => reduceEntries(target, iterator, initial, context, evaluate, invoke))
};
var tupleMethods = {
  LEN: method("LEN", ([target]) => {
    ensureTuple(target, "Len");
    return int2(target.values.length);
  }),
  GET: method("GET", ([target, index]) => {
    ensureTuple(target, "Get");
    const at = normalizeLookupIndex(index, target.values.length);
    return at === null ? null : target.values[at - 1];
  }),
  FIRST: method("FIRST", ([target]) => {
    ensureTuple(target, "First");
    return target.values[0] ?? null;
  }),
  LAST: method("LAST", ([target]) => {
    ensureTuple(target, "Last");
    return target.values[target.values.length - 1] ?? null;
  }),
  SLICE: method("SLICE", ([target, start, end]) => {
    ensureTuple(target, "Slice");
    return { type: "tuple", values: jsSlice(target.values, start, end) };
  }),
  SET: method("SET", ([target, index, value]) => {
    ensureTuple(target, "Set");
    const copy = shallowCopyValue(target);
    const at = normalizeLookupIndex(index, copy.values.length);
    if (at === null)
      return copy;
    copy.values[at - 1] = value;
    return copy;
  }),
  TOARRAY: method("TOARRAY", ([target]) => {
    ensureTuple(target, "ToArray");
    return { type: "sequence", values: [...target.values], _ext: mutableExt2() };
  }),
  REDUCE: method("REDUCE", ([target, iterator, initial], context, evaluate, invoke) => reduceEntries(target, iterator, initial, context, evaluate, invoke))
};
function tensorSelectorsFromArgs(args) {
  if (args.length === 1 && args[0]?.type === "tuple") {
    return args[0].values.map((value) => ({ kind: "index", value }));
  }
  return args.map((value) => ({ kind: "index", value }));
}
var tensorMethods = {
  SHAPE: method("SHAPE", ([target]) => {
    ensureTensor(target, "Shape");
    return { type: "tuple", values: tensorShape(target).map((dim) => int2(dim)) };
  }),
  RANK: method("RANK", ([target]) => {
    ensureTensor(target, "Rank");
    return int2(tensorRank(target));
  }),
  SIZE: method("SIZE", ([target]) => {
    ensureTensor(target, "Size");
    return int2(tensorSize(target));
  }),
  GET: method("GET", ([target, ...selectors]) => {
    ensureTensor(target, "Get");
    return tensorGetBySelectors(target, tensorSelectorsFromArgs(selectors));
  }),
  SET: method("SET", ([target, ...selectorsAndValue]) => {
    ensureTensor(target, "Set");
    const value = selectorsAndValue[selectorsAndValue.length - 1];
    const selectors = selectorsAndValue.slice(0, -1);
    const copy = shallowCopyValue(target);
    tensorAssignBySelectors(copy, tensorSelectorsFromArgs(selectors), value);
    return copy;
  }),
  "SET!": method("SET!", ([target, ...selectorsAndValue]) => {
    ensureTensor(target, "Set!");
    const value = selectorsAndValue[selectorsAndValue.length - 1];
    const selectors = selectorsAndValue.slice(0, -1);
    tensorAssignBySelectors(target, tensorSelectorsFromArgs(selectors), value);
    return target;
  }),
  RESHAPE: method("RESHAPE", ([target, shape]) => {
    ensureTensor(target, "Reshape");
    const nextShape = shape?.type === "tuple" ? shape.values.map((value) => numericIndex(value)) : null;
    if (!nextShape)
      throw new Error("Reshape expects a shape tuple");
    const expected = nextShape.reduce((product, dim) => product * dim, 1);
    if (expected !== tensorSize(target))
      throw new Error("Reshape size mismatch");
    return createTensor(nextShape, target.data);
  }),
  FLATTEN: method("FLATTEN", ([target]) => {
    ensureTensor(target, "Flatten");
    return createTensor([tensorSize(target)], [...target.data]);
  }),
  TRANSPOSE: method("TRANSPOSE", ([target]) => {
    ensureTensor(target, "Transpose");
    if (tensorRank(target) !== 2)
      throw new Error("Transpose currently expects a rank-2 tensor");
    return createTensorView(target, {
      shape: [target.shape[1], target.shape[0]],
      strides: [target.strides[1], target.strides[0]],
      offset: target.offset
    });
  }),
  PERMUTE: method("PERMUTE", ([target, order]) => {
    ensureTensor(target, "Permute");
    if (order?.type !== "tuple")
      throw new Error("Permute expects a tuple of axis numbers");
    const axes = order.values.map((value) => numericIndex(value) - 1);
    if (axes.length !== target.shape.length)
      throw new Error("Permute rank mismatch");
    return createTensorView(target, {
      shape: axes.map((axis) => target.shape[axis]),
      strides: axes.map((axis) => target.strides[axis]),
      offset: target.offset
    });
  }),
  MAP: method("MAP", ([target, iterator], context, evaluate, invoke) => {
    ensureTensor(target, "Map");
    const data = [];
    forEachTensorCell(target, (value, tuple) => {
      data.push(invoke(iterator, [value, tensorIndexTuple(tuple), target], context, evaluate));
    });
    return createTensor(target.shape, data);
  }),
  "FILL!": method("FILL!", ([target, value]) => {
    ensureTensor(target, "Fill!");
    forEachTensorCell(target, (_entry, _tuple, offset) => {
      target.data[offset] = value;
    });
    return target;
  }),
  SUM: method("SUM", ([target]) => {
    ensureTensor(target, "Sum");
    let acc = int2(0);
    forEachTensorCell(target, (value) => {
      if (!isHole(value))
        acc = arithmeticAdd(acc, value);
    });
    return acc;
  }),
  MEAN: method("MEAN", ([target]) => {
    ensureTensor(target, "Mean");
    const size = tensorSize(target);
    if (size === 0)
      return null;
    return arithmeticDiv(tensorMethods.SUM.impl([target]), int2(size));
  }),
  DOT: method("DOT", ([target, other]) => {
    ensureTensor(target, "Dot");
    ensureTensor(other, "Dot");
    if (tensorRank(target) !== 1 || tensorRank(other) !== 1 || tensorSize(target) !== tensorSize(other)) {
      throw new Error("Dot expects rank-1 tensors of equal size");
    }
    let acc = int2(0);
    for (let i = 0;i < target.data.length; i++) {
      acc = arithmeticAdd(acc, arithmeticMul(target.data[i], other.data[i]));
    }
    return acc;
  }),
  MATMUL: method("MATMUL", ([target, other]) => {
    ensureTensor(target, "MatMul");
    ensureTensor(other, "MatMul");
    if (tensorRank(target) !== 2 || tensorRank(other) !== 2) {
      throw new Error("MatMul expects rank-2 tensors");
    }
    const [rows, inner] = target.shape;
    const [otherInner, cols] = other.shape;
    if (inner !== otherInner)
      throw new Error("MatMul inner dimensions must agree");
    const data = [];
    for (let r = 1;r <= rows; r++) {
      for (let c = 1;c <= cols; c++) {
        let acc = int2(0);
        for (let k = 1;k <= inner; k++) {
          const a = tensorGetBySelectors(target, [{ kind: "index", value: int2(r) }, { kind: "index", value: int2(k) }]);
          const b = tensorGetBySelectors(other, [{ kind: "index", value: int2(k) }, { kind: "index", value: int2(c) }]);
          acc = arithmeticAdd(acc, arithmeticMul(a, b));
        }
        data.push(acc);
      }
    }
    return createTensor([rows, cols], data);
  }),
  REDUCE: method("REDUCE", ([target, iterator, initial], context, evaluate, invoke) => reduceEntries(target, iterator, initial, context, evaluate, invoke))
};
var commonMethods = {
  CHECKTRAITS: method("CHECKTRAITS", ([target], context) => checkTraits(target, context, { warnOnly: true })),
  CheckTraits: method("CheckTraits", ([target], context) => checkTraits(target, context, { warnOnly: true }))
};
var PROTOS = new Map([
  ["sequence", createBuiltinProto([...Object.entries(commonMethods), ...Object.entries(arrayMethods)])],
  ["map", createBuiltinProto([...Object.entries(commonMethods), ...Object.entries(mapMethods)])],
  ["set", createBuiltinProto([...Object.entries(commonMethods), ...Object.entries(setMethods)])],
  ["string", createBuiltinProto([...Object.entries(commonMethods), ...Object.entries(stringMethods)])],
  ["tuple", createBuiltinProto([...Object.entries(commonMethods), ...Object.entries(tupleMethods)])],
  ["tensor", createBuiltinProto([...Object.entries(commonMethods), ...Object.entries(tensorMethods)])],
  ["deferred", createBuiltinProto([...Object.entries(commonMethods), ...Object.entries(deferredMethods)])]
]);
function isCallableValue(value) {
  return typeof value === "function" || value && (value.type === "function" || value.type === "lambda" || value.type === "sysref" || value.type === "partial" || value.type === "arityCap" || value.type === "method_builtin");
}
function ensureCallableMethod(value, name) {
  if (!isCallableValue(value)) {
    throw new Error(`Method "${name}" is not callable`);
  }
  return value;
}
function checkTraitsMethod(name) {
  if (name !== "CHECKTRAITS" && name !== "CheckTraits")
    return null;
  return method(name, ([target], context) => checkTraits(target, context, { warnOnly: true }));
}
function builtinProtoFor(target) {
  if (isTensor(target))
    return PROTOS.get("tensor");
  if (target && typeof target === "object" && target.fn === "DEFER")
    return PROTOS.get("deferred");
  return PROTOS.get(target?.type) ?? null;
}
function resolveFromProto(proto, candidates, methodName) {
  if (proto === null || proto === undefined)
    return null;
  if (proto.type !== "map" || !(proto.entries instanceof Map)) {
    throw new Error("Method prototype must be a map or null");
  }
  for (const candidate of candidates) {
    if (proto.entries.has(candidate)) {
      return ensureCallableMethod(proto.entries.get(candidate), methodName);
    }
  }
  return null;
}
function getBuiltinProto(target) {
  const ext = target?._ext;
  if (ext instanceof Map && ext.has("_proto")) {
    const proto = ext.get("_proto");
    if (proto === null)
      return null;
    if (proto?.type !== "map" || !(proto.entries instanceof Map)) {
      throw new Error("Method prototype must be a map or null");
    }
    return proto;
  }
  return builtinProtoFor(target);
}
function resolveMethod(target, name) {
  const ext = target?._ext;
  const candidates = [name, `__${name}`, `_${name}`];
  const special = checkTraitsMethod(name);
  if (special) {
    return special;
  }
  if (ext instanceof Map) {
    for (const candidate of candidates) {
      if (ext.has(candidate)) {
        return ensureCallableMethod(ext.get(candidate), name);
      }
    }
  }
  const semanticProto = ext instanceof Map ? ext.get("__proto") : null;
  const traitProto = semanticProto?.type === "map" ? semanticProto.entries?.get("traits") : null;
  const typeProto = semanticProto?.type === "map" ? semanticProto.entries?.get("type") : null;
  const semanticResolved = resolveFromProto(traitProto, candidates, name) || resolveFromProto(typeProto, candidates, name);
  if (semanticResolved) {
    return semanticResolved;
  }
  const resolved = resolveFromProto(getBuiltinProto(target), candidates, name);
  if (resolved) {
    return resolved;
  }
  throw new Error(`Method not found: ${name}`);
}
function ensureMutableReceiver(target) {
  const ext = target?._ext;
  if (!ext?.get("_mutable") || ext.get("frozen") || ext.get("immutable")) {
    throw new Error("Cannot mutate immutable value");
  }
}
function attachBuiltinProto(value) {
  if (!value || typeof value !== "object")
    return value;
  const proto = builtinProtoFor(value);
  if (!proto)
    return value;
  ensureExt3(value);
  if (!value._ext.has("_proto")) {
    value._ext.set("_proto", proto);
  }
  refreshRuntimeMetadata(value, proto);
  return value;
}

// ../rix/src/runtime/multifunction.js
function stringObj3(value) {
  return { type: "string", value };
}
function ensureExt4(value) {
  if (!value || typeof value !== "object") {
    throw new Error("Multifunctions must be sequence values");
  }
  if (!value._ext) {
    value._ext = new Map;
  }
  return value._ext;
}
function getWarningsConfig(context) {
  return context?.getEnv?.("warnings", runtimeDefaults.warnings) ?? runtimeDefaults.warnings;
}
function emitWarning2(context, label, data = new Map) {
  if (!context?.getEnv)
    return;
  getDiagnostics(context).addEvent(createEvent({
    kind: "warning",
    label,
    file: getCurrentFilePath(context),
    data: { type: "map", entries: data }
  }));
}
function ensureState(value) {
  if (!value.__multifunction__) {
    Object.defineProperty(value, "__multifunction__", {
      value: {
        namedVariants: new Map
      },
      writable: true,
      configurable: true,
      enumerable: false
    });
  }
  return value.__multifunction__;
}
function canonicalVariantKey(name) {
  return String(name).toUpperCase();
}
function isMultifunctionValue(value) {
  return Boolean(value && value.type === "sequence" && value._ext instanceof Map && value._ext.get("_type")?.value === "multifunction");
}
function markAsMultifunction(value) {
  if (!value || value.type !== "sequence" || !Array.isArray(value.values)) {
    throw new Error("Only arrays/sequences can be marked as multifunctions");
  }
  attachBuiltinProto(value);
  const ext = ensureExt4(value);
  ext.set("_type", stringObj3("multifunction"));
  ensureState(value);
  return value;
}
function maybeAutoMarkMultifunction(name, value) {
  if (!/^[A-Z]/.test(name || "")) {
    return value;
  }
  if (!value || value.type !== "sequence" || !Array.isArray(value.values)) {
    return value;
  }
  const marked = markAsMultifunction(value);
  if (!marked.__name) {
    marked.__name = name;
  }
  return marked;
}
function createMultifunctionValue(variants) {
  return markAsMultifunction({
    type: "sequence",
    values: [...variants],
    _ext: new Map([["_mutable", new Integer(1n)]])
  });
}
function rebuildMultifunctionState(value) {
  if (!isMultifunctionValue(value)) {
    return null;
  }
  const state = ensureState(value);
  const namedVariants = new Map;
  for (let index = 0;index < value.values.length; index++) {
    const variant = value.values[index];
    const name = variant?.__name;
    if (variant && typeof variant === "object") {
      variant.__parentMultifunction = value;
    }
    if (!name)
      continue;
    const key = canonicalVariantKey(name);
    if (namedVariants.has(key)) {
      throw new Error(`Duplicate multifunction variant name: ${name}`);
    }
    namedVariants.set(key, variant);
  }
  state.namedVariants = namedVariants;
  return state;
}
function getNamedMultifunctionVariant(value, name) {
  const state = rebuildMultifunctionState(value);
  if (!state) {
    return null;
  }
  return state.namedVariants.get(canonicalVariantKey(name)) ?? null;
}
function appendMultifunctionVariant(currentValue, variant, mode, context, ownerName = null) {
  if (currentValue === undefined) {
    const created = createMultifunctionValue([variant]);
    rebuildMultifunctionState(created);
    return created;
  }
  if (isMultifunctionValue(currentValue)) {
    if (mode === "prepend") {
      currentValue.values.unshift(variant);
    } else {
      currentValue.values.push(variant);
    }
    rebuildMultifunctionState(currentValue);
    return currentValue;
  }
  const callableKinds = new Set(["function", "lambda"]);
  if (currentValue && callableKinds.has(currentValue.type)) {
    if (getWarningsConfig(context)?.multifunctionConversion === true) {
      emitWarning2(context, "Converted function to multifunction", new Map([
        ["name", stringObj3(ownerName || currentValue.name || "<anonymous>")]
      ]));
    }
    const variants = mode === "prepend" ? [variant, currentValue] : [currentValue, variant];
    const created = createMultifunctionValue(variants);
    rebuildMultifunctionState(created);
    return created;
  }
  throw new Error(`${ownerName || "Value"} is not a function or multifunction`);
}
function shouldWarnNoPrep(context) {
  return getWarningsConfig(context)?.multifunctionNoPrep === true;
}
function emitNoPrepWarning(context, multifnName, index, variantName) {
  emitWarning2(context, "Multifunction variant without prep is not last", new Map([
    ["function", stringObj3(multifnName || "<anonymous>")],
    ["variantIndex", new Integer(BigInt(index + 1))],
    ...variantName ? [["variantName", stringObj3(variantName)]] : []
  ]));
}

// ../rix/src/eval/functions/functions.js
var isTruthy2 = (val) => val !== null && val !== undefined;
function evaluateArgs(argNodes, evaluate) {
  const evaluatedArgs = [];
  for (const arg of argNodes) {
    if (arg && arg.fn === "SPREAD") {
      const spreadVal = evaluate(arg.args[0]);
      if (spreadVal && (spreadVal.type === "tuple" || spreadVal.type === "sequence" || spreadVal.type === "array" || spreadVal.type === "set")) {
        const items = spreadVal.values || spreadVal.elements || [];
        evaluatedArgs.push(...items);
      } else {
        throw new Error("Spread operator requires an iterable collection (array, tuple, sequence, set)");
      }
    } else {
      evaluatedArgs.push(evaluate(arg));
    }
  }
  return evaluatedArgs;
}
function isPlaceholderNode(node) {
  return node && typeof node === "object" && node.fn === "PLACEHOLDER";
}
function resolvePartial(partial, callArgs) {
  const { fn, template } = partial;
  const filled = template.map((t) => t && t.type === "placeholder" ? callArgs[t.index - 1] : t);
  const maxIdx = template.reduce((max, t) => t && t.type === "placeholder" ? Math.max(max, t.index) : max, 0);
  return { fn, args: [...filled, ...callArgs.slice(maxIdx)] };
}
var TAIL_SELF_MARKER = Symbol("tailSelfCall");
function createTailSelfCall(args) {
  return { marker: TAIL_SELF_MARKER, args };
}
function isTailSelfCall(value) {
  return value && value.marker === TAIL_SELF_MARKER;
}
function bindCallScope(params, callArgs, evaluate) {
  const scope = new Map;
  if (!params?.positional) {
    return scope;
  }
  const posParams = params.positional;
  const hasRest = posParams.length > 0 && posParams[posParams.length - 1].isRest;
  const normalParamCount = hasRest ? posParams.length - 1 : posParams.length;
  for (let i = 0;i < normalParamCount; i++) {
    const param = posParams[i];
    const missing = i >= callArgs.length;
    const argVal = missing ? null : callArgs[i];
    let value;
    if (missing) {
      value = param.holeDefault ? evaluate(param.holeDefault) : HOLE;
    } else if (isHole(argVal)) {
      value = param.holeDefault ? evaluate(param.holeDefault) : HOLE;
    } else {
      value = argVal;
    }
    scope.set(param.name, value);
  }
  if (hasRest) {
    const restParam = posParams[posParams.length - 1];
    const restArgs = callArgs.slice(normalParamCount);
    scope.set(restParam.name, { type: "sequence", values: restArgs });
  }
  return scope;
}
function prepFailureError(fn, entryIndex) {
  const label = fn?.name || "<lambda>";
  return new Error(`${label} prep failed at entry ${entryIndex + 1}`);
}
function runCallablePrep(fn, context, evaluate) {
  const conditionals = Array.isArray(fn?.params?.conditionals) ? fn.params.conditionals : [];
  const prep = Array.isArray(fn?.params?.prep) ? fn.params.prep : [];
  const entries = [...conditionals, ...prep];
  if (entries.length === 0) {
    return { ok: true };
  }
  const strict = fn?.params?.prepStrict === true;
  for (let i = 0;i < entries.length; i++) {
    try {
      const value = evaluate(entries[i]);
      if (value === null) {
        if (strict) {
          throw prepFailureError(fn, i);
        }
        return { ok: false };
      }
    } catch (error) {
      if (strict) {
        throw error;
      }
      return { ok: false };
    }
  }
  return { ok: true };
}
function traceCallEvent(context, entry) {
  const tc = context.getEnv("__trace_context__");
  if (!tc || !tc.active) {
    return;
  }
  tc.log.push(entry);
}
function invokeUserCallable(fn, callArgs, context, evaluate, options = {}) {
  const callName = options.callName ?? fn.name ?? null;
  const shareBody = options.shareBody !== false;
  const parentCallable = options.parentCallable ?? fn.__parentMultifunction ?? null;
  const returnPrepStatus = options.returnPrepStatus === true;
  const closureScopes = Array.isArray(fn.__closureScopes) ? fn.__closureScopes : [];
  let pushedClosureScopes = 0;
  let scopeActive = false;
  const tc = context.getEnv("__trace_context__");
  let traceActive = false;
  const restoredEnv = new Map;
  if (fn.__rixCapturedEnv && context?.setEnv) {
    for (const [key, value] of fn.__rixCapturedEnv) {
      restoredEnv.set(key, {
        has: context.env?.has(key) === true,
        value: context.getEnv(key, undefined)
      });
      context.setEnv(key, value);
    }
  }
  const doTraceEnter = (args) => {
    if (tc && tc.active && tc.currentDepth < tc.depth) {
      tc.log.push({ event: "enter", fn: callName || "<lambda>", depth: tc.currentDepth, args });
      tc.currentDepth++;
      return true;
    }
    return false;
  };
  const doTraceExit = (val, threw) => {
    if (traceActive && tc) {
      tc.currentDepth--;
      if (!threw) {
        tc.log.push({ event: "exit", fn: callName || "<lambda>", depth: tc.currentDepth, value: val });
      }
    }
  };
  traceActive = doTraceEnter(callArgs);
  for (const closureScope of closureScopes) {
    const bindings = closureScope instanceof Map ? closureScope : closureScope.bindings;
    context.push(bindings, {
      isolated: closureScope.isolated === true,
      readThrough: closureScope.readThrough === true,
      callableBoundary: closureScope.callableBoundary === true
    });
    pushedClosureScopes++;
  }
  context.push(bindCallScope(fn.params, callArgs, evaluate));
  scopeActive = true;
  if (callName)
    context.pushCall(callName);
  try {
    while (true) {
      const prepResult = runCallablePrep(fn, context, evaluate);
      if (!prepResult.ok) {
        doTraceExit(null, false);
        traceActive = false;
        return returnPrepStatus ? { matched: false, value: null } : null;
      }
      let result;
      context.pushCurrentCallable(fn, parentCallable);
      try {
        result = shareBody ? context.withSharedBody(fn.body, () => evaluate(fn.body)) : evaluate(fn.body);
      } finally {
        context.popCurrentCallable();
      }
      if (!isTailSelfCall(result)) {
        doTraceExit(result, false);
        traceActive = false;
        return returnPrepStatus ? { matched: true, value: result } : result;
      }
      doTraceExit(result.args, false);
      traceActive = doTraceEnter(result.args);
      context.pop();
      scopeActive = false;
      context.push(bindCallScope(fn.params, result.args, evaluate));
      scopeActive = true;
    }
  } finally {
    for (const [key, entry] of restoredEnv) {
      if (entry.has)
        context.setEnv(key, entry.value);
      else
        context.env?.delete(key);
    }
    if (traceActive && tc) {
      tc.currentDepth--;
    }
    if (callName)
      context.popCall();
    if (scopeActive)
      context.pop();
    while (pushedClosureScopes > 0) {
      context.pop();
      pushedClosureScopes--;
    }
  }
}
function invokeMultifunction(multifn, callArgs, context, evaluate, options = {}) {
  const ownerName = options.callName ?? multifn.__name ?? null;
  const namedOnly = options.namedOnly ?? null;
  rebuildMultifunctionState(multifn);
  const variants = namedOnly ? [namedOnly] : multifn.values;
  for (let index = 0;index < variants.length; index++) {
    const variant = variants[index];
    if (!variant || variant.type !== "function" && variant.type !== "lambda") {
      const displayIndex = namedOnly ? variant?.__name || "named" : `${index + 1}`;
      throw new Error(`Multifunction variant ${displayIndex} is not a function`);
    }
    const actualIndex = namedOnly ? multifn.values.indexOf(variant) : index;
    const variantName = variant.__name ?? null;
    traceCallEvent(context, {
      event: "variant",
      fn: ownerName || "<multifunction>",
      depth: context.getEnv("__trace_context__")?.currentDepth ?? 0,
      variantIndex: actualIndex + 1,
      variantName
    });
    const prepEntries = (Array.isArray(variant?.params?.conditionals) ? variant.params.conditionals.length : 0) + (Array.isArray(variant?.params?.prep) ? variant.params.prep.length : 0);
    if (!namedOnly && prepEntries === 0 && actualIndex < multifn.values.length - 1 && shouldWarnNoPrep(context)) {
      emitNoPrepWarning(context, ownerName, actualIndex, variantName);
    }
    const result = invokeUserCallable(variant, callArgs, context, evaluate, {
      callName: ownerName,
      parentCallable: multifn,
      returnPrepStatus: true
    });
    if (!result.matched) {
      traceCallEvent(context, {
        event: "prep_fail",
        fn: ownerName || "<multifunction>",
        depth: context.getEnv("__trace_context__")?.currentDepth ?? 0,
        variantIndex: actualIndex + 1,
        variantName
      });
      continue;
    }
    traceCallEvent(context, {
      event: "variant_selected",
      fn: ownerName || "<multifunction>",
      depth: context.getEnv("__trace_context__")?.currentDepth ?? 0,
      variantIndex: actualIndex + 1,
      variantName
    });
    return result.value;
  }
  return null;
}
function callWithConcreteArgs(fn, callArgs, context, evaluate) {
  if (!fn)
    throw new Error("Cannot call null/undefined");
  if (fn.type === "arityCap") {
    return callWithConcreteArgs(fn.fn, callArgs.slice(0, fn.cap), context, evaluate);
  }
  if (fn.type === "partial") {
    const { fn: innerFn, args } = resolvePartial(fn, callArgs);
    return callWithConcreteArgs(innerFn, args, context, evaluate);
  }
  if (fn.type === "function" || fn.type === "lambda") {
    return invokeUserCallable(fn, callArgs, context, evaluate, { callName: fn.name });
  }
  if (isMultifunctionValue(fn)) {
    return invokeMultifunction(fn, callArgs, context, evaluate, { callName: fn.__name });
  }
  if (fn.type === "sysref") {
    return evaluate({ fn: fn.name, args: callArgs });
  }
  if (typeof fn === "function") {
    return fn(...callArgs);
  }
  throw new Error("Value is not callable");
}
function invokeTraversalCallback(func, callArgs, context, evaluate) {
  if (func && func.type === "arityCap") {
    return invokeTraversalCallback(func.fn, callArgs.slice(0, func.cap), context, evaluate);
  }
  if (func && func.type === "partial") {
    const maxIdx = func.template.reduce((max, t) => t && t.type === "placeholder" ? Math.max(max, t.index) : max, 0);
    return callWithConcreteArgs(func, callArgs.slice(0, maxIdx), context, evaluate);
  }
  if (func && func.type === "sysref") {
    return evaluate({ fn: func.name, args: callArgs });
  }
  if (func && (func.type === "function" || func.type === "lambda")) {
    return invokeUserCallable(func, callArgs, context, evaluate, {
      callName: func.name
    });
  }
  if (isMultifunctionValue(func)) {
    return invokeMultifunction(func, callArgs, context, evaluate, {
      callName: func.__name
    });
  }
  if (typeof func === "function") {
    return func(...callArgs);
  }
  throw new Error("Callback is not callable");
}
var functionFunctions = {
  CALL: {
    lazy: true,
    impl(args, context, evaluate) {
      const name = args[0];
      const argNodes = args.slice(1);
      if (argNodes.some(isPlaceholderNode)) {
        const template = evaluateArgs(argNodes, evaluate);
        const funcDef2 = context.getCallable(name);
        const fn = funcDef2 || { type: "sysref", name };
        return { type: "partial", fn, template };
      }
      const funcDef = context.getCallable(name);
      if (!funcDef) {
        throw new Error(`Undefined identifier: ${name}. System capabilities must be called via dot syntax: .${name}(args)`);
      }
      if (funcDef.type === "partial" || funcDef.type === "arityCap") {
        const callArgs = evaluateArgs(argNodes, evaluate);
        return callWithConcreteArgs(funcDef, callArgs, context, evaluate);
      }
      if (funcDef.type === "function" || funcDef.type === "lambda") {
        const callArgs = evaluateArgs(argNodes, evaluate);
        return invokeUserCallable(funcDef, callArgs, context, evaluate, { callName: name });
      }
      if (isMultifunctionValue(funcDef)) {
        const callArgs = evaluateArgs(argNodes, evaluate);
        return invokeMultifunction(funcDef, callArgs, context, evaluate, { callName: name });
      }
      if (funcDef.type === "sysref") {
        return evaluate({ fn: funcDef.name, args: argNodes });
      }
      if (typeof funcDef === "function") {
        const callArgs = evaluateArgs(argNodes, evaluate);
        return funcDef(...callArgs);
      }
      throw new Error(`${name} is not callable`);
    },
    doc: "Call a user-defined or built-in function"
  },
  CALL_EXPR: {
    lazy: true,
    impl(args, context, evaluate) {
      const funcNode = args[0];
      const argNodes = args.slice(1);
      if (argNodes.some(isPlaceholderNode)) {
        const funcVal2 = evaluate(funcNode);
        const template = evaluateArgs(argNodes, evaluate);
        return { type: "partial", fn: funcVal2, template };
      }
      const funcVal = evaluate(funcNode);
      const callArgs = evaluateArgs(argNodes, evaluate);
      if (funcVal && (funcVal.type === "partial" || funcVal.type === "arityCap")) {
        return callWithConcreteArgs(funcVal, callArgs, context, evaluate);
      }
      if (funcVal && (funcVal.type === "function" || funcVal.type === "lambda")) {
        return invokeUserCallable(funcVal, callArgs, context, evaluate, {
          callName: funcVal.name
        });
      }
      if (isMultifunctionValue(funcVal)) {
        return invokeMultifunction(funcVal, callArgs, context, evaluate, {
          callName: funcVal.__name
        });
      }
      if (funcVal && funcVal.type === "sysref") {
        return evaluate({ fn: funcVal.name, args: callArgs });
      }
      if (typeof funcVal === "function") {
        return funcVal(...callArgs);
      }
      throw new Error("Expression is not callable");
    },
    doc: "Call an expression that evaluates to a function"
  },
  TAIL_SELF: {
    lazy: true,
    impl(args, context, evaluate) {
      const currentCallable = context.getCurrentCallable();
      if (currentCallable === undefined) {
        throw new Error("Self reference '$' is only valid within a function body");
      }
      if (args.some(isPlaceholderNode)) {
        const template = evaluateArgs(args, evaluate);
        return { type: "partial", fn: currentCallable, template };
      }
      const callArgs = evaluateArgs(args, evaluate);
      return createTailSelfCall(callArgs);
    },
    doc: "Tail-position self call that reuses the current function frame"
  },
  LAMBDA: {
    lazy: true,
    impl(args, context, evaluate) {
      const params = evaluate(args[0]);
      return {
        type: "lambda",
        params,
        body: args[1],
        __closureScopes: context.captureClosureScopes(),
        ...params?.metadata?.variantName ? { __name: params.metadata.variantName } : {}
      };
    },
    doc: "Create a lambda/anonymous function"
  },
  FUNCDEF: {
    lazy: true,
    impl(args, context, evaluate) {
      const name = args[0];
      const params = evaluate(args[1]);
      const body = args[2];
      const funcDef = {
        type: "function",
        name,
        params,
        body,
        __closureScopes: context.captureClosureScopes(),
        ...params?.metadata?.variantName ? { __name: params.metadata.variantName } : {}
      };
      context.defineFunction(name, funcDef);
      return funcDef;
    },
    doc: "Define a named function"
  },
  MULTIFUNCDEF: {
    lazy: true,
    impl(args, context, evaluate) {
      const name = args[0];
      const mode = args[1];
      const params = evaluate(args[2]);
      const body = args[3];
      const variant = {
        type: "function",
        name,
        params,
        body,
        ...params?.metadata?.variantName ? { __name: params.metadata.variantName } : {}
      };
      const updated = appendMultifunctionVariant(context.getCallable(name), variant, mode, context, name);
      updated.__name = name;
      context.defineFunction(name, updated);
      return updated;
    },
    doc: "Append or prepend a multifunction variant"
  },
  PATTERNDEF: {
    lazy: true,
    impl(args, context, evaluate) {
      const name = args[0];
      const patterns = evaluate(args[1]);
      const funcDef = {
        type: "pattern_function",
        name,
        patterns
      };
      context.defineFunction(name, funcDef);
      return funcDef;
    },
    doc: "Define a pattern-matching function"
  },
  PIPE: {
    lazy: true,
    impl(args, context, evaluate) {
      const value = evaluate(args[0]);
      const funcNode = args[1];
      const callArgs = value && value.type === "tuple" ? value.values : [value];
      if (funcNode.fn === "RETRIEVE") {
        const funcName = funcNode.args[0];
        const funcDef = context.getCallable(funcName);
        if (funcDef && (funcDef.type === "function" || funcDef.type === "lambda")) {
          return callWithConcreteArgs(funcDef, callArgs, context, evaluate);
        }
      }
      if (funcNode.fn === "CALL") {
        const name = funcNode.args[0];
        const funcDef = context.getCallable(name);
        const extraArgs = evaluateArgs(funcNode.args.slice(1), evaluate);
        if (funcDef && (funcDef.type === "function" || funcDef.type === "lambda")) {
          return callWithConcreteArgs(funcDef, [...callArgs, ...extraArgs], context, evaluate);
        }
      }
      const func = evaluate(funcNode);
      if (func && (func.type === "partial" || func.type === "arityCap")) {
        return callWithConcreteArgs(func, callArgs, context, evaluate);
      }
      if (func && func.type === "sysref") {
        return evaluate({ fn: func.name, args: callArgs });
      }
      if (func && (func.type === "function" || func.type === "lambda")) {
        return callWithConcreteArgs(func, callArgs, context, evaluate);
      }
      if (isMultifunctionValue(func)) {
        return callWithConcreteArgs(func, callArgs, context, evaluate);
      }
      if (typeof func === "function") {
        return func(...callArgs);
      }
      throw new Error("Pipe target is not a function");
    },
    doc: "Pipe a value into a function"
  },
  PSLICE_STRICT: {
    lazy: true,
    impl(args, context, evaluate) {
      const collNode = args[0];
      const intervalNode = args[1];
      const coll = evaluate(collNode);
      if (coll === null || coll === undefined)
        return null;
      const interval = evaluate(intervalNode);
      let i_val, j_val;
      if (interval && interval.constructor && interval.constructor.name === "RationalInterval") {
        i_val = Number(interval.start.numerator) / Number(interval.start.denominator);
        j_val = Number(interval.end.numerator) / Number(interval.end.denominator);
      } else if (interval && interval.type === "interval") {
        const getNum = (x) => {
          if (x && x.numerator !== undefined)
            return Number(x.numerator) / Number(x.denominator);
          if (x && x.value !== undefined)
            return Number(x.value);
          return Number(x);
        };
        i_val = getNum(interval.lo);
        j_val = getNum(interval.hi);
      } else {
        return null;
      }
      if (isNaN(i_val) || isNaN(j_val)) {
        console.log("ret null 3");
        return null;
      }
      if (!Number.isInteger(i_val) || !Number.isInteger(j_val))
        return null;
      let isStringObj = coll && coll.type === "string";
      let isString = typeof coll === "string" || isStringObj;
      let n = 0;
      let items = null;
      if (isString) {
        items = isStringObj ? coll.value : coll;
        items = Array.from(items);
        n = items.length;
      } else if (coll && Array.isArray(coll.values)) {
        n = coll.values.length;
        items = coll.values;
      } else {
        return null;
      }
      const normalize = (k) => {
        if (k === 0)
          return null;
        if (k > 0)
          return k;
        if (k < 0)
          return n + 1 + k;
        return null;
      };
      let I = normalize(i_val);
      let J = normalize(j_val);
      if (I === null || J === null)
        return null;
      if (I < 1 || I > n || J < 1 || J > n)
        return null;
      const indices = [];
      if (I <= J) {
        let start = Math.ceil(I);
        let end = Math.floor(J);
        for (let k = start;k <= end; k++)
          indices.push(k);
      } else {
        let start = Math.floor(I);
        let end = Math.ceil(J);
        for (let k = start;k >= end; k--)
          indices.push(k);
      }
      if (isString) {
        let slice = indices.map((idx) => items[idx - 1]).join("");
        return isStringObj ? { type: "string", value: slice } : slice;
      } else {
        const results = indices.map((idx) => items[idx - 1]);
        if (coll.type === "tuple") {
          return { type: "tuple", values: results };
        }
        return { type: coll.type || "sequence", values: results };
      }
    },
    doc: "Strict slice operator |>/"
  },
  PSLICE_CLAMP: {
    lazy: true,
    impl(args, context, evaluate) {
      const collNode = args[0];
      const intervalNode = args[1];
      const coll = evaluate(collNode);
      const isStringObj = coll && coll.type === "string";
      const isString = typeof coll === "string" || isStringObj;
      let n = 0;
      let items = null;
      const emptyOutput = isStringObj ? { type: "string", value: "" } : isString ? "" : { type: "sequence", values: [] };
      if (coll !== null && coll !== undefined) {
        if (isString) {
          items = isStringObj ? coll.value : coll;
          items = Array.from(items);
          n = items.length;
        } else if (coll && Array.isArray(coll.values)) {
          n = coll.values.length;
          items = coll.values;
          if (coll.type !== "array" && coll.type !== "sequence" && coll.type !== "tuple") {
            throw new Error("Slicing not supported for this collection type");
          }
        } else {
          return emptyOutput;
        }
      } else {
        return emptyOutput;
      }
      const interval = evaluate(intervalNode);
      if (!interval)
        throw new Error("Invalid interval for clamping");
      let i_val, j_val;
      if (interval && interval.constructor && interval.constructor.name === "RationalInterval") {
        i_val = Number(interval.start.numerator) / Number(interval.start.denominator);
        j_val = Number(interval.end.numerator) / Number(interval.end.denominator);
      } else if (interval && interval.type === "interval") {
        const getNum = (x) => {
          if (x && x.numerator !== undefined)
            return Number(x.numerator) / Number(x.denominator);
          if (x && x.value !== undefined)
            return Number(x.value);
          return Number(x);
        };
        i_val = getNum(interval.lo);
        j_val = getNum(interval.hi);
      } else {
        throw new Error("Invalid interval representation");
      }
      if (isNaN(i_val) || isNaN(j_val))
        throw new Error("Interval bounds must be numeric");
      if (i_val === 0 && j_val !== 0)
        i_val = Math.sign(j_val) * 1;
      if (j_val === 0 && i_val !== 0)
        j_val = Math.sign(i_val) * 1;
      if (i_val === 0 && j_val === 0) {
        i_val = 1;
        j_val = 1;
      }
      const normalize = (k) => {
        if (k > 0)
          return k;
        if (k < 0)
          return n + 1 + k;
        return null;
      };
      let I = normalize(i_val);
      let J = normalize(j_val);
      if (I === null || J === null)
        return emptyOutput;
      if (n === 0)
        return emptyOutput;
      if (I < 1)
        I = 1;
      if (I > n)
        I = n;
      if (J < 1)
        J = 1;
      if (J > n)
        J = n;
      const indices = [];
      if (I <= J) {
        let start = Math.ceil(I);
        let end = Math.floor(J);
        for (let k = start;k <= end; k++)
          indices.push(k);
      } else {
        let start = Math.floor(I);
        let end = Math.ceil(J);
        for (let k = start;k >= end; k--)
          indices.push(k);
      }
      if (indices.length === 0)
        return emptyOutput;
      if (isString) {
        let slice = indices.map((idx) => items[idx - 1]).join("");
        return isStringObj ? { type: "string", value: slice } : slice;
      } else {
        const results = indices.map((idx) => items[idx - 1]);
        if (coll.type === "tuple") {
          return { type: "tuple", values: results };
        }
        return { type: coll.type || "sequence", values: results };
      }
    },
    doc: "Clamped slice operator |>//"
  },
  PIPE_EXPLICIT: {
    lazy: true,
    impl(args, context, evaluate) {
      const value = evaluate(args[0]);
      const tupleVals = value && value.type === "tuple" ? value.values : [value];
      const funcNode = args[1];
      function resolvePlaceholders(node) {
        if (!node || typeof node !== "object")
          return node;
        if (node.fn === "PLACEHOLDER") {
          const idx = node.args[0];
          if (idx === 0)
            return value;
          if (idx < 1 || idx > tupleVals.length) {
            throw new Error(`Placeholder _${idx} out of range (tuple has ${tupleVals.length} element${tupleVals.length === 1 ? "" : "s"})`);
          }
          return tupleVals[idx - 1];
        }
        if (node.fn && Array.isArray(node.args)) {
          return { fn: node.fn, args: node.args.map(resolvePlaceholders) };
        }
        return node;
      }
      const resolvedFuncNode = resolvePlaceholders(funcNode);
      return evaluate(resolvedFuncNode);
    },
    doc: "Explicit pipe operator — placeholders _1, _2, … map tuple elements to specific argument positions"
  },
  PSPLIT: {
    lazy: true,
    impl(args, context, evaluate) {
      const collection = evaluate(args[0]);
      const sepNode = args[1];
      if (collection === null || collection === undefined) {
        return null;
      }
      if (collection.type === "map") {
        throw new Error("PSPLIT does not support maps — maps have no defined order");
      }
      const isStringObj = collection && collection.type === "string";
      const isString = typeof collection === "string" || isStringObj;
      let items = null;
      if (isString) {
        items = Array.from(isStringObj ? collection.value : collection).map((ch) => isStringObj ? { type: "string", value: ch } : ch);
      } else if (collection && Array.isArray(collection.values)) {
        items = collection.values;
      } else {
        return null;
      }
      const sepVal = evaluate(sepNode);
      const results = [];
      const isRegex = typeof sepVal === "function" && sepVal.toString && sepVal.toString().startsWith("[Regex");
      const isFunc = !isRegex && (sepVal && (sepVal.type === "function" || sepVal.type === "lambda") || typeof sepVal === "function");
      if (isString && isRegex) {
        const strItems = items.map((r) => r && r.type === "string" ? r.value : r).join("");
        const matchStr = sepVal.toString().match(/{\/(.*)\/([^}]*)}/);
        if (!matchStr)
          throw new Error("Invalid regex for splitting");
        const pattern = matchStr[1];
        let flags = matchStr[2];
        if (!flags.includes("g"))
          flags += "g";
        let re;
        try {
          re = new RegExp(pattern, flags);
        } catch (e) {
          throw new Error(e);
        }
        let lastIdx = 0;
        let m;
        while ((m = re.exec(strItems)) !== null) {
          results.push(Array.from(strItems.slice(lastIdx, m.index)).map((ch) => isStringObj ? { type: "string", value: ch } : ch));
          lastIdx = re.lastIndex;
          if (m[0].length === 0)
            re.lastIndex++;
        }
        results.push(Array.from(strItems.slice(lastIdx)).map((ch) => isStringObj ? { type: "string", value: ch } : ch));
      } else if (isFunc) {
        let currentPiece = [];
        let inSeparator = false;
        for (let i = 0;i < items.length; i++) {
          const item = items[i];
          const loc = new Integer(BigInt(i + 1));
          const isSep = isTruthy2(invokeTraversalCallback(sepVal, [item, loc, collection], context, evaluate));
          if (isSep) {
            if (!inSeparator) {
              results.push(currentPiece);
              currentPiece = [];
              inSeparator = true;
            }
          } else {
            if (inSeparator) {
              inSeparator = false;
            }
            currentPiece.push(item);
          }
        }
        results.push(currentPiece);
      } else {
        if (isString) {
          const sepStrVal = sepVal && sepVal.type === "string" ? sepVal.value : String(typeof sepVal === "object" && sepVal?.constructor?.name === "Integer" ? sepVal.value : sepVal);
          const sepItems = Array.from(sepStrVal);
          let currentPiece = [];
          for (let i = 0;i < items.length; ) {
            let match = true;
            if (sepItems.length > 0 && i + sepItems.length <= items.length) {
              for (let j = 0;j < sepItems.length; j++) {
                const val = items[i + j] && items[i + j].type === "string" ? items[i + j].value : items[i + j];
                if (val !== sepItems[j]) {
                  match = false;
                  break;
                }
              }
            } else {
              match = false;
            }
            if (match && sepItems.length > 0) {
              results.push(currentPiece);
              currentPiece = [];
              i += sepItems.length;
            } else if (sepItems.length === 0) {
              results.push(currentPiece);
              currentPiece = [];
              i++;
            } else {
              currentPiece.push(items[i]);
              i++;
            }
          }
          if (sepItems.length > 0 || currentPiece.length > 0 || items.length === 0) {
            results.push(currentPiece);
          }
        } else {
          let currentPiece = [];
          for (let i = 0;i < items.length; i++) {
            let match = false;
            const a = items[i];
            const b = sepVal;
            if (typeof a === typeof b && a === b)
              match = true;
            else if (a && b && a.constructor && b.constructor && a.constructor.name === b.constructor.name && ["Integer", "Rational"].includes(a.constructor.name) && a.value === b.value && a.numerator === b.numerator)
              match = true;
            else if (a && a.type === "string" && typeof b === "string" && a.value === b)
              match = true;
            else if (a && b && a.type === "string" && b.type === "string" && a.value === b.value)
              match = true;
            else if (a && b && a.constructor && b.constructor && a.constructor.name === "Integer" && b.constructor.name === "Integer" && a.value === b.value)
              match = true;
            if (match) {
              results.push(currentPiece);
              currentPiece = [];
            } else {
              currentPiece.push(a);
            }
          }
          results.push(currentPiece);
        }
      }
      if (isString) {
        return {
          type: "sequence",
          values: results.map((arr) => {
            const extracted = arr && Array.isArray(arr) ? arr.map((r) => r && r.type === "string" ? r.value : r) : arr;
            const s = typeof extracted === "string" ? extracted : extracted.map((r) => r && r.type === "string" ? r.value : r).join("");
            return isStringObj ? { type: "string", value: s } : s;
          })
        };
      } else {
        return {
          type: "sequence",
          values: results.map((arr) => {
            if (collection.type === "tuple")
              return { type: "tuple", values: arr };
            return { type: collection.type || "sequence", values: arr };
          })
        };
      }
    },
    doc: "Split a collection by a delimiter or predicate"
  },
  PCHUNK: {
    lazy: true,
    impl(args, context, evaluate) {
      const collection = evaluate(args[0]);
      const boundNode = args[1];
      if (collection === null || collection === undefined) {
        return null;
      }
      if (collection.type === "map") {
        throw new Error("PCHUNK does not support maps — maps have no defined order");
      }
      const isStringObj = collection && collection.type === "string";
      const isString = typeof collection === "string" || isStringObj;
      let items = null;
      if (isString) {
        items = Array.from(isStringObj ? collection.value : collection).map((ch) => isStringObj ? { type: "string", value: ch } : ch);
      } else if (collection && Array.isArray(collection.values)) {
        items = collection.values;
      } else {
        return null;
      }
      const boundVal = evaluate(boundNode);
      const results = [];
      const isFunc = boundVal && (boundVal.type === "function" || boundVal.type === "lambda") || typeof boundVal === "function";
      if (isFunc) {
        let currentChunk = [];
        for (let i = 0;i < items.length; i++) {
          const loc = new Integer(BigInt(i + 1));
          const isBound = isTruthy2(invokeTraversalCallback(boundVal, [items[i], loc, collection], context, evaluate));
          currentChunk.push(items[i]);
          if (isBound) {
            results.push(currentChunk);
            currentChunk = [];
          }
        }
        if (currentChunk.length > 0) {
          results.push(currentChunk);
        }
      } else {
        const nRaw = boundVal && boundVal.constructor && boundVal.constructor.name === "Integer" ? Number(boundVal.value) : Number(boundVal);
        if (isNaN(nRaw) || nRaw <= 0) {
          throw new Error("PCHUNK requires a positive integer size or a predicate function");
        }
        const n = Math.floor(nRaw);
        let currentChunk = [];
        for (let i = 0;i < items.length; i++) {
          currentChunk.push(items[i]);
          if (currentChunk.length === n) {
            results.push(currentChunk);
            currentChunk = [];
          }
        }
        if (currentChunk.length > 0) {
          results.push(currentChunk);
        }
      }
      if (isString) {
        return {
          type: "sequence",
          values: results.map((arr) => {
            const s = arr.map((x) => typeof x === "string" ? x : x && x.type === "string" ? x.value : x).join("");
            return isStringObj ? { type: "string", value: s } : s;
          })
        };
      } else {
        return {
          type: "sequence",
          values: results.map((arr) => {
            if (collection.type === "tuple")
              return { type: "tuple", values: arr };
            return { type: collection.type || "sequence", values: arr };
          })
        };
      }
    },
    doc: "Chunk a collection into subarrays by size or boundary predicate"
  },
  PMAP: {
    lazy: true,
    impl(args, context, evaluate) {
      const collection = evaluate(args[0]);
      const funcNode = args[1];
      if (collection === null || collection === undefined)
        return null;
      const func = evaluate(funcNode);
      if (isTensor(collection)) {
        const results2 = [];
        forEachTensorCell(collection, (item, tuple) => {
          results2.push(invokeTraversalCallback(func, [item, tensorIndexTuple(tuple), collection], context, evaluate));
        });
        return createTensor(collection.shape, results2);
      }
      if (collection.type === "map") {
        const entries = collection.entries;
        if (!(entries instanceof Map))
          throw new Error("PMAP: invalid map");
        const newEntries = new Map;
        for (const [k, v] of entries) {
          const loc = { type: "string", value: k };
          const result = invokeTraversalCallback(func, [v, loc, collection], context, evaluate);
          newEntries.set(k, result);
        }
        return { type: "map", entries: newEntries };
      }
      const isStringObj = collection && collection.type === "string";
      const isString = typeof collection === "string" || isStringObj;
      let items = null;
      if (isString) {
        items = Array.from(isStringObj ? collection.value : collection).map((ch) => isStringObj ? { type: "string", value: ch } : ch);
      } else if (collection && Array.isArray(collection.values)) {
        items = collection.values;
      } else {
        throw new Error("PMAP requires a collection");
      }
      const results = items.map((item, i) => {
        const loc = new Integer(BigInt(i + 1));
        return invokeTraversalCallback(func, [item, loc, collection], context, evaluate);
      });
      if (isString) {
        let allSingleCharStr = true;
        for (let r of results) {
          const rv = r && r.type === "string" ? r.value : r;
          if (rv === null) {
            allSingleCharStr = false;
            break;
          }
          if (typeof rv !== "string" || Array.from(rv).length !== 1) {
            allSingleCharStr = false;
            break;
          }
        }
        if (allSingleCharStr) {
          const strVal = results.map((r) => r && r.type === "string" ? r.value : r).join("");
          return isStringObj ? { type: "string", value: strVal } : strVal;
        }
      }
      return { type: collection.type && !isString ? collection.type : "sequence", values: results };
    },
    doc: "Map a function over a collection — callback receives (val, locator, src)"
  },
  PFILTER: {
    lazy: true,
    impl(args, context, evaluate) {
      const collection = evaluate(args[0]);
      const funcNode = args[1];
      if (collection === null || collection === undefined)
        return null;
      const func = evaluate(funcNode);
      if (isTensor(collection)) {
        const results2 = [];
        forEachTensorCell(collection, (item, tuple) => {
          if (isTruthy2(invokeTraversalCallback(func, [item, tensorIndexTuple(tuple), collection], context, evaluate))) {
            results2.push({
              type: "tuple",
              values: [item, tensorIndexTuple(tuple)]
            });
          }
        });
        return { type: "sequence", values: results2 };
      }
      if (collection.type === "map") {
        const entries = collection.entries;
        if (!(entries instanceof Map))
          throw new Error("PFILTER: invalid map");
        const newEntries = new Map;
        for (const [k, v] of entries) {
          const loc = { type: "string", value: k };
          if (isTruthy2(invokeTraversalCallback(func, [v, loc, collection], context, evaluate))) {
            newEntries.set(k, v);
          }
        }
        return { type: "map", entries: newEntries };
      }
      const isStringObj = collection && collection.type === "string";
      const isString = typeof collection === "string" || isStringObj;
      let items = null;
      if (isString) {
        items = Array.from(isStringObj ? collection.value : collection).map((ch) => isStringObj ? { type: "string", value: ch } : ch);
      } else if (collection && Array.isArray(collection.values)) {
        items = collection.values;
      } else {
        throw new Error("PFILTER requires a collection");
      }
      const results = items.filter((item, i) => {
        const loc = new Integer(BigInt(i + 1));
        return isTruthy2(invokeTraversalCallback(func, [item, loc, collection], context, evaluate));
      });
      if (isString) {
        const filteredStr = results.map((r) => r && r.type === "string" ? r.value : r).join("");
        return isStringObj ? { type: "string", value: filteredStr } : filteredStr;
      }
      return { type: collection.type || "sequence", values: results };
    },
    doc: "Filter a collection with a predicate — callback receives (val, locator, src)"
  },
  PREDUCE: {
    lazy: true,
    impl(args, context, evaluate) {
      const collection = evaluate(args[0]);
      const funcNode = args[1];
      const initProvided = args.length > 2;
      const explicitInit = initProvided ? evaluate(args[2]) : null;
      if (collection === null || collection === undefined)
        return null;
      const func = evaluate(funcNode);
      if (isTensor(collection)) {
        const visited = [];
        forEachTensorCell(collection, (item, tuple) => {
          visited.push([item, tensorIndexTuple(tuple)]);
        });
        if (visited.length === 0) {
          return initProvided ? explicitInit : null;
        }
        let acc2 = initProvided ? explicitInit : visited[0][0];
        const startIdx2 = initProvided ? 0 : 1;
        for (let i = startIdx2;i < visited.length; i++) {
          const [item, tuple] = visited[i];
          acc2 = invokeTraversalCallback(func, [acc2, item, tuple, collection], context, evaluate);
        }
        return acc2;
      }
      if (collection.type === "map") {
        const entries = collection.entries;
        if (!(entries instanceof Map))
          throw new Error("PREDUCE: invalid map");
        const mapEntries2 = Array.from(entries.entries());
        let acc2;
        let startIdx2;
        if (!initProvided) {
          if (mapEntries2.length === 0)
            return null;
          acc2 = mapEntries2[0][1];
          startIdx2 = 1;
        } else {
          acc2 = explicitInit;
          startIdx2 = 0;
        }
        for (let i = startIdx2;i < mapEntries2.length; i++) {
          const [k, v] = mapEntries2[i];
          const loc = { type: "string", value: k };
          acc2 = invokeTraversalCallback(func, [acc2, v, loc, collection], context, evaluate);
        }
        return acc2;
      }
      const isStringObj = collection && collection.type === "string";
      const isString = typeof collection === "string" || isStringObj;
      let items = null;
      if (isString) {
        items = Array.from(isStringObj ? collection.value : collection).map((ch) => isStringObj ? { type: "string", value: ch } : ch);
      } else if (collection && Array.isArray(collection.values)) {
        items = collection.values;
      } else {
        throw new Error("PREDUCE requires a collection");
      }
      let acc = initProvided ? explicitInit : items[0];
      const startIdx = initProvided ? 0 : 1;
      for (let i = startIdx;i < items.length; i++) {
        const loc = new Integer(BigInt(i + 1));
        acc = invokeTraversalCallback(func, [acc, items[i], loc, collection], context, evaluate);
      }
      return acc;
    },
    doc: "Reduce a collection with an accumulator function — callback receives (acc, val, locator, src)"
  },
  PREVERSE: {
    impl(args) {
      const collection = args[0];
      if (collection === null || collection === undefined)
        return null;
      const isStringObj = collection && collection.type === "string";
      const isString = typeof collection === "string" || isStringObj;
      let items = null;
      if (isString) {
        items = Array.from(isStringObj ? collection.value : collection).map((ch) => isStringObj ? { type: "string", value: ch } : ch);
        const reversed = items.reverse().map((r) => r && r.type === "string" ? r.value : r).join("");
        return isStringObj ? { type: "string", value: reversed } : reversed;
      } else if (collection && Array.isArray(collection.values)) {
        return { type: collection.type || "sequence", values: [...collection.values].reverse() };
      } else {
        throw new Error("PREVERSE requires a collection");
      }
    },
    pure: true,
    doc: "Reverse a collection (returns new copy)"
  },
  PSORT: {
    lazy: true,
    impl(args, context, evaluate) {
      const collection = evaluate(args[0]);
      const funcNode = args[1];
      if (collection === null || collection === undefined)
        return null;
      if (collection.type === "map") {
        throw new Error("PSORT does not support maps — maps have no defined order");
      }
      const isStringObj = collection && collection.type === "string";
      const isString = typeof collection === "string" || isStringObj;
      let items = null;
      if (isString) {
        items = Array.from(isStringObj ? collection.value : collection).map((ch) => isStringObj ? { type: "string", value: ch } : ch);
      } else if (collection && Array.isArray(collection.values)) {
        items = collection.values;
      } else {
        throw new Error("PSORT requires a collection");
      }
      const func = evaluate(funcNode);
      const sorted = [...items].sort((a, b) => {
        if (func && func.type === "partial") {
          const result = callWithConcreteArgs(func, [a, b], context, evaluate);
          if (result && result.constructor && result.constructor.name === "Integer")
            return Number(result.value);
          if (typeof result === "number")
            return result;
          return 0;
        }
        if (func && func.type === "sysref") {
          const result = evaluate({ fn: func.name, args: [a, b] });
          if (result && result.constructor && result.constructor.name === "Integer")
            return Number(result.value);
          if (typeof result === "number")
            return result;
          return 0;
        }
        if (func && (func.type === "function" || func.type === "lambda")) {
          const scope = new Map;
          if (func.params?.positional?.length >= 2) {
            scope.set(func.params.positional[0].name, a);
            scope.set(func.params.positional[1].name, b);
          }
          context.push(scope);
          try {
            const result = evaluate(func.body);
            if (result && result.constructor && result.constructor.name === "Integer")
              return Number(result.value);
            if (typeof result === "number")
              return result;
            return 0;
          } finally {
            context.pop();
          }
        }
        if (typeof func === "function") {
          const result = func(a, b);
          return typeof result === "number" ? result : 0;
        }
        if (isString) {
          const valA = a && a.type === "string" ? a.value : a;
          const valB = b && b.type === "string" ? b.value : b;
          if (valA < valB)
            return -1;
          if (valA > valB)
            return 1;
          return 0;
        }
        const na = a && a.constructor && a.constructor.name === "Integer" ? Number(a.value) : Number(a);
        const nb = b && b.constructor && b.constructor.name === "Integer" ? Number(b.value) : Number(b);
        return na - nb;
      });
      if (isString) {
        const joined = sorted.map((r) => r && r.type === "string" ? r.value : r).join("");
        return isStringObj ? { type: "string", value: joined } : joined;
      }
      return { type: collection.type || "sequence", values: sorted };
    },
    doc: "Sort a collection with comparator function (returns new copy)"
  },
  PALL: {
    lazy: true,
    impl(args, context, evaluate) {
      const collection = evaluate(args[0]);
      const funcNode = args[1];
      if (collection === null || collection === undefined)
        return null;
      const func = evaluate(funcNode);
      if (isTensor(collection)) {
        let sawAny = false;
        let lastItem2 = null;
        let failed = false;
        forEachTensorCell(collection, (item, tuple) => {
          if (!sawAny) {
            sawAny = true;
          }
          if (failed || !isTruthy2(invokeTraversalCallback(func, [item, tensorIndexTuple(tuple), collection], context, evaluate))) {
            failed = true;
            return;
          }
          lastItem2 = item;
        });
        if (!sawAny)
          return null;
        if (failed)
          return null;
        return lastItem2;
      }
      if (collection.type === "map") {
        const entries = collection.entries;
        if (!(entries instanceof Map))
          throw new Error("PALL: invalid map");
        if (entries.size === 0)
          return null;
        let lastVal = null;
        for (const [k, v] of entries) {
          const loc = { type: "string", value: k };
          if (!isTruthy2(invokeTraversalCallback(func, [v, loc, collection], context, evaluate))) {
            return null;
          }
          lastVal = v;
        }
        return lastVal;
      }
      const isStringObj = collection && collection.type === "string";
      const isString = typeof collection === "string" || isStringObj;
      let items = null;
      if (isString) {
        items = Array.from(isStringObj ? collection.value : collection).map((ch) => isStringObj ? { type: "string", value: ch } : ch);
      } else if (collection && Array.isArray(collection.values)) {
        items = collection.values;
      } else {
        throw new Error("PALL requires a collection");
      }
      if (items.length === 0) {
        return null;
      }
      let lastItem = null;
      for (let i = 0;i < items.length; i++) {
        const item = items[i];
        const loc = new Integer(BigInt(i + 1));
        if (!isTruthy2(invokeTraversalCallback(func, [item, loc, collection], context, evaluate))) {
          return null;
        }
        lastItem = item;
      }
      return lastItem;
    },
    doc: "Every: returns last element if predicate is truthy for ALL elements, null on first failure — callback receives (val, locator, src)"
  },
  PANY: {
    lazy: true,
    impl(args, context, evaluate) {
      const collection = evaluate(args[0]);
      const funcNode = args[1];
      if (collection === null || collection === undefined)
        return null;
      const func = evaluate(funcNode);
      if (isTensor(collection)) {
        let found = null;
        let foundAny = false;
        forEachTensorCell(collection, (item, tuple) => {
          if (!foundAny && isTruthy2(invokeTraversalCallback(func, [item, tensorIndexTuple(tuple), collection], context, evaluate))) {
            found = item;
            foundAny = true;
          }
        });
        return foundAny ? found : null;
      }
      if (collection.type === "map") {
        const entries = collection.entries;
        if (!(entries instanceof Map))
          throw new Error("PANY: invalid map");
        for (const [k, v] of entries) {
          const loc = { type: "string", value: k };
          if (isTruthy2(invokeTraversalCallback(func, [v, loc, collection], context, evaluate))) {
            return v;
          }
        }
        return null;
      }
      const isStringObj = collection && collection.type === "string";
      const isString = typeof collection === "string" || isStringObj;
      let items = null;
      if (isString) {
        items = Array.from(isStringObj ? collection.value : collection).map((ch) => isStringObj ? { type: "string", value: ch } : ch);
      } else if (collection && Array.isArray(collection.values)) {
        items = collection.values;
      } else {
        throw new Error("PANY requires a collection");
      }
      for (let i = 0;i < items.length; i++) {
        const item = items[i];
        const loc = new Integer(BigInt(i + 1));
        if (isTruthy2(invokeTraversalCallback(func, [item, loc, collection], context, evaluate))) {
          return item;
        }
      }
      return null;
    },
    doc: "Any: returns first item that passed predicate, null if none pass — callback receives (val, locator, src)"
  },
  KWARG: {
    impl(args) {
      return { type: "kwarg", name: args[0], value: args[1] };
    },
    pure: true,
    doc: "Keyword argument wrapper"
  }
};

// ../rix/src/runtime/type-system.js
function int3(value) {
  return new Integer(BigInt(value));
}
function stringObj(value) {
  return { type: "string", value };
}
function colonName(value) {
  if (value === null || value === undefined)
    return null;
  if (typeof value === "string")
    return value;
  if (value?.type === "string")
    return value.value;
  return String(value);
}
function makeProto(entries = []) {
  const entryMap = new Map(entries);
  for (const [key, value] of entries) {
    if (typeof key === "string") {
      entryMap.set(key.toUpperCase(), value);
    }
  }
  return {
    type: "map",
    entries: entryMap,
    _ext: new Map([["frozen", int3(1)], ["immutable", int3(1)], ...entryMap.entries()])
  };
}
function valueMethod(name, fn) {
  return {
    type: "method_builtin",
    name,
    impl(args, context, evaluate, callWithConcreteArgs2) {
      const receiver = args[0]?.type === "map" && args.length > 1 ? args[1] : args[0];
      const rest = args[0]?.type === "map" && args.length > 1 ? args.slice(2) : args.slice(1);
      return fn(receiver, rest, context, evaluate, callWithConcreteArgs2);
    }
  };
}
function immutableCloneSpec(spec) {
  const clone = { ...spec };
  if (Array.isArray(spec.defaultTraits))
    clone.defaultTraits = Object.freeze([...spec.defaultTraits]);
  if (Array.isArray(spec.implies))
    clone.implies = Object.freeze([...spec.implies]);
  if (Array.isArray(spec.aliases))
    clone.aliases = Object.freeze([...spec.aliases]);
  if (spec.convertFrom instanceof Map)
    clone.convertFrom = new Map(spec.convertFrom);
  else if (spec.convertFrom && typeof spec.convertFrom === "object")
    clone.convertFrom = new Map(Object.entries(spec.convertFrom));
  else
    clone.convertFrom = new Map;
  if (spec.installs instanceof Map)
    clone.installs = new Map(spec.installs);
  else if (spec.installs && typeof spec.installs === "object")
    clone.installs = new Map(Object.entries(spec.installs));
  else
    clone.installs = new Map;
  return Object.freeze(clone);
}
function isCallable(value) {
  return value && typeof value === "object" && (value.type === "function" || value.type === "lambda" || value.type === "sysref" || value.type === "partial");
}
function invokeMaybeCallable(fn, args, context, evaluate) {
  if (!fn)
    return null;
  if (typeof fn === "function")
    return fn(...args);
  if (isCallable(fn)) {
    if (!fn.__rixCapturedEnv || !context?.setEnv) {
      return callWithConcreteArgs(fn, args, context, evaluate);
    }
    const restored = new Map;
    for (const [key, value] of fn.__rixCapturedEnv) {
      restored.set(key, {
        has: context.env?.has(key) === true,
        value: context.getEnv(key, undefined)
      });
      context.setEnv(key, value);
    }
    try {
      return callWithConcreteArgs(fn, args, context, evaluate);
    } finally {
      for (const [key, entry] of restored) {
        if (entry.has)
          context.setEnv(key, entry.value);
        else
          context.env?.delete(key);
      }
    }
  }
  throw new Error("Type/trait registry hook must be callable");
}
function truthy2(value) {
  return value !== null && value !== undefined;
}

class ImmutableSemanticRegistry {
  constructor(kind) {
    this.kind = kind;
    this.entries = new Map;
    this.aliases = new Map;
  }
  register(spec) {
    const name = colonName(spec?.name);
    if (!name)
      throw new Error(`${this.kind} registration requires a name`);
    if (this.entries.has(name) || this.aliases.has(name)) {
      throw new Error(`Duplicate ${this.kind} registration: ${name}`);
    }
    const entry = immutableCloneSpec({ ...spec, name });
    this.entries.set(name, entry);
    for (const alias of entry.aliases || []) {
      const aliasName = colonName(alias);
      if (!aliasName)
        continue;
      if (this.entries.has(aliasName) || this.aliases.has(aliasName)) {
        throw new Error(`Duplicate ${this.kind} alias: ${aliasName}`);
      }
      this.aliases.set(aliasName, name);
    }
    return entry;
  }
  get(name) {
    const key = colonName(name);
    if (!key)
      return null;
    return this.entries.get(key) ?? this.entries.get(this.aliases.get(key)) ?? null;
  }
  has(name) {
    return Boolean(this.get(name));
  }
  list() {
    return Array.from(this.entries.keys());
  }
}
var traitRegistry = new ImmutableSemanticRegistry("trait");
var typeRegistry = new ImmutableSemanticRegistry("type");
function registerTrait(spec) {
  return traitRegistry.register(spec);
}
function registerType(spec) {
  return typeRegistry.register(spec);
}
function resolveTraitNames(names) {
  const result = [];
  const seen = new Set;
  const visiting = new Set;
  function visit(name) {
    const traitName = colonName(name);
    if (!traitName || seen.has(traitName))
      return;
    if (visiting.has(traitName))
      throw new Error(`Cyclic trait implication involving ${traitName}`);
    const entry = traitRegistry.get(traitName);
    if (!entry)
      throw new Error(`Unknown semantic trait: ${traitName}`);
    visiting.add(traitName);
    for (const implied of entry.implies || []) {
      visit(implied);
    }
    visiting.delete(traitName);
    seen.add(traitName);
    result.push(traitName);
  }
  for (const name of names || [])
    visit(name);
  return result;
}
function runtimeTypeName(value) {
  if (value === null)
    return "null";
  if (value instanceof Integer)
    return "Integer";
  if (value instanceof Rational)
    return "Rational";
  if (value instanceof RationalInterval)
    return "RationalInterval";
  if (isTensor(value))
    return "tensor";
  if (value?.type === "sequence")
    return "array";
  if (value?.type)
    return value.type;
  if (value?.constructor?.name)
    return value.constructor.name;
  return typeof value;
}
function normalizeResult(entry, value) {
  return entry.normalize ? entry.normalize(value) : value;
}
function convertToRegisteredType(value, requestedTypeName, context = null, evaluate = null) {
  const typeName = colonName(requestedTypeName);
  const entry = typeRegistry.get(typeName);
  if (!entry)
    throw new Error(`Unknown semantic type: ${typeName}`);
  const semanticSourceType = value?._ext?.get("__type")?.value ?? null;
  const runtimeSourceType = value?._ext?.get("_type")?.value ?? runtimeTypeName(value);
  const sourceType = semanticSourceType ?? runtimeSourceType;
  let next = value;
  const converter = entry.convertFrom?.get(runtimeSourceType) ?? entry.convertFrom?.get(String(runtimeSourceType).toLowerCase()) ?? entry.convertFrom?.get(sourceType) ?? entry.convertFrom?.get(String(sourceType).toLowerCase());
  if (converter) {
    next = invokeMaybeCallable(converter, [value], context, evaluate);
  } else if (entry.name === sourceType || typeName === sourceType || entry.nativeType === sourceType) {
    next = value;
  } else if (entry.convert) {
    next = invokeMaybeCallable(entry.convert, [value, stringObj(sourceType)], context, evaluate);
  }
  if (next === null || next === undefined) {
    return null;
  }
  next = entry.normalize ? invokeMaybeCallable(entry.normalize, [next], context, evaluate) : normalizeResult(entry, next);
  if (next === null || next === undefined) {
    return null;
  }
  if (entry.validate && !truthy2(invokeMaybeCallable(entry.validate, [next], context, evaluate))) {
    return null;
  }
  return { value: next, entry, requestedTypeName: typeName };
}
function isStringObject(value) {
  return value && typeof value === "object" && value.type === "string";
}
function rationalFromString(value) {
  if (!isStringObject(value))
    return null;
  const text = value.value.trim();
  const ratio = text.match(/^(-?\d+)\/(\d+)$/);
  if (ratio)
    return new Rational(BigInt(ratio[1]), BigInt(ratio[2]));
  if (/^-?\d+$/.test(text))
    return new Rational(BigInt(text), 1n);
  return null;
}
function rationalParts(value) {
  if (value instanceof Integer)
    return { numerator: value.value, denominator: 1n };
  if (value instanceof Rational)
    return { numerator: value.numerator, denominator: value.denominator };
  return null;
}
function boolResult(value) {
  return value ? new Integer(1n) : null;
}
function compareNumeric(a, b) {
  if (a && b && typeof a.subtract === "function" && typeof b.subtract === "function") {
    const diff = a.subtract(b);
    if (typeof diff.sign === "function")
      return Number(diff.sign().value ?? diff.sign());
    if (typeof diff.numerator === "bigint") {
      if (diff.numerator < 0n)
        return -1;
      if (diff.numerator > 0n)
        return 1;
      return 0;
    }
    if (typeof diff.value === "bigint") {
      if (diff.value < 0n)
        return -1;
      if (diff.value > 0n)
        return 1;
      return 0;
    }
  }
  if (a < b)
    return -1;
  if (a > b)
    return 1;
  return 0;
}
var TYPE_INSTALL_FUNCTIONS = [
  "ADD",
  "SUB",
  "MUL",
  "DIV",
  "INTDIV",
  "MOD",
  "POW",
  "POWPROD",
  "NEG",
  "EQ",
  "LT",
  "GT",
  "LTE",
  "GTE",
  "ABS",
  "SQRT",
  "SIN",
  "COS",
  "TAN",
  "ASIN",
  "ACOS",
  "ATAN",
  "ATAN2",
  "LOG",
  "LN",
  "LOG10",
  "EXP"
];
var builtinsRegistered = false;
function registerBuiltinSemanticTypes() {
  if (builtinsRegistered)
    return;
  const traits = [
    ["number"],
    ["ring", ["number"]],
    ["field", ["ring", "number"]],
    ["ordered", ["number"]],
    ["rational", ["field", "ordered"]],
    ["integer", ["rational"]],
    ["indexable"],
    ["shapeAware"],
    ["collection"],
    ["sequence", ["collection", "indexable"]],
    ["maplike", ["collection", "indexable"]],
    ["tensor", ["indexable", "shapeAware", "collection"]],
    ["meters"],
    ["cartesian"],
    ["square"],
    ["positive"],
    ["verify"]
  ];
  for (const [name, implies = []] of traits) {
    registerTrait({
      name,
      implies,
      proto: () => makeProto([
        ["Describe", valueMethod("Describe", () => stringObj(`trait:${name}`))],
        ["KIND", valueMethod("KIND", () => stringObj(`trait:${name}`))]
      ]),
      description: `${name} semantic trait`
    });
  }
  const nativeOnly = [
    ["String", "string", [], (value) => isStringObject(value) ? value : null],
    ["Array", "array", ["sequence"], (value) => value?.type === "sequence" ? value : null],
    ["Tuple", "tuple", ["sequence"], (value) => value?.type === "tuple" ? value : null],
    ["Map", "map", ["maplike"], (value) => value?.type === "map" ? value : null],
    ["Set", "set", ["collection"], (value) => value?.type === "set" ? value : null],
    ["Function", "function", [], (value) => value?.type === "function" || value?.type === "lambda" ? value : null],
    ["Multifunction", "multifunction", [], (value) => value?._ext?.get("_type")?.value === "multifunction" ? value : null],
    ["Null", "null", [], (value) => value === null ? value : null],
    ["Hole", "hole", [], () => null]
  ];
  for (const [name, nativeType, defaultTraits, convert] of nativeOnly) {
    registerType({
      name,
      aliases: [nativeType],
      nativeType,
      defaultTraits,
      convert,
      proto: () => makeProto([["Describe", valueMethod("Describe", () => stringObj(`type:${name}`))]])
    });
  }
  registerType({
    name: "Rational",
    aliases: ["rational"],
    nativeType: "rational",
    defaultTraits: ["rational", "number", "ordered", "field"],
    convertFrom: {
      Integer: (value) => new Rational(value.value, 1n),
      integer: (value) => new Rational(value.value, 1n),
      Rational: (value) => value,
      rational: (value) => value,
      string: rationalFromString
    },
    convert(value) {
      if (value instanceof Integer)
        return new Rational(value.value, 1n);
      if (value instanceof Rational)
        return value;
      if (value instanceof RationalInterval && value.low.equals(value.high))
        return value.low;
      return rationalFromString(value);
    },
    normalize: (value) => value,
    validate: (value) => value instanceof Rational,
    export(value) {
      const parts = rationalParts(value);
      return {
        type: "map",
        entries: new Map([
          ["type", stringObj("Rational")],
          ["data", { type: "map", entries: new Map([
            ["num", new Integer(parts.numerator)],
            ["den", new Integer(parts.denominator)]
          ]) }],
          ["cache", null],
          ["version", new Integer(1n)]
        ])
      };
    },
    import(value) {
      const data = value?.entries?.get("data");
      const num = data?.entries?.get("num");
      const den = data?.entries?.get("den");
      return new Rational(num.value, den.value);
    },
    proto: () => makeProto([
      ["Num", valueMethod("Num", (self) => new Integer(rationalParts(self).numerator))],
      ["Den", valueMethod("Den", (self) => new Integer(rationalParts(self).denominator))],
      ["ToString", valueMethod("ToString", (self) => stringObj(self.toString()))],
      ["Describe", valueMethod("Describe", () => stringObj("type:Rational"))],
      ["KIND", valueMethod("KIND", () => stringObj("type:Rational"))]
    ]),
    installs: {
      ADD: [{
        name: "RatRat",
        prep: (args) => args.length === 2 && rationalParts(args[0]) && rationalParts(args[1]),
        impl: ([a, b]) => a.add(b)
      }],
      SUB: [{
        name: "RatRat",
        prep: (args) => args.length === 2 && rationalParts(args[0]) && rationalParts(args[1]),
        impl: ([a, b]) => a.subtract(b)
      }],
      MUL: [{
        name: "RatRat",
        prep: (args) => args.length === 2 && rationalParts(args[0]) && rationalParts(args[1]),
        impl: ([a, b]) => a.multiply(b)
      }],
      DIV: [{
        name: "RatRat",
        prep: (args) => args.length === 2 && rationalParts(args[0]) && rationalParts(args[1]),
        impl: ([a, b]) => a.divide(b)
      }],
      EQ: [{
        name: "RatRat",
        prep: (args) => args.length === 2 && rationalParts(args[0]) && rationalParts(args[1]),
        impl: ([a, b]) => boolResult(a.equals(b))
      }],
      LT: [{
        name: "RatRat",
        prep: (args) => args.length === 2 && rationalParts(args[0]) && rationalParts(args[1]),
        impl: ([a, b]) => boolResult(compareNumeric(a, b) < 0)
      }]
    }
  });
  registerType({
    name: "Integer",
    aliases: ["integer"],
    nativeType: "integer",
    defaultTraits: ["integer", "rational", "number", "ordered"],
    convertFrom: {
      Integer: (value) => value,
      integer: (value) => value
    },
    convert(value) {
      if (value instanceof Integer)
        return value;
      return null;
    },
    validate: (value) => value instanceof Integer,
    export(value) {
      return {
        type: "map",
        entries: new Map([
          ["type", stringObj("Integer")],
          ["data", { type: "map", entries: new Map([["value", new Integer(value.value)]]) }],
          ["cache", null],
          ["version", new Integer(1n)]
        ])
      };
    },
    import(value) {
      return new Integer(value?.entries?.get("data")?.entries?.get("value")?.value ?? 0n);
    },
    proto: () => makeProto([
      ["ToString", valueMethod("ToString", (self) => stringObj(self.toString()))],
      ["Describe", valueMethod("Describe", () => stringObj("type:Integer"))]
    ]),
    installs: {}
  });
  registerType({
    name: "RationalInterval",
    aliases: ["Interval", "interval"],
    nativeType: "interval",
    defaultTraits: ["ordered"],
    convertFrom: {
      RationalInterval: (value) => value,
      interval: (value) => value
    },
    convert(value) {
      return value instanceof RationalInterval ? value : null;
    },
    validate: (value) => value instanceof RationalInterval,
    export(value) {
      return {
        type: "map",
        entries: new Map([
          ["type", stringObj("RationalInterval")],
          ["data", { type: "map", entries: new Map([
            ["low", value.low],
            ["high", value.high]
          ]) }],
          ["cache", null],
          ["version", new Integer(1n)]
        ])
      };
    },
    import(value) {
      const data = value?.entries?.get("data");
      return new RationalInterval(data?.entries?.get("low"), data?.entries?.get("high"));
    },
    proto: () => makeProto([
      ["Low", valueMethod("Low", (self) => self.low)],
      ["High", valueMethod("High", (self) => self.high)],
      ["ToString", valueMethod("ToString", (self) => stringObj(self.toString()))],
      ["Describe", valueMethod("Describe", () => stringObj("type:RationalInterval"))]
    ]),
    installs: {}
  });
  registerType({
    name: "Tensor",
    aliases: ["tensor"],
    nativeType: "tensor",
    defaultTraits: ["tensor", "indexable", "shapeAware", "collection"],
    convertFrom: {
      tensor: (value) => value,
      array: (value) => createTensor([value.values.length], value.values),
      tuple: (value) => createTensor([value.values.length], value.values)
    },
    convert(value) {
      if (isTensor(value))
        return value;
      if (value?.type === "sequence" || value?.type === "tuple")
        return createTensor([value.values.length], value.values);
      return null;
    },
    validate: isTensor,
    export(value) {
      return {
        type: "map",
        entries: new Map([
          ["type", stringObj("Tensor")],
          ["data", { type: "map", entries: new Map([
            ["shape", { type: "sequence", values: value.shape.map((n) => new Integer(BigInt(n))) }],
            ["elems", { type: "sequence", values: [...value.data] }]
          ]) }],
          ["cache", null],
          ["version", new Integer(1n)]
        ])
      };
    },
    import(value) {
      const data = value?.entries?.get("data");
      const shape = data?.entries?.get("shape")?.values.map((n) => Number(n.value)) || [];
      const elems = data?.entries?.get("elems")?.values || [];
      return createTensor(shape, elems);
    },
    proto: () => makeProto([
      ["Shape", valueMethod("Shape", (self) => ({ type: "sequence", values: self.shape.map((n) => new Integer(BigInt(n))) }))],
      ["Rank", valueMethod("Rank", (self) => new Integer(BigInt(self.shape.length)))],
      ["Flatten", valueMethod("Flatten", (self) => ({ type: "sequence", values: [...self.data] }))],
      ["Describe", valueMethod("Describe", () => stringObj("type:Tensor"))]
    ]),
    installs: {}
  });
  registerType({
    name: "Length",
    nativeType: "Length",
    defaultTraits: [],
    convert: (value) => value,
    proto: () => makeProto([
      ["Describe", valueMethod("Describe", () => stringObj("type:length"))],
      ["KIND", valueMethod("KIND", () => stringObj("type:length"))]
    ])
  });
  registerType({ name: "Point", nativeType: "Point", defaultTraits: [], convert: (value) => value, proto: () => makeProto([["Describe", valueMethod("Describe", () => stringObj("type:point"))]]) });
  registerType({ name: "Matrix", nativeType: "Matrix", parent: "Tensor", defaultTraits: ["tensor"], convert: (value) => value, proto: () => makeProto([["Describe", valueMethod("Describe", () => stringObj("type:matrix"))]]) });
  registerType({ name: "Vector", nativeType: "Vector", defaultTraits: [], convert: (value) => value, proto: () => makeProto([["Describe", valueMethod("Describe", () => stringObj("type:vector"))], ["KIND", valueMethod("KIND", () => stringObj("type:vector"))]]) });
  builtinsRegistered = true;
}
function exportByRegisteredTypeRuntime(value, context = null, evaluate = null) {
  const typeName = value?._ext?.get("__type")?.value ?? null;
  const entry = typeRegistry.get(typeName) ?? typeRegistry.get(runtimeTypeName(value));
  if (!entry?.export)
    throw new Error(`No type export registered for ${typeName || runtimeTypeName(value)}`);
  return invokeMaybeCallable(entry.export, [value], context, evaluate);
}
function finalizeImportedRegisteredValue(imported, typeName, entry) {
  if (imported && typeof imported === "object") {
    if (!(imported._ext instanceof Map))
      imported._ext = new Map;
    imported._ext.set("__type", stringObj(typeName));
    const traits = resolveTraitNames(entry.defaultTraits || []);
    if (traits.length > 0) {
      imported._ext.set("__traits", {
        type: "set",
        values: traits.map(stringObj),
        _ext: new Map([["order", { type: "sequence", values: traits.map(stringObj) }]])
      });
    }
    imported._ext.set("__proto", makeProto([
      ["type", entry.proto?.(imported) ?? makeProto()],
      ["traits", makeProto()]
    ]));
    imported._ext.set("_type", stringObj(runtimeTypeName(imported)));
  }
  return imported;
}
function importByRegisteredTypeRuntime(value, context = null, evaluate = null) {
  if (!value || value.type !== "map" || !(value.entries instanceof Map)) {
    throw new Error("TypeImport expects a tagged map export");
  }
  const typeName = value.entries.get("type")?.value;
  if (!typeName)
    throw new Error("TypeImport export map requires a type tag");
  const entry = typeRegistry.get(typeName);
  if (!entry?.import)
    throw new Error(`No type import registered for ${typeName}`);
  return finalizeImportedRegisteredValue(invokeMaybeCallable(entry.import, [value], context, evaluate), typeName, entry);
}
function installRegisteredTypes(registry, typeNames = ["Integer", "Rational", "RationalInterval", "Tensor"]) {
  let order = 0;
  for (const typeName of typeNames) {
    const entry = typeRegistry.get(typeName);
    if (!entry)
      throw new Error(`Unknown semantic type: ${typeName}`);
    for (const [targetFunction, variants] of entry.installs || []) {
      for (const variant of variants || []) {
        registry.installVariant(targetFunction, {
          ...variant,
          impl(args, context, evaluate) {
            const result = variant.impl(args, context, evaluate);
            if (result && typeof result === "object" && entry.nativeType && runtimeTypeName(result) === entry.nativeType) {
              return finalizeImportedRegisteredValue(result, entry.name, entry);
            }
            return result;
          },
          installedByType: entry.name,
          targetFunction,
          installOrder: order++
        });
      }
    }
  }
}
function mapGet(mapValue2, key) {
  if (mapValue2?.type !== "map" || !(mapValue2.entries instanceof Map))
    return;
  if (mapValue2.entries.has(key))
    return mapValue2.entries.get(key);
  const lowerKey = key.toLowerCase();
  for (const [entryKey, value] of mapValue2.entries) {
    if (String(entryKey).toLowerCase() === lowerKey)
      return value;
  }
  return;
}
function listNames(value) {
  if (!value)
    return [];
  if (value.type === "set" || value.type === "sequence" || value.type === "tuple") {
    return value.values.map(colonName).filter(Boolean);
  }
  if (value.type === "map" && value.entries instanceof Map) {
    return Array.from(value.entries.keys());
  }
  return [];
}
function protoFromRixMap(value, context = null) {
  if (!value || value.type !== "map" || !(value.entries instanceof Map))
    return value;
  return makeProto(Array.from(value.entries.entries()).map(([key, entry]) => [key, captureHook(entry, context)]));
}
function captureHook(value, context) {
  if (isCallable(value) && context?.getEnv) {
    const captured = new Map;
    for (const key of ["jsImportBaseDir", "scriptBaseDir"]) {
      if (context.env?.has(key))
        captured.set(key, context.getEnv(key, undefined));
    }
    Object.defineProperty(value, "__rixCapturedEnv", {
      value: captured,
      configurable: true
    });
  }
  return value;
}
function hooksFromRixMap(value, context = null) {
  if (!value || value.type !== "map" || !(value.entries instanceof Map))
    return {};
  return Object.fromEntries(Array.from(value.entries.entries()).map(([key, entry]) => [key, captureHook(entry, context)]));
}
function isRixList(value) {
  return value?.type === "sequence" || value?.type === "tuple" || value?.type === "set";
}
function callableVariantHook(fn, mode) {
  if (!fn)
    return mode === "prep" ? null : () => null;
  return (args, context, evaluate) => invokeMaybeCallable(fn, args, context, evaluate);
}
function variantsFromRixList(value, context = null) {
  if (!value)
    return [];
  const items = isRixList(value) ? value.values : [value];
  return items.map((item, index) => {
    if (!item || item.type !== "map" || !(item.entries instanceof Map)) {
      throw new Error("Type install variants must be map specs");
    }
    const name = colonName(mapGet(item, "name")) || `Variant${index + 1}`;
    return {
      name,
      prep: callableVariantHook(captureHook(mapGet(item, "prep"), context), "prep"),
      impl: callableVariantHook(captureHook(mapGet(item, "impl"), context), "impl")
    };
  });
}
function installsFromRixMap(value, context = null) {
  if (!value || value.type !== "map" || !(value.entries instanceof Map))
    return new Map;
  return new Map(Array.from(value.entries.entries()).map(([targetFunction, variants]) => [
    targetFunction,
    variantsFromRixList(variants, context)
  ]));
}
function registerTraitFromRixSpec(spec, context = null) {
  if (!spec || spec.type !== "map" || !(spec.entries instanceof Map)) {
    throw new Error("TraitRegister expects a map spec");
  }
  const proto = protoFromRixMap(mapGet(spec, "proto"), context) || makeProto();
  return registerTrait({
    name: colonName(mapGet(spec, "name")),
    implies: listNames(mapGet(spec, "implies")),
    verify: captureHook(mapGet(spec, "verify") || null, context),
    proto: () => proto,
    description: mapGet(spec, "description")?.value ?? ""
  });
}
function registerTypeFromRixSpec(spec, context = null) {
  if (!spec || spec.type !== "map" || !(spec.entries instanceof Map)) {
    throw new Error("TypeRegister expects a map spec");
  }
  const proto = protoFromRixMap(mapGet(spec, "proto"), context) || makeProto();
  return registerType({
    name: colonName(mapGet(spec, "name")),
    aliases: listNames(mapGet(spec, "aliases")),
    nativeType: colonName(mapGet(spec, "nativeType")),
    parent: colonName(mapGet(spec, "parent")),
    defaultTraits: listNames(mapGet(spec, "defaultTraits")),
    construct: captureHook(mapGet(spec, "construct") || null, context),
    convert: captureHook(mapGet(spec, "convert") || null, context),
    convertFrom: hooksFromRixMap(mapGet(spec, "convertFrom"), context),
    normalize: captureHook(mapGet(spec, "normalize") || null, context),
    validate: captureHook(mapGet(spec, "validate") || null, context),
    export: captureHook(mapGet(spec, "export") || null, context),
    import: captureHook(mapGet(spec, "import") || null, context),
    proto: () => proto,
    installs: installsFromRixMap(mapGet(spec, "installs"), context),
    display: captureHook(mapGet(spec, "display") || null, context)
  });
}
registerBuiltinSemanticTypes();

// ../rix/src/eval/registry.js
class Registry {
  constructor() {
    this.functions = new Map;
    this._overrides = new Map;
    this.multifunctionNames = new Set(TYPE_INSTALL_FUNCTIONS);
  }
  register(name, impl, options = {}) {
    const entry = {
      impl,
      lazy: options.lazy || false,
      pure: options.pure || false,
      doc: options.doc || ""
    };
    if (this.multifunctionNames.has(name) && !entry.lazy) {
      this.functions.set(name, this._createSystemMultifunction(name, entry));
      return;
    }
    this.functions.set(name, entry);
  }
  _createSystemMultifunction(name, fallback) {
    return {
      ...fallback,
      systemMultifunction: true,
      variants: [{
        name: "NativeFallback",
        impl: fallback.impl,
        prep: null,
        nativeFallback: true,
        targetFunction: name,
        installOrder: Number.POSITIVE_INFINITY
      }],
      impl: (args, context, evaluate) => this._callSystemMultifunction(name, args, context, evaluate)
    };
  }
  _callSystemMultifunction(name, args, context, evaluate) {
    const func = this.functions.get(name);
    if (!func?.systemMultifunction) {
      throw new Error(`${name} is not a system multifunction`);
    }
    for (const variant of func.variants) {
      if (variant.prep) {
        let ok = false;
        try {
          ok = Boolean(variant.prep(args, context, evaluate));
        } catch {
          ok = false;
        }
        if (!ok)
          continue;
      }
      const tc = context?.getEnv?.("__trace_context__");
      if (tc?.active && context?.getEnv?.("traceSystemVariants", false)) {
        tc.log.push({
          event: "system_variant_selected",
          fn: name,
          variantName: variant.name,
          installedByType: variant.installedByType ?? null,
          depth: tc.currentDepth ?? 0
        });
      }
      return variant.impl(args, context, evaluate);
    }
    return null;
  }
  installVariant(name, variant) {
    let func = this.functions.get(name);
    if (!func) {
      throw new Error(`Unknown system function for type installation: ${name}`);
    }
    if (!func.systemMultifunction) {
      func = this._createSystemMultifunction(name, func);
      this.functions.set(name, func);
    }
    if (func.variants.some((existing) => existing.name === variant.name && !existing.nativeFallback)) {
      throw new Error(`Duplicate system multifunction variant '${variant.name}' for ${name}`);
    }
    const fallbackIndex = func.variants.findIndex((existing) => existing.nativeFallback);
    const insertAt = fallbackIndex === -1 ? func.variants.length : fallbackIndex;
    func.variants.splice(insertAt, 0, {
      ...variant,
      nativeFallback: false,
      targetFunction: name
    });
  }
  registerAll(defs) {
    for (const [name, def] of Object.entries(defs)) {
      if (typeof def === "function") {
        this.register(name, def);
      } else {
        this.register(name, def.impl, def);
      }
    }
  }
  get(name) {
    return this.functions.get(name);
  }
  has(name) {
    return this.functions.has(name);
  }
  call(name, args, context, evaluate) {
    const func = this.functions.get(name);
    if (!func) {
      throw new Error(`Unknown system function: ${name}`);
    }
    return func.impl(args, context, evaluate);
  }
  override(name, newImpl) {
    const original = this.functions.get(name);
    if (original && !this._overrides.has(name)) {
      this._overrides.set(name, original);
    }
    this.functions.set(name, {
      ...original || {},
      impl: newImpl
    });
  }
  restore(name) {
    const original = this._overrides.get(name);
    if (original) {
      this.functions.set(name, original);
      this._overrides.delete(name);
    }
  }
  list() {
    return Array.from(this.functions.keys()).sort();
  }
  getAllNames() {
    return this.list();
  }
}
// rix-web-shim:fs
var unavailable = () => {
  throw new Error("File-system imports are unavailable in the browser REPL.");
};
var fs_default = { readFileSync: unavailable };

// rix-web-shim:path
var unavailable2 = () => {
  throw new Error("Local path imports are unavailable in the browser REPL.");
};
var path_default = { isAbsolute: unavailable2, resolve: unavailable2, dirname: unavailable2 };

// ../rix/src/runtime/system-context.js
class SystemContext {
  constructor(capabilities = new Map, frozen = false) {
    this._capabilities = capabilities;
    this._frozen = frozen;
  }
  _checkMutable() {
    if (this._frozen)
      throw new Error("System context is frozen and cannot be modified");
  }
  register(name, def) {
    this._checkMutable();
    this._capabilities.set(name, {
      impl: typeof def === "function" ? def : def.impl,
      lazy: def.lazy || false,
      pure: def.pure || false,
      doc: def.doc || ""
    });
  }
  registerAll(defs) {
    for (const [name, def] of Object.entries(defs)) {
      this.register(name, def);
    }
  }
  delete(name) {
    this._checkMutable();
    this._capabilities.delete(name);
  }
  freeze() {
    this._frozen = true;
    return this;
  }
  get(name) {
    return this._capabilities.get(name);
  }
  has(name) {
    return this._capabilities.has(name);
  }
  get frozen() {
    return this._frozen;
  }
  call(name, args, context, evaluate) {
    const cap = this._capabilities.get(name);
    if (!cap)
      throw new Error(`Unknown system capability: ${name}. Use .${name}() or check available capabilities.`);
    return cap.impl(args, context, evaluate);
  }
  callLazy(name, args, context, evaluate) {
    const cap = this._capabilities.get(name);
    if (!cap)
      throw new Error(`Unknown system capability: ${name}.`);
    return cap.impl(args, context, evaluate);
  }
  getAllNames() {
    return Array.from(this._capabilities.keys()).sort();
  }
  copy() {
    return new SystemContext(new Map(this._capabilities), false);
  }
  withhold(...names) {
    const caps = new Map(this._capabilities);
    for (const name of names) {
      caps.delete(name.toUpperCase ? name.toUpperCase() : name);
    }
    return new SystemContext(caps, true);
  }
  with(name, def) {
    const caps = new Map(this._capabilities);
    caps.set(name, {
      impl: typeof def === "function" ? def : def.impl,
      lazy: def.lazy || false,
      pure: def.pure || false,
      doc: def.doc || ""
    });
    return new SystemContext(caps, true);
  }
  toRixValue() {
    return { type: "system_context", context: this };
  }
}

// ../rix/src/runtime/context.js
class Context {
  constructor() {
    this.globalScope = new Map;
    this.localScopes = [];
    this.functions = new Map;
    this.env = new Map;
    this.callStack = [];
    this.currentCallables = [];
    this.sharedBodyOverrides = [];
  }
  push(initial, options = {}) {
    const rawMap = initial instanceof Map ? initial : new Map(initial ? Object.entries(initial) : []);
    const bindings = new Map;
    for (const [k, v] of rawMap) {
      bindings.set(k, v instanceof Cell ? v : new Cell(v));
    }
    const scope = {
      bindings,
      isolated: options.isolated === true,
      readThrough: options.readThrough === true,
      callableBoundary: options.callableBoundary === true
    };
    this.localScopes.push(scope);
    return bindings;
  }
  pop() {
    return this.localScopes.pop();
  }
  captureClosureScopes() {
    return this.localScopes.map((scope) => ({
      bindings: scope.bindings,
      isolated: scope.isolated === true,
      readThrough: scope.readThrough === true,
      callableBoundary: scope.callableBoundary === true
    }));
  }
  get(name) {
    const cell = this._findCell(name);
    return cell ? cell.value : undefined;
  }
  set(name, value) {
    if (this.localScopes.length > 0) {
      const scope = this.localScopes[this.localScopes.length - 1];
      const cell = scope.bindings.get(name);
      if (cell) {
        cell.value = value;
        return;
      }
      scope.bindings.set(name, new Cell(value));
    } else {
      const cell = this.globalScope.get(name);
      if (cell) {
        cell.value = value;
        return;
      }
      this.globalScope.set(name, new Cell(value));
    }
  }
  setFresh(name, value) {
    const newCell = new Cell(value);
    if (this.localScopes.length > 0) {
      this.localScopes[this.localScopes.length - 1].bindings.set(name, newCell);
    } else {
      this.globalScope.set(name, newCell);
    }
  }
  setCell(name, cell) {
    if (this.localScopes.length > 0) {
      this.localScopes[this.localScopes.length - 1].bindings.set(name, cell);
    } else {
      this.globalScope.set(name, cell);
    }
  }
  getCell(name) {
    return this._findCell(name);
  }
  getImmediateCell(name) {
    if (this.localScopes.length > 0) {
      return this.localScopes[this.localScopes.length - 1].bindings.get(name) ?? null;
    }
    return this.globalScope.get(name) ?? null;
  }
  getOuterCell(name) {
    return this._findCell(name, { skipInnermost: true, respectIsolation: false });
  }
  getAncestorCell(name) {
    if (this.localScopes.length === 0) {
      return null;
    }
    return this._findCell(name, { skipInnermost: true, respectIsolation: false });
  }
  setGlobal(name, value) {
    const cell = this.globalScope.get(name);
    if (cell) {
      cell.value = value;
    } else {
      this.globalScope.set(name, new Cell(value));
    }
  }
  getOuter(name) {
    const cell = this._findCell(name, { skipInnermost: true, respectIsolation: false });
    return cell ? cell.value : undefined;
  }
  setOuter(name, value) {
    const cell = this._findCell(name, { skipInnermost: true, respectIsolation: false });
    if (cell) {
      cell.value = value;
      return;
    }
    throw new Error(`Cannot assign to outer variable '@${name}' because it does not exist in any outer scope.`);
  }
  has(name) {
    return Boolean(this._findCell(name));
  }
  getCallable(name) {
    for (let i = this.localScopes.length - 1;i >= 0; i--) {
      const scope = this.localScopes[i];
      const cell2 = scope.bindings.get(name);
      if (cell2)
        return cell2.value;
      if (scope.callableBoundary) {
        return;
      }
      if (scope.readThrough) {
        const outerScope = this.localScopes[i - 1];
        if (outerScope) {
          const outerCell = outerScope.bindings.get(name);
          return outerCell ? outerCell.value : undefined;
        }
        const globalCell = this.globalScope.get(name);
        return globalCell ? globalCell.value : undefined;
      }
    }
    const cell = this.globalScope.get(name);
    if (cell) {
      return cell.value;
    }
    if (this.functions.has(name)) {
      return this.functions.get(name);
    }
    return;
  }
  _findCell(name, options = {}) {
    const skipInnermost = options.skipInnermost === true;
    const respectIsolation = options.respectIsolation !== false;
    const respectCallableBoundary = options.respectCallableBoundary === true;
    const startIndex = this.localScopes.length - 1 - (skipInnermost ? 1 : 0);
    for (let i = startIndex;i >= 0; i--) {
      const scope = this.localScopes[i];
      const cell = scope.bindings.get(name);
      if (cell)
        return cell;
      if (respectCallableBoundary && scope.callableBoundary) {
        return null;
      }
      if (scope.readThrough) {
        const outerScope = this.localScopes[i - 1];
        if (outerScope) {
          return outerScope.bindings.get(name) ?? null;
        }
        return this.globalScope.get(name) ?? null;
      }
      if (respectIsolation && scope.isolated) {
        return null;
      }
    }
    return this.globalScope.get(name) ?? null;
  }
  importCopy(localName, sourceName) {
    if (this.localScopes.length === 0) {
      throw new Error("Import headers require an active local scope");
    }
    const cell = this._findCell(sourceName, { skipInnermost: true, respectIsolation: false });
    if (!cell) {
      throw new Error(`Undefined outer variable for import: ${sourceName}`);
    }
    const scope = this.localScopes[this.localScopes.length - 1];
    scope.bindings.set(localName, new Cell(cell.value));
  }
  importAlias(localName, sourceName) {
    if (this.localScopes.length === 0) {
      throw new Error("Import headers require an active local scope");
    }
    const cell = this._findCell(sourceName, { skipInnermost: true, respectIsolation: false });
    if (!cell) {
      throw new Error(`Undefined outer variable for import alias: ${sourceName}`);
    }
    const scope = this.localScopes[this.localScopes.length - 1];
    scope.bindings.set(localName, cell);
  }
  defineFunction(name, funcDef) {
    this.set(name, funcDef);
    if (this.localScopes.length === 0) {
      this.functions.set(name, funcDef);
    }
  }
  getFunction(name) {
    return this.getCallable(name);
  }
  pushCall(name) {
    this.callStack.push(name);
  }
  popCall() {
    return this.callStack.pop();
  }
  pushCurrentCallable(callable) {
    const parentCallable = arguments.length > 1 ? arguments[1] : null;
    this.currentCallables.push({ callable, parentCallable });
  }
  popCurrentCallable() {
    return this.currentCallables.pop();
  }
  getCurrentCallable() {
    if (this.currentCallables.length === 0) {
      return;
    }
    return this.currentCallables[this.currentCallables.length - 1].callable;
  }
  getParentCallable() {
    if (this.currentCallables.length === 0) {
      return;
    }
    return this.currentCallables[this.currentCallables.length - 1].parentCallable;
  }
  getEnv(key, defaultValue) {
    return this.env.has(key) ? this.env.get(key) : defaultValue;
  }
  setEnv(key, value) {
    this.env.set(key, value);
  }
  child() {
    const child = new Context;
    child.globalScope = this.globalScope;
    child.functions = this.functions;
    child.env = this.env;
    child.callStack = [...this.callStack];
    child.currentCallables = [...this.currentCallables];
    child.sharedBodyOverrides = [...this.sharedBodyOverrides];
    return child;
  }
  withSharedBody(bodyNode, callback) {
    const sharedFns = new Set(["BLOCK", "LOOP", "SYSTEM"]);
    if (!bodyNode || !sharedFns.has(bodyNode.fn)) {
      return callback();
    }
    const token = { fn: bodyNode.fn, consumed: false };
    this.sharedBodyOverrides.push(token);
    try {
      return callback();
    } finally {
      if (!token.consumed) {
        this.sharedBodyOverrides.pop();
      }
    }
  }
  consumeSharedBody(fnName) {
    const token = this.sharedBodyOverrides[this.sharedBodyOverrides.length - 1];
    if (!token || token.consumed || token.fn !== fnName) {
      return false;
    }
    token.consumed = true;
    this.sharedBodyOverrides.pop();
    return true;
  }
  clear() {
    this.globalScope.clear();
    this.localScopes = [];
    this.functions.clear();
    this.callStack = [];
    this.currentCallables = [];
  }
  getAllNames() {
    const names = new Set([
      ...this.globalScope.keys(),
      ...this.functions.keys()
    ]);
    return Array.from(names).sort();
  }
}

// rix-web-shim:module
function createRequire() {
  return () => {
    throw new Error("JavaScript module imports need an explicit browser trust policy.");
  };
}

// ../rix/src/eval/functions/properties.js
function toInteger(key) {
  if (key instanceof Integer)
    return Number(key.value);
  if (key instanceof Rational) {
    if (key.denominator !== 1n) {
      throw new Error(`Index must be an integer, got ${key}`);
    }
    return Number(key.numerator);
  }
  if (key && typeof key === "object") {
    if (typeof key.value === "bigint")
      return Number(key.value);
    if (typeof key.numerator === "bigint" && typeof key.denominator === "bigint") {
      if (key.denominator !== 1n) {
        throw new Error(`Index must be an integer, got ${key}`);
      }
      return Number(key.numerator);
    }
  }
  if (typeof key === "number" || typeof key === "bigint")
    return Number(key);
  if (typeof key === "string" && !isNaN(key))
    return Number(key);
  throw new Error(`Index must be numeric, got ${typeof key} (${key})`);
}
function ensureMeta(obj) {
  if (!obj || typeof obj !== "object") {
    throw new Error(`Cannot attach meta properties to ${typeof obj}`);
  }
  if (!obj._ext) {
    obj._ext = new Map;
  }
  return obj._ext;
}
function cloneMapObj(obj) {
  if (obj && obj.type === "map" && obj.entries instanceof Map) {
    return {
      type: "map",
      entries: new Map(obj.entries),
      _ext: obj._ext ? new Map(obj._ext) : undefined
    };
  }
  if (obj && typeof obj === "object") {
    return { ...obj };
  }
  throw new Error(`Cannot clone ${typeof obj} for mutation`);
}
function applyMutations(target, ops) {
  if (!Array.isArray(ops))
    return target;
  for (const op of ops) {
    if (!op || typeof op !== "object")
      continue;
    const { action, key, value } = op;
    if (target.type === "map" && target.entries instanceof Map) {
      switch (action) {
        case "add":
          target.entries.set(key, value);
          break;
        case "remove":
          target.entries.delete(key);
          break;
        case "merge":
          if (value && value.type === "map" && value.entries instanceof Map) {
            for (const [k, v] of value.entries) {
              target.entries.set(k, v);
            }
          }
          break;
      }
    }
  }
  return target;
}
function assertMutableIndexTarget(obj) {
  const ext = obj?._ext;
  if (!ext?.get("_mutable")) {
    throw new Error("Cannot set index: collection is not mutable. Set meta property '._mutable' to a non-null value first.");
  }
}
function clampSequenceIndex(raw, length) {
  const idx = toInteger(raw);
  let normalized = idx;
  if (normalized < 0) {
    normalized = length + 1 + normalized;
  }
  if (normalized < 1)
    normalized = 1;
  if (normalized > length)
    normalized = length;
  return normalized;
}
function sliceSequenceLike(obj, spec) {
  if (obj && (obj.type === "sequence" || obj.type === "tuple")) {
    const values = obj.values || [];
    if (values.length === 0) {
      return obj.type === "tuple" ? { type: "tuple", values: [] } : { type: "sequence", values: [], _ext: new Map([["_mutable", new Integer(1n)]]) };
    }
    const startRaw = spec.kind === "full" ? 1 : spec.start;
    const endRaw = spec.kind === "full" ? values.length : spec.end;
    const start = clampSequenceIndex(startRaw, values.length);
    const end = clampSequenceIndex(endRaw, values.length);
    const out = [];
    const step = start <= end ? 1 : -1;
    for (let i = start;step > 0 ? i <= end : i >= end; i += step) {
      out.push(values[i - 1]);
    }
    return obj.type === "tuple" ? { type: "tuple", values: out } : { type: "sequence", values: out, _ext: new Map([["_mutable", new Integer(1n)]]) };
  }
  if (obj && obj.type === "string") {
    const chars = Array.from(obj.value);
    if (chars.length === 0) {
      return { type: "string", value: "" };
    }
    const startRaw = spec.kind === "full" ? 1 : spec.start;
    const endRaw = spec.kind === "full" ? chars.length : spec.end;
    const start = clampSequenceIndex(startRaw, chars.length);
    const end = clampSequenceIndex(endRaw, chars.length);
    let out = "";
    const step = start <= end ? 1 : -1;
    for (let i = start;step > 0 ? i <= end : i >= end; i += step) {
      out += chars[i - 1];
    }
    return { type: "string", value: out };
  }
  throw new Error(`Type "${obj?.type || typeof obj}" does not support slice indexing`);
}
function indexGetResolved(obj, key) {
  if (isTensor(obj)) {
    return tensorGetBySelectors(obj, [{ kind: "index", value: key }]);
  }
  if (isMultifunctionValue(obj)) {
    const keyName = typeof key === "string" ? key : key && key.type === "string" ? key.value : null;
    if (keyName !== null) {
      const named = getNamedMultifunctionVariant(obj, keyName);
      if (!named) {
        throw new Error(`Unknown multifunction variant: ${keyName}`);
      }
      return named;
    }
  }
  if (obj && (obj.type === "sequence" || obj.type === "tuple" || obj.type === "string")) {
    if (key && (key.type === "interval" || key instanceof RationalInterval)) {
      let sVal, eVal;
      if (key instanceof RationalInterval) {
        sVal = key.start;
        eVal = key.end;
      } else {
        sVal = key.lo;
        eVal = key.hi;
      }
      return bracketGetResolved(obj, [{ kind: "slice", start: sVal, end: eVal }]);
    }
  }
  if (obj && (obj.type === "sequence" || obj.type === "tuple")) {
    const idx = toInteger(key);
    const len = obj.values.length;
    const i = idx < 0 ? len + idx : idx - 1;
    if (i < 0 || i >= len)
      return null;
    return obj.values[i];
  }
  if (obj && obj.type === "string") {
    const idx = toInteger(key);
    const s = obj.value;
    const i = idx < 0 ? s.length + idx : idx - 1;
    if (i < 0 || i >= s.length)
      return null;
    return { type: "string", value: s[i] };
  }
  if (obj && obj.type === "map" && obj.entries instanceof Map) {
    const mapKey = keyOf(key);
    return obj.entries.has(mapKey) ? obj.entries.get(mapKey) : null;
  }
  if (obj && obj.type === "export_bundle" && obj.entries instanceof Map) {
    const mapKey = keyOf(key);
    return obj.entries.has(mapKey) ? obj.entries.get(mapKey).value : null;
  }
  if (obj && (obj.type === "function" || obj.type === "lambda" || obj.type === "sysref" || obj.type === "partial" || obj.type === "arityCap")) {
    let n;
    try {
      n = toInteger(key);
    } catch (_) {
      throw new Error("Arity cap must be a non-negative integer");
    }
    if (!Number.isInteger(n) || n < 0) {
      throw new Error(`Arity cap must be a non-negative integer, got ${n}`);
    }
    return { type: "arityCap", fn: obj, cap: n };
  }
  throw new Error(`Type "${obj?.type || typeof obj}" is not indexable`);
}
function bracketGetResolved(obj, specs) {
  if (isTensor(obj)) {
    return tensorGetBySelectors(obj, specs);
  }
  if (specs.length === 1 && specs[0].kind === "index") {
    return indexGetResolved(obj, specs[0].value);
  }
  if (specs.length === 1 && (specs[0].kind === "slice" || specs[0].kind === "full")) {
    return sliceSequenceLike(obj, specs[0]);
  }
  throw new Error("Bracket slicing is only supported for tensors and sequence-like values");
}
function indexSetResolved(obj, key, value) {
  assertMutableIndexTarget(obj);
  if (isTensor(obj)) {
    return tensorAssignBySelectors(obj, [{ kind: "index", value: key }], value);
  }
  if (obj && (obj.type === "sequence" || obj.type === "tuple")) {
    const idx = toInteger(key);
    const len = obj.values.length;
    const i = idx < 0 ? len + idx : idx - 1;
    obj.values[i] = value;
    return value;
  }
  if (obj && obj.type === "map" && obj.entries instanceof Map) {
    const mapKey = keyOf(key);
    obj.entries.set(mapKey, value);
    return value;
  }
  if (obj && obj.type === "export_bundle" && obj.entries instanceof Map) {
    const mapKey = keyOf(key);
    const cell = obj.entries.get(mapKey);
    if (cell instanceof Cell) {
      cell.value = value;
    } else {
      obj.entries.set(mapKey, new Cell(value));
    }
    return value;
  }
  throw new Error(`Cannot set index on "${obj?.type || typeof obj}"`);
}
function decodeBracketSpec(specNode, evaluate) {
  if (specNode && specNode.fn === "FULL_SLICE") {
    return { kind: "full" };
  }
  if (specNode && specNode.fn === "SLICE_SPEC") {
    return {
      kind: "slice",
      start: evaluate(specNode.args[0]),
      end: evaluate(specNode.args[1])
    };
  }
  return {
    kind: "index",
    value: evaluate(specNode)
  };
}
var propertyFunctions = {
  META_GET: {
    impl(args) {
      const obj = args[0];
      const prop = args[1];
      if (prop === "_proto") {
        return getBuiltinProto(obj);
      }
      const ext = obj?._ext;
      if (!ext || !ext.has(prop))
        return null;
      return ext.get(prop);
    },
    doc: "Get meta property (returns null if absent) — obj.name"
  },
  META_SET: {
    lazy: true,
    impl(args, context, evaluate) {
      const obj = evaluate(args[0]);
      const prop = args[1];
      const value = evaluate(args[2]);
      if (prop === "_proto" && value !== null && (value?.type !== "map" || !(value.entries instanceof Map))) {
        throw new Error('Meta property "_proto" must be a map or null');
      }
      if (prop === "__proto" && value !== null && (value?.type !== "map" || !(value.entries instanceof Map))) {
        throw new Error('Meta property "__proto" must be a map or null');
      }
      const ext = obj?._ext;
      if (ext) {
        if (ext.get("immutable")) {
          throw new Error(`Cannot set meta property "${prop}": object is immutable`);
        }
        if (ext.get("frozen") && prop !== "frozen") {
          throw new Error(`Cannot set meta property "${prop}": object is frozen`);
        }
      }
      const metaMap = ensureMeta(obj);
      if (prop === "key") {
        if (value === null) {
          throw new Error("Cannot delete .key once set");
        }
        const canonical = canonicalizeMetaKey(value);
        const existing = metaMap.get("key");
        if (existing !== undefined) {
          const existingCanonical = canonicalizeMetaKey(existing);
          if (existingCanonical !== canonical) {
            throw new Error(`Cannot change .key once set (existing: "${existingCanonical}", new: "${canonical}")`);
          }
        }
        const canonicalString = { type: "string", value: canonical };
        metaMap.set("key", canonicalString);
        return canonicalString;
      }
      if (value === null) {
        metaMap.delete(prop);
      } else {
        if (prop === "__traits") {
          const traitNames = value?.type === "set" ? Array.from(value.values || [], (entry) => entry?.type === "string" ? entry.value : String(entry)) : [];
          metaMap.set(prop, createTraitSet(traitNames, traitNames));
        } else {
          metaMap.set(prop, value);
        }
      }
      if (prop === "__type" || prop === "__traits" || prop === "__name" || prop === "__proto") {
        rebuildSemanticMetadata(obj, context);
      }
      return value;
    },
    doc: "Set meta property (null deletes; respects immutable/frozen) — obj.name = val"
  },
  META_ALL: {
    impl(args) {
      const obj = args[0];
      const ext = obj?._ext;
      if (!ext) {
        return { type: "map", entries: new Map };
      }
      const visible = new Map(ext);
      visible.delete("_proto");
      return { type: "map", entries: visible };
    },
    doc: "Get all meta properties as a map (read-only copy) — obj.."
  },
  META_MERGE: {
    lazy: true,
    impl(args, context, evaluate) {
      const obj = evaluate(args[0]);
      const mergeMap = evaluate(args[1]);
      const ext = obj?._ext;
      if (ext?.get("immutable"))
        throw new Error("Cannot merge meta: object is immutable");
      if (ext?.get("frozen"))
        throw new Error("Cannot merge meta: object is frozen");
      if (!mergeMap || mergeMap.type !== "map") {
        throw new Error("META_MERGE requires a map on the right side");
      }
      const metaMap = ensureMeta(obj);
      for (const [key, value] of mergeMap.entries) {
        if (value === null) {
          metaMap.delete(key);
        } else {
          metaMap.set(key, value);
        }
      }
      return obj;
    },
    doc: "Bulk merge map into object meta properties (null values = delete) — obj .= map"
  },
  INDEX_GET: {
    impl(args) {
      return indexGetResolved(args[0], args[1]);
    },
    doc: "Index into collection (1-based for sequences; string or value keys for maps) — obj[i]"
  },
  INDEX_SET: {
    lazy: true,
    impl(args, context, evaluate) {
      const obj = evaluate(args[0]);
      const key = evaluate(args[1]);
      const value = evaluate(args[2]);
      return indexSetResolved(obj, key, value);
    },
    doc: "Set index in collection (requires ._mutable meta flag) — obj[i] = val"
  },
  BRACKET_GET: {
    lazy: true,
    impl(args, context, evaluate) {
      const obj = evaluate(args[0]);
      const specCount = args[1];
      const specNodes = args.slice(2, 2 + specCount);
      const specs = specNodes.map((specNode) => decodeBracketSpec(specNode, evaluate));
      return bracketGetResolved(obj, specs);
    },
    doc: "Tensor-aware bracket indexing and slicing"
  },
  BRACKET_SET: {
    lazy: true,
    impl(args, context, evaluate) {
      const obj = evaluate(args[0]);
      const specCount = args[1];
      const specNodes = args.slice(2, 2 + specCount);
      const value = evaluate(args[2 + specCount]);
      const specs = specNodes.map((specNode) => decodeBracketSpec(specNode, evaluate));
      if (isTensor(obj)) {
        assertMutableIndexTarget(obj);
        return tensorAssignBySelectors(obj, specs, value);
      }
      if (specs.length === 1 && specs[0].kind === "index") {
        return indexSetResolved(obj, specs[0].value, value);
      }
      throw new Error("Bracket slice assignment is only supported for tensors");
    },
    doc: "Tensor-aware bracket assignment"
  },
  KEYOF: {
    impl(args) {
      return { type: "string", value: keyOf(args[0]) };
    },
    pure: true,
    doc: "Resolve canonical map key string for a value"
  },
  KEYS: {
    impl(args) {
      const obj = args[0];
      if (obj && obj.type === "map" && obj.entries instanceof Map) {
        const keys = Array.from(obj.entries.keys());
        return { type: "set", values: keys };
      }
      if (obj && obj.type === "export_bundle" && obj.entries instanceof Map) {
        const keys = Array.from(obj.entries.keys());
        return { type: "set", values: keys };
      }
      return { type: "set", values: [] };
    },
    pure: true,
    doc: "Get the keys of a map as a set (obj.|)"
  },
  VALUES: {
    impl(args) {
      const obj = args[0];
      if (obj && obj.type === "map" && obj.entries instanceof Map) {
        const vals = Array.from(obj.entries.values());
        return { type: "set", values: vals };
      }
      if (obj && obj.type === "export_bundle" && obj.entries instanceof Map) {
        const vals = Array.from(obj.entries.values(), (cell) => cell.value);
        return { type: "set", values: vals };
      }
      return { type: "set", values: [] };
    },
    pure: true,
    doc: "Get the values of a map as a set (obj|.)"
  },
  MUTCOPY: {
    impl(args) {
      const target = args[0];
      const ops = args[1];
      const clone = cloneMapObj(target);
      return applyMutations(clone, ops);
    },
    doc: "Clone a map and apply mutations (obj{= +a=3, -.b })"
  },
  MUTINPLACE: {
    impl(args) {
      const target = args[0];
      const ops = args[1];
      return applyMutations(target, ops);
    },
    doc: "Mutate a map in-place (obj{! +a=3, -.b })"
  }
};

// ../rix/src/eval/functions/core.js
var BASE_RESERVED_CHARS = new Set([".", "/", "#", "~", "_", "^", "+", "-"]);
var requireFromHere = createRequire(import.meta.url);
var BASE_MODE_ALIASES = new Map([
  ["mixed", 1],
  ["..", 1],
  ["repeat", 2],
  [".", 2],
  ["#", 2],
  ["radix", 2],
  ["cf", 3],
  [".~", 3],
  ["cf_explicit", 4],
  ["~", 4],
  ["shifted", 5],
  ["_^", 5],
  ["^", 5],
  ["fraction", 6],
  ["/", 6],
  ["improper", 6]
]);
var DEFAULT_BASE_DIGITS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz@&";
var DEFAULT_BASE_EXPANSION_LIMIT = 20;
function unescapeQuotedString(text) {
  return text.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16))).replace(/\\"/g, '"').replace(/\\\\/g, "\\");
}
function toRationalValue(value) {
  if (value instanceof Integer)
    return value.toRational();
  if (value instanceof Rational)
    return value;
  if (value instanceof RationalInterval) {
    if (value.low.equals(value.high))
      return value.low;
    throw new Error("Expected a single numeric value, not an interval");
  }
  throw new Error("Expected a numeric value");
}
function conversionWarningsEnabled(context) {
  const warnings = context?.getEnv?.("warnings", runtimeDefaults.warnings) ?? runtimeDefaults.warnings;
  return warnings?.conversion === true;
}
function finalizeSemanticValue(value, context) {
  attachBuiltinProto(value);
  rebuildSemanticMetadata(value, context);
  refreshRuntimeMetadata(value, value?._ext?.get("_proto") ?? null);
  return value;
}
function jsExportToRix(value) {
  if (typeof value === "function")
    return value;
  if (value && typeof value === "object") {
    return {
      type: "map",
      entries: new Map(Object.entries(value).map(([key, entry]) => [key, jsExportToRix(entry)]))
    };
  }
  return value ?? null;
}
function importJSModule(filename, context) {
  const spec = filename?.type === "string" ? filename.value : String(filename ?? "");
  if (!spec.endsWith(".js")) {
    throw new Error("ImportJS expects a local .js module path");
  }
  const baseDir = context.getEnv("jsImportBaseDir", context.getEnv("scriptBaseDir", process.cwd()));
  const resolved = path_default.isAbsolute(spec) ? spec : path_default.resolve(baseDir, spec);
  const cache = context.getEnv("__js_import_cache__", new Map);
  context.setEnv("__js_import_cache__", cache);
  if (!cache.has(resolved)) {
    cache.set(resolved, jsExportToRix(requireFromHere(resolved)));
  }
  return cache.get(resolved);
}
function callJSModule(filename, exportName, callArgs, context) {
  const module = importJSModule(filename, context);
  const key = exportName?.type === "string" ? exportName.value : String(exportName ?? "");
  const fn = module?.type === "map" ? module.entries.get(key) : null;
  if (typeof fn !== "function") {
    throw new Error(`ImportJS module does not export callable '${key}'`);
  }
  return fn(...callArgs);
}
function capturePackageCallable(value, context) {
  if (!value || typeof value !== "object")
    return value;
  if (!(value.type === "function" || value.type === "lambda" || value.type === "sysref" || value.type === "partial")) {
    return value;
  }
  const captured = new Map;
  for (const key of ["jsImportBaseDir", "scriptBaseDir"]) {
    if (context.env?.has(key))
      captured.set(key, context.getEnv(key, undefined));
  }
  Object.defineProperty(value, "__rixCapturedEnv", {
    value: captured,
    configurable: true
  });
  return value;
}
function evaluateOutfitValue(header, valueNode, context, evaluate) {
  const captureMode = header?.captureMode || constructorDefaultCaptureMode(context);
  const value = captureIrValue(valueNode, captureMode, context, evaluate);
  const effectiveHeader = mergeStickyHeader(readStickyHeader(value), header);
  const next = applySemanticHeader(value, effectiveHeader, context, {
    inheritMissing: true,
    warnOnTypeChange: true,
    evaluate
  });
  return finalizeSemanticValue(next, context);
}
function groupDigits(intStr) {
  if (!intStr || intStr.length <= 3)
    return intStr;
  const sign = intStr.startsWith("-") ? "-" : "";
  const body = sign ? intStr.slice(1) : intStr;
  if (body.length <= 3)
    return intStr;
  let out = "";
  for (let i = 0;i < body.length; i++) {
    if (i > 0 && (body.length - i) % 3 === 0)
      out += "_";
    out += body[i];
  }
  return sign + out;
}
function stripGroupedDecimalDigits(text, { allowSign = false } = {}) {
  if (typeof text !== "string" || text.length === 0)
    return text;
  let s = text;
  let sign = "";
  if (allowSign && (s.startsWith("-") || s.startsWith("+"))) {
    sign = s[0];
    s = s.slice(1);
  }
  if (s.includes("_")) {
    if (s.startsWith("_") || s.endsWith("_") || s.includes("__")) {
      throw new Error("Invalid underscore placement in number");
    }
    for (let i = 0;i < s.length; i++) {
      if (s[i] !== "_")
        continue;
      const prev = s[i - 1];
      const next = s[i + 1];
      if (!/\d/.test(prev || "") || !/\d/.test(next || "")) {
        throw new Error("Underscore separators must be between digits");
      }
    }
  }
  return sign + s.replace(/_/g, "");
}
function groupDigitRuns(text, baseSystem) {
  if (!text)
    return text;
  let out = "";
  let run = "";
  const flush = () => {
    if (!run.length)
      return;
    if (run.length <= 3) {
      out += run;
    } else {
      for (let i = 0;i < run.length; i++) {
        if (i > 0 && i % 3 === 0)
          out += "_";
        out += run[i];
      }
    }
    run = "";
  };
  for (const ch of text) {
    if (baseSystem.charMap.has(ch)) {
      run += ch;
    } else {
      flush();
      out += ch;
    }
  }
  flush();
  return out;
}
function shortenRepeatingExpansion(expansion, limit = DEFAULT_BASE_EXPANSION_LIMIT) {
  if (typeof expansion !== "string")
    return expansion;
  if (!expansion.includes("#")) {
    if (expansion.length > limit + 2) {
      const dotIndex = expansion.indexOf(".");
      if (dotIndex !== -1 && expansion.length - dotIndex - 1 > limit) {
        return expansion.substring(0, dotIndex + limit + 1) + "...";
      }
    }
    return expansion;
  }
  if (expansion.endsWith("#0")) {
    const withoutRepeating = expansion.substring(0, expansion.length - 2);
    if (withoutRepeating.length > limit + 2) {
      const dotIndex = withoutRepeating.indexOf(".");
      if (dotIndex !== -1 && withoutRepeating.length - dotIndex - 1 > limit) {
        return withoutRepeating.substring(0, dotIndex + limit + 1) + "...";
      }
    }
    return withoutRepeating;
  }
  if (expansion.length > limit + 2) {
    const hashIndex = expansion.indexOf("#");
    const beforeHash = expansion.substring(0, hashIndex);
    const afterHash = expansion.substring(hashIndex + 1);
    if (beforeHash.length > limit + 1) {
      return beforeHash.substring(0, limit + 1) + "...";
    }
    const remainingSpace = limit + 2 - beforeHash.length;
    if (remainingSpace <= 1)
      return beforeHash + "#...";
    if (afterHash.length > remainingSpace - 1) {
      return beforeHash + "#" + afterHash.substring(0, remainingSpace - 1) + "...";
    }
  }
  return expansion;
}
function groupRadixExpansion(expansion, baseSystem) {
  if (!expansion)
    return expansion;
  const sign = expansion.startsWith("-") ? "-" : "";
  const body = sign ? expansion.slice(1) : expansion;
  const hashIndex = body.indexOf("#");
  const beforeHash = hashIndex === -1 ? body : body.slice(0, hashIndex);
  const afterHash = hashIndex === -1 ? null : body.slice(hashIndex + 1);
  const dotIndex = beforeHash.indexOf(".");
  const integerPart = dotIndex === -1 ? beforeHash : beforeHash.slice(0, dotIndex);
  const fracPart = dotIndex === -1 ? null : beforeHash.slice(dotIndex + 1);
  const groupedInteger = groupDigits(integerPart);
  const groupedFrac = fracPart === null ? null : groupDigitRuns(fracPart, baseSystem);
  const groupedRepeat = afterHash === null ? null : groupDigitRuns(afterHash, baseSystem);
  let out = groupedInteger;
  if (groupedFrac !== null)
    out += "." + groupedFrac;
  if (groupedRepeat !== null)
    out += "#" + groupedRepeat;
  return sign + out;
}
function baseFromInteger(n) {
  if (!Number.isInteger(n) || n < 2 || n > 64) {
    throw new Error("Base number must be an integer between 2 and 64");
  }
  const chars = Array.from(DEFAULT_BASE_DIGITS.slice(0, n));
  return new BaseSystem(chars, `Base ${n}`);
}
function ensureSafeDigits(baseSystem) {
  for (const ch of baseSystem.characters) {
    if (BASE_RESERVED_CHARS.has(ch)) {
      throw new Error(`Base digit '${ch}' is reserved and cannot be used in a digit alphabet`);
    }
  }
}
function parseBaseInteger(str, baseSystem, allowSign = true) {
  let s = str;
  let sign = 1n;
  if (allowSign && (s.startsWith("-") || s.startsWith("+"))) {
    sign = s[0] === "-" ? -1n : 1n;
    s = s.slice(1);
  }
  if (!s.length)
    throw new Error("Missing digits");
  if (s.startsWith("_") || s.endsWith("_"))
    throw new Error("Underscore cannot be leading or trailing");
  if (s.includes("__"))
    throw new Error("Consecutive underscores are not allowed");
  const usesLower = baseSystem.characters.some((c) => c >= "a" && c <= "z");
  const usesUpper = baseSystem.characters.some((c) => c >= "A" && c <= "Z");
  const normalizeChar = (ch) => {
    if (baseSystem.charMap.has(ch))
      return ch;
    if (usesLower && !usesUpper) {
      const c = ch.toLowerCase();
      if (baseSystem.charMap.has(c))
        return c;
    }
    if (usesUpper && !usesLower) {
      const c = ch.toUpperCase();
      if (baseSystem.charMap.has(c))
        return c;
    }
    return ch;
  };
  const chars = Array.from(s).map(normalizeChar);
  for (let i = 0;i < chars.length; i++) {
    const ch = chars[i];
    if (ch === "_") {
      const prev = chars[i - 1];
      const next = chars[i + 1];
      if (!baseSystem.charMap.has(prev) || !baseSystem.charMap.has(next)) {
        throw new Error("Underscore separators must be between base digits");
      }
      continue;
    }
    if (!baseSystem.charMap.has(ch)) {
      throw new Error(`Invalid digit '${ch}' for ${baseSystem.name}`);
    }
  }
  const cleaned = chars.filter((ch) => ch !== "_").join("");
  return sign * baseSystem.toDecimal(cleaned);
}
function parseSimpleBaseNumeral(str, baseSystem) {
  let s = str;
  let sign = 1n;
  if (s.startsWith("-") || s.startsWith("+")) {
    sign = s[0] === "-" ? -1n : 1n;
    s = s.slice(1);
  }
  const dotParts = s.split(".");
  if (dotParts.length > 2)
    throw new Error("Too many radix points");
  const intPart = dotParts[0] === "" ? "0" : dotParts[0];
  const fracPart = dotParts.length === 2 ? dotParts[1] : "";
  const intVal = parseBaseInteger(intPart, baseSystem, false);
  let result = new Rational(intVal, 1n);
  if (fracPart.length) {
    const fracVal = parseBaseInteger(fracPart, baseSystem, false);
    const denom = BigInt(baseSystem.base) ** BigInt(Array.from(fracPart).filter((c) => c !== "_").length);
    result = result.add(new Rational(fracVal, denom));
  }
  if (sign < 0n)
    result = result.negate();
  return result;
}
function continuedFractionFromTerms(terms) {
  let acc = new Rational(terms[terms.length - 1], 1n);
  for (let i = terms.length - 2;i >= 0; i--) {
    acc = new Rational(terms[i], 1n).add(new Rational(1, 1).divide(acc));
  }
  return acc;
}
function fromBaseString(baseStr, baseSystem) {
  if (typeof baseStr !== "string")
    throw new Error("FROMBASE expects a string input");
  let s = baseStr.trim();
  if (!s.length)
    throw new Error("Empty base numeral");
  if (s.startsWith("_"))
    throw new Error("Underscore cannot start a number");
  let shiftExp = null;
  const shiftIdx = s.indexOf("_^");
  if (shiftIdx !== -1) {
    if (s.indexOf("_^", shiftIdx + 2) !== -1)
      throw new Error("Only one _^ is allowed");
    if (s.includes("#") && shiftIdx < s.indexOf("#"))
      throw new Error("Radix shift must come after repeating section");
    shiftExp = s.slice(shiftIdx + 2);
    s = s.slice(0, shiftIdx);
  }
  let value;
  if (s.includes(".~")) {
    const explicit = s.startsWith("~");
    if (explicit)
      s = s.slice(1);
    const idx = s.indexOf(".~");
    const a0 = s.slice(0, idx);
    const tail = s.slice(idx + 2);
    if (!tail.length)
      throw new Error("Continued fraction requires terms after .~");
    const termStrs = [a0, ...tail.split("~")];
    if (termStrs.some((t) => !t.length))
      throw new Error("Invalid continued fraction format");
    const terms = termStrs.map((t, i) => parseBaseInteger(t, baseSystem, i === 0));
    value = continuedFractionFromTerms(terms);
  } else if (s.includes("..")) {
    const parts = s.split("..");
    if (parts.length !== 2)
      throw new Error("Mixed number must have exactly one '..'");
    const whole = parseBaseInteger(parts[0], baseSystem, true);
    const fracParts = parts[1].split("/");
    if (fracParts.length !== 2)
      throw new Error("Mixed number requires Y/Z fractional part");
    const num = parseBaseInteger(fracParts[0], baseSystem, false);
    const den = parseBaseInteger(fracParts[1], baseSystem, false);
    if (den === 0n)
      throw new Error("Denominator cannot be zero");
    let frac = new Rational(num, den);
    if (whole < 0n)
      frac = frac.negate();
    value = new Rational(whole, 1n).add(frac);
  } else if (s.includes("/")) {
    const parts = s.split("/");
    if (parts.length !== 2)
      throw new Error("Fraction must have exactly one '/'");
    const num = parseBaseInteger(parts[0], baseSystem, true);
    const den = parseBaseInteger(parts[1], baseSystem, false);
    if (den === 0n)
      throw new Error("Denominator cannot be zero");
    value = new Rational(num, den);
    value._explicitFraction = true;
  } else if (s.includes("#")) {
    const parts = s.split("#");
    if (parts.length !== 2)
      throw new Error("Repeating form must have exactly one '#'");
    const prefix = parts[0];
    const repeat = parts[1];
    if (!repeat.length)
      throw new Error("Repeating block after # cannot be empty");
    const sign = prefix.startsWith("-") ? -1n : 1n;
    const unsignedPrefix = prefix.startsWith("-") || prefix.startsWith("+") ? prefix.slice(1) : prefix;
    const dot = unsignedPrefix.indexOf(".");
    const intStr = dot === -1 ? unsignedPrefix : unsignedPrefix.slice(0, dot);
    const nonRep = dot === -1 ? "" : unsignedPrefix.slice(dot + 1);
    const intVal = parseBaseInteger(intStr || "0", baseSystem, false);
    const nonRepVal = nonRep.length ? parseBaseInteger(nonRep, baseSystem, false) : 0n;
    const repVal = parseBaseInteger(repeat, baseSystem, false);
    const B = BigInt(baseSystem.base);
    const m = BigInt(Array.from(nonRep).filter((c) => c !== "_").length);
    const r = BigInt(Array.from(repeat).filter((c) => c !== "_").length);
    let result = new Rational(intVal, 1n);
    if (m > 0n)
      result = result.add(new Rational(nonRepVal, B ** m));
    result = result.add(new Rational(repVal, B ** m * (B ** r - 1n)));
    value = sign < 0n ? result.negate() : result;
  } else {
    value = parseSimpleBaseNumeral(s, baseSystem);
  }
  if (shiftExp !== null && shiftExp.length) {
    const shift = parseBaseInteger(shiftExp, baseSystem, true);
    const B = new Rational(BigInt(baseSystem.base), 1n);
    const factor = shift >= 0n ? B.pow(shift) : new Rational(1, 1).divide(B.pow(-shift));
    value = value.multiply(factor);
  }
  return value.denominator === 1n ? new Integer(value.numerator) : value;
}
function resolveModeSpec(modeValue) {
  if (modeValue === undefined || modeValue === null)
    return { mode: 1 };
  if (typeof modeValue === "string") {
    const s = modeValue.trim().toLowerCase();
    const limitedRadix = s.match(/^(?:\.|#|repeat|radix)(\d+)$/);
    if (limitedRadix)
      return { mode: 2, limit: parseInt(limitedRadix[1], 10) };
    const limitedShifted = s.match(/^(?:\^|_\^|shifted)(\d+)$/);
    if (limitedShifted)
      return { mode: 5, limit: parseInt(limitedShifted[1], 10) };
    const alias = BASE_MODE_ALIASES.get(s);
    if (alias !== undefined)
      return { mode: alias };
    throw new Error(`Unknown formatting mode '${modeValue}'`);
  }
  if (modeValue && modeValue.type === "string") {
    return resolveModeSpec(modeValue.value);
  }
  if (modeValue instanceof Integer)
    return { mode: Number(modeValue.value) };
  if (modeValue instanceof Rational && modeValue.denominator === 1n)
    return { mode: Number(modeValue.numerator) };
  throw new Error("Formatting mode must be an integer or mode string");
}
function toBaseDigitsInt(value, baseSystem) {
  return groupDigits(baseSystem.fromDecimal(value));
}
function toBaseString(value, baseSystem, modeSpec = { mode: 1 }) {
  const mode = typeof modeSpec === "number" ? modeSpec : modeSpec?.mode ?? 1;
  const limit = typeof modeSpec === "number" ? undefined : modeSpec?.limit;
  const rat = toRationalValue(value);
  if (mode === 2) {
    const raw = rat.toRepeatingBase(baseSystem);
    const shortened = shortenRepeatingExpansion(raw, limit ?? DEFAULT_BASE_EXPANSION_LIMIT);
    return groupRadixExpansion(shortened, baseSystem);
  }
  if (mode === 3 || mode === 4) {
    const cf = rat.toContinuedFraction();
    const terms = cf.map((t) => baseSystem.fromDecimal(t));
    if (terms.length === 1)
      return groupDigits(terms[0]);
    const prefix = mode === 4 || cf[0] < 0n ? "~" : "";
    return `${prefix}${groupDigits(terms[0])}.~${terms.slice(1).map(groupDigits).join("~")}`;
  }
  if (mode === 5) {
    const raw = shortenRepeatingExpansion(rat.toRepeatingBase(baseSystem), limit ?? DEFAULT_BASE_EXPANSION_LIMIT);
    const sign2 = raw.startsWith("-") ? "-" : "";
    const body = sign2 ? raw.slice(1) : raw;
    const hash = body.indexOf("#");
    const dot = body.indexOf(".");
    const cut = dot === -1 ? hash === -1 ? body.length : hash : dot;
    const integer = body.slice(0, cut);
    const integerDigits = Array.from(integer).filter((ch) => baseSystem.charMap.has(ch)).length;
    if (integer.length <= 1)
      return `${groupRadixExpansion(sign2 + body, baseSystem)}_^0`;
    const tail = dot === -1 ? hash === -1 ? "" : body.slice(hash) : body.slice(dot + 1);
    const shifted = `${integer[0]}.${integer.slice(1)}${tail}`;
    return `${groupRadixExpansion(sign2 + shifted, baseSystem)}_^${integerDigits - 1}`;
  }
  if (mode === 6) {
    return `${toBaseDigitsInt(rat.numerator, baseSystem)}/${toBaseDigitsInt(rat.denominator, baseSystem)}`;
  }
  if (rat.denominator === 1n) {
    return toBaseDigitsInt(rat.numerator, baseSystem);
  }
  const sign = rat.numerator < 0n ? -1n : 1n;
  const absNum = rat.numerator < 0n ? -rat.numerator : rat.numerator;
  const whole = absNum / rat.denominator;
  const rem = absNum % rat.denominator;
  if (rem === 0n)
    return toBaseDigitsInt(rat.numerator, baseSystem);
  const wholeStr = toBaseDigitsInt(sign < 0n ? -whole : whole, baseSystem);
  return `${wholeStr}..${toBaseDigitsInt(rem, baseSystem)}/${toBaseDigitsInt(rat.denominator, baseSystem)}`;
}
function resolveBaseSpecFromValue(value) {
  if (typeof value === "string" && /^0([A-Za-z])$/.test(value)) {
    const letter = value[1];
    const base = BaseSystem.getSystemForPrefix(letter);
    if (!base)
      throw new Error(`Unknown base prefix '${value}'`);
    return base;
  }
  if (value && value.type === "string") {
    const chars = Array.from(value.value);
    const base = new BaseSystem(chars, `Custom Base ${chars.length}`);
    ensureSafeDigits(base);
    return base;
  }
  if (typeof value === "string") {
    const chars = Array.from(value);
    const base = new BaseSystem(chars, `Custom Base ${chars.length}`);
    ensureSafeDigits(base);
    return base;
  }
  if (value instanceof Integer) {
    return baseFromInteger(Number(value.value));
  }
  if (value instanceof Rational && value.denominator === 1n) {
    return baseFromInteger(Number(value.numerator));
  }
  if (value && value.type === "tuple" && Array.isArray(value.values) && value.values.length === 2) {
    const radix = value.values[0];
    const digits = value.values[1];
    const baseFromDigits = resolveBaseSpecFromValue(digits);
    const radixNum = radix instanceof Integer ? Number(radix.value) : radix instanceof Rational && radix.denominator === 1n ? Number(radix.numerator) : null;
    if (!Number.isInteger(radixNum))
      throw new Error("Tuple radix must be an integer");
    if (radixNum !== baseFromDigits.base) {
      throw new Error(`Tuple base mismatch: radix ${radixNum} does not match digits length ${baseFromDigits.base}`);
    }
    return baseFromDigits;
  }
  throw new Error("Invalid base specification");
}
function parseLiteral(str) {
  if (typeof str !== "string")
    return str;
  if (/^0[a-zA-Z]$/.test(str) || /^0z\[\d+\]$/.test(str)) {
    return str;
  }
  const explicitPrefixed = str.match(/^~(-?)(?:0z\[(\d+)\]|0([a-zA-Z]))(.+)$/);
  if (explicitPrefixed) {
    const neg = explicitPrefixed[1] === "-" ? "-" : "";
    const custom = explicitPrefixed[2];
    const prefix = explicitPrefixed[3];
    const tail = explicitPrefixed[4];
    const baseSystem2 = custom ? BaseSystem.fromBase(parseInt(custom, 10)) : BaseSystem.getSystemForPrefix(prefix);
    if (!baseSystem2) {
      throw new Error(`Unknown base prefix in explicit continued fraction: ${str}`);
    }
    return fromBaseString(`~${neg}${tail}`, baseSystem2);
  }
  if (str.startsWith("~")) {
    const cfStr = str.slice(1);
    const cfMatch = cfStr.match(/^(-?\d+)\.~(\d+(?:~\d+)*)$/);
    if (cfMatch) {
      const intPart = BigInt(cfMatch[1]);
      const cfTerms = cfMatch[2].split("~").map((t) => BigInt(t));
      return Rational.fromContinuedFraction([intPart, ...cfTerms]);
    }
    throw new Error(`Invalid explicit continued fraction format: ${str}`);
  }
  const isNegative = str.startsWith("-");
  const posStr = isNegative ? str.slice(1) : str;
  const quotedPrefix = str.match(/^(-?)0([A-Z])"((?:[^"\\]|\\.)*)"$/);
  if (quotedPrefix) {
    const sign = quotedPrefix[1] === "-" ? "-" : "";
    const prefix = quotedPrefix[2];
    const baseSystem2 = BaseSystem.getSystemForPrefix(prefix);
    if (!baseSystem2)
      throw new Error(`Unknown base prefix 0${prefix}`);
    const stream = unescapeQuotedString(quotedPrefix[3]);
    return fromBaseString(sign + stream, baseSystem2);
  }
  if (str.includes(".~") && !/^-?(?:0z\[\d+\]|0[a-zA-Z])/.test(str)) {
    const cfMatch = str.match(/^(\d+)\.~(\d+(?:~\d+)*)$/);
    if (cfMatch) {
      const intPart = BigInt(cfMatch[1]);
      const cfTerms = cfMatch[2].split("~").map((t) => BigInt(t));
      return Rational.fromContinuedFraction([intPart, ...cfTerms]);
    }
    throw new Error(`Invalid continued fraction format: ${str}`);
  }
  if (posStr.includes("_^")) {
    const shiftMatch = posStr.match(/^(.*?)_\^([+-]?\d(?:_?\d)*)$/);
    if (shiftMatch) {
      const baseVal = parseLiteral((isNegative ? "-" : "") + shiftMatch[1]);
      const exp = BigInt(stripGroupedDecimalDigits(shiftMatch[2], { allowSign: true }));
      const base = 10n;
      let scale;
      if (exp >= 0n) {
        scale = new Rational(base ** exp);
      } else {
        scale = new Rational(1n, base ** -exp);
      }
      const baseRat = baseVal instanceof Integer ? baseVal.toRational() : baseVal;
      const result = baseRat.multiply(scale);
      return result.denominator === 1n ? new Integer(result.numerator) : result;
    }
    throw new Error(`Invalid radix shift format: ${str}`);
  }
  if (posStr.includes("#")) {
    return parseRepeatingDecimalLiteral(str);
  }
  const parseWithBase = (numStr, baseSystem2) => {
    const normalizeCase = (s, sys) => {
      const usesLower = sys.characters.some((c) => c >= "a" && c <= "z");
      const usesUpper = sys.characters.some((c) => c >= "A" && c <= "Z");
      if (usesLower && !usesUpper)
        return s.toLowerCase();
      if (usesUpper && !usesLower)
        return s.toUpperCase();
      return s;
    };
    if (numStr.includes(".")) {
      const parts = numStr.split(".");
      const intStr = parts[0] || "0";
      const fracStr = parts[1];
      const sign = numStr.startsWith("-") ? -1n : 1n;
      const absIntStr = intStr.startsWith("-") ? intStr.slice(1) : intStr;
      const intVal = baseSystem2.toDecimal(normalizeCase(absIntStr, baseSystem2));
      const fracVal = fracStr ? baseSystem2.toDecimal(normalizeCase(fracStr, baseSystem2)) : 0n;
      const den = BigInt(baseSystem2.base) ** BigInt(fracStr ? fracStr.length : 0);
      const num = sign * (intVal * den + fracVal);
      return new Rational(num, den);
    }
    if (numStr.includes("/")) {
      if (numStr.includes("..")) {
        const mixedParts = numStr.split("..");
        const wholeStr = mixedParts[0];
        const fracParts = mixedParts[1].split("/");
        const sign = wholeStr.startsWith("-") ? -1n : 1n;
        const absWholeStr = wholeStr.startsWith("-") ? wholeStr.slice(1) : wholeStr;
        const getVal = (s) => {
          const m = s.match(/^(?:0[a-zA-Z]|0z\[\d+\])?(.*)$/);
          return baseSystem2.toDecimal(normalizeCase(m ? m[1] : s, baseSystem2));
        };
        const whole = getVal(absWholeStr);
        const num = getVal(fracParts[0]);
        const den = getVal(fracParts[1]);
        return new Rational(sign * (whole * den + num), den);
      } else {
        const fracParts = numStr.split("/");
        const sign = fracParts[0].startsWith("-") ? -1n : 1n;
        const absNumStr = fracParts[0].startsWith("-") ? fracParts[0].slice(1) : fracParts[0];
        const getVal = (s) => {
          const m = s.match(/^(?:0[a-zA-Z]|0z\[\d+\])?(.*)$/);
          return baseSystem2.toDecimal(normalizeCase(m ? m[1] : s, baseSystem2));
        };
        const num = getVal(absNumStr);
        const den = getVal(fracParts[1]);
        return new Rational(sign * num, den);
      }
    }
    return new Integer(baseSystem2.toDecimal(normalizeCase(numStr, baseSystem2)));
  };
  let baseSystem = null;
  let valueStr = str;
  const customMatch = posStr.match(/^0z\[(\d+)\](.*)$/);
  if (customMatch) {
    baseSystem = BaseSystem.fromBase(parseInt(customMatch[1]));
    valueStr = (isNegative ? "-" : "") + customMatch[2];
  } else {
    const prefixMatch = posStr.match(/^0([a-zA-Z])(.*)$/);
    if (prefixMatch) {
      const prefix = prefixMatch[1];
      baseSystem = BaseSystem.getSystemForPrefix(prefix);
      if (baseSystem) {
        valueStr = (isNegative ? "-" : "") + prefixMatch[2];
      }
    }
  }
  if (baseSystem) {
    if (!valueStr || valueStr === "-") {
      throw new Error(`Invalid base literal: ${str}`);
    }
    return fromBaseString(valueStr, baseSystem);
  }
  if (/^-?\d(?:_?\d)*$/.test(str)) {
    return new Integer(stripGroupedDecimalDigits(str, { allowSign: true }));
  }
  const ratMatch = str.match(/^(-?\d(?:_?\d)*)\/(\d(?:_?\d)*)$/);
  if (ratMatch) {
    return new Rational(BigInt(stripGroupedDecimalDigits(ratMatch[1], { allowSign: true })), BigInt(stripGroupedDecimalDigits(ratMatch[2])));
  }
  const mixedMatch = str.match(/^(-?\d(?:_?\d)*)\.\.(\d(?:_?\d)*)\/(\d(?:_?\d)*)$/);
  if (mixedMatch) {
    const whole = BigInt(stripGroupedDecimalDigits(mixedMatch[1], { allowSign: true }));
    const num = BigInt(stripGroupedDecimalDigits(mixedMatch[2]));
    const den = BigInt(stripGroupedDecimalDigits(mixedMatch[3]));
    const sign = whole < 0n ? -1n : 1n;
    const absWhole = whole < 0n ? -whole : whole;
    return new Rational(sign * (absWhole * den + num), den);
  }
  if (/^-?\d(?:_?\d)*\.\d(?:_?\d)*$/.test(str)) {
    const parts = str.split(".");
    const sign = parts[0].startsWith("-") ? -1n : 1n;
    const intPart = stripGroupedDecimalDigits(parts[0].startsWith("-") ? parts[0].slice(1) : parts[0]);
    const fracPart = stripGroupedDecimalDigits(parts[1]);
    const den = 10n ** BigInt(fracPart.length);
    const num = sign * (BigInt(intPart) * den + BigInt(fracPart));
    return new Rational(num, den);
  }
  try {
    return new Integer(str);
  } catch {
    throw new Error(`Invalid number format: ${str}`);
  }
}
function parseRepeatingDecimalLiteral(str) {
  const isNeg = str.startsWith("-");
  const s = isNeg ? str.slice(1) : str;
  const hashIdx = s.indexOf("#");
  if (hashIdx === -1)
    throw new Error(`Expected # in repeating decimal: ${str}`);
  const nonRepStr = s.slice(0, hashIdx);
  const repStr = s.slice(hashIdx + 1);
  if (repStr === "" || repStr === "0") {
    return parseLiteral(isNeg ? "-" + nonRepStr : nonRepStr);
  }
  let intStr, fracStr;
  if (nonRepStr.includes(".")) {
    const dotIdx = nonRepStr.indexOf(".");
    intStr = nonRepStr.slice(0, dotIdx) || "0";
    fracStr = nonRepStr.slice(dotIdx + 1);
  } else {
    intStr = nonRepStr || "0";
    fracStr = "";
  }
  const cleanInt = stripGroupedDecimalDigits(intStr || "0");
  const cleanFrac = stripGroupedDecimalDigits(fracStr || "");
  const cleanRep = stripGroupedDecimalDigits(repStr);
  const n = cleanFrac.length;
  const m = cleanRep.length;
  const fullStr = cleanInt + cleanFrac + cleanRep;
  const baseStr = cleanInt + cleanFrac || "0";
  const full = BigInt(fullStr);
  const base = BigInt(baseStr || "0");
  const den = 10n ** BigInt(n) * (10n ** BigInt(m) - 1n);
  const num = full - base;
  const result = new Rational(isNeg ? -num : num, den);
  return result;
}
function recordTraceWrite(context, name, oldVal, newVal) {
  const tc = context.getEnv("__trace_context__");
  if (tc && tc.active && tc.currentDepth <= tc.depth) {
    if (tc.trackedVars.size === 0 || tc.trackedVars.has(name)) {
      tc.log.push({
        event: "write",
        var: name,
        old: oldVal,
        new: newVal,
        depth: tc.currentDepth
      });
    }
  }
}
function resolveAssignName(arg, evaluate) {
  let name = typeof arg === "object" && arg !== null && arg.fn ? evaluate(arg) : arg;
  if (name && typeof name === "object" && name.type === "string") {
    name = name.value;
  }
  return name;
}
function checkLocked(value) {
  const ext = value?._ext;
  if (ext?.get("lock")) {
    throw new Error("Cannot update value: cell is locked. Use = or := to rebind instead.");
  }
}
function checkFrozenImmutable(value) {
  const ext = value?._ext;
  if (ext?.get("immutable")) {
    throw new Error("Cannot update value: cell is immutable");
  }
  if (ext?.get("frozen")) {
    throw new Error("Cannot update value: cell is frozen");
  }
}
function refreshRuntimeMetadataIfObject(value) {
  if (!value || typeof value !== "object")
    return value;
  return refreshRuntimeMetadata(value, value?._ext?.get("_proto") ?? null);
}
function performUpdate(name, rhsValue, context, depth, evaluate = null) {
  const copyFn = depth === "deep" ? deepCopyValue : shallowCopyValue;
  const cell = context.getCell(name);
  if (cell) {
    const oldValue = cell.value;
    checkLocked(oldValue);
    checkFrozenImmutable(oldValue);
    let newValue2 = copyFn(rhsValue);
    transferMetaForUpdate(oldValue, newValue2, rhsValue, depth);
    newValue2 = applyUpdateSemantics(oldValue, newValue2, context, evaluate);
    attachBuiltinProto(newValue2);
    refreshRuntimeMetadataIfObject(newValue2);
    recordTraceWrite(context, name, oldValue, newValue2);
    cell.value = newValue2;
    return newValue2;
  }
  const newValue = copyFn(rhsValue);
  transferMetaForUpdate(null, newValue, rhsValue, depth);
  attachBuiltinProto(newValue);
  refreshRuntimeMetadataIfObject(newValue);
  recordTraceWrite(context, name, null, newValue);
  context.setFresh(name, newValue);
  return newValue;
}
function performOuterUpdate(name, rhsValue, context, depth, evaluate = null) {
  const copyFn = depth === "deep" ? deepCopyValue : shallowCopyValue;
  const cell = context.getOuterCell(name);
  if (cell) {
    const oldValue = cell.value;
    checkLocked(oldValue);
    checkFrozenImmutable(oldValue);
    let newValue = copyFn(rhsValue);
    transferMetaForUpdate(oldValue, newValue, rhsValue, depth);
    newValue = applyUpdateSemantics(oldValue, newValue, context, evaluate);
    attachBuiltinProto(newValue);
    refreshRuntimeMetadataIfObject(newValue);
    recordTraceWrite(context, name, oldValue, newValue);
    cell.value = newValue;
    return newValue;
  }
  throw new Error(`Cannot update outer variable '@${name}' because it does not exist in any outer scope.`);
}
function assignmentOpToBindingMode(op) {
  if (op === "=")
    return "alias";
  if (op === ":=")
    return "copy";
  if (op === "~=")
    return "refresh";
  if (op === "::=")
    return "deep_copy";
  if (op === "~~=")
    return "deep_refresh";
  throw new Error(`Unsupported destructuring assignment operator: ${op}`);
}
function createMutableSequence(values) {
  return attachBuiltinProto({
    type: "sequence",
    values,
    _ext: new Map([["_mutable", new Integer(1n)]])
  });
}
function createMutableMap(entries) {
  return attachBuiltinProto({
    type: "map",
    entries: new Map(entries),
    _ext: new Map([["_mutable", new Integer(1n)]])
  });
}
function createTupleValue(values) {
  return attachBuiltinProto({ type: "tuple", values });
}
function isSequenceLike(value) {
  return value && (value.type === "sequence" || value.type === "array");
}
function isTupleLike(value) {
  return value && value.type === "tuple";
}
function isMapLike(value) {
  return value && (value.type === "map" || value.type === "export_bundle");
}
function makeSourceRef(value, cell = null) {
  return { value, cell };
}
function unwrapDestructureTarget(target, outerMode) {
  let current = target;
  let bindingMode = null;
  let semanticHeader = null;
  while (current?.type === "DestructureBindingModeTarget" || current?.type === "DestructureSemanticTarget") {
    if (current.type === "DestructureBindingModeTarget") {
      bindingMode = current.bindingMode;
      current = current.target;
    } else {
      semanticHeader = current.header || semanticHeader;
      if (!bindingMode && current.header?.captureMode) {
        bindingMode = current.header.captureMode;
      }
      current = current.target;
    }
  }
  return {
    base: current,
    bindingMode: bindingMode || outerMode,
    semanticHeader
  };
}
function applyDestructureSemanticHeader(value, header, context, evaluate = null) {
  if (isHole(value) || !header) {
    return value;
  }
  for (const trait of header.traits || []) {
    if (!valueSatisfiesTrait(value, trait.name)) {
      throw new Error(`Trait required by destructuring header not satisfied: ${trait.name}`);
    }
  }
  return applySemanticHeader(value, header, context, { evaluate });
}
function bindDestructuredName(name, sourceRef, bindingMode, context, evaluate = null) {
  const value = sourceRef.value;
  if (bindingMode === "alias") {
    recordTraceWrite(context, name, context.get(name) ?? null, value);
    if (sourceRef.cell) {
      context.setCell(name, sourceRef.cell);
    } else {
      context.setFresh(name, value);
    }
    return value;
  }
  if (bindingMode === "copy") {
    const newValue = shallowCopyValue(value);
    copyAllMeta(value, newValue, "shallow");
    recordTraceWrite(context, name, context.get(name) ?? null, newValue);
    context.setFresh(name, newValue);
    return newValue;
  }
  if (bindingMode === "deep_copy") {
    const newValue = deepCopyValue(value);
    copyAllMeta(value, newValue, "deep");
    recordTraceWrite(context, name, context.get(name) ?? null, newValue);
    context.setFresh(name, newValue);
    return newValue;
  }
  if (bindingMode === "refresh") {
    return performUpdate(name, value, context, "shallow", evaluate);
  }
  if (bindingMode === "deep_refresh") {
    return performUpdate(name, value, context, "deep", evaluate);
  }
  throw new Error(`Unknown destructuring binding mode: ${bindingMode}`);
}
function bindDestructureTarget(target, sourceRef, outerMode, context, evaluate = null) {
  const resolved = unwrapDestructureTarget(target, outerMode);
  const preparedValue = applyDestructureSemanticHeader(sourceRef.value, resolved.semanticHeader, context, evaluate);
  const preparedRef = makeSourceRef(preparedValue, sourceRef.cell);
  if (resolved.base?.type !== "DestructureVariableTarget") {
    throw new Error("Rest capture target must resolve to a variable");
  }
  return bindDestructuredName(resolved.base.name, preparedRef, resolved.bindingMode, context, evaluate);
}
function evaluatePatternKey(spec, evaluate) {
  if (typeof spec === "string")
    return spec;
  if (spec?.type === "MapKeyIdentifier")
    return spec.value;
  if (spec && typeof spec === "object" && !spec.fn && spec.type === "String") {
    return keyOf({ type: "string", value: spec.value });
  }
  return keyOf(evaluate(spec));
}
function evaluateIndexedSpecs(specs, evaluate) {
  return (specs || []).map((spec) => {
    if (spec.kind === "full") {
      return { kind: "full" };
    }
    if (spec.kind === "slice") {
      return {
        kind: "slice",
        start: evaluate(spec.start),
        end: evaluate(spec.end)
      };
    }
    return {
      kind: "index",
      value: evaluate(spec.value)
    };
  });
}
function isIndexedDestructurePattern(target, outerMode) {
  return unwrapDestructureTarget(target, outerMode).base?.type === "DestructureIndexedTarget";
}
function missingSimpleBind(pattern, outerMode, context) {
  bindDestructureTarget(pattern, makeSourceRef(HOLE), outerMode, context, null);
}
function destructureInto(pattern, sourceRef, outerMode, context, evaluate) {
  const resolved = unwrapDestructureTarget(pattern, outerMode);
  const base = resolved.base;
  if (base?.type === "DestructureVariableTarget") {
    bindDestructureTarget(pattern, sourceRef, outerMode, context, evaluate);
    return;
  }
  if (base?.type === "DestructureIndexedTarget") {
    const selection = bracketGetResolved(sourceRef.value, evaluateIndexedSpecs(base.specs, evaluate));
    const selectedRef = makeSourceRef(selection);
    if (base.wholeTarget) {
      bindDestructureTarget(base.wholeTarget, selectedRef, resolved.bindingMode, context, evaluate);
    }
    if (base.nestedTarget) {
      destructureInto(base.nestedTarget, selectedRef, resolved.bindingMode, context, evaluate);
    }
    if (!base.wholeTarget && !base.nestedTarget) {
      throw new Error("Malformed indexed destructuring syntax");
    }
    return;
  }
  if (base?.type === "DestructureArrayPattern") {
    const value = sourceRef.value;
    const needsPositional = base.entries.some((entry) => !isIndexedDestructurePattern(entry, resolved.bindingMode));
    if (needsPositional && !isSequenceLike(value)) {
      throw new Error("Wrong rhs kind for array destructuring pattern");
    }
    let positionalIndex = 0;
    for (let i = 0;i < base.entries.length; i++) {
      const entryTarget = base.entries[i];
      if (isIndexedDestructurePattern(entryTarget, resolved.bindingMode)) {
        destructureInto(entryTarget, sourceRef, resolved.bindingMode, context, evaluate);
        continue;
      }
      const item = positionalIndex < value.values.length ? makeSourceRef(value.values[positionalIndex]) : null;
      positionalIndex += 1;
      const simple = unwrapDestructureTarget(entryTarget, resolved.bindingMode).base?.type === "DestructureVariableTarget";
      if (!item) {
        if (simple) {
          missingSimpleBind(entryTarget, resolved.bindingMode, context);
        } else {
          throw new Error("Missing required nested structure");
        }
      } else {
        destructureInto(entryTarget, item, resolved.bindingMode, context, evaluate);
      }
    }
    if (base.rest) {
      const restValues = value.values.slice(positionalIndex);
      bindDestructureTarget(base.rest.target, makeSourceRef(createMutableSequence(restValues)), resolved.bindingMode, context, evaluate);
    }
    return;
  }
  if (base?.type === "DestructureTuplePattern") {
    const value = sourceRef.value;
    const needsPositional = base.entries.some((entry) => !isIndexedDestructurePattern(entry, resolved.bindingMode));
    if (needsPositional && !isTupleLike(value)) {
      throw new Error("Wrong rhs kind for tuple destructuring pattern");
    }
    let positionalIndex = 0;
    for (let i = 0;i < base.entries.length; i++) {
      const entryTarget = base.entries[i];
      if (isIndexedDestructurePattern(entryTarget, resolved.bindingMode)) {
        destructureInto(entryTarget, sourceRef, resolved.bindingMode, context, evaluate);
        continue;
      }
      const item = positionalIndex < value.values.length ? makeSourceRef(value.values[positionalIndex]) : null;
      positionalIndex += 1;
      const simple = unwrapDestructureTarget(entryTarget, resolved.bindingMode).base?.type === "DestructureVariableTarget";
      if (!item) {
        if (simple) {
          missingSimpleBind(entryTarget, resolved.bindingMode, context);
        } else {
          throw new Error("Missing required nested structure");
        }
      } else {
        destructureInto(entryTarget, item, resolved.bindingMode, context, evaluate);
      }
    }
    if (base.rest) {
      const restValues = value.values.slice(positionalIndex);
      bindDestructureTarget(base.rest.target, makeSourceRef(createTupleValue(restValues)), resolved.bindingMode, context, evaluate);
    }
    return;
  }
  if (base?.type === "DestructureMapPattern") {
    const value = sourceRef.value;
    if (!isMapLike(value)) {
      throw new Error("Wrong rhs kind for map destructuring pattern");
    }
    const seenKeys = new Set;
    for (const entry of base.entries) {
      const key = evaluatePatternKey(entry.sourceKey, evaluate);
      seenKeys.add(key);
      let itemRef = null;
      if (value.type === "export_bundle" && value.entries instanceof Map && value.entries.has(key)) {
        const cell = value.entries.get(key);
        itemRef = makeSourceRef(cell?.value, cell || null);
      } else if (value.entries instanceof Map && value.entries.has(key)) {
        itemRef = makeSourceRef(value.entries.get(key));
      }
      const simpleOnly = Boolean(entry.wholeTarget) && !entry.nestedTarget;
      if (!itemRef) {
        if (simpleOnly) {
          missingSimpleBind(entry.wholeTarget, resolved.bindingMode, context);
          continue;
        }
        throw new Error("Missing required nested structure");
      }
      if (entry.wholeTarget) {
        bindDestructureTarget(entry.wholeTarget, itemRef, resolved.bindingMode, context, evaluate);
      }
      if (entry.nestedTarget) {
        destructureInto(entry.nestedTarget, itemRef, resolved.bindingMode, context, evaluate);
      }
    }
    if (base.rest) {
      const restEntries = [];
      if (value.entries instanceof Map) {
        for (const [key, entryValue] of value.entries.entries()) {
          if (!seenKeys.has(key)) {
            restEntries.push([key, value.type === "export_bundle" ? entryValue.value : entryValue]);
          }
        }
      }
      bindDestructureTarget(base.rest.target, makeSourceRef(createMutableMap(restEntries)), resolved.bindingMode, context, evaluate);
    }
    return;
  }
  if (base?.type === "DestructureTensorPattern") {
    const value = sourceRef.value;
    if (!isTensor(value)) {
      throw new Error("Wrong rhs kind for tensor destructuring pattern");
    }
    const shape = base.shape || [];
    if (shape.length !== value.shape.length || shape.some((dim, idx) => dim !== value.shape[idx])) {
      throw new Error("Tensor destructuring shape mismatch");
    }
    for (let row = 0;row < base.rows.length; row++) {
      for (let col = 0;col < base.rows[row].length; col++) {
        const offset = value.offset + row * value.strides[0] + col * value.strides[1];
        destructureInto(base.rows[row][col], makeSourceRef(value.data[offset]), resolved.bindingMode, context, evaluate);
      }
    }
    return;
  }
  throw new Error("Invalid destructuring target");
}
function deepSetMutable(value, flag, visited = new Set) {
  if (!value || typeof value !== "object")
    return value;
  if (visited.has(value))
    return value;
  visited.add(value);
  const supportsMutable = value.type === "sequence" || value.type === "tuple" || value.type === "map" || value.type === "set" || isTensor(value);
  const hasChildren = supportsMutable;
  if (!hasChildren)
    return value;
  if (supportsMutable) {
    if (!value._ext)
      value._ext = new Map;
    if (flag === null) {
      value._ext.delete("_mutable");
    } else {
      value._ext.set("_mutable", new Integer(1n));
    }
  }
  if (value.type === "sequence" || value.type === "tuple" || value.type === "set") {
    for (const v of value.values)
      deepSetMutable(v, flag, visited);
  } else if (value.type === "map" && value.entries instanceof Map) {
    for (const v of value.entries.values())
      deepSetMutable(v, flag, visited);
  }
  return value;
}
var coreFunctions = {
  LITERAL: {
    impl(args) {
      return parseLiteral(args[0]);
    },
    pure: true,
    doc: "Parse a number literal string into a ratmath type"
  },
  VALUE_OUTFIT: {
    lazy: true,
    impl(args, context, evaluate) {
      const header = args[0] || null;
      return evaluateOutfitValue(header, args[1], context, evaluate);
    },
    doc: "Apply semantic/value outfitting metadata to a value"
  },
  SEMANTIC_HAS: {
    lazy: true,
    impl(args, context, evaluate) {
      const value = evaluate(args[0]);
      const name = args[1];
      return valueHasSemanticMembership(value, name) ? new Integer(1n) : null;
    },
    doc: "Check semantic type/trait membership against __type, _type, and __traits"
  },
  SEMANTIC_CONVERT_SOFT: {
    lazy: true,
    impl(args, context, evaluate) {
      const typeName = args[1];
      if (typeof typeName !== "string" || typeName.length === 0) {
        throw new Error("Soft semantic conversion requires a colon-string target like :rational");
      }
      const value = captureIrValue(args[0], constructorDefaultCaptureMode(context), context, evaluate);
      const converted = convertSemanticType(value, typeName, context, {
        strict: false,
        warnOnFailure: conversionWarningsEnabled(context),
        evaluate
      });
      return converted === null ? null : finalizeSemanticValue(converted, context);
    },
    doc: "Convert a value to a semantic type, returning null on failure"
  },
  SEMANTIC_CONVERT_STRICT: {
    lazy: true,
    impl(args, context, evaluate) {
      const typeName = args[1];
      if (typeof typeName !== "string" || typeName.length === 0) {
        throw new Error("Strict semantic conversion requires a colon-string target like :rational");
      }
      const value = captureIrValue(args[0], constructorDefaultCaptureMode(context), context, evaluate);
      return finalizeSemanticValue(convertSemanticType(value, typeName, context, {
        strict: true,
        evaluate
      }), context);
    },
    doc: "Convert a value to a semantic type, throwing on failure"
  },
  TYPE_EXPORT: {
    lazy: true,
    impl(args, context, evaluate) {
      return exportByRegisteredTypeRuntime(evaluate(args[0]), context, evaluate);
    },
    doc: "Export a semantically typed value through its registered type exporter"
  },
  TYPE_IMPORT: {
    lazy: true,
    impl(args, context, evaluate) {
      return importByRegisteredTypeRuntime(evaluate(args[0]), context, evaluate);
    },
    doc: "Import a value from a tagged type export map"
  },
  TRAIT_REGISTER: {
    impl(args, context) {
      registerTraitFromRixSpec(args[0], context);
      return args[0];
    },
    doc: "Register an immutable semantic trait from a RiX map spec"
  },
  CAPABILITY_REGISTER: {
    impl(args, context, evaluate) {
      if (!context.getEnv("allowCapabilityRegister", false)) {
        throw new Error("CapabilityRegister is only available during trusted package startup");
      }
      const systemContext = context.getEnv("__system_context__", null);
      if (!systemContext) {
        throw new Error("CapabilityRegister requires an active system context");
      }
      const rawName = args[0]?.type === "string" ? args[0].value : String(args[0] ?? "");
      const name = rawName.toUpperCase();
      if (!name)
        throw new Error("CapabilityRegister requires a capability name");
      const fn = capturePackageCallable(args[1], context);
      systemContext._capabilities.set(name, {
        impl(callArgs, callContext, callEvaluate) {
          return callWithConcreteArgs(fn, callArgs, callContext, callEvaluate);
        },
        lazy: false,
        pure: false,
        doc: args[2]?.type === "string" ? args[2].value : "Package capability"
      });
      return args[0];
    },
    doc: "Register a package system capability during trusted package startup"
  },
  TYPE_REGISTER: {
    impl(args, context) {
      registerTypeFromRixSpec(args[0], context);
      return args[0];
    },
    doc: "Register an immutable semantic type from a RiX map spec"
  },
  TYPE_INSTALL: {
    impl(args, context, evaluate) {
      const registry = context.getEnv("__registry__", null);
      if (!registry)
        throw new Error("TypeInstall requires an active registry");
      const name = args[0]?.type === "string" ? args[0].value : String(args[0]);
      installRegisteredTypes(registry, [name]);
      return args[0];
    },
    doc: "Install a registered semantic type into system multifunctions"
  },
  IMPORT_JS: {
    impl(args, context) {
      return importJSModule(args[0], context);
    },
    doc: "Import a local JavaScript module for use from a .js.rix startup file"
  },
  JS_CALL: {
    impl(args, context) {
      return callJSModule(args[0], args[1], args.slice(2), context);
    },
    doc: "Call a named export from a local JavaScript module"
  },
  DEFINEBASE: {
    lazy: true,
    impl(args, context, evaluate) {
      const letter = args[0];
      if (!/^[A-Z]$/.test(letter)) {
        throw new Error("Base definition requires uppercase prefix letter");
      }
      if (BaseSystem.hasExactPrefix(letter)) {
        throw new Error(`Base prefix 0${letter} is already defined`);
      }
      const rhsNode = args[1];
      let rhsValue;
      if (rhsNode && rhsNode.fn === "LITERAL" && typeof rhsNode.args?.[0] === "string" && /^0([A-Za-z])$/.test(rhsNode.args[0])) {
        rhsValue = rhsNode.args[0];
      } else {
        rhsValue = evaluate(rhsNode);
      }
      const baseSystem = resolveBaseSpecFromValue(rhsValue);
      ensureSafeDigits(baseSystem);
      BaseSystem.registerPrefix(letter, baseSystem);
      return new Integer(1n);
    },
    doc: "Define a custom uppercase base prefix (0A = ...), one-time global definition"
  },
  TOBASE: {
    lazy: true,
    impl(args, context, evaluate) {
      const value = evaluate(args[0]);
      const specNode = args[1];
      const modeNode = args[2];
      const evalBaseSpecNode = (node) => {
        if (node && node.fn === "LITERAL" && typeof node.args?.[0] === "string" && /^0([A-Za-z])$/.test(node.args[0])) {
          return node.args[0];
        }
        return evaluate(node);
      };
      let baseSpecValue = evalBaseSpecNode(specNode);
      let modeSpec = modeNode !== undefined ? resolveModeSpec(evaluate(modeNode)) : { mode: 1 };
      if (baseSpecValue && baseSpecValue.type === "tuple" && Array.isArray(baseSpecValue.values) && baseSpecValue.values.length === 2) {
        const second = baseSpecValue.values[1];
        try {
          modeSpec = resolveModeSpec(second);
          baseSpecValue = baseSpecValue.values[0];
        } catch {}
      } else if (baseSpecValue && baseSpecValue.type === "string") {
        try {
          modeSpec = resolveModeSpec(baseSpecValue);
          baseSpecValue = new Integer(10n);
        } catch {}
      }
      const baseSystem = resolveBaseSpecFromValue(baseSpecValue);
      const text = toBaseString(value, baseSystem, modeSpec);
      return { type: "string", value: text };
    },
    doc: "Format number to base string: expr _> baseSpec"
  },
  FROMBASE: {
    lazy: true,
    impl(args, context, evaluate) {
      const strVal = evaluate(args[0]);
      const specNode = args[1];
      const baseSpecValue = specNode && specNode.fn === "LITERAL" && typeof specNode.args?.[0] === "string" && /^0([A-Za-z])$/.test(specNode.args[0]) ? specNode.args[0] : evaluate(specNode);
      const text = strVal && strVal.type === "string" ? strVal.value : strVal;
      if (typeof text !== "string")
        throw new Error("FROMBASE expects a string left operand");
      const baseSystem = resolveBaseSpecFromValue(baseSpecValue);
      return fromBaseString(text, baseSystem);
    },
    doc: "Parse base string to number: str <_ baseSpec"
  },
  REGEX: {
    impl(args) {
      const patternObj = args[0];
      const flagsObj = args[1];
      const pattern = patternObj && patternObj.type === "string" ? patternObj.value : String(patternObj || "");
      const flags = flagsObj && flagsObj.type === "string" ? flagsObj.value : String(flagsObj || "");
      const modeObj = args[2];
      const mode = modeObj && modeObj.constructor.name === "Integer" ? Number(modeObj.value) : Number(modeObj);
      let actualFlags = flags;
      if ((mode === 2 || mode === 3) && !actualFlags.includes("g")) {
        actualFlags += "g";
      }
      if (!actualFlags.includes("d")) {
        actualFlags += "d";
      }
      let re;
      try {
        re = new RegExp(pattern, actualFlags);
      } catch (e) {
        throw new Error(`unsupported regex flag or pattern: ${e.message}`);
      }
      const buildMatchObject = (match) => {
        const groups = [];
        const spans = [];
        for (let i = 0;i < match.length; i++) {
          const text = match[i];
          groups.push(text === undefined ? null : { type: "string", value: text });
          if (match.indices && match.indices[i]) {
            const [start, end] = match.indices[i];
            spans.push({
              type: "tuple",
              values: [
                new Integer(BigInt(start + 1)),
                new Integer(BigInt(end))
              ]
            });
          } else {
            spans.push(null);
          }
        }
        const named = new Map;
        const namedSpans = new Map;
        if (match.groups) {
          for (const [key, text] of Object.entries(match.groups)) {
            named.set(key, text === undefined ? null : { type: "string", value: text });
            if (match.indices && match.indices.groups && match.indices.groups[key]) {
              const [s, e] = match.indices.groups[key];
              namedSpans.set(key, {
                type: "tuple",
                values: [
                  new Integer(BigInt(s + 1)),
                  new Integer(BigInt(e))
                ]
              });
            } else {
              namedSpans.set(key, null);
            }
          }
        }
        const entries = new Map;
        entries.set("text", { type: "string", value: match[0] });
        entries.set("span", spans[0]);
        entries.set("groups", { type: "sequence", values: groups });
        entries.set("spans", { type: "sequence", values: spans });
        entries.set("named", { type: "map", entries: named });
        entries.set("named spans", { type: "map", entries: namedSpans });
        entries.set("input", { type: "string", value: match.input });
        return { type: "map", entries };
      };
      const regexFunc = (inputVal) => {
        const str = inputVal && inputVal.type === "string" ? inputVal.value : inputVal;
        if (typeof str !== "string") {
          throw new Error("regex expects string");
        }
        re.lastIndex = 0;
        if (mode === 0) {
          const m = re.exec(str);
          return m ? buildMatchObject(m) : null;
        } else if (mode === 1) {
          return re.test(str) ? new Integer(1n) : null;
        } else if (mode === 2) {
          const results = [];
          let m;
          while ((m = re.exec(str)) !== null) {
            results.push(buildMatchObject(m));
            if (m[0].length === 0) {
              re.lastIndex++;
            }
          }
          return { type: "sequence", values: results };
        } else if (mode === 3) {
          const matches = [];
          let isExhausted = false;
          let lastIdx = 0;
          const fetchNext = () => {
            if (isExhausted)
              return null;
            re.lastIndex = lastIdx;
            const m = re.exec(str);
            lastIdx = re.lastIndex;
            if (m) {
              const obj = buildMatchObject(m);
              matches.push(obj);
              if (m[0].length === 0) {
                re.lastIndex++;
                lastIdx++;
              }
              return obj;
            } else {
              isExhausted = true;
              return null;
            }
          };
          let currentIndex = 0;
          const iteratorFunc = (nVal) => {
            if (nVal !== undefined && nVal !== null) {
              const n = Number(nVal instanceof Integer ? nVal.value : nVal);
              if (isNaN(n) || n < 1) {
                throw new Error("iterator index must be a positive integer");
              }
              while (!isExhausted && matches.length < n) {
                fetchNext();
              }
              currentIndex = n;
              return n <= matches.length ? matches[n - 1] : null;
            } else {
              currentIndex++;
              if (currentIndex <= matches.length) {
                return matches[currentIndex - 1];
              } else {
                return fetchNext();
              }
            }
          };
          iteratorFunc.toString = () => {
            return `[Regex Iterator: {/${pattern}/${flags}} (NextIndex=${currentIndex})]`;
          };
          return iteratorFunc;
        }
      };
      regexFunc.toString = () => {
        const modeNames = ["ONE", "TEST", "ALL", "ITER"];
        const modeName = modeNames[mode];
        const signatures = [
          "(String) -> Match|null",
          "(String) -> 1|null",
          "(String) -> Sequence<Match>",
          "(String) -> Iterator"
        ];
        return `[Regex ${modeName}: {/${pattern}/${flags}} ${signatures[mode]}]`;
      };
      return regexFunc;
    },
    doc: "Create a regex matching function"
  },
  STRING: {
    impl(args) {
      return { type: "string", value: args[0] };
    },
    pure: true,
    doc: "Create a string value"
  },
  NULL: {
    impl() {
      return null;
    },
    pure: true,
    doc: "Null value"
  },
  HOLE: {
    impl() {
      return HOLE;
    },
    holeAware: true,
    pure: true,
    doc: "Internal hole/undefined sentinel — represents an explicitly omitted value"
  },
  HOLE_COALESCE: {
    lazy: true,
    holeAware: true,
    impl(args, _ctx, evalFn) {
      const left = evalFn(args[0]);
      if (isHole(left))
        return evalFn(args[1]);
      return left;
    },
    doc: "Hole-coalescing: x ?| y returns x if x is not a hole, else y"
  },
  NOP: {
    impl() {
      return null;
    },
    pure: true,
    doc: "No operation"
  },
  RETRIEVE: {
    impl(args, context) {
      const name = args[0];
      const value = context.get(name);
      if (value === undefined) {
        throw new Error(`Undefined variable: ${name}`);
      }
      return value;
    },
    doc: "Look up a variable in the current scope chain"
  },
  SELF: {
    impl(_args, context) {
      const callable = context.getCurrentCallable();
      if (callable === undefined) {
        throw new Error("Self reference '$' is only valid within a function body");
      }
      return callable;
    },
    doc: "Resolve the current callable object inside a function body"
  },
  PARENT_SELF: {
    impl(_args, context) {
      const callable = context.getParentCallable();
      if (callable === undefined || callable === null) {
        throw new Error("Parent self reference '$$' is only valid within a multifunction variant body");
      }
      return callable;
    },
    doc: "Resolve the parent multifunction inside a variant body"
  },
  OUTER_RETRIEVE: {
    impl(args, context) {
      const name = args[0];
      const value = context.getOuter(name);
      if (value === undefined) {
        throw new Error(`Undefined outer variable: @${name}`);
      }
      return value;
    },
    doc: "Look up a variable strictly in the outer scope chains"
  },
  ASSIGN: {
    lazy: true,
    impl(args, context, evaluate) {
      const name = resolveAssignName(args[0], evaluate);
      const rhsIR = args[1];
      if (rhsIR && typeof rhsIR === "object" && rhsIR.fn === "RETRIEVE") {
        const rhsName = rhsIR.args[0];
        const cell = context.getCell(rhsName);
        if (cell) {
          recordTraceWrite(context, name, context.get(name) ?? null, cell.value);
          context.setCell(name, cell);
          return cell.value;
        }
      }
      if (rhsIR && typeof rhsIR === "object" && rhsIR.fn === "OUTER_RETRIEVE") {
        const rhsName = rhsIR.args[0];
        const cell = context.getOuterCell(rhsName);
        if (cell) {
          recordTraceWrite(context, name, context.get(name) ?? null, cell.value);
          context.setCell(name, cell);
          return cell.value;
        }
      }
      const value = maybeAutoMarkMultifunction(name, evaluate(rhsIR));
      recordTraceWrite(context, name, context.get(name) ?? null, value);
      context.setFresh(name, value);
      return value;
    },
    doc: "Alias/rebind — lhs shares the same Cell as rhs variable, or gets a fresh Cell for expressions"
  },
  ASSIGN_COPY: {
    lazy: true,
    impl(args, context, evaluate) {
      const name = resolveAssignName(args[0], evaluate);
      const rhsValue = evaluate(args[1]);
      const newValue = shallowCopyValue(rhsValue);
      copyAllMeta(rhsValue, newValue, "shallow");
      recordTraceWrite(context, name, context.get(name) ?? null, newValue);
      context.setFresh(name, newValue);
      return newValue;
    },
    doc: "Fresh copied-cell assignment (:=) — shallow-copy value + all meta into new binding"
  },
  ASSIGN_UPDATE: {
    lazy: true,
    impl(args, context, evaluate) {
      const name = resolveAssignName(args[0], evaluate);
      const rhsValue = evaluate(args[1]);
      return performUpdate(name, rhsValue, context, "shallow", evaluate);
    },
    doc: "In-place value replacement (~=) — preserves cell identity, ordinary meta; replaces ephemeral; preserves sticky unless rhs overrides"
  },
  ASSIGN_DEEP_COPY: {
    lazy: true,
    impl(args, context, evaluate) {
      const name = resolveAssignName(args[0], evaluate);
      const rhsValue = evaluate(args[1]);
      const newValue = deepCopyValue(rhsValue);
      copyAllMeta(rhsValue, newValue, "deep");
      recordTraceWrite(context, name, context.get(name) ?? null, newValue);
      context.setFresh(name, newValue);
      return newValue;
    },
    doc: "Fresh deep-copied-cell assignment (::=) — deep-copy value + all meta into new binding"
  },
  ASSIGN_DEEP_UPDATE: {
    lazy: true,
    impl(args, context, evaluate) {
      const name = resolveAssignName(args[0], evaluate);
      const rhsValue = evaluate(args[1]);
      return performUpdate(name, rhsValue, context, "deep", evaluate);
    },
    doc: "In-place deep value replacement (~~=) — like ~= but deep-copies rhs value"
  },
  DESTRUCTURE_ASSIGN: {
    lazy: true,
    impl(args, context, evaluate) {
      const pattern = args[0];
      const outerMode = assignmentOpToBindingMode(args[1]);
      const rhsValue = evaluate(args[2]);
      destructureInto(pattern, makeSourceRef(rhsValue), outerMode, context, evaluate);
      return rhsValue;
    },
    doc: "General lhs destructuring assignment"
  },
  OUTER_ASSIGN: {
    lazy: true,
    impl(args, context, evaluate) {
      const name = resolveAssignName(args[0], evaluate);
      const value = evaluate(args[1]);
      recordTraceWrite(context, name, context.getOuter(name) ?? null, value);
      context.setOuter(name, value);
      return value;
    },
    doc: "Assign a value to an existing outer scope variable"
  },
  OUTER_UPDATE: {
    lazy: true,
    impl(args, context, evaluate) {
      const name = resolveAssignName(args[0], evaluate);
      const rhsValue = evaluate(args[1]);
      const depth = args[2] || "shallow";
      return performOuterUpdate(name, rhsValue, context, depth, evaluate);
    },
    doc: "In-place value replacement on an outer scope variable (~= / ~~= with @)"
  },
  GLOBAL: {
    lazy: true,
    impl(args, context, evaluate) {
      const name = resolveAssignName(args[0], evaluate);
      const value = evaluate(args[1]);
      recordTraceWrite(context, name, context.globalScope.get(name)?.value ?? null, value);
      context.setGlobal(name, value);
      return value;
    },
    doc: "Assign a value to a variable in the global scope"
  },
  SYSREF: {
    impl(args, context) {
      const name = args[0];
      return { type: "sysref", name };
    },
    pure: true,
    doc: "Reference to a system function"
  },
  PLACEHOLDER: {
    impl(args) {
      return { type: "placeholder", index: args[0] };
    },
    pure: true,
    doc: "Placeholder for pattern matching"
  },
  ASSIGN_EXPR: {
    lazy: true,
    impl(args, context, evaluate) {
      const target = evaluate(args[0]);
      const value = evaluate(args[1]);
      if (target && target.type === "placeholder") {
        return value;
      }
      if (typeof target === "string") {
        recordTraceWrite(context, target, context.get(target) ?? null, value);
        context.set(target, value);
      }
      return value;
    },
    doc: "Assignment expression (lvalue = expr)"
  },
  BINOP: {
    impl(args) {
      const op = args[0];
      throw new Error(`Unrecognized operator "${op}"`);
    },
    pure: true,
    doc: "Fallback for unrecognized binary operators"
  },
  EVAL: {
    lazy: true,
    impl(args, context, evaluate) {
      if (args.length === 0) {
        throw new Error("Eval expects at least 1 argument");
      }
      const astNode = evaluate(args[0]);
      let evalNodes = [];
      if (astNode && typeof astNode === "object" && astNode.fn === "DEFER") {
        evalNodes = [astNode.args[0]];
      } else if (astNode && typeof astNode === "object" && astNode.type === "string") {
        const source = astNode.value;
        const runtime = context.getEnv("__script_runtime__");
        const systemLookup = runtime ? runtime.systemLookup : undefined;
        try {
          const tokens = tokenize(source);
          const ast = parse(tokens, systemLookup);
          evalNodes = lower(ast);
        } catch (e) {
          throw new Error(`Eval string parse error: ${e.message}`);
        }
      } else {
        throw new Error("Eval expects a deferred AST value or a string of RiX code");
      }
      let bindings = null;
      if (args.length >= 2) {
        bindings = evaluate(args[1]);
      }
      let mode = "inherit";
      if (args.length >= 3) {
        const modeVal = evaluate(args[2]);
        if (modeVal && modeVal.type === "string" && modeVal.kind === "colon") {
          mode = modeVal.value;
        } else if (modeVal && modeVal.type === "string") {
          mode = modeVal.value;
        } else if (modeVal !== null && modeVal !== undefined) {
          throw new Error("Eval mode must be a string or colon-string like :fresh or :inherit");
        }
      }
      if (mode !== "inherit" && mode !== "fresh") {
        throw new Error(`Eval mode must be 'inherit' or 'fresh', got '${mode}'`);
      }
      if (bindings !== null && bindings !== undefined && (!bindings.type || bindings.type !== "map")) {
        throw new Error("Eval bindings must be a map or null");
      }
      if (mode === "inherit" && (!bindings || bindings.entries.size === 0)) {
        let res = null;
        const runBody = () => {
          for (const irNode of evalNodes) {
            res = evaluate(irNode);
          }
          return res;
        };
        if (evalNodes.length === 1) {
          return context.withSharedBody(evalNodes[0], runBody);
        } else {
          return runBody();
        }
      }
      context.push(undefined, { isolated: mode === "fresh" });
      try {
        if (bindings && bindings.entries) {
          for (const [k, v] of bindings.entries) {
            if (typeof k !== "string") {
              throw new Error(`Eval binding key must be string, got ${String(k)}`);
            }
            context.setFresh(k, v);
          }
        }
        let res = null;
        const runBody = () => {
          for (const irNode of evalNodes) {
            res = evaluate(irNode);
          }
          return res;
        };
        if (evalNodes.length === 1) {
          return context.withSharedBody(evalNodes[0], runBody);
        } else {
          return runBody();
        }
      } finally {
        context.pop();
      }
    },
    doc: "Evaluate a deferred AST node or expression: .Eval(ast, bindings ?= _, mode ?= :inherit)"
  }
};

// ../rix/src/eval/functions/comparison.js
function compare2(a, b) {
  if (a && b && typeof a.subtract === "function" && typeof b.subtract === "function") {
    const diff = a.subtract(b);
    if (typeof diff.sign === "function")
      return Number(diff.sign().value ?? diff.sign());
    if (typeof diff.numerator === "bigint") {
      if (diff.numerator < 0n)
        return -1;
      if (diff.numerator > 0n)
        return 1;
      return 0;
    }
    if (typeof diff.value === "bigint") {
      if (diff.value < 0n)
        return -1;
      if (diff.value > 0n)
        return 1;
      return 0;
    }
  }
  const valA = a && a.type === "string" ? a.value : a;
  const valB = b && b.type === "string" ? b.value : b;
  if (valA < valB)
    return -1;
  if (valA > valB)
    return 1;
  return 0;
}
function boolResult2(val) {
  return val ? new Integer(1) : null;
}
function classifyMinMaxType(val) {
  if (val === null || val === undefined)
    return null;
  if (val instanceof Integer || val instanceof Rational)
    return "number";
  if (typeof val === "number" || typeof val === "bigint")
    return "number";
  if (typeof val === "string")
    return "string";
  if (val && typeof val === "object" && val.type === "string")
    return "string";
  return "invalid";
}
function resolveCell(irNode, context) {
  if (!irNode || typeof irNode !== "object")
    return null;
  if (irNode.fn === "RETRIEVE") {
    return context.getCell(irNode.args[0]);
  }
  if (irNode.fn === "OUTER_RETRIEVE") {
    return context.getOuterCell(irNode.args[0]);
  }
  return null;
}
function minMaxImpl(args, mode) {
  const filtered = args.filter((v) => v !== null && v !== undefined);
  if (filtered.length === 0) {
    throw new Error(`${mode} requires at least one non-null comparable argument`);
  }
  const valueType = classifyMinMaxType(filtered[0]);
  if (valueType === "invalid") {
    throw new Error(`${mode} only supports numbers or strings`);
  }
  for (let i = 1;i < filtered.length; i++) {
    const t = classifyMinMaxType(filtered[i]);
    if (t === "invalid" || t !== valueType) {
      throw new Error(`${mode} arguments must all be numbers or all be strings`);
    }
  }
  let best = filtered[0];
  for (let i = 1;i < filtered.length; i++) {
    const c = compare2(filtered[i], best);
    if (mode === "MIN" && c < 0 || mode === "MAX" && c > 0) {
      best = filtered[i];
    }
  }
  return best;
}
var comparisonFunctions = {
  EQ: {
    impl(args) {
      const [a, b] = args;
      if (a && b && typeof a.equals === "function") {
        return boolResult2(a.equals(b));
      }
      if (a && b && a.type === "string" && b.type === "string")
        return boolResult2(a.value === b.value);
      return boolResult2(a === b);
    },
    pure: true,
    doc: "Equality check — returns 1 or null"
  },
  NEQ: {
    impl(args) {
      const [a, b] = args;
      if (a && b && typeof a.equals === "function") {
        return boolResult2(!a.equals(b));
      }
      if (a && b && a.type === "string" && b.type === "string")
        return boolResult2(a.value !== b.value);
      return boolResult2(a !== b);
    },
    pure: true,
    doc: "Inequality check — returns 1 or null"
  },
  LT: {
    impl(args) {
      return boolResult2(compare2(args[0], args[1]) < 0);
    },
    pure: true,
    doc: "Less than — returns 1 or null"
  },
  GT: {
    impl(args) {
      return boolResult2(compare2(args[0], args[1]) > 0);
    },
    pure: true,
    doc: "Greater than — returns 1 or null"
  },
  LTE: {
    impl(args) {
      return boolResult2(compare2(args[0], args[1]) <= 0);
    },
    pure: true,
    doc: "Less than or equal — returns 1 or null"
  },
  GTE: {
    impl(args) {
      return boolResult2(compare2(args[0], args[1]) >= 0);
    },
    pure: true,
    doc: "Greater than or equal — returns 1 or null"
  },
  SAME_CELL: {
    lazy: true,
    impl(args, context, evalFn) {
      const leftCell = resolveCell(args[0], context);
      const rightCell = resolveCell(args[1], context);
      if (leftCell && rightCell && leftCell === rightCell) {
        return new Integer(1);
      }
      return null;
    },
    doc: "Identity comparison (===) — returns 1 if both sides refer to the same cell, null otherwise"
  },
  MIN: {
    impl(args) {
      return minMaxImpl(args, "MIN");
    },
    pure: true,
    doc: "Minimum over n arguments (ignores nulls)"
  },
  MAX: {
    impl(args) {
      return minMaxImpl(args, "MAX");
    },
    pure: true,
    doc: "Maximum over n arguments (ignores nulls)"
  }
};

// ../rix/src/eval/functions/logic.js
function isTruthy3(val) {
  return val !== null && val !== undefined;
}
var logicFunctions = {
  AND: {
    lazy: true,
    impl(args, ctx, evaluate) {
      let last = new Integer(1);
      for (const arg of args) {
        last = evaluate(arg);
        if (!isTruthy3(last))
          return last;
      }
      return last;
    },
    pure: true,
    doc: "Logical AND (short-circuits on first falsy, returns deciding value)"
  },
  OR: {
    lazy: true,
    impl(args, ctx, evaluate) {
      let last = null;
      for (const arg of args) {
        last = evaluate(arg);
        if (isTruthy3(last))
          return last;
      }
      return last;
    },
    pure: true,
    doc: "Logical OR (short-circuits on first truthy, returns deciding value)"
  },
  NOT: {
    impl(args) {
      return isTruthy3(args[0]) ? null : new Integer(1);
    },
    pure: true,
    doc: "Logical NOT — returns Integer(1) for null input, null otherwise"
  }
};

// ../rix/src/eval/functions/control.js
function isTruthy4(val) {
  return val !== null && val !== undefined;
}
function unwrapDefer(node) {
  if (node && node.fn === "DEFER" && node.args && node.args.length > 0) {
    return node.args[0];
  }
  return node;
}
function isHoleNode(node) {
  return Boolean(node) && node.fn === "HOLE";
}
function splitScopedBlockArgs(args) {
  const first = args[0];
  if (first && !first.fn && (Array.isArray(first.imports) || first.name !== undefined || first.maxIterations !== undefined || first.unlimited === true)) {
    return {
      imports: first.imports ?? [],
      containerName: first.name ?? null,
      maxIterations: first.maxIterations,
      unlimited: first.unlimited === true,
      bodyArgs: args.slice(1)
    };
  }
  return {
    imports: [],
    containerName: null,
    maxIterations: undefined,
    unlimited: false,
    bodyArgs: args
  };
}

class BreakSignal extends Error {
  constructor(targetType, targetName, value) {
    const targetParts = [];
    if (targetType)
      targetParts.push(targetType);
    if (targetName)
      targetParts.push(`'${targetName}'`);
    const targetLabel = targetParts.length > 0 ? targetParts.join(" ") : "breakable construct";
    super(`No matching break target found for ${targetLabel}`);
    this.name = "BreakSignal";
    this.kind = "break";
    this.targetType = targetType ?? null;
    this.targetName = targetName ?? null;
    this.value = value;
  }
}
function isBreakSignal(error) {
  return Boolean(error) && error.kind === "break";
}
function matchesBreakTarget(signal, targetType, targetName) {
  if (!isBreakSignal(signal))
    return false;
  if (signal.targetType !== null && signal.targetType !== targetType) {
    return false;
  }
  if (signal.targetName !== null && signal.targetName !== targetName) {
    return false;
  }
  return true;
}
function evaluateBreakValue(valueNode, context, evaluate) {
  context.push(undefined, { isolated: true, readThrough: true });
  try {
    return evaluate(valueNode);
  } finally {
    context.pop();
  }
}
function evaluateShared(node, context, evaluate) {
  return context.withSharedBody(node, () => evaluate(node));
}
function applyImports(imports, context) {
  for (const spec of imports) {
    if (spec.mode === "alias") {
      context.importAlias(spec.local, spec.source);
    } else {
      context.importCopy(spec.local, spec.source);
    }
  }
}
var controlFunctions = {
  SEQ: {
    lazy: true,
    impl(args, context, evaluate) {
      let result = null;
      for (const arg of args) {
        result = evaluate(arg);
      }
      return result;
    },
    doc: "Expression sequence: evaluate arguments left-to-right in the current scope and return the last value"
  },
  BLOCK: {
    lazy: true,
    impl(args, context, evaluate) {
      const { imports, containerName, bodyArgs } = splitScopedBlockArgs(args);
      const shareCurrentScope = context.consumeSharedBody("BLOCK");
      if (!shareCurrentScope)
        context.push(undefined, { isolated: true });
      try {
        applyImports(imports, context);
        let result = null;
        try {
          for (const stmt of bodyArgs) {
            result = evaluate(stmt);
          }
        } catch (error) {
          if (matchesBreakTarget(error, "block", containerName)) {
            return error.value;
          }
          throw error;
        }
        return result;
      } finally {
        if (!shareCurrentScope)
          context.pop();
      }
    },
    doc: "Sequential block execution, returns last value"
  },
  CASE: {
    lazy: true,
    impl(args, context, evaluate) {
      const { containerName, bodyArgs } = splitScopedBlockArgs(args);
      try {
        for (let i = 0;i < bodyArgs.length; i++) {
          const inner = unwrapDefer(bodyArgs[i]);
          if (inner && inner.fn === "CONDITION") {
            const condResult = evaluate(inner.args[0]);
            if (isTruthy4(condResult)) {
              return evaluate(inner.args[1]);
            }
            continue;
          }
          return evaluate(inner);
        }
      } catch (error) {
        if (matchesBreakTarget(error, "case", containerName)) {
          return error.value;
        }
        throw error;
      }
      return null;
    },
    doc: "Conditional case expression: {? cond ? action; ... ; default }"
  },
  LOOP: {
    lazy: true,
    impl(args, context, evaluate) {
      const { imports, containerName, maxIterations: configuredMax, unlimited, bodyArgs } = splitScopedBlockArgs(args);
      if (bodyArgs.length > 5) {
        throw new Error(`LOOP expected at most 5 arguments, got ${bodyArgs.length}`);
      }
      const [rawInitNode, rawCondNode, rawBodyNode, rawUpdateNode, rawAfterNode] = bodyArgs.map(unwrapDefer);
      const initNode = isHoleNode(rawInitNode) ? null : rawInitNode;
      const condNode = isHoleNode(rawCondNode) ? null : rawCondNode;
      const bodyNode = isHoleNode(rawBodyNode) ? null : rawBodyNode;
      const updateNode = isHoleNode(rawUpdateNode) ? null : rawUpdateNode;
      const afterNode = isHoleNode(rawAfterNode) ? null : rawAfterNode;
      const shareCurrentScope = context.consumeSharedBody("LOOP");
      if (!shareCurrentScope)
        context.push(undefined, { isolated: true });
      try {
        applyImports(imports, context);
        try {
          if (initNode)
            evaluateShared(initNode, context, evaluate);
          let result = null;
          let iterations = 0;
          const maxIterations = unlimited ? null : configuredMax ?? context.getEnv("defaultLoopMax", runtimeDefaults.defaultLoopMax);
          while (true) {
            if (condNode) {
              const condResult = evaluateShared(condNode, context, evaluate);
              if (!isTruthy4(condResult))
                break;
            }
            if (maxIterations !== null && iterations >= maxIterations) {
              throw new Error(`Loop exceeded max iteration count: ${maxIterations}`);
            }
            if (bodyNode) {
              result = evaluateShared(bodyNode, context, evaluate);
            }
            if (updateNode) {
              evaluateShared(updateNode, context, evaluate);
            }
            iterations++;
          }
          if (afterNode) {
            return evaluateShared(afterNode, context, evaluate);
          }
          return result;
        } catch (error) {
          if (matchesBreakTarget(error, "loop", containerName)) {
            return error.value;
          }
          throw error;
        }
      } finally {
        if (!shareCurrentScope)
          context.pop();
      }
    },
    doc: "Loop construct with init, condition, body[, update[, after]]"
  },
  TERNARY: {
    lazy: true,
    impl(args, context, evaluate) {
      const condResult = evaluate(args[0]);
      if (isTruthy4(condResult)) {
        return evaluate(unwrapDefer(args[1]));
      } else {
        return evaluate(unwrapDefer(args[2]));
      }
    },
    doc: "Ternary conditional: condition ?? trueExpr ?: falseExpr"
  },
  BREAK: {
    lazy: true,
    impl(args, context, evaluate) {
      const meta = args[0] && !args[0].fn ? args[0] : {};
      const valueNode = args[0] && !args[0].fn ? args[1] : args[0];
      const value = evaluateBreakValue(valueNode, context, evaluate);
      throw new BreakSignal(meta.targetType, meta.targetName, value);
    },
    doc: "Structured break block that exits the nearest matching breakable construct"
  },
  SYSTEM: {
    lazy: true,
    impl(args, context, evaluate) {
      const { imports, containerName, bodyArgs } = splitScopedBlockArgs(args);
      const shareCurrentScope = context.consumeSharedBody("SYSTEM");
      if (!shareCurrentScope)
        context.push(undefined, { isolated: true });
      try {
        applyImports(imports, context);
        let result = null;
        for (const stmt of bodyArgs) {
          result = evaluate(stmt);
        }
        return result;
      } finally {
        if (!shareCurrentScope)
          context.pop();
      }
    },
    doc: "Mathematical system container, currently evaluates as a block"
  }
};

// ../rix/src/eval/functions/methods.js
function evaluateArgs2(argNodes, evaluate) {
  const evaluatedArgs = [];
  for (const arg of argNodes) {
    if (arg && arg.fn === "SPREAD") {
      const spreadVal = evaluate(arg.args[0]);
      if (spreadVal && (spreadVal.type === "tuple" || spreadVal.type === "sequence" || spreadVal.type === "array" || spreadVal.type === "set")) {
        const items = spreadVal.values || spreadVal.elements || [];
        evaluatedArgs.push(...items);
      } else {
        throw new Error("Spread operator requires an iterable collection (array, tuple, sequence, set)");
      }
    } else {
      evaluatedArgs.push(evaluate(arg));
    }
  }
  return evaluatedArgs;
}
var methodFunctions = {
  CALL_METHOD: {
    lazy: true,
    impl(args, context, evaluate) {
      const target = evaluate(args[0]);
      const methodName = args[1];
      const callArgs = evaluateArgs2(args.slice(2), evaluate);
      if (methodName.endsWith("!")) {
        ensureMutableReceiver(target);
      }
      const fn = resolveMethod(target, methodName);
      if (fn?.type === "method_builtin") {
        return fn.impl([target, ...callArgs], context, evaluate, callWithConcreteArgs);
      }
      return callWithConcreteArgs(fn, [target, ...callArgs], context, evaluate);
    },
    doc: "Resolve and invoke a receiver-first method call"
  }
};

// ../rix/src/eval/functions/advanced.js
function toNumber(val) {
  if (val instanceof Integer)
    return Number(val.value);
  if (val instanceof Rational)
    return Number(val.numerator) / Number(val.denominator);
  if (typeof val === "number")
    return val;
  if (typeof val === "bigint")
    return Number(val);
  return NaN;
}
var advancedFunctions = {
  SOLVE: {
    lazy: true,
    impl(args, context, evaluate) {
      let name = typeof args[0] === "object" && args[0] !== null && args[0].fn ? evaluate(args[0]) : args[0];
      if (name && typeof name === "object" && name.type === "string") {
        name = name.value;
      }
      const value = evaluate(args[1]);
      context.set(name, value);
      return { type: "constraint", name, value, satisfied: true };
    },
    doc: "Solve/constrain: x :=: expr"
  },
  ASSERT_LT: {
    impl(args) {
      const a = toNumber(args[0]);
      const b = toNumber(args[1]);
      if (!(a < b)) {
        throw new Error(`Assertion failed: ${a} < ${b}`);
      }
      return new Integer(1);
    },
    pure: true,
    doc: "Assert a < b (:<:)"
  },
  ASSERT_LTE: {
    impl(args) {
      const a = toNumber(args[0]);
      const b = toNumber(args[1]);
      if (!(a <= b)) {
        throw new Error(`Assertion failed: ${a} <= ${b}`);
      }
      return new Integer(1);
    },
    pure: true,
    doc: "Assert a <= b (:<=:)"
  },
  ASSERT_GT: {
    impl(args) {
      const a = toNumber(args[0]);
      const b = toNumber(args[1]);
      if (!(a > b)) {
        throw new Error(`Assertion failed: ${a} > ${b}`);
      }
      return new Integer(1);
    },
    pure: true,
    doc: "Assert a > b (:>:)"
  },
  ASSERT_GTE: {
    impl(args) {
      const a = toNumber(args[0]);
      const b = toNumber(args[1]);
      if (!(a >= b)) {
        throw new Error(`Assertion failed: ${a} >= ${b}`);
      }
      return new Integer(1);
    },
    pure: true,
    doc: "Assert a >= b (:>=:)"
  },
  DERIVATIVE: {
    impl(args) {
      return {
        type: "stub",
        name: "DERIVATIVE",
        args,
        message: "Symbolic derivatives are not yet implemented"
      };
    },
    pure: true,
    doc: "Symbolic derivative (future)"
  },
  INTEGRAL: {
    impl(args) {
      return {
        type: "stub",
        name: "INTEGRAL",
        args,
        message: "Symbolic integration is not yet implemented"
      };
    },
    pure: true,
    doc: "Symbolic integral (future)"
  },
  GENERATOR: {
    impl(args) {
      return {
        type: "stub",
        name: "GENERATOR",
        args,
        message: "Generators are not yet implemented"
      };
    },
    pure: true,
    doc: "Sequence generator (future)"
  },
  STEP: {
    impl(args) {
      return {
        type: "stub",
        name: "STEP",
        args,
        message: "Step function is not yet implemented"
      };
    },
    pure: true,
    doc: "Step/range generator (future)"
  },
  MATRIX: {
    impl(args) {
      return { type: "matrix", rows: args };
    },
    pure: true,
    doc: "Matrix literal"
  },
  TENSOR: {
    lazy: true,
    impl(args, context, evaluate) {
      const defaultMode = constructorDefaultCaptureMode(context);
      return createTensor([args.length], args.map((arg) => captureIrValue(arg, defaultMode, context, evaluate)));
    },
    pure: true,
    doc: "Tensor literal"
  },
  TENSOR_LITERAL: {
    lazy: true,
    impl(args, context, evaluate) {
      const hasMeta = args[0] && typeof args[0] === "object" && !Array.isArray(args[0]) && args[0].header;
      const header = hasMeta ? args[0].header : null;
      const defaultMode = header?.captureMode || constructorDefaultCaptureMode(context);
      const shape = hasMeta ? args[1] : args[0];
      const values = (hasMeta ? args.slice(2) : args.slice(1)).map((arg) => captureIrValue(arg, defaultMode, context, evaluate));
      return applySemanticHeader(attachBuiltinProto(createTensor(shape, values.length === 0 ? null : values)), header, context);
    },
    pure: true,
    doc: "Tensor literal with explicit shape"
  },
  TENSOR_TRANSPOSE: {
    impl(args) {
      const tensor = args[0];
      if (!isTensor(tensor) || tensorRank(tensor) !== 2) {
        throw new Error("^^ expects rank-2 tensor (matrix)");
      }
      return createTensorView(tensor, {
        shape: [tensor.shape[1], tensor.shape[0]],
        strides: [tensor.strides[1], tensor.strides[0]],
        offset: tensor.offset
      });
    },
    pure: true,
    doc: "Transpose a rank-2 tensor view"
  },
  UNIT: {
    impl(args) {
      return { type: "unit", value: args[0], unit: args[1] };
    },
    pure: true,
    doc: "Scientific unit annotation (future)"
  },
  MATHUNIT: {
    impl(args) {
      return { type: "mathunit", value: args[0], unit: args[1] };
    },
    pure: true,
    doc: "Mathematical unit annotation (future)"
  }
};

// ../rix/src/eval/functions/stdlib.js
var RIX_IO_ENV = "__io__";
function defaultPrettyFormat(value, options = {}) {
  const indent = options.indent ?? 0;
  const seen = options.seen ?? new Set;
  const pad = "  ".repeat(indent);
  const child = (val) => defaultPrettyFormat(val, { indent: indent + 1, seen });
  const childPad = "  ".repeat(indent + 1);
  if (value === null || value === undefined)
    return "_";
  if (typeof value !== "object")
    return formatValue(value);
  if (seen.has(value))
    return "<cycle>";
  if (value.type === "string")
    return JSON.stringify(value.value);
  if (value.type === "function" || value.type === "lambda" || value.type === "partial" || value.type === "arityCap" || value.type === "sysref") {
    return formatValue(value);
  }
  if (value.type === "sequence" || value.type === "set" || value.type === "tuple") {
    const values = value.values || [];
    if (values.length === 0)
      return value.type === "tuple" ? "()" : value.type === "set" ? "{| |}" : "[]";
    seen.add(value);
    const open = value.type === "tuple" ? "(" : value.type === "set" ? "{|" : "[";
    const close = value.type === "tuple" ? ")" : value.type === "set" ? "|}" : "]";
    const body = values.map((item) => `${childPad}${child(item)}`).join(`,
`);
    seen.delete(value);
    return `${open}
${body}
${pad}${close}`;
  }
  if ((value.type === "map" || value.type === "export_bundle") && value.entries instanceof Map) {
    if (value.entries.size === 0)
      return "{= }";
    seen.add(value);
    const body = Array.from(value.entries, ([key, entry]) => {
      const entryValue = value.type === "export_bundle" && entry && typeof entry === "object" && "value" in entry ? entry.value : entry;
      return `${childPad}${key} = ${child(entryValue)}`;
    }).join(`,
`);
    seen.delete(value);
    return `{=
${body}
${pad}}`;
  }
  return formatValue(value);
}
var stdlibFunctions = {
  LEN: {
    impl(args) {
      const coll = args[0];
      if (coll && (coll.type === "sequence" || coll.type === "tuple" || coll.type === "set")) {
        return new Integer(coll.values.length);
      }
      if (coll && coll.type === "map" && coll.entries instanceof Map) {
        return new Integer(coll.entries.size);
      }
      if (coll && coll.type === "export_bundle" && coll.entries instanceof Map) {
        return new Integer(coll.entries.size);
      }
      if (isTensor(coll)) {
        return new Integer(BigInt(tensorSize(coll)));
      }
      if (coll && typeof coll.value === "string") {
        return new Integer(coll.value.length);
      }
      return new Integer(0);
    },
    pure: true,
    doc: "Length of a collection or string"
  },
  FIRST: {
    impl(args) {
      const coll = args[0];
      if (coll && (coll.type === "sequence" || coll.type === "tuple" || coll.type === "set")) {
        return coll.values[0];
      }
      if (isTensor(coll)) {
        let first = null;
        let found = false;
        forEachTensorCell(coll, (value) => {
          if (!found) {
            first = value;
            found = true;
          }
        });
        return found ? first : null;
      }
      return null;
    },
    pure: true,
    doc: "First element of a collection"
  },
  LAST: {
    impl(args) {
      const coll = args[0];
      if (coll && (coll.type === "sequence" || coll.type === "tuple" || coll.type === "set")) {
        return coll.values[coll.values.length - 1];
      }
      if (isTensor(coll)) {
        let last = null;
        let found = false;
        forEachTensorCell(coll, (value) => {
          last = value;
          found = true;
        });
        return found ? last : null;
      }
      return null;
    },
    pure: true,
    doc: "Last element of a collection"
  },
  GETEL: {
    impl(args) {
      const coll = args[0];
      const idx = args[1];
      let index;
      if (idx instanceof Integer)
        index = Number(idx.value);
      else if (typeof idx === "number" || typeof idx === "bigint")
        index = Number(idx);
      if (coll && (coll.type === "sequence" || coll.type === "tuple" || coll.type === "set")) {
        return coll.values[index - 1];
      }
      if (isTensor(coll)) {
        const target = idx instanceof Integer ? Number(idx.value) : Number(idx);
        let found = null;
        let seen = 0;
        forEachTensorCell(coll, (value) => {
          seen += 1;
          if (seen === target) {
            found = value;
          }
        });
        return found;
      }
      return null;
    },
    pure: true,
    doc: "Get element at index (1-based)"
  },
  IRANGE: {
    impl(args) {
      const start = args[0] instanceof Integer ? Number(args[0].value) : Number(args[0]);
      const end = args[1] instanceof Integer ? Number(args[1].value) : Number(args[1]);
      const values = [];
      for (let i = start;i <= end; i++) {
        values.push(new Integer(i));
      }
      return { type: "sequence", values };
    },
    pure: true,
    doc: "Create an integer range [start, end]"
  },
  MAP: {
    lazy: true,
    impl(args, _context, evaluate) {
      return evaluate({ fn: "PMAP", args: [args[0], args[1]] });
    },
    doc: "Map a function over a collection"
  },
  FILTER: {
    lazy: true,
    impl(args, _context, evaluate) {
      return evaluate({ fn: "PFILTER", args: [args[0], args[1]] });
    },
    doc: "Filter a collection"
  },
  REDUCE: {
    lazy: true,
    impl(args, _context, evaluate) {
      return evaluate({ fn: "PREDUCE", args: [args[0], args[1], args[2]] });
    },
    doc: "Reduce a collection"
  },
  TGEN: {
    lazy: true,
    impl(args, context, evaluate) {
      const shape = coerceShapeValue(evaluate(args[0]));
      const fn = evaluate(args[1]);
      const tensor = createTensor(shape);
      const filled = [];
      forEachTensorCell(tensor, (_value, tuple) => {
        filled.push(callWithConcreteArgs(fn, [tensorIndexTuple(tuple)], context, evaluate));
      });
      return createTensor(shape, filled);
    },
    doc: "Generate a tensor from a shape and index callback"
  },
  IF: {
    lazy: true,
    impl(args, _context, evaluate) {
      return evaluate({
        fn: "TERNARY",
        args: [
          args[0],
          { fn: "DEFER", args: [args[1]] },
          args[2] ? { fn: "DEFER", args: [args[2]] } : { fn: "NULL", args: [] }
        ]
      });
    },
    doc: "Conditional function IF(cond, t, f)"
  },
  MULTI: {
    lazy: true,
    impl(args, context, evaluate) {
      let result = null;
      for (const arg of args) {
        result = evaluate(arg);
      }
      return result;
    },
    doc: "Evaluate multiple expressions, return last"
  },
  UPPER: {
    impl(args) {
      const val = args[0];
      const str = val?.value ?? String(val);
      return { type: "string", value: str.toUpperCase() };
    },
    pure: true,
    doc: "Convert string to uppercase"
  },
  SUBSTR: {
    impl(args) {
      const val = args[0];
      const str = val?.value ?? String(val);
      const start = args[1] instanceof Integer ? Number(args[1].value) : Number(args[1]);
      const len = args[2] instanceof Integer ? Number(args[2].value) : Number(args[2]);
      return { type: "string", value: str.substring(start, start + len) };
    },
    pure: true,
    doc: "Get substring"
  },
  RAND_NAME: {
    impl(args) {
      const lenArg = args[0];
      const alphabetArg = args[1];
      let len = 10;
      if (lenArg !== undefined && lenArg !== null) {
        if (lenArg instanceof Integer)
          len = Number(lenArg.value);
        else if (typeof lenArg === "number" || typeof lenArg === "bigint")
          len = Number(lenArg);
        else
          throw new Error("RAND_NAME len must be a positive integer");
      }
      if (!Number.isInteger(len) || len <= 0) {
        throw new Error("RAND_NAME len must be a positive integer");
      }
      let alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
      if (alphabetArg !== undefined && alphabetArg !== null) {
        if (typeof alphabetArg === "string")
          alphabet = alphabetArg;
        else if (alphabetArg?.type === "string")
          alphabet = alphabetArg.value;
        else
          throw new Error("RAND_NAME alphabet must be a non-empty string");
      }
      if (typeof alphabet !== "string" || alphabet.length === 0) {
        throw new Error("RAND_NAME alphabet must be a non-empty string");
      }
      let out = "";
      for (let i = 0;i < len; i++) {
        const idx = Math.floor(Math.random() * alphabet.length);
        out += alphabet[idx];
      }
      return { type: "string", value: out };
    },
    doc: "Generate a random name string RAND_NAME(len=10, alphabet=a-zA-Z)"
  },
  PRINT: {
    impl(args, context) {
      const io = context?.getEnv?.(RIX_IO_ENV, null);
      const formatter = typeof io?.format === "function" ? io.format : defaultPrettyFormat;
      const printer = typeof io?.print === "function" ? io.print : (text) => console.log(text);
      for (const arg of args) {
        const text = formatter(arg, { formatValue, prettyFormat: defaultPrettyFormat, context });
        printer(text, arg, { formatValue, prettyFormat: defaultPrettyFormat, context });
      }
      return null;
    },
    doc: "Print each argument through the replaceable __io__ hook"
  },
  DEEPMUTABLE: {
    impl(args) {
      const value = args[0];
      const flag = args[1];
      deepSetMutable(value, flag);
      return value;
    },
    doc: "Recursively set (flag≠_) or remove (flag=_) ._mutable on all nested arrays/maps/tensors. Called via .DeepMutable(value, flag)."
  }
};

// ../rix/src/eval/functions/diagnostics.js
var EMPTY_MAP = Object.freeze({ type: "map", entries: new Map });
function toRixInt(n) {
  return new Integer(n);
}
function toRixString(s) {
  return { type: "string", value: s };
}
function isTruthy5(val) {
  return val !== null && val !== undefined;
}
function requireString(val, paramName) {
  const s = rixStringValue(val);
  if (s === null) {
    throw new Error(`${paramName} must be a string`);
  }
  return s;
}
function requireMap(val, paramName) {
  if (val === null || val === undefined)
    return EMPTY_MAP;
  if (isRixMap(val))
    return val;
  throw new Error(`${paramName} must be a map`);
}
function mergeDataMap(baseEntries, userMap) {
  const merged = new Map(baseEntries);
  if (isRixMap(userMap)) {
    for (const [k, v] of userMap.entries) {
      merged.set(k, v);
    }
  }
  return { type: "map", entries: merged };
}
var WARN = {
  impl(args, context) {
    const label = requireString(args[0], ".Warn label");
    const dataMap = requireMap(args[1] !== undefined ? args[1] : null, ".Warn dataMap");
    const filePath = getCurrentFilePath(context);
    const event = createEvent({
      kind: "warn",
      label,
      file: filePath,
      data: dataMap
    });
    getDiagnostics(context).addEvent(event);
    return event;
  },
  doc: "Emit a warning event: .Warn(label, dataMap ?= {=})"
};
var INFO = {
  impl(args, context) {
    const label = requireString(args[0], ".Info label");
    const level = args[1] !== undefined && args[1] !== null ? rixIntValue(args[1]) : 1;
    if (level === null || !Number.isInteger(level)) {
      throw new Error(".Info level must be an integer");
    }
    let dataMap;
    if (args.length >= 3) {
      dataMap = requireMap(args[2], ".Info dataMap");
    } else if (args[1] !== undefined && args[1] !== null && isRixMap(args[1])) {
      dataMap = args[1];
    } else {
      dataMap = EMPTY_MAP;
    }
    const filePath = getCurrentFilePath(context);
    const event = createEvent({
      kind: "info",
      label,
      level,
      file: filePath,
      data: dataMap
    });
    getDiagnostics(context).addEvent(event);
    return event;
  },
  doc: "Emit an info event: .Info(label, level ?= 1, dataMap ?= {=})"
};
var ERROR = {
  impl(args, context) {
    const label = requireString(args[0], ".Error label");
    const dataMap = requireMap(args[1] !== undefined ? args[1] : null, ".Error dataMap");
    const filePath = getCurrentFilePath(context);
    const event = createEvent({
      kind: "error",
      label,
      file: filePath,
      data: dataMap
    });
    getDiagnostics(context).addEvent(event);
    throw new RixAbort(event);
  },
  doc: "Emit an error event and abort: .Error(label, dataMap ?= {=})"
};
var STOP = {
  lazy: true,
  impl(args, context, evaluate) {
    const label = requireString(evaluate(args[0]), ".Stop label");
    const condition = evaluate(args[1]);
    if (!isTruthy5(condition)) {
      return null;
    }
    const dataMapArg = args.length >= 3 ? evaluate(args[2]) : null;
    const userMap = requireMap(dataMapArg, ".Stop dataMap");
    const condData = new Map;
    condData.set("condition", condition);
    const data = mergeDataMap(condData, userMap);
    const filePath = getCurrentFilePath(context);
    const event = createEvent({
      kind: "stop",
      label,
      file: filePath,
      data
    });
    getDiagnostics(context).addEvent(event);
    throw new RixAbort(event);
  },
  doc: "Conditional abort: .Stop(label, condition, dataMap ?= {=})"
};
var TEST = {
  lazy: true,
  impl(args, context, evaluate) {
    const label = requireString(evaluate(args[0]), ".Test label");
    const setupNode = args[1];
    const testsNode = args[2];
    const filePath = getCurrentFilePath(context);
    const diag = getDiagnostics(context);
    const testsIR = testsNode;
    if (testsIR && testsIR.fn === "ARRAY") {
      return runSequentialTests(label, setupNode, testsIR.args, filePath, context, evaluate, diag);
    } else if (testsIR && (testsIR.fn === "MAP" || testsIR.fn === "MAP_OBJ")) {
      return runIsolatedTests(label, setupNode, testsIR.args, filePath, context, evaluate, diag);
    } else {
      const testsVal = evaluate(testsIR);
      if (isRixArray(testsVal)) {
        return runSequentialTestsFromValues(label, setupNode, testsVal.values, filePath, context, evaluate, diag);
      } else if (isRixMap(testsVal)) {
        return runIsolatedTestsFromValues(label, setupNode, testsVal, filePath, context, evaluate, diag);
      } else {
        throw new Error(".Test third argument must be an array or map of tests");
      }
    }
  },
  doc: "Run tests: .Test(label, setup, [tests] | {= tests })"
};
function runSequentialTests(label, setupNode, testArgs, filePath, context, evaluate, diag) {
  const results = [];
  let passedAll = true;
  let totalPassed = 0;
  let totalFailed = 0;
  let totalErrored = 0;
  let totalSkipped = 0;
  let stopped = false;
  context.push(undefined, { isolated: true });
  let setupResult = { type: "map", entries: new Map([["passed", toRixInt(1)]]) };
  try {
    context.withSharedBody(setupNode, () => evaluate(setupNode));
  } catch (err) {
    setupResult = { type: "map", entries: new Map([
      ["passed", null],
      ["error", toRixString(err.message)]
    ]) };
    passedAll = false;
    stopped = true;
  }
  if (!stopped) {
    for (let i = 0;i < testArgs.length; i++) {
      if (stopped) {
        results.push(makeTestEntry(i + 1, null, null, null, true));
        totalSkipped++;
        continue;
      }
      try {
        const testNode = testArgs[i];
        if (testNode && testNode.fn === "HOLE") {
          results.push(makeTestEntry(i + 1, null, null, null, true));
          totalSkipped++;
          continue;
        }
        let val;
        if (testNode && testNode.fn === "BLOCK") {
          val = context.withSharedBody(testNode, () => evaluate(testNode));
        } else {
          val = evaluate(testNode);
        }
        if (isTruthy5(val)) {
          results.push(makeTestEntry(i + 1, true, val, null, false));
          totalPassed++;
        } else {
          results.push(makeTestEntry(i + 1, false, val, null, false));
          totalFailed++;
          passedAll = false;
          stopped = true;
        }
      } catch (err) {
        results.push(makeTestEntry(i + 1, false, null, err.message, false));
        totalErrored++;
        passedAll = false;
        stopped = true;
      }
    }
    if (stopped) {
      for (let i = results.length;i < testArgs.length; i++) {
        results.push(makeTestEntry(i + 1, null, null, null, true));
        totalSkipped++;
      }
    }
  }
  context.pop();
  const summaryEntries = new Map;
  summaryEntries.set("total", toRixInt(testArgs.length));
  summaryEntries.set("passed", toRixInt(totalPassed));
  summaryEntries.set("failed", toRixInt(totalFailed));
  summaryEntries.set("errored", toRixInt(totalErrored));
  summaryEntries.set("skipped", toRixInt(totalSkipped));
  const resultEntries = new Map;
  resultEntries.set("kind", toRixString("test"));
  resultEntries.set("label", toRixString(label));
  resultEntries.set("mode", toRixString("sequential"));
  resultEntries.set("file", toRixString(filePath));
  resultEntries.set("passed", passedAll ? toRixInt(1) : null);
  resultEntries.set("setup", setupResult);
  resultEntries.set("results", { type: "sequence", values: results });
  resultEntries.set("summary", { type: "map", entries: summaryEntries });
  const resultObj = { type: "map", entries: resultEntries };
  diag.addEvent(resultObj);
  diag.registerTestResult(filePath, label, resultObj);
  return resultObj;
}
function runSequentialTestsFromValues(label, setupNode, testValues, filePath, context, evaluate, diag) {
  const results = [];
  let passedAll = true;
  let totalPassed = 0;
  let totalFailed = 0;
  context.push(undefined, { isolated: true });
  try {
    evaluate(setupNode);
  } catch {}
  for (let i = 0;i < testValues.length; i++) {
    const val = testValues[i];
    if (isTruthy5(val)) {
      results.push(makeTestEntry(i + 1, true, val, null, false));
      totalPassed++;
    } else {
      results.push(makeTestEntry(i + 1, false, val, null, false));
      totalFailed++;
      passedAll = false;
    }
  }
  context.pop();
  const summaryEntries = new Map;
  summaryEntries.set("total", toRixInt(testValues.length));
  summaryEntries.set("passed", toRixInt(totalPassed));
  summaryEntries.set("failed", toRixInt(totalFailed));
  summaryEntries.set("errored", toRixInt(0));
  summaryEntries.set("skipped", toRixInt(0));
  const resultEntries = new Map;
  resultEntries.set("kind", toRixString("test"));
  resultEntries.set("label", toRixString(label));
  resultEntries.set("mode", toRixString("sequential"));
  resultEntries.set("file", toRixString(filePath));
  resultEntries.set("passed", passedAll ? toRixInt(1) : null);
  resultEntries.set("results", { type: "sequence", values: results });
  resultEntries.set("summary", { type: "map", entries: summaryEntries });
  const resultObj = { type: "map", entries: resultEntries };
  diag.addEvent(resultObj);
  diag.registerTestResult(filePath, label, resultObj);
  return resultObj;
}
function runIsolatedTests(label, setupNode, mapArgs, filePath, context, evaluate, diag) {
  const testEntries = [];
  for (const arg of mapArgs) {
    if (arg && arg.fn === "MAP_PAIR") {
      const key = arg.args[1];
      const valNode = arg.args[2];
      testEntries.push({ key: String(key), valNode });
    } else {
      throw new Error(".Test map mode requires {= label = expr, ... } map literal");
    }
  }
  return runIsolatedTestEntries(label, setupNode, testEntries, filePath, context, evaluate, diag);
}
function runIsolatedTestsFromValues(label, setupNode, testsMap, filePath, context, evaluate, diag) {
  const testEntries = [];
  for (const [key, val] of testsMap.entries) {
    testEntries.push({ key, value: val });
  }
  const resultMap = new Map;
  let passedAll = true;
  let totalPassed = 0;
  let totalFailed = 0;
  let totalErrored = 0;
  for (const { key, value } of testEntries) {
    if (isTruthy5(value)) {
      resultMap.set(key, makeIsolatedEntry(true, value, null));
      totalPassed++;
    } else {
      resultMap.set(key, makeIsolatedEntry(false, value, null));
      totalFailed++;
      passedAll = false;
    }
  }
  return buildIsolatedResult(label, filePath, passedAll, resultMap, testEntries.length, totalPassed, totalFailed, totalErrored, diag);
}
function runIsolatedTestEntries(label, setupNode, testEntries, filePath, context, evaluate, diag) {
  const resultMap = new Map;
  let passedAll = true;
  let totalPassed = 0;
  let totalFailed = 0;
  let totalErrored = 0;
  for (const { key, valNode } of testEntries) {
    context.push(undefined, { isolated: true });
    try {
      context.withSharedBody(setupNode, () => evaluate(setupNode));
      let val;
      if (valNode && valNode.fn === "BLOCK") {
        val = context.withSharedBody(valNode, () => evaluate(valNode));
      } else {
        val = evaluate(valNode);
      }
      if (isTruthy5(val)) {
        resultMap.set(key, makeIsolatedEntry(true, val, null));
        totalPassed++;
      } else {
        resultMap.set(key, makeIsolatedEntry(false, val, null));
        totalFailed++;
        passedAll = false;
      }
    } catch (err) {
      resultMap.set(key, makeIsolatedEntry(false, null, err.message));
      totalErrored++;
      passedAll = false;
    } finally {
      context.pop();
    }
  }
  return buildIsolatedResult(label, filePath, passedAll, resultMap, testEntries.length, totalPassed, totalFailed, totalErrored, diag);
}
function buildIsolatedResult(label, filePath, passedAll, resultMap, total, passed, failed, errored, diag) {
  const summaryEntries = new Map;
  summaryEntries.set("total", toRixInt(total));
  summaryEntries.set("passed", toRixInt(passed));
  summaryEntries.set("failed", toRixInt(failed));
  summaryEntries.set("errored", toRixInt(errored));
  const resultEntries = new Map;
  resultEntries.set("kind", toRixString("test"));
  resultEntries.set("label", toRixString(label));
  resultEntries.set("mode", toRixString("isolated"));
  resultEntries.set("file", toRixString(filePath));
  resultEntries.set("passed", passedAll ? toRixInt(1) : null);
  resultEntries.set("results", { type: "map", entries: resultMap });
  resultEntries.set("summary", { type: "map", entries: summaryEntries });
  const resultObj = { type: "map", entries: resultEntries };
  diag.addEvent(resultObj);
  diag.registerTestResult(filePath, label, resultObj);
  return resultObj;
}
function makeTestEntry(index, passed, value, error, skipped) {
  const entries = new Map;
  entries.set("index", toRixInt(index));
  entries.set("passed", passed === true ? toRixInt(1) : null);
  if (value !== null && value !== undefined)
    entries.set("value", value);
  if (error !== null && error !== undefined)
    entries.set("error", toRixString(error));
  entries.set("skipped", skipped ? toRixInt(1) : null);
  return { type: "map", entries };
}
function makeIsolatedEntry(passed, value, error) {
  const entries = new Map;
  entries.set("passed", passed ? toRixInt(1) : null);
  if (value !== null && value !== undefined)
    entries.set("value", value);
  if (error !== null && error !== undefined)
    entries.set("error", toRixString(error));
  return { type: "map", entries };
}
var DEBUG = {
  lazy: true,
  impl(args, context, evaluate) {
    const label = requireString(evaluate(args[0]), ".Debug label");
    const exprNode = args[1];
    const filePath = getCurrentFilePath(context);
    const exprSource = irToText(exprNode);
    const astRepr = irToText(exprNode, { pretty: true });
    let finalValue;
    try {
      finalValue = evaluate(exprNode);
    } catch (err) {
      const dataEntries2 = new Map;
      dataEntries2.set("exprSource", toRixString(exprSource));
      dataEntries2.set("ast", toRixString(astRepr));
      dataEntries2.set("error", toRixString(err.message));
      const event2 = createEvent({
        kind: "debug",
        label,
        file: filePath,
        data: { type: "map", entries: dataEntries2 }
      });
      getDiagnostics(context).addEvent(event2);
      throw err;
    }
    const dataEntries = new Map;
    dataEntries.set("exprSource", toRixString(exprSource));
    dataEntries.set("ast", toRixString(astRepr));
    dataEntries.set("final", finalValue);
    const event = createEvent({
      kind: "debug",
      label,
      file: filePath,
      data: { type: "map", entries: dataEntries }
    });
    getDiagnostics(context).addEvent(event);
    return finalValue;
  },
  doc: "Debug expression: .Debug(label, expr) — returns expr value, records AST/source"
};
var TRACE = {
  lazy: true,
  impl(args, context, evaluate) {
    const label = requireString(evaluate(args[0]), ".Trace label");
    const depthVal = evaluate(args[1]);
    const depth = rixIntValue(depthVal);
    if (depth === null || depth < 0 || !Number.isInteger(depth)) {
      throw new Error(".Trace depth must be a non-negative integer");
    }
    let trackedVars = [];
    let callableNode;
    if (args.length >= 4) {
      const varsVal = evaluate(args[2]);
      if (isRixArray(varsVal)) {
        trackedVars = varsVal.values.map((v) => {
          const s = rixStringValue(v);
          if (s === null)
            throw new Error(".Trace trackedVars must be an array of strings");
          return s;
        });
      } else if (varsVal === null) {
        trackedVars = [];
      } else {
        throw new Error(".Trace trackedVars must be an array of strings");
      }
      callableNode = args[3];
    } else {
      callableNode = args[2];
    }
    const filePath = getCurrentFilePath(context);
    const traceLog = [];
    const traceContext = {
      depth,
      trackedVars: new Set(trackedVars),
      currentDepth: 0,
      log: traceLog,
      active: true
    };
    const prevTrace = context.getEnv("__trace_context__");
    context.setEnv("__trace_context__", traceContext);
    let finalValue;
    try {
      const callable = evaluate(callableNode);
      if (callable && (callable.type === "function" || callable.type === "lambda")) {
        finalValue = callWithConcreteArgs(callable, [], context, evaluate);
      } else if (typeof callable === "function") {
        finalValue = callable();
      } else {
        finalValue = callable;
      }
    } finally {
      traceContext.active = false;
      if (prevTrace) {
        context.setEnv("__trace_context__", prevTrace);
      } else {
        context.setEnv("__trace_context__", null);
      }
    }
    const callEntries = traceLog.map((entry) => {
      const m = new Map;
      m.set("event", toRixString(entry.event));
      if (entry.fn)
        m.set("fn", toRixString(entry.fn));
      if (entry.scope)
        m.set("scope", toRixString(entry.scope));
      if (entry.depth !== undefined)
        m.set("depth", toRixInt(entry.depth));
      if (entry.args)
        m.set("args", { type: "sequence", values: entry.args });
      if (entry.value !== undefined)
        m.set("value", entry.value);
      if (entry.var)
        m.set("var", toRixString(entry.var));
      if (entry.old !== undefined)
        m.set("old", entry.old);
      if (entry.new !== undefined)
        m.set("new", entry.new);
      if (entry.variantIndex !== undefined)
        m.set("variantIndex", toRixInt(entry.variantIndex));
      if (entry.variantName)
        m.set("variantName", toRixString(entry.variantName));
      return { type: "map", entries: m };
    });
    const dataEntries = new Map;
    dataEntries.set("depth", toRixInt(depth));
    dataEntries.set("trackedVars", {
      type: "sequence",
      values: trackedVars.map(toRixString)
    });
    dataEntries.set("calls", { type: "sequence", values: callEntries });
    dataEntries.set("final", finalValue);
    const event = createEvent({
      kind: "trace",
      label,
      file: filePath,
      data: { type: "map", entries: dataEntries }
    });
    getDiagnostics(context).addEvent(event);
    return finalValue;
  },
  doc: "Trace execution: .Trace(label, depth, trackedVars?, thunkOrCallable)"
};
function classifyError(err) {
  if (err instanceof RixAbort) {
    const kind = err.event?.entries?.get("kind")?.value;
    if (kind === "stop")
      return { outcome: "stop", abort: err.event, error: null };
    return { outcome: "error", abort: err.event, error: null };
  }
  return { outcome: "runtimeError", abort: undefined, error: err.message };
}
function buildAbortTestResult({
  label,
  testKind,
  filePath,
  expected,
  setupPassed,
  setupOutcome,
  setupValue,
  setupAbort,
  setupError,
  exprOutcome,
  exprValue,
  exprAbort,
  exprError,
  passed
}) {
  const setupEntries = new Map;
  setupEntries.set("passed", setupPassed ? toRixInt(1) : null);
  setupEntries.set("outcome", toRixString(setupOutcome));
  if (setupValue !== undefined)
    setupEntries.set("value", setupValue);
  if (setupAbort !== undefined)
    setupEntries.set("abort", setupAbort);
  if (setupError !== null && setupError !== undefined)
    setupEntries.set("error", toRixString(setupError));
  const exprEntries = new Map;
  exprEntries.set("passed", passed ? toRixInt(1) : null);
  exprEntries.set("outcome", toRixString(exprOutcome));
  if (exprValue !== undefined)
    exprEntries.set("value", exprValue);
  if (exprAbort !== undefined)
    exprEntries.set("abort", exprAbort);
  if (exprError !== null && exprError !== undefined)
    exprEntries.set("error", toRixString(exprError));
  const summaryEntries = new Map;
  summaryEntries.set("expected", toRixString(expected));
  summaryEntries.set("setupPassed", setupPassed ? toRixInt(1) : null);
  summaryEntries.set("exprOutcome", toRixString(exprOutcome));
  const resultEntries = new Map;
  resultEntries.set("kind", toRixString("test"));
  resultEntries.set("testKind", toRixString(testKind));
  resultEntries.set("label", toRixString(label));
  resultEntries.set("file", toRixString(filePath));
  resultEntries.set("passed", passed ? toRixInt(1) : null);
  resultEntries.set("expected", toRixString(expected));
  resultEntries.set("setup", { type: "map", entries: setupEntries });
  resultEntries.set("expr", { type: "map", entries: exprEntries });
  resultEntries.set("summary", { type: "map", entries: summaryEntries });
  return { type: "map", entries: resultEntries };
}
function runAbortTest(testKind, args, context, evaluate) {
  const capName = testKind === "error" ? ".TestError" : ".TestStop";
  const label = requireString(evaluate(args[0]), `${capName} label`);
  const setupNode = args[1];
  const exprNode = args[2];
  const filePath = getCurrentFilePath(context);
  const diag = getDiagnostics(context);
  let setupPassed = true;
  let setupOutcome = "returned";
  let setupValue;
  let setupAbort;
  let setupError = null;
  let exprOutcome = "returned";
  let exprValue;
  let exprAbort;
  let exprError = null;
  let passed = false;
  context.push(undefined, { isolated: true });
  try {
    try {
      setupValue = context.withSharedBody(setupNode, () => evaluate(setupNode));
    } catch (err) {
      setupPassed = false;
      const c = classifyError(err);
      setupOutcome = c.outcome;
      setupAbort = c.abort;
      setupError = c.error;
    }
    if (setupPassed) {
      try {
        let val;
        if (exprNode && exprNode.fn === "BLOCK") {
          val = context.withSharedBody(exprNode, () => evaluate(exprNode));
        } else {
          val = evaluate(exprNode);
        }
        exprOutcome = "returned";
        exprValue = val;
        passed = false;
      } catch (err) {
        const c = classifyError(err);
        exprOutcome = c.outcome;
        exprAbort = c.abort;
        exprError = c.error;
        if (testKind === "error") {
          passed = exprOutcome === "error" || exprOutcome === "runtimeError";
        } else {
          passed = exprOutcome === "stop";
        }
      }
    }
  } finally {
    context.pop();
  }
  const overallPassed = setupPassed && passed;
  const result = buildAbortTestResult({
    label,
    testKind,
    filePath,
    expected: testKind === "error" ? "error" : "stop",
    setupPassed,
    setupOutcome,
    setupValue,
    setupAbort,
    setupError,
    exprOutcome,
    exprValue,
    exprAbort,
    exprError,
    passed: overallPassed
  });
  diag.addEvent(result);
  diag.registerTestResult(filePath, label, result);
  return result;
}
var TEST_ERROR = {
  lazy: true,
  impl(args, context, evaluate) {
    return runAbortTest("error", args, context, evaluate);
  },
  doc: "Abort test: .TestError(label, setup, expr) — passes if expr aborts with .Error() or a runtime error"
};
var TEST_STOP = {
  lazy: true,
  impl(args, context, evaluate) {
    return runAbortTest("stop", args, context, evaluate);
  },
  doc: "Abort test: .TestStop(label, setup, expr) — passes if expr aborts via .Stop()"
};
var diagnosticFunctions = {
  WARN,
  INFO,
  ERROR,
  STOP,
  TEST,
  TESTERROR: TEST_ERROR,
  TESTSTOP: TEST_STOP,
  DEBUG,
  TRACE
};

// ../rix/src/eval/functions/symbolic.js
function rixString(value) {
  return { type: "string", value };
}
function rixTuple(values) {
  return { type: "tuple", values };
}
function rixMap(entries) {
  return {
    type: "map",
    entries: new Map(entries)
  };
}
function mapEntry(mapValue2, key) {
  if (!mapValue2 || mapValue2.type !== "map" || !(mapValue2.entries instanceof Map)) {
    throw new Error(`Expected map value while reading '${key}'`);
  }
  return mapValue2.entries.get(key);
}
function tupleValues(value, label) {
  if (!value || value.type !== "tuple" || !Array.isArray(value.values)) {
    throw new Error(`Expected tuple for ${label}`);
  }
  return value.values;
}
function stringValue2(value, label) {
  if (typeof value === "string")
    return value;
  if (value && value.type === "string")
    return value.value;
  throw new Error(`Expected string for ${label}`);
}
function operatorName(fn) {
  const names = {
    ADD: "+",
    SUB: "-",
    MUL: "*",
    DIV: "/",
    INTDIV: "//",
    MOD: "%",
    POW: "^",
    EQ: "==",
    NEQ: "!=",
    LT: "<",
    GT: ">",
    LTE: "<=",
    GTE: ">=",
    AND: "&&",
    OR: "||"
  };
  return names[fn] ?? null;
}
function serializeIrArg(arg) {
  if (arg === null || arg === undefined) {
    return rixMap([["kind", rixString("null")]]);
  }
  if (typeof arg === "string") {
    return rixString(arg);
  }
  if (typeof arg === "number" || typeof arg === "bigint") {
    return rixMap([
      ["kind", rixString("number")],
      ["value", rixString(String(arg))]
    ]);
  }
  if (Array.isArray(arg)) {
    return rixTuple(arg.map(serializeIrArg));
  }
  if (!arg.fn) {
    return rixMap(Object.entries(arg).map(([key, value]) => [key, serializeIrArg(value)]));
  }
  return serializeExprIr(arg);
}
function serializeExprIr(node) {
  if (!node || typeof node !== "object" || !node.fn) {
    return serializeIrArg(node);
  }
  if (node.fn === "LITERAL") {
    return rixMap([
      ["kind", rixString("number")],
      ["value", rixString(node.args[0])]
    ]);
  }
  if (node.fn === "STRING") {
    return rixMap([
      ["kind", rixString("string")],
      ["value", rixString(node.args[0])]
    ]);
  }
  if (node.fn === "NULL") {
    return rixMap([["kind", rixString("null")]]);
  }
  if (node.fn === "RETRIEVE") {
    return rixMap([
      ["kind", rixString("identifier")],
      ["name", rixString(node.args[0])]
    ]);
  }
  if (node.fn === "OUTER_RETRIEVE") {
    return rixMap([
      ["kind", rixString("outer")],
      ["name", rixString(node.args[0])]
    ]);
  }
  if (node.fn === "SYSREF") {
    return rixMap([
      ["kind", rixString("sysref")],
      ["name", rixString(node.args[0])]
    ]);
  }
  if (node.fn === "NEG") {
    return rixMap([
      ["kind", rixString("unary")],
      ["op", rixString("-")],
      ["expr", serializeExprIr(node.args[0])]
    ]);
  }
  const op = operatorName(node.fn);
  if (op) {
    return rixMap([
      ["kind", rixString("binary")],
      ["op", rixString(op)],
      ["left", serializeExprIr(node.args[0])],
      ["right", serializeExprIr(node.args[1])]
    ]);
  }
  if (node.fn === "CALL") {
    return rixMap([
      ["kind", rixString("call")],
      ["target", rixMap([
        ["kind", rixString("identifier")],
        ["name", rixString(node.args[0])]
      ])],
      ["args", rixTuple(node.args.slice(1).map(serializeExprIr))]
    ]);
  }
  if (node.fn === "CALL_EXPR") {
    return rixMap([
      ["kind", rixString("call")],
      ["target", serializeExprIr(node.args[0])],
      ["args", rixTuple(node.args.slice(1).map(serializeExprIr))]
    ]);
  }
  if (node.fn === "SYS_CALL") {
    return rixMap([
      ["kind", rixString("call")],
      ["target", rixMap([
        ["kind", rixString("sysref")],
        ["name", rixString(node.args[0])]
      ])],
      ["args", rixTuple(node.args.slice(1).map(serializeExprIr))]
    ]);
  }
  return rixMap([
    ["kind", rixString("ir")],
    ["fn", rixString(node.fn)],
    ["args", rixTuple(node.args.map(serializeIrArg))]
  ]);
}
function specValue(meta) {
  const entries = [
    ["kind", rixString("systemSpec")],
    ["syntax", rixString("#")],
    ["inputs", rixTuple((meta.inputs || []).map(rixString))],
    ["outputs", rixTuple((meta.outputs || []).map(rixString))],
    ["statements", rixTuple((meta.statements || []).map((statement) => rixMap([
      ["kind", rixString("assign")],
      ["target", rixString(statement.target)],
      ["expr", serializeExprIr(statement.expr)]
    ])))]
  ];
  if (meta.imports && meta.imports.length > 0) {
    entries.push(["imports", rixTuple(meta.imports.map((spec) => rixMap([
      ["local", rixString(spec.local)],
      ["source", rixString(spec.source)],
      ["mode", rixString(spec.mode)]
    ])))]);
  }
  return rixMap(entries);
}
function parseNumberLiteral(text) {
  if (/^-?\d+$/.test(text)) {
    return new Integer(BigInt(text));
  }
  const rational = text.match(/^(-?\d+)\/(\d+)$/);
  if (rational) {
    return new Rational(BigInt(rational[1]), BigInt(rational[2]));
  }
  const decimal = text.match(/^(-?\d+)\.(\d+)$/);
  if (decimal) {
    const sign = decimal[1].startsWith("-") ? -1n : 1n;
    const whole = BigInt(decimal[1].replace("-", ""));
    const frac = decimal[2];
    const den = 10n ** BigInt(frac.length);
    return new Rational(sign * (whole * den + BigInt(frac)), den);
  }
  throw new Error(`Unsupported numeric literal '${text}' in symbolic polynomial helper`);
}
function exactInteger2(value, label) {
  if (value instanceof Integer) {
    return Number(value.value);
  }
  if (value instanceof Rational && value.denominator === 1n) {
    return Number(value.numerator);
  }
  throw new Error(`${label} must be an exact integer`);
}
function evalPolyExpr(node, env) {
  const kind = stringValue2(mapEntry(node, "kind"), "expression kind");
  if (kind === "number") {
    return parseNumberLiteral(stringValue2(mapEntry(node, "value"), "number literal"));
  }
  if (kind === "identifier") {
    const name = stringValue2(mapEntry(node, "name"), "identifier name");
    if (!env.has(name)) {
      throw new Error(`Poly cannot resolve symbolic identifier '${name}'`);
    }
    return env.get(name);
  }
  if (kind === "outer") {
    const name = stringValue2(mapEntry(node, "name"), "outer identifier name");
    throw new Error(`Poly does not support unresolved outer reference '@${name}'`);
  }
  if (kind === "unary") {
    const op = stringValue2(mapEntry(node, "op"), "unary operator");
    if (op !== "-") {
      throw new Error(`Poly does not support unary operator '${op}'`);
    }
    return new Integer(0).subtract(evalPolyExpr(mapEntry(node, "expr"), env));
  }
  if (kind === "binary") {
    const op = stringValue2(mapEntry(node, "op"), "binary operator");
    const left = evalPolyExpr(mapEntry(node, "left"), env);
    const right = evalPolyExpr(mapEntry(node, "right"), env);
    if (op === "+")
      return left.add(right);
    if (op === "-")
      return left.subtract(right);
    if (op === "*")
      return left.multiply(right);
    if (op === "^")
      return left.pow(exactInteger2(right, "Exponent"));
    throw new Error(`Poly does not support operator '${op}'`);
  }
  throw new Error(`Poly does not support symbolic node kind '${kind}'`);
}
function derivExpr(node, variableName) {
  const kind = stringValue2(mapEntry(node, "kind"), "expression kind");
  if (kind === "number" || kind === "null" || kind === "string") {
    return rixMap([
      ["kind", rixString("number")],
      ["value", rixString("0")]
    ]);
  }
  if (kind === "identifier") {
    const name = stringValue2(mapEntry(node, "name"), "identifier name");
    return rixMap([
      ["kind", rixString("number")],
      ["value", rixString(name === variableName ? "1" : "0")]
    ]);
  }
  if (kind === "outer") {
    return rixMap([
      ["kind", rixString("number")],
      ["value", rixString("0")]
    ]);
  }
  if (kind === "unary") {
    const op2 = stringValue2(mapEntry(node, "op"), "unary operator");
    if (op2 !== "-") {
      throw new Error(`Deriv does not support unary operator '${op2}'`);
    }
    return rixMap([
      ["kind", rixString("unary")],
      ["op", rixString("-")],
      ["expr", derivExpr(mapEntry(node, "expr"), variableName)]
    ]);
  }
  if (kind !== "binary") {
    throw new Error(`Deriv does not support symbolic node kind '${kind}'`);
  }
  const op = stringValue2(mapEntry(node, "op"), "binary operator");
  const left = mapEntry(node, "left");
  const right = mapEntry(node, "right");
  if (op === "+") {
    return rixMap([
      ["kind", rixString("binary")],
      ["op", rixString("+")],
      ["left", derivExpr(left, variableName)],
      ["right", derivExpr(right, variableName)]
    ]);
  }
  if (op === "-") {
    return rixMap([
      ["kind", rixString("binary")],
      ["op", rixString("-")],
      ["left", derivExpr(left, variableName)],
      ["right", derivExpr(right, variableName)]
    ]);
  }
  if (op === "*") {
    return rixMap([
      ["kind", rixString("binary")],
      ["op", rixString("+")],
      ["left", rixMap([
        ["kind", rixString("binary")],
        ["op", rixString("*")],
        ["left", derivExpr(left, variableName)],
        ["right", right]
      ])],
      ["right", rixMap([
        ["kind", rixString("binary")],
        ["op", rixString("*")],
        ["left", left],
        ["right", derivExpr(right, variableName)]
      ])]
    ]);
  }
  if (op === "^") {
    const exponentNode = right;
    const exponentKind = stringValue2(mapEntry(exponentNode, "kind"), "power exponent kind");
    if (exponentKind !== "number") {
      throw new Error("Deriv only supports powers with nonnegative integer literal exponents");
    }
    const exponentText = stringValue2(mapEntry(exponentNode, "value"), "power exponent");
    if (!/^\d+$/.test(exponentText)) {
      throw new Error("Deriv only supports powers with nonnegative integer literal exponents");
    }
    const exponent = BigInt(exponentText);
    if (exponent === 0n) {
      return rixMap([
        ["kind", rixString("number")],
        ["value", rixString("0")]
      ]);
    }
    const decremented = rixMap([
      ["kind", rixString("number")],
      ["value", rixString(String(exponent - 1n))]
    ]);
    return rixMap([
      ["kind", rixString("binary")],
      ["op", rixString("*")],
      ["left", rixMap([
        ["kind", rixString("number")],
        ["value", rixString(String(exponent))]
      ])],
      ["right", rixMap([
        ["kind", rixString("binary")],
        ["op", rixString("*")],
        ["left", rixMap([
          ["kind", rixString("binary")],
          ["op", rixString("^")],
          ["left", left],
          ["right", decremented]
        ])],
        ["right", derivExpr(left, variableName)]
      ])]
    ]);
  }
  throw new Error(`Deriv does not support operator '${op}'`);
}
function cloneSpecWithStatements(spec, statements) {
  const entries = new Map(spec.entries);
  entries.set("statements", rixTuple(statements));
  return {
    type: "map",
    entries
  };
}
function polyFromSpec(spec) {
  const kind = stringValue2(mapEntry(spec, "kind"), "spec kind");
  if (kind !== "systemSpec") {
    throw new Error("Poly expects a systemSpec value");
  }
  const inputNames = tupleValues(mapEntry(spec, "inputs"), "spec inputs").map((value) => stringValue2(value, "input name"));
  const outputNames = tupleValues(mapEntry(spec, "outputs"), "spec outputs").map((value) => stringValue2(value, "output name"));
  const statements = tupleValues(mapEntry(spec, "statements"), "spec statements");
  if (outputNames.length !== 1) {
    throw new Error("Poly currently supports exactly one output");
  }
  return (...args) => {
    if (args.length !== inputNames.length) {
      throw new Error(`Poly expected ${inputNames.length} argument(s) but received ${args.length}`);
    }
    const env = new Map;
    for (let i = 0;i < inputNames.length; i++) {
      env.set(inputNames[i], args[i]);
    }
    for (const statement of statements) {
      const statementKind = stringValue2(mapEntry(statement, "kind"), "statement kind");
      if (statementKind !== "assign") {
        throw new Error(`Poly only supports assign statements, got '${statementKind}'`);
      }
      const target = stringValue2(mapEntry(statement, "target"), "assignment target");
      const value = evalPolyExpr(mapEntry(statement, "expr"), env);
      env.set(target, value);
    }
    return env.get(outputNames[0]) ?? null;
  };
}
function derivSpec(spec, variableNameRaw) {
  const kind = stringValue2(mapEntry(spec, "kind"), "spec kind");
  if (kind !== "systemSpec") {
    throw new Error("Deriv expects a systemSpec value");
  }
  const variableName = stringValue2(variableNameRaw, "derivative variable");
  const statements = tupleValues(mapEntry(spec, "statements"), "spec statements").map((statement) => {
    const statementKind = stringValue2(mapEntry(statement, "kind"), "statement kind");
    if (statementKind !== "assign") {
      throw new Error(`Deriv only supports assign statements, got '${statementKind}'`);
    }
    return rixMap([
      ["kind", rixString("assign")],
      ["target", mapEntry(statement, "target")],
      ["expr", derivExpr(mapEntry(statement, "expr"), variableName)]
    ]);
  });
  return cloneSpecWithStatements(spec, statements);
}
function installSymbolicBindings(context) {
  context.setGlobal("POLY", polyFromSpec);
  context.setGlobal("DERIV", derivSpec);
  context.setGlobal("Poly", polyFromSpec);
  context.setGlobal("Deriv", derivSpec);
}
var symbolicFunctions = {
  SYSTEM_SPEC: {
    lazy: true,
    impl(args) {
      return specValue(args[0] || {});
    },
    pure: true,
    doc: "Create a symbolic system specification value"
  }
};

// ../rix/src/eval/functions/math.js
function numberFrom(value) {
  if (value instanceof Integer)
    return Number(value.value);
  if (value instanceof Rational)
    return Number(value.numerator) / Number(value.denominator);
  if (typeof value === "bigint")
    return Number(value);
  if (value?.type === "string")
    return Number(value.value);
  return Number(value);
}
function finiteNumberFrom(value) {
  const number = numberFrom(value);
  if (Number.isNaN(number))
    throw new Error("Math function expected a numeric value");
  return number;
}
function unary(fn) {
  return (args) => fn(finiteNumberFrom(args[0]));
}
function binary(fn) {
  return (args) => fn(finiteNumberFrom(args[0]), finiteNumberFrom(args[1]));
}
var MATH_FUNCTION_NAMES = [
  "SIN",
  "COS",
  "TAN",
  "ASIN",
  "ACOS",
  "ATAN",
  "ATAN2",
  "LOG",
  "LN",
  "LOG10",
  "EXP"
];
var mathFunctions = {
  SIN: { impl: unary(Math.sin), pure: true, doc: "Sine" },
  COS: { impl: unary(Math.cos), pure: true, doc: "Cosine" },
  TAN: { impl: unary(Math.tan), pure: true, doc: "Tangent" },
  ASIN: { impl: unary(Math.asin), pure: true, doc: "Arcsine" },
  ACOS: { impl: unary(Math.acos), pure: true, doc: "Arccosine" },
  ATAN: { impl: unary(Math.atan), pure: true, doc: "Arctangent" },
  ATAN2: { impl: binary(Math.atan2), pure: true, doc: "Two-argument arctangent" },
  LOG: { impl: unary(Math.log), pure: true, doc: "Natural logarithm" },
  LN: { impl: unary(Math.log), pure: true, doc: "Natural logarithm" },
  LOG10: { impl: unary(Math.log10), pure: true, doc: "Base-10 logarithm" },
  EXP: { impl: unary(Math.exp), pure: true, doc: "Exponential" }
};

// ../rix/src/eval/evaluator.js
function createDefaultRegistry(options = {}) {
  registerBuiltinSemanticTypes();
  const registry = new Registry;
  registry.registerAll(coreFunctions);
  registry.registerAll(arithmeticFunctions);
  registry.registerAll(comparisonFunctions);
  registry.registerAll(logicFunctions);
  registry.registerAll(controlFunctions);
  registry.registerAll(collectionFunctions);
  registry.registerAll(functionFunctions);
  registry.registerAll(methodFunctions);
  registry.registerAll(propertyFunctions);
  registry.registerAll(advancedFunctions);
  registry.registerAll(symbolicFunctions);
  registry.registerAll(mathFunctions);
  installRegisteredTypes(registry);
  for (const loadStartup of options.startupLoaders || []) {
    loadStartup(registry);
  }
  return registry;
}
var OPERATOR_ALIAS_NAMES = [
  "ADD",
  "SUB",
  "MUL",
  "DIV",
  "INTDIV",
  "MOD",
  "POW",
  "POWPROD",
  "EQ",
  "NEQ",
  "LT",
  "GT",
  "LTE",
  "GTE",
  "SAME_CELL",
  "AND",
  "OR",
  "NOT"
];
var SCRIPT_RUNTIME_ENV_KEY = "__script_runtime__";
var SOURCE_ENV_KEY = "__source__";
var CURRENT_FILE_ENV_KEY = "__current_file__";
function createDefaultSystemContext(options = {}) {
  const frozen = options.frozen !== false;
  const ctx = new SystemContext(new Map, false);
  ctx.registerAll(stdlibFunctions);
  ctx.register("EVAL", coreFunctions.EVAL);
  ctx.register("TypeExport", coreFunctions.TYPE_EXPORT);
  ctx.register("TypeImport", coreFunctions.TYPE_IMPORT);
  ctx.register("TYPEEXPORT", coreFunctions.TYPE_EXPORT);
  ctx.register("TYPEIMPORT", coreFunctions.TYPE_IMPORT);
  ctx.register("TraitRegister", coreFunctions.TRAIT_REGISTER);
  ctx.register("TypeRegister", coreFunctions.TYPE_REGISTER);
  ctx.register("TypeInstall", coreFunctions.TYPE_INSTALL);
  ctx.register("CapabilityRegister", coreFunctions.CAPABILITY_REGISTER);
  ctx.register("ImportJS", coreFunctions.IMPORT_JS);
  ctx.register("JSCall", coreFunctions.JS_CALL);
  ctx.register("TRAITREGISTER", coreFunctions.TRAIT_REGISTER);
  ctx.register("TYPEREGISTER", coreFunctions.TYPE_REGISTER);
  ctx.register("TYPEINSTALL", coreFunctions.TYPE_INSTALL);
  ctx.register("CAPABILITYREGISTER", coreFunctions.CAPABILITY_REGISTER);
  ctx.register("IMPORTJS", coreFunctions.IMPORT_JS);
  ctx.register("JSCALL", coreFunctions.JS_CALL);
  ctx.register("LOOP", controlFunctions.LOOP);
  for (const name of MATH_FUNCTION_NAMES) {
    ctx.register(name, {
      impl(args, _context, evaluate) {
        return evaluate({ fn: name, args });
      },
      doc: `Dispatch ${name} through the active system multifunction registry`
    });
  }
  const userPropertyNames = ["KEYOF", "KEYS", "VALUES"];
  for (const name of userPropertyNames) {
    if (propertyFunctions[name])
      ctx.register(name, propertyFunctions[name]);
  }
  const opSources = { ...arithmeticFunctions, ...comparisonFunctions, ...logicFunctions };
  for (const name of OPERATOR_ALIAS_NAMES) {
    if (opSources[name])
      ctx.register(name, opSources[name]);
  }
  ctx.registerAll(diagnosticFunctions);
  if (frozen)
    ctx.freeze();
  return ctx;
}
function getScriptRuntime(context, options = {}) {
  let runtime = context.getEnv(SCRIPT_RUNTIME_ENV_KEY);
  if (!runtime) {
    runtime = {
      systemLookup: options.systemLookup || defaultSystemLookup,
      preparedScripts: new Map,
      activeImports: [],
      frameStack: []
    };
    context.setEnv(SCRIPT_RUNTIME_ENV_KEY, runtime);
    return runtime;
  }
  if (!runtime.systemLookup) {
    runtime.systemLookup = options.systemLookup || defaultSystemLookup;
  }
  return runtime;
}
function getScriptCapabilityConfig(context) {
  const groupOverride = context.getEnv("capabilityGroups", null);
  const policyOverride = context.getEnv("defaultScriptCapabilityPolicy", null);
  const permissionOverride = context.getEnv("scriptPermissionNames", null);
  return {
    capabilityGroups: {
      ...runtimeDefaults.capabilityGroups,
      ...groupOverride || {}
    },
    defaultPolicy: {
      ...runtimeDefaults.defaultScriptCapabilityPolicy,
      ...policyOverride || {}
    },
    permissionNames: new Set(permissionOverride || runtimeDefaults.scriptPermissionNames)
  };
}
function getHostAvailablePermissions(context) {
  return new Set(getScriptCapabilityConfig(context).permissionNames);
}
function stripMeta(value) {
  if (value && typeof value === "object" && value._ext) {
    delete value._ext;
  }
  return value;
}
function cloneValueForBinding(value, mode) {
  if (mode === "copy") {
    return stripMeta(shallowCopyValue(value));
  }
  if (mode === "copy_meta") {
    const next = stripMeta(shallowCopyValue(value));
    copyAllMeta(value, next, "shallow");
    return next;
  }
  if (mode === "deep_copy") {
    return stripMeta(deepCopyValue(value));
  }
  if (mode === "deep_copy_meta") {
    const next = stripMeta(deepCopyValue(value));
    copyAllMeta(value, next, "deep");
    return next;
  }
  return value;
}
function buildBoundCell(sourceCell, mode) {
  if (mode === "alias") {
    return sourceCell;
  }
  return new Cell(cloneValueForBinding(sourceCell.value, mode));
}
function applyBindingToCurrentScope(context, target, sourceCell, mode) {
  if (mode === "alias") {
    context.setCell(target, sourceCell);
    return sourceCell.value;
  }
  const clonedCell = buildBoundCell(sourceCell, mode);
  context.setCell(target, clonedCell);
  return clonedCell.value;
}
function resolveCallerBindingCell(context, spec) {
  const sourceScope = spec.sourceScope || "current";
  const cell = sourceScope === "ancestor" ? context.getAncestorCell(spec.source) : context.getImmediateCell(spec.source);
  if (!cell) {
    const scopeLabel = sourceScope === "ancestor" ? "ancestor" : "current";
    throw new Error(`Undefined ${scopeLabel} variable for script binding: ${spec.source}`);
  }
  return cell;
}
function unwrapScriptBoundaryNode(node) {
  return node?.type === "Statement" ? node.expression : node;
}
function extractScriptInterface(ast, resolvedPath) {
  const meaningful = [];
  for (let i = 0;i < ast.length; i++) {
    const node = unwrapScriptBoundaryNode(ast[i]);
    if (!node || node.type === "Comment")
      continue;
    meaningful.push({ index: i, node });
  }
  let inputContract = null;
  let exportBindings = null;
  const removeIndices = new Set;
  if (meaningful.length > 0 && meaningful[0].node.type === "ScriptBindingsDeclaration") {
    inputContract = meaningful[0].node.bindings;
    removeIndices.add(meaningful[0].index);
  }
  if (meaningful.length > 0 && meaningful[meaningful.length - 1].node.type === "ScriptBindingsDeclaration" && meaningful[meaningful.length - 1].index !== meaningful[0]?.index) {
    exportBindings = meaningful[meaningful.length - 1].node.bindings;
    removeIndices.add(meaningful[meaningful.length - 1].index);
  }
  const body = ast.filter((_, index) => !removeIndices.has(index));
  for (const stmt of body) {
    const node = unwrapScriptBoundaryNode(stmt);
    if (node?.type === "ScriptBindingsDeclaration") {
      throw new Error(`Script input/export declarations must appear only as the first or last statement (${resolvedPath})`);
    }
  }
  return { inputContract, exportBindings, body };
}
function prepareScript(resolvedPath, runtime) {
  const cached = runtime.preparedScripts.get(resolvedPath);
  if (cached) {
    return cached;
  }
  let source;
  try {
    source = fs_default.readFileSync(resolvedPath, "utf8");
  } catch (error) {
    throw new Error(`Unable to load script '${resolvedPath}': ${error.message}`);
  }
  const ast = parse(source, runtime.systemLookup || defaultSystemLookup);
  const { inputContract, exportBindings, body } = extractScriptInterface(ast, resolvedPath);
  const bodyIr = lower(body);
  attachSourceInfo(bodyIr, source, resolvedPath);
  const prepared = {
    path: resolvedPath,
    dir: path_default.dirname(resolvedPath),
    inputContract,
    exportBindings,
    bodyIr
  };
  runtime.preparedScripts.set(resolvedPath, prepared);
  return prepared;
}
function attachHiddenProperty(target, key, value) {
  Object.defineProperty(target, key, {
    value,
    enumerable: false,
    configurable: true
  });
}
function attachSourceInfo(node, source, file = "<repl>", seen = new Set) {
  if (!node || typeof node !== "object" || seen.has(node)) {
    return node;
  }
  seen.add(node);
  if (Array.isArray(node)) {
    for (const item of node)
      attachSourceInfo(item, source, file, seen);
    return node;
  }
  if (node.fn) {
    attachHiddenProperty(node, "__source", source);
    attachHiddenProperty(node, "__file", file);
  }
  if (Array.isArray(node.args)) {
    for (const arg of node.args)
      attachSourceInfo(arg, source, file, seen);
  }
  return node;
}
function getNodeLocation(irNode, context) {
  if (!irNode?.pos)
    return null;
  const source = irNode.__source ?? context?.getEnv?.(SOURCE_ENV_KEY, null);
  if (!source)
    return null;
  const file = irNode.__file ?? context?.getEnv?.(CURRENT_FILE_ENV_KEY, "<repl>");
  let offset = irNode.pos[1] ?? irNode.pos[0];
  if ((irNode.fn === "RETRIEVE" || irNode.fn === "OUTER_RETRIEVE") && typeof irNode.args?.[0] === "string") {
    const nameOffset = findIdentifierOffset(source, irNode.args[0], offset);
    if (nameOffset !== -1) {
      offset = nameOffset;
    }
  }
  const { line, col } = posToLineCol(source, offset);
  const filePart = file && file !== "<repl>" ? `${file}:` : "";
  return `${filePart}line ${line}, column ${col}`;
}
function findIdentifierOffset(source, name, approximateOffset) {
  const isIdentChar = (ch) => /[A-Za-z0-9_]/.test(ch);
  let offset = Math.max(0, Math.min(approximateOffset ?? source.length, source.length));
  while (offset >= 0) {
    const found = source.lastIndexOf(name, offset);
    if (found === -1)
      return -1;
    const before = found > 0 ? source[found - 1] : "";
    const after = source[found + name.length] || "";
    if (!isIdentChar(before) && !isIdentChar(after)) {
      return found;
    }
    offset = found - 1;
  }
  return -1;
}
function annotateEvaluationError(error, irNode, context) {
  if (!error || typeof error !== "object" || error.__rixLocationAttached) {
    return error;
  }
  const location2 = getNodeLocation(irNode, context);
  if (!location2)
    return error;
  error.message = `${error.message} (${location2})`;
  error.__rixLocationAttached = true;
  if (!error.rixLocation) {
    error.rixLocation = location2;
  }
  return error;
}
function restrictSystemContext(systemContext, allowedNames) {
  const child = new SystemContext(new Map, false);
  for (const name of systemContext.getAllNames()) {
    if (allowedNames.has(name)) {
      child.register(name, systemContext.get(name));
    }
  }
  child.freeze();
  return child;
}
function expandCapabilityTarget(modifier, availableFunctions, availablePermissions, groups, permissionNames) {
  if (modifier.targetType === "all") {
    return {
      functions: new Set(availableFunctions),
      permissions: new Set(availablePermissions)
    };
  }
  if (modifier.targetType === "function") {
    return {
      functions: new Set([modifier.target]),
      permissions: new Set
    };
  }
  const groupEntries = groups[modifier.target];
  if (!Array.isArray(groupEntries)) {
    throw new Error(`Unknown capability group: ${modifier.target}`);
  }
  const functions = new Set;
  const permissions = new Set;
  for (const name of groupEntries) {
    if (permissionNames.has(name)) {
      permissions.add(name);
    } else {
      functions.add(name);
    }
  }
  return { functions, permissions };
}
function deriveScriptCapabilityFrame(systemContext, parentPermissions, modifiers, context) {
  const { capabilityGroups, defaultPolicy, permissionNames } = getScriptCapabilityConfig(context);
  const availableFunctions = new Set(systemContext.getAllNames());
  const availablePermissions = new Set(parentPermissions);
  const allowedFunctions = defaultPolicy.includeAllFunctions ? new Set(availableFunctions) : new Set((defaultPolicy.functions || []).filter((name) => availableFunctions.has(name)));
  const allowedPermissions = new Set((defaultPolicy.permissions || []).filter((name) => availablePermissions.has(name)));
  for (const modifier of modifiers || []) {
    const expanded = expandCapabilityTarget(modifier, availableFunctions, availablePermissions, capabilityGroups, permissionNames);
    if (modifier.action === "add") {
      for (const name of expanded.functions) {
        if (availableFunctions.has(name)) {
          allowedFunctions.add(name);
        }
      }
      for (const name of expanded.permissions) {
        if (availablePermissions.has(name)) {
          allowedPermissions.add(name);
        }
      }
      continue;
    }
    for (const name of expanded.functions) {
      allowedFunctions.delete(name);
    }
    for (const name of expanded.permissions) {
      allowedPermissions.delete(name);
    }
  }
  return {
    systemContext: restrictSystemContext(systemContext, allowedFunctions),
    functionNames: allowedFunctions,
    permissions: allowedPermissions
  };
}
function validateInputsAgainstContract(inputSpecs, inputContract) {
  if (!Array.isArray(inputContract) || inputContract.length === 0) {
    return;
  }
  const actualByTarget = new Map((inputSpecs || []).map((spec) => [spec.target, spec]));
  for (const contract of inputContract) {
    const actual = actualByTarget.get(contract.target);
    if (!actual) {
      throw new Error(`Missing required script input: ${contract.target}`);
    }
    if (contract.mode === "alias" && actual.mode !== "alias") {
      throw new Error(`Script input '${contract.target}' requires alias passing`);
    }
    if (contract.mode !== "alias" && actual.mode === "alias") {
      throw new Error(`Script input '${contract.target}' requires copy-style passing`);
    }
  }
}
function bindScriptInputs(scriptContext, parentContext, inputSpecs, inputContract) {
  validateInputsAgainstContract(inputSpecs, inputContract);
  for (const spec of inputSpecs || []) {
    const sourceCell = resolveCallerBindingCell(parentContext, spec);
    applyBindingToCurrentScope(scriptContext, spec.target, sourceCell, spec.mode);
  }
}
function buildExportBundle(scriptContext, exportBindings) {
  const entries = new Map;
  for (const spec of exportBindings || []) {
    const sourceCell = scriptContext.getCell(spec.source);
    if (!sourceCell) {
      throw new Error(`Cannot export undefined script binding: ${spec.source}`);
    }
    entries.set(spec.target, buildBoundCell(sourceCell, spec.mode));
  }
  return {
    type: "export_bundle",
    entries
  };
}
function getExportBundleCell(bundle, name) {
  if (!bundle || bundle.type !== "export_bundle" || !(bundle.entries instanceof Map)) {
    return null;
  }
  return bundle.entries.get(name) ?? null;
}
function applyCallerOutputBindings(context, outputSpecs, bundle) {
  for (const spec of outputSpecs || []) {
    const sourceCell = getExportBundleCell(bundle, spec.source);
    if (!sourceCell) {
      throw new Error(`Unknown script export: ${spec.source}`);
    }
    applyBindingToCurrentScope(context, spec.target, sourceCell, spec.mode);
  }
}
function resolveScriptPath(requestedPath, runtime, context) {
  const currentFrame = runtime.frameStack[runtime.frameStack.length - 1];
  const baseDir = currentFrame?.dir || context.getEnv("scriptBaseDir", process.cwd());
  const relativePath = requestedPath.endsWith(".rix") ? requestedPath : `${requestedPath}.rix`;
  return path_default.resolve(baseDir, relativePath);
}
function evaluateScriptImport(spec, context, registry, systemContext) {
  const runtime = getScriptRuntime(context);
  const parentFrame = runtime.frameStack[runtime.frameStack.length - 1] || null;
  if (parentFrame && !parentFrame.permissions.has("IMPORTS")) {
    throw new Error("Script imports are not allowed in this script context");
  }
  const resolvedPath = resolveScriptPath(spec.path, runtime, context);
  if (runtime.activeImports.includes(resolvedPath)) {
    throw new Error(`Cyclic script import detected: ${[...runtime.activeImports, resolvedPath].join(" -> ")}`);
  }
  const prepared = prepareScript(resolvedPath, runtime);
  const parentPermissions = parentFrame ? new Set(parentFrame.permissions) : getHostAvailablePermissions(context);
  const capabilityFrame = deriveScriptCapabilityFrame(systemContext, parentPermissions, spec.capabilityModifiers || [], context);
  const scriptContext = new Context;
  scriptContext.env = context.env;
  installSymbolicBindings(scriptContext);
  scriptContext.push(undefined, { isolated: true, callableBoundary: true });
  runtime.activeImports.push(resolvedPath);
  runtime.frameStack.push({
    path: prepared.path,
    dir: prepared.dir,
    functionNames: capabilityFrame.functionNames,
    permissions: capabilityFrame.permissions
  });
  try {
    bindScriptInputs(scriptContext, context, spec.inputs || [], prepared.inputContract);
    let finalResult = null;
    for (const node of prepared.bodyIr) {
      finalResult = evaluate(node, scriptContext, registry, capabilityFrame.systemContext);
    }
    if (!prepared.exportBindings || prepared.exportBindings.length === 0) {
      if (spec.outputs && spec.outputs.length > 0) {
        throw new Error("Caller-side script outputs require the imported script to declare exports");
      }
      return finalResult;
    }
    const bundle = buildExportBundle(scriptContext, prepared.exportBindings);
    applyCallerOutputBindings(context, spec.outputs || [], bundle);
    return bundle;
  } finally {
    runtime.frameStack.pop();
    runtime.activeImports.pop();
    scriptContext.pop();
  }
}
function evaluate(irNode, context, registry, systemContext) {
  if (irNode === null || irNode === undefined) {
    return null;
  }
  if (typeof irNode !== "object") {
    return irNode;
  }
  if (Array.isArray(irNode)) {
    return irNode;
  }
  if (!irNode.fn) {
    return irNode;
  }
  const { fn, args } = irNode;
  if (fn === "DEFER") {
    return irNode;
  }
  try {
    if (fn === "SCRIPT_IMPORT") {
      return evaluateScriptImport(args[0] || {}, context, registry, systemContext);
    }
    const evalFn = (node) => evaluate(node, context, registry, systemContext);
    if (fn === "SYS_OBJ") {
      if (!systemContext)
        throw new Error("No system context available");
      return systemContext.copy().toRixValue();
    }
    if (fn === "SYS_GET") {
      const name = args[0];
      if (!systemContext)
        throw new Error("No system context available");
      if (name === "FREEZE" || name === "freeze") {
        return systemContext.frozen ? 1 : 0;
      }
      if (!systemContext.has(name)) {
        throw new Error(`Unknown system capability: ${name}`);
      }
      return { type: "sysref", name };
    }
    if (fn === "SYS_CALL") {
      const name = args[0];
      const callArgNodes = args.slice(1);
      if (!systemContext)
        throw new Error("No system context available");
      const cap = systemContext.get(name);
      if (!cap) {
        throw new Error(`Unknown system capability: ${name}. Use .${name}() only if the capability exists.`);
      }
      const isPlaceholder = (n) => n && typeof n === "object" && n.fn === "PLACEHOLDER";
      if (callArgNodes.some(isPlaceholder)) {
        const template = callArgNodes.map((a) => evalFn(a));
        return { type: "partial", fn: { type: "sysref", name }, template };
      }
      if (cap.lazy) {
        return cap.impl(callArgNodes, context, evalFn);
      }
      const callArgs = callArgNodes.map((a) => {
        if (a === null || a === undefined)
          return a;
        if (typeof a !== "object")
          return a;
        if (Array.isArray(a))
          return a;
        if (!a.fn)
          return a;
        return evalFn(a);
      });
      return cap.impl(callArgs, context, evalFn);
    }
    if (fn === "SYS_SET") {
      const name = args[0];
      const value = evalFn(args[1]);
      if (!systemContext)
        throw new Error("No system context available");
      const normalised = name.toUpperCase ? name.toUpperCase() : name;
      if (normalised === "FREEZE") {
        if (value)
          systemContext.freeze();
        return value;
      }
      throw new Error(`Cannot set system context property '${name}' via assignment. Use .Withhold() or .With() to create a modified copy.`);
    }
    const funcDef = registry.get(fn);
    if (!funcDef) {
      throw new Error(`Unknown system function: ${fn}`);
    }
    if (funcDef.lazy) {
      return funcDef.impl(args, context, evalFn);
    }
    const evaluatedArgs = [];
    for (const arg of args) {
      if (arg === null || arg === undefined) {
        evaluatedArgs.push(arg);
      } else if (typeof arg !== "object" || Array.isArray(arg) || !arg.fn) {
        evaluatedArgs.push(arg);
      } else if (arg.fn === "SPREAD") {
        const spreadVal = evalFn(arg.args[0]);
        if (spreadVal && (spreadVal.type === "tuple" || spreadVal.type === "sequence" || spreadVal.type === "array" || spreadVal.type === "set")) {
          const items = spreadVal.values || spreadVal.elements || [];
          evaluatedArgs.push(...items);
        } else {
          throw new Error("Spread operator requires an iterable collection (array, tuple, sequence, set)");
        }
      } else {
        evaluatedArgs.push(evalFn(arg));
      }
    }
    if (!funcDef.holeAware) {
      for (const arg of evaluatedArgs) {
        if (isHole(arg)) {
          throw new Error(`Cannot use undefined/hole value in computation (in ${fn})`);
        }
      }
    }
    return funcDef.impl(evaluatedArgs, context, evalFn);
  } catch (error) {
    throw annotateEvaluationError(error, irNode, context);
  }
}
function parseAndEvaluate(code, options = {}) {
  const context = options.context || new Context;
  if (!options.context) {
    installSymbolicBindings(context);
  }
  const registry = options.registry || createDefaultRegistry();
  const systemContext = options.systemContext || createDefaultSystemContext();
  const systemLookup = options.systemLookup || defaultSystemLookup;
  getScriptRuntime(context, { systemLookup });
  context.setEnv("__registry__", registry);
  context.setEnv(SOURCE_ENV_KEY, code);
  context.setEnv(CURRENT_FILE_ENV_KEY, options.file || "<repl>");
  const ast = parse(code, systemLookup);
  const irNodes = lower(ast);
  attachSourceInfo(irNodes, code, options.file || "<repl>");
  let result = null;
  for (const irNode of irNodes) {
    result = evaluate(irNode, context, registry, systemContext);
  }
  return result;
}
function defaultSystemLookup(name) {
  const builtins = {
    SIN: { type: "function", arity: 1 },
    COS: { type: "function", arity: 1 },
    TAN: { type: "function", arity: 1 },
    LOG: { type: "function", arity: 1 },
    EXP: { type: "function", arity: 1 },
    SQRT: { type: "function", arity: 1 },
    ABS: { type: "function", arity: 1 },
    MAX: { type: "function", arity: -1 },
    MIN: { type: "function", arity: -1 },
    PI: { type: "constant" },
    E: { type: "constant" },
    AND: { type: "function", lazy: true },
    OR: { type: "function", lazy: true },
    NOT: { type: "function" },
    IF: { type: "identifier" },
    HELP: { type: "identifier" },
    LOAD: { type: "identifier" },
    UNLOAD: { type: "identifier" }
  };
  return builtins[name] || { type: "identifier" };
}
// src/repl-source.js
var statementClosers = new Set([")", "]", "}"]);
function isComment(token) {
  return token?.type === "String" && token.kind === "comment";
}
function canEndStatement(token) {
  if (!token || isComment(token))
    return false;
  if (token.type !== "Symbol")
    return token.type !== "End";
  return statementClosers.has(token.value) || token.value === "^^";
}
function canStartStatement(token) {
  if (!token || isComment(token) || token.type === "End")
    return false;
  if (token.type !== "Symbol")
    return true;
  return ["(", "[", "{", "-", "+", "!", "_", "@", "@_"].includes(token.value);
}
function normalizeReplSource(source) {
  let tokens;
  try {
    tokens = tokenize(source);
  } catch {
    return source;
  }
  const insertions = [];
  let depth = 0;
  let previous = null;
  for (const token of tokens) {
    if (token.type === "End")
      break;
    if (!isComment(token) && previous) {
      const whitespaceBetween = source.slice(previous.pos[2], token.pos[1]);
      if (depth === 0 && whitespaceBetween.includes(`
`) && canEndStatement(previous) && canStartStatement(token)) {
        insertions.push(previous.pos[2]);
      }
    }
    if (!isComment(token)) {
      if (["(", "[", "{"].includes(token.value))
        depth += 1;
      if ([")", "]", "}"].includes(token.value))
        depth = Math.max(0, depth - 1);
      previous = token;
    }
  }
  return insertions.sort((left, right) => right - left).reduce((result, position) => `${result.slice(0, position)};${result.slice(position)}`, source);
}

// src/main.js
var starterCode = `radius := 7
area := radius ^ 2 * 22 / 7
area`;
var storageKey = "rix-lab:editor";
var codeInput = document.querySelector("#code-input");
var flow = document.querySelector("#result-flow");
var variablesPanel = document.querySelector("#variables-panel");
var helpDialog = document.querySelector("#help-dialog");
var moduleDialog = document.querySelector("#module-dialog");
var fileInput = document.querySelector("#file-input");
var modulePreview = document.querySelector("#module-preview");
var state = {
  context: new Context,
  registry: createDefaultRegistry(),
  systemContext: createDefaultSystemContext(),
  runCount: 0
};
installSymbolicBindings(state.context);
var helpGroups = [
  {
    title: "Everyday syntax",
    items: [
      ["x := 3", "Bind a fresh value. Use this for ordinary assignments."],
      ["y = x", "Alias x's cell. An in-place update to either name is shared."],
      ["x ~= 9", "Replace the value in an existing cell, preserving aliases."],
      ["7 / 2", "Exact division. The result remains the rational 7/2."]
    ]
  },
  {
    title: "Collections & intervals",
    items: [
      ["[1, 2, 3]", "An array. Indexes begin at 1: a[2] is 2."],
      ["{| 1, 2 |}", "A set."],
      ["{= a=3, b=5 }", "A map."],
      ["2:5", "A rational interval from 2 to 5."]
    ]
  },
  {
    title: "Functions & capabilities",
    items: [
      ["Square(x) -> x ^ 2", "Define a callable with an uppercase name."],
      ["Square(12)", "Call a user-defined function."],
      [".SIN(x)", "Call a system capability via the dot prefix."],
      ["x > 0 ?? x ?: -x", "A compact conditional expression."]
    ]
  },
  {
    title: "Notebook commands",
    items: [
      ["Run cell", "Evaluate the editor in the current workspace. Results flow into the trail below."],
      ["New line", "At the top level of a notebook cell, a completed line starts the next statement. Use semicolons when you prefer explicit separators."],
      ["New session", "Clear variables and start a fresh persistent workspace."],
      ["Load .rix", "Put a RiX file into the editor, ready to run."],
      ["Load .js", "Preview a JavaScript module; execution is intentionally reserved for an explicit trust model."]
    ]
  }
];
function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#039;",
    '"': "&quot;"
  })[character]);
}
function sourcePreview(source) {
  const lines = source.trim().split(`
`);
  return lines.length > 7 ? `${lines.slice(0, 7).join(`
`)}
…` : source.trim();
}
function resetWorkspace() {
  state.context.clear();
  installSymbolicBindings(state.context);
  state.runCount = 0;
  flow.innerHTML = `<div class="empty-flow"><span>→</span><p>Fresh workspace, clear trail.<br />Your next result starts here.</p></div>`;
  renderVariables();
}
function renderVariables() {
  const names = state.context.getAllNames();
  if (names.length === 0) {
    variablesPanel.innerHTML = `<p class="mini-heading">Current scope</p><p class="variables-empty">No names yet. Run a line with <code>:=</code> to keep a value.</p>`;
    return;
  }
  const items = names.map((name) => {
    let preview = "function";
    try {
      preview = formatValue(state.context.get(name), { context: state.context, evaluate: null });
    } catch {
      preview = "value";
    }
    return `<li><code>${escapeHtml(name)}</code><span>${escapeHtml(preview)}</span></li>`;
  }).join("");
  variablesPanel.innerHTML = `<p class="mini-heading">Current scope · ${names.length}</p><ul class="variable-list">${items}</ul>`;
}
function appendResult(source, result, error = null) {
  state.runCount += 1;
  flow.querySelector(".empty-flow")?.remove();
  const output = error ? error.message || String(error) : formatValue(result, { context: state.context, evaluate: null });
  const card = document.createElement("article");
  card.className = `result-card${error ? " error" : ""}`;
  card.innerHTML = `<div class="result-index">${String(state.runCount).padStart(2, "0")}</div>
      <div class="result-body"><pre class="result-source">${escapeHtml(sourcePreview(source))}</pre>
      <div class="result-output"><span class="result-badge">${error ? "error" : "result"}</span><code>${escapeHtml(output)}</code></div></div>`;
  flow.prepend(card);
}
function runCode() {
  const source = codeInput.value.trim();
  if (!source)
    return;
  try {
    const result = parseAndEvaluate(normalizeReplSource(source), {
      context: state.context,
      registry: state.registry,
      systemContext: state.systemContext,
      file: "<browser-repl>"
    });
    appendResult(source, result);
    renderVariables();
  } catch (error) {
    appendResult(source, null, error);
    renderVariables();
  }
}
function renderHelp(query = "") {
  const normalized = query.trim().toLowerCase();
  const groups = helpGroups.map((group) => ({
    ...group,
    items: group.items.filter(([syntax, description]) => !normalized || `${syntax} ${description} ${group.title}`.toLowerCase().includes(normalized))
  })).filter((group) => group.items.length > 0);
  document.querySelector("#help-content").innerHTML = groups.length ? groups.map((group) => `<section class="help-group"><h3>${group.title}</h3>${group.items.map(([syntax, description]) => `<div class="help-item"><code>${escapeHtml(syntax)}</code><p>${escapeHtml(description)}</p></div>`).join("")}</section>`).join("") : `<p class="variables-empty">No matching reference entry. Try “array”, “assignment”, or “function”.</p>`;
}
function openHelp() {
  renderHelp();
  helpDialog.showModal();
  document.querySelector("#help-search-input").focus();
}
function saveCode() {
  const blob = new Blob([codeInput.value], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "experiment.rix";
  anchor.click();
  URL.revokeObjectURL(url);
}
async function loadFile(file) {
  const text = await file.text();
  if (file.name.toLowerCase().endsWith(".js")) {
    modulePreview.textContent = text.slice(0, 1800);
    moduleDialog.showModal();
    return;
  }
  codeInput.value = text;
  localStorage.setItem(storageKey, text);
  codeInput.focus();
}
function loadTutorialCode() {
  const encoded = new URLSearchParams(location.search).get("code");
  if (!encoded)
    return false;
  try {
    codeInput.value = decodeURIComponent(encoded);
    history.replaceState({}, "", location.pathname);
    return true;
  } catch {
    return false;
  }
}
document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-action]");
  if (!trigger)
    return;
  const action = trigger.dataset.action;
  if (action === "run")
    runCode();
  if (action === "reset")
    resetWorkspace();
  if (action === "load")
    fileInput.click();
  if (action === "save")
    saveCode();
  if (action === "help")
    openHelp();
  if (action === "close-help")
    helpDialog.close();
  if (action === "close-module")
    moduleDialog.close();
  if (action === "clear-results") {
    state.runCount = 0;
    flow.innerHTML = `<div class="empty-flow"><span>→</span><p>The trail is clear.<br />Your next result will land here.</p></div>`;
  }
});
document.querySelectorAll("[data-inspector]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-inspector]").forEach((item) => item.classList.toggle("active", item === button));
    variablesPanel.classList.toggle("hidden", button.dataset.inspector !== "variables");
    document.querySelector("#quick-help-panel").classList.toggle("hidden", button.dataset.inspector !== "help");
  });
});
document.querySelector("#help-search-input").addEventListener("input", (event) => renderHelp(event.target.value));
fileInput.addEventListener("change", async () => {
  const [file] = fileInput.files;
  if (file)
    await loadFile(file);
  fileInput.value = "";
});
codeInput.addEventListener("input", () => localStorage.setItem(storageKey, codeInput.value));
codeInput.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
    event.preventDefault();
    runCode();
  }
  if (event.key === "Tab") {
    event.preventDefault();
    const start = codeInput.selectionStart;
    const end = codeInput.selectionEnd;
    codeInput.setRangeText("  ", start, end, "end");
  }
});
var loadedFromTutorial = loadTutorialCode();
if (!loadedFromTutorial)
  codeInput.value = localStorage.getItem(storageKey) || starterCode;
renderVariables();

//# debugId=5B26B0157AAAB7D164756E2164756E21
//# sourceMappingURL=main.js.map
