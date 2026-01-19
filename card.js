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
function value_str(val) {
    switch (val) {
        case 1 /* CardValue.ACE */:
            return "A";
        case 2 /* CardValue.TWO */:
            return "2";
        case 3 /* CardValue.THREE */:
            return "3";
        case 4 /* CardValue.FOUR */:
            return "4";
        case 5 /* CardValue.FIVE */:
            return "5";
        case 6 /* CardValue.SIX */:
            return "6";
        case 7 /* CardValue.SEVEN */:
            return "7";
        case 8 /* CardValue.EIGHT */:
            return "8";
        case 9 /* CardValue.NINE */:
            return "9";
        case 10 /* CardValue.TEN */:
            return "10";
        case 11 /* CardValue.JACK */:
            return "J";
        case 12 /* CardValue.QUEEN */:
            return "Q";
        case 13 /* CardValue.KING */:
            return "K";
    }
}
function successor(val) {
    // This is hopefully straightforward code.  Note
    // K, A, 2 is a valid run in LynRummy, because
    // KING has ACE as its successor and ACE has TWO
    // as its successor.
    switch (val) {
        case 1 /* CardValue.ACE */:
            return 2 /* CardValue.TWO */;
        case 2 /* CardValue.TWO */:
            return 3 /* CardValue.THREE */;
        case 3 /* CardValue.THREE */:
            return 4 /* CardValue.FOUR */;
        case 4 /* CardValue.FOUR */:
            return 5 /* CardValue.FIVE */;
        case 5 /* CardValue.FIVE */:
            return 6 /* CardValue.SIX */;
        case 6 /* CardValue.SIX */:
            return 7 /* CardValue.SEVEN */;
        case 7 /* CardValue.SEVEN */:
            return 8 /* CardValue.EIGHT */;
        case 8 /* CardValue.EIGHT */:
            return 9 /* CardValue.NINE */;
        case 9 /* CardValue.NINE */:
            return 10 /* CardValue.TEN */;
        case 10 /* CardValue.TEN */:
            return 11 /* CardValue.JACK */;
        case 11 /* CardValue.JACK */:
            return 12 /* CardValue.QUEEN */;
        case 12 /* CardValue.QUEEN */:
            return 13 /* CardValue.KING */;
        case 13 /* CardValue.KING */:
            return 1 /* CardValue.ACE */;
    }
}
function suit_str(suit) {
    // The strange numbers here refer to the Unicode
    // code points for the built-in emojis for the
    // suits.
    switch (suit) {
        case 0 /* Suit.CLUB */:
            return "\u2663";
        case 2 /* Suit.SPADE */:
            return "\u2660";
        case 1 /* Suit.DIAMOND */:
            return "\u2666";
        case 3 /* Suit.HEART */:
            return "\u2665";
    }
}
function card_color(suit) {
    switch (suit) {
        case 0 /* Suit.CLUB */:
        case 2 /* Suit.SPADE */:
            return 0 /* CardColor.BLACK */;
        case 1 /* Suit.DIAMOND */:
        case 3 /* Suit.HEART */:
            return 1 /* CardColor.RED */;
    }
}
function css_color(card_color) {
    return card_color == 1 /* CardColor.RED */ ? "red" : "black";
}
function card_color_str(color) {
    return color == 1 /* CardColor.RED */ ? "red" : "black";
}
var Card = /** @class */ (function () {
    function Card(value, suit) {
        this.value = value;
        this.suit = suit;
        this.color = card_color(suit);
    }
    Card.prototype.str = function () {
        return value_str(this.value) + suit_str(this.suit);
    };
    Card.prototype.with = function (other_card) {
        // See if the pair is a promising start to a stack.
        // Do not return INCOMPLETE here. It's obviously
        // not complete in this context, and our caller will
        // understand that.
        if (this.value === other_card.value) {
            if (this.suit === other_card.suit) {
                return "dup" /* StackType.DUP */;
            }
            return "set" /* StackType.SET */;
        }
        if (other_card.value === successor(this.value)) {
            if (this.suit === other_card.suit) {
                return "pure run" /* StackType.PURE_RUN */;
            }
            else if (this.color !== other_card.color) {
                return "red/black alternating" /* StackType.RED_BLACK_RUN */;
            }
        }
        return "bogus" /* StackType.BOGUS */;
    };
    Card.prototype.dom = function () {
        var span = document.createElement("span");
        var v_node = document.createElement("span");
        var s_node = document.createElement("span");
        v_node.style.display = "block";
        s_node.style.display = "block";
        v_node.innerText = value_str(this.value);
        s_node.innerText = suit_str(this.suit);
        span.append(v_node);
        span.append(s_node);
        span.style.color = css_color(this.color);
        span.style.textAlign = "center";
        span.style.fontSize = "18px";
        span.style.border = "1px blue solid";
        span.style.padding = "1px";
        span.style.margin = "2px";
        span.style.display = "inline-block";
        span.style.minWidth = "20px";
        span.style.minHeight = "42px";
        return span;
    };
    return Card;
}());
var CardStack = /** @class */ (function () {
    function CardStack(cards) {
        this.cards = cards;
        this.stack_type = this.get_stack_type();
    }
    CardStack.prototype.get_stack_type = function () {
        var cards = this.cards;
        if (cards.length <= 1) {
            return "incomplete" /* StackType.INCOMPLETE */;
        }
        var provisional_stack_type = cards[0].with(cards[1]);
        if (provisional_stack_type === "bogus" /* StackType.BOGUS */) {
            return "bogus" /* StackType.BOGUS */;
        }
        if (cards.length === 2) {
            return "incomplete" /* StackType.INCOMPLETE */;
        }
        function any_dup_card(card, rest) {
            if (rest.length === 0) {
                return false;
            }
            if (card.with(rest[0]) === "dup" /* StackType.DUP */) {
                return true;
            }
            return any_dup_card(card, rest.slice(1));
        }
        function has_dups(cards) {
            if (cards.length <= 1) {
                return false;
            }
            return (any_dup_card(cards[0], cards.slice(1)) ||
                has_dups(cards.slice(1)));
        }
        // Prevent dups within a provisional SET.
        if (provisional_stack_type === "set" /* StackType.SET */) {
            if (has_dups(cards)) {
                return "dup" /* StackType.DUP */;
            }
        }
        function is_consistent(cards) {
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
            return "bogus" /* StackType.BOGUS */;
        }
        // HAPPY PATH! We have a stack that can stay on the board!
        return provisional_stack_type;
    };
    CardStack.prototype.str = function () {
        return this.cards.map(function (card) { return card.str(); }).join(",");
    };
    CardStack.prototype.dom = function () {
        var div = document.createElement("div");
        for (var _i = 0, _a = this.cards; _i < _a.length; _i++) {
            var card = _a[_i];
            div.append(card.dom());
        }
        return div;
    };
    return CardStack;
}());
var Deck = /** @class */ (function () {
    function Deck(info) {
        this.cards = [];
        this.shuffled = info.shuffled;
        // Do this the non-fancy way.
        var all_suits = [
            3 /* Suit.HEART */,
            2 /* Suit.SPADE */,
            1 /* Suit.DIAMOND */,
            0 /* Suit.CLUB */,
            3 /* Suit.HEART */,
            2 /* Suit.SPADE */,
            1 /* Suit.DIAMOND */,
            0 /* Suit.CLUB */,
        ];
        var all_card_values = [
            1 /* CardValue.ACE */,
            2 /* CardValue.TWO */,
            3 /* CardValue.THREE */,
            4 /* CardValue.FOUR */,
            5 /* CardValue.FIVE */,
            6 /* CardValue.SIX */,
            7 /* CardValue.SEVEN */,
            8 /* CardValue.EIGHT */,
            9 /* CardValue.NINE */,
            10 /* CardValue.TEN */,
            11 /* CardValue.JACK */,
            12 /* CardValue.QUEEN */,
            13 /* CardValue.KING */,
        ];
        function suit_run(suit) {
            return all_card_values.map(function (card_value) { return new Card(card_value, suit); });
        }
        var all_runs = all_suits.map(function (suit) { return suit_run(suit); });
        // Use the old-school idiom to flatten the array.
        var all_cards = all_runs.reduce(function (acc, lst) { return acc.concat(lst); });
        this.cards = all_cards;
    }
    Deck.prototype.str = function () {
        return this.cards.map(function (card) { return card.str(); }).join(" ");
    };
    return Deck;
}());
var Example = /** @class */ (function () {
    function Example(comment, cards, expected_type) {
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
    Example.prototype.dom = function () {
        var div = document.createElement("div");
        div.style.display = "flex";
        div.append(this.stack.dom());
        div.append(document.createTextNode(this.comment));
        return div;
    };
    return Example;
}());
function get_examples() {
    var da = new Card(1 /* CardValue.ACE */, 1 /* Suit.DIAMOND */);
    var sa = new Card(1 /* CardValue.ACE */, 2 /* Suit.SPADE */);
    var s2 = new Card(2 /* CardValue.TWO */, 2 /* Suit.SPADE */);
    var d3 = new Card(3 /* CardValue.THREE */, 1 /* Suit.DIAMOND */);
    var h3 = new Card(3 /* CardValue.THREE */, 3 /* Suit.HEART */);
    var s3 = new Card(3 /* CardValue.THREE */, 2 /* Suit.SPADE */);
    var d4 = new Card(4 /* CardValue.FOUR */, 1 /* Suit.DIAMOND */);
    var h4 = new Card(4 /* CardValue.FOUR */, 3 /* Suit.HEART */);
    var s4 = new Card(4 /* CardValue.FOUR */, 2 /* Suit.SPADE */);
    var s5 = new Card(5 /* CardValue.FIVE */, 2 /* Suit.SPADE */);
    var c10 = new Card(10 /* CardValue.TEN */, 0 /* Suit.CLUB */);
    var d10 = new Card(10 /* CardValue.TEN */, 1 /* Suit.DIAMOND */);
    var h10 = new Card(10 /* CardValue.TEN */, 3 /* Suit.HEART */);
    var s10 = new Card(10 /* CardValue.TEN */, 2 /* Suit.SPADE */);
    var hj = new Card(11 /* CardValue.JACK */, 3 /* Suit.HEART */);
    var hq = new Card(12 /* CardValue.QUEEN */, 3 /* Suit.HEART */);
    var ck = new Card(13 /* CardValue.KING */, 0 /* Suit.CLUB */);
    var sk = new Card(13 /* CardValue.KING */, 2 /* Suit.SPADE */);
    return [
        new Example("SET of 3s", [h3, s3, d3], "set" /* StackType.SET */),
        new Example("SET of 10s", [h10, s10, d10, c10], "set" /* StackType.SET */),
        new Example("PURE RUN of hearts", [h10, hj, hq], "pure run" /* StackType.PURE_RUN */),
        new Example("PURE RUN around the ace", [sk, sa, s2, s3, s4, s5], "pure run" /* StackType.PURE_RUN */),
        new Example("RED-BLACK RUN with three cards", [s3, d4, s5], "red/black alternating" /* StackType.RED_BLACK_RUN */),
        new Example("RED-BLACK RUN around the ace", [hq, ck, da, s2, d3], "red/black alternating" /* StackType.RED_BLACK_RUN */),
        new Example("INCOMPLETE (but a good start)", [s3, d4], "incomplete" /* StackType.INCOMPLETE */),
        new Example("ILLEGAL! No dups allowed.", [h3, s3, h3], "dup" /* StackType.DUP */),
        new Example("non sensical", [s3, d4, h4], "bogus" /* StackType.BOGUS */),
    ];
}
function test() {
    var deck = new Deck({ shuffled: false });
    console.log(deck.str());
    get_examples(); // run for side effects
}
function gui() {
    var examples = get_examples();
    for (var _i = 0, examples_1 = examples; _i < examples_1.length; _i++) {
        var example = examples_1[_i];
        document.body.append(example.dom());
    }
}
test();
