import {
    createActionControl,
    createChoiceControl,
    createHoldControl,
    createInputControl,
    createRangeControl,
    createResetControl,
    createSliderControl,
    createToggleControl,
} from "../../rix/src/index.js";
import { callWithConcreteArgs } from "../../rix/src/eval/functions/functions.js";

const constructors = new Map([
    ["Slider", createSliderControl],
    ["Input", createInputControl],
    ["Choice", createChoiceControl],
    ["Toggle", createToggleControl],
    ["Range", createRangeControl],
    ["Reset", createResetControl],
    ["Action", createActionControl],
    ["Hold", createHoldControl],
]);

export const WEB_CONTROL_NAMES = Object.freeze([...constructors.keys()]);

/** Install concise RiX-Web aliases for the portable .Controls constructors. */
export function installWebControlCapabilities(systemContext) {
    for (const [name, constructor] of constructors) {
        if (systemContext.has(name)) {
            throw new Error(`RiX-Web control shortcut conflicts with .${name}`);
        }
        systemContext.register(name, {
            pure: true,
            groups: ["Output", "Controls"],
            doc: `RiX-Web shortcut for .Controls.${name}`,
            impl(args, context, evaluate) {
                return constructor(args, {
                    context,
                    evaluate,
                    invoke: (callable, callArgs) =>
                        callWithConcreteArgs(callable, callArgs, context, evaluate),
                });
            },
        });
    }
    return systemContext;
}
