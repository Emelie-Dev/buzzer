import styles from '../styles/CommentContent.module.css';
import { FiHeart } from 'react-icons/fi';
import { MdDelete } from 'react-icons/md';
import { HiOutlineDotsHorizontal } from 'react-icons/hi';
import { getUrl, getTime, apiClient } from '../Utilities';
import ShowMoreText from './ShowMoreText';
import { useState, useContext, useEffect, useRef } from 'react';
import { AuthContext } from '../Contexts';
import LoadingAnimation from './LoadingAnimation';
import { toast } from 'sonner';
import { IoMdHeart, IoMdArrowDropright } from 'react-icons/io';

type CommentReply = {
  data: any;
  dataId: string;
  creator: any;
  setReplies: React.Dispatch<
    React.SetStateAction<{
      value: any[];
      count: number;
    }>
  >;
  setComments: any;
  setReply: React.Dispatch<any>;
  setExcludeArray: React.Dispatch<React.SetStateAction<string[]>>;
};

const CommentReply = ({
  data,
  creator,
  dataId,
  setReplies,
  setComments,
  setReply,
  setExcludeArray,
}: CommentReply) => {
  const {
    _id: commentId,
    user,
    hasStory,
    hasUnviewedStory,
    text,
    createdAt,
    likes,
    collectionName,
    documentId,
    likeObj,
    reply,
    receiver,
    ownerLiked,
    mentions,
  } = data;

  const { user: viewer } = useContext(AuthContext);
  const [loading, setLoading] = useState({ like: false, delete: false });
  const [like, setLike] = useState<{ value: any; count: number }>({
    value: likeObj,
    count: likes,
  });

  const time = useRef<string>(getTime(createdAt, true));

  useEffect(() => {
    setLike({ value: likeObj, count: likes });
  }, []);

  const handleLike = async () => {
    setLoading({ ...loading, like: true });

    try {
      if (!like.value) {
        const { data } = await apiClient.post('v1/likes', {
          collection: 'comment',
          documentId: commentId,
          data: { commentId: dataId },
        });

        setLike({ value: data.data.like, count: like.count + 1 });
      } else {
        await apiClient.delete(
          `v1/likes/content/${commentId}?id=${like.value._id}`
        );
        setLike({ value: null, count: like.count - 1 });
      }
    } catch (err: any) {
      if (!err.response) {
        toast.error(`Could not like comment. Please Try again.`);
      } else {
        toast.error(err.response.data.message);
      }
    } finally {
      setLoading({ ...loading, like: false });
    }
  };

  const deleteComment = async () => {
    setLoading({ ...loading, delete: true });

    // Get mentions

    try {
      await apiClient.delete(`v1/comments/${commentId}`, {
        data: { collection: collectionName, documentId, reply, mentions },
      });

      setReplies(({ value, count }) => ({
        value: value.filter((comment: any) => comment._id !== commentId),
        count,
      }));
      setComments((prevValue: any) => ({
        ...prevValue,
        totalCount: prevValue.totalCount - 1,
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

  return (
    <article className={styles['sub-comment-box']}>
      <a href={`/@${user.username}`}>
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
            className={styles['sub-comment-img']}
            src={getUrl(user.photo, 'users')}
          />
        </span>
      </a>

      <div className={styles['sub-comment-details']}>
        <span className={styles['comment-owner']}>
          <a href={`/@${user.username}`}>{user.name || <>&nbsp;</>}</a>
          {receiver && (
            <>
              <IoMdArrowDropright className={styles['arrow-icon']} />
              <a href={`/@${receiver.username}`}>
                {receiver.name || <>&nbsp;</>}
              </a>
            </>
          )}
        </span>

        <div className={styles['comment-content']}>
          <ShowMoreText
            lines={5}
            moreText="more"
            className={styles.comment}
            anchorClass={styles['more-text']}
            text={text}
          />

          <span className={styles['comment-options']}>
            <time className={styles['comment-time']}>{time.current}</time>

            <span
              className={styles['reply-text']}
              onClick={() =>
                setReply({
                  name: user.name,
                  receiver: user._id,
                  commentId: dataId,
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
      </div>

      <div className={styles['sub-comment-likes-box']}>
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
            <div className={styles['sub-comment-menu-box']}>
              <HiOutlineDotsHorizontal
                className={styles['sub-comment-menu-icon']}
              />

              <span
                className={styles['sub-comment-menu-item']}
                onClick={deleteComment}
              >
                <MdDelete className={styles['sub-delete-comment-icon']} />
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

export default CommentReply;
