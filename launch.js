

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
        button.style.cursor = "pointer";
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
    welcome_button.style.cursor = "pointer";
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
        cat_div.style.cursor = "pointer";

        cat_div.addEventListener("click", () => {
            Popup.show({
                content:
                    "Stop poking me!\
                    \n\
                    \nI'm trying to take a nap!\
                    \n\
                    \nGo play Lyn Rummy while I sleep, please.",
                type: "warning",
                confirm_button_text: "Ok, Oliver",
                admin: Admin.OLIVER,
                callback() {
                    self.start_actual_game();
                },
            });
        });

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


        const self = this;

        setTimeout(() => {
            self.show_professor();
        }, 100);

    show_professor(): void {
        Popup.show({
            content:
                "Welcome to Lyn Rummy!\
                \n\
                \nNewbies:\
                \n\
                \n    1) Drag a card from your hand straight to a pile!\
                \n\
                \n       (But it must extend a run, set, or alternating run.)\
                \n\
                \n    2) If you have full piles in your hand:\
                \n\
                \n         a) Drag the first card to the top shelf.\
                \n         b) Drag the rest of the cards on top of your growing pile.\
                \n\
                \nExperts:\
                \n\
                \n    1) Click on end cards to split them off.\
                \n    2) Click in the middle of a pile for trickier moves.\
                \n    3) Drag hand cards out to the top shelf if you need to.\
                \n    4) Organize the board by dragging piles to empty spots.\
                \n    5) Combine piles together to score more points.\
                \n\
                \nGood luck, and have fun!",
            type: "info",
            confirm_button_text: "Thanks, Mr. Professor!",
            admin: Admin.CAT_PROFESSOR,
            callback() {},
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

