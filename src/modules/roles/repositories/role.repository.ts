import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { Role } from '../entities/role.entity';

@Injectable()
export class RoleRepository extends BaseRepository<Role> {
  constructor(
    @InjectRepository(Role)
    private roleRepo: Repository<Role>
  ) {
    super(roleRepo);
  }

  async findByCompany(companyId: string): Promise<Role[]> {
    return await this.roleRepo.find({
      where: { company: { id: companyId } }
    });
  }

  async findByName(name: string, companyId: string): Promise<Role | null> {
    return await this.roleRepo.findOne({
      where: {
        name,
        company: { id: companyId }
      }
    });
  }

  async findWithEmployees(id: string, companyId: string): Promise<Role | null> {
    return await this.roleRepo.findOne({
      where: {
        id,
        company: { id: companyId }
      },
      relations: ['employees']
    });
  }

  async findByPermission(
    permission: string,
    companyId: string
  ): Promise<Role[]> {
    return await this.roleRepo
      .createQueryBuilder('role')
      .where('role.companyId = :companyId', { companyId })
      .andWhere(':permission = ANY(role.permissions)', { permission })
      .getMany();
  }
}
