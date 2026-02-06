
let CardStackDragAction: CardStackDragActionSingleton;

class CardStackDragActionSingleton {
    physical_board: PhysicalBoard;
    dragged_stack_location: StackLocation | undefined;

    constructor(physical_board: PhysicalBoard) {
        this.physical_board = physical_board;
        this.dragged_stack_location = undefined;
    }

    in_progress(): boolean {
        return this.dragged_stack_location !== undefined;
    }

    get_dragged_stack_location(): StackLocation {
        assert(this.dragged_stack_location !== undefined);
        return this.dragged_stack_location;
    }

    start_drag_stack(info: {
        card_stack: CardStack;
        stack_location: StackLocation;
        tray_width: number;
    }): void {
        const { card_stack, stack_location, tray_width } = info;

        const physical_board = this.physical_board;

        this.dragged_stack_location = stack_location;

        physical_board.display_mergeable_stacks_for(card_stack);

        const physical_shelves =
            physical_board.get_physical_shelves_for_stack_drag(stack_location);
        physical_board.display_empty_shelf_spots(physical_shelves, tray_width);
    }

    end_drag_stack(): void {
        const physical_board = this.physical_board;

        physical_board.hide_mergeable_stacks();
        physical_board.hide_empty_spots();
        this.dragged_stack_location = undefined;
    }

    // ACTION
    move_dragged_card_stack_to_end_of_shelf(new_shelf_index: number) {
        const physical_board = this.physical_board;

        const stack_location = this.dragged_stack_location!;

        CurrentBoard.move_card_stack_to_end_of_shelf(
            stack_location,
            new_shelf_index,
        );
    }

    // ACTION
    drop_stack_on_stack(info: {
        source_location: StackLocation;
        target_location: StackLocation;
    }): CardStack | undefined {
        const { source_location, target_location } = info;

        const merged_stack = CurrentBoard.merge_card_stacks({
            source: source_location,
            target: target_location,
        });

        if (merged_stack === undefined) {
            console.log(
                "unexpected merged failure!",
                source_location,
                target_location,
            );
            return undefined;
        }

        return merged_stack;
    }
}

let HandCardDragAction: HandCardDragActionSingleton;

class HandCardDragActionSingleton {
    physical_game: PhysicalGame;
    physical_board: PhysicalBoard;
    dragged_hand_card: HandCard | undefined;

    constructor(physical_game: PhysicalGame, physical_board: PhysicalBoard) {
        this.physical_game = physical_game;
        this.physical_board = physical_board;
        this.dragged_hand_card = undefined;
    }

    in_progress(): boolean {
        return this.dragged_hand_card !== undefined;
    }

    get_card(): HandCard {
        return this.dragged_hand_card!;
    }

    start_drag_hand_card(info: {
        hand_card: HandCard;
        tray_width: number;
    }): void {
        const { hand_card, tray_width } = info;
        const physical_board = this.physical_board;
        const top_physical_shelf = physical_board.top_physical_shelf();

        physical_board.display_mergeable_stacks_for_card(hand_card);
        physical_board.display_empty_shelf_spots(
            [top_physical_shelf],
            tray_width,
        );

        this.dragged_hand_card = hand_card;
    }

    end_drag_hand_card(): void {
        this.dragged_hand_card = undefined;
        this.physical_board.hide_mergeable_stacks();
        this.physical_board.hide_empty_spots();
    }

    get_physical_hand(): PhysicalHand {
        return this.physical_game.get_physical_hand();
    }

    get_current_physical_player() {
        const player_idx = TheGame.current_player_index;
        return PlayerArea.get_physical_player(player_idx);
    }

    // ACTION
    merge_hand_card_to_board_stack(
        stack_location: StackLocation,
    ): number | undefined {
        const hand_card = this.dragged_hand_card;
        assert(hand_card !== undefined);
        const physical_hand = this.get_physical_hand();
        const physical_board = this.physical_board;

        const stack_size = physical_board.extend_stack_with_card(
            stack_location,
            hand_card,
        );
        if (stack_size === undefined) return undefined;
        const physical_player = this.get_current_physical_player();
        physical_player.release_card(hand_card);

        return stack_size;
    }

    // ACTION
    move_card_from_hand_to_board(): void {
        const hand_card = this.dragged_hand_card;
        assert(hand_card !== undefined);
        const physical_board = this.physical_board;
        const physical_hand = this.get_physical_hand();

        const physical_player = this.get_current_physical_player();
        physical_player.release_card(hand_card);
        physical_board.add_card_to_top_shelf(hand_card);

        // no need to call maybe_update_snapshot() here
    }
}

