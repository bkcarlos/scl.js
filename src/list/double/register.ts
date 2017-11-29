
import DoubleLinkedList from "../double"
import Types from "../../types"
import { SeqIndex, registerContainer } from "../../mi"

registerContainer({
  name: 'list',
  kind: 'sequence',
  elementType: Types.Element(),
  paramTypes: [],
  build(...args) {
    return new SeqIndex(new DoubleLinkedList<any>());
  }
});

