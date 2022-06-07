/* eslint-disable no-mixed-spaces-and-tabs */
import {
  Accordion,
  Button,
  Divider,
  Kbd,
  LoadingOverlay,
  MantineProvider,
  Menu,
  NumberInput,
  Select,
  Slider,
  Switch,
  Tabs,
  Tooltip,
} from '@mantine/core';
import { useDocumentTitle, useHotkeys } from '@mantine/hooks';
import { ModalsProvider, useModals } from '@mantine/modals';
import {
  NotificationsProvider,
  showNotification,
  updateNotification,
} from '@mantine/notifications';
import {
  IconBoxMultiple,
  IconBrush,
  IconCheck,
  IconChevronRight,
  IconClipboard,
  IconClock,
  IconDeviceFloppy,
  IconDots,
  IconFile,
  IconFileDownload,
  IconFolder,
  IconHome,
  IconKeyboard,
  IconLayoutNavbar,
  IconLockOpen,
  IconMinus,
  IconPlus,
  IconQuestionMark,
  IconRefresh,
  IconSettings,
  IconTrashX,
  IconX,
} from '@tabler/icons';
import { AnimatePresence, motion, Transition, Variants } from 'framer-motion';
import { ReactNode, useEffect, useRef, useState } from 'react';

type Field = {
  x: number;
  y: number;
  name: string;
  selected: boolean;
  highlighted: boolean;
  id: number;
  size: number;
  image?: {
    opacity: number;
    path: string;
    saturation: boolean;
  };
};

const App = () => {
  const [fields, setFieldsClean] = useState<Field[]>([]);
  const [editField, setEditField] = useState<Field>();
  const [fieldIndex, setFieldIndex] = useState(0);
  const [loadingOverlay, setLoadingOverlay] = useState(false);
  const [file, setFile] = useState<string>(undefined);
  const [docTitle, setDocTitle] = useState('Start - Graintfa');
  const [screen, setScreen] = useState<'start' | 'editor'>('start');
  const [recent, setRecent] = useState<string[]>([]);
  const [renderStart, setRenderStart] = useState(0);
  const [renderEnd, setRenderEnd] = useState(0);
  const [settings, setSettings] = useState<{
    theme: 'light' | 'dark';
    keepNavOpen: boolean;
  }>(undefined);

  useEffect(() => {
    fetch('http://localhost:736/settings')
      .then((res) => res.json())
      .then((res) => {
        setSettings(res);
        0;
      });
  }, []);

  const modals = useModals();

  const setFields = (newFields: Field[]) => {
    setDocTitle((t) => (!t.startsWith('*') ? `*${t}` : t));
    setFieldsClean(newFields);
  };

  useDocumentTitle(docTitle);

  const guiImg = useRef<HTMLImageElement>(null);
  const fieldImg = useRef<HTMLImageElement>(null);

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
    step = 1
  ) => {
    const selected = fields.filter((f) => f.selected);
    if (selected.length <= 0) return;

    selected.forEach((f) => {
      const i = fields.indexOf(f);
      switch (direction) {
        case 'down':
          if (
            f.y + step >= 0 &&
            f.y + step <= guiImg.current.offsetHeight - f.size
          )
            f.y += step;
          else f.y = guiImg.current.offsetWidth - f.size;
          break;
        case 'up':
          if (
            f.y - step >= 0 &&
            f.y - step <= guiImg.current.offsetHeight - f.size
          )
            f.y -= step;
          else f.y = 0;
          break;
        case 'left':
          if (
            f.x - step >= 0 &&
            f.x - step <= guiImg.current.offsetWidth - f.size
          )
            f.x -= step;
          else f.x = 0;

          break;
        case 'right':
          if (
            f.x + step >= 0 &&
            f.x + step <= guiImg.current.offsetWidth - f.size
          )
            f.x += step;
          else f.x = guiImg.current.offsetWidth - f.size;
          break;
      }

      fields[i] = f;
    });

    setFields(fields.map((f) => f));
  };

  const RenderCanvas = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRefs: Record<
      string,
      React.MutableRefObject<HTMLImageElement>
    > = {};

    const draw = (ctx: CanvasRenderingContext2D) => {
      ctx.drawImage(guiImg.current, 0, 0, 176 * 4, 168 * 4);
      fields.forEach((f) => {
        ctx.drawImage(
          fieldImg.current,
          Math.floor(f.x / 1.36),
          Math.floor(f.y / 1.36),
          (f.size / 100) * 32 * 2,
          (f.size / 100) * 32 * 2
        );
        if (f.image && imageRefs[f.id]?.current) {
          ctx.filter = `saturate(${f.image.saturation ? '100%' : '0%'})`;
          ctx.globalAlpha = f.image.opacity;
          ctx.drawImage(
            imageRefs[f.id].current,
            Math.floor(f.x / 1.36 + 6),
            Math.floor(f.y / 1.36 + 6),
            64 * 0.8,
            64 * 0.8
          );
          ctx.filter = 'none';
          ctx.globalAlpha = 1;
        }
      });
    };

    useEffect(() => {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      context.imageSmoothingEnabled = false;

      draw(context);

      setLoadingOverlay(false);

      setRenderEnd(Date.now());
      updateNotification({
        id: 'render',
        color: 'green',
        title: 'Render completed!',
        message: 'The render was completed successfully.',
        icon: <IconCheck />,
        autoClose: 2000,
      });
    }, [draw]);

    return (
      <>
        <div className="fixed top-12 right-12">
          <Menu
            placement="end"
            withArrow
            transition="slide-up"
            transitionDuration={400}
            transitionTimingFunction="ease"
            control={
              <Button variant="outline" color="cyan">
                Render menu
              </Button>
            }
          >
            <Menu.Label>Render time</Menu.Label>
            <Menu.Item icon={<IconClock />} disabled>
              {renderEnd - renderStart}ms
            </Menu.Item>
            <Divider></Divider>
            <Menu.Label>Render actions</Menu.Label>
            <Menu.Item
              icon={<IconClipboard />}
              onClick={() => {
                canvasRef.current.toBlob((b) => {
                  const item = new ClipboardItem({ 'image/png': b });
                  navigator.clipboard.write([item]);
                  showNotification({
                    message: 'Copied!',
                    color: 'green',
                    icon: <IconCheck />,
                  });
                });
              }}
            >
              Copy to clipboard
            </Menu.Item>
            <Menu.Item
              icon={<IconDeviceFloppy />}
              onClick={() => {
                canvasRef.current.toBlob((b) => {
                  const downloadLink = document.createElement('a');
                  downloadLink.href = window.URL.createObjectURL(b);
                  downloadLink.download = 'graintfaGUI.png';
                  downloadLink.click();
                  downloadLink.remove();
                  showNotification({
                    message: 'Saved!',
                    color: 'green',
                    icon: <IconCheck />,
                  });
                });
              }}
            >
              Save
            </Menu.Item>
            <Menu.Item
              icon={<IconFileDownload />}
              onClick={() => {
                canvasRef.current.toBlob((b) => {
                  const downloadLink = document.createElement('a');
                  downloadLink.href = window.URL.createObjectURL(b);
                  downloadLink.download = 'graintfaGUI.png';
                  downloadLink.click();
                  downloadLink.remove();
                  showNotification({
                    message: 'Saved!',
                    color: 'green',
                    icon: <IconCheck />,
                  });
                  const item = new ClipboardItem({ 'image/png': b });
                  navigator.clipboard.write([item]);
                  showNotification({
                    message: 'Copied!',
                    color: 'green',
                    icon: <IconCheck />,
                  });
                });
              }}
            >
              Save & Copy
            </Menu.Item>
          </Menu>
        </div>
        <div>
          <canvas
            className="inline"
            ref={canvasRef}
            width={256 * 4}
            height={256 * 4}
          />
        </div>
        <div className="hidden">
          {fields
            .filter((f) => f.image != undefined)
            .map((f, i) => {
              imageRefs[f.id] = useRef<HTMLImageElement>();
              return (
                <img
                  width={0}
                  height={0}
                  src={f.image.path}
                  ref={imageRefs[f.id]}
                  style={{
                    opacity: f.image.opacity,
                  }}
                  key={i}
                />
              );
            })}
        </div>
      </>
    );
  };

  const renderGUI = () => {
    if (screen != 'editor') {
      showNotification({
        title: 'No!',
        message: 'You can only render in the editor! Please open a file first.',
        color: 'red',
        icon: <IconX />,
      });
      return;
    }
    showNotification({
      id: 'render',
      loading: true,
      title: 'Rendering...',
      message: 'Your GUI is being rendered...',
      autoClose: false,
      disallowClose: true,
    });
    modals.closeModal('render');
    setRenderStart(Date.now());
    setLoadingOverlay(true);
    modals.openModal({
      size: 'full',
      title: 'Render',
      children: (
        <div style={{ width: '256px', height: '256px' }}>
          <RenderCanvas />
        </div>
      ),
      overlayBlur: 3,
      overlayOpacity: 0.55,
      classNames: {
        modal: 'h-[calc(100vh-6rem)]',
      },
    });
  };

  const openFile = (filePath?: string) => {
    setScreen('editor');
    fetch('http://localhost:736/editor');
    setTimeout(() => {
      setLoadingOverlay(true);
      fetch('http://localhost:736/open', {
        method: 'get',
        headers: {
          filePath: filePath,
        },
      })
        .then((res) => res.json())
        .then((res) => {
          const resType: {
            fieldIndex: number;
            fields: Field[];
            filePath: string;
          } = res;

          setFieldIndex(resType.fieldIndex);
          setFile(resType.filePath);
          setDocTitle(`${resType.filePath.split('\\').pop()} - Graintfa`);
          setLoadingOverlay(false);
          setFieldsClean(
            resType.fields.map((x) => {
              x.selected = false;
              x.highlighted = false;
              return x;
            })
          );
          showNotification({
            title: 'File loaded!',
            message: `Loaded ${resType.filePath.split('\\').pop()} from ${
              resType.filePath
            }!`,
            color: 'cyan',
            icon: <IconFolder></IconFolder>,
          });
        });
    }, 400);
  };

  const saveFile = (cb?: () => void) => {
    setLoadingOverlay(true);
    fetch('http://localhost:736/save', {
      method: 'post',
      headers: {
        fields: JSON.stringify(fields),
        fieldIndex: fieldIndex.toString(),
        filePath: file,
      },
    })
      .then((res) => res.json())
      .then((res) => {
        setLoadingOverlay(false);
        const file: string = res.filePath;
        setFile(file);
        setDocTitle(`${file.split('\\').pop()} - Graintfa`);

        showNotification({
          title: 'File saved!',
          message: `Saved ${file.split('\\').pop()} to ${file}.`,
          color: 'green',
          icon: <IconDeviceFloppy />,
        });
        if (cb) cb();
      });
  };

  const openHomeScreen = () => {
    if (screen != 'start')
      askForClose(() => {
        setLoadingOverlay(true);
        window.location.reload();
      });
    else
      showNotification({
        message: "You're already on the start screen!",
        color: 'red',
      });
  };

  const hotkeys = [
    {
      hotkey: 'mod+alt+s',
      title: 'Open Shortcuts',
      group: 'General',
      onPress: () => {
        openHotkeys();
      },
    },
    {
      hotkey: 'mod+,',
      title: 'Open Settings',
      group: 'General',
      onPress: () => {
        openSettings();
      },
    },
    {
      hotkey: 'f2',
      title: 'Rerender fields',
      group: 'Editor',
      onPress: () => {
        if (screen != 'editor') {
          showNotification({
            title: 'U sure?',
            message: 'Rerendering fields affects the editor only.',
            color: 'yellow',
            icon: <IconQuestionMark />,
          });
          return;
        }
        setFields(fields.map((x) => x));
        showNotification({
          message: 'Rerendered successfully.',
          color: 'green',
          autoClose: 1000,
          icon: <IconCheck />,
        });
      },
    },
    {
      hotkey: 'f12',
      title: 'Render GUI',
      group: 'Editor',
      onPress: () => {
        renderGUI();
      },
    },
    {
      hotkey: 'delete',
      title: 'Remove selected fields',
      group: 'Editor',
      onPress: deleteSelected,
    },
    {
      hotkey: 'backspace',
      group: 'Editor',
      title: 'Remove selected fields',
      onPress: deleteSelected,
    },
    {
      hotkey: 'arrowleft',
      title: 'Move selected fields left',
      group: 'Editor',
      onPress: () => {
        moveSelected('left');
      },
    },
    {
      hotkey: 'arrowright',
      title: 'Move selected fields right',
      group: 'Editor',
      onPress: () => {
        moveSelected('right');
      },
    },
    {
      hotkey: 'arrowup',
      title: 'Move selected fields up',
      group: 'Editor',
      onPress: () => {
        moveSelected('up');
      },
    },
    {
      hotkey: 'arrowdown',
      title: 'Move selected fields down',
      group: 'Editor',
      onPress: () => {
        moveSelected('down');
      },
    },
    {
      hotkey: 'shift+arrowleft',
      title: 'Move selected fields left 10px',
      group: 'Editor',
      onPress: () => {
        moveSelected('left', 10);
      },
    },
    {
      hotkey: 'shift+arrowright',
      title: 'Move selected fields right 10px',
      group: 'Editor',
      onPress: () => {
        moveSelected('right', 10);
      },
    },
    {
      hotkey: 'shift+arrowup',
      title: 'Move selected fields up 10px',
      group: 'Editor',
      onPress: () => {
        moveSelected('up', 10);
      },
    },
    {
      hotkey: 'shift+arrowdown',
      title: 'Move selected fields down 10px',
      group: 'Editor',
      onPress: () => {
        moveSelected('down', 10);
      },
    },
    {
      hotkey: 'mod+a',
      title: 'Select all fields',
      group: 'Editor',
      onPress: () => {
        fields.map((f) => {
          f.selected = true;
          f.highlighted = false;
          return f;
        });

        setFields(fields.map((f) => f));
        setEditField(undefined);
      },
    },
    {
      hotkey: 'mod+d',
      title: 'Deselect all fields',
      group: 'Editor',
      onPress: () => {
        fields.map((f) => {
          f.selected = false;
          f.highlighted = false;
          return f;
        });

        setFields(fields.map((f) => f));
        setEditField(undefined);
      },
    },
    {
      hotkey: 'mod+s',
      title: 'Save file',
      group: 'File',
      onPress: () => {
        saveFile();
      },
    },
    {
      hotkey: 'mod+o',
      title: 'Open file',
      group: 'File',
      onPress: () => {
        openFile();
      },
    },
    {
      hotkey: 'mod+h',
      title: 'Home screen',
      group: 'Window',
      onPress: () => {
        openHomeScreen();
      },
    },
    {
      hotkey: 'mod+n',
      title: 'New file',
      group: 'File',
      onPress: () => {
        setScreen('editor');
      },
    },
  ];

  const openHotkeys = () => {
    const optimizeKeyName = (key: string) => {
      switch (key) {
        case 'mod':
          key = 'Ctrl';
          break;
        case 'arrowup':
          key = '⬆';
          break;
        case 'arrowdown':
          key = '⬇';
          break;
        case 'arrowleft':
          key = '⬅';
          break;
        case 'arrowright':
          key = '➡';
          break;
        default:
          {
            const letters = key.split('');
            letters[0] = letters[0].toUpperCase();
            key = letters.join('');
          }
          break;
      }
      return key;
    };

    modals.openModal({
      size: 'full',
      children: (
        <>
          <h1>
            <IconKeyboard className="inline my-auto mr-2" />
            Hotkeys
          </h1>
          {Array.from(new Set(hotkeys.map((k) => k.group)).values()).map(
            (g, i) => {
              return (
                <div key={`hotkey group ${i}`}>
                  <Divider my="xs" label={g} labelPosition="center" />
                  <div className="grid grid-cols-3 gap-4">
                    {hotkeys
                      .filter((k) => k.group == g)
                      .map((k, i) => {
                        return (
                          <div key={`hotkey ${i}`}>
                            <p>{k.title}</p>

                            {k.hotkey.split('+').map((k, i) => {
                              k = optimizeKeyName(k);
                              return <Kbd key={i}>{k}</Kbd>;
                            })}
                          </div>
                        );
                      })}
                  </div>
                </div>
              );
            }
          )}
        </>
      ),
    });
  };

  useHotkeys(
    hotkeys.map((k) => {
      return [k.hotkey, k.onPress];
    })
  );

  const FieldText = (props: { name: string; id: number; field: Field }) => {
    const { name, id, field: f } = props;
    return (
      <p
        className={`px-4 ${
          f.highlighted || f.selected
            ? 'dark:bg-gray-600 bg-gray-300'
            : 'hover:dark:bg-gray-600 hover:bg-gray-300'
        }`}
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
              })
            );
            setEditField(undefined);
          } else {
            const index = fields.indexOf(f);

            if (!f.selected) setEditField(fields[index]);
            else setEditField(undefined);

            const selected = f.selected;

            if (!e.ctrlKey)
              fields.forEach((f, i) => {
                fields[i].selected = false;
                fields[i].highlighted = false;
              });
            fields[index].selected = !selected;

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

    return (
      <div
        style={{
          width: `${f.size}px`,
          height: `${f.size}px`,
          top: `${f.y + guiImg.current.offsetTop}px`,
          left: `${f.x + guiImg.current.offsetLeft}px`,
        }}
        className="absolute"
      >
        <img
          ref={fieldImg}
          draggable={false}
          src="http://localhost:736/assets/minecraft_inv_field.png"
          width={f.size}
          className={`absolute top-0 left-0 ${
            f.selected
              ? 'border-4 border-blue-500'
              : f.highlighted
              ? 'border-4 border-yellow-400'
              : ''
          } pointer-events-auto`}
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

            const selected = f.selected;

            if (!e.ctrlKey)
              fields.forEach((f, i) => {
                fields[i].selected = false;
                fields[i].highlighted = false;
              });
            fields[index].selected = !selected;

            setFields(fields.map((f) => f));
          }}
        />
        {f.image ? (
          <div
            className="grid place-items-center absolute top-0 left-0"
            style={{ width: `${f.size}px`, height: `${f.size}px` }}
          >
            <img
              src={f.image.path}
              className={`w-[75px] h-[75px] ${
                !f.image.saturation ? 'saturate-0' : ''
              }`}
              style={{
                opacity: f.image.opacity,
              }}
            />
          </div>
        ) : (
          <></>
        )}
      </div>
    );
  };

  const Main = () => {
    return (
      <div className="bg-gray-200 dark:bg-gray-800 text-neutral-900 dark:text-white w-screen min-h-[calc(100vh-12rem/4)]">
        <div className="grid grid-cols-6 h-[calc(100vh-12rem/4)]">
          <div className="fieldList bg-gray-200 dark:bg-gray-800 col-span-1 w-full h-[calc(100vh-12rem/4)] overflow-y-auto scrollbar">
            {fields.length > 0 ? (
              <>
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
              </>
            ) : (
              <div className="opacity-75 grid place-items-center h-[calc(100vh-12rem/4)] text-center">
                <div className="px-4">
                  <h2 className="text-2xl">No fields</h2>
                  <p>
                    There are no fields on the GUI. You can add some by
                    shift-clicking the GUI you want to add a field.
                  </p>
                  <p className="text-sm">
                    <Kbd>Ctrl</Kbd>
                    <Kbd>Alt</Kbd>
                    <Kbd>S</Kbd> for hotkeys
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="guiEditor bg-gray-100 dark:bg-gray-900 col-span-4 w-full h-[calc(100vh-12rem/4)] overflow-x-scroll overflow-y-scroll relative scrollbar">
            <div className="h-[calc(100vh-12rem/4)] w-full grid place-items-center">
              <div
                onClick={(e) => {
                  const boundingRect = e.currentTarget.getBoundingClientRect();

                  const [mouseX, mouseY] = [
                    e.clientX - boundingRect.left,
                    e.clientY - boundingRect.top,
                  ];

                  if (!e.shiftKey) return;

                  setFieldIndex(fieldIndex + 1);

                  const field: Field = {
                    x: Math.round(mouseX),
                    y: Math.round(mouseY),
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
                  ref={guiImg}
                  draggable={false}
                  src="http://localhost:736/assets/minecraft_inv_default.png"
                  style={{
                    minWidth: '960px',
                    maxWidth: '960px',
                  }}
                />
                <div className="absolute top-0 left-0 w-full h-[calc(100vh-12rem/4)] pointer-events-none">
                  {fields.map((f, i) => (
                    <Field field={f} id={i} key={i}></Field>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div
            className={`fieldProperties bg-gray-300 dark:bg-gray-700 px-6 col-span-1 w-full h-[calc(100vh-12rem/4)] overflow-y ${
              !editField ? 'grid place-items-center' : ''
            } overflow-x-hidden overflow-y-auto max-w-full`}
          >
            {editField ? (
              <div>
                <h1 className="text-2xl">Edit {editField.name}</h1>
                <hr className="my-6 opacity-50" />
                <p className="text-xl">Position:</p>
                <NumberInput
                  defaultValue={editField.x}
                  min={0}
                  max={guiImg.current.offsetWidth - editField.size}
                  onBlur={(e) => {
                    const i = fields.indexOf(editField);
                    const val = parseInt(e.currentTarget.value);
                    editField.x =
                      val >= 0 &&
                      val <= guiImg.current.offsetWidth - editField.size
                        ? val
                        : val < 0
                        ? 0
                        : guiImg.current.offsetWidth - editField.size;
                    setFields(
                      fields.map((f, index) => {
                        if (index == i) {
                          return editField;
                        }
                        return f;
                      })
                    );
                  }}
                  variant={'default'}
                  classNames={{
                    input: 'bg-black bg-opacity-25 rounded-md',
                    control: 'bg-black bg-opacity-25',
                  }}
                  icon={<>x</>}
                />
                <div className="my-2"></div>
                <NumberInput
                  defaultValue={editField.y}
                  min={0}
                  max={guiImg.current.offsetHeight - editField.size}
                  onBlur={(e) => {
                    const i = fields.indexOf(editField);
                    const val = parseInt(e.currentTarget.value);
                    editField.y =
                      val >= 0 &&
                      val <= guiImg.current.offsetHeight - editField.size
                        ? val
                        : val < 0
                        ? 0
                        : guiImg.current.offsetHeight - editField.size;
                    setFields(
                      fields.map((f, index) => {
                        if (index == i) {
                          return editField;
                        }
                        return f;
                      })
                    );
                  }}
                  variant={'default'}
                  classNames={{
                    input: 'bg-black bg-opacity-25 rounded-md',
                    control: 'bg-black bg-opacity-25',
                  }}
                  icon={<>y</>}
                />
                <hr className="my-4 opacity-50" />
                <p className="text-xl">Size:</p>
                <Slider
                  disabled
                  step={1}
                  min={100}
                  max={300}
                  label={(v) => `x${v / 100}`}
                  defaultValue={editField.size}
                  marks={[
                    { value: 100, label: 'x1' },
                    { value: 200, label: 'x2' },
                    { value: 300, label: 'x3' },
                  ]}
                  color="cyan"
                  /* onChangeEnd={(e) => {
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
									}} */
                ></Slider>
                <hr className="my-6 opacity-50" />
                <Accordion
                  styles={{
                    control: {
                      ':hover': {
                        backgroundColor: '#2c2e3333',
                      },
                    },
                  }}
                >
                  <Accordion.Item label="Item texture">
                    <p>
                      Select an item texture to display over the slot texture.
                      Is useful to show the user which item or item type to put
                      in the slot.
                    </p>
                    {editField.image ? (
                      <>
                        <Button
                          variant="outline"
                          color="red"
                          onClick={() => {
                            const fieldIndex = fields.indexOf(editField);
                            fields[fieldIndex].image = undefined;
                            setFields(fields.map((f) => f));
                          }}
                        >
                          Remove
                        </Button>
                        <div className="my-4" />
                        <Slider
                          defaultValue={editField.image.opacity}
                          step={0.05}
                          min={0}
                          max={1}
                          marks={[
                            { value: 0, label: '0%' },
                            { value: 0.5, label: '50%' },
                            { value: 1, label: '100%' },
                          ]}
                          label={(v) => `${Math.floor(v * 100)}%`}
                          onChangeEnd={(e) => {
                            const i = fields.indexOf(editField);
                            fields[i].image.opacity = e;
                            setFields(fields.map((f) => f));
                          }}
                        />
                        <div className="my-8" />
                        <Switch
                          label="Saturation"
                          defaultChecked={editField.image.saturation}
                          onChange={(e) => {
                            const i = fields.indexOf(editField);
                            fields[i].image.saturation =
                              e.currentTarget.checked;
                            setFields(fields.map((f) => f));
                          }}
                        />
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setLoadingOverlay(true);
                          fetch('http://localhost:736/openItemTexture')
                            .then((res) => res.json())
                            .then((res) => {
                              setLoadingOverlay(false);
                              const fieldIndex = fields.indexOf(editField);
                              fields[fieldIndex].image = {
                                opacity: 1.0,
                                path: res.filePath[0],
                                saturation: true,
                              };
                              setFields(fields.map((f) => f));
                            });
                        }}
                      >
                        Load image!
                      </Button>
                    )}
                  </Accordion.Item>
                </Accordion>
              </div>
            ) : (
              <div className="opacity-75 text-center">
                <h1 className="text-2xl">Nothing here...</h1>
                <p>Select one element to get started!</p>
                <p className="text-sm">
                  Multiple elements aren't supported at this moment.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const Start = () => {
    useEffect(() => {
      fetch('http://localhost:736/recent')
        .then((res) => res.json())
        .then((res) => {
          setRecent(res);
        });
    }, []);
    return (
      <div className="bg-gray-200 dark:bg-gray-800 text-neutral-900 dark:text-white w-screen min-h-[calc(100vh-12rem/4)] grid place-items-center">
        <div className="w-5/6 h-5/6 drop-shadow-lg mb-28">
          <div className="grid grid-cols-6 h-[calc(100vh-12rem/4)]">
            <div className="col-span-1 bg-gray-100 dark:bg-gray-700 p-4 rounded-l-lg">
              <div
                className="opacity-75 hover:opacity-100 transition-opacity duration-100 cursor-pointer"
                onClick={() => {
                  setScreen('editor');
                  fetch('http://localhost:736/editor');
                  setDocTitle('Unknown - Graintfa');
                }}
              >
                <h1 className="text-2xl">
                  <IconPlus className="inline" /> Create new
                </h1>
                <p>Create a new blank GUI file</p>
              </div>
              <div className="my-4"></div>
              <div
                className="opacity-75 hover:opacity-100 transition-opacity duration-100 cursor-pointer"
                onClick={() => {
                  openFile();
                }}
              >
                <h1 className="text-2xl">
                  <IconFolder className="inline" /> Open
                </h1>
                <p>Open an existing Graintfa file</p>
              </div>
              <div className="my-4"></div>
              <div
                className="opacity-75 hover:opacity-100 transition-opacity duration-100 cursor-pointer"
                onClick={() => {
                  openSettings();
                }}
              >
                <h1 className="text-2xl">
                  <IconSettings className="inline" /> Settings
                </h1>
                <p>Set up stuff</p>
              </div>
              <div className="my-4"></div>
              <div
                className="opacity-75 hover:opacity-100 transition-opacity duration-100 cursor-pointer"
                onClick={() => {
                  openHotkeys();
                }}
              >
                <h1 className="text-2xl">
                  <IconKeyboard className="inline" /> Hotkeys
                </h1>
                <p>View all keyboard shortcuts</p>
              </div>
            </div>
            <div className="col-span-5 bg-gray-200 dark:bg-gray-600 p-4 rounded-r-lg overflow-y-auto scrollbar">
              <h1 className="text-3xl">Graintfa</h1>
              <hr className="opacity-25 my-4" />
              {recent.length > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                  {recent.reverse().map((f, i) => {
                    const fileName = f.split('\\').pop();
                    return (
                      <Tooltip label={f} withArrow color={'gray'} key={i}>
                        <p
                          className="px-4 py-2 bg-gray-400 dark:bg-slate-800 opacity-75 hover:opacity-100 rounded-md transition-all duration-200 cursor-pointer"
                          onClick={() => {
                            openFile(f);
                          }}
                        >
                          {fileName}
                        </p>
                      </Tooltip>
                    );
                  })}
                </div>
              ) : (
                <div className="opacity-50 h-full text-center">
                  <div>
                    <h2 className="text-2xl">No recent files</h2>
                    <p>Why don't you create or open one?</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const askForClose = (
    f: () => void,
    title = 'Are you sure you want to close?',
    children = <>Unsaved changes will be lost!</>
  ) => {
    modals.openConfirmModal({
      title: title,
      children: children,
      id: 'close',
      labels: {
        cancel: 'No',
        confirm: 'Yes',
      },
      withCloseButton: false,
      confirmProps: { color: 'green', variant: 'outline' },
      cancelProps: { color: 'red', variant: 'outline' },
      onConfirm() {
        f();
      },
    });
  };

  const askForSave = () => {
    askForClose(
      () => {
        window.location.reload();
      },
      'Reload?',
      <>
        Graintfa needs to reload to apply all changes. Unsaved changes will be
        lost. Do you want to continue? You can also reload manually.
      </>
    );
  };

  const askForOpen = () => {
    if (screen == 'start') return openFile();
    askForClose(
      () => {
        openFile();
      },
      'Open file?',
      <>Unsaved changes will be lost.</>
    );
  };

  const askForReload = () => {
    if (screen == 'start') return window.location.reload();
    askForClose(
      () => {
        window.location.reload();
      },
      'Reload?',
      <>Unsaved changes will be lost.</>
    );
  };

  const fetchSettings = () => {
    fetch('http://localhost:736/settings')
      .then((res) => res.json())
      .then((res) => {
        setSettings(res);
      });
  };

  const openSettings = () => {
    fetchSettings();
    modals.openModal({
      id: 'settings',
      size: 'full',
      title: 'Settings',
      classNames: {
        modal: 'h-3/4',
      },
      children: (
        <Tabs
          color="cyan"
          orientation="vertical"
          classNames={{ body: 'w-[90%]' }}
          tabPadding="xl"
        >
          <Tabs.Tab label="General" icon={<IconDots />}>
            <Divider
              my="xs"
              label={
                <>
                  <IconBrush size={12} /> <p className="ml-2">Theme</p>
                </>
              }
              labelPosition="center"
            />

            <Select
              label="Theme"
              defaultValue={settings.theme}
              data={[
                { value: 'dark', label: 'Dark mode' },
                { value: 'light', label: 'Light mode' },
              ]}
              onChange={(e) => {
                setSettings((s) => {
                  if (e != 'light' && e != 'dark') return;
                  s.theme = e;
                  fetch('http://localhost:736/settings', {
                    method: 'post',
                    headers: {
                      settings: JSON.stringify(s),
                    },
                  });
                  return s;
                });
              }}
            />
            <div className="my-2" />
            <Button
              color="green"
              variant="outline"
              onClick={() => {
                askForSave();
              }}
            >
              Apply
            </Button>

            <Divider
              my="xs"
              label={
                <>
                  <IconFile size={12} /> <p className="ml-2">Recent files</p>
                </>
              }
              labelPosition="center"
            />

            <Button
              variant="outline"
              onClick={() => {
                fetch('http://localhost:736/recent/clear');
                setRecent([]);
                showNotification({
                  message: 'Cleared recent files!',
                  color: 'green',
                });
              }}
            >
              Clear recent files
            </Button>
          </Tabs.Tab>
          <Tabs.Tab label="Nav" icon={<IconLayoutNavbar />}>
            <Divider
              my="xs"
              label={
                <>
                  <IconLockOpen size={12} /> <p className="ml-2">Keep open</p>
                </>
              }
              labelPosition="center"
            />
            <Switch
              label="Keep nav opened"
              defaultChecked={
                settings?.keepNavOpen != undefined
                  ? settings.keepNavOpen
                  : false
              }
              onChange={(e) => {
                const on = e.currentTarget.checked;
                setSettings((s) => {
                  s.keepNavOpen = on;
                  fetch('http://localhost:736/settings', {
                    method: 'post',
                    headers: {
                      settings: JSON.stringify(s),
                    },
                  });
                  return s;
                });
              }}
            />
          </Tabs.Tab>
        </Tabs>
      ),
    });
  };

  const screens = {
    start: Start(),
    editor: Main(),
  };

  const Nav = () => {
    const keepNavOpen =
      settings?.keepNavOpen != undefined ? settings.keepNavOpen : false;

    const [navOpened, setNavOpened] = useState(keepNavOpen);

    const containerTransition: Transition = !keepNavOpen
      ? { staggerChildren: 0.1 }
      : {};

    const container: Variants = {
      show: {
        opacity: 1,
        transition: containerTransition,
      },
      exit: {
        transition: containerTransition,
      },
    };

    const itemTransition: Transition = !keepNavOpen
      ? {
          type: 'spring',
          stiffness: 50,
          mass: 0.75,
        }
      : {
          duration: 0,
          ease: 'linear',
        };

    const item: Variants = !keepNavOpen
      ? {
          hidden: { opacity: 0, y: 200 },
          show: {
            opacity: 1,
            y: 0,
            transition: itemTransition,
          },
          exit: { opacity: 0, y: 200, transition: itemTransition },
        }
      : {
          hidden: { opacity: 1, y: 0 },
          show: {
            opacity: 1,
            y: 0,
            transition: itemTransition,
          },
          exit: { opacity: 1, y: 0, transition: itemTransition },
        };

    const controls: {
      icon: ReactNode;
      label: string;
      disabled: boolean;
      click: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
    }[] = [
      {
        icon: <IconHome />,
        label: 'Start screen (Ctrl+H)',
        disabled: false,
        click: () => {
          openHomeScreen();
        },
      },
      {
        icon: <IconDeviceFloppy />,
        label: 'Save (Ctrl+S)',
        disabled: screen != 'editor',
        click: () => {
          saveFile();
        },
      },
      {
        icon: <IconFolder />,
        label: 'Open (Ctrl+O)',
        disabled: false,
        click: () => {
          askForOpen();
        },
      },
      {
        icon: <IconSettings />,
        label: 'Settings (Ctrl+,)',
        disabled: false,
        click: () => {
          openSettings();
        },
      },
      {
        icon: <IconRefresh />,
        label: 'Refresh',
        disabled: false,
        click: () => {
          askForReload();
        },
      },
      {
        icon: <IconKeyboard />,
        label: 'Hotkeys (Ctrl+Alt+S)',
        disabled: false,
        click: () => {
          openHotkeys();
        },
      },
    ];

    return (
      <div
        className={`w-full h-12 bg-gray-400 dark:bg-gray-800 fixed bottom-0 left-0 z-80 backdrop-blur-lg ${
          navOpened
            ? 'bg-gray-300 dark:bg-gray-700'
            : 'hover:bg-gray-300 dark:hover:bg-gray-700'
        } transition-opacity duration-100 text-neutral-900 dark:text-white group`}
      >
        <div className="w-full h-[calc(100vh-12rem/4)] flex flex-row gap-4">
          <div
            onClick={() => {
              if (keepNavOpen) return;
              setNavOpened((o) => !o);
            }}
            className={`${!keepNavOpen ? 'cursor-pointer' : ''}`}
          >
            <img
              src="http://localhost:736/assets/logo_white.svg"
              className="h-12 w-12 hidden dark:inline"
            />
            <img
              src="http://localhost:736/assets/logo_black.svg"
              className="h-12 w-12 inline dark:hidden"
            />
            {!keepNavOpen ? (
              <IconChevronRight
                className={`transition-all duration-200 ease-in-out my-auto inline ${
                  navOpened ? 'rotate-180' : 'opacity-0 group-hover:opacity-100'
                }`}
              />
            ) : (
              <></>
            )}
          </div>
          <AnimatePresence>
            {navOpened ? (
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                exit="exit"
                className="flex flex-row"
              >
                {controls.map((c, i) => {
                  return (
                    <Tooltip
                      key={i}
                      className="cursor-pointer"
                      label={c.label}
                      onClick={(e) => {
                        if (c.disabled) return;
                        c.click(e);
                        setNavOpened(false);
                      }}
                      withArrow
                    >
                      <motion.div
                        variants={item}
                        className={`w-12 h-12 ${
                          c.disabled
                            ? 'opacity-50 text-neutral-600 dark:text-neutral-400'
                            : 'hover:bg-gray-300 dark:hover:bg-gray-800'
                        } grid place-items-center transition-colors duration-100`}
                      >
                        {c.icon}
                      </motion.div>
                    </Tooltip>
                  );
                })}
              </motion.div>
            ) : (
              ''
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  return (
    <>
      {loadingOverlay ? (
        <div className="grid place-items-center absolute w-full top-0 left-0">
          <Button
            color="red"
            className="z-50"
            onClick={() => {
              setLoadingOverlay(false);
            }}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <></>
      )}
      <LoadingOverlay visible={loadingOverlay} zIndex={49} />
      <div className="h-[calc(100vh-12rem/4)] w-full bg-gray-200 dark:bg-gray-900 overflow-hidden">
        <div className="titleBar h-8 w-full bg-slate-300 dark:bg-slate-700 flex flex-row justify-between text-black dark:text-white text-center">
          <img
            src="http://localhost:736/assets/logo_white.svg"
            className="h-8 w-8 hidden dark:inline opacity-50"
          />
          <img
            src="http://localhost:736/assets/logo_black.svg"
            className="h-8 w-8 inline dark:hidden opacity-50"
          />
          <div className="my-auto w-full title-bar-drag">{docTitle}</div>
          <div className="flex flex-row cursor-pointer">
            <div
              className="h-full px-2 bg-white bg-opacity-0 hover:bg-opacity-25 transition-all duration-100"
              onClick={() => {
                fetch('http://localhost:736/program/minimize');
              }}
            >
              <IconMinus className="my-auto h-full" />
            </div>
            {/* <div
							className='h-full px-2 bg-white bg-opacity-0 hover:bg-opacity-25 transition-all duration-100'
							onClick={() => {
								fetch('http://localhost:736/program/maximize');
							}}
						>
							<IconBoxMultiple className='my-auto h-full' />
						</div> */}
            <div
              className="h-full px-2 bg-[#ff3434] bg-opacity-0 hover:bg-opacity-100 transition-all duration-100"
              onClick={() => {
                fetch('http://localhost:736/program/close');
              }}
            >
              <IconX className="my-auto h-full" />
            </div>
          </div>
        </div>
        <AnimatePresence initial={false} exitBeforeEnter>
          <motion.div
            key={screen}
            initial={{ opacity: 0, x: -200 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 200 }}
            transition={{
              duration: 0.3,
            }}
          >
            {screens[screen]}
          </motion.div>
        </AnimatePresence>
        <Nav />
      </div>
    </>
  );
};

const Wrappers = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    fetch('http://localhost:736/theme')
      .then((res) => res.json())
      .then((res) => {
        setTheme(res);
      });
  }, []);

  return (
    <MantineProvider
      theme={{ colorScheme: theme, loader: 'bars', primaryColor: 'cyan' }}
    >
      <ModalsProvider>
        <NotificationsProvider>
          <div className={theme}>
            <App />
          </div>
        </NotificationsProvider>
      </ModalsProvider>
    </MantineProvider>
  );
};

export default Wrappers;
