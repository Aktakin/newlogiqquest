import type { QuizPrompt, TokenPrompt } from './types';

/**
 * A fixed, curated bank. Prompts are addressed by id so the server can re-grade
 * any submission without trusting the client to report what it asked.
 */

const token = (id: string, answer: string, label: string, tier: 1 | 2 | 3): TokenPrompt => ({
  id,
  kind: 'token',
  answer,
  label,
  tier,
});

export const TOKENS: TokenPrompt[] = [
  // Tier 1 — one convention, short.
  token('t-summer-camp', 'SummerCamp', 'PascalCase class name', 1),
  token('t-api-key', 'API_KEY', 'environment variable', 1),
  token('t-user-name', 'userName', 'camelCase variable', 1),
  token('t-data-id', 'data-id', 'kebab-case HTML attribute', 1),
  token('t-max-size', 'max_size', 'snake_case field', 1),
  token('t-is-ready', 'isReady', 'boolean flag', 1),
  token('t-home-page', 'HomePage', 'PascalCase component', 1),
  token('t-base-url', 'BASE_URL', 'constant', 1),
  token('t-on-click', 'onClick', 'event handler prop', 1),
  token('t-node-env', 'NODE_ENV', 'environment variable', 1),

  // Tier 2 — longer, or two conventions meeting.
  token('t-douglas-camp', 'douglasCollegeYouthCamp', 'camelCase variable', 2),
  token('t-max-retry', 'MAX_RETRY_COUNT', 'constant', 2),
  token('t-get-user', 'getUserById', 'camelCase function', 2),
  token('t-account-manager', 'UserAccountManager', 'PascalCase class', 2),
  token('t-aria-labelled', 'aria-labelledby', 'accessibility attribute', 2),
  token('t-profile-id', 'user_profile_id', 'snake_case column', 2),
  token('t-http-timeout', 'HTTP_TIMEOUT_MS', 'constant', 2),
  token('t-parse-int', 'parseIntSafely', 'camelCase function', 2),
  token('t-db-connection', 'DatabaseConnection', 'PascalCase class', 2),
  token('t-keydown', 'onKeyDownCapture', 'event handler prop', 2),
  token('t-to-json', 'toJSON', 'method with an acronym', 2),
  token('t-content-type', 'Content-Type', 'HTTP header', 2),

  // Tier 3 — acronyms, digits and mixed conventions in one token.
  token('t-xhr', 'XMLHttpRequest', 'browser API with acronym', 3),
  token('t-jwt', 'JSONWebToken', 'acronym then PascalCase', 3),
  token('t-ios-token', 'iOSDeviceToken', 'lowercase acronym prefix', 3),
  token('t-oauth', 'OAuth2Client', 'acronym with a digit', 3),
  token('t-parse-url', 'parseURLParams', 'acronym inside camelCase', 3),
  token('t-io-error', 'IOError_404', 'acronym and snake_case digits', 3),
  token('t-my-api-key', 'myAPI_KeyV2', 'three conventions at once', 3),
  token('t-html-ref', 'HTMLElementRef', 'acronym then PascalCase', 3),
  token('t-mounted-ref', 'useIsMountedRef', 'hook name', 3),
  token('t-sha', 'SHA256_HASH_HEX', 'constant with digits', 3),
  token('t-camel-snake', 'camelCaseToSnake_case', 'conventions colliding', 3),
  token('t-douglas-2026', 'douglasCollege_YouthCamp2026', 'mixed case with a year', 3),

  // Tier 3 — full lines, punctuation included.
  token('t-use-state', 'const [count, setCount] = useState(0);', 'line of React code', 3),
  token('t-optional', 'if (user?.name !== null) {}', 'line of JavaScript', 3),
  token('t-filter', 'arr.filter((x) => x > 0);', 'line of JavaScript', 3),
  token('t-fetch', "await fetch('/api/v1/users');", 'line of JavaScript', 3),
];

interface QuizSpec {
  ask: string;
  code?: string;
  options: string[];
  correct: number;
  layout?: 'pill' | 'code';
  explain: string;
  tier: 1 | 2 | 3;
}

const quiz = (id: string, spec: QuizSpec): QuizPrompt => ({
  id,
  kind: 'quiz',
  layout: 'pill',
  ...spec,
});

/** True/false questions all share the same option list. */
const TF = ['True', 'False'];
const PRINTS = 'What is printed?';

export const QUIZZES: QuizPrompt[] = [
  // Tier 1 — read one line and pick the answer.
  quiz('q-hello-bang', {
    ask: PRINTS,
    code: 'console.log("Hello world!");',
    options: ['Hello world!', 'Hello world', '"Hello world!"'],
    correct: 0,
    explain: 'The text prints exactly as written. The exclamation mark counts; the quotes do not print.',
    tier: 1,
  }),
  quiz('q-quote-style', {
    ask: 'Which line prints Hello world with no exclamation mark?',
    layout: 'code',
    options: ["console.log('Hello world');", 'console.log("Hello world!");'],
    correct: 0,
    explain: 'Single and double quotes behave the same. Only the characters inside them matter.',
    tier: 1,
  }),
  quiz('q-console-case', {
    ask: 'Which line runs without an error?',
    layout: 'code',
    options: ['console.log("hi");', 'Console.log("hi");'],
    correct: 0,
    explain: 'JavaScript is case-sensitive, and console is spelled with a lowercase c.',
    tier: 1,
  }),
  quiz('q-var-case', {
    ask: 'True or false: userName and username are the same variable.',
    options: TF,
    correct: 1,
    explain: 'Case is part of a name, so those are two different variables.',
    tier: 1,
  }),
  quiz('q-add', {
    ask: 'What is x?',
    code: 'let x = 2 + 3;',
    options: ['5', '23', '"5"'],
    correct: 0,
    explain: 'Two numbers add up the way you would expect.',
    tier: 1,
  }),
  quiz('q-typeof-string', {
    ask: PRINTS,
    code: 'console.log(typeof "42");',
    options: ['string', 'number', 'integer'],
    correct: 0,
    explain: 'The quotes make it text, even though it looks like a number.',
    tier: 1,
  }),
  quiz('q-declare', {
    ask: 'Which line declares a value you can change later?',
    layout: 'code',
    options: ['let score = 0;', 'const score = 0;'],
    correct: 0,
    explain: 'let can be reassigned. const cannot.',
    tier: 1,
  }),
  quiz('q-length', {
    ask: PRINTS,
    code: 'console.log("Hello".length);',
    options: ['5', '4', '6'],
    correct: 0,
    explain: 'length counts every character, including any spaces.',
    tier: 1,
  }),

  // Tier 2 — types quietly changing under your feet.
  quiz('q-concat-num', {
    ask: PRINTS,
    code: 'console.log("5" + 3);',
    options: ['53', '8', 'NaN'],
    correct: 0,
    explain: 'A string plus a number joins them instead of adding.',
    tier: 2,
  }),
  quiz('q-sub-num', {
    ask: PRINTS,
    code: 'console.log("5" - 3);',
    options: ['2', '53', 'NaN'],
    correct: 0,
    explain: 'Minus has no string meaning, so "5" is converted to a number first.',
    tier: 2,
  }),
  quiz('q-boolean-empty', {
    ask: 'True or false: Boolean("") is true.',
    options: TF,
    correct: 1,
    explain: 'An empty string is falsy, so it converts to false.',
    tier: 2,
  }),
  quiz('q-greeting', {
    ask: 'Which line prints Hi, Ada?',
    code: 'let name = "Ada";',
    layout: 'code',
    options: ['console.log("Hi, " + name);', 'console.log("Hi, name");'],
    correct: 0,
    explain: 'Inside quotes, name is just letters. Outside them, it is the variable.',
    tier: 2,
  }),
  quiz('q-repeat', {
    ask: PRINTS,
    code: 'console.log("JS".repeat(2));',
    options: ['JSJS', 'JS JS', 'JS2'],
    correct: 0,
    explain: 'repeat glues the string to itself with nothing in between.',
    tier: 2,
  }),
  quiz('q-index', {
    ask: 'True or false: in "camp", s[1] is "c".',
    code: 'let s = "camp";',
    options: TF,
    correct: 1,
    explain: 'Positions start at 0, so s[0] is "c" and s[1] is "a".',
    tier: 2,
  }),
  quiz('q-upper', {
    ask: PRINTS,
    code: 'let name = "ada";\nconsole.log(name.toUpperCase());',
    options: ['ADA', 'ada', 'Ada'],
    correct: 0,
    explain: 'toUpperCase returns a new string with every letter capitalised.',
    tier: 2,
  }),
  quiz('q-camel', {
    ask: 'Which name is correct camelCase for "total user count"?',
    options: ['totalUserCount', 'TotalUserCount', 'total_user_count'],
    correct: 0,
    explain: 'camelCase starts lowercase, then capitalises each following word.',
    tier: 2,
  }),
  quiz('q-loop-range', {
    ask: 'Which loop prints 0, 1 and 2 — and nothing else?',
    layout: 'code',
    options: [
      'for (let i = 0; i < 3; i++) console.log(i);',
      'for (let i = 0; i <= 3; i++) console.log(i);',
    ],
    correct: 0,
    explain: 'With <= 3 the loop runs one extra time and also prints 3.',
    tier: 2,
  }),
  quiz('q-join', {
    ask: PRINTS,
    code: 'console.log([1, 2, 3].join("-"));',
    options: ['1-2-3', '123', '[1-2-3]'],
    correct: 0,
    explain: 'join builds one string with the separator between the items.',
    tier: 2,
  }),
  quiz('q-const', {
    ask: 'True or false: a const can be given a new value later.',
    options: TF,
    correct: 1,
    explain: 'Reassigning a const throws a TypeError.',
    tier: 2,
  }),

  // Tier 3 — equality, scope and the classic gotchas.
  quiz('q-loose-eq', {
    ask: 'True or false: 1 == "1" is true.',
    options: TF,
    correct: 0,
    explain: '== converts the types before comparing, so the number and the text match.',
    tier: 3,
  }),
  quiz('q-strict-eq', {
    ask: PRINTS,
    code: 'console.log(1 === "1");',
    options: ['false', 'true', 'NaN'],
    correct: 0,
    explain: '=== compares type as well as value, and a number is not a string.',
    tier: 3,
  }),
  quiz('q-equality-pick', {
    ask: 'Which comparison is true?',
    layout: 'code',
    options: ['0 == "0"', '0 === "0"'],
    correct: 0,
    explain: 'Only the loose == converts the string before comparing.',
    tier: 3,
  }),
  quiz('q-typeof-array', {
    ask: PRINTS,
    code: 'console.log(typeof []);',
    options: ['object', 'array', 'list'],
    correct: 0,
    explain: 'Arrays are objects — a famous JavaScript quirk.',
    tier: 3,
  }),
  quiz('q-arrow', {
    ask: 'Which arrow function returns x doubled?',
    layout: 'code',
    options: ['const d = (x) => x * 2;', 'const d = (x) => { x * 2; };'],
    correct: 0,
    explain: 'With braces you must write return, otherwise the function returns undefined.',
    tier: 3,
  }),
  quiz('q-scope', {
    ask: PRINTS,
    code: 'let v = "outer";\n{ let v = "inner"; }\nconsole.log(v);',
    options: ['outer', 'inner', 'undefined'],
    correct: 0,
    explain: 'The inner let only exists inside the braces.',
    tier: 3,
  }),
  quiz('q-sort', {
    ask: PRINTS,
    code: 'console.log([3, 1, 2].sort()[0]);',
    options: ['1', '3', '2'],
    correct: 0,
    explain: 'sort puts the array in order, so the first item is the smallest.',
    tier: 3,
  }),
  quiz('q-nullish', {
    ask: PRINTS,
    code: 'console.log(null ?? "fallback");',
    options: ['fallback', 'null', 'undefined'],
    correct: 0,
    explain: '?? supplies the right-hand value when the left is null or undefined.',
    tier: 3,
  }),
  quiz('q-spread', {
    ask: PRINTS,
    code: 'console.log([..."hi"].length);',
    options: ['2', '1', '4'],
    correct: 0,
    explain: 'Spreading a string gives one item per character.',
    tier: 3,
  }),
  quiz('q-mutate-const', {
    ask: 'True or false: this code throws an error.',
    code: 'const list = [1, 2];\nlist.push(3);',
    options: TF,
    correct: 1,
    explain: 'const stops the name being reassigned, not the array being changed.',
    tier: 3,
  }),
];

export const PROMPTS = [...TOKENS, ...QUIZZES];

export const promptById = (id: string) => PROMPTS.find((prompt) => prompt.id === id);
