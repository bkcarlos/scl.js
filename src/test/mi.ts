
import { expect } from "chai"

import scl from "../index"
import "../list/double/register"
import "../hash/register"
import "../avl/register"

function addSeqIndexTests(create) {
  
  it('can append elements', () => {
    const mi = create();
    mi.append(1)
    mi.append(2)
    mi.append(3)
    expect([...mi]).to.deep.equal([1, 2, 3])
  })

  it('can prepend elements', () => {
    const mi = create();
    mi.prepend(1)
    mi.prepend(2)
    mi.prepend(3)
    expect([...mi]).to.deep.equal([3, 2, 1])
  })

  it('can insert an element after another', () => {
    const mi = create()
    const [added1, pos1] = mi.append(1)
    mi.append(3)
    const [added2, pos2] = mi.insertAfter(2, pos1);
    expect(added2).to.be.true
    expect(pos2.value).to.equal(2)
    const n = pos2.next()
    expect(n).to.not.be.null
    expect(n.value).to.equal(3)
  })

  it('can get the next from a given position', () => {
    const mi = create();
    mi.append(1)
    const [added, pos] = mi.append(2)
    mi.append(3)
    const n = pos.next()
    expect(n).to.not.be.null
    expect(n.value).to.equal(3);
  })

}

describe('a simple sequenced multi-index', () => {
  addSeqIndexTests(() => scl().list().build());
})


describe('a sequenced hash-index', () => {
  addSeqIndexTests(() => scl().list().hash().build());
})

describe('a multi-index builder', () => {

  it('can create a simple list', () => {

    const els = scl<number>().list().build();

    els.append(1);
    els.append(2);
    els.append(3);
    els.append(4);
    expect([...els]).to.deep.equal([1, 2, 3, 4]);

  });

  it('can create a simple hash', () => {

    const els = scl<number>()
      .hash(el => el)
      .build();

    els.add(1);
    els.add(2);
    els.add(3);
    els.add(4);
    expect(els.has(1)).to.be.true
    expect(els.has(2)).to.be.true
    expect(els.has(3)).to.be.true
    expect(els.has(4)).to.be.true
    expect(els.has(5)).to.be.false

  });

  it('can create a list hash', () => {
    const els = scl<number>().list().hash().build();
    els.append(1);
    els.append(2);
    els.append(3);
    els.append(4);
    expect([...els]).to.deep.equal([1,2,3,4]);
    expect(els.has(1)).to.be.true
    expect(els.has(2)).to.be.true
    expect(els.has(3)).to.be.true
    expect(els.has(4)).to.be.true
    expect(els.has(5)).to.be.false
  });

  it('can assign names to indices', () => {
    const els = scl<number>().list().named('foo').hash().named('bar').build();
    expect(els.index('foo')).to.equal(els.index(0))
    expect(els.index('bar')).to.equal(els.index(1))
  });

});

describe('the README example', () => {

  it('works', () => {

    interface Employee {
      id: number;
      name: string;
      age: number;
      salary: number;
    }

    const employees = scl()
      .list()
      .hash('id')
      .unique('id')
      .hash('name')
      .avl('age')
      .avl('salary').reverse()
      .build();

    employees.append({ id: 3, name: 'Bob', age: 32, salary: 1800 });
    employees.append({ id: 1, name: 'Jane', age: 45, salary: 3000 });
    employees.append({ id: 2, name: 'Fred', age: 21, salary: 2500 });

    expect([...employees.index('salary')].map(e => e.name)).to.deep.equal(['Jane', 'Fred', 'Bob']);

    const pos = employees.index('name').find('Bob');

    expect(pos.prev('salary').value.name).to.equal('Fred')
    expect(pos.next('age').value.name).to.equal('Jane');
    employees.deleteAt(pos);

    expect([...employees].map(e => e.name)).to.deep.equal(['Jane', 'Fred']);

  });

});
