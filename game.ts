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

enum CardState {
    IN_DECK,
    STILL_IN_HAND,
    FIRMLY_ON_BOARD,
    FRESHLY_DRAWN,
    FRESHLY_PLAYED,
    FRESHLY_PLAYED_BY_LAST_PLAYER,
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

function state_str(state: CardState) {
    return state.toString();
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

function get_sorted_cards_for_suit(suit: Suit, cards: Card[]): Card[] {
    const suit_cards: Card[] = [];
    for (const card of cards) {
        if (card.suit === suit) {
            suit_cards.push(card);
        }
    }
    suit_cards.sort((card1, card2) => card1.value - card2.value);
    return suit_cards;
}

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
        return value_str(this.value) + suit_emoji_str(this.suit);
    }

    // Example:
    // serialized string "3S01" would be:
    // 3(value) of Spades(suit), IN_DECK(state), from deck 2 (origin_deck)
    serialize(): string {
        return (
            value_str(this.value) +
            suit_str(this.suit) +
            state_str(this.state) +
            deck_str(this.origin_deck)
        );
    }

    static deserialize(card_str: string): Card {
        const origin_deck = Number.parseInt(card_str.at(-1)!);
        const state = Number.parseInt(card_str.at(-2)!);
        const suit = suit_for(card_str.at(-3)!);
        // In case the value is something like: 10C10
        const substring_len = card_str.length === 5 ? 2 : 1;
        const val_str = card_str.substring(0, substring_len);
        let value: number;
        if (["J", "Q", "K", "A"].includes(val_str)) {
            value = value_for(val_str);
        } else {
            value = Number.parseInt(val_str);
        }
        return new Card(value, suit, state, origin_deck);
    }

    equals(other_card: Card): boolean {
        return (
            this.value === other_card.value &&
            this.suit === other_card.suit &&
            this.origin_deck === other_card.origin_deck
        );
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

    serialize(): string {
        return this.cards.map((card) => card.serialize()).join(",");
    }

    static deserialize(card_stack_str: string): CardStack {
        return new CardStack(
            card_stack_str
                .split(",")
                .map((card_str) => Card.deserialize(card_str)),
        );
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

    is_mergeable_with_card(card: Card): boolean {
        return this.is_mergeable_with(new CardStack([card]));
    }

    static merge(s1: CardStack, s2: CardStack): CardStack | undefined {
        const stack1 = new CardStack([...s1.cards, ...s2.cards]);
        if (!stack1.problematic()) {
            return stack1;
        }
        const stack2 = new CardStack([...s2.cards, ...s1.cards]);
        if (!stack2.problematic()) {
            return stack2;
        }
        return undefined;
    }

    static from_stack_and_card(
        stack: CardStack,
        card: Card,
    ): CardStack | undefined {
        return CardStack.merge(stack, new CardStack([card]));
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

    is_last_stack(stack_location: StackLocation): boolean {
        return this.card_stacks.length - 1 === stack_location.stack_index;
    }

    serialize(): string {
        const card_stacks = this.card_stacks;

        return card_stacks
            .map((card_stack) => card_stack.serialize())
            .join(" | ");
    }

    static deserialize(shelf_str: string): Shelf {
        if (shelf_str === "") {
            return new Shelf([]);
        }
        const card_stack_strs = shelf_str.split(" | ");
        const card_stacks = card_stack_strs.map((card_stack_str) =>
            CardStack.deserialize(card_stack_str),
        );
        return new Shelf(card_stacks);
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

    extend_stack_with_card(stack_index: number, card: Card): CardStack {
        const card_stacks = this.card_stacks;
        const card_stack = this.card_stacks[stack_index];
        const longer_stack = CardStack.from_stack_and_card(card_stack, card);

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
        const cards = card_stack.cards;

        const new_card_arrays = [
            cards.slice(0, card_index),
            [cards[card_index]],
            cards.slice(card_index + 1),
        ].filter((arr) => arr.length > 0);

        const new_card_stacks = new_card_arrays.map(
            (arr) => new CardStack(arr),
        );

        card_stacks.splice(stack_index, 1, ...new_card_stacks);
        console.log(card_stacks.map((cs) => cs.str()));
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

    str(): string {
        return this.shelves.map((shelf) => shelf.str()).join("\n");
    }

    serialize(): string {
        return this.shelves.map((shelf) => shelf.serialize()).join("\n");
    }

    static deserialize(serialized_board: string): Board {
        console.log("restore board");
        const shelves = serialized_board.split("\n").map((serialized_shelf) => {
            return Shelf.deserialize(serialized_shelf);
        });
        return new Board(shelves);
    }

    is_clean(): boolean {
        return this.shelves.every((shelf) => shelf.is_clean());
    }

    get_cards(): Card[] {
        const shelves = this.shelves;

        const result: Card[] = [];
        for (const shelf of shelves) {
            for (const card_stack of shelf.card_stacks) {
                for (const card of card_stack.cards) {
                    result.push(card);
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

class Hand {
    cards: Card[];

    constructor() {
        this.cards = [];
    }

    add_cards(cards: Card[]): void {
        this.cards = this.cards.concat(cards);
    }

    serialize(): string {
        return this.cards.map((card) => card.serialize()).join(",");
    }

    deserialize(serialized_hand: string): void {
        const cards = serialized_hand.split(",").map((serialized_card) => {
            return Card.deserialize(serialized_card);
        });
        this.cards = cards;
    }

    remove_card_from_hand(card: Card): void {
        const cards = this.cards;
        remove_card_from_array(cards, card);
    }

    // This is called after the player's turn ends.
    age_cards(): void {
        this.cards.forEach((card) => {
            card.state = CardState.STILL_IN_HAND;
        });
    }
}

class Player {
    name: string;
    hand: Hand;

    constructor(info: { name: string; hand?: Hand }) {
        this.name = info.name;
        this.hand = info.hand ?? new Hand();
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

class Game {
    players: Player[];
    deck: Deck;
    board: Board;
    current_player_index: number;
    // The first snapshot will be initialized after `deal_cards`.
    // We will then update the snapshot at any point the board is in a clean state.
    snapshot: string;

    constructor() {
        this.players = [
            new Player({ name: "Player One" }),
            new Player({ name: "Player Two" }),
        ];
        this.deck = new Deck();
        this.board = initial_board();

        // remove initial cards from deck
        for (const card of this.board.get_cards()) {
            this.deck.pull_card_from_deck(card);
        }

        this.deal_cards();
        this.current_player_index = 0;

        // This initializes the snapshot for the first turn.
        this.update_snapshot();
    }

    update_snapshot(): void {
        this.snapshot = JSON.stringify({
            hand: this.current_hand().serialize(),
            board: this.board.serialize(),
        });
    }

    // We update the snapshot if the board is in a clean state after making
    // some move.
    maybe_update_snapshot() {
        if (this.board.is_clean()) {
            this.update_snapshot();
        }
    }

    rollback_moves_to_last_clean_state(): void {
        const game_data = JSON.parse(this.snapshot);
        this.current_hand().deserialize(game_data.hand);
        this.board = Board.deserialize(game_data.board);
    }

    current_player(): Player {
        // TODO: Use this in more places.
        return this.players[this.current_player_index];
    }

    deal_cards() {
        for (const player of this.players) {
            const cards = this.deck.take_from_top(15);
            player.hand.add_cards(cards);
        }
    }

    can_get_new_cards(): boolean {
        const did_place_new_cards_on_board = this.board
            .get_cards()
            .some((card) => card.state === CardState.FRESHLY_PLAYED);
        return !did_place_new_cards_on_board;
    }

    can_finish_turn(): boolean {
        return this.board.is_clean();
    }

    current_hand(): Hand {
        return this.current_player().hand;
    }

    draw_new_cards(cnt: number): void {
        const cards = this.deck.take_from_top(cnt);

        for (const card of cards) {
            card.state = CardState.FRESHLY_DRAWN;
        }
        this.current_hand().add_cards(cards);
    }

    complete_turn(): boolean {
        if (!this.can_finish_turn()) return false;

        this.current_hand().age_cards();

        if (this.can_get_new_cards()) {
            this.draw_new_cards(3);
            alert("You will get 3 new cards on your next hand.");
        }

        this.current_player_index =
            (this.current_player_index + 1) % this.players.length;

        // The freshly played cards by the last player are highlighted
        // to let the new turn owner know what was done in the previous turn.
        this.board.get_cards().forEach((card) => {
            if (card.state === CardState.FRESHLY_PLAYED) {
                card.state = CardState.FRESHLY_PLAYED_BY_LAST_PLAYER;
            }
        });

        this.update_snapshot();

        return true;
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

function example_board() {
    return new Board([
        Shelf.from("AC", OriginDeck.DECK_ONE),
        Shelf.from("AH | 2C | 5S,6S,7S | 4D | 8S,9S | 6C", OriginDeck.DECK_ONE),
    ]);
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
    button.style.backgroundColor = "#007bff";
    button.style.color = "white";
    button.style.marginRight = "5px";
    button.innerText = "Complete turn";
    return button;
}

function render_undo_button(): HTMLElement {
    const button = document.createElement("button");
    button.classList.add("button", "reset-button");
    button.style.backgroundColor = "#007bff";
    button.style.color = "white";
    button.innerText = "Undo mistakes";
    return button;
}

/***********************************************

    TRY TO KEEP PURE DRAWING CODE ABOVE ^^^^^

    TRY TO KEEP OTHER UI CODE BELOW vvvvv

***********************************************/

type ClickHandler = (e: MouseEvent) => void;

class PhysicalCard {
    card: Card;
    span: HTMLElement;

    constructor(card: Card) {
        this.card = card;
        const span = render_playing_card(card);
        this.span = span;

        this.update_state_styles();
    }

    dom(): HTMLElement {
        return this.span;
    }

    update_state_styles(): void {
        const span = this.span;

        if (
            this.card.state === CardState.FRESHLY_DRAWN ||
            this.card.state === CardState.FRESHLY_PLAYED ||
            this.card.state === CardState.FRESHLY_PLAYED_BY_LAST_PLAYER
        ) {
            span.style.backgroundColor = new_card_color();
        } else {
            span.style.backgroundColor = "transparent";
        }
    }
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
        const deck = this.deck;
        if (this.div.innerHTML === "") {
            const img = document.createElement("img");
            img.src = "images/deck.png";
            img.style.height = "200px";
            this.div.append(img);

            const span = document.createElement("span");
            span.innerText = `${deck.cards.length} in deck`;
            this.div.append(span);
        }
        const span = this.div.querySelector("span")!;
        span.innerText = `${deck.cards.length} in deck`;
    }
}

function new_card_color(): string {
    // kind of a pale yellow
    return "rgba(255, 255, 0, 0.4)";
}

class PhysicalHandCard {
    card: Card;
    card_div: HTMLElement;
    physical_card: PhysicalCard;
    physical_game: PhysicalGame;

    constructor(physical_game: PhysicalGame, physical_card: PhysicalCard) {
        this.physical_game = physical_game;
        this.physical_card = physical_card;
        this.card_div = this.physical_card.dom();
        this.card = physical_card.card;
        this.allow_dragging();
    }

    dom() {
        return this.card_div;
    }

    get_width() {
        return this.card_div.clientWidth;
    }

    handle_dragstart(e): void {
        const physical_game = this.physical_game;
        const card = this.card;
        const tray_width = this.get_width();
        HandCardDragAction.start_drag_hand_card({ card, tray_width });
    }

    handle_dragend(): void {
        HandCardDragAction.end_drag_hand_card();
    }

    allow_dragging() {
        const self = this;
        const div = this.card_div;

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

        this.click_handler = (e) => {
            physical_game.handle_shelf_card_click(self.card_location);
            e.stopPropagation();
        };

        div.addEventListener("click", this.click_handler);
    }

    ensure_firmly_on_board() {
        const physical_card = this.physical_card;
        const card = physical_card.card;

        if (card.state === CardState.FRESHLY_PLAYED_BY_LAST_PLAYER) {
            card.state = CardState.FIRMLY_ON_BOARD;
            physical_card.update_state_styles();
        }
    }
}

function build_physical_shelf_cards(
    stack_location: StackLocation,
    cards: Card[],
): PhysicalShelfCard[] {
    const physical_shelf_cards: PhysicalShelfCard[] = [];
    const { shelf_index, stack_index } = stack_location;

    for (let card_index = 0; card_index < cards.length; ++card_index) {
        const card = cards[card_index];

        const card_location = new ShelfCardLocation({
            shelf_index,
            stack_index,
            card_index,
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
    physical_board: PhysicalBoard;
    stack_location: StackLocation;
    stack: CardStack;
    physical_shelf_cards: PhysicalShelfCard[];
    div: HTMLElement;

    constructor(
        physical_game: PhysicalGame,
        stack_location: StackLocation,
        stack: CardStack,
    ) {
        this.physical_game = physical_game;
        this.physical_board = physical_game.physical_board;
        this.stack_location = stack_location;
        this.stack = stack;

        this.physical_shelf_cards = build_physical_shelf_cards(
            stack_location,
            stack.cards,
        );

        const card_spans = this.physical_shelf_cards.map((psc) => psc.dom());

        this.div = render_card_stack(card_spans);
        this.enable_drop();
        this.allow_dragging();
    }

    dom(): HTMLElement {
        return this.div;
    }

    get_all_physical_shelf_cards(): PhysicalShelfCard[] {
        return this.physical_shelf_cards;
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
        const physical_game = this.physical_game;
        const physical_shelf_cards = this.physical_shelf_cards;

        for (const physical_shelf_card of physical_shelf_cards) {
            physical_shelf_card.add_click_listener(physical_game);
        }
    }

    /* accept DROP (either hand card or stack) */

    can_drop_card(): boolean {
        const dragged_card = HandCardDragAction.get_card();
        return this.stack.is_mergeable_with_card(dragged_card);
    }

    dragged_stack(): CardStack {
        const board = this.physical_board.board;
        const stack_location = CardStackDragAction.get_dragged_stack_location();
        return board.get_stack_for(stack_location);
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
        CardStackDragAction.drop_stack_on_stack({
            source_location,
            target_location,
        });
    }

    handle_drop(): void {
        if (HandCardDragAction.in_progress()) {
            HandCardDragAction.merge_hand_card_to_board_stack(
                this.stack_location,
            );
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
    physical_game: PhysicalGame;

    constructor(shelf_idx: number, physical_game: PhysicalGame) {
        this.shelf_idx = shelf_idx;
        this.physical_game = physical_game;
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
            console.log("accepting drop of stack to empty spot");
            return true;
        }

        return false; // unknown "future" draggable
    }

    handle_drop(): void {
        const shelf_index = this.shelf_idx;

        if (HandCardDragAction.in_progress()) {
            HandCardDragAction.move_card_from_hand_to_board();
        } else {
            CardStackDragAction.move_dragged_card_stack_to_end_of_shelf(
                shelf_index,
            );
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
    physical_game: PhysicalGame;
    physical_board: PhysicalBoard;
    physical_card_stacks: PhysicalCardStack[];
    shelf_index: number;
    shelf: Shelf;
    div: HTMLElement;
    physical_shelf_empty_spot: PhysicalEmptyShelfSpot;

    constructor(info: {
        physical_game: PhysicalGame;
        physical_board: PhysicalBoard;
        shelf_index: number;
        shelf: Shelf;
    }) {
        this.physical_game = info.physical_game;
        this.physical_board = info.physical_board;
        this.shelf_index = info.shelf_index;
        this.shelf = info.shelf;
        this.div = render_shelf();
        this.physical_card_stacks = [];
        this.physical_shelf_empty_spot = new PhysicalEmptyShelfSpot(
            this.shelf_index,
            this.physical_game,
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
        const physical_game = this.physical_game;
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
                physical_game,
                stack_location,
                card_stack,
            );

            physical_card_stack.set_up_clicks_handlers_for_cards();
            physical_card_stacks.push(physical_card_stack);
        }

        return physical_card_stacks;
    }

    get_all_physical_shelf_cards(): PhysicalShelfCard[] {
        let physical_cards: PhysicalShelfCard[] = [];
        const physical_card_stacks = this.physical_card_stacks;

        for (const physical_card_stack of physical_card_stacks) {
            physical_cards = physical_cards.concat(
                physical_card_stack.get_all_physical_shelf_cards(),
            );
        }

        return physical_cards;
    }

    split_card_from_stack(info: {
        stack_index: number;
        card_index: number;
    }): void {
        this.shelf.split_card_from_stack(info);
        this.populate();
    }

    add_singleton_card(card: Card) {
        this.shelf.add_singleton_card(card);
        this.populate();
    }
}

class PhysicalBoard {
    physical_game: PhysicalGame;
    board: Board;
    div: HTMLElement;
    physical_shelves: PhysicalShelf[];
    undo_button: UndoButton;

    constructor(physical_game: PhysicalGame, board: Board) {
        this.physical_game = physical_game;
        this.board = board;
        this.div = this.make_div();
        this.physical_shelves = this.build_physical_shelves();
        this.undo_button = new UndoButton(physical_game);

        CardStackDragAction = new CardStackDragActionSingleton(
            this,
            physical_game.game,
        );
    }

    build_physical_shelves(): PhysicalShelf[] {
        const physical_game = this.physical_game;
        const physical_board = this;
        const physical_shelves: PhysicalShelf[] = [];
        const shelves = this.board.shelves;

        for (let shelf_index = 0; shelf_index < shelves.length; ++shelf_index) {
            const shelf = shelves[shelf_index];
            const physical_shelf = new PhysicalShelf({
                physical_game,
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

    get_all_physical_shelf_cards(): PhysicalShelfCard[] {
        let physical_cards: PhysicalShelfCard[] = [];
        const physical_shelves = this.physical_shelves;

        for (const physical_shelf of physical_shelves) {
            physical_cards = physical_cards.concat(
                physical_shelf.get_all_physical_shelf_cards(),
            );
        }

        return physical_cards;
    }

    make_old_cards_firmly_on_board(): void {
        // This move will make all the FRESHLY_PLAYED_BY_LAST_PLAYER cards
        // be FIRMLY_ON_BOARD, which basically means they will lose their highlighting
        // as the current turn owner has decided to make a "real move" on the board.
        for (const physical_shelf_card of this.get_all_physical_shelf_cards()) {
            physical_shelf_card.ensure_firmly_on_board();
        }
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

    display_mergeable_stacks_for_card(card: Card): void {
        const card_stack = new CardStack([card]);

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

    extend_stack_with_card(stack_location: StackLocation, card: Card): void {
        const shelf_index = stack_location.shelf_index;
        const stack_index = stack_location.stack_index;
        const board = this.board;
        const shelf = board.shelves[shelf_index];

        const longer_stack = shelf.extend_stack_with_card(stack_index, card);

        if (longer_stack.cards.length >= 3) {
            SoundEffects.play_ding_sound();
        }
        this.populate_shelf(shelf_index);
        this.hide_mergeable_stacks();
    }

    populate_shelf(shelf_index: number): void {
        this.physical_shelves[shelf_index].populate();
    }

    handle_shelf_card_click(card_location: ShelfCardLocation) {
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
        const board = this.board;
        const physical_shelves = this.physical_shelves;

        const heading = document.createElement("h3");
        heading.innerText = "Shelves";

        div.append(heading);
        for (const physical_shelf of physical_shelves) {
            div.append(physical_shelf.dom());
        }

        div.append(this.undo_button.dom());
    }

    add_card_to_top_shelf(card: Card): StackLocation {
        if (this.physical_shelves.length < 1) {
            throw new Error("No top shelf");
        }
        this.physical_shelves[0].add_singleton_card(card);
        return new StackLocation({
            shelf_index: 0,
            stack_index: this.board.shelves[0].card_stacks.length - 1,
        });
    }
}

function row_of_cards_in_hand(
    cards: Card[],
    physical_game: PhysicalGame,
): HTMLElement {
    /*
        This can be a pure function, because even though
        users can mutate our row (by clicking a card to put it
        out to the board), we don't ever have to re-draw
        ourself.  We just let PhysicalHand re-populate the
        entire hand, since the hand is usually super small.
    */
    const card_spans = [];

    for (const card of cards) {
        const physical_card = new PhysicalCard(card);

        const physical_hand_card = new PhysicalHandCard(
            physical_game,
            physical_card,
        );
        const span = physical_hand_card.dom();
        card_spans.push(span);
    }

    return render_hand_card_row(card_spans);
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
        const cards = this.hand.cards;
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
        this.hand.add_cards([card]);
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
        this.physical_hand = new PhysicalHand(physical_game, player.hand);
        this.complete_turn_button = new CompleteTurnButton(physical_game);
        this.make_div();
    }

    make_div() {
        this.div = document.createElement("div");
    }

    dom(): HTMLElement {
        this.populate();
        return this.div;
    }

    populate() {
        const player = this.player;
        const div = this.div;
        div.innerHTML = "";

        const h3 = document.createElement("h3");
        h3.innerText = player.name;

        div.append(h3);
        div.append(this.physical_hand.dom());
        div.append(this.complete_turn_button.dom());
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
        const board = physical_board.board;

        const stack_location = this.dragged_stack_location!;

        board.move_card_stack_to_end_of_shelf(stack_location, new_shelf_index);

        physical_board.populate_shelf(stack_location.shelf_index);
        physical_board.populate_shelf(new_shelf_index);

        game.maybe_update_snapshot();
    }

    // ACTION
    drop_stack_on_stack(info: {
        source_location: StackLocation;
        target_location: StackLocation;
    }): void {
        const { source_location, target_location } = info;

        const physical_board = this.physical_board;
        const board = physical_board.board;
        const game = this.game;

        const merged_stack = board.merge_card_stacks({
            source: source_location,
            target: target_location,
        });

        if (merged_stack === undefined) {
            console.log("unexpected merged failure!");
            return;
        }

        if (merged_stack.cards.length >= 3) {
            SoundEffects.play_ding_sound();
        }

        physical_board.populate_shelf(source_location.shelf_index);
        physical_board.populate_shelf(target_location.shelf_index);

        game.maybe_update_snapshot();
    }
}

let HandCardDragAction: HandCardDragActionSingleton;

class HandCardDragActionSingleton {
    physical_game: PhysicalGame;
    physical_board: PhysicalBoard;
    game: Game;
    dragged_hand_card: Card;

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

    get_card(): Card {
        return this.dragged_hand_card!;
    }

    start_drag_hand_card(info: { card: Card; tray_width: number }): void {
        const { card, tray_width } = info;
        const physical_board = this.physical_board;
        const top_physical_shelf = physical_board.top_physical_shelf();

        physical_board.display_mergeable_stacks_for_card(card);
        physical_board.display_empty_shelf_spots(
            [top_physical_shelf],
            tray_width,
        );

        this.dragged_hand_card = card;
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
        const card = this.dragged_hand_card;
        const physical_hand = this.get_physical_hand();
        const physical_board = this.physical_board;

        card.state = CardState.FRESHLY_PLAYED;

        physical_board.make_old_cards_firmly_on_board();
        physical_board.extend_stack_with_card(stack_location, card);
        physical_hand.remove_card_from_hand(card);

        this.game.maybe_update_snapshot();
    }

    // ACTION
    move_card_from_hand_to_board(): void {
        const card = this.dragged_hand_card;
        const physical_board = this.physical_board;
        const physical_hand = this.get_physical_hand();

        card.state = CardState.FRESHLY_PLAYED;

        physical_board.make_old_cards_firmly_on_board();
        physical_hand.remove_card_from_hand(card);
        physical_board.add_card_to_top_shelf(card);

        // no need to call maybe_update_snapshot() here
    }
}

class PhysicalGame {
    game: Game;
    player_area: HTMLElement;
    board_area: HTMLElement;
    physical_players: PhysicalPlayer[];
    physical_board: PhysicalBoard;
    physical_deck: PhysicalDeck;

    constructor(info: { player_area: HTMLElement; board_area: HTMLElement }) {
        const physical_game = this;
        this.game = new Game();
        this.player_area = info.player_area;
        this.board_area = info.board_area;
        this.build_physical_game();
    }

    // ACTION
    rollback_moves_to_last_clean_state() {
        this.game.rollback_moves_to_last_clean_state();
        this.build_physical_game();

        // Re-render
        this.populate_player_area();
        this.populate_board_area();
    }

    build_physical_game(): void {
        const physical_game = this;

        this.physical_deck = new PhysicalDeck(this.game.deck);
        this.physical_board = new PhysicalBoard(physical_game, this.game.board);
        this.physical_players = this.game.players.map(
            (player) => new PhysicalPlayer(physical_game, player),
        );
        HandCardDragAction = new HandCardDragActionSingleton(
            physical_game,
            this.physical_board,
            this.game,
        );
    }

    // ACTION
    handle_shelf_card_click(card_location: ShelfCardLocation) {
        this.physical_board.handle_shelf_card_click(card_location);
        // no need to call maybe_update_snapshot here
    }

    current_physical_player() {
        return this.physical_players[this.game.current_player_index];
    }

    get_physical_hand(): PhysicalHand {
        return this.current_physical_player().physical_hand;
    }

    // ACTION
    complete_turn() {
        if (!this.game.complete_turn()) {
            alert(
                "Cannot complete turn! Place at least one card and the keep the board clean; else give up!",
            );
        }
        this.populate_player_area();
    }

    populate_player_area() {
        this.player_area.innerHTML = "";
        this.player_area.append(this.current_physical_player().dom());
        const deck_dom = this.physical_deck.dom();
        this.player_area.append(deck_dom);
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

class UndoButton {
    button: HTMLElement;

    constructor(physical_game: PhysicalGame) {
        const button = render_undo_button();
        button.addEventListener("click", () => {
            physical_game.rollback_moves_to_last_clean_state();
        });
        this.button = button;
    }

    dom(): HTMLElement {
        return this.button;
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
    board_area: HTMLElement;

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

        this.board_area = document.createElement("div");

        const left_panel = document.createElement("div");
        left_panel.append(this.welcome_area);
        left_panel.append(this.player_area);

        const right_panel = document.createElement("div");
        right_panel.append(this.examples_area);
        right_panel.append(this.board_area);

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
        const board_area = this.board_area;

        welcome_area.innerHTML = "";
        examples_area.innerHTML = "";

        // We get called back one the player dismisses the examples.
        const physical_game = new PhysicalGame({
            player_area: player_area,
            board_area: board_area,
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

function test_merge() {
    let board = example_board();
    console.log(board.str());
    console.log("------");

    board.merge_card_stacks({
        source: new StackLocation({ shelf_index: 1, stack_index: 4 }),
        target: new StackLocation({ shelf_index: 1, stack_index: 2 }),
    });
    console.log(board.str());

    board = example_board();
    board.merge_card_stacks({
        source: new StackLocation({ shelf_index: 1, stack_index: 2 }),
        target: new StackLocation({ shelf_index: 1, stack_index: 4 }),
    });
    console.log(board.str());
}

function test() {
    const game = new Game();
    get_examples(); // run for side effects
    test_merge();
    test_card_serde();
}

function test_card_serde() {
    const original_card = new Card(
        CardValue.JACK,
        Suit.DIAMOND,
        CardState.FRESHLY_DRAWN,
        OriginDeck.DECK_TWO,
    );
    const card_str = original_card.serialize();
    if (card_str !== "JD31") {
        throw new Error("Card serialization doesn't work as expected!");
    }
    const deserialized_card = Card.deserialize(card_str);
    if (!deserialized_card.equals(original_card)) {
        throw new Error("Card deserialization doesn't work as expected!");
    }
}

test(); // runs in node

class SoundEffectsSingleton {
    ding: HTMLAudioElement;

    constructor() {
        // It might be overkill to pre-load these, but I can't
        // see how it hurts either.
        this.ding = document.createElement("audio");
        this.ding.src = "ding.mp3";
    }

    play_ding_sound() {
        this.ding.play();
    }
}

// SINGLETONS get initialized in gui().
let SoundEffects: SoundEffectsSingleton;

// This is the entry point for static/index.html
function gui() {
    SoundEffects = new SoundEffectsSingleton();
    const ui = new MainPage();
    ui.start();
}
