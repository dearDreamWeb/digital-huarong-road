import { useEffect, useRef, useState } from 'react';
import styles from './index.module.less';
import * as PIXI from 'pixi.js';
import { Modal, Select, Spin } from 'antd';
import { getGameTop, digital } from '@/api/api';
import { getRandomName, randomAccess, createHash, encrypt } from '../../utils';

interface UserInfo {
  userId: string;
  nickname: string;
}
interface TopListItem {
  user_id: string;
  id: string;
  nick_name: string;
  score: number;
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
];

const stageWidth = 600;
const stageHeight = 600;

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
  const [selectOption, setSelectOption] = useState(optionsList[0].value);
  const [userInfo, setUserInfo] = useState<UserInfo>({
    userId: '',
    nickname: '',
  });
  const [topList, setTopList] = useState<TopListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const timerInterval = useRef<NodeJS.Timer>();
  const stepRef = useRef(0);

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
    getGameTopHandler();
  }, [selectOption]);

  /**
   * 获取游戏top榜
   * @returns
   */
  const getGameTopHandler = async () => {
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
      res.data.map((item: any) => {
        return { ...item, id: item._id };
      })
    );
  };

  /**
   * 获取用户名
   */
  const getNickname = () => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    if (userInfo.userId && userInfo.nickname) {
      setUserInfo(userInfo);
    } else {
      const userInfo = {
        nickname: getRandomName(randomAccess(2, 6)),
        userId: createHash(),
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
    if (isWin) {
      setIsStop(true);
      timerInterval.current && clearInterval(timerInterval.current);
      digital({
        gameName: 'digitalHuarongRoad',
        subName: selectOption,
        score: encrypt(stepRef.current.toString()),
        userId: userInfo.userId,
        nickName: userInfo.nickname,
      }).then((res: any) => {
        if (!res.success) {
          return;
        }
        getGameTopHandler();
      });
    }
  }, [isWin]);

  /**
   * 重置数据
   */
  const reStart = () => {
    if (app) {
      app.stage.removeChildren();
    }
    setIsStop(false);
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

    const numberRect = new PIXI.Graphics();
    numberRect.lineStyle(2, 0x000000, 1); //边线(宽度，颜色，透明度)
    numberRect.beginFill(0x1099bb); //填充
    numberRect.drawRect(x, y, w, h); //x,y,w,h
    numberRect.endFill();
    numberRect.filters = [new PIXI.filters.NoiseFilter(0.3, 0.6)];

    let pixiText = new PIXI.Text(`${text || ''}`, {
      fontFamily: 'ZpixLocal',
      fontSize: 36,
      stroke: '#4a1850',
      fontWeight: 'bold',
      fill: ['#ffffff', '#00ff99'],
      align: 'center',
      lineJoin: 'round',
      dropShadow: true,
      dropShadowColor: '#000000',
      dropShadowBlur: 4,
    });
    pixiText.x = x + w / 2 - 18;
    pixiText.y = y + h / 2 - 18;
    pixiContainer.addChild(numberRect);
    pixiContainer.addChild(pixiText);
    app!.stage.addChild(pixiContainer); //添加到舞台中

    containerDown({ pixiContainer, text });

    return pixiContainer;
  };

  const selectChange = (value: string) => {
    setSelectOption(value);
  };

  return (
    <div className={styles.indexMain}>
      <div className={styles.indexBox}>
        <h1 className={styles.gameTitle}>数字华容道</h1>
        <div className={styles.username}>
          你好哇！<span>{userInfo.nickname || ''}</span>
        </div>
        <div className={styles.dataDisplay}>
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
        <div className={styles.stageBox}>
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
            <div className={styles.topListBox}>
              {topList.map((item, index) => (
                <div key={item.id} className={styles.topListItem}>
                  <span>{index + 1}</span>
                  <span>{item.nick_name}</span>
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
    </div>
  );
};

export default Index;
