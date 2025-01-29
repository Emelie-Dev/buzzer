import styles from '../styles/UploadDetails.module.css';
import { Content } from '../pages/Create';
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from 'react-icons/md';
import { useEffect, useRef, useState } from 'react';
import { getFilterValue } from '../Utilities';
import { IoArrowBack } from 'react-icons/io5';
import { IoClose } from 'react-icons/io5';

type UploadDetailsProps = {
  setStage: React.Dispatch<
    React.SetStateAction<{
      reel: 'select' | 'edit' | 'finish';
      content: 'select' | 'edit' | 'finish';
    }>
  >;
  editedFiles: Content[];
  contentIndex: number;
  setContentIndex: React.Dispatch<React.SetStateAction<number>>;
  aspectRatio: number | 'initial';
};

const UploadDetails = ({
  setStage,
  editedFiles,
  contentIndex,
  aspectRatio,
  setContentIndex,
}: UploadDetailsProps) => {
  const [currentFileIndex, setCurrentFileIndex] = useState<number>(0);
  const [generalDescription, setGeneralDescription] = useState<string>('');
  const [collaborator, setCollaborator] = useState<string>('');

  const dotRef = useRef<HTMLSpanElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const collaboratorRef = useRef<HTMLInputElement>(null!);

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

  return (
    <div className={styles['carousel-details-section']}>
      <div className={styles['carousel-details-container']}>
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
          <video
            className={styles.img}
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
                placeholder="Description for each file...."
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
                  200/4000
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
              onInput={(e) => {
                setGeneralDescription(e.currentTarget.textContent || '');
              }}
            ></div>

            {generalDescription.length === 0 && (
              <span className={styles.placeholder}>
                General description for all files....
              </span>
            )}

            <div className={styles['description-details']}>
              <span className={styles['links-box']}>
                <span className={styles['mention-box']}>@ Mention</span>
                <span className={styles['hashtag-box']}># Hashtags</span>
              </span>

              <span className={styles['description-length']}>200/3000</span>
            </div>
          </div>
        </div>

        <div className={styles['collaborator-container']}>
          <span className={styles['collaborator-head']}>Add collaborators</span>

          <span className={styles['collaborators-box']}>
            <input
              type="text"
              className={styles['collaborators-input']}
              ref={collaboratorRef}
              placeholder="Search for user...."
              value={collaborator}
              onChange={(e) => setCollaborator(e.target.value)}
            />

            {collaborator.length > 0 && (
              <IoClose
                className={styles['clear-icon']}
                onClick={() => {
                  setCollaborator('');
                  collaboratorRef.current.focus();
                }}
              />
            )}
          </span>
        </div>

        <div className={styles['settings-container']}>
          <span className={styles['settings-head']}>Settings</span>

          <div className={styles['settings-div']}>
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
                id="views"
                className={styles['settings-checkbox']}
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
          <button className={`${styles['post-btn']} ${styles['cancel-btn']}`}>
            Discard
          </button>

          <button className={styles['post-btn']}>Post</button>
        </div>
      </div>
    </div>
  );
};

export default UploadDetails;
