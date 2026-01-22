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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var ShelfCardLocation = /** @class */ (function () {
    function ShelfCardLocation(info) {
        this.shelf_index = info.shelf_index;
        this.stack_index = info.stack_index;
        this.card_index = info.card_index;
        this.card_position = info.card_position;
    }
    return ShelfCardLocation;
}());
var StackLocation = /** @class */ (function () {
    function StackLocation(info) {
        this.shelf_index = info.shelf_index;
        this.stack_index = info.stack_index;
    }
    StackLocation.prototype.equals = function (other) {
        return (this.shelf_index === other.shelf_index &&
            this.stack_index === other.stack_index);
    };
    return StackLocation;
}());
function get_stack_type(cards) {
    /*
        THIS IS THE MOST IMPORTANT FUNCTION OF THE GAME.

        This determines the whole logic of Lyn Rummy.

        You have to have valid, complete stacks, and
        sets can have no dups!
    */
    if (cards.length <= 1) {
        return "incomplete" /* CardStackType.INCOMPLETE */;
    }
    var provisional_stack_type = cards[0].with(cards[1]);
    if (provisional_stack_type === "bogus" /* CardStackType.BOGUS */) {
        return "bogus" /* CardStackType.BOGUS */;
    }
    if (cards.length === 2) {
        return "incomplete" /* CardStackType.INCOMPLETE */;
    }
    // Prevent dups within a provisional SET.
    if (provisional_stack_type === "set" /* CardStackType.SET */) {
        if (has_duplicate_cards(cards)) {
            return "dup" /* CardStackType.DUP */;
        }
    }
    // Prevent mixing up types of stacks.
    if (!follows_consistent_pattern(cards, provisional_stack_type)) {
        return "bogus" /* CardStackType.BOGUS */;
    }
    // HAPPY PATH! We have a stack that can stay on the board!
    return provisional_stack_type;
}
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
function value_for(label) {
    if (label === "10") {
        throw new Error("use T for ten");
    }
    switch (label) {
        case "A":
            return 1 /* CardValue.ACE */;
        case "2":
            return 2 /* CardValue.TWO */;
        case "3":
            return 3 /* CardValue.THREE */;
        case "4":
            return 4 /* CardValue.FOUR */;
        case "5":
            return 5 /* CardValue.FIVE */;
        case "6":
            return 6 /* CardValue.SIX */;
        case "7":
            return 7 /* CardValue.SEVEN */;
        case "8":
            return 8 /* CardValue.EIGHT */;
        case "9":
            return 9 /* CardValue.NINE */;
        case "T":
            return 10 /* CardValue.TEN */;
        case "J":
            return 11 /* CardValue.JACK */;
        case "Q":
            return 12 /* CardValue.QUEEN */;
        case "K":
            return 13 /* CardValue.KING */;
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
        case 1 /* Suit.DIAMOND */:
            return "\u2666";
        case 3 /* Suit.HEART */:
            return "\u2665";
        case 2 /* Suit.SPADE */:
            return "\u2660";
    }
}
function suit_for(label) {
    switch (label) {
        case "C":
            return 0 /* Suit.CLUB */;
        case "D":
            return 1 /* Suit.DIAMOND */;
        case "H":
            return 3 /* Suit.HEART */;
        case "S":
            return 2 /* Suit.SPADE */;
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
// Do this the non-fancy way.
var all_suits = [3 /* Suit.HEART */, 2 /* Suit.SPADE */, 1 /* Suit.DIAMOND */, 0 /* Suit.CLUB */];
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
function build_full_double_deck() {
    // Returns a shuffled deck of 2 packs of normal cards.
    function suit_run(suit) {
        return all_card_values.map(function (card_value) { return new Card(card_value, suit); });
    }
    var all_runs = all_suits.map(function (suit) { return suit_run(suit); });
    // 2 decks
    var all_runs2 = __spreadArray(__spreadArray([], all_runs, true), all_runs, true);
    // Use the old-school idiom to flatten the array.
    var all_cards = all_runs2.reduce(function (acc, lst) { return acc.concat(lst); });
    return shuffle(all_cards);
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
    Card.prototype.equals = function (other_card) {
        return this.value === other_card.value && this.suit === other_card.suit;
    };
    Card.prototype.with = function (other_card) {
        // See if the pair is a promising start to a stack.
        // Do not return INCOMPLETE here. It's obviously
        // not complete in this context, and our caller will
        // understand that.
        if (this.equals(other_card)) {
            return "dup" /* CardStackType.DUP */;
        }
        if (this.value === other_card.value) {
            return "set" /* CardStackType.SET */;
        }
        if (other_card.value === successor(this.value)) {
            if (this.suit === other_card.suit) {
                return "pure run" /* CardStackType.PURE_RUN */;
            }
            else if (this.color !== other_card.color) {
                return "red/black alternating" /* CardStackType.RED_BLACK_RUN */;
            }
        }
        return "bogus" /* CardStackType.BOGUS */;
    };
    Card.from = function (label) {
        var value = value_for(label[0]);
        var suit = suit_for(label[1]);
        return new Card(value, suit);
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
        return get_stack_type(cards);
    };
    CardStack.prototype.str = function () {
        return this.cards.map(function (card) { return card.str(); }).join(",");
    };
    CardStack.prototype.join = function (other_stack) {
        var cards = this.cards.concat(other_stack.cards);
        return new CardStack(cards);
    };
    CardStack.prototype.incomplete = function () {
        return this.stack_type === "incomplete" /* CardStackType.INCOMPLETE */;
    };
    CardStack.prototype.problematic = function () {
        return (this.stack_type === "bogus" /* CardStackType.BOGUS */ ||
            this.stack_type === "dup" /* CardStackType.DUP */);
    };
    CardStack.prototype.marry = function (other_stack) {
        var stack1 = this.join(other_stack);
        if (!stack1.problematic()) {
            return stack1;
        }
        var stack2 = other_stack.join(this);
        if (!stack2.problematic()) {
            return stack2;
        }
        return undefined;
    };
    CardStack.from = function (shorthand) {
        var card_labels = shorthand.split(",");
        var cards = card_labels.map(function (label) { return Card.from(label); });
        return new CardStack(cards);
    };
    return CardStack;
}());
var Shelf = /** @class */ (function () {
    function Shelf(card_stacks) {
        this.card_stacks = card_stacks;
    }
    Shelf.prototype.str = function () {
        var card_stacks = this.card_stacks;
        if (card_stacks.length === 0) {
            return "(empty)";
        }
        return card_stacks.map(function (card_stack) { return card_stack.str(); }).join(" | ");
    };
    Shelf.prototype.is_clean = function () {
        var card_stacks = this.card_stacks;
        for (var _i = 0, card_stacks_1 = card_stacks; _i < card_stacks_1.length; _i++) {
            var card_stack = card_stacks_1[_i];
            if (card_stack.incomplete() || card_stack.problematic()) {
                return false;
            }
        }
        return true;
    };
    Shelf.prototype.split_card_off_end = function (info) {
        var stack_index = info.stack_index, card_index = info.card_index;
        var card_stacks = this.card_stacks;
        var card_stack = card_stacks[stack_index];
        var cards = card_stack.cards;
        var split_card = cards[card_index];
        cards.splice(card_index, 1);
        var new_stack = new CardStack([split_card]);
        if (card_index === 0) {
            card_stacks.splice(stack_index, 0, new_stack);
        }
        else {
            card_stacks.splice(stack_index + 1, 0, new_stack);
        }
    };
    Shelf.prototype.add_singleton_card = function (card) {
        this.card_stacks.push(new CardStack([card]));
    };
    Shelf.from = function (shorthand) {
        var sigs = shorthand.split(" | ");
        var card_stacks = sigs.map(function (sig) { return CardStack.from(sig); });
        return new Shelf(card_stacks);
    };
    return Shelf;
}());
var BookCase = /** @class */ (function () {
    function BookCase(shelves) {
        this.shelves = shelves;
    }
    BookCase.prototype.str = function () {
        return this.shelves.map(function (shelf) { return shelf.str(); }).join("\n");
    };
    BookCase.prototype.get_cards = function () {
        var shelves = this.shelves;
        var result = [];
        for (var _i = 0, shelves_1 = shelves; _i < shelves_1.length; _i++) {
            var shelf = shelves_1[_i];
            for (var _a = 0, _b = shelf.card_stacks; _a < _b.length; _a++) {
                var card_stack = _b[_a];
                for (var _c = 0, _d = card_stack.cards; _c < _d.length; _c++) {
                    var card = _d[_c];
                    result.push(card);
                }
            }
        }
        return result;
    };
    BookCase.prototype.merge_card_stacks = function (info) {
        var shelves = this.shelves;
        var source_shelf_index = info.source.shelf_index;
        var source_stack_index = info.source.stack_index;
        var target_shelf_index = info.target.shelf_index;
        var target_stack_index = info.target.stack_index;
        if (info.source.equals(info.target)) {
            return false;
        }
        var source_shelf = shelves[source_shelf_index];
        var target_shelf = shelves[target_shelf_index];
        var source_stacks = source_shelf.card_stacks;
        var target_stacks = target_shelf.card_stacks;
        var source_stack = source_stacks[source_stack_index];
        var target_stack = target_stacks[target_stack_index];
        var merged_stack = source_stack.marry(target_stack);
        if (merged_stack === undefined) {
            return false;
        }
        source_stacks.splice(source_stack_index, 1);
        target_stacks[target_stack_index] = merged_stack;
        return true;
    };
    return BookCase;
}());
var Deck = /** @class */ (function () {
    function Deck() {
        this.cards = build_full_double_deck();
    }
    Deck.prototype.str = function () {
        return this.cards.map(function (card) { return card.str(); }).join(" ");
    };
    Deck.prototype.size = function () {
        return this.cards.length;
    };
    Deck.prototype.take_from_top = function (cnt) {
        var cards = this.cards;
        var offset = cards.length - cnt;
        var top_cards = cards.splice(offset, cnt);
        return top_cards;
    };
    Deck.prototype.pull_card_from_deck = function (card) {
        remove_card_from_array(this.cards, card);
    };
    return Deck;
}());
function remove_card_from_array(cards, card) {
    for (var i = 0; i < cards.length; ++i) {
        if (cards[i].equals(card)) {
            cards.splice(i, 1);
            return;
        }
    }
    throw new Error("Card to be removed is not present in the array!");
}
var PhysicalDeck = /** @class */ (function () {
    function PhysicalDeck(deck) {
        this.deck = deck;
        this.div = this.make_div();
    }
    PhysicalDeck.prototype.make_div = function () {
        // no real styling yet
        return document.createElement("div");
    };
    PhysicalDeck.prototype.dom = function () {
        this.populate();
        return this.div;
    };
    PhysicalDeck.prototype.populate = function () {
        this.div.innerHTML = "";
        var deck = this.deck;
        var img = document.createElement("img");
        img.src = "deck.png";
        img.style.height = "200px";
        this.div.append(img);
        var span = document.createElement("span");
        span.innerText = "".concat(deck.cards.length, " in deck");
        this.div.append(span);
    };
    PhysicalDeck.prototype.take_from_top = function (cnt) {
        var cards = this.deck.take_from_top(cnt);
        this.populate();
        console.log(cards);
        return cards;
    };
    return PhysicalDeck;
}());
var HandCard = /** @class */ (function () {
    function HandCard(info) {
        this.card = info.card;
        this.is_new = info.is_new;
    }
    return HandCard;
}());
function new_card_color() {
    // kind of a pale yellow
    return "rgba(255, 255, 0, 0.4)";
}
var PhysicalHandCard = /** @class */ (function () {
    function PhysicalHandCard(info) {
        this.hand_card = info.hand_card;
        this.physical_card = info.physical_card;
        this.card_div = this.physical_card.dom();
    }
    PhysicalHandCard.prototype.dom = function () {
        this.card_div.style.cursor = "pointer";
        if (this.hand_card.is_new) {
            this.card_div.style.backgroundColor = new_card_color();
        }
        else {
            this.card_div.style.backgroundColor = "transparent";
        }
        return this.card_div;
    };
    PhysicalHandCard.prototype.add_click_listener = function (physical_game) {
        var _this = this;
        this.card_div.addEventListener("click", function () {
            physical_game.move_card_from_hand_to_top_shelf(_this.hand_card.card);
        });
    };
    return PhysicalHandCard;
}());
var Hand = /** @class */ (function () {
    function Hand() {
        this.hand_cards = [];
    }
    Hand.prototype.add_cards = function (cards) {
        this.hand_cards = this.hand_cards.concat(cards);
    };
    Hand.prototype.remove_card_from_hand = function (card) {
        var hand_cards = this.hand_cards;
        for (var i = 0; i < hand_cards.length; ++i) {
            if (hand_cards[i].card.equals(card)) {
                hand_cards.splice(i, 1);
                return;
            }
        }
        throw new Error("Card to be removed is not present in the array!");
    };
    return Hand;
}());
var Player = /** @class */ (function () {
    function Player(name) {
        this.name = name;
        this.hand = new Hand();
    }
    return Player;
}());
function empty_shelf() {
    return new Shelf([]);
}
function initial_book_case() {
    var shelf1 = new Shelf([
        CardStack.from("KS,AS,2S,3S"),
        CardStack.from("AC,AD,AH"),
    ]);
    var shelf2 = new Shelf([
        CardStack.from("7S,7D,7C"),
        CardStack.from("2C,3D,4C,5H"),
        CardStack.from("6S"),
    ]);
    var shelf3 = new Shelf([CardStack.from("TD,JD,QD,KD")]);
    var shelves = [empty_shelf(), shelf1, shelf2, shelf3];
    for (var i = 0; i < 20; ++i) {
        shelves.push(empty_shelf());
    }
    return new BookCase(shelves);
}
var Game = /** @class */ (function () {
    function Game() {
        this.players = [new Player("Player One"), new Player("Player Two")];
        this.deck = new Deck();
        this.book_case = initial_book_case();
        for (var _i = 0, _a = this.book_case.get_cards(); _i < _a.length; _i++) {
            var card = _a[_i];
            this.deck.pull_card_from_deck(card);
        }
    }
    Game.prototype.deal_cards = function () {
        for (var _i = 0, _a = this.players; _i < _a.length; _i++) {
            var player = _a[_i];
            var cards = this.deck.take_from_top(15);
            player.hand.add_cards(cards.map(function (c) { return new HandCard({ card: c, is_new: false }); }));
        }
    };
    return Game;
}());
var Example = /** @class */ (function () {
    function Example(comment, shorthand, expected_type) {
        this.comment = comment;
        this.stack = CardStack.from(shorthand);
        this.expected_type = expected_type;
        // test it even at runtime
        if (this.stack.stack_type !== expected_type) {
            console.log("\n\n----- PROBLEM!\n\n");
            console.log(this.stack.str());
            console.log(this.stack.stack_type, "is not", expected_type);
        }
    }
    return Example;
}());
var PhysicalCard = /** @class */ (function () {
    function PhysicalCard(card) {
        this.card = card;
    }
    PhysicalCard.prototype.dom = function () {
        var card = this.card;
        var span = document.createElement("span");
        var v_node = document.createElement("span");
        var s_node = document.createElement("span");
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
    };
    return PhysicalCard;
}());
var PhysicalShelfCard = /** @class */ (function () {
    function PhysicalShelfCard(card_location, physical_card) {
        this.card_location = card_location;
        this.physical_card = physical_card;
        this.card_div = this.physical_card.dom();
    }
    PhysicalShelfCard.prototype.dom = function () {
        return this.card_div;
    };
    PhysicalShelfCard.prototype.add_click_listener = function (physical_game) {
        var div = this.card_div;
        var self = this;
        div.style.cursor = "pointer";
        div.addEventListener("click", function (e) {
            physical_game.handle_shelf_card_click(self.card_location);
            e.stopPropagation();
        });
    };
    return PhysicalShelfCard;
}());
function get_card_position(card_index, num_cards) {
    if (num_cards === 1) {
        return 0 /* CardPositionType.LONER */;
    }
    if (card_index === 0 || card_index === num_cards - 1) {
        return 1 /* CardPositionType.AT_END */;
    }
    return 2 /* CardPositionType.IN_MIDDLE */;
}
function build_physical_shelf_cards(stack_location, cards) {
    var physical_shelf_cards = [];
    for (var card_index = 0; card_index < cards.length; ++card_index) {
        var card_position = get_card_position(card_index, cards.length);
        var card = cards[card_index];
        var card_location = new ShelfCardLocation({
            shelf_index: stack_location.shelf_index,
            stack_index: stack_location.stack_index,
            card_index: card_index,
            card_position: card_position,
        });
        var physical_card = new PhysicalCard(card);
        var physical_shelf_card = new PhysicalShelfCard(card_location, physical_card);
        physical_shelf_cards.push(physical_shelf_card);
    }
    return physical_shelf_cards;
}
var PhysicalCardStack = /** @class */ (function () {
    function PhysicalCardStack(physical_game, stack_location, stack) {
        this.physical_game = physical_game;
        this.stack_location = stack_location;
        this.stack = stack;
        this.physical_shelf_cards = build_physical_shelf_cards(stack_location, stack.cards);
        this.div = this.make_div();
        this.selected = false;
    }
    PhysicalCardStack.prototype.make_div = function () {
        var physical_game = this.physical_game;
        var stack_location = this.stack_location;
        var div = document.createElement("div");
        div.style.marginRight = "20px";
        div.addEventListener("click", function () {
            physical_game.handle_stack_click(stack_location);
        });
        return div;
    };
    PhysicalCardStack.prototype.show_as_selected = function () {
        this.selected = true;
        this.div.style.backgroundColor = "cyan";
    };
    PhysicalCardStack.prototype.show_as_un_selected = function () {
        this.selected = false;
        this.div.style.backgroundColor = "transparent";
    };
    PhysicalCardStack.prototype.dom = function () {
        // should only be called once
        var physical_shelf_cards = this.physical_shelf_cards;
        this.populate();
        return this.div;
    };
    PhysicalCardStack.prototype.populate = function () {
        var div = this.div;
        var physical_shelf_cards = this.physical_shelf_cards;
        for (var _i = 0, physical_shelf_cards_1 = physical_shelf_cards; _i < physical_shelf_cards_1.length; _i++) {
            var physical_shelf_card = physical_shelf_cards_1[_i];
            div.append(physical_shelf_card.dom());
        }
    };
    PhysicalCardStack.prototype.set_up_clicks_handlers_for_cards = function () {
        var physical_game = this.physical_game;
        var physical_shelf_cards = this.physical_shelf_cards;
        for (var _i = 0, physical_shelf_cards_2 = physical_shelf_cards; _i < physical_shelf_cards_2.length; _i++) {
            var physical_shelf_card = physical_shelf_cards_2[_i];
            var card_position = physical_shelf_card.card_location.card_position;
            // We may soon support other clicks, but for now,
            // when you click at a card at either end of a stack,
            // it gets split off the stack so that the player
            // can then move that single card to some other stack.
            // (This is part of what makes the game fun.)
            if (card_position === 1 /* CardPositionType.AT_END */) {
                physical_shelf_card.add_click_listener(physical_game);
            }
        }
    };
    return PhysicalCardStack;
}());
function create_shelf_is_clean_or_not_emoji(shelf) {
    var emoji = document.createElement("span");
    emoji.style.marginRight = "10px";
    emoji.style.marginBottom = "5px";
    if (shelf.is_clean()) {
        emoji.innerText = "\u2705"; // green checkmark
    }
    else {
        emoji.innerText = "\u274C"; // red crossmark
    }
    return emoji;
}
var PhysicalShelf = /** @class */ (function () {
    function PhysicalShelf(info) {
        this.physical_game = info.physical_game;
        this.physical_book_case = info.physical_book_case;
        this.shelf_index = info.shelf_index;
        this.shelf = info.shelf;
        this.div = this.make_div();
    }
    PhysicalShelf.prototype.make_div = function () {
        var div = document.createElement("div");
        div.style.display = "flex";
        div.style.minWidth = "600px";
        div.style.alignItems = "flex-end";
        div.style.paddingBottom = "2px";
        div.style.borderBottom = "3px solid blue";
        div.style.marginTop = "3px";
        div.style.marginBottom = "10px";
        div.style.minHeight = "40px"; // TODO - make this more accurate
        return div;
    };
    PhysicalShelf.prototype.dom = function () {
        this.populate();
        return this.div;
    };
    PhysicalShelf.prototype.populate = function () {
        var div = this.div;
        var shelf = this.shelf;
        div.innerHTML = "";
        var emoji = create_shelf_is_clean_or_not_emoji(shelf);
        div.append(emoji);
        this.physical_card_stacks = this.build_physical_card_stacks();
        for (var _i = 0, _a = this.physical_card_stacks; _i < _a.length; _i++) {
            var physical_card_stack = _a[_i];
            div.append(physical_card_stack.dom());
        }
    };
    PhysicalShelf.prototype.build_physical_card_stacks = function () {
        var physical_game = this.physical_game;
        var shelf_index = this.shelf_index;
        var card_stacks = this.shelf.card_stacks;
        var physical_card_stacks = [];
        for (var stack_index = 0; stack_index < card_stacks.length; ++stack_index) {
            var self_1 = this;
            var card_stack = card_stacks[stack_index];
            var stack_location = new StackLocation({
                shelf_index: shelf_index,
                stack_index: stack_index,
            });
            var physical_card_stack = new PhysicalCardStack(physical_game, stack_location, card_stack);
            physical_card_stack.set_up_clicks_handlers_for_cards();
            physical_card_stacks.push(physical_card_stack);
        }
        return physical_card_stacks;
    };
    PhysicalShelf.prototype.split_card_off_end = function (info) {
        this.shelf.split_card_off_end(info);
        this.populate();
    };
    PhysicalShelf.prototype.add_singleton_card = function (card) {
        this.shelf.add_singleton_card(card);
        this.populate();
    };
    return PhysicalShelf;
}());
var PhysicalBookCase = /** @class */ (function () {
    function PhysicalBookCase(physical_game, book_case) {
        this.physical_game = physical_game;
        this.book_case = book_case;
        this.div = this.make_div();
        this.physical_shelves = this.build_physical_shelves();
        this.selected_stack = undefined;
    }
    PhysicalBookCase.prototype.build_physical_shelves = function () {
        var physical_game = this.physical_game;
        var physical_book_case = this;
        var physical_shelves = [];
        var shelves = this.book_case.shelves;
        for (var shelf_index = 0; shelf_index < shelves.length; ++shelf_index) {
            var shelf = shelves[shelf_index];
            var physical_shelf = new PhysicalShelf({
                physical_game: physical_game,
                physical_book_case: physical_book_case,
                shelf_index: shelf_index,
                shelf: shelf,
            });
            physical_shelves.push(physical_shelf);
        }
        return physical_shelves;
    };
    PhysicalBookCase.prototype.handle_stack_click = function (stack_location) {
        var shelf_index = stack_location.shelf_index, stack_index = stack_location.stack_index;
        var physical_shelf = this.physical_shelves[shelf_index];
        var physical_card_stack = physical_shelf.physical_card_stacks[stack_index];
        if (this.selected_stack === undefined) {
            this.selected_stack = stack_location;
            physical_card_stack.show_as_selected();
        }
        else {
            if (stack_location.equals(this.selected_stack)) {
                physical_card_stack.show_as_un_selected();
                this.selected_stack = undefined;
                return;
            }
            var merged = this.book_case.merge_card_stacks({
                source: this.selected_stack,
                target: stack_location,
            });
            if (merged) {
                this.populate_shelf(this.selected_stack.shelf_index);
                this.populate_shelf(shelf_index);
                this.selected_stack = undefined;
            }
            else {
                alert("Not allowed!");
            }
        }
    };
    PhysicalBookCase.prototype.populate_shelf = function (shelf_index) {
        this.physical_shelves[shelf_index].populate();
    };
    PhysicalBookCase.prototype.handle_shelf_card_click = function (card_location) {
        var shelf_index = card_location.shelf_index, stack_index = card_location.stack_index, card_index = card_location.card_index;
        var physical_shelves = this.physical_shelves;
        // Right now the only action when you click on a shelf card
        // is to split it from the end of its stack.
        physical_shelves[shelf_index].split_card_off_end({
            stack_index: stack_index,
            card_index: card_index,
        });
    };
    PhysicalBookCase.prototype.make_div = function () {
        // no special styling for now
        return document.createElement("div");
    };
    PhysicalBookCase.prototype.dom = function () {
        this.populate();
        return this.div;
    };
    PhysicalBookCase.prototype.populate = function () {
        var div = this.div;
        var book_case = this.book_case;
        var physical_shelves = this.physical_shelves;
        var heading = document.createElement("h3");
        heading.innerText = "Shelves";
        div.append(heading);
        for (var _i = 0, physical_shelves_1 = physical_shelves; _i < physical_shelves_1.length; _i++) {
            var physical_shelf = physical_shelves_1[_i];
            div.append(physical_shelf.dom());
        }
    };
    PhysicalBookCase.prototype.add_card_to_top_shelf = function (card) {
        if (this.physical_shelves.length < 1) {
            throw new Error("No top shelf");
        }
        this.physical_shelves[0].add_singleton_card(card);
    };
    return PhysicalBookCase;
}());
function get_sorted_cards_for_suit(suit, hand_cards) {
    var suit_cards = [];
    for (var _i = 0, hand_cards_1 = hand_cards; _i < hand_cards_1.length; _i++) {
        var hand_card = hand_cards_1[_i];
        var card = hand_card.card;
        if (card.suit === suit) {
            suit_cards.push(hand_card);
        }
    }
    suit_cards.sort(function (card1, card2) { return card1.card.value - card2.card.value; });
    return suit_cards;
}
function row_of_cards_in_hand(hand_cards, physical_game) {
    /*
        This can be a pure function, because even though
        users can mutate our row (by clicking a card to put it
        out to the book case), we don't ever have to re-draw
        ourself.  We just let PhysicalHand re-populate the
        entire hand, since the hand is usually super small.
    */
    var div = document.createElement("div");
    div.style.paddingBottom = "10px";
    for (var _i = 0, hand_cards_2 = hand_cards; _i < hand_cards_2.length; _i++) {
        var hand_card = hand_cards_2[_i];
        var physical_card = new PhysicalCard(hand_card.card);
        var physical_hand_card = new PhysicalHandCard({
            physical_card: physical_card,
            hand_card: hand_card,
        });
        physical_hand_card.add_click_listener(physical_game);
        var node = physical_hand_card.dom();
        div.append(node);
    }
    return div;
}
var PhysicalHand = /** @class */ (function () {
    function PhysicalHand(physical_game, hand) {
        this.physical_game = physical_game;
        this.hand = hand;
        this.div = this.make_div();
    }
    PhysicalHand.prototype.make_div = function () {
        // no real styling yet
        return document.createElement("div");
    };
    PhysicalHand.prototype.dom = function () {
        this.populate();
        return this.div;
    };
    PhysicalHand.prototype.populate = function () {
        var physical_game = this.physical_game;
        var div = this.div;
        var cards = this.hand.hand_cards;
        div.innerHTML = "";
        for (var _i = 0, all_suits_1 = all_suits; _i < all_suits_1.length; _i++) {
            var suit = all_suits_1[_i];
            var suit_cards = get_sorted_cards_for_suit(suit, cards);
            if (suit_cards.length > 0) {
                var row = row_of_cards_in_hand(suit_cards, physical_game);
                div.append(row);
            }
        }
    };
    PhysicalHand.prototype.remove_card_from_hand = function (card) {
        this.hand.remove_card_from_hand(card);
        this.populate();
    };
    PhysicalHand.prototype.add_card_to_hand = function (card) {
        this.hand.add_cards([new HandCard({ card: card, is_new: true })]);
        this.populate();
    };
    return PhysicalHand;
}());
var PhysicalPlayer = /** @class */ (function () {
    function PhysicalPlayer(physical_game, player) {
        this.physical_game = physical_game;
        this.player = player;
        this.physical_hand = new PhysicalHand(physical_game, player.hand);
    }
    PhysicalPlayer.prototype.dom = function () {
        var _this = this;
        var player = this.player;
        var div = document.createElement("div");
        var h3 = document.createElement("h3");
        h3.innerText = player.name;
        div.append(h3);
        div.append(this.physical_hand.dom());
        var pick_card_button = document.createElement("button");
        pick_card_button.innerText = "Pick new card";
        pick_card_button.addEventListener("click", function () {
            _this.physical_game.move_card_from_deck_to_hand();
        });
        div.append(pick_card_button);
        return div;
    };
    return PhysicalPlayer;
}());
var PhysicalGame = /** @class */ (function () {
    function PhysicalGame(info) {
        var physical_game = this;
        this.game = new Game();
        this.game.deal_cards();
        this.player_area = info.player_area;
        this.book_case_area = info.book_case_area;
        this.physical_deck = new PhysicalDeck(this.game.deck);
        var player = this.game.players[0];
        this.physical_book_case = new PhysicalBookCase(physical_game, this.game.book_case);
        this.physical_player = new PhysicalPlayer(physical_game, player);
    }
    // ACTION - we would send this over wire for multi-player game
    PhysicalGame.prototype.handle_shelf_card_click = function (card_location) {
        this.physical_book_case.handle_shelf_card_click(card_location);
    };
    // ACTION! (We will need to broadcast this when we
    // get to multi-player.)
    PhysicalGame.prototype.move_card_from_hand_to_top_shelf = function (card) {
        this.physical_player.physical_hand.remove_card_from_hand(card);
        this.physical_book_case.add_card_to_top_shelf(card);
    };
    // ACTION!
    PhysicalGame.prototype.move_card_from_deck_to_hand = function () {
        var card = this.physical_deck.take_from_top(1)[0];
        this.physical_player.physical_hand.add_card_to_hand(card);
    };
    // ACTION!
    PhysicalGame.prototype.handle_stack_click = function (stack_location) {
        this.physical_book_case.handle_stack_click(stack_location);
    };
    PhysicalGame.prototype.start = function () {
        var game = this.game;
        this.player_area.innerHTML = "";
        this.player_area.append(this.physical_player.dom());
        var deck_dom = this.physical_deck.dom();
        this.player_area.append(deck_dom);
        // populate common area
        this.book_case_area.replaceWith(this.physical_book_case.dom());
    };
    return PhysicalGame;
}());
function heading_for_example_card_stack(opts) {
    var comment = opts.comment, color = opts.color;
    var heading = document.createElement("div");
    heading.innerText = comment;
    heading.style.color = color;
    heading.style.fontSize = "17px";
    heading.style.fontWeight = "bold";
    heading.style.paddingBottom = "2px";
    return heading;
}
function div_for_example_card_stack(stack) {
    var physical_shelf_cards = this.physical_shelf_cards;
    var div = document.createElement("div");
    for (var _i = 0, _a = stack.cards; _i < _a.length; _i++) {
        var card = _a[_i];
        var physical_card = new PhysicalCard(card);
        div.append(physical_card.dom());
    }
    return div;
}
function color_for_example_stack(stack) {
    switch (stack.stack_type) {
        case "dup" /* CardStackType.DUP */:
        case "bogus" /* CardStackType.BOGUS */:
            return "red";
        case "incomplete" /* CardStackType.INCOMPLETE */:
            return "lightred";
        default:
            return "green";
    }
}
var PhysicalExample = /** @class */ (function () {
    function PhysicalExample(example) {
        this.example = example;
    }
    PhysicalExample.prototype.dom = function () {
        var stack = this.example.stack;
        var comment = this.example.comment;
        var card_stack_div = div_for_example_card_stack(stack);
        var color = color_for_example_stack(stack);
        var heading = heading_for_example_card_stack({ comment: comment, color: color });
        var div = document.createElement("div");
        div.style.paddingBottom = "11px";
        div.append(heading);
        div.append(card_stack_div);
        return div;
    };
    return PhysicalExample;
}());
var PhysicalExamples = /** @class */ (function () {
    function PhysicalExamples(area) {
        this.area = area;
    }
    PhysicalExamples.prototype.start = function (opts) {
        var _this = this;
        var div = document.createElement("div");
        var h3 = document.createElement("h3");
        h3.innerText = "Examples";
        var button = document.createElement("button");
        button.innerText = "Got it!";
        var panel = document.createElement("div");
        panel.style.display = "flex";
        panel.style.justifyContent = "space-around";
        var good_column = document.createElement("div");
        var bad_column = document.createElement("div");
        for (var _i = 0, _a = [good_column, bad_column]; _i < _a.length; _i++) {
            var column = _a[_i];
            column.style.paddingLeft = "15px";
            column.style.paddingRight = "15px";
        }
        var examples = get_examples();
        for (var _b = 0, _c = examples.good; _b < _c.length; _b++) {
            var example = _c[_b];
            var physical_example = new PhysicalExample(example);
            good_column.append(physical_example.dom());
        }
        for (var _d = 0, _e = examples.bad; _d < _e.length; _d++) {
            var example = _e[_d];
            var physical_example = new PhysicalExample(example);
            bad_column.append(physical_example.dom());
        }
        panel.append(good_column);
        panel.append(bad_column);
        div.append(h3);
        div.append(button);
        div.append(panel);
        button.addEventListener("click", function () {
            _this.area.innerHTML = "";
            opts.on_dismiss_callback();
        });
        this.area.append(div);
    };
    return PhysicalExamples;
}());
function create_welcome_button() {
    // TODO: This is badly in need of better styling!
    var welcome_button = document.createElement("button");
    welcome_button.style.background = "white";
    welcome_button.style.color = "green";
    welcome_button.style.padding = "3px";
    welcome_button.style.margin = "10px";
    welcome_button.style.fontSize = "30px";
    welcome_button.innerText = "Begin Game!";
    return welcome_button;
}
var MainPage = /** @class */ (function () {
    function MainPage() {
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
        var left_panel = document.createElement("div");
        left_panel.append(this.welcome_area);
        left_panel.append(this.player_area);
        var right_panel = document.createElement("div");
        right_panel.append(this.examples_area);
        right_panel.append(this.book_case_area);
        this.page.append(left_panel);
        this.page.append(right_panel);
    }
    MainPage.prototype.start = function () {
        var self = this;
        var welcome_area = this.welcome_area;
        var examples_area = this.examples_area;
        var welcome = document.createElement("div");
        welcome.innerText = "Welcome to Lyn Rummy!";
        welcome.style.color = "green";
        welcome.style.fontWeight = "bold";
        var welcome_button = create_welcome_button();
        welcome_button.addEventListener("click", function () {
            self.start_actual_game();
        });
        welcome_area.append(welcome);
        welcome_area.append(welcome_button);
        var examples = new PhysicalExamples(examples_area);
        examples.start({
            on_dismiss_callback: function () {
                self.start_actual_game();
            },
        });
        document.body.append(this.page);
    };
    MainPage.prototype.start_actual_game = function () {
        var welcome_area = this.welcome_area;
        var examples_area = this.examples_area;
        var player_area = this.player_area;
        var book_case_area = this.book_case_area;
        welcome_area.innerHTML = "";
        examples_area.innerHTML = "";
        // We get called back one the player dismisses the examples.
        var physical_game = new PhysicalGame({
            player_area: player_area,
            book_case_area: book_case_area,
        });
        physical_game.start();
    };
    return MainPage;
}());
function get_examples() {
    var good = [
        new Example("SET of 3s", "3H,3S,3D", "set" /* CardStackType.SET */),
        new Example("SET of Jacks", "JH,JS,JD,JC", "set" /* CardStackType.SET */),
        new Example("PURE RUN of hearts", "TH,JH,QH", "pure run" /* CardStackType.PURE_RUN */),
        new Example("PURE RUN around the ace", "KS,AS,2S,3S,4S,5S", "pure run" /* CardStackType.PURE_RUN */),
        new Example("RED-BLACK RUN with three cards", "3S,4D,5C", "red/black alternating" /* CardStackType.RED_BLACK_RUN */),
        new Example("RED-BLACK RUN around the ace", "QH,KC,AD,2S,3D", "red/black alternating" /* CardStackType.RED_BLACK_RUN */),
    ];
    var bad = [
        new Example("INCOMPLETE (set of kings)", "KC,KS", "incomplete" /* CardStackType.INCOMPLETE */),
        new Example("INCOMPLETE (pure run of hearts)", "QH,KH", "incomplete" /* CardStackType.INCOMPLETE */),
        new Example("INCOMPLETE (red-black run)", "3S,4D", "incomplete" /* CardStackType.INCOMPLETE */),
        new Example("ILLEGAL! No dups allowed.", "3H,3S,3H", "dup" /* CardStackType.DUP */),
        new Example("non sensical", "3S,4D,4H", "bogus" /* CardStackType.BOGUS */),
    ];
    return { good: good, bad: bad };
}
function has_duplicate_cards(cards) {
    function any_dup_card(card, rest) {
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
    return (any_dup_card(cards[0], cards.slice(1)) ||
        has_duplicate_cards(cards.slice(1)));
}
function follows_consistent_pattern(cards, stack_type) {
    if (cards.length <= 1) {
        return true;
    }
    if (cards[0].with(cards[1]) !== stack_type) {
        return false;
    }
    return follows_consistent_pattern(cards.slice(1), stack_type);
}
function shuffle(array) {
    var _a;
    for (var i = array.length - 1; i > 0; i--) {
        // Pick a random index from 0 to i
        var j = Math.floor(Math.random() * (i + 1));
        // Swap elements at i and j
        _a = [array[j], array[i]], array[i] = _a[0], array[j] = _a[1];
    }
    return array;
}
function gui() {
    var ui = new MainPage();
    ui.start();
}
function example_book_case() {
    return new BookCase([
        Shelf.from("AC"),
        Shelf.from("AH | 2C | 5S,6S,7S | 4D | 8S,9S | 6C"),
    ]);
}
function test_merge() {
    var book_case = example_book_case();
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
    var game = new Game();
    get_examples(); // run for side effects
    test_merge();
}
test();
