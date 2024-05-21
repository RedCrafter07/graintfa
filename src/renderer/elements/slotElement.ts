import { GraintfaElement, minSizeValidator } from '.';

const SLOT_MINECRAFT_GRAY = "#8b8b8b";
const SLOT_MINECRAFT_DARKGRAY = "#373737";
const SLOT_MINECRAFT_WHITE = "#ffffff";

const SlotElement: GraintfaElement<{}> = {
    getConfigs: () => ({}),
    render(render, dimensions, configs) {
        render.fillStyle = SLOT_MINECRAFT_DARKGRAY;
        // left border of the slot
        // we only draw height - 1 because there's a 1x1 corner in the bottom left (see bottom left corner below)
        render.fillRect(dimensions.x, dimensions.y, 1, dimensions.height - 1);
        // top border of the slot
        // we only draw width - 1 because there's a 1x1 corner in the top right (see top right corner)
        render.fillRect(dimensions.x, dimensions.y, dimensions.width - 1, 1);

        render.fillStyle = SLOT_MINECRAFT_GRAY;
        // top right corner
        render.fillRect(dimensions.x + dimensions.width - 1, dimensions.y, 1, 1);
        // bottom left corner
        render.fillRect(dimensions.x, dimensions.y + dimensions.height - 1, 1, 1);
        // center
        render.fillRect(dimensions.x + 1, dimensions.y + 1, dimensions.width - 2, dimensions.height - 2);

        render.fillStyle = SLOT_MINECRAFT_WHITE;
        // bottom border
        // we draw width - 1 and from x + 1 because on the bottom left there's a 1x1 corner (see bottom left corner above)
        render.fillRect(dimensions.x + 1, dimensions.y + dimensions.height - 1, dimensions.width - 1, 1);
        // right border
        // we draw height - 1 and from y + 1 because on the top left there's a 1x1 corner
        render.fillRect(dimensions.x + dimensions.width - 1, dimensions.y + 1, 1, dimensions.height - 1);
    },
    validateDimensions: minSizeValidator(2, 2),
}

export default SlotElement;