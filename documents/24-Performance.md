# 24 - Performance

Performance optimization in BuildTrack focuses on reducing database load and minimizing the JavaScript payload sent to the client.

## 1. Database Optimization (Prisma)
- **Select Specific Fields**: Do not return massive nested objects unless necessary. Use Prisma's `select` object to return only what the client needs.
  ```typescript
  // Bad
  this.prisma.project.findMany({ include: { purchases: true } });
  
  // Good
  this.prisma.project.findMany({ 
    select: { id: true, name: true, budget: true } 
  });
  ```
- **Indexing**: Frequent lookup fields (like `bankLoanId` on the Repayments table) must have an index (`@@index`) in the `schema.prisma`.

## 2. Backend Caching (Redis)
- **Expensive Aggregations**: The dashboard aggregates massive amounts of financial data (e.g., total spent across all projects). Computing this on every page load is expensive.
- **Solution**: The API caches this response in Redis for 5 minutes. If a new purchase is logged, the API invalidates the specific Redis key.

## 3. Frontend Optimization (Next.js)
- **Server Components**: The default in `apps/web/src/app`. By rendering HTML on the server, we send zero JavaScript bundle to the browser for static layouts.
- **Dynamic Imports**: Large charting libraries (like those used in the Dashboard) should be lazy-loaded using `next/dynamic` so they don't block the initial page render.

## 4. Mobile Optimization (React Native)
- **FlatList**: Never use `ScrollView` for rendering long lists of tasks or logs. Always use `FlatList` with `initialNumToRender` to ensure smooth 60fps scrolling and memory management.
- **Image Compression**: Photos uploaded from the site via mobile are compressed heavily before being sent to MinIO to save bandwidth and storage space.
