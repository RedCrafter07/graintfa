import { GraintfaElement, minSizeValidator } from '.';

type Colors = Record<string, [number, number, number, number]>;

function replaceAllNewLines(str: string): string {
    let new_str = "";
    for (let i = 0; i < str.length; ++i) {
        if (str[i] == '\n' || str[i] == '\r') continue;
        else new_str += str[i];
    }
    return new_str;
}

/**
 * Turns a text image representation into ImageData
 *
 * Text Representation:
 *
 * ```
 * bwb
 * bww
 * ```
 * ^= for black, white black; black, white, white
 *
 * @param text the text
 * @param width the width of the image
 * @param height the height of the image
 * @param colors the colors specified in the text (+ ' ' for invisible)
 */
function makeImageData(
    text: string,
    width: number,
    height: number,
    colors: Colors
): ImageData {
    text = replaceAllNewLines(text);
    if (width * height != text.length) {
        console.log(text, width, height, text.length, width * height);
        throw new Error('Width and height dont align with the text!');
    }
    const data = new Uint8ClampedArray(width * height * 4); // data: rgba (4 bytes) * width * height
    for (let i = 0; i < text.length; ++i) {
        const offset = i * 4;
        const color = colors[text[i]];
        if (color) {
            data[offset] = color[0];
            data[offset + 1] = color[1];
            data[offset + 2] = color[2];
            data[offset + 3] = color[3];
        } else {
            data[offset + 3] = 0; // only set the alpha channel to 0, we dont care about the other ones (tho as we are creating the data, these are supposed to be 0)
        }
    }
    return new ImageData(data, width, height);
}

const minecraftColors: Colors = {
    b: [0, 0, 0, 0xff], // the 0xff at the end is regarding the alpha channel
    w: [0xff, 0xff, 0xff, 0xff], // the 0xff at the end is regarding the alpha channel
    g: [0xc6, 0xc6, 0xc6, 0xff], // the 0xff at the end is regarding the alpha channel
    d: [0x55, 0x55, 0x55, 0xff], // the 0xff at the end is regarding the alpha channel
};
const topLeftCorner = makeImageData(
    `
  bb
 bww
bwww
bwww
`,
    4,
    4,
    minecraftColors
);
const topRightCorner = makeImageData(
    `
b   
wb  
wgb 
gddb
`,
    4,
    4,
    minecraftColors
);
const bottomLeftCorner = makeImageData(
    `
bwwg
 bgd
  bd
   b
`,
    4,
    4,
    minecraftColors
);
const bottomRightCorner = makeImageData(
    `
dddb
dddb
ddb 
bb  
`,
    4,
    4,
    minecraftColors
);

const GUI_MINECRAFT_BLACK = '#000000';
const GUI_MINECRAFT_WHITE = '#ffffff';
const GUI_MINECRAFT_GRAY = '#c6c6c6';
const GUI_MINECRAFT_DARKGRAY = '#555555';

const EmptyInventoryElement: GraintfaElement<{}> = {
    getConfigs: () => ({}),
    render(render, dimensions, configs) {
        render.putImageData(topLeftCorner, dimensions.x, dimensions.y);
        render.putImageData(
            topRightCorner,
            dimensions.x + dimensions.width - 4,
            dimensions.y
        );
        render.putImageData(
            bottomLeftCorner,
            dimensions.x,
            dimensions.y + dimensions.height - 4
        );
        render.putImageData(
            bottomRightCorner,
            dimensions.x + dimensions.width - 4,
            dimensions.y + dimensions.height - 4
        );

        const horizontalBarWidth = dimensions.width - 8;
        const verticalBarHeight = dimensions.height - 8;

        render.fillStyle = GUI_MINECRAFT_BLACK;
        render.fillRect(dimensions.x + 4, dimensions.y, horizontalBarWidth, 1); // top bar
        render.fillRect(
            dimensions.x + 4,
            dimensions.y + dimensions.height - 1,
            horizontalBarWidth,
            1
        ); // bottom bar
        render.fillRect(dimensions.x, dimensions.y + 4, 1, verticalBarHeight); // left bar
        render.fillRect(
            dimensions.x + dimensions.width - 1,
            dimensions.y + 4,
            1,
            verticalBarHeight
        ); // right bar

        render.fillStyle = GUI_MINECRAFT_WHITE;
        render.fillRect(
            dimensions.x + 4,
            dimensions.y + 1,
            horizontalBarWidth,
            2
        ); // top bar
        render.fillRect(
            dimensions.x + 1,
            dimensions.y + 4,
            2,
            verticalBarHeight
        ); // left bar

        render.fillStyle = GUI_MINECRAFT_DARKGRAY;
        render.fillRect(
            dimensions.x + 4,
            dimensions.y + dimensions.height - 3,
            horizontalBarWidth,
            2
        ); // bottom bar
        render.fillRect(
            dimensions.x + dimensions.width - 3,
            dimensions.y + 4,
            2,
            verticalBarHeight
        ); // right bar

        render.fillStyle = GUI_MINECRAFT_GRAY;
        render.fillRect(
            dimensions.x + 4,
            dimensions.y + 3,
            horizontalBarWidth,
            1
        ); // top bar
        render.fillRect(
            dimensions.x + 4,
            dimensions.y + dimensions.height - 4,
            horizontalBarWidth,
            1
        ); // bottom bar
        render.fillRect(
            dimensions.x + 3,
            dimensions.y + 4,
            1,
            verticalBarHeight
        ); // left bar
        render.fillRect(
            dimensions.x + dimensions.width - 4,
            dimensions.y + 4,
            1,
            verticalBarHeight
        ); // right bar
        render.fillRect(
            dimensions.x + 4,
            dimensions.y + 4,
            dimensions.width - 8,
            dimensions.height - 8
        ); // center
    },
    validateDimensions: minSizeValidator(8, 8),
};

export default EmptyInventoryElement;
