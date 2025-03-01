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
import { GeneralContext } from '../Contexts';

export interface Content {
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
}

export interface soundData {
  sounds: AudioFile[];
  setSounds: React.Dispatch<React.SetStateAction<AudioFile[]>>;
  rawSounds: File[] | FileList;
  setRawSounds: React.Dispatch<React.SetStateAction<FileList | File[]>>;
  savedSounds: AudioFile[];
  setSavedSounds: React.Dispatch<React.SetStateAction<AudioFile[]>>;
  setReelData: React.Dispatch<React.SetStateAction<ReelDetails>>;
}

export type AudioFile = {
  name: string;
  duration: string;
  src: string;
  id: string;
  saved?: boolean;
  current?: boolean;
};

const Create = () => {
  const { createCategory = 'content', setCreateCategory } =
    useContext(GeneralContext);
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
  const setRawFiles = useState<File[] | FileList>(null!)[1];
  const setRawReelFile = useState<File>(null!)[1];
  const setRawStoryFiles = useState<File[] | FileList>(null!)[1];
  const [addFiles, setAddFiles] = useState(false);
  const [contentIndex, setContentIndex] = useState<number>(0);
  const [aspectRatio, setAspectRatio] = useState<'initial' | number>(1);
  const [reelData, setReelData] = useState<ReelDetails>({
    video: '',
    sound: '',
    duration: [0, 0],
    coverPhoto: '',
  });

  const [sounds, setSounds] = useState<AudioFile[]>([]);
  const [rawSounds, setRawSounds] = useState<File[] | FileList>(null!);
  const [savedSounds, setSavedSounds] = useState<AudioFile[]>([]);
  const [coverUrls, setCoverUrls] = useState<string[]>([]);
  const [coverIndex, setCoverIndex] = useState<number | 'local' | null>(null);
  const [localCoverUrl, setLocalCoverUrl] = useState<string>('');
  const [sliderValues, setSliderValues] = useState<number | number[]>([0, 100]);
  const [hideVideo, setHideVideo] = useState<boolean>(true);
  const [currentSound, setCurrentSound] = useState<string | null>(null);

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
    savedSounds,
    setSavedSounds,
    setReelData,
  };

  useEffect(() => {
    return () => {
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
      setSounds([]);
      setRawSounds(null!);
      setSavedSounds([]);
      setCoverUrls([]);
      setCoverIndex(null);
      setLocalCoverUrl('');
      setSliderValues([0, 100]);
      setHideVideo(true);
      setCurrentSound(null);
    }
  }, [stage]);

  // Add animation while reading files.
  // Remeber to revoke object urls after file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (category === 'content') {
      const uploadFiles = e.target.files;

      if (uploadFiles && uploadFiles.length > 0) {
        const filesData: Content[] = [];

        const uploadLength = addFiles ? 20 - files.content.length : 20;

        // Handle error
        if (uploadFiles.length > uploadLength) {
          e.target.files = new DataTransfer().files;
          return;
        }

        const promises = [...uploadFiles].map((file) => isFileValid(file));

        try {
          const results = await Promise.all(promises);
          results.forEach((result) => filesData.push(result as Content));
        } catch (error) {
          filesData.forEach((data) => URL.revokeObjectURL(data.src as string));
          e.target.files = new DataTransfer().files;
          return alert(error);
        }

        e.target.files = new DataTransfer().files;
        setRawFiles((prevFiles) => {
          if (addFiles) return [...prevFiles, ...uploadFiles];
          else return uploadFiles;
        });
        setFiles((prevFiles) => {
          if (addFiles) {
            return {
              ...prevFiles,
              content: [...prevFiles.content, ...filesData],
            };
          } else return { ...prevFiles, content: filesData };
        });
      } else {
        return;
      }
    } else if (category === 'reel') {
      const uploadFile = e.target.files && e.target.files[0];

      if (uploadFile) {
        try {
          const result = await isFileValid(uploadFile, true);
          setRawReelFile(uploadFile);
          setFiles((prevFiles) => ({ ...prevFiles, reel: result.src }));
          e.target.files = new DataTransfer().files;
        } catch (err) {
          e.target.files = new DataTransfer().files;
          return alert(err);
        }

        setCategory('content');
        setTimeout(() => setCategory('reel'), 0);
      } else return;
    } else {
      const uploadFiles = e.target.files;

      if (uploadFiles && uploadFiles.length > 0) {
        const filesData: StoryData[] = [];

        const uploadLength = addFiles ? 10 - files.story.length : 10;

        // Handle error
        if (uploadFiles.length > uploadLength) {
          e.target.files = new DataTransfer().files;
          return;
        }

        const promises = [...uploadFiles].map((file) =>
          isFileValid(file, false, true)
        );

        try {
          const results = await Promise.all(promises);
          results.forEach((result) => filesData.push(result as StoryData));
        } catch (error) {
          filesData.forEach((data) => URL.revokeObjectURL(data.src as string));
          e.target.files = new DataTransfer().files;
          return alert(error);
        }

        e.target.files = new DataTransfer().files;

        setRawStoryFiles((prevFiles) => {
          if (addFiles) return [...prevFiles, ...uploadFiles];
          else return uploadFiles;
        });
        setFiles((prevFiles) => {
          if (addFiles) {
            return {
              ...prevFiles,
              story: [...prevFiles.story, ...filesData],
            };
          } else return { ...prevFiles, story: filesData };
        });
      } else return;
    }

    setStage({ ...stage, [category]: 'edit' });
    setAddFiles(false);
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
                src: fileURL,
                type,
                filter: 'Original',
              });
            } else {
              resolve({
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
            src: fileURL,
            type,
            filter: 'Original',
          });
        } else {
          resolve({
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

          <input
            className={styles['file-input']}
            type="file"
            ref={fileRef}
            accept={
              category === 'content' || category === 'story'
                ? 'video/*,image/*'
                : 'video/*'
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
                    setRawFiles,
                    contentIndex,
                    setContentIndex,
                    aspectRatio,
                    setAspectRatio,
                  }}
                />
              ) : (
                <UploadDetails
                  setStage={setStage}
                  editedFiles={files.content}
                  contentIndex={contentIndex}
                  aspectRatio={aspectRatio}
                  setContentIndex={setContentIndex}
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
                </div>
              ) : stage.reel === 'edit' ? (
                <UploadReel
                  videoProps={videoProps}
                  soundProps={soundProps}
                  setStage={setStage}
                />
              ) : (
                <UploadReelDetails data={reelData} setStage={setStage} />
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
                    setRawStoryFiles,
                  }}
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
                  Major file formats for photos and videos are supported.
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
    </>
  );
};
export default Create;
