import type { QuizPrompt, TokenPrompt } from './types';

const token = (id: string, answer: string, label: string): TokenPrompt => ({
  id,
  kind: 'token',
  answer,
  label,
  tier: 1,
});

/** Short, friendly words only — lowercase so little fingers have less to worry about. */
export const MINI_TOKENS: TokenPrompt[] = [
  // 3 letters
  token('m-cat', 'cat', 'animal'),
  token('m-dog', 'dog', 'animal'),
  token('m-sun', 'sun', 'sky'),
  token('m-hop', 'hop', 'frog move'),
  token('m-fly', 'fly', 'in the sky'),
  token('m-egg', 'egg', 'breakfast'),
  token('m-bus', 'bus', 'vehicle'),
  token('m-red', 'red', 'colour'),
  token('m-run', 'run', 'go fast'),
  token('m-sky', 'sky', 'above us'),
  token('m-bee', 'bee', 'insect'),
  token('m-owl', 'owl', 'night bird'),

  // 4 letters
  token('m-frog', 'frog', 'pond animal'),
  token('m-lily', 'lily', 'pond flower'),
  token('m-pond', 'pond', 'where frogs live'),
  token('m-play', 'play', 'have fun'),
  token('m-game', 'game', 'something fun'),
  token('m-star', 'star', 'in the night sky'),
  token('m-moon', 'moon', 'at night'),
  token('m-tree', 'tree', 'in the park'),
  token('m-bird', 'bird', 'flies high'),
  token('m-fish', 'fish', 'swims'),
  token('m-jump', 'jump', 'up in the air'),
  token('m-rock', 'rock', 'on the ground'),
  token('m-duck', 'duck', 'says quack'),
  token('m-rain', 'rain', 'from clouds'),
  token('m-snow', 'snow', 'cold and white'),
  token('m-kite', 'kite', 'flies on a string'),
  token('m-book', 'book', 'for reading'),
  token('m-ball', 'ball', 'for kicking'),
  token('m-blue', 'blue', 'colour'),
  token('m-pink', 'pink', 'colour'),

  // 5 letters
  token('m-apple', 'apple', 'fruit'),
  token('m-puppy', 'puppy', 'baby dog'),
  token('m-pizza', 'pizza', 'yummy food'),
  token('m-dance', 'dance', 'move to music'),
  token('m-music', 'music', 'songs'),
  token('m-robot', 'robot', 'beep boop'),
  token('m-candy', 'candy', 'sweet treat'),
  token('m-cloud', 'cloud', 'fluffy sky'),
  token('m-smile', 'smile', 'happy face'),
  token('m-water', 'water', 'drink this'),
  token('m-green', 'green', 'colour'),
  token('m-peach', 'peach', 'fruit'),
  token('m-happy', 'happy', 'feeling good'),
  token('m-tiger', 'tiger', 'stripy cat'),
  token('m-bunny', 'bunny', 'fluffy animal'),

  // 6 letters — still short, still words
  token('m-purple', 'purple', 'colour'),
  token('m-banana', 'banana', 'yellow fruit'),
  token('m-friend', 'friend', 'someone kind'),
  token('m-dragon', 'dragon', 'fire creature'),
  token('m-castle', 'castle', 'fairy tale'),
  token('m-soccer', 'soccer', 'kick a ball'),
  token('m-monkey', 'monkey', 'swings in trees'),
  token('m-turtle', 'turtle', 'slow animal'),
  token('m-rabbit', 'rabbit', 'hops around'),
  token('m-flower', 'flower', 'smells nice'),

  // 7 letters — gentle stretch words kids know
  token('m-rainbow', 'rainbow', 'colours in the sky'),
  token('m-chicken', 'chicken', 'farm bird'),
  token('m-penguin', 'penguin', 'ice bird'),
  token('m-dolphin', 'dolphin', 'sea friend'),
  token('m-roblox', 'roblox', 'online game'),
  token('m-mario', 'mario', 'game hero'),
  token('m-sonic', 'sonic', 'fast hedgehog'),
];

interface QuizSpec {
  ask: string;
  options: string[];
  correct: number;
  explain: string;
}

const quiz = (id: string, spec: QuizSpec): QuizPrompt => ({
  id,
  kind: 'quiz',
  layout: 'pill',
  tier: 1,
  ...spec,
});

export const MINI_QUIZZES: QuizPrompt[] = [
  // Games & cartoons
  quiz('mq-robux', {
    ask: 'What is the money called in Roblox?',
    options: ['Robux', 'Coins', 'Gems', 'Bells'],
    correct: 0,
    explain: 'Robux is what you spend in the Roblox shop.',
  }),
  quiz('mq-sponge', {
    ask: 'Who lives in a pineapple under the sea?',
    options: ['SpongeBob', 'Patrick', 'Squidward', 'Plankton'],
    correct: 0,
    explain: 'SpongeBob SquarePants lives in a pineapple at the bottom of the ocean.',
  }),
  quiz('mq-luigi', {
    ask: "What is Mario's brother called?",
    options: ['Luigi', 'Wario', 'Yoshi', 'Toad'],
    correct: 0,
    explain: 'Luigi wears green and often helps Mario on adventures.',
  }),
  quiz('mq-yoshi', {
    ask: 'What is the green dinosaur in Mario games?',
    options: ['Yoshi', 'Bowser', 'Koopa', 'Goomba'],
    correct: 0,
    explain: 'Yoshi is the friendly green dino who can eat enemies.',
  }),
  quiz('mq-minecraft', {
    ask: 'Which game lets you build houses from blocks?',
    options: ['Minecraft', 'Fortnite', 'FIFA', 'Chess'],
    correct: 0,
    explain: 'Minecraft is all about digging, crafting and building with blocks.',
  }),
  quiz('mq-pickaxe', {
    ask: 'In Minecraft, what tool do you use to mine stone?',
    options: ['Pickaxe', 'Fishing rod', 'Bow', 'Bucket'],
    correct: 0,
    explain: 'A pickaxe breaks stone and ores when you mine.',
  }),
  quiz('mq-elsa', {
    ask: 'Who has ice powers in Frozen?',
    options: ['Elsa', 'Anna', 'Moana', 'Belle'],
    correct: 0,
    explain: 'Elsa can make snow and ice with her hands.',
  }),
  quiz('mq-mickey', {
    ask: "Who is Mickey Mouse's girlfriend?",
    options: ['Minnie Mouse', 'Donald Duck', 'Goofy', 'Pluto'],
    correct: 0,
    explain: "Minnie Mouse wears a polka-dot bow and is Mickey's sweetheart.",
  }),
  quiz('mq-pikachu', {
    ask: 'What kind of animal is Pikachu?',
    options: ['An electric mouse', 'A cat', 'A dragon', 'A fish'],
    correct: 0,
    explain: 'Pikachu is a small yellow electric mouse Pokémon.',
  }),
  quiz('mq-sonic', {
    ask: 'What does Sonic the Hedgehog collect?',
    options: ['Rings', 'Coins', 'Stars', 'Apples'],
    correct: 0,
    explain: 'Golden rings protect Sonic when he gets hit.',
  }),
  quiz('mq-bells', {
    ask: 'What money do villagers use in Animal Crossing?',
    options: ['Bells', 'Robux', 'V-Bucks', 'Dollars'],
    correct: 0,
    explain: 'You earn and spend bells when you sell fruit and fish.',
  }),
  quiz('mq-spongebob-colour', {
    ask: 'What colour is SpongeBob?',
    options: ['Yellow', 'Blue', 'Green', 'Pink'],
    correct: 0,
    explain: 'SpongeBob is a bright yellow sea sponge.',
  }),
  quiz('mq-fortnite', {
    ask: 'In Fortnite, what do you ride down from the sky?',
    options: ['Battle bus', 'Train', 'Rocket', 'Helicopter'],
    correct: 0,
    explain: 'Everyone jumps from the battle bus at the start of a match.',
  }),
  quiz('mq-pokemon-ball', {
    ask: 'What do trainers throw to catch Pokémon?',
    options: ['Poké Ball', 'Net', 'Box', 'Rope'],
    correct: 0,
    explain: 'A Poké Ball snaps shut when you catch a Pokémon.',
  }),

  // Computer & keyboard basics
  quiz('mq-left-click', {
    ask: 'Which side of the mouse do you click with most?',
    options: ['Left button', 'Right button', 'Scroll wheel', 'The cable'],
    correct: 0,
    explain: 'The left button selects things and opens apps.',
  }),
  quiz('mq-backspace', {
    ask: 'What does the Backspace key do?',
    options: ['Deletes a letter', 'Makes it louder', 'Opens a game', 'Prints paper'],
    correct: 0,
    explain: 'Backspace removes the letter just before the cursor.',
  }),
  quiz('mq-space', {
    ask: 'Which key makes a gap between words?',
    options: ['Space bar', 'Enter', 'Shift', 'Tab'],
    correct: 0,
    explain: 'The long space bar at the bottom puts a space in your typing.',
  }),
  quiz('mq-enter', {
    ask: 'What does the Enter key often do?',
    options: ['Starts a new line', 'Deletes everything', 'Turns off the PC', 'Makes text bold'],
    correct: 0,
    explain: 'Enter moves down to the next line or sends a message.',
  }),
  quiz('mq-shift', {
    ask: 'Which key helps you type a CAPITAL letter?',
    options: ['Shift', 'Ctrl', 'Alt', 'Caps Lock only'],
    correct: 0,
    explain: 'Hold Shift and press a letter to make it uppercase.',
  }),
  quiz('mq-arrows', {
    ask: 'What do the arrow keys move on the screen?',
    options: ['The cursor', 'The whole room', 'The mouse', 'The speakers'],
    correct: 0,
    explain: 'Arrow keys nudge the blinking line where you type.',
  }),
  quiz('mq-screen', {
    ask: 'Where do the letters appear when you type?',
    options: ['On the screen', 'On the keyboard', 'On the mouse', 'On the desk'],
    correct: 0,
    explain: 'You look at the screen to see what you typed.',
  }),
  quiz('mq-double-click', {
    ask: 'What does double-clicking usually do?',
    options: ['Opens something', 'Deletes the PC', 'Turns off Wi-Fi', 'Ejects the keyboard'],
    correct: 0,
    explain: 'Two quick clicks on a file or icon often opens it.',
  }),
  quiz('mq-cursor', {
    ask: 'What is the blinking line where letters go?',
    options: ['The cursor', 'The wallpaper', 'The charger', 'The fan'],
    correct: 0,
    explain: 'The cursor shows exactly where the next letter will appear.',
  }),
  quiz('mq-right-click', {
    ask: 'What does the right mouse button usually open?',
    options: ['A menu', 'A new game', 'The battery', 'A secret level'],
    correct: 0,
    explain: 'Right-click shows extra choices like copy and paste.',
  }),
  quiz('mq-esc', {
    ask: 'What does the Esc key often do?',
    options: ['Closes a menu or pauses', 'Makes text bigger', 'Sends an email', 'Adds a picture'],
    correct: 0,
    explain: 'Esc means escape — it backs out of pop-ups and pause screens.',
  }),
  quiz('mq-save', {
    ask: 'Which pair of keys often saves your work?',
    options: ['Ctrl and S', 'Ctrl and Z', 'Shift and A', 'Alt and F4'],
    correct: 0,
    explain: 'Ctrl+S saves so you do not lose your homework or drawing.',
  }),
];

export const MINI_PROMPTS = [...MINI_TOKENS, ...MINI_QUIZZES];

export const miniPromptById = (id: string) => MINI_PROMPTS.find((prompt) => prompt.id === id);
