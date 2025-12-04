import styles from '../styles/UploadDetails.module.css';
import { Content } from '../pages/Create';
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from 'react-icons/md';
import React, { useEffect, useRef, useState } from 'react';
import {
  apiClient,
  debounce,
  getFilterValue,
  getUrl,
  moveRangeOutOfInlineParents,
  sanitizeInput,
  saveSelection,
  serverUrl,
  streamResponse,
} from '../Utilities';
import { IoArrowBack } from 'react-icons/io5';
import { IoClose, IoSearchSharp } from 'react-icons/io5';
import Cropper, { Area } from 'react-easy-crop';
import { toast } from 'sonner';
import { createPortal } from 'react-dom';
import { BsDot } from 'react-icons/bs';
import LoadingAnimation from './LoadingAnimation';
import PostLoader from './PostLoader';

type UploadDetailsProps = {
  setStage: React.Dispatch<
    React.SetStateAction<{
      reel: 'select' | 'edit' | 'finish';
      content: 'select' | 'edit' | 'finish';
      story: 'select' | 'edit' | 'finish';
    }>
  >;
  editedFiles: Content[];
  rawFiles: Map<string, File>;
  contentIndex: number;
  setContentIndex: React.Dispatch<React.SetStateAction<number>>;
  aspectRatio: number | 'initial';
  videosCropArea: Map<string, Area>;
};

type MentionModalProps = {
  mentions: Set<string>;
  setShowMentionModal: React.Dispatch<React.SetStateAction<boolean>>;
  updateMentionList: (id: string, username: string, name: string) => () => void;
};

const maxFileDescriptionLength = 800;
const maxGeneralDescriptionLength = 2200;

const getUsers = async (...args: any[]) => {
  const [query, page, cursor] = args;

  try {
    const { data } = await apiClient(
      `v1/search/users?query=${query}&page=${page}&cursor=${cursor}`
    );

    return data.data.result;
  } catch {
    return 'error';
  }
};

const debouncedQuery = debounce(getUsers, 300);

const UploadDetails = ({
  setStage,
  editedFiles,
  contentIndex,
  aspectRatio,
  setContentIndex,
  videosCropArea,
  rawFiles,
}: UploadDetailsProps) => {
  const [currentFileIndex, setCurrentFileIndex] = useState<number>(0);
  const [generalDescription, setGeneralDescription] = useState<string>('');
  const [fileDescriptions, setFileDescriptions] = useState<Map<string, string>>(
    new Map()
  );
  const [savedRange, setSavedRange] = useState<{
    range: Range;
    selection: Selection;
  }>(null!);
  const [mentions, setMentions] = useState<Set<string>>(new Set());
  const [showMentionModal, setShowMentionModal] = useState<boolean>(false);
  const [addTag, setAddTag] = useState<boolean>(false);
  const [searchData, setSearchData] = useState<{
    cursor: Date;
    end: boolean;
    page: number;
  }>({ cursor: null!, end: false, page: 1 });

  const [loading, setLoading] = useState<{
    display: boolean;
    query: string;
    value: boolean | 'error';
  }>({ value: false, query: '', display: false });

  const [searchResult, setSearchResult] = useState<any[]>([]);
  const [collaborators, setCollaborators] = useState<
    { id: string; username: string }[]
  >([]);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [cropIndex, setCropIndex] = useState<number>(0);
  const [cropAreas, setCropAreas] = useState<Map<string, Area>>(new Map());
  const [cropping, setCropping] = useState(false);
  const [settings, setSettings] = useState({
    accessibility: 0,
    disableComments: false,
    hideEngagements: false,
  });
  const [postStage, setPostStage] = useState<{
    value: 'preparing' | 'validating' | 'processing' | 'saving' | 'finish';
    filesIndexes: Set<number>;
  }>({ value: 'preparing', filesIndexes: new Set() });
  const [postProgress, setPostProgress] = useState(0);

  const dotRef = useRef<HTMLSpanElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const collaboratorRef = useRef<HTMLInputElement>(null!);
  const carouselRef = useRef<HTMLDivElement>(null!);
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const descriptionRef = useRef<HTMLDivElement>(null!);
  const collaboratorSearchRef = useRef<HTMLDivElement>(null!);
  const progressInterval = useRef<number | NodeJS.Timeout>(null!);

  useEffect(() => {
    const resizeHandler = () => {
      if (window.matchMedia('(max-width: 510px)').matches) {
        const size = window.innerWidth;

        carouselRef.current.style.width = `${size - 4}px`;
        carouselRef.current.style.height = `${size - 4}px`;
      } else {
        carouselRef.current.style.width = '500px';
        carouselRef.current.style.height = '500px';
      }
    };

    const clickHandler = (e: PointerEvent) => {
      if (collaboratorSearchRef.current) {
        const target = e.target as HTMLElement;
        if (
          target !== collaboratorSearchRef.current &&
          !collaboratorSearchRef.current.contains(target)
        ) {
          setLoading({
            display: false,
            value: false,
            query: '',
          });
          setSearchData({
            page: 1,
            cursor: null!,
            end: false,
          });
          setSearchResult([]);
        }
      }
    };

    if (descriptionRef.current) {
      descriptionRef.current.focus();
    }

    resizeHandler();

    window.addEventListener('resize', resizeHandler);
    window.addEventListener('click', clickHandler);

    return () => {
      window.removeEventListener('resize', resizeHandler);
      window.removeEventListener('click', clickHandler);
    };
  }, []);

  useEffect(() => {
    if (!showMentionModal && savedRange) {
      if (descriptionRef.current) {
        const { selection, range } = savedRange;
        selection.removeAllRanges();
        selection.addRange(range);
        descriptionRef.current.focus();
      }
    }
  }, [showMentionModal]);

  useEffect(() => {
    (() => {
      if (editedFiles[contentIndex].type === 'image') {
        imageRef.current?.animate(
          {
            opacity: [0, 1],
          },
          {
            fill: 'both',
            duration: 200,
          }
        );
      }

      if (editedFiles[contentIndex].type === 'video') {
        if (videoRef.current) {
          videoRef.current.src = '';
          videoRef.current.src = editedFiles[contentIndex].src as string;
        }
        videoRef.current?.animate(
          {
            opacity: [0, 1],
          },
          {
            fill: 'both',
            duration: 200,
          }
        );
      }
    })();
  }, [contentIndex]);

  useEffect(() => {
    let animationId: number;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    let eventListener = () => {};

    if (
      editedFiles[contentIndex].type === 'video' &&
      videosCropArea.has(editedFiles[contentIndex].key)
    ) {
      if (!video || !canvas) return;

      const ctx = canvas.getContext('2d')!;

      const render = () => {
        if (!video.paused && !video.ended) {
          const { x, y, width, height } = videosCropArea.get(
            editedFiles[contentIndex].key
          )!;

          canvas.width = width;
          canvas.height = height;

          if (ctx) {
            ctx.drawImage(video, x, y, width, height, 0, 0, width, height);
          }
        }
        animationId = requestAnimationFrame(render);
      };

      eventListener = () => {
        animationId = requestAnimationFrame(render);
      };

      video.removeEventListener('play', eventListener);
      video.addEventListener('play', eventListener);
    }

    return () => {
      cancelAnimationFrame(animationId);
      video?.removeEventListener('play', eventListener);
    };
  }, [contentIndex]);

  useEffect(() => {
    const filteredMentionList = [...mentions].filter((user) =>
      descriptionRef.current.querySelector(
        `.app-user-tags[data-tag-index="${user}"]`
      )
    );

    // Removes hidden formatting
    if (descriptionRef.current.textContent?.trim() === '') {
      descriptionRef.current.innerHTML = '';
      descriptionRef.current.focus();
    }

    setMentions(new Set(filteredMentionList));
  }, [generalDescription]);

  useEffect(() => {
    if (loading.value) handleSearch();
  }, [loading]);

  useEffect(() => {
    if (cropping) postContent();
  }, [cropping]);

  useEffect(() => {
    // 10, 20, 50, 20

    clearInterval(progressInterval.current);

    const limit =
      postStage.value === 'preparing'
        ? 10
        : postStage.value === 'validating'
        ? 30
        : postStage.value === 'processing'
        ? 30 + (postStage.filesIndexes.size + 1) * (50 / editedFiles.length)
        : postStage.value === 'saving'
        ? 95
        : 100;

    const delay =
      postStage.value === 'preparing'
        ? 20
        : postStage.value === 'validating'
        ? 100
        : postStage.value === 'processing'
        ? 200
        : postStage.value === 'saving'
        ? 100
        : 20;

    progressInterval.current = setInterval(() => {
      setPostProgress((prev) => {
        return Math.floor(Math.min(prev + 1, limit));
      });
    }, delay);
  }, [postStage]);

  useEffect(() => {
    if (postStage.value === 'finish' && postProgress === 100) {
      setTimeout(() => {
        clearInterval(progressInterval.current);
        setCropping(false);
        setStage((prevStage) => ({
          ...prevStage,
          content: 'select',
        }));
        return toast.success('Content created successfully!');
      }, 500);
    }
  }, [postProgress, postStage]);

  const handleFileDescription = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFileDescriptions((prev) => {
      const key = editedFiles[currentFileIndex].key;
      const map = new Map(prev);
      map.set(key, e.target.value);

      return map;
    });
  };

  const handleBeforeInput = (e: React.FormEvent<HTMLDivElement>) => {
    const data = (e as any).data;
    if (typeof data !== 'string') return e.preventDefault();

    const formattedText = sanitizeInput(generalDescription);

    const div = document.createElement('div');
    div.innerHTML = formattedText;

    if (div.textContent?.trim().length >= 2200) {
      e.preventDefault();
      return toast.info(`Content description can’t exceed 2200 characters.`);
    }

    if (data === '#') {
      e.preventDefault();
      return handleHashTag();
    }

    if (addTag) {
      if (data === ' ') {
        e.preventDefault();
        const tags = Array.from(
          descriptionRef.current.querySelectorAll('.app-hashtags')
        );
        tags.forEach(
          (elem) => elem && ((elem as HTMLElement).contentEditable = 'false')
        );

        const { sel: selection, range } = saveSelection(
          descriptionRef.current,
          setSavedRange
        )!;

        selection.removeAllRanges();
        selection.addRange(range);

        range.deleteContents();

        moveRangeOutOfInlineParents(range, descriptionRef.current);

        const textNode = document.createTextNode(' ');

        range.insertNode(textNode);

        range.setStartAfter(textNode);
        range.collapse(true);

        selection.removeAllRanges();
        selection.addRange(range);

        saveSelection(descriptionRef.current, setSavedRange);
        setGeneralDescription(descriptionRef.current.innerHTML || '');
        setAddTag(false);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();

    const target = e.target as HTMLDivElement;
    const obj = saveSelection(descriptionRef.current, setSavedRange);

    const pastedText = e.clipboardData.getData('text/plain');

    if (obj && pastedText) {
      const { sel, range } = obj;

      const formattedText = sanitizeInput(generalDescription);
      const div = document.createElement('div');
      div.innerHTML = formattedText;

      if (div.textContent?.trim().length + pastedText.length >= 2200) {
        return toast.info(`Content description can’t exceed 2200 characters.`);
      }

      if (pastedText === '#') return handleHashTag();

      sel.removeAllRanges();
      sel.addRange(range);

      range.deleteContents();

      // Insert plain text at caret
      const textNode = document.createTextNode(pastedText);
      range.insertNode(textNode);

      // Moves caret after inserted text
      range.setStartAfter(textNode);
      range.collapse(true);

      sel.removeAllRanges();
      sel.addRange(range);

      saveSelection(descriptionRef.current, setSavedRange);
      setGeneralDescription(target.innerHTML || '');
    }
  };

  const handleGeneralDescription = (e: React.FormEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;

    saveSelection(descriptionRef.current, setSavedRange);
    setGeneralDescription(target.innerHTML || '');
  };

  const updateMentionList =
    (id: string, username: string, name: string) => () => {
      const set = new Set(mentions);

      const { range, selection } = savedRange;

      if (!mentions.has(id)) {
        selection.removeAllRanges();
        selection.addRange(range);

        range.deleteContents();

        const tagElement = document.createElement('span');
        const textNode = document.createTextNode(' ');
        tagElement.setAttribute('class', 'app-user-tags');
        tagElement.setAttribute('data-tag-index', id);
        tagElement.setAttribute('href', `/@${username}`);

        tagElement.innerHTML = `@${name}`;
        tagElement.setAttribute('contentEditable', 'false');

        range.insertNode(textNode);
        range.insertNode(tagElement);

        // Moves caret after inserted text
        range.setStartAfter(textNode);
        range.collapse(true);

        selection.removeAllRanges();
        selection.addRange(range);

        set.add(id);
      } else {
        selection.removeAllRanges();
        selection.addRange(range);

        const users = Array.from(
          descriptionRef.current.querySelectorAll('.app-user-tags')
        );

        const user = users.find(
          (elem) => elem && elem.getAttribute('data-tag-index') === id
        );

        if (user) descriptionRef.current.removeChild(user);

        set.delete(id);
      }

      saveSelection(descriptionRef.current, setSavedRange);
      setGeneralDescription(descriptionRef.current.innerHTML);
      setMentions(set);
    };

  const handleHashTag = () => {
    const { sel: selection, range } = saveSelection(
      descriptionRef.current,
      setSavedRange
    )!;

    selection.removeAllRanges();
    selection.addRange(range);

    range.deleteContents();

    moveRangeOutOfInlineParents(range, descriptionRef.current);

    const container = range.startContainer;
    const offset = range.startOffset;
    let prevElem: Node = null!;
    let newNode: HTMLElement | Node = null!;

    if (container.nodeType === Node.TEXT_NODE) {
      if (offset === 0) prevElem = container.previousSibling!;
      else prevElem = container;
    }

    if (container.nodeType === Node.ELEMENT_NODE) {
      prevElem = container.childNodes[offset - 1];
    }

    newNode = document.createElement('span');
    (newNode as HTMLElement).setAttribute('class', 'app-hashtags');
    (newNode as HTMLElement).innerHTML = `#`;

    if (prevElem && prevElem.nodeType === Node.ELEMENT_NODE) {
      if ((prevElem as HTMLElement).classList.contains('app-hashtags')) {
        if (prevElem.textContent?.trim() === '#') {
          newNode = document.createTextNode('#');
          (prevElem as HTMLElement).remove();
        }
      }
    }

    range.insertNode(newNode);

    range.setStartAfter(newNode);
    range.collapse(true);

    selection.removeAllRanges();
    selection.addRange(range);

    setAddTag(newNode.nodeType === Node.ELEMENT_NODE);
    saveSelection(descriptionRef.current, setSavedRange);
    setGeneralDescription(descriptionRef.current.innerHTML || '');
  };

  const handleMentionClick = () => {
    const tags = Array.from(
      descriptionRef.current.querySelectorAll('.app-hashtags')
    );
    tags.forEach(
      (elem) => elem && ((elem as HTMLElement).contentEditable = 'false')
    );
    setAddTag(false);
    setShowMentionModal(true);
  };

  const handleContainerClick = () => {
    saveSelection(descriptionRef.current, setSavedRange);
  };

  const handleSearch = async () => {
    if (loading.value === true) {
      const result = await debouncedQuery(
        loading.query,
        searchData.page,
        searchData.cursor
      );

      if (result === 'error') {
        setLoading({ ...loading, value: 'error' });
      } else {
        const filteredResults = (result as []).filter(
          (obj: any) => !searchResult.find((data) => data._id === obj._id)
        );

        setSearchResult([...searchResult, ...filteredResults]);
        setSearchData({ ...searchData, end: (result as []).length < 30 });
        setLoading({ ...loading, value: false });
      }
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;

    const isBottom =
      target.scrollTop + target.clientHeight >= target.scrollHeight - 50;

    if (isBottom && !searchData.end) {
      if (loading.query === '') {
        setSearchData((prev) => ({
          ...prev,
          cursor: searchResult[searchResult.length - 1].createdAt,
        }));
      } else {
        setSearchData((prev) => ({
          ...prev,
          page: prev.page + 1,
        }));
      }

      setLoading({ ...loading, value: true });
    }
  };

  const updateCollaborators = (id: string, username: string) => () => {
    const user = collaborators.find((obj) => obj.id === id);

    if (user) {
      setCollaborators((prev) => prev.filter((user) => user.id !== id));
    } else {
      if (collaborators.length >= 3) {
        return toast.error('You can add only three collaborators.');
      }
      setCollaborators((prev) => [...prev, { id, username }]);
    }
  };

  const getCroppedAreas = async () => {
    setCropIndex(0);
    setPostProgress(0);

    for (let i = 0; i < editedFiles.length; i++) {
      setCropIndex(i);
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    setCropping(true);
    setPostStage({ value: 'preparing', filesIndexes: new Set() });
  };

  const updatePostStage = (data: any) => {
    const { message } = data;
    if (message === 'processing') {
      if (data.fileIndex) {
        if (!postStage.filesIndexes.has(data.fileIndex)) {
          setPostStage((prev) => {
            const set = new Set(prev.filesIndexes);
            set.add(data.fileIndex);
            return {
              value: set.size === editedFiles.length ? 'saving' : 'processing',
              filesIndexes: set,
            };
          });
        }
      } else {
        setPostStage((prev) => ({ ...prev, value: 'processing' }));
      }
    } else if (message === 'finish') {
      setPostStage((prev) => ({ ...prev, value: 'finish' }));
    }
  };

  const postContent = async () => {
    // preparing files, validating files, processing files, saving content

    // Preparing stage
    const formData = new FormData();

    try {
      const croppedMedia: File[] = await Promise.all(
        editedFiles.map(async (obj) => {
          const file = rawFiles.get(obj.key)!;
          if (obj.type === 'video') {
            return file;
          } else {
            return new Promise((resolve, reject) => {
              const cropArea = cropAreas.get(obj.key);

              if (cropArea) {
                const imageSrc = obj.src;
                const image = new Image();

                // prevents CORS issues
                image.crossOrigin = 'anonymous';

                image.onload = () => {
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');

                  const { x, y, width, height } = cropArea;

                  canvas.width = width;
                  canvas.height = height;

                  if (ctx) {
                    ctx.drawImage(
                      image,
                      x,
                      y,
                      width,
                      height,
                      0,
                      0,
                      width,
                      height
                    );

                    canvas.toBlob(
                      (blob) => {
                        if (!blob) {
                          canvas.remove();
                          return reject();
                        }

                        const fileName = file?.name;
                        const newFile = new File([blob], String(fileName), {
                          type: 'image/jpeg',
                        });

                        canvas.remove();
                        resolve(newFile);
                      },
                      'image/jpeg',
                      1
                    );
                  } else reject();
                };

                image.onerror = () => reject();

                image.src = imageSrc as string;
              } else {
                resolve(rawFiles.get(obj.key)!);
              }
            });
          }
        })
      );

      const container = document.createElement('div');
      container.innerHTML = generalDescription;

      const hashTags = container.querySelectorAll('.app-hashtags');

      if (hashTags.length > 0) {
        hashTags.forEach((elem) =>
          elem.setAttribute('href', elem.textContent?.trim())
        );
      }

      const filters = editedFiles.map((file) =>
        getFilterValue({ filter: file.filter, adjustments: file.adjustments })
      );
      const descriptions = editedFiles.map(
        (obj) => fileDescriptions.get(obj.key) || ''
      );
      const contentDescription = sanitizeInput(container.innerHTML) || '';
      const collaboratorsList = collaborators.map((obj) => obj.id);
      const mentionsList = [...mentions];
      const videosCrop = editedFiles.map((file) => {
        if (file.type === 'video') {
          return cropAreas.get(file.key);
        }

        return null;
      });

      croppedMedia.forEach((file) => formData.append('content', file));
      formData.append('filters', JSON.stringify({ value: filters }));
      formData.append(
        'fileDescriptions',
        JSON.stringify({ value: descriptions })
      );
      formData.append('description', contentDescription);
      formData.append('settings', JSON.stringify(settings));
      formData.append(
        'aspectRatio',
        String(
          typeof aspectRatio === 'number'
            ? Number(aspectRatio.toFixed(4))
            : aspectRatio
        )
      );
      formData.append('collaborators', JSON.stringify(collaboratorsList));
      formData.append('mentions', JSON.stringify(mentionsList));
      formData.append('videosCropArea', JSON.stringify(videosCrop));
    } catch {
      clearInterval(progressInterval.current);
      setCropping(false);
      return toast.error('Error preparing files. Please try again.');
    }

    // Validating stage
    setPostStage((prev) => ({ ...prev, value: 'validating' }));

    try {
      await streamResponse(
        `${serverUrl}api/v1/contents`,
        formData,
        updatePostStage
      );
    } catch (err: any) {
      clearInterval(progressInterval.current);
      setCropping(false);
      return toast.error(err.message);
    }
  };

  return (
    <div className={styles['carousel-details-section']}>
      {showMentionModal && (
        <MentionModal
          setShowMentionModal={setShowMentionModal}
          mentions={mentions}
          updateMentionList={updateMentionList}
        />
      )}

      {cropping && (
        <PostLoader postStage={postStage} postProgress={postProgress} />
      )}

      <div className={styles['carousel-details-container']} ref={carouselRef}>
        <div className={styles['cropper-container']}>
          <Cropper
            key={editedFiles[cropIndex].key}
            image={
              editedFiles[cropIndex].type === 'image'
                ? (editedFiles[cropIndex].src as string)
                : undefined
            }
            video={
              editedFiles[cropIndex].type === 'video'
                ? (editedFiles[cropIndex].src as string)
                : undefined
            }
            crop={crop}
            aspect={aspectRatio as number}
            onCropChange={setCrop}
            onCropComplete={(_, croppedAreaPixels) => {
              setCropAreas((prev) => {
                const map = new Map(prev);
                map.set(editedFiles[cropIndex].key, croppedAreaPixels);
                return map;
              });
            }}
            restrictPosition={true}
            zoomWithScroll={false}
            objectFit={'cover'}
            classes={{
              mediaClassName: styles.img,
            }}
            style={{
              mediaStyle: {
                aspectRatio,
                height: `${imageRef.current?.offsetHeight}px`,
              },
            }}
          />
        </div>

        <span
          className={styles['back-arrow-box']}
          onClick={() =>
            setStage((prevStage) => ({ ...prevStage, content: 'edit' }))
          }
        >
          <IoArrowBack className={styles['back-arrow']} />
        </span>

        <span className={styles['pagination-box']}>
          {contentIndex + 1} / {editedFiles.length}
        </span>

        {contentIndex !== 0 && (
          <span
            className={styles['left-arrow-box']}
            onClick={() => setContentIndex((prev) => prev - 1)}
          >
            <MdKeyboardArrowLeft className={styles.arrow} />
          </span>
        )}

        {editedFiles[contentIndex].type === 'image' ? (
          <img
            className={styles.img}
            ref={imageRef}
            src={editedFiles[contentIndex].src as string}
            style={{
              aspectRatio,
              filter: getFilterValue({
                filter: editedFiles[contentIndex].filter,
                adjustments: editedFiles[contentIndex].adjustments,
              }),
            }}
            onMouseDown={(e) => (e.currentTarget.style.filter = 'none')}
            onMouseUp={(e) =>
              (e.currentTarget.style.filter = getFilterValue({
                filter: editedFiles[contentIndex].filter,
                adjustments: editedFiles[contentIndex].adjustments,
              }) as string)
            }
          />
        ) : (
          <>
            <video
              className={`${styles.img} ${
                editedFiles[contentIndex].type === 'video' &&
                videosCropArea.has(editedFiles[contentIndex].key)
                  ? styles['hide-video']
                  : ''
              }`}
              ref={videoRef}
              style={{
                aspectRatio,
                filter: getFilterValue({
                  filter: editedFiles[contentIndex].filter,
                  adjustments: editedFiles[contentIndex].adjustments,
                }),
              }}
              autoPlay={true}
              loop={true}
              onMouseDown={(e) => (e.currentTarget.style.filter = 'none')}
              onMouseUp={(e) =>
                (e.currentTarget.style.filter = getFilterValue({
                  filter: editedFiles[contentIndex].filter,
                  adjustments: editedFiles[contentIndex].adjustments,
                }) as string)
              }
            >
              <source type="video/mp4" />
              Your browser does not support playing video.
            </video>

            {editedFiles[contentIndex].type === 'video' &&
              videosCropArea.has(editedFiles[contentIndex].key) && (
                <canvas
                  ref={canvasRef}
                  className={styles.img}
                  style={{
                    aspectRatio,
                    filter: getFilterValue({
                      filter: editedFiles[contentIndex].filter,
                      adjustments: editedFiles[contentIndex].adjustments,
                    }),
                  }}
                  onMouseDown={(e) => (e.currentTarget.style.filter = 'none')}
                  onMouseUp={(e) =>
                    (e.currentTarget.style.filter = getFilterValue({
                      filter: editedFiles[contentIndex].filter,
                      adjustments: editedFiles[contentIndex].adjustments,
                    }) as string)
                  }
                ></canvas>
              )}
          </>
        )}

        {contentIndex < editedFiles.length - 1 && (
          <span
            className={styles['right-arrow-box']}
            onClick={() => setContentIndex((prev) => prev + 1)}
          >
            <MdKeyboardArrowRight className={styles.arrow} />
          </span>
        )}

        {editedFiles.length > 1 && (
          <span className={styles['dot-box']} ref={dotRef}>
            {editedFiles.map((_, index) => (
              <span
                key={`${Math.random()}-${index}`}
                className={`${styles.dot} ${
                  contentIndex === index ? styles['current-dot'] : ''
                }`}
              >
                .
              </span>
            ))}
          </span>
        )}
      </div>

      <div className={styles['upload-details-container']}>
        <div className={styles['description-container']}>
          <span className={styles['description-head']}>Description</span>

          <div className={styles['file-description-container']}>
            <span className={styles['file-description-text']}>
              File Description:
            </span>

            <div className={styles['file-description-box']}>
              <textarea
                className={styles['file-description']}
                value={
                  fileDescriptions.get(editedFiles[currentFileIndex].key) || ''
                }
                onChange={handleFileDescription}
                placeholder="Description for each file...."
                maxLength={maxFileDescriptionLength}
              ></textarea>

              <div className={styles['file-description-details']}>
                <div className={styles['file-pagination-details']}>
                  <span
                    className={`${styles['prev-file-box']} ${
                      currentFileIndex === 0 ? styles['inactive-file-box'] : ''
                    }`}
                    onClick={() => setCurrentFileIndex((prev) => prev - 1)}
                  >
                    <MdKeyboardArrowLeft className={styles['prev-file-icon']} />
                  </span>

                  <span className={styles['file-select-box']}>
                    <select
                      className={styles['file-select']}
                      value={currentFileIndex}
                      onChange={(e) =>
                        setCurrentFileIndex(Number(e.target.value))
                      }
                    >
                      {editedFiles.map((_, index) => (
                        <option key={index} value={index}>
                          {index + 1}
                        </option>
                      ))}
                    </select>
                    /{' '}
                    <span className={styles['file-select-length']}>
                      {editedFiles.length}
                    </span>
                  </span>

                  <span
                    className={`${styles['next-file-box']} ${
                      currentFileIndex === editedFiles.length - 1
                        ? styles['inactive-file-box']
                        : ''
                    }`}
                    onClick={() => setCurrentFileIndex((prev) => prev + 1)}
                  >
                    <MdKeyboardArrowRight
                      className={styles['next-file-icon']}
                    />
                  </span>
                </div>

                <span className={styles['file-description-length']}>
                  {fileDescriptions.has(editedFiles[currentFileIndex].key)
                    ? String(
                        fileDescriptions.get(editedFiles[currentFileIndex].key)
                      ).trim().length
                    : 0}
                  /{maxFileDescriptionLength}
                </span>
              </div>
            </div>
          </div>

          <span className={styles['general-description-text']}>
            General Description:
          </span>

          <div className={styles['description-box']}>
            <div
              className={styles.description}
              contentEditable={true}
              ref={descriptionRef}
              onInput={handleGeneralDescription}
              onBeforeInput={handleBeforeInput}
              onPaste={handlePaste}
              onDrop={(e) => e.preventDefault()}
              onFocus={() =>
                saveSelection(descriptionRef.current, setSavedRange)
              }
              onClick={handleContainerClick}
            ></div>

            {descriptionRef.current?.textContent?.length === 0 && (
              <span className={styles.placeholder}>
                General description for all files....
              </span>
            )}

            <div className={styles['description-details']}>
              <span className={styles['links-box']}>
                <span
                  className={styles['mention-box']}
                  onClick={handleMentionClick}
                >
                  @ Mention
                </span>
                <span className={styles['hashtag-box']} onClick={handleHashTag}>
                  # Hashtags
                </span>
              </span>

              <span className={styles['description-length']}>
                {Math.min(
                  descriptionRef.current?.textContent?.trim().length || 0,
                  maxGeneralDescriptionLength
                )}
                /{maxGeneralDescriptionLength}
              </span>
            </div>
          </div>
        </div>

        <div className={styles['collaborator-container']}>
          <span className={styles['collaborator-head']}>Add collaborators</span>

          <div
            className={styles['collaborators-search-div']}
            ref={collaboratorSearchRef}
          >
            <span className={styles['collaborators-box']}>
              <input
                type="text"
                className={styles['collaborators-input']}
                ref={collaboratorRef}
                placeholder="Search for user...."
                value={loading.query}
                onChange={(e) => {
                  setLoading({
                    display: true,
                    value: true,
                    query: e.target.value,
                  });
                  setSearchData({
                    page: 1,
                    cursor: null!,
                    end: false,
                  });
                  setSearchResult([]);
                }}
                onFocus={() =>
                  setLoading((prev) => ({
                    display: true,
                    value: true,
                    query: prev.query,
                  }))
                }
              />

              {loading.query.length > 0 && (
                <IoClose
                  className={styles['clear-icon']}
                  onClick={() => {
                    setLoading({ value: true, query: '', display: true });
                    setSearchData({
                      page: 1,
                      cursor: null!,
                      end: false,
                    });
                    setSearchResult([]);
                    collaboratorRef.current.focus();
                  }}
                />
              )}
            </span>

            {loading.display && (
              <div
                className={styles['collaborators-result-div']}
                onScroll={handleScroll}
              >
                {loading.value === true &&
                searchData.cursor === null &&
                searchData.page === 1 ? (
                  <div className={styles['error-text']}>
                    <LoadingAnimation
                      style={{
                        width: '3rem',
                        height: '3rem',
                        transform: 'scale(2.5)',
                      }}
                    />
                  </div>
                ) : loading.value === 'error' &&
                  searchData.cursor === null &&
                  searchData.page === 1 ? (
                  <div className={styles['error-text']}>
                    Couldn’t load users. Please try again.
                    <button className={styles['error-btn']}>Try again</button>
                  </div>
                ) : searchResult.length === 0 ? (
                  <div className={styles['error-text']}>
                    No matching user found.
                  </div>
                ) : (
                  <>
                    {searchResult.map((user) => (
                      <article
                        key={user._id}
                        className={styles['search-result']}
                        onClick={updateCollaborators(user._id, user.username)}
                      >
                        <img
                          src={getUrl(user.photo, 'users')}
                          className={styles['search-img']}
                        />

                        <span className={styles['name-box']}>
                          <span className={styles['search-username']}>
                            {user.name}

                            {user.type && (
                              <span className={styles['type-text']}>
                                <BsDot className={styles.dot} />
                                {user.type}
                              </span>
                            )}
                          </span>
                          <span className={styles['search-handle']}>
                            {user.username}
                          </span>
                        </span>

                        <input
                          className={styles['checkbox']}
                          type="checkbox"
                          checked={
                            !!collaborators.find((obj) => obj.id === user._id)
                          }
                          readOnly
                        />
                      </article>
                    ))}

                    {loading.value === true &&
                      (searchData.page !== 1 || searchData.cursor !== null) && (
                        <div className={styles['loader-box']}>
                          <LoadingAnimation
                            style={{
                              width: '2rem',
                              height: '2rem',
                              transform: 'scale(2.5)',
                            }}
                          />
                        </div>
                      )}
                  </>
                )}
              </div>
            )}
          </div>

          <div className={styles['collaborator-list']}>
            {collaborators.map((user) => (
              <article
                key={user.id}
                className={styles['collaborator-list-item']}
              >
                <span>{user.username}</span>
                <IoClose
                  className={styles['collaborator-remove-icon']}
                  onClick={updateCollaborators(user.id, user.username)}
                />
              </article>
            ))}
          </div>
        </div>

        <div className={styles['settings-container']}>
          <span className={styles['settings-head']}>Settings</span>

          <div className={styles['settings-div']}>
            <div className={styles['settings-box']}>
              <span className={styles['settings-box-head']}>
                Accessibility:
              </span>
              <select
                className={styles['accessibility-select']}
                value={settings.accessibility}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    accessibility: parseInt(e.target.value),
                  }))
                }
              >
                <option value={0}>Everyone</option>
                <option value={1}>Friends</option>
                <option value={2}>Only you</option>
              </select>
            </div>

            <div className={styles['settings-box2']}>
              <input
                type="checkbox"
                id="views"
                className={styles['settings-checkbox']}
                checked={settings.hideEngagements}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    hideEngagements: e.target.checked,
                  }))
                }
              />

              <label className={styles['settings-box-label']} htmlFor="views">
                Hide the like and view counts for this post
              </label>
            </div>

            <div className={styles['settings-box2']}>
              <input
                type="checkbox"
                id="comments"
                className={styles['settings-checkbox']}
                checked={settings.disableComments}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    disableComments: e.target.checked,
                  }))
                }
              />

              <label
                className={styles['settings-box-label']}
                htmlFor="comments"
              >
                Disable comments on this post
              </label>
            </div>
          </div>
        </div>

        <div className={styles['post-btn-div']}>
          <button
            className={`${styles['post-btn']} ${styles['cancel-btn']}`}
            onClick={() => {
              setStage((prevStage) => ({
                ...prevStage,
                content: 'select',
              }));
            }}
          >
            Discard
          </button>

          <button className={styles['post-btn']} onClick={getCroppedAreas}>
            Post
          </button>
        </div>
      </div>
    </div>
  );
};

const MentionModal = ({
  setShowMentionModal,
  mentions,
  updateMentionList,
}: MentionModalProps) => {
  const target = document.getElementById('mention-portal') || document.body;

  const [searchData, setSearchData] = useState<{
    cursor: Date;
    end: boolean;
    page: number;
  }>({ cursor: null!, end: false, page: 1 });

  const [loading, setLoading] = useState<{
    query: string;
    value: boolean | 'error';
  }>({ value: true, query: '' });

  const [searchResult, setSearchResult] = useState<any[]>([]);

  const searchRef = useRef<HTMLDivElement>(null!);
  const inputRef = useRef<HTMLInputElement>(null!);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  useEffect(() => {
    handleSearch();
  }, [loading]);

  useEffect(() => {
    const container = searchRef.current;

    if (
      searchResult.length !== 0 &&
      loading.value !== 'error' &&
      container &&
      container.scrollHeight <= container.clientHeight &&
      !searchData.end
    ) {
      handleSearch();
    }
  }, [searchResult]);

  const handleSearch = async () => {
    if (loading.value === true) {
      const result = await debouncedQuery(
        loading.query,
        searchData.page,
        searchData.cursor
      );

      if (result === 'error') {
        setLoading({ ...loading, value: 'error' });
      } else {
        const filteredResults = (result as []).filter(
          (obj: any) => !searchResult.find((data) => data._id === obj._id)
        );

        setSearchResult([...searchResult, ...filteredResults]);
        setSearchData({ ...searchData, end: (result as []).length < 30 });
        setLoading({ ...loading, value: false });
      }
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;

    const isBottom =
      target.scrollTop + target.clientHeight >= target.scrollHeight - 50;

    if (isBottom && !searchData.end) {
      if (loading.query === '') {
        setSearchData((prev) => ({
          ...prev,
          cursor: searchResult[searchResult.length - 1].createdAt,
        }));
      } else {
        setSearchData((prev) => ({
          ...prev,
          page: prev.page + 1,
        }));
      }

      setLoading({ ...loading, value: true });
    }
  };

  return createPortal(
    <section
      className={styles['mention-section']}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setShowMentionModal(false);
        }
      }}
    >
      <div
        className={styles['container']}
        ref={searchRef}
        onScroll={handleScroll}
      >
        <div className={styles['mention-head-box']}>
          <h4 className={styles['mention-heading']}>Find Users</h4>

          <span
            className={styles['close-icon-box']}
            onClick={() => setShowMentionModal(false)}
          >
            <IoClose className={styles['close-icon']} />
          </span>
        </div>
        <div className={styles['mention-search-div']}>
          <div className={styles['mention-search-box']}>
            <IoSearchSharp className={styles['mention-search-icon']} />
            <input
              type="text"
              placeholder="Search...."
              value={loading.query}
              onChange={(e) => {
                setLoading({ value: true, query: e.target.value });
                setSearchData({
                  page: 1,
                  cursor: null!,
                  end: false,
                });
                setSearchResult([]);
              }}
              ref={inputRef}
            />
            <IoClose
              className={styles['mention-clear-icon']}
              onClick={() => {
                setLoading({ value: true, query: '' });
                if (inputRef.current) inputRef.current.focus();
              }}
              title="Clear"
            />
          </div>
        </div>

        <div className={styles['result-container']}>
          {loading.value === true &&
          searchData.cursor === null &&
          searchData.page === 1 ? (
            <div className={styles['error-text']}>
              <LoadingAnimation
                style={{
                  width: '4rem',
                  height: '4rem',
                  transform: 'scale(2.5)',
                }}
              />
            </div>
          ) : loading.value === 'error' &&
            searchData.cursor === null &&
            searchData.page === 1 ? (
            <div className={styles['error-text']}>
              Couldn’t load users. Please try again.
              <button className={styles['error-btn']}>Try again</button>
            </div>
          ) : searchResult.length === 0 ? (
            <div className={styles['error-text']}>No matching user found.</div>
          ) : (
            <>
              {searchResult.map((user) => (
                <article
                  key={user._id}
                  className={styles['search-result']}
                  onClick={updateMentionList(
                    user._id,
                    user.username,
                    user.name
                  )}
                >
                  <img
                    src={getUrl(user.photo, 'users')}
                    className={styles['search-img']}
                  />

                  <span className={styles['name-box']}>
                    <span className={styles['search-username']}>
                      {user.name}

                      {user.type && (
                        <span className={styles['type-text']}>
                          <BsDot className={styles.dot} />
                          {user.type}
                        </span>
                      )}
                    </span>
                    <span className={styles['search-handle']}>
                      {user.username}
                    </span>
                  </span>

                  <input
                    className={styles['checkbox']}
                    type="checkbox"
                    checked={mentions.has(user._id)}
                    readOnly
                  />
                </article>
              ))}

              {loading.value === true &&
                (searchData.page !== 1 || searchData.cursor !== null) && (
                  <div className={styles['loader-box']}>
                    <LoadingAnimation
                      style={{
                        width: '2rem',
                        height: '2rem',
                        transform: 'scale(2.5)',
                      }}
                    />
                  </div>
                )}
            </>
          )}
        </div>
      </div>
    </section>,
    target
  );
};

export default UploadDetails;
