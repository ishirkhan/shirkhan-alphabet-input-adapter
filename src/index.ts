import { Alphabet, HEMZE } from "shirkhan-alphabet";
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
  isCombineChar(first: string, second: string) {
    return this._alphaMap[first + second] ? true : false;
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

  //to-do: 这里的逻辑代码需要提取更具体的功能方法中
  update(currentChar: string) {
    const { start, end } = this.getLastCharPosition(1);
    let lastChar = this.container.value.slice(start, end);
    // 首字符,原因需要补充 Hemze
    if (lastChar.trim().length === 0) {
      currentChar = this._alphaMap[currentChar] || ""; // 未知字符先废弃
      if (this.alphabet.isVolwes(currentChar)) {
        currentChar = HEMZE + currentChar;
      }
      this.container.setRangeText(currentChar);
      this.container.selectionStart = this.container.selectionEnd =
        end + currentChar.length;
      // 非首字符
    } else {
      lastChar = this._alphaMap[lastChar] || lastChar;
      // 组合键
      if (this.isCombineChar(lastChar, currentChar)) {
        this.container.setRangeText(
          this._alphaMap[lastChar + currentChar],
          end - 1,
          end
        );
        this.container.selectionStart = this.container.selectionEnd = end + 1;
        // 非组合键
      } else {
        this.container.setRangeText(this._alphaMap[currentChar] || ""); // 未知字符先废弃
        this.container.selectionStart = this.container.selectionEnd = end + 1;
      }
    }
  }
  private _bindKey() {
    const keys = [...Array(26).keys()].map((i) =>
      String.fromCharCode(i + 65).toLowerCase()
    );
    keyboardJS.bind(keys, (e) => {
      const currentChar = e?.key!;
      if (
        e?.pressedKeys.filter((item) => {
          if (/^[a-zA-Z]$/.test(item)) return false; //a-z
          if (["space", "spacebar"].includes(item)) return false; // space
          return true;
        }).length! > 0
      ) {
        // 限制只认26个ascii字符
        return;
      }
      e?.preventDefault();
      this.update(currentChar);
    });
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
