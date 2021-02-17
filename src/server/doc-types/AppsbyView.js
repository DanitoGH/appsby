import Base from "./Base";

/** Create an instance of AppsbyView to make server-side view-models simpler. API endpoints aren't great when there's lots of similar view logic between functions, and AppsbyView fills that gap. */
export class AppsbyView extends Base {

    /**
     * Within a View component, render is called after each developer-defined function execution. That means, once your custom function is called, render will be called after it.
     * It's a way to implement view-models server-side, allowing you to only define your view-model logic once. Works essentially the same as a React class component's render method.
     * @return {object} - Return an object consisting of all the fields you want to pass to your front-end.
     */
    async render() {
        return {};
    };
}
