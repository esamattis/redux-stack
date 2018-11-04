# Epeli's Redux Stack for TypeScript

This is now split in two other libraries

-   [immer-reducer](https://github.com/epeli/immer-reducer)
-   [redux-render-prop](https://github.com/epeli/redux-render-prop)

[![Greenkeeper badge](https://badges.greenkeeper.io/epeli/redux-stack.svg)](https://greenkeeper.io/)

Fairly opinionated Redux Stack for TypeScript. This is made two design goals in mind:

1.  Be type safe
2.  Be terse! Redux doesn't have to be verbose!

I really don't recommend you to use this as is because this is fairly living library but if you like something here feel free to fork this or copy paste some parts to your project.

If you happen to work with me, you're in luck because you are now working with something that is actually somewhat documented :)

## Install

Install with redux (it's a peer dep)

    npm install @epeli/redux-stack redux

## Exported functions

Small overview. See usage example in the end.

### `configureStore(options: Object): ReduxStore`

This basically a fork from [`@acemarke/redux-starter-kit`][starter] which is adapted to TypeScript.

Simplifies store creation. Adds redux-thunk middleware and creates devtools connection automatically.

[starter]: https://github.com/markerikson/redux-starter-kit

options:

-   `reducer?: Reducer`: Single reducer
-   `reducers?: Reducer[]`: Multiple reducers for the same state
-   `middleware?: Middleware[]`: Redux middlewares. By default add redux-thunk
-   `devTools?: boolean`: Enables or disables redux-devtools. By default is enabled
-   `preloadedState?: State`: Preload store with a state
-   `enhancers?: Enhancers[]`: Redux enhancers

### `makeThunkCreator(mapStore: Function)`

Create thunks from simple actions for side effects (api calls etc.).

## Usage example

```tsx
import {makeThunkCreator, configureStore} from "@epeli/redux-stack";
import {
    ImmerReducer,
    createActionCreators,
    createReducerFunction,
} from "immer-reducer";

/**
 * Define state as a single interface
 * */
interface State {
    count: number;
}

const initialState = {
    count: 0,
};

// Using immer-reducer https://github.com/epeli/immer-reducer
class MyReducers extends ImmerReducer<typeof initialState> {
    setCount(newCount: number) {
        this.draftState.count = newCount;
    }

    increment() {
        this.draftState.count += 1;
    }
}

const MyActionCreators = createActionCreators(MyReducers);

/**
 * Make typed thunk creator.
 * Usually you only need to create one of these per app.
 *
 * You decorate the store passed to the thunks in any
 * way you wish. The types will be inferred automatically
 * for it.
 */
const createThunk = makeThunkCreator(store => ({
    // Here we just add our state type to getState
    getState: () => store.getState() as typeof initialState,
    dispatch: store.dispatch,
}));

const Thunks = {
    /**
     * Side effects should be created in thunks.
     * For example calling random() is a side effect.
     *
     * Type of setRandomCount will be
     *
     *  (base: number) => (reduxDispatch: Dispatch, getState: GetState) => void
     */
    setRandomCount: createThunk((base: number) => ({dispatch}) => {
        dispatch(MyActionCreators.setCount({newCount: base + Math.random()}));
    }),

    /**
     * Async operations such as network requests are side effects.
     *
     * Note that the returned thunk is an async function!
     */
    fetchCount: createThunk(() => async ({dispatch}) => {
        const response = await request(API_URL);

        dispatch(
            MyActionCreators.setCount({
                newCount: response.body.count,
            }),
        );
    }),

    /**
     * Thunks can dispatch other thunks and await on them
     * if needed.
     */
    doubleFetch: createThunk(() => async ({dispatch, getState}) => {
        // Start fetch.
        // The dispatch can infer the return type to be promise
        // when dispatching async thunks
        const promise = dispatch(Thunks.fetchCount());

        // Wait for request to resolve
        await promise;

        // and after that double it
        dispatch(
            MyActionCreators.setCount({
                newCount: getState().count * 2,
            }),
        );
    }),
};

const store = configureStore({
    // reducers option takes an array of reducers which all receive the same state object.
    reducers: [
        // Create reducer function from the MyReducers class
        createReducerFunction(MyReducers),

        // If you need to keep your old reducers still around
        oldReducer,
    ],
});
```

Combine with [`redux-render-prop`][rrp]

```tsx
import {makeComponentCreator} from "redux-render-prop";
import {bindActionCreators} from "redux";

const AllActions = {...MyActionCreators, ...Thunks};

export const createMyAppComponent = makeComponentCreator({
    prepareState: (state: State) => state,

    prepareActions: dispatch => {
        return bindActionCreators(AllActions, dispatch);
    },
});
```

For more comprehensive example checkout the `redux-render-prop` readme.

[rrp]: https://github.com/epeli/redux-render-prop
