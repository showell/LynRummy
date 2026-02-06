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

enum SplitResult {
    SUCCESS,
    DID_NOTHING,
}

enum CompleteTurnResult {
    SUCCESS,
    SUCCESS_BUT_NEEDS_CARDS,
    SUCCESS_WITH_HAND_EMPTIED,
    SUCCESS_AS_VICTOR,
    FAILURE,
}

class BoardLocation {
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

function is_pair_of_dups(card1: Card, card2: Card): boolean {
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

    size(): number {
        return this.board_cards.length;
    }

    get_stack_type(): CardStackType {
        // Use raw cards.
        return get_stack_type(this.get_cards());
    }

    str() {
        return this.board_cards.map((board_card) => board_card.str()).join(",");
    }

    equals(other_stack: CardStack) {
        // Cheat and compare strings.
        return this.str() === other_stack.str();
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
        if (this.equals(other_stack)) {
            // This is mostly to prevent us from literally trying
            // to merge our own stack on top of itself. But there's
            // also never a reason to merge two identical piles.
            // Sets don't allow duplicates, and we don't have room
            // in the UI for 26-card-long runs.
            return false;
        }

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

    is_empty() {
        return this.hand_cards.length === 0;
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

class PlayerTurn {
    starting_board_score: number;
    cards_played_during_turn: number;
    empty_hand_bonus: number;
    victory_bonus: number;

    constructor() {
        this.starting_board_score = CurrentBoard.score();
        this.cards_played_during_turn = 0;
        this.empty_hand_bonus = 0;
        this.victory_bonus = 0;
    }

    get_score(): number {
        const board_score = CurrentBoard.score() - this.starting_board_score;
        const cards_score = Score.for_cards_played(
            this.cards_played_during_turn,
        );

        return (
            board_score +
            cards_score +
            this.victory_bonus +
            this.empty_hand_bonus
        );
    }

    roll_back_num_cards_played(num_cards_played: number): void {
        this.cards_played_during_turn = num_cards_played;
    }

    get_num_cards_played(): number {
        return this.cards_played_during_turn;
    }

    emptied_hand(): boolean {
        return this.empty_hand_bonus > 0;
    }

    got_victory_bonus(): boolean {
        return this.victory_bonus > 0;
    }

    update_score_after_move() {
        // We get called once and only once each time
        // a card is released to the board.
        this.cards_played_during_turn += 1;
    }

    update_score_for_empty_hand() {
        this.empty_hand_bonus = 1000;

        if (TheGame.declares_me_victor()) {
            this.victory_bonus = 500;
        }
    }

    turn_result(): CompleteTurnResult {
        if (this.get_num_cards_played() === 0) {
            return CompleteTurnResult.SUCCESS_BUT_NEEDS_CARDS;
        } else if (this.emptied_hand()) {
            if (this.got_victory_bonus()) {
                return CompleteTurnResult.SUCCESS_AS_VICTOR;
            } else {
                return CompleteTurnResult.SUCCESS_WITH_HAND_EMPTIED;
            }
        } else {
            // vanilla success...we played some cards
            return CompleteTurnResult.SUCCESS;
        }
    }
}

let ActivePlayer: Player;

class Player {
    name: string;
    active: boolean;
    hand: Hand;
    total_score: number;
    player_turn?: PlayerTurn;

    constructor(info: { name: string }) {
        this.name = info.name;
        this.active = false;
        this.hand = new Hand();
        this.total_score = 0;
    }

    get_turn_score(): number {
        assert(this.player_turn !== undefined);
        return this.player_turn.get_score();
    }

    start_turn(): void {
        this.active = true;
        this.player_turn = new PlayerTurn();
    }

    end_turn(): CompleteTurnResult {
        // This sets all the freshly-drawn cards to normal.
        this.hand.reset_state();

        assert(this.player_turn !== undefined);
        const turn_result = this.player_turn.turn_result();

        // Draw cards (if necessary) for our next turn.
        switch (turn_result) {
            case CompleteTurnResult.SUCCESS_BUT_NEEDS_CARDS:
                // Draw cards since the user's current cards don't
                // seem to play to the board. (By the way, this often
                // happens in a two-player game because the
                // **opponent** didn't add any cards to the board.)
                this.take_cards_from_deck(3);
                break;

            case CompleteTurnResult.SUCCESS_AS_VICTOR:
            case CompleteTurnResult.SUCCESS_WITH_HAND_EMPTIED:
                // Draw 5 new cards from deck to continue playing.
                ActivePlayer.take_cards_from_deck(5);
                break;
        }

        this.active = false;

        // Finally bump up the player's overall score.
        this.total_score += this.get_turn_score();

        return turn_result;
    }

    release_card(hand_card: HandCard) {
        // We get called once and only once each time
        // a card is released to the board.
        this.hand.remove_card_from_hand(hand_card);

        // they get a bonus for playing a card
        assert(this.player_turn !== undefined);
        this.player_turn.update_score_after_move();

        // When we empty our hand, we get additional bonuses.
        if (this.hand.is_empty()) {
            this.player_turn.update_score_for_empty_hand();
        }
    }

    take_cards_from_deck(cnt: number): void {
        const cards = TheDeck.take_from_top(cnt);
        this.hand.add_cards(cards, HandCardState.FRESHLY_DRAWN);
    }

    roll_back_num_cards_played(num_cards_played: number): void {
        assert(this.player_turn !== undefined);
        this.player_turn.roll_back_num_cards_played(num_cards_played);
    }

    get_num_cards_played(): number {
        assert(this.player_turn !== undefined);
        return this.player_turn.get_num_cards_played();
    }
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
        return (stack.size() - 2) * this.stack_type_value(stack.stack_type);
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
    // The first snapshot will be initialized after
    // the first player starts their turn.
    // We will then update the snapshot at any
    // point the board is in a clean state.
    snapshot?: {
        num_cards_played: number;
        hand_cards: HandCard[];
        board: Board;
    };
    has_victor_already: boolean;

    constructor() {
        this.players = [
            new Player({ name: "Susan" }),
            new Player({ name: "Lyn" }),
        ];
        this.has_victor_already = false;
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

    declares_me_victor(): boolean {
        // Players only call us if they empty their hand.
        // We only return true for the first player.
        if (this.has_victor_already) {
            return false; // there can only be one winner
        }

        // We have a winner!
        this.has_victor_already = true;
        return true;
    }

    update_snapshot(): void {
        this.snapshot = {
            num_cards_played: ActivePlayer.get_num_cards_played(),
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
        assert(snapshot !== undefined);
        ActivePlayer.roll_back_num_cards_played(snapshot.num_cards_played);
        ActivePlayer.hand.hand_cards = snapshot.hand_cards;
        CurrentBoard = snapshot.board;

        // Even though we are now on the SAME snapshot (by definition),
        // we still need to re-clone it, so that subsequent moves
        // don't corrupt it.
        this.update_snapshot();
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
        // We return failure so that Angry Cat can complain
        // about the dirty board.
        if (!CurrentBoard.is_clean()) return CompleteTurnResult.FAILURE;

        // Let the player decide all the other conditions.
        const turn_result = ActivePlayer.end_turn();
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
    span.style.minWidth = "27px";
    span.style.minHeight = "38px";

    span.style.userSelect = "none";
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
    div.style.userSelect = "none";

    for (const card_span of card_spans) {
        div.append(card_span);
    }

    return div;
}

function render_player_advice(): HTMLElement {
    const div = document.createElement("div");
    div.innerText = `
        Play as both players to maximize the fun!`;
    return div;
}

function render_board_heading(): HTMLElement {
    const heading = document.createElement("div");
    heading.innerText = "Board";
    heading.style.color = heading_color();
    heading.style.fontWeight = "bold";
    heading.style.fontSize = "19px";
    heading.style.marginTop = "20px";
    heading.style.color = heading_color();
    return heading;
}

function render_hand_advice(): HTMLElement {
    const div = document.createElement("div");
    div.innerText = "Drag individual cards to the board.";
    div.style.fontSize = "12px";
    div.style.marginBottom = "3px";
    return div;
}

function render_board_advice(): HTMLElement {
    const div = document.createElement("div");
    div.innerText = "Grab piles to move them. Click on piles to break them up.";
    div.style.fontSize = "12px";
    div.style.marginTop = "1px";
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
    return "violet";
}

function new_card_color(): string {
    return "hsla(240, 96%, 68%, 0.2)";
}

class PhysicalHandCard {
    hand_card: HandCard;
    card: Card;
    card_span: HTMLElement;

    constructor(hand_card: HandCard) {
        this.hand_card = hand_card;
        this.card = hand_card.card;
        this.card_span = render_playing_card(this.card);
        this.card_span.style.cursor = "grab";
        this.allow_dragging();
        this.update_state_styles();
    }

    dom() {
        return this.card_span;
    }

    get_width() {
        return this.card_span.clientWidth;
    }

    allow_dragging() {
        const self = this;
        const div = this.card_span;

        DragDropHelper.enable_drag({
            div,
            handle_dragstart(): void {
                const hand_card = self.hand_card;
                const tray_width = self.get_width() * 2.5; // give them a nice target to hit
                HandCardDragAction.start_drag_hand_card({
                    hand_card,
                    tray_width,
                });
            },
            handle_dragend(): void {
                HandCardDragAction.end_drag_hand_card();
            },
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
    card_span: HTMLElement;

    constructor(card_location: BoardLocation, board_card: BoardCard) {
        this.board_card = board_card;
        this.card = board_card.card;
        this.card_span = render_playing_card(this.card);

        this.update_state_styles();

        DragDropHelper.accept_click({
            div: this.card_span,
            on_click() {
                EventManager.split_stack(card_location);
            },
        });
    }

    dom(): HTMLElement {
        return this.card_span;
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

        const card_location = new BoardLocation({
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
        this.allow_dragging();
    }

    dom(): HTMLElement {
        return this.div;
    }

    get_stack_width() {
        return this.div.clientWidth;
    }

    maybe_show_as_mergeable(card_stack: CardStack): void {
        if (this.stack.is_mergeable_with(card_stack)) {
            this.show_as_mergeable();
        }
    }

    show_as_mergeable(): void {
        const self = this;
        const div = this.div;

        function style_as_mergeable(): void {
            div.style.backgroundColor = "hsl(105, 72.70%, 87.10%)";
        }

        style_as_mergeable();

        DragDropHelper.accept_drop({
            div,
            on_over() {
                div.style.backgroundColor = "pink";
            },
            on_leave() {
                style_as_mergeable();
            },
            on_drop() {
                console.log("on_drop");

                if (HandCardDragAction.in_progress()) {
                    console.log("hand -> stack");
                    EventManager.merge_hand_card_to_board_stack(
                        self.stack_location,
                    );
                }

                if (CardStackDragAction.in_progress()) {
                    console.log("stack -> stack");
                    const source_location =
                        CardStackDragAction.get_dragged_stack_location();
                    const target_location = self.stack_location;
                    EventManager.drop_stack_on_stack({
                        source_location,
                        target_location,
                    });
                }
            },
        });
    }

    hide_as_mergeable(): void {
        this.div.style.backgroundColor = "transparent";
    }

    // DRAG **from** the stack

    allow_dragging() {
        const self = this;
        const div = this.div;

        DragDropHelper.enable_drag({
            div,
            handle_dragstart(): void {
                const card_stack = self.stack;
                const stack_location = self.stack_location;
                const tray_width = self.get_stack_width();

                CardStackDragAction.start_drag_stack({
                    card_stack,
                    stack_location,
                    tray_width,
                });
            },
            handle_dragend(): void {
                CardStackDragAction.end_drag_stack();
            },
        });
    }
}

class PhysicalBoard {
    div: HTMLElement;
    physical_shelves: PhysicalShelf[];

    constructor() {
        this.div = this.make_div();
        this.physical_shelves = this.build_physical_shelves();

        const div = this.div;
        const physical_shelves = this.physical_shelves;

        div.append(render_board_heading());
        div.append(render_board_advice());

        for (const physical_shelf of physical_shelves) {
            div.append(physical_shelf.dom());
        }

        div.append(UndoButton.dom());
    }

    dom(): HTMLElement {
        return this.div;
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
    ): number | undefined {
        const shelf_index = stack_location.shelf_index;
        const stack_index = stack_location.stack_index;
        const shelf = CurrentBoard.shelves[shelf_index];

        const longer_stack = shelf.extend_stack_with_card(
            stack_index,
            hand_card,
        );
        if (longer_stack === undefined) {
            return undefined;
        }
        return longer_stack.size();
    }

    // ACTION
    split_stack(card_location: BoardLocation): SplitResult {
        const { shelf_index, stack_index, card_index } = card_location;

        const shelf = this.physical_shelves[shelf_index];

        const result = shelf.split_stack({
            stack_index,
            card_index,
        });

        return result;
    }

    make_div(): HTMLElement {
        // no special styling for now
        return document.createElement("div");
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
        const div = document.createElement("div");
        div.style.marginTop = "10px";
        return div;
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
}

class PhysicalPlayer {
    player: Player;
    physical_hand: PhysicalHand;
    complete_turn_button: CompleteTurnButton;
    div: HTMLElement;

    constructor(player: Player) {
        this.player = player;
        this.physical_hand = new PhysicalHand(player.hand);
        this.complete_turn_button = new CompleteTurnButton();
        this.div = document.createElement("div");
        this.div.style.minWidth = "200px";
        this.div.style.paddingBottom = "15px";
        this.div.style.borderBottom = "1px #000080 solid";
    }

    dom(): HTMLElement {
        return this.div;
    }

    score(): HTMLElement {
        const div = document.createElement("div");

        const score = this.player.total_score;

        div.innerText = `Score: ${score}`;
        div.style.color = "maroon";
        div.style.marginBottom = "4px";
        return div;
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

        const name = document.createElement("div");
        name.innerText = player.name;
        name.style.fontWeight = "bold";
        name.style.fontSize = "19px";
        name.style.marginTop = "20";
        name.style.marginBottom = "5px";
        name.style.color = heading_color();

        div.append(name);
        div.append(this.score());

        if (this.player.active) {
            div.append(this.physical_hand.dom());
            div.append(render_hand_advice());
            div.append(this.complete_turn_button.dom());
        } else {
            div.append(this.card_count());
        }
    }

    release_card(hand_card: HandCard) {
        this.player.release_card(hand_card);
        this.physical_hand.populate();
    }
}

let PlayerArea: PlayerAreaSingleton;

class PlayerAreaSingleton {
    physical_players: PhysicalPlayer[];
    div: HTMLElement;

    constructor(players: Player[], player_area: HTMLElement) {
        this.div = player_area;
        this.physical_players = players.map(
            (player) => new PhysicalPlayer(player),
        );
        this.populate();
    }

    get_physical_hand_for_player(player_index: number): PhysicalHand {
        return this.physical_players[player_index].physical_hand;
    }

    get_physical_player(player_index: number): PhysicalPlayer {
        return this.physical_players[player_index];
    }

    populate(): void {
        const div = this.div;

        div.innerHTML = "";
        for (const physical_player of this.physical_players) {
            physical_player.populate();
            div.append(physical_player.dom());
        }
        div.append(render_player_advice());
    }
}

let CardStackDragAction: CardStackDragActionSingleton;

class CardStackDragActionSingleton {
    physical_board: PhysicalBoard;
    dragged_stack_location: StackLocation | undefined;

    constructor(physical_board: PhysicalBoard) {
        this.physical_board = physical_board;
        this.dragged_stack_location = undefined;
    }

    in_progress(): boolean {
        return this.dragged_stack_location !== undefined;
    }

    get_dragged_stack_location(): StackLocation {
        assert(this.dragged_stack_location !== undefined);
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
        const physical_board = this.physical_board;

        const stack_location = this.dragged_stack_location!;

        CurrentBoard.move_card_stack_to_end_of_shelf(
            stack_location,
            new_shelf_index,
        );
    }

    // ACTION
    drop_stack_on_stack(info: {
        source_location: StackLocation;
        target_location: StackLocation;
    }): CardStack | undefined {
        const { source_location, target_location } = info;

        const merged_stack = CurrentBoard.merge_card_stacks({
            source: source_location,
            target: target_location,
        });

        if (merged_stack === undefined) {
            console.log(
                "unexpected merged failure!",
                source_location,
                target_location,
            );
            return undefined;
        }

        return merged_stack;
    }
}

let HandCardDragAction: HandCardDragActionSingleton;

class HandCardDragActionSingleton {
    physical_game: PhysicalGame;
    physical_board: PhysicalBoard;
    dragged_hand_card: HandCard | undefined;

    constructor(physical_game: PhysicalGame, physical_board: PhysicalBoard) {
        this.physical_game = physical_game;
        this.physical_board = physical_board;
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

    get_current_physical_player() {
        const player_idx = TheGame.current_player_index;
        return PlayerArea.get_physical_player(player_idx);
    }

    // ACTION
    merge_hand_card_to_board_stack(
        stack_location: StackLocation,
    ): number | undefined {
        const hand_card = this.dragged_hand_card;
        assert(hand_card !== undefined);
        const physical_hand = this.get_physical_hand();
        const physical_board = this.physical_board;

        const stack_size = physical_board.extend_stack_with_card(
            stack_location,
            hand_card,
        );
        if (stack_size === undefined) return undefined;
        const physical_player = this.get_current_physical_player();
        physical_player.release_card(hand_card);

        return stack_size;
    }

    // ACTION
    move_card_from_hand_to_board(): void {
        const hand_card = this.dragged_hand_card;
        assert(hand_card !== undefined);
        const physical_board = this.physical_board;
        const physical_hand = this.get_physical_hand();

        const physical_player = this.get_current_physical_player();
        physical_player.release_card(hand_card);
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
        assert(physical_game.physical_board !== undefined);
        this.physical_board = physical_game.physical_board;
        this.game = TheGame;
    }

    // COMPLETE TURN

    maybe_complete_turn(): void {
        const physical_game = this.physical_game;
        const self = this;

        const turn_result = TheGame.complete_turn();

        switch (turn_result) {
            case CompleteTurnResult.FAILURE:
                SoundEffects.play_purr_sound();
                Popup.show({
                    content: `The board is not clean!\
                        \n\n(nor is my litter box)\
                        \n\nUse the "Undo mistakes" button if you need to.`,
                    confirm_button_text: "Oy vey, ok",
                    type: "warning",
                    admin: Admin.ANGRY_CAT,
                    callback() {},
                });
                return;

            case CompleteTurnResult.SUCCESS_BUT_NEEDS_CARDS:
                SoundEffects.play_purr_sound();
                Popup.show({
                    content:
                        "You didn't make any progress at all.\
                        \n\
                        \nI'm going back to my nap!\
                        \n\
                        \nYou will get 3 new cards on your next hand.",
                    type: "warning",
                    confirm_button_text: "Meh",
                    admin: Admin.OLIVER,
                    callback() {
                        continue_on_to_next_turn();
                    },
                });
                break;

            case CompleteTurnResult.SUCCESS_AS_VICTOR: {
                const turn_score = ActivePlayer.get_turn_score();
                // Only play this for the first time a player gets
                // rid of all the cards in their hand.
                SoundEffects.play_victory_sound();
                Popup.show({
                    content: `Let’s be honest: this world is basically yours. We’re all just living in your empire!\
                        \n\
                        \nThat said, I, award you 1500 extra points for being the first person to clear your hand!\
                        \n\
                        \nThat fetches you a total of ${turn_score} points for this turn.\
                        \n\
                        \nYou get a bonus every time you clear your hand.\
                        \n\
                        \nYou also get five more cards on the next turn.\
                        \n\
                        \nKeep winning!`,
                    type: "success",
                    admin: Admin.STEVE,
                    confirm_button_text: "I am the chosen one!",
                    callback() {
                        continue_on_to_next_turn();
                    },
                });
                break;
            }

            case CompleteTurnResult.SUCCESS_WITH_HAND_EMPTIED: {
                const turn_score = ActivePlayer.get_turn_score();
                Popup.show({
                    content: `WOOT!\
                    \n\
                    \nLooks like you got rid of all your cards!\
                    \n\
                    \nI am rewarding you extra points for that!\
                    \n\
                    \nYour scored a whopping ${turn_score} for this turn!!\
                    \n\
                    \nYou get a bonus every time you clear your hand.\
                    \n\
                    \nWe will deal you 5 more cards if you get back on the road.`,
                    admin: Admin.STEVE,
                    confirm_button_text: "Back on the road!",
                    callback() {
                        continue_on_to_next_turn();
                    },
                    type: "success",
                });
                break;
            }

            case CompleteTurnResult.SUCCESS:
                const turn_score = ActivePlayer.get_turn_score();

                if (turn_score > 600) {
                    // This is Steve saying "Nice!" in a very bad
                    // audio recording. We only play it once during
                    // the game.
                    SoundEffects.play_nice_sound();
                }

                Popup.show({
                    content: `Good job!\
                         \n\
                         \nI am rewarding you with ${turn_score} points for this turn!\
                         \n\
                         \nLet's see how your opponent does! (oh yeah, that's you again)`,
                    type: "success",
                    confirm_button_text: "See if they can try!",
                    admin: Admin.STEVE,
                    callback() {
                        continue_on_to_next_turn();
                    },
                });
                break;
        }

        function continue_on_to_next_turn() {
            CurrentBoard.age_cards();
            TheGame.advance_turn_to_next_player();
            ActivePlayer.start_turn();

            TheGame.update_snapshot();

            PlayerArea.populate();
            physical_game.populate_board_area();

            StatusBar.update_text(
                `${ActivePlayer.name}, you may begin your turn.`,
            );
        }
    }

    // Undo mistakes

    undo_mistakes(): void {
        this.physical_game.rollback_moves_to_last_clean_state();
        StatusBar.update_text("PHEW!");
        this.physical_game.populate_board_area();
    }

    // SPLITTING UP STACKS
    split_stack(card_location: BoardLocation): void {
        const result = this.physical_board.split_stack(card_location);
        switch (result) {
            case SplitResult.SUCCESS:
                StatusBar.update_text(
                    "Split! Moves like this can be tricky, even for experts. You have the undo button if you need it.",
                );
                break;
            case SplitResult.DID_NOTHING:
                StatusBar.update_text(
                    "Clicking here does nothing. Maybe you want to drag it instead?",
                );
                break;
        }

        this.physical_game.populate_board_area();
    }

    // MOVING TO EMPTY SPOTS
    move_card_from_hand_to_board(): void {
        HandCardDragAction.move_card_from_hand_to_board();
        StatusBar.update_text(
            "You moved a card to the board! Drag other cards on top of it to create a pile.)",
        );
        this.physical_game.populate_board_area();
    }

    move_dragged_card_stack_to_end_of_shelf(new_shelf_index: number): void {
        CardStackDragAction.move_dragged_card_stack_to_end_of_shelf(
            new_shelf_index,
        );
        StatusBar.update_text(
            "Organizing the board is a key part of the game!",
        );

        this.game.maybe_update_snapshot();
        this.physical_game.populate_board_area();
    }

    // SCORING MOVES

    merge_hand_card_to_board_stack(stack_location: StackLocation): void {
        const stack_size =
            HandCardDragAction.merge_hand_card_to_board_stack(stack_location);
        if (stack_size === undefined) {
            console.log("Cannot merge hand card to board stack");
            return;
        }
        if (stack_size >= 8) {
            SoundEffects.play_bark_sound();
            StatusBar.update_text(
                "You are trucking now! Don't gloat! The other players hate when you gloat.",
            );
        } else if (stack_size >= 3) {
            SoundEffects.play_ding_sound();
            StatusBar.update_text(
                "Nice work! Extending piles gets you points!",
            );
        } else {
            StatusBar.update_text(
                "That's a good start, but you will need at least 3 cards.",
            );
        }

        this.game.maybe_update_snapshot();

        this.physical_game.populate_board_area();
    }

    drop_stack_on_stack(info: {
        source_location: StackLocation;
        target_location: StackLocation;
    }): void {
        const merged_stack = CardStackDragAction.drop_stack_on_stack(info);
        if (merged_stack === undefined) {
            console.trace(
                "dropped stack is unmergable with the target stack, when trying to drop stack on stack!!!",
            );
            return;
        }
        const size = merged_stack.size();

        if (size >= 8) {
            SoundEffects.play_bark_sound();
            StatusBar.update_text("Look at you go!");
        } else if (size >= 3) {
            SoundEffects.play_ding_sound();
            StatusBar.update_text("Combined!");
        } else {
            StatusBar.update_text("Nice, but where's the third card?");
        }

        this.game.maybe_update_snapshot();

        this.physical_game.populate_board_area();
    }
}

let TheGame: Game;
class PhysicalGame {
    player_area: HTMLElement;
    board_area: HTMLElement;
    physical_board?: PhysicalBoard;

    constructor(info: { player_area: HTMLElement; board_area: HTMLElement }) {
        const physical_game = this;
        TheGame = new Game();
        this.player_area = info.player_area;
        this.board_area = info.board_area;
        this.build_physical_game();
        StatusBar.update_text(
            "Begin game. You can drag and drop hand cards or board piles to piles or empty spaces on the board.",
        );
    }

    // ACTION
    rollback_moves_to_last_clean_state() {
        TheGame.rollback_moves_to_last_clean_state();
        this.build_physical_game();
    }

    build_physical_game(): void {
        const physical_game = this;
        const players = TheGame.players;
        const player_area = this.player_area;

        PlayerArea = new PlayerAreaSingleton(players, player_area);
        this.populate_board_area();
    }

    get_physical_hand(): PhysicalHand {
        const index = TheGame.current_player_index;
        return PlayerArea.get_physical_hand_for_player(index);
    }

    populate_board_area() {
        DragDropHelper.reset();

        UndoButton = new UndoButtonSingleton();

        this.physical_board = new PhysicalBoard();
        const physical_game = this;
        const physical_board = this.physical_board;

        HandCardDragAction = new HandCardDragActionSingleton(
            physical_game,
            physical_board,
        );

        CardStackDragAction = new CardStackDragActionSingleton(physical_board);

        EventManager = new EventManagerSingleton(physical_game);
        this.board_area.innerHTML = "";
        this.board_area.append(physical_board.dom());
    }

    start() {
        PlayerArea.populate();
        // populate common area
        this.populate_board_area();
    }
}

class CompleteTurnButton {
    button: HTMLElement;

    constructor() {
        const button = render_complete_turn_button();
        button.addEventListener("click", () => {
            EventManager.maybe_complete_turn();
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
        if (CurrentBoard.is_clean()) {
            this.button.hidden = true;
        } else {
            this.button.hidden = false;
        }
    }

    dom(): HTMLElement {
        return this.button;
    }
}

/***********************************************

POPUP SYSTEM vvvv

***********************************************/

type PopupType = "warning" | "success" | "info";

enum Admin {
    STEVE = "Steve",
    OLIVER = "Oliver",
    ANGRY_CAT = "Angry Cat",
    CAT_PROFESSOR = "Mr. Professor",
}

type PopupOptions = {
    content: string;
    type: PopupType;
    confirm_button_text: string;
    admin: Admin;
    callback: () => void;
};

class DialogShell {
    popup_element: HTMLDialogElement;

    constructor() {
        this.popup_element = this.create_popup_element();
    }

    create_popup_element() {
        // See https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog
        const dialog = document.createElement("dialog");
        const s = dialog.style;
        s.maxWidth = "150vw";
        s.borderRadius = "1rem";
        s.outline = "none";
        s.border = "1px #000080 solid";
        s.display = "flex";
        s.flexDirection = "column";
        s.gap = "0.5rem";
        s.alignItems = "center";
        return dialog;
    }

    invoke_with_custom_html(html: HTMLElement, background_color: string) {
        document.body.append(this.popup_element);
        this.popup_element.style.backgroundColor = background_color;

        // Ensures it is closed by nothing apart from what we define
        this.popup_element.setAttribute("closedby", "none");
        this.popup_element.append(html);
        this.popup_element.showModal();
    }

    finish(): void {
        this.popup_element.close();
        this.popup_element.innerHTML = "";
        this.popup_element.remove();
        this.popup_element.setAttribute("closedby", "any");
    }
}

// We reuse the same popup structure every time and
// just repopulate the innards. We instantiate this
// in gui (so we can even use it in LandingPage if
// we ever want to).
let Popup: PopupSingleton;

class PopupSingleton {
    dialog_shell: DialogShell;

    constructor() {
        this.dialog_shell = new DialogShell();
    }

    avatar_img(admin: Admin) {
        const img = document.createElement("img");
        img.style.width = "4rem";
        img.style.height = "4rem";
        switch (admin) {
            case Admin.STEVE:
                img.src = "images/steve.png";
                break;
            case Admin.CAT_PROFESSOR:
                img.src = "images/cat_professor.webp";
                break;
            case Admin.ANGRY_CAT:
                img.src = "images/angry_cat.png";
                break;
            case Admin.OLIVER:
                img.src = "images/oliver.png";
                break;
        }
        return img;
    }

    make_button(text: string): HTMLElement {
        const button = document.createElement("button");
        button.style.cursor = "pointer";
        button.style.maxWidth = "fit-content";
        button.style.paddingLeft = "15px";
        button.style.paddingRight = "15px";
        button.style.paddingTop = "5px";
        button.style.paddingBottom = "5px";
        button.style.marginTop = "15px";
        button.style.backgroundColor = "#000080";
        button.style.color = "white";

        button.innerText = text;
        return button;
    }

    admin_name(admin: string): HTMLElement {
        const div = document.createElement("div");
        div.innerText = admin;
        div.style.fontSize = "11px";
        div.style.color = "#000080";

        return div;
    }

    get_background_color(info_type: string): string {
        switch (info_type) {
            case "info":
                return "#ADD8E6";
            case "success":
                return "white";
            case "warning":
                return "#FFFFE0";
        }

        return "transparent";
    }

    show(info: PopupOptions) {
        const self = this;

        // AVATAR in left
        const left = document.createElement("div");
        left.style.marginRight = "30px";

        left.append(this.avatar_img(info.admin));
        left.append(this.admin_name(info.admin));

        // TEXT and BUTTON in right
        const right = document.createElement("div");

        const content_div = document.createElement("pre");
        content_div.innerText = this.clean_multi_string(info.content);
        right.append(content_div);

        const button = this.make_button(info.confirm_button_text);
        button.addEventListener("click", () => self.finish(info));
        right.append(button);

        // PUT THEM ALL TOGETHER

        const flex_div = document.createElement("div");
        flex_div.style.display = "flex";
        flex_div.append(left);
        flex_div.append(right);

        this.dialog_shell.invoke_with_custom_html(
            flex_div,
            this.get_background_color(info.type),
        );
    }

    clean_multi_string(text: string) {
        return text
            .split("\n")
            .map((s) => s.trimEnd())
            .join("\n");
    }

    finish(info: PopupOptions) {
        this.dialog_shell.finish();
        info.callback();
    }
}

/***********************************************

DRAG AND DROP vvvv

***********************************************/

type DropTarget = {
    div: HTMLElement;
    on_over: () => void;
    on_leave: () => void;
    on_drop: () => void;
};

let DragDropHelper: DragDropHelperSingleton;

class DragDropHelperSingleton {
    seq: number;
    drop_targets: Map<string, DropTarget>;
    on_click_callbacks: Map<string, () => void>;

    constructor() {
        this.seq = 0;
        this.drop_targets = new Map();
        this.on_click_callbacks = new Map();
    }

    reset(): void {
        console.log(this.seq);
        this.on_click_callbacks.clear();
        this.drop_targets.clear();
    }

    enable_drag(info: {
        div: HTMLElement;
        handle_dragstart: () => void;
        handle_dragend: () => void;
    }): void {
        const { div, handle_dragstart, handle_dragend } = info;
        const self = this;

        div.draggable = true;
        div.style.userSelect = "";
        div.style.touchAction = "none";

        let dragging = false;
        let active_click_key: string | undefined;
        let active_target: DropTarget | undefined;
        let offsetX = 0;
        let offsetY = 0;
        let ghost: HTMLElement | undefined;

        div.addEventListener("pointerdown", (e) => {
            e.preventDefault();

            dragging = true;
            active_target = undefined;
            active_click_key = undefined;

            self.drop_targets.clear();

            const elements = document.elementsFromPoint(
                e.clientX,
                e.clientY,
            ) as HTMLElement[];

            for (const element of elements) {
                if (element.dataset.click_key) {
                    active_click_key = element.dataset.click_key;
                }
            }

            handle_dragstart();

            const rect = div.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;

            div.setPointerCapture(e.pointerId);
        });

        div.addEventListener("pointermove", (e) => {
            if (!dragging) return false;

            if (!ghost) {
                const clone = div.cloneNode(true);
                assert(clone instanceof HTMLElement);
                ghost = clone;
                ghost.style.position = "absolute";
                ghost.style.opacity = "0.5";
                ghost.style.pointerEvents = "none"; // Essential
                ghost.style.zIndex = "1000";

                document.body.appendChild(ghost);
            }

            ghost.style.left = e.clientX - offsetX + "px";
            ghost.style.top = e.clientY - offsetY + "px";

            const elements = document.elementsFromPoint(
                e.clientX,
                e.clientY,
            ) as HTMLElement[];

            for (const element of elements) {
                if (element.dataset.drop_key) {
                    const drop_key = element.dataset.drop_key;
                    const hovered_target = this.drop_targets.get(drop_key);

                    if (hovered_target === undefined) {
                        continue;
                    }

                    if (active_target === undefined) {
                        hovered_target.on_over();
                        active_target = hovered_target;
                        return;
                    } else if (hovered_target === active_target) {
                        // just ignore repeated hovers
                        return;
                    } else {
                        active_target.on_leave();
                        hovered_target.on_over();
                        active_target = hovered_target;
                        return;
                    }
                }
            }

            if (active_target) {
                active_target.on_leave();
                active_target = undefined;
            }
        });

        div.addEventListener("pointerup", (e) => {
            e.preventDefault();
            dragging = false;

            if (ghost) {
                ghost.remove();
                ghost = undefined;
            }

            if (active_target) {
                active_target.on_leave();
                active_target = undefined;
            }

            div.releasePointerCapture(e.pointerId);

            const elements = document.elementsFromPoint(
                e.clientX,
                e.clientY,
            ) as HTMLElement[];

            // First assume it's a click or long press.
            for (const element of elements) {
                if (element.dataset.click_key) {
                    if (active_click_key === element.dataset.click_key) {
                        const on_click =
                            this.on_click_callbacks.get(active_click_key);
                        if (on_click !== undefined) {
                            on_click();
                            active_click_key = undefined;
                            handle_dragend();
                        }
                        return;
                    }
                }
            }

            active_click_key = undefined;

            // Now look for the drag.
            for (const element of elements) {
                if (element.dataset.drop_key) {
                    const drop_key = element.dataset.drop_key;
                    const target = this.drop_targets.get(drop_key);
                    if (target) {
                        target.on_drop();
                    }
                }
            }

            handle_dragend();
        });
    }

    new_key() {
        this.seq += 1;
        return `${this.seq}`;
    }

    accept_click(info: { div: HTMLElement; on_click: () => void }): void {
        const { div, on_click } = info;

        div.style.touchAction = "none";
        const key = this.new_key();
        div.dataset.click_key = key;
        this.on_click_callbacks.set(key, on_click);
    }

    accept_drop(drop_target: DropTarget): void {
        const key = this.new_key();
        drop_target.div.dataset.drop_key = key;
        this.drop_targets.set(key, drop_target);
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
        text_div.style.fontSize = "15px";
        text_div.style.color = "#31708f";
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
    player_area!: HTMLElement;
    board_area!: HTMLElement;

    constructor() {
        const page = document.createElement("div");
        page.style.display = "flex";
        page.style.paddingLeft = "50px";
        page.style.paddingRight = "50px";
        document.body.append(page);

        const div = document.createElement("div");
        div.style.minWidth = "100%";
        div.append(this.make_top_line());
        div.append(this.make_bottom_area());
        page.append(div);

        this.start_game_components();
    }

    make_top_line(): HTMLElement {
        const top = document.createElement("div");
        const top_bar = this.make_top_bar();

        StatusBar = new StatusBarSingleton();

        top.append(top_bar);
        top.append(StatusBar.dom());
        return top;
    }

    make_title_bar(): HTMLElement {
        const title_bar = document.createElement("div");
        title_bar.style.display = "flex";
        title_bar.style.backgroundColor = "#000080";
        title_bar.style.color = "white";
        title_bar.style.justifyContent = "center";
        title_bar.style.width = "100%";

        const title = document.createElement("div");
        title.innerText = "Welcome to Lyn Rummy! Have fun!";
        title.style.fontSize = "18";

        title_bar.append(title);
        return title_bar;
    }

    make_about(): HTMLElement {
        const about = document.createElement("div");
        about.innerText = "About";
        about.style.color = "#000080";
        about.style.userSelect = "none";
        about.style.cursor = "pointer";
        about.style.backgroundColor = "lightgray";
        about.style.marginLeft = "2px";
        about.style.paddingLeft = "2px";
        about.style.paddingRight = "2px";
        about.style.fontSize = "16px";
        about.addEventListener("click", () => {
            Popup.show({
                content:
                    "Authors:\
                    \n\
                    \n    Steve Howell\
                    \n    Apoorva Pendse\
                    \n\
                    \nThis software is completely free for users. Enjoy!\
                    \n\
                    \nThe source code is also completely free.\
                    \n\
                    \n    https://github.com/showell/LynRummy/\
                    \n\
                    \nIf you enjoy this game, please spread the word. This\
                    \ngame is also very enjoyable to play in person!\
                    \n\
                    \nYou need two decks. Shuffle them, and then deal out hands\
                    \nof about 15 cards each.",
                type: "info",
                confirm_button_text: "Got it!",
                admin: Admin.STEVE,
                callback() {},
            });
        });
        return about;
    }

    make_top_bar(): HTMLElement {
        const top_bar = document.createElement("div");
        top_bar.style.display = "flex";
        top_bar.style.minWidth = "100%";
        top_bar.style.alignItems = "stretch";

        top_bar.append(this.make_title_bar());
        top_bar.append(this.make_about());
        return top_bar;
    }

    make_bottom_area(): HTMLElement {
        const bottom = document.createElement("div");
        bottom.style.display = "flex";
        bottom.style.alignItems = "stretch";
        bottom.style.minWidth = "100%";
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
        right_panel.style.width = "100%";
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
    }
}

function test() {
    console.log("V2 COMING!");
}

test(); // runs in node

class SoundEffectsSingleton {
    purr: HTMLAudioElement;
    bark: HTMLAudioElement;
    ding: HTMLAudioElement;
    good_job: HTMLAudioElement;
    nice: HTMLAudioElement;
    heard_nice: boolean;
    welcome: HTMLAudioElement;
    victory: HTMLAudioElement;

    constructor() {
        // It might be overkill to pre-load these, but I can't
        // see how it hurts either.
        this.ding = document.createElement("audio");
        this.purr = document.createElement("audio");
        this.bark = document.createElement("audio");
        this.good_job = document.createElement("audio");
        this.nice = document.createElement("audio");
        this.welcome = document.createElement("audio");
        this.victory = document.createElement("audio");
        this.ding.src = "ding.mp3";
        this.purr.src = "purr.mp3";
        this.bark.src = "bark.mp3";
        this.good_job.src = "steve.m4a";
        this.nice.src = "nice.m4a";
        this.heard_nice = false;
        this.welcome.src = "welcome.mp3";
        this.victory.src = "victory.mp3";
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

    play_good_job_sound() {
        this.good_job.play();
    }

    play_nice_sound() {
        if (!this.heard_nice) {
            this.nice.play();
            this.heard_nice = true;
        }
    }

    play_victory_sound() {
        this.victory.play();
    }
}

// SINGLETONS get initialized in gui().
let SoundEffects: SoundEffectsSingleton;

// This is the entry point for static/index.html
function gui() {
    DragDropHelper = new DragDropHelperSingleton();
    Popup = new PopupSingleton();
    SoundEffects = new SoundEffectsSingleton();
    new MainGamePage();
}

function assert(
    condition: boolean,
    msg = "Assertion failed",
): asserts condition {
    if (!condition) {
        throw new Error(msg);
    }
}
