import { Alphabet } from "shirkhan-alphabet";
import keyboardJS from "keyboardjs";

export interface IAdapterConfig {
  container: HTMLInputElement | undefined; //输入源
}
class Adapter {
  alphabet;
  alphabetTable;
  container;

  private _config;

  _alphaMap: { [k: string]: string } = {}; // 为了快速定位并提取元素使用的双向索引表

  constructor(config: IAdapterConfig) {
    this._config = config;
    this.alphabet = new Alphabet();

    this.alphabetTable = this.alphabet.getTable();
    this.alphabetTable.forEach((item) => {
      this._alphaMap[item.khan] = item.uchar;
      this._alphaMap[item.uchar] = item.khan;
    });

    this.container =
      this._config.container ||
      (document.getElementById("input-adapter-container") as HTMLInputElement);
    this.container.dir = "rtl";
  }
  isCombineChar(current: string, pre: string) {
    return this._alphaMap[current + pre] ? true : false;
  }

  getLastCharPosition(n = 1) {
    let start = this.container.selectionStart;
    let end = this.container.selectionEnd;

    end = end ?? 0;

    if (start !== end) {
      // 暂时不考虑选择模式输入，只考虑非选择模式输入
      return { start: end, end };
    }
    start = end - n >= 0 ? end - n : 0;
    return { start, end };
  }

  _replaceLast() {
    // replace the last char t uchar and update select pos
    const { start, end } = this.getLastCharPosition();
    const lastChar = this.container.value.slice(start, end);
    this.container.setRangeText(
      this._alphaMap[lastChar] || lastChar,
      start,
      end
    );
    this.container.selectionStart = this.container.selectionEnd = end;
  }
  update() {
    this._replaceLast();

    // 处理组合字符
    const { start, end } = this.getLastCharPosition(2);
    const twoChar = this.container.value
      .slice(start, end)
      .split("")
      .map((item) => this._alphaMap[item] || item);

    console.log("twoChar", twoChar);
    const first = twoChar[0];
    const second = twoChar[1];
    if (!first || !second) return;

    if (!this.isCombineChar(first, second)) return;
    this.container.setRangeText(this._alphaMap[first + second], start, end);

    this.container.selectionStart = this.container.selectionEnd;
  }
  private _bindKey() {
    keyboardJS.bind(
      "",
      () => {},
      (e) => {
        if (e?.pressedKeys.length! > 1) {
          return;
        }
        const currentChar = e?.key!;
        if (!/^[a-zA-Z]$/.test(currentChar)) return; // 限制只认26个ascii字符
        this.update();
      }
    );
  }
  watchKey() {
    this._bindKey();
    keyboardJS.watch(this.container as any);
  }
  stopWatchKey() {
    keyboardJS.watch(this.container as any);
  }
}

export { Adapter as default };
