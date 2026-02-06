let CurrentBoard: Board;

class Board {
    /*
        This is where the players lay out all the common cards.
        In the in-person game the "board" would be the table that
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

