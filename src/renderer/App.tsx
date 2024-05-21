import { useEffect, useRef, useState } from 'react';
import { CanvasElement, getElement, renderCanvasElement } from './elements';
import './index.css';

interface GuiData {
    baseElement: CanvasElement;
    elements: CanvasElement[];
}

/**
 * @returns A new very simple GUI
 */
function newGuiData(): GuiData {
    return {
        elements: [
            {
                data: {},
                dimensions: { x: 12, y: 17, width: 18, height: 18 },
                id: 'slotElement',
                name: '',
            },
        ],
        baseElement: {
            data: {},
            dimensions: { x: 0, y: 0, width: 176, height: 166 },
            id: 'emptyInventoryElement',
            name: 'background',
        },
    };
}

function render(
    canvas: HTMLCanvasElement,
    data: GuiData,
    selected: SelectedState
) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return console.error('Could not get canvas rendering context');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    renderCanvasElement(ctx, data.baseElement);
    for (const el of data.elements) {
        renderCanvasElement(ctx, el);
    }
    if (selected) {
        let rect =
            selected.index == -1
                ? data.baseElement.dimensions
                : data.elements[selected.index]?.dimensions ?? {
                      height: 0,
                      width: 0,
                      x: 0,
                      y: 0,
                  };
        ctx.fillStyle = 'red';
        // top border
        ctx.fillRect(rect.x, rect.y, rect.width + 2, 1); // technically we have to do x - 1 and y - 1, but because we also have to do +1 on both due to the 1 px border on the canvas element, we can cancel that out
        // bottom border
        ctx.fillRect(rect.x, rect.y + rect.height + 1, rect.width + 2, 1);
        // left border
        ctx.fillRect(rect.x, rect.y, 1, rect.height + 2);
        // right border
        ctx.fillRect(rect.x + rect.width + 1, rect.y, 1, rect.height + 2);
    }
}

type SelectedState =
    | { index: number; offset: [number, number] | undefined }
    | undefined;

export default function App() {
    const [data, setData] = useState(newGuiData());
    /**
     * The index of the currently selected element. If the index < 0, then the background element is selected
     */
    const [selected, setSelected] = useState<SelectedState>(undefined);

    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (canvasRef.current && canvasRef.current instanceof HTMLCanvasElement)
            render(canvasRef.current, data, selected);
    });

    return (
        <div
            className='main'
            onMouseDown={(ev) => {
                // if the target is either the main thing, meaning we clicked in the empty space around the canvas or its the left section (or an item in it), reset the selection.
                if (
                    ev.target instanceof HTMLDivElement &&
                    (ev.target.classList.contains('section-left') ||
                        ev.target.classList.contains('section-left-item') ||
                        ev.target.classList.contains('main'))
                )
                    setSelected(undefined);
            }}
        >
            {
                undefined /* The left section, in here you should have a list of all elements you can use */
            }
            <div className='section-left'>
                {undefined /* todo: add a list of all available elements */}
            </div>
            <canvas
                width={
                    data.baseElement.dimensions.width + 2 /*
					+ 2 because we add a 1px border to the canvas in order to draw a border around the selected element,
					which may go out of "gui space" when the element is at 0,0, so we make "gui space" go from 1, 1 to canvas width - 2, canvas height - 2,
					which ensures that any 1px border is always in the canvas */
                }
                height={data.baseElement.dimensions.height + 2}
                ref={canvasRef}
                style={{
                    aspectRatio: `${data.baseElement.dimensions.width + 2}/${
                        data.baseElement.dimensions.height + 2
                    }`,
                }}
                onMouseMove={function (event) {
                    if ((event.buttons & 0b1) == 0) return;
                    const target = event.target;
                    // should always be true
                    if (!(target instanceof HTMLCanvasElement)) return;

                    // event.clientX/Y: the position of the cursor relative to the window
                    // event.target.offsetLeft/offsetTop: The width/height from the top left of the screen
                    // clientWidth/height: The size of the canvas element
                    // event.width/height: The width/height of the canvas
                    // if we divide the width/height by the clientWidth/clientHeight, we will have the multiplier by which we need to multiply the mouse position relative to the top left of the canvas (clientX/Y - target.offsetLeft/Top).
                    // Example: the canvas is 10x10, but the clientWidth/height is 20x20, we get 0.5 (10 / 20). And a mouse position of 20, 20 multiplied by 0.5, 0.5 is 10, 10, so the actual position on the canvas we're on.
                    // NOTE: As noted above, the "gui space" actually starts at 1, 1, so we also have to subtract 1
                    const x =
                        Math.floor(
                            ((event.clientX - target.offsetLeft) *
                                target.width) /
                                target.clientWidth
                        ) - 1;
                    const y =
                        Math.floor(
                            ((event.clientY - target.offsetTop) *
                                target.height) /
                                target.clientHeight
                        ) - 1;

                    if (
                        selected &&
                        selected.offset &&
                        selected.index >= 0 &&
                        selected.index < data.elements.length &&
                        x >= 0 &&
                        y >= 0 &&
                        x < target.width &&
                        y < target.height
                    ) {
                        let newX = selected.offset[0] + x;
                        let newY = selected.offset[1] + y;

                        const element = data.elements[selected.index];
                        if (
                            element.dimensions.x != newX ||
                            element.dimensions.y != newY
                        ) {
                            element.dimensions.x = newX;
                            element.dimensions.y = newY;
                            setData(data);
                            if (
                                canvasRef.current &&
                                canvasRef.current instanceof HTMLCanvasElement
                            )
                                render(canvasRef.current, data, selected);
                        }
                    }
                }}
                onMouseDown={function (event) {
                    if ((event.buttons & 0b1) == 0) return;
                    const target = event.target;
                    // should always be true
                    if (!(target instanceof HTMLCanvasElement)) return;

                    // event.clientX/Y: the position of the cursor relative to the window
                    // event.target.offsetLeft/offsetTop: The width/height from the top left of the screen
                    // clientWidth/height: The size of the canvas element
                    // event.width/height: The width/height of the canvas
                    // if we divide the width/height by the clientWidth/clientHeight, we will have the multiplier by which we need to multiply the mouse position relative to the top left of the canvas (clientX/Y - target.offsetLeft/Top).
                    // Example: the canvas is 10x10, but the clientWidth/height is 20x20, we get 0.5 (10 / 20). And a mouse position of 20, 20 multiplied by 0.5, 0.5 is 10, 10, so the actual position on the canvas we're on.
                    // NOTE: As noted above, the "gui space" actually starts at 1, 1, so we also have to subtract 1
                    const x = Math.floor(
                        ((event.clientX - target.offsetLeft) * target.width) /
                            target.clientWidth
                    );
                    const y = Math.floor(
                        ((event.clientY - target.offsetTop) * target.height) /
                            target.clientHeight
                    );

                    event.preventDefault();
                    if (
                        x > 0 &&
                        y > 0 &&
                        x < target.width - 1 &&
                        y < target.height - 1
                    ) {
                        for (let i = 0; i < data.elements.length; ++i) {
                            const dimensions = data.elements[i].dimensions;
                            // NOTE: As above noted, we're working here with gui screen space, and thus have to subtract 1 from x and y
                            if (
                                dimensions.x <= x - 1 &&
                                dimensions.y <= y - 1 &&
                                dimensions.x + dimensions.width > x - 1 &&
                                dimensions.y + dimensions.height > y - 1
                            ) {
                                // calculate the mouse offset
                                // this is done by taking the element x and y coordinate and subtracting the mouse position.
                                // if we add the mouse position to this, we will get the new x and y for the element!
                                // why this works: offset = x - mouseX; (later) x = offset + mouseX;, meaning: x = x - mouseX + mouseX; We know (- mouseX + mouseX) is equal to zero, so we can "leave it out".
                                // mouseX changes tho, so this is giving the difference between the 2 positions + the original element positions.

                                // Example: element is at (3, 3) and mouse at (5, 5), so this returns (-2, -2). If we move the mouse to (7, 7) now (+2, +2), then the new element position is (7 - 2, 7 - 2), so (5, 5), which perfectly aligns with the original position (3, 3) and the mouse delta (+2, +2): (3 + 2, 3 + 2) = (5, 5)
                                return setSelected({
                                    offset: [
                                        dimensions.x - (x - 1),
                                        dimensions.y - (y - 1),
                                    ],
                                    index: i,
                                });
                            }
                        }
                        return setSelected({
                            offset: undefined /* this is the background element, it has to always be at 0,0 */,
                            index: -1,
                        });
                    } else {
                        return setSelected(undefined);
                    }
                }}
                onMouseUp={() => setSelected(selectedRemoveOffset)}
            ></canvas>
            {
                undefined /* this is the right section, here you should be able to configure the custom name of an element, its position and size and the config it supplies */
            }
            <div className='section-right'>
                {selected && (
                    <>
                        <h3>
                            {selected.index >= 0
                                ? `Element #${selected.index}`
                                : 'GUI'}
                        </h3>
                        {
                            undefined /* Put the data here, and additional settings if the element is the background (such as the ability to change the background element) */
                        }
                    </>
                )}
            </div>
        </div>
    );
}

// removes the offset of the selected index, used by onMouseUp
function selectedRemoveOffset(value: SelectedState): SelectedState {
    if (value) value.offset = undefined;
    return value;
}
