
import { List, Cursor, CollectionRange } from "../interfaces"
import { RangeBase } from "../util"

class Node<T> implements Cursor<T> {

  constructor(public value: T, public _prevNode: Node<T> | null = null, public _nextNode: Node<T> | null = null) {

  }

  *[Symbol.iterator](): IterableIterator<T> {
    let node: Node<T> | null = this;
    while (node !== null) {
      yield node.value;
      node = node._nextNode;
    }
  }

  next() {
    return this._nextNode;
  }
  
  prev() {
    return this._prevNode;
  }

}

class NodeRange<T> extends RangeBase<T> implements CollectionRange<T> {

  constructor(public _startNode: Node<T> | null, public _endNode: Node<T> | null, public readonly reversed: boolean) {
    super();
  }

  *values() {
    let node = this._startNode;
    while (node !== null) {
      yield node.value;
      if (node === this._endNode) {
        break;
      }
      node = this.reversed ? node._prevNode : node._nextNode;
    }
  }

  *[Symbol.iterator]() {
    let node = this._startNode;
    while (node !== null) {
      yield node;
      if (node === this._endNode) {
        break;
      }
      node = this.reversed ? node._prevNode : node._nextNode;
    }
  }

  reverse() {
    return new NodeRange(this._endNode, this._startNode, !this.reversed);
  }

  get size(): number {
    let count = 0;
    let node = this._startNode;
    while (node !== null) {
      count++;
      if (node === this._endNode) {
        break;
      }
      node = node._nextNode;
    }
    return count;
  }

}

export { Node as DoubleLinkedListCursor, NodeRange as DoubleLinkedListRange };

/**
 * A doubly-linked list, which is sometimes faster than a singly-linked list
 * but consumes a bit more memory.
 *
 * The following table summarises the time complexity of the most commonly used
 * properties.
 *
 * | Property name                                        | Worst-case |
 * |------------------------------------------------------|------------|
 * | {@link DoubleLinkedList.append append()}             | O(1)       |
 * | {@link DoubleLinkedList.at at()}                     | O(n)       |
 * | {@link DoubleLinkedList.insertAfter insertAfter()}   | O(1)       |
 * | {@link DoubleLinkedList.insertBefore insertBefore()} | O(1)       |
 * | {@link DoubleLinkedList.deleteAt deleteAt()}         | O(1)       |
 * | {@link DoubleLinkedList.prepend prepend()}           | O(1)       |
 * | {@link DoubleLinkedList.size size}                   | O(1)       |
 *
 * @see [[SingleLinkedList]]
 *
 * @typeparam T The type of element in this collection.
 */export class DoubleLinkedList<T> implements List<T> {
  
  constructor(
    /**
     * @ignore
     */
    public _firstNode: Node<T> | null = null, 
    /**
     * @ignore
     */
    public _lastNode: Node<T> | null = null, 
    /**
     * @ignore
     */
    public _size = 0) {

  }

  insertBefore(pos: Node<T>, el: T) {
    if (pos._prevNode === null) {
      return this.prepend(el)
    } else {
      const newNode = new Node(el, pos._prevNode, pos);
      pos._prevNode._nextNode = newNode;
      pos._prevNode = newNode;
      ++this._size;
      return newNode;
    }
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

  add(element: T): [boolean, Cursor<T>] {
    return [true, this.append(element)];
  }

  insertAfter(pos: Node<T>, el: T) {
    if (pos._nextNode === null) {
      return this.append(el);
    } else {
      const newNode = new Node<T>(el, pos, pos._nextNode);
      pos._nextNode._prevNode = newNode;
      pos._nextNode = newNode;
      ++this._size;
      return newNode;
    }
  }

  prepend(el: T) {
    const newNode = new Node<T>(el, null, this._firstNode);
    this._firstNode = newNode;
    if (this._lastNode === null) {
      this._lastNode = newNode;
    }
    ++this._size;
    return newNode;
  }

  append(el: T) {
    const newNode = new Node<T>(el, this._lastNode, null);
    if (this._firstNode === null) {
      this._firstNode = newNode
    } else {
      this._lastNode!._nextNode = newNode
    }
    this._lastNode = newNode;
    ++this._size;
    return newNode;
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
      yield node.value
      node = node._nextNode;
    }
  }

  toRange() {
    return new NodeRange<T>(this._firstNode, this._lastNode, false);
  }

  at(position: number) {
    let node = this._firstNode!;
    while (position > 0) {
      node = node._nextNode!;
      if (node === null) {
        throw new RangeError(`Cannot get element at position ${position}: index out of bounds.`)
      }
      --position;
    }
    return node;
  }

  getAt(position: number) {
    return this.at(position).value;
  }

  deleteAt(pos: Node<T>) {
    if (pos._prevNode !== null) {
      pos._prevNode._nextNode = pos._nextNode;
    }
    if (pos._nextNode !== null) {
      pos._nextNode._prevNode = pos._prevNode;
    }
    --this._size;
    if (pos === this._firstNode) {
      this._firstNode = pos._nextNode;
    }
    if (pos === this._lastNode) {
      this._lastNode = pos._prevNode;
    }
  }

  delete(el: T): boolean {
    let node = this._firstNode;
    while (node !== null) {
      if (node.value === el) {
        this.deleteAt(node);
        return true;
      }
      node = node._nextNode;
    }
    return false;
  }

  deleteAll(el: T) {
    let count = 0;
    let node = this._firstNode;
    while (node !== null) {
      if (node.value === el) {
        this.deleteAt(node);
        count++;
      }
      node = node._nextNode;
    }
    return count;
  }

  rest(): List<T> {
    if (this._firstNode === null) {
      throw new Error(`Cannot get rest of list: collection is empty`)
    }
    return new DoubleLinkedList<T>(this._firstNode._nextNode, this._lastNode, this._size-1);
  }

  clear() {
    this._firstNode = null;
    this._lastNode = null;
    this._size = 0;
  }

}

export default DoubleLinkedList

