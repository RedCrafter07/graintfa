export interface Rect {
    width: number;
    height: number;
    x: number;
    y: number;
}

export interface GraintfaElement<T extends GraintfaConfigs> {
    validateDimensions(dimensions: Rect): Rect;
    render(
        render: CanvasRenderingContext2D,
        dimensions: Rect,
        configs: GraintfaConfigRecord<T>
    ): void;
    getConfigs(): T;
}

export type GraintfaConfigurationElement =
    | { type: 'string_input' | 'unbound_number_input' }
    | { type: 'validated_string_input'; validator: (value: string) => string }
    | { type: 'bound_number_input'; min: number; max: number }
    | { type: 'dropdown' | 'radio'; values: string[] }
    | { type: 'file_input'; extensions: string[] };

export type GraintfaConfigs = Record<PropertyKey, GraintfaConfigurationElement>;
export type GraintfaConfigRecord<T extends GraintfaConfigs> = {
    [K in keyof T]: GraintfaElementValue<T[K]>;
};

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

export type GraintfaFile = { blob: string; filename: string };

export type GraintfaConfiguration = GraintfaConfigurationElement[];

export interface CanvasElement {
    element: GraintfaElement<any>;
    dimensions: Rect;
    id: string;
}

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

const elementRegistry: Record<string, GraintfaElement<any>> = {};

export function getElement(id: string): GraintfaElement<any> | undefined {
    if (id in elementRegistry) {
        return elementRegistry[id];
    }
    return undefined;
}

export class DoubleElementRegisterError extends Error {
    constructor(id: string) {
        super();
        this.message = 'Double registration of element with id ' + id;
        this.name = 'DoubleElementRegisterError';
    }
}

export function registerElement<T extends GraintfaConfigs>(
    id: string,
    element: GraintfaElement<T>,
    registerer?: string
) {
    if (id in elementRegistry) {
        throw new DoubleElementRegisterError(id);
    }
    console.log('[%s]: Registering element %s!', registerer ?? "graintfa", id);
    
    elementRegistry[id] = element;
}

export function getRegisteredElements(): Record<string, GraintfaElement<any>> {
    return elementRegistry;
}
