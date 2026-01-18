/*
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

function card_color_str(color: CardColor): string {
    return color == CardColor.RED ? "red" : "black";
}

const enum StackType {
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

    with(other_card: Card): StackType {
        // See if the pair is a promising start to a stack.
        // Do not return INCOMPLETE here. It's obviously
        // not complete in this context, and our caller will
        // understand that.
        if (this.value === other_card.value) {
            if (this.suit === other_card.suit) {
                return StackType.DUP;
            }
            return StackType.SET;
        }

        if (other_card.value === successor(this.value)) {
            if (this.suit === other_card.suit) {
                return StackType.PURE_RUN;
            } else if (this.color !== other_card.color) {
                return StackType.RED_BLACK_RUN;
            }
        }
        return StackType.BOGUS;
    }

    dom(): Node {
        return document.createTextNode(this.str());
    }
}

class CardStack {
    cards: Card[]; // Order does matter here!
    stack_type: StackType;

    constructor(cards: Card[]) {
        this.cards = cards;
        this.stack_type = this.get_stack_type();
    }

    get_stack_type(): StackType {
        const cards = this.cards;
        if (cards.length <= 1) {
            return StackType.INCOMPLETE;
        }

        const provisional_stack_type = cards[0].with(cards[1]);
        if (provisional_stack_type === StackType.BOGUS) {
            return StackType.BOGUS;
        }

        if (cards.length === 2) {
            return StackType.INCOMPLETE;
        }

        function any_dup_card(card: Card, rest: Card[]): boolean {
            if (rest.length === 0) {
                return false;
            }
            if (card.with(rest[0]) === StackType.DUP) {
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
        if (provisional_stack_type === StackType.SET) {
            if (has_dups(cards)) {
                return StackType.DUP;
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
            return StackType.BOGUS;
        }

        // HAPPY PATH! We have a stack that can stay on the board!
        return provisional_stack_type;
    }

    str() {
        return this.cards.map((card) => card.str()).join(",");
    }

    dom() {
        const div = document.createElement("div");
        for (const card of this.cards) {
            div.append(card.dom());
        }
        return div;
    }
}

class Deck {
    cards: Card[];
    shuffled: boolean;

    constructor(info: { shuffled: boolean }) {
        this.cards = [];
        this.shuffled = info.shuffled;

        // Do this the non-fancy way.
        const all_suits = [
            // 1st deck
            Suit.HEART,
            Suit.SPADE,
            Suit.DIAMOND,
            Suit.CLUB,
            // 2nd deck
            Suit.HEART,
            Suit.SPADE,
            Suit.DIAMOND,
            Suit.CLUB,
        ];

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

        function suit_run(suit: Suit) {
            return all_card_values.map(
                (card_value) => new Card(card_value, suit),
            );
        }

        const all_runs = all_suits.map((suit) => suit_run(suit));

        // Use the old-school idiom to flatten the array.
        const all_cards = all_runs.reduce((acc, lst) => acc.concat(lst));

        this.cards = all_cards;
    }

    str(): string {
        return this.cards.map((card) => card.str()).join(" ");
    }
}

class Example {
    stack: CardStack;
    expected_type: StackType;

    constructor(cards: Card[], expected_type: StackType) {
        this.stack = new CardStack(cards);
        this.expected_type = expected_type;
        // test it even at runtime
        if (this.stack.stack_type !== expected_type) {
            console.log("\n\n----- PROBLEM!\n\n");
            console.log(this.stack.str());
            console.log(this.stack.stack_type, "is not", expected_type);
        }
    }

    dom(): Node {
        return this.stack.dom();
    }
}

function get_examples(): Example[] {
    const d3 = new Card(CardValue.THREE, Suit.DIAMOND);
    const h3 = new Card(CardValue.THREE, Suit.HEART);
    const s3 = new Card(CardValue.THREE, Suit.SPADE);

    const d4 = new Card(CardValue.FOUR, Suit.DIAMOND);
    const h4 = new Card(CardValue.FOUR, Suit.HEART);
    const s4 = new Card(CardValue.FOUR, Suit.SPADE);

    const s5 = new Card(CardValue.FIVE, Suit.SPADE);

    return [
        new Example([h3, s5, h3], StackType.BOGUS),
        new Example([h3, s3, h3], StackType.DUP),
        new Example([h3, s3, d3], StackType.SET),
        new Example([s3, s4, s5], StackType.PURE_RUN),
        new Example([s3, d4, s5], StackType.RED_BLACK_RUN),
        new Example([s3, d4], StackType.INCOMPLETE),
        new Example([s3, d4, h4], StackType.BOGUS),
    ];
}

function test() {
    const deck = new Deck({ shuffled: false });
    console.log(deck.str());
    get_examples(); // run for side effects
}

function gui() {
    const examples = get_examples();
    document.body.append(examples[0].dom());
}

test();
