import { buildPointCloud } from './pointcloud'

self.onmessage = (e: MessageEvent<{ target: number }>) => {
  const d = buildPointCloud(e.data.target)
  const msg = { position: d.position, cls: d.cls, order: d.order, rand: d.rand, count: d.count, minY: d.minY, maxY: d.maxY }
  ;(self as unknown as Worker).postMessage(msg, [d.position.buffer, d.cls.buffer, d.order.buffer, d.rand.buffer])
}
