import React, { useRef, useState, useContext } from 'react';
import styles from '../styles/SupportSettings.module.css';
import { MdDelete } from 'react-icons/md';
import { SettingsContext } from '../Contexts';
import { IoArrowBack } from 'react-icons/io5';
import { toast } from 'sonner';

type SupportSettingsProps = {
  category: string;
};

const SupportSettings = ({ category }: SupportSettingsProps) => {
  return (
    <>
      {category === 'info' ? (
        <TermsAndPolicies />
      ) : category === 'support' ? (
        <ReportProblem />
      ) : (
        ''
      )}
    </>
  );
};

const TermsAndPolicies = () => {
  const { setMainCategory } = useContext(SettingsContext);

  return (
    <section className={styles.section}>
      <h1 className={styles['section-head']}>
        <IoArrowBack
          className={styles['back-icon']}
          onClick={() => setMainCategory('')}
        />
        Terms and Policies
      </h1>

      <div className={styles.category}>
        <span className={styles['category-head']}>Terms of Service</span>
        <p className={styles['category-details']}>
          Welcome to Buzzer! By using our platform, you agree to abide by our
          terms and conditions. Failure to comply may result in account
          suspension or termination.
        </p>
        <ul className={styles['category-list']}>
          <li>You are responsible for any content you post.</li>
          <li>
            Hate speech, harassment, and illegal activities are prohibited.
          </li>
          <li>
            We reserve the right to modify or terminate accounts at our
            discretion.
          </li>
        </ul>
      </div>

      <div className={styles.category}>
        <span className={styles['category-head']}>Community Guidelines</span>
        <p className={styles['category-details']}>
          Our community thrives on respect and inclusivity. To ensure a positive
          experience for all users, please follow these guidelines:
        </p>
        <ul className={styles['category-list']}>
          <li>Be respectful and courteous to others.</li>
          <li>Avoid spamming or posting misleading content.</li>
          <li>Report any harmful or inappropriate content.</li>
          <li>Engage in constructive discussions and debates.</li>
        </ul>
      </div>

      <div className={styles.category}>
        <span className={styles['category-head']}>Privacy Policy</span>
        <p className={styles['category-details']}>
          Your privacy is important to us. We collect and use your data only as
          necessary to provide our services.
        </p>
        <ul className={styles['category-list']}>
          <li>
            We collect information such as name, email, and user activity.
          </li>
          <li>Your data is not sold to third parties.</li>
          <li>Cookies and analytics help improve user experience.</li>
          <li>You can request data deletion at any time.</li>
        </ul>
      </div>

      <div className={styles.category}>
        <span className={styles['category-head']}>Data Security</span>
        <p className={styles['category-details']}>
          We take appropriate measures to protect your personal information from
          unauthorized access, alteration, disclosure, or destruction.
        </p>
      </div>

      <div className={styles.category}>
        <span className={styles['category-head']}>User Responsibilities</span>
        <p className={styles['category-details']}>
          As a user of Buzzer, you agree to:
        </p>
        <ul className={styles['category-list']}>
          <li>
            Provide accurate and truthful information during registration.
          </li>
          <li>Not share your account credentials with others.</li>
          <li>Abide by local laws while using our platform.</li>
        </ul>
      </div>

      <div className={styles.category}>
        <span className={styles['category-head']}>
          Changes to These Policies
        </span>
        <p className={styles['category-details']}>
          We may update these terms and policies periodically. Any changes will
          be reflected on this page.
        </p>
      </div>
    </section>
  );
};

const ReportProblem = () => {
  const fileRef = useRef<HTMLInputElement>(null!);
  const [files, setFiles] = useState<File[]>([]);
  const [addFiles, setAddFiles] = useState<boolean>(false);
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState('');
  const [sending, setSending] = useState(false);

  const { setMainCategory } = useContext(SettingsContext);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const reportFiles = [...e.target.files];

      if (reportFiles.length + files.length > 5) {
        e.target.files = new DataTransfer().files;
        return alert('You can only add five files.');
      }

      const largeFile = reportFiles.find((file) => file.size > 1_048_576);
      if (largeFile) {
        e.target.files = new DataTransfer().files;
        return alert('Each file must not exceed 1MB in size.');
      }

      e.target.files = new DataTransfer().files;
      setFiles((prevFiles) => {
        if (addFiles) return [...prevFiles, ...reportFiles];
        else return reportFiles;
      });
      setAddFiles(true);
    }
  };

  const removeFile = (id: number) => () => {
    setFiles((prevFiles) => prevFiles.filter((_, index) => index !== id));

    if (files.length === 1) setAddFiles(false);
  };

  const getSize = (size: number): string => {
    if (size === 1_048_576) {
      return '1 MB';
    } else if (size > 1024) {
      return `${parseFloat((size / 1024).toFixed(2))} KB`;
    } else {
      return `${size} B`;
    }
  };

  const handleSubmit = () => {
    setSending(true);

    setTimeout(() => {
      setSending(false);
      setDescription('');
      setTopic('');
      setFiles([]);
      setAddFiles(false);

      return toast.success('Report submitted successfully!');
    }, 1000);
  };

  return (
    <section className={styles.section}>
      <h1 className={styles['section-head']}>
        <IoArrowBack
          className={styles['back-icon']}
          onClick={() => setMainCategory('')}
        />
        Report Problem
      </h1>

      <div className={styles.category}>
        <span className={styles['category-head']}>Problem Topic</span>

        <div className={styles['report-div']}>
          <input
            className={styles['topic-list']}
            list="topics"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Issue"
          />

          <datalist id="topics">
            <option value={'App crashes or freezes'} />
            <option value={'Login or authentication failures'} />
            <option value={'Account hacked or compromised'} />
            <option value={'Privacy settings not updating'} />
            <option value={'Reporting offensive or harmful content'} />
            <option value={'Spam or misleading posts'} />
            <option value={'Fake accounts or impersonation'} />
            <option value={'Direct messages not sending'} />
            <option value={'Issues with likes, comments, or shares'} />
            <option value={'Notifications not working'} />
          </datalist>
        </div>
      </div>

      <div className={styles.category}>
        <span className={styles['category-head']}>Description</span>

        <div className={styles['report-div']}>
          <textarea
            className={styles.description}
            placeholder="Briefly explain the issue you’re facing. Include what happened and when it occurred."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>

          <div className={styles['counter-box']}>
            <span>{description.length}</span>/<span>1000</span>
          </div>
        </div>
      </div>

      <div className={styles.category}>
        <span className={styles['category-head']}>Add Files</span>

        <div className={styles['report-div']}>
          <input
            className={styles['hide-file']}
            type="file"
            ref={fileRef}
            accept={'image/*'}
            onChange={handleFileUpload}
            multiple
          />

          {files.length > 0 && (
            <div className={styles['files-container']}>
              {files.map((file, index) => (
                <article
                  key={`${index} - ${Math.random()}`}
                  className={styles.file}
                >
                  <span className={styles['file-index']}>{index + 1}.</span>

                  <div className={styles['file-details']}>
                    <span className={styles['detail-box']}>
                      <span className={styles['detail-name']}>Filename:</span>
                      <span className={styles['detail-value']}>
                        {file.name}
                      </span>
                    </span>
                    <span className={styles['detail-box']}>
                      <span className={styles['detail-name']}>Test File:</span>
                      <span className={styles['detail-value']}>
                        {getSize(file.size)}
                      </span>
                    </span>
                  </div>

                  <MdDelete
                    className={styles['delete-icon']}
                    title="Delete"
                    onClick={removeFile(index)}
                  />
                </article>
              ))}
            </div>
          )}

          <div className={styles['btn-div']}>
            <button
              className={`${styles['file-btn']} ${
                files.length >= 5 ? styles['disable-btn'] : ''
              }`}
              onClick={() => fileRef.current.click()}
            >
              {addFiles ? 'Add Files' : 'Select files'}
            </button>
          </div>
        </div>
      </div>

      <div className={styles['btn-div2']}>
        <button
          className={`${styles['file-btn']} ${
            description.length > 1000 ||
            sending ||
            topic.length < 1 ||
            description.length < 1
              ? styles['disable-btn']
              : ''
          }`}
          onClick={handleSubmit}
        >
          Submit
        </button>
      </div>
    </section>
  );
};

export default SupportSettings;
