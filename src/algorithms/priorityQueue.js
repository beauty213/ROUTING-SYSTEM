/**
 * priorityQueue.js
 * Implementation of a Min-Priority Queue using a Binary Min-Heap.
 * 
 * Supports O(log V) insertion, O(log V) extraction of minimum, and
 * O(log V) decreaseKey operations via an internal index position map.
 * 
 * Used directly by Dijkstra's algorithm to prioritize intersections
 * by earliest estimated arrival time.
 */

export class MinPriorityQueue {
  constructor() {
    // Array of heap nodes: { key: string, priority: number, data: any }
    this.heap = [];
    // Map of key -> current index in this.heap
    this.keyToIndex = new Map();
  }

  /**
   * Returns the number of elements in the priority queue.
   */
  size() {
    return this.heap.length;
  }

  /**
   * Checks if the queue is empty.
   */
  isEmpty() {
    return this.heap.length === 0;
  }

  /**
   * Checks if a key exists in the priority queue.
   * @param {string} key
   */
  has(key) {
    return this.keyToIndex.has(key);
  }

  /**
   * Inserts a new element or updates its priority if it already exists with higher priority.
   * @param {string} key - Node identifier (e.g. 'A', 'B')
   * @param {number} priority - Value to order by (e.g. arrival time in minutes)
   * @param {any} data - Optional payload
   */
  push(key, priority, data = null) {
    if (this.has(key)) {
      if (priority < this.getPriority(key)) {
        this.decreaseKey(key, priority, data);
      }
      return;
    }

    const item = { key, priority, data };
    this.heap.push(item);
    const index = this.heap.length - 1;
    this.keyToIndex.set(key, index);
    this._siftUp(index);
  }

  /**
   * Extracts and returns the item with the smallest priority.
   * @returns {{ key: string, priority: number, data: any } | null}
   */
  pop() {
    if (this.isEmpty()) return null;

    const minItem = this.heap[0];
    const lastItem = this.heap.pop();
    this.keyToIndex.delete(minItem.key);

    if (this.heap.length > 0 && lastItem) {
      this.heap[0] = lastItem;
      this.keyToIndex.set(lastItem.key, 0);
      this._siftDown(0);
    }

    return minItem;
  }

  /**
   * Decreases the priority of an existing key.
   * If new priority is greater than existing, it does nothing.
   * @param {string} key
   * @param {number} newPriority
   * @param {any} newData
   */
  decreaseKey(key, newPriority, newData = null) {
    const index = this.keyToIndex.get(key);
    if (index === undefined) return;

    if (newPriority >= this.heap[index].priority) return;

    this.heap[index].priority = newPriority;
    if (newData !== null) {
      this.heap[index].data = newData;
    }
    this._siftUp(index);
  }

  /**
   * Gets the current priority of a key in the queue.
   * @param {string} key
   * @returns {number | undefined}
   */
  getPriority(key) {
    const index = this.keyToIndex.get(key);
    return index !== undefined ? this.heap[index].priority : undefined;
  }

  /**
   * Internal sift-up helper to restore min-heap invariant.
   * @private
   */
  _siftUp(index) {
    let current = index;
    while (current > 0) {
      const parent = Math.floor((current - 1) / 2);
      if (this.heap[current].priority < this.heap[parent].priority) {
        this._swap(current, parent);
        current = parent;
      } else {
        break;
      }
    }
  }

  /**
   * Internal sift-down helper to restore min-heap invariant.
   * @private
   */
  _siftDown(index) {
    let current = index;
    const length = this.heap.length;

    while (true) {
      let smallest = current;
      const leftChild = 2 * current + 1;
      const rightChild = 2 * current + 2;

      if (
        leftChild < length &&
        this.heap[leftChild].priority < this.heap[smallest].priority
      ) {
        smallest = leftChild;
      }

      if (
        rightChild < length &&
        this.heap[rightChild].priority < this.heap[smallest].priority
      ) {
        smallest = rightChild;
      }

      if (smallest !== current) {
        this._swap(current, smallest);
        current = smallest;
      } else {
        break;
      }
    }
  }

  /**
   * Internal swap helper that updates key-to-index tracking.
   * @private
   */
  _swap(i, j) {
    const itemI = this.heap[i];
    const itemJ = this.heap[j];
    this.heap[i] = itemJ;
    this.heap[j] = itemI;
    this.keyToIndex.set(itemI.key, j);
    this.keyToIndex.set(itemJ.key, i);
  }
}
