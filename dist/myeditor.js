(()=>{function d(i){this.content=i}d.prototype={constructor:d,find:function(i){for(var t=0;t<this.content.length;t+=2)if(this.content[t]===i)return t;return-1},get:function(i){var t=this.find(i);return t==-1?void 0:this.content[t+1]},update:function(i,t,e){var n=e&&e!=i?this.remove(e):this,r=n.find(i),s=n.content.slice();return r==-1?s.push(e||i,t):(s[r+1]=t,e&&(s[r]=e)),new d(s)},remove:function(i){var t=this.find(i);if(t==-1)return this;var e=this.content.slice();return e.splice(t,2),new d(e)},addToStart:function(i,t){return new d([i,t].concat(this.remove(i).content))},addToEnd:function(i,t){var e=this.remove(i).content.slice();return e.push(i,t),new d(e)},addBefore:function(i,t,e){var n=this.remove(t),r=n.content.slice(),s=n.find(i);return r.splice(s==-1?r.length:s,0,t,e),new d(r)},forEach:function(i){for(var t=0;t<this.content.length;t+=2)i(this.content[t],this.content[t+1])},prepend:function(i){return i=d.from(i),i.size?new d(i.content.concat(this.subtract(i).content)):this},append:function(i){return i=d.from(i),i.size?new d(this.subtract(i).content.concat(i.content)):this},subtract:function(i){var t=this;i=d.from(i);for(var e=0;e<i.content.length;e+=2)t=t.remove(i.content[e]);return t},get size(){return this.content.length>>1}};d.from=function(i){if(i instanceof d)return i;var t=[];if(i)for(var e in i)t.push(e,i[e]);return new d(t)};var I=d;function H(i,t,e){for(let n=0;;n++){if(n==i.childCount||n==t.childCount)return i.childCount==t.childCount?null:e;let r=i.child(n),s=t.child(n);if(r==s){e+=r.nodeSize;continue}if(!r.sameMarkup(s))return e;if(r.isText&&r.text!=s.text){for(let l=0;r.text[l]==s.text[l];l++)e++;return e}if(r.content.size||s.content.size){let l=H(r.content,s.content,e+1);if(l!=null)return l}e+=r.nodeSize}}function Q(i,t,e,n){for(let r=i.childCount,s=t.childCount;;){if(r==0||s==0)return r==s?null:{a:e,b:n};let l=i.child(--r),o=t.child(--s),h=l.nodeSize;if(l==o){e-=h,n-=h;continue}if(!l.sameMarkup(o))return{a:e,b:n};if(l.isText&&l.text!=o.text){let a=0,u=Math.min(l.text.length,o.text.length);for(;a<u&&l.text[l.text.length-a-1]==o.text[o.text.length-a-1];)a++,e--,n--;return{a:e,b:n}}if(l.content.size||o.content.size){let a=Q(l.content,o.content,e-1,n-1);if(a)return a}e-=h,n-=h}}var f=class{constructor(t,e){if(this.content=t,this.size=e||0,e==null)for(let n=0;n<t.length;n++)this.size+=t[n].nodeSize}nodesBetween(t,e,n,r=0,s){for(let l=0,o=0;o<e;l++){let h=this.content[l],a=o+h.nodeSize;if(a>t&&n(h,r+o,s||null,l)!==!1&&h.content.size){let u=o+1;h.nodesBetween(Math.max(0,t-u),Math.min(h.content.size,e-u),n,r+u)}o=a}}descendants(t){this.nodesBetween(0,this.size,t)}textBetween(t,e,n,r){let s="",l=!0;return this.nodesBetween(t,e,(o,h)=>{o.isText?(s+=o.text.slice(Math.max(t,h)-h,e-h),l=!n):o.isLeaf&&r?(s+=typeof r=="function"?r(o):r,l=!n):!l&&o.isBlock&&(s+=n,l=!0)},0),s}append(t){if(!t.size)return this;if(!this.size)return t;let e=this.lastChild,n=t.firstChild,r=this.content.slice(),s=0;for(e.isText&&e.sameMarkup(n)&&(r[r.length-1]=e.withText(e.text+n.text),s=1);s<t.content.length;s++)r.push(t.content[s]);return new f(r,this.size+t.size)}cut(t,e=this.size){if(t==0&&e==this.size)return this;let n=[],r=0;if(e>t)for(let s=0,l=0;l<e;s++){let o=this.content[s],h=l+o.nodeSize;h>t&&((l<t||h>e)&&(o.isText?o=o.cut(Math.max(0,t-l),Math.min(o.text.length,e-l)):o=o.cut(Math.max(0,t-l-1),Math.min(o.content.size,e-l-1))),n.push(o),r+=o.nodeSize),l=h}return new f(n,r)}cutByIndex(t,e){return t==e?f.empty:t==0&&e==this.content.length?this:new f(this.content.slice(t,e))}replaceChild(t,e){let n=this.content[t];if(n==e)return this;let r=this.content.slice(),s=this.size+e.nodeSize-n.nodeSize;return r[t]=e,new f(r,s)}addToStart(t){return new f([t].concat(this.content),this.size+t.nodeSize)}addToEnd(t){return new f(this.content.concat(t),this.size+t.nodeSize)}eq(t){if(this.content.length!=t.content.length)return!1;for(let e=0;e<this.content.length;e++)if(!this.content[e].eq(t.content[e]))return!1;return!0}get firstChild(){return this.content.length?this.content[0]:null}get lastChild(){return this.content.length?this.content[this.content.length-1]:null}get childCount(){return this.content.length}child(t){let e=this.content[t];if(!e)throw new RangeError("Index "+t+" out of range for "+this);return e}maybeChild(t){return this.content[t]||null}forEach(t){for(let e=0,n=0;e<this.content.length;e++){let r=this.content[e];t(r,n,e),n+=r.nodeSize}}findDiffStart(t,e=0){return H(this,t,e)}findDiffEnd(t,e=this.size,n=t.size){return Q(this,t,e,n)}findIndex(t,e=-1){if(t==0)return C(0,t);if(t==this.size)return C(this.content.length,t);if(t>this.size||t<0)throw new RangeError(`Position ${t} outside of fragment (${this})`);for(let n=0,r=0;;n++){let s=this.child(n),l=r+s.nodeSize;if(l>=t)return l==t||e>0?C(n+1,l):C(n,r);r=l}}toString(){return"<"+this.toStringInner()+">"}toStringInner(){return this.content.join(", ")}toJSON(){return this.content.length?this.content.map(t=>t.toJSON()):null}static fromJSON(t,e){if(!e)return f.empty;if(!Array.isArray(e))throw new RangeError("Invalid input for Fragment.fromJSON");return new f(e.map(t.nodeFromJSON))}static fromArray(t){if(!t.length)return f.empty;let e,n=0;for(let r=0;r<t.length;r++){let s=t[r];n+=s.nodeSize,r&&s.isText&&t[r-1].sameMarkup(s)?(e||(e=t.slice(0,r)),e[e.length-1]=s.withText(e[e.length-1].text+s.text)):e&&e.push(s)}return new f(e||t,n)}static from(t){if(!t)return f.empty;if(t instanceof f)return t;if(Array.isArray(t))return this.fromArray(t);if(t.attrs)return new f([t],t.nodeSize);throw new RangeError("Can not convert "+t+" to a Fragment"+(t.nodesBetween?" (looks like multiple versions of prosemirror-model were loaded)":""))}};f.empty=new f([],0);var D={index:0,offset:0};function C(i,t){return D.index=i,D.offset=t,D}function E(i,t){if(i===t)return!0;if(!(i&&typeof i=="object")||!(t&&typeof t=="object"))return!1;let e=Array.isArray(i);if(Array.isArray(t)!=e)return!1;if(e){if(i.length!=t.length)return!1;for(let n=0;n<i.length;n++)if(!E(i[n],t[n]))return!1}else{for(let n in i)if(!(n in t)||!E(i[n],t[n]))return!1;for(let n in t)if(!(n in i))return!1}return!0}var c=class{constructor(t,e){this.type=t,this.attrs=e}addToSet(t){let e,n=!1;for(let r=0;r<t.length;r++){let s=t[r];if(this.eq(s))return t;if(this.type.excludes(s.type))e||(e=t.slice(0,r));else{if(s.type.excludes(this.type))return t;!n&&s.type.rank>this.type.rank&&(e||(e=t.slice(0,r)),e.push(this),n=!0),e&&e.push(s)}}return e||(e=t.slice()),n||e.push(this),e}removeFromSet(t){for(let e=0;e<t.length;e++)if(this.eq(t[e]))return t.slice(0,e).concat(t.slice(e+1));return t}isInSet(t){for(let e=0;e<t.length;e++)if(this.eq(t[e]))return!0;return!1}eq(t){return this==t||this.type==t.type&&E(this.attrs,t.attrs)}toJSON(){let t={type:this.type.name};for(let e in this.attrs){t.attrs=this.attrs;break}return t}static fromJSON(t,e){if(!e)throw new RangeError("Invalid input for Mark.fromJSON");let n=t.marks[e.type];if(!n)throw new RangeError(`There is no mark type ${e.type} in this schema`);return n.create(e.attrs)}static sameSet(t,e){if(t==e)return!0;if(t.length!=e.length)return!1;for(let n=0;n<t.length;n++)if(!t[n].eq(e[n]))return!1;return!0}static setFrom(t){if(!t||Array.isArray(t)&&t.length==0)return c.none;if(t instanceof c)return[t];let e=t.slice();return e.sort((n,r)=>n.type.rank-r.type.rank),e}};c.none=[];var w=class extends Error{},p=class{constructor(t,e,n){this.content=t,this.openStart=e,this.openEnd=n}get size(){return this.content.size-this.openStart-this.openEnd}insertAt(t,e){let n=Y(this.content,t+this.openStart,e);return n&&new p(n,this.openStart,this.openEnd)}removeBetween(t,e){return new p(X(this.content,t+this.openStart,e+this.openStart),this.openStart,this.openEnd)}eq(t){return this.content.eq(t.content)&&this.openStart==t.openStart&&this.openEnd==t.openEnd}toString(){return this.content+"("+this.openStart+","+this.openEnd+")"}toJSON(){if(!this.content.size)return null;let t={content:this.content.toJSON()};return this.openStart>0&&(t.openStart=this.openStart),this.openEnd>0&&(t.openEnd=this.openEnd),t}static fromJSON(t,e){if(!e)return p.empty;let n=e.openStart||0,r=e.openEnd||0;if(typeof n!="number"||typeof r!="number")throw new RangeError("Invalid input for Slice.fromJSON");return new p(f.fromJSON(t,e.content),n,r)}static maxOpen(t,e=!0){let n=0,r=0;for(let s=t.firstChild;s&&!s.isLeaf&&(e||!s.type.spec.isolating);s=s.firstChild)n++;for(let s=t.lastChild;s&&!s.isLeaf&&(e||!s.type.spec.isolating);s=s.lastChild)r++;return new p(t,n,r)}};p.empty=new p(f.empty,0,0);function X(i,t,e){let{index:n,offset:r}=i.findIndex(t),s=i.maybeChild(n),{index:l,offset:o}=i.findIndex(e);if(r==t||s.isText){if(o!=e&&!i.child(l).isText)throw new RangeError("Removing non-flat range");return i.cut(0,t).append(i.cut(e))}if(n!=l)throw new RangeError("Removing non-flat range");return i.replaceChild(n,s.copy(X(s.content,t-r-1,e-r-1)))}function Y(i,t,e,n){let{index:r,offset:s}=i.findIndex(t),l=i.maybeChild(r);if(s==t||l.isText)return n&&!n.canReplace(r,r,e)?null:i.cut(0,t).append(e).append(i.cut(t));let o=Y(l.content,t-s-1,e);return o&&i.replaceChild(r,l.copy(o))}function st(i,t,e){if(e.openStart>i.depth)throw new w("Inserted content deeper than insertion position");if(i.depth-e.openStart!=t.depth-e.openEnd)throw new w("Inconsistent open depths");return Z(i,t,e,0)}function Z(i,t,e,n){let r=i.index(n),s=i.node(n);if(r==t.index(n)&&n<i.depth-e.openStart){let l=Z(i,t,e,n+1);return s.copy(s.content.replaceChild(r,l))}else if(e.content.size)if(!e.openStart&&!e.openEnd&&i.depth==n&&t.depth==n){let l=i.parent,o=l.content;return y(l,o.cut(0,i.parentOffset).append(e.content).append(o.cut(t.parentOffset)))}else{let{start:l,end:o}=lt(e,i);return y(s,K(i,l,o,t,n))}else return y(s,A(i,t,n))}function G(i,t){if(!t.type.compatibleContent(i.type))throw new w("Cannot join "+t.type.name+" onto "+i.type.name)}function B(i,t,e){let n=i.node(e);return G(n,t.node(e)),n}function x(i,t){let e=t.length-1;e>=0&&i.isText&&i.sameMarkup(t[e])?t[e]=i.withText(t[e].text+i.text):t.push(i)}function b(i,t,e,n){let r=(t||i).node(e),s=0,l=t?t.index(e):r.childCount;i&&(s=i.index(e),i.depth>e?s++:i.textOffset&&(x(i.nodeAfter,n),s++));for(let o=s;o<l;o++)x(r.child(o),n);t&&t.depth==e&&t.textOffset&&x(t.nodeBefore,n)}function y(i,t){if(!i.type.validContent(t))throw new w("Invalid content for node "+i.type.name);return i.copy(t)}function K(i,t,e,n,r){let s=i.depth>r&&B(i,t,r+1),l=n.depth>r&&B(e,n,r+1),o=[];return b(null,i,r,o),s&&l&&t.index(r)==e.index(r)?(G(s,l),x(y(s,K(i,t,e,n,r+1)),o)):(s&&x(y(s,A(i,t,r+1)),o),b(t,e,r,o),l&&x(y(l,A(e,n,r+1)),o)),b(n,null,r,o),new f(o)}function A(i,t,e){let n=[];if(b(null,i,e,n),i.depth>e){let r=B(i,t,e+1);x(y(r,A(i,t,e+1)),n)}return b(t,null,e,n),new f(n)}function lt(i,t){let e=t.depth-i.openStart,r=t.node(e).copy(i.content);for(let s=e-1;s>=0;s--)r=t.node(s).copy(f.from(r));return{start:r.resolveNoCache(i.openStart+e),end:r.resolveNoCache(r.content.size-i.openEnd-e)}}var k=class{constructor(t,e,n){this.pos=t,this.path=e,this.parentOffset=n,this.depth=e.length/3-1}resolveDepth(t){return t==null?this.depth:t<0?this.depth+t:t}get parent(){return this.node(this.depth)}get doc(){return this.node(0)}node(t){return this.path[this.resolveDepth(t)*3]}index(t){return this.path[this.resolveDepth(t)*3+1]}indexAfter(t){return t=this.resolveDepth(t),this.index(t)+(t==this.depth&&!this.textOffset?0:1)}start(t){return t=this.resolveDepth(t),t==0?0:this.path[t*3-1]+1}end(t){return t=this.resolveDepth(t),this.start(t)+this.node(t).content.size}before(t){if(t=this.resolveDepth(t),!t)throw new RangeError("There is no position before the top-level node");return t==this.depth+1?this.pos:this.path[t*3-1]}after(t){if(t=this.resolveDepth(t),!t)throw new RangeError("There is no position after the top-level node");return t==this.depth+1?this.pos:this.path[t*3-1]+this.path[t*3].nodeSize}get textOffset(){return this.pos-this.path[this.path.length-1]}get nodeAfter(){let t=this.parent,e=this.index(this.depth);if(e==t.childCount)return null;let n=this.pos-this.path[this.path.length-1],r=t.child(e);return n?t.child(e).cut(n):r}get nodeBefore(){let t=this.index(this.depth),e=this.pos-this.path[this.path.length-1];return e?this.parent.child(t).cut(0,e):t==0?null:this.parent.child(t-1)}posAtIndex(t,e){e=this.resolveDepth(e);let n=this.path[e*3],r=e==0?0:this.path[e*3-1]+1;for(let s=0;s<t;s++)r+=n.child(s).nodeSize;return r}marks(){let t=this.parent,e=this.index();if(t.content.size==0)return c.none;if(this.textOffset)return t.child(e).marks;let n=t.maybeChild(e-1),r=t.maybeChild(e);if(!n){let o=n;n=r,r=o}let s=n.marks;for(var l=0;l<s.length;l++)s[l].type.spec.inclusive===!1&&(!r||!s[l].isInSet(r.marks))&&(s=s[l--].removeFromSet(s));return s}marksAcross(t){let e=this.parent.maybeChild(this.index());if(!e||!e.isInline)return null;let n=e.marks,r=t.parent.maybeChild(t.index());for(var s=0;s<n.length;s++)n[s].type.spec.inclusive===!1&&(!r||!n[s].isInSet(r.marks))&&(n=n[s--].removeFromSet(n));return n}sharedDepth(t){for(let e=this.depth;e>0;e--)if(this.start(e)<=t&&this.end(e)>=t)return e;return 0}blockRange(t=this,e){if(t.pos<this.pos)return t.blockRange(this);for(let n=this.depth-(this.parent.inlineContent||this.pos==t.pos?1:0);n>=0;n--)if(t.pos<=this.end(n)&&(!e||e(this.node(n))))return new F(this,t,n);return null}sameParent(t){return this.pos-this.parentOffset==t.pos-t.parentOffset}max(t){return t.pos>this.pos?t:this}min(t){return t.pos<this.pos?t:this}toString(){let t="";for(let e=1;e<=this.depth;e++)t+=(t?"/":"")+this.node(e).type.name+"_"+this.index(e-1);return t+":"+this.parentOffset}static resolve(t,e){if(!(e>=0&&e<=t.content.size))throw new RangeError("Position "+e+" out of range");let n=[],r=0,s=e;for(let l=t;;){let{index:o,offset:h}=l.content.findIndex(s),a=s-h;if(n.push(l,o,r+h),!a||(l=l.child(o),l.isText))break;s=a-1,r+=h+1}return new k(e,n,s)}static resolveCached(t,e){for(let r=0;r<N.length;r++){let s=N[r];if(s.pos==e&&s.doc==t)return s}let n=N[R]=k.resolve(t,e);return R=(R+1)%ot,n}},N=[],R=0,ot=12,F=class{constructor(t,e,n){this.$from=t,this.$to=e,this.depth=n}get start(){return this.$from.before(this.depth+1)}get end(){return this.$to.after(this.depth+1)}get parent(){return this.$from.node(this.depth)}get startIndex(){return this.$from.index(this.depth)}get endIndex(){return this.$to.indexAfter(this.depth)}},ht=Object.create(null),g=class{constructor(t,e,n,r=c.none){this.type=t,this.attrs=e,this.marks=r,this.content=n||f.empty}get nodeSize(){return this.isLeaf?1:2+this.content.size}get childCount(){return this.content.childCount}child(t){return this.content.child(t)}maybeChild(t){return this.content.maybeChild(t)}forEach(t){this.content.forEach(t)}nodesBetween(t,e,n,r=0){this.content.nodesBetween(t,e,n,r,this)}descendants(t){this.nodesBetween(0,this.content.size,t)}get textContent(){return this.textBetween(0,this.content.size,"")}textBetween(t,e,n,r){return this.content.textBetween(t,e,n,r)}get firstChild(){return this.content.firstChild}get lastChild(){return this.content.lastChild}eq(t){return this==t||this.sameMarkup(t)&&this.content.eq(t.content)}sameMarkup(t){return this.hasMarkup(t.type,t.attrs,t.marks)}hasMarkup(t,e,n){return this.type==t&&E(this.attrs,e||t.defaultAttrs||ht)&&c.sameSet(this.marks,n||c.none)}copy(t=null){return t==this.content?this:new g(this.type,this.attrs,t,this.marks)}mark(t){return t==this.marks?this:new g(this.type,this.attrs,this.content,t)}cut(t,e=this.content.size){return t==0&&e==this.content.size?this:this.copy(this.content.cut(t,e))}slice(t,e=this.content.size,n=!1){if(t==e)return p.empty;let r=this.resolve(t),s=this.resolve(e),l=n?0:r.sharedDepth(e),o=r.start(l),a=r.node(l).content.cut(r.pos-o,s.pos-o);return new p(a,r.depth-l,s.depth-l)}replace(t,e,n){return st(this.resolve(t),this.resolve(e),n)}nodeAt(t){for(let e=this;;){let{index:n,offset:r}=e.content.findIndex(t);if(e=e.maybeChild(n),!e)return null;if(r==t||e.isText)return e;t-=r+1}}childAfter(t){let{index:e,offset:n}=this.content.findIndex(t);return{node:this.content.maybeChild(e),index:e,offset:n}}childBefore(t){if(t==0)return{node:null,index:0,offset:0};let{index:e,offset:n}=this.content.findIndex(t);if(n<t)return{node:this.content.child(e),index:e,offset:n};let r=this.content.child(e-1);return{node:r,index:e-1,offset:n-r.nodeSize}}resolve(t){return k.resolveCached(this,t)}resolveNoCache(t){return k.resolve(this,t)}rangeHasMark(t,e,n){let r=!1;return e>t&&this.nodesBetween(t,e,s=>(n.isInSet(s.marks)&&(r=!0),!r)),r}get isBlock(){return this.type.isBlock}get isTextblock(){return this.type.isTextblock}get inlineContent(){return this.type.inlineContent}get isInline(){return this.type.isInline}get isText(){return this.type.isText}get isLeaf(){return this.type.isLeaf}get isAtom(){return this.type.isAtom}toString(){if(this.type.spec.toDebugString)return this.type.spec.toDebugString(this);let t=this.type.name;return this.content.size&&(t+="("+this.content.toStringInner()+")"),_(this.marks,t)}contentMatchAt(t){let e=this.type.contentMatch.matchFragment(this.content,0,t);if(!e)throw new Error("Called contentMatchAt on a node with invalid content");return e}canReplace(t,e,n=f.empty,r=0,s=n.childCount){let l=this.contentMatchAt(t).matchFragment(n,r,s),o=l&&l.matchFragment(this.content,e);if(!o||!o.validEnd)return!1;for(let h=r;h<s;h++)if(!this.type.allowsMarks(n.child(h).marks))return!1;return!0}canReplaceWith(t,e,n,r){if(r&&!this.type.allowsMarks(r))return!1;let s=this.contentMatchAt(t).matchType(n),l=s&&s.matchFragment(this.content,e);return l?l.validEnd:!1}canAppend(t){return t.content.size?this.canReplace(this.childCount,this.childCount,t.content):this.type.compatibleContent(t.type)}check(){if(!this.type.validContent(this.content))throw new RangeError(`Invalid content for node ${this.type.name}: ${this.content.toString().slice(0,50)}`);let t=c.none;for(let e=0;e<this.marks.length;e++)t=this.marks[e].addToSet(t);if(!c.sameSet(t,this.marks))throw new RangeError(`Invalid collection of marks for node ${this.type.name}: ${this.marks.map(e=>e.type.name)}`);this.content.forEach(e=>e.check())}toJSON(){let t={type:this.type.name};for(let e in this.attrs){t.attrs=this.attrs;break}return this.content.size&&(t.content=this.content.toJSON()),this.marks.length&&(t.marks=this.marks.map(e=>e.toJSON())),t}static fromJSON(t,e){if(!e)throw new RangeError("Invalid input for Node.fromJSON");let n=null;if(e.marks){if(!Array.isArray(e.marks))throw new RangeError("Invalid mark data for Node.fromJSON");n=e.marks.map(t.markFromJSON)}if(e.type=="text"){if(typeof e.text!="string")throw new RangeError("Invalid text node in JSON");return t.text(e.text,n)}let r=f.fromJSON(t,e.content);return t.nodeType(e.type).create(e.attrs,r,n)}};g.prototype.text=void 0;var S=class extends g{constructor(t,e,n,r){if(super(t,e,null,r),!n)throw new RangeError("Empty text nodes are not allowed");this.text=n}toString(){return this.type.spec.toDebugString?this.type.spec.toDebugString(this):_(this.marks,JSON.stringify(this.text))}get textContent(){return this.text}textBetween(t,e){return this.text.slice(t,e)}get nodeSize(){return this.text.length}mark(t){return t==this.marks?this:new S(this.type,this.attrs,this.text,t)}withText(t){return t==this.text?this:new S(this.type,this.attrs,t,this.marks)}cut(t=0,e=this.text.length){return t==0&&e==this.text.length?this:this.withText(this.text.slice(t,e))}eq(t){return this.sameMarkup(t)&&this.text==t.text}toJSON(){let t=super.toJSON();return t.text=this.text,t}};function _(i,t){for(let e=i.length-1;e>=0;e--)t=i[e].type.name+"("+t+")";return t}var m=class{constructor(t){this.validEnd=t,this.next=[],this.wrapCache=[]}static parse(t,e){let n=new P(t,e);if(n.next==null)return m.empty;let r=$(n);n.next&&n.err("Unexpected trailing text");let s=gt(pt(r));return mt(s,n),s}matchType(t){for(let e=0;e<this.next.length;e++)if(this.next[e].type==t)return this.next[e].next;return null}matchFragment(t,e=0,n=t.childCount){let r=this;for(let s=e;r&&s<n;s++)r=r.matchType(t.child(s).type);return r}get inlineContent(){return this.next.length&&this.next[0].type.isInline}get defaultType(){for(let t=0;t<this.next.length;t++){let{type:e}=this.next[t];if(!(e.isText||e.hasRequiredAttrs()))return e}return null}compatible(t){for(let e=0;e<this.next.length;e++)for(let n=0;n<t.next.length;n++)if(this.next[e].type==t.next[n].type)return!0;return!1}fillBefore(t,e=!1,n=0){let r=[this];function s(l,o){let h=l.matchFragment(t,n);if(h&&(!e||h.validEnd))return f.from(o.map(a=>a.createAndFill()));for(let a=0;a<l.next.length;a++){let{type:u,next:z}=l.next[a];if(!(u.isText||u.hasRequiredAttrs())&&r.indexOf(z)==-1){r.push(z);let W=s(z,o.concat(u));if(W)return W}}return null}return s(this,[])}findWrapping(t){for(let n=0;n<this.wrapCache.length;n+=2)if(this.wrapCache[n]==t)return this.wrapCache[n+1];let e=this.computeWrapping(t);return this.wrapCache.push(t,e),e}computeWrapping(t){let e=Object.create(null),n=[{match:this,type:null,via:null}];for(;n.length;){let r=n.shift(),s=r.match;if(s.matchType(t)){let l=[];for(let o=r;o.type;o=o.via)l.push(o.type);return l.reverse()}for(let l=0;l<s.next.length;l++){let{type:o,next:h}=s.next[l];!o.isLeaf&&!o.hasRequiredAttrs()&&!(o.name in e)&&(!r.type||h.validEnd)&&(n.push({match:o.contentMatch,type:o,via:r}),e[o.name]=!0)}}return null}get edgeCount(){return this.next.length}edge(t){if(t>=this.next.length)throw new RangeError(`There's no ${t}th edge in this content match`);return this.next[t]}toString(){let t=[];function e(n){t.push(n);for(let r=0;r<n.next.length;r++)t.indexOf(n.next[r].next)==-1&&e(n.next[r].next)}return e(this),t.map((n,r)=>{let s=r+(n.validEnd?"*":" ")+" ";for(let l=0;l<n.next.length;l++)s+=(l?", ":"")+n.next[l].type.name+"->"+t.indexOf(n.next[l].next);return s}).join(`
`)}};m.empty=new m(!0);var P=class{constructor(t,e){this.string=t,this.nodeTypes=e,this.inline=null,this.pos=0,this.tokens=t.split(/\s*(?=\b|\W|$)/),this.tokens[this.tokens.length-1]==""&&this.tokens.pop(),this.tokens[0]==""&&this.tokens.shift()}get next(){return this.tokens[this.pos]}eat(t){return this.next==t&&(this.pos++||!0)}err(t){throw new SyntaxError(t+" (in content expression '"+this.string+"')")}};function $(i){let t=[];do t.push(at(i));while(i.eat("|"));return t.length==1?t[0]:{type:"choice",exprs:t}}function at(i){let t=[];do t.push(ft(i));while(i.next&&i.next!=")"&&i.next!="|");return t.length==1?t[0]:{type:"seq",exprs:t}}function ft(i){let t=dt(i);for(;;)if(i.eat("+"))t={type:"plus",expr:t};else if(i.eat("*"))t={type:"star",expr:t};else if(i.eat("?"))t={type:"opt",expr:t};else if(i.eat("{"))t=ut(i,t);else break;return t}function j(i){/\D/.test(i.next)&&i.err("Expected number, got '"+i.next+"'");let t=Number(i.next);return i.pos++,t}function ut(i,t){let e=j(i),n=e;return i.eat(",")&&(i.next!="}"?n=j(i):n=-1),i.eat("}")||i.err("Unclosed braced range"),{type:"range",min:e,max:n,expr:t}}function ct(i,t){let e=i.nodeTypes,n=e[t];if(n)return[n];let r=[];for(let s in e){let l=e[s];l.groups.indexOf(t)>-1&&r.push(l)}return r.length==0&&i.err("No node type or group '"+t+"' found"),r}function dt(i){if(i.eat("(")){let t=$(i);return i.eat(")")||i.err("Missing closing paren"),t}else if(/\W/.test(i.next))i.err("Unexpected token '"+i.next+"'");else{let t=ct(i,i.next).map(e=>(i.inline==null?i.inline=e.isInline:i.inline!=e.isInline&&i.err("Mixing inline and block content"),{type:"name",value:e}));return i.pos++,t.length==1?t[0]:{type:"choice",exprs:t}}}function pt(i){let t=[[]];return r(s(i,0),e()),t;function e(){return t.push([])-1}function n(l,o,h){let a={term:h,to:o};return t[l].push(a),a}function r(l,o){l.forEach(h=>h.to=o)}function s(l,o){if(l.type=="choice")return l.exprs.reduce((h,a)=>h.concat(s(a,o)),[]);if(l.type=="seq")for(let h=0;;h++){let a=s(l.exprs[h],o);if(h==l.exprs.length-1)return a;r(a,o=e())}else if(l.type=="star"){let h=e();return n(o,h),r(s(l.expr,h),h),[n(h)]}else if(l.type=="plus"){let h=e();return r(s(l.expr,o),h),r(s(l.expr,h),h),[n(h)]}else{if(l.type=="opt")return[n(o)].concat(s(l.expr,o));if(l.type=="range"){let h=o;for(let a=0;a<l.min;a++){let u=e();r(s(l.expr,h),u),h=u}if(l.max==-1)r(s(l.expr,h),h);else for(let a=l.min;a<l.max;a++){let u=e();n(h,u),r(s(l.expr,h),u),h=u}return[n(h)]}else{if(l.type=="name")return[n(o,void 0,l.value)];throw new Error("Unknown expr type")}}}}function tt(i,t){return t-i}function V(i,t){let e=[];return n(t),e.sort(tt);function n(r){let s=i[r];if(s.length==1&&!s[0].term)return n(s[0].to);e.push(r);for(let l=0;l<s.length;l++){let{term:o,to:h}=s[l];!o&&e.indexOf(h)==-1&&n(h)}}}function gt(i){let t=Object.create(null);return e(V(i,0));function e(n){let r=[];n.forEach(l=>{i[l].forEach(({term:o,to:h})=>{if(!o)return;let a;for(let u=0;u<r.length;u++)r[u][0]==o&&(a=r[u][1]);V(i,h).forEach(u=>{a||r.push([o,a=[]]),a.indexOf(u)==-1&&a.push(u)})})});let s=t[n.join(",")]=new m(n.indexOf(i.length-1)>-1);for(let l=0;l<r.length;l++){let o=r[l][1].sort(tt);s.next.push({type:r[l][0],next:t[o.join(",")]||e(o)})}return s}}function mt(i,t){for(let e=0,n=[i];e<n.length;e++){let r=n[e],s=!r.validEnd,l=[];for(let o=0;o<r.next.length;o++){let{type:h,next:a}=r.next[o];l.push(h.name),s&&!(h.isText||h.hasRequiredAttrs())&&(s=!1),n.indexOf(a)==-1&&n.push(a)}s&&t.err("Only non-generatable nodes ("+l.join(", ")+") in a required position (see https://prosemirror.net/docs/guide/#generatable)")}}function et(i){let t=Object.create(null);for(let e in i){let n=i[e];if(!n.hasDefault)return null;t[e]=n.default}return t}function nt(i,t){let e=Object.create(null);for(let n in i){let r=t&&t[n];if(r===void 0){let s=i[n];if(s.hasDefault)r=s.default;else throw new RangeError("No value supplied for attribute "+n)}e[n]=r}return e}function it(i){let t=Object.create(null);if(i)for(let e in i)t[e]=new J(i[e]);return t}var O=class{constructor(t,e,n){this.name=t,this.schema=e,this.spec=n,this.markSet=null,this.groups=n.group?n.group.split(" "):[],this.attrs=it(n.attrs),this.defaultAttrs=et(this.attrs),this.contentMatch=null,this.inlineContent=null,this.isBlock=!(n.inline||t=="text"),this.isText=t=="text"}get isInline(){return!this.isBlock}get isTextblock(){return this.isBlock&&this.inlineContent}get isLeaf(){return this.contentMatch==m.empty}get isAtom(){return this.isLeaf||!!this.spec.atom}get whitespace(){return this.spec.whitespace||(this.spec.code?"pre":"normal")}hasRequiredAttrs(){for(let t in this.attrs)if(this.attrs[t].isRequired)return!0;return!1}compatibleContent(t){return this==t||this.contentMatch.compatible(t.contentMatch)}computeAttrs(t){return!t&&this.defaultAttrs?this.defaultAttrs:nt(this.attrs,t)}create(t=null,e,n){if(this.isText)throw new Error("NodeType.create can't construct text nodes");return new g(this,this.computeAttrs(t),f.from(e),c.setFrom(n))}createChecked(t=null,e,n){if(e=f.from(e),!this.validContent(e))throw new RangeError("Invalid content for node "+this.name);return new g(this,this.computeAttrs(t),e,c.setFrom(n))}createAndFill(t=null,e,n){if(t=this.computeAttrs(t),e=f.from(e),e.size){let l=this.contentMatch.fillBefore(e);if(!l)return null;e=l.append(e)}let r=this.contentMatch.matchFragment(e),s=r&&r.fillBefore(f.empty,!0);return s?new g(this,t,e.append(s),c.setFrom(n)):null}validContent(t){let e=this.contentMatch.matchFragment(t);if(!e||!e.validEnd)return!1;for(let n=0;n<t.childCount;n++)if(!this.allowsMarks(t.child(n).marks))return!1;return!0}allowsMarkType(t){return this.markSet==null||this.markSet.indexOf(t)>-1}allowsMarks(t){if(this.markSet==null)return!0;for(let e=0;e<t.length;e++)if(!this.allowsMarkType(t[e].type))return!1;return!0}allowedMarks(t){if(this.markSet==null)return t;let e;for(let n=0;n<t.length;n++)this.allowsMarkType(t[n].type)?e&&e.push(t[n]):e||(e=t.slice(0,n));return e?e.length?e:c.none:t}static compile(t,e){let n=Object.create(null);t.forEach((s,l)=>n[s]=new O(s,e,l));let r=e.spec.topNode||"doc";if(!n[r])throw new RangeError("Schema is missing its top node type ('"+r+"')");if(!n.text)throw new RangeError("Every schema needs a 'text' type");for(let s in n.text.attrs)throw new RangeError("The text node type should not have attributes");return n}},J=class{constructor(t){this.hasDefault=Object.prototype.hasOwnProperty.call(t,"default"),this.default=t.default}get isRequired(){return!this.hasDefault}},v=class{constructor(t,e,n,r){this.name=t,this.rank=e,this.schema=n,this.spec=r,this.attrs=it(r.attrs),this.excluded=null;let s=et(this.attrs);this.instance=s?new c(this,s):null}create(t=null){return!t&&this.instance?this.instance:new c(this,nt(this.attrs,t))}static compile(t,e){let n=Object.create(null),r=0;return t.forEach((s,l)=>n[s]=new v(s,r++,e,l)),n}removeFromSet(t){for(var e=0;e<t.length;e++)t[e].type==this&&(t=t.slice(0,e).concat(t.slice(e+1)),e--);return t}isInSet(t){for(let e=0;e<t.length;e++)if(t[e].type==this)return t[e]}excludes(t){return this.excluded.indexOf(t)>-1}},M=class{constructor(t){this.cached=Object.create(null),this.spec={nodes:I.from(t.nodes),marks:I.from(t.marks||{}),topNode:t.topNode},this.nodes=O.compile(this.spec.nodes,this),this.marks=v.compile(this.spec.marks,this);let e=Object.create(null);for(let n in this.nodes){if(n in this.marks)throw new RangeError(n+" can not be both a node and a mark");let r=this.nodes[n],s=r.spec.content||"",l=r.spec.marks;r.contentMatch=e[s]||(e[s]=m.parse(s,this.nodes)),r.inlineContent=r.contentMatch.inlineContent,r.markSet=l=="_"?null:l?U(this,l.split(" ")):l==""||!r.inlineContent?[]:null}for(let n in this.marks){let r=this.marks[n],s=r.spec.excludes;r.excluded=s==null?[r]:s==""?[]:U(this,s.split(" "))}this.nodeFromJSON=this.nodeFromJSON.bind(this),this.markFromJSON=this.markFromJSON.bind(this),this.topNodeType=this.nodes[this.spec.topNode||"doc"],this.cached.wrappings=Object.create(null)}node(t,e=null,n,r){if(typeof t=="string")t=this.nodeType(t);else if(t instanceof O){if(t.schema!=this)throw new RangeError("Node type from different schema used ("+t.name+")")}else throw new RangeError("Invalid node type: "+t);return t.createChecked(e,n,r)}text(t,e){let n=this.nodes.text;return new S(n,n.defaultAttrs,t,c.setFrom(e))}mark(t,e){return typeof t=="string"&&(t=this.marks[t]),t.create(e)}nodeFromJSON(t){return g.fromJSON(this,t)}markFromJSON(t){return c.fromJSON(this,t)}nodeType(t){let e=this.nodes[t];if(!e)throw new RangeError("Unknown node type: "+t);return e}};function U(i,t){let e=[];for(let n=0;n<t.length;n++){let r=t[n],s=i.marks[r],l=s;if(s)e.push(s);else for(let o in i.marks){let h=i.marks[o];(r=="_"||h.spec.group&&h.spec.group.split(" ").indexOf(r)>-1)&&e.push(l=h)}if(!l)throw new SyntaxError("Unknown mark type: '"+t[n]+"'")}return e}var xt=["p",0],yt=["blockquote",0],kt=["hr"],wt=["pre",["code",0]],St=["br"],Ot={doc:{content:"block+"},paragraph:{content:"inline*",group:"block",parseDOM:[{tag:"p"}],toDOM(){return xt}},blockquote:{content:"block+",group:"block",defining:!0,parseDOM:[{tag:"blockquote"}],toDOM(){return yt}},horizontal_rule:{group:"block",parseDOM:[{tag:"hr"}],toDOM(){return kt}},heading:{attrs:{level:{default:1}},content:"inline*",group:"block",defining:!0,parseDOM:[{tag:"h1",attrs:{level:1}},{tag:"h2",attrs:{level:2}},{tag:"h3",attrs:{level:3}},{tag:"h4",attrs:{level:4}},{tag:"h5",attrs:{level:5}},{tag:"h6",attrs:{level:6}}],toDOM(i){return["h"+i.attrs.level,0]}},code_block:{content:"text*",marks:"",group:"block",code:!0,defining:!0,parseDOM:[{tag:"pre",preserveWhitespace:"full"}],toDOM(){return wt}},text:{group:"inline"},image:{inline:!0,attrs:{src:{},alt:{default:null},title:{default:null}},group:"inline",draggable:!0,parseDOM:[{tag:"img[src]",getAttrs(i){return{src:i.getAttribute("src"),title:i.getAttribute("title"),alt:i.getAttribute("alt")}}}],toDOM(i){let{src:t,alt:e,title:n}=i.attrs;return["img",{src:t,alt:e,title:n}]}},hard_break:{inline:!0,group:"inline",selectable:!1,parseDOM:[{tag:"br"}],toDOM(){return St}}},Mt=["em",0],bt=["strong",0],vt=["code",0],Ct={link:{attrs:{href:{},title:{default:null}},inclusive:!1,parseDOM:[{tag:"a[href]",getAttrs(i){return{href:i.getAttribute("href"),title:i.getAttribute("title")}}}],toDOM(i){let{href:t,title:e}=i.attrs;return["a",{href:t,title:e},0]}},em:{parseDOM:[{tag:"i"},{tag:"em"},{style:"font-style=italic"}],toDOM(){return Mt}},strong:{parseDOM:[{tag:"strong"},{tag:"b",getAttrs:i=>i.style.fontWeight!="normal"&&null},{style:"font-weight",getAttrs:i=>/^(bold(er)?|[5-9]\d{2,})$/.test(i)&&null}],toDOM(){return bt}},code:{parseDOM:[{tag:"code"}],toDOM(){return vt}}},L=new M({nodes:Ot,marks:Ct});var Et=["ol",0],At=["ul",0],Tt=["li",0],zt={attrs:{order:{default:1}},parseDOM:[{tag:"ol",getAttrs(i){return{order:i.hasAttribute("start")?+i.getAttribute("start"):1}}}],toDOM(i){return i.attrs.order==1?Et:["ol",{start:i.attrs.order},0]}},It={parseDOM:[{tag:"ul"}],toDOM(){return At}},Dt={parseDOM:[{tag:"li"}],toDOM(){return Tt},defining:!0};function q(i,t){let e={};for(let n in i)e[n]=i[n];for(let n in t)e[n]=t[n];return e}function rt(i,t,e){return i.append({ordered_list:q(zt,{content:"list_item+",group:e}),bullet_list:q(It,{content:"list_item+",group:e}),list_item:q(Dt,{content:t})})}var Vt=new M({nodes:rt(L.spec.nodes,"paragraph block*","block"),marks:L.spec.marks}),T=class{};globalThis.MyEditor=T;var Ut=T;})();
