import {bindActionCreators} from "redux";

type FirstArg<T> = T extends (arg: infer V) => any ? V : never;

type ActionsObject = {[key: string]: (arg: any) => any};

type ReplaceReturnTypes<T extends {}, ReturnType> = {
    [P in keyof T]: (arg: FirstArg<T[P]>) => ReturnType
};

interface Dispatch<State, ActionTypes, ActionCreators> {
    (action: ActionTypes | Thunk<State, ActionTypes, ActionCreators>): Promise<
        void
    > | void;
}

export interface Thunk<State, ActionTypes, ActionCreators> {
    (
        dispatch: Dispatch<State, ActionTypes, ActionCreators> &
            ReplaceReturnTypes<ActionCreators, Promise<void> | void>,
        getState: () => State,
    ): any;
}

export function createThunks<State, ActionTypes, ActionCreators>(options: {
    initialState: State;
    types: ActionTypes;
    creators: ActionCreators;
}) {
    return function inner<
        ThunkDict extends {
            [thunk: string]: (
                ...args: any[]
            ) => Thunk<State, ActionTypes, ActionCreators>;
        }
    >(thunks: ThunkDict) {
        const boundThunks: any = {};

        Object.keys(thunks).forEach(key => {
            boundThunks[key] = (...args: any[]) => (
                dispatch: any,
                getState: any,
            ) => {
                const dispatchWithActions = Object.assign(
                    dispatch, // XXX mutation
                    bindActionCreators(options.creators as any, dispatch),
                );

                return thunks[key].apply(boundThunks, args)(
                    dispatchWithActions,
                    getState,
                );
            };
        });

        return boundThunks as ThunkDict;
    };
}
