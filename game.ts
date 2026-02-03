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

enum HandCardState {
    NORMAL,
    FRESHLY_DRAWN,
}

enum BoardCardState {
    FIRMLY_ON_BOARD,
    FRESHLY_PLAYED,
    FRESHLY_PLAYED_BY_LAST_PLAYER,
}

enum CompleteTurnResult {
    SUCCESS,
    SUCCESS_BUT_NEEDS_CARDS,
    FAILURE,
}

class ShelfCardLocation {
    shelf_index: number;
    stack_index: number;
    card_index: number;

    constructor(info: {
        shelf_index: number;
        stack_index: number;
        card_index: number;
    }) {
        this.shelf_index = info.shelf_index;
        this.stack_index = info.stack_index;
        this.card_index = info.card_index;
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

function is_pair_of_dups(card1: Card, card2): boolean {
    // In a two-deck game, two cards can be both be
    // the Ace of Hearts, to use an example,
    // but you can't put dups in a set.
    return card1.value === card2.value && card1.suit === card2.suit;
}

function card_pair_stack_type(card1: Card, card2: Card): CardStackType {
    // See if the pair is a promising start to a stack.
    // Do not return INCOMPLETE here. It's obviously
    // not complete in this context, and our caller will
    // understand that.

    if (is_pair_of_dups(card1, card2)) {
        return CardStackType.DUP;
    }

    if (card1.value === card2.value) {
        return CardStackType.SET;
    }

    // Order is important for the successor check!
    if (card2.value === successor(card1.value)) {
        if (card1.suit === card2.suit) {
            return CardStackType.PURE_RUN;
        } else if (card1.color !== card2.color) {
            return CardStackType.RED_BLACK_RUN;
        }
    }
    return CardStackType.BOGUS;
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

    const provisional_stack_type = card_pair_stack_type(cards[0], cards[1]);

    if (provisional_stack_type === CardStackType.BOGUS) {
        return CardStackType.BOGUS;
    }

    if (provisional_stack_type === CardStackType.DUP) {
        return CardStackType.DUP;
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
    throw new Error("Invalid label");
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

function suit_emoji_str(suit: Suit): string {
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

function suit_str(suit: Suit): string {
    switch (suit) {
        case Suit.CLUB:
            return "C";
        case Suit.DIAMOND:
            return "D";
        case Suit.HEART:
            return "H";
        case Suit.SPADE:
            return "S";
    }
}

function deck_str(origin_deck: OriginDeck): string {
    return origin_deck.toString();
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
    throw new Error("Invalid Suit label");
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

function get_sorted_cards_for_suit(
    suit: Suit,
    hand_cards: HandCard[],
): HandCard[] {
    const suit_cards: HandCard[] = [];
    for (const hand_card of hand_cards) {
        if (hand_card.card.suit === suit) {
            suit_cards.push(hand_card);
        }
    }
    suit_cards.sort(
        (hand_card1, hand_card2) =>
            hand_card1.card.value - hand_card2.card.value,
    );
    return suit_cards;
}

function build_full_double_deck(): Card[] {
    // Returns a shuffled deck of 2 packs of normal cards.

    function suit_run(suit: Suit, origin_deck: OriginDeck) {
        return all_card_values.map(
            (card_value) => new Card(card_value, suit, origin_deck),
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

class Card {
    suit: Suit;
    value: CardValue;
    color: CardColor;
    origin_deck: OriginDeck;

    constructor(value: CardValue, suit: Suit, origin_deck: OriginDeck) {
        this.value = value;
        this.suit = suit;
        this.origin_deck = origin_deck;
        this.color = card_color(suit);
    }

    clone(): Card {
        return new Card(this.value, this.suit, this.origin_deck);
    }

    str(): string {
        return value_str(this.value) + suit_emoji_str(this.suit);
    }

    equals(other_card: Card): boolean {
        return (
            this.value === other_card.value &&
            this.suit === other_card.suit &&
            this.origin_deck === other_card.origin_deck
        );
    }

    static from(label: string, origin_deck: OriginDeck): Card {
        const value = value_for(label[0]);
        const suit = suit_for(label[1]);
        return new Card(value, suit, origin_deck);
    }
}

class HandCard {
    card: Card;
    state: HandCardState;

    constructor(card: Card, state: HandCardState) {
        this.card = card;
        this.state = state;
    }

    clone(): HandCard {
        return new HandCard(this.card, this.state);
    }

    str(): string {
        return this.card.str();
    }
}

class BoardCard {
    card: Card;
    state: BoardCardState;

    constructor(card: Card, state: BoardCardState) {
        this.card = card;
        this.state = state;
    }

    clone(): BoardCard {
        return new BoardCard(this.card, this.state);
    }

    str(): string {
        return this.card.str();
    }

    static from(label: string, origin_deck: OriginDeck): BoardCard {
        const value = value_for(label[0]);
        const suit = suit_for(label[1]);
        const card = new Card(value, suit, origin_deck);
        return new BoardCard(card, BoardCardState.FIRMLY_ON_BOARD);
    }

    static from_hand_card(hand_card: HandCard): BoardCard {
        return new BoardCard(hand_card.card, BoardCardState.FRESHLY_PLAYED);
    }
}

class CardStack {
    board_cards: BoardCard[]; // Order does matter here!
    stack_type: CardStackType;

    constructor(board_cards: BoardCard[]) {
        this.board_cards = board_cards;
        this.stack_type = this.get_stack_type();
    }

    clone(): CardStack {
        return new CardStack(this.board_cards.map((card) => card.clone()));
    }

    get_cards(): Card[] {
        return this.board_cards.map((board_card) => board_card.card);
    }

    count(): number {
        return this.board_cards.length;
    }

    get_stack_type(): CardStackType {
        // Use raw cards.
        return get_stack_type(this.get_cards());
    }

    str() {
        return this.board_cards.map((board_card) => board_card.str()).join(",");
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

    is_mergeable_with(other_stack: CardStack): boolean {
        return CardStack.merge(this, other_stack) !== undefined;
    }

    is_mergeable_with_card(hand_card: HandCard): boolean {
        const board_card = BoardCard.from_hand_card(hand_card);
        return this.is_mergeable_with(new CardStack([board_card]));
    }

    static merge(s1: CardStack, s2: CardStack): CardStack | undefined {
        const stack1 = new CardStack([...s1.board_cards, ...s2.board_cards]);
        if (!stack1.problematic()) {
            return stack1;
        }
        const stack2 = new CardStack([...s2.board_cards, ...s1.board_cards]);
        if (!stack2.problematic()) {
            return stack2;
        }
        return undefined;
    }

    static from(shorthand: string, origin_deck: OriginDeck): CardStack {
        const card_labels = shorthand.split(",");
        const board_cards = card_labels.map((label) =>
            BoardCard.from(label, origin_deck),
        );
        return new CardStack(board_cards);
    }

    static from_hand_card(hand_card: HandCard): CardStack {
        const board_card = BoardCard.from_hand_card(hand_card);
        return new CardStack([board_card]);
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

    clone(): Shelf {
        return new Shelf(
            this.card_stacks.map((card_stack) => card_stack.clone()),
        );
    }

    str(): string {
        const card_stacks = this.card_stacks;

        if (card_stacks.length === 0) {
            return "(empty)";
        }

        return card_stacks.map((card_stack) => card_stack.str()).join(" | ");
    }

    is_last_stack(stack_location: StackLocation): boolean {
        return this.card_stacks.length - 1 === stack_location.stack_index;
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

    extend_stack_with_card(
        stack_index: number,
        hand_card: HandCard,
    ): CardStack {
        const card_stacks = this.card_stacks;
        const card_stack = this.card_stacks[stack_index];
        const new_stack = CardStack.from_hand_card(hand_card);
        const longer_stack = CardStack.merge(card_stack, new_stack);

        card_stacks[stack_index] = longer_stack;

        return longer_stack;
    }

    split_card_from_stack(info: {
        stack_index: number;
        card_index: number;
    }): void {
        const { stack_index, card_index } = info;
        const card_stacks = this.card_stacks;
        const card_stack = card_stacks[stack_index];
        const board_cards = card_stack.board_cards;

        const new_card_arrays = [
            board_cards.slice(0, card_index),
            [board_cards[card_index]],
            board_cards.slice(card_index + 1),
        ].filter((arr) => arr.length > 0);

        const new_card_stacks = new_card_arrays.map(
            (arr) => new CardStack(arr),
        );

        card_stacks.splice(stack_index, 1, ...new_card_stacks);
    }

    add_singleton_card(hand_card: HandCard) {
        this.card_stacks.push(CardStack.from_hand_card(hand_card));
    }

    static from(shorthand: string, origin_deck: OriginDeck): Shelf {
        const sigs = shorthand.split(" | ");
        const card_stacks = sigs.map((sig) => CardStack.from(sig, origin_deck));
        return new Shelf(card_stacks);
    }
}

let CurrentBoard: Board;

class Board {
    /*
        This is where the players lay out all the common cards.
        In the in-person game the "board" would be on the table that
        the users sit around.
    */

    shelves: Shelf[];

    constructor(shelves: Shelf[]) {
        this.shelves = shelves;
    }

    clone(): Board {
        return new Board(this.shelves.map((shelf) => shelf.clone()));
    }

    str(): string {
        return this.shelves.map((shelf) => shelf.str()).join("\n");
    }

    is_clean(): boolean {
        return this.shelves.every((shelf) => shelf.is_clean());
    }

    get_cards(): BoardCard[] {
        const shelves = this.shelves;

        const result: BoardCard[] = [];
        for (const shelf of shelves) {
            for (const card_stack of shelf.card_stacks) {
                for (const board_card of card_stack.board_cards) {
                    result.push(board_card);
                }
            }
        }

        return result;
    }

    move_card_stack_to_end_of_shelf(
        card_stack_location: StackLocation,
        new_shelf_idx: number,
    ) {
        const old_shelf_idx = card_stack_location.shelf_index;
        const old_stack_idx = card_stack_location.stack_index;
        const [stack] = this.shelves[old_shelf_idx].card_stacks.splice(
            old_stack_idx,
            1,
        );
        this.shelves[new_shelf_idx].card_stacks.push(stack);
    }

    get_stack_locations(): StackLocation[] {
        const shelves = this.shelves;

        const locs: StackLocation[] = [];

        for (let i = 0; i < this.shelves.length; i++) {
            const shelf = shelves[i];

            for (let j = 0; j < shelf.card_stacks.length; j++) {
                const loc = new StackLocation({
                    shelf_index: i,
                    stack_index: j,
                });
                locs.push(loc);
            }
        }
        return locs;
    }

    get_stack_for(stack_location: StackLocation): CardStack {
        const { shelf_index, stack_index } = stack_location;
        const shelf = this.shelves[shelf_index];

        return shelf.card_stacks[stack_index];
    }

    get_stacks(): CardStack[] {
        return this.get_stack_locations().map((loc) => this.get_stack_for(loc));
    }

    score(): number {
        const stacks = this.get_stacks();
        return Score.for_stacks(stacks);
    }

    // Returns the merged stack or undefined
    merge_card_stacks(info: {
        source: StackLocation;
        target: StackLocation;
    }): CardStack | undefined {
        if (info.source.equals(info.target)) {
            return undefined;
        }

        const shelves = this.shelves;

        const source_shelf_index = info.source.shelf_index;
        const source_stack_index = info.source.stack_index;
        const target_shelf_index = info.target.shelf_index;
        const target_stack_index = info.target.stack_index;

        const source_shelf = shelves[source_shelf_index];
        const target_shelf = shelves[target_shelf_index];

        const source_stacks = source_shelf.card_stacks;
        const target_stacks = target_shelf.card_stacks;

        const source_stack = source_stacks[source_stack_index];
        const target_stack = target_stacks[target_stack_index];

        const merged_stack = CardStack.merge(source_stack, target_stack);

        if (merged_stack === undefined) {
            return undefined;
        }

        const is_same_shelf_rightward_merge =
            source_shelf_index === target_shelf_index &&
            source_stack_index < target_stack_index;

        const final_index = is_same_shelf_rightward_merge
            ? target_stack_index - 1
            : target_stack_index;

        source_stacks.splice(source_stack_index, 1);
        target_stacks[final_index] = merged_stack;

        return merged_stack;
    }
    // This is called after the player's turn ends.
    age_cards(): void {
        for (const board_card of this.get_cards()) {
            switch (board_card.state) {
                case BoardCardState.FRESHLY_PLAYED_BY_LAST_PLAYER:
                    board_card.state = BoardCardState.FIRMLY_ON_BOARD;
                    break;
                case BoardCardState.FRESHLY_PLAYED:
                    board_card.state =
                        BoardCardState.FRESHLY_PLAYED_BY_LAST_PLAYER;
                    break;
            }
        }
    }
}

let TheDeck: Deck;

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

class Hand {
    hand_cards: HandCard[];

    constructor() {
        this.hand_cards = [];
    }

    add_cards(cards: Card[], state: HandCardState): void {
        for (const card of cards) {
            this.hand_cards.push(new HandCard(card, state));
        }
    }

    remove_card_from_hand(hand_card: HandCard): void {
        const hand_cards = this.hand_cards;

        for (let i = 0; i < hand_cards.length; ++i) {
            if (hand_cards[i].card.equals(hand_card.card)) {
                hand_cards.splice(i, 1);
                return;
            }
        }

        throw new Error("Card to be removed is not present in the array!");
    }

    // This is called after the player's turn ends.
    reset_state(): void {
        for (const hand_card of this.hand_cards) {
            hand_card.state = HandCardState.NORMAL;
        }
    }

    size(): number {
        return this.hand_cards.length;
    }
}

let ActivePlayer: Player;

class Player {
    name: string;
    hand: Hand;
    total_score: number;
    starting_hand_size: number;
    starting_board_score: number;
    active: boolean;

    constructor(info: { name: string }) {
        this.name = info.name;
        this.hand = new Hand();
        this.total_score = 0;
        this.active = false;
    }

    reset_hand_state(): void {
        this.hand.reset_state();
    }

    start_turn(): void {
        this.active = true;
        this.starting_hand_size = this.hand.size();
        this.starting_board_score = CurrentBoard.score();
    }

    get_turn_score(): number {
        const board_score = CurrentBoard.score() - this.starting_board_score;
        const num_cards_played = this.starting_hand_size - this.hand.size();
        const cards_score = Score.for_cards_played(num_cards_played);
        return board_score + cards_score;
    }

    end_turn(): void {
        this.active = false;
        const turn_score = this.get_turn_score();
        this.total_score += turn_score;
        console.log("scores", turn_score, this.total_score);
    }

    can_get_new_cards(): boolean {
        return this.hand.size() === this.starting_hand_size;
    }

    take_cards_from_deck(cnt: number): void {
        const cards = TheDeck.take_from_top(cnt);
        this.hand.add_cards(cards, HandCardState.FRESHLY_DRAWN);
    }
}

function empty_shelf(): Shelf {
    return new Shelf([]);
}

function initial_board(): Board {
    function shelf(sig: string): Shelf {
        return new Shelf([CardStack.from(sig, OriginDeck.DECK_ONE)]);
    }

    const shelves = [
        empty_shelf(),
        shelf("KS,AS,2S,3S"),
        shelf("TD,JD,QD,KD"),
        shelf("2H,3H,4H"),
        shelf("7S,7D,7C"),
        shelf("AC,AD,AH"),
        shelf("2C,3D,4C,5H"),
    ];

    return new Board(shelves);
}

class ScoreSingleton {
    stack_type_value(stack_type: CardStackType): number {
        switch (stack_type) {
            case CardStackType.PURE_RUN:
                return 90;
            case CardStackType.SET:
                return 60;
            case CardStackType.RED_BLACK_RUN:
                return 50;
            default:
                return 0;
        }
    }

    for_stack(stack: CardStack): number {
        return (stack.count() - 2) * this.stack_type_value(stack.stack_type);
    }

    for_stacks(stacks: CardStack[]): number {
        let score = 0;

        for (const stack of stacks) {
            score += this.for_stack(stack);
        }

        return score;
    }

    for_cards_played(num: number) {
        return 100 * num * num;
    }
}

let Score = new ScoreSingleton();

class Game {
    players: Player[];
    current_player_index: number;
    // The first snapshot will be initialized after `deal_cards`.
    // We will then update the snapshot at any point the board is in a clean state.
    snapshot: { hand_cards: HandCard[]; board: Board };

    constructor() {
        this.players = [
            new Player({ name: "Player One" }),
            new Player({ name: "Player Two" }),
        ];
        TheDeck = new Deck();
        CurrentBoard = initial_board();

        // remove initial cards from deck
        for (const board_card of CurrentBoard.get_cards()) {
            TheDeck.pull_card_from_deck(board_card.card);
        }

        this.deal_cards();
        this.current_player_index = 0;
        ActivePlayer = this.players[0];
        ActivePlayer.start_turn();

        // This initializes the snapshot for the first turn.
        this.update_snapshot();
    }

    update_snapshot(): void {
        this.snapshot = {
            hand_cards: ActivePlayer.hand.hand_cards.map((hand_card) =>
                hand_card.clone(),
            ),
            board: CurrentBoard.clone(),
        };
    }

    // We update the snapshot if the board is in a clean state after making
    // some move.
    maybe_update_snapshot() {
        if (CurrentBoard.is_clean()) {
            this.update_snapshot();
        }
    }

    rollback_moves_to_last_clean_state(): void {
        const snapshot = this.snapshot;
        ActivePlayer.hand.hand_cards = snapshot.hand_cards;
        CurrentBoard = snapshot.board;
    }

    deal_cards() {
        for (const player of this.players) {
            const cards = TheDeck.take_from_top(15);
            player.hand.add_cards(cards, HandCardState.NORMAL);
        }
    }

    advance_turn_to_next_player(): void {
        this.current_player_index =
            (this.current_player_index + 1) % this.players.length;

        ActivePlayer = this.players[this.current_player_index];
    }

    complete_turn(): CompleteTurnResult {
        if (!CurrentBoard.is_clean()) return CompleteTurnResult.FAILURE;

        ActivePlayer.reset_hand_state();

        // Important to do this now for scoring (before we draw cards).
        ActivePlayer.end_turn();

        let turn_result;

        if (ActivePlayer.can_get_new_cards()) {
            ActivePlayer.take_cards_from_deck(3);
            turn_result = CompleteTurnResult.SUCCESS_BUT_NEEDS_CARDS;
        } else {
            turn_result = CompleteTurnResult.SUCCESS;
        }

        return turn_result;
    }
}

function has_duplicate_cards(cards: Card[]): boolean {
    function any_dup_card(card: Card, rest: Card[]): boolean {
        if (rest.length === 0) {
            return false;
        }
        if (is_pair_of_dups(card, rest[0])) {
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

    if (card_pair_stack_type(cards[0], cards[1]) !== stack_type) {
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

/***********************************************

    TRY TO KEEP MODEL CODE ABOVE ^^^^^

    TRY TO KEEP UI CODE BELOW vvvvv

***********************************************/

function css_color(card_color: CardColor): string {
    return card_color == CardColor.RED ? "red" : "black";
}

function render_playing_card(card: Card): HTMLElement {
    const span = document.createElement("span");
    const v_node = document.createElement("span");
    const s_node = document.createElement("span");
    v_node.style.display = "block";
    v_node.style.userSelect = "none";
    s_node.style.display = "block";
    s_node.style.userSelect = "none";
    v_node.innerText = value_str(card.value);
    s_node.innerText = suit_emoji_str(card.suit);
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

function render_hand_card_row(card_spans: HTMLElement[]): HTMLElement {
    const div = document.createElement("div");
    div.style.paddingBottom = "10px";
    for (const card_span of card_spans) {
        div.append(card_span);
    }
    return div;
}

function render_card_stack(card_spans: HTMLElement[]): HTMLElement {
    const div = document.createElement("div");
    div.style.marginLeft = "15px";
    div.style.marginRight = "15px";

    for (const card_span of card_spans) {
        div.append(card_span);
    }

    return div;
}

function render_empty_shelf_spot(): HTMLElement {
    const div = document.createElement("div");
    div.classList.add("empty-shelf-spot");
    div.style.width = "40px";
    div.style.height = "34px";
    div.style.border = "2px lightgreen dotted";
    div.style.marginLeft = "15px";
    div.style.marginRight = "15px";
    div.style.marginBottom = "5px";
    div.style.order = "1";
    div.style.backgroundColor = "rgba(0,0,200,0.05)";
    return div;
}

function render_shelf(): HTMLElement {
    const div = document.createElement("div");
    div.classList.add("shelf");
    div.style.display = "flex";
    div.style.minWidth = "600px";
    div.style.alignItems = "flex-end";
    div.style.paddingBottom = "2px";
    div.style.borderBottom = "3px solid blue";
    div.style.marginTop = "3px";
    div.style.marginBottom = "10px";
    div.style.minHeight = "45px";
    return div;
}

function render_complete_turn_button(): HTMLElement {
    const button = document.createElement("button");
    button.classList.add("button", "complete-turn-button");
    button.style.backgroundColor = button_color();
    button.style.color = "white";
    button.style.marginRight = "5px";
    button.innerText = "Complete turn";
    return button;
}

function render_undo_button(): HTMLElement {
    const button = document.createElement("button");
    button.classList.add("button", "reset-button");
    button.style.backgroundColor = button_color();
    button.style.color = "white";
    button.innerText = "Undo mistakes";
    return button;
}

function heading_color() {
    return button_color(); // needs another color haha
}

function button_color() {
    return "#000080"; // navy blue
}

/***********************************************

    TRY TO KEEP PURE DRAWING CODE ABOVE ^^^^^

    TRY TO KEEP OTHER UI CODE BELOW vvvvv

***********************************************/

type ClickHandler = (e: MouseEvent) => void;

function opponent_card_color(): string {
    // kind of a pale blue
    return "rgba(0, 0, 255, 0.2)";
}

function new_card_color(): string {
    // kind of a pale yellow
    return "rgba(255, 255, 0, 0.4)";
}

class PhysicalHandCard {
    hand_card: HandCard;
    card: Card;
    card_span: HTMLElement;

    constructor(hand_card: HandCard) {
        this.hand_card = hand_card;
        this.card = hand_card.card;
        this.card_span = render_playing_card(this.card);
        this.allow_dragging();
        this.update_state_styles();
    }

    dom() {
        return this.card_span;
    }

    get_width() {
        return this.card_span.clientWidth;
    }

    handle_dragstart(e): void {
        const hand_card = this.hand_card;
        const tray_width = this.get_width();
        HandCardDragAction.start_drag_hand_card({ hand_card, tray_width });
    }

    handle_dragend(): void {
        HandCardDragAction.end_drag_hand_card();
    }

    allow_dragging() {
        const self = this;
        const div = this.card_span;

        div.draggable = true;
        div.style.userSelect = undefined;

        div.addEventListener("dragstart", (e) => {
            self.handle_dragstart(e);
        });

        div.addEventListener("dragend", () => {
            self.handle_dragend();
        });
    }

    update_state_styles(): void {
        const span = this.card_span;

        if (this.hand_card.state === HandCardState.FRESHLY_DRAWN) {
            span.style.backgroundColor = new_card_color();
        } else {
            span.style.backgroundColor = "transparent";
        }
    }
}

class PhysicalBoardCard {
    board_card: BoardCard;
    card: Card;
    card_location: ShelfCardLocation;
    card_span: HTMLElement;
    click_handler: ClickHandler | undefined;

    constructor(card_location: ShelfCardLocation, board_card: BoardCard) {
        this.board_card = board_card;
        this.card = board_card.card;
        this.card_location = card_location;
        this.card_span = render_playing_card(this.card);
        this.click_handler = undefined;
        this.update_state_styles();
    }

    dom(): HTMLElement {
        return this.card_span;
    }

    reset_click_listener(): void {
        if (this.click_handler === undefined) {
            return;
        }
        this.card_span.removeEventListener("click", this.click_handler);
        this.click_handler = undefined;
    }

    add_click_listener(physical_board: PhysicalBoard): void {
        const div = this.card_span;
        const self = this;

        this.reset_click_listener(); // there can only be ONE!

        this.click_handler = (e) => {
            EventManager.split_card_from_stack(self.card_location);
            e.stopPropagation();
        };

        div.addEventListener("click", this.click_handler);
    }

    update_state_styles(): void {
        const span = this.card_span;
        const state = this.board_card.state;

        if (state === BoardCardState.FRESHLY_PLAYED) {
            span.style.backgroundColor = new_card_color();
        } else if (state === BoardCardState.FRESHLY_PLAYED_BY_LAST_PLAYER) {
            span.style.backgroundColor = opponent_card_color();
        } else {
            span.style.backgroundColor = "transparent";
        }
    }
}

function build_physical_board_cards(
    stack_location: StackLocation,
    board_cards: BoardCard[],
): PhysicalBoardCard[] {
    const physical_board_cards: PhysicalBoardCard[] = [];
    const { shelf_index, stack_index } = stack_location;

    for (let card_index = 0; card_index < board_cards.length; ++card_index) {
        const board_card = board_cards[card_index];

        const card_location = new ShelfCardLocation({
            shelf_index,
            stack_index,
            card_index,
        });

        const physical_board_card = new PhysicalBoardCard(
            card_location,
            board_card,
        );
        physical_board_cards.push(physical_board_card);
    }

    return physical_board_cards;
}

class PhysicalCardStack {
    physical_board: PhysicalBoard;
    stack_location: StackLocation;
    stack: CardStack;
    physical_board_cards: PhysicalBoardCard[];
    div: HTMLElement;

    constructor(
        physical_board: PhysicalBoard,
        stack_location: StackLocation,
        stack: CardStack,
    ) {
        this.physical_board = physical_board;
        this.stack_location = stack_location;
        this.stack = stack;

        this.physical_board_cards = build_physical_board_cards(
            stack_location,
            stack.board_cards,
        );

        const card_spans = this.physical_board_cards.map((psc) => psc.dom());

        this.div = render_card_stack(card_spans);
        this.enable_drop();
        this.allow_dragging();
    }

    dom(): HTMLElement {
        return this.div;
    }

    get_stack_width() {
        return this.div.clientWidth;
    }

    maybe_show_as_mergeable(card_stack): void {
        if (this.stack.is_mergeable_with(card_stack)) {
            this.show_as_mergeable();
        }
    }

    show_as_mergeable(): void {
        this.div.style.backgroundColor = "hsl(105, 72.70%, 87.10%)";
    }

    hide_as_mergeable(): void {
        this.div.style.backgroundColor = "transparent";
    }

    set_up_clicks_handlers_for_cards(): void {
        const physical_board = this.physical_board;
        const physical_board_cards = this.physical_board_cards;

        for (const physical_board_card of physical_board_cards) {
            physical_board_card.add_click_listener(physical_board);
        }
    }

    /* accept DROP (either hand card or stack) */

    can_drop_card(): boolean {
        const dragged_card = HandCardDragAction.get_card();
        return this.stack.is_mergeable_with_card(dragged_card);
    }

    dragged_stack(): CardStack {
        const stack_location = CardStackDragAction.get_dragged_stack_location();
        return CurrentBoard.get_stack_for(stack_location);
    }

    can_drop_stack(): boolean {
        return this.stack.is_mergeable_with(this.dragged_stack());
    }

    accepts_drop(): boolean {
        if (HandCardDragAction.in_progress()) {
            return this.can_drop_card();
        }

        if (CardStackDragAction.in_progress()) {
            return this.can_drop_stack();
        }

        return false; // unforeseen future draggable
    }

    handle_stack_drop(): void {
        const source_location =
            CardStackDragAction.get_dragged_stack_location();
        const target_location = this.stack_location;
        EventManager.drop_stack_on_stack({
            source_location,
            target_location,
        });
    }

    handle_drop(): void {
        if (HandCardDragAction.in_progress()) {
            EventManager.merge_hand_card_to_board_stack(this.stack_location);
        }

        if (CardStackDragAction.in_progress()) {
            this.handle_stack_drop();
        }
    }

    enable_drop(): void {
        const self = this;
        const div = this.div;

        div.addEventListener("dragover", (e) => {
            if (self.accepts_drop()) {
                e.preventDefault();
            }
        });

        div.addEventListener("drop", () => {
            self.handle_drop();
        });
    }

    // DRAG **from** the stack

    handle_dragstart(e): void {
        const card_stack = this.stack;
        const stack_location = this.stack_location;
        const tray_width = this.get_stack_width();

        CardStackDragAction.start_drag_stack({
            card_stack,
            stack_location,
            tray_width,
        });
    }

    handle_dragend(): void {
        CardStackDragAction.end_drag_stack();
    }

    allow_dragging() {
        const self = this;
        const div = this.div;

        div.draggable = true;
        div.style.userSelect = undefined;

        div.addEventListener("dragstart", (e) => {
            self.handle_dragstart(e);
        });

        div.addEventListener("dragend", () => {
            self.handle_dragend();
        });
    }
}

function create_shelf_is_clean_or_not_emoji(shelf: Shelf): HTMLElement {
    const emoji = document.createElement("span");
    emoji.style.marginBottom = "5px";

    if (shelf.is_clean()) {
        emoji.innerText = "\u2705"; // green checkmark
    } else {
        emoji.innerText = "\u274C"; // red crossmark
    }

    return emoji;
}

class PhysicalEmptyShelfSpot {
    shelf_idx: number;
    div: HTMLElement;

    constructor(shelf_idx: number) {
        this.shelf_idx = shelf_idx;
        this.div = render_empty_shelf_spot();
        this.enable_drop();
    }

    hide() {
        this.div.style.display = "none";
    }

    show(tray_width: number) {
        this.div.style.display = "block";
        this.div.style.width = tray_width + "px";
    }

    dom() {
        this.hide();
        return this.div;
    }

    accepts_drop(): boolean {
        if (HandCardDragAction.in_progress()) {
            return true;
        }

        if (CardStackDragAction.in_progress()) {
            return true;
        }

        return false; // unknown "future" draggable
    }

    handle_drop(): void {
        const shelf_index = this.shelf_idx;

        if (HandCardDragAction.in_progress()) {
            EventManager.move_card_from_hand_to_board();
        } else {
            EventManager.move_dragged_card_stack_to_end_of_shelf(shelf_index);
        }
    }

    enable_drop(): void {
        const self = this;
        const div = this.div;

        div.addEventListener("dragover", (e) => {
            if (self.accepts_drop()) {
                e.preventDefault();
            }
        });

        div.addEventListener("drop", () => {
            self.handle_drop();
        });
    }
}

class PhysicalShelf {
    physical_board: PhysicalBoard;
    physical_card_stacks: PhysicalCardStack[];
    shelf_index: number;
    shelf: Shelf;
    div: HTMLElement;
    physical_shelf_empty_spot: PhysicalEmptyShelfSpot;

    constructor(info: {
        physical_board: PhysicalBoard;
        shelf_index: number;
        shelf: Shelf;
    }) {
        this.physical_board = info.physical_board;
        this.shelf_index = info.shelf_index;
        this.shelf = info.shelf;
        this.div = render_shelf();
        this.physical_card_stacks = [];
        this.physical_shelf_empty_spot = new PhysicalEmptyShelfSpot(
            this.shelf_index,
        );
    }

    dom(): HTMLElement {
        this.populate();
        return this.div;
    }

    show_empty_spot(tray_width: number) {
        this.physical_shelf_empty_spot.show(tray_width);
    }

    hide_empty_spot() {
        this.physical_shelf_empty_spot.hide();
    }

    hide_mergeable_stacks() {
        this.physical_card_stacks.forEach((stack) => stack.hide_as_mergeable());
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
        div.append(this.physical_shelf_empty_spot.dom());
    }

    build_physical_card_stacks(): PhysicalCardStack[] {
        const physical_board = this.physical_board;
        const shelf_index = this.shelf_index;
        const card_stacks = this.shelf.card_stacks;

        const physical_card_stacks: PhysicalCardStack[] = [];

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
                physical_board,
                stack_location,
                card_stack,
            );

            physical_card_stack.set_up_clicks_handlers_for_cards();
            physical_card_stacks.push(physical_card_stack);
        }

        return physical_card_stacks;
    }

    split_card_from_stack(info: {
        stack_index: number;
        card_index: number;
    }): void {
        this.shelf.split_card_from_stack(info);
        this.populate();
    }

    add_singleton_card(hand_card: HandCard) {
        this.shelf.add_singleton_card(hand_card);
        this.populate();
    }
}

class PhysicalBoard {
    physical_game: PhysicalGame;
    div: HTMLElement;
    physical_shelves: PhysicalShelf[];

    constructor(physical_game: PhysicalGame) {
        this.physical_game = physical_game;
        this.div = this.make_div();
        this.physical_shelves = this.build_physical_shelves();
        UndoButton = new UndoButtonSingleton();

        CardStackDragAction = new CardStackDragActionSingleton(
            this,
            physical_game.game,
        );
    }

    build_physical_shelves(): PhysicalShelf[] {
        const physical_board = this;
        const physical_shelves: PhysicalShelf[] = [];
        const shelves = CurrentBoard.shelves;

        for (let shelf_index = 0; shelf_index < shelves.length; ++shelf_index) {
            const shelf = shelves[shelf_index];
            const physical_shelf = new PhysicalShelf({
                physical_board,
                shelf_index,
                shelf,
            });
            physical_shelves.push(physical_shelf);
        }

        return physical_shelves;
    }

    top_physical_shelf(): PhysicalShelf {
        return this.physical_shelves[0];
    }

    get_physical_card_stacks(): PhysicalCardStack[] {
        const result = [];

        for (const physical_shelf of this.physical_shelves) {
            for (const physical_card_stack of physical_shelf.physical_card_stacks) {
                result.push(physical_card_stack);
            }
        }

        return result;
    }

    display_mergeable_stacks_for(card_stack: CardStack): void {
        for (const physical_card_stack of this.get_physical_card_stacks()) {
            physical_card_stack.maybe_show_as_mergeable(card_stack);
        }
    }

    display_mergeable_stacks_for_card(hand_card: HandCard): void {
        const card_stack = CardStack.from_hand_card(hand_card);

        this.display_mergeable_stacks_for(card_stack);
    }

    get_physical_shelves_for_stack_drag(
        stack_location: StackLocation,
    ): PhysicalShelf[] {
        const result: PhysicalShelf[] = [];

        const stack_shelf_idx = stack_location.shelf_index;

        for (let i = 0; i < this.physical_shelves.length; i++) {
            const physical_shelf = this.physical_shelves[i];

            if (i !== stack_shelf_idx) {
                // We can always push to OTHER shelves.
                result.push(physical_shelf);
            } else {
                // We can push to our own shelf as long as we're
                // not the last stack
                if (!physical_shelf.shelf.is_last_stack(stack_location)) {
                    result.push(physical_shelf);
                }
            }
        }
        return result;
    }

    display_empty_shelf_spots(
        physical_shelves: PhysicalShelf[],
        tray_width: number,
    ): void {
        for (const physical_shelf of physical_shelves) {
            physical_shelf.show_empty_spot(tray_width);
        }
    }

    hide_empty_spots(): void {
        for (const physical_shelf of this.physical_shelves) {
            physical_shelf.hide_empty_spot();
        }
    }

    hide_mergeable_stacks(): void {
        for (const physical_shelf of this.physical_shelves) {
            physical_shelf.hide_mergeable_stacks();
        }
    }

    extend_stack_with_card(
        stack_location: StackLocation,
        hand_card: HandCard,
    ): void {
        const shelf_index = stack_location.shelf_index;
        const stack_index = stack_location.stack_index;
        const shelf = CurrentBoard.shelves[shelf_index];

        const longer_stack = shelf.extend_stack_with_card(
            stack_index,
            hand_card,
        );

        if (longer_stack.board_cards.length >= 3) {
            SoundEffects.play_ding_sound();
        }
        this.populate_shelf(shelf_index);
        this.hide_mergeable_stacks();
    }

    populate_shelf(shelf_index: number): void {
        this.physical_shelves[shelf_index].populate();
    }

    // ACTION
    split_card_from_stack(card_location: ShelfCardLocation) {
        const { shelf_index, stack_index, card_index } = card_location;

        const shelf = this.physical_shelves[shelf_index];

        // Right now the only action when you click on a shelf card
        // is to split it from the reset of the stack.
        shelf.split_card_from_stack({
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
        this.div.innerHTML = "";
        const physical_shelves = this.physical_shelves;

        const heading = document.createElement("h3");
        heading.innerText = "Board";
        heading.style.color = heading_color();

        div.append(heading);
        for (const physical_shelf of physical_shelves) {
            div.append(physical_shelf.dom());
        }

        div.append(UndoButton.dom());
    }

    add_card_to_top_shelf(hand_card: HandCard): void {
        this.physical_shelves[0].add_singleton_card(hand_card);
    }
}

function row_of_cards_in_hand(hand_cards: HandCard[]): HTMLElement {
    /*
        This can be a pure function, because even though
        users can mutate our row (by clicking a card to put it
        out to the board), we don't ever have to re-draw
        ourself.  We just let PhysicalHand re-populate the
        entire hand, since the hand is usually super small.
    */
    const card_spans = [];

    for (const hand_card of hand_cards) {
        const physical_hand_card = new PhysicalHandCard(hand_card);
        const span = physical_hand_card.dom();
        card_spans.push(span);
    }

    return render_hand_card_row(card_spans);
}

class PhysicalHand {
    hand: Hand;
    div: HTMLElement;

    constructor(hand: Hand) {
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
        const div = this.div;
        const hand_cards = this.hand.hand_cards;
        div.innerHTML = "";

        for (const suit of all_suits) {
            const suit_cards = get_sorted_cards_for_suit(suit, hand_cards);

            if (suit_cards.length > 0) {
                const row = row_of_cards_in_hand(suit_cards);
                div.append(row);
            }
        }
    }

    remove_card_from_hand(hand_card: HandCard) {
        this.hand.remove_card_from_hand(hand_card);
        this.populate();
    }
}

class PhysicalPlayer {
    physical_game: PhysicalGame;
    player: Player;
    physical_hand: PhysicalHand;
    complete_turn_button: CompleteTurnButton;
    div: HTMLElement;

    constructor(physical_game: PhysicalGame, player: Player) {
        this.physical_game = physical_game;
        this.player = player;
        this.physical_hand = new PhysicalHand(player.hand);
        this.complete_turn_button = new CompleteTurnButton(physical_game);
        this.div = document.createElement("div");
        this.div.style.minWidth = "200px";
    }

    dom(): HTMLElement {
        return this.div;
    }

    card_count(): HTMLElement {
        const div = document.createElement("div");

        const count = this.player.hand.size();

        div.innerText = `${count} cards`;
        return div;
    }

    populate() {
        const player = this.player;
        const div = this.div;
        div.innerHTML = "";

        const h3 = document.createElement("h3");
        h3.innerText = player.name;
        h3.style.color = heading_color();

        div.append(h3);

        if (this.player.active) {
            div.append(this.physical_hand.dom());
            div.append(this.complete_turn_button.dom());
        } else {
            div.append(this.card_count());
        }
    }
}

let CardStackDragAction: CardStackDragActionSingleton;

class CardStackDragActionSingleton {
    physical_board: PhysicalBoard;
    game: Game;
    dragged_stack_location: StackLocation | undefined;

    constructor(physical_board: PhysicalBoard, game: Game) {
        this.physical_board = physical_board;
        this.game = game;
        this.dragged_stack_location = undefined;
    }

    in_progress(): boolean {
        return this.dragged_stack_location !== undefined;
    }

    get_dragged_stack_location(): StackLocation {
        return this.dragged_stack_location;
    }

    start_drag_stack(info: {
        card_stack: CardStack;
        stack_location: StackLocation;
        tray_width: number;
    }): void {
        const { card_stack, stack_location, tray_width } = info;

        const physical_board = this.physical_board;

        this.dragged_stack_location = stack_location;

        physical_board.display_mergeable_stacks_for(card_stack);

        const physical_shelves =
            physical_board.get_physical_shelves_for_stack_drag(stack_location);
        physical_board.display_empty_shelf_spots(physical_shelves, tray_width);
    }

    end_drag_stack(): void {
        const physical_board = this.physical_board;

        physical_board.hide_mergeable_stacks();
        physical_board.hide_empty_spots();
        this.dragged_stack_location = undefined;
    }

    // ACTION
    move_dragged_card_stack_to_end_of_shelf(new_shelf_index: number) {
        const game = this.game;
        const physical_board = this.physical_board;

        const stack_location = this.dragged_stack_location!;

        CurrentBoard.move_card_stack_to_end_of_shelf(
            stack_location,
            new_shelf_index,
        );

        physical_board.populate_shelf(stack_location.shelf_index);
        physical_board.populate_shelf(new_shelf_index);
    }

    // ACTION
    drop_stack_on_stack(info: {
        source_location: StackLocation;
        target_location: StackLocation;
    }): void {
        const { source_location, target_location } = info;

        const physical_board = this.physical_board;
        const game = this.game;

        const merged_stack = CurrentBoard.merge_card_stacks({
            source: source_location,
            target: target_location,
        });

        if (merged_stack === undefined) {
            console.log("unexpected merged failure!");
            return;
        }

        if (merged_stack.board_cards.length >= 3) {
            SoundEffects.play_ding_sound();
        }

        physical_board.populate_shelf(source_location.shelf_index);
        physical_board.populate_shelf(target_location.shelf_index);
    }
}

let HandCardDragAction: HandCardDragActionSingleton;

class HandCardDragActionSingleton {
    physical_game: PhysicalGame;
    physical_board: PhysicalBoard;
    game: Game;
    dragged_hand_card: HandCard;

    constructor(
        physical_game: PhysicalGame,
        physical_board: PhysicalBoard,
        game: Game,
    ) {
        this.physical_game = physical_game;
        this.physical_board = physical_board;
        this.game = game;
        this.dragged_hand_card = undefined;
    }

    in_progress(): boolean {
        return this.dragged_hand_card !== undefined;
    }

    get_card(): HandCard {
        return this.dragged_hand_card!;
    }

    start_drag_hand_card(info: {
        hand_card: HandCard;
        tray_width: number;
    }): void {
        const { hand_card, tray_width } = info;
        const physical_board = this.physical_board;
        const top_physical_shelf = physical_board.top_physical_shelf();

        physical_board.display_mergeable_stacks_for_card(hand_card);
        physical_board.display_empty_shelf_spots(
            [top_physical_shelf],
            tray_width,
        );

        this.dragged_hand_card = hand_card;
    }

    end_drag_hand_card(): void {
        this.dragged_hand_card = undefined;
        this.physical_board.hide_mergeable_stacks();
        this.physical_board.hide_empty_spots();
    }

    get_physical_hand(): PhysicalHand {
        return this.physical_game.get_physical_hand();
    }

    // ACTION
    merge_hand_card_to_board_stack(stack_location: StackLocation): void {
        const hand_card = this.dragged_hand_card;
        const physical_hand = this.get_physical_hand();
        const physical_board = this.physical_board;

        physical_board.extend_stack_with_card(stack_location, hand_card);
        physical_hand.remove_card_from_hand(hand_card);
    }

    // ACTION
    move_card_from_hand_to_board(): void {
        const hand_card = this.dragged_hand_card;
        const physical_board = this.physical_board;
        const physical_hand = this.get_physical_hand();

        physical_hand.remove_card_from_hand(hand_card);
        physical_board.add_card_to_top_shelf(hand_card);

        // no need to call maybe_update_snapshot() here
    }
}

let EventManager: EventManagerSingleton;

class EventManagerSingleton {
    physical_game: PhysicalGame;
    physical_board: PhysicalBoard;
    game: Game;

    constructor(physical_game: PhysicalGame) {
        this.physical_game = physical_game;
        this.physical_board = physical_game.physical_board;
        this.game = physical_game.game;
    }

    show_score(): void {
        // TODO: better hooks to show score
        console.log("EVENT SCORE!", ActivePlayer.get_turn_score());
    }

    // Undo mistakes

    undo_mistakes(): void {
        this.physical_game.rollback_moves_to_last_clean_state();
        StatusBar.update_text("PHEW!");
        UndoButton.update_visibility();
    }

    // SPLITTING UP STACKS
    split_card_from_stack(card_location: ShelfCardLocation): void {
        this.physical_board.split_card_from_stack(card_location);
        StatusBar.update_text(
            "Split! Moves like this can be tricky, even for experts. You have the undo button if you need it.",
        );
        UndoButton.update_visibility();
    }

    // MOVING TO EMPTY SPOTS
    move_card_from_hand_to_board(): void {
        HandCardDragAction.move_card_from_hand_to_board();
        StatusBar.update_text(
            "You moved a card to the board! Do you have a plan? (You can click on other cards to break them out of stacks.)",
        );
        UndoButton.update_visibility();
    }

    move_dragged_card_stack_to_end_of_shelf(new_shelf_index: number): void {
        CardStackDragAction.move_dragged_card_stack_to_end_of_shelf(
            new_shelf_index,
        );
        StatusBar.update_text(
            "Organizing the board is a key part of the game!",
        );

        this.game.maybe_update_snapshot();
    }

    // SCORING MOVES

    merge_hand_card_to_board_stack(stack_location: StackLocation): void {
        HandCardDragAction.merge_hand_card_to_board_stack(stack_location);
        StatusBar.update_text("Merged right from the hand to the board!");
        this.game.maybe_update_snapshot();
        this.show_score();

        UndoButton.update_visibility();
    }

    drop_stack_on_stack(info: {
        source_location: StackLocation;
        target_location: StackLocation;
    }): void {
        CardStackDragAction.drop_stack_on_stack(info);
        StatusBar.update_text("Combined!");
        this.game.maybe_update_snapshot();
        this.show_score();

        UndoButton.update_visibility();
    }
}

class PhysicalGame {
    game: Game;
    player_area: HTMLElement;
    board_area: HTMLElement;
    physical_players: PhysicalPlayer[];
    physical_board: PhysicalBoard;

    constructor(info: { player_area: HTMLElement; board_area: HTMLElement }) {
        const physical_game = this;
        this.game = new Game();
        this.player_area = info.player_area;
        this.board_area = info.board_area;
        this.build_physical_game();
        StatusBar.update_text(
            "Begin game. You can drag and drop hand cards or board piles to piles or empty spaces on the board.",
        );
    }

    // ACTION
    rollback_moves_to_last_clean_state() {
        this.game.rollback_moves_to_last_clean_state();
        this.build_physical_game();

        // Re-render
        this.populate_board_area();
    }

    build_physical_game(): void {
        const physical_game = this;

        this.physical_board = new PhysicalBoard(physical_game);
        this.physical_players = this.game.players.map(
            (player) => new PhysicalPlayer(physical_game, player),
        );
        this.populate_player_area();

        HandCardDragAction = new HandCardDragActionSingleton(
            physical_game,
            this.physical_board,
            this.game,
        );

        EventManager = new EventManagerSingleton(physical_game);
    }

    current_physical_player() {
        return this.physical_players[this.game.current_player_index];
    }

    get_physical_hand(): PhysicalHand {
        return this.current_physical_player().physical_hand;
    }

    // ACTION
    complete_turn() {
        const game = this.game;

        const turn_result = game.complete_turn();

        switch (turn_result) {
            case CompleteTurnResult.FAILURE:
                SoundEffects.play_purr_sound();
                Popup.getInstance().show({
                    content:
                        "The board is not clean! (nor is my litter box)\n Try\
                        using the 'Undo mistakes' button to get back to the previous clean state.",
                    required_action_string: "Oy vey, ok",
                    type: "warning",
                    avatar: PopupAvatar.ANGRY_CAT,
                });
                return;
            case CompleteTurnResult.SUCCESS_BUT_NEEDS_CARDS:
                SoundEffects.play_purr_sound();
                Popup.getInstance().show({
                    content:
                        "You didn't make any progress at all.\
                        \n I'm going back to my nap!\
                        \nYou will get 3 new cards on your next hand.",
                    type: "warning",
                    required_action_string: "Meh",
                    avatar: PopupAvatar.OLIVER,
                });
                break;
            case CompleteTurnResult.SUCCESS:
                SoundEffects.play_bark_sound();
                const turn_score = ActivePlayer.get_turn_score();
                Popup.getInstance().show({
                    content: `You did well! I am rewarding you with ${turn_score} points for this turn!\
                         \nLet's see how your opponent (you again, maybe?) does!`,
                    type: "warning",
                    required_action_string: "See if they can try!",
                    avatar: PopupAvatar.STEVE,
                });
                break;
        }

        CurrentBoard.age_cards();
        game.advance_turn_to_next_player();
        ActivePlayer.start_turn();

        game.update_snapshot();

        this.populate_player_area();
        this.populate_board_area();
    }

    populate_player_area() {
        this.player_area.innerHTML = "";
        for (const physical_player of this.physical_players) {
            physical_player.populate();
            this.player_area.append(physical_player.dom());
        }
    }

    populate_board_area() {
        this.board_area.innerHTML = "";
        this.board_area.append(this.physical_board.dom());
    }

    start() {
        this.populate_player_area();
        // populate common area
        this.populate_board_area();
    }
}

class CompleteTurnButton {
    button: HTMLElement;

    constructor(physical_game: PhysicalGame) {
        const button = render_complete_turn_button();
        button.addEventListener("click", () => {
            physical_game.complete_turn();
        });
        this.button = button;
    }

    dom(): HTMLElement {
        return this.button;
    }
}

let UndoButton: UndoButtonSingleton;

class UndoButtonSingleton {
    button: HTMLElement;

    constructor() {
        const button = render_undo_button();
        button.addEventListener("click", () => {
            EventManager.undo_mistakes();
        });
        this.button = button;
        this.button.hidden = true;
    }

    dom(): HTMLElement {
        return this.button;
    }

    update_visibility(): void {
        if (CurrentBoard.is_clean()) {
            this.button.hidden = true;
        } else {
            this.button.hidden = false;
        }
    }
}

type PopupType = "warning" | "success" | "info";
enum PopupAvatar {
    STEVE,
    OLIVER,
    ANGRY_CAT,
    CAT_PROFESSOR,
}

type PopupOptions = {
    content: string;
    type: PopupType;
    required_action_string?: string;
    avatar: PopupAvatar;
};

class Popup {
    static instance: Popup;
    popup_element: HTMLDialogElement;
    private constructor() {
        this.popup_element = this.create_popup_element();
        document.body.appendChild(this.popup_element);
    }

    static getInstance() {
        if (!Popup.instance) {
            Popup.instance = new Popup();
        }
        return Popup.instance;
    }

    create_popup_element() {
        // See https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog
        const dialog = document.createElement("dialog");
        const s = dialog.style;
        s.maxWidth = "50vw";
        s.borderRadius = "1rem";
        s.outline = "none";
        s.border = "1px #000080 solid";
        s.display = "flex";
        s.flexDirection = "column";
        s.gap = "0.5rem";
        s.alignItems = "center";
        dialog.addEventListener("close", () => this.remove_and_cleanup());
        return dialog;
    }

    avatar_img(avatar) {
        const img = document.createElement("img");
        img.style.width = "4rem";
        img.style.height = "4rem";
        switch (avatar) {
            case PopupAvatar.STEVE:
                img.src = "images/steve.png";
                break;
            case PopupAvatar.CAT_PROFESSOR:
                img.src = "images/cat_professor.webp";
                break;
            case PopupAvatar.ANGRY_CAT:
                img.src = "images/angry_cat.png";
                break;
            case PopupAvatar.OLIVER:
                img.src = "images/oliver.png";
                break;
        }
        return img;
    }

    show(info: PopupOptions) {
        document.body.append(this.popup_element);

        switch (info.type) {
            case "info":
                this.popup_element.style.backgroundColor = "#ADD8E6";
                break;
            case "success":
                this.popup_element.style.backgroundColor = "lightgreen";
                break;
            case "warning":
                this.popup_element.style.backgroundColor = "#FFFFE0";
                break;
        }

        const flex_div = document.createElement("div");
        flex_div.style.display = "flex";

        const left = document.createElement("div");
        left.style.marginRight = "30px";

        const right = document.createElement("div");

        flex_div.append(left);
        flex_div.append(right);

        const img = this.avatar_img(info.avatar);
        left.append(img);

        const content_div = document.createElement("div");
        content_div.innerText = info.content;
        right.append(content_div);

        if (info.required_action_string) {
            // Ensures it is closed by nothing apart from what we define
            this.popup_element.setAttribute("closedby", "none");
            const button = document.createElement("button");
            button.style.maxWidth = "fit-content";
            button.style.padding = "5px";
            button.style.marginTop = "15px";
            button.style.backgroundColor = "#000080";
            button.style.color = "white";

            button.innerText = info.required_action_string;
            button.addEventListener("click", () => this.remove_and_cleanup());
            right.append(button);
        }

        this.popup_element.append(flex_div);

        this.popup_element.showModal();
    }

    remove_and_cleanup() {
        this.popup_element.close();
        this.popup_element.innerHTML = "";
        this.popup_element.remove();
        this.popup_element.setAttribute("closedby", "any");
    }
}

/***********************************************

EXAMPLE SYSTEM vvvv

***********************************************/

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
    const div = document.createElement("div");

    for (const card of stack.get_cards()) {
        div.append(render_playing_card(card));
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

        const heading_div = document.createElement("div");
        heading_div.style.display = "flex";
        heading_div.style.alignItems = "center";

        const cat = document.createElement("img");
        cat.src = "images/cat_professor.webp";
        cat.style.height = "38px";
        cat.style.marginLeft = "10px";

        const heading = document.createElement("div");
        heading.innerText = "Learning time!";
        heading.style.color = "blue";
        heading.style.fontSize = "38px";
        heading.style.marginLeft = "40px";
        heading.style.marginRight = "40px";

        const button = document.createElement("button");
        button.innerText = "Got it!";
        button.style.height = "30px";
        button.style.width = "100px";
        button.style.backgroundColor = "blue";
        button.style.color = "white";

        heading_div.append(cat);
        heading_div.append(heading);
        heading_div.append(button);

        const panel = document.createElement("div");
        panel.style.display = "flex";
        panel.style.justifyContent = "space-around";
        panel.style.border = "1px blue solid";
        panel.style.padding = "30px";
        panel.style.margin = "10px";

        const good_column = document.createElement("div");
        const bad_column = document.createElement("div");

        good_column.style.borderRight = "1px gray solid";

        good_column.style.paddingLeft = "10px";
        good_column.style.paddingRight = "35px";
        bad_column.style.paddingLeft = "35px";
        bad_column.style.paddingRight = "10px";

        const good_piles = document.createElement("div");
        good_piles.innerText = "RULE #1: Good piles are good!";
        good_piles.style.color = "green";
        good_piles.style.fontSize = "20px";
        good_piles.style.paddingBottom = "10px";
        good_piles.style.marginBottom = "10px";
        good_column.append(good_piles);

        const bad_piles = document.createElement("div");
        bad_piles.innerText = "RULE #2: Bad piles are bad!";
        bad_piles.style.color = "red";
        bad_piles.style.fontSize = "20px";
        bad_piles.style.paddingBottom = "10px";
        bad_piles.style.marginBottom = "10px";
        bad_column.append(bad_piles);

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
        div.append(heading_div);
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
    welcome_button.style.marginTop = "10px";
    welcome_button.style.marginBottom = "10px";
    welcome_button.style.fontSize = "28";
    welcome_button.style.width = "200px";
    welcome_button.innerText = "Begin Game!";
    return welcome_button;
}

class LandingPage {
    constructor() {
        const self = this;

        const page = document.createElement("div");
        page.style.display = "flex";
        page.style.justifyContent = "center";
        page.style.width = "100%";

        // Left panel

        const welcome_area = document.createElement("div");
        welcome_area.style.paddingRight = "30px";

        const welcome = document.createElement("div");
        welcome.innerText = "Welcome to Lyn Rummy!";
        welcome.style.color = "green";
        welcome.style.fontWeight = "bold";

        const welcome_button = create_welcome_button();
        welcome_button.addEventListener("click", () => {
            self.start_actual_game();
        });

        const cat_div = document.createElement("div");
        const cat_img = document.createElement("img");
        cat_img.src = "images/oliver.png";
        cat_img.style.width = "200px";
        cat_div.append(cat_img);

        welcome_area.append(welcome);
        welcome_area.append(welcome_button);
        welcome_area.append(cat_div);

        // RIGHT PANEL

        const examples_area = document.createElement("div");
        examples_area.style.borderLeft = "1px blue solid";
        examples_area.style.paddingLeft = "20px";

        const examples = new PhysicalExamples(examples_area);
        examples.start({
            on_dismiss_callback() {
                self.start_actual_game();
            },
        });

        // PUT EVERYTHING TOGETHER

        const left_panel = document.createElement("div");
        left_panel.append(welcome_area);

        const right_panel = document.createElement("div");
        right_panel.append(examples_area);

        page.append(left_panel);
        page.append(right_panel);
        document.body.append(page);
    }

    start_actual_game(): void {
        document.body.innerHTML = "";
        new MainGamePage();
    }
}

let StatusBar: StatusBarSingleton;

class StatusBarSingleton {
    div: HTMLElement;
    text_div: HTMLElement;

    constructor() {
        this.div = document.createElement("div");
        this.text_div = this.make_text_div();
        this.div.append(this.text_div);
    }

    make_text_div() {
        const text_div = document.createElement("div");
        text_div.style.fontSize = "12px";
        text_div.style.color = "blue";
        return text_div;
    }

    dom() {
        return this.div;
    }

    update_text(text: string) {
        this.text_div.innerText = text;
    }
}

class MainGamePage {
    player_area: HTMLElement;
    board_area: HTMLElement;

    constructor() {
        const page = document.createElement("div");
        page.style.display = "flex";
        page.style.justifyContent = "center";
        document.body.append(page);

        const div = document.createElement("div");
        div.append(this.make_top_line());
        div.append(this.make_bottom_area());
        page.append(div);

        this.start_game_components();
    }

    make_top_line(): HTMLElement {
        const top = document.createElement("div");

        const title_bar = this.make_title_bar();

        StatusBar = new StatusBarSingleton();

        top.append(title_bar);
        top.append(StatusBar.dom());
        return top;
    }

    make_title_bar(): HTMLElement {
        const title_bar = document.createElement("div");
        title_bar.style.backgroundColor = "#000080";
        title_bar.style.color = "white";
        title_bar.style.padding = "4px";
        title_bar.style.display = "flex";
        title_bar.style.justifyContent = "center";

        const title = document.createElement("div");
        title.innerText = "Welcome to Lyn Rummy! Have fun!";
        title.style.fontSize = "18";

        title_bar.append(title);
        return title_bar;
    }

    make_bottom_area(): HTMLElement {
        const bottom = document.createElement("div");
        bottom.style.display = "flex";
        const left_panel = this.make_left_panel();
        const right_panel = this.make_right_panel();
        bottom.append(left_panel);
        bottom.append(right_panel);
        return bottom;
    }

    make_left_panel(): HTMLElement {
        this.player_area = document.createElement("div");
        this.player_area.style.paddingRight = "20px";
        this.player_area.style.marginRight = "20px";
        this.player_area.style.borderRight = "1px gray solid";

        const left_panel = document.createElement("div");
        left_panel.append(this.player_area);
        return left_panel;
    }

    make_right_panel(): HTMLElement {
        this.board_area = document.createElement("div");
        const right_panel = document.createElement("div");
        right_panel.append(this.board_area);
        return right_panel;
    }

    start_game_components(): void {
        const player_area = this.player_area;
        const board_area = this.board_area;

        const physical_game = new PhysicalGame({
            player_area: player_area,
            board_area: board_area,
        });
        physical_game.start();

        const self = this;

        setTimeout(() => {
            self.show_professor();
        }, 100);
    }

    show_professor(): void {
        Popup.getInstance().show({
            content:
                "Welcome to Lyn Rummy! You can:\n\
                \n    1) Drag a card from your hand straight to a pile.\
                \n    2) Drag a card from your hand to the top shelf.\
                \n    3) Click on any board card to remove it from its pile.\
                \n    4) Organize the board by dragging piles to empty spots.\
                \n    5) Combine piles together to score more points.\
                \n\nGood luck, and have fun!",
            type: "info",
            required_action_string: "Thanks, Mr. Professor!",
            avatar: PopupAvatar.CAT_PROFESSOR,
        });
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

function test() {
    console.log("TRY IN GUI!");
}

test(); // runs in node

class SoundEffectsSingleton {
    purr: HTMLAudioElement;
    bark: HTMLAudioElement;
    ding: HTMLAudioElement;

    constructor() {
        // It might be overkill to pre-load these, but I can't
        // see how it hurts either.
        this.ding = document.createElement("audio");
        this.purr = document.createElement("audio");
        this.bark = document.createElement("audio");
        this.ding.src = "ding.mp3";
        this.purr.src = "purr.mp3";
        this.bark.src = "bark.mp3";
    }

    play_ding_sound() {
        this.ding.play();
    }
    play_purr_sound() {
        this.purr.play();
    }
    play_bark_sound() {
        this.bark.play();
    }
}

// SINGLETONS get initialized in gui().
let SoundEffects: SoundEffectsSingleton;

// This is the entry point for static/index.html
function gui() {
    SoundEffects = new SoundEffectsSingleton();
    new LandingPage();
}
