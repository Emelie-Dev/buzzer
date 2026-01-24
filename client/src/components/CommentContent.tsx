import styles from '../styles/CommentContent.module.css';
import { FiHeart } from 'react-icons/fi';
import { IoIosArrowDown } from 'react-icons/io';
import { MdDelete } from 'react-icons/md';
import { HiOutlineDotsHorizontal } from 'react-icons/hi';
import { useContext, useEffect, useRef, useState } from 'react';
import { apiClient, getTime, getUrl } from '../Utilities';
import { AuthContext } from '../Contexts';
import { BsDot } from 'react-icons/bs';
import { toast } from 'sonner';
import { IoMdHeart } from 'react-icons/io';
import LoadingAnimation from './LoadingAnimation';
import CommentReply from './CommentReply';
import ShowMoreText from './ShowMoreText';
import { Link } from 'react-router-dom';

type CommentContentProps = {
  data: any;
  creator: any;
  setComments: any;
  collaborators: any;
  setReply: React.Dispatch<any>;
};

const CommentContent = ({
  data,
  creator,
  setComments,
  collaborators,
  setReply,
}: CommentContentProps) => {
  const {
    _id: commentId,
    user,
    hasStory,
    hasUnviewedStory,
    text,
    createdAt,
    likes,
    likeObj,
    ownerLiked,
    collectionName,
    documentId,
    ownerReply,
    ownerReplyLikeDetails,
    repliesCount,
    mentions,
  } = data;
  const { user: viewer } = useContext(AuthContext);
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [like, setLike] = useState<{ value: any; count: number }>({
    value: likeObj,
    count: likes,
  });
  const [loading, setLoading] = useState({
    like: false,
    delete: false,
    replies: false,
  });
  const [replies, setReplies] = useState<{ value: any[]; count: number }>({
    value: [],
    count: ownerReply ? repliesCount - 1 : repliesCount,
  });
  const [cursor, setCursor] = useState<string>(null!);
  const [excludeArray, setExcludeArray] = useState<string[]>([]);

  const subCommentRef = useRef<HTMLDivElement>(null!);
  const time = useRef<string>(getTime(createdAt, true));

  useEffect(() => {
    setLike({ value: likeObj, count: likes });

    setReplies({
      value: ownerReply
        ? [{ ...ownerReply, ...creator, ...ownerReplyLikeDetails }]
        : [],
      count: ownerReply ? repliesCount - 1 : repliesCount,
    });

    setExcludeArray((prev) => (ownerReply ? [ownerReply._id] : prev));
  }, []);

  const handleLike = async () => {
    setLoading({ ...loading, like: true });

    try {
      if (!like.value) {
        const { data } = await apiClient.post('v1/likes', {
          collection: 'comment',
          documentId: commentId,
        });

        setLike({ value: data.data.like, count: like.count + 1 });
      } else {
        await apiClient.delete(
          `v1/likes/content/${commentId}?id=${like.value._id}`,
        );
        setLike({ value: null, count: like.count - 1 });
      }
    } catch {
      toast.error(
        `Could not ${
          like.value ? 'remove like' : 'like comment'
        }. Please Try again.`,
      );
    } finally {
      setLoading({ ...loading, like: false });
    }
  };

  const deleteComment = async () => {
    setLoading({ ...loading, delete: true });

    // Get mentions

    try {
      await apiClient.delete(`v1/comments/${commentId}`, {
        data: { collection: collectionName, documentId, mentions },
      });

      setComments(({ value, totalCount }: any) => ({
        value: value.filter((comment: any) => comment._id !== commentId),
        totalCount: totalCount - 1,
      }));
    } catch (err: any) {
      if (!err.response) {
        toast.error(`Could not delete comment. Please Try again.`);
      } else {
        toast.error(err.response.data.message);
      }
    } finally {
      setLoading({ ...loading, delete: false });
    }
  };

  const getReplies = async () => {
    setLoading({ ...loading, replies: true });

    try {
      const { data } = await apiClient.post(`v1/comments`, {
        collection: collectionName,
        documentId,
        cursor,
        reply: true,
        commentId,
        excludeArray,
      });

      setReplies(({ value }) => ({
        value: [...value, ...data.data.comments],
        count: Math.max(data.data.totalCount - 5, 0),
      }));

      setCursor(data.data.nextCursor ? data.data.nextCursor : cursor);
    } catch (err: any) {
      if (!err.response) {
        toast.error(`Could not load replies. Please Try again.`);
      } else {
        toast.error(err.response.data.message);
      }
    } finally {
      setLoading({ ...loading, replies: false });
    }
  };

  return (
    <article
      className={styles['comment-box']}
      onMouseOver={(e) => {
        if (!subCommentRef.current.contains(e.target as Node))
          setShowMenu(true);
      }}
      onMouseOut={() => setShowMenu(false)}
    >
      <Link to={`/@${user.username}`}>
        <span
          className={`${styles['comment-img-box']} ${
            hasStory && (hasUnviewedStory || user._id === viewer._id)
              ? styles['comment-img-box3']
              : hasStory
                ? styles['comment-img-box2']
                : ''
          }`}
        >
          <img
            className={styles['comment-img']}
            src={getUrl(user.photo, 'users')}
          />
        </span>
      </Link>

      <div className={styles['comment-details']}>
        <span className={styles['comment-owner']}>
          <Link to={`/@${user.username}`}>{user.name || <>&nbsp;</>}</Link>
          {user._id === creator.user._id ? (
            <span className={styles['creator-tag']}>
              <BsDot /> Creator
            </span>
          ) : collaborators.length > 0 &&
            collaborators.find((obj: any) => obj._id === user._id) ? (
            <span className={styles['creator-tag']}>
              <BsDot /> Collaborator
            </span>
          ) : (
            ''
          )}
        </span>

        <div className={styles['comment-content']}>
          <ShowMoreText
            text={text}
            lines={5}
            className={styles.comment}
            anchorClass={styles['more-text']}
            increment
          />

          <span className={styles['comment-options']}>
            <time className={styles['comment-time']}>{time.current}</time>

            <span
              className={styles['reply-text']}
              onClick={() =>
                setReply({
                  name: user.name,
                  receiver: undefined,
                  commentId,
                  setter: setReplies,
                  setExcludeArray,
                })
              }
            >
              Reply
            </span>

            {ownerLiked && (
              <span className={styles['owner-like-box']}>
                <img
                  className={styles['owner-like-img']}
                  src={getUrl(creator.user.photo, 'users')}
                />
                <IoMdHeart className={styles['owner-like-icon']} />
              </span>
            )}
          </span>
        </div>

        {replies.value.length > 0 ? (
          <div className={styles['sub-comments-container']} ref={subCommentRef}>
            {replies.value.map((reply) => (
              <CommentReply
                key={reply._id}
                data={reply}
                creator={creator}
                setReplies={setReplies}
                setComments={setComments}
                dataId={commentId}
                setReply={setReply}
                setExcludeArray={setExcludeArray}
              />
            ))}
          </div>
        ) : (
          <div ref={subCommentRef}></div>
        )}

        {replies.count > 0 ? (
          loading.replies ? (
            <div className={styles['loader-box']}>
              <LoadingAnimation
                style={{
                  width: '1.5rem',
                  height: '1.5rem',
                  transform: 'scale(2.5)',
                }}
              />
            </div>
          ) : (
            <span className={styles['other-replies-text']} onClick={getReplies}>
              View {replies.count} {replies.count === 1 ? 'reply' : 'replies'}
              <IoIosArrowDown className={styles['down-arrow-icon']} />
            </span>
          )
        ) : (
          ''
        )}
      </div>

      <div className={styles['comment-likes-box']}>
        {user._id === viewer._id ? (
          loading.delete ? (
            <LoadingAnimation
              style={{
                width: '1.5rem',
                height: '1.5rem',
                transform: 'scale(2.5)',
                marginBottom: '0.5rem',
              }}
            />
          ) : (
            <div
              className={`${styles['comment-menu-box']} ${
                showMenu ? styles['show-menu'] : ''
              }`}
            >
              <HiOutlineDotsHorizontal
                className={styles['comment-menu-icon']}
              />

              <span
                className={styles['comment-menu-item']}
                onClick={deleteComment}
              >
                <MdDelete className={styles['delete-comment-icon']} />
                Delete
              </span>
            </div>
          )
        ) : (
          <span className={styles['void-menu']}>&nbsp;</span>
        )}

        <FiHeart
          className={`${styles['comment-likes-icon']} ${
            like.value ? styles['red-icon'] : ''
          } ${loading.like ? styles['like-skeleton'] : ''}`}
          onClick={handleLike}
        />

        <span className={styles['comment-likes']}>{like.count}</span>
      </div>
    </article>
  );
};

export default CommentContent;
