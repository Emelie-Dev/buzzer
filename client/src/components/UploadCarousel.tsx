import styles from '../styles/UploadCarousel.module.css';
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from 'react-icons/md';
import { FaPlus } from 'react-icons/fa6';
import { IoClose } from 'react-icons/io5';
import { IoMdCrop } from 'react-icons/io';
import { useEffect, useRef, useState } from 'react';
import { IoCheckmarkSharp } from 'react-icons/io5';
import Cropper from 'react-easy-crop';

import 'react-image-crop/dist/ReactCrop.css';
import { Content } from '../pages/Create';

type UploadCarouselProps = {
  files: Content[];
  setAddFiles: React.Dispatch<React.SetStateAction<boolean>>;
};

const filters = [
  { name: 'Original', filter: 'none' },
  { name: 'Warm Glow', filter: 'brightness(1.1) saturate(1.2) sepia(0.2)' },
  {
    name: 'Cool Mist',
    filter: 'brightness(0.95) saturate(0.8) contrast(1.1) hue-rotate(-20deg)',
  },
  { name: 'Vintage Charm', filter: 'sepia(0.5) saturate(0.8) contrast(1.2)' },
  { name: 'Dreamscape', filter: 'blur(2px) brightness(1.1) saturate(1.1)' },
  {
    name: 'Golden Hour',
    filter: 'brightness(1.2) sepia(0.4) hue-rotate(-10deg)',
  },
  {
    name: 'Ocean Breeze',
    filter: 'brightness(1.05) saturate(1.3) hue-rotate(-40deg)',
  },
  {
    name: 'Pastel Dreams',
    filter: 'brightness(1.1) saturate(0.7) contrast(1.1)',
  },
  { name: 'Rustic Vibes', filter: 'sepia(0.6) contrast(1.1) brightness(0.9)' },
  { name: 'Cinematic', filter: 'contrast(1.4) brightness(0.8) saturate(0.9)' },
  { name: 'Frosted', filter: 'brightness(1.2) blur(1px) saturate(0.8)' },
  {
    name: 'Twilight',
    filter: 'brightness(0.9) contrast(1.1) hue-rotate(40deg)',
  },
  { name: 'Ember', filter: 'sepia(0.3) brightness(1.2) saturate(1.1)' },
  { name: 'Serenity', filter: 'contrast(1.1) brightness(1.1) saturate(0.9)' },
  {
    name: 'Lush Forest',
    filter: 'hue-rotate(80deg) brightness(1.1) saturate(1.3)',
  },
  {
    name: 'Muted Elegance',
    filter: 'brightness(0.9) saturate(0.7) contrast(1.2)',
  },
  { name: 'Radiance', filter: 'brightness(1.3) saturate(1.2) contrast(1.1)' },
  {
    name: 'Arctic Chill',
    filter: 'brightness(1.1) saturate(0.8) hue-rotate(-50deg)',
  },
  { name: 'Sepia Luxe', filter: 'sepia(1) brightness(1.2) contrast(1.1)' },

  { name: 'Noir', filter: 'grayscale(1) brightness(0.9) contrast(1.2)' },
  { name: 'Monochrome Bliss', filter: 'grayscale(1) brightness(1.1)' },
];

const UploadCarousel = ({ files, setAddFiles }: UploadCarouselProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [cropImage, setCropImage] = useState<boolean>(false);
  const [showArrow, setShowArrow] = useState({
    left: false,
    right: true,
  });
  const [aspectRatio, setAspectRatio] = useState<'initial' | number>(1);
  const [editCategory, setEditCategory] = useState<'filters' | 'adjustments'>(
    'filters'
  );
  const [editedFiles, setEditedFiles] = useState(files);
  const [currentFileData, setCurrentFileData] = useState({
    filter: 'Original',
    adjustments: {
      brightness: 1,
      contrast: 1,
      grayscale: 0,
      hueRotate: 0,
      saturate: 1,
      sepia: 0,
    },
  });

  const dotRef = useRef<HTMLSpanElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const imgsRef = useRef<HTMLDivElement | null>(null);
  const editRef = useRef<HTMLDivElement | null>(null);
  const smallImgRef = useRef<HTMLSpanElement | null>(null);

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

      if (currentIndex > 4) {
        if (dotRef.current) dotRef.current.scrollLeft += 10.5;
      } else {
        if (dotRef.current) dotRef.current.scrollLeft -= 10.5;
      }

      if (imgsRef.current) {
        const width = imgsRef.current.offsetWidth || 0;

        const size = Math.trunc(
          width / ((smallImgRef.current?.offsetWidth || 1) + 12.8)
        );

        if (currentIndex >= size - 1) {
          imgsRef.current.scrollLeft +=
            (smallImgRef.current?.offsetWidth || 0) + 12.8;
        }
      }
    })();

    setCurrentFileData({
      filter: editedFiles[currentIndex].filter,
      adjustments: editedFiles[currentIndex].adjustments,
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
      const oldFiles = [...prevFiles];
      oldFiles[currentIndex].filter = currentFileData.filter;
      oldFiles[currentIndex].adjustments = currentFileData.adjustments;

      return oldFiles;
    });

    if (type === 'prev') setCurrentIndex((prev) => prev - 1);
    else setCurrentIndex((prev) => prev + 1);
  };

  return (
    <div className={styles.carousel}>
      <div className={styles['carousel-container']}>
        <div className={styles['carousel-box']}>
          {currentIndex !== 0 && (
            <span
              className={styles['left-arrow-box']}
              onClick={changeCurrentIndex('prev')}
            >
              <MdKeyboardArrowLeft className={styles.arrow} />
            </span>
          )}

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
                aspect={1 / 1}
                onCropChange={setCrop}
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
                    filter: filters.find(
                      (filter) => filter.name === currentFileData.filter
                    )?.filter,
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
                      filter: filters.find(
                        (filter) => filter.name === currentFileData.filter
                      )?.filter,
                    }}
                    onMouseDown={(e) => (e.currentTarget.style.filter = 'none')}
                    onMouseUp={(e) =>
                      (e.currentTarget.style.filter = `${
                        filters.find(
                          (filter) => filter.name === currentFileData.filter
                        )?.filter
                      }`)
                    }
                  />
                ) : (
                  <video
                    className={styles.img}
                    ref={videoRef}
                    style={{
                      aspectRatio,
                      filter: filters.find(
                        (filter) => filter.name === currentFileData.filter
                      )?.filter,
                    }}
                    autoPlay={true}
                    loop={true}
                    onMouseDown={(e) => (e.currentTarget.style.filter = 'none')}
                    onMouseUp={(e) =>
                      (e.currentTarget.style.filter = `${
                        filters.find(
                          (filter) => filter.name === currentFileData.filter
                        )?.filter
                      }`)
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
              Adjustments
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
                      ? setCurrentFileData({ ...currentFileData, filter: name })
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
                      src="../../public/assets/filter4.avif"
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
                  />
                  <span className={styles['adjustment-value']}>20</span>
                </span>
              </span>

              <span className={styles['adjustment-box']}>
                <span className={styles['adjustment-box-head']}>
                  <label className={styles['adjustment-label']}>Contrast</label>
                  <span
                    className={`${styles['adjustment-reset']} ${
                      cropImage ? styles['hide-reset'] : ''
                    }`}
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
                  />
                  <span className={styles['adjustment-value']}>20</span>
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
                  />
                  <span className={styles['adjustment-value']}>20</span>
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
                  />
                  <span className={styles['adjustment-value']}>20</span>
                </span>
              </span>

              <span className={styles['adjustment-box']}>
                <span className={styles['adjustment-box-head']}>
                  <label className={styles['adjustment-label']}>Saturate</label>
                  <span
                    className={`${styles['adjustment-reset']} ${
                      cropImage ? styles['hide-reset'] : ''
                    }`}
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
                  />
                  <span className={styles['adjustment-value']}>20</span>
                </span>
              </span>

              <span className={styles['adjustment-box']}>
                <span className={styles['adjustment-box-head']}>
                  <label className={styles['adjustment-label']}>Sepia</label>
                  <span
                    className={`${styles['adjustment-reset']} ${
                      cropImage ? styles['hide-reset'] : ''
                    }`}
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
                  />
                  <span className={styles['adjustment-value']}>20</span>
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles['imgs-container']}>
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

        <div className={styles['imgs-div']}>
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
                      currentIndex === index ? styles['current-small-img'] : ''
                    }`}
                    src={file.src as string}
                  />
                ) : (
                  <video
                    className={`${styles['small-img']} ${
                      currentIndex === index ? styles['current-small-img'] : ''
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
              className={styles['add-file-box']}
              onClick={() => setAddFiles(true)}
            >
              <FaPlus className={styles['add-file-icon']} />
            </span>
          </div>
        </div>
      </div>

      <div className={styles['next-btn-div']}>
        <button className={styles['next-btn']}>Next</button>
      </div>
    </div>
  );
};

export default UploadCarousel;
