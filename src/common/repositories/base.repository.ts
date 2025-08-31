import {
  Repository,
  FindOptionsWhere,
  DeepPartial,
  ObjectLiteral
} from 'typeorm';

export abstract class BaseRepository<T extends ObjectLiteral> {
  constructor(protected readonly repository: Repository<T>) {}

  async create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(data);
    return await this.repository.save(entity);
  }

  async findAll(): Promise<T[]> {
    return await this.repository.find();
  }

  async findOne(id: string): Promise<T | null> {
    return await this.repository.findOne({
      where: { id } as unknown as FindOptionsWhere<T>
    });
  }

  async findByCondition(condition: FindOptionsWhere<T>): Promise<T | null> {
    return await this.repository.findOne({ where: condition });
  }

  async findManyByCondition(condition: FindOptionsWhere<T>): Promise<T[]> {
    return await this.repository.find({ where: condition });
  }

  async update(id: string, data: DeepPartial<T>): Promise<T | null> {
    await this.repository.update(id, data as any);
    return await this.findOne(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async softDelete(id: string): Promise<boolean> {
    const result = await this.repository.update(id, { isActive: false } as any);
    return (result.affected ?? 0) > 0;
  }

  async count(condition?: FindOptionsWhere<T>): Promise<number> {
    return await this.repository.count({ where: condition });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { id } as unknown as FindOptionsWhere<T>
    });
    return count > 0;
  }

  async findWithRelations(id: string, relations: string[]): Promise<T | null> {
    return await this.repository.findOne({
      where: { id } as unknown as FindOptionsWhere<T>,
      relations
    });
  }

  async findAllWithRelations(relations: string[]): Promise<T[]> {
    return await this.repository.find({ relations });
  }

  async findAllPaginated(
    page: number = 1,
    limit: number = 10
  ): Promise<{
    data: T[];
    total: number;
    page: number;
    lastPage: number;
  }> {
    const [data, total] = await this.repository.findAndCount({
      skip: (page - 1) * limit,
      take: limit
    });

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit)
    };
  }

  getRepository(): Repository<T> {
    return this.repository;
  }
}
