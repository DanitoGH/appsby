import { useEffect, useState } from 'react';
import { shallowEqual } from './shallowEqual';

export class GlobalState {
    constructor(initState) {
        this.connectedItems = {};
        this.connectedHooks = {};
        this.defaultMapState = gs => gs;
        this.state = initState;
    }
    setState(newStatePatch) {
        const newState = Object.assign({}, this.state, newStatePatch);
        if (shallowEqual(this.state, newState))
            return;
        this.state = newState;
        this.notifyStateChanged();
    }
    connect(target, mapState) {
        const connectedItem = new ConnectedItem(target, mapState, this.state);
        this.connectedItems[connectedItem.id] = connectedItem;
        this.interceptUnmountToDisconnect(connectedItem);
        return connectedItem.mappedState;
    }
    useGlobalState(mapState) {
        const mapStateFn = mapState || this.defaultMapState;
        const [mappedState, setMappedState] = useState(mapStateFn(this.state));
        const [connectedHook, setConnectedHook] = useState(() => new ConnectedHook(mappedState, mapStateFn, setMappedState));
        useEffect(() => {
            this.connectedHooks[connectedHook.id] = connectedHook;
            return () => {
                delete this.connectedHooks[connectedHook.id];
            };
        }, []);
        return mappedState;
    }
    interceptUnmountToDisconnect(item) {
        const prevUnmount = item.target.componentWillUnmount;
        item.target.componentWillUnmount = () => {
            this.disconnect(item);
            prevUnmount && prevUnmount.call(item.target);
        };
    }
    disconnect(item) {
        delete this.connectedItems[item.id];
    }
    notifyStateChanged() {
        for (let key in this.connectedItems) {
            this.connectedItems[key].processNewGlobaleState(this.state);
        }
        for (let key in this.connectedHooks) {
            this.connectedHooks[key].processNewGlobaleState(this.state);
        }
    }
}
let connectedItemIdGen = 1;
class ConnectedHook {
    constructor(mappedState, mapStateFn, setMappedStateFn) {
        this.mappedState = mappedState;
        this.mapStateFn = mapStateFn;
        this.setMappedStateFn = setMappedStateFn;
        this.id = connectedItemIdGen++;
    }
    processNewGlobaleState(gs) {
        try {
            const newMappedState = this.evaluateMapState(gs);
            if (shallowEqual(this.mappedState, newMappedState))
                return;
            this.mappedState = newMappedState;
            this.setMappedStateFn(this.mappedState);
        }
        catch (e) {
            console.error('Error during processing new global state');
            console.error(e);
        }
    }
    evaluateMapState(gs) {
        try {
            return this.mapStateFn(gs);
        }
        catch (e) {
            console.error('Error in map global state function for hook ');
            console.error(e);
            throw e;
        }
    }
}
class ConnectedItem {
    constructor(target, mapStateFn, gs) {
        this.target = target;
        this.mapStateFn = mapStateFn;
        this.id = connectedItemIdGen++;
        this.mappedState = mapStateFn(gs);
    }
    processNewGlobaleState(gs) {
        const newMappedState = this.evaluateMapState(gs);
        if (!newMappedState)
            return;
        if (shallowEqual(this.mappedState, newMappedState))
            return;
        this.mappedState = newMappedState;
        this.target.setState(this.mappedState);
    }
    evaluateMapState(gs) {
        try {
            return this.mapStateFn(gs);
        }
        catch (e) {
            console.error('Error in map global state function for component ' + this.target.constructor.name);
            console.error(e);
            return undefined;
        }
    }
}
