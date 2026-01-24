import styles from '../styles/Notifications.module.css';
import { CiHeart } from 'react-icons/ci';
import { BsReply } from 'react-icons/bs';
import { useContext, useState } from 'react';
import { IoMdHeart } from 'react-icons/io';
import useArrayRef from '../hooks/useArrayRef';
import { apiClient, getUrl, parseHTML } from '../Utilities';
import { MdSecurity, MdNotificationsActive } from 'react-icons/md';
import { GrSecure } from 'react-icons/gr';
import { Link, useNavigate } from 'react-router-dom';
import { MdOutlineSettings } from 'react-icons/md';
import { toast } from 'sonner';
import { RiUserFollowLine, RiUserUnfollowLine } from 'react-icons/ri';
import { GeneralContext, NotificationContext } from '../Contexts';

type NotificationBoxProps = {
  checkBoxRef: React.MutableRefObject<HTMLInputElement[]>;
  data: any;
};

const NotificationBox = ({ checkBoxRef, data }: NotificationBoxProps) => {
  const {
    _id: notificationId,
    createdAt,
    type,
    secondUser,
    data: notificationData = {},
    post,
    documentId,
  } = data;
  const [notificationType, typeName, typeDetails] = type;

  const {
    likes,
    setLikes,
    followingList,
    setFollowingList,
    deleteData,
    setDeleteData,
  } = useContext(NotificationContext);
  const { setSettingsCategory } = useContext(GeneralContext);

  const [loading, setLoading] = useState<boolean>(false);
  const inputRef = useArrayRef(checkBoxRef);

  const navigate = useNavigate();

  const isLiked = () => {
    const collection =
      notificationType === 'comment' || notificationType === 'reply'
        ? 'comment'
        : typeName;
    const docId = notificationData?.commentId || documentId;

    return likes[collection as 'content' | 'reel' | 'story' | 'comment'].find(
      (data) => data.value === docId,
    );
  };

  const isFollowing = (() => {
    return followingList.find((data: any) => data.value === secondUser?._id);
  })();

  const getTime = () => {
    const time = new Date(createdAt);
    const hour = time.getHours();
    const minute = time.getMinutes();

    const suffix = hour < 12 ? 'AM' : 'PM';
    const hourText =
      hour === 0
        ? '12'
        : hour > 12
          ? `${String(hour - 12).padStart(2, '0')}`
          : `${String(hour).padStart(2, '0')}`;

    return `${hourText}:${String(minute).padStart(2, '0')} ${suffix}`;
  };

  const getImage = () => {
    if (secondUser) {
      return (
        <img
          className={styles['notification-img']}
          src={getUrl(secondUser.photo, 'users')}
        />
      );
    } else {
      if (notificationType === 'security') {
        if (typeName === 'login') {
          return (
            <span className={styles['notification-logo-box']}>
              <MdSecurity className={styles['notification-logo']} />
            </span>
          );
        } else {
          return (
            <span className={styles['notification-logo-box']}>
              <GrSecure className={styles['notification-logo']} />
            </span>
          );
        }
      } else {
        return (
          <span className={styles['notification-logo-box']}>
            <MdNotificationsActive className={styles['notification-logo']} />
          </span>
        );
      }
    }
  };

  const getMessage = () => {
    if (
      notificationType === 'like' ||
      notificationType === 'comment' ||
      notificationType === 'reply'
    ) {
      const text =
        notificationType === 'like'
          ? 'liked your'
          : notificationType === 'comment'
            ? 'commented on your'
            : 'replied to your comment on this';

      if (typeDetails === 'batch') {
        return (
          <span className={styles['notification-message']}>
            <Link
              to={`/@${secondUser.username}`}
              className={styles['notification-name']}
            >
              {secondUser.name}
            </Link>{' '}
            and {notificationData.batchCount} others {text} {typeName}
          </span>
        );
      } else {
        return (
          <span className={styles['notification-message']}>
            <Link
              to={`/@${secondUser.username}`}
              className={styles['notification-name']}
            >
              {secondUser.name}
            </Link>{' '}
            {text} {typeName}
            {notificationType !== 'like' && notificationData && (
              <span className={styles['notification-comment']}>
                : {parseHTML(notificationData.text)}
              </span>
            )}
          </span>
        );
      }
    } else if (notificationType === 'mention') {
      if (typeDetails === 'batch') {
        return (
          <span className={styles['notification-message']}>
            <Link
              to={`/@${secondUser.username}`}
              className={styles['notification-name']}
            >
              {secondUser.name}
            </Link>{' '}
            and {notificationData.batchCount} others mentioned you.
          </span>
        );
      } else {
        return (
          <span className={styles['notification-message']}>
            <Link
              to={`/@${secondUser.username}`}
              className={styles['notification-name']}
            >
              {secondUser.name}
            </Link>{' '}
            mentioned you in {typeName === 'comment' ? 'a' : 'their'} {typeName}
            {notificationData && (
              <span className={styles['notification-comment']}>
                : {parseHTML(notificationData.text)}
              </span>
            )}
          </span>
        );
      }
    } else if (notificationType === 'follow') {
      if (typeName === 'batch') {
        return (
          <span className={styles['notification-message']}>
            <Link
              to={`/@${secondUser.username}`}
              className={styles['notification-name']}
            >
              {secondUser.name}
            </Link>{' '}
            and {notificationData.batchCount} others started following you.
          </span>
        );
      } else {
        return (
          <span className={styles['notification-message']}>
            <Link
              to={`/@${secondUser.username}`}
              className={styles['notification-name']}
            >
              {secondUser.name}
            </Link>{' '}
            started following you.
          </span>
        );
      }
    } else if (notificationType === 'friend_request') {
      return (
        <span className={styles['notification-message']}>
          <Link
            to={`/@${secondUser.username}`}
            className={styles['notification-name']}
          >
            {secondUser.name}
          </Link>{' '}
          {typeName === 'accept' ? 'accepted' : 'declined'} your friend request.
        </span>
      );
    } else if (notificationType === 'collaborate') {
      return (
        <span className={styles['notification-message']}>
          <Link
            to={`/@${secondUser.username}`}
            className={styles['notification-name']}
          >
            {secondUser.name}
          </Link>{' '}
          {typeDetails === 'accept' ? 'accepted' : 'declined'} your
          collaboration request on this {typeName}.
        </span>
      );
    } else if (notificationType === 'security') {
      if (typeName === 'login') {
        if (typeDetails === 'new') {
          return (
            <span className={styles['notification-message']}>
              A new login was detected from{' '}
              <span className={styles['bold-text']}>
                {notificationData.deviceName}
              </span>{' '}
              in{' '}
              <span className={styles['bold-text']}>
                {notificationData.city}, {notificationData.country}
              </span>
              . If this wasn’t you, please secure your account immediately.
            </span>
          );
        } else if (typeDetails === 'multiple') {
          return (
            <span className={styles['notification-message']}>
              Your account is currently logged in on multiple{' '}
              <span className={styles['bold-text']}>
                ({notificationData.count})
              </span>{' '}
              devices. If this seems unusual, please review and manage your
              devices in Settings.
            </span>
          );
        } else if (typeDetails === 'failed') {
          return (
            <span className={styles['notification-message']}>
              We detected several failed login attempts from
              <span className={styles['bold-text']}>
                {notificationData.deviceName}
              </span>{' '}
              in{' '}
              <span className={styles['bold-text']}>
                {notificationData.city}, {notificationData.country}
              </span>
              . If this wasn’t you, please check your security and review your
              devices in Settings.
            </span>
          );
        }
      } else if (typeName === 'password') {
        return (
          <span className={styles['notification-message']}>
            Your password was recently changed. If this wasn’t you, secure your
            account immediately.
          </span>
        );
      }
    }

    return <span className={styles['notification-message']}></span>;
  };

  const getAction = () => {
    if (typeDetails !== 'batch') {
      if (
        notificationType === 'comment' ||
        notificationType === 'reply' ||
        notificationType === 'mention'
      ) {
        return (
          <span className={styles['notification-btn-box']}>
            <button className={styles['notification-btn']}>
              <BsReply className={styles['notification-btn-icon']} />
              {notificationType === 'mention' && typeName !== 'comment'
                ? 'Comment'
                : 'Reply'}
            </button>
            <button className={styles['notification-btn']} onClick={handleLike}>
              {isLiked() ? (
                <IoMdHeart className={styles['like-icon']} />
              ) : (
                <CiHeart className={styles['notification-btn-icon']} />
              )}
              Like
            </button>
          </span>
        );
      } else if (notificationType === 'follow') {
        if (!isFollowing) {
          return (
            <span className={styles['notification-btn-box']}>
              <button
                className={styles['notification-btn']}
                onClick={handleFollow}
              >
                {isFollowing ? (
                  <>
                    <RiUserUnfollowLine
                      className={styles['notification-btn-icon']}
                    />{' '}
                    Unfollow
                  </>
                ) : (
                  <>
                    <RiUserFollowLine
                      className={styles['notification-btn-icon']}
                    />{' '}
                    Follow
                  </>
                )}
              </button>
            </span>
          );
        }
      } else if (notificationType === 'friend_request') {
        if (typeName === 'accept' && !isFollowing) {
          return (
            <span className={styles['notification-btn-box']}>
              <button
                className={styles['notification-btn']}
                onClick={handleFollow}
              >
                {isFollowing ? (
                  <>
                    <RiUserUnfollowLine
                      className={styles['notification-btn-icon']}
                    />{' '}
                    Unfollow
                  </>
                ) : (
                  <>
                    <RiUserFollowLine
                      className={styles['notification-btn-icon']}
                    />{' '}
                    Follow
                  </>
                )}
              </button>
            </span>
          );
        }
      } else if (notificationType === 'collaborate') {
        if (typeDetails === 'accept' && !isFollowing) {
          return (
            <span className={styles['notification-btn-box']}>
              <button
                className={styles['notification-btn']}
                onClick={handleFollow}
              >
                {isFollowing ? (
                  <>
                    <RiUserUnfollowLine
                      className={styles['notification-btn-icon']}
                    />{' '}
                    Unfollow
                  </>
                ) : (
                  <>
                    <RiUserFollowLine
                      className={styles['notification-btn-icon']}
                    />{' '}
                    Follow
                  </>
                )}
              </button>
            </span>
          );
        }
      } else if (notificationType === 'security') {
        if (typeName === 'login') {
          return (
            <span className={styles['notification-btn-box']}>
              <button
                className={styles['notification-btn']}
                onClick={() => {
                  setSettingsCategory('devices');
                  navigate('/settings');
                }}
              >
                <MdOutlineSettings
                  className={styles['notification-btn-icon']}
                />
                Manage Devices
              </button>
            </span>
          );
        } else if (typeName === 'password') {
          return (
            <span className={styles['notification-btn-box']}>
              <button
                className={styles['notification-btn']}
                onClick={() => {
                  setSettingsCategory('alerts');
                  navigate('/settings');
                }}
              >
                <MdOutlineSettings
                  className={styles['notification-btn-icon']}
                />
                Settings
              </button>
            </span>
          );
        }
      }
    }

    return <span className={styles['notification-btn-box']}></span>;
  };

  const getContent = () => {
    if (post) {
      if (
        notificationType === 'comment' ||
        notificationType === 'reply' ||
        notificationType === 'like' ||
        notificationType === 'mention' ||
        notificationType === 'collaborate'
      ) {
        const collection = notificationData.collection || typeName;

        return (
          <div className={styles['content-box']}>
            {post.type === 'video' ? (
              <video className={styles['notification-content']}>
                <source
                  src={getUrl(post.src, `${collection}s`)}
                  type="video/mp4"
                />
                Your browser does not support playing video.
              </video>
            ) : (
              <img
                className={styles['notification-content']}
                src={getUrl(post.src, `${collection}s`)}
              />
            )}
          </div>
        );
      }
    }

    return <div className={styles['content-box']}></div>;
  };

  const navigateUser = () => {};

  const handleLike = async () => {
    if (loading) return;
    setLoading(true);

    const collection =
      notificationType === 'comment' || notificationType === 'reply'
        ? 'comment'
        : (typeName as 'content' | 'reel' | 'story' | 'comment');
    const docId = notificationData?.commentId || documentId;

    const isDocLiked = isLiked();

    try {
      if (!isDocLiked) {
        const { data } = await apiClient.post('v1/likes', {
          collection,
          documentId: docId,
        });

        setLikes((prev) => {
          const arr = prev[collection];
          arr.push({ value: docId, obj: data.data.like });

          return { ...prev, [collection]: arr };
        });
      } else {
        const like = likes[collection].find((data) => data.value === docId);

        await apiClient.delete(
          `v1/likes/${collection}/${docId}?id=${like?.obj._id}`,
        );

        setLikes((prev) => {
          let arr = prev[collection];
          arr = arr.filter((data) => data.value !== docId);

          return { ...prev, [collection]: arr };
        });
      }
    } catch {
      toast.error(
        `Could not ${
          !isDocLiked ? 'remove like' : `like ${collection}`
        }. Please Try again.`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (loading) return;
    setLoading(true);

    try {
      if (!isFollowing) {
        const { data } = await apiClient.post(`v1/follow/${secondUser._id}`);

        const follow = { value: secondUser._id, obj: data.data.follow };

        setFollowingList((prev) => [...prev, follow]);
      } else {
        const follow = followingList.find(
          (data) => data.value === secondUser._id,
        );

        await apiClient.delete(`v1/follow/${follow.obj._id}`);

        setFollowingList((prev) =>
          prev.filter((data) => data.value !== secondUser._id),
        );
      }
    } catch (err: any) {
      if (!err.response) {
        toast.error(
          `Could not ${
            isFollowing ? 'unfollow' : 'follow'
          } user. Please Try again.`,
        );
      } else {
        toast.error(err.response.data.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCheckBox = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;

    const list = new Set(deleteData.list);

    if (checked) list.add(notificationId);
    else list.delete(notificationId);

    setDeleteData((prev) => ({ ...prev, list }));
  };

  return (
    <article className={styles['notification-box']} onClick={navigateUser}>
      {getImage()}

      <div className={styles['notification-details']}>
        {getMessage()}

        {getAction()}

        <time className={styles['notification-time']}>{getTime()}</time>
      </div>

      {getContent()}

      <input
        type="checkbox"
        className={`${styles['notification-checkbox']} ${
          deleteData.list.size > 0 ? styles['show-checkbox'] : ''
        }`}
        ref={inputRef}
        checked={deleteData.list.has(notificationId)}
        onChange={handleCheckBox}
      />
    </article>
  );
};
export default NotificationBox;
