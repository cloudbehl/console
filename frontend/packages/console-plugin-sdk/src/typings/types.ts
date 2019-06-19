export type LazyLoader<T> = () => Promise<React.ComponentType<T>>;
