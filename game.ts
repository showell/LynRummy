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

const enum OriginDeck {
    DECK_ONE,
    DECK_TWO,
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

const enum CardStackType {
    INCOMPLETE = "incomplete",
    BOGUS = "bogus",
    DUP = "dup",
    SET = "set",
    PURE_RUN = "pure run",
    RED_BLACK_RUN = "red/black alternating",
}

const enum CardPositionType {
    LONER = 0,
    AT_END = 1,
    IN_MIDDLE = 2,
}

class ShelfCardLocation {
    shelf_index: number;
    stack_index: number;
    card_index: number;
    card_position: CardPositionType;

    constructor(info: {
        shelf_index: number;
        stack_index: number;
        card_index: number;
        card_position: CardPositionType;
    }) {
        this.shelf_index = info.shelf_index;
        this.stack_index = info.stack_index;
        this.card_index = info.card_index;
        this.card_position = info.card_position;
    }
}

class StackLocation {
    shelf_index: number;
    stack_index: number;

    constructor(info: { shelf_index: number; stack_index: number }) {
        this.shelf_index = info.shelf_index;
        this.stack_index = info.stack_index;
    }

    equals(other: StackLocation) {
        return (
            this.shelf_index === other.shelf_index &&
            this.stack_index === other.stack_index
        );
    }
}

function get_stack_type(cards: Card[]): CardStackType {
    /*
        THIS IS THE MOST IMPORTANT FUNCTION OF THE GAME.

        This determines the whole logic of Lyn Rummy.

        You have to have valid, complete stacks, and
        sets can have no dups!
    */
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

    // Prevent dups within a provisional SET.
    if (provisional_stack_type === CardStackType.SET) {
        if (has_duplicate_cards(cards)) {
            return CardStackType.DUP;
        }
    }

    // Prevent mixing up types of stacks.
    if (!follows_consistent_pattern(cards, provisional_stack_type)) {
        return CardStackType.BOGUS;
    }

    // HAPPY PATH! We have a stack that can stay on the board!
    return provisional_stack_type;
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

function value_for(label: string): CardValue {
    if (label === "10") {
        throw new Error("use T for ten");
    }

    switch (label) {
        case "A":
            return CardValue.ACE;
        case "2":
            return CardValue.TWO;
        case "3":
            return CardValue.THREE;
        case "4":
            return CardValue.FOUR;
        case "5":
            return CardValue.FIVE;
        case "6":
            return CardValue.SIX;
        case "7":
            return CardValue.SEVEN;
        case "8":
            return CardValue.EIGHT;
        case "9":
            return CardValue.NINE;
        case "T":
            return CardValue.TEN;
        case "J":
            return CardValue.JACK;
        case "Q":
            return CardValue.QUEEN;
        case "K":
            return CardValue.KING;
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

function suit_str(suit: Suit): string {
    // The strange numbers here refer to the Unicode
    // code points for the built-in emojis for the
    // suits.
    switch (suit) {
        case Suit.CLUB:
            return "\u2663";
        case Suit.DIAMOND:
            return "\u2666";
        case Suit.HEART:
            return "\u2665";
        case Suit.SPADE:
            return "\u2660";
    }
}

function suit_for(label: string): Suit {
    switch (label) {
        case "C":
            return Suit.CLUB;
        case "D":
            return Suit.DIAMOND;
        case "H":
            return Suit.HEART;
        case "S":
            return Suit.SPADE;
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

function build_full_double_deck(): Card[] {
    // Returns a shuffled deck of 2 packs of normal cards.

    function suit_run(suit: Suit, origin_deck: OriginDeck) {
        return all_card_values.map(
            (card_value) =>
                new Card(card_value, suit, CardState.IN_DECK, origin_deck),
        );
    }

    const all_runs1 = all_suits.map((suit) =>
        suit_run(suit, OriginDeck.DECK_ONE),
    );
    const all_runs2 = all_suits.map((suit) =>
        suit_run(suit, OriginDeck.DECK_TWO),
    );

    // 2 decks
    const all_runs = [...all_runs1, ...all_runs2];

    // Use the old-school idiom to flatten the array.
    const all_cards = all_runs.reduce((acc, lst) => acc.concat(lst));

    return shuffle(all_cards);
}

enum CardState {
    IN_DECK,
    STILL_IN_HAND,
    FIRMLY_ON_BOARD,
    FRESHLY_DRAWN,
    FRESHLY_PLAYED,
}

class Card {
    suit: Suit;
    value: CardValue;
    color: CardColor;
    state: CardState;
    origin_deck: OriginDeck;

    constructor(
        value: CardValue,
        suit: Suit,
        state: CardState,
        origin_deck: OriginDeck,
    ) {
        this.value = value;
        this.suit = suit;
        this.color = card_color(suit);
        this.state = state;
        this.origin_deck = origin_deck;
    }

    str(): string {
        return value_str(this.value) + suit_str(this.suit);
    }

    // equals doesn't care about the state of the card
    // and the original deck
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

    static from(
        label: string,
        state: CardState,
        origin_deck: OriginDeck,
    ): Card {
        const value = value_for(label[0]);
        const suit = suit_for(label[1]);
        return new Card(value, suit, state, origin_deck);
    }

    static from_board(label: string, origin_deck: OriginDeck) {
        return this.from(label, CardState.FIRMLY_ON_BOARD, origin_deck);
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
        return get_stack_type(cards);
    }

    str() {
        return this.cards.map((card) => card.str()).join(",");
    }

    join(other_stack: CardStack): CardStack {
        const cards = this.cards.concat(other_stack.cards);
        return new CardStack(cards);
    }

    incomplete(): boolean {
        return this.stack_type === CardStackType.INCOMPLETE;
    }

    problematic(): boolean {
        return (
            this.stack_type === CardStackType.BOGUS ||
            this.stack_type === CardStackType.DUP
        );
    }

    marry(other_stack: CardStack): CardStack | undefined {
        const stack1 = this.join(other_stack);
        if (!stack1.problematic()) {
            return stack1;
        }
        const stack2 = other_stack.join(this);
        if (!stack2.problematic()) {
            return stack2;
        }
        return undefined;
    }

    static from(shorthand: string, origin_deck: OriginDeck): CardStack {
        const card_labels = shorthand.split(",");
        const cards = card_labels.map((label) =>
            Card.from_board(label, origin_deck),
        );
        return new CardStack(cards);
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

    str(): string {
        const card_stacks = this.card_stacks;

        if (card_stacks.length === 0) {
            return "(empty)";
        }

        return card_stacks.map((card_stack) => card_stack.str()).join(" | ");
    }

    is_clean(): boolean {
        const card_stacks = this.card_stacks;

        for (const card_stack of card_stacks) {
            if (card_stack.incomplete() || card_stack.problematic()) {
                return false;
            }
        }

        return true;
    }

    split_card_off_end(info: {
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

    add_singleton_card(card: Card) {
        this.card_stacks.push(new CardStack([card]));
    }

    static from(shorthand: string, origin_deck: OriginDeck): Shelf {
        const sigs = shorthand.split(" | ");
        const card_stacks = sigs.map((sig) => CardStack.from(sig, origin_deck));
        return new Shelf(card_stacks);
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

    str(): string {
        return this.shelves.map((shelf) => shelf.str()).join("\n");
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

    merge_card_stacks(info: {
        source: StackLocation;
        target: StackLocation;
    }): boolean {
        const shelves = this.shelves;

        const source_shelf_index = info.source.shelf_index;
        const source_stack_index = info.source.stack_index;
        const target_shelf_index = info.target.shelf_index;
        const target_stack_index = info.target.stack_index;

        if (info.source.equals(info.target)) {
            return false;
        }

        const source_shelf = shelves[source_shelf_index];
        const target_shelf = shelves[target_shelf_index];

        const source_stacks = source_shelf.card_stacks;
        const target_stacks = target_shelf.card_stacks;

        const source_stack = source_stacks[source_stack_index];
        const target_stack = target_stacks[target_stack_index];

        const merged_stack = source_stack.marry(target_stack);

        if (merged_stack === undefined) {
            return false;
        }

        source_stacks.splice(source_stack_index, 1);
        target_stacks[target_stack_index] = merged_stack;

        return true;
    }
}

class Deck {
    // The "top" of the deck is the last index, so
    // we can do the equivalent of pop, not that it
    // remotely matters at our scale.
    cards: Card[];

    constructor() {
        this.cards = build_full_double_deck();
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
        const top_cards = cards.splice(offset, cnt);
        return top_cards;
    }

    pull_card_from_deck(card: Card): void {
        remove_card_from_array(this.cards, card);
    }
}

function remove_card_from_array(cards: Card[], card: Card): void {
    for (let i = 0; i < cards.length; ++i) {
        if (cards[i].equals(card)) {
            cards.splice(i, 1);
            return;
        }
    }

    throw new Error("Card to be removed is not present in the array!");
}

class PhysicalDeck {
    deck: Deck;
    div: HTMLElement;

    constructor(deck: Deck) {
        this.deck = deck;
        this.div = this.make_div();
    }

    make_div(): HTMLElement {
        // no real styling yet
        return document.createElement("div");
    }

    dom(): HTMLElement {
        this.populate();
        return this.div;
    }

    populate(): void {
        this.div.innerHTML = "";
        const deck = this.deck;
        const img = document.createElement("img");
        img.src = "deck.png";
        img.style.height = "200px";
        this.div.append(img);

        const span = document.createElement("span");
        span.innerText = `${deck.cards.length} in deck`;
        this.div.append(span);
    }

    take_from_top(cnt: number): Card[] {
        const cards = this.deck.take_from_top(cnt);
        this.populate();
        console.log(cards);
        return cards;
    }
}

class HandCard {
    card: Card;
    is_new: boolean;

    constructor(info: { card: Card; is_new: boolean }) {
        this.card = info.card;
        this.is_new = info.is_new;
    }
}

function new_card_color(): string {
    // kind of a pale yellow
    return "rgba(255, 255, 0, 0.4)";
}

class PhysicalHandCard {
    hand_card: HandCard;
    card_div: HTMLElement;
    physical_card: PhysicalCard;

    constructor(info: { hand_card: HandCard; physical_card: PhysicalCard }) {
        this.hand_card = info.hand_card;
        this.physical_card = info.physical_card;
        this.card_div = this.physical_card.dom();
    }

    dom() {
        this.card_div.style.cursor = "pointer";
        if (this.hand_card.is_new) {
            this.card_div.style.backgroundColor = new_card_color();
        } else {
            this.card_div.style.backgroundColor = "transparent";
        }
        return this.card_div;
    }

    add_click_listener(physical_game: PhysicalGame) {
        this.card_div.addEventListener("click", () => {
            physical_game.move_card_from_hand_to_top_shelf(this.hand_card.card);
        });
    }
}

class Hand {
    hand_cards: HandCard[];

    constructor() {
        this.hand_cards = [];
    }

    add_cards(cards: HandCard[]): void {
        this.hand_cards = this.hand_cards.concat(cards);
    }

    remove_card_from_hand(card: Card): void {
        const hand_cards = this.hand_cards;

        for (let i = 0; i < hand_cards.length; ++i) {
            if (hand_cards[i].card.equals(card)) {
                hand_cards.splice(i, 1);
                return;
            }
        }
        throw new Error("Card to be removed is not present in the array!");
    }
}

class Player {
    name: string;
    hand: Hand;

    constructor(name: string) {
        this.name = name;
        this.hand = new Hand();
    }
}

function empty_shelf(): Shelf {
    return new Shelf([]);
}

function initial_book_case(): BookCase {
    const shelf1 = new Shelf([
        CardStack.from("KS,AS,2S,3S", OriginDeck.DECK_ONE),
        CardStack.from("AC,AD,AH", OriginDeck.DECK_ONE),
    ]);

    const shelf2 = new Shelf([
        CardStack.from("7S,7D,7C", OriginDeck.DECK_ONE),
        CardStack.from("2C,3D,4C,5H", OriginDeck.DECK_ONE),
        CardStack.from("6S", OriginDeck.DECK_ONE),
    ]);

    const shelf3 = new Shelf([
        CardStack.from("TD,JD,QD,KD", OriginDeck.DECK_ONE),
    ]);

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
        this.deck = new Deck();
        this.book_case = initial_book_case();

        for (const card of this.book_case.get_cards()) {
            this.deck.pull_card_from_deck(card);
        }
    }

    deal_cards() {
        for (const player of this.players) {
            const cards = this.deck.take_from_top(15);
            player.hand.add_cards(
                cards.map((c) => new HandCard({ card: c, is_new: false })),
            );
        }
    }
}

class Example {
    comment: string;
    stack: CardStack;
    expected_type: CardStackType;

    constructor(
        comment: string,
        shorthand: string,
        expected_type: CardStackType,
    ) {
        this.comment = comment;
        this.stack = CardStack.from(shorthand, OriginDeck.DECK_ONE);
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
        span.style.minWidth = "21px";
        span.style.minHeight = "38px";
        return span;
    }
}

type ClickHandler = (MouseEvent) => void;

class PhysicalShelfCard {
    card_location: ShelfCardLocation;
    physical_card: PhysicalCard;
    card_div: HTMLElement;
    click_handler: ClickHandler | undefined;

    constructor(card_location: ShelfCardLocation, physical_card: PhysicalCard) {
        this.card_location = card_location;
        this.physical_card = physical_card;
        this.card_div = this.physical_card.dom();
        this.click_handler = undefined;
    }

    dom(): HTMLElement {
        return this.card_div;
    }

    reset_click_listener(): void {
        if (this.click_handler === undefined) {
            return;
        }
        this.card_div.removeEventListener("click", this.click_handler);
        this.click_handler = undefined;
    }

    add_click_listener(physical_game: PhysicalGame): void {
        const div = this.card_div;
        const self = this;

        this.reset_click_listener(); // there can only be ONE!

        // TODO: remove this once we make pointers work more at
        //       the CardStack level
        div.style.cursor = "pointer";

        this.click_handler = (e) => {
            physical_game.handle_shelf_card_click(self.card_location);
            e.stopPropagation();
        };

        div.addEventListener("click", this.click_handler);
    }
}

function get_card_position(
    card_index: number,
    num_cards: number,
): CardPositionType {
    if (num_cards === 1) {
        return CardPositionType.LONER;
    }
    if (card_index === 0 || card_index === num_cards - 1) {
        return CardPositionType.AT_END;
    }

    return CardPositionType.IN_MIDDLE;
}

function build_physical_shelf_cards(
    stack_location: StackLocation,
    cards: Card[],
): PhysicalShelfCard[] {
    const physical_shelf_cards = [];

    for (let card_index = 0; card_index < cards.length; ++card_index) {
        let card_position = get_card_position(card_index, cards.length);

        const card = cards[card_index];

        const card_location = new ShelfCardLocation({
            shelf_index: stack_location.shelf_index,
            stack_index: stack_location.stack_index,
            card_index,
            card_position,
        });

        const physical_card = new PhysicalCard(card);
        const physical_shelf_card = new PhysicalShelfCard(
            card_location,
            physical_card,
        );
        physical_shelf_cards.push(physical_shelf_card);
    }

    return physical_shelf_cards;
}

class PhysicalCardStack {
    physical_game: PhysicalGame;
    stack_location: StackLocation;
    stack: CardStack;
    physical_shelf_cards: PhysicalShelfCard[];
    div: HTMLElement;
    selected: boolean;

    constructor(
        physical_game: PhysicalGame,
        stack_location: StackLocation,
        stack: CardStack,
    ) {
        this.physical_game = physical_game;
        this.stack_location = stack_location;
        this.stack = stack;
        this.physical_shelf_cards = build_physical_shelf_cards(
            stack_location,
            stack.cards,
        );
        this.div = this.make_div();
        this.selected = false;
    }

    make_div(): HTMLElement {
        const physical_game = this.physical_game;
        const stack_location = this.stack_location;
        const div = document.createElement("div");

        div.style.marginRight = "20px";

        div.addEventListener("click", () => {
            physical_game.handle_stack_click(stack_location);
        });

        return div;
    }

    show_as_selected(): void {
        this.selected = true;
        this.div.style.backgroundColor = "cyan";
    }

    show_as_un_selected(): void {
        this.selected = false;
        this.div.style.backgroundColor = "transparent";
    }

    dom(): HTMLElement {
        // should only be called once
        const physical_shelf_cards = this.physical_shelf_cards;
        this.populate();
        return this.div;
    }

    populate(): void {
        const div = this.div;
        const physical_shelf_cards = this.physical_shelf_cards;

        for (const physical_shelf_card of physical_shelf_cards) {
            div.append(physical_shelf_card.dom());
        }
    }

    set_up_clicks_handlers_for_cards(): void {
        const physical_game = this.physical_game;
        const physical_shelf_cards = this.physical_shelf_cards;

        for (const physical_shelf_card of physical_shelf_cards) {
            const card_position =
                physical_shelf_card.card_location.card_position;

            // We may soon support other clicks, but for now,
            // when you click at a card at either end of a stack,
            // it gets split off the stack so that the player
            // can then move that single card to some other stack.
            // (This is part of what makes the game fun.)
            if (card_position === CardPositionType.AT_END) {
                physical_shelf_card.add_click_listener(physical_game);
            }
        }
    }
}

function create_shelf_is_clean_or_not_emoji(shelf: Shelf): HTMLElement {
    const emoji = document.createElement("span");
    emoji.style.marginRight = "10px";
    emoji.style.marginBottom = "5px";

    if (shelf.is_clean()) {
        emoji.innerText = "\u2705"; // green checkmark
    } else {
        emoji.innerText = "\u274C"; // red crossmark
    }

    return emoji;
}

class PhysicalShelf {
    physical_game: PhysicalGame;
    physical_book_case: PhysicalBookCase;
    physical_card_stacks: PhysicalCardStack[];
    shelf_index: number;
    shelf: Shelf;
    div: HTMLElement;

    constructor(info: {
        physical_game: PhysicalGame;
        physical_book_case: PhysicalBookCase;
        shelf_index: number;
        shelf: Shelf;
    }) {
        this.physical_game = info.physical_game;
        this.physical_book_case = info.physical_book_case;
        this.shelf_index = info.shelf_index;
        this.shelf = info.shelf;
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

        div.innerHTML = "";

        const emoji = create_shelf_is_clean_or_not_emoji(shelf);
        div.append(emoji);

        this.physical_card_stacks = this.build_physical_card_stacks();

        for (const physical_card_stack of this.physical_card_stacks) {
            div.append(physical_card_stack.dom());
        }
    }

    build_physical_card_stacks(): PhysicalCardStack[] {
        const physical_game = this.physical_game;
        const shelf_index = this.shelf_index;
        const card_stacks = this.shelf.card_stacks;

        const physical_card_stacks = [];

        for (
            let stack_index = 0;
            stack_index < card_stacks.length;
            ++stack_index
        ) {
            const self = this;
            const card_stack = card_stacks[stack_index];
            const stack_location = new StackLocation({
                shelf_index,
                stack_index,
            });
            const physical_card_stack = new PhysicalCardStack(
                physical_game,
                stack_location,
                card_stack,
            );

            physical_card_stack.set_up_clicks_handlers_for_cards();
            physical_card_stacks.push(physical_card_stack);
        }

        return physical_card_stacks;
    }

    split_card_off_end(info: {
        stack_index: number;
        card_index: number;
    }): void {
        this.shelf.split_card_off_end(info);
        this.populate();
    }

    add_singleton_card(card: Card) {
        this.shelf.add_singleton_card(card);
        this.populate();
    }
}

class PhysicalBookCase {
    physical_game: PhysicalGame;
    book_case: BookCase;
    div: HTMLElement;
    physical_shelves: PhysicalShelf[];
    selected_stack: StackLocation | undefined;

    constructor(physical_game: PhysicalGame, book_case: BookCase) {
        this.physical_game = physical_game;
        this.book_case = book_case;
        this.div = this.make_div();
        this.physical_shelves = this.build_physical_shelves();
        this.selected_stack = undefined;
    }

    build_physical_shelves(): PhysicalShelf[] {
        const physical_game = this.physical_game;
        const physical_book_case = this;
        const physical_shelves = [];
        const shelves = this.book_case.shelves;

        for (let shelf_index = 0; shelf_index < shelves.length; ++shelf_index) {
            const shelf = shelves[shelf_index];
            const physical_shelf = new PhysicalShelf({
                physical_game,
                physical_book_case,
                shelf_index,
                shelf,
            });
            physical_shelves.push(physical_shelf);
        }

        return physical_shelves;
    }

    in_stack_selection_mode(): boolean {
        return this.selected_stack !== undefined;
    }

    handle_stack_click(stack_location: StackLocation): void {
        if (this.in_stack_selection_mode()) {
            if (stack_location.equals(this.selected_stack)) {
                this.un_select_stack();
            } else {
                this.attempt_stack_merge(stack_location);
            }
        } else {
            // Start stack selection mode
            this.select_stack(stack_location);
        }
    }

    physical_card_stack_from(stack_location: StackLocation): PhysicalCardStack {
        const { shelf_index, stack_index } = stack_location;
        const physical_shelf = this.physical_shelves[shelf_index];
        return physical_shelf.physical_card_stacks[stack_index];
    }

    select_stack(stack_location: StackLocation): void {
        const physical_card_stack =
            this.physical_card_stack_from(stack_location);

        // TODO: turn off card click handlers
        this.selected_stack = stack_location;
        physical_card_stack.show_as_selected();
    }

    un_select_stack(): void {
        // TODO: restore card click handlers
        const physical_card_stack = this.physical_card_stack_from(
            this.selected_stack,
        );
        physical_card_stack.show_as_un_selected();
        this.selected_stack = undefined;
    }

    attempt_stack_merge(stack_location: StackLocation): void {
        // Our caller ensures that we have a selected stack.

        const selected_stack = this.selected_stack;

        const merged = this.book_case.merge_card_stacks({
            source: selected_stack,
            target: stack_location,
        });

        if (merged) {
            this.un_select_stack();
            this.populate_shelf(selected_stack.shelf_index);
            this.populate_shelf(stack_location.shelf_index);
        } else {
            alert("Not allowed!");
        }
    }

    populate_shelf(shelf_index): void {
        this.physical_shelves[shelf_index].populate();
    }

    handle_shelf_card_click(card_location: ShelfCardLocation) {
        const { shelf_index, stack_index, card_index } = card_location;

        const physical_shelves = this.physical_shelves;

        // Right now the only action when you click on a shelf card
        // is to split it from the end of its stack.
        physical_shelves[shelf_index].split_card_off_end({
            stack_index,
            card_index,
        });
    }

    make_div(): HTMLElement {
        // no special styling for now
        return document.createElement("div");
    }

    dom(): HTMLElement {
        this.populate();
        return this.div;
    }

    populate(): void {
        const div = this.div;
        const book_case = this.book_case;
        const physical_shelves = this.physical_shelves;

        const heading = document.createElement("h3");
        heading.innerText = "Shelves";

        div.append(heading);
        for (const physical_shelf of physical_shelves) {
            div.append(physical_shelf.dom());
        }
    }

    add_card_to_top_shelf(card: Card) {
        if (this.physical_shelves.length < 1) {
            throw new Error("No top shelf");
        }
        this.physical_shelves[0].add_singleton_card(card);
    }
}

function get_sorted_cards_for_suit(
    suit: Suit,
    hand_cards: HandCard[],
): HandCard[] {
    const suit_cards = [];
    for (const hand_card of hand_cards) {
        const card = hand_card.card;
        if (card.suit === suit) {
            suit_cards.push(hand_card);
        }
    }
    suit_cards.sort((card1, card2) => card1.card.value - card2.card.value);
    return suit_cards;
}

function row_of_cards_in_hand(
    hand_cards: HandCard[],
    physical_game: PhysicalGame,
): HTMLElement {
    /*
        This can be a pure function, because even though
        users can mutate our row (by clicking a card to put it
        out to the book case), we don't ever have to re-draw
        ourself.  We just let PhysicalHand re-populate the
        entire hand, since the hand is usually super small.
    */
    const div = document.createElement("div");
    div.style.paddingBottom = "10px";
    for (const hand_card of hand_cards) {
        const physical_card = new PhysicalCard(hand_card.card);

        const physical_hand_card = new PhysicalHandCard({
            physical_card,
            hand_card,
        });
        physical_hand_card.add_click_listener(physical_game);
        const node = physical_hand_card.dom();

        div.append(node);
    }
    return div;
}

class PhysicalHand {
    physical_game: PhysicalGame;
    hand: Hand;
    div: HTMLElement;

    constructor(physical_game: PhysicalGame, hand: Hand) {
        this.physical_game = physical_game;
        this.hand = hand;
        this.div = this.make_div();
    }

    make_div(): HTMLElement {
        // no real styling yet
        return document.createElement("div");
    }

    dom(): HTMLElement {
        this.populate();
        return this.div;
    }

    populate(): void {
        const physical_game = this.physical_game;
        const div = this.div;
        const cards = this.hand.hand_cards;
        div.innerHTML = "";

        for (const suit of all_suits) {
            const suit_cards = get_sorted_cards_for_suit(suit, cards);

            if (suit_cards.length > 0) {
                const row = row_of_cards_in_hand(suit_cards, physical_game);
                div.append(row);
            }
        }
    }

    remove_card_from_hand(card: Card) {
        this.hand.remove_card_from_hand(card);
        this.populate();
    }

    add_card_to_hand(card: Card) {
        this.hand.add_cards([new HandCard({ card, is_new: true })]);
        this.populate();
    }
}

class PhysicalPlayer {
    physical_game: PhysicalGame;
    player: Player;
    physical_hand: PhysicalHand;

    constructor(physical_game: PhysicalGame, player: Player) {
        this.physical_game = physical_game;
        this.player = player;
        this.physical_hand = new PhysicalHand(physical_game, player.hand);
    }

    dom(): HTMLElement {
        const player = this.player;

        const div = document.createElement("div");
        const h3 = document.createElement("h3");
        h3.innerText = player.name;
        div.append(h3);

        div.append(this.physical_hand.dom());

        const pick_card_button = document.createElement("button");
        pick_card_button.innerText = "Pick new card";
        pick_card_button.addEventListener("click", () => {
            this.physical_game.move_card_from_deck_to_hand();
        });
        div.append(pick_card_button);
        return div;
    }
}

class PhysicalGame {
    game: Game;
    player_area: HTMLElement;
    book_case_area: HTMLElement;
    physical_player: PhysicalPlayer;
    physical_book_case: PhysicalBookCase;
    physical_deck: PhysicalDeck;
    constructor(info: {
        player_area: HTMLElement;
        book_case_area: HTMLElement;
    }) {
        const physical_game = this;
        this.game = new Game();
        this.game.deal_cards();
        this.player_area = info.player_area;
        this.book_case_area = info.book_case_area;
        this.physical_deck = new PhysicalDeck(this.game.deck);
        const player = this.game.players[0];
        this.physical_book_case = new PhysicalBookCase(
            physical_game,
            this.game.book_case,
        );
        this.physical_player = new PhysicalPlayer(physical_game, player);
    }

    // ACTION - we would send this over wire for multi-player game
    handle_shelf_card_click(card_location: ShelfCardLocation) {
        this.physical_book_case.handle_shelf_card_click(card_location);
    }

    // ACTION! (We will need to broadcast this when we
    // get to multi-player.)
    move_card_from_hand_to_top_shelf(card: Card): void {
        this.physical_player.physical_hand.remove_card_from_hand(card);
        this.physical_book_case.add_card_to_top_shelf(card);
    }

    // ACTION!
    move_card_from_deck_to_hand(): void {
        const card = this.physical_deck.take_from_top(1)[0];
        this.physical_player.physical_hand.add_card_to_hand(card);
    }

    // ACTION!
    handle_stack_click(stack_location: StackLocation): void {
        this.physical_book_case.handle_stack_click(stack_location);
    }

    start() {
        const game = this.game;

        this.player_area.innerHTML = "";
        this.player_area.append(this.physical_player.dom());

        const deck_dom = this.physical_deck.dom();
        this.player_area.append(deck_dom);

        // populate common area
        this.book_case_area.replaceWith(this.physical_book_case.dom());
    }
}

function heading_for_example_card_stack(opts: {
    comment: string;
    color: string;
}): HTMLElement {
    const { comment, color } = opts;

    const heading = document.createElement("div");
    heading.innerText = comment;
    heading.style.color = color;
    heading.style.fontSize = "17px";
    heading.style.fontWeight = "bold";
    heading.style.paddingBottom = "2px";

    return heading;
}

function div_for_example_card_stack(stack: CardStack): HTMLElement {
    const physical_shelf_cards = this.physical_shelf_cards;

    const div = document.createElement("div");

    for (const card of stack.cards) {
        const physical_card = new PhysicalCard(card);
        div.append(physical_card.dom());
    }

    return div;
}

function color_for_example_stack(stack: CardStack): string {
    switch (stack.stack_type) {
        case CardStackType.DUP:
        case CardStackType.BOGUS:
            return "red";
        case CardStackType.INCOMPLETE:
            return "lightred";
        default:
            return "green";
    }
}

class PhysicalExample {
    example: Example;

    constructor(example: Example) {
        this.example = example;
    }

    dom(): Node {
        const stack = this.example.stack;
        const comment = this.example.comment;

        const card_stack_div = div_for_example_card_stack(stack);
        const color = color_for_example_stack(stack);
        const heading = heading_for_example_card_stack({ comment, color });

        const div = document.createElement("div");
        div.style.paddingBottom = "11px";

        div.append(heading);
        div.append(card_stack_div);

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

function create_welcome_button(): HTMLElement {
    // TODO: This is badly in need of better styling!
    const welcome_button = document.createElement("button");
    welcome_button.style.background = "white";
    welcome_button.style.color = "green";
    welcome_button.style.padding = "3px";
    welcome_button.style.margin = "10px";
    welcome_button.style.fontSize = "30px";
    welcome_button.innerText = "Begin Game!";
    return welcome_button;
}

class MainPage {
    page: HTMLElement;
    welcome_area: HTMLElement;
    player_area: HTMLElement;
    examples_area: HTMLElement;
    book_case_area: HTMLElement;

    constructor() {
        this.page = document.createElement("div");
        this.page.style.display = "flex";
        this.page.style.width = "100%";

        this.welcome_area = document.createElement("div");

        this.player_area = document.createElement("div");
        this.player_area.style.paddingRight = "20px";
        this.player_area.style.marginRight = "20px";
        this.player_area.style.borderRight = "1px gray solid";

        this.examples_area = document.createElement("div");
        this.examples_area.style.paddingLeft = "20px";

        this.book_case_area = document.createElement("div");

        const left_panel = document.createElement("div");
        left_panel.append(this.welcome_area);
        left_panel.append(this.player_area);

        const right_panel = document.createElement("div");
        right_panel.append(this.examples_area);
        right_panel.append(this.book_case_area);

        this.page.append(left_panel);
        this.page.append(right_panel);
    }

    start(): void {
        const self = this;
        const welcome_area = this.welcome_area;
        const examples_area = this.examples_area;

        const welcome = document.createElement("div");
        welcome.innerText = "Welcome to Lyn Rummy!";
        welcome.style.color = "green";
        welcome.style.fontWeight = "bold";

        const welcome_button = create_welcome_button();
        welcome_button.addEventListener("click", () => {
            self.start_actual_game();
        });

        welcome_area.append(welcome);
        welcome_area.append(welcome_button);

        const examples = new PhysicalExamples(examples_area);
        examples.start({
            on_dismiss_callback() {
                self.start_actual_game();
            },
        });

        document.body.append(this.page);
    }

    start_actual_game(): void {
        const welcome_area = this.welcome_area;
        const examples_area = this.examples_area;
        const player_area = this.player_area;
        const book_case_area = this.book_case_area;

        welcome_area.innerHTML = "";
        examples_area.innerHTML = "";

        // We get called back one the player dismisses the examples.
        const physical_game = new PhysicalGame({
            player_area: player_area,
            book_case_area: book_case_area,
        });
        physical_game.start();
    }
}

function get_examples(): { good: Example[]; bad: Example[] } {
    const good = [
        new Example("SET of 3s", "3H,3S,3D", CardStackType.SET),
        new Example("SET of Jacks", "JH,JS,JD,JC", CardStackType.SET),
        new Example("PURE RUN of hearts", "TH,JH,QH", CardStackType.PURE_RUN),
        new Example(
            "PURE RUN around the ace",
            "KS,AS,2S,3S,4S,5S",
            CardStackType.PURE_RUN,
        ),
        new Example(
            "RED-BLACK RUN with three cards",
            "3S,4D,5C",
            CardStackType.RED_BLACK_RUN,
        ),
        new Example(
            "RED-BLACK RUN around the ace",
            "QH,KC,AD,2S,3D",
            CardStackType.RED_BLACK_RUN,
        ),
    ];

    const bad = [
        new Example(
            "INCOMPLETE (set of kings)",
            "KC,KS",
            CardStackType.INCOMPLETE,
        ),
        new Example(
            "INCOMPLETE (pure run of hearts)",
            "QH,KH",
            CardStackType.INCOMPLETE,
        ),
        new Example(
            "INCOMPLETE (red-black run)",
            "3S,4D",
            CardStackType.INCOMPLETE,
        ),
        new Example("ILLEGAL! No dups allowed.", "3H,3S,3H", CardStackType.DUP),
        new Example("non sensical", "3S,4D,4H", CardStackType.BOGUS),
    ];

    return { good, bad };
}

function has_duplicate_cards(cards: Card[]): boolean {
    function any_dup_card(card: Card, rest: Card[]): boolean {
        if (rest.length === 0) {
            return false;
        }
        if (card.equals(rest[0])) {
            return true;
        }
        return any_dup_card(card, rest.slice(1));
    }

    if (cards.length <= 1) {
        return false;
    }

    return (
        any_dup_card(cards[0], cards.slice(1)) ||
        has_duplicate_cards(cards.slice(1))
    );
}

function follows_consistent_pattern(
    cards: Card[],
    stack_type: CardStackType,
): boolean {
    if (cards.length <= 1) {
        return true;
    }
    if (cards[0].with(cards[1]) !== stack_type) {
        return false;
    }
    return follows_consistent_pattern(cards.slice(1), stack_type);
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

function example_book_case() {
    return new BookCase([
        Shelf.from("AC", OriginDeck.DECK_ONE),
        Shelf.from("AH | 2C | 5S,6S,7S | 4D | 8S,9S | 6C", OriginDeck.DECK_ONE),
    ]);
}

function test_merge() {
    let book_case = example_book_case();
    console.log(book_case.str());
    console.log("------");

    book_case.merge_card_stacks({
        source: new StackLocation({ shelf_index: 1, stack_index: 4 }),
        target: new StackLocation({ shelf_index: 1, stack_index: 2 }),
    });
    console.log(book_case.str());

    book_case = example_book_case();
    book_case.merge_card_stacks({
        source: new StackLocation({ shelf_index: 1, stack_index: 2 }),
        target: new StackLocation({ shelf_index: 1, stack_index: 4 }),
    });
    console.log(book_case.str());
}

function test() {
    const game = new Game();
    get_examples(); // run for side effects
    test_merge();
}

test();
