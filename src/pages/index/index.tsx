import { useEffect, useRef, useState } from 'react';
import styles from './index.module.less';
import * as PIXI from 'pixi.js';
import { Modal, Select, Spin, Switch } from 'antd';
import {
  getGameTop,
  digital,
  getGameTopV2,
  getGameTodayHistory,
} from '@/api/api';
import { getRandomName, randomAccess, createHash, encrypt } from '../../utils';
import { Icon } from '@iconify-icon/react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { RATE } from '@/App';
import { useTodayHistory } from './hooks/useTodayHistory';
import dayjs from 'dayjs';

interface UserInfo {
  userId: string;
  nickname: string;
}
interface TopListItem {
  userId: string;
  id: string;
  nickName: string;
  score: number;
  createdAt: string;
}

interface UniqueTopListItemUserItem {
  createdAt: string;
  nickName: string;
  userId: string;
}

interface UniqueTopListItem {
  id: number;
  count: number;
  users: UniqueTopListItemUserItem[];
}

const defaultList = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, null],
];

const optionsList = [
  { value: '3X3', label: '3X3' },
  { value: '2X3', label: '2X3' },
  { value: '4X4', label: '4X4' },
  { value: '5X5', label: '5X5' },
  { value: '6X6', label: '6X6' },
  { value: '7X7', label: '7X7' },
  { value: '8X6', label: '8X6' },
  { value: '8X8', label: '8X8' },
  { value: '9X9', label: '9X9' },
  { value: '10X10', label: '10X10' },
  { value: '12X12', label: '12X12' },
];

console.log('rate', RATE, 600 * RATE);
const stageWidth = 600 * RATE;
const stageHeight = 600 * RATE;

const Index = () => {
  const [app, setApp] = useState<PIXI.Application<PIXI.ICanvas>>();
  const preLayoutNumbers = useRef<Array<Array<number | null>>>(
    JSON.parse(JSON.stringify(defaultList))
  );
  const layoutNumbers = useRef<Array<Array<number | null>>>(
    JSON.parse(JSON.stringify(defaultList))
  );
  const [isWin, setIsWin] = useState(false);
  const [step, setStep] = useState(0);
  const [time, setTime] = useState(0);
  // 游戏停止
  const [isStop, setIsStop] = useState(false);
  const [selectOption, setSelectOption] = useState(
    localStorage.getItem('selectedOption') || optionsList[0].value
  );
  const [userInfo, setUserInfo] = useState<UserInfo>({
    userId: '',
    nickname: '',
  });
  const [topList, setTopList] = useState<TopListItem[]>([]);
  const [uniqueTopList, setUniqueTopList] = useState<UniqueTopListItem[]>([]); // 去重
  const [loading, setLoading] = useState(false);
  const timerInterval = useRef<NodeJS.Timer>();
  const stepRef = useRef(0);
  const [switchOpen, setSwitchOpen] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);

  const { historyList, getTodayHistoryList } = useTodayHistory();

  useEffect(() => {
    getNickname();
    randomLayout();
    let _app = new PIXI.Application({
      width: stageWidth,
      height: stageHeight,
      antialias: true,
      resolution: 1,
      view: document.getElementById('mainCanvas') as HTMLCanvasElement,
    });
    setApp(_app);
    timeClock();
    return () => {
      timerInterval.current && clearInterval(timerInterval.current);
    };
  }, []);

  useEffect(() => {
    console.log('switchOpen', switchOpen);
    getGameTopHandler();
    getTodayHistoryList();
  }, [selectOption, switchOpen]);

  /**
   * 获取游戏top榜
   * @returns
   */
  const getGameTopHandler = async () => {
    if (switchOpen) {
      setLoading(true);
      const res: any = await getGameTopV2({
        gameName: 'digitalHuarongRoad',
        subName: selectOption,
      });
      setLoading(false);
      if (!res.success) {
        return;
      }
      setUniqueTopList(res.data?.result || []);
    } else {
      setLoading(true);
      const res: any = await getGameTop({
        gameName: 'digitalHuarongRoad',
        subName: selectOption,
      });
      setLoading(false);
      if (!res.success) {
        return;
      }
      setTopList(
        res.data?.result?.map((item: any) => {
          return { ...item, id: item._id };
        }) || []
      );
    }
  };

  const getUserId = async () => {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    return result.visitorId;
  };

  /**
   * 获取用户名
   */
  const getNickname = async () => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    if (userInfo.userId && userInfo.nickname) {
      setUserInfo(userInfo);
    } else {
      const userId = await getUserId();
      const userInfo = {
        nickname: getRandomName(randomAccess(2, 6)),
        userId,
      };
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
      setUserInfo(userInfo);
    }
  };

  /**
   * 创建方格容器
   */
  const createItem = () => {
    const rows = layoutNumbers.current.length;
    const columns = layoutNumbers.current[0].length;
    const itemWidth = stageWidth / columns;
    const itemHeight = stageWidth / rows;

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < columns; j++) {
        createRect({
          x: j * itemWidth,
          y: i * itemHeight,
          w: itemWidth,
          h: itemHeight,
          text: layoutNumbers.current[i][j],
        });
      }
    }
  };

  useEffect(() => {
    if (!app) {
      return;
    }
    reLayout();
    createItem();
  }, [app]);

  useEffect(() => {
    (async () => {
      if (isWin) {
        setIsStop(true);
        timerInterval.current && clearInterval(timerInterval.current);
        const userId = await getUserId();
        digital({
          gameName: 'digitalHuarongRoad',
          subName: selectOption,
          score: encrypt(stepRef.current.toString()),
          userId,
          nickName: userInfo.nickname,
          data: encrypt(JSON.stringify({ time, referrer: document.referrer })),
        }).then((res: any) => {
          if (!res.success) {
            return;
          }
          getGameTopHandler();
          getTodayHistoryList();
        });
      }
    })();
  }, [isWin]);

  /**
   * 重置数据
   */
  const reStart = () => {
    if (app) {
      app.stage.removeChildren();
    }
    setIsStop(false);
    setStep(0);
    setTime(0);
    randomLayout();
    timeClock();
  };

  useEffect(() => {
    if (!app) {
      return;
    }
    reLayout();
    reStart();
    createItem();
  }, [selectOption]);

  /**
   * 按照当前的选择模式初始化数据
   */
  const reLayout = () => {
    if (!optionsList.some((item) => item.value === selectOption)) {
      setSelectOption(optionsList[0].value);
      localStorage.setItem('selectedOption', optionsList[0].value);
      return;
    }
    const rows1 = Number(selectOption.split('X')[0]);
    const columns1 = Number(selectOption.split('X')[1]);
    console.log(11111, rows1, columns1);
    const arr = [];
    for (let i = 0; i < rows1; i++) {
      let tempArr = [];
      for (let j = 0; j < columns1; j++) {
        if (j === columns1 - 1 && i === rows1 - 1) {
          tempArr.push(null);
        } else {
          tempArr.push(i * columns1 + j + 1);
        }
      }
      arr.push(tempArr);
    }
    preLayoutNumbers.current = arr;
    layoutNumbers.current = arr;
  };

  /**
   * 计时器
   */
  const timeClock = () => {
    timerInterval.current && clearInterval(timerInterval.current);
    timerInterval.current = setInterval(() => {
      setTime((value) => value + 10);
    }, 10);
  };

  /**
   * 方格点击事件
   * @param param0
   */
  const containerDown = ({
    pixiContainer,
    text,
  }: {
    pixiContainer: PIXI.Container<PIXI.DisplayObject>;
    text: number | null;
  }) => {
    pixiContainer.on('pointerdown', () => {
      const rows = layoutNumbers.current.length;
      const columns = layoutNumbers.current[0].length;
      const arr = layoutNumbers.current.flat();
      const index = arr.indexOf(text);
      let newIndex = index;
      let direction: string | null = null;
      if (arr[index - 1] === null) {
        if (index % columns !== 0) {
          direction = 'left';
          newIndex = index - 1;
        }
      } else if (arr[index + 1] === null) {
        if (index % columns !== columns - 1) {
          direction = 'right';
          newIndex = index + 1;
        }
      } else if (arr[index + columns] === null) {
        direction = 'bottom';
        newIndex = index + columns;
      } else if (arr[index - columns] === null) {
        direction = 'top';
        newIndex = index - columns;
      }

      if (direction) {
        // 格子进行移动
        const itemWidth = stageWidth / columns;
        const itemHeight = stageWidth / rows;
        if (direction === 'left') {
          pixiContainer.x -= itemWidth;
        } else if (direction === 'right') {
          pixiContainer.x += itemWidth;
        } else if (direction === 'top') {
          pixiContainer.y -= itemHeight;
        } else if (direction === 'bottom') {
          pixiContainer.y += itemHeight;
        }

        // 移动后的布局数据更新
        arr[newIndex] = arr[index];
        arr[index] = null;
        let newArr = [];
        for (let i = 0; i < rows; i++) {
          let tempArr = [];
          for (let j = 0; j < columns; j++) {
            tempArr.push(arr[i * columns + j]);
          }
          newArr.push(tempArr);
        }
        layoutNumbers.current = newArr;
        setIsWin(
          preLayoutNumbers.current.flat().join() ===
            layoutNumbers.current.flat().join()
        );
        setStep((step) => {
          stepRef.current = step + 1;
          return step + 1;
        });
      }
    });
  };

  /**
   * 随机布局
   */
  const randomLayout = () => {
    const rows = layoutNumbers.current.length;
    const columns = layoutNumbers.current[0].length;
    let arr = layoutNumbers.current.flat();
    let randomSteps = Math.floor(
      Math.random() * arr.length * 2 + arr.length * 5
    );
    let directionArr = ['left', 'right', 'top', 'bottom'];
    for (let i = 0; i < randomSteps; i++) {
      const index = arr.indexOf(null);
      const direction =
        directionArr[Math.floor(Math.random() * directionArr.length)];

      if (direction === 'left' && index % columns !== 0) {
        arr[index] = arr[index - 1];
        arr[index - 1] = null;
      } else if (direction === 'right' && index % columns !== columns - 1) {
        arr[index] = arr[index + 1];
        arr[index + 1] = null;
      } else if (direction === 'top' && Math.floor(index / columns) !== 0) {
        arr[index] = arr[index - columns];
        arr[index - columns] = null;
      } else if (
        direction === 'bottom' &&
        Math.floor(index / columns) !== rows - 1
      ) {
        arr[index] = arr[index + columns];
        arr[index + columns] = null;
      }
    }
    let newLayoutArr = [];
    for (let i = 0; i < rows; i++) {
      let tempArr = [];
      for (let j = 0; j < columns; j++) {
        tempArr.push(arr[i * columns + j]);
      }
      newLayoutArr.push(tempArr);
    }

    layoutNumbers.current = newLayoutArr;
  };

  const createRect = ({
    x,
    y,
    w,
    h,
    text,
  }: {
    x: number;
    y: number;
    w: number;
    h: number;
    text: number | null;
  }) => {
    if (!text) {
      return;
    }

    const pixiContainer = new PIXI.Container();
    pixiContainer.width = w;
    pixiContainer.height = h;
    pixiContainer.cursor = 'pointer';
    pixiContainer.isSprite = true;
    pixiContainer.interactive = true;
    pixiContainer.filters = [new PIXI.filters.NoiseFilter(0.3, 0.6)];

    const numberRect = new PIXI.Graphics();
    numberRect.lineStyle(2, 0x000000, 1); //边线(宽度，颜色，透明度)
    numberRect.beginFill(0x1099bb); //填充
    numberRect.drawRect(x, y, w, h); //x,y,w,h
    numberRect.endFill();
    // numberRect.filters = [new PIXI.filters.NoiseFilter(0.3, 0.6)];

    let pixiText = new PIXI.Text(`${text || ''}`, {
      fontFamily: 'ZpixLocal',
      fontSize: Math.floor(
        RATE * (Number(selectOption.split('X')[0]) > 6 ? 28 : 36)
      ),
      stroke: '#4a1850',
      fontWeight: 'bold',
      fill: ['#ffffff', '#00ff99'],
      align: 'center',
      lineJoin: 'round',
      dropShadow: true,
      dropShadowColor: '#000000',
      dropShadowBlur: 4,
    });
    pixiText.x = x + w / 2 - pixiText.width / 2;
    pixiText.y = y + h / 2 - pixiText.height / 2;
    pixiContainer.addChild(numberRect);
    pixiContainer.addChild(pixiText);
    app!.stage.addChild(pixiContainer); //添加到舞台中

    containerDown({ pixiContainer, text });

    return pixiContainer;
  };

  const selectChange = (value: string) => {
    localStorage.setItem('selectedOption', value);
    setSelectOption(value);
  };

  const changeNickname = () => {
    localStorage.removeItem('userInfo');
    getNickname();
  };

  useEffect(() => {
    messageRef.current?.scrollBy(0, messageRef.current?.scrollHeight || 0);
  }, [historyList]);

  return (
    <div className={styles.indexMain}>
      <div className={styles.indexBox}>
        <div className={styles.headerBox}>
          <h1 className={styles.gameTitle}>数字华容道</h1>
          <div className={styles.iconBox}>
            <Icon
              icon="mdi:github"
              className={styles.githubIcon}
              onClick={() => {
                window.open(
                  'https://github.com/dearDreamWeb/digital-huarong-road'
                );
              }}
            ></Icon>
            <span className={styles.iconText}>喜欢的话请给个start</span>
          </div>
        </div>
        <div className={styles.username}>
          你好哇！<span>{userInfo.nickname || ''}</span>
          <span onClick={changeNickname}>更换昵称</span>
        </div>
        <div
          className={styles.dataDisplay}
          style={{ width: `${stageWidth}px` }}
        >
          <div>
            步数:<span>{step}</span>
          </div>
          <div>
            时间:<span>{(time / 1000).toFixed(2)}</span>秒
          </div>
          <div>
            <Select
              style={{ width: 120 }}
              value={selectOption}
              onChange={selectChange}
              options={optionsList}
            ></Select>
          </div>
        </div>
        <div className={styles.stageBox} style={{ height: `${stageHeight}px` }}>
          <div className={styles.leaderMessageBox} ref={messageRef}>
            <div className={styles.leaderMessageTitle}>播报</div>
            <div className={styles.messageListBox}>
              {historyList.map((item: any) => (
                <div key={item.id} className={styles.messageListItem}>
                  <div className={styles.messageListItemTime}>
                    {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                  </div>
                  <div className={styles.messageListItemText}>
                    玩家
                    <span className={styles.messageListItemNickName}>
                      {item.nickName}
                    </span>
                    通关
                    <span className={styles.messageListItemSubType}>
                      {item.subType}
                    </span>
                    ，成绩：
                    <span className={styles.messageListItemScore}>
                      {item.score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <canvas id="mainCanvas"></canvas>
          {isStop && (
            <div className={styles.stageMask}>
              <div
                className={styles.restartBtn}
                onClick={() => {
                  reLayout();
                  reStart();
                  createItem();
                }}
              >
                重新开始
              </div>
            </div>
          )}
          <div className={styles.leaderBoardBox}>
            <div className={styles.leaderBoardTitle}>排行榜🔥</div>
            <div className={styles.switchBox}>
              <Switch
                checked={switchOpen}
                onChange={(checked) => setSwitchOpen(checked)}
              ></Switch>
              <span className={styles.switchText}>
                {switchOpen ? '去重' : '不去重'}
              </span>
            </div>
            <div className={styles.topListBox}>
              {switchOpen
                ? uniqueTopList.map((item, index) => (
                    <div key={item.id} className={styles.topListItem}>
                      <span>{index + 1}</span>
                      <span
                        title={item.users
                          .map((itemUser) => itemUser.nickName)
                          .join('\n')}
                      >
                        {item.users
                          .map((itemUser) => itemUser.nickName)
                          .join('、')}
                      </span>
                      <span>{item.id}</span>
                    </div>
                  ))
                : topList.map((item, index) => (
                    <div
                      key={`${item.id}-${item.createdAt}`}
                      className={styles.topListItem}
                    >
                      <span>{index + 1}</span>
                      <span title={item.nickName}>{item.nickName}</span>
                      <span>{item.score}</span>
                    </div>
                  ))}
            </div>
            {loading && (
              <div className={styles.loadingBox}>
                <Spin tip="Loading" />
              </div>
            )}
          </div>
        </div>
      </div>
      <Modal
        title="恭喜"
        open={isWin}
        onOk={() => setIsWin(false)}
        onCancel={() => setIsWin(false)}
        okText="确定"
        className={styles.modalBox}
        maskClosable={false}
      >
        <div>恭喜你赢啦！！！</div>
        <div>步数：{step}</div>
        <div>用时：{(time / 1000).toFixed(2)}秒</div>
      </Modal>
      <div
        className={styles.feedbackBox}
        onClick={() =>
          window.open(
            'https://github.com/dearDreamWeb/digital-huarong-road/issues'
          )
        }
      >
        反馈
      </div>
    </div>
  );
};

export default Index;
