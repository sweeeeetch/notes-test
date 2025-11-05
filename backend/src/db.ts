import { AppDataSource } from './data-source';
import { DataSource } from 'typeorm';

let testDataSource: DataSource | null = null;

export async function connectDB(): Promise<DataSource> {
  if (testDataSource && testDataSource.isInitialized) {
    return testDataSource;
  }

  if (AppDataSource.isInitialized) {
    return AppDataSource;
  }

  await AppDataSource.initialize();
  return AppDataSource;
}

export async function closeDB(): Promise<void> {
  if (testDataSource && testDataSource.isInitialized) {
    await testDataSource.destroy();
    testDataSource = null;
  }

  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
}

export function getDB(): DataSource {
  if (testDataSource && testDataSource.isInitialized) {
    return testDataSource;
  }

  if (!AppDataSource.isInitialized) {
    throw new Error('База данных не инициализирована. Сначала вызовите connectDB().');
  }

  return AppDataSource;
}

export function setDB(dataSource: DataSource): void {
  testDataSource = dataSource;
}

export function resetDBInstance(): void {
  testDataSource = null;
}
