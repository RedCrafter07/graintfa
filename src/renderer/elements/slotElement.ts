import { GraintfaElement, minSizeValidator } from '.';

const SlotElement: GraintfaElement<{}> = {
    getConfigs: () => ({}),
    render(render, dimensions, configs) {
        
    },
    validateDimensions: minSizeValidator(2, 2),
}

export default SlotElement;