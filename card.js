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
            return "incomplete" /* CardStackType.INCOMPLETE */;
        }
        var provisional_stack_type = cards[0].with(cards[1]);
        if (provisional_stack_type === "bogus" /* CardStackType.BOGUS */) {
            return "bogus" /* CardStackType.BOGUS */;
        }
        if (cards.length === 2) {
            return "incomplete" /* CardStackType.INCOMPLETE */;
        }
        function any_dup_card(card, rest) {
            if (rest.length === 0) {
                return false;
            }
            if (card.equals(rest[0])) {
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
        if (provisional_stack_type === "set" /* CardStackType.SET */) {
            if (has_dups(cards)) {
                return "dup" /* CardStackType.DUP */;
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
            return "bogus" /* CardStackType.BOGUS */;
        }
        // HAPPY PATH! We have a stack that can stay on the board!
        return provisional_stack_type;
    };
    CardStack.prototype.str = function () {
        return this.cards.map(function (card) { return card.str(); }).join(",");
    };
    return CardStack;
}());
var Deck = /** @class */ (function () {
    function Deck(info) {
        this.cards = [];
        this.shuffled = info.shuffled;
        function suit_run(suit) {
            return all_card_values.map(function (card_value) { return new Card(card_value, suit); });
        }
        var all_runs = all_suits.map(function (suit) { return suit_run(suit); });
        // 2 decks
        var all_runs2 = __spreadArray(__spreadArray([], all_runs, true), all_runs, true);
        // Use the old-school idiom to flatten the array.
        var all_cards = all_runs2.reduce(function (acc, lst) { return acc.concat(lst); });
        this.cards = all_cards;
        if (this.shuffled) {
            this.cards = shuffle(this.cards);
        }
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
        var top_cards = cards.slice(offset);
        this.cards = cards.slice(0, offset);
        return top_cards;
    };
    return Deck;
}());
var Hand = /** @class */ (function () {
    function Hand() {
        this.cards = [];
    }
    Hand.prototype.add_cards = function (cards) {
        this.cards = this.cards.concat(cards);
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
var Game = /** @class */ (function () {
    function Game() {
        this.players = [new Player("Player One"), new Player("Player Two")];
        this.deck = new Deck({ shuffled: true });
    }
    Game.prototype.deal_cards = function () {
        for (var _i = 0, _a = this.players; _i < _a.length; _i++) {
            var player = _a[_i];
            var cards = this.deck.take_from_top(15);
            player.hand.add_cards(cards);
        }
    };
    return Game;
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
    return Example;
}());
var PhysicalExample = /** @class */ (function () {
    function PhysicalExample(example) {
        this.example = example;
    }
    PhysicalExample.prototype.dom = function () {
        var example = this.example;
        var physical_stack = new PhysicalCardStack(example.stack);
        var div = document.createElement("div");
        div.style.paddingBottom = "11px";
        var heading = document.createElement("div");
        heading.innerText = example.comment;
        heading.style.color = physical_stack.stack_color();
        heading.style.fontSize = "17px";
        heading.style.fontWeight = "bold";
        heading.style.paddingBottom = "2px";
        var card_stack_dom = physical_stack.dom();
        div.append(heading);
        div.append(card_stack_dom);
        return div;
    };
    return PhysicalExample;
}());
var PhysicalExamples = /** @class */ (function () {
    function PhysicalExamples() {
    }
    PhysicalExamples.prototype.dom = function () {
        var div = document.createElement("div");
        var h3 = document.createElement("h3");
        h3.innerText = "Examples";
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
        div.append(panel);
        return div;
    };
    return PhysicalExamples;
}());
var PhysicalHand = /** @class */ (function () {
    function PhysicalHand(hand) {
        this.hand = hand;
    }
    PhysicalHand.prototype.dom = function () {
        var hand = this.hand;
        var div = document.createElement("div");
        for (var _i = 0, all_suits_1 = all_suits; _i < all_suits_1.length; _i++) {
            var suit = all_suits_1[_i];
            var suit_cards = [];
            for (var _a = 0, _b = hand.cards; _a < _b.length; _a++) {
                var card = _b[_a];
                if (card.suit === suit) {
                    suit_cards.push(card);
                }
            }
            if (suit_cards.length > 0) {
                suit_cards.sort(function (card1, card2) { return card1.value - card2.value; });
                console.log(suit_cards);
                var suit_div = document.createElement("div");
                suit_div.style.paddingBottom = "3px";
                for (var _c = 0, suit_cards_1 = suit_cards; _c < suit_cards_1.length; _c++) {
                    var card = suit_cards_1[_c];
                    var physical_card = new PhysicalCard(card);
                    suit_div.append(physical_card.dom());
                }
                div.append(suit_div);
            }
        }
        return div;
    };
    return PhysicalHand;
}());
var PhysicalPlayer = /** @class */ (function () {
    function PhysicalPlayer(player) {
        this.player = player;
    }
    PhysicalPlayer.prototype.dom = function () {
        var player = this.player;
        var div = document.createElement("div");
        var h3 = document.createElement("h3");
        h3.innerText = player.name;
        div.append(h3);
        var physical_hand = new PhysicalHand(player.hand);
        div.append(physical_hand.dom());
        return div;
    };
    return PhysicalPlayer;
}());
var PhysicalGame = /** @class */ (function () {
    function PhysicalGame(player_area) {
        this.game = new Game();
        this.game.deal_cards();
        this.player_area = player_area;
    }
    PhysicalGame.prototype.start = function () {
        var player = this.game.players[0];
        var physical_player = new PhysicalPlayer(player);
        this.player_area.append(physical_player.dom());
        // TODO: create PhysicalDeck
        var deck_dom = document.createElement("div");
        deck_dom.innerText = "".concat(this.game.deck.size(), " cards in deck");
        this.player_area.append(deck_dom);
    };
    return PhysicalGame;
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
        s_node.style.display = "block";
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
    };
    return PhysicalCard;
}());
var PhysicalCardStack = /** @class */ (function () {
    function PhysicalCardStack(stack) {
        this.stack = stack;
    }
    PhysicalCardStack.prototype.dom = function () {
        var div = document.createElement("div");
        for (var _i = 0, _a = this.stack.cards; _i < _a.length; _i++) {
            var card = _a[_i];
            var physical_card = new PhysicalCard(card);
            div.append(physical_card.dom());
        }
        return div;
    };
    PhysicalCardStack.prototype.stack_color = function () {
        switch (this.stack.stack_type) {
            case "dup" /* CardStackType.DUP */:
            case "bogus" /* CardStackType.BOGUS */:
                return "red";
            case "incomplete" /* CardStackType.INCOMPLETE */:
                return "lightred";
            default:
                return "green";
        }
    };
    return PhysicalCardStack;
}());
var MainPage = /** @class */ (function () {
    function MainPage() {
        this.page = document.createElement("div");
        this.page.style.display = "flex";
        this.page.style.width = "100%";
        this.player_area = document.createElement("div");
        this.player_area.style.paddingRight = "20px";
        this.player_area.style.marginRight = "20px";
        this.player_area.style.borderRight = "1px gray solid";
        this.common_area = document.createElement("div");
        this.common_area.style.paddingLeft = "20px";
        this.page.append(this.player_area);
        this.page.append(this.common_area);
    }
    MainPage.prototype.start = function () {
        var examples = new PhysicalExamples();
        this.common_area.append(examples.dom());
        document.body.append(this.page);
        var physical_game = new PhysicalGame(this.player_area);
        physical_game.start();
    };
    return MainPage;
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
    var hk = new Card(13 /* CardValue.KING */, 3 /* Suit.HEART */);
    var sk = new Card(13 /* CardValue.KING */, 2 /* Suit.SPADE */);
    var good = [
        new Example("SET of 3s", [h3, s3, d3], "set" /* CardStackType.SET */),
        new Example("SET of 10s", [h10, s10, d10, c10], "set" /* CardStackType.SET */),
        new Example("PURE RUN of hearts", [h10, hj, hq], "pure run" /* CardStackType.PURE_RUN */),
        new Example("PURE RUN around the ace", [sk, sa, s2, s3, s4, s5], "pure run" /* CardStackType.PURE_RUN */),
        new Example("RED-BLACK RUN with three cards", [s3, d4, s5], "red/black alternating" /* CardStackType.RED_BLACK_RUN */),
        new Example("RED-BLACK RUN around the ace", [hq, ck, da, s2, d3], "red/black alternating" /* CardStackType.RED_BLACK_RUN */),
    ];
    var bad = [
        new Example("INCOMPLETE (set of kings)", [ck, sk], "incomplete" /* CardStackType.INCOMPLETE */),
        new Example("INCOMPLETE (pure run of hearts)", [hq, hk], "incomplete" /* CardStackType.INCOMPLETE */),
        new Example("INCOMPLETE (red-black run)", [s3, d4], "incomplete" /* CardStackType.INCOMPLETE */),
        new Example("ILLEGAL! No dups allowed.", [h3, s3, h3], "dup" /* CardStackType.DUP */),
        new Example("non sensical", [s3, d4, h4], "bogus" /* CardStackType.BOGUS */),
    ];
    return { good: good, bad: bad };
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
function test() {
    var deck = new Deck({ shuffled: true });
    console.log(deck.str());
    get_examples(); // run for side effects
}
test();
