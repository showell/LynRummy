
let EventManager: EventManagerSingleton;

class EventManagerSingleton {
    physical_game: PhysicalGame;
    physical_board: PhysicalBoard;
    game: Game;

    constructor(physical_game: PhysicalGame) {
        this.physical_game = physical_game;
        assert(physical_game.physical_board !== undefined);
        this.physical_board = physical_game.physical_board;
        this.game = TheGame;
    }

    // COMPLETE TURN

    maybe_complete_turn(): void {
        const physical_game = this.physical_game;
        const self = this;

        const turn_result = TheGame.complete_turn();

        switch (turn_result) {
            case CompleteTurnResult.FAILURE:
                SoundEffects.play_purr_sound();
                Popup.show({
                    content: `The board is not clean!\
                        \n\n(nor is my litter box)\
                        \n\nUse the "Undo mistakes" button if you need to.`,
                    confirm_button_text: "Oy vey, ok",
                    type: "warning",
                    admin: Admin.ANGRY_CAT,
                    callback() {},
                });
                return;

            case CompleteTurnResult.SUCCESS_BUT_NEEDS_CARDS:
                SoundEffects.play_purr_sound();
                Popup.show({
                    content:
                        "You didn't make any progress at all.\
                        \n\
                        \nI'm going back to my nap!\
                        \n\
                        \nYou will get 3 new cards on your next hand.",
                    type: "warning",
                    confirm_button_text: "Meh",
                    admin: Admin.OLIVER,
                    callback() {
                        continue_on_to_next_turn();
                    },
                });
                break;

            case CompleteTurnResult.SUCCESS_AS_VICTOR: {
                const turn_score = ActivePlayer.get_turn_score();
                // Only play this for the first time a player gets
                // rid of all the cards in their hand.
                SoundEffects.play_victory_sound();
                Popup.show({
                    content: `Let’s be honest: this world is basically yours. We’re all just living in your empire!\
                        \n\
                        \nThat said, I, award you 1500 extra points for being the first person to clear your hand!\
                        \n\
                        \nThat fetches you a total of ${turn_score} points for this turn.\
                        \n\
                        \nYou get a bonus every time you clear your hand.\
                        \n\
                        \nYou also get five more cards on the next turn.\
                        \n\
                        \nKeep winning!`,
                    type: "success",
                    admin: Admin.STEVE,
                    confirm_button_text: "I am the chosen one!",
                    callback() {
                        continue_on_to_next_turn();
                    },
                });
                break;
            }

            case CompleteTurnResult.SUCCESS_WITH_HAND_EMPTIED: {
                const turn_score = ActivePlayer.get_turn_score();
                Popup.show({
                    content: `WOOT!\
                    \n\
                    \nLooks like you got rid of all your cards!\
                    \n\
                    \nI am rewarding you extra points for that!\
                    \n\
                    \nYour scored a whopping ${turn_score} for this turn!!\
                    \n\
                    \nYou get a bonus every time you clear your hand.\
                    \n\
                    \nWe will deal you 5 more cards if you get back on the road.`,
                    admin: Admin.STEVE,
                    confirm_button_text: "Back on the road!",
                    callback() {
                        continue_on_to_next_turn();
                    },
                    type: "success",
                });
                break;
            }

            case CompleteTurnResult.SUCCESS:
                const turn_score = ActivePlayer.get_turn_score();

                if (turn_score > 600) {
                    // This is Steve saying "Nice!" in a very bad
                    // audio recording. We only play it once during
                    // the game.
                    SoundEffects.play_nice_sound();
                }

                Popup.show({
                    content: `Good job!\
                         \n\
                         \nI am rewarding you with ${turn_score} points for this turn!\
                         \n\
                         \nLet's see how your opponent does! (oh yeah, that's you again)`,
                    type: "success",
                    confirm_button_text: "See if they can try!",
                    admin: Admin.STEVE,
                    callback() {
                        continue_on_to_next_turn();
                    },
                });
                break;
        }

        function continue_on_to_next_turn() {
            CurrentBoard.age_cards();
            TheGame.advance_turn_to_next_player();
            ActivePlayer.start_turn();

            TheGame.update_snapshot();

            PlayerArea.populate();
            physical_game.populate_board_area();

            StatusBar.update_text(
                `${ActivePlayer.name}, you may begin your turn.`,
            );
        }
    }

    // Undo mistakes

    undo_mistakes(): void {
        this.physical_game.rollback_moves_to_last_clean_state();
        StatusBar.update_text("PHEW!");
        this.physical_game.populate_board_area();
    }

    // SPLITTING UP STACKS
    split_stack(card_location: BoardLocation): void {
        const result = this.physical_board.split_stack(card_location);
        switch (result) {
            case SplitResult.SUCCESS:
                StatusBar.update_text(
                    "Split! Moves like this can be tricky, even for experts. You have the undo button if you need it.",
                );
                break;
            case SplitResult.DID_NOTHING:
                StatusBar.update_text(
                    "Clicking here does nothing. Maybe you want to drag it instead?",
                );
                break;
        }

        this.physical_game.populate_board_area();
    }

    // MOVING TO EMPTY SPOTS
    move_card_from_hand_to_board(): void {
        HandCardDragAction.move_card_from_hand_to_board();
        StatusBar.update_text(
            "You moved a card to the board! Drag other cards on top of it to create a pile.)",
        );
        this.physical_game.populate_board_area();
    }

    move_dragged_card_stack_to_end_of_shelf(new_shelf_index: number): void {
        CardStackDragAction.move_dragged_card_stack_to_end_of_shelf(
            new_shelf_index,
        );
        StatusBar.update_text(
            "Organizing the board is a key part of the game!",
        );

        this.game.maybe_update_snapshot();
        this.physical_game.populate_board_area();
    }

    // SCORING MOVES

    merge_hand_card_to_board_stack(stack_location: StackLocation): void {
        const stack_size =
            HandCardDragAction.merge_hand_card_to_board_stack(stack_location);
        if (stack_size === undefined) {
            console.log("Cannot merge hand card to board stack");
            return;
        }
        if (stack_size >= 8) {
            SoundEffects.play_bark_sound();
            StatusBar.update_text(
                "You are trucking now! Don't gloat! The other players hate when you gloat.",
            );
        } else if (stack_size >= 3) {
            SoundEffects.play_ding_sound();
            StatusBar.update_text(
                "Nice work! Extending piles gets you points!",
            );
        } else {
            StatusBar.update_text(
                "That's a good start, but you will need at least 3 cards.",
            );
        }

        this.game.maybe_update_snapshot();

        this.physical_game.populate_board_area();
    }

    drop_stack_on_stack(info: {
        source_location: StackLocation;
        target_location: StackLocation;
    }): void {
        const merged_stack = CardStackDragAction.drop_stack_on_stack(info);
        if (merged_stack === undefined) {
            console.trace(
                "dropped stack is unmergable with the target stack, when trying to drop stack on stack!!!",
            );
            return;
        }
        const size = merged_stack.size();

        if (size >= 8) {
            SoundEffects.play_bark_sound();
            StatusBar.update_text("Look at you go!");
        } else if (size >= 3) {
            SoundEffects.play_ding_sound();
            StatusBar.update_text("Combined!");
        } else {
            StatusBar.update_text("Nice, but where's the third card?");
        }

        this.game.maybe_update_snapshot();

        this.physical_game.populate_board_area();
    }
}

