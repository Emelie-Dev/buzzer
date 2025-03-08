import { useEffect, useRef } from 'react';
import styles from '../styles/ContentItem.module.css';
import CarouselItem from './CarouselItem';

type ContentItemProps = {
  src: string;
  aspectRatio: number;
  setDescriptionWidth?: React.Dispatch<React.SetStateAction<number>>;
  type: 'image' | 'video';
  contentType: 'single' | 'reels';
  description: string;
  name?: string;
  hideData: boolean;
  setHideData: React.Dispatch<React.SetStateAction<boolean>>;
};

const ContentItem = ({
  src,
  aspectRatio,
  setDescriptionWidth,
  type,
  contentType,
  description,
  name,
  hideData,
  setHideData,
}: ContentItemProps) => {
  const contentRef = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    const resizeHandler = () => {
      if (setDescriptionWidth)
        setDescriptionWidth(contentRef.current.offsetWidth);
    };

    resizeHandler();

    window.addEventListener('resize', resizeHandler);

    return () => {
      window.removeEventListener('resize', resizeHandler);
    };
  }, []);

  return (
    <div className={styles.content} ref={contentRef}>
      <CarouselItem
        item={{ type, src }}
        aspectRatio={aspectRatio}
        hideData={hideData}
        setHideData={setHideData}
        itemIndex={0}
        contentIndex={0}
        viewType="content"
        contentType={contentType}
        description={description}
        name={name}
      />
    </div>
  );
};

export default ContentItem;
