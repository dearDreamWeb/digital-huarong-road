# 数字华容道

最近老是抖音老是刷到一个小孩子玩数字华容道特别厉害，我感觉挺有趣的，就做了一个数字华容道，上班摸鱼可以玩，哈哈哈哈哈。  
<img src="https://resource.blogwxb.cn/digitalHuarongRoad/screen-recording.gif"/>

[项目预览地址](https://dhr.blogwxb.cn)
[项目地址](https://github.com/dearDreamWeb/digital-huarong-road) 喜欢的话请给个 star⭐️

整体的样式是采用了`像素风格`。
功能：

- 游戏模式可以自定义选择难度，比如 3X3、4X4、5X5 等
- 设置的有各个模式的排行榜，可以看到排名
- 用户昵称是随机的，如果不满意可以更换昵称

# 实现思路

核心的部分肯定是游戏交互的部分了，这里采用的是二维数组的方式实现的。  
`二维数组`：主要是为了每个模式的初始化的时候，以二维数组的形式为默认值，为了后面区分`行数`和`列数`。需要用到两个二维数组，一个是为了初始化的值`initData`，一个是当前游戏中的值`curData`。  
如：3X3 的模式初始化 initData

```
[
    [1,2,3],
    [4,5,6],
    [7,8,null]
]
```

由于是用的 pixijs 去生成的方格，点击事件获取的是该方格的`数值`，如：1,2,3,4,5,6 等等。根据点击的方格数值判断该方格`四周（上下左右）`有没有`null`值，有的话就进行交换，得到新的`curData`。这里判断是有些麻烦的。

例子：  
如果当前点击的是 3，当前模式的行数(`rows`)为 3，列数(`columns`)为 3  
当前的布局(`curData`)为：

```
[
    [2,6,3],
    [1,null,5],
    [7,4,8]
]
```

```js
// 先获取点击数字在 curData中的位置
const curDataFlat = curData.flat(); // 数组扁平化处理，二维数组转成一维数组
const index = curDataFlat.indexOf('3'); // index 为2
// 要移动的方向
let direction = '';
// 要交换的位置
let newIndex = index;
// 左方向的判断
if (curDataFlat[index - 1] === null) {
  if (index % columns !== 0) {
    direction = 'left';
    newIndex = index - 1;
  }
  // 右方向的判断
} else if (curDataFlat[index + 1] === null) {
  if (index % columns !== columns - 1) {
    direction = 'right';
    newIndex = index + 1;
  }
  // 下方向的判断
} else if (curDataFlat[index + columns] === null) {
  direction = 'bottom';
  newIndex = index + columns;
  // 上方向的判断
} else if (curDataFlat[index - columns] === null) {
  direction = 'top';
  newIndex = index - columns;
}
```

每次交换之后`curData`都要和`initData`进行对比，如果一样代表成功了，游戏结束。

## 游戏怎么初始化？

一开始我想的很简单，拿`3X3`的模式举例子就是拿`1-8`的数字随机取。  
数组： [1,2,3,4,5,6,7,8]
第一次随机拿到了`3`就放第一个格子里,这时候数组变成了[1,2,4,5,6,7,8]  
第二次随机拿到了`5`放第二个格子中,这时候数组变成了[1,2,4,6,7,8]  
...
依次类推把格子填满了。  
本来以为这样就大功告成了。后面发现了一个很致命的`问题`：`有时候这样的随机布局根本就无法通关`。  
举一个最简单的例子：  
随机的布局是这样子的：

```
[
    [1,2,3],
    [4,5,6],
    [8,7,null]
]
```

这种是无法通关的，emm......。

换个思路：
换个玩魔方的思路，魔方是怎么随机的，是先将一个复原好的魔方进行随机旋转打乱的。ok，用这个思路就可以进行数字华容道的随机布局了。  
具体思路：

1. 一开始先用完成好的布局：

```
[
    [1,2,3],
    [4,5,6],
    [7,8,null]
]
```

2. `随机上下左右移动null值`，这样随机移动几十步或者上百步就可以打乱初始化的布局了，每次的随机布局也都能通关了。

# 游戏昵称怎么随机？

一开始我想的是随机拿到汉字，这里是可以通过 Unicode 编码去实现的。  
汉字的范围是 `4e00-9fa5`,这些编码前面加上`0x`就是能得到十进制的数值了，再通过`toString(16)`转换成十六进制`4e00`，最后将`4e00`加上`\u`，得到`\u4e00`，通过`unescape`方法得到该字符。

```js
function randomAccess(min, max) {
  return Math.floor(Math.random() * (min - max) + max);
}
// 解码
function decodeUnicode(str) {
  //Unicode显示方式是\u4e00
  str = '\\u' + str;
  str = str.replace(/\\/g, '%');
  //转换中文
  str = unescape(str);
  //将其他受影响的转换回原来
  str = str.replace(/%/g, '\\');
  return str;
}

function translateName() {
  // 中文
  let randomArr = [0x4e00, 0x9fa5];
  let unicodeNum = '';
  unicodeNum = randomAccess(randomArr[0], randomArr[1]).toString(16);
  let result = decodeUnicode(unicodeNum);

  return result;
}

// 获取到中文
console.log(translateName());
```

这样子虽然能得到中文，但是会得到很多偏僻字，比如`鈠 鑙`，为了防止这些偏僻字的出现，想到了可以按照中文的`笔画数`划分，一般来说笔画少的生僻字是会少很多的。  
`cnchar`这个 npm 包就是`可以识别汉字的笔画数的`。有了这个 npm 包，事半功倍了起来，当汉字的笔画数大于`10`就重新获取汉字，直到笔画数`少于10`为止。  
后面我又加入了一些`日文`、`符合`和`阿拉伯数字`。

--------------END-------------------
