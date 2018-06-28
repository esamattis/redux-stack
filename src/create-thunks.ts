import {
    SimpleActionsObject,
    SimpleActionsMeta,
    _CREATED_WITH_SIMPLE_ACTIONS,
} from "./create-simple-actions";

export interface Thunk<State, Action> {
    (
        dispatch: (
            action: Action | Thunk<State, Action>,
        ) => Promise<null> | void,
        getState: () => State,
    ): any;
}

interface SimpleAction {
    type: string;
    [_CREATED_WITH_SIMPLE_ACTIONS]: true;
    payload: {[key: string]: any};
}

/**
 * Create thunk actions for side effects etc.
 *
 * @param actions actions object returned by createSimpleActions()
 * @param thunks
 */
export function createThunks<
    State,
    Actions extends SimpleActionsObject<State>,
    ThunkActions extends {
        [thunk: string]: (...args: any[]) => Thunk<State, SimpleAction>;
    }
>(actions: SimpleActionsMeta<State, Actions>, thunks: ThunkActions) {
    return thunks;
}
