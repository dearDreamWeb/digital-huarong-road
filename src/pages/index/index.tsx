import { useEffect, useRef, useState } from 'react';
import styles from './index.module.less';
import * as PIXI from 'pixi.js';

const defaultList = [
  [1, 2, 3, 4],
  [5, 6, 7, 8],
  [9, 10, 11, 12],
  [13, 14, 15, null],
];

const stageWidth = 600;
const stageHeight = 600;

const Index = () => {
  const [app, setApp] = useState<PIXI.Application<PIXI.ICanvas>>();
  const numberList = useRef<PIXI.Container<PIXI.DisplayObject>[]>([]);
  const layoutNumbers = useRef<Array<Array<number | null>>>(
    JSON.parse(JSON.stringify(defaultList))
  );
  const [isWin, setIsWin] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    randomLayout();
    let _app = new PIXI.Application({
      width: stageWidth,
      height: stageHeight,
      antialias: true,
      resolution: 1,
      view: document.getElementById('mainCanvas') as HTMLCanvasElement,
    });
    setApp(_app);
  }, []);

  useEffect(() => {
    if (!app) {
      return;
    }
    const rows = layoutNumbers.current.length;
    const columns = layoutNumbers.current[0].length;
    const itemWidth = stageWidth / columns;
    const itemHeight = stageWidth / rows;

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < columns; j++) {
        const rect = createRect({
          x: j * itemWidth,
          y: i * itemHeight,
          w: itemWidth,
          h: itemHeight,
          text: layoutNumbers.current[i][j],
        });

        // numberList.current.push(rect);
      }
    }
  }, [app]);

  useEffect(() => {
    if (isWin) {
      console.log(isWin, '你赢啦！');
      alert(`你赢啦！\n 步数：${step}`);
    }
  }, [isWin]);

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
        console.log(index, columns);
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
        console.log(direction);
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
          defaultList.flat().join() === layoutNumbers.current.flat().join()
        );
        setStep((step) => step + 1);
      }
      console.log('graphics', text);
    });
  };

  /**
   * 随机布局
   */
  const randomLayout = () => {
    const rows = layoutNumbers.current.length;
    const columns = layoutNumbers.current[0].length;
    let arr = layoutNumbers.current.flat();
    let newArr = [];
    while (arr.length) {
      const len = arr.length;
      const randomIndex = Math.floor(Math.random() * len);
      newArr.push(arr[randomIndex]);
      arr.splice(randomIndex, 1);
    }

    let newLayoutArr = [];
    for (let i = 0; i < rows; i++) {
      let tempArr = [];
      for (let j = 0; j < columns; j++) {
        tempArr.push(newArr[i * columns + j]);
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
    numberRect.beginFill(0xc5ac06); //填充
    numberRect.drawRect(x, y, w, h); //x,y,w,h
    numberRect.endFill();

    let pixiText = new PIXI.Text(`${text || ''}`, {
      fontFamily: 'Arial',
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

  return (
    <div className={styles.indexMain}>
      <div>步数:{step}</div>
      <canvas id="mainCanvas"></canvas>
    </div>
  );
};

export default Index;
