/**
 * An interface to house data on where to place something on a renderable surface (such as the canvas)
 */
export interface Rect {
    width: number;
    height: number;
    x: number;
    y: number;
}

/**
 * A global and static object housing the logic for your element.
 *
 * getConfigs() should return a map of graintfa configuration elements. This can be used by the gui to allow the user to customize your element.
 * The actual values specified by the user are being passed to the render function.
 *
 * This function should be **static** and thus never change
 */
export interface GraintfaElement<T extends GraintfaConfigs> {
    validateDimensions(dimensions: Rect): Rect;
    render(
        render: CanvasRenderingContext2D,
        dimensions: Rect,
        configs: GraintfaConfigRecord<T>
    ): void;
    getConfigs(): T;
}

/**
 * The different types of configurations your element can have
 */
export type GraintfaConfigurationElement =
    | { type: 'string_input' | 'unbound_number_input' }
    | { type: 'validated_string_input'; validator: (value: string) => string }
    | { type: 'bound_number_input'; min: number; max: number }
    | { type: 'dropdown' | 'radio'; values: string[] }
    | { type: 'file_input'; extensions: string[] };

/**
 * A Map of keys and a Graintfa Configuration Element. This is used by the GUI to provide configuration options for the element, when you select it
 */
export type GraintfaConfigs = Record<PropertyKey, GraintfaConfigurationElement>;

/**
 * A Map of keys and the value of the grantfa configuration elements.
 *
 * Meaning, if you pass `{ name: { type: "string_input" }, loops: { type: "number_input" } }`,
 * it would return `{ name: string, loops: number }`, as those are the values used by those 2 particular configuration elements
 */
export type GraintfaConfigRecord<T extends GraintfaConfigs> = {
    [K in keyof T]: GraintfaElementValue<T[K]>;
};

/**
 * If you pass this a type that extends the GraintfaConfigurationElement, it will return the value-type such a configuration would give.
 *
 * For example, for the string_input, it returns string, as the value used by a string_input is a string
 */
export type GraintfaElementValue<T extends GraintfaConfigurationElement> =
    T['type'] extends 'string_input' | 'validated_string_input'
        ? string
        : T['type'] extends 'unound_number_input' | 'bound_number_input'
        ? number
        : T['type'] extends 'dropdown' | 'radio'
        ? string[]
        : T['type'] extends 'file_input'
        ? GraintfaFile
        : never;

// representation of a file. If you wanna fetch this or use this in an image object, use the blob as the url (iex. image.src = blob, fetch(blob), ...)
export type GraintfaFile = { blob: string; filename: string } | undefined;

/**
 * A renderable element, which has the id of the actual element that has the code for rendering, resizing, etc
 */
export interface CanvasElement {
    /**
     * The dimensions of this element
     */
    dimensions: Rect;
    /**
     * The id. You should use this on getElement() to get the actual element
     */
    id: string;
    /**
     * The data of the Element
     * We (Graintfa) are responsible for saving and loading it!
     */
    data: Record<string, string | number | string[] | GraintfaFile>;
    /**
     * A custom name that can be defined by the user. Treat as absent if empty
     */
    name: string;
}

/**
 * Renders an element to the canvas
 *
 * @param context The context being used to render to the canvas
 * @param element The element that you wanna render
 */
export function renderCanvasElement(
    context: CanvasRenderingContext2D,
    element: CanvasElement
) {
    const actualElement = getElement(element.id);
    try {
        actualElement?.render(
            context,
            {
                x: element.dimensions.x + 1,
                y: element.dimensions.y + 1,
                height: element.dimensions.height,
                width: element.dimensions.width,
            },
            element.data
        );
    } catch (e) {
        console.error('[graintfa] Failed to render element %s', element.id);
    }
}

/**
 * A function that returns a function that ensures a rectangle is at least the specified size
 *
 * @param minWidth The minimum width of your element
 * @param minHeight The minimum height of your element
 * @returns A function thay ou can set as your GraintfaElement.validateDimensions, which ensures that your element is at all times at least the specified size
 */
export function minSizeValidator(
    minWidth: number,
    minHeight: number
): (dimensions: Rect) => Rect {
    return validateMinSize.bind(globalThis, minWidth, minHeight);
}

export function validateMinSize(
    minWidth: number,
    minHeight: number,
    dimensions: Rect
): Rect {
    if (dimensions.width < minWidth) dimensions.width = minWidth;
    if (dimensions.height < minHeight) dimensions.height = minHeight;

    return dimensions;
}

/**
 * A registry of all elements that we can render.
 */
const elementRegistry: Record<string, GraintfaElement<any>> = {};

/**
 * Lookup an element
 * @param id The id of the element
 * @returns If found, the element, otherwise undefined.
 */
export function getElement(id: string): GraintfaElement<any> | undefined {
    if (id in elementRegistry) {
        return elementRegistry[id];
    }
    return undefined;
}

/**
 * This Error will be invoked when someone tried to register an Element with the id of an already registered element
 */
export class DoubleElementRegisterError extends Error {
    constructor(id: string) {
        super();
        this.message = 'Double registration of element with id ' + id;
        this.name = 'DoubleElementRegisterError';
    }
}

/**
 * Registers a new element
 *
 * @param id The ID of the element
 * @param element The actual element
 * @param registerer Who is registering the element (graintfa by default. The API-version of registerElement sets this automatically to the plugin thats registering the elements)
 */
export function registerElement<T extends GraintfaConfigs>(
    id: string,
    element: GraintfaElement<T>,
    registerer?: string
) {
    if (id in elementRegistry) {
        throw new DoubleElementRegisterError(id);
    }
    console.log('[%s]: Registering element %s!', registerer ?? 'graintfa', id);

    elementRegistry[id] = element;
}

export function getRegisteredElements(): Record<string, GraintfaElement<any>> {
    return elementRegistry;
}
