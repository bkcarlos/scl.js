
import { List, Cursor, CollectionRange } from "../interfaces"

interface Node<T> {
  next: Node<T> | null;
  value: T;
}

export class SingleLinkedListCursor<T> implements Cursor<T> {

  constructor(public _list: SingleLinkedList<T>, public _node: Node<T>) {
    
  }

  *[Symbol.iterator](): IterableIterator<T> {
    let node: Node<T> | null = this._node;
    do {
      yield node.value;
      node = node.next;
    } while (node !== null);
  }

  get value() {
    return this._node.value;
  }

  set value(newValue: T) {
    this._node.value = newValue;
  }

  prev() {
    const prev = this._list._findPrev(this._node);
    if (prev === null) {
      return null;
    }
    return new SingleLinkedListCursor<T>(this._list, prev);
  }

  next() {
    if (this._node.next === null) {
      return null;
    }
    return new SingleLinkedListCursor<T>(this._list, this._node.next);
  }

}

export class SingleLinkedListRange<T> implements CollectionRange<T> {
  
  constructor(public _list: SingleLinkedList<T>, public _startNode: Node<T> | null, public _endNode: Node<T> | null, public _reversed: boolean) {

  }
  
  get size() {
    let count = 0;
    let node = this._startNode;
    while (node !== null) {
      count++;
      if (node === this._endNode) {
        break;
      }
      node = node.next;
    }
    return count;
  }

  *values() {
    let node = this._startNode;
    while (node !== null) {
      yield node.value;
      node = node.next;
    }
  }

  *[Symbol.iterator]() {
    let node = this._startNode;
    while (node !== null) {
      yield new SingleLinkedListCursor<T>(this._list, node);
      if (node === this._endNode) {
        break;
      }
      node = node.next;
    }
  }

}

export class SingleLinkedList<T> implements List<T> {

  constructor(public _firstNode: Node<T> | null = null, public _lastNode: Node<T> | null = null, public _size = 0) {

  }

  _findPrev(node: Node<T>) {
    let prev = this._firstNode;
    while (prev !== null && prev.next !== node) {
      prev = prev.next;
    }
    return prev;
  }

  add(element: T): [boolean, Cursor<T>] {
    return [true, this.prepend(element)];
  }

  getAt(index: number) {
    return this.at(index).value;
  }

  first() {
    if (this._firstNode === null) {
      throw new Error(`Cannot get first element: collection is empty.`)
    }
    return this._firstNode.value
  }

  last() {
    if (this._lastNode === null) {
      throw new Error(`Cannot get last element: collection is empty.`)
    }
    return this._lastNode.value;
  }

  insertBefore(pos: SingleLinkedListCursor<T>, el: T) {
    if (pos._node === this._firstNode) {
      return this.prepend(el)
    } else {
      const prev = this._findPrev(pos._node)!;
      const newNode = { next: pos._node, value: el };
      if (prev.next === null) {
        this._lastNode = newNode;
      }
      prev.next = newNode;
      ++this._size;
      return new SingleLinkedListCursor<T>(this, newNode);
    }
  }

  insertAfter(pos: SingleLinkedListCursor<T>, el: T) {
    const newNode = { value: el, next: pos._node.next };
    if (pos._node.next === null) {
      this._lastNode = newNode;
    }
    pos._node.next = newNode;
    ++this._size;
    return new SingleLinkedListCursor<T>(this, newNode);
  }

  prepend(el: T) {
    const newNode = { next: this._firstNode, value: el };
    this._firstNode = newNode;
    if (this._lastNode === null) {
      this._lastNode = newNode;
    }
    ++this._size;
    return new SingleLinkedListCursor<T>(this, newNode);
  }

  append(el: T) {
    const newNode = { next: null, value: el }
    let prev = this._lastNode;
    if (this._lastNode === null) {
      this._firstNode = newNode
      this._lastNode = newNode;
    } else {
      this._lastNode.next = newNode;
      this._lastNode = newNode;
    }
    ++this._size;
    return new SingleLinkedListCursor<T>(this, newNode);
  }

  count(el: T) {
    let res = 0
    let node = this._firstNode
    while (node !== null) {
      if (node.value === el)
        ++res
      node = node.next
    }
    return res
  }

  get size() {
    return this._size;
  }

  has(el: T) {
    let node = this._firstNode
    while (node !== null)
      if (node.value === el)
        return true

    return false
  }

  *[Symbol.iterator](): IterableIterator<T> {
    let node = this._firstNode;
    while (node !== null) {
      yield node.value;
      node = node.next;
    }
  }

  at(position: number) {
    let curr = this._firstNode;
    let i = position;
    while (i > 0) {
      if (curr === null) {
        throw new RangeError(`Could not get element at i ${position}: index out of bounds.`)
      }
      curr = curr.next;
      --i;
    }
    if (curr === null) {
      throw new RangeError(`Could not get element at position ${position}: index out of bounds.`)
    }
    return new SingleLinkedListCursor<T>(this, curr);
  }

  deleteAt(pos: SingleLinkedListCursor<T>) {
    const prev = this._findPrev(pos._node)
        , next = pos._node.next;
    if (prev === null) {
      this._firstNode = next;
    } else {
      prev.next = next;
    }
    if (next === null) {
      this._lastNode = prev;
    }
    --this._size;
  }

  delete(element: T): boolean {
    let node: Node<T> | null = this._firstNode;
    let prev = null;
    while (node !== null) {
      if (node.value === element) {
        const next = node.next
        if (prev === null) {
          this._firstNode = null;
        } else {
          prev.next = node.next;
        }
        if (next === null) {
          this._lastNode = null;
        }
        return true;
      }
      prev = node;
      node = node.next;
    }
    return false;
  }

  deleteAll(el: T): number {
    let count = 0;
    let node: Node<T> | null = this._firstNode;
    let prev = null;
    while (node !== null) {
      if (node.value === el) {
        const next = node.next
        if (prev === null) {
          this._firstNode = null;
        } else {
          prev.next = node.next;
        }
        if (next === null) {
          this._lastNode = null;
        }
        count++;
      }
      prev = node;
      node = node.next;
    }
    return count;
  }

  toRange() {
    return new SingleLinkedListRange<T>(this, this._firstNode, this._lastNode, false);
  }

  rest(): List<T> {
    if (this._firstNode === null) {
      throw new Error(`Could not get rest of list: list is empty.`)
    }
    return new SingleLinkedList<T>(this._firstNode.next, this._lastNode, this._size-1)
  }

  clear() {
    this._firstNode = null;
    this._lastNode = null;
    this._size = 0;
  }

}

export default SingleLinkedList

