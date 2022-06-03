import { MantineProvider, NumberInput, Slider } from '@mantine/core';
import { useHotkeys, useMouse } from '@mantine/hooks';
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
	const [fieldIndex, setFieldIndex] = useState(0);

	const guiDiv = useRef<HTMLImageElement>();

	const deleteSelected = () => {
		const selected = fields.filter((f) => f.selected);
		if (selected.length <= 0) return;
		selected.forEach((f) => {
			fields.splice(fields.indexOf(f), 1);
		});
		setFields(fields.map((f) => f));
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
					if (
						f.y + step >= 0 &&
						f.y + step <= guiDiv.current.offsetHeight - f.size
					)
						f.y += step;
					else f.y = guiDiv.current.offsetWidth - f.size;
					break;
				case 'up':
					if (
						f.y - step >= 0 &&
						f.y - step <= guiDiv.current.offsetHeight - f.size
					)
						f.y -= step;
					else f.y = 0;
					break;
				case 'left':
					if (
						f.x - step >= 0 &&
						f.x - step <= guiDiv.current.offsetWidth - f.size
					)
						f.x -= step;
					else f.x = 0;

					break;
				case 'right':
					if (
						f.x + step >= 0 &&
						f.x + step <= guiDiv.current.offsetWidth - f.size
					)
						f.x += step;
					else f.x = guiDiv.current.offsetWidth - f.size;
					break;
			}

			fields[i] = f;
		});

		setFields(fields.map((f) => f));
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

				setFields(fields.map((f) => f));
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

				setFields(fields.map((f) => f));
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
								if (f.id == id) f.selected = !f.selected;
								if (i >= from && i <= to) f.selected = true;
								f.highlighted = false;
								return f;
							}),
						);
						setEditField(undefined);
					} else {
						const index = fields.indexOf(f);

						if (!f.selected) setEditField(fields[index]);
						else setEditField(undefined);

						if (!e.ctrlKey)
							fields.forEach((f, i) => {
								fields[i].selected = false;
								fields[i].highlighted = false;
							});
						fields[index].selected = !f.selected;

						setFields(fields.map((f) => f));
					}
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
						setFields(fields.map((f) => f));
						setEditField(undefined);
						return;
					}

					const index = fields.indexOf(f);

					if (!f.selected) setEditField(fields[index]);
					else setEditField(undefined);

					if (!e.ctrlKey)
						fields.forEach((f, i) => {
							fields[i].selected = false;
							fields[i].highlighted = false;
						});
					fields[index].selected = !f.selected;

					setFields(fields.map((f) => f));
				}}
			/>
		);
	};

	const Main = () => {
		return (
			<div className='bg-gray-800 text-white w-screen min-h-screen'>
				<div className='grid grid-cols-6 h-screen'>
					<div className='fieldList bg-gray-800 col-span-1 w-full h-full overflow-x-visible overflow-y-auto'>
						{fields.map((f) => {
							return (
								<FieldText
									name={f.name}
									id={f.id}
									field={f}
									key={`field text ${f.id}`}
								></FieldText>
							);
						})}
					</div>
					<div className='guiEditor bg-gray-900 col-span-4 w-full h-full overflow-x-scroll overflow-y-scroll relative'>
						<div className='h-full w-full grid place-items-center'>
							<div
								onClick={(e) => {
									const [offsetLeft, offsetTop, offsetWidth, offsetHeight] = [
										guiDiv.current.offsetLeft,
										guiDiv.current.offsetTop,
										guiDiv.current.offsetWidth,
										guiDiv.current.offsetHeight,
									];
									console.log(
										offsetLeft,
										offsetTop,
										offsetWidth,
										offsetHeight,
										e.currentTarget.clientTop,
									);

									const boundingRect = e.currentTarget.getBoundingClientRect();

									const [mouseX, mouseY] = [
										e.clientX - boundingRect.left,
										e.clientY - boundingRect.top,
									];

									if (!e.shiftKey) return;

									setFieldIndex(fieldIndex + 1);

									const field: Field = {
										x: mouseX,
										y: mouseY,
										name: `field ${fieldIndex + 1}`,
										selected: true,
										highlighted: false,
										id: fieldIndex + 1,
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
								<img
									ref={guiDiv}
									src='./assets/minecraft_inv_default.png'
									style={{
										minWidth: '960px',
										maxWidth: '960px',
									}}
								/>
								<div className='absolute top-0 left-0 w-full h-full pointer-events-none'>
									{fields.map((f, i) => (
										<Field field={f} id={i} key={i}></Field>
									))}
								</div>
							</div>
						</div>
					</div>
					<div
						className={`fieldProperties bg-gray-700 px-6 col-span-1 w-full h-full overflow-y ${
							!editField ? 'grid place-items-center' : ''
						} overflow-x-hidden overflow-y-auto max-w-full`}
					>
						{editField ? (
							<div>
								<h1 className='text-2xl'>Edit {editField.name}</h1>
								<hr className='my-6 opacity-50' />
								<p className='text-xl'>Position:</p>
								<NumberInput
									defaultValue={editField.x}
									min={0}
									max={guiDiv.current.offsetWidth - editField.size}
									onBlur={(e) => {
										const i = fields.indexOf(editField);
										const val = parseInt(e.currentTarget.value);
										editField.x =
											val >= 0 &&
											val <= guiDiv.current.offsetWidth - editField.size
												? val
												: val < 0
												? 0
												: guiDiv.current.offsetWidth - editField.size;
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
									min={0}
									max={guiDiv.current.offsetHeight - editField.size}
									onBlur={(e) => {
										const i = fields.indexOf(editField);
										const val = parseInt(e.currentTarget.value);
										editField.y =
											val >= 0 &&
											val <= guiDiv.current.offsetHeight - editField.size
												? val
												: val < 0
												? 0
												: guiDiv.current.offsetHeight - editField.size;
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

								<hr className='my-4 opacity-50' />

								<p className='text-xl'>Size:</p>
								<Slider
									step={1}
									min={100}
									max={300}
									label={(v) => `${v}%`}
									defaultValue={editField.size}
									marks={[
										{ value: 100, label: '100%' },
										{ value: 150, label: '150%' },
										{ value: 200, label: '200%' },
										{ value: 250, label: '250%' },
										{ value: 300, label: '300%' },
									]}
									onChangeEnd={(e) => {
										const i = fields.indexOf(editField);
										editField.size = e;
										setFields(
											fields.map((f) => {
												if (f.id == i) {
													return editField;
												}
												return f;
											}),
										);
									}}
								></Slider>
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
