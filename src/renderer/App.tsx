import { useEffect, useRef } from 'react';
import { GraintfaElement, getElement } from './elements';
import './index.css';

interface GuiData {
	baseElement: GraintfaElement<any>;
	elements: GraintfaElement<any>[];
}

export default function App() {
	const element = getElement("emptyInventoryElement");
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		if (canvasRef.current instanceof HTMLCanvasElement) {
			const ctx = canvasRef.current.getContext("2d");
			if (!ctx) return console.error("Could not get canvas rendering context");
			ctx.imageSmoothingEnabled = false;
			element?.render(ctx, { x: 0, y: 0, width: 176, height: 166 }, {});
		}
	});

    return (
        <div className='main'>
			<div className='section-left'></div>
			<canvas width="176" height="166" ref={canvasRef} style={{ aspectRatio: "176/166" }}></canvas>
			<div className='section-right'></div>
        </div>
    );
}
