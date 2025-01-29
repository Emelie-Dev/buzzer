import { useEffect, useRef, useState } from 'react';
import NavBar from '../components/NavBar';
import styles from '../styles/Create.module.css';
import { FaPhotoVideo } from 'react-icons/fa';
import { PiVideoBold } from 'react-icons/pi';
import AsideHeader from '../components/AsideHeader';
import UploadCarousel from '../components/UploadCarousel';
import UploadDetails from '../components/UploadDetails';
import UploadReel from '../components/UploadReel';

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

const Create = () => {
  const [category, setCategory] = useState<'reel' | 'content'>('content');
  const [stage, setStage] = useState<{
    reel: 'select' | 'edit' | 'finish';
    content: 'select' | 'edit' | 'finish';
  }>({
    reel: 'select',
    content: 'select',
  });
  const [files, setFiles] = useState<{
    content: Content[];
    reel: string | ArrayBuffer | null;
  }>({ content: [], reel: null });
  const [rawFiles, setRawFiles] = useState<File[] | FileList>(null!);
  const [addFiles, setAddFiles] = useState(false);
  const [contentIndex, setContentIndex] = useState<number>(0);
  const [aspectRatio, setAspectRatio] = useState<'initial' | number>(1);

  const containerRef = useRef<HTMLDivElement>(null!);
  const stageRef = useRef<HTMLDivElement>(null!);
  const fileRef = useRef<HTMLInputElement>(null!);

  useEffect(() => {
    return () => {
      const { content, reel } = files;

      if (reel) URL.revokeObjectURL(reel as string);

      if (content.length > 0)
        content.forEach((file) => URL.revokeObjectURL(file.src as string));
    };
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      if (category === 'reel') {
        containerRef.current.scrollLeft += containerRef.current.offsetWidth;
      } else {
        containerRef.current.scrollLeft -= containerRef.current.offsetWidth;
      }
    }
  }, [category]);

  useEffect(() => {
    if (stageRef.current) stageRef.current.scrollTop = 0;
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
          results.forEach((result) => filesData.push(result));
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
        console.log(rawFiles);
        return;
      }
    }

    setStage({ ...stage, [category]: 'edit' });
  };

  const isFileValid = (file: File): Promise<Content> => {
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

        video.src = fileURL; // Set the source of the media element
        video.preload = 'metadata'; // Load only metadata (not the entire file)

        video.onloadedmetadata = () => {
          if (video.duration > 60) {
            reject('Duration Error');
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
        };

        video.onerror = () => reject('Video Error');
      } else {
        const fileURL = URL.createObjectURL(file);
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
          </ul>

          <input
            className={styles['file-input']}
            type="file"
            ref={fileRef}
            accept={category === 'content' ? 'video/*,image/*' : 'video/*'}
            multiple={category === 'content'}
            onChange={handleFileUpload}
          />

          <div className={styles['category-container']} ref={containerRef}>
            <div className={styles['category-div']} ref={stageRef}>
              {stage.content === 'select' ? (
                <>
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
                </>
              ) : stage.content === 'edit' ? (
                <UploadCarousel
                  files={files.content}
                  setAddFiles={setAddFiles}
                  fileRef={fileRef}
                  setFiles={setFiles}
                  setRawFiles={setRawFiles}
                  setStage={setStage}
                  contentIndex={contentIndex}
                  setContentIndex={setContentIndex}
                  aspectRatio={aspectRatio}
                  setAspectRatio={setAspectRatio}
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
              ) : (
                <UploadReel />
              )}
            </div>
          </div>
        </section>

        <section className={styles.aside}>
          <AsideHeader />

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
