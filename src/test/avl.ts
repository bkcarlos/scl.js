
import { expect } from "chai"

import AVL from "../avl"

describe('an AVL-tree', () => {

  it('can insert elements', () => {
    const t1 = new AVL<number>((a, b) => a < b);
    t1.add(1);
    t1.add(5);
    t1.add(2);
    t1.add(3);
    t1.add(4);
    expect([...t1]).to.deep.equal([1, 2, 3, 4, 5]);
  });

  it('can store multiple equal keys', () => {
    const t1 = new AVL<number>((a, b) => a < b);
    t1.add(1);
    t1.add(5);
    t1.add(2);
    t1.add(3);
    t1.add(3);
    t1.add(3);
    t1.add(4);
    expect([...t1]).to.deep.equal([1,2,3,3,3,4,5]);
  })

  it('can delete elements', () => {
    const t1 = new AVL<number>((a, b) => a < b);
    t1.add(1);
    t1.add(5);
    t1.add(2);
    t1.add(3);
    t1.add(4);
    expect([...t1]).to.deep.equal([1, 2, 3, 4, 5]);
    t1.delete(4);
    expect([...t1]).to.deep.equal([1, 2, 3, 5]);
    t1.delete(1);
    expect([...t1]).to.deep.equal([2, 3, 5]);
    t1.delete(2);
    expect([...t1]).to.deep.equal([3, 5]);
    t1.delete(3);
    expect([...t1]).to.deep.equal([5]);
    t1.delete(5);
    expect([...t1]).to.deep.equal([]);
  });

  it('can find the lower bound', () => {
    const t1 = new AVL<number>((a, b) => a < b);
    t1.add(1);
    t1.add(5);
    t1.add(2);
    t1.add(3);
    t1.add(4);
    const pos = t1.lowerKey(2);
    expect(pos).to.be.ok;
    expect(pos!.value).to.equal(3);
  });

  it('can find the upper bound', () => {
    const t1 = new AVL<number>((a, b) => a < b);
    t1.add(1);
    t1.add(5);
    t1.add(2);
    t1.add(3);
    t1.add(4);
    const pos1 = t1.upperKey(4);
    expect(pos1).to.be.ok;
    expect(pos1!.value).to.equal(3);
    const pos2 = t1.upperKey(2);
    expect(pos2).to.be.ok;
    expect(pos2!.value).to.equal(1);
  });

  it('can reverse-iterate over elements', () => {
    const t1 = new AVL<number>((a, b) => a < b);
    t1.add(1);
    t1.add(5);
    t1.add(2);
    t1.add(3);
    t1.add(4);
    expect([...t1.toRange().reverse()]).to.deep.equal([5,4,3,2,1]);
  });

  it('can traverse an equal range', () => {
    const t1 = new AVL<number>((a, b) => a < b);
    t1.add(1);
    t1.add(2);
    t1.add(3);
    t1.add(3);
    t1.add(3);
    t1.add(4);
    t1.add(5);
    expect([...t1.equalKeys(7)]).to.deep.equal([]);
    expect([...t1.equalKeys(3)]).to.deep.equal([3,3,3]);
  });


});

