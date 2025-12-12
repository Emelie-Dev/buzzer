import { useContext, useEffect, useRef, useState } from 'react';
import NavBar from '../components/NavBar';
import styles from '../styles/Create.module.css';
import { FaPhotoVideo } from 'react-icons/fa';
import { PiVideoBold } from 'react-icons/pi';
import AsideHeader from '../components/AsideHeader';
import UploadCarousel from '../components/UploadCarousel';
import UploadDetails from '../components/UploadDetails';
import UploadReel from '../components/UploadReel';
import UploadReelDetails, {
  ReelDetails,
} from '../components/UploadReelDetails';
import { GeneralContext, StoryContext } from '../Contexts';
import { FaTasks } from 'react-icons/fa';
import { IoClose, IoArrowBack } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import LoadingAnimation from '../components/LoadingAnimation';
import { Area } from 'react-easy-crop';

export interface Content {
  key: string;
  src: string | ArrayBuffer | null;
  type: 'image' | 'video' | null;
  filter: string;
  adjustments: {
    brightness: number;
    contrast: number;
    grayscale: number;
    'hue-rotate': number;
    saturate: number;
    sepia: number;
  };
}

export interface StoryData {
  key: string;
  src: string | ArrayBuffer | null;
  type: 'image' | 'video' | null;
  filter: string;
}

export interface videoData {
  src: string | ArrayBuffer | null;
  inputRef: React.MutableRefObject<HTMLInputElement>;
  coverUrls: string[];
  setCoverUrls: React.Dispatch<React.SetStateAction<string[]>>;
  coverIndex: number | 'local' | null;
  setCoverIndex: React.Dispatch<React.SetStateAction<number | 'local' | null>>;
  localCoverUrl: string;
  setLocalCoverUrl: React.Dispatch<React.SetStateAction<string>>;
  sliderValues: number | number[];
  setSliderValues: React.Dispatch<React.SetStateAction<number | number[]>>;
  hideVideo: boolean;
  setHideVideo: React.Dispatch<React.SetStateAction<boolean>>;
  currentSound: string | null;
  setCurrentSound: React.Dispatch<React.SetStateAction<string | null>>;
  localCoverFile: File;
  setLocalCoverFile: React.Dispatch<React.SetStateAction<File>>;
  rawCoverUrls: FileList | File[];
  setRawCoverUrls: React.Dispatch<React.SetStateAction<FileList | File[]>>;
}

export interface soundData {
  sounds: AudioFile[];
  setSounds: React.Dispatch<React.SetStateAction<AudioFile[]>>;
  rawSounds: File[] | FileList;
  setRawSounds: React.Dispatch<React.SetStateAction<FileList | File[]>>;
  setReelData: React.Dispatch<React.SetStateAction<ReelDetails>>;
  volume: {
    sound: number;
    original: number;
  };
  setVolume: React.Dispatch<
    React.SetStateAction<{
      sound: number;
      original: number;
    }>
  >;
}

export type AudioFile = {
  _id?: string;
  savedId?: string;
  name: string;
  duration: string;
  src: string;
  id: string;
  current?: boolean;
};

const Create = () => {
  const {
    createCategory = 'content',
    setCreateCategory,
    setShowSearchPage,
  } = useContext(GeneralContext);
  const [category, setCategory] = useState<'reel' | 'content' | 'story'>(
    createCategory
  );
  const [stage, setStage] = useState<{
    reel: 'select' | 'edit' | 'finish';
    content: 'select' | 'edit' | 'finish';
    story: 'select' | 'edit' | 'finish';
  }>({
    reel: 'select',
    content: 'select',
    story: 'select',
  });
  const [files, setFiles] = useState<{
    content: Content[];
    reel: string | ArrayBuffer | null;
    story: StoryData[];
  }>({ content: [], reel: null, story: [] });
  const [rawFiles, setRawFiles] = useState<Map<string, File>>(null!);
  const [rawReelFile, setRawReelFile] = useState<File>(null!);
  const [rawStoryFiles, setRawStoryFiles] = useState<Map<string, File>>(null!);
  const [addFiles, setAddFiles] = useState(false);
  const [contentIndex, setContentIndex] = useState<number>(0);
  const [aspectRatio, setAspectRatio] = useState<'initial' | number>(1);
  const [reelData, setReelData] = useState<ReelDetails>({
    video: '',
    sound: '',
    duration: [0, 0],
    coverPhoto: '',
    savedSound: false,
    reelSound: '',
  });

  const [sounds, setSounds] = useState<AudioFile[]>([]);
  const [rawSounds, setRawSounds] = useState<File[] | FileList>(null!);
  const [coverUrls, setCoverUrls] = useState<string[]>([]);
  const [rawCoverUrls, setRawCoverUrls] = useState<File[] | FileList>(null!);
  const [coverIndex, setCoverIndex] = useState<number | 'local' | null>(null);
  const [localCoverUrl, setLocalCoverUrl] = useState<string>('');
  const [localCoverFile, setLocalCoverFile] = useState<File>(null!);
  const [sliderValues, setSliderValues] = useState<number | number[]>([0, 100]);
  const [hideVideo, setHideVideo] = useState<boolean>(true);
  const [currentSound, setCurrentSound] = useState<string | null>(null);
  const [showGuidelines, setShowGuidelines] = useState<boolean>(false);
  const [videosCropArea, setVideosCropArea] = useState<Map<string, Area>>(
    new Map()
  );
  const [storyCropArea, setStoryCropArea] = useState<Map<string, Area>>(
    new Map()
  );
  const [volume, setVolume] = useState<{ sound: number; original: number }>({
    sound: 100,
    original: 0,
  });

  const [processing, setProcessing] = useState<{
    content: boolean;
    reel: boolean;
    story: boolean;
  }>({ content: false, reel: false, story: false });
  const { userStory } = useContext(StoryContext);

  const navigate = useNavigate();

  const containerRef = useRef<HTMLDivElement>(null!);
  const contentRef = useRef<HTMLDivElement>(null!);
  const fileRef = useRef<HTMLInputElement>(null!);

  const videoProps = {
    src: files.reel,
    inputRef: fileRef,
    coverUrls,
    setCoverUrls,
    coverIndex,
    setCoverIndex,
    localCoverUrl,
    setLocalCoverUrl,
    localCoverFile,
    setLocalCoverFile,
    rawCoverUrls,
    setRawCoverUrls,
    sliderValues,
    setSliderValues,
    hideVideo,
    setHideVideo,
    currentSound,
    setCurrentSound,
  };

  const soundProps = {
    sounds,
    setSounds,
    rawSounds,
    setRawSounds,
    setReelData,
    volume,
    setVolume,
  };

  useEffect(() => {
    document.title = 'Buzzer - Create';

    return () => {
      setShowSearchPage(false);

      setCreateCategory('content');

      const { content, reel } = files;

      if (reel) URL.revokeObjectURL(reel as string);

      if (content.length > 0)
        content.forEach((file) => URL.revokeObjectURL(file.src as string));

      if (sounds.length > 0)
        sounds.forEach((file) => URL.revokeObjectURL(file.src as string));

      if (localCoverUrl) URL.revokeObjectURL(localCoverUrl);
    };
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      if (category === 'reel') {
        containerRef.current.style.transform = `translateX(-100%)`;
      } else if (category === 'content') {
        containerRef.current.style.transform = `translateX(0%)`;
      } else {
        containerRef.current.style.transform = `translateX(-200%)`;
      }
    }
  }, [category]);

  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0;

    if (stage.reel === 'select') {
      if (files.reel) URL.revokeObjectURL(files.reel as string);
      if (localCoverUrl) URL.revokeObjectURL(localCoverUrl as string);

      if (sounds.length > 0)
        sounds.forEach((file) => URL.revokeObjectURL(file.src as string));

      if (coverUrls.length > 0)
        coverUrls.forEach((src) => URL.revokeObjectURL(src as string));

      setSounds([]);
      setRawSounds(null!);
      setCoverUrls([]);
      setCoverIndex(null);
      setLocalCoverUrl('');
      setSliderValues([0, 100]);
      setHideVideo(true);
      setCurrentSound(null);
      setFiles((prev) => ({ ...prev, reel: null }));
      setRawReelFile(null!);
      setRawCoverUrls([]);
      setLocalCoverFile(null!);
      setVolume({
        sound: 100,
        original: 0,
      });
    }

    if (stage.content === 'select') {
      files.content.forEach((file) => URL.revokeObjectURL(file.src as string));
      setFiles((prev) => ({ ...prev, content: [] }));
      setRawFiles(null!);
      setVideosCropArea(new Map());
    }

    if (stage.story === 'select') {
      files.story.forEach((file) => URL.revokeObjectURL(file.src as string));
      setFiles((prev) => ({ ...prev, story: [] }));
      setRawStoryFiles(null!);
      setStoryCropArea(new Map());
    }

    setProcessing((prev) => ({ ...prev, [category]: false }));
  }, [stage]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setProcessing((prev) => ({ ...prev, [category]: true }));

    const uploadFiles = e.target.files;

    try {
      if (category === 'content') {
        if (uploadFiles && uploadFiles.length > 0) {
          const filesData: Content[] = [];

          const uploadLength = addFiles ? 20 - files.content.length : 20;

          // Handle error
          if (uploadFiles.length > uploadLength) {
            e.target.files = new DataTransfer().files;
            const error = new Error('You can only upload 20 files at once.');
            error.name = 'operational';
            throw error;
          }

          const promises = [...uploadFiles].map((file) => isFileValid(file));

          try {
            const results = await Promise.all(promises);
            results.forEach((result) => filesData.push(result as Content));
          } catch (error: any) {
            filesData.forEach((data) =>
              URL.revokeObjectURL(data.src as string)
            );
            e.target.files = new DataTransfer().files;

            throw new Error(error);
          }

          e.target.files = new DataTransfer().files;
          setRawFiles((prevFiles) => {
            const mapData: [string, File][] = [...uploadFiles].map(
              (file, index) => [filesData[index].key, file]
            );

            if (addFiles) return new Map([...prevFiles, ...mapData]);
            else return new Map(mapData);
          });
          setFiles((prevFiles) => {
            if (addFiles) {
              return {
                ...prevFiles,
                content: [...prevFiles.content, ...filesData],
              };
            } else return { ...prevFiles, content: filesData };
          });
        } else throw new Error();
      } else if (category === 'reel') {
        const uploadFile = e.target.files && e.target.files[0];

        if (uploadFile) {
          try {
            const result = await isFileValid(uploadFile, true);
            setRawReelFile(uploadFile);
            setFiles((prevFiles) => ({ ...prevFiles, reel: result.src }));
            e.target.files = new DataTransfer().files;
          } catch (error: any) {
            e.target.files = new DataTransfer().files;
            throw new Error(error);
          }

          setCategory('content');
          setTimeout(() => setCategory('reel'), 0);
        } else throw new Error();
      } else {
        if (uploadFiles && uploadFiles.length > 0) {
          const filesData: StoryData[] = [];
          const storyLength = 10 - userStory.length;

          const uploadLength = addFiles
            ? storyLength - files.story.length
            : storyLength;

          if (uploadFiles.length > uploadLength) {
            e.target.files = new DataTransfer().files;
            const error = new Error(
              'You can have a maximum of 10 story files at once.'
            );
            error.name = 'operational';
            throw error;
          }

          const promises = [...uploadFiles].map((file) =>
            isFileValid(file, false, true)
          );

          try {
            const results = await Promise.all(promises);
            results.forEach((result) => filesData.push(result as StoryData));
          } catch (error: any) {
            filesData.forEach((data) =>
              URL.revokeObjectURL(data.src as string)
            );
            e.target.files = new DataTransfer().files;

            throw new Error(error);
          }

          e.target.files = new DataTransfer().files;

          setRawStoryFiles((prevFiles) => {
            const mapData: [string, File][] = [...uploadFiles].map(
              (file, index) => [filesData[index].key, file]
            );

            if (addFiles) return new Map([...prevFiles, ...mapData]);
            else return new Map(mapData);
          });
          setFiles((prevFiles) => {
            if (addFiles) {
              return {
                ...prevFiles,
                story: [...prevFiles.story, ...filesData],
              };
            } else return { ...prevFiles, story: filesData };
          });
        } else throw new Error();
      }

      setAddFiles(false);
      setTimeout(() => setStage({ ...stage, [category]: 'edit' }), 10);
    } catch (error: any) {
      const durationError =
        uploadFiles && uploadFiles.length === 1
          ? 'The file exceeds the allowed length.'
          : 'Some files exceed the allowed length.';

      const sizeError =
        uploadFiles && uploadFiles.length === 1
          ? 'The file exceeds the size limit.'
          : 'Some selected files exceed the size limit';

      const defaultError =
        uploadFiles && uploadFiles.length === 1
          ? 'We couldn’t process your file. Please try again.'
          : 'We couldn’t process some files. Please try again.';

      toast.error(
        error.name === 'operational'
          ? error.message
          : error.message === 'Size Error'
          ? sizeError
          : error.message === 'Duration Error'
          ? durationError
          : defaultError
      );
    } finally {
      setProcessing((prev) => ({ ...prev, [category]: false }));
    }
  };

  const isFileValid = (
    file: File,
    reel?: boolean,
    story?: boolean
  ): Promise<Content | StoryData> => {
    return new Promise((resolve, reject) => {
      const type = file.type.includes('image')
        ? 'image'
        : file.type.includes('video')
        ? 'video'
        : null;

      if (file.size > 1_073_741_824) {
        reject('Size Error');
      } else if (type === 'video') {
        const fileURL = URL.createObjectURL(file);
        const video = document.createElement('video');
        const maxDuration = reel ? 3600 : story ? 300 : 60;

        video.src = fileURL; // Set the source of the media element
        video.preload = 'metadata'; // Load only metadata (not the entire file)

        video.onloadedmetadata = () => {
          if (video.duration > maxDuration) {
            reject('Duration Error');
          } else {
            if (story) {
              resolve({
                key: crypto.randomUUID(),
                src: fileURL,
                type,
                filter: 'Original',
              });
            } else {
              resolve({
                key: crypto.randomUUID(),
                src: fileURL,
                type,
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
            }
          }
        };

        video.onerror = () => reject('Video Error');
      } else {
        const fileURL = URL.createObjectURL(file);

        if (story) {
          resolve({
            key: crypto.randomUUID(),
            src: fileURL,
            type,
            filter: 'Original',
          });
        } else {
          resolve({
            key: crypto.randomUUID(),
            src: fileURL,
            type,
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
        }
      }
    });
  };

  return (
    <>
      <NavBar page="create" editStage={stage[category] === 'edit'} />

      <section
        className={`${styles.main} ${
          stage[category] === 'edit' ? styles['edit-main'] : ''
        }`}
      >
        <section className={styles.section}>
          <header className={styles.header}>
            <h1 className={styles['section-head']}>
              <IoArrowBack
                className={styles['back-icon']}
                onClick={() => navigate(-1)}
              />
              Create
            </h1>
            <ul className={styles['type-list']}>
              <li
                className={`${styles['type-item']} ${
                  category === 'content' ? styles['active-item'] : ''
                }`}
                onClick={() => setCategory('content')}
              >
                Content
              </li>
              <li
                className={`${styles['type-item']} ${
                  category === 'reel' ? styles['active-item'] : ''
                }`}
                onClick={() => setCategory('reel')}
              >
                Reel
              </li>
              <li
                className={`${styles['type-item']} ${
                  category === 'story' ? styles['active-item'] : ''
                }`}
                onClick={() => setCategory('story')}
              >
                Story
              </li>
            </ul>

            <FaTasks
              className={styles['guidelines-icon']}
              onClick={() => setShowGuidelines(true)}
            />
          </header>

          <input
            className={styles['file-input']}
            type="file"
            ref={fileRef}
            accept={
              category === 'content' || category === 'story'
                ? 'image/*,video/mp4,video/webm,video/ogg,video/mpeg'
                : 'video/mp4,video/webm,video/ogg,video/mpeg'
            }
            multiple={category === 'content' || category === 'story'}
            onChange={handleFileUpload}
          />

          <div className={styles['category-container']} ref={containerRef}>
            <div className={styles['category-div']} ref={contentRef}>
              {stage.content === 'select' ? (
                <div className={styles['upload-div']}>
                  <FaPhotoVideo className={styles['content-icon']} />
                  <span className={styles['upload-text']}>
                    {' '}
                    Select the photos and videos you want to post
                  </span>
                  <button
                    className={styles['select-btn']}
                    onClick={() => fileRef.current.click()}
                  >
                    Select
                  </button>

                  {processing[category] && (
                    <div className={styles['loader-container']}>
                      <LoadingAnimation
                        style={{
                          width: '3rem',
                          height: '3rem',
                          transform: 'scale(2.5)',
                        }}
                      />
                    </div>
                  )}
                </div>
              ) : stage.content === 'edit' ? (
                <UploadCarousel
                  uploadType="content"
                  setFiles={setFiles}
                  setStage={setStage}
                  setAddFiles={setAddFiles}
                  fileRef={fileRef}
                  uploadProps={{
                    files: files.content,
                    contentIndex,
                    setContentIndex,
                    aspectRatio,
                    setAspectRatio,
                  }}
                  videosCropArea={videosCropArea}
                  setVideosCropArea={setVideosCropArea}
                  rawFiles={rawFiles}
                  setRawFiles={setRawFiles}
                />
              ) : (
                <UploadDetails
                  setStage={setStage}
                  editedFiles={files.content}
                  rawFiles={rawFiles}
                  contentIndex={contentIndex}
                  aspectRatio={aspectRatio}
                  setContentIndex={setContentIndex}
                  videosCropArea={videosCropArea}
                />
              )}
            </div>

            <div className={styles['category-div']}>
              {stage.reel === 'select' ? (
                <div className={styles['upload-div']}>
                  <PiVideoBold className={styles['content-icon']} />
                  <span className={styles['upload-text']}>
                    {' '}
                    Select the video you want to post
                  </span>
                  <button
                    className={styles['select-btn']}
                    onClick={() => fileRef.current.click()}
                  >
                    Select
                  </button>

                  {processing[category] && (
                    <div className={styles['loader-container']}>
                      <LoadingAnimation
                        style={{
                          width: '3rem',
                          height: '3rem',
                          transform: 'scale(2.5)',
                        }}
                      />
                    </div>
                  )}
                </div>
              ) : stage.reel === 'edit' ? (
                <UploadReel
                  videoProps={videoProps}
                  soundProps={soundProps}
                  setStage={setStage}
                />
              ) : (
                <UploadReelDetails
                  data={reelData}
                  setStage={setStage}
                  soundData={{ sounds, rawSounds, currentSound, volume }}
                  coverData={{ coverIndex, localCoverFile, rawCoverUrls }}
                  rawReelFile={rawReelFile}
                />
              )}
            </div>

            <div className={styles['category-div']}>
              {stage.story === 'select' ? (
                <div className={styles['upload-div']}>
                  <FaPhotoVideo className={styles['content-icon']} />
                  <span className={styles['upload-text']}>
                    Select the photos and videos you want to post
                  </span>
                  <button
                    className={styles['select-btn']}
                    onClick={() => fileRef.current.click()}
                  >
                    Select
                  </button>

                  {processing[category] && (
                    <div className={styles['loader-container']}>
                      <LoadingAnimation
                        style={{
                          width: '3rem',
                          height: '3rem',
                          transform: 'scale(2.5)',
                        }}
                      />
                    </div>
                  )}
                </div>
              ) : stage.story === 'edit' ? (
                <UploadCarousel
                  uploadType="story"
                  setFiles={setFiles}
                  setStage={setStage}
                  setAddFiles={setAddFiles}
                  fileRef={fileRef}
                  uploadProps={{
                    storyFiles: files.story,
                  }}
                  videosCropArea={storyCropArea}
                  setVideosCropArea={setStoryCropArea}
                  rawFiles={rawStoryFiles}
                  setRawFiles={setRawStoryFiles}
                />
              ) : (
                ''
              )}
            </div>
          </div>
        </section>

        <section className={styles.aside}>
          <AsideHeader activeVideo={null} />

          <div className={styles['tips-container']}>
            <span className={styles['tips-text']}>Upload Guidelines</span>

            <ul className={styles['upload-guidelines']}>
              <li className={styles['guideline']}>
                <span className={styles['guideline-head']}>
                  Upload Limit (for content)
                </span>
                <br />
                <span className={styles['guideline-text']}>
                  Maximum number of files per post: 20.
                </span>
              </li>

              <li className={styles['guideline']}>
                <span className={styles['guideline-head']}>File Size</span>
                <br />
                <span className={styles['guideline-text']}>
                  Maximum file size: 1 GB.
                </span>
              </li>

              <li className={styles['guideline']}>
                <span className={styles['guideline-head']}>File Format</span>
                <br />
                <span className={styles['guideline-text']}>
                  Major file formats for photos and videos (mp4, webm, ogg) are
                  supported.
                </span>
              </li>

              <li className={styles['guideline']}>
                <span className={styles['guideline-head']}>
                  Duration (for videos)
                </span>
                <br />
                <span className={styles['guideline-text']}>
                  Maximum Duration for content: 60 seconds. <br />
                  Maximum Duration for reel: 60 minutes.
                </span>
              </li>

              <li className={styles['guideline']}>
                <span className={styles['guideline-head']}>Resolution</span>
                <br />
                <span className={styles['guideline-text']}>
                  Minimum recommended resolution: 720p (for videos).
                </span>
              </li>

              <li className={styles['guideline']}>
                <span className={styles['guideline-head']}>Aspect Ratio</span>
                <br />
                <span className={styles['guideline-text']}>
                  Recommended aspect ratio: 16:9 (for videos).
                </span>
              </li>

              <li className={styles['guideline']}>
                <span className={styles['guideline-head']}>Safe Posting</span>
                <br />
                <span className={styles['guideline-text']}>
                  Ensure your content follows{' '}
                  <b className={styles['community-guidelines']}>
                    community guidelines
                  </b>
                  .
                </span>
              </li>
            </ul>
          </div>
        </section>
      </section>

      {showGuidelines && (
        <section
          className={styles['guidelines-section']}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowGuidelines(false);
            }
          }}
        >
          <div className={styles['guidelines-container']}>
            <h1 className={styles['guidelines-head']}>
              <span className={styles['guidelines-head-text']}>
                Upload Guidelines
              </span>

              <span
                className={styles['close-icon-box']}
                title="Close"
                onClick={() => setShowGuidelines(false)}
              >
                <IoClose className={styles['close-icon']} />
              </span>
            </h1>

            <ul className={styles['upload-guidelines']}>
              <li className={styles['guideline']}>
                <span className={styles['guideline-head']}>
                  Upload Limit (for content)
                </span>
                <br />
                <span className={styles['guideline-text']}>
                  Maximum number of files per post: 20.
                </span>
              </li>

              <li className={styles['guideline']}>
                <span className={styles['guideline-head']}>File Size</span>
                <br />
                <span className={styles['guideline-text']}>
                  Maximum file size: 1 GB.
                </span>
              </li>

              <li className={styles['guideline']}>
                <span className={styles['guideline-head']}>File Format</span>
                <br />
                <span className={styles['guideline-text']}>
                  Major file formats for photos and videos (mp4, webm, ogg) are
                  supported.
                </span>
              </li>

              <li className={styles['guideline']}>
                <span className={styles['guideline-head']}>
                  Duration (for videos)
                </span>
                <br />
                <span className={styles['guideline-text']}>
                  Maximum Duration for content: 60 seconds. <br />
                  Maximum Duration for reel: 60 minutes.
                </span>
              </li>

              <li className={styles['guideline']}>
                <span className={styles['guideline-head']}>Resolution</span>
                <br />
                <span className={styles['guideline-text']}>
                  Minimum recommended resolution: 720p (for videos).
                </span>
              </li>

              <li className={styles['guideline']}>
                <span className={styles['guideline-head']}>Aspect Ratio</span>
                <br />
                <span className={styles['guideline-text']}>
                  Recommended aspect ratio: 16:9 (for videos).
                </span>
              </li>

              <li className={styles['guideline']}>
                <span className={styles['guideline-head']}>Safe Posting</span>
                <br />
                <span className={styles['guideline-text']}>
                  Ensure your content follows{' '}
                  <b className={styles['community-guidelines']}>
                    community guidelines
                  </b>
                  .
                </span>
              </li>
            </ul>
          </div>
        </section>
      )}
    </>
  );
};
export default Create;
