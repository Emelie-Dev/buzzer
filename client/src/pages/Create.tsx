import { useEffect, useRef, useState } from 'react';
import NavBar from '../components/NavBar';
import styles from '../styles/Create.module.css';
import { FaPhotoVideo } from 'react-icons/fa';
import { PiVideoBold } from 'react-icons/pi';
import AsideHeader from '../components/AsideHeader';
import UploadCarousel from '../components/UploadCarousel';

// const values = {
//   brightness: [0.5, 1.5],
//   contrast: [0.5, 1.5],
//   grayscale: [0, 1],
//   hueRotate: [-90, 90],
//   saturate: [0, 2],
//   sepia: [0.1 - 0.5, 0, 0.6 - 1],
// };

export interface Content {
  src: string | ArrayBuffer | null;
  type: 'image' | 'video' | null;
  filter: string;
  adjustments: {
    brightness: number;
    contrast: number;
    grayscale: number;
    hueRotate: number;
    saturate: number;
    sepia: number;
  };
}

const Create = () => {
  const [category, setCategory] = useState<'reel' | 'content'>('content');
  const [stage, setStage] = useState<{ reel: string; content: string }>({
    reel: 'select',
    content: 'select',
  });
  const [files, setFiles] = useState<{
    content: Content[];
    reel: string | ArrayBuffer | null;
  }>({ content: [], reel: null });
  const [addFiles, setAddFiles] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null!);
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
    if (addFiles) fileRef.current.click();
  }, [addFiles]);

  // Add animation while reading files.
  // Remeber to revoke object urls after file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (category === 'content') {
      const uploadFiles = e.target.files;

      if (uploadFiles) {
        const filesData: Content[] = [];

        // Handle error
        if (uploadFiles.length > 20) return;

        for (let i = 0; i < uploadFiles.length; i++) {
          try {
            const result = await isFileValid(uploadFiles[i]);
            filesData.push(result);
          } catch (err) {
            filesData.forEach((data) =>
              URL.revokeObjectURL(data.src as string)
            );
            return alert(err);
          }
        }

        setFiles({ ...files, content: filesData });
      } else {
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
                brightness: 1,
                contrast: 1,
                grayscale: 0,
                hueRotate: 0,
                saturate: 1,
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
            brightness: 1,
            contrast: 1,
            grayscale: 0,
            hueRotate: 0,
            saturate: 1,
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
            <div className={styles['category-div']}>
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
              ) : (
                <UploadCarousel
                  files={files.content}
                  setAddFiles={setAddFiles}
                />
              )}
            </div>

            <div className={styles['category-div']}>
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
