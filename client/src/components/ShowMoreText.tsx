import parse from 'html-react-parser';
import { useEffect, useRef, useState } from 'react';

type ShowMoreTextProps = {
  text: string;
  lines?: number;
  className?: string;
  anchorClass?: string;
  moreText?: string;
  lessText?: string;
  increment?: boolean;
};

const ShowMoreText = ({
  text,
  lines = 2,
  className,
  anchorClass,
  moreText = 'more',
  lessText,
  increment = false,
}: ShowMoreTextProps) => {
  const [lineClamp, setLineClamp] = useState<number | 'unset'>(lines);
  const [expanded, setExpanded] = useState(false);
  const [truncated, setTruncated] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const intialHeight = useRef<any>(null!);

  useEffect(() => {
    const el = contentRef.current;
    if (el) {
      setTruncated(el.scrollHeight > el.clientHeight);
      intialHeight.current = el.clientHeight;
    }
  }, []);

  const handleExpand = () => {
    if (expanded) {
      setLineClamp(lines);
      return;
    }

    if (increment) {
      setLineClamp((prev) => Number(prev) + lines);
    } else {
      setLineClamp('unset');
    }

    const el = contentRef.current;
    if (el) {
      setExpanded(el.scrollHeight <= el.clientHeight + intialHeight.current);
    }
  };

  return (
    <div>
      <div
        className={className}
        style={
          {
            display: '-webkit-box',
            WebkitLineClamp: `${lineClamp}`,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineClamp: `${lineClamp}`,
          } as any
        }
        ref={contentRef}
      >
        {parse(text)}
      </div>

      {truncated && (
        <span className={anchorClass} onClick={handleExpand}>
          {expanded ? lessText : moreText}
        </span>
      )}
    </div>
  );
};

export default ShowMoreText;
