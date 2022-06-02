import { MantineProvider, TextInput as NumberInput } from '@mantine/core';
import { useDebouncedValue, useHotkeys } from '@mantine/hooks';
import { ModalsProvider } from '@mantine/modals';
import {
	NotificationsProvider,
	showNotification,
} from '@mantine/notifications';
import { IconTrashX } from '@tabler/icons';
import { useRef, useState } from 'react';

type Field = {
	x: number;
	y: number;
	name: string;
	selected: boolean;
	highlighted: boolean;
	id: number;
	size: number;
};

const App = () => {
	const [fields, setFields] = useState<Field[]>([]);
	const [editField, setEditField] = useState<Field>();

	const guiDiv = useRef<HTMLDivElement>();

	const deleteSelected = () => {
		const selected = fields.filter((f) => f.selected);
		if (selected.length <= 0) return;
		selected.forEach((f) => {
			fields.splice(fields.indexOf(f), 1);
		});
		showNotification({
			message: `Deleted ${selected.length} element${
				selected.length == 1 ? '' : 's'
			}.`,
			title: 'Success',
			icon: <IconTrashX />,
			color: 'red',
		});
		setEditField(undefined);
	};

	const moveSelected = (
		direction: 'left' | 'right' | 'up' | 'down',
		step = 1,
	) => {
		const selected = fields.filter((f) => f.selected);
		if (selected.length <= 0) return;

		selected.forEach((f) => {
			const i = fields.indexOf(f);
			switch (direction) {
				case 'down':
					f.y += step;
					break;
				case 'up':
					f.y -= step;
					break;
				case 'left':
					f.x -= step;
					break;
				case 'right':
					f.x += step;
					break;
			}

			fields[i] = f;
		});

		setFields(
			fields.map((f, i) => {
				if (selected.find((f) => i == f.id)) {
					switch (direction) {
						case 'down':
							f.y += step;
							break;
						case 'up':
							f.y -= step;
							break;
						case 'left':
							f.x -= step;
							break;
						case 'right':
							f.x += step;
							break;
					}
				}
				return f;
			}),
		);
	};

	useHotkeys([
		['delete', deleteSelected],
		['backspace', deleteSelected],
		[
			'arrowleft',
			() => {
				moveSelected('left');
			},
		],
		[
			'arrowright',
			() => {
				moveSelected('right');
			},
		],
		[
			'arrowup',
			() => {
				moveSelected('up');
			},
		],
		[
			'arrowdown',
			() => {
				moveSelected('down');
			},
		],
		[
			'shift+arrowleft',
			() => {
				moveSelected('left', 10);
			},
		],
		[
			'shift+arrowright',
			() => {
				moveSelected('right', 10);
			},
		],
		[
			'shift+arrowup',
			() => {
				moveSelected('up', 10);
			},
		],
		[
			'shift+arrowdown',
			() => {
				moveSelected('down', 10);
			},
		],
		[
			'mod+a',
			() => {
				fields.map((f) => {
					f.selected = true;
					f.highlighted = false;
					return f;
				});
				setEditField(undefined);
			},
		],
		[
			'mod+d',
			() => {
				fields.map((f) => {
					f.selected = false;
					f.highlighted = false;
					return f;
				});
				setEditField(undefined);
			},
		],
	]);

	const FieldText = (props: { name: string; id: number; field: Field }) => {
		const { name, id, field: f } = props;
		return (
			<p
				className={`px-4 ${
					f.highlighted || f.selected ? '' : 'hover:'
				}bg-gray-600`}
				onClick={(e) => {
					if (e.shiftKey) {
						const selected = fields.filter((f) => f.selected);
						const from = Math.min(...selected.map((f) => f.id), id);
						const to = Math.max(...selected.map((f) => f.id), id);
						setFields(
							fields.map((f, i) => {
								if (i == id) f.selected = !f.selected;
								if (i >= from && i <= to) f.selected = true;
								f.highlighted = false;
								return f;
							}),
						);
					} else
						setFields(
							fields.map((f, i) => {
								f.highlighted = false;
								if (i == id) f.selected = !f.selected;
								else if (!e.ctrlKey) f.selected = false;

								return f;
							}),
						);
				}}
			>
				{name}
			</p>
		);
	};

	const Field = (props: { field: Field; id: number }) => {
		const { field: f, id } = props;

		let subtract = 0;

		if (f.selected || f.highlighted) {
			subtract = 4;
		}

		return (
			<img
				src='./assets/minecraft_inv_field.png'
				width={f.size}
				className={`absolute ${
					f.selected
						? 'border-4 border-blue-500'
						: f.highlighted
						? 'border-4 border-yellow-400'
						: ''
				} pointer-events-auto`}
				style={{
					top: `${f.y - subtract + guiDiv.current.offsetTop}px`,
					left: `${f.x - subtract + guiDiv.current.offsetLeft}px`,
				}}
				onClick={(e) => {
					if (e.ctrlKey && e.altKey) {
						fields.splice(id, 1);
						setEditField(undefined);
						return;
					}

					console.log(e.currentTarget.width, e.currentTarget.height);

					if (!f.selected) setEditField(fields[id]);
					else setEditField(undefined);

					setFields(
						fields.map((f) => {
							if (f.id == id) f.selected = f.selected == false;
							else if (!e.ctrlKey) f.selected = false;

							f.highlighted = false;

							return f;
						}),
					);
				}}
			/>
		);
	};

	const Main = () => {
		return (
			<div className='bg-gray-800 text-white w-screen min-h-screen'>
				<div className='grid grid-cols-6 h-screen'>
					<div className='fieldList bg-gray-800 col-span-1 w-full h-full'>
						{fields.map((f, i) => {
							return (
								<FieldText
									name={f.name}
									id={i}
									field={f}
									key={`field text ${i}`}
								></FieldText>
							);
						})}
					</div>
					<div className='guiEditor bg-gray-900 col-span-4 w-full h-full'>
						<div className='h-full w-full grid place-items-center'>
							<div
								ref={guiDiv}
								className='w-[75%]'
								onClick={(e) => {
									const [offsetLeft, offsetTop, offsetWidth, offsetHeight] = [
										guiDiv.current.offsetLeft,
										guiDiv.current.offsetTop,
										guiDiv.current.offsetWidth,
										guiDiv.current.offsetHeight,
									];
									console.log(offsetLeft, offsetTop, offsetWidth, offsetHeight);

									if (!e.shiftKey == true) return;

									const field: Field = {
										x: e.clientX - guiDiv.current.offsetLeft,
										y: e.clientY - guiDiv.current.offsetTop,
										name: `field ${fields.length + 1}`,
										selected: true,
										highlighted: false,
										id: fields.length,
										size: 100,
									};

									setFields([
										...fields.map((f) => {
											f.selected = false;
											f.highlighted = false;
											return f;
										}),
										field,
									]);

									setEditField(field);
								}}
							>
								<img src='./assets/minecraft_inv_default.png' />
								<div className='absolute top-0 left-0 w-full h-full pointer-events-none'>
									{fields.map((f, i) => (
										<Field field={f} id={i} key={i}></Field>
									))}
								</div>
							</div>
						</div>
					</div>
					<div
						className={`fieldProperties bg-gray-700 px-2 col-span-1 w-full h-full overflow-y ${
							!editField ? 'grid place-items-center' : ''
						}`}
					>
						{editField ? (
							<div>
								<h1 className='text-2xl'>Edit {editField.name}</h1>
								<hr />
								<p className='text-xl'>Position:</p>
								<NumberInput
									defaultValue={editField.x}
									onChange={(e) => {
										if (e.currentTarget.value.length < 1) return;
										e.currentTarget.value = `${e.currentTarget.value.replace(
											/[^0-9]/g,
											'',
										)}`;
										if (
											parseInt(e.currentTarget.value) >
											guiDiv.current.offsetWidth
										) {
											e.currentTarget.value = `${guiDiv.current.offsetWidth}`;
										}
									}}
									onBlur={(e) => {
										const i = fields.indexOf(editField);
										editField.x = parseInt(e.currentTarget.value);
										setFields(
											fields.map((f, index) => {
												if (index == i) {
													return editField;
												}
												return f;
											}),
										);
									}}
									variant={'default'}
									icon={<>x</>}
								/>
								<NumberInput
									defaultValue={editField.y}
									onChange={(e) => {
										if (e.currentTarget.value.length < 1) return;
										e.currentTarget.value = `${e.currentTarget.value.replace(
											/[^0-9]/g,
											'',
										)}`;
										if (
											parseInt(e.currentTarget.value) >
											guiDiv.current.offsetHeight
										) {
											e.currentTarget.value = `${guiDiv.current.offsetHeight}`;
										}
									}}
									onBlur={(e) => {
										const i = fields.indexOf(editField);
										editField.y = parseInt(e.currentTarget.value);
										setFields(
											fields.map((f, index) => {
												if (index == i) {
													return editField;
												}
												return f;
											}),
										);
									}}
									variant={'default'}
									icon={<>y</>}
								/>
							</div>
						) : (
							<div className='opacity-75 text-center'>
								<h1 className='text-2xl'>Nothing here...</h1>
								<p>Select one element to get started!</p>
								<p className='text-sm'>
									Multiple elements aren't supported at this moment.
								</p>
							</div>
						)}
					</div>
				</div>
			</div>
		);
	};

	return (
		<MantineProvider theme={{ colorScheme: 'dark' }}>
			<NotificationsProvider>
				<ModalsProvider>
					<Main />
				</ModalsProvider>
			</NotificationsProvider>
		</MantineProvider>
	);
};

export default App;
