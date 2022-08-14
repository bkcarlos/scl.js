import {
  DEFAULT_VECTOR_ALLOC_STEP,
  DEFAULT_VECTOR_CAPACITY,
} from "./constants";
import { Sequence } from "./interfaces";
import { isIterable } from "./util";
import {
  VectorOptions,
  createArray,
  VectorRange,
  VectorCursor,
} from "./Vector";

function defaultLessThan<T>(a: T, b: T): number {
  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }
  return 0;
}

export class SortVector<T> implements Sequence<T> {
  /**
   * @ignore
   */
  public _elements: T[];

  /**
   * @ignore
   */
  public _elementCount: number;

  /**
   * @ignore
   */
  public _allocStep: number;

  /**
   * @ignore
   */
  public _cmp: (a: T, b: T) => number;

  /**
   * Construct a new vector.
   *
   * ```ts
   * const v1 = new Vector<number>([1, 2, 3, 4, 5])
   * assert.strictEqual(v.size, 5)
   * ```
   *
   * ```ts
   * const v2 = new Vector<number>({ capacity: 1024 })
   * for (let i = 0; i < 1024; i++) {
   *   v2.append(i)
   * }
   * ```
   *
   * @param iter Any iterable, of which the elements will be copied to this vector.
   * @param opts Additional options to customize the newly created vector.
   */
  constructor(opts: Iterable<T> | VectorOptions<T> = {}) {
    if (isIterable(opts)) {
      const [elements, size] = createArray(opts, DEFAULT_VECTOR_CAPACITY);
      this._elements = elements;
      this._elementCount = size;
      this._allocStep = DEFAULT_VECTOR_ALLOC_STEP;
      this._cmp = defaultLessThan;
    } else {
      const capacity =
        opts.capacity !== undefined ? opts.capacity : DEFAULT_VECTOR_CAPACITY;
      this._allocStep =
        opts.allocStep !== undefined
          ? opts.allocStep
          : DEFAULT_VECTOR_ALLOC_STEP;
      if (opts.elements !== undefined) {
        const [elements, size] = createArray(opts.elements, capacity);
        this._elementCount = size;
        this._elements = elements;
      } else {
        this._elementCount = 0;
        this._elements = new Array(capacity);
      }
      if (opts.cmp !== undefined) {
        this._cmp = opts.cmp;
      } else {
        this._cmp = defaultLessThan;
      }
    }
  }

  /**
   * Get how much elements this vector can hold before it needs to re-allocate.
   *
   * @see [[Vector.size]]
   */
  public get capacity(): number {
    return this._elements.length;
  }

  /**
   * Ensure the vector can store at least `count` amount of elements.
   *
   * The [[size]] property of this vector is never changed during this call.
   */
  public allocate(count: number): void {
    this._elements.length = Math.max(this._elements.length, count);
    // if (count <= this._elements.length) {
    //   return;
    // }
    // const newElements = new Array(count);
    // copy(this._elements, newElements, 0, this._elementCount);
    // this._elements = newElements;
  }

  public has(element: T): boolean {
    for (let i = 0; i < this._elementCount; i++) {
      if (this._elements[i] === element) {
        return true;
      }
    }
    return false;
  }

  public replace(index: number, element: T): void {
    if (index < 0 || index >= this._elementCount) {
      throw new RangeError(
        `Could not replace element: index ${index} out of bounds.`
      );
    }
    this._elements[index] = element;
  }

  public getAt(index: number) {
    if (index < 0 || index >= this._elementCount) {
      throw new RangeError(
        `Could not get element: index ${index} out of bounds.`
      );
    }
    return this._elements[index];
  }

  public shrinkFit() {
    this._elements.length = this._elementCount;
  }

  /**
   * Get how many elements are actually in the container.
   *
   * @see [[capacity]]
   */
  public get size(): number {
    return this._elementCount;
  }

  public insertAfter(pos: VectorCursor<T>, element: T): VectorCursor<T> {
    return this.append(element);
  }

  public insertBefore(pos: VectorCursor<T>, element: T): VectorCursor<T> {
    return this.append(element);
  }

  public slice(a: number, b: number): VectorRange<T> {
    return new VectorRange<T>(this, a, b, false);
  }

  public first(): T {
    if (this._elementCount === 0) {
      throw new Error(`Could not get first element: collection is empty.`);
    }
    return this._elements[0];
  }

  public last(): T {
    if (this._elementCount === 0) {
      throw new Error(`Could not get last element: collection is empty.`);
    }
    return this._elements[this._elementCount - 1];
  }

  public toRange(): VectorRange<T> {
    return new VectorRange<T>(this, 0, this._elementCount, false);
  }

  public prepend(el: T): VectorCursor<T> {
    if (this._elements.length === this._elementCount) {
      this._elements.length += this._allocStep;
    }
    this._elements.copyWithin(1, 0, this._elementCount);
    this._elements[0] = el;
    this._elementCount++;
    return new VectorCursor<T>(this, 0);
  }

  public append(el: T): VectorCursor<T> {
    if (this._elements.length === this._elementCount) {
      this._elements.length += this._allocStep;
    }
    this._elements[this._elementCount] = el;
    this._elementCount++;
    this._elements.sort(this._cmp);

    return this.find(el);
  }

  public find(el: T): VectorCursor<T> {
    if (!this._elementCount) {
      throw new RangeError(`vector is empty.`);
    }

    // 起始索引
    let startIndex = 0;
    // 结束索引
    let endIndex = this._elementCount - 1;

    while (startIndex <= endIndex) {
      let midIndex = Math.floor((startIndex + endIndex) / 2);
      let midTarget = this._elements[midIndex];

      if (el < midTarget) {
        // 目标小于中值 舍弃右半部分
        endIndex = midIndex - 1;
      } else if (el > midTarget) {
        // 大于中值 舍弃左半部分
        startIndex = midIndex + 1;
      } else if (el === midTarget) {
        // 相同找到目标直接返回下标
        return new VectorCursor(this, midIndex);
      }
    }
    // 循环结束没找到
    throw new RangeError(`vector is empty.`);
  }

  public *[Symbol.iterator]() {
    const elements = this._elements;
    const size = this._elementCount;
    for (let i = 0; i < size; i++) {
      yield elements[i];
    }
  }

  public add(el: T): [boolean, VectorCursor<T>] {
    return [true, this.append(el)];
  }

  public at(position: number): VectorCursor<T> {
    if (position < 0 || position >= this._elementCount) {
      throw new RangeError(
        `Could not get element at position ${position}: index out of range.`
      );
    }
    return new VectorCursor(this, position);
  }

  public delete(el: T): boolean {
    for (let i = 0; i < this._elementCount; i++) {
      if (el === this._elements[i]) {
        this._elements.copyWithin(i, i + 1, this._elementCount);
        this._elementCount--;
        return true;
      }
    }
    return false;
  }

  public deleteAtIndex(index: number) {
    this._elements.copyWithin(index, index + 1, this._elementCount);
    this._elementCount--;
  }

  public swap(a: number, b: number) {
    // const keep = this.getAt(a);
    // this.replace(a, this.getAt(b));
    // this.replace(b, keep);
  }

  public deleteAt(pos: VectorCursor<T>) {
    this.deleteAtIndex(pos._index);
  }

  public deleteAll(element: T): number {
    let k = 0;
    let count = 0;
    for (let i = 0; i < this._elementCount; i++) {
      if (element !== this._elements[i]) {
        this._elements[k++] = this._elements[i];
      } else {
        count++;
      }
    }
    this._elementCount = k;
    return count;
  }

  public clear() {
    this._elements = [];
    this._elementCount = 0;
  }

  public clone() {
    return new SortVector<T>({
      elements: this,
      capacity: this._elements.length,
      allocStep: this._allocStep,
      cmp: this._cmp,
    });
  }

  public getGreatestLowerBound(el: T): VectorCursor<T> {
    let count = this._elementCount;
    let step = 0;
    let it = 0;
    let first = 0;
    while (count > 0) {
      it = first;
      step = Math.floor(count / 2);
      it += step;
      if (!this._cmp(el, this._elements[it])) {
        first = it + 1;
        count -= step + 1;
      } else {
        count = step;
      }
    }
    return new VectorCursor<T>(this, first);
  }

  public getLeastUpperBound(el: T): VectorCursor<T> {
    let count = this._elementCount;
    let step = 0;
    let it = 0;
    let first = 0;
    while (count > 0) {
      it = first;
      step = Math.floor(count / 2);
      it += step;
      if (this._elements[it] < el) {
        first = it + 1;
        count -= step + 1;
      } else {
        count = step;
      }
    }
    return new VectorCursor<T>(this, first);
  }
}

export default SortVector;
