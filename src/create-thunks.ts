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

export function createThunks<
    State,
    ActionTypes,
    ActionCreators extends Object
>(options: {
    initialState: State;
    types: ActionTypes;
    creators: ActionCreators;
}) {
    function proxyGetHandler(dispatch: any, prop: any) {
        const actionCreator: any = (options.creators as any)[prop];

        if (actionCreator) {
            return (...args: any[]) => dispatch(actionCreator(...args));
        }

        throw new Error("not found " + prop.toString());
    }

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
                const proxy = new Proxy(dispatch, {
                    get: proxyGetHandler,
                });

                return thunks[key].apply(boundThunks, args)(proxy, getState);
            };
        });

        return boundThunks as ThunkDict;
    };
}
