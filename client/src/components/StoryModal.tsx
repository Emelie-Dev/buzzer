import styles from '../styles/StoryModal.module.css';
import { IoClose } from 'react-icons/io5';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import StoryItem from './StoryItem';
import { StoryContent } from './StoryItem';
import ReactDOM from 'react-dom';
import { StoryContext } from '../Contexts';

export interface Story {
  name: string;
  content: StoryContent[];
  time: string;
}

type StoryModalProps = {
  stories: any[];
  storiesSet: any[];
};

const StoryModal = ({ stories, storiesSet }: StoryModalProps) => {
  const { storyIndex, setViewStory } = useContext(StoryContext);
  const [currentIndex, setCurrentIndex] = useState<number>(storyIndex);
  const [isOperative, setIsOperative] = useState<boolean>(false);
  const [storyItems, setStoryItems] = useState<any[]>(storiesSet);

  const carouselRef = useRef<HTMLDivElement>(null!);

  const target = document.getElementById('stories-portal') || document.body;

  useEffect(() => {
    moveToStory(currentIndex, null, null, null, 'initial')();

    if (carouselRef.current)
      carouselRef.current.style.scrollBehavior = 'smooth';
  }, []);

  useEffect(() => {
    let start;
    const end = currentIndex + 2;

    if (currentIndex == 0) start = 0;
    else start = currentIndex - 1;

    setStoryItems(
      stories.map((item, index) => {
        if (index >= start && index < end) return item;
        else return null;
      })
    );
  }, [currentIndex]);

  const moveToStory = useCallback(
    (
        index: number,
        storyItemIndex: number | null,
        contentLength: number | null,
        setContentIndex: React.Dispatch<React.SetStateAction<number>> | null,
        type: 'initial' | 'next' | 'prev' | 'jump'
      ) =>
      () => {
        const ratio = window.matchMedia('(max-width: 900px)').matches
          ? 0.265
          : window.matchMedia('(max-width: 1000px)').matches
          ? 0.285
          : window.matchMedia('(max-width: 1100px)').matches
          ? 0.31
          : window.matchMedia('(max-width: 1200px)').matches
          ? 0.3345
          : 0.35;

        if (type === 'next') {
          setIsOperative(true);
          if (storyItemIndex === contentLength) {
            if (index === stories.length) setViewStory(false);
            else {
              setCurrentIndex(index);
              carouselRef.current.scrollLeft =
                index * Math.round(carouselRef.current.offsetWidth * ratio);
            }
          } else {
            if (setContentIndex) setContentIndex((prev) => prev + 1);
          }
        } else if (type === 'prev') {
          setIsOperative(true);
          if (storyItemIndex === 0) {
            setCurrentIndex(index);
            carouselRef.current.scrollLeft =
              index * Math.round(carouselRef.current.offsetWidth * ratio);
          } else {
            if (setContentIndex) setContentIndex((prev) => prev - 1);
          }
        } else {
          if (type === 'jump') setIsOperative(true);

          setCurrentIndex(index);
          carouselRef.current.scrollLeft =
            index * Math.round(carouselRef.current.offsetWidth * ratio);
        }
      },
    []
  );

  return ReactDOM.createPortal(
    <section className={styles.section}>
      <span
        className={styles['close-icon-box']}
        title="Close"
        onClick={() => setViewStory(false)}
      >
        <IoClose className={styles['close-icon']} />
      </span>

      <div className={styles['story-container']} ref={carouselRef}>
        <article className={styles['void-next-story']}></article>

        {storyItems.map((data, index) => (
          <StoryItem
            key={index}
            itemIndex={index}
            storyIndex={currentIndex}
            isOperative={isOperative}
            moveToStory={moveToStory}
            data={data}
            setStoryItems={setStoryItems}
            setCurrentIndex={setCurrentIndex}
          />
        ))}

        <article className={styles['void-next-story2']}></article>
      </div>
    </section>,
    target
  );
};

export default StoryModal;
