populate_board_area() {
    // DragDropHelper.reset();

    UndoButton = new UndoButtonSingleton();

    this.physical_board = new PhysicalBoard();

    // const physical_game = this;
    const physical_board = this.physical_board;

    /*
    HandCardDragAction = new HandCardDragActionSingleton(
        physical_game,
        physical_board,
    );

    CardStackDragAction = new CardStackDragActionSingleton(physical_board);

    EventManager = new EventManagerSingleton(physical_game);
    */

    this.board_area.innerHTML = "";
    this.board_area.append(physical_board.dom());
}


        for (const physical_shelf of physical_shelves) {
            div.append(physical_shelf.dom());
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

