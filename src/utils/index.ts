import cnchar from 'cnchar';
import JSEncrypt from 'jsencrypt';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

// 获取指定范围内的随机数
export function randomAccess(min: number, max: number, isInt = true) {
  if (isInt) {
    return Math.floor(Math.random() * (min - max) + max);
  }
  return Math.random() * (min - max) + max;
}

// 解码
function decodeUnicode(str: string, index?: number) {
  if (index === 3) {
    return str;
  }
  //Unicode显示方式是\u4e00
  str = '\\u' + str;
  str = str.replace(/\\/g, '%');
  //转换中文
  str = unescape(str);
  //将其他受影响的转换回原来
  str = str.replace(/%/g, '\\');
  return str;
}

function translateName(index?: number): string {
  // 中文，日文，符号，阿拉伯数字
  let randomArr = [
    [0x4e00, 0x9fa5],
    [0x3040, 0x309f],
    [0x25a0, 0x2617],
    [0, 9],
  ];
  let randomIndex =
    typeof index === 'number'
      ? index
      : Math.floor(randomArr.length * Math.random());
  let unicodeNum = '';
  unicodeNum = randomAccess(
    randomArr[randomIndex][0],
    randomArr[randomIndex][1]
  ).toString(16);
  let result = decodeUnicode(unicodeNum, randomIndex);

  if (
    randomIndex === 0 &&
    (cnchar.stroke(result) === 0 || (cnchar.stroke(result) as number) > 10)
  ) {
    return translateName(0);
  } else if (result.includes('\\u')) {
    return translateName();
  }
  return result;
}

/*
 *@param Number NameLength 要获取的名字长度
 */
export function getRandomName(NameLength: number) {
  let name = '';
  for (let i = 0; i < NameLength; i++) {
    name += translateName();
  }
  return name;
}

/**
 * 随机ID
 * @returns
 */
export function createHash(hashLength = 24): string {
  if (!hashLength || typeof Number(hashLength) != 'number') {
    return '';
  }
  let ar = [
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '0',
    'a',
    'b',
    'c',
    'd',
    'e',
    'f',
    'g',
    'h',
    'i',
    'j',
    'k',
    'l',
    'm',
    'n',
    'o',
    'p',
    'q',
    'r',
    's',
    't',
    'u',
    'v',
    'w',
    'x',
    'y',
    'z',
  ];
  let hs = [];
  let hl = Number(hashLength);
  let al = ar.length;
  for (let i = 0; i < hl; i++) {
    hs.push(ar[Math.floor(Math.random() * al)]);
  }

  return hs.join('');
}

export const encrypt = (text: string) => {
  const PUB_KEY = import.meta.env.VITE_PUBLIC_KEY || '';
  let encrypt = new JSEncrypt();
  encrypt.setPublicKey(PUB_KEY);
  let maxChunkLength = 20,
    inOffset = 0;
  let arr = [];
  while (inOffset < text.length) {
    // console.log(text.substring(inOffset, inOffset + maxChunkLength));
    const str = encrypt.encrypt(
      text.substring(inOffset, inOffset + maxChunkLength)
    );
    arr.push(str);
    inOffset += maxChunkLength;
  }

  return JSON.stringify(arr);
};

export const getUserId = async () => {
  const fp = await FingerprintJS.load();
  const result = await fp.get();
  return result.visitorId;
};
