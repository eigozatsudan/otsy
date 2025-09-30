// Minimal mock database layer used by admin metrics during build
export const db = {
  user: {
    async count(_: any = {}) { return 1000; },
  },
  group: {
    async count(_: any = {}) { return 200; },
    async findMany(_: any = {}) {
      return Array.from({ length: 10 }).map(() => ({ _count: { members: 5 } }));
    },
  },
  purchase: {
    async findMany(_: any = {}) { return [{ amount: 10 }, { amount: 20 }]; },
  },
  errorLog: {
    async count(_: any = {}) { return 5; },
  },
  requestLog: {
    async count(_: any = {}) { return 500; },
    async aggregate(_: any = {}) { return { _avg: { responseTime: 150 } }; },
  },
};


