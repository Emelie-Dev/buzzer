import styles from '../styles/StoryModal.module.css';
import { IoClose } from 'react-icons/io5';
import { useCallback, useEffect, useRef, useState } from 'react';
import StoryItem from './StoryItem';
import { StoryContent } from './StoryItem';
import ReactDOM from 'react-dom';

export interface Story {
  name: string;
  content: StoryContent[];
  time: string;
}

type StoryModalProps = {
  setViewStory: React.Dispatch<React.SetStateAction<boolean>>;
  itemIndex: number;
};

const stories: Story[] = [
  {
    name: 'userOne',
    content: [
      { type: 'video', src: 'content20' },
      { type: 'image', src: 'content10' },
      { type: 'video', src: 'content25' },
      { type: 'video', src: 'content20' },
      { type: 'video', src: 'content6' },
      { type: 'image', src: 'content8' },
      { type: 'image', src: 'content14' },
    ],
    time: '23 seconds ago',
  },
  {
    name: 'coolGuy',
    content: [
      { type: 'image', src: 'content8' },
      { type: 'video', src: 'content6' },
      { type: 'video', src: 'content21' },
      { type: 'video', src: 'content20' },
      { type: 'video', src: 'content20' },
    ],
    time: '12 hours ago',
  },
  {
    name: 'happy123',
    content: [
      { type: 'image', src: 'content7' },
      { type: 'image', src: 'content3' },
      { type: 'image', src: 'content14' },
      { type: 'video', src: 'content25' },
      { type: 'video', src: 'content24' },
      { type: 'video', src: 'content6' },
      { type: 'video', src: 'content20' },
    ],
    time: '19 seconds ago',
  },
  {
    name: 'sunshineGirl',
    content: [
      { type: 'image', src: 'content16' },
      { type: 'video', src: 'content6' },
    ],
    time: '17 hours ago',
  },
  {
    name: 'codeMaster',
    content: [
      { type: 'image', src: 'content15' },
      { type: 'image', src: 'content10' },
      { type: 'image', src: 'content2' },
      { type: 'video', src: 'content20' },
      { type: 'image', src: 'content1' },
      { type: 'image', src: 'content5' },
      { type: 'image', src: 'content22' },
      { type: 'video', src: 'content25' },
      { type: 'image', src: 'content18' },
    ],
    time: '13 hours ago',
  },
  {
    name: 'skyWalker',
    content: [
      { type: 'image', src: 'content5' },
      { type: 'image', src: 'content7' },
      { type: 'image', src: 'content3' },
      { type: 'video', src: 'content21' },
      { type: 'image', src: 'content13' },
      { type: 'image', src: 'content5' },
      { type: 'video', src: 'content20' },
    ],
    time: '15 hours ago',
  },
  {
    name: 'theArtist',
    content: [
      { type: 'video', src: 'content24' },
      { type: 'video', src: 'content25' },
      { type: 'video', src: 'content20' },
      { type: 'image', src: 'content8' },
      { type: 'video', src: 'content25' },
      { type: 'video', src: 'content21' },
      { type: 'video', src: 'content6' },
      { type: 'image', src: 'content2' },
      { type: 'video', src: 'content24' },
      { type: 'image', src: 'content12' },
    ],
    time: '12 hours ago',
  },
  {
    name: 'jungleKing',
    content: [
      { type: 'video', src: 'content21' },
      { type: 'image', src: 'content3' },
    ],
    time: '17 hours ago',
  },
  {
    name: 'dreamer_98',
    content: [
      { type: 'video', src: 'content25' },
      { type: 'video', src: 'content25' },
      { type: 'image', src: 'content10' },
      { type: 'image', src: 'content11' },
      { type: 'video', src: 'content6' },
      { type: 'video', src: 'content21' },
      { type: 'video', src: 'content24' },
      { type: 'video', src: 'content24' },
      { type: 'image', src: 'content3' },
    ],
    time: '12 minutes ago',
  },
  {
    name: 'techieDude',
    content: [{ type: 'video', src: 'content24' }],
    time: '20 hours ago',
  },
  {
    name: 'cityExplorer',
    content: [
      { type: 'video', src: 'content21' },
      { type: 'image', src: 'content22' },
      { type: 'video', src: 'content6' },
    ],
    time: '15 minutes ago',
  },
  {
    name: 'natureLover',
    content: [
      { type: 'image', src: 'content19' },
      { type: 'image', src: 'content22' },
      { type: 'video', src: 'content25' },
      { type: 'video', src: 'content25' },
      { type: 'image', src: 'content13' },
      { type: 'video', src: 'content6' },
      { type: 'video', src: 'content25' },
      { type: 'video', src: 'content21' },
    ],
    time: '13 seconds ago',
  },
  {
    name: 'mountainView',
    content: [
      { type: 'image', src: 'content15' },
      { type: 'image', src: 'content1' },
      { type: 'video', src: 'content20' },
      { type: 'video', src: 'content24' },
    ],
    time: '22 hours ago',
  },
  {
    name: 'coffeeAddict',
    content: [
      { type: 'image', src: 'content10' },
      { type: 'image', src: 'content8' },
      { type: 'video', src: 'content25' },
      { type: 'video', src: 'content20' },
      { type: 'image', src: 'content3' },
      { type: 'image', src: 'content13' },
      { type: 'video', src: 'content25' },
      { type: 'video', src: 'content20' },
    ],
    time: '18 minutes ago',
  },
  {
    name: 'chefTom',
    content: [
      { type: 'image', src: 'content8' },
      { type: 'image', src: 'content10' },
      { type: 'video', src: 'content20' },
      { type: 'image', src: 'content10' },
      { type: 'image', src: 'content8' },
      { type: 'video', src: 'content21' },
      { type: 'image', src: 'content2' },
      { type: 'image', src: 'content19' },
      { type: 'video', src: 'content6' },
      { type: 'image', src: 'content5' },
    ],
    time: '15 seconds ago',
  },
  {
    name: 'oceanWave',
    content: [
      { type: 'video', src: 'content21' },
      { type: 'video', src: 'content21' },
      { type: 'image', src: 'content8' },
    ],
    time: '6 seconds ago',
  },
  {
    name: 'bookworm101',
    content: [
      { type: 'video', src: 'content6' },
      { type: 'video', src: 'content6' },
      { type: 'video', src: 'content24' },
      { type: 'image', src: 'content9' },
      { type: 'video', src: 'content24' },
      { type: 'video', src: 'content6' },
      { type: 'video', src: 'content20' },
    ],
    time: '17 seconds ago',
  },
  {
    name: 'fastRunner',
    content: [
      { type: 'image', src: 'content22' },
      { type: 'video', src: 'content25' },
      { type: 'video', src: 'content25' },
      { type: 'image', src: 'content17' },
      { type: 'video', src: 'content24' },
      { type: 'video', src: 'content25' },
    ],
    time: '17 minutes ago',
  },
  {
    name: 'digitalNomad',
    content: [
      { type: 'video', src: 'content24' },
      { type: 'video', src: 'content25' },
      { type: 'image', src: 'content17' },
      { type: 'image', src: 'content18' },
      { type: 'image', src: 'content18' },
      { type: 'image', src: 'content7' },
      { type: 'image', src: 'content9' },
    ],
    time: '6 seconds ago',
  },
  {
    name: 'starGazer',
    content: [
      { type: 'image', src: 'content2' },
      { type: 'image', src: 'content19' },
      { type: 'video', src: 'content24' },
      { type: 'image', src: 'content18' },
      { type: 'video', src: 'content6' },
    ],
    time: '20 hours ago',
  },
];

const StoryModal = ({ setViewStory, itemIndex }: StoryModalProps) => {
  const [currentIndex, setCurrentIndex] = useState<number>(itemIndex);
  const [isOperative, setIsOperative] = useState<boolean>(false);

  const carouselRef = useRef<HTMLDivElement>(null!);

  const target = document.getElementById('stories-portal') || document.body;

  useEffect(() => {
    moveToStory(currentIndex, null, null, null, 'initial')();

    if (carouselRef.current)
      carouselRef.current.style.scrollBehavior = 'smooth';
  }, []);

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
            setCurrentIndex(index);
            carouselRef.current.scrollLeft =
              index * (carouselRef.current.offsetWidth * 0.3 + 96);
          } else {
            if (setContentIndex) setContentIndex((prev) => prev + 1);
          }
        } else if (type === 'prev') {
          setIsOperative(true);
          if (storyItemIndex === 0) {
            setCurrentIndex(index);
            carouselRef.current.scrollLeft =
              index * (carouselRef.current.offsetWidth * 0.3 + 96);
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
        <article className={styles['void-next-story']}>m</article>

        {stories.map((data, index) => (
          <StoryItem
            key={index}
            itemIndex={index}
            active={currentIndex === index}
            storyIndex={currentIndex}
            isOperative={isOperative}
            moveToStory={moveToStory}
            totalLength={stories.length}
            data={data}
          />
        ))}

        <article className={styles['void-next-story2']}>m</article>
      </div>
    </section>,
    target
  );
};

export default StoryModal;
