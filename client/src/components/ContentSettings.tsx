import { useCallback, useEffect, useMemo, useState, useContext } from 'react';
import styles from '../styles/ContentSettings.module.css';
import Switch from './Switch';
import { Bar } from 'react-chartjs-2';
import { ChartEvent, ActiveElement } from 'chart.js';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
} from 'chart.js';
import { monthLabels } from '../Utilities';
import crosshairPlugin from 'chartjs-plugin-crosshair';
import { SettingsContext } from '../Contexts';
import { IoArrowBack } from 'react-icons/io5';

type ContentSettingsProps = {
  category: string;
};

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  crosshairPlugin
);

const ContentSettings = ({ category }: ContentSettingsProps) => {
  return (
    <>
      {category === 'notifications' ? (
        <Notifications />
      ) : category === 'management' ? (
        <TimeManagement />
      ) : (
        ''
      )}
    </>
  );
};

const Notifications = () => {
  const [pushNotifications, setPushNotifications] = useState<boolean>(false);
  const [emailNotifications, setEmailNotifications] = useState<boolean>(false);

  const { setMainCategory } = useContext(SettingsContext);

  const [interactions, setInteractions] = useState<{
    likes: boolean;
    comments: boolean;
    followers: boolean;
    mentions: boolean;
    views: boolean;
    messages: boolean;
  }>({
    likes: true,
    comments: true,
    followers: true,
    mentions: true,
    views: true,
    messages: true,
  });

  return (
    <section className={styles.section}>
      <h1 className={styles['section-head']}>
        <IoArrowBack
          className={styles['back-icon']}
          onClick={() => setMainCategory('')}
        />
        Notifications
      </h1>

      <div className={`${styles.category} ${styles['push-category']}`}>
        <span className={styles['category-head']}>Push notifications</span>

        <Switch value={pushNotifications} setter={setPushNotifications} />
      </div>

      <div className={`${styles.category} ${styles['push-category']}`}>
        <div className={styles['email-details']}>
          <span className={styles['category-head']}>Email notifications</span>
          <span className={styles['email-text']}>
            Allows you to receive essential notifications via email.
          </span>
        </div>

        <Switch value={emailNotifications} setter={setEmailNotifications} />
      </div>

      <div className={`${styles.category}`}>
        <span className={styles['category-head']}>Interactions</span>

        <div className={styles['interactions-container']}>
          <span className={styles['interaction-box']}>
            <span className={styles['interaction-name']}>Likes</span>
            <Switch
              value={interactions.likes}
              setter={setInteractions}
              type="likes"
              interactions={true}
            />
          </span>

          <span className={styles['interaction-box']}>
            <span className={styles['interaction-name']}>Comments</span>
            <Switch
              value={interactions.comments}
              setter={setInteractions}
              type="comments"
              interactions={true}
            />
          </span>

          <span className={styles['interaction-box']}>
            <span className={styles['interaction-name']}>New followers</span>
            <Switch
              value={interactions.followers}
              setter={setInteractions}
              type="followers"
              interactions={true}
            />
          </span>
          <span className={styles['interaction-box']}>
            <span className={styles['interaction-name']}>Mentions</span>
            <Switch
              value={interactions.mentions}
              setter={setInteractions}
              type="mentions"
              interactions={true}
            />
          </span>
          <span className={styles['interaction-box']}>
            <span className={styles['interaction-name']}>Profile views</span>
            <Switch
              value={interactions.views}
              setter={setInteractions}
              type="views"
              interactions={true}
            />
          </span>

          <span className={styles['interaction-box']}>
            <span className={styles['interaction-name']}>Messages</span>
            <Switch
              value={interactions.messages}
              setter={setInteractions}
              type="messages"
              interactions={true}
            />
          </span>
        </div>
      </div>
    </section>
  );
};

const TimeManagement = () => {
  const [dailyLimit, setDailyLimit] = useState<boolean>(false);
  const [scrollBreak, setScrollBreak] = useState<boolean>(false);
  const [dailyLimitValue, setDailyLimitValue] = useState<{
    value: number | 'custom';
    custom: number[];
    done: boolean;
  }>({
    value: 120,
    custom: [0, 0],
    done: false,
  });
  const [scrollBreakValue, setScrollBreakValue] = useState<{
    value: number | 'custom';
    custom: number;
    done: boolean;
  }>({
    value: 120,
    custom: 0,
    done: false,
  });
  const [sleepReminder, setSleepReminder] = useState<boolean>(false);
  const [inactiveDays, setInactiveDays] = useState<number[]>([]);
  const [yUnit, setYUnit] = useState<'min' | 'hr'>(null!);
  const [graphDate, setGraphDate] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  });

  const [graphSize, setGraphSize] = useState<{ width: number; height: number }>(
    { width: 650, height: 350 }
  );
  const [showGraph, setShowGraph] = useState<boolean>(true);
  const { setMainCategory } = useContext(SettingsContext);

  useEffect(() => {
    const currentDate = new Date();
    const previousDate = new Date(
      new Date().setDate(currentDate.getDate() - 6)
    );

    setGraphDate(() => ({
      start: `${
        monthLabels[currentDate.getMonth()]
      } ${currentDate.getDate()}, ${currentDate.getFullYear()}`,
      end: `${
        monthLabels[previousDate.getMonth()]
      } ${previousDate.getDate()}, ${previousDate.getFullYear()}`,
    }));

    const resizeHandler = () => {
      setShowGraph(false);

      if (window.matchMedia('(max-width: 900px)').matches) {
        setGraphSize({ width: 420, height: 280 });
      } else if (window.matchMedia('(max-width: 1000px)').matches) {
        setGraphSize({ width: 360, height: 250 });
      } else if (window.matchMedia('(max-width: 1100px)').matches) {
        setGraphSize({ width: 450, height: 300 });
      } else if (window.matchMedia('(max-width: 1200px)').matches) {
        setGraphSize({ width: 500, height: 300 });
      } else if (window.matchMedia('(max-width: 1300px)').matches) {
        setGraphSize({ width: 600, height: 350 });
      }

      setTimeout(() => {
        setShowGraph(true);
      }, 100);
    };

    resizeHandler();

    window.addEventListener('resize', resizeHandler);

    return () => {
      window.removeEventListener('resize', resizeHandler);
    };
  }, []);

  const days = [
    {
      name: 'Sunday',
      value: 'S',
    },
    {
      name: 'Monday',
      value: 'M',
    },
    {
      name: 'Tuesday',
      value: 'T',
    },
    {
      name: 'Wednesday',
      value: 'W',
    },
    {
      name: 'Thursday',
      value: 'T',
    },
    {
      name: 'Friday',
      value: 'F',
    },
    {
      name: 'Saturday',
      value: 'S',
    },
  ];

  const timeSpent = [30, 240, 270, 130, 480, 420, 60];

  const handleDays = (index: number) => () => {
    const active = inactiveDays.includes(index);

    if (active) {
      setInactiveDays((prevDays) => prevDays.filter((day) => day !== index));
    } else {
      setInactiveDays((prevDays) => [...prevDays, index]);
    }
  };

  const getReminderText = () => {
    if (inactiveDays.length === 0) {
      return 'everyday';
    } else if (inactiveDays.length === 6) {
      const day = days.filter((_, index) => !inactiveDays.includes(index))[0];
      return `on ${day.name}`;
    } else {
      const text = days
        .filter((_, index) => !inactiveDays.includes(index))
        .reduce((accumulator, value, index, arr) => {
          if (index === arr.length - 1) accumulator += `and ${value.name}`;
          else if (index === arr.length - 2) accumulator += `${value.name} `;
          else accumulator += `${value.name}, `;

          return accumulator;
        }, 'on ');

      return text;
    }
  };

  const getYLabel = useMemo(() => {
    const isHourPresent = timeSpent.find((value) => value > 60);

    const labels: { yAxis: number[]; barValue: string[] } = {
      yAxis: timeSpent,
      barValue: [],
    };

    if (isHourPresent) {
      setYUnit('hr');
      labels.yAxis = timeSpent.map((value) =>
        parseFloat((value / 60).toFixed(2))
      );
    } else setYUnit('min');

    labels.barValue = timeSpent.map((value) => {
      if (value < 60) {
        return `${value} min`;
      } else {
        const hour = Math.trunc(value / 60);
        const min = Math.floor(value - hour * 60);

        return `${hour}hr${min ? `  ${min} min` : ''}`;
      }
    });

    return labels;
  }, []);

  const getXLabel = useCallback((value: number) => {
    const date = new Date(
      new Date().setDate(new Date().getDate() - (6 - value))
    );

    return [monthLabels[date.getMonth()], String(date.getDate())];
  }, []);

  const lineData = {
    labels: getYLabel.barValue,
    datasets: [
      {
        data: getYLabel.yAxis,
        backgroundColor: `#a855f7`,
        borderColor: `#a855f7`,
        borderWidth: 1,
        barThickness: 15,
        borderRadius: 5,
      },
    ],
  };

  const lineOptions = {
    responsive: false,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          callback: (value: number | string) => getXLabel(Number(value)),
          color: 'gray',
          font: {
            size: 14,
          },
        },
      },
      y: {
        grid: { display: false },
        ticks: {
          callback: (value: number | string) => `${value} ${yUnit}`,
          color: 'gray',
          font: {
            size: 14,
          },
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      crosshair: {
        line: {
          color: 'transparent', // Crosshair line color
          width: 0, // Crosshair line width
        },
        sync: {
          enabled: false, // Disable syncing with other charts
        },
        zoom: {
          enabled: false, // Disable zooming with the crosshair
        },
        snap: {
          enabled: true, // Enable snapping to data points
        },
      },
    },
    onHover: (event: ChartEvent, chartElement: ActiveElement[]) => {
      if (event.native?.target instanceof HTMLElement) {
        event.native.target.style.cursor =
          chartElement.length > 0 ? 'pointer' : 'default';
      }
    },
  };

  return (
    <section className={styles.section}>
      <h1 className={styles['section-head']}>
        <IoArrowBack
          className={styles['back-icon']}
          onClick={() => setMainCategory('')}
        />
        Time Management
      </h1>

      <div className={styles['time-category']}>
        <div className={styles['time-category-box']}>
          <span className={styles['time-category-head']}>Daily Limit</span>

          <Switch value={dailyLimit} setter={setDailyLimit} />
        </div>

        <span className={styles['time-category-text']}>
          A daily time limit for how long you should spend on buzzer.
        </span>

        {dailyLimit && (
          <div className={styles['limit-select-box']}>
            <span className={styles['limit-select-text']}>Select Limit:</span>

            {!dailyLimitValue.done && dailyLimitValue.value === 'custom' ? (
              <div className={styles['custom-limit-box']}>
                <span className={styles['custom-hour-box']}>
                  <select
                    className={styles['custom-input']}
                    value={dailyLimitValue.custom[0]}
                    onChange={(e) =>
                      setDailyLimitValue({
                        ...dailyLimitValue,
                        custom: [
                          Number(e.target.value),
                          dailyLimitValue.custom[1],
                        ],
                      })
                    }
                  >
                    <option value={0}>0</option>
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                    <option value={5}>5</option>
                    <option value={6}>6</option>
                  </select>
                  <span className={styles['custom-input-value']}>hr</span>
                </span>

                <span className={styles['custom-min-box']}>
                  <select
                    className={styles['custom-input']}
                    value={dailyLimitValue.custom[1]}
                    onChange={(e) =>
                      setDailyLimitValue({
                        ...dailyLimitValue,
                        custom: [
                          dailyLimitValue.custom[0],
                          Number(e.target.value),
                        ],
                      })
                    }
                  >
                    <option value={0}>0</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={30}>30</option>
                    <option value={40}>40</option>
                    <option value={50}>50</option>
                  </select>
                  <span className={styles['custom-input-value']}>min</span>
                </span>

                <button
                  className={`${styles['custom-limit-btn']} ${
                    dailyLimitValue.value === 'custom'
                      ? dailyLimitValue.custom[0] === 0 &&
                        dailyLimitValue.custom[1] === 0
                        ? styles['disable-btn']
                        : ''
                      : ''
                  }`}
                  onClick={() =>
                    setDailyLimitValue({ ...dailyLimitValue, done: true })
                  }
                >
                  Done
                </button>
              </div>
            ) : (
              <div className={styles['limit-select-div']}>
                <select
                  className={styles['limit-select']}
                  value={dailyLimitValue.value}
                  onChange={(e) =>
                    setDailyLimitValue({
                      ...dailyLimitValue,
                      value:
                        e.target.value === 'custom'
                          ? 'custom'
                          : Number(e.target.value),
                      done: false,
                    })
                  }
                >
                  <option value={30}>30 mins</option>
                  <option value={60}>1 hr</option>
                  <option value={90}>1 hr 30 mins</option>
                  <option value={120}>2 hrs</option>
                  <option value={'custom'}>Custom limit</option>
                </select>

                {dailyLimitValue.done && (
                  <span className={styles['custom-limit']}>
                    {dailyLimitValue.custom[0]}hr {dailyLimitValue.custom[1]}min
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className={styles['time-category']}>
        <div className={styles['time-category-box']}>
          <span className={styles['time-category-head']}>Scroll Break</span>

          <Switch value={scrollBreak} setter={setScrollBreak} />
        </div>

        <span className={styles['time-category-text']}>
          Receive a reminder to take a break from Buzzer after extended screen
          time.
        </span>

        {scrollBreak && (
          <div className={styles['limit-select-box']}>
            <span className={styles['limit-select-text']}>Schedule break:</span>

            {!scrollBreakValue.done && scrollBreakValue.value === 'custom' ? (
              <div className={styles['custom-limit-box']}>
                <span className={styles['custom-min-box']}>
                  <select
                    className={styles['custom-input']}
                    value={scrollBreakValue.custom}
                    onChange={(e) =>
                      setScrollBreakValue({
                        ...scrollBreakValue,
                        custom: Number(e.target.value),
                      })
                    }
                  >
                    <option value={5}>5 mins</option>
                    <option value={10}>10 mins</option>
                    <option value={15}>15 mins</option>
                    <option value={20}>20 mins</option>
                    <option value={25}>25 mins</option>
                    <option value={30}>30 mins</option>
                    <option value={35}>35 mins</option>
                    <option value={40}>40 mins</option>
                    <option value={45}>45 mins</option>
                    <option value={50}>50 mins</option>
                    <option value={55}>55 mins</option>
                    <option value={60}>1hr</option>
                    <option value={90}>1hr 30mins</option>
                    <option value={120}>2hr</option>
                  </select>
                </span>

                <button
                  className={styles['custom-limit-btn']}
                  onClick={() =>
                    setScrollBreakValue({ ...scrollBreakValue, done: true })
                  }
                >
                  Done
                </button>
              </div>
            ) : (
              <div className={styles['limit-select-div']}>
                <select
                  className={styles['limit-select']}
                  value={scrollBreakValue.value}
                  onChange={(e) =>
                    setScrollBreakValue({
                      ...scrollBreakValue,
                      value:
                        e.target.value === 'custom'
                          ? 'custom'
                          : Number(e.target.value),
                      done: false,
                    })
                  }
                >
                  <option value={30}>10 mins</option>
                  <option value={60}>20 mins</option>
                  <option value={90}>30 mins</option>
                  <option value={120}>1 hr</option>
                  <option value={'custom'}>Custom time</option>
                </select>

                {scrollBreakValue.done && (
                  <span className={styles['custom-limit']}>
                    {scrollBreakValue.custom === 60
                      ? '1hr'
                      : scrollBreakValue.custom === 90
                      ? '1hr 30 mins'
                      : scrollBreakValue.custom === 120
                      ? '2hr'
                      : `${scrollBreakValue.custom} mins`}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className={styles['time-category']}>
        <div className={styles['time-category-box']}>
          <span className={styles['time-category-head']}>Sleep Reminders</span>

          <Switch value={sleepReminder} setter={setSleepReminder} />
        </div>

        <span className={styles['time-category-text']}>
          Receive reminders every hour when it's bedtime.
        </span>

        {sleepReminder && (
          <div className={styles['reminder-box']}>
            <div className={styles['reminder-div']}>
              <span className={styles['time-box']}>
                <span className={styles['time-box-text']}>Start time:</span>
                <select className={styles['time-input']}>
                  <option value={19}>19:00</option>
                  <option value={20}>20:00</option>
                  <option value={21}>21:00</option>
                  <option value={22}>22:00</option>
                </select>
              </span>

              <span className={styles['time-box2']}>
                <span className={styles['time-box-text']}>End time:</span>
                <select className={styles['time-input']}>
                  <option value={4}>04:00</option>
                  <option value={5}>05:00</option>
                  <option value={6}>06:00</option>
                  <option value={7}>07:00</option>
                </select>
              </span>
            </div>

            <div className={styles['choose-days-box']}>
              <span className={styles['choose-days-text']}>Choose days</span>

              <div className={styles['days-box']}>
                {days.map((value, index) => (
                  <span
                    key={index}
                    className={`${styles['choose-days']} ${
                      inactiveDays.includes(index) ? styles['active-days'] : ''
                    }`}
                    onClick={handleDays(index)}
                  >
                    {value.value}
                  </span>
                ))}
              </div>

              <span className={styles['reminders-text']}>
                {inactiveDays.length === 7
                  ? 'Sleep reminders are inactive'
                  : `Sleep reminders are enabled ${getReminderText()}`}
                .
              </span>
            </div>
          </div>
        )}
      </div>

      <div className={styles['time-category']}>
        <div className={styles['time-category-box']}>
          <span className={styles['time-category-head']}>Summary</span>
        </div>

        <span className={styles['time-category-text']}>
          Analysis of your daily Buzzer usage over the past week.
        </span>

        <div className={styles['graph-div']}>
          <span className={styles['graph-head']}>
            {graphDate.end} - {graphDate.start}
          </span>
        </div>

        <div className={styles.graph}>
          {showGraph && (
            <Bar
              data={lineData}
              options={lineOptions}
              width={graphSize.width}
              height={graphSize.height}
            />
          )}
        </div>

        <div className={styles['graph-time-div']}>
          <span className={styles['graph-time-box']}>
            <span className={styles['graph-time-label']}>Total time:</span>
            <span className={styles['graph-time']}>14hr 32min</span>
          </span>

          <span className={styles['graph-time-box2']}>
            <span className={styles['graph-time-label']}>Average time:</span>
            <span className={styles['graph-time']}>4hr 14min</span>
          </span>
        </div>
      </div>
    </section>
  );
};

export default ContentSettings;
