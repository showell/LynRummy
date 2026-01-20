/*
    As of January 2026, this is hosted here:
        https://showell.github.io/LynRummy/

    Lyn Rummy is a fun game where you attempt to keep the "common
    area" intact with rummy-like stacks of cards:

        sets: 4S, 4H, 4D
        pure runs: 7S, 8S, 9S
        red-black runs: 2S, 3H, 4S, 5D, 6C

    All sets and runs must contain at least three cards. Runs
    can go "around the ace", so QS, KS, AS, 2S, 3S is a valid
    run.

    Take 2 standard playing-cards decks of 52 cards each. (no jokers)
    Shuffle the stack of 104 cards.

    Deal out 15 cards to each player. (In this case we still
    assume one player, so it's the solitaire flavor.)

    Players take turns, as in almost every other card game.

    On each turn, the player tries to get as many as their cards
    out on to the common area while keeping all the stacks legitimate.

    Here's the kicker, though! You can disturb the existing stacks
    and move as many cards around as you'd like. The only thing that
    matters at the end of your turn is that the common area is still
    clean. (The whole challenge of the game is mutating the board,
    although it's also perfectly fine just to extend existing sets
    and runs.)

    If a player can't get any of their cards out, they can draw from
    the deck for their turn.

    A quick caveat on sets: You cannot have duplicates. In other words,
    4H 4S 4H is illegal, because you have dups of 4H. Don't make your
    fellow players scold you with "NO DUPS!".
*/

type SimpleCallback = () => void;

const enum CardValue {
    ACE = 1,
    TWO = 2,
    THREE = 3,
    FOUR = 4,
    FIVE = 5,
    SIX = 6,
    SEVEN = 7,
    EIGHT = 8,
    NINE = 9,
    TEN = 10,
    JACK = 11,
    QUEEN = 12,
    KING = 13,
}

function value_str(val: CardValue): string {
    switch (val) {
        case CardValue.ACE:
            return "A";
        case CardValue.TWO:
            return "2";
        case CardValue.THREE:
            return "3";
        case CardValue.FOUR:
            return "4";
        case CardValue.FIVE:
            return "5";
        case CardValue.SIX:
            return "6";
        case CardValue.SEVEN:
            return "7";
        case CardValue.EIGHT:
            return "8";
        case CardValue.NINE:
            return "9";
        case CardValue.TEN:
            return "10";
        case CardValue.JACK:
            return "J";
        case CardValue.QUEEN:
            return "Q";
        case CardValue.KING:
            return "K";
    }
}

function successor(val: CardValue): CardValue {
    // This is hopefully straightforward code.  Note
    // K, A, 2 is a valid run in LynRummy, because
    // KING has ACE as its successor and ACE has TWO
    // as its successor.
    switch (val) {
        case CardValue.ACE:
            return CardValue.TWO;
        case CardValue.TWO:
            return CardValue.THREE;
        case CardValue.THREE:
            return CardValue.FOUR;
        case CardValue.FOUR:
            return CardValue.FIVE;
        case CardValue.FIVE:
            return CardValue.SIX;
        case CardValue.SIX:
            return CardValue.SEVEN;
        case CardValue.SEVEN:
            return CardValue.EIGHT;
        case CardValue.EIGHT:
            return CardValue.NINE;
        case CardValue.NINE:
            return CardValue.TEN;
        case CardValue.TEN:
            return CardValue.JACK;
        case CardValue.JACK:
            return CardValue.QUEEN;
        case CardValue.QUEEN:
            return CardValue.KING;
        case CardValue.KING:
            return CardValue.ACE;
    }
}

const enum Suit {
    CLUB = 0,
    DIAMOND = 1,
    SPADE = 2,
    HEART = 3,
}

const enum CardColor {
    BLACK = 0,
    RED = 1,
}

// Do this the non-fancy way.
const all_suits = [Suit.HEART, Suit.SPADE, Suit.DIAMOND, Suit.CLUB];

const all_card_values = [
    CardValue.ACE,
    CardValue.TWO,
    CardValue.THREE,
    CardValue.FOUR,
    CardValue.FIVE,
    CardValue.SIX,
    CardValue.SEVEN,
    CardValue.EIGHT,
    CardValue.NINE,
    CardValue.TEN,
    CardValue.JACK,
    CardValue.QUEEN,
    CardValue.KING,
];

function suit_str(suit: Suit): string {
    // The strange numbers here refer to the Unicode
    // code points for the built-in emojis for the
    // suits.
    switch (suit) {
        case Suit.CLUB:
            return "\u2663";
        case Suit.SPADE:
            return "\u2660";
        case Suit.DIAMOND:
            return "\u2666";
        case Suit.HEART:
            return "\u2665";
    }
}

function card_color(suit: Suit): CardColor {
    switch (suit) {
        case Suit.CLUB:
        case Suit.SPADE:
            return CardColor.BLACK;
        case Suit.DIAMOND:
        case Suit.HEART:
            return CardColor.RED;
    }
}

function css_color(card_color: CardColor): string {
    return card_color == CardColor.RED ? "red" : "black";
}

function card_color_str(color: CardColor): string {
    return color == CardColor.RED ? "red" : "black";
}

const enum CardStackType {
    INCOMPLETE = "incomplete",
    BOGUS = "bogus",
    DUP = "dup",
    SET = "set",
    PURE_RUN = "pure run",
    RED_BLACK_RUN = "red/black alternating",
}

class Card {
    suit: Suit;
    value: CardValue;
    color: CardColor;

    constructor(value: CardValue, suit: Suit) {
        this.value = value;
        this.suit = suit;
        this.color = card_color(suit);
    }

    str(): string {
        return value_str(this.value) + suit_str(this.suit);
    }

    equals(other_card: Card): boolean {
        return this.value === other_card.value && this.suit === other_card.suit;
    }

    with(other_card: Card): CardStackType {
        // See if the pair is a promising start to a stack.
        // Do not return INCOMPLETE here. It's obviously
        // not complete in this context, and our caller will
        // understand that.

        if (this.equals(other_card)) {
            return CardStackType.DUP;
        }

        if (this.value === other_card.value) {
            return CardStackType.SET;
        }

        if (other_card.value === successor(this.value)) {
            if (this.suit === other_card.suit) {
                return CardStackType.PURE_RUN;
            } else if (this.color !== other_card.color) {
                return CardStackType.RED_BLACK_RUN;
            }
        }
        return CardStackType.BOGUS;
    }
}

class CardStack {
    cards: Card[]; // Order does matter here!
    stack_type: CardStackType;

    constructor(cards: Card[]) {
        this.cards = cards;
        this.stack_type = this.get_stack_type();
    }

    get_stack_type(): CardStackType {
        const cards = this.cards;
        if (cards.length <= 1) {
            return CardStackType.INCOMPLETE;
        }

        const provisional_stack_type = cards[0].with(cards[1]);
        if (provisional_stack_type === CardStackType.BOGUS) {
            return CardStackType.BOGUS;
        }

        if (cards.length === 2) {
            return CardStackType.INCOMPLETE;
        }

        function any_dup_card(card: Card, rest: Card[]): boolean {
            if (rest.length === 0) {
                return false;
            }
            if (card.equals(rest[0])) {
                return true;
            }
            return any_dup_card(card, rest.slice(1));
        }

        function has_dups(cards: Card[]): boolean {
            if (cards.length <= 1) {
                return false;
            }

            return (
                any_dup_card(cards[0], cards.slice(1)) ||
                has_dups(cards.slice(1))
            );
        }

        // Prevent dups within a provisional SET.
        if (provisional_stack_type === CardStackType.SET) {
            if (has_dups(cards)) {
                return CardStackType.DUP;
            }
        }

        function is_consistent(cards: Card[]): boolean {
            if (cards.length <= 1) {
                return true;
            }
            if (cards[0].with(cards[1]) !== provisional_stack_type) {
                return false;
            }
            return is_consistent(cards.slice(1));
        }

        // Prevent mixing up types of stacks.
        if (!is_consistent(this.cards)) {
            return CardStackType.BOGUS;
        }

        // HAPPY PATH! We have a stack that can stay on the board!
        return provisional_stack_type;
    }

    str() {
        return this.cards.map((card) => card.str()).join(",");
    }
}

class Shelf {
    /*
        We use the concept of shelves to store card stacks (whether
        complete or not) in the common area.  Each shelf is just a
        collection of stacks.  The shelf location is just arbitrary
        and up to how the player tackles the problem of keeping
        the board state intact.
    */

    card_stacks: CardStack[];

    constructor(card_stacks: CardStack[]) {
        this.card_stacks = card_stacks;
    }

    is_clean(): boolean {
        const card_stacks = this.card_stacks;

        for (const card_stack of card_stacks) {
            if (
                card_stack.stack_type === CardStackType.DUP ||
                card_stack.stack_type === CardStackType.INCOMPLETE
            ) {
                return false;
            }
        }

        return true;
    }

    split_card_off_stack(info: {
        stack_index: number;
        card_index: number;
    }): void {
        const { stack_index, card_index } = info;
        const card_stacks = this.card_stacks;
        const card_stack = card_stacks[stack_index];
        const cards = card_stack.cards;
        const split_card = cards[card_index];
        cards.splice(card_index, 1);

        const new_stack = new CardStack([split_card]);

        if (card_index === 0) {
            card_stacks.splice(stack_index, 0, new_stack);
        } else {
            card_stacks.splice(stack_index + 1, 0, new_stack);
        }
    }
}

class BookCase {
    /*
        Our metaphor for the common area is a book case. It's the
        counterpart to the "table" in the actual in-person game.
    */

    shelves: Shelf[];

    constructor(shelves: Shelf[]) {
        this.shelves = shelves;
    }

    get_cards(): Card[] {
        const shelves = this.shelves;

        const result = [];
        for (const shelf of shelves) {
            for (const card_stack of shelf.card_stacks) {
                for (const card of card_stack.cards) {
                    result.push(card);
                }
            }
        }

        return result;
    }
}

class Deck {
    cards: Card[];
    shuffled: boolean;

    constructor(info: { shuffled: boolean }) {
        this.cards = [];
        this.shuffled = info.shuffled;

        function suit_run(suit: Suit) {
            return all_card_values.map(
                (card_value) => new Card(card_value, suit),
            );
        }

        const all_runs = all_suits.map((suit) => suit_run(suit));

        // 2 decks
        const all_runs2 = [...all_runs, ...all_runs];

        // Use the old-school idiom to flatten the array.
        const all_cards = all_runs2.reduce((acc, lst) => acc.concat(lst));

        this.cards = all_cards;

        if (this.shuffled) {
            this.cards = shuffle(this.cards);
        }
    }

    str(): string {
        return this.cards.map((card) => card.str()).join(" ");
    }

    size(): number {
        return this.cards.length;
    }

    take_from_top(cnt: number): Card[] {
        const cards = this.cards;
        const offset = cards.length - cnt;
        const top_cards = cards.slice(offset);
        this.cards = cards.slice(0, offset);
        return top_cards;
    }

    pull_card_from_deck(card: Card): void {
        const cards = this.cards;

        for (let i = 0; i < cards.length; ++i) {
            if (cards[i].equals(card)) {
                cards.splice(i, 1);
                return;
            }
        }
        throw new Error("unexpected");
    }
}

class Hand {
    cards: Card[];

    constructor() {
        this.cards = [];
    }

    add_cards(cards: Card[]): void {
        this.cards = this.cards.concat(cards);
    }
}

class Player {
    name: string;
    hand: Hand;

    constructor(name) {
        this.name = name;
        this.hand = new Hand();
    }
}

function empty_shelf(): Shelf {
    return new Shelf([]);
}

function initial_bookcase(): BookCase {
    const card_stack_pure_run = new CardStack([
        new Card(CardValue.KING, Suit.SPADE),
        new Card(CardValue.ACE, Suit.SPADE),
        new Card(CardValue.TWO, Suit.SPADE),
        new Card(CardValue.THREE, Suit.SPADE),
    ]);

    const card_stack_ace_set = new CardStack([
        new Card(CardValue.ACE, Suit.CLUB),
        new Card(CardValue.ACE, Suit.DIAMOND),
        new Card(CardValue.ACE, Suit.HEART),
    ]);

    const shelf1 = new Shelf([card_stack_pure_run, card_stack_ace_set]);

    const card_stack_red_black = new CardStack([
        new Card(CardValue.TWO, Suit.CLUB),
        new Card(CardValue.THREE, Suit.DIAMOND),
        new Card(CardValue.FOUR, Suit.CLUB),
        new Card(CardValue.FIVE, Suit.HEART),
    ]);

    const orphan_six = new CardStack([new Card(CardValue.SIX, Suit.SPADE)]);

    const card_stack_seven_set = new CardStack([
        new Card(CardValue.SEVEN, Suit.SPADE),
        new Card(CardValue.SEVEN, Suit.DIAMOND),
        new Card(CardValue.SEVEN, Suit.CLUB),
    ]);

    const shelf2 = new Shelf([
        card_stack_seven_set,
        card_stack_red_black,
        orphan_six,
    ]);

    const card_stack_face_cards = new CardStack([
        new Card(CardValue.JACK, Suit.DIAMOND),
        new Card(CardValue.QUEEN, Suit.DIAMOND),
        new Card(CardValue.KING, Suit.DIAMOND),
    ]);

    const shelf3 = new Shelf([card_stack_face_cards]);

    const shelves = [empty_shelf(), shelf1, shelf2, shelf3];

    for (let i = 0; i < 20; ++i) {
        shelves.push(empty_shelf());
    }

    return new BookCase(shelves);
}

class Game {
    players: Player[];
    deck: Deck;
    book_case: BookCase;

    constructor() {
        this.players = [new Player("Player One"), new Player("Player Two")];
        this.deck = new Deck({ shuffled: true });
        this.book_case = initial_bookcase();

        for (const card of this.book_case.get_cards()) {
            this.deck.pull_card_from_deck(card);
        }
    }

    deal_cards() {
        for (const player of this.players) {
            const cards = this.deck.take_from_top(15);
            player.hand.add_cards(cards);
        }
    }
}

class Example {
    comment: string;
    stack: CardStack;
    expected_type: CardStackType;

    constructor(comment: string, cards: Card[], expected_type: CardStackType) {
        this.comment = comment;
        this.stack = new CardStack(cards);
        this.expected_type = expected_type;
        // test it even at runtime
        if (this.stack.stack_type !== expected_type) {
            console.log("\n\n----- PROBLEM!\n\n");
            console.log(this.stack.str());
            console.log(this.stack.stack_type, "is not", expected_type);
        }
    }
}

class PhysicalCard {
    card: Card;

    constructor(card: Card) {
        this.card = card;
    }

    dom(): HTMLElement {
        const card = this.card;

        const span = document.createElement("span");
        const v_node = document.createElement("span");
        const s_node = document.createElement("span");
        v_node.style.display = "block";
        v_node.style.userSelect = "none";
        s_node.style.display = "block";
        s_node.style.userSelect = "none";
        v_node.innerText = value_str(card.value);
        s_node.innerText = suit_str(card.suit);
        span.append(v_node);
        span.append(s_node);
        span.style.color = css_color(card.color);
        span.style.textAlign = "center";
        span.style.fontSize = "17px";
        span.style.border = "1px blue solid";
        span.style.padding = "1px";
        span.style.margin = "1px";
        span.style.display = "inline-block";
        span.style.minWidth = "19px";
        span.style.minHeight = "38px";
        return span;
    }
}

class PhysicalCardStack {
    stack: CardStack;
    physical_card_nodes: HTMLElement[];

    constructor(stack: CardStack) {
        this.stack = stack;
        this.physical_card_nodes = this.stack.cards.map((card) => {
            return new PhysicalCard(card).dom();
        });
    }

    dom(): HTMLElement {
        // should only be called once
        const physical_card_nodes = this.physical_card_nodes;

        const div = document.createElement("div");
        div.style.marginRight = "20px";

        for (const physical_card_node of physical_card_nodes) {
            div.append(physical_card_node);
        }

        return div;
    }

    set_card_click_callback(callback: (i: number) => void) {
        const physical_card_nodes = this.physical_card_nodes;

        if (physical_card_nodes.length <= 1) {
            // we want to drag it, not split it off
            return;
        }

        for (const i of [0, physical_card_nodes.length - 1]) {
            const physical_card_node = physical_card_nodes[i];
            physical_card_node.style.cursor = "pointer";
            physical_card_node.addEventListener("click", () => {
                callback(i);
            });
        }
    }

    stack_color(): string {
        switch (this.stack.stack_type) {
            case CardStackType.DUP:
            case CardStackType.BOGUS:
                return "red";
            case CardStackType.INCOMPLETE:
                return "lightred";
            default:
                return "green";
        }
    }
}

class PhysicalShelf {
    shelf: Shelf;
    div: HTMLElement;

    constructor(shelf: Shelf) {
        this.shelf = shelf;
        this.div = this.make_div();
    }

    make_div(): HTMLElement {
        const div = document.createElement("div");
        div.style.display = "flex";
        div.style.minWidth = "600px";
        div.style.alignItems = "flex-end";
        div.style.paddingBottom = "2px";
        div.style.borderBottom = "3px solid blue";
        div.style.marginTop = "3px";
        div.style.marginBottom = "10px";
        div.style.minHeight = "40px"; // TODO - make this more accurate
        return div;
    }

    dom(): HTMLElement {
        this.populate();
        return this.div;
    }

    populate(): void {
        const div = this.div;
        const shelf = this.shelf;
        const card_stacks = shelf.card_stacks;

        div.innerHTML = "";

        const emoji = document.createElement("span");
        emoji.style.marginRight = "10px";
        emoji.style.marginBottom = "5px";

        if (shelf.is_clean()) {
            emoji.innerText = "\u2705"; // green checkmark
        } else {
            emoji.innerText = "\u274C"; // red crossmark
        }
        div.append(emoji);

        for (let i = 0; i < card_stacks.length; ++i) {
            const card_stack = card_stacks[i];
            const physical_card_stack = new PhysicalCardStack(card_stack);
            physical_card_stack.set_card_click_callback((card_index) => {
                this.split_card_off_stack({ stack_index: i, card_index });
            });
            div.append(physical_card_stack.dom());
        }
    }

    split_card_off_stack(info: {
        stack_index: number;
        card_index: number;
    }): void {
        this.shelf.split_card_off_stack(info);
        this.populate();
    }
}

class PhysicalBookCase {
    book_case: BookCase;

    constructor(book_case) {
        this.book_case = book_case;
    }

    dom(): HTMLElement {
        const book_case = this.book_case;

        const div = document.createElement("div");

        const heading = document.createElement("h3");
        heading.innerText = "Shelves";

        div.append(heading);

        for (const shelf of book_case.shelves) {
            const physical_shelf = new PhysicalShelf(shelf);
            div.append(physical_shelf.dom());
        }

        return div;
    }
}

class PhysicalHand {
    hand: Hand;

    constructor(hand: Hand) {
        this.hand = hand;
    }

    dom(): HTMLElement {
        const hand = this.hand;

        const div = document.createElement("div");
        for (const suit of all_suits) {
            const suit_cards = [];
            for (const card of hand.cards) {
                if (card.suit === suit) {
                    suit_cards.push(card);
                }
            }
            if (suit_cards.length > 0) {
                suit_cards.sort((card1, card2) => card1.value - card2.value);
                console.log(suit_cards);
                const suit_div = document.createElement("div");
                suit_div.style.paddingBottom = "3px";
                for (const card of suit_cards) {
                    const physical_card = new PhysicalCard(card);
                    suit_div.append(physical_card.dom());
                }
                div.append(suit_div);
            }
        }
        return div;
    }
}

class PhysicalPlayer {
    player: Player;

    constructor(player: Player) {
        this.player = player;
    }

    dom(): HTMLElement {
        const player = this.player;

        const div = document.createElement("div");
        const h3 = document.createElement("h3");
        h3.innerText = player.name;
        div.append(h3);
        const physical_hand = new PhysicalHand(player.hand);
        div.append(physical_hand.dom());

        return div;
    }
}

class PhysicalGame {
    game: Game;
    player_area: HTMLElement;
    common_area: HTMLElement;

    constructor(info: { player_area: HTMLElement; common_area: HTMLElement }) {
        this.game = new Game();
        this.game.deal_cards();
        this.player_area = info.player_area;
        this.common_area = info.common_area;
    }

    start() {
        const game = this.game;
        const player = this.game.players[0];
        const physical_player = new PhysicalPlayer(player);

        this.player_area.innerHTML = "";
        this.player_area.append(physical_player.dom());

        // TODO: create PhysicalDeck
        const deck_dom = document.createElement("div");
        deck_dom.innerText = `${game.deck.size()} cards in deck`;
        this.player_area.append(deck_dom);

        // populate common area
        const physical_book_case = new PhysicalBookCase(game.book_case);
        this.common_area.replaceWith(physical_book_case.dom());
    }
}

class PhysicalExample {
    example: Example;

    constructor(example: Example) {
        this.example = example;
    }

    dom(): Node {
        const example = this.example;
        const physical_stack = new PhysicalCardStack(example.stack);

        const div = document.createElement("div");
        div.style.paddingBottom = "11px";

        const heading = document.createElement("div");
        heading.innerText = example.comment;
        heading.style.color = physical_stack.stack_color();
        heading.style.fontSize = "17px";
        heading.style.fontWeight = "bold";
        heading.style.paddingBottom = "2px";

        const card_stack_dom = physical_stack.dom();

        div.append(heading);
        div.append(card_stack_dom);

        return div;
    }
}

class PhysicalExamples {
    area: HTMLElement;

    constructor(area: HTMLElement) {
        this.area = area;
    }

    start(opts: { on_dismiss_callback: SimpleCallback }): void {
        const div = document.createElement("div");

        const h3 = document.createElement("h3");
        h3.innerText = "Examples";

        const button = document.createElement("button");
        button.innerText = "Got it!";

        const panel = document.createElement("div");
        panel.style.display = "flex";
        panel.style.justifyContent = "space-around";

        const good_column = document.createElement("div");
        const bad_column = document.createElement("div");

        for (const column of [good_column, bad_column]) {
            column.style.paddingLeft = "15px";
            column.style.paddingRight = "15px";
        }

        const examples = get_examples();
        for (const example of examples.good) {
            const physical_example = new PhysicalExample(example);
            good_column.append(physical_example.dom());
        }

        for (const example of examples.bad) {
            const physical_example = new PhysicalExample(example);
            bad_column.append(physical_example.dom());
        }

        panel.append(good_column);
        panel.append(bad_column);
        div.append(h3);
        div.append(button);
        div.append(panel);

        button.addEventListener("click", () => {
            this.area.innerHTML = "";
            opts.on_dismiss_callback();
        });

        this.area.append(div);
    }
}

class MainPage {
    page: HTMLElement;
    player_area: HTMLElement;
    examples_area: HTMLElement;
    common_area: HTMLElement;

    constructor() {
        this.page = document.createElement("div");
        this.page.style.display = "flex";
        this.page.style.width = "100%";

        this.player_area = document.createElement("div");
        this.player_area.style.paddingRight = "20px";
        this.player_area.style.marginRight = "20px";
        this.player_area.style.borderRight = "1px gray solid";

        this.examples_area = document.createElement("div");
        this.examples_area.style.paddingLeft = "20px";

        this.common_area = document.createElement("div");

        const right_panel = document.createElement("div");
        right_panel.append(this.examples_area);
        right_panel.append(this.common_area);

        this.page.append(this.player_area);
        this.page.append(right_panel);
    }

    start() {
        const player_area = this.player_area;
        const common_area = this.common_area;

        const welcome = document.createElement("div");
        welcome.innerText = "Welcome to Lyn Rummy!";
        player_area.innerHTML = "";
        player_area.append(welcome);

        const examples = new PhysicalExamples(this.examples_area);
        examples.start({
            on_dismiss_callback() {
                // We get called back one the player dismisses the examples.
                const physical_game = new PhysicalGame({
                    player_area: player_area,
                    common_area: common_area,
                });
                physical_game.start();
            },
        });

        document.body.append(this.page);
    }
}

function get_examples(): { good: Example[]; bad: Example[] } {
    const da = new Card(CardValue.ACE, Suit.DIAMOND);
    const sa = new Card(CardValue.ACE, Suit.SPADE);

    const s2 = new Card(CardValue.TWO, Suit.SPADE);

    const d3 = new Card(CardValue.THREE, Suit.DIAMOND);
    const h3 = new Card(CardValue.THREE, Suit.HEART);
    const s3 = new Card(CardValue.THREE, Suit.SPADE);

    const d4 = new Card(CardValue.FOUR, Suit.DIAMOND);
    const h4 = new Card(CardValue.FOUR, Suit.HEART);
    const s4 = new Card(CardValue.FOUR, Suit.SPADE);

    const s5 = new Card(CardValue.FIVE, Suit.SPADE);

    const c10 = new Card(CardValue.TEN, Suit.CLUB);
    const d10 = new Card(CardValue.TEN, Suit.DIAMOND);
    const h10 = new Card(CardValue.TEN, Suit.HEART);
    const s10 = new Card(CardValue.TEN, Suit.SPADE);

    const hj = new Card(CardValue.JACK, Suit.HEART);
    const hq = new Card(CardValue.QUEEN, Suit.HEART);

    const ck = new Card(CardValue.KING, Suit.CLUB);
    const hk = new Card(CardValue.KING, Suit.HEART);
    const sk = new Card(CardValue.KING, Suit.SPADE);

    const good = [
        new Example("SET of 3s", [h3, s3, d3], CardStackType.SET),
        new Example("SET of 10s", [h10, s10, d10, c10], CardStackType.SET),
        new Example(
            "PURE RUN of hearts",
            [h10, hj, hq],
            CardStackType.PURE_RUN,
        ),
        new Example(
            "PURE RUN around the ace",
            [sk, sa, s2, s3, s4, s5],
            CardStackType.PURE_RUN,
        ),
        new Example(
            "RED-BLACK RUN with three cards",
            [s3, d4, s5],
            CardStackType.RED_BLACK_RUN,
        ),
        new Example(
            "RED-BLACK RUN around the ace",
            [hq, ck, da, s2, d3],
            CardStackType.RED_BLACK_RUN,
        ),
    ];

    const bad = [
        new Example(
            "INCOMPLETE (set of kings)",
            [ck, sk],
            CardStackType.INCOMPLETE,
        ),
        new Example(
            "INCOMPLETE (pure run of hearts)",
            [hq, hk],
            CardStackType.INCOMPLETE,
        ),
        new Example(
            "INCOMPLETE (red-black run)",
            [s3, d4],
            CardStackType.INCOMPLETE,
        ),
        new Example(
            "ILLEGAL! No dups allowed.",
            [h3, s3, h3],
            CardStackType.DUP,
        ),
        new Example("non sensical", [s3, d4, h4], CardStackType.BOGUS),
    ];

    return { good, bad };
}

function shuffle(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
        // Pick a random index from 0 to i
        const j = Math.floor(Math.random() * (i + 1));

        // Swap elements at i and j
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function gui() {
    const ui = new MainPage();
    ui.start();
}

function test() {
    const game = new Game();
    console.log("removed", game.book_case.get_cards().length);
    get_examples(); // run for side effects
}

test();
