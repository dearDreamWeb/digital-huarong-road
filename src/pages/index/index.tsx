import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './index.module.less';
import * as PIXI from 'pixi.js';
import {
  Button,
  Divider,
  message,
  Modal,
  Select,
  Spin,
  Switch,
  Tooltip,
} from 'antd';
import {
  getGameTop,
  digital,
  getGameTopV2,
  getGameTodayHistory,
} from '@/api/api';
import {
  getRandomName,
  randomAccess,
  createHash,
  encrypt,
  getUserId,
} from '../../utils';
import { Icon } from '@iconify-icon/react';
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

function st() {
  return (
    window.pageYOffset ||
    document.documentElement.scrollTop ||
    document.body.scrollTop
  );
}

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
    createItem();
  }, [app]);

  useEffect(() => {
    (async () => {
      if (isWin) {
        setIsStop(true);
        timerInterval.current && clearInterval(timerInterval.current);
        const userId = await getUserId();
        digital(
          encrypt(
            JSON.stringify({
              gameName: 'digitalHuarongRoad',
              subName: selectOption,
              score: stepRef.current,
              userId,
              nickName: userInfo.nickname,
              data: {
                time,
                referrer: document.referrer,
                historyId: createHash(),
              },
            })
          )
        ).then((res: any) => {
          if (!res.success) {
            message.error('请求错误');
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
  }, [app, selectOption]);

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
  /**
   * 获取文字的居中x的距离
   * @param width : ;
   * @param fontSize
   * @param length
   * @returns
   */
  const centerX = useCallback(
    (width: number, fontSize: number, length: number) => {
      const x = (width - fontSize * length) / 2;
      return x;
    },
    []
  );
  /**
   * 绘制背景圆角
   * @param ctx
   * @param canvas
   * @param radius
   */
  const canvasRenderBg = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      canvas: HTMLCanvasElement,
      radius: number
    ) => {
      const x = 0;
      const y = 0;
      const width = canvas.width;
      const height = canvas.height;
      ctx.beginPath();
      ctx.moveTo(x + radius, y); // 移动到左上角的圆角开始位置
      ctx.lineTo(x + width - radius, y); // 画直线到右上角的圆角开始位置
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius); // 画右上圆角
      ctx.lineTo(x + width, y + height - radius); // 画直线到右下角的圆角开始位置
      ctx.quadraticCurveTo(
        x + width,
        y + height,
        x + width - radius,
        y + height
      ); // 画右下角
      ctx.lineTo(x + radius, y + height); // 画直线到左下角的圆角开始位置
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius); // 画左下角
      ctx.lineTo(x, y + radius); // 画直线到左上角的圆角开始位置
      ctx.quadraticCurveTo(x, y, x + radius, y); // 画左上角
      ctx.closePath(); // 关闭路径
      let gradientBg = ctx.createLinearGradient(
        canvas.width / 2,
        0,
        canvas.width / 2,
        canvas.height
      );
      gradientBg.addColorStop(0, '#6DF4B7');
      gradientBg.addColorStop(1, '#F1268C');
      ctx.fillStyle = gradientBg;
      ctx.fill();
    },
    []
  );

  /**
   * canvas卡片绘制
   * @returns
   */
  const canvasRender = () => {
    const marginTop = 16;
    const config = {
      title: {
        text: '数字华容道',
        fontSize: 48,
      },
      subTitle: {
        text: '恭喜你赢啦',
        fontSize: 32,
      },
      mode: {
        text: `模式：${selectOption}`,
        fontSize: 24,
      },
      steps: {
        text: `得分：${step}`,
        fontSize: 24,
      },
    };
    const canvas = document.createElement('canvas');
    canvas.width = 350;
    canvas.height = 200;
    const ctx = canvas.getContext('2d')!;
    ctx.save();
    canvasRenderBg(ctx, canvas, 10);
    ctx.restore();
    ctx.save();
    ctx.font = `bold ${config.title.fontSize}px ZpixLocal`;
    ctx.fillStyle = '#fff';
    const titleY = config.title.fontSize;
    ctx.fillText(
      config.title.text,
      centerX(canvas.width, config.title.fontSize, config.title.text.length),
      titleY
    );
    ctx.restore();
    ctx.save();
    ctx.font = `bold ${config.subTitle.fontSize}px ZpixLocal`;
    ctx.fillStyle = '#fff';
    const subTitleY = titleY + marginTop + config.subTitle.fontSize;
    ctx.fillText(
      config.subTitle.text,
      centerX(350, config.subTitle.fontSize, config.subTitle.text.length),
      subTitleY
    );
    ctx.restore();
    ctx.save();
    ctx.font = `bold ${config.mode.fontSize}px ZpixLocal`;
    ctx.fillStyle = '#fff';
    const modeY = subTitleY + marginTop + config.mode.fontSize;
    ctx.fillText(
      config.mode.text,
      centerX(canvas.width, config.mode.fontSize, config.mode.text.length),
      modeY
    );
    ctx.restore();
    ctx.save();
    ctx.font = `bold ${config.steps.fontSize}px ZpixLocal`;
    ctx.fillStyle = '#fff';
    const stepsTop = modeY + marginTop + config.steps.fontSize;
    ctx.fillText(
      config.steps.text,
      centerX(canvas.width, config.steps.fontSize, config.steps.text.length),
      stepsTop
    );
    ctx.restore();
    return canvas;
  };

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
          <canvas id="mainCanvas" width={350} height={350}></canvas>
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
        onCancel={() => setIsWin(false)}
        className={`${styles.modalBox} winModal`}
        maskClosable={false}
        footer={
          <div className={styles.winModalFooter}>
            <Tooltip
              placement="top"
              title={<img src={canvasRender().toDataURL('image/png')}></img>}
              className={styles.winToolTip}
              getPopupContainer={(e) => e.parentElement as HTMLElement}
            >
              <Button
                onClick={() => {
                  const canvas = canvasRender();
                  const link = document.createElement('a');
                  link.href = canvas.toDataURL('image/png');
                  link.download = `dhr-${selectOption}-${+new Date()}.png`;
                  link.click();
                }}
              >
                保存卡片
              </Button>
            </Tooltip>
            <Button onClick={() => setIsWin(false)} type="primary">
              确定
            </Button>
          </div>
        }
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
