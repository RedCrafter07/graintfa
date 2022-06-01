import { useState } from 'react';

const App = () => {
	const [count, setCount] = useState(0);
	return (
		<div className='bg-neutral-900 text-white w-screen min-h-screen px-2'>
			<div className='container mx-auto'>
				<h1>💖 Hello World!</h1>
				<p>Welcome to your Electron and React application.</p>
				<button
					onClick={() => {
						setCount(count + 1);
					}}
					className='border border-neutral-600 rounded-lg bg-neutral-700 px-2 py-1'
				>
					{count}
				</button>
			</div>
		</div>
	);
};

export default App;
