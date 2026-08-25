// MIT License
//
// Copyright (c) 2018 Wolt Enterprises
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
//
// Vendored from https://github.com/woltapp/blurhash (TypeScript/src), trimmed to decode only.

const digitCharacters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz#$%*+,-.:;=?@[]^_{|}~";

const decode83 = (str: string): number => {
  let value = 0;
  for (let i = 0; i < str.length; i++) {
    value = value * 83 + digitCharacters.indexOf(str[i]);
  }
  return value;
};

const sRGBToLinear = (value: number): number => {
  const v = value / 255;
  if (v <= 0.04045) return v / 12.92;
  return Math.pow((v + 0.055) / 1.055, 2.4);
};

const linearTosRGB = (value: number): number => {
  const v = Math.max(0, Math.min(1, value));
  if (v <= 0.0031308) return Math.trunc(v * 12.92 * 255 + 0.5);
  return Math.trunc((1.055 * Math.pow(v, 1 / 2.4) - 0.055) * 255 + 0.5);
};

const signPow = (val: number, exp: number): number => (val < 0 ? -1 : 1) * Math.pow(Math.abs(val), exp);

const decodeDC = (value: number): [number, number, number] => [
  sRGBToLinear(value >> 16),
  sRGBToLinear((value >> 8) & 255),
  sRGBToLinear(value & 255),
];

const decodeAC = (value: number, maximumValue: number): [number, number, number] => {
  const quantR = Math.floor(value / (19 * 19));
  const quantG = Math.floor(value / 19) % 19;
  const quantB = value % 19;
  return [
    signPow((quantR - 9) / 9, 2) * maximumValue,
    signPow((quantG - 9) / 9, 2) * maximumValue,
    signPow((quantB - 9) / 9, 2) * maximumValue,
  ];
};

export const decode = (blurhash: string, width: number, height: number): Uint8ClampedArray => {
  if (!blurhash || blurhash.length < 6) throw new Error("blurhash must be at least 6 characters");

  const sizeFlag = decode83(blurhash[0]);
  const numY = Math.floor(sizeFlag / 9) + 1;
  const numX = (sizeFlag % 9) + 1;
  if (blurhash.length !== 4 + 2 * numX * numY) {
    throw new Error(`blurhash length mismatch: got ${blurhash.length}, expected ${4 + 2 * numX * numY}`);
  }

  const maximumValue = (decode83(blurhash[1]) + 1) / 166;
  const colors: Array<[number, number, number]> = new Array(numX * numY);

  for (let i = 0; i < colors.length; i++) {
    colors[i] =
      i === 0
        ? decodeDC(decode83(blurhash.substring(2, 6)))
        : decodeAC(decode83(blurhash.substring(4 + i * 2, 6 + i * 2)), maximumValue);
  }

  const bytesPerRow = width * 4;
  const pixels = new Uint8ClampedArray(bytesPerRow * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0;
      let g = 0;
      let b = 0;

      for (let j = 0; j < numY; j++) {
        const basisY = Math.cos((Math.PI * y * j) / height);
        for (let i = 0; i < numX; i++) {
          const basis = Math.cos((Math.PI * x * i) / width) * basisY;
          const color = colors[i + j * numX];
          r += color[0] * basis;
          g += color[1] * basis;
          b += color[2] * basis;
        }
      }

      pixels[4 * x + 0 + y * bytesPerRow] = linearTosRGB(r);
      pixels[4 * x + 1 + y * bytesPerRow] = linearTosRGB(g);
      pixels[4 * x + 2 + y * bytesPerRow] = linearTosRGB(b);
      pixels[4 * x + 3 + y * bytesPerRow] = 255;
    }
  }
  return pixels;
};
