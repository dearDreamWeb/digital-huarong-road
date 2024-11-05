import { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import styles from './welcome.module.less';
import { randomAccess } from '@/utils';
import { RATE } from '@/App';

type GraphicsType = 'triangle' | 'circle' | 'rect';
// 'pentagram', 'ribbon'
const graphicsType: GraphicsType[] = ['triangle', 'circle', 'rect'];

interface DiyGraphics extends PIXI.Graphics {
  rotate: number;
  speedX: number;
  speedY: number;
}

const randomSpeed = () => {
  const count = 4 * RATE;
  let x = randomAccess(-1 * count, count, false);
  let y = randomAccess(-1 * count, count, false);
  if (Math.abs(x) < 0.3 && Math.abs(y) < 0.3) {
    x =
      Math.random() > 0.5
        ? randomAccess(0, count, false)
        : randomAccess(-1 * count, count, false);
    y =
      Math.random() > 0.5
        ? randomAccess(0, count, false)
        : randomAccess(-1 * count, count, false);
  }
  return [x, y];
};

const createCircle = (originX: number, originY: number) => {
  const len = randomAccess(3, 8) * RATE;
  const circle = new PIXI.Graphics() as DiyGraphics;
  circle.beginFill(
    PIXI.utils.rgb2hex([
      randomAccess(0, 256),
      randomAccess(0, 256),
      randomAccess(0, 256),
    ])
  );
  circle.drawCircle(0, 0, len); // 绘制正三角形
  circle.endFill(); // 结束填充
  circle.rotate = randomAccess(1, 10);
  circle.rotation = Math.PI * Math.floor(Math.random() * 180);
  const speed = randomSpeed();
  circle.speedX = speed[0];
  circle.speedY = speed[1];
  circle.x = originX;
  circle.y = originY;
  return circle;
};

const createTriangle = (originX: number, originY: number) => {
  const len = randomAccess(5, 10) * RATE;
  // 定义正三角形的顶点
  const trianglePoints = [
    { x: 0, y: 0 }, // 上顶点
    { x: 0 - len, y: 0 + len }, // 右下顶点
    { x: 0 + len, y: 0 + len }, // 左下顶点
  ];

  const triangle = new PIXI.Graphics() as DiyGraphics;
  // 开始绘制
  triangle.beginFill(
    PIXI.utils.rgb2hex([
      randomAccess(0, 256),
      randomAccess(0, 256),
      randomAccess(0, 256),
    ])
  );
  triangle.drawPolygon(trianglePoints); // 绘制正三角形
  triangle.endFill(); // 结束填充
  triangle.rotate = randomAccess(1, 10);
  triangle.rotation = Math.PI * Math.floor(Math.random() * 180);
  const speed = randomSpeed();
  triangle.speedX = speed[0];
  triangle.speedY = speed[1];
  triangle.pivot.x = triangle.width / 2;
  triangle.pivot.y = triangle.height / 2;
  triangle.pivot.x = triangle.width / 2;
  triangle.pivot.y = triangle.height / 2;
  triangle.x = originX;
  triangle.y = originY;
  return triangle;
};

const createRect = (originX: number, originY: number) => {
  const rect = new PIXI.Graphics() as DiyGraphics;
  const len = randomAccess(5, 10) * RATE;
  //   rect.lineStyle(2, 0x000000, 1); //边线(宽度，颜色，透明度)
  rect.beginFill(
    PIXI.utils.rgb2hex([
      randomAccess(0, 256),
      randomAccess(0, 256),
      randomAccess(0, 256),
    ])
  ); //填充
  rect.drawRect(0, 0, len, len);
  rect.x = originX;
  rect.y = originY;
  rect.endFill();
  rect.rotate = Math.PI * Math.floor(Math.random() * 180);
  rect.rotation = Math.PI * Math.floor(Math.random() * 180);
  const speed = randomSpeed();
  rect.speedX = speed[0];
  rect.speedY = speed[1];
  rect.pivot.x = rect.width / 2;
  rect.pivot.y = rect.height / 2;
  //   console.log('rect', rect.speedX, rect.speedY);
  return rect;
};

const createMap: Record<GraphicsType, any> = {
  triangle: createTriangle,
  circle: createCircle,
  rect: createRect,
};

interface WelcomeProps {
  closeMask: () => void;
}

const Welcome = (props: WelcomeProps) => {
  const { closeMask } = props;
  const [app, setApp] = useState<PIXI.Application<PIXI.ICanvas>>();

  const pixiContainer = useRef(new PIXI.Container());

  useEffect(() => {
    let _app = new PIXI.Application({
      width: window.innerWidth,
      height: window.innerHeight,
      antialias: true,
      resolution: 1,
      backgroundColor: PIXI.utils.rgb2hex([0, 0, 0]),
      backgroundAlpha: 0.5,
      view: document.getElementById('welcomeCanvas') as HTMLCanvasElement,
    });
    setApp(_app);
  }, []);

  useEffect(() => {
    init();
    return () => {
      app?.ticker?.stop();
    };
  }, [app]);

  const init = () => {
    if (!app) {
      return;
    }

    const pixiContainerText = new PIXI.Container();
    let pixiText = new PIXI.Text(`Welcome`, {
      fontFamily: 'ZpixLocal, sans-serif',
      fontSize: Math.floor(RATE * 100),
      fontWeight: 'bold',
      fill: ['#ffffff', '#00ff99'],
      align: 'center',
      lineJoin: 'round',
      dropShadow: true,
      dropShadowColor: '#000000',
      dropShadowBlur: 4,
    });
    pixiContainerText.addChild(pixiText);
    pixiContainerText.pivot.x = pixiContainerText.width / 2;
    pixiContainerText.pivot.y = pixiContainerText.height / 2;
    pixiContainerText.x = app.screen.width / 2;
    pixiContainerText.y = app.screen.height / 2;

    const len = graphicsType.length;
    for (let i = 0; i < 1000; i++) {
      const fn = createMap[graphicsType[Math.floor(Math.random() * len)]];
      const graphics = fn(
        randomAccess(
          pixiContainerText.x - pixiContainerText.width / 2,
          pixiContainerText.x + pixiContainerText.width / 2
        ),
        randomAccess(
          pixiContainerText.y - pixiContainerText.height / 2,
          pixiContainerText.y + pixiContainerText.height / 2
        )
      );
      //   console.log('graphics', graphics);
      pixiContainer.current.addChild(graphics);
    }
    pixiContainer.current.alpha = 0;
    app.stage.addChild(pixiContainer.current);

    // console.log(11111, pixiText.width);

    pixiContainerText.scale.x = 0;
    pixiContainerText.scale.y = 0;
    app.stage.addChild(pixiContainerText);

    const speedScale = 0.1;
    let count = 0;

    let textAnimationFinish = false;
    app.ticker.add(() => {
      if (count > 180) {
        closeMask();
        app.ticker.stop();
        return;
      }
      if (textAnimationFinish) {
        pixiContainer.current.alpha = 1;
        pixiContainer.current.children.forEach((item) => {
          if (
            item.x < 0 ||
            item.x > window.innerWidth ||
            item.y < 0 ||
            item.y > window.innerHeight
          ) {
            item.alpha = 0;
            return;
          }
          const m = count < 20 ? 5 : count < 200 ? 3 : count < 380 ? 2 : 2;
          item.x += (item as DiyGraphics).speedX * m;
          item.y += (item as DiyGraphics).speedY * m;
          item.rotation += (item as DiyGraphics).rotate;
        });
        count++;
        //   console.log(count);
      } else {
        if (pixiContainerText.scale.x >= 1.5) {
          pixiContainerText.scale.x = 1;
          pixiContainerText.scale.y = 1;
          textAnimationFinish = true;
        } else {
          pixiContainerText.scale.x += speedScale;
          pixiContainerText.scale.y += speedScale;
        }
      }
    });
  };

  return (
    <div className={styles.welcomeWrapper}>
      <canvas id="welcomeCanvas"></canvas>
    </div>
  );
};

export default Welcome;
