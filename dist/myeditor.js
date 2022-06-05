(() => {
  var __async = (__this, __arguments, generator) => {
    return new Promise((resolve, reject) => {
      var fulfilled = (value) => {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      };
      var rejected = (value) => {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      };
      var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
      step((generator = generator.apply(__this, __arguments)).next());
    });
  };

  // node_modules/orderedmap/dist/index-es.js
  function OrderedMap(content) {
    this.content = content;
  }
  OrderedMap.prototype = {
    constructor: OrderedMap,
    find: function(key2) {
      for (var i = 0; i < this.content.length; i += 2)
        if (this.content[i] === key2)
          return i;
      return -1;
    },
    get: function(key2) {
      var found2 = this.find(key2);
      return found2 == -1 ? void 0 : this.content[found2 + 1];
    },
    update: function(key2, value, newKey) {
      var self = newKey && newKey != key2 ? this.remove(newKey) : this;
      var found2 = self.find(key2), content = self.content.slice();
      if (found2 == -1) {
        content.push(newKey || key2, value);
      } else {
        content[found2 + 1] = value;
        if (newKey)
          content[found2] = newKey;
      }
      return new OrderedMap(content);
    },
    remove: function(key2) {
      var found2 = this.find(key2);
      if (found2 == -1)
        return this;
      var content = this.content.slice();
      content.splice(found2, 2);
      return new OrderedMap(content);
    },
    addToStart: function(key2, value) {
      return new OrderedMap([key2, value].concat(this.remove(key2).content));
    },
    addToEnd: function(key2, value) {
      var content = this.remove(key2).content.slice();
      content.push(key2, value);
      return new OrderedMap(content);
    },
    addBefore: function(place, key2, value) {
      var without = this.remove(key2), content = without.content.slice();
      var found2 = without.find(place);
      content.splice(found2 == -1 ? content.length : found2, 0, key2, value);
      return new OrderedMap(content);
    },
    forEach: function(f) {
      for (var i = 0; i < this.content.length; i += 2)
        f(this.content[i], this.content[i + 1]);
    },
    prepend: function(map2) {
      map2 = OrderedMap.from(map2);
      if (!map2.size)
        return this;
      return new OrderedMap(map2.content.concat(this.subtract(map2).content));
    },
    append: function(map2) {
      map2 = OrderedMap.from(map2);
      if (!map2.size)
        return this;
      return new OrderedMap(this.subtract(map2).content.concat(map2.content));
    },
    subtract: function(map2) {
      var result = this;
      map2 = OrderedMap.from(map2);
      for (var i = 0; i < map2.content.length; i += 2)
        result = result.remove(map2.content[i]);
      return result;
    },
    get size() {
      return this.content.length >> 1;
    }
  };
  OrderedMap.from = function(value) {
    if (value instanceof OrderedMap)
      return value;
    var content = [];
    if (value)
      for (var prop in value)
        content.push(prop, value[prop]);
    return new OrderedMap(content);
  };
  var index_es_default = OrderedMap;

  // node_modules/prosemirror-model/dist/index.js
  function findDiffStart(a, b, pos) {
    for (let i = 0; ; i++) {
      if (i == a.childCount || i == b.childCount)
        return a.childCount == b.childCount ? null : pos;
      let childA = a.child(i), childB = b.child(i);
      if (childA == childB) {
        pos += childA.nodeSize;
        continue;
      }
      if (!childA.sameMarkup(childB))
        return pos;
      if (childA.isText && childA.text != childB.text) {
        for (let j = 0; childA.text[j] == childB.text[j]; j++)
          pos++;
        return pos;
      }
      if (childA.content.size || childB.content.size) {
        let inner = findDiffStart(childA.content, childB.content, pos + 1);
        if (inner != null)
          return inner;
      }
      pos += childA.nodeSize;
    }
  }
  function findDiffEnd(a, b, posA, posB) {
    for (let iA = a.childCount, iB = b.childCount; ; ) {
      if (iA == 0 || iB == 0)
        return iA == iB ? null : { a: posA, b: posB };
      let childA = a.child(--iA), childB = b.child(--iB), size = childA.nodeSize;
      if (childA == childB) {
        posA -= size;
        posB -= size;
        continue;
      }
      if (!childA.sameMarkup(childB))
        return { a: posA, b: posB };
      if (childA.isText && childA.text != childB.text) {
        let same = 0, minSize = Math.min(childA.text.length, childB.text.length);
        while (same < minSize && childA.text[childA.text.length - same - 1] == childB.text[childB.text.length - same - 1]) {
          same++;
          posA--;
          posB--;
        }
        return { a: posA, b: posB };
      }
      if (childA.content.size || childB.content.size) {
        let inner = findDiffEnd(childA.content, childB.content, posA - 1, posB - 1);
        if (inner)
          return inner;
      }
      posA -= size;
      posB -= size;
    }
  }
  var Fragment = class {
    constructor(content, size) {
      this.content = content;
      this.size = size || 0;
      if (size == null)
        for (let i = 0; i < content.length; i++)
          this.size += content[i].nodeSize;
    }
    nodesBetween(from2, to, f, nodeStart = 0, parent) {
      for (let i = 0, pos = 0; pos < to; i++) {
        let child = this.content[i], end = pos + child.nodeSize;
        if (end > from2 && f(child, nodeStart + pos, parent || null, i) !== false && child.content.size) {
          let start = pos + 1;
          child.nodesBetween(Math.max(0, from2 - start), Math.min(child.content.size, to - start), f, nodeStart + start);
        }
        pos = end;
      }
    }
    descendants(f) {
      this.nodesBetween(0, this.size, f);
    }
    textBetween(from2, to, blockSeparator, leafText) {
      let text = "", separated = true;
      this.nodesBetween(from2, to, (node, pos) => {
        if (node.isText) {
          text += node.text.slice(Math.max(from2, pos) - pos, to - pos);
          separated = !blockSeparator;
        } else if (node.isLeaf && leafText) {
          text += typeof leafText === "function" ? leafText(node) : leafText;
          separated = !blockSeparator;
        } else if (!separated && node.isBlock) {
          text += blockSeparator;
          separated = true;
        }
      }, 0);
      return text;
    }
    append(other) {
      if (!other.size)
        return this;
      if (!this.size)
        return other;
      let last = this.lastChild, first = other.firstChild, content = this.content.slice(), i = 0;
      if (last.isText && last.sameMarkup(first)) {
        content[content.length - 1] = last.withText(last.text + first.text);
        i = 1;
      }
      for (; i < other.content.length; i++)
        content.push(other.content[i]);
      return new Fragment(content, this.size + other.size);
    }
    cut(from2, to = this.size) {
      if (from2 == 0 && to == this.size)
        return this;
      let result = [], size = 0;
      if (to > from2)
        for (let i = 0, pos = 0; pos < to; i++) {
          let child = this.content[i], end = pos + child.nodeSize;
          if (end > from2) {
            if (pos < from2 || end > to) {
              if (child.isText)
                child = child.cut(Math.max(0, from2 - pos), Math.min(child.text.length, to - pos));
              else
                child = child.cut(Math.max(0, from2 - pos - 1), Math.min(child.content.size, to - pos - 1));
            }
            result.push(child);
            size += child.nodeSize;
          }
          pos = end;
        }
      return new Fragment(result, size);
    }
    cutByIndex(from2, to) {
      if (from2 == to)
        return Fragment.empty;
      if (from2 == 0 && to == this.content.length)
        return this;
      return new Fragment(this.content.slice(from2, to));
    }
    replaceChild(index, node) {
      let current = this.content[index];
      if (current == node)
        return this;
      let copy2 = this.content.slice();
      let size = this.size + node.nodeSize - current.nodeSize;
      copy2[index] = node;
      return new Fragment(copy2, size);
    }
    addToStart(node) {
      return new Fragment([node].concat(this.content), this.size + node.nodeSize);
    }
    addToEnd(node) {
      return new Fragment(this.content.concat(node), this.size + node.nodeSize);
    }
    eq(other) {
      if (this.content.length != other.content.length)
        return false;
      for (let i = 0; i < this.content.length; i++)
        if (!this.content[i].eq(other.content[i]))
          return false;
      return true;
    }
    get firstChild() {
      return this.content.length ? this.content[0] : null;
    }
    get lastChild() {
      return this.content.length ? this.content[this.content.length - 1] : null;
    }
    get childCount() {
      return this.content.length;
    }
    child(index) {
      let found2 = this.content[index];
      if (!found2)
        throw new RangeError("Index " + index + " out of range for " + this);
      return found2;
    }
    maybeChild(index) {
      return this.content[index] || null;
    }
    forEach(f) {
      for (let i = 0, p = 0; i < this.content.length; i++) {
        let child = this.content[i];
        f(child, p, i);
        p += child.nodeSize;
      }
    }
    findDiffStart(other, pos = 0) {
      return findDiffStart(this, other, pos);
    }
    findDiffEnd(other, pos = this.size, otherPos = other.size) {
      return findDiffEnd(this, other, pos, otherPos);
    }
    findIndex(pos, round = -1) {
      if (pos == 0)
        return retIndex(0, pos);
      if (pos == this.size)
        return retIndex(this.content.length, pos);
      if (pos > this.size || pos < 0)
        throw new RangeError(`Position ${pos} outside of fragment (${this})`);
      for (let i = 0, curPos = 0; ; i++) {
        let cur = this.child(i), end = curPos + cur.nodeSize;
        if (end >= pos) {
          if (end == pos || round > 0)
            return retIndex(i + 1, end);
          return retIndex(i, curPos);
        }
        curPos = end;
      }
    }
    toString() {
      return "<" + this.toStringInner() + ">";
    }
    toStringInner() {
      return this.content.join(", ");
    }
    toJSON() {
      return this.content.length ? this.content.map((n) => n.toJSON()) : null;
    }
    static fromJSON(schema2, value) {
      if (!value)
        return Fragment.empty;
      if (!Array.isArray(value))
        throw new RangeError("Invalid input for Fragment.fromJSON");
      return new Fragment(value.map(schema2.nodeFromJSON));
    }
    static fromArray(array) {
      if (!array.length)
        return Fragment.empty;
      let joined, size = 0;
      for (let i = 0; i < array.length; i++) {
        let node = array[i];
        size += node.nodeSize;
        if (i && node.isText && array[i - 1].sameMarkup(node)) {
          if (!joined)
            joined = array.slice(0, i);
          joined[joined.length - 1] = node.withText(joined[joined.length - 1].text + node.text);
        } else if (joined) {
          joined.push(node);
        }
      }
      return new Fragment(joined || array, size);
    }
    static from(nodes2) {
      if (!nodes2)
        return Fragment.empty;
      if (nodes2 instanceof Fragment)
        return nodes2;
      if (Array.isArray(nodes2))
        return this.fromArray(nodes2);
      if (nodes2.attrs)
        return new Fragment([nodes2], nodes2.nodeSize);
      throw new RangeError("Can not convert " + nodes2 + " to a Fragment" + (nodes2.nodesBetween ? " (looks like multiple versions of prosemirror-model were loaded)" : ""));
    }
  };
  Fragment.empty = new Fragment([], 0);
  var found = { index: 0, offset: 0 };
  function retIndex(index, offset) {
    found.index = index;
    found.offset = offset;
    return found;
  }
  function compareDeep(a, b) {
    if (a === b)
      return true;
    if (!(a && typeof a == "object") || !(b && typeof b == "object"))
      return false;
    let array = Array.isArray(a);
    if (Array.isArray(b) != array)
      return false;
    if (array) {
      if (a.length != b.length)
        return false;
      for (let i = 0; i < a.length; i++)
        if (!compareDeep(a[i], b[i]))
          return false;
    } else {
      for (let p in a)
        if (!(p in b) || !compareDeep(a[p], b[p]))
          return false;
      for (let p in b)
        if (!(p in a))
          return false;
    }
    return true;
  }
  var Mark = class {
    constructor(type, attrs) {
      this.type = type;
      this.attrs = attrs;
    }
    addToSet(set) {
      let copy2, placed = false;
      for (let i = 0; i < set.length; i++) {
        let other = set[i];
        if (this.eq(other))
          return set;
        if (this.type.excludes(other.type)) {
          if (!copy2)
            copy2 = set.slice(0, i);
        } else if (other.type.excludes(this.type)) {
          return set;
        } else {
          if (!placed && other.type.rank > this.type.rank) {
            if (!copy2)
              copy2 = set.slice(0, i);
            copy2.push(this);
            placed = true;
          }
          if (copy2)
            copy2.push(other);
        }
      }
      if (!copy2)
        copy2 = set.slice();
      if (!placed)
        copy2.push(this);
      return copy2;
    }
    removeFromSet(set) {
      for (let i = 0; i < set.length; i++)
        if (this.eq(set[i]))
          return set.slice(0, i).concat(set.slice(i + 1));
      return set;
    }
    isInSet(set) {
      for (let i = 0; i < set.length; i++)
        if (this.eq(set[i]))
          return true;
      return false;
    }
    eq(other) {
      return this == other || this.type == other.type && compareDeep(this.attrs, other.attrs);
    }
    toJSON() {
      let obj = { type: this.type.name };
      for (let _ in this.attrs) {
        obj.attrs = this.attrs;
        break;
      }
      return obj;
    }
    static fromJSON(schema2, json) {
      if (!json)
        throw new RangeError("Invalid input for Mark.fromJSON");
      let type = schema2.marks[json.type];
      if (!type)
        throw new RangeError(`There is no mark type ${json.type} in this schema`);
      return type.create(json.attrs);
    }
    static sameSet(a, b) {
      if (a == b)
        return true;
      if (a.length != b.length)
        return false;
      for (let i = 0; i < a.length; i++)
        if (!a[i].eq(b[i]))
          return false;
      return true;
    }
    static setFrom(marks2) {
      if (!marks2 || Array.isArray(marks2) && marks2.length == 0)
        return Mark.none;
      if (marks2 instanceof Mark)
        return [marks2];
      let copy2 = marks2.slice();
      copy2.sort((a, b) => a.type.rank - b.type.rank);
      return copy2;
    }
  };
  Mark.none = [];
  var ReplaceError = class extends Error {
  };
  var Slice = class {
    constructor(content, openStart, openEnd) {
      this.content = content;
      this.openStart = openStart;
      this.openEnd = openEnd;
    }
    get size() {
      return this.content.size - this.openStart - this.openEnd;
    }
    insertAt(pos, fragment) {
      let content = insertInto(this.content, pos + this.openStart, fragment);
      return content && new Slice(content, this.openStart, this.openEnd);
    }
    removeBetween(from2, to) {
      return new Slice(removeRange(this.content, from2 + this.openStart, to + this.openStart), this.openStart, this.openEnd);
    }
    eq(other) {
      return this.content.eq(other.content) && this.openStart == other.openStart && this.openEnd == other.openEnd;
    }
    toString() {
      return this.content + "(" + this.openStart + "," + this.openEnd + ")";
    }
    toJSON() {
      if (!this.content.size)
        return null;
      let json = { content: this.content.toJSON() };
      if (this.openStart > 0)
        json.openStart = this.openStart;
      if (this.openEnd > 0)
        json.openEnd = this.openEnd;
      return json;
    }
    static fromJSON(schema2, json) {
      if (!json)
        return Slice.empty;
      let openStart = json.openStart || 0, openEnd = json.openEnd || 0;
      if (typeof openStart != "number" || typeof openEnd != "number")
        throw new RangeError("Invalid input for Slice.fromJSON");
      return new Slice(Fragment.fromJSON(schema2, json.content), openStart, openEnd);
    }
    static maxOpen(fragment, openIsolating = true) {
      let openStart = 0, openEnd = 0;
      for (let n = fragment.firstChild; n && !n.isLeaf && (openIsolating || !n.type.spec.isolating); n = n.firstChild)
        openStart++;
      for (let n = fragment.lastChild; n && !n.isLeaf && (openIsolating || !n.type.spec.isolating); n = n.lastChild)
        openEnd++;
      return new Slice(fragment, openStart, openEnd);
    }
  };
  Slice.empty = new Slice(Fragment.empty, 0, 0);
  function removeRange(content, from2, to) {
    let { index, offset } = content.findIndex(from2), child = content.maybeChild(index);
    let { index: indexTo, offset: offsetTo } = content.findIndex(to);
    if (offset == from2 || child.isText) {
      if (offsetTo != to && !content.child(indexTo).isText)
        throw new RangeError("Removing non-flat range");
      return content.cut(0, from2).append(content.cut(to));
    }
    if (index != indexTo)
      throw new RangeError("Removing non-flat range");
    return content.replaceChild(index, child.copy(removeRange(child.content, from2 - offset - 1, to - offset - 1)));
  }
  function insertInto(content, dist, insert, parent) {
    let { index, offset } = content.findIndex(dist), child = content.maybeChild(index);
    if (offset == dist || child.isText) {
      if (parent && !parent.canReplace(index, index, insert))
        return null;
      return content.cut(0, dist).append(insert).append(content.cut(dist));
    }
    let inner = insertInto(child.content, dist - offset - 1, insert);
    return inner && content.replaceChild(index, child.copy(inner));
  }
  function replace($from, $to, slice2) {
    if (slice2.openStart > $from.depth)
      throw new ReplaceError("Inserted content deeper than insertion position");
    if ($from.depth - slice2.openStart != $to.depth - slice2.openEnd)
      throw new ReplaceError("Inconsistent open depths");
    return replaceOuter($from, $to, slice2, 0);
  }
  function replaceOuter($from, $to, slice2, depth) {
    let index = $from.index(depth), node = $from.node(depth);
    if (index == $to.index(depth) && depth < $from.depth - slice2.openStart) {
      let inner = replaceOuter($from, $to, slice2, depth + 1);
      return node.copy(node.content.replaceChild(index, inner));
    } else if (!slice2.content.size) {
      return close(node, replaceTwoWay($from, $to, depth));
    } else if (!slice2.openStart && !slice2.openEnd && $from.depth == depth && $to.depth == depth) {
      let parent = $from.parent, content = parent.content;
      return close(parent, content.cut(0, $from.parentOffset).append(slice2.content).append(content.cut($to.parentOffset)));
    } else {
      let { start, end } = prepareSliceForReplace(slice2, $from);
      return close(node, replaceThreeWay($from, start, end, $to, depth));
    }
  }
  function checkJoin(main, sub) {
    if (!sub.type.compatibleContent(main.type))
      throw new ReplaceError("Cannot join " + sub.type.name + " onto " + main.type.name);
  }
  function joinable($before, $after, depth) {
    let node = $before.node(depth);
    checkJoin(node, $after.node(depth));
    return node;
  }
  function addNode(child, target) {
    let last = target.length - 1;
    if (last >= 0 && child.isText && child.sameMarkup(target[last]))
      target[last] = child.withText(target[last].text + child.text);
    else
      target.push(child);
  }
  function addRange($start, $end, depth, target) {
    let node = ($end || $start).node(depth);
    let startIndex = 0, endIndex = $end ? $end.index(depth) : node.childCount;
    if ($start) {
      startIndex = $start.index(depth);
      if ($start.depth > depth) {
        startIndex++;
      } else if ($start.textOffset) {
        addNode($start.nodeAfter, target);
        startIndex++;
      }
    }
    for (let i = startIndex; i < endIndex; i++)
      addNode(node.child(i), target);
    if ($end && $end.depth == depth && $end.textOffset)
      addNode($end.nodeBefore, target);
  }
  function close(node, content) {
    if (!node.type.validContent(content))
      throw new ReplaceError("Invalid content for node " + node.type.name);
    return node.copy(content);
  }
  function replaceThreeWay($from, $start, $end, $to, depth) {
    let openStart = $from.depth > depth && joinable($from, $start, depth + 1);
    let openEnd = $to.depth > depth && joinable($end, $to, depth + 1);
    let content = [];
    addRange(null, $from, depth, content);
    if (openStart && openEnd && $start.index(depth) == $end.index(depth)) {
      checkJoin(openStart, openEnd);
      addNode(close(openStart, replaceThreeWay($from, $start, $end, $to, depth + 1)), content);
    } else {
      if (openStart)
        addNode(close(openStart, replaceTwoWay($from, $start, depth + 1)), content);
      addRange($start, $end, depth, content);
      if (openEnd)
        addNode(close(openEnd, replaceTwoWay($end, $to, depth + 1)), content);
    }
    addRange($to, null, depth, content);
    return new Fragment(content);
  }
  function replaceTwoWay($from, $to, depth) {
    let content = [];
    addRange(null, $from, depth, content);
    if ($from.depth > depth) {
      let type = joinable($from, $to, depth + 1);
      addNode(close(type, replaceTwoWay($from, $to, depth + 1)), content);
    }
    addRange($to, null, depth, content);
    return new Fragment(content);
  }
  function prepareSliceForReplace(slice2, $along) {
    let extra = $along.depth - slice2.openStart, parent = $along.node(extra);
    let node = parent.copy(slice2.content);
    for (let i = extra - 1; i >= 0; i--)
      node = $along.node(i).copy(Fragment.from(node));
    return {
      start: node.resolveNoCache(slice2.openStart + extra),
      end: node.resolveNoCache(node.content.size - slice2.openEnd - extra)
    };
  }
  var ResolvedPos = class {
    constructor(pos, path, parentOffset) {
      this.pos = pos;
      this.path = path;
      this.parentOffset = parentOffset;
      this.depth = path.length / 3 - 1;
    }
    resolveDepth(val) {
      if (val == null)
        return this.depth;
      if (val < 0)
        return this.depth + val;
      return val;
    }
    get parent() {
      return this.node(this.depth);
    }
    get doc() {
      return this.node(0);
    }
    node(depth) {
      return this.path[this.resolveDepth(depth) * 3];
    }
    index(depth) {
      return this.path[this.resolveDepth(depth) * 3 + 1];
    }
    indexAfter(depth) {
      depth = this.resolveDepth(depth);
      return this.index(depth) + (depth == this.depth && !this.textOffset ? 0 : 1);
    }
    start(depth) {
      depth = this.resolveDepth(depth);
      return depth == 0 ? 0 : this.path[depth * 3 - 1] + 1;
    }
    end(depth) {
      depth = this.resolveDepth(depth);
      return this.start(depth) + this.node(depth).content.size;
    }
    before(depth) {
      depth = this.resolveDepth(depth);
      if (!depth)
        throw new RangeError("There is no position before the top-level node");
      return depth == this.depth + 1 ? this.pos : this.path[depth * 3 - 1];
    }
    after(depth) {
      depth = this.resolveDepth(depth);
      if (!depth)
        throw new RangeError("There is no position after the top-level node");
      return depth == this.depth + 1 ? this.pos : this.path[depth * 3 - 1] + this.path[depth * 3].nodeSize;
    }
    get textOffset() {
      return this.pos - this.path[this.path.length - 1];
    }
    get nodeAfter() {
      let parent = this.parent, index = this.index(this.depth);
      if (index == parent.childCount)
        return null;
      let dOff = this.pos - this.path[this.path.length - 1], child = parent.child(index);
      return dOff ? parent.child(index).cut(dOff) : child;
    }
    get nodeBefore() {
      let index = this.index(this.depth);
      let dOff = this.pos - this.path[this.path.length - 1];
      if (dOff)
        return this.parent.child(index).cut(0, dOff);
      return index == 0 ? null : this.parent.child(index - 1);
    }
    posAtIndex(index, depth) {
      depth = this.resolveDepth(depth);
      let node = this.path[depth * 3], pos = depth == 0 ? 0 : this.path[depth * 3 - 1] + 1;
      for (let i = 0; i < index; i++)
        pos += node.child(i).nodeSize;
      return pos;
    }
    marks() {
      let parent = this.parent, index = this.index();
      if (parent.content.size == 0)
        return Mark.none;
      if (this.textOffset)
        return parent.child(index).marks;
      let main = parent.maybeChild(index - 1), other = parent.maybeChild(index);
      if (!main) {
        let tmp = main;
        main = other;
        other = tmp;
      }
      let marks2 = main.marks;
      for (var i = 0; i < marks2.length; i++)
        if (marks2[i].type.spec.inclusive === false && (!other || !marks2[i].isInSet(other.marks)))
          marks2 = marks2[i--].removeFromSet(marks2);
      return marks2;
    }
    marksAcross($end) {
      let after = this.parent.maybeChild(this.index());
      if (!after || !after.isInline)
        return null;
      let marks2 = after.marks, next = $end.parent.maybeChild($end.index());
      for (var i = 0; i < marks2.length; i++)
        if (marks2[i].type.spec.inclusive === false && (!next || !marks2[i].isInSet(next.marks)))
          marks2 = marks2[i--].removeFromSet(marks2);
      return marks2;
    }
    sharedDepth(pos) {
      for (let depth = this.depth; depth > 0; depth--)
        if (this.start(depth) <= pos && this.end(depth) >= pos)
          return depth;
      return 0;
    }
    blockRange(other = this, pred) {
      if (other.pos < this.pos)
        return other.blockRange(this);
      for (let d = this.depth - (this.parent.inlineContent || this.pos == other.pos ? 1 : 0); d >= 0; d--)
        if (other.pos <= this.end(d) && (!pred || pred(this.node(d))))
          return new NodeRange(this, other, d);
      return null;
    }
    sameParent(other) {
      return this.pos - this.parentOffset == other.pos - other.parentOffset;
    }
    max(other) {
      return other.pos > this.pos ? other : this;
    }
    min(other) {
      return other.pos < this.pos ? other : this;
    }
    toString() {
      let str = "";
      for (let i = 1; i <= this.depth; i++)
        str += (str ? "/" : "") + this.node(i).type.name + "_" + this.index(i - 1);
      return str + ":" + this.parentOffset;
    }
    static resolve(doc3, pos) {
      if (!(pos >= 0 && pos <= doc3.content.size))
        throw new RangeError("Position " + pos + " out of range");
      let path = [];
      let start = 0, parentOffset = pos;
      for (let node = doc3; ; ) {
        let { index, offset } = node.content.findIndex(parentOffset);
        let rem = parentOffset - offset;
        path.push(node, index, start + offset);
        if (!rem)
          break;
        node = node.child(index);
        if (node.isText)
          break;
        parentOffset = rem - 1;
        start += offset + 1;
      }
      return new ResolvedPos(pos, path, parentOffset);
    }
    static resolveCached(doc3, pos) {
      for (let i = 0; i < resolveCache.length; i++) {
        let cached = resolveCache[i];
        if (cached.pos == pos && cached.doc == doc3)
          return cached;
      }
      let result = resolveCache[resolveCachePos] = ResolvedPos.resolve(doc3, pos);
      resolveCachePos = (resolveCachePos + 1) % resolveCacheSize;
      return result;
    }
  };
  var resolveCache = [];
  var resolveCachePos = 0;
  var resolveCacheSize = 12;
  var NodeRange = class {
    constructor($from, $to, depth) {
      this.$from = $from;
      this.$to = $to;
      this.depth = depth;
    }
    get start() {
      return this.$from.before(this.depth + 1);
    }
    get end() {
      return this.$to.after(this.depth + 1);
    }
    get parent() {
      return this.$from.node(this.depth);
    }
    get startIndex() {
      return this.$from.index(this.depth);
    }
    get endIndex() {
      return this.$to.indexAfter(this.depth);
    }
  };
  var emptyAttrs = /* @__PURE__ */ Object.create(null);
  var Node2 = class {
    constructor(type, attrs, content, marks2 = Mark.none) {
      this.type = type;
      this.attrs = attrs;
      this.marks = marks2;
      this.content = content || Fragment.empty;
    }
    get nodeSize() {
      return this.isLeaf ? 1 : 2 + this.content.size;
    }
    get childCount() {
      return this.content.childCount;
    }
    child(index) {
      return this.content.child(index);
    }
    maybeChild(index) {
      return this.content.maybeChild(index);
    }
    forEach(f) {
      this.content.forEach(f);
    }
    nodesBetween(from2, to, f, startPos = 0) {
      this.content.nodesBetween(from2, to, f, startPos, this);
    }
    descendants(f) {
      this.nodesBetween(0, this.content.size, f);
    }
    get textContent() {
      return this.textBetween(0, this.content.size, "");
    }
    textBetween(from2, to, blockSeparator, leafText) {
      return this.content.textBetween(from2, to, blockSeparator, leafText);
    }
    get firstChild() {
      return this.content.firstChild;
    }
    get lastChild() {
      return this.content.lastChild;
    }
    eq(other) {
      return this == other || this.sameMarkup(other) && this.content.eq(other.content);
    }
    sameMarkup(other) {
      return this.hasMarkup(other.type, other.attrs, other.marks);
    }
    hasMarkup(type, attrs, marks2) {
      return this.type == type && compareDeep(this.attrs, attrs || type.defaultAttrs || emptyAttrs) && Mark.sameSet(this.marks, marks2 || Mark.none);
    }
    copy(content = null) {
      if (content == this.content)
        return this;
      return new Node2(this.type, this.attrs, content, this.marks);
    }
    mark(marks2) {
      return marks2 == this.marks ? this : new Node2(this.type, this.attrs, this.content, marks2);
    }
    cut(from2, to = this.content.size) {
      if (from2 == 0 && to == this.content.size)
        return this;
      return this.copy(this.content.cut(from2, to));
    }
    slice(from2, to = this.content.size, includeParents = false) {
      if (from2 == to)
        return Slice.empty;
      let $from = this.resolve(from2), $to = this.resolve(to);
      let depth = includeParents ? 0 : $from.sharedDepth(to);
      let start = $from.start(depth), node = $from.node(depth);
      let content = node.content.cut($from.pos - start, $to.pos - start);
      return new Slice(content, $from.depth - depth, $to.depth - depth);
    }
    replace(from2, to, slice2) {
      return replace(this.resolve(from2), this.resolve(to), slice2);
    }
    nodeAt(pos) {
      for (let node = this; ; ) {
        let { index, offset } = node.content.findIndex(pos);
        node = node.maybeChild(index);
        if (!node)
          return null;
        if (offset == pos || node.isText)
          return node;
        pos -= offset + 1;
      }
    }
    childAfter(pos) {
      let { index, offset } = this.content.findIndex(pos);
      return { node: this.content.maybeChild(index), index, offset };
    }
    childBefore(pos) {
      if (pos == 0)
        return { node: null, index: 0, offset: 0 };
      let { index, offset } = this.content.findIndex(pos);
      if (offset < pos)
        return { node: this.content.child(index), index, offset };
      let node = this.content.child(index - 1);
      return { node, index: index - 1, offset: offset - node.nodeSize };
    }
    resolve(pos) {
      return ResolvedPos.resolveCached(this, pos);
    }
    resolveNoCache(pos) {
      return ResolvedPos.resolve(this, pos);
    }
    rangeHasMark(from2, to, type) {
      let found2 = false;
      if (to > from2)
        this.nodesBetween(from2, to, (node) => {
          if (type.isInSet(node.marks))
            found2 = true;
          return !found2;
        });
      return found2;
    }
    get isBlock() {
      return this.type.isBlock;
    }
    get isTextblock() {
      return this.type.isTextblock;
    }
    get inlineContent() {
      return this.type.inlineContent;
    }
    get isInline() {
      return this.type.isInline;
    }
    get isText() {
      return this.type.isText;
    }
    get isLeaf() {
      return this.type.isLeaf;
    }
    get isAtom() {
      return this.type.isAtom;
    }
    toString() {
      if (this.type.spec.toDebugString)
        return this.type.spec.toDebugString(this);
      let name = this.type.name;
      if (this.content.size)
        name += "(" + this.content.toStringInner() + ")";
      return wrapMarks(this.marks, name);
    }
    contentMatchAt(index) {
      let match = this.type.contentMatch.matchFragment(this.content, 0, index);
      if (!match)
        throw new Error("Called contentMatchAt on a node with invalid content");
      return match;
    }
    canReplace(from2, to, replacement = Fragment.empty, start = 0, end = replacement.childCount) {
      let one = this.contentMatchAt(from2).matchFragment(replacement, start, end);
      let two = one && one.matchFragment(this.content, to);
      if (!two || !two.validEnd)
        return false;
      for (let i = start; i < end; i++)
        if (!this.type.allowsMarks(replacement.child(i).marks))
          return false;
      return true;
    }
    canReplaceWith(from2, to, type, marks2) {
      if (marks2 && !this.type.allowsMarks(marks2))
        return false;
      let start = this.contentMatchAt(from2).matchType(type);
      let end = start && start.matchFragment(this.content, to);
      return end ? end.validEnd : false;
    }
    canAppend(other) {
      if (other.content.size)
        return this.canReplace(this.childCount, this.childCount, other.content);
      else
        return this.type.compatibleContent(other.type);
    }
    check() {
      if (!this.type.validContent(this.content))
        throw new RangeError(`Invalid content for node ${this.type.name}: ${this.content.toString().slice(0, 50)}`);
      let copy2 = Mark.none;
      for (let i = 0; i < this.marks.length; i++)
        copy2 = this.marks[i].addToSet(copy2);
      if (!Mark.sameSet(copy2, this.marks))
        throw new RangeError(`Invalid collection of marks for node ${this.type.name}: ${this.marks.map((m) => m.type.name)}`);
      this.content.forEach((node) => node.check());
    }
    toJSON() {
      let obj = { type: this.type.name };
      for (let _ in this.attrs) {
        obj.attrs = this.attrs;
        break;
      }
      if (this.content.size)
        obj.content = this.content.toJSON();
      if (this.marks.length)
        obj.marks = this.marks.map((n) => n.toJSON());
      return obj;
    }
    static fromJSON(schema2, json) {
      if (!json)
        throw new RangeError("Invalid input for Node.fromJSON");
      let marks2 = null;
      if (json.marks) {
        if (!Array.isArray(json.marks))
          throw new RangeError("Invalid mark data for Node.fromJSON");
        marks2 = json.marks.map(schema2.markFromJSON);
      }
      if (json.type == "text") {
        if (typeof json.text != "string")
          throw new RangeError("Invalid text node in JSON");
        return schema2.text(json.text, marks2);
      }
      let content = Fragment.fromJSON(schema2, json.content);
      return schema2.nodeType(json.type).create(json.attrs, content, marks2);
    }
  };
  Node2.prototype.text = void 0;
  var TextNode = class extends Node2 {
    constructor(type, attrs, content, marks2) {
      super(type, attrs, null, marks2);
      if (!content)
        throw new RangeError("Empty text nodes are not allowed");
      this.text = content;
    }
    toString() {
      if (this.type.spec.toDebugString)
        return this.type.spec.toDebugString(this);
      return wrapMarks(this.marks, JSON.stringify(this.text));
    }
    get textContent() {
      return this.text;
    }
    textBetween(from2, to) {
      return this.text.slice(from2, to);
    }
    get nodeSize() {
      return this.text.length;
    }
    mark(marks2) {
      return marks2 == this.marks ? this : new TextNode(this.type, this.attrs, this.text, marks2);
    }
    withText(text) {
      if (text == this.text)
        return this;
      return new TextNode(this.type, this.attrs, text, this.marks);
    }
    cut(from2 = 0, to = this.text.length) {
      if (from2 == 0 && to == this.text.length)
        return this;
      return this.withText(this.text.slice(from2, to));
    }
    eq(other) {
      return this.sameMarkup(other) && this.text == other.text;
    }
    toJSON() {
      let base2 = super.toJSON();
      base2.text = this.text;
      return base2;
    }
  };
  function wrapMarks(marks2, str) {
    for (let i = marks2.length - 1; i >= 0; i--)
      str = marks2[i].type.name + "(" + str + ")";
    return str;
  }
  var ContentMatch = class {
    constructor(validEnd) {
      this.validEnd = validEnd;
      this.next = [];
      this.wrapCache = [];
    }
    static parse(string, nodeTypes) {
      let stream = new TokenStream(string, nodeTypes);
      if (stream.next == null)
        return ContentMatch.empty;
      let expr = parseExpr(stream);
      if (stream.next)
        stream.err("Unexpected trailing text");
      let match = dfa(nfa(expr));
      checkForDeadEnds(match, stream);
      return match;
    }
    matchType(type) {
      for (let i = 0; i < this.next.length; i++)
        if (this.next[i].type == type)
          return this.next[i].next;
      return null;
    }
    matchFragment(frag, start = 0, end = frag.childCount) {
      let cur = this;
      for (let i = start; cur && i < end; i++)
        cur = cur.matchType(frag.child(i).type);
      return cur;
    }
    get inlineContent() {
      return this.next.length && this.next[0].type.isInline;
    }
    get defaultType() {
      for (let i = 0; i < this.next.length; i++) {
        let { type } = this.next[i];
        if (!(type.isText || type.hasRequiredAttrs()))
          return type;
      }
      return null;
    }
    compatible(other) {
      for (let i = 0; i < this.next.length; i++)
        for (let j = 0; j < other.next.length; j++)
          if (this.next[i].type == other.next[j].type)
            return true;
      return false;
    }
    fillBefore(after, toEnd = false, startIndex = 0) {
      let seen = [this];
      function search(match, types) {
        let finished = match.matchFragment(after, startIndex);
        if (finished && (!toEnd || finished.validEnd))
          return Fragment.from(types.map((tp) => tp.createAndFill()));
        for (let i = 0; i < match.next.length; i++) {
          let { type, next } = match.next[i];
          if (!(type.isText || type.hasRequiredAttrs()) && seen.indexOf(next) == -1) {
            seen.push(next);
            let found2 = search(next, types.concat(type));
            if (found2)
              return found2;
          }
        }
        return null;
      }
      return search(this, []);
    }
    findWrapping(target) {
      for (let i = 0; i < this.wrapCache.length; i += 2)
        if (this.wrapCache[i] == target)
          return this.wrapCache[i + 1];
      let computed = this.computeWrapping(target);
      this.wrapCache.push(target, computed);
      return computed;
    }
    computeWrapping(target) {
      let seen = /* @__PURE__ */ Object.create(null), active = [{ match: this, type: null, via: null }];
      while (active.length) {
        let current = active.shift(), match = current.match;
        if (match.matchType(target)) {
          let result = [];
          for (let obj = current; obj.type; obj = obj.via)
            result.push(obj.type);
          return result.reverse();
        }
        for (let i = 0; i < match.next.length; i++) {
          let { type, next } = match.next[i];
          if (!type.isLeaf && !type.hasRequiredAttrs() && !(type.name in seen) && (!current.type || next.validEnd)) {
            active.push({ match: type.contentMatch, type, via: current });
            seen[type.name] = true;
          }
        }
      }
      return null;
    }
    get edgeCount() {
      return this.next.length;
    }
    edge(n) {
      if (n >= this.next.length)
        throw new RangeError(`There's no ${n}th edge in this content match`);
      return this.next[n];
    }
    toString() {
      let seen = [];
      function scan(m) {
        seen.push(m);
        for (let i = 0; i < m.next.length; i++)
          if (seen.indexOf(m.next[i].next) == -1)
            scan(m.next[i].next);
      }
      scan(this);
      return seen.map((m, i) => {
        let out = i + (m.validEnd ? "*" : " ") + " ";
        for (let i2 = 0; i2 < m.next.length; i2++)
          out += (i2 ? ", " : "") + m.next[i2].type.name + "->" + seen.indexOf(m.next[i2].next);
        return out;
      }).join("\n");
    }
  };
  ContentMatch.empty = new ContentMatch(true);
  var TokenStream = class {
    constructor(string, nodeTypes) {
      this.string = string;
      this.nodeTypes = nodeTypes;
      this.inline = null;
      this.pos = 0;
      this.tokens = string.split(/\s*(?=\b|\W|$)/);
      if (this.tokens[this.tokens.length - 1] == "")
        this.tokens.pop();
      if (this.tokens[0] == "")
        this.tokens.shift();
    }
    get next() {
      return this.tokens[this.pos];
    }
    eat(tok) {
      return this.next == tok && (this.pos++ || true);
    }
    err(str) {
      throw new SyntaxError(str + " (in content expression '" + this.string + "')");
    }
  };
  function parseExpr(stream) {
    let exprs = [];
    do {
      exprs.push(parseExprSeq(stream));
    } while (stream.eat("|"));
    return exprs.length == 1 ? exprs[0] : { type: "choice", exprs };
  }
  function parseExprSeq(stream) {
    let exprs = [];
    do {
      exprs.push(parseExprSubscript(stream));
    } while (stream.next && stream.next != ")" && stream.next != "|");
    return exprs.length == 1 ? exprs[0] : { type: "seq", exprs };
  }
  function parseExprSubscript(stream) {
    let expr = parseExprAtom(stream);
    for (; ; ) {
      if (stream.eat("+"))
        expr = { type: "plus", expr };
      else if (stream.eat("*"))
        expr = { type: "star", expr };
      else if (stream.eat("?"))
        expr = { type: "opt", expr };
      else if (stream.eat("{"))
        expr = parseExprRange(stream, expr);
      else
        break;
    }
    return expr;
  }
  function parseNum(stream) {
    if (/\D/.test(stream.next))
      stream.err("Expected number, got '" + stream.next + "'");
    let result = Number(stream.next);
    stream.pos++;
    return result;
  }
  function parseExprRange(stream, expr) {
    let min = parseNum(stream), max = min;
    if (stream.eat(",")) {
      if (stream.next != "}")
        max = parseNum(stream);
      else
        max = -1;
    }
    if (!stream.eat("}"))
      stream.err("Unclosed braced range");
    return { type: "range", min, max, expr };
  }
  function resolveName(stream, name) {
    let types = stream.nodeTypes, type = types[name];
    if (type)
      return [type];
    let result = [];
    for (let typeName in types) {
      let type2 = types[typeName];
      if (type2.groups.indexOf(name) > -1)
        result.push(type2);
    }
    if (result.length == 0)
      stream.err("No node type or group '" + name + "' found");
    return result;
  }
  function parseExprAtom(stream) {
    if (stream.eat("(")) {
      let expr = parseExpr(stream);
      if (!stream.eat(")"))
        stream.err("Missing closing paren");
      return expr;
    } else if (!/\W/.test(stream.next)) {
      let exprs = resolveName(stream, stream.next).map((type) => {
        if (stream.inline == null)
          stream.inline = type.isInline;
        else if (stream.inline != type.isInline)
          stream.err("Mixing inline and block content");
        return { type: "name", value: type };
      });
      stream.pos++;
      return exprs.length == 1 ? exprs[0] : { type: "choice", exprs };
    } else {
      stream.err("Unexpected token '" + stream.next + "'");
    }
  }
  function nfa(expr) {
    let nfa2 = [[]];
    connect(compile(expr, 0), node());
    return nfa2;
    function node() {
      return nfa2.push([]) - 1;
    }
    function edge(from2, to, term) {
      let edge2 = { term, to };
      nfa2[from2].push(edge2);
      return edge2;
    }
    function connect(edges, to) {
      edges.forEach((edge2) => edge2.to = to);
    }
    function compile(expr2, from2) {
      if (expr2.type == "choice") {
        return expr2.exprs.reduce((out, expr3) => out.concat(compile(expr3, from2)), []);
      } else if (expr2.type == "seq") {
        for (let i = 0; ; i++) {
          let next = compile(expr2.exprs[i], from2);
          if (i == expr2.exprs.length - 1)
            return next;
          connect(next, from2 = node());
        }
      } else if (expr2.type == "star") {
        let loop = node();
        edge(from2, loop);
        connect(compile(expr2.expr, loop), loop);
        return [edge(loop)];
      } else if (expr2.type == "plus") {
        let loop = node();
        connect(compile(expr2.expr, from2), loop);
        connect(compile(expr2.expr, loop), loop);
        return [edge(loop)];
      } else if (expr2.type == "opt") {
        return [edge(from2)].concat(compile(expr2.expr, from2));
      } else if (expr2.type == "range") {
        let cur = from2;
        for (let i = 0; i < expr2.min; i++) {
          let next = node();
          connect(compile(expr2.expr, cur), next);
          cur = next;
        }
        if (expr2.max == -1) {
          connect(compile(expr2.expr, cur), cur);
        } else {
          for (let i = expr2.min; i < expr2.max; i++) {
            let next = node();
            edge(cur, next);
            connect(compile(expr2.expr, cur), next);
            cur = next;
          }
        }
        return [edge(cur)];
      } else if (expr2.type == "name") {
        return [edge(from2, void 0, expr2.value)];
      } else {
        throw new Error("Unknown expr type");
      }
    }
  }
  function cmp(a, b) {
    return b - a;
  }
  function nullFrom(nfa2, node) {
    let result = [];
    scan(node);
    return result.sort(cmp);
    function scan(node2) {
      let edges = nfa2[node2];
      if (edges.length == 1 && !edges[0].term)
        return scan(edges[0].to);
      result.push(node2);
      for (let i = 0; i < edges.length; i++) {
        let { term, to } = edges[i];
        if (!term && result.indexOf(to) == -1)
          scan(to);
      }
    }
  }
  function dfa(nfa2) {
    let labeled = /* @__PURE__ */ Object.create(null);
    return explore(nullFrom(nfa2, 0));
    function explore(states) {
      let out = [];
      states.forEach((node) => {
        nfa2[node].forEach(({ term, to }) => {
          if (!term)
            return;
          let set;
          for (let i = 0; i < out.length; i++)
            if (out[i][0] == term)
              set = out[i][1];
          nullFrom(nfa2, to).forEach((node2) => {
            if (!set)
              out.push([term, set = []]);
            if (set.indexOf(node2) == -1)
              set.push(node2);
          });
        });
      });
      let state = labeled[states.join(",")] = new ContentMatch(states.indexOf(nfa2.length - 1) > -1);
      for (let i = 0; i < out.length; i++) {
        let states2 = out[i][1].sort(cmp);
        state.next.push({ type: out[i][0], next: labeled[states2.join(",")] || explore(states2) });
      }
      return state;
    }
  }
  function checkForDeadEnds(match, stream) {
    for (let i = 0, work = [match]; i < work.length; i++) {
      let state = work[i], dead = !state.validEnd, nodes2 = [];
      for (let j = 0; j < state.next.length; j++) {
        let { type, next } = state.next[j];
        nodes2.push(type.name);
        if (dead && !(type.isText || type.hasRequiredAttrs()))
          dead = false;
        if (work.indexOf(next) == -1)
          work.push(next);
      }
      if (dead)
        stream.err("Only non-generatable nodes (" + nodes2.join(", ") + ") in a required position (see https://prosemirror.net/docs/guide/#generatable)");
    }
  }
  function defaultAttrs(attrs) {
    let defaults = /* @__PURE__ */ Object.create(null);
    for (let attrName in attrs) {
      let attr = attrs[attrName];
      if (!attr.hasDefault)
        return null;
      defaults[attrName] = attr.default;
    }
    return defaults;
  }
  function computeAttrs(attrs, value) {
    let built = /* @__PURE__ */ Object.create(null);
    for (let name in attrs) {
      let given = value && value[name];
      if (given === void 0) {
        let attr = attrs[name];
        if (attr.hasDefault)
          given = attr.default;
        else
          throw new RangeError("No value supplied for attribute " + name);
      }
      built[name] = given;
    }
    return built;
  }
  function initAttrs(attrs) {
    let result = /* @__PURE__ */ Object.create(null);
    if (attrs)
      for (let name in attrs)
        result[name] = new Attribute(attrs[name]);
    return result;
  }
  var NodeType = class {
    constructor(name, schema2, spec) {
      this.name = name;
      this.schema = schema2;
      this.spec = spec;
      this.markSet = null;
      this.groups = spec.group ? spec.group.split(" ") : [];
      this.attrs = initAttrs(spec.attrs);
      this.defaultAttrs = defaultAttrs(this.attrs);
      this.contentMatch = null;
      this.inlineContent = null;
      this.isBlock = !(spec.inline || name == "text");
      this.isText = name == "text";
    }
    get isInline() {
      return !this.isBlock;
    }
    get isTextblock() {
      return this.isBlock && this.inlineContent;
    }
    get isLeaf() {
      return this.contentMatch == ContentMatch.empty;
    }
    get isAtom() {
      return this.isLeaf || !!this.spec.atom;
    }
    get whitespace() {
      return this.spec.whitespace || (this.spec.code ? "pre" : "normal");
    }
    hasRequiredAttrs() {
      for (let n in this.attrs)
        if (this.attrs[n].isRequired)
          return true;
      return false;
    }
    compatibleContent(other) {
      return this == other || this.contentMatch.compatible(other.contentMatch);
    }
    computeAttrs(attrs) {
      if (!attrs && this.defaultAttrs)
        return this.defaultAttrs;
      else
        return computeAttrs(this.attrs, attrs);
    }
    create(attrs = null, content, marks2) {
      if (this.isText)
        throw new Error("NodeType.create can't construct text nodes");
      return new Node2(this, this.computeAttrs(attrs), Fragment.from(content), Mark.setFrom(marks2));
    }
    createChecked(attrs = null, content, marks2) {
      content = Fragment.from(content);
      if (!this.validContent(content))
        throw new RangeError("Invalid content for node " + this.name);
      return new Node2(this, this.computeAttrs(attrs), content, Mark.setFrom(marks2));
    }
    createAndFill(attrs = null, content, marks2) {
      attrs = this.computeAttrs(attrs);
      content = Fragment.from(content);
      if (content.size) {
        let before = this.contentMatch.fillBefore(content);
        if (!before)
          return null;
        content = before.append(content);
      }
      let matched = this.contentMatch.matchFragment(content);
      let after = matched && matched.fillBefore(Fragment.empty, true);
      if (!after)
        return null;
      return new Node2(this, attrs, content.append(after), Mark.setFrom(marks2));
    }
    validContent(content) {
      let result = this.contentMatch.matchFragment(content);
      if (!result || !result.validEnd)
        return false;
      for (let i = 0; i < content.childCount; i++)
        if (!this.allowsMarks(content.child(i).marks))
          return false;
      return true;
    }
    allowsMarkType(markType) {
      return this.markSet == null || this.markSet.indexOf(markType) > -1;
    }
    allowsMarks(marks2) {
      if (this.markSet == null)
        return true;
      for (let i = 0; i < marks2.length; i++)
        if (!this.allowsMarkType(marks2[i].type))
          return false;
      return true;
    }
    allowedMarks(marks2) {
      if (this.markSet == null)
        return marks2;
      let copy2;
      for (let i = 0; i < marks2.length; i++) {
        if (!this.allowsMarkType(marks2[i].type)) {
          if (!copy2)
            copy2 = marks2.slice(0, i);
        } else if (copy2) {
          copy2.push(marks2[i]);
        }
      }
      return !copy2 ? marks2 : copy2.length ? copy2 : Mark.none;
    }
    static compile(nodes2, schema2) {
      let result = /* @__PURE__ */ Object.create(null);
      nodes2.forEach((name, spec) => result[name] = new NodeType(name, schema2, spec));
      let topType = schema2.spec.topNode || "doc";
      if (!result[topType])
        throw new RangeError("Schema is missing its top node type ('" + topType + "')");
      if (!result.text)
        throw new RangeError("Every schema needs a 'text' type");
      for (let _ in result.text.attrs)
        throw new RangeError("The text node type should not have attributes");
      return result;
    }
  };
  var Attribute = class {
    constructor(options) {
      this.hasDefault = Object.prototype.hasOwnProperty.call(options, "default");
      this.default = options.default;
    }
    get isRequired() {
      return !this.hasDefault;
    }
  };
  var MarkType = class {
    constructor(name, rank, schema2, spec) {
      this.name = name;
      this.rank = rank;
      this.schema = schema2;
      this.spec = spec;
      this.attrs = initAttrs(spec.attrs);
      this.excluded = null;
      let defaults = defaultAttrs(this.attrs);
      this.instance = defaults ? new Mark(this, defaults) : null;
    }
    create(attrs = null) {
      if (!attrs && this.instance)
        return this.instance;
      return new Mark(this, computeAttrs(this.attrs, attrs));
    }
    static compile(marks2, schema2) {
      let result = /* @__PURE__ */ Object.create(null), rank = 0;
      marks2.forEach((name, spec) => result[name] = new MarkType(name, rank++, schema2, spec));
      return result;
    }
    removeFromSet(set) {
      for (var i = 0; i < set.length; i++)
        if (set[i].type == this) {
          set = set.slice(0, i).concat(set.slice(i + 1));
          i--;
        }
      return set;
    }
    isInSet(set) {
      for (let i = 0; i < set.length; i++)
        if (set[i].type == this)
          return set[i];
    }
    excludes(other) {
      return this.excluded.indexOf(other) > -1;
    }
  };
  var Schema = class {
    constructor(spec) {
      this.cached = /* @__PURE__ */ Object.create(null);
      this.spec = {
        nodes: index_es_default.from(spec.nodes),
        marks: index_es_default.from(spec.marks || {}),
        topNode: spec.topNode
      };
      this.nodes = NodeType.compile(this.spec.nodes, this);
      this.marks = MarkType.compile(this.spec.marks, this);
      let contentExprCache = /* @__PURE__ */ Object.create(null);
      for (let prop in this.nodes) {
        if (prop in this.marks)
          throw new RangeError(prop + " can not be both a node and a mark");
        let type = this.nodes[prop], contentExpr = type.spec.content || "", markExpr = type.spec.marks;
        type.contentMatch = contentExprCache[contentExpr] || (contentExprCache[contentExpr] = ContentMatch.parse(contentExpr, this.nodes));
        type.inlineContent = type.contentMatch.inlineContent;
        type.markSet = markExpr == "_" ? null : markExpr ? gatherMarks(this, markExpr.split(" ")) : markExpr == "" || !type.inlineContent ? [] : null;
      }
      for (let prop in this.marks) {
        let type = this.marks[prop], excl = type.spec.excludes;
        type.excluded = excl == null ? [type] : excl == "" ? [] : gatherMarks(this, excl.split(" "));
      }
      this.nodeFromJSON = this.nodeFromJSON.bind(this);
      this.markFromJSON = this.markFromJSON.bind(this);
      this.topNodeType = this.nodes[this.spec.topNode || "doc"];
      this.cached.wrappings = /* @__PURE__ */ Object.create(null);
    }
    node(type, attrs = null, content, marks2) {
      if (typeof type == "string")
        type = this.nodeType(type);
      else if (!(type instanceof NodeType))
        throw new RangeError("Invalid node type: " + type);
      else if (type.schema != this)
        throw new RangeError("Node type from different schema used (" + type.name + ")");
      return type.createChecked(attrs, content, marks2);
    }
    text(text, marks2) {
      let type = this.nodes.text;
      return new TextNode(type, type.defaultAttrs, text, Mark.setFrom(marks2));
    }
    mark(type, attrs) {
      if (typeof type == "string")
        type = this.marks[type];
      return type.create(attrs);
    }
    nodeFromJSON(json) {
      return Node2.fromJSON(this, json);
    }
    markFromJSON(json) {
      return Mark.fromJSON(this, json);
    }
    nodeType(name) {
      let found2 = this.nodes[name];
      if (!found2)
        throw new RangeError("Unknown node type: " + name);
      return found2;
    }
  };
  function gatherMarks(schema2, marks2) {
    let found2 = [];
    for (let i = 0; i < marks2.length; i++) {
      let name = marks2[i], mark = schema2.marks[name], ok = mark;
      if (mark) {
        found2.push(mark);
      } else {
        for (let prop in schema2.marks) {
          let mark2 = schema2.marks[prop];
          if (name == "_" || mark2.spec.group && mark2.spec.group.split(" ").indexOf(name) > -1)
            found2.push(ok = mark2);
        }
      }
      if (!ok)
        throw new SyntaxError("Unknown mark type: '" + marks2[i] + "'");
    }
    return found2;
  }
  var DOMParser = class {
    constructor(schema2, rules) {
      this.schema = schema2;
      this.rules = rules;
      this.tags = [];
      this.styles = [];
      rules.forEach((rule) => {
        if (rule.tag)
          this.tags.push(rule);
        else if (rule.style)
          this.styles.push(rule);
      });
      this.normalizeLists = !this.tags.some((r) => {
        if (!/^(ul|ol)\b/.test(r.tag) || !r.node)
          return false;
        let node = schema2.nodes[r.node];
        return node.contentMatch.matchType(node);
      });
    }
    parse(dom, options = {}) {
      let context = new ParseContext(this, options, false);
      context.addAll(dom, options.from, options.to);
      return context.finish();
    }
    parseSlice(dom, options = {}) {
      let context = new ParseContext(this, options, true);
      context.addAll(dom, options.from, options.to);
      return Slice.maxOpen(context.finish());
    }
    matchTag(dom, context, after) {
      for (let i = after ? this.tags.indexOf(after) + 1 : 0; i < this.tags.length; i++) {
        let rule = this.tags[i];
        if (matches(dom, rule.tag) && (rule.namespace === void 0 || dom.namespaceURI == rule.namespace) && (!rule.context || context.matchesContext(rule.context))) {
          if (rule.getAttrs) {
            let result = rule.getAttrs(dom);
            if (result === false)
              continue;
            rule.attrs = result || void 0;
          }
          return rule;
        }
      }
    }
    matchStyle(prop, value, context, after) {
      for (let i = after ? this.styles.indexOf(after) + 1 : 0; i < this.styles.length; i++) {
        let rule = this.styles[i], style = rule.style;
        if (style.indexOf(prop) != 0 || rule.context && !context.matchesContext(rule.context) || style.length > prop.length && (style.charCodeAt(prop.length) != 61 || style.slice(prop.length + 1) != value))
          continue;
        if (rule.getAttrs) {
          let result = rule.getAttrs(value);
          if (result === false)
            continue;
          rule.attrs = result || void 0;
        }
        return rule;
      }
    }
    static schemaRules(schema2) {
      let result = [];
      function insert(rule) {
        let priority = rule.priority == null ? 50 : rule.priority, i = 0;
        for (; i < result.length; i++) {
          let next = result[i], nextPriority = next.priority == null ? 50 : next.priority;
          if (nextPriority < priority)
            break;
        }
        result.splice(i, 0, rule);
      }
      for (let name in schema2.marks) {
        let rules = schema2.marks[name].spec.parseDOM;
        if (rules)
          rules.forEach((rule) => {
            insert(rule = copy(rule));
            rule.mark = name;
          });
      }
      for (let name in schema2.nodes) {
        let rules = schema2.nodes[name].spec.parseDOM;
        if (rules)
          rules.forEach((rule) => {
            insert(rule = copy(rule));
            rule.node = name;
          });
      }
      return result;
    }
    static fromSchema(schema2) {
      return schema2.cached.domParser || (schema2.cached.domParser = new DOMParser(schema2, DOMParser.schemaRules(schema2)));
    }
  };
  var blockTags = {
    address: true,
    article: true,
    aside: true,
    blockquote: true,
    canvas: true,
    dd: true,
    div: true,
    dl: true,
    fieldset: true,
    figcaption: true,
    figure: true,
    footer: true,
    form: true,
    h1: true,
    h2: true,
    h3: true,
    h4: true,
    h5: true,
    h6: true,
    header: true,
    hgroup: true,
    hr: true,
    li: true,
    noscript: true,
    ol: true,
    output: true,
    p: true,
    pre: true,
    section: true,
    table: true,
    tfoot: true,
    ul: true
  };
  var ignoreTags = {
    head: true,
    noscript: true,
    object: true,
    script: true,
    style: true,
    title: true
  };
  var listTags = { ol: true, ul: true };
  var OPT_PRESERVE_WS = 1;
  var OPT_PRESERVE_WS_FULL = 2;
  var OPT_OPEN_LEFT = 4;
  function wsOptionsFor(type, preserveWhitespace, base2) {
    if (preserveWhitespace != null)
      return (preserveWhitespace ? OPT_PRESERVE_WS : 0) | (preserveWhitespace === "full" ? OPT_PRESERVE_WS_FULL : 0);
    return type && type.whitespace == "pre" ? OPT_PRESERVE_WS | OPT_PRESERVE_WS_FULL : base2 & ~OPT_OPEN_LEFT;
  }
  var NodeContext = class {
    constructor(type, attrs, marks2, pendingMarks, solid, match, options) {
      this.type = type;
      this.attrs = attrs;
      this.marks = marks2;
      this.pendingMarks = pendingMarks;
      this.solid = solid;
      this.options = options;
      this.content = [];
      this.activeMarks = Mark.none;
      this.stashMarks = [];
      this.match = match || (options & OPT_OPEN_LEFT ? null : type.contentMatch);
    }
    findWrapping(node) {
      if (!this.match) {
        if (!this.type)
          return [];
        let fill = this.type.contentMatch.fillBefore(Fragment.from(node));
        if (fill) {
          this.match = this.type.contentMatch.matchFragment(fill);
        } else {
          let start = this.type.contentMatch, wrap2;
          if (wrap2 = start.findWrapping(node.type)) {
            this.match = start;
            return wrap2;
          } else {
            return null;
          }
        }
      }
      return this.match.findWrapping(node.type);
    }
    finish(openEnd) {
      if (!(this.options & OPT_PRESERVE_WS)) {
        let last = this.content[this.content.length - 1], m;
        if (last && last.isText && (m = /[ \t\r\n\u000c]+$/.exec(last.text))) {
          let text = last;
          if (last.text.length == m[0].length)
            this.content.pop();
          else
            this.content[this.content.length - 1] = text.withText(text.text.slice(0, text.text.length - m[0].length));
        }
      }
      let content = Fragment.from(this.content);
      if (!openEnd && this.match)
        content = content.append(this.match.fillBefore(Fragment.empty, true));
      return this.type ? this.type.create(this.attrs, content, this.marks) : content;
    }
    popFromStashMark(mark) {
      for (let i = this.stashMarks.length - 1; i >= 0; i--)
        if (mark.eq(this.stashMarks[i]))
          return this.stashMarks.splice(i, 1)[0];
    }
    applyPending(nextType) {
      for (let i = 0, pending = this.pendingMarks; i < pending.length; i++) {
        let mark = pending[i];
        if ((this.type ? this.type.allowsMarkType(mark.type) : markMayApply(mark.type, nextType)) && !mark.isInSet(this.activeMarks)) {
          this.activeMarks = mark.addToSet(this.activeMarks);
          this.pendingMarks = mark.removeFromSet(this.pendingMarks);
        }
      }
    }
    inlineContext(node) {
      if (this.type)
        return this.type.inlineContent;
      if (this.content.length)
        return this.content[0].isInline;
      return node.parentNode && !blockTags.hasOwnProperty(node.parentNode.nodeName.toLowerCase());
    }
  };
  var ParseContext = class {
    constructor(parser, options, isOpen) {
      this.parser = parser;
      this.options = options;
      this.isOpen = isOpen;
      this.open = 0;
      let topNode = options.topNode, topContext;
      let topOptions = wsOptionsFor(null, options.preserveWhitespace, 0) | (isOpen ? OPT_OPEN_LEFT : 0);
      if (topNode)
        topContext = new NodeContext(topNode.type, topNode.attrs, Mark.none, Mark.none, true, options.topMatch || topNode.type.contentMatch, topOptions);
      else if (isOpen)
        topContext = new NodeContext(null, null, Mark.none, Mark.none, true, null, topOptions);
      else
        topContext = new NodeContext(parser.schema.topNodeType, null, Mark.none, Mark.none, true, null, topOptions);
      this.nodes = [topContext];
      this.find = options.findPositions;
      this.needsBlock = false;
    }
    get top() {
      return this.nodes[this.open];
    }
    addDOM(dom) {
      if (dom.nodeType == 3) {
        this.addTextNode(dom);
      } else if (dom.nodeType == 1) {
        let style = dom.getAttribute("style");
        let marks2 = style ? this.readStyles(parseStyles(style)) : null, top = this.top;
        if (marks2 != null)
          for (let i = 0; i < marks2.length; i++)
            this.addPendingMark(marks2[i]);
        this.addElement(dom);
        if (marks2 != null)
          for (let i = 0; i < marks2.length; i++)
            this.removePendingMark(marks2[i], top);
      }
    }
    addTextNode(dom) {
      let value = dom.nodeValue;
      let top = this.top;
      if (top.options & OPT_PRESERVE_WS_FULL || top.inlineContext(dom) || /[^ \t\r\n\u000c]/.test(value)) {
        if (!(top.options & OPT_PRESERVE_WS)) {
          value = value.replace(/[ \t\r\n\u000c]+/g, " ");
          if (/^[ \t\r\n\u000c]/.test(value) && this.open == this.nodes.length - 1) {
            let nodeBefore = top.content[top.content.length - 1];
            let domNodeBefore = dom.previousSibling;
            if (!nodeBefore || domNodeBefore && domNodeBefore.nodeName == "BR" || nodeBefore.isText && /[ \t\r\n\u000c]$/.test(nodeBefore.text))
              value = value.slice(1);
          }
        } else if (!(top.options & OPT_PRESERVE_WS_FULL)) {
          value = value.replace(/\r?\n|\r/g, " ");
        } else {
          value = value.replace(/\r\n?/g, "\n");
        }
        if (value)
          this.insertNode(this.parser.schema.text(value));
        this.findInText(dom);
      } else {
        this.findInside(dom);
      }
    }
    addElement(dom, matchAfter) {
      let name = dom.nodeName.toLowerCase(), ruleID;
      if (listTags.hasOwnProperty(name) && this.parser.normalizeLists)
        normalizeList(dom);
      let rule = this.options.ruleFromNode && this.options.ruleFromNode(dom) || (ruleID = this.parser.matchTag(dom, this, matchAfter));
      if (rule ? rule.ignore : ignoreTags.hasOwnProperty(name)) {
        this.findInside(dom);
        this.ignoreFallback(dom);
      } else if (!rule || rule.skip || rule.closeParent) {
        if (rule && rule.closeParent)
          this.open = Math.max(0, this.open - 1);
        else if (rule && rule.skip.nodeType)
          dom = rule.skip;
        let sync, top = this.top, oldNeedsBlock = this.needsBlock;
        if (blockTags.hasOwnProperty(name)) {
          sync = true;
          if (!top.type)
            this.needsBlock = true;
        } else if (!dom.firstChild) {
          this.leafFallback(dom);
          return;
        }
        this.addAll(dom);
        if (sync)
          this.sync(top);
        this.needsBlock = oldNeedsBlock;
      } else {
        this.addElementByRule(dom, rule, rule.consuming === false ? ruleID : void 0);
      }
    }
    leafFallback(dom) {
      if (dom.nodeName == "BR" && this.top.type && this.top.type.inlineContent)
        this.addTextNode(dom.ownerDocument.createTextNode("\n"));
    }
    ignoreFallback(dom) {
      if (dom.nodeName == "BR" && (!this.top.type || !this.top.type.inlineContent))
        this.findPlace(this.parser.schema.text("-"));
    }
    readStyles(styles) {
      let marks2 = Mark.none;
      style:
        for (let i = 0; i < styles.length; i += 2) {
          for (let after = void 0; ; ) {
            let rule = this.parser.matchStyle(styles[i], styles[i + 1], this, after);
            if (!rule)
              continue style;
            if (rule.ignore)
              return null;
            marks2 = this.parser.schema.marks[rule.mark].create(rule.attrs).addToSet(marks2);
            if (rule.consuming === false)
              after = rule;
            else
              break;
          }
        }
      return marks2;
    }
    addElementByRule(dom, rule, continueAfter) {
      let sync, nodeType, mark;
      if (rule.node) {
        nodeType = this.parser.schema.nodes[rule.node];
        if (!nodeType.isLeaf) {
          sync = this.enter(nodeType, rule.attrs || null, rule.preserveWhitespace);
        } else if (!this.insertNode(nodeType.create(rule.attrs))) {
          this.leafFallback(dom);
        }
      } else {
        let markType = this.parser.schema.marks[rule.mark];
        mark = markType.create(rule.attrs);
        this.addPendingMark(mark);
      }
      let startIn = this.top;
      if (nodeType && nodeType.isLeaf) {
        this.findInside(dom);
      } else if (continueAfter) {
        this.addElement(dom, continueAfter);
      } else if (rule.getContent) {
        this.findInside(dom);
        rule.getContent(dom, this.parser.schema).forEach((node) => this.insertNode(node));
      } else {
        let contentDOM = dom;
        if (typeof rule.contentElement == "string")
          contentDOM = dom.querySelector(rule.contentElement);
        else if (typeof rule.contentElement == "function")
          contentDOM = rule.contentElement(dom);
        else if (rule.contentElement)
          contentDOM = rule.contentElement;
        this.findAround(dom, contentDOM, true);
        this.addAll(contentDOM);
      }
      if (sync && this.sync(startIn))
        this.open--;
      if (mark)
        this.removePendingMark(mark, startIn);
    }
    addAll(parent, startIndex, endIndex) {
      let index = startIndex || 0;
      for (let dom = startIndex ? parent.childNodes[startIndex] : parent.firstChild, end = endIndex == null ? null : parent.childNodes[endIndex]; dom != end; dom = dom.nextSibling, ++index) {
        this.findAtPoint(parent, index);
        this.addDOM(dom);
      }
      this.findAtPoint(parent, index);
    }
    findPlace(node) {
      let route, sync;
      for (let depth = this.open; depth >= 0; depth--) {
        let cx = this.nodes[depth];
        let found2 = cx.findWrapping(node);
        if (found2 && (!route || route.length > found2.length)) {
          route = found2;
          sync = cx;
          if (!found2.length)
            break;
        }
        if (cx.solid)
          break;
      }
      if (!route)
        return false;
      this.sync(sync);
      for (let i = 0; i < route.length; i++)
        this.enterInner(route[i], null, false);
      return true;
    }
    insertNode(node) {
      if (node.isInline && this.needsBlock && !this.top.type) {
        let block = this.textblockFromContext();
        if (block)
          this.enterInner(block);
      }
      if (this.findPlace(node)) {
        this.closeExtra();
        let top = this.top;
        top.applyPending(node.type);
        if (top.match)
          top.match = top.match.matchType(node.type);
        let marks2 = top.activeMarks;
        for (let i = 0; i < node.marks.length; i++)
          if (!top.type || top.type.allowsMarkType(node.marks[i].type))
            marks2 = node.marks[i].addToSet(marks2);
        top.content.push(node.mark(marks2));
        return true;
      }
      return false;
    }
    enter(type, attrs, preserveWS) {
      let ok = this.findPlace(type.create(attrs));
      if (ok)
        this.enterInner(type, attrs, true, preserveWS);
      return ok;
    }
    enterInner(type, attrs = null, solid = false, preserveWS) {
      this.closeExtra();
      let top = this.top;
      top.applyPending(type);
      top.match = top.match && top.match.matchType(type);
      let options = wsOptionsFor(type, preserveWS, top.options);
      if (top.options & OPT_OPEN_LEFT && top.content.length == 0)
        options |= OPT_OPEN_LEFT;
      this.nodes.push(new NodeContext(type, attrs, top.activeMarks, top.pendingMarks, solid, null, options));
      this.open++;
    }
    closeExtra(openEnd = false) {
      let i = this.nodes.length - 1;
      if (i > this.open) {
        for (; i > this.open; i--)
          this.nodes[i - 1].content.push(this.nodes[i].finish(openEnd));
        this.nodes.length = this.open + 1;
      }
    }
    finish() {
      this.open = 0;
      this.closeExtra(this.isOpen);
      return this.nodes[0].finish(this.isOpen || this.options.topOpen);
    }
    sync(to) {
      for (let i = this.open; i >= 0; i--)
        if (this.nodes[i] == to) {
          this.open = i;
          return true;
        }
      return false;
    }
    get currentPos() {
      this.closeExtra();
      let pos = 0;
      for (let i = this.open; i >= 0; i--) {
        let content = this.nodes[i].content;
        for (let j = content.length - 1; j >= 0; j--)
          pos += content[j].nodeSize;
        if (i)
          pos++;
      }
      return pos;
    }
    findAtPoint(parent, offset) {
      if (this.find)
        for (let i = 0; i < this.find.length; i++) {
          if (this.find[i].node == parent && this.find[i].offset == offset)
            this.find[i].pos = this.currentPos;
        }
    }
    findInside(parent) {
      if (this.find)
        for (let i = 0; i < this.find.length; i++) {
          if (this.find[i].pos == null && parent.nodeType == 1 && parent.contains(this.find[i].node))
            this.find[i].pos = this.currentPos;
        }
    }
    findAround(parent, content, before) {
      if (parent != content && this.find)
        for (let i = 0; i < this.find.length; i++) {
          if (this.find[i].pos == null && parent.nodeType == 1 && parent.contains(this.find[i].node)) {
            let pos = content.compareDocumentPosition(this.find[i].node);
            if (pos & (before ? 2 : 4))
              this.find[i].pos = this.currentPos;
          }
        }
    }
    findInText(textNode) {
      if (this.find)
        for (let i = 0; i < this.find.length; i++) {
          if (this.find[i].node == textNode)
            this.find[i].pos = this.currentPos - (textNode.nodeValue.length - this.find[i].offset);
        }
    }
    matchesContext(context) {
      if (context.indexOf("|") > -1)
        return context.split(/\s*\|\s*/).some(this.matchesContext, this);
      let parts = context.split("/");
      let option = this.options.context;
      let useRoot = !this.isOpen && (!option || option.parent.type == this.nodes[0].type);
      let minDepth = -(option ? option.depth + 1 : 0) + (useRoot ? 0 : 1);
      let match = (i, depth) => {
        for (; i >= 0; i--) {
          let part = parts[i];
          if (part == "") {
            if (i == parts.length - 1 || i == 0)
              continue;
            for (; depth >= minDepth; depth--)
              if (match(i - 1, depth))
                return true;
            return false;
          } else {
            let next = depth > 0 || depth == 0 && useRoot ? this.nodes[depth].type : option && depth >= minDepth ? option.node(depth - minDepth).type : null;
            if (!next || next.name != part && next.groups.indexOf(part) == -1)
              return false;
            depth--;
          }
        }
        return true;
      };
      return match(parts.length - 1, this.open);
    }
    textblockFromContext() {
      let $context = this.options.context;
      if ($context)
        for (let d = $context.depth; d >= 0; d--) {
          let deflt = $context.node(d).contentMatchAt($context.indexAfter(d)).defaultType;
          if (deflt && deflt.isTextblock && deflt.defaultAttrs)
            return deflt;
        }
      for (let name in this.parser.schema.nodes) {
        let type = this.parser.schema.nodes[name];
        if (type.isTextblock && type.defaultAttrs)
          return type;
      }
    }
    addPendingMark(mark) {
      let found2 = findSameMarkInSet(mark, this.top.pendingMarks);
      if (found2)
        this.top.stashMarks.push(found2);
      this.top.pendingMarks = mark.addToSet(this.top.pendingMarks);
    }
    removePendingMark(mark, upto) {
      for (let depth = this.open; depth >= 0; depth--) {
        let level = this.nodes[depth];
        let found2 = level.pendingMarks.lastIndexOf(mark);
        if (found2 > -1) {
          level.pendingMarks = mark.removeFromSet(level.pendingMarks);
        } else {
          level.activeMarks = mark.removeFromSet(level.activeMarks);
          let stashMark = level.popFromStashMark(mark);
          if (stashMark && level.type && level.type.allowsMarkType(stashMark.type))
            level.activeMarks = stashMark.addToSet(level.activeMarks);
        }
        if (level == upto)
          break;
      }
    }
  };
  function normalizeList(dom) {
    for (let child = dom.firstChild, prevItem = null; child; child = child.nextSibling) {
      let name = child.nodeType == 1 ? child.nodeName.toLowerCase() : null;
      if (name && listTags.hasOwnProperty(name) && prevItem) {
        prevItem.appendChild(child);
        child = prevItem;
      } else if (name == "li") {
        prevItem = child;
      } else if (name) {
        prevItem = null;
      }
    }
  }
  function matches(dom, selector) {
    return (dom.matches || dom.msMatchesSelector || dom.webkitMatchesSelector || dom.mozMatchesSelector).call(dom, selector);
  }
  function parseStyles(style) {
    let re = /\s*([\w-]+)\s*:\s*([^;]+)/g, m, result = [];
    while (m = re.exec(style))
      result.push(m[1], m[2].trim());
    return result;
  }
  function copy(obj) {
    let copy2 = {};
    for (let prop in obj)
      copy2[prop] = obj[prop];
    return copy2;
  }
  function markMayApply(markType, nodeType) {
    let nodes2 = nodeType.schema.nodes;
    for (let name in nodes2) {
      let parent = nodes2[name];
      if (!parent.allowsMarkType(markType))
        continue;
      let seen = [], scan = (match) => {
        seen.push(match);
        for (let i = 0; i < match.edgeCount; i++) {
          let { type, next } = match.edge(i);
          if (type == nodeType)
            return true;
          if (seen.indexOf(next) < 0 && scan(next))
            return true;
        }
      };
      if (scan(parent.contentMatch))
        return true;
    }
  }
  function findSameMarkInSet(mark, set) {
    for (let i = 0; i < set.length; i++) {
      if (mark.eq(set[i]))
        return set[i];
    }
  }
  var DOMSerializer = class {
    constructor(nodes2, marks2) {
      this.nodes = nodes2;
      this.marks = marks2;
    }
    serializeFragment(fragment, options = {}, target) {
      if (!target)
        target = doc(options).createDocumentFragment();
      let top = target, active = [];
      fragment.forEach((node) => {
        if (active.length || node.marks.length) {
          let keep = 0, rendered = 0;
          while (keep < active.length && rendered < node.marks.length) {
            let next = node.marks[rendered];
            if (!this.marks[next.type.name]) {
              rendered++;
              continue;
            }
            if (!next.eq(active[keep][0]) || next.type.spec.spanning === false)
              break;
            keep++;
            rendered++;
          }
          while (keep < active.length)
            top = active.pop()[1];
          while (rendered < node.marks.length) {
            let add2 = node.marks[rendered++];
            let markDOM = this.serializeMark(add2, node.isInline, options);
            if (markDOM) {
              active.push([add2, top]);
              top.appendChild(markDOM.dom);
              top = markDOM.contentDOM || markDOM.dom;
            }
          }
        }
        top.appendChild(this.serializeNodeInner(node, options));
      });
      return target;
    }
    serializeNodeInner(node, options) {
      let { dom, contentDOM } = DOMSerializer.renderSpec(doc(options), this.nodes[node.type.name](node));
      if (contentDOM) {
        if (node.isLeaf)
          throw new RangeError("Content hole not allowed in a leaf node spec");
        this.serializeFragment(node.content, options, contentDOM);
      }
      return dom;
    }
    serializeNode(node, options = {}) {
      let dom = this.serializeNodeInner(node, options);
      for (let i = node.marks.length - 1; i >= 0; i--) {
        let wrap2 = this.serializeMark(node.marks[i], node.isInline, options);
        if (wrap2) {
          (wrap2.contentDOM || wrap2.dom).appendChild(dom);
          dom = wrap2.dom;
        }
      }
      return dom;
    }
    serializeMark(mark, inline, options = {}) {
      let toDOM = this.marks[mark.type.name];
      return toDOM && DOMSerializer.renderSpec(doc(options), toDOM(mark, inline));
    }
    static renderSpec(doc3, structure, xmlNS = null) {
      if (typeof structure == "string")
        return { dom: doc3.createTextNode(structure) };
      if (structure.nodeType != null)
        return { dom: structure };
      if (structure.dom && structure.dom.nodeType != null)
        return structure;
      let tagName = structure[0], space = tagName.indexOf(" ");
      if (space > 0) {
        xmlNS = tagName.slice(0, space);
        tagName = tagName.slice(space + 1);
      }
      let contentDOM;
      let dom = xmlNS ? doc3.createElementNS(xmlNS, tagName) : doc3.createElement(tagName);
      let attrs = structure[1], start = 1;
      if (attrs && typeof attrs == "object" && attrs.nodeType == null && !Array.isArray(attrs)) {
        start = 2;
        for (let name in attrs)
          if (attrs[name] != null) {
            let space2 = name.indexOf(" ");
            if (space2 > 0)
              dom.setAttributeNS(name.slice(0, space2), name.slice(space2 + 1), attrs[name]);
            else
              dom.setAttribute(name, attrs[name]);
          }
      }
      for (let i = start; i < structure.length; i++) {
        let child = structure[i];
        if (child === 0) {
          if (i < structure.length - 1 || i > start)
            throw new RangeError("Content hole must be the only child of its parent node");
          return { dom, contentDOM: dom };
        } else {
          let { dom: inner, contentDOM: innerContent } = DOMSerializer.renderSpec(doc3, child, xmlNS);
          dom.appendChild(inner);
          if (innerContent) {
            if (contentDOM)
              throw new RangeError("Multiple content holes");
            contentDOM = innerContent;
          }
        }
      }
      return { dom, contentDOM };
    }
    static fromSchema(schema2) {
      return schema2.cached.domSerializer || (schema2.cached.domSerializer = new DOMSerializer(this.nodesFromSchema(schema2), this.marksFromSchema(schema2)));
    }
    static nodesFromSchema(schema2) {
      let result = gatherToDOM(schema2.nodes);
      if (!result.text)
        result.text = (node) => node.text;
      return result;
    }
    static marksFromSchema(schema2) {
      return gatherToDOM(schema2.marks);
    }
  };
  function gatherToDOM(obj) {
    let result = {};
    for (let name in obj) {
      let toDOM = obj[name].spec.toDOM;
      if (toDOM)
        result[name] = toDOM;
    }
    return result;
  }
  function doc(options) {
    return options.document || window.document;
  }

  // node_modules/prosemirror-transform/dist/index.js
  var lower16 = 65535;
  var factor16 = Math.pow(2, 16);
  function makeRecover(index, offset) {
    return index + offset * factor16;
  }
  function recoverIndex(value) {
    return value & lower16;
  }
  function recoverOffset(value) {
    return (value - (value & lower16)) / factor16;
  }
  var DEL_BEFORE = 1;
  var DEL_AFTER = 2;
  var DEL_ACROSS = 4;
  var DEL_SIDE = 8;
  var MapResult = class {
    constructor(pos, delInfo, recover) {
      this.pos = pos;
      this.delInfo = delInfo;
      this.recover = recover;
    }
    get deleted() {
      return (this.delInfo & DEL_SIDE) > 0;
    }
    get deletedBefore() {
      return (this.delInfo & (DEL_BEFORE | DEL_ACROSS)) > 0;
    }
    get deletedAfter() {
      return (this.delInfo & (DEL_AFTER | DEL_ACROSS)) > 0;
    }
    get deletedAcross() {
      return (this.delInfo & DEL_ACROSS) > 0;
    }
  };
  var StepMap = class {
    constructor(ranges, inverted = false) {
      this.ranges = ranges;
      this.inverted = inverted;
      if (!ranges.length && StepMap.empty)
        return StepMap.empty;
    }
    recover(value) {
      let diff = 0, index = recoverIndex(value);
      if (!this.inverted)
        for (let i = 0; i < index; i++)
          diff += this.ranges[i * 3 + 2] - this.ranges[i * 3 + 1];
      return this.ranges[index * 3] + diff + recoverOffset(value);
    }
    mapResult(pos, assoc = 1) {
      return this._map(pos, assoc, false);
    }
    map(pos, assoc = 1) {
      return this._map(pos, assoc, true);
    }
    _map(pos, assoc, simple) {
      let diff = 0, oldIndex = this.inverted ? 2 : 1, newIndex = this.inverted ? 1 : 2;
      for (let i = 0; i < this.ranges.length; i += 3) {
        let start = this.ranges[i] - (this.inverted ? diff : 0);
        if (start > pos)
          break;
        let oldSize = this.ranges[i + oldIndex], newSize = this.ranges[i + newIndex], end = start + oldSize;
        if (pos <= end) {
          let side = !oldSize ? assoc : pos == start ? -1 : pos == end ? 1 : assoc;
          let result = start + diff + (side < 0 ? 0 : newSize);
          if (simple)
            return result;
          let recover = pos == (assoc < 0 ? start : end) ? null : makeRecover(i / 3, pos - start);
          let del2 = pos == start ? DEL_AFTER : pos == end ? DEL_BEFORE : DEL_ACROSS;
          if (assoc < 0 ? pos != start : pos != end)
            del2 |= DEL_SIDE;
          return new MapResult(result, del2, recover);
        }
        diff += newSize - oldSize;
      }
      return simple ? pos + diff : new MapResult(pos + diff, 0, null);
    }
    touches(pos, recover) {
      let diff = 0, index = recoverIndex(recover);
      let oldIndex = this.inverted ? 2 : 1, newIndex = this.inverted ? 1 : 2;
      for (let i = 0; i < this.ranges.length; i += 3) {
        let start = this.ranges[i] - (this.inverted ? diff : 0);
        if (start > pos)
          break;
        let oldSize = this.ranges[i + oldIndex], end = start + oldSize;
        if (pos <= end && i == index * 3)
          return true;
        diff += this.ranges[i + newIndex] - oldSize;
      }
      return false;
    }
    forEach(f) {
      let oldIndex = this.inverted ? 2 : 1, newIndex = this.inverted ? 1 : 2;
      for (let i = 0, diff = 0; i < this.ranges.length; i += 3) {
        let start = this.ranges[i], oldStart = start - (this.inverted ? diff : 0), newStart = start + (this.inverted ? 0 : diff);
        let oldSize = this.ranges[i + oldIndex], newSize = this.ranges[i + newIndex];
        f(oldStart, oldStart + oldSize, newStart, newStart + newSize);
        diff += newSize - oldSize;
      }
    }
    invert() {
      return new StepMap(this.ranges, !this.inverted);
    }
    toString() {
      return (this.inverted ? "-" : "") + JSON.stringify(this.ranges);
    }
    static offset(n) {
      return n == 0 ? StepMap.empty : new StepMap(n < 0 ? [0, -n, 0] : [0, 0, n]);
    }
  };
  StepMap.empty = new StepMap([]);
  var Mapping = class {
    constructor(maps = [], mirror, from2 = 0, to = maps.length) {
      this.maps = maps;
      this.mirror = mirror;
      this.from = from2;
      this.to = to;
    }
    slice(from2 = 0, to = this.maps.length) {
      return new Mapping(this.maps, this.mirror, from2, to);
    }
    copy() {
      return new Mapping(this.maps.slice(), this.mirror && this.mirror.slice(), this.from, this.to);
    }
    appendMap(map2, mirrors) {
      this.to = this.maps.push(map2);
      if (mirrors != null)
        this.setMirror(this.maps.length - 1, mirrors);
    }
    appendMapping(mapping) {
      for (let i = 0, startSize = this.maps.length; i < mapping.maps.length; i++) {
        let mirr = mapping.getMirror(i);
        this.appendMap(mapping.maps[i], mirr != null && mirr < i ? startSize + mirr : void 0);
      }
    }
    getMirror(n) {
      if (this.mirror) {
        for (let i = 0; i < this.mirror.length; i++)
          if (this.mirror[i] == n)
            return this.mirror[i + (i % 2 ? -1 : 1)];
      }
    }
    setMirror(n, m) {
      if (!this.mirror)
        this.mirror = [];
      this.mirror.push(n, m);
    }
    appendMappingInverted(mapping) {
      for (let i = mapping.maps.length - 1, totalSize = this.maps.length + mapping.maps.length; i >= 0; i--) {
        let mirr = mapping.getMirror(i);
        this.appendMap(mapping.maps[i].invert(), mirr != null && mirr > i ? totalSize - mirr - 1 : void 0);
      }
    }
    invert() {
      let inverse = new Mapping();
      inverse.appendMappingInverted(this);
      return inverse;
    }
    map(pos, assoc = 1) {
      if (this.mirror)
        return this._map(pos, assoc, true);
      for (let i = this.from; i < this.to; i++)
        pos = this.maps[i].map(pos, assoc);
      return pos;
    }
    mapResult(pos, assoc = 1) {
      return this._map(pos, assoc, false);
    }
    _map(pos, assoc, simple) {
      let delInfo = 0;
      for (let i = this.from; i < this.to; i++) {
        let map2 = this.maps[i], result = map2.mapResult(pos, assoc);
        if (result.recover != null) {
          let corr = this.getMirror(i);
          if (corr != null && corr > i && corr < this.to) {
            i = corr;
            pos = this.maps[corr].recover(result.recover);
            continue;
          }
        }
        delInfo |= result.delInfo;
        pos = result.pos;
      }
      return simple ? pos : new MapResult(pos, delInfo, null);
    }
  };
  var stepsByID = /* @__PURE__ */ Object.create(null);
  var Step = class {
    getMap() {
      return StepMap.empty;
    }
    merge(other) {
      return null;
    }
    static fromJSON(schema2, json) {
      if (!json || !json.stepType)
        throw new RangeError("Invalid input for Step.fromJSON");
      let type = stepsByID[json.stepType];
      if (!type)
        throw new RangeError(`No step type ${json.stepType} defined`);
      return type.fromJSON(schema2, json);
    }
    static jsonID(id, stepClass) {
      if (id in stepsByID)
        throw new RangeError("Duplicate use of step JSON ID " + id);
      stepsByID[id] = stepClass;
      stepClass.prototype.jsonID = id;
      return stepClass;
    }
  };
  var StepResult = class {
    constructor(doc3, failed) {
      this.doc = doc3;
      this.failed = failed;
    }
    static ok(doc3) {
      return new StepResult(doc3, null);
    }
    static fail(message) {
      return new StepResult(null, message);
    }
    static fromReplace(doc3, from2, to, slice2) {
      try {
        return StepResult.ok(doc3.replace(from2, to, slice2));
      } catch (e) {
        if (e instanceof ReplaceError)
          return StepResult.fail(e.message);
        throw e;
      }
    }
  };
  function mapFragment(fragment, f, parent) {
    let mapped = [];
    for (let i = 0; i < fragment.childCount; i++) {
      let child = fragment.child(i);
      if (child.content.size)
        child = child.copy(mapFragment(child.content, f, child));
      if (child.isInline)
        child = f(child, parent, i);
      mapped.push(child);
    }
    return Fragment.fromArray(mapped);
  }
  var AddMarkStep = class extends Step {
    constructor(from2, to, mark) {
      super();
      this.from = from2;
      this.to = to;
      this.mark = mark;
    }
    apply(doc3) {
      let oldSlice = doc3.slice(this.from, this.to), $from = doc3.resolve(this.from);
      let parent = $from.node($from.sharedDepth(this.to));
      let slice2 = new Slice(mapFragment(oldSlice.content, (node, parent2) => {
        if (!node.isAtom || !parent2.type.allowsMarkType(this.mark.type))
          return node;
        return node.mark(this.mark.addToSet(node.marks));
      }, parent), oldSlice.openStart, oldSlice.openEnd);
      return StepResult.fromReplace(doc3, this.from, this.to, slice2);
    }
    invert() {
      return new RemoveMarkStep(this.from, this.to, this.mark);
    }
    map(mapping) {
      let from2 = mapping.mapResult(this.from, 1), to = mapping.mapResult(this.to, -1);
      if (from2.deleted && to.deleted || from2.pos >= to.pos)
        return null;
      return new AddMarkStep(from2.pos, to.pos, this.mark);
    }
    merge(other) {
      if (other instanceof AddMarkStep && other.mark.eq(this.mark) && this.from <= other.to && this.to >= other.from)
        return new AddMarkStep(Math.min(this.from, other.from), Math.max(this.to, other.to), this.mark);
      return null;
    }
    toJSON() {
      return {
        stepType: "addMark",
        mark: this.mark.toJSON(),
        from: this.from,
        to: this.to
      };
    }
    static fromJSON(schema2, json) {
      if (typeof json.from != "number" || typeof json.to != "number")
        throw new RangeError("Invalid input for AddMarkStep.fromJSON");
      return new AddMarkStep(json.from, json.to, schema2.markFromJSON(json.mark));
    }
  };
  Step.jsonID("addMark", AddMarkStep);
  var RemoveMarkStep = class extends Step {
    constructor(from2, to, mark) {
      super();
      this.from = from2;
      this.to = to;
      this.mark = mark;
    }
    apply(doc3) {
      let oldSlice = doc3.slice(this.from, this.to);
      let slice2 = new Slice(mapFragment(oldSlice.content, (node) => {
        return node.mark(this.mark.removeFromSet(node.marks));
      }, doc3), oldSlice.openStart, oldSlice.openEnd);
      return StepResult.fromReplace(doc3, this.from, this.to, slice2);
    }
    invert() {
      return new AddMarkStep(this.from, this.to, this.mark);
    }
    map(mapping) {
      let from2 = mapping.mapResult(this.from, 1), to = mapping.mapResult(this.to, -1);
      if (from2.deleted && to.deleted || from2.pos >= to.pos)
        return null;
      return new RemoveMarkStep(from2.pos, to.pos, this.mark);
    }
    merge(other) {
      if (other instanceof RemoveMarkStep && other.mark.eq(this.mark) && this.from <= other.to && this.to >= other.from)
        return new RemoveMarkStep(Math.min(this.from, other.from), Math.max(this.to, other.to), this.mark);
      return null;
    }
    toJSON() {
      return {
        stepType: "removeMark",
        mark: this.mark.toJSON(),
        from: this.from,
        to: this.to
      };
    }
    static fromJSON(schema2, json) {
      if (typeof json.from != "number" || typeof json.to != "number")
        throw new RangeError("Invalid input for RemoveMarkStep.fromJSON");
      return new RemoveMarkStep(json.from, json.to, schema2.markFromJSON(json.mark));
    }
  };
  Step.jsonID("removeMark", RemoveMarkStep);
  var ReplaceStep = class extends Step {
    constructor(from2, to, slice2, structure = false) {
      super();
      this.from = from2;
      this.to = to;
      this.slice = slice2;
      this.structure = structure;
    }
    apply(doc3) {
      if (this.structure && contentBetween(doc3, this.from, this.to))
        return StepResult.fail("Structure replace would overwrite content");
      return StepResult.fromReplace(doc3, this.from, this.to, this.slice);
    }
    getMap() {
      return new StepMap([this.from, this.to - this.from, this.slice.size]);
    }
    invert(doc3) {
      return new ReplaceStep(this.from, this.from + this.slice.size, doc3.slice(this.from, this.to));
    }
    map(mapping) {
      let from2 = mapping.mapResult(this.from, 1), to = mapping.mapResult(this.to, -1);
      if (from2.deletedAcross && to.deletedAcross)
        return null;
      return new ReplaceStep(from2.pos, Math.max(from2.pos, to.pos), this.slice);
    }
    merge(other) {
      if (!(other instanceof ReplaceStep) || other.structure || this.structure)
        return null;
      if (this.from + this.slice.size == other.from && !this.slice.openEnd && !other.slice.openStart) {
        let slice2 = this.slice.size + other.slice.size == 0 ? Slice.empty : new Slice(this.slice.content.append(other.slice.content), this.slice.openStart, other.slice.openEnd);
        return new ReplaceStep(this.from, this.to + (other.to - other.from), slice2, this.structure);
      } else if (other.to == this.from && !this.slice.openStart && !other.slice.openEnd) {
        let slice2 = this.slice.size + other.slice.size == 0 ? Slice.empty : new Slice(other.slice.content.append(this.slice.content), other.slice.openStart, this.slice.openEnd);
        return new ReplaceStep(other.from, this.to, slice2, this.structure);
      } else {
        return null;
      }
    }
    toJSON() {
      let json = { stepType: "replace", from: this.from, to: this.to };
      if (this.slice.size)
        json.slice = this.slice.toJSON();
      if (this.structure)
        json.structure = true;
      return json;
    }
    static fromJSON(schema2, json) {
      if (typeof json.from != "number" || typeof json.to != "number")
        throw new RangeError("Invalid input for ReplaceStep.fromJSON");
      return new ReplaceStep(json.from, json.to, Slice.fromJSON(schema2, json.slice), !!json.structure);
    }
  };
  Step.jsonID("replace", ReplaceStep);
  var ReplaceAroundStep = class extends Step {
    constructor(from2, to, gapFrom, gapTo, slice2, insert, structure = false) {
      super();
      this.from = from2;
      this.to = to;
      this.gapFrom = gapFrom;
      this.gapTo = gapTo;
      this.slice = slice2;
      this.insert = insert;
      this.structure = structure;
    }
    apply(doc3) {
      if (this.structure && (contentBetween(doc3, this.from, this.gapFrom) || contentBetween(doc3, this.gapTo, this.to)))
        return StepResult.fail("Structure gap-replace would overwrite content");
      let gap = doc3.slice(this.gapFrom, this.gapTo);
      if (gap.openStart || gap.openEnd)
        return StepResult.fail("Gap is not a flat range");
      let inserted = this.slice.insertAt(this.insert, gap.content);
      if (!inserted)
        return StepResult.fail("Content does not fit in gap");
      return StepResult.fromReplace(doc3, this.from, this.to, inserted);
    }
    getMap() {
      return new StepMap([
        this.from,
        this.gapFrom - this.from,
        this.insert,
        this.gapTo,
        this.to - this.gapTo,
        this.slice.size - this.insert
      ]);
    }
    invert(doc3) {
      let gap = this.gapTo - this.gapFrom;
      return new ReplaceAroundStep(this.from, this.from + this.slice.size + gap, this.from + this.insert, this.from + this.insert + gap, doc3.slice(this.from, this.to).removeBetween(this.gapFrom - this.from, this.gapTo - this.from), this.gapFrom - this.from, this.structure);
    }
    map(mapping) {
      let from2 = mapping.mapResult(this.from, 1), to = mapping.mapResult(this.to, -1);
      let gapFrom = mapping.map(this.gapFrom, -1), gapTo = mapping.map(this.gapTo, 1);
      if (from2.deletedAcross && to.deletedAcross || gapFrom < from2.pos || gapTo > to.pos)
        return null;
      return new ReplaceAroundStep(from2.pos, to.pos, gapFrom, gapTo, this.slice, this.insert, this.structure);
    }
    toJSON() {
      let json = {
        stepType: "replaceAround",
        from: this.from,
        to: this.to,
        gapFrom: this.gapFrom,
        gapTo: this.gapTo,
        insert: this.insert
      };
      if (this.slice.size)
        json.slice = this.slice.toJSON();
      if (this.structure)
        json.structure = true;
      return json;
    }
    static fromJSON(schema2, json) {
      if (typeof json.from != "number" || typeof json.to != "number" || typeof json.gapFrom != "number" || typeof json.gapTo != "number" || typeof json.insert != "number")
        throw new RangeError("Invalid input for ReplaceAroundStep.fromJSON");
      return new ReplaceAroundStep(json.from, json.to, json.gapFrom, json.gapTo, Slice.fromJSON(schema2, json.slice), json.insert, !!json.structure);
    }
  };
  Step.jsonID("replaceAround", ReplaceAroundStep);
  function contentBetween(doc3, from2, to) {
    let $from = doc3.resolve(from2), dist = to - from2, depth = $from.depth;
    while (dist > 0 && depth > 0 && $from.indexAfter(depth) == $from.node(depth).childCount) {
      depth--;
      dist--;
    }
    if (dist > 0) {
      let next = $from.node(depth).maybeChild($from.indexAfter(depth));
      while (dist > 0) {
        if (!next || next.isLeaf)
          return true;
        next = next.firstChild;
        dist--;
      }
    }
    return false;
  }
  function addMark(tr, from2, to, mark) {
    let removed = [], added = [];
    let removing, adding;
    tr.doc.nodesBetween(from2, to, (node, pos, parent) => {
      if (!node.isInline)
        return;
      let marks2 = node.marks;
      if (!mark.isInSet(marks2) && parent.type.allowsMarkType(mark.type)) {
        let start = Math.max(pos, from2), end = Math.min(pos + node.nodeSize, to);
        let newSet = mark.addToSet(marks2);
        for (let i = 0; i < marks2.length; i++) {
          if (!marks2[i].isInSet(newSet)) {
            if (removing && removing.to == start && removing.mark.eq(marks2[i]))
              removing.to = end;
            else
              removed.push(removing = new RemoveMarkStep(start, end, marks2[i]));
          }
        }
        if (adding && adding.to == start)
          adding.to = end;
        else
          added.push(adding = new AddMarkStep(start, end, mark));
      }
    });
    removed.forEach((s) => tr.step(s));
    added.forEach((s) => tr.step(s));
  }
  function removeMark(tr, from2, to, mark) {
    let matched = [], step = 0;
    tr.doc.nodesBetween(from2, to, (node, pos) => {
      if (!node.isInline)
        return;
      step++;
      let toRemove = null;
      if (mark instanceof MarkType) {
        let set = node.marks, found2;
        while (found2 = mark.isInSet(set)) {
          (toRemove || (toRemove = [])).push(found2);
          set = found2.removeFromSet(set);
        }
      } else if (mark) {
        if (mark.isInSet(node.marks))
          toRemove = [mark];
      } else {
        toRemove = node.marks;
      }
      if (toRemove && toRemove.length) {
        let end = Math.min(pos + node.nodeSize, to);
        for (let i = 0; i < toRemove.length; i++) {
          let style = toRemove[i], found2;
          for (let j = 0; j < matched.length; j++) {
            let m = matched[j];
            if (m.step == step - 1 && style.eq(matched[j].style))
              found2 = m;
          }
          if (found2) {
            found2.to = end;
            found2.step = step;
          } else {
            matched.push({ style, from: Math.max(pos, from2), to: end, step });
          }
        }
      }
    });
    matched.forEach((m) => tr.step(new RemoveMarkStep(m.from, m.to, m.style)));
  }
  function clearIncompatible(tr, pos, parentType, match = parentType.contentMatch) {
    let node = tr.doc.nodeAt(pos);
    let delSteps = [], cur = pos + 1;
    for (let i = 0; i < node.childCount; i++) {
      let child = node.child(i), end = cur + child.nodeSize;
      let allowed = match.matchType(child.type);
      if (!allowed) {
        delSteps.push(new ReplaceStep(cur, end, Slice.empty));
      } else {
        match = allowed;
        for (let j = 0; j < child.marks.length; j++)
          if (!parentType.allowsMarkType(child.marks[j].type))
            tr.step(new RemoveMarkStep(cur, end, child.marks[j]));
      }
      cur = end;
    }
    if (!match.validEnd) {
      let fill = match.fillBefore(Fragment.empty, true);
      tr.replace(cur, cur, new Slice(fill, 0, 0));
    }
    for (let i = delSteps.length - 1; i >= 0; i--)
      tr.step(delSteps[i]);
  }
  function canCut(node, start, end) {
    return (start == 0 || node.canReplace(start, node.childCount)) && (end == node.childCount || node.canReplace(0, end));
  }
  function liftTarget(range) {
    let parent = range.parent;
    let content = parent.content.cutByIndex(range.startIndex, range.endIndex);
    for (let depth = range.depth; ; --depth) {
      let node = range.$from.node(depth);
      let index = range.$from.index(depth), endIndex = range.$to.indexAfter(depth);
      if (depth < range.depth && node.canReplace(index, endIndex, content))
        return depth;
      if (depth == 0 || node.type.spec.isolating || !canCut(node, index, endIndex))
        break;
    }
    return null;
  }
  function lift(tr, range, target) {
    let { $from, $to, depth } = range;
    let gapStart = $from.before(depth + 1), gapEnd = $to.after(depth + 1);
    let start = gapStart, end = gapEnd;
    let before = Fragment.empty, openStart = 0;
    for (let d = depth, splitting = false; d > target; d--)
      if (splitting || $from.index(d) > 0) {
        splitting = true;
        before = Fragment.from($from.node(d).copy(before));
        openStart++;
      } else {
        start--;
      }
    let after = Fragment.empty, openEnd = 0;
    for (let d = depth, splitting = false; d > target; d--)
      if (splitting || $to.after(d + 1) < $to.end(d)) {
        splitting = true;
        after = Fragment.from($to.node(d).copy(after));
        openEnd++;
      } else {
        end++;
      }
    tr.step(new ReplaceAroundStep(start, end, gapStart, gapEnd, new Slice(before.append(after), openStart, openEnd), before.size - openStart, true));
  }
  function findWrapping(range, nodeType, attrs = null, innerRange = range) {
    let around = findWrappingOutside(range, nodeType);
    let inner = around && findWrappingInside(innerRange, nodeType);
    if (!inner)
      return null;
    return around.map(withAttrs).concat({ type: nodeType, attrs }).concat(inner.map(withAttrs));
  }
  function withAttrs(type) {
    return { type, attrs: null };
  }
  function findWrappingOutside(range, type) {
    let { parent, startIndex, endIndex } = range;
    let around = parent.contentMatchAt(startIndex).findWrapping(type);
    if (!around)
      return null;
    let outer = around.length ? around[0] : type;
    return parent.canReplaceWith(startIndex, endIndex, outer) ? around : null;
  }
  function findWrappingInside(range, type) {
    let { parent, startIndex, endIndex } = range;
    let inner = parent.child(startIndex);
    let inside = type.contentMatch.findWrapping(inner.type);
    if (!inside)
      return null;
    let lastType = inside.length ? inside[inside.length - 1] : type;
    let innerMatch = lastType.contentMatch;
    for (let i = startIndex; innerMatch && i < endIndex; i++)
      innerMatch = innerMatch.matchType(parent.child(i).type);
    if (!innerMatch || !innerMatch.validEnd)
      return null;
    return inside;
  }
  function wrap(tr, range, wrappers) {
    let content = Fragment.empty;
    for (let i = wrappers.length - 1; i >= 0; i--) {
      if (content.size) {
        let match = wrappers[i].type.contentMatch.matchFragment(content);
        if (!match || !match.validEnd)
          throw new RangeError("Wrapper type given to Transform.wrap does not form valid content of its parent wrapper");
      }
      content = Fragment.from(wrappers[i].type.create(wrappers[i].attrs, content));
    }
    let start = range.start, end = range.end;
    tr.step(new ReplaceAroundStep(start, end, start, end, new Slice(content, 0, 0), wrappers.length, true));
  }
  function setBlockType(tr, from2, to, type, attrs) {
    if (!type.isTextblock)
      throw new RangeError("Type given to setBlockType should be a textblock");
    let mapFrom = tr.steps.length;
    tr.doc.nodesBetween(from2, to, (node, pos) => {
      if (node.isTextblock && !node.hasMarkup(type, attrs) && canChangeType(tr.doc, tr.mapping.slice(mapFrom).map(pos), type)) {
        tr.clearIncompatible(tr.mapping.slice(mapFrom).map(pos, 1), type);
        let mapping = tr.mapping.slice(mapFrom);
        let startM = mapping.map(pos, 1), endM = mapping.map(pos + node.nodeSize, 1);
        tr.step(new ReplaceAroundStep(startM, endM, startM + 1, endM - 1, new Slice(Fragment.from(type.create(attrs, null, node.marks)), 0, 0), 1, true));
        return false;
      }
    });
  }
  function canChangeType(doc3, pos, type) {
    let $pos = doc3.resolve(pos), index = $pos.index();
    return $pos.parent.canReplaceWith(index, index + 1, type);
  }
  function setNodeMarkup(tr, pos, type, attrs, marks2) {
    let node = tr.doc.nodeAt(pos);
    if (!node)
      throw new RangeError("No node at given position");
    if (!type)
      type = node.type;
    let newNode = type.create(attrs, null, marks2 || node.marks);
    if (node.isLeaf)
      return tr.replaceWith(pos, pos + node.nodeSize, newNode);
    if (!type.validContent(node.content))
      throw new RangeError("Invalid content for node type " + type.name);
    tr.step(new ReplaceAroundStep(pos, pos + node.nodeSize, pos + 1, pos + node.nodeSize - 1, new Slice(Fragment.from(newNode), 0, 0), 1, true));
  }
  function canSplit(doc3, pos, depth = 1, typesAfter) {
    let $pos = doc3.resolve(pos), base2 = $pos.depth - depth;
    let innerType = typesAfter && typesAfter[typesAfter.length - 1] || $pos.parent;
    if (base2 < 0 || $pos.parent.type.spec.isolating || !$pos.parent.canReplace($pos.index(), $pos.parent.childCount) || !innerType.type.validContent($pos.parent.content.cutByIndex($pos.index(), $pos.parent.childCount)))
      return false;
    for (let d = $pos.depth - 1, i = depth - 2; d > base2; d--, i--) {
      let node = $pos.node(d), index2 = $pos.index(d);
      if (node.type.spec.isolating)
        return false;
      let rest = node.content.cutByIndex(index2, node.childCount);
      let after = typesAfter && typesAfter[i] || node;
      if (after != node)
        rest = rest.replaceChild(0, after.type.create(after.attrs));
      if (!node.canReplace(index2 + 1, node.childCount) || !after.type.validContent(rest))
        return false;
    }
    let index = $pos.indexAfter(base2);
    let baseType = typesAfter && typesAfter[0];
    return $pos.node(base2).canReplaceWith(index, index, baseType ? baseType.type : $pos.node(base2 + 1).type);
  }
  function split(tr, pos, depth = 1, typesAfter) {
    let $pos = tr.doc.resolve(pos), before = Fragment.empty, after = Fragment.empty;
    for (let d = $pos.depth, e = $pos.depth - depth, i = depth - 1; d > e; d--, i--) {
      before = Fragment.from($pos.node(d).copy(before));
      let typeAfter = typesAfter && typesAfter[i];
      after = Fragment.from(typeAfter ? typeAfter.type.create(typeAfter.attrs, after) : $pos.node(d).copy(after));
    }
    tr.step(new ReplaceStep(pos, pos, new Slice(before.append(after), depth, depth), true));
  }
  function canJoin(doc3, pos) {
    let $pos = doc3.resolve(pos), index = $pos.index();
    return joinable2($pos.nodeBefore, $pos.nodeAfter) && $pos.parent.canReplace(index, index + 1);
  }
  function joinable2(a, b) {
    return !!(a && b && !a.isLeaf && a.canAppend(b));
  }
  function joinPoint(doc3, pos, dir = -1) {
    let $pos = doc3.resolve(pos);
    for (let d = $pos.depth; ; d--) {
      let before, after, index = $pos.index(d);
      if (d == $pos.depth) {
        before = $pos.nodeBefore;
        after = $pos.nodeAfter;
      } else if (dir > 0) {
        before = $pos.node(d + 1);
        index++;
        after = $pos.node(d).maybeChild(index);
      } else {
        before = $pos.node(d).maybeChild(index - 1);
        after = $pos.node(d + 1);
      }
      if (before && !before.isTextblock && joinable2(before, after) && $pos.node(d).canReplace(index, index + 1))
        return pos;
      if (d == 0)
        break;
      pos = dir < 0 ? $pos.before(d) : $pos.after(d);
    }
  }
  function join(tr, pos, depth) {
    let step = new ReplaceStep(pos - depth, pos + depth, Slice.empty, true);
    tr.step(step);
  }
  function insertPoint(doc3, pos, nodeType) {
    let $pos = doc3.resolve(pos);
    if ($pos.parent.canReplaceWith($pos.index(), $pos.index(), nodeType))
      return pos;
    if ($pos.parentOffset == 0)
      for (let d = $pos.depth - 1; d >= 0; d--) {
        let index = $pos.index(d);
        if ($pos.node(d).canReplaceWith(index, index, nodeType))
          return $pos.before(d + 1);
        if (index > 0)
          return null;
      }
    if ($pos.parentOffset == $pos.parent.content.size)
      for (let d = $pos.depth - 1; d >= 0; d--) {
        let index = $pos.indexAfter(d);
        if ($pos.node(d).canReplaceWith(index, index, nodeType))
          return $pos.after(d + 1);
        if (index < $pos.node(d).childCount)
          return null;
      }
    return null;
  }
  function dropPoint(doc3, pos, slice2) {
    let $pos = doc3.resolve(pos);
    if (!slice2.content.size)
      return pos;
    let content = slice2.content;
    for (let i = 0; i < slice2.openStart; i++)
      content = content.firstChild.content;
    for (let pass = 1; pass <= (slice2.openStart == 0 && slice2.size ? 2 : 1); pass++) {
      for (let d = $pos.depth; d >= 0; d--) {
        let bias = d == $pos.depth ? 0 : $pos.pos <= ($pos.start(d + 1) + $pos.end(d + 1)) / 2 ? -1 : 1;
        let insertPos = $pos.index(d) + (bias > 0 ? 1 : 0);
        let parent = $pos.node(d), fits = false;
        if (pass == 1) {
          fits = parent.canReplace(insertPos, insertPos, content);
        } else {
          let wrapping = parent.contentMatchAt(insertPos).findWrapping(content.firstChild.type);
          fits = wrapping && parent.canReplaceWith(insertPos, insertPos, wrapping[0]);
        }
        if (fits)
          return bias == 0 ? $pos.pos : bias < 0 ? $pos.before(d + 1) : $pos.after(d + 1);
      }
    }
    return null;
  }
  function replaceStep(doc3, from2, to = from2, slice2 = Slice.empty) {
    if (from2 == to && !slice2.size)
      return null;
    let $from = doc3.resolve(from2), $to = doc3.resolve(to);
    if (fitsTrivially($from, $to, slice2))
      return new ReplaceStep(from2, to, slice2);
    return new Fitter($from, $to, slice2).fit();
  }
  function fitsTrivially($from, $to, slice2) {
    return !slice2.openStart && !slice2.openEnd && $from.start() == $to.start() && $from.parent.canReplace($from.index(), $to.index(), slice2.content);
  }
  var Fitter = class {
    constructor($from, $to, unplaced) {
      this.$from = $from;
      this.$to = $to;
      this.unplaced = unplaced;
      this.frontier = [];
      this.placed = Fragment.empty;
      for (let i = 0; i <= $from.depth; i++) {
        let node = $from.node(i);
        this.frontier.push({
          type: node.type,
          match: node.contentMatchAt($from.indexAfter(i))
        });
      }
      for (let i = $from.depth; i > 0; i--)
        this.placed = Fragment.from($from.node(i).copy(this.placed));
    }
    get depth() {
      return this.frontier.length - 1;
    }
    fit() {
      while (this.unplaced.size) {
        let fit = this.findFittable();
        if (fit)
          this.placeNodes(fit);
        else
          this.openMore() || this.dropNode();
      }
      let moveInline = this.mustMoveInline(), placedSize = this.placed.size - this.depth - this.$from.depth;
      let $from = this.$from, $to = this.close(moveInline < 0 ? this.$to : $from.doc.resolve(moveInline));
      if (!$to)
        return null;
      let content = this.placed, openStart = $from.depth, openEnd = $to.depth;
      while (openStart && openEnd && content.childCount == 1) {
        content = content.firstChild.content;
        openStart--;
        openEnd--;
      }
      let slice2 = new Slice(content, openStart, openEnd);
      if (moveInline > -1)
        return new ReplaceAroundStep($from.pos, moveInline, this.$to.pos, this.$to.end(), slice2, placedSize);
      if (slice2.size || $from.pos != this.$to.pos)
        return new ReplaceStep($from.pos, $to.pos, slice2);
      return null;
    }
    findFittable() {
      for (let pass = 1; pass <= 2; pass++) {
        for (let sliceDepth = this.unplaced.openStart; sliceDepth >= 0; sliceDepth--) {
          let fragment, parent = null;
          if (sliceDepth) {
            parent = contentAt(this.unplaced.content, sliceDepth - 1).firstChild;
            fragment = parent.content;
          } else {
            fragment = this.unplaced.content;
          }
          let first = fragment.firstChild;
          for (let frontierDepth = this.depth; frontierDepth >= 0; frontierDepth--) {
            let { type, match } = this.frontier[frontierDepth], wrap2, inject = null;
            if (pass == 1 && (first ? match.matchType(first.type) || (inject = match.fillBefore(Fragment.from(first), false)) : parent && type.compatibleContent(parent.type)))
              return { sliceDepth, frontierDepth, parent, inject };
            else if (pass == 2 && first && (wrap2 = match.findWrapping(first.type)))
              return { sliceDepth, frontierDepth, parent, wrap: wrap2 };
            if (parent && match.matchType(parent.type))
              break;
          }
        }
      }
    }
    openMore() {
      let { content, openStart, openEnd } = this.unplaced;
      let inner = contentAt(content, openStart);
      if (!inner.childCount || inner.firstChild.isLeaf)
        return false;
      this.unplaced = new Slice(content, openStart + 1, Math.max(openEnd, inner.size + openStart >= content.size - openEnd ? openStart + 1 : 0));
      return true;
    }
    dropNode() {
      let { content, openStart, openEnd } = this.unplaced;
      let inner = contentAt(content, openStart);
      if (inner.childCount <= 1 && openStart > 0) {
        let openAtEnd = content.size - openStart <= openStart + inner.size;
        this.unplaced = new Slice(dropFromFragment(content, openStart - 1, 1), openStart - 1, openAtEnd ? openStart - 1 : openEnd);
      } else {
        this.unplaced = new Slice(dropFromFragment(content, openStart, 1), openStart, openEnd);
      }
    }
    placeNodes({ sliceDepth, frontierDepth, parent, inject, wrap: wrap2 }) {
      while (this.depth > frontierDepth)
        this.closeFrontierNode();
      if (wrap2)
        for (let i = 0; i < wrap2.length; i++)
          this.openFrontierNode(wrap2[i]);
      let slice2 = this.unplaced, fragment = parent ? parent.content : slice2.content;
      let openStart = slice2.openStart - sliceDepth;
      let taken = 0, add2 = [];
      let { match, type } = this.frontier[frontierDepth];
      if (inject) {
        for (let i = 0; i < inject.childCount; i++)
          add2.push(inject.child(i));
        match = match.matchFragment(inject);
      }
      let openEndCount = fragment.size + sliceDepth - (slice2.content.size - slice2.openEnd);
      while (taken < fragment.childCount) {
        let next = fragment.child(taken), matches2 = match.matchType(next.type);
        if (!matches2)
          break;
        taken++;
        if (taken > 1 || openStart == 0 || next.content.size) {
          match = matches2;
          add2.push(closeNodeStart(next.mark(type.allowedMarks(next.marks)), taken == 1 ? openStart : 0, taken == fragment.childCount ? openEndCount : -1));
        }
      }
      let toEnd = taken == fragment.childCount;
      if (!toEnd)
        openEndCount = -1;
      this.placed = addToFragment(this.placed, frontierDepth, Fragment.from(add2));
      this.frontier[frontierDepth].match = match;
      if (toEnd && openEndCount < 0 && parent && parent.type == this.frontier[this.depth].type && this.frontier.length > 1)
        this.closeFrontierNode();
      for (let i = 0, cur = fragment; i < openEndCount; i++) {
        let node = cur.lastChild;
        this.frontier.push({ type: node.type, match: node.contentMatchAt(node.childCount) });
        cur = node.content;
      }
      this.unplaced = !toEnd ? new Slice(dropFromFragment(slice2.content, sliceDepth, taken), slice2.openStart, slice2.openEnd) : sliceDepth == 0 ? Slice.empty : new Slice(dropFromFragment(slice2.content, sliceDepth - 1, 1), sliceDepth - 1, openEndCount < 0 ? slice2.openEnd : sliceDepth - 1);
    }
    mustMoveInline() {
      if (!this.$to.parent.isTextblock)
        return -1;
      let top = this.frontier[this.depth], level;
      if (!top.type.isTextblock || !contentAfterFits(this.$to, this.$to.depth, top.type, top.match, false) || this.$to.depth == this.depth && (level = this.findCloseLevel(this.$to)) && level.depth == this.depth)
        return -1;
      let { depth } = this.$to, after = this.$to.after(depth);
      while (depth > 1 && after == this.$to.end(--depth))
        ++after;
      return after;
    }
    findCloseLevel($to) {
      scan:
        for (let i = Math.min(this.depth, $to.depth); i >= 0; i--) {
          let { match, type } = this.frontier[i];
          let dropInner = i < $to.depth && $to.end(i + 1) == $to.pos + ($to.depth - (i + 1));
          let fit = contentAfterFits($to, i, type, match, dropInner);
          if (!fit)
            continue;
          for (let d = i - 1; d >= 0; d--) {
            let { match: match2, type: type2 } = this.frontier[d];
            let matches2 = contentAfterFits($to, d, type2, match2, true);
            if (!matches2 || matches2.childCount)
              continue scan;
          }
          return { depth: i, fit, move: dropInner ? $to.doc.resolve($to.after(i + 1)) : $to };
        }
    }
    close($to) {
      let close2 = this.findCloseLevel($to);
      if (!close2)
        return null;
      while (this.depth > close2.depth)
        this.closeFrontierNode();
      if (close2.fit.childCount)
        this.placed = addToFragment(this.placed, close2.depth, close2.fit);
      $to = close2.move;
      for (let d = close2.depth + 1; d <= $to.depth; d++) {
        let node = $to.node(d), add2 = node.type.contentMatch.fillBefore(node.content, true, $to.index(d));
        this.openFrontierNode(node.type, node.attrs, add2);
      }
      return $to;
    }
    openFrontierNode(type, attrs = null, content) {
      let top = this.frontier[this.depth];
      top.match = top.match.matchType(type);
      this.placed = addToFragment(this.placed, this.depth, Fragment.from(type.create(attrs, content)));
      this.frontier.push({ type, match: type.contentMatch });
    }
    closeFrontierNode() {
      let open = this.frontier.pop();
      let add2 = open.match.fillBefore(Fragment.empty, true);
      if (add2.childCount)
        this.placed = addToFragment(this.placed, this.frontier.length, add2);
    }
  };
  function dropFromFragment(fragment, depth, count) {
    if (depth == 0)
      return fragment.cutByIndex(count, fragment.childCount);
    return fragment.replaceChild(0, fragment.firstChild.copy(dropFromFragment(fragment.firstChild.content, depth - 1, count)));
  }
  function addToFragment(fragment, depth, content) {
    if (depth == 0)
      return fragment.append(content);
    return fragment.replaceChild(fragment.childCount - 1, fragment.lastChild.copy(addToFragment(fragment.lastChild.content, depth - 1, content)));
  }
  function contentAt(fragment, depth) {
    for (let i = 0; i < depth; i++)
      fragment = fragment.firstChild.content;
    return fragment;
  }
  function closeNodeStart(node, openStart, openEnd) {
    if (openStart <= 0)
      return node;
    let frag = node.content;
    if (openStart > 1)
      frag = frag.replaceChild(0, closeNodeStart(frag.firstChild, openStart - 1, frag.childCount == 1 ? openEnd - 1 : 0));
    if (openStart > 0) {
      frag = node.type.contentMatch.fillBefore(frag).append(frag);
      if (openEnd <= 0)
        frag = frag.append(node.type.contentMatch.matchFragment(frag).fillBefore(Fragment.empty, true));
    }
    return node.copy(frag);
  }
  function contentAfterFits($to, depth, type, match, open) {
    let node = $to.node(depth), index = open ? $to.indexAfter(depth) : $to.index(depth);
    if (index == node.childCount && !type.compatibleContent(node.type))
      return null;
    let fit = match.fillBefore(node.content, true, index);
    return fit && !invalidMarks(type, node.content, index) ? fit : null;
  }
  function invalidMarks(type, fragment, start) {
    for (let i = start; i < fragment.childCount; i++)
      if (!type.allowsMarks(fragment.child(i).marks))
        return true;
    return false;
  }
  function definesContent(type) {
    return type.spec.defining || type.spec.definingForContent;
  }
  function replaceRange(tr, from2, to, slice2) {
    if (!slice2.size)
      return tr.deleteRange(from2, to);
    let $from = tr.doc.resolve(from2), $to = tr.doc.resolve(to);
    if (fitsTrivially($from, $to, slice2))
      return tr.step(new ReplaceStep(from2, to, slice2));
    let targetDepths = coveredDepths($from, tr.doc.resolve(to));
    if (targetDepths[targetDepths.length - 1] == 0)
      targetDepths.pop();
    let preferredTarget = -($from.depth + 1);
    targetDepths.unshift(preferredTarget);
    for (let d = $from.depth, pos = $from.pos - 1; d > 0; d--, pos--) {
      let spec = $from.node(d).type.spec;
      if (spec.defining || spec.definingAsContext || spec.isolating)
        break;
      if (targetDepths.indexOf(d) > -1)
        preferredTarget = d;
      else if ($from.before(d) == pos)
        targetDepths.splice(1, 0, -d);
    }
    let preferredTargetIndex = targetDepths.indexOf(preferredTarget);
    let leftNodes = [], preferredDepth = slice2.openStart;
    for (let content = slice2.content, i = 0; ; i++) {
      let node = content.firstChild;
      leftNodes.push(node);
      if (i == slice2.openStart)
        break;
      content = node.content;
    }
    for (let d = preferredDepth - 1; d >= 0; d--) {
      let type = leftNodes[d].type, def = definesContent(type);
      if (def && $from.node(preferredTargetIndex).type != type)
        preferredDepth = d;
      else if (def || !type.isTextblock)
        break;
    }
    for (let j = slice2.openStart; j >= 0; j--) {
      let openDepth = (j + preferredDepth + 1) % (slice2.openStart + 1);
      let insert = leftNodes[openDepth];
      if (!insert)
        continue;
      for (let i = 0; i < targetDepths.length; i++) {
        let targetDepth = targetDepths[(i + preferredTargetIndex) % targetDepths.length], expand = true;
        if (targetDepth < 0) {
          expand = false;
          targetDepth = -targetDepth;
        }
        let parent = $from.node(targetDepth - 1), index = $from.index(targetDepth - 1);
        if (parent.canReplaceWith(index, index, insert.type, insert.marks))
          return tr.replace($from.before(targetDepth), expand ? $to.after(targetDepth) : to, new Slice(closeFragment(slice2.content, 0, slice2.openStart, openDepth), openDepth, slice2.openEnd));
      }
    }
    let startSteps = tr.steps.length;
    for (let i = targetDepths.length - 1; i >= 0; i--) {
      tr.replace(from2, to, slice2);
      if (tr.steps.length > startSteps)
        break;
      let depth = targetDepths[i];
      if (depth < 0)
        continue;
      from2 = $from.before(depth);
      to = $to.after(depth);
    }
  }
  function closeFragment(fragment, depth, oldOpen, newOpen, parent) {
    if (depth < oldOpen) {
      let first = fragment.firstChild;
      fragment = fragment.replaceChild(0, first.copy(closeFragment(first.content, depth + 1, oldOpen, newOpen, first)));
    }
    if (depth > newOpen) {
      let match = parent.contentMatchAt(0);
      let start = match.fillBefore(fragment).append(fragment);
      fragment = start.append(match.matchFragment(start).fillBefore(Fragment.empty, true));
    }
    return fragment;
  }
  function replaceRangeWith(tr, from2, to, node) {
    if (!node.isInline && from2 == to && tr.doc.resolve(from2).parent.content.size) {
      let point = insertPoint(tr.doc, from2, node.type);
      if (point != null)
        from2 = to = point;
    }
    tr.replaceRange(from2, to, new Slice(Fragment.from(node), 0, 0));
  }
  function deleteRange(tr, from2, to) {
    let $from = tr.doc.resolve(from2), $to = tr.doc.resolve(to);
    let covered = coveredDepths($from, $to);
    for (let i = 0; i < covered.length; i++) {
      let depth = covered[i], last = i == covered.length - 1;
      if (last && depth == 0 || $from.node(depth).type.contentMatch.validEnd)
        return tr.delete($from.start(depth), $to.end(depth));
      if (depth > 0 && (last || $from.node(depth - 1).canReplace($from.index(depth - 1), $to.indexAfter(depth - 1))))
        return tr.delete($from.before(depth), $to.after(depth));
    }
    for (let d = 1; d <= $from.depth && d <= $to.depth; d++) {
      if (from2 - $from.start(d) == $from.depth - d && to > $from.end(d) && $to.end(d) - to != $to.depth - d)
        return tr.delete($from.before(d), to);
    }
    tr.delete(from2, to);
  }
  function coveredDepths($from, $to) {
    let result = [], minDepth = Math.min($from.depth, $to.depth);
    for (let d = minDepth; d >= 0; d--) {
      let start = $from.start(d);
      if (start < $from.pos - ($from.depth - d) || $to.end(d) > $to.pos + ($to.depth - d) || $from.node(d).type.spec.isolating || $to.node(d).type.spec.isolating)
        break;
      if (start == $to.start(d) || d == $from.depth && d == $to.depth && $from.parent.inlineContent && $to.parent.inlineContent && d && $to.start(d - 1) == start - 1)
        result.push(d);
    }
    return result;
  }
  var TransformError = class extends Error {
  };
  TransformError = function TransformError2(message) {
    let err = Error.call(this, message);
    err.__proto__ = TransformError2.prototype;
    return err;
  };
  TransformError.prototype = Object.create(Error.prototype);
  TransformError.prototype.constructor = TransformError;
  TransformError.prototype.name = "TransformError";
  var Transform = class {
    constructor(doc3) {
      this.doc = doc3;
      this.steps = [];
      this.docs = [];
      this.mapping = new Mapping();
    }
    get before() {
      return this.docs.length ? this.docs[0] : this.doc;
    }
    step(step) {
      let result = this.maybeStep(step);
      if (result.failed)
        throw new TransformError(result.failed);
      return this;
    }
    maybeStep(step) {
      let result = step.apply(this.doc);
      if (!result.failed)
        this.addStep(step, result.doc);
      return result;
    }
    get docChanged() {
      return this.steps.length > 0;
    }
    addStep(step, doc3) {
      this.docs.push(this.doc);
      this.steps.push(step);
      this.mapping.appendMap(step.getMap());
      this.doc = doc3;
    }
    replace(from2, to = from2, slice2 = Slice.empty) {
      let step = replaceStep(this.doc, from2, to, slice2);
      if (step)
        this.step(step);
      return this;
    }
    replaceWith(from2, to, content) {
      return this.replace(from2, to, new Slice(Fragment.from(content), 0, 0));
    }
    delete(from2, to) {
      return this.replace(from2, to, Slice.empty);
    }
    insert(pos, content) {
      return this.replaceWith(pos, pos, content);
    }
    replaceRange(from2, to, slice2) {
      replaceRange(this, from2, to, slice2);
      return this;
    }
    replaceRangeWith(from2, to, node) {
      replaceRangeWith(this, from2, to, node);
      return this;
    }
    deleteRange(from2, to) {
      deleteRange(this, from2, to);
      return this;
    }
    lift(range, target) {
      lift(this, range, target);
      return this;
    }
    join(pos, depth = 1) {
      join(this, pos, depth);
      return this;
    }
    wrap(range, wrappers) {
      wrap(this, range, wrappers);
      return this;
    }
    setBlockType(from2, to = from2, type, attrs = null) {
      setBlockType(this, from2, to, type, attrs);
      return this;
    }
    setNodeMarkup(pos, type, attrs = null, marks2 = []) {
      setNodeMarkup(this, pos, type, attrs, marks2);
      return this;
    }
    split(pos, depth = 1, typesAfter) {
      split(this, pos, depth, typesAfter);
      return this;
    }
    addMark(from2, to, mark) {
      addMark(this, from2, to, mark);
      return this;
    }
    removeMark(from2, to, mark) {
      removeMark(this, from2, to, mark);
      return this;
    }
    clearIncompatible(pos, parentType, match) {
      clearIncompatible(this, pos, parentType, match);
      return this;
    }
  };

  // node_modules/prosemirror-state/dist/index.js
  var classesById = /* @__PURE__ */ Object.create(null);
  var Selection = class {
    constructor($anchor, $head, ranges) {
      this.$anchor = $anchor;
      this.$head = $head;
      this.ranges = ranges || [new SelectionRange($anchor.min($head), $anchor.max($head))];
    }
    get anchor() {
      return this.$anchor.pos;
    }
    get head() {
      return this.$head.pos;
    }
    get from() {
      return this.$from.pos;
    }
    get to() {
      return this.$to.pos;
    }
    get $from() {
      return this.ranges[0].$from;
    }
    get $to() {
      return this.ranges[0].$to;
    }
    get empty() {
      let ranges = this.ranges;
      for (let i = 0; i < ranges.length; i++)
        if (ranges[i].$from.pos != ranges[i].$to.pos)
          return false;
      return true;
    }
    content() {
      return this.$from.doc.slice(this.from, this.to, true);
    }
    replace(tr, content = Slice.empty) {
      let lastNode = content.content.lastChild, lastParent = null;
      for (let i = 0; i < content.openEnd; i++) {
        lastParent = lastNode;
        lastNode = lastNode.lastChild;
      }
      let mapFrom = tr.steps.length, ranges = this.ranges;
      for (let i = 0; i < ranges.length; i++) {
        let { $from, $to } = ranges[i], mapping = tr.mapping.slice(mapFrom);
        tr.replaceRange(mapping.map($from.pos), mapping.map($to.pos), i ? Slice.empty : content);
        if (i == 0)
          selectionToInsertionEnd(tr, mapFrom, (lastNode ? lastNode.isInline : lastParent && lastParent.isTextblock) ? -1 : 1);
      }
    }
    replaceWith(tr, node) {
      let mapFrom = tr.steps.length, ranges = this.ranges;
      for (let i = 0; i < ranges.length; i++) {
        let { $from, $to } = ranges[i], mapping = tr.mapping.slice(mapFrom);
        let from2 = mapping.map($from.pos), to = mapping.map($to.pos);
        if (i) {
          tr.deleteRange(from2, to);
        } else {
          tr.replaceRangeWith(from2, to, node);
          selectionToInsertionEnd(tr, mapFrom, node.isInline ? -1 : 1);
        }
      }
    }
    static findFrom($pos, dir, textOnly = false) {
      let inner = $pos.parent.inlineContent ? new TextSelection($pos) : findSelectionIn($pos.node(0), $pos.parent, $pos.pos, $pos.index(), dir, textOnly);
      if (inner)
        return inner;
      for (let depth = $pos.depth - 1; depth >= 0; depth--) {
        let found2 = dir < 0 ? findSelectionIn($pos.node(0), $pos.node(depth), $pos.before(depth + 1), $pos.index(depth), dir, textOnly) : findSelectionIn($pos.node(0), $pos.node(depth), $pos.after(depth + 1), $pos.index(depth) + 1, dir, textOnly);
        if (found2)
          return found2;
      }
      return null;
    }
    static near($pos, bias = 1) {
      return this.findFrom($pos, bias) || this.findFrom($pos, -bias) || new AllSelection($pos.node(0));
    }
    static atStart(doc3) {
      return findSelectionIn(doc3, doc3, 0, 0, 1) || new AllSelection(doc3);
    }
    static atEnd(doc3) {
      return findSelectionIn(doc3, doc3, doc3.content.size, doc3.childCount, -1) || new AllSelection(doc3);
    }
    static fromJSON(doc3, json) {
      if (!json || !json.type)
        throw new RangeError("Invalid input for Selection.fromJSON");
      let cls = classesById[json.type];
      if (!cls)
        throw new RangeError(`No selection type ${json.type} defined`);
      return cls.fromJSON(doc3, json);
    }
    static jsonID(id, selectionClass) {
      if (id in classesById)
        throw new RangeError("Duplicate use of selection JSON ID " + id);
      classesById[id] = selectionClass;
      selectionClass.prototype.jsonID = id;
      return selectionClass;
    }
    getBookmark() {
      return TextSelection.between(this.$anchor, this.$head).getBookmark();
    }
  };
  Selection.prototype.visible = true;
  var SelectionRange = class {
    constructor($from, $to) {
      this.$from = $from;
      this.$to = $to;
    }
  };
  var warnedAboutTextSelection = false;
  function checkTextSelection($pos) {
    if (!warnedAboutTextSelection && !$pos.parent.inlineContent) {
      warnedAboutTextSelection = true;
      console["warn"]("TextSelection endpoint not pointing into a node with inline content (" + $pos.parent.type.name + ")");
    }
  }
  var TextSelection = class extends Selection {
    constructor($anchor, $head = $anchor) {
      checkTextSelection($anchor);
      checkTextSelection($head);
      super($anchor, $head);
    }
    get $cursor() {
      return this.$anchor.pos == this.$head.pos ? this.$head : null;
    }
    map(doc3, mapping) {
      let $head = doc3.resolve(mapping.map(this.head));
      if (!$head.parent.inlineContent)
        return Selection.near($head);
      let $anchor = doc3.resolve(mapping.map(this.anchor));
      return new TextSelection($anchor.parent.inlineContent ? $anchor : $head, $head);
    }
    replace(tr, content = Slice.empty) {
      super.replace(tr, content);
      if (content == Slice.empty) {
        let marks2 = this.$from.marksAcross(this.$to);
        if (marks2)
          tr.ensureMarks(marks2);
      }
    }
    eq(other) {
      return other instanceof TextSelection && other.anchor == this.anchor && other.head == this.head;
    }
    getBookmark() {
      return new TextBookmark(this.anchor, this.head);
    }
    toJSON() {
      return { type: "text", anchor: this.anchor, head: this.head };
    }
    static fromJSON(doc3, json) {
      if (typeof json.anchor != "number" || typeof json.head != "number")
        throw new RangeError("Invalid input for TextSelection.fromJSON");
      return new TextSelection(doc3.resolve(json.anchor), doc3.resolve(json.head));
    }
    static create(doc3, anchor, head = anchor) {
      let $anchor = doc3.resolve(anchor);
      return new this($anchor, head == anchor ? $anchor : doc3.resolve(head));
    }
    static between($anchor, $head, bias) {
      let dPos = $anchor.pos - $head.pos;
      if (!bias || dPos)
        bias = dPos >= 0 ? 1 : -1;
      if (!$head.parent.inlineContent) {
        let found2 = Selection.findFrom($head, bias, true) || Selection.findFrom($head, -bias, true);
        if (found2)
          $head = found2.$head;
        else
          return Selection.near($head, bias);
      }
      if (!$anchor.parent.inlineContent) {
        if (dPos == 0) {
          $anchor = $head;
        } else {
          $anchor = (Selection.findFrom($anchor, -bias, true) || Selection.findFrom($anchor, bias, true)).$anchor;
          if ($anchor.pos < $head.pos != dPos < 0)
            $anchor = $head;
        }
      }
      return new TextSelection($anchor, $head);
    }
  };
  Selection.jsonID("text", TextSelection);
  var TextBookmark = class {
    constructor(anchor, head) {
      this.anchor = anchor;
      this.head = head;
    }
    map(mapping) {
      return new TextBookmark(mapping.map(this.anchor), mapping.map(this.head));
    }
    resolve(doc3) {
      return TextSelection.between(doc3.resolve(this.anchor), doc3.resolve(this.head));
    }
  };
  var NodeSelection = class extends Selection {
    constructor($pos) {
      let node = $pos.nodeAfter;
      let $end = $pos.node(0).resolve($pos.pos + node.nodeSize);
      super($pos, $end);
      this.node = node;
    }
    map(doc3, mapping) {
      let { deleted, pos } = mapping.mapResult(this.anchor);
      let $pos = doc3.resolve(pos);
      if (deleted)
        return Selection.near($pos);
      return new NodeSelection($pos);
    }
    content() {
      return new Slice(Fragment.from(this.node), 0, 0);
    }
    eq(other) {
      return other instanceof NodeSelection && other.anchor == this.anchor;
    }
    toJSON() {
      return { type: "node", anchor: this.anchor };
    }
    getBookmark() {
      return new NodeBookmark(this.anchor);
    }
    static fromJSON(doc3, json) {
      if (typeof json.anchor != "number")
        throw new RangeError("Invalid input for NodeSelection.fromJSON");
      return new NodeSelection(doc3.resolve(json.anchor));
    }
    static create(doc3, from2) {
      return new NodeSelection(doc3.resolve(from2));
    }
    static isSelectable(node) {
      return !node.isText && node.type.spec.selectable !== false;
    }
  };
  NodeSelection.prototype.visible = false;
  Selection.jsonID("node", NodeSelection);
  var NodeBookmark = class {
    constructor(anchor) {
      this.anchor = anchor;
    }
    map(mapping) {
      let { deleted, pos } = mapping.mapResult(this.anchor);
      return deleted ? new TextBookmark(pos, pos) : new NodeBookmark(pos);
    }
    resolve(doc3) {
      let $pos = doc3.resolve(this.anchor), node = $pos.nodeAfter;
      if (node && NodeSelection.isSelectable(node))
        return new NodeSelection($pos);
      return Selection.near($pos);
    }
  };
  var AllSelection = class extends Selection {
    constructor(doc3) {
      super(doc3.resolve(0), doc3.resolve(doc3.content.size));
    }
    replace(tr, content = Slice.empty) {
      if (content == Slice.empty) {
        tr.delete(0, tr.doc.content.size);
        let sel = Selection.atStart(tr.doc);
        if (!sel.eq(tr.selection))
          tr.setSelection(sel);
      } else {
        super.replace(tr, content);
      }
    }
    toJSON() {
      return { type: "all" };
    }
    static fromJSON(doc3) {
      return new AllSelection(doc3);
    }
    map(doc3) {
      return new AllSelection(doc3);
    }
    eq(other) {
      return other instanceof AllSelection;
    }
    getBookmark() {
      return AllBookmark;
    }
  };
  Selection.jsonID("all", AllSelection);
  var AllBookmark = {
    map() {
      return this;
    },
    resolve(doc3) {
      return new AllSelection(doc3);
    }
  };
  function findSelectionIn(doc3, node, pos, index, dir, text = false) {
    if (node.inlineContent)
      return TextSelection.create(doc3, pos);
    for (let i = index - (dir > 0 ? 0 : 1); dir > 0 ? i < node.childCount : i >= 0; i += dir) {
      let child = node.child(i);
      if (!child.isAtom) {
        let inner = findSelectionIn(doc3, child, pos + dir, dir < 0 ? child.childCount : 0, dir, text);
        if (inner)
          return inner;
      } else if (!text && NodeSelection.isSelectable(child)) {
        return NodeSelection.create(doc3, pos - (dir < 0 ? child.nodeSize : 0));
      }
      pos += child.nodeSize * dir;
    }
    return null;
  }
  function selectionToInsertionEnd(tr, startLen, bias) {
    let last = tr.steps.length - 1;
    if (last < startLen)
      return;
    let step = tr.steps[last];
    if (!(step instanceof ReplaceStep || step instanceof ReplaceAroundStep))
      return;
    let map2 = tr.mapping.maps[last], end;
    map2.forEach((_from, _to, _newFrom, newTo) => {
      if (end == null)
        end = newTo;
    });
    tr.setSelection(Selection.near(tr.doc.resolve(end), bias));
  }
  var UPDATED_SEL = 1;
  var UPDATED_MARKS = 2;
  var UPDATED_SCROLL = 4;
  var Transaction = class extends Transform {
    constructor(state) {
      super(state.doc);
      this.curSelectionFor = 0;
      this.updated = 0;
      this.meta = /* @__PURE__ */ Object.create(null);
      this.time = Date.now();
      this.curSelection = state.selection;
      this.storedMarks = state.storedMarks;
    }
    get selection() {
      if (this.curSelectionFor < this.steps.length) {
        this.curSelection = this.curSelection.map(this.doc, this.mapping.slice(this.curSelectionFor));
        this.curSelectionFor = this.steps.length;
      }
      return this.curSelection;
    }
    setSelection(selection) {
      if (selection.$from.doc != this.doc)
        throw new RangeError("Selection passed to setSelection must point at the current document");
      this.curSelection = selection;
      this.curSelectionFor = this.steps.length;
      this.updated = (this.updated | UPDATED_SEL) & ~UPDATED_MARKS;
      this.storedMarks = null;
      return this;
    }
    get selectionSet() {
      return (this.updated & UPDATED_SEL) > 0;
    }
    setStoredMarks(marks2) {
      this.storedMarks = marks2;
      this.updated |= UPDATED_MARKS;
      return this;
    }
    ensureMarks(marks2) {
      if (!Mark.sameSet(this.storedMarks || this.selection.$from.marks(), marks2))
        this.setStoredMarks(marks2);
      return this;
    }
    addStoredMark(mark) {
      return this.ensureMarks(mark.addToSet(this.storedMarks || this.selection.$head.marks()));
    }
    removeStoredMark(mark) {
      return this.ensureMarks(mark.removeFromSet(this.storedMarks || this.selection.$head.marks()));
    }
    get storedMarksSet() {
      return (this.updated & UPDATED_MARKS) > 0;
    }
    addStep(step, doc3) {
      super.addStep(step, doc3);
      this.updated = this.updated & ~UPDATED_MARKS;
      this.storedMarks = null;
    }
    setTime(time) {
      this.time = time;
      return this;
    }
    replaceSelection(slice2) {
      this.selection.replace(this, slice2);
      return this;
    }
    replaceSelectionWith(node, inheritMarks = true) {
      let selection = this.selection;
      if (inheritMarks)
        node = node.mark(this.storedMarks || (selection.empty ? selection.$from.marks() : selection.$from.marksAcross(selection.$to) || Mark.none));
      selection.replaceWith(this, node);
      return this;
    }
    deleteSelection() {
      this.selection.replace(this);
      return this;
    }
    insertText(text, from2, to) {
      let schema2 = this.doc.type.schema;
      if (from2 == null) {
        if (!text)
          return this.deleteSelection();
        return this.replaceSelectionWith(schema2.text(text), true);
      } else {
        if (to == null)
          to = from2;
        to = to == null ? from2 : to;
        if (!text)
          return this.deleteRange(from2, to);
        let marks2 = this.storedMarks;
        if (!marks2) {
          let $from = this.doc.resolve(from2);
          marks2 = to == from2 ? $from.marks() : $from.marksAcross(this.doc.resolve(to));
        }
        this.replaceRangeWith(from2, to, schema2.text(text, marks2));
        if (!this.selection.empty)
          this.setSelection(Selection.near(this.selection.$to));
        return this;
      }
    }
    setMeta(key2, value) {
      this.meta[typeof key2 == "string" ? key2 : key2.key] = value;
      return this;
    }
    getMeta(key2) {
      return this.meta[typeof key2 == "string" ? key2 : key2.key];
    }
    get isGeneric() {
      for (let _ in this.meta)
        return false;
      return true;
    }
    scrollIntoView() {
      this.updated |= UPDATED_SCROLL;
      return this;
    }
    get scrolledIntoView() {
      return (this.updated & UPDATED_SCROLL) > 0;
    }
  };
  function bind(f, self) {
    return !self || !f ? f : f.bind(self);
  }
  var FieldDesc = class {
    constructor(name, desc, self) {
      this.name = name;
      this.init = bind(desc.init, self);
      this.apply = bind(desc.apply, self);
    }
  };
  var baseFields = [
    new FieldDesc("doc", {
      init(config) {
        return config.doc || config.schema.topNodeType.createAndFill();
      },
      apply(tr) {
        return tr.doc;
      }
    }),
    new FieldDesc("selection", {
      init(config, instance) {
        return config.selection || Selection.atStart(instance.doc);
      },
      apply(tr) {
        return tr.selection;
      }
    }),
    new FieldDesc("storedMarks", {
      init(config) {
        return config.storedMarks || null;
      },
      apply(tr, _marks, _old, state) {
        return state.selection.$cursor ? tr.storedMarks : null;
      }
    }),
    new FieldDesc("scrollToSelection", {
      init() {
        return 0;
      },
      apply(tr, prev) {
        return tr.scrolledIntoView ? prev + 1 : prev;
      }
    })
  ];
  var Configuration = class {
    constructor(schema2, plugins) {
      this.schema = schema2;
      this.plugins = [];
      this.pluginsByKey = /* @__PURE__ */ Object.create(null);
      this.fields = baseFields.slice();
      if (plugins)
        plugins.forEach((plugin) => {
          if (this.pluginsByKey[plugin.key])
            throw new RangeError("Adding different instances of a keyed plugin (" + plugin.key + ")");
          this.plugins.push(plugin);
          this.pluginsByKey[plugin.key] = plugin;
          if (plugin.spec.state)
            this.fields.push(new FieldDesc(plugin.key, plugin.spec.state, plugin));
        });
    }
  };
  var EditorState = class {
    constructor(config) {
      this.config = config;
    }
    get schema() {
      return this.config.schema;
    }
    get plugins() {
      return this.config.plugins;
    }
    apply(tr) {
      return this.applyTransaction(tr).state;
    }
    filterTransaction(tr, ignore = -1) {
      for (let i = 0; i < this.config.plugins.length; i++)
        if (i != ignore) {
          let plugin = this.config.plugins[i];
          if (plugin.spec.filterTransaction && !plugin.spec.filterTransaction.call(plugin, tr, this))
            return false;
        }
      return true;
    }
    applyTransaction(rootTr) {
      if (!this.filterTransaction(rootTr))
        return { state: this, transactions: [] };
      let trs = [rootTr], newState = this.applyInner(rootTr), seen = null;
      for (; ; ) {
        let haveNew = false;
        for (let i = 0; i < this.config.plugins.length; i++) {
          let plugin = this.config.plugins[i];
          if (plugin.spec.appendTransaction) {
            let n = seen ? seen[i].n : 0, oldState = seen ? seen[i].state : this;
            let tr = n < trs.length && plugin.spec.appendTransaction.call(plugin, n ? trs.slice(n) : trs, oldState, newState);
            if (tr && newState.filterTransaction(tr, i)) {
              tr.setMeta("appendedTransaction", rootTr);
              if (!seen) {
                seen = [];
                for (let j = 0; j < this.config.plugins.length; j++)
                  seen.push(j < i ? { state: newState, n: trs.length } : { state: this, n: 0 });
              }
              trs.push(tr);
              newState = newState.applyInner(tr);
              haveNew = true;
            }
            if (seen)
              seen[i] = { state: newState, n: trs.length };
          }
        }
        if (!haveNew)
          return { state: newState, transactions: trs };
      }
    }
    applyInner(tr) {
      if (!tr.before.eq(this.doc))
        throw new RangeError("Applying a mismatched transaction");
      let newInstance = new EditorState(this.config), fields = this.config.fields;
      for (let i = 0; i < fields.length; i++) {
        let field = fields[i];
        newInstance[field.name] = field.apply(tr, this[field.name], this, newInstance);
      }
      return newInstance;
    }
    get tr() {
      return new Transaction(this);
    }
    static create(config) {
      let $config = new Configuration(config.doc ? config.doc.type.schema : config.schema, config.plugins);
      let instance = new EditorState($config);
      for (let i = 0; i < $config.fields.length; i++)
        instance[$config.fields[i].name] = $config.fields[i].init(config, instance);
      return instance;
    }
    reconfigure(config) {
      let $config = new Configuration(this.schema, config.plugins);
      let fields = $config.fields, instance = new EditorState($config);
      for (let i = 0; i < fields.length; i++) {
        let name = fields[i].name;
        instance[name] = this.hasOwnProperty(name) ? this[name] : fields[i].init(config, instance);
      }
      return instance;
    }
    toJSON(pluginFields) {
      let result = { doc: this.doc.toJSON(), selection: this.selection.toJSON() };
      if (this.storedMarks)
        result.storedMarks = this.storedMarks.map((m) => m.toJSON());
      if (pluginFields && typeof pluginFields == "object")
        for (let prop in pluginFields) {
          if (prop == "doc" || prop == "selection")
            throw new RangeError("The JSON fields `doc` and `selection` are reserved");
          let plugin = pluginFields[prop], state = plugin.spec.state;
          if (state && state.toJSON)
            result[prop] = state.toJSON.call(plugin, this[plugin.key]);
        }
      return result;
    }
    static fromJSON(config, json, pluginFields) {
      if (!json)
        throw new RangeError("Invalid input for EditorState.fromJSON");
      if (!config.schema)
        throw new RangeError("Required config field 'schema' missing");
      let $config = new Configuration(config.schema, config.plugins);
      let instance = new EditorState($config);
      $config.fields.forEach((field) => {
        if (field.name == "doc") {
          instance.doc = Node2.fromJSON(config.schema, json.doc);
        } else if (field.name == "selection") {
          instance.selection = Selection.fromJSON(instance.doc, json.selection);
        } else if (field.name == "storedMarks") {
          if (json.storedMarks)
            instance.storedMarks = json.storedMarks.map(config.schema.markFromJSON);
        } else {
          if (pluginFields)
            for (let prop in pluginFields) {
              let plugin = pluginFields[prop], state = plugin.spec.state;
              if (plugin.key == field.name && state && state.fromJSON && Object.prototype.hasOwnProperty.call(json, prop)) {
                instance[field.name] = state.fromJSON.call(plugin, config, json[prop], instance);
                return;
              }
            }
          instance[field.name] = field.init(config, instance);
        }
      });
      return instance;
    }
  };
  function bindProps(obj, self, target) {
    for (let prop in obj) {
      let val = obj[prop];
      if (val instanceof Function)
        val = val.bind(self);
      else if (prop == "handleDOMEvents")
        val = bindProps(val, self, {});
      target[prop] = val;
    }
    return target;
  }
  var Plugin = class {
    constructor(spec) {
      this.spec = spec;
      this.props = {};
      if (spec.props)
        bindProps(spec.props, this, this.props);
      this.key = spec.key ? spec.key.key : createKey("plugin");
    }
    getState(state) {
      return state[this.key];
    }
  };
  var keys = /* @__PURE__ */ Object.create(null);
  function createKey(name) {
    if (name in keys)
      return name + "$" + ++keys[name];
    keys[name] = 0;
    return name + "$";
  }
  var PluginKey = class {
    constructor(name = "key") {
      this.key = createKey(name);
    }
    get(state) {
      return state.config.pluginsByKey[this.key];
    }
    getState(state) {
      return state[this.key];
    }
  };

  // node_modules/prosemirror-view/dist/index.js
  var nav = typeof navigator != "undefined" ? navigator : null;
  var doc2 = typeof document != "undefined" ? document : null;
  var agent = nav && nav.userAgent || "";
  var ie_edge = /Edge\/(\d+)/.exec(agent);
  var ie_upto10 = /MSIE \d/.exec(agent);
  var ie_11up = /Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(agent);
  var ie = !!(ie_upto10 || ie_11up || ie_edge);
  var ie_version = ie_upto10 ? document.documentMode : ie_11up ? +ie_11up[1] : ie_edge ? +ie_edge[1] : 0;
  var gecko = !ie && /gecko\/(\d+)/i.test(agent);
  gecko && +(/Firefox\/(\d+)/.exec(agent) || [0, 0])[1];
  var _chrome = !ie && /Chrome\/(\d+)/.exec(agent);
  var chrome = !!_chrome;
  var chrome_version = _chrome ? +_chrome[1] : 0;
  var safari = !ie && !!nav && /Apple Computer/.test(nav.vendor);
  var ios = safari && (/Mobile\/\w+/.test(agent) || !!nav && nav.maxTouchPoints > 2);
  var mac = ios || (nav ? /Mac/.test(nav.platform) : false);
  var android = /Android \d/.test(agent);
  var webkit = !!doc2 && "webkitFontSmoothing" in doc2.documentElement.style;
  var webkit_version = webkit ? +(/\bAppleWebKit\/(\d+)/.exec(navigator.userAgent) || [0, 0])[1] : 0;
  var domIndex = function(node) {
    for (var index = 0; ; index++) {
      node = node.previousSibling;
      if (!node)
        return index;
    }
  };
  var parentNode = function(node) {
    let parent = node.assignedSlot || node.parentNode;
    return parent && parent.nodeType == 11 ? parent.host : parent;
  };
  var reusedRange = null;
  var textRange = function(node, from2, to) {
    let range = reusedRange || (reusedRange = document.createRange());
    range.setEnd(node, to == null ? node.nodeValue.length : to);
    range.setStart(node, from2 || 0);
    return range;
  };
  var isEquivalentPosition = function(node, off, targetNode, targetOff) {
    return targetNode && (scanFor(node, off, targetNode, targetOff, -1) || scanFor(node, off, targetNode, targetOff, 1));
  };
  var atomElements = /^(img|br|input|textarea|hr)$/i;
  function scanFor(node, off, targetNode, targetOff, dir) {
    for (; ; ) {
      if (node == targetNode && off == targetOff)
        return true;
      if (off == (dir < 0 ? 0 : nodeSize(node))) {
        let parent = node.parentNode;
        if (!parent || parent.nodeType != 1 || hasBlockDesc(node) || atomElements.test(node.nodeName) || node.contentEditable == "false")
          return false;
        off = domIndex(node) + (dir < 0 ? 0 : 1);
        node = parent;
      } else if (node.nodeType == 1) {
        node = node.childNodes[off + (dir < 0 ? -1 : 0)];
        if (node.contentEditable == "false")
          return false;
        off = dir < 0 ? nodeSize(node) : 0;
      } else {
        return false;
      }
    }
  }
  function nodeSize(node) {
    return node.nodeType == 3 ? node.nodeValue.length : node.childNodes.length;
  }
  function isOnEdge(node, offset, parent) {
    for (let atStart = offset == 0, atEnd = offset == nodeSize(node); atStart || atEnd; ) {
      if (node == parent)
        return true;
      let index = domIndex(node);
      node = node.parentNode;
      if (!node)
        return false;
      atStart = atStart && index == 0;
      atEnd = atEnd && index == nodeSize(node);
    }
  }
  function hasBlockDesc(dom) {
    let desc;
    for (let cur = dom; cur; cur = cur.parentNode)
      if (desc = cur.pmViewDesc)
        break;
    return desc && desc.node && desc.node.isBlock && (desc.dom == dom || desc.contentDOM == dom);
  }
  var selectionCollapsed = function(domSel) {
    let collapsed = domSel.isCollapsed;
    if (collapsed && chrome && domSel.rangeCount && !domSel.getRangeAt(0).collapsed)
      collapsed = false;
    return collapsed;
  };
  function keyEvent(keyCode, key2) {
    let event = document.createEvent("Event");
    event.initEvent("keydown", true, true);
    event.keyCode = keyCode;
    event.key = event.code = key2;
    return event;
  }
  function windowRect(doc3) {
    return {
      left: 0,
      right: doc3.documentElement.clientWidth,
      top: 0,
      bottom: doc3.documentElement.clientHeight
    };
  }
  function getSide(value, side) {
    return typeof value == "number" ? value : value[side];
  }
  function clientRect(node) {
    let rect = node.getBoundingClientRect();
    let scaleX = rect.width / node.offsetWidth || 1;
    let scaleY = rect.height / node.offsetHeight || 1;
    return {
      left: rect.left,
      right: rect.left + node.clientWidth * scaleX,
      top: rect.top,
      bottom: rect.top + node.clientHeight * scaleY
    };
  }
  function scrollRectIntoView(view, rect, startDOM) {
    let scrollThreshold = view.someProp("scrollThreshold") || 0, scrollMargin = view.someProp("scrollMargin") || 5;
    let doc3 = view.dom.ownerDocument;
    for (let parent = startDOM || view.dom; ; parent = parentNode(parent)) {
      if (!parent)
        break;
      if (parent.nodeType != 1)
        continue;
      let elt = parent;
      let atTop = elt == doc3.body;
      let bounding = atTop ? windowRect(doc3) : clientRect(elt);
      let moveX = 0, moveY = 0;
      if (rect.top < bounding.top + getSide(scrollThreshold, "top"))
        moveY = -(bounding.top - rect.top + getSide(scrollMargin, "top"));
      else if (rect.bottom > bounding.bottom - getSide(scrollThreshold, "bottom"))
        moveY = rect.bottom - bounding.bottom + getSide(scrollMargin, "bottom");
      if (rect.left < bounding.left + getSide(scrollThreshold, "left"))
        moveX = -(bounding.left - rect.left + getSide(scrollMargin, "left"));
      else if (rect.right > bounding.right - getSide(scrollThreshold, "right"))
        moveX = rect.right - bounding.right + getSide(scrollMargin, "right");
      if (moveX || moveY) {
        if (atTop) {
          doc3.defaultView.scrollBy(moveX, moveY);
        } else {
          let startX = elt.scrollLeft, startY = elt.scrollTop;
          if (moveY)
            elt.scrollTop += moveY;
          if (moveX)
            elt.scrollLeft += moveX;
          let dX = elt.scrollLeft - startX, dY = elt.scrollTop - startY;
          rect = { left: rect.left - dX, top: rect.top - dY, right: rect.right - dX, bottom: rect.bottom - dY };
        }
      }
      if (atTop)
        break;
    }
  }
  function storeScrollPos(view) {
    let rect = view.dom.getBoundingClientRect(), startY = Math.max(0, rect.top);
    let refDOM, refTop;
    for (let x = (rect.left + rect.right) / 2, y = startY + 1; y < Math.min(innerHeight, rect.bottom); y += 5) {
      let dom = view.root.elementFromPoint(x, y);
      if (!dom || dom == view.dom || !view.dom.contains(dom))
        continue;
      let localRect = dom.getBoundingClientRect();
      if (localRect.top >= startY - 20) {
        refDOM = dom;
        refTop = localRect.top;
        break;
      }
    }
    return { refDOM, refTop, stack: scrollStack(view.dom) };
  }
  function scrollStack(dom) {
    let stack = [], doc3 = dom.ownerDocument;
    for (let cur = dom; cur; cur = parentNode(cur)) {
      stack.push({ dom: cur, top: cur.scrollTop, left: cur.scrollLeft });
      if (dom == doc3)
        break;
    }
    return stack;
  }
  function resetScrollPos({ refDOM, refTop, stack }) {
    let newRefTop = refDOM ? refDOM.getBoundingClientRect().top : 0;
    restoreScrollStack(stack, newRefTop == 0 ? 0 : newRefTop - refTop);
  }
  function restoreScrollStack(stack, dTop) {
    for (let i = 0; i < stack.length; i++) {
      let { dom, top, left } = stack[i];
      if (dom.scrollTop != top + dTop)
        dom.scrollTop = top + dTop;
      if (dom.scrollLeft != left)
        dom.scrollLeft = left;
    }
  }
  var preventScrollSupported = null;
  function focusPreventScroll(dom) {
    if (dom.setActive)
      return dom.setActive();
    if (preventScrollSupported)
      return dom.focus(preventScrollSupported);
    let stored = scrollStack(dom);
    dom.focus(preventScrollSupported == null ? {
      get preventScroll() {
        preventScrollSupported = { preventScroll: true };
        return true;
      }
    } : void 0);
    if (!preventScrollSupported) {
      preventScrollSupported = false;
      restoreScrollStack(stored, 0);
    }
  }
  function findOffsetInNode(node, coords) {
    let closest, dxClosest = 2e8, coordsClosest, offset = 0;
    let rowBot = coords.top, rowTop = coords.top;
    for (let child = node.firstChild, childIndex = 0; child; child = child.nextSibling, childIndex++) {
      let rects;
      if (child.nodeType == 1)
        rects = child.getClientRects();
      else if (child.nodeType == 3)
        rects = textRange(child).getClientRects();
      else
        continue;
      for (let i = 0; i < rects.length; i++) {
        let rect = rects[i];
        if (rect.top <= rowBot && rect.bottom >= rowTop) {
          rowBot = Math.max(rect.bottom, rowBot);
          rowTop = Math.min(rect.top, rowTop);
          let dx = rect.left > coords.left ? rect.left - coords.left : rect.right < coords.left ? coords.left - rect.right : 0;
          if (dx < dxClosest) {
            closest = child;
            dxClosest = dx;
            coordsClosest = dx && closest.nodeType == 3 ? {
              left: rect.right < coords.left ? rect.right : rect.left,
              top: coords.top
            } : coords;
            if (child.nodeType == 1 && dx)
              offset = childIndex + (coords.left >= (rect.left + rect.right) / 2 ? 1 : 0);
            continue;
          }
        }
        if (!closest && (coords.left >= rect.right && coords.top >= rect.top || coords.left >= rect.left && coords.top >= rect.bottom))
          offset = childIndex + 1;
      }
    }
    if (closest && closest.nodeType == 3)
      return findOffsetInText(closest, coordsClosest);
    if (!closest || dxClosest && closest.nodeType == 1)
      return { node, offset };
    return findOffsetInNode(closest, coordsClosest);
  }
  function findOffsetInText(node, coords) {
    let len = node.nodeValue.length;
    let range = document.createRange();
    for (let i = 0; i < len; i++) {
      range.setEnd(node, i + 1);
      range.setStart(node, i);
      let rect = singleRect(range, 1);
      if (rect.top == rect.bottom)
        continue;
      if (inRect(coords, rect))
        return { node, offset: i + (coords.left >= (rect.left + rect.right) / 2 ? 1 : 0) };
    }
    return { node, offset: 0 };
  }
  function inRect(coords, rect) {
    return coords.left >= rect.left - 1 && coords.left <= rect.right + 1 && coords.top >= rect.top - 1 && coords.top <= rect.bottom + 1;
  }
  function targetKludge(dom, coords) {
    let parent = dom.parentNode;
    if (parent && /^li$/i.test(parent.nodeName) && coords.left < dom.getBoundingClientRect().left)
      return parent;
    return dom;
  }
  function posFromElement(view, elt, coords) {
    let { node, offset } = findOffsetInNode(elt, coords), bias = -1;
    if (node.nodeType == 1 && !node.firstChild) {
      let rect = node.getBoundingClientRect();
      bias = rect.left != rect.right && coords.left > (rect.left + rect.right) / 2 ? 1 : -1;
    }
    return view.docView.posFromDOM(node, offset, bias);
  }
  function posFromCaret(view, node, offset, coords) {
    let outside = -1;
    for (let cur = node; ; ) {
      if (cur == view.dom)
        break;
      let desc = view.docView.nearestDesc(cur, true);
      if (!desc)
        return null;
      if (desc.node.isBlock && desc.parent) {
        let rect = desc.dom.getBoundingClientRect();
        if (rect.left > coords.left || rect.top > coords.top)
          outside = desc.posBefore;
        else if (rect.right < coords.left || rect.bottom < coords.top)
          outside = desc.posAfter;
        else
          break;
      }
      cur = desc.dom.parentNode;
    }
    return outside > -1 ? outside : view.docView.posFromDOM(node, offset, 1);
  }
  function elementFromPoint(element, coords, box) {
    let len = element.childNodes.length;
    if (len && box.top < box.bottom) {
      for (let startI = Math.max(0, Math.min(len - 1, Math.floor(len * (coords.top - box.top) / (box.bottom - box.top)) - 2)), i = startI; ; ) {
        let child = element.childNodes[i];
        if (child.nodeType == 1) {
          let rects = child.getClientRects();
          for (let j = 0; j < rects.length; j++) {
            let rect = rects[j];
            if (inRect(coords, rect))
              return elementFromPoint(child, coords, rect);
          }
        }
        if ((i = (i + 1) % len) == startI)
          break;
      }
    }
    return element;
  }
  function posAtCoords(view, coords) {
    let doc3 = view.dom.ownerDocument, node, offset = 0;
    if (doc3.caretPositionFromPoint) {
      try {
        let pos2 = doc3.caretPositionFromPoint(coords.left, coords.top);
        if (pos2)
          ({ offsetNode: node, offset } = pos2);
      } catch (_) {
      }
    }
    if (!node && doc3.caretRangeFromPoint) {
      let range = doc3.caretRangeFromPoint(coords.left, coords.top);
      if (range)
        ({ startContainer: node, startOffset: offset } = range);
    }
    let elt = (view.root.elementFromPoint ? view.root : doc3).elementFromPoint(coords.left, coords.top + 1);
    let pos;
    if (!elt || !view.dom.contains(elt.nodeType != 1 ? elt.parentNode : elt)) {
      let box = view.dom.getBoundingClientRect();
      if (!inRect(coords, box))
        return null;
      elt = elementFromPoint(view.dom, coords, box);
      if (!elt)
        return null;
    }
    if (safari) {
      for (let p = elt; node && p; p = parentNode(p))
        if (p.draggable)
          node = void 0;
    }
    elt = targetKludge(elt, coords);
    if (node) {
      if (gecko && node.nodeType == 1) {
        offset = Math.min(offset, node.childNodes.length);
        if (offset < node.childNodes.length) {
          let next = node.childNodes[offset], box;
          if (next.nodeName == "IMG" && (box = next.getBoundingClientRect()).right <= coords.left && box.bottom > coords.top)
            offset++;
        }
      }
      if (node == view.dom && offset == node.childNodes.length - 1 && node.lastChild.nodeType == 1 && coords.top > node.lastChild.getBoundingClientRect().bottom)
        pos = view.state.doc.content.size;
      else if (offset == 0 || node.nodeType != 1 || node.childNodes[offset - 1].nodeName != "BR")
        pos = posFromCaret(view, node, offset, coords);
    }
    if (pos == null)
      pos = posFromElement(view, elt, coords);
    let desc = view.docView.nearestDesc(elt, true);
    return { pos, inside: desc ? desc.posAtStart - desc.border : -1 };
  }
  function singleRect(target, bias) {
    let rects = target.getClientRects();
    return !rects.length ? target.getBoundingClientRect() : rects[bias < 0 ? 0 : rects.length - 1];
  }
  var BIDI = /[\u0590-\u05f4\u0600-\u06ff\u0700-\u08ac]/;
  function coordsAtPos(view, pos, side) {
    let { node, offset } = view.docView.domFromPos(pos, side < 0 ? -1 : 1);
    let supportEmptyRange = webkit || gecko;
    if (node.nodeType == 3) {
      if (supportEmptyRange && (BIDI.test(node.nodeValue) || (side < 0 ? !offset : offset == node.nodeValue.length))) {
        let rect = singleRect(textRange(node, offset, offset), side);
        if (gecko && offset && /\s/.test(node.nodeValue[offset - 1]) && offset < node.nodeValue.length) {
          let rectBefore = singleRect(textRange(node, offset - 1, offset - 1), -1);
          if (rectBefore.top == rect.top) {
            let rectAfter = singleRect(textRange(node, offset, offset + 1), -1);
            if (rectAfter.top != rect.top)
              return flattenV(rectAfter, rectAfter.left < rectBefore.left);
          }
        }
        return rect;
      } else {
        let from2 = offset, to = offset, takeSide = side < 0 ? 1 : -1;
        if (side < 0 && !offset) {
          to++;
          takeSide = -1;
        } else if (side >= 0 && offset == node.nodeValue.length) {
          from2--;
          takeSide = 1;
        } else if (side < 0) {
          from2--;
        } else {
          to++;
        }
        return flattenV(singleRect(textRange(node, from2, to), takeSide), takeSide < 0);
      }
    }
    if (!view.state.doc.resolve(pos).parent.inlineContent) {
      if (offset && (side < 0 || offset == nodeSize(node))) {
        let before = node.childNodes[offset - 1];
        if (before.nodeType == 1)
          return flattenH(before.getBoundingClientRect(), false);
      }
      if (offset < nodeSize(node)) {
        let after = node.childNodes[offset];
        if (after.nodeType == 1)
          return flattenH(after.getBoundingClientRect(), true);
      }
      return flattenH(node.getBoundingClientRect(), side >= 0);
    }
    if (offset && (side < 0 || offset == nodeSize(node))) {
      let before = node.childNodes[offset - 1];
      let target = before.nodeType == 3 ? textRange(before, nodeSize(before) - (supportEmptyRange ? 0 : 1)) : before.nodeType == 1 && (before.nodeName != "BR" || !before.nextSibling) ? before : null;
      if (target)
        return flattenV(singleRect(target, 1), false);
    }
    if (offset < nodeSize(node)) {
      let after = node.childNodes[offset];
      while (after.pmViewDesc && after.pmViewDesc.ignoreForCoords)
        after = after.nextSibling;
      let target = !after ? null : after.nodeType == 3 ? textRange(after, 0, supportEmptyRange ? 0 : 1) : after.nodeType == 1 ? after : null;
      if (target)
        return flattenV(singleRect(target, -1), true);
    }
    return flattenV(singleRect(node.nodeType == 3 ? textRange(node) : node, -side), side >= 0);
  }
  function flattenV(rect, left) {
    if (rect.width == 0)
      return rect;
    let x = left ? rect.left : rect.right;
    return { top: rect.top, bottom: rect.bottom, left: x, right: x };
  }
  function flattenH(rect, top) {
    if (rect.height == 0)
      return rect;
    let y = top ? rect.top : rect.bottom;
    return { top: y, bottom: y, left: rect.left, right: rect.right };
  }
  function withFlushedState(view, state, f) {
    let viewState = view.state, active = view.root.activeElement;
    if (viewState != state)
      view.updateState(state);
    if (active != view.dom)
      view.focus();
    try {
      return f();
    } finally {
      if (viewState != state)
        view.updateState(viewState);
      if (active != view.dom && active)
        active.focus();
    }
  }
  function endOfTextblockVertical(view, state, dir) {
    let sel = state.selection;
    let $pos = dir == "up" ? sel.$from : sel.$to;
    return withFlushedState(view, state, () => {
      let { node: dom } = view.docView.domFromPos($pos.pos, dir == "up" ? -1 : 1);
      for (; ; ) {
        let nearest = view.docView.nearestDesc(dom, true);
        if (!nearest)
          break;
        if (nearest.node.isBlock) {
          dom = nearest.dom;
          break;
        }
        dom = nearest.dom.parentNode;
      }
      let coords = coordsAtPos(view, $pos.pos, 1);
      for (let child = dom.firstChild; child; child = child.nextSibling) {
        let boxes;
        if (child.nodeType == 1)
          boxes = child.getClientRects();
        else if (child.nodeType == 3)
          boxes = textRange(child, 0, child.nodeValue.length).getClientRects();
        else
          continue;
        for (let i = 0; i < boxes.length; i++) {
          let box = boxes[i];
          if (box.bottom > box.top + 1 && (dir == "up" ? coords.top - box.top > (box.bottom - coords.top) * 2 : box.bottom - coords.bottom > (coords.bottom - box.top) * 2))
            return false;
        }
      }
      return true;
    });
  }
  var maybeRTL = /[\u0590-\u08ac]/;
  function endOfTextblockHorizontal(view, state, dir) {
    let { $head } = state.selection;
    if (!$head.parent.isTextblock)
      return false;
    let offset = $head.parentOffset, atStart = !offset, atEnd = offset == $head.parent.content.size;
    let sel = view.domSelection();
    if (!maybeRTL.test($head.parent.textContent) || !sel.modify)
      return dir == "left" || dir == "backward" ? atStart : atEnd;
    return withFlushedState(view, state, () => {
      let oldRange = sel.getRangeAt(0), oldNode = sel.focusNode, oldOff = sel.focusOffset;
      let oldBidiLevel = sel.caretBidiLevel;
      sel.modify("move", dir, "character");
      let parentDOM = $head.depth ? view.docView.domAfterPos($head.before()) : view.dom;
      let result = !parentDOM.contains(sel.focusNode.nodeType == 1 ? sel.focusNode : sel.focusNode.parentNode) || oldNode == sel.focusNode && oldOff == sel.focusOffset;
      sel.removeAllRanges();
      sel.addRange(oldRange);
      if (oldBidiLevel != null)
        sel.caretBidiLevel = oldBidiLevel;
      return result;
    });
  }
  var cachedState = null;
  var cachedDir = null;
  var cachedResult = false;
  function endOfTextblock(view, state, dir) {
    if (cachedState == state && cachedDir == dir)
      return cachedResult;
    cachedState = state;
    cachedDir = dir;
    return cachedResult = dir == "up" || dir == "down" ? endOfTextblockVertical(view, state, dir) : endOfTextblockHorizontal(view, state, dir);
  }
  var NOT_DIRTY = 0;
  var CHILD_DIRTY = 1;
  var CONTENT_DIRTY = 2;
  var NODE_DIRTY = 3;
  var ViewDesc = class {
    constructor(parent, children, dom, contentDOM) {
      this.parent = parent;
      this.children = children;
      this.dom = dom;
      this.contentDOM = contentDOM;
      this.dirty = NOT_DIRTY;
      dom.pmViewDesc = this;
    }
    matchesWidget(widget) {
      return false;
    }
    matchesMark(mark) {
      return false;
    }
    matchesNode(node, outerDeco, innerDeco) {
      return false;
    }
    matchesHack(nodeName) {
      return false;
    }
    parseRule() {
      return null;
    }
    stopEvent(event) {
      return false;
    }
    get size() {
      let size = 0;
      for (let i = 0; i < this.children.length; i++)
        size += this.children[i].size;
      return size;
    }
    get border() {
      return 0;
    }
    destroy() {
      this.parent = void 0;
      if (this.dom.pmViewDesc == this)
        this.dom.pmViewDesc = void 0;
      for (let i = 0; i < this.children.length; i++)
        this.children[i].destroy();
    }
    posBeforeChild(child) {
      for (let i = 0, pos = this.posAtStart; ; i++) {
        let cur = this.children[i];
        if (cur == child)
          return pos;
        pos += cur.size;
      }
    }
    get posBefore() {
      return this.parent.posBeforeChild(this);
    }
    get posAtStart() {
      return this.parent ? this.parent.posBeforeChild(this) + this.border : 0;
    }
    get posAfter() {
      return this.posBefore + this.size;
    }
    get posAtEnd() {
      return this.posAtStart + this.size - 2 * this.border;
    }
    localPosFromDOM(dom, offset, bias) {
      if (this.contentDOM && this.contentDOM.contains(dom.nodeType == 1 ? dom : dom.parentNode)) {
        if (bias < 0) {
          let domBefore, desc;
          if (dom == this.contentDOM) {
            domBefore = dom.childNodes[offset - 1];
          } else {
            while (dom.parentNode != this.contentDOM)
              dom = dom.parentNode;
            domBefore = dom.previousSibling;
          }
          while (domBefore && !((desc = domBefore.pmViewDesc) && desc.parent == this))
            domBefore = domBefore.previousSibling;
          return domBefore ? this.posBeforeChild(desc) + desc.size : this.posAtStart;
        } else {
          let domAfter, desc;
          if (dom == this.contentDOM) {
            domAfter = dom.childNodes[offset];
          } else {
            while (dom.parentNode != this.contentDOM)
              dom = dom.parentNode;
            domAfter = dom.nextSibling;
          }
          while (domAfter && !((desc = domAfter.pmViewDesc) && desc.parent == this))
            domAfter = domAfter.nextSibling;
          return domAfter ? this.posBeforeChild(desc) : this.posAtEnd;
        }
      }
      let atEnd;
      if (dom == this.dom && this.contentDOM) {
        atEnd = offset > domIndex(this.contentDOM);
      } else if (this.contentDOM && this.contentDOM != this.dom && this.dom.contains(this.contentDOM)) {
        atEnd = dom.compareDocumentPosition(this.contentDOM) & 2;
      } else if (this.dom.firstChild) {
        if (offset == 0)
          for (let search = dom; ; search = search.parentNode) {
            if (search == this.dom) {
              atEnd = false;
              break;
            }
            if (search.previousSibling)
              break;
          }
        if (atEnd == null && offset == dom.childNodes.length)
          for (let search = dom; ; search = search.parentNode) {
            if (search == this.dom) {
              atEnd = true;
              break;
            }
            if (search.nextSibling)
              break;
          }
      }
      return (atEnd == null ? bias > 0 : atEnd) ? this.posAtEnd : this.posAtStart;
    }
    nearestDesc(dom, onlyNodes = false) {
      for (let first = true, cur = dom; cur; cur = cur.parentNode) {
        let desc = this.getDesc(cur), nodeDOM;
        if (desc && (!onlyNodes || desc.node)) {
          if (first && (nodeDOM = desc.nodeDOM) && !(nodeDOM.nodeType == 1 ? nodeDOM.contains(dom.nodeType == 1 ? dom : dom.parentNode) : nodeDOM == dom))
            first = false;
          else
            return desc;
        }
      }
    }
    getDesc(dom) {
      let desc = dom.pmViewDesc;
      for (let cur = desc; cur; cur = cur.parent)
        if (cur == this)
          return desc;
    }
    posFromDOM(dom, offset, bias) {
      for (let scan = dom; scan; scan = scan.parentNode) {
        let desc = this.getDesc(scan);
        if (desc)
          return desc.localPosFromDOM(dom, offset, bias);
      }
      return -1;
    }
    descAt(pos) {
      for (let i = 0, offset = 0; i < this.children.length; i++) {
        let child = this.children[i], end = offset + child.size;
        if (offset == pos && end != offset) {
          while (!child.border && child.children.length)
            child = child.children[0];
          return child;
        }
        if (pos < end)
          return child.descAt(pos - offset - child.border);
        offset = end;
      }
    }
    domFromPos(pos, side) {
      if (!this.contentDOM)
        return { node: this.dom, offset: 0 };
      let i = 0, offset = 0;
      for (let curPos = 0; i < this.children.length; i++) {
        let child = this.children[i], end = curPos + child.size;
        if (end > pos || child instanceof TrailingHackViewDesc) {
          offset = pos - curPos;
          break;
        }
        curPos = end;
      }
      if (offset)
        return this.children[i].domFromPos(offset - this.children[i].border, side);
      for (let prev; i && !(prev = this.children[i - 1]).size && prev instanceof WidgetViewDesc && prev.side >= 0; i--) {
      }
      if (side <= 0) {
        let prev, enter = true;
        for (; ; i--, enter = false) {
          prev = i ? this.children[i - 1] : null;
          if (!prev || prev.dom.parentNode == this.contentDOM)
            break;
        }
        if (prev && side && enter && !prev.border && !prev.domAtom)
          return prev.domFromPos(prev.size, side);
        return { node: this.contentDOM, offset: prev ? domIndex(prev.dom) + 1 : 0 };
      } else {
        let next, enter = true;
        for (; ; i++, enter = false) {
          next = i < this.children.length ? this.children[i] : null;
          if (!next || next.dom.parentNode == this.contentDOM)
            break;
        }
        if (next && enter && !next.border && !next.domAtom)
          return next.domFromPos(0, side);
        return { node: this.contentDOM, offset: next ? domIndex(next.dom) : this.contentDOM.childNodes.length };
      }
    }
    parseRange(from2, to, base2 = 0) {
      if (this.children.length == 0)
        return { node: this.contentDOM, from: from2, to, fromOffset: 0, toOffset: this.contentDOM.childNodes.length };
      let fromOffset = -1, toOffset = -1;
      for (let offset = base2, i = 0; ; i++) {
        let child = this.children[i], end = offset + child.size;
        if (fromOffset == -1 && from2 <= end) {
          let childBase = offset + child.border;
          if (from2 >= childBase && to <= end - child.border && child.node && child.contentDOM && this.contentDOM.contains(child.contentDOM))
            return child.parseRange(from2, to, childBase);
          from2 = offset;
          for (let j = i; j > 0; j--) {
            let prev = this.children[j - 1];
            if (prev.size && prev.dom.parentNode == this.contentDOM && !prev.emptyChildAt(1)) {
              fromOffset = domIndex(prev.dom) + 1;
              break;
            }
            from2 -= prev.size;
          }
          if (fromOffset == -1)
            fromOffset = 0;
        }
        if (fromOffset > -1 && (end > to || i == this.children.length - 1)) {
          to = end;
          for (let j = i + 1; j < this.children.length; j++) {
            let next = this.children[j];
            if (next.size && next.dom.parentNode == this.contentDOM && !next.emptyChildAt(-1)) {
              toOffset = domIndex(next.dom);
              break;
            }
            to += next.size;
          }
          if (toOffset == -1)
            toOffset = this.contentDOM.childNodes.length;
          break;
        }
        offset = end;
      }
      return { node: this.contentDOM, from: from2, to, fromOffset, toOffset };
    }
    emptyChildAt(side) {
      if (this.border || !this.contentDOM || !this.children.length)
        return false;
      let child = this.children[side < 0 ? 0 : this.children.length - 1];
      return child.size == 0 || child.emptyChildAt(side);
    }
    domAfterPos(pos) {
      let { node, offset } = this.domFromPos(pos, 0);
      if (node.nodeType != 1 || offset == node.childNodes.length)
        throw new RangeError("No node after pos " + pos);
      return node.childNodes[offset];
    }
    setSelection(anchor, head, root, force = false) {
      let from2 = Math.min(anchor, head), to = Math.max(anchor, head);
      for (let i = 0, offset = 0; i < this.children.length; i++) {
        let child = this.children[i], end = offset + child.size;
        if (from2 > offset && to < end)
          return child.setSelection(anchor - offset - child.border, head - offset - child.border, root, force);
        offset = end;
      }
      let anchorDOM = this.domFromPos(anchor, anchor ? -1 : 1);
      let headDOM = head == anchor ? anchorDOM : this.domFromPos(head, head ? -1 : 1);
      let domSel = root.getSelection();
      let brKludge = false;
      if ((gecko || safari) && anchor == head) {
        let { node, offset } = anchorDOM;
        if (node.nodeType == 3) {
          brKludge = !!(offset && node.nodeValue[offset - 1] == "\n");
          if (brKludge && offset == node.nodeValue.length) {
            for (let scan = node, after; scan; scan = scan.parentNode) {
              if (after = scan.nextSibling) {
                if (after.nodeName == "BR")
                  anchorDOM = headDOM = { node: after.parentNode, offset: domIndex(after) + 1 };
                break;
              }
              let desc = scan.pmViewDesc;
              if (desc && desc.node && desc.node.isBlock)
                break;
            }
          }
        } else {
          let prev = node.childNodes[offset - 1];
          brKludge = prev && (prev.nodeName == "BR" || prev.contentEditable == "false");
        }
      }
      if (gecko && domSel.focusNode && domSel.focusNode != headDOM.node && domSel.focusNode.nodeType == 1) {
        let after = domSel.focusNode.childNodes[domSel.focusOffset];
        if (after && after.contentEditable == "false")
          force = true;
      }
      if (!(force || brKludge && safari) && isEquivalentPosition(anchorDOM.node, anchorDOM.offset, domSel.anchorNode, domSel.anchorOffset) && isEquivalentPosition(headDOM.node, headDOM.offset, domSel.focusNode, domSel.focusOffset))
        return;
      let domSelExtended = false;
      if ((domSel.extend || anchor == head) && !brKludge) {
        domSel.collapse(anchorDOM.node, anchorDOM.offset);
        try {
          if (anchor != head)
            domSel.extend(headDOM.node, headDOM.offset);
          domSelExtended = true;
        } catch (err) {
          if (!(err instanceof DOMException))
            throw err;
        }
      }
      if (!domSelExtended) {
        if (anchor > head) {
          let tmp = anchorDOM;
          anchorDOM = headDOM;
          headDOM = tmp;
        }
        let range = document.createRange();
        range.setEnd(headDOM.node, headDOM.offset);
        range.setStart(anchorDOM.node, anchorDOM.offset);
        domSel.removeAllRanges();
        domSel.addRange(range);
      }
    }
    ignoreMutation(mutation) {
      return !this.contentDOM && mutation.type != "selection";
    }
    get contentLost() {
      return this.contentDOM && this.contentDOM != this.dom && !this.dom.contains(this.contentDOM);
    }
    markDirty(from2, to) {
      for (let offset = 0, i = 0; i < this.children.length; i++) {
        let child = this.children[i], end = offset + child.size;
        if (offset == end ? from2 <= end && to >= offset : from2 < end && to > offset) {
          let startInside = offset + child.border, endInside = end - child.border;
          if (from2 >= startInside && to <= endInside) {
            this.dirty = from2 == offset || to == end ? CONTENT_DIRTY : CHILD_DIRTY;
            if (from2 == startInside && to == endInside && (child.contentLost || child.dom.parentNode != this.contentDOM))
              child.dirty = NODE_DIRTY;
            else
              child.markDirty(from2 - startInside, to - startInside);
            return;
          } else {
            child.dirty = child.dom == child.contentDOM && child.dom.parentNode == this.contentDOM && !child.children.length ? CONTENT_DIRTY : NODE_DIRTY;
          }
        }
        offset = end;
      }
      this.dirty = CONTENT_DIRTY;
    }
    markParentsDirty() {
      let level = 1;
      for (let node = this.parent; node; node = node.parent, level++) {
        let dirty = level == 1 ? CONTENT_DIRTY : CHILD_DIRTY;
        if (node.dirty < dirty)
          node.dirty = dirty;
      }
    }
    get domAtom() {
      return false;
    }
    get ignoreForCoords() {
      return false;
    }
  };
  var WidgetViewDesc = class extends ViewDesc {
    constructor(parent, widget, view, pos) {
      let self, dom = widget.type.toDOM;
      if (typeof dom == "function")
        dom = dom(view, () => {
          if (!self)
            return pos;
          if (self.parent)
            return self.parent.posBeforeChild(self);
        });
      if (!widget.type.spec.raw) {
        if (dom.nodeType != 1) {
          let wrap2 = document.createElement("span");
          wrap2.appendChild(dom);
          dom = wrap2;
        }
        dom.contentEditable = "false";
        dom.classList.add("ProseMirror-widget");
      }
      super(parent, [], dom, null);
      this.widget = widget;
      this.widget = widget;
      self = this;
    }
    matchesWidget(widget) {
      return this.dirty == NOT_DIRTY && widget.type.eq(this.widget.type);
    }
    parseRule() {
      return { ignore: true };
    }
    stopEvent(event) {
      let stop = this.widget.spec.stopEvent;
      return stop ? stop(event) : false;
    }
    ignoreMutation(mutation) {
      return mutation.type != "selection" || this.widget.spec.ignoreSelection;
    }
    destroy() {
      this.widget.type.destroy(this.dom);
      super.destroy();
    }
    get domAtom() {
      return true;
    }
    get side() {
      return this.widget.type.side;
    }
  };
  var CompositionViewDesc = class extends ViewDesc {
    constructor(parent, dom, textDOM, text) {
      super(parent, [], dom, null);
      this.textDOM = textDOM;
      this.text = text;
    }
    get size() {
      return this.text.length;
    }
    localPosFromDOM(dom, offset) {
      if (dom != this.textDOM)
        return this.posAtStart + (offset ? this.size : 0);
      return this.posAtStart + offset;
    }
    domFromPos(pos) {
      return { node: this.textDOM, offset: pos };
    }
    ignoreMutation(mut) {
      return mut.type === "characterData" && mut.target.nodeValue == mut.oldValue;
    }
  };
  var MarkViewDesc = class extends ViewDesc {
    constructor(parent, mark, dom, contentDOM) {
      super(parent, [], dom, contentDOM);
      this.mark = mark;
    }
    static create(parent, mark, inline, view) {
      let custom = view.nodeViews[mark.type.name];
      let spec = custom && custom(mark, view, inline);
      if (!spec || !spec.dom)
        spec = DOMSerializer.renderSpec(document, mark.type.spec.toDOM(mark, inline));
      return new MarkViewDesc(parent, mark, spec.dom, spec.contentDOM || spec.dom);
    }
    parseRule() {
      if (this.dirty & NODE_DIRTY || this.mark.type.spec.reparseInView)
        return null;
      return { mark: this.mark.type.name, attrs: this.mark.attrs, contentElement: this.contentDOM || void 0 };
    }
    matchesMark(mark) {
      return this.dirty != NODE_DIRTY && this.mark.eq(mark);
    }
    markDirty(from2, to) {
      super.markDirty(from2, to);
      if (this.dirty != NOT_DIRTY) {
        let parent = this.parent;
        while (!parent.node)
          parent = parent.parent;
        if (parent.dirty < this.dirty)
          parent.dirty = this.dirty;
        this.dirty = NOT_DIRTY;
      }
    }
    slice(from2, to, view) {
      let copy2 = MarkViewDesc.create(this.parent, this.mark, true, view);
      let nodes2 = this.children, size = this.size;
      if (to < size)
        nodes2 = replaceNodes(nodes2, to, size, view);
      if (from2 > 0)
        nodes2 = replaceNodes(nodes2, 0, from2, view);
      for (let i = 0; i < nodes2.length; i++)
        nodes2[i].parent = copy2;
      copy2.children = nodes2;
      return copy2;
    }
  };
  var NodeViewDesc = class extends ViewDesc {
    constructor(parent, node, outerDeco, innerDeco, dom, contentDOM, nodeDOM, view, pos) {
      super(parent, [], dom, contentDOM);
      this.node = node;
      this.outerDeco = outerDeco;
      this.innerDeco = innerDeco;
      this.nodeDOM = nodeDOM;
      if (contentDOM)
        this.updateChildren(view, pos);
    }
    static create(parent, node, outerDeco, innerDeco, view, pos) {
      let custom = view.nodeViews[node.type.name], descObj;
      let spec = custom && custom(node, view, () => {
        if (!descObj)
          return pos;
        if (descObj.parent)
          return descObj.parent.posBeforeChild(descObj);
      }, outerDeco, innerDeco);
      let dom = spec && spec.dom, contentDOM = spec && spec.contentDOM;
      if (node.isText) {
        if (!dom)
          dom = document.createTextNode(node.text);
        else if (dom.nodeType != 3)
          throw new RangeError("Text must be rendered as a DOM text node");
      } else if (!dom) {
        ({ dom, contentDOM } = DOMSerializer.renderSpec(document, node.type.spec.toDOM(node)));
      }
      if (!contentDOM && !node.isText && dom.nodeName != "BR") {
        if (!dom.hasAttribute("contenteditable"))
          dom.contentEditable = "false";
        if (node.type.spec.draggable)
          dom.draggable = true;
      }
      let nodeDOM = dom;
      dom = applyOuterDeco(dom, outerDeco, node);
      if (spec)
        return descObj = new CustomNodeViewDesc(parent, node, outerDeco, innerDeco, dom, contentDOM || null, nodeDOM, spec, view, pos + 1);
      else if (node.isText)
        return new TextViewDesc(parent, node, outerDeco, innerDeco, dom, nodeDOM, view);
      else
        return new NodeViewDesc(parent, node, outerDeco, innerDeco, dom, contentDOM || null, nodeDOM, view, pos + 1);
    }
    parseRule() {
      if (this.node.type.spec.reparseInView)
        return null;
      let rule = { node: this.node.type.name, attrs: this.node.attrs };
      if (this.node.type.whitespace == "pre")
        rule.preserveWhitespace = "full";
      if (!this.contentDOM) {
        rule.getContent = () => this.node.content;
      } else if (!this.contentLost) {
        rule.contentElement = this.contentDOM;
      } else {
        for (let i = this.children.length - 1; i >= 0; i--) {
          let child = this.children[i];
          if (this.dom.contains(child.dom.parentNode)) {
            rule.contentElement = child.dom.parentNode;
            break;
          }
        }
        if (!rule.contentElement)
          rule.getContent = () => Fragment.empty;
      }
      return rule;
    }
    matchesNode(node, outerDeco, innerDeco) {
      return this.dirty == NOT_DIRTY && node.eq(this.node) && sameOuterDeco(outerDeco, this.outerDeco) && innerDeco.eq(this.innerDeco);
    }
    get size() {
      return this.node.nodeSize;
    }
    get border() {
      return this.node.isLeaf ? 0 : 1;
    }
    updateChildren(view, pos) {
      let inline = this.node.inlineContent, off = pos;
      let composition = view.composing ? this.localCompositionInfo(view, pos) : null;
      let localComposition = composition && composition.pos > -1 ? composition : null;
      let compositionInChild = composition && composition.pos < 0;
      let updater = new ViewTreeUpdater(this, localComposition && localComposition.node);
      iterDeco(this.node, this.innerDeco, (widget, i, insideNode) => {
        if (widget.spec.marks)
          updater.syncToMarks(widget.spec.marks, inline, view);
        else if (widget.type.side >= 0 && !insideNode)
          updater.syncToMarks(i == this.node.childCount ? Mark.none : this.node.child(i).marks, inline, view);
        updater.placeWidget(widget, view, off);
      }, (child, outerDeco, innerDeco, i) => {
        updater.syncToMarks(child.marks, inline, view);
        let compIndex;
        if (updater.findNodeMatch(child, outerDeco, innerDeco, i))
          ;
        else if (compositionInChild && view.state.selection.from > off && view.state.selection.to < off + child.nodeSize && (compIndex = updater.findIndexWithChild(composition.node)) > -1 && updater.updateNodeAt(child, outerDeco, innerDeco, compIndex, view))
          ;
        else if (updater.updateNextNode(child, outerDeco, innerDeco, view, i))
          ;
        else {
          updater.addNode(child, outerDeco, innerDeco, view, off);
        }
        off += child.nodeSize;
      });
      updater.syncToMarks([], inline, view);
      if (this.node.isTextblock)
        updater.addTextblockHacks();
      updater.destroyRest();
      if (updater.changed || this.dirty == CONTENT_DIRTY) {
        if (localComposition)
          this.protectLocalComposition(view, localComposition);
        renderDescs(this.contentDOM, this.children, view);
        if (ios)
          iosHacks(this.dom);
      }
    }
    localCompositionInfo(view, pos) {
      let { from: from2, to } = view.state.selection;
      if (!(view.state.selection instanceof TextSelection) || from2 < pos || to > pos + this.node.content.size)
        return null;
      let sel = view.domSelection();
      let textNode = nearbyTextNode(sel.focusNode, sel.focusOffset);
      if (!textNode || !this.dom.contains(textNode.parentNode))
        return null;
      if (this.node.inlineContent) {
        let text = textNode.nodeValue;
        let textPos = findTextInFragment(this.node.content, text, from2 - pos, to - pos);
        return textPos < 0 ? null : { node: textNode, pos: textPos, text };
      } else {
        return { node: textNode, pos: -1, text: "" };
      }
    }
    protectLocalComposition(view, { node, pos, text }) {
      if (this.getDesc(node))
        return;
      let topNode = node;
      for (; ; topNode = topNode.parentNode) {
        if (topNode.parentNode == this.contentDOM)
          break;
        while (topNode.previousSibling)
          topNode.parentNode.removeChild(topNode.previousSibling);
        while (topNode.nextSibling)
          topNode.parentNode.removeChild(topNode.nextSibling);
        if (topNode.pmViewDesc)
          topNode.pmViewDesc = void 0;
      }
      let desc = new CompositionViewDesc(this, topNode, node, text);
      view.input.compositionNodes.push(desc);
      this.children = replaceNodes(this.children, pos, pos + text.length, view, desc);
    }
    update(node, outerDeco, innerDeco, view) {
      if (this.dirty == NODE_DIRTY || !node.sameMarkup(this.node))
        return false;
      this.updateInner(node, outerDeco, innerDeco, view);
      return true;
    }
    updateInner(node, outerDeco, innerDeco, view) {
      this.updateOuterDeco(outerDeco);
      this.node = node;
      this.innerDeco = innerDeco;
      if (this.contentDOM)
        this.updateChildren(view, this.posAtStart);
      this.dirty = NOT_DIRTY;
    }
    updateOuterDeco(outerDeco) {
      if (sameOuterDeco(outerDeco, this.outerDeco))
        return;
      let needsWrap = this.nodeDOM.nodeType != 1;
      let oldDOM = this.dom;
      this.dom = patchOuterDeco(this.dom, this.nodeDOM, computeOuterDeco(this.outerDeco, this.node, needsWrap), computeOuterDeco(outerDeco, this.node, needsWrap));
      if (this.dom != oldDOM) {
        oldDOM.pmViewDesc = void 0;
        this.dom.pmViewDesc = this;
      }
      this.outerDeco = outerDeco;
    }
    selectNode() {
      if (this.nodeDOM.nodeType == 1)
        this.nodeDOM.classList.add("ProseMirror-selectednode");
      if (this.contentDOM || !this.node.type.spec.draggable)
        this.dom.draggable = true;
    }
    deselectNode() {
      if (this.nodeDOM.nodeType == 1)
        this.nodeDOM.classList.remove("ProseMirror-selectednode");
      if (this.contentDOM || !this.node.type.spec.draggable)
        this.dom.removeAttribute("draggable");
    }
    get domAtom() {
      return this.node.isAtom;
    }
  };
  function docViewDesc(doc3, outerDeco, innerDeco, dom, view) {
    applyOuterDeco(dom, outerDeco, doc3);
    return new NodeViewDesc(void 0, doc3, outerDeco, innerDeco, dom, dom, dom, view, 0);
  }
  var TextViewDesc = class extends NodeViewDesc {
    constructor(parent, node, outerDeco, innerDeco, dom, nodeDOM, view) {
      super(parent, node, outerDeco, innerDeco, dom, null, nodeDOM, view, 0);
    }
    parseRule() {
      let skip = this.nodeDOM.parentNode;
      while (skip && skip != this.dom && !skip.pmIsDeco)
        skip = skip.parentNode;
      return { skip: skip || true };
    }
    update(node, outerDeco, innerDeco, view) {
      if (this.dirty == NODE_DIRTY || this.dirty != NOT_DIRTY && !this.inParent() || !node.sameMarkup(this.node))
        return false;
      this.updateOuterDeco(outerDeco);
      if ((this.dirty != NOT_DIRTY || node.text != this.node.text) && node.text != this.nodeDOM.nodeValue) {
        this.nodeDOM.nodeValue = node.text;
        if (view.trackWrites == this.nodeDOM)
          view.trackWrites = null;
      }
      this.node = node;
      this.dirty = NOT_DIRTY;
      return true;
    }
    inParent() {
      let parentDOM = this.parent.contentDOM;
      for (let n = this.nodeDOM; n; n = n.parentNode)
        if (n == parentDOM)
          return true;
      return false;
    }
    domFromPos(pos) {
      return { node: this.nodeDOM, offset: pos };
    }
    localPosFromDOM(dom, offset, bias) {
      if (dom == this.nodeDOM)
        return this.posAtStart + Math.min(offset, this.node.text.length);
      return super.localPosFromDOM(dom, offset, bias);
    }
    ignoreMutation(mutation) {
      return mutation.type != "characterData" && mutation.type != "selection";
    }
    slice(from2, to, view) {
      let node = this.node.cut(from2, to), dom = document.createTextNode(node.text);
      return new TextViewDesc(this.parent, node, this.outerDeco, this.innerDeco, dom, dom, view);
    }
    markDirty(from2, to) {
      super.markDirty(from2, to);
      if (this.dom != this.nodeDOM && (from2 == 0 || to == this.nodeDOM.nodeValue.length))
        this.dirty = NODE_DIRTY;
    }
    get domAtom() {
      return false;
    }
  };
  var TrailingHackViewDesc = class extends ViewDesc {
    parseRule() {
      return { ignore: true };
    }
    matchesHack(nodeName) {
      return this.dirty == NOT_DIRTY && this.dom.nodeName == nodeName;
    }
    get domAtom() {
      return true;
    }
    get ignoreForCoords() {
      return this.dom.nodeName == "IMG";
    }
  };
  var CustomNodeViewDesc = class extends NodeViewDesc {
    constructor(parent, node, outerDeco, innerDeco, dom, contentDOM, nodeDOM, spec, view, pos) {
      super(parent, node, outerDeco, innerDeco, dom, contentDOM, nodeDOM, view, pos);
      this.spec = spec;
    }
    update(node, outerDeco, innerDeco, view) {
      if (this.dirty == NODE_DIRTY)
        return false;
      if (this.spec.update) {
        let result = this.spec.update(node, outerDeco, innerDeco);
        if (result)
          this.updateInner(node, outerDeco, innerDeco, view);
        return result;
      } else if (!this.contentDOM && !node.isLeaf) {
        return false;
      } else {
        return super.update(node, outerDeco, innerDeco, view);
      }
    }
    selectNode() {
      this.spec.selectNode ? this.spec.selectNode() : super.selectNode();
    }
    deselectNode() {
      this.spec.deselectNode ? this.spec.deselectNode() : super.deselectNode();
    }
    setSelection(anchor, head, root, force) {
      this.spec.setSelection ? this.spec.setSelection(anchor, head, root) : super.setSelection(anchor, head, root, force);
    }
    destroy() {
      if (this.spec.destroy)
        this.spec.destroy();
      super.destroy();
    }
    stopEvent(event) {
      return this.spec.stopEvent ? this.spec.stopEvent(event) : false;
    }
    ignoreMutation(mutation) {
      return this.spec.ignoreMutation ? this.spec.ignoreMutation(mutation) : super.ignoreMutation(mutation);
    }
  };
  function renderDescs(parentDOM, descs, view) {
    let dom = parentDOM.firstChild, written = false;
    for (let i = 0; i < descs.length; i++) {
      let desc = descs[i], childDOM = desc.dom;
      if (childDOM.parentNode == parentDOM) {
        while (childDOM != dom) {
          dom = rm(dom);
          written = true;
        }
        dom = dom.nextSibling;
      } else {
        written = true;
        parentDOM.insertBefore(childDOM, dom);
      }
      if (desc instanceof MarkViewDesc) {
        let pos = dom ? dom.previousSibling : parentDOM.lastChild;
        renderDescs(desc.contentDOM, desc.children, view);
        dom = pos ? pos.nextSibling : parentDOM.firstChild;
      }
    }
    while (dom) {
      dom = rm(dom);
      written = true;
    }
    if (written && view.trackWrites == parentDOM)
      view.trackWrites = null;
  }
  var OuterDecoLevel = function(nodeName) {
    if (nodeName)
      this.nodeName = nodeName;
  };
  OuterDecoLevel.prototype = /* @__PURE__ */ Object.create(null);
  var noDeco = [new OuterDecoLevel()];
  function computeOuterDeco(outerDeco, node, needsWrap) {
    if (outerDeco.length == 0)
      return noDeco;
    let top = needsWrap ? noDeco[0] : new OuterDecoLevel(), result = [top];
    for (let i = 0; i < outerDeco.length; i++) {
      let attrs = outerDeco[i].type.attrs;
      if (!attrs)
        continue;
      if (attrs.nodeName)
        result.push(top = new OuterDecoLevel(attrs.nodeName));
      for (let name in attrs) {
        let val = attrs[name];
        if (val == null)
          continue;
        if (needsWrap && result.length == 1)
          result.push(top = new OuterDecoLevel(node.isInline ? "span" : "div"));
        if (name == "class")
          top.class = (top.class ? top.class + " " : "") + val;
        else if (name == "style")
          top.style = (top.style ? top.style + ";" : "") + val;
        else if (name != "nodeName")
          top[name] = val;
      }
    }
    return result;
  }
  function patchOuterDeco(outerDOM, nodeDOM, prevComputed, curComputed) {
    if (prevComputed == noDeco && curComputed == noDeco)
      return nodeDOM;
    let curDOM = nodeDOM;
    for (let i = 0; i < curComputed.length; i++) {
      let deco = curComputed[i], prev = prevComputed[i];
      if (i) {
        let parent;
        if (prev && prev.nodeName == deco.nodeName && curDOM != outerDOM && (parent = curDOM.parentNode) && parent.nodeName.toLowerCase() == deco.nodeName) {
          curDOM = parent;
        } else {
          parent = document.createElement(deco.nodeName);
          parent.pmIsDeco = true;
          parent.appendChild(curDOM);
          prev = noDeco[0];
          curDOM = parent;
        }
      }
      patchAttributes(curDOM, prev || noDeco[0], deco);
    }
    return curDOM;
  }
  function patchAttributes(dom, prev, cur) {
    for (let name in prev)
      if (name != "class" && name != "style" && name != "nodeName" && !(name in cur))
        dom.removeAttribute(name);
    for (let name in cur)
      if (name != "class" && name != "style" && name != "nodeName" && cur[name] != prev[name])
        dom.setAttribute(name, cur[name]);
    if (prev.class != cur.class) {
      let prevList = prev.class ? prev.class.split(" ").filter(Boolean) : [];
      let curList = cur.class ? cur.class.split(" ").filter(Boolean) : [];
      for (let i = 0; i < prevList.length; i++)
        if (curList.indexOf(prevList[i]) == -1)
          dom.classList.remove(prevList[i]);
      for (let i = 0; i < curList.length; i++)
        if (prevList.indexOf(curList[i]) == -1)
          dom.classList.add(curList[i]);
      if (dom.classList.length == 0)
        dom.removeAttribute("class");
    }
    if (prev.style != cur.style) {
      if (prev.style) {
        let prop = /\s*([\w\-\xa1-\uffff]+)\s*:(?:"(?:\\.|[^"])*"|'(?:\\.|[^'])*'|\(.*?\)|[^;])*/g, m;
        while (m = prop.exec(prev.style))
          dom.style.removeProperty(m[1]);
      }
      if (cur.style)
        dom.style.cssText += cur.style;
    }
  }
  function applyOuterDeco(dom, deco, node) {
    return patchOuterDeco(dom, dom, noDeco, computeOuterDeco(deco, node, dom.nodeType != 1));
  }
  function sameOuterDeco(a, b) {
    if (a.length != b.length)
      return false;
    for (let i = 0; i < a.length; i++)
      if (!a[i].type.eq(b[i].type))
        return false;
    return true;
  }
  function rm(dom) {
    let next = dom.nextSibling;
    dom.parentNode.removeChild(dom);
    return next;
  }
  var ViewTreeUpdater = class {
    constructor(top, lock) {
      this.lock = lock;
      this.index = 0;
      this.stack = [];
      this.changed = false;
      this.top = top;
      this.preMatch = preMatch(top.node.content, top);
    }
    destroyBetween(start, end) {
      if (start == end)
        return;
      for (let i = start; i < end; i++)
        this.top.children[i].destroy();
      this.top.children.splice(start, end - start);
      this.changed = true;
    }
    destroyRest() {
      this.destroyBetween(this.index, this.top.children.length);
    }
    syncToMarks(marks2, inline, view) {
      let keep = 0, depth = this.stack.length >> 1;
      let maxKeep = Math.min(depth, marks2.length);
      while (keep < maxKeep && (keep == depth - 1 ? this.top : this.stack[keep + 1 << 1]).matchesMark(marks2[keep]) && marks2[keep].type.spec.spanning !== false)
        keep++;
      while (keep < depth) {
        this.destroyRest();
        this.top.dirty = NOT_DIRTY;
        this.index = this.stack.pop();
        this.top = this.stack.pop();
        depth--;
      }
      while (depth < marks2.length) {
        this.stack.push(this.top, this.index + 1);
        let found2 = -1;
        for (let i = this.index; i < Math.min(this.index + 3, this.top.children.length); i++) {
          if (this.top.children[i].matchesMark(marks2[depth])) {
            found2 = i;
            break;
          }
        }
        if (found2 > -1) {
          if (found2 > this.index) {
            this.changed = true;
            this.destroyBetween(this.index, found2);
          }
          this.top = this.top.children[this.index];
        } else {
          let markDesc = MarkViewDesc.create(this.top, marks2[depth], inline, view);
          this.top.children.splice(this.index, 0, markDesc);
          this.top = markDesc;
          this.changed = true;
        }
        this.index = 0;
        depth++;
      }
    }
    findNodeMatch(node, outerDeco, innerDeco, index) {
      let found2 = -1, targetDesc;
      if (index >= this.preMatch.index && (targetDesc = this.preMatch.matches[index - this.preMatch.index]).parent == this.top && targetDesc.matchesNode(node, outerDeco, innerDeco)) {
        found2 = this.top.children.indexOf(targetDesc, this.index);
      } else {
        for (let i = this.index, e = Math.min(this.top.children.length, i + 5); i < e; i++) {
          let child = this.top.children[i];
          if (child.matchesNode(node, outerDeco, innerDeco) && !this.preMatch.matched.has(child)) {
            found2 = i;
            break;
          }
        }
      }
      if (found2 < 0)
        return false;
      this.destroyBetween(this.index, found2);
      this.index++;
      return true;
    }
    updateNodeAt(node, outerDeco, innerDeco, index, view) {
      let child = this.top.children[index];
      if (child.dirty == NODE_DIRTY && child.dom == child.contentDOM)
        child.dirty = CONTENT_DIRTY;
      if (!child.update(node, outerDeco, innerDeco, view))
        return false;
      this.destroyBetween(this.index, index);
      this.index = index + 1;
      return true;
    }
    findIndexWithChild(domNode) {
      for (; ; ) {
        let parent = domNode.parentNode;
        if (!parent)
          return -1;
        if (parent == this.top.contentDOM) {
          let desc = domNode.pmViewDesc;
          if (desc)
            for (let i = this.index; i < this.top.children.length; i++) {
              if (this.top.children[i] == desc)
                return i;
            }
          return -1;
        }
        domNode = parent;
      }
    }
    updateNextNode(node, outerDeco, innerDeco, view, index) {
      for (let i = this.index; i < this.top.children.length; i++) {
        let next = this.top.children[i];
        if (next instanceof NodeViewDesc) {
          let preMatch2 = this.preMatch.matched.get(next);
          if (preMatch2 != null && preMatch2 != index)
            return false;
          let nextDOM = next.dom;
          let locked = this.lock && (nextDOM == this.lock || nextDOM.nodeType == 1 && nextDOM.contains(this.lock.parentNode)) && !(node.isText && next.node && next.node.isText && next.nodeDOM.nodeValue == node.text && next.dirty != NODE_DIRTY && sameOuterDeco(outerDeco, next.outerDeco));
          if (!locked && next.update(node, outerDeco, innerDeco, view)) {
            this.destroyBetween(this.index, i);
            if (next.dom != nextDOM)
              this.changed = true;
            this.index++;
            return true;
          }
          break;
        }
      }
      return false;
    }
    addNode(node, outerDeco, innerDeco, view, pos) {
      this.top.children.splice(this.index++, 0, NodeViewDesc.create(this.top, node, outerDeco, innerDeco, view, pos));
      this.changed = true;
    }
    placeWidget(widget, view, pos) {
      let next = this.index < this.top.children.length ? this.top.children[this.index] : null;
      if (next && next.matchesWidget(widget) && (widget == next.widget || !next.widget.type.toDOM.parentNode)) {
        this.index++;
      } else {
        let desc = new WidgetViewDesc(this.top, widget, view, pos);
        this.top.children.splice(this.index++, 0, desc);
        this.changed = true;
      }
    }
    addTextblockHacks() {
      let lastChild = this.top.children[this.index - 1], parent = this.top;
      while (lastChild instanceof MarkViewDesc) {
        parent = lastChild;
        lastChild = parent.children[parent.children.length - 1];
      }
      if (!lastChild || !(lastChild instanceof TextViewDesc) || /\n$/.test(lastChild.node.text)) {
        if ((safari || chrome) && lastChild && lastChild.dom.contentEditable == "false")
          this.addHackNode("IMG", parent);
        this.addHackNode("BR", this.top);
      }
    }
    addHackNode(nodeName, parent) {
      if (parent == this.top && this.index < parent.children.length && parent.children[this.index].matchesHack(nodeName)) {
        this.index++;
      } else {
        let dom = document.createElement(nodeName);
        if (nodeName == "IMG") {
          dom.className = "ProseMirror-separator";
          dom.alt = "";
        }
        if (nodeName == "BR")
          dom.className = "ProseMirror-trailingBreak";
        let hack = new TrailingHackViewDesc(this.top, [], dom, null);
        if (parent != this.top)
          parent.children.push(hack);
        else
          parent.children.splice(this.index++, 0, hack);
        this.changed = true;
      }
    }
  };
  function preMatch(frag, parentDesc) {
    let curDesc = parentDesc, descI = curDesc.children.length;
    let fI = frag.childCount, matched = /* @__PURE__ */ new Map(), matches2 = [];
    outer:
      while (fI > 0) {
        let desc;
        for (; ; ) {
          if (descI) {
            let next = curDesc.children[descI - 1];
            if (next instanceof MarkViewDesc) {
              curDesc = next;
              descI = next.children.length;
            } else {
              desc = next;
              descI--;
              break;
            }
          } else if (curDesc == parentDesc) {
            break outer;
          } else {
            descI = curDesc.parent.children.indexOf(curDesc);
            curDesc = curDesc.parent;
          }
        }
        let node = desc.node;
        if (!node)
          continue;
        if (node != frag.child(fI - 1))
          break;
        --fI;
        matched.set(desc, fI);
        matches2.push(desc);
      }
    return { index: fI, matched, matches: matches2.reverse() };
  }
  function compareSide(a, b) {
    return a.type.side - b.type.side;
  }
  function iterDeco(parent, deco, onWidget, onNode) {
    let locals = deco.locals(parent), offset = 0;
    if (locals.length == 0) {
      for (let i = 0; i < parent.childCount; i++) {
        let child = parent.child(i);
        onNode(child, locals, deco.forChild(offset, child), i);
        offset += child.nodeSize;
      }
      return;
    }
    let decoIndex = 0, active = [], restNode = null;
    for (let parentIndex = 0; ; ) {
      if (decoIndex < locals.length && locals[decoIndex].to == offset) {
        let widget = locals[decoIndex++], widgets;
        while (decoIndex < locals.length && locals[decoIndex].to == offset)
          (widgets || (widgets = [widget])).push(locals[decoIndex++]);
        if (widgets) {
          widgets.sort(compareSide);
          for (let i = 0; i < widgets.length; i++)
            onWidget(widgets[i], parentIndex, !!restNode);
        } else {
          onWidget(widget, parentIndex, !!restNode);
        }
      }
      let child, index;
      if (restNode) {
        index = -1;
        child = restNode;
        restNode = null;
      } else if (parentIndex < parent.childCount) {
        index = parentIndex;
        child = parent.child(parentIndex++);
      } else {
        break;
      }
      for (let i = 0; i < active.length; i++)
        if (active[i].to <= offset)
          active.splice(i--, 1);
      while (decoIndex < locals.length && locals[decoIndex].from <= offset && locals[decoIndex].to > offset)
        active.push(locals[decoIndex++]);
      let end = offset + child.nodeSize;
      if (child.isText) {
        let cutAt = end;
        if (decoIndex < locals.length && locals[decoIndex].from < cutAt)
          cutAt = locals[decoIndex].from;
        for (let i = 0; i < active.length; i++)
          if (active[i].to < cutAt)
            cutAt = active[i].to;
        if (cutAt < end) {
          restNode = child.cut(cutAt - offset);
          child = child.cut(0, cutAt - offset);
          end = cutAt;
          index = -1;
        }
      }
      let outerDeco = child.isInline && !child.isLeaf ? active.filter((d) => !d.inline) : active.slice();
      onNode(child, outerDeco, deco.forChild(offset, child), index);
      offset = end;
    }
  }
  function iosHacks(dom) {
    if (dom.nodeName == "UL" || dom.nodeName == "OL") {
      let oldCSS = dom.style.cssText;
      dom.style.cssText = oldCSS + "; list-style: square !important";
      window.getComputedStyle(dom).listStyle;
      dom.style.cssText = oldCSS;
    }
  }
  function nearbyTextNode(node, offset) {
    for (; ; ) {
      if (node.nodeType == 3)
        return node;
      if (node.nodeType == 1 && offset > 0) {
        if (node.childNodes.length > offset && node.childNodes[offset].nodeType == 3)
          return node.childNodes[offset];
        node = node.childNodes[offset - 1];
        offset = nodeSize(node);
      } else if (node.nodeType == 1 && offset < node.childNodes.length) {
        node = node.childNodes[offset];
        offset = 0;
      } else {
        return null;
      }
    }
  }
  function findTextInFragment(frag, text, from2, to) {
    for (let i = 0, pos = 0; i < frag.childCount && pos <= to; ) {
      let child = frag.child(i++), childStart = pos;
      pos += child.nodeSize;
      if (!child.isText)
        continue;
      let str = child.text;
      while (i < frag.childCount) {
        let next = frag.child(i++);
        pos += next.nodeSize;
        if (!next.isText)
          break;
        str += next.text;
      }
      if (pos >= from2) {
        let found2 = childStart < to ? str.lastIndexOf(text, to - childStart - 1) : -1;
        if (found2 >= 0 && found2 + text.length + childStart >= from2)
          return childStart + found2;
        if (from2 == to && str.length >= to + text.length - childStart && str.slice(to - childStart, to - childStart + text.length) == text)
          return to;
      }
    }
    return -1;
  }
  function replaceNodes(nodes2, from2, to, view, replacement) {
    let result = [];
    for (let i = 0, off = 0; i < nodes2.length; i++) {
      let child = nodes2[i], start = off, end = off += child.size;
      if (start >= to || end <= from2) {
        result.push(child);
      } else {
        if (start < from2)
          result.push(child.slice(0, from2 - start, view));
        if (replacement) {
          result.push(replacement);
          replacement = void 0;
        }
        if (end > to)
          result.push(child.slice(to - start, child.size, view));
      }
    }
    return result;
  }
  function selectionFromDOM(view, origin = null) {
    let domSel = view.domSelection(), doc3 = view.state.doc;
    if (!domSel.focusNode)
      return null;
    let nearestDesc = view.docView.nearestDesc(domSel.focusNode), inWidget = nearestDesc && nearestDesc.size == 0;
    let head = view.docView.posFromDOM(domSel.focusNode, domSel.focusOffset, 1);
    if (head < 0)
      return null;
    let $head = doc3.resolve(head), $anchor, selection;
    if (selectionCollapsed(domSel)) {
      $anchor = $head;
      while (nearestDesc && !nearestDesc.node)
        nearestDesc = nearestDesc.parent;
      let nearestDescNode = nearestDesc.node;
      if (nearestDesc && nearestDescNode.isAtom && NodeSelection.isSelectable(nearestDescNode) && nearestDesc.parent && !(nearestDescNode.isInline && isOnEdge(domSel.focusNode, domSel.focusOffset, nearestDesc.dom))) {
        let pos = nearestDesc.posBefore;
        selection = new NodeSelection(head == pos ? $head : doc3.resolve(pos));
      }
    } else {
      let anchor = view.docView.posFromDOM(domSel.anchorNode, domSel.anchorOffset, 1);
      if (anchor < 0)
        return null;
      $anchor = doc3.resolve(anchor);
    }
    if (!selection) {
      let bias = origin == "pointer" || view.state.selection.head < $head.pos && !inWidget ? 1 : -1;
      selection = selectionBetween(view, $anchor, $head, bias);
    }
    return selection;
  }
  function editorOwnsSelection(view) {
    return view.editable ? view.hasFocus() : hasSelection(view) && document.activeElement && document.activeElement.contains(view.dom);
  }
  function selectionToDOM(view, force = false) {
    let sel = view.state.selection;
    syncNodeSelection(view, sel);
    if (!editorOwnsSelection(view))
      return;
    if (!force && view.input.mouseDown && view.input.mouseDown.allowDefault && chrome) {
      let domSel = view.domSelection(), curSel = view.domObserver.currentSelection;
      if (domSel.anchorNode && curSel.anchorNode && isEquivalentPosition(domSel.anchorNode, domSel.anchorOffset, curSel.anchorNode, curSel.anchorOffset)) {
        view.input.mouseDown.delayedSelectionSync = true;
        view.domObserver.setCurSelection();
        return;
      }
    }
    view.domObserver.disconnectSelection();
    if (view.cursorWrapper) {
      selectCursorWrapper(view);
    } else {
      let { anchor, head } = sel, resetEditableFrom, resetEditableTo;
      if (brokenSelectBetweenUneditable && !(sel instanceof TextSelection)) {
        if (!sel.$from.parent.inlineContent)
          resetEditableFrom = temporarilyEditableNear(view, sel.from);
        if (!sel.empty && !sel.$from.parent.inlineContent)
          resetEditableTo = temporarilyEditableNear(view, sel.to);
      }
      view.docView.setSelection(anchor, head, view.root, force);
      if (brokenSelectBetweenUneditable) {
        if (resetEditableFrom)
          resetEditable(resetEditableFrom);
        if (resetEditableTo)
          resetEditable(resetEditableTo);
      }
      if (sel.visible) {
        view.dom.classList.remove("ProseMirror-hideselection");
      } else {
        view.dom.classList.add("ProseMirror-hideselection");
        if ("onselectionchange" in document)
          removeClassOnSelectionChange(view);
      }
    }
    view.domObserver.setCurSelection();
    view.domObserver.connectSelection();
  }
  var brokenSelectBetweenUneditable = safari || chrome && chrome_version < 63;
  function temporarilyEditableNear(view, pos) {
    let { node, offset } = view.docView.domFromPos(pos, 0);
    let after = offset < node.childNodes.length ? node.childNodes[offset] : null;
    let before = offset ? node.childNodes[offset - 1] : null;
    if (safari && after && after.contentEditable == "false")
      return setEditable(after);
    if ((!after || after.contentEditable == "false") && (!before || before.contentEditable == "false")) {
      if (after)
        return setEditable(after);
      else if (before)
        return setEditable(before);
    }
  }
  function setEditable(element) {
    element.contentEditable = "true";
    if (safari && element.draggable) {
      element.draggable = false;
      element.wasDraggable = true;
    }
    return element;
  }
  function resetEditable(element) {
    element.contentEditable = "false";
    if (element.wasDraggable) {
      element.draggable = true;
      element.wasDraggable = null;
    }
  }
  function removeClassOnSelectionChange(view) {
    let doc3 = view.dom.ownerDocument;
    doc3.removeEventListener("selectionchange", view.input.hideSelectionGuard);
    let domSel = view.domSelection();
    let node = domSel.anchorNode, offset = domSel.anchorOffset;
    doc3.addEventListener("selectionchange", view.input.hideSelectionGuard = () => {
      if (domSel.anchorNode != node || domSel.anchorOffset != offset) {
        doc3.removeEventListener("selectionchange", view.input.hideSelectionGuard);
        setTimeout(() => {
          if (!editorOwnsSelection(view) || view.state.selection.visible)
            view.dom.classList.remove("ProseMirror-hideselection");
        }, 20);
      }
    });
  }
  function selectCursorWrapper(view) {
    let domSel = view.domSelection(), range = document.createRange();
    let node = view.cursorWrapper.dom, img = node.nodeName == "IMG";
    if (img)
      range.setEnd(node.parentNode, domIndex(node) + 1);
    else
      range.setEnd(node, 0);
    range.collapse(false);
    domSel.removeAllRanges();
    domSel.addRange(range);
    if (!img && !view.state.selection.visible && ie && ie_version <= 11) {
      node.disabled = true;
      node.disabled = false;
    }
  }
  function syncNodeSelection(view, sel) {
    if (sel instanceof NodeSelection) {
      let desc = view.docView.descAt(sel.from);
      if (desc != view.lastSelectedViewDesc) {
        clearNodeSelection(view);
        if (desc)
          desc.selectNode();
        view.lastSelectedViewDesc = desc;
      }
    } else {
      clearNodeSelection(view);
    }
  }
  function clearNodeSelection(view) {
    if (view.lastSelectedViewDesc) {
      if (view.lastSelectedViewDesc.parent)
        view.lastSelectedViewDesc.deselectNode();
      view.lastSelectedViewDesc = void 0;
    }
  }
  function selectionBetween(view, $anchor, $head, bias) {
    return view.someProp("createSelectionBetween", (f) => f(view, $anchor, $head)) || TextSelection.between($anchor, $head, bias);
  }
  function hasFocusAndSelection(view) {
    if (view.editable && view.root.activeElement != view.dom)
      return false;
    return hasSelection(view);
  }
  function hasSelection(view) {
    let sel = view.domSelection();
    if (!sel.anchorNode)
      return false;
    try {
      return view.dom.contains(sel.anchorNode.nodeType == 3 ? sel.anchorNode.parentNode : sel.anchorNode) && (view.editable || view.dom.contains(sel.focusNode.nodeType == 3 ? sel.focusNode.parentNode : sel.focusNode));
    } catch (_) {
      return false;
    }
  }
  function anchorInRightPlace(view) {
    let anchorDOM = view.docView.domFromPos(view.state.selection.anchor, 0);
    let domSel = view.domSelection();
    return isEquivalentPosition(anchorDOM.node, anchorDOM.offset, domSel.anchorNode, domSel.anchorOffset);
  }
  function moveSelectionBlock(state, dir) {
    let { $anchor, $head } = state.selection;
    let $side = dir > 0 ? $anchor.max($head) : $anchor.min($head);
    let $start = !$side.parent.inlineContent ? $side : $side.depth ? state.doc.resolve(dir > 0 ? $side.after() : $side.before()) : null;
    return $start && Selection.findFrom($start, dir);
  }
  function apply(view, sel) {
    view.dispatch(view.state.tr.setSelection(sel).scrollIntoView());
    return true;
  }
  function selectHorizontally(view, dir, mods) {
    let sel = view.state.selection;
    if (sel instanceof TextSelection) {
      if (!sel.empty || mods.indexOf("s") > -1) {
        return false;
      } else if (view.endOfTextblock(dir > 0 ? "right" : "left")) {
        let next = moveSelectionBlock(view.state, dir);
        if (next && next instanceof NodeSelection)
          return apply(view, next);
        return false;
      } else if (!(mac && mods.indexOf("m") > -1)) {
        let $head = sel.$head, node = $head.textOffset ? null : dir < 0 ? $head.nodeBefore : $head.nodeAfter, desc;
        if (!node || node.isText)
          return false;
        let nodePos = dir < 0 ? $head.pos - node.nodeSize : $head.pos;
        if (!(node.isAtom || (desc = view.docView.descAt(nodePos)) && !desc.contentDOM))
          return false;
        if (NodeSelection.isSelectable(node)) {
          return apply(view, new NodeSelection(dir < 0 ? view.state.doc.resolve($head.pos - node.nodeSize) : $head));
        } else if (webkit) {
          return apply(view, new TextSelection(view.state.doc.resolve(dir < 0 ? nodePos : nodePos + node.nodeSize)));
        } else {
          return false;
        }
      }
    } else if (sel instanceof NodeSelection && sel.node.isInline) {
      return apply(view, new TextSelection(dir > 0 ? sel.$to : sel.$from));
    } else {
      let next = moveSelectionBlock(view.state, dir);
      if (next)
        return apply(view, next);
      return false;
    }
  }
  function nodeLen(node) {
    return node.nodeType == 3 ? node.nodeValue.length : node.childNodes.length;
  }
  function isIgnorable(dom) {
    let desc = dom.pmViewDesc;
    return desc && desc.size == 0 && (dom.nextSibling || dom.nodeName != "BR");
  }
  function skipIgnoredNodesLeft(view) {
    let sel = view.domSelection();
    let node = sel.focusNode, offset = sel.focusOffset;
    if (!node)
      return;
    let moveNode, moveOffset, force = false;
    if (gecko && node.nodeType == 1 && offset < nodeLen(node) && isIgnorable(node.childNodes[offset]))
      force = true;
    for (; ; ) {
      if (offset > 0) {
        if (node.nodeType != 1) {
          break;
        } else {
          let before = node.childNodes[offset - 1];
          if (isIgnorable(before)) {
            moveNode = node;
            moveOffset = --offset;
          } else if (before.nodeType == 3) {
            node = before;
            offset = node.nodeValue.length;
          } else
            break;
        }
      } else if (isBlockNode(node)) {
        break;
      } else {
        let prev = node.previousSibling;
        while (prev && isIgnorable(prev)) {
          moveNode = node.parentNode;
          moveOffset = domIndex(prev);
          prev = prev.previousSibling;
        }
        if (!prev) {
          node = node.parentNode;
          if (node == view.dom)
            break;
          offset = 0;
        } else {
          node = prev;
          offset = nodeLen(node);
        }
      }
    }
    if (force)
      setSelFocus(view, sel, node, offset);
    else if (moveNode)
      setSelFocus(view, sel, moveNode, moveOffset);
  }
  function skipIgnoredNodesRight(view) {
    let sel = view.domSelection();
    let node = sel.focusNode, offset = sel.focusOffset;
    if (!node)
      return;
    let len = nodeLen(node);
    let moveNode, moveOffset;
    for (; ; ) {
      if (offset < len) {
        if (node.nodeType != 1)
          break;
        let after = node.childNodes[offset];
        if (isIgnorable(after)) {
          moveNode = node;
          moveOffset = ++offset;
        } else
          break;
      } else if (isBlockNode(node)) {
        break;
      } else {
        let next = node.nextSibling;
        while (next && isIgnorable(next)) {
          moveNode = next.parentNode;
          moveOffset = domIndex(next) + 1;
          next = next.nextSibling;
        }
        if (!next) {
          node = node.parentNode;
          if (node == view.dom)
            break;
          offset = len = 0;
        } else {
          node = next;
          offset = 0;
          len = nodeLen(node);
        }
      }
    }
    if (moveNode)
      setSelFocus(view, sel, moveNode, moveOffset);
  }
  function isBlockNode(dom) {
    let desc = dom.pmViewDesc;
    return desc && desc.node && desc.node.isBlock;
  }
  function setSelFocus(view, sel, node, offset) {
    if (selectionCollapsed(sel)) {
      let range = document.createRange();
      range.setEnd(node, offset);
      range.setStart(node, offset);
      sel.removeAllRanges();
      sel.addRange(range);
    } else if (sel.extend) {
      sel.extend(node, offset);
    }
    view.domObserver.setCurSelection();
    let { state } = view;
    setTimeout(() => {
      if (view.state == state)
        selectionToDOM(view);
    }, 50);
  }
  function selectVertically(view, dir, mods) {
    let sel = view.state.selection;
    if (sel instanceof TextSelection && !sel.empty || mods.indexOf("s") > -1)
      return false;
    if (mac && mods.indexOf("m") > -1)
      return false;
    let { $from, $to } = sel;
    if (!$from.parent.inlineContent || view.endOfTextblock(dir < 0 ? "up" : "down")) {
      let next = moveSelectionBlock(view.state, dir);
      if (next && next instanceof NodeSelection)
        return apply(view, next);
    }
    if (!$from.parent.inlineContent) {
      let side = dir < 0 ? $from : $to;
      let beyond = sel instanceof AllSelection ? Selection.near(side, dir) : Selection.findFrom(side, dir);
      return beyond ? apply(view, beyond) : false;
    }
    return false;
  }
  function stopNativeHorizontalDelete(view, dir) {
    if (!(view.state.selection instanceof TextSelection))
      return true;
    let { $head, $anchor, empty: empty2 } = view.state.selection;
    if (!$head.sameParent($anchor))
      return true;
    if (!empty2)
      return false;
    if (view.endOfTextblock(dir > 0 ? "forward" : "backward"))
      return true;
    let nextNode = !$head.textOffset && (dir < 0 ? $head.nodeBefore : $head.nodeAfter);
    if (nextNode && !nextNode.isText) {
      let tr = view.state.tr;
      if (dir < 0)
        tr.delete($head.pos - nextNode.nodeSize, $head.pos);
      else
        tr.delete($head.pos, $head.pos + nextNode.nodeSize);
      view.dispatch(tr);
      return true;
    }
    return false;
  }
  function switchEditable(view, node, state) {
    view.domObserver.stop();
    node.contentEditable = state;
    view.domObserver.start();
  }
  function safariDownArrowBug(view) {
    if (!safari || view.state.selection.$head.parentOffset > 0)
      return false;
    let { focusNode, focusOffset } = view.domSelection();
    if (focusNode && focusNode.nodeType == 1 && focusOffset == 0 && focusNode.firstChild && focusNode.firstChild.contentEditable == "false") {
      let child = focusNode.firstChild;
      switchEditable(view, child, "true");
      setTimeout(() => switchEditable(view, child, "false"), 20);
    }
    return false;
  }
  function getMods(event) {
    let result = "";
    if (event.ctrlKey)
      result += "c";
    if (event.metaKey)
      result += "m";
    if (event.altKey)
      result += "a";
    if (event.shiftKey)
      result += "s";
    return result;
  }
  function captureKeyDown(view, event) {
    let code = event.keyCode, mods = getMods(event);
    if (code == 8 || mac && code == 72 && mods == "c") {
      return stopNativeHorizontalDelete(view, -1) || skipIgnoredNodesLeft(view);
    } else if (code == 46 || mac && code == 68 && mods == "c") {
      return stopNativeHorizontalDelete(view, 1) || skipIgnoredNodesRight(view);
    } else if (code == 13 || code == 27) {
      return true;
    } else if (code == 37 || mac && code == 66 && mods == "c") {
      return selectHorizontally(view, -1, mods) || skipIgnoredNodesLeft(view);
    } else if (code == 39 || mac && code == 70 && mods == "c") {
      return selectHorizontally(view, 1, mods) || skipIgnoredNodesRight(view);
    } else if (code == 38 || mac && code == 80 && mods == "c") {
      return selectVertically(view, -1, mods) || skipIgnoredNodesLeft(view);
    } else if (code == 40 || mac && code == 78 && mods == "c") {
      return safariDownArrowBug(view) || selectVertically(view, 1, mods) || skipIgnoredNodesRight(view);
    } else if (mods == (mac ? "m" : "c") && (code == 66 || code == 73 || code == 89 || code == 90)) {
      return true;
    }
    return false;
  }
  function serializeForClipboard(view, slice2) {
    let context = [], { content, openStart, openEnd } = slice2;
    while (openStart > 1 && openEnd > 1 && content.childCount == 1 && content.firstChild.childCount == 1) {
      openStart--;
      openEnd--;
      let node = content.firstChild;
      context.push(node.type.name, node.attrs != node.type.defaultAttrs ? node.attrs : null);
      content = node.content;
    }
    let serializer = view.someProp("clipboardSerializer") || DOMSerializer.fromSchema(view.state.schema);
    let doc3 = detachedDoc(), wrap2 = doc3.createElement("div");
    wrap2.appendChild(serializer.serializeFragment(content, { document: doc3 }));
    let firstChild = wrap2.firstChild, needsWrap, wrappers = 0;
    while (firstChild && firstChild.nodeType == 1 && (needsWrap = wrapMap[firstChild.nodeName.toLowerCase()])) {
      for (let i = needsWrap.length - 1; i >= 0; i--) {
        let wrapper = doc3.createElement(needsWrap[i]);
        while (wrap2.firstChild)
          wrapper.appendChild(wrap2.firstChild);
        wrap2.appendChild(wrapper);
        wrappers++;
      }
      firstChild = wrap2.firstChild;
    }
    if (firstChild && firstChild.nodeType == 1)
      firstChild.setAttribute("data-pm-slice", `${openStart} ${openEnd}${wrappers ? ` -${wrappers}` : ""} ${JSON.stringify(context)}`);
    let text = view.someProp("clipboardTextSerializer", (f) => f(slice2)) || slice2.content.textBetween(0, slice2.content.size, "\n\n");
    return { dom: wrap2, text };
  }
  function parseFromClipboard(view, text, html, plainText, $context) {
    let inCode = $context.parent.type.spec.code;
    let dom, slice2;
    if (!html && !text)
      return null;
    let asText = text && (plainText || inCode || !html);
    if (asText) {
      view.someProp("transformPastedText", (f) => {
        text = f(text, inCode || plainText);
      });
      if (inCode)
        return text ? new Slice(Fragment.from(view.state.schema.text(text.replace(/\r\n?/g, "\n"))), 0, 0) : Slice.empty;
      let parsed = view.someProp("clipboardTextParser", (f) => f(text, $context, plainText));
      if (parsed) {
        slice2 = parsed;
      } else {
        let marks2 = $context.marks();
        let { schema: schema2 } = view.state, serializer = DOMSerializer.fromSchema(schema2);
        dom = document.createElement("div");
        text.split(/(?:\r\n?|\n)+/).forEach((block) => {
          let p = dom.appendChild(document.createElement("p"));
          if (block)
            p.appendChild(serializer.serializeNode(schema2.text(block, marks2)));
        });
      }
    } else {
      view.someProp("transformPastedHTML", (f) => {
        html = f(html);
      });
      dom = readHTML(html);
      if (webkit)
        restoreReplacedSpaces(dom);
    }
    let contextNode = dom && dom.querySelector("[data-pm-slice]");
    let sliceData = contextNode && /^(\d+) (\d+)(?: -(\d+))? (.*)/.exec(contextNode.getAttribute("data-pm-slice") || "");
    if (sliceData && sliceData[3])
      for (let i = +sliceData[3]; i > 0 && dom.firstChild; i--)
        dom = dom.firstChild;
    if (!slice2) {
      let parser = view.someProp("clipboardParser") || view.someProp("domParser") || DOMParser.fromSchema(view.state.schema);
      slice2 = parser.parseSlice(dom, {
        preserveWhitespace: !!(asText || sliceData),
        context: $context,
        ruleFromNode(dom2) {
          if (dom2.nodeName == "BR" && !dom2.nextSibling && dom2.parentNode && !inlineParents.test(dom2.parentNode.nodeName))
            return { ignore: true };
          return null;
        }
      });
    }
    if (sliceData) {
      slice2 = addContext(closeSlice(slice2, +sliceData[1], +sliceData[2]), sliceData[4]);
    } else {
      slice2 = Slice.maxOpen(normalizeSiblings(slice2.content, $context), true);
      if (slice2.openStart || slice2.openEnd) {
        let openStart = 0, openEnd = 0;
        for (let node = slice2.content.firstChild; openStart < slice2.openStart && !node.type.spec.isolating; openStart++, node = node.firstChild) {
        }
        for (let node = slice2.content.lastChild; openEnd < slice2.openEnd && !node.type.spec.isolating; openEnd++, node = node.lastChild) {
        }
        slice2 = closeSlice(slice2, openStart, openEnd);
      }
    }
    view.someProp("transformPasted", (f) => {
      slice2 = f(slice2);
    });
    return slice2;
  }
  var inlineParents = /^(a|abbr|acronym|b|cite|code|del|em|i|ins|kbd|label|output|q|ruby|s|samp|span|strong|sub|sup|time|u|tt|var)$/i;
  function normalizeSiblings(fragment, $context) {
    if (fragment.childCount < 2)
      return fragment;
    for (let d = $context.depth; d >= 0; d--) {
      let parent = $context.node(d);
      let match = parent.contentMatchAt($context.index(d));
      let lastWrap, result = [];
      fragment.forEach((node) => {
        if (!result)
          return;
        let wrap2 = match.findWrapping(node.type), inLast;
        if (!wrap2)
          return result = null;
        if (inLast = result.length && lastWrap.length && addToSibling(wrap2, lastWrap, node, result[result.length - 1], 0)) {
          result[result.length - 1] = inLast;
        } else {
          if (result.length)
            result[result.length - 1] = closeRight(result[result.length - 1], lastWrap.length);
          let wrapped = withWrappers(node, wrap2);
          result.push(wrapped);
          match = match.matchType(wrapped.type);
          lastWrap = wrap2;
        }
      });
      if (result)
        return Fragment.from(result);
    }
    return fragment;
  }
  function withWrappers(node, wrap2, from2 = 0) {
    for (let i = wrap2.length - 1; i >= from2; i--)
      node = wrap2[i].create(null, Fragment.from(node));
    return node;
  }
  function addToSibling(wrap2, lastWrap, node, sibling, depth) {
    if (depth < wrap2.length && depth < lastWrap.length && wrap2[depth] == lastWrap[depth]) {
      let inner = addToSibling(wrap2, lastWrap, node, sibling.lastChild, depth + 1);
      if (inner)
        return sibling.copy(sibling.content.replaceChild(sibling.childCount - 1, inner));
      let match = sibling.contentMatchAt(sibling.childCount);
      if (match.matchType(depth == wrap2.length - 1 ? node.type : wrap2[depth + 1]))
        return sibling.copy(sibling.content.append(Fragment.from(withWrappers(node, wrap2, depth + 1))));
    }
  }
  function closeRight(node, depth) {
    if (depth == 0)
      return node;
    let fragment = node.content.replaceChild(node.childCount - 1, closeRight(node.lastChild, depth - 1));
    let fill = node.contentMatchAt(node.childCount).fillBefore(Fragment.empty, true);
    return node.copy(fragment.append(fill));
  }
  function closeRange(fragment, side, from2, to, depth, openEnd) {
    let node = side < 0 ? fragment.firstChild : fragment.lastChild, inner = node.content;
    if (depth < to - 1)
      inner = closeRange(inner, side, from2, to, depth + 1, openEnd);
    if (depth >= from2)
      inner = side < 0 ? node.contentMatchAt(0).fillBefore(inner, fragment.childCount > 1 || openEnd <= depth).append(inner) : inner.append(node.contentMatchAt(node.childCount).fillBefore(Fragment.empty, true));
    return fragment.replaceChild(side < 0 ? 0 : fragment.childCount - 1, node.copy(inner));
  }
  function closeSlice(slice2, openStart, openEnd) {
    if (openStart < slice2.openStart)
      slice2 = new Slice(closeRange(slice2.content, -1, openStart, slice2.openStart, 0, slice2.openEnd), openStart, slice2.openEnd);
    if (openEnd < slice2.openEnd)
      slice2 = new Slice(closeRange(slice2.content, 1, openEnd, slice2.openEnd, 0, 0), slice2.openStart, openEnd);
    return slice2;
  }
  var wrapMap = {
    thead: ["table"],
    tbody: ["table"],
    tfoot: ["table"],
    caption: ["table"],
    colgroup: ["table"],
    col: ["table", "colgroup"],
    tr: ["table", "tbody"],
    td: ["table", "tbody", "tr"],
    th: ["table", "tbody", "tr"]
  };
  var _detachedDoc = null;
  function detachedDoc() {
    return _detachedDoc || (_detachedDoc = document.implementation.createHTMLDocument("title"));
  }
  function readHTML(html) {
    let metas = /^(\s*<meta [^>]*>)*/.exec(html);
    if (metas)
      html = html.slice(metas[0].length);
    let elt = detachedDoc().createElement("div");
    let firstTag = /<([a-z][^>\s]+)/i.exec(html), wrap2;
    if (wrap2 = firstTag && wrapMap[firstTag[1].toLowerCase()])
      html = wrap2.map((n) => "<" + n + ">").join("") + html + wrap2.map((n) => "</" + n + ">").reverse().join("");
    elt.innerHTML = html;
    if (wrap2)
      for (let i = 0; i < wrap2.length; i++)
        elt = elt.querySelector(wrap2[i]) || elt;
    return elt;
  }
  function restoreReplacedSpaces(dom) {
    let nodes2 = dom.querySelectorAll(chrome ? "span:not([class]):not([style])" : "span.Apple-converted-space");
    for (let i = 0; i < nodes2.length; i++) {
      let node = nodes2[i];
      if (node.childNodes.length == 1 && node.textContent == "\xA0" && node.parentNode)
        node.parentNode.replaceChild(dom.ownerDocument.createTextNode(" "), node);
    }
  }
  function addContext(slice2, context) {
    if (!slice2.size)
      return slice2;
    let schema2 = slice2.content.firstChild.type.schema, array;
    try {
      array = JSON.parse(context);
    } catch (e) {
      return slice2;
    }
    let { content, openStart, openEnd } = slice2;
    for (let i = array.length - 2; i >= 0; i -= 2) {
      let type = schema2.nodes[array[i]];
      if (!type || type.hasRequiredAttrs())
        break;
      content = Fragment.from(type.create(array[i + 1], content));
      openStart++;
      openEnd++;
    }
    return new Slice(content, openStart, openEnd);
  }
  var handlers = {};
  var editHandlers = {};
  var InputState = class {
    constructor() {
      this.shiftKey = false;
      this.mouseDown = null;
      this.lastKeyCode = null;
      this.lastKeyCodeTime = 0;
      this.lastClick = { time: 0, x: 0, y: 0, type: "" };
      this.lastSelectionOrigin = null;
      this.lastSelectionTime = 0;
      this.lastIOSEnter = 0;
      this.lastIOSEnterFallbackTimeout = -1;
      this.lastAndroidDelete = 0;
      this.composing = false;
      this.composingTimeout = -1;
      this.compositionNodes = [];
      this.compositionEndedAt = -2e8;
      this.domChangeCount = 0;
      this.eventHandlers = /* @__PURE__ */ Object.create(null);
      this.hideSelectionGuard = null;
    }
  };
  function initInput(view) {
    for (let event in handlers) {
      let handler = handlers[event];
      view.dom.addEventListener(event, view.input.eventHandlers[event] = (event2) => {
        if (eventBelongsToView(view, event2) && !runCustomHandler(view, event2) && (view.editable || !(event2.type in editHandlers)))
          handler(view, event2);
      });
    }
    if (safari)
      view.dom.addEventListener("input", () => null);
    ensureListeners(view);
  }
  function setSelectionOrigin(view, origin) {
    view.input.lastSelectionOrigin = origin;
    view.input.lastSelectionTime = Date.now();
  }
  function destroyInput(view) {
    view.domObserver.stop();
    for (let type in view.input.eventHandlers)
      view.dom.removeEventListener(type, view.input.eventHandlers[type]);
    clearTimeout(view.input.composingTimeout);
    clearTimeout(view.input.lastIOSEnterFallbackTimeout);
  }
  function ensureListeners(view) {
    view.someProp("handleDOMEvents", (currentHandlers) => {
      for (let type in currentHandlers)
        if (!view.input.eventHandlers[type])
          view.dom.addEventListener(type, view.input.eventHandlers[type] = (event) => runCustomHandler(view, event));
    });
  }
  function runCustomHandler(view, event) {
    return view.someProp("handleDOMEvents", (handlers2) => {
      let handler = handlers2[event.type];
      return handler ? handler(view, event) || event.defaultPrevented : false;
    });
  }
  function eventBelongsToView(view, event) {
    if (!event.bubbles)
      return true;
    if (event.defaultPrevented)
      return false;
    for (let node = event.target; node != view.dom; node = node.parentNode)
      if (!node || node.nodeType == 11 || node.pmViewDesc && node.pmViewDesc.stopEvent(event))
        return false;
    return true;
  }
  function dispatchEvent(view, event) {
    if (!runCustomHandler(view, event) && handlers[event.type] && (view.editable || !(event.type in editHandlers)))
      handlers[event.type](view, event);
  }
  editHandlers.keydown = (view, _event) => {
    let event = _event;
    view.input.shiftKey = event.keyCode == 16 || event.shiftKey;
    if (inOrNearComposition(view, event))
      return;
    view.input.lastKeyCode = event.keyCode;
    view.input.lastKeyCodeTime = Date.now();
    if (android && chrome && event.keyCode == 13)
      return;
    if (event.keyCode != 229)
      view.domObserver.forceFlush();
    if (ios && event.keyCode == 13 && !event.ctrlKey && !event.altKey && !event.metaKey) {
      let now = Date.now();
      view.input.lastIOSEnter = now;
      view.input.lastIOSEnterFallbackTimeout = setTimeout(() => {
        if (view.input.lastIOSEnter == now) {
          view.someProp("handleKeyDown", (f) => f(view, keyEvent(13, "Enter")));
          view.input.lastIOSEnter = 0;
        }
      }, 200);
    } else if (view.someProp("handleKeyDown", (f) => f(view, event)) || captureKeyDown(view, event)) {
      event.preventDefault();
    } else {
      setSelectionOrigin(view, "key");
    }
  };
  editHandlers.keyup = (view, event) => {
    if (event.keyCode == 16)
      view.input.shiftKey = false;
  };
  editHandlers.keypress = (view, _event) => {
    let event = _event;
    if (inOrNearComposition(view, event) || !event.charCode || event.ctrlKey && !event.altKey || mac && event.metaKey)
      return;
    if (view.someProp("handleKeyPress", (f) => f(view, event))) {
      event.preventDefault();
      return;
    }
    let sel = view.state.selection;
    if (!(sel instanceof TextSelection) || !sel.$from.sameParent(sel.$to)) {
      let text = String.fromCharCode(event.charCode);
      if (!view.someProp("handleTextInput", (f) => f(view, sel.$from.pos, sel.$to.pos, text)))
        view.dispatch(view.state.tr.insertText(text).scrollIntoView());
      event.preventDefault();
    }
  };
  function eventCoords(event) {
    return { left: event.clientX, top: event.clientY };
  }
  function isNear(event, click) {
    let dx = click.x - event.clientX, dy = click.y - event.clientY;
    return dx * dx + dy * dy < 100;
  }
  function runHandlerOnContext(view, propName, pos, inside, event) {
    if (inside == -1)
      return false;
    let $pos = view.state.doc.resolve(inside);
    for (let i = $pos.depth + 1; i > 0; i--) {
      if (view.someProp(propName, (f) => i > $pos.depth ? f(view, pos, $pos.nodeAfter, $pos.before(i), event, true) : f(view, pos, $pos.node(i), $pos.before(i), event, false)))
        return true;
    }
    return false;
  }
  function updateSelection(view, selection, origin) {
    if (!view.focused)
      view.focus();
    let tr = view.state.tr.setSelection(selection);
    if (origin == "pointer")
      tr.setMeta("pointer", true);
    view.dispatch(tr);
  }
  function selectClickedLeaf(view, inside) {
    if (inside == -1)
      return false;
    let $pos = view.state.doc.resolve(inside), node = $pos.nodeAfter;
    if (node && node.isAtom && NodeSelection.isSelectable(node)) {
      updateSelection(view, new NodeSelection($pos), "pointer");
      return true;
    }
    return false;
  }
  function selectClickedNode(view, inside) {
    if (inside == -1)
      return false;
    let sel = view.state.selection, selectedNode, selectAt;
    if (sel instanceof NodeSelection)
      selectedNode = sel.node;
    let $pos = view.state.doc.resolve(inside);
    for (let i = $pos.depth + 1; i > 0; i--) {
      let node = i > $pos.depth ? $pos.nodeAfter : $pos.node(i);
      if (NodeSelection.isSelectable(node)) {
        if (selectedNode && sel.$from.depth > 0 && i >= sel.$from.depth && $pos.before(sel.$from.depth + 1) == sel.$from.pos)
          selectAt = $pos.before(sel.$from.depth);
        else
          selectAt = $pos.before(i);
        break;
      }
    }
    if (selectAt != null) {
      updateSelection(view, NodeSelection.create(view.state.doc, selectAt), "pointer");
      return true;
    } else {
      return false;
    }
  }
  function handleSingleClick(view, pos, inside, event, selectNode) {
    return runHandlerOnContext(view, "handleClickOn", pos, inside, event) || view.someProp("handleClick", (f) => f(view, pos, event)) || (selectNode ? selectClickedNode(view, inside) : selectClickedLeaf(view, inside));
  }
  function handleDoubleClick(view, pos, inside, event) {
    return runHandlerOnContext(view, "handleDoubleClickOn", pos, inside, event) || view.someProp("handleDoubleClick", (f) => f(view, pos, event));
  }
  function handleTripleClick(view, pos, inside, event) {
    return runHandlerOnContext(view, "handleTripleClickOn", pos, inside, event) || view.someProp("handleTripleClick", (f) => f(view, pos, event)) || defaultTripleClick(view, inside, event);
  }
  function defaultTripleClick(view, inside, event) {
    if (event.button != 0)
      return false;
    let doc3 = view.state.doc;
    if (inside == -1) {
      if (doc3.inlineContent) {
        updateSelection(view, TextSelection.create(doc3, 0, doc3.content.size), "pointer");
        return true;
      }
      return false;
    }
    let $pos = doc3.resolve(inside);
    for (let i = $pos.depth + 1; i > 0; i--) {
      let node = i > $pos.depth ? $pos.nodeAfter : $pos.node(i);
      let nodePos = $pos.before(i);
      if (node.inlineContent)
        updateSelection(view, TextSelection.create(doc3, nodePos + 1, nodePos + 1 + node.content.size), "pointer");
      else if (NodeSelection.isSelectable(node))
        updateSelection(view, NodeSelection.create(doc3, nodePos), "pointer");
      else
        continue;
      return true;
    }
  }
  function forceDOMFlush(view) {
    return endComposition(view);
  }
  var selectNodeModifier = mac ? "metaKey" : "ctrlKey";
  handlers.mousedown = (view, _event) => {
    let event = _event;
    view.input.shiftKey = event.shiftKey;
    let flushed = forceDOMFlush(view);
    let now = Date.now(), type = "singleClick";
    if (now - view.input.lastClick.time < 500 && isNear(event, view.input.lastClick) && !event[selectNodeModifier]) {
      if (view.input.lastClick.type == "singleClick")
        type = "doubleClick";
      else if (view.input.lastClick.type == "doubleClick")
        type = "tripleClick";
    }
    view.input.lastClick = { time: now, x: event.clientX, y: event.clientY, type };
    let pos = view.posAtCoords(eventCoords(event));
    if (!pos)
      return;
    if (type == "singleClick") {
      if (view.input.mouseDown)
        view.input.mouseDown.done();
      view.input.mouseDown = new MouseDown(view, pos, event, !!flushed);
    } else if ((type == "doubleClick" ? handleDoubleClick : handleTripleClick)(view, pos.pos, pos.inside, event)) {
      event.preventDefault();
    } else {
      setSelectionOrigin(view, "pointer");
    }
  };
  var MouseDown = class {
    constructor(view, pos, event, flushed) {
      this.view = view;
      this.pos = pos;
      this.event = event;
      this.flushed = flushed;
      this.delayedSelectionSync = false;
      this.mightDrag = null;
      this.startDoc = view.state.doc;
      this.selectNode = !!event[selectNodeModifier];
      this.allowDefault = event.shiftKey;
      let targetNode, targetPos;
      if (pos.inside > -1) {
        targetNode = view.state.doc.nodeAt(pos.inside);
        targetPos = pos.inside;
      } else {
        let $pos = view.state.doc.resolve(pos.pos);
        targetNode = $pos.parent;
        targetPos = $pos.depth ? $pos.before() : 0;
      }
      const target = flushed ? null : event.target;
      const targetDesc = target ? view.docView.nearestDesc(target, true) : null;
      this.target = targetDesc ? targetDesc.dom : null;
      let { selection } = view.state;
      if (event.button == 0 && targetNode.type.spec.draggable && targetNode.type.spec.selectable !== false || selection instanceof NodeSelection && selection.from <= targetPos && selection.to > targetPos)
        this.mightDrag = {
          node: targetNode,
          pos: targetPos,
          addAttr: !!(this.target && !this.target.draggable),
          setUneditable: !!(this.target && gecko && !this.target.hasAttribute("contentEditable"))
        };
      if (this.target && this.mightDrag && (this.mightDrag.addAttr || this.mightDrag.setUneditable)) {
        this.view.domObserver.stop();
        if (this.mightDrag.addAttr)
          this.target.draggable = true;
        if (this.mightDrag.setUneditable)
          setTimeout(() => {
            if (this.view.input.mouseDown == this)
              this.target.setAttribute("contentEditable", "false");
          }, 20);
        this.view.domObserver.start();
      }
      view.root.addEventListener("mouseup", this.up = this.up.bind(this));
      view.root.addEventListener("mousemove", this.move = this.move.bind(this));
      setSelectionOrigin(view, "pointer");
    }
    done() {
      this.view.root.removeEventListener("mouseup", this.up);
      this.view.root.removeEventListener("mousemove", this.move);
      if (this.mightDrag && this.target) {
        this.view.domObserver.stop();
        if (this.mightDrag.addAttr)
          this.target.removeAttribute("draggable");
        if (this.mightDrag.setUneditable)
          this.target.removeAttribute("contentEditable");
        this.view.domObserver.start();
      }
      if (this.delayedSelectionSync)
        setTimeout(() => selectionToDOM(this.view));
      this.view.input.mouseDown = null;
    }
    up(event) {
      this.done();
      if (!this.view.dom.contains(event.target))
        return;
      let pos = this.pos;
      if (this.view.state.doc != this.startDoc)
        pos = this.view.posAtCoords(eventCoords(event));
      if (this.allowDefault || !pos) {
        setSelectionOrigin(this.view, "pointer");
      } else if (handleSingleClick(this.view, pos.pos, pos.inside, event, this.selectNode)) {
        event.preventDefault();
      } else if (event.button == 0 && (this.flushed || safari && this.mightDrag && !this.mightDrag.node.isAtom || chrome && !(this.view.state.selection instanceof TextSelection) && Math.min(Math.abs(pos.pos - this.view.state.selection.from), Math.abs(pos.pos - this.view.state.selection.to)) <= 2)) {
        updateSelection(this.view, Selection.near(this.view.state.doc.resolve(pos.pos)), "pointer");
        event.preventDefault();
      } else {
        setSelectionOrigin(this.view, "pointer");
      }
    }
    move(event) {
      if (!this.allowDefault && (Math.abs(this.event.x - event.clientX) > 4 || Math.abs(this.event.y - event.clientY) > 4))
        this.allowDefault = true;
      setSelectionOrigin(this.view, "pointer");
      if (event.buttons == 0)
        this.done();
    }
  };
  handlers.touchdown = (view) => {
    forceDOMFlush(view);
    setSelectionOrigin(view, "pointer");
  };
  handlers.contextmenu = (view) => forceDOMFlush(view);
  function inOrNearComposition(view, event) {
    if (view.composing)
      return true;
    if (safari && Math.abs(event.timeStamp - view.input.compositionEndedAt) < 500) {
      view.input.compositionEndedAt = -2e8;
      return true;
    }
    return false;
  }
  var timeoutComposition = android ? 5e3 : -1;
  editHandlers.compositionstart = editHandlers.compositionupdate = (view) => {
    if (!view.composing) {
      view.domObserver.flush();
      let { state } = view, $pos = state.selection.$from;
      if (state.selection.empty && (state.storedMarks || !$pos.textOffset && $pos.parentOffset && $pos.nodeBefore.marks.some((m) => m.type.spec.inclusive === false))) {
        view.markCursor = view.state.storedMarks || $pos.marks();
        endComposition(view, true);
        view.markCursor = null;
      } else {
        endComposition(view);
        if (gecko && state.selection.empty && $pos.parentOffset && !$pos.textOffset && $pos.nodeBefore.marks.length) {
          let sel = view.domSelection();
          for (let node = sel.focusNode, offset = sel.focusOffset; node && node.nodeType == 1 && offset != 0; ) {
            let before = offset < 0 ? node.lastChild : node.childNodes[offset - 1];
            if (!before)
              break;
            if (before.nodeType == 3) {
              sel.collapse(before, before.nodeValue.length);
              break;
            } else {
              node = before;
              offset = -1;
            }
          }
        }
      }
      view.input.composing = true;
    }
    scheduleComposeEnd(view, timeoutComposition);
  };
  editHandlers.compositionend = (view, event) => {
    if (view.composing) {
      view.input.composing = false;
      view.input.compositionEndedAt = event.timeStamp;
      scheduleComposeEnd(view, 20);
    }
  };
  function scheduleComposeEnd(view, delay) {
    clearTimeout(view.input.composingTimeout);
    if (delay > -1)
      view.input.composingTimeout = setTimeout(() => endComposition(view), delay);
  }
  function clearComposition(view) {
    if (view.composing) {
      view.input.composing = false;
      view.input.compositionEndedAt = timestampFromCustomEvent();
    }
    while (view.input.compositionNodes.length > 0)
      view.input.compositionNodes.pop().markParentsDirty();
  }
  function timestampFromCustomEvent() {
    let event = document.createEvent("Event");
    event.initEvent("event", true, true);
    return event.timeStamp;
  }
  function endComposition(view, forceUpdate = false) {
    if (android && view.domObserver.flushingSoon >= 0)
      return;
    view.domObserver.forceFlush();
    clearComposition(view);
    if (forceUpdate || view.docView && view.docView.dirty) {
      let sel = selectionFromDOM(view);
      if (sel && !sel.eq(view.state.selection))
        view.dispatch(view.state.tr.setSelection(sel));
      else
        view.updateState(view.state);
      return true;
    }
    return false;
  }
  function captureCopy(view, dom) {
    if (!view.dom.parentNode)
      return;
    let wrap2 = view.dom.parentNode.appendChild(document.createElement("div"));
    wrap2.appendChild(dom);
    wrap2.style.cssText = "position: fixed; left: -10000px; top: 10px";
    let sel = getSelection(), range = document.createRange();
    range.selectNodeContents(dom);
    view.dom.blur();
    sel.removeAllRanges();
    sel.addRange(range);
    setTimeout(() => {
      if (wrap2.parentNode)
        wrap2.parentNode.removeChild(wrap2);
      view.focus();
    }, 50);
  }
  var brokenClipboardAPI = ie && ie_version < 15 || ios && webkit_version < 604;
  handlers.copy = editHandlers.cut = (view, _event) => {
    let event = _event;
    let sel = view.state.selection, cut = event.type == "cut";
    if (sel.empty)
      return;
    let data = brokenClipboardAPI ? null : event.clipboardData;
    let slice2 = sel.content(), { dom, text } = serializeForClipboard(view, slice2);
    if (data) {
      event.preventDefault();
      data.clearData();
      data.setData("text/html", dom.innerHTML);
      data.setData("text/plain", text);
    } else {
      captureCopy(view, dom);
    }
    if (cut)
      view.dispatch(view.state.tr.deleteSelection().scrollIntoView().setMeta("uiEvent", "cut"));
  };
  function sliceSingleNode(slice2) {
    return slice2.openStart == 0 && slice2.openEnd == 0 && slice2.content.childCount == 1 ? slice2.content.firstChild : null;
  }
  function capturePaste(view, event) {
    if (!view.dom.parentNode)
      return;
    let plainText = view.input.shiftKey || view.state.selection.$from.parent.type.spec.code;
    let target = view.dom.parentNode.appendChild(document.createElement(plainText ? "textarea" : "div"));
    if (!plainText)
      target.contentEditable = "true";
    target.style.cssText = "position: fixed; left: -10000px; top: 10px";
    target.focus();
    setTimeout(() => {
      view.focus();
      if (target.parentNode)
        target.parentNode.removeChild(target);
      if (plainText)
        doPaste(view, target.value, null, event);
      else
        doPaste(view, target.textContent, target.innerHTML, event);
    }, 50);
  }
  function doPaste(view, text, html, event) {
    let slice2 = parseFromClipboard(view, text, html, view.input.shiftKey, view.state.selection.$from);
    if (view.someProp("handlePaste", (f) => f(view, event, slice2 || Slice.empty)))
      return true;
    if (!slice2)
      return false;
    let singleNode = sliceSingleNode(slice2);
    let tr = singleNode ? view.state.tr.replaceSelectionWith(singleNode, view.input.shiftKey) : view.state.tr.replaceSelection(slice2);
    view.dispatch(tr.scrollIntoView().setMeta("paste", true).setMeta("uiEvent", "paste"));
    return true;
  }
  editHandlers.paste = (view, _event) => {
    let event = _event;
    if (view.composing && !android)
      return;
    let data = brokenClipboardAPI ? null : event.clipboardData;
    if (data && doPaste(view, data.getData("text/plain"), data.getData("text/html"), event))
      event.preventDefault();
    else
      capturePaste(view, event);
  };
  var Dragging = class {
    constructor(slice2, move) {
      this.slice = slice2;
      this.move = move;
    }
  };
  var dragCopyModifier = mac ? "altKey" : "ctrlKey";
  handlers.dragstart = (view, _event) => {
    let event = _event;
    let mouseDown = view.input.mouseDown;
    if (mouseDown)
      mouseDown.done();
    if (!event.dataTransfer)
      return;
    let sel = view.state.selection;
    let pos = sel.empty ? null : view.posAtCoords(eventCoords(event));
    if (pos && pos.pos >= sel.from && pos.pos <= (sel instanceof NodeSelection ? sel.to - 1 : sel.to))
      ;
    else if (mouseDown && mouseDown.mightDrag) {
      view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, mouseDown.mightDrag.pos)));
    } else if (event.target && event.target.nodeType == 1) {
      let desc = view.docView.nearestDesc(event.target, true);
      if (desc && desc.node.type.spec.draggable && desc != view.docView)
        view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, desc.posBefore)));
    }
    let slice2 = view.state.selection.content(), { dom, text } = serializeForClipboard(view, slice2);
    event.dataTransfer.clearData();
    event.dataTransfer.setData(brokenClipboardAPI ? "Text" : "text/html", dom.innerHTML);
    event.dataTransfer.effectAllowed = "copyMove";
    if (!brokenClipboardAPI)
      event.dataTransfer.setData("text/plain", text);
    view.dragging = new Dragging(slice2, !event[dragCopyModifier]);
  };
  handlers.dragend = (view) => {
    let dragging = view.dragging;
    window.setTimeout(() => {
      if (view.dragging == dragging)
        view.dragging = null;
    }, 50);
  };
  editHandlers.dragover = editHandlers.dragenter = (_, e) => e.preventDefault();
  editHandlers.drop = (view, _event) => {
    let event = _event;
    let dragging = view.dragging;
    view.dragging = null;
    if (!event.dataTransfer)
      return;
    let eventPos = view.posAtCoords(eventCoords(event));
    if (!eventPos)
      return;
    let $mouse = view.state.doc.resolve(eventPos.pos);
    if (!$mouse)
      return;
    let slice2 = dragging && dragging.slice;
    if (slice2) {
      view.someProp("transformPasted", (f) => {
        slice2 = f(slice2);
      });
    } else {
      slice2 = parseFromClipboard(view, event.dataTransfer.getData(brokenClipboardAPI ? "Text" : "text/plain"), brokenClipboardAPI ? null : event.dataTransfer.getData("text/html"), false, $mouse);
    }
    let move = !!(dragging && !event[dragCopyModifier]);
    if (view.someProp("handleDrop", (f) => f(view, event, slice2 || Slice.empty, move))) {
      event.preventDefault();
      return;
    }
    if (!slice2)
      return;
    event.preventDefault();
    let insertPos = slice2 ? dropPoint(view.state.doc, $mouse.pos, slice2) : $mouse.pos;
    if (insertPos == null)
      insertPos = $mouse.pos;
    let tr = view.state.tr;
    if (move)
      tr.deleteSelection();
    let pos = tr.mapping.map(insertPos);
    let isNode = slice2.openStart == 0 && slice2.openEnd == 0 && slice2.content.childCount == 1;
    let beforeInsert = tr.doc;
    if (isNode)
      tr.replaceRangeWith(pos, pos, slice2.content.firstChild);
    else
      tr.replaceRange(pos, pos, slice2);
    if (tr.doc.eq(beforeInsert))
      return;
    let $pos = tr.doc.resolve(pos);
    if (isNode && NodeSelection.isSelectable(slice2.content.firstChild) && $pos.nodeAfter && $pos.nodeAfter.sameMarkup(slice2.content.firstChild)) {
      tr.setSelection(new NodeSelection($pos));
    } else {
      let end = tr.mapping.map(insertPos);
      tr.mapping.maps[tr.mapping.maps.length - 1].forEach((_from, _to, _newFrom, newTo) => end = newTo);
      tr.setSelection(selectionBetween(view, $pos, tr.doc.resolve(end)));
    }
    view.focus();
    view.dispatch(tr.setMeta("uiEvent", "drop"));
  };
  handlers.focus = (view) => {
    if (!view.focused) {
      view.domObserver.stop();
      view.dom.classList.add("ProseMirror-focused");
      view.domObserver.start();
      view.focused = true;
      setTimeout(() => {
        if (view.docView && view.hasFocus() && !view.domObserver.currentSelection.eq(view.domSelection()))
          selectionToDOM(view);
      }, 20);
    }
  };
  handlers.blur = (view, _event) => {
    let event = _event;
    if (view.focused) {
      view.domObserver.stop();
      view.dom.classList.remove("ProseMirror-focused");
      view.domObserver.start();
      if (event.relatedTarget && view.dom.contains(event.relatedTarget))
        view.domObserver.currentSelection.clear();
      view.focused = false;
    }
  };
  handlers.beforeinput = (view, _event) => {
    let event = _event;
    if (chrome && android && event.inputType == "deleteContentBackward") {
      view.domObserver.flushSoon();
      let { domChangeCount } = view.input;
      setTimeout(() => {
        if (view.input.domChangeCount != domChangeCount)
          return;
        view.dom.blur();
        view.focus();
        if (view.someProp("handleKeyDown", (f) => f(view, keyEvent(8, "Backspace"))))
          return;
        let { $cursor } = view.state.selection;
        if ($cursor && $cursor.pos > 0)
          view.dispatch(view.state.tr.delete($cursor.pos - 1, $cursor.pos).scrollIntoView());
      }, 50);
    }
  };
  for (let prop in editHandlers)
    handlers[prop] = editHandlers[prop];
  function compareObjs(a, b) {
    if (a == b)
      return true;
    for (let p in a)
      if (a[p] !== b[p])
        return false;
    for (let p in b)
      if (!(p in a))
        return false;
    return true;
  }
  var WidgetType = class {
    constructor(toDOM, spec) {
      this.toDOM = toDOM;
      this.spec = spec || noSpec;
      this.side = this.spec.side || 0;
    }
    map(mapping, span, offset, oldOffset) {
      let { pos, deleted } = mapping.mapResult(span.from + oldOffset, this.side < 0 ? -1 : 1);
      return deleted ? null : new Decoration(pos - offset, pos - offset, this);
    }
    valid() {
      return true;
    }
    eq(other) {
      return this == other || other instanceof WidgetType && (this.spec.key && this.spec.key == other.spec.key || this.toDOM == other.toDOM && compareObjs(this.spec, other.spec));
    }
    destroy(node) {
      if (this.spec.destroy)
        this.spec.destroy(node);
    }
  };
  var InlineType = class {
    constructor(attrs, spec) {
      this.attrs = attrs;
      this.spec = spec || noSpec;
    }
    map(mapping, span, offset, oldOffset) {
      let from2 = mapping.map(span.from + oldOffset, this.spec.inclusiveStart ? -1 : 1) - offset;
      let to = mapping.map(span.to + oldOffset, this.spec.inclusiveEnd ? 1 : -1) - offset;
      return from2 >= to ? null : new Decoration(from2, to, this);
    }
    valid(_, span) {
      return span.from < span.to;
    }
    eq(other) {
      return this == other || other instanceof InlineType && compareObjs(this.attrs, other.attrs) && compareObjs(this.spec, other.spec);
    }
    static is(span) {
      return span.type instanceof InlineType;
    }
    destroy() {
    }
  };
  var NodeType2 = class {
    constructor(attrs, spec) {
      this.attrs = attrs;
      this.spec = spec || noSpec;
    }
    map(mapping, span, offset, oldOffset) {
      let from2 = mapping.mapResult(span.from + oldOffset, 1);
      if (from2.deleted)
        return null;
      let to = mapping.mapResult(span.to + oldOffset, -1);
      if (to.deleted || to.pos <= from2.pos)
        return null;
      return new Decoration(from2.pos - offset, to.pos - offset, this);
    }
    valid(node, span) {
      let { index, offset } = node.content.findIndex(span.from), child;
      return offset == span.from && !(child = node.child(index)).isText && offset + child.nodeSize == span.to;
    }
    eq(other) {
      return this == other || other instanceof NodeType2 && compareObjs(this.attrs, other.attrs) && compareObjs(this.spec, other.spec);
    }
    destroy() {
    }
  };
  var Decoration = class {
    constructor(from2, to, type) {
      this.from = from2;
      this.to = to;
      this.type = type;
    }
    copy(from2, to) {
      return new Decoration(from2, to, this.type);
    }
    eq(other, offset = 0) {
      return this.type.eq(other.type) && this.from + offset == other.from && this.to + offset == other.to;
    }
    map(mapping, offset, oldOffset) {
      return this.type.map(mapping, this, offset, oldOffset);
    }
    static widget(pos, toDOM, spec) {
      return new Decoration(pos, pos, new WidgetType(toDOM, spec));
    }
    static inline(from2, to, attrs, spec) {
      return new Decoration(from2, to, new InlineType(attrs, spec));
    }
    static node(from2, to, attrs, spec) {
      return new Decoration(from2, to, new NodeType2(attrs, spec));
    }
    get spec() {
      return this.type.spec;
    }
    get inline() {
      return this.type instanceof InlineType;
    }
  };
  var none = [];
  var noSpec = {};
  var DecorationSet = class {
    constructor(local, children) {
      this.local = local.length ? local : none;
      this.children = children.length ? children : none;
    }
    static create(doc3, decorations) {
      return decorations.length ? buildTree(decorations, doc3, 0, noSpec) : empty;
    }
    find(start, end, predicate) {
      let result = [];
      this.findInner(start == null ? 0 : start, end == null ? 1e9 : end, result, 0, predicate);
      return result;
    }
    findInner(start, end, result, offset, predicate) {
      for (let i = 0; i < this.local.length; i++) {
        let span = this.local[i];
        if (span.from <= end && span.to >= start && (!predicate || predicate(span.spec)))
          result.push(span.copy(span.from + offset, span.to + offset));
      }
      for (let i = 0; i < this.children.length; i += 3) {
        if (this.children[i] < end && this.children[i + 1] > start) {
          let childOff = this.children[i] + 1;
          this.children[i + 2].findInner(start - childOff, end - childOff, result, offset + childOff, predicate);
        }
      }
    }
    map(mapping, doc3, options) {
      if (this == empty || mapping.maps.length == 0)
        return this;
      return this.mapInner(mapping, doc3, 0, 0, options || noSpec);
    }
    mapInner(mapping, node, offset, oldOffset, options) {
      let newLocal;
      for (let i = 0; i < this.local.length; i++) {
        let mapped = this.local[i].map(mapping, offset, oldOffset);
        if (mapped && mapped.type.valid(node, mapped))
          (newLocal || (newLocal = [])).push(mapped);
        else if (options.onRemove)
          options.onRemove(this.local[i].spec);
      }
      if (this.children.length)
        return mapChildren(this.children, newLocal || [], mapping, node, offset, oldOffset, options);
      else
        return newLocal ? new DecorationSet(newLocal.sort(byPos), none) : empty;
    }
    add(doc3, decorations) {
      if (!decorations.length)
        return this;
      if (this == empty)
        return DecorationSet.create(doc3, decorations);
      return this.addInner(doc3, decorations, 0);
    }
    addInner(doc3, decorations, offset) {
      let children, childIndex = 0;
      doc3.forEach((childNode, childOffset) => {
        let baseOffset = childOffset + offset, found2;
        if (!(found2 = takeSpansForNode(decorations, childNode, baseOffset)))
          return;
        if (!children)
          children = this.children.slice();
        while (childIndex < children.length && children[childIndex] < childOffset)
          childIndex += 3;
        if (children[childIndex] == childOffset)
          children[childIndex + 2] = children[childIndex + 2].addInner(childNode, found2, baseOffset + 1);
        else
          children.splice(childIndex, 0, childOffset, childOffset + childNode.nodeSize, buildTree(found2, childNode, baseOffset + 1, noSpec));
        childIndex += 3;
      });
      let local = moveSpans(childIndex ? withoutNulls(decorations) : decorations, -offset);
      for (let i = 0; i < local.length; i++)
        if (!local[i].type.valid(doc3, local[i]))
          local.splice(i--, 1);
      return new DecorationSet(local.length ? this.local.concat(local).sort(byPos) : this.local, children || this.children);
    }
    remove(decorations) {
      if (decorations.length == 0 || this == empty)
        return this;
      return this.removeInner(decorations, 0);
    }
    removeInner(decorations, offset) {
      let children = this.children, local = this.local;
      for (let i = 0; i < children.length; i += 3) {
        let found2;
        let from2 = children[i] + offset, to = children[i + 1] + offset;
        for (let j = 0, span; j < decorations.length; j++)
          if (span = decorations[j]) {
            if (span.from > from2 && span.to < to) {
              decorations[j] = null;
              (found2 || (found2 = [])).push(span);
            }
          }
        if (!found2)
          continue;
        if (children == this.children)
          children = this.children.slice();
        let removed = children[i + 2].removeInner(found2, from2 + 1);
        if (removed != empty) {
          children[i + 2] = removed;
        } else {
          children.splice(i, 3);
          i -= 3;
        }
      }
      if (local.length) {
        for (let i = 0, span; i < decorations.length; i++)
          if (span = decorations[i]) {
            for (let j = 0; j < local.length; j++)
              if (local[j].eq(span, offset)) {
                if (local == this.local)
                  local = this.local.slice();
                local.splice(j--, 1);
              }
          }
      }
      if (children == this.children && local == this.local)
        return this;
      return local.length || children.length ? new DecorationSet(local, children) : empty;
    }
    forChild(offset, node) {
      if (this == empty)
        return this;
      if (node.isLeaf)
        return DecorationSet.empty;
      let child, local;
      for (let i = 0; i < this.children.length; i += 3)
        if (this.children[i] >= offset) {
          if (this.children[i] == offset)
            child = this.children[i + 2];
          break;
        }
      let start = offset + 1, end = start + node.content.size;
      for (let i = 0; i < this.local.length; i++) {
        let dec = this.local[i];
        if (dec.from < end && dec.to > start && dec.type instanceof InlineType) {
          let from2 = Math.max(start, dec.from) - start, to = Math.min(end, dec.to) - start;
          if (from2 < to)
            (local || (local = [])).push(dec.copy(from2, to));
        }
      }
      if (local) {
        let localSet = new DecorationSet(local.sort(byPos), none);
        return child ? new DecorationGroup([localSet, child]) : localSet;
      }
      return child || empty;
    }
    eq(other) {
      if (this == other)
        return true;
      if (!(other instanceof DecorationSet) || this.local.length != other.local.length || this.children.length != other.children.length)
        return false;
      for (let i = 0; i < this.local.length; i++)
        if (!this.local[i].eq(other.local[i]))
          return false;
      for (let i = 0; i < this.children.length; i += 3)
        if (this.children[i] != other.children[i] || this.children[i + 1] != other.children[i + 1] || !this.children[i + 2].eq(other.children[i + 2]))
          return false;
      return true;
    }
    locals(node) {
      return removeOverlap(this.localsInner(node));
    }
    localsInner(node) {
      if (this == empty)
        return none;
      if (node.inlineContent || !this.local.some(InlineType.is))
        return this.local;
      let result = [];
      for (let i = 0; i < this.local.length; i++) {
        if (!(this.local[i].type instanceof InlineType))
          result.push(this.local[i]);
      }
      return result;
    }
  };
  DecorationSet.empty = new DecorationSet([], []);
  DecorationSet.removeOverlap = removeOverlap;
  var empty = DecorationSet.empty;
  var DecorationGroup = class {
    constructor(members) {
      this.members = members;
    }
    map(mapping, doc3) {
      const mappedDecos = this.members.map((member) => member.map(mapping, doc3, noSpec));
      return DecorationGroup.from(mappedDecos);
    }
    forChild(offset, child) {
      if (child.isLeaf)
        return DecorationSet.empty;
      let found2 = [];
      for (let i = 0; i < this.members.length; i++) {
        let result = this.members[i].forChild(offset, child);
        if (result == empty)
          continue;
        if (result instanceof DecorationGroup)
          found2 = found2.concat(result.members);
        else
          found2.push(result);
      }
      return DecorationGroup.from(found2);
    }
    eq(other) {
      if (!(other instanceof DecorationGroup) || other.members.length != this.members.length)
        return false;
      for (let i = 0; i < this.members.length; i++)
        if (!this.members[i].eq(other.members[i]))
          return false;
      return true;
    }
    locals(node) {
      let result, sorted = true;
      for (let i = 0; i < this.members.length; i++) {
        let locals = this.members[i].localsInner(node);
        if (!locals.length)
          continue;
        if (!result) {
          result = locals;
        } else {
          if (sorted) {
            result = result.slice();
            sorted = false;
          }
          for (let j = 0; j < locals.length; j++)
            result.push(locals[j]);
        }
      }
      return result ? removeOverlap(sorted ? result : result.sort(byPos)) : none;
    }
    static from(members) {
      switch (members.length) {
        case 0:
          return empty;
        case 1:
          return members[0];
        default:
          return new DecorationGroup(members);
      }
    }
  };
  function mapChildren(oldChildren, newLocal, mapping, node, offset, oldOffset, options) {
    let children = oldChildren.slice();
    let shift2 = (oldStart, oldEnd, newStart, newEnd) => {
      for (let i = 0; i < children.length; i += 3) {
        let end = children[i + 1], dSize;
        if (end < 0 || oldStart > end + oldOffset)
          continue;
        let start = children[i] + oldOffset;
        if (oldEnd >= start) {
          children[i + 1] = oldStart <= start ? -2 : -1;
        } else if (newStart >= offset && (dSize = newEnd - newStart - (oldEnd - oldStart))) {
          children[i] += dSize;
          children[i + 1] += dSize;
        }
      }
    };
    for (let i = 0; i < mapping.maps.length; i++)
      mapping.maps[i].forEach(shift2);
    let mustRebuild = false;
    for (let i = 0; i < children.length; i += 3)
      if (children[i + 1] < 0) {
        if (children[i + 1] == -2) {
          mustRebuild = true;
          children[i + 1] = -1;
          continue;
        }
        let from2 = mapping.map(oldChildren[i] + oldOffset), fromLocal = from2 - offset;
        if (fromLocal < 0 || fromLocal >= node.content.size) {
          mustRebuild = true;
          continue;
        }
        let to = mapping.map(oldChildren[i + 1] + oldOffset, -1), toLocal = to - offset;
        let { index, offset: childOffset } = node.content.findIndex(fromLocal);
        let childNode = node.maybeChild(index);
        if (childNode && childOffset == fromLocal && childOffset + childNode.nodeSize == toLocal) {
          let mapped = children[i + 2].mapInner(mapping, childNode, from2 + 1, oldChildren[i] + oldOffset + 1, options);
          if (mapped != empty) {
            children[i] = fromLocal;
            children[i + 1] = toLocal;
            children[i + 2] = mapped;
          } else {
            children[i + 1] = -2;
            mustRebuild = true;
          }
        } else {
          mustRebuild = true;
        }
      }
    if (mustRebuild) {
      let decorations = mapAndGatherRemainingDecorations(children, oldChildren, newLocal, mapping, offset, oldOffset, options);
      let built = buildTree(decorations, node, 0, options);
      newLocal = built.local;
      for (let i = 0; i < children.length; i += 3)
        if (children[i + 1] < 0) {
          children.splice(i, 3);
          i -= 3;
        }
      for (let i = 0, j = 0; i < built.children.length; i += 3) {
        let from2 = built.children[i];
        while (j < children.length && children[j] < from2)
          j += 3;
        children.splice(j, 0, built.children[i], built.children[i + 1], built.children[i + 2]);
      }
    }
    return new DecorationSet(newLocal.sort(byPos), children);
  }
  function moveSpans(spans, offset) {
    if (!offset || !spans.length)
      return spans;
    let result = [];
    for (let i = 0; i < spans.length; i++) {
      let span = spans[i];
      result.push(new Decoration(span.from + offset, span.to + offset, span.type));
    }
    return result;
  }
  function mapAndGatherRemainingDecorations(children, oldChildren, decorations, mapping, offset, oldOffset, options) {
    function gather(set, oldOffset2) {
      for (let i = 0; i < set.local.length; i++) {
        let mapped = set.local[i].map(mapping, offset, oldOffset2);
        if (mapped)
          decorations.push(mapped);
        else if (options.onRemove)
          options.onRemove(set.local[i].spec);
      }
      for (let i = 0; i < set.children.length; i += 3)
        gather(set.children[i + 2], set.children[i] + oldOffset2 + 1);
    }
    for (let i = 0; i < children.length; i += 3)
      if (children[i + 1] == -1)
        gather(children[i + 2], oldChildren[i] + oldOffset + 1);
    return decorations;
  }
  function takeSpansForNode(spans, node, offset) {
    if (node.isLeaf)
      return null;
    let end = offset + node.nodeSize, found2 = null;
    for (let i = 0, span; i < spans.length; i++) {
      if ((span = spans[i]) && span.from > offset && span.to < end) {
        (found2 || (found2 = [])).push(span);
        spans[i] = null;
      }
    }
    return found2;
  }
  function withoutNulls(array) {
    let result = [];
    for (let i = 0; i < array.length; i++)
      if (array[i] != null)
        result.push(array[i]);
    return result;
  }
  function buildTree(spans, node, offset, options) {
    let children = [], hasNulls = false;
    node.forEach((childNode, localStart) => {
      let found2 = takeSpansForNode(spans, childNode, localStart + offset);
      if (found2) {
        hasNulls = true;
        let subtree = buildTree(found2, childNode, offset + localStart + 1, options);
        if (subtree != empty)
          children.push(localStart, localStart + childNode.nodeSize, subtree);
      }
    });
    let locals = moveSpans(hasNulls ? withoutNulls(spans) : spans, -offset).sort(byPos);
    for (let i = 0; i < locals.length; i++)
      if (!locals[i].type.valid(node, locals[i])) {
        if (options.onRemove)
          options.onRemove(locals[i].spec);
        locals.splice(i--, 1);
      }
    return locals.length || children.length ? new DecorationSet(locals, children) : empty;
  }
  function byPos(a, b) {
    return a.from - b.from || a.to - b.to;
  }
  function removeOverlap(spans) {
    let working = spans;
    for (let i = 0; i < working.length - 1; i++) {
      let span = working[i];
      if (span.from != span.to)
        for (let j = i + 1; j < working.length; j++) {
          let next = working[j];
          if (next.from == span.from) {
            if (next.to != span.to) {
              if (working == spans)
                working = spans.slice();
              working[j] = next.copy(next.from, span.to);
              insertAhead(working, j + 1, next.copy(span.to, next.to));
            }
            continue;
          } else {
            if (next.from < span.to) {
              if (working == spans)
                working = spans.slice();
              working[i] = span.copy(span.from, next.from);
              insertAhead(working, j, span.copy(next.from, span.to));
            }
            break;
          }
        }
    }
    return working;
  }
  function insertAhead(array, i, deco) {
    while (i < array.length && byPos(deco, array[i]) > 0)
      i++;
    array.splice(i, 0, deco);
  }
  function viewDecorations(view) {
    let found2 = [];
    view.someProp("decorations", (f) => {
      let result = f(view.state);
      if (result && result != empty)
        found2.push(result);
    });
    if (view.cursorWrapper)
      found2.push(DecorationSet.create(view.state.doc, [view.cursorWrapper.deco]));
    return DecorationGroup.from(found2);
  }
  var observeOptions = {
    childList: true,
    characterData: true,
    characterDataOldValue: true,
    attributes: true,
    attributeOldValue: true,
    subtree: true
  };
  var useCharData = ie && ie_version <= 11;
  var SelectionState = class {
    constructor() {
      this.anchorNode = null;
      this.anchorOffset = 0;
      this.focusNode = null;
      this.focusOffset = 0;
    }
    set(sel) {
      this.anchorNode = sel.anchorNode;
      this.anchorOffset = sel.anchorOffset;
      this.focusNode = sel.focusNode;
      this.focusOffset = sel.focusOffset;
    }
    clear() {
      this.anchorNode = this.focusNode = null;
    }
    eq(sel) {
      return sel.anchorNode == this.anchorNode && sel.anchorOffset == this.anchorOffset && sel.focusNode == this.focusNode && sel.focusOffset == this.focusOffset;
    }
  };
  var DOMObserver = class {
    constructor(view, handleDOMChange) {
      this.view = view;
      this.handleDOMChange = handleDOMChange;
      this.queue = [];
      this.flushingSoon = -1;
      this.observer = null;
      this.currentSelection = new SelectionState();
      this.onCharData = null;
      this.suppressingSelectionUpdates = false;
      this.observer = window.MutationObserver && new window.MutationObserver((mutations) => {
        for (let i = 0; i < mutations.length; i++)
          this.queue.push(mutations[i]);
        if (ie && ie_version <= 11 && mutations.some((m) => m.type == "childList" && m.removedNodes.length || m.type == "characterData" && m.oldValue.length > m.target.nodeValue.length))
          this.flushSoon();
        else
          this.flush();
      });
      if (useCharData) {
        this.onCharData = (e) => {
          this.queue.push({ target: e.target, type: "characterData", oldValue: e.prevValue });
          this.flushSoon();
        };
      }
      this.onSelectionChange = this.onSelectionChange.bind(this);
    }
    flushSoon() {
      if (this.flushingSoon < 0)
        this.flushingSoon = window.setTimeout(() => {
          this.flushingSoon = -1;
          this.flush();
        }, 20);
    }
    forceFlush() {
      if (this.flushingSoon > -1) {
        window.clearTimeout(this.flushingSoon);
        this.flushingSoon = -1;
        this.flush();
      }
    }
    start() {
      if (this.observer)
        this.observer.observe(this.view.dom, observeOptions);
      if (this.onCharData)
        this.view.dom.addEventListener("DOMCharacterDataModified", this.onCharData);
      this.connectSelection();
    }
    stop() {
      if (this.observer) {
        let take = this.observer.takeRecords();
        if (take.length) {
          for (let i = 0; i < take.length; i++)
            this.queue.push(take[i]);
          window.setTimeout(() => this.flush(), 20);
        }
        this.observer.disconnect();
      }
      if (this.onCharData)
        this.view.dom.removeEventListener("DOMCharacterDataModified", this.onCharData);
      this.disconnectSelection();
    }
    connectSelection() {
      this.view.dom.ownerDocument.addEventListener("selectionchange", this.onSelectionChange);
    }
    disconnectSelection() {
      this.view.dom.ownerDocument.removeEventListener("selectionchange", this.onSelectionChange);
    }
    suppressSelectionUpdates() {
      this.suppressingSelectionUpdates = true;
      setTimeout(() => this.suppressingSelectionUpdates = false, 50);
    }
    onSelectionChange() {
      if (!hasFocusAndSelection(this.view))
        return;
      if (this.suppressingSelectionUpdates)
        return selectionToDOM(this.view);
      if (ie && ie_version <= 11 && !this.view.state.selection.empty) {
        let sel = this.view.domSelection();
        if (sel.focusNode && isEquivalentPosition(sel.focusNode, sel.focusOffset, sel.anchorNode, sel.anchorOffset))
          return this.flushSoon();
      }
      this.flush();
    }
    setCurSelection() {
      this.currentSelection.set(this.view.domSelection());
    }
    ignoreSelectionChange(sel) {
      if (sel.rangeCount == 0)
        return true;
      let container = sel.getRangeAt(0).commonAncestorContainer;
      let desc = this.view.docView.nearestDesc(container);
      if (desc && desc.ignoreMutation({
        type: "selection",
        target: container.nodeType == 3 ? container.parentNode : container
      })) {
        this.setCurSelection();
        return true;
      }
    }
    flush() {
      if (!this.view.docView || this.flushingSoon > -1)
        return;
      let mutations = this.observer ? this.observer.takeRecords() : [];
      if (this.queue.length) {
        mutations = this.queue.concat(mutations);
        this.queue.length = 0;
      }
      let sel = this.view.domSelection();
      let newSel = !this.suppressingSelectionUpdates && !this.currentSelection.eq(sel) && hasFocusAndSelection(this.view) && !this.ignoreSelectionChange(sel);
      let from2 = -1, to = -1, typeOver = false, added = [];
      if (this.view.editable) {
        for (let i = 0; i < mutations.length; i++) {
          let result = this.registerMutation(mutations[i], added);
          if (result) {
            from2 = from2 < 0 ? result.from : Math.min(result.from, from2);
            to = to < 0 ? result.to : Math.max(result.to, to);
            if (result.typeOver)
              typeOver = true;
          }
        }
      }
      if (gecko && added.length > 1) {
        let brs = added.filter((n) => n.nodeName == "BR");
        if (brs.length == 2) {
          let a = brs[0], b = brs[1];
          if (a.parentNode && a.parentNode.parentNode == b.parentNode)
            b.remove();
          else
            a.remove();
        }
      }
      if (from2 > -1 || newSel) {
        if (from2 > -1) {
          this.view.docView.markDirty(from2, to);
          checkCSS(this.view);
        }
        this.handleDOMChange(from2, to, typeOver, added);
        if (this.view.docView && this.view.docView.dirty)
          this.view.updateState(this.view.state);
        else if (!this.currentSelection.eq(sel))
          selectionToDOM(this.view);
        this.currentSelection.set(sel);
      }
    }
    registerMutation(mut, added) {
      if (added.indexOf(mut.target) > -1)
        return null;
      let desc = this.view.docView.nearestDesc(mut.target);
      if (mut.type == "attributes" && (desc == this.view.docView || mut.attributeName == "contenteditable" || mut.attributeName == "style" && !mut.oldValue && !mut.target.getAttribute("style")))
        return null;
      if (!desc || desc.ignoreMutation(mut))
        return null;
      if (mut.type == "childList") {
        for (let i = 0; i < mut.addedNodes.length; i++)
          added.push(mut.addedNodes[i]);
        if (desc.contentDOM && desc.contentDOM != desc.dom && !desc.contentDOM.contains(mut.target))
          return { from: desc.posBefore, to: desc.posAfter };
        let prev = mut.previousSibling, next = mut.nextSibling;
        if (ie && ie_version <= 11 && mut.addedNodes.length) {
          for (let i = 0; i < mut.addedNodes.length; i++) {
            let { previousSibling, nextSibling } = mut.addedNodes[i];
            if (!previousSibling || Array.prototype.indexOf.call(mut.addedNodes, previousSibling) < 0)
              prev = previousSibling;
            if (!nextSibling || Array.prototype.indexOf.call(mut.addedNodes, nextSibling) < 0)
              next = nextSibling;
          }
        }
        let fromOffset = prev && prev.parentNode == mut.target ? domIndex(prev) + 1 : 0;
        let from2 = desc.localPosFromDOM(mut.target, fromOffset, -1);
        let toOffset = next && next.parentNode == mut.target ? domIndex(next) : mut.target.childNodes.length;
        let to = desc.localPosFromDOM(mut.target, toOffset, 1);
        return { from: from2, to };
      } else if (mut.type == "attributes") {
        return { from: desc.posAtStart - desc.border, to: desc.posAtEnd + desc.border };
      } else {
        return {
          from: desc.posAtStart,
          to: desc.posAtEnd,
          typeOver: mut.target.nodeValue == mut.oldValue
        };
      }
    }
  };
  var cssChecked = false;
  function checkCSS(view) {
    if (cssChecked)
      return;
    cssChecked = true;
    if (getComputedStyle(view.dom).whiteSpace == "normal")
      console["warn"]("ProseMirror expects the CSS white-space property to be set, preferably to 'pre-wrap'. It is recommended to load style/prosemirror.css from the prosemirror-view package.");
  }
  function parseBetween(view, from_, to_) {
    let { node: parent, fromOffset, toOffset, from: from2, to } = view.docView.parseRange(from_, to_);
    let domSel = view.domSelection();
    let find;
    let anchor = domSel.anchorNode;
    if (anchor && view.dom.contains(anchor.nodeType == 1 ? anchor : anchor.parentNode)) {
      find = [{ node: anchor, offset: domSel.anchorOffset }];
      if (!selectionCollapsed(domSel))
        find.push({ node: domSel.focusNode, offset: domSel.focusOffset });
    }
    if (chrome && view.input.lastKeyCode === 8) {
      for (let off = toOffset; off > fromOffset; off--) {
        let node = parent.childNodes[off - 1], desc = node.pmViewDesc;
        if (node.nodeName == "BR" && !desc) {
          toOffset = off;
          break;
        }
        if (!desc || desc.size)
          break;
      }
    }
    let startDoc = view.state.doc;
    let parser = view.someProp("domParser") || DOMParser.fromSchema(view.state.schema);
    let $from = startDoc.resolve(from2);
    let sel = null, doc3 = parser.parse(parent, {
      topNode: $from.parent,
      topMatch: $from.parent.contentMatchAt($from.index()),
      topOpen: true,
      from: fromOffset,
      to: toOffset,
      preserveWhitespace: $from.parent.type.whitespace == "pre" ? "full" : true,
      findPositions: find,
      ruleFromNode,
      context: $from
    });
    if (find && find[0].pos != null) {
      let anchor2 = find[0].pos, head = find[1] && find[1].pos;
      if (head == null)
        head = anchor2;
      sel = { anchor: anchor2 + from2, head: head + from2 };
    }
    return { doc: doc3, sel, from: from2, to };
  }
  function ruleFromNode(dom) {
    let desc = dom.pmViewDesc;
    if (desc) {
      return desc.parseRule();
    } else if (dom.nodeName == "BR" && dom.parentNode) {
      if (safari && /^(ul|ol)$/i.test(dom.parentNode.nodeName)) {
        let skip = document.createElement("div");
        skip.appendChild(document.createElement("li"));
        return { skip };
      } else if (dom.parentNode.lastChild == dom || safari && /^(tr|table)$/i.test(dom.parentNode.nodeName)) {
        return { ignore: true };
      }
    } else if (dom.nodeName == "IMG" && dom.getAttribute("mark-placeholder")) {
      return { ignore: true };
    }
    return null;
  }
  function readDOMChange(view, from2, to, typeOver, addedNodes) {
    if (from2 < 0) {
      let origin = view.input.lastSelectionTime > Date.now() - 50 ? view.input.lastSelectionOrigin : null;
      let newSel = selectionFromDOM(view, origin);
      if (newSel && !view.state.selection.eq(newSel)) {
        let tr2 = view.state.tr.setSelection(newSel);
        if (origin == "pointer")
          tr2.setMeta("pointer", true);
        else if (origin == "key")
          tr2.scrollIntoView();
        view.dispatch(tr2);
      }
      return;
    }
    let $before = view.state.doc.resolve(from2);
    let shared = $before.sharedDepth(to);
    from2 = $before.before(shared + 1);
    to = view.state.doc.resolve(to).after(shared + 1);
    let sel = view.state.selection;
    let parse = parseBetween(view, from2, to);
    if (chrome && view.cursorWrapper && parse.sel && parse.sel.anchor == view.cursorWrapper.deco.from) {
      let text = view.cursorWrapper.deco.type.toDOM.nextSibling;
      let size = text && text.nodeValue ? text.nodeValue.length : 1;
      parse.sel = { anchor: parse.sel.anchor + size, head: parse.sel.anchor + size };
    }
    let doc3 = view.state.doc, compare = doc3.slice(parse.from, parse.to);
    let preferredPos, preferredSide;
    if (view.input.lastKeyCode === 8 && Date.now() - 100 < view.input.lastKeyCodeTime) {
      preferredPos = view.state.selection.to;
      preferredSide = "end";
    } else {
      preferredPos = view.state.selection.from;
      preferredSide = "start";
    }
    view.input.lastKeyCode = null;
    let change = findDiff(compare.content, parse.doc.content, parse.from, preferredPos, preferredSide);
    if ((ios && view.input.lastIOSEnter > Date.now() - 225 || android) && addedNodes.some((n) => n.nodeName == "DIV" || n.nodeName == "P") && (!change || change.endA >= change.endB) && view.someProp("handleKeyDown", (f) => f(view, keyEvent(13, "Enter")))) {
      view.input.lastIOSEnter = 0;
      return;
    }
    if (!change) {
      if (typeOver && sel instanceof TextSelection && !sel.empty && sel.$head.sameParent(sel.$anchor) && !view.composing && !(parse.sel && parse.sel.anchor != parse.sel.head)) {
        change = { start: sel.from, endA: sel.to, endB: sel.to };
      } else {
        if (parse.sel) {
          let sel2 = resolveSelection(view, view.state.doc, parse.sel);
          if (sel2 && !sel2.eq(view.state.selection))
            view.dispatch(view.state.tr.setSelection(sel2));
        }
        return;
      }
    }
    view.input.domChangeCount++;
    if (view.state.selection.from < view.state.selection.to && change.start == change.endB && view.state.selection instanceof TextSelection) {
      if (change.start > view.state.selection.from && change.start <= view.state.selection.from + 2 && view.state.selection.from >= parse.from) {
        change.start = view.state.selection.from;
      } else if (change.endA < view.state.selection.to && change.endA >= view.state.selection.to - 2 && view.state.selection.to <= parse.to) {
        change.endB += view.state.selection.to - change.endA;
        change.endA = view.state.selection.to;
      }
    }
    if (ie && ie_version <= 11 && change.endB == change.start + 1 && change.endA == change.start && change.start > parse.from && parse.doc.textBetween(change.start - parse.from - 1, change.start - parse.from + 1) == " \xA0") {
      change.start--;
      change.endA--;
      change.endB--;
    }
    let $from = parse.doc.resolveNoCache(change.start - parse.from);
    let $to = parse.doc.resolveNoCache(change.endB - parse.from);
    let $fromA = doc3.resolve(change.start);
    let inlineChange = $from.sameParent($to) && $from.parent.inlineContent && $fromA.end() >= change.endA;
    let nextSel;
    if ((ios && view.input.lastIOSEnter > Date.now() - 225 && (!inlineChange || addedNodes.some((n) => n.nodeName == "DIV" || n.nodeName == "P")) || !inlineChange && $from.pos < parse.doc.content.size && (nextSel = Selection.findFrom(parse.doc.resolve($from.pos + 1), 1, true)) && nextSel.head == $to.pos) && view.someProp("handleKeyDown", (f) => f(view, keyEvent(13, "Enter")))) {
      view.input.lastIOSEnter = 0;
      return;
    }
    if (view.state.selection.anchor > change.start && looksLikeJoin(doc3, change.start, change.endA, $from, $to) && view.someProp("handleKeyDown", (f) => f(view, keyEvent(8, "Backspace")))) {
      if (android && chrome)
        view.domObserver.suppressSelectionUpdates();
      return;
    }
    if (chrome && android && change.endB == change.start)
      view.input.lastAndroidDelete = Date.now();
    if (android && !inlineChange && $from.start() != $to.start() && $to.parentOffset == 0 && $from.depth == $to.depth && parse.sel && parse.sel.anchor == parse.sel.head && parse.sel.head == change.endA) {
      change.endB -= 2;
      $to = parse.doc.resolveNoCache(change.endB - parse.from);
      setTimeout(() => {
        view.someProp("handleKeyDown", function(f) {
          return f(view, keyEvent(13, "Enter"));
        });
      }, 20);
    }
    let chFrom = change.start, chTo = change.endA;
    let tr, storedMarks, markChange;
    if (inlineChange) {
      if ($from.pos == $to.pos) {
        if (ie && ie_version <= 11 && $from.parentOffset == 0) {
          view.domObserver.suppressSelectionUpdates();
          setTimeout(() => selectionToDOM(view), 20);
        }
        tr = view.state.tr.delete(chFrom, chTo);
        storedMarks = doc3.resolve(change.start).marksAcross(doc3.resolve(change.endA));
      } else if (change.endA == change.endB && (markChange = isMarkChange($from.parent.content.cut($from.parentOffset, $to.parentOffset), $fromA.parent.content.cut($fromA.parentOffset, change.endA - $fromA.start())))) {
        tr = view.state.tr;
        if (markChange.type == "add")
          tr.addMark(chFrom, chTo, markChange.mark);
        else
          tr.removeMark(chFrom, chTo, markChange.mark);
      } else if ($from.parent.child($from.index()).isText && $from.index() == $to.index() - ($to.textOffset ? 0 : 1)) {
        let text = $from.parent.textBetween($from.parentOffset, $to.parentOffset);
        if (view.someProp("handleTextInput", (f) => f(view, chFrom, chTo, text)))
          return;
        tr = view.state.tr.insertText(text, chFrom, chTo);
      }
    }
    if (!tr)
      tr = view.state.tr.replace(chFrom, chTo, parse.doc.slice(change.start - parse.from, change.endB - parse.from));
    if (parse.sel) {
      let sel2 = resolveSelection(view, tr.doc, parse.sel);
      if (sel2 && !(chrome && android && view.composing && sel2.empty && (change.start != change.endB || view.input.lastAndroidDelete < Date.now() - 100) && (sel2.head == chFrom || sel2.head == tr.mapping.map(chTo) - 1) || ie && sel2.empty && sel2.head == chFrom))
        tr.setSelection(sel2);
    }
    if (storedMarks)
      tr.ensureMarks(storedMarks);
    view.dispatch(tr.scrollIntoView());
  }
  function resolveSelection(view, doc3, parsedSel) {
    if (Math.max(parsedSel.anchor, parsedSel.head) > doc3.content.size)
      return null;
    return selectionBetween(view, doc3.resolve(parsedSel.anchor), doc3.resolve(parsedSel.head));
  }
  function isMarkChange(cur, prev) {
    let curMarks = cur.firstChild.marks, prevMarks = prev.firstChild.marks;
    let added = curMarks, removed = prevMarks, type, mark, update;
    for (let i = 0; i < prevMarks.length; i++)
      added = prevMarks[i].removeFromSet(added);
    for (let i = 0; i < curMarks.length; i++)
      removed = curMarks[i].removeFromSet(removed);
    if (added.length == 1 && removed.length == 0) {
      mark = added[0];
      type = "add";
      update = (node) => node.mark(mark.addToSet(node.marks));
    } else if (added.length == 0 && removed.length == 1) {
      mark = removed[0];
      type = "remove";
      update = (node) => node.mark(mark.removeFromSet(node.marks));
    } else {
      return null;
    }
    let updated = [];
    for (let i = 0; i < prev.childCount; i++)
      updated.push(update(prev.child(i)));
    if (Fragment.from(updated).eq(cur))
      return { mark, type };
  }
  function looksLikeJoin(old, start, end, $newStart, $newEnd) {
    if (!$newStart.parent.isTextblock || end - start <= $newEnd.pos - $newStart.pos || skipClosingAndOpening($newStart, true, false) < $newEnd.pos)
      return false;
    let $start = old.resolve(start);
    if ($start.parentOffset < $start.parent.content.size || !$start.parent.isTextblock)
      return false;
    let $next = old.resolve(skipClosingAndOpening($start, true, true));
    if (!$next.parent.isTextblock || $next.pos > end || skipClosingAndOpening($next, true, false) < end)
      return false;
    return $newStart.parent.content.cut($newStart.parentOffset).eq($next.parent.content);
  }
  function skipClosingAndOpening($pos, fromEnd, mayOpen) {
    let depth = $pos.depth, end = fromEnd ? $pos.end() : $pos.pos;
    while (depth > 0 && (fromEnd || $pos.indexAfter(depth) == $pos.node(depth).childCount)) {
      depth--;
      end++;
      fromEnd = false;
    }
    if (mayOpen) {
      let next = $pos.node(depth).maybeChild($pos.indexAfter(depth));
      while (next && !next.isLeaf) {
        next = next.firstChild;
        end++;
      }
    }
    return end;
  }
  function findDiff(a, b, pos, preferredPos, preferredSide) {
    let start = a.findDiffStart(b, pos);
    if (start == null)
      return null;
    let { a: endA, b: endB } = a.findDiffEnd(b, pos + a.size, pos + b.size);
    if (preferredSide == "end") {
      let adjust = Math.max(0, start - Math.min(endA, endB));
      preferredPos -= endA + adjust - start;
    }
    if (endA < start && a.size < b.size) {
      let move = preferredPos <= start && preferredPos >= endA ? start - preferredPos : 0;
      start -= move;
      endB = start + (endB - endA);
      endA = start;
    } else if (endB < start) {
      let move = preferredPos <= start && preferredPos >= endB ? start - preferredPos : 0;
      start -= move;
      endA = start + (endA - endB);
      endB = start;
    }
    return { start, endA, endB };
  }
  var EditorView = class {
    constructor(place, props) {
      this._root = null;
      this.focused = false;
      this.trackWrites = null;
      this.mounted = false;
      this.markCursor = null;
      this.cursorWrapper = null;
      this.lastSelectedViewDesc = void 0;
      this.input = new InputState();
      this.prevDirectPlugins = [];
      this.pluginViews = [];
      this.dragging = null;
      this._props = props;
      this.state = props.state;
      this.directPlugins = props.plugins || [];
      this.directPlugins.forEach(checkStateComponent);
      this.dispatch = this.dispatch.bind(this);
      this.dom = place && place.mount || document.createElement("div");
      if (place) {
        if (place.appendChild)
          place.appendChild(this.dom);
        else if (typeof place == "function")
          place(this.dom);
        else if (place.mount)
          this.mounted = true;
      }
      this.editable = getEditable(this);
      updateCursorWrapper(this);
      this.nodeViews = buildNodeViews(this);
      this.docView = docViewDesc(this.state.doc, computeDocDeco(this), viewDecorations(this), this.dom, this);
      this.domObserver = new DOMObserver(this, (from2, to, typeOver, added) => readDOMChange(this, from2, to, typeOver, added));
      this.domObserver.start();
      initInput(this);
      this.updatePluginViews();
    }
    get composing() {
      return this.input.composing;
    }
    get props() {
      if (this._props.state != this.state) {
        let prev = this._props;
        this._props = {};
        for (let name in prev)
          this._props[name] = prev[name];
        this._props.state = this.state;
      }
      return this._props;
    }
    update(props) {
      if (props.handleDOMEvents != this._props.handleDOMEvents)
        ensureListeners(this);
      this._props = props;
      if (props.plugins) {
        props.plugins.forEach(checkStateComponent);
        this.directPlugins = props.plugins;
      }
      this.updateStateInner(props.state, true);
    }
    setProps(props) {
      let updated = {};
      for (let name in this._props)
        updated[name] = this._props[name];
      updated.state = this.state;
      for (let name in props)
        updated[name] = props[name];
      this.update(updated);
    }
    updateState(state) {
      this.updateStateInner(state, this.state.plugins != state.plugins);
    }
    updateStateInner(state, reconfigured) {
      let prev = this.state, redraw = false, updateSel = false;
      if (state.storedMarks && this.composing) {
        clearComposition(this);
        updateSel = true;
      }
      this.state = state;
      if (reconfigured) {
        let nodeViews = buildNodeViews(this);
        if (changedNodeViews(nodeViews, this.nodeViews)) {
          this.nodeViews = nodeViews;
          redraw = true;
        }
        ensureListeners(this);
      }
      this.editable = getEditable(this);
      updateCursorWrapper(this);
      let innerDeco = viewDecorations(this), outerDeco = computeDocDeco(this);
      let scroll = reconfigured ? "reset" : state.scrollToSelection > prev.scrollToSelection ? "to selection" : "preserve";
      let updateDoc = redraw || !this.docView.matchesNode(state.doc, outerDeco, innerDeco);
      if (updateDoc || !state.selection.eq(prev.selection))
        updateSel = true;
      let oldScrollPos = scroll == "preserve" && updateSel && this.dom.style.overflowAnchor == null && storeScrollPos(this);
      if (updateSel) {
        this.domObserver.stop();
        let forceSelUpdate = updateDoc && (ie || chrome) && !this.composing && !prev.selection.empty && !state.selection.empty && selectionContextChanged(prev.selection, state.selection);
        if (updateDoc) {
          let chromeKludge = chrome ? this.trackWrites = this.domSelection().focusNode : null;
          if (redraw || !this.docView.update(state.doc, outerDeco, innerDeco, this)) {
            this.docView.updateOuterDeco([]);
            this.docView.destroy();
            this.docView = docViewDesc(state.doc, outerDeco, innerDeco, this.dom, this);
          }
          if (chromeKludge && !this.trackWrites)
            forceSelUpdate = true;
        }
        if (forceSelUpdate || !(this.input.mouseDown && this.domObserver.currentSelection.eq(this.domSelection()) && anchorInRightPlace(this))) {
          selectionToDOM(this, forceSelUpdate);
        } else {
          syncNodeSelection(this, state.selection);
          this.domObserver.setCurSelection();
        }
        this.domObserver.start();
      }
      this.updatePluginViews(prev);
      if (scroll == "reset") {
        this.dom.scrollTop = 0;
      } else if (scroll == "to selection") {
        let startDOM = this.domSelection().focusNode;
        if (this.someProp("handleScrollToSelection", (f) => f(this)))
          ;
        else if (state.selection instanceof NodeSelection) {
          let target = this.docView.domAfterPos(state.selection.from);
          if (target.nodeType == 1)
            scrollRectIntoView(this, target.getBoundingClientRect(), startDOM);
        } else {
          scrollRectIntoView(this, this.coordsAtPos(state.selection.head, 1), startDOM);
        }
      } else if (oldScrollPos) {
        resetScrollPos(oldScrollPos);
      }
    }
    destroyPluginViews() {
      let view;
      while (view = this.pluginViews.pop())
        if (view.destroy)
          view.destroy();
    }
    updatePluginViews(prevState) {
      if (!prevState || prevState.plugins != this.state.plugins || this.directPlugins != this.prevDirectPlugins) {
        this.prevDirectPlugins = this.directPlugins;
        this.destroyPluginViews();
        for (let i = 0; i < this.directPlugins.length; i++) {
          let plugin = this.directPlugins[i];
          if (plugin.spec.view)
            this.pluginViews.push(plugin.spec.view(this));
        }
        for (let i = 0; i < this.state.plugins.length; i++) {
          let plugin = this.state.plugins[i];
          if (plugin.spec.view)
            this.pluginViews.push(plugin.spec.view(this));
        }
      } else {
        for (let i = 0; i < this.pluginViews.length; i++) {
          let pluginView = this.pluginViews[i];
          if (pluginView.update)
            pluginView.update(this, prevState);
        }
      }
    }
    someProp(propName, f) {
      let prop = this._props && this._props[propName], value;
      if (prop != null && (value = f ? f(prop) : prop))
        return value;
      for (let i = 0; i < this.directPlugins.length; i++) {
        let prop2 = this.directPlugins[i].props[propName];
        if (prop2 != null && (value = f ? f(prop2) : prop2))
          return value;
      }
      let plugins = this.state.plugins;
      if (plugins)
        for (let i = 0; i < plugins.length; i++) {
          let prop2 = plugins[i].props[propName];
          if (prop2 != null && (value = f ? f(prop2) : prop2))
            return value;
        }
    }
    hasFocus() {
      return this.root.activeElement == this.dom;
    }
    focus() {
      this.domObserver.stop();
      if (this.editable)
        focusPreventScroll(this.dom);
      selectionToDOM(this);
      this.domObserver.start();
    }
    get root() {
      let cached = this._root;
      if (cached == null)
        for (let search = this.dom.parentNode; search; search = search.parentNode) {
          if (search.nodeType == 9 || search.nodeType == 11 && search.host) {
            if (!search.getSelection)
              Object.getPrototypeOf(search).getSelection = () => search.ownerDocument.getSelection();
            return this._root = search;
          }
        }
      return cached || document;
    }
    posAtCoords(coords) {
      return posAtCoords(this, coords);
    }
    coordsAtPos(pos, side = 1) {
      return coordsAtPos(this, pos, side);
    }
    domAtPos(pos, side = 0) {
      return this.docView.domFromPos(pos, side);
    }
    nodeDOM(pos) {
      let desc = this.docView.descAt(pos);
      return desc ? desc.nodeDOM : null;
    }
    posAtDOM(node, offset, bias = -1) {
      let pos = this.docView.posFromDOM(node, offset, bias);
      if (pos == null)
        throw new RangeError("DOM position not inside the editor");
      return pos;
    }
    endOfTextblock(dir, state) {
      return endOfTextblock(this, state || this.state, dir);
    }
    destroy() {
      if (!this.docView)
        return;
      destroyInput(this);
      this.destroyPluginViews();
      if (this.mounted) {
        this.docView.update(this.state.doc, [], viewDecorations(this), this);
        this.dom.textContent = "";
      } else if (this.dom.parentNode) {
        this.dom.parentNode.removeChild(this.dom);
      }
      this.docView.destroy();
      this.docView = null;
    }
    get isDestroyed() {
      return this.docView == null;
    }
    dispatchEvent(event) {
      return dispatchEvent(this, event);
    }
    dispatch(tr) {
      let dispatchTransaction = this._props.dispatchTransaction;
      if (dispatchTransaction)
        dispatchTransaction.call(this, tr);
      else
        this.updateState(this.state.apply(tr));
    }
    domSelection() {
      return this.root.getSelection();
    }
  };
  function computeDocDeco(view) {
    let attrs = /* @__PURE__ */ Object.create(null);
    attrs.class = "ProseMirror";
    attrs.contenteditable = String(view.editable);
    attrs.translate = "no";
    view.someProp("attributes", (value) => {
      if (typeof value == "function")
        value = value(view.state);
      if (value)
        for (let attr in value) {
          if (attr == "class")
            attrs.class += " " + value[attr];
          if (attr == "style") {
            attrs.style = (attrs.style ? attrs.style + ";" : "") + value[attr];
          } else if (!attrs[attr] && attr != "contenteditable" && attr != "nodeName")
            attrs[attr] = String(value[attr]);
        }
    });
    return [Decoration.node(0, view.state.doc.content.size, attrs)];
  }
  function updateCursorWrapper(view) {
    if (view.markCursor) {
      let dom = document.createElement("img");
      dom.className = "ProseMirror-separator";
      dom.setAttribute("mark-placeholder", "true");
      dom.setAttribute("alt", "");
      view.cursorWrapper = { dom, deco: Decoration.widget(view.state.selection.head, dom, { raw: true, marks: view.markCursor }) };
    } else {
      view.cursorWrapper = null;
    }
  }
  function getEditable(view) {
    return !view.someProp("editable", (value) => value(view.state) === false);
  }
  function selectionContextChanged(sel1, sel2) {
    let depth = Math.min(sel1.$anchor.sharedDepth(sel1.head), sel2.$anchor.sharedDepth(sel2.head));
    return sel1.$anchor.start(depth) != sel2.$anchor.start(depth);
  }
  function buildNodeViews(view) {
    let result = /* @__PURE__ */ Object.create(null);
    function add2(obj) {
      for (let prop in obj)
        if (!Object.prototype.hasOwnProperty.call(result, prop))
          result[prop] = obj[prop];
    }
    view.someProp("nodeViews", add2);
    view.someProp("markViews", add2);
    return result;
  }
  function changedNodeViews(a, b) {
    let nA = 0, nB = 0;
    for (let prop in a) {
      if (a[prop] != b[prop])
        return true;
      nA++;
    }
    for (let _ in b)
      nB++;
    return nA != nB;
  }
  function checkStateComponent(plugin) {
    if (plugin.spec.state || plugin.spec.filterTransaction || plugin.spec.appendTransaction)
      throw new RangeError("Plugins passed directly to the view must not have a state component");
  }

  // node_modules/prosemirror-schema-basic/dist/index.js
  var pDOM = ["p", 0];
  var blockquoteDOM = ["blockquote", 0];
  var hrDOM = ["hr"];
  var preDOM = ["pre", ["code", 0]];
  var brDOM = ["br"];
  var nodes = {
    doc: {
      content: "block+"
    },
    paragraph: {
      content: "inline*",
      group: "block",
      parseDOM: [{ tag: "p" }],
      toDOM() {
        return pDOM;
      }
    },
    blockquote: {
      content: "block+",
      group: "block",
      defining: true,
      parseDOM: [{ tag: "blockquote" }],
      toDOM() {
        return blockquoteDOM;
      }
    },
    horizontal_rule: {
      group: "block",
      parseDOM: [{ tag: "hr" }],
      toDOM() {
        return hrDOM;
      }
    },
    heading: {
      attrs: { level: { default: 1 } },
      content: "inline*",
      group: "block",
      defining: true,
      parseDOM: [
        { tag: "h1", attrs: { level: 1 } },
        { tag: "h2", attrs: { level: 2 } },
        { tag: "h3", attrs: { level: 3 } },
        { tag: "h4", attrs: { level: 4 } },
        { tag: "h5", attrs: { level: 5 } },
        { tag: "h6", attrs: { level: 6 } }
      ],
      toDOM(node) {
        return ["h" + node.attrs.level, 0];
      }
    },
    code_block: {
      content: "text*",
      marks: "",
      group: "block",
      code: true,
      defining: true,
      parseDOM: [{ tag: "pre", preserveWhitespace: "full" }],
      toDOM() {
        return preDOM;
      }
    },
    text: {
      group: "inline"
    },
    image: {
      inline: true,
      attrs: {
        src: {},
        alt: { default: null },
        title: { default: null }
      },
      group: "inline",
      draggable: true,
      parseDOM: [{ tag: "img[src]", getAttrs(dom) {
        return {
          src: dom.getAttribute("src"),
          title: dom.getAttribute("title"),
          alt: dom.getAttribute("alt")
        };
      } }],
      toDOM(node) {
        let { src, alt, title } = node.attrs;
        return ["img", { src, alt, title }];
      }
    },
    hard_break: {
      inline: true,
      group: "inline",
      selectable: false,
      parseDOM: [{ tag: "br" }],
      toDOM() {
        return brDOM;
      }
    }
  };
  var emDOM = ["em", 0];
  var strongDOM = ["strong", 0];
  var codeDOM = ["code", 0];
  var marks = {
    link: {
      attrs: {
        href: {},
        title: { default: null }
      },
      inclusive: false,
      parseDOM: [{ tag: "a[href]", getAttrs(dom) {
        return { href: dom.getAttribute("href"), title: dom.getAttribute("title") };
      } }],
      toDOM(node) {
        let { href, title } = node.attrs;
        return ["a", { href, title }, 0];
      }
    },
    em: {
      parseDOM: [{ tag: "i" }, { tag: "em" }, { style: "font-style=italic" }],
      toDOM() {
        return emDOM;
      }
    },
    strong: {
      parseDOM: [
        { tag: "strong" },
        { tag: "b", getAttrs: (node) => node.style.fontWeight != "normal" && null },
        { style: "font-weight", getAttrs: (value) => /^(bold(er)?|[5-9]\d{2,})$/.test(value) && null }
      ],
      toDOM() {
        return strongDOM;
      }
    },
    code: {
      parseDOM: [{ tag: "code" }],
      toDOM() {
        return codeDOM;
      }
    }
  };
  var schema = new Schema({ nodes, marks });

  // node_modules/w3c-keyname/index.es.js
  var base = {
    8: "Backspace",
    9: "Tab",
    10: "Enter",
    12: "NumLock",
    13: "Enter",
    16: "Shift",
    17: "Control",
    18: "Alt",
    20: "CapsLock",
    27: "Escape",
    32: " ",
    33: "PageUp",
    34: "PageDown",
    35: "End",
    36: "Home",
    37: "ArrowLeft",
    38: "ArrowUp",
    39: "ArrowRight",
    40: "ArrowDown",
    44: "PrintScreen",
    45: "Insert",
    46: "Delete",
    59: ";",
    61: "=",
    91: "Meta",
    92: "Meta",
    106: "*",
    107: "+",
    108: ",",
    109: "-",
    110: ".",
    111: "/",
    144: "NumLock",
    145: "ScrollLock",
    160: "Shift",
    161: "Shift",
    162: "Control",
    163: "Control",
    164: "Alt",
    165: "Alt",
    173: "-",
    186: ";",
    187: "=",
    188: ",",
    189: "-",
    190: ".",
    191: "/",
    192: "`",
    219: "[",
    220: "\\",
    221: "]",
    222: "'",
    229: "q"
  };
  var shift = {
    48: ")",
    49: "!",
    50: "@",
    51: "#",
    52: "$",
    53: "%",
    54: "^",
    55: "&",
    56: "*",
    57: "(",
    59: ":",
    61: "+",
    173: "_",
    186: ":",
    187: "+",
    188: "<",
    189: "_",
    190: ">",
    191: "?",
    192: "~",
    219: "{",
    220: "|",
    221: "}",
    222: '"',
    229: "Q"
  };
  var chrome2 = typeof navigator != "undefined" && /Chrome\/(\d+)/.exec(navigator.userAgent);
  var safari2 = typeof navigator != "undefined" && /Apple Computer/.test(navigator.vendor);
  var gecko2 = typeof navigator != "undefined" && /Gecko\/\d+/.test(navigator.userAgent);
  var mac2 = typeof navigator != "undefined" && /Mac/.test(navigator.platform);
  var ie2 = typeof navigator != "undefined" && /MSIE \d|Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(navigator.userAgent);
  var brokenModifierNames = chrome2 && (mac2 || +chrome2[1] < 57) || gecko2 && mac2;
  for (i = 0; i < 10; i++)
    base[48 + i] = base[96 + i] = String(i);
  var i;
  for (i = 1; i <= 24; i++)
    base[i + 111] = "F" + i;
  var i;
  for (i = 65; i <= 90; i++) {
    base[i] = String.fromCharCode(i + 32);
    shift[i] = String.fromCharCode(i);
  }
  var i;
  for (code in base)
    if (!shift.hasOwnProperty(code))
      shift[code] = base[code];
  var code;
  function keyName(event) {
    var ignoreKey = brokenModifierNames && (event.ctrlKey || event.altKey || event.metaKey) || (safari2 || ie2) && event.shiftKey && event.key && event.key.length == 1;
    var name = !ignoreKey && event.key || (event.shiftKey ? shift : base)[event.keyCode] || event.key || "Unidentified";
    if (name == "Esc")
      name = "Escape";
    if (name == "Del")
      name = "Delete";
    if (name == "Left")
      name = "ArrowLeft";
    if (name == "Up")
      name = "ArrowUp";
    if (name == "Right")
      name = "ArrowRight";
    if (name == "Down")
      name = "ArrowDown";
    return name;
  }

  // node_modules/prosemirror-keymap/dist/index.js
  var mac3 = typeof navigator != "undefined" ? /Mac|iP(hone|[oa]d)/.test(navigator.platform) : false;
  function normalizeKeyName(name) {
    let parts = name.split(/-(?!$)/), result = parts[parts.length - 1];
    if (result == "Space")
      result = " ";
    let alt, ctrl, shift2, meta;
    for (let i = 0; i < parts.length - 1; i++) {
      let mod = parts[i];
      if (/^(cmd|meta|m)$/i.test(mod))
        meta = true;
      else if (/^a(lt)?$/i.test(mod))
        alt = true;
      else if (/^(c|ctrl|control)$/i.test(mod))
        ctrl = true;
      else if (/^s(hift)?$/i.test(mod))
        shift2 = true;
      else if (/^mod$/i.test(mod)) {
        if (mac3)
          meta = true;
        else
          ctrl = true;
      } else
        throw new Error("Unrecognized modifier name: " + mod);
    }
    if (alt)
      result = "Alt-" + result;
    if (ctrl)
      result = "Ctrl-" + result;
    if (meta)
      result = "Meta-" + result;
    if (shift2)
      result = "Shift-" + result;
    return result;
  }
  function normalize(map2) {
    let copy2 = /* @__PURE__ */ Object.create(null);
    for (let prop in map2)
      copy2[normalizeKeyName(prop)] = map2[prop];
    return copy2;
  }
  function modifiers(name, event, shift2) {
    if (event.altKey)
      name = "Alt-" + name;
    if (event.ctrlKey)
      name = "Ctrl-" + name;
    if (event.metaKey)
      name = "Meta-" + name;
    if (shift2 !== false && event.shiftKey)
      name = "Shift-" + name;
    return name;
  }
  function keymap(bindings) {
    return new Plugin({ props: { handleKeyDown: keydownHandler(bindings) } });
  }
  function keydownHandler(bindings) {
    let map2 = normalize(bindings);
    return function(view, event) {
      let name = keyName(event), isChar = name.length == 1 && name != " ", baseName;
      let direct = map2[modifiers(name, event, !isChar)];
      if (direct && direct(view.state, view.dispatch, view))
        return true;
      if (isChar && (event.shiftKey || event.altKey || event.metaKey || name.charCodeAt(0) > 127) && (baseName = base[event.keyCode]) && baseName != name) {
        let fromCode = map2[modifiers(baseName, event, true)];
        if (fromCode && fromCode(view.state, view.dispatch, view))
          return true;
      } else if (isChar && event.shiftKey) {
        let withShift = map2[modifiers(name, event, true)];
        if (withShift && withShift(view.state, view.dispatch, view))
          return true;
      }
      return false;
    };
  }

  // node_modules/rope-sequence/dist/index.es.js
  var GOOD_LEAF_SIZE = 200;
  var RopeSequence = function RopeSequence2() {
  };
  RopeSequence.prototype.append = function append(other) {
    if (!other.length) {
      return this;
    }
    other = RopeSequence.from(other);
    return !this.length && other || other.length < GOOD_LEAF_SIZE && this.leafAppend(other) || this.length < GOOD_LEAF_SIZE && other.leafPrepend(this) || this.appendInner(other);
  };
  RopeSequence.prototype.prepend = function prepend(other) {
    if (!other.length) {
      return this;
    }
    return RopeSequence.from(other).append(this);
  };
  RopeSequence.prototype.appendInner = function appendInner(other) {
    return new Append(this, other);
  };
  RopeSequence.prototype.slice = function slice(from2, to) {
    if (from2 === void 0)
      from2 = 0;
    if (to === void 0)
      to = this.length;
    if (from2 >= to) {
      return RopeSequence.empty;
    }
    return this.sliceInner(Math.max(0, from2), Math.min(this.length, to));
  };
  RopeSequence.prototype.get = function get(i) {
    if (i < 0 || i >= this.length) {
      return void 0;
    }
    return this.getInner(i);
  };
  RopeSequence.prototype.forEach = function forEach(f, from2, to) {
    if (from2 === void 0)
      from2 = 0;
    if (to === void 0)
      to = this.length;
    if (from2 <= to) {
      this.forEachInner(f, from2, to, 0);
    } else {
      this.forEachInvertedInner(f, from2, to, 0);
    }
  };
  RopeSequence.prototype.map = function map(f, from2, to) {
    if (from2 === void 0)
      from2 = 0;
    if (to === void 0)
      to = this.length;
    var result = [];
    this.forEach(function(elt, i) {
      return result.push(f(elt, i));
    }, from2, to);
    return result;
  };
  RopeSequence.from = function from(values) {
    if (values instanceof RopeSequence) {
      return values;
    }
    return values && values.length ? new Leaf(values) : RopeSequence.empty;
  };
  var Leaf = /* @__PURE__ */ function(RopeSequence3) {
    function Leaf2(values) {
      RopeSequence3.call(this);
      this.values = values;
    }
    if (RopeSequence3)
      Leaf2.__proto__ = RopeSequence3;
    Leaf2.prototype = Object.create(RopeSequence3 && RopeSequence3.prototype);
    Leaf2.prototype.constructor = Leaf2;
    var prototypeAccessors = { length: { configurable: true }, depth: { configurable: true } };
    Leaf2.prototype.flatten = function flatten() {
      return this.values;
    };
    Leaf2.prototype.sliceInner = function sliceInner(from2, to) {
      if (from2 == 0 && to == this.length) {
        return this;
      }
      return new Leaf2(this.values.slice(from2, to));
    };
    Leaf2.prototype.getInner = function getInner(i) {
      return this.values[i];
    };
    Leaf2.prototype.forEachInner = function forEachInner(f, from2, to, start) {
      for (var i = from2; i < to; i++) {
        if (f(this.values[i], start + i) === false) {
          return false;
        }
      }
    };
    Leaf2.prototype.forEachInvertedInner = function forEachInvertedInner(f, from2, to, start) {
      for (var i = from2 - 1; i >= to; i--) {
        if (f(this.values[i], start + i) === false) {
          return false;
        }
      }
    };
    Leaf2.prototype.leafAppend = function leafAppend(other) {
      if (this.length + other.length <= GOOD_LEAF_SIZE) {
        return new Leaf2(this.values.concat(other.flatten()));
      }
    };
    Leaf2.prototype.leafPrepend = function leafPrepend(other) {
      if (this.length + other.length <= GOOD_LEAF_SIZE) {
        return new Leaf2(other.flatten().concat(this.values));
      }
    };
    prototypeAccessors.length.get = function() {
      return this.values.length;
    };
    prototypeAccessors.depth.get = function() {
      return 0;
    };
    Object.defineProperties(Leaf2.prototype, prototypeAccessors);
    return Leaf2;
  }(RopeSequence);
  RopeSequence.empty = new Leaf([]);
  var Append = /* @__PURE__ */ function(RopeSequence3) {
    function Append2(left, right) {
      RopeSequence3.call(this);
      this.left = left;
      this.right = right;
      this.length = left.length + right.length;
      this.depth = Math.max(left.depth, right.depth) + 1;
    }
    if (RopeSequence3)
      Append2.__proto__ = RopeSequence3;
    Append2.prototype = Object.create(RopeSequence3 && RopeSequence3.prototype);
    Append2.prototype.constructor = Append2;
    Append2.prototype.flatten = function flatten() {
      return this.left.flatten().concat(this.right.flatten());
    };
    Append2.prototype.getInner = function getInner(i) {
      return i < this.left.length ? this.left.get(i) : this.right.get(i - this.left.length);
    };
    Append2.prototype.forEachInner = function forEachInner(f, from2, to, start) {
      var leftLen = this.left.length;
      if (from2 < leftLen && this.left.forEachInner(f, from2, Math.min(to, leftLen), start) === false) {
        return false;
      }
      if (to > leftLen && this.right.forEachInner(f, Math.max(from2 - leftLen, 0), Math.min(this.length, to) - leftLen, start + leftLen) === false) {
        return false;
      }
    };
    Append2.prototype.forEachInvertedInner = function forEachInvertedInner(f, from2, to, start) {
      var leftLen = this.left.length;
      if (from2 > leftLen && this.right.forEachInvertedInner(f, from2 - leftLen, Math.max(to, leftLen) - leftLen, start + leftLen) === false) {
        return false;
      }
      if (to < leftLen && this.left.forEachInvertedInner(f, Math.min(from2, leftLen), to, start) === false) {
        return false;
      }
    };
    Append2.prototype.sliceInner = function sliceInner(from2, to) {
      if (from2 == 0 && to == this.length) {
        return this;
      }
      var leftLen = this.left.length;
      if (to <= leftLen) {
        return this.left.slice(from2, to);
      }
      if (from2 >= leftLen) {
        return this.right.slice(from2 - leftLen, to - leftLen);
      }
      return this.left.slice(from2, leftLen).append(this.right.slice(0, to - leftLen));
    };
    Append2.prototype.leafAppend = function leafAppend(other) {
      var inner = this.right.leafAppend(other);
      if (inner) {
        return new Append2(this.left, inner);
      }
    };
    Append2.prototype.leafPrepend = function leafPrepend(other) {
      var inner = this.left.leafPrepend(other);
      if (inner) {
        return new Append2(inner, this.right);
      }
    };
    Append2.prototype.appendInner = function appendInner2(other) {
      if (this.left.depth >= Math.max(this.right.depth, other.depth) + 1) {
        return new Append2(this.left, new Append2(this.right, other));
      }
      return new Append2(this, other);
    };
    return Append2;
  }(RopeSequence);
  var ropeSequence = RopeSequence;
  var index_es_default2 = ropeSequence;

  // node_modules/prosemirror-history/dist/index.js
  var max_empty_items = 500;
  var Branch = class {
    constructor(items, eventCount) {
      this.items = items;
      this.eventCount = eventCount;
    }
    popEvent(state, preserveItems) {
      if (this.eventCount == 0)
        return null;
      let end = this.items.length;
      for (; ; end--) {
        let next = this.items.get(end - 1);
        if (next.selection) {
          --end;
          break;
        }
      }
      let remap, mapFrom;
      if (preserveItems) {
        remap = this.remapping(end, this.items.length);
        mapFrom = remap.maps.length;
      }
      let transform = state.tr;
      let selection, remaining;
      let addAfter = [], addBefore = [];
      this.items.forEach((item, i) => {
        if (!item.step) {
          if (!remap) {
            remap = this.remapping(end, i + 1);
            mapFrom = remap.maps.length;
          }
          mapFrom--;
          addBefore.push(item);
          return;
        }
        if (remap) {
          addBefore.push(new Item(item.map));
          let step = item.step.map(remap.slice(mapFrom)), map2;
          if (step && transform.maybeStep(step).doc) {
            map2 = transform.mapping.maps[transform.mapping.maps.length - 1];
            addAfter.push(new Item(map2, void 0, void 0, addAfter.length + addBefore.length));
          }
          mapFrom--;
          if (map2)
            remap.appendMap(map2, mapFrom);
        } else {
          transform.maybeStep(item.step);
        }
        if (item.selection) {
          selection = remap ? item.selection.map(remap.slice(mapFrom)) : item.selection;
          remaining = new Branch(this.items.slice(0, end).append(addBefore.reverse().concat(addAfter)), this.eventCount - 1);
          return false;
        }
      }, this.items.length, 0);
      return { remaining, transform, selection };
    }
    addTransform(transform, selection, histOptions, preserveItems) {
      let newItems = [], eventCount = this.eventCount;
      let oldItems = this.items, lastItem = !preserveItems && oldItems.length ? oldItems.get(oldItems.length - 1) : null;
      for (let i = 0; i < transform.steps.length; i++) {
        let step = transform.steps[i].invert(transform.docs[i]);
        let item = new Item(transform.mapping.maps[i], step, selection), merged;
        if (merged = lastItem && lastItem.merge(item)) {
          item = merged;
          if (i)
            newItems.pop();
          else
            oldItems = oldItems.slice(0, oldItems.length - 1);
        }
        newItems.push(item);
        if (selection) {
          eventCount++;
          selection = void 0;
        }
        if (!preserveItems)
          lastItem = item;
      }
      let overflow = eventCount - histOptions.depth;
      if (overflow > DEPTH_OVERFLOW) {
        oldItems = cutOffEvents(oldItems, overflow);
        eventCount -= overflow;
      }
      return new Branch(oldItems.append(newItems), eventCount);
    }
    remapping(from2, to) {
      let maps = new Mapping();
      this.items.forEach((item, i) => {
        let mirrorPos = item.mirrorOffset != null && i - item.mirrorOffset >= from2 ? maps.maps.length - item.mirrorOffset : void 0;
        maps.appendMap(item.map, mirrorPos);
      }, from2, to);
      return maps;
    }
    addMaps(array) {
      if (this.eventCount == 0)
        return this;
      return new Branch(this.items.append(array.map((map2) => new Item(map2))), this.eventCount);
    }
    rebased(rebasedTransform, rebasedCount) {
      if (!this.eventCount)
        return this;
      let rebasedItems = [], start = Math.max(0, this.items.length - rebasedCount);
      let mapping = rebasedTransform.mapping;
      let newUntil = rebasedTransform.steps.length;
      let eventCount = this.eventCount;
      this.items.forEach((item) => {
        if (item.selection)
          eventCount--;
      }, start);
      let iRebased = rebasedCount;
      this.items.forEach((item) => {
        let pos = mapping.getMirror(--iRebased);
        if (pos == null)
          return;
        newUntil = Math.min(newUntil, pos);
        let map2 = mapping.maps[pos];
        if (item.step) {
          let step = rebasedTransform.steps[pos].invert(rebasedTransform.docs[pos]);
          let selection = item.selection && item.selection.map(mapping.slice(iRebased + 1, pos));
          if (selection)
            eventCount++;
          rebasedItems.push(new Item(map2, step, selection));
        } else {
          rebasedItems.push(new Item(map2));
        }
      }, start);
      let newMaps = [];
      for (let i = rebasedCount; i < newUntil; i++)
        newMaps.push(new Item(mapping.maps[i]));
      let items = this.items.slice(0, start).append(newMaps).append(rebasedItems);
      let branch = new Branch(items, eventCount);
      if (branch.emptyItemCount() > max_empty_items)
        branch = branch.compress(this.items.length - rebasedItems.length);
      return branch;
    }
    emptyItemCount() {
      let count = 0;
      this.items.forEach((item) => {
        if (!item.step)
          count++;
      });
      return count;
    }
    compress(upto = this.items.length) {
      let remap = this.remapping(0, upto), mapFrom = remap.maps.length;
      let items = [], events = 0;
      this.items.forEach((item, i) => {
        if (i >= upto) {
          items.push(item);
          if (item.selection)
            events++;
        } else if (item.step) {
          let step = item.step.map(remap.slice(mapFrom)), map2 = step && step.getMap();
          mapFrom--;
          if (map2)
            remap.appendMap(map2, mapFrom);
          if (step) {
            let selection = item.selection && item.selection.map(remap.slice(mapFrom));
            if (selection)
              events++;
            let newItem = new Item(map2.invert(), step, selection), merged, last = items.length - 1;
            if (merged = items.length && items[last].merge(newItem))
              items[last] = merged;
            else
              items.push(newItem);
          }
        } else if (item.map) {
          mapFrom--;
        }
      }, this.items.length, 0);
      return new Branch(index_es_default2.from(items.reverse()), events);
    }
  };
  Branch.empty = new Branch(index_es_default2.empty, 0);
  function cutOffEvents(items, n) {
    let cutPoint;
    items.forEach((item, i) => {
      if (item.selection && n-- == 0) {
        cutPoint = i;
        return false;
      }
    });
    return items.slice(cutPoint);
  }
  var Item = class {
    constructor(map2, step, selection, mirrorOffset) {
      this.map = map2;
      this.step = step;
      this.selection = selection;
      this.mirrorOffset = mirrorOffset;
    }
    merge(other) {
      if (this.step && other.step && !other.selection) {
        let step = other.step.merge(this.step);
        if (step)
          return new Item(step.getMap().invert(), step, this.selection);
      }
    }
  };
  var HistoryState = class {
    constructor(done, undone, prevRanges, prevTime) {
      this.done = done;
      this.undone = undone;
      this.prevRanges = prevRanges;
      this.prevTime = prevTime;
    }
  };
  var DEPTH_OVERFLOW = 20;
  function applyTransaction(history2, state, tr, options) {
    let historyTr = tr.getMeta(historyKey), rebased;
    if (historyTr)
      return historyTr.historyState;
    if (tr.getMeta(closeHistoryKey))
      history2 = new HistoryState(history2.done, history2.undone, null, 0);
    let appended = tr.getMeta("appendedTransaction");
    if (tr.steps.length == 0) {
      return history2;
    } else if (appended && appended.getMeta(historyKey)) {
      if (appended.getMeta(historyKey).redo)
        return new HistoryState(history2.done.addTransform(tr, void 0, options, mustPreserveItems(state)), history2.undone, rangesFor(tr.mapping.maps[tr.steps.length - 1]), history2.prevTime);
      else
        return new HistoryState(history2.done, history2.undone.addTransform(tr, void 0, options, mustPreserveItems(state)), null, history2.prevTime);
    } else if (tr.getMeta("addToHistory") !== false && !(appended && appended.getMeta("addToHistory") === false)) {
      let newGroup = history2.prevTime == 0 || !appended && (history2.prevTime < (tr.time || 0) - options.newGroupDelay || !isAdjacentTo(tr, history2.prevRanges));
      let prevRanges = appended ? mapRanges(history2.prevRanges, tr.mapping) : rangesFor(tr.mapping.maps[tr.steps.length - 1]);
      return new HistoryState(history2.done.addTransform(tr, newGroup ? state.selection.getBookmark() : void 0, options, mustPreserveItems(state)), Branch.empty, prevRanges, tr.time);
    } else if (rebased = tr.getMeta("rebased")) {
      return new HistoryState(history2.done.rebased(tr, rebased), history2.undone.rebased(tr, rebased), mapRanges(history2.prevRanges, tr.mapping), history2.prevTime);
    } else {
      return new HistoryState(history2.done.addMaps(tr.mapping.maps), history2.undone.addMaps(tr.mapping.maps), mapRanges(history2.prevRanges, tr.mapping), history2.prevTime);
    }
  }
  function isAdjacentTo(transform, prevRanges) {
    if (!prevRanges)
      return false;
    if (!transform.docChanged)
      return true;
    let adjacent = false;
    transform.mapping.maps[0].forEach((start, end) => {
      for (let i = 0; i < prevRanges.length; i += 2)
        if (start <= prevRanges[i + 1] && end >= prevRanges[i])
          adjacent = true;
    });
    return adjacent;
  }
  function rangesFor(map2) {
    let result = [];
    map2.forEach((_from, _to, from2, to) => result.push(from2, to));
    return result;
  }
  function mapRanges(ranges, mapping) {
    if (!ranges)
      return null;
    let result = [];
    for (let i = 0; i < ranges.length; i += 2) {
      let from2 = mapping.map(ranges[i], 1), to = mapping.map(ranges[i + 1], -1);
      if (from2 <= to)
        result.push(from2, to);
    }
    return result;
  }
  function histTransaction(history2, state, dispatch, redo2) {
    let preserveItems = mustPreserveItems(state);
    let histOptions = historyKey.get(state).spec.config;
    let pop = (redo2 ? history2.undone : history2.done).popEvent(state, preserveItems);
    if (!pop)
      return;
    let selection = pop.selection.resolve(pop.transform.doc);
    let added = (redo2 ? history2.done : history2.undone).addTransform(pop.transform, state.selection.getBookmark(), histOptions, preserveItems);
    let newHist = new HistoryState(redo2 ? added : pop.remaining, redo2 ? pop.remaining : added, null, 0);
    dispatch(pop.transform.setSelection(selection).setMeta(historyKey, { redo: redo2, historyState: newHist }).scrollIntoView());
  }
  var cachedPreserveItems = false;
  var cachedPreserveItemsPlugins = null;
  function mustPreserveItems(state) {
    let plugins = state.plugins;
    if (cachedPreserveItemsPlugins != plugins) {
      cachedPreserveItems = false;
      cachedPreserveItemsPlugins = plugins;
      for (let i = 0; i < plugins.length; i++)
        if (plugins[i].spec.historyPreserveItems) {
          cachedPreserveItems = true;
          break;
        }
    }
    return cachedPreserveItems;
  }
  var historyKey = new PluginKey("history");
  var closeHistoryKey = new PluginKey("closeHistory");
  function history(config = {}) {
    config = {
      depth: config.depth || 100,
      newGroupDelay: config.newGroupDelay || 500
    };
    return new Plugin({
      key: historyKey,
      state: {
        init() {
          return new HistoryState(Branch.empty, Branch.empty, null, 0);
        },
        apply(tr, hist, state) {
          return applyTransaction(hist, state, tr, config);
        }
      },
      config,
      props: {
        handleDOMEvents: {
          beforeinput(view, e) {
            let inputType = e.inputType;
            let command = inputType == "historyUndo" ? undo : inputType == "historyRedo" ? redo : null;
            if (!command)
              return false;
            e.preventDefault();
            return command(view.state, view.dispatch);
          }
        }
      }
    });
  }
  var undo = (state, dispatch) => {
    let hist = historyKey.getState(state);
    if (!hist || hist.done.eventCount == 0)
      return false;
    if (dispatch)
      histTransaction(hist, state, dispatch, false);
    return true;
  };
  var redo = (state, dispatch) => {
    let hist = historyKey.getState(state);
    if (!hist || hist.undone.eventCount == 0)
      return false;
    if (dispatch)
      histTransaction(hist, state, dispatch, true);
    return true;
  };

  // node_modules/prosemirror-commands/dist/index.js
  var deleteSelection = (state, dispatch) => {
    if (state.selection.empty)
      return false;
    if (dispatch)
      dispatch(state.tr.deleteSelection().scrollIntoView());
    return true;
  };
  var joinBackward = (state, dispatch, view) => {
    let { $cursor } = state.selection;
    if (!$cursor || (view ? !view.endOfTextblock("backward", state) : $cursor.parentOffset > 0))
      return false;
    let $cut = findCutBefore($cursor);
    if (!$cut) {
      let range = $cursor.blockRange(), target = range && liftTarget(range);
      if (target == null)
        return false;
      if (dispatch)
        dispatch(state.tr.lift(range, target).scrollIntoView());
      return true;
    }
    let before = $cut.nodeBefore;
    if (!before.type.spec.isolating && deleteBarrier(state, $cut, dispatch))
      return true;
    if ($cursor.parent.content.size == 0 && (textblockAt(before, "end") || NodeSelection.isSelectable(before))) {
      let delStep = replaceStep(state.doc, $cursor.before(), $cursor.after(), Slice.empty);
      if (delStep && delStep.slice.size < delStep.to - delStep.from) {
        if (dispatch) {
          let tr = state.tr.step(delStep);
          tr.setSelection(textblockAt(before, "end") ? Selection.findFrom(tr.doc.resolve(tr.mapping.map($cut.pos, -1)), -1) : NodeSelection.create(tr.doc, $cut.pos - before.nodeSize));
          dispatch(tr.scrollIntoView());
        }
        return true;
      }
    }
    if (before.isAtom && $cut.depth == $cursor.depth - 1) {
      if (dispatch)
        dispatch(state.tr.delete($cut.pos - before.nodeSize, $cut.pos).scrollIntoView());
      return true;
    }
    return false;
  };
  function textblockAt(node, side, only = false) {
    for (let scan = node; scan; scan = side == "start" ? scan.firstChild : scan.lastChild) {
      if (scan.isTextblock)
        return true;
      if (only && scan.childCount != 1)
        return false;
    }
    return false;
  }
  var selectNodeBackward = (state, dispatch, view) => {
    let { $head, empty: empty2 } = state.selection, $cut = $head;
    if (!empty2)
      return false;
    if ($head.parent.isTextblock) {
      if (view ? !view.endOfTextblock("backward", state) : $head.parentOffset > 0)
        return false;
      $cut = findCutBefore($head);
    }
    let node = $cut && $cut.nodeBefore;
    if (!node || !NodeSelection.isSelectable(node))
      return false;
    if (dispatch)
      dispatch(state.tr.setSelection(NodeSelection.create(state.doc, $cut.pos - node.nodeSize)).scrollIntoView());
    return true;
  };
  function findCutBefore($pos) {
    if (!$pos.parent.type.spec.isolating)
      for (let i = $pos.depth - 1; i >= 0; i--) {
        if ($pos.index(i) > 0)
          return $pos.doc.resolve($pos.before(i + 1));
        if ($pos.node(i).type.spec.isolating)
          break;
      }
    return null;
  }
  var joinForward = (state, dispatch, view) => {
    let { $cursor } = state.selection;
    if (!$cursor || (view ? !view.endOfTextblock("forward", state) : $cursor.parentOffset < $cursor.parent.content.size))
      return false;
    let $cut = findCutAfter($cursor);
    if (!$cut)
      return false;
    let after = $cut.nodeAfter;
    if (deleteBarrier(state, $cut, dispatch))
      return true;
    if ($cursor.parent.content.size == 0 && (textblockAt(after, "start") || NodeSelection.isSelectable(after))) {
      let delStep = replaceStep(state.doc, $cursor.before(), $cursor.after(), Slice.empty);
      if (delStep && delStep.slice.size < delStep.to - delStep.from) {
        if (dispatch) {
          let tr = state.tr.step(delStep);
          tr.setSelection(textblockAt(after, "start") ? Selection.findFrom(tr.doc.resolve(tr.mapping.map($cut.pos)), 1) : NodeSelection.create(tr.doc, tr.mapping.map($cut.pos)));
          dispatch(tr.scrollIntoView());
        }
        return true;
      }
    }
    if (after.isAtom && $cut.depth == $cursor.depth - 1) {
      if (dispatch)
        dispatch(state.tr.delete($cut.pos, $cut.pos + after.nodeSize).scrollIntoView());
      return true;
    }
    return false;
  };
  var selectNodeForward = (state, dispatch, view) => {
    let { $head, empty: empty2 } = state.selection, $cut = $head;
    if (!empty2)
      return false;
    if ($head.parent.isTextblock) {
      if (view ? !view.endOfTextblock("forward", state) : $head.parentOffset < $head.parent.content.size)
        return false;
      $cut = findCutAfter($head);
    }
    let node = $cut && $cut.nodeAfter;
    if (!node || !NodeSelection.isSelectable(node))
      return false;
    if (dispatch)
      dispatch(state.tr.setSelection(NodeSelection.create(state.doc, $cut.pos)).scrollIntoView());
    return true;
  };
  function findCutAfter($pos) {
    if (!$pos.parent.type.spec.isolating)
      for (let i = $pos.depth - 1; i >= 0; i--) {
        let parent = $pos.node(i);
        if ($pos.index(i) + 1 < parent.childCount)
          return $pos.doc.resolve($pos.after(i + 1));
        if (parent.type.spec.isolating)
          break;
      }
    return null;
  }
  var joinUp = (state, dispatch) => {
    let sel = state.selection, nodeSel = sel instanceof NodeSelection, point;
    if (nodeSel) {
      if (sel.node.isTextblock || !canJoin(state.doc, sel.from))
        return false;
      point = sel.from;
    } else {
      point = joinPoint(state.doc, sel.from, -1);
      if (point == null)
        return false;
    }
    if (dispatch) {
      let tr = state.tr.join(point);
      if (nodeSel)
        tr.setSelection(NodeSelection.create(tr.doc, point - state.doc.resolve(point).nodeBefore.nodeSize));
      dispatch(tr.scrollIntoView());
    }
    return true;
  };
  var joinDown = (state, dispatch) => {
    let sel = state.selection, point;
    if (sel instanceof NodeSelection) {
      if (sel.node.isTextblock || !canJoin(state.doc, sel.to))
        return false;
      point = sel.to;
    } else {
      point = joinPoint(state.doc, sel.to, 1);
      if (point == null)
        return false;
    }
    if (dispatch)
      dispatch(state.tr.join(point).scrollIntoView());
    return true;
  };
  var lift2 = (state, dispatch) => {
    let { $from, $to } = state.selection;
    let range = $from.blockRange($to), target = range && liftTarget(range);
    if (target == null)
      return false;
    if (dispatch)
      dispatch(state.tr.lift(range, target).scrollIntoView());
    return true;
  };
  var newlineInCode = (state, dispatch) => {
    let { $head, $anchor } = state.selection;
    if (!$head.parent.type.spec.code || !$head.sameParent($anchor))
      return false;
    if (dispatch)
      dispatch(state.tr.insertText("\n").scrollIntoView());
    return true;
  };
  function defaultBlockAt(match) {
    for (let i = 0; i < match.edgeCount; i++) {
      let { type } = match.edge(i);
      if (type.isTextblock && !type.hasRequiredAttrs())
        return type;
    }
    return null;
  }
  var exitCode = (state, dispatch) => {
    let { $head, $anchor } = state.selection;
    if (!$head.parent.type.spec.code || !$head.sameParent($anchor))
      return false;
    let above = $head.node(-1), after = $head.indexAfter(-1), type = defaultBlockAt(above.contentMatchAt(after));
    if (!type || !above.canReplaceWith(after, after, type))
      return false;
    if (dispatch) {
      let pos = $head.after(), tr = state.tr.replaceWith(pos, pos, type.createAndFill());
      tr.setSelection(Selection.near(tr.doc.resolve(pos), 1));
      dispatch(tr.scrollIntoView());
    }
    return true;
  };
  var createParagraphNear = (state, dispatch) => {
    let sel = state.selection, { $from, $to } = sel;
    if (sel instanceof AllSelection || $from.parent.inlineContent || $to.parent.inlineContent)
      return false;
    let type = defaultBlockAt($to.parent.contentMatchAt($to.indexAfter()));
    if (!type || !type.isTextblock)
      return false;
    if (dispatch) {
      let side = (!$from.parentOffset && $to.index() < $to.parent.childCount ? $from : $to).pos;
      let tr = state.tr.insert(side, type.createAndFill());
      tr.setSelection(TextSelection.create(tr.doc, side + 1));
      dispatch(tr.scrollIntoView());
    }
    return true;
  };
  var liftEmptyBlock = (state, dispatch) => {
    let { $cursor } = state.selection;
    if (!$cursor || $cursor.parent.content.size)
      return false;
    if ($cursor.depth > 1 && $cursor.after() != $cursor.end(-1)) {
      let before = $cursor.before();
      if (canSplit(state.doc, before)) {
        if (dispatch)
          dispatch(state.tr.split(before).scrollIntoView());
        return true;
      }
    }
    let range = $cursor.blockRange(), target = range && liftTarget(range);
    if (target == null)
      return false;
    if (dispatch)
      dispatch(state.tr.lift(range, target).scrollIntoView());
    return true;
  };
  var splitBlock = (state, dispatch) => {
    let { $from, $to } = state.selection;
    if (state.selection instanceof NodeSelection && state.selection.node.isBlock) {
      if (!$from.parentOffset || !canSplit(state.doc, $from.pos))
        return false;
      if (dispatch)
        dispatch(state.tr.split($from.pos).scrollIntoView());
      return true;
    }
    if (!$from.parent.isBlock)
      return false;
    if (dispatch) {
      let atEnd = $to.parentOffset == $to.parent.content.size;
      let tr = state.tr;
      if (state.selection instanceof TextSelection || state.selection instanceof AllSelection)
        tr.deleteSelection();
      let deflt = $from.depth == 0 ? null : defaultBlockAt($from.node(-1).contentMatchAt($from.indexAfter(-1)));
      let types = atEnd && deflt ? [{ type: deflt }] : void 0;
      let can = canSplit(tr.doc, tr.mapping.map($from.pos), 1, types);
      if (!types && !can && canSplit(tr.doc, tr.mapping.map($from.pos), 1, deflt ? [{ type: deflt }] : void 0)) {
        if (deflt)
          types = [{ type: deflt }];
        can = true;
      }
      if (can) {
        tr.split(tr.mapping.map($from.pos), 1, types);
        if (!atEnd && !$from.parentOffset && $from.parent.type != deflt) {
          let first = tr.mapping.map($from.before()), $first = tr.doc.resolve(first);
          if (deflt && $from.node(-1).canReplaceWith($first.index(), $first.index() + 1, deflt))
            tr.setNodeMarkup(tr.mapping.map($from.before()), deflt);
        }
      }
      dispatch(tr.scrollIntoView());
    }
    return true;
  };
  var selectParentNode = (state, dispatch) => {
    let { $from, to } = state.selection, pos;
    let same = $from.sharedDepth(to);
    if (same == 0)
      return false;
    pos = $from.before(same);
    if (dispatch)
      dispatch(state.tr.setSelection(NodeSelection.create(state.doc, pos)));
    return true;
  };
  var selectAll = (state, dispatch) => {
    if (dispatch)
      dispatch(state.tr.setSelection(new AllSelection(state.doc)));
    return true;
  };
  function joinMaybeClear(state, $pos, dispatch) {
    let before = $pos.nodeBefore, after = $pos.nodeAfter, index = $pos.index();
    if (!before || !after || !before.type.compatibleContent(after.type))
      return false;
    if (!before.content.size && $pos.parent.canReplace(index - 1, index)) {
      if (dispatch)
        dispatch(state.tr.delete($pos.pos - before.nodeSize, $pos.pos).scrollIntoView());
      return true;
    }
    if (!$pos.parent.canReplace(index, index + 1) || !(after.isTextblock || canJoin(state.doc, $pos.pos)))
      return false;
    if (dispatch)
      dispatch(state.tr.clearIncompatible($pos.pos, before.type, before.contentMatchAt(before.childCount)).join($pos.pos).scrollIntoView());
    return true;
  }
  function deleteBarrier(state, $cut, dispatch) {
    let before = $cut.nodeBefore, after = $cut.nodeAfter, conn, match;
    if (before.type.spec.isolating || after.type.spec.isolating)
      return false;
    if (joinMaybeClear(state, $cut, dispatch))
      return true;
    let canDelAfter = $cut.parent.canReplace($cut.index(), $cut.index() + 1);
    if (canDelAfter && (conn = (match = before.contentMatchAt(before.childCount)).findWrapping(after.type)) && match.matchType(conn[0] || after.type).validEnd) {
      if (dispatch) {
        let end = $cut.pos + after.nodeSize, wrap2 = Fragment.empty;
        for (let i = conn.length - 1; i >= 0; i--)
          wrap2 = Fragment.from(conn[i].create(null, wrap2));
        wrap2 = Fragment.from(before.copy(wrap2));
        let tr = state.tr.step(new ReplaceAroundStep($cut.pos - 1, end, $cut.pos, end, new Slice(wrap2, 1, 0), conn.length, true));
        let joinAt = end + 2 * conn.length;
        if (canJoin(tr.doc, joinAt))
          tr.join(joinAt);
        dispatch(tr.scrollIntoView());
      }
      return true;
    }
    let selAfter = Selection.findFrom($cut, 1);
    let range = selAfter && selAfter.$from.blockRange(selAfter.$to), target = range && liftTarget(range);
    if (target != null && target >= $cut.depth) {
      if (dispatch)
        dispatch(state.tr.lift(range, target).scrollIntoView());
      return true;
    }
    if (canDelAfter && textblockAt(after, "start", true) && textblockAt(before, "end")) {
      let at = before, wrap2 = [];
      for (; ; ) {
        wrap2.push(at);
        if (at.isTextblock)
          break;
        at = at.lastChild;
      }
      let afterText = after, afterDepth = 1;
      for (; !afterText.isTextblock; afterText = afterText.firstChild)
        afterDepth++;
      if (at.canReplace(at.childCount, at.childCount, afterText.content)) {
        if (dispatch) {
          let end = Fragment.empty;
          for (let i = wrap2.length - 1; i >= 0; i--)
            end = Fragment.from(wrap2[i].copy(end));
          let tr = state.tr.step(new ReplaceAroundStep($cut.pos - wrap2.length, $cut.pos + after.nodeSize, $cut.pos + afterDepth, $cut.pos + after.nodeSize - afterDepth, new Slice(end, wrap2.length, 0), 0, true));
          dispatch(tr.scrollIntoView());
        }
        return true;
      }
    }
    return false;
  }
  function selectTextblockSide(side) {
    return function(state, dispatch) {
      let sel = state.selection, $pos = side < 0 ? sel.$from : sel.$to;
      let depth = $pos.depth;
      while ($pos.node(depth).isInline) {
        if (!depth)
          return false;
        depth--;
      }
      if (!$pos.node(depth).isTextblock)
        return false;
      if (dispatch)
        dispatch(state.tr.setSelection(TextSelection.create(state.doc, side < 0 ? $pos.start(depth) : $pos.end(depth))));
      return true;
    };
  }
  var selectTextblockStart = selectTextblockSide(-1);
  var selectTextblockEnd = selectTextblockSide(1);
  function wrapIn(nodeType, attrs = null) {
    return function(state, dispatch) {
      let { $from, $to } = state.selection;
      let range = $from.blockRange($to), wrapping = range && findWrapping(range, nodeType, attrs);
      if (!wrapping)
        return false;
      if (dispatch)
        dispatch(state.tr.wrap(range, wrapping).scrollIntoView());
      return true;
    };
  }
  function setBlockType2(nodeType, attrs = null) {
    return function(state, dispatch) {
      let { from: from2, to } = state.selection;
      let applicable = false;
      state.doc.nodesBetween(from2, to, (node, pos) => {
        if (applicable)
          return false;
        if (!node.isTextblock || node.hasMarkup(nodeType, attrs))
          return;
        if (node.type == nodeType) {
          applicable = true;
        } else {
          let $pos = state.doc.resolve(pos), index = $pos.index();
          applicable = $pos.parent.canReplaceWith(index, index + 1, nodeType);
        }
      });
      if (!applicable)
        return false;
      if (dispatch)
        dispatch(state.tr.setBlockType(from2, to, nodeType, attrs).scrollIntoView());
      return true;
    };
  }
  function markApplies(doc3, ranges, type) {
    for (let i = 0; i < ranges.length; i++) {
      let { $from, $to } = ranges[i];
      let can = $from.depth == 0 ? doc3.type.allowsMarkType(type) : false;
      doc3.nodesBetween($from.pos, $to.pos, (node) => {
        if (can)
          return false;
        can = node.inlineContent && node.type.allowsMarkType(type);
      });
      if (can)
        return true;
    }
    return false;
  }
  function toggleMark(markType, attrs = null) {
    return function(state, dispatch) {
      let { empty: empty2, $cursor, ranges } = state.selection;
      if (empty2 && !$cursor || !markApplies(state.doc, ranges, markType))
        return false;
      if (dispatch) {
        if ($cursor) {
          if (markType.isInSet(state.storedMarks || $cursor.marks()))
            dispatch(state.tr.removeStoredMark(markType));
          else
            dispatch(state.tr.addStoredMark(markType.create(attrs)));
        } else {
          let has = false, tr = state.tr;
          for (let i = 0; !has && i < ranges.length; i++) {
            let { $from, $to } = ranges[i];
            has = state.doc.rangeHasMark($from.pos, $to.pos, markType);
          }
          for (let i = 0; i < ranges.length; i++) {
            let { $from, $to } = ranges[i];
            if (has) {
              tr.removeMark($from.pos, $to.pos, markType);
            } else {
              let from2 = $from.pos, to = $to.pos, start = $from.nodeAfter, end = $to.nodeBefore;
              let spaceStart = start && start.isText ? /^\s*/.exec(start.text)[0].length : 0;
              let spaceEnd = end && end.isText ? /\s*$/.exec(end.text)[0].length : 0;
              if (from2 + spaceStart < to) {
                from2 += spaceStart;
                to -= spaceEnd;
              }
              tr.addMark(from2, to, markType.create(attrs));
            }
          }
          dispatch(tr.scrollIntoView());
        }
      }
      return true;
    };
  }
  function chainCommands(...commands) {
    return function(state, dispatch, view) {
      for (let i = 0; i < commands.length; i++)
        if (commands[i](state, dispatch, view))
          return true;
      return false;
    };
  }
  var backspace = chainCommands(deleteSelection, joinBackward, selectNodeBackward);
  var del = chainCommands(deleteSelection, joinForward, selectNodeForward);
  var pcBaseKeymap = {
    "Enter": chainCommands(newlineInCode, createParagraphNear, liftEmptyBlock, splitBlock),
    "Mod-Enter": exitCode,
    "Backspace": backspace,
    "Mod-Backspace": backspace,
    "Shift-Backspace": backspace,
    "Delete": del,
    "Mod-Delete": del,
    "Mod-a": selectAll
  };
  var macBaseKeymap = {
    "Ctrl-h": pcBaseKeymap["Backspace"],
    "Alt-Backspace": pcBaseKeymap["Mod-Backspace"],
    "Ctrl-d": pcBaseKeymap["Delete"],
    "Ctrl-Alt-Backspace": pcBaseKeymap["Mod-Delete"],
    "Alt-Delete": pcBaseKeymap["Mod-Delete"],
    "Alt-d": pcBaseKeymap["Mod-Delete"],
    "Ctrl-a": selectTextblockStart,
    "Ctrl-e": selectTextblockEnd
  };
  for (let key2 in pcBaseKeymap)
    macBaseKeymap[key2] = pcBaseKeymap[key2];
  var mac4 = typeof navigator != "undefined" ? /Mac|iP(hone|[oa]d)/.test(navigator.platform) : typeof os != "undefined" && os.platform ? os.platform() == "darwin" : false;
  var baseKeymap = mac4 ? macBaseKeymap : pcBaseKeymap;

  // node_modules/prosemirror-dropcursor/dist/index.js
  function dropCursor(options = {}) {
    return new Plugin({
      view(editorView) {
        return new DropCursorView(editorView, options);
      }
    });
  }
  var DropCursorView = class {
    constructor(editorView, options) {
      this.editorView = editorView;
      this.cursorPos = null;
      this.element = null;
      this.timeout = -1;
      this.width = options.width || 1;
      this.color = options.color || "black";
      this.class = options.class;
      this.handlers = ["dragover", "dragend", "drop", "dragleave"].map((name) => {
        let handler = (e) => {
          this[name](e);
        };
        editorView.dom.addEventListener(name, handler);
        return { name, handler };
      });
    }
    destroy() {
      this.handlers.forEach(({ name, handler }) => this.editorView.dom.removeEventListener(name, handler));
    }
    update(editorView, prevState) {
      if (this.cursorPos != null && prevState.doc != editorView.state.doc) {
        if (this.cursorPos > editorView.state.doc.content.size)
          this.setCursor(null);
        else
          this.updateOverlay();
      }
    }
    setCursor(pos) {
      if (pos == this.cursorPos)
        return;
      this.cursorPos = pos;
      if (pos == null) {
        this.element.parentNode.removeChild(this.element);
        this.element = null;
      } else {
        this.updateOverlay();
      }
    }
    updateOverlay() {
      let $pos = this.editorView.state.doc.resolve(this.cursorPos), rect;
      if (!$pos.parent.inlineContent) {
        let before = $pos.nodeBefore, after = $pos.nodeAfter;
        if (before || after) {
          let nodeRect = this.editorView.nodeDOM(this.cursorPos - (before ? before.nodeSize : 0)).getBoundingClientRect();
          let top = before ? nodeRect.bottom : nodeRect.top;
          if (before && after)
            top = (top + this.editorView.nodeDOM(this.cursorPos).getBoundingClientRect().top) / 2;
          rect = { left: nodeRect.left, right: nodeRect.right, top: top - this.width / 2, bottom: top + this.width / 2 };
        }
      }
      if (!rect) {
        let coords = this.editorView.coordsAtPos(this.cursorPos);
        rect = { left: coords.left - this.width / 2, right: coords.left + this.width / 2, top: coords.top, bottom: coords.bottom };
      }
      let parent = this.editorView.dom.offsetParent;
      if (!this.element) {
        this.element = parent.appendChild(document.createElement("div"));
        if (this.class)
          this.element.className = this.class;
        this.element.style.cssText = "position: absolute; z-index: 50; pointer-events: none; background-color: " + this.color;
      }
      let parentLeft, parentTop;
      if (!parent || parent == document.body && getComputedStyle(parent).position == "static") {
        parentLeft = -pageXOffset;
        parentTop = -pageYOffset;
      } else {
        let rect2 = parent.getBoundingClientRect();
        parentLeft = rect2.left - parent.scrollLeft;
        parentTop = rect2.top - parent.scrollTop;
      }
      this.element.style.left = rect.left - parentLeft + "px";
      this.element.style.top = rect.top - parentTop + "px";
      this.element.style.width = rect.right - rect.left + "px";
      this.element.style.height = rect.bottom - rect.top + "px";
    }
    scheduleRemoval(timeout) {
      clearTimeout(this.timeout);
      this.timeout = setTimeout(() => this.setCursor(null), timeout);
    }
    dragover(event) {
      if (!this.editorView.editable)
        return;
      let pos = this.editorView.posAtCoords({ left: event.clientX, top: event.clientY });
      let node = pos && pos.inside >= 0 && this.editorView.state.doc.nodeAt(pos.inside);
      let disableDropCursor = node && node.type.spec.disableDropCursor;
      let disabled = typeof disableDropCursor == "function" ? disableDropCursor(this.editorView, pos) : disableDropCursor;
      if (pos && !disabled) {
        let target = pos.pos;
        if (this.editorView.dragging && this.editorView.dragging.slice) {
          target = dropPoint(this.editorView.state.doc, target, this.editorView.dragging.slice);
          if (target == null)
            return this.setCursor(null);
        }
        this.setCursor(target);
        this.scheduleRemoval(5e3);
      }
    }
    dragend() {
      this.scheduleRemoval(20);
    }
    drop() {
      this.scheduleRemoval(20);
    }
    dragleave(event) {
      if (event.target == this.editorView.dom || !this.editorView.dom.contains(event.relatedTarget))
        this.setCursor(null);
    }
  };

  // node_modules/crelt/index.es.js
  function crelt() {
    var elt = arguments[0];
    if (typeof elt == "string")
      elt = document.createElement(elt);
    var i = 1, next = arguments[1];
    if (next && typeof next == "object" && next.nodeType == null && !Array.isArray(next)) {
      for (var name in next)
        if (Object.prototype.hasOwnProperty.call(next, name)) {
          var value = next[name];
          if (typeof value == "string")
            elt.setAttribute(name, value);
          else if (value != null)
            elt[name] = value;
        }
      i++;
    }
    for (; i < arguments.length; i++)
      add(elt, arguments[i]);
    return elt;
  }
  function add(elt, child) {
    if (typeof child == "string") {
      elt.appendChild(document.createTextNode(child));
    } else if (child == null) {
    } else if (child.nodeType != null) {
      elt.appendChild(child);
    } else if (Array.isArray(child)) {
      for (var i = 0; i < child.length; i++)
        add(elt, child[i]);
    } else {
      throw new RangeError("Unsupported child node: " + child);
    }
  }

  // node_modules/prosemirror-menu/dist/index.js
  var SVG = "http://www.w3.org/2000/svg";
  var XLINK = "http://www.w3.org/1999/xlink";
  var prefix$2 = "ProseMirror-icon";
  function hashPath(path) {
    let hash = 0;
    for (let i = 0; i < path.length; i++)
      hash = (hash << 5) - hash + path.charCodeAt(i) | 0;
    return hash;
  }
  function getIcon(icon) {
    let node = document.createElement("div");
    node.className = prefix$2;
    if (icon.path) {
      let { path, width, height } = icon;
      let name = "pm-icon-" + hashPath(path).toString(16);
      if (!document.getElementById(name))
        buildSVG(name, icon);
      let svg = node.appendChild(document.createElementNS(SVG, "svg"));
      svg.style.width = width / height + "em";
      let use = svg.appendChild(document.createElementNS(SVG, "use"));
      use.setAttributeNS(XLINK, "href", /([^#]*)/.exec(document.location.toString())[1] + "#" + name);
    } else if (icon.dom) {
      node.appendChild(icon.dom.cloneNode(true));
    } else {
      let { text, css } = icon;
      node.appendChild(document.createElement("span")).textContent = text || "";
      if (css)
        node.firstChild.style.cssText = css;
    }
    return node;
  }
  function buildSVG(name, data) {
    let collection = document.getElementById(prefix$2 + "-collection");
    if (!collection) {
      collection = document.createElementNS(SVG, "svg");
      collection.id = prefix$2 + "-collection";
      collection.style.display = "none";
      document.body.insertBefore(collection, document.body.firstChild);
    }
    let sym = document.createElementNS(SVG, "symbol");
    sym.id = name;
    sym.setAttribute("viewBox", "0 0 " + data.width + " " + data.height);
    let path = sym.appendChild(document.createElementNS(SVG, "path"));
    path.setAttribute("d", data.path);
    collection.appendChild(sym);
  }
  var prefix$1 = "ProseMirror-menu";
  var MenuItem = class {
    constructor(spec) {
      this.spec = spec;
    }
    render(view) {
      let spec = this.spec;
      let dom = spec.render ? spec.render(view) : spec.icon ? getIcon(spec.icon) : spec.label ? crelt("div", null, translate(view, spec.label)) : null;
      if (!dom)
        throw new RangeError("MenuItem without icon or label property");
      if (spec.title) {
        const title = typeof spec.title === "function" ? spec.title(view.state) : spec.title;
        dom.setAttribute("title", translate(view, title));
      }
      if (spec.class)
        dom.classList.add(spec.class);
      if (spec.css)
        dom.style.cssText += spec.css;
      dom.addEventListener("mousedown", (e) => {
        e.preventDefault();
        if (!dom.classList.contains(prefix$1 + "-disabled"))
          spec.run(view.state, view.dispatch, view, e);
      });
      function update(state) {
        if (spec.select) {
          let selected = spec.select(state);
          dom.style.display = selected ? "" : "none";
          if (!selected)
            return false;
        }
        let enabled = true;
        if (spec.enable) {
          enabled = spec.enable(state) || false;
          setClass(dom, prefix$1 + "-disabled", !enabled);
        }
        if (spec.active) {
          let active = enabled && spec.active(state) || false;
          setClass(dom, prefix$1 + "-active", active);
        }
        return true;
      }
      return { dom, update };
    }
  };
  function translate(view, text) {
    return view._props.translate ? view._props.translate(text) : text;
  }
  var lastMenuEvent = { time: 0, node: null };
  function markMenuEvent(e) {
    lastMenuEvent.time = Date.now();
    lastMenuEvent.node = e.target;
  }
  function isMenuEvent(wrapper) {
    return Date.now() - 100 < lastMenuEvent.time && lastMenuEvent.node && wrapper.contains(lastMenuEvent.node);
  }
  var Dropdown = class {
    constructor(content, options = {}) {
      this.options = options;
      this.options = options || {};
      this.content = Array.isArray(content) ? content : [content];
    }
    render(view) {
      let content = renderDropdownItems(this.content, view);
      let label = crelt("div", {
        class: prefix$1 + "-dropdown " + (this.options.class || ""),
        style: this.options.css
      }, translate(view, this.options.label || ""));
      if (this.options.title)
        label.setAttribute("title", translate(view, this.options.title));
      let wrap2 = crelt("div", { class: prefix$1 + "-dropdown-wrap" }, label);
      let open = null;
      let listeningOnClose = null;
      let close2 = () => {
        if (open && open.close()) {
          open = null;
          window.removeEventListener("mousedown", listeningOnClose);
        }
      };
      label.addEventListener("mousedown", (e) => {
        e.preventDefault();
        markMenuEvent(e);
        if (open) {
          close2();
        } else {
          open = this.expand(wrap2, content.dom);
          window.addEventListener("mousedown", listeningOnClose = () => {
            if (!isMenuEvent(wrap2))
              close2();
          });
        }
      });
      function update(state) {
        let inner = content.update(state);
        wrap2.style.display = inner ? "" : "none";
        return inner;
      }
      return { dom: wrap2, update };
    }
    expand(dom, items) {
      let menuDOM = crelt("div", { class: prefix$1 + "-dropdown-menu " + (this.options.class || "") }, items);
      let done = false;
      function close2() {
        if (done)
          return;
        done = true;
        dom.removeChild(menuDOM);
        return true;
      }
      dom.appendChild(menuDOM);
      return { close: close2, node: menuDOM };
    }
  };
  function renderDropdownItems(items, view) {
    let rendered = [], updates = [];
    for (let i = 0; i < items.length; i++) {
      let { dom, update } = items[i].render(view);
      rendered.push(crelt("div", { class: prefix$1 + "-dropdown-item" }, dom));
      updates.push(update);
    }
    return { dom: rendered, update: combineUpdates(updates, rendered) };
  }
  function combineUpdates(updates, nodes2) {
    return (state) => {
      let something = false;
      for (let i = 0; i < updates.length; i++) {
        let up = updates[i](state);
        nodes2[i].style.display = up ? "" : "none";
        if (up)
          something = true;
      }
      return something;
    };
  }
  var DropdownSubmenu = class {
    constructor(content, options = {}) {
      this.options = options;
      this.content = Array.isArray(content) ? content : [content];
    }
    render(view) {
      let items = renderDropdownItems(this.content, view);
      let label = crelt("div", { class: prefix$1 + "-submenu-label" }, translate(view, this.options.label || ""));
      let wrap2 = crelt("div", { class: prefix$1 + "-submenu-wrap" }, label, crelt("div", { class: prefix$1 + "-submenu" }, items.dom));
      let listeningOnClose = null;
      label.addEventListener("mousedown", (e) => {
        e.preventDefault();
        markMenuEvent(e);
        setClass(wrap2, prefix$1 + "-submenu-wrap-active", false);
        if (!listeningOnClose)
          window.addEventListener("mousedown", listeningOnClose = () => {
            if (!isMenuEvent(wrap2)) {
              wrap2.classList.remove(prefix$1 + "-submenu-wrap-active");
              window.removeEventListener("mousedown", listeningOnClose);
              listeningOnClose = null;
            }
          });
      });
      function update(state) {
        let inner = items.update(state);
        wrap2.style.display = inner ? "" : "none";
        return inner;
      }
      return { dom: wrap2, update };
    }
  };
  function renderGrouped(view, content) {
    let result = document.createDocumentFragment();
    let updates = [], separators = [];
    for (let i = 0; i < content.length; i++) {
      let items = content[i], localUpdates = [], localNodes = [];
      for (let j = 0; j < items.length; j++) {
        let { dom, update: update2 } = items[j].render(view);
        let span = crelt("span", { class: prefix$1 + "item" }, dom);
        result.appendChild(span);
        localNodes.push(span);
        localUpdates.push(update2);
      }
      if (localUpdates.length) {
        updates.push(combineUpdates(localUpdates, localNodes));
        if (i < content.length - 1)
          separators.push(result.appendChild(separator()));
      }
    }
    function update(state) {
      let something = false, needSep = false;
      for (let i = 0; i < updates.length; i++) {
        let hasContent = updates[i](state);
        if (i)
          separators[i - 1].style.display = needSep && hasContent ? "" : "none";
        needSep = hasContent;
        if (hasContent)
          something = true;
      }
      return something;
    }
    return { dom: result, update };
  }
  function separator() {
    return crelt("span", { class: prefix$1 + "separator" });
  }
  var icons = {
    join: {
      width: 800,
      height: 900,
      path: "M0 75h800v125h-800z M0 825h800v-125h-800z M250 400h100v-100h100v100h100v100h-100v100h-100v-100h-100z"
    },
    lift: {
      width: 1024,
      height: 1024,
      path: "M219 310v329q0 7-5 12t-12 5q-8 0-13-5l-164-164q-5-5-5-13t5-13l164-164q5-5 13-5 7 0 12 5t5 12zM1024 749v109q0 7-5 12t-12 5h-987q-7 0-12-5t-5-12v-109q0-7 5-12t12-5h987q7 0 12 5t5 12zM1024 530v109q0 7-5 12t-12 5h-621q-7 0-12-5t-5-12v-109q0-7 5-12t12-5h621q7 0 12 5t5 12zM1024 310v109q0 7-5 12t-12 5h-621q-7 0-12-5t-5-12v-109q0-7 5-12t12-5h621q7 0 12 5t5 12zM1024 91v109q0 7-5 12t-12 5h-987q-7 0-12-5t-5-12v-109q0-7 5-12t12-5h987q7 0 12 5t5 12z"
    },
    selectParentNode: { text: "\u2B1A", css: "font-weight: bold" },
    undo: {
      width: 1024,
      height: 1024,
      path: "M761 1024c113-206 132-520-313-509v253l-384-384 384-384v248c534-13 594 472 313 775z"
    },
    redo: {
      width: 1024,
      height: 1024,
      path: "M576 248v-248l384 384-384 384v-253c-446-10-427 303-313 509-280-303-221-789 313-775z"
    },
    strong: {
      width: 805,
      height: 1024,
      path: "M317 869q42 18 80 18 214 0 214-191 0-65-23-102-15-25-35-42t-38-26-46-14-48-6-54-1q-41 0-57 5 0 30-0 90t-0 90q0 4-0 38t-0 55 2 47 6 38zM309 442q24 4 62 4 46 0 81-7t62-25 42-51 14-81q0-40-16-70t-45-46-61-24-70-8q-28 0-74 7 0 28 2 86t2 86q0 15-0 45t-0 45q0 26 0 39zM0 950l1-53q8-2 48-9t60-15q4-6 7-15t4-19 3-18 1-21 0-19v-37q0-561-12-585-2-4-12-8t-25-6-28-4-27-2-17-1l-2-47q56-1 194-6t213-5q13 0 39 0t38 0q40 0 78 7t73 24 61 40 42 59 16 78q0 29-9 54t-22 41-36 32-41 25-48 22q88 20 146 76t58 141q0 57-20 102t-53 74-78 48-93 27-100 8q-25 0-75-1t-75-1q-60 0-175 6t-132 6z"
    },
    em: {
      width: 585,
      height: 1024,
      path: "M0 949l9-48q3-1 46-12t63-21q16-20 23-57 0-4 35-165t65-310 29-169v-14q-13-7-31-10t-39-4-33-3l10-58q18 1 68 3t85 4 68 1q27 0 56-1t69-4 56-3q-2 22-10 50-17 5-58 16t-62 19q-4 10-8 24t-5 22-4 26-3 24q-15 84-50 239t-44 203q-1 5-7 33t-11 51-9 47-3 32l0 10q9 2 105 17-1 25-9 56-6 0-18 0t-18 0q-16 0-49-5t-49-5q-78-1-117-1-29 0-81 5t-69 6z"
    },
    code: {
      width: 896,
      height: 1024,
      path: "M608 192l-96 96 224 224-224 224 96 96 288-320-288-320zM288 192l-288 320 288 320 96-96-224-224 224-224-96-96z"
    },
    link: {
      width: 951,
      height: 1024,
      path: "M832 694q0-22-16-38l-118-118q-16-16-38-16-24 0-41 18 1 1 10 10t12 12 8 10 7 14 2 15q0 22-16 38t-38 16q-8 0-15-2t-14-7-10-8-12-12-10-10q-18 17-18 41 0 22 16 38l117 118q15 15 38 15 22 0 38-14l84-83q16-16 16-38zM430 292q0-22-16-38l-117-118q-16-16-38-16-22 0-38 15l-84 83q-16 16-16 38 0 22 16 38l118 118q15 15 38 15 24 0 41-17-1-1-10-10t-12-12-8-10-7-14-2-15q0-22 16-38t38-16q8 0 15 2t14 7 10 8 12 12 10 10q18-17 18-41zM941 694q0 68-48 116l-84 83q-47 47-116 47-69 0-116-48l-117-118q-47-47-47-116 0-70 50-119l-50-50q-49 50-118 50-68 0-116-48l-118-118q-48-48-48-116t48-116l84-83q47-47 116-47 69 0 116 48l117 118q47 47 47 116 0 70-50 119l50 50q49-50 118-50 68 0 116 48l118 118q48 48 48 116z"
    },
    bulletList: {
      width: 768,
      height: 896,
      path: "M0 512h128v-128h-128v128zM0 256h128v-128h-128v128zM0 768h128v-128h-128v128zM256 512h512v-128h-512v128zM256 256h512v-128h-512v128zM256 768h512v-128h-512v128z"
    },
    orderedList: {
      width: 768,
      height: 896,
      path: "M320 512h448v-128h-448v128zM320 768h448v-128h-448v128zM320 128v128h448v-128h-448zM79 384h78v-256h-36l-85 23v50l43-2v185zM189 590c0-36-12-78-96-78-33 0-64 6-83 16l1 66c21-10 42-15 67-15s32 11 32 28c0 26-30 58-110 112v50h192v-67l-91 2c49-30 87-66 87-113l1-1z"
    },
    blockquote: {
      width: 640,
      height: 896,
      path: "M0 448v256h256v-256h-128c0 0 0-128 128-128v-128c0 0-256 0-256 256zM640 320v-128c0 0-256 0-256 256v256h256v-256h-128c0 0 0-128 128-128z"
    }
  };
  var joinUpItem = new MenuItem({
    title: "Join with above block",
    run: joinUp,
    select: (state) => joinUp(state),
    icon: icons.join
  });
  var liftItem = new MenuItem({
    title: "Lift out of enclosing block",
    run: lift2,
    select: (state) => lift2(state),
    icon: icons.lift
  });
  var selectParentNodeItem = new MenuItem({
    title: "Select parent node",
    run: selectParentNode,
    select: (state) => selectParentNode(state),
    icon: icons.selectParentNode
  });
  var undoItem = new MenuItem({
    title: "Undo last change",
    run: undo,
    enable: (state) => undo(state),
    icon: icons.undo
  });
  var redoItem = new MenuItem({
    title: "Redo last undone change",
    run: redo,
    enable: (state) => redo(state),
    icon: icons.redo
  });
  function wrapItem(nodeType, options) {
    let passedOptions = {
      run(state, dispatch) {
        return wrapIn(nodeType, options.attrs)(state, dispatch);
      },
      select(state) {
        return wrapIn(nodeType, options.attrs)(state);
      }
    };
    for (let prop in options)
      passedOptions[prop] = options[prop];
    return new MenuItem(passedOptions);
  }
  function blockTypeItem(nodeType, options) {
    let command = setBlockType2(nodeType, options.attrs);
    let passedOptions = {
      run: command,
      enable(state) {
        return command(state);
      },
      active(state) {
        let { $from, to, node } = state.selection;
        if (node)
          return node.hasMarkup(nodeType, options.attrs);
        return to <= $from.end() && $from.parent.hasMarkup(nodeType, options.attrs);
      }
    };
    for (let prop in options)
      passedOptions[prop] = options[prop];
    return new MenuItem(passedOptions);
  }
  function setClass(dom, cls, on) {
    if (on)
      dom.classList.add(cls);
    else
      dom.classList.remove(cls);
  }
  var prefix = "ProseMirror-menubar";
  function isIOS() {
    if (typeof navigator == "undefined")
      return false;
    let agent2 = navigator.userAgent;
    return !/Edge\/\d/.test(agent2) && /AppleWebKit/.test(agent2) && /Mobile\/\w+/.test(agent2);
  }
  function menuBar(options) {
    return new Plugin({
      view(editorView) {
        return new MenuBarView(editorView, options);
      }
    });
  }
  var MenuBarView = class {
    constructor(editorView, options) {
      this.editorView = editorView;
      this.options = options;
      this.spacer = null;
      this.maxHeight = 0;
      this.widthForMaxHeight = 0;
      this.floating = false;
      this.scrollHandler = null;
      this.wrapper = crelt("div", { class: prefix + "-wrapper" });
      this.menu = this.wrapper.appendChild(crelt("div", { class: prefix }));
      this.menu.className = prefix;
      if (editorView.dom.parentNode)
        editorView.dom.parentNode.replaceChild(this.wrapper, editorView.dom);
      this.wrapper.appendChild(editorView.dom);
      let { dom, update } = renderGrouped(this.editorView, this.options.content);
      this.contentUpdate = update;
      this.menu.appendChild(dom);
      this.update();
      if (options.floating && !isIOS()) {
        this.updateFloat();
        let potentialScrollers = getAllWrapping(this.wrapper);
        this.scrollHandler = (e) => {
          let root = this.editorView.root;
          if (!(root.body || root).contains(this.wrapper))
            potentialScrollers.forEach((el) => el.removeEventListener("scroll", this.scrollHandler));
          else
            this.updateFloat(e.target.getBoundingClientRect ? e.target : void 0);
        };
        potentialScrollers.forEach((el) => el.addEventListener("scroll", this.scrollHandler));
      }
    }
    update() {
      this.contentUpdate(this.editorView.state);
      if (this.floating) {
        this.updateScrollCursor();
      } else {
        if (this.menu.offsetWidth != this.widthForMaxHeight) {
          this.widthForMaxHeight = this.menu.offsetWidth;
          this.maxHeight = 0;
        }
        if (this.menu.offsetHeight > this.maxHeight) {
          this.maxHeight = this.menu.offsetHeight;
          this.menu.style.minHeight = this.maxHeight + "px";
        }
      }
    }
    updateScrollCursor() {
      let selection = this.editorView.root.getSelection();
      if (!selection.focusNode)
        return;
      let rects = selection.getRangeAt(0).getClientRects();
      let selRect = rects[selectionIsInverted(selection) ? 0 : rects.length - 1];
      if (!selRect)
        return;
      let menuRect = this.menu.getBoundingClientRect();
      if (selRect.top < menuRect.bottom && selRect.bottom > menuRect.top) {
        let scrollable = findWrappingScrollable(this.wrapper);
        if (scrollable)
          scrollable.scrollTop -= menuRect.bottom - selRect.top;
      }
    }
    updateFloat(scrollAncestor) {
      let parent = this.wrapper, editorRect = parent.getBoundingClientRect(), top = scrollAncestor ? Math.max(0, scrollAncestor.getBoundingClientRect().top) : 0;
      if (this.floating) {
        if (editorRect.top >= top || editorRect.bottom < this.menu.offsetHeight + 10) {
          this.floating = false;
          this.menu.style.position = this.menu.style.left = this.menu.style.top = this.menu.style.width = "";
          this.menu.style.display = "";
          this.spacer.parentNode.removeChild(this.spacer);
          this.spacer = null;
        } else {
          let border = (parent.offsetWidth - parent.clientWidth) / 2;
          this.menu.style.left = editorRect.left + border + "px";
          this.menu.style.display = editorRect.top > window.innerHeight ? "none" : "";
          if (scrollAncestor)
            this.menu.style.top = top + "px";
        }
      } else {
        if (editorRect.top < top && editorRect.bottom >= this.menu.offsetHeight + 10) {
          this.floating = true;
          let menuRect = this.menu.getBoundingClientRect();
          this.menu.style.left = menuRect.left + "px";
          this.menu.style.width = menuRect.width + "px";
          if (scrollAncestor)
            this.menu.style.top = top + "px";
          this.menu.style.position = "fixed";
          this.spacer = crelt("div", { class: prefix + "-spacer", style: `height: ${menuRect.height}px` });
          parent.insertBefore(this.spacer, this.menu);
        }
      }
    }
    destroy() {
      if (this.wrapper.parentNode)
        this.wrapper.parentNode.replaceChild(this.editorView.dom, this.wrapper);
    }
  };
  function selectionIsInverted(selection) {
    if (selection.anchorNode == selection.focusNode)
      return selection.anchorOffset > selection.focusOffset;
    return selection.anchorNode.compareDocumentPosition(selection.focusNode) == Node.DOCUMENT_POSITION_FOLLOWING;
  }
  function findWrappingScrollable(node) {
    for (let cur = node.parentNode; cur; cur = cur.parentNode)
      if (cur.scrollHeight > cur.clientHeight)
        return cur;
  }
  function getAllWrapping(node) {
    let res = [window];
    for (let cur = node.parentNode; cur; cur = cur.parentNode)
      res.push(cur);
    return res;
  }

  // node_modules/prosemirror-gapcursor/dist/index.js
  var GapCursor = class extends Selection {
    constructor($pos) {
      super($pos, $pos);
    }
    map(doc3, mapping) {
      let $pos = doc3.resolve(mapping.map(this.head));
      return GapCursor.valid($pos) ? new GapCursor($pos) : Selection.near($pos);
    }
    content() {
      return Slice.empty;
    }
    eq(other) {
      return other instanceof GapCursor && other.head == this.head;
    }
    toJSON() {
      return { type: "gapcursor", pos: this.head };
    }
    static fromJSON(doc3, json) {
      if (typeof json.pos != "number")
        throw new RangeError("Invalid input for GapCursor.fromJSON");
      return new GapCursor(doc3.resolve(json.pos));
    }
    getBookmark() {
      return new GapBookmark(this.anchor);
    }
    static valid($pos) {
      let parent = $pos.parent;
      if (parent.isTextblock || !closedBefore($pos) || !closedAfter($pos))
        return false;
      let override = parent.type.spec.allowGapCursor;
      if (override != null)
        return override;
      let deflt = parent.contentMatchAt($pos.index()).defaultType;
      return deflt && deflt.isTextblock;
    }
    static findGapCursorFrom($pos, dir, mustMove = false) {
      search:
        for (; ; ) {
          if (!mustMove && GapCursor.valid($pos))
            return $pos;
          let pos = $pos.pos, next = null;
          for (let d = $pos.depth; ; d--) {
            let parent = $pos.node(d);
            if (dir > 0 ? $pos.indexAfter(d) < parent.childCount : $pos.index(d) > 0) {
              next = parent.child(dir > 0 ? $pos.indexAfter(d) : $pos.index(d) - 1);
              break;
            } else if (d == 0) {
              return null;
            }
            pos += dir;
            let $cur = $pos.doc.resolve(pos);
            if (GapCursor.valid($cur))
              return $cur;
          }
          for (; ; ) {
            let inside = dir > 0 ? next.firstChild : next.lastChild;
            if (!inside) {
              if (next.isAtom && !next.isText && !NodeSelection.isSelectable(next)) {
                $pos = $pos.doc.resolve(pos + next.nodeSize * dir);
                mustMove = false;
                continue search;
              }
              break;
            }
            next = inside;
            pos += dir;
            let $cur = $pos.doc.resolve(pos);
            if (GapCursor.valid($cur))
              return $cur;
          }
          return null;
        }
    }
  };
  GapCursor.prototype.visible = false;
  GapCursor.findFrom = GapCursor.findGapCursorFrom;
  Selection.jsonID("gapcursor", GapCursor);
  var GapBookmark = class {
    constructor(pos) {
      this.pos = pos;
    }
    map(mapping) {
      return new GapBookmark(mapping.map(this.pos));
    }
    resolve(doc3) {
      let $pos = doc3.resolve(this.pos);
      return GapCursor.valid($pos) ? new GapCursor($pos) : Selection.near($pos);
    }
  };
  function closedBefore($pos) {
    for (let d = $pos.depth; d >= 0; d--) {
      let index = $pos.index(d), parent = $pos.node(d);
      if (index == 0) {
        if (parent.type.spec.isolating)
          return true;
        continue;
      }
      for (let before = parent.child(index - 1); ; before = before.lastChild) {
        if (before.childCount == 0 && !before.inlineContent || before.isAtom || before.type.spec.isolating)
          return true;
        if (before.inlineContent)
          return false;
      }
    }
    return true;
  }
  function closedAfter($pos) {
    for (let d = $pos.depth; d >= 0; d--) {
      let index = $pos.indexAfter(d), parent = $pos.node(d);
      if (index == parent.childCount) {
        if (parent.type.spec.isolating)
          return true;
        continue;
      }
      for (let after = parent.child(index); ; after = after.firstChild) {
        if (after.childCount == 0 && !after.inlineContent || after.isAtom || after.type.spec.isolating)
          return true;
        if (after.inlineContent)
          return false;
      }
    }
    return true;
  }
  function gapCursor() {
    return new Plugin({
      props: {
        decorations: drawGapCursor,
        createSelectionBetween(_view, $anchor, $head) {
          return $anchor.pos == $head.pos && GapCursor.valid($head) ? new GapCursor($head) : null;
        },
        handleClick,
        handleKeyDown,
        handleDOMEvents: { beforeinput }
      }
    });
  }
  var handleKeyDown = keydownHandler({
    "ArrowLeft": arrow("horiz", -1),
    "ArrowRight": arrow("horiz", 1),
    "ArrowUp": arrow("vert", -1),
    "ArrowDown": arrow("vert", 1)
  });
  function arrow(axis, dir) {
    const dirStr = axis == "vert" ? dir > 0 ? "down" : "up" : dir > 0 ? "right" : "left";
    return function(state, dispatch, view) {
      let sel = state.selection;
      let $start = dir > 0 ? sel.$to : sel.$from, mustMove = sel.empty;
      if (sel instanceof TextSelection) {
        if (!view.endOfTextblock(dirStr) || $start.depth == 0)
          return false;
        mustMove = false;
        $start = state.doc.resolve(dir > 0 ? $start.after() : $start.before());
      }
      let $found = GapCursor.findGapCursorFrom($start, dir, mustMove);
      if (!$found)
        return false;
      if (dispatch)
        dispatch(state.tr.setSelection(new GapCursor($found)));
      return true;
    };
  }
  function handleClick(view, pos, event) {
    if (!view || !view.editable)
      return false;
    let $pos = view.state.doc.resolve(pos);
    if (!GapCursor.valid($pos))
      return false;
    let clickPos = view.posAtCoords({ left: event.clientX, top: event.clientY });
    if (clickPos && clickPos.inside > -1 && NodeSelection.isSelectable(view.state.doc.nodeAt(clickPos.inside)))
      return false;
    view.dispatch(view.state.tr.setSelection(new GapCursor($pos)));
    return true;
  }
  function beforeinput(view, event) {
    if (event.inputType != "insertCompositionText" || !(view.state.selection instanceof GapCursor))
      return false;
    let { $from } = view.state.selection;
    let insert = $from.parent.contentMatchAt($from.index()).findWrapping(view.state.schema.nodes.text);
    if (!insert)
      return false;
    let frag = Fragment.empty;
    for (let i = insert.length - 1; i >= 0; i--)
      frag = Fragment.from(insert[i].createAndFill(null, frag));
    let tr = view.state.tr.replace($from.pos, $from.pos, new Slice(frag, 0, 0));
    tr.setSelection(TextSelection.near(tr.doc.resolve($from.pos + 1)));
    view.dispatch(tr);
    return false;
  }
  function drawGapCursor(state) {
    if (!(state.selection instanceof GapCursor))
      return null;
    let node = document.createElement("div");
    node.className = "ProseMirror-gapcursor";
    return DecorationSet.create(state.doc, [Decoration.widget(state.selection.head, node, { key: "gapcursor" })]);
  }

  // node_modules/prosemirror-tables/dist/index.js
  var readFromCache;
  var addToCache;
  if (typeof WeakMap != "undefined") {
    let cache = /* @__PURE__ */ new WeakMap();
    readFromCache = (key2) => cache.get(key2);
    addToCache = (key2, value) => {
      cache.set(key2, value);
      return value;
    };
  } else {
    const cache = [], cacheSize = 10;
    let cachePos = 0;
    readFromCache = (key2) => {
      for (let i = 0; i < cache.length; i += 2)
        if (cache[i] == key2)
          return cache[i + 1];
    };
    addToCache = (key2, value) => {
      if (cachePos == cacheSize)
        cachePos = 0;
      cache[cachePos++] = key2;
      return cache[cachePos++] = value;
    };
  }
  var Rect = class {
    constructor(left, top, right, bottom) {
      this.left = left;
      this.top = top;
      this.right = right;
      this.bottom = bottom;
    }
  };
  var TableMap = class {
    constructor(width, height, map2, problems) {
      this.width = width;
      this.height = height;
      this.map = map2;
      this.problems = problems;
    }
    findCell(pos) {
      for (let i = 0; i < this.map.length; i++) {
        const curPos = this.map[i];
        if (curPos != pos)
          continue;
        const left = i % this.width, top = i / this.width | 0;
        let right = left + 1, bottom = top + 1;
        for (let j = 1; right < this.width && this.map[i + j] == curPos; j++)
          right++;
        for (let j = 1; bottom < this.height && this.map[i + this.width * j] == curPos; j++)
          bottom++;
        return new Rect(left, top, right, bottom);
      }
      throw new RangeError("No cell with offset " + pos + " found");
    }
    colCount(pos) {
      for (let i = 0; i < this.map.length; i++)
        if (this.map[i] == pos)
          return i % this.width;
      throw new RangeError("No cell with offset " + pos + " found");
    }
    nextCell(pos, axis, dir) {
      const { left, right, top, bottom } = this.findCell(pos);
      if (axis == "horiz") {
        if (dir < 0 ? left == 0 : right == this.width)
          return null;
        return this.map[top * this.width + (dir < 0 ? left - 1 : right)];
      } else {
        if (dir < 0 ? top == 0 : bottom == this.height)
          return null;
        return this.map[left + this.width * (dir < 0 ? top - 1 : bottom)];
      }
    }
    rectBetween(a, b) {
      const { left: leftA, right: rightA, top: topA, bottom: bottomA } = this.findCell(a);
      const { left: leftB, right: rightB, top: topB, bottom: bottomB } = this.findCell(b);
      return new Rect(Math.min(leftA, leftB), Math.min(topA, topB), Math.max(rightA, rightB), Math.max(bottomA, bottomB));
    }
    cellsInRect(rect) {
      const result = [], seen = {};
      for (let row = rect.top; row < rect.bottom; row++) {
        for (let col = rect.left; col < rect.right; col++) {
          const index = row * this.width + col, pos = this.map[index];
          if (seen[pos])
            continue;
          seen[pos] = true;
          if ((col != rect.left || !col || this.map[index - 1] != pos) && (row != rect.top || !row || this.map[index - this.width] != pos))
            result.push(pos);
        }
      }
      return result;
    }
    positionAt(row, col, table) {
      for (let i = 0, rowStart = 0; ; i++) {
        const rowEnd = rowStart + table.child(i).nodeSize;
        if (i == row) {
          let index = col + row * this.width;
          const rowEndIndex = (row + 1) * this.width;
          while (index < rowEndIndex && this.map[index] < rowStart)
            index++;
          return index == rowEndIndex ? rowEnd - 1 : this.map[index];
        }
        rowStart = rowEnd;
      }
    }
    static get(table) {
      return readFromCache(table) || addToCache(table, computeMap(table));
    }
  };
  function computeMap(table) {
    if (table.type.spec.tableRole != "table")
      throw new RangeError("Not a table node: " + table.type.name);
    const width = findWidth(table), height = table.childCount;
    const map2 = [], colWidths = [];
    let mapPos = 0, problems = null;
    for (let i = 0, e = width * height; i < e; i++)
      map2[i] = 0;
    for (let row = 0, pos = 0; row < height; row++) {
      const rowNode = table.child(row);
      pos++;
      for (let i = 0; ; i++) {
        while (mapPos < map2.length && map2[mapPos] != 0)
          mapPos++;
        if (i == rowNode.childCount)
          break;
        const cellNode = rowNode.child(i), { colspan, rowspan, colwidth } = cellNode.attrs;
        for (let h = 0; h < rowspan; h++) {
          if (h + row >= height) {
            (problems || (problems = [])).push({
              type: "overlong_rowspan",
              pos,
              n: rowspan - h
            });
            break;
          }
          const start = mapPos + h * width;
          for (let w = 0; w < colspan; w++) {
            if (map2[start + w] == 0)
              map2[start + w] = pos;
            else
              (problems || (problems = [])).push({
                type: "collision",
                row,
                pos,
                n: colspan - w
              });
            const colW = colwidth && colwidth[w];
            if (colW) {
              const widthIndex = (start + w) % width * 2, prev = colWidths[widthIndex];
              if (prev == null || prev != colW && colWidths[widthIndex + 1] == 1) {
                colWidths[widthIndex] = colW;
                colWidths[widthIndex + 1] = 1;
              } else if (prev == colW) {
                colWidths[widthIndex + 1]++;
              }
            }
          }
        }
        mapPos += colspan;
        pos += cellNode.nodeSize;
      }
      const expectedPos = (row + 1) * width;
      let missing = 0;
      while (mapPos < expectedPos)
        if (map2[mapPos++] == 0)
          missing++;
      if (missing)
        (problems || (problems = [])).push({ type: "missing", row, n: missing });
      pos++;
    }
    const tableMap = new TableMap(width, height, map2, problems);
    let badWidths = false;
    for (let i = 0; !badWidths && i < colWidths.length; i += 2)
      if (colWidths[i] != null && colWidths[i + 1] < height)
        badWidths = true;
    if (badWidths)
      findBadColWidths(tableMap, colWidths, table);
    return tableMap;
  }
  function findWidth(table) {
    let width = -1, hasRowSpan = false;
    for (let row = 0; row < table.childCount; row++) {
      const rowNode = table.child(row);
      let rowWidth = 0;
      if (hasRowSpan)
        for (let j = 0; j < row; j++) {
          const prevRow = table.child(j);
          for (let i = 0; i < prevRow.childCount; i++) {
            const cell = prevRow.child(i);
            if (j + cell.attrs.rowspan > row)
              rowWidth += cell.attrs.colspan;
          }
        }
      for (let i = 0; i < rowNode.childCount; i++) {
        const cell = rowNode.child(i);
        rowWidth += cell.attrs.colspan;
        if (cell.attrs.rowspan > 1)
          hasRowSpan = true;
      }
      if (width == -1)
        width = rowWidth;
      else if (width != rowWidth)
        width = Math.max(width, rowWidth);
    }
    return width;
  }
  function findBadColWidths(map2, colWidths, table) {
    if (!map2.problems)
      map2.problems = [];
    for (let i = 0, seen = {}; i < map2.map.length; i++) {
      const pos = map2.map[i];
      if (seen[pos])
        continue;
      seen[pos] = true;
      const node = table.nodeAt(pos);
      let updated = null;
      for (let j = 0; j < node.attrs.colspan; j++) {
        const col = (i + j) % map2.width, colWidth = colWidths[col * 2];
        if (colWidth != null && (!node.attrs.colwidth || node.attrs.colwidth[j] != colWidth))
          (updated || (updated = freshColWidth(node.attrs)))[j] = colWidth;
      }
      if (updated)
        map2.problems.unshift({
          type: "colwidth mismatch",
          pos,
          colwidth: updated
        });
    }
  }
  function freshColWidth(attrs) {
    if (attrs.colwidth)
      return attrs.colwidth.slice();
    const result = [];
    for (let i = 0; i < attrs.colspan; i++)
      result.push(0);
    return result;
  }
  function getCellAttrs(dom, extraAttrs) {
    const widthAttr = dom.getAttribute("data-colwidth");
    const widths = widthAttr && /^\d+(,\d+)*$/.test(widthAttr) ? widthAttr.split(",").map((s) => Number(s)) : null;
    const colspan = Number(dom.getAttribute("colspan") || 1);
    const result = {
      colspan,
      rowspan: Number(dom.getAttribute("rowspan") || 1),
      colwidth: widths && widths.length == colspan ? widths : null
    };
    for (const prop in extraAttrs) {
      const getter = extraAttrs[prop].getFromDOM;
      const value = getter && getter(dom);
      if (value != null)
        result[prop] = value;
    }
    return result;
  }
  function setCellAttrs(node, extraAttrs) {
    const attrs = {};
    if (node.attrs.colspan != 1)
      attrs.colspan = node.attrs.colspan;
    if (node.attrs.rowspan != 1)
      attrs.rowspan = node.attrs.rowspan;
    if (node.attrs.colwidth)
      attrs["data-colwidth"] = node.attrs.colwidth.join(",");
    for (const prop in extraAttrs) {
      const setter = extraAttrs[prop].setDOMAttr;
      if (setter)
        setter(node.attrs[prop], attrs);
    }
    return attrs;
  }
  function tableNodes(options) {
    const extraAttrs = options.cellAttributes || {};
    const cellAttrs = {
      colspan: { default: 1 },
      rowspan: { default: 1 },
      colwidth: { default: null }
    };
    for (const prop in extraAttrs)
      cellAttrs[prop] = { default: extraAttrs[prop].default };
    return {
      table: {
        content: "table_row+",
        tableRole: "table",
        isolating: true,
        group: options.tableGroup,
        parseDOM: [{ tag: "table" }],
        toDOM() {
          return ["table", ["tbody", 0]];
        }
      },
      table_row: {
        content: "(table_cell | table_header)*",
        tableRole: "row",
        parseDOM: [{ tag: "tr" }],
        toDOM() {
          return ["tr", 0];
        }
      },
      table_cell: {
        content: options.cellContent,
        attrs: cellAttrs,
        tableRole: "cell",
        isolating: true,
        parseDOM: [
          { tag: "td", getAttrs: (dom) => getCellAttrs(dom, extraAttrs) }
        ],
        toDOM(node) {
          return ["td", setCellAttrs(node, extraAttrs), 0];
        }
      },
      table_header: {
        content: options.cellContent,
        attrs: cellAttrs,
        tableRole: "header_cell",
        isolating: true,
        parseDOM: [
          { tag: "th", getAttrs: (dom) => getCellAttrs(dom, extraAttrs) }
        ],
        toDOM(node) {
          return ["th", setCellAttrs(node, extraAttrs), 0];
        }
      }
    };
  }
  function tableNodeTypes(schema2) {
    let result = schema2.cached.tableNodeTypes;
    if (!result) {
      result = schema2.cached.tableNodeTypes = {};
      for (const name in schema2.nodes) {
        const type = schema2.nodes[name], role = type.spec.tableRole;
        if (role)
          result[role] = type;
      }
    }
    return result;
  }
  var key$1 = new PluginKey("selectingCells");
  function cellAround($pos) {
    for (let d = $pos.depth - 1; d > 0; d--)
      if ($pos.node(d).type.spec.tableRole == "row")
        return $pos.node(0).resolve($pos.before(d + 1));
    return null;
  }
  function cellWrapping($pos) {
    for (let d = $pos.depth; d > 0; d--) {
      const role = $pos.node(d).type.spec.tableRole;
      if (role === "cell" || role === "header_cell")
        return $pos.node(d);
    }
    return null;
  }
  function isInTable(state) {
    const $head = state.selection.$head;
    for (let d = $head.depth; d > 0; d--)
      if ($head.node(d).type.spec.tableRole == "row")
        return true;
    return false;
  }
  function selectionCell(state) {
    const sel = state.selection;
    if (sel.$anchorCell) {
      return sel.$anchorCell.pos > sel.$headCell.pos ? sel.$anchorCell : sel.$headCell;
    } else if (sel.node && sel.node.type.spec.tableRole == "cell") {
      return sel.$anchor;
    }
    return cellAround(sel.$head) || cellNear(sel.$head);
  }
  function cellNear($pos) {
    for (let after = $pos.nodeAfter, pos = $pos.pos; after; after = after.firstChild, pos++) {
      const role = after.type.spec.tableRole;
      if (role == "cell" || role == "header_cell")
        return $pos.doc.resolve(pos);
    }
    for (let before = $pos.nodeBefore, pos = $pos.pos; before; before = before.lastChild, pos--) {
      const role = before.type.spec.tableRole;
      if (role == "cell" || role == "header_cell")
        return $pos.doc.resolve(pos - before.nodeSize);
    }
  }
  function pointsAtCell($pos) {
    return $pos.parent.type.spec.tableRole == "row" && $pos.nodeAfter;
  }
  function moveCellForward($pos) {
    return $pos.node(0).resolve($pos.pos + $pos.nodeAfter.nodeSize);
  }
  function inSameTable($a, $b) {
    return $a.depth == $b.depth && $a.pos >= $b.start(-1) && $a.pos <= $b.end(-1);
  }
  function nextCell($pos, axis, dir) {
    const start = $pos.start(-1), map2 = TableMap.get($pos.node(-1));
    const moved = map2.nextCell($pos.pos - start, axis, dir);
    return moved == null ? null : $pos.node(0).resolve(start + moved);
  }
  function setAttr(attrs, name, value) {
    const result = {};
    for (const prop in attrs)
      result[prop] = attrs[prop];
    result[name] = value;
    return result;
  }
  function removeColSpan(attrs, pos, n = 1) {
    const result = setAttr(attrs, "colspan", attrs.colspan - n);
    if (result.colwidth) {
      result.colwidth = result.colwidth.slice();
      result.colwidth.splice(pos, n);
      if (!result.colwidth.some((w) => w > 0))
        result.colwidth = null;
    }
    return result;
  }
  function addColSpan(attrs, pos, n = 1) {
    const result = setAttr(attrs, "colspan", attrs.colspan + n);
    if (result.colwidth) {
      result.colwidth = result.colwidth.slice();
      for (let i = 0; i < n; i++)
        result.colwidth.splice(pos, 0, 0);
    }
    return result;
  }
  function columnIsHeader(map2, table, col) {
    const headerCell = tableNodeTypes(table.type.schema).header_cell;
    for (let row = 0; row < map2.height; row++)
      if (table.nodeAt(map2.map[col + row * map2.width]).type != headerCell)
        return false;
    return true;
  }
  var CellSelection = class extends Selection {
    constructor($anchorCell, $headCell = $anchorCell) {
      const table = $anchorCell.node(-1), map2 = TableMap.get(table), start = $anchorCell.start(-1);
      const rect = map2.rectBetween($anchorCell.pos - start, $headCell.pos - start);
      const doc3 = $anchorCell.node(0);
      const cells = map2.cellsInRect(rect).filter((p) => p != $headCell.pos - start);
      cells.unshift($headCell.pos - start);
      const ranges = cells.map((pos) => {
        const cell = table.nodeAt(pos), from2 = pos + start + 1;
        return new SelectionRange(doc3.resolve(from2), doc3.resolve(from2 + cell.content.size));
      });
      super(ranges[0].$from, ranges[0].$to, ranges);
      this.$anchorCell = $anchorCell;
      this.$headCell = $headCell;
    }
    map(doc3, mapping) {
      const $anchorCell = doc3.resolve(mapping.map(this.$anchorCell.pos));
      const $headCell = doc3.resolve(mapping.map(this.$headCell.pos));
      if (pointsAtCell($anchorCell) && pointsAtCell($headCell) && inSameTable($anchorCell, $headCell)) {
        const tableChanged = this.$anchorCell.node(-1) != $anchorCell.node(-1);
        if (tableChanged && this.isRowSelection())
          return CellSelection.rowSelection($anchorCell, $headCell);
        else if (tableChanged && this.isColSelection())
          return CellSelection.colSelection($anchorCell, $headCell);
        else
          return new CellSelection($anchorCell, $headCell);
      }
      return TextSelection.between($anchorCell, $headCell);
    }
    content() {
      const table = this.$anchorCell.node(-1), map2 = TableMap.get(table), start = this.$anchorCell.start(-1);
      const rect = map2.rectBetween(this.$anchorCell.pos - start, this.$headCell.pos - start);
      const seen = {}, rows = [];
      for (let row = rect.top; row < rect.bottom; row++) {
        const rowContent = [];
        for (let index = row * map2.width + rect.left, col = rect.left; col < rect.right; col++, index++) {
          const pos = map2.map[index];
          if (!seen[pos]) {
            seen[pos] = true;
            const cellRect = map2.findCell(pos);
            let cell = table.nodeAt(pos);
            const extraLeft = rect.left - cellRect.left, extraRight = cellRect.right - rect.right;
            if (cell && (extraLeft > 0 || extraRight > 0)) {
              let attrs = cell.attrs;
              if (extraLeft > 0)
                attrs = removeColSpan(attrs, 0, extraLeft);
              if (extraRight > 0)
                attrs = removeColSpan(attrs, attrs.colspan - extraRight, extraRight);
              if (cellRect.left < rect.left) {
                cell = cell.type.createAndFill(attrs);
              } else {
                cell = cell.type.create(attrs, cell.content);
              }
            }
            if (cell && (cellRect.top < rect.top || cellRect.bottom > rect.bottom)) {
              const attrs = setAttr((cell === null || cell === void 0 ? void 0 : cell.attrs) || {}, "rowspan", Math.min(cellRect.bottom, rect.bottom) - Math.max(cellRect.top, rect.top));
              if (cellRect.top < rect.top) {
                cell = cell.type.createAndFill(attrs);
              } else {
                cell = cell.type.create(attrs, cell.content);
              }
            }
            if (cell) {
              rowContent.push(cell);
            }
          }
        }
        rows.push(table.child(row).copy(Fragment.from(rowContent)));
      }
      const fragment = this.isColSelection() && this.isRowSelection() ? table : rows;
      return new Slice(Fragment.from(fragment), 1, 1);
    }
    replace(tr, content = Slice.empty) {
      const mapFrom = tr.steps.length, ranges = this.ranges;
      for (let i = 0; i < ranges.length; i++) {
        const { $from, $to } = ranges[i], mapping = tr.mapping.slice(mapFrom);
        tr.replace(mapping.map($from.pos), mapping.map($to.pos), i ? Slice.empty : content);
      }
      const sel = Selection.findFrom(tr.doc.resolve(tr.mapping.slice(mapFrom).map(this.to)), -1);
      if (sel)
        tr.setSelection(sel);
    }
    replaceWith(tr, node) {
      this.replace(tr, new Slice(Fragment.from(node), 0, 0));
    }
    forEachCell(f) {
      const table = this.$anchorCell.node(-1), map2 = TableMap.get(table), start = this.$anchorCell.start(-1);
      const cells = map2.cellsInRect(map2.rectBetween(this.$anchorCell.pos - start, this.$headCell.pos - start));
      for (let i = 0; i < cells.length; i++)
        f(table.nodeAt(cells[i]), start + cells[i]);
    }
    isColSelection() {
      var _a, _b;
      const anchorTop = this.$anchorCell.index(-1), headTop = this.$headCell.index(-1);
      if (Math.min(anchorTop, headTop) > 0)
        return false;
      const anchorBot = anchorTop + ((_a = this.$anchorCell.nodeAfter) === null || _a === void 0 ? void 0 : _a.attrs.rowspan), headBot = headTop + ((_b = this.$headCell.nodeAfter) === null || _b === void 0 ? void 0 : _b.attrs.rowspan);
      return Math.max(anchorBot, headBot) == this.$headCell.node(-1).childCount;
    }
    static colSelection($anchorCell, $headCell = $anchorCell) {
      const map2 = TableMap.get($anchorCell.node(-1)), start = $anchorCell.start(-1);
      const anchorRect = map2.findCell($anchorCell.pos - start), headRect = map2.findCell($headCell.pos - start);
      const doc3 = $anchorCell.node(0);
      if (anchorRect.top <= headRect.top) {
        if (anchorRect.top > 0)
          $anchorCell = doc3.resolve(start + map2.map[anchorRect.left]);
        if (headRect.bottom < map2.height)
          $headCell = doc3.resolve(start + map2.map[map2.width * (map2.height - 1) + headRect.right - 1]);
      } else {
        if (headRect.top > 0)
          $headCell = doc3.resolve(start + map2.map[headRect.left]);
        if (anchorRect.bottom < map2.height)
          $anchorCell = doc3.resolve(start + map2.map[map2.width * (map2.height - 1) + anchorRect.right - 1]);
      }
      return new CellSelection($anchorCell, $headCell);
    }
    isRowSelection() {
      var _a, _b;
      const map2 = TableMap.get(this.$anchorCell.node(-1)), start = this.$anchorCell.start(-1);
      const anchorLeft = map2.colCount(this.$anchorCell.pos - start), headLeft = map2.colCount(this.$headCell.pos - start);
      if (Math.min(anchorLeft, headLeft) > 0)
        return false;
      const anchorRight = anchorLeft + ((_a = this.$anchorCell.nodeAfter) === null || _a === void 0 ? void 0 : _a.attrs.colspan), headRight = headLeft + ((_b = this.$headCell.nodeAfter) === null || _b === void 0 ? void 0 : _b.attrs.colspan);
      return Math.max(anchorRight, headRight) == map2.width;
    }
    eq(other) {
      return other instanceof CellSelection && other.$anchorCell.pos == this.$anchorCell.pos && other.$headCell.pos == this.$headCell.pos;
    }
    static rowSelection($anchorCell, $headCell = $anchorCell) {
      const map2 = TableMap.get($anchorCell.node(-1)), start = $anchorCell.start(-1);
      const anchorRect = map2.findCell($anchorCell.pos - start), headRect = map2.findCell($headCell.pos - start);
      const doc3 = $anchorCell.node(0);
      if (anchorRect.left <= headRect.left) {
        if (anchorRect.left > 0)
          $anchorCell = doc3.resolve(start + map2.map[anchorRect.top * map2.width]);
        if (headRect.right < map2.width)
          $headCell = doc3.resolve(start + map2.map[map2.width * (headRect.top + 1) - 1]);
      } else {
        if (headRect.left > 0)
          $headCell = doc3.resolve(start + map2.map[headRect.top * map2.width]);
        if (anchorRect.right < map2.width)
          $anchorCell = doc3.resolve(start + map2.map[map2.width * (anchorRect.top + 1) - 1]);
      }
      return new CellSelection($anchorCell, $headCell);
    }
    toJSON() {
      return {
        type: "cell",
        anchor: this.$anchorCell.pos,
        head: this.$headCell.pos
      };
    }
    static fromJSON(doc3, json) {
      return new CellSelection(doc3.resolve(json.anchor), doc3.resolve(json.head));
    }
    static create(doc3, anchorCell, headCell = anchorCell) {
      return new CellSelection(doc3.resolve(anchorCell), doc3.resolve(headCell));
    }
    getBookmark() {
      return new CellBookmark(this.$anchorCell.pos, this.$headCell.pos);
    }
  };
  CellSelection.prototype.visible = false;
  Selection.jsonID("cell", CellSelection);
  var CellBookmark = class {
    constructor(anchor, head) {
      this.anchor = anchor;
      this.head = head;
    }
    map(mapping) {
      return new CellBookmark(mapping.map(this.anchor), mapping.map(this.head));
    }
    resolve(doc3) {
      const $anchorCell = doc3.resolve(this.anchor), $headCell = doc3.resolve(this.head);
      if ($anchorCell.parent.type.spec.tableRole == "row" && $headCell.parent.type.spec.tableRole == "row" && $anchorCell.index() < $anchorCell.parent.childCount && $headCell.index() < $headCell.parent.childCount && inSameTable($anchorCell, $headCell))
        return new CellSelection($anchorCell, $headCell);
      else
        return Selection.near($headCell, 1);
    }
  };
  function drawCellSelection(state) {
    if (!(state.selection instanceof CellSelection))
      return null;
    const cells = [];
    state.selection.forEachCell((node, pos) => {
      cells.push(Decoration.node(pos, pos + node.nodeSize, { class: "selectedCell" }));
    });
    return DecorationSet.create(state.doc, cells);
  }
  function isCellBoundarySelection({ $from, $to }) {
    if ($from.pos == $to.pos || $from.pos < $from.pos - 6)
      return false;
    let afterFrom = $from.pos, beforeTo = $to.pos, depth = $from.depth;
    for (; depth >= 0; depth--, afterFrom++)
      if ($from.after(depth + 1) < $from.end(depth))
        break;
    for (let d = $to.depth; d >= 0; d--, beforeTo--)
      if ($to.before(d + 1) > $to.start(d))
        break;
    return afterFrom == beforeTo && /row|table/.test($from.node(depth).type.spec.tableRole);
  }
  function isTextSelectionAcrossCells({ $from, $to }) {
    let fromCellBoundaryNode;
    let toCellBoundaryNode;
    for (let i = $from.depth; i > 0; i--) {
      const node = $from.node(i);
      if (node.type.spec.tableRole === "cell" || node.type.spec.tableRole === "header_cell") {
        fromCellBoundaryNode = node;
        break;
      }
    }
    for (let i = $to.depth; i > 0; i--) {
      const node = $to.node(i);
      if (node.type.spec.tableRole === "cell" || node.type.spec.tableRole === "header_cell") {
        toCellBoundaryNode = node;
        break;
      }
    }
    return fromCellBoundaryNode !== toCellBoundaryNode && $to.parentOffset === 0;
  }
  function normalizeSelection(state, tr, allowTableNodeSelection) {
    const sel = (tr || state).selection, doc3 = (tr || state).doc;
    let normalize2, role;
    if (sel instanceof NodeSelection && (role = sel.node.type.spec.tableRole)) {
      if (role == "cell" || role == "header_cell") {
        normalize2 = CellSelection.create(doc3, sel.from);
      } else if (role == "row") {
        const $cell = doc3.resolve(sel.from + 1);
        normalize2 = CellSelection.rowSelection($cell, $cell);
      } else if (!allowTableNodeSelection) {
        const map2 = TableMap.get(sel.node), start = sel.from + 1;
        const lastCell = start + map2.map[map2.width * map2.height - 1];
        normalize2 = CellSelection.create(doc3, start + 1, lastCell);
      }
    } else if (sel instanceof TextSelection && isCellBoundarySelection(sel)) {
      normalize2 = TextSelection.create(doc3, sel.from);
    } else if (sel instanceof TextSelection && isTextSelectionAcrossCells(sel)) {
      normalize2 = TextSelection.create(doc3, sel.$from.start(), sel.$from.end());
    }
    if (normalize2)
      (tr || (tr = state.tr)).setSelection(normalize2);
    return tr;
  }
  function pastedCells(slice2) {
    if (!slice2.size)
      return null;
    let { content, openStart, openEnd } = slice2;
    while (content.childCount == 1 && (openStart > 0 && openEnd > 0 || content.firstChild.type.spec.tableRole == "table")) {
      openStart--;
      openEnd--;
      content = content.firstChild.content;
    }
    const first = content.firstChild, role = first.type.spec.tableRole;
    const schema2 = first.type.schema, rows = [];
    if (role == "row") {
      for (let i = 0; i < content.childCount; i++) {
        let cells = content.child(i).content;
        const left = i ? 0 : Math.max(0, openStart - 1);
        const right = i < content.childCount - 1 ? 0 : Math.max(0, openEnd - 1);
        if (left || right)
          cells = fitSlice(tableNodeTypes(schema2).row, new Slice(cells, left, right)).content;
        rows.push(cells);
      }
    } else if (role == "cell" || role == "header_cell") {
      rows.push(openStart || openEnd ? fitSlice(tableNodeTypes(schema2).row, new Slice(content, openStart, openEnd)).content : content);
    } else {
      return null;
    }
    return ensureRectangular(schema2, rows);
  }
  function ensureRectangular(schema2, rows) {
    const widths = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      for (let j = row.childCount - 1; j >= 0; j--) {
        const { rowspan, colspan } = row.child(j).attrs;
        for (let r = i; r < i + rowspan; r++)
          widths[r] = (widths[r] || 0) + colspan;
      }
    }
    let width = 0;
    for (let r = 0; r < widths.length; r++)
      width = Math.max(width, widths[r]);
    for (let r = 0; r < widths.length; r++) {
      if (r >= rows.length)
        rows.push(Fragment.empty);
      if (widths[r] < width) {
        const empty2 = tableNodeTypes(schema2).cell.createAndFill(), cells = [];
        for (let i = widths[r]; i < width; i++)
          cells.push(empty2);
        rows[r] = rows[r].append(Fragment.from(cells));
      }
    }
    return { height: rows.length, width, rows };
  }
  function fitSlice(nodeType, slice2) {
    const node = nodeType.createAndFill();
    const tr = new Transform(node).replace(0, node.content.size, slice2);
    return tr.doc;
  }
  function clipCells({ width, height, rows }, newWidth, newHeight) {
    var _a;
    if (width != newWidth) {
      const added = [], newRows = [];
      for (let row = 0; row < rows.length; row++) {
        const frag = rows[row], cells = [];
        for (let col = added[row] || 0, i = 0; col < newWidth; i++) {
          let cell = frag.child(i % frag.childCount);
          if (col + cell.attrs.colspan > newWidth) {
            const colspan = ((_a = cell === null || cell === void 0 ? void 0 : cell.attrs) === null || _a === void 0 ? void 0 : _a.colspan) || 0;
            cell = cell.type.create(removeColSpan(cell.attrs, cell.attrs.colspan, col + colspan - newWidth), cell.content);
          }
          cells.push(cell);
          col += cell.attrs.colspan;
          for (let j = 1; j < cell.attrs.rowspan; j++) {
            added[row + j] = (added[row + j] || 0) + cell.attrs.colspan;
          }
        }
        newRows.push(Fragment.from(cells));
      }
      rows = newRows;
      width = newWidth;
    }
    if (height != newHeight) {
      const newRows = [];
      for (let row = 0, i = 0; row < newHeight; row++, i++) {
        const cells = [], source = rows[i % height];
        for (let j = 0; j < source.childCount; j++) {
          let cell = source.child(j);
          if (row + cell.attrs.rowspan > newHeight)
            cell = cell.type.create(setAttr(cell.attrs, "rowspan", Math.max(1, newHeight - cell.attrs.rowspan)), cell.content);
          cells.push(cell);
        }
        newRows.push(Fragment.from(cells));
      }
      rows = newRows;
      height = newHeight;
    }
    return { width, height, rows };
  }
  function growTable(tr, map2, table, start, width, height, mapFrom) {
    const schema2 = tr.doc.type.schema, types = tableNodeTypes(schema2);
    let empty2, emptyHead;
    if (width > map2.width) {
      for (let row = 0, rowEnd = 0; row < map2.height; row++) {
        const rowNode = table.child(row);
        rowEnd += rowNode.nodeSize;
        const cells = [];
        let add2;
        if (rowNode.lastChild == null || rowNode.lastChild.type == types.cell)
          add2 = empty2 || (empty2 = types.cell.createAndFill());
        else
          add2 = emptyHead || (emptyHead = types.header_cell.createAndFill());
        for (let i = map2.width; i < width; i++) {
          cells.push(add2);
        }
        tr.insert(tr.mapping.slice(mapFrom).map(rowEnd - 1 + start), cells);
      }
    }
    if (height > map2.height) {
      const cells = [];
      for (let i = 0, start2 = (map2.height - 1) * map2.width; i < Math.max(map2.width, width); i++) {
        const header = i >= map2.width ? false : table.nodeAt(map2.map[start2 + i]).type == types.header_cell;
        cells.push(header ? emptyHead || (emptyHead = types.header_cell.createAndFill()) : empty2 || (empty2 = types.cell.createAndFill()));
      }
      const emptyRow = types.row.create(null, Fragment.from(cells)), rows = [];
      for (let i = map2.height; i < height; i++) {
        rows.push(emptyRow);
      }
      tr.insert(tr.mapping.slice(mapFrom).map(start + table.nodeSize - 2), rows);
    }
    return !!(empty2 || emptyHead);
  }
  function isolateHorizontal(tr, map2, table, start, left, right, top, mapFrom) {
    if (top == 0 || top == map2.height)
      return false;
    let found2 = false;
    for (let col = left; col < right; col++) {
      const index = top * map2.width + col, pos = map2.map[index];
      if (map2.map[index - map2.width] == pos) {
        found2 = true;
        const cell = table.nodeAt(pos);
        const { top: cellTop, left: cellLeft } = map2.findCell(pos);
        tr.setNodeMarkup(tr.mapping.slice(mapFrom).map(pos + start), null, setAttr(cell.attrs, "rowspan", top - cellTop));
        tr.insert(tr.mapping.slice(mapFrom).map(map2.positionAt(top, cellLeft, table)), cell.type.createAndFill(setAttr(cell.attrs, "rowspan", cellTop + cell.attrs.rowspan - top)));
        col += cell.attrs.colspan - 1;
      }
    }
    return found2;
  }
  function isolateVertical(tr, map2, table, start, top, bottom, left, mapFrom) {
    if (left == 0 || left == map2.width)
      return false;
    let found2 = false;
    for (let row = top; row < bottom; row++) {
      const index = row * map2.width + left, pos = map2.map[index];
      if (map2.map[index - 1] == pos) {
        found2 = true;
        const cell = table.nodeAt(pos), cellLeft = map2.colCount(pos);
        const updatePos = tr.mapping.slice(mapFrom).map(pos + start);
        tr.setNodeMarkup(updatePos, null, removeColSpan(cell.attrs, left - cellLeft, cell.attrs.colspan - (left - cellLeft)));
        tr.insert(updatePos + cell.nodeSize, cell.type.createAndFill(removeColSpan(cell.attrs, 0, left - cellLeft)));
        row += cell.attrs.rowspan - 1;
      }
    }
    return found2;
  }
  function insertCells(state, dispatch, tableStart, rect, cells) {
    let table = tableStart ? state.doc.nodeAt(tableStart - 1) : state.doc, map2 = TableMap.get(table);
    const { top, left } = rect;
    const right = left + cells.width, bottom = top + cells.height;
    const tr = state.tr;
    let mapFrom = 0;
    function recomp() {
      table = tableStart ? tr.doc.nodeAt(tableStart - 1) : tr.doc;
      map2 = TableMap.get(table);
      mapFrom = tr.mapping.maps.length;
    }
    if (growTable(tr, map2, table, tableStart, right, bottom, mapFrom))
      recomp();
    if (isolateHorizontal(tr, map2, table, tableStart, left, right, top, mapFrom))
      recomp();
    if (isolateHorizontal(tr, map2, table, tableStart, left, right, bottom, mapFrom))
      recomp();
    if (isolateVertical(tr, map2, table, tableStart, top, bottom, left, mapFrom))
      recomp();
    if (isolateVertical(tr, map2, table, tableStart, top, bottom, right, mapFrom))
      recomp();
    for (let row = top; row < bottom; row++) {
      const from2 = map2.positionAt(row, left, table), to = map2.positionAt(row, right, table);
      tr.replace(tr.mapping.slice(mapFrom).map(from2 + tableStart), tr.mapping.slice(mapFrom).map(to + tableStart), new Slice(cells.rows[row - top], 0, 0));
    }
    recomp();
    tr.setSelection(new CellSelection(tr.doc.resolve(tableStart + map2.positionAt(top, left, table)), tr.doc.resolve(tableStart + map2.positionAt(bottom - 1, right - 1, table))));
    dispatch(tr);
  }
  var handleKeyDown2 = keydownHandler({
    ArrowLeft: arrow2("horiz", -1),
    ArrowRight: arrow2("horiz", 1),
    ArrowUp: arrow2("vert", -1),
    ArrowDown: arrow2("vert", 1),
    "Shift-ArrowLeft": shiftArrow("horiz", -1),
    "Shift-ArrowRight": shiftArrow("horiz", 1),
    "Shift-ArrowUp": shiftArrow("vert", -1),
    "Shift-ArrowDown": shiftArrow("vert", 1),
    Backspace: deleteCellSelection,
    "Mod-Backspace": deleteCellSelection,
    Delete: deleteCellSelection,
    "Mod-Delete": deleteCellSelection
  });
  function maybeSetSelection(state, dispatch, selection) {
    if (selection.eq(state.selection))
      return false;
    if (dispatch)
      dispatch(state.tr.setSelection(selection).scrollIntoView());
    return true;
  }
  function arrow2(axis, dir) {
    return (state, dispatch, view) => {
      const sel = state.selection;
      if (sel instanceof CellSelection) {
        return maybeSetSelection(state, dispatch, Selection.near(sel.$headCell, dir));
      }
      if (axis != "horiz" && !sel.empty)
        return false;
      const end = atEndOfCell(view, axis, dir);
      if (end == null)
        return false;
      if (axis == "horiz") {
        return maybeSetSelection(state, dispatch, Selection.near(state.doc.resolve(sel.head + dir), dir));
      } else {
        const $cell = state.doc.resolve(end), $next = nextCell($cell, axis, dir);
        let newSel;
        if ($next)
          newSel = Selection.near($next, 1);
        else if (dir < 0)
          newSel = Selection.near(state.doc.resolve($cell.before(-1)), -1);
        else
          newSel = Selection.near(state.doc.resolve($cell.after(-1)), 1);
        return maybeSetSelection(state, dispatch, newSel);
      }
    };
  }
  function shiftArrow(axis, dir) {
    return (state, dispatch, view) => {
      let sel = state.selection;
      if (!(sel instanceof CellSelection)) {
        const end = atEndOfCell(view, axis, dir);
        if (end == null)
          return false;
        sel = new CellSelection(state.doc.resolve(end));
      }
      const $head = nextCell(sel.$headCell, axis, dir);
      if (!$head)
        return false;
      return maybeSetSelection(state, dispatch, new CellSelection(sel.$anchorCell, $head));
    };
  }
  function deleteCellSelection(state, dispatch) {
    const sel = state.selection;
    if (!(sel instanceof CellSelection))
      return false;
    if (dispatch) {
      const tr = state.tr, baseContent = tableNodeTypes(state.schema).cell.createAndFill().content;
      sel.forEachCell((cell, pos) => {
        if (!cell.content.eq(baseContent))
          tr.replace(tr.mapping.map(pos + 1), tr.mapping.map(pos + cell.nodeSize - 1), new Slice(baseContent, 0, 0));
      });
      if (tr.docChanged)
        dispatch(tr);
    }
    return true;
  }
  function handleTripleClick2(view, pos) {
    const doc3 = view.state.doc, $cell = cellAround(doc3.resolve(pos));
    if (!$cell)
      return false;
    view.dispatch(view.state.tr.setSelection(new CellSelection($cell)));
    return true;
  }
  function handlePaste(view, _, slice2) {
    if (!isInTable(view.state))
      return false;
    let cells = pastedCells(slice2);
    const sel = view.state.selection;
    if (sel instanceof CellSelection) {
      if (!cells)
        cells = {
          width: 1,
          height: 1,
          rows: [
            Fragment.from(fitSlice(tableNodeTypes(view.state.schema).cell, slice2))
          ]
        };
      const table = sel.$anchorCell.node(-1), start = sel.$anchorCell.start(-1);
      const rect = TableMap.get(table).rectBetween(sel.$anchorCell.pos - start, sel.$headCell.pos - start);
      cells = clipCells(cells, rect.right - rect.left, rect.bottom - rect.top);
      insertCells(view.state, view.dispatch, start, rect, cells);
      return true;
    } else if (cells) {
      const $cell = selectionCell(view.state), start = $cell.start(-1);
      insertCells(view.state, view.dispatch, start, TableMap.get($cell.node(-1)).findCell($cell.pos - start), cells);
      return true;
    } else {
      return false;
    }
  }
  function handleMouseDown$1(view, startEvent) {
    if (startEvent.ctrlKey || startEvent.metaKey)
      return false;
    const startDOMCell = domInCell(view, startEvent.target);
    let $anchor;
    if (startEvent.shiftKey && view.state.selection instanceof CellSelection) {
      setCellSelection(view.state.selection.$anchorCell, startEvent);
      startEvent.preventDefault();
    } else if (startEvent.shiftKey && startDOMCell && ($anchor = cellAround(view.state.selection.$anchor)) != null && cellUnderMouse(view, startEvent).pos != $anchor.pos) {
      setCellSelection($anchor, startEvent);
      startEvent.preventDefault();
    } else if (!startDOMCell) {
      return false;
    }
    function setCellSelection($anchor2, event) {
      let $head = cellUnderMouse(view, event);
      const starting = key$1.getState(view.state) == null;
      if (!$head || !inSameTable($anchor2, $head)) {
        if (starting)
          $head = $anchor2;
        else
          return;
      }
      const selection = new CellSelection($anchor2, $head);
      if (starting || !view.state.selection.eq(selection)) {
        const tr = view.state.tr.setSelection(selection);
        if (starting)
          tr.setMeta(key$1, $anchor2.pos);
        view.dispatch(tr);
      }
    }
    function stop() {
      view.root.removeEventListener("mouseup", stop);
      view.root.removeEventListener("dragstart", stop);
      view.root.removeEventListener("mousemove", move);
      if (key$1.getState(view.state) != null)
        view.dispatch(view.state.tr.setMeta(key$1, -1));
    }
    function move(event) {
      const anchor = key$1.getState(view.state);
      let $anchor2;
      if (anchor != null) {
        $anchor2 = view.state.doc.resolve(anchor);
      } else if (domInCell(view, event.target) != startDOMCell) {
        $anchor2 = cellUnderMouse(view, startEvent);
        if (!$anchor2)
          return stop();
      }
      if ($anchor2)
        setCellSelection($anchor2, event);
    }
    view.root.addEventListener("mouseup", stop);
    view.root.addEventListener("dragstart", stop);
    view.root.addEventListener("mousemove", move);
    return false;
  }
  function atEndOfCell(view, axis, dir) {
    if (!(view.state.selection instanceof TextSelection))
      return null;
    const { $head } = view.state.selection;
    for (let d = $head.depth - 1; d >= 0; d--) {
      const parent = $head.node(d), index = dir < 0 ? $head.index(d) : $head.indexAfter(d);
      if (index != (dir < 0 ? 0 : parent.childCount))
        return null;
      if (parent.type.spec.tableRole == "cell" || parent.type.spec.tableRole == "header_cell") {
        const cellPos = $head.before(d);
        const dirStr = axis == "vert" ? dir > 0 ? "down" : "up" : dir > 0 ? "right" : "left";
        return view.endOfTextblock(dirStr) ? cellPos : null;
      }
    }
    return null;
  }
  function domInCell(view, dom) {
    for (; dom && dom != view.dom; dom = dom.parentNode)
      if (dom.nodeName == "TD" || dom.nodeName == "TH")
        return dom;
  }
  function cellUnderMouse(view, event) {
    const mousePos = view.posAtCoords({
      left: event.clientX,
      top: event.clientY
    });
    if (!mousePos)
      return null;
    return mousePos ? cellAround(view.state.doc.resolve(mousePos.pos)) : null;
  }
  var fixTablesKey = new PluginKey("fix-tables");
  function changedDescendants(old, cur, offset, f) {
    const oldSize = old.childCount, curSize = cur.childCount;
    outer:
      for (let i = 0, j = 0; i < curSize; i++) {
        const child = cur.child(i);
        for (let scan = j, e = Math.min(oldSize, i + 3); scan < e; scan++) {
          if (old.child(scan) == child) {
            j = scan + 1;
            offset += child.nodeSize;
            continue outer;
          }
        }
        f(child, offset);
        if (j < oldSize && old.child(j).sameMarkup(child))
          changedDescendants(old.child(j), child, offset + 1, f);
        else
          child.nodesBetween(0, child.content.size, f, offset + 1);
        offset += child.nodeSize;
      }
  }
  function fixTables(state, oldState) {
    let tr;
    const check = (node, pos) => {
      if (node.type.spec.tableRole == "table")
        tr = fixTable(state, node, pos, tr);
    };
    if (!oldState)
      state.doc.descendants(check);
    else if (oldState.doc != state.doc)
      changedDescendants(oldState.doc, state.doc, 0, check);
    return tr;
  }
  function fixTable(state, table, tablePos, tr) {
    const map2 = TableMap.get(table);
    if (!map2.problems)
      return tr;
    if (!tr)
      tr = state.tr;
    const mustAdd = [];
    for (let i = 0; i < map2.height; i++)
      mustAdd.push(0);
    for (let i = 0; i < map2.problems.length; i++) {
      const prob = map2.problems[i];
      if (prob.type == "collision") {
        const cell = table.nodeAt(prob.pos);
        for (let j = 0; j < cell.attrs.rowspan; j++)
          mustAdd[prob.row + j] += prob.n;
        tr.setNodeMarkup(tr.mapping.map(tablePos + 1 + prob.pos), null, removeColSpan(cell.attrs, cell.attrs.colspan - prob.n, prob.n));
      } else if (prob.type == "missing") {
        mustAdd[prob.row] += prob.n;
      } else if (prob.type == "overlong_rowspan") {
        const cell = table.nodeAt(prob.pos);
        tr.setNodeMarkup(tr.mapping.map(tablePos + 1 + prob.pos), null, setAttr(cell.attrs, "rowspan", cell.attrs.rowspan - prob.n));
      } else if (prob.type == "colwidth mismatch") {
        const cell = table.nodeAt(prob.pos);
        tr.setNodeMarkup(tr.mapping.map(tablePos + 1 + prob.pos), null, setAttr(cell.attrs, "colwidth", prob.colwidth));
      }
    }
    let first, last;
    for (let i = 0; i < mustAdd.length; i++)
      if (mustAdd[i]) {
        if (first == null)
          first = i;
        last = i;
      }
    for (let i = 0, pos = tablePos + 1; i < map2.height; i++) {
      const row = table.child(i);
      const end = pos + row.nodeSize;
      const add2 = mustAdd[i];
      if (add2 > 0) {
        let tableNodeType = "cell";
        if (row.firstChild) {
          tableNodeType = row.firstChild.type.spec.tableRole;
        }
        const nodes2 = [];
        for (let j = 0; j < add2; j++)
          nodes2.push(tableNodeTypes(state.schema)[tableNodeType].createAndFill());
        const side = (i == 0 || first == i - 1) && last == i ? pos + 1 : end - 1;
        tr.insert(tr.mapping.map(side), nodes2);
      }
      pos = end;
    }
    return tr.setMeta(fixTablesKey, { fixTables: true });
  }
  function selectedRect(state) {
    const sel = state.selection, $pos = selectionCell(state);
    const table = $pos.node(-1), tableStart = $pos.start(-1), map2 = TableMap.get(table);
    let rect;
    if (sel instanceof CellSelection)
      rect = map2.rectBetween(sel.$anchorCell.pos - tableStart, sel.$headCell.pos - tableStart);
    else
      rect = map2.findCell($pos.pos - tableStart);
    rect.tableStart = tableStart;
    rect.map = map2;
    rect.table = table;
    return rect;
  }
  function addColumn(tr, { map: map2, tableStart, table }, col) {
    let refColumn = col > 0 ? -1 : 0;
    if (columnIsHeader(map2, table, col + refColumn)) {
      refColumn = col == 0 || col == map2.width ? null : 0;
    }
    for (let row = 0; row < map2.height; row++) {
      const index = row * map2.width + col;
      if (col > 0 && col < map2.width && map2.map[index - 1] == map2.map[index]) {
        const pos = map2.map[index], cell = table.nodeAt(pos);
        tr.setNodeMarkup(tr.mapping.map(tableStart + pos), null, addColSpan(cell.attrs, col - map2.colCount(pos)));
        row += cell.attrs.rowspan - 1;
      } else {
        const type = refColumn == null ? tableNodeTypes(table.type.schema).cell : table.nodeAt(map2.map[index + refColumn]).type;
        const pos = map2.positionAt(row, col, table);
        tr.insert(tr.mapping.map(tableStart + pos), type.createAndFill());
      }
    }
    return tr;
  }
  function addColumnBefore(state, dispatch) {
    if (!isInTable(state))
      return false;
    if (dispatch) {
      const rect = selectedRect(state);
      dispatch(addColumn(state.tr, rect, rect.left));
    }
    return true;
  }
  function addColumnAfter(state, dispatch) {
    if (!isInTable(state))
      return false;
    if (dispatch) {
      const rect = selectedRect(state);
      dispatch(addColumn(state.tr, rect, rect.right));
    }
    return true;
  }
  function removeColumn(tr, { map: map2, table, tableStart }, col) {
    const mapStart = tr.mapping.maps.length;
    for (let row = 0; row < map2.height; ) {
      const index = row * map2.width + col, pos = map2.map[index], cell = table.nodeAt(pos);
      if (col > 0 && map2.map[index - 1] == pos || col < map2.width - 1 && map2.map[index + 1] == pos) {
        tr.setNodeMarkup(tr.mapping.slice(mapStart).map(tableStart + pos), null, removeColSpan(cell.attrs, col - map2.colCount(pos)));
      } else {
        const start = tr.mapping.slice(mapStart).map(tableStart + pos);
        tr.delete(start, start + cell.nodeSize);
      }
      row += cell.attrs.rowspan;
    }
  }
  function deleteColumn(state, dispatch) {
    if (!isInTable(state))
      return false;
    if (dispatch) {
      const rect = selectedRect(state), tr = state.tr;
      if (rect.left == 0 && rect.right == rect.map.width)
        return false;
      for (let i = rect.right - 1; ; i--) {
        removeColumn(tr, rect, i);
        if (i == rect.left)
          break;
        rect.table = rect.tableStart ? tr.doc.nodeAt(rect.tableStart - 1) : tr.doc;
        rect.map = TableMap.get(rect.table);
      }
      dispatch(tr);
    }
    return true;
  }
  function rowIsHeader(map2, table, row) {
    const headerCell = tableNodeTypes(table.type.schema).header_cell;
    for (let col = 0; col < map2.width; col++)
      if (table.nodeAt(map2.map[col + row * map2.width]).type != headerCell)
        return false;
    return true;
  }
  function addRow(tr, { map: map2, tableStart, table }, row) {
    let rowPos = tableStart;
    for (let i = 0; i < row; i++)
      rowPos += table.child(i).nodeSize;
    const cells = [];
    let refRow = row > 0 ? -1 : 0;
    if (rowIsHeader(map2, table, row + refRow)) {
      refRow = row == 0 || row == map2.height ? null : 0;
    }
    for (let col = 0, index = map2.width * row; col < map2.width; col++, index++) {
      if (row > 0 && row < map2.height && map2.map[index] == map2.map[index - map2.width]) {
        const pos = map2.map[index], attrs = table.nodeAt(pos).attrs;
        tr.setNodeMarkup(tableStart + pos, null, setAttr(attrs, "rowspan", attrs.rowspan + 1));
        col += attrs.colspan - 1;
      } else {
        const type = refRow == null ? tableNodeTypes(table.type.schema).cell : table.nodeAt(map2.map[index + refRow * map2.width]).type;
        cells.push(type.createAndFill());
      }
    }
    tr.insert(rowPos, tableNodeTypes(table.type.schema).row.create(null, cells));
    return tr;
  }
  function addRowBefore(state, dispatch) {
    if (!isInTable(state))
      return false;
    if (dispatch) {
      const rect = selectedRect(state);
      dispatch(addRow(state.tr, rect, rect.top));
    }
    return true;
  }
  function addRowAfter(state, dispatch) {
    if (!isInTable(state))
      return false;
    if (dispatch) {
      const rect = selectedRect(state);
      dispatch(addRow(state.tr, rect, rect.bottom));
    }
    return true;
  }
  function removeRow(tr, { map: map2, table, tableStart }, row) {
    let rowPos = 0;
    for (let i = 0; i < row; i++)
      rowPos += table.child(i).nodeSize;
    const nextRow = rowPos + table.child(row).nodeSize;
    const mapFrom = tr.mapping.maps.length;
    tr.delete(rowPos + tableStart, nextRow + tableStart);
    for (let col = 0, index = row * map2.width; col < map2.width; col++, index++) {
      const pos = map2.map[index];
      if (row > 0 && pos == map2.map[index - map2.width]) {
        const attrs = table.nodeAt(pos).attrs;
        tr.setNodeMarkup(tr.mapping.slice(mapFrom).map(pos + tableStart), null, setAttr(attrs, "rowspan", attrs.rowspan - 1));
        col += attrs.colspan - 1;
      } else if (row < map2.width && pos == map2.map[index + map2.width]) {
        const cell = table.nodeAt(pos);
        const copy2 = cell.type.create(setAttr(cell.attrs, "rowspan", cell.attrs.rowspan - 1), cell.content);
        const newPos = map2.positionAt(row + 1, col, table);
        tr.insert(tr.mapping.slice(mapFrom).map(tableStart + newPos), copy2);
        col += cell.attrs.colspan - 1;
      }
    }
  }
  function deleteRow(state, dispatch) {
    if (!isInTable(state))
      return false;
    if (dispatch) {
      const rect = selectedRect(state), tr = state.tr;
      if (rect.top == 0 && rect.bottom == rect.map.height)
        return false;
      for (let i = rect.bottom - 1; ; i--) {
        removeRow(tr, rect, i);
        if (i == rect.top)
          break;
        rect.table = rect.tableStart ? tr.doc.nodeAt(rect.tableStart - 1) : tr.doc;
        rect.map = TableMap.get(rect.table);
      }
      dispatch(tr);
    }
    return true;
  }
  function isEmpty(cell) {
    const c = cell.content;
    return c.childCount == 1 && c.firstChild.isTextblock && c.firstChild.childCount == 0;
  }
  function cellsOverlapRectangle({ width, height, map: map2 }, rect) {
    let indexTop = rect.top * width + rect.left, indexLeft = indexTop;
    let indexBottom = (rect.bottom - 1) * width + rect.left, indexRight = indexTop + (rect.right - rect.left - 1);
    for (let i = rect.top; i < rect.bottom; i++) {
      if (rect.left > 0 && map2[indexLeft] == map2[indexLeft - 1] || rect.right < width && map2[indexRight] == map2[indexRight + 1])
        return true;
      indexLeft += width;
      indexRight += width;
    }
    for (let i = rect.left; i < rect.right; i++) {
      if (rect.top > 0 && map2[indexTop] == map2[indexTop - width] || rect.bottom < height && map2[indexBottom] == map2[indexBottom + width])
        return true;
      indexTop++;
      indexBottom++;
    }
    return false;
  }
  function mergeCells(state, dispatch) {
    const sel = state.selection;
    if (!(sel instanceof CellSelection) || sel.$anchorCell.pos == sel.$headCell.pos)
      return false;
    const rect = selectedRect(state), { map: map2 } = rect;
    if (cellsOverlapRectangle(map2, rect))
      return false;
    if (dispatch) {
      const tr = state.tr;
      const seen = {};
      let content = Fragment.empty, mergedPos, mergedCell;
      for (let row = rect.top; row < rect.bottom; row++) {
        for (let col = rect.left; col < rect.right; col++) {
          const cellPos = map2.map[row * map2.width + col], cell = rect.table.nodeAt(cellPos);
          if (seen[cellPos])
            continue;
          seen[cellPos] = true;
          if (mergedPos == null) {
            mergedPos = cellPos;
            mergedCell = cell;
          } else {
            if (!isEmpty(cell))
              content = content.append(cell.content);
            const mapped = tr.mapping.map(cellPos + rect.tableStart);
            tr.delete(mapped, mapped + cell.nodeSize);
          }
        }
      }
      tr.setNodeMarkup(mergedPos + rect.tableStart, null, setAttr(addColSpan(mergedCell.attrs, mergedCell.attrs.colspan, rect.right - rect.left - mergedCell.attrs.colspan), "rowspan", rect.bottom - rect.top));
      if (content.size) {
        const end = mergedPos + 1 + mergedCell.content.size;
        const start = isEmpty(mergedCell) ? mergedPos + 1 : end;
        tr.replaceWith(start + rect.tableStart, end + rect.tableStart, content);
      }
      tr.setSelection(new CellSelection(tr.doc.resolve(mergedPos + rect.tableStart)));
      dispatch(tr);
    }
    return true;
  }
  function splitCell(state, dispatch) {
    const nodeTypes = tableNodeTypes(state.schema);
    return splitCellWithType(({ node }) => {
      return nodeTypes[node.type.spec.tableRole];
    })(state, dispatch);
  }
  function splitCellWithType(getCellType) {
    return (state, dispatch) => {
      const sel = state.selection;
      let cellNode, cellPos;
      if (!(sel instanceof CellSelection)) {
        cellNode = cellWrapping(sel.$from);
        if (!cellNode)
          return false;
        cellPos = cellAround(sel.$from).pos;
      } else {
        if (sel.$anchorCell.pos != sel.$headCell.pos)
          return false;
        cellNode = sel.$anchorCell.nodeAfter;
        cellPos = sel.$anchorCell.pos;
      }
      if (cellNode.attrs.colspan == 1 && cellNode.attrs.rowspan == 1) {
        return false;
      }
      if (dispatch) {
        let baseAttrs = cellNode.attrs;
        const attrs = [], colwidth = baseAttrs.colwidth;
        if (baseAttrs.rowspan > 1)
          baseAttrs = setAttr(baseAttrs, "rowspan", 1);
        if (baseAttrs.colspan > 1)
          baseAttrs = setAttr(baseAttrs, "colspan", 1);
        const rect = selectedRect(state), tr = state.tr;
        for (let i = 0; i < rect.right - rect.left; i++)
          attrs.push(colwidth ? setAttr(baseAttrs, "colwidth", colwidth && colwidth[i] ? [colwidth[i]] : null) : baseAttrs);
        let lastCell;
        for (let row = rect.top; row < rect.bottom; row++) {
          let pos = rect.map.positionAt(row, rect.left, rect.table);
          if (row == rect.top)
            pos += cellNode.nodeSize;
          for (let col = rect.left, i = 0; col < rect.right; col++, i++) {
            if (col == rect.left && row == rect.top)
              continue;
            tr.insert(lastCell = tr.mapping.map(pos + rect.tableStart, 1), getCellType({ node: cellNode, row, col }).createAndFill(attrs[i]));
          }
        }
        tr.setNodeMarkup(cellPos, getCellType({ node: cellNode, row: rect.top, col: rect.left }), attrs[0]);
        if (sel instanceof CellSelection)
          tr.setSelection(new CellSelection(tr.doc.resolve(sel.$anchorCell.pos), lastCell && tr.doc.resolve(lastCell)));
        dispatch(tr);
      }
      return true;
    };
  }
  function setCellAttr(name, value) {
    return function(state, dispatch) {
      if (!isInTable(state))
        return false;
      const $cell = selectionCell(state);
      if ($cell.nodeAfter.attrs[name] === value)
        return false;
      if (dispatch) {
        const tr = state.tr;
        if (state.selection instanceof CellSelection)
          state.selection.forEachCell((node, pos) => {
            if (node.attrs[name] !== value)
              tr.setNodeMarkup(pos, null, setAttr(node.attrs, name, value));
          });
        else
          tr.setNodeMarkup($cell.pos, null, setAttr($cell.nodeAfter.attrs, name, value));
        dispatch(tr);
      }
      return true;
    };
  }
  function deprecated_toggleHeader(type) {
    return function(state, dispatch) {
      if (!isInTable(state))
        return false;
      if (dispatch) {
        const types = tableNodeTypes(state.schema);
        const rect = selectedRect(state), tr = state.tr;
        const cells = rect.map.cellsInRect(type == "column" ? new Rect(rect.left, 0, rect.right, rect.map.height) : type == "row" ? new Rect(0, rect.top, rect.map.width, rect.bottom) : rect);
        const nodes2 = cells.map((pos) => rect.table.nodeAt(pos));
        for (let i = 0; i < cells.length; i++)
          if (nodes2[i].type == types.header_cell)
            tr.setNodeMarkup(rect.tableStart + cells[i], types.cell, nodes2[i].attrs);
        if (tr.steps.length == 0)
          for (let i = 0; i < cells.length; i++)
            tr.setNodeMarkup(rect.tableStart + cells[i], types.header_cell, nodes2[i].attrs);
        dispatch(tr);
      }
      return true;
    };
  }
  function isHeaderEnabledByType(type, rect, types) {
    const cellPositions = rect.map.cellsInRect({
      left: 0,
      top: 0,
      right: type == "row" ? rect.map.width : 1,
      bottom: type == "column" ? rect.map.height : 1
    });
    for (let i = 0; i < cellPositions.length; i++) {
      const cell = rect.table.nodeAt(cellPositions[i]);
      if (cell && cell.type !== types.header_cell) {
        return false;
      }
    }
    return true;
  }
  function toggleHeader(type, options) {
    options = options || { useDeprecatedLogic: false };
    if (options.useDeprecatedLogic)
      return deprecated_toggleHeader(type);
    return function(state, dispatch) {
      if (!isInTable(state))
        return false;
      if (dispatch) {
        const types = tableNodeTypes(state.schema);
        const rect = selectedRect(state), tr = state.tr;
        const isHeaderRowEnabled = isHeaderEnabledByType("row", rect, types);
        const isHeaderColumnEnabled = isHeaderEnabledByType("column", rect, types);
        const isHeaderEnabled = type === "column" ? isHeaderRowEnabled : type === "row" ? isHeaderColumnEnabled : false;
        const selectionStartsAt = isHeaderEnabled ? 1 : 0;
        const cellsRect = type == "column" ? new Rect(0, selectionStartsAt, 1, rect.map.height) : type == "row" ? new Rect(selectionStartsAt, 0, rect.map.width, 1) : rect;
        const newType = type == "column" ? isHeaderColumnEnabled ? types.cell : types.header_cell : type == "row" ? isHeaderRowEnabled ? types.cell : types.header_cell : types.cell;
        rect.map.cellsInRect(cellsRect).forEach((relativeCellPos) => {
          const cellPos = relativeCellPos + rect.tableStart;
          const cell = tr.doc.nodeAt(cellPos);
          if (cell) {
            tr.setNodeMarkup(cellPos, newType, cell.attrs);
          }
        });
        dispatch(tr);
      }
      return true;
    };
  }
  var toggleHeaderRow = toggleHeader("row", {
    useDeprecatedLogic: true
  });
  var toggleHeaderColumn = toggleHeader("column", {
    useDeprecatedLogic: true
  });
  var toggleHeaderCell = toggleHeader("cell", {
    useDeprecatedLogic: true
  });
  function findNextCell($cell, dir) {
    if (dir < 0) {
      const before = $cell.nodeBefore;
      if (before)
        return $cell.pos - before.nodeSize;
      for (let row = $cell.index(-1) - 1, rowEnd = $cell.before(); row >= 0; row--) {
        const rowNode = $cell.node(-1).child(row);
        if (rowNode.childCount)
          return rowEnd - 1 - rowNode.lastChild.nodeSize;
        rowEnd -= rowNode.nodeSize;
      }
    } else {
      if ($cell.index() < $cell.parent.childCount - 1)
        return $cell.pos + $cell.nodeAfter.nodeSize;
      const table = $cell.node(-1);
      for (let row = $cell.indexAfter(-1), rowStart = $cell.after(); row < table.childCount; row++) {
        const rowNode = table.child(row);
        if (rowNode.childCount)
          return rowStart + 1;
        rowStart += rowNode.nodeSize;
      }
    }
  }
  function goToNextCell(direction) {
    return function(state, dispatch) {
      if (!isInTable(state))
        return false;
      const cell = findNextCell(selectionCell(state), direction);
      if (cell == null)
        return;
      if (dispatch) {
        const $cell = state.doc.resolve(cell);
        dispatch(state.tr.setSelection(TextSelection.between($cell, moveCellForward($cell))).scrollIntoView());
      }
      return true;
    };
  }
  function deleteTable(state, dispatch) {
    const $pos = state.selection.$anchor;
    for (let d = $pos.depth; d > 0; d--) {
      const node = $pos.node(d);
      if (node.type.spec.tableRole == "table") {
        if (dispatch)
          dispatch(state.tr.delete($pos.before(d), $pos.after(d)).scrollIntoView());
        return true;
      }
    }
    return false;
  }
  var TableView = class {
    constructor(node, cellMinWidth) {
      this.node = node;
      this.cellMinWidth = cellMinWidth;
      this.dom = document.createElement("div");
      this.dom.className = "tableWrapper";
      this.table = this.dom.appendChild(document.createElement("table"));
      this.colgroup = this.table.appendChild(document.createElement("colgroup"));
      updateColumns(node, this.colgroup, this.table, cellMinWidth);
      this.contentDOM = this.table.appendChild(document.createElement("tbody"));
    }
    update(node) {
      if (node.type != this.node.type)
        return false;
      this.node = node;
      updateColumns(node, this.colgroup, this.table, this.cellMinWidth);
      return true;
    }
    ignoreMutation(record) {
      return record.type == "attributes" && (record.target == this.table || this.colgroup.contains(record.target));
    }
  };
  function updateColumns(node, colgroup, table, cellMinWidth, overrideCol, overrideValue) {
    let totalWidth = 0, fixedWidth = true;
    let nextDOM = colgroup.firstChild;
    const row = node.firstChild;
    for (let i = 0, col = 0; i < row.childCount; i++) {
      const { colspan, colwidth } = row.child(i).attrs;
      for (let j = 0; j < colspan; j++, col++) {
        const hasWidth = overrideCol == col ? overrideValue : colwidth && colwidth[j];
        const cssWidth = hasWidth ? hasWidth + "px" : "";
        totalWidth += hasWidth || cellMinWidth;
        if (!hasWidth)
          fixedWidth = false;
        if (!nextDOM) {
          colgroup.appendChild(document.createElement("col")).style.width = cssWidth;
        } else {
          if (nextDOM.style.width != cssWidth)
            nextDOM.style.width = cssWidth;
          nextDOM = nextDOM.nextSibling;
        }
      }
    }
    while (nextDOM) {
      const after = nextDOM.nextSibling;
      nextDOM.parentNode.removeChild(nextDOM);
      nextDOM = after;
    }
    if (fixedWidth) {
      table.style.width = totalWidth + "px";
      table.style.minWidth = "";
    } else {
      table.style.width = "";
      table.style.minWidth = totalWidth + "px";
    }
  }
  var key = new PluginKey("tableColumnResizing");
  function columnResizing({ handleWidth = 5, cellMinWidth = 25, View = TableView, lastColumnResizable = true } = {}) {
    const plugin = new Plugin({
      key,
      state: {
        init(_, state) {
          var _a, _b;
          const tableNodeTypeName = tableNodeTypes(state.schema).table.name;
          const nodeViews = ((_b = (_a = plugin === null || plugin === void 0 ? void 0 : plugin.spec) === null || _a === void 0 ? void 0 : _a.props) === null || _b === void 0 ? void 0 : _b.nodeViews) || [];
          nodeViews[tableNodeTypeName] = (node) => new View(node, cellMinWidth);
          return new ResizeState(-1, false);
        },
        apply(tr, prev) {
          return prev.apply(tr);
        }
      },
      props: {
        attributes(state) {
          const pluginState = key.getState(state);
          return pluginState.activeHandle > -1 ? { class: "resize-cursor" } : null;
        },
        handleDOMEvents: {
          mousemove(view, event) {
            handleMouseMove(view, event, handleWidth, cellMinWidth, lastColumnResizable);
            return false;
          },
          mouseleave(view) {
            handleMouseLeave(view);
            return false;
          },
          mousedown(view, event) {
            handleMouseDown(view, event, cellMinWidth);
            return false;
          }
        },
        decorations(state) {
          const pluginState = key.getState(state);
          if (pluginState.activeHandle > -1)
            return handleDecorations(state, pluginState.activeHandle);
        },
        nodeViews: {}
      }
    });
    return plugin;
  }
  var ResizeState = class {
    constructor(activeHandle, dragging) {
      this.activeHandle = activeHandle;
      this.dragging = dragging;
    }
    apply(tr) {
      const action = tr.getMeta(key);
      if (action && action.setHandle != null)
        return new ResizeState(action.setHandle, null);
      if (action && action.setDragging !== void 0)
        return new ResizeState(this.activeHandle, action.setDragging);
      if (this.activeHandle > -1 && tr.docChanged) {
        let handle = tr.mapping.map(this.activeHandle, -1);
        if (!pointsAtCell(tr.doc.resolve(handle)))
          handle = null;
        return new ResizeState(handle, this.dragging);
      }
      return this;
    }
  };
  function handleMouseMove(view, event, handleWidth, cellMinWidth, lastColumnResizable) {
    const pluginState = key.getState(view.state);
    if (!pluginState.dragging) {
      const target = domCellAround(event.target);
      let cell = -1;
      if (target) {
        const { left, right } = target.getBoundingClientRect();
        if (event.clientX - left <= handleWidth)
          cell = edgeCell(view, event, "left");
        else if (right - event.clientX <= handleWidth)
          cell = edgeCell(view, event, "right");
      }
      if (cell != pluginState.activeHandle) {
        if (!lastColumnResizable && cell !== -1) {
          const $cell = view.state.doc.resolve(cell);
          const table = $cell.node(-1), map2 = TableMap.get(table), start = $cell.start(-1);
          const col = map2.colCount($cell.pos - start) + $cell.nodeAfter.attrs.colspan - 1;
          if (col == map2.width - 1) {
            return;
          }
        }
        updateHandle(view, cell);
      }
    }
  }
  function handleMouseLeave(view) {
    const pluginState = key.getState(view.state);
    if (pluginState.activeHandle > -1 && !pluginState.dragging)
      updateHandle(view, -1);
  }
  function handleMouseDown(view, event, cellMinWidth) {
    const pluginState = key.getState(view.state);
    if (pluginState.activeHandle == -1 || pluginState.dragging)
      return false;
    const cell = view.state.doc.nodeAt(pluginState.activeHandle);
    const width = currentColWidth(view, pluginState.activeHandle, cell.attrs);
    view.dispatch(view.state.tr.setMeta(key, {
      setDragging: { startX: event.clientX, startWidth: width }
    }));
    function finish(event2) {
      window.removeEventListener("mouseup", finish);
      window.removeEventListener("mousemove", move);
      const pluginState2 = key.getState(view.state);
      if (pluginState2.dragging) {
        updateColumnWidth(view, pluginState2.activeHandle, draggedWidth(pluginState2.dragging, event2, cellMinWidth));
        view.dispatch(view.state.tr.setMeta(key, { setDragging: null }));
      }
    }
    function move(event2) {
      if (!event2.which)
        return finish(event2);
      const pluginState2 = key.getState(view.state);
      const dragged = draggedWidth(pluginState2.dragging, event2, cellMinWidth);
      displayColumnWidth(view, pluginState2.activeHandle, dragged, cellMinWidth);
    }
    window.addEventListener("mouseup", finish);
    window.addEventListener("mousemove", move);
    event.preventDefault();
    return true;
  }
  function currentColWidth(view, cellPos, { colspan, colwidth }) {
    const width = colwidth && colwidth[colwidth.length - 1];
    if (width)
      return width;
    const dom = view.domAtPos(cellPos);
    const node = dom.node.childNodes[dom.offset];
    let domWidth = node.offsetWidth, parts = colspan;
    if (colwidth) {
      for (let i = 0; i < colspan; i++)
        if (colwidth[i]) {
          domWidth -= colwidth[i];
          parts--;
        }
    }
    return domWidth / parts;
  }
  function domCellAround(target) {
    while (target && target.nodeName != "TD" && target.nodeName != "TH")
      target = target.classList.contains("ProseMirror") ? null : target.parentNode;
    return target;
  }
  function edgeCell(view, event, side) {
    const found2 = view.posAtCoords({ left: event.clientX, top: event.clientY });
    if (!found2)
      return -1;
    const { pos } = found2;
    const $cell = cellAround(view.state.doc.resolve(pos));
    if (!$cell)
      return -1;
    if (side == "right")
      return $cell.pos;
    const map2 = TableMap.get($cell.node(-1)), start = $cell.start(-1);
    const index = map2.map.indexOf($cell.pos - start);
    return index % map2.width == 0 ? -1 : start + map2.map[index - 1];
  }
  function draggedWidth(dragging, event, cellMinWidth) {
    const offset = event.clientX - dragging.startX;
    return Math.max(cellMinWidth, dragging.startWidth + offset);
  }
  function updateHandle(view, value) {
    view.dispatch(view.state.tr.setMeta(key, { setHandle: value }));
  }
  function updateColumnWidth(view, cell, width) {
    const $cell = view.state.doc.resolve(cell);
    const table = $cell.node(-1), map2 = TableMap.get(table), start = $cell.start(-1);
    const col = map2.colCount($cell.pos - start) + $cell.nodeAfter.attrs.colspan - 1;
    const tr = view.state.tr;
    for (let row = 0; row < map2.height; row++) {
      const mapIndex = row * map2.width + col;
      if (row && map2.map[mapIndex] == map2.map[mapIndex - map2.width])
        continue;
      const pos = map2.map[mapIndex], { attrs } = table.nodeAt(pos);
      const index = attrs.colspan == 1 ? 0 : col - map2.colCount(pos);
      if (attrs.colwidth && attrs.colwidth[index] == width)
        continue;
      const colwidth = attrs.colwidth ? attrs.colwidth.slice() : zeroes(attrs.colspan);
      colwidth[index] = width;
      tr.setNodeMarkup(start + pos, null, setAttr(attrs, "colwidth", colwidth));
    }
    if (tr.docChanged)
      view.dispatch(tr);
  }
  function displayColumnWidth(view, cell, width, cellMinWidth) {
    const $cell = view.state.doc.resolve(cell);
    const table = $cell.node(-1), start = $cell.start(-1);
    const col = TableMap.get(table).colCount($cell.pos - start) + $cell.nodeAfter.attrs.colspan - 1;
    let dom = view.domAtPos($cell.start(-1)).node;
    while (dom.nodeName != "TABLE")
      dom = dom.parentNode;
    updateColumns(table, dom.firstChild, dom, cellMinWidth, col, width);
  }
  function zeroes(n) {
    const result = [];
    for (let i = 0; i < n; i++)
      result.push(0);
    return result;
  }
  function handleDecorations(state, cell) {
    const decorations = [];
    const $cell = state.doc.resolve(cell);
    const table = $cell.node(-1), map2 = TableMap.get(table), start = $cell.start(-1);
    const col = map2.colCount($cell.pos - start) + $cell.nodeAfter.attrs.colspan;
    for (let row = 0; row < map2.height; row++) {
      const index = col + row * map2.width - 1;
      if ((col == map2.width || map2.map[index] != map2.map[index + 1]) && (row == 0 || map2.map[index - 1] != map2.map[index - 1 - map2.width])) {
        const cellPos = map2.map[index];
        const pos = start + cellPos + table.nodeAt(cellPos).nodeSize - 1;
        const dom = document.createElement("div");
        dom.className = "column-resize-handle";
        decorations.push(Decoration.widget(pos, dom));
      }
    }
    return DecorationSet.create(state.doc, decorations);
  }
  function tableEditing({ allowTableNodeSelection = false } = {}) {
    return new Plugin({
      key: key$1,
      state: {
        init() {
          return null;
        },
        apply(tr, cur) {
          const set = tr.getMeta(key$1);
          if (set != null)
            return set == -1 ? null : set;
          if (cur == null || !tr.docChanged)
            return cur;
          const { deleted, pos } = tr.mapping.mapResult(cur);
          return deleted ? null : pos;
        }
      },
      props: {
        decorations: drawCellSelection,
        handleDOMEvents: {
          mousedown: handleMouseDown$1
        },
        createSelectionBetween(view) {
          if (key$1.getState(view.state) != null)
            return view.state.selection;
        },
        handleTripleClick: handleTripleClick2,
        handleKeyDown: handleKeyDown2,
        handlePaste
      },
      appendTransaction(_, oldState, state) {
        return normalizeSelection(state, fixTables(state, oldState), allowTableNodeSelection);
      }
    });
  }

  // node_modules/prosemirror-schema-list/dist/index.js
  function wrapInList(listType, attrs = null) {
    return function(state, dispatch) {
      let { $from, $to } = state.selection;
      let range = $from.blockRange($to), doJoin = false, outerRange = range;
      if (!range)
        return false;
      if (range.depth >= 2 && $from.node(range.depth - 1).type.compatibleContent(listType) && range.startIndex == 0) {
        if ($from.index(range.depth - 1) == 0)
          return false;
        let $insert = state.doc.resolve(range.start - 2);
        outerRange = new NodeRange($insert, $insert, range.depth);
        if (range.endIndex < range.parent.childCount)
          range = new NodeRange($from, state.doc.resolve($to.end(range.depth)), range.depth);
        doJoin = true;
      }
      let wrap2 = findWrapping(outerRange, listType, attrs, range);
      if (!wrap2)
        return false;
      if (dispatch)
        dispatch(doWrapInList(state.tr, range, wrap2, doJoin, listType).scrollIntoView());
      return true;
    };
  }
  function doWrapInList(tr, range, wrappers, joinBefore, listType) {
    let content = Fragment.empty;
    for (let i = wrappers.length - 1; i >= 0; i--)
      content = Fragment.from(wrappers[i].type.create(wrappers[i].attrs, content));
    tr.step(new ReplaceAroundStep(range.start - (joinBefore ? 2 : 0), range.end, range.start, range.end, new Slice(content, 0, 0), wrappers.length, true));
    let found2 = 0;
    for (let i = 0; i < wrappers.length; i++)
      if (wrappers[i].type == listType)
        found2 = i + 1;
    let splitDepth = wrappers.length - found2;
    let splitPos = range.start + wrappers.length - (joinBefore ? 2 : 0), parent = range.parent;
    for (let i = range.startIndex, e = range.endIndex, first = true; i < e; i++, first = false) {
      if (!first && canSplit(tr.doc, splitPos, splitDepth)) {
        tr.split(splitPos, splitDepth);
        splitPos += 2 * splitDepth;
      }
      splitPos += parent.child(i).nodeSize;
    }
    return tr;
  }
  function splitListItem(itemType) {
    return function(state, dispatch) {
      let { $from, $to, node } = state.selection;
      if (node && node.isBlock || $from.depth < 2 || !$from.sameParent($to))
        return false;
      let grandParent = $from.node(-1);
      if (grandParent.type != itemType)
        return false;
      if ($from.parent.content.size == 0 && $from.node(-1).childCount == $from.indexAfter(-1)) {
        if ($from.depth == 3 || $from.node(-3).type != itemType || $from.index(-2) != $from.node(-2).childCount - 1)
          return false;
        if (dispatch) {
          let wrap2 = Fragment.empty;
          let depthBefore = $from.index(-1) ? 1 : $from.index(-2) ? 2 : 3;
          for (let d = $from.depth - depthBefore; d >= $from.depth - 3; d--)
            wrap2 = Fragment.from($from.node(d).copy(wrap2));
          let depthAfter = $from.indexAfter(-1) < $from.node(-2).childCount ? 1 : $from.indexAfter(-2) < $from.node(-3).childCount ? 2 : 3;
          wrap2 = wrap2.append(Fragment.from(itemType.createAndFill()));
          let start = $from.before($from.depth - (depthBefore - 1));
          let tr2 = state.tr.replace(start, $from.after(-depthAfter), new Slice(wrap2, 4 - depthBefore, 0));
          let sel = -1;
          tr2.doc.nodesBetween(start, tr2.doc.content.size, (node2, pos) => {
            if (sel > -1)
              return false;
            if (node2.isTextblock && node2.content.size == 0)
              sel = pos + 1;
          });
          if (sel > -1)
            tr2.setSelection(Selection.near(tr2.doc.resolve(sel)));
          dispatch(tr2.scrollIntoView());
        }
        return true;
      }
      let nextType = $to.pos == $from.end() ? grandParent.contentMatchAt(0).defaultType : null;
      let tr = state.tr.delete($from.pos, $to.pos);
      let types = nextType ? [null, { type: nextType }] : void 0;
      if (!canSplit(tr.doc, $from.pos, 2, types))
        return false;
      if (dispatch)
        dispatch(tr.split($from.pos, 2, types).scrollIntoView());
      return true;
    };
  }
  function liftListItem(itemType) {
    return function(state, dispatch) {
      let { $from, $to } = state.selection;
      let range = $from.blockRange($to, (node) => node.childCount > 0 && node.firstChild.type == itemType);
      if (!range)
        return false;
      if (!dispatch)
        return true;
      if ($from.node(range.depth - 1).type == itemType)
        return liftToOuterList(state, dispatch, itemType, range);
      else
        return liftOutOfList(state, dispatch, range);
    };
  }
  function liftToOuterList(state, dispatch, itemType, range) {
    let tr = state.tr, end = range.end, endOfList = range.$to.end(range.depth);
    if (end < endOfList) {
      tr.step(new ReplaceAroundStep(end - 1, endOfList, end, endOfList, new Slice(Fragment.from(itemType.create(null, range.parent.copy())), 1, 0), 1, true));
      range = new NodeRange(tr.doc.resolve(range.$from.pos), tr.doc.resolve(endOfList), range.depth);
    }
    dispatch(tr.lift(range, liftTarget(range)).scrollIntoView());
    return true;
  }
  function liftOutOfList(state, dispatch, range) {
    let tr = state.tr, list = range.parent;
    for (let pos = range.end, i = range.endIndex - 1, e = range.startIndex; i > e; i--) {
      pos -= list.child(i).nodeSize;
      tr.delete(pos - 1, pos + 1);
    }
    let $start = tr.doc.resolve(range.start), item = $start.nodeAfter;
    if (tr.mapping.map(range.end) != range.start + $start.nodeAfter.nodeSize)
      return false;
    let atStart = range.startIndex == 0, atEnd = range.endIndex == list.childCount;
    let parent = $start.node(-1), indexBefore = $start.index(-1);
    if (!parent.canReplace(indexBefore + (atStart ? 0 : 1), indexBefore + 1, item.content.append(atEnd ? Fragment.empty : Fragment.from(list))))
      return false;
    let start = $start.pos, end = start + item.nodeSize;
    tr.step(new ReplaceAroundStep(start - (atStart ? 1 : 0), end + (atEnd ? 1 : 0), start + 1, end - 1, new Slice((atStart ? Fragment.empty : Fragment.from(list.copy(Fragment.empty))).append(atEnd ? Fragment.empty : Fragment.from(list.copy(Fragment.empty))), atStart ? 0 : 1, atEnd ? 0 : 1), atStart ? 0 : 1));
    dispatch(tr.scrollIntoView());
    return true;
  }
  function sinkListItem(itemType) {
    return function(state, dispatch) {
      let { $from, $to } = state.selection;
      let range = $from.blockRange($to, (node) => node.childCount > 0 && node.firstChild.type == itemType);
      if (!range)
        return false;
      let startIndex = range.startIndex;
      if (startIndex == 0)
        return false;
      let parent = range.parent, nodeBefore = parent.child(startIndex - 1);
      if (nodeBefore.type != itemType)
        return false;
      if (dispatch) {
        let nestedBefore = nodeBefore.lastChild && nodeBefore.lastChild.type == parent.type;
        let inner = Fragment.from(nestedBefore ? itemType.create() : null);
        let slice2 = new Slice(Fragment.from(itemType.create(null, Fragment.from(parent.type.create(null, inner)))), nestedBefore ? 3 : 1, 0);
        let before = range.start, after = range.end;
        dispatch(state.tr.step(new ReplaceAroundStep(before - (nestedBefore ? 3 : 1), after, before, after, slice2, 1, true)).scrollIntoView());
      }
      return true;
    };
  }

  // ts/helper/prompt.ts
  var prefix2 = "ProseMirror-prompt";
  function openPrompt(options) {
    let wrapper = document.body.appendChild(document.createElement("div"));
    wrapper.className = prefix2;
    let mouseOutside = (e) => {
      if (!wrapper.contains(e.target))
        close2();
    };
    setTimeout(() => window.addEventListener("mousedown", mouseOutside), 50);
    let close2 = () => {
      window.removeEventListener("mousedown", mouseOutside);
      if (wrapper.parentNode)
        wrapper.parentNode.removeChild(wrapper);
    };
    let domFields = [];
    for (let name in options.fields)
      domFields.push(options.fields[name].render());
    let submitButton = document.createElement("button");
    submitButton.type = "submit";
    submitButton.className = prefix2 + "-submit";
    submitButton.textContent = "OK";
    let cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.className = prefix2 + "-cancel";
    cancelButton.textContent = "Cancel";
    cancelButton.addEventListener("click", close2);
    let form = wrapper.appendChild(document.createElement("form"));
    if (options.title)
      form.appendChild(document.createElement("h5")).textContent = options.title;
    domFields.forEach((field) => {
      form.appendChild(document.createElement("div")).appendChild(field);
    });
    let buttons = form.appendChild(document.createElement("div"));
    buttons.className = prefix2 + "-buttons";
    buttons.appendChild(submitButton);
    buttons.appendChild(document.createTextNode(" "));
    buttons.appendChild(cancelButton);
    let box = wrapper.getBoundingClientRect();
    wrapper.style.top = (window.innerHeight - box.height) / 2 + "px";
    wrapper.style.left = (window.innerWidth - box.width) / 2 + "px";
    let submit = () => {
      let params = getValues(options.fields, domFields);
      if (params) {
        close2();
        options.callback(params);
      }
    };
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      submit();
    });
    form.addEventListener("keydown", (e) => {
      if (e.keyCode == 27) {
        e.preventDefault();
        close2();
      } else if (e.keyCode == 13 && !(e.ctrlKey || e.metaKey || e.shiftKey)) {
        e.preventDefault();
        submit();
      } else if (e.keyCode == 9) {
        window.setTimeout(() => {
          if (!wrapper.contains(document.activeElement))
            close2();
        }, 500);
      }
    });
    let input = form.elements[0];
    if (input)
      input.focus();
  }
  function getValues(fields, domFields) {
    let result = /* @__PURE__ */ Object.create(null), i = 0;
    for (let name in fields) {
      let field = fields[name], dom = domFields[i++];
      let value = field.read(dom), bad = field.validate(value);
      if (bad) {
        reportInvalid(dom, bad);
        return null;
      }
      result[name] = field.clean(value);
    }
    return result;
  }
  function reportInvalid(dom, message) {
    let parent = dom.parentNode;
    let msg = parent.appendChild(document.createElement("div"));
    msg.style.left = dom.offsetLeft + dom.offsetWidth + 2 + "px";
    msg.style.top = dom.offsetTop - 5 + "px";
    msg.className = "ProseMirror-invalid";
    msg.textContent = message;
    setTimeout(() => parent.removeChild(msg), 1500);
  }
  var Field = class {
    constructor(options) {
      this.options = options;
    }
    read(dom) {
      return dom.value;
    }
    validateType(value) {
      return null;
    }
    validate(value) {
      if (!value && this.options.required)
        return "Required field";
      return this.validateType(value) || (this.options.validate ? this.options.validate(value) : null);
    }
    clean(value) {
      return this.options.clean ? this.options.clean(value) : value;
    }
  };
  var TextField = class extends Field {
    render() {
      let input = document.createElement("input");
      input.type = "text";
      input.placeholder = this.options.label;
      input.value = this.options.value || "";
      input.autocomplete = "off";
      return input;
    }
  };

  // ts/helper/menu.ts
  function canInsert(state, nodeType) {
    let $from = state.selection.$from;
    for (let d = $from.depth; d >= 0; d--) {
      let index = $from.index(d);
      if ($from.node(d).canReplaceWith(index, index, nodeType))
        return true;
    }
    return false;
  }
  function insertImageItem(nodeType) {
    return new MenuItem({
      title: "Insert image",
      label: "Image",
      enable(state) {
        return canInsert(state, nodeType);
      },
      run(state, _, view) {
        let { from: from2, to } = state.selection, attrs = null;
        if (state.selection instanceof NodeSelection && state.selection.node.type == nodeType)
          attrs = state.selection.node.attrs;
        openPrompt({
          title: "Insert image",
          fields: {
            src: new TextField({ label: "Location", required: true, value: attrs && attrs.src }),
            title: new TextField({ label: "Title", value: attrs && attrs.title }),
            alt: new TextField({
              label: "Description",
              value: attrs ? attrs.alt : state.doc.textBetween(from2, to, " ")
            })
          },
          callback(attrs2) {
            view.dispatch(view.state.tr.replaceSelectionWith(nodeType.createAndFill(attrs2)));
            view.focus();
          }
        });
      }
    });
  }
  function cmdItem(cmd, options) {
    let passedOptions = {
      label: options.title,
      run: cmd
    };
    for (let prop in options)
      passedOptions[prop] = options[prop];
    if (!options.enable && !options.select)
      passedOptions[options.enable ? "enable" : "select"] = (state) => cmd(state);
    return new MenuItem(passedOptions);
  }
  function markActive(state, type) {
    let { from: from2, $from, to, empty: empty2 } = state.selection;
    if (empty2)
      return !!type.isInSet(state.storedMarks || $from.marks());
    else
      return state.doc.rangeHasMark(from2, to, type);
  }
  function markItem(markType, options) {
    let passedOptions = {
      active(state) {
        return markActive(state, markType);
      }
    };
    for (let prop in options)
      passedOptions[prop] = options[prop];
    return cmdItem(toggleMark(markType), passedOptions);
  }
  function linkItem(markType) {
    return new MenuItem({
      title: "Add or remove link",
      icon: icons.link,
      active(state) {
        return markActive(state, markType);
      },
      enable(state) {
        return !state.selection.empty;
      },
      run(state, dispatch, view) {
        if (markActive(state, markType)) {
          toggleMark(markType)(state, dispatch);
          return true;
        }
        openPrompt({
          title: "Create a link",
          fields: {
            href: new TextField({
              label: "Link target",
              required: true
            }),
            title: new TextField({ label: "Title" })
          },
          callback(attrs) {
            toggleMark(markType, attrs)(view.state, view.dispatch);
            view.focus();
          }
        });
      }
    });
  }
  function wrapListItem(nodeType, options) {
    return cmdItem(wrapInList(nodeType, options.attrs), options);
  }
  function buildMenuItems(schema2) {
    let r = {};
    let mark;
    if (mark = schema2.marks.strong) {
      r.toggleStrong = markItem(mark, { title: "Toggle strong style", icon: icons.strong });
    }
    if (mark = schema2.marks.em) {
      r.toggleEm = markItem(mark, { title: "Toggle emphasis", icon: icons.em });
    }
    if (mark = schema2.marks.code) {
      r.toggleCode = markItem(mark, { title: "Toggle code font", icon: icons.code });
    }
    if (mark = schema2.marks.link) {
      r.toggleLink = linkItem(mark);
    }
    let node;
    if (node = schema2.nodes.image) {
      r.insertImage = insertImageItem(node);
    }
    if (node = schema2.nodes.bullet_list) {
      r.wrapBulletList = wrapListItem(node, {
        title: "Wrap in bullet list",
        icon: icons.bulletList
      });
    }
    if (node = schema2.nodes.ordered_list) {
      r.wrapOrderedList = wrapListItem(node, {
        title: "Wrap in ordered list",
        icon: icons.orderedList
      });
    }
    if (node = schema2.nodes.blockquote) {
      r.wrapBlockQuote = wrapItem(node, {
        title: "Wrap in block quote",
        icon: icons.blockquote
      });
    }
    if (node = schema2.nodes.paragraph) {
      r.makeParagraph = blockTypeItem(node, {
        title: "Change to paragraph",
        label: "Plain"
      });
    }
    if (node = schema2.nodes.code_block) {
      r.makeCodeBlock = blockTypeItem(node, {
        title: "Change to code block",
        label: "Code"
      });
    }
    if (node = schema2.nodes.heading) {
      for (let i = 1; i <= 10; i++) {
        r["makeHead" + i] = blockTypeItem(node, {
          title: "Change to heading " + i,
          label: "Level " + i,
          attrs: { level: i }
        });
      }
    }
    if (node = schema2.nodes.horizontal_rule) {
      let hr = node;
      r.insertHorizontalRule = new MenuItem({
        title: "Insert horizontal rule",
        label: "Horizontal rule",
        enable(state) {
          return canInsert(state, hr);
        },
        run(state, dispatch) {
          dispatch(state.tr.replaceSelectionWith(hr.create()));
        }
      });
    }
    let cut = (arr) => arr.filter((x) => x);
    r.insertMenu = new Dropdown(cut([r.insertImage, r.insertHorizontalRule]), { label: "Insert" });
    r.typeMenu = new Dropdown(cut([
      r.makeParagraph,
      r.makeCodeBlock,
      r.makeHead1 && new DropdownSubmenu(cut([
        r.makeHead1,
        r.makeHead2,
        r.makeHead3,
        r.makeHead4,
        r.makeHead5,
        r.makeHead6
      ]), { label: "Heading" })
    ]), { label: "Type..." });
    r.inlineMenu = [cut([r.toggleStrong, r.toggleEm, r.toggleCode, r.toggleLink])];
    r.blockMenu = [cut([
      r.wrapBulletList,
      r.wrapOrderedList,
      r.wrapBlockQuote,
      joinUpItem,
      liftItem,
      selectParentNodeItem
    ])];
    r.fullMenu = r.inlineMenu.concat([[r.insertMenu, r.typeMenu]], [[undoItem, redoItem]], r.blockMenu);
    return r;
  }

  // node_modules/prosemirror-inputrules/dist/index.js
  var InputRule = class {
    constructor(match, handler) {
      this.match = match;
      this.match = match;
      this.handler = typeof handler == "string" ? stringHandler(handler) : handler;
    }
  };
  function stringHandler(string) {
    return function(state, match, start, end) {
      let insert = string;
      if (match[1]) {
        let offset = match[0].lastIndexOf(match[1]);
        insert += match[0].slice(offset + match[1].length);
        start += offset;
        let cutOff = start - end;
        if (cutOff > 0) {
          insert = match[0].slice(offset - cutOff, offset) + insert;
          start = end;
        }
      }
      return state.tr.insertText(insert, start, end);
    };
  }
  var MAX_MATCH = 500;
  function inputRules({ rules }) {
    let plugin = new Plugin({
      state: {
        init() {
          return null;
        },
        apply(tr, prev) {
          let stored = tr.getMeta(this);
          if (stored)
            return stored;
          return tr.selectionSet || tr.docChanged ? null : prev;
        }
      },
      props: {
        handleTextInput(view, from2, to, text) {
          return run(view, from2, to, text, rules, plugin);
        },
        handleDOMEvents: {
          compositionend: (view) => {
            setTimeout(() => {
              let { $cursor } = view.state.selection;
              if ($cursor)
                run(view, $cursor.pos, $cursor.pos, "", rules, plugin);
            });
          }
        }
      },
      isInputRules: true
    });
    return plugin;
  }
  function run(view, from2, to, text, rules, plugin) {
    if (view.composing)
      return false;
    let state = view.state, $from = state.doc.resolve(from2);
    if ($from.parent.type.spec.code)
      return false;
    let textBefore = $from.parent.textBetween(Math.max(0, $from.parentOffset - MAX_MATCH), $from.parentOffset, null, "\uFFFC") + text;
    for (let i = 0; i < rules.length; i++) {
      let match = rules[i].match.exec(textBefore);
      let tr = match && rules[i].handler(state, match, from2 - (match[0].length - text.length), to);
      if (!tr)
        continue;
      view.dispatch(tr.setMeta(plugin, { transform: tr, from: from2, to, text }));
      return true;
    }
    return false;
  }
  var undoInputRule = (state, dispatch) => {
    let plugins = state.plugins;
    for (let i = 0; i < plugins.length; i++) {
      let plugin = plugins[i], undoable;
      if (plugin.spec.isInputRules && (undoable = plugin.getState(state))) {
        if (dispatch) {
          let tr = state.tr, toUndo = undoable.transform;
          for (let j = toUndo.steps.length - 1; j >= 0; j--)
            tr.step(toUndo.steps[j].invert(toUndo.docs[j]));
          if (undoable.text) {
            let marks2 = tr.doc.resolve(undoable.from).marks();
            tr.replaceWith(undoable.from, undoable.to, state.schema.text(undoable.text, marks2));
          } else {
            tr.delete(undoable.from, undoable.to);
          }
          dispatch(tr);
        }
        return true;
      }
    }
    return false;
  };
  var emDash = new InputRule(/--$/, "\u2014");
  var ellipsis = new InputRule(/\.\.\.$/, "\u2026");
  var openDoubleQuote = new InputRule(/(?:^|[\s\{\[\(\<'"\u2018\u201C])(")$/, "\u201C");
  var closeDoubleQuote = new InputRule(/"$/, "\u201D");
  var openSingleQuote = new InputRule(/(?:^|[\s\{\[\(\<'"\u2018\u201C])(')$/, "\u2018");
  var closeSingleQuote = new InputRule(/'$/, "\u2019");
  var smartQuotes = [openDoubleQuote, closeDoubleQuote, openSingleQuote, closeSingleQuote];
  function wrappingInputRule(regexp, nodeType, getAttrs = null, joinPredicate) {
    return new InputRule(regexp, (state, match, start, end) => {
      let attrs = getAttrs instanceof Function ? getAttrs(match) : getAttrs;
      let tr = state.tr.delete(start, end);
      let $start = tr.doc.resolve(start), range = $start.blockRange(), wrapping = range && findWrapping(range, nodeType, attrs);
      if (!wrapping)
        return null;
      tr.wrap(range, wrapping);
      let before = tr.doc.resolve(start - 1).nodeBefore;
      if (before && before.type == nodeType && canJoin(tr.doc, start - 1) && (!joinPredicate || joinPredicate(match, before)))
        tr.join(start - 1);
      return tr;
    });
  }
  function textblockTypeInputRule(regexp, nodeType, getAttrs = null) {
    return new InputRule(regexp, (state, match, start, end) => {
      let $start = state.doc.resolve(start);
      let attrs = getAttrs instanceof Function ? getAttrs(match) : getAttrs;
      if (!$start.node(-1).canReplaceWith($start.index(-1), $start.indexAfter(-1), nodeType))
        return null;
      return state.tr.delete(start, end).setBlockType(start, start, nodeType, attrs);
    });
  }

  // ts/helper/keymap.ts
  var mac5 = typeof navigator != "undefined" ? /Mac|iP(hone|[oa]d)/.test(navigator.platform) : false;
  function buildKeymap(schema2, mapKeys) {
    let keys2 = {}, type;
    function bind2(key2, cmd) {
      if (mapKeys) {
        let mapped = mapKeys[key2];
        if (mapped === false)
          return;
        if (mapped)
          key2 = mapped;
      }
      keys2[key2] = cmd;
    }
    bind2("Mod-z", undo);
    bind2("Shift-Mod-z", redo);
    bind2("Backspace", undoInputRule);
    if (!mac5)
      bind2("Mod-y", redo);
    bind2("Alt-ArrowUp", joinUp);
    bind2("Alt-ArrowDown", joinDown);
    bind2("Mod-BracketLeft", lift2);
    bind2("Escape", selectParentNode);
    if (type = schema2.marks.strong) {
      bind2("Mod-b", toggleMark(type));
      bind2("Mod-B", toggleMark(type));
    }
    if (type = schema2.marks.em) {
      bind2("Mod-i", toggleMark(type));
      bind2("Mod-I", toggleMark(type));
    }
    if (type = schema2.marks.code)
      bind2("Mod-`", toggleMark(type));
    if (type = schema2.nodes.bullet_list)
      bind2("Shift-Ctrl-8", wrapInList(type));
    if (type = schema2.nodes.ordered_list)
      bind2("Shift-Ctrl-9", wrapInList(type));
    if (type = schema2.nodes.blockquote)
      bind2("Ctrl->", wrapIn(type));
    if (type = schema2.nodes.hard_break) {
      let br = type, cmd = chainCommands(exitCode, (state, dispatch) => {
        if (dispatch)
          dispatch(state.tr.replaceSelectionWith(br.create()).scrollIntoView());
        return true;
      });
      bind2("Mod-Enter", cmd);
      bind2("Shift-Enter", cmd);
      if (mac5)
        bind2("Ctrl-Enter", cmd);
    }
    if (type = schema2.nodes.list_item) {
      bind2("Enter", splitListItem(type));
      bind2("Mod-[", liftListItem(type));
      bind2("Mod-]", sinkListItem(type));
    }
    if (type = schema2.nodes.paragraph)
      bind2("Shift-Ctrl-0", setBlockType2(type));
    if (type = schema2.nodes.code_block)
      bind2("Shift-Ctrl-\\", setBlockType2(type));
    if (type = schema2.nodes.heading)
      for (let i = 1; i <= 6; i++)
        bind2("Shift-Ctrl-" + i, setBlockType2(type, { level: i }));
    if (type = schema2.nodes.horizontal_rule) {
      let hr = type;
      bind2("Mod-_", (state, dispatch) => {
        if (dispatch)
          dispatch(state.tr.replaceSelectionWith(hr.create()).scrollIntoView());
        return true;
      });
    }
    return keys2;
  }

  // ts/helper/inputrules.ts
  function blockQuoteRule(nodeType) {
    return wrappingInputRule(/^\s*>\s$/, nodeType);
  }
  function orderedListRule(nodeType) {
    return wrappingInputRule(/^(\d+)\.\s$/, nodeType, (match) => ({ order: +match[1] }), (match, node) => node.childCount + node.attrs.order == +match[1]);
  }
  function bulletListRule(nodeType) {
    return wrappingInputRule(/^\s*([-+*])\s$/, nodeType);
  }
  function codeBlockRule(nodeType) {
    return textblockTypeInputRule(/^```$/, nodeType);
  }
  function headingRule(nodeType, maxLevel) {
    return textblockTypeInputRule(new RegExp("^(#{1," + maxLevel + "})\\s$"), nodeType, (match) => ({ level: match[1].length }));
  }
  function buildInputRules(schema2) {
    let rules = smartQuotes.concat(ellipsis, emDash), type;
    if (type = schema2.nodes.blockquote)
      rules.push(blockQuoteRule(type));
    if (type = schema2.nodes.ordered_list)
      rules.push(orderedListRule(type));
    if (type = schema2.nodes.bullet_list)
      rules.push(bulletListRule(type));
    if (type = schema2.nodes.code_block)
      rules.push(codeBlockRule(type));
    if (type = schema2.nodes.heading)
      rules.push(headingRule(type, 6));
    return inputRules({ rules });
  }

  // ts/helper/upload.ts
  var imageTypes = ["image/jpeg", "image/png", "image/gif", "image/svg+xml"];
  function dispatchImage(view, pos, schema2, imageURI) {
    const tr = view.state.tr;
    const image = schema2.nodes.image.create({ src: imageURI });
    view.dispatch(tr.replaceWith(pos, pos, image).scrollIntoView());
  }
  function uploadImage(view, schema2, event, files, uploadURI, accessURI) {
    return __async(this, null, function* () {
      for (const file of files) {
        if (!imageTypes.includes(file.type)) {
          return;
        }
        const formData = new FormData();
        formData.append("file", file);
        const r = yield fetch(uploadURI, { method: "POST", body: formData });
        if (r.ok) {
          const result = yield r.json();
          const pos = view.posAtCoords({ left: event.clientX, top: event.clientY });
          dispatchImage(view, pos.pos, schema2, `${accessURI}/${result.storename}`);
        }
      }
    });
  }
  function imageDropHandler(schema2, uploadURI, accessURI) {
    const plugin = new Plugin({
      props: {
        handleDOMEvents: {
          drop: function(view, event) {
            var _a;
            const files = (_a = event.dataTransfer) == null ? void 0 : _a.files;
            if (files == void 0 || (files == null ? void 0 : files.length) == 0) {
              return;
            }
            if (event.preventDefault != void 0) {
              event.preventDefault();
            }
            uploadImage(view, schema2, event, files, uploadURI, accessURI);
          }
        }
      }
    });
    return plugin;
  }

  // ts/myeditor.ts
  var MyEditor = class {
    constructor(data, target, options) {
      this.uploadActionURI = "http://localhost:8864/upload";
      this.uploadAccessURI = "http://localhost:8864/files";
      if (options != void 0) {
        if (options.uploadActionURI != void 0) {
          this.uploadActionURI = options.uploadActionURI;
        }
        if (options.uploadAccessURI != void 0) {
          this.uploadAccessURI = options.uploadAccessURI;
        }
      }
      this.content = document.implementation.createHTMLDocument().body;
      this.content.innerHTML = data;
      const tableNodeSpecs = tableNodes({
        tableGroup: "block",
        cellContent: "block+",
        cellAttributes: {
          background: {
            default: null,
            getFromDOM(dom) {
              return dom.style && dom.style.backgroundColor || null;
            },
            setDOMAttr(value, attrs) {
              if (value) {
                attrs.style = (attrs.style || "") + `background-color: ${value};`;
              }
            }
          }
        }
      });
      schema.spec.nodes = schema.spec.nodes.append(tableNodeSpecs);
      this.schema = new Schema({
        nodes: schema.spec.nodes,
        marks: schema.spec.marks
      });
      const tableMenu = [
        this.item("Insert column before", addColumnBefore),
        this.item("Insert column after", addColumnAfter),
        this.item("Delete column", deleteColumn),
        this.item("Insert row before", addRowBefore),
        this.item("Insert row after", addRowAfter),
        this.item("Delete row", deleteRow),
        this.item("Delete table", deleteTable),
        this.item("Merge cells", mergeCells),
        this.item("Split cell", splitCell),
        this.item("Toggle header column", toggleHeaderColumn),
        this.item("Toggle header row", toggleHeaderRow),
        this.item("Toggle header cells", toggleHeaderCell),
        this.item("Make cell green", setCellAttr("background", "#dfd")),
        this.item("Make cell red", setCellAttr("background", "#faa")),
        this.item("Make cell non-green", setCellAttr("background", null))
      ];
      const tableDropdown = new Dropdown(tableMenu, { label: "Edit table" });
      const menu = buildMenuItems(this.schema).fullMenu;
      menu.push([tableDropdown]);
      menu.push([this.item("P", setBlockType2(schema.nodes.paragraph))]);
      const basePlugin = this.setupBasePlugin({ schema: this.schema, menuContent: menu });
      const pluginImageDropHandler = imageDropHandler(this.schema, this.uploadActionURI, this.uploadAccessURI);
      const mergedPlugins = basePlugin.concat(pluginImageDropHandler);
      const tablePlugins = [
        columnResizing({}),
        tableEditing(),
        keymap({
          Tab: goToNextCell(1),
          "Shift-Tab": goToNextCell(-1)
        })
      ];
      mergedPlugins.unshift(...tablePlugins);
      this.state = EditorState.create({
        doc: DOMParser.fromSchema(this.schema).parse(this.content),
        plugins: mergedPlugins
      });
      this.view = new EditorView(target, { state: this.state });
      window.view = this.view;
    }
    item(label, cmd) {
      return new MenuItem({ label, select: cmd, run: cmd });
    }
    setupBasePlugin(options) {
      const plugins = [
        buildInputRules(options.schema),
        keymap(buildKeymap(options.schema, options.mapKeys)),
        keymap(baseKeymap),
        dropCursor(),
        gapCursor()
      ];
      if (options.menuBar !== false) {
        plugins.push(menuBar({
          floating: options.floatingMenu !== false,
          content: options.menuContent || buildMenuItems(options.schema).fullMenu
        }));
      }
      if (options.history !== false) {
        plugins.push(history());
      }
      return plugins.concat(new Plugin({ props: { attributes: { class: "Editor-base-setup-style" } } }));
    }
    setupTablePlugin() {
    }
    icon(text, name) {
      let span = document.createElement("span");
      span.className = "menuicon " + name;
      span.title = name;
      span.textContent = text;
      return span;
    }
    getHTML() {
      const domSerializer = DOMSerializer.fromSchema(this.schema);
      const fragment = domSerializer.serializeFragment(this.view.state.doc.content);
      const div = document.createElement("div");
      div.appendChild(fragment);
      return div.innerHTML;
    }
    insertImage(imageURI) {
      const tr = this.view.state.tr;
      const image = this.schema.nodes.image.create({ src: imageURI });
      const pos = tr.selection.anchor;
      dispatchImage(this.view, pos, this.schema, imageURI);
    }
    addTable(state, dispatch) {
      console.log(state, dispatch);
      console.log("Hello table");
    }
  };
  window.MyEditor = MyEditor;
  var myeditor_default = MyEditor;
})();
