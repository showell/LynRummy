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
        if (provisional_stack_type === StackType.BOGUS) {
            return StackType.BOGUS;
        }

        if (cards.length === 2) {
            return StackType.INCOMPLETE;
        }

        // Prevent dups within a provisional SET.
        if (provisional_stack_type === StackType.SET) {
            for (let i = 0; i < cards.length; ++i) {
                for (let j = i + 1; j < cards.length; ++j) {
                    if (cards[i].with(cards[j]) === StackType.DUP) {
                        return StackType.DUP;
                    }
                }
            }
        }

        // Prevent mixing up types of stacks.
        for (let i = 1; i + 1 < cards.length; ++i) {
            if (cards[i].with(cards[i+1]) !== provisional_stack_type) {
                return StackType.BOGUS;
            }
        }

        // HAPPY PATH! We have a stack that can stay on the board!
        return provisional_stack_type;
    }

    str() {
        return this.cards.map((card) => card.str()).join(",");
    }
}

function test() {
    function check_stack(cards: Card[], expected: StackType) {
        const stack = new CardStack(cards);
        if (stack.stack_type == expected) {
            return;
        }
        console.log("PROBLEM!");
        console.log(stack.str());
        console.log(stack.stack_type, "is not", expected);
    }
    const d3 = new Card(CardValue.THREE, Suit.DIAMOND);
    const h3 = new Card(CardValue.THREE, Suit.HEART);
    const s3 = new Card(CardValue.THREE, Suit.SPADE);

    const d4 = new Card(CardValue.FOUR, Suit.DIAMOND);
    const h4 = new Card(CardValue.FOUR, Suit.HEART);
    const s4 = new Card(CardValue.FOUR, Suit.SPADE);

    const s5 = new Card(CardValue.FIVE, Suit.SPADE);

    check_stack([h3, s5, h3], StackType.BOGUS);
    check_stack([h3, s3, h3], StackType.DUP);
    check_stack([h3, s3, d3], StackType.SET);
    check_stack([s3, s4, s5], StackType.PURE_RUN);
    check_stack([s3, d4, s5], StackType.RED_BLACK_RUN);

    check_stack([s3, d4], StackType.INCOMPLETE);

    check_stack([s3, d4, h4], StackType.BOGUS);
}

test();
