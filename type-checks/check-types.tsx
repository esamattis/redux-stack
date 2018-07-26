import {createThunks} from "../src/create-thunks";
import {createSimpleActions, createReducer} from "../src/create-simple-actions";

const wait = (t: number) => new Promise(r => setTimeout(r, t));

test("type checks reducer actions", () => {
    const initialState = {foo: "bar"};

    const SimpleActions = createSimpleActions(initialState, {
        setFoo(state, action: {foo: string}) {
            return {...state, foo: action.foo};
        },
    });

    const reducer = createReducer(SimpleActions);

    // $ExpectError
    reducer(initialState, {type: "setFoofail", payload: {foo: "test"}});
    // $ExpectError
    reducer(initialState, {type: "setFoo", payload: {foo: "test"}});
});

test("type checks dispatch types", () => {
    const initialState = {foo: "bar"};

    const SimpleActions = createSimpleActions(initialState, {
        setFoo(state, action: {foo: string}) {
            return {...state, foo: action.foo};
        },
    });

    const OtherActions = createSimpleActions(initialState, {
        setOther(state, action: {}) {
            return state;
        },
    });

    const Thunks = createThunks(SimpleActions, {
        myThunk(boo: number) {
            return async dispatch => {
                // assert return value here too
                const res: Promise<null> | void = dispatch(
                    SimpleActions.setFoo({foo: "from thunk"}),
                );

                dispatch(OtherActions.setOther({}));

                // Can nest dispatches with ok types
                dispatch((dispatch, getState) => {
                    const foo: string = getState().foo;
                    dispatch(OtherActions.setOther({}));
                    dispatch(SimpleActions.setFoo({foo: ""}));

                    // $ExpectError
                    dispatch();
                });

                // $ExpectError
                dispatch({type: "setFoo", payload: {foo: "from thunk"}});

                // $ExpectError
                dispatch({});

                // $ExpectError
                dispatch();
            };
        },
    });
});
