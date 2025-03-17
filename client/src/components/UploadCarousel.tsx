import styles from '../styles/UploadCarousel.module.css';
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from 'react-icons/md';
import { FaPlus } from 'react-icons/fa6';
import { IoClose } from 'react-icons/io5';
import { IoMdCrop } from 'react-icons/io';
import { useEffect, useRef, useState } from 'react';
import { IoCheckmarkSharp, IoColorFilterOutline } from 'react-icons/io5';
import Cropper from 'react-easy-crop';
import { Content, StoryData } from '../pages/Create';
import { getFilterValue, getDurationText, filters } from '../Utilities';
import { TbAdjustmentsFilled } from 'react-icons/tb';
import MobileFilter from './MobileFilter';

type StoryProps = {
  storyFiles: StoryData[];
  setRawStoryFiles: React.Dispatch<React.SetStateAction<FileList | File[]>>;
};

type ContentProps = {
  files: Content[];
  setRawFiles: React.Dispatch<React.SetStateAction<FileList | File[]>>;
  contentIndex: number;
  setContentIndex: React.Dispatch<React.SetStateAction<number>>;
  aspectRatio: number | 'initial';
  setAspectRatio: React.Dispatch<React.SetStateAction<number | 'initial'>>;
};

type UploadCarouselProps = {
  uploadType: 'content' | 'story';
  uploadProps: StoryProps | ContentProps;
  setFiles: React.Dispatch<
    React.SetStateAction<{
      content: Content[];
      reel: string | ArrayBuffer | null;
      story: StoryData[];
    }>
  >;
  setStage: React.Dispatch<
    React.SetStateAction<{
      reel: 'select' | 'edit' | 'finish';
      content: 'select' | 'edit' | 'finish';
      story: 'select' | 'edit' | 'finish';
    }>
  >;
  setAddFiles: React.Dispatch<React.SetStateAction<boolean>>;
  fileRef: React.MutableRefObject<HTMLInputElement>;
};

const UploadCarousel = ({
  uploadType,
  uploadProps,
  setFiles,
  setStage,
  fileRef,
  setAddFiles,
}: UploadCarouselProps) => {
  const files =
    uploadType === 'content'
      ? (uploadProps as ContentProps).files
      : (uploadProps as StoryProps).storyFiles;

  const {
    contentIndex,
    setContentIndex,
    aspectRatio,
    setAspectRatio,
    setRawFiles,
  } = uploadProps as ContentProps;

  const { setRawStoryFiles } = uploadProps as StoryProps;
  const sizeLimit = uploadType === 'content' ? 20 : 10;

  const [crop, setCrop] = useState({ x: 0, y: 0 });

  const [currentIndex, setCurrentIndex] = useState<number>(
    uploadType === 'content' ? contentIndex : 0
  );
  const [cropImage, setCropImage] = useState<boolean>(false);
  const [showArrow, setShowArrow] = useState({
    left: false,
    right: true,
  });
  const [editCategory, setEditCategory] = useState<
    'filters' | 'adjustments' | 'sounds'
  >('filters');
  const [editedFiles, setEditedFiles] = useState<StoryData[] | Content[]>(
    files
  );
  const [currentFileData, setCurrentFileData] = useState({
    filter: 'Original',
    adjustments: {
      brightness: 0,
      contrast: 0,
      grayscale: 0,
      'hue-rotate': 0,
      saturate: 0,
      sepia: 0,
    },
  });
  const [storySound, setStorySound] = useState<{
    name: string;
    duration: string;
    src: string;
  }>(null!);
  const [playStorySound, setPlayStorySound] = useState<boolean>(false);
  const [showMobileFilter, setShowMobileFilter] = useState<boolean>(false);

  const dotRef = useRef<HTMLSpanElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const imgsRef = useRef<HTMLDivElement | null>(null);
  const editRef = useRef<HTMLDivElement | null>(null);
  const smallImgRef = useRef<HTMLSpanElement | null>(null);
  const soundInputRef = useRef<HTMLInputElement>(null!);
  const storySoundRef = useRef<HTMLAudioElement>(null!);
  const inputRefs = useRef<{
    brightness: HTMLInputElement | null;
    contrast: HTMLInputElement | null;
    grayscale: HTMLInputElement | null;
    'hue-rotate': HTMLInputElement | null;
    saturate: HTMLInputElement | null;
    sepia: HTMLInputElement | null;
  }>({
    brightness: null,
    contrast: null,
    grayscale: null,
    'hue-rotate': null,
    saturate: null,
    sepia: null,
  });
  const carouselRef = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    const resizeHandler = () => {
      if (window.matchMedia('(max-width: 510px)').matches) {
        const size = window.innerWidth;

        carouselRef.current.style.gridTemplateColumns = `${size - 4}px`;
        carouselRef.current.style.gridTemplateRows = `${size - 4}px`;
      } else if (window.matchMedia('(max-width: 900px)').matches) {
        carouselRef.current.style.gridTemplateColumns = '500px';
        carouselRef.current.style.gridTemplateRows = '500px';
      } else {
        carouselRef.current.style.gridTemplateColumns =
          '500px calc(100% - 500px)';
        carouselRef.current.style.gridTemplateRows = '500px';
      }
    };

    resizeHandler();

    window.addEventListener('resize', resizeHandler);

    return () => {
      window.removeEventListener('resize', resizeHandler);
    };
  }, []);

  useEffect(() => {
    if (files.length === 1) {
      setShowArrow({
        left: false,
        right: false,
      });
    }

    if (uploadType === 'story') {
      if (storySound) {
        if (playStorySound) storySoundRef.current.play();
      }
    }

    setEditedFiles(files);
  }, [files]);

  useEffect(() => {
    setCropImage(false);

    (() => {
      if (files[currentIndex].type === 'image') {
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

      if (files[currentIndex].type === 'video') {
        if (videoRef.current) {
          videoRef.current.src = '';
          videoRef.current.src = files[currentIndex].src as string;
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

      if (dotRef.current) dotRef.current.scrollLeft = (currentIndex - 4) * 10.5;

      if (imgsRef.current) {
        const width = imgsRef.current.offsetWidth || 0;

        const size = Math.trunc(
          width / ((smallImgRef.current?.offsetWidth || 1) + 12.8)
        );

        if (currentIndex > size - 1) {
          imgsRef.current.scrollLeft =
            (smallImgRef.current?.offsetWidth || 0) * currentIndex;
        } else {
          imgsRef.current.scrollLeft = 0;
        }
      }

      if (uploadType === 'content') {
        Object.keys(inputRefs.current).forEach((key) => {
          const typedKey = key as keyof typeof inputRefs.current;
          const value = (editedFiles as Content[])[currentIndex].adjustments[
            typedKey
          ];

          if (inputRefs.current[typedKey]) {
            if (typedKey === 'grayscale' || typedKey === 'sepia') {
              inputRefs.current[
                typedKey
              ].style.background = `linear-gradient(to right, #a855f7 ${value}%, rgb(128, 128, 128, 0.5) ${value}%`;
            } else {
              if (value > 0) {
                inputRefs.current[
                  typedKey
                ].style.background = `linear-gradient(to right, rgb(128, 128, 128, 0.5) 0%, rgb(128, 128, 128, 0.5) 50%, #a855f7 50%, #a855f7 ${
                  50 + value / 2
                }%, rgb(128, 128, 128, 0.5) ${
                  50 + value / 2
                }%, rgb(128, 128, 128, 0.5) 100%`;
              } else {
                inputRefs.current[
                  typedKey
                ].style.background = `linear-gradient(to right, rgb(128, 128, 128, 0.5) 0%, rgb(128, 128, 128, 0.5) ${
                  (value + 100) / 2
                }%, #a855f7 ${
                  (value + 100) / 2
                }%, #a855f7 50%, rgb(128, 128, 128, 0.5) 50%, rgb(128, 128, 128, 0.5) 100%`;
              }
            }
          }
        });
      }
    })();

    setCurrentFileData({
      filter: (editedFiles as Content[])[currentIndex].filter,
      adjustments: (editedFiles as Content[])[currentIndex].adjustments,
    });
  }, [currentIndex]);

  useEffect(() => {
    if (files[currentIndex].type === 'video') {
      if (videoRef.current) {
        videoRef.current.src = '';
        videoRef.current.src = files[currentIndex].src as string;
      }
    }
  }, [cropImage]);

  useEffect(() => {
    if (editRef.current) {
      if (editCategory === 'filters') {
        editRef.current.scrollLeft -= editRef.current.offsetWidth;
      } else {
        editRef.current.scrollLeft += editRef.current.offsetWidth;
      }
    }
  }, [editCategory]);

  useEffect(() => {
    if (uploadType === 'story') {
      if (playStorySound) storySoundRef.current.play();
      else storySoundRef.current.pause();
    }
  }, [playStorySound]);

  const handleSmallImgsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;

    setShowArrow({
      left: target.scrollLeft > 120,
      right: !(
        target.scrollLeft + target.clientWidth >=
        target.scrollWidth - 60
      ),
    });
  };

  const changeCurrentIndex = (type: 'prev' | 'next') => () => {
    setEditedFiles((prevFiles) => {
      const oldFiles = [...(prevFiles as Content[])];
      oldFiles[currentIndex].filter = currentFileData.filter;
      oldFiles[currentIndex].adjustments = currentFileData.adjustments;

      return oldFiles;
    });

    if (type === 'prev') setCurrentIndex((prev) => prev - 1);
    else setCurrentIndex((prev) => prev + 1);
  };

  const removeFile = (itemIndex: number) => {
    if (files.length > 1) {
      if (itemIndex === currentIndex) {
        if (itemIndex !== 0) setCurrentIndex(itemIndex - 1);
        else setCurrentIndex(0);
      }

      if (uploadType === 'content') {
        setRawFiles((prevFiles) =>
          [...prevFiles].filter((_, index) => index !== itemIndex)
        );
      } else {
        setRawStoryFiles((prevFiles) =>
          [...prevFiles].filter((_, index) => index !== itemIndex)
        );
      }

      setFiles((prevFiles) => {
        return {
          ...prevFiles,
          [uploadType]: prevFiles[uploadType].filter(
            (_, index) => index !== itemIndex
          ),
        };
      });
    } else {
      if (uploadType === 'content') setRawFiles([]);
      else setRawStoryFiles([]);

      setFiles((prevFiles) => ({
        ...prevFiles,
        [uploadType]: [],
      }));
      setStage((prevStage) => ({ ...prevStage, [uploadType]: 'select' }));
    }
  };

  const changeAdjustmentValue =
    (
      type:
        | 'brightness'
        | 'contrast'
        | 'hue-rotate'
        | 'sepia'
        | 'grayscale'
        | 'saturate',
      reset?: boolean
    ) =>
    (
      e:
        | React.ChangeEvent<HTMLInputElement>
        | React.MouseEvent<HTMLSpanElement, MouseEvent>
    ) => {
      if (reset) {
        setCurrentFileData({
          ...currentFileData,
          adjustments: {
            ...currentFileData.adjustments,
            [type]: 0,
          },
        });

        if (inputRefs.current[type])
          inputRefs.current[type].style.background = `rgb(128, 128, 128, 0.5)`;
      } else {
        const target = e.target as HTMLInputElement;
        const value = parseFloat(target.value);

        setCurrentFileData({
          ...currentFileData,
          adjustments: {
            ...currentFileData.adjustments,
            [type]: value,
          },
        });

        if (inputRefs.current[type]) {
          if (type === 'grayscale' || type === 'sepia') {
            inputRefs.current[
              type
            ].style.background = `linear-gradient(to right, #a855f7 ${value}%, rgb(128, 128, 128, 0.5) ${value}%`;
          } else {
            if (value > 0) {
              inputRefs.current[
                type
              ].style.background = `linear-gradient(to right, rgb(128, 128, 128, 0.5) 0%, rgb(128, 128, 128, 0.5) 50%, #a855f7 50%, #a855f7 ${
                50 + value / 2
              }%, rgb(128, 128, 128, 0.5) ${
                50 + value / 2
              }%, rgb(128, 128, 128, 0.5) 100%`;
            } else {
              inputRefs.current[
                type
              ].style.background = `linear-gradient(to right, rgb(128, 128, 128, 0.5) 0%, rgb(128, 128, 128, 0.5) ${
                (value + 100) / 2
              }%, #a855f7 ${
                (value + 100) / 2
              }%, #a855f7 50%, rgb(128, 128, 128, 0.5) 50%, rgb(128, 128, 128, 0.5) 100%`;
            }
          }
        }
      }
    };

  const addToObjRef =
    (
      prop:
        | 'brightness'
        | 'contrast'
        | 'hue-rotate'
        | 'sepia'
        | 'grayscale'
        | 'saturate'
    ) =>
    (el: HTMLInputElement) => {
      const ref = inputRefs;

      if (el && !ref.current[prop]) {
        ref.current[prop] = el;
      }
    };

  // Add animation for sound processing
  const handleStorySound = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      if (e.target.files.length > 0) {
        const file = e.target.files[0];

        try {
          const data: { name: string; duration: string; src: string } =
            await new Promise((resolve, reject) => {
              if (file.size > 1_073_741_824) {
                reject('');
              } else {
                const fileURL = URL.createObjectURL(file);
                const audio = document.createElement('audio');

                audio.src = fileURL;
                audio.preload = 'metadata';

                audio.onloadedmetadata = () => {
                  const duration = Math.round(audio.duration);
                  const durationText: string = getDurationText(duration);

                  if (duration > 3600) reject('');
                  else
                    resolve({
                      name: file.name,
                      duration: durationText,
                      src: fileURL,
                    });
                };

                audio.onerror = () => reject('');
              }
            });

          storySoundRef.current.src = data.src;
          setPlayStorySound(false);
          setStorySound(data);
        } catch (err) {
          e.target.files = new DataTransfer().files;
          return alert(err);
        }
      }
    }
  };

  const nextStage = () => {
    setFiles((prevFiles) => {
      const oldFiles = [...(editedFiles as Content[])];
      oldFiles[currentIndex].filter = currentFileData.filter;
      oldFiles[currentIndex].adjustments = currentFileData.adjustments;

      return {
        ...prevFiles,
        content: oldFiles,
      };
    });
    setContentIndex(currentIndex);
    setStage((prevStage) => ({ ...prevStage, content: 'finish' }));
  };

  return (
    <>
      <div className={styles.carousel}>
        <div className={styles['carousel-container']} ref={carouselRef}>
          <div className={styles['carousel-box']}>
            {currentIndex !== 0 && (
              <span
                className={styles['left-arrow-box']}
                onClick={changeCurrentIndex('prev')}
              >
                <MdKeyboardArrowLeft className={styles.arrow} />
              </span>
            )}

            <div className={styles['media-edit-container']}>
              <div className={styles['mark-box']}>
                <span
                  className={`${styles['mark-icon-box']} ${
                    !cropImage ? styles['hide-visibility'] : ''
                  }`}
                  onClick={() => setCropImage(false)}
                  title="Cancel"
                >
                  <IoClose className={styles['mark-icon']} />
                </span>

                {cropImage ? (
                  <span
                    className={styles['mark-icon-box']}
                    onClick={() => setCropImage(false)}
                    title="Done"
                  >
                    <IoCheckmarkSharp className={styles['mark-icon']} />
                  </span>
                ) : (
                  <span
                    className={styles['mark-icon-box']}
                    onClick={() => setCropImage(true)}
                    title="Crop"
                  >
                    <IoMdCrop className={styles['mark-icon']} />
                  </span>
                )}
              </div>

              {!cropImage && (
                <div className={styles['mobile-edit-box']}>
                  <span
                    className={`${styles['mark-icon-box']} `}
                    title="Filters"
                    onClick={() => setShowMobileFilter(true)}
                  >
                    <IoColorFilterOutline className={styles['mark-icon']} />
                  </span>

                  <span
                    className={`${styles['mark-icon-box']} `}
                    title="Adjustments"
                  >
                    <TbAdjustmentsFilled
                      className={`${styles['mark-icon']} ${styles['adjust-icon']}`}
                    />
                  </span>
                </div>
              )}
            </div>

            {files.length &&
              (cropImage ? (
                <Cropper
                  image={
                    files[currentIndex].type === 'image'
                      ? (files[currentIndex].src as string)
                      : undefined
                  }
                  video={
                    files[currentIndex].type === 'video'
                      ? (files[currentIndex].src as string)
                      : undefined
                  }
                  crop={crop}
                  aspect={1}
                  onCropChange={setCrop}
                  // onInteractionEnd={handleInteractionEnd}
                  restrictPosition={true}
                  zoomWithScroll={false}
                  objectFit={'cover'}
                  classes={{
                    // containerClassName: styles['img-container'],
                    mediaClassName: styles.img,
                  }}
                  style={{
                    mediaStyle: {
                      aspectRatio,
                      filter: getFilterValue(currentFileData),
                      height: `${imageRef.current?.offsetHeight}px`,
                    },
                  }}
                />
              ) : (
                <>
                  {files[currentIndex].type === 'image' ? (
                    <img
                      className={styles.img}
                      src={files[currentIndex].src as string}
                      ref={imageRef}
                      style={{
                        aspectRatio,
                        filter: getFilterValue(currentFileData),
                      }}
                      onMouseDown={(e) =>
                        (e.currentTarget.style.filter = 'none')
                      }
                      onMouseUp={(e) =>
                        (e.currentTarget.style.filter = getFilterValue(
                          currentFileData
                        ) as string)
                      }
                    />
                  ) : (
                    <video
                      className={styles.img}
                      ref={videoRef}
                      style={{
                        aspectRatio,
                        filter: getFilterValue(currentFileData),
                      }}
                      autoPlay={true}
                      loop={true}
                      onMouseDown={(e) =>
                        (e.currentTarget.style.filter = 'none')
                      }
                      onMouseUp={(e) =>
                        (e.currentTarget.style.filter = getFilterValue(
                          currentFileData
                        ) as string)
                      }
                    >
                      <source type="video/mp4" />
                      Your browser does not support playing video.
                    </video>
                  )}
                </>
              ))}

            {currentIndex < files.length - 1 && (
              <span
                className={styles['right-arrow-box']}
                onClick={changeCurrentIndex('next')}
              >
                <MdKeyboardArrowRight className={styles.arrow} />
              </span>
            )}

            {files.length > 1 && (
              <span className={styles['dot-box']} ref={dotRef}>
                {files.map((_, index) => (
                  <span
                    key={`${Math.random()}-${index}`}
                    className={`${styles.dot} ${
                      currentIndex === index ? styles['current-dot'] : ''
                    }`}
                  >
                    .
                  </span>
                ))}
              </span>
            )}
          </div>

          <div className={styles['edit-container']}>
            <div className={styles['edit-head']}>
              <span
                className={`${styles['edit-head-text']} ${
                  editCategory === 'filters' ? styles['current-edit-head'] : ''
                }`}
                onClick={() => setEditCategory('filters')}
              >
                Filters
              </span>
              <span
                className={`${styles['edit-head-text']} ${
                  editCategory === 'adjustments'
                    ? styles['current-edit-head']
                    : ''
                }`}
                onClick={() => setEditCategory('adjustments')}
              >
                {uploadType === 'content' ? 'Adjustments' : 'Sound'}
              </span>
            </div>

            <div className={styles['edit-div']} ref={editRef}>
              <div className={styles['filters-div']}>
                {filters.map(({ name, filter }, index) => (
                  <span
                    className={`${styles['filter-box']} ${
                      cropImage ? styles['disable-filter'] : ''
                    }`}
                    key={index}
                    onClick={() =>
                      !cropImage
                        ? setCurrentFileData({
                            ...currentFileData,
                            filter: name,
                          })
                        : null
                    }
                  >
                    <span
                      className={`${styles['filter-img-span']} ${
                        currentFileData.filter === name
                          ? styles['current-filter-span']
                          : ''
                      }`}
                    >
                      {' '}
                      <img
                        className={styles['filter-img']}
                        src="../../assets/filter.avif"
                        style={{ filter }}
                      />
                    </span>

                    <span
                      className={`${styles['filter-name']} ${
                        currentFileData.filter === name
                          ? styles['current-filter-name']
                          : ''
                      }`}
                    >
                      {name}
                    </span>
                  </span>
                ))}
              </div>

              {uploadType === 'content' ? (
                <div className={styles['adjustment-div']}>
                  <span className={styles['adjustment-box']}>
                    <span className={styles['adjustment-box-head']}>
                      <label className={styles['adjustment-label']}>
                        Brightness
                      </label>
                      <span
                        className={`${styles['adjustment-reset']} ${
                          cropImage ? styles['hide-reset'] : ''
                        }`}
                        onClick={changeAdjustmentValue('brightness', true)}
                      >
                        Reset
                      </span>
                    </span>

                    <span className={styles['adjustment-details']}>
                      <input
                        className={`${styles['adjustment-input']} ${
                          cropImage ? styles['adjustment-input2'] : ''
                        }`}
                        type="range"
                        disabled={cropImage}
                        min={-100}
                        max={100}
                        value={currentFileData.adjustments.brightness}
                        onChange={changeAdjustmentValue('brightness')}
                        ref={addToObjRef('brightness')}
                      />
                      <span className={styles['adjustment-value']}>
                        {currentFileData.adjustments.brightness}
                      </span>
                    </span>
                  </span>

                  <span className={styles['adjustment-box']}>
                    <span className={styles['adjustment-box-head']}>
                      <label className={styles['adjustment-label']}>
                        Contrast
                      </label>
                      <span
                        className={`${styles['adjustment-reset']} ${
                          cropImage ? styles['hide-reset'] : ''
                        }`}
                        onClick={changeAdjustmentValue('contrast', true)}
                      >
                        Reset
                      </span>
                    </span>
                    <span className={styles['adjustment-details']}>
                      <input
                        className={`${styles['adjustment-input']} ${
                          cropImage ? styles['adjustment-input2'] : ''
                        }`}
                        type="range"
                        disabled={cropImage}
                        min={-100}
                        max={100}
                        value={currentFileData.adjustments.contrast}
                        onChange={changeAdjustmentValue('contrast')}
                        ref={addToObjRef('contrast')}
                      />
                      <span className={styles['adjustment-value']}>
                        {currentFileData.adjustments.contrast}
                      </span>
                    </span>
                  </span>

                  <span className={styles['adjustment-box']}>
                    <span className={styles['adjustment-box-head']}>
                      <label className={styles['adjustment-label']}>
                        Hue-rotate
                      </label>
                      <span
                        className={`${styles['adjustment-reset']} ${
                          cropImage ? styles['hide-reset'] : ''
                        }`}
                        onClick={changeAdjustmentValue('hue-rotate', true)}
                      >
                        Reset
                      </span>
                    </span>
                    <span className={styles['adjustment-details']}>
                      <input
                        className={`${styles['adjustment-input']} ${
                          cropImage ? styles['adjustment-input2'] : ''
                        }`}
                        type="range"
                        disabled={cropImage}
                        min={-100}
                        max={100}
                        value={currentFileData.adjustments['hue-rotate']}
                        onChange={changeAdjustmentValue('hue-rotate')}
                        ref={addToObjRef('hue-rotate')}
                      />
                      <span className={styles['adjustment-value']}>
                        {currentFileData.adjustments['hue-rotate']}
                      </span>
                    </span>
                  </span>

                  <span className={styles['adjustment-box']}>
                    <span className={styles['adjustment-box-head']}>
                      <label className={styles['adjustment-label']}>
                        Saturate
                      </label>
                      <span
                        className={`${styles['adjustment-reset']} ${
                          cropImage ? styles['hide-reset'] : ''
                        }`}
                        onClick={changeAdjustmentValue('saturate', true)}
                      >
                        Reset
                      </span>
                    </span>
                    <span className={styles['adjustment-details']}>
                      <input
                        className={`${styles['adjustment-input']} ${
                          cropImage ? styles['adjustment-input2'] : ''
                        }`}
                        type="range"
                        disabled={cropImage}
                        min={-100}
                        max={100}
                        value={currentFileData.adjustments.saturate}
                        onChange={changeAdjustmentValue('saturate')}
                        ref={addToObjRef('saturate')}
                      />
                      <span className={styles['adjustment-value']}>
                        {currentFileData.adjustments.saturate}
                      </span>
                    </span>
                  </span>

                  <span className={styles['adjustment-box']}>
                    <span className={styles['adjustment-box-head']}>
                      <label className={styles['adjustment-label']}>
                        Grayscale
                      </label>
                      <span
                        className={`${styles['adjustment-reset']} ${
                          cropImage ? styles['hide-reset'] : ''
                        }`}
                        onClick={changeAdjustmentValue('grayscale', true)}
                      >
                        Reset
                      </span>
                    </span>
                    <span className={styles['adjustment-details']}>
                      <input
                        className={`${styles['adjustment-input']} ${
                          cropImage ? styles['adjustment-input2'] : ''
                        }`}
                        type="range"
                        disabled={cropImage}
                        min={0}
                        max={100}
                        value={currentFileData.adjustments.grayscale}
                        onChange={changeAdjustmentValue('grayscale')}
                        ref={addToObjRef('grayscale')}
                      />
                      <span className={styles['adjustment-value']}>
                        {currentFileData.adjustments.grayscale}
                      </span>
                    </span>
                  </span>

                  <span className={styles['adjustment-box']}>
                    <span className={styles['adjustment-box-head']}>
                      <label className={styles['adjustment-label']}>
                        Sepia
                      </label>
                      <span
                        className={`${styles['adjustment-reset']} ${
                          cropImage ? styles['hide-reset'] : ''
                        }`}
                        onClick={changeAdjustmentValue('sepia', true)}
                      >
                        Reset
                      </span>
                    </span>
                    <span className={styles['adjustment-details']}>
                      <input
                        className={`${styles['adjustment-input']} ${
                          cropImage ? styles['adjustment-input2'] : ''
                        }`}
                        type="range"
                        disabled={cropImage}
                        min={0}
                        max={100}
                        value={currentFileData.adjustments.sepia}
                        onChange={changeAdjustmentValue('sepia')}
                        ref={addToObjRef('sepia')}
                      />
                      <span className={styles['adjustment-value']}>
                        {currentFileData.adjustments.sepia}
                      </span>
                    </span>
                  </span>
                </div>
              ) : (
                <div className={styles['sound-div']}>
                  <div className={styles['hide-sound']}>
                    <input
                      type="file"
                      accept="audio/mp3, audio/wav, audio/aac, audio/ogg"
                      ref={soundInputRef}
                      onChange={handleStorySound}
                    />

                    <audio ref={storySoundRef}>
                      <source />
                      Your browser does not support the audio element.
                    </audio>
                  </div>

                  {storySound && (
                    <div
                      className={`${styles['sound-box']} ${
                        playStorySound ? styles['active-sound'] : ''
                      }`}
                      onClick={() => setPlayStorySound(!playStorySound)}
                    >
                      <span className={styles['sound-name']}>
                        {storySound.name}
                      </span>
                      <span className={styles['sound-duration']}>
                        {storySound.duration}
                      </span>
                    </div>
                  )}

                  <div className={styles['sound-btn-div']}>
                    <button
                      className={styles['sound-btn']}
                      onClick={() => soundInputRef.current.click()}
                    >
                      {storySound ? 'Change' : 'Select Sound'}
                    </button>
                    {storySound && (
                      <button
                        className={styles['remove-btn']}
                        onClick={() => {
                          URL.revokeObjectURL(storySound.src);
                          storySoundRef.current.src = '';
                          setPlayStorySound(false);
                          setStorySound(null!);
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles['imgs-container']}>
          {uploadType === 'content' && (
            <div className={styles['ratio-box']}>
              Aspect ratio:
              <select
                className={styles['ratio-select']}
                onChange={(e) =>
                  setAspectRatio(
                    e.target.value === 'initial'
                      ? 'initial'
                      : Number(e.target.value)
                  )
                }
                disabled={cropImage}
                defaultValue={1 / 1}
              >
                <option value={'initial'}>Original</option>
                <option value={1 / 1}>1:1</option>
                <option value={4 / 5}>4:5</option>
                <option value={16 / 9}>16:9</option>
              </select>
            </div>
          )}

          <div
            className={`${styles['imgs-div']} ${
              uploadType === 'story' ? styles['story-imgs-div'] : ''
            }`}
          >
            <div
              className={styles['imgs']}
              ref={imgsRef}
              onScroll={handleSmallImgsScroll}
            >
              <span
                className={`${styles['left-arrow-box2']}  ${
                  !showArrow.left ? styles['hide-icon'] : ''
                }`}
                onClick={() => {
                  if (imgsRef.current) imgsRef.current.scrollLeft -= 448;
                }}
              >
                <MdKeyboardArrowLeft className={styles['left-arrow2']} />
              </span>

              {files.map((file, index) => (
                <span
                  key={`${Math.random()}-${index}`}
                  className={styles['small-img-box']}
                  onClick={() => setCurrentIndex(index)}
                  ref={currentIndex === index ? smallImgRef : null}
                >
                  {file.type === 'image' ? (
                    <img
                      className={`${styles['small-img']} ${
                        currentIndex === index
                          ? styles['current-small-img']
                          : ''
                      }`}
                      src={file.src as string}
                    />
                  ) : (
                    <video
                      className={`${styles['small-img']} ${
                        currentIndex === index
                          ? styles['current-small-img']
                          : ''
                      }`}
                    >
                      <source src={file.src as string} type="video/mp4" />
                      Your browser does not support playing video.
                    </video>
                  )}
                  <span
                    className={`${styles['remove-file-box']} ${
                      currentIndex === index ? styles['current-file-box'] : ''
                    }`}
                    title="Remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                  >
                    <IoClose className={styles['remove-file-icon']} />
                  </span>
                </span>
              ))}

              <span
                className={`${styles['right-arrow-box2']}  ${
                  !showArrow.right ? styles['hide-icon'] : ''
                }`}
                onClick={() => {
                  if (imgsRef.current) imgsRef.current.scrollLeft += 448;
                }}
              >
                <MdKeyboardArrowRight className={styles['right-arrow2']} />
              </span>
            </div>

            <div className={styles['add-file-container']}>
              <span className={styles['files-length']}>
                {files.length === 1 ? '1 file' : `${files.length} files`}
              </span>
              <span
                className={`${styles['add-file-box']} ${
                  files.length >= sizeLimit ? styles['disable-add-files'] : ''
                }`}
                onClick={() => {
                  setAddFiles(true);
                  if (uploadType === 'story') storySoundRef.current.pause();
                  fileRef.current.click();
                }}
              >
                <FaPlus className={styles['add-file-icon']} />
              </span>
            </div>
          </div>
        </div>

        {uploadType === 'story' && (
          <div className={styles['settings-container']}>
            <div className={styles['settings-box']}>
              <span className={styles['settings-box-head']}>
                Accessibility:
              </span>
              <select className={styles['accessibility-select']}>
                <option value={'everyone'}>Everyone</option>
                <option value={'friends'}>Friends</option>
                <option value={'only-you'}>Only you</option>
              </select>
            </div>

            <div className={styles['settings-box2']}>
              <input
                type="checkbox"
                id="comments2"
                className={styles['settings-checkbox']}
              />

              <label
                className={styles['settings-box-label']}
                htmlFor="comments2"
              >
                Disable comments
              </label>
            </div>
          </div>
        )}

        <div className={styles['next-btn-div']}>
          <button
            className={`${styles['next-btn']} ${styles['cancel-btn']}`}
            onClick={() => {
              files.forEach((file) => URL.revokeObjectURL(file.src as string));
              setStage((prevStage) => ({
                ...prevStage,
                [uploadType]: 'select',
              }));
            }}
          >
            Cancel
          </button>

          <button
            className={styles['next-btn']}
            onClick={uploadType === 'content' ? nextStage : undefined}
          >
            {uploadType === 'content' ? 'Next' : 'Post'}
          </button>
        </div>
      </div>

      {showMobileFilter && (
        <MobileFilter setShowMobileFilter={setShowMobileFilter} />
      )}
    </>
  );
};

export default UploadCarousel;
