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
    switch (suit) {
        case Suit.CLUB:
            return "C";
        case Suit.SPADE:
            return "S";
        case Suit.DIAMOND:
            return "D";
        case Suit.HEART:
            return "H";
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

        if (cards.length === 2) {
            if (provisional_stack_type === StackType.BOGUS) {
                return StackType.BOGUS;
            } else {
                return StackType.INCOMPLETE;
            }
        }

        // TODO: enforce all pairs
        return provisional_stack_type;
    }
}

const s3 = new Card(CardValue.THREE, Suit.SPADE);
const s4 = new Card(CardValue.FOUR, Suit.SPADE);
const d4 = new Card(CardValue.FOUR, Suit.DIAMOND);
console.log(s3.with(d4));
console.log(s4.with(d4));
console.log(s3.with(s3));
console.log(s3.with(s4));
console.log(s4.with(s3));
