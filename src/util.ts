
/// <reference types="./external" />

import { Cursor, CollectionRange } from "./interfaces"
import * as XXH from "xxhashjs"

/**
 * @ignore
 */
export function isIterable<T = any>(value: any): value is Iterable<T> {
  return typeof value === 'object' 
      && value !== null
      && typeof value[Symbol.iterator] === 'function';
}

// TODO optimize
export function hash(val: any) {
  return XXH.h32(JSON.stringify(val), 0xABCD).toNumber();
}

type Omit<T, K> = Pick<T, Exclude<keyof T, K>>

/**
 * @ignore
 */
export function omit<O extends object, K extends keyof O>(obj: O, ...keys: K[]): Omit<O, K>  {
  const out: any = {}; // no need to typecheck
  for (const key of Object.keys(obj)) {
    if (keys.indexOf(key as K) === -1) {
      out[key] = obj[key as K];
    }
  }
  return out;
}

/**
 * @ignore
 */
export class EmptyRange<T> implements CollectionRange<T> {
  constructor(public readonly reversed = false) { }
  filter(pred: (element: Cursor<T>) => boolean) { return this; }
  reverse() { return new EmptyRange<T>(!this.reversed); }
  get size() { return 0; }
  *getCursors(): IterableIterator<Cursor<T>> {  }
  *[Symbol.iterator](): IterableIterator<T> {  }
}

/**
 * @ignore
 */
export function get(val: any, path: any[]) {
  for (const chunk of path) {
    val = val[chunk];
  }
  return val;
}

/**
 * @ignore
 */
export function liftKeyed(proc: Function, path: string[]): Function {
  if (path.length === 0) {
    return proc;
  } else {
    return (...args: any[]) => proc(...args.map(arg => get(arg, path)));
  }
}

/**
 * @ignore
 */
export function liftLesser<T>(lt: (a: T, b: T) => boolean): (a: T, b: T) => number {
  return function (a, b) {
    if (lt(a, b)) {
      return -1;
    }
    if (lt(b, a)) {
      return 1;
    }
    return 0;
  }
}

/**
 * Abstract base class for implementing new cursors for a specific type of
 * collection.
 *
 * ```ts
 * class MyCursor<T> extends CursorBase<T> {
 *   // ...
 * }
 * ```
 */
export abstract class CursorBase<T> implements Cursor<T> {

  abstract value: T;

  *nextAll(): IterableIterator<Cursor<T>> {
    let cursor: Cursor<T> | null = this;
    do {
      yield cursor;
      cursor = cursor.next!();
    } while (cursor !== null);
  }

  *prevAll(): IterableIterator<Cursor<T>> {
    let cursor: Cursor<T> | null = this;
    do {
      yield cursor;
      cursor = cursor.prev!();
    } while (cursor !== null);
  }

}

/**
 * Abstract base class for implementing new ranges on a specific type of
 * collection. 
 *
 * ```ts
 * class MyRange<T> extends RangeBase<T> {
 *   // ...
 * }
 * ```
 */
export abstract class RangeBase<T> implements CollectionRange<T> {

  abstract getCursors(): IterableIterator<Cursor<T>>;

  abstract readonly size: number;

  abstract [Symbol.iterator](): IterableIterator<T>;

  filter(pred: (el: Cursor<T>) => boolean): CollectionRange<T> {
    return new FilteredRange<T>(this, pred);
  }

}

/**
 * @ignore
 */
export class FilteredRange<T> extends RangeBase<T> {

  constructor(public _range: CollectionRange<T>, public _pred: (el: Cursor<T>) => boolean) {
    super();
  }

  get size() {
    return this._range.size;
  }

  *getCursors() {
    for (const cursor of this._range.getCursors()) {
      if (this._pred(cursor)) {
        yield cursor;
      }
    }
  }

  reverse() {
    return new FilteredRange<T>(this._range.reverse!(), this._pred);
  }

  *[Symbol.iterator]() {
    for (const cursor of this._range.getCursors()) {
      if (this._pred(cursor)) {
        yield cursor.value;
      }
    }
  }

}

/**
 * @ignore
 */
export interface Newable<T> {
  new(...args: any[]): T;
}

/** 
 * @ignore
 */
export function isObject(val: any) {
  return typeof val === 'object' 
      && val !== null 
      && !isArray(val);
}

/**
 * @ignore
 */
export function isArray(val: any) {
  return Object.prototype.toString.call(val) === '[object Array]';
}

export function lesser(a: any, b: any) {
  if (typeof a === 'number' && typeof b === 'number') {
    return a < b;
  } else if (typeof a === 'string' && typeof b === 'string') {
    return a < b;
  } else if (isArray(a) && isArray(b)) {
    if (a.length < b.length) {
      return true;
    }
    if (a.length > b.length) {
      return false;
    }
    let foundLesser = false;
    for (let i = 0; i < a.length; ++i) {
      if (lesser(a[i], b[i])) {
        // FIXME is this correct?
        foundLesser = true;
      } else if (lesser(b[i], a[i])) {
        return false;
      }
    }
    return foundLesser;
  } else if (isObject(a) && isObject(b)) {
    const ks1 = Object.keys(a).sort();
    const extra = new Set<string>(Object.keys(b));
    if (ks1.length > Object.keys(b).length) 
      return false;
    let foundLesser = false;
    for (const key of ks1) {
      if (b[key] === undefined) {
        return false;
      }
      extra.delete(key);
      if (lesser(a[key], b[key])) {
        foundLesser = true;
        continue;
      }
      if (lesser(b[key], a[key])) {
        return false;
      }
    }
    return foundLesser ? extra.size >= 0 : extra.size > 0;
  } else {
    return false;
  }
}

export function equal(a: any, b: any): boolean {
  if (typeof a === 'number' && typeof b === 'number') {
    return a === b;
  }
  if (typeof a === 'string' && typeof b === 'string') {
    return a === b;
  }
  if (isArray(a) && isArray(b)) {
    if (a.length !== b.length) 
      return false;
    for (let i = 0; i < a.length; ++i) {
      if (!equal(a[i], b[i])) {
        return false;
      }
    }
    return true;
  }
  if (isObject(a) && isObject(b)) {
    const ks1 = Object.keys(a);
    if (ks1.length !== Object.keys(b).length)
      return false;
    for (const key of ks1) {
      if (typeof b[key] === 'undefined') {
        return false;
      }
      if (!equal(a[key], b[key])) {
        return false;
      }
    }
    return true;
  }
  return false;
}

