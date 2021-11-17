import Alphabet from "shirkhan-alphabet";
import { HEMZE } from "shirkhan-alphabet-table";
import keyboardJS from "keyboardjs";

export interface IAdapterConfig {
  container: HTMLInputElement | HTMLTextAreaElement | undefined; //输入源
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
  /**
   * 判断两个字符属于组合字符
   * @param first
   * @param second
   * @returns
   */
  isCombineChar(first: string, second: string) {
    return this._alphaMap[first + second] ? true : false;
  }

  /**
   * 获取光标位置往前移动给定offset长度的 start,end 值
   * @param offset
   * @returns
   */
  getLastCharPosition(offset = 1) {
    let start = this.container.selectionStart;
    let end = this.container.selectionEnd;

    end = end ?? 0;

    if (start !== end) {
      // 暂时不考虑选择模式输入，只考虑非选择模式输入
      return { start: end, end };
    }
    start = end - offset >= 0 ? end - offset : 0;
    return { start, end };
  }

  /**
   * 光标处插入给定字符串并更新下表到插入之后的位置
   * @param str
   */
  addText(str: string) {
    const { end } = this.getLastCharPosition(0);
    this.container.setRangeText(str);
    this.container.selectionStart = this.container.selectionEnd =
      end + str.length;
  }

  /**
   * 删除光标处往前给定offset的字符并更新坐标
   * @param offset
   */
  deleteText(offset = 1) {
    const { start, end } = this.getLastCharPosition(offset);
    this.container.setRangeText("", start, end);
    this.container.selectionStart = this.container.selectionEnd = start;
  }

  /**
   *处理首字符的句柄
   * @param currentChar
   */
  handleFirstChar(currentChar: string) {
    currentChar = this._alphaMap[currentChar] || "";
    if (this.alphabet.isVolwes(currentChar)) {
      currentChar = HEMZE + currentChar;
    }
    this.addText(currentChar);
  }

  /**
   *处理非首字符的句柄
   * @param lastChar
   * @param currentChar
   * @returns
   */
  handleSecondaryChar(lastChar: string, currentChar: string) {
    if (this.isCombineChar(lastChar, currentChar)) {
      this.deleteText(lastChar.length);
      this.addText(this._alphaMap[lastChar + currentChar]);
      return;
    } else {
      //非组合键
      this.addText(this._alphaMap[currentChar] || "");
    }
  }

  /**
   * 按照点击的key值更新内容
   * @param currentChar
   */
  update(currentChar: string) {
    const { start, end } = this.getLastCharPosition(1);

    let lastChar = this.container.value.slice(start, end);
    // 首位字符
    if (lastChar.trim().length === 0) {
      this.handleFirstChar(currentChar);
    } else {
      // 非首位字符
      lastChar = this._alphaMap[lastChar] || "";
      this.handleSecondaryChar(lastChar, currentChar);
    }
  }

  /**
   * 判定当前的 key 事件是否响应
   * @param e
   * @returns
   */
  isNeededKey(e: keyboardJS.KeyEvent | undefined) {
    if (e?.ctrlKey || e?.shiftKey || e?.metaKey) return false; // 功能组合键不做处理
    const keys = e?.pressedKeys!;
    return keys.filter((item) => /^[a-zA-Z']$/.test(item)).length > 0; // 没有明确名字的组合键都忽略
  }
  /**
   * 处理按键点击事件的句柄
   * @param e
   */
  keyPressHandler(e: keyboardJS.KeyEvent | undefined) {
    if (this.isNeededKey(e)) {
      //26个ascii字符
      e?.preventDefault();
      this.update(e?.key!);
    }
  }
  /**
   * 返回需要使用的所有key，用来绑定按键事件
   * @returns
   */
  getKeys(): string[] {
    return [
      ...[...Array(26).keys()].map((i) =>
        String.fromCharCode(i + 65).toLowerCase()
      ),
      "'",
    ];
  }

  /**
   * 绑定 getkeys指定的按键事件
   */
  bindKey() {
    keyboardJS.bind(this.getKeys(), (e) => this.keyPressHandler(e));
  }

  /**
   *开始监听
   */
  watchKey() {
    this.bindKey();
    keyboardJS.watch(this.container as any);
  }

  /**
   * 移除所有监听器，停止监听
   */
  stopWatchKey() {
    keyboardJS.stop();
  }
}

export { Adapter as default };
