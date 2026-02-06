
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
    ): CardStack | undefined {
        const card_stacks = this.card_stacks;
        const card_stack = this.card_stacks[stack_index];
        const new_stack = CardStack.from_hand_card(hand_card);
        const longer_stack = CardStack.merge(card_stack, new_stack);
        if (longer_stack === undefined) {
            console.trace(
                "Hand card wasn't mergable with the selected mergable stack",
            );
            return undefined;
        }
        card_stacks[stack_index] = longer_stack;

        return longer_stack;
    }

    split_stack(info: {
        stack_index: number;
        card_index: number;
    }): SplitResult {
        const { stack_index, card_index } = info;
        const card_stacks = this.card_stacks;
        const card_stack = card_stacks[stack_index];
        const board_cards = card_stack.board_cards;

        if (board_cards.length === 1) {
            return SplitResult.DID_NOTHING;
        }

        let left_count = card_index;

        if (left_count + 1 <= board_cards.length / 2) {
            left_count += 1;
        }

        const new_card_arrays = [
            board_cards.slice(0, left_count),
            board_cards.slice(left_count),
        ];

        const new_card_stacks = new_card_arrays.map(
            (arr) => new CardStack(arr),
        );

        card_stacks.splice(stack_index, 1, ...new_card_stacks);
        return SplitResult.SUCCESS;
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

function render_empty_shelf_spot(): HTMLElement {

function create_shelf_is_clean_or_not_emoji(shelf: Shelf): HTMLElement {
    const emoji = document.createElement("span");
    emoji.style.marginBottom = "5px";
    emoji.style.userSelect = "none";

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
    }

    hide() {
        this.div.style.display = "none";
    }

    show(tray_width: number) {
        const self = this;
        const div = this.div;
        const shelf_index = this.shelf_idx;

        div.style.display = "block";
        div.style.width = tray_width + "px";

        const orig_color = div.style.backgroundColor;

        DragDropHelper.accept_drop({
            div,
            on_over() {
                div.style.backgroundColor = "pink";
            },
            on_leave() {
                div.style.backgroundColor = orig_color;
            },
            on_drop() {
                if (HandCardDragAction.in_progress()) {
                    EventManager.move_card_from_hand_to_board();
                } else {
                    EventManager.move_dragged_card_stack_to_end_of_shelf(
                        shelf_index,
                    );
                }
            },
        });
    }

    dom() {
        this.hide();
        return this.div;
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

        const div = this.div;
        const shelf = this.shelf;

        const emoji = create_shelf_is_clean_or_not_emoji(shelf);
        div.append(emoji);

        this.physical_card_stacks = this.build_physical_card_stacks();

        for (const physical_card_stack of this.physical_card_stacks) {
            div.append(physical_card_stack.dom());
        }
        div.append(this.physical_shelf_empty_spot.dom());
    }

    dom(): HTMLElement {
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

            physical_card_stacks.push(physical_card_stack);
        }

        return physical_card_stacks;
    }

    split_stack(info: {
        stack_index: number;
        card_index: number;
    }): SplitResult {
        const result = this.shelf.split_stack(info);
        console.info("STACK", result);
        return result;
    }

    add_singleton_card(hand_card: HandCard) {
        this.shelf.add_singleton_card(hand_card);
    }
}

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
    div.style.minWidth = "100%";
    div.style.alignItems = "flex-end";
    div.style.paddingBottom = "2px";
    div.style.borderBottom = "3px solid blue";
    div.style.marginTop = "3px";
    div.style.marginBottom = "10px";
    div.style.minHeight = "45px";
    return div;
}

